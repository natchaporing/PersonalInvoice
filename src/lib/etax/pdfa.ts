import { execFile } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { AFRelationship, PDFDocument } from "pdf-lib";
import { PDFA_PREFIX } from "./pdfa-prefix";

const run = promisify(execFile);

/** sRGB profile that ships with Ghostscript (apt package ghostscript / libgs-common). */
const ICC_PATH = process.env.GS_SRGB_ICC ?? "/usr/share/color/icc/ghostscript/default_rgb.icc";

const pdfString = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`).replace(/[^\x20-\x7e]/g, "?");

/**
 * Turns a PDF into PDF/A-3B with Ghostscript, then attaches the e-Tax XML as an associated file
 * (AFRelationship: Alternative), as the Revenue Department's PDF/A-3 flow expects. The output was checked with
 * veraPDF (profile PDF/A-3B), also after signing.
 *
 * Ghostscript runs unrestricted (-dNOSAFER) because its PDF/A prefix file has to read the colour profile. The input
 * is the PDF our own headless browser just rendered from our own data, never an uploaded file.
 */
export async function toPdfA3(pdf: Uint8Array, xml: { name: string; content: string }, title: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "pdfa-"));
  try {
    const icc = join(dir, "srgb.icc");
    await copyFile(ICC_PATH, icc);
    await writeFile(join(dir, "in.pdf"), pdf);
    await writeFile(join(dir, "PDFA_def.ps"), PDFA_PREFIX.replaceAll("__TITLE__", pdfString(title)).replaceAll("__ICC__", pdfString(icc)));

    await run(
      "gs",
      [
        "-q", "-dNOSAFER", "-dPDFA=3", "-dBATCH", "-dNOPAUSE", "-dNOOUTERSAVE", "-dPDFACompatibilityPolicy=1",
        "-sColorConversionStrategy=RGB", "-sProcessColorModel=DeviceRGB", "-sDEVICE=pdfwrite",
        "-dEmbedAllFonts=true", "-dSubsetFonts=true",
        `-sOutputFile=${join(dir, "out.pdf")}`, join(dir, "PDFA_def.ps"), join(dir, "in.pdf"),
      ],
      { timeout: 90_000, maxBuffer: 10 * 1024 * 1024 },
    );

    const doc = await PDFDocument.load(await readFile(join(dir, "out.pdf")), { updateMetadata: false });
    const now = new Date();
    await doc.attach(Buffer.from(xml.content, "utf8"), xml.name, {
      mimeType: "text/xml",
      description: "e-Tax invoice data (ETDA ขมธอ. 3-2560 v2.0)",
      creationDate: now,
      modificationDate: now,
      afRelationship: AFRelationship.Alternative,
    });
    return Buffer.from(await doc.save({ useObjectStreams: false }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
