import { ComingSoon } from "@/components/coming-soon";

export default function Tax() {
  return (
    <ComingSoon
      eyebrow="ภาษี"
      title="Tax & VAT"
      description="Monthly figures for filing."
      items={[
        "Output VAT summary per month for PP30 (due the 15th, or the 23rd e-filing)",
        "Withholding tax credits held, for PND 90/91",
        "CSV / Excel export for your accountant",
      ]}
    />
  );
}
