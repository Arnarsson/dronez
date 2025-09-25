# 🚁 Drone Sightings — Feature Overview

## ✅ Quick Wins Implemented

### 1. **Permalink State & Sharing** 📎
- **Full state preservation** in URLs: filters, time windows, layers, map view, search terms
- **One-click sharing** with copy-to-clipboard button
- **Automatic state restoration** when loading shared links
- **Real-time URL updates** as users interact with the interface

*Example URL:* `?days=30&layers=airport&layers=harbour&status=active&evidence=2&risks=1&lat=55.7&lng=12.6&zoom=8`

### 2. **Risk Rings** 🎯
- **Dynamic operational zones** around critical infrastructure
- **Asset-specific radii**: Airports (2km/5km), Harbours (1km/3km), Energy (1.5km/4km)
- **Color-coded by asset type** with transparency for clear visualization
- **Toggle control** with persistent state
- **Tooltips** showing zone classifications and distances

### 3. **Provenance Pane** 📋
- **Comprehensive incident analysis** showing decision logic
- **Source credibility indicators** (Reuters/AP highlighted as tier-1)
- **Evidence strength explanation** (0-3 scale with clear criteria)
- **Response timeline** with key timestamps
- **Asset details** including coordinates, risk radius, identifiers
- **Accessible from both map markers and incident cards**

### 4. **Compare Mode** 📊
- **Temporal analysis**: Current period vs Previous period
- **Visual differentiation**: Solid markers for current, dashed for previous
- **Split statistics** showing trend comparisons
- **Separate incident lists** with clear period indicators
- **Time-based filtering** maintaining all other filter criteria

### 5. **Slack Integration** 🔔
- **Automated alerts** for evidence ≥2 or active status incidents
- **Rich message format** with asset emojis, status indicators, severity levels
- **Direct links** to dashboard with incident context
- **Source attribution** for credibility
- **Configurable via GitHub Secrets** (`SLACK_WEBHOOK_URL`)

## 🎯 Key Operational Improvements

### **Enhanced NO DATA Handling**
- **Multi-layer indicators**: Header badge, map overlay, center screen message
- **Smart differentiation**: "NO DATA" vs "NO MATCHES"
- **Contextual guidance** for filter adjustments
- **Professional messaging** for Europe-wide monitoring context

### **Advanced UI/UX**
- **Modern dark theme** with operational color scheme
- **Responsive design** with mobile breakpoints
- **Accessibility features** with ARIA labels and keyboard navigation
- **Professional typography** with proper spacing and hierarchy

### **Data Quality & Trust**
- **Evidence-based filtering** with strength indicators
- **Source attribution** with publisher credibility ranking
- **Decision factor transparency** in provenance system
- **Official source prioritization** (NOTAM/NAVTEX ready)

## 🛠 Technical Architecture

### **Frontend Features**
- **State management** via URL parameters and local state
- **Leaflet clustering** with custom markers and risk visualization
- **Real-time updates** every 5 minutes
- **Modal system** for detailed information display
- **Event handling** for complex interactions

### **Backend Integration**
- **GitHub Actions** hourly ingestion pipeline
- **Slack webhook** notifications
- **Static deployment** ready for Vercel/Netlify
- **JSON data format** with comprehensive schema

### **Performance Optimizations**
- **Marker clustering** at appropriate zoom levels
- **Lazy loading** of detailed information
- **Efficient filtering** with indexed search
- **State persistence** without database requirements

## 📈 30-60-90 Roadmap Progress

### ✅ **Days 1-30 (COMPLETED)**
- [x] Permalinks with full state preservation
- [x] Risk rings with operational zones
- [x] Compare mode for temporal analysis
- [x] Provenance drawer with decision logic
- [x] Slack webhook for evidence ≥2 incidents

### 🚧 **Days 31-60 (Next Sprint)**
- [ ] Text clustering for de-duplication (embeddings)
- [ ] Anomaly detection & "Active now" auto-pulse
- [ ] Moderation queue + notes system
- [ ] STIX 2.1 export for intel sharing
- [ ] Energy & Rail asset layers

### 🎯 **Days 61-90 (Scale Phase)**
- [ ] NOTAM/NAVTEX integration for evidence=3
- [ ] Public API & embeddable widgets
- [ ] i18n support (EN + DA/NO/PL)
- [ ] Accessibility compliance (WCAG 2.1)
- [ ] Automated testing & performance budgets

## 🌍 Operational Impact

### **For Analysts**
- **Shareable intelligence** with permalink system
- **Historical comparison** for trend analysis
- **Source verification** through provenance system
- **Risk assessment** with operational zone visualization

### **For Decision Makers**
- **Real-time alerts** via Slack integration
- **Executive dashboards** with key metrics
- **Credible information** with evidence-based filtering
- **Actionable intelligence** with asset-specific details

### **For Partners**
- **Standardized data** ready for intel sharing
- **API integration** capabilities
- **Embeddable widgets** for organizational dashboards
- **Multi-language support** for European partners

## 🔒 Trust & Governance

### **Evidence Framework**
- **Level 3**: Official/NOTAM/NAVTEX confirmation
- **Level 2**: Multiple credible sources
- **Level 1**: Single credible source verification
- **Level 0**: Unverified (hidden by default)

### **Source Credibility**
- **Tier 1**: Reuters, AP, BBC, national broadcasters
- **Tier 2**: Regional outlets with track record
- **Tier 3**: Local sources requiring verification
- **Allowlist approach** to prevent spam/brigading

### **Data Provenance**
- **Full audit trail** for each incident
- **Source timeline** with first detection
- **Decision logic transparency**
- **Manual moderation** capabilities ready

---

**Next Steps**: The foundation is solid. Ready to scale to full European coverage with hourly updates, advanced analytics, and operational partnerships.

*Generated: 2025-09-25 | Version: 2.0-alpha*