import { ART, type ArtName } from "@/lib/banknote/art";

// Every artwork is prerendered at build time; unknown names 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ART).map((name) => ({ name: `${name}.svg` }));
}

export async function GET(_request: Request, { params }: RouteContext<"/art/[name]">) {
  const { name } = await params;
  const key = name.replace(/\.svg$/, "") as ArtName;
  const render = ART[key];
  if (!render) return new Response("Not found", { status: 404 });
  return new Response(render(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
