/**
 * Einstein Markets — Automated Briefing Generator
 * Runs via GitHub Actions at 6 AM and 4 PM ET on weekdays.
 *
 * Fetches live data from Finnhub + CoinGecko, generates per-ticker
 * analysis signals, and writes data/briefing.json for the PWA to consume.
 */

const fs = require('fs');
const path = require('path');

const FH = 'https://finnhub.io/api/v1';
const CG = 'https://api.coingecko.com/api/v3';
const KEY = process.env.FINNHUB_KEY;

if (!KEY) { console.error('FINNHUB_KEY not set'); process.exit(1); }

// ===== WATCHLIST =====
const CORE5 = [
  { symbol: 'NVDA', name: 'Nvidia', group: 'core', thesis: 'GPU King — $500B+ Blackwell/Rubin pipeline' },
  { symbol: 'MU', name: 'Micron', group: 'core', thesis: 'HBM monopoly — 7x fwd P/E, 300% EPS growth' },
  { symbol: 'DELL', name: 'Dell', group: 'core', thesis: 'AI Servers — $43B backlog, 342% AI revenue growth' },
  { symbol: 'AMD', name: 'AMD', group: 'core', thesis: 'Inference play — OpenAI partnership, MI355X advantage' },
  { symbol: 'TSM', name: 'TSMC', group: 'core', thesis: 'Irreplaceable foundry — 70% global share, 60% AI CAGR' },
];
const RADAR = [
  { symbol: 'AVGO', name: 'Broadcom', group: 'radar', thesis: 'Custom AI ASICs for Google/Meta' },
  { symbol: 'VRT', name: 'Vertiv', group: 'radar', thesis: 'AI data center power & cooling' },
  { symbol: 'MRVL', name: 'Marvell', group: 'radar', thesis: 'Custom silicon for AWS/MSFT on 3nm' },
  { symbol: 'ANET', name: 'Arista', group: 'radar', thesis: 'AI data center networking backbone' },
  { symbol: 'CLS', name: 'Celestica', group: 'radar', thesis: 'AI hardware manufacturing' },
];
const ENERGY = [
  { symbol: 'XOM', name: 'Exxon Mobil', group: 'energy', thesis: 'Oil supermajor, upstream exposure' },
  { symbol: 'CVX', name: 'Chevron', group: 'energy', thesis: 'Geopolitical energy play, Berkshire holding' },
];
const ALL_STOCKS = [...CORE5, ...RADAR, ...ENERGY];
const CRYPTO_IDS = [
  { cgId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', thesis: 'Digital gold — institutional adoption via ETFs' },
  { cgId: 'ethereum', symbol: 'ETH', name: 'Ethereum', thesis: 'DeFi/smart contract backbone, staking yield' },
];

// ===== API HELPERS =====
async function fhGet(endpoint) {
  const url = `${FH}${endpoint}&token=${KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Finnhub ${r.status}: ${endpoint}`);
  return r.json();
}

async function fhQuote(sym) {
  try {
    const d = await fhGet(`/quote?symbol=${sym}`);
    if (d.c === 0 && d.h === 0) return null;
    return { price: d.c, change: d.d, pct: d.dp, high: d.h, low: d.l, open: d.o, pc: d.pc };
  } catch(e) { console.error(`Quote error ${sym}:`, e.message); return null; }
}

async function fhCompanyNews(sym, days = 7) {
  try {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    return await fhGet(`/company-news?symbol=${sym}&from=${from}&to=${to}`);
  } catch(e) { return []; }
}

async function fhRecommendation(sym) {
  try {
    const d = await fhGet(`/stock/recommendation?symbol=${sym}`);
    return d && d.length > 0 ? d[0] : null;
  } catch(e) { return null; }
}

async function fhGeneralNews() {
  try { return await fhGet('/news?category=general'); } catch(e) { return []; }
}

async function cgCrypto() {
  try {
    const ids = CRYPTO_IDS.map(c => c.cgId).join(',');
    const r = await fetch(`${CG}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`);
    return await r.json();
  } catch(e) { return null; }
}

