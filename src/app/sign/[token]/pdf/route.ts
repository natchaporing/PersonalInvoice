import { contractPdf } from "@/lib/pdf/contract-pdf";
import { contractByToken } from "../../data";

/** The client's copy through the signing link. */
export async function GET(_: Request, { params }: RouteContext<"/sign/[token]/pdf">) {
  const { token } = await params;
  const c = await contractByToken(token);
  if (!c) return new Response("not found", { status: 404 });
  return contractPdf(`/sign/${token}/print`, c);
}
