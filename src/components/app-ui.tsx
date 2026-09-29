import { GuillocheBackground } from "@/components/banknote";
import { Badge } from "@/components/ui/badge";
import type { DocStatus } from "@/lib/domain/documents";

/** Status as an ink-stamp badge. The word is always shown, colour is secondary. */
export function StatusBadge({ status, overdue }: { status: DocStatus; overdue?: boolean }) {
  const key = overdue ? "overdue" : status;
  return (
    <Badge variant={key} className="uppercase tracking-[0.08em]">
      {key}
    </Badge>
  );
}

/** Empty list placeholder on banknote paper. */
export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-dashed border-cobalt/40 bg-paper px-6 py-10 text-center">
      <GuillocheBackground opacity={0.06} />
      <div className="relative mx-auto max-w-[48ch]">
        <h2 className="display text-xl text-cobalt">{title}</h2>
        {children && <p className="mt-2 text-muted-foreground">{children}</p>}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </section>
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
