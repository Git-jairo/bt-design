// Generates data/customers.json directly — no CSV pipeline.
// Run: node scripts/generate-customers.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ─── People ──────────────────────────────────────────────────────────────────

const jury = [
  { id: "CID-JURY001", firstName: "Maarten",  lastName: "Boom",                  phone: "+31620250568" },
  { id: "CID-JURY002", firstName: "Floris",   lastName: "de Haes",               phone: "+31643909291" },
  { id: "CID-JURY003", firstName: "Ella",     lastName: "Tupan",                 phone: "+31640087321" },
  { id: "CID-JURY004", firstName: "Sven",     lastName: "Pronk",                 phone: "+31641609244" },
  { id: "CID-JURY005", firstName: "Sjef",     lastName: "Peeraer",               phone: "+31651197847" },
];

const colleagues = [
  { id: "CID-COLL001", firstName: "Ralph",    lastName: "Thoen",                 phone: "+31620091818" },
  { id: "CID-COLL002", firstName: "Mark",     lastName: "Zaal",                  phone: "+31624809069" },
  { id: "CID-COLL003", firstName: "James",    lastName: "Chowen",                phone: "+31657804251" },
  { id: "CID-COLL004", firstName: "Jairo",    lastName: "in der Beeck",          phone: "+31610487300" },
  { id: "CID-COLL005", firstName: "Jaco",     lastName: "Viljoen",               phone: "+31610000010" },
  { id: "CID-COLL006", firstName: "Riaan",    lastName: "Vorster",               phone: "+31610000011" },
  { id: "CID-COLL007", firstName: "Kyle",     lastName: "Herring",               phone: "+31610000012" },
  { id: "CID-COLL008", firstName: "Myrna",    lastName: "Welling",               phone: "+31610000013" },
  { id: "CID-COLL009", firstName: "Lucas",    lastName: "Vilela Afonso Oliveira",phone: "+31610000014" },
  { id: "CID-COLL010", firstName: "Krista",   lastName: "Jansen",                phone: "+31610000015" },
  { id: "CID-COLL011", firstName: "Annike",   lastName: "Vorster",               phone: "+31610000016" },
  { id: "CID-COLL012", firstName: "Joost",    lastName: "van Uem",               phone: "+31610000017" },
  { id: "CID-COLL013", firstName: "Maksym",   lastName: "Martynenko",            phone: "+31610000018" },
  { id: "CID-COLL014", firstName: "Miguel",   lastName: "Perez Lorenzo",         phone: "+31610000019" },
  { id: "CID-COLL015", firstName: "April",    lastName: "te Spenke",             phone: "+31610000020" },
  { id: "CID-COLL016", firstName: "Bram",     lastName: "ter Laak",              phone: "+31610000021" },
  { id: "CID-COLL017", firstName: "Floris",   lastName: "van der Velde",         phone: "+31610000022" },
  { id: "CID-COLL018", firstName: "Kirsty",   lastName: "Donkers",               phone: "+31610000023" },
  { id: "CID-COLL019", firstName: "Bram",     lastName: "Vos",                   phone: "+31610000024" },
  { id: "CID-COLL020", firstName: "Patrick",  lastName: "Hoette",                phone: "+31610000025" },
  { id: "CID-COLL021", firstName: "Demi",     lastName: "de Bruin",              phone: "+31610000026" },
  { id: "CID-COLL022", firstName: "Davy",     lastName: "Vugs",                  phone: "+31610000027" },
  { id: "CID-COLL023", firstName: "Renze",    lastName: "Feitsma",               phone: "+31610000028" },
  { id: "CID-COLL024", firstName: "Tjeerd",   lastName: "Bakker",                phone: "+31610000029" },
  { id: "CID-COLL025", firstName: "James",    lastName: "van Antwerpen",         phone: "+31610000030" },
  { id: "CID-COLL026", firstName: "Marijn",   lastName: "Langhout",              phone: "+31610000031" },
  { id: "CID-COLL027", firstName: "Dora",     lastName: "Ocampo Góez",           phone: "+31610000032" },
  { id: "CID-COLL028", firstName: "Rogier",   lastName: "Verkoren",              phone: "+31610000033" },
  { id: "CID-COLL029", firstName: "Lisa",     lastName: "de Bruijn",             phone: "+31610000034" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function seededRand(seed) {
  // Simple deterministic LCG so output is stable per run but varied per person
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pick(arr, r) { return arr[Math.floor(r() * arr.length)]; }
function between(lo, hi, r) { return Math.round(lo + r() * (hi - lo)); }

function slugName(firstName, lastName) {
  return (firstName + "." + lastName)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9.]/g, "");
}

// ─── Record builder ───────────────────────────────────────────────────────────

function buildRecord(person, isJury, customerNum) {
  const seed = person.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = seededRand(seed);

  // Products
  const hasEnergy   = true;
  const hasMobile   = r() > 0.4;
  const hasInternet = r() > 0.5;
  const numProducts = 1 + (hasMobile ? 1 : 0) + (hasInternet ? 1 : 0);
  const isMulti     = numProducts > 1;
  const productsArr = ["energy", ...(hasMobile ? ["mobile"] : []), ...(hasInternet ? ["internet"] : [])];

  // Scores
  const tenureMonths    = isJury ? 48 : between(0, 60, r);
  const propensityScore = isJury ? 100 : between(10, 90, r);
  const churnRiskScore  = isJury ? 0   : between(0, 80, r);

  const productScore    = Math.min(50, numProducts * 15 + (isMulti ? 15 : 0));
  const loyaltyScore    = Math.min(25, (tenureMonths / 48) * 25);
  const potentialScore  = (propensityScore / 100) * 25;
  const customerValueScore = Math.round(Math.min(100, productScore + loyaltyScore + potentialScore));

  const churnHigh       = churnRiskScore >= 60;
  const propensityHigh  = propensityScore >= 70;
  const churnSegment    = churnRiskScore >= 60 ? "high" : churnRiskScore >= 30 ? "medium" : "low";
  const propensitySegment = propensityScore >= 70 ? "high" : propensityScore >= 40 ? "medium" : "low";
  const contractEnding90d = !isJury && r() > 0.75;
  const tariffType      = pick(["Fixed", "VariableByMonth"], r);

  // Segment
  let segment;
  if (churnHigh)                        segment = "Risico op churn";
  else if (tenureMonths === 0)          segment = "Nieuw";
  else if (customerValueScore >= 85)    segment = "Premium";
  else                                  segment = "Standaard";

  const priority = isJury ? 1000 : customerValueScore >= 85 ? 1000 : 0;
  const tag      = customerValueScore >= 85 ? "High Value Customer" : null;

  // Actions
  const actions = [];

  if (churnHigh) {
    actions.push({
      type: "retentie",
      label: "Hoog opzegrisico — bied direct excuses aan voor de slechte ervaring.",
      guidance: "Laat de klant niet wachten. Begin meteen: 'Ik ga dit nu voor u oplossen.' Door direct actie te nemen creëer je respect én acceptatie — de klant voelt dat je het meent.",
    });
    actions.push({
      type: "retentie",
      label: "Bied een retentiedeal aan (korting of gratis maand) — goedkeuring leidinggevende niet nodig onder €25.",
      guidance: "Noem de deal proactief, niet als reactie op dreigen. 'Ik heb iets voor u klaargezet' werkt beter dan 'Als u blijft, dan…'",
    });
  }

  if (contractEnding90d) {
    actions.push({
      type: "retentie",
      label: "Contract loopt af binnen 90 dagen — bespreek verlenging.",
      guidance: "Stel open: 'Wat vond u het afgelopen jaar?' Luister eerst, verleng daarna pas het gesprek richting contract.",
    });
  }

  if (propensityHigh && !churnHigh) {
    actions.push({
      type: "upsell",
      label: "Hoge upsell-kans — bied een opwaardering aan.",
      guidance: "Koppel het aanbod aan een concreet voordeel dat past bij de producten die de klant al heeft.",
    });
  }

  if (hasEnergy && !hasMobile) {
    actions.push({
      type: "crosssell",
      label: "Cross-sell: mobiel — klant heeft nog geen mobielabonnement.",
      guidance: "Vraag eerst hoe ze nu bellen. Dan: 'Wist u dat u via ons ook goedkoper kunt bellen?'",
    });
  }

  if (hasEnergy && !hasInternet) {
    actions.push({
      type: "crosssell",
      label: "Cross-sell: internet — klant heeft nog geen internet bij ons.",
      guidance: "Bundel het gesprek: 'Veel klanten besparen €10–15 per maand door energie én internet te combineren.'",
    });
  }

  if (tariffType === "VariableByMonth" && !churnHigh) {
    actions.push({
      type: "tarief",
      label: "Variabel tarief — bespreek overstap naar vast tarief voor meer zekerheid.",
      guidance: "Gebruik actuele marktprijzen als kapstok. Vaste tarieven verkopen zichzelf als de klant onzekerheid ervaart.",
    });
  }

  if (tenureMonths === 0) {
    actions.push({
      type: "onboarding",
      label: "Nieuwe klant — zet onboarding en welkom centraal.",
      guidance: "Eerste indruk telt. Check of alles goed is opgestart en vraag of ze vragen hebben over hun eerste factuur.",
    });
  }

  // Fallback: always at least one action
  if (actions.length === 0) {
    actions.push({
      type: "upsell",
      label: "Tevreden klant — ideaal moment voor een zachte upsell.",
      guidance: "Begin met een compliment voor hun loyaliteit voordat je het aanbod introduceert.",
    });
  }

  const firstName = person.firstName;
  const lastName  = person.lastName;
  const fullName  = [firstName, lastName].filter(Boolean).join(" ");
  const email     = `${slugName(firstName, lastName)}@budgetthuis.nl`;

  return {
    customerId: person.id,
    customerNumber: String(customerNum),
    phone: person.phone,
    name: fullName,
    firstName,
    lastName,
    email,
    segment,
    tag,
    customerValueScore,
    priority,
    churnRiskScore,
    churnSegment,
    propensityScore,
    propensitySegment,
    products: { energy: hasEnergy, mobile: hasMobile, internet: hasInternet },
    productsStr: productsArr.join(","),
    numProducts,
    isMultiUtility: isMulti,
    tariffType,
    tenureMonths,
    contractEnding90d,
    actions,
  };
}

// ─── Build ────────────────────────────────────────────────────────────────────

const records = [
  ...jury.map((p, i)      => buildRecord(p, true,  9000 + i + 1)),
  ...colleagues.map((p, i) => buildRecord(p, false, 9100 + i + 1)),
];

const byPhone          = {};
const byCustomerNumber = {};

for (const rec of records) {
  if (rec.phone)          byPhone[rec.phone]                  = rec;
  if (rec.customerNumber) byCustomerNumber[rec.customerNumber] = rec.phone;
}

const out = {
  generatedAt: new Date().toISOString(),
  count: records.length,
  byPhone,
  byCustomerNumber,
  records,
};

const outPath = join(root, "data/customers.json");
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`✓ ${out.count} klanten → ${outPath}`);
for (const r of records) {
  console.log(`  ${r.phone.padEnd(16)} ${r.name.padEnd(28)} [${r.segment}] score=${r.customerValueScore} churn=${r.churnRiskScore} acties=${r.actions.length}`);
}
