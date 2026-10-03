"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";


export function SettingsTabs() {
  const path = usePathname();
  const m = useMessages();
  const TABS = [
    { href: "/settings", label: m.settings.tabProfile },
    { href: "/settings/billing", label: m.settings.tabBilling },
  ];
  return (
    <nav aria-label="Settings" className="mb-6 flex gap-1 border-b">
      {TABS.map((t) => {
        const active = t.href === "/settings" ? path === "/settings" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn("-mb-px border-b-2 px-3 py-2 text-sm", active ? "border-cobalt font-semibold text-cobalt" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
