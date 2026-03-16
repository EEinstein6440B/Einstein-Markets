# Einstein Markets v2.0 - Deployment Guide

## Quick Start

1. **Get Finnhub API Key**
   - Sign up at https://finnhub.io
   - Copy your free API key
   - You can make up to 60 requests per minute with the free tier

2. **Local Testing**
   ```bash
   npx http-server
   # Open http://localhost:8080
   ```

3. **In the App**
   - Go to Settings tab
   - Paste your Finnhub API key
   - The app will immediately start fetching live data

## Hosting Options

### Vercel (Recommended - Free)
```bash
npm install -g vercel
vercel
# Follow prompts, deploy is instant
```

### GitHub Pages
1. Push to GitHub
2. Go to Settings → Pages
3. Select main branch as source
4. Site deployed at `username.github.io/repo`

### Netlify (Free)
1. Connect GitHub repo
2. Set build command: `npm run build` (or leave blank)
3. Set publish directory: `.`
4. Deploy

### Docker (Self-hosted)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
EXPOSE 8080
CMD ["npx", "http-server", "-p", "8080"]
```

```bash
docker build -t einstein-markets .
docker run -p 8080:8080 einstein-markets
```

## GitHub Actions Setup

To enable automatic briefing generation:

1. Go to your GitHub repo Settings
2. Secrets → New repository secret
3. Name: `FINNHUB_API_KEY`
4. Value: Your Finnhub API key
5. The workflow runs at:
   - 6 AM ET (11 AM UTC)
   - 4 PM ET (9 PM UTC)
   - Monday-Friday only

The briefing.json file will be auto-committed.

## Production Checklist

- [ ] Finnhub API key added to GitHub secrets
- [ ] PWA manifest points to correct start_url
- [ ] Icons are properly sized (192x192, 512x512)
- [ ] Service worker cache strategy tested
- [ ] HTTPS enabled (required for PWA)
- [ ] Briefing.json generates successfully
- [ ] All tickers load and display correctly
- [ ] Detail overlay animations smooth
- [ ] Mobile responsiveness verified

## Environment Variables

Only one environment variable needed for the briefing script:

```
FINNHUB_API_KEY=your_key_here
```

All other configuration is client-side in localStorage.

## Monitoring

Check the GitHub Actions tab to see:
- Briefing generation logs
- Any API failures
- Last successful update timestamp

If briefing fails to update:
1. Check Actions tab for error logs
2. Verify Finnhub API key is correct
3. Check rate limits haven't been exceeded
4. Verify all tickers are valid symbols

## Performance Tips

- Service worker caches HTML, CSS, JS, manifest
- API data refreshes every 5 minutes client-side
- Briefing.json updates twice daily via GitHub Actions
- Consider CDN for static assets on large scale

## Customization

Edit `index.html` to:
- Change ticker symbols (update `watchlist` object)
- Modify investment theses (update `investmentTheses` object)
- Adjust colors (modify CSS variables in `:root`)
- Add new sections to briefing

Edit `scripts/generate-briefing.js` to:
- Add new tickers to analysis
- Change signal logic
- Add different data sources
- Customize commentary

## Troubleshooting

**No live data showing:**
- Check Finnhub API key in Settings
- Open browser DevTools → Network tab
- Verify API key is valid (test at finnhub.io)

**Service worker not caching:**
- Clear site data (Settings → Clear browsing data)
- Uninstall PWA if installed
- Reinstall from scratch

**Detail view not opening:**
- Check browser console for JS errors
- Verify index.html loaded completely
- Try in incognito/private mode

**Briefing.json not updating:**
- Check GitHub Actions workflow logs
- Verify FINNHUB_API_KEY secret is set
- Check Finnhub rate limits
- Verify market is open (workflows run weekdays only)

## API Rate Limits

Finnhub free tier: 60 requests/minute

The app makes requests for:
- 14 stock quotes (14 requests)
- Analyst recommendations (14 requests if Finnhub has data)
- Company news (up to 14 requests)

Total: ~42 requests at startup + periodic refreshes

GitHub Actions briefing job: ~30 requests every 6 hours

Well within free tier limits.

## Support

For Finnhub API issues:
- https://finnhub.io/docs/api

For PWA issues:
- Check: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps

For deployment issues:
- Check hosting platform documentation
- Review GitHub Actions logs
- Verify all files are committed
