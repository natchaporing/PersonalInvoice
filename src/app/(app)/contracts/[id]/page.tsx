import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-ui";
import { ContractDocument } from "@/components/contract-document";
import { Card, CardContent } from "@/components/ui/card";
import { toContractView } from "@/lib/data/contracts";
import { stampDuty } from "@/lib/domain/contracts";
import { todayBangkok } from "@/lib/domain/documents";
import { formatDate } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";
import { ContractActions } from "./contract-actions";
import { ContractEditor } from "./contract-editor";

export async function generateMetadata({ params }: PageProps<"/contracts/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("contracts").select("number").eq("id", id).maybeSingle();
  return { title: `${data?.number ?? "Contract"} · Tra` };
}

export default async function ContractPage({ params }: PageProps<"/contracts/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [m, locale] = await Promise.all([getMessages(), getLocale()]);
  const t = m.contracts;
  const { data: c } = await supabase.from("contracts").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  const view = toContractView(c);
  const duty = `฿${formatTHB(stampDuty(view.facts.taxable)).replace(/\.00$/, "")}`;
  const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const signUrl = c.sign_token ? `${base}/sign/${c.sign_token}` : null;
  const signedAt = c.client_signed_at ? formatDate(c.client_signed_at.slice(0, 10), locale) : null;
  const eStampBy = c.client_signed_at ? formatDate(todayBangkok(new Date(new Date(c.client_signed_at).getTime() + 15 * 86_400_000)), locale) : null;

  return (
    <>
      <PageHeader
        title={c.number}
        subtitle={`${t.status[c.status]} · ${view.client.name_th} · ${view.facts.quotationNumber}`}
      />
      <div className="mb-6 grid gap-4">
        <ContractActions id={id} status={c.status} signUrl={signUrl} today={todayBangkok()} />
        <Card>
          <CardContent className="grid gap-1.5 text-sm">
            <div>
              {t.colQuotation}: <Link href={`/documents/${c.quotation_id}`} className="num text-cobalt underline-offset-4 hover:underline">{view.facts.quotationNumber}</Link>
            </div>
            {c.status === "signed" && signedAt && <div className="text-ok">{t.signedBy(c.client_signer_name ?? view.client.name_th, signedAt, c.signed_via === "online")}</div>}
            {c.status === "signed" && c.signed_via === "online" && eStampBy ? (
              <div className="rounded-md border border-amber/60 bg-amber/10 px-3 py-2">{t.stampOnline(duty, eStampBy)}</div>
            ) : (
              c.status !== "void" && <div className="text-muted-foreground">{t.stampPaper(duty)}</div>
            )}
            {c.content_hash && <div className="text-[12px] break-all text-muted-foreground">{t.fingerprint}: {c.content_hash}</div>}
          </CardContent>
        </Card>
      </div>
      {c.status === "draft" ? (
        <ContractEditor
          id={id}
          base={view}
          initial={{ lang: c.lang, contract_date: c.contract_date, place: c.place, start_date: c.start_date, end_date: c.end_date, clauses: view.clauses }}
        />
      ) : (
        <div className="overflow-x-auto rounded-md border bg-white shadow-sm">
          <ContractDocument c={view} />
        </div>
      )}
    </>
  );
}
