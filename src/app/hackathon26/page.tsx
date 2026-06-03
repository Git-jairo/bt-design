"use client";

import { useState } from "react";

const LOGO_SVG = `<svg width="69" height="48" viewBox="0 0 92 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M89.332 39.309H2.668C1.1945 39.309 0 40.5012 0 41.9719V61.3372C0 62.8078 1.1945 64 2.668 64H89.332C90.8055 64 92 62.8078 92 61.3372V41.9719C92 40.5012 90.8055 39.309 89.332 39.309Z" fill="black"/><path d="M1.9504 11.9552L44.3624 0.220373C45.4296 -0.0734577 46.5612 -0.0734577 47.6376 0.220373L90.0496 11.9828C91.1996 12.3042 92 13.3509 92 14.5446V33.2121C92 34.6812 90.804 35.8749 89.332 35.8749L2.668 35.8473C1.196 35.8473 0 34.6628 0 33.1937V14.5263C0 13.3326 0.8004 12.2766 1.9504 11.9644V11.9552Z" fill="black"/><path d="M18.8968 58.6651V47.3251H14.7108V44.6531H26.542V47.3251H22.3376V58.6651H18.8968Z" fill="white"/><path d="M40.7836 44.6531V58.6651H37.3428V52.7242H32.1724V58.6651H28.7316V44.6531H32.1724V50.1532H37.3428V44.6531H40.7836Z" fill="white"/><path d="M49.772 58.9498C48.8336 58.9498 47.9872 58.8121 47.2236 58.5366C46.4692 58.2611 45.8252 57.8663 45.2916 57.3429C44.758 56.8195 44.3624 56.1951 44.0864 55.4605C43.8104 54.726 43.6724 53.8904 43.6724 52.9722V44.6623H47.1132V53.0732C47.1132 54.1016 47.3524 54.8912 47.8308 55.4422C48.3092 55.9931 48.944 56.2686 49.7536 56.2686C50.5632 56.2686 51.244 55.9931 51.7224 55.433C52.2008 54.8729 52.4492 54.0924 52.4492 53.0732V44.6623H55.89V52.9722C55.89 54.2026 55.6416 55.2677 55.1448 56.1584C54.648 57.0491 53.9488 57.7377 53.0472 58.2244C52.1456 58.711 51.0508 58.959 49.7812 58.959H49.772V58.9498Z" fill="white"/><path d="M58.7696 58.6651V44.6531H62.2104V58.6651H58.7696Z" fill="white"/><path d="M76.0012 53.0273C75.7712 52.5865 75.4676 52.21 75.0996 51.907C74.7224 51.5948 74.2992 51.3286 73.83 51.099C73.3608 50.8694 72.8824 50.6766 72.3856 50.5022C71.8888 50.3277 71.4104 50.1808 70.9412 50.043C70.472 49.9053 70.0488 49.7584 69.6624 49.6023C69.276 49.4462 68.9816 49.2626 68.7608 49.0422C68.54 48.8218 68.4296 48.5647 68.4296 48.2709C68.4296 47.977 68.5032 47.8026 68.6412 47.6189C68.7792 47.4353 68.9908 47.2976 69.2668 47.1966C69.5428 47.0956 69.8832 47.0496 70.2788 47.0496C70.6744 47.0496 71.2448 47.1415 71.5944 47.3251C71.9532 47.5088 72.2292 47.7659 72.4408 48.1056C72.588 48.3535 72.6708 48.629 72.6984 48.9412L76.1024 48.4912C76.0196 47.7842 75.7804 47.1506 75.3848 46.5905C74.8972 45.8927 74.2164 45.3509 73.3424 44.9653C72.4684 44.5796 71.4564 44.3868 70.3064 44.3868C69.1564 44.3868 68.7516 44.4786 68.0984 44.6806C67.4452 44.8735 66.8932 45.1581 66.4424 45.5346C65.9824 45.911 65.6328 46.3518 65.3844 46.866C65.136 47.3802 65.0164 47.9495 65.0164 48.5831C65.0164 49.2166 65.1268 49.7308 65.3384 50.1808C65.55 50.6307 65.8536 51.0072 66.24 51.3286C66.6264 51.6407 67.0588 51.907 67.5188 52.1366C67.9788 52.357 68.4664 52.5498 68.9632 52.7059C69.4692 52.8712 69.9476 53.0181 70.426 53.1558C70.8952 53.2935 71.3184 53.4405 71.6956 53.5874C72.0728 53.7343 72.3672 53.9179 72.588 54.1291C72.8088 54.3403 72.9192 54.5974 72.9192 54.8912C72.9192 55.1851 72.8364 55.3963 72.6616 55.6166C72.4868 55.8278 72.2384 56.0023 71.9164 56.1217C71.5944 56.241 71.1896 56.3053 70.7112 56.3053C70.2328 56.3053 69.5888 56.1859 69.1472 55.9564C68.7056 55.7268 68.3744 55.3963 68.1444 54.9739C67.9604 54.6525 67.85 54.2852 67.7948 53.872L64.5472 54.4505C64.63 54.9923 64.7772 55.4973 65.0072 55.9656C65.3108 56.5991 65.7248 57.1317 66.2676 57.5816C66.8012 58.0316 67.4544 58.3713 68.2088 58.6192C68.9632 58.8671 69.8096 58.9773 70.7388 58.9773C71.668 58.9773 72.8272 58.8029 73.6736 58.4539C74.52 58.105 75.1824 57.6092 75.6516 56.9664C76.1208 56.3237 76.3692 55.5524 76.3692 54.6525C76.3692 53.7527 76.2588 53.4864 76.0288 53.0456L76.0012 53.0273Z" fill="white"/></svg>`;

