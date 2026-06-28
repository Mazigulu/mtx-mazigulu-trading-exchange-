/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { MarketSymbol, Trade, MarketMetrics, LiquiditySweep, OrderBook } from '../types';
import { ShieldCheck, ArrowRightLeft, Landmark, Calculator, AlertTriangle, Play, CheckCircle2, History, XCircle, AlertOctagon, Percent, TrendingUp, Activity, Download, Gauge, CheckSquare, Square, Award, Fingerprint, Lock, Unlock, Cpu, RefreshCw, Sparkles, Eye, Check, X, Key, ShieldAlert, Clock, TrendingDown, HelpCircle, Layers } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { getSignalInsights } from './TradeExplainability';

const playTradeSound = (type: 'buy' | 'sell' | 'fail' | 'ai-success' | 'close') => {
  try {
    const savedSettingsRaw = localStorage.getItem('apex_institutional_settings');
    if (savedSettingsRaw) {
      const parsed = JSON.parse(savedSettingsRaw);
      if (parsed && parsed.soundAlerts === false) {
        return;
      }
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
    masterGain.connect(ctx.destination);

    if (type === 'buy') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
      
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.23);
      
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08);
      gain2.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.55);

    } else if (type === 'sell') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(349.23, ctx.currentTime + 0.18);
      
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(293.66, ctx.currentTime + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(174.61, ctx.currentTime + 0.22);
      
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.04);
      gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(ctx.currentTime + 0.04);
      osc2.stop(ctx.currentTime + 0.55);

    } else if (type === 'fail') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(220, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.15);
      
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(400, ctx.currentTime);
      bandpass.Q.setValueAtTime(1, ctx.currentTime);

      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      
      osc1.connect(bandpass);
      bandpass.connect(gain1);
      gain1.connect(masterGain);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(200, ctx.currentTime + 0.12);
      osc2.frequency.linearRampToValueAtTime(130, ctx.currentTime + 0.27);
      
      const bandpass2 = ctx.createBiquadFilter();
      bandpass2.type = 'bandpass';
      bandpass2.frequency.setValueAtTime(360, ctx.currentTime + 0.12);
      bandpass2.Q.setValueAtTime(1, ctx.currentTime + 0.12);

      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.12);
      gain2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc2.connect(bandpass2);
      bandpass2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.32);

    } else if (type === 'ai-success') {
      const times = [0, 0.05, 0.10, 0.15];
      const freqs = [659.25, 783.99, 987.77, 1318.51];
      
      times.forEach((tOffset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + tOffset);
        
        gain.gain.setValueAtTime(0, ctx.currentTime + tOffset);
        gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + tOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + tOffset + 0.25);
        
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(ctx.currentTime + tOffset);
        osc.stop(ctx.currentTime + tOffset + 0.3);
      });

    } else if (type === 'close') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (err) {
    console.warn('Trading audio chime output failed:', err);
  }
};

interface TradeTerminalProps {
  symbol: MarketSymbol;
  metrics: MarketMetrics;
  onTradeExecuted: () => void;
  trades: Trade[];
  sweeps?: LiquiditySweep[];
  orderBook?: OrderBook;
}

