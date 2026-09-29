"use client";

import { useState } from "react";

/** Hashes a PDF in the browser (nothing is uploaded) and compares it with the recorded hash. */
export function HashCheck({ expected }: { expected: string }) {
  const [result, setResult] = useState<"match" | "mismatch" | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    setResult(hex === expected ? "match" : "mismatch");
    setBusy(false);
  };

  return (
    <div className="mt-6 rounded-md border border-dashed border-cobalt/40 bg-card/70 p-4">
      <label htmlFor="pdf" className="text-sm font-medium">Check a PDF you received · ตรวจสอบไฟล์ PDF</label>
      <p className="text-[12px] text-muted-foreground">The file is checked on your device and never uploaded.</p>
      <input id="pdf" type="file" accept="application/pdf" className="mt-2 block text-sm" onChange={(e) => check(e.target.files?.[0])} />
      <p role="status" className="mt-2 text-sm">
        {busy && "Checking…"}
        {!busy && result === "match" && <span className="font-semibold text-ok">✓ Identical to the original issued document.</span>}
        {!busy && result === "mismatch" && <span className="font-semibold text-destructive">✗ This file differs from the original. It may have been altered.</span>}
      </p>
    </div>
  );
}