type Segment = "Premium" | "Zakelijk" | "Standaard" | "Nieuw" | "Risico op churn";

interface Caller {
  id: string;
  name: string;
  phone: string;
  segment: Segment;
  customerValueScore: number;
  waitSeconds: number;
  reason: string;
  contract: string;
  products: string[];
  lastContact: string;
  openIssues: number;
}

const INITIAL_CALLERS: Caller[] = [
  {
    id: "1",
    name: "Anna de Vries",
    phone: "+31610000001",
    segment: "Premium",
    customerValueScore: 95,
    waitSeconds: 43,
    reason: "Vraag over factuur",
    contract: "Energie + Internet",
    products: ["Stroom", "Gas", "Glasvezel 500"],
    lastContact: "12 mei 2026",
    openIssues: 0,
  },
  {
    id: "2",
    name: "Emma Visser",
    phone: "+31610000005",
    segment: "Risico op churn",
    customerValueScore: 70,
    waitSeconds: 112,
    reason: "Contract opzeggen",
    contract: "Energie",
    products: ["Stroom", "Gas"],
    lastContact: "2 apr 2026",
    openIssues: 1,
  },
  {
    id: "3",
    name: "Bram Jansen",
    phone: "+31610000002",
    segment: "Zakelijk",
    customerValueScore: 80,
    waitSeconds: 28,
    reason: "Storing internet",
    contract: "Zakelijk Totaal",
    products: ["Glasvezel 1000", "Stroom zakelijk"],
    lastContact: "28 mei 2026",
    openIssues: 2,
  },
  {
    id: "4",
    name: "Carla Smit",
    phone: "+31610000003",
    segment: "Standaard",
    customerValueScore: 45,
    waitSeconds: 67,
    reason: "Verhuizing doorgeven",
    contract: "Energie",
    products: ["Stroom"],
    lastContact: "7 mrt 2026",
    openIssues: 0,
  },
  {
    id: "5",
    name: "Daan Bakker",
    phone: "+31610000004",
    segment: "Nieuw",
    customerValueScore: 25,
    waitSeconds: 189,
    reason: "Welkomstpakket",
    contract: "Internet",
    products: ["Glasvezel 250"],
    lastContact: "Eerste contact",
    openIssues: 0,
  },
];

const SEGMENT_COLORS: Record<Segment, { bg: string; text: string; dot: string }> = {
  Premium:           { bg: "#e0f5f0", text: "#004f3a", dot: "#029b77" },
  Zakelijk:          { bg: "#e6f8ff", text: "#003a66", dot: "#0098d9" },
  Standaard:         { bg: "#efefef", text: "#242424", dot: "#6c6c6c" },
  Nieuw:             { bg: "#e6fff2", text: "#00522c", dot: "#00d780" },
  "Risico op churn": { bg: "#ffe9e9", text: "#7a1c15", dot: "#f04444" },
};

function scoreColor(score: number): string {
  if (score >= 80) return "#029b77";
  if (score >= 60) return "#0098d9";
  if (score >= 40) return "#ff6c43";
  return "#9f9f9f";
}

