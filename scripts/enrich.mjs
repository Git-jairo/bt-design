// Verrijkings- en scoringslogica voor het Hackathon-dashboard.
//
// "Koud pad": joint de identiteit- en product-dataset op customer_id,
// normaliseert telefoonnummers, berekent een customer_value_score en leidt
// agent-acties/segment af. De Twilio Function en het dashboard consumeren
// alleen het resultaat (customers.json) — alle logica staat hier, testbaar.
//
// Alle functies zijn pure en los te testen (zie enrich.test.mjs).

// ─── CSV ────────────────────────────────────────────────────────────────
// Minimale parser met support voor quotes en komma's binnen velden.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// CSV-tekst → array van objecten (keys = kopregel, lowercased & getrimd).
export function parseCSVObjects(text) {
  const rows = parseCSV(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length === 0) return [];
  const header = rows.shift().map((h) => h.trim().toLowerCase());
  return rows.map((r) => {
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = (r[i] ?? "").trim();
    });
    return obj;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────
export function parseBool(v) {
  return String(v).trim().toUpperCase() === "WAAR";
}

export function toNumber(v, fallback = 0) {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

// Best-effort normalisatie naar E.164 (NL-default). LET OP: brondata moet
// idealiter al E.164 zijn; dit is een vangnet voor nette nummers.
export function normalizePhone(raw) {
  if (!raw) return "";
  let s = String(raw).replace(/[\s\-()./]/g, "");
  if (s.startsWith("+")) return s;
  if (s.startsWith("00")) return "+" + s.slice(2);
  // Brondata heeft soms "31XXXXXXXXX" (landcode zonder + of 00)
  if (s.startsWith("31") && s.length >= 11) return "+" + s;
  if (s.startsWith("0")) return "+31" + s.slice(1);
  return "+31" + s; // nationaal nummer zonder leidende 0
}

export function formatName(identity) {
  const first = (identity.voornaam || identity.voorletters || "").trim();
  return [first, identity.tussenvoegsel, identity.naam]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(" ");
}

export function formatFirstName(identity) {
  return (identity.voornaam || identity.voorletters || "").trim();
}

export function formatLastName(identity) {
  return [identity.tussenvoegsel, identity.naam]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(" ");
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// ─── Scoring (instelbare gewichten) ─────────────────────────────────────────
// customer_value_score (0–100) = intrinsieke waarde van de klant.
//   product  (0–50): aantal producten + multi-utility
//   loyalty  (0–25): tenure_months (cap 48 mnd)
//   potential(0–25): propensity_score
export function computeValueScore(p) {
  const numProducts = toNumber(p.num_products);
  const isMulti = parseBool(p.is_multi_utility);
  const tenure = toNumber(p.tenure_months);
  const propensity = toNumber(p.propensity_score);

  const productScore = Math.min(50, numProducts * 15 + (isMulti ? 15 : 0));
  const loyaltyScore = Math.min(25, (tenure / 48) * 25);
  const potentialScore = (propensity / 100) * 25;

  return Math.round(clamp(productScore + loyaltyScore + potentialScore, 0, 100));
}

// Wachtrij-prioriteit: waarde + urgentie (churn / aflopend contract).
// HVC (>=90) staat altijd bovenaan (1000); de rest blijft onder 1000 zodat
// de wachttijdbonus (update-priorities) ruimte houdt.
export function computePriority(valueScore, p) {
  if (valueScore >= 90) return 1000;
  let pr = valueScore;
  if (String(p.churn_segment).toLowerCase() === "high") pr += toNumber(p.churn_risk_score);
  if (parseBool(p.any_contract_ending_90d)) pr += 50;
  return Math.round(clamp(pr, 0, 999));
}

// Display-segment voor de agent (afgeleid; de brondata heeft geen segment).
export function deriveSegment(valueScore, p) {
  if (String(p.churn_segment).toLowerCase() === "high") return "Risico op churn";
  if (toNumber(p.tenure_months) === 0) return "Nieuw";
  if (valueScore >= 90) return "Premium";
  return "Standaard";
}

// Agent-acties afgeleid uit de signalen → vervangt de fake demo-secties.
export function deriveActions(p) {
  const actions = [];
  const churnHigh = String(p.churn_segment).toLowerCase() === "high";
  const propensityHigh = String(p.propensity_segment).toLowerCase() === "high";
  const hasEnergy = parseBool(p.has_energy);
  const hasMobile = parseBool(p.has_mobile);
  const hasInternet = parseBool(p.has_internet);
  const isMulti = parseBool(p.is_multi_utility);
  const numProducts = toNumber(p.num_products);

  if (parseBool(p.any_contract_ending_90d))
    actions.push({ type: "retentie", label: "Contract loopt af binnen 90 dagen — bespreek verlenging." });
  if (churnHigh)
    actions.push({ type: "retentie", label: "Verhoogd opzegrisico — retentiescript, korting met akkoord leidinggevende." });
  if (propensityHigh)
    actions.push({ type: "upsell", label: "Hoge upsell-kans — bied een passend product/pakket aan." });
  if (hasEnergy && !hasMobile)
    actions.push({ type: "crosssell", label: "Cross-sell: mobiel (klant heeft nog geen mobiel)." });
  if (hasEnergy && !hasInternet)
    actions.push({ type: "crosssell", label: "Cross-sell: internet (klant heeft nog geen internet)." });
  if (!isMulti && numProducts === 1)
    actions.push({ type: "bundle", label: "Bundelkans — multi-utility korting bij een tweede product." });
  if (toNumber(p.tenure_months) === 0)
    actions.push({ type: "onboarding", label: "Nieuwe klant — onboarding/welkom centraal stellen." });
  if (String(p.tariff_type) === "VariableByMonth")
    actions.push({ type: "tarief", label: "Variabel tarief — bespreek een vast tarief voor zekerheid." });

  return actions;
}

// ─── Verrijkt record ────────────────────────────────────────────────────────
export function enrichCustomer(identity, product) {
  const valueScore = computeValueScore(product);
  const segment = deriveSegment(valueScore, product);
  const priority = computePriority(valueScore, product);
  const tag = valueScore >= 90 ? "High Value Customer" : null;

  return {
    customerId: identity.customer_id,
    customerNumber: identity.nuts_home_customer_nr || null,
    phone: normalizePhone(identity.telefoon),
    name: formatName(identity) || "Onbekende klant",
    firstName: formatFirstName(identity),
    lastName: formatLastName(identity),
    email: identity.email || null,
    segment,
    tag,
    customerValueScore: valueScore,
    priority,
    churnRiskScore: toNumber(product.churn_risk_score),
    churnSegment: product.churn_segment || null,
    propensityScore: toNumber(product.propensity_score),
    propensitySegment: product.propensity_segment || null,
    products: {
      energy: parseBool(product.has_energy),
      mobile: parseBool(product.has_mobile),
      internet: parseBool(product.has_internet),
    },
    productsStr: product.products_str || "",
    numProducts: toNumber(product.num_products),
    isMultiUtility: parseBool(product.is_multi_utility),
    tariffType: product.tariff_type || null,
    tenureMonths: toNumber(product.tenure_months),
    contractEnding90d: parseBool(product.any_contract_ending_90d),
    actions: deriveActions(product),
  };
}

// Join op customer_id → verrijkte records + lookup-indexen voor de Function.
export function buildCustomers(identiteitText, productText) {
  const identiteit = parseCSVObjects(identiteitText);
  const product = parseCSVObjects(productText);

  const productById = new Map(product.map((p) => [p.customer_id, p]));

  const records = [];
  const byPhone = {};
  const byCustomerNumber = {};

  for (const identity of identiteit) {
    const p = productById.get(identity.customer_id);
    if (!p) continue; // geen productregel → overslaan
    const rec = enrichCustomer(identity, p);
    records.push(rec);
    if (rec.phone) byPhone[rec.phone] = rec;
    if (rec.customerNumber) byCustomerNumber[rec.customerNumber] = rec.phone;
  }

  return {
    generatedAt: new Date().toISOString(),
    count: records.length,
    byPhone,
    byCustomerNumber,
    records,
  };
}
