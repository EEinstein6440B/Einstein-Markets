#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.FINNHUB_API_KEY;
const BRIEF_DIR = path.join(__dirname, '..', 'data');
const BRIEF_FILE = path.join(BRIEF_DIR, 'briefing.json');

const watchlist = {
  core5: ['NVDA', 'MU', 'DELL', 'AMD', 'TSM'],
  radar: ['AVGO', 'VRT', 'MRVL', 'ANET', 'CLS'],
  energy: ['XOM', 'CVX'],
  crypto: ['BTC', 'ETH'],
  market: ['SPY', 'QQQ', 'UVXY'],
};

const investmentTheses = {
  NVDA: "The undisputed king of AI GPUs. $500B+ in Blackwell/Rubin revenue pipeline visibility through end of 2026. Data center revenue up 75% YoY. Vera Rubin chip (10x perf/watt) ships H2 2026. Morningstar fair value $240. Risk: zero China revenue in guidance, architecture transitions can compress margins.",
  MU: "One of only three companies in the world making HBM (high-bandwidth memory) — every AI GPU needs it. Entire 2026 HBM output sold out. Forward P/E of ~7x with 300% EPS growth. HBM TAM forecast to hit $100B by 2028, two years earlier than expected. Arguably the most undervalued AI play.",
  DELL: "$43B AI server backlog, $64B total AI orders for the year. AI server revenue exploded 342% to $9B in Q4. Raised long-term revenue growth to 7-9% annually. Risk: margin pressure from rising DRAM/NAND costs and China supply chain restructuring.",
  AMD: "The inference play. MI355X delivers 30% faster inference than Nvidia B200 on Llama 3.1 with ~40% better tokens-per-dollar. OpenAI taking up to 10% stake and committing up to 6GW of AMD GPUs (~$200B+). Meta also on board. 4% data center GPU market share, up from 2%.",
  TSM: "Controls ~70% of global semiconductor foundry market. Every chip from Nvidia, AMD, Apple, Qualcomm runs through their fabs. AI chip revenue growing at 60% CAGR through 2029. 63-65% gross margins. Discount is entirely Taiwan geopolitical risk — mitigating via Japan and Arizona expansion.",
  AVGO: "Designs custom AI ASICs for Google, Meta, and others. Jericho3-AI switch platform becoming standard in AI clusters. A less volatile way to play the custom silicon trend.",
  VRT: "Power and cooling for AI data centers. The boring-but-essential play. Co-engineers cooling for Nvidia superclusters. As Blackwell and Rubin push power density higher, liquid cooling becomes mandatory — Vertiv's high-density units command better margins.",
  MRVL: "Custom silicon for AWS and Microsoft hitting volume production on 3nm. Management guides custom ASIC revenue to double within two years. Pure play on the 'hyperscalers building their own chips' trend.",
  ANET: "The networking backbone of AI data centers. 42.7% EBITDA margin, consistent earnings beats. As AI clusters scale, the networking fabric between GPUs becomes the bottleneck — that's Arista's sweet spot.",
  CLS: "AI hardware manufacturing. 223% one-year return with 65% projected EPS growth. Less well-known but deeply embedded in the AI supply chain.",
  XOM: "Oil supermajor with upstream exposure. Benefits directly from geopolitical energy disruptions. Diversified portfolio across exploration, production, refining.",
  CVX: "Geopolitical energy play and Berkshire Hathaway holding. Buffett added 8M+ shares recently. Declared force majeure at Leviathan gas field (Israel). Secured exclusive rights on Iraq's West Qurna 2 oilfield (450K bpd). Up 27% YTD.",
  BTC: "Digital gold thesis gaining traction — showed real decoupling during March 2026 crisis (rose 3.7% while S&P hit lows). Institutional adoption accelerating through ETFs. Macro hedge against inflation and currency debasement.",
  ETH: "The smart contract and DeFi ecosystem backbone. Benefits from institutional crypto adoption and growing L2 scaling solutions. Staking yield provides passive return floor.",
};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
    }).on('error', reject);
  });
}

