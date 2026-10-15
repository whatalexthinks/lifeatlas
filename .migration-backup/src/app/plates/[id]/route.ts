import { plates, renderPlateSvg } from "@/lib/plates";

/**
 * Sample illustrations as cacheable images. Marketing pages reference these URLs instead of
 * inlining ~20 KB of SVG per picture, so pages stay light and images load lazily.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(plates).map((id) => ({ id }));
}

export async function GET(_request: Request, { params }: RouteContext<"/plates/[id]">) {
  const { id } = await params;
  const svg = renderPlateSvg(id);
  if (!svg) return new Response("Not found", { status: 404 });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
