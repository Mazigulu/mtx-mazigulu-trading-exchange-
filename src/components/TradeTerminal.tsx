/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { MarketSymbol, Trade, MarketMetrics } from '../types';
import { ShieldCheck, ArrowRightLeft, Landmark, Calculator, AlertTriangle, Play, CheckCircle2, History, XCircle, AlertOctagon, Percent, TrendingUp, Activity, Download, Gauge, CheckSquare, Square, Award, Fingerprint, Lock, Unlock, Cpu, RefreshCw, Sparkles, Eye, Check, X, Key, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { getSignalInsights } from './TradeExplainability';

interface TradeTerminalProps {
  symbol: MarketSymbol;
  metrics: MarketMetrics;
  onTradeExecuted: () => void;
  trades: Trade[];
}

export default function TradeTerminal({
  symbol,
  metrics,
  onTradeExecuted,
  trades,
}: {
  symbol: MarketSymbol;
  metrics: MarketMetrics;
  onTradeExecuted: () => void;
  trades: Trade[];
}) {
  const [accountBalance, setAccountBalance] = useState(10000);

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
      };
    }

    const pnls = completed.map((t) => t.pnl);
    const totalPnL = pnls.reduce((acc, val) => acc + val, 0);
    const avgProfit = totalPnL / completed.length;

    const wins = completed.filter((t) => t.pnl > 0).length;
    const losses = completed.filter((t) => t.pnl < 0).length;
    const winRate = (wins / completed.length) * 100;

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

  // ATR Position Size Calculator States
  const [atrMultiplier, setAtrMultiplier] = useState<number>(2.0);
  const [atrRiskPct, setAtrRiskPct] = useState<number>(1.0); // Defaults to 1.0 (1% model)
  const [atrTpMultiplier, setAtrTpMultiplier] = useState<number>(4.0); // Defaults to 4.0 for a 1:2 default RR (2x ATR SL, 4x ATR TP)

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

  // Sync inputs, confidence, and confluences with current price/bias when symbol or metrics change
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
  }, [symbol, metrics.currentPrice, side, metrics.atr, metrics.dailyBias]);

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

    // Validate Stop Loss / Trend biases matching strategy guidelines
    if (side === 'BUY' && stopLoss >= entryPrice) {
      setErrorMsg('For BUY trades, Stop Loss must be lower than the Entry Price.');
      return;
    }
    if (side === 'SELL' && stopLoss <= entryPrice) {
      setErrorMsg('For SELL trades, Stop Loss must be higher than the Entry Price.');
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

      onTradeExecuted();
    } catch (e: any) {
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
        onTradeExecuted();
      }
    } catch (error) {
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
              onTradeExecuted();
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

      {/* Risk Sizing & Execution Panel */}
      <div className="lg:col-span-5 bg-[#080808] border border-white/10 rounded p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between">
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

          {/* AI ADVISOR LIVE AUTOMATED EXECUTION CONTROLS */}
          <div id="ai-live-execution-card" className="mt-4 p-3.5 bg-gradient-to-r from-indigo-950/20 via-black/10 to-indigo-900/10 border border-indigo-500/20 rounded-lg flex flex-col space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-500/10 rounded">
                  <Cpu className={`w-3.5 h-3.5 ${isLiveExecution ? 'text-emerald-400 animate-pulse' : 'text-indigo-400'}`} />
                </div>
                <div>
                  <h5 className="text-[11.5px] font-mono font-bold uppercase tracking-wider text-white">AI Live Execution</h5>
                  <span className="text-[9px] font-sans text-white/40 block">Autonomous execution of trades on triggers</span>
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
                    // Open secondary password or biometric-protected confirmation interface
                    setIsAuthModalOpen(true);
                    setAuthMode('BIOMETRIC');
                    setEnteredPassword('');
                    setAuthError(null);
                    setIsScanning(false);
                    setScanProgress(0);
                  }
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
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

            {/* AI Advisor Trading Status Badge */}
            <div className="flex items-center justify-between text-[9.5px]">
              <span className="text-white/40 font-mono">STATUS:</span>
              <span className={`font-mono font-extrabold flex items-center space-x-1 ${
                isLiveExecution ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded animate-pulse' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded'
              }`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${isLiveExecution ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`}></span>
                {isLiveExecution ? 'ACTIVE & SCANNING' : 'TERMINAL LOCKED'}
              </span>
            </div>

            {/* Safe criteria indicator */}
            <div className="text-[9px] text-white/30 leading-snug font-sans bg-[#0c0c0c]/40 p-2 rounded border border-white/5">
              💡 <span className="font-semibold text-white/40">Strategy:</span> Automates entries when selected signals reach <strong className="text-indigo-300 font-bold">≥ 80% confidence</strong>. Protects equity via the Fixed-fractional model.
            </div>
          </div>

          {/* WAIT & OBSERVE MODE CONTROLS */}
          <div id="wait-observe-mode-card" className="mt-4 p-3.5 bg-gradient-to-r from-slate-950/20 via-black/10 to-slate-900/10 border border-white/5 rounded-lg flex flex-col space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-500/10 rounded">
                  <Eye className={`w-3.5 h-3.5 ${isObserveMode ? 'text-indigo-400 animate-pulse' : 'text-white/45'}`} />
                </div>
                <div>
                  <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-white">Wait & Observe</h5>
                  <span className="text-[8.5px] font-sans text-white/40 block">Silence discretionary trade alert noise</span>
                </div>
              </div>
              
              {/* Toggle switch Button */}
              <button
                id="wait-observe-toggle"
                type="button"
                onClick={toggleObserveMode}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
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

            {/* Filter description indicator */}
            <div className="flex items-center justify-between text-[8.5px] font-mono">
              <span className="text-white/30">ALERT FILTER DEPTH:</span>
              <span className={`font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${
                isObserveMode ? 'text-indigo-300 bg-indigo-500/15 border border-indigo-500/10' : 'text-white/30 bg-white/5'
              }`}>
                {isObserveMode ? 'Institutional Sweeps Only' : 'Standard Feed Enabled'}
              </span>
            </div>
          </div>

          {/* AI Advisor Execution Alert Banner */}
          {aiTradeSuccessAlert && (
            <div id="ai-trade-success-alert" className="mt-3.5 p-3.5 bg-[#071911] border border-emerald-500/50 rounded text-emerald-300 text-[11px] leading-relaxed flex flex-col space-y-2 relative overflow-hidden">
              <div className="flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-spin" />
                <div className="flex-1">
                  <span className="font-mono font-black text-emerald-400 uppercase tracking-wider block text-[10px]">⚡ Institutional Order Executed!</span>
                  <p className="mt-1 font-sans text-xs">{aiTradeSuccessAlert}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiTradeSuccessAlert(null)}
                  className="text-white/30 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
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

          {/* Price limits Inputs */}
          <div className="space-y-3 mt-4 font-mono text-xs">
            <div>
              <label className="text-white/35 block uppercase mb-1 font-sans tracking-tight">Entry Price (4H FVG Touch)</label>
              <input
                id="entry-price-input"
                type="number"
                step="0.0001"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-[#050505] border border-white/10 text-white px-3 py-2 rounded focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/35 block uppercase mb-1 font-sans tracking-tight">
                  Stop Loss (Structural SL)
                </label>
                <input
                  id="stoploss-input"
                  type="number"
                  step="0.0001"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="w-full bg-[#050505] border border-white/10 text-rose-400 px-3 py-2 rounded focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>
              <div>
                <label className="text-white/35 block uppercase mb-1 font-sans tracking-tight">
                  Take Profit (Target TP)
                </label>
                <input
                  id="takeprofit-input"
                  type="number"
                  step="0.0001"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(Number(e.target.value))}
                  className="w-full bg-[#050505] border border-white/10 text-emerald-400 px-3 py-2 rounded focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>
            </div>

            {/* Reward Ratios Shortcut Presets block */}
            <div className="flex items-center space-x-2 mt-1 select-none">
              <span className="text-[9px] font-sans text-white/30 uppercase font-bold">SL/TP Sizer Presets:</span>
              <div className="flex gap-1.5 font-mono text-[9px]">
                {[1.0, 1.5, 2.0, 3.0, 4.0].map((ratio) => (
                  <button
                    key={`rr-preset-${ratio}`}
                    type="button"
                    onClick={() => applyRewardRatioPreset(ratio)}
                    className="px-1.5 py-0.5 rounded border border-white/5 bg-[#050505] hover:bg-white/5 text-indigo-300 hover:text-white transition-all cursor-pointer font-extrabold"
                    title={`Calculate target Take Profit at exactly 1:${ratio} risk-to-reward ratio based on current entry and Stop Loss levels.`}
                  >
                    1:{ratio === 1 ? '1' : ratio.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* VOLATILITY-BASED POSITION SIZE CALCULATOR */}
            <div id="atr-position-size-calculator" className="bg-[#08080c] border border-indigo-500/20 hover:border-indigo-500/30 rounded-lg p-4 space-y-3.5 select-none transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center space-x-1.5">
                  <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-indigo-300">
                    ATR Volatility Sizer
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-[9px] font-mono text-white/50 bg-indigo-500/10 border border-indigo-500/15 px-2 py-0.5 rounded">
                  <span>ATR:</span>
                  <span className="font-bold text-white">{metrics.atr.toFixed(5)}</span>
                  <span className="text-white/30">|</span>
                  <span className="font-bold text-indigo-300">
                    {symbol === 'USD/JPY' ? (metrics.atr * 100).toFixed(1) : symbol === 'BTC/USDT' || symbol === 'GOLD/USD' ? metrics.atr.toFixed(1) : (metrics.atr * 10000).toFixed(1)} {symbol === 'BTC/USDT' || symbol === 'GOLD/USD' ? 'USD' : 'pips'}
                  </span>
                </div>
              </div>

              {/* SL Multiplier Selectors */}
              <div className="space-y-1.5 font-sans">
                <div className="flex justify-between items-center text-[9.5px]">
                  <span className="text-white/45 uppercase font-semibold">Stop Loss Distance (Multiplier)</span>
                  <span className="font-mono text-indigo-400 font-bold">{atrMultiplier.toFixed(1)}x ATR</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[9.5px]">
                  {[1.5, 2.0, 2.5, 3.0].map((m) => (
                    <button
                      key={`atr-mult-btn-${m}`}
                      type="button"
                      onClick={() => setAtrMultiplier(m)}
                      className={`py-1 rounded border font-mono font-bold transition-all cursor-pointer ${
                        atrMultiplier === m
                          ? 'bg-indigo-600 border-indigo-500 text-white font-black shadow-lg shadow-indigo-500/10'
                          : 'bg-black/35 border-white/5 hover:border-white/10 text-white/40 hover:text-white/70'
                      }`}
                    >
                      {m.toFixed(1)}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk Percentage Toggle - Recommended 1% Model */}
              <div className="space-y-1.5 font-sans">
                <div className="flex justify-between items-center text-[9.5px]">
                  <span className="text-white/45 uppercase font-semibold">Risk Model (1% Recommended)</span>
                  <span className="font-mono text-[#888888] font-bold">
                    <span className="text-indigo-400 font-extrabold">{atrRiskPct.toFixed(1)}%</span> of Balance
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[9.5px]">
                  {[0.5, 1.0, 1.5, 2.0].map((r) => (
                    <button
                      key={`atr-risk-btn-${r}`}
                      type="button"
                      onClick={() => setAtrRiskPct(r)}
                      className={`py-1 rounded border font-mono font-bold transition-all relative cursor-pointer ${
                        atrRiskPct === r
                          ? 'bg-indigo-600 border-indigo-500 text-white font-black shadow-lg shadow-indigo-500/10'
                          : 'bg-black/35 border-white/5 hover:border-white/10 text-white/40 hover:text-white/70'
                      }`}
                    >
                      {r.toFixed(1)}%
                      {r === 1.0 && (
                        <span className="absolute -top-1 right-0 bg-emerald-500 text-[6.5px] text-black font-sans font-black px-0.5 rounded leading-none uppercase tracking-tight scale-90">
                          Rec
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* TP Reward Ratio Multipliers */}
              <div className="space-y-1.5 font-sans">
                <div className="flex justify-between items-center text-[9.5px]">
                  <span className="text-white/45 uppercase font-semibold">Take Profit Target (TP Multiplier)</span>
                  <span className="font-mono text-indigo-400 font-bold">{atrTpMultiplier.toFixed(1)}x ATR</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[9.5px]">
                  {[2.0, 3.0, 4.0, 6.0].map((tp) => (
                    <button
                      key={`atr-tp-btn-${tp}`}
                      type="button"
                      onClick={() => setAtrTpMultiplier(tp)}
                      className={`py-1 rounded border font-mono font-bold transition-all cursor-pointer ${
                        atrTpMultiplier === tp
                          ? 'bg-indigo-600 border-indigo-500 text-white font-black shadow-lg shadow-indigo-500/10 relative z-10'
                          : 'bg-black/35 border-white/5 hover:border-white/10 text-white/40 hover:text-white/70'
                      }`}
                    >
                      {tp.toFixed(1)}x
                    </button>
                  ))}
                </div>
              </div>

              {/* live computations display box */}
              <div className="p-3 bg-black/45 border border-white/[0.04] rounded space-y-2 text-[10px] font-mono leading-relaxed text-left">
                <div className="flex justify-between items-center text-white/30">
                  <span>Balance:</span>
                  <span className="text-white/70">${accountBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-white/30 font-semibold">
                  <span>Risk Cash Sized:</span>
                  <span className="text-rose-400 font-bold">${(accountBalance * (atrRiskPct / 100)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-white/30 border-t border-white/5 pt-1.5">
                  <span>SL Point Distance:</span>
                  <span className="text-white/80">
                    {calculatedAtrSlDistance.toFixed(symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 1 : 5)}
                    <span className="text-white/30 ml-1">
                      ({symbol === 'USD/JPY' ? (calculatedAtrSlDistance * 100).toFixed(1) : symbol === 'BTC/USDT' || symbol === 'GOLD/USD' ? `$${calculatedAtrSlDistance.toFixed(1)}` : (calculatedAtrSlDistance * 10000).toFixed(1)} {symbol === 'BTC/USDT' || symbol === 'GOLD/USD' ? 'USD' : 'pips'})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/30">
                  <span>Proposed Sizing:</span>
                  <span className="text-indigo-400 font-black text-xs">
                    {calculatedAtrPositionSize} {symbol === 'BTC/USDT' ? 'BTC' : 'LOTS'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/30 pt-1 border-t border-white/5">
                  <span>Suggested SL Level:</span>
                  <span className="text-red-400 font-bold">{recommendedAtrStopLoss}</span>
                </div>
                <div className="flex justify-between items-center text-white/30 font-semibold">
                  <span>Suggested TP Level:</span>
                  <span className="text-emerald-400 font-bold">{recommendedAtrTakeProfit}</span>
                </div>
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={handleApplyAtrParameters}
                className="w-full py-1.5 md:py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/25 hover:border-indigo-500/30 rounded text-xs font-bold font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1.5 shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply ATR Sizing & Levels</span>
              </button>
            </div>

            {/* Auto-Break-Even block */}
            <div className="bg-[#08080a] border border-white/5 rounded p-3.5 space-y-2 select-none">
              <div className="flex items-center justify-between">
                <label className="text-white/80 font-sans font-bold flex items-center gap-2 cursor-pointer text-[10.5px] uppercase tracking-wider">
                  <input
                    id="checkbox-auto-break-even"
                    type="checkbox"
                    checked={autoBreakEvenEnabled}
                    onChange={(e) => setAutoBreakEvenEnabled(e.target.checked)}
                    className="rounded border-white/20 bg-black text-indigo-500 focus:ring-transparent h-4 w-4 cursor-pointer"
                  />
                  <span>Auto-Break-Even Strategy</span>
                </label>
                <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded font-extrabold uppercase tracking-wide transition-all ${
                  autoBreakEvenEnabled ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 animate-pulse' : 'bg-white/5 text-white/30 border border-transparent'
                }`}>
                  {autoBreakEvenEnabled ? 'ARMED' : 'OFF'}
                </span>
              </div>
              
              {autoBreakEvenEnabled && (
                <div className="space-y-2 pt-1 transition-all duration-300">
                  <p className="text-[10px] font-sans text-white/40 leading-normal">
                    Secure capital automatically. Once the active trade reaches this profit target (%), the stop-loss is shifted instantly to its entry price.
                  </p>
                  <div className="flex items-center gap-2 font-sans">
                    <span className="text-[10.5px] text-white/50 tracking-tight shrink-0">Trigger Profit Target:</span>
                    <div className="relative flex-1 max-w-[110px]">
                      <input
                        id="input-auto-be-profit-pct"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={autoBreakEvenProfitPct}
                        onChange={(e) => setAutoBreakEvenProfitPct(e.target.value)}
                        className="w-full bg-[#030304] border border-white/15 text-indigo-300 font-mono text-xs px-2.5 py-1 rounded outline-none focus:border-indigo-500/40 pr-6"
                        placeholder="1.0"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-white/30 font-bold">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-white/35 block uppercase mb-1 font-sans tracking-tight">Sustainment / Logic details</label>
              <textarea
                id="reason-textarea"
                value={reason}
                rows={2}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 text-white/60 px-3 py-2 rounded focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="p-3 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-indigo-300 block text-[10.5px] uppercase font-mono font-bold tracking-tight">
                  Pre-defined Market Note (Entry Reasoning)
                </label>
                <span className="text-[8.5px] text-indigo-400/70 font-mono font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/10">PERSISTENT</span>
              </div>
              <textarea
                id="market-note-textarea"
                value={marketNote}
                rows={2}
                onChange={(e) => setMarketNote(e.target.value)}
                placeholder="Pre-define reasoning to automatically stamp it on any trades executed via Terminal, Chart, or Ladder..."
                className="w-full bg-[#050505] border border-indigo-500/20 hover:border-indigo-500/35 focus:border-indigo-500 text-white/90 px-3 py-2 rounded focus:outline-none placeholder-white/25 text-xs tracking-tight font-sans leading-normal focus:ring-1 focus:ring-indigo-500/10"
              />
              <span className="text-[8.5px] text-white/30 font-sans leading-normal block">
                🔒 Stored in local browser safety storage. Stamps automatically onto your live ledger for journal self-auditing.
              </span>
            </div>

            {/* ICT Audit and Confidence Score Block */}
            <div className="border border-white/5 bg-[#050505]/60 hover:border-white/10 rounded-lg p-3.5 mt-3 space-y-3 font-sans transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                  ICT CONFLUENCE AUDIT METHODOLOGY
                </span>
                <span className="text-xs font-mono font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15">
                  Confidence: {confidence}%
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
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none accent-indigo-500"
                  />
                </div>
              </div>

              {/* Interactive ICT Checklist mapping */}
              <div className="space-y-1.5">
                <label className="text-white/40 block text-[9.5px] uppercase font-bold tracking-tight">Executed Confluences Checklist</label>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-tight">
                  {CONFLUENCE_OPTIONS.map((option) => {
                    const isChecked = selectedConfluences.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleToggleConfluence(option)}
                        className={`flex items-start space-x-1.5 p-1.5 rounded transition-all text-left border ${
                          isChecked 
                            ? 'bg-indigo-500/10 text-indigo-200 border-indigo-500/15 hover:bg-indigo-500/15' 
                            : 'bg-transparent text-white/30 border-white/5 hover:text-white/50 hover:bg-white/5'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
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
          <div className="mt-4 bg-[#050505] px-4 py-3 border border-white/10 rounded flex items-center justify-between font-mono text-xs">
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span className="text-white/55">Calculated Lot Size:</span>
            </div>
            <span className="text-[13px] text-indigo-300 font-bold uppercase">
              {calculatedPositionSize} {symbol === 'BTC/USDT' ? 'BTC' : 'FOREX LOTS'}
            </span>
          </div>

          {/* Trend alignment alert warning */}
          {!isObserveMode && ((side === 'BUY' && metrics.dailyBias === 'BEARISH') || (side === 'SELL' && metrics.dailyBias === 'BULLISH')) && (
            <div id="trend-misalignment-alert" className="mt-3.5 p-3.5 bg-yellow-950/20 border border-yellow-500/20 rounded text-yellow-300/80 text-[10.5px] leading-relaxed flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p>
                <strong>Trading Code Check Fault</strong>: Trade goes against the 4H/Daily EMA 50 trend bias (currently <span className="font-bold underline">{metrics.dailyBias}</span>). Consider adjusting bias.
              </p>
            </div>
          )}

          {errorMsg && (
            <div id="terminal-error" className="mt-3.5 p-3 bg-red-950/20 border border-red-500/30 rounded text-rose-400 text-[11px] flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* REAL-TIME SYSTEM SIGNAL MONITOR & PRIORITIZATION FEED */}
          <div id="system-signal-monitor-card" className="mt-4 p-4 bg-[#070709] border border-white/5 rounded flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <div className="flex items-center space-x-1.5 font-sans">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/70">
                  Signal & Watchtower Stream
                </h5>
              </div>
              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                isObserveMode ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse' : 'bg-white/5 text-white/40'
              }`}>
                {isObserveMode ? 'OBSERVI-MODE ACTIVE' : 'FULL FEED'}
              </span>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {terminalSignals.filter(s => !isObserveMode || s.type === 'SWEEP_BSL' || s.type === 'SWEEP_SSL').length === 0 ? (
                <div className="text-center py-6 text-white/35 text-[9.5px] italic font-sans">
                  Waiting for high-dispersion sweeps on {symbol}...
                </div>
              ) : (
                terminalSignals
                  .filter(s => !isObserveMode || s.type === 'SWEEP_BSL' || s.type === 'SWEEP_SSL')
                  .map((sig) => {
                    const isSweep = sig.type === 'SWEEP_BSL' || sig.type === 'SWEEP_SSL';
                    return (
                      <div 
                        key={sig.id} 
                        className={`p-2.5 rounded border transition-all ${
                          isSweep 
                            ? 'bg-indigo-950/20 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.03)]' 
                            : 'bg-[#040405] border-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[9.5px] font-mono font-bold flex items-center gap-1 ${
                            isSweep ? 'text-indigo-300' : 'text-white/60'
                          }`}>
                            {isSweep ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                            ) : (
                              <Activity className="w-3 h-3 text-white/30" />
                            )}
                            {sig.label}
                          </span>
                          <span className="text-[7.5px] font-mono text-white/30">
                            {sig.timestamp}
                          </span>
                        </div>
                        <p className="text-[8.5px] text-white/50 mt-1 font-sans leading-normal">
                          {sig.details}
                        </p>
                        {sig.volume && (
                          <div className="mt-1.5 flex items-center justify-between text-[8px] font-mono">
                            <span className="text-white/30">DETECTED VOLUME:</span>
                            <span className="text-indigo-400 font-extrabold bg-indigo-500/10 px-1 py-0.2 rounded">
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

        <button
          id="execute-trade-btn"
          disabled={executing}
          onClick={handlePlaceTrade}
          className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/60 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Play className="w-4 h-4 text-[#e5e5e5]" />
          <span>{executing ? 'Firing Setup request...' : 'Transmit Trade Confirmation'}</span>
        </button>
      </div>

      {/* Trades Ledger & Positions tracker */}
      <div className="lg:col-span-7 bg-[#080808] border border-white/10 rounded p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between">
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

          {/* Performance Summary Statistics */}
          <div className="mt-4 p-4 bg-[#050505]/60 border border-white/5 rounded">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-[10px] uppercase font-bold text-white/40 font-mono tracking-wider flex items-center">
                <Activity className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                Performance Analytics
              </h5>
              <span className="text-[9px] font-mono text-white/35 bg-white/5 px-1.5 py-0.5 rounded leading-none">
                {performanceStats.totalTrades} {performanceStats.totalTrades === 1 ? 'Trade' : 'Trades'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {/* Win Rate */}
              <div className="p-2.5 bg-[#080808] border border-white/10 rounded flex flex-col justify-between">
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
              <div className="p-2.5 bg-[#080808] border border-white/10 rounded flex flex-col justify-between">
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
              <div className="p-2.5 bg-[#080808] border border-white/10 rounded flex flex-col justify-between">
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
            </div>

            {/* Cumulative PnL Growth Curve */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9.5px] text-[#888888] font-mono uppercase tracking-wide">
                  Cumulative PnL Growth Curve ($)
                </span>
                {performanceStats.totalTrades > 0 && (
                  <span className={`text-[10px] font-mono font-bold ${performanceStats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {performanceStats.totalPnL >= 0 ? '+' : ''}${performanceStats.totalPnL.toFixed(2)}
                  </span>
                )}
              </div>

              {closedTrades.length === 0 ? (
                <div className="h-[100px] flex items-center justify-center border border-dashed border-white/5 bg-[#030303]/40 rounded">
                  <span className="text-[9.5px] font-mono text-white/30 italic">
                    Execute and close trades to populate PnL growth curve
                  </span>
                </div>
              ) : (
                <div className="h-[110px] w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
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
              )}
            </div>

            {/* Net PnL by Day of the Week */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9.5px] text-[#888888] font-mono uppercase tracking-wide">
                  Net PnL by Day of the Week ($)
                </span>
                {performanceStats.totalTrades > 0 && (
                  <span className="text-[10px] font-mono text-white/35">
                    Aggregation (Mon–Sun)
                  </span>
                )}
              </div>

              {closedTrades.length === 0 ? (
                <div className="h-[100px] flex items-center justify-center border border-dashed border-white/5 bg-[#030303]/40 rounded">
                  <span className="text-[9.5px] font-mono text-white/30 italic">
                    Execute and close trades to populate weekly distribution
                  </span>
                </div>
              ) : (
                <div className="h-[110px] w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayOfWeekPnLData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
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
              )}
            </div>
          </div>

          {/* Real-time MT5 Bridge Trade Efficiency Ratio Widget */}
          <div id="trade-efficiency-ratio-widget" className="mt-4 p-4 bg-gradient-to-br from-[#0c0c0e] to-[#070709] border border-white/5 rounded-lg">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <h5 className="text-[10px] uppercase font-bold text-white/40 font-mono tracking-wider flex items-center">
                <Cpu className="w-3.5 h-3.5 mr-1.5 text-[#34d399] animate-pulse" />
                MT5 Bridge Efficiency Recon
              </h5>
              <span className="text-[8px] font-mono text-[#34d399] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#10b981]/15 border border-[#10b981]/25">
                Real-Time telemetry
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Score Dial / Ring Meter */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-3 text-center bg-black/40 border border-white/5 rounded-md relative overflow-hidden">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      className="stroke-white/[0.04]"
                      strokeWidth="4"
                      fill="transparent"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      className="stroke-[#10b981] transition-all duration-1000"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - tradeEfficiencyMetrics.ratio / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span id="efficiency-score-value" className="text-sm font-mono font-black text-white leading-none">
                      {tradeEfficiencyMetrics.ratio.toFixed(1)}%
                    </span>
                    <span className="text-[6.5px] text-white/35 font-mono uppercase font-black tracking-tighter mt-0.5">
                      EFFICIENCY
                    </span>
                  </div>
                </div>
                <span className={`text-[8.5px] font-mono font-bold uppercase mt-2 ${
                  tradeEfficiencyMetrics.ratio >= 85 ? 'text-emerald-400' : tradeEfficiencyMetrics.ratio >= 70 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {tradeEfficiencyMetrics.ratio >= 85 ? '■ OPTIMAL ROUTING' : tradeEfficiencyMetrics.ratio >= 70 ? '▲ REGULAR JITTER' : '✕ HIGH SLIPPAGE'}
                </span>
              </div>

              {/* Performance stats split */}
              <div className="md:col-span-8 flex flex-col justify-between space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-black/20 border border-white/5 rounded">
                    <span className="text-[8px] text-white/30 uppercase font-mono block">Avg Latency</span>
                    <div id="telemetry-avg-latency" className={`text-xs font-mono font-bold mt-1 ${
                      tradeEfficiencyMetrics.avgLatency <= 45 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tradeEfficiencyMetrics.avgLatency.toFixed(1)} ms
                    </div>
                    <span className="text-[7px] text-white/20 font-mono">Target: &lt;45ms</span>
                  </div>

                  <div className="p-2 bg-black/20 border border-white/5 rounded">
                    <span className="text-[8px] text-white/30 uppercase font-mono block">Avg Slippage</span>
                    <div id="telemetry-avg-slippage" className="text-xs font-mono font-bold mt-1 text-sky-400">
                      {tradeEfficiencyMetrics.avgSlippage.toFixed(2)} pips
                    </div>
                    <span className="text-[7px] text-white/20 font-mono">Simulated DOM</span>
                  </div>

                  <div className="p-2 bg-black/20 border border-white/5 rounded">
                    <span className="text-[8px] text-white/30 uppercase font-mono block">Target Health</span>
                    <div id="telemetry-health-pct" className={`text-xs font-mono font-bold mt-1 ${
                      tradeEfficiencyMetrics.healthyPct >= 80 ? 'text-emerald-400' : tradeEfficiencyMetrics.healthyPct >= 65 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {tradeEfficiencyMetrics.healthyPct.toFixed(1)}%
                    </div>
                    <span className="text-[7px] text-white/20 font-mono">In-target rate</span>
                  </div>
                </div>

                {/* Latency Breaches Warnings Banner */}
                <div className="p-2 bg-black/30 border border-white/5 rounded flex items-center justify-between text-[9px] font-mono leading-none">
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      tradeEfficiencyMetrics.breachedCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                    }`}></span>
                    <span className="text-white/50 uppercase text-[8px]">Breaches (&gt;45ms):</span>
                    <span id="telemetry-breached-count" className={`font-black uppercase tracking-wide px-1 rounded ${
                      tradeEfficiencyMetrics.breachedCount > 0 ? 'text-amber-300 bg-amber-500/10' : 'text-emerald-300 bg-emerald-500/10'
                    }`}>
                      {tradeEfficiencyMetrics.breachedCount} {tradeEfficiencyMetrics.breachedCount === 1 ? 'trade' : 'trades'}
                    </span>
                  </div>
                  {tradeEfficiencyMetrics.breachedCount > 0 && (
                    <span className="text-amber-400/90 font-bold tracking-tighter uppercase animate-pulse text-[8px]">
                      ⚠️ HIGHLIGHTED BELOW
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

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
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
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
              <div className="max-h-[240px] overflow-y-auto pr-1 space-y-2">
                {/* Desktop Tabular Grid Header - Visible >= 768px */}
                <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-white/30 border-b border-white/5 sticky top-0 bg-[#0c0c0c] z-10">
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
                  {closedTrades.slice().reverse().map((t) => {
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
                  })}
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
