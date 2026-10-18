"use client";

import { useRouter } from "next/navigation";
import { NativeSelect } from "@/components/ui/input";
import { useMessages } from "@/lib/i18n/client";

/** Narrows the commission list to one payee (?payee=…). */
export function PayeeFilter({ payees, value }: { payees: { id: string; name: string }[]; value: string }) {
  const router = useRouter();
  const t = useMessages().payees;
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t.filterPayee}</span>
      <NativeSelect aria-label={t.filterPayee} value={value} className="w-auto"
        onChange={(e) => router.push(e.target.value ? `/payees/commissions?payee=${e.target.value}` : "/payees/commissions")}>
        <option value="">{t.allPayees}</option>
        {payees.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </NativeSelect>
    </label>
  );
}
