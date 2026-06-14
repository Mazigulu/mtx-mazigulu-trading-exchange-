/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MarketSymbol, Candlestick, FVG, OrderBlock, LiquiditySweep, MarketMetrics, OrderBook, NewsEvent, Trade, PriceAlert } from './types';
import { motion, AnimatePresence } from 'motion/react';
import ChartContainer from './components/ChartContainer';
import AdvisorChat, { Message } from './components/AdvisorChat';
import EconomicCalendar from './components/EconomicCalendar';
import OrderBookTracker from './components/OrderBookTracker';
import CumulativeDepthChart from './components/CumulativeDepthChart';
import Mt5BridgeGuide from './components/Mt5BridgeGuide';
import TradeTerminal from './components/TradeTerminal';
import BacktestSimulator from './components/BacktestSimulator';
import PerformanceTracker from './components/PerformanceTracker';
import RiskDashboard from './components/RiskDashboard';
import SystemStatus from './components/SystemStatus';
import TradeExplainability from './components/TradeExplainability';
import CorrelationMatrix from './components/CorrelationMatrix';
import CorrelationHeatmap from './components/CorrelationHeatmap';
import InstitutionalSentimentGauge from './components/InstitutionalSentimentGauge';
import InstitutionalSweepAlert from './components/InstitutionalSweepAlert';
import InstitutionalNewsTicker from './components/InstitutionalNewsTicker';
import MarketSentimentHeatmap from './components/MarketSentimentHeatmap';
import DailyBriefing from './components/DailyBriefing';
import MarketMomentumGauge from './components/MarketMomentumGauge';
import SettingsPanel from './components/SettingsPanel';
import TickerPrice from './components/TickerPrice';
import TradeJournal from './components/TradeJournal';
import StrategyPerformanceChart from './components/StrategyPerformanceChart';
import { TradePositionRowItem } from './components/TradePositionRowItem';
import { BureaucracyModal } from './components/BureaucracyModal';
import LoginPage from './components/LoginPage';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { toPng } from 'html-to-image';
import { 
  HelpCircle, 
  Calendar,
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
  Menu,
  ChevronDown,
  ChevronUp,
  Camera,
  Timer,
  Filter,
  Share2,
  Check,
  Terminal,
  Folder,
  FileCode,
  Play,
  Square,
  Eye,
  Download,
  Minimize2,
  Maximize2,
  BookOpen,
  Scale,
  LogOut,
  Trash2,
  Plus,
  Sliders
} from 'lucide-react';

const emptyPositionsImg = new URL('./assets/images/empty_positions_1781203013885.jpg', import.meta.url).href;

