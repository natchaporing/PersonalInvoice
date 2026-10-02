"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings", label: "Business profile", th: "ข้อมูลกิจการ" },
  { href: "/settings/billing", label: "Billing", th: "แพ็กเกจ" },
];

export function SettingsTabs() {
  const path = usePathname();
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
            {t.label} <span className="ml-1 text-[11px] font-normal text-muted-foreground">{t.th}</span>
          </Link>
        );
      })}
    </nav>
  );
}
