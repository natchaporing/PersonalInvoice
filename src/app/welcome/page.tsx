import { ArrowRight, BadgeCheck, FileCheck2, UserRound } from "lucide-react";
import Link from "next/link";
import { GuillocheBackground, GuillocheBand, Rosette } from "@/components/banknote";
import { A4 } from "@/components/invoice-document";
import { InvoiceModern } from "@/components/invoice-modern";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoMark } from "@/components/logo";
import { ScaledPage } from "@/components/scaled-page";
import { buttonVariants } from "@/components/ui/button";
import { PLANS, TRIAL_DAYS, yearlySavingPct } from "@/lib/domain/billing";
import { sampleTaxInvoice } from "@/lib/sample-data";
import { formatTHB } from "@/lib/thai/money";
import { getMessages } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const m = await getMessages();
  return { title: m.welcome.metaTitle, description: m.welcome.lead };
}

const baht = (satang: number) => `฿${formatTHB(satang).replace(/\.00$/, "")}`;

const MESSAGE_ICONS = [FileCheck2, BadgeCheck, UserRound];

function TrialButton({ label, className }: { label: string; className?: string }) {
  return (
    <Link href="/register" className={cn(buttonVariants({ size: "lg" }), className)}>
      {label} <ArrowRight aria-hidden />
    </Link>
  );
}

export default async function WelcomePage() {
  const m = await getMessages();
  const w = m.welcome;
  const trial = m.common.startTrial(TRIAL_DAYS);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="relative overflow-hidden bg-cobalt-deep px-4 py-4 text-white sm:px-6">
        <GuillocheBackground tone="white" opacity={0.16} />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <LogoMark size={40} title="" />
            <span className="display text-[24px] tracking-tight">Tra<span className="ml-1.5 font-sans text-[15px] text-amber">ตรา</span></span>
          </span>
          <nav aria-label="Account" className="flex items-center gap-2 text-sm">
            <LanguageSwitcher />
            <Link href="/login" className="rounded-sm px-3 py-1.5 text-white/90 hover:bg-white/10">{m.common.signIn}</Link>
            <Link href="/register" className="hidden rounded-sm bg-amber px-3 py-1.5 font-medium text-cobalt-deep hover:bg-amber/90 sm:inline-block">{m.common.trialShort}</Link>
          </nav>
        </div>
      </header>
      <GuillocheBand tone="amber" height={10} opacity={1} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <Rosette size={420} tone="mono" opacity={0.06} className="absolute -top-24 -left-32" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-20">
            <div>
              <div className="eyebrow text-cobalt">{m.common.tagline}</div>
              <h1 className="display mt-3 text-[34px] leading-tight sm:text-[44px]">
                {/* Phrases are kept whole: the browser's Thai line breaking would split "ใบ" from "กำกับภาษี". */}
                {w.headline.map((phrase, i) => (
                  <span key={phrase}>
                    {i > 0 && " "}
                    <span className="whitespace-nowrap">{phrase}</span>
                  </span>
                ))}
              </h1>
              <p className="mt-5 max-w-[56ch] text-lg">{w.lead}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <TrialButton label={trial} />
                <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>{m.common.signIn}</Link>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{m.common.noCard} · {w.afterTrial(baht(PLANS.pro_year.price))}</p>
            </div>
            <div aria-label={w.sampleAlt} role="img" className="mx-auto w-full max-w-[460px] rotate-[1.5deg] overflow-hidden rounded-md border bg-white shadow-[0_24px_60px_-28px_rgb(26_37_54/0.55)]">
              <div aria-hidden>
                <ScaledPage width={A4.width} height={A4.height}>
                  <InvoiceModern doc={sampleTaxInvoice} />
                </ScaledPage>
              </div>
            </div>
          </div>
        </section>

        {/* Three messages */}
        <section aria-labelledby="why" className="border-y bg-card">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 id="why" className="display text-[28px]">{w.whyTitle}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {w.messages.map(({ title, body }, i) => {
                const Icon = MESSAGE_ICONS.at(i) ?? FileCheck2;
                return (
                  <article key={title} className="rounded-md border bg-background p-5">
                    <Icon className="size-6 text-cobalt" aria-hidden />
                    <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-[15px] text-muted-foreground">{body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Instalments, the hard part made right */}
        <section aria-labelledby="flow" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="flow" className="display text-[28px]">{w.flowTitle}</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {w.steps.map((step, i) => (
              <li key={step.title} className="relative rounded-md border border-cobalt/25 bg-paper p-5">
                <span className="num text-sm text-cobalt">{String(i + 1).padStart(2, "0")}</span>
                <div className="mt-1 text-lg font-semibold">{step.title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{step.note}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Pricing */}
        <section aria-labelledby="price" className="border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <h2 id="price" className="display text-[28px]">{w.priceTitle}</h2>
              <p className="mt-1 text-muted-foreground">{w.priceLead(TRIAL_DAYS)}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border-2 border-cobalt bg-background p-5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{w.yearly}</span>
                  <span className="rounded-sm bg-amber/25 px-2 py-0.5 text-[12px] font-medium">{w.save(yearlySavingPct())}</span>
                </div>
                <div className="num mt-2 text-[30px] font-semibold">{baht(PLANS.pro_year.price)}</div>
                <div className="text-sm text-muted-foreground">{m.common.perYear} · {m.common.vatIncluded}</div>
              </div>
              <div className="rounded-md border bg-background p-5">
                <span className="font-semibold">{w.monthly}</span>
                <div className="num mt-2 text-[30px] font-semibold">{baht(PLANS.pro_month.price)}</div>
                <div className="text-sm text-muted-foreground">{m.common.perMonth} · {m.common.vatIncluded}</div>
              </div>
              <TrialButton label={trial} className="sm:col-span-2" />
            </div>
          </div>
        </section>

        {/* Objections */}
        <section aria-labelledby="faq" className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 id="faq" className="display text-[28px]">{w.faqTitle}</h2>
          <div className="mt-6 divide-y rounded-md border bg-card">
            {w.faq(baht(PLANS.pro_year.price), baht(PLANS.pro_month.price)).map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  <span className="mr-2 inline-block text-cobalt transition-transform group-open:rotate-90" aria-hidden>›</span>
                  {f.q}
                </summary>
                <p className="mt-2 pl-5 text-[15px] text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-cobalt-deep px-4 py-5 text-sm text-white/85 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span>Tra · trasolutions.co · {w.footer}</span>
          <Link href="/terms" className="underline underline-offset-4 hover:text-white">{w.terms}</Link>
        </div>
      </footer>
    </div>
  );
}
