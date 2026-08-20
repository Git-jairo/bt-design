import type { Category } from "./types";

/**
 * Tabular formats (CSV, XLSX) carry a signal free text doesn't: a column
 * header. A cell that just says "Jan van der Berg" won't match any name
 * pattern on its own, but a column headed "Naam" tells us every value below
 * it is a name — a much stronger signal than guessing from the value alone.
 * Parsers use this to classify a whole column from its header, then treat
 * every cell in it as that category outright (see Segment.forceCategory).
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents (NFD splits é into e + combining acute, etc.)
    .replace(/[^a-z0-9]/g, ""); // collapse "e-mail" / "klant nummer" / "BSN" to one comparable token
}

const HEADER_MAP: Record<string, Category> = {
  naam: "name",
  klantnaam: "name",
  contactpersoon: "name",
  voornaam: "name",
  achternaam: "name",
  tussenvoegsel: "name",
  volledigenaam: "name",
  name: "name",
  fullname: "name",

  email: "email",
  emailadres: "email",
  mailadres: "email",
  emailaddress: "email",

  telefoon: "phone",
  telefoonnummer: "phone",
  mobiel: "phone",
  mobielnummer: "phone",
  phone: "phone",
  phonenumber: "phone",
  tel: "phone",

  adres: "address",
  straat: "address",
  straatnaam: "address",
  huisnummer: "address",
  postcode: "address",
  woonplaats: "address",
  plaats: "address",
  stad: "address",
  city: "address",
  address: "address",

  bsn: "bsn",
  burgerservicenummer: "bsn",

  iban: "iban",
  rekeningnummer: "iban",
  bankrekening: "iban",
  bankrekeningnummer: "iban",

  btwnummer: "tax_id",
  btw: "tax_id",
  vatnumber: "tax_id",

  wachtwoord: "credential",
  password: "credential",
  apikey: "credential",
  token: "credential",
  secret: "credential",

  klantnummer: "customer_id",
  klantid: "customer_id",
  customernumber: "customer_id",
  customerid: "customer_id",
  personeelsnummer: "customer_id",
  employeeid: "customer_id",
  medewerkernummer: "customer_id",
  contractnummer: "customer_id",

  functie: "job_title",
  jobtitle: "job_title",
  rol: "job_title",
  position: "job_title",

  bedrijf: "company",
  company: "company",
  organisatie: "company",
  werkgever: "company",

  datum: "date",
  date: "date",
  geboortedatum: "date",
};

/** Returns the Category a header cell maps to, or null if it isn't recognized. */
export function classifyHeader(header: string): Category | null {
  return HEADER_MAP[normalizeHeader(header)] ?? null;
}
