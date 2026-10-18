import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";
import { PayeeForm } from "../payee-form";
import { todayBangkok } from "@/lib/domain/documents";
import { unpaidCommissions } from "../unpaid";
import { UnpaidList } from "../unpaid-list";
import { CommissionActions } from "./commission-actions";

/** Commissions marked "paid in cash" carry this reference, in the language it was recorded in. */
const CASH = ["Cash", "เงินสด"];

export default async function EditPayee({ params }: PageProps<"/payees/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [{ data: payee }, { data: rows }, unpaid] = await Promise.all([
    supabase.from("commission_payees").select("*").eq("id", id).maybeSingle(),
    supabase.from("commissions").select("id, amount, wht, paid_on, paid_reference, quotation_id, created_at").eq("payee_id", id).order("created_at", { ascending: false }),
    unpaidCommissions(supabase, id),
  ]);
  if (!payee) notFound();
  const qIds = [...new Set((rows ?? []).map((r) => r.quotation_id))];
  const { data: quotes } = qIds.length ? await supabase.from("documents").select("id, number").in("id", qIds) : { data: [] };
  const t = (await getMessages()).payees;
  const owed = (rows ?? []).filter((r) => !r.paid_on).reduce((s, r) => s + r.amount - r.wht, 0);
  return (
    <>
      <PageHeader title={payee.name} subtitle={owed > 0 ? t.stillToTransfer(formatTHB(owed)) : undefined} />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,48rem)_minmax(0,1fr)]">
        <PayeeForm payee={payee} />
        <div className="grid gap-6 self-start">
        <UnpaidList rows={unpaid} today={todayBangkok()} showPayee={false} />
        <Card>
          <CardHeader>
            <CardTitle>{t.history}</CardTitle>
            <CardDescription>{t.historyNote}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            {!rows?.length ? (
              <p className="text-muted-foreground">{t.historyEmpty}</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {rows.map((r) => {
                  const number = quotes?.find((q) => q.id === r.quotation_id)?.number ?? t.quotation;
                  return (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <Link href={`/documents/${r.quotation_id}`} className="text-cobalt underline">{number}</Link>
                      <span className={r.paid_on ? "text-ok" : "text-muted-foreground"}>
                        {!r.paid_on ? t.toTransfer : CASH.includes(r.paid_reference ?? "") ? t.paidCashOn(r.paid_on) : t.transferredOn(r.paid_on)}
                        {r.paid_on && r.paid_reference && !CASH.includes(r.paid_reference) && ` · ${r.paid_reference}`}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="num font-medium">฿{formatTHB(r.amount - r.wht)}</span>
                        {r.paid_on && <CommissionActions id={r.id} label={`${number} ฿${formatTHB(r.amount - r.wht)}`} />}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  );
}
