import { PageHeader } from "@/components/app-ui";
import { requireUser } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function Settings({ searchParams }: PageProps<"/settings">) {
  const { supabase, user } = await requireUser();
  const confirmed = (await searchParams).confirmed === "1";
  const { data: profile } = await supabase.from("business_profiles").select("*").eq("owner_id", user.id).maybeSingle();
  return (
    <>
      <PageHeader
        eyebrow="ตั้งค่า"
        title="Settings"
        subtitle={profile ? "Your business profile as it appears on every document." : "Set up your business profile before issuing your first document."}
      />
      {confirmed && (
        <p role="status" className="mb-5 max-w-4xl rounded-md border border-ok/40 bg-ok/5 px-4 py-3 text-sm text-ok">
          Email confirmed. Welcome! Start by filling in your business profile.
        </p>
      )}
      <ProfileForm profile={profile} />
    </>
  );
}
