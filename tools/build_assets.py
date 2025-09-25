#!/usr/bin/env python3
"""Download base asset registries (airports, harbours) for Drone Sightings.

Airports: OurAirports CSV filtered to Europe (broad definition).
Harbours: Overpass query grabbing harbours/ports/ferry terminals around Europe.
"""
from __future__ import annotations

import csv
import json
import pathlib
import sys
from urllib.parse import quote
from urllib.request import urlopen

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "data" / "assets"
ASSET_DIR.mkdir(parents=True, exist_ok=True)

EU_ISO = {
    "AL","AD","AT","BA","BE","BG","BY","CH","CY","CZ","DE","DK","EE","ES","FI","FO","FR","GB","GI","GR","HR",
    "HU","IE","IS","IT","LI","LT","LU","LV","MD","ME","MK","MT","NL","NO","PL","PT","RO","RS","RU","SE","SI","SK",
    "SM","UA"
}


def download_airports() -> None:
    url = "https://ourairports.com/data/airports.csv"
    text = urlopen(url, timeout=60).read().decode("utf-8", "ignore")
    rows = list(csv.DictReader(text.splitlines()))
    if not rows:
        print("[warn] OurAirports returned no rows", file=sys.stderr)
        return
    filtered = [row for row in rows if row.get("iso_country") in EU_ISO]
    out_path = ASSET_DIR / "airports.csv"
    if not filtered:
        out_path.write_text('', encoding='utf-8')
        print('[warn] no European airports matched filter', file=sys.stderr)
        return
    with out_path.open('w', encoding='utf-8', newline='') as fh:
        writer = csv.DictWriter(fh, fieldnames=filtered[0].keys())
        writer.writeheader()
        for row in filtered:
            writer.writerow(row)
    print(f"Saved {len(filtered)} European airports -> {out_path}")


def download_harbours() -> None:
    overpass = """
    [out:json][timeout:60];
    (
      node["harbour"](35,-15,72,40);
      way["harbour"](35,-15,72,40);
      relation["harbour"](35,-15,72,40);
      node["amenity"="ferry_terminal"](35,-15,72,40);
      way["amenity"="ferry_terminal"](35,-15,72,40);
      relation["amenity"="ferry_terminal"](35,-15,72,40);
      node["port"](35,-15,72,40);
      way["port"](35,-15,72,40);
      relation["port"](35,-15,72,40);
    );
    out center tags;
    """
    url = "https://overpass-api.de/api/interpreter?data=" + quote(overpass)
    raw = urlopen(url, timeout=180).read().decode("utf-8", "ignore")
    osm = json.loads(raw)
    features = []
    for element in osm.get("elements", []):
        center = element.get("center", {})
        lat = element.get("lat", center.get("lat"))
        lon = element.get("lon", center.get("lon"))
        if lat is None or lon is None:
            continue
        tags = element.get("tags", {})
        name = tags.get("name") or tags.get("harbour") or tags.get("ref") or "Unnamed harbour"
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [float(lon), float(lat)]},
            "properties": {
                "osm_id": element.get("id"),
                "name": name,
                "tags": {k: v for k, v in tags.items() if k not in {"name", "harbour"}}
            }
        })
    out_path = ASSET_DIR / "harbours.geojson"
    out_path.write_text(json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False), encoding="utf-8")
    print(f"Saved {len(features)} harbour/port features -> {out_path}")


def main() -> None:
    download_airports()
    download_harbours()


if __name__ == "__main__":
    main()
