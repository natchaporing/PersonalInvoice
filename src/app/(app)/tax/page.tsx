import { Download } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/app-ui";
import { SerialNumber } from "@/components/banknote";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pp30Deadlines, salesTaxReport, vatSummary } from "@/lib/domain/reports";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";
import type { Locale } from "@/lib/i18n/config";
import { docTypeLabel, formatDate } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { monthParam, taxDocsForMonth } from "./data";

const shift = (month: string, by: number) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
};
const monthLabel = (month: string, locale: Locale) => formatDate(`${month}-01`, locale).replace(/^1 /, "");

export default async function Tax({ searchParams }: PageProps<"/tax">) {
  const { supabase } = await requireUser();
  const month = monthParam((await searchParams).month);
  const docs = await taxDocsForMonth(supabase, month);
  const rows = salesTaxReport(docs, month);
  const sum = vatSummary(docs, () => true);
  const deadline = pp30Deadlines(month);
  const [m, locale] = await Promise.all([getMessages(), getLocale()]);
  const t = m.tax;

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link href={`/tax?month=${shift(month, -1)}`} aria-label={t.prevMonth}>←</Link></Button>
            <span className="min-w-36 text-center font-medium">{monthLabel(month, locale)}</span>
            <Button asChild variant="outline" size="sm"><Link href={`/tax?month=${shift(month, 1)}`} aria-label={t.nextMonth}>→</Link></Button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent>
          <div className="eyebrow">{t.sales}</div>
          <div className="figure mt-1 text-[28px]">฿{formatTHB(sum.sales)}</div>
        </CardContent></Card>
        <Card><CardContent>
          <div className="eyebrow">{t.outputVat}</div>
          <div className="figure mt-1 text-[28px] text-cobalt">฿{formatTHB(sum.vat)}</div>
        </CardContent></Card>
        <Card><CardContent>
          <div className="eyebrow">{t.pp30Due}</div>
          <div className="mt-2 text-sm">{formatDate(deadline.efiling, locale)} <span className="text-muted-foreground">{t.efiling}</span></div>
          <div className="text-sm">{formatDate(deadline.paper, locale)} <span className="text-muted-foreground">{t.paper}</span></div>
        </CardContent></Card>
      </section>
      <p className="mt-3 text-[13px] text-muted-foreground">
        {t.inputNote}
      </p>

      <Card className="mt-6 py-2">
        <CardHeader className="pt-3">
          <CardTitle>{t.report}</CardTitle>
          <CardDescription>{t.reportCount(rows.length, monthLabel(month, locale))}</CardDescription>
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            <Button asChild variant="outline" size="sm"><a href={`/tax/export?month=${month}`}><Download /> CSV</a></Button>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-3">
          {rows.length === 0 ? (
            <EmptyState title={t.empty} />
          ) : (
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t.colDate}</TableHead>
                  <TableHead>{t.colNo}</TableHead>
                  <TableHead>{t.colBuyer}</TableHead>
                  <TableHead>{t.colTaxId}</TableHead>
                  <TableHead className="text-right">{t.colValue}</TableHead>
                  <TableHead className="text-right">{t.colVat}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.number}>
                    <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                    <TableCell><SerialNumber value={r.number} className="text-[12px]" /><div className="text-[12px] text-muted-foreground">{docTypeLabel(r.type, locale)}</div></TableCell>
                    <TableCell>{r.buyerName}</TableCell>
                    <TableCell className="num text-[12px]">{r.buyerTaxId}{r.buyerBranch && r.buyerBranch !== "00000" ? ` · ${r.buyerBranch}` : ""}</TableCell>
                    <TableCell className="num text-right">{formatTHB(r.taxable)}</TableCell>
                    <TableCell className="num text-right">{formatTHB(r.vat)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-medium">{t.total}</TableCell>
                  <TableCell className="num text-right font-semibold">{formatTHB(sum.sales)}</TableCell>
                  <TableCell className="num text-right font-semibold">{formatTHB(sum.vat)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