function fmtWait(s: number): string {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function calcPriority(c: Caller): number {
  const waitBonus = Math.min(30, Math.floor(c.waitSeconds / 30) * 3);
  const churnBonus = c.segment === "Risico op churn" ? 15 : 0;
  return Math.min(100, c.customerValueScore + waitBonus + churnBonus);
}

export default function Hackathon26() {
  const [callers] = useState<Caller[]>(INITIAL_CALLERS);
  const [selected, setSelected] = useState<Caller>(INITIAL_CALLERS[0]);

  const sorted = [...callers].sort((a, b) => calcPriority(b) - calcPriority(a));
  const sc = SEGMENT_COLORS[selected.segment];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fafafa; font-family: 'Inter', sans-serif; }
        .topbar {
          background: #000;
          padding: 0 32px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .live-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #00d780;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .live-label { color: #00d780; font-size: 12px; font-weight: 500; letter-spacing: 0.05em; }
        .agent-chip {
          background: #242424;
          color: #c7c7c7;
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 8px;
        }
        .layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          height: calc(100vh - 56px);
        }
        .queue-panel {
          background: #fff;
          border-right: 1px solid #efefef;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .queue-header {
          padding: 20px 24px 12px;
          border-bottom: 1px solid #efefef;
        }
        .queue-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #6c6c6c;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .queue-count {
          font-size: 22px;
          font-weight: 600;
          color: #000;
        }
        .queue-count span {
          font-size: 13px;
          font-weight: 400;
          color: #9f9f9f;
          margin-left: 6px;
        }
        .queue-list {
          flex: 1;
          overflow-y: auto;
        }
        .queue-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 24px;
          cursor: pointer;
          border-bottom: 1px solid #fafafa;
          transition: background 0.15s;
        }
        .queue-item:hover { background: #fafafa; }
        .queue-item.active { background: #e0f5f0; border-left: 3px solid #029b77; }
        .order-num {
          font-size: 11px;
          font-weight: 600;
          color: #9f9f9f;
          min-width: 16px;
          text-align: right;
        }
        .score-circle {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .caller-info { flex: 1; min-width: 0; }
        .caller-name {
          font-size: 14px;
          font-weight: 500;
          color: #242424;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .caller-meta {
          font-size: 12px;
          color: #6c6c6c;
          margin-top: 2px;
        }
        .caller-right { text-align: right; flex-shrink: 0; }
        .wait-time {
          font-size: 12px;
          color: #6c6c6c;
        }
        .wait-long { color: #d92d20; font-weight: 500; }
        .seg-dot {
          display: inline-block;
          width: 6px; height: 6px;
          border-radius: 50%;
          margin-right: 4px;
          vertical-align: middle;
        }
        .detail-panel {
          padding: 32px;
          overflow-y: auto;
          background: #fafafa;
        }
        .detail-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .detail-name {
          font-size: 24px;
          font-weight: 600;
          color: #000;
          margin-bottom: 6px;
        }
        .seg-badge {
          display: inline-flex;
          align-items: center;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 8px;
          margin-right: 8px;
        }
        .prio-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 8px;
          background: #000;
          color: #00d780;
        }
        .action-btn {
          background: #00d780;
          color: #000;
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: background 0.15s;
        }
        .action-btn:hover { background: #03ba70; }
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(60,60,60,0.08);
        }
        .card-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.07em;
          color: #9f9f9f;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .card-value {
          font-size: 20px;
          font-weight: 600;
          color: #000;
        }
        .card-sub {
          font-size: 13px;
          color: #6c6c6c;
          margin-top: 4px;
        }
        .products-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        .product-chip {
          background: #efefef;
          color: #242424;
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 8px;
        }
        .score-bar-wrap {
          margin-top: 8px;
          height: 6px;
          background: #efefef;
          border-radius: 3px;
          overflow: hidden;
        }
        .score-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s;
        }
        .issue-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #242424;
          padding: 8px 0;
          border-bottom: 1px solid #efefef;
        }
        .issue-row:last-child { border-bottom: none; }
        .issue-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #ff6c43;
          flex-shrink: 0;
        }
        .divider {
          height: 1px;
          background: #efefef;
          margin: 20px 0;
        }
        .reason-tag {
          display: inline-block;
          background: #fff;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          font-size: 13px;
          color: #242424;
          padding: 6px 12px;
          margin-top: 8px;
        }
      `}</style>

      <div className="topbar">
        <div dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <div className="topbar-right">
          <div className="live-dot" />
          <span className="live-label">LIVE</span>
          <span className="agent-chip">Agent dashboard — Hackathon 2026</span>
        </div>
      </div>

      <div className="layout">
        {/* LEFT: wachtrij */}
        <div className="queue-panel">
          <div className="queue-header">
            <div className="queue-title">Wachtrij</div>
            <div className="queue-count">
              {sorted.length} bellers
              <span>gesorteerd op prioriteit</span>
            </div>
          </div>
          <div className="queue-list">
            {sorted.map((caller, i) => {
              const prio = calcPriority(caller);
              const color = scoreColor(caller.customerValueScore);
              const sc2 = SEGMENT_COLORS[caller.segment];
              const isActive = caller.id === selected.id;
              return (
                <div
                  key={caller.id}
                  className={`queue-item${isActive ? " active" : ""}`}
                  onClick={() => setSelected(caller)}
                >
                  <span className="order-num">{i + 1}</span>
                  <div
                    className="score-circle"
                    style={{ borderColor: color, color }}
                  >
                    {caller.customerValueScore}
                  </div>
                  <div className="caller-info">
                    <div className="caller-name">{caller.name}</div>
                    <div className="caller-meta">
                      <span
                        className="seg-dot"
                        style={{ background: sc2.dot }}
                      />
                      {caller.segment} · {caller.phone}
                    </div>
                  </div>
                  <div className="caller-right">
                    <div
                      className={`wait-time${caller.waitSeconds > 120 ? " wait-long" : ""}`}
                    >
                      {fmtWait(caller.waitSeconds)}
                    </div>
                    <div style={{ fontSize: 11, color: "#9f9f9f", marginTop: 2 }}>
                      prio {prio}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: klantdetail */}
        <div className="detail-panel">
          <div className="detail-header">
            <div>
              <div className="detail-name">{selected.name}</div>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                <span
                  className="seg-badge"
                  style={{ background: sc.bg, color: sc.text }}
                >
                  <span
                    className="seg-dot"
                    style={{ background: sc.dot }}
                  />
                  {selected.segment}
                </span>
                <span className="prio-badge">
                  Prioriteit {calcPriority(selected)}
                </span>
              </div>
            </div>
            <button className="action-btn">Accepteer gesprek</button>
          </div>

          <div className="cards-grid">
            <div className="card">
              <div className="card-label">Klantwaarde</div>
              <div className="card-value" style={{ color: scoreColor(selected.customerValueScore) }}>
                {selected.customerValueScore} / 100
              </div>
              <div className="score-bar-wrap">
                <div
                  className="score-bar"
                  style={{
                    width: `${selected.customerValueScore}%`,
                    background: scoreColor(selected.customerValueScore),
                  }}
                />
              </div>
            </div>

            <div className="card">
              <div className="card-label">Wachttijd</div>
              <div
                className="card-value"
                style={{ color: selected.waitSeconds > 120 ? "#d92d20" : "#000" }}
              >
                {fmtWait(selected.waitSeconds)}
              </div>
              <div className="card-sub">In de wacht</div>
            </div>

            <div className="card">
              <div className="card-label">Contract</div>
              <div className="card-value" style={{ fontSize: 16 }}>{selected.contract}</div>
              <div className="products-list">
                {selected.products.map((p) => (
                  <span key={p} className="product-chip">{p}</span>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-label">Laatste contact</div>
              <div className="card-value" style={{ fontSize: 16 }}>{selected.lastContact}</div>
              <div className="card-sub">
                {selected.openIssues > 0
                  ? `${selected.openIssues} open melding${selected.openIssues > 1 ? "en" : ""}`
                  : "Geen open meldingen"}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-label">Reden van bellen</div>
            <span className="reason-tag">{selected.reason}</span>
          </div>

          {selected.openIssues > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-label">Open meldingen</div>
              {Array.from({ length: selected.openIssues }).map((_, i) => (
                <div key={i} className="issue-row">
                  <div className="issue-dot" />
                  <span>
                    {i === 0 ? "Storing internet gemeld op 28 mei" : "Factuurvraag nog niet afgehandeld"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <div className="card-label">Aanbevolen aanpak</div>
            <div className="divider" style={{ margin: "12px 0" }} />
            {selected.segment === "Risico op churn" && (
              <div style={{ fontSize: 13, color: "#242424", lineHeight: 1.6 }}>
                <strong>Retentiescript actief.</strong> Deze klant overweegt op te zeggen. Bied bij
                passende gelegenheid een retentiekorting aan. Escaleer niet zonder akkoord leidinggevende.
              </div>
            )}
            {selected.segment === "Premium" && (
              <div style={{ fontSize: 13, color: "#242424", lineHeight: 1.6 }}>
                Premiumklant met hoge waarde. Direct en persoonlijk behandelen.
                Geen wachtrij-scripts, direct doorpakken.
              </div>
            )}
            {selected.segment === "Zakelijk" && (
              <div style={{ fontSize: 13, color: "#242424", lineHeight: 1.6 }}>
                Zakelijke klant. Verwijs bij technische storingen direct naar de zakelijke
                supportlijn of maak een callback-afspraak.
              </div>
            )}
            {(selected.segment === "Standaard" || selected.segment === "Nieuw") && (
              <div style={{ fontSize: 13, color: "#242424", lineHeight: 1.6 }}>
                Standaardafhandeling. Volg het reguliere gesprekscript.
                Bij upgrade-kans: wijs op het Premium-pakket.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}