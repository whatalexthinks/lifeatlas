import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { plates, renderPlateSvg } from "../src/lib/plates/index";

// Next's /plates/[id] route was static: emit the identical SVG bytes for Vite.
const out = fileURLToPath(new URL("../public/plates/", import.meta.url));
await mkdir(out, { recursive: true });
await Promise.all(Object.keys(plates).map(async (id) => {
  const svg = renderPlateSvg(id);
  if (!svg) throw new Error(`Unable to render illustration: ${id}`);
  await writeFile(`${out}/${id}`, svg);
}));
console.log(`Prepared ${Object.keys(plates).length} original sample illustrations.`);
