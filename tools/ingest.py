#!/usr/bin/env python3
"""Hourly ingestion for Drone Sightings (airports + harbours across Europe).

Pulls open-source reports (GDELT + RSS), matches to known assets, applies
simple scoring/deduplication, and writes public/incidents.json conforming to
public/incidents.schema.json.
"""
from __future__ import annotations

import csv
import json
import math
import os
import re
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from math import atan2, cos, radians, sin, sqrt
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlencode
from urllib.request import urlopen

import feedparser
from rapidfuzz import fuzz

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "data" / "assets"
PUBLIC_DIR = ROOT / "public"
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def utcnow_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def haversine_km(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    r = 6371
    lat1, lon1 = radians(a[0]), radians(a[1])
    lat2, lon2 = radians(b[0]), radians(b[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * r * atan2(sqrt(h), sqrt(1 - h))


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


# ---------------------------------------------------------------------------
# Load assets
# ---------------------------------------------------------------------------

def load_airports() -> List[Dict[str, object]]:
    path = ASSET_DIR / "airports.csv"
    results: List[Dict[str, object]] = []
    if not path.exists():
        print("[warn] airports.csv not found; run tools/build_assets.py", file=sys.stderr)
        return results
    with path.open(encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            try:
                lat = float(row["latitude_deg"])
                lon = float(row["longitude_deg"])
            except (TypeError, ValueError):
                continue
            results.append({
                "name": row.get("name", "").strip(),
                "iata": (row.get("iata_code") or "").strip() or None,
                "icao": (row.get("ident") or "").strip() or None,
                "lat": lat,
                "lon": lon,
            })
    return results


def load_harbours() -> List[Dict[str, object]]:
    path = ASSET_DIR / "harbours.geojson"
    if not path.exists():
        print("[warn] harbours.geojson not found; run tools/build_assets.py", file=sys.stderr)
        return []
    doc = json.loads(path.read_text(encoding="utf-8"))
    features: List[Dict[str, object]] = []
    for feature in doc.get("features", []):
        lon, lat = feature.get("geometry", {}).get("coordinates", [None, None])
        if lat is None or lon is None:
            continue
        props = feature.get("properties", {})
        features.append({
            "name": props.get("name", "Unnamed harbour"),
            "osm_id": props.get("osm_id"),
            "lat": float(lat),
            "lon": float(lon),
        })
    return features


AIRPORTS = load_airports()
HARBOURS = load_harbours()


# ---------------------------------------------------------------------------
# Data sources
# ---------------------------------------------------------------------------

def fetch_gdelt(minutes: int = 90) -> List[Dict[str, str]]:
    query = (
        "(drone OR uav) AND (airport OR airfield OR runway OR port OR harbour "
        "OR harbor OR ferry OR quay OR berth OR vts)"
    )
    params = {
        "query": query,
        "format": "json",
        "maxrecords": "75",
        "timespan": f"MINUTE:{minutes}",
    }
    url = "https://api.gdeltproject.org/api/v2/doc/doc?" + urlencode(params)
    try:
        raw = urlopen(url, timeout=60).read().decode("utf-8", "ignore")
        data = json.loads(raw)
    except Exception as exc:
        print(f"[warn] GDELT fetch failed: {exc}", file=sys.stderr)
        return []

    items = []
    for article in data.get("articles", []):
        items.append({
            "title": article.get("title", ""),
            "url": article.get("url", ""),
            "publisher": article.get("sourceDomain", ""),
            "lang": article.get("language"),
            "datetime": article.get("seendate"),
        })
    return items


RSS_FEEDS = [
    "https://www.reuters.com/rssFeed/world/europe",
]


def fetch_rss() -> List[Dict[str, str]]:
    items: List[Dict[str, str]] = []
    for feed_url in RSS_FEEDS:
        try:
            parsed = feedparser.parse(feed_url)
        except Exception as exc:
            print(f"[warn] RSS parse failed ({feed_url}): {exc}", file=sys.stderr)
            continue
        for entry in parsed.entries[:40]:
            items.append({
                "title": entry.get("title", ""),
                "url": entry.get("link", ""),
                "publisher": parsed.feed.get("title", "rss"),
                "lang": entry.get("language"),
                "datetime": entry.get("published"),
            })
    return items


# ---------------------------------------------------------------------------
# Classification & geocoding
# ---------------------------------------------------------------------------

def detect_asset_type(title: str, text: str) -> Optional[str]:
    hay = f"{title} {text}".lower()
    if re.search(r"\b(airport|airfield|runway|flight|terminal|arrival|departure)\b", hay):
        return "airport"
    if re.search(r"\b(port|harbour|harbor|ferry|quay|berth|vts|pilotage|dock)\b", hay):
        return "harbour"
    return None


def match_iata(title: str) -> Optional[Dict[str, object]]:
    for match in re.finditer(r"\b([A-Z]{3})\b", title):
        code = match.group(1)
        for airport in AIRPORTS:
            if airport.get("iata") == code:
                return airport
    return None


def fuzzy_match(name: str, candidates: List[Dict[str, object]], key: str = "name", threshold: int = 82) -> Optional[Dict[str, object]]:
    best = None
    score = threshold
    needle = name.lower()
    for candidate in candidates:
        target = str(candidate.get(key, "")).lower()
        val = fuzz.partial_ratio(needle, target)
        if val >= score:
            best = candidate
            score = val
    return best


def resolve_asset(article: Dict[str, str], kind: str) -> Optional[Dict[str, object]]:
    title = article.get("title", "")
    if kind == "airport":
        exact = match_iata(title)
        if exact:
            return exact
        fuzzy = fuzzy_match(title, AIRPORTS, "name")
        if fuzzy:
            return fuzzy
    elif kind == "harbour":
        return fuzzy_match(title, HARBOURS, "name")
    return None


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def evidence_strength(sources: List[Dict[str, str]]) -> int:
    if not sources:
        return 0
    pubs = " ".join((src.get("publisher", "") or "").lower() for src in sources)
    tier_one = ["reuters", "associated press", "ap", "afp", "ansa", "bbc", "dr", "nrk", "lsm", "pap", "nyt"]
    if any(pub in pubs for pub in tier_one):
        return 2
    return 1


def severity_score(asset_type: str, category: str, duration_min: Optional[int]) -> int:
    base = {"closure": 3, "diversion": 3, "lockdown": 2, "sighting": 1, "navwarn": 1}.get(category, 1)
    duration_bonus = 0 if not duration_min else min(2.0, duration_min / 120.0)
    asset_weight = 1.5 if asset_type == "airport" else 1.0
    raw = base + duration_bonus + asset_weight
    return max(1, min(5, int(round(raw))))


# ---------------------------------------------------------------------------
# Processing
# ---------------------------------------------------------------------------

def build_incident(article: Dict[str, str]) -> Optional[Dict[str, object]]:
    asset_type = detect_asset_type(article["title"], article["title"])
    if not asset_type:
        return None
    asset = resolve_asset(article, asset_type)
    if not asset:
        return None

    sources = [{
        "url": article.get("url", ""),
        "publisher": article.get("publisher", ""),
        "lang": article.get("lang"),
        "first_seen": article.get("datetime"),
    }]
    strength = evidence_strength(sources)
    severity = severity_score(asset_type, "sighting", None)

    uid = f"{asset_type}-{slug(str(asset.get('name', 'unknown')))}-{int(time.time())}"

    return {
        "id": uid,
        "first_seen_utc": utcnow_iso(),
        "last_update_utc": utcnow_iso(),
        "asset": {
            "type": asset_type,
            "name": asset.get("name"),
            "iata": asset.get("iata"),
            "icao": asset.get("icao"),
            "osm_id": asset.get("osm_id"),
            "lat": asset.get("lat"),
            "lon": asset.get("lon"),
        },
        "incident": {
            "category": "sighting",
            "status": "unconfirmed",
            "duration_min": None,
            "uav_count": None,
            "uav_characteristics": None,
            "response": [],
            "narrative": article.get("title"),
        },
        "evidence": {
            "strength": strength,
            "attribution": "none",
            "sources": sources,
            "notam_navtex_ids": [],
        },
        "scores": {
            "severity": severity,
            "risk_radius_m": 1000,
        },
        "tags": [],
    }


def dedupe_incidents(incidents: List[Dict[str, object]]) -> List[Dict[str, object]]:
    results: List[Dict[str, object]] = []
    seen: Dict[Tuple[str, str], Dict[str, object]] = {}
    for incident in incidents:
        key = (incident["asset"]["type"], incident["asset"]["name"])
        existing = seen.get(key)
        if not existing:
            seen[key] = incident
            results.append(incident)
            continue
        similarity = fuzz.partial_ratio(
            (incident["incident"]["narrative"] or "").lower(),
            (existing["incident"]["narrative"] or "").lower(),
        )
        if similarity >= 70:
            existing["last_update_utc"] = incident["last_update_utc"]
            existing["evidence"]["strength"] = max(existing["evidence"]["strength"], incident["evidence"]["strength"])
            existing["evidence"]["sources"].extend(incident["evidence"]["sources"])
        else:
            results.append(incident)
    return results


def merge_with_existing(new_incidents: List[Dict[str, object]]) -> List[Dict[str, object]]:
    path = PUBLIC_DIR / "incidents.json"
    if not path.exists():
        return new_incidents
    try:
        existing_doc = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"[warn] failed to parse existing incidents.json: {exc}", file=sys.stderr)
        return new_incidents

    existing = existing_doc.get("incidents", [])
    combined = existing[:]
    for incident in new_incidents:
        matched = False
        for current in combined:
            if current["asset"]["type"] != incident["asset"]["type"]:
                continue
            if current["asset"]["name"] != incident["asset"]["name"]:
                continue
            similarity = fuzz.partial_ratio(
                (current["incident"]["narrative"] or "").lower(),
                (incident["incident"]["narrative"] or "").lower(),
            )
            if similarity >= 70:
                current["last_update_utc"] = incident["last_update_utc"]
                current["evidence"]["strength"] = max(current["evidence"]["strength"], incident["evidence"]["strength"])
                current["evidence"]["sources"].extend(incident["evidence"]["sources"])
                matched = True
                break
        if not matched:
            combined.append(incident)
    return combined


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    candidates = fetch_gdelt(90) + fetch_rss()
    print(f"[info] fetched {len(candidates)} candidate reports")
    incidents: List[Dict[str, object]] = []
    for article in candidates:
        incident = build_incident(article)
        if incident:
            incidents.append(incident)
    incidents = dedupe_incidents(incidents)
    merged = merge_with_existing(incidents)
    payload = {
        "generated_utc": utcnow_iso(),
        "incidents": merged,
    }
    out_path = PUBLIC_DIR / "incidents.json"
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[info] wrote {out_path} ({len(merged)} incidents)")


if __name__ == "__main__":
    main()
