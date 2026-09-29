import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/ui";
import { DOC_TYPE_LABEL, isOverdue, sampleDocs, sampleStats } from "@/lib/sample-data";
import { formatTHB } from "@/lib/thai/money";
import { formatDateEN } from "@/lib/thai/thai-date";

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "danger" }) {
  return (
    <div className="card border-t-4 border-t-secondary p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`num mt-1 text-2xl font-semibold ${tone === "danger" ? "text-danger" : ""}`}>฿{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export default function Dashboard() {
  const s = sampleStats;
  const pct = Math.min(100, Math.round((s.yearRevenue / s.vatThreshold) * 100));
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="September 2026 · พ.ศ. 2569"
        actions={<Link href="/documents/new" className="btn btn-primary">New document</Link>}
      />

      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Outstanding" value={formatTHB(s.outstanding)} hint="Issued, not yet paid" />
        <Stat label="Overdue" value={formatTHB(s.overdue)} hint="Past due date" tone="danger" />
        <Stat label="Revenue this month" value={formatTHB(s.monthRevenue)} hint="Before VAT" />
        <Stat label="Output VAT this month" value={formatTHB(s.monthVat)} hint="For PP30, due 23 Oct (e-filing)" />
      </section>

      <section aria-label="VAT registration threshold" className="card mt-3 p-4">
        <div className="flex items-baseline justify-between">
          <div className="text-xs font-medium text-muted">Year-to-date revenue vs ฿1.8M VAT threshold</div>
          <div className="num text-sm">฿{formatTHB(s.yearRevenue)} · {pct}%</div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Share of VAT threshold reached">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">You are VAT-registered, so this is informational. It matters if you deregister or start a second business.</p>
      </section>

      <section aria-label="Recent documents" className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold">Recent documents</h2>
          <Link href="/documents" className="text-accent hover:underline">View all</Link>
        </div>
        <ul>
          {sampleDocs.slice(0, 5).map((d) => (
            <li key={d.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{d.customer}</div>
                <div className="text-xs text-muted">
                  {d.number} · {DOC_TYPE_LABEL[d.type].en} · {formatDateEN(d.issueDate)}
                </div>
              </div>
              <StatusBadge status={d.status} overdue={isOverdue(d)} />
              <div className="num w-28 text-right font-medium">฿{formatTHB(d.total)}</div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
