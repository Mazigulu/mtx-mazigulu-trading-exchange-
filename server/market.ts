/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candlestick, FVG, OrderBlock, LiquiditySweep, MarketMetrics, MarketSymbol } from '../src/types';

// Simple indicator calculations
function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  if (prices.length === 0) return ema;
  const k = 2 / (period + 1);
  let prevEma = prices[0];
  ema.push(prevEma);

  for (let i = 1; i < prices.length; i++) {
    const curEma = prices[i] * k + prevEma * (1 - k);
    ema.push(curEma);
    prevEma = curEma;
  }
  return ema;
}

function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(prices[i]); // Use self
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += prices[i - j];
      }
      sma.push(sum / period);
    }
  }
  return sma;
}

function calculateRSI(prices: number[], period = 14): number[] {
  const rsi: number[] = [];
  if (prices.length < 2) return Array(prices.length).fill(50);

  let gains = 0;
  let losses = 0;

  // Initial rsi
  for (let i = 1; i <= period && i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      rsi.push(50);
    } else {
      const diff = prices[i] - prices[i - 1];
      avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;

      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }
  }

  return rsi;
}

function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const tr: number[] = [];
  tr.push(highs[0] - lows[0]);

  for (let i = 1; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    tr.push(Math.max(hl, hc, lc));
  }

  const atr: number[] = [];
  let sum = 0;
  for (let i = 0; i < tr.length; i++) {
    if (i < period) {
      sum += tr[i];
      atr.push(sum / (i + 1));
    } else {
      const curAtr = (atr[i - 1] * (period - 1) + tr[i]) / period;
      atr.push(curAtr);
    }
  }

  return atr;
}

function getDecimals(symbol: string): number {
  if (symbol.includes('JPY') || symbol.includes('GOLD') || symbol.includes('SILVER') || symbol === 'SOL/USDT' || symbol === 'US30' || symbol === 'NAS100' || symbol === 'GER40' || symbol === 'SPX500') {
    return 2;
  }
  if (symbol === 'BTC/USDT' || symbol === 'ETH/USDT') {
    return 1;
  }
  return 5;
}

export class MarketSimulator {
  private candles: Record<MarketSymbol, Candlestick[]> = {
    'EUR/USD': [],
    'GBP/USD': [],
    'USD/JPY': [],
    'AUD/USD': [],
    'EUR/GBP': [],
    'GOLD/USD': [],
    'SILVER/USD': [],
    'BTC/USDT': [],
    'ETH/USDT': [],
    'SOL/USDT': [],
    'US30': [],
    'NAS100': [],
    'GER40': [],
    'SPX500': []
  };

  private mt5Active: Record<MarketSymbol, boolean> = {
    'EUR/USD': false,
    'GBP/USD': false,
    'USD/JPY': false,
    'AUD/USD': false,
    'EUR/GBP': false,
    'GOLD/USD': false,
    'SILVER/USD': false,
    'BTC/USDT': false,
    'ETH/USDT': false,
    'SOL/USDT': false,
    'US30': false,
    'NAS100': false,
    'GER40': false,
    'SPX500': false
  };

  private basePrices: Record<MarketSymbol, number> = {
    'EUR/USD': 1.1645,
    'GBP/USD': 1.2680,
    'USD/JPY': 155.40,
    'AUD/USD': 0.6650,
    'EUR/GBP': 0.8520,
    'GOLD/USD': 2355.50,
    'SILVER/USD': 29.50,
    'BTC/USDT': 67500.0,
    'ETH/USDT': 3450.0,
    'SOL/USDT': 148.50,
    'US30': 38850.0,
    'NAS100': 18550.0,
    'GER40': 18200.0,
    'SPX500': 5300.0
  };

  private tickSizes: Record<MarketSymbol, number> = {
    'EUR/USD': 0.0001,
    'GBP/USD': 0.0001,
    'USD/JPY': 0.01,
    'AUD/USD': 0.0001,
    'EUR/GBP': 0.0001,
    'GOLD/USD': 0.10,
    'SILVER/USD': 0.01,
    'BTC/USDT': 10.0,
    'ETH/USDT': 1.0,
    'SOL/USDT': 0.05,
    'US30': 1.0,
    'NAS100': 1.0,
    'GER40': 1.0,
    'SPX500': 0.10
  };

