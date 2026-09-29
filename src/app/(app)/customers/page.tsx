import { ComingSoon } from "@/components/coming-soon";

export default function Customers() {
  return (
    <ComingSoon
      eyebrow="ลูกค้า"
      title="Customers"
      description="The people and companies you bill."
      items={[
        "Thai and English names and addresses",
        "13-digit tax ID and head office / branch number",
        "Company (PND 53) or individual (PND 3), which sets the withholding form",
        "Document history and outstanding balance per customer",
      ]}
    />
  );
}
