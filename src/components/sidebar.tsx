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
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible">
      <div className="hidden px-3 pb-4 pt-2 md:block">
        <div className="text-base font-semibold tracking-tight">PersonalInvoice</div>
        <div className="text-xs text-muted">ใบกำกับภาษี · Invoicing</div>
      </div>
      {NAV.map((n) => {
        const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-2 ${
              active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            {n.label} <span className="ml-1 hidden text-xs opacity-70 lg:inline">{n.th}</span>
          </Link>
        );
      })}
    </nav>
  );
}
