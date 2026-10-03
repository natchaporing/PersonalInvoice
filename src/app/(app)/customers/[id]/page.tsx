import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-ui";
import { requireUser } from "@/lib/supabase/server";
import { CustomerForm } from "../customer-form";

export default async function EditCustomer({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (!customer) notFound();
  return (
    <>
      <PageHeader title={customer.name_th} subtitle={customer.name_en ?? undefined} />
      <CustomerForm customer={customer} />
    </>
  );
}
