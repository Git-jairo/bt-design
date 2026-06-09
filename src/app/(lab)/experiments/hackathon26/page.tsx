"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Segment =
  | "Premium"
  | "Zakelijk"
  | "Standaard"
  | "Nieuw"
  | "Risico op churn"
  | string;

interface Action {
  type: string;
  label: string;
}

interface Caller {
  id: string;
  name: string;
  phone: string;
  segment: Segment;
  customerValueScore: number;
  waitSeconds: number;
  reason: string;
  priority: number;
  tag: string | null;
  firstName: string | null;
  lastName: string | null;
  // Verrijkte velden uit customers.json
  customerId: string | null;
  customerNumber: string | null;
  email: string | null;
  churnRiskScore: number;
  churnSegment: string | null;
  propensityScore: number;
  propensitySegment: string | null;
  products: { energy: boolean; mobile: boolean; internet: boolean } | null;
  numProducts: number;
  isMultiUtility: boolean;
  tariffType: string | null;
  tenureMonths: number;
  contractEnding90d: boolean;
  actions: Action[];
}

function fmtWait(s: number): string {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// Mask a phone number for display (privacy): keep the country prefix and the
// last 4 digits, replace the middle with **** — e.g. +31624809069 → +316****9069.
function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const prefix = phone.startsWith("+316") ? "+316" : phone.slice(0, 4);
  const last4 = phone.slice(-4);
  // If the number is too short to have a distinct prefix + last 4, just mask
  // everything but the final 4 digits.
  if (phone.length <= prefix.length + 4) return "****" + last4;
  return `${prefix}****${last4}`;
}

function isHighValue(c: Caller): boolean {
  return c.tag === "High Value Customer" || c.customerValueScore >= 85;
}

function valueDescription(score: number): string {
  if (score >= 90) return "Uitzonderlijk hoge waarde. Focus op retentie en high-end services.";
  if (score >= 70) return "Hoge klantwaarde. Persoonlijke behandeling loont.";
  if (score >= 40) return "Gemiddelde klantwaarde. Volg het standaardproces met oog voor een upgrade.";
  return "Lagere klantwaarde. Efficiënt en vriendelijk afhandelen.";
}

function waitDescription(seconds: number): string {
  if (seconds > 300) return "Klant heeft ongebruikelijk lang gewacht. Bied excuses aan bij start gesprek.";
  if (seconds > 120) return "Wacht al even. Verontschuldig je kort voor de wachttijd.";
  return "Korte wachttijd, klant net binnengekomen.";
}

// ─── Verrijkings-helpers (gebruiken echte Caller-velden) ─────────────────

interface UpsellOffer {
  title: string;
  desc: string;
  tips: string[];
  cta: string;
  icon: string;
}

const ACTION_META: Record<string, { title: string; cta: string }> = {
  crosssell:  { title: "Cross-sell kans",     cta: "Bied product aan" },
  upsell:     { title: "Upgrade kans",         cta: "Bied upgrade aan" },
  bundle:     { title: "Bundelkans",           cta: "Presenteer bundel" },
  retentie:   { title: "Retentie actie",       cta: "Retentie starten" },
  tarief:     { title: "Tariefgesprek",        cta: "Bespreek tarief" },
  onboarding: { title: "Onboarding",           cta: "Start onboarding" },
};

function buildUpsellOffers(c: Caller): UpsellOffer[] {
  return c.actions.map((action) => {
    const meta = ACTION_META[action.type] ?? { title: action.type, cta: "Actie uitvoeren" };
    const guidance = (action as Action & { guidance?: string }).guidance;
    return {
      title: meta.title,
      desc: action.label,
      tips: guidance ? [guidance] : [],
      cta: meta.cta,
      // Every offer CTA uses the plus icon by default.
      icon: "plus",
    };
  });
}

function subscriptionLabel(c: Caller): string {
  if (c.products?.energy && c.products?.mobile && c.products?.internet) return "Energie + Mobiel + Internet";
  if (c.products?.energy && c.products?.mobile) return "Energie + Mobiel";
  if (c.products?.energy && c.products?.internet) return "Energie + Internet";
  if (c.products?.mobile && c.products?.internet) return "Mobiel + Internet";
  if (c.products?.energy) return "Energie";
  if (c.products?.mobile) return "Mobiel";
  if (c.products?.internet) return "Internet";
  return c.segment;
}