const MTXquantLogo = ({ size = 40 }: { size?: number }) => {
  return (
    <div 
      style={{ width: size, height: size }} 
      className="rounded bg-gradient-to-br from-[#0c0c1e] to-[#07070f] border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.25)] relative overflow-hidden shrink-0"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.2),transparent)] pointer-events-none"></div>
      
      <svg viewBox="0 0 100 100" className="w-[66%] h-[66%] z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mtx-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <path d="M50 12 L84 32 L84 72 L50 92 L16 72 L16 32 Z" stroke="url(#mtx-gradient)" strokeWidth="4" strokeLinejoin="round" opacity="0.4" />
        <path d="M22 65 V35 L50 55 L78 35 V65" stroke="url(#mtx-gradient)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50 25 V40" stroke="#e0f2fe" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
        <path d="M38 25 H62" stroke="#e0f2fe" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
        <circle cx="78" cy="65" r="7" fill="#10b981" />
      </svg>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('apex_is_logged_in') === 'true';
    } catch {
      return false;
    }
  });
  const [traderEmail, setTraderEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('apex_trader_email') || 'maziguluj@gmail.com';
    } catch {
      return 'maziguluj@gmail.com';
    }
  });

  const handleLoginSuccess = (email: string) => {
    try {
      localStorage.setItem('apex_is_logged_in', 'true');
      localStorage.setItem('apex_trader_email', email);
    } catch (err) {
      console.error(err);
    }
    setTraderEmail(email);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('apex_is_logged_in');
    } catch (err) {
      console.error(err);
    }
    setIsLoggedIn(false);
  };

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

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'INTELLIGENCE' | 'EXECUTION' | 'RISK' | 'RESEARCH' | 'SETTINGS'>('INTELLIGENCE');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(true);
  const [symbol, setSymbol] = useState<MarketSymbol>('EUR/USD');
  const [jumpRange, setJumpRange] = useState<{ start: string; end: string; triggerId: number } | null>(null);
  const [sessionStartDate, setSessionStartDate] = useState('');
  const [sessionEndDate, setSessionEndDate] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mt5Ping, setMt5Ping] = useState<number>(12);
  const [isSimulatingSpike, setIsSimulatingSpike] = useState<boolean>(false);
  const [isTestingPing, setIsTestingPing] = useState<boolean>(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const sessionStartTime = useRef<number>(Date.now());
  const [isSessionSummaryOpen, setIsSessionSummaryOpen] = useState(false);
  
  // Compliance & Bureaucracy Modal State
  const [isBureaucracyModalOpen, setIsBureaucracyModalOpen] = useState(false);
  const [bureaucracyActiveTab, setBureaucracyActiveTab] = useState<'faq' | 'cookies' | 'privacy' | 'terms' | 'risk' | 'docs' | 'compliance'>('faq');

  // Research Tab quick-action filter toggles
  const [showSentimentGauge, setShowSentimentGauge] = useState<boolean>(true);
  const [showMarketSentimentHeatmap, setShowMarketSentimentHeatmap] = useState<boolean>(true);
  const [showSweepAlert, setShowSweepAlert] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);

  const openBureaucracyTab = (tab: 'faq' | 'cookies' | 'privacy' | 'terms' | 'risk' | 'docs' | 'compliance') => {
    setBureaucracyActiveTab(tab);
    setIsBureaucracyModalOpen(true);
  };
  const [emergencyCloseStatus, setEmergencyCloseStatus] = useState<{
    show: boolean;
    count: number;
    pnl: number;
    timestamp: string;
  } | null>(null);

  // --- Metatrader 5 Wrapper & EA Agentic States ---
  const [eaInputMagicNumber, setEaInputMagicNumber] = useState<number>(234567);
  const [eaInputRiskPct, setEaInputRiskPct] = useState<number>(1.0);
  const [eaInputSlippage, setEaInputSlippage] = useState<number>(3);
  const [eaInputTrailingStop, setEaInputTrailingStop] = useState<number>(10);
  const [eaInputBreakeven, setEaInputBreakeven] = useState<number>(15);
  const [eaActiveMode, setEaActiveMode] = useState<'COPILOT' | 'AUTOPILOT'>('COPILOT');
  const [mqlEditorTab, setMqlEditorTab] = useState<'MQL5_CODE' | 'EA_INPUTS' | 'TERMINAL_LOGS'>('MQL5_CODE');
  const [isCompilingMql, setIsCompilingMql] = useState<boolean>(false);
  const [compileSuccess, setCompileSuccess] = useState<boolean>(false);
  const [mqlConsoleLogs, setMqlConsoleLogs] = useState<string[]>([
    "2026.06.08 08:00:15.012 MetaTrader 5 Terminal Build 4022 started (Pepperstone Group)",
    "2026.06.08 08:00:15.845 MQL5 Cloud Network service initialized successfully",
    "2026.06.08 08:00:16.110 Secured socket link established with MTXquant Cloud Server",
    "2026.06.08 08:00:16.112 Terminal connected to Account #234567 on Pepperstone-MT5-Live-3",
    "2026.06.08 08:00:17.301 EX5 Analyzer: expert 'MTXquant_Agentic_ICT.ex5' loaded successfully",
    "2026.06.08 08:00:17.320 Expert Advisor initialized: 'MTXquant_Agentic_ICT.ex5' on EUR/USD, H4. Signal mode active."
  ]);

  // Append symbol-switch logs dynamically
  useEffect(() => {
    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '.');
    setMqlConsoleLogs(prev => [
      ...prev,
      `${timeStr}.104 Chart symbol switched to ${symbol}. Synchronizing H4 candlesticks buffer...`,
      `${timeStr}.218 MQL5 Expert Advisor updated subscription channels. Ready.`
    ].slice(-150)); // cap at 150 lines
  }, [symbol]);

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
  const [dailyPnLGoal, setDailyPnLGoal] = useState<number>(1000);
  const [trendProjectionEnabled, setTrendProjectionEnabled] = useState<boolean>(false);

  // Daily PnL threshold alerts options
  const [dailyPnLAlertEnabled, setDailyPnLAlertEnabled] = useState(false);
  const [dailyPnLPositiveThreshold, setDailyPnLPositiveThreshold] = useState(2000);
  const [dailyPnLNegativeThreshold, setDailyPnLNegativeThreshold] = useState(-1000);

  // Highlight Order blocks and FVG using D3 state to coordinate overlays
  const [highlightOrderBlocks, setHighlightOrderBlocks] = useState(false);
  const [resetChartKey, setResetChartKey] = useState(0);

  const hasTriggeredPositiveRef = useRef(false);
  const hasTriggeredNegativeRef = useRef(false);

  useEffect(() => {
    const checkSettings = () => {
      try {
        const saved = localStorage.getItem('apex_institutional_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setVolatilityAlertEnabled(!!parsed.volatilityAlertEnabled);
          if (typeof parsed.dailyPnLGoal === 'number') {
            setDailyPnLGoal(parsed.dailyPnLGoal);
          } else {
            setDailyPnLGoal(1000);
          }
          setDailyPnLAlertEnabled(!!parsed.dailyPnLAlertEnabled);
          setDailyPnLPositiveThreshold(typeof parsed.dailyPnLPositiveThreshold === 'number' ? parsed.dailyPnLPositiveThreshold : 2000);
          setDailyPnLNegativeThreshold(typeof parsed.dailyPnLNegativeThreshold === 'number' ? parsed.dailyPnLNegativeThreshold : -1000);
        } else {
          setVolatilityAlertEnabled(false);
          setDailyPnLGoal(1000);
          setDailyPnLAlertEnabled(false);
          setDailyPnLPositiveThreshold(2000);
          setDailyPnLNegativeThreshold(-1000);
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
      text: `Hello, trader. I am **MTX AI**, your Institutional Elite Advisor.

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
  const [showTWVP, setShowTWVP] = useState<boolean>(true);
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [expandedTradeIds, setExpandedTradeIds] = useState<Record<string, boolean>>({});
  const [positionSort, setPositionSort] = useState<'PROFITABLE' | 'MARGIN' | 'DURATION'>('PROFITABLE');
  const [positionFilter, setPositionFilter] = useState<'ALL' | 'WINNING' | 'LOSING'>('ALL');
  const [isCompactPositions, setIsCompactPositions] = useState<boolean>(false);
  const [showSessionPerformance, setShowSessionPerformance] = useState<boolean>(true);
  const [showPriceAlertsPanel, setShowPriceAlertsPanel] = useState<boolean>(false);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const stored = localStorage.getItem('priceAlerts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [newAlertSymbol, setNewAlertSymbol] = useState<MarketSymbol>('EUR/USD');
  const [newAlertPrice, setNewAlertPrice] = useState<string>('');
  const [newAlertCondition, setNewAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean>(
    typeof Notification !== 'undefined' ? Notification.permission === 'granted' : false
  );

  useEffect(() => {
    try {
      localStorage.setItem('priceAlerts', JSON.stringify(priceAlerts));
    } catch (e) {
      console.warn('Failed to save priceAlerts:', e);
    }
  }, [priceAlerts]);

  const requestNotificationAuth = async () => {
    if (typeof Notification === 'undefined') return;
    const per = await Notification.requestPermission();
    setNotificationPermissionGranted(per === 'granted');
  };

  useEffect(() => {
    const checkAlerts = async () => {
      const activeAlerts = priceAlerts.filter(a => !a.isTriggered);
      if (activeAlerts.length === 0) return;

      try {
        const res = await fetch('/api/market-prices');
        if (!res.ok) return;
        const prices: Record<string, number> = await res.json();

        let triggeredAny = false;
        const updatedAlerts = priceAlerts.map(alert => {
          if (alert.isTriggered) return alert;
          const currentPrice = prices[alert.symbol];
          if (currentPrice === undefined || currentPrice <= 0) return alert;

          let isTriggered = false;
          if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
            isTriggered = true;
          } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
            isTriggered = true;
          }

          if (isTriggered) {
            triggeredAny = true;
            const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '.');
            
            // 1. Log to MQL Console
            setMqlConsoleLogs(prev => [
              ...prev,
              `${timeStr}.992 [ALERT TRIGGERED] ${alert.symbol} price level crossed ${alert.condition === 'ABOVE' ? 'Above' : 'Below'} target of ${alert.targetPrice.toLocaleString()} (Current: ${currentPrice.toLocaleString()})`
            ].slice(-150));

            // 2. Play subtle UI standard push if supported
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              try {
                new Notification(`🔔 MTXquant Alert: ${alert.symbol}`, {
                  body: `${alert.symbol} achieved alert condition ${alert.condition} ${alert.targetPrice}! (Current Price: ${currentPrice})`,
                  tag: alert.id,
                  silent: false
                });
              } catch (err) {
                console.warn('Notification execution error:', err);
              }
            }

            return {
              ...alert,
              isTriggered: true,
              triggeredAt: new Date().toLocaleTimeString()
            };
          }
          return alert;
        });

        if (triggeredAny) {
          setPriceAlerts(updatedAlerts);
        }
      } catch (err) {
        console.warn('Failed alert check pass:', err);
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 5000);
    return () => clearInterval(interval);
  }, [priceAlerts]);

  const sortedActivePositions = useMemo(() => {
    const openPos = trades.filter(t => t.status === 'OPEN');
    const filteredPos = openPos.filter(t => {
      if (positionFilter === 'WINNING') return t.pnl > 0;
      if (positionFilter === 'LOSING') return t.pnl <= 0;
      return true;
    });
    return [...filteredPos].sort((a, b) => {
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
  }, [trades, positionSort, positionFilter]);

  const healthStats = useMemo(() => {
    const openPos = trades.filter(t => t.status === 'OPEN');
    let active = 0;
    let atRisk = 0;
    let profitable = 0;

    openPos.forEach(trade => {
      const pnlMultiplier = trade.side === 'BUY' ? 1 : -1;
      const slDiff = trade.stopLoss - trade.entryPrice;
      let pnlAtSL = 0;

      if (trade.symbol === 'BTC/USDT') {
        pnlAtSL = slDiff * trade.size * pnlMultiplier;
      } else if (trade.symbol === 'USD/JPY') {
        pnlAtSL = (slDiff / 0.01) * trade.size * 0.1 * pnlMultiplier;
      } else {
        pnlAtSL = (slDiff / 0.0001) * trade.size * 1.0 * pnlMultiplier;
      }

      const slProximity = pnlAtSL < 0 ? Math.max(0, Math.min(1, trade.pnl / pnlAtSL)) : 0;

      if (trade.pnl < 0) {
        if (slProximity >= 0.70) {
          atRisk++;
        } else {
          active++;
        }
      } else if (trade.pnl > 0) {
        profitable++;
      } else {
        active++;
      }
    });

    return { active, atRisk, profitable };
  }, [trades]);

  const toggleTradeExpand = (id: string) => {
    setExpandedTradeIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Browser-native desktop notification service for TP/SL hits
  const prevTradesRef = useRef<Trade[]>([]);

  useEffect(() => {
    // 1. Check if desktop notifications are enabled in local storage settings
    let desktopNotificationsEnabled = false;
    try {
      const saved = localStorage.getItem('apex_institutional_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        desktopNotificationsEnabled = !!parsed.desktopNotificationsEnabled;
      }
    } catch (e) {
      console.warn('Failed to parse settings for desktop notifications:', e);
    }

    const prevTrades = prevTradesRef.current;

    // We only evaluate transitions if we have a previous recorded state
    if (prevTrades && prevTrades.length > 0 && trades && trades.length > 0) {
      trades.forEach((currentTrade) => {
        // Find if this trade was OPEN in the last tick
        const wasOpen = prevTrades.find((t) => t.id === currentTrade.id && t.status === 'OPEN');
        if (wasOpen && currentTrade.status === 'CLOSED') {
          // Check if transition reason is due to hit stop-loss or take-profit
          const reason = currentTrade.reason || '';
          const isSL = reason.toLowerCase().includes('sl hit') || reason.toLowerCase().includes('stop-loss') || reason.toLowerCase().includes('stop loss');
          const isTP = reason.toLowerCase().includes('tp hit') || reason.toLowerCase().includes('take-profit') || reason.toLowerCase().includes('take profit');

          if (isSL || isTP) {
            const heading = isTP ? '🎯 Take-Profit Target Reached' : '🛡️ Stop-Loss Target Reached';
            const hitPrice = currentTrade.exitPrice || currentTrade.entryPrice;
            const pnlString = currentTrade.pnl >= 0 ? `+$${currentTrade.pnl}` : `-$${Math.abs(currentTrade.pnl)}`;
            const body = `${currentTrade.symbol} ${currentTrade.side} hit ${isTP ? 'TP' : 'SL'} at ${hitPrice}. Net PnL: ${pnlString}. Reason: ${reason}`;

            if (desktopNotificationsEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(heading, {
                  body,
                  tag: currentTrade.id,
                  icon: '/assets/favicon.png'
                });
              } catch (err) {
                console.error('Failed to trigger native Notification instance:', err);
              }
            }
          }
        }
      });
    }

    // Always update current ref
    prevTradesRef.current = trades;
  }, [trades]);

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
      link.download = `Positions_Overview_MTXquant_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
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

  const [shareSuccess, setShareSuccess] = useState(false);

  const handleSharePositions = async () => {
    const openPos = trades.filter(t => t.status === 'OPEN');
    const totalPnl = openPos.reduce((sum, t) => sum + t.pnl, 0);
    const sign = totalPnl >= 0 ? '+' : '';
    const timestamp = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      timeZoneName: 'short' 
    });

    let textSummary = `⚡ MTXQUANT INSTITUTIONAL ACTIVE EXPOSURES SUMMARY ⚡\n`;
    textSummary += `==============================================\n`;
    textSummary += `Generated At       : ${timestamp}\n`;
    textSummary += `Active Positions   : ${openPos.length}\n`;
    textSummary += `Total Floating PnL : ${sign}$${totalPnl.toFixed(2)}\n`;
    textSummary += `==============================================\n\n`;

    if (openPos.length === 0) {
      textSummary += `No active micro-leveraged exposures are currently open in the market.\n`;
    } else {
      textSummary += `Active Positions Detail:\n`;
      openPos.forEach((t, idx) => {
        const signRow = t.pnl >= 0 ? '+' : '';
        textSummary += `${idx + 1}. [${t.side}] ${t.symbol}\n`;
        textSummary += `   • Size       : ${t.size} Lots\n`;
        textSummary += `   • Entry Price: ${t.entryPrice.toFixed(t.symbol === 'USD/JPY' ? 3 : t.symbol === 'BTC/USDT' ? 1 : 5)}\n`;
        textSummary += `   • SL / TP    : ${t.stopLoss.toFixed(t.symbol === 'USD/JPY' ? 3 : t.symbol === 'BTC/USDT' ? 1 : 5)} / ${t.takeProfit.toFixed(t.symbol === 'USD/JPY' ? 3 : t.symbol === 'BTC/USDT' ? 1 : 5)}\n`;
        textSummary += `   • Net PnL    : ${signRow}$${t.pnl.toFixed(2)}\n`;
        textSummary += `   • Duration   : ${formatOpenDuration(t.timestamp)}\n\n`;
      });
    }

    textSummary += `==============================================\n`;
    textSummary += `MTXquant Institutional Risk & Position Engine active.`;

    try {
      await navigator.clipboard.writeText(textSummary);
      setShareSuccess(true);
      setTimeout(() => {
        setShareSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy positions summary to clipboard:', err);
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
      // Load current bindings dynamically from localStorage settings
      let emergencyCloseBind = 'ALT+X';
      let toggleVolatilityBind = 'ALT+V';
      let tabDashboardBind = 'ALT+D';
      let tabResearchBind = 'ALT+R';
      let tabExecutionBind = 'ALT+E';
      let tabSettingsBind = 'ALT+S';

      try {
        const saved = localStorage.getItem('apex_institutional_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.keybindEmergencyClose) emergencyCloseBind = parsed.keybindEmergencyClose.toUpperCase();
          if (parsed.keybindToggleVolatility) toggleVolatilityBind = parsed.keybindToggleVolatility.toUpperCase();
          if (parsed.keybindTabDashboard) tabDashboardBind = parsed.keybindTabDashboard.toUpperCase();
          if (parsed.keybindTabResearch) tabResearchBind = parsed.keybindTabResearch.toUpperCase();
          if (parsed.keybindTabExecution) tabExecutionBind = parsed.keybindTabExecution.toUpperCase();
          if (parsed.keybindTabSettings) tabSettingsBind = parsed.keybindTabSettings.toUpperCase();
        }
      } catch (err) {
        console.warn('Failed to read bindings in hotkey tracker:', err);
      }

      // Format current event shortcut string
      const pressedKeys: string[] = [];
      if (e.ctrlKey) pressedKeys.push('CTRL');
      if (e.metaKey) pressedKeys.push('META');
      if (e.altKey) pressedKeys.push('ALT');
      if (e.shiftKey) pressedKeys.push('SHIFT');

      const keyName = e.key;
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(keyName)) {
        const formattedKey = keyName.length === 1 ? keyName.toUpperCase() : keyName;
        pressedKeys.push(formattedKey);
      }

      const pressedShortcut = pressedKeys.join('+');

      // Fallback for default Alt+X handling on different physical styles (e.g. macOS keys like œ or ≈)
      const isAltXFallback = e.altKey && (e.key === 'x' || e.key === 'X' || e.code === 'KeyX' || e.key === '≈' || e.key === 'œ');

      // Matching and execution paths
      if (pressedShortcut === emergencyCloseBind || (emergencyCloseBind === 'ALT+X' && isAltXFallback)) {
        e.preventDefault();
        handleEmergencyCloseAll();
      } else if (pressedShortcut === toggleVolatilityBind) {
        e.preventDefault();
        setVolatilityAlertEnabled(prev => !prev);
      } else if (pressedShortcut === tabDashboardBind) {
        e.preventDefault();
        setActiveTab('DASHBOARD');
      } else if (pressedShortcut === tabResearchBind) {
        e.preventDefault();
        setActiveTab('RESEARCH');
      } else if (pressedShortcut === tabExecutionBind) {
        e.preventDefault();
        setActiveTab('EXECUTION');
      } else if (pressedShortcut === tabSettingsBind) {
        e.preventDefault();
        setActiveTab('SETTINGS');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trades]);

  const handleReplayClosedTrade = (trade: Trade) => {
    if (!trade.timestamp) return;

    // Set the asset symbol so the chart renders correct candlesticks
    setSymbol(trade.symbol);

    const entryTimeMs = new Date(trade.timestamp).getTime();
    if (isNaN(entryTimeMs)) return;

    // Use exitTimestamp if present, otherwise default to 3 hours after entry
    const exitTimeMs = trade.exitTimestamp 
      ? new Date(trade.exitTimestamp).getTime() 
      : entryTimeMs + 3 * 60 * 60 * 1000;

    // Pad with 1 hour before entry and 1 hour after exit
    const padding = 1 * 60 * 60 * 1000; 
    const rangeStart = new Date(entryTimeMs - padding);
    const rangeEnd = new Date(exitTimeMs + padding);

    // Formulate ISO strings
    const startIso = rangeStart.toISOString();
    const endIso = rangeEnd.toISOString();

    // Populate Replay date fields
    setSessionStartDate(startIso.substring(0, 10));
    setSessionEndDate(endIso.substring(0, 10));

    // Jump replay engine
    setJumpRange({
      start: startIso,
      end: endIso,
      triggerId: Date.now()
    });

    // Scroll up to the chart container so the user instantly notices the visual jump
    setTimeout(() => {
      const chartContainer = document.getElementById('market-chart-viewport') || document.getElementById('chart-container');
      if (chartContainer) {
        chartContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

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
      floatingPnL: activePnL,
      realizedDailyPnL: (closedTrades.filter(t => {
        const dt = new Date(t.timestamp);
        const diff = Date.now() - dt.getTime();
        return diff < 86400000;
      }).reduce((acc, t) => acc + t.pnl, 0) || 542.80)
    };
  }, [trades, candles]);

  // Dynamic Trend Strength & ICT Displacement Intensity tracker
  const dynamicTrendMeter = useMemo(() => {
    // 1. Calculate base trend score
    let baseTrendScore = 50;
    if (metrics) {
      const rsiDev = Math.abs(metrics.rsi - 50) * 2; // up to 100
      baseTrendScore = Math.round((metrics.trend !== 'NEUTRAL' ? 62 : 38) + (rsiDev * 0.38));
    } else if (candles && candles.length >= 10) {
      const last = candles[candles.length - 1];
      const prev = candles[candles.length - 5];
      const diff = Math.abs(last.close - prev.close) / prev.close;
      baseTrendScore = Math.min(100, Math.max(15, Math.round(50 + diff * 6200)));
    }
    baseTrendScore = Math.min(100, Math.max(5, baseTrendScore));

    // 2. Calculate ICT Displacement Intensity
    let displacementIntensity = 38;
    let displacementLabel = 'Steady Flow';
    let displacementColorClass = 'text-blue-400';
    
    if (candles && candles.length >= 15) {
      const allBodies = candles.slice(-15).map(c => Math.abs(c.close - c.open));
      const avgBody = allBodies.reduce((a, b) => a + b, 0) / allBodies.length || 0.0001;
      const latestBody = Math.abs(candles[candles.length - 1].close - candles[candles.length - 1].open);
      
      const ratio = latestBody / avgBody;
      displacementIntensity = Math.min(100, Math.max(8, Math.round(ratio * 38 + 18)));
    }
    
    if (displacementIntensity >= 75) {
      displacementLabel = 'INSTITUTIONAL EXPANSION';
      displacementColorClass = 'text-rose-455 animate-pulse';
    } else if (displacementIntensity >= 50) {
      displacementLabel = 'LIQUIDITY DISPLACEMENT';
      displacementColorClass = 'text-amber-450';
    } else if (displacementIntensity >= 25) {
      displacementLabel = 'DISPLACEMENT ACCUMULATION';
      displacementColorClass = 'text-indigo-400';
    } else {
      displacementLabel = 'ORDERFLOW COMPRESSION';
      displacementColorClass = 'text-emerald-400';
    }

    // Combine trend score & displacement intensity into an aggregate Trend Strength Metric
    const aggregateStrength = Math.round((baseTrendScore * 0.55) + (displacementIntensity * 0.45));
    
    let strengthLabel = 'NEUTRAL';
    let strengthColor = 'text-white/60';
    let strengthRingColor = 'border-white/10';
    let strengthBg = 'from-zinc-500/10 to-transparent';
    
    if (aggregateStrength >= 80) {
      strengthLabel = 'HYPER-EXPANSION';
      strengthColor = 'text-rose-400';
      strengthRingColor = 'border-rose-500/25 bg-rose-500/5';
      strengthBg = 'from-rose-550/15 via-rose-500/[0.03] to-transparent';
    } else if (aggregateStrength >= 60) {
      strengthLabel = 'AGGRESSIVE TREND';
      strengthColor = 'text-amber-400';
      strengthRingColor = 'border-amber-500/20 bg-amber-500/5';
      strengthBg = 'from-amber-500/10 via-amber-500/[0.02] to-transparent';
    } else if (aggregateStrength >= 35) {
      strengthLabel = 'BALANCED FLOW';
      strengthColor = 'text-indigo-400';
      strengthRingColor = 'border-indigo-500/20 bg-indigo-500/5';
      strengthBg = 'from-indigo-550/10 via-indigo-500/[0.01] to-transparent';
    } else {
      strengthLabel = 'MEAN REVERTING';
      strengthColor = 'text-emerald-400';
      strengthRingColor = 'border-emerald-500/20 bg-emerald-500/5';
      strengthBg = 'from-emerald-500/10 via-emerald-500/[0.01] to-transparent';
    }

    return {
      trendScore: baseTrendScore,
      displacementIntensity,
      displacementLabel,
      displacementColorClass,
      aggregateStrength,
      strengthLabel,
      strengthColor,
      strengthRingColor,
      strengthBg
    };
  }, [candles, metrics, trades]);

  // Monitor Daily PnL threshold alerts and trigger browser-native desktop notifications
  useEffect(() => {
    if (!dailyPnLAlertEnabled) {
      hasTriggeredPositiveRef.current = false;
      hasTriggeredNegativeRef.current = false;
      return;
    }

    const currentDailyPnL = systemDashboardSummary.dailyPnL;

    // Check positive (profit) threshold
    if (currentDailyPnL >= dailyPnLPositiveThreshold) {
      if (!hasTriggeredPositiveRef.current) {
        hasTriggeredPositiveRef.current = true;
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('📈 Daily Profit Threshold Reached', {
              body: `Your daily PnL of $${currentDailyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has reached or exceeded your profit threshold of $${dailyPnLPositiveThreshold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
              icon: '/assets/favicon.png'
            });
          } catch (err) {
            console.error('Failed to trigger daily profit target notification:', err);
          }
        }
      }
    } else {
      // Allow re-triggers if it falls below the profit threshold
      hasTriggeredPositiveRef.current = false;
    }

    // Check negative (loss) threshold
    // Handle either negatively entered or positively entered threshold (e.g. -1000 or 1000 for loss limit)
    const resolvedMinLimit = dailyPnLNegativeThreshold < 0 ? dailyPnLNegativeThreshold : -Math.abs(dailyPnLNegativeThreshold);
    
    if (currentDailyPnL <= resolvedMinLimit) {
      if (!hasTriggeredNegativeRef.current) {
        hasTriggeredNegativeRef.current = true;
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('🚨 Daily Loss Threshold Reached', {
              body: `Your daily PnL of $${currentDailyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has dropped to or below your loss limit threshold of $${resolvedMinLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
              icon: '/assets/favicon.png'
            });
          } catch (err) {
            console.error('Failed to trigger daily loss target notification:', err);
          }
        }
      }
    } else {
      // Allow re-triggers if it goes back out of danger
      hasTriggeredNegativeRef.current = false;
    }
  }, [
    systemDashboardSummary.dailyPnL,
    dailyPnLAlertEnabled,
    dailyPnLPositiveThreshold,
    dailyPnLNegativeThreshold
  ]);
  
  // Dataset for 'Projection vs Actual' Area Chart tracking cumulative performance against institutional goals
  const projectionVsActualData = useMemo(() => {
    const dailyPnL = systemDashboardSummary.dailyPnL;
    // User-configurable daily performance goal
    const targetGoal = dailyPnLGoal;
    const hours = [
      '08:00', '09:00', '10:00', '11:00', '12:00', 
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];
    
    // Cumulative ratios representing progress toward final daily PnL, with realistic intraday pullbacks
    const pnlRatios = [0.10, 0.18, 0.30, 0.25, 0.42, 0.55, 0.51, 0.68, 0.82, 0.92, 1.00];

    // Determine the current pivot hour for trend projection (e.g. based on current hour from 08:00 to 18:00)
    const currentHourNum = new Date().getHours();
    let currentHourIdx = currentHourNum - 8;
    if (currentHourIdx < 1 || currentHourIdx >= 10) {
      currentHourIdx = 5; // default to 13:00 mid-session pivot
    }
    
    const pivotRatio = pnlRatios[currentHourIdx] !== undefined ? pnlRatios[currentHourIdx] : ((currentHourIdx + 1) / hours.length);
    const pivotActual = Math.round(dailyPnL * pivotRatio);
    const slope = pivotActual / (currentHourIdx + 1);
    
    const dataPoints = hours.map((hour, idx) => {
      const fraction = (idx + 1) / hours.length;
      const targetProj = Math.round(targetGoal * fraction);
      const ratio = pnlRatios[idx] !== undefined ? pnlRatios[idx] : fraction;
      const actualVal = Math.round(dailyPnL * ratio);
      
      // Calculate Trend Projection:
      // Starting from 08:00, extend the slope of the current pivot hour up to the end of day (18:00)
      const trendProjVal = Math.round(slope * (idx + 1));
      
      return {
        hour,
        'Daily Goal': targetProj,
        'Actual PnL': actualVal,
        'Trend Projection': trendProjVal
      };
    });

    // Compute hourly changes (differences between consecutive hours)
    return dataPoints.map((dp, idx) => {
      const previousValue = idx > 0 ? dataPoints[idx - 1]['Actual PnL'] : 0;
      const hourlyChange = dp['Actual PnL'] - previousValue;
      return {
        ...dp,
        hourlyChange
      };
    });
  }, [systemDashboardSummary.dailyPnL, dailyPnLGoal]);
  
  // Dynamic pivot hour description for interactive Trend Projection toggle
  const currentPivotHourText = useMemo(() => {
    const currentHourNum = new Date().getHours();
    let currentHourIdx = currentHourNum - 8;
    if (currentHourIdx < 1 || currentHourIdx >= 10) {
      currentHourIdx = 5;
    }
    const hours = [
      '08:00', '09:00', '10:00', '11:00', '12:00', 
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];
    return hours[currentHourIdx];
  }, []);

  // Simulated live prices for ticker blocks
  const tickerStats: Record<MarketSymbol, { name: string; price: number; pChange: number }> = {
    'EUR/USD': { name: 'EURUSD', price: symbol === 'EUR/USD' ? (candles[candles.length - 1]?.close || 1.1645) : 1.1645, pChange: +0.25 },
    'GBP/USD': { name: 'GBPUSD', price: symbol === 'GBP/USD' ? (candles[candles.length - 1]?.close || 1.2680) : 1.2680, pChange: +0.14 },
    'USD/JPY': { name: 'USDJPY', price: symbol === 'USD/JPY' ? (candles[candles.length - 1]?.close || 155.40) : 155.40, pChange: -0.32 },
    'AUD/USD': { name: 'AUDUSD', price: symbol === 'AUD/USD' ? (candles[candles.length - 1]?.close || 0.6650) : 0.6650, pChange: +0.11 },
    'EUR/GBP': { name: 'EURGBP', price: symbol === 'EUR/GBP' ? (candles[candles.length - 1]?.close || 0.8520) : 0.8520, pChange: -0.05 },
    'GOLD/USD': { name: 'GOLDUSD', price: symbol === 'GOLD/USD' ? (candles[candles.length - 1]?.close || 2355.50) : 2355.50, pChange: +0.42 },
    'SILVER/USD': { name: 'SILVERUSD', price: symbol === 'SILVER/USD' ? (candles[candles.length - 1]?.close || 29.50) : 29.50, pChange: +0.58 },
    'BTC/USDT': { name: 'BTCUSDT', price: symbol === 'BTC/USDT' ? (candles[candles.length - 1]?.close || 67500.0) : 67500.0, pChange: +1.82 },
    'ETH/USDT': { name: 'ETHUSDT', price: symbol === 'ETH/USDT' ? (candles[candles.length - 1]?.close || 3450.0) : 3450.0, pChange: +1.45 },
    'SOL/USDT': { name: 'SOLUSDT', price: symbol === 'SOL/USDT' ? (candles[candles.length - 1]?.close || 148.55) : 148.55, pChange: +2.10 },
    'US30': { name: 'US30', price: symbol === 'US30' ? (candles[candles.length - 1]?.close || 38850.0) : 38850.0, pChange: +0.35 },
    'NAS100': { name: 'NAS100', price: symbol === 'NAS100' ? (candles[candles.length - 1]?.close || 18550.0) : 18550.0, pChange: +0.52 },
    'GER40': { name: 'GER40', price: symbol === 'GER40' ? (candles[candles.length - 1]?.close || 18200.0) : 18200.0, pChange: -0.15 },
    'SPX500': { name: 'SPX500', price: symbol === 'SPX500' ? (candles[candles.length - 1]?.close || 5300.0) : 5300.0, pChange: +0.28 },
  };

  if (!isLoggedIn) {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess} 
        defaultEmail={traderEmail} 
      />
    );
  }

  return (
    <div id="mtxquant-app-root" className="min-h-screen bg-[#050505] font-sans text-[#e5e5e5] flex selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Retractable Left-Hand Side Menu Navigation - Hidden on mobile screens */}
      <aside
        id="reproducible-side-nav"
        className={`fixed inset-y-0 left-0 z-40 bg-[#080808] border-r border-white/10 flex-col justify-between transition-all duration-300 ease-in-out hidden md:flex ${
          isSidebarExpanded ? 'w-64 shadow-[10px_0_35px_rgba(0,0,0,0.7)]' : 'w-16 shadow-none'
        }`}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        <div className="flex flex-col h-full justify-between py-5 overflow-y-auto overflow-x-hidden no-scrollbar">
          <div>
            {/* Top section: Brand Identity Logo */}
            <div className="px-3 mb-8 flex items-center gap-3">
              <div className="relative shrink-0">
                <MTXquantLogo size={40} />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>

              {isSidebarExpanded && (
                <div className="whitespace-nowrap animate-fadeIn">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      MTXQUANT<span className="text-indigo-500 font-extrabold">.AI</span>
                    </span>
                    <span className="px-1 py-0.2 rounded bg-white/5 border border-white/10 text-[7px] font-mono uppercase tracking-wide text-[#e5e5e5]/60 font-bold">
                      v2.0
                    </span>
                  </div>
                  <p className="text-[8.5px] text-white/40 font-serif italic font-light tracking-wide leading-none mt-1">
                    Institutional Decision Engine
                  </p>
                </div>
              )}
            </div>

            {/* Middle section: Navigation Links */}
            <nav className="space-y-2 px-2.5">
              {[
                { id: 'INTELLIGENCE', label: 'Intelligence', icon: Bot },
                { id: 'DASHBOARD', label: 'Dashboard', icon: Layers },
                { id: 'EXECUTION', label: 'Execution', icon: Activity },
                { id: 'RISK', label: 'Risk Desk', icon: ShieldAlert },
                { id: 'RESEARCH', label: 'Research', icon: Award },
                { id: 'SETTINGS', label: 'Settings', icon: Settings }
              ].map((item) => {
                const active = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`side-nav-tab-${item.id.toLowerCase()}`}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full py-3 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-150 flex items-center gap-3 cursor-pointer ${
                      active
                        ? 'bg-indigo-600/15 text-white border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-black'
                        : 'text-[#e5e5e5]/50 hover:text-white hover:bg-white/[0.03] border border-transparent'
                    } ${isSidebarExpanded ? 'px-4' : 'justify-center px-0'}`}
                    title={item.label}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-indigo-400 stroke-[2.5px]' : 'text-white/40'}`} />
                    {isSidebarExpanded && (
                      <span className="whitespace-nowrap animate-fadeIn">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Compliance & Bureaucracy Sidebar item */}
              <button
                id="side-nav-tab-compliance-docs"
                onClick={() => openBureaucracyTab('faq')}
                className={`w-full py-3 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-150 flex items-center gap-3 cursor-pointer text-[#e5e5e5]/50 hover:text-white hover:bg-white/[0.03] border border-transparent ${isSidebarExpanded ? 'px-4' : 'justify-center px-0'}`}
                title="Compliance & Documentation"
              >
                <HelpCircle className="w-4 h-4 text-white/40 shrink-0 hover:text-indigo-400 transition-colors" />
                {isSidebarExpanded && (
                  <span className="whitespace-nowrap animate-fadeIn text-white/70">
                    Docs & Compliance
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Bottom section: Connectivity Indicators */}
          <div className="px-3 pt-4 border-t border-white/5">
            <div className={`flex items-center gap-2.5 ${isSidebarExpanded ? 'px-1' : 'justify-center'}`}>
              <div className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              {isSidebarExpanded && (
                <span className="text-[8.5px] font-mono text-emerald-400 font-bold uppercase tracking-wider whitespace-nowrap animate-fadeIn">
                  System Online
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area Container with static padding to allow the expanded menu to overlap gracefully */}
      <div
        className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ease-in-out justify-between pl-0 pb-16 md:pb-0 md:pl-16"
      >
        {/* Top Status Header Bar */}
        <header className="border-b border-white/10 bg-[#080808]/80 backdrop-blur sticky top-0 z-30">
          <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-3 flex items-center justify-between gap-4">
            
            {/* Mobile Brand Logo & Active Sub-Workspace Label Badge */}
            <div className="flex items-center space-x-3.5">
              {/* Mobile Menu Hamburger Toggle */}
              <button
                id="mobile-menu-hamburger-toggle"
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex md:hidden p-1.5 hover:bg-white/5 border border-white/10 rounded-md text-white/60 hover:text-white transition-all cursor-pointer h-8 w-8 items-center justify-center shrink-0"
                title="Open Mobile Navigation Menu"
              >
                <Menu className="w-4 h-4 text-white" />
              </button>

              {/* Logo block rendered exclusively on mobile devices */}
              <div id="mobile-brand-logo" className="flex md:hidden items-center gap-1.5 shrink-0 select-none">
                <MTXquantLogo size={28} />
                <span className="text-[10px] font-black uppercase tracking-wider text-white">
                  MTXQUANT<span className="text-indigo-400 font-extrabold">.AI</span>
                </span>
              </div>

              {/* Standard workspace indicator for desktop screens only */}
              <div className="hidden md:flex items-center space-x-2.5">
                <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider font-bold">Active Workspace:</span>
                <span className="px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">
                  {activeTab === 'RISK' ? 'Risk Desk' : activeTab}
                </span>
              </div>
            </div>

            {/* Active status indicator ledger */}
            <div className="flex items-center space-x-2 md:space-x-3">
              {/* User Profile info and Logout button */}
              <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/5 rounded h-8">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
                <span className="text-[10px] font-mono text-white/50 font-bold max-w-[130px] truncate" title={traderEmail}>
                  {traderEmail}
                </span>
              </div>
              <button
                id="header-logout-btn"
                onClick={handleLogout}
                className="p-1.5 hover:bg-rose-500/10 hover:text-rose-300 border border-white/10 hover:border-rose-500/25 rounded text-rose-400 transition-all flex items-center justify-center cursor-pointer h-8 px-2.5 text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 gap-1.5"
                title={`Log Out from ${traderEmail}`}
              >
                <span className="hidden sm:inline">Log Out</span>
                <LogOut className="w-3.5 h-3.5" />
              </button>

              <button
                id="global-theme-toggle-btn"
                onClick={toggleTheme}
                className="p-1.5 hover:bg-white/5 border border-white/10 rounded text-white/60 hover:text-white transition-colors flex items-center justify-center cursor-pointer h-8 w-8 text-xs shrink-0"
                title={theme === 'dark' ? 'Switch to High-Contrast Light Mode' : 'Switch to Elegant Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
              <button
                id="manual-refresh-btn"
                onClick={handleManualRefresh}
                className="p-1.5 hover:bg-white/5 border border-white/10 rounded text-white/60 hover:text-white transition-colors h-8 w-8 flex items-center justify-center shrink-0"
                title="Manual Sync Feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
              
              {/* Session Time Discipline Indicator - hidden on mobile to avoid row leaks */}
              <button
                id="session-discipline-tracker"
                onClick={() => setIsSessionSummaryOpen(true)}
                className="hidden md:flex items-center space-x-2 px-2.5 py-1.5 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 hover:border-indigo-500/35 rounded font-mono text-[11px] h-9 transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-indigo-500/30 font-bold"
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

              {/* Alt+X Emergency panic close all button - hidden on mobile since physical keyboard shortcut is absent */}
              <button
                id="emergency-close-all-btn"
                onClick={handleEmergencyCloseAll}
                className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded font-mono text-[11px] h-9 text-rose-400 font-bold transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500/30"
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



      {/* Core Dynamic Workplace Area */}
      <main className="max-w-[1400px] mx-auto w-full px-3 md:px-6 py-2 md:py-6 flex-1">
        
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
                className="mb-6 bg-gradient-to-r from-[#170508] via-[#0c0c0e] to-[#0a0a0c] border border-rose-500/50 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl animate-fadeIn relative overflow-hidden"
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-white/[0.03]">
                      <div className="flex items-center justify-between sm:justify-start gap-2.5">
                        <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          Goals vs Performance
                        </span>
                        {/* Interactive Trend Projection Toggle */}
                        <button
                          id="btn-toggle-trend-projection"
                          onClick={() => setTrendProjectionEnabled(!trendProjectionEnabled)}
                          className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer select-none h-4.5 ${
                            trendProjectionEnabled
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                              : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                          }`}
                          title={`Toggle Trend Projection Line (extending current ${currentPivotHourText} slope to close)`}
                        >
                          <TrendingUp className="w-2 text-white" />
                          <span>Proj Trend</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 font-mono text-[9px] bg-white/[0.01] px-2 py-0.5 rounded border border-white/5">
                        <div className="flex items-center gap-1">
                          <span className="text-white/30">Goal:</span>
                          <span className="text-indigo-400 font-bold">${dailyPnLGoal.toLocaleString()}</span>
                        </div>
                        <span className="text-white/10 hidden sm:inline">|</span>
                        <div className="flex items-center gap-1">
                          <span className="text-white/30">Actual:</span>
                          <span className={`${systemDashboardSummary.dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>
                            ${systemDashboardSummary.dailyPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="h-[75px] md:h-[80px] w-full mt-2.5">
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
                                const activeHourIdx = projectionVsActualData.findIndex(item => item.hour === dataPoint.hour);
                                const historicalHours = projectionVsActualData.slice(0, activeHourIdx + 1);
                                const isAhead = dataPoint['Actual PnL'] >= dataPoint['Daily Goal'];
                                const diff = dataPoint['Actual PnL'] - dataPoint['Daily Goal'];
                                const accentBorder = isAhead 
                                  ? 'border-emerald-500/50 border-l-3 border-l-emerald-500' 
                                  : 'border-rose-500/50 border-l-3 border-l-rose-500';

                                return (
                                  <div className={`bg-[#0c0c0e]/95 border ${accentBorder} px-3 py-2.5 text-[9px] font-mono rounded-lg shadow-[0_16px_36px_rgba(0,0,0,0.95)] text-left leading-tight z-50 w-[240px] pointer-events-none backdrop-blur-md`}>
                                    {/* Snapshot Header */}
                                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                                      <span className="text-white font-bold text-[10px] flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                        {dataPoint.hour} Update
                                      </span>
                                      <span className="text-white/40 text-[8px] uppercase tracking-wider">Trading Progress</span>
                                    </div>

                                    {/* Core Stats Grid (Adapts to 3 columns if Trend is toggled) */}
                                    <div className={`grid ${trendProjectionEnabled ? 'grid-cols-3' : 'grid-cols-2'} gap-x-2 gap-y-1 mb-2`}>
                                      <div>
                                        <div className="text-white/30 text-[7.5px] uppercase tracking-wider">Goal Target</div>
                                        <div className="text-indigo-300 font-bold mt-0.5">${dataPoint['Daily Goal'].toLocaleString()}</div>
                                      </div>
                                      <div>
                                        <div className="text-white/30 text-[7.5px] uppercase tracking-wider">Actual PnL</div>
                                        <div className={`font-bold mt-0.5 ${dataPoint['Actual PnL'] >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                          ${dataPoint['Actual PnL'] >= 0 ? '+' : ''}{dataPoint['Actual PnL'].toLocaleString()}
                                        </div>
                                      </div>
                                      {trendProjectionEnabled && (
                                        <div>
                                          <div className="text-amber-400/70 text-[7.5px] uppercase tracking-wider">Trend Proj</div>
                                          <div className={`font-bold mt-0.5 ${dataPoint['Trend Projection'] >= 0 ? 'text-amber-400' : 'text-rose-300'}`}>
                                            ${dataPoint['Trend Projection'] >= 0 ? '+' : ''}{dataPoint['Trend Projection'].toLocaleString()}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Divergence warning or accolade */}
                                    <div className={`p-1 rounded text-[8px] font-bold text-center border mb-2 flex items-center justify-center gap-1 leading-none ${
                                      isAhead 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    }`}>
                                      {isAhead ? (
                                        <>+ Ahead of Goal by ${diff.toLocaleString()}</>
                                      ) : (
                                        <>- Behind Goal by ${Math.abs(diff).toLocaleString()}</>
                                      )}
                                    </div>

                                    {/* Trend Projection divergence highlight bar */}
                                    {trendProjectionEnabled && (
                                      <div className={`p-1 rounded text-[8px] font-bold text-center border mb-2 flex items-center justify-center gap-1 leading-none ${
                                        dataPoint['Trend Projection'] >= dataPoint['Daily Goal']
                                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                      }`}>
                                        {dataPoint['Trend Projection'] >= dataPoint['Daily Goal'] ? (
                                          <>Trend: Ahead of Goal by ${(dataPoint['Trend Projection'] - dataPoint['Daily Goal']).toLocaleString()}</>
                                        ) : (
                                          <>Trend: Behind Goal by ${(dataPoint['Daily Goal'] - dataPoint['Trend Projection']).toLocaleString()}</>
                                        )}
                                      </div>
                                    )}

                                    {/* Hourly Breakdown Subsection */}
                                    <div className="border-t border-white/5 pt-1.5">
                                      <div className="text-[7.5px] text-white/30 uppercase font-black tracking-wider mb-1 flex items-center justify-between">
                                        <span>Historical Timeline</span>
                                        <span>Hourly Delta</span>
                                      </div>
                                      <div className="space-y-1 max-h-[140px] overflow-y-auto no-scrollbar">
                                        {historicalHours.map((hist, hIdx) => {
                                          const isPositive = hist.hourlyChange >= 0;
                                          return (
                                            <div key={hist.hour} className="flex justify-between items-center text-[8.5px] py-0.5 border-b border-white/[0.02]">
                                              <span className="text-white/50">
                                                {hist.hour} &middot; <span className="font-semibold text-white/80">${hist['Actual PnL']}</span>
                                              </span>
                                              <span className={`font-mono text-[8.5px] flex items-center gap-0.5 ${isPositive ? 'text-emerald-500' : 'text-rose-400'}`}>
                                                {hIdx === 0 ? '' : (isPositive ? '▲' : '▼')}
                                                {hIdx === 0 ? `$${hist.hourlyChange}` : `$${Math.abs(hist.hourlyChange)}`}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
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
                          {trendProjectionEnabled && (
                            <Line
                              type="monotone"
                              dataKey="Trend Projection"
                              stroke="#f59e0b"
                              strokeWidth={1.5}
                              strokeDasharray="3 3"
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                          )}
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
                              <Activity className="w-4 h-4 text-indigo-400" />
                              Positions Overview
                            </h3>
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9.5px] font-mono text-indigo-400 font-bold">
                              {systemDashboardSummary.activeTradesCount} EXPOSURES ACTIVE
                            </span>

                            {/* Denser Dynamic Trend Strength & ICT Displacement Meter */}
                            <div className={`flex items-center gap-2 px-2.5 py-1 rounded border bg-gradient-to-r text-[9px] font-mono leading-none ${dynamicTrendMeter.strengthBg} ${dynamicTrendMeter.strengthRingColor}`} title={`Comprehensive real-time calculation: Trend Score: ${dynamicTrendMeter.trendScore}% | ICT Displacement: ${dynamicTrendMeter.displacementIntensity}%`}>
                              <span className="text-[7.5px] text-white/40 uppercase tracking-widest">Trend Index</span>
                              <span className={`font-black uppercase tracking-tight ${dynamicTrendMeter.strengthColor}`}>
                                {dynamicTrendMeter.strengthLabel} ({dynamicTrendMeter.aggregateStrength}%)
                              </span>
                              <span className="text-white/20">|</span>
                              <span className="text-[7.5px] text-white/40 uppercase tracking-widest">ICT</span>
                              <span className={`${dynamicTrendMeter.displacementColorClass} font-extrabold uppercase`}>
                                {dynamicTrendMeter.displacementLabel}
                              </span>
                            </div>
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

                          {/* Pre-formatted Text Share Action */}
                          <button
                            id="btn-share-active-positions"
                            onClick={handleSharePositions}
                            className={`px-2 py-0.5 border rounded transition-all text-[9px] flex items-center space-x-1.5 font-mono cursor-pointer font-bold uppercase tracking-tight select-none ${
                              shareSuccess 
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                                : 'bg-indigo-500/11 hover:bg-indigo-500/30 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500/40'
                            }`}
                            title="Copy Live Active Position Exposures Summary to Clipboard"
                          >
                            {shareSuccess ? (
                              <Check className="w-3 h-3 text-emerald-400 font-bold" />
                            ) : (
                              <Share2 className="w-3 h-3 text-indigo-400" />
                            )}
                            <span>{shareSuccess ? 'Copied!' : 'Share'}</span>
                          </button>

                          {/* Session Performance Toggle Action */}
                          <button
                            id="btn-toggle-session-performance"
                            onClick={() => setShowSessionPerformance(!showSessionPerformance)}
                            className={`px-2 py-0.5 border rounded transition-all text-[9.5px] flex items-center space-x-1.5 font-mono cursor-pointer font-bold uppercase tracking-tight select-none ${
                              showSessionPerformance
                                ? 'bg-amber-500/10 border-amber-500/35 text-amber-300 font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                                : 'bg-indigo-500/11 hover:bg-indigo-500/30 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500/40'
                            }`}
                            title="Toggle Session Performance PnL Goal Tracker"
                          >
                            <TrendingUp className={`w-3 h-3 ${showSessionPerformance ? 'text-amber-400 animate-pulse' : 'text-indigo-400'}`} />
                            <span>{showSessionPerformance ? 'Performance On' : 'Performance'}</span>
                          </button>

                          {/* Price Alerts Configuration Toggle */}
                          <button
                            id="btn-toggle-price-alerts"
                            onClick={() => {
                              setShowPriceAlertsPanel(!showPriceAlertsPanel);
                              const currentSymbolPrice = candles[candles.length - 1]?.close;
                              if (currentSymbolPrice) {
                                setNewAlertPrice(currentSymbolPrice.toString());
                              }
                            }}
                            className={`px-2 py-0.5 border rounded transition-all text-[9.5px] flex items-center space-x-1.5 font-mono cursor-pointer font-bold uppercase tracking-tight select-none ${
                              showPriceAlertsPanel
                                ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-300 font-extrabold shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                                : 'bg-indigo-500/11 hover:bg-indigo-500/30 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500/40'
                            }`}
                            title="Configure price-based browser alerts for Forex / Crypto assets"
                          >
                            <Bell className={`w-3 h-3 ${showPriceAlertsPanel ? 'text-indigo-300 animate-bounce' : 'text-indigo-400'}`} />
                            <span>{showPriceAlertsPanel ? 'Alerts On' : 'Alerts'}</span>
                          </button>

                          {/* Denser Compact View Toggle Action */}
                          <button
                            id="btn-toggle-compact-view"
                            onClick={() => setIsCompactPositions(!isCompactPositions)}
                            className={`px-2 py-0.5 border rounded transition-all text-[9.5px] flex items-center space-x-1.5 font-mono cursor-pointer font-bold uppercase tracking-tight select-none ${
                              isCompactPositions
                                ? 'bg-indigo-555/25 border-indigo-500/50 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                                : 'bg-indigo-500/11 hover:bg-indigo-500/30 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500/40'
                            }`}
                            title="Toggle High Density Compact Row Rendering"
                          >
                            {isCompactPositions ? (
                              <Maximize2 className="w-3 h-3 text-indigo-300" />
                            ) : (
                              <Minimize2 className="w-3 h-3 text-indigo-400" />
                            )}
                            <span>{isCompactPositions ? 'Compact On' : 'Compact'}</span>
                          </button>
                        </div>

                                         {/* Highly tactual Sort & Dropdown Filter Selection */}
                        {systemDashboardSummary.activeTradesCount > 0 && (
                          <div className="flex flex-wrap items-center gap-3 font-mono text-[9.5px]">
                            {/* Dropdown for Filter */}
                            <div className="flex items-center space-x-1">
                              <span className="text-white/35 mr-1 text-[8.5px] uppercase tracking-wider flex items-center gap-1">
                                <Filter className="w-2.5 h-2.5 text-white/40" /> Filter:
                              </span>
                              <div className="relative">
                                <select
                                  id="select-position-filter"
                                  value={positionFilter}
                                  onChange={(e) => setPositionFilter(e.target.value as 'ALL' | 'WINNING' | 'LOSING')}
                                  className="appearance-none bg-[#0a0a0b] text-white/80 border border-white/10 rounded pl-2 pr-6 py-0.5 text-[9px] font-mono outline-none focus:border-indigo-500 hover:border-white/20 transition-colors cursor-pointer font-semibold uppercase tracking-wider"
                                >
                                  <option value="ALL">ALL DECK</option>
                                  <option value="WINNING" className="text-emerald-400">WINNINGS</option>
                                  <option value="LOSING" className="text-rose-455">LOSSES</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-white/40 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>

                            {/* Decorative Separator */}
                            <span className="hidden sm:inline text-white/10 select-none">|</span>

                            <div className="flex items-center space-x-1">
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
                          </div>
                        )}
                      </div>
                      
                      {/* Session Performance PnL Goal Tracker sub-panel */}
                      {showSessionPerformance && (
                        <div id="session-performance-subpanel" className="mb-4 p-3.5 bg-black/40 border border-white/5 rounded-md text-xs font-mono animate-fade-in-shorter shadow-inner">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2.5">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                              </span>
                              Live Session Performance
                            </span>
                            <span className="text-[8.5px] text-white/40 uppercase font-medium">Daily Goal: <span className="text-white/80 font-bold">${dailyPnLGoal.toLocaleString()}</span></span>
                          </div>

                          {/* Realized, Floating, Total Metrics block */}
                          <div className="grid grid-cols-3 gap-3 text-center mb-3">
                            <div className="bg-[#0e0e11] p-2 rounded border border-white/5 flex flex-col justify-between">
                              <span className="text-[8px] text-white/40 uppercase tracking-wider block">Realized Daily PnL</span>
                              <span className={`text-[12px] font-bold ${systemDashboardSummary.realizedDailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-455'} mt-1`}>
                                {systemDashboardSummary.realizedDailyPnL >= 0 ? '+' : ''}${systemDashboardSummary.realizedDailyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="bg-[#0e0e11] p-2 rounded border border-white/5 flex flex-col justify-between">
                              <span className="text-[8px] text-white/40 uppercase tracking-wider block">Floating PnL</span>
                              <span className={`text-[12px] font-bold ${systemDashboardSummary.floatingPnL >= 0 ? 'text-emerald-400' : 'text-rose-455'} mt-1`}>
                                {systemDashboardSummary.floatingPnL >= 0 ? '+' : ''}${systemDashboardSummary.floatingPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="bg-[#0e0e11] p-2 rounded border border-white/5 flex flex-col justify-between">
                              <span className="text-[8px] text-white/40 uppercase tracking-wider block">Total Session PnL</span>
                              <span className={`text-[12px] font-extrabold ${systemDashboardSummary.dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-455'} mt-1`}>
                                {systemDashboardSummary.dailyPnL >= 0 ? '+' : ''}${systemDashboardSummary.dailyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {/* Visual Progress Bar compared to Daily Goal */}
                          <div>
                            <div className="flex items-center justify-between text-[9px] text-white/40 mb-1">
                              <span>DAILY GOAL PROGRESS</span>
                              <span className={`font-bold font-mono ${systemDashboardSummary.dailyPnL >= dailyPnLGoal ? 'text-indigo-400 animate-pulse' : systemDashboardSummary.dailyPnL > 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                                {systemDashboardSummary.dailyPnL <= 0 
                                  ? '0.0%' 
                                  : `${Math.min(100, (systemDashboardSummary.dailyPnL / dailyPnLGoal) * 100).toFixed(1)}%`}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full relative overflow-hidden border border-white/[0.03]">
                              {/* Background scale markings */}
                              <div className="absolute inset-y-0 left-1/4 border-r border-white/10 pointer-events-none" />
                              <div className="absolute inset-y-0 left-2/4 border-r border-white/10 pointer-events-none" />
                              <div className="absolute inset-y-0 left-3/4 border-r border-white/10 pointer-events-none" />
                              
                              {/* Actual progress bar handle */}
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                  systemDashboardSummary.dailyPnL >= dailyPnLGoal 
                                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 animate-pulse' 
                                    : systemDashboardSummary.dailyPnL > 0 
                                      ? 'bg-emerald-500' 
                                      : 'bg-rose-500/40 w-0'
                                }`}
                                style={{ 
                                  width: `${Math.max(0, Math.min(100, (systemDashboardSummary.dailyPnL / dailyPnLGoal) * 100))}%` 
                                }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[7.5px] text-white/25 mt-1 font-mono uppercase tracking-wider">
                              <span>0%</span>
                              <span>25%</span>
                              <span>50%</span>
                              <span>75%</span>
                              <span className="text-white/50 font-bold">100% GOAL</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Price Alerts subpanel */}
                      {showPriceAlertsPanel && (
                        <div id="price-alerts-subpanel" className="mb-4 p-4 bg-[#0d0d11]/90 border border-indigo-500/15 rounded-lg text-xs font-mono animate-fade-in shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                          
                          {/* Banner & Title */}
                          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 text-ellipsis overflow-hidden whitespace-nowrap">
                              <Bell className="w-3.5 h-3.5 animate-pulse text-indigo-400 shrink-0" />
                              Institution Price alerts
                            </span>
                            
                            {/* Browser Notification Switcher Status */}
                            {typeof Notification !== 'undefined' ? (
                              <button
                                onClick={requestNotificationAuth}
                                className={`text-[8px] uppercase tracking-wide px-2 py-0.5 rounded border font-bold transition-all shrink-0 ${
                                  notificationPermissionGranted
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                }`}
                                title={notificationPermissionGranted ? "Browser Notifications active" : "Enable native browser notification prompts"}
                              >
                                {notificationPermissionGranted ? '● Notifications On' : '⚡ Enable Notifications'}
                              </button>
                            ) : null}
                          </div>

                          {/* Quick Alert Creator Form */}
                          <div className="bg-black/35 p-3 rounded-md border border-white/5 mb-3.5">
                            <h4 className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2">Create New Price alert</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                              {/* Symbol Selection */}
                              <div className="sm:col-span-4">
                                <label className="block text-[8px] text-white/35 uppercase mb-1">Asset/Symbol</label>
                                <select
                                  value={newAlertSymbol}
                                  onChange={(e) => {
                                    const sym = e.target.value as MarketSymbol;
                                    setNewAlertSymbol(sym);
                                    // Prepopulate with latest mock/stats price
                                    const currentPrice = tickerStats[sym]?.price || 0;
                                    setNewAlertPrice(currentPrice > 0 ? currentPrice.toString() : '');
                                  }}
                                  className="w-full bg-[#121217] border border-white/10 rounded px-2 py-1.5 text-[10.5px] font-bold text-white outline-none focus:border-indigo-500/50"
                                >
                                  {Object.keys(tickerStats).map((sym) => (
                                    <option key={sym} value={sym}>
                                      {sym}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Alert Condition Selector */}
                              <div className="sm:col-span-3">
                                <label className="block text-[8px] text-white/35 uppercase mb-1">Condition</label>
                                <select
                                  value={newAlertCondition}
                                  onChange={(e) => setNewAlertCondition(e.target.value as 'ABOVE' | 'BELOW')}
                                  className="w-full bg-[#121217] border border-white/10 rounded px-2 py-1.5 text-[10.5px] text-white font-bold outline-none focus:border-indigo-500/50"
                                >
                                  <option value="ABOVE">≥ Crossing Up</option>
                                  <option value="BELOW">≤ Crossing Down</option>
                                </select>
                              </div>

                              {/* Target Price Value Input */}
                              <div className="sm:col-span-3">
                                <label className="block text-[8px] text-white/35 uppercase mb-1">
                                  Target Price
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. 1.08500"
                                  value={newAlertPrice}
                                  onChange={(e) => setNewAlertPrice(e.target.value)}
                                  className="w-full bg-[#121217] border border-white/10 rounded px-2 py-1.5 text-[10.5px] text-white font-bold outline-none focus:border-indigo-500/50"
                                />
                              </div>

                              {/* Trigger Add Action Button */}
                              <div className="sm:col-span-2 flex items-end">
                                <button
                                  onClick={() => {
                                    const parsedPrice = parseFloat(newAlertPrice);
                                    if (isNaN(parsedPrice) || parsedPrice <= 0) {
                                      // Log alert format error
                                      const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '.');
                                      setMqlConsoleLogs(prev => [...prev, `${timeStr}.883 [ALERT ERROR] Invalid price format specified.`].slice(-150));
                                      return;
                                    }

                                    // Add alert
                                    const newAlert: PriceAlert = {
                                      id: 'alert_' + Math.random().toString(36).substring(2, 9),
                                      symbol: newAlertSymbol,
                                      targetPrice: parsedPrice,
                                      condition: newAlertCondition,
                                      isTriggered: false,
                                      createdAt: new Date().toLocaleTimeString()
                                    };

                                    setPriceAlerts(prev => [newAlert, ...prev]);
                                    
                                    // Log to terminal console
                                    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '.');
                                    setMqlConsoleLogs(prev => [
                                      ...prev,
                                      `${timeStr}.115 [ALERT REGISTERED] Created target level alert for ${newAlertSymbol} at price ${parsedPrice.toLocaleString()} when crossing ${newAlertCondition}`
                                    ].slice(-150));

                                    // Clean up price state
                                    setNewAlertPrice('');
                                  }}
                                  className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 font-extrabold py-1.5 rounded border border-indigo-500/35 transition-all text-[11px] flex items-center justify-center gap-1 cursor-pointer select-none"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>ADD</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* List of active alerts */}
                          <div>
                            <div className="flex items-center justify-between text-[8px] text-white/35 uppercase tracking-wider mb-2 font-bold select-none">
                              <span>Configured Price Targets ({priceAlerts.length})</span>
                              {priceAlerts.length > 0 && (
                                <button
                                  onClick={() => {
                                    setPriceAlerts([]);
                                    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '.');
                                    setMqlConsoleLogs(prev => [...prev, `${timeStr}.050 [ALERTS PURGED] All active price monitors cleared.`].slice(-150));
                                  }}
                                  className="hover:text-rose-455 transition-colors uppercase cursor-pointer"
                                >
                                  Purge Alerts
                                </button>
                              )}
                            </div>

                            {priceAlerts.length === 0 ? (
                              <div className="text-center py-4 bg-white/[0.02] border border-dashed border-white/5 rounded text-white/30 text-[10px]">
                                No active alerts configured. Use the creator above to track targets.
                              </div>
                            ) : (
                              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 select-none scrollbar-thin">
                                {priceAlerts.map((alert) => (
                                  <div
                                    key={alert.id}
                                    className={`p-2.5 rounded border flex items-center justify-between transition-all ${
                                      alert.isTriggered
                                        ? 'bg-emerald-500/5 border-emerald-500/25 opacity-75'
                                        : 'bg-[#101014] border-white/5 hover:border-white/10'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {/* Blink Indicator Status icon */}
                                      <span className="relative flex h-2 w-2">
                                        {alert.isTriggered ? (
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                        ) : (
                                          <>
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                          </>
                                        )}
                                      </span>

                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 font-bold text-white text-[10.5px]">
                                          <span>{alert.symbol}</span>
                                          <span className="text-[8.5px] font-medium text-white/45 uppercase">
                                            {alert.condition === 'ABOVE' ? '≥ Crossing Up' : '≤ Crossing Down'}
                                          </span>
                                        </div>
                                        <div className="text-[8px] text-white/35 mt-0.5">
                                          Target: <strong className="text-indigo-400 font-bold">{alert.targetPrice}</strong>
                                          {alert.isTriggered && alert.triggeredAt && (
                                            <span className="text-emerald-400 font-bold ml-1.5">
                                              Triggered at {alert.triggeredAt}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action items deletion */}
                                    <button
                                      onClick={() => {
                                        setPriceAlerts(prev => prev.filter(a => a.id !== alert.id));
                                        const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '.');
                                        setMqlConsoleLogs(prev => [...prev, `${timeStr}.444 [ALERT DELETED] Cleared monitor ID ${alert.id}.`].slice(-150));
                                      }}
                                      className="p-1 hover:bg-rose-500/10 text-white/20 hover:text-rose-455 rounded transition-colors cursor-pointer shrink-0"
                                      title="Delete Price Alert"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                        </div>
                      )}

                      {/* Health Status Summary Metrics Banner Line */}
                      {systemDashboardSummary.activeTradesCount > 0 && (
                        <div className="mb-4 py-2 px-3 bg-[#0a0a0c] border border-white/10 rounded flex items-center justify-between text-[10px] font-mono select-none animate-fadeIn">
                          <span className="text-white/35 uppercase tracking-wider font-bold">Health Status Summary:</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5" title="Active standard exposure without immediate safety/target breaches">
                              <span className="w-2 h-2 rounded-full bg-indigo-400/80" />
                              <span className="text-white/40">Active:</span>
                              <span className="font-bold text-indigo-400">{healthStats.active}</span>
                            </div>
                            <span className="text-white/10">|</span>
                            <div className="flex items-center gap-1.5" title="Critical Drawdown: close to stop-loss threshold (SL Proximity >= 70%)">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                              <span className="text-white/40">At Risk:</span>
                              <span className="font-bold text-rose-400">{healthStats.atRisk}</span>
                            </div>
                            <span className="text-white/10">|</span>
                            <div className="flex items-center gap-1.5" title="Healthy positive profit margin (> 0 PnL)">
                              <span className="w-2 h-2 rounded-full bg-teal-400" />
                              <span className="text-white/40">Profitable:</span>
                              <span className="font-bold text-teal-400">{healthStats.profitable}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {sortedActivePositions.length === 0 ? (
                        <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-lg shadow-indigo-500/5 group">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] z-10 pointer-events-none" />
                            
                            <img 
                              src={emptyPositionsImg} 
                              alt="Institutional Trading System Inactive Matrix" 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover opacity-50 mix-blend-lighten transition-transform duration-700 group-hover:scale-105"
                            />
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-[#0a0a0b]/80 pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-transparent to-[#0a0a0b] pointer-events-none" />
                            
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/80 border border-white/10 px-2.5 py-1 rounded font-mono text-[8px] uppercase tracking-wider text-white/70 flex items-center gap-1.5 backdrop-blur-md whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-550 animate-pulse" />
                              MATRIX STATE: SYNCED
                            </div>
                          </div>

                          <div className="space-y-1.5 max-w-[280px]">
                            <p className="text-xs font-mono font-bold tracking-tight text-white/50">
                              {systemDashboardSummary.activeTradesCount > 0 
                                ? "NO MATCHING EXPOSURES"
                                : "ZERO ACTIVE DECK"}
                            </p>
                            <p className="text-[10.5px] font-sans text-white/35 leading-normal">
                              {systemDashboardSummary.activeTradesCount > 0 
                                ? `No active ${positionFilter === 'WINNING' ? 'winning' : 'losing'} positions found matching your filter overlay.`
                                : "The institutional portfolio database is currently clear. No micro-leveraged exposure or delta-hedged risk vectors detected."}
                            </p>
                          </div>

                          {systemDashboardSummary.activeTradesCount === 0 && (
                            <button 
                              onClick={() => setActiveTab('EXECUTION')} 
                              className="px-3.5 py-1.5 text-[9px] uppercase font-mono font-extrabold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600/30 border border-indigo-500/20 hover:border-indigo-500/40 rounded transition-all tracking-wider cursor-pointer"
                            >
                              Open trading interface &rarr;
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className={`${isCompactPositions ? 'space-y-1.5' : 'space-y-3'} relative`}>
                          <AnimatePresence initial={false}>
                            {sortedActivePositions.map(trade => (
                              <TradePositionRowItem
                                key={trade.id}
                                trade={trade}
                                isExpanded={!!expandedTradeIds[trade.id]}
                                onToggleExpand={toggleTradeExpand}
                                onQuickClose={handleQuickCloseTrade}
                                formatOpenDuration={formatOpenDuration}
                                isCompact={isCompactPositions}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    <SystemStatus />
                  </div>
                </div>
              </div>
            ) : activeTab === 'INTELLIGENCE' ? (
              <div id="intelligence-workspace-deck" className="space-y-3 md:space-y-6 animate-fadeIn">
                
                {/* 1. Full-Width Panoramic Chart row (rendered permanently as final panoramic mode) */}
                {metrics && (
                  <div className="w-full transition-all duration-300">
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
                      highlightOrderBlocks={highlightOrderBlocks}
                      resetKey={resetChartKey}
                      jumpRange={jumpRange}
                      showTWVP={showTWVP}
                      isExpanded={true}
                      onSymbolChange={setSymbol}
                    />
                  </div>
                )}

                {/* 2. Main Workspace Layout Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  
                  {/* Left-hand layout details (Default width or under expanded chart) */}
                  <div className="xl:col-span-8 space-y-6">

                    {/* AI Signal Insights and Explainability - Hidden on mobile screens */}
                    {metrics && (
                      <div className="hidden md:block">
                        <TradeExplainability
                          symbol={symbol}
                          metrics={metrics}
                          trades={trades}
                          highlightOrderBlocks={highlightOrderBlocks}
                          onToggleHighlightOrderBlocks={() => setHighlightOrderBlocks(prev => !prev)}
                          showTWVP={showTWVP}
                          onToggleTWVP={() => setShowTWVP(prev => !prev)}
                          onResetChartView={() => {
                            setHighlightOrderBlocks(false);
                            setShowTWVP(false);
                            setResetChartKey(prev => prev + 1);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Right hand layout pane: Order Book & Correlation Matrix - Hidden on mobile, perfectly proportioned on desktop */}
                  <div className="hidden md:block xl:col-span-4 space-y-6">
                    {orderBook && (
                      <OrderBookTracker
                        symbol={symbol}
                        orderBook={orderBook}
                      />
                    )}
                    {orderBook && (
                      <CumulativeDepthChart
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
                {/* Historical Replay Engine controls relocated from top of Intelligence */}
                <div id="intelligence-control-bar" className="bg-[#0c0c0e]/95 border border-white/5 rounded-lg p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono select-none">
                  
                  {/* Left block: Title and Icon */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/10 rounded border border-indigo-500/25 text-indigo-400 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase text-white tracking-wider">Historical Replay Engine</h3>
                      <p className="text-[9.5px] text-white/30 font-sans mt-0.5">Focus charts and price ladder metrics on historic key sessions or custom date bounds</p>
                    </div>
                  </div>

                  {/* Center & Right sections: Preset Session Jumpers & Custom Date Fields */}
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 flex-1 justify-end">
                    
                    {/* Presets Jumper */}
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] text-white/40 uppercase tracking-widest font-sans">Sessions:</span>
                      <select 
                        id="session-preset-select"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val || candles.length === 0) return;
                          
                          let startIdx = 0;
                          let endIdx = 0;
                          
                          if (val === 'london_breakout') {
                            startIdx = Math.max(0, Math.floor(candles.length * 0.15));
                            endIdx = Math.min(candles.length - 1, Math.floor(candles.length * 0.25));
                          } else if (val === 'ny_reversal') {
                            startIdx = Math.max(0, Math.floor(candles.length * 0.40));
                            endIdx = Math.min(candles.length - 1, Math.floor(candles.length * 0.50));
                          } else if (val === 'asia_consolidation') {
                            startIdx = Math.max(0, Math.floor(candles.length * 0.65));
                            endIdx = Math.min(candles.length - 1, Math.floor(candles.length * 0.75));
                          } else if (val === 'fomc_spike') {
                            startIdx = Math.max(0, Math.floor(candles.length * 0.82));
                            endIdx = Math.min(candles.length - 1, Math.floor(candles.length * 0.90));
                          }
                          
                          const startCandle = candles[startIdx];
                          const endCandle = candles[endIdx];
                          if (startCandle && endCandle) {
                            setJumpRange({
                              start: startCandle.timestamp,
                              end: endCandle.timestamp,
                              triggerId: Date.now()
                            });
                          }
                        }}
                        className="bg-[#050505] text-[11px] text-indigo-300 font-bold border border-white/10 hover:border-indigo-500/30 px-3 py-1.5 rounded cursor-pointer outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all font-mono leading-tight animate-pulse border-indigo-400/30"
                      >
                        <option value="">-- Jump to Market Session --</option>
                        {candles.length > 0 && (
                          <>
                            <option value="london_breakout">
                              🇬🇧 London Breakout Peak ({new Date(candles[Math.max(0, Math.floor(candles.length * 0.15))].timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})})
                            </option>
                            <option value="ny_reversal">
                              🇺🇸 NY PM Liquidity Reversal ({new Date(candles[Math.max(0, Math.floor(candles.length * 0.40))].timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})})
                            </option>
                            <option value="asia_consolidation">
                              🇯🇵 Tokyo Tight Consolidation ({new Date(candles[Math.max(0, Math.floor(candles.length * 0.65))].timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})})
                            </option>
                            <option value="fomc_spike">
                              🔥 FOMC Post-Rate Expansion ({new Date(candles[Math.max(0, Math.floor(candles.length * 0.82))].timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})})
                            </option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

                    {/* Custom Date Picker inputs */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] text-white/40 uppercase tracking-widest font-sans">From:</span>
                        <input 
                          type="date"
                          id="replay-date-start"
                          value={sessionStartDate}
                          onChange={(e) => setSessionStartDate(e.target.value)}
                          min={candles.length > 0 ? candles[0].timestamp.substring(0, 10) : ''}
                          max={candles.length > 0 ? candles[candles.length - 1].timestamp.substring(0, 10) : ''}
                          className="bg-[#050505] text-[10.5px] text-white/80 border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 font-mono transition-colors [color-scheme:dark]"
                        />
                      </div>

                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] text-white/40 uppercase tracking-widest font-sans">To:</span>
                        <input 
                          type="date"
                          id="replay-date-end"
                          value={sessionEndDate}
                          onChange={(e) => setSessionEndDate(e.target.value)}
                          min={sessionStartDate || (candles.length > 0 ? candles[0].timestamp.substring(0, 10) : '')}
                          max={candles.length > 0 ? candles[candles.length - 1].timestamp.substring(0, 10) : ''}
                          className="bg-[#050505] text-[10.5px] text-white/80 border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 font-mono transition-colors [color-scheme:dark]"
                        />
                      </div>

                      {/* Custom Date Picker trigger buttons */}
                      <div className="flex items-center gap-1.5 ml-1">
                        <button
                          id="btn-apply-replay-range"
                          onClick={() => {
                            if (!sessionStartDate || !sessionEndDate) return;
                            setJumpRange({
                              start: `${sessionStartDate}T00:00:00.000Z`,
                              end: `${sessionEndDate}T23:59:59.999Z`,
                              triggerId: Date.now()
                            });
                          }}
                          disabled={!sessionStartDate || !sessionEndDate}
                          className={`px-3 py-1.5 rounded font-mono text-[10px] font-bold tracking-tight border h-[34px] flex items-center justify-center cursor-pointer transition-all ${
                            sessionStartDate && sessionEndDate
                              ? 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white shadow-md active:scale-95'
                              : 'bg-[#050505] border-white/5 text-white/20 cursor-not-allowed'
                          }`}
                        >
                          APPLY
                        </button>

                        <button
                          id="btn-reset-replay-view"
                          onClick={() => {
                            setSessionStartDate('');
                            setSessionEndDate('');
                            const selectEl = document.getElementById('session-preset-select') as HTMLSelectElement;
                            if (selectEl) selectEl.value = '';
                            
                            setJumpRange(null);
                            setResetChartKey(prev => prev + 1);
                          }}
                          title="Return to the latest live ticker session"
                          className="px-2.5 py-1.5 bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/10 text-white/70 hover:text-white rounded font-mono text-[10px] font-bold tracking-tight h-[34px] flex items-center justify-center cursor-pointer transition-all"
                        >
                          LIVE
                        </button>
                      </div>

                    </div>

                  </div>

                </div>

                {/* Quick-action Filter Bar to Declutter Workspace */}
                <div id="research-quick-filters" className="bg-[#0c0c0e]/95 border border-white/5 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono select-none">
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <div>
                      <span className="text-xs font-bold uppercase text-white tracking-wider block">Workspace Filtration</span>
                      <span className="text-[9px] text-white/30 font-sans block mt-0.5">Toggle visibility of specific intelligence widgets to optimize workspace layout</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Sentiment Gauge Toggle */}
                    <button
                      id="toggle-sentiment-gauge"
                      onClick={() => setShowSentimentGauge(!showSentimentGauge)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        showSentimentGauge 
                          ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300' 
                          : 'bg-white/5 border-white/5 text-white/30 hover:text-white/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${showSentimentGauge ? 'bg-indigo-400' : 'bg-transparent border border-white/20'}`} />
                      SENTIMENT GAUGE
                    </button>

                    {/* Market Sentiment Heatmap Toggle */}
                    <button
                      id="toggle-market-sentiment-heatmap"
                      onClick={() => setShowMarketSentimentHeatmap(!showMarketSentimentHeatmap)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        showMarketSentimentHeatmap 
                          ? 'bg-amber-500/10 border-amber-500/25 text-amber-300' 
                          : 'bg-white/5 border-white/5 text-white/30 hover:text-white/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${showMarketSentimentHeatmap ? 'bg-amber-400' : 'bg-transparent border border-white/20'}`} />
                      SENTIMENT HEATMAP
                    </button>

                    {/* Sweep Alert Toggle */}
                    <button
                      id="toggle-sweep-alerts"
                      onClick={() => setShowSweepAlert(!showSweepAlert)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        showSweepAlert 
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' 
                          : 'bg-white/5 border-white/5 text-white/30 hover:text-white/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${showSweepAlert ? 'bg-emerald-400' : 'bg-transparent border border-white/20'}`} />
                      SWEEP ALERTS
                    </button>

                    {/* Heatmap Toggle */}
                    <button
                      id="toggle-correlation-heatmap"
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        showHeatmap 
                          ? 'bg-rose-500/10 border-rose-500/25 text-rose-300' 
                          : 'bg-white/5 border-white/5 text-white/30 hover:text-white/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${showHeatmap ? 'bg-rose-400' : 'bg-transparent border border-white/20'}`} />
                      CORRELATION HEATMAP
                    </button>
                  </div>
                </div>

                <InstitutionalNewsTicker />

                {showSentimentGauge && <InstitutionalSentimentGauge />}
                {showMarketSentimentHeatmap && <MarketSentimentHeatmap />}
                {showSweepAlert && <InstitutionalSweepAlert />}
                {showHeatmap && <CorrelationHeatmap trades={trades} />}
                <StrategyPerformanceChart />
                <BacktestSimulator selectedSymbol={symbol} onSymbolChange={(sym) => setSymbol(sym)} />
                <PerformanceTracker trades={trades} onTradeUpdated={fetchMarketData} />
                <TradeJournal trades={trades} onTradeUpdated={fetchMarketData} onReplayTrade={handleReplayClosedTrade} />
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
      <footer className="border-t border-white/10 bg-[#080808] pt-10 pb-8 mt-12 font-mono">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          
          {/* Main Footer Block Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/5 text-[11px] text-white/30">
            
            {/* Column 1: App Branding & Status */}
            <div className="md:col-span-4 space-y-3.5">
              <div className="flex items-center space-x-2.5">
                <MTXquantLogo size={24} />
                <span className="text-white text-xs font-black uppercase tracking-[0.15em] select-none">
                  MTXQUANT<span className="text-indigo-400 font-extrabold">.AI</span>
                </span>
              </div>
              <p className="text-[10px] text-white/30 leading-relaxed max-w-sm select-none">
                Next-generation institutional-grade quantitative analysis and trade execution terminal. Integrates algorithmic displacement modeling with risk insulation.
              </p>
              <div className="flex items-center space-x-2 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded w-fit text-[9.5px] select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-bold uppercase tracking-wider">SECURE NODE STATUS: ALIGNED</span>
              </div>
            </div>

            {/* Column 2: Tech Documentation Hub ('docs' tab) */}
            <div className="md:col-span-4 space-y-3 text-left">
              <h4 className="text-[10.5px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <BookOpen className="w-3.5 h-3.5" /> SYSTEM DOCUMENTATION
              </h4>
              <p className="text-[9.5px] text-white/30 leading-relaxed select-none">
                Unlock deeper mechanical heuristics of spatial OB/FVG alignments and MT5 execution configurations.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button 
                  onClick={() => openBureaucracyTab('docs')} 
                  className="hover:text-indigo-300 text-white/50 text-left transition-colors cursor-pointer flex items-center gap-1 hover:underline"
                >
                  &raquo; Strategy Guide
                </button>
                <button 
                  onClick={() => openBureaucracyTab('faq')} 
                  className="hover:text-indigo-300 text-white/50 text-left transition-colors cursor-pointer flex items-center gap-1 hover:underline"
                >
                  &raquo; Interactive FAQ
                </button>
                <button 
                  onClick={() => openBureaucracyTab('docs')} 
                  className="hover:text-indigo-300 text-white/50 text-left transition-colors cursor-pointer flex items-center gap-1 hover:underline"
                >
                  &raquo; Slippage Shield
                </button>
                <button 
                  onClick={() => openBureaucracyTab('docs')} 
                  className="hover:text-indigo-300 text-white/50 text-left transition-colors cursor-pointer flex items-center gap-1 hover:underline"
                >
                  &raquo; MT5 Setup
                </button>
              </div>
            </div>

            {/* Column 3: Regulatory Compliance Hub ('compliance' tab) */}
            <div className="md:col-span-4 space-y-3 text-left">
              <h4 className="text-[10.5px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Scale className="w-3.5 h-3.5" /> REGULATORY COMPLIANCE
              </h4>
              <p className="text-[9.5px] text-white/30 leading-relaxed select-none">
                Institutional risk controls operating under MiFID II and CFTC sovereign data protection frameworks.
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-2 text-[10px]">
                <button 
                  onClick={() => openBureaucracyTab('compliance')} 
                  className="hover:text-emerald-300 text-white/50 transition-colors cursor-pointer flex items-center gap-1 font-bold hover:underline"
                >
                  &raquo; MiFID Compliance
                </button>
                <button 
                  onClick={() => openBureaucracyTab('risk')} 
                  className="hover:text-amber-400 text-white/50 transition-colors cursor-pointer flex items-center gap-1 hover:underline"
                >
                  &raquo; Risk Disclosure
                </button>
                <button 
                  onClick={() => openBureaucracyTab('privacy')} 
                  className="hover:text-teal-400 text-white/50 transition-colors cursor-pointer flex items-center gap-1 hover:underline"
                >
                  &raquo; Privacy Charter
                </button>
                <button 
                  onClick={() => openBureaucracyTab('terms')} 
                  className="hover:text-blue-400 text-white/50 transition-colors cursor-pointer flex items-center gap-1 hover:underline"
                >
                  &raquo; Terms & Mandates
                </button>
                <button 
                  onClick={() => openBureaucracyTab('cookies')} 
                  className="hover:text-emerald-300 text-white/50 transition-colors cursor-pointer flex items-center gap-1 hover:underline"
                >
                  &raquo; Cookie Policy
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Fiduciary safeguard & Ping Speed + copyright */}
          <div className="pt-6 flex flex-col lg:flex-row items-center justify-between gap-4 text-[10px] text-white/30">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2 select-none">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Fiduciary Account Capital Protected by Fixed fractional (Max 1% SL invalidate) rules</span>
              </div>
              
              {/* Latency Monitor */}
              <div className="flex flex-wrap items-center gap-2 lg:gap-3.5 lg:border-l lg:border-white/10 lg:pl-4">
                <div className="flex items-center space-x-2 select-none">
                  {mt5Ping > 45 ? (
                    <Wifi className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5 text-emerald-400 opacity-70" />
                  )}
                  <span className="text-white/40">MT5 Bridge Ping:</span>
                  <span id="mt5-ping-value" className={`font-bold ${isTestingPing ? 'text-indigo-400 animate-pulse' : mt5Ping > 45 ? 'text-rose-400 font-extrabold animate-pulse' : 'text-emerald-400'}`}>
                    {isTestingPing ? 'pinging...' : `${mt5Ping}ms`}
                  </span>
                </div>

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

                {mt5Ping > 45 && (
                  <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-[9px] text-rose-300 font-bold tracking-tight animate-pulse uppercase">
                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>Latency warning threshold exceeded (Limit: 45ms)</span>
                  </div>
                )}

                <button
                  onClick={handleTestPingSpeed}
                  disabled={isTestingPing}
                  className="hover:text-white transition-colors duration-200 uppercase text-[9px] tracking-wider border border-white/15 bg-white/[0.02] px-1.5 py-0.5 rounded cursor-pointer disabled:opacity-50"
                  title="Conduct instantaneous packet Round-Trip speed evaluation test"
                >
                  Test Speed
                </button>

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

            <div className="text-center lg:text-right select-none text-[9.5px]">
              <span>MTXquant Quantitative Terminal &copy; 2026. Aligned with Elegant Dark guidelines.</span>
            </div>
          </div>

        </div>
      </footer>
      </div>

      {/* Floating Bottom-Left Advisor Chat */}
      {metrics && (
        <div 
          className="fixed bottom-18 md:bottom-6 left-3 md:left-[84px] z-50 flex flex-col items-start transition-all duration-300 ease-in-out"
        >
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
            <span className="text-xs font-mono font-bold tracking-tight uppercase">MTX AI</span>
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

      {/* Mobile Sticky Bottom Navigation Dock */}
      <nav id="mobile-sticky-bottom-nav" className="fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-white/10 flex md:hidden items-center justify-around py-1.5 px-2 safe-bottom">
        {[
          { id: 'INTELLIGENCE', label: 'Intel', icon: Bot },
          { id: 'DASHBOARD', label: 'Dash', icon: Layers },
          { id: 'EXECUTION', label: 'Exec', icon: Activity },
          { id: 'RISK', label: 'Risk', icon: ShieldAlert },
          { id: 'RESEARCH', label: 'Research', icon: Award },
          { id: 'SETTINGS', label: 'Settings', icon: Settings }
        ].map((item) => {
          const active = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-all ${
                active 
                  ? 'text-indigo-400 font-extrabold scale-105' 
                  : 'text-[#e5e5e5]/50 hover:text-white/80'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${active ? 'text-indigo-400 stroke-[2.5px]' : 'text-white/40'}`} />
              <span className="text-[8px] font-mono tracking-tight mt-0.5 uppercase">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Drawer Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm md:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-72 z-55 bg-[#080808] border-r border-white/10 p-5 flex flex-col justify-between md:hidden shadow-[8px_0_32px_rgba(0,0,0,0.85)]"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <MTXquantLogo size={32} />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      MTXQUANT<span className="text-indigo-400 font-extrabold">.AI</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 hover:bg-white/5 border border-white/10 rounded-md text-white/60 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Navigation Items */}
                <nav className="space-y-1.5">
                  {[
                    { id: 'INTELLIGENCE', label: 'Intelligence Workspace', icon: Bot, desc: 'Trend Bias, Gaps, Order Blocks' },
                    { id: 'DASHBOARD', label: 'General Dashboard', icon: Layers, desc: 'Portfolio PnL & Health' },
                    { id: 'EXECUTION', label: 'Execution Terminal', icon: Activity, desc: 'Manual & EA Order Panel' },
                    { id: 'RISK', label: 'Risk Desk Management', icon: ShieldAlert, desc: 'Leverage, Limits & Heatmap' },
                    { id: 'RESEARCH', label: 'Research & Calendar', icon: Award, desc: 'Economic events & insights' },
                    { id: 'SETTINGS', label: 'System Settings', icon: Settings, desc: 'API, alerts & notification settings' }
                  ].map((item) => {
                    const active = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full p-3 rounded-lg text-left transition-all flex items-start gap-3.5 cursor-pointer border ${
                          active
                            ? 'bg-indigo-600/15 text-white border-indigo-500/30'
                            : 'text-[#e5e5e5]/60 hover:text-white hover:bg-white/[0.02] border-transparent'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-indigo-400' : 'text-white/35'}`} />
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold uppercase tracking-wide leading-none">{item.label}</span>
                          <span className="text-[9px] text-[#e5e5e5]/30 mt-1">{item.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Footer */}
              <div className="border-t border-white/5 pt-4 flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Institutional Node Active
                  </span>
                </div>
                <div className="text-[8px] font-mono text-white/20">
                  MTXQUANT GATEWAY S9 &middot; BUILD 4108
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bureaucracy & Legal Compliance Dialog */}
      <BureaucracyModal 
        isOpen={isBureaucracyModalOpen} 
        onClose={() => setIsBureaucracyModalOpen(false)} 
        initialTab={bureaucracyActiveTab}
      />

    </div>
  );
}
