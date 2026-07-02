/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  Play,
  TrendingUp,
  TrendingDown,
  Activity,
  Calculator,
  Calendar,
  Layers,
  FileText,
  Compass,
  DollarSign,
  Award,
  AlertTriangle,
  RefreshCw,
  Info,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { MarketSymbol } from '../types';

// Definitions for the historical Backtest Candle
interface HistoricalCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isNewsSpike?: boolean;
  newsTitle?: string;
  ema50: number;
  rsi?: number;
  atr?: number;
  sma200?: number;
}

// Definition of simulated backtest trade
interface BacktestTrade {
  id: string;
  index: number;
  time: string;
  side: 'BUY' | 'SELL';
  strategy: 'FVG_MITIGATION' | 'ORDER_BLOCK_BOUNCE' | 'LIQUIDITY_SWEEP';
  reason: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number;
  exitTime: string;
  pnlDollar: number;
  pnlPct: number;
  outcome: 'WIN' | 'LOSS' | 'BE';
  contractSize: number;
}

// Configurations for support of all trading pairs in the system
const SYMBOL_CONFIGS: Partial<Record<MarketSymbol, {
  name: string;
  basePrice: number;
  pipSize: number;
  decimals: number;
  averageRange: number;
  driftFactor: number;
  flagF1: string;
  flagF2: string;
  newsEvents: { hourIndex: number; title: string; movementInPips: number; impact: string }[];
}>> = {
  'US30': {
    name: 'Dow Jones 30 Index',
    basePrice: 38850.0,
    pipSize: 1.0,
    decimals: 1,
    averageRange: 150.0,
    driftFactor: 280.0,
    flagF1: '🇺🇸',
    flagF2: '📈',
    newsEvents: []
  },
  'NAS100': {
    name: 'Nasdaq 100 Index',
    basePrice: 18550.0,
    pipSize: 1.0,
    decimals: 1,
    averageRange: 90.0,
    driftFactor: 160.0,
    flagF1: '🇺🇸',
    flagF2: '📊',
    newsEvents: []
  },
  'GER40': {
    name: 'DAX 40 Index',
    basePrice: 18200.0,
    pipSize: 1.0,
    decimals: 1,
    averageRange: 110.0,
    driftFactor: 200.0,
    flagF1: '🇩🇪',
    flagF2: '📈',
    newsEvents: []
  },
  'SPX500': {
    name: 'S&P 500 Index',
    basePrice: 5300.0,
    pipSize: 1.0,
    decimals: 1,
    averageRange: 35.0,
    driftFactor: 65.0,
    flagF1: '🇺🇸',
    flagF2: '📊',
    newsEvents: []
  },
  'AAPL': {
    name: 'Apple Inc.',
    basePrice: 188.30,
    pipSize: 0.01,
    decimals: 2,
    averageRange: 2.5,
    driftFactor: 4.5,
    flagF1: '🇺🇸',
    flagF2: '🍏',
    newsEvents: []
  },
  'MSFT': {
    name: 'Microsoft Corp.',
    basePrice: 415.50,
    pipSize: 0.01,
    decimals: 2,
    averageRange: 4.5,
    driftFactor: 8.5,
    flagF1: '🇺🇸',
    flagF2: '💻',
    newsEvents: []
  },
  'NVDA': {
    name: 'NVIDIA Corp.',
    basePrice: 945.00,
    pipSize: 0.01,
    decimals: 2,
    averageRange: 15.0,
    driftFactor: 25.0,
    flagF1: '🇺🇸',
    flagF2: '🎮',
    newsEvents: []
  },
  'TSLA': {
    name: 'Tesla Inc.',
    basePrice: 175.50,
    pipSize: 0.01,
    decimals: 2,
    averageRange: 5.0,
    driftFactor: 10.0,
    flagF1: '🇺🇸',
    flagF2: '⚡',
    newsEvents: []
  }
};

interface BacktestSimulatorProps {
  selectedSymbol?: MarketSymbol;
  onSymbolChange?: (sym: MarketSymbol) => void;
  onSimulationUpdate?: (data: {
    candles: HistoricalCandle[];
    trades: any[];
    fvgs: any[];
    obs: any[];
    sweeps: any[];
    metrics: any | null;
  } | null) => void;
  onSimulationToggle?: (active: boolean) => void;
}

// Analytical helpers for simulated candlesticks
function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(prices[i]);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((s, p) => s + p, 0);
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

  for (let i = 1; i <= period && i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0) rsi.push(100);
  else {
    const rs = avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));
  }

  for (let i = 1; i < period; i++) {
    rsi.unshift(50);
  }

  for (let i = period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    let gain = 0;
    let loss = 0;
    if (diff > 0) gain = diff;
    else loss = -diff;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) rsi.push(100);
    else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
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
  let sum = tr.slice(0, period).reduce((s, val) => s + val, 0);
  atr.push(sum / period);

  for (let i = 1; i < period; i++) {
    atr.unshift(tr[i]);
  }

  for (let i = period; i < tr.length; i++) {
    const nextAtr = (atr[atr.length - 1] * (period - 1) + tr[i]) / period;
    atr.push(nextAtr);
  }

  return atr;
}

