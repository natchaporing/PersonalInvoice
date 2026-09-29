"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", th: "ภาพรวม" },
  { href: "/documents", label: "Documents", th: "เอกสาร" },
  { href: "/customers", label: "Customers", th: "ลูกค้า" },
  { href: "/items", label: "Items", th: "สินค้า/บริการ" },
  { href: "/payments", label: "Payments", th: "การรับชำระ" },
  { href: "/tax", label: "Tax & VAT", th: "ภาษี" },
  { href: "/settings", label: "Settings", th: "ตั้งค่า" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex gap-2 overflow-x-auto px-4 py-3 md:sticky md:top-6 md:flex-col md:gap-0.5 md:overflow-visible md:px-6 md:py-6">
      <div className="eyebrow mb-2 hidden md:block">Menu · เมนู</div>
      {NAV.map((n) => {
        const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap border-l-[3px] py-1.5 pl-3 pr-2 ${
              active
                ? "border-secondary font-semibold text-accent"
                : "border-transparent text-fg hover:border-border hover:text-accent"
            }`}
          >
            {n.label} <span className="ml-1.5 hidden text-xs text-muted lg:inline">{n.th}</span>
          </Link>
        );
      })}
    </nav>
  );
}
