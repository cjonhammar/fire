# FIRE-planerare (svensk)

En interaktiv webbapp för att planera **FIRE** (Financial Independence, Retire Early) med svenska skatteregler, ISK-schablonskatt, tjänste-/allmän pension och en kombinerad hushållssimulering för två personer (sambor/gifta).

Allt räknas **år för år** från idag till förväntad livslängd. Alla belopp i konfigurationen anges i **dagens köpkraft** och indexeras med inflationen — så utgift, pensioner och löner är jämförbara i varje kalenderår.

> ⚠️ **Ingen finansiell rådgivning.** Det här är ett privat planeringsverktyg byggt på förenklade modeller och egna antaganden. Skatteregler och pensionsprognoser ändras. Verifiera mot Skatteverket, din pensionsförvaltare och eventuellt en oberoende rådgivare innan du fattar beslut.

---

## Funktioner

Tre flikar:

| Flik | Vad den visar |
|------|---------------|
| **Person** | Din egen FIRE-plan: kapital, FIRE-tal, kassaflöde, skatt, hållbarhet, Monte Carlo, Die With Zero. |
| **Partner** | Samma analys för person 2. |
| **Hushåll** | Kombinerad simulering av båda portföljerna, gemensam utgift, löner, pensioner, arv vid dödsfall. |

Analyser:

- **FIRE-tal** — nuvärdet av alla framtida ISK-uttag (kapitalbehovet vid FIRE).
- **Trinity-referens** — målbelopp = 25× årsutgift (4 % SWR) samt konservativt 3,5 % (≈28,6×).
- **Deterministisk framskrivning** — portföljens väg år för år.
- **Hållbarhet & avkastningsscenarier** — slutkapital och ev. tömningsålder vid 0–12,5 % avkastning.
- **Monte Carlo** — 10 000 simuleringar med slumpmässig avkastning (och valfri slumpmässig inflation); ger lyckandegrad och percentilkon.
- **Die With Zero** — hur mycket mer du kan spendera om målet är att lämna ett visst arv (binärsökning på utgiftsskalan).
- **Känslighetsanalys** — FIRE-tal som funktion av utgift × avkastning.
- **Inkomstkällor per år** — staplar för lön, pension, stiftelse, extrajobb, ISK-uttag och skatt.

---

## Beräkningsmodell

All matematik ligger i [`src/calculations.js`](src/calculations.js) som rena funktioner (ingen DOM/React). `buildSchedule()` producerar en rad per ålder och allt annat läser från det schemat.

### Antaganden (standard, justerbara i config)

Hämtade från projektets `CLAUDE.md`:

- **Säker uttagsnivå (SWR):** 4 % (Trinity-studien), med 3,5 % som konservativt alternativ.
- **Inflation:** 2 %/år. Indexerar utgift, pensioner och löner.
- **Avkastning:** nominell 6 % (≈ realt mål om ~4 % efter inflation; justerbart per scenario).
- **FIRE-brytpunkt:** 25× årsutgift.

### Svensk skatt (inkomstår 2025)

Implementerat i `swedenIncomeTax()` och verifierat mot Skatteverkets tabeller under kodgranskning 2026-06-12:

- **Prisbasbelopp (PBB) 2025:** 58 800 kr — bas för grundavdrag och jobbskatteavdrag.
- **Grundavdrag** under 65: andelar av PBB enligt 63 kap. 3 § inkomstskattelagen (max ≈45 300, golv ≈17 300).
- **Förhöjt grundavdrag** (fyllt 66 vid årets ingång / fyller 67 under året): styckvis linjär interpolation av Skatteverkets officiella tabell — skattefritt upp till 65 200, max 163 100 vid 474 900, golv 107 400 över 733 100.
- **Jobbskatteavdrag (JAS):** 2025 års regler enligt **prop. 2025/26:32** — underlag i andelar av PBB minus grundavdraget × kommunalsatsen. Avtrappningen för höga inkomster är **avskaffad från 2025**.
- **Statlig inkomstskatt:** 20 % över skiktgränsen 625 800 kr (2025).
- **Kommunalskatt:** sätts per person i config (kommun + region + begravningsavgift).

### ISK-schablonskatt (2026)

`ISK_TAX_RATE = 1,065 %` = (statslåneräntan nov 2025, 2,55 % + 1,0 procentenhet) × 30 %. Dras från den nominella avkastningen i alla kapitalframskrivningar. Fribeloppet (300 000 kr/person från 2026) ignoreras — konservativt.

### Stiftelse & extrajobb

- **Stiftelse:** ett engångskapital som betalas ut som annuitet mellan start- och slutålder; beskattas som pension (ger inte jobbskatteavdrag).
- **Extrajobb:** extra arbetsinkomst (brutto, dagens kr) som inflationsuppräknas, lönebeskattas och ger jobbskatteavdrag.

### Kända, medvetna förenklingar

- Public service-avgift ignoreras (~1 250 kr/person/år).
- Förstärkt jobbskatteavdrag för 66+ modelleras ej.
- Skattegränser frysta på 2025-nivå (bracket creep ⇒ konservativt).
- I hushållsvyn används person 1:s avkastning/inflation för båda; löneöverskott utöver månadssparandet sparas inte; endast person 1:s död modelleras.

---

## Konfiguration

Alla personliga siffror ligger i **`public/config.json`**, som är **gitignore:ad** och aldrig committas (innehåller portfölj-, pensions- och löneuppgifter). Vid körning mountas den som en read-only volym in i containern.

- Kopiera mallen och fyll i dina värden:
  ```bash
  cp public/config.example.json public/config.json
  ```
- [`public/config.example.json`](public/config.example.json) är committbar och innehåller endast påhittade exempelvärden. Den dokumenterar varje fält.
- Om `config.json` saknas eller är ogiltig visar appen neutrala exempelvärden och en synlig varningsbanner.
- JSONC-stil: `//`-kommentarer måste stå på egen rad (de strippas innan `JSON.parse`).

---

## Köra lokalt

Stack: **Vite + React 18 + Recharts**, mörkt tema med Tailwind.

```bash
npm install
npm run dev      # utvecklingsserver
npm run build    # produktionsbygge till dist/
```

### Docker (så här driftas appen)

Appen byggs och serveras via nginx i en container. `public/config.json` bakas **inte** in i imagen (`.dockerignore`) utan mountas som read-only volym vid körning. Serveras på port 3800.

```bash
docker compose up -d --build fire-app
```

---

## Projektstruktur

```
src/
  calculations.js          # All FIRE-matematik (rena funktioner)
  App.jsx                  # Flikar, config-laddning, layout
  components/
    InputPanel.jsx         # Sidopanel med alla parametrar
    MetricsCards.jsx       # Nyckeltal
    ProjectionChart.jsx    # Deterministisk framskrivning
    SustainabilityTable.jsx
    ReturnScenariosTable.jsx
    MonteCarloChart.jsx    # Percentilkon + lyckandegrad
    SpaghettiPlot.jsx
    SuccessRateChart.jsx
    SensitivityTable.jsx
    IncomeSourcesChart.jsx
    DieWithZeroPanel.jsx
    HouseholdPage.jsx      # Kombinerad tvåpersonerssimulering
public/
  config.example.json      # Committbar mall (påhittade värden)
  config.json              # Dina riktiga värden (gitignore:ad)
```

## Sekretess

`config.json`, `docs/`, `*.pdf` och `.env` är gitignore:ade och har **aldrig** committats. Det publika repot innehåller bara kod och exempelvärden.
