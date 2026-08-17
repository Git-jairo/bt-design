/**
 * DASHBOARD — simulated Mijn Omgeving account data.
 *
 * Everything the prototype renders comes from here: no API, no fetch. The
 * control panel picks *which* of this data is true for the current customer
 * (which products they hold, how many mobile contracts), the sections just
 * render what they're handed.
 *
 * Copy and figures are placeholders for design review — not real tariffs.
 */

export type Variant = "a" | "b";
export type ProductId = "energie" | "internet" | "mobiel";

export const PRODUCT_ORDER: ProductId[] = ["energie", "internet", "mobiel"];

/** Icon set, split by fill colour as exported from Figma. */
const ASSETS = "/experiments/dashboard";

/**
 * An icon as Figma draws it: a square container (`box`) with the artwork
 * (`w`×`h`) inset inside it. Both are kept explicitly — dropping the inset and
 * stretching the leaf to the box is what makes ported icons look wrong.
 *
 * `flipY` / `rotate` reproduce the transforms Figma applies to the layer; the
 * exported SVG itself is unrotated.
 */
export interface Glyph {
  src: string;
  box: number;
  w: number;
  h: number;
  flipY?: boolean;
  rotate?: number;
}

/** Per-glyph geometry, taken from the Figma insets. */
const GEOMETRY = {
  electricity: { box: 24, w: 16, h: 20 },
  internetTv: { box: 24, w: 20, h: 17 },
  simcard: { box: 24, w: 16, h: 20, flipY: true },
} as const;

export interface ProductMeta {
  id: ProductId;
  /** Top-nav label. */
  nav: string;
  /** Variant A card title — heading/h2 over the photo. */
  titleA: string;
  /** Variant B card title — display/section over the photo. */
  titleB: string;
  /** Label on the primary (black) button. */
  cta: string;
  photo: string;
  /** #9F9F9F fill — top nav. */
  iconNav: Glyph;
  /** White fill — on black buttons and the dark photo overlay. */
  iconLight: Glyph;
  /** Black fill — on the green CTA button. */
  iconDark: Glyph;
  /** Cross-sell block, shown when the customer lacks the product. */
  offer: {
    /** Yellow promotion chip over the photo (variant B only). */
    badge: string;
    intro: string;
    perYear: string;
    perMonth: string;
    /** Checkmark list: always visible in variant A, behind "Meer info" in B. */
    usps: string[];
    /** Variant A's two-line CTA. */
    ctaTitle: string;
    ctaSub: string;
  };
  /** Yearly Huisvoordeel this service contributes, in euros. */
  voordeelPerYear: number;
}

export const PRODUCTS: Record<ProductId, ProductMeta> = {
  energie: {
    id: "energie",
    nav: "Energie",
    titleA: "Stroom & Gas",
    titleB: "Energie",
    cta: "MijnBudget Energie",
    photo: `${ASSETS}/card-energie.jpg`,
    iconNav: { src: `${ASSETS}/icon-electricity.svg`, ...GEOMETRY.electricity },
    iconLight: { src: `${ASSETS}/icon-electricity-btn.svg`, ...GEOMETRY.electricity },
    iconDark: { src: `${ASSETS}/icon-electricity-dark.svg`, ...GEOMETRY.electricity },
    offer: {
      badge: "€ 30,- voordeel",
      intro: "Je hebt nog geen Energie van Budget Thuis.",
      perYear: "€ 30,- per jaar",
      perMonth: "Dat is € 2,50 per maand",
      usps: [
        "De eerste 12 maanden 50% korting op je vaste leveringskosten",
        "Gratis overstapservice t.w.v. € 20,-",
        "Speciaal voor jou als Budget Thuis klant",
      ],
      ctaTitle: "Bekijk energieaanbod",
      ctaSub: "& profiteer van combikorting!",
    },
    voordeelPerYear: 30,
  },
  internet: {
    id: "internet",
    nav: "Internet",
    titleA: "Internet & tv",
    titleB: "Internet",
    cta: "MijnBudget Internet",
    photo: `${ASSETS}/card-internet.jpg`,
    iconNav: { src: `${ASSETS}/icon-internet-tv.svg`, ...GEOMETRY.internetTv },
    iconLight: { src: `${ASSETS}/icon-internet-tv-btn.svg`, ...GEOMETRY.internetTv },
    iconDark: { src: `${ASSETS}/icon-internet-tv-dark.svg`, ...GEOMETRY.internetTv },
    offer: {
      badge: "€ 60,- voordeel",
      intro: "Je hebt nog geen Internet van Budget Thuis.",
      perYear: "€ 60,- per jaar",
      perMonth: "Dat is € 5 per maand",
      usps: [
        "De eerste 12 maanden 50% korting op je abonnement",
        "Gratis aansluiten t.w.v. € 20,-",
        "Speciaal voor jou als Budget Thuis klant",
      ],
      ctaTitle: "Bekijk internetaanbod",
      ctaSub: "& profiteer van combikorting!",
    },
    voordeelPerYear: 60,
  },
  mobiel: {
    id: "mobiel",
    nav: "Mobiel",
    titleA: "Mobiel bellen",
    titleB: "Mobiel",
    cta: "MijnBudget Mobiel",
    photo: `${ASSETS}/card-mobiel.jpg`,
    iconNav: { src: `${ASSETS}/icon-simcard.svg`, ...GEOMETRY.simcard },
    iconLight: { src: `${ASSETS}/icon-simcard-btn.svg`, ...GEOMETRY.simcard },
    iconDark: { src: `${ASSETS}/icon-simcard-dark.svg`, ...GEOMETRY.simcard },
    offer: {
      badge: "€ 24,- voordeel",
      intro: "Je hebt nog geen Mobiel van Budget Thuis.",
      perYear: "€ 24,- per jaar",
      perMonth: "Dat is € 2 per maand",
      usps: [
        "De eerste 12 maanden 50% korting op Sim Only",
        "Gratis aansluiten t.w.v. € 20,-",
        "Speciaal voor jou als Budget Thuis klant",
      ],
      ctaTitle: "Bekijk mobielaanbod",
      ctaSub: "& profiteer van combikorting!",
    },
    voordeelPerYear: 24,
  },
};

export const ICONS = {
  logo: `${ASSETS}/logo-budgetthuis.svg`,
  // The Qarry visual is two stacked photo layers in Figma, each with its own
  // crop and offset — see `.qarryLayer*` in the stylesheet.
  qarryBg: `${ASSETS}/qarry-bg.png`,
  qarryFg: `${ASSETS}/qarry-fg.png`,
  qarryEllipse: `${ASSETS}/qarry-ellipse.svg`,
  playstore: `${ASSETS}/store-playstore-glyph.svg`,
  googlePlayWordmark: `${ASSETS}/store-googleplay-wordmark.svg`,
  apple: `${ASSETS}/store-apple-glyph.svg`,
} as const;

/** Glyphs that aren't tied to a product. */
export const GLYPHS = {
  profile: { src: `${ASSETS}/icon-profile.svg`, box: 32, w: 21.33, h: 28 },
  home: { src: `${ASSETS}/icon-home.svg`, box: 24, w: 20, h: 17.58 },
  check: { src: `${ASSETS}/icon-check.svg`, box: 16, w: 16, h: 16 },
  // Exported pointing up; Figma rotates the layer 90° to point right.
  chevronRight: {
    src: `${ASSETS}/icon-chevron-right.svg`,
    box: 16,
    w: 10.67,
    h: 6.67,
    rotate: 90,
  },
  chevronRightDark: {
    src: `${ASSETS}/icon-chevron-right-dark.svg`,
    box: 16,
    w: 10.67,
    h: 6.67,
    rotate: 90,
  },
  chevronDown: {
    src: `${ASSETS}/icon-chevron-down.svg`,
    box: 16,
    w: 8.49,
    h: 5.19,
  },
  chevronUp: {
    src: `${ASSETS}/icon-chevron-up.svg`,
    box: 16,
    w: 8.49,
    h: 5.19,
  },
  /** Stepper controls in the Qarry counter (Figma 21:6372). */
  minus: { src: `${ASSETS}/icon-minus.svg`, box: 24, w: 16, h: 2.99 },
  plus: { src: `${ASSETS}/icon-plus.svg`, box: 24, w: 16, h: 16 },
  /** Slightly smaller plus, on the "Voeg producten toe" CTA. */
  plusCta: { src: `${ASSETS}/icon-plus-cta.svg`, box: 24, w: 14, h: 14 },
  /** Filled circle-check in front of every cross-sell USP. */
  indicatorCheck: {
    src: `${ASSETS}/icon-indicator-check.svg`,
    box: 24,
    w: 20,
    h: 20,
  },
} satisfies Record<string, Glyph>;

/**
 * Variant A's cross-sell card is followed by a standalone link to the
 * Bespaarmelder campaign page (Figma node 17:5956).
 */
export const REMINDER_LINK = {
  label: "Stuur mij een herinnering zodra ik kan overstappen",
  href: "https://campagnes.budgetthuis.nl/bespaarmelder-bm",
};

export const CUSTOMER_NAME = "Jairo";

/** Contract end dates for the single-contract products (variant B). */
export const CONTRACT_END: Record<"energie" | "internet", string> = {
  energie: "31-12-2026",
  internet: "04-02-2027",
};

export interface MobileContract {
  phone: string;
  endDate: string;
}

