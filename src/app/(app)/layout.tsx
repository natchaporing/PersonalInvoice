import { LogoMark } from "@/components/logo";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { GuillocheBackground, GuillocheBand, Microprint, Rosette } from "@/components/banknote";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Sidebar } from "@/components/sidebar";
import { getAccess } from "@/lib/billing/access";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await requireUser();
  const { access } = await getAccess();
  const m = await getMessages();
  const { data: profile } = await supabase.from("business_profiles").select("name_th").eq("owner_id", user.id).maybeSingle();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative overflow-hidden bg-cobalt-deep text-white">
        <GuillocheBackground tone="white" opacity={0.16} />
        <Rosette size={150} tone="white" opacity={0.28} className="absolute -top-10 right-40 hidden md:block" />
        <div className="relative flex items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <div className="flex items-center gap-3">
            <LogoMark size={42} title="" />
            <span className="display text-[24px] tracking-tight">Tra<span className="ml-1.5 font-sans text-[15px] text-amber">ตรา</span></span>
            <span className="hidden text-xs text-amber sm:inline">{m.common.tagline}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[28ch] truncate text-xs text-white/80 md:inline">{profile?.name_th ?? user.email}</span>
            <LanguageSwitcher />
            <form action={signOut}>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-sm border border-white/35 px-2 py-1 text-xs text-white/90 hover:bg-white/10">
                <LogOut className="size-3.5" aria-hidden /> {m.common.signOut}
              </button>
            </form>
          </div>
        </div>
        <Microprint color="#ffffff" opacity={0.45} className="relative border-t border-white/15 px-4 py-0.5 md:px-6" />
      </header>
      <GuillocheBand tone="amber" height={10} opacity={1} />

      <div className="flex-1 md:grid md:grid-cols-[236px_1fr]">
        <aside className="border-b bg-card md:border-r md:border-b-0">
          <Sidebar />
        </aside>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
          {access.kind === "trial" && (
            <aside aria-label="Subscription" className={cn("mb-6 flex flex-wrap items-center justify-between gap-2 rounded-md border px-4 py-2.5 text-sm", access.daysLeft <= 3 ? "border-amber bg-amber/10" : "bg-card")}>
              <span>
                <span className="font-medium">{m.common.trialShort}:</span> {m.shell.trialLeft(access.daysLeft)}
              </span>
              <Link href="/settings/billing" className="font-medium text-cobalt underline underline-offset-4">{m.shell.choosePlan}</Link>
            </aside>
          )}
          {access.kind === "expired" && (
            <aside aria-label="Subscription" className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber bg-amber/10 px-4 py-3 text-sm">
              <span>{m.shell.trialEnded}</span>
              <Link href="/settings/billing" className="font-medium text-cobalt underline underline-offset-4">{m.shell.subscribe}</Link>
            </aside>
          )}
          {!profile && (
            <div role="status" className="mb-6 rounded-md border border-amber bg-amber/10 px-4 py-3 text-sm">
              {m.shell.setupProfile}{" "}
              <Link href="/settings" className="font-medium text-cobalt underline underline-offset-4">{m.shell.goToSettings}</Link>
            </div>
          )}
          {children}
        </main>
      </div>

      <footer className="relative overflow-hidden bg-cobalt-deep text-white/85">
        <Microprint color="#ffffff" opacity={0.35} className="px-4 py-0.5 md:px-6" text="REVENUE CODE S.86/4 · เก็บรักษาต้นฉบับอิเล็กทรอนิกส์ 5 ปี · " />
        <div className="px-4 py-3 text-xs md:px-6">Tra · trasolutions.co · {m.shell.footer}</div>
      </footer>
    </div>
  );
}
