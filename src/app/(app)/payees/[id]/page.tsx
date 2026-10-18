import { ListChecks } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";
import { PayeeForm } from "../payee-form";

export default async function EditPayee({ params }: PageProps<"/payees/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const [{ data: payee }, { data: rows }] = await Promise.all([
    supabase.from("commission_payees").select("*").eq("id", id).maybeSingle(),
    supabase.from("commissions").select("amount, wht").eq("payee_id", id).is("paid_on", null),
  ]);
  if (!payee) notFound();
  const t = (await getMessages()).payees;
  const owed = (rows ?? []).reduce((s, r) => s + r.amount - r.wht, 0);
  return (
    <>
      <PageHeader
        title={payee.name}
        subtitle={owed > 0 ? t.stillToTransfer(formatTHB(owed)) : undefined}
        actions={<Button asChild variant="outline"><Link href={`/payees/commissions?payee=${payee.id}`}><ListChecks /> {t.viewCommissions}</Link></Button>}
      />
      <PayeeForm payee={payee} />
    </>
  );
}
