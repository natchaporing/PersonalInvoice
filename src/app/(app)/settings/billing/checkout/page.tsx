import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isPlanKey, nextPeriod, PLANS, vatInclusive } from "@/lib/domain/billing";
import { bkkDate, getAccess, testPaymentsEnabled } from "@/lib/billing/access";
import { formatTHB } from "@/lib/thai/money";
import { CheckoutForm } from "./checkout-form";

export const metadata = { title: "Checkout · Tra" };

export default async function CheckoutPage({ searchParams }: PageProps<"/settings/billing/checkout">) {
  const plan = (await searchParams).plan;
  if (!isPlanKey(plan)) redirect("/settings/billing");
  const p = PLANS[plan];
  const { sub, access } = await getAccess();
  if (access.kind === "comp") redirect("/settings/billing");
  const { net, vat } = vatInclusive(p.price);

  const { start: starts, end: ends } = nextPeriod(sub, plan);

  return (
    <>
      <h2 className="mb-4 text-lg font-semibold">Checkout · ชำระเงิน</h2>
      <div className="grid max-w-4xl gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckoutForm plan={plan} total={`฿${formatTHB(p.price)}`} testMode={testPaymentsEnabled()} />
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{p.label}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <dl className="num grid grid-cols-[1fr_auto] gap-y-1.5">
              <dt className="text-muted-foreground">Price before VAT</dt>
              <dd className="text-right">฿{formatTHB(net)}</dd>
              <dt className="text-muted-foreground">VAT 7%</dt>
              <dd className="text-right">฿{formatTHB(vat)}</dd>
              <dt className="border-t pt-1.5 font-semibold">Total</dt>
              <dd className="border-t pt-1.5 text-right font-semibold">฿{formatTHB(p.price)}</dd>
            </dl>
            <p>
              Covers <span className="font-medium">{bkkDate(starts)} – {bkkDate(ends)}</span>.
              {access.kind === "trial" && " It starts when your free trial ends, so you keep your remaining trial days."}
            </p>
            <p className="text-muted-foreground">The plan doesn&apos;t renew by itself.</p>
            <Link href="/settings/billing" className="text-cobalt underline-offset-4 hover:underline">Change plan</Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
