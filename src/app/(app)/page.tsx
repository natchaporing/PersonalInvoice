import Link from "next/link";
import { PageHeader, SectionHeading, StatusBadge } from "@/components/ui";
import { DOC_TYPE_LABEL, isOverdue, sampleDocs, sampleStats } from "@/lib/sample-data";
import { formatTHB } from "@/lib/thai/money";
import { formatDateEN } from "@/lib/thai/thai-date";

function Figure({ label, value, hint, danger }: { label: string; value: string; hint: string; danger?: boolean }) {
  return (
    <div className="kpi px-5 first:pl-0 last:pr-0">
      <div className="eyebrow">{label}</div>
      <div className={`figure mt-1 text-[30px] leading-tight ${danger ? "text-danger" : ""}`}>฿{value}</div>
      <div className="mt-0.5 text-[13px] text-muted">{hint}</div>
    </div>
  );
}

export default function Dashboard() {
  const s = sampleStats;
  const pct = Math.min(100, Math.round((s.yearRevenue / s.vatThreshold) * 100));
  return (
    <>
      <PageHeader
        eyebrow="กันยายน 2569 · September 2026"
        title="Dashboard"
        subtitle="Where the money stands this month."
        actions={<Link href="/documents/new" className="btn btn-primary">New document</Link>}
      />

      {/* Key figures: one ledger strip, separated by hairlines. Amber rule is the single accent. */}
      <section aria-label="Key figures" className="kpis border-t-[3px] border-secondary pt-4">
        <div className="kpi-grid grid grid-cols-2 gap-y-6 md:grid-cols-4 md:divide-x md:divide-border">
          <Figure label="Outstanding" value={formatTHB(s.outstanding)} hint="Issued, not yet paid" />
          <Figure label="Overdue" value={formatTHB(s.overdue)} hint="Past due date" danger />
          <Figure label="Revenue · month" value={formatTHB(s.monthRevenue)} hint="Before VAT" />
          <Figure label="Output VAT · month" value={formatTHB(s.monthVat)} hint="PP30 due 23 Oct (e-filing)" />
        </div>
      </section>

      <section aria-label="VAT registration threshold" className="mt-10 max-w-[720px]">
        <div className="flex items-baseline justify-between gap-4">
          <div className="eyebrow">Year to date vs ฿1.8M VAT threshold</div>
          <div className="num text-[13px]">฿{formatTHB(s.yearRevenue)} · {pct}%</div>
        </div>
        <div className="mt-2 h-[3px] bg-border" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Share of VAT threshold reached">
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-[13px] text-muted">You are VAT-registered, so this is informational.</p>
      </section>

      <section aria-label="Recent documents" className="mt-12">
        <SectionHeading aside={<Link href="/documents" className="text-accent underline-offset-4 hover:underline">All documents →</Link>}>Recent documents</SectionHeading>
        <table className="w-full text-left">
          <thead className="border-b border-fg text-left">
            <tr className="eyebrow">
              <th className="py-2 pr-4 font-medium">No.</th>
              <th className="py-2 pr-4 font-medium">Customer</th>
              <th className="hidden py-2 pr-4 font-medium sm:table-cell">Issued</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 text-right font-medium">Total ฿</th>
            </tr>
          </thead>
          <tbody>
            {sampleDocs.slice(0, 5).map((d) => (
              <tr key={d.id} className="border-b border-border align-baseline">
                <td className="num whitespace-nowrap py-3 pr-4 text-[13px]">{d.number}</td>
                <td className="py-3 pr-4">
                  {d.customer}
                  <div className="text-[12px] text-muted">{DOC_TYPE_LABEL[d.type].en}</div>
                </td>
                <td className="hidden whitespace-nowrap py-3 pr-4 text-muted sm:table-cell">{formatDateEN(d.issueDate)}</td>
                <td className="py-3 pr-4"><StatusBadge status={d.status} overdue={isOverdue(d)} /></td>
                <td className="num py-3 text-right">{formatTHB(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
