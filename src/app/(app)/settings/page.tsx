import { PageHeader } from "@/components/app-ui";
import { requireUser } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function Settings() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("business_profiles").select("*").eq("owner_id", user.id).maybeSingle();
  return (
    <>
      <PageHeader
        eyebrow="ตั้งค่า"
        title="Settings"
        subtitle={profile ? "Your business profile as it appears on every document." : "Set up your business profile before issuing your first document."}
      />
      <ProfileForm profile={profile} />
    </>
  );
}
