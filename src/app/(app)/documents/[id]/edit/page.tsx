import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/app-ui";
import { docTypeLabel } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
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
      <PageHeader title={(await getMessages()).docs.editor.editTitle(docTypeLabel(doc.doc_type, await getLocale()))} />
      <DocumentEditor id={id} initial={valueFromDocument(doc, lines ?? [])} {...ctx} />
    </>
  );
}
