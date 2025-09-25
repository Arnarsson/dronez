# Drone Sightings

Drone Sightings is a Europe-wide situational awareness surface tracking suspected hostile drone activity affecting airports, harbours, and other critical infrastructure. The site is a static Leaflet application backed by an hourly GitHub Actions ingestion pipeline and open-source data feeds. It is designed for rapid briefings: stylish, credible, and easy to deploy (GitHub Pages, Vercel, Netlify, S3, …).

## Features

- **Coverage** – Airports and harbours across Europe (config hooks for energy, rail, border, military assets).
- **Fresh data** – GitHub Action ingests GDELT + curated RSS hourly, geocodes to known assets, dedupes, scores evidence/severity, and writes `public/incidents.json`.
- **Front-end UX** – Satellite-first map, layer toggles, time slider, severity legend, provenance drawer, and auto-refresh every 5 minutes.
- **Credibility guardrails** – Evidence strength (0–3), severity scoring (1–5), de-duplication, and defaults that hide unverified reports.
- **Zero backend** – Everything ships from the repo; no databases, no servers. Optional endpoints can be added for moderation later.

## Repository layout

```
index.html                    # Leaflet UI (no build step)
public/incidents.json          # Hourly-updated dataset (JSON schema below)
public/incidents.schema.json   # Schema for validation/documentation
scripts/build_dataset.py       # Legacy CSV builder (airports only, optional)
tools/build_assets.py          # Downloads airports.csv + harbours.geojson
tools/ingest.py                # Hourly ingestion (GDELT + RSS → incidents.json)
.github/workflows/ingest.yml   # Hourly GitHub Action
```

Generated assets live under `data/assets/` (airports.csv, harbours.geojson). They refresh automatically at most once every 24 hours inside the Action.

## Dataset schema

`public/incidents.schema.json` documents the structure. A single file contains the current snapshot:

```json
{
  "generated_utc": "2025-09-25T21:00:00Z",
  "incidents": [
    {
      "id": "string",
      "first_seen_utc": "2025-09-22T19:00:00Z",
      "last_update_utc": "2025-09-22T23:00:00Z",
      "asset": {
        "type": "airport|harbour|energy|rail|border|military",
        "name": "Copenhagen Airport",
        "iata": "CPH",
        "icao": "EKCH",
        "osm_id": 123,
        "lat": 55.6181,
        "lon": 12.6561
      },
      "incident": {
        "category": "closure|diversion|lockdown|sighting|navwarn",
        "status": "active|resolved|unconfirmed",
        "duration_min": 240,
        "uav_count": 2,
        "uav_characteristics": "lights toggled",
        "response": ["ATC", "police"],
        "narrative": "Runway ops paused; drones observed on approach"
      },
      "evidence": {
        "strength": 0–3,
        "attribution": "none|suspected|claimed",
        "sources": [
          {"url": "https://…", "publisher": "Reuters", "lang": "en", "first_seen": "2025-09-22T20:10:00Z"}
        ],
        "notam_navtex_ids": []
      },
      "scores": {
        "severity": 1–5,
        "risk_radius_m": 5000
      },
      "tags": ["night", "approach-path"]
    }
  ]
}
```

## Hourly ingestion pipeline

1. **Assets** – `tools/build_assets.py` downloads the latest OurAirports CSV (filtered to Europe) and an Overpass snapshot of European harbours. Run manually or let the Action refresh them daily.
2. **Sources** – `tools/ingest.py` queries the GDELT Doc API (last 90 minutes) and high-trust RSS feeds (extend the `RSS_FEEDS` list).
3. **Classification** – light keyword detection to label airports vs harbours, plus fuzzy matching to snap the story to a known asset.
4. **Scoring** – evidence level (0–3) based on publishers, severity estimate (1–5) by asset type + duration.
5. **De-duplication** – incidents with similar narrative and identical assets within the window are merged (sources + timestamps aggregated).
6. **Output** – writes `public/incidents.json` with the merged dataset. The Action commits the result if it changed.

### GitHub Action

`.github/workflows/ingest.yml`

```yaml
name: ingest-hourly
on:
  schedule:
    - cron: "0 * * * *"
  workflow_dispatch: {}
permissions:
  contents: write
jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install requests pandas shapely rapidfuzz feedparser pytz
      - name: Build assets (if missing or stale)
        run: |
          python tools/build_assets.py  # executed at most once per day via marker file
      - name: Run ingestion
        run: python tools/ingest.py
      - name: Commit JSON
        run: |
          git config user.name "dronez-bot"
          git config user.email "actions@github.com"
          git add public/incidents.json
          git commit -m "hourly: update incidents.json" || echo "no changes"
          git push
```

> The workflow embeds a lightweight Python snippet to avoid re-downloading assets more than once per 24 hours.

## Front-end (index.html)

A single static HTML file using Leaflet + MarkerCluster. Key behaviour:

- Fetches `public/incidents.json` on load and every 5 minutes (cache-busting query param).
- Layer toggles for each asset class (airports + harbours active by default; placeholders for energy/rail/border/military).
- Time slider and quick chips (7/30/90/365 days) filter the dataset client-side.
- Severity-scaled markers with rich popups and a detail list that mirrors the map.
- Works on GitHub Pages, Vercel, Netlify, S3, etc. with no build step.

## Running locally

```bash
# Ensure assets exist (first run)
python tools/build_assets.py

# Populate starter incidents
python tools/ingest.py

# Serve locally
python -m http.server 8000
# Browse http://localhost:8000/index.html
```

You can validate the JSON against the schema with your favourite validator (e.g., `ajv`, `python -m json.tool`, etc.).

## Deployment

1. **GitHub Pages** – push to `main`, enable Pages → “Deploy from branch” (root). `public/` content is served from `/public/...` URLs.
2. **Vercel** – import the repo, let the zero-config build run (`npm run build` is executed via `vercel.json`, emitting a `/dist` bundle with `index.html`, `incidents.json`, and supporting assets). Every push—including hourly dataset commits—triggers a fresh deploy.
3. **Netlify / S3 / CloudFront** – run `npm run build`, deploy the generated `dist/` folder, and ensure `/incidents.json` isn’t cached too aggressively (or keep the cache-busting query parameter).

## Extending

- Add more asset classes by expanding `tools/build_assets.py` and front-end toggles.
- Introduce official NOTAM/NAVTEX ingestion for evidence level 3 (respect Eurocontrol / national MSI terms).
- Hook in Slack/Teams webhooks for high-evidence incidents.
- Persist ingest logs (e.g., `public/incidents.ndjson`) for auditing and analyst annotations.

## License & attributions

- Basemap tiles: Esri World Imagery (light usage within free tier). Attribution is rendered in-map by Leaflet.
- Points of Interest: OpenStreetMap (harbours) and OurAirports (airports). Both are open data; keep the attribution.
- News content: only metadata (headline + link) is stored; follow publisher T&Cs when expanding ingestion.

Contributions welcome—open an issue or PR with ideas for additional sources, scoring improvements, or UI refinements.
