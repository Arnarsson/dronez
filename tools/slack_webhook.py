#!/usr/bin/env python3
"""
Slack webhook for high-evidence drone incidents
Sends notifications for evidence >= 2 or active status incidents
"""

import json
import sys
import os
import requests
from datetime import datetime, timezone

def send_slack_alert(incidents, webhook_url):
    """Send Slack notification for high-priority incidents"""

    if not webhook_url:
        print("No Slack webhook URL configured")
        return

    # Filter for high-evidence or active incidents
    alert_incidents = []
    for incident in incidents:
        evidence = incident.get('evidence', {}).get('strength', 0)
        status = incident.get('incident', {}).get('status', '')

        if evidence >= 2 or status == 'active':
            alert_incidents.append(incident)

    if not alert_incidents:
        print("No high-priority incidents to alert")
        return

    # Build Slack message
    blocks = []

    # Header
    blocks.append({
        "type": "header",
        "text": {
            "type": "plain_text",
            "text": f"🚨 Drone Incident Alert ({len(alert_incidents)} incidents)"
        }
    })

    # Context
    blocks.append({
        "type": "context",
        "elements": [
            {
                "type": "mrkdwn",
                "text": f"Europe-wide monitoring • Generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}"
            }
        ]
    })

    # Process each incident
    for incident in alert_incidents[:5]:  # Limit to 5 incidents per alert
        asset = incident['asset']
        inc_data = incident['incident']
        evidence = incident['evidence']
        scores = incident['scores']

        # Status emoji
        status_emoji = "🔴" if inc_data['status'] == 'active' else "🟡"
        evidence_emoji = "🔒" if evidence['strength'] >= 3 else "⚠️" if evidence['strength'] >= 2 else "❓"

        # Asset type emoji
        asset_emoji = {
            'airport': '✈️',
            'harbour': '🚢',
            'energy': '⚡',
            'rail': '🚂',
            'border': '🛂',
            'military': '🛡️'
        }.get(asset['type'], '📍')

        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*{asset_emoji} {asset['name']}*\n"
                       f"{status_emoji} Status: *{inc_data['status'].upper()}* | "
                       f"{evidence_emoji} Evidence: *{evidence['strength']}/3* | "
                       f"Severity: *{scores['severity']}/5*\n"
                       f"_{inc_data['narrative'] or 'No additional details'}_"
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "View Details"
                },
                "url": f"https://dronez.vercel.app/?lat={asset['lat']:.4f}&lng={asset['lon']:.4f}&zoom=10",
                "action_id": "view_incident"
            }
        })

        # Sources context
        sources = evidence.get('sources', [])
        source_text = " • ".join([src.get('publisher', 'Unknown') for src in sources[:3]])
        if source_text:
            blocks.append({
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Sources: {source_text}"
                    }
                ]
            })

    if len(alert_incidents) > 5:
        blocks.append({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"... and {len(alert_incidents) - 5} more incidents"
                }
            ]
        })

    # Footer with dashboard link
    blocks.append({
        "type": "actions",
        "elements": [
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Open Dashboard"
                },
                "url": "https://dronez.vercel.app/",
                "style": "primary",
                "action_id": "open_dashboard"
            }
        ]
    })

    # Send to Slack
    payload = {
        "blocks": blocks
    }

    try:
        response = requests.post(webhook_url, json=payload, timeout=10)
        response.raise_for_status()
        print(f"✅ Sent Slack alert for {len(alert_incidents)} incidents")
    except Exception as e:
        print(f"❌ Failed to send Slack alert: {e}")

def main():
    webhook_url = os.environ.get('SLACK_WEBHOOK_URL')

    if len(sys.argv) < 2:
        print("Usage: python slack_webhook.py incidents.json")
        sys.exit(1)

    try:
        with open(sys.argv[1], 'r') as f:
            data = json.load(f)

        incidents = data.get('incidents', [])
        send_slack_alert(incidents, webhook_url)

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()