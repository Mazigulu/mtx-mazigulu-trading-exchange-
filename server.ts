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
    const parsed = JSON.parse(data) as Trade[];
    let changed = false;
    const enriched = parsed.map(trade => {
      let isLocalModified = false;
      if (trade.latency === undefined) {
        const seedVal = parseInt(trade.id.replace(/\D/g, '') || '0') || 42;
        const isSpike = (seedVal % 10) === 0 || (seedVal % 7) === 0;
        trade.latency = isSpike 
          ? 46 + (seedVal % 85)
          : 18 + (seedVal % 27);
        isLocalModified = true;
      }
      if (trade.slippage === undefined) {
        const seedVal = parseInt(trade.id.replace(/\D/g, '') || '0') || 42;
        const isSpike = (seedVal % 10) === 0 || (seedVal % 7) === 0;
        trade.slippage = isSpike
          ? parseFloat((0.8 + (seedVal % 15) / 10).toFixed(2))
          : parseFloat(((seedVal % 5) / 10).toFixed(2));
        isLocalModified = true;
      }
      if (isLocalModified) {
        changed = true;
      }
      return trade;
    });
    if (changed) {
      fs.writeFileSync(DB_FILE, JSON.stringify(enriched, null, 2));
    }
    return enriched;
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
      if (t.symbol === 'BTC/USDT' || t.symbol === 'ETH/USDT' || t.symbol === 'SOL/USDT') {
        tradeRiskDollar = slDistance * t.size;
      } else if (t.symbol === 'USD/JPY') {
        tradeRiskDollar = (slDistance / 0.01) * t.size * 0.1;
      } else if (['AAPL', 'MSFT', 'NVDA', 'TSLA'].includes(t.symbol)) {
        tradeRiskDollar = slDistance * t.size * 100;
      } else if (t.symbol === 'US10Y') {
        tradeRiskDollar = slDistance * t.size * 10000;
      } else if (t.symbol === 'DXY' || t.symbol === 'BRENT') {
        tradeRiskDollar = slDistance * t.size * 1000;
      } else if (['US30', 'NAS100', 'SPX500', 'GER40'].includes(t.symbol)) {
        tradeRiskDollar = slDistance * t.size * 10;
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
  let currentModel = params.model;
  while (true) {
    try {
      const executeParams = { ...params, model: currentModel };
      return await client.models.generateContent(executeParams);
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

      if (isTransient && currentModel === 'gemini-3.5-flash') {
        console.warn(`[Gemini SDK Sentry] Detected transient unavailable error (${errMsg.substring(0, 80)}). Falling back from 'gemini-3.5-flash' to 'gemini-3.1-flash-lite' for resilience.`);
        currentModel = 'gemini-3.1-flash-lite';
        continue;
      }

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

function getSymbolPrecision(sym: string): number {
  if (sym === 'US10Y') return 3;
  if (sym.includes('JPY') || sym.includes('GOLD') || sym.includes('SILVER') || sym === 'SOL/USDT' || sym === 'US30' || sym === 'NAS100' || sym === 'GER40' || sym === 'SPX500' || sym === 'DXY' || sym === 'BRENT' || ['AAPL', 'MSFT', 'NVDA', 'TSLA'].includes(sym)) {
    return 2;
  }
  if (sym === 'BTC/USDT' || sym === 'ETH/USDT') {
    return 1;
  }
  return 5;
}

function calculateTradePnL(sym: string, entryPrice: number, currentPrice: number, size: number, side: string): number {
  const pnlMultiplier = side === 'BUY' ? 1 : -1;
  const priceDiff = currentPrice - entryPrice;
  
  if (sym === 'BTC/USDT' || sym === 'ETH/USDT' || sym === 'SOL/USDT') {
    return priceDiff * size * pnlMultiplier;
  } else if (sym === 'USD/JPY') {
    return (priceDiff / 0.01) * size * 0.1 * pnlMultiplier;
  } else if (['AAPL', 'MSFT', 'NVDA', 'TSLA'].includes(sym)) {
    return priceDiff * size * 100 * pnlMultiplier;
  } else if (sym === 'US10Y') {
    return priceDiff * size * 10000 * pnlMultiplier;
  } else if (sym === 'DXY' || sym === 'BRENT') {
    return priceDiff * size * 1000 * pnlMultiplier;
  } else if (['US30', 'NAS100', 'SPX500', 'GER40'].includes(sym)) {
    return priceDiff * size * 10 * pnlMultiplier;
  } else {
    return (priceDiff / 0.0001) * size * 1.0 * pnlMultiplier;
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

  const symbol = (req.query.symbol as MarketSymbol) || 'EUR/USD';
  
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
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP',
    'GOLD/USD', 'SILVER/USD', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
    'US30', 'NAS100', 'GER40', 'SPX500',
    'DXY', 'US10Y', 'BRENT', 'AAPL', 'MSFT', 'NVDA', 'TSLA'
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
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP',
    'GOLD/USD', 'SILVER/USD',
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
    'US30', 'NAS100', 'GER40', 'SPX500',
    'DXY', 'US10Y', 'BRENT', 'AAPL', 'MSFT', 'NVDA', 'TSLA'
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
      'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP',
      'GOLD/USD', 'SILVER/USD',
      'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
      'US30', 'NAS100', 'GER40', 'SPX500',
      'DXY', 'US10Y', 'BRENT', 'AAPL', 'MSFT', 'NVDA', 'TSLA'
    ];
    const sentimentMap: Record<string, any> = {};

    const now = new Date();

    for (const sym of symbols) {
      const metrics = simulator.getMarketMetrics(sym);
      if (!metrics) {
        continue;
      }
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
  } catch (error: any) {
    console.warn('[Sentiment API Error]:', error.message || error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
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
    title: "ON-CHAIN ALERT: Institutional Whales move over $340M in BTC into high-security offline vaults.",
    excerpt: "Glassnode metrics indicate the largest single aggregate outflow from public centralized liquid exchange storage pools since early February. Historically, large custody sweeps precede long-term multi-week consolidation expansions.",
    source: "Interbank Liquidity Scan",
    impact: "HIGH",
    category: "CRYPTO",
    symbol: "BTC/USDT",
    sentiment: "BULLISH",
    readTimeMins: 2
  },
  {
    id: "term-3",
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    title: "EUROZONE: ECB member Joachim Nagel signals potential pause on upcoming asset purchasing programs.",
    excerpt: "Deutsche Bundesbank President states inflation pressures inside the Union are moderating, but caution over energy supply shocks dictates a conservative quantitative tightening drawdown pace. Euro currency gains minor traction on sovereign bonds spread narrowing.",
    source: "Bloomberg Interbank Feed",
    impact: "MEDIUM",
    category: "FOREX",
    symbol: "EUR/USD",
    sentiment: "NEUTRAL",
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
    title: "PRECIOUS METALS: Central gold buying reserves expand by record 42 tonnes in monthly sovereign reporting.",
    excerpt: "Emerging markets sovereign reserves continue aggressive rotation into physical bullion assets. Physical gold premium surges over London paper spot values as physical shipping logistics report congestion bottlenecks.",
    source: "Sovereign Reserves Registry",
    impact: "MEDIUM",
    category: "MACRO",
    symbol: "GOLD/USD",
    sentiment: "BULLISH",
    readTimeMins: 2
  }
];

let cachedInstitutionalNews: any[] = [...defaultInstitutionalNews];
let lastNewsFetchTime = 0;

async function fetchLiveRSSNews(): Promise<any[]> {
  const feeds = [
    { url: 'https://www.coindesk.com/arc/outboundfeed/rss/', source: 'CoinDesk', defaultCategory: 'CRYPTO' },
    { url: 'https://www.cnbc.com/id/15839069/device/rss/rss.html', source: 'CNBC', defaultCategory: 'MACRO' }
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
          if (lowercaseTitle.includes('bitcoin') || lowercaseTitle.includes('btc')) symbol = 'BTC/USDT';
          else if (lowercaseTitle.includes('ethereum') || lowercaseTitle.includes('eth')) symbol = 'ETH/USDT';
          else if (lowercaseTitle.includes('solana') || lowercaseTitle.includes('sol ')) symbol = 'SOL/USDT';
          else if (lowercaseTitle.includes('euro') || lowercaseTitle.includes('eur')) symbol = 'EUR/USD';
          else if (lowercaseTitle.includes('pound') || lowercaseTitle.includes('gbp')) symbol = 'GBP/USD';
          else if (lowercaseTitle.includes('yen') || lowercaseTitle.includes('jpy')) symbol = 'USD/JPY';
          else if (lowercaseTitle.includes('gold') || lowercaseTitle.includes('bullion')) symbol = 'GOLD/USD';
          else if (lowercaseTitle.includes('silver') || lowercaseTitle.includes('xag')) symbol = 'SILVER/USD';
          else if (lowercaseTitle.includes('nas100') || lowercaseTitle.includes('nasdaq')) symbol = 'NAS100';
          else if (lowercaseTitle.includes('spx') || lowercaseTitle.includes('s&p 500')) symbol = 'SPX500';
          else if (lowercaseTitle.includes('dow ') || lowercaseTitle.includes('us30')) symbol = 'US30';
          
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
    title: "LIQUIDITY RUN: Standard Chartered reports aggressive aggregate sell blocks on spot EUR/USD pairs.",
    excerpt: "Institutional orderbooks clocked a consecutive line of 1,200 Lot sweep blocks on the Chicago Mercantile Exchange. High density limits are consolidating around retail stop-pools down near the 1.0820 support band.",
    source: "Liquidity Pulse Engine",
    impact: "CRITICAL",
    category: "LIQUIDITY",
    symbol: "EUR/USD",
    sentiment: "BEARISH"
  },
  {
    title: "WHALE TRANSACTIONS: Spot Bitcoin exchange inventories record largest supply cliff drop in 4 months.",
    excerpt: "Aggregated wallet tracers noted that a private asset management trust withdrew 4,120 BTC in sequential batches of 100 BTC. Decreases in liquid availability historically set the stage for major supply-squeeze breakouts.",
    source: "Glassnode On-Chain Stream",
    impact: "HIGH",
    category: "LIQUIDITY",
    symbol: "BTC/USDT",
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

// Periodically generate simulated market announcements every 45s to reflect live trading atmosphere
setInterval(injectSimulatedHeadline, 45000);

// News ticker API route
app.get('/api/institutional-news', async (req, res) => {
  try {
    const now = Date.now();
    // Throttle real RSS refetches to at most once every 60 seconds to safeguard system throughput
    if (now - lastNewsFetchTime > 60000) {
      lastNewsFetchTime = now;
      const liveRSS = await fetchLiveRSSNews();
      if (liveRSS && liveRSS.length > 0) {
        // Merge without duplicates based on title similarity
        const existingTitles = new Set(cachedInstitutionalNews.map(item => item.title.trim().toLowerCase()));
        const uniqueRSS = liveRSS.filter(item => !existingTitles.has(item.title.trim().toLowerCase()));
        
        cachedInstitutionalNews = [...uniqueRSS, ...cachedInstitutionalNews].slice(0, 60);
      }
    }
    res.json(cachedInstitutionalNews);
  } catch (e: any) {
    console.error('Error in /api/institutional-news:', e);
    res.status(500).json({ error: 'News server offline.' });
  }
});

// Endpoint to prune stale news
app.post('/api/institutional-news/prune', (req, res) => {
  try {
    const maxAgeMinutes = parseInt(req.body.maxAgeMinutes as string || req.query.maxAgeMinutes as string) || 30;
    const now = Date.now();
    const cutoff = now - maxAgeMinutes * 60 * 1000;

    const initialCount = cachedInstitutionalNews.length;
    cachedInstitutionalNews = cachedInstitutionalNews.filter(item => {
      if (!item.timestamp) return true; // keep if invalid
      const ts = new Date(item.timestamp).getTime();
      if (isNaN(ts)) return true;
      return ts >= cutoff;
    });

    const prunedCount = initialCount - cachedInstitutionalNews.length;
    res.json({ success: true, prunedCount, remainingCount: cachedInstitutionalNews.length });
  } catch (e: any) {
    console.error('Error in /api/institutional-news/prune:', e);
    res.status(500).json({ error: 'Pruning failure.' });
  }
});

// Get historical risk breaches
app.get('/api/risk/breaches', async (req, res) => {
  await checkForNewBreaches();
  res.json(readBreaches());
});

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

    // Generate simulated execution efficiency metrics for the MT5 bridge
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
    const pnlMultiplier = trade.side === 'BUY' ? 1 : -1;
    const priceDiff = price - trade.entryPrice;

    // Calculate sizes
    const closedSize = Math.max(0.01, parseFloat((trade.size * ratio).toFixed(2)));
    const remainingSize = Math.max(0, parseFloat((trade.size - closedSize).toFixed(2)));

    // simple pip value conversion for closed portion
    let rawPnl = 0;
    if (trade.symbol === 'BTC/USDT') {
      rawPnl = priceDiff * closedSize * pnlMultiplier;
    } else if (trade.symbol === 'USD/JPY') {
      rawPnl = (priceDiff / 0.01) * closedSize * 0.1 * pnlMultiplier;
    } else {
      rawPnl = (priceDiff / 0.0001) * closedSize * 1.0 * pnlMultiplier;
    }
    const closedPnl = parseFloat(rawPnl.toFixed(2));

    // If remaining size is close to zero, close the entire trade instead
    if (remainingSize <= 0.01) {
      // Total PnL gets calculated on the original size
      let fullRawPnl = 0;
      if (trade.symbol === 'BTC/USDT') {
        fullRawPnl = priceDiff * trade.size * pnlMultiplier;
      } else if (trade.symbol === 'USD/JPY') {
        fullRawPnl = (priceDiff / 0.01) * trade.size * 0.1 * pnlMultiplier;
      } else {
        fullRawPnl = (priceDiff / 0.0001) * trade.size * 1.0 * pnlMultiplier;
      }

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

// AI Trader Composer: Draft multi-leg setups from natural language (Strictly Server-Side)
app.post('/api/gemini/compose', async (req, res) => {
  const { prompt, currentSymbol, currentPrice, strategyProfile, metrics } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const symbol = currentSymbol || 'EUR/USD';
  
  // Calculate intelligence pillars on-the-fly for the prompt context
  const hasMetrics = metrics && typeof metrics.atr === 'number';
  const liveAtr = hasMetrics ? metrics.atr : (symbol.includes('USDT') ? 450 : symbol.includes('JPY') ? 0.35 : 0.0035);
  const liveRsi = hasMetrics ? metrics.rsi : 50;
  const liveTrend = hasMetrics ? metrics.trend : 'NEUTRAL';
  const liveBias = hasMetrics ? metrics.dailyBias : 'BULLISH';
  const price = currentPrice || (hasMetrics ? metrics.currentPrice : (symbol.includes('USDT') ? 64000 : 1.0850));

  // Pillar 1: Liquidity Sweep Map
  const pdh = price + liveAtr * 1.25;
  const pdl = price - liveAtr * 1.4;
  const londonH = price + liveAtr * 0.65;
  const nyL = price - liveAtr * 0.95;

  // Pillar 2: Capital Regime
  let score = 50;
  if (liveRsi > 70 || liveRsi < 30) score += 20;
  if (liveTrend !== 'NEUTRAL') score += 15;
  let regimeType = 'MEAN REVERTING';
  if (score > 75) regimeType = 'VOLATILITY TREND RUN';
  else if (score < 35) regimeType = 'CONGESTION SQUEEZE';

  // Pillar 3: Intermarket Confluence Match
  let dxyBias = 'NEUTRAL';
  let matchPct = 78;
  if (symbol === 'USD/JPY') {
    dxyBias = liveBias === 'BULLISH' ? 'UPWARD BIAS' : 'DOWNWARD BIAS';
    matchPct = 84;
  } else if (symbol.includes('USDT')) {
    dxyBias = 'DXY LIQUIDITY CAPTURE';
    matchPct = 91;
  } else {
    dxyBias = liveBias === 'BULLISH' ? 'DOWNWARD BIAS' : 'UPWARD BIAS';
    matchPct = 72;
  }

  // Pillar 4: OB Invalidation cushions
  const cushionBuffer = liveAtr * 1.2;
  const lowerBoundInvalidation = price - cushionBuffer;
  const upperBoundInvalidation = price + cushionBuffer;

  // Multi-leg compound mock structure depending on symbol and instructions
  const getSimulatedDraft = (noticeMsg = '') => {
    const isSell = /sell|short|bear|down/i.test(prompt);
    const side = isSell ? 'SELL' : 'BUY';
    const isCrypto = /btc|eth|sol/i.test(symbol);
    const defaultLot = isCrypto ? 0.1 : 1.5;
    
    // Calculate entry stops targets
    const tickSign = side === 'BUY' ? 1 : -1;
    const isScalpingActive = strategyProfile === 'SCALPING';
    
    // For scalping, we force wider ATR/swing offset to fit the Institutional Swing rules
    const offset = isScalpingActive ? (price * 0.008) : (price * 0.003); // ~80 pips for compliance swing vs ~30 pips
    const isGrid = /grid|ladder|multi/i.test(prompt);
    const isHedged = /hedge|cover|protect|ratio/i.test(prompt);

    const orders = [];
    
    if (isGrid) {
      // 3-step grid ladder
      for (let i = 0; i < 3; i++) {
        const entryOffset = -1 * tickSign * (price * 0.001 * (i + 1));
        const entry = parseFloat((price + entryOffset).toFixed(isCrypto ? 2 : 5));
        const sl = parseFloat((entry - tickSign * offset).toFixed(isCrypto ? 2 : 5));
        const tp = parseFloat((entry + tickSign * offset * 2.2).toFixed(isCrypto ? 2 : 5));
        orders.push({
          symbol: symbol as MarketSymbol,
          side: side as 'BUY' | 'SELL',
          entryPrice: entry,
          stopLoss: sl,
          takeProfit: tp,
          size: parseFloat((defaultLot * (1 - i * 0.2)).toFixed(2)),
          reason: isScalpingActive 
            ? `Compliance Sanitized: swing grid leg #${i + 1} (H4 timeframe anchor)`
            : `AI Multi-Grid Leg #${i + 1} (${prompt.slice(0, 15)}...)`
        });
      }
    } else {
      // Single leg or standard bracket
      const sl = parseFloat((price - tickSign * offset).toFixed(isCrypto ? 2 : 5));
      const tp = parseFloat((price + tickSign * offset * 2.5).toFixed(isCrypto ? 2 : 5));
      orders.push({
        symbol: symbol as MarketSymbol,
        side: side as 'BUY' | 'SELL',
        entryPrice: price,
        stopLoss: sl,
        takeProfit: tp,
        size: defaultLot,
        reason: isScalpingActive 
          ? `Compliance Sanitized: H4 trend swing anchor`
          : `AI Composer Core Position (${prompt.slice(0, 20)}...)`
      });

      // Add a smart hedge if user requested hedging
      if (isHedged) {
        const hedgeSymbol = symbol === 'EUR/USD' ? 'USD/JPY' : symbol === 'BTC/USDT' ? 'ETH/USDT' : 'EUR/USD';
        const hedgeSide = side === 'BUY' ? 'BUY' : 'SELL'; // co-trending or inversely correlated
        const hedgePrice = hedgeSymbol === 'USD/JPY' ? 154.50 : hedgeSymbol === 'ETH/USDT' ? 2450.00 : 1.0850;
        const hedgeOffset = hedgePrice * (isScalpingActive ? 0.009 : 0.004);
        orders.push({
          symbol: hedgeSymbol as MarketSymbol,
          side: hedgeSide as 'BUY' | 'SELL',
          entryPrice: hedgePrice,
          stopLoss: parseFloat((hedgePrice - (hedgeSide === 'BUY' ? 1 : -1) * hedgeOffset).toFixed(hedgeSymbol === 'USD/JPY' ? 2 : 5)),
          takeProfit: parseFloat((hedgePrice + (hedgeSide === 'BUY' ? 1 : -1) * hedgeOffset * 2.0).toFixed(hedgeSymbol === 'USD/JPY' ? 2 : 5)),
          size: parseFloat((defaultLot * 0.6).toFixed(2)),
          reason: `AI Bracket Protection Hedge (${hedgeSymbol} Proxy)`
        });
      }
    }

    const explanationPrefix = isScalpingActive
      ? `[COMPLIANCE NOTICE: SCALPING BLOCKED] All client-initiated scalp orders are automatically sanitized to H4/D1 Swing structures under Rule IRB-91. `
      : (noticeMsg ? `[Simulated] ` : '');

    return {
      orders,
      reasoningExplanation: `${explanationPrefix}Constructed compound ${side.toLowerCase()} blueprint. The requested portfolio setup was evaluated under ${isScalpingActive ? 'Strict Swing-Only safety limits' : 'standard signal guidelines'}. Wider risk targets deployed representing ${isSell ? 'Premium margin resistance' : 'Discount mitigation pools'}.`,
      totalRisk: `${(orders.length * 0.5).toFixed(1)}% total systemic equity risk (1% fixed fraction lock)`,
      confluences: isScalpingActive 
        ? ['Rule IRB-91 Compliance Override Filter', 'High-Timeframe Liquidity Block Mitigation', 'Average True Range (ATR) SL safety mapping']
        : ['Structural directional bias alignment', 'Average True Range (ATR) SL safety mapping', 'Fair Value Gap mitigation fill indicator']
    };
  };

  const client = getGeminiClient();
  if (!client) {
    res.json(getSimulatedDraft('Offline simulation active: GEMINI_API_KEY is not defined.'));
    return;
  }

  try {
    let systemInstruction = `
You are the APEX MTX-QUANT Institutional Strategy Composer with embedded 4-tier analytics decision brain-power.
Your job is to read user trading instructions, evaluate the LIVE 4-pillar system intelligence metrics below, and respond with a highly precise trade layout JSON object.

LIVE INTELLIGENCE PILLARS DATA for ${symbol}:
--------------------------------------------------
Pillar 1: Liquidity Sweep Map & Volume Imbalances:
- PDH Sweep resistance level: ${pdh.toFixed(5)}
- PDL Sweep support level: ${pdl.toFixed(5)}
- London session High: ${londonH.toFixed(5)}
- NY session Low: ${nyL.toFixed(5)}

Pillar 2: Capital Regime Classifier:
- Current Regime: ${regimeType} (Volatility stress level: ${score}/100)

Pillar 3: Intermarket Confluence Match:
- DXY Dollar Index proxy bias: ${dxyBias}
- Macro Confluence Strength: ${matchPct}%

Pillar 4: Order Block Invalidation Cushion:
- Safety Margin ATR buffer size: ${cushionBuffer.toFixed(5)} (Stops must be padded by at least this amount to survive wick sweeps)
- Upper safety boundary: ${upperBoundInvalidation.toFixed(5)}
- Lower safety boundary: ${lowerBoundInvalidation.toFixed(5)}
--------------------------------------------------

CONSTRAINTS & RULES:
- You MUST act as the FINAL DECISION LAYER. Take these 4 analytic pillars into account when setting stopLoss and takeProfit values.
- For BUY positions, your stopLoss MUST be set below the Lower safety boundary (${lowerBoundInvalidation.toFixed(5)}).
- For SELL positions, your stopLoss MUST be set above the Upper safety boundary (${upperBoundInvalidation.toFixed(5)}).
- Under 'MEAN REVERTING' regime, place conservative takeProfit steps targets. Under 'VOLATILITY TREND RUN', write wider targets conforming to momentum continuation.
- In each order's 'reason' text, you MUST explicitly comment on how the 4-tier intelligence values (like PDH/PDL sweeps or ATR cushions) justified that leg's execution parameter decisions!

JSON scheme matches this exactly:
{
  "orders": [
    {
      "symbol": "${symbol}" (must strictly match system symbol names),
      "side": "BUY" or "SELL",
      "entryPrice": number,
      "stopLoss": number,
      "takeProfit": number,
      "size": number,
      "reason": "text explanation citing specific analytic pillars"
    }
  ],
  "reasoningExplanation": "Detailed analytic desk decision narrative synthesis combining regime, macro, and OB cushions",
  "totalRisk": "text describing calculated lot metric fractions",
  "confluences": ["string list of system confluences based on pillars"]
}

Available symbols: "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "EUR/GBP", "GOLD/USD", "SILVER/USD", "BTC/USDT", "ETH/USDT", "SOL/USDT", "US30", "NAS100", "GER40", "SPX500".
Current symbol is: ${symbol}. Current symbol price is: ${price}.

Return ONLY the raw valid JSON block. Do not wrap in markdown tags like \`\`\`json. Keep numbers realistic, with standard Forex pips (5 decimal places, e.g. 1.08345) and gold/crypto (2 decimal places, e.g. 2350.50). Place Stop Losses and Take Profits logically depending on side!
`;

    if (strategyProfile === 'SCALPING') {
      systemInstruction += `

CRITICAL COMPLIANCE DIRECTIVE: The user has activated a 'Scalping' strategy profile, but this platform is STRICTLY an Institutional Swing platform. You MUST reject all short-term/scalping mechanics (e.g. 1-minute, 5-minute charts, 5-pip stop losses, tick-scalping, high frequency trades). Modify the draft orders to use Institutional Swing parameters (4-Hour to Daily swing levels, wider ATR stop losses of 40-100 pips, and larger swing take profits of 100-300 pips) instead.
In the reasoningExplanation field, you MUST prepend this compliance notice: "[COMPLIANCE WARNING: SCALPING BLOCKED] This platform is strictly restricted to Institutional Swing positions. Under Rule IRB-91, high frequency scalping orders are automatically overridden to H4/D1 Swing profiles to mitigate systemic leverage risk."
`;
    }

    const result = await generateContentWithRetry(client, {
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: `Generate trade layout for prompt: "${prompt}". Current asset is ${symbol} priced at ${price}.` }] }],
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(result.text);
    res.json(parsed);

  } catch (error: any) {
    console.warn('Composer AI endpoint fallback:', error.message || error);
    res.json(getSimulatedDraft(`API fallback active (${error.message || 'connection bypass'}).`));
  }
});

// AI Script Compiler: Generate MQL5 Expert Advisor and TradingView Pine Script (Strictly Server-Side)
app.post('/api/gemini/compile', async (req, res) => {
  const { prompt, strategyProfile } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const getSimulatedCode = (noticeMsg = '') => {
    const isEma = /ema|sma|moving|cross/i.test(prompt);
    const isRsi = /rsi|oscillator|overbought/i.test(prompt);
    const isScalpingActive = strategyProfile === 'SCALPING';

    const title = isEma ? "EMA_Trend_Tracker_EA" : isRsi ? "RSI_Divergence_Exhaustion_EA" : "Apex_Grid_Liquidity_EA";

    const complianceNotice = isScalpingActive
      ? `// [COMPLIANCE OVERRIDE - RULE IRB-91] Scalping Mode sanitized & de-scaled.
// All short-term HFT/scalp target boundaries have been automatically upgraded to H4 Swing levels.\n\n`
      : '';

    const mqlCode = `${complianceNotice}//+------------------------------------------------------------------+
//|                                                 ${title}.mq5 |
//|                                  Copyright 2026, Apex Quant Labs |
//|                                             https://apex.quant   |
//+------------------------------------------------------------------+
#property copyright   "Copyright 2026, Apex Quant Labs"
#property link        "https://apex.quant"
#property version     "1.00"
#property description "Cursor-composed institutional agent with safety locks"
#property strict

//--- Input parameters
input group "=== Strategy Parameters ==="
input int      InpFastPeriod     = 14;       // Fast Indicator Period
input int      InpSlowPeriod     = 50;       // Slow Indicator Period
input double   InpLotSize        = 0.10;     // Standard Exec Lot size
input int      InpStopLossPips   = ${isScalpingActive ? '800' : '220'};      // Stop Loss (points, pips * 10)
input int      InpTakeProfitPips = ${isScalpingActive ? '2000' : '500'};     // Take Profit (points)

input group "=== Custom Risk Logic ==="
input double   MaxDailyHedgeLoss = 2.0;      // Maximum loss percentage (%)
input ENUM_TIMEFRAMES InpTimeframe = PERIOD_H4; // Forced Swing Timeframe bias

//--- Global Variables
int      fastHandle;
int      slowHandle;
datetime lastBarTime;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("Initializing Apex AI Agentic Engine: ${title}...");
   
   // Create handles for indicators
   fastHandle = iMA(_Symbol, InpTimeframe, InpFastPeriod, 0, MODE_EMA, PRICE_CLOSE);
   slowHandle = iMA(_Symbol, InpTimeframe, InpSlowPeriod, 0, MODE_EMA, PRICE_CLOSE);
   
   if(fastHandle == INVALID_HANDLE || slowHandle == INVALID_HANDLE)
   {
      Print("Error: Indicator initialization failed. Bridge abort.");
      return(INIT_FAILED);
   }
   
   lastBarTime = 0;
   Print("${title} Agent ready for real-time MT5 bridge pipeline.");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Safe high-timeframe bar checks
   datetime currentBarTime = iTime(_Symbol, InpTimeframe, 0);
   if(currentBarTime == lastBarTime) return; // run on bar close
   
   double fastValue[], slowValue[];
   ArraySetAsSeries(fastValue, true);
   ArraySetAsSeries(slowValue, true);
   
   if(CopyBuffer(fastHandle, 0, 0, 2, fastValue) < 2 ||
      CopyBuffer(slowHandle, 0, 0, 2, slowValue) < 2)
   {
      return;
   }
   
   // Check crossover triggers
   bool buyTrigger  = (fastValue[0] > slowValue[0]) && (fastValue[1] <= slowValue[1]);
   bool sellTrigger = (fastValue[0] < slowValue[0]) && (fastValue[1] >= slowValue[1]);
   
   if(buyTrigger)
   {
      Print("[AI TRIGGER] Bullish trend crossover caught. Dispatching Buy lots with target TP:" + IntegerToString(InpTakeProfitPips));
   }
   else if(sellTrigger)
   {
      Print("[AI TRIGGER] Bearish trend crossover caught. Dispatching Sell lots with stop protection.");
   }
   
   lastBarTime = currentBarTime;
}`;

    const pineCode = `${complianceNotice}//@version=5
strategy("${title}", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=1.0)

// --- Inputs ---
fastLen = input.int(14, title="Fast Line Length", group="Moving Averages")
slowLen = input.int(50, title="Slow Line Length", group="Moving Averages")
stopPerc = input.float(${isScalpingActive ? '3.5' : '1.5'}, title="Stop Loss (%)", group="Risk Filters")
takePerc = input.float(${isScalpingActive ? '8.5' : '3.5'}, title="Take Profit (%)", group="Risk Filters")

// --- Calculations ---
fastEMA = ta.ema(close, fastLen)
slowEMA = ta.ema(close, slowLen)

// --- Visual Plots ---
plot(fastEMA, color=color.indigo, linewidth=2, title="AI Fast Line")
plot(slowEMA, color=color.rose, linewidth=2, title="AI Slow Line")

// --- Signals ---
buySignal  = ta.crossover(fastEMA, slowEMA)
sellSignal = ta.crossunder(fastEMA, slowEMA)

// --- Logic Execution ---
if (buySignal)
    strategy.entry("AI-Long", strategy.long, comment="Apex Bullish Entry")
    strategy.exit("Close-Long", "AI-Long", loss=close * (stopPerc / 100) / syminfo.mintick, profit=close * (takePerc / 100) / syminfo.mintick)

if (sellSignal)
    strategy.entry("AI-Short", strategy.short, comment="Apex Bearish Entry")
    strategy.exit("Close-Short", "AI-Short", loss=close * (stopPerc / 100) / syminfo.mintick, profit=close * (takePerc / 100) / syminfo.mintick)
`;

    const explanationPrefix = isScalpingActive
      ? `[COMPLIANCE OVERRIDE - SCALPING SANITIZED] All scalp parameters parsed from the prompt were modified. EA logic is calibrated to Period H4 with extended swing parameters per compliance bylaws. `
      : (noticeMsg ? `[Simulated Model Guidance]\n` : '');

    return {
      mql5Code: mqlCode,
      pineCode: pineCode,
      explanation: `${explanationPrefix}This automated advisor uses **EMA dynamic structures** as the main filter. When the fast line crosses the slow line, we dispatch trades with built-in slippage tolerance protections. Risk calculations are constrained strictly to 1.5% of equity per trade block.`,
      parameters: [
        { name: "InpFastPeriod", val: "14", desc: "Fast indicator boundary" },
        { name: "InpSlowPeriod", val: "50", desc: "Slow baseline filter" },
        { name: "InpStopLossPips", val: isScalpingActive ? "800" : "220", desc: "Safety stop loss limit (points)" },
        { name: "InpTakeProfitPips", val: isScalpingActive ? "2000" : "500", desc: "Target limit (points)" }
      ]
    };
  };

  const client = getGeminiClient();
  if (!client) {
    res.json(getSimulatedCode('Offline simulation active: GEMINI_API_KEY is not defined.'));
    return;
  }

  try {
    let systemInstruction = `
You are the Apex Institutional Code Sandbox Compiler.
Your job is to read user inquiries about trading strategies or scripts (e.g. "EMA 20 cross", "RSI divergence scalper") and generate an Expert Advisor script in MQL5 (MetaTrader 5) and TradingView Pine Script v5.
Respond with a strict, beautifully structured JSON object containing exactly these keys:
{
  "mql5Code": "write highly polished, realistic, compile-ready MQL5 code here as a single string",
  "pineCode": "write highly polished, valid Pine Script v5 code here as a single string",
  "explanation": "short markdown bullet explanation of strategy logic and how parameters align with institutional ICT or trade bible ideas",
  "parameters": [
    { "name": "parameter name", "val": "default value", "desc": "description of use" }
  ]
}

Ensure the code has appropriate structure, parameters, comments, input variables, handles, and logic block definitions. Avoid mock syntax, keep it completely compilable! Keep output clean and valid JSON. Do not wrap in markdown \`\`\`json tags. Run raw string escaping where needed.
`;

    if (strategyProfile === 'SCALPING') {
      systemInstruction += `

CRITICAL COMPLIANCE DIRECTIVE: The user has activated a 'Scalping' strategy profile, but this platform is STRICTLY an Institutional Swing platform. You MUST reject all short-term/scalping parameters (e.g. tight 5-pip stop losses, fast EMA crosses under 1-minute or 5-minute timeframes, HFT/scalp triggers). Ensure your generated MQL5 code and TradingView Pine Script code strictly utilize 4-Hour / H4 or Daily timeframe filters, wider institutional swing parameters (at least 50-150 pips stop losses), and long-term trend following indicators.
Prepend a prominent block comment stating that the advisor was automatically compliance-realigned to Swing trading. In the explanation field, explain that scalping strategy parameters were blocked and migrated to Institutional Swing per IRB-91 risk rules.
`;
    }

    const result = await generateContentWithRetry(client, {
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: `Generate compilable trading script for: "${prompt}"` }] }],
      config: {
        systemInstruction,
        temperature: 0.15,
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(result.text);
    res.json(parsed);

  } catch (error: any) {
    console.warn('Compiler AI endpoint fallback:', error.message || error);
    res.json(getSimulatedCode(`API fallback active (${error.message || 'connection bypass'}).`));
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
