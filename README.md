#  Drone Sightings

## Project Overview
Drone Sightings is a public awareness tool that maps and monitors suspected Russian drone activities that disrupt airport operations across Europe. It offers a fast, satellite-based map with clustered pins that represent closures, diversions, lockdowns or sightings of drones near airports. This repository contains only two files: `index.html`, the complete interactive web application, and `README.md`, which documents the design, data, pipeline and deployment.

## UX/UI Plan

* **Map first** – the app uses a full-screen satellite basemap (Esri World Imagery) with a toggle for streets. Incidents appear as clustered markers that expand on zoom, keeping the map readable.
* **Left panel** – a collapsible control panel holds:
  * a time slider (default last 365 days) with quick chips: 7d/30d/90d/YTD;
  * filters for country, incident type (closure, diversion, lockdown, sighting), evidence strength (0–3) and severity (low/medium/high);
  * a search box for airport, IATA/ICAO or city.
* **Right panel** – clicking a marker opens a details pane showing who/what/when, duration, evidence level, severity, notes and clickable source links, plus a NOTAM/ANSP link if available.
* **Analytics bar** – shows totals and a mini histogram of incidents by week.
* **Accessibility & performance** – keyboard navigation with focus rings, high‑contrast theme, reduced motion option and CDN‑hosted assets keep the site fast and usable. Esri's terms require attribution in any application using its basemap【990422758815247†L177-L181】.

## Data Model & Scoring

* **Core fields** – each incident record contains: id, date_start_utc, date_end_utc, country, airport_name, iata, icao, lat, lon, incident_type (closure|diversion|lockdown|sighting), duration_min, uav_count, uav_characteristics, response (ATC|police|mil), source_primary_url, source_secondary_url, evidence_strength (0–3), attribution (none|suspected|claimed), severity (1–5) and notes.
* **Evidence strength** – level 3 incidents are verified by an airport, ANSP or NOTAM; level 2 means multiple tier‑1 outlets (Reuters/AP/NRK/DR/LSM) agree; level 1 means a single credible source; level 0 remains unverified. The EASA “Drone Incident Management at Aerodromes” manual notes that unauthorized drones near airports pose safety risks that may require operators to restrict or stop runway operations【362426046612078†L122-L138】.
* **Severity scoring** – closures/diversions start with a base severity; longer durations and higher airport traffic increase the score; sighting-only events score lower.

## Data Pipeline

* **Authoritative data** – we monitor Eurocontrol EAD Basic/Full for NOTAMs and AIS (requires an account) to confirm official closures. Airport metadata (IATA, ICAO, location) comes from the OurAirports open dataset, which is updated nightly【269169416735060†L67-L69】.
* **News ingestion** – we use the GDELT Project’s database to fetch news articles containing “drone”, “airport” and “closure” across multiple EU languages; GDELT is a free, open database that supports large‑scale near real‑time analysis【751740773395311†L19-L27】【751740773395311†L23-L31】.
* **Manual seed incidents** – a seed CSV in `index.html` includes verified incidents:
  * Denmark – closures at Copenhagen (4 h, 22 Sep 2025), Aalborg (~3 h, 24‑25 Sep 2025) and Billund (1 h, 25 Sep 2025) with sightings at Esbjerg, Sønderborg and Skrydstrup【145125084162679†L204-L211】【183071439373383†L182-L206】.
  * Norway – Oslo Gardermoen closed for about 3 h (22‑23 Sep 2025)【145125084162679†L204-L211】.
  * Poland – Warsaw Chopin, Modlin, Rzeszów and Lublin airports temporarily shut down during a drone incursion on 9‑10 Sep 2025【795632323664378†L198-L200】.
  * Latvia – Riga International locked down with diversions on 13‑14 Jan 2025 (LSM/BNN).
* Additional sightings can be appended via CSV/JSON to extend the app.

## Application

This project’s `index.html` is a self‑contained static web application built with Leaflet and Leaflet.MarkerCluster. It displays incidents on an interactive satellite map with filters, a time slider, clustering, a searchable list, and accessible design. The app uses Esri’s World Imagery tiles and OpenStreetMap as an alternative basemap.

## Deployment

To deploy:
1. Clone the repository or download the files.
2. Serve `index.html` via any static web host. For GitHub Pages, enable Pages in the repository settings and set the branch to `main`. For Vercel, drag‑and‑drop the folder or run `vercel deploy`.

To update data automatically, host a JSON or CSV file (e.g., on GitHub or S3) and modify the app to fetch this file periodically. A scheduled GitHub Actions workflow could query GDELT, parse relevant articles and cross‑reference NOTAMs to generate an updated dataset.

## Sources

* Esri Leaflet Terms of Use – attribution requirement【990422758815247†L177-L181】.
* EASA “Drone Incident Management at Aerodromes” – notes on airport closures due to unauthorized drones【362426046612078†L122-L138】.
* OurAirports dataset – open airports data updated nightly【269169416735060†L67-L69】.
* GDELT Project – free, open database with real‑time news【751740773395311†L19-L27】【751740773395311†L23-L31】.
* Reuters reports – Danish airport closures【145125084162679†L204-L211】【183071439373383†L182-L206】 and Polish airports during drone incursion【795632323664378†L198-L200】.
