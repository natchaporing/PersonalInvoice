import { cookies } from "next/headers";
import { Sidebar } from "@/components/sidebar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { isTheme, THEME_COOKIE } from "@/lib/themes";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const saved = (await cookies()).get(THEME_COOKIE)?.value;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-2 border-secondary bg-brand text-brand-fg">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-baseline gap-3">
            <span className="text-base font-semibold tracking-tight">PersonalInvoice</span>
            <span className="hidden text-xs text-secondary sm:inline">ใบกำกับภาษี · Thai tax invoicing</span>
          </div>
          <ThemeSwitcher initial={isTheme(saved) ? saved : "ledger"} />
        </div>
      </header>
      <div className="flex-1 md:grid md:grid-cols-[232px_1fr]">
        <aside className="border-b border-border md:border-b-0 md:border-r">
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
