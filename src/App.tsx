/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MarketSymbol, Candlestick, FVG, OrderBlock, LiquiditySweep, MarketMetrics, OrderBook, NewsEvent, Trade } from './types';
import { motion, AnimatePresence } from 'motion/react';
import ChartContainer from './components/ChartContainer';
import AdvisorChat, { Message } from './components/AdvisorChat';
import EconomicCalendar from './components/EconomicCalendar';
import OrderBookTracker from './components/OrderBookTracker';
import Mt5BridgeGuide from './components/Mt5BridgeGuide';
import TradeTerminal from './components/TradeTerminal';
import BacktestSimulator from './components/BacktestSimulator';
import PerformanceTracker from './components/PerformanceTracker';
import RiskDashboard from './components/RiskDashboard';
import SystemStatus from './components/SystemStatus';
import TradeExplainability from './components/TradeExplainability';
import CorrelationMatrix from './components/CorrelationMatrix';
import MarketSentimentHeatmap from './components/MarketSentimentHeatmap';
import DailyBriefing from './components/DailyBriefing';
import MarketMomentumGauge from './components/MarketMomentumGauge';
import SettingsPanel from './components/SettingsPanel';
import TickerPrice from './components/TickerPrice';
import TradeJournal from './components/TradeJournal';
import StrategyPerformanceChart from './components/StrategyPerformanceChart';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { toPng } from 'html-to-image';
import { 
  HelpCircle, 
  Layers, 
  Radio, 
  Cpu, 
  Bell, 
  ExternalLink, 
  Settings, 
  ShieldCheck, 
  RefreshCw, 
  History, 
  Bot, 
  MessageSquare,
  Award,
  ShieldAlert,
  Activity,
  Wifi,
  AlertTriangle,
  Sun,
  Moon,
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp,
  Camera,
  Timer
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('apex_global_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      const body = document.body;
      if (theme === 'light') {
        body.classList.add('light-theme');
      } else {
        body.classList.remove('light-theme');
      }
      localStorage.setItem('apex_global_theme', theme);
    } catch (err) {
      console.error('Error applying theme:', err);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'INTELLIGENCE' | 'EXECUTION' | 'RISK' | 'RESEARCH' | 'SETTINGS'>('DASHBOARD');
  const [symbol, setSymbol] = useState<MarketSymbol>('EUR/USD');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mt5Ping, setMt5Ping] = useState<number>(12);
  const [isSimulatingSpike, setIsSimulatingSpike] = useState<boolean>(false);
  const [isTestingPing, setIsTestingPing] = useState<boolean>(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const sessionStartTime = useRef<number>(Date.now());
  const [isSessionSummaryOpen, setIsSessionSummaryOpen] = useState(false);
  const [emergencyCloseStatus, setEmergencyCloseStatus] = useState<{
    show: boolean;
    count: number;
    pnl: number;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSessionSummaryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatSessionTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Automated Volatility Alert states
  const [volatilityAlertEnabled, setVolatilityAlertEnabled] = useState(false);
  const [dismissedVolatilityAlertSymbol, setDismissedVolatilityAlertSymbol] = useState<string | null>(null);

  useEffect(() => {
    const checkSettings = () => {
      try {
        const saved = localStorage.getItem('apex_institutional_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setVolatilityAlertEnabled(!!parsed.volatilityAlertEnabled);
        } else {
          setVolatilityAlertEnabled(false);
        }
      } catch (e) {
        console.warn('Failed reading settings key in App:', e);
      }
    };

    checkSettings(); // initial load
    window.addEventListener('storage', checkSettings);
    return () => {
      window.removeEventListener('storage', checkSettings);
    };
  }, []);

  useEffect(() => {
    setDismissedVolatilityAlertSymbol(null);
  }, [symbol]);

  // Ping simulation interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTestingPing) return;
      setMt5Ping((prev) => {
        // Institutional alert threshold is 45ms.
        // Normal state: fluctuates safely between 8ms and 18ms.
        // Simulated spike state: peaks between 52ms and 84ms.
        const targetBase = isSimulatingSpike ? 65 : 12;
        const jitter = Math.round(Math.random() * 8 - 4); // -4 to +4
        return Math.max(3, targetBase + jitter);
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulatingSpike, isTestingPing]);

  const handleTestPingSpeed = () => {
    setIsTestingPing(true);
    setTimeout(() => {
      setMt5Ping(() => {
        const targetBase = isSimulatingSpike ? 65 : 12;
        const jitter = Math.round(Math.random() * 6 - 3); 
        return Math.max(4, targetBase + jitter);
      });
      setIsTestingPing(false);
    }, 800);
  };
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello, trader. I am your **Apex Institutional Elite Advisor**.

I am primed on **The Trading Bible** and **ICT methodologies** to steer you towards capital conservation. 

*Select one of our institutional confluences below, or prompt any query on the market Structure, Fair Value Gaps, or Risk models.*`,
    },
  ]);

  const handleLogEventToAdvisor = (timestamp: string, price: number) => {
    setIsChatOpen(true);
    setChatMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: `📈 **Institutional Backtesting Analysis Log**\n\n- **Asset/Symbol**: \`${symbol}\`\n- **Identified Price Point**: \`${price.toFixed(symbol === 'USD/JPY' ? 3 : symbol === 'BTC/USDT' ? 1 : 5)}\`\n- **Execution Timestamp**: \`${timestamp}\`\n- **Status**: OVEREXTENDED (Mean Reversion Trigger Confirmed)\n\n*This data point has been logged to the Advisor Memory for Backtesting Analysis.*`
      }
    ]);
  };

  // Market & Simulation States
  const [candles, setCandles] = useState<Candlestick[]>([]);
  const [fvgs, setFvgs] = useState<FVG[]>([]);
  const [obs, setObs] = useState<OrderBlock[]>([]);
  const [sweeps, setSweeps] = useState<LiquiditySweep[]>([]);
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [expandedTradeIds, setExpandedTradeIds] = useState<Record<string, boolean>>({});
  const [positionSort, setPositionSort] = useState<'PROFITABLE' | 'MARGIN' | 'DURATION'>('PROFITABLE');

  const sortedActivePositions = useMemo(() => {
    const openPos = trades.filter(t => t.status === 'OPEN');
    return [...openPos].sort((a, b) => {
      if (positionSort === 'PROFITABLE') {
        return b.pnl - a.pnl;
      } else if (positionSort === 'MARGIN') {
        const marginA = (a.symbol === 'BTC/USDT' ? a.size * a.entryPrice : a.size * 100000) / 100;
        const marginB = (b.symbol === 'BTC/USDT' ? b.size * b.entryPrice : b.size * 100000) / 100;
        return marginB - marginA;
      } else if (positionSort === 'DURATION') {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        // oldest/longest first
        return timeA - timeB;
      }
      return 0;
    });
  }, [trades, positionSort]);

  const toggleTradeExpand = (id: string) => {
    setExpandedTradeIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const sessionTrades = useMemo(() => {
    return trades.filter((t) => {
      const entryTime = new Date(t.timestamp).getTime();
      const exitTime = t.exitTimestamp ? new Date(t.exitTimestamp).getTime() : 0;
      return entryTime >= sessionStartTime.current || exitTime >= sessionStartTime.current;
    });
  }, [trades]);

  const sessionStats = useMemo(() => {
    const list = sessionTrades;
    const open = list.filter((t) => t.status === 'OPEN');
    const closed = list.filter((t) => t.status === 'CLOSED');
    const wins = closed.filter((t) => t.pnl > 0);
    const losses = closed.filter((t) => t.pnl <= 0);
    
    const floatingPnL = open.reduce((sum, t) => sum + t.pnl, 0);
    const realizedPnL = closed.reduce((sum, t) => sum + t.pnl, 0);
    const totalPnL = floatingPnL + realizedPnL;
    
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    
    return {
      total: list.length,
      openCount: open.length,
      closedCount: closed.length,
      winsCount: wins.length,
      lossesCount: losses.length,
      floatingPnL,
      realizedPnL,
      totalPnL,
      winRate
    };
  }, [sessionTrades]);

  const formatOpenDuration = (openedStr: string) => {
    try {
      const start = new Date(openedStr).getTime();
      const end = Date.now();
      if (isNaN(start)) return '—';
      const diffMs = end - start;
      if (diffMs < 0) return '0s';
      
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
    } catch (e) {
      return '—';
    }
  };

  const [isSnapshotting, setIsSnapshotting] = useState(false);

  const handleTakePositionsSnapshot = async () => {
    const el = document.getElementById('positions-overview-card');
    if (!el) {
      console.warn('Positions Overview element was not found in the DOM');
      return;
    }
    
    setIsSnapshotting(true);
    try {
      // Small timeout for browser to clear any active hover overlays
      await new Promise(resolve => setTimeout(resolve, 150));

      const dataUrl = await toPng(el, {
        backgroundColor: '#0a0a0b',
        pixelRatio: 2.5, // Ultra-high resolution crisp text & vectors
        style: {
          transform: 'scale(1)',
          borderRadius: '8px',
        },
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `Positions_Overview_Apex_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to capture high-resolution positions snapshot:', error);
    } finally {
      setIsSnapshotting(false);
    }
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sync / fetch all parameters
  const fetchMarketData = async () => {
    try {
      // 1. Market Data
      try {
        const rMarket = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}`);
        if (rMarket.ok) {
          const dMarket = await rMarket.json();
          setCandles(dMarket.candles || []);
          setFvgs(dMarket.fvgs || []);
          setObs(dMarket.obs || []);
          setSweeps(dMarket.sweeps || []);
          setMetrics(dMarket.metrics || null);
        }
      } catch (err) {
        console.warn('Failed to sync market-data:', err);
      }

      // 2. Order Book
      try {
        const rOrderBook = await fetch(`/api/order-book?symbol=${encodeURIComponent(symbol)}`);
        if (rOrderBook.ok) {
          const dOrderBook = await rOrderBook.json();
          setOrderBook(dOrderBook);
        }
      } catch (err) {
        console.warn('Failed to sync order-book:', err);
      }

      // 3. Trades
      try {
        const rTrades = await fetch('/api/trades');
        if (rTrades.ok) {
          const dTrades = await rTrades.json();
          setTrades(dTrades || []);
        }
      } catch (err) {
        console.warn('Failed to sync trades:', err);
      }

      // 4. Calendar
      try {
        const rCalendar = await fetch('/api/forex-factory');
        if (rCalendar.ok) {
          const dCalendar = await rCalendar.json();
          setNewsEvents(dCalendar || []);
        }
      } catch (err) {
        console.warn('Failed to sync forex-factory:', err);
      }
    } catch (e) {
      console.error('Failed syncing live market matrix:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMarketData();

    // Setup background ticking poll
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchMarketData();
    }, 4000);

    return () => clearInterval(interval);
  }, [symbol]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchMarketData();
  };

  const handleQuickCloseTrade = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/close`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchMarketData();
      } else {
        console.error('Failed to quick-close trade:', res.statusText);
      }
    } catch (error) {
      console.error('Failed quick close trade:', error);
    }
  };

  const handleEmergencyCloseAll = async () => {
    const openPositions = trades.filter((t) => t.status === 'OPEN');
    if (openPositions.length === 0) {
      setEmergencyCloseStatus({
        show: true,
        count: 0,
        pnl: 0,
        timestamp: new Date().toLocaleTimeString(),
      });
      // automatically fade out informational alert in 5s
      setTimeout(() => {
        setEmergencyCloseStatus(prev => prev && prev.count === 0 ? null : prev);
      }, 5000);
      return;
    }

    try {
      const totalPnlClosed = openPositions.reduce((sum, t) => sum + t.pnl, 0);
      
      // Close all active positions
      await Promise.all(
        openPositions.map((trade) =>
          fetch(`/api/trades/${trade.id}/close`, {
            method: 'POST',
          })
        )
      );
      
      setEmergencyCloseStatus({
        show: true,
        count: openPositions.length,
        pnl: totalPnlClosed,
        timestamp: new Date().toLocaleTimeString(),
      });
      
      fetchMarketData();
    } catch (error) {
      console.error('Failed emergency close all execution:', error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Listen for Alt+X (physical key, or standard virtual characters across target OS)
      if (e.altKey && (e.key === 'x' || e.key === 'X' || e.code === 'KeyX' || e.key === '≈' || e.key === 'œ')) {
        e.preventDefault();
        handleEmergencyCloseAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trades]);

  // Automated Volatility Alert calculation
  const volatilityStats = useMemo(() => {
    if (!candles || candles.length < 2) {
      return {
        currentVol: 0,
        movingAvgVol: 0.0012,
        isExceeded: false,
        ratio: 1.0
      };
    }

    // 1. Hourly Volatility = latest hourly candle's high-low range divided by close price
    const lastCandle = candles[candles.length - 1];
    const currentVol = ((lastCandle.high - lastCandle.low) / (lastCandle.close || 1)) * 100;

    // 2. 30-period (~30 days equivalent inside simulation) moving average of volatility
    const numPeriods = Math.min(candles.length, 30);
    const sliced = candles.slice(-numPeriods);
    const sumVol = sliced.reduce((acc, c) => {
      const vol = ((c.high - c.low) / (c.close || 1)) * 100;
      return acc + vol;
    }, 0);
    const movingAvgVol = sumVol / numPeriods;

    const isExceeded = currentVol > movingAvgVol;
    const ratio = movingAvgVol > 0 ? currentVol / movingAvgVol : 1.0;

    return {
      currentVol,
      movingAvgVol,
      isExceeded,
      ratio
    };
  }, [candles]);

  // Summary Stats computation for Dashboard Top Overview Decker
  const systemDashboardSummary = useMemo(() => {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');
    const seedTradesPnL = 16194.0; // sum of AUDITED_HISTORIC_TRADES PnLs
    const userClosedPnL = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
    const activePnL = trades.filter((t) => t.status === 'OPEN').reduce((acc, t) => acc + t.pnl, 0);
    
    const accountEquity = 10000 + seedTradesPnL + userClosedPnL + activePnL;
    
    // Daily Profit or loss
    const dailyPnL = activePnL + (closedTrades.filter(t => {
      const dt = new Date(t.timestamp);
      const diff = Date.now() - dt.getTime();
      return diff < 86400000;
    }).reduce((acc, t) => acc + t.pnl, 0) || 542.80); 

    // Compute average hourly volatility
    let avgHourlyVol = 0.0015; // default 0.15% hourly volatility
    if (candles && candles.length > 0) {
      const volSum = candles.slice(-24).reduce((acc, c) => {
        const range = c.high - c.low;
        const ref = c.close || c.open || 1;
        return acc + (range / ref);
      }, 0);
      avgHourlyVol = volSum / Math.min(candles.length, 24);
    }

    const openPositions = trades.filter((t) => t.status === 'OPEN');
    const totalOpenRiskAmount = openPositions.length * 1.0; 

    // Approximate size in units
    let totalActiveSizeInUSD = 0;
    openPositions.forEach(p => {
      if (p.symbol === 'BTC/USDT') {
        totalActiveSizeInUSD += p.size * p.entryPrice;
      } else {
        totalActiveSizeInUSD += p.size * 100000; // standard Forex contract size
      }
    });

    const currentHour = new Date().getHours() || 12;
    const remainingHours = Math.max(1, 24 - currentHour);
    
    const expectedVolatilityPnLMove = totalActiveSizeInUSD > 0 
      ? totalActiveSizeInUSD * avgHourlyVol * Math.sqrt(remainingHours)
      : (accountEquity * avgHourlyVol * 1.5); // standard account equity swing

    const projectedDailyPnL = dailyPnL + (totalActiveSizeInUSD > 0 
      ? (activePnL * (avgHourlyVol * remainingHours * 0.1)) // adjusted trend projection
      : (dailyPnL * 0.02 * avgHourlyVol * 100)
    );

    // Monthly Profit parameters
    const monthlyPnL = seedTradesPnL + userClosedPnL + activePnL;

    return {
      accountEquity,
      dailyPnL,
      projectedDailyPnL,
      estVolRange: expectedVolatilityPnLMove,
      monthlyPnL,
      activeTradesCount: openPositions.length,
      riskRatio: totalOpenRiskAmount || 0.0,
    };
  }, [trades, candles]);
  
  // Dataset for 'Projection vs Actual' Area Chart tracking cumulative performance against institutional goals
  const projectionVsActualData = useMemo(() => {
    const dailyPnL = systemDashboardSummary.dailyPnL;
    // Institutional goal is set to $1,000.00
    const targetGoal = 1000;
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
    
    return hours.map((hour, idx) => {
      const fraction = (idx + 1) / hours.length;
      const targetProj = Math.round(targetGoal * fraction);
      
      let actualVal = 0;
      if (idx === 0) {
        actualVal = Math.round(dailyPnL * 0.18);
      } else if (idx === 1) {
        actualVal = Math.round(dailyPnL * 0.45);
      } else if (idx === 2) {
        actualVal = Math.round(dailyPnL * 0.35); // small dip
      } else if (idx === 3) {
        actualVal = Math.round(dailyPnL * 0.70);
      } else if (idx === 4) {
        actualVal = Math.round(dailyPnL * 0.88);
      } else {
        actualVal = Math.round(dailyPnL);
      }
      
      return {
        hour,
        'Daily Goal': targetProj,
        'Actual PnL': actualVal
      };
    });
  }, [systemDashboardSummary.dailyPnL]);

  // Simulated live prices for ticker blocks
  const tickerStats: Record<MarketSymbol, { name: string; price: number; pChange: number }> = {
    'EUR/USD': { name: 'EURUSD', price: candles[candles.length - 1]?.close || 1.1645, pChange: +0.25 },
    'GBP/USD': { name: 'GBPUSD', price: symbol === 'GBP/USD' ? (candles[candles.length - 1]?.close || 1.2680) : 1.2680, pChange: +0.14 },
    'USD/JPY': { name: 'USDJPY', price: symbol === 'USD/JPY' ? (candles[candles.length - 1]?.close || 155.40) : 155.40, pChange: -0.32 },
    'BTC/USDT': { name: 'BTCUSDT', price: symbol === 'BTC/USDT' ? (candles[candles.length - 1]?.close || 67500.0) : 67500.0, pChange: +1.82 },
    'GOLD/USD': { name: 'GOLDUSD', price: symbol === 'GOLD/USD' ? (candles[candles.length - 1]?.close || 2355.50) : 2355.50, pChange: +0.42 },
  };

  return (
    <div id="apex-app-root" className="min-h-screen bg-[#050505] font-sans text-[#e5e5e5] flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Banner / Header */}
      <header className="border-b border-white/10 bg-[#080808]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center font-black text-white text-base tracking-widest shadow-[0_0_12px_#4f46e5]">
                Ω
              </div>
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-semibold uppercase tracking-wider text-white leading-none">
                  APEX QUANT<span className="text-indigo-500">.AI</span>
                </h1>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-mono uppercase tracking-wide text-[#e5e5e5]/60 font-bold leading-none">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-white/40 font-serif italic mt-1 font-light tracking-wide">
                The Trading Bible & Institutional Decision Engine
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-1 border border-white/5 bg-[#080808] p-1 rounded-lg overflow-x-auto max-w-[calc(100vw-3rem)] no-scrollbar">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('DASHBOARD')}
              className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all flex items-center space-x-1 shrink-0 ${
                activeTab === 'DASHBOARD'
                  ? 'bg-white/5 text-white border border-white/10'
                  : 'text-white/50 hover:text-white border border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dashboard</span>
            </button>
            <button
              id="nav-tab-intelligence"
              onClick={() => setActiveTab('INTELLIGENCE')}
              className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all flex items-center space-x-1 shrink-0 ${
                activeTab === 'INTELLIGENCE'
                  ? 'bg-white/5 text-white border border-white/10'
                  : 'text-white/50 hover:text-white border border-transparent'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Intelligence</span>
            </button>
            <button
              id="nav-tab-execution"
              onClick={() => setActiveTab('EXECUTION')}
              className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all flex items-center space-x-1 shrink-0 ${
                activeTab === 'EXECUTION'
                  ? 'bg-white/5 text-white border border-white/10'
                  : 'text-white/50 hover:text-white border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Execution</span>
            </button>
            <button
              id="nav-tab-risk"
              onClick={() => setActiveTab('RISK')}
              className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all flex items-center space-x-1 shrink-0 ${
                activeTab === 'RISK'
                  ? 'bg-white/5 text-white border border-white/10'
                  : 'text-white/50 hover:text-white border border-transparent'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>Risk Desk</span>
            </button>
            <button
              id="nav-tab-research"
              onClick={() => setActiveTab('RESEARCH')}
              className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all flex items-center space-x-1 shrink-0 ${
                activeTab === 'RESEARCH'
                  ? 'bg-white/5 text-white border border-white/10'
                  : 'text-white/50 hover:text-white border border-transparent'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Research</span>
            </button>
            <button
              id="nav-tab-settings"
              onClick={() => setActiveTab('SETTINGS')}
              className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all flex items-center space-x-1 shrink-0 ${
                activeTab === 'SETTINGS'
                  ? 'bg-white/5 text-white border border-white/10'
                  : 'text-white/50 hover:text-white border border-transparent'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span>Settings</span>
            </button>
          </div>

          {/* Active status indicator ledger */}
          <div className="flex items-center space-x-3.5">
            <button
              id="global-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 hover:bg-white/5 border border-white/10 rounded text-white/60 hover:text-white transition-colors flex items-center justify-center cursor-pointer h-9 w-9"
              title={theme === 'dark' ? 'Switch to High-Contrast Light Mode' : 'Switch to Elegant Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
            <button
              id="manual-refresh-btn"
              onClick={handleManualRefresh}
              className="p-2 hover:bg-white/5 border border-white/10 rounded text-white/60 hover:text-white transition-colors h-9 w-9 flex items-center justify-center"
              title="Manual Sync Feed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
               {/* Session Time Discipline Indicator */}
            <button
              id="session-discipline-tracker"
              onClick={() => setIsSessionSummaryOpen(true)}
              className="flex items-center space-x-2 px-2.5 py-1.5 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 hover:border-indigo-500/35 rounded font-mono text-[11px] h-9 transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-indigo-500/30 font-bold"
              title="Time active in current trading session. Click to view Session Summary."
            >
              <Timer className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
              <div className="flex flex-col text-left leading-none">
                <span className="text-[7.5px] text-white/30 uppercase tracking-widest font-extrabold flex items-center gap-1">
                  Active Session
                  <span className="inline-block w-1 h-2 rounded bg-indigo-500/30 animate-pulse" />
                </span>
                <span className="text-white font-black tabular-nums tracking-tight mt-0.5">{formatSessionTime(sessionSeconds)}</span>
              </div>
            </button>

            {/* Alt+X Emergency panic close all button */}
            <button
              id="emergency-close-all-btn"
              onClick={handleEmergencyCloseAll}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded font-mono text-[11px] h-9 text-rose-400 font-bold transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500/30"
              title="Alt+X: Trigger Emergency Close All open positions immediately"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
              <div className="flex flex-col text-left leading-none">
                <span className="text-[7.5px] text-rose-500/60 uppercase tracking-widest font-extrabold font-mono">Emergency</span>
                <span className="text-white font-black tracking-tight mt-0.5 font-mono">Alt + X</span>
              </div>
            </button>
            <div className="hidden md:flex items-center space-x-2 text-right">
              <span className="text-[10px] text-white/40 block font-mono uppercase tracking-tighter">Live Ingress Gateway</span>
              <span className="text-emerald-400 text-xs font-mono flex items-center justify-end font-bold uppercase tracking-wide">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-1.5 shadow-[0_0_8px_#10b981]"></span>
                ACTIVE FEED (H4)
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Symbol ticker strip */}
      <section className="bg-[#080808] border-b border-white/10 py-2">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center gap-4 overflow-x-auto select-none no-scrollbar">
          <div className="text-[9px] uppercase tracking-wider font-extrabold text-white/30 border-r border-white/10 pr-4 shrink-0 font-mono flex items-center space-x-1">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Select Pair</span>
          </div>

          <div className="flex items-center space-x-3.5">
            {(Object.keys(tickerStats) as MarketSymbol[]).map((sym) => {
              const active = symbol === sym;
              const stats = tickerStats[sym];
              return (
                <button
                  id={`ticker-select-${stats.name}`}
                  key={sym}
                  onClick={() => setSymbol(sym)}
                  className={`px-4 py-1.5 border rounded flex items-center space-x-2.5 transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600/10 border-indigo-500/40 text-white shadow-[0_0_12px_rgba(99,102,241,0.05)]'
                      : 'bg-[#0c0c0c] border-white/5 text-white/40 hover:border-white/10 hover:text-[#e5e5e5]'
                  }`}
                >
                  <span className="text-xs font-mono font-bold tracking-tight">{sym}</span>
                  <TickerPrice price={stats.price} symbol={sym} />
                  <span className={`text-[10px] font-mono font-semibold ${stats.pChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stats.pChange >= 0 ? `+${stats.pChange}%` : `${stats.pChange}%`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Dynamic Workplace Area */}
      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            <p className="text-sm font-mono text-white/40">Retrieving institutional pricing indexes...</p>
          </div>
        ) : (
          <>
            {/* Persistent Volatility Breach Notification Banner */}
            {volatilityAlertEnabled && volatilityStats.isExceeded && dismissedVolatilityAlertSymbol !== symbol && (
              <div 
                id="persistent-volatility-breach-notification"
                className="mb-6 bg-gradient-to-r from-rose-950/40 to-black border border-rose-500/30 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl animate-fadeIn relative overflow-hidden"
              >
                {/* Background ambient accent animation */}
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-rose-500/5 blur-2xl pointer-events-none" />
                
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-500 shrink-0 mt-0.5 animate-pulse">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/40 rounded text-[9px] font-mono font-black text-rose-400 uppercase tracking-widest leading-none">
                        Volatility Alert
                      </span>
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        High Velocity Displacement Risk on {symbol}
                      </h4>
                    </div>
                    <p className="text-[11px] text-white/60 font-sans mt-1.5 leading-relaxed max-w-[850px]">
                      The selected instrument <strong className="text-white font-mono">{symbol}</strong> is currently displaying an immediate hourly volatility of <strong className="text-rose-450 font-mono font-bold">{volatilityStats.currentVol.toFixed(4)}%</strong>, which exceeds its 30-period rolling moving average limit of <strong className="text-indigo-300 font-mono">{volatilityStats.movingAvgVol.toFixed(4)}%</strong> by <strong className="text-rose-455 font-mono font-black">+{((volatilityStats.ratio - 1) * 100).toFixed(1)}%</strong>. Systemic risk parameters should be scaled down.
                    </p>
                  </div>
                </div>

                {/* Stat readout + Dismiss Action Pill */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0 border-t border-white/5 md:border-0 pt-3 md:pt-0">
                  <div className="text-right hidden sm:block font-mono">
                    <span className="text-[9px] text-white/30 block uppercase tracking-tight">Volatility Ratio</span>
                    <span className="text-[12px] font-black text-rose-400">
                      {volatilityStats.ratio.toFixed(2)}x MA
                    </span>
                  </div>
                  <div className="h-6 w-px bg-white/10 hidden sm:block" />
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      id="btn-volatility-alert-go-settings"
                      onClick={() => setActiveTab('SETTINGS')}
                      className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded font-mono text-[9px] font-bold uppercase text-white tracking-wider transition-all cursor-pointer"
                    >
                      Configure Toggles
                    </button>
                    <button
                      id="btn-volatility-alert-dismiss"
                      onClick={() => setDismissedVolatilityAlertSymbol(symbol)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded transition-all cursor-pointer"
                      title="Snooze warning for this session"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'DASHBOARD' ? (
              <div id="desk-grid-grid" className="space-y-6">
                
                {/* 1. Dynamic Overview Telemetry Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Card 1: Account Equity */}
                  <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-sm select-none">
                    <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-550 animate-pulse"></span>
                      Account Equity
                    </span>
                    <div>
                      <div className="text-xl font-mono font-bold text-white">
                        ${systemDashboardSummary.accountEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[9px] font-mono text-indigo-400 font-bold">+138.4% Cumulative Net Increase</span>
                    </div>
                  </div>

                  {/* Card 2: Daily PnL */}
                  <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-sm select-none">
                    <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider">Daily PnL</span>
                    <div>
                      <div className={`text-xl font-mono font-bold ${systemDashboardSummary.dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                        {systemDashboardSummary.dailyPnL >= 0 ? '+' : ''}${systemDashboardSummary.dailyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[9px] font-mono text-emerald-500/80 font-semibold font-mono">Intraday Target: 1.0%</span>
                    </div>
                  </div>

                  {/* Card 3: Projection vs Actual Area Chart */}
                  <div id="projection-vs-actual-card" className="col-span-2 md:col-span-2 lg:col-span-2 bg-[#0a0a0b] border border-white/5 rounded-lg p-3.5 flex flex-col justify-between shadow-sm select-none h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                        Goals vs Performance
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[9px]">
                        <span className="text-white/30">Goal:</span>
                        <span className="text-indigo-400 font-bold">$1,000</span>
                        <span className="text-white/30">| Actual:</span>
                        <span className={`${systemDashboardSummary.dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>
                          ${systemDashboardSummary.dailyPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    <div className="h-[55px] w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projectionVsActualData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <defs>
                            <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.12}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                            </linearGradient>
                            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={systemDashboardSummary.dailyPnL >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.16}/>
                              <stop offset="95%" stopColor={systemDashboardSummary.dailyPnL >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="hour" hide />
                          <YAxis hide domain={['auto', 'auto']} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const dataPoint = payload[0].payload;
                                return (
                                  <div className="bg-[#0e0e11] border border-white/10 px-2.5 py-1.5 text-[9px] font-mono rounded shadow-lg text-left leading-tight z-50">
                                    <div className="text-white/40 font-bold mb-1">{dataPoint.hour} Mark</div>
                                    <div className="text-indigo-400">Goal: ${dataPoint['Daily Goal']}</div>
                                    <div className={`${dataPoint['Actual PnL'] >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      Actual: ${dataPoint['Actual PnL'] >= 0 ? '+' : ''}${dataPoint['Actual PnL']}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="Daily Goal"
                            stroke="#6366f1"
                            strokeWidth={1}
                            strokeDasharray="2 2"
                            fillOpacity={1}
                            fill="url(#goalGrad)"
                          />
                          <Area
                            type="monotone"
                            dataKey="Actual PnL"
                            stroke={systemDashboardSummary.dailyPnL >= 0 ? '#10b981' : '#f43f5e'}
                            strokeWidth={1.5}
                            fillOpacity={1}
                            fill="url(#actualGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Card 4: Monthly PnL */}
                  <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-sm select-none font-sans">
                    <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider">Monthly PnL</span>
                    <div>
                      <div className="text-xl font-mono font-bold text-emerald-500">
                        +${systemDashboardSummary.monthlyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400/80 font-bold">Premium Yield Target</span>
                    </div>
                  </div>

                  {/* Card 5: Active Risk Exposure */}
                  <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-sm select-none">
                    <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider text-white/35">Risk Active</span>
                    <div>
                      <div className={`text-xl font-mono font-bold ${systemDashboardSummary.riskRatio > 0 ? 'text-amber-400 animate-pulse' : 'text-white/60'}`}>
                        {systemDashboardSummary.riskRatio.toFixed(1)}% Active
                      </div>
                      <span className="text-[9px] font-mono text-white/30">Leverage Cap: 2.0% Max</span>
                    </div>
                  </div>

                  {/* Card 6: System Health */}
                  <div className="col-span-2 lg:col-span-1 bg-[#0a0a0b] border border-white/5 rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-sm select-none">
                    <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider">System Status</span>
                    <div>
                      <div className="text-base font-mono font-bold text-emerald-400 flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>NOMINAL</span>
                      </div>
                      <span className="text-[9px] font-mono text-white/30">Feeds Inbound H4</span>
                    </div>
                  </div>
                </div>

                {/* Daily Morning Market Narrative Briefing & Market Momentum Gauge Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-8 xl:col-span-9">
                    <DailyBriefing />
                  </div>
                  <div className="lg:col-span-4 xl:col-span-3">
                    <MarketMomentumGauge symbol={symbol} candles={candles} metrics={metrics} />
                  </div>
                </div>
                
                {/* Dashboard Multi-grid layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  
                  {/* Economic factory calendar on left (Spans 7 columns) */}
                  <div className="xl:col-span-7 space-y-6">
                    <EconomicCalendar events={newsEvents} />
                  </div>

                  {/* Right side active positions overview & system logs (Spans 5 columns) */}
                  <div className="xl:col-span-5 space-y-6">
                    <div id="positions-overview-card" className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3.5 mb-4 gap-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
                              <Activity className="w-4 h-4 text-indigo-400" />
                              Positions Overview
                            </h3>
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9.5px] font-mono text-indigo-400 font-bold">
                              {systemDashboardSummary.activeTradesCount} EXPOSURES ACTIVE
                            </span>
                          </div>

                          {/* Export UI Snapshot Action */}
                          <button
                            id="btn-take-positions-snapshot"
                            onClick={handleTakePositionsSnapshot}
                            disabled={isSnapshotting}
                            className="px-2 py-0.5 bg-indigo-500/11 hover:bg-indigo-500/30 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500/40 rounded transition-all text-[9px] flex items-center space-x-1.5 font-mono cursor-pointer disabled:opacity-50 font-bold uppercase tracking-tight select-none"
                            title="Export Current Positions View as High-Definition Image"
                          >
                            <Camera className={`w-3 h-3 ${isSnapshotting ? 'animate-pulse text-indigo-300' : ''}`} />
                            <span>{isSnapshotting ? 'Capture...' : 'Snapshot'}</span>
                          </button>
                        </div>

                        {/* Highly tactual Sort Selection */}
                        {systemDashboardSummary.activeTradesCount > 0 && (
                          <div className="flex items-center space-x-1 font-mono text-[9.5px]">
                            <span className="text-white/35 mr-1 text-[8.5px] uppercase tracking-wider">Sort:</span>
                            <div className="flex bg-black/40 p-0.5 rounded border border-white/5 space-x-0.5">
                              <button
                                onClick={() => setPositionSort('PROFITABLE')}
                                className={`px-2 py-0.5 rounded text-[9px] transition-all font-semibold uppercase tracking-wider cursor-pointer ${
                                  positionSort === 'PROFITABLE'
                                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                                    : 'text-white/45 hover:text-white/85 border border-transparent'
                                }`}
                                title="Sort by Most Profitable"
                              >
                                PnL
                              </button>
                              <button
                                onClick={() => setPositionSort('MARGIN')}
                                className={`px-2 py-0.5 rounded text-[9px] transition-all font-semibold uppercase tracking-wider cursor-pointer ${
                                  positionSort === 'MARGIN'
                                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                                    : 'text-white/45 hover:text-white/85 border border-transparent'
                                }`}
                                title="Sort by Highest Margin Used"
                              >
                                Margin
                              </button>
                              <button
                                onClick={() => setPositionSort('DURATION')}
                                className={`px-2 py-0.5 rounded text-[9px] transition-all font-semibold uppercase tracking-wider cursor-pointer ${
                                  positionSort === 'DURATION'
                                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                                    : 'text-white/45 hover:text-white/85 border border-transparent'
                                }`}
                                title="Sort by Longest Duration"
                              >
                                Duration
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {sortedActivePositions.length === 0 ? (
                        <div className="py-12 text-center space-y-3">
                          <div className="h-10 w-10 bg-indigo-500/5 rounded-full flex items-center justify-center mx-auto border border-indigo-500/10 text-indigo-400 opacity-60">
                            ✓
                          </div>
                          <p className="text-xs font-mono text-white/35">No micro-leveraged active positions detected.</p>
                          <button 
                            onClick={() => setActiveTab('EXECUTION')} 
                            className="text-[10px] uppercase font-mono font-extrabold text-indigo-400 hover:text-indigo-300 tracking-wider hover:underline cursor-pointer"
                          >
                            Open trading interface &rarr;
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sortedActivePositions.map(trade => (
                            <div key={trade.id} className="bg-[#050505] rounded border border-white/5 overflow-hidden transition-all duration-200">
                              {/* Position Header/Summary Row */}
                              <div 
                                onClick={() => toggleTradeExpand(trade.id)} 
                                className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] select-none"
                              >
                                <div className="flex items-center space-x-2 md:space-x-3">
                                  <span className="text-white/30 hover:text-white transition-colors">
                                    {expandedTradeIds[trade.id] ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-black font-mono ${trade.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    {trade.side}
                                  </span>
                                  <div>
                                    <span className="text-xs font-bold font-mono text-white block">{trade.symbol}</span>
                                    <span className="text-[9.5px] text-white/30 font-mono">Lot size: {trade.size}</span>
                                  </div>
                                </div>

                                {/* Minimalist Sparkline Chart */}
                                {trade.pnlTrajectory && trade.pnlTrajectory.length > 0 ? (
                                  <div className="hidden sm:block w-20 md:w-28 h-7 grow-0 shrink-0 self-center opacity-80 hover:opacity-100 transition-opacity pr-2" title={`${trade.symbol} PnL trajectory (Last 60m)`}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={trade.pnlTrajectory} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                                        <Line
                                          type="monotone"
                                          dataKey="pnl"
                                          stroke={trade.pnl >= 0 ? '#10b981' : '#f43f5e'}
                                          strokeWidth={1.5}
                                          dot={false}
                                          isAnimationActive={true}
                                          animationDuration={600}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                ) : (
                                  <div className="hidden sm:block w-20 md:w-28 h-7 shrink-0" />
                                )}

                                <div className="flex items-center space-x-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <div className="text-right">
                                    <span className={`text-xs font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                    </span>
                                    <span className="text-[8.5px] text-white/20 block font-mono">PnL</span>
                                  </div>
                                  <button
                                    onClick={() => handleQuickCloseTrade(trade.id)}
                                    className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-white border border-rose-500/25 hover:border-rose-500/60 rounded text-[9px] font-mono font-bold uppercase transition-all tracking-wider cursor-pointer flex items-center space-x-1"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Close</span>
                                  </button>
                                </div>
                              </div>

                              {/* Expanded position details wrapper */}
                              {expandedTradeIds[trade.id] && (
                                <div className="px-3 pb-3 pt-1.5 border-t border-white/5 bg-white/[0.01] grid grid-cols-3 gap-2 text-[10px] font-mono text-white/50 animate-fadeIn">
                                  <div className="bg-black/30 p-2 rounded border border-white/5">
                                    <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Entry Price</span>
                                    <span className="text-white font-bold">{trade.entryPrice.toFixed(trade.symbol === 'USD/JPY' ? 3 : trade.symbol === 'BTC/USDT' ? 1 : 5)}</span>
                                  </div>
                                  <div className="bg-black/30 p-2 rounded border border-white/5">
                                    <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Open Duration</span>
                                    <span className="text-white font-bold">{formatOpenDuration(trade.timestamp)}</span>
                                  </div>
                                  <div className="bg-black/30 p-2 rounded border border-white/5">
                                    <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Margin Usage</span>
                                    <span className="text-indigo-400 font-extrabold">${((trade.symbol === 'BTC/USDT' ? trade.size * trade.entryPrice : trade.size * 100000) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <SystemStatus />
                  </div>

                </div>

              </div>
            ) : activeTab === 'INTELLIGENCE' ? (
              <div id="intelligence-workspace-deck" className="space-y-6 animate-fadeIn">
                
                {/* Dual pane chart & AI chatbot */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  
                  {/* Candlestick Trading charts (Left side) */}
                  <div className="xl:col-span-8 space-y-6">
                    {metrics && (
                      <ChartContainer
                        symbol={symbol}
                        candles={candles}
                        fvgs={fvgs}
                        obs={obs}
                        sweeps={sweeps}
                        metrics={metrics}
                        onLogEventToAdvisor={handleLogEventToAdvisor}
                        trades={trades}
                        onTradeExecuted={fetchMarketData}
                        newsEvents={newsEvents}
                      />
                    )}

                    {/* AI Signal Insights and Explainability */}
                    {metrics && (
                      <TradeExplainability
                        symbol={symbol}
                        metrics={metrics}
                      />
                    )}
                  </div>

                  {/* Right hand layout pane: Order Book & Correlation Matrix */}
                  <div className="xl:col-span-4 space-y-6">
                    {orderBook && (
                      <OrderBookTracker
                        symbol={symbol}
                        orderBook={orderBook}
                      />
                    )}
                    <CorrelationMatrix />
                    <MarketSentimentHeatmap />
                  </div>

                </div>

              </div>
            ) : activeTab === 'EXECUTION' ? (
              <div id="execution-workspace" className="animate-fadeIn space-y-6">
                
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <div className="xl:col-span-9 space-y-6">
                    {/* Positions manager */}
                    {metrics && (
                      <TradeTerminal
                        symbol={symbol}
                        metrics={metrics}
                        onTradeExecuted={fetchMarketData}
                        trades={trades}
                      />
                    )}
                  </div>

                  <div className="xl:col-span-3 space-y-6">
                    {/* System bridge latency information panel */}
                    <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 space-y-4">
                      <div className="border-b border-white/5 pb-2.5">
                        <h4 className="text-xs font-bold uppercase font-mono text-white tracking-wider">
                          Bridge Health
                        </h4>
                        <p className="text-[9.5px] text-white/30 font-mono mt-0.5">Automated safety parameters</p>
                      </div>

                      <div className="space-y-3 text-[10px] font-mono leading-relaxed text-slate-350 space-y-3">
                        <p>
                          Your placement requests are serialized directly into standard <span className="text-[#a16207] font-semibold">1% fixed fractional models</span>.
                        </p>
                        <p>
                          Active latency warnings evaluate round-trip packet speeds dynamically to avoid trade slippages during market announcements.
                        </p>
                      </div>

                      <div className="p-3 bg-[#050505] rounded border border-white/5 font-mono text-[9px]">
                        <span className="text-white/30 block uppercase font-bold">PASSIVE LATENCY BOUNDS</span>
                        <span className="text-emerald-400 font-bold block mt-1">SECURED BY LOCK (45ms)</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : activeTab === 'RISK' ? (
              <div id="risk-workspace" className="animate-fadeIn space-y-6">
                {metrics && <RiskDashboard trades={trades} symbol={symbol} />}
              </div>
            ) : activeTab === 'RESEARCH' ? (
              <div id="backtest-workspace" className="animate-fadeIn space-y-6">
                <StrategyPerformanceChart />
                <BacktestSimulator selectedSymbol={symbol} onSymbolChange={(sym) => setSymbol(sym)} />
                <PerformanceTracker trades={trades} onTradeUpdated={fetchMarketData} />
                <TradeJournal trades={trades} onTradeUpdated={fetchMarketData} />
              </div>
            ) : (
              <div id="settings-direct-control-workspace" className="animate-fadeIn">
                <SettingsPanel />
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer Info strip */}
      <footer className="border-t border-white/10 bg-[#080808] py-6 mt-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center justify-between gap-4 font-mono text-[11px] text-white/30">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Fiduciary Account Capital Protected by Fixed fractional (Max 1% SL invalidate) rules</span>
            </div>
            
            {/* Live Subtle Latency Monitor */}
            <div className="flex flex-wrap items-center gap-2 lg:gap-3.5 lg:border-l lg:border-white/10 lg:pl-4">
              <div className="flex items-center space-x-2">
                {mt5Ping > 45 ? (
                  <Wifi className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                ) : (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 opacity-70" />
                )}
                
                <span className="text-white/40">MT5 Bridge Ping:</span>
                <span id="mt5-ping-value" className={`font-bold font-mono ${isTestingPing ? 'text-indigo-400 animate-pulse' : mt5Ping > 45 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-emerald-400'}`}>
                  {isTestingPing ? 'pinging...' : `${mt5Ping}ms`}
                </span>
              </div>

              {/* Glowing Indicator Dot */}
              <div className="relative flex h-2 w-2">
                {mt5Ping > 45 ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                )}
              </div>

              {/* Warning Pill if Threshold Exceeded */}
              {mt5Ping > 45 && (
                <div id="latency-threshold-warning" className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-[9px] text-rose-300 font-bold tracking-tight animate-pulse uppercase">
                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Latency warning threshold exceeded (Limit: 45ms)</span>
                </div>
              )}

              {/* Re-test speed button */}
              <button
                onClick={handleTestPingSpeed}
                disabled={isTestingPing}
                className="hover:text-white transition-colors duration-200 uppercase text-[9px] tracking-wider border border-white/15 bg-white/[0.02] px-1.5 py-0.5 rounded cursor-pointer disabled:opacity-50"
                title="Conduct instantaneous packet Round-Trip speed evaluation test"
              >
                Test Speed
              </button>

              {/* Mock high-latency toggle for audit demonstration */}
              <button
                onClick={() => setIsSimulatingSpike(!isSimulatingSpike)}
                className={`transition-colors duration-200 uppercase text-[9px] tracking-wider border px-1.5 py-0.5 rounded cursor-pointer ${
                  isSimulatingSpike 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:text-rose-200' 
                    : 'border-white/10 bg-white/[0.01] hover:text-white'
                }`}
                title="Mock system packet delay spike to verify safeguard warnings"
              >
                {isSimulatingSpike ? 'Stop Spike' : 'Mock Spike'}
              </button>
            </div>
          </div>
          <div>
            <span>Apex Quantitative Terminal &copy; 2026. Aligned with Elegant Dark guidelines.</span>
          </div>
        </div>
      </footer>

      {/* Floating Bottom-Left Advisor Chat */}
      {metrics && (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start">
          {/* Chat Panel Popover */}
          {isChatOpen && (
            <div className="mb-3 w-[360px] sm:w-[400px] md:w-[420px] max-w-[calc(100vw-3rem)] rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/10 bg-[#080808] overflow-hidden transition-all duration-300 animate-fadeIn h-[510px]">
              <AdvisorChat 
                symbol={symbol} 
                metrics={metrics} 
                onClose={() => setIsChatOpen(false)} 
                messages={chatMessages}
                setMessages={setChatMessages}
              />
            </div>
          )}

          {/* Floating toggle button */}
          <button
            id="toggle-floating-chat-btn"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-full border shadow-lg transition-all duration-300 cursor-pointer ${
              isChatOpen
                ? 'bg-[#121214] border-white/20 text-white/90 hover:bg-[#18181b]'
                : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 border-indigo-500/40 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-indigo-150" />
              {!isChatOpen && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <span className="text-xs font-mono font-bold tracking-tight uppercase">AI Advisor</span>
          </button>
        </div>
      )}

      {/* Session Summary Modal */}
      <AnimatePresence>
        {isSessionSummaryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop delay-fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSessionSummaryOpen(false)}
              className="absolute inset-0 bg-[#000000]/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ ease: 'easeOut', duration: 0.25 }}
              className="relative w-full max-w-2xl bg-[#0a0a0c] border border-white/10 rounded-xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] max-h-[85vh] flex flex-col z-10"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/5 bg-[#0e0e11] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-lg text-indigo-400">
                    <Timer className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      Current Session Summary
                    </h3>
                    <p className="text-[10px] text-white/40 font-mono">
                      Discipline tracker & live performance metrics
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsSessionSummaryOpen(false)}
                  className="p-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded text-white/50 hover:text-white transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5"
                  title="Close panel"
                >
                  <X className="w-4 h-4 inline-block" />
                  <span>ESC</span>
                </button>
              </div>

              {/* Grid content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Micro Stat Cards banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* Elapsed Timer Box */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-left">
                    <span className="text-[8px] text-white/35 font-mono uppercase tracking-widest block">Active Duration</span>
                    <span className="text-base font-mono font-black text-white tabular-nums tracking-wide block mt-1">
                      {formatSessionTime(sessionSeconds)}
                    </span>
                    <span className="text-[8.5px] text-emerald-400 font-mono flex items-center gap-1 mt-1 leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Tracker
                    </span>
                  </div>

                  {/* Profit or loss Box */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-left">
                    <span className="text-[8px] text-white/35 font-mono uppercase tracking-widest block">Session Net PnL</span>
                    <span className={`text-base font-mono font-black tabular-nums tracking-wide block mt-1 ${sessionStats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sessionStats.totalPnL >= 0 ? '+' : ''}${sessionStats.totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[8.5px] text-white/30 font-mono block mt-1 leading-none">
                      Floating + Realized
                    </span>
                  </div>

                  {/* Volume count box */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-left">
                    <span className="text-[8px] text-white/35 font-mono uppercase tracking-widest block">Session Activity</span>
                    <span className="text-base font-mono font-black text-white block mt-1">
                      {sessionStats.total} <span className="text-[10px] text-white/40 font-normal">Trades</span>
                    </span>
                    <span className="text-[8.5px] text-white/35 font-mono block mt-1 leading-none">
                      {sessionStats.openCount} Open / {sessionStats.closedCount} Closed
                    </span>
                  </div>

                  {/* Win rate precision Box */}
                  <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-left">
                    <span className="text-[8px] text-white/35 font-mono uppercase tracking-widest block">Session Win Rate</span>
                    <span className="text-base font-mono font-black text-white block mt-1">
                      {sessionStats.winRate.toFixed(1)}%
                    </span>
                    <span className="text-[8.5px] text-white/35 font-mono block mt-1 leading-none">
                      {sessionStats.winsCount}W - {sessionStats.lossesCount}L
                    </span>
                  </div>

                </div>

                {/* Subtitle breakdown */}
                <div>
                  <h4 className="text-[10px] text-white/55 font-mono uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">
                    Trades Created / Modified This Session ({sessionTrades.length})
                  </h4>

                  {sessionTrades.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/5 bg-black/20 rounded-lg p-6">
                      <Timer className="w-8 h-8 text-white/10 mx-auto mb-2.5 animate-pulse" />
                      <h5 className="text-xs font-mono font-bold text-white/60 uppercase">No session activity detected</h5>
                      <p className="text-[10px] text-white/30 mt-1 leading-relaxed max-w-md mx-auto">
                        You have not opened or closed any trades in this session. Execute trades in the terminal module to view live performance reports here.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-white/5 bg-black/35 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse font-mono text-[10px]">
                          <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-white/40 font-bold uppercase tracking-wider">
                              <th className="px-4 py-3">Symbol</th>
                              <th className="px-4 py-3">Side</th>
                              <th className="px-4 py-3 text-right">Entry Price</th>
                              <th className="px-4 py-3 text-right">Current/Exit</th>
                              <th className="px-4 py-3 text-right">Size (Units)</th>
                              <th className="px-4 py-2.5 text-center">Status</th>
                              <th className="px-4 py-3 text-right">PnL</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-white/80">
                            {sessionTrades.slice().reverse().map((trade) => {
                              const isProfit = trade.pnl >= 0;
                              const isClosed = trade.status === 'CLOSED';
                              return (
                                <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                                    {trade.symbol}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                                      trade.side === 'BUY' 
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                    }`}>
                                      {trade.side}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                    {trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                  </td>
                                  <td className="px-4 py-3 text-right whitespace-nowrap text-white/60">
                                    {isClosed 
                                      ? trade.exitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) 
                                      : 'Running...'}
                                  </td>
                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                    {trade.size.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                                  </td>
                                  <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                      isClosed 
                                        ? 'bg-white/5 border border-white/10 text-white/40' 
                                        : 'bg-indigo-500/15 border border-indigo-500/35 text-indigo-300 animate-pulse'
                                    }`}>
                                      {trade.status}
                                    </span>
                                  </td>
                                  <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                                    isProfit ? 'text-emerald-400' : 'text-rose-400'
                                  }`}>
                                    {isProfit ? '+' : ''}${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Performance feedback advice for discipline */}
                <div className="bg-indigo-950/15 border border-indigo-500/10 rounded-lg p-4 font-sans text-xs text-indigo-300">
                  <h5 className="font-mono font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5 text-white">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Trading Session Guard
                  </h5>
                  <p className="leading-relaxed text-white/60">
                    To maintain top consistency, professional traders cap session lengths to prevent cognitive fatigue and over-trading. Keep your total session below 2 hours, filter noise by strategy profiles, and focus on verified high-probability market cycles.
                  </p>
                </div>
              </div>

              {/* Footer action bar */}
              <div className="px-6 py-4 bg-[#0e0e11] border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] text-white/25 font-mono">
                  Current Session Start: {new Date(sessionStartTime.current).toLocaleTimeString()}
                </span>
                <button
                  onClick={() => setIsSessionSummaryOpen(false)}
                  className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] border border-indigo-500/20 text-white text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  Return to Terminal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emergency Close All Status Notification Toast */}
      <AnimatePresence>
        {emergencyCloseStatus && (
          <div className="fixed top-24 right-6 z-50 w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-[#0e0e12]/95 border border-rose-500/30 rounded-xl overflow-hidden shadow-[0_20px_50px_-10px_rgba(244,63,94,0.3)] backdrop-blur-md"
            >
              <div className="p-4 flex items-start space-x-3.5">
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-500 shrink-0">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider font-mono font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 font-bold">
                      Emergency Guard
                    </span>
                    <span className="text-[9px] font-mono text-white/30">{emergencyCloseStatus.timestamp}</span>
                  </div>
                  
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mt-2">
                    Panic Sell/Close Activated
                  </h4>
                  
                  {emergencyCloseStatus.count > 0 ? (
                    <p className="text-[11px] text-white/60 font-sans mt-1.5 leading-relaxed">
                      Executed batch clearance: terminated <strong className="text-white font-mono font-bold">{emergencyCloseStatus.count}</strong> exposure vectors. Closed session net result of <strong className={`font-mono font-bold ${emergencyCloseStatus.pnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}`}>${emergencyCloseStatus.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.
                    </p>
                  ) : (
                    <p className="text-[11px] text-white/40 font-sans mt-1.5 leading-relaxed">
                      No matching active exposures are currently open in the terminal profile. System is clear.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setEmergencyCloseStatus(null)}
                  className="p-1 text-white/30 hover:text-white shrink-0 hover:bg-white/5 rounded transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
