/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { MarketSimulator } from './server/market';
import { MarketSymbol, Trade, NewsEvent, BreachEvent } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Market Simulator
const simulator = new MarketSimulator();

// Setup trades database filename
const DB_FILE = path.join(process.cwd(), 'trades_db.json');

// Helper to read trades
function readTrades(): Trade[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8').trim();
    if (!data) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(data) as Trade[];
  } catch (error) {
    console.error('Error reading trades DB, resetting to empty list:', error);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
    } catch (e) {
      console.error('Failed to reset trades DB:', e);
    }
    return [];
  }
}

// Helper to write trades
function writeTrades(trades: Trade[]): boolean {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(trades, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing trades DB:', error);
    return false;
  }
}

// Ensure database file is initialized
readTrades();

// Setup breaches database filename
const BREACH_DB_FILE = path.join(process.cwd(), 'breaches_db.json');

function readBreaches(): BreachEvent[] {
  try {
    if (!fs.existsSync(BREACH_DB_FILE)) {
      const initialBreaches: BreachEvent[] = [
        {
          id: "breach-1",
          timestamp: "2026-06-04T14:30:00Z",
          symbol: "BTC/USDT",
          exposure: 1.95,
          pnlAtBreach: -195.00,
          reason: "Sudden FOMC interest rate spike triggered high-volatility stop-loss aggregate deviation."
        },
        {
          id: "breach-2",
          timestamp: "2026-06-03T20:15:22Z",
          symbol: "GOLD/USD",
          exposure: 1.62,
          pnlAtBreach: -162.00,
          reason: "Precious metals resistance breakout exceeded localized asset-class limit cap."
        },
        {
          id: "breach-3",
          timestamp: "2026-06-02T10:05:11Z",
          symbol: "GBP/USD",
          exposure: 1.58,
          pnlAtBreach: -158.00,
          reason: "Liquidity sweep consolidation over-leveraged the 1% maximum target parameter limit during Asian session close."
        },
        {
          id: "breach-4",
          timestamp: "2026-05-31T15:42:00Z",
          symbol: "EUR/USD",
          exposure: 1.74,
          pnlAtBreach: -174.00,
          reason: "Overlapping directional buy lots triggered systemic margin escalation warning."
        },
        {
          id: "breach-5",
          timestamp: "2026-05-28T09:12:45Z",
          symbol: "USD/JPY",
          exposure: 1.52,
          pnlAtBreach: -152.00,
          reason: "Averaging down into negative momentum structure breached compliance threshold."
        }
      ];
      fs.writeFileSync(BREACH_DB_FILE, JSON.stringify(initialBreaches, null, 2));
      return initialBreaches;
    }
    const data = fs.readFileSync(BREACH_DB_FILE, 'utf-8').trim();
    if (!data) {
      return [];
    }
    return JSON.parse(data) as BreachEvent[];
  } catch (error) {
    console.error('Error reading breaches DB:', error);
    return [];
  }
}

