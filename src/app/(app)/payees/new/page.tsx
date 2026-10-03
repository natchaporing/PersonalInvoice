import { PageHeader } from "@/components/app-ui";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";
import { PayeeForm } from "../payee-form";

export default async function NewPayee({ searchParams }: PageProps<"/payees/new">) {
  await requireUser();
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : undefined;
  return (
    <>
      <PageHeader title={(await getMessages()).payees.newTitle} />
      <PayeeForm next={next} />
    </>
  );
}
