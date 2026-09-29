import { PageHeader } from "@/components/ui";
import { DocumentEditor } from "./editor";

export default function NewDocument() {
  return (
    <>
      <PageHeader title="New document" subtitle="สร้างเอกสารใหม่" />
      <DocumentEditor />
    </>
  );
}
