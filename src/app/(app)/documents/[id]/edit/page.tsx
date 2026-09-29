import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/app-ui";
import { DOC_TYPE_LABEL } from "@/lib/domain/documents";
import { requireUser } from "@/lib/supabase/server";
import { DocumentEditor } from "../../editor";
import { editorContext, valueFromDocument } from "../../editor-data";

export default async function EditDocument({ params }: PageProps<"/documents/[id]/edit">) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const [{ data: doc }, { data: lines }] = await Promise.all([
    supabase.from("documents").select("*").eq("id", id).maybeSingle(),
    supabase.from("document_lines").select("*").eq("document_id", id),
  ]);
  if (!doc) notFound();
  if (doc.status !== "draft") redirect(`/documents/${id}`);
  const ctx = await editorContext(supabase, user.id);
  return (
    <>
      <PageHeader eyebrow="แก้ไขฉบับร่าง" title={`Edit draft ${DOC_TYPE_LABEL[doc.doc_type].en.toLowerCase()}`} />
      <DocumentEditor id={id} initial={valueFromDocument(doc, lines ?? [])} {...ctx} />
    </>
  );
}
