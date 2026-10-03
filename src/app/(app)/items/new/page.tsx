import { getMessages } from "@/lib/i18n/server";
import { PageHeader } from "@/components/app-ui";
import { requireUser } from "@/lib/supabase/server";
import { ItemForm } from "../item-form";

export default async function NewItem() {
  await requireUser();
  return (
    <>
      <PageHeader title={(await getMessages()).items.newTitle} />
      <ItemForm />
    </>
  );
}
