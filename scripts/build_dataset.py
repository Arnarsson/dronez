#!/usr/bin/env python3
"""Build processed incident datasets for the Drone Sightings app.

Reads a manually curated CSV (see data/raw/incidents_manual.csv), computes derived
metrics (duration, severity, evidence labels), filters to the last N days, and
writes processed CSV/JSON/GeoJSON artefacts consumed by the web app or other
analytical tooling.
"""
from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable, List, Sequence

# ---------------------------------------------------------------------------
# Configuration helpers
# ---------------------------------------------------------------------------

ISO_FORMAT = "%Y-%m-%dT%H:%M:%SZ"


@dataclass
class Incident:
    id: str
    date_start_utc: datetime
    date_end_utc: datetime
    country: str
    airport_name: str
    iata: str
    icao: str
    lat: float
    lon: float
    airport_category: str
    incident_type: str
    uav_count: int | None
    uav_characteristics: str | None
    response: str | None
    source_primary_url: str | None
    source_secondary_url: str | None
    evidence_strength: int
    attribution: str | None
    notes: str | None
    duration_min: int
    severity: int
    severity_label: str

    @property
    def duration_hours(self) -> float:
        return round(self.duration_min / 60.0, 2)

    @property
    def status_display(self) -> str:
        mapping = {
            "closure": "Closure",
            "diversion": "Diversion",
            "lockdown": "Lockdown",
            "sighting": "Sighting",
        }
        return mapping.get(self.incident_type, self.incident_type.title())

    def to_feature(self) -> dict:
        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [self.lon, self.lat],
            },
            "properties": {
                **asdict(self),
                "date_start_utc": self.date_start_utc.strftime(ISO_FORMAT),
                "date_end_utc": self.date_end_utc.strftime(ISO_FORMAT),
                "duration_hours": self.duration_hours,
                "status_display": self.status_display,
            },
        }

    def to_row(self) -> dict:
        row = {
            **asdict(self),
            "date_start_utc": self.date_start_utc.strftime(ISO_FORMAT),
            "date_end_utc": self.date_end_utc.strftime(ISO_FORMAT),
            "duration_hours": self.duration_hours,
            "status_display": self.status_display,
        }
        return row


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------


def parse_datetime(value: str) -> datetime:
    value = value.strip()
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def parse_int(value: str | None) -> int | None:
    if value is None:
        return None
    value = value.strip()
    if not value:
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def compute_duration_minutes(start: datetime, end: datetime, fallback_minutes: int | None = None) -> int:
    diff = int((end - start).total_seconds() // 60)
    if diff <= 0 and fallback_minutes is not None:
        return fallback_minutes
    return max(diff, 1)


def severity_from_row(row: dict, duration_min: int) -> int:
    incident_type = row["incident_type"].strip().lower()
    airport_category = row.get("airport_category", "").strip().lower()

    base = {
        "closure": 3,
        "diversion": 3,
        "lockdown": 2,
        "sighting": 1,
    }.get(incident_type, 2)

    # Airport traffic weighting: primary > regional > military > other
    category_weight = {
        "primary": 1.1,
        "regional": 1.0,
        "military": 0.9,
    }.get(airport_category, 1.0)

    # Duration weight: longer closures matter more (cap at +2 severity)
    duration_weight = min(duration_min / 60.0, 2.0)

    computed = base * category_weight + duration_weight
    severity = max(1, min(5, round(computed)))
    return severity


def severity_label(score: int) -> str:
    if score >= 4:
        return "high"
    if score == 3:
        return "medium"
    return "low"


def load_incidents(path: Path) -> List[Incident]:
    incidents: List[Incident] = []
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            start = parse_datetime(row["date_start_utc"])
            end = parse_datetime(row["date_end_utc"])
            duration_min = compute_duration_minutes(start, end)
            severity = severity_from_row(row, duration_min)
            incidents.append(
                Incident(
                    id=row["id"].strip(),
                    date_start_utc=start,
                    date_end_utc=end,
                    country=row["country"].strip(),
                    airport_name=row["airport_name"].strip(),
                    iata=row.get("iata", "").strip(),
                    icao=row.get("icao", "").strip(),
                    lat=float(row["lat"]),
                    lon=float(row["lon"]),
                    airport_category=row.get("airport_category", "").strip(),
                    incident_type=row["incident_type"].strip().lower(),
                    uav_count=parse_int(row.get("uav_count")),
                    uav_characteristics=row.get("uav_characteristics") or None,
                    response=row.get("response") or None,
                    source_primary_url=row.get("source_primary_url") or None,
                    source_secondary_url=row.get("source_secondary_url") or None,
                    evidence_strength=int(row.get("evidence_strength", 0) or 0),
                    attribution=row.get("attribution") or None,
                    notes=row.get("notes") or None,
                    duration_min=duration_min,
                    severity=severity,
                    severity_label=severity_label(severity),
                )
            )
    incidents.sort(key=lambda inc: inc.date_start_utc, reverse=True)
    return incidents


def filter_incidents(incidents: Sequence[Incident], as_of: datetime, days: int) -> List[Incident]:
    cutoff = as_of - timedelta(days=days)
    return [inc for inc in incidents if inc.date_start_utc >= cutoff]


def write_csv(path: Path, incidents: Iterable[Incident]) -> None:
    incidents = list(incidents)
    if not incidents:
        return
    fieldnames = list(incidents[0].to_row().keys())
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for incident in incidents:
            writer.writerow(incident.to_row())


def write_json(path: Path, incidents: Iterable[Incident]) -> None:
    payload = [inc.to_row() for inc in incidents]
    with path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)


