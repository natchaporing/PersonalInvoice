"use client";

import { AlertTriangle, CheckCircle2, Download } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FormState } from "@/lib/domain/forms";
import { generateEtax } from "../actions";

export function EtaxPanel({
  id,
  problems,
  status,
  testCert,
  generatedAt,
  xmlUrl,
  pdfUrl,
  error,
}: {
  id: string;
  /** What is still missing before the package can be built. Empty when ready. */
  problems: string[];
  status: string;
  testCert: boolean | null;
  generatedAt: string | null;
  xmlUrl: string | null;
  pdfUrl: string | null;
  error: string | null;
}) {
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const done = status === "generated";

  return (
    <Card>
      <CardHeader>
        <CardTitle>e-Tax invoice · อีเมลใบกำกับภาษีอิเล็กทรอนิกส์</CardTitle>
        <CardDescription>
          A machine-readable copy for the Revenue Department&apos;s e-Tax system: the ETDA standard XML inside a signed PDF/A-3. Sending it by email for the ETDA time stamp is not built yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {problems.length > 0 && (
          <div role="status" className="rounded-md border border-amber bg-amber/10 px-3 py-2">
            <div className="mb-1 flex items-center gap-2 font-medium"><AlertTriangle className="size-4" aria-hidden /> Before you can generate it</div>
            <ul className="list-disc space-y-0.5 pl-5">
              {problems.map((p) => (<li key={p}>{p}</li>))}
            </ul>
            <p className="mt-1 text-[13px]"><Link href="/settings" className="text-cobalt underline">Settings</Link> · <Link href="/customers" className="text-cobalt underline">Customers</Link></p>
          </div>
        )}

        {done && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5 text-ok"><CheckCircle2 className="size-4" aria-hidden /> Generated {generatedAt ? new Date(generatedAt).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" }) : ""}</span>
            {xmlUrl && <Button asChild variant="outline" size="sm"><a href={xmlUrl}><Download /> XML</a></Button>}
            {pdfUrl && <Button asChild variant="outline" size="sm"><a href={pdfUrl}><Download /> PDF/A-3</a></Button>}
          </div>
        )}
        {done && testCert && (
          <p className="text-[13px] text-destructive">Signed with the test certificate, not a CA-issued one. Not valid for the Revenue Department yet.</p>
        )}
        {error && !done && <p className="text-[13px] text-destructive">Last attempt failed: {error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant={done ? "outline" : "default"}
            disabled={pending || problems.length > 0}
            onClick={() => {
              setState({});
              start(async () => setState(await generateEtax(id)));
            }}
          >
            {pending ? "Generating…" : done ? "Generate again" : "Generate e-Tax package"}
          </Button>
          <FormMessage state={state} />
        </div>
      </CardContent>
    </Card>
  );
}
