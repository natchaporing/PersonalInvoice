"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/lib/i18n/client";
import { chargeStatus, simulatePayment } from "../../actions";

const POLL_MS = 3000;

/** Asks the server every few seconds whether the payment has arrived, and moves on when it has. */
export function PaymentWatcher({ chargeId, card, testMode }: { chargeId: string; card: boolean; testMode: boolean }) {
  const m = useMessages();
  const router = useRouter();
  const [simulating, start] = useTransition();

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      if (stop) return;
      const status = await chargeStatus(chargeId).catch(() => "pending" as const);
      if (stop) return;
      if (status === "paid") router.replace(`/settings/billing?paid=${chargeId}`);
      else if (status !== "pending") router.refresh();
      else timer = setTimeout(tick, POLL_MS);
    };
    let timer = setTimeout(tick, POLL_MS);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [chargeId, router]);

  return (
    <div className="grid gap-3">
      <p role="status" className="flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {card ? m.billing.waitingCard : m.billing.waiting}
      </p>
      {testMode && (
        <Button
          type="button"
          variant="outline"
          disabled={simulating}
          onClick={() =>
            start(async () => {
              if ((await simulatePayment(chargeId)) === "paid") router.replace(`/settings/billing?paid=${chargeId}`);
            })
          }
        >
          {m.billing.simulate}
        </Button>
      )}
    </div>
  );
}