  constructor() {
    this.initializeAll();
    // Start live updates
    setInterval(() => this.tickAll(), 5000);
  }

  private initializeAll() {
    const symbols = Object.keys(this.basePrices) as MarketSymbol[];
    for (const sym of symbols) {
      this.candles[sym] = this.generateHistory(sym);
    }
  }

  private generateHistory(symbol: MarketSymbol): Candlestick[] {
    const list: Candlestick[] = [];
    const base = this.basePrices[symbol];
    const tick = this.tickSizes[symbol];
    let currentPrice = base;

    // We generate 240 candles representing 4H units
    const now = new Date();
    for (let i = 240; i >= 1; i--) {
      const time = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
      const isUp = Math.random() > 0.45; // slight bullish tint
      const bodySize = (Math.random() * 5 + 1) * tick * (symbol.startsWith('BTC') ? 20 : 5);
      const wickHigh = Math.random() * 3 * tick * (symbol.startsWith('BTC') ? 10 : 3);
      const wickLow = Math.random() * 3 * tick * (symbol.startsWith('BTC') ? 10 : 3);

      const open = currentPrice;
      const close = isUp ? open + bodySize : open - bodySize;
      const high = Math.max(open, close) + wickHigh;
      const low = Math.min(open, close) - wickLow;
      const volume = Math.floor(Math.random() * 10000) + 5000;
      const dec = getDecimals(symbol);

      list.push({
        timestamp: time.toISOString(),
        open: parseFloat(open.toFixed(dec)),
        high: parseFloat(high.toFixed(dec)),
        low: parseFloat(low.toFixed(dec)),
        close: parseFloat(close.toFixed(dec)),
        volume
      });

      currentPrice = close;
    }

    this.recalculateIndicators(list);
    return list;
  }

  private recalculateIndicators(list: Candlestick[]) {
    const closes = list.map(c => c.close);
    const highs = list.map(c => c.high);
    const lows = list.map(c => c.low);

    const ema50 = calculateEMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);
    const rsi = calculateRSI(closes, 14);
    const atr = calculateATR(highs, lows, closes, 14);

