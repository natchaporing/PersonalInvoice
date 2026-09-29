import { PageHeader } from "@/components/app-ui";
import { GuillocheBackground, Rosette } from "@/components/banknote";

/** Placeholder for screens that arrive with the Supabase data layer. */
export function ComingSoon({ eyebrow, title, description, items }: { eyebrow: string; title: string; description: string; items: string[] }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={description} />
      <section className="relative overflow-hidden rounded-lg border border-dashed border-cobalt/40 bg-paper p-8">
        <GuillocheBackground opacity={0.07} />
        <Rosette size={200} tone="mono" opacity={0.18} className="absolute -right-10 -bottom-12 hidden sm:block" />
        <div className="relative max-w-[56ch]">
          <div className="eyebrow text-cobalt">Planned for this screen</div>
          <ul className="mt-3 space-y-1.5">
            {items.map((i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-amber" />
                {i}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[13px] text-muted-foreground">Arrives with login and saving to Supabase.</p>
        </div>
      </section>
    </>
  );
}
