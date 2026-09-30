import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";
import { PayeeForm } from "../payee-form";

export default async function EditPayee({ params }: PageProps<"/payees/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [{ data: payee }, { data: rows }] = await Promise.all([
    supabase.from("commission_payees").select("*").eq("id", id).maybeSingle(),
    supabase.from("commissions").select("id, amount, wht, paid_on, paid_reference, quotation_id, created_at").eq("payee_id", id).order("created_at", { ascending: false }),
  ]);
  if (!payee) notFound();
  const qIds = [...new Set((rows ?? []).map((r) => r.quotation_id))];
  const { data: quotes } = qIds.length ? await supabase.from("documents").select("id, number").in("id", qIds) : { data: [] };
  const owed = (rows ?? []).filter((r) => !r.paid_on).reduce((s, r) => s + r.amount - r.wht, 0);
  return (
    <>
      <PageHeader eyebrow="ผู้รับค่านายหน้า" title={payee.name} subtitle={owed > 0 ? `฿${formatTHB(owed)} still to transfer` : undefined} />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,48rem)_minmax(0,1fr)]">
        <PayeeForm payee={payee} />
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Commissions · ประวัติ</CardTitle>
            <CardDescription>Recorded on quotations for this payee.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            {!rows?.length ? (
              <p className="text-muted-foreground">None yet. Record one from a quotation&apos;s Commission panel.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2">
                    <Link href={`/documents/${r.quotation_id}`} className="text-cobalt underline">{quotes?.find((q) => q.id === r.quotation_id)?.number ?? "Quotation"}</Link>
                    <span className={r.paid_on ? "text-ok" : "text-muted-foreground"}>{r.paid_on ? `Transferred ${r.paid_on}` : "To transfer"}</span>
                    <span className="num font-medium">฿{formatTHB(r.amount - r.wht)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
