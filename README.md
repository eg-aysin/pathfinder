# Pathfinder — MSS Import Integration Hub

A Next.js 16 application demonstrating a real-time data integration pipeline for energy management systems. Pathfinder orchestrates imports from Salesforce and RecordBox, merging facility contracts with meter readings into unified output.

## Features

- **Live Architecture Diagram** — Real-time animated flow visualization showing data movement between systems
- **Multi-Facility Import** — Add multiple facilities at once (comma-separated or paste a list), all processed in parallel
- **Live Search & Filter** — Search merged results across all columns (facility names, sales items, subscription IDs, etc.)
- **Expandable Process Logs** — Per-facility step logs showing exactly what Pathfinder is doing
- **Modern UI** — Netflix-inspired dark theme with blue/black color scheme, smooth animations, and responsive design

## Architecture

```
Enerkey (Client)
     ↓
Pathfinder (Integration Hub)
     ├→ Salesforce (file1.xlsx: Sales Items, Contracts)
     └→ RecordBox (file2.xlsx: NetSuite Subscriptions)
     ↓
Output (output.xlsx: Merged Records)
```

**Processing flow:**
1. User submits one or more facility names in Enerkey
2. Pathfinder spawns parallel requests to Salesforce and RecordBox
3. Both sources return their data (~2-3s each)
4. Pathfinder joins on Facility name + Sales Items ID
5. Merged output is displayed in Enerkey and available in Pathfinder dashboard

## Data Schema

### file1.xlsx (Salesforce)
Facility name | Sales Items ID | Sales item display name | Start date | Currency | Quantity | Rate

### file2.xlsx (RecordBox)
Facility name | Sales Items ID | NetSuite account | Subscription ID | Subscription item ID

### output.xlsx (Merged)
All 10 columns above, joined on Facility name + Sales Items ID

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/eg-aysin/pathfinder.git
cd pathfinder
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Pages:**
- `/` — Live architecture overview with animated flow diagram
- `/enerkey` — MSS import interface (add facilities, view results)
- `/pathfinder` — Integration hub dashboard (request queue, step timeline, merged data)
- `/salesforce` — Salesforce blackbox (request log, mock schema)
- `/recordbox` — RecordBox blackbox (request log, mock schema)

### Build

```bash
npm run build
npm start
```

## Usage Example

1. **Navigate to `/enerkey`**
2. **Add facilities:**
   - Type: `AsOy Kotikontu 10`
   - Press `Enter` or `,` to add
   - Add more: `Green Valley Apartments, Sunrise Residency`
3. **Click "Start MSS Import"**
4. Watch the animation on `/` to see real-time flow
5. View per-facility progress logs (click to expand)
6. Once complete, search the merged results table

**Known facilities (pre-loaded data):**
- AsOy Kotikontu 10
- Green Valley Apartments
- Sunrise Residency
- Lakeview Towers

(Any other name falls back to demo data)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Components:** shadcn/ui (Button, Card, Badge, Input, Label)
- **Styling:** Tailwind CSS 3.4 + custom animations
- **Icons:** Lucide React
- **State Management:** React hooks + in-memory store
- **Hosting Ready:** Vercel, AWS Amplify, or any Node.js host

## Project Structure

```
pathfinder/
├── app/
│   ├── page.js              # Architecture overview with live diagram
│   ├── enerkey/page.js      # MSS import (multi-facility, search)
│   ├── pathfinder/page.js   # Integration dashboard
│   ├── salesforce/page.js   # Salesforce blackbox
│   ├── recordbox/page.js    # RecordBox blackbox
│   ├── api/
│   │   ├── process/         # POST: start new import
│   │   ├── status/[id]/     # GET: poll import status
│   │   ├── requests/        # GET: all processes
│   │   ├── salesforce/      # GET: SF request log
│   │   └── recordbox/       # GET: RB request log
│   ├── globals.css          # Global styles + animations
│   └── layout.js            # Root layout
├── components/
│   ├── Navbar.js            # Navigation bar
│   └── ui/                  # shadcn components
├── lib/
│   ├── store.js             # In-memory data store + simulation
│   └── utils.js             # Utility functions
└── package.json
```

## How It Works

### In-Memory Data Store
The app uses an in-memory `store.js` that simulates API calls with realistic timing:
- `createProcess(facilityName)` — Starts a new import request
- Data flows step-by-step with 900ms–5100ms total duration
- All requests persist in a Map for the lifetime of the dev server

### API Routes
- `POST /api/process` — Accepts facility name, returns process ID
- `GET /api/status/[id]` — Returns real-time process data (steps, merged output)
- `GET /api/requests` — Returns all processes for the Pathfinder dashboard
- `GET /api/salesforce` — Mock Salesforce request log
- `GET /api/recordbox` — Mock RecordBox request log

### Frontend Polling
Enerkey and Pathfinder poll the API every 500ms during active imports, showing live progress updates.

## Animations & Design

- **Flow diagram** — SVG lines animate left/right as data flows
- **Glowing cards** — Cards pulse when active or complete
- **Chips** — Facility tags with hover effects
- **Tables** — Rows fade in with staggered delay
- **Progress bars** — Smooth width transitions with gradient backgrounds
- **Color scheme** — Dark navy (#04040e) + electric blue (#3b82f6) for Pathfinder, with accent colors for each source (violet for Salesforce, emerald for RecordBox)

## Notes

- This is a **demo/presentation app** — the blackbox services (Salesforce, RecordBox) are mocked. In production, you'd replace API calls in `lib/store.js` with real HTTP requests.
- Data is **not persisted** — refreshing the page clears all imports. Use a database (PostgreSQL, MongoDB) for persistence.
- The app runs in **Node.js runtime** for the API routes. Vercel serverless is fully supported.

## Demo Facilities

Pre-loaded with real data matching your Excel files:

| Facility | Currency | Sales Items |
|----------|----------|-------------|
| AsOy Kotikontu 10 | EUR | 6 items |
| Green Valley Apartments | USD | 6 items |
| Sunrise Residency | GBP | 6 items |
| Lakeview Towers | EUR | 6 items |

Each facility × sales item pair is merged with its NetSuite subscription data.

## Future Enhancements

- [ ] Real database backend (PostgreSQL)
- [ ] Authentication (NextAuth.js, Clerk)
- [ ] Export to Excel/CSV
- [ ] Webhook notifications on import completion
- [ ] Bulk import from CSV
- [ ] Data validation rules
- [ ] Error retry logic with exponential backoff

## License

MIT

## Author

Built with [Claude](https://claude.ai) for the Friday presentation (20 March 2026).

---

**Live Demo:** https://github.com/eg-aysin/pathfinder
