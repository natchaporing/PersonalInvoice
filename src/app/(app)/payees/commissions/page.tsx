import Link from "next/link";
import { PageHeader } from "@/components/app-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { todayBangkok } from "@/lib/domain/documents";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";
import { PayeeFilter } from "../payee-filter";
import { PayeesTabs } from "../payees-tabs";
import { UndoPaid } from "../undo-paid";
import { unpaidCommissions } from "../unpaid";
import { UnpaidList } from "../unpaid-list";

/** Commissions marked "paid in cash" carry this reference, in the language it was recorded in. */
const CASH = ["Cash", "เงินสด"];

export default async function Commissions({ searchParams }: PageProps<"/payees/commissions">) {
  const { supabase } = await requireUser();
  const sp = await searchParams;
  const payeeId = typeof sp.payee === "string" && /^[0-9a-f-]{36}$/.test(sp.payee) ? sp.payee : "";
  let paidQuery = supabase.from("commissions").select("id, payee_id, payee_name, amount, wht, paid_on, paid_reference, quotation_id").not("paid_on", "is", null);
  if (payeeId) paidQuery = paidQuery.eq("payee_id", payeeId);
  const [{ data: payees }, unpaid, { data: paid }] = await Promise.all([
    supabase.from("commission_payees").select("id, name").order("name"),
    unpaidCommissions(supabase, payeeId || undefined),
    paidQuery.order("paid_on", { ascending: false }).limit(100),
  ]);
  const qIds = [...new Set((paid ?? []).map((r) => r.quotation_id))];
  const { data: quotes } = qIds.length ? await supabase.from("documents").select("id, number, status").in("id", qIds) : { data: [] };
  const t = (await getMessages()).payees;

  return (
    <>
      <PageHeader title={t.title} subtitle={t.commissionsSubtitle} />
      <PayeesTabs />
      <div className="grid gap-6">
        {!!payees?.length && <PayeeFilter payees={payees} value={payeeId} />}
        <UnpaidList rows={unpaid} today={todayBangkok()} showPayee={!payeeId} />
        <Card>
          <CardHeader>
            <CardTitle>{t.paidTitle}</CardTitle>
            <CardDescription>{paid?.length ? t.paidNote : t.paidNone}</CardDescription>
          </CardHeader>
          {!!paid?.length && (
            <CardContent className="text-sm">
              <ul className="divide-y rounded-md border">
                {paid.map((r) => {
                  const quote = quotes?.find((q) => q.id === r.quotation_id);
                  const number = quote?.number ?? t.quotation;
                  const net = r.amount - r.wht;
                  return (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <span className="flex flex-wrap items-baseline gap-x-3">
                        <Link href={`/documents/${r.quotation_id}`} className="num text-cobalt hover:underline">{number}</Link>
                        {quote?.status === "void" && <span className="text-[12px] text-destructive">{t.quotationCancelled}</span>}
                        {!payeeId && (r.payee_id ? <Link href={`/payees/${r.payee_id}`} className="hover:underline">{r.payee_name}</Link> : <span>{r.payee_name}</span>)}
                      </span>
                      <span className="text-ok">
                        {CASH.includes(r.paid_reference ?? "") ? t.paidCashOn(r.paid_on!) : t.transferredOn(r.paid_on!)}
                        {r.paid_reference && !CASH.includes(r.paid_reference) && ` · ${r.paid_reference}`}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="num font-medium">฿{formatTHB(net)}</span>
                        <UndoPaid id={r.id} label={`${number} ฿${formatTHB(net)}`} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