async function fetchTickerData(symbol) {
  if (!API_KEY || symbol === 'BTC' || symbol === 'ETH') {
    return null;
  }

  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
  const data = await httpsGet(url);
  if (data.c !== undefined) {
    return {
      price: data.c,
      change: data.d || 0,
      changePercent: data.dp || 0,
      open: data.o || 0,
      high: data.h || 0,
      low: data.l || 0,
      prevClose: data.pc || 0,
    };
  }
  return null;
}

async function fetchAnalystData(symbol) {
  if (!API_KEY) return null;

  const url = `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${API_KEY}`;
  const data = await httpsGet(url);
  if (Array.isArray(data) && data[0]) {
    const rec = data[0];
    return {
      strongBuy: rec.strongBuy || 0,
      buy: rec.buy || 0,
      hold: rec.hold || 0,
      sell: rec.sell || 0,
      strongSell: rec.strongSell || 0,
    };
  }
  return null;
}

async function fetchCryptoPrice(cryptoId) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_change=true`;
  const data = await httpsGet(url);
  if (data[cryptoId]) {
    return {
      price: data[cryptoId].usd,
      changePercent: data[cryptoId].usd_24h_change || 0,
    };
  }
  return null;
}

function analyzeSignal(ticker, symbol) {
  if (!ticker) return { signal: 'neutral', signalLabel: 'No Data' };

  const change = ticker.changePercent;

  // AI Infrastructure stocks
  if (['NVDA', 'MU', 'DELL', 'AMD', 'TSM', 'AVGO', 'VRT', 'MRVL', 'ANET', 'CLS'].includes(symbol)) {
    if (change > 5) return { signal: 'strong_buy', signalLabel: 'Strong Buy Signal' };
    if (change > 2) return { signal: 'buy', signalLabel: 'Buy Signal' };
    if (change > -2) return { signal: 'neutral', signalLabel: 'Neutral' };
    if (change > -5) return { signal: 'caution', signalLabel: 'Caution' };
    return { signal: 'bearish', signalLabel: 'Bearish Signal' };
  }

  // Energy
  if (['XOM', 'CVX'].includes(symbol)) {
    if (change > 3) return { signal: 'buy', signalLabel: 'Buy Signal' };
    return { signal: 'neutral', signalLabel: 'Neutral' };
  }

  // Crypto
  if (['BTC', 'ETH'].includes(symbol)) {
    if (change > 5) return { signal: 'buy', signalLabel: 'Buy Signal' };
    return { signal: 'neutral', signalLabel: 'Neutral' };
  }

  // Market indices
  return { signal: 'neutral', signalLabel: 'Neutral' };
}

function generateCommentary(symbol, ticker, signal) {
  const commentaries = {
    NVDA: "Blackwell ramp accelerating. Data center revenue guidance raised again. Custom ASIC adoption by hyperscalers validates chip design moat. Risk/reward heavily skewed to upside despite premium valuation.",
    MU: "HBM memory transition in early innings. 2026 output already sold out for the year. Valuation reset justified by 300%+ EPS growth. Single-name concentration risk if HBM adoption stalls.",
    DELL: "$43B backlog provides revenue visibility through 2027. AI server attach rates driving operating leverage. Watch for DRAM price weakness to improve margins. Supply chain improvements key to execution.",
    AMD: "OpenAI partnership de-risks inference ramp. MI355X performance gains credible. 6GW commitment from OpenAI could drive $200B+ revenue over product cycle. Competitive moat still forming vs. Nvidia.",
    TSM: "Chip design moat intact, but Taiwan geopolitical premium embedded in valuation. Arizona and Japan fab ramp provide diversification, reducing political tail risk. AI revenue momentum strong; wait for margin expansion confirmation.",
    AVGO: "Custom ASIC proliferation benefits broadcom as switch architecture provider. Jericho3-AI becoming standard. Lower valuation multiple than Nvidia provides margin of safety.",
    VRT: "Power density concerns in Blackwell/Rubin clusters creating liquid cooling tailwind. Co-engineering with Nvidia validates technology. Boring business with strong secular growth.",
    MRVL: "Custom silicon ramp for AWS/Microsoft on track. Management guidance for revenue doubling credible. Valuation supports risk/reward. Watch 3nm yields.",
    ANET: "Networking fabric bottleneck as AI clusters scale. 42.7% EBITDA margins provide downside protection. Consistent execution and earnings beats build confidence.",
    CLS: "Strong momentum (223% YTD return) but elevated from lows. Supply chain deep integration provides stickiness. Valuation demands flawless execution. Watch for profit-taking.",
    XOM: "Geopolitical energy premium supports near-term. Commodity price sensitive. Long-term energy transition risk mitigates upside. Suitable as geopolitical hedge within diversified portfolio.",
    CVX: "Berkshire backing validates geopolitical energy play. Iraq oilfield contract secures supply for decades. Leviathan force majeure may create tactical upside if resolved. Buffett's continued buying is positive signal.",
    BTC: "March 2026 crisis showed digital gold thesis working. Institutional ETF flows accelerating. Macro hedge demand rising as rate cut cycle approaches. Technical support building above $45k.",
    ETH: "L2 scaling narrative gaining traction but execution risk high. Staking yield floor attractive. Competition from newer chains increasing. Wait for clearer market dominance signal.",
    SPY: "Index consolidating near all-time highs. Earnings season turning point. Tech concentration risk elevated. Rotation to value/small-cap possible if rates spike.",
    QQQ: "AI infrastructure secular growth justifies tech premium. Rotation risk exists but earnings delivery supporting valuations. Earnings revisions trend positive.",
    UVXY: "VIX elevated but not panic levels. Term structure suggests expected volatility moderating. Range-bound 20-30 likely through earnings season.",
  };

  return commentaries[symbol] || "Analysis pending.";
}

async function generateBriefing() {
  console.log('Generating market briefing...');

  const allSymbols = [
    ...watchlist.core5,
    ...watchlist.radar,
    ...watchlist.energy,
    ...watchlist.crypto,
    ...watchlist.market,
  ];

  const briefing = {
    marketMood: "📈 Market consolidating after recent volatility. Tech showing relative strength on AI infrastructure tailwinds. Watch earnings calendar and geopolitical developments.",
    generatedAt: new Date().toISOString(),
  };

  for (const symbol of allSymbols) {
    let ticker = null;

    if (symbol === 'BTC') {
      ticker = await fetchCryptoPrice('bitcoin');
    } else if (symbol === 'ETH') {
      ticker = await fetchCryptoPrice('ethereum');
    } else {
      ticker = await fetchTickerData(symbol);
    }

    if (ticker) {
      const analysis = analyzeSignal(ticker, symbol);
      briefing[symbol] = {
        signal: analysis.signal,
        signalLabel: analysis.signalLabel,
        commentary: generateCommentary(symbol, ticker, analysis.signal),
        momentum: ticker.changePercent > 0 ? 'up' : ticker.changePercent < 0 ? 'down' : 'flat',
        timestamp: new Date().toUTCString().substring(0, 16),
      };

      const consensus = await fetchAnalystData(symbol);
      if (consensus) {
        briefing[symbol].consensus = consensus;
      }
    }
  }

  // Ensure directory exists
  if (!fs.existsSync(BRIEF_DIR)) {
    fs.mkdirSync(BRIEF_DIR, { recursive: true });
  }

  // Write briefing file
  fs.writeFileSync(BRIEF_FILE, JSON.stringify(briefing, null, 2));
  console.log(`Briefing saved to ${BRIEF_FILE}`);
}

generateBriefing().catch(console.error);
