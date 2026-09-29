import { Sidebar } from "@/components/sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[232px_1fr]">
      <aside className="border-b-4 border-secondary bg-brand md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r-4">
        <Sidebar />
      </aside>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
