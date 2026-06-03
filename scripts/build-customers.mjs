// CLI: leest data/identiteit.csv + data/product.csv, joint + scoort + leidt
// acties af, en schrijft data/customers.json (de private Twilio-Asset bron).
//
//   node scripts/build-customers.mjs
//
// LET OP: data/customers.json bevat persoonsgegevens. Commit géén echte
// dataset; alleen dummy-data. Zie data/.gitignore.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildCustomers } from "./enrich.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const identiteit = readFileSync(join(root, "data/identiteit.csv"), "utf8");
const product = readFileSync(join(root, "data/product.csv"), "utf8");

const result = buildCustomers(identiteit, product);

const outPath = join(root, "data/customers.json");
writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n", "utf8");

console.log(`✓ ${result.count} klant(en) verrijkt → ${outPath}`);
for (const r of result.records) {
  console.log(
    `  ${r.phone}  ${r.name}  [${r.segment}]  value=${r.customerValueScore}  prio=${r.priority}  acties=${r.actions.length}`
  );
}
