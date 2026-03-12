# TradeEase 🇳🇬

> **A mobile-first PWA built for Nigerian traders** — calculate import costs, generate invoices, and track debts, all from your phone, even offline.

---

## What Is TradeEase?

TradeEase is a free, open-source business toolkit designed specifically for small-scale Nigerian importers and traders. No backend, no subscriptions, no internet required after install.

It solves three real problems traders face daily:

| Tool                  | Problem It Solves                                          |
| --------------------- | ---------------------------------------------------------- |
| **Import Calculator** | "How much did this shipment actually cost me per piece?"   |
| **Invoice Generator** | "I need a professional receipt for my customer right now." |
| **Oni Gbese Ledger**  | "Who owes me money and how much in total?"                 |

All data lives on **your device** via LocalStorage. Nothing is sent to any server.

---

## Features

### 📦 Import Calculator

- Multi-step landed cost flow (item cost → freight → clearing → profit)
- Shared container constants: dollar rate, freight, clearing fee, container CBM
- Per-product breakdown: cost per piece, cost per carton, suggested selling price
- PDF export with full shipment summary and totals

### 🧾 Invoice Generator

- Business profile setup (name, address, logo)
- Dynamic line items (up to 20 products per invoice)
- Two PDF formats: POS-style receipt + detailed invoice
- Invoice history with delete flow
- Sequential invoice numbering (`INV-0001`, `INV-0002`, ...)

### 📒 Oni Gbese (Debt Ledger)

- Debtor list with outstanding balances and progress bars
- Add debt, add more debt, record payments — all tracked
- WhatsApp-ready statement text export per debtor
- Full timeline ordered by event sequence
- Compact view (last 5 transactions) with expand toggle

---

## Tech Stack

| Layer          | Technology                                     |
| -------------- | ---------------------------------------------- |
| Frontend       | React 18 + Vite 5                              |
| PWA            | `vite-plugin-pwa` + Workbox                    |
| PDF Generation | `jspdf` + `jspdf-autotable`                    |
| Persistence    | Browser LocalStorage (local-first, no backend) |
| Typography     | `Syne` (headings) + `DM Sans` (UI/numbers)     |

---

## PWA & Offline Support

TradeEase is a fully installable Progressive Web App:

- Works **offline after first load** (Workbox precaching)
- Installable on Android, iOS, and desktop via browser prompt
- Service Worker handles:
  - `cleanupOutdatedCaches` — removes stale caches on update
  - `clientsClaim` + `skipWaiting` — instant activation on install
  - `NetworkFirst` runtime cache for live dollar rate API
- Icons provided in both SVG and PNG (`192×192`, `512×512`)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Clone & Install

```bash
git clone https://github.com/<your-username>/trade-easily.git
cd trade-easily
npm install
```

### Run in Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build Locally

```bash
npm run preview
```

> ⚠️ Always use `npm run preview` (not `npm run dev`) to test PWA and Service Worker behaviour — they do not run in dev mode.

---

## Project Structure

```text
trade-easily/
├── public/
│   └── assets/icons/         # PWA icons (PNG + SVG)
├── src/
│   ├── components/           # Reusable UI primitives and shared controls
│   ├── pages/                # Home, Calculator, Invoice, Ledger, Welcome
│   ├── styles/               # main.css, components.css, animations.css
│   └── utils/                # storage, helpers, currency formatting, pdf
├── vite.config.js            # Vite + PWA plugin config
└── index.html
```

---

## LocalStorage Keys

These are all the keys the app reads/writes to your browser storage:

| Key                         | Purpose                            |
| --------------------------- | ---------------------------------- |
| `tradeease_user`            | User display name                  |
| `tradeease_dollar_rate`     | Cached USD/NGN exchange rate       |
| `tradeease_sessions`        | Import calculator sessions         |
| `tradeease_business`        | Business profile for invoices      |
| `tradeease_invoices`        | All generated invoices             |
| `tradeease_invoice_counter` | Sequential invoice number tracker  |
| `tradeease_debtors`         | Debtor records and payment history |

---

## Deployment

TradeEase is a static app — deploy the `dist/` folder to any static host.

### Recommended Hosts (Free Tier)

| Host                 | Command / Notes                                    |
| -------------------- | -------------------------------------------------- |
| **Netlify**          | Drag & drop `dist/` or connect GitHub repo         |
| **Vercel**           | `vercel --prod` or auto-deploy from GitHub         |
| **GitHub Pages**     | Set build output to `dist/` in workflow            |
| **Cloudflare Pages** | Connect repo, set build command to `npm run build` |

### Push to GitHub First

```bash
git init
git add .
git commit -m "feat: tradeease v1"
git branch -M main
git remote add origin https://github.com/<your-username>/trade-easily.git
git push -u origin main
```

---

## Optional: Native Mobile Build (Capacitor)

To package as a native Android or iOS app:

```bash
npm run cap:sync      # sync web assets to native projects
npm run cap:android   # open Android Studio
npm run cap:ios       # open Xcode
```

---

## Known Limitations (V1)

- **No cloud sync** — data is stored locally only; clearing browser data will erase it
- **No multi-device support** — each device has its own independent data
- **Live dollar rate** requires internet; the app falls back to a cached or manually entered rate when offline
- **PDF rendering** depends on bundled fonts and browser behavior — tested on Chrome/Edge

---

## Contributing

Contributions are welcome! If you're fixing a bug or adding a feature:

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push and open a Pull Request

Please keep the **local-first, no-backend** principle intact.

---

## License

MIT — free to use, fork, and build on.
