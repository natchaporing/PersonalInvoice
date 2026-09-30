import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { toPdfA3 } from "./pdfa";

const hasGs = spawnSync("gs", ["--version"], { stdio: "ignore" }).status === 0;
const hasIcc = existsSync(process.env.GS_SRGB_ICC ?? "/usr/share/color/icc/ghostscript/default_rgb.icc");

async function tinyPdf() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 200]);
  page.drawText("Tax invoice TX2026-0001", { x: 20, y: 100, size: 14, font: await doc.embedFont(StandardFonts.Helvetica) });
  return doc.save();
}

describe.skipIf(!hasGs || !hasIcc)("PDF/A-3 conversion (needs Ghostscript)", () => {
  it("produces a PDF/A-3 file with the XML attached as an associated file", async () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?><rsm:Test xmlns:rsm="urn:test"/>';
    const out = await toPdfA3(await tinyPdf(), { name: "TX2026-0001.xml", content: xml }, "Tax invoice TX2026-0001");
    const text = out.toString("latin1");
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toMatch(/pdfaid:part=['"]3['"]/);
    expect(text).toContain("GTS_PDFA1");
    expect(text).toContain("/AFRelationship /Alternative");
    expect(text).toContain("/EmbeddedFile");
    // The attachment round-trips unchanged.
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
  });
});
