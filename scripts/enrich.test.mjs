// Tests voor de verrijkings-/scoringslogica.
//   node --test scripts/enrich.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhone,
  computeValueScore,
  computePriority,
  deriveSegment,
  deriveActions,
  enrichCustomer,
  parseBool,
} from "./enrich.mjs";

const dummyProduct = {
  customer_id: "CID-052F5119",
  has_energy: "WAAR",
  has_mobile: "ONWAAR",
  has_internet: "ONWAAR",
  earliest_supply_from: "",
  any_contract_ending_90d: "ONWAAR",
  tariff_type: "VariableByMonth",
  num_products: "1",
  is_multi_utility: "ONWAAR",
  products_str: "energy",
  tenure_months: "0",
  propensity_score: "20",
  churn_risk_score: "0",
  propensity_segment: "low",
  churn_segment: "low",
};

const dummyIdentity = {
  customer_id: "CID-052F5119",
  voorletters: "M.E.B.",
  voornaam: "Iris",
  tussenvoegsel: "",
  naam: "Verhelst",
  geslacht: "V",
  geboortedatum: "",
  telefoon: "738603028",
  email: "ty.small@comcast.net",
  nuts_home_customer_nr: "6689227",
};

test("parseBool herkent Nederlandse booleans", () => {
  assert.equal(parseBool("WAAR"), true);
  assert.equal(parseBool("ONWAAR"), false);
  assert.equal(parseBool(""), false);
});

test("normalizePhone naar E.164 (NL)", () => {
  assert.equal(normalizePhone("0610487300"), "+31610487300");
  assert.equal(normalizePhone("+31610487300"), "+31610487300");
  assert.equal(normalizePhone("06 10 48 73 00"), "+31610487300");
  assert.equal(normalizePhone("0031610487300"), "+31610487300");
  assert.equal(normalizePhone("738603028"), "+31738603028");   // nationaal zonder 0
  assert.equal(normalizePhone("31848638266"), "+31848638266"); // brondata met 31 zonder +
});

test("computeValueScore op de dummy-set = 20", () => {
  // product 15 (1 product, geen multi) + loyalty 0 (tenure 0) + potential 5 (prop 20)
  assert.equal(computeValueScore(dummyProduct), 20);
});

test("computeValueScore: HVC-grens", () => {
  const rich = { ...dummyProduct, num_products: "3", is_multi_utility: "WAAR", tenure_months: "60", propensity_score: "100" };
  assert.equal(computeValueScore(rich), 100);
});

test("computePriority: niet-HVC = 0, HVC (>=85) = 1000", () => {
  assert.equal(computePriority(20, dummyProduct), 0);
  assert.equal(computePriority(84, dummyProduct), 0);
  assert.equal(computePriority(85, dummyProduct), 1000);
  assert.equal(computePriority(95, dummyProduct), 1000);
});

test("deriveSegment: nieuwe klant zonder tenure = Nieuw", () => {
  assert.equal(deriveSegment(20, dummyProduct), "Nieuw");
  assert.equal(deriveSegment(20, { ...dummyProduct, tenure_months: "12", churn_segment: "high" }), "Risico op churn");
});

test("deriveActions op de dummy-set", () => {
  const actions = deriveActions(dummyProduct);
  const types = actions.map((a) => a.type);
  assert.ok(types.includes("crosssell")); // geen mobiel én geen internet
  assert.ok(types.includes("bundle")); // 1 product, geen multi-utility
  assert.ok(types.includes("onboarding")); // tenure 0
  assert.ok(types.includes("tarief")); // VariableByMonth
  assert.ok(!types.includes("retentie")); // churn low, geen aflopend contract
});

test("enrichCustomer levert volledig record", () => {
  const rec = enrichCustomer(dummyIdentity, dummyProduct);
  assert.equal(rec.customerId, "CID-052F5119");
  assert.equal(rec.phone, "+31738603028");
  assert.equal(rec.name, "Iris Verhelst");
  assert.equal(rec.customerValueScore, 20);
  assert.equal(rec.segment, "Nieuw");
  assert.equal(rec.tag, null);
  assert.deepEqual(rec.products, { energy: true, mobile: false, internet: false });
  assert.ok(rec.actions.length >= 3);
});
