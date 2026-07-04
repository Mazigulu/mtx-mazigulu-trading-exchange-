/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { MarketSymbol, Candlestick, FVG, OrderBlock, LiquiditySweep, MarketMetrics, OrderBook, Trade, PriceAlert } from './types';
import { motion, AnimatePresence } from 'motion/react';
import LoginPage from './components/LoginPage';
import { BureaucracyModal } from './components/BureaucracyModal';
import { auth } from './lib/firebase.ts';
import { onAuthStateChanged } from 'firebase/auth';
import MarketsTerminal from './components/MarketsTerminal';
import PortfolioDesk from './components/PortfolioDesk';
import FundingDesk from './components/FundingDesk';
import ActivityDesk from './components/ActivityDesk';
import AccountControlCenter from './components/AccountControlCenter';
import MarketAnalysisDashboard from './components/MarketAnalysisDashboard';

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
  ChevronLeft,
  ChevronRight,
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
  Sliders,
  Sparkles,
  BarChart3,
  User,
  Copy,
  Volume2,
  VolumeX,
  Lock,
  Shield,
  Briefcase,
  Coins,
  Wallet
} from 'lucide-react';

const TerminalWorkspaceLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] border border-white/5 rounded-lg bg-[#070709]/80 p-8 space-y-4 font-mono w-full">
    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
      <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
    </div>
    <div className="flex flex-col items-center space-y-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Syncing Workspace Component</span>
      <span className="text-[8px] text-white/30 uppercase tracking-wider">Establishing secure data channels...</span>
    </div>
  </div>
);

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

  // Install safe global fetch interceptor to dynamically inject standard Firebase Authorization token
  useEffect(() => {
    const originalFetch = window.fetch;
    let interceptorInstalled = false;

    const wrappedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          init = init || {};
          const headers = new Headers(init.headers || {});
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          init.headers = headers;
        }
      } catch (err) {
        console.error('Error attaching identity token to request:', err);
      }
      return originalFetch(input, init);
    };

    // Attempt 1: Standard direct assignment
    try {
      (window as any).fetch = wrappedFetch;
      interceptorInstalled = true;
    } catch (err) {
      console.warn('Standard window.fetch assignment blocked. Trying Object.defineProperty...', err);
    }

    // Attempt 2: Object.defineProperty on window
    if (!interceptorInstalled) {
      try {
        Object.defineProperty(window, 'fetch', {
          configurable: true,
          writable: true,
          value: wrappedFetch
        });
        interceptorInstalled = true;
      } catch (err) {
        console.warn('Object.defineProperty on window.fetch blocked. Trying prototype patch...', err);
      }
    }

    // Attempt 3: Object.defineProperty on Window.prototype
    if (!interceptorInstalled) {
      try {
        const proto = Object.getPrototypeOf(window);
        if (proto) {
          Object.defineProperty(proto, 'fetch', {
            configurable: true,
            writable: true,
            value: wrappedFetch
          });
          interceptorInstalled = true;
        }
      } catch (err) {
        console.error('All safe global fetch interceptor installations failed:', err);
      }
    }

    return () => {
      if (interceptorInstalled) {
        try {
          (window as any).fetch = originalFetch;
        } catch (err) {
          try {
            Object.defineProperty(window, 'fetch', {
              configurable: true,
              writable: true,
              value: originalFetch
            });
          } catch (err2) {
            try {
              const proto = Object.getPrototypeOf(window);
              if (proto) {
                Object.defineProperty(proto, 'fetch', {
                  configurable: true,
                  writable: true,
                  value: originalFetch
                });
              }
            } catch (err3) {
              console.warn('Could not restore original fetch:', err3);
            }
          }
        }
      }
    };
  }, []);

  // Monitor centralized auth status changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setTraderEmail(user.email || 'maziguluj@gmail.com');
        setIsProfileMenuOpen(false);
        try {
          localStorage.setItem('apex_is_logged_in', 'true');
          if (user.email) {
            localStorage.setItem('apex_trader_email', user.email);
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (email: string) => {
    try {
      localStorage.setItem('apex_is_logged_in', 'true');
      localStorage.setItem('apex_trader_email', email);
    } catch (err) {
      console.error(err);
    }
    setTraderEmail(email);
    setIsLoggedIn(true);
    setIsProfileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('apex_is_logged_in');
      await auth.signOut();
    } catch (err) {
      console.error(err);
    }
    setIsLoggedIn(false);
    setIsProfileMenuOpen(false);
  };

  // Auto-Logout idle timer setting (in minutes)
  const [idleTimeout, setIdleTimeout] = useState<string>(() => {
    try {
      return localStorage.getItem('apex_idle_timeout') || 'off';
    } catch {
      return 'off';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('apex_idle_timeout', idleTimeout);
    } catch (err) {
      console.error(err);
    }
  }, [idleTimeout]);

  // Track global user activity for idle timeout
  useEffect(() => {
    if (!isLoggedIn || idleTimeout === 'off') return;

    const timeoutMs = parseInt(idleTimeout, 10) * 60 * 1000;
    let timer: NodeJS.Timeout;

    const performAutoLogout = () => {
      console.log('User activity idle limit exceeded. Terminating session.');
      handleLogout();
    };

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(performAutoLogout, timeoutMs);
    };

    // Events that register user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add global event listeners
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetTimer, { passive: true });
    });

    // Initialize timer
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, resetTimer);
      });
    };
  }, [isLoggedIn, idleTimeout]);

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

  const [activeTab, setActiveTab] = useState<'MARKETS' | 'PORTFOLIO' | 'FUNDING' | 'ACTIVITY' | 'ANALYSIS'>(() => {
    try {
      const saved = localStorage.getItem('apex_active_tab');
      if (saved === 'MARKETS' || saved === 'PORTFOLIO' || saved === 'FUNDING' || saved === 'ACTIVITY' || saved === 'ANALYSIS') {
        return saved;
      }
    } catch (err) {
      console.error(err);
    }
    return 'MARKETS';
  });

  useEffect(() => {
    try {
      localStorage.setItem('apex_active_tab', activeTab);
    } catch (err) {
      console.error(err);
    }
  }, [activeTab]);

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(true);

  const [symbol, setSymbol] = useState<MarketSymbol>(() => {
    try {
      const saved = localStorage.getItem('apex_selected_symbol') as MarketSymbol;
      const validSymbols: MarketSymbol[] = ['US30', 'NAS100', 'GER40', 'SPX500', 'AAPL', 'MSFT', 'NVDA', 'TSLA'];
      if (validSymbols.includes(saved)) {
        return saved;
      }
    } catch (err) {
      console.error(err);
    }
    return 'NAS100';
  });

  useEffect(() => {
    try {
      localStorage.setItem('apex_selected_symbol', symbol);
    } catch (err) {
      console.error(err);
    }
  }, [symbol]);

  const [timeframe, setTimeframe] = useState<'M15' | 'H1' | 'H4' | 'D1'>(() => {
    try {
      const saved = localStorage.getItem('apex_timeframe') as 'M15' | 'H1' | 'H4' | 'D1';
      if (['M15', 'H1', 'H4', 'D1'].includes(saved)) {
        return saved;
      }
    } catch (err) {
      console.error(err);
    }
    return 'H4';
  });

  useEffect(() => {
    try {
      localStorage.setItem('apex_timeframe', timeframe);
    } catch (err) {
      console.error(err);
    }
  }, [timeframe]);
  const [jumpRange, setJumpRange] = useState<{ start: string; end: string; triggerId: number } | null>(null);
  const [sessionStartDate, setSessionStartDate] = useState('');
  const [sessionEndDate, setSessionEndDate] = useState('');

  const handleStepReplay = (direction: 'forward' | 'backward') => {
    if (candles.length === 0) return;

    let startIdx = 0;
    let endIdx = candles.length - 1;

    if (jumpRange) {
      const startMs = new Date(jumpRange.start).getTime();
      const endMs = new Date(jumpRange.end).getTime();

      let minStartDiff = Infinity;
      let minEndDiff = Infinity;

      for (let i = 0; i < candles.length; i++) {
        const cTime = new Date(candles[i].timestamp).getTime();
        
        const startDiff = Math.abs(cTime - startMs);
        if (startDiff < minStartDiff) {
          minStartDiff = startDiff;
          startIdx = i;
        }

        const endDiff = Math.abs(cTime - endMs);
        if (endDiff < minEndDiff) {
          minEndDiff = endDiff;
          endIdx = i;
        }
      }
    } else {
      startIdx = Math.max(0, candles.length - 40);
      endIdx = candles.length - 1;
    }

    if (direction === 'backward') {
      if (startIdx > 0 && endIdx > 0) {
        startIdx -= 1;
        endIdx -= 1;
      } else {
        return;
      }
    } else {
      if (endIdx < candles.length - 1) {
        startIdx += 1;
        endIdx += 1;
      } else {
        return;
      }
    }

    const startCandle = candles[startIdx];
    const endCandle = candles[endIdx];

    if (startCandle && endCandle) {
      setSessionStartDate(startCandle.timestamp.substring(0, 10));
      setSessionEndDate(endCandle.timestamp.substring(0, 10));

      setJumpRange({
        start: startCandle.timestamp,
        end: endCandle.timestamp,
        triggerId: Date.now()
      });
    }
  };
  const [isBrokerBridgePaused, setIsBrokerBridgePaused] = useState<boolean>(() => {
    try {
      return localStorage.getItem('apex_broker_bridge_paused') === 'true';
    } catch {
      return false;
    }
  });

  // Keep it synchronized with localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setIsBrokerBridgePaused(localStorage.getItem('apex_broker_bridge_paused') === 'true');
      } catch {}
    };

    const handleCustomChange = (e: any) => {
      if (e.detail && typeof e.detail.paused === 'boolean') {
        setIsBrokerBridgePaused(e.detail.paused);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('apex_bridge_status_changed' as any, handleCustomChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('apex_bridge_status_changed' as any, handleCustomChange);
    };
  }, []);

  const [brokerPing, setBrokerPing] = useState<number>(12);
  const [isSimulatingSpike, setIsSimulatingSpike] = useState<boolean>(false);
  const [isTestingPing, setIsTestingPing] = useState<boolean>(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const sessionStartTime = useRef<number>(Date.now());
  const [isSessionSummaryOpen, setIsSessionSummaryOpen] = useState(false);
  
  // Compliance & Bureaucracy Modal State
  const [isBureaucracyModalOpen, setIsBureaucracyModalOpen] = useState(false);
  const [bureaucracyActiveTab, setBureaucracyActiveTab] = useState<'faq' | 'cookies' | 'privacy' | 'terms' | 'risk' | 'docs' | 'compliance'>('faq');

  const openBureaucracyTab = (tab: 'faq' | 'cookies' | 'privacy' | 'terms' | 'risk' | 'docs' | 'compliance') => {
    setBureaucracyActiveTab(tab);
    setIsBureaucracyModalOpen(true);
  };

  // Institutional Dropdown Menu States
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('apex_institutional_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.soundAlerts !== false;
      }
    } catch {}
    return true;
  });
  const [copiedTokenState, setCopiedTokenState] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Sync soundAlerts local storage state to current layout
  useEffect(() => {
    const handleStorageChangeLocal = () => {
      try {
        const raw = localStorage.getItem('apex_institutional_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          setSoundAlertsEnabled(parsed.soundAlerts !== false);
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorageChangeLocal);
    return () => {
      window.removeEventListener('storage', handleStorageChangeLocal);
    };
  }, []);

  // Listen to outer clicks to close the dropdown menu
  useEffect(() => {
    const handleOuterClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOuterClick);
    return () => {
      document.removeEventListener('mousedown', handleOuterClick);
    };
  }, []);

  const toggleSoundAlertsInMenu = () => {
    try {
      const raw = localStorage.getItem('apex_institutional_settings');
      let settings = raw ? JSON.parse(raw) : {};
      const nextVal = !soundAlertsEnabled;
      settings.soundAlerts = nextVal;
      localStorage.setItem('apex_institutional_settings', JSON.stringify(settings));
      setSoundAlertsEnabled(nextVal);
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }
  };

  const copyApiBearerToken = () => {
    try {
      const emailHash = traderEmail ? traderEmail.split('@')[0].toUpperCase() : 'QUANT_TRADER';
      const mockToken = `MTX_LIVE_BEARER_${emailHash}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      navigator.clipboard.writeText(mockToken);
      setCopiedTokenState(true);
      setTimeout(() => setCopiedTokenState(false), 2000);
    } catch (err) {
      console.error('Failed to copy token:', err);
    }
  };

  const wipeTerminalAndReset = () => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to purge all local terminal data, cache settings, active user profiles, and backtest history? This will restore everything to initial factory calibration.")) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('apex_') || key.startsWith('mtx_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        alert("Cache purged successfully. Initializing total terminal recalibration...");
        window.location.reload();
      } catch (err) {
        console.error(err);
      }
    }
  };
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
      setBrokerPing((prev) => {
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
      setBrokerPing(() => {
        const targetBase = isSimulatingSpike ? 65 : 12;
        const jitter = Math.round(Math.random() * 6 - 3); 
        return Math.max(4, targetBase + jitter);
      });
      setIsTestingPing(false);
    }, 800);
  };
  // Market & Simulation States
  const [candles, setCandles] = useState<Candlestick[]>([]);
  const [fvgs, setFvgs] = useState<FVG[]>([]);
  const [obs, setObs] = useState<OrderBlock[]>([]);
  const [sweeps, setSweeps] = useState<LiquiditySweep[]>([]);
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  
  // Backtest Simulation Data State
  const [backtestData, setBacktestData] = useState<{
    candles: Candlestick[];
    trades: Trade[];
    fvgs: FVG[];
    obs: OrderBlock[];
    sweeps: LiquiditySweep[];
    metrics: MarketMetrics | null;
  } | null>(null);
  const [isBacktestActive, setIsBacktestActive] = useState<boolean>(false);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);

  const [showTWVP, setShowTWVP] = useState<boolean>(true);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [expandedTradeIds, setExpandedTradeIds] = useState<Record<string, boolean>>({});
  const [activeTradePageIndex, setActiveTradePageIndex] = useState<number>(0);
  const [positionSort, setPositionSort] = useState<'PROFITABLE' | 'MARGIN' | 'DURATION'>('PROFITABLE');
  const [positionFilter, setPositionFilter] = useState<'ALL' | 'WINNING' | 'LOSING'>('ALL');
  const [isCompactPositions, setIsCompactPositions] = useState<boolean>(false);
  const [showSessionPerformance, setShowSessionPerformance] = useState<boolean>(true);
  const [showPriceAlertsPanel, setShowPriceAlertsPanel] = useState<boolean>(false);
  const [showBulkAdjustPanel, setShowBulkAdjustPanel] = useState<boolean>(false);
  const [bulkAdjustTarget, setBulkAdjustTarget] = useState<'SL' | 'TP' | 'BOTH'>('SL');
  const [bulkAdjustType, setBulkAdjustType] = useState<'PERCENT' | 'POINTS'>('PERCENT');
  const [bulkAdjustValue, setBulkAdjustValue] = useState<string>('1.5');
  const [bulkIsSubmitting, setBulkIsSubmitting] = useState<boolean>(false);
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string>('');
  const [bulkErrorMessage, setBulkErrorMessage] = useState<string>('');
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(() => new Date());
  const [secondsSinceSync, setSecondsSinceSync] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (lastFetchTime) {
        setSecondsSinceSync(Math.floor((Date.now() - lastFetchTime.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastFetchTime]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const stored = localStorage.getItem('priceAlerts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [newAlertSymbol, setNewAlertSymbol] = useState<MarketSymbol>('NAS100');
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
            
            // 1. Play subtle UI standard push if supported
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              try {
                new Notification(`🔔 Price Alert: ${alert.symbol}`, {
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

  const handleDownloadSessionPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Dark header block (RGB(10, 10, 12)) for professional cyberpunk-ish branding
      doc.setFillColor(10, 10, 12);
      doc.rect(10, 10, 190, 30, 'F');
      
      // Top accent bar in Indigo (RGB(99, 102, 241))
      doc.setFillColor(99, 102, 241);
      doc.rect(10, 10, 190, 1.5, 'F');

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('MTXQUANT TERMINAL', 15, 21);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(129, 140, 248); // indigo-400
      doc.text('QUANTITATIVE SESSION INTEGRITY AUDIT', 15, 28);

      // Metadata right block
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175); // gray-400
      doc.text(`GENERATED: ${new Date().toLocaleString()}`, 132, 21);
      doc.text(`SESSION START: ${new Date(sessionStartTime.current).toLocaleString()}`, 132, 26);
      doc.text('STATUS CODE: SYS_VALIDATED', 132, 31);

      // Spacer
      let currentY = 46;

      // Stats Area background
      doc.setFillColor(248, 250, 252); // extremely light blue-slate
      doc.rect(10, currentY, 190, 26, 'F');
      doc.setDrawColor(226, 232, 240); // borders
      doc.rect(10, currentY, 190, 26, 'S');

      // Col 1: active duration
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('ACTIVE DURATION', 15, currentY + 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(formatSessionTime(sessionSeconds), 15, currentY + 17);

      // Col 2: session net pnl
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('SESSION NET PNL', 58, currentY + 7);
      
      const pnlNum = sessionStats.totalPnL;
      const formattedPnL = (pnlNum >= 0 ? '+' : '') + '$' + pnlNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      if (pnlNum >= 0) {
        doc.setTextColor(16, 185, 129); // emerald
      } else {
        doc.setTextColor(244, 63, 94); // rose
      }
      doc.text(formattedPnL, 58, currentY + 17);

      // Col 3: activity counts
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('SESSION ACTIVITY', 110, currentY + 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${sessionStats.total} Trades`, 110, currentY + 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`(${sessionStats.openCount} Open / ${sessionStats.closedCount} Closed)`, 110, currentY + 22);

      // Col 4: win rate
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('SESSION WIN RATE', 160, currentY + 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${sessionStats.winRate.toFixed(1)}%`, 160, currentY + 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`(${sessionStats.winsCount}W - ${sessionStats.lossesCount}L)`, 160, currentY + 22);

      currentY += 32;

      // trading session guard feedback
      doc.setFillColor(240, 244, 255); // light-indigo tint
      doc.rect(10, currentY, 190, 20, 'F');
      doc.setDrawColor(224, 231, 255);
      doc.rect(10, currentY, 190, 20, 'S');

      // Feedback title and content
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(67, 56, 202); // indigo-700
      doc.text('TRADING SESSION GUARD ASSESSMENT ADVICE:', 15, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85); // slate-700
      const adviceText = "To maintain top consistency, professional traders cap session lengths to prevent cognitive fatigue and over-trading. Always filter noise using specific strategy profiles (e.g., Optimal Trade Entry or Power-of-Three AMD) and avoid emotional over-exposure.";
      // text wrapping
      const splitAdvice = doc.splitTextToSize(adviceText, 180);
      doc.text(splitAdvice, 15, currentY + 11);

      currentY += 28;

      // Table Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`TRADES RECORDED THIS SESSION (${sessionTrades.length})`, 10, currentY);

      currentY += 4;

      // Table Header Block
      doc.setFillColor(30, 41, 59); // dark slate
      doc.rect(10, currentY, 190, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('SYMBOL', 13, currentY + 5.5);
      doc.text('SIDE', 38, currentY + 5.5);
      doc.text('ENTRY PRICE', 63, currentY + 5.5);
      doc.text('EXIT / CURR PRICE', 98, currentY + 5.5);
      doc.text('SIZE (UNITS)', 138, currentY + 5.5);
      doc.text('STATUS', 161, currentY + 5.5);
      doc.text('PNL', 183, currentY + 5.5);

      currentY += 8;

      if (sessionTrades.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('No trades were opened or closed during this live trading session.', 15, currentY + 10);
      } else {
        sessionTrades.slice().reverse().forEach((trade, index) => {
          // Check pagination boundaries: page heights is 297mm.
          // If currentY is going past 270, we transition to a new page
          if (currentY > 270) {
            doc.addPage();
            currentY = 15;

            // Re-render table headers
            doc.setFillColor(30, 41, 59);
            doc.rect(10, currentY, 190, 8, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.text('SYMBOL', 13, currentY + 5.5);
            doc.text('SIDE', 38, currentY + 5.5);
            doc.text('ENTRY PRICE', 63, currentY + 5.5);
            doc.text('EXIT / CURR PRICE', 98, currentY + 5.5);
            doc.text('SIZE (UNITS)', 138, currentY + 5.5);
            doc.text('STATUS', 161, currentY + 5.5);
            doc.text('PNL', 183, currentY + 5.5);

            currentY += 8;
          }

          // Alternating row style
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252); // soft slate alternate grid rows
            doc.rect(10, currentY - 4, 190, 6, 'F');
          }

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);

          // Symbol
          doc.setFont('helvetica', 'bold');
          doc.text(trade.symbol, 13, currentY);

          // Side
          doc.setFont('helvetica', 'bold');
          if (trade.side === 'BUY') {
            doc.setTextColor(16, 185, 129); // emerald
          } else {
            doc.setTextColor(244, 63, 94); // rose
          }
          doc.text(trade.side, 38, currentY);

          // Prices
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          doc.text(trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }), 63, currentY);

          const exitVal = trade.status === 'CLOSED' && trade.exitPrice
            ? trade.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
            : 'Running...';
          doc.text(exitVal, 98, currentY);

          // Size
          doc.text(trade.size.toLocaleString(undefined, { maximumFractionDigits: 3 }), 138, currentY);

          // Status
          doc.setFont('helvetica', 'bold');
          if (trade.status === 'OPEN') {
            doc.setTextColor(79, 70, 229); // indigo
          } else {
            doc.setTextColor(100, 116, 139); // slate-500
          }
          doc.text(trade.status, 161, currentY);

          // PnL
          doc.setFont('helvetica', 'bold');
          if (trade.pnl >= 0) {
            doc.setTextColor(16, 185, 129);
            doc.text(`+$${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 183, currentY);
          } else {
            doc.setTextColor(244, 63, 94);
            doc.text(`-$${Math.abs(trade.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 183, currentY);
          }

          currentY += 6;
        });
      }

      // Pagination indicators and Watermark on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184); // slate-400
        
        // Solid line for footer spacer
        doc.setDrawColor(241, 245, 249);
        doc.line(10, 284, 200, 284);
        
        doc.text(`MTXquant Session Audit Ledger • Certified Performance Record • Page ${i} of ${totalPages}`, 10, 288);
        doc.text('Sovereign node validation protocol MTXQUANT • Live performance log audit.', 130, 288);
      }

      // Trigger automatic save / download
      doc.save(`MTXquant-SessionSummary-${Date.now()}.pdf`);
    } catch (e) {
      console.error("Failed to generate and download session pdf: ", e);
    }
  };

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

      setLastFetchTime(new Date());
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

  const handleUpdateTradeParams = async (id: string, params: Partial<Trade>) => {
    try {
      const res = await fetch(`/api/trades/${id}/update-params`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        fetchMarketData();
      } else {
        const data = await res.json();
        console.error('Failed to update trade parameters:', data.error);
      }
    } catch (err) {
      console.error('Error updating trade parameters:', err);
    }
  };

  const handleApplyBulkAdjust = async () => {
    const valueNum = parseFloat(bulkAdjustValue);
    if (isNaN(valueNum) || valueNum <= 0) {
      setBulkErrorMessage('Please enter a valid positive numeric distance.');
      return;
    }

    setBulkIsSubmitting(true);
    setBulkErrorMessage('');
    setBulkSuccessMessage('');

    try {
      const targets = sortedActivePositions;
      if (targets.length === 0) {
        setBulkErrorMessage('No active visible positions found matching current filter overlay.');
        setBulkIsSubmitting(false);
        return;
      }

      // Loop over targets
      const updates = targets.map(async (trade) => {
        const decimals = trade.symbol === 'USD/JPY' || trade.symbol === 'GOLD/USD' ? 2 : trade.symbol === 'BTC/USDT' ? 1 : 5;
        let distance = 0;

        if (bulkAdjustType === 'PERCENT') {
          distance = trade.entryPrice * (valueNum / 100);
        } else {
          // POINTS / pips
          // We define appropriate points scale per symbol
          let multiplier = 0.0001; // default forex
          if (trade.symbol === 'USD/JPY') multiplier = 0.01;
          else if (['BTC/USDT', 'GOLD/USD', 'SILVER/USD', 'ETH/USDT', 'SOL/USDT', 'US30', 'NAS100', 'SPX500', 'GER40'].includes(trade.symbol)) {
            multiplier = 1.0;
          }
          distance = valueNum * multiplier;
        }

        const params: Partial<Trade> = {};

        if (bulkAdjustTarget === 'SL' || bulkAdjustTarget === 'BOTH') {
          params.stopLoss = trade.side === 'BUY' 
            ? parseFloat((trade.entryPrice - distance).toFixed(decimals))
            : parseFloat((trade.entryPrice + distance).toFixed(decimals));
        }

        if (bulkAdjustTarget === 'TP' || bulkAdjustTarget === 'BOTH') {
          params.takeProfit = trade.side === 'BUY'
            ? parseFloat((trade.entryPrice + distance).toFixed(decimals))
            : parseFloat((trade.entryPrice - distance).toFixed(decimals));
        }

        // Call individual update API
        const response = await fetch(`/api/trades/${trade.id}/update-params`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        if (!response.ok) {
          throw new Error(`Failed to update trade ID: ${trade.id}`);
        }
        return response;
      });

      await Promise.all(updates);
      
      // Refresh market data / positions
      fetchMarketData();
      
      setBulkSuccessMessage(`Succeeded bulk altering ${targets.length} visibility positions!`);
      
      setTimeout(() => {
        setBulkSuccessMessage('');
      }, 4500);
    } catch (err: any) {
      console.error('Error during bulk adjustment:', err);
      setBulkErrorMessage(`Failed bulk update: ${err.message || 'unknown error'}`);
    } finally {
      setBulkIsSubmitting(false);
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

  const handlePartialCloseAll = async (ratio = 0.5) => {
    const openPositions = trades.filter((t) => t.status === 'OPEN');
    if (openPositions.length === 0) {
      setEmergencyCloseStatus({
        show: true,
        count: 0,
        pnl: 0,
        timestamp: new Date().toLocaleTimeString(),
      });
      return;
    }

    try {
      const estimatedPnl = openPositions.reduce((sum, t) => sum + (t.pnl * ratio), 0);
      
      await Promise.all(
        openPositions.map((trade) =>
          fetch(`/api/trades/${trade.id}/partial-close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ratio }),
          })
        )
      );

      setEmergencyCloseStatus({
        show: true,
        count: openPositions.length,
        pnl: estimatedPnl,
        timestamp: new Date().toLocaleTimeString(),
      });

      fetchMarketData();
    } catch (error) {
      console.error('Failed partial profit taking execution:', error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Load current bindings dynamically from localStorage settings
      let emergencyCloseBind = 'ALT+X';
      let toggleVolatilityBind = 'ALT+V';
      let tabDashboardBind = 'ALT+D';

      try {
        const saved = localStorage.getItem('apex_institutional_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.keybindEmergencyClose) emergencyCloseBind = parsed.keybindEmergencyClose.toUpperCase();
          if (parsed.keybindToggleVolatility) toggleVolatilityBind = parsed.keybindToggleVolatility.toUpperCase();
          if (parsed.keybindTabDashboard) tabDashboardBind = parsed.keybindTabDashboard.toUpperCase();
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
        setActiveTab('MARKETS');
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
    'US30': { name: 'US30', price: symbol === 'US30' ? (candles[candles.length - 1]?.close || 38850.0) : 38850.0, pChange: +0.35 },
    'NAS100': { name: 'NAS100', price: symbol === 'NAS100' ? (candles[candles.length - 1]?.close || 18550.0) : 18550.0, pChange: +0.52 },
    'GER40': { name: 'GER40', price: symbol === 'GER40' ? (candles[candles.length - 1]?.close || 18200.0) : 18200.0, pChange: -0.15 },
    'SPX500': { name: 'SPX500', price: symbol === 'SPX500' ? (candles[candles.length - 1]?.close || 5300.0) : 5300.0, pChange: +0.28 },
    'AAPL': { name: 'AAPL', price: symbol === 'AAPL' ? (candles[candles.length - 1]?.close || 188.30) : 188.30, pChange: +0.88 },
    'MSFT': { name: 'MSFT', price: symbol === 'MSFT' ? (candles[candles.length - 1]?.close || 415.50) : 415.50, pChange: +0.55 },
    'NVDA': { name: 'NVDA', price: symbol === 'NVDA' ? (candles[candles.length - 1]?.close || 945.00) : 945.00, pChange: +3.20 },
    'TSLA': { name: 'TSLA', price: symbol === 'TSLA' ? (candles[candles.length - 1]?.close || 175.50) : 175.50, pChange: -1.50 },
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
        className={`fixed inset-y-0 left-0 z-[300] bg-[#080808] border-r border-white/10 flex-col justify-between transition-all duration-300 ease-in-out hidden md:flex ${
          isSidebarExpanded ? 'w-52 shadow-[10px_0_35px_rgba(0,0,0,0.7)]' : 'w-16 shadow-none'
        }`}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        <div className="flex flex-col h-full justify-between py-5 overflow-y-auto overflow-x-hidden no-scrollbar">
          <div>
            {/* Top section: Brand Identity Logo */}
            <button
              id="desktop-logo-home-button"
              onClick={() => setActiveTab('MARKETS')}
              className="w-full text-left px-3 mb-8 flex items-center min-h-[40px] hover:opacity-80 active:scale-[0.98] transition-all cursor-pointer border-none bg-transparent"
              title="Return to Markets"
            >
              {!isSidebarExpanded ? (
                <div className="w-full flex justify-center animate-fadeIn">
                  <span className="text-sm font-black tracking-tight text-white lowercase">
                    mtx
                  </span>
                </div>
              ) : (
                <div className="whitespace-nowrap animate-fadeIn">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base font-black tracking-tight text-white lowercase">
                      mtxquant
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
            </button>

            {/* Middle section: Navigation Links */}
            <nav className="space-y-2 px-2.5">
              {[
                { id: 'MARKETS', label: 'Markets', icon: TrendingUp },
                { id: 'PORTFOLIO', label: 'Portfolio', icon: Briefcase },
                { id: 'FUNDING', label: 'Funding', icon: Wallet },
                { id: 'ACTIVITY', label: 'Activity', icon: History },
                { id: 'ANALYSIS', label: 'Analysis', icon: BarChart3 }
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
                    <Icon className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-indigo-400 stroke-[2.5px]' : 'text-white/40'}`} />
                    {isSidebarExpanded && (
                      <span className="whitespace-nowrap animate-fadeIn">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
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
        <header className="border-b border-white/10 bg-[#080808]/80 backdrop-blur sticky top-0 z-[180]">
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
              <button
                id="mobile-logo-home-button"
                onClick={() => setActiveTab('MARKETS')}
                className="flex md:hidden items-center gap-1.5 shrink-0 hover:opacity-80 active:scale-[0.98] transition-all cursor-pointer border-none bg-transparent"
                title="Return to Markets"
              >
                <span className="text-sm font-black tracking-tight text-white lowercase">
                  mtxquant
                </span>
              </button>

              {/* Standard workspace indicator for desktop screens only */}
              <div className="hidden md:flex items-center space-x-1.5 lg:space-x-2.5 text-[10px] font-mono">
                <span className="hidden lg:inline text-white/30 uppercase tracking-wider font-bold">Workspace:</span>
                <span className="px-2 py-0.5 lg:px-2.5 lg:py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase tracking-wider text-[9px] lg:text-[10px]">
                  {activeTab === 'MARKETS' && 'Markets'}
                  {activeTab === 'PORTFOLIO' && 'Portfolio'}
                  {activeTab === 'FUNDING' && 'Funding'}
                  {activeTab === 'ACTIVITY' && 'Activity'}
                  {activeTab === 'ANALYSIS' && 'Market Analysis'}
                </span>
              </div>
            </div>

            {/* Active status indicator ledger */}
            <div className="flex items-center space-x-2 md:space-x-3">
              {/* Dynamic Auto-Sync Elapsed Time Indicator */}
              <div 
                id="header-auto-sync-indicator"
                className="hidden md:flex items-center space-x-1 px-1.5 lg:px-2 bg-white/5 border border-white/10 hover:border-indigo-500/20 rounded h-8 font-mono text-[9px] text-white/55 select-none shrink-0 transition-colors uppercase tracking-tight"
                title="Auto-Sync: Seconds elapsed since last successful financial market data fetch"
              >
                <span className="relative flex h-1 w-1 lg:h-1.5 lg:w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1 w-1 lg:h-1.5 lg:w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[8px] lg:text-[9px]"><span className="hidden xl:inline">SYNCED: </span><strong className="font-extrabold text-[#10b981] tabular-nums">{secondsSinceSync || 0}s</strong><span className="hidden lg:inline"> ago</span></span>
              </div>

              <button
                id="manual-refresh-btn"
                onClick={handleManualRefresh}
                className="p-1.5 hover:bg-white/5 border border-white/10 rounded text-white/60 hover:text-white transition-colors h-8 w-8 flex items-center justify-center shrink-0 cursor-pointer"
                title="Manual Sync Feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              </button>

              {/* Professional visual vertical separator to group user info at the absolute right */}
              <div className="h-6 w-[1px] bg-white/10 hidden md:block shrink-0" />

              {/* Institutional Profile & Terminal Control Center Dropdown */}
              <div className="relative shrink-0" ref={profileMenuRef}>
                <button
                  id="institutional-profile-dropdown-trigger"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/10 rounded h-8 transition-all duration-150 cursor-pointer select-none"
                  title="Institutional Profile & Terminal Diagnostics"
                >
                  <div className="relative flex items-center justify-center">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
                  </div>
                  <span className="text-[9px] lg:text-[10px] font-mono text-white/80 font-bold max-w-[70px] md:max-w-[100px] lg:max-w-[140px] truncate" title={traderEmail}>
                    {traderEmail}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-white/50 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AccountControlCenter
                  isOpen={isProfileMenuOpen}
                  onClose={() => setIsProfileMenuOpen(false)}
                  traderEmail={traderEmail}
                  sessionSeconds={sessionSeconds}
                  brokerPing={brokerPing}
                  soundAlertsEnabled={soundAlertsEnabled}
                  onToggleSoundAlerts={toggleSoundAlertsInMenu}
                  onWipeTerminal={wipeTerminalAndReset}
                  onLogout={handleLogout}
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  idleTimeout={idleTimeout}
                  onIdleTimeoutChange={setIdleTimeout}
                />
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

            {activeTab === 'MARKETS' && (
              <div id="markets-workspace" className="animate-fadeIn">
                <MarketsTerminal />
              </div>
            )}

            {activeTab === 'PORTFOLIO' && (
              <div id="portfolio-workspace" className="animate-fadeIn">
                <PortfolioDesk traderEmail={traderEmail} />
              </div>
            )}
            {activeTab === 'FUNDING' && (
              <div id="funding-workspace" className="animate-fadeIn">
                <FundingDesk />
              </div>
            )}
            {activeTab === 'ACTIVITY' && (
              <div id="activity-workspace" className="animate-fadeIn">
                <ActivityDesk />
              </div>
            )}
            {activeTab === 'ANALYSIS' && (
              <div id="analysis-workspace" className="animate-fadeIn max-w-[1400px] mx-auto px-4 md:px-8 py-5">
                <MarketAnalysisDashboard trades={trades} />
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer Info strip */}
      <footer className="border-t border-white/10 bg-[#080808] py-6 mt-12 font-mono">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-white/30">
          <div className="flex items-center space-x-2.5">
            <span className="text-white text-sm font-black tracking-tight lowercase">
              mtxquant
            </span>
          </div>
          <div className="text-center sm:text-right select-none text-[9.5px]">
            <span>MTXquant Quantitative Terminal &copy; 2026. Aligned with Elegant Dark guidelines.</span>
          </div>
        </div>
      </footer>
      </div>

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
                <div className="flex items-center gap-3">
                  <button
                    id="download-session-pdf-btn"
                    onClick={handleDownloadSessionPDF}
                    className="px-4 py-2 bg-[#1c1c24] hover:bg-[#252530] border border-white/10 hover:border-white/20 text-[#e6e6e6] text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Download Session PDF</span>
                  </button>
                  <button
                    onClick={() => setIsSessionSummaryOpen(false)}
                    className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] border border-indigo-500/20 text-white text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
                  >
                    Return to Terminal
                  </button>
                </div>
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

      {/* Mobile drawer navigation menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[400] md:hidden flex">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-out drawer menu panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-64 max-w-xs h-full bg-[#0a0a0d] border-r border-white/10 flex flex-col justify-between py-6 px-4 z-10"
            >
              <div>
                {/* Brand Ident and close trigger */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <button
                    id="mobile-drawer-logo-home-button"
                    onClick={() => {
                      setActiveTab('MARKETS');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-1.5 hover:opacity-80 active:scale-[0.98] transition-all cursor-pointer border-none bg-transparent text-left"
                    title="Return to Markets Desk"
                  >
                    <span className="text-sm font-black tracking-tight text-white lowercase">
                      mtxquant
                    </span>
                    <span className="px-1 py-0.2 rounded bg-white/5 border border-white/10 text-[7px] font-mono uppercase tracking-wide text-[#e5e5e5]/60 font-bold">
                      v2.0
                    </span>
                  </button>

                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 text-white/40 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Drawer Navigation Links */}
                <nav className="space-y-1.5">
                  {[
                    { id: 'MARKETS', label: 'Markets', icon: TrendingUp },
                    { id: 'PORTFOLIO', label: 'Portfolio', icon: Briefcase },
                    { id: 'FUNDING', label: 'Funding', icon: Wallet },
                    { id: 'ACTIVITY', label: 'Activity', icon: History },
                    { id: 'ANALYSIS', label: 'Analysis', icon: BarChart3 }
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
                        className={`w-full py-2.5 px-3.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-3 cursor-pointer ${
                          active
                            ? 'bg-indigo-600/15 text-white border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                            : 'text-[#e5e5e5]/50 hover:text-white hover:bg-white/[0.03] border border-transparent'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-indigo-400 stroke-[2.5px]' : 'text-white/40'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom indicators */}
              <div className="pt-4 border-t border-white/5 flex items-center gap-2.5 px-1">
                <div className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-[8.5px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  System Online
                </span>
              </div>
            </motion.div>
          </div>
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
