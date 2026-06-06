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

const ACTION_UPSELL: Record<string, UpsellOffer> = {
  crosssell_mobile: {
    title: "Cross-sell: Mobiel",
    desc: "Klant heeft nog geen mobiel abonnement. Combineer met energie voor bundelkorting.",
    tips: ["Benadruk gemak van één factuur", "Eerste maand korting"],
    cta: "Bied mobiel aan",
    icon: "smartphone",
  },
  crosssell_internet: {
    title: "Cross-sell: Internet",
    desc: "Klant heeft nog geen internetabonnement. Bundelen bespaart direct.",
    tips: ["Benadruk bundelbesparing", "Gratis installatie actie"],
    cta: "Bied internet aan",
    icon: "wifi",
  },
  bundle: {
    title: "Bundelkans",
    desc: "Klant heeft één product. Multi-utility korting beschikbaar bij een tweede product.",
    tips: ["Benadruk multi-utility voordeel", "Toon concrete besparing"],
    cta: "Presenteer bundel",
    icon: "add_shopping_cart",
  },
  upsell: {
    title: "Upgrade kans",
    desc: "Hoge upsell-propensity — klant staat open voor een hoger pakket.",
    tips: ["Benadruk premium voordelen", "Eerste maand korting"],
    cta: "Bied upgrade aan",
    icon: "arrow_upward",
  },
};

function buildUpsellOffers(c: Caller): UpsellOffer[] {
  const offers: UpsellOffer[] = [];
  for (const action of c.actions) {
    if (action.type === "crosssell" && action.label.toLowerCase().includes("mobiel"))
      offers.push(ACTION_UPSELL.crosssell_mobile);
    else if (action.type === "crosssell" && action.label.toLowerCase().includes("internet"))
      offers.push(ACTION_UPSELL.crosssell_internet);
    else if (action.type === "bundle") offers.push(ACTION_UPSELL.bundle);
    else if (action.type === "upsell") offers.push(ACTION_UPSELL.upsell);
  }
  return offers;
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
      out.push({ icon: "check_circle", text: `Excuses aanbieden voor de wachttijd (${fmtWait(c.waitSeconds)}) voordat het gesprek begint.` });
    for (const action of c.actions) {
      const highlight = action.type === "retentie" || action.type === "upsell";
      out.push({ icon: highlight ? "trending_up" : "check_circle", highlight, text: action.label });
    }
    return out;
  }
  // Fallback voor klanten zonder verrijkte actions (onbekende bellers)
  const out: ApproachBullet[] = [];
  if (c.segment === "Risico op churn")
    out.push({ icon: "check_circle", text: "Retentiescript actief. Bied bij passende gelegenheid een retentiekorting aan. Escaleer niet zonder akkoord leidinggevende." });
  else if (c.segment === "Premium")
    out.push({ icon: "check_circle", text: `Premiumklant (${c.customerValueScore}/100). Direct en persoonlijk behandelen zonder scripts.` });
  else
    out.push({ icon: "check_circle", text: "Standaardafhandeling. Volg het reguliere gesprekscript en let op upgrade-kansen." });
  if (c.waitSeconds > 120)
    out.push({ icon: "check_circle", text: `Excuses aanbieden voor de wachttijd (${fmtWait(c.waitSeconds)}) voordat het gesprek begint.` });
  if (isHighValue(c))
    out.push({ icon: "trending_up", highlight: true, text: `Transitie: gebruik de hoge klantwaarde om over te stappen naar een hoger pakket.` });
  return out;
}
// ─────────────────────────────────────────────────────────────────────────

