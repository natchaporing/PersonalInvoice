import type { DocStatus } from "@/lib/sample-data";

const STATUS: Record<DocStatus | "overdue", { dot: string; text: string }> = {
  draft: { dot: "bg-muted", text: "text-muted" },
  issued: { dot: "bg-accent", text: "text-accent" },
  paid: { dot: "bg-ok", text: "text-ok" },
  void: { dot: "bg-danger", text: "text-danger" },
  overdue: { dot: "bg-danger", text: "text-danger" },
};

/** Status as a dot + word (no pill). Colour is never the only signal: the word is always shown. */
export function StatusBadge({ status, overdue }: { status: DocStatus; overdue?: boolean }) {
  const key = overdue ? "overdue" : status;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${STATUS[key].text}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${STATUS[key].dot}`} />
      {key}
    </span>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="display text-[34px]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-[60ch] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeading({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="display text-xl text-accent">{children}</h2>
      {aside}
    </div>
  );
}
