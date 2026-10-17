import { Download } from "lucide-react";
import { ContractDocument } from "@/components/contract-document";
import { LanguageSwitcher } from "@/components/language-switcher";
import { buttonVariants } from "@/components/ui/button";
import { toContractView } from "@/lib/data/contracts";
import { formatDate } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { contractByToken } from "../data";
import { SignForm } from "./sign-form";

export async function generateMetadata() {
  return { title: `${(await getMessages()).contracts.signTitle} · Tra`, robots: { index: false, follow: false } };
}

/** The client's page behind the private signing link: read the contract, then sign it, then download the copy. */
export default async function SignPage({ params }: PageProps<"/sign/[token]">) {
  const { token } = await params;
  const [m, locale, c] = await Promise.all([getMessages(), getLocale(), contractByToken(token)]);
  const t = m.contracts;
  if (!c) {
    return <main className="mx-auto max-w-xl px-4 py-16 text-center"><p>{t.notOpen}</p></main>;
  }
  const view = toContractView(c);
  const sellerName = locale === "en" ? view.seller.name_en || view.seller.name_th : view.seller.name_th;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="display text-[26px]">{t.signTitle}</h1>
        <div className="rounded-md bg-cobalt-deep p-1 text-white"><LanguageSwitcher /></div>
      </div>
      {c.status === "sent" && <p className="mb-4 text-muted-foreground">{t.signIntro(sellerName)}</p>}
      {c.status === "signed" && c.client_signed_at && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-ok/40 bg-ok/5 px-4 py-3 text-sm text-ok">
          <span>{t.alreadySigned(formatDate(c.client_signed_at.slice(0, 10), locale))}</span>
          <a href={`/sign/${token}/pdf`} className={buttonVariants({ size: "sm" })} download><Download aria-hidden /> {t.downloadSigned}</a>
        </div>
      )}
      <div className="overflow-x-auto rounded-md border bg-white shadow-sm">
        <ContractDocument c={view} />
      </div>
      {c.status === "sent" && c.content_hash && (
        <section className="mt-6 rounded-md border bg-card p-4 sm:p-6">
          <SignForm token={token} hash={c.content_hash} defaultName={view.client.name_th} />
        </section>
      )}
    </main>
  );
}
