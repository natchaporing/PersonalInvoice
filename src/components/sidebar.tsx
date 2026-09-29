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
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto p-3 md:sticky md:top-4 md:flex-col md:overflow-visible">
      {NAV.map((n) => {
        const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg border-l-4 px-3 py-2 ${
              active
                ? "border-secondary bg-accent-soft font-semibold text-accent"
                : "border-transparent text-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            {n.label} <span className="ml-1 hidden text-xs opacity-75 lg:inline">{n.th}</span>
          </Link>
        );
      })}
    </nav>
  );
}
