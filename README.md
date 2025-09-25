# Drone Sightings

Drone Sightings is a public awareness tool that maps and monitors suspected Russian drone activity that disrupts airport operations across Europe. The repo now ships the complete deliverable stack: design documentation, a processed dataset, the static web application, and the data build tooling that keeps everything current.

## 1. UX / UI

- **Satellite-first map.** Esri World Imagery is the default basemap with an OpenStreetMap fallback; Leaflet + MarkerCluster keep the experience light and responsive.
- **Control panel.** Time slider (7/30/90/365 day presets), multi-select filters (country, status, evidence strength), severity toggles, and free-text search.
- **Context panel.** Click a marker or list entry to see timing, duration, evidence level, severity, notes, and source links. Marker size scales with severity for quick triage.
- **Analytics strip.** Live counters (total, closures, high-severity) and a compact ISO-week histogram for trend snapshots.
- **Accessibility.** Keyboard shortcuts (`f` filters, `m` map, `d` details), focus styling, and high-contrast theme. All third-party basemap attributions are kept visible per license.

Open `index.html` in any modern browser or serve the repository root (e.g., `python -m http.server`) to explore the UI.

## 2. Data model

The processed dataset (`data/processed/incidents_last365.*`) contains one record per airport incident with the following schema.

| Field | Description |
| --- | --- |
| `id` | Stable identifier (`<country>-<iata>-<date>`). |
| `date_start_utc`, `date_end_utc` | ISO-8601 timestamps in UTC. |
| `country`, `airport_name`, `iata`, `icao`, `airport_category` | Airport metadata (OurAirports baseline). |
| `lat`, `lon` | WGS84 coordinates used for plotting. |
| `incident_type` | `closure`, `diversion`, `lockdown`, or `sighting`. |
| `uav_count`, `uav_characteristics`, `response` | Operational details from reporting/authorities. |
| `source_primary_url`, `source_secondary_url` | Verifiable news/authority links. |
| `evidence_strength` | 3=official/NOTAM, 2=multiple tier‑1 sources, 1=single credible, 0=unconfirmed. |
| `attribution` | `none`, `suspected`, `claimed`. |
| `notes` | Short analytical context. |
| `duration_min`, `duration_hours` | Derived impact window. |
| `severity`, `severity_label` | Computed impact score (1–5 → low/medium/high). |
| `status_display` | Human-friendly label used in the UI. |

A build summary is written to `data/processed/incidents_summary.json` for quick dashboards.

## 3. Data pipeline

The pipeline is scripted in `scripts/build_dataset.py` (standard-library only) and automated via GitHub Actions for continuous refreshes.

### Local rebuild

```bash
# Rebuild processed artefacts (CSV, JSON, GeoJSON, summary)
./scripts/build_dataset.py \
  --raw-csv data/raw/incidents_manual.csv \
  --output-dir data/processed \
  --days 365
```

### How it works

1. **Manual seed** – `data/raw/incidents_manual.csv` captures verified incidents (Denmark, Norway, Poland, Latvia) with primary/secondary sources.
2. **Derivations** – the script parses timestamps, calculates durations, computes the severity score (status base × airport weighting + duration), and tags severity tiers.
3. **Filtering** – the build keeps the trailing `--days` window (default 365) relative to the `--as-of` timestamp (defaults to build time).
4. **Outputs** – CSV/JSON/GeoJSON for the web app, plus a summary JSON for dashboards or health checks.

### Extend / automate

- **News ingestion:** poll [GDELT](https://www.gdeltproject.org/data.html) for multilingual drone-airport coverage, push candidate articles into the raw CSV for analyst triage.
- **Official data:** cross-check with Eurocontrol EAD (NOTAMs/AIS) or national ANSP portals before promoting incidents to evidence level 3.
- **Airport metadata:** refresh from the [OurAirports open dataset](https://ourairports.com/data/) if new fields are required (e.g., runway bearings for approach-risk buffers).
- **CI/CD:** drop the build command into a scheduled GitHub Action, committing updated `data/processed` artefacts nightly.

### API endpoints

- `GET /api/incidents` → latest processed incidents (JSON array).
- `GET /api/summary` → build metadata (JSON object with counts and timestamps).

These endpoints are served by Vercel’s serverless runtime and fall back to the static JSON files when deployed on GitHub Pages.

### Automated rebuild (GitHub Actions)

`.github/workflows/build-dataset.yml` runs every day at 04:00 UTC (and on manual dispatch). It executes the build script and, when processed artefacts change, commits them back to the repository. Once the repo is connected to Vercel or Pages, each commit triggers a redeploy with fresh data.

## 4. Web application

`index.html` is a self-contained Leaflet app that fetches `data/processed/incidents_last365.json` and `incidents_summary.json` at runtime.

Highlights:
- Clustered markers with severity-scaled sizing and rich popups.
- Filter-aware CSV export to share briefings quickly.
- ISO-week histogram rendered with vanilla JS for zero extra dependencies.
- Detail panel that cross-links map markers and contextual notes.
- The front-end first queries `/api/incidents` (serverless function on Vercel) and falls back to the static JSON for GitHub Pages compatibility.

All assets load from public CDNs; no build step is required. For local testing:

```bash
python -m http.server 8000
# Visit http://localhost:8000
```

## 5. Deployment

- **GitHub Pages:** push to `main`, then enable Pages → “Deploy from branch” (root). The site consumes the baked JSON from `data/processed`, so it works out-of-the-box.
- **Vercel (dynamic refresh):** connect the repo, set the project type to _Static Site_, and Vercel will redeploy automatically whenever the scheduled workflow commits a refreshed dataset. The `/api/incidents` and `/api/summary` serverless routes serve the latest JSON to the front-end. (Add a custom deploy step with `vercel deploy` if you prefer explicit control.)
- **Netlify / other:** drag-and-drop the repository or point a CI/CD pipeline at it; ensure `data/processed` is published alongside `index.html`.

## 6. Sources & verification

- Reuters, AP, DR/NRK, and LSM/BNN for incident confirmation (evidence levels 1–2).
- Eurocontrol / national NOTAMs for level-3 verification (account access required).
- EASA “Drone Incident Management at Aerodromes” for operational context and severity modelling guidance.
- OurAirports for airport metadata and classification.

## 7. Roadmap ideas

1. **Automated scraping + analyst queue** (GitHub Actions that flag new articles + manual confirmation workflow).
2. **Runway risk rings** (buffer approach paths using OurAirports runway data, highlighting incursions within 5 km/10 km).
3. **Time-series exports** (weekly CSV deltas + API endpoint for downstream dashboards).
4. **Attribution watchlist** (link incidents to public statements, sanctions, or military exercises).

Pull requests and issue reports are welcome.
