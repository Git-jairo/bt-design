/**
 * Bespaarmelder — central customer-data platform (simulated).
 *
 * The story: ONE platform, many touchpoints. Data is CAPTURED at every
 * touchpoint (the Bespaarmelder mail, an agent chat, the app …), lands as
 * structured fields IN the platform, and is ACTIVATED into the right action
 * (cross-sell to high-propensity customers, renewal/win-back to predicted
 * leavers). Everything here is mocked; the scoring logic is inspectable.
 */

/* ── Signals: the structured numbers the platform reasons over ───────────── */
export type SignalKey =
  | "contractProximity" // 0-100, how close the contract end date is
  | "productGaps" // 0-100, how many of the 4 lines are still open
  | "engagement" // 0-100, app opens / email clicks
  | "positiveExperience" // 0-100, CSAT / NPS / resolved service
  | "paymentReliability" // 0-100, payment history
  | "lifeEvent" // 0-100, address change / household change
  | "consideringLeaving"; // 0-100, churn / switching intent

export type Signals = Partial<Record<SignalKey, number>>;

/* ── Capture sources (left lane: data IN) ────────────────────────────────── */
export interface CaptureSource {
  id: string;
  label: string;
  icon: string;
  blurb: string;
  captures: string[];
  scenarioId?: string; // sources that have a playable live demo
}

export const CAPTURE_SOURCES: CaptureSource[] = [
  {
    id: "bespaarmelder-mail",
    label: "Bespaarmelder-mail",
    icon: "mail",
    blurb: "Het signaal van vandaag: de klant geeft zelf de contracteinddatum door.",
    captures: ["Contracteinddatum", "Huidige aanbieder", "Overstapintentie"],
    scenarioId: "renewal",
  },
  {
    id: "agent-chat",
    label: "Agent-chat (Greg)",
    icon: "chat",
    blurb: "Een AI-agent vraagt natuurlijk door en leidt gestructureerde data af.",
    captures: ["Behoefte & productinteresse", "Huishouden", "Sentiment", "Open productgaten"],
    scenarioId: "cross-sell",
  },
  {
    id: "app",
    label: "App-gedrag",
    icon: "smartphone",
    blurb: "Realtime gedrag: verbruiksinzicht, engagement en opzegsignalen.",
    captures: ["Engagement", "Verbruiksinzicht", "Opzegsignalen"],
    scenarioId: "winback",
  },
  {
    id: "website",
    label: "Website & tariefchecker",
    icon: "globe",
    blurb: "Oriëntatiegedrag en zelf-ingevoerde verbruiks- en tariefdata.",
    captures: ["Productinteresse", "Verbruik", "Bezoekgedrag"],
  },
  {
    id: "signup",
    label: "Aanmelding",
    icon: "user-plus",
    blurb: "Het fundament: welke producten, welk adres, welke contractdata.",
    captures: ["Producten in bezit", "Adres & huishouden", "Contractdata"],
  },
  {
    id: "service",
    label: "Servicecontact",
    icon: "headset",
    blurb: "Elke service-interactie verrijkt het ervarings- en sentimentbeeld.",
    captures: ["CSAT / NPS", "Opgeloste issues", "Sentiment"],
  },
];

/* ── Platform fields (center: what's stored) ─────────────────────────────── */
export type FieldGroup = "identiteit" | "producten" | "gedrag" | "voorspelling";

export const FIELD_GROUPS: { id: FieldGroup; label: string }[] = [
  { id: "identiteit", label: "Identiteit & huishouden" },
  { id: "producten", label: "Producten & contract" },
  { id: "gedrag", label: "Gedrag & ervaring" },
  { id: "voorspelling", label: "Voorspelling" },
];

/* ── Activation actions (right lane: data OUT) ───────────────────────────── */
export interface PlatformAction {
  id: string;
  label: string;
  icon: string;
  tone: "cross" | "renew" | "time" | "win";
  condition: string;
  audience: string;
  blurb: string;
}

