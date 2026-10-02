import { AuthShell } from "@/components/auth-shell";
import { PLANS, TRIAL_DAYS, yearlySavingPct } from "@/lib/domain/billing";
import { formatTHB } from "@/lib/thai/money";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Start your free trial · Tra" };

const baht = (satang: number) => formatTHB(satang).replace(/\.00$/, "");

export default function RegisterPage() {
  return (
    <AuthShell wide eyebrow="ทดลองใช้ฟรี 15 วัน · Free trial" title="Start your free trial" subtitle="Tax documents for people who work alone. No card needed.">
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_250px]">
        <RegisterForm />
        <aside aria-label="What the trial includes" className="h-fit rounded-md border border-cobalt/20 bg-card/80 p-4 text-sm">
          <div className="display text-[22px] text-cobalt">{TRIAL_DAYS} days of Pro, free</div>
          <ul className="mt-3 grid gap-2">
            <li>Quotations, invoices, receipts and tax invoices</li>
            <li>Instalment billing done right for services</li>
            <li>Signed PDFs your clients can verify by QR</li>
            <li>Withholding certificates and the VAT report</li>
          </ul>
          <div className="mt-4 border-t pt-3">
            <div className="font-medium">After the trial</div>
            <p className="mt-1">
              <span className="num">฿{baht(PLANS.pro_year.price)}</span> a year (save {yearlySavingPct()}%) or <span className="num">฿{baht(PLANS.pro_month.price)}</span> a month, VAT included.
            </p>
            <p className="mt-2 text-muted-foreground">Don&apos;t subscribe and your documents stay yours to view and download. You just can&apos;t issue new ones.</p>
          </div>
          <p className="mt-4 border-t pt-3 text-[12px] text-muted-foreground">For individuals: freelancers and sole proprietors. Company accounts are coming later.</p>
        </aside>
      </div>
    </AuthShell>
  );
}
