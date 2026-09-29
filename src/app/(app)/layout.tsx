import { LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { GuillocheBackground, GuillocheBand, Microprint, Rosette } from "@/components/banknote";
import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("business_profiles").select("name_th").eq("owner_id", user.id).maybeSingle();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative overflow-hidden bg-cobalt-deep text-white">
        <GuillocheBackground tone="white" opacity={0.16} />
        <Rosette size={150} tone="white" opacity={0.28} className="absolute -top-10 right-40 hidden md:block" />
        <div className="relative flex items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <div className="flex items-baseline gap-3">
            <span className="display text-[22px] tracking-tight">PersonalInvoice</span>
            <span className="hidden text-xs text-amber sm:inline">ใบกำกับภาษี · Thai tax invoicing</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[28ch] truncate text-xs text-white/80 md:inline">{profile?.name_th ?? user.email}</span>
            <form action={signOut}>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-sm border border-white/35 px-2 py-1 text-xs text-white/90 hover:bg-white/10">
                <LogOut className="size-3.5" aria-hidden /> Sign out
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
          {!profile && (
            <div role="status" className="mb-6 rounded-md border border-amber bg-amber/10 px-4 py-3 text-sm">
              Set up your business profile before issuing documents.{" "}
              <Link href="/settings" className="font-medium text-cobalt underline underline-offset-4">Go to Settings</Link>
            </div>
          )}
          {children}
        </main>
      </div>

      <footer className="relative overflow-hidden bg-cobalt-deep text-white/85">
        <Microprint color="#ffffff" opacity={0.35} className="px-4 py-0.5 md:px-6" text="REVENUE CODE S.86/4 · เก็บรักษาต้นฉบับอิเล็กทรอนิกส์ 5 ปี · " />
        <div className="px-4 py-3 text-xs md:px-6">PersonalInvoice · Documents follow Revenue Code s.86/4 · Keep electronic originals 5 years</div>
      </footer>
    </div>
  );
}
