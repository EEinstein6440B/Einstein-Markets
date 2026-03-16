# Einstein Markets v2.0

A mobile-first PWA financial dashboard for intelligent investing. Real-time stock quotes, AI-powered analysis, and comprehensive market intelligence.

## Features

### Core Functionality
- **Briefing-first layout** - Daily market briefing as the main tab with curated watchlist insights
- **All tickers clickable** - Tap any ticker to open detail overlay with investment analysis
- **Detail view** - Price hero, stats grid (open/high/low/prev close), investment thesis, AI analysis, and latest news
- **Market pulse strip** - Scrollable strip showing key indices (SPY, QQQ, VIX), commodities (Gold, Oil), and crypto (BTC)
- **Big mover alerts** - Any watchlist stock moving 3%+ gets highlighted
- **Market mood banner** - Real-time market sentiment from briefing.json
- **"What to Watch" box** - AI-generated insights based on VIX levels, oil prices, and biggest movers
- **Three briefing sections** - AI Infrastructure (Core 5 + Radar), Energy & Commodities + Crypto, Macro & Geopolitical
- **Tickers tab** - Full grid view of all watchlist and market indices
- **Settings tab** - API key management
- **PWA features** - Installable, service worker, offline support

### Watchlist

**AI Infrastructure - Core 5:**
- NVDA (Nvidia/GPU King)
- MU (Micron/HBM Memory)
- DELL (Dell/AI Servers)
- AMD (AMD/Inference Play)
- TSM (TSMC/The Foundry)

**AI Infrastructure - Radar:**
- AVGO (Broadcom/Custom ASICs)
- VRT (Vertiv/Power & Cooling)
- MRVL (Marvell/Custom Silicon)
- ANET (Arista/AI Networking)
- CLS (Celestica/AI Hardware)

**Energy & Commodities:**
- XOM (Exxon Mobil)
- CVX (Chevron)

**Crypto:**
- BTC (Bitcoin)
- ETH (Ethereum)

**Market Indices:**
- SPY (S&P 500)
- QQQ (NASDAQ)
- UVXY (VIX Volatility)

## Data Sources

- **Finnhub.io** - Stock quotes, company news, analyst recommendations (requires API key)
- **CoinGecko** - Cryptocurrency prices (BTC, ETH)
- **data/briefing.json** - AI-generated analysis and signals

## Setup

### Installation

1. Clone or download this repository
2. Install dependencies (for briefing generation):
   ```bash
   npm install
   ```

3. Set up Finnhub API key:
   - Get a free API key from [finnhub.io](https://finnhub.io)
   - In the app, go to Settings tab and paste your API key
   - The key is stored in localStorage and used for all live market data

### Local Development

Serve the app on localhost:
```bash
npx http-server
```

Open `http://localhost:8080` in your browser.

### Configuration

**API Keys:**
- Store Finnhub API key via the Settings tab in the app (saved to `fh_key` in localStorage)

**GitHub Actions:**
To enable automatic briefing generation at 6 AM and 4 PM ET:
1. Add `FINNHUB_API_KEY` as a repository secret
2. The workflow will run Monday-Friday and commit updates to `data/briefing.json`

## Briefing Generation

The `scripts/generate-briefing.js` script:
- Fetches real-time stock quotes from Finnhub
- Retrieves analyst recommendations
- Gets cryptocurrency prices from CoinGecko
- Generates per-ticker signals (Strong Buy, Buy, Neutral, Caution, Bearish)
- Creates consensus bars showing buy/hold/sell ratings
- Produces market mood sentiment

Run manually:
```bash
FINNHUB_API_KEY=your_key npm run generate-briefing
```

## Design

- **Dark mode** - Professional dark background (#0a0e17) with high contrast
- **Fonts** - Inter (UI), JetBrains Mono (numbers), Newsreader (headlines & analysis)
- **Colors** - Green (#22c55e) for up, Red (#ef4444) for down, Blue (#3b82f6) for accents
- **News tags** - Categorized by Geopolitical, AI/Tech, Energy, Crypto, Fed/Rates, Earnings
- **Signal colors** - Strong Buy (green), Buy (light green), Neutral (gray), Caution (gold), Bearish (red)
- **Animations** - Smooth slide-in for detail overlay, pulsing signal indicators

## Mobile-First

- Responsive grid layouts
- Touch-friendly tap targets
- Smooth scrolling
- Optimized for small screens with sidebar detail view

## PWA Features

- **Service Worker** - Offline support and asset caching
- **Manifest** - Installable on home screen
- **Icons** - 192x192 and 512x512 PNG assets with maskable support
- **Standalone** - Runs as standalone app without browser UI

## File Structure

```
einstein-markets-v2/
├── index.html              # Main PWA app (all CSS & JS embedded)
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── package.json            # Node dependencies
├── README.md               # This file
├── .gitignore
├── .github/
│   └── workflows/
│       └── market-briefing.yml  # GitHub Actions workflow
├── scripts/
│   └── generate-briefing.js     # Briefing generation script
├── data/
│   └── briefing.json       # AI analysis per ticker
└── assets/
    ├── icon-192.png        # App icon (192x192)
    └── icon-512.png        # App icon (512x512)
```

## Browser Support

- iOS Safari 11.3+
- Chrome/Edge 40+
- Firefox 67+
- Samsung Internet 5+

## Investment Theses

Each ticker in the watchlist has a detailed investment thesis explaining:
- Core competitive advantage
- Revenue drivers and growth
- Risk factors
- Valuation context

See theses for NVDA, MU, DELL, AMD, TSM, AVGO, VRT, MRVL, ANET, CLS, XOM, CVX, BTC, and ETH embedded in the app.

## Version

Einstein Markets v2.0 - Last updated March 2026

## License

MIT
