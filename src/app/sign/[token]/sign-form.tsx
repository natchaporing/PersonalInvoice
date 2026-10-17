"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import { SignatureDialog } from "@/components/signature-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { signContract } from "../actions";

export function SignForm({ token, hash, defaultName }: { token: string; hash: string; defaultName: string }) {
  const t = useMessages().contracts;
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [png, setPng] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const ready = name.trim().length >= 2 && !!png && agreed;

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="signer">{t.yourName}</Label>
        <Input id="signer" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-20 w-64 items-center justify-center rounded-md border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- the drawn signature, a data URL */}
          {png ? <img src={png} alt="" className="max-h-16 max-w-full object-contain" /> : <span className="text-[12px] text-muted-foreground">—</span>}
        </div>
        <Button type="button" variant="outline" onClick={() => setDrawing(true)}>{png ? t.redraw : t.drawSignature}</Button>
      </div>
      {drawing && <SignatureDialog title={t.drawSignature} onConfirm={setPng} onClose={() => setDrawing(false)} />}
      <Label className="font-normal">
        <input type="checkbox" className="size-4 accent-[var(--cobalt)]" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        {t.agree}
      </Label>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={pending || !ready}
          onClick={() =>
            start(async () => {
              const r = await signContract(token, name, png ?? "", hash);
              setState(r);
              if (!r.error) router.refresh();
            })
          }
        >
          {pending ? t.signing : t.signButton}
        </Button>
        {!ready && <span className="text-[13px] text-muted-foreground">{t.needAll}</span>}
      </div>
      <FormMessage state={state} />
    </div>
  );
}
