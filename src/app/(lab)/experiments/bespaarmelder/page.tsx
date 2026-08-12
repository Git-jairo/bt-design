"use client";

/**
 * BESPAARMELDER — one central customer-data platform, many touchpoints.
 *
 * A capture → platform → activate pipeline: data is captured at every
 * touchpoint (the Bespaarmelder mail, an agent chat, the app …), lands as
 * structured fields IN the platform, and is activated into the right action
 * (cross-sell to high-propensity customers, renewal/win-back to predicted
 * leavers). The scenario player drives the whole thing live.
 *
 * Self-contained: simulated data only (./data.ts), inline icons, scoped CSS.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./bespaarmelder.module.css";
import { Icon } from "./icons";
import {
  CAPTURE_SOURCES,
  ACTIONS,
  FIELD_GROUPS,
  SCENARIOS,
  SCENARIO_BY_ID,
  PROPENSITY_FACTORS,
  CHURN_FACTORS,
  scoreWith,
  recommendAction,
  type Signals,
  type FieldGroup,
  type CaptureSource,
  type PlatformAction,
} from "./data";

/* tone → brand colour, with a translucent companion for soft fills */
const TONE: Record<string, string> = {
  cross: "var(--bm-cross)",
  renew: "var(--bm-renew)",
  win: "var(--bm-win)",
  time: "var(--bm-time)",
};
function toneVars(tone: string, prefix: "card" | "action" | "panel" | "chip") {
  const c = TONE[tone] ?? "var(--bm-in)";
  return {
    [`--${prefix}-accent`]: c,
    [`--${prefix}-soft`]: `color-mix(in srgb, ${c} 16%, transparent)`,
  } as React.CSSProperties;
}

type Detail =
  | { type: "source"; id: string }
  | { type: "action"; id: string }
  | { type: "score"; id: "propensity" | "churn" }
  | null;

