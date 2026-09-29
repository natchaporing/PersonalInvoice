import { PageHeader } from "@/components/ui";
import { DocumentEditor } from "./editor";

export default function NewDocument() {
  return (
    <>
      <PageHeader eyebrow="สร้างเอกสารใหม่" title="New document" subtitle="The preview is the document your customer receives." />
      <DocumentEditor />
    </>
  );
}
