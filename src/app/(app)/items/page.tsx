import { ComingSoon } from "@/components/coming-soon";

export default function Items() {
  return (
    <ComingSoon
      eyebrow="สินค้า/บริการ"
      title="Items"
      description="Products and services you sell, reusable on any document."
      items={["Thai and English descriptions and units", "Default unit price", "Default withholding rate (e.g. 3% for services)"]}
    />
  );
}