export default function BespaarmelderPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [stepIndex, setStepIndex] = useState<number>(-1); // -1 = not started
  const [playing, setPlaying] = useState(false);
  const [detail, setDetail] = useState<Detail>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const scenario = SCENARIO_BY_ID[scenarioId];
  const last = scenario.steps.length - 1;
  const started = stepIndex >= 0;

  // theme: stored choice → system → dark. Post-mount to avoid hydration mismatch.
  useEffect(() => {
    const stored = localStorage.getItem("bm-theme");
    const next =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from a browser-only API
    setTheme(next);
  }, []);
  useEffect(() => {
    localStorage.setItem("bm-theme", theme);
  }, [theme]);

  // auto-advance the scenario while playing
  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= last) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stop at the end of the scenario
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStepIndex((i) => i + 1), 2400);
    return () => clearTimeout(t);
  }, [playing, stepIndex, last]);

  // derive everything the platform knows from the steps revealed so far
  const { signals, fieldsByGroup } = useMemo(() => {
    const sig: Signals = {};
    const map = new Map<string, { label: string; value: string; group: FieldGroup }>();
    scenario.steps.slice(0, stepIndex + 1).forEach((s) => {
      Object.assign(sig, s.signals ?? {});
      s.writes?.forEach((w) => map.set(w.id, { label: w.label, value: w.value, group: w.group }));
    });
    const byGroup: Record<FieldGroup, { id: string; label: string; value: string }[]> = {
      identiteit: [],
      producten: [],
      gedrag: [],
      voorspelling: [],
    };
    map.forEach((v, id) => byGroup[v.group].push({ id, label: v.label, value: v.value }));
    return { signals: sig, fieldsByGroup: byGroup };
  }, [scenario, stepIndex]);

  const propensity = scoreWith(PROPENSITY_FACTORS, signals);
  const churn = scoreWith(CHURN_FACTORS, signals);
  const rec = started ? recommendAction(propensity.score, churn.score, signals) : null;
  const activeSourceId = started ? scenario.sourceId : null;
  const totalFields = Object.values(fieldsByGroup).reduce((n, a) => n + a.length, 0);

  function startScenario(id: string) {
    setScenarioId(id);
    setStepIndex(-1);
    setPlaying(false);
    setDetail(null);
    requestAnimationFrame(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }
  function play() {
    if (stepIndex >= last) {
      setStepIndex(0);
      setPlaying(true);
      return;
    }
    if (stepIndex < 0) setStepIndex(0);
    setPlaying(true);
  }

  return (
    <div className={styles.root} data-theme={theme}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <Icon name="database" />
          </span>
          <span>
            <span className={styles.brandKicker}>Budget Thuis · Design</span>
            <span className={styles.brandTitle}>Bespaarmelder</span>
          </span>
        </div>
        <button
          className={styles.iconBtn}
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          aria-label="Wissel licht / donker"
          title="Licht / donker"
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
      </header>

      <div className={styles.shell}>
        <section className={styles.intro}>
          <span className={styles.introKicker}>
            <span className={styles.pulse} />
            Eén klantdataplatform · architectuurconcept
          </span>
          <h1 className={styles.introTitle}>
            Elk contactmoment voedt <em>hetzelfde brein</em>
          </h1>
          <p className={styles.introLead}>
            De Bespaarmelder is geen losse mail, maar één centraal platform. Elk
            touchpoint legt data vast — van de Bespaarmelder-mail tot een chat met de
            agent — die als gestructureerde velden in het platform landt. Daaruit
            activeren we de juiste actie: cross-sell bij een hoge propensity,
            verlenging of win-back zodra we vertrek zien aankomen.
          </p>
        </section>

        {/* ── Pipeline ─────────────────────────────────────────────────────── */}
        <section className={styles.pipeline}>
          {/* Capture lane */}
          <div className={styles.lane}>
            <div className={styles.laneHead}>
              <span className={styles.laneTitle}>Capture</span>
              <span className={styles.laneTag}>Touchpoints</span>
            </div>
            {CAPTURE_SOURCES.map((src) => (
              <SourceCard
                key={src.id}
                src={src}
                active={activeSourceId === src.id}
                dimmed={!!activeSourceId && activeSourceId !== src.id}
                onClick={() => setDetail({ type: "source", id: src.id })}
              />
            ))}
          </div>

          <Gutter color="var(--bm-in)" label="Vastleggen" active={started} />

          {/* Platform */}
          <div className={styles.lane}>
            <div className={styles.laneHead}>
              <span className={styles.laneTitle}>Platform</span>
              <span className={styles.laneTag}>Klantprofiel</span>
            </div>
            <div className={styles.platform}>
              <span className={styles.platformGlow} />
              <div className={styles.platformHead}>
                <span className={styles.platformBadge}>
                  <Icon name="database" />
                </span>
                <span>
                  <span className={styles.platformKicker}>Centrale kern</span>
                  <span className={styles.platformTitle}>Klantdataplatform</span>
                </span>
              </div>

              <div className={styles.scoreRow}>
                <ScoreWidget
                  name="Propensity"
                  value={started ? propensity.score : null}
                  color="var(--bm-in)"
                  band={(v) => (v >= 66 ? "Hoog" : v >= 50 ? "Gemiddeld" : "Laag")}
                  onClick={() => setDetail({ type: "score", id: "propensity" })}
                />
                <ScoreWidget
                  name="Churn-risico"
                  value={started ? churn.score : null}
                  color="var(--bm-win)"
                  band={(v) => (v >= 55 ? "Hoog risico" : v >= 40 ? "Gemiddeld" : "Laag")}
                  onClick={() => setDetail({ type: "score", id: "churn" })}
                />
              </div>

              {totalFields === 0 ? (
                <div className={styles.pEmpty}>
                  Nog geen data vastgelegd. Speel hieronder een scenario af om te zien
                  welke velden binnenkomen en wat het platform ermee doet.
                </div>
              ) : (
                <div className={styles.profileScroll}>
                  {FIELD_GROUPS.map((g) =>
                    fieldsByGroup[g.id].length ? (
                      <div key={g.id} className={styles.pGroup}>
                        <div className={styles.pGroupLabel}>{g.label}</div>
                        {fieldsByGroup[g.id].map((f) => (
                          <div key={f.id} className={styles.pField}>
                            <span className={styles.pFieldLabel}>{f.label}</span>
                            <span className={styles.pFieldValue}>{f.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>

          <Gutter color="var(--bm-out)" label="Activeren" active={started} />

          {/* Activation lane */}
          <div className={styles.lane}>
            <div className={styles.laneHead}>
              <span className={styles.laneTitle}>Activate</span>
              <span className={styles.laneTag}>Acties</span>
            </div>
            {ACTIONS.map((a) => (
              <ActionCard
                key={a.id}
                action={a}
                active={rec?.actionId === a.id}
                dimmed={!!rec && rec.actionId !== a.id}
                onClick={() => setDetail({ type: "action", id: a.id })}
              />
            ))}
          </div>
        </section>

        {/* ── Scenario player ──────────────────────────────────────────────── */}
        <section className={styles.player} ref={playerRef}>
          <div className={styles.sectionLabel}>Live demo · zo stroomt data door het platform</div>
          <div className={styles.playerCard}>
            <div className={styles.playerBar}>
              <div className={styles.scenarioChips}>
                {SCENARIOS.map((s) => {
                  const src = CAPTURE_SOURCES.find((c) => c.id === s.sourceId)!;
                  const tone =
                    s.id === "cross-sell" ? "cross" : s.id === "renewal" ? "renew" : "win";
                  return (
                    <button
                      key={s.id}
                      className={`${styles.scenChip}${scenarioId === s.id ? ` ${styles.scenChipActive}` : ""}`}
                      style={toneVars(tone, "chip")}
                      onClick={() => startScenario(s.id)}
                    >
                      <span className={styles.dot} />
                      {src.label}
                    </button>
                  );
                })}
              </div>
              <div className={styles.controls}>
                <button
                  className={styles.ctrlBtn}
                  onClick={() => {
                    setPlaying(false);
                    setStepIndex(-1);
                  }}
                  disabled={!started}
                  aria-label="Opnieuw"
                  title="Opnieuw"
                >
                  <Icon name="restart" />
                </button>
                <button
                  className={`${styles.ctrlBtn} ${styles.ctrlPrimary}`}
                  onClick={() => (playing ? setPlaying(false) : play())}
                  aria-label={playing ? "Pauze" : "Afspelen"}
                  title={playing ? "Pauze" : "Afspelen"}
                >
                  <Icon name={playing ? "pause" : "play"} />
                </button>
                <button
                  className={styles.ctrlBtn}
                  onClick={() => {
                    setPlaying(false);
                    setStepIndex((i) => Math.min(last, i + 1));
                  }}
                  disabled={stepIndex >= last}
                  aria-label="Volgende stap"
                  title="Volgende stap"
                >
                  <Icon name="next" />
                </button>
              </div>
            </div>

            <div className={styles.playerStage}>
              <div className={styles.transcript}>
                <div className={styles.transcriptHead}>
                  <span className={styles.transcriptCust}>{scenario.customer}</span>
                  <span className={styles.transcriptSum}>{scenario.summary}</span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${started ? ((stepIndex + 1) / (last + 1)) * 100 : 0}%` }}
                  />
                </div>

                {!started ? (
                  <div className={styles.placeholder}>
                    <Icon name="play" />
                    <span>Druk op afspelen om dit touchpoint live data te zien vastleggen.</span>
                  </div>
                ) : (
                  scenario.steps.slice(0, stepIndex + 1).map((s, i) => <Bubble key={i} step={s} />)
                )}
              </div>

              <div className={styles.result}>
                {rec ? (
                  <ResultPanel actionId={rec.actionId} reason={rec.reason} live={!playing && stepIndex >= last} />
                ) : (
                  <div className={styles.resultWaiting}>
                    <span className={styles.illu}>Illustratief</span>
                    Speel het scenario af — het platform berekent live de propensity- en
                    churn-score en beveelt de passende actie aan.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Detail panels ──────────────────────────────────────────────────── */}
      {detail?.type === "source" && (
        <SourcePanel
          src={CAPTURE_SOURCES.find((s) => s.id === detail.id)!}
          onClose={() => setDetail(null)}
          onPlay={startScenario}
        />
      )}
      {detail?.type === "action" && (
        <ActionPanel action={ACTIONS.find((a) => a.id === detail.id)!} onClose={() => setDetail(null)} />
      )}
      {detail?.type === "score" && (
        <ScorePanel
          which={detail.id}
          result={detail.id === "propensity" ? propensity : churn}
          started={started}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function Gutter({ color, label, active }: { color: string; label: string; active: boolean }) {
  const tops = [28, 44, 60, 76];
  return (
    <div className={`${styles.gutter}${active ? ` ${styles.gutterActive}` : ""}`} aria-hidden>
      {tops.map((t, i) => (
        <span
          key={i}
          className={styles.flowDot}
          style={{ top: `${t}%`, animationDelay: `${i * 0.6}s`, ["--gutter-color" as string]: color }}
        />
      ))}
      <span className={styles.gutterLabel}>{label}</span>
    </div>
  );
}

function SourceCard({
  src,
  active,
  dimmed,
  onClick,
}: {
  src: CaptureSource;
  active: boolean;
  dimmed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`${styles.card}${active ? ` ${styles.cardActive}` : ""}${dimmed ? ` ${styles.cardDim}` : ""}`}
      onClick={onClick}
    >
      <span className={styles.cardIcon}>
        <Icon name={src.icon} />
      </span>
      <span className={styles.cardBody}>
        <span className={styles.cardTitle}>
          {src.label}
          {src.scenarioId && (
            <span className={styles.demoBadge}>
              <Icon name="play" /> demo
            </span>
          )}
        </span>
        <span className={styles.cardSub}>{src.blurb}</span>
      </span>
    </button>
  );
}

function ActionCard({
  action,
  active,
  dimmed,
  onClick,
}: {
  action: PlatformAction;
  active: boolean;
  dimmed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`${styles.card}${active ? ` ${styles.cardActive}` : ""}${dimmed ? ` ${styles.cardDim}` : ""}`}
      style={toneVars(action.tone, "card")}
      onClick={onClick}
    >
      <span className={styles.cardIcon}>
        <Icon name={action.icon} />
      </span>
      <span className={styles.cardBody}>
        <span className={styles.cardTitle}>{action.label}</span>
        <span className={styles.cardSub}>{action.audience}</span>
        <span className={styles.cardChips}>
          <span className={styles.miniChip}>{action.condition}</span>
        </span>
      </span>
    </button>
  );
}

function ScoreWidget({
  name,
  value,
  color,
  band,
  onClick,
}: {
  name: string;
  value: number | null;
  color: string;
  band: (v: number) => string;
  onClick: () => void;
}) {
  return (
    <div className={styles.score} style={{ ["--score-color" as string]: color }} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}>
      <div className={styles.scoreTop}>
        <span className={styles.scoreName}>{name}</span>
        <span className={styles.scoreVal}>{value === null ? "–" : value}</span>
      </div>
      <div className={styles.scoreBar}>
        <div className={styles.scoreFill} style={{ width: `${value ?? 0}%` }} />
      </div>
      <div className={styles.scoreBand}>{value === null ? "wacht op data" : band(value)}</div>
    </div>
  );
}

function Bubble({ step }: { step: (typeof SCENARIOS)[number]["steps"][number] }) {
  const cls =
    step.speaker === "klant"
      ? styles.bubbleKlant
      : step.speaker === "agent"
        ? styles.bubbleAgent
        : step.speaker === "system"
          ? styles.bubbleSystem
          : styles.bubbleEvent;
  const role =
    step.speaker === "klant" ? "Klant" : step.speaker === "agent" ? "Agent" : null;
  return (
    <div className={`${styles.bubble} ${cls}`}>
      {step.speaker === "system" && (
        <span style={{ width: 15, height: 15, flex: "none", marginTop: 1, color: "var(--bm-in)" }}>
          <Icon name="zap" />
        </span>
      )}
      <span>
        {role && <span className={styles.bubbleRole}>{role}</span>}
        {step.text}
        {step.writes && step.writes.length > 0 && (
          <span className={styles.bubbleWrites}>
            {step.writes.map((w) => (
              <span key={w.id} className={styles.writeTag}>
                <Icon name="check" /> {w.label}
              </span>
            ))}
          </span>
        )}
      </span>
    </div>
  );
}

function ResultPanel({ actionId, reason, live }: { actionId: string; reason: string; live: boolean }) {
  const action = ACTIONS.find((a) => a.id === actionId)!;
  return (
    <>
      <div className={styles.resultActionCard} style={toneVars(action.tone, "action")}>
        <div className={styles.resultActionTop}>
          <span className={styles.resultActionIcon}>
            <Icon name={action.icon} />
          </span>
          <span>
            <span className={styles.resultActionKicker}>
              {live ? "Aanbevolen actie" : "Tussenstand"}
            </span>
            <span className={styles.resultActionLabel} style={{ display: "block" }}>
              {action.label}
            </span>
          </span>
        </div>
        <p className={styles.resultActionBlurb}>{action.blurb}</p>
      </div>
      <div className={styles.reasonBox}>
        <span className={styles.reasonLabel}>Waarom deze actie</span>
        {reason}
      </div>
      <span className={styles.illu}>Illustratief · score live gesimuleerd</span>
    </>
  );
}

/* ── Detail panels ───────────────────────────────────────────────────────── */
function Panel({
  children,
  onClose,
  accent,
}: {
  children: React.ReactNode;
  onClose: () => void;
  accent?: React.CSSProperties;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);
  return (
    <>
      <div className={styles.panelScrim} onClick={onClose} />
      <aside className={styles.panel} role="dialog" aria-modal="true" style={accent}>
        <button className={styles.panelClose} onClick={onClose} aria-label="Sluiten">
          <Icon name="close" />
        </button>
        {children}
      </aside>
    </>
  );
}

function SourcePanel({
  src,
  onClose,
  onPlay,
}: {
  src: CaptureSource;
  onClose: () => void;
  onPlay: (id: string) => void;
}) {
  return (
    <Panel onClose={onClose}>
      <div className={styles.panelHead}>
        <span className={styles.panelIconWrap}>
          <Icon name={src.icon} />
        </span>
        <span className={styles.panelKicker}>Capture · touchpoint</span>
        <h2 className={styles.panelTitle}>{src.label}</h2>
      </div>
      <div className={styles.panelBody}>
        <p className={styles.panelText}>{src.blurb}</p>
        <div>
          <div className={styles.panelSectionLabel}>Wat dit touchpoint vastlegt</div>
          {src.captures.map((c) => (
            <div key={c} className={styles.fieldRow}>
              <span className="pip" style={{ background: "var(--bm-in)" }} />
              {c}
            </div>
          ))}
        </div>
        {src.scenarioId && (
          <button
            className={`${styles.ctrlBtn} ${styles.ctrlPrimary}`}
            style={{ width: "100%", height: 44, gap: 8, fontWeight: 700 }}
            onClick={() => onPlay(src.scenarioId!)}
          >
            <Icon name="play" /> Speel dit scenario af
          </button>
        )}
      </div>
    </Panel>
  );
}

function ActionPanel({ action, onClose }: { action: PlatformAction; onClose: () => void }) {
  return (
    <Panel onClose={onClose} accent={toneVars(action.tone, "panel")}>
      <div className={styles.panelHead}>
        <span className={styles.panelIconWrap}>
          <Icon name={action.icon} />
        </span>
        <span className={styles.panelKicker}>Activate · actie</span>
        <h2 className={styles.panelTitle}>{action.label}</h2>
      </div>
      <div className={styles.panelBody}>
        <p className={styles.panelText}>{action.blurb}</p>
        <div>
          <div className={styles.panelSectionLabel}>Triggervoorwaarde</div>
          <div className={styles.fieldRow}>
            <span className="pip" style={{ background: "var(--panel-accent, var(--bm-in))" }} />
            {action.condition}
          </div>
        </div>
        <div>
          <div className={styles.panelSectionLabel}>Doelgroep</div>
          <div className={styles.fieldRow}>
            <span className="pip" style={{ background: "var(--panel-accent, var(--bm-in))" }} />
            {action.audience}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ScorePanel({
  which,
  result,
  started,
  onClose,
}: {
  which: "propensity" | "churn";
  result: ReturnType<typeof scoreWith>;
  started: boolean;
  onClose: () => void;
}) {
  const color = which === "propensity" ? "var(--bm-in)" : "var(--bm-win)";
  const title = which === "propensity" ? "Propensity-score" : "Churn-risico";
  const intro =
    which === "propensity"
      ? "De kans dat deze klant nu openstaat voor een aanbod — gewogen over onderstaande factoren."
      : "De kans dat deze klant op het punt staat te vertrekken — gewogen over onderstaande factoren.";
  return (
    <Panel onClose={onClose} accent={{ ["--score-color" as string]: color } as React.CSSProperties}>
      <div className={styles.panelHead}>
        <span className={styles.panelIconWrap} style={{ background: "var(--bm-surface-2)", color }}>
          <Icon name={which === "propensity" ? "sparkles" : "shield"} />
        </span>
        <span className={styles.panelKicker}>Platform · voorspelling</span>
        <h2 className={styles.panelTitle}>
          {title} · {started ? result.score : "–"}
        </h2>
      </div>
      <div className={styles.panelBody}>
        <p className={styles.panelText}>{intro}</p>
        <div>
          <div className={styles.panelSectionLabel}>Factoropbouw {!started && "(neutrale basis)"}</div>
          {result.rows.map((r) => (
            <div key={r.id} className={styles.factorRow}>
              <div className={styles.factorTop}>
                <span className={styles.factorName}>
                  {r.label} {!r.known && <span className="unknown">· nog onbekend</span>}
                </span>
                <span className={styles.factorMeta}>
                  <span>weging {Math.round(r.weight * 100)}%</span>
                  <span style={{ fontWeight: 800, color: r.known ? color : "var(--bm-text-faint)" }}>
                    {r.invert ? 100 - r.raw : r.raw}
                  </span>
                </span>
              </div>
              <div className={styles.factorBar} style={{ ["--score-color" as string]: color } as React.CSSProperties}>
                <div className={styles.factorFill} style={{ width: `${r.invert ? 100 - r.raw : r.raw}%`, opacity: r.known ? 1 : 0.4 }} />
              </div>
            </div>
          ))}
        </div>
        <span className={styles.illu}>Illustratief — getallen gesimuleerd, logica inspecteerbaar</span>
      </div>
    </Panel>
  );
}
