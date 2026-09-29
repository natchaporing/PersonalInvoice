import { PageHeader } from "@/components/app-ui";
import { requireUser } from "@/lib/supabase/server";
import { DocumentEditor } from "../editor";
import { editorContext, initialValue } from "../editor-data";

export default async function NewDocument({ searchParams }: PageProps<"/documents/new">) {
  const { supabase, user } = await requireUser();
  const sp = await searchParams;
  const [ctx, initial] = await Promise.all([editorContext(supabase, user.id), initialValue(supabase, sp)]);
  return (
    <>
      <PageHeader eyebrow="สร้างเอกสารใหม่" title="New document" subtitle="Saved as a draft first. Issuing assigns the number and signs the PDF." />
      <DocumentEditor initial={initial} {...ctx} />
    </>
  );
}
