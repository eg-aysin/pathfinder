# Pathfinder — MSS Import Integration Hub

A Next.js 16 application demonstrating a real-time data integration pipeline for energy management systems. Pathfinder orchestrates imports from Salesforce and RecordBox, merging facility contracts with NetSuite subscription data into unified output.

## Features

- **Live Architecture Diagram** — Real-time animated flow visualization showing data movement between systems
- **Multi-Facility Import** — Add multiple facilities at once (comma-separated or paste a list), all processed in parallel
- **Live Search & Filter** — Search merged results across all columns (facility names, sales items, subscription IDs, etc.)
- **Excel Export** — Download merged results as a styled `.xlsx` file from Enerkey or Pathfinder dashboard
- **Persistent Request History** — All completed imports saved to `data/history.json` — survives server restarts; filter by facility/date, export as CSV, delete individual entries or clear all
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
6. Completed import is saved to persistent history

## Data Schema

### file1.xlsx (Salesforce)
Facility name | Sales Items ID | Sales item display name | Start date | Currency | Quantity | Rate (Unit price)

### file2.xlsx (RecordBox)
Facility name | Sales Items ID | NetSuite account | NetSuite subscription ID | NetSuite subscription item ID

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
- `/enerkey` — MSS import interface (multi-facility chip input, search, Excel export)
- `/pathfinder` — Integration hub dashboard (request queue, step timeline, merged data, Excel export)
- `/history` — Persistent import history (filter, CSV export, delete)
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
   - Press `Enter` or `,` to add as a chip
   - Paste a list: `Green Valley Apartments, Sunrise Residency, Lakeview Towers`
3. **Click "Start MSS Import"** — all facilities run in parallel
4. Watch the animation on `/` to see real-time flow
5. Click any facility row to expand its step log
6. Once complete, search the merged results table or click **Export .xlsx**
7. View all past imports at `/history`

**Known facilities (pre-loaded data):**
| Facility | Currency | NetSuite Account |
|----------|----------|-----------------|
| AsOy Kotikontu 10 | EUR | Account-1001 |
| Green Valley Apartments | USD | Account-1002 |
| Sunrise Residency | GBP | Account-1003 |
| Lakeview Towers | EUR | Account-1004 |

Each facility has 6 sales items (SalesItem-2001 through SalesItem-2006) merged with its NetSuite subscription data. Any other facility name falls back to demo data.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Components:** shadcn/ui (Button, Card, Badge, Input, Label)
- **Styling:** Tailwind CSS 3.4 + custom CSS animations
- **Icons:** Lucide React
- **Excel Export:** exceljs (server-side, styled output)
- **State Management:** React hooks + in-memory store
- **Persistence:** File-based JSON (`data/history.json`)
- **Hosting Ready:** Vercel, AWS Amplify, or any Node.js host

## Project Structure

```
pathfinder/
├── app/
│   ├── page.js              # Architecture overview with live diagram
│   ├── enerkey/page.js      # MSS import (multi-facility chips, search, export)
│   ├── pathfinder/page.js   # Integration dashboard
│   ├── history/page.js      # Persistent import history
│   ├── salesforce/page.js   # Salesforce blackbox
│   ├── recordbox/page.js    # RecordBox blackbox
│   ├── api/
│   │   ├── process/         # POST: start new import
│   │   ├── status/[id]/     # GET: poll import status
│   │   ├── requests/        # GET: all in-memory processes
│   │   ├── export/[id]/     # GET: download merged .xlsx
│   │   ├── history/         # GET + DELETE: persistent history
│   │   ├── salesforce/      # GET: SF request log
│   │   └── recordbox/       # GET: RB request log
│   ├── globals.css          # Global styles + animations
│   └── layout.js            # Root layout
├── components/
│   ├── Navbar.js            # Navigation bar
│   └── ui/                  # shadcn components (button, card, badge, input, label)
├── lib/
│   ├── store.js             # In-memory process store + simulation
│   ├── history.js           # File-based persistent history (read/write/delete)
│   └── utils.js             # Utility functions
├── data/
│   └── history.json         # Persisted import history (auto-created, gitignored)
└── package.json
```

## How It Works

### In-Memory Process Store
`lib/store.js` simulates the integration pipeline with realistic timing:
- `createProcess(facilityName)` — Starts a new import, runs step-by-step with setTimeout
- Total duration: ~5s (fetching at 900ms, sources respond at 2.4s/2.9s, merge at 3.6s, complete at 5.1s)
- On completion, automatically calls `appendToHistory()` to persist the record

### Persistent History
`lib/history.js` reads/writes `data/history.json` using Node.js `fs`:
- Survives server restarts — history is never lost
- Supports filtering by facility name (partial match) and date range
- `data/history.json` is gitignored so user data is never committed

### Excel Export
`/api/export/[id]` uses `exceljs` server-side:
- Supports comma-joined IDs for multi-facility batch export
- Styled output: frozen header row, auto-filter, alternating row colors
- Filename auto-generated from facility names

### API Routes
- `POST /api/process` — Accepts facility name, returns process ID
- `GET /api/status/[id]` — Returns real-time process data (steps, merged output)
- `GET /api/requests` — Returns all in-memory processes (Pathfinder dashboard)
- `GET /api/export/[id]` — Generates and streams `.xlsx` file
- `GET /api/history` — Returns persisted history with optional filters (`?facility=`, `?from=`, `?to=`, `?stats=true`)
- `DELETE /api/history` — Delete one (`?id=`) or all (`?all=true`) entries
- `GET /api/salesforce` — Mock Salesforce request log
- `GET /api/recordbox` — Mock RecordBox request log

### Frontend Polling
Enerkey and Pathfinder poll the API every 500ms during active imports. The overview diagram polls every 600ms and tracks announced process IDs to avoid repeating the completion banner.

## Animations & Design

- **Flow diagram** — Animated gradient lines show data direction; each system box glows when active
- **Glowing cards** — Cards pulse with blue shadow when processing
- **Chips** — Facility tags with remove button; supports paste of comma-separated lists
- **Tables** — Rows fade in with staggered delay on load
- **Progress bars** — Smooth width transitions, green on completion
- **Color scheme** — Dark navy (`#04040e`) + electric blue (`#3b82f6`) for Pathfinder; violet for Salesforce; emerald for RecordBox; amber for Enerkey

## Notes

- This is a **demo/presentation app** — Salesforce and RecordBox are mocked. In production, replace the `setTimeout` simulation in `lib/store.js` with real HTTP requests to those services.
- In-memory processes clear on server restart; history does not.
- The app runs in **Node.js runtime** (not Edge) to support `fs` for history persistence.

## Future Enhancements

- [ ] Real database backend (PostgreSQL + Prisma)
- [ ] Authentication (NextAuth.js / Clerk)
- [ ] Batch import from CSV file upload
- [ ] Data validation rules with warnings
- [ ] Webhook / Slack notifications on import completion
- [ ] Error retry logic with exponential backoff
- [ ] Virtual scrolling for large result tables

## License

MIT

## Author

Built with [Claude](https://claude.ai) for the Friday presentation (20 March 2026).

---

**Repository:** https://github.com/eg-aysin/pathfinder
