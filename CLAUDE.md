@AGENTS.md

# BudgetThuis.Design

The stable AI playground and design hub for the Budget Thuis Design & Product
team. A Next.js 16 + React 19 + Tailwind v4 site that showcases the Helix Design
System, hosts the public skills gallery, and contains a separate "Lab" of
self-contained experiments. **Not experimental itself** — keep `main` shippable.

## Stack

- **Next.js 16** (App Router, Turbopack). This is a newer Next than your training
  data — per `AGENTS.md`, read the relevant guide under `node_modules/next/dist/docs/`
  before writing routing/config/data-fetching code.
- **React 19**, **TypeScript**, **Tailwind v4**.
- Storybook for component development. Vitest for unit tests. Deployed on Vercel.

## Layout

```
src/
├── app/
│   ├── layout.tsx              Root: <html>/<body>, fonts, globals.css
│   ├── globals.css             Tailwind entry — imports all design-system tokens
│   ├── (site)/                 The main BudgetThuis.Design site (Nav + Footer)
│   │   ├── layout.tsx          Site chrome. Do NOT special-case experiments here.
│   │   ├── skills/             Public skills gallery (reads src/data/skills.ts)
│   │   └── …                   docs, case-studies, presentations, login, etc.
│   ├── (lab)/                  "The Lab" — experiments, separate route group
│   │   └── experiments/
│   │       ├── layout.tsx      Minimal chrome (no site Footer)
│   │       ├── page.tsx        Experiments index — list new experiments here
│   │       └── <slug>/         One self-contained experiment per folder
│   └── api/
│       ├── …                   Site/shared API routes
│       └── experiments/<slug>/ Experiment-scoped API routes
├── design-system/              SHARED + STABLE: the Helix Design System
│   ├── tokens/                 primitives.css, semantics.css, components.css
│   ├── components/ patterns/ sections/
│   ├── data/ lib/
└── data/                       Datasets (customers, etc.)
content/skills.registry.json    CMS: which skills are public + their metadata
scripts/                        Build/codegen + experiment-scoped subfolders
```

## Conventions

### Design tokens (Tailwind v4)
- Tokens are defined with `@theme` in `design-system/tokens/*.css` and imported
  through `app/globals.css` (the Tailwind entry). The site uses **helix-named**
  tokens — e.g. `bg-screen`, `font-helix-display`, `font-helix-body`.
- Don't hardcode hex/px values in components; use tokens. New shared tokens go in
  `design-system/tokens/`, never inside a route or experiment.

### Experiments ("The Lab")
- Experiments live in `app/(lab)/experiments/<slug>/` and are **not part of the
  main site**. They inherit no site chrome and render their own navigation.
- Keep each experiment **self-contained**: its page, components, CSS, and any API
  routes (`app/api/experiments/<slug>/`) and scripts (`scripts/experiments/<slug>/`)
  stay together. Experiment-only CSS must NOT go in `design-system/tokens/`.
  - `hackathon26` is the reference example. Its Tailwind `@theme` lives at
    `app/(lab)/experiments/hackathon26/hackathon26.css` and is imported via
    `globals.css` because `@theme` only compiles through the Tailwind entry; its
    M3-shaped tokens are namespaced apart from the site's helix tokens.
- To add an experiment: create the folder, build the page, add an entry to
  `app/(lab)/experiments/page.tsx`. Add a `/<slug>` → `/experiments/<slug>`
  redirect in `next.config.ts` only if you need a short public URL.

### Skills gallery
- The source of truth for skill **content** is the **bt-mainframe** repo
  (`../bt-mainframe/.claude/skills/`). This site publishes a curated subset.
- The **`public/skills/` folder is the published set**: each `<slug>.zip` is the
  downloadable artifact and each `<slug>.json` holds its website metadata
  (title, description, roles, expertise, optional featureGraphic). A skill that
  isn't zipped here stays private (Claude-only).
- Two scripts, run in order:
  - `npm run export-skills` — interactive packaging. Walks bt-mainframe and asks
    per skill whether to zip it into `public/skills/` (`y/N`, or `a` = all
    remaining). Already-exported skills prompt **Update?**; new ones get a
    metadata `.json` stub to flesh out. Re-zipping never overwrites an existing
    `.json`. Override the mainframe path with `BT_MAINFRAME_DIR`; `--list` prints
    status without prompting.
  - `npm run sync-skills` — rebuilds `src/data/skills.ts` from `public/skills/`.
    **Never edit skills.ts by hand.**