// ===== ANALYSIS ENGINE =====
function analyzeStock(sym, quote, news, recommendation, meta) {
  const analysis = {
    symbol: sym,
    name: meta.name,
    group: meta.group,
    thesis: meta.thesis,
    price: quote?.price || null,
    change: quote?.change || null,
    changePct: quote?.pct || null,
    high: quote?.high || null,
    low: quote?.low || null,
    open: quote?.open || null,
    prevClose: quote?.pc || null,
    newsCount: news.length,
    signal: 'neutral',
    signalStrength: 0,
    commentary: '',
    keyNews: [],
    analystConsensus: null,
  };

  if (!quote) {
    analysis.commentary = 'No price data available for this session.';
    return analysis;
  }

  // --- Signal scoring ---
  let score = 0;
  const reasons = [];

  // 1. Daily momentum
  if (quote.pct > 3) { score += 2; reasons.push(`Strong day (+${quote.pct.toFixed(1)}%)`); }
  else if (quote.pct > 1) { score += 1; reasons.push(`Positive momentum (+${quote.pct.toFixed(1)}%)`); }
  else if (quote.pct < -3) { score -= 2; reasons.push(`Sharp selloff (${quote.pct.toFixed(1)}%)`); }
  else if (quote.pct < -1) { score -= 1; reasons.push(`Under pressure (${quote.pct.toFixed(1)}%)`); }

  // 2. Trading range position (close relative to day's range)
  if (quote.high !== quote.low) {
    const rangePos = (quote.price - quote.low) / (quote.high - quote.low);
    if (rangePos > 0.8) { score += 1; reasons.push('Closing near day high — buying pressure'); }
    else if (rangePos < 0.2) { score -= 1; reasons.push('Closing near day low — selling pressure'); }
  }

  // 3. Gap analysis (open vs prev close)
  if (quote.pc > 0) {
    const gapPct = ((quote.open - quote.pc) / quote.pc) * 100;
    if (gapPct > 2) { score += 1; reasons.push(`Gapped up ${gapPct.toFixed(1)}% at open`); }
    else if (gapPct < -2) { score -= 1; reasons.push(`Gapped down ${Math.abs(gapPct).toFixed(1)}% at open`); }
  }

  // 4. News volume (more news = more attention = potential catalyst)
  if (news.length > 10) { reasons.push(`High news volume (${news.length} stories this week) — elevated attention`); }
  else if (news.length > 5) { reasons.push(`Moderate news flow (${news.length} stories)`); }

  // 5. Analyst recommendations
  if (recommendation) {
    const { buy, hold, sell, strongBuy, strongSell } = recommendation;
    const total = (buy||0) + (hold||0) + (sell||0) + (strongBuy||0) + (strongSell||0);
    const bullish = (buy||0) + (strongBuy||0);
    const bearish = (sell||0) + (strongSell||0);
    if (total > 0) {
      const bullPct = Math.round((bullish / total) * 100);
      analysis.analystConsensus = {
        strongBuy: strongBuy || 0, buy: buy || 0, hold: hold || 0,
        sell: sell || 0, strongSell: strongSell || 0,
        bullishPct: bullPct, period: recommendation.period,
      };
      if (bullPct >= 70) { score += 1; reasons.push(`Analyst consensus bullish (${bullPct}% buy/strong buy)`); }
      else if (bullPct <= 30) { score -= 1; reasons.push(`Analyst consensus cautious (only ${bullPct}% buy)`); }
      else { reasons.push(`Analyst consensus mixed (${bullPct}% buy)`); }
    }
  }

  // 6. Headline sentiment (simple keyword scan)
  const allText = news.map(n => (n.headline || '').toLowerCase()).join(' ');
  const bullWords = ['upgrade','raise','beat','surge','record','breakout','bullish','buy','outperform','accelerat'];
  const bearWords = ['downgrade','cut','miss','plunge','warning','bearish','sell','underperform','risk','decline'];
  const bullHits = bullWords.filter(w => allText.includes(w)).length;
  const bearHits = bearWords.filter(w => allText.includes(w)).length;
  if (bullHits > bearHits + 1) { score += 1; reasons.push('Headline sentiment skews positive'); }
  else if (bearHits > bullHits + 1) { score -= 1; reasons.push('Headline sentiment skews negative'); }

  // --- Determine signal ---
  if (score >= 3) { analysis.signal = 'strong_buy'; analysis.signalStrength = Math.min(score, 5); }
  else if (score >= 1) { analysis.signal = 'buy'; analysis.signalStrength = score; }
  else if (score <= -3) { analysis.signal = 'bearish'; analysis.signalStrength = score; }
  else if (score <= -1) { analysis.signal = 'caution'; analysis.signalStrength = score; }
  else { analysis.signal = 'neutral'; analysis.signalStrength = 0; }

  // --- Generate commentary ---
  const signalLabels = {
    strong_buy: 'Looking strong',
    buy: 'Thesis intact — favorable signals',
    neutral: 'Holding steady — no strong signals either way',
    caution: 'Watch closely — some warning signs',
    bearish: 'Under pressure — consider risk management',
  };
  analysis.commentary = signalLabels[analysis.signal] + '. ' + reasons.join('. ') + '.';

  // --- Top 3 news headlines ---
  const seen = new Set();
  analysis.keyNews = news.filter(n => {
    const k = (n.headline || '').toLowerCase().slice(0, 50);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 3).map(n => ({
    headline: n.headline,
    summary: n.summary ? n.summary.slice(0, 200) : '',
    source: n.source,
    url: n.url,
    datetime: n.datetime,
  }));

  return analysis;
}

function analyzeCrypto(sym, data, meta) {
  if (!data) return {
    symbol: sym, name: meta.name, group: 'crypto', thesis: meta.thesis,
    price: null, changePct: null, signal: 'neutral', signalStrength: 0,
    commentary: 'No data available.', keyNews: [],
  };

  const pct = data.usd_24h_change || 0;
  let score = 0;
  const reasons = [];

  if (pct > 5) { score += 2; reasons.push(`Strong rally (+${pct.toFixed(1)}% in 24h)`); }
  else if (pct > 2) { score += 1; reasons.push(`Positive (+${pct.toFixed(1)}% in 24h)`); }
  else if (pct < -5) { score -= 2; reasons.push(`Sharp drop (${pct.toFixed(1)}% in 24h)`); }
  else if (pct < -2) { score -= 1; reasons.push(`Pulling back (${pct.toFixed(1)}% in 24h)`); }

  let signal = 'neutral';
  if (score >= 2) signal = 'strong_buy';
  else if (score >= 1) signal = 'buy';
  else if (score <= -2) signal = 'bearish';
  else if (score <= -1) signal = 'caution';

  const signalLabels = {
    strong_buy: 'Momentum strong', buy: 'Trending up',
    neutral: 'Sideways action', caution: 'Softening', bearish: 'Selling pressure',
  };

  return {
    symbol: sym, name: meta.name, group: 'crypto', thesis: meta.thesis,
    price: data.usd, changePct: pct,
    signal, signalStrength: score,
    commentary: signalLabels[signal] + '. ' + reasons.join('. ') + '.',
    keyNews: [],
  };
}

// ===== MACRO / GEO NEWS =====
function categorizeMacroNews(articles) {
  const geo = []; const fed = []; const energy = [];

  for (const a of articles.slice(0, 50)) {
    const t = ((a.headline || '') + ' ' + (a.summary || '')).toLowerCase();
    if (/iran|israel|war|military|strike|conflict|missile|sanction|tariff|china|russia|ukraine/.test(t))
      geo.push(a);
    if (/fed|interest rate|inflation|treasury|fomc|powell|cpi|gdp|unemployment|jobs/.test(t))
      fed.push(a);
    if (/oil|crude|opec|brent|wti|natural gas|energy crisis/.test(t))
      energy.push(a);
  }

  const dedup = (arr) => {
    const seen = new Set();
    return arr.filter(a => {
      const k = (a.headline || '').toLowerCase().slice(0, 50);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 4).map(a => ({
      headline: a.headline,
      summary: a.summary ? a.summary.slice(0, 200) : '',
      source: a.source, url: a.url, datetime: a.datetime,
    }));
  };

  return { geopolitical: dedup(geo), fedRates: dedup(fed), energyMarket: dedup(energy) };
}

// ===== MAIN =====
async function main() {
  console.log('Generating market briefing...');
  const now = new Date();
  const hour = parseInt(new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" })).getHours());
  const briefingType = hour < 12 ? 'morning' : 'afternoon';

  // Fetch all data in parallel
  const stockQuotePromises = ALL_STOCKS.map(s => fhQuote(s.symbol).then(q => [s.symbol, q]));
  const stockNewsPromises = ALL_STOCKS.map(s => fhCompanyNews(s.symbol).then(n => [s.symbol, n]));
  const recPromises = ALL_STOCKS.map(s => fhRecommendation(s.symbol).then(r => [s.symbol, r]));
  const indexPromises = ['SPY', 'QQQ', 'UVXY'].map(s => fhQuote(s).then(q => [s, q]));

  const [stockQuotes, stockNews, recs, indexQuotes, cryptoData, generalNews] = await Promise.all([
    Promise.all(stockQuotePromises),
    Promise.all(stockNewsPromises),
    Promise.all(recPromises),
    Promise.all(indexPromises),
    cgCrypto(),
    fhGeneralNews(),
  ]);

  // Build maps
  const quoteMap = Object.fromEntries(stockQuotes);
  const newsMap = Object.fromEntries(stockNews);
  const recMap = Object.fromEntries(recs);
  const indexMap = Object.fromEntries(indexQuotes);

  // Analyze each stock
  const stockAnalyses = ALL_STOCKS.map(s =>
    analyzeStock(s.symbol, quoteMap[s.symbol], newsMap[s.symbol] || [], recMap[s.symbol], s)
  );

  // Analyze crypto
  const cryptoAnalyses = CRYPTO_IDS.map(c => {
    const d = cryptoData ? cryptoData[c.cgId] : null;
    return analyzeCrypto(c.symbol, d, c);
  });

  // Index data
  const indices = {
    sp500: indexMap['SPY'] ? { price: indexMap['SPY'].price, pct: indexMap['SPY'].pct } : null,
    nasdaq: indexMap['QQQ'] ? { price: indexMap['QQQ'].price, pct: indexMap['QQQ'].pct } : null,
    vix: indexMap['UVXY'] ? { price: indexMap['UVXY'].price, pct: indexMap['UVXY'].pct } : null,
  };

  // Macro news
  const macro = categorizeMacroNews(generalNews || []);

  // Overall market sentiment
  const allSignals = [...stockAnalyses, ...cryptoAnalyses];
  const bullCount = allSignals.filter(s => s.signal === 'buy' || s.signal === 'strong_buy').length;
  const bearCount = allSignals.filter(s => s.signal === 'caution' || s.signal === 'bearish').length;
  let marketMood = 'mixed';
  if (bullCount >= allSignals.length * 0.6) marketMood = 'bullish';
  else if (bearCount >= allSignals.length * 0.6) marketMood = 'bearish';
  else if (bullCount > bearCount) marketMood = 'leaning_bullish';
  else if (bearCount > bullCount) marketMood = 'leaning_bearish';

  // Build briefing
  const briefing = {
    generated: now.toISOString(),
    briefingType,
    marketMood,
    moodSummary: {
      bullish: bullCount,
      bearish: bearCount,
      neutral: allSignals.length - bullCount - bearCount,
      total: allSignals.length,
    },
    indices,
    stocks: stockAnalyses,
    crypto: cryptoAnalyses,
    macro,
  };

  // Write to file
  const outPath = path.join(__dirname, '..', 'data', 'briefing.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(briefing, null, 2));
  console.log(`Briefing written to ${outPath}`);
  console.log(`Market mood: ${marketMood} (${bullCount} bull / ${bearCount} bear / ${allSignals.length - bullCount - bearCount} neutral)`);
}

main().catch(e => { console.error(e); process.exit(1); });
