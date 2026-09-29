import { PageHeader } from "@/components/app-ui";
import { requireUser } from "@/lib/supabase/server";
import { ItemForm } from "../item-form";

export default async function NewItem() {
  await requireUser();
  return (
    <>
      <PageHeader eyebrow="สินค้า/บริการใหม่" title="New item" />
      <ItemForm />
    </>
  );
}