interface ApproachBullet {
  text: string;
  highlight?: boolean;
  icon: string;
}

function approachBullets(c: Caller): ApproachBullet[] {
  // Gebruik de afgeleide actions uit customers.json als ze er zijn,
  // anders val terug op segment-gebaseerde generieke bullets.
  if (c.actions.length > 0) {
    const out: ApproachBullet[] = [];
    if (c.waitSeconds > 120)
      out.push({ icon: "bullet_check", text: `Excuses aanbieden voor de wachttijd (${fmtWait(c.waitSeconds)}) voordat het gesprek begint.` });
    for (const action of c.actions) {
      const highlight = action.type === "retentie" || action.type === "upsell";
      out.push({ icon: highlight ? "bullet_warning" : "bullet_check", highlight, text: action.label });
    }
    return out;
  }
  // Fallback voor klanten zonder verrijkte actions (onbekende bellers)
  const out: ApproachBullet[] = [];
  if (c.segment === "Risico op churn")
    out.push({ icon: "bullet_check", text: "Retentiescript actief. Bied bij passende gelegenheid een retentiekorting aan. Escaleer niet zonder akkoord leidinggevende." });
  else if (c.segment === "Premium")
    out.push({ icon: "bullet_check", text: `Premiumklant (${c.customerValueScore}/100). Direct en persoonlijk behandelen zonder scripts.` });
  else
    out.push({ icon: "bullet_check", text: "Standaardafhandeling. Volg het reguliere gesprekscript en let op upgrade-kansen." });
  if (c.waitSeconds > 120)
    out.push({ icon: "bullet_check", text: `Excuses aanbieden voor de wachttijd (${fmtWait(c.waitSeconds)}) voordat het gesprek begint.` });
  if (isHighValue(c))
    out.push({ icon: "bullet_warning", highlight: true, text: `Transitie: gebruik de hoge klantwaarde om over te stappen naar een hoger pakket.` });
  return out;
}
// ─────────────────────────────────────────────────────────────────────────

