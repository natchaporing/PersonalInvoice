import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { ContractView } from "@/components/contract-document";
import { type Clause, type ContractFacts, contractCanonical } from "@/lib/domain/contracts";
import type { CustomerSnapshot, SellerSnapshot, SignatorySnapshot } from "@/lib/domain/documents";
import type { Tables } from "@/lib/supabase/database.types";

export type ContractRow = Tables<"contracts">;

/** A stored contract as the printed layout needs it. */
export function toContractView(c: Omit<ContractRow, "owner_id" | "client_sign_ip" | "client_sign_ua"> & Partial<ContractRow>): ContractView {
  return {
    number: c.number,
    status: c.status as ContractView["status"],
    lang: c.lang,
    contractDate: c.contract_date,
    place: c.place,
    start: c.start_date,
    end: c.end_date,
    clauses: (c.clauses ?? []) as unknown as Clause[],
    facts: c.facts as unknown as ContractFacts,
    seller: c.seller_snapshot as unknown as SellerSnapshot,
    client: c.client_snapshot as unknown as CustomerSnapshot,
    ownerSigner: (c.owner_signer ?? null) as unknown as SignatorySnapshot | null,
    contentHash: c.content_hash,
    clientSignedAt: c.client_signed_at,
    clientSignerName: c.client_signer_name,
    clientSignature: c.client_signature,
    signedVia: (c.signed_via ?? null) as ContractView["signedVia"],
  };
}

/** sha256 of exactly what the client agrees to. */
export const contractHash = (c: Parameters<typeof contractCanonical>[0]) => createHash("sha256").update(contractCanonical(c)).digest("hex");

/** A private, unguessable signing link token. */
export const newSignToken = () => randomBytes(24).toString("base64url");
