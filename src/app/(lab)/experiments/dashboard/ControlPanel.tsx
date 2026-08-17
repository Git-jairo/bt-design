"use client";

/**
 * DASHBOARD — prototype control panel.
 *
 * Drives every switchable dimension of the dashboard from one dock so the
 * design can be walked through in review or a Maze test without rebuilding:
 * card variant, which products the customer holds, how many mobile contracts
 * are on the account, and whether the Qarry and Bespaarmelder bands show.
 *
 * Deliberately styled as tooling, not as Mijn Omgeving.
 */

import Link from "next/link";
import styles from "./dashboard.module.css";
import {
  MAX_MOBILE_CONTRACTS,
  PRODUCTS,
  PRODUCT_ORDER,
  type ProductId,
  type Variant,
} from "./data";

export interface DashboardConfig {
  variant: Variant;
  products: Record<ProductId, boolean>;
  mobileContracts: number;
  showQarry: boolean;
  showBespaarmelder: boolean;
}

export const DEFAULT_CONFIG: DashboardConfig = {
  variant: "a",
  products: { energie: true, internet: true, mobiel: true },
  mobileContracts: 1,
  showQarry: true,
  showBespaarmelder: false,
};

function Switch({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={styles.switchRow}
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span>{label}</span>
      <span className={styles.switch} aria-hidden />
    </button>
  );
}

export function ControlPanel({
  config,
  onChange,
  open,
  onToggleOpen,
}: {
  config: DashboardConfig;
  onChange: (next: DashboardConfig) => void;
  open: boolean;
  onToggleOpen: () => void;
}) {
  const set = <K extends keyof DashboardConfig>(
    key: K,
    value: DashboardConfig[K],
  ) => onChange({ ...config, [key]: value });

  const setProduct = (id: ProductId, value: boolean) =>
    onChange({ ...config, products: { ...config.products, [id]: value } });

  const contracts = config.mobileContracts;

  return (
    <aside className={styles.panel}>
      <button
        type="button"
        className={styles.panelHeader}
        aria-expanded={open}
        onClick={onToggleOpen}
      >
        <span className={styles.panelTitle}>Control panel</span>
        <span className={styles.panelCaret}>{open ? "▾" : "▴"}</span>
      </button>

      {open && (
        <div className={styles.panelBody}>
          <div className={styles.panelGroup}>
            <span className={styles.panelLabel}>Variant</span>
            <div className={styles.segmented}>
              {(["a", "b"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={styles.segment}
                  aria-pressed={config.variant === v}
                  onClick={() => set("variant", v)}
                >
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.panelGroup}>
            <span className={styles.panelLabel}>Klant heeft</span>
            {PRODUCT_ORDER.map((id) => (
              <Switch
                key={id}
                label={PRODUCTS[id].nav}
                checked={config.products[id]}
                onChange={(next) => setProduct(id, next)}
              />
            ))}
          </div>

          <div className={styles.panelGroup}>
            <span className={styles.panelLabel}>Mobiele contracten</span>
            <div className={styles.stepper}>
              <span style={{ fontSize: 13 }}>
                {config.products.mobiel ? "Aantal" : "Mobiel uit"}
              </span>
              <div className={styles.stepperButtons}>
                <button
                  type="button"
                  className={styles.stepperButton}
                  aria-label="Eén contract minder"
                  disabled={!config.products.mobiel || contracts <= 1}
                  onClick={() => set("mobileContracts", contracts - 1)}
                >
                  −
                </button>
                <span className={styles.stepperValue}>
                  {config.products.mobiel ? contracts : 0}
                </span>
                <button
                  type="button"
                  className={styles.stepperButton}
                  aria-label="Eén contract meer"
                  disabled={
                    !config.products.mobiel || contracts >= MAX_MOBILE_CONTRACTS
                  }
                  onClick={() => set("mobileContracts", contracts + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className={styles.panelGroup}>
            <span className={styles.panelLabel}>Secties</span>
            <Switch
              label="Qarry-sectie"
              checked={config.showQarry}
              onChange={(next) => set("showQarry", next)}
            />
            <Switch
              label="Bespaarmelder"
              checked={config.showBespaarmelder}
              onChange={(next) => set("showBespaarmelder", next)}
            />
            <span className={styles.panelNote}>
              Bespaarmelder heeft nog geen Figma-ontwerp — opgebouwd uit
              bestaande tokens.
            </span>
          </div>

          <Link className={styles.panelBack} href="/experiments">
            ← Terug naar The Lab
          </Link>
        </div>
      )}
    </aside>
  );
}
