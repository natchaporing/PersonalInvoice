import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isPlanKey } from "@/lib/domain/billing";
import { planLabel } from "@/lib/billing/labels";
import { getOmiseCharge, omiseEnabled, omiseQrDataUrl, omiseTestMode, settleOmiseCharge } from "@/lib/billing/omise";
import { getMessages } from "@/lib/i18n/server";
import { formatTHB } from "@/lib/thai/money";
import { requireUser } from "@/lib/supabase/server";
import { PaymentWatcher } from "./payment-watcher";

export async function generateMetadata() {
  return { title: `${(await getMessages()).billing.payment} · Tra` };
}

/** Where a PromptPay checkout shows its QR, and where a card returns after 3-D Secure. */
export default async function PayPage({ params }: PageProps<"/settings/billing/pay/[id]">) {
  const { id } = await params;
  const [{ supabase }, m] = await Promise.all([requireUser(), getMessages()]);
  const { data: c } = await supabase.from("billing_charges").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  if (c.status === "paid") redirect(`/settings/billing?paid=${c.id}`);

  // Settle on arrival too, in case the webhook hasn't (or can't) reach us.
  let status = c.status;
  let qr: string | null = null;
  if (status === "pending" && c.provider === "omise" && c.provider_ref && omiseEnabled()) {
    const charge = await getOmiseCharge(c.provider_ref);
    status = await settleOmiseCharge(charge);
    if (status === "paid") redirect(`/settings/billing?paid=${c.id}`);
    if (status === "pending" && c.method === "promptpay") qr = await omiseQrDataUrl(charge);
  }
  const total = `฿${formatTHB(c.amount)}`;
  const plan = isPlanKey(c.plan) ? planLabel(c.plan, m) : c.plan;

  return (
    <>
      <h2 className="mb-4 text-lg font-semibold">{m.billing.payment}</h2>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>{status === "pending" && c.method === "promptpay" ? m.billing.scanTitle : plan}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          {status === "pending" ? (
            <>
              {c.method === "promptpay" && (
                <>
                  <p className="text-muted-foreground">{m.billing.scanHelp}</p>
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a data URL, nothing to optimise
                    <img src={qr} alt={m.billing.scanTitle} className="mx-auto w-64 max-w-full rounded-md border bg-white p-2" />
                  ) : (
                    <p role="alert" className="text-destructive">{m.billing.qrMissing}</p>
                  )}
                </>
              )}
              <p className="text-center text-base font-semibold">{plan} · <span className="num">{m.billing.scanAmount(total)}</span></p>
              <PaymentWatcher chargeId={c.id} card={c.method === "card"} testMode={omiseTestMode() && c.method === "promptpay"} />
            </>
          ) : (
            <>
              <p role="alert">{status === "expired" ? m.billing.payExpired : m.billing.payFailed}</p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/settings/billing/checkout?plan=${c.plan}`} className={buttonVariants()}>{m.billing.tryAgain}</Link>
                <Link href="/settings/billing" className={buttonVariants({ variant: "ghost" })}>{m.billing.backToBilling}</Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
