import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Tra" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  const linkFailed = sp.error === "confirm_failed";
  return (
    <AuthShell eyebrow="เอกสารภาษีของคนทำงานคนเดียว" title="Sign in" subtitle="Your invoices, tax invoices and receipts.">
      <LoginForm next={next} linkFailed={linkFailed} />
    </AuthShell>
  );
}