- Skills that don't live in bt-mainframe (e.g. `prompt-optimizer`) are just a
  hand-placed `zip` + `json` in `public/skills/`; `export-skills` leaves them
  alone and `sync-skills` picks them up like any other.

## Commands

```bash
npm run dev                 # http://localhost:3000
npm run build               # production build (run before pushing)
npm run lint
npm run sync-skills         # rebuild the skills gallery from the registry
npm run sync-skills:curate  # interactively add/remove public skills
npm run storybook
```

## Deploy

Push to `main`; Vercel deploys automatically. Secrets (Twilio, etc.) live in
`.env.local` locally and Vercel project env vars in production.


## BudgetThuis.AI -> POC

**CONTEXT:**
- Stack: React, next.js, Tailwind CSS v4 (@theme block mapping to CSS variables, no hardcoded hex in components). Matches the existing budgetthuis.design stack.
- Helix base tokens to extend: mint / teal / ink / screen palette; Greet Narrow headings; Inter body; flat fills; card-on-canvas. Brand anchor #EBF2E8 at gray-100; grayscale ramp 0=white to 1000=black.
- Helix AI = a sub-theme on top of Helix: animated gradients, dynamic type scale, elevated card-on-canvas. Same tokens, more energy.

**DATA MODEL (resolve the contradiction):**
- Two sample CSVs bundled in /public/data: skills.csv, cases.csv.
- One loader module exposing loadSkills() and loadCases(): fetch + parse CSV at runtime. Default source = local /data/*.csv, swappable to a remote endpoint via a single BASE_URL constant. This satisfies "runs immediately" and "real source later".
- Skills schema: id, title, description, category, claudeEnterpriseLink, feedbackUrl.
- Cases schema: id, title, author, date, introduction, problem, hypothesis, approach, conclusion, datasection, imageUrl, templateVariant.
- datasection = JSON string per cell, e.g. {"hoursSaved":120,"processesAutomated":4,"impact":"..."}. Parse safely. Hide the metric block if empty or invalid.
- imageUrl may be empty or dead: render a deterministic gradient placeholder keyed to the case id.

**FEATURES:**
- Skills Registry: card grid from skills.csv, hover states, feedback button (feedbackUrl), card links to claudeEnterpriseLink.
- Case Study Showcase: render each case through rotating visual templates (3 to 4 variants), identical narrative order (intro, problem, hypothesis, approach, conclusion, metrics). Use templateVariant when set, else assign by index modulo N. Conditionally hide any empty section (e.g. skip hypothesis if absent).
- Metric callouts: animated reveal of datasection values (hours saved, processes automated, impact), 3 to 4 callout template variants.
- News Hub: simple feed section for AI org updates (sample data inline).
- Governance page, guidelines, usage crits and things. Official docs, how to use, shortcut to training etc.
- Dark mode: light/dark toggle, persist in localStorage, respect prefers-color-scheme on first load, switch a data-theme attribute that flips CSS variables.
- Analytics: read VITE_GA_ID from env; if unset, all tracking noops (no console errors). Track page_view, skill_click, case_view, case_expand.

**CONSTRAINTS:**
- Portability boundary: all Helix AI tokens in src/helix-ai/tokens.css as CSS custom properties under :root and [data-theme="dark"]. All Helix AI components in src/helix-ai/ with zero app-specific imports, so the folder lifts into an npm package unchanged. App code imports only from src/helix-ai.
- No hardcoded colors in components, CSS variables only.
- Responsive, mobile first.

**BUILD ORDER (single session, ship each before starting the next):**
1. next.js + React + Tailwind v4 scaffold, Helix AI tokens, light/dark toggle.
2. CSV loaders + sample skills.csv and cases.csv. I provided an existing cases file, enrich and add 10 examples of AI usecases as placeholder. But do make them creative, relevant and sparking.
3. Homepage, overview, hyper modern animated landingspage.
3. Skills Registry page.
4. Case Study Showcase: conditional sections, template rotation, animated metric callouts.
5. News Hub.
6. Analytics wiring with noop fallback.
7. README.
If session budget runs short, stop at the last fully working step and list what is stubbed.