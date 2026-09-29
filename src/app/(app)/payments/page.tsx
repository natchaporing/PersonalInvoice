import { ComingSoon } from "@/components/coming-soon";

export default function Payments() {
  return (
    <ComingSoon
      eyebrow="การรับชำระ"
      title="Payments"
      description="Money received against issued documents."
      items={[
        "Record full or partial payments (bank transfer, cheque, cash)",
        "Attach transfer slips",
        "Store 50 Tawi withholding certificates you receive",
        "Mark invoices paid and issue the receipt",
      ]}
    />
  );
}
