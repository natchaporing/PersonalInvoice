"use client";

import { CreditCard, FileText, HandCoins, LayoutDashboard, Package, Receipt, Settings, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", th: "ภาพรวม", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", th: "เอกสาร", icon: FileText },
  { href: "/customers", label: "Customers", th: "ลูกค้า", icon: Users },
  { href: "/items", label: "Items", th: "สินค้า/บริการ", icon: Package },
  { href: "/payments", label: "Payments", th: "การรับชำระ", icon: Wallet },
  { href: "/payees", label: "Payees", th: "ค่านายหน้า", icon: HandCoins },
  { href: "/tax", label: "Tax & VAT", th: "ภาษี", icon: Receipt },
  { href: "/billing", label: "Billing", th: "แพ็กเกจ", icon: CreditCard },
  { href: "/settings", label: "Settings", th: "ตั้งค่า", icon: Settings },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 py-3 md:sticky md:top-4 md:flex-col md:gap-0.5 md:overflow-visible md:px-4 md:py-6">
      <div className="eyebrow mb-2 hidden px-2 md:block">Menu · เมนู</div>
      {NAV.map(({ href, label, th, icon: Icon }) => {
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
            <span>{label}</span>
            <span className="ml-auto hidden text-[11px] font-normal text-muted-foreground lg:inline">{th}</span>
          </Link>
        );
      })}
    </nav>
  );
}
