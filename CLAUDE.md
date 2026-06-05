@AGENTS.md

# Hackathon 2026 - Bouwsessie samenvatting
**Datum:** 3 juni 2026  
**Project:** IVR Priority Queue Dashboard — Budget Thuis  
**URL:** https://www.budgetthuis.design/hackathon26

---

## Wat we gebouwd hebben

Een live agent-dashboard dat inkomende bellers prioriteert op basis van klantwaarde. Agents zien in één oogopslag wie er wacht, in welke volgorde, en waarom.

---

## Architectuur

```
Inbound call
   ↓
Twilio Voice number (+3197010252755)
   ↓
Twilio Function: identify-and-queue
   ↓
Klantwaarde lookup (hardcoded JSON)
   ↓
Prioriteitsbepaling (HVC ≥ 90 → 1000, overige → 0)
   ↓
TaskRouter task aangemaakt met priority + attributes
   ↓
Beller hoort welkomstboodschap + wachtmuziek (pause)
   ↓
Dashboard pollt /api/queue elke 10 seconden
   ↓
Agent ziet wachtrij live, gesorteerd op prioriteit
```

---

## Twilio-componenten

| Component | Gebruik |
|---|---|
| Twilio Voice | Inkomende calls afhandelen |
| Twilio Functions | Klantwaarde lookup + task aanmaken |
| Twilio TaskRouter | Prioriteitswachtrij beheren |
| Twilio Flex workspace | Bestaande workspace hergebruikt |

### Workspace
- **Naam:** Flex Task Assignment
- **SID:** WS8921519e182aa5f5bcc858245adf35bd

### Twilio Function: `identify-and-queue`
- Herkent beller op telefoonnummer
- Bepaalt klantwaarde en segment
- Maakt TaskRouter task aan met `priority` en `attributes`
- Speelt welkomstboodschap en houdt beller in de lijn via `twiml.pause`

---

## Prioriteitslogica

```
customerValueScore >= 90  →  priority = 1000  (High Value Customer, altijd voor)
customerValueScore < 90   →  priority = 0     (normale wachtrij, op wachttijd)
```

De `update-priorities` function (nog in te stellen als cron) verhoogt de prioriteit van normale klanten met hun wachttijd in seconden, zodat ze nooit permanent achteraan staan. Max prioriteit voor normale klanten: 999, zodat HVC altijd boven blijft.

### Dummy klantenset

| Nummer | Naam | Segment | Score | Tag |
|---|---|---|---|---|
| +31610487300 | Jairo | Premium | 95 | High Value Customer |
| +31625505989 | Roel | Zakelijk | 80 | |
| +31610794453 | Safira | Standaard | 45 | |
| +31610000004 | Daan | Nieuw | 25 | |
| +31610000005 | Emma | Risico op churn | 70 | |

---

## Dashboard (Next.js op Vercel)

### Tech stack
- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind)
- **Hosting:** Vercel
- **Domein:** budgetthuis.design
- **Repo:** github.com/Git-jairo/bt-design

### Pagina: `/hackathon26`
- Linkerkolom: live wachtrij gesorteerd op prioriteit
  - Klantwaardescore in cirkel (kleurgecodeerd)
  - Segment + telefoonnummer als caption
  - Wachttijd tikt elke seconde op in de browser
  - HVC-badge voor klanten met score ≥ 90
- Rechterkolom: klantdetailpanel bij selectie
  - Segment, prioriteit, wachttijd, telefoonnummer
  - Aanbevolen aanpak per segment
  - Knop om gesprek te cancellen

### API routes

| Route | Methode | Functie |
|---|---|---|
| `/api/queue` | GET | Haalt pending tasks op uit TaskRouter |
| `/api/queue/[sid]` | DELETE | Cancelt een specifieke task |

### Polling strategie
- Elke 10 seconden haalt de pagina verse data op via `/api/queue`
- Wachttijdtimers tikken lokaal elke seconde zonder API-call
- Zolang Twilio geen data geeft, toont het dashboard demodata

### Environment variables (Vercel + .env.local)
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WORKSPACE_SID=WS8921519e182aa5f5bcc858245adf35bd
```

---

## Openstaande punten

1. **Task creation bug:** de `tasks.create()` aanroep in de Function faalt soms zonder zichtbare error. Function logs nog te controleren via Twilio Console > Functions > Logs.
2. **update-priorities cron:** de wachttijdbonus voor normale klanten wordt nog niet automatisch herberekend. Cron-trigger via cron-job.org of Vercel Cron instellen op de `/update-priorities` Function URL.
3. **Wachtmuziek:** `twiml.pause` vervangen door `twiml.play` met een mp3 uit de `/public` map op Vercel.
4. **Gesprek accepteren:** de "Accepteer gesprek" knop is nog niet gekoppeld aan de Twilio Voice SDK. Hiervoor is een Access Token nodig met Voice + TaskRouter grants.

---

## Lokaal draaien

```bash
cd hackathon26
npm run dev
# → http://localhost:3000/hackathon26
```

Wijzigingen zijn direct zichtbaar zonder te pushen. Env vars worden geladen vanuit `.env.local`.

## Deployen

Push naar `main` branch, Vercel deployt automatisch.

```bash
git add .
git commit -m "beschrijving"
git push
```