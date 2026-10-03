import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isPlanKey, nextPeriod, PLANS, vatInclusive } from "@/lib/domain/billing";
import { bkkDate, getAccess, testPaymentsEnabled } from "@/lib/billing/access";
import { planLabel } from "@/lib/billing/labels";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { formatTHB } from "@/lib/thai/money";
import { CheckoutForm } from "./checkout-form";

export async function generateMetadata() {
  return { title: `${(await getMessages()).billing.checkout} · Tra` };
}

export default async function CheckoutPage({ searchParams }: PageProps<"/settings/billing/checkout">) {
  const plan = (await searchParams).plan;
  if (!isPlanKey(plan)) redirect("/settings/billing");
  const p = PLANS[plan];
  const [{ sub, access }, m, locale] = await Promise.all([getAccess(), getMessages(), getLocale()]);
  if (access.kind === "comp") redirect("/settings/billing");
  const { net, vat } = vatInclusive(p.price);
  const { start, end } = nextPeriod(sub, plan);

  return (
    <>
      <h2 className="mb-4 text-lg font-semibold">{m.billing.checkout}</h2>
      <div className="grid max-w-4xl gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>{m.billing.payment}</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckoutForm plan={plan} total={`฿${formatTHB(p.price)}`} testMode={testPaymentsEnabled()} />
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{planLabel(plan, m)}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <dl className="num grid grid-cols-[1fr_auto] gap-y-1.5">
              <dt className="text-muted-foreground">{m.billing.netPrice}</dt>
              <dd className="text-right">฿{formatTHB(net)}</dd>
              <dt className="text-muted-foreground">{m.billing.vat}</dt>
              <dd className="text-right">฿{formatTHB(vat)}</dd>
              <dt className="border-t pt-1.5 font-semibold">{m.billing.total}</dt>
              <dd className="border-t pt-1.5 text-right font-semibold">฿{formatTHB(p.price)}</dd>
            </dl>
            <p>
              <span className="font-medium">{m.billing.covers(bkkDate(start, locale), bkkDate(end, locale))}</span>
              {access.kind === "trial" && ` ${m.billing.afterTrialStart}`}
            </p>
            <p className="text-muted-foreground">{m.billing.noRenew}</p>
            <Link href="/settings/billing" className="text-cobalt underline-offset-4 hover:underline">{m.billing.changePlan}</Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