function Icon({ name, className = "", fill = false }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
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

  // Debug / demo panel
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugQuery, setDebugQuery] = useState("");
  const [debugResults, setDebugResults] = useState<{
    phone: string; name: string; firstName: string; lastName: string;
    segment: string; tag: string | null; customerValueScore: number;
    products: { energy: boolean; mobile: boolean; internet: boolean } | null;
  }[]>([]);

  // Zoek klanten in de dataset
  const searchCustomers = useCallback(async (q: string) => {
    setDebugQuery(q);
    if (q.trim().length < 2) { setDebugResults([]); return; }
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
      actions: [],
    };
    setCallers((prev) => [...prev, fake]);
    setLocalSeconds((prev) => ({ ...prev, [fake.id]: 0 }));
    setDebugOpen(false);
    setDebugQuery("");
    setDebugResults([]);
  }, [debugResults]);

  const activeCallRef = useRef<Caller | null>(null);
  activeCallRef.current = activeCall;

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
        if (!prev) return data[0] ?? null;
        if ([...data].some((c) => c.id === prev.id) || isSimulated(prev.id)) return prev;
        if (activeCallRef.current?.id === prev.id) return prev;
        return data[0] ?? null;
      });
    } catch {
      // Stil falen — wachtrij blijft leeg / ongewijzigd.
    }
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

  const startCall = (c: Caller) => {
    setActiveCall(c);
    setSelected(c);
  };

  const endCall = async () => {
    const id = activeCall?.id;
    setActiveCall(null);
    if (id) {
      try {
        await fetch(`/api/queue/${id}`, { method: "DELETE" });
      } catch {
        /* negeren — poll ruimt de rest op */
      }
      fetchQueue();
    }
  };

  const upsellOffers = liveSelected ? buildUpsellOffers(liveSelected) : [];
  const subscription = liveSelected ? subscriptionLabel(liveSelected) : "";
  const bullets = liveSelected ? approachBullets(liveSelected) : [];

  const syncLabel = `${lastSync.getHours().toString().padStart(2, "0")}:${lastSync
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${lastSync.getSeconds().toString().padStart(2, "0")}`;

  return (
    <div className="font-display bg-surface text-on-surface min-h-screen">
      {/* Fonts + icon-styles */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;900&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />
      <style>{`
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal; font-style: normal; line-height: 1;
          letter-spacing: normal; text-transform: none; display: inline-block;
          white-space: nowrap; word-wrap: normal; direction: ltr;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
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
                        {activeCall.phone}
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
                          {caller.segment} • {caller.phone}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className={`text-body-md font-bold ${caller.waitSeconds > 120 ? "text-error" : "text-on-surface-variant"}`}>
                        {fmtWait(caller.waitSeconds)}
                      </span>
                      <span className="text-label-caps text-on-surface-variant">prio {caller.priority}</span>
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
                onClick={() => { setDebugOpen(true); setDebugQuery(""); setDebugResults([]); }}
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
                    className="px-8 py-4 bg-error text-on-error rounded-xl font-bold text-headline-sm hover:scale-105 active:scale-95 transition-all card-shadow flex items-center gap-2 whitespace-nowrap"
                  >
                    <Icon name="call_end" />
                    Beëindig gesprek
                  </button>
                ) : (
                  <button
                    onClick={() => startCall(liveSelected)}
                    className="px-8 py-4 bg-primary-container text-on-primary-container rounded-xl font-bold text-headline-sm hover:scale-105 active:scale-95 transition-all card-shadow flex items-center gap-2 whitespace-nowrap"
                  >
                    <Icon name="call" />
                    Gesprek starten
                  </button>
                )}
              </div>

              {/* Bento grid */}
              <div className="grid grid-cols-12 gap-6 mb-6">
                {/* Klantwaarde */}
                <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-6 rounded-xl card-shadow border-l-4 border-primary-container flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-label-caps text-on-surface-variant uppercase">Klantwaarde</h4>
                    <Icon name="star" className="text-primary-container" fill={isHighValue(liveSelected)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-display-lg text-primary">{liveSelected.customerValueScore} / 100</span>
                    <div className="w-full h-3 bg-secondary-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary-container transition-all" style={{ width: `${liveSelected.customerValueScore}%` }} />
                    </div>
                    <p className="text-on-surface-variant text-body-md">{valueDescription(liveSelected.customerValueScore)}</p>
                  </div>
                </div>

                {/* Wachttijd / gespreksduur */}
                <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-6 rounded-xl card-shadow flex flex-col gap-4">
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

                {/* Contactinformatie */}
                <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-6 rounded-xl card-shadow">
                  <h4 className="text-label-caps text-on-surface-variant uppercase mb-4">Contactinformatie</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-label-caps text-secondary uppercase">Telefoonnummer</p>
                      <p className="text-data-point text-on-surface">{liveSelected.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-label-caps text-secondary uppercase">Type abonnement</p>
                      <p className="text-body-lg font-bold text-on-surface">{subscription}</p>
                    </div>
                  </div>
                </div>

                {/* Gespreksdetails */}
                <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-6 rounded-xl card-shadow">
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

                {/* Upsell kansen (demo) */}
                <div className="col-span-12 bg-surface-container-lowest p-6 rounded-xl card-shadow border-2 border-primary-container relative overflow-hidden">
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
                    {upsellOffers.map((offer: UpsellOffer) => (
                      <div
                        key={offer.title}
                        className="p-4 rounded-lg bg-primary-container/5 border border-primary-container/30 flex flex-col justify-between hover:bg-primary-container/10 transition-colors"
                      >
                        <div>
                          <h5 className="text-body-lg font-bold text-on-surface mb-1">{offer.title}</h5>
                          <p className="text-body-md text-on-surface-variant mb-4">{offer.desc}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {offer.tips.map((tip: string) => (
                              <span
                                key={tip}
                                className="px-2 py-1 bg-primary-container/10 text-on-primary-container text-[11px] font-bold rounded uppercase tracking-tight"
                              >
                                Tip: {tip}
                              </span>
                            ))}
                          </div>
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
                <div className="col-span-12 bg-surface-container-lowest p-6 rounded-xl card-shadow border-t-4 border-on-background">
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
                  <button onClick={() => { setDebugQuery(""); setDebugResults([]); }} className="text-on-surface-variant hover:text-on-surface">
                    <Icon name="close" className="text-[16px]" />
                  </button>
                )}
              </div>
            </div>

            {/* Resultaten */}
            <div className="overflow-y-auto flex-1">
              {debugQuery.length < 2 && (
                <p className="text-body-md text-on-surface-variant text-center py-10">Typ minimaal 2 tekens om te zoeken</p>
              )}
              {debugQuery.length >= 2 && debugResults.length === 0 && (
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
                      <p className="text-label-caps text-on-surface-variant">{r.segment} · {r.phone}</p>
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
          <div className="bg-inverse-surface text-inverse-on-surface px-6 py-4 rounded-xl card-shadow flex items-center gap-4 border border-outline">
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