export const ACTIONS: PlatformAction[] = [
  {
    id: "cross-sell",
    label: "Cross-sell aanbod",
    icon: "sparkles",
    tone: "cross",
    condition: "Propensity ≥ 66 én een open productgat",
    audience: "Hoog-propensity klanten",
    blurb: "Bied juist het product aan dat de klant nog mist — bundelvoordeel op het juiste moment.",
  },
  {
    id: "renewal",
    label: "Verleng- / behoudaanbod",
    icon: "shield",
    tone: "renew",
    condition: "Churn-risico ≥ 55 of einddatum < 60 dagen",
    audience: "Klanten met vertrekrisico",
    blurb: "Stuur proactief een scherper tarief of verlenging vóór de contracteinddatum.",
  },
  {
    id: "winback",
    label: "Win-back / retentie-call",
    icon: "phone",
    tone: "win",
    condition: "Actieve vertrekintentie (opzegsignaal)",
    audience: "Klanten die actief vertrekken",
    blurb: "Persoonlijk contact met een behoudaanbod zodra een opzegsignaal binnenkomt.",
  },
  {
    id: "timing",
    label: "Getimede aanbieding",
    icon: "clock",
    tone: "time",
    condition: "Standaard — nurture tot een sterker signaal",
    audience: "Engaged klanten zonder acuut signaal",
    blurb: "Geen acuut signaal: warm houden en wachten op het beste contactmoment.",
  },
];

/* ── Scoring (inspectable) ───────────────────────────────────────────────── */
export interface Factor {
  id: string;
  label: string;
  weight: number;
  signal: SignalKey;
  invert?: boolean;
  neutral: number; // value used when the signal is not yet known
}

export const PROPENSITY_FACTORS: Factor[] = [
  { id: "p-gaps", label: "Open productgaten", weight: 0.22, signal: "productGaps", neutral: 45 },
  { id: "p-contract", label: "Nabijheid einddatum", weight: 0.16, signal: "contractProximity", neutral: 40 },
  { id: "p-engage", label: "Engagement", weight: 0.16, signal: "engagement", neutral: 45 },
  { id: "p-exp", label: "Positieve ervaring", weight: 0.14, signal: "positiveExperience", neutral: 50 },
  { id: "p-pay", label: "Betaalbetrouwbaarheid", weight: 0.12, signal: "paymentReliability", neutral: 60 },
  { id: "p-life", label: "Levensgebeurtenis", weight: 0.08, signal: "lifeEvent", neutral: 30 },
];

export const CHURN_FACTORS: Factor[] = [
  { id: "c-leave", label: "Vertrekintentie", weight: 0.4, signal: "consideringLeaving", neutral: 15 },
  { id: "c-engage", label: "Lage engagement", weight: 0.18, signal: "engagement", invert: true, neutral: 45 },
  { id: "c-contract", label: "Nabijheid einddatum", weight: 0.18, signal: "contractProximity", neutral: 40 },
  { id: "c-exp", label: "Negatieve ervaring", weight: 0.12, signal: "positiveExperience", invert: true, neutral: 50 },
  { id: "c-pay", label: "Betaalrisico", weight: 0.12, signal: "paymentReliability", invert: true, neutral: 60 },
];

export interface FactorResult extends Factor {
  raw: number; // value used (known or neutral)
  contrib: number; // weight * effective value
  known: boolean;
}

export function scoreWith(factors: Factor[], signals: Signals): { score: number; rows: FactorResult[] } {
  const wsum = factors.reduce((s, f) => s + f.weight, 0);
  let total = 0;
  const rows = factors.map((f) => {
    const known = signals[f.signal] !== undefined;
    const raw = signals[f.signal] ?? f.neutral;
    const eff = f.invert ? 100 - raw : raw;
    const contrib = f.weight * eff;
    total += contrib;
    return { ...f, raw, contrib, known };
  });
  return { score: Math.round(total / wsum), rows };
}

/** Rule that selects the recommended action — deliberately readable. */
export function recommendAction(
  propensity: number,
  churn: number,
  signals: Signals
): { actionId: string; reason: string } {
  const leaving = signals.consideringLeaving ?? 0;
  const gaps = signals.productGaps ?? 0;
  if (leaving >= 85)
    return { actionId: "winback", reason: "Actieve vertrekintentie gedetecteerd — direct persoonlijk contact." };
  if (churn >= 55 || ((signals.contractProximity ?? 0) >= 80 && leaving >= 55))
    return { actionId: "renewal", reason: `Churn-risico ${churn} — proactief behoudaanbod vóór de einddatum.` };
  if (propensity >= 66 && gaps >= 60)
    return { actionId: "cross-sell", reason: `Propensity ${propensity} met open productgaten — logische cross-sell.` };
  return { actionId: "timing", reason: "Nog geen acuut signaal — warm houden tot het juiste moment." };
}

/* ── Scenarios (the live demos) ──────────────────────────────────────────── */
export type Speaker = "klant" | "agent" | "system" | "event";

