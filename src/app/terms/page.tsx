import Link from "next/link";
import { PLANS, TRIAL_DAYS } from "@/lib/domain/billing";
import { formatTHB } from "@/lib/thai/money";

export const metadata = { title: "Terms and privacy · Tra" };

// DRAFT. Have a Thai lawyer review this page before charging customers. Bracketed items are yours to fill in.
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-[15px] leading-relaxed">
      <p className="rounded-md border border-amber/60 bg-amber/10 px-3 py-2 text-sm">Draft for review. Not yet in force.</p>

      <h1 className="display mt-6 text-[32px]">Terms of service</h1>
      <p className="text-muted-foreground">Tra (trasolutions.co), operated by [operator name and tax ID].</p>

      <h2 className="mt-6 text-lg font-semibold">The service</h2>
      <p>Tra lets an individual create, issue and sign quotations, invoices, receipts, tax invoices and related documents. You are responsible for what your documents say and for your own tax filings. Tra is not an accounting or tax advisory service.</p>

      <h2 className="mt-6 text-lg font-semibold">Who can use it</h2>
      <p>Tra is for individuals (natural persons), such as freelancers and sole proprietors. Company accounts are not offered yet.</p>

      <h2 className="mt-6 text-lg font-semibold">Free trial and payment</h2>
      <p>
        A new account gets {TRIAL_DAYS} days of Pro free, with no card needed. After that, issuing documents needs a paid plan: ฿{formatTHB(PLANS.pro_year.price)} a year or ฿
        {formatTHB(PLANS.pro_month.price)} a month, VAT included. A paid period starts when your trial or current period ends, so paying early never loses days. We
        issue a receipt/tax invoice for every payment. [Refund policy.]
      </p>

      <h2 className="mt-6 text-lg font-semibold">If you stop paying</h2>
      <p>Your documents stay available to view and download. You can&apos;t issue new documents until you subscribe again.</p>

      <h2 className="mt-6 text-lg font-semibold">Liability</h2>
      <p>[Limitation of liability, for example capped at the fees you paid in the previous 12 months.]</p>

      <h1 id="privacy" className="display mt-12 scroll-mt-6 text-[32px]">Privacy notice</h1>
      <p className="text-muted-foreground">Under the Personal Data Protection Act B.E. 2562 (PDPA).</p>

      <h2 className="mt-6 text-lg font-semibold">What we collect and why</h2>
      <ul className="list-disc pl-5">
        <li>Your name, tax ID, email, address and bank details: to put them on your documents and run your account.</li>
        <li>Your clients&apos; details and your documents: to provide the service on your behalf. For this data, you are the controller and Tra is your processor.</li>
        <li>Payment records: to bill you and to meet tax law.</li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">How long we keep it</h2>
      <p>Issued tax documents are kept for at least 5 years, as Thai tax law requires. [Other retention periods.]</p>

      <h2 className="mt-6 text-lg font-semibold">Your rights</h2>
      <p>You can ask to see, correct, export or delete your data, subject to the retention above. Contact [contact email].</p>

      <h2 className="mt-6 text-lg font-semibold">Where it is stored</h2>
      <p>[Hosting providers and regions, for example Supabase and Railway.]</p>

      <p className="mt-10"><Link href="/register" className="text-cobalt underline">Back to registration</Link></p>
    </main>
  );
}
