import { PageHeader } from "@/components/app-ui";
import { listDistricts, listProvinces, listSubdistricts } from "@/lib/etax/geo";
import { requireUser } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { Signatories } from "./signatories";

const str = (v: unknown) => (typeof v === "string" ? v : "");

export default async function Settings({ searchParams }: PageProps<"/settings">) {
  const { supabase, user } = await requireUser();
  const confirmed = (await searchParams).confirmed === "1";
  const { data: profile } = await supabase.from("business_profiles").select("*").eq("owner_id", user.id).maybeSingle();
  const { data: people } = await supabase.from("signatories").select("*").order("created_at");
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
      <ProfileForm
        profile={profile}
        defaults={{ name_th: str(user.user_metadata?.full_name), tax_id: str(user.user_metadata?.tax_id), email: user.email ?? "" }}
        provinces={listProvinces()}
        initialDistricts={profile?.addr_province_code ? listDistricts(profile.addr_province_code) : []}
        initialSubdistricts={profile?.addr_district_code ? listSubdistricts(profile.addr_district_code) : []}
      />
      <div className="mt-8 max-w-4xl">
        <Signatories people={people ?? []} />
      </div>
    </>
  );
}
