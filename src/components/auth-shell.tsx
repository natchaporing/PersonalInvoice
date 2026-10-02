import { GuillocheBackground, GuillocheBand, Microprint, Rosette } from "@/components/banknote";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

/** The signed-out frame shared by sign-in and register: brand header, then one engraved card. */
export function AuthShell({ eyebrow, title, subtitle, wide, children }: { eyebrow: string; title: string; subtitle: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="relative overflow-hidden bg-cobalt-deep px-6 py-4 text-white">
        <GuillocheBackground tone="white" opacity={0.16} />
        <div className="relative flex items-center justify-between">
          <span className="flex items-center gap-3">
            <LogoMark size={42} title="" />
            <span className="display text-[24px] tracking-tight">Tra<span className="ml-1.5 font-sans text-[15px] text-amber">ตรา</span></span>
          </span>
        </div>
      </header>
      <GuillocheBand tone="amber" height={10} opacity={1} />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className={cn("relative w-full overflow-hidden rounded-lg border border-cobalt/25 bg-paper shadow-[0_18px_40px_-24px_rgb(26_37_54/0.45)]", wide ? "max-w-3xl" : "max-w-md")}>
          <GuillocheBackground opacity={0.08} />
          <Rosette size={220} tone="mono" opacity={0.12} className="absolute -top-16 -right-16" />
          <div className="relative p-6 sm:p-8">
            <div className="eyebrow text-cobalt">{eyebrow}</div>
            <h1 className="display mt-1 text-[32px]">{title}</h1>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
            {children}
          </div>
          <Microprint className="relative border-t border-cobalt/15 px-8 py-1" />
        </div>
      </main>
    </div>
  );
}
