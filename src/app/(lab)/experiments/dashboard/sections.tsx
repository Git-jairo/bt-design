"use client";

/**
 * DASHBOARD — the Mijn Omgeving sections, implemented from Figma
 * (file naXcHHy9RgZfgc1uGjnn0M):
 *
 *   node 11:4977  the full page — MyEnvTopNav, hero, Quary section, FooterNav
 *   node 11:5346  hero cards, variant A (image + title + one button)
 *   node 4:2867   hero cards, variant B (active contract detail vs cross-sell)
 *
 * The Bespaarmelder band has no Figma source yet — see `Bespaarmelder` below.
 *
 * Icons and photos are the exact Figma exports under
 * public/experiments/dashboard/. Plain <img> is used throughout (as in the
 * other lab experiments) because the geometry is pinned per asset.
 */

import { useState } from "react";
import styles from "./dashboard.module.css";
import {
  BESPAARMELDER,
  CONTRACT_END,
  CUSTOMER_NAME,
  FOOTER_COLUMNS,
  GLYPHS,
  ICONS,
  MAX_MOBILE_CONTRACTS,
  PRODUCTS,
  PRODUCT_ORDER,
  QARRY,
  REMINDER_LINK,
  combikorting,
  euro,
  huisvoordeel,
  type Glyph,
  type MobileContract,
  type ProductId,
} from "./data";

/**
 * Renders an exported icon at its designed geometry: the container keeps the
 * Figma box size, the artwork keeps its own width/height inside it, and any
 * layer transform (flip, rotation) is reapplied here.
 */
function Icon({ glyph, className }: { glyph: Glyph; className?: string }) {
  const transform = [
    glyph.rotate ? `rotate(${glyph.rotate}deg)` : "",
    glyph.flipY ? "scaleY(-1)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={`${styles.icon}${className ? ` ${className}` : ""}`}
      style={{ width: glyph.box, height: glyph.box }}
    >
      <img
        src={glyph.src}
        alt=""
        width={glyph.w}
        height={glyph.h}
        style={{
          width: glyph.w,
          height: glyph.h,
          transform: transform || undefined,
        }}
      />
    </span>
  );
}

/* ═══ Top nav ═══════════════════════════════════════════════════════════ */

export function TopNav() {
  return (
    <header className={styles.topnav}>
      <div className={`${styles.wrapper} ${styles.topnavInner}`}>
        <div className={styles.logo}>
          <img src={ICONS.logo} alt="Budget Thuis" width={92} height={64} />
        </div>

        <nav className={styles.menuItems}>
          {PRODUCT_ORDER.map((id) => (
            <button key={id} type="button" className={styles.menuItem}>
              <Icon glyph={PRODUCTS[id].iconNav} />
              <span>{PRODUCTS[id].nav}</span>
            </button>
          ))}
        </nav>

        <button type="button" className={styles.profile}>
          <span>{CUSTOMER_NAME}</span>
          <Icon glyph={GLYPHS.profile} />
        </button>
      </div>
    </header>
  );
}

/* ═══ Buttons ═══════════════════════════════════════════════════════════ */

function Button({
  icon,
  label,
  sublabel,
  tone = "primary",
}: {
  icon: Glyph;
  label: string;
  /** Second, smaller line — variant A's cross-sell CTA (Figma 17:5966). */
  sublabel?: string;
  tone?: "primary" | "cta";
}) {
  return (
    <button type="button" className={styles.btn} data-tone={tone}>
      <span className={styles.btnLeading}>
        <Icon glyph={icon} />
        <span className={styles.btnLabels}>
          <span className={styles.btnLabel}>{label}</span>
          {sublabel && <span className={styles.btnSublabel}>{sublabel}</span>}
        </span>
      </span>
      <Icon
        glyph={tone === "cta" ? GLYPHS.chevronRightDark : GLYPHS.chevronRight}
      />
    </button>
  );
}

/** The checkmark USP list shared by both cross-sell variants. */
function UspList({ usps }: { usps: string[] }) {
  return (
    <ul className={styles.indicatorList}>
      {usps.map((usp) => (
        <li key={usp} className={styles.indicator}>
          <Icon glyph={GLYPHS.indicatorCheck} />
          <span>{usp}</span>
        </li>
      ))}
    </ul>
  );
}

/* ═══ Hero ══════════════════════════════════════════════════════════════ */

export interface HeroProps {
  variant: "a" | "b";
  owned: ProductId[];
  mobileContracts: MobileContract[];
}

