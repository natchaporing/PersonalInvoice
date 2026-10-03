import { PageHeader } from "@/components/app-ui";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";
import { DocumentEditor } from "../editor";
import { editorContext, initialValue } from "../editor-data";

export default async function NewDocument({ searchParams }: PageProps<"/documents/new">) {
  const { supabase, user } = await requireUser();
  const sp = await searchParams;
  const [ctx, initial] = await Promise.all([editorContext(supabase, user.id), initialValue(supabase, sp)]);
  return (
    <>
      <PageHeader title={(await getMessages()).docs.editor.newTitle} subtitle={(await getMessages()).docs.editor.newSubtitle} />
      <DocumentEditor initial={initial} {...ctx} />
    </>
  );
}
