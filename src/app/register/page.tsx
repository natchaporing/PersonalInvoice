import { AuthShell } from "@/components/auth-shell";
import { PLANS, TRIAL_DAYS, yearlySavingPct } from "@/lib/domain/billing";
import { getMessages } from "@/lib/i18n/server";
import { formatTHB } from "@/lib/thai/money";
import { RegisterForm } from "./register-form";

export async function generateMetadata() {
  return { title: (await getMessages()).auth.registerMetaTitle };
}

const baht = (satang: number) => `฿${formatTHB(satang).replace(/\.00$/, "")}`;

export default async function RegisterPage() {
  const m = await getMessages();
  return (
    <AuthShell wide eyebrow={m.auth.registerEyebrow(TRIAL_DAYS)} title={m.auth.registerTitle} subtitle={m.auth.registerSubtitle}>
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_250px]">
        <RegisterForm />
        <aside aria-label={m.auth.asideTitle(TRIAL_DAYS)} className="h-fit rounded-md border border-cobalt/20 bg-card/80 p-4 text-sm">
          <div className="display text-[22px] text-cobalt">{m.auth.asideTitle(TRIAL_DAYS)}</div>
          <ul className="mt-3 grid gap-2">
            {m.auth.asideItems.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <div className="mt-4 border-t pt-3">
            <div className="font-medium">{m.auth.asideAfter}</div>
            <p className="mt-1">{m.auth.asidePrices(baht(PLANS.pro_year.price), yearlySavingPct(), baht(PLANS.pro_month.price))}</p>
            <p className="mt-2 text-muted-foreground">{m.auth.asideKeep}</p>
          </div>
          <p className="mt-4 border-t pt-3 text-[12px] text-muted-foreground">{m.auth.asideWho}</p>
        </aside>
      </div>
    </AuthShell>
  );
}
