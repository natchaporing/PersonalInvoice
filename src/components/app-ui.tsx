import { Badge } from "@/components/ui/badge";
import type { DocStatus } from "@/lib/sample-data";

/** Status as an ink-stamp badge. The word is always shown, colour is secondary. */
export function StatusBadge({ status, overdue }: { status: DocStatus; overdue?: boolean }) {
  const key = overdue ? "overdue" : status;
  return (
    <Badge variant={key} className="uppercase tracking-[0.08em]">
      {key}
    </Badge>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="display text-[36px] text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 max-w-[60ch] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
