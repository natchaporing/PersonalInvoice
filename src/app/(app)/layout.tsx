import { Sidebar } from "@/components/sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-2 border-secondary bg-brand text-brand-fg">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-baseline gap-3">
            <span className="text-base font-semibold tracking-tight">PersonalInvoice</span>
            <span className="hidden text-xs text-secondary sm:inline">ใบกำกับภาษี · Thai tax invoicing</span>
          </div>
          <span className="text-xs text-white/80">฿ THB · VAT 7%</span>
        </div>
      </header>
      <div className="flex-1 md:grid md:grid-cols-[224px_1fr]">
        <aside className="border-b border-border bg-surface md:border-b-0 md:border-r">
          <Sidebar />
        </aside>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
      <footer className="bg-brand px-4 py-3 text-xs text-white/85 md:px-6">
        PersonalInvoice · Documents follow Revenue Code s.86/4 · Keep electronic originals 5 years
      </footer>
    </div>
  );
}