// ─── Helix icon library ──────────────────────────────────────────────────
// The dashboard refers to icons by short tokens; each maps to a real Helix
// SVG under /public/icons/<category>/<Name>.svg. Icons are rendered as a CSS
// mask so the existing `text-*` colour classes and `text-[Npx]` sizes keep
// working (the source SVGs ship with a single flat fill).
const HELIX_ICON: Record<string, string> = {
  sensors:          "internet/internetSettings",
  sync:             "iconographic-navigation/Refresh",
  clear_all:        "iconographic-navigation/Refresh",
  queue:            "chat/BubbleDots",
  pause:            "iconographic-navigation/Stop",
  bug_report:       "general/Tools",
  settings:         "iconographic-navigation/Settings",
  logout:           "iconographic-navigation/Exit",
  info:             "iconographic-navigation/Info",
  call:             "mobile/Phone",
  cellular:         "mobile/Cullular",
  phone_in_talk:    "mobile/Phone",
  call_end:         "mobile/PhoneChatBubble",
  star:             "feedback/Star",
  trending_up:      "graph/Dynamic",
  rocket_launch:    "general/Rocket",
  tips_and_updates: "general/Sparks",
  sms:              "mobile/PhoneChatBubble",
  close:            "basic-navigation/Close",
  search:           "iconographic-navigation/Search",
  verified:         "shield/Check",
  check_circle:     "feedback/CheckCircle",
  add_shopping_cart:"general/Cart",
  arrow_upward:     "general/Arrow",
  favorite:         "feedback/ThumbsUpCheck",
  plus:             "basic-navigation/Plus",
  group:            "general/Group",
  receipt_long:     "file/FileEuro",
  inventory_2:      "general/Cart",
  shopping_cart:    "general/Cart",
  waving_hand:      "social-sustainability/HandShake",
  analytics:        "graph/Pie",
  // Aanbevolen-aanpak bullets use the indicator set (check / warning).
  bullet_check:     "indicator/CheckMark",
  bullet_warning:   "indicator/ExclemationMark",
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const path = HELIX_ICON[name] ?? "iconographic-navigation/Info";
  const url = `url("/icons/${path}.svg")`;
  return (
    <span
      role="img"
      aria-hidden
      className={`helix-icon ${className}`}
      style={{
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

export default function Hackathon26() {
  const [callers, setCallers] = useState<Caller[]>([]);
  const [localSeconds, setLocalSeconds] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Caller | null>(null);
  const [activeCall, setActiveCall] = useState<Caller | null>(null);
  const [callSeconds, setCallSeconds] = useState(0);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [usingLive, setUsingLive] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Spoofing verification — tracks which caller IDs have been verified
  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(new Set());
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", ""]);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[i] = digit;
    setOtpDigits(next);
    if (digit && i < 3) otpRefs[i + 1].current?.focus();
    if (next.every((d) => d !== "") && liveSelected) {
      setVerifiedIds((prev) => new Set([...prev, liveSelected.id]));
      setOtpDigits(["", "", "", ""]);
    }
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0) {
      otpRefs[i - 1].current?.focus();
    }
  };


  // Debug / demo panel
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugQuery, setDebugQuery] = useState("");
  const [debugResults, setDebugResults] = useState<{
    phone: string; name: string; firstName: string; lastName: string;
    segment: string; tag: string | null; customerValueScore: number;
    products: { energy: boolean; mobile: boolean; internet: boolean } | null;
    actions: Action[];
  }[]>([]);

  // Zoek klanten in de dataset (lege query = hele lijst)
  const searchCustomers = useCallback(async (q: string) => {
    setDebugQuery(q);
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`);
      if (res.ok) setDebugResults(await res.json());
    } catch { /* stil falen */ }
  }, []);

  // Injecteer een gesimuleerde beller in de lokale wachtrij
  const addSimulatedCaller = useCallback((r: typeof debugResults[number]) => {
    const fake: Caller = {
      id: `SIM_${Date.now()}`,
      name: r.name,
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone,
      segment: r.segment,
      tag: r.tag,
      customerValueScore: r.customerValueScore,
      waitSeconds: 0,
      reason: "Gesimuleerde call",
      priority: r.customerValueScore >= 85 ? 1000 : 0,
      customerId: null,
      customerNumber: null,
      email: null,
      churnRiskScore: 0,
      churnSegment: null,
      propensityScore: 0,
      propensitySegment: null,
      products: r.products,
      numProducts: r.products ? Object.values(r.products).filter(Boolean).length : 0,
      isMultiUtility: r.products ? Object.values(r.products).filter(Boolean).length > 1 : false,
      tariffType: null,
      tenureMonths: 0,
      contractEnding90d: false,
      actions: r.actions ?? [],
    };
    setCallers((prev) => [...prev, fake]);
    setLocalSeconds((prev) => ({ ...prev, [fake.id]: 0 }));
    setDebugOpen(false);
    setDebugQuery("");
    setDebugResults([]);
  }, [debugResults]);

  const activeCallRef = useRef<Caller | null>(null);
  activeCallRef.current = activeCall;

  // Auto-select the top caller only on the very first poll. After the agent has
  // engaged (e.g. ending a call clears the panel), a null selection stays null
  // so the screen stays on the empty state until they pick someone.
  const hasAutoSelectedRef = useRef(false);

  const isSimulated = (id: string) => id.startsWith("SIM_");

  // Poll Twilio API every 10 seconds — bewaart gesimuleerde callers
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/queue");
      if (!res.ok) return;
      const data: Caller[] = await res.json();
      setLocalSeconds((prev) => {
        const next = { ...prev };
        data.forEach((c) => {
          if (!(c.id in next)) next[c.id] = c.waitSeconds;
        });
        return next;
      });
      // Behoud gesimuleerde callers die niet in de actieve call zitten
      setCallers((prev) => {
        const sims = prev.filter(
          (c) => isSimulated(c.id) && c.id !== activeCallRef.current?.id
        );
        return [...data, ...sims];
      });
      setLastSync(new Date());
      setUsingLive(true);
      setSelected((prev) => {
        if (!prev) {
          // Only auto-pick a caller on the first load; afterwards an empty
          // panel (e.g. after ending a call) is left empty on purpose.
          if (hasAutoSelectedRef.current) return null;
          hasAutoSelectedRef.current = true;
          return data[0] ?? null;
        }
        if ([...data].some((c) => c.id === prev.id) || isSimulated(prev.id)) return prev;
        if (activeCallRef.current?.id === prev.id) return prev;
        return data[0] ?? null;
      });
    } catch {
      // Stil falen — wachtrij blijft leeg / ongewijzigd.
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchQueue();
    const poll = setInterval(fetchQueue, 10000);
    return () => clearInterval(poll);
  }, [fetchQueue]);

  // Wachttijd-timers lokaal laten tikken (zonder API-call)
  useEffect(() => {
    const tick = setInterval(() => {
      setLocalSeconds((prev) => {
        const next: Record<string, number> = {};
        callers.forEach((c) => {
          next[c.id] = (prev[c.id] ?? c.waitSeconds) + 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [callers]);

  // Gespreksduur-timer voor de actieve call (reset bij nieuwe call)
  useEffect(() => {
    if (!activeCall) return;
    setCallSeconds(0);
    const t = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [activeCall?.id]);

  const withLiveSeconds = callers.map((c) => ({
    ...c,
    waitSeconds: localSeconds[c.id] ?? c.waitSeconds,
  }));

  // Wachtrij = alles behalve de actieve call, gesorteerd op prioriteit
  const sorted = withLiveSeconds
    .filter((c) => c.id !== activeCall?.id)
    .sort((a, b) => b.priority - a.priority);

  const liveSelected: Caller | null = selected
    ? withLiveSeconds.find((c) => c.id === selected.id) ??
      (activeCall && activeCall.id === selected.id ? activeCall : selected)
    : null;

  const isActiveSelected = !!(activeCall && liveSelected && activeCall.id === liveSelected.id);

  const cancelTask = async (id: string) => {
    if (!isSimulated(id)) {
      try {
        await fetch(`/api/queue/${id}`, { method: "DELETE" });
      } catch {
        /* negeren — poll ruimt de rest op */
      }
    }
  };

  const startCall = async (c: Caller) => {
    // End the current active call first without removing the new caller from the queue
    if (activeCall && activeCall.id !== c.id) {
      await cancelTask(activeCall.id);
    }
    setActiveCall(c);
    setSelected(c);
    // Echte Twilio-call: stop de wachtmuziek en verbind de beller door
    if (!isSimulated(c.id)) {
      try {
        await fetch(`/api/queue/${c.id}/accept`, { method: "POST" });
      } catch {
        /* negeren — beller blijft in de wacht als dit faalt */
      }
    }
    fetchQueue();
  };

  const endCall = async () => {
    const id = activeCall?.id;
    setActiveCall(null);
    // Clear the detail panel back to the empty state when the ended call was
    // the one being shown (keep any other caller the agent had selected).
    setSelected((prev) => (prev && prev.id === id ? null : prev));
    if (id) {
      await cancelTask(id);
      fetchQueue();
    }
  };

  const upsellOffers = liveSelected ? buildUpsellOffers(liveSelected) : [];
  const subscription = liveSelected ? subscriptionLabel(liveSelected) : "";
  const bullets = liveSelected ? approachBullets(liveSelected) : [];

  const syncLabel = mounted
    ? `${lastSync.getHours().toString().padStart(2, "0")}:${lastSync
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${lastSync.getSeconds().toString().padStart(2, "0")}`
    : "—";

  return (
    <div className="hackathon26-root font-display bg-surface text-on-surface min-h-screen">
      {/* Helix icons render as a recolourable CSS mask (brand SVG silhouettes).
          Default to a 1em square that follows the surrounding text colour, so
          existing `text-*` and `text-[Npx]` utilities keep controlling it. */}
      <style>{`
        .helix-icon {
          display: inline-block;
          width: 1em; height: 1em;
          font-size: 24px;          /* default glyph size; text-[Npx] overrides */
          flex: none;
          background-color: currentColor;
          vertical-align: -0.15em;
        }
        .card-shadow { box-shadow: 0px 4px 20px rgba(0,0,0,0.05); }
      `}</style>

      {/* TopAppBar */}
      <header className="bg-on-background flex justify-between items-center w-full px-8 py-3 sticky top-0 z-50 h-12">
        <span className="text-headline-sm font-black text-surface-container-lowest">THUIS</span>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span className="text-label-caps text-primary-fixed uppercase tracking-widest">
              {usingLive ? "Live" : "Demo"}
            </span>
            <span className="text-label-caps text-surface-variant/60 ml-2">Sync {syncLabel}</span>
          </div>
          <div className="hidden md:block text-label-caps text-primary-fixed-dim">
            Agent dashboard — Hackathon 2026
          </div>
          <div className="flex items-center gap-4 text-primary-fixed">
            <Icon name="sensors" />
            <button onClick={fetchQueue} className="hover:opacity-80 transition-opacity active:scale-90" title="Nu synchroniseren">
              <Icon name="sync" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar: actieve call + wachtrij */}
        <aside className="fixed left-0 top-12 h-[calc(100vh-3rem)] w-[360px] bg-surface-container-lowest border-r border-outline-variant flex flex-col shadow-sm z-40 overflow-y-auto">
          <div className="p-6">
            {/* Actieve call */}
            <div className="mb-6">
              <h2 className="text-label-caps text-on-surface-variant uppercase mb-4">Actieve call</h2>
              {activeCall ? (
                <div
                  className="bg-primary-container/10 border-l-4 border-primary p-3 flex items-center justify-between rounded-r-lg cursor-pointer hover:bg-primary-container/20 transition-colors"
                  onClick={() => setSelected(activeCall)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-primary-container flex items-center justify-center bg-surface-container-lowest">
                      <span className="text-label-caps text-on-primary-container">{activeCall.customerValueScore}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-body-md font-bold text-on-surface">{activeCall.firstName || activeCall.name}</span>
                      <span className="text-label-caps text-on-surface-variant">
                        {maskPhone(activeCall.phone)}
                      </span>
                    </div>
                  </div>
                  <span className="text-label-caps text-on-surface-variant">in gesprek</span>
                </div>
              ) : (
                <div className="bg-surface-container-low border-l-4 border-outline-variant p-3 rounded-r-lg text-body-md text-on-surface-variant">
                  geen
                </div>
              )}
            </div>

            <div className="h-px w-full bg-outline-variant mb-6 opacity-40" />

            {/* Wachtrij */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-label-caps text-on-surface-variant uppercase">Wachtrij</h2>
                <h3 className="text-headline-sm text-on-surface">{sorted.length} bellers</h3>
              </div>
            </div>

            <div className="space-y-2">
              {sorted.length === 0 && (
                <div className="text-body-md text-on-surface-variant py-6 text-center">Geen wachtende bellers</div>
              )}
              {sorted.map((caller, i) => {
                const isSel = caller.id === selected?.id;
                return (
                  <div
                    key={caller.id}
                    onClick={() => setSelected(caller)}
                    className={`p-3 flex items-center justify-between rounded-lg cursor-pointer transition-colors border-l-4 ${
                      isSel
                        ? "bg-primary-container/10 border-primary hover:bg-primary-container/20"
                        : "border-transparent hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-label-caps w-4 ${isSel ? "text-primary" : "text-on-surface-variant"}`}>
                        {i + 1}
                      </span>
                      <div
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-surface-container-lowest ${
                          isSel ? "border-primary-container" : "border-outline-variant"
                        }`}
                      >
                        <span className={`text-label-caps ${isSel ? "text-on-primary-container" : "text-on-surface-variant"}`}>
                          {caller.customerValueScore}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-body-md font-bold text-on-surface flex items-center gap-1.5">
                          {caller.firstName || caller.name}
                          {isHighValue(caller) && (
                            <span className="px-1.5 py-px bg-on-background text-primary-fixed text-[9px] font-bold rounded tracking-wider">
                              HVC
                            </span>
                          )}
                        </span>
                        <span className="text-label-caps text-on-surface-variant truncate">
                          {caller.segment} • {maskPhone(caller.phone)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className={`text-body-md font-bold ${caller.waitSeconds > 120 ? "text-error" : "text-on-surface-variant"}`}>
                        {fmtWait(caller.waitSeconds)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="mt-auto border-t border-outline-variant p-2 flex flex-col gap-1">
            <div className="bg-primary-container text-on-primary-container flex items-center gap-3 px-4 py-3 rounded-lg font-bold">
              <Icon name="queue" />
              <span className="text-label-caps">Wachtrij</span>
            </div>
            {[
              { icon: "phone_in_talk", label: "Gesprekken" },
              { icon: "group", label: "Klanten" },
              { icon: "analytics", label: "Rapportage" },
            ].map((t) => (
              <div
                key={t.label}
                className="text-on-surface-variant hover:bg-surface-container-low flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer"
              >
                <Icon name={t.icon} />
                <span className="text-label-caps">{t.label}</span>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-outline-variant space-y-2">
            <button className="w-full py-3 bg-error text-on-error rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Icon name="pause" />
              <span className="text-label-caps">Start pauze</span>
            </button>
            {/* Demo-knoppen */}
            <div className="flex gap-2">
              <button
                onClick={() => { setDebugOpen(true); searchCustomers(""); }}
                className="flex-1 py-2 bg-inverse-surface text-inverse-on-surface rounded-lg text-label-caps font-bold flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <Icon name="bug_report" className="text-[15px]" />
                Demo
              </button>
              {callers.some((c) => isSimulated(c.id)) && (
                <button
                  onClick={() => {
                    setCallers((prev) => prev.filter((c) => !isSimulated(c.id)));
                    setSelected((prev) => (prev && isSimulated(prev.id) ? null : prev));
                  }}
                  className="flex-1 py-2 bg-error-container text-on-error-container rounded-lg text-label-caps font-bold flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <Icon name="clear_all" className="text-[15px]" />
                  Wis demo
                </button>
              )}
            </div>
            <div className="flex justify-around py-1">
              <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                <Icon name="settings" />
              </button>
              <button className="p-2 text-on-surface-variant hover:text-error transition-colors">
                <Icon name="logout" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-[360px] flex-1 p-8 overflow-y-auto">
          {!liveSelected ? (
            <div className="flex items-center justify-center h-[calc(100vh-3rem-4rem)] text-body-lg text-on-surface-variant">
              Selecteer een beller om de details te zien
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex justify-between items-start mb-8 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="text-display-lg text-on-surface">{liveSelected.firstName || liveSelected.name}</h1>
                    {isHighValue(liveSelected) && (
                      <span className="px-3 py-1.5 bg-on-background text-primary-fixed rounded-lg text-label-caps font-bold">
                        HVC
                      </span>
                    )}
                  </div>
                  <p className="text-on-surface-variant text-body-md flex items-center gap-2">
                    <Icon name="info" className="text-[16px]" />
                    {usingLive ? "Bron: Twilio TaskRouter (live)" : "Bron: demo-data — koppel Twilio via /api/queue"}
                  </p>
                </div>
                {isActiveSelected ? (
                  <button
                    onClick={endCall}
                    className="px-8 py-4 bg-error text-on-error rounded-lg font-bold text-headline-sm hover:scale-105 active:scale-95 transition-all card-shadow flex items-center gap-2 whitespace-nowrap"
                  >
                    <Icon name="call_end" />
                    Beëindig gesprek
                  </button>
                ) : (
                  <button
                    onClick={() => startCall(liveSelected)}
                    className="px-8 py-4 bg-primary-container text-on-primary-container rounded-lg font-bold text-headline-sm hover:scale-105 active:scale-95 transition-all card-shadow flex items-center gap-2 whitespace-nowrap"
                  >
                    <Icon name="cellular" />
                    Gesprek starten
                  </button>
                )}
              </div>

              {/* Bento grid */}
              <div className="grid grid-cols-12 gap-6 mb-6">
                {/* Klantwaarde — always visible */}
                <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-6 rounded-2xl card-shadow border-l-4 border-primary-container flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-label-caps text-on-surface-variant uppercase">Klantwaarde</h4>
                    <Icon name="star" className="text-primary-container" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-display-lg text-primary">{liveSelected.customerValueScore} / 100</span>
                    <div className="w-full h-3 bg-secondary-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary-container transition-all" style={{ width: `${liveSelected.customerValueScore}%` }} />
                    </div>
                    <p className="text-on-surface-variant text-body-md">{valueDescription(liveSelected.customerValueScore)}</p>
                  </div>
                </div>

                {/* Wachttijd / gespreksduur — always visible */}
                <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-6 rounded-2xl card-shadow flex flex-col gap-4">
                  <h4 className="text-label-caps text-on-surface-variant uppercase">
                    {isActiveSelected ? "Gespreksduur" : "Wachttijd"}
                  </h4>
                  <div className="flex flex-col gap-1">
                    {isActiveSelected ? (
                      <>
                        <span className="text-display-lg text-primary">{fmtWait(callSeconds)}</span>
                        <span className="text-body-md font-bold text-on-surface">In gesprek</span>
                        <p className="text-on-surface-variant text-body-md">Live gesprek bezig met {liveSelected.name}.</p>
                      </>
                    ) : (
                      <>
                        <span className={`text-display-lg ${liveSelected.waitSeconds > 120 ? "text-error" : "text-on-surface"}`}>
                          {fmtWait(liveSelected.waitSeconds)}
                        </span>
                        <span className="text-body-md font-bold text-on-surface">In de wacht</span>
                        <p className="text-on-surface-variant text-body-md">{waitDescription(liveSelected.waitSeconds)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Verified section — blurred until OTP confirmed */}
              <div className="relative mb-6">
                <div className={`grid grid-cols-12 gap-6 transition-all duration-300 ${!verifiedIds.has(liveSelected.id) ? "blur-sm pointer-events-none select-none" : ""}`}>

                  {/* Contactinformatie */}
                  <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-6 rounded-2xl card-shadow">
                    <h4 className="text-label-caps text-on-surface-variant uppercase mb-4">Contactinformatie</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-label-caps text-secondary uppercase">Telefoonnummer</p>
                        <p className="text-data-point text-on-surface">{maskPhone(liveSelected.phone)}</p>
                      </div>
                      <div>
                        <p className="text-label-caps text-secondary uppercase">Type abonnement</p>
                        <p className="text-body-lg font-bold text-on-surface">{subscription}</p>
                      </div>
                    </div>
                  </div>

                  {/* Gespreksdetails */}
                  <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-6 rounded-2xl card-shadow">
                    <h4 className="text-label-caps text-on-surface-variant uppercase mb-4">Gespreksdetails</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-label-caps text-secondary uppercase">Reden van bellen</p>
                        <p className="text-data-point text-on-surface">{liveSelected.reason}</p>
                      </div>
                      <div>
                        <p className="text-label-caps text-secondary uppercase">Eerdere interacties</p>
                        <p className="text-body-lg font-bold text-on-surface">{liveSelected.tenureMonths > 0 ? `${liveSelected.tenureMonths} maanden klant` : "Nieuwe klant"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Upsell kansen */}
                  <div className="col-span-12 bg-surface-container-lowest p-6 rounded-2xl card-shadow border-2 border-primary-container relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Icon name="trending_up" className="text-[80px]" />
                    </div>
                    <div className="flex items-center gap-2 mb-6">
                      <Icon name="rocket_launch" className="text-primary" />
                      <h4 className="text-headline-sm text-on-surface uppercase tracking-tight">
                        Upsell kansen voor {liveSelected.name}
                      </h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      {upsellOffers.map((offer: UpsellOffer, i: number) => (
                        <div
                          key={`${offer.title}-${i}`}
                          className="p-4 rounded-lg bg-primary-container/5 border border-primary-container/30 flex flex-col justify-between hover:bg-primary-container/10 transition-colors"
                        >
                          <div>
                            <h5 className="text-body-lg font-bold text-on-surface mb-1">{offer.title}</h5>
                            <p className="text-body-md text-on-surface-variant mb-4">{offer.desc}</p>
                            {offer.tips.length > 0 && (
                              <div className="mb-4 space-y-2">
                                {offer.tips.map((tip: string) => (
                                  <div key={tip} className="flex items-start gap-2 bg-primary-container/10 rounded-lg px-3 py-2">
                                    <Icon name="tips_and_updates" className="text-primary text-[16px] mt-0.5 shrink-0" />
                                    <p className="text-body-md text-on-surface">{tip}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button className="w-full py-2 bg-primary-container text-on-primary-container rounded-lg font-bold text-label-caps flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                            <Icon name={offer.icon} className="text-[18px]" />
                            {offer.cta}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Aanbevolen aanpak */}
                  <div className="col-span-12 bg-surface-container-lowest p-6 rounded-2xl card-shadow border-t-4 border-on-background">
                    <h4 className="text-label-caps text-on-surface-variant uppercase mb-4">Aanbevolen aanpak</h4>
                    <ul className="space-y-3">
                      {bullets.map((b, i) => (
                        <li key={i} className={`flex items-start gap-3 ${b.highlight ? "bg-primary-container/5 p-2 rounded" : ""}`}>
                          <Icon name={b.icon} className="text-primary text-[20px]" />
                          <p className={`text-body-md text-on-surface ${b.highlight ? "font-bold" : ""}`}>{b.text}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* OTP overlay */}
                {!verifiedIds.has(liveSelected.id) && (
                  <div className="absolute inset-0 flex items-start justify-center pt-12 z-10">
                    <div className="bg-surface-container-lowest rounded-2xl card-shadow border border-outline-variant w-[340px] p-6 flex flex-col gap-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                          <Icon name="sms" className="text-primary text-[20px]" />
                        </div>
                        <div>
                          <p className="text-body-lg font-bold text-on-surface">Verificatie vereist</p>
                          <p className="text-body-md text-on-surface-variant">
                            Er is een SMS gestuurd naar {liveSelected.firstName || liveSelected.name}. Vraag de 4-cijferige code.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 justify-center">
                        {otpDigits.map((d, i) => (
                          <input
                            key={i}
                            ref={otpRefs[i]}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKey(i, e)}
                            onFocus={(e) => e.target.select()}
                            className="w-14 h-14 text-center text-display-sm font-bold rounded-xl border-2 border-outline-variant bg-surface-container-low text-on-surface focus:border-primary focus:outline-none transition-colors"
                          />
                        ))}
                      </div>
                      <p className="text-label-caps text-on-surface-variant text-center">
                        Voer de code in om klantgegevens te ontgrendelen
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-center opacity-40">
                <div className="flex items-center gap-4 text-label-caps uppercase text-secondary">
                  <span className="h-px w-12 bg-outline-variant" />
                  Einde van dashboard overzicht
                  <span className="h-px w-12 bg-outline-variant" />
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Contextuele hint (demo) */}
      {debugOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDebugOpen(false)}>
          <div className="bg-surface-container-lowest rounded-2xl card-shadow w-[420px] max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-outline-variant">
              <div>
                <p className="text-headline-sm text-on-surface font-bold">Simuleer beller</p>
                <p className="text-body-md text-on-surface-variant mt-0.5">Voeg een klant toe aan de wachtrij</p>
              </div>
              <button onClick={() => setDebugOpen(false)} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
                <Icon name="close" />
              </button>
            </div>

            {/* Zoek */}
            <div className="p-4 border-b border-outline-variant">
              <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
                <Icon name="search" className="text-on-surface-variant text-[18px]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Zoek op naam of nummer..."
                  value={debugQuery}
                  onChange={(e) => searchCustomers(e.target.value)}
                  className="flex-1 bg-transparent text-body-md text-on-surface outline-none placeholder:text-on-surface-variant"
                />
                {debugQuery && (
                  <button onClick={() => searchCustomers("")} className="text-on-surface-variant hover:text-on-surface">
                    <Icon name="close" className="text-[16px]" />
                  </button>
                )}
              </div>
            </div>

            {/* Resultaten */}
            <div className="overflow-y-auto flex-1">
              {debugResults.length === 0 && (
                <p className="text-body-md text-on-surface-variant text-center py-10">Geen resultaten gevonden</p>
              )}
              {debugResults.map((r) => (
                <div key={r.phone} className="flex items-center justify-between px-5 py-3 hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-[11px] font-bold shrink-0 ${r.customerValueScore >= 90 ? "border-primary-container text-on-primary-container" : "border-outline-variant text-on-surface-variant"}`}>
                      {r.customerValueScore}
                    </div>
                    <div>
                      <p className="text-body-md font-bold text-on-surface flex items-center gap-1.5">
                        {r.firstName || r.name}
                        {r.tag === "High Value Customer" && (
                          <span className="px-1.5 py-px bg-on-background text-primary-fixed text-[9px] font-bold rounded tracking-wider">HVC</span>
                        )}
                      </p>
                      <p className="text-label-caps text-on-surface-variant">{r.segment} · {maskPhone(r.phone)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addSimulatedCaller(r)}
                    className="px-3 py-1.5 bg-primary-container text-on-primary-container rounded-lg text-label-caps font-bold hover:brightness-110 active:scale-95 transition-all shrink-0"
                  >
                    Toevoegen
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {liveSelected && upsellOffers.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-inverse-surface text-inverse-on-surface px-6 py-4 rounded-2xl card-shadow flex items-center gap-4 border border-outline">
            <Icon name="verified" className="text-primary-fixed" />
            <div>
              <p className="text-label-caps font-bold">Upsell mogelijkheid</p>
              <p className="text-body-md">
                {upsellOffers[0].title} is meest relevant voor {liveSelected.name}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
