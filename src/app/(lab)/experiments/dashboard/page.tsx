"use client";

/**
 * DASHBOARD — the Mijn Omgeving overview, as a configurable prototype.
 *
 * Implemented from Figma file naXcHHy9RgZfgc1uGjnn0M (node 11:4977 for the
 * page, 11:5346 / 4:2867 for the two card variants). The control panel picks
 * the customer's situation; the sections render it.
 *
 * Self-contained per the Lab convention: simulated data (./data.ts), Figma
 * asset exports under public/experiments/dashboard/, scoped CSS module.
 */

import { useMemo, useState } from "react";
import styles from "./dashboard.module.css";
import {
  ControlPanel,
  DEFAULT_CONFIG,
  type DashboardConfig,
} from "./ControlPanel";
import { Bespaarmelder, FooterNav, Hero, QarrySection, TopNav } from "./sections";
import { MOBILE_CONTRACTS, PRODUCT_ORDER, type ProductId } from "./data";

export default function DashboardPage() {
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG);
  const [panelOpen, setPanelOpen] = useState(true);

  const owned = useMemo<ProductId[]>(
    () => PRODUCT_ORDER.filter((id) => config.products[id]),
    [config.products],
  );

  const mobileContracts = useMemo(
    () =>
      config.products.mobiel
        ? MOBILE_CONTRACTS.slice(0, config.mobileContracts)
        : [],
    [config.products.mobiel, config.mobileContracts],
  );

  return (
    <div className={styles.root}>
      <TopNav />

      <Hero
        variant={config.variant}
        owned={owned}
        mobileContracts={mobileContracts}
      />

      {config.showBespaarmelder && <Bespaarmelder />}
      {config.showQarry && (
        <QarrySection
          owned={owned}
          mobileContracts={config.mobileContracts}
          onMobileContractsChange={(n) =>
            setConfig((c) => ({ ...c, mobileContracts: n }))
          }
        />
      )}

      <FooterNav />

      <ControlPanel
        config={config}
        onChange={setConfig}
        open={panelOpen}
        onToggleOpen={() => setPanelOpen((v) => !v)}
      />
    </div>
  );
}
