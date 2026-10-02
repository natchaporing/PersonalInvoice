import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type Access, isPlanKey, type PlanKey, PLANS, yearlySavingPct } from "@/lib/domain/billing";
import { bkkDate, getAccess } from "@/lib/billing/access";
import { formatTHB } from "@/lib/thai/money";
import { requireUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Billing · Tra" };

const baht = (satang: number) => `฿${formatTHB(satang).replace(/\.00$/, "")}`;

function Status({ access }: { access: Access }) {
  switch (access.kind) {
    case "comp":
      return <p>Your account is complimentary. Everything is included, with no payment needed.</p>;
    case "trial":
      return (
        <p>
          <span className="font-semibold">Free trial: {access.daysLeft} {access.daysLeft === 1 ? "day" : "days"} left</span>, until {bkkDate(access.endsAt)}. Everything is included.
          Choose a plan any time: your paid period starts when the trial ends, so you don&apos;t lose any days.
        </p>
      );
    case "paid":
      return (
        <p>
          <span className="font-semibold">{access.plan ? PLANS[access.plan].label : "Pro"}</span>, paid until {bkkDate(access.endsAt)}.
          {access.trialEndsAt && <> Your trial runs until {bkkDate(access.trialEndsAt)} and the paid period follows it.</>}
        </p>
      );
    case "expired":
      return (
        <p>
          <span className="font-semibold">{access.endedAt ? `Your access ended on ${bkkDate(access.endedAt)}.` : "No active plan."}</span> Your documents are safe and you can still
          view and download them. Subscribe to issue new ones.
        </p>
      );
  }
}

export default async function BillingPage({ searchParams }: PageProps<"/settings/billing">) {
  const { supabase } = await requireUser();
  const { access } = await getAccess();
  const paid = typeof (await searchParams).paid === "string";
  const { data: charges } = await supabase.from("billing_charges").select("*").order("created_at", { ascending: false }).limit(24);
  const saving = yearlySavingPct();

  return (
    <>
      {paid && (
        <p role="status" className="mb-5 max-w-4xl rounded-md border border-ok/40 bg-ok/5 px-4 py-3 text-sm text-ok">
          Payment received. Thank you! Your plan is active.
        </p>
      )}
      <div className="grid max-w-4xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your plan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm"><Status access={access} /></CardContent>
        </Card>

        {access.kind !== "comp" && (
          <section aria-labelledby="plans" className="grid gap-3">
            <h2 id="plans" className="text-lg font-semibold">{access.kind === "paid" ? "Extend your plan" : "Choose a plan"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(PLANS) as PlanKey[]).map((k) => {
                const p = PLANS[k];
                const best = k === "pro_year";
                return (
                  <Card key={k} className={cn(best && "border-cobalt ring-1 ring-cobalt")}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2">
                        {p.label}
                        {best && <span className="rounded-sm bg-amber/25 px-2 py-0.5 text-[12px] font-medium">Save {saving}%</span>}
                      </CardTitle>
                      <CardDescription>
                        <span className="num text-[26px] font-semibold text-foreground">{baht(p.price)}</span> / {p.period} · VAT included
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm">
                      <p className="text-muted-foreground">
                        {best ? `Works out at ${baht(Math.round(p.price / 12))} a month.` : "Pay month by month."} Everything in Pro: unlimited documents, signed PDFs, instalments, withholding and VAT reports.
                      </p>
                      <Link href={`/settings/billing/checkout?plan=${k}`} className={buttonVariants({ variant: best ? "default" : "outline" })}>
                        Choose {best ? "yearly" : "monthly"}
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
            <CardTitle>Payment history</CardTitle>
          </CardHeader>
          <CardContent>
            {charges?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium">Plan</th>
                    <th className="py-2 font-medium">Period</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                    <th className="py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2">{bkkDate(c.paid_at ?? c.created_at)}</td>
                      <td className="py-2">{isPlanKey(c.plan) ? PLANS[c.plan].label : c.plan}</td>
                      <td className="py-2">{c.period_start && c.period_end ? `${bkkDate(c.period_start)} – ${bkkDate(c.period_end)}` : "—"}</td>
                      <td className="num py-2 text-right">฿{formatTHB(c.amount)}</td>
                      <td className="py-2 text-right">{c.status === "paid" ? <span className="text-ok">Paid{c.provider === "test" ? " (test)" : ""}</span> : c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
