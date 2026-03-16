# Einstein Markets v2.0 - Project Index

Complete PWA financial dashboard with AI-powered analysis for "Einstein" user.

## Quick Links

| What | File | Purpose |
|------|------|---------|
| **Start here** | [QUICKSTART.md](QUICKSTART.md) | 60-second setup guide |
| **Full docs** | [README.md](README.md) | Complete documentation |
| **Deploy** | [DEPLOYMENT.md](DEPLOYMENT.md) | Hosting options & setup |
| **Technical** | [BUILD_SUMMARY.txt](BUILD_SUMMARY.txt) | Technical architecture |

## Project Stats

- **Total Size:** 125 KB
- **HTML/CSS/JS:** 1,480 lines (all in one file)
- **Briefing Script:** 211 lines (Node.js)
- **Service Worker:** 68 lines
- **Configuration:** manifest.json, package.json, .gitignore
- **Assets:** 2 PNG icons (192x192, 512x512)
- **Documentation:** 4 guides + 1 build summary

## File Structure

```
einstein-markets-v2/
├── index.html                  # Main PWA (51 KB)
├── manifest.json               # PWA manifest
├── sw.js                        # Service worker
├── package.json                 # Node config
├── data/
│   └── briefing.json           # AI analysis (generated)
├── scripts/
│   └── generate-briefing.js    # Briefing generator
├── .github/workflows/
│   └── market-briefing.yml     # GitHub Actions
├── assets/
│   ├── icon-192.png            # App icon
│   └── icon-512.png            # App icon
└── Documentation/
    ├── QUICKSTART.md           # Setup guide
    ├── README.md               # Full docs
    ├── DEPLOYMENT.md           # Deployment
    ├── BUILD_SUMMARY.txt       # Technical details
    └── INDEX.md                # This file
```

## Core Features

### Briefing Tab (Default)
- Market pulse strip (6 indicators: SPY, QQQ, UVXY, BTC, Gold, Oil)
- Market mood banner
- "What to Watch" box (AI-generated)
- Three briefing sections:
  - AI Infrastructure (10 tickers)
  - Energy & Commodities + Crypto (4 tickers)
- Big mover highlighting (3%+ moves)
- All tickers clickable

### Tickers Tab
- Full grid of all 14+ tickers
- Click any ticker for details

### Settings Tab
- Finnhub API key input
- Version display (v2.0)

### Detail View
- Price hero (price + 24h change)
- Stats grid (Open/High/Low/Prev Close)
- Investment thesis (unique per ticker)
- AI analysis box (signal + commentary + consensus)
- Latest company news (top 5)

## Watchlist

**14 Tickers + 3 Market Indices = 17 total**

**AI Infrastructure (10):**
- Core 5: NVDA, MU, DELL, AMD, TSM
- Radar: AVGO, VRT, MRVL, ANET, CLS

**Commodities & Energy (2):**
- XOM, CVX

**Crypto (2):**
- BTC, ETH

**Market Indices (3):**
- SPY (S&P 500)
- QQQ (NASDAQ)
- UVXY (VIX)

## Data Sources

1. **Finnhub API** - Stock quotes, news, analyst ratings
2. **CoinGecko API** - Bitcoin & Ethereum prices
3. **data/briefing.json** - AI analysis & signals

## Getting Started

1. Read [QUICKSTART.md](QUICKSTART.md) (5 minutes)
2. Get Finnhub API key (free from finnhub.io)
3. Run: `npx http-server`
4. Open: http://localhost:8080
5. Add API key in Settings tab
6. Done!

## Deployment

Choose one:
- **Vercel:** `vercel`
- **GitHub Pages:** Push to GitHub, enable Pages
- **Netlify:** Connect repo, auto-deploys
- **Docker:** Build with included Dockerfile concept
- **Any HTTPS host:** Static files, no server needed

See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

## Design

- **Dark mode:** #0a0e17 background
- **Fonts:** Inter (UI), JetBrains Mono (numbers), Newsreader (headlines)
- **Colors:** Green (+), Red (-), Blue (accent), Gold (warning)
- **Animations:** 250ms detail overlay slide, signal pulse
- **Responsive:** Mobile-first, tablet-friendly

## PWA Features

✓ Installable on home screen
✓ Works offline (with cached data)
✓ Service worker caching
✓ iOS and Android support
✓ Progressive enhancement

## Key Technologies

- **Frontend:** Vanilla HTML/CSS/JS (no frameworks)
- **Backend:** GitHub Actions + Node.js
- **APIs:** Finnhub (stock data) + CoinGecko (crypto)
- **Deployment:** Static PWA, any HTTPS host
- **Automation:** GitHub Actions workflow

## Investment Theses

Each of the 14 tickers has a unique investment thesis explaining:
- Competitive advantage
- Growth drivers
- Risk factors
- Valuation context

Examples:
- **NVDA:** GPU king, $500B+ revenue visibility
- **MU:** HBM memory, 300% EPS growth, $100B TAM
- **DELL:** $43B AI server backlog
- **BTC:** Digital gold, institutional adoption

## Briefing Generation

The `scripts/generate-briefing.js` script:
- Runs locally: `FINNHUB_API_KEY=xxx npm run generate-briefing`
- Runs automatically via GitHub Actions at 6 AM and 4 PM ET (weekdays)
- Generates `data/briefing.json` with current analysis
- Creates buy/hold/sell signals and consensus bars

## API Rate Limits

- **Finnhub:** 60 requests/minute (free tier) - plenty for this app
- **CoinGecko:** Unlimited (community tier) - no key needed

## Browser Support

- iOS Safari 11.3+
- Chrome/Edge 40+
- Firefox 67+
- Samsung Internet 5+

## Version Info

- **App Version:** v2.0
- **Build Date:** 2026-03-15
- **Last Updated:** 2026-03-15

## Next Steps

1. **Setup:** Follow [QUICKSTART.md](QUICKSTART.md)
2. **Customize:** Edit watchlist in index.html
3. **Deploy:** Choose platform in [DEPLOYMENT.md](DEPLOYMENT.md)
4. **Monitor:** Watch GitHub Actions for briefing updates

## Support

- **Finnhub Issues:** https://finnhub.io/docs/api
- **PWA Issues:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- **Deployment Issues:** Platform-specific docs

---

**Einstein Markets v2.0** - AI-powered financial intelligence for the discerning investor.