function writeBreaches(breaches: BreachEvent[]): boolean {
  try {
    fs.writeFileSync(BREACH_DB_FILE, JSON.stringify(breaches, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing breaches DB:', error);
    return false;
  }
}

function checkForNewBreaches(): void {
  try {
    const trades = readTrades();
    const openTrades = trades.filter(t => t.status === 'OPEN');
    if (openTrades.length === 0) return;

    let totalRiskAtStake = 0;
    openTrades.forEach((t) => {
      const metrics = simulator.getMarketMetrics(t.symbol);
      const curPrice = metrics ? metrics.currentPrice : t.entryPrice;
      const slDistance = Math.abs(t.entryPrice - t.stopLoss);
      
      let tradeRiskDollar = 0;
      if (t.symbol === 'BTC/USDT') {
        tradeRiskDollar = slDistance * t.size;
      } else if (t.symbol === 'USD/JPY') {
        tradeRiskDollar = (slDistance / 0.01) * t.size * 0.1;
      } else {
        const contractLots = t.size * 100000;
        tradeRiskDollar = slDistance * contractLots;
      }
      
      totalRiskAtStake += Math.max(tradeRiskDollar, 50);
    });

    const portfolioRiskPercent = parseFloat(((totalRiskAtStake / 10000) * 100).toFixed(2));
    
    if (portfolioRiskPercent > 1.5) {
      const breaches = readBreaches();
      
      // Determine dominant symbol causing risk
      let maxRiskSymbol = openTrades[0]?.symbol || 'EUR/USD';
      let maxRiskAmt = 0;
      openTrades.forEach(t => {
        const slDistance = Math.abs(t.entryPrice - t.stopLoss);
        if (slDistance > maxRiskAmt) {
          maxRiskAmt = slDistance;
          maxRiskSymbol = t.symbol;
        }
      });

      const now = new Date();
      // 5-minute cooldown per symbol to prevent writing duplicate events rapidly
      const hasRecentBreach = breaches.some(b => {
        const diffMs = now.getTime() - new Date(b.timestamp).getTime();
        return diffMs < 5 * 60 * 1000 && b.symbol === maxRiskSymbol;
      });

      if (!hasRecentBreach) {
        const newBreach: BreachEvent = {
          id: `breach-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: now.toISOString(),
          symbol: maxRiskSymbol,
          exposure: portfolioRiskPercent,
          pnlAtBreach: -totalRiskAtStake,
          reason: `Automated compliance engine recorded an active exposure of ${portfolioRiskPercent}% (Threshold: 1.50%).`
        };
        breaches.unshift(newBreach);
        writeBreaches(breaches);
      }
    }
  } catch (error) {
    console.error('Error checking for new breaches:', error);
  }
}

// Ensure database is created
readBreaches();



// Create Econ calendar relative to 2026-06-01
const economicEvents: NewsEvent[] = [
  {
    id: 'news-1',
    currency: 'USD',
    title: 'ISM Manufacturing PMI',
    time: '2026-06-01T14:00:00Z',
    impact: 'HIGH',
    forecast: '49.1',
    previous: '48.6',
    actual: undefined,
  },
  {
    id: 'news-2',
    currency: 'GBP',
    title: 'CPI y/y (Inflation)',
    time: '2026-06-02T07:00:00Z',
    impact: 'HIGH',
    forecast: '2.1%',
    previous: '2.3%',
    actual: undefined,
  },
  {
    id: 'news-3',
    currency: 'EUR',
    title: 'Flash CPI Estimate y/y',
    time: '2026-06-03T09:00:00Z',
    impact: 'HIGH',
    forecast: '2.4%',
    previous: '2.4%',
    actual: undefined,
  },
  {
    id: 'news-4',
    currency: 'USD',
    title: 'ADP Non-Farm Employment Change',
    time: '2026-06-04T12:15:00Z',
    impact: 'MEDIUM',
    forecast: '155K',
    previous: '188K',
    actual: undefined,
  },
  {
    id: 'news-5',
    currency: 'USD',
    title: 'Unemployment Claims',
    time: '2026-06-04T12:30:00Z',
    impact: 'LOW',
    forecast: '215K',
    previous: '220K',
    actual: undefined,
  },
  {
    id: 'news-6',
    currency: 'USD',
    title: 'Non-Farm Employment Change (NFP) & Unemployment Rate',
    time: '2026-06-05T12:30:00Z',
    impact: 'HIGH',
    forecast: '180K / 3.9%',
    previous: '175K / 3.8%',
    actual: undefined,
  }
];

// Initialize Gemini SDK safely with a dynamic fallback helper
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log('Successfully initialized GoogleGenAI client.');
    }
  } catch (e) {
    console.warn('Failed to initialize GoogleGenAI client (will run in simulation/offline mode):', e);
  }
  return aiClient;
}

// Resilient wrapper with exponential backoff for transient Gemini errors (like 503 unavailable or 429 rate limit)
let isGeminiQuotaExhausted = false;
let quotaExhaustedResetTime = 0;
const QUOTA_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes cooldown

function checkGeminiQuotaStatus(): boolean {
  if (isGeminiQuotaExhausted) {
    if (Date.now() > quotaExhaustedResetTime) {
      isGeminiQuotaExhausted = false;
      console.log('[Gemini Quota Sentry] Cooldown period completed. Re-enabling Gemini API.');
      return true;
    }
    return false;
  }
  return true;
}

function handleGeminiQuotaError(err: any): void {
  const errMsg = err.message || '';
  const isQuotaLimit = 
    errMsg.includes('quota') || 
    errMsg.includes('Quota') || 
    errMsg.includes('limit') || 
    errMsg.includes('Limit') || 
    errMsg.includes('429') || 
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    err.status === 429;

  if (isQuotaLimit) {
    isGeminiQuotaExhausted = true;
    quotaExhaustedResetTime = Date.now() + QUOTA_COOLDOWN_MS;
    console.warn(`[Gemini Quota Sentry] Quota limit/Resource Exhausted detected. Activating offline simulation cooldown for ${QUOTA_COOLDOWN_MS / 1000}s.`);
  }
}

async function generateContentWithRetry(
  client: GoogleGenAI,
  params: { model: string; contents: any; config?: any },
  retries = 3,
  initialDelay = 1500
): Promise<any> {
  if (!checkGeminiQuotaStatus()) {
    throw new Error('Gemini API quota currently exhausted (serving in fast mock cooling period).');
  }

  let attempt = 0;
  while (true) {
    try {
      return await client.models.generateContent(params);
    } catch (err: any) {
      attempt++;
      const errMsg = err.message || '';
      
      handleGeminiQuotaError(err);

      const isQuotaLimit = 
        errMsg.includes('quota') || 
        errMsg.includes('Quota') || 
        errMsg.includes('limit') || 
        errMsg.includes('Limit') || 
        errMsg.includes('429') || 
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        err.status === 429;

      // If it is a quota limit exhaustion, do NOT retry. Retrying wastes time and adds large latency.
      const isTransient = 
        (errMsg.includes('503') || 
        errMsg.includes('UNAVAILABLE') || 
        errMsg.includes('demand') ||
        err.status === 503) && !isQuotaLimit;

      if (isTransient && attempt < retries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.warn(`[Gemini SDK] Transient unavailable error (Attempt ${attempt}/${retries}). Retrying in ${delay}ms... details: ${errMsg.substring(0, 150)}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

// Auto close trades check
function checkAndAutoCloseTrades(): void {
  const trades = readTrades();
  let changed = false;

  const updatedTrades = trades.map((t) => {
    if (t.status === 'CLOSED') return t;
    
    const metrics = simulator.getMarketMetrics(t.symbol);
    const curPrice = metrics.currentPrice;
    let shouldClose = false;
    let triggerPrice = curPrice;
    let reason = '';

    if (t.side === 'BUY') {
      if (curPrice <= t.stopLoss) {
        shouldClose = true;
        triggerPrice = t.stopLoss;
        reason = `Auto Closed: SL hit at ${t.stopLoss}`;
      } else if (curPrice >= t.takeProfit) {
        shouldClose = true;
        triggerPrice = t.takeProfit;
        reason = `Auto Closed: TP hit at ${t.takeProfit}`;
      }
    } else { // SELL
      if (curPrice >= t.stopLoss) {
        shouldClose = true;
        triggerPrice = t.stopLoss;
        reason = `Auto Closed: SL hit at ${t.stopLoss}`;
      } else if (curPrice <= t.takeProfit) {
        shouldClose = true;
        triggerPrice = t.takeProfit;
        reason = `Auto Closed: TP hit at ${t.takeProfit}`;
      }
    }

    if (shouldClose) {
      changed = true;
      const pnlMultiplier = t.side === 'BUY' ? 1 : -1;
      const priceDiff = triggerPrice - t.entryPrice;
      
      let rawPnl = 0;
      if (t.symbol === 'BTC/USDT') {
        rawPnl = priceDiff * t.size * pnlMultiplier;
      } else if (t.symbol === 'USD/JPY') {
        rawPnl = (priceDiff / 0.01) * t.size * 0.1 * pnlMultiplier;
      } else {
        rawPnl = (priceDiff / 0.0001) * t.size * 1.0 * pnlMultiplier;
      }

      return {
        ...t,
        status: 'CLOSED' as const,
        exitPrice: parseFloat(triggerPrice.toFixed(t.symbol === 'USD/JPY' ? 2 : t.symbol === 'BTC/USDT' ? 1 : 5)),
        pnl: parseFloat(rawPnl.toFixed(2)),
        exitTimestamp: new Date().toISOString(),
        reason
      };
    }

    return t;
  });

  if (changed) {
    writeTrades(updatedTrades);
  }
}

// Express API Routes

// Express endpoints for MT5 Python Bridge to publish OHLCV candles
app.post('/api/mt5/rates', (req, res) => {
  const { symbol, candles } = req.body;
  if (!symbol || !candles || !Array.isArray(candles)) {
    res.status(400).json({ error: 'Missing symbol or candles array' });
    return;
  }

  // Normalize MT5 symbol pairs (e.g. EURUSD, EUR/USD, EURUSD.pro) to internal model symbols
  let stdSymbol: MarketSymbol | null = null;
  const cleanSymbol = symbol.replace('/', '').toUpperCase();
  if (cleanSymbol.startsWith('EURUSD')) stdSymbol = 'EUR/USD';
  else if (cleanSymbol.startsWith('GBPUSD')) stdSymbol = 'GBP/USD';
  else if (cleanSymbol.startsWith('USDJPY')) stdSymbol = 'USD/JPY';
  else if (cleanSymbol.startsWith('BTCUSD') || cleanSymbol.startsWith('BTCUSDT')) stdSymbol = 'BTC/USDT';
  else if (cleanSymbol.startsWith('XAUUSD') || cleanSymbol.startsWith('GOLDUSD')) stdSymbol = 'GOLD/USD';

  if (!stdSymbol) {
    res.status(400).json({ error: `Unsupported symbol: ${symbol}` });
    return;
  }

  const result = simulator.updateFromMT5(stdSymbol, candles);
  if (result) {
    res.json({ success: true, message: `Successfully integrated MT5 data for ${stdSymbol}` });
  } else {
    res.status(500).json({ error: 'Failed to update simulator state' });
  }
});

// Endpoint to retrieve connection status of MT5 terminal
app.get('/api/mt5/status', (req, res) => {
  res.json(simulator.getMT5Status());
});

// get market statistics and candles
app.get('/api/market-data', (req, res) => {
  // Always verify open positions prior to returning data to guarantee fresh real-time financial accuracy
  checkAndAutoCloseTrades();

  const symbol = (req.query.symbol as MarketSymbol) || 'EUR/USD';
  const candles = simulator.getCandles(symbol);
  const fvgs = simulator.getFVGs(symbol);
  const obs = simulator.getOrderBlocks(symbol);
  const sweeps = simulator.getSweeps(symbol);
  const metrics = simulator.getMarketMetrics(symbol);

  res.json({
    candles,
    fvgs,
    obs,
    sweeps,
    metrics
  });
});

// get asset correlation matrix based on past 30 candle closes
app.get('/api/market-correlation', (req, res) => {
  const symbols: MarketSymbol[] = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP',
    'GOLD/USD', 'SILVER/USD',
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
    'US30', 'NAS100', 'GER40', 'SPX500'
  ];
  const matrix: Record<string, Record<string, number>> = {};
  const candleSeries: Record<string, number[]> = {};

  for (const sym of symbols) {
    const srvCandles = simulator.getCandles(sym) || [];
    candleSeries[sym] = srvCandles.slice(-30).map(c => c.close);
  }

  const pearsonCorrelation = (x: number[], y: number[]): number => {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 1.0; 
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
      sumYY += y[i] * y[i];
    }
    
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    if (den === 0) return 0;
    return num / den;
  };

  for (const s1 of symbols) {
    matrix[s1] = {};
    for (const s2 of symbols) {
      if (s1 === s2) {
        matrix[s1][s2] = 1.0;
      } else {
        const score = pearsonCorrelation(candleSeries[s1], candleSeries[s2]);
        matrix[s1][s2] = parseFloat(score.toFixed(3));
      }
    }
  }

  res.json({
    matrix,
    timestamp: new Date().toISOString()
  });
});

// get real-time market sentiment and state analysis
app.get('/api/market-sentiment', (req, res) => {
  const symbols: MarketSymbol[] = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP',
    'GOLD/USD', 'SILVER/USD',
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
    'US30', 'NAS100', 'GER40', 'SPX500'
  ];
  const sentimentMap: Record<string, any> = {};

  const now = new Date();

  for (const sym of symbols) {
    const metrics = simulator.getMarketMetrics(sym);
    const orderBook = simulator.getOrderBook(sym);
    
    // Split symbol into currencies, e.g. EUR, USD
    const parts = sym.split('/');
    const baseCur = parts[0];
    const quoteCur = parts[1] || 'USD'; // default to USD
    
    // Match events related to these currencies
    const relatedEvents = economicEvents.filter(ev => 
      ev.currency === baseCur || 
      ev.currency === quoteCur ||
      (sym === 'BTC/USDT' && ev.currency === 'USD') ||
      (sym === 'GOLD/USD' && ev.currency === 'USD')
    );

    // Calculate News Impact score and bias
    let newsScoreCumulative = 50;
    let highImpactSoon = false;
    let netImpactStrength = 0;

    relatedEvents.forEach(ev => {
      const evTime = new Date(ev.time);
      const diffMs = Math.abs(evTime.getTime() - now.getTime());
      const diffHours = diffMs / (1000 * 60 * 60);

      // We consider events within 36 hours of current time to catch relevant macro news
      if (diffHours <= 36) {
        let weight = 5;
        if (ev.impact === 'HIGH') {
          weight = 40;
          if (diffHours <= 6) {
            highImpactSoon = true;
          }
        } else if (ev.impact === 'MEDIUM') {
          weight = 20;
        }

        netImpactStrength += weight;
        
        // Deterministic directional bias of news:
        // Even length titles bias positive, odd length bias negative
        const biasDirection = ev.title.length % 2 === 0 ? 1 : -1;
        newsScoreCumulative += biasDirection * (weight * 0.4);
      }
    });

    // Clamp news score between 15 and 85
    const newsScore = Math.min(85, Math.max(15, newsScoreCumulative));

    // Technical score derived from rsi, daily bias, trend, orderbook imbalance
    let technicalScore = 50;
    if (metrics.rsi) {
      // RSI divergence from midpoint 50
      technicalScore += (metrics.rsi - 50) * 0.5;
    }
    if (metrics.dailyBias === 'BULLISH') technicalScore += 10;
    else if (metrics.dailyBias === 'BEARISH') technicalScore -= 10;

    if (metrics.trend === 'BULLISH') technicalScore += 8;
    else if (metrics.trend === 'BEARISH') technicalScore -= 8;

    // Orderbook imbalance factor (-100 to +100)
    if (orderBook && typeof orderBook.imbalance === 'number') {
      technicalScore += orderBook.imbalance * 0.12;
    }

    // Clamp technical score between 10 and 90
    const techClamped = Math.min(90, Math.max(10, technicalScore));

    // Weighted Overall Sentiment Index (0 to 100)
    const overallScore = Math.round(techClamped * 0.6 + newsScore * 0.4);

    // Identify Market State: 'Volatile' | 'Trending' | 'Mean Reverting'
    let state: 'Volatile' | 'Trending' | 'Mean Reverting' = 'Mean Reverting';
    
    const atrRatio = metrics.atr / metrics.currentPrice;
    
    // Thresholds: Volatility trigger
    // Crypto/Gold typically have higher volatility ratio, Forex is lower
    const isCryptoOrGold = sym === 'BTC/USDT' || sym === 'GOLD/USD';
    const volatilityThreshold = isCryptoOrGold ? 0.007 : 0.0016;

    if (atrRatio > volatilityThreshold || highImpactSoon || netImpactStrength > 50) {
      state = 'Volatile';
    } else if (metrics.trend !== 'NEUTRAL' || (metrics.rsi > 58 || metrics.rsi < 42)) {
      state = 'Trending';
    } else {
      state = 'Mean Reverting';
    }

    sentimentMap[sym] = {
      symbol: sym,
      overallScore, // 0 - 100
      technicalScore: Math.round(techClamped),
      newsScore: Math.round(newsScore),
      state,
      impactFactor: Math.min(100, Math.round(netImpactStrength)),
      currentPrice: metrics.currentPrice,
      rsi: Math.round(metrics.rsi),
      atr: metrics.atr,
      trend: metrics.trend,
      imbalance: Math.round(orderBook?.imbalance || 0),
      eventsCount: relatedEvents.length
    };
  }

  res.json({
    sentiment: sentimentMap,
    timestamp: new Date().toISOString()
  });
});

// get orderbook depth
app.get('/api/order-book', (req, res) => {
  const symbol = (req.query.symbol as MarketSymbol) || 'EUR/USD';
  const orderBook = simulator.getOrderBook(symbol);
  res.json(orderBook);
});

// get econ calendar
app.get('/api/forex-factory', (req, res) => {
  res.json(economicEvents);
});

// Get historical risk breaches
app.get('/api/risk/breaches', (req, res) => {
  checkForNewBreaches();
  res.json(readBreaches());
});

// Get Trades list
app.get('/api/trades', (req, res) => {
  checkAndAutoCloseTrades();
  const rawTrades = readTrades();
  const enrichedTrades = rawTrades.map(trade => {
    if (trade.status !== 'OPEN') {
      return trade;
    }

    const metrics = simulator.getMarketMetrics(trade.symbol);
    const curPrice = metrics ? metrics.currentPrice : trade.entryPrice;

    const pnlMultiplier = trade.side === 'BUY' ? 1 : -1;
    const priceDiff = curPrice - trade.entryPrice;
    let rawPnl = 0;
    if (trade.symbol === 'BTC/USDT') {
      rawPnl = priceDiff * trade.size * pnlMultiplier;
    } else if (trade.symbol === 'USD/JPY') {
      rawPnl = (priceDiff / 0.01) * trade.size * 0.1 * pnlMultiplier;
    } else {
      rawPnl = (priceDiff / 0.0001) * trade.size * 1.0 * pnlMultiplier;
    }
    const currentPnl = parseFloat(rawPnl.toFixed(2));

    const candlesList = simulator.getCandles(trade.symbol) || [];
    const historicCandles = candlesList.slice(-60);

    const trajectory = historicCandles.map((c, index) => {
      const cDiff = c.close - trade.entryPrice;
      let cPnl = 0;
      if (trade.symbol === 'BTC/USDT') {
        cPnl = cDiff * trade.size * pnlMultiplier;
      } else if (trade.symbol === 'USD/JPY') {
        cPnl = (cDiff / 0.01) * trade.size * 0.1 * pnlMultiplier;
      } else {
        cPnl = (cDiff / 0.0001) * trade.size * 1.0 * pnlMultiplier;
      }
      return {
        minute: index,
        pnl: parseFloat(cPnl.toFixed(2))
      };
    });

    return {
      ...trade,
      pnl: currentPnl,
      pnlTrajectory: trajectory
    };
  });
  res.json(enrichedTrades);
});

// Enter a trade
app.post('/api/trades', (req, res) => {
  const { symbol, side, entryPrice, stopLoss, takeProfit, size, reason, confidence, confluences } = req.body;
  if (!symbol || !side || !entryPrice || !stopLoss || !takeProfit || !size) {
    res.status(400).json({ error: 'Missing trade parameters.' });
    return;
  }

  const trades = readTrades();
  const newTrade: Trade = {
    id: `trade-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    symbol,
    side,
    entryPrice: parseFloat(entryPrice),
    stopLoss: parseFloat(stopLoss),
    takeProfit: parseFloat(takeProfit),
    size: parseFloat(size),
    status: 'OPEN',
    pnl: 0,
    timestamp: new Date().toISOString(),
    reason: reason || 'Entered via strategy trigger',
    confidence: confidence !== undefined ? parseFloat(confidence) : undefined,
    confluences: Array.isArray(confluences) ? confluences : undefined
  };

  trades.push(newTrade);
  writeTrades(trades);
  res.status(201).json(newTrade);
});

// Close a trade manually or due to trigger
app.post('/api/trades/:id/close', (req, res) => {
  const { id } = req.params;
  const { exitPrice } = req.body;

  const trades = readTrades();
  const tradeIndex = trades.findIndex(t => t.id === id);

  if (tradeIndex === -1) {
    res.status(404).json({ error: 'Trade not found.' });
    return;
  }

  const trade = trades[tradeIndex];
  if (trade.status === 'CLOSED') {
    res.status(400).json({ error: 'Trade already closed.' });
    return;
  }

  const price = exitPrice ? parseFloat(exitPrice) : simulator.getMarketMetrics(trade.symbol).currentPrice;
  const pnlMultiplier = trade.side === 'BUY' ? 1 : -1;
  const priceDiff = price - trade.entryPrice;
  
  // simple pip value conversion
  let rawPnl = 0;
  if (trade.symbol === 'BTC/USDT') {
    rawPnl = priceDiff * trade.size * pnlMultiplier;
  } else if (trade.symbol === 'USD/JPY') {
    rawPnl = (priceDiff / 0.01) * trade.size * 0.1 * pnlMultiplier;
  } else {
    rawPnl = (priceDiff / 0.0001) * trade.size * 1.0 * pnlMultiplier;
  }

  trade.status = 'CLOSED';
  trade.exitPrice = price;
  trade.pnl = parseFloat(rawPnl.toFixed(2));
  trade.exitTimestamp = new Date().toISOString();

  trades[tradeIndex] = trade;
  writeTrades(trades);
  res.json(trade);
});

// Update trade journal details (annotations, tags, sentiment ratings, screenshots)
app.post('/api/trades/:id/journal', (req, res) => {
  const { id } = req.params;
  const { annotation, tags, sentimentRating, screenshot } = req.body;

  const trades = readTrades();
  const tradeIndex = trades.findIndex(t => t.id === id);

  if (tradeIndex === -1) {
    res.status(404).json({ error: 'Trade not found.' });
    return;
  }

  const trade = trades[tradeIndex];
  
  trade.annotation = typeof annotation === 'string' ? annotation : trade.annotation;
  trade.tags = Array.isArray(tags) ? tags : trade.tags;
  trade.sentimentRating = typeof sentimentRating === 'string' ? sentimentRating : trade.sentimentRating;
  trade.screenshot = typeof screenshot === 'string' ? screenshot : trade.screenshot;

  trades[tradeIndex] = trade;
  writeTrades(trades);
  res.json(trade);
});

// Gemini RAG advisory chatbot model endpoint (Strictly Server-Side)
app.post('/api/gemini/analyze', async (req, res) => {
  const { prompt, history, currentSymbol } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const activeSymbol = currentSymbol || 'EUR/USD';
  const metrics = simulator.getMarketMetrics(activeSymbol);
  const fvgs = simulator.getFVGs(activeSymbol);
  const obs = simulator.getOrderBlocks(activeSymbol);

  // Compile active strategy indicators list as reference for Gemini context
  const contextString = `
Current Active Market context for ${activeSymbol}:
- Current Price: ${metrics.currentPrice}
- Daily Bio Bias: ${metrics.dailyBias} (50 EMA rule)
- RSI: ${metrics.rsi} (Threshold level)
- Average True Range (ATR 14): ${metrics.atr} (Volatility proxy)
- Plotted Order Blocks: ${JSON.stringify(obs.filter(o => !o.isBroken).slice(-2))}
- Plotted Fair Value Gaps (FVGs): ${JSON.stringify(fvgs.filter(f => !f.isMitigated).slice(-2))}
`;

  const systemInstruction = `
You are the Apex Institutional Elite Trading Agent, a quantitative trading coach trained thoroughly in "The Trading Bible" and Inner Circle Trader (ICT) core principles.
Your purpose is to provide users with pristine instructions on high timeframe (4H & Daily) trading set-ups.

Strict Guidelines you MUST follow based on "The Trading Bible" and ICT methodologies:
1. High Time Frame Swing Alignment: Always determine structural focus on 4H/Daily. If the price lies above the 50-period EMA, our daily structural bias is strictly BULLISH. Tell users to only focus on buy mitigation triggers. If price lies below, our focus is strictly BEARISH (sell setups only). Ignoring direction is retail noise of higher ruin.
2. Entry Triggers: We look for institutional displacement creating a clear "Fair Value Gap" (FVG) or an unbroken bullish/bearish "Order Block" (OB) on the 4H timeframe, combined with a "Market Structure Shift" (MSS) or Liquidity Sweeps of previous session highs/lows.
3. Risk Management: Explain calculated fractals based on the fixed fractional model risking no more than 1% of account equity. Instruct users to place their stop loss safely beyond the structural swing high/low that created the displacement gap. 
4. News Avoidance Doctrine: Always mention that high impact economic news (like NFP, CPI, etc.) requires immediate execution hold. Do not enter any trade 30 minutes before and after red news events.
5. Tone: Be authoritative, objective, hyper-quantitative, and professional. Speak in the term of elite capital preservation. Use crisp bullet points, bolding, and human-like clarity. Do not write filler.
`;

  const client = getGeminiClient();

  const getSimulatedResponse = (extraNotice: string = '') => {
    return `
### 🤖 APEX INSTITUTIONAL INSIGHT (Offline Model Simulation)

${extraNotice ? `*Notice: ${extraNotice}*\n` : ''}
I am providing a deterministic expert analysis of **${activeSymbol}** based on **The Trading Bible & ICT principles**:

1. **Higher Timeframe Alignment (Bias)**:
   - Current price reads **${metrics.currentPrice}**, sitting in a **${metrics.dailyBias}** market state (conforming to the 50-EMA rule).
   - *Trading Rule*: We are strictly seeking **${metrics.dailyBias === 'BULLISH' ? 'Long entries on discount pullbacks' : 'Short entries on premium retracements'}**.

2. **Market Structure & Footprints (OBs / FVGs)**:
   ${obs.filter(o => !o.isBroken && o.type === (metrics.dailyBias === 'BULLISH' ? 'BULLISH' : 'BEARISH')).length > 0
     ? `- Identified an active **${metrics.dailyBias} Order Block** near **${metrics.supportLevels[0] || metrics.currentPrice}**. This represents institutional buy walls.`
     : `- Scanning for upcoming displacement blocks. Wait for a Market Structure Shift (MSS) before execution.`}
   ${fvgs.filter(f => !f.isMitigated && f.type === metrics.dailyBias).length > 0
     ? `- A pristine **${metrics.dailyBias} Fair Value Gap** is open between **${fvgs[0].gapStart}** and **${fvgs[0].gapEnd}** on the 4H timeframe.`
     : `- Gap imbalances are currently filled. Wait for displacement.`}

3. **Risk & Sizing (Apex fixed fractional risk system)**:
   - Place your stop loss exactly outside the invalidation swing level. 
   - Rule check: Risk must be capped at exactly **1%** of total account equity. 

*Configuration tip*: Make sure you added your **GEMINI_API_KEY** in the Secrets panel on the side to support full live reasoning! Over time, the model will dynamically integrate active order book liquidations.
    `.trim();
  };

  if (!client) {
    console.warn('GoogleGenAI is running in simulation mode because GEMINI_API_KEY is not defined.');
    res.json({ text: getSimulatedResponse('Gemini API Key is not configured yet in the Settings > Secrets panel.') });
    return;
  }

  try {
    // Prepare complete query prompt
    const queryContent = `
Current Active Market context for ${activeSymbol}:
${contextString}

User Query: ${prompt}
    `;

    // Reconstruct conversation contents for generateContent
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        if (msg && msg.role && msg.parts && Array.isArray(msg.parts)) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: msg.parts.map((p: any) => ({ text: p.text || '' })),
          });
        }
      });
    }

    // Add the current query to contents list
    contents.push({
      role: 'user',
      parts: [{ text: queryContent }],
    });

    const result = await generateContentWithRetry(client, {
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.2, // Conservative trading mindset
      }
    });

    res.json({ text: result.text || 'Error generating trade guidance.' });

  } catch (error: any) {
    console.warn('Gemini generateContent transient bypass (falling back to ICT simulation mode):', error.message || error);
    // Graceful fallback to simulated output on API key failure/quota issues
    const notice = `Live API service unavailable (${error.message || 'Dynamic connection failure'}). Running offline ICT simulation:`;
    res.json({ text: getSimulatedResponse(notice) });
  }
});

interface CachedBriefing {
  narrative: string;
  majorThemes: string[];
  sentimentBias: string;
  volatilityIndex: string;
  economicAlarms: number;
  lastUpdated: string;
  isLive: boolean;
}

const BRIEFING_CACHE_FILE = path.join(process.cwd(), 'briefing_cache.json');

function saveBriefingToDisk(data: CachedBriefing): void {
  try {
    fs.writeFileSync(BRIEFING_CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn('Failed to save briefing to disk:', err);
  }
}

function loadBriefingFromDisk(): CachedBriefing | null {
  try {
    if (fs.existsSync(BRIEFING_CACHE_FILE)) {
      const dataStr = fs.readFileSync(BRIEFING_CACHE_FILE, 'utf-8').trim();
      if (dataStr) {
        return JSON.parse(dataStr) as CachedBriefing;
      }
    }
  } catch (err) {
    console.warn('Failed to load briefing from disk:', err);
  }
  return null;
}

let cachedBriefingSnapshot: CachedBriefing | null = loadBriefingFromDisk();
let lastBriefingTime = cachedBriefingSnapshot ? new Date(cachedBriefingSnapshot.lastUpdated).getTime() : 0;
const BRIEFING_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours cache TTL to preserve client quota limit

// GET Endpoint for Morning Daily Briefing (combining news and confluences)
app.get('/api/market-briefing', async (req, res) => {
  const force = req.query.force === 'true';
  const now = new Date();

  // If cache is valid and not forced, return cached briefing directly to bypass Gemini calls and prevent 429 quota exhaustion
  if (cachedBriefingSnapshot && !force && (now.getTime() - lastBriefingTime) < BRIEFING_CACHE_TTL) {
    res.json(cachedBriefingSnapshot);
    return;
  }

  const symbols: MarketSymbol[] = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP',
    'GOLD/USD', 'SILVER/USD',
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
    'US30', 'NAS100', 'GER40', 'SPX500'
  ];

  // 1. Gather all current indicators
  const marketDetails = symbols.map(sym => {
    const metrics = simulator.getMarketMetrics(sym);
    const fvgs = simulator.getFVGs(sym);
    const obs = simulator.getOrderBlocks(sym);
    return {
      symbol: sym,
      currentPrice: metrics.currentPrice,
      dailyBias: metrics.dailyBias,
      trend: metrics.trend,
      rsi: metrics.rsi,
      atr: metrics.atr,
      openFvgsCount: fvgs.filter(f => !f.isMitigated).length,
      unbrokenObsCount: obs.filter(o => !o.isBroken).length
    };
  });

  // 2. Compute high-impact upcoming events
  let highImpactEventsCount = 0;
  const todayEvents = economicEvents.filter(ev => {
    const evTime = new Date(ev.time);
    const diffMs = Math.abs(evTime.getTime() - now.getTime());
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours <= 36) {
      if (ev.impact === 'HIGH') {
        highImpactEventsCount++;
      }
      return true;
    }
    return false;
  });

  // 3. Compute dynamic market mood parameters
  const bullishBiases = marketDetails.filter(m => m.dailyBias === 'BULLISH').length;
  const bearishBiases = marketDetails.filter(m => m.dailyBias === 'BEARISH').length;
  const sentimentBias = bullishBiases > bearishBiases ? 'BULLISH' : (bearishBiases > bullishBiases ? 'BEARISH' : 'MIXED');

  const volatilityIndex = highImpactEventsCount >= 2 ? 'HIGH' : (highImpactEventsCount === 1 ? 'MEDIUM' : 'LOW');

  const majorThemes = [
    sentimentBias === 'BULLISH' 
      ? `Systematic global order flow favors Risk-On assets with key dollar rotations.` 
      : sentimentBias === 'BEARISH'
      ? `Elevated safe-haven hedging as macroeconomic risk variables compress indexes.`
      : `Broad range correlation cycles leading to structural compression across Forex pairs.`,
    highImpactEventsCount > 0
      ? `Macro Alert: Red-folder high-volatility scheduled news releases require defense.`
      : `Consolidation mode dominates with no high timeframe news triggers scheduled.`,
    `ICT Playbook rule dictates waiting for high/low liquidity sweeps of the previous sessions.`
  ];

  const client = getGeminiClient();

  const getSimulatedBriefing = () => {
    const eurMD = marketDetails.find(m => m.symbol === 'EUR/USD') || { currentPrice: 1.0850, dailyBias: 'BULLISH', trend: 'BULLISH', rsi: 52 };
    const goldMD = marketDetails.find(m => m.symbol === 'GOLD/USD') || { currentPrice: 2350.0, dailyBias: 'BEARISH', trend: 'NEUTRAL', rsi: 48 };
    const btcMD = marketDetails.find(m => m.symbol === 'BTC/USDT') || { currentPrice: 67200.0, dailyBias: 'BULLISH', trend: 'BULLISH', rsi: 61 };
    const jpyMD = marketDetails.find(m => m.symbol === 'USD/JPY') || { currentPrice: 156.40, dailyBias: 'BULLISH', trend: 'BULLISH', rsi: 55 };

    return `### 🌅 APEX INSTITUTIONAL MORNING DAILY BRIEF

**Date Directive**: June 3, 2026 (Morning Session Analysis)
**Security Handshake State**: SMC Strategic Assessment
**Overall Sentiment Indicator**: **${sentimentBias}** Momentum Zone
**Asset Volatility index**: **${volatilityIndex}** Index

---

#### 1. Core Macro Narrative & Bias State
Currently, our multi-pair consensus bias registers as a **${sentimentBias}** framework. Intraday correlation charts reflect active algorithmic adjustments following high timeframe structure shifts.

*   **EUR/USD**: Current price averages **${eurMD.currentPrice.toFixed(4)}**, showing a **${eurMD.dailyBias}** bias (${eurMD.trend} trend, RSI: ${Math.round(eurMD.rsi)}).
*   **GOLD/USD**: Safe-haven demand averages **$${goldMD.currentPrice.toFixed(2)}** demonstrating a **${goldMD.dailyBias}** daily bias context.
*   **BTC/USDT**: Consolidating at **$${btcMD.currentPrice.toFixed(0)}** indicating a **${btcMD.dailyBias}** bias.
*   **USD/JPY**: Currently at **${jpyMD.currentPrice.toFixed(2)}** on a **${jpyMD.dailyBias}** profile.

---

#### 2. Liquidity & Order Block Plotted footprint
*   **EUR/USD Key Zones**: Look to capture discounted orderblock mitigations near the primary 4H institutional support level. Avoid middle range noise.
*   **GOLD/USD Key Zones**: High tension is recorded across defensive grids. Unmitigated Fair Value Gaps (FVGs) remain open below the current price, creating strong magnetic targets.
*   **BTC/USDT Key Zones**: Trading tight inside active session ranges. Breakout sweeps of Asian session highs are expected to trigger rapid displacement.

---

#### 3. High-Impact News Alerts & Protocols
*   We detect **${highImpactEventsCount} high impact red folder event(s)** on today's economic schedule.
*   *Protocol Reminder*: Strictly adhere to the **30-Minute News Avoidance Doctrine** around major release slots to safeguard institutional equity from slippage.

---

#### 4. Tactical Directives
*   Maintain complete capital safety capping any session exposure to exactly **1% risk**.
*   Verify structure alignment on the high timeframes (4H/Daily EMA grids) before selecting order triggers.
    `.trim();
  };

  if (!client) {
    res.json({
      narrative: getSimulatedBriefing(),
      majorThemes,
      sentimentBias,
      volatilityIndex,
      economicAlarms: highImpactEventsCount,
      lastUpdated: now.toISOString(),
      isLive: false
    });
    return;
  }

  try {
    const promptMessage = `
System Time: ${now.toISOString()} (Morning Session Analysis)
Act as the Senior Market Strategist. Parse the daily economic news impact and active indicator confluences below and synthesize an elegant daily morning market briefing narrative.

Here is the current state of our multi-asset simulator:
${JSON.stringify(marketDetails, null, 2)}

Here are today's scheduled economic events:
${JSON.stringify(todayEvents, null, 2)}

Provide a beautiful, highly professional and detailed narrative outlining the expected global daily flows, ICT/SMC levels, and macroeconomic cautions.
    `;

    const result = await generateContentWithRetry(client, {
      model: 'gemini-3.5-flash',
      contents: promptMessage,
      config: {
        systemInstruction: `You are the chief quantitative macro analyst for an institutional prop trading firm. You operate under 'The Trading Bible' and Inner Circle Trader (SMC) principles. Output should be highly professional, structured, and objective. Avoid clickbait or casual phrases.`,
        temperature: 0.1, // Highly precise and consistent
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrative: {
              type: Type.STRING,
              description: "Markdown formatted string: morning session overview, SMC technical level analysis (OBs, FVGs), currency specific outlooks, and news warning guidelines."
            },
            majorThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 concise session themes representing the macroeconomic narrative headlines."
            },
            sentimentBias: {
              type: Type.STRING,
              description: "Consensus sentiment, must be exactly: BULLISH, BEARISH, or MIXED."
            },
            volatilityIndex: {
              type: Type.STRING,
              description: "Overall expected volatility, must be exactly: HIGH, MEDIUM, or LOW."
            }
          },
          required: ["narrative", "majorThemes", "sentimentBias", "volatilityIndex"]
        }
      }
    });

    const briefText = result.text;
    if (briefText) {
      const parsed = JSON.parse(briefText.trim());
      const payload = {
        narrative: parsed.narrative,
        majorThemes: parsed.majorThemes || majorThemes,
        sentimentBias: parsed.sentimentBias || sentimentBias,
        volatilityIndex: parsed.volatilityIndex || volatilityIndex,
        economicAlarms: highImpactEventsCount,
        lastUpdated: now.toISOString(),
        isLive: true
      };

      // Save to server cache
      cachedBriefingSnapshot = payload;
      lastBriefingTime = now.getTime();
      saveBriefingToDisk(payload);

      res.json(payload);
    } else {
      throw new Error('Gemini model returned empty response body');
    }

  } catch (err: any) {
    console.warn('Gemini briefing generation transient bypass (falling back to ICT simulated briefing):', err.message || err);
    
    // EXTREME RESILIENCE: If we have an existing cached live briefing (even if expired or from previous load), 
    // return that to the client rather than resorting to default offline mock/dummy data!
    if (cachedBriefingSnapshot) {
      res.json({
        ...cachedBriefingSnapshot,
        lastUpdated: now.toISOString(), // indicate serving timestamp
        isCachedFallback: true
      });
      return;
    }

    res.json({
      narrative: getSimulatedBriefing(),
      majorThemes,
      sentimentBias,
      volatilityIndex,
      economicAlarms: highImpactEventsCount,
      lastUpdated: now.toISOString(),
      isLive: false,
      err: err.message
    });
  }
});

// Mount Vite middleware for development, handle production static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Apex Server] Running full-stack environment at http://0.0.0.0:${PORT}`);
  });
}

startServer();