/** The pool the control panel slices — take the first N. */
export const MOBILE_CONTRACTS: MobileContract[] = [
  { phone: "06 12 34 56 78", endDate: "11-09-2026" },
  { phone: "06 23 45 67 89", endDate: "02-03-2027" },
  { phone: "06 34 56 78 90", endDate: "18-11-2026" },
  { phone: "06 45 67 89 01", endDate: "27-06-2027" },
];

export const MAX_MOBILE_CONTRACTS = MOBILE_CONTRACTS.length;

/**
 * Combikorting scales with the number of products held: € 5,- for a pair,
 * € 10,- for the full set. Drives the "Combineer met …" hint in variant B.
 */
export function combikorting(owned: ProductId[]): {
  amount: string;
  hint: string | null;
} {
  if (owned.length >= 3) {
    return { amount: "€ 10,-", hint: "Je ontvangt de maximale combikorting" };
  }
  if (owned.length === 2) {
    const missing = PRODUCT_ORDER.find((p) => !owned.includes(p))!;
    return {
      amount: "€ 5,-",
      hint: `Combineer met ${PRODUCTS[missing].nav} voor €10,- korting`,
    };
  }
  const missing = PRODUCT_ORDER.filter((p) => !owned.includes(p));
  return {
    amount: "€ 0,-",
    hint: missing.length
      ? `Combineer met ${PRODUCTS[missing[0]].nav} voor €5,- korting`
      : null,
  };
}

/* ── Qarry / Huisvoordeel ────────────────────────────────────────────────
   The cross-sell step, modelled on the "Hoe voller, hoe voordeliger" basket in
   the Huisvoordeel demo (public/experiments/dashboard/Budget Thuis
   Huisvoordeel.html) — but the Qarry bus is the shop the customer fills
   instead of a winkelmand, and it reads out the maximum they can reach.       */

export const QARRY = {
  heading: "Hoe voller, hoe voordeliger",
  intro:
    "Laad je diensten in de Qarry en zie je Huisvoordeel groeien. Vanaf 2 diensten gaat je korting direct in - Met elke dienst erbij stijgt je voordeel.",
  eyebrow: "Jouw huisvoordeel",
  ownedLabel: "Je hebt dit al",
  emptyLabel: "Je Qarry is nog leeg",
  cta: "Voeg producten toe",
  legal:
    "Deze berekening is indicatief en kan afwijken van uw werkelijke besparing. Aan deze uitkomst kunnen geen rechten worden ontleend.",
  /** Huisvoordeel only kicks in once this many services are combined. */
  threshold: 2,
};

/** Every service in the shop, at its maximum. */
export const MAX_VOORDEEL = PRODUCT_ORDER.reduce(
  (sum, id) => sum + PRODUCTS[id].voordeelPerYear,
  0,
);

export function euro(amount: number): string {
  return `€ ${amount},-`;
}

/**
 * What the customer's current selection is worth. Below the threshold the
 * discount hasn't started yet, so the readout stays at zero and the hint says
 * how far off they are.
 */
export function huisvoordeel(selected: ProductId[]): {
  amount: number;
  active: boolean;
  /** 0–1, for the meter under the bus. */
  progress: number;
  hint: string;
} {
  const total = selected.reduce(
    (sum, id) => sum + PRODUCTS[id].voordeelPerYear,
    0,
  );
  const active = selected.length >= QARRY.threshold;
  const progress = selected.length / PRODUCT_ORDER.length;

  let hint: string;
  if (selected.length === 0) {
    hint = "Zet minimaal 2 diensten aan om je Huisvoordeel te activeren.";
  } else if (!active) {
    hint = "Combineer nog 1 dienst en je Huisvoordeel gaat direct in.";
  } else if (selected.length < PRODUCT_ORDER.length) {
    hint = "Je Huisvoordeel is actief. Met de derde dienst erbij stijgt je voordeel.";
  } else {
    hint = `Je haalt het maximale eruit: ${euro(MAX_VOORDEEL)} per jaar.`;
  }

  return { amount: active ? total : 0, active, progress, hint };
}

/* ── Bespaarmelder ───────────────────────────────────────────────────────── */

export const BESPAARMELDER = {
  badge: "Bespaarmelder",
  heading: "Je kunt € 84,- per jaar besparen",
  body: "We zien dat je meer stroom teruglevert dan je verbruikt. Met een ander contract en een slimme laadtijd ligt je jaarbedrag lager.",
  cta: "Bekijk je besparing",
};

/* ── Footer ──────────────────────────────────────────────────────────────── */

export const FOOTER_COLUMNS = [
  {
    title: "Mijn account",
    links: ["Overzicht", "Gegevens", "Vriendenvoordeel"],
  },
  {
    title: "Andere omgevingen",
    links: ["Energie", "Mobiel", "Internet", "Download de app"],
  },
  {
    title: "Meer Budget Thuis",
    links: ["Klantenservice", "Vriendenvoordeel", "Combikorting"],
  },
];