export interface ScenarioStep {
  speaker: Speaker;
  text: string;
  /** Human-readable fields written to the platform at this step. */
  writes?: { id: string; label: string; value: string; group: FieldGroup }[];
  /** Structured signals merged into the platform at this step. */
  signals?: Signals;
}

export interface Scenario {
  id: string;
  sourceId: string;
  customer: string;
  summary: string;
  steps: ScenarioStep[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "cross-sell",
    sourceId: "agent-chat",
    customer: "Lisa Bakker",
    summary: "Chat met de agent over een hoge energierekening → cross-sell.",
    steps: [
      { speaker: "klant", text: "Hoi, mijn energierekening voelt hoog. Kan ik iets besparen?" },
      {
        speaker: "agent",
        text: "Ik kijk mee. Je hebt nu alleen stroom & gas bij ons — internet en mobiel lopen elders?",
        writes: [
          { id: "products", label: "Producten in bezit", value: "Energie (stroom + gas)", group: "producten" },
          { id: "gaps", label: "Open productgaten", value: "Internet · Mobiel · Thuisbatterij", group: "producten" },
        ],
        signals: { productGaps: 85, paymentReliability: 90 },
      },
      {
        speaker: "klant",
        text: "Klopt. Mijn internet zit bij een ander, dat contract loopt over een paar maanden af.",
        writes: [
          { id: "ext-provider", label: "Externe aanbieder", value: "Internet bij concurrent", group: "producten" },
          { id: "contract-int", label: "Contracteinddatum internet", value: "± 2 maanden", group: "producten" },
        ],
        signals: { contractProximity: 70 },
      },
      {
        speaker: "agent",
        text: "Handig om te weten. Met hoeveel mensen woon je, en heb je interesse in zonne-energie?",
      },
      {
        speaker: "klant",
        text: "We zijn met z'n vieren. Zonnepanelen en een thuisbatterij lijken me wel wat.",
        writes: [
          { id: "household", label: "Huishouden", value: "4 personen", group: "identiteit" },
          { id: "interest", label: "Productinteresse", value: "Thuisbatterij + internetbundel", group: "gedrag" },
        ],
        signals: { engagement: 75, lifeEvent: 35 },
      },
      {
        speaker: "system",
        text: "Positief sentiment + hoge betrokkenheid vastgelegd. Profiel verrijkt en scores herberekend.",
        signals: { positiveExperience: 80 },
      },
    ],
  },
  {
    id: "renewal",
    sourceId: "bespaarmelder-mail",
    customer: "Anna de Vries",
    summary: "Bespaarmelder-mail: klant geeft einddatum door en twijfelt → verlenging.",
    steps: [
      { speaker: "event", text: "Anna ontvangt de Bespaarmelder-mail en opent het formulier." },
      {
        speaker: "klant",
        text: "Mijn energiecontract loopt over 30 dagen af — en ik overweeg over te stappen.",
        writes: [
          { id: "contract-energy", label: "Contracteinddatum energie", value: "Over 30 dagen", group: "producten" },
          { id: "intent", label: "Overstapintentie", value: "Ja — oriënteert actief", group: "gedrag" },
        ],
        signals: { contractProximity: 92, consideringLeaving: 80 },
      },
      {
        speaker: "system",
        text: "Platform herkent vertrekrisico vlak vóór de einddatum. Historie toont trouwe betaler.",
        writes: [
          { id: "tenure", label: "Relatieduur", value: "4 jaar klant", group: "identiteit" },
        ],
        signals: { paymentReliability: 88, positiveExperience: 70 },
      },
    ],
  },
  {
    id: "winback",
    sourceId: "app",
    customer: "Sam Janssen",
    summary: "App-gedrag: opzegpagina bekeken + dalende engagement → win-back.",
    steps: [
      { speaker: "event", text: "Sam opent de app en bekijkt de opzegpagina — tweemaal deze week." },
      {
        speaker: "system",
        text: "Opzegsignaal en dalende engagement gedetecteerd vanuit app-gedrag.",
        writes: [
          { id: "cancel", label: "Opzegsignaal", value: "Opzegpagina 2× bekeken", group: "gedrag" },
          { id: "engage", label: "Engagement", value: "Dalend (−40% MoM)", group: "gedrag" },
        ],
        signals: { consideringLeaving: 90, engagement: 40 },
      },
      {
        speaker: "system",
        text: "Contract loopt nog 5 maanden — geen wachtmoment, nú handelen om te behouden.",
        signals: { contractProximity: 35, paymentReliability: 85 },
      },
    ],
  },
];

export const SCENARIO_BY_ID = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
