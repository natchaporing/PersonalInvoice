import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type Access, isPlanKey, type PlanKey, PLANS, yearlySavingPct } from "@/lib/domain/billing";
import { bkkDate, getAccess } from "@/lib/billing/access";
import { planLabel } from "@/lib/billing/labels";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { formatTHB } from "@/lib/thai/money";
import { requireUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  return { title: (await getMessages()).billing.metaTitle };
}

const baht = (satang: number) => `฿${formatTHB(satang).replace(/\.00$/, "")}`;

function Status({ access, m, locale }: { access: Access; m: Messages; locale: Locale }) {
  const d = (x: Date) => bkkDate(x, locale);
  switch (access.kind) {
    case "comp":
      return <p>{m.billing.comp}</p>;
    case "trial":
      return (
        <p>
          <span className="font-semibold">{m.billing.trialStatus(access.daysLeft, d(access.endsAt))}</span> {m.billing.trialNote}
        </p>
      );
    case "paid":
      return (
        <p>
          <span className="font-semibold">{m.billing.paidStatus(access.plan ? planLabel(access.plan, m) : "Pro", d(access.endsAt))}</span>
          {access.trialEndsAt && <> {m.billing.paidTrialNote(d(access.trialEndsAt))}</>}
        </p>
      );
    case "expired":
      return (
        <p>
          <span className="font-semibold">{access.endedAt ? m.billing.expiredOn(d(access.endedAt)) : m.billing.noPlan}</span> {m.billing.expiredNote}
        </p>
      );
  }
}

export default async function BillingPage({ searchParams }: PageProps<"/settings/billing">) {
  const { supabase } = await requireUser();
  const [{ access }, m, locale] = await Promise.all([getAccess(), getMessages(), getLocale()]);
  const paid = typeof (await searchParams).paid === "string";
  const { data: charges } = await supabase.from("billing_charges").select("*").order("created_at", { ascending: false }).limit(24);
  const saving = yearlySavingPct();
  const d = (x: string) => bkkDate(x, locale);

  return (
    <>
      {paid && (
        <p role="status" className="mb-5 max-w-4xl rounded-md border border-ok/40 bg-ok/5 px-4 py-3 text-sm text-ok">{m.billing.paid}</p>
      )}
      <div className="grid max-w-4xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{m.billing.yourPlan}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm"><Status access={access} m={m} locale={locale} /></CardContent>
        </Card>

        {access.kind !== "comp" && (
          <section aria-labelledby="plans" className="grid gap-3">
            <h2 id="plans" className="text-lg font-semibold">{access.kind === "paid" ? m.billing.extend : m.billing.choose}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(PLANS) as PlanKey[]).map((k) => {
                const p = PLANS[k];
                const best = k === "pro_year";
                return (
                  <Card key={k} className={cn(best && "border-cobalt ring-1 ring-cobalt")}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2">
                        {planLabel(k, m)}
                        {best && <span className="rounded-sm bg-amber/25 px-2 py-0.5 text-[12px] font-medium">{m.welcome.save(saving)}</span>}
                      </CardTitle>
                      <CardDescription>
                        <span className="num text-[26px] font-semibold text-foreground">{baht(p.price)}</span> / {best ? m.billing.perYear : m.billing.perMonth} · {m.common.vatIncluded}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                      <p className="text-muted-foreground">
                        {best ? m.billing.worksOut(baht(Math.round(p.price / 12))) : m.billing.monthByMonth} {m.billing.everything}
                      </p>
                      <Link href={`/settings/billing/checkout?plan=${k}`} className={buttonVariants({ variant: best ? "default" : "outline" })}>
                        {best ? m.billing.chooseYearly : m.billing.chooseMonthly}
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{m.billing.history}</CardTitle>
          </CardHeader>
          <CardContent>
            {charges?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 font-medium">{m.billing.colDate}</th>
                    <th className="py-2 font-medium">{m.billing.colPlan}</th>
                    <th className="py-2 font-medium">{m.billing.colPeriod}</th>
                    <th className="py-2 text-right font-medium">{m.billing.colAmount}</th>
                    <th className="py-2 text-right font-medium">{m.billing.colStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2">{d(c.paid_at ?? c.created_at)}</td>
                      <td className="py-2">{isPlanKey(c.plan) ? planLabel(c.plan, m) : c.plan}</td>
                      <td className="py-2">{c.period_start && c.period_end ? `${d(c.period_start)} – ${d(c.period_end)}` : "—"}</td>
                      <td className="num py-2 text-right">฿{formatTHB(c.amount)}</td>
                      <td className="py-2 text-right">
                        {c.status === "paid" ? <span className="text-ok">{m.billing.statusPaid}{c.provider === "test" ? ` ${m.billing.statusTest}` : ""}</span> : c.status === "pending" ? <Link href={`/settings/billing/pay/${c.id}`} className="text-cobalt underline-offset-4 hover:underline">{m.billing.statusPending}</Link> : c.status === "failed" ? m.billing.statusFailed : c.status === "expired" ? m.billing.statusExpired : c.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">{m.billing.noPayments}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
