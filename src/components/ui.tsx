import type { DocStatus } from "@/lib/sample-data";

const STATUS_STYLE: Record<DocStatus, string> = {
  draft: "bg-surface-2 text-muted",
  issued: "bg-info-soft text-info",
  paid: "bg-ok-soft text-ok",
  void: "bg-danger-soft text-danger",
};

export function StatusBadge({ status, overdue }: { status: DocStatus; overdue?: boolean }) {
  const label = overdue ? "overdue" : status;
  const style = overdue ? "bg-danger-soft text-danger" : STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {label}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
