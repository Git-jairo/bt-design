# AI Accelerator — `/experiments/ai`

Internal AI showcase for Budget Thuis: skills registry, case study showcase, news hub, and governance guide. Built as a self-contained experiment in the BudgetThuis.Design lab.

---

## Quick start

```bash
npm run dev          # → http://localhost:3000/experiments/ai
```

No extra setup required. Skills and cases load from `/public/data/*.csv` at runtime.

---

## CSV schemas

Both files live in `public/data/`. Change `BASE_URL` in `loader.ts` to swap to a remote endpoint.

### `skills.csv`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier, e.g. `SKILL-01` |
| `title` | string | Short display name |
| `description` | string | One-paragraph description |
| `category` | string | Team or domain label |
| `claudeEnterpriseLink` | string | Direct URL to the skill in Claude Enterprise |
| `feedbackUrl` | string | Feedback form URL |

**Sample row:**
```csv
SKILL-01,Email Intent Decoder,"Surfaces the question behind the question in customer emails.",Customer Contact,https://claude.ai/project/email-intent,https://forms.gle/email-feedback
```

### `cases.csv`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier, e.g. `KCC-01` |
| `title` | string | Case study title |
| `author` | string | Team name |
| `date` | string | Month + year, e.g. `April 2026` |
| `introduction` | string | 1-3 sentence opener |
| `problem` | string | Problem definition |
| `hypothesis` | string | Hypothesis (may be empty — section is hidden) |
| `approach` | string | How it was built |
| `conclusion` | string | What was learned / outcome |
| `datasection` | string | JSON string: `{"hoursSaved": 120, "processesAutomated": 4, "impact": "…"}` |
| `imageUrl` | string | Optional image URL; empty → deterministic gradient placeholder |
| `templateVariant` | string | `A`, `B`, `C`, or `D`; empty → assigned by index |

**Sample row** (note: the `datasection` JSON field is double-quoted and internal quotes are doubled for CSV escaping):
```csv
KCC-01,Reading Between the Lines,KCC Team,April 2026,"Short intro.","Problem text.","Hypothesis text.","Approach text.","Conclusion text.","{""hoursSaved"": 1400, ""processesAutomated"": 1, ""impact"": ""22% fewer repeat contacts.""}","",A
```

### `datasection` field
The `datasection` JSON string drives the metric callout block. All fields are optional:
```json
{
  "hoursSaved": 1400,
  "processesAutomated": 3,
  "impact": "Plain-text summary of measured impact."
}
```
The metric block is hidden when the field is empty or unparseable.

---

## Swapping to a remote data source

Open `src/app/(lab)/experiments/ai/loader.ts` and change:

```ts
export const BASE_URL = '';
// → becomes:
export const BASE_URL = 'https://your-api.example.com';
```

`loadSkills()` will then fetch `https://your-api.example.com/data/skills.csv` and `loadCases()` will fetch `…/data/cases.csv`. Any endpoint that returns plain-text CSV with the correct headers works.

---

## Analytics

Set the `NEXT_PUBLIC_GA_ID` environment variable to your GA4 measurement ID:

```bash
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

When unset, all tracking calls are silent noops — no console errors. Events tracked:

| Event | When |
|-------|------|
| `page_view` | Page mount |
| `skill_click` | Open in Claude or Give feedback button |
| `case_view` | Case card wrapper click |
| `case_expand` | Read the case / expand toggle |

---

## Helix AI sub-theme portability

The `src/helix-ai/` folder is designed as a portable design system layer:

- **`src/helix-ai/tokens.css`** — all CSS custom properties under `.ai-root` (light) and `.ai-root[data-theme="dark"]` (dark), plus `@theme` utilities and `@keyframes`. Zero app-specific imports.
- This folder can be extracted as an npm package and used in any project that imports the CSS through its Tailwind entry.

**Token namespacing:**
- `--color-ai-*` and `--shadow-ai-*` — static Tailwind utilities
- `--ai-*` — runtime CSS variables (theme-sensitive, declared on `.ai-root`)
- No conflicts with Helix site tokens (`--color-*`, `--font-helix-*`) or hackathon26 M3 tokens (`--color-surface-*`, `--color-primary-*`)

---

## Template variants (cases)

| Variant | Layout | Best for |
|---------|--------|----------|
| A | Side-by-side split, teal left accent | Text-rich cases with image |
| B | Full-bleed image top, content below | Visual-led cases |
| C | Data-first, large metric grid, collapsible narrative | Cases with strong metrics |
| D | Inverted dark card, mint accent | Feature cases, contrast emphasis |

Set `templateVariant` in `cases.csv` to override; leave empty to assign by index (`idx % 4`).
