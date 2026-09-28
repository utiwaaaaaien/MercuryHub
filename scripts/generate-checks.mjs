import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import sites from "../lib/sites.json" with { type: "json" };
import { checkLink } from "../lib/check-link.ts";

const output = process.argv[2];
if (!output) throw new Error("Usage: generate-checks.mjs <output.json>");

const results = {};
for (const [index, site] of sites.entries()) {
  const result = await checkLink(site, { location: "GitHub Actions 服务器网络" });
  results[site.id] = result;
  console.log(`${index + 1}/${sites.length} ${site.id}: ${result.state}${result.statusCode ? ` (${result.statusCode})` : ""}`);
  if (index < sites.length - 1) await new Promise(resolve => setTimeout(resolve, 500));
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2) + "\n");
console.log(`Wrote ${sites.length} results to ${output}`);
