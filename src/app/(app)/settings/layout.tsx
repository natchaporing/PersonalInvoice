import { PageHeader } from "@/components/app-ui";
import { SettingsTabs } from "./settings-tabs";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <>
      <PageHeader eyebrow="ตั้งค่า" title="Settings" subtitle="Your business profile, signatories and plan." />
      <SettingsTabs />
      {children}
    </>
  );
}