    for (let i = 0; i < list.length; i++) {
      list[i].ema50 = parseFloat(ema50[i].toFixed(5));
      list[i].sma200 = parseFloat(sma200[i].toFixed(5));
      list[i].rsi = parseFloat(rsi[i].toFixed(1));
      list[i].atr = parseFloat(atr[i].toFixed(5));
    }
  }

  private tickAll() {
    const symbols = Object.keys(this.basePrices) as MarketSymbol[];
    for (const sym of symbols) {
      const list = this.candles[sym];
      if (list.length === 0) continue;

      const last = list[list.length - 1];
      const tick = this.tickSizes[sym];
      const drift = (Math.random() - 0.495) * tick * (sym.startsWith('BTC') ? 8 : 4);

      // Mutate current (last) candle's close
      const newClose = last.close + drift;
      const dec = getDecimals(sym);
      last.close = parseFloat(newClose.toFixed(dec));
      if (last.close > last.high) last.high = last.close;
      if (last.close < last.low) last.low = last.close;

      // Occasional new candle generation (10% chance) - ONLY if MT5 Python bridge is not active
      if (!this.mt5Active[sym] && Math.random() > 0.90) {
        // Shift list, add new candle
        const nextTime = new Date(new Date(last.timestamp).getTime() + 4 * 60 * 60 * 1000);
        list.shift();
        list.push({
          timestamp: nextTime.toISOString(),
          open: last.close,
          high: last.close,
          low: last.close,
          close: last.close,
          volume: Math.floor(Math.random() * 10000) + 5000
        });
      }

      this.recalculateIndicators(list);
    }
  }

  public getCandles(symbol: MarketSymbol): Candlestick[] {
    // Return live H4 price streams (if active, these are fetched from the live MT5 Python Terminal bridge)
    return this.candles[symbol] || [];
  }

  public getMarketMetrics(symbol: MarketSymbol): MarketMetrics {
    // Wrapper for live market validation integrated with the MT5 bridge
    return this.getMetrics(symbol);
  }

  public updateFromMT5(symbol: MarketSymbol, rawCandles: any[]): boolean {
    if (!this.candles[symbol]) return false;

    // Map and sanitize the incoming rates from the MetaTrader 5 terminal Python connector
    const formatted: Candlestick[] = rawCandles.map(c => ({
      timestamp: c.timestamp,
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close),
      volume: parseInt(c.volume) || 0
    }));

    // Retain a fixed size of historical bars to keep indicator calculation responsive
    this.candles[symbol] = formatted.slice(-50);
    this.recalculateIndicators(this.candles[symbol]);
    this.mt5Active[symbol] = true;
    return true;
  }

  public getMT5Status(): Record<MarketSymbol, boolean> {
    return this.mt5Active;
  }

  public getFVGs(symbol: MarketSymbol): FVG[] {
    const list = this.candles[symbol] || [];
    const fvgs: FVG[] = [];

    // Analyze three consecutive candles
    for (let i = 1; i < list.length - 1; i++) {
      const prev = list[i - 1];
      const curr = list[i];
      const next = list[i + 1];

      // Bullish FVG: Low of next candle is higher than High of previous candle
      if (next.low > prev.high) {
        fvgs.push({
          id: `fvg-up-${symbol}-${i}`,
          index: i,
          type: 'BULLISH',
          gapStart: prev.high,
          gapEnd: next.low,
          isMitigated: list.slice(i + 2).some(c => c.low <= next.low),
          timestamp: curr.timestamp
        });
      }
      // Bearish FVG: High of next candle is lower than Low of previous candle
      else if (next.high < prev.low) {
        fvgs.push({
          id: `fvg-down-${symbol}-${i}`,
          index: i,
          type: 'BEARISH',
          gapStart: prev.low,
          gapEnd: next.high,
          isMitigated: list.slice(i + 2).some(c => c.high >= next.high),
          timestamp: curr.timestamp
        });
      }
    }
    return fvgs;
  }

  public getOrderBlocks(symbol: MarketSymbol): OrderBlock[] {
    const list = this.candles[symbol] || [];
    const obs: OrderBlock[] = [];

    // Simple Order Block heuristic: 
    // Bullish OB: Last down-close candle before a prominent upward expansion (or market structure break)
    // Bearish OB: Last up-close candle before a prominent downward expansion
    for (let i = 5; i < list.length - 3; i++) {
      const curr = list[i];
      const next1 = list[i + 1];
      const next2 = list[i + 2];
      const next3 = list[i + 3];

      // Bullish Check: candle i is red/bearish, next three are strongly green/bullish
      const isRed = curr.close < curr.open;
      const isNextBullish = next1.close > next1.open && next2.close > next2.open && next3.close > next3.open;
      // Net change calculation to measure institutional displacement
      const displacement = next3.close - next1.open;
      const minDisplacement = this.tickSizes[symbol] * (symbol === 'BTC/USDT' ? 50 : symbol === 'GOLD/USD' ? 15 : symbol === 'USD/JPY' ? 0.3 : 0.0020);

      if (isRed && isNextBullish && displacement > minDisplacement) {
        obs.push({
          id: `ob-bullish-${symbol}-${i}`,
          index: i,
          type: 'BULLISH',
          high: curr.high,
          low: curr.low,
          isBroken: list.slice(i + 4).some(c => c.close < curr.low),
          timestamp: curr.timestamp
        });
      }

      // Bearish Check: candle i is green/bullish, next three are strongly red/bearish
      const isGreen = curr.close > curr.open;
      const isNextBearish = next1.close < next1.open && next2.close < next2.open && next3.close < next3.open;
      const downDisplacement = next1.open - next3.close;

      if (isGreen && isNextBearish && downDisplacement > minDisplacement) {
        obs.push({
          id: `ob-bearish-${symbol}-${i}`,
          index: i,
          type: 'BEARISH',
          high: curr.high,
          low: curr.low,
          isBroken: list.slice(i + 4).some(c => c.close > curr.high),
          timestamp: curr.timestamp
        });
      }
    }
    return obs;
  }

  public getSweeps(symbol: MarketSymbol): LiquiditySweep[] {
    const list = this.candles[symbol] || [];
    const sweeps: LiquiditySweep[] = [];

    // Liquidity Sweeps: Price spikes beyond previous swing high/low, then closes back inside
    for (let i = 10; i < list.length; i++) {
      const curr = list[i];

      // Formulate local Swing Low / High over past 10 candles (index i-10 to i-1)
      const neighborhoodHigh = Math.max(...list.slice(i - 10, i).map(c => c.high));
      const neighborhoodLow = Math.min(...list.slice(i - 10, i).map(c => c.low));

      // Buy side sweep: High sweeps past old high, but candle closes back below it
      if (curr.high > neighborhoodHigh && curr.close < neighborhoodHigh) {
        sweeps.push({
          id: `sweep-buyside-${symbol}-${i}`,
          index: i,
          type: 'BUY_SIDE',
          level: neighborhoodHigh,
          timestamp: curr.timestamp
        });
      }

      // Sell side sweep: Low spikes below old low, but candle closes back above it
      if (curr.low < neighborhoodLow && curr.close > neighborhoodLow) {
        sweeps.push({
          id: `sweep-sellside-${symbol}-${i}`,
          index: i,
          type: 'SELL_SIDE',
          level: neighborhoodLow,
          timestamp: curr.timestamp
        });
      }
    }
    return sweeps;
  }

  public getMetrics(symbol: MarketSymbol): MarketMetrics {
    const list = this.candles[symbol];
    const last = list[list.length - 1];
    const fvgs = this.getFVGs(symbol);
    const obs = this.getOrderBlocks(symbol);

    // Determine bias: close > ema50 is bullish
    const ema50Val = last.ema50 || last.close;
    const isBull = last.close > ema50Val;

    // Support and resistance: gathered from unmitigated/unbroken OBs
    const activeOBs = obs.filter(o => !o.isBroken);
    const supportLevels = activeOBs.filter(o => o.type === 'BULLISH').map(o => o.low).slice(-2);
    const resistanceLevels = activeOBs.filter(o => o.type === 'BEARISH').map(o => o.high).slice(-2);

    return {
      atr: last.atr || 0.0010,
      rsi: last.rsi || 50,
      trend: last.close > ema50Val ? 'BULLISH' : 'BEARISH',
      dailyBias: isBull ? 'BULLISH' : 'BEARISH',
      supportLevels: supportLevels.length > 0 ? supportLevels : [last.close * 0.99],
      resistanceLevels: resistanceLevels.length > 0 ? resistanceLevels : [last.close * 1.01],
      currentPrice: last.close
    };
  }

  public getOrderBook(symbol: MarketSymbol): { bids: { price: number; amount: number }[]; asks: { price: number; amount: number }[]; imbalance: number } {
    const list = this.candles[symbol];
    const price = list[list.length - 1].close;
    const tick = this.tickSizes[symbol];

    const bids: { price: number; amount: number }[] = [];
    const asks: { price: number; amount: number }[] = [];

    // Create 8 layers of bid/ask
    let totalBidVol = 0;
    let totalAskVol = 0;

    for (let i = 1; i <= 8; i++) {
      const bPrice = price - i * tick * (Math.random() * 0.5 + 0.8);
      const aPrice = price + i * tick * (Math.random() * 0.5 + 0.8);

      // Create buy/sell blocks (institutional order block simulation)
      // If we are at a significant level, we increase liquidity (matching order block theory)
      const bidAmt = Math.floor(Math.random() * 80) + 10 + (i === 3 || i === 5 ? 200 : 0);
      const askAmt = Math.floor(Math.random() * 80) + 10 + (i === 2 || i === 6 ? 180 : 0);

      totalBidVol += bidAmt;
      totalAskVol += askAmt;

      const dec = getDecimals(symbol);
      bids.push({ price: parseFloat(bPrice.toFixed(dec)), amount: bidAmt });
      asks.push({ price: parseFloat(aPrice.toFixed(dec)), amount: askAmt });
    }

    const imbalance = Math.round(((totalBidVol - totalAskVol) / (totalBidVol + totalAskVol)) * 100);

    return { bids, asks, imbalance };
  }
}
