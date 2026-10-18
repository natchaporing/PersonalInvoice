"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** Payee profiles on one page, the commissions owed and paid by quotation on the other. */
export function PayeesTabs() {
  const path = usePathname();
  const t = useMessages().payees;
  const tabs = [
    { href: "/payees", label: t.tabProfiles, active: path === "/payees" },
    { href: "/payees/commissions", label: t.tabCommissions, active: path.startsWith("/payees/commissions") },
  ];
  return (
    <nav aria-label={t.title} className="mb-6 flex gap-1 border-b">
      {tabs.map((x) => (
        <Link
          key={x.href}
          href={x.href}
          aria-current={x.active ? "page" : undefined}
          className={cn("-mb-px border-b-2 px-3 py-2 text-sm", x.active ? "border-cobalt font-semibold text-cobalt" : "border-transparent text-muted-foreground hover:text-foreground")}
        >
          {x.label}
        </Link>
      ))}
    </nav>
  );
}
