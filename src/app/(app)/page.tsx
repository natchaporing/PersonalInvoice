import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/app-ui";
import { GuillocheBackground, GuillocheBand, Microprint, Rosette, SerialNumber } from "@/components/banknote";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isOverdue, todayBangkok } from "@/lib/domain/documents";
import { monthOf, pp30Deadlines, receivables, vatSummary } from "@/lib/domain/reports";
import { VAT_REGISTRATION_THRESHOLD } from "@/lib/domain/tax";
import { requireUser } from "@/lib/supabase/server";
import { bahtText } from "@/lib/thai/baht-text";
import { formatTHB } from "@/lib/thai/money";
import { docTypeLabel, formatDate } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { formatDateEN, formatDateTH } from "@/lib/thai/thai-date";

function Kpi({ label, value, hint, danger }: { label: string; value: number; hint: string; danger?: boolean }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <GuillocheBand tone={danger ? "red" : "brand"} height={8} opacity={0.55} />
      <div className="px-5 pt-4 pb-5">
        <div className="eyebrow">{label}</div>
        <div className={`figure mt-1.5 text-[28px] leading-tight ${danger && value > 0 ? "text-destructive" : ""}`}>฿{formatTHB(value)}</div>
        <div className="mt-1 text-[13px] text-muted-foreground">{hint}</div>
      </div>
    </Card>
  );
}

export default async function Dashboard() {
  const { supabase } = await requireUser();
  const [m, locale] = await Promise.all([getMessages(), getLocale()]);
  const t = m.dashboard;
  const today = todayBangkok();
  const month = monthOf(today);
  const year = today.slice(0, 4);

  const [{ data: docs }, { data: payments }, { data: recent }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, doc_type, status, number, issue_date, due_date, taxable, vat, total, net_receivable")
      .neq("status", "draft")
      .gte("issue_date", `${Number(year) - 1}-01-01`)
      .limit(5000),
    supabase.from("payments").select("document_id, amount").limit(10000),
    supabase
      .from("documents")
      .select("id, number, doc_type, status, issue_date, due_date, total, customer_snapshot, customers(name_th)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const all = docs ?? [];
  const paidByDoc = new Map<string, number>();
  for (const p of payments ?? []) paidByDoc.set(p.document_id, (paidByDoc.get(p.document_id) ?? 0) + p.amount);

  const r = receivables(all, paidByDoc, today);
  const thisMonth = vatSummary(all, (d) => monthOf(d.issue_date) === month);
  const ytd = vatSummary(all, (d) => d.issue_date.startsWith(year));
  const pct = Math.min(100, Math.round((Math.max(0, ytd.sales) / VAT_REGISTRATION_THRESHOLD) * 100));
  const deadline = pp30Deadlines(month);

  return (
    <>
      <PageHeader
        eyebrow={(locale === "th" ? formatDateTH(today) : formatDateEN(today)).replace(/^\d+ /, "")}
        title={t.title}
        subtitle={t.subtitle}
        actions={<Button asChild><Link href="/documents/new"><Plus /> {t.newDocument}</Link></Button>}
      />

      <section aria-label={t.receivables} className="relative overflow-hidden rounded-lg border border-cobalt/25 bg-paper">
        <GuillocheBackground opacity={0.1} />
        <div aria-hidden className="pointer-events-none absolute inset-2 rounded-md border border-cobalt/20" />
        <Rosette size={280} opacity={0.55} className="absolute top-1/2 -right-12 hidden -translate-y-1/2 sm:block" />
        <div className="relative p-6 sm:p-8 sm:pr-72">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="eyebrow text-cobalt">{t.receivables}</span>
            <SerialNumber value={`PI${Number(year) + 543}-${month.slice(5)}`} className="text-[12px]" />
          </div>
          <div className="figure mt-3 text-[52px] leading-none text-cobalt sm:text-[64px]">
            <span className="mr-1 align-top text-[0.5em]">฿</span>{formatTHB(r.outstanding)}
          </div>
          <div className="mt-3 text-[15px] text-foreground">{bahtText(r.outstanding)}</div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            {r.openCount === 0 ? t.nothingOutstanding : t.across(r.openCount, r.overdueCount)}
          </div>
        </div>
        <Microprint className="relative border-t border-cobalt/15 px-8 py-1" />
      </section>

      <section aria-label={t.keyFigures} className="mt-6 grid gap-4 sm:grid-cols-3">
        <Kpi label={t.overdue} value={r.overdue} hint={t.overdueHint(r.overdueCount)} danger />
        <Kpi label={t.revenue} value={thisMonth.sales} hint={t.revenueHint} />
        <Kpi label={t.outputVat} value={thisMonth.vat} hint={t.pp30Due(formatDate(deadline.efiling, locale))} />
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t.threshold}</CardTitle>
          <CardDescription>{t.thresholdNote}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="num">฿{formatTHB(ytd.sales)}</span>
            <span className="num text-muted-foreground">{t.thresholdOf(pct, formatTHB(VAT_REGISTRATION_THRESHOLD))}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t.thresholdAria}>
            <div className="h-full rounded-full bg-cobalt" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t.recent}</CardTitle>
          <CardAction>
            <Button asChild variant="link" size="sm"><Link href="/documents">{t.allDocuments} <ArrowRight /></Link></Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 sm:px-3">
          {!recent?.length ? (
            <p className="px-3 pb-2 text-muted-foreground">{t.noDocuments} <Link href="/documents/new" className="text-cobalt underline">{t.createFirst}</Link></p>
          ) : (
            <>
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t.colNo}</TableHead>
                      <TableHead>{t.colCustomer}</TableHead>
                      <TableHead>{t.colIssued}</TableHead>
                      <TableHead>{t.colStatus}</TableHead>
                      <TableHead className="text-right">{t.colTotal}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <Link href={`/documents/${d.id}`} className="hover:underline">
                            {d.number ? <SerialNumber value={d.number} className="text-[12px]" /> : <span className="text-muted-foreground">{m.common.draft}</span>}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {(d.customer_snapshot as { name_th?: string } | null)?.name_th ?? d.customers?.name_th ?? "—"}
                          <div className="text-[12px] text-muted-foreground">{docTypeLabel(d.doc_type, locale)}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(d.issue_date, locale)}</TableCell>
                        <TableCell><StatusBadge status={d.status} overdue={isOverdue(d, today)} /></TableCell>
                        <TableCell className="num text-right">{formatTHB(d.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ul className="divide-y sm:hidden">
                {recent.map((d) => (
                  <li key={d.id} className="px-3 py-3">
                    <Link href={`/documents/${d.id}`} className="block">
                      <div className="flex items-baseline justify-between gap-3">
                        {d.number ? <SerialNumber value={d.number} className="text-[12px]" /> : <span className="text-muted-foreground">{m.common.draft}</span>}
                        <span className="num">{formatTHB(d.total)}</span>
                      </div>
                      <div className="mt-1 truncate">{(d.customer_snapshot as { name_th?: string } | null)?.name_th ?? d.customers?.name_th ?? "—"}</div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
                        <span>{docTypeLabel(d.doc_type, locale)} · {formatDate(d.issue_date, locale)}</span>
                        <StatusBadge status={d.status} overdue={isOverdue(d, today)} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
