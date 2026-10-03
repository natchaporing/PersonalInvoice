import { AuthShell } from "@/components/auth-shell";
import { getMessages } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";

export async function generateMetadata() {
  return { title: `${(await getMessages()).auth.signInTitle} · Tra` };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  const linkFailed = sp.error === "confirm_failed";
  const m = await getMessages();
  return (
    <AuthShell eyebrow={m.common.tagline} title={m.auth.signInTitle} subtitle={m.auth.signInSubtitle}>
      <LoginForm next={next} linkFailed={linkFailed} />
    </AuthShell>
  );
}
