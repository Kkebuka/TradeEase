# TradeEase

TradeEase is a mobile-first React + Vite PWA for Nigerian traders.  
It combines three tools in one app:

- Import Calculator
- Invoice Generator
- Oni Gbese Debt Ledger

The app is offline-capable, local-first (no backend required), and optimized for phone usage.

## Stack

- React 18
- Vite 5
- `vite-plugin-pwa`
- `jspdf` + `jspdf-autotable`
- LocalStorage for persistence

## Core Features

### 1. Import Calculator

- Multi-step landed cost flow
- Shared container constants:
  - Dollar rate
  - Freight cost
  - Clearing fee
  - Container CBM
- Product-level cost calculation:
  - Cost per piece
  - Cost per carton
  - Selling price and profit estimator
- PDF export with shipment summary and totals

### 2. Invoice Generator

- Business profile setup
- Dynamic line items (up to 20)
- POS-style receipt PDF + detailed invoice PDF
- Invoice history with delete flow
- Strict sequential invoice number format (`INV-0001`, `INV-0002`, ...)

### 3. Oni Gbese Ledger

- Debtor list, outstanding summary, and progress bars
- Add debt, add more debt, record payments
- WhatsApp statement text export
- Timeline ordered by event sequence
- Default timeline view shows last 5 transactions with expand toggle

## PWA Setup (Hardened)

- Plugin-managed Service Worker registration (`virtual:pwa-register`)
- Workbox caching with:
  - `cleanupOutdatedCaches`
  - `clientsClaim`
  - `skipWaiting`
  - runtime `NetworkFirst` cache for dollar-rate API
- Manifest configured for installability
- Icons include both SVG and PNG for broad compatibility:
  - `public/assets/icons/icon-192.png`
  - `public/assets/icons/icon-512.png`
  - `public/assets/icons/icon-192.svg`
  - `public/assets/icons/icon-512.svg`

## LocalStorage Keys

- `tradeease_user`
- `tradeease_dollar_rate`
- `tradeease_sessions`
- `tradeease_business`
- `tradeease_invoices`
- `tradeease_invoice_counter`
- `tradeease_debtors`

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Run in dev

```bash
npm run dev
```

### Build production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Project Structure

```text
src/
  components/     # Reusable UI primitives and shared controls
  pages/          # Home, Converter, Invoice, Ledger, Welcome
  styles/         # main.css, components.css, animations.css
  utils/          # storage, helpers, currency, pdf
```

## Design System Notes

- Theme: Premium warm fintech dark UI
- Typography:
  - `Syne` for branding/headings
  - `DM Sans` for UI and numeric content
- Numeric inputs support comma formatting for readability (`2,000`, `34,567`)
- All destructive actions use modal confirmation (no native `alert/confirm`)

## Deployment

### Push to GitHub

If this folder has no Git repo yet:

```bash
git init
git add .
git commit -m "feat: tradeease v1"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### Static hosting options

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

Any static host that serves the `dist/` folder works.

## Capacitor Commands (Optional)

```bash
npm run cap:sync
npm run cap:android
npm run cap:ios
```

## Notes / Known Constraints

- Data is local-only in V1 (no cloud sync, no auth backend).
- Live dollar rate needs internet; cached/manual fallback works offline.
- PDF rendering depends on bundled fonts and browser PDF behavior.
