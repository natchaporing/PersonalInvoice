import { PageHeader } from "@/components/app-ui";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";
import { CustomerForm } from "../customer-form";

export default async function NewCustomer({ searchParams }: PageProps<"/customers/new">) {
  await requireUser();
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : undefined;
  return (
    <>
      <PageHeader title={(await getMessages()).customers.newTitle} />
      <CustomerForm next={next} />
    </>
  );
}
