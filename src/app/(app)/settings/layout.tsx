import { PageHeader } from "@/components/app-ui";
import { getMessages } from "@/lib/i18n/server";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsLayout({ children }: LayoutProps<"/settings">) {
  const m = await getMessages();
  return (
    <>
      <PageHeader title={m.settings.title} subtitle={m.settings.subtitle} />
      <SettingsTabs />
      {children}
    </>
  );
}
