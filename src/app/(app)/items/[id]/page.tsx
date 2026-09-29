import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-ui";
import { requireUser } from "@/lib/supabase/server";
import { ItemForm } from "../item-form";

export default async function EditItem({ params }: PageProps<"/items/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: item } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  if (!item) notFound();
  return (
    <>
      <PageHeader eyebrow="สินค้า/บริการ" title={item.name_th} subtitle={item.name_en ?? undefined} />
      <ItemForm item={item} />
    </>
  );
}
