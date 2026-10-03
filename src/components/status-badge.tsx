"use client";

import { Badge } from "@/components/ui/badge";
import type { DocStatus } from "@/lib/domain/documents";
import { useMessages } from "@/lib/i18n/client";

/** Status as an ink-stamp badge. The word is always shown, colour is secondary. */
export function StatusBadge({ status, overdue }: { status: DocStatus; overdue?: boolean }) {
  const m = useMessages();
  const key = overdue ? "overdue" : status;
  return (
    <Badge variant={key} className="uppercase tracking-[0.08em]">
      {m.common.status[key]}
    </Badge>
  );
}