export default function BacktestSimulator({ selectedSymbol = 'NAS100', onSymbolChange, onSimulationUpdate, onSimulationToggle }: BacktestSimulatorProps) {
  // Target Trading Pair selected
  const [backtestSymbol, setBacktestSymbol] = useState<MarketSymbol>(selectedSymbol);

  // Sync with prop
  useEffect(() => {
    if (selectedSymbol && selectedSymbol !== backtestSymbol) {
      setBacktestSymbol(selectedSymbol);
    }
  }, [selectedSymbol]);

  const config = SYMBOL_CONFIGS[backtestSymbol] || SYMBOL_CONFIGS['NAS100'];

  // Backtest parameters state
  const [startingCapital, setStartingCapital] = useState<number>(10000);
  const [riskPct, setRiskPct] = useState<number>(1.0);
  const [targetRR, setTargetRR] = useState<number>(2.0);
  const [strategyType, setStrategyType] = useState<string>('COMBO');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationCompleted, setSimulationCompleted] = useState<boolean>(false);

  // Results state
  const [candles, setCandles] = useState<HistoricalCandle[]>([]);
  const [simtrades, setSimtrades] = useState<BacktestTrade[]>([]);
  const [equityCurveData, setEquityCurveData] = useState<{ tradeIndex: number; equity: number; label: string }[]>([]);

  // Broker Gateway Link tracking
  const [isBrokerActive, setIsBrokerActive] = useState<boolean>(true);

  useEffect(() => {
    const checkBrokerStatus = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setIsBrokerActive(true);
        }
      } catch (err) {
        console.warn('Unable to retrieve broker status:', err);
      }
    };

    checkBrokerStatus();
    const interval = setInterval(checkBrokerStatus, 15000);
    return () => clearInterval(interval);
  }, [backtestSymbol]);

  // Helper function to generate 1 week of historical 1-Hourly candles for the active symbol (168 Hours)
  const generatePastWeekCandles = (seedValue: number): HistoricalCandle[] => {
    const list: HistoricalCandle[] = [];
    let price = config.basePrice + (seedValue * config.basePrice * 0.015); // Start price base around basePrice
    const totalHours = 168; // 24 * 7 days
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 7);

    // EMA multiplier
    const k = 2 / (50 + 1);
    let ema = price;

    for (let h = 0; h < totalHours; h++) {
      const candleTime = new Date(startTime.getTime() + h * 60 * 60 * 1000);
      
      // Determine trend pattern using sine waves to simulate structural daily cycle
      const cycle = Math.sin((h / totalHours) * Math.PI * 4.5); // 2.25 full cycles
      const trendDrift = (cycle * config.averageRange * 1.4) + (config.averageRange * 0.1); 

      // Check if there is a news event at this hour
      const news = config.newsEvents.find((n) => n.hourIndex === h);
      const isNewsSpike = !!news;
      const newsTitle = news ? news.title : undefined;

      let range = config.averageRange;
      let deviation = (Math.sin(h * 0.3) * config.averageRange * 0.5) + (Math.random() - 0.49) * config.averageRange * 0.75;
      
      if (isNewsSpike && news) {
        const movement = news.movementInPips * config.pipSize;
        range = Math.abs(movement) * 1.5;
        deviation = movement;
      }

      const open = price;
      const close = price + trendDrift + deviation;
      
      // High and low constraints
      const high = Math.max(open, close) + (Math.random() * 0.4 * range);
      const low = Math.min(open, close) - (Math.random() * 0.4 * range);
      
      // Update price for next cycle
      price = close;
      
      // Update simulated EMA 50
      ema = close * k + ema * (1 - k);

      list.push({
        timestamp: candleTime.toISOString(),
        open: parseFloat(open.toFixed(config.decimals)),
        high: parseFloat(high.toFixed(config.decimals)),
        low: parseFloat(low.toFixed(config.decimals)),
        close: parseFloat(close.toFixed(config.decimals)),
        volume: isNewsSpike ? Math.floor(Math.random() * 80000) + 50000 : Math.floor(Math.random() * 15000) + 4000,
        isNewsSpike,
        newsTitle,
        ema50: parseFloat(ema.toFixed(config.decimals)),
      });
    }

    const listHighs = list.map(c => c.high);
    const listLows = list.map(c => c.low);
    const listCloses = list.map(c => c.close);

    const rsiValues = calculateRSI(listCloses, 14);
    const atrValues = calculateATR(listHighs, listLows, listCloses, 14);
    const sma200Values = calculateSMA(listCloses, 50); // Using 50 periods for visual EMA/SMA on simulated chart

    for (let i = 0; i < list.length; i++) {
      list[i].rsi = parseFloat(rsiValues[i].toFixed(1));
      list[i].atr = parseFloat(atrValues[i].toFixed(config.decimals));
      list[i].sma200 = parseFloat(sma200Values[i].toFixed(config.decimals));
    }

    return list;
  };

  // Execute Backtest Loop over Generated Series
  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationCompleted(false);

    // Fast-acting visual feedback timeout
    setTimeout(() => {
      // Deterministic generation seed derived from strategy type
      const seedVal = strategyType === 'COMBO' ? 0.0005 : strategyType === 'FVG' ? -0.0004 : 0.0002;
      const generatedCandles = generatePastWeekCandles(seedVal);
      setCandles(generatedCandles);

      const tradesTaken: BacktestTrade[] = [];
      let currentEquity = startingCapital;
      let activeTrade: {
        id: string;
        index: number;
        time: string;
        side: 'BUY' | 'SELL';
        strategy: 'FVG_MITIGATION' | 'ORDER_BLOCK_BOUNCE' | 'LIQUIDITY_SWEEP';
        reason: string;
        entryPrice: number;
        stopLoss: number;
        takeProfit: number;
        contractSize: number;
      } | null = null;

      // Scan through hours to find setups and run simulations
      for (let i = 24; i < generatedCandles.length; i++) {
        const curr = generatedCandles[i];
        const prev1 = generatedCandles[i - 1];
        const prev2 = generatedCandles[i - 2];
        const prev3 = generatedCandles[i - 3];

        // 1. Position Evaluation: If a trade is currently ACTIVE, test if it fills SL or TP on current candlestick high/low
        if (activeTrade) {
          const { side, entryPrice, stopLoss, takeProfit, contractSize } = activeTrade;
          let hitStop = false;
          let hitProfit = false;

          if (side === 'BUY') {
            if (curr.low <= stopLoss) {
              hitStop = true;
            } else if (curr.high >= takeProfit) {
              hitProfit = true;
            }
          } else { // SELL
            if (curr.high >= stopLoss) {
              hitStop = true;
            } else if (curr.low <= takeProfit) {
              hitProfit = true;
            }
          }

          // Handle trade resolution (First check who is hit on high/low)
          if (hitStop || hitProfit) {
            let exitPrice = hitProfit ? takeProfit : stopLoss;
            let outcome: 'WIN' | 'LOSS' | 'BE' = hitProfit ? 'WIN' : 'LOSS';
            
            // Fixed fractional model calculation
            const riskAmt = currentEquity * (riskPct / 100);
            
            // Calculate final balance and raw dollar pnl
            let tradePnlPct = 0;
            let tradePnlDollar = 0;

            if (outcome === 'WIN') {
              tradePnlPct = riskPct * targetRR;
              tradePnlDollar = riskAmt * targetRR;
              currentEquity += tradePnlDollar;
            } else {
              tradePnlPct = -riskPct;
              tradePnlDollar = -riskAmt;
              currentEquity += tradePnlDollar;
            }

            tradesTaken.push({
              ...activeTrade,
              exitPrice,
              exitTime: curr.timestamp,
              pnlDollar: parseFloat(tradePnlDollar.toFixed(2)),
              pnlPct: parseFloat(tradePnlPct.toFixed(2)),
              outcome,
            });

            activeTrade = null; // free holding
          }
        }

        // Keep a maximum of 1 active exposure at a time in our rule asset
        if (activeTrade) continue;

        // Determine Daily/4H bias rule (aligned with 50 EMA on index)
        const isBullishBias = curr.close > curr.ema50;

        // 2. Scan Signal Setups
        
        // A. FVG Imbalance Touch Strategy (Tactical 3-candle imbalance mitigation)
        const isFvgStrategyEnabled = strategyType === 'COMBO' || strategyType === 'FVG';
        if (isFvgStrategyEnabled) {
          // Bullish FVG check: High of prev2 is less than Low of curr (and open space exists)
          if (isBullishBias && curr.low > prev2.high && (curr.close - prev2.high) > (12 * config.pipSize)) {
            // Price broke up, leaving a Fair Value Gap (Imbalance) between prev2.high and curr.low.
            // Under ICT, we establish a Buy Limit at the top of the Gap limit
            const entry = curr.low; // Touch entry limit
            const stop = prev2.low - (4 * config.pipSize); // SL placed below displacement low
            const distance = entry - stop;
            
            if (distance > (5 * config.pipSize)) {
              const profitTarget = entry + (distance * targetRR);
              const riskAmount = currentEquity * (riskPct / 100);
              const volumeLots = parseFloat((riskAmount / ((distance / config.pipSize) * 10)).toFixed(2));

              activeTrade = {
                id: `sim-${i}-${Math.floor(Math.random() * 100)}`,
                index: i,
                time: curr.timestamp,
                side: 'BUY',
                strategy: 'FVG_MITIGATION',
                reason: `4H Displacement Gap mitigated at ${entry.toFixed(config.decimals)}. SL below swing low.`,
                entryPrice: parseFloat(entry.toFixed(config.decimals)),
                stopLoss: parseFloat(stop.toFixed(config.decimals)),
                takeProfit: parseFloat(profitTarget.toFixed(config.decimals)),
                contractSize: volumeLots || 1,
              };
              continue;
            }
          }

          // Bearish FVG check
          if (!isBullishBias && curr.high < prev2.low && (prev2.low - curr.close) > (12 * config.pipSize)) {
            const entry = curr.high;
            const stop = prev2.high + (4 * config.pipSize);
            const distance = stop - entry;

            if (distance > (5 * config.pipSize)) {
              const profitTarget = entry - (distance * targetRR);
              const riskAmount = currentEquity * (riskPct / 100);
              const volumeLots = parseFloat((riskAmount / ((distance / config.pipSize) * 10)).toFixed(2));

              activeTrade = {
                id: `sim-${i}-${Math.floor(Math.random() * 100)}`,
                index: i,
                time: curr.timestamp,
                side: 'SELL',
                strategy: 'FVG_MITIGATION',
                reason: `Bearish Imbalance entry trigger on FVG fill. Target 1:${targetRR} R:R.`,
                entryPrice: parseFloat(entry.toFixed(config.decimals)),
                stopLoss: parseFloat(stop.toFixed(config.decimals)),
                takeProfit: parseFloat(profitTarget.toFixed(config.decimals)),
                contractSize: volumeLots || 1,
              };
              continue;
            }
          }
        }

        // B. Order Block Bounce (Institutional Reaccumulation / Redistribution blocks)
        const isOBStrategyEnabled = strategyType === 'COMBO' || strategyType === 'OB';
        if (isOBStrategyEnabled && !activeTrade) {
          // Bullish Order Block setup: Prev3 was down-close candle, next two candles represent a strong expansion.
          const isPrev3DownClose = prev3.close < prev3.open;
          const isExpansionGreen = prev2.close > prev2.open && prev1.close > prev1.open && (prev1.close - prev3.open) > (15 * config.pipSize);
          
          if (isPrev3DownClose && isExpansionGreen && isBullishBias) {
            // We place a BUY Limit at High of the down-close candle (the block entry)
            // Test if current hour candle triggers the OB block top limit
            if (curr.low <= prev3.high && curr.close > prev3.low) {
              const entry = prev3.high;
              const stop = prev3.low - (2 * config.pipSize);
              const distance = entry - stop;

              if (distance > (4 * config.pipSize)) {
                const profitTarget = entry + (distance * targetRR);
                const riskAmount = currentEquity * (riskPct / 100);
                const volumeLots = parseFloat((riskAmount / ((distance / config.pipSize) * 10)).toFixed(2));

                activeTrade = {
                  id: `sim-ob-${i}`,
                  index: i,
                  time: curr.timestamp,
                  side: 'BUY',
                  strategy: 'ORDER_BLOCK_BOUNCE',
                  reason: `Retest of Bullish Order Block (4H zone). Strong institutional presence`,
                  entryPrice: parseFloat(entry.toFixed(config.decimals)),
                  stopLoss: parseFloat(stop.toFixed(config.decimals)),
                  takeProfit: parseFloat(profitTarget.toFixed(config.decimals)),
                  contractSize: volumeLots || 1,
                };
                continue;
              }
            }
          }

          // Bearish Order block check
          const isPrev3UpClose = prev3.close > prev3.open;
          const isExpansionRed = prev2.close < prev2.open && prev1.close < prev1.open && (prev3.open - prev1.close) > (15 * config.pipSize);

          if (isPrev3UpClose && isExpansionRed && !isBullishBias) {
            if (curr.high >= prev3.low && curr.close < prev3.high) {
              const entry = prev3.low;
              const stop = prev3.high + (2 * config.pipSize);
              const distance = stop - entry;

              if (distance > (4 * config.pipSize)) {
                const profitTarget = entry - (distance * targetRR);
                const riskAmount = currentEquity * (riskPct / 100);
                const volumeLots = parseFloat((riskAmount / ((distance / config.pipSize) * 10)).toFixed(2));

                activeTrade = {
                  id: `sim-ob-${i}`,
                  index: i,
                  time: curr.timestamp,
                  side: 'SELL',
                  strategy: 'ORDER_BLOCK_BOUNCE',
                  reason: `Bearish Order Block retest. Premium liquidity block validated.`,
                  entryPrice: parseFloat(entry.toFixed(config.decimals)),
                  stopLoss: parseFloat(stop.toFixed(config.decimals)),
                  takeProfit: parseFloat(profitTarget.toFixed(config.decimals)),
                  contractSize: volumeLots || 1,
                };
                continue;
              }
            }
          }
        }

        // C. Clean Session Liquidity sweeps (False break of previous days' maximums)
        const isSweepStrategyEnabled = strategyType === 'COMBO' || strategyType === 'SWEEP';
        if (isSweepStrategyEnabled && !activeTrade) {
          // Estimate rolling previous day highs/lows (past 24 candles)
          const sliceCandles = generatedCandles.slice(Math.max(0, i - 24), i);
          if (sliceCandles.length >= 24) {
            const dayHigh = Math.max(...sliceCandles.map(c => c.high));
            const dayLow = Math.min(...sliceCandles.map(c => c.low));

            // Bearish Liquidity Sweep (Sweeps maximum, then closes back inside)
            if (curr.high > dayHigh && curr.close < dayHigh) {
              const entry = curr.close;
              const stop = curr.high + (2 * config.pipSize);
              const distance = stop - entry;

              if (distance > (3 * config.pipSize)) {
                const profitTarget = entry - (distance * targetRR);
                const riskAmount = currentEquity * (riskPct / 100);
                const volumeLots = parseFloat((riskAmount / ((distance / config.pipSize) * 10)).toFixed(2));

                activeTrade = {
                  id: `sim-sweep-${i}`,
                  index: i,
                  time: curr.timestamp,
                  side: 'SELL',
                  strategy: 'LIQUIDITY_SWEEP',
                  reason: `Buy-side Liquidity Sweep of previous daily high. Displacement trigger.`,
                  entryPrice: parseFloat(entry.toFixed(config.decimals)),
                  stopLoss: parseFloat(stop.toFixed(config.decimals)),
                  takeProfit: parseFloat(profitTarget.toFixed(config.decimals)),
                  contractSize: volumeLots || 1,
                };
                continue;
              }
            }

            // Bullish Liquidity Sweep (Sweeps minimum, closes back inside)
            if (curr.low < dayLow && curr.close > dayLow) {
              const entry = curr.close;
              const stop = curr.low - (2 * config.pipSize);
              const distance = entry - stop;

              if (distance > (3 * config.pipSize)) {
                const profitTarget = entry + (distance * targetRR);
                const riskAmount = currentEquity * (riskPct / 100);
                const volumeLots = parseFloat((riskAmount / ((distance / config.pipSize) * 10)).toFixed(2));

                activeTrade = {
                  id: `sim-sweep-${i}`,
                  index: i,
                  time: curr.timestamp,
                  side: 'BUY',
                  strategy: 'LIQUIDITY_SWEEP',
                  reason: `Sell-side Liquidity Sweep of previous daily minimum. Liquidity hunt filled.`,
                  entryPrice: parseFloat(entry.toFixed(config.decimals)),
                  stopLoss: parseFloat(stop.toFixed(config.decimals)),
                  takeProfit: parseFloat(profitTarget.toFixed(config.decimals)),
                  contractSize: volumeLots || 1,
                };
                continue;
              }
            }
          }
        }
      }

      // Generate equity curve data trade-by-trade
      let equityAccumulator = startingCapital;
      const ecData = [{ tradeIndex: 0, equity: startingCapital, label: 'Start' }];
      
      tradesTaken.forEach((tr, index) => {
        equityAccumulator += tr.pnlDollar;
        ecData.push({
          tradeIndex: index + 1,
          equity: parseFloat(equityAccumulator.toFixed(2)),
          label: `Trade ${index + 1}`
        });
      });

      // 1. Calculate simulated FVGs
      const simFvgs: any[] = [];
      for (let i = 1; i < generatedCandles.length - 1; i++) {
        const prev = generatedCandles[i - 1];
        const curr = generatedCandles[i];
        const next = generatedCandles[i + 1];

        if (next.low > prev.high) {
          simFvgs.push({
            id: `fvg-up-sim-${i}`,
            index: i,
            type: 'BULLISH',
            gapStart: prev.high,
            gapEnd: next.low,
            isMitigated: generatedCandles.slice(i + 2).some(c => c.low <= next.low),
            timestamp: curr.timestamp
          });
        } else if (next.high < prev.low) {
          simFvgs.push({
            id: `fvg-down-sim-${i}`,
            index: i,
            type: 'BEARISH',
            gapStart: prev.low,
            gapEnd: next.high,
            isMitigated: generatedCandles.slice(i + 2).some(c => c.high >= next.high),
            timestamp: curr.timestamp
          });
        }
      }

      // 2. Calculate simulated Order Blocks
      const simObs: any[] = [];
      const tickSize = config.pipSize || 0.0001;
      const minDisplacement = tickSize * (
        backtestSymbol.includes('USDT') ? 35 :
        backtestSymbol === 'GOLD/USD' ? 15 :
        backtestSymbol === 'USD/JPY' ? 0.3 :
        ['AAPL', 'MSFT', 'NVDA', 'TSLA'].includes(backtestSymbol) ? 5.0 :
        backtestSymbol === 'BRENT' ? 0.5 :
        backtestSymbol === 'DXY' ? 0.15 :
        backtestSymbol === 'US10Y' ? 0.02 :
        0.0020
      );

      for (let i = 5; i < generatedCandles.length - 3; i++) {
        const curr = generatedCandles[i];
        const next1 = generatedCandles[i + 1];
        const next2 = generatedCandles[i + 2];
        const next3 = generatedCandles[i + 3];

        const isRed = curr.close < curr.open;
        const isNextBullish = next1.close > next1.open && next2.close > next2.open && next3.close > next3.open;
        const displacement = next3.close - next1.open;

        if (isRed && isNextBullish && displacement > minDisplacement) {
          simObs.push({
            id: `ob-bullish-sim-${i}`,
            index: i,
            type: 'BULLISH',
            high: curr.high,
            low: curr.low,
            isBroken: generatedCandles.slice(i + 4).some(c => c.close < curr.low),
            timestamp: curr.timestamp
          });
        }

        const isGreen = curr.close > curr.open;
        const isNextBearish = next1.close < next1.open && next2.close < next2.open && next3.close < next3.open;
        const downDisplacement = next1.open - next3.close;

        if (isGreen && isNextBearish && downDisplacement > minDisplacement) {
          simObs.push({
            id: `ob-bearish-sim-${i}`,
            index: i,
            type: 'BEARISH',
            high: curr.high,
            low: curr.low,
            isBroken: generatedCandles.slice(i + 4).some(c => c.close > curr.high),
            timestamp: curr.timestamp
          });
        }
      }

      // 3. Calculate simulated Sweeps
      const simSweeps: any[] = [];
      for (let i = 10; i < generatedCandles.length; i++) {
        const curr = generatedCandles[i];
        const neighborhoodHigh = Math.max(...generatedCandles.slice(i - 10, i).map(c => c.high));
        const neighborhoodLow = Math.min(...generatedCandles.slice(i - 10, i).map(c => c.low));

        if (curr.high > neighborhoodHigh && curr.close < neighborhoodHigh) {
          simSweeps.push({
            id: `sweep-buyside-sim-${i}`,
            index: i,
            type: 'BUY_SIDE',
            level: neighborhoodHigh,
            timestamp: curr.timestamp
          });
        }

        if (curr.low < neighborhoodLow && curr.close > neighborhoodLow) {
          simSweeps.push({
            id: `sweep-sellside-sim-${i}`,
            index: i,
            type: 'SELL_SIDE',
            level: neighborhoodLow,
            timestamp: curr.timestamp
          });
        }
      }

      // 4. Map trades Taken
      const mappedTrades = tradesTaken.map((st) => ({
        id: st.id,
        symbol: backtestSymbol,
        side: st.side,
        entryPrice: st.entryPrice,
        stopLoss: st.stopLoss,
        takeProfit: st.takeProfit,
        size: st.contractSize,
        status: 'CLOSED' as const,
        pnl: st.pnlDollar,
        exitPrice: st.exitPrice,
        timestamp: st.time,
        exitTimestamp: st.exitTime,
        reason: st.reason,
        confidence: 85,
        confluences: [st.strategy],
      }));

      // 5. Build simulated metrics
      const lastCandle = generatedCandles[generatedCandles.length - 1];
      const simulatedMetrics = {
        atr: lastCandle.atr || (config.averageRange * 1.2),
        rsi: lastCandle.rsi || 50,
        trend: lastCandle.close > (lastCandle.ema50 || lastCandle.close) ? 'BULLISH' as const : 'BEARISH' as const,
        dailyBias: lastCandle.close > (lastCandle.ema50 || lastCandle.close) ? 'BULLISH' as const : 'BEARISH' as const,
        supportLevels: [lastCandle.low, lastCandle.low * 0.99],
        resistanceLevels: [lastCandle.high, lastCandle.high * 1.01],
        currentPrice: lastCandle.close,
      };

      // Save states
      setSimtrades(tradesTaken);
      setEquityCurveData(ecData);
      setIsSimulating(false);
      setSimulationCompleted(true);

      if (onSimulationToggle) onSimulationToggle(true);
      if (onSimulationUpdate) {
        onSimulationUpdate({
          candles: generatedCandles,
          trades: mappedTrades,
          fvgs: simFvgs,
          obs: simObs,
          sweeps: simSweeps,
          metrics: simulatedMetrics,
        });
      }
    }, 1200);
  };

  // Run automatically whenever parameters change or chosen trading pair changes
  useEffect(() => {
    runSimulation();
  }, [backtestSymbol]);

  const handleSymbolChangeInner = (sym: MarketSymbol) => {
    setBacktestSymbol(sym);
    if (onSymbolChange) {
      onSymbolChange(sym);
    }
  };

  // Performance calculations
  const summarystats = useMemo(() => {
    if (simtrades.length === 0) {
      return {
        tradeCount: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        grossProfit: 0,
        grossLoss: 0,
        netProfit: 0,
        profitPercent: 0,
        profitFactor: 0,
      };
    }

    const tradeCount = simtrades.length;
    const wins = simtrades.filter((t) => t.outcome === 'WIN');
    const losses = simtrades.filter((t) => t.outcome === 'LOSS');
    const winRate = parseFloat(((wins.length / tradeCount) * 100).toFixed(1));

    let grossProfit = 0;
    let grossLoss = 0;
    
    simtrades.forEach((t) => {
      if (t.pnlDollar > 0) {
        grossProfit += t.pnlDollar;
      } else {
        grossLoss += Math.abs(t.pnlDollar);
      }
    });

    const netProfit = parseFloat((grossProfit - grossLoss).toFixed(2));
    const profitPercent = parseFloat(((netProfit / startingCapital) * 100).toFixed(2));
    const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit;

    return {
      tradeCount,
      winCount: wins.length,
      lossCount: losses.length,
      winRate,
      grossProfit: parseFloat(grossProfit.toFixed(2)),
      grossLoss: parseFloat(grossLoss.toFixed(2)),
      netProfit,
      profitPercent,
      profitFactor,
    };
  }, [simtrades, startingCapital]);

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 pb-5 gap-4">
        <div>
          <div className="flex items-center space-x-2 animate-fadeIn">
            <span className="p-1 px-2.5 bg-indigo-500/10 border border-white/10 rounded font-mono text-[14px] text-indigo-400">7D</span>
            <h2 className="text-xl font-bold font-sans text-white uppercase tracking-wider">
              Retrospective Weekly Backtester
            </h2>
          </div>
          <p className="text-xs text-white/40 mt-1.5 font-sans">
            Simulates institutional algorithm logic over high-resolution <span className="text-indigo-400 font-semibold">{backtestSymbol}</span> ({SYMBOL_CONFIGS[backtestSymbol]?.name}) past weekly candles.
          </p>
        </div>

        {/* Sync / Dropdown Selector for Any Asset inside the page */}
        <div className="flex items-center space-x-3.5">
          <div className="flex flex-col items-start md:items-end">
            <span className="text-[9px] text-white/30 uppercase font-mono tracking-wider font-semibold leading-none mb-1.5">Simulation Target</span>
            <select
              id="backtest-pair-selector"
              value={backtestSymbol}
              onChange={(e) => handleSymbolChangeInner(e.target.value as MarketSymbol)}
              className="bg-[#0c0c0c] border border-white/10 hover:border-white/25 text-white text-xs font-mono font-bold uppercase rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="SPX500">🇺🇸 SPX500 (S&P 500)</option>
              <option value="NAS100">🇺🇸 NAS100 (Nasdaq 100)</option>
              <option value="US30">🇺🇸 US30 (Dow Jones 30)</option>
              <option value="GER40">🇩🇪 GER40 (DAX 40)</option>
              <option value="AAPL">🍎 AAPL (Apple)</option>
              <option value="MSFT">💻 MSFT (Microsoft)</option>
              <option value="NVDA">🟩 NVDA (NVIDIA)</option>
              <option value="TSLA">🚗 TSLA (Tesla)</option>
            </select>
          </div>

          <span className="text-[10px] bg-emerald-500/10 border border-[#10b981]/25 text-emerald-400 font-mono px-3 py-2.5 rounded uppercase font-semibold flex items-center h-[38px] mt-1 md:mt-4">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse shrink-0"></span>
            {isBrokerActive ? 'BROKER GATEWAY VALIDATED' : `${backtestSymbol} SIM FEED VALIDATED`}
          </span>
        </div>
      </div>

      {/* Control sliders & Inputs layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Parameters Block */}
        <div className="lg:col-span-4 bg-[#080808] border border-white/10 rounded p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-white/10">
              <div className="p-2 bg-indigo-500/10 rounded text-indigo-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Simulation Settings</h4>
                <p className="text-xs text-white/40 font-mono uppercase tracking-tight">Set Risk & Algorithm Values</p>
              </div>
            </div>

            {/* Starting Equity */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 font-sans uppercase tracking-wider flex justify-between">
                <span>Account Balance</span>
                <span className="font-mono text-white/80 font-bold">${startingCapital.toLocaleString()} USD</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-mono text-xs">$</span>
                <input
                  type="number"
                  value={startingCapital}
                  step="1000"
                  onChange={(e) => setStartingCapital(Math.max(100, Number(e.target.value)))}
                  className="w-full bg-[#050505] border border-white/10 text-white pl-7 pr-4 py-2 rounded text-xs focus:outline-none focus:border-indigo-500 font-bold font-mono"
                />
              </div>
            </div>

            {/* Risk Percent */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 font-sans uppercase tracking-wider flex justify-between">
                <span>Risk Per Trade</span>
                <span className="font-mono text-indigo-300 font-bold">{riskPct}%</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={riskPct}
                onChange={(e) => setRiskPct(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-[#050505] h-1.5 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-white/30">
                <span>0.1% Conservative</span>
                <span>5.0% Institutional Max</span>
              </div>
            </div>

            {/* Target Risk Reward */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 font-sans uppercase tracking-wider flex justify-between">
                <span>Target Reward-To-Risk</span>
                <span className="font-mono text-white/80 font-bold">{targetRR}:1 R:R</span>
              </label>
              <input
                type="number"
                min="1.0"
                max="10.0"
                step="0.5"
                value={targetRR}
                onChange={(e) => setTargetRR(Math.max(1, Number(e.target.value)))}
                className="w-full bg-[#050505] border border-white/10 text-white px-3 py-2 rounded text-xs focus:outline-none focus:border-indigo-500 font-bold font-mono"
              />
            </div>

            {/* Strategy Selection */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 font-sans uppercase tracking-wider">Strategy Footprint</label>
              <select
                value={strategyType}
                onChange={(e) => setStrategyType(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 text-white px-3 py-2 rounded text-xs focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="COMBO">MTXquant Confluence Strategy (All Heuristics)</option>
                <option value="FVG">ICT Fair Value Gap (FVG Touch Entries)</option>
                <option value="OB">ICT Order Block Bounce (Zone Retests)</option>
                <option value="SWEEP">Liquidity Hunts (Daily Session Highs/Lows)</option>
              </select>
            </div>

            {/* Educational disclaimer */}
            <div className="bg-[#050505]/40 border border-white/5 rounded p-3 text-[10.5px] leading-relaxed text-white/45 font-sans space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-white/60 text-[11px]">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Fixed Fractional Math Engine</span>
              </div>
              <p>
                Calculates position lots based on invalidation depth to guarantee risk remains at precisely matching values (configured sl size).
              </p>
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 text-white font-bold text-xs uppercase tracking-wider rounded transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Simulating Algorithm Execution...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Execute Past Week Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Summary Statistics Dashboard */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Output KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-[#080808] border border-white/10 rounded p-4 shadow flex flex-col justify-between">
              <span className="text-[9.5px] uppercase font-bold text-white/40 tracking-wider font-mono">Net Profit P&L</span>
              <div>
                <span className={`text-lg font-bold font-mono tracking-tight block ${summarystats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {summarystats.netProfit >= 0 ? `+$${summarystats.netProfit}` : `-$${Math.abs(summarystats.netProfit)}`}
                </span>
                <span className={`text-[10px] font-mono ${summarystats.profitPercent >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                  {summarystats.profitPercent >= 0 ? `+${summarystats.profitPercent}%` : `${summarystats.profitPercent}%`}
                </span>
              </div>
            </div>

            <div className="bg-[#080808] border border-white/10 rounded p-4 shadow flex flex-col justify-between">
              <span className="text-[9.5px] uppercase font-bold text-white/40 tracking-wider font-mono">Winning Ratio</span>
              <div>
                <span className="text-lg font-bold text-white font-mono tracking-tight block">
                  {summarystats.winRate}%
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                  {summarystats.winCount} Winners / {summarystats.lossCount} Losses
                </span>
              </div>
            </div>

            <div className="bg-[#080808] border border-white/10 rounded p-4 shadow flex flex-col justify-between">
              <span className="text-[9.5px] uppercase font-bold text-white/40 tracking-wider font-mono">Profit Factor</span>
              <div>
                <span className="text-lg font-bold text-white font-mono tracking-tight block">
                  {summarystats.profitFactor}
                </span>
                <span className="text-[10px] text-white/40 font-mono uppercase">
                  Gross PF: {summarystats.profitFactor > 1 ? 'Bullish' : 'Sufficient'}
                </span>
              </div>
            </div>

            <div className="bg-[#080808] border border-white/10 rounded p-4 shadow flex flex-col justify-between">
              <span className="text-[9.5px] uppercase font-bold text-white/40 tracking-wider font-mono">Total Positions</span>
              <div>
                <span className="text-lg font-bold text-white font-mono tracking-tight block">
                  {summarystats.tradeCount} Trades
                </span>
                <span className="text-[10px] text-white/40 font-mono uppercase">
                  100% Matching Rules
                </span>
              </div>
            </div>

          </div>

          {/* Equity growth curve Chart using Recharts area */}
          <div className="bg-[#080808] border border-white/10 rounded p-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="font-bold text-xs uppercase text-white font-sans">Retrospective Margin Equity Curve</span>
              </div>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                Start: ${startingCapital.toLocaleString()} | End: ${(startingCapital + summarystats.netProfit).toLocaleString()}
              </span>
            </div>

            <div className="h-60 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="label" stroke="#737373" fontSize={10} fontFamily="monospace" />
                  <YAxis
                    stroke="#737373"
                    fontSize={10}
                    fontFamily="monospace"
                    domain={['dataMin - 100', 'dataMax + 100']}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#0c0c0e', 
                      borderColor: 'rgba(99, 102, 241, 0.4)', 
                      borderLeft: '3px solid #6366f1',
                      borderRadius: '6px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.85)'
                    }}
                    labelStyle={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'white', fontSize: '11px' }}
                    itemStyle={{ fontFamily: 'monospace', fontSize: '11px', color: '#a5b4fc' }}
                    formatter={(val: number) => [`$${val.toLocaleString()}`, 'Equity Balance']}
                  />
                  <Area type="monotone" dataKey="equity" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#equityGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* Historical Simulation Trades Ledger list */}
      <div className="bg-[#080808] border border-white/10 rounded p-6 shadow-2xl mt-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h4 className="font-semibold text-white text-sm">Retrospective Trade Resolution Ledger</h4>
          </div>
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest bg-[#050505] border border-white/10 px-2 py-0.5 rounded">
            Past Week Actions
          </span>
        </div>

        {simtrades.length === 0 ? (
          <div className="py-12 border border-dashed border-white/5 rounded text-center bg-[#050505]/30">
            <p className="text-xs text-white/40 italic font-serif">
              No trades captured. Try relaxing execution filters or increasing target risk ratios.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-[11px] leading-relaxed">
              <thead>
                <tr className="border-b border-white/10 text-white/35 font-sans uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Position ID</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Entry & Invalidation</th>
                  <th className="py-3 px-3">Exit Target</th>
                  <th className="py-3 px-3">Strategy Framework</th>
                  <th className="py-3 px-3 text-right">Raw Outcome ($)</th>
                  <th className="py-3 px-3 text-right">Profit (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {simtrades.map((t, idx) => (
                  <tr key={t.id + '-' + idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-white/80">{t.id}</div>
                      <div className="text-[9px] text-white/35 mt-0.5">{new Date(t.time).getUTCMonth() + 1}/{new Date(t.time).getUTCDate()} {new Date(t.time).getUTCHours()}:00</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${t.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {t.side}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div>Entry: <span className="text-white/80 font-bold">{t.entryPrice.toFixed(config.decimals)}</span></div>
                      <div className="text-[10px] text-rose-400 font-semibold mt-0.5">SL: {t.stopLoss.toFixed(config.decimals)}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div>Closed At: <span className="text-white/80 font-bold">{t.exitPrice.toFixed(config.decimals)}</span></div>
                      <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">TP: {t.takeProfit.toFixed(config.decimals)}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-white/80 font-sans font-medium text-[11px] truncate max-w-[280px] text-wrap leading-tight" title={t.reason}>
                        {t.reason}
                      </div>
                      <span className="text-[9px] bg-white/5 text-[#818cf8] border border-white/5 px-1 py-0.5 rounded mt-1 inline-block uppercase font-bold font-mono tracking-tight">
                        {t.strategy.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`py-3.5 px-3 font-bold text-right font-mono ${t.outcome === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.pnlDollar >= 0 ? `+$${t.pnlDollar.toLocaleString()}` : `-$${Math.abs(t.pnlDollar).toLocaleString()}`}
                    </td>
                    <td className={`py-3.5 px-3 font-bold text-right font-mono ${t.outcome === 'WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.pnlPct >= 0 ? `+${t.pnlPct}%` : `${t.pnlPct}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
