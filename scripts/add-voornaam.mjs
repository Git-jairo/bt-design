// Voegt een 'voornaam' kolom toe aan identiteit.csv op basis van geslacht.
// Eenmalig uitvoeren; daarna is de kolom aanwezig.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const NAMEN_V = [
  "Emma","Sophie","Julia","Fleur","Anna","Lisa","Laura","Sara","Eva","Noor",
  "Iris","Lena","Nina","Mila","Anouk","Charlotte","Amber","Roos","Hannah","Lotte",
  "Femke","Merel","Bo","Manon","Silke","Fenna","Elise","Maud","Vera","Inge",
  "Marieke","Karen","Jolien","Sandra","Denise","Chantal","Naomi","Bianca","Monique","Els",
  "Rianne","Mariëlle","Corinne","Petra","Judith","Mirjam","Esther","Wendy","Hanneke","Annelies",
];

const NAMEN_M = [
  "Liam","Daan","Lars","Tom","Tim","Bas","Stijn","Joost","Sven","Pieter",
  "Ruben","Finn","Niels","Rick","Thijs","Wouter","Maarten","Kevin","Dennis","Mark",
  "Jeroen","Arjan","Gijs","Kees","Rob","Jan","Piet","Willem","Hans","Henk",
  "Marcel","Patrick","Michiel","Sander","Erik","Ronald","Frank","Stefan","Vincent","Leon",
  "Dirk","Erwin","Remco","Bart","Rik","Joran","Luuk","Bram","Hugo","Ewout",
];

function pick(arr, seed) {
  return arr[seed % arr.length];
}

const raw = readFileSync(join(root, "data/identiteit.csv"), "utf8");
const lines = raw.split("\n").filter((l) => l.trim() !== "");

const header = lines[0];
if (header.split(",").includes("voornaam")) {
  console.log("voornaam-kolom bestaat al — niets gewijzigd.");
  process.exit(0);
}

// Voeg voornaam in na voorletters (positie 1 → 2)
const newHeader =
  "customer_id,voorletters,voornaam,tussenvoegsel,naam,geslacht,geboortedatum,telefoon,email,nuts_home_customer_nr";

const cols = header.split(",");
const idxGeslacht = cols.indexOf("geslacht");

const newLines = [newHeader];
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(",");
  const geslacht = (parts[idxGeslacht] ?? "M").trim().toUpperCase();
  const pool = geslacht === "V" ? NAMEN_V : NAMEN_M;
  const voornaam = pick(pool, i * 7 + 3); // deterministisch maar gevarieerd
  // Insert voornaam na voorletters (index 1)
  parts.splice(2, 0, voornaam);
  newLines.push(parts.join(","));
}

const out = newLines.join("\n") + "\n";
writeFileSync(join(root, "data/identiteit.csv"), out, "utf8");
console.log(`✓ voornaam toegevoegd aan ${newLines.length - 1} klanten`);
