import { notFound } from "next/navigation";
import { ContractDocument } from "@/components/contract-document";
import { toContractView } from "@/lib/data/contracts";
import { contractByToken } from "../../data";

export const metadata = { title: "Print · Tra", robots: { index: false, follow: false } };

export default async function PrintSignedContract({ params }: PageProps<"/sign/[token]/print">) {
  const { token } = await params;
  const c = await contractByToken(token);
  if (!c) notFound();
  return (
    <>
      <style>{`@page { size: A4; margin: 16mm 18mm } html, body { margin: 0; background: #fff }`}</style>
      <ContractDocument c={toContractView(c)} />
    </>
  );
}
