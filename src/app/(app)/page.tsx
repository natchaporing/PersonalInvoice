import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/app-ui";
import { GuillocheBackground, GuillocheBand, Microprint, Rosette, SerialNumber } from "@/components/banknote";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DOC_TYPE_LABEL, isOverdue, sampleDocs, sampleStats } from "@/lib/sample-data";
import { bahtText } from "@/lib/thai/baht-text";
import { formatTHB } from "@/lib/thai/money";
import { formatDateEN } from "@/lib/thai/thai-date";

function Kpi({ label, th, value, hint, danger }: { label: string; th: string; value: number; hint: string; danger?: boolean }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <GuillocheBand tone={danger ? "red" : "cobalt"} height={8} opacity={0.55} />
      <div className="px-5 pt-4 pb-5">
        <div className="eyebrow">{label} · <span className="normal-case tracking-normal">{th}</span></div>
        <div className={`figure mt-1.5 text-[28px] leading-tight ${danger ? "text-destructive" : ""}`}>฿{formatTHB(value)}</div>
        <div className="mt-1 text-[13px] text-muted-foreground">{hint}</div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const s = sampleStats;
  const pct = Math.min(100, Math.round((s.yearRevenue / s.vatThreshold) * 100));
  return (
    <>
      <PageHeader
        eyebrow="กันยายน พ.ศ. 2569 · September 2026"
        title="Dashboard"
        subtitle="Where the money stands this month."
        actions={
          <Button asChild>
            <Link href="/documents/new"><Plus /> New document</Link>
          </Button>
        }
      />

      {/* Hero "note": the one number that matters, printed like currency. */}
      <section aria-label="Outstanding receivables" className="relative overflow-hidden rounded-lg border border-cobalt/25 bg-paper">
        <GuillocheBackground opacity={0.1} />
        <div aria-hidden className="pointer-events-none absolute inset-2 rounded-md border border-cobalt/20" />
        <Rosette size={280} opacity={0.55} className="absolute top-1/2 -right-12 hidden -translate-y-1/2 sm:block" />
        <div className="relative p-6 sm:p-8 sm:pr-72">
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="eyebrow text-cobalt">Outstanding receivables · ยอดค้างรับ</span>
              <SerialNumber value="PI2569-09" className="text-[12px]" />
            </div>
            <div className="figure mt-3 text-[52px] leading-none text-cobalt sm:text-[64px]">
              <span className="mr-1 align-top text-[0.5em]">฿</span>{formatTHB(s.outstanding)}
            </div>
            <div className="mt-3 text-[15px] text-foreground">{bahtText(s.outstanding)}</div>
            <div className="mt-1 text-[13px] text-muted-foreground">Across 3 issued documents · 1 overdue</div>
          </div>
        </div>
        <Microprint className="relative border-t border-cobalt/15 px-8 py-1" />
      </section>

      <section aria-label="Key figures" className="mt-6 grid gap-4 sm:grid-cols-3">
        <Kpi label="Overdue" th="เกินกำหนด" value={s.overdue} hint="Past due date" danger />
        <Kpi label="Revenue" th="รายได้เดือนนี้" value={s.monthRevenue} hint="This month, before VAT" />
        <Kpi label="Output VAT" th="ภาษีขาย" value={s.monthVat} hint="PP30 due 23 Oct (e-filing)" />
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>VAT threshold · เกณฑ์จดทะเบียน VAT</CardTitle>
          <CardDescription>Year-to-date revenue against ฿1.8M. You are VAT-registered, so this is informational.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="num">฿{formatTHB(s.yearRevenue)}</span>
            <span className="num text-muted-foreground">{pct}% of ฿1,800,000.00</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Share of VAT threshold reached">
            <div className="h-full rounded-full bg-cobalt" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent documents · เอกสารล่าสุด</CardTitle>
          <CardAction>
            <Button asChild variant="link" size="sm">
              <Link href="/documents">All documents <ArrowRight /></Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 sm:px-3">
          <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Issued</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total ฿</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleDocs.slice(0, 5).map((d) => (
                <TableRow key={d.id}>
                  <TableCell><SerialNumber value={d.number} className="text-[12px]" /></TableCell>
                  <TableCell>
                    {d.customer}
                    <div className="text-[12px] text-muted-foreground">{DOC_TYPE_LABEL[d.type].en}</div>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">{formatDateEN(d.issueDate)}</TableCell>
                  <TableCell><StatusBadge status={d.status} overdue={isOverdue(d)} /></TableCell>
                  <TableCell className="num text-right">{formatTHB(d.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          {/* Phones: stacked rows instead of a cramped table. */}
          <ul className="divide-y sm:hidden">
            {sampleDocs.slice(0, 5).map((d) => (
              <li key={d.id} className="px-3 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <SerialNumber value={d.number} className="text-[12px]" />
                  <span className="num">{formatTHB(d.total)}</span>
                </div>
                <div className="mt-1 truncate">{d.customer}</div>
                <div className="mt-1 flex items-center justify-between gap-3 text-[12px] text-muted-foreground">
                  <span>{DOC_TYPE_LABEL[d.type].en} · {formatDateEN(d.issueDate)}</span>
                  <StatusBadge status={d.status} overdue={isOverdue(d)} />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
