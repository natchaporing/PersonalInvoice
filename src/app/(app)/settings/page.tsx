import { ComingSoon } from "@/components/coming-soon";

export default function Settings() {
  return (
    <ComingSoon
      eyebrow="ตั้งค่า"
      title="Settings"
      description="Your business profile as it appears on every document."
      items={[
        "Legal name, address and 13-digit tax ID (Thai and English)",
        "Head office / branch number",
        "PromptPay ID for the payment QR",
        "Logo and signature image",
        "VAT rate (currently 7%)",
      ]}
    />
  );
}
