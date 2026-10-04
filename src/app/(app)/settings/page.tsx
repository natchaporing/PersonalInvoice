import { listDistricts, listProvinces, listSubdistricts } from "@/lib/etax/geo";
import { getMessages } from "@/lib/i18n/server";
import { operator } from "@/lib/operator";
import { requireUser } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { Signatories } from "./signatories";
import { YourData } from "./your-data";

const str = (v: unknown) => (typeof v === "string" ? v : "");

export default async function Settings({ searchParams }: PageProps<"/settings">) {
  const { supabase, user } = await requireUser();
  const confirmed = (await searchParams).confirmed === "1";
  const m = await getMessages();
  const { data: profile } = await supabase.from("business_profiles").select("*").eq("owner_id", user.id).maybeSingle();
  const { data: people } = await supabase.from("signatories").select("*").order("created_at");
  return (
    <>
      {confirmed && (
        <p role="status" className="mb-5 max-w-4xl rounded-md border border-ok/40 bg-ok/5 px-4 py-3 text-sm text-ok">
          {m.settings.confirmed}
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
      <div className="mt-8 max-w-4xl">
        <YourData m={m} contactEmail={operator().email} accountEmail={user.email ?? ""} />
      </div>
    </>
  );
}
