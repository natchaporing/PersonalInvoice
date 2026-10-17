import { notFound } from "next/navigation";
import { ContractDocument } from "@/components/contract-document";
import { toContractView } from "@/lib/data/contracts";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Print · Tra" };

/** The contract on A4 pages, for printing and for the PDF. */
export default async function PrintContract({ params }: PageProps<"/print/contracts/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: c } = await supabase.from("contracts").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  return (
    <>
      <style>{`@page { size: A4; margin: 16mm 18mm } html, body { margin: 0; background: #fff }`}</style>
      <ContractDocument c={toContractView(c)} />
    </>
  );
}
