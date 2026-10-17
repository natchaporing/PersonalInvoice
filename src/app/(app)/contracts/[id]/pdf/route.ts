import { contractPdf } from "@/lib/pdf/contract-pdf";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: RouteContext<"/contracts/[id]/pdf">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase.from("contracts").select("number, status").eq("id", id).maybeSingle();
  if (!c) return new Response("not found", { status: 404 });
  return contractPdf(`/print/contracts/${id}`, c);
}
