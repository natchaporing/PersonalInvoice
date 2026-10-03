"use client";

import { FileText, HandCoins, LayoutDashboard, Package, Receipt, Settings, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMessages } from "@/lib/i18n/client";
import type { Messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

const NAV: { href: string; key: keyof Messages["nav"]; icon: typeof FileText }[] = [
  { href: "/", key: "dashboard", icon: LayoutDashboard },
  { href: "/documents", key: "documents", icon: FileText },
  { href: "/customers", key: "customers", icon: Users },
  { href: "/items", key: "items", icon: Package },
  { href: "/payments", key: "payments", icon: Wallet },
  { href: "/payees", key: "payees", icon: HandCoins },
  { href: "/tax", key: "tax", icon: Receipt },
  { href: "/settings", key: "settings", icon: Settings },
];

export function Sidebar() {
  const path = usePathname();
  const m = useMessages();
  return (
    <nav aria-label={m.nav.menu} className="flex gap-1 overflow-x-auto px-3 py-3 md:sticky md:top-4 md:flex-col md:gap-0.5 md:overflow-visible md:px-4 md:py-6">
      <div className="eyebrow mb-2 hidden px-2 md:block">{m.nav.menu}</div>
      {NAV.map(({ href, key, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-2.5 whitespace-nowrap rounded-md px-2.5 py-2 text-[14px]",
              active ? "bg-accent font-semibold text-cobalt" : "text-foreground hover:bg-secondary",
            )}
          >
            {active && <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-amber" />}
            <Icon className={cn("size-4", active ? "text-cobalt" : "text-muted-foreground group-hover:text-foreground")} aria-hidden />
            <span>{m.nav[key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