export function Hero({ variant, owned, mobileContracts }: HeroProps) {
  return (
    <section className={styles.hero}>
      <div className={`${styles.wrapper} ${styles.heroInner}`} data-variant={variant}>
        <h1 className={styles.heroTitle}>
          <span>Het huismerk voor</span>
          <span>Energie, Internet &amp; Mobiel</span>
        </h1>

        <div className={styles.cardsRow} data-variant={variant}>
          {PRODUCT_ORDER.map((id, i) =>
            variant === "a" ? (
              <CardA
                key={id}
                id={id}
                column={i + 1}
                owned={owned.includes(id)}
              />
            ) : (
              <CardB
                key={id}
                id={id}
                owned={owned.includes(id)}
                allOwned={owned}
                mobileContracts={mobileContracts}
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Variant A — Figma 17:6040 (active) and 17:5954 (cross-sell).
 *
 * Active: photo, title, one primary button.
 * Cross-sell: same photo in full colour, a checkmark USP list, a two-line
 * green CTA, and a reminder link sitting outside the card.
 */
function CardA({
  id,
  column,
  owned,
}: {
  id: ProductId;
  /** 1-based grid column — a cross-sell column places two items itself. */
  column: number;
  owned: boolean;
}) {
  const product = PRODUCTS[id];

  const photo = (
    <div className={styles.photo}>
      <img src={product.photo} alt="" />
      <div className={styles.photoOverlay}>
        <div className={styles.photoGradient} />
        <div className={styles.photoTextBg}>
          <h2 className={styles.photoTitleA}>{product.titleA}</h2>
        </div>
      </div>
    </div>
  );

  if (owned) {
    return (
      <article className={styles.card} style={{ gridColumn: column }}>
        {photo}
        <div className={styles.cardBottomA}>
          {/* One button per card, even with several mobile numbers — the
              multi-subscription treatment is still to be designed. */}
          <Button icon={product.iconLight} label={product.cta} />
        </div>
      </article>
    );
  }

  return (
    <div className={styles.cardAOffer}>
      <article className={styles.card} style={{ gridColumn: column }}>
        {photo}
        <div className={styles.cardBottomA}>
          <UspList usps={product.offer.usps} />
          <Button
            icon={product.iconDark}
            label={product.offer.ctaTitle}
            sublabel={product.offer.ctaSub}
            tone="cta"
          />
        </div>
      </article>

      <a
        className={styles.reminderLink}
        style={{ gridColumn: column }}
        href={REMINDER_LINK.href}
        target="_blank"
        rel="noreferrer"
      >
        {REMINDER_LINK.label}
      </a>
    </div>
  );
}

/** Variant B — active card with contract detail, or a cross-sell offer. */
function CardB({
  id,
  owned,
  allOwned,
  mobileContracts,
}: {
  id: ProductId;
  owned: boolean;
  allOwned: ProductId[];
  mobileContracts: MobileContract[];
}) {
  const product = PRODUCTS[id];

  const photo = (
    <div className={styles.photo} data-muted={!owned}>
      <img src={product.photo} alt="" />
      <div className={styles.photoOverlay}>
        <div className={styles.photoGradient} />
        <div className={styles.photoTextBg}>
          <div className={styles.photoHeaderB}>
            <div className={styles.photoIconTitle}>
              <Icon glyph={product.iconLight} />
              <h2 className={styles.photoTitleB}>{product.titleB}</h2>
            </div>
            <span
              className={styles.chip}
              data-tone={owned ? "default" : "promotion"}
            >
              {owned ? "Actief" : product.offer.badge}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <article className={styles.card}>
      <div className={styles.cardBodyB} data-state={owned ? "active" : "offer"}>

        {owned ? (
          <>
            {/* Grouped so the card body's space-between only pushes the
                button down, never the rows away from the photo. */}
            <div className={styles.cardTopB}>
              {photo}
              <ContractRows
                id={id}
                allOwned={allOwned}
                mobileContracts={mobileContracts}
              />
            </div>
            <Button icon={GLYPHS.home} label={product.cta} />
          </>
        ) : (
          <>
            {photo}
            <Offer id={id} />
          </>
        )}
      </div>
    </article>
  );
}

function ContractRows({
  id,
  allOwned,
  mobileContracts,
}: {
  id: ProductId;
  allOwned: ProductId[];
  mobileContracts: MobileContract[];
}) {
  const combi = combikorting(allOwned);

  // One row per mobile contract once there's more than one, each labelled with
  // its number; a single contract keeps the design's plain "Contract tot".
  const contractRows =
    id === "mobiel"
      ? mobileContracts.length > 1
        ? mobileContracts.map((c) => ({ label: c.phone, value: `tot ${c.endDate}` }))
        : [{ label: "Contract tot", value: mobileContracts[0]?.endDate ?? "—" }]
      : [{ label: "Contract tot", value: CONTRACT_END[id] }];

  return (
    <div className={styles.detailRows}>
      {contractRows.map((row, i) => (
        <div key={row.label}>
          {i > 0 && <div className={styles.divider} />}
          <div className={styles.detailRow}>
            <div>
              <span className={styles.detailLabel}>{row.label}</span>
              <span className={styles.detailValue}>{row.value}</span>
            </div>
          </div>
        </div>
      ))}

      <div className={styles.divider} />

      <div className={styles.detailRow}>
        <div>
          <span className={styles.detailLabel}>Combikorting</span>
          <span className={styles.detailValue}>{combi.amount}</span>
        </div>
        {combi.hint && <span className={styles.detailHint}>{combi.hint}</span>}
      </div>
    </div>
  );
}

function Offer({ id }: { id: ProductId }) {
  const product = PRODUCTS[id];
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Figma 17:5818: expanding "Meer info" grows this block — the USP list
          sits with the pricing box, not below the disclosure. */}
      <div className={styles.offer}>
        <p className={styles.offerIntro}>{product.offer.intro}</p>
        <div className={styles.pricingBox}>
          <p className={styles.pricingEyebrow}>Neem je dit er ook bij?</p>
          <p className={styles.pricingAmount}>{product.offer.perYear}</p>
          <p className={styles.pricingSub}>{product.offer.perMonth}</p>
        </div>
        {open && <UspList usps={product.offer.usps} />}
      </div>

      <div className={styles.cardActions}>
        <button
          type="button"
          className={styles.btnBorderless}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon glyph={open ? GLYPHS.chevronUp : GLYPHS.chevronDown} />
          <span>Meer info</span>
        </button>

        <Button
          icon={product.iconDark}
          label="Bekijk het aanbod"
          tone="cta"
        />
      </div>
    </>
  );
}

/* ═══ Bespaarmelder ═════════════════════════════════════════════════════ */

/**
 * NOTE: there is no Bespaarmelder frame in the Figma file yet, so this band is
 * assembled from the design's own primitives only — promotion chip, display
 * heading, card elevation, green CTA button. Replace it wholesale once the
 * real design lands.
 */
export function Bespaarmelder() {
  return (
    <section className={styles.bespaarmelder}>
      <div className={styles.wrapper}>
        <div className={styles.bespaarCard}>
          <div className={styles.bespaarBody}>
            <span className={styles.chip} data-tone="promotion">
              {BESPAARMELDER.badge}
            </span>
            <h2 className={styles.bespaarHeading}>{BESPAARMELDER.heading}</h2>
            <p className={styles.bespaarText}>{BESPAARMELDER.body}</p>
          </div>
          <div className={styles.bespaarAction}>
            <Button
              icon={PRODUCTS.energie.iconDark}
              label={BESPAARMELDER.cta}
              tone="cta"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══ Qarry — the Huisvoordeel cross-sell ══════════════════════════════ */

/**
 * Figma 4:1770 "Quary section" — the cross-sell step.
 *
 * Left: the Qarry bus is the shop the customer loads (not a winkelmand), and
 * it hangs 52px over a green card reading out the Huisvoordeel they'd reach.
 * Right: a white card with a CheckCard per service; Mobiel is paired with a
 * counter for the number of subscriptions.
 *
 * Services the customer already holds are ticked and locked — they're facts,
 * not choices — so the only things they can switch on are the actual
 * cross-sell.
 */
export function QarrySection({
  owned,
  mobileContracts,
  onMobileContractsChange,
}: {
  owned: ProductId[];
  mobileContracts: number;
  onMobileContractsChange: (next: number) => void;
}) {
  const [added, setAdded] = useState<ProductId[]>([]);

  const selected = PRODUCT_ORDER.filter(
    (id) => owned.includes(id) || added.includes(id),
  );
  const { amount, active, progress, hint } = huisvoordeel(selected);
  const mobielOn = selected.includes("mobiel");

  const toggle = (id: ProductId) =>
    setAdded((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  return (
    <section className={styles.qarry}>
      <div className={`${styles.wrapper} ${styles.qarryInner}`}>
        {/* The bus overlaps the card below it, so this column is its own
            stacking context (Figma `isolate`). */}
        <div className={styles.qarryShop}>
          <div className={styles.qarryImage} data-loaded={selected.length}>
            <span className={styles.qarryClip}>
              <img className={styles.qarryLayerBg} src={ICONS.qarryBg} alt="" />
              <img
                className={styles.qarryLayerFg}
                src={ICONS.qarryFg}
                alt="De Qarry-bus van Budget Thuis"
              />
            </span>
            <span className={styles.qarryShadow} aria-hidden>
              <img src={ICONS.qarryEllipse} alt="" width={218} height={124} />
            </span>
          </div>

          <div className={styles.voordeelCard}>
            <div className={styles.voordeelHead}>
              <p className={styles.voordeelEyebrow}>{QARRY.eyebrow}</p>
              <p className={styles.voordeelAmount}>
                {euro(amount)}
                <span className={styles.voordeelPer}>/jaar</span>
              </p>
            </div>

            <div className={styles.voordeelMeter}>
              <div
                className={styles.meter}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={PRODUCT_ORDER.length}
                aria-valuenow={selected.length}
                aria-label="Aantal gecombineerde diensten"
              >
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className={styles.voordeelHint}>
                {selected.length === 0 ? QARRY.emptyLabel : hint}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.qarryAdvies}>
          <div className={styles.qarryCard}>
            <div>
              <h2 className={styles.qarryHeading}>{QARRY.heading}</h2>
              <p className={styles.qarryIntro}>{QARRY.intro}</p>
            </div>

            {PRODUCT_ORDER.map((id) => {
              const card = (
                <ServiceCheckCard
                  id={id}
                  owned={owned.includes(id)}
                  checked={selected.includes(id)}
                  onToggle={() => toggle(id)}
                />
              );

              // Mobiel shares its row with the subscription counter.
              return id === "mobiel" ? (
                <div key={id} className={styles.qarryMobileRow}>
                  {card}
                  <Counter
                    value={mobileContracts}
                    disabled={!mobielOn}
                    onChange={onMobileContractsChange}
                  />
                </div>
              ) : (
                <div key={id}>{card}</div>
              );
            })}

            <Button icon={GLYPHS.plusCta} label={QARRY.cta} tone="cta" />
          </div>

          <p className={styles.qarryLegal}>{QARRY.legal}</p>
        </div>
      </div>
    </section>
  );
}

function ServiceCheckCard({
  id,
  owned,
  checked,
  onToggle,
}: {
  id: ProductId;
  owned: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  const product = PRODUCTS[id];

  return (
    <button
      type="button"
      className={styles.checkCard}
      data-checked={checked}
      aria-pressed={checked}
      // Already on the account — not something to switch off here.
      disabled={owned}
      onClick={onToggle}
    >
      <span className={styles.checkBox}>
        {checked && <Icon glyph={GLYPHS.check} />}
      </span>
      <span className={styles.checkBody}>
        <span className={styles.checkLabel}>{product.nav}</span>
        <span className={styles.checkMeta}>
          {owned
            ? QARRY.ownedLabel
            : `Voordeel ${euro(product.voordeelPerYear)} per jaar`}
        </span>
      </span>
    </button>
  );
}

/** Number of mobile subscriptions in the Qarry (Figma 21:6372). */
function Counter({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <div className={styles.counter} data-disabled={disabled}>
      <button
        type="button"
        className={styles.counterStep}
        aria-label="Eén abonnement minder"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Icon glyph={GLYPHS.minus} />
      </button>
      <span className={styles.counterValue}>{disabled ? 0 : value}</span>
      <button
        type="button"
        className={styles.counterStep}
        aria-label="Eén abonnement meer"
        disabled={disabled || value >= MAX_MOBILE_CONTRACTS}
        onClick={() => onChange(value + 1)}
      >
        <Icon glyph={GLYPHS.plus} />
      </button>
    </div>
  );
}

/* ═══ Footer ════════════════════════════════════════════════════════════ */

export function FooterNav() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerNav}>
        <div className={`${styles.wrapper} ${styles.footerColumns}`}>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className={styles.footerColumn}>
              <h2>{column.title}</h2>
              {column.links.map((link) => (
                <a key={link} href="#">
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footerApp}>
        <div className={`${styles.wrapper} ${styles.footerAppInner}`}>
          <span className={styles.footerAppTitle}>De Budget Thuis App</span>
          <div className={styles.storeStickers}>
            <a className={styles.storeSticker} href="#">
              <img
                className={styles.storeGlyph}
                src={ICONS.playstore}
                alt=""
                width={20}
                height={24}
              />
              <span className={styles.storeCopy}>
                <span className={styles.storeCopySmall}>Ontdek het op</span>
                <img
                  className={styles.storeWordmark}
                  src={ICONS.googlePlayWordmark}
                  alt="Google Play"
                  width={74}
                  height={15}
                />
              </span>
            </a>

            <a className={styles.storeSticker} href="#">
              <img
                className={styles.storeGlyph}
                src={ICONS.apple}
                alt=""
                width={20}
                height={24}
              />
              <span className={styles.storeCopy}>
                <span className={styles.storeCopySmall}>Download in de</span>
                <span className={styles.storeCopyLarge}>App Store</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