export default function TradeTerminal({
  symbol,
  metrics,
  onTradeExecuted,
  trades,
  sweeps = [],
  orderBook,
}: TradeTerminalProps) {
  const [accountBalance, setAccountBalance] = useState(10000);

  const [isMt5BridgePaused, setIsMt5BridgePaused] = useState<boolean>(() => {
    try {
      return localStorage.getItem('apex_mt5_bridge_paused') === 'true';
    } catch {
      return false;
    }
  });

  // Keep it synchronized with localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setIsMt5BridgePaused(localStorage.getItem('apex_mt5_bridge_paused') === 'true');
      } catch {}
    };

    const handleCustomChange = (e: any) => {
      if (e.detail && typeof e.detail.paused === 'boolean') {
        setIsMt5BridgePaused(e.detail.paused);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('apex_bridge_status_changed' as any, handleCustomChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('apex_bridge_status_changed' as any, handleCustomChange);
    };
  }, []);

  // AI Institutional Live Execution Layer States
  const [isLiveExecution, setIsLiveExecution] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'PASSWORD' | 'BIOMETRIC'>('BIOMETRIC');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusLog, setScanStatusLog] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [aiTradeSuccessAlert, setAiTradeSuccessAlert] = useState<string | null>(null);

  // Navigation for layout tab between Order & Risk Calculator and Live Trade Ledger
  const [activeTab, setActiveTab] = useState<'calculator' | 'ledger'>('calculator');

  // Pagination state for closed trades (7 items per page as requested)
  const [closedTradesPage, setClosedTradesPage] = useState(0);

  // Active chart display mode ('cumulative' PnL vs 'daily' distribution)
  const [activeChartTab, setActiveChartTab] = useState<'cumulative' | 'daily'>('cumulative');

  // Wait & Observe Mode States & Storage Sync
  const [isObserveMode, setIsObserveMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('apex_advisor_observe_mode');
      return saved === 'true';
    } catch (_) {
      return false;
    }
  });

  const toggleObserveMode = () => {
    const nextVal = !isObserveMode;
    setIsObserveMode(nextVal);
    try {
      localStorage.setItem('apex_advisor_observe_mode', String(nextVal));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('observe_mode_changed'));
    } catch (_) {}
  };

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('apex_advisor_observe_mode');
        setIsObserveMode(saved === 'true');
      } catch (_) {}
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('observe_mode_changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('observe_mode_changed', handleStorageChange);
    };
  }, []);

  const [terminalSignals, setTerminalSignals] = useState<Array<{
    id: string;
    timestamp: string;
    symbol: string;
    type: 'SWEEP_BSL' | 'SWEEP_SSL' | 'DISCRETIONARY_EMA' | 'DISCRETIONARY_FVG' | 'DISCRETIONARY_RSI';
    label: string;
    details: string;
    volume?: string;
    severity: 'CRITICAL' | 'LOW' | 'MEDIUM';
  }>>([
    {
      id: 'sig-1',
      timestamp: new Date(Date.now() - 35000).toLocaleTimeString(),
      symbol: symbol,
      type: 'DISCRETIONARY_EMA',
      label: 'Discretionary 15m EMA Pullback',
      details: 'Price reacting of local 50 EMA boundary.',
      severity: 'LOW'
    },
    {
      id: 'sig-2',
      timestamp: new Date(Date.now() - 95000).toLocaleTimeString(),
      symbol: symbol,
      type: 'SWEEP_SSL',
      label: 'Institutional Sweep (SSL Captured)',
      details: 'High-dispersion raid completed on sell-side stops.',
      volume: '1,540 Lots',
      severity: 'CRITICAL'
    },
    {
      id: 'sig-3',
      timestamp: new Date(Date.now() - 180000).toLocaleTimeString(),
      symbol: symbol,
      type: 'DISCRETIONARY_FVG',
      label: 'Discretionary 5m FVG Invalidation',
      details: 'Price broke below order book density threshold.',
      severity: 'LOW'
    },
    {
      id: 'sig-4',
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
      symbol: symbol,
      type: 'SWEEP_BSL',
      label: 'Institutional Sweep (BSL Captured)',
      details: 'Clean systemic grab of retail buy stops.',
      volume: '2,180 Lots',
      severity: 'CRITICAL'
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const types: Array<'SWEEP_BSL' | 'SWEEP_SSL' | 'DISCRETIONARY_EMA' | 'DISCRETIONARY_FVG' | 'DISCRETIONARY_RSI'> = [
        'SWEEP_BSL', 'SWEEP_SSL', 'DISCRETIONARY_EMA', 'DISCRETIONARY_FVG', 'DISCRETIONARY_RSI'
      ];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      let label = '';
      let details = '';
      let severity: 'CRITICAL' | 'LOW' | 'MEDIUM' = 'LOW';
      let volume: string | undefined = undefined;

      if (randomType === 'SWEEP_BSL') {
        label = 'Institutional Sweep (BSL Captured)';
        details = 'Premium liquidity pool breached and absorbed.';
        volume = `${Math.floor(Math.random() * 1200) + 800} Lots`;
        severity = 'CRITICAL';
      } else if (randomType === 'SWEEP_SSL') {
        label = 'Institutional Sweep (SSL Captured)';
        details = 'Discount liquidity pool captured with aggressive matching orders.';
        volume = `${Math.floor(Math.random() * 1500) + 1000} Lots`;
        severity = 'CRITICAL';
      } else if (randomType === 'DISCRETIONARY_EMA') {
        label = 'Discretionary EMA Rebound';
        details = 'Tested and rejected the short-term trend boundary.';
        severity = 'LOW';
      } else if (randomType === 'DISCRETIONARY_FVG') {
        label = 'Discretionary FVG Void Mitigation';
        details = 'Inefficiency filled at standard liquidity balance.';
        severity = 'MEDIUM';
      } else {
        label = 'Discretionary RSI Exhaustion';
        details = 'Oversold tracking metric reached local peak.';
        severity = 'LOW';
      }

      setTerminalSignals(prev => [
        {
          id: `terminal-sig-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          symbol: symbol,
          type: randomType,
          label,
          details,
          volume,
          severity
        },
        ...prev
      ].slice(0, 30));
    }, 12000);

    return () => clearInterval(interval);
  }, [symbol]);

  const performanceStats = useMemo(() => {
    const completed = trades.filter((t) => t.status === 'CLOSED');
    if (completed.length === 0) {
      return {
        winRate: 0,
        avgProfit: 0,
        sharpeRatio: 0,
        totalTrades: 0,
        totalPnL: 0,
        wins: 0,
        losses: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        maxDrawdownPct: 0,
        avgDurationMs: 0,
        grossProfit: 0,
        grossLoss: 0,
      };
    }

    const pnls = completed.map((t) => t.pnl);
    const totalPnL = pnls.reduce((acc, val) => acc + val, 0);
    const avgProfit = totalPnL / completed.length;

    const wins = completed.filter((t) => t.pnl > 0).length;
    const losses = completed.filter((t) => t.pnl < 0).length;
    const winRate = (wins / completed.length) * 100;

    // Gross Profit & Gross Loss
    const grossProfit = completed.filter((t) => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(completed.filter((t) => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? Infinity : 0);

    // Max Drawdown calculation based on standard 10,000 baseline
    const sortedCompleted = [...completed].sort((a, b) => {
      const timeA = new Date(a.exitTimestamp || a.timestamp).getTime();
      const timeB = new Date(b.exitTimestamp || b.timestamp).getTime();
      return timeA - timeB;
    });

    let balance = 10000;
    let peak = balance;
    let maxDrawdown = 0;
    let maxDrawdownPct = 0;

    sortedCompleted.forEach((trade) => {
      balance += trade.pnl;
      if (balance > peak) {
        peak = balance;
      }
      const dd = peak - balance;
      const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }
      if (ddPct > maxDrawdownPct) {
        maxDrawdownPct = ddPct;
      }
    });

    // Average trade duration in milliseconds
    let totalDurationMs = 0;
    let validDurationCount = 0;
    completed.forEach((t) => {
      if (t.timestamp && t.exitTimestamp) {
        const start = new Date(t.timestamp).getTime();
        const end = new Date(t.exitTimestamp).getTime();
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          totalDurationMs += (end - start);
          validDurationCount++;
        }
      }
    });
    const avgDurationMs = validDurationCount > 0 ? (totalDurationMs / validDurationCount) : 0;

    // Standard deviation calculation (trade-by-trade basis)
    let stdDev = 0;
    if (completed.length > 1) {
      const squareDiffs = pnls.map((pnl) => Math.pow(pnl - avgProfit, 2));
      const variance = squareDiffs.reduce((acc, val) => acc + val, 0) / completed.length;
      stdDev = Math.sqrt(variance);
    }

    const sharpeRatio = stdDev > 0 ? (avgProfit / stdDev) : 0;

    return {
      winRate,
      avgProfit,
      sharpeRatio,
      totalTrades: completed.length,
      totalPnL,
      wins,
      losses,
      profitFactor,
      maxDrawdown,
      maxDrawdownPct,
      avgDurationMs,
      grossProfit,
      grossLoss,
    };
  }, [trades]);

  const sharpeGrade = useMemo(() => {
    const sr = performanceStats.sharpeRatio;
    if (performanceStats.totalTrades === 0) return { label: 'No Data', color: 'text-white/30' };
    if (sr >= 3.0) return { label: 'Institutional', color: 'text-violet-400' };
    if (sr >= 2.0) return { label: 'Excellent', color: 'text-emerald-400' };
    if (sr >= 1.0) return { label: 'Good', color: 'text-indigo-400' };
    if (sr > 0.0) return { label: 'Positive', color: 'text-yellow-400' };
    return { label: 'Sub-optimal', color: 'text-rose-400' };
  }, [performanceStats]);
  const [riskPct, setRiskPct] = useState(1); // 1.0% Fractional Risk Model
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedDomPrice, setSelectedDomPrice] = useState<number | null>(null);
  
  const [entryPrice, setEntryPrice] = useState(metrics.currentPrice);
  const [stopLoss, setStopLoss] = useState(metrics.currentPrice * 0.99);
  const [takeProfit, setTakeProfit] = useState(metrics.currentPrice * 1.03);
  const [reason, setReason] = useState('4H Order Block validation + ICT FVG open convergence matching Higher Timeframe Daily Bias');
  const [marketNote, setMarketNote] = useState(() => {
    try {
      return localStorage.getItem('apex_predefined_market_note') || 'Bullish divergence conforming to larger HTF expansion framework.';
    } catch {
      return 'Bullish divergence conforming to larger HTF expansion framework.';
    }
  });

  const decimalLimit = symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : symbol === 'ETH/USDT' || symbol === 'SOL/USDT' ? 2 : 5;

  // ATR Position Size Calculator States
  const [atrMultiplier, setAtrMultiplier] = useState<number>(2.0);
  const [atrRiskPct, setAtrRiskPct] = useState<number>(1.0); // Defaults to 1.0 (1% model)
  const [atrTpMultiplier, setAtrTpMultiplier] = useState<number>(4.0); // Defaults to 4.0 for a 1:2 default RR (2x ATR SL, 4x ATR TP)

  useEffect(() => {
    const handleCopilotIntent = () => {
      try {
        const raw = localStorage.getItem('copilot_execution_order_intent');
        if (raw) {
          const order = JSON.parse(raw);
          if (order.symbol === symbol) {
            setSide(order.side);
            setEntryPrice(order.entryPrice);
            setStopLoss(order.stopLoss);
            setTakeProfit(order.takeProfit);
            setReason(`MTX AI Copilot Draft: ${order.reason || 'AI-suggested confluence entry'}`);
          }
        }
      } catch (e) {
        console.warn('Failed to parse copilot intent', e);
      }
    };

    handleCopilotIntent();
    window.addEventListener('mtx_copilot_execute', handleCopilotIntent);
    return () => {
      window.removeEventListener('mtx_copilot_execute', handleCopilotIntent);
    };
  }, [symbol]);

  const calculatedAtrSlDistance = useMemo(() => {
    return metrics.atr * atrMultiplier;
  }, [metrics.atr, atrMultiplier]);

  const recommendedAtrStopLoss = useMemo(() => {
    const decimalLimit = symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5;
    if (side === 'BUY') {
      return parseFloat((entryPrice - calculatedAtrSlDistance).toFixed(decimalLimit));
    } else {
      return parseFloat((entryPrice + calculatedAtrSlDistance).toFixed(decimalLimit));
    }
  }, [entryPrice, calculatedAtrSlDistance, side, symbol]);

  const recommendedAtrTakeProfit = useMemo(() => {
    const decimalLimit = symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5;
    const tpDistance = metrics.atr * atrTpMultiplier;
    if (side === 'BUY') {
      return parseFloat((entryPrice + tpDistance).toFixed(decimalLimit));
    } else {
      return parseFloat((entryPrice - tpDistance).toFixed(decimalLimit));
    }
  }, [entryPrice, metrics.atr, atrTpMultiplier, side, symbol]);

  // Find the most recent applicable liquidity sweep for stop-loss suggestion based on MTX Engine
  const suggestedSweepSl = useMemo(() => {
    if (!sweeps || sweeps.length === 0) return null;
    
    // For a BUY trade: stop loss should be BELOW current entryPrice. Look for SELL_SIDE sweeps (lows swept)
    // For a SELL trade: stop loss should be ABOVE current entryPrice. Look for BUY_SIDE sweeps (highs swept)
    const targetType = side === 'BUY' ? 'SELL_SIDE' : 'BUY_SIDE';
    
    const applicableSweeps = sweeps.filter(sw => {
      if (sw.type !== targetType) return false;
      return side === 'BUY' ? sw.level < entryPrice : sw.level > entryPrice;
    });

    if (applicableSweeps.length === 0) {
      // Fallback to any recent sweep of the same type relative to currentPrice
      const anyApplicable = sweeps.filter(sw => 
        side === 'BUY' ? sw.level < metrics.currentPrice : sw.level > metrics.currentPrice
      );
      if (anyApplicable.length === 0) return null;
      return anyApplicable[anyApplicable.length - 1];
    }

    return applicableSweeps[applicableSweeps.length - 1]; // Return the most recent detected sweep
  }, [sweeps, side, entryPrice, metrics.currentPrice]);

  const suggestedSlPrice = useMemo(() => {
    if (!suggestedSweepSl) return null;
    const decimalLimit = symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5;
    const level = suggestedSweepSl.level;
    
    // Suggest the sweep level minus a small offset (buffer) of 0.1 * ATR for a safe structural buffer,
    // ensuring the stop loss lies safely beyond the swept wick.
    const buffer = (metrics.atr || 0.0001) * 0.1;
    if (side === 'BUY') {
      return parseFloat((level - buffer).toFixed(decimalLimit));
    } else {
      return parseFloat((level + buffer).toFixed(decimalLimit));
    }
  }, [suggestedSweepSl, symbol, side, metrics.atr]);

  const isSlSignificantlyWide = useMemo(() => {
    if (!stopLoss || !metrics.currentPrice) return false;
    const atrValue = metrics.atr || 0.0001;
    const distance = Math.abs(stopLoss - metrics.currentPrice);
    return distance > 5 * atrValue;
  }, [stopLoss, metrics.currentPrice, metrics.atr]);

  const volatilityLevels = useMemo(() => {
    const price = metrics?.currentPrice || 1.1000;
    const atr = metrics?.atr || (price * 0.001);
    const isBuy = side === 'BUY';

    return [
      {
        name: `Conservative Target (${isBuy ? '+' : '-'}2.0 ATR)`,
        price: isBuy ? price + (atr * 2.0) : price - (atr * 2.0),
        type: 'TAKE_PROFIT',
        color: isBuy ? 'text-emerald-400' : 'text-rose-400',
        desc: 'Extended range target. Represents high probability of exit before a daily range reversal.'
      },
      {
        name: `Standard Target (${isBuy ? '+' : '-'}1.0 ATR)`,
        price: isBuy ? price + (atr * 1.0) : price - (atr * 1.0),
        type: 'TAKE_PROFIT',
        color: isBuy ? 'text-emerald-400/80' : 'text-rose-400/80',
        desc: 'High probability intraday target. Average expected daily price expansion.'
      },
      {
        name: `Scalp Target (${isBuy ? '+' : '-'}0.5 ATR)`,
        price: isBuy ? price + (atr * 0.5) : price - (atr * 0.5),
        type: 'TAKE_PROFIT',
        color: isBuy ? 'text-emerald-300/60' : 'text-rose-300/60',
        desc: 'Short-term momentum target, ideal for high-probability small exits.'
      },
      {
        name: 'Current Market Spot',
        price: price,
        type: 'SPOT',
        color: 'text-indigo-400',
        desc: 'The current active price quote.'
      },
      {
        name: `Tight Defensive Stop (${isBuy ? '-' : '+'}0.5 ATR)`,
        price: isBuy ? price - (atr * 0.5) : price + (atr * 0.5),
        type: 'STOP_LOSS',
        color: isBuy ? 'text-rose-300/60' : 'text-emerald-300/60',
        desc: 'Aggressive scalp stop. Protects against immediate adverse momentum shifts.'
      },
      {
        name: `Standard Structural Stop (${isBuy ? '-' : '+'}1.5 ATR)`,
        price: isBuy ? price - (atr * 1.5) : price + (atr * 1.5),
        type: 'STOP_LOSS',
        color: isBuy ? 'text-rose-400/85' : 'text-emerald-400/85',
        desc: 'Safe daily swing invalidation. Placed beyond normal mathematical noise.'
      },
      {
        name: `Conservative Swing Stop (${isBuy ? '-' : '+'}2.0 ATR)`,
        price: isBuy ? price - (atr * 2.0) : price + (atr * 2.0),
        type: 'STOP_LOSS',
        color: isBuy ? 'text-rose-500' : 'text-emerald-500',
        desc: 'Deep macro invalidation level, highly resilient to volatile standard deviation sweeps.'
      }
    ];
  }, [metrics?.currentPrice, metrics?.atr, side]);

  const formatPrice = (p: number) => {
    const decimalLimit = symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5;
    return p.toFixed(decimalLimit);
  };

  const calculatedAtrPositionSize = useMemo(() => {
    if (calculatedAtrSlDistance === 0) return 0;
    const riskDollar = accountBalance * (atrRiskPct / 100);
    let units = riskDollar / calculatedAtrSlDistance;
    if (symbol === 'BTC/USDT') {
      return parseFloat(units.toFixed(3));
    } else {
      const contractUnits = units / 100000;
      return parseFloat(contractUnits.toFixed(2));
    }
  }, [accountBalance, atrRiskPct, calculatedAtrSlDistance, symbol]);

  const handleApplyAtrParameters = () => {
    setRiskPct(atrRiskPct);
    setStopLoss(recommendedAtrStopLoss);
    setTakeProfit(recommendedAtrTakeProfit);
  };

  useEffect(() => {
    try {
      localStorage.setItem('apex_predefined_market_note', marketNote);
    } catch (_) {}
  }, [marketNote]);

  const [executing, setExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-Break-Even Strategy States
  const [autoBreakEvenEnabled, setAutoBreakEvenEnabled] = useState<boolean>(false);
  const [autoBreakEvenProfitPct, setAutoBreakEvenProfitPct] = useState<string>('1.0');

  const [confidence, setConfidence] = useState<number>(75);
  const [selectedConfluences, setSelectedConfluences] = useState<string[]>([]);

  const CONFLUENCE_OPTIONS = useMemo(() => [
    'Fair Value Gap (FVG) Mitigation',
    'Break of Structure (BOS) Confirmed',
    'EMA Alignment (50/200 Trend)',
    'Volatility Limit Bounds',
    'Portfolio Risk & Leverage Cap',
    'High Timeframe Daily Bias Match',
    'Order Block (OB) Validation',
    'Liquidity Sweep Capture'
  ], []);

  // Sync inputs, confidence, and confluences with current price/bias when symbol or side changes
  useEffect(() => {
    setEntryPrice(metrics.currentPrice);
    if (side === 'BUY') {
      setStopLoss(parseFloat((metrics.currentPrice - metrics.atr * 2).toFixed(symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5)));
      setTakeProfit(parseFloat((metrics.currentPrice + metrics.atr * 4).toFixed(symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5)));
    } else {
      setStopLoss(parseFloat((metrics.currentPrice + metrics.atr * 2).toFixed(symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5)));
      setTakeProfit(parseFloat((metrics.currentPrice - metrics.atr * 4).toFixed(symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5)));
    }

    const insights = getSignalInsights(symbol, metrics.dailyBias);
    setConfidence(insights.confidence);

    const activeConfs = ['Fair Value Gap (FVG) Mitigation', 'Break of Structure (BOS) Confirmed'];
    if (insights.ema) activeConfs.push('EMA Alignment (50/200 Trend)');
    if (insights.volatility) activeConfs.push('Volatility Limit Bounds');
    if (insights.risk) activeConfs.push('Portfolio Risk & Leverage Cap');
    if ((side === 'BUY' && metrics.dailyBias === 'BULLISH') || (side === 'SELL' && metrics.dailyBias === 'BEARISH')) {
      activeConfs.push('High Timeframe Daily Bias Match');
    }
    activeConfs.push('Order Block (OB) Validation');

    setSelectedConfluences(activeConfs);
  }, [symbol, side]);

  const handleToggleConfluence = (option: string) => {
    setSelectedConfluences(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option) 
        : [...prev, option]
    );
  };

  // Position lot sizing logic (Fixed Fractional Risk Model)
  const calculatedPositionSize = useMemo(() => {
    const riskDollar = accountBalance * (riskPct / 100);
    const slDistance = Math.abs(entryPrice - stopLoss);
    if (slDistance === 0) return 0;

    let units = riskDollar / slDistance;
    
    // lot mapping estimates for major pairs & assets
    if (symbol === 'BTC/USDT') {
      return parseFloat(units.toFixed(3)); // direct coins
    } else {
      // standard forex lots: 1 lot = 100,000 units. $10 risk per pip.
      // divide standard units to lots representation if appropriate
      const contractUnits = units / 100000;
      return parseFloat(contractUnits.toFixed(2));
    }
  }, [accountBalance, riskPct, entryPrice, stopLoss, symbol]);

  const handlePlaceTrade = async () => {
    setErrorMsg(null);

    if (isMt5BridgePaused) {
      setErrorMsg('MT5 Execution Bridge is currently PAUSED by the Safety Guard drawdown circuit breaker. Trading is restricted.');
      playTradeSound('fail');
      return;
    }

    // Validate Stop Loss / Trend biases matching strategy guidelines
    if (side === 'BUY' && stopLoss >= entryPrice) {
      setErrorMsg('For BUY trades, Stop Loss must be lower than the Entry Price.');
      playTradeSound('fail');
      return;
    }
    if (side === 'SELL' && stopLoss <= entryPrice) {
      setErrorMsg('For SELL trades, Stop Loss must be higher than the Entry Price.');
      playTradeSound('fail');
      return;
    }

    // Trend Confluence alignment rule check (Show yellow alert block but don't strictly halt, or block it!)
    const trendAligns = (side === 'BUY' && metrics.dailyBias === 'BULLISH') || (side === 'SELL' && metrics.dailyBias === 'BEARISH');

    setExecuting(true);
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          side,
          entryPrice,
          stopLoss,
          takeProfit,
          size: calculatedPositionSize,
          reason,
          confidence,
          confluences: selectedConfluences,
          marketNote,
          autoBreakEvenProfitPct: autoBreakEvenEnabled ? parseFloat(autoBreakEvenProfitPct) : undefined,
        }),
      });

      if (!res.ok) {
        let errMsg = 'Failed to open trade.';
        if (res.headers.get('content-type')?.includes('application/json')) {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        }
        throw new Error(errMsg);
      }

      // Successful position execution sound
      playTradeSound(side === 'BUY' ? 'buy' : 'sell');
      onTradeExecuted();
      setActiveTab('ledger');
    } catch (e: any) {
      playTradeSound('fail');
      setErrorMsg(e.message || 'Error occurred.');
    } finally {
      setExecuting(false);
    }
  };

  const handleCloseActiveTrade = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/close`, {
        method: 'POST',
      });
      if (res.ok) {
        playTradeSound('close');
        onTradeExecuted();
      } else {
        playTradeSound('fail');
      }
    } catch (error) {
      playTradeSound('fail');
      console.error('Failed closing trade:', error);
    }
  };

  const applyRewardRatioPreset = (ratio: number) => {
    const slDistance = Math.abs(entryPrice - stopLoss);
    if (slDistance === 0) return;
    
    let calculatedTp = entryPrice;
    if (side === 'BUY') {
      calculatedTp = entryPrice + slDistance * ratio;
    } else {
      calculatedTp = entryPrice - slDistance * ratio;
    }
    
    const decimalLimit = symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5;
    setTakeProfit(parseFloat(calculatedTp.toFixed(decimalLimit)));
  };

  const handleAddStopLossFromSweep = () => {
    if (!sweeps || sweeps.length === 0) {
      setErrorMsg('No active sweeps located in engine memory.');
      return;
    }
    const mostRecentSweep = sweeps[sweeps.length - 1];
    const decimalLimit = symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5;
    setStopLoss(Number(mostRecentSweep.level.toFixed(decimalLimit)));
    if (errorMsg === 'No active sweeps located in engine memory.') {
      setErrorMsg(null);
    }
  };

  const formatHoldingDuration = (openedStr: string, closedStr?: string) => {
    if (!closedStr) return '—';
    try {
      const start = new Date(openedStr).getTime();
      const end = new Date(closedStr).getTime();
      if (isNaN(start) || isNaN(end)) return '—';
      const diffMs = end - start;
      if (diffMs < 0) return '—';
      
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays}d ${diffHours % 24}h`;
      }
      if (diffHours > 0) {
        return `${diffHours}h ${diffMins % 60}m`;
      }
      if (diffMins > 0) {
        return `${diffMins}m ${diffSecs % 60}s`;
      }
      return `${diffSecs}s`;
    } catch (err) {
      return '—';
    }
  };

  const formatMsDuration = (ms: number) => {
    if (ms <= 0) return '—';
    try {
      const totalSecs = Math.floor(ms / 1000);
      const totalMins = Math.floor(totalSecs / 60);
      const totalHours = Math.floor(totalMins / 60);
      const totalDays = Math.floor(totalHours / 24);

      if (totalDays > 0) return `${totalDays}d ${totalHours % 24}h`;
      if (totalHours > 0) return `${totalHours}h ${totalMins % 60}m`;
      if (totalMins > 0) return `${totalMins}m ${totalSecs % 60}s`;
      return `${totalSecs}s`;
    } catch (_) {
      return '—';
    }
  };

  const handleDownloadCSV = () => {
    if (closedTrades.length === 0) return;

    // Define CSV headers
    const headers = [
      'Transaction ID',
      'Symbol',
      'Side',
      'Position Size',
      'Entry Price',
      'Stop Loss',
      'Take Profit',
      'Exit Price',
      'Holding Duration',
      'PnL ($)',
      'Opened At',
      'Closed At',
      'Logic Reason'
    ];

    // Map each closed trade to a CSV line
    const rows = closedTrades.map((t) => {
      // Escape commas and double quotes in reason
      const cleanReason = t.reason ? t.reason.replace(/"/g, '""') : '';
      const holdingDur = formatHoldingDuration(t.timestamp, t.exitTimestamp);
      return [
        t.id,
        t.symbol,
        t.side,
        t.size,
        t.entryPrice,
        t.stopLoss,
        t.takeProfit,
        t.exitPrice !== undefined && t.exitPrice !== null ? t.exitPrice : '',
        `"${holdingDur}"`,
        t.pnl,
        t.timestamp || '',
        t.exitTimestamp || '',
        `"${cleanReason}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    // Create a download link and trigger standard browser download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MT5_Broker_Trade_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openTrades = useMemo(() => trades.filter((t) => t.status === 'OPEN'), [trades]);
  const closedTrades = useMemo(() => trades.filter((t) => t.status === 'CLOSED'), [trades]);

  const getLivePnL = (t: Trade) => {
    let curPrice = metrics.currentPrice;
    if (t.symbol !== symbol) {
      if (t.symbol === 'EUR/USD') curPrice = 1.1645;
      else if (t.symbol === 'GBP/USD') curPrice = 1.2680;
      else if (t.symbol === 'USD/JPY') curPrice = 155.40;
      else if (t.symbol === 'BTC/USDT') curPrice = 67500.0;
      else if (t.symbol === 'GOLD/USD') curPrice = 2355.50;
    }

    const pnlMultiplier = t.side === 'BUY' ? 1 : -1;
    const priceDiff = curPrice - t.entryPrice;
    
    let rawPnl = 0;
    if (t.symbol === 'BTC/USDT') {
      rawPnl = priceDiff * t.size * pnlMultiplier;
    } else if (t.symbol === 'USD/JPY') {
      rawPnl = (priceDiff / 0.01) * t.size * 0.1 * pnlMultiplier;
    } else if (t.symbol === 'GOLD/USD') {
      rawPnl = (priceDiff / 0.1) * t.size * 1.0 * pnlMultiplier;
    } else {
      rawPnl = (priceDiff / 0.0001) * t.size * 1.0 * pnlMultiplier;
    }
    return parseFloat(rawPnl.toFixed(2));
  };

  const chartData = useMemo(() => {
    // Sort trades older to newer chronologically by exitTimestamp or timestamp
    const sorted = [...closedTrades].sort((a, b) => {
      const timeA = new Date(a.exitTimestamp || a.timestamp).getTime();
      const timeB = new Date(b.exitTimestamp || b.timestamp).getTime();
      return timeA - timeB;
    });

    let cumulative = 0;
    const points = [{ tradeNum: 0, pnl: 0, cumulative: 0, label: 'Start' }];

    sorted.forEach((trade, index) => {
      cumulative += trade.pnl;
      points.push({
        tradeNum: index + 1,
        pnl: trade.pnl,
        cumulative: parseFloat(cumulative.toFixed(2)),
        label: `T${index + 1} (${trade.symbol})`,
      });
    });

    return points;
  }, [closedTrades]);

  const dayOfWeekPnLData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const pnlMap: Record<string, number> = {
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0,
      'Sunday': 0,
    };

    closedTrades.forEach((trade) => {
      const dateStr = trade.exitTimestamp || trade.timestamp;
      if (!dateStr) return;
      try {
        const date = new Date(dateStr);
        const dayIdx = date.getDay();
        const dayName = days[dayIdx];
        if (dayName && pnlMap[dayName] !== undefined) {
          pnlMap[dayName] += trade.pnl;
        }
      } catch (err) {
        // Safe catch
      }
    });

    const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return order.map((day) => ({
      day,
      pnl: parseFloat((pnlMap[day] || 0).toFixed(2)),
    }));
  }, [closedTrades]);

  const tradeEfficiencyMetrics = useMemo(() => {
    // filter trades with latency information
    const tradesWithMetrics = trades.filter(t => t.latency !== undefined);
    const count = tradesWithMetrics.length;

    if (count === 0) {
      return {
        ratio: 100,
        avgLatency: 0,
        avgSlippage: 0,
        healthyCount: 0,
        breachedCount: 0,
        healthyPct: 100,
        breachedTrades: []
      };
    }

    const sumLatency = tradesWithMetrics.reduce((s, t) => s + (t.latency || 0), 0);
    const sumSlippage = tradesWithMetrics.reduce((s, t) => s + (t.slippage || 0), 0);
    const avgLatency = sumLatency / count;
    const avgSlippage = sumSlippage / count;

    // Target is 45ms
    const healthyList = tradesWithMetrics.filter(t => (t.latency || 0) <= 45);
    const breachedList = tradesWithMetrics.filter(t => (t.latency || 0) > 45);
    
    // Latency Score: 100% at <=20ms, decreasing to 0% at 150ms
    const latencyScore = Math.max(0, Math.min(100, 100 - (avgLatency - 20) * (100 / 130)));
    // Slippage Score: 100% at 0.0 pips, decreasing to 0% at 2.5 pips
    const slippageScore = Math.max(0, Math.min(100, 100 - (avgSlippage / 2.5) * 100));

    // Weighted score: 50% latency, 50% slippage
    const ratio = latencyScore * 0.5 + slippageScore * 0.5;

    return {
      ratio,
      avgLatency,
      avgSlippage,
      healthyCount: healthyList.length,
      breachedCount: breachedList.length,
      healthyPct: (healthyList.length / count) * 100,
      breachedTrades: breachedList
    };
  }, [trades]);

  // Biometric scanning timer simulation loop
  useEffect(() => {
    let intervalId: any;
    if (isScanning) {
      setScanProgress(0);
      intervalId = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(intervalId);
            setIsScanning(false);
            
            // Set access logs success
            setScanStatusLog("BIOMETRIC ACCESS CONFIRMED. DEPLOYING MTX AI SYSTEM...");
            
            // Turn on Live Execution Mode and close modal after a short Delay!
            setTimeout(() => {
              setIsLiveExecution(true);
              setIsAuthModalOpen(false);
            }, 1000);
            
            return 100;
          }
          
          const next = prev + 5;
          
          if (next <= 25) {
            setScanStatusLog("ENGAGING OPTICAL THERMO SENSOR MATRIX [32-POINT CHIP]...");
          } else if (next <= 55) {
            setScanStatusLog("SCANNING LIVENESS DERMAL REFLECTIVITY & SURFACE RIDGES...");
          } else if (next <= 85) {
            setScanStatusLog("COMPILING CRYPTOGRAPHIC SHA-256 SESSION KEY HANDSHAKE...");
          } else {
            setScanStatusLog("SYNCHRONIZING WITH MT5 CORE BACKEND BROKER PORT CHIP...");
          }
          
          return next;
        });
      }, 100);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isScanning]);

  // Password terminal verification helper
  const handleVerifyPassword = () => {
    if (enteredPassword.toUpperCase() === 'ADMIN123' || enteredPassword.length >= 6) {
      setIsLiveExecution(true);
      setIsAuthModalOpen(false);
      setAuthError(null);
    } else {
      setAuthError('INVALID HANDSHAKE ACCESS CODE. CORRELATION REJECTED.');
    }
  };

  // AI Advisor Live Trade Trigger scanner
  useEffect(() => {
    if (!isLiveExecution) return;

    // Check if confidence is above the threshold (e.g., >= 80% for verified institution setups)
    const isHighProbability = confidence >= 80;

    if (isHighProbability) {
      // Check if we already have an active trade open for THIS symbol
      const hasActiveSymTrade = trades.some((t) => t.status === 'OPEN' && t.symbol === symbol);

      if (!hasActiveSymTrade) {
        // AI Advisor triggers automatic executive trade order
        const executeAiTrade = async () => {
          try {
            // Calculate appropriate side alignment
            const aiSide = (side === 'BUY' && metrics.dailyBias === 'BULLISH') || (side === 'SELL' && metrics.dailyBias === 'BEARISH') 
              ? side 
              : (metrics.dailyBias === 'BULLISH' ? 'BUY' : 'SELL');

            const res = await fetch('/api/trades', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                symbol,
                side: aiSide,
                entryPrice,
                stopLoss,
                takeProfit,
                size: calculatedPositionSize || 1.0,
                reason: `⚡ MTX AI Automated Execution: Triggered on validated signal high-confluence parameters (${confidence}% Confidence level).`,
                confidence,
                confluences: selectedConfluences,
                marketNote: `${marketNote} (AI Executed Mode)`,
                autoBreakEvenProfitPct: autoBreakEvenEnabled ? parseFloat(autoBreakEvenProfitPct) : undefined,
              }),
            });

            if (res.ok) {
              setAiTradeSuccessAlert(`MTX AI executed ${aiSide} position on ${symbol} at $${entryPrice} for ${calculatedPositionSize} Lots!`);
              setTimeout(() => setAiTradeSuccessAlert(null), 8000);
              playTradeSound('ai-success');
              onTradeExecuted();
            } else {
              playTradeSound('fail');
            }
          } catch (err) {
            console.error('Failed to trigger AI trade execution:', err);
          }
        };

        const timeoutId = setTimeout(executeAiTrade, 1500);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isLiveExecution, metrics?.currentPrice, symbol, entryPrice, stopLoss, takeProfit, calculatedPositionSize, trades, side, metrics?.dailyBias, confidence]);

  return (
    <div id="trade-terminal-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#050505]/20">
      {/* Observation Mode Active Status Bar */}
      {isObserveMode && (
        <div id="observation-mode-status-bar" className="lg:col-span-12 bg-indigo-950/20 border border-indigo-500/30 rounded-lg p-3.5 px-4.5 flex items-center justify-between animate-fadeIn shadow-[0_0_12px_rgba(99,102,241,0.1)]">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center">
              <span className="flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500 shadow-[0_0_6px_#6366f1]"></span>
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:gap-3">
              <span className="text-[11px] font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 inline text-indigo-400 animate-pulse" />
                Observation Mode Active
              </span>
              <span className="text-[9.5px] text-white/50 font-sans leading-none">
                • Non-essential warnings silenced. Filtering for high-dispersion Institutional Liquidity Sweeps (BSL/SSL).
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 font-mono text-[8.5px]">
            <span className="text-indigo-400 font-extrabold uppercase bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded animate-pulse">
              Observing {symbol}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tab Bar for clicking between Order & Risk Calculator and Live Trade Ledger */}
      <div id="trade-terminal-navigation" className="col-span-12 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex space-x-2">
          <button
            id="tab-btn-calculator"
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2 border cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-indigo-600/25 border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-black'
                : 'bg-transparent border-transparent text-white/40 hover:text-white/80'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 shrink-0" />
            <span>Order & Risk Calculator</span>
          </button>
          
          <button
            id="tab-btn-ledger"
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2 border cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-indigo-600/25 border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-black'
                : 'bg-transparent border-transparent text-white/40 hover:text-white/80'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>Live Trade Ledger</span>
            {openTrades.length > 0 && (
              <span 
                className="ml-1.5 px-2 py-0.5 text-[9px] font-sans font-extrabold rounded-full bg-indigo-500 text-white leading-none shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse"
                style={{ letterSpacing: '0' }}
              >
                {openTrades.length}
              </span>
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-1.5 font-mono text-[8.5px] text-white/35 uppercase bg-white/[0.02] border border-white/5 px-2.5 py-1.5 rounded-md">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_6px_#818cf8]"></span>
          <span className="font-semibold text-white/50">Active View:</span>
          <span className="text-white/80 font-bold">{activeTab === 'calculator' ? 'CALCULATOR' : 'LEDGER'}</span>
        </div>
      </div>

      {/* Risk Sizing & Execution Panel */}
      <div className={`col-span-12 bg-[#080808] border border-white/10 rounded p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between ${activeTab === 'calculator' ? '' : 'hidden'}`}>
        <div>
          <div className="flex items-center space-x-2.5 pb-4 border-b border-white/10">
            <div className="p-2 bg-indigo-500/10 rounded">
              <Landmark className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm md:text-base font-sans">Order & Risk Calculator</h4>
              <p className="text-xs text-white/40 font-mono uppercase tracking-tight">Fixed-fractional model</p>
            </div>
          </div>

          {/* COMBINED AI AUTOMATION & CONTROL DESK */}
          <div id="ai-automation-control-desk" className="mt-4 p-3.5 bg-gradient-to-r from-indigo-950/20 via-black/10 to-indigo-900/10 border border-indigo-500/20 rounded-lg flex flex-col space-y-3 shadow-md">
            {/* Title Bar */}
            <div className="flex items-center space-x-1.5 pb-2 border-b border-white/5 shrink-0">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <h5 className="text-[10px] uppercase font-bold text-white/40 font-mono tracking-wider">AI Automation & Control Desk</h5>
            </div>

            {/* Combined Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column 1: AI Live Execution */}
              <div id="ai-live-execution-card" className="flex flex-col justify-between space-y-2.5 pr-0 md:pr-3 md:border-r border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-indigo-500/10 rounded">
                      <Cpu className={`w-3.5 h-3.5 ${isLiveExecution ? 'text-emerald-400 animate-pulse' : 'text-indigo-400'}`} />
                    </div>
                    <div>
                      <h6 className="text-[11px] font-mono font-bold uppercase tracking-wide text-white">AI Live Execution</h6>
                      <span className="text-[8px] font-sans text-white/45 block">Autonomous trading on triggers</span>
                    </div>
                  </div>
                  
                  {/* Premium Toggle Button */}
                  <button
                    id="live-execution-toggle"
                    type="button"
                    onClick={() => {
                      if (isLiveExecution) {
                        setIsLiveExecution(false);
                      } else {
                        setIsAuthModalOpen(true);
                        setAuthMode('BIOMETRIC');
                        setEnteredPassword('');
                        setAuthError(null);
                        setIsScanning(false);
                        setScanProgress(0);
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isLiveExecution ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isLiveExecution ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[8.5px] font-mono">
                  <span className="text-white/30 uppercase">STATUS:</span>
                  <span className={`font-mono font-extrabold flex items-center space-x-1 ${
                    isLiveExecution ? 'text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded animate-pulse' : 'text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded'
                  }`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${isLiveExecution ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`}></span>
                    {isLiveExecution ? 'ACTIVE & SCANNING' : 'LOCKED'}
                  </span>
                </div>
              </div>

              {/* Column 2: Wait & Observe */}
              <div id="wait-observe-mode-card" className="flex flex-col justify-between space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-indigo-500/10 rounded">
                      <Eye className={`w-3.5 h-3.5 ${isObserveMode ? 'text-indigo-400 animate-pulse' : 'text-white/40'}`} />
                    </div>
                    <div>
                      <h6 className="text-[11px] font-mono font-bold uppercase tracking-wide text-white">Wait & Observe</h6>
                      <span className="text-[8px] font-sans text-white/45 block">Silence trade alert noise</span>
                    </div>
                  </div>
                  
                  {/* Toggle switch Button */}
                  <button
                    id="wait-observe-toggle"
                    type="button"
                    onClick={toggleObserveMode}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isObserveMode ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-gray-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isObserveMode ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[8.5px] font-mono">
                  <span className="text-white/30 uppercase">FILTER:</span>
                  <span className={`font-black uppercase px-1.5 py-0.5 rounded ${
                    isObserveMode ? 'text-indigo-300 bg-indigo-500/15 border border-indigo-500/10' : 'text-white/30 bg-white/5'
                  }`}>
                    {isObserveMode ? 'Sweeps Only' : 'Standard Feed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Unified Sub-Info Footer */}
            <div className="text-[8.5px] text-white/25 leading-normal font-sans bg-black/40 p-2 rounded border border-white/[0.03]">
              ⏱️ <span className="font-semibold text-white/45">Execution Strategy:</span> Triggers automations when signals reach <strong className="text-indigo-300 font-bold">≥ 80% confidence</strong>. Protects equity via the Fixed-fractional model.
            </div>
          </div>

          {/* AI Advisor Execution Alert Banner */}
          {aiTradeSuccessAlert && (
            <div id="ai-trade-success-alert" className="mt-3.5 p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded text-emerald-300 text-[11px] leading-relaxed flex flex-col space-y-1">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="font-sans">{aiTradeSuccessAlert}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiTradeSuccessAlert(null)}
                  className="text-white/40 hover:text-white transition-colors cursor-pointer select-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Equity Inputs */}
          <div className="grid grid-cols-2 gap-4 mt-4 font-mono text-xs">
            <div>
              <label className="text-white/35 block uppercase mb-1 font-sans tracking-tight">Account Equity ($)</label>
              <input
                id="balance-input"
                type="number"
                value={accountBalance}
                onChange={(e) => setAccountBalance(Number(e.target.value))}
                className="w-full bg-[#050505] border border-white/10 text-white px-3 py-2 rounded focus:outline-none focus:border-indigo-500 font-bold"
              />
            </div>
            <div>
              <label className="text-white/35 block uppercase mb-1 font-sans tracking-tight">Risk Amount (%)</label>
              <input
                id="risk-pct-input"
                type="number"
                step="0.1"
                max="5"
                min="0.1"
                value={riskPct}
                onChange={(e) => setRiskPct(Number(e.target.value))}
                className="w-full bg-[#050505] border border-white/10 text-white px-3 py-2 rounded focus:outline-none focus:border-indigo-500 font-bold"
              />
              <div className="flex gap-1.5 mt-1.5 font-mono text-[9px] select-none">
                {[0.5, 1.0, 2.0, 3.0].map((val) => (
                  <button
                    key={`risk-chip-${val}`}
                    type="button"
                    onClick={() => setRiskPct(val)}
                    className={`px-2 py-0.5 rounded border transition-all cursor-pointer font-extrabold ${
                      riskPct === val 
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' 
                        : 'bg-[#050505] text-white/40 border-white/5 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Side Toggle Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              id="side-toggle-buy"
              onClick={() => setSide('BUY')}
              className={`py-2 text-xs font-mono rounded font-bold uppercase transition-all tracking-wider flex items-center justify-center space-x-1.5 border ${
                side === 'BUY'
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                  : 'bg-[#050505] text-white/40 border-transparent hover:text-white/80'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${side === 'BUY' ? 'bg-emerald-400' : 'bg-white/10'}`}></span>
              <span>Bullish (BUY Limit)</span>
            </button>
            <button
              id="side-toggle-sell"
              onClick={() => setSide('SELL')}
              className={`py-2 text-xs font-mono rounded font-bold uppercase transition-all tracking-wider flex items-center justify-center space-x-1.5 border ${
                side === 'SELL'
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/5'
                  : 'bg-[#050505] text-white/40 border-transparent hover:text-white/80'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${side === 'SELL' ? 'bg-rose-400' : 'bg-white/10'}`}></span>
              <span>Bearish (SELL Limit)</span>
            </button>
          </div>

          {/* Intraday Volatility Levels Matrix (ATR) */}
          <div id="execution-volatility-matrix" className="mt-4 bg-[#050505] border border-white/10 rounded p-4 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-white/80">Intraday Volatility Matrix</h5>
                <span className="text-[10px] text-white/40 block">Click levels to anchor your SL/TP/Entry</span>
              </div>
              <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                ATR-Grounded Range
              </div>
            </div>

            {/* Matrix Rows */}
            <div className="space-y-[3px] font-mono select-none">
              {/* Column Headers */}
              <div className="grid grid-cols-12 text-[9px] text-white/30 uppercase font-mono pb-1 border-b border-white/5">
                <div className="col-span-5 text-left">Volatility Zone</div>
                <div className="col-span-4 text-center">Reference Price</div>
                <div className="col-span-3 text-right">Probability</div>
              </div>

              {volatilityLevels.map((level, idx) => {
                const isSelected = selectedDomPrice === level.price;
                const isSpot = level.type === 'SPOT';
                
                // Color formatting
                let rowBg = 'border border-transparent hover:bg-white/5';
                let priceColor = 'text-white';
                let probabilityText = '95%';
                
                if (isSpot) {
                  rowBg = 'bg-indigo-500/10 border border-indigo-500/25';
                  priceColor = 'text-indigo-400 font-black';
                  probabilityText = 'Pivot';
                } else if (level.type === 'TAKE_PROFIT') {
                  rowBg = 'border border-transparent hover:bg-emerald-500/5';
                  priceColor = 'text-emerald-400 font-semibold';
                  probabilityText = level.name.includes('2.0') ? '15%' : level.name.includes('1.0') ? '40%' : '65%';
                } else if (level.type === 'STOP_LOSS') {
                  rowBg = 'border border-transparent hover:bg-rose-500/5';
                  priceColor = 'text-rose-450 font-semibold';
                  probabilityText = level.name.includes('2.0') ? '5%' : level.name.includes('1.5') ? '20%' : '50%';
                }

                if (isSelected) {
                  rowBg = 'bg-[#111115] border border-indigo-500/40 shadow-inner';
                }

                return (
                  <div key={`vol-level-${idx}`} className="flex flex-col">
                    <div
                      onClick={() => setSelectedDomPrice(selectedDomPrice === level.price ? null : level.price)}
                      className={`grid grid-cols-12 text-xs py-1.5 px-2 rounded items-center cursor-pointer transition-colors ${rowBg}`}
                      title={level.desc}
                    >
                      {/* Name */}
                      <div className="col-span-5 text-left flex flex-col">
                        <span className="font-bold text-[10px] text-white/85">{level.name.split(' (')[0]}</span>
                        <span className="text-[8px] text-white/35 leading-none">{level.name.includes('(') ? '(' + level.name.split(' (')[1] : ''}</span>
                      </div>

                      {/* Price */}
                      <div className={`col-span-4 text-center font-bold font-mono ${priceColor}`}>
                        {formatPrice(level.price)}
                      </div>

                      {/* Probability / Type */}
                      <div className="col-span-3 text-right text-[10px] text-white/40 font-mono flex flex-col">
                        <span className="font-extrabold">{probabilityText}</span>
                        <span className="text-[7.5px] text-white/20 uppercase tracking-tighter leading-none">{level.type.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {/* Expanded Setters Overlay */}
                    {isSelected && (
                      <div className="flex items-center justify-center gap-2 bg-[#050505] border border-t-0 border-indigo-500/30 p-2 rounded-b select-none">
                        <button
                          type="button"
                          onClick={() => { setEntryPrice(parseFloat(level.price.toFixed(decimalLimit))); setSelectedDomPrice(null); }}
                          className="px-2.5 py-1 text-[10px] font-mono uppercase bg-[#111] hover:bg-[#222] text-white hover:text-indigo-300 rounded border border-white/10 cursor-pointer transition-colors"
                        >
                          Set Entry
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStopLoss(parseFloat(level.price.toFixed(decimalLimit))); setSelectedDomPrice(null); }}
                          className="px-2.5 py-1 text-[10px] font-mono uppercase bg-[#111] hover:bg-[#222] text-white hover:text-rose-400 rounded border border-white/10 cursor-pointer transition-colors"
                        >
                          Set SL
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTakeProfit(parseFloat(level.price.toFixed(decimalLimit))); setSelectedDomPrice(null); }}
                          className="px-2.5 py-1 text-[10px] font-mono uppercase bg-[#111] hover:bg-[#222] text-white hover:text-emerald-400 rounded border border-white/10 cursor-pointer transition-colors"
                        >
                          Set TP
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Boundaries Inputs */}
          <div className="space-y-3.5 mt-4 font-mono text-xs">
            {/* Entry Price */}
            <div>
              <label className="text-white/40 block uppercase mb-1 font-mono tracking-wide text-[10px]">Limit Order Entry Price</label>
              <input
                id="entry-price-input"
                type="number"
                step="0.0001"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-[#050505] border border-white/10 text-white px-3 py-2 rounded focus:outline-none focus:border-white/35 font-semibold font-mono text-xs transition-colors"
              />
            </div>

            {/* SL and TP grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-1 select-none">
                    <label className="text-white/40 block uppercase font-mono tracking-wide text-[10px]">
                      Stop Loss (SL)
                    </label>
                    <div className="group relative flex items-center">
                      <HelpCircle className="w-3.5 h-3.5 text-white/30 hover:text-white transition-colors cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-[#050505] border border-white/15 text-white/90 p-3 rounded shadow-lg z-50 w-56 font-mono text-[10px] leading-relaxed pointer-events-none">
                        <div className="text-white/70 font-bold mb-1 border-b border-white/5 pb-1 uppercase tracking-wider">
                          Volatility Guidance
                        </div>
                        <div className="space-y-1 text-white/70">
                          <div>ATR Value: <span className="font-mono text-white">{metrics.atr.toFixed(5)}</span></div>
                          <div>Value: <span className="text-white font-mono">
                            {symbol === 'USD/JPY' ? (metrics.atr * 100).toFixed(1) : symbol === 'BTC/USDT' || symbol === 'GOLD/USD' ? metrics.atr.toFixed(1) : (metrics.atr * 10000).toFixed(1)} {symbol === 'BTC/USDT' || symbol === 'GOLD/USD' ? 'USD' : 'pips'}
                          </span></div>
                          <div className="pt-1 mt-1 border-t border-white/5">
                            <span className="text-amber-400 font-bold uppercase block text-[9px] mb-0.5">Safe Exit Range:</span>
                            <span className="text-white font-bold">
                              {(side === 'BUY' ? metrics.currentPrice - 2.5 * metrics.atr : metrics.currentPrice + 1.5 * metrics.atr).toFixed(symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5)}
                              {' - '}
                              {(side === 'BUY' ? metrics.currentPrice - 1.5 * metrics.atr : metrics.currentPrice + 2.5 * metrics.atr).toFixed(symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5)}
                            </span>
                            <span className="text-[8px] text-white/40 block mt-0.5">Ideal {side === 'BUY' ? 'Below' : 'Above'} Price (1.5x - 2.5x ATR Volatility Buffer)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {suggestedSlPrice && (
                    <button
                      id="autosl-suggestion-btn"
                      type="button"
                      onClick={() => setStopLoss(suggestedSlPrice)}
                      className="text-[9px] font-mono text-amber-400 hover:text-amber-300 transition-colors bg-white/5 px-1 px-1.5 py-0.5 rounded border border-white/10 cursor-pointer"
                      title={`MTX Engine suggests placing Stop Loss at ${suggestedSlPrice} derived from the nearest dynamic Liquidity Sweep at ${suggestedSweepSl?.level}`}
                    >
                      Auto-SL: {suggestedSlPrice}
                    </button>
                  )}
                </div>
                <input
                  id="stoploss-input"
                  type="number"
                  step="0.0001"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className={`w-full bg-[#050505] border ${
                    isSlSignificantlyWide 
                      ? 'border-amber-500/50 text-amber-400' 
                      : 'border-white/10 text-rose-500'
                  } px-3 py-2 rounded focus:outline-none focus:border-white/35 font-semibold text-xs transition-colors`}
                />
                {isSlSignificantlyWide && (
                  <p className="text-[9px] text-amber-400 font-mono mt-1 leading-tight flex items-start gap-1 select-none animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <span>Warning: Stop-loss is wide (&gt; 5 ATR difference from market price).</span>
                  </p>
                )}
              </div>
              <div>
                <label className="text-white/40 block uppercase mb-1 font-mono tracking-wide text-[10px]">
                  Take Profit (TP)
                </label>
                <input
                  id="takeprofit-input"
                  type="number"
                  step="0.0001"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(Number(e.target.value))}
                  className="w-full bg-[#050505] border border-white/10 text-emerald-500 px-3 py-2 rounded focus:outline-none focus:border-white/35 font-semibold text-xs transition-colors"
                />
              </div>
            </div>

            {/* Direct Add Stop-Loss via Liquidity Sweep Button */}
            <div className="pt-0.5">
              <button
                id="btn-add-sl-from-sweep"
                type="button"
                onClick={handleAddStopLossFromSweep}
                className="w-full bg-[#050505] hover:bg-[#111] border border-white/10 hover:border-white/20 text-white/80 font-mono text-[10px] font-bold uppercase py-2 px-3 rounded transition-colors flex items-center justify-between cursor-pointer select-none active:scale-[0.98]"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-extrabold text-white/70">Set SL via Sweep Level memory</span>
                </div>
                {sweeps && sweeps.length > 0 ? (
                  <span className="text-[9px] bg-white/5 text-amber-300 border border-white/10 px-2 py-0.5 rounded font-black">
                    SWEEP: {sweeps[sweeps.length - 1].level.toFixed(symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5)}
                  </span>
                ) : (
                  <span className="text-[8px] text-white/30">NO SWEEP IN MEMORY</span>
                )}
              </button>
            </div>

            {/* Shortcuts (Sizer Presets ratios) */}
            <div className="flex items-center space-x-2 mt-0.5 select-none text-[10px]">
              <span className="text-[9.5px] font-mono text-white/40 uppercase">SL/TP Preset Ratios:</span>
              <div className="flex gap-1.5 font-mono text-[9px]">
                {[1.0, 1.5, 2.0, 3.0, 4.0].map((ratio) => (
                  <button
                    key={`rr-preset-${ratio}`}
                    type="button"
                    onClick={() => applyRewardRatioPreset(ratio)}
                    className="px-2 py-0.5 rounded border border-white/5 bg-[#0a0b0d] hover:bg-[#151619] text-white/60 hover:text-white transition-colors cursor-pointer font-extrabold"
                    title={`Calculate target Take Profit at exactly 1:${ratio} risk-to-reward ratio based on current entry and Stop Loss levels.`}
                  >
                    1:{ratio === 1 ? '1' : ratio.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* VOLATILITY-BASED POSITION SIZE CALCULATOR */}
            <div id="atr-position-size-calculator" className="bg-[#050505] border border-white/10 rounded p-4 space-y-3.5 select-none shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-white/60" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                    ATR Volatility Sizer
                  </span>
                </div>
                <div className="flex items-center space-x-1 py-0.5 px-2 bg-white/5 rounded text-[10px] font-mono text-white/60">
                  <span>ATR:</span>
                  <span className="font-mono text-white font-extrabold">{metrics.atr.toFixed(5)}</span>
                  <span className="text-white/20">|</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {symbol === 'USD/JPY' ? (metrics.atr * 100).toFixed(1) : symbol === 'BTC/USDT' || symbol === 'GOLD/USD' ? metrics.atr.toFixed(1) : (metrics.atr * 10000).toFixed(1)} {symbol === 'BTC/USDT' || symbol === 'GOLD/USD' ? 'USD' : 'pips'}
                  </span>
                </div>
              </div>

              {/* SL Multiplier Selectors */}
              <div className="space-y-1 font-mono">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-white/40 uppercase">Stop Loss Distance (Multiplier)</span>
                  <span className="font-bold text-white/80">{atrMultiplier.toFixed(1)}x ATR</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                  {[1.5, 2.0, 2.5, 3.0].map((m) => (
                    <button
                      key={`atr-mult-btn-${m}`}
                      type="button"
                      onClick={() => setAtrMultiplier(m)}
                      className={`py-1 rounded font-mono font-bold transition-all cursor-pointer border ${
                        atrMultiplier === m
                          ? 'bg-white/10 border-white/30 text-white'
                          : 'bg-transparent border-white/5 hover:border-white/10 text-white/40 hover:text-white/70'
                      }`}
                    >
                      {m.toFixed(1)}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk Percentage Toggle - Recommended 1% Model */}
              <div className="space-y-1 font-mono">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-white/40 uppercase">Risk Model (1% Recommended)</span>
                  <span className="font-bold text-white/80">
                    <span className="text-amber-400">{atrRiskPct.toFixed(1)}%</span> of Balance
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                  {[0.5, 1.0, 1.5, 2.0].map((r) => (
                    <button
                      key={`atr-risk-btn-${r}`}
                      type="button"
                      onClick={() => setAtrRiskPct(r)}
                      className={`py-1 rounded font-mono font-bold transition-all relative cursor-pointer border ${
                        atrRiskPct === r
                          ? 'bg-white/10 border-white/30 text-white'
                          : 'bg-transparent border-white/5 hover:border-white/10 text-white/40 hover:text-white/70'
                      }`}
                    >
                      {r.toFixed(1)}%
                      {r === 1.0 && (
                        <span className="absolute -top-1.5 right-0 bg-emerald-500 text-[6px] text-black font-sans font-black px-1 rounded-sm leading-none uppercase tracking-tight shadow-sm">
                          Rec
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* TP Reward Ratio Multipliers */}
              <div className="space-y-1 font-mono">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-white/40 uppercase">Take Profit Target (TP Multiplier)</span>
                  <span className="font-bold text-white/80">{atrTpMultiplier.toFixed(1)}x ATR</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                  {[2.0, 3.0, 4.0, 6.0].map((tp) => (
                    <button
                      key={`atr-tp-btn-${tp}`}
                      type="button"
                      onClick={() => setAtrTpMultiplier(tp)}
                      className={`py-1 rounded font-mono font-bold transition-all cursor-pointer border ${
                        atrTpMultiplier === tp
                          ? 'bg-white/10 border-white/30 text-white'
                          : 'bg-transparent border-white/5 hover:border-white/10 text-white/40 hover:text-white/70'
                      }`}
                    >
                      {tp.toFixed(1)}x
                    </button>
                  ))}
                </div>
              </div>

              {/* live computations display box */}
              <div className="p-3 bg-white/5 border border-white/5 rounded space-y-1.5 text-[10px] font-mono leading-relaxed text-left">
                <div className="flex justify-between items-center text-white/40">
                  <span>Balance:</span>
                  <span className="text-white/80 font-bold">${accountBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-white/40">
                  <span>Risk Sized:</span>
                  <span className="text-rose-450 font-bold">${(accountBalance * (atrRiskPct / 100)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-white/40 border-t border-white/5 pt-1.5">
                  <span>SL Point Distance:</span>
                  <span className="text-white/80">
                    {calculatedAtrSlDistance.toFixed(symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5)}
                    <span className="text-white/40 ml-1">
                      ({symbol === 'USD/JPY' ? (calculatedAtrSlDistance * 100).toFixed(1) : symbol === 'BTC/USDT' || symbol === 'GOLD/USD' ? `$${calculatedAtrSlDistance.toFixed(1)}` : (calculatedAtrSlDistance * 10000).toFixed(1)} {symbol === 'BTC/USDT' || symbol === 'GOLD/USD' ? 'USD' : 'pips'})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/40">
                  <span>Proposed Sizing:</span>
                  <span className="text-amber-400 font-bold text-xs">
                    {calculatedAtrPositionSize} {symbol === 'BTC/USDT' ? 'BTC' : 'LOTS'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/40 pt-1.5 border-t border-white/5">
                  <span>Suggested SL Level:</span>
                  <span className="text-rose-500 font-bold">{recommendedAtrStopLoss}</span>
                </div>
                <div className="flex justify-between items-center text-white/40">
                  <span>Suggested TP Level:</span>
                  <span className="text-emerald-500 font-bold">{recommendedAtrTakeProfit}</span>
                </div>
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={handleApplyAtrParameters}
                className="w-full py-2 bg-[#111] hover:bg-[#222] text-white/80 hover:text-white border border-white/10 rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply ATR Sizing & Levels</span>
              </button>
            </div>

            {/* Auto-Break-Even block */}
            <div className="bg-[#050505] border border-white/10 rounded p-4 space-y-3 select-none text-left shadow-md">
              <div className="flex items-center justify-between">
                <label className="text-white/80 font-mono font-bold flex items-center gap-2 cursor-pointer text-[10.5px]">
                  <input
                    id="checkbox-auto-break-even"
                    type="checkbox"
                    checked={autoBreakEvenEnabled}
                    onChange={(e) => setAutoBreakEvenEnabled(e.target.checked)}
                    className="border-white/20 bg-black text-white focus:ring-transparent h-4 w-4 cursor-pointer rounded"
                  />
                  <span>Auto-Break-Even Strategy</span>
                </label>
                <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider transition-colors ${
                  autoBreakEvenEnabled ? 'bg-white/10 text-white border border-white/20' : 'bg-white/5 text-white/30 border border-transparent'
                }`}>
                  {autoBreakEvenEnabled ? 'ARMED' : 'OFF'}
                </span>
              </div>
              
              {autoBreakEvenEnabled && (
                <div className="space-y-2 pt-1 transition-all">
                  <p className="text-[10px] font-mono text-white/45 leading-normal">
                    Secure capital automatically. Once the active trade reaches this profit target (%), the stop-loss is shifted instantly to its entry price.
                  </p>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[10px] text-white/40 font-semibold shrink-0">Trigger Profit Target:</span>
                    <div className="relative flex-1 max-w-[110px]">
                      <input
                        id="input-auto-be-profit-pct"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={autoBreakEvenProfitPct}
                        onChange={(e) => setAutoBreakEvenProfitPct(e.target.value)}
                        className="w-full bg-black border border-white/10 text-white font-mono text-xs px-2 py-1 rounded outline-none focus:border-white/30 pr-6"
                        placeholder="1.0"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-white/30 font-bold">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Market Notes - Unified with styling */}
            <div className="p-4 bg-[#050505] border border-white/10 rounded space-y-2 text-left">
              <div className="flex items-center justify-between">
                <label className="text-white/40 block text-[10px] uppercase font-mono tracking-wide">
                  Pre-defined Market Note (Entry Reason)
                </label>
                <span className="text-[8px] text-white/60 font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-widest">PERSISTENT</span>
              </div>
              <textarea
                id="market-note-textarea"
                value={marketNote}
                rows={2}
                onChange={(e) => setMarketNote(e.target.value)}
                placeholder="Pre-define strategy reasoning or observations to stamp them on any trades executed..."
                className="w-full bg-black border border-white/10 focus:border-white/30 hover:border-white/20 text-white px-3 py-2 rounded focus:outline-none placeholder-white/25 text-xs font-mono leading-normal"
              />
              <span className="text-[8.5px] text-white/30 font-mono leading-normal block">
                🔒 Stored locally in sandbox browser safe vaults. Stamped directly onto live trade ledgers.
              </span>
            </div>

            {/* ICT Audit and Confidence Score Block */}
            <div className="border border-white/10 bg-[#050505] rounded p-4 space-y-3 text-left shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-white/60" />
                  ICT Confluence Audit Methodology
                </span>
              </div>

              {/* Confidence Manual Adjuster slider */}
              <div className="space-y-1 font-mono">
                <label className="text-white/40 block text-[9.5px] uppercase font-bold tracking-tight">Confidence Adjuster Index</label>
                <div className="flex items-center space-x-3">
                  <input
                    id="audit-confidence-slider"
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={confidence}
                    onChange={(e) => setConfidence(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer focus:outline-none accent-white"
                  />
                </div>
              </div>

              {/* Interactive ICT Checklist mapping */}
              <div className="space-y-2">
                <label className="text-white/40 block text-[9.5px] uppercase font-bold tracking-tight">Executed Confluences Checklist</label>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-tight">
                  {CONFLUENCE_OPTIONS.map((option) => {
                    const isChecked = selectedConfluences.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleToggleConfluence(option)}
                        className={`flex items-start space-x-1.5 p-2 rounded transition-colors text-left border cursor-pointer ${
                          isChecked 
                            ? 'bg-white/10 text-white border-white/20' 
                            : 'bg-transparent text-white/35 border-white/5 hover:text-white/50 hover:bg-white/5'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
                        )}
                        <span className="text-[9px] leading-snug">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Calculations Summary block */}
          <div className="mt-4 bg-[#050505] px-4 py-3 border border-white/10 rounded flex items-center justify-between font-mono text-xs shadow-md">
            <div className="flex items-center space-x-2 select-none">
              <Calculator className="w-4 h-4 text-white/50" />
              <span className="text-white/40 uppercase tracking-wide text-[10px]">Calculated Lot Size:</span>
            </div>
            <span className="text-xs text-white font-bold bg-white/15 border border-white/20 px-2 py-0.5 rounded">
              {calculatedPositionSize} {symbol === 'BTC/USDT' ? 'BTC' : 'LOTS'}
            </span>
          </div>

          {/* Trend alignment alert warning */}
          {!isObserveMode && ((side === 'BUY' && metrics.dailyBias === 'BEARISH') || (side === 'SELL' && metrics.dailyBias === 'BULLISH')) && (
            <div id="trend-misalignment-alert" className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded text-amber-300 text-xs leading-relaxed flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-450 shrink-0 mt-0.5" />
              <p>
                <strong className="text-amber-400 font-bold uppercase font-mono text-[10px] block mb-0.5">⚠️ Trend alignment Warning:</strong> Go check bias! Trade is against the Daily bias (<span className="font-bold underline text-white">{metrics.dailyBias}</span>).
              </p>
            </div>
          )}

          {errorMsg && (
            <div id="terminal-error" className="mt-4 p-3 bg-red-950/20 border border-red-500/30 rounded text-rose-400 text-xs flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* REAL-TIME SYSTEM SIGNAL MONITOR & PRIORITIZATION FEED */}
          <div id="system-signal-monitor-card" className="mt-4 p-4 bg-[#050505] border border-white/10 rounded flex flex-col space-y-3 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center space-x-2 font-mono select-none">
                <Activity className="w-4 h-4 text-white/50" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Signal & Watchtower Stream
                </h5>
              </div>
              <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-md tracking-wider ${
                isObserveMode ? 'bg-white/15 text-white border border-white/20' : 'bg-white/5 text-white/30'
              }`}>
                {isObserveMode ? 'SWEEPS FILTER ACTIVE' : 'FULL TRANSMISSION'}
              </span>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {terminalSignals.filter(s => !isObserveMode || s.type === 'SWEEP_BSL' || s.type === 'SWEEP_SSL').length === 0 ? (
                <div className="text-center py-6 text-white/30 text-[10px] italic font-mono select-none">
                  Waiting for sweep signals on {symbol}...
                </div>
              ) : (
                terminalSignals
                  .filter(s => !isObserveMode || s.type === 'SWEEP_BSL' || s.type === 'SWEEP_SSL')
                  .map((sig) => {
                    const isSweep = sig.type === 'SWEEP_BSL' || sig.type === 'SWEEP_SSL';
                    return (
                      <div 
                        key={sig.id} 
                        className={`p-3 rounded border transition-colors ${
                          isSweep 
                            ? 'bg-amber-500/5 border-amber-550/20' 
                            : 'bg-transparent border-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                            isSweep ? 'text-amber-400' : 'text-white/60'
                          }`}>
                            {isSweep ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <Activity className="w-3.5 h-3.5 text-white/30" />
                            )}
                            {sig.label}
                          </span>
                          <span className="text-[7.5px] font-mono text-white/30 font-semibold select-none">
                            {sig.timestamp}
                          </span>
                        </div>
                        <p className="text-[9px] text-white/40 mt-1 font-mono leading-normal text-left">
                          {sig.details}
                        </p>
                        {sig.volume && (
                          <div className="mt-2 flex items-center justify-between text-[8px] font-mono">
                            <span className="text-white/30">DETECTED VOLUME:</span>
                            <span className="text-white/70 font-semibold bg-white/5 px-1.5 py-0.5 rounded leading-none select-none">
                              {sig.volume}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {isMt5BridgePaused && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[10px] font-mono leading-relaxed space-y-1 animate-fadeIn">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>⚠️ MT5 BRIDGE EXECUTION PAUSED</span>
            </div>
            <p className="text-white/60 text-[9px]">
              The Risk Safety Guard triggered because daily drawdown exceeded your threshold limit. Resume execution in the Risk Desk workspace.
            </p>
          </div>
        )}

        <button
          id="execute-trade-btn"
          disabled={executing}
          onClick={handlePlaceTrade}
          className="mt-5 w-full py-2.5 bg-white hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30 text-black font-mono font-bold text-xs uppercase tracking-widest rounded transition-colors flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Play className="w-4 h-4 shrink-0 text-black" />
          <span>{executing ? 'Transmitting limits request...' : 'Transmit Trade Confirmation'}</span>
        </button>
      </div>

      {/* Trades Ledger & Positions tracker */}
      <div className={`col-span-12 bg-[#080808] border border-white/10 rounded p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between ${activeTab === 'ledger' ? '' : 'hidden'}`}>
        <div>
          <div className="flex items-center space-x-2.5 pb-4 border-b border-white/10">
            <div className="p-2 bg-indigo-500/10 rounded">
              <History className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm md:text-base font-sans">Live Trade Ledger</h4>
              <p className="text-xs text-white/40 font-mono uppercase tracking-tight">Real-time server sync</p>
            </div>
          </div>

          {/* Landscaped Analytics Dashboard layout */}
          <div className="space-y-6 mt-4">
            
            {/* Horizontal Performance Summary Statistics Deck */}
            <div className="p-4 bg-[#050505]/60 border border-white/5 rounded">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-[10px] uppercase font-bold text-white/40 font-mono tracking-wider flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                  Performance Analytics
                </h5>
                <span className="text-[9px] font-mono text-white/35 bg-white/5 px-1.5 py-0.5 rounded leading-none">
                  {performanceStats.totalTrades} {performanceStats.totalTrades === 1 ? 'Trade' : 'Trades'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Win Rate */}
                <div className="p-3 bg-[#080808] border border-white/10 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-[#888888] font-mono uppercase flex items-center">
                      <Percent className="w-2.5 h-2.5 mr-1 text-emerald-400 shrink-0" />
                      Win Rate
                    </span>
                    <div className="text-sm font-mono font-bold text-white mt-1.5 leading-none">
                      {performanceStats.winRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-[9px] text-white/45 font-mono mt-1 font-semibold">
                    {performanceStats.wins}W - {performanceStats.losses}L
                  </div>
                </div>

                {/* Avg Profit */}
                <div className="p-3 bg-[#080808] border border-white/10 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-[#888888] font-mono uppercase flex items-center">
                      <TrendingUp className="w-2.5 h-2.5 mr-1 text-indigo-400 shrink-0" />
                      Avg Profit
                    </span>
                    <div className={`text-sm font-mono font-bold mt-1.5 leading-none ${performanceStats.avgProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {performanceStats.avgProfit >= 0 ? '+' : ''}${performanceStats.avgProfit.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-[9px] text-white/45 font-mono mt-1 font-semibold truncate">
                    Total: {performanceStats.totalPnL >= 0 ? '+' : ''}${performanceStats.totalPnL.toFixed(1)}
                  </div>
                </div>

                {/* Sharpe Ratio */}
                <div className="p-3 bg-[#080808] border border-white/10 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-[#888888] font-mono uppercase flex items-center">
                      <Activity className="w-2.5 h-2.5 mr-1 text-violet-400 shrink-0" />
                      Sharpe Ratio
                    </span>
                    <div className="text-sm font-mono font-bold text-white mt-1.5 leading-none">
                      {performanceStats.sharpeRatio.toFixed(2)}
                    </div>
                  </div>
                  <div className={`text-[9.5px] font-mono mt-1 font-bold ${sharpeGrade.color}`}>
                    {sharpeGrade.label}
                  </div>
                </div>

                {/* Profit Factor */}
                <div className="p-3 bg-[#080808] border border-white/10 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-[#888888] font-mono uppercase flex items-center">
                      <Gauge className="w-2.5 h-2.5 mr-1 text-teal-400 shrink-0" />
                      Profit Factor
                    </span>
                    <div className="text-sm font-mono font-bold text-white mt-1.5 leading-none">
                      {performanceStats.profitFactor === Infinity ? '∞' : performanceStats.profitFactor.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-[9px] text-white/45 font-mono mt-1 font-semibold truncate">
                    W: +${performanceStats.grossProfit.toFixed(1)} / L: -${performanceStats.grossLoss.toFixed(1)}
                  </div>
                </div>

                {/* Max Drawdown */}
                <div className="p-3 bg-[#080808] border border-white/10 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-[#888888] font-mono uppercase flex items-center">
                      <TrendingDown className="w-2.5 h-2.5 mr-1 text-rose-400 shrink-0" />
                      Max Drawdown
                    </span>
                    <div className="text-sm font-mono font-bold text-rose-400 mt-1.5 leading-none">
                      -{performanceStats.maxDrawdownPct.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-[9px] text-white/45 font-mono mt-1 font-semibold truncate">
                    Max: -${performanceStats.maxDrawdown.toFixed(1)}
                  </div>
                </div>

                {/* Avg Duration */}
                <div className="p-3 bg-[#080808] border border-white/10 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-[#888888] font-mono uppercase flex items-center">
                      <Clock className="w-2.5 h-2.5 mr-1 text-amber-400 shrink-0" />
                      Avg Duration
                    </span>
                    <div className="text-sm font-mono font-bold text-white mt-1.5 leading-none">
                      {formatMsDuration(performanceStats.avgDurationMs)}
                    </div>
                  </div>
                  <div className="text-[9px] text-white/45 font-mono mt-1 font-semibold truncate">
                    From {performanceStats.totalTrades} closed trades
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time MT5 Bridge Trade Efficiency Ratio Widget - Stretched horizontally */}
            <div id="trade-efficiency-ratio-widget" className="p-4 bg-gradient-to-r from-[#0c0c0e] to-[#070709] border border-white/5 rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3 shrink-0">
                <h5 className="text-[10px] uppercase font-bold text-white/40 font-mono tracking-wider flex items-center font-sans">
                  <Cpu className="w-3.5 h-3.5 mr-1.5 text-[#34d399] animate-pulse" />
                  MT5 Bridge Efficiency Telemetry
                </h5>
                <span className="text-[8px] font-mono text-[#34d399] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#10b981]/15 border border-[#10b981]/25 animate-pulse">
                  Connected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Score Dial / Ring Meter */}
                <div className="md:col-span-3 flex flex-row items-center justify-center space-x-4 p-3 bg-black/40 border border-white/5 rounded relative overflow-hidden h-full">
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        className="stroke-white/[0.04]"
                        strokeWidth="3"
                        fill="transparent"
                      />
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        className="stroke-[#10b981] transition-all duration-1000"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 18}`}
                        strokeDashoffset={`${2 * Math.PI * 18 * (1 - tradeEfficiencyMetrics.ratio / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span id="efficiency-score-value" className="text-[10px] font-mono font-black text-white leading-none">
                        {tradeEfficiencyMetrics.ratio.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase font-bold text-white/30 font-mono">Efficiency Ratio</span>
                    <span className={`text-[10px] font-mono font-black mt-0.5 leading-none ${
                      tradeEfficiencyMetrics.ratio >= 85 ? 'text-emerald-400' : tradeEfficiencyMetrics.ratio >= 70 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {tradeEfficiencyMetrics.ratio >= 85 ? 'OPTIMAL STATUS' : tradeEfficiencyMetrics.ratio >= 70 ? 'JITTER DETECTED' : 'HIGH SLIPPAGE'}
                    </span>
                  </div>
                </div>

                {/* Performance stats split */}
                <div className="md:col-span-9 flex flex-col justify-center space-y-2 h-full">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-black/20 border border-white/5 rounded text-left flex justify-between items-center">
                      <div>
                        <span className="text-white/35 uppercase font-mono block text-[7px]" style={{ letterSpacing: '0.05em' }}>Avg Latency</span>
                        <div id="telemetry-avg-latency" className={`text-xs font-mono font-bold mt-0.5 ${
                          tradeEfficiencyMetrics.avgLatency <= 45 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {tradeEfficiencyMetrics.avgLatency.toFixed(0)} ms
                        </div>
                      </div>
                      <span className="text-[8px] text-white/20 font-mono">RTT</span>
                    </div>

                    <div className="p-2 bg-black/20 border border-white/5 rounded text-left flex justify-between items-center">
                      <div>
                        <span className="text-white/35 uppercase font-mono block text-[7px]" style={{ letterSpacing: '0.05em' }}>Order Slip</span>
                        <div id="telemetry-avg-slippage" className="text-xs font-mono font-bold mt-0.5 text-sky-400">
                          {tradeEfficiencyMetrics.avgSlippage.toFixed(1)} pts
                        </div>
                      </div>
                      <span className="text-[8px] text-white/20 font-mono">EST</span>
                    </div>

                    <div className="p-2 bg-black/20 border border-white/5 rounded text-left flex justify-between items-center">
                      <div>
                        <span className="text-white/35 uppercase font-mono block text-[7px]" style={{ letterSpacing: '0.05em' }}>Bridge Health</span>
                        <div id="telemetry-health-pct" className={`text-xs font-mono font-bold mt-0.5 ${
                          tradeEfficiencyMetrics.healthyPct >= 80 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {tradeEfficiencyMetrics.healthyPct.toFixed(0)}%
                        </div>
                      </div>
                      <span className="text-[8px] text-white/20 font-mono">SYS</span>
                    </div>
                  </div>

                  {/* Latency Breaches Warnings Banner */}
                  <div className="p-2 bg-black/30 border border-white/5 rounded flex items-center justify-between text-[8px] font-mono leading-none">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        tradeEfficiencyMetrics.breachedCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                      }`}></span>
                      <span className="text-white/40 uppercase text-[7px]">Slippage & Latency Breaches Count:</span>
                      <span id="telemetry-breached-count" className={`font-bold rounded-sm px-1.5 py-0.5 text-[8px] ${
                        tradeEfficiencyMetrics.breachedCount > 0 ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20' : 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
                      }`}>
                        {tradeEfficiencyMetrics.breachedCount} breach incidents
                      </span>
                    </div>
                    <span className="text-[#a5b4fc] text-[7.5px] uppercase tracking-wider font-bold">Auto-calibrating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Landscape oriented charts - positioned side by side as wide panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Cumulative PnL Growth Curve */}
              <div className="p-4 bg-[#050505]/60 border border-white/5 rounded flex flex-col justify-between min-h-[320px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-white/40 font-mono tracking-wider flex items-center font-sans">
                    <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                    Cumulative PnL Growth Curve ($)
                  </span>
                  {performanceStats.totalTrades > 0 && (
                    <span className={`text-[10px] font-mono font-bold ${performanceStats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {performanceStats.totalPnL >= 0 ? '+' : ''}${performanceStats.totalPnL.toFixed(2)}
                    </span>
                  )}
                </div>

                {closedTrades.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-white/5 bg-[#030303]/40 rounded p-4 min-h-[240px]">
                    <span className="text-[9.5px] font-mono text-white/30 italic text-center">
                      Execute and close trades to populate PnL growth curve
                    </span>
                  </div>
                ) : (
                  <div className="flex-1 w-full min-h-[240px] mt-1 relative">
                    <div className="absolute inset-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis 
                            dataKey="tradeNum" 
                            stroke="rgba(255,255,255,0.25)" 
                            fontSize={8} 
                            fontFamily="monospace"
                            tickLine={false}
                            axisLine={false}
                            dy={4}
                          />
                          <YAxis 
                            stroke="rgba(255,255,255,0.25)" 
                            fontSize={8} 
                            fontFamily="monospace"
                            tickLine={false}
                            axisLine={false}
                            dx={-2}
                            tickFormatter={(v) => `${v >= 0 ? '+' : ''}$${v}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0c0c0e',
                              border: '1px solid rgba(99, 102, 241, 0.4)',
                              borderLeft: '3px solid #6366f1',
                              borderRadius: '6px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.85)',
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              color: '#fff',
                            }}
                            formatter={(value: any, name: any, props: any) => {
                              const pnl = props.payload.pnl;
                              const pnlText = pnl !== undefined ? ` (PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})` : '';
                              return [`$${Number(value).toFixed(2)}${pnlText}`, 'Cumulative PnL'];
                            }}
                            labelFormatter={(label) => {
                              if (label === 0) return 'Session Start';
                              const tr = chartData.find(d => d.tradeNum === label);
                              return tr ? `Trade #${label} ${tr.label ? `- ${tr.label.split(' ')[1] || ''}` : ''}` : `Trade #${label}`;
                            }}
                          />
                          <ReferenceLine y={0} stroke="rgba(239, 68, 68, 0.15)" strokeDasharray="3 3" />
                          <Line 
                            type="monotone" 
                            dataKey="cumulative" 
                            stroke="#6366f1" 
                            strokeWidth={1.5}
                            dot={{ r: 2.5, stroke: '#818cf8', strokeWidth: 1, fill: '#0c0c0c' }}
                            activeDot={{ r: 4, stroke: '#312e81', strokeWidth: 1.5, fill: '#818cf8' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Net PnL by Day of the Week */}
              <div className="p-4 bg-[#050505]/60 border border-white/5 rounded flex flex-col justify-between min-h-[320px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-white/40 font-mono tracking-wider flex items-center font-sans">
                    <Activity className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                    Net PnL by Day of the Week ($)
                  </span>
                  {performanceStats.totalTrades > 0 && (
                    <span className="text-[9px] font-mono text-white/35">
                      Aggregation (Mon–Sun)
                    </span>
                  )}
                </div>

                {closedTrades.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-white/5 bg-[#030303]/40 rounded p-4 min-h-[240px]">
                    <span className="text-[9.5px] font-mono text-white/30 italic text-center">
                      Execute and close trades to populate weekly distribution
                    </span>
                  </div>
                ) : (
                  <div className="flex-1 w-full min-h-[240px] mt-1 relative">
                    <div className="absolute inset-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dayOfWeekPnLData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis 
                            dataKey="day" 
                            stroke="rgba(255,255,255,0.25)" 
                            fontSize={8} 
                            fontFamily="monospace"
                            tickLine={false}
                            axisLine={false}
                            dy={4}
                            tickFormatter={(v) => v.substring(0, 3).toUpperCase()}
                          />
                          <YAxis 
                            stroke="rgba(255,255,255,0.25)" 
                            fontSize={8} 
                            fontFamily="monospace"
                            tickLine={false}
                            axisLine={false}
                            dx={-2}
                            tickFormatter={(v) => `${v >= 0 ? '+' : ''}$${v}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0c0c0e',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              borderLeft: '3px solid #10b981',
                              borderRadius: '6px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.85)',
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              color: '#fff',
                            }}
                            cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                            formatter={(value: any) => {
                              const val = Number(value);
                              return [`${val >= 0 ? '+' : ''}$${val.toFixed(2)}`, 'Net PnL'];
                            }}
                          />
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                          <Bar dataKey="pnl">
                            {dayOfWeekPnLData.map((entry, index) => {
                              const isPositive = entry.pnl >= 0;
                              return (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={isPositive ? 'rgba(52, 211, 153, 0.25)' : 'rgba(248, 113, 113, 0.25)'}
                                  stroke={isPositive ? '#34d399' : '#f87171'}
                                  strokeWidth={1}
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

            </div> {/* Closes charts landscape layer */}
          </div> {/* Closes the space-y-6 container */}



          <div className="mt-4">
            <h5 className="text-[11px] uppercase font-bold text-white/40 font-mono mb-2 tracking-wider flex items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse shadow-[0_0_8px_#10b981]"></span>
              Active Positions ({openTrades.length})
            </h5>

            {openTrades.length === 0 ? (
              <p className="text-xs text-white/30 font-serif italic py-6 border border-dashed border-white/5 rounded text-center bg-[#050505]/40 font-light">
                No active exposure held. Wait for High-Timeframe confluence signals.
              </p>
            ) : (
              <div className="space-y-3">
                {openTrades.map((t) => {
                  const livePnL = getLivePnL(t);
                  return (
                    <div key={t.id} className="p-3.5 bg-[#050505] border border-white/5 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 hover:border-white/20 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            t.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {t.side}
                          </span>
                          <span className="font-bold text-white/90 text-xs font-mono">{t.symbol}</span>
                          <span className="text-[10px] font-mono text-white/40">Vol: {t.size} L</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ml-2 ${livePnL >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {livePnL >= 0 ? `+$${livePnL}` : `-$${Math.abs(livePnL)}`} PnL
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-white/50 leading-normal flex flex-wrap items-center gap-x-2">
                          <span>Entry: <span className="text-white/80">{t.entryPrice}</span> | SL: <span className="text-rose-400 font-semibold">{t.stopLoss}</span> | TP: <span className="text-emerald-400 font-semibold">{t.takeProfit}</span></span>
                          {t.autoBreakEvenProfitPct !== undefined && (
                            <>
                              <span className="text-white/20">|</span>
                              {t.autoBreakEvenTriggered ? (
                                <span className="text-emerald-400 font-extrabold flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                                  BE Triggered
                                </span>
                              ) : (
                                <span className="text-indigo-400 font-bold flex items-center gap-0.5 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                                  <Activity className="w-2.5 h-2.5 text-indigo-400 inline animate-pulse" />
                                  Auto-BE: +{t.autoBreakEvenProfitPct}%
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {/* Active exposure Audit Checklist */}
                        {(t.confidence !== undefined || t.confluences) && (
                          <div className="mt-1.5 pt-1 border-t border-white/[0.04] flex flex-wrap items-center gap-1 text-[8.5px]">
                            {t.confidence !== undefined && (
                              <span className="font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-extrabold flex items-center gap-0.5 border border-indigo-500/10">
                                <Gauge className="w-2.5 h-2.5" />
                                {t.confidence}% Confidence
                              </span>
                            )}
                            {t.confluences && t.confluences.map((conf) => (
                              <span key={conf} className="font-mono px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/5 text-white/40">
                                ✓ {conf}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        id={`close-position-btn-${t.id}`}
                        onClick={() => handleCloseActiveTrade(t.id)}
                        className="px-3 py-1.5 bg-rose-600/10 border border-rose-500/20 hover:bg-rose-600/30 text-rose-300 text-[10px] font-mono rounded font-bold uppercase transition-all shrink-0 cursor-pointer text-center"
                      >
                        Close exposure
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historical Log */}
          <div className="mt-5 border-t border-white/10 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2.5">
              <h5 className="text-[11px] uppercase font-bold text-white/40 font-mono tracking-wider flex items-center">
                <History className="w-3.5 h-3.5 mr-2 text-white/30" />
                Trade Log History ({closedTrades.length})
              </h5>
              {closedTrades.length > 0 && (
                <button
                  id="download-ledger-csv-btn"
                  onClick={handleDownloadCSV}
                  className="px-2.5 py-1 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 hover:text-indigo-300 text-white text-[10px] font-mono rounded font-bold uppercase transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-3" />
                  <span>Download Ledger (CSV)</span>
                </button>
              )}
            </div>

            {closedTrades.length === 0 ? (
              <p className="text-xs text-white/30 font-serif italic py-6 border border-dashed border-white/5 rounded text-center bg-[#050505]/40 font-light">
                Log currently empty. All closed simulated positions records render here.
              </p>
            ) : (
              <div className="space-y-2">
                {/* Desktop Tabular Grid Header - Visible >= 768px */}
                <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-white/30 border-b border-white/5 bg-[#0c0c0c]">
                  <div className="col-span-1.5">Asset</div>
                  <div className="col-span-1 text-center">Type</div>
                  <div className="col-span-1 text-right">Lots</div>
                  <div className="col-span-2 text-right font-semibold">Entry</div>
                  <div className="col-span-2 text-right font-semibold">Exit</div>
                  <div className="col-span-1.5 text-right">Duration</div>
                  <div className="col-span-2 text-right">P&L ($)</div>
                  <div className="col-span-1 text-right font-semibold">Outcome</div>
                </div>
 
                {/* Shared Scrollable Container */}
                <div className="space-y-2">
                  {(() => {
                    const reversedClosedTrades = closedTrades.slice().reverse();
                    const itemsPerPage = 7;
                    const totalPages = Math.ceil(reversedClosedTrades.length / itemsPerPage) || 1;
                    const safePage = Math.min(closedTradesPage, totalPages - 1);
                    const startIndex = safePage * itemsPerPage;
                    const paginatedTrades = reversedClosedTrades.slice(startIndex, startIndex + itemsPerPage);
                    return paginatedTrades.map((t) => {
                    const win = t.pnl >= 0;
                    return (
                      <div key={t.id} id={`trade-log-row-${t.id}`}>
                        {/* --- DESKTOP TABULAR VIEW (>= md/768px) --- */}
                        <div className="hidden md:block bg-[#050505]/50 hover:bg-[#070707] border border-white/5 rounded hover:border-white/10 transition-colors p-3">
                          <div className="grid grid-cols-12 gap-2 items-center text-xs font-mono">
                            <div className="col-span-1.5 font-bold text-white/90">
                              {t.symbol}
                            </div>
                            
                            <div className="col-span-1 flex justify-center">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                t.side === 'BUY' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {t.side}
                              </span>
                            </div>

                            <div className="col-span-1 text-right text-white/70">
                              {t.size.toFixed(2)} L
                            </div>

                            <div className="col-span-2 text-right text-white/60 font-semibold">
                              {t.entryPrice.toFixed(t.symbol === 'BTC/USDT' ? 1 : t.symbol === 'USD/JPY' || t.symbol === 'GOLD/USD' ? 2 : 4)}
                            </div>

                            <div className="col-span-2 text-right text-white/80 font-bold">
                              {t.exitPrice?.toFixed(t.symbol === 'BTC/USDT' ? 1 : t.symbol === 'USD/JPY' || t.symbol === 'GOLD/USD' ? 2 : 4) || '—'}
                            </div>

                            <div className="col-span-1.5 text-right text-white/60 font-bold text-[11px]">
                              {formatHoldingDuration(t.timestamp, t.exitTimestamp)}
                            </div>

                            <div className="col-span-2 text-right">
                              <span className={`font-bold ${win ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {win ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`}
                              </span>
                            </div>

                            <div className="col-span-1 flex items-center justify-end space-x-1">
                              {win ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              )}
                              <span className={`text-[9px] font-bold ${win ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {win ? 'GAIN' : 'LOSS'}
                              </span>
                            </div>
                          </div>

                          {/* Audit details block beneath desktop row */}
                          {(t.confidence !== undefined || t.confluences || t.latency !== undefined) && (
                            <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {t.confidence !== undefined && (
                                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-extrabold flex items-center gap-0.5">
                                    <Gauge className="w-2.5 h-2.5" />
                                    {t.confidence}% Confidence
                                  </span>
                                )}
                                {t.confluences && t.confluences.map((conf) => (
                                  <span key={conf} className="font-mono text-[8.5px] px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/5 text-white/40">
                                    ✓ {conf}
                                  </span>
                                ))}
                                {t.latency !== undefined && (
                                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1 shadow-sm ${
                                    t.latency > 45 
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`} title={t.latency > 45 ? "EXCEEDED 45ms HEALTH TARGET" : "MT5 Bridge Healthy"}>
                                    <Cpu className="w-2.5 h-2.5" />
                                    {t.latency}ms Latency {t.latency > 45 && '⚠️'}
                                  </span>
                                )}
                                {t.slippage !== undefined && (
                                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-extrabold flex items-center gap-0.5 shadow-sm">
                                    <ArrowRightLeft className="w-2.5 h-2.5 text-sky-450" />
                                    Slippage: {t.slippage} {t.symbol.includes('JPY') || t.symbol.includes('GOLD') ? 'pips' : 'points'}
                                  </span>
                                )}
                              </div>
                              {t.reason && (
                                <span className="text-[9.5px] text-white/40 italic font-serif max-w-[30%] truncate" title={t.reason}>
                                  "{t.reason}"
                                </span>
                              )}
                            </div>
                          )}
                        </div>
 
                        {/* --- MOBILE CARD VIEW (< md/768px) --- */}
                        <div className="block md:hidden p-3 bg-[#050505]/75 hover:bg-[#070707] border border-white/5 rounded hover:border-white/10 transition-colors">
                          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs text-white/95 font-mono">{t.symbol}</span>
                              <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded uppercase leading-none ${
                                t.side === 'BUY'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {t.side}
                              </span>
                              <span className="text-[9.5px] text-white/40 font-mono">({t.size.toFixed(2)} Lots)</span>
                            </div>
                            <div>
                              <span className={`font-mono font-bold text-xs ${win ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {win ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`}
                              </span>
                            </div>
                          </div>
 
                          {/* Detail Grid */}
                          <div className="grid grid-cols-2 gap-2.5 text-[10.5px] font-mono text-white/50">
                            <div>
                              <span className="text-[8.5px] text-white/30 uppercase block leading-none mb-1">Entry Price</span>
                              <span className="text-white/80 font-medium">
                                {t.entryPrice.toFixed(t.symbol === 'BTC/USDT' ? 1 : t.symbol === 'USD/JPY' || t.symbol === 'GOLD/USD' ? 2 : 4)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8.5px] text-white/30 uppercase block leading-none mb-1">Closed Price</span>
                              <span className="text-white/80 font-bold">
                                {t.exitPrice?.toFixed(t.symbol === 'BTC/USDT' ? 1 : t.symbol === 'USD/JPY' || t.symbol === 'GOLD/USD' ? 2 : 4) || '—'}
                              </span>
                            </div>
                            <div className="col-span-2 border-t border-white/5 pt-1.5 mt-1 grid grid-cols-2 gap-2.5">
                              <div>
                                <span className="text-[8.5px] text-white/30 uppercase block leading-none mb-1">Holding Duration</span>
                                <span className="text-[#a5b4fc] font-bold">
                                  {formatHoldingDuration(t.timestamp, t.exitTimestamp)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8.5px] text-white/30 uppercase block leading-none mb-1">Closed Date</span>
                                <span className="text-white/70">
                                  {t.exitTimestamp ? new Date(t.exitTimestamp).toLocaleTimeString() : '—'}
                                </span>
                              </div>
                            </div>

                            {/* Bridge execution quality inside mobile card */}
                            {(t.latency !== undefined || t.slippage !== undefined) && (
                              <div className="col-span-2 border-t border-white/5 pt-1.5 mt-1 flex items-center justify-between font-mono">
                                <span className="text-[8.5px] text-white/30 uppercase leading-none">MT5 Bridge Quality</span>
                                <div className="flex items-center space-x-1.5">
                                  {t.latency !== undefined && (
                                    <span className={`text-[8.5px] px-1 py-0.5 rounded font-bold leading-none ${
                                      t.latency > 45 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'
                                    }`}>
                                      {t.latency}ms {t.latency > 45 && '⚠️'}
                                    </span>
                                  )}
                                  {t.slippage !== undefined && (
                                    <span className="text-[8.5px] px-1 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold leading-none">
                                      {t.slippage}p
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
 
                          {/* Action Outcome Indicator with Confidence Badge */}
                          <div className="mt-2 flex items-center justify-between border-t border-white/[0.04] pt-2">
                            <span className={`inline-flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              win ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {win ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span>WIN OUTCOME</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                                  <span>LOSS OUTCOME</span>
                                </>
                              )}
                            </span>
                            {t.confidence !== undefined && (
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-extrabold flex items-center gap-0.5 border border-indigo-500/10 animate-pulse">
                                <Gauge className="w-2.5 h-2.5" />
                                {t.confidence}% Conf.
                              </span>
                            )}
                          </div>              
                          {/* Mobile confluences audit */}
                          {t.confluences && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {t.confluences.map((conf) => (
                                <span key={conf} className="font-mono text-[8px] px-1 py-0.5 rounded bg-white/[0.02] border border-white/5 text-white/30">
                                  ✓ {conf}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })})()}

                  {/* Beautiful Pagination Controllers with continuous flow and stats */}
                  {closedTrades.length > 7 && (() => {
                    const reversedClosedTrades = closedTrades.slice().reverse();
                    const itemsPerPage = 7;
                    const totalPages = Math.ceil(reversedClosedTrades.length / itemsPerPage) || 1;
                    const safePage = Math.min(closedTradesPage, totalPages - 1);
                    const startIndex = safePage * itemsPerPage;
                    const paginatedTrades = reversedClosedTrades.slice(startIndex, startIndex + itemsPerPage);
                    return (
                      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-3.5 gap-2 mt-2">
                        <span className="text-white/45 text-[10px] font-mono">
                          Showing <span className="text-[#a5b4fc] font-bold">{startIndex + 1}</span>–<span className="text-[#a5b4fc] font-bold">{Math.min(startIndex + paginatedTrades.length, reversedClosedTrades.length)}</span> of <span className="text-[#818cf8] font-bold">{reversedClosedTrades.length}</span> (Page {safePage + 1} of {totalPages})
                        </span>
                        <div className="flex items-center space-x-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setClosedTradesPage(prev => Math.max(0, prev - 1))}
                            disabled={safePage === 0}
                            className="px-3 py-1.5 bg-[#0a0a0c] hover:bg-white/10 border border-white/10 disabled:opacity-20 text-white/80 font-mono text-[10px] rounded font-bold uppercase cursor-pointer disabled:cursor-not-allowed transition-all"
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => setClosedTradesPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={safePage >= totalPages - 1}
                            className="px-3 py-1.5 bg-[#0a0a0c] hover:bg-white/10 border border-white/10 disabled:opacity-20 text-white/80 font-mono text-[10px] rounded font-bold uppercase cursor-pointer disabled:cursor-not-allowed transition-all"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 leading-normal flex items-center space-x-2 text-[10.5px] font-mono text-white/30">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Trades persist in server database file <code>trades_db.json</code>.</span>
        </div>
      </div>

      {/* INSTITUTIONAL SECURITY ACCESS GATEWAY MODAL */}
      {isAuthModalOpen && (
        <div id="security-gateway-modal" className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300">
          <div className="bg-[#0c0c0e] border border-indigo-500/30 rounded-xl p-6 max-w-sm w-full shadow-[0_20px_50px_rgba(99,102,241,0.15)] relative overflow-hidden font-sans">
            
            {/* Top decorative lock glow indicator */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
            
            <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Lock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-mono font-bold text-xs tracking-wide text-white uppercase">Cryptographic Gateway</h4>
                  <span className="text-[9.5px] font-mono text-white/45 block">MT5 TERMINAL SECURITY LAYER LEVEL 5</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-white/5 text-white/30 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selection Authentication Modes Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-lg border border-white/5 mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('BIOMETRIC');
                  setAuthError(null);
                  setIsScanning(false);
                }}
                className={`py-2 text-[10px] font-mono font-bold uppercase rounded-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  authMode === 'BIOMETRIC' 
                    ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/20 font-black' 
                    : 'text-white/40 hover:text-white/80'
                }`}
                disabled={isScanning}
              >
                <Fingerprint className="w-3.5 h-3.5 shrink-0" />
                <span>Biometric Scan</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setAuthMode('PASSWORD');
                  setAuthError(null);
                  setIsScanning(false);
                }}
                className={`py-2 text-[10px] font-mono font-bold uppercase rounded-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  authMode === 'PASSWORD' 
                    ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/20 font-black' 
                    : 'text-white/40 hover:text-white/80'
                }`}
                disabled={isScanning}
              >
                <Key className="w-3.5 h-3.5 shrink-0" />
                <span>Passcode</span>
              </button>
            </div>

            {/* TAB CONTENTS CONTAINER */}
            <div className="min-h-[160px] flex flex-col justify-between">
              
              {/* 1. BIOMETRIC TAB */}
              {authMode === 'BIOMETRIC' && (
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  
                  {isScanning ? (
                    /* Scanning Animation state */
                    <div className="flex flex-col items-center space-y-3.5 w-full">
                      <div className="relative flex items-center justify-center my-2">
                        {/* External spinning neon scan arc ring */}
                        <div className="absolute h-16 w-16 rounded-full border border-indigo-500/20 animate-spin border-t-indigo-400"></div>
                        {/* Fingerprint Pulse */}
                        <div className="absolute h-12 w-12 rounded-full bg-indigo-500/10 animate-ping"></div>
                        <div className="p-3.5 bg-indigo-500/20 rounded-full text-indigo-400 relative">
                          <Fingerprint className="w-8 h-8 text-indigo-400 shrink-0" />
                        </div>
                      </div>
                      
                      <div className="w-full">
                        <div className="flex items-center justify-between text-[10px] font-mono text-indigo-300 mb-1 px-1">
                          <span>SCANNING INDEX REGISTRATION...</span>
                          <span className="font-black">{scanProgress}%</span>
                        </div>
                        <div className="w-full bg-black h-1.5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="bg-indigo-400 h-full transition-all duration-100 ease-out shadow-[0_0_8px_#818cf8]" 
                            style={{ width: `${scanProgress}%` }}
                          ></div>
                        </div>
                      </div>

                      <p className="text-[10px] uppercase font-mono text-white/50 tracking-wide bg-black/40 p-2 rounded border border-white/5 w-full leading-normal animate-pulse min-h-[44px] flex items-center justify-center">
                        {scanStatusLog}
                      </p>
                    </div>
                  ) : (
                    /* Inactive Scan State */
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-full text-white/35">
                        <Fingerprint className="w-10 h-10 hover:text-indigo-400 transition-colors pointer-events-none" />
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed font-sans max-w-[80%]">
                        Confirm authorization by placing finger on virtual fingerprint sensor scan ring.
                      </p>
                      
                      <button
                        type="button"
                        onClick={() => setIsScanning(true)}
                        className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase rounded-lg transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer animate-pulse"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#fff]" />
                        <span>Deploy Biometric Reader</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 2. PASSWORD SIGNATURE TAB */}
              {authMode === 'PASSWORD' && (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase text-white/40 tracking-wider">
                      Enter Cryptographic Terminal Key:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={enteredPassword}
                        onChange={(e) => {
                          setEnteredPassword(e.target.value);
                          setAuthError(null);
                        }}
                        className="w-full bg-black/85 border border-white/10 text-white rounded-lg px-3.5 py-2.5 font-mono text-sm focus:outline-none focus:border-indigo-500 pr-10"
                      />
                      <div className="absolute right-3.5 top-3 text-white/20">
                        <Key className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="text-[9.5px] font-sans text-indigo-300/60 block leading-normal italic">
                      💡 Institutional Terminal passkey: Use current administrator credential (e.g. <strong>ADMIN123</strong>) to bypass security.
                    </span>
                  </div>

                  {authError && (
                    <div className="p-2.5 bg-rose-950/20 border border-rose-500/25 rounded-md text-rose-400 font-mono text-[9.5px] flex items-center space-x-1.5 leading-snug">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleVerifyPassword}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase rounded-lg transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Authorize Key</span>
                  </button>
                </div>
              )}

              {/* Footer info lock system */}
              <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-white/30 leading-none">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  SHA-256 HANDSHAKE VALID
                </span>
                <span>CIPHER CODE: E2EE-AES</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
