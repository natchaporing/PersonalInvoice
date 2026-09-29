import { Download } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/app-ui";
import { SerialNumber } from "@/components/banknote";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DOC_TYPE_LABEL } from "@/lib/domain/documents";
import { pp30Deadlines, salesTaxReport, vatSummary } from "@/lib/domain/reports";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";
import { formatDateEN } from "@/lib/thai/thai-date";
import { monthParam, taxDocsForMonth } from "./data";

const shift = (month: string, by: number) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
};
const monthLabel = (month: string) => formatDateEN(`${month}-01`).replace(/^1 /, "");

export default async function Tax({ searchParams }: PageProps<"/tax">) {
  const { supabase } = await requireUser();
  const month = monthParam((await searchParams).month);
  const docs = await taxDocsForMonth(supabase, month);
  const rows = salesTaxReport(docs, month);
  const sum = vatSummary(docs, () => true);
  const deadline = pp30Deadlines(month);

  return (
    <>
      <PageHeader
        eyebrow="ภาษี"
        title="Tax & VAT"
        subtitle="Output VAT for your monthly PP30 return and the sales tax report."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link href={`/tax?month=${shift(month, -1)}`} aria-label="Previous month">←</Link></Button>
            <span className="min-w-36 text-center font-medium">{monthLabel(month)}</span>
            <Button asChild variant="outline" size="sm"><Link href={`/tax?month=${shift(month, 1)}`} aria-label="Next month">→</Link></Button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent>
          <div className="eyebrow">Sales before VAT · มูลค่าขาย</div>
          <div className="figure mt-1 text-[28px]">฿{formatTHB(sum.sales)}</div>
        </CardContent></Card>
        <Card><CardContent>
          <div className="eyebrow">Output VAT · ภาษีขาย</div>
          <div className="figure mt-1 text-[28px] text-cobalt">฿{formatTHB(sum.vat)}</div>
        </CardContent></Card>
        <Card><CardContent>
          <div className="eyebrow">PP30 due · กำหนดยื่น ภ.พ.30</div>
          <div className="mt-2 text-sm">{formatDateEN(deadline.efiling)} <span className="text-muted-foreground">(e-filing)</span></div>
          <div className="text-sm">{formatDateEN(deadline.paper)} <span className="text-muted-foreground">(paper)</span></div>
        </CardContent></Card>
      </section>
      <p className="mt-3 text-[13px] text-muted-foreground">
        Input VAT from your purchases is not tracked here; your PP30 is output VAT minus input VAT. File even when nothing is due.
      </p>

      <Card className="mt-6 py-2">
        <CardHeader className="pt-3">
          <CardTitle>Sales tax report · รายงานภาษีขาย</CardTitle>
          <CardDescription>{rows.length} tax document{rows.length === 1 ? "" : "s"} in {monthLabel(month)}. Credit notes are negative.</CardDescription>
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            <Button asChild variant="outline" size="sm"><a href={`/tax/export?month=${month}`}><Download /> CSV</a></Button>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-3">
          {rows.length === 0 ? (
            <EmptyState title="No tax documents this month" />
          ) : (
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>No.</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Tax ID</TableHead>
                  <TableHead className="text-right">Value ฿</TableHead>
                  <TableHead className="text-right">VAT ฿</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.number}>
                    <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                    <TableCell><SerialNumber value={r.number} className="text-[12px]" /><div className="text-[12px] text-muted-foreground">{DOC_TYPE_LABEL[r.type].en}</div></TableCell>
                    <TableCell>{r.buyerName}</TableCell>
                    <TableCell className="num text-[12px]">{r.buyerTaxId}{r.buyerBranch && r.buyerBranch !== "00000" ? ` · ${r.buyerBranch}` : ""}</TableCell>
                    <TableCell className="num text-right">{formatTHB(r.taxable)}</TableCell>
                    <TableCell className="num text-right">{formatTHB(r.vat)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-medium">Total</TableCell>
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
