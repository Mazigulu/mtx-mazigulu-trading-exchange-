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
import { MarketSimulator } from './server/market';
import { MarketSymbol, Trade, NewsEvent, BreachEvent } from './src/types';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import { trades as tradesTable, users as usersTable } from './src/db/schema.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { eq, and, desc } from 'drizzle-orm';
import { adminDb } from './src/lib/firebase-admin.ts';


const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Market Simulator
const simulator = new MarketSimulator();

// Setup breaches database filename
const BREACH_DB_FILE = path.join(process.cwd(), 'breaches_db.json');

function readBreaches(): BreachEvent[] {
  try {
    if (!fs.existsSync(BREACH_DB_FILE)) {
      const initialBreaches: BreachEvent[] = [
        {
          id: "breach-1",
          timestamp: "2026-06-04T14:30:00Z",
          symbol: "NVDA",
          exposure: 1.95,
          pnlAtBreach: -195.00,
          reason: "Sudden earnings-related volatility spike triggered stop-loss aggregate deviation."
        },
        {
          id: "breach-2",
          timestamp: "2026-06-03T20:15:22Z",
          symbol: "AAPL",
          exposure: 1.62,
          pnlAtBreach: -162.00,
          reason: "Intraday resistance breakout exceeded localized asset-class limit cap."
        },
        {
          id: "breach-3",
          timestamp: "2026-06-02T10:05:11Z",
          symbol: "TSLA",
          exposure: 1.58,
          pnlAtBreach: -158.00,
          reason: "High volatility pre-market volume exceeded localized risk tolerances."
        },
        {
          id: "breach-4",
          timestamp: "2026-05-31T15:42:00Z",
          symbol: "SPX500",
          exposure: 1.74,
          pnlAtBreach: -174.00,
          reason: "Overlapping directional buy lots triggered systemic margin escalation warning."
        },
        {
          id: "breach-5",
          timestamp: "2026-05-28T09:12:45Z",
          symbol: "NAS100",
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

async function checkForNewBreaches(): Promise<void> {
  try {
    const openTrades = await db.select()
      .from(tradesTable)
      .where(eq(tradesTable.status, 'OPEN'));
    if (openTrades.length === 0) return;

    let totalRiskAtStake = 0;
    openTrades.forEach((t) => {
      const metrics = simulator.getMarketMetrics(t.symbol as MarketSymbol);
      const curPrice = metrics ? metrics.currentPrice : t.entryPrice;
      const slDistance = Math.abs(t.entryPrice - t.stopLoss);
      
      let tradeRiskDollar = 0;
      if (['AAPL', 'MSFT', 'NVDA', 'TSLA'].includes(t.symbol)) {
        tradeRiskDollar = slDistance * t.size * 100;
      } else {
        tradeRiskDollar = slDistance * t.size * 10;
      }
      
      totalRiskAtStake += Math.max(tradeRiskDollar, 50);
    });

    const portfolioRiskPercent = parseFloat(((totalRiskAtStake / 10000) * 100).toFixed(2));
    
    if (portfolioRiskPercent > 1.5) {
      const breaches = readBreaches();
      
      // Determine dominant symbol causing risk
      let maxRiskSymbol = openTrades[0]?.symbol || 'AAPL';
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
          symbol: maxRiskSymbol as MarketSymbol,
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
    currency: 'NVDA',
    title: 'NVIDIA Corp. Q2 Earnings Release & Forward Guidance',
    time: '2026-06-01T14:00:00Z',
    impact: 'HIGH',
    forecast: 'EPS: $0.64 | Rev: $28.5B',
    previous: 'EPS: $0.59 | Rev: $26.0B',
    actual: undefined,
  },
  {
    id: 'news-2',
    currency: 'MSFT',
    title: 'Microsoft SEC Form 4 (CEO Satya Nadella Insider Purchase $20M)',
    time: '2026-06-02T08:30:00Z',
    impact: 'MEDIUM',
    forecast: 'Insider BUY',
    previous: 'N/A',
    actual: 'Form 4 Filed',
  },
  {
    id: 'news-3',
    currency: 'AAPL',
    title: 'Apple Inc. WWDC Keynote: AI System Integration Framework',
    time: '2026-06-03T17:00:00Z',
    impact: 'HIGH',
    forecast: 'Keynote Launch',
    previous: 'N/A',
    actual: undefined,
  },
  {
    id: 'news-4',
    currency: 'TSLA',
    title: 'Tesla, Inc. Q2 Vehicle Production & Delivery Numbers',
    time: '2026-06-04T13:00:00Z',
    impact: 'HIGH',
    forecast: 'Deliveries: 442K',
    previous: 'Deliveries: 412K',
    actual: undefined,
  },
  {
    id: 'news-5',
    currency: 'GOOG',
    title: 'Alphabet Inc. SEC Form 10-Q (Quarterly Financial Disclosure)',
    time: '2026-06-04T15:30:00Z',
    impact: 'LOW',
    forecast: 'Form 10-Q',
    previous: 'N/A',
    actual: 'Filing Ingress',
  },
  {
    id: 'news-6',
    currency: 'META',
    title: 'Meta Platforms Inc. Cash Dividend Declaration ($0.50/share)',
    time: '2026-06-05T12:30:00Z',
    impact: 'MEDIUM',
    forecast: '$0.50 Payout',
    previous: '$0.50 Payout',
    actual: undefined,
  }
];

function getSymbolPrecision(sym: string): number {
  return 2;
}

function calculateTradePnL(sym: string, entryPrice: number, currentPrice: number, size: number, side: string): number {
  const pnlMultiplier = side === 'BUY' ? 1 : -1;
  const priceDiff = currentPrice - entryPrice;
  
  if (['AAPL', 'MSFT', 'NVDA', 'TSLA'].includes(sym)) {
    return priceDiff * size * 100 * pnlMultiplier;
  } else {
    return priceDiff * size * 10 * pnlMultiplier;
  }
}

// Auto close trades check in PostgreSQL
async function checkAndAutoCloseTrades(): Promise<void> {
  try {
    const openTrades = await db.select()
      .from(tradesTable)
      .where(eq(tradesTable.status, 'OPEN'));

    for (const t of openTrades) {
      const metrics = simulator.getMarketMetrics(t.symbol as MarketSymbol);
      const curPrice = metrics ? metrics.currentPrice : t.entryPrice;
      
      let currentStopLoss = t.stopLoss;
      let currentTakeProfit = t.takeProfit;
      let autoBeTriggered = t.autoBreakEvenTriggered;
      let currentReason = t.reason || '';

      let maxPrice = t.maxPriceReached ?? curPrice;
      let minPrice = t.minPriceReached ?? curPrice;

      let changed = false;

      if (curPrice > maxPrice) {
        maxPrice = curPrice;
        changed = true;
      }
      if (curPrice < minPrice) {
        minPrice = curPrice;
        changed = true;
      }

      // Trailing Stop Loss (TSL) and Liquidity-Adjusted Volatility Trailing Stop (LAV-TSL) Logic
      if (t.lavTslActive) {
        const liveAtr = metrics ? metrics.atr : (t.symbol.includes('USDT') ? 450 : t.symbol.includes('JPY') ? 0.35 : 0.0035);
        let multiplier = t.lavTslAtrMultiplier || 2.0;

        // Tighter risk management as profit accrues (profit tightening active)
        if (t.lavTslTighteningActive) {
          const profitPct = Math.max(0, t.side === 'BUY' 
            ? (curPrice - t.entryPrice) / t.entryPrice 
            : (t.entryPrice - curPrice) / t.entryPrice
          );
          // Scale multiplier down by up to 45% based on trade expansion
          const scale = Math.min(0.45, profitPct * 25.0);
          multiplier = multiplier * (1 - scale);
        }

        let dist = liveAtr * multiplier;
        const precision = getSymbolPrecision(t.symbol);

        if (t.side === 'BUY') {
          let potentialSL = maxPrice - dist;

          // Align stop-loss behind market liquidity zones (order block support levels)
          if (t.lavTslLiquidityActive && metrics && metrics.supportLevels && metrics.supportLevels.length > 0) {
            const validSupports = metrics.supportLevels.filter(s => s < curPrice && s > potentialSL);
            if (validSupports.length > 0) {
              const highestSupport = Math.max(...validSupports);
              // Safe cushion below the support level
              const adjustedSL = highestSupport - (0.2 * liveAtr);
              if (adjustedSL > potentialSL && adjustedSL < curPrice - (0.4 * liveAtr)) {
                potentialSL = adjustedSL;
              }
            }
          }

          if (potentialSL > currentStopLoss) {
            currentStopLoss = parseFloat(potentialSL.toFixed(precision));
            changed = true;
            currentReason = `${currentReason} [LAV-TSL trailing SL raised to ${currentStopLoss} behind liquidity/volatility peak ${maxPrice.toFixed(precision)}]`.trim();
          }
        } else { // SELL
          let potentialSL = minPrice + dist;

          // Align stop-loss behind market liquidity zones (order block resistance levels)
          if (t.lavTslLiquidityActive && metrics && metrics.resistanceLevels && metrics.resistanceLevels.length > 0) {
            const validResistances = metrics.resistanceLevels.filter(r => r > curPrice && r < potentialSL);
            if (validResistances.length > 0) {
              const lowestResistance = Math.min(...validResistances);
              // Safe cushion above the resistance level
              const adjustedSL = lowestResistance + (0.2 * liveAtr);
              if (adjustedSL < potentialSL && adjustedSL > curPrice + (0.4 * liveAtr)) {
                potentialSL = adjustedSL;
              }
            }
          }

          if (potentialSL < currentStopLoss) {
            currentStopLoss = parseFloat(potentialSL.toFixed(precision));
            changed = true;
            currentReason = `${currentReason} [LAV-TSL trailing SL lowered to ${currentStopLoss} behind liquidity/volatility trough ${minPrice.toFixed(precision)}]`.trim();
          }
        }
      } else if (t.trailingStopActive && t.trailingStopDistance) {
        const dist = t.trailingStopDistance;
        if (t.side === 'BUY') {
          const potentialSL = maxPrice - dist;
          if (potentialSL > currentStopLoss) {
            const precision = getSymbolPrecision(t.symbol);
            currentStopLoss = parseFloat(potentialSL.toFixed(precision));
            changed = true;
            currentReason = `${currentReason} [Trailing SL raised to ${currentStopLoss} tracking peak ${maxPrice.toFixed(precision)}]`.trim();
          }
        } else { // SELL
          const potentialSL = minPrice + dist;
          if (potentialSL < currentStopLoss) {
            const precision = getSymbolPrecision(t.symbol);
            currentStopLoss = parseFloat(potentialSL.toFixed(precision));
            changed = true;
            currentReason = `${currentReason} [Trailing SL lowered to ${currentStopLoss} tracking trough ${minPrice.toFixed(precision)}]`.trim();
          }
        }
      }

      // Self-Adjusting Take Profit (TTP) Logic
      if (t.trailingTakeProfitActive) {
        if (t.side === 'BUY') {
          const targetDistance = t.takeProfit - t.entryPrice;
          const triggerThreshold = t.takeProfit - (targetDistance * 0.15);
          if (curPrice >= triggerThreshold && currentTakeProfit === t.takeProfit) {
            const extension = targetDistance * 0.5;
            const precision = getSymbolPrecision(t.symbol);
            const newTP = parseFloat((t.takeProfit + extension).toFixed(precision));
            const newSL = parseFloat((t.takeProfit - (targetDistance * 0.05)).toFixed(precision));
            
            currentTakeProfit = newTP;
            currentStopLoss = newSL;
            changed = true;
            currentReason = `${currentReason} [Self-Adjusting TP: Extended target to ${newTP} and locked trade profit SL at ${newSL}]`.trim();
          }
        } else { // SELL
          const targetDistance = t.entryPrice - t.takeProfit;
          const triggerThreshold = t.takeProfit + (targetDistance * 0.15);
          if (curPrice <= triggerThreshold && currentTakeProfit === t.takeProfit) {
            const extension = targetDistance * 0.5;
            const precision = getSymbolPrecision(t.symbol);
            const newTP = parseFloat((t.takeProfit - extension).toFixed(precision));
            const newSL = parseFloat((t.takeProfit + (targetDistance * 0.05)).toFixed(precision));
            
            currentTakeProfit = newTP;
            currentStopLoss = newSL;
            changed = true;
            currentReason = `${currentReason} [Self-Adjusting TP: Extended target to ${newTP} and locked trade profit SL at ${newSL}]`.trim();
          }
        }
      }

      if (t.autoBreakEvenProfitPct && !autoBeTriggered) {
        const pnlMultiplier = t.side === 'BUY' ? 1 : -1;
        const priceDiff = curPrice - t.entryPrice;
        const profitPct = (priceDiff / t.entryPrice) * 100 * pnlMultiplier;

        if (profitPct >= t.autoBreakEvenProfitPct) {
          currentStopLoss = t.entryPrice;
          autoBeTriggered = true;
          changed = true;
          currentReason = `${currentReason} [Auto-Break-Even: SL moved to entry price ${t.entryPrice} because trade hit target profit of ${t.autoBreakEvenProfitPct}%]`.trim();
        }
      }

      let shouldClose = false;
      let triggerPrice = curPrice;
      let closingReason = '';

      if (t.side === 'BUY') {
        if (curPrice <= currentStopLoss) {
          shouldClose = true;
          triggerPrice = currentStopLoss;
          closingReason = `Auto Closed: SL hit at ${currentStopLoss}`;
        } else if (curPrice >= currentTakeProfit) {
          shouldClose = true;
          triggerPrice = currentTakeProfit;
          closingReason = `Auto Closed: TP hit at ${currentTakeProfit}`;
        }
      } else { // SELL
        if (curPrice >= currentStopLoss) {
          shouldClose = true;
          triggerPrice = currentStopLoss;
          closingReason = `Auto Closed: SL hit at ${currentStopLoss}`;
        } else if (curPrice <= currentTakeProfit) {
          shouldClose = true;
          triggerPrice = currentTakeProfit;
          closingReason = `Auto Closed: TP hit at ${currentTakeProfit}`;
        }
      }

      if (shouldClose) {
        const rawPnl = calculateTradePnL(t.symbol, t.entryPrice, triggerPrice, t.size, t.side);

        await db.update(tradesTable)
          .set({
            status: 'CLOSED',
            exitPrice: parseFloat(triggerPrice.toFixed(getSymbolPrecision(t.symbol))),
            pnl: parseFloat(rawPnl.toFixed(2)),
            exitTimestamp: new Date().toISOString(),
            reason: closingReason,
            stopLoss: currentStopLoss,
            takeProfit: currentTakeProfit,
            maxPriceReached: maxPrice,
            minPriceReached: minPrice,
            autoBreakEvenTriggered: autoBeTriggered
          })
          .where(eq(tradesTable.id, t.id));
      } else if (changed ||
        currentStopLoss !== t.stopLoss || 
        currentTakeProfit !== t.takeProfit || 
        autoBeTriggered !== t.autoBreakEvenTriggered ||
        maxPrice !== t.maxPriceReached ||
        minPrice !== t.minPriceReached
      ) {
        await db.update(tradesTable)
          .set({
            stopLoss: currentStopLoss,
            takeProfit: currentTakeProfit,
            autoBreakEvenTriggered: autoBeTriggered,
            maxPriceReached: maxPrice,
            minPriceReached: minPrice,
            reason: currentReason
          })
          .where(eq(tradesTable.id, t.id));
      }
    }
  } catch (err) {
    console.error('Error in checkAndAutoCloseTrades background loop:', err);
  }
}

// Express API Routes

// Endpoint to retrieve diagnostics for the TradingView RapidAPI connection
app.get('/api/tradingview/status', (req, res) => {
  const apiKey = process.env.RAPIDAPI_KEY;
  const statusObj = {
    apiKeyConfigured: !!apiKey && apiKey !== 'MY_RAPIDAPI_KEY' && apiKey.trim() !== '',
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPlaceholder: apiKey === 'MY_RAPIDAPI_KEY',
    lastTvStatus: simulator.lastTvStatus
  };
  try {
    fs.writeFileSync(path.join(process.cwd(), 'tv_api_status.json'), JSON.stringify(statusObj, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to write tv_api_status.json:', err);
  }
  res.json(statusObj);
});

// get market statistics and candles
app.get('/api/market-data', async (req, res) => {
  // Always verify open positions prior to returning data to guarantee fresh real-time financial accuracy
  checkAndAutoCloseTrades();

  const symbol = (req.query.symbol as MarketSymbol) || 'AAPL';
  
  // Dynamically load real-time data from TradingView if RAPIDAPI_KEY is available
  await simulator.fetchTradingViewData(symbol);

  // Write status to file for diagnostics
  const apiKey = process.env.RAPIDAPI_KEY;
  const statusObj = {
    apiKeyConfigured: !!apiKey && apiKey !== 'MY_RAPIDAPI_KEY' && apiKey.trim() !== '',
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPlaceholder: apiKey === 'MY_RAPIDAPI_KEY',
    lastTvStatus: simulator.lastTvStatus
  };
  try {
    fs.writeFileSync(path.join(process.cwd(), 'tv_api_status.json'), JSON.stringify(statusObj, null, 2), 'utf8');
  } catch (err) {
    // silent fallback
  }

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

// get latest prices for all symbols in the simulator
app.get('/api/market-prices', (req, res) => {
  const result: Record<string, number> = {};
  const symbols = [
    'US30', 'NAS100', 'GER40', 'SPX500', 'AAPL', 'MSFT', 'NVDA', 'TSLA'
  ];
  for (const sym of symbols) {
    const candles = simulator.getCandles(sym as MarketSymbol) || [];
    if (candles.length > 0) {
      result[sym] = candles[candles.length - 1].close;
    } else {
      result[sym] = 0;
    }
  }
  res.json(result);
});

// get asset correlation matrix based on past 30 candle closes
app.get('/api/market-correlation', (req, res) => {
  const symbols: MarketSymbol[] = [
    'US30', 'NAS100', 'GER40', 'SPX500', 'AAPL', 'MSFT', 'NVDA', 'TSLA'
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
  try {
    const symbols: MarketSymbol[] = [
      'US30', 'NAS100', 'GER40', 'SPX500', 'AAPL', 'MSFT', 'NVDA', 'TSLA'
    ];
    const sentimentMap: Record<string, any> = {};

    const now = new Date();

    for (const sym of symbols) {
      const metrics = simulator.getMarketMetrics(sym);
      if (!metrics) {
        continue;
      }
      const orderBook = simulator.getOrderBook(sym);
      
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

      // Weighted Overall Sentiment Index (0 to 100) - pure technical without news
      const overallScore = Math.round(techClamped);

      // Identify Market State: 'Volatile' | 'Trending' | 'Mean Reverting'
      let state: 'Volatile' | 'Trending' | 'Mean Reverting' = 'Mean Reverting';
      
      const atrRatio = metrics.atr / metrics.currentPrice;
      
      // Thresholds: Volatility trigger
      const volatilityThreshold = 0.007;

      if (atrRatio > volatilityThreshold) {
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
        newsScore: 50,
        state,
        impactFactor: 0,
        currentPrice: metrics.currentPrice,
        rsi: Math.round(metrics.rsi),
        atr: metrics.atr,
        trend: metrics.trend,
        imbalance: Math.round(orderBook?.imbalance || 0),
        eventsCount: 0
      };
    }

    res.json({
      sentiment: sentimentMap,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.warn('[Sentiment API Error]:', error.message || error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// get orderbook depth
app.get('/api/order-book', (req, res) => {
  const symbol = (req.query.symbol as MarketSymbol) || 'AAPL';
  const orderBook = simulator.getOrderBook(symbol);
  res.json(orderBook);
});

// get econ calendar
app.get('/api/economic-calendar', (req, res) => {
  res.json([]);
});

// Also keep fallback alias for compatibility
app.get('/api/forex-factory', (req, res) => {
  res.json([]);
});

// Live Institutional News Ticker Cache and Aggregator
const defaultInstitutionalNews = [
  {
    id: "term-1",
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    title: "BREAKING: Federal Reserve Meeting Minutes indicate hawkish consensus on holding rates until Q4 inflation moderation.",
    excerpt: "Federal Open Market Committee members raised concern over robust service-sector wage indices. While some members advocated for structural balance sheet taper adjustments, the consensus remains tilted toward long-term elevation of sovereign cost-of-capital markers.",
    source: "Apex Intelligence Terminal",
    impact: "CRITICAL",
    category: "MACRO",
    symbol: "GLOBAL",
    sentiment: "BEARISH",
    readTimeMins: 3
  },
  {
    id: "term-2",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    title: "CORPORATE ALERT: Institutional Whales accumulate Microsoft (MSFT) stock via dark pools.",
    excerpt: "Institutional orderflow metrics indicate the largest single aggregate block purchase of MSFT from public centralized exchanges since early February. Historically, large dark pool sweeps precede long-term multi-week expansion legs.",
    source: "Interbank Liquidity Scan",
    impact: "HIGH",
    category: "LIQUIDITY",
    symbol: "MSFT",
    sentiment: "BULLISH",
    readTimeMins: 2
  },
  {
    id: "term-3",
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    title: "SEMICONDUCTORS: Nvidia (NVDA) Blackwell chip demand surges as hyper-scalers scale up AI infrastructure.",
    excerpt: "Analyst reports state semiconductor supply pressures are rising, and backlogs extend through Q4. High demand indicates robust corporate capital expenditures across tech giants, supporting risk-on equity market biases.",
    source: "Bloomberg Technology Feed",
    impact: "MEDIUM",
    category: "MACRO",
    symbol: "NVDA",
    sentiment: "BULLISH",
    readTimeMins: 4
  },
  {
    id: "term-4",
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    title: "REGULATORY WATCH: CFTC Chairman requests heightened oversight on digital currency clearing structures.",
    excerpt: "Speaking at the Chicago Derivatives Symposium, the chairman emphasized that current clearing systems lack the localized capital buffers necessary to withstand high-leveraged algorithmic stop runs under stressed liquidity regimes.",
    source: "Federal Clearing Bulletin",
    impact: "HIGH",
    category: "REGULATORY",
    symbol: "GLOBAL",
    sentiment: "BEARISH",
    readTimeMins: 5
  },
  {
    id: "term-5",
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    title: "FOREX DATA: USD/JPY slides below 156.00 following suspicious BoJ currency stabilization liquidity bids.",
    excerpt: "Market makers observed a sudden $4.2B USD block sale of US Treasuries matching Ministry of Finance accounts. Analysts suspect direct market stabilization sweeps are active under official auspices to protect currency floor levels.",
    source: "Reuters FX Feed",
    impact: "CRITICAL",
    category: "FOREX",
    symbol: "USD/JPY",
    sentiment: "BEARISH",
    readTimeMins: 3
  },
  {
    id: "term-6",
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    title: "INDEX FUNDS: Institutional stock portfolios expand by record inflows in monthly sovereign reporting.",
    excerpt: "Emerging market sovereign reserves continue aggressive rotation into premium stock indices. Equity premium surges over bond yields as physical sovereign wealth funds report massive allocation pipelines.",
    source: "Sovereign Reserves Registry",
    impact: "MEDIUM",
    category: "MACRO",
    symbol: "SPX500",
    sentiment: "BULLISH",
    readTimeMins: 2
  }
];

let cachedInstitutionalNews: any[] = [...defaultInstitutionalNews];
let lastNewsFetchTime = 0;

async function fetchLiveRSSNews(): Promise<any[]> {
  const feeds = [
    { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', source: 'CNBC Stocks', defaultCategory: 'MACRO' },
    { url: 'https://www.cnbc.com/id/15839069/device/rss/rss.html', source: 'CNBC Business', defaultCategory: 'MACRO' }
  ];
  
  const fetchedAlerts: any[] = [];
  
  for (const feed of feeds) {
    try {
      // Fetch via rss2json API to keep XML-parsing natively serverless and dependency-free
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
      const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(3500) });
      if (!response.ok) continue;
      
      const data = await response.json();
      if (data && data.items && Array.isArray(data.items)) {
        data.items.slice(0, 10).forEach((item: any, idx: number) => {
          const title = item.title || "";
          const excerpt = item.description ? item.description.replace(/<[^>]*>/g, '').slice(0, 280) + '...' : "";
          const id = `rss-${feed.source.toLowerCase()}-${idx}-${Date.now().toString().slice(-4)}`;
          
          // Heuristic parser for symbol, categories, impact, and sentiments
          const lowercaseTitle = title.toLowerCase() + " " + excerpt.toLowerCase();
          
          let impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
          if (lowercaseTitle.includes('fed') || lowercaseTitle.includes('fomc') || lowercaseTitle.includes('emergency') || lowercaseTitle.includes('sec ') || lowercaseTitle.includes('rate hike') || lowercaseTitle.includes('crash')) {
            impact = 'CRITICAL';
          } else if (lowercaseTitle.includes('inflation') || lowercaseTitle.includes('cpi') || lowercaseTitle.includes('interest rate') || lowercaseTitle.includes('sec') || lowercaseTitle.includes('investigation') || lowercaseTitle.includes('whale') || lowercaseTitle.includes('surge') || lowercaseTitle.includes('regulatory') || lowercaseTitle.includes('spot etf')) {
            impact = 'HIGH';
          } else if (lowercaseTitle.includes('gains') || lowercaseTitle.includes('drops') || lowercaseTitle.includes('yield') || lowercaseTitle.includes('treasury') || lowercaseTitle.includes('bank') || lowercaseTitle.includes('pmi')) {
            impact = 'MEDIUM';
          }
          
          let category: 'MACRO' | 'CRYPTO' | 'FOREX' | 'REGULATORY' | 'LIQUIDITY' = feed.defaultCategory as any;
          if (lowercaseTitle.includes('sec') || lowercaseTitle.includes('lawsuit') || lowercaseTitle.includes('regulatory') || lowercaseTitle.includes('congress') || lowercaseTitle.includes('bill')) {
            category = 'REGULATORY';
          } else if (lowercaseTitle.includes('liquidity') || lowercaseTitle.includes('whale') || lowercaseTitle.includes('outflow') || lowercaseTitle.includes('inflow') || lowercaseTitle.includes('sweep') || lowercaseTitle.includes('block trade')) {
            category = 'LIQUIDITY';
          } else if (lowercaseTitle.includes('euro') || lowercaseTitle.includes('yen') || lowercaseTitle.includes('pound') || lowercaseTitle.includes('forex') || lowercaseTitle.includes(' fx ') || lowercaseTitle.includes('boj') || lowercaseTitle.includes('ecb') || lowercaseTitle.includes('boe')) {
            category = 'FOREX';
          } else if (lowercaseTitle.includes('bitcoin') || lowercaseTitle.includes('btc') || lowercaseTitle.includes('ethereum') || lowercaseTitle.includes('eth') || lowercaseTitle.includes('solana') || lowercaseTitle.includes('crypto')) {
            category = 'CRYPTO';
          }
          
          let symbol: string | undefined = undefined;
          if (lowercaseTitle.includes('apple') || lowercaseTitle.includes('aapl')) symbol = 'AAPL';
          else if (lowercaseTitle.includes('microsoft') || lowercaseTitle.includes('msft')) symbol = 'MSFT';
          else if (lowercaseTitle.includes('nvidia') || lowercaseTitle.includes('nvda')) symbol = 'NVDA';
          else if (lowercaseTitle.includes('tesla') || lowercaseTitle.includes('tsla')) symbol = 'TSLA';
          else if (lowercaseTitle.includes('nas100') || lowercaseTitle.includes('nasdaq')) symbol = 'NAS100';
          else if (lowercaseTitle.includes('spx') || lowercaseTitle.includes('s&p 500')) symbol = 'SPX500';
          else if (lowercaseTitle.includes('dow ') || lowercaseTitle.includes('us30')) symbol = 'US30';
          else if (lowercaseTitle.includes('dax') || lowercaseTitle.includes('ger40')) symbol = 'GER40';
          
          let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
          if (lowercaseTitle.includes('surge') || lowercaseTitle.includes('rally') || lowercaseTitle.includes('gain') || lowercaseTitle.includes('bullish') || lowercaseTitle.includes('soar') || lowercaseTitle.includes('all-time high')) {
            sentiment = 'BULLISH';
          } else if (lowercaseTitle.includes('drop') || lowercaseTitle.includes('slide') || lowercaseTitle.includes('bearish') || lowercaseTitle.includes('plunge') || lowercaseTitle.includes('crash') || lowercaseTitle.includes('fears') || lowercaseTitle.includes('slump')) {
            sentiment = 'BEARISH';
          }
          
          const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
          
          fetchedAlerts.push({
            id,
            timestamp: pubDate.toISOString(),
            title,
            excerpt,
            source: `${feed.source} News Feed`,
            impact,
            category,
            symbol: symbol || 'GLOBAL',
            sentiment,
            readTimeMins: Math.max(1, Math.ceil(excerpt.split(' ').length / 150)),
            url: item.link
          });
        });
      }
    } catch (e) {
      console.warn(`Failed fetching RSS from ${feed.source}:`, e);
    }
  }
  
  return fetchedAlerts;
}

// Global variable containing dynamic simulator incremental bulletins
const simulatorMacroBullets = [
  {
    title: "MACRO MONITOR: Retail sales report exceeds Wall Street expectations, triggering bond yields elevation.",
    excerpt: "US census bureau data indicates a +0.6% mom surge across major retail subcategories. Positive retail performance decreases probability of immediate easing moves by policy leaders, stabilizing indices under high-rate duration pressure.",
    source: "Federal Reserve Board Monitor",
    impact: "HIGH",
    category: "MACRO",
    symbol: "GLOBAL",
    sentiment: "BULLISH"
  },
  {
    title: "LIQUIDITY RUN: Key institutional desks report aggressive buy order blocks on Apple (AAPL) equity lines.",
    excerpt: "Aggregated orderbooks clocked sequential blocks of 500,000 shares on major dark pools. High density limits are consolidating around the primary support zone near previous quarterly consolidation boundaries.",
    source: "Liquidity Pulse Engine",
    impact: "CRITICAL",
    category: "LIQUIDITY",
    symbol: "AAPL",
    sentiment: "BULLISH"
  },
  {
    title: "INSTITUTIONAL TRANSACTIONS: Passive index flows drive massive block accumulation across S&P 500 constituents.",
    excerpt: "Global asset managers completed major rebalancing allocations totaling $4.2B in sequential batches. The resulting purchase momentum has set the stage for a volatility contraction squeeze near recent record highs.",
    source: "Glassnode Institutional Tracker",
    impact: "HIGH",
    category: "LIQUIDITY",
    symbol: "SPX500",
    sentiment: "BULLISH"
  },
  {
    title: "REGULATORY BULLETIN: SEC schedules private enforcement hearing addressing spot crypto derivatives pools.",
    excerpt: "Regulatory counsel requests detailed audits from secondary clearing houses regarding default collateral protection structures. Elevated compliance scrutiny has induced a temporary decrease in liquid orderbook thickness.",
    source: "Apex Sovereign Agency Room",
    impact: "HIGH",
    category: "REGULATORY",
    symbol: "GLOBAL",
    sentiment: "BEARISH"
  },
  {
    title: "QUANT EARNINGS BREAKOUT: NVIDIA (NVDA) reports blowout results with Blackwell supply visibility expanding 45%.",
    excerpt: "NVIDIA reports net net institutional demand exceeding production capabilities by twice the order capacity. Cloud giants Microsoft and Amazon project increased high-intensity capital expenditures, driving tech risk-premia upward.",
    source: "Apex Sovereign Agency Room",
    impact: "CRITICAL",
    category: "LIQUIDITY",
    symbol: "NVDA",
    sentiment: "BULLISH"
  },
  {
    title: "CORPORATE FILINGS DEEP DIVE: Apple Inc. (AAPL) locks custom on-device AI LLM contracts, initiating high hardware upgrade cycle.",
    excerpt: "Apple SEC 10-Q filing exposes custom licensing structures with core sovereign data providers. Institutional investors scale positioning models as projected premium subscription margins lift valuation bounds.",
    source: "Apex Sovereign Agency Room",
    impact: "HIGH",
    category: "MACRO",
    symbol: "AAPL",
    sentiment: "BULLISH"
  },
  {
    title: "MACRO OUTLOOK BRIEF: S&P 500 (SPX500) breaks all-time high as capital allocations shift toward premium risk duration.",
    excerpt: "Quantitative risk funds record largest monthly rotation out of long bonds and into broad S&P 500 equity pools. Analysts cite corporate yield resilience in high-rate environments as the prime catalyst.",
    source: "Apex Terminal Flash Alerts",
    impact: "HIGH",
    category: "MACRO",
    symbol: "SPX500",
    sentiment: "BULLISH"
  },
  {
    title: "AUTOMATED ADVISORY BULLETIN: Tesla (TSLA) secures regulatory FSD testing approvals, driving high sentiment recovery.",
    excerpt: "Tesla secures trial clearances in dense sovereign metropolitan hubs. Analysts indicate a potential turning point for high-margin service fee licensing scaling, sparking short covers in institutional pools.",
    source: "Apex Terminal Flash Alerts",
    impact: "HIGH",
    category: "REGULATORY",
    symbol: "TSLA",
    sentiment: "BULLISH"
  }
];

// Helper to inject a dynamic simulated bulletin into queue periodically
function injectSimulatedHeadline() {
  try {
    const rawBullet = simulatorMacroBullets[Math.floor(Math.random() * simulatorMacroBullets.length)];
    const id = `sim-${Date.now()}`;
    const newHeadline = {
      id,
      timestamp: new Date().toISOString(),
      title: rawBullet.title,
      excerpt: rawBullet.excerpt,
      source: "Apex Terminal Flash Alerts",
      impact: rawBullet.impact,
      category: rawBullet.category,
      symbol: rawBullet.symbol,
      sentiment: rawBullet.sentiment,
      readTimeMins: Math.floor(Math.random() * 3) + 2
    };

    // Prepend to cached list
    cachedInstitutionalNews.unshift(newHeadline);
    if (cachedInstitutionalNews.length > 50) {
      cachedInstitutionalNews = cachedInstitutionalNews.slice(0, 50);
    }
  } catch (err) {
    console.warn("Failsafe: error injecting news bulletin:", err);
  }
}

// News ticker API route
app.get('/api/institutional-news', async (req, res) => {
  res.json([]);
});

// Endpoint to prune stale news
app.post('/api/institutional-news/prune', (req, res) => {
  res.json({ success: true, prunedCount: 0, remainingCount: 0 });
});

// Get historical risk breaches
app.get('/api/risk/breaches', async (req, res) => {
  await checkForNewBreaches();
  res.json(readBreaches());
});

// --- BEGIN FUNDING ENDPOINTS ---
interface FundingTx {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  method: string;
  currency: string;
  amount: number;
  status: 'Settled' | 'Pending' | 'Failed' | 'Processing' | 'Cancelled';
  providerStatus: string;
  date: string;
  walletAddress?: string;
}

interface FundingDb {
  balance: number;
  transactions: FundingTx[];
}

const FUNDING_DB_FILE = path.join(process.cwd(), 'funding_txs_db.json');

function readFundingDb(): FundingDb {
  try {
    if (!fs.existsSync(FUNDING_DB_FILE)) {
      const initialDb: FundingDb = {
        balance: 58000.00,
        transactions: [
          { id: 'fund-1', type: 'DEPOSIT', method: 'Bank ACH Sweep', currency: 'USD', amount: 5000.00, status: 'Settled', providerStatus: 'plaid_cleared', date: '2026-06-25 10:14' },
          { id: 'fund-2', type: 'DEPOSIT', method: 'M-Pesa Deposit', currency: 'KES', amount: 32000.00, status: 'Settled', providerStatus: 'mpesa_completed', date: '2026-06-25 10:22' },
          { id: 'fund-3', type: 'DEPOSIT', method: 'USDC Deposit', currency: 'USDC', amount: 1200.00, status: 'Settled', providerStatus: 'coinbase_completed', date: '2026-06-25 11:40' },
          { id: 'fund-4', type: 'WITHDRAWAL', method: 'Withdrawal Request', currency: 'USD', amount: 2500.00, status: 'Pending', providerStatus: 'plaid_pending', date: '2026-06-25 13:55' }
        ]
      };
      fs.writeFileSync(FUNDING_DB_FILE, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const data = fs.readFileSync(FUNDING_DB_FILE, 'utf-8').trim();
    if (!data) {
      return { balance: 58000.00, transactions: [] };
    }
    return JSON.parse(data) as FundingDb;
  } catch (error) {
    console.error('Error reading funding DB:', error);
    return { balance: 58000.00, transactions: [] };
  }
}

function writeFundingDb(dbData: FundingDb): boolean {
  try {
    fs.writeFileSync(FUNDING_DB_FILE, JSON.stringify(dbData, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing funding DB:', error);
    return false;
  }
}

function processPendingFundingTransfers() {
  const dbData = readFundingDb();
  let changed = false;
  const now = Date.now();

  dbData.transactions = dbData.transactions.map(tx => {
    if (tx.status === 'Pending' || tx.status === 'Processing') {
      let txTimeMs = 0;
      try {
        if (tx.date.includes(' ')) {
          txTimeMs = new Date(tx.date.replace(' ', 'T') + ':00').getTime();
        } else {
          txTimeMs = new Date(tx.date).getTime();
        }
      } catch (err) {
        txTimeMs = now;
      }
      
      const diffSeconds = (now - txTimeMs) / 1000;

      // Simulate a provider response after 15 seconds
      if (diffSeconds >= 15) {
        changed = true;
        const isFailure = tx.amount % 1 === 0.99;
        
        if (isFailure) {
          tx.status = 'Failed';
          if (tx.method.toLowerCase().includes('ach')) tx.providerStatus = 'plaid_returned';
          else if (tx.method.toLowerCase().includes('wire')) tx.providerStatus = 'bank_reversed';
          else if (tx.method.toLowerCase().includes('card')) tx.providerStatus = 'stripe_failed';
          else if (tx.method.toLowerCase().includes('usdc') || tx.method.toLowerCase().includes('stablecoin')) tx.providerStatus = 'coinbase_failed';
          else tx.providerStatus = 'provider_expired';
          
          if (tx.type === 'WITHDRAWAL') {
            if (tx.currency === 'USD' || tx.currency === 'USDC') {
              dbData.balance += tx.amount;
            }
          }
        } else {
          tx.status = 'Settled';
          if (tx.method.toLowerCase().includes('ach')) tx.providerStatus = 'plaid_cleared';
          else if (tx.method.toLowerCase().includes('wire')) tx.providerStatus = 'bank_settled';
          else if (tx.method.toLowerCase().includes('card')) tx.providerStatus = 'stripe_succeeded';
          else if (tx.method.toLowerCase().includes('usdc') || tx.method.toLowerCase().includes('stablecoin')) tx.providerStatus = 'coinbase_completed';
          else tx.providerStatus = 'provider_completed';

          if (tx.type === 'DEPOSIT') {
            if (tx.currency === 'USD' || tx.currency === 'USDC') {
              dbData.balance += tx.amount;
            }
          }
        }
      }
    }
    return tx;
  });

  if (changed) {
    writeFundingDb(dbData);
  }
}

// 1. GET /api/funding/state - Get balance and all funding transactions
app.get('/api/funding/state', (req, res) => {
  try {
    processPendingFundingTransfers();
    const dbData = readFundingDb();
    res.json(dbData);
  } catch (err: any) {
    console.error('Error fetching funding state:', err);
    res.status(500).json({ error: 'Failed to retrieve funding state.' });
  }
});

// 2. POST /api/funding/transfer - Initiate deposit or withdrawal
app.post('/api/funding/transfer', (req, res) => {
  try {
    const { type, method, regionalMethod, currency, amount, walletAddress } = req.body;
    
    if (!type || !method || !currency || isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: 'Missing or invalid transfer parameters.' });
      return;
    }

    processPendingFundingTransfers();
    const dbData = readFundingDb();

    if (type === 'WITHDRAWAL' && (currency === 'USD' || currency === 'USDC') && amount > dbData.balance) {
      res.status(400).json({ error: 'Insufficient funds on server to complete this withdrawal.' });
      return;
    }

    let methodString = '';
    let initialStatus: 'Settled' | 'Pending' | 'Failed' | 'Processing' | 'Cancelled' = 'Settled';
    let initialProviderStatus = '';

    if (method === 'ACH') {
      methodString = 'Bank ACH Sweep';
      initialStatus = 'Pending';
      initialProviderStatus = 'plaid_pending';
    } else if (method === 'WIRE') {
      methodString = 'USD Wire';
      initialStatus = 'Pending';
      initialProviderStatus = 'bank_processing';
    } else if (method === 'CARD') {
      methodString = 'Card Instant';
      initialStatus = 'Settled';
      initialProviderStatus = 'stripe_succeeded';
    } else if (method === 'STABLECOIN') {
      methodString = 'USDC Deposit';
      initialStatus = 'Pending';
      initialProviderStatus = 'coinbase_unconfirmed';
    } else if (method === 'REGIONAL') {
      methodString = `${regionalMethod || 'M-Pesa'} Deposit`;
      initialStatus = 'Pending';
      initialProviderStatus = 'provider_initiated';
    } else {
      methodString = method;
      initialStatus = 'Pending';
      initialProviderStatus = 'provider_pending';
    }

    if (type === 'WITHDRAWAL') {
      if (method === 'REGIONAL') {
        methodString = `${regionalMethod || 'M-Pesa'} Withdrawal`;
      } else {
        methodString = 'Withdrawal Request';
      }
      initialStatus = 'Pending';
      if (method === 'ACH') initialProviderStatus = 'plaid_pending';
      else if (method === 'WIRE') initialProviderStatus = 'bank_processing';
      else if (method === 'CARD') initialProviderStatus = 'stripe_processing';
      else if (method === 'STABLECOIN') initialProviderStatus = 'coinbase_unconfirmed';
      else initialProviderStatus = 'provider_initiated';
    }

    if (type === 'WITHDRAWAL') {
      if (currency === 'USD' || currency === 'USDC') {
        dbData.balance -= amount;
      }
    } else if (type === 'DEPOSIT' && initialStatus === 'Settled') {
      if (currency === 'USD' || currency === 'USDC') {
        dbData.balance += amount;
      }
    }

    const newTx: FundingTx = {
      id: `fund-${Date.now()}`,
      type,
      method: methodString,
      currency,
      amount,
      status: initialStatus,
      providerStatus: initialProviderStatus,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ...(walletAddress ? { walletAddress } : {})
    };

    dbData.transactions.unshift(newTx);
    writeFundingDb(dbData);

    res.json({
      success: true,
      balance: dbData.balance,
      transaction: newTx
    });
  } catch (err: any) {
    console.error('Error executing transfer:', err);
    res.status(500).json({ error: 'Transfer transaction failed.' });
  }
});

// 3. POST /api/funding/sync - Sync client-side trading balance updates
app.post('/api/funding/sync', (req, res) => {
  try {
    const { clientBalance } = req.body;
    if (typeof clientBalance !== 'number' || isNaN(clientBalance)) {
      res.status(400).json({ error: 'Invalid client balance.' });
      return;
    }

    const dbData = readFundingDb();
    const oldBalance = dbData.balance;
    dbData.balance = clientBalance;
    writeFundingDb(dbData);

    res.json({
      success: true,
      oldBalance,
      newBalance: dbData.balance
    });
  } catch (err: any) {
    console.error('Error syncing balance:', err);
    res.status(500).json({ error: 'Balance sync failed.' });
  }
});
// --- END FUNDING ENDPOINTS ---

// Register user context when logged in on frontend
app.post('/api/auth/register', requireAuth, async (req: AuthRequest, res) => {
  try {
    const fireUser = req.user;
    if (!fireUser || !fireUser.uid || !fireUser.email) {
      res.status(400).json({ error: 'Missing token content' });
      return;
    }
    const dbUser = await getOrCreateUser(fireUser.uid, fireUser.email);
    res.json(dbUser);
  } catch (err: any) {
    console.error('Registration API Error:', err);
    res.status(500).json({ error: 'Internal Server Error registering user.' });
  }
});

// Get paginated CLOSED trades history
app.get('/api/trades/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const tag = (req.query.tag as string) || 'ALL';
    const userId = req.dbUser.id;

    // Fetch trades from SQL belonging to this user
    let userTrades = await db.select()
      .from(tradesTable)
      .where(
        and(
          eq(tradesTable.userId, userId),
          eq(tradesTable.status, 'CLOSED')
        )
      );

    // Sort: most recent exit first
    userTrades.sort((a, b) => {
      const timeA = a.exitTimestamp ? new Date(a.exitTimestamp).getTime() : new Date(a.timestamp).getTime();
      const timeB = b.exitTimestamp ? new Date(b.exitTimestamp).getTime() : new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    // Tag filtration
    if (tag !== 'ALL') {
      userTrades = userTrades.filter(t => {
        if (!t.tags) return false;
        // Since tags are stored as jsonb in DB (jsonb value is parsed automatically by pg/drizzle)
        const tagsArr = t.tags as string[];
        return tagsArr.some(tg => {
          let cleaned = tg.trim();
          if (!cleaned.startsWith('#')) {
            cleaned = '#' + cleaned;
          }
          return cleaned.toLowerCase() === tag.toLowerCase();
        });
      });
    }

    const total = userTrades.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginated = userTrades.slice(startIndex, startIndex + limit);

    // Collect available tags across all closed trades
    const tagSet = new Set<string>();
    tagSet.add('#ICT_Setup');
    tagSet.add('#NewsEvent');
    tagSet.add('#MeanReversion');
    tagSet.add('#TrendFollowing');
    tagSet.add('#Breakout');

    // Query all closed trades for tag aggregation (Drizzle)
    const allClosedTrades = await db.select({ tags: tradesTable.tags })
      .from(tradesTable)
      .where(
        and(
          eq(tradesTable.userId, userId),
          eq(tradesTable.status, 'CLOSED')
        )
      );

    allClosedTrades.forEach(t => {
      if (t.tags) {
        const tagsArr = t.tags as string[];
        tagsArr.forEach(tg => {
          let cleaned = tg.trim();
          if (cleaned) {
            if (!cleaned.startsWith('#')) {
              cleaned = '#' + cleaned;
            }
            tagSet.add(cleaned);
          }
        });
      }
    });

    res.json({
      trades: paginated,
      total,
      totalPages,
      page,
      limit,
      allTags: Array.from(tagSet)
    });
  } catch (err: any) {
    console.error('Error fetching trade history:', err);
    res.status(500).json({ error: 'Server error retrieving trade history.' });
  }
});

// Get Trades list
app.get('/api/trades', requireAuth, async (req: AuthRequest, res) => {
  try {
    await checkAndAutoCloseTrades();
    const userId = req.dbUser.id;

    const userTrades = await db.select()
      .from(tradesTable)
      .where(eq(tradesTable.userId, userId));

    const enrichedTrades = userTrades.map(trade => {
      if (trade.status !== 'OPEN') {
        return trade as any;
      }

      const metrics = simulator.getMarketMetrics(trade.symbol as MarketSymbol);
      const curPrice = metrics ? metrics.currentPrice : trade.entryPrice;

      const rawPnl = calculateTradePnL(trade.symbol, trade.entryPrice, curPrice, trade.size, trade.side);
      const currentPnl = parseFloat(rawPnl.toFixed(2));

      const candlesList = simulator.getCandles(trade.symbol as MarketSymbol) || [];
      const historicCandles = candlesList.slice(-60);

      const trajectory = historicCandles.map((c, index) => {
        const cPnl = calculateTradePnL(trade.symbol, trade.entryPrice, c.close, trade.size, trade.side);
        return {
          minute: index,
          pnl: parseFloat(cPnl.toFixed(2))
        };
      });

      return {
        ...trade,
        pnl: currentPnl,
        pnlTrajectory: trajectory
      } as any;
    });

    res.json(enrichedTrades);
  } catch (err) {
    console.error('Error fetching trades:', err);
    res.status(500).json({ error: 'Server error retrieving trades.' });
  }
});

// Enter a trade
app.post('/api/trades', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { symbol, side, entryPrice, stopLoss, takeProfit, size, reason, confidence, confluences, marketNote, autoBreakEvenProfitPct } = req.body;
    if (!symbol || !side || !entryPrice || !stopLoss || !takeProfit || !size) {
      res.status(400).json({ error: 'Missing trade parameters.' });
      return;
    }

    const userId = req.dbUser.id;

    // Generate simulated execution efficiency metrics for the broker bridge
    // ~17% rate of latency spikes above the 45ms bridge health threshold
    const isSpike = Math.random() < 0.17;
    const simulatedLatency = isSpike 
      ? Math.floor(46 + Math.random() * 95) // 46ms to 140ms
      : Math.floor(18 + Math.random() * 26); // 18ms to 44ms (healthy)
    
    // Slippage is correlated with latency. Higher latency = more slippage
    const baseSlippage = isSpike 
      ? 0.7 + Math.random() * 1.6 // 0.7 to 2.3 pips/points
      : Math.random() * 0.45; // 0.0 to 0.45 pips/points (excellent)
    const simulatedSlippage = parseFloat(baseSlippage.toFixed(2));

    const newTradeId = `trade-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [inserted] = await db.insert(tradesTable)
      .values({
        id: newTradeId,
        userId: userId,
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
        confluences: Array.isArray(confluences) ? confluences : undefined,
        marketNote: marketNote || '',
        autoBreakEvenProfitPct: autoBreakEvenProfitPct !== undefined ? parseFloat(autoBreakEvenProfitPct) : undefined,
        autoBreakEvenTriggered: autoBreakEvenProfitPct !== undefined ? false : undefined,
        latency: req.body.latency !== undefined ? parseFloat(req.body.latency) : simulatedLatency,
        slippage: req.body.slippage !== undefined ? parseFloat(req.body.slippage) : simulatedSlippage
      })
      .returning();

    res.status(201).json(inserted);
  } catch (err) {
    console.error('Error inserting trade:', err);
    res.status(500).json({ error: 'Server error entering trade.' });
  }
});

// Close a trade manually or due to trigger
app.post('/api/trades/:id/close', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { exitPrice } = req.body;
    const userId = req.dbUser.id;

    const [trade] = await db.select()
      .from(tradesTable)
      .where(and(eq(tradesTable.id, id), eq(tradesTable.userId, userId)));

    if (!trade) {
      res.status(404).json({ error: 'Trade not found.' });
      return;
    }

    if (trade.status === 'CLOSED') {
      res.status(400).json({ error: 'Trade already closed.' });
      return;
    }

    const price = exitPrice ? parseFloat(exitPrice) : simulator.getMarketMetrics(trade.symbol as MarketSymbol).currentPrice;
    const rawPnl = calculateTradePnL(trade.symbol, trade.entryPrice, price, trade.size, trade.side);

    const [updated] = await db.update(tradesTable)
      .set({
        status: 'CLOSED',
        exitPrice: price,
        pnl: parseFloat(rawPnl.toFixed(2)),
        exitTimestamp: new Date().toISOString()
      })
      .where(eq(tradesTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    console.error('Error closing trade:', err);
    res.status(500).json({ error: 'Server error closing trade.' });
  }
});

// Partial profit taking on a trade (e.g. close percentage of position size at current price)
app.post('/api/trades/:id/partial-close', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const ratio = req.body.ratio !== undefined ? parseFloat(req.body.ratio) : 0.5; // default to 50% partial close
    const userId = req.dbUser.id;

    const [trade] = await db.select()
      .from(tradesTable)
      .where(and(eq(tradesTable.id, id), eq(tradesTable.userId, userId)));

    if (!trade) {
      res.status(404).json({ error: 'Trade not found.' });
      return;
    }

    if (trade.status === 'CLOSED') {
      res.status(400).json({ error: 'Trade already closed.' });
      return;
    }

    const price = simulator.getMarketMetrics(trade.symbol as MarketSymbol).currentPrice;

    // Calculate sizes
    const closedSize = Math.max(0.01, parseFloat((trade.size * ratio).toFixed(2)));
    const remainingSize = Math.max(0, parseFloat((trade.size - closedSize).toFixed(2)));

    // simple conversion for closed portion
    const rawPnl = calculateTradePnL(trade.symbol, trade.entryPrice, price, closedSize, trade.side);
    const closedPnl = parseFloat(rawPnl.toFixed(2));

    // If remaining size is close to zero, close the entire trade instead
    if (remainingSize <= 0.01) {
      // Total PnL gets calculated on the original size
      const fullRawPnl = calculateTradePnL(trade.symbol, trade.entryPrice, price, trade.size, trade.side);

      await db.update(tradesTable)
        .set({
          status: 'CLOSED',
          exitPrice: price,
          pnl: parseFloat(fullRawPnl.toFixed(2)),
          exitTimestamp: new Date().toISOString(),
          annotation: trade.annotation 
            ? `${trade.annotation} | Full Close via target liquidation.`
            : 'Locked via target liquidation.'
        })
        .where(eq(tradesTable.id, id));

      const [finalTrade] = await db.select()
        .from(tradesTable)
        .where(eq(tradesTable.id, id));
      res.json(finalTrade);
    } else {
      // Reduce open position's size
      const newAnnotation = trade.annotation
        ? `${trade.annotation} | Part-closed ${(ratio * 100).toFixed(0)}%.`
        : `Reduced size from ${(remainingSize + closedSize).toFixed(2)} to ${remainingSize.toFixed(2)} (${(ratio * 100).toFixed(0)}% partial close).`;

      const [updatedTrade] = await db.update(tradesTable)
        .set({
          size: remainingSize,
          annotation: newAnnotation
        })
        .where(eq(tradesTable.id, id))
        .returning();

      // Create a new CLOSED transaction representing the closed portion
      const partialId = `${trade.id}-p-${Date.now()}`;
      await db.insert(tradesTable)
        .values({
          id: partialId,
          userId: userId,
          symbol: trade.symbol,
          side: trade.side,
          entryPrice: trade.entryPrice,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          status: 'CLOSED',
          size: closedSize,
          exitPrice: price,
          pnl: closedPnl,
          timestamp: trade.timestamp,
          exitTimestamp: new Date().toISOString(),
          reason: trade.reason,
          confidence: trade.confidence,
          confluences: trade.confluences,
          tags: trade.tags,
          sentimentRating: trade.sentimentRating,
          screenshot: trade.screenshot,
          annotation: `Partial Profit Taking (${(ratio * 100).toFixed(0)}% of exposure closed, Parent: ${trade.id})`
        });

      res.json(updatedTrade);
    }
  } catch (err) {
    console.error('Error during partial close:', err);
    res.status(500).json({ error: 'Server error handling partial close.' });
  }
});

// Update trade parameters dynamically (Stop-Loss, Take-Profit, Trailing Stops/Take-Profit)
app.post('/api/trades/:id/update-params', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { 
      stopLoss, 
      takeProfit, 
      trailingStopActive, 
      trailingStopDistance, 
      trailingTakeProfitActive,
      trailingTakeProfitDistance,
      lavTslActive,
      lavTslAtrMultiplier,
      lavTslLiquidityActive,
      lavTslTighteningActive
    } = req.body;
    const userId = req.dbUser.id;

    const [trade] = await db.select()
      .from(tradesTable)
      .where(and(eq(tradesTable.id, id), eq(tradesTable.userId, userId)));

    if (!trade) {
      res.status(404).json({ error: 'Trade not found.' });
      return;
    }

    if (trade.status === 'CLOSED') {
      res.status(400).json({ error: 'Cannot update parameters on completed trades.' });
      return;
    }

    const updates: Partial<typeof tradesTable.$inferInsert> = {};
    if (stopLoss !== undefined) updates.stopLoss = parseFloat(stopLoss);
    if (takeProfit !== undefined) updates.takeProfit = parseFloat(takeProfit);
    if (trailingStopActive !== undefined) updates.trailingStopActive = !!trailingStopActive;
    if (trailingStopDistance !== undefined) updates.trailingStopDistance = parseFloat(trailingStopDistance);
    if (trailingTakeProfitActive !== undefined) updates.trailingTakeProfitActive = !!trailingTakeProfitActive;
    if (trailingTakeProfitDistance !== undefined) updates.trailingTakeProfitDistance = parseFloat(trailingTakeProfitDistance);
    if (lavTslActive !== undefined) updates.lavTslActive = !!lavTslActive;
    if (lavTslAtrMultiplier !== undefined) updates.lavTslAtrMultiplier = parseFloat(lavTslAtrMultiplier);
    if (lavTslLiquidityActive !== undefined) updates.lavTslLiquidityActive = !!lavTslLiquidityActive;
    if (lavTslTighteningActive !== undefined) updates.lavTslTighteningActive = !!lavTslTighteningActive;

    const metrics = simulator.getMarketMetrics(trade.symbol as MarketSymbol);
    const curPrice = metrics ? metrics.currentPrice : trade.entryPrice;

    if (trade.maxPriceReached === undefined || trade.maxPriceReached === null) updates.maxPriceReached = curPrice;
    if (trade.minPriceReached === undefined || trade.minPriceReached === null) updates.minPriceReached = curPrice;

    const [updated] = await db.update(tradesTable)
      .set(updates)
      .where(eq(tradesTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    console.error('Error updating trade params:', err);
    res.status(500).json({ error: 'Server error updating parameters.' });
  }
});

// Update trade journal details (annotations, tags, sentiment ratings, screenshots)
app.post('/api/trades/:id/journal', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { annotation, tags, sentimentRating, screenshot } = req.body;
    const userId = req.dbUser.id;

    const [trade] = await db.select()
      .from(tradesTable)
      .where(and(eq(tradesTable.id, id), eq(tradesTable.userId, userId)));

    if (!trade) {
      res.status(404).json({ error: 'Trade not found.' });
      return;
    }

    const updates: Partial<typeof tradesTable.$inferInsert> = {};
    if (typeof annotation === 'string') updates.annotation = annotation;
    if (Array.isArray(tags)) updates.tags = tags;
    if (typeof sentimentRating === 'string') updates.sentimentRating = sentimentRating;
    if (typeof screenshot === 'string') updates.screenshot = screenshot;

    const [updated] = await db.update(tradesTable)
      .set(updates)
      .where(eq(tradesTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    console.error('Error journaling trade:', err);
    res.status(500).json({ error: 'Server error journaling trade details.' });
  }
});

// ==================== PERSISTENT CHAT HISTORY (FIRESTORE) ====================

// 1. GET /api/chat/history (List user's chats)
app.get('/api/chat/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await adminDb.collection('chats')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();

    const chats: any[] = [];
    snapshot.forEach(doc => {
      chats.push({ id: doc.id, ...doc.data() });
    });
    res.json(chats);
  } catch (err: any) {
    console.error('Error fetching chat history from Firestore:', err);
    res.status(500).json({ error: 'Server error retrieving chat history.', details: err.message });
  }
});

// 2. GET /api/chat/history/:id (Retrieve a single chat)
app.get('/api/chat/history/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const doc = await adminDb.collection('chats').doc(id).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Chat session not found.' });
      return;
    }

    const data = doc.data();
    if (data?.userId !== userId) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    res.json({ id: doc.id, ...data });
  } catch (err: any) {
    console.error('Error fetching chat session:', err);
    res.status(500).json({ error: 'Server error retrieving chat session.' });
  }
});

// 3. POST /api/chat/history (Create or update chat)
app.post('/api/chat/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.uid;
    const { id, title, symbol, messages } = req.body;

    if (!id || !title || !symbol || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Missing required parameters: id, title, symbol, or messages.' });
      return;
    }

    const docRef = adminDb.collection('chats').doc(id);
    const docSnapshot = await docRef.get();

    const now = new Date().toISOString();

    if (docSnapshot.exists) {
      const existingData = docSnapshot.data();
      if (existingData?.userId !== userId) {
        res.status(403).json({ error: 'Access denied.' });
        return;
      }

      await docRef.update({
        title,
        symbol,
        messages,
        updatedAt: now
      });
    } else {
      await docRef.set({
        id,
        userId,
        title,
        symbol,
        messages,
        createdAt: now,
        updatedAt: now
      });
    }

    res.json({ success: true, id, updatedAt: now });
  } catch (err: any) {
    console.error('Error saving chat session:', err);
    res.status(500).json({ error: 'Server error saving chat session.' });
  }
});

// 4. DELETE /api/chat/history/:id (Delete a chat session)
app.delete('/api/chat/history/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const docRef = adminDb.collection('chats').doc(id);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      res.status(404).json({ error: 'Chat session not found.' });
      return;
    }

    const data = docSnapshot.data();
    if (data?.userId !== userId) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    await docRef.delete();
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting chat session:', err);
    res.status(500).json({ error: 'Server error deleting chat session.' });
  }
});

// ==================== MARKETS PAGE (YAHOO FINANCE & FUNDAMENTALS) ====================

// Helper for simulated historical price data (failsafe fallback)
function getSimulatedHistoricalData(ticker: string, range: string) {
  const bars: any[] = [];
  const days = range === '1d' ? 24 : range === '5d' ? 5 : range === '1mo' ? 30 : range === '3mo' ? 90 : range === '1y' ? 250 : 30;
  let currentPrice = ticker === 'BTC-USD' ? 64000 : ticker === 'ETH-USD' ? 3200 : ticker === 'AAPL' ? 180 : ticker === 'MSFT' ? 420 : ticker === 'NVDA' ? 120 : ticker === 'TSLA' ? 175 : 100;
  
  const now = Date.now();
  const step = range === '1d' ? 3600 * 1000 : 24 * 3600 * 1000;

  for (let i = days; i >= 0; i--) {
    const time = now - i * step;
    const change = (Math.random() - 0.49) * (currentPrice * 0.03);
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * (currentPrice * 0.015);
    const low = Math.min(open, close) - Math.random() * (currentPrice * 0.015);
    const volume = Math.round(1000000 + Math.random() * 5000000);

    bars.push({
      timestamp: new Date(time).toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }

  return {
    ticker,
    currency: 'USD',
    symbol: ticker,
    regularMarketPrice: parseFloat(currentPrice.toFixed(2)),
    bars
  };
}

// Helper for simulated fundamentals data (failsafe fallback)
function getSimulatedFundamentals(ticker: string) {
  const isTech = ['AAPL', 'MSFT', 'NVDA', 'GOOG', 'AMZN', 'META'].includes(ticker);
  const pe = isTech ? 25 + Math.random() * 15 : 12 + Math.random() * 10;
  const roe = isTech ? 0.25 + Math.random() * 0.2 : 0.1 + Math.random() * 0.1;
  const debtToEquity = isTech ? 40 + Math.random() * 80 : 80 + Math.random() * 100;
  const profitMargin = isTech ? 0.2 + Math.random() * 0.15 : 0.05 + Math.random() * 0.1;

  return {
    ticker,
    incomeStatement: [
      { endDate: '2025-12-31', totalRevenue: 385000000000, costOfRevenue: 220000000000, grossProfit: 165000000000, operatingIncome: 115000000000, netIncome: 95000000000 },
      { endDate: '2024-12-31', totalRevenue: 365000000000, costOfRevenue: 210000000000, grossProfit: 155000000000, operatingIncome: 105000000000, netIncome: 85000000000 },
      { endDate: '2023-12-31', totalRevenue: 345000000000, costOfRevenue: 200000000000, grossProfit: 145000000000, operatingIncome: 95000000000, netIncome: 75000000000 }
    ],
    balanceSheet: [
      { endDate: '2025-12-31', totalAssets: 420000000000, totalLiab: 280000000000, totalStockholderEquity: 140000000000, cash: 65000000000, shortTermInvestments: 55000000000 },
      { endDate: '2024-12-31', totalAssets: 380000000000, totalLiab: 260000000000, totalStockholderEquity: 120000000000, cash: 55000000000, shortTermInvestments: 45000000000 }
    ],
    cashFlow: [
      { endDate: '2025-12-31', operatingCashflow: 110000000000, capitalExpenditure: -12000000000, investingCashflow: -30000000000, financingCashflow: -70000000000, freeCashflow: 98000000000 },
      { endDate: '2024-12-31', operatingCashflow: 95000000000, capitalExpenditure: -10000000000, investingCashflow: -25000000000, financingCashflow: -65000000000, freeCashflow: 85000000000 }
    ],
    ratios: {
      peRatio: pe,
      forwardPE: pe * 0.9,
      priceToBook: 4.5 + Math.random() * 8,
      roe: roe,
      roa: roe * 0.6,
      marketCap: ticker === 'AAPL' ? 3000000000000 : ticker === 'MSFT' ? 3200000000000 : ticker === 'NVDA' ? 2800000000000 : 500000000000,
      operatingMargin: profitMargin * 1.3,
      profitMargin: profitMargin,
      beta: 1.0 + (Math.random() - 0.5) * 0.4,
      dividendYield: 0.005 + Math.random() * 0.015,
      debtToEquity: debtToEquity,
      revenueGrowth: 0.05 + Math.random() * 0.15,
      earningsGrowth: 0.08 + Math.random() * 0.2,
      fiftyTwoWeekChange: 0.15 + Math.random() * 0.3
    }
  };
}

// 5. GET /api/markets/historical (Fetch historical data from Yahoo Finance)
app.get('/api/markets/historical', async (req, res) => {
  try {
    const ticker = (req.query.ticker as string || 'AAPL').toUpperCase();
    const range = req.query.range as string || '1mo'; // 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y
    let interval = req.query.interval as string || '1d';
    
    if (range === '1d') interval = '5m';
    else if (range === '5d') interval = '15m';

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API returned status ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) {
      throw new Error(`No historical data found for ticker ${ticker}`);
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];
    const volumes = quote.volume || [];

    const bars: any[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (opens[i] != null && highs[i] != null && lows[i] != null && closes[i] != null) {
        bars.push({
          timestamp: new Date(timestamps[i] * 1000).toISOString(),
          open: parseFloat(opens[i].toFixed(2)),
          high: parseFloat(highs[i].toFixed(2)),
          low: parseFloat(lows[i].toFixed(2)),
          close: parseFloat(closes[i].toFixed(2)),
          volume: volumes[i] ? Math.round(volumes[i]) : 0
        });
      }
    }

    res.json({
      ticker,
      currency: result.meta?.currency || 'USD',
      symbol: result.meta?.symbol || ticker,
      regularMarketPrice: result.meta?.regularMarketPrice || (bars.length > 0 ? bars[bars.length - 1].close : 0),
      bars
    });
  } catch (err: any) {
    console.log(`[Yahoo Finance Proxy] Notice: Fetching historical data for ticker ${req.query.ticker} fallback to simulation:`, err.message || err);
    res.json(getSimulatedHistoricalData(req.query.ticker as string || 'AAPL', req.query.range as string || '1mo'));
  }
});

// 6. GET /api/markets/fundamentals (Fetch fundamentals from Yahoo Finance)
app.get('/api/markets/fundamentals', async (req, res) => {
  try {
    const ticker = (req.query.ticker as string || 'AAPL').toUpperCase();
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,defaultKeyStatistics,financialData,summaryDetail`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API returned status ${response.status}`);
    }

    const data = await response.json();
    const quoteSummary = data?.quoteSummary?.result?.[0];
    if (!quoteSummary) {
      throw new Error(`No fundamental data found for ticker ${ticker}`);
    }

    // Format income statement history
    const rawIncome = quoteSummary.incomeStatementHistory?.incomeStatementHistory || [];
    const incomeStatement = rawIncome.map((item: any) => ({
      endDate: item.endDate?.fmt || 'N/A',
      totalRevenue: item.totalRevenue?.raw || 0,
      costOfRevenue: item.costOfRevenue?.raw || 0,
      grossProfit: item.grossProfit?.raw || 0,
      operatingIncome: item.operatingIncome?.raw || 0,
      netIncome: item.netIncome?.raw || 0
    }));

    // Format balance sheet history
    const rawBalance = quoteSummary.balanceSheetHistory?.balanceSheetHistory || [];
    const balanceSheet = rawBalance.map((item: any) => ({
      endDate: item.endDate?.fmt || 'N/A',
      totalAssets: item.totalAssets?.raw || 0,
      totalLiab: item.totalLiab?.raw || 0,
      totalStockholderEquity: item.totalStockholderEquity?.raw || 0,
      cash: item.cash?.raw || 0,
      shortTermInvestments: item.shortTermInvestments?.raw || 0
    }));

    // Format cash flow history
    const rawCash = quoteSummary.cashflowStatementHistory?.cashflowStatementHistory || [];
    const cashFlow = rawCash.map((item: any) => ({
      endDate: item.endDate?.fmt || 'N/A',
      operatingCashflow: item.totalCashFromOperatingActivities?.raw || 0,
      capitalExpenditure: item.capitalExpenditures?.raw || 0,
      investingCashflow: item.totalCashflowsFromInvestingActivities?.raw || 0,
      financingCashflow: item.totalCashFromFinancingActivities?.raw || 0,
      freeCashflow: (item.totalCashFromOperatingActivities?.raw || 0) + (item.capitalExpenditures?.raw || 0)
    }));

    // Extract key ratios
    const keyStats = quoteSummary.defaultKeyStatistics || {};
    const finData = quoteSummary.financialData || {};
    const sumDetail = quoteSummary.summaryDetail || {};

    const ratios = {
      peRatio: sumDetail.trailingPE?.raw || sumDetail.forwardPE?.raw || null,
      forwardPE: sumDetail.forwardPE?.raw || null,
      priceToBook: keyStats.priceToBook?.raw || null,
      roe: finData.returnOnEquity?.raw || null,
      roa: finData.returnOnAssets?.raw || null,
      marketCap: sumDetail.marketCap?.raw || null,
      operatingMargin: finData.operatingMargins?.raw || null,
      profitMargin: finData.profitMargins?.raw || null,
      beta: keyStats.beta?.raw || null,
      dividendYield: sumDetail.dividendYield?.raw || null,
      debtToEquity: finData.debtToEquity?.raw || null,
      revenueGrowth: finData.revenueGrowth?.raw || null,
      earningsGrowth: finData.earningsGrowth?.raw || null,
      fiftyTwoWeekChange: keyStats["52WeekChange"]?.raw || null
    };

    res.json({
      ticker,
      incomeStatement,
      balanceSheet,
      cashFlow,
      ratios
    });
  } catch (err: any) {
    console.log(`[Yahoo Finance Proxy] Notice: Fetching fundamentals for ticker ${req.query.ticker} fallback to simulation:`, err.message || err);
    res.json(getSimulatedFundamentals(req.query.ticker as string || 'AAPL'));
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

  // If cache is valid and not forced, return cached briefing directly to preserve resources
  if (cachedBriefingSnapshot && !force && (now.getTime() - lastBriefingTime) < BRIEFING_CACHE_TTL) {
    res.json(cachedBriefingSnapshot);
    return;
  }

  const symbols: MarketSymbol[] = [
    'US30', 'NAS100', 'GER40', 'SPX500', 'AAPL', 'MSFT', 'NVDA', 'TSLA'
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

  // 2. Compute high-impact upcoming events - news-free system
  let highImpactEventsCount = 0;

  // 3. Compute dynamic market mood parameters
  const bullishBiases = marketDetails.filter(m => m.dailyBias === 'BULLISH').length;
  const bearishBiases = marketDetails.filter(m => m.dailyBias === 'BEARISH').length;
  const sentimentBias = bullishBiases > bearishBiases ? 'BULLISH' : (bearishBiases > bullishBiases ? 'BEARISH' : 'MIXED');

  const volatilityIndex = 'LOW';

  const majorThemes = [
    sentimentBias === 'BULLISH' 
      ? `Systematic global order flow favors Risk-On assets with key dollar rotations.` 
      : sentimentBias === 'BEARISH'
      ? `Elevated safe-haven hedging as macroeconomic risk variables compress indexes.`
      : `Broad range correlation cycles leading to structural compression across Forex pairs.`,
    `Consolidation mode dominates with no high timeframe volatility alerts scheduled.`,
    `ICT Playbook rule dictates waiting for high/low liquidity sweeps of the previous sessions.`
  ];

  const getSimulatedBriefing = () => {
    const spxMD = marketDetails.find(m => m.symbol === 'SPX500') || { currentPrice: 5300.0, dailyBias: 'BULLISH', trend: 'BULLISH', rsi: 62 };
    const aaplMD = marketDetails.find(m => m.symbol === 'AAPL') || { currentPrice: 188.30, dailyBias: 'BULLISH', trend: 'BULLISH', rsi: 58 };
    const nvdaMD = marketDetails.find(m => m.symbol === 'NVDA') || { currentPrice: 945.00, dailyBias: 'BULLISH', trend: 'BULLISH', rsi: 68 };
    const tslaMD = marketDetails.find(m => m.symbol === 'TSLA') || { currentPrice: 175.50, dailyBias: 'BEARISH', trend: 'NEUTRAL', rsi: 44 };

    return `### 🌅 APEX STOCK MARKET DAILY BRIEF

**Date Directive**: June 3, 2026 (Morning Session Analysis)
**Security Handshake State**: Stock Market Strategic Assessment
**Overall Sentiment Indicator**: **${sentimentBias}** Momentum Zone
**Asset Volatility index**: **${volatilityIndex}** Index

---

#### 1. Core Equities Narrative & Bias State
Currently, our stock and index consensus bias registers as a **${sentimentBias}** framework. Intraday correlation charts reflect active algorithmic adjustments following high timeframe structure shifts.

*   **S&P 500 (SPX500)**: Index averages **${spxMD.currentPrice.toFixed(2)}**, showing a **${spxMD.dailyBias}** bias (${spxMD.trend} trend, RSI: ${Math.round(spxMD.rsi)}).
*   **Apple Inc. (AAPL)**: Mega-cap averages **${aaplMD.currentPrice.toFixed(2)}** demonstrating a **${aaplMD.dailyBias}** daily bias context.
*   **Nvidia (NVDA)**: Semiconductor leader averages **${nvdaMD.currentPrice.toFixed(2)}** indicating a **${nvdaMD.dailyBias}** bias.
*   **Tesla (TSLA)**: EV pioneer averages **${tslaMD.currentPrice.toFixed(2)}** on a **${tslaMD.dailyBias}** profile.

---

#### 2. Liquidity & Order Block Plotted footprint
*   **S&P 500 Key Zones**: Look to capture discounted orderblock mitigations near the primary 4H institutional support level. Avoid middle range noise.
*   **Apple Key Zones**: High tension is recorded across defensive grids. Unmitigated Fair Value Gaps (FVGs) remain open below the current price, creating strong magnetic targets.
*   **Nvidia Key Zones**: Trading tight inside active session ranges. Breakout sweeps of Asian session highs are expected to trigger rapid displacement.

---

#### 3. Technical Volatility Protocols
*   No high-impact system alerts are active on today's technical schedule.
*   *Protocol Reminder*: Strictly adhere to the **30-Minute Volatility Avoidance Doctrine** around major session opens to safeguard institutional equity from slippage.

---

#### 4. Tactical Directives
*   Maintain complete capital safety capping any session exposure to exactly **1% risk**.
*   Verify structure alignment on the high timeframes (4H/Daily EMA grids) before selecting order triggers.
    `.trim();
  };

  res.json({
    narrative: getSimulatedBriefing(),
    majorThemes,
    sentimentBias,
    volatilityIndex,
    economicAlarms: highImpactEventsCount,
    lastUpdated: now.toISOString(),
    isLive: false
  });
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
