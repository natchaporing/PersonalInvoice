import { LogoMark } from "@/components/logo";
import { cookies } from "next/headers";
import { GuillocheBackground, GuillocheBand, Microprint, Rosette } from "@/components/banknote";
import { PalettePicker } from "@/components/palette-picker";
import { DEFAULT_PALETTE, isPalette, PALETTE_COOKIE } from "@/lib/palettes";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · PersonalInvoice" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  const linkFailed = sp.error === "confirm_failed";
  const saved = (await cookies()).get(PALETTE_COOKIE)?.value;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="relative overflow-hidden bg-cobalt-deep px-6 py-4 text-white">
        <GuillocheBackground tone="white" opacity={0.16} />
        <div className="relative flex items-center justify-between">
          <span className="flex items-center gap-3">
            <LogoMark size={42} title="" />
            <span className="display text-[22px]">PersonalInvoice</span>
          </span>
          <PalettePicker initial={isPalette(saved) ? saved : DEFAULT_PALETTE} />
        </div>
      </header>
      <GuillocheBand tone="amber" height={10} opacity={1} />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-cobalt/25 bg-paper shadow-[0_18px_40px_-24px_rgb(26_37_54/0.45)]">
          <GuillocheBackground opacity={0.08} />
          <Rosette size={220} tone="mono" opacity={0.12} className="absolute -top-16 -right-16" />
          <div className="relative p-8">
            <div className="eyebrow text-cobalt">ใบกำกับภาษี · Thai tax invoicing</div>
            <h1 className="display mt-1 text-[32px]">Sign in</h1>
            <p className="mt-1 text-muted-foreground">Your invoices, tax invoices and receipts.</p>
            <LoginForm next={next} linkFailed={linkFailed} />
          </div>
          <Microprint className="relative border-t border-cobalt/15 px-8 py-1" />
        </div>
      </main>
    </div>
  );
}