def write_geojson(path: Path, incidents: Iterable[Incident]) -> None:
    features = [inc.to_feature() for inc in incidents]
    collection = {"type": "FeatureCollection", "features": features}
    with path.open("w", encoding="utf-8") as fh:
        json.dump(collection, fh, ensure_ascii=False, indent=2)


def summarise(incidents: Sequence[Incident], as_of: datetime) -> dict:
    total = len(incidents)
    countries = sorted({inc.country for inc in incidents})
    closures = sum(1 for inc in incidents if inc.incident_type in {"closure", "diversion", "lockdown"})
    avg_duration = round(sum(inc.duration_min for inc in incidents) / total, 1) if total else 0
    return {
        "generated_at": as_of.strftime(ISO_FORMAT),
        "total_incidents": total,
        "countries": countries,
        "closure_like_incidents": closures,
        "avg_duration_min": avg_duration,
    }


def write_summary(path: Path, incidents: Sequence[Incident], as_of: datetime) -> None:
    summary = summarise(incidents, as_of)
    with path.open("w", encoding="utf-8") as fh:
        json.dump(summary, fh, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def build_dataset(raw_csv: Path, output_dir: Path, days: int, as_of: datetime) -> None:
    incidents = load_incidents(raw_csv)
    filtered = filter_incidents(incidents, as_of=as_of, days=days)

    output_dir.mkdir(parents=True, exist_ok=True)

    write_csv(output_dir / "incidents_last365.csv", filtered)
    write_json(output_dir / "incidents_last365.json", filtered)
    write_geojson(output_dir / "incidents_last365.geojson", filtered)
    write_summary(output_dir / "incidents_summary.json", filtered, as_of)

    print(f"Generated {len(filtered)} incidents covering the last {days} days.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build processed Drone Sightings datasets.")
    parser.add_argument("--raw-csv", type=Path, default=Path("data/raw/incidents_manual.csv"),
                        help="Path to the manually curated incidents CSV.")
    parser.add_argument("--output-dir", type=Path, default=Path("data/processed"),
                        help="Directory to write processed artefacts into.")
    parser.add_argument("--days", type=int, default=365,
                        help="Number of trailing days to include.")
    parser.add_argument("--as-of", type=str,
                        help="Override the as-of date (UTC) in ISO format, e.g. 2025-09-25T00:00:00Z")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.as_of:
        as_of = parse_datetime(args.as_of)
    else:
        as_of = datetime.now(timezone.utc)

    build_dataset(args.raw_csv, args.output_dir, args.days, as_of=as_of)


if __name__ == "__main__":
    main()
