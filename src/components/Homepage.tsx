import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SistineFinancialCeiling from './SistineFinancialCeiling';
import { 
  ArrowRight, 
  LineChart, 
  Check, 
  ChevronDown, 
  Shield, 
  Scale, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  Briefcase,
  HelpCircle,
  ExternalLink,
  Activity,
  Wifi,
  Clock,
  Cpu,
  Sliders,
  List,
  Apple,
  Play,
  Search,
  Star,
  Volume2,
  VolumeX,
  Copy,
  Plus,
  Minus,
  Info,
  Sparkles,
  Lock,
  RefreshCw,
  UserPlus,
  Terminal,
  Menu,
  X
} from 'lucide-react';

interface WorkspaceSpec {
  id: string;
  name: string;
  files: string;
  badge: string;
  desc: string;
  features: string[];
  icon: React.ReactNode;
  seoTitle: string;
  roleExplanation: string;
}

const workspacesData: WorkspaceSpec[] = [
  {
    id: 'markets',
    name: 'Markets View',
    files: 'MarketsTerminal.tsx & TradeTerminal.tsx',
    badge: 'Core Engine',
    desc: 'The central engine of the platform. Integrates high-performance charts, live multi-asset order books, real-time index tickers, and the Order & Risk Calculator featuring Volatility-Based Position Sizing.',
    features: ['High-performance charting', 'Live Multi-Asset Order Books', 'Real-time Index Tickers', 'ATR Position Sizing & risk analytics'],
    icon: <LineChart className="w-4 h-4" />,
    seoTitle: "High-Performance Quantitative Trading Terminal (Markets View)",
    roleExplanation: "The central execution engine of the platform, combining low-latency multi-asset order books, custom technical analysis charts, and a dynamic order routing calculator with volatility-adjusted position sizing models."
  },
  {
    id: 'portfolio',
    name: 'Portfolio Desk',
    files: 'PortfolioDesk.tsx',
    badge: 'Risk/Analytics',
    desc: 'Detailed portfolio breakdown, compound returns calculator, leverage exposure checks, asset weight distributions, and margin requirement analytics.',
    features: ['Real-time Value-at-Risk calculations', 'Detailed portfolio asset breakdowns', 'Leverage exposure safety gates', 'Compound returns projection tool'],
    icon: <Briefcase className="w-4 h-4" />,
    seoTitle: "Real-Time Portfolio Risk Analysis & Compounding Calculator (Portfolio Desk)",
    roleExplanation: "A comprehensive capital tracking dashboard that conducts dynamic value-at-risk calculations, leverage exposure monitoring, and multi-year wealth accumulation projections."
  },
  {
    id: 'watchlist',
    name: 'Watchlist Dashboard',
    files: 'WatchlistPage.tsx',
    badge: 'Execution Filters',
    desc: 'Dynamic custom filters to monitor and jump quickly between multi-asset indexes and specific stock symbols.',
    features: ['Custom multi-asset tickers', 'Instant symbol switching', 'Continuous volatility monitoring', 'Saliency score calculations'],
    icon: <List className="w-4 h-4" />,
    seoTitle: "Dynamic Stock Watchlist & Market Volatility Filters (Watchlist Dashboard)",
    roleExplanation: "An execution filter that monitors high-frequency symbol data, offering immediate asset switching and calculating dynamic asset saliency metrics for priority execution."
  },
  {
    id: 'funding',
    name: 'Wallet Desk',
    files: 'FundingDesk.tsx',
    badge: 'Capital Custody',
    desc: 'Manage direct capital custody allocations, ledger settlements, instant wire transfers, and credit lines.',
    features: ['Direct ledger clearing', 'Secured institutional bank gateways', 'Credit line application engine', 'Segregated balance logs'],
    icon: <DollarSign className="w-4 h-4" />,
    seoTitle: "Institutional Wallet & Direct Capital Custody Desk (Wallet Desk)",
    roleExplanation: "The core liquidity desk supporting bank wire ledgers, segregated balance structures, institutional clearing controls, and credit line applications."
  },
  {
    id: 'activity',
    name: 'Activity Desk',
    files: 'ActivityDesk.tsx',
    badge: 'Certified Audits',
    desc: 'Audit historical trade execution receipts, transaction ledgers, and download certified quantitative reports.',
    features: ['Regulatory time-stamped ledgers', 'Certified PDF/CSV report exports', 'Execution receipt diagnostics', 'Transparent clearing fee receipts'],
    icon: <Activity className="w-4 h-4" />,
    seoTitle: "Compliant Transaction Audit Logs & Quantitative Trade Ledgers (Activity Desk)",
    roleExplanation: "A regulatory-compliant archive recording time-stamped transaction diagnostics, receipt histories, and certified quantitative export matrices."
  },
  {
    id: 'analysis',
    name: 'Market Analysis',
    files: 'MarketAnalysisDashboard.tsx',
    badge: 'Intelligence',
    desc: 'Deep mathematical insights, trend trackers, index performance comparisons, and statistical matrices.',
    features: ['Statistical asset correlation heatmaps', 'Dynamic trend indices', 'Index benchmarking models', 'Mathematical performance layers'],
    icon: <TrendingUp className="w-4 h-4" />,
    seoTitle: "Mathematical Asset Correlation & Intelligence Center (Market Analysis)",
    roleExplanation: "An analytics center generating Pearson asset correlation heatmaps, dynamic trend indices, and deep index benchmarking models for systemic strategies."
  }
];

interface InstrumentSpec {
  name: string;
  badge?: string;
  badgeType?: 'yield' | 'apy' | 'match' | 'neutral';
  category: string;
  desc: string;
  specs: { label: string; value: string }[];
}

const INSTRUMENT_SPECS: Record<string, InstrumentSpec> = {
  "Stocks": {
    name: "Stocks",
    category: "Equities Routing Core",
    desc: "Direct market routing to primary US and global exchanges. Fully compatible with real-time portfolio margin systems and capital sweep architectures.",
    specs: [
      { label: "Execution Latency", value: "< 1.2ms" },
      { label: "Shorting Availability", value: "94% easy-to-borrow" },
      { label: "Prime Leverage", value: "Up to 6.5x" }
    ]
  },
  "Bonds": {
    name: "Bonds",
    category: "Fixed Income Ledger",
    desc: "Direct institutional clearing for corporate debt, high-yield primary issuances, and secondary market liquidity pools.",
    specs: [
      { label: "Clearing Venue", value: "Euroclear / DTCC" },
      { label: "Settlement Protocol", value: "T+1 DvP" },
      { label: "Minimum Parcel Size", value: "$5,000" }
    ]
  },
  "Treasuries": {
    name: "Treasuries",
    category: "Sovereign Debt Cleared",
    desc: "Direct purchase and custody of short-term US Treasury Bills, Notes, and Bonds. Integrated into automated collateral margin pools.",
    specs: [
      { label: "Maturity Spans", value: "4-Week to 30-Year" },
      { label: "Secondary Liquidity", value: "Instantaneous" },
      { label: "Collateral Value Rate", value: "99.0% Haircut" }
    ]
  },
  "Options": {
    name: "Options",
    category: "Derivatives Pipeline",
    desc: "Multi-leg option contract routing with automated risk parameter checks and millisecond level delta-neutral clearing pipelines.",
    specs: [
      { label: "Contract Cleared", value: "OCC Regulated" },
      { label: "Margin Ruleset", value: "TIMS Model (VaR)" },
      { label: "Routing Latency", value: "< 850μs" }
    ]
  },
  "Crypto": {
    name: "Crypto",
    category: "Digital Assets Vault",
    desc: "Physical spot and futures crypto clearing featuring off-exchange settlement security, deep aggregated books, and tight bid-ask spreads.",
    specs: [
      { label: "Supported Networks", value: "BTC, ETH, SOL, EVM" },
      { label: "Custodial Structure", value: "Sovereign Trust" },
      { label: "Execution Sourcing", value: "18+ LP Aggregators" }
    ]
  },
  "ETFs": {
    name: "ETFs",
    category: "Equities Aggregates",
    desc: "Exchange Traded Funds across all primary indices, commodities, and sectors with fractional share allocations and zero commission drag.",
    specs: [
      { label: "Basket Availability", value: "1,200+ Registered" },
      { label: "Liquidity Provider", value: "Jane Street / Citadel" },
      { label: "Clearing Speed", value: "Instantaneous Credit" }
    ]
  },
  "Bond Account": {
    name: "Bond Account",
    category: "Securitized Portfolios",
    desc: "Yield-optimized active bond portfolio managed programmatically to capture maximum interest rate premiums with robust defensive hedging.",
    specs: [
      { label: "Target Yield", value: "Optimized Yield*" },
      { label: "Risk Coefficient", value: "AA- Rated Sovereign" },
      { label: "Rebalancing Rate", value: "Weekly Algorithmic" }
    ]
  },
  "High-Yield Cash Account": {
    name: "High-Yield Cash Account",
    category: "Cash Sweep Network",
    desc: "High-yield cash management sweep program routing cash blocks to multiple Tier-1 partner banks for expanded FDIC coverage limits.",
    specs: [
      { label: "Yield (APY)", value: "Compounded APY*" },
      { label: "Withdrawal Delay", value: "Instant (Real-Time)" },
      { label: "FDIC Coverage", value: "Up to $5M Structured" }
    ]
  },
  "Treasury Account": {
    name: "Treasury Account",
    category: "Sovereign Debt Cleared",
    desc: "A pure treasury routing vehicle designed for short-term yield maximization, offering high protection from inflation and low credit risk.",
    specs: [
      { label: "Yield Basis", value: "US Fed Funds Rate Proxy" },
      { label: "Custody Bank", value: "BNY Mellon" },
      { label: "Tax Exemption", value: "State & Local Exempt" }
    ]
  },
  "Direct Indexing": {
    name: "Direct Indexing",
    category: "Portfolio Optimization",
    desc: "Bypass standard ETF expense ratios by owning individual benchmark stocks directly. Empowers precision tax-loss harvesting models.",
    specs: [
      { label: "Benchmark Mimics", value: "S&P 500, Nasdaq-100" },
      { label: "Tax Optimization", value: "Automated Loss Harvesting" },
      { label: "Tracking Error", value: "< 0.05%" }
    ]
  },
  "Generated Assets": {
    name: "Generated Assets",
    category: "Synthetics Synthesizer",
    desc: "Synthesized multi-asset index combinations customized to precise risk-hedging targets or specific regional market vectors.",
    specs: [
      { label: "Asset Synthesizer", value: "Risk-Parametric Engine" },
      { label: "Rebalancing Cadence", value: "Daily Volatility Adjust" },
      { label: "Leverage Factor", value: "1.0x - 3.0x Custom" }
    ]
  },
  "Investment Plans": {
    name: "Investment Plans",
    category: "Wealth Accumulation",
    desc: "Pre-configured, automated recurring allocation paths tailored for compounding wealth with customizable periodic triggers.",
    specs: [
      { label: "Frequencies", value: "Daily, Weekly, Monthly" },
      { label: "Asset Weighting", value: "Smart Weight Re-allocator" },
      { label: "Auto-Rebalancing", value: "Configurable Deviations" }
    ]
  },
  "IRAs": {
    name: "IRAs",
    badge: "1% MATCH",
    badgeType: "match",
    category: "Retirement Planning",
    desc: "Traditional and Roth tax-advantaged IRAs offering a complimentary 1% match to accelerate your long-term compounding velocity.",
    specs: [
      { label: "Contribution Match", value: "1% Capital Boost*" },
      { label: "Account Types", value: "Traditional & Roth IRA" },
      { label: "Asset Constraints", value: "Zero (Unrestricted Multi-Asset)" }
    ]
  },
  "Crypto IRA": {
    name: "Crypto IRA",
    category: "Retirement Planning",
    desc: "Hold direct physical, institutional-custody cryptocurrencies within a legally compliant, tax-sheltered retirement account structure.",
    specs: [
      { label: "Available Crypto", value: "BTC, ETH, SOL, AVAX" },
      { label: "Cold Custody Partner", value: "Coinbase Custody" },
      { label: "Tax Implications", value: "Deferred or Tax-Free Gains" }
    ]
  },
  "Agents": {
    name: "Agents",
    category: "Quantitative Tech Core",
    desc: "Deploy autonomous AI trading and risk management agents running continuous portfolio optimization and stop-loss monitoring.",
    specs: [
      { label: "Execution Model", value: "Gemini-Powered Volatility Guard" },
      { label: "Continuous Audit", value: "24/7/365 Non-stop" },
      { label: "Response SLA", value: "< 250ms Active Adjust" }
    ]
  },
  "API": {
    name: "API",
    category: "Quantitative Tech Core",
    desc: "Ultra-low latency REST and WebSocket direct market access (DMA) feeds built for proprietary algorithmic execution corridors.",
    specs: [
      { label: "Connection Protocols", value: "FIX 4.4, JSON REST, WebSockets" },
      { label: "Tick-to-Trade speed", value: "< 450μs" },
      { label: "Rate Limits", value: "Unlimited with Dedicated Nodes" }
    ]
  }
};

const instrumentRows = [
  [
    { name: "Stocks", hasBadge: false },
    { name: "Bonds", hasBadge: false },
    { name: "Treasuries", hasBadge: false },
    { name: "Options", hasBadge: false },
    { name: "Crypto", hasBadge: false },
    { name: "ETFs", hasBadge: false }
  ],
  [
    { name: "Bond Account", hasBadge: false },
    { name: "High-Yield Cash Account", hasBadge: false }
  ],
  [
    { name: "Treasury Account", hasBadge: false },
    { name: "Direct Indexing", hasBadge: false },
    { name: "Generated Assets", hasBadge: false }
  ],
  [
    { name: "Investment Plans", hasBadge: false },
    { name: "IRAs", hasBadge: true, badge: "1% MATCH", badgeType: "match" },
    { name: "Crypto IRA", hasBadge: false },
    { name: "Agents", hasBadge: false },
    { name: "API", hasBadge: false }
  ]
];

function generateMockBars(ticker: string, range: string, basePrice: number): { timestamp: string; close: number }[] {
  const barsCount = range === '5D' ? 40 : range === '1MO' ? 30 : range === '3MO' ? 60 : 120;
  const bars: { timestamp: string; close: number }[] = [];
  const now = new Date();
  
  let currentPrice = basePrice;
  const isPositive = ticker === 'AAPL' || ticker === 'NVDA';
  const overallTrend = isPositive ? 0.08 : -0.05;
  
  const pricesReversed: number[] = [basePrice];
  for (let i = 1; i < barsCount; i++) {
    const trendEffect = overallTrend * basePrice * (1 / barsCount);
    const wave = Math.sin(i * 0.4) * (basePrice * 0.015);
    const noise = Math.cos(i * 0.95) * (basePrice * 0.006);
    currentPrice = currentPrice - trendEffect + wave + noise;
    pricesReversed.push(currentPrice);
  }
  
  const prices = pricesReversed.reverse();
  
  for (let i = 0; i < barsCount; i++) {
    const d = new Date(now.getTime() - (barsCount - 1 - i) * 24 * 60 * 60 * 1000);
    bars.push({
      timestamp: d.toISOString(),
      close: parseFloat(prices[i].toFixed(2))
    });
  }
  
  return bars;
}

interface WorkspaceVisualSimulatorProps {
  activeWorkspace: string;
  onLaunchTerminal: () => void;
}

function WorkspaceVisualSimulator({ activeWorkspace, onLaunchTerminal }: WorkspaceVisualSimulatorProps) {
  // --- Markets view states ---
  const [selectedSymbol, setSelectedSymbol] = useState<'AAPL' | 'TSLA' | 'NVDA' | 'BTC'>('AAPL');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('sell');
  const [quantity, setQuantity] = useState<string>('100');
  const [activeTimeframe, setActiveTimeframe] = useState<'5D' | '1MO' | '3MO' | '1Y'>('5D');
  const [bracketProtection, setBracketProtection] = useState<boolean>(false);
  const [isOrderRouting, setIsOrderRouting] = useState<boolean>(false);
  const [routingSuccess, setRoutingSuccess] = useState<string | null>(null);

  // Mobile order execution desk minimized view states
  const [showExecutionDetails, setShowExecutionDetails] = useState<boolean>(false);
  const executionDeskRef = useRef<HTMLDivElement>(null);

  // Automation & simulation refs and states
  const containerRef = useRef<HTMLDivElement>(null);
  const symbolSelectorRef = useRef<HTMLButtonElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const [cursor, setCursor] = useState<{ x: number | string; y: number | string; visible: boolean; clicking: boolean }>({
    x: '50%',
    y: '50%',
    visible: false,
    clicking: false
  });

  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);

  // Track if we are on a mobile device to disable auto-simulations
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keep track of the last user interaction time
  const lastInteractionTimeRef = useRef<number>(0);

  // Custom symbol selection states & real market data
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState<boolean>(false);
  const [timeframeDates, setTimeframeDates] = useState<string[]>(['Jul 2', 'Jul 6', 'Jul 7', 'Jul 8', 'Jul 9']);
  const [realData, setRealData] = useState<{
    price: number;
    change: string;
    isPositive: boolean;
    path: string;
    pulseY: number;
    prices: number[];
    bars?: any[];
  } | null>(null);
  const [loadingRealData, setLoadingRealData] = useState<boolean>(false);
  const [hoveredBar, setHoveredBar] = useState<{ timestamp: string; close: number; x: number; y: number } | null>(null);

  useEffect(() => {
    let active = true;
    const fetchRealData = async () => {
      setLoadingRealData(true);
      try {
        const ticker = selectedSymbol === 'BTC' ? 'BTC-USD' : selectedSymbol;
        const rangeMap: Record<string, string> = {
          '5D': '5d',
          '1MO': '1mo',
          '3MO': '3mo',
          '1Y': '1y'
        };
        const range = rangeMap[activeTimeframe] || '5d';
        const res = await fetch(`/api/markets/historical?ticker=${ticker}&range=${range}`);
        if (!res.ok) throw new Error('API fetch error');
        const data = await res.json();
        
        if (active && data && data.bars && data.bars.length > 0) {
          const bars = data.bars;
          const prices = bars.map((b: any) => b.close);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const priceRange = maxPrice - minPrice || 1;
          
          // Generate dynamic path within viewBox bounds [0, 440] x [15, 85]
          const path = bars.map((bar: any, index: number) => {
            const x = 10 + (index / (bars.length - 1)) * 420;
            const y = 85 - ((bar.close - minPrice) / priceRange) * 70;
            return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(' ');

          const price = data.regularMarketPrice || prices[prices.length - 1];
          const startPrice = prices[0];
          const pctChange = startPrice ? ((price - startPrice) / startPrice) * 100 : 0;
          const isPositive = pctChange >= 0;
          const change = `${isPositive ? '+' : ''}${pctChange.toFixed(2)}% (${activeTimeframe})`;
          
          const pulseY = 85 - ((prices[prices.length - 1] - minPrice) / priceRange) * 70;

          setRealData({
            price,
            change,
            isPositive,
            path,
            pulseY,
            prices: [maxPrice, price, minPrice],
            bars
          });

          // Generate date labels dynamically
          const fallbackDates = ['Jul 2', 'Jul 6', 'Jul 7', 'Jul 8', 'Jul 9'];
          if (bars.length >= 5) {
            const step = Math.floor(bars.length / 4);
            const selectedBars = [
              bars[0],
              bars[step],
              bars[step * 2],
              bars[step * 3],
              bars[bars.length - 1]
            ];
            const dateLabels = selectedBars.map((b: any) => {
              const d = new Date(b.timestamp);
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
            setTimeframeDates(dateLabels);
          } else {
            setTimeframeDates(fallbackDates);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch real market data, using fallback:', err);
        if (active) {
          setRealData(null);
          setTimeframeDates(['Jul 2', 'Jul 6', 'Jul 7', 'Jul 8', 'Jul 9']);
        }
      } finally {
        if (active) {
          setLoadingRealData(false);
        }
      }
    };

    fetchRealData();
    return () => {
      active = false;
    };
  }, [selectedSymbol, activeTimeframe]);

  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (executionDeskRef.current && !executionDeskRef.current.contains(event.target as Node)) {
        if (window.innerWidth < 768) {
          setShowExecutionDetails(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);



  // --- Portfolio view states ---
  const [varLimit, setVarLimit] = useState<number>(1.24);
  const [portfolioYears, setPortfolioYears] = useState<number>(5);

  // --- Watchlist view states ---
  const [watchlistQuery, setWatchlistQuery] = useState<string>('');
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);

  // --- Funding view states ---
  const [fundingAmount, setFundingAmount] = useState<string>('50000');
  const [fundingBank, setFundingBank] = useState<string>('J.P. Morgan');
  const [fundingSuccess, setFundingSuccess] = useState<string | null>(null);

  // --- Settings view states ---
  const [panicKeyEnabled, setPanicKeyEnabled] = useState<boolean>(true);
  const [alertThreshold, setAlertThreshold] = useState<number>(320);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [settingsMuteAudio, setSettingsMuteAudio] = useState<boolean>(false);

  // Handle simulated routing button click
  const handleSimulatedOrder = () => {
    const numericQty = parseFloat(quantity) || 0;
    if (numericQty < 50) {
      alert("Minimum purchase amount is $50.00 for fractional shares.");
      return;
    }
    setIsOrderRouting(true);
    setRoutingSuccess(null);
    setTimeout(() => {
      setIsOrderRouting(false);
      const calculatedShares = numericQty / currentDetails.price;
      setRoutingSuccess(`SIMULATED ORDER DEPLOYED: Successfully routed $${numericQty.toFixed(2)} (${calculatedShares.toFixed(6)} shares) of ${selectedSymbol} in sandbox mode.`);
      setTimeout(() => setRoutingSuccess(null), 5000);
    }, 1200);
  };

  const handleSimulatedOrderRef = useRef(handleSimulatedOrder);
  useEffect(() => {
    handleSimulatedOrderRef.current = handleSimulatedOrder;
  }, [handleSimulatedOrder]);

  useEffect(() => {
    if (activeWorkspace !== 'markets') {
      setIsIntersecting(false);
      return;
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [activeWorkspace]);

  useEffect(() => {
    if (isMobile || !isIntersecting || activeWorkspace !== 'markets') {
      setCursor(prev => ({ ...prev, visible: false }));
      return;
    }

    let active = true;

    // Track user interactions globally
    const handleUserInteraction = () => {
      lastInteractionTimeRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleUserInteraction, { passive: true });
    window.addEventListener('mousedown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('wheel', handleUserInteraction, { passive: true });

    const pauseIfInteracting = async () => {
      while (active && isIntersecting) {
        const timeSinceInteraction = Date.now() - lastInteractionTimeRef.current;
        if (timeSinceInteraction < 8000) {
          // Hide custom cursor immediately during user interaction
          setCursor(prev => (prev.visible ? { ...prev, visible: false } : prev));
          await new Promise(r => setTimeout(r, 200));
        } else {
          break;
        }
      }
    };

    const delay = (ms: number) => new Promise<void>(async (resolve) => {
      let accumulated = 0;
      const step = 100;
      while (accumulated < ms && active && isIntersecting) {
        await pauseIfInteracting();
        if (!active || !isIntersecting) break;
        await new Promise(r => setTimeout(r, step));
        accumulated += step;
      }
      resolve();
    });

    const getRelativePos = (element: HTMLElement | null) => {
      if (!element || !containerRef.current) return { x: '50%', y: '50%' };
      const parentRect = containerRef.current.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top + rect.height / 2
      };
    };

    const tickers: Array<'AAPL' | 'TSLA' | 'NVDA' | 'BTC'> = ['AAPL', 'TSLA', 'NVDA', 'BTC'];
    let currentTickerIdx = 0;

    const runLoop = async () => {
      // Small initial delay before starting simulation
      await delay(1500);

      while (active && isIntersecting) {
        await pauseIfInteracting();
        if (!active || !isIntersecting) break;

        // Force execution details to be open
        setShowExecutionDetails(true);

        const targetTicker = tickers[currentTickerIdx];
        currentTickerIdx = (currentTickerIdx + 1) % tickers.length;

        // Step 1: Hover over Symbol Selector
        await pauseIfInteracting();
        if (!active) break;
        const selectorEl = symbolSelectorRef.current || document.getElementById('homepage-symbol-selector');
        if (selectorEl) {
          const pos = getRelativePos(selectorEl as HTMLElement);
          setCursor({ x: pos.x, y: pos.y, visible: true, clicking: false });
          await delay(1200);

          await pauseIfInteracting();
          if (!active) break;
          // Click it
          setCursor(prev => ({ ...prev, clicking: true, visible: true }));
          setIsSymbolDropdownOpen(true);
          await delay(250);

          await pauseIfInteracting();
          if (!active) break;
          setCursor(prev => ({ ...prev, clicking: false, visible: true }));
          await delay(800);
        }

        // Step 2: Select the specific ticker option from dropdown
        await pauseIfInteracting();
        if (!active) break;
        const optEl = document.getElementById(`homepage-dropdown-opt-${targetTicker}`);
        if (optEl) {
          const pos = getRelativePos(optEl);
          setCursor({ x: pos.x, y: pos.y, visible: true, clicking: false });
          await delay(1200);

          await pauseIfInteracting();
          if (!active) break;
          // Click it
          setCursor(prev => ({ ...prev, clicking: true, visible: true }));
          setSelectedSymbol(targetTicker);
          setIsSymbolDropdownOpen(false);
          await delay(250);

          await pauseIfInteracting();
          if (!active) break;
          setCursor(prev => ({ ...prev, clicking: false, visible: true }));
          await delay(1000);
        } else {
          // Fallback if dropdown opt not in DOM
          setSelectedSymbol(targetTicker);
          setIsSymbolDropdownOpen(false);
          await delay(1000);
        }

        // Step 3: Select random timeframe
        await pauseIfInteracting();
        if (!active) break;
        const timeframes: Array<'5D' | '1MO' | '3MO' | '1Y'> = ['5D', '1MO', '3MO', '1Y'];
        const randomTf = timeframes[Math.floor(Math.random() * timeframes.length)];
        const tfEl = document.getElementById(`homepage-tf-btn-${randomTf}`);
        if (tfEl) {
          const pos = getRelativePos(tfEl);
          setCursor({ x: pos.x, y: pos.y, visible: true, clicking: false });
          await delay(1200);

          await pauseIfInteracting();
          if (!active) break;
          setCursor(prev => ({ ...prev, clicking: true, visible: true }));
          setActiveTimeframe(randomTf);
          await delay(250);

          await pauseIfInteracting();
          if (!active) break;
          setCursor(prev => ({ ...prev, clicking: false, visible: true }));
          await delay(1000);
        }

        // Step 3.5: Select random side (BUY or SELL)
        await pauseIfInteracting();
        if (!active) break;
        const randomSide = Math.random() > 0.5 ? 'buy' : 'sell';
        const sideEl = document.getElementById(randomSide === 'buy' ? 'homepage-buy-btn' : 'homepage-sell-btn');
        if (sideEl) {
          const pos = getRelativePos(sideEl);
          setCursor({ x: pos.x, y: pos.y, visible: true, clicking: false });
          await delay(1200);

          await pauseIfInteracting();
          if (!active) break;
          setCursor(prev => ({ ...prev, clicking: true, visible: true }));
          setTradeType(randomSide);
          await delay(250);

          await pauseIfInteracting();
          if (!active) break;
          setCursor(prev => ({ ...prev, clicking: false, visible: true }));
          await delay(1000);
        } else {
          setTradeType(randomSide);
          await delay(1000);
        }

        // Step 4: Hover over Quantity input & simulate typing
        await pauseIfInteracting();
        if (!active) break;
        const qtyEl = amountInputRef.current || document.getElementById('homepage-qty-input');
        if (qtyEl) {
          const pos = getRelativePos(qtyEl as HTMLElement);
          setCursor({ x: pos.x, y: pos.y, visible: true, clicking: false });
          await delay(1000);

          await pauseIfInteracting();
          if (!active) break;
          setCursor(prev => ({ ...prev, clicking: true, visible: true }));
          await delay(200);

          await pauseIfInteracting();
          if (!active) break;
          setCursor(prev => ({ ...prev, clicking: false, visible: true }));

          // Select a random amount from 100 to thousands
          const possibleAmounts = [150, 250, 500, 750, 1000, 1500, 2000, 2500, 3500, 5000];
          const randomAmount = possibleAmounts[Math.floor(Math.random() * possibleAmounts.length)];
          const amountStr = String(randomAmount);

          // Simulate typing digit-by-digit
          for (let i = 1; i <= amountStr.length; i++) {
            await pauseIfInteracting();
            if (!active) break;
            setQuantity(amountStr.substring(0, i));
            await delay(250);
          }
          await delay(1000);
        }

        // Step 5: Hover over Route Simulated Order Button
        await pauseIfInteracting();
        if (!active) break;
        const submitEl = submitButtonRef.current || document.getElementById('homepage-submit-btn');
        if (submitEl) {
          const pos = getRelativePos(submitEl as HTMLElement);
          setCursor({ x: pos.x, y: pos.y, visible: true, clicking: false });
          await delay(1200);

          await pauseIfInteracting();
          if (!active) break;
          setCursor(prev => ({ ...prev, clicking: true, visible: true }));
          if (handleSimulatedOrderRef.current) {
            handleSimulatedOrderRef.current();
          }
          await delay(300);

          await pauseIfInteracting();
          if (!active) break;
          setCursor(prev => ({ ...prev, clicking: false, visible: true }));

          // Wait for order success and notification display
          await delay(5000);
        }

        // Small break before starting with the next ticker
        await delay(1500);
      }
    };

    runLoop();

    return () => {
      active = false;
      setCursor(prev => ({ ...prev, visible: false }));
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('mousedown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('wheel', handleUserInteraction);
    };
  }, [isIntersecting, activeWorkspace, isMobile]);

  // Helper values for symbols
  const symbolDetails = {
    AAPL: { price: 316.22, change: '+5.28% (5D)', isPositive: true, 
      paths: {
        '5D': 'M 10,80 Q 40,30 80,60 T 150,40 T 220,70 T 290,50 T 360,30 T 430,15',
        '1MO': 'M 10,90 Q 50,70 100,50 T 200,80 T 300,40 T 430,25',
        '3MO': 'M 10,70 Q 60,85 120,40 T 240,65 T 360,20 T 430,45',
        '1Y': 'M 10,50 Q 70,80 140,95 T 280,30 T 430,15'
      }
    },
    TSLA: { price: 248.50, change: '-5.15% (5D)', isPositive: false,
      paths: {
        '5D': 'M 10,20 Q 45,70 90,40 T 170,85 T 250,55 T 330,75 T 430,90',
        '1MO': 'M 10,40 Q 60,80 120,70 T 240,95 T 360,85 T 430,60',
        '3MO': 'M 10,90 Q 70,50 145,75 T 290,40 T 430,80',
        '1Y': 'M 10,65 Q 80,45 150,85 T 300,50 T 430,70'
      }
    },
    NVDA: { price: 128.45, change: '+8.85% (5D)', isPositive: true,
      paths: {
        '5D': 'M 10,95 Q 40,90 80,80 T 160,70 T 240,50 T 320,30 T 430,5',
        '1MO': 'M 10,90 Q 60,80 125,60 T 250,40 T 375,15 T 430,8',
        '3MO': 'M 10,85 Q 70,75 140,55 T 280,25 T 430,12',
        '1Y': 'M 10,95 Q 80,85 160,60 T 320,20 T 430,10'
      }
    },
    BTC: { price: 58450.00, change: '-1.27% (5D)', isPositive: false,
      paths: {
        '5D': 'M 10,45 Q 40,80 80,65 T 160,50 T 240,75 T 320,35 T 430,55',
        '1MO': 'M 10,55 Q 60,35 125,45 T 250,75 T 375,50 T 430,65',
        '3MO': 'M 10,40 Q 70,60 145,50 T 290,65 T 430,50',
        '1Y': 'M 10,35 Q 80,55 160,40 T 320,60 T 430,45'
      }
    }
  };

  const fallbackDetails = symbolDetails[selectedSymbol];
  const fallbackBars = useMemo(() => {
    return generateMockBars(selectedSymbol, activeTimeframe, fallbackDetails.price);
  }, [selectedSymbol, activeTimeframe, fallbackDetails.price]);

  const currentDetails = realData ? {
    price: realData.price,
    change: realData.change,
    isPositive: realData.isPositive,
    path: realData.path,
    pulseY: realData.pulseY,
    prices: realData.prices,
    bars: realData.bars || []
  } : (() => {
    const prices = fallbackBars.map(b => b.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const path = fallbackBars.map((bar, index) => {
      const x = 10 + (index / (fallbackBars.length - 1)) * 420;
      const y = 85 - ((bar.close - minPrice) / priceRange) * 70;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const pulseY = 85 - ((prices[prices.length - 1] - minPrice) / priceRange) * 70;
    return {
      price: fallbackDetails.price,
      change: fallbackDetails.change,
      isPositive: fallbackDetails.isPositive,
      path,
      pulseY,
      prices: [maxPrice, fallbackDetails.price, minPrice],
      bars: fallbackBars
    };
  })();

  const estTotal = (parseFloat(quantity) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="w-full flex-1 flex flex-col justify-between space-y-4">
      {/* 1. MARKETS VIEW SIMULATOR */}
      {activeWorkspace === 'markets' && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 text-xs font-mono text-neutral-300 relative"
        >
          
          {/* Simulated search & filters */}
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-900 pb-3">
            <div className="relative flex-1 min-w-[150px] z-50">
              <button 
                type="button"
                id="homepage-symbol-selector"
                ref={symbolSelectorRef}
                onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded pl-7 pr-8 py-1.5 text-white font-mono text-[10px] focus:outline-none focus:border-amber-500/50 flex items-center justify-between cursor-pointer"
              >
                <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-neutral-400" />
                <span>
                  {selectedSymbol === 'AAPL' ? 'AAPL (Apple Inc.)' :
                   selectedSymbol === 'TSLA' ? 'TSLA (Tesla Inc.)' :
                   selectedSymbol === 'NVDA' ? 'NVDA (NVIDIA Corp.)' :
                   'BTCUSD (Bitcoin)'}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>
 
              {isSymbolDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsSymbolDropdownOpen(false)} 
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-950 border border-neutral-850 rounded shadow-2xl z-50 overflow-hidden py-1">
                    {[
                      { val: 'AAPL', label: 'AAPL (Apple Inc.)' },
                      { val: 'TSLA', label: 'TSLA (Tesla Inc.)' },
                      { val: 'NVDA', label: 'NVDA (NVIDIA Corp.)' },
                      { val: 'BTC', label: 'BTCUSD (Bitcoin)' }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        id={`homepage-dropdown-opt-${opt.val}`}
                        onClick={() => {
                          setSelectedSymbol(opt.val as any);
                          setIsSymbolDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[10px] font-mono hover:bg-neutral-900 transition-colors cursor-pointer flex items-center justify-between ${
                          selectedSymbol === opt.val ? 'text-amber-400 bg-neutral-900/40' : 'text-neutral-300'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {selectedSymbol === opt.val && <Check className="w-3 h-3 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-1 bg-neutral-900/10 p-0.5 rounded border border-neutral-800/40">
              {(['5D', '1MO', '3MO', '1Y'] as const).map(tf => (
                <button
                  key={tf}
                  id={`homepage-tf-btn-${tf}`}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all ${
                    activeTimeframe === tf 
                      ? 'bg-neutral-800 text-white' 
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <button 
              onClick={() => onLaunchTerminal()}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black rounded font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 transition-all"
            >
              <Sparkles className="w-2.5 h-2.5" />
              Discover
            </button>
          </div>

          {/* Core trading workspace dual columns */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* Chart Area */}
            <div className={`${isMobile ? 'col-span-1 md:col-span-12' : 'md:col-span-7'} bg-transparent border border-neutral-800/50 rounded p-3 flex flex-col justify-between relative hover:bg-neutral-900/10 transition-all duration-300 ease-in-out ${
              showExecutionDetails && !isMobile ? 'min-h-[190px]' : 'min-h-[295px] md:min-h-[190px]'
            }`}>
              <div className="flex items-center justify-between select-none">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-bold text-sm tracking-tight">{selectedSymbol}</span>
                  {hoveredBar ? (
                    <span className="text-amber-400 text-xs font-bold font-mono transition-colors duration-150">
                      ${hoveredBar.close.toLocaleString(undefined, { minimumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2, maximumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2 })}
                    </span>
                  ) : (
                    <span className="text-neutral-300 text-xs">
                      ${currentDetails.price.toLocaleString(undefined, { minimumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2, maximumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2 })}
                    </span>
                  )}
                  <span className="text-[10px] text-neutral-400 font-normal font-mono">USD</span>
                  <button className="text-neutral-300 hover:text-amber-500 transition-colors">
                    <Star className="w-3 h-3 fill-current" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  {hoveredBar ? (
                    <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 transition-colors duration-150">
                      {new Date(hoveredBar.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] border border-neutral-850 px-1.5 py-0.5 rounded text-neutral-300">Financials</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        currentDetails.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {currentDetails.change}
                      </span>
                    </>
                  )}
                </div>
              </div>

               {/* Responsive SVG Chart */}
              <div 
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const chartWidth = rect.width - 48; // Adjust for pr-12 padding-right
                  if (chartWidth <= 0) return;
                  const clientX = e.clientX - rect.left;
                  const xRatio = Math.max(0, Math.min(1, clientX / chartWidth));
                  const bars = currentDetails.bars;
                  if (!bars || bars.length === 0) return;
                  const index = Math.round(xRatio * (bars.length - 1));
                  const bar = bars[index];
                  if (!bar) return;
                  const svgX = 10 + (index / (bars.length - 1)) * 420;
                  const prices = bars.map((b: any) => b.close);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  const priceRange = maxPrice - minPrice || 1;
                  const svgY = 85 - ((bar.close - minPrice) / priceRange) * 70;
                  setHoveredBar({
                    timestamp: bar.timestamp,
                    close: bar.close,
                    x: svgX,
                    y: svgY
                  });
                }}
                onMouseLeave={() => setHoveredBar(null)}
                onTouchMove={(e) => {
                  if (e.touches.length === 0) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const chartWidth = rect.width - 48;
                  if (chartWidth <= 0) return;
                  const clientX = e.touches[0].clientX - rect.left;
                  const xRatio = Math.max(0, Math.min(1, clientX / chartWidth));
                  const bars = currentDetails.bars;
                  if (!bars || bars.length === 0) return;
                  const index = Math.round(xRatio * (bars.length - 1));
                  const bar = bars[index];
                  if (!bar) return;
                  const svgX = 10 + (index / (bars.length - 1)) * 420;
                  const prices = bars.map((b: any) => b.close);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  const priceRange = maxPrice - minPrice || 1;
                  const svgY = 85 - ((bar.close - minPrice) / priceRange) * 70;
                  setHoveredBar({
                    timestamp: bar.timestamp,
                    close: bar.close,
                    x: svgX,
                    y: svgY
                  });
                }}
                onTouchEnd={() => setHoveredBar(null)}
                className={`relative w-full pr-12 my-3 transition-all duration-300 ease-in-out cursor-crosshair select-none ${
                  showExecutionDetails ? 'h-24' : 'h-48 md:h-24'
                }`}
              >
                {loadingRealData && (
                  <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-[0.5px] flex items-center justify-center z-10 rounded">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  </div>
                )}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 440 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={currentDetails.isPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={currentDetails.isPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="440" y2="20" stroke="#16161c" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="0" y1="50" x2="440" y2="50" stroke="#16161c" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1="0" y1="80" x2="440" y2="80" stroke="#16161c" strokeWidth="0.5" strokeDasharray="3,3" />

                  {/* Shaded Area */}
                  <path
                    d={`${currentDetails.path} L 430,100 L 10,100 Z`}
                    fill="url(#chartGradient)"
                    className="transition-all duration-500 ease-in-out"
                  />

                  {/* Main Line */}
                  <path
                    d={currentDetails.path}
                    fill="none"
                    stroke={currentDetails.isPositive ? '#10b981' : '#ef4444'}
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-in-out"
                  />
                  
                  {/* Pulsing endpoint dot */}
                  <circle cx="430" cy={currentDetails.pulseY} r="3" fill={currentDetails.isPositive ? '#10b981' : '#ef4444'} className="animate-pulse" />

                  {/* Hover HUD Indicators */}
                  {hoveredBar && (
                    <>
                      {/* Vertical Guideline */}
                      <line
                        x1={hoveredBar.x}
                        y1="10"
                        x2={hoveredBar.x}
                        y2="90"
                        stroke="#f59e0b"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                        opacity="0.85"
                      />

                      {/* Horizontal Guideline */}
                      <line
                        x1="10"
                        y1={hoveredBar.y}
                        x2="430"
                        y2={hoveredBar.y}
                        stroke="#f59e0b"
                        strokeWidth="0.5"
                        strokeDasharray="3,3"
                        opacity="0.5"
                      />

                      {/* Floating Ripple glow circle */}
                      <circle
                        cx={hoveredBar.x}
                        cy={hoveredBar.y}
                        r="6"
                        fill="#f59e0b"
                        opacity="0.3"
                        className="animate-ping"
                      />

                      {/* Active point marker */}
                      <circle
                        cx={hoveredBar.x}
                        cy={hoveredBar.y}
                        r="3"
                        fill="#ffffff"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                      />

                      {/* Floating dynamic HUD price tooltip */}
                      <g transform={`translate(${hoveredBar.x > 320 ? hoveredBar.x - 72 : hoveredBar.x + 8}, ${hoveredBar.y > 50 ? hoveredBar.y - 24 : hoveredBar.y + 6})`}>
                        <rect
                          width="64"
                          height="18"
                          rx="3"
                          fill="#0f0f13"
                          stroke="#f59e0b"
                          strokeWidth="0.75"
                          opacity="0.95"
                        />
                        <text
                          x="32"
                          y="12"
                          textAnchor="middle"
                          fill="#f59e0b"
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ${hoveredBar.close.toLocaleString(undefined, { minimumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2, maximumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2 })}
                        </text>
                      </g>
                    </>
                  )}
                </svg>
                
                {/* Side Price Scale */}
                <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[8px] text-neutral-300 select-none font-mono">
                  <span>${currentDetails.prices[0].toLocaleString(undefined, { minimumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2, maximumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2 })}</span>
                  <span>${currentDetails.prices[1].toLocaleString(undefined, { minimumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2, maximumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2 })}</span>
                  <span>${currentDetails.prices[2].toLocaleString(undefined, { minimumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2, maximumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2 })}</span>
                </div>
              </div>

              {/* Time scales */}
              <div className="flex justify-between text-[8px] text-neutral-300 pl-1 pr-12 border-t border-neutral-900 pt-1.5">
                {timeframeDates.map((dateStr, idx) => (
                  <span key={idx}>{dateStr}</span>
                ))}
              </div>
            </div>

            {/* Order Ticket Panel */}
            {!isMobile && (
              <div ref={executionDeskRef} className={`md:col-span-5 bg-transparent border rounded transition-all duration-300 flex flex-col justify-between text-[11px] hover:bg-neutral-900/10 ${
                showExecutionDetails ? 'border-neutral-800/50 p-3 min-h-[190px]' : 'border-neutral-800/50 p-0 min-h-0 h-auto overflow-hidden'
              }`}>
              {/* Order direction switches */}
              <div className={`grid grid-cols-2 gap-1 bg-neutral-900/10 p-0.5 rounded transition-all ${
                showExecutionDetails ? 'border border-neutral-800/40 mb-2' : 'border-0 mb-0'
              }`}>
                <button
                  id="homepage-buy-btn"
                  onClick={() => {
                    setTradeType('buy');
                    setShowExecutionDetails(true);
                  }}
                  className={`py-1 text-[9px] font-bold uppercase rounded tracking-wider text-center transition-all cursor-pointer ${
                    tradeType === 'buy'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  Buy USD ($)
                </button>
                <button
                  id="homepage-sell-btn"
                  onClick={() => {
                    setTradeType('sell');
                    setShowExecutionDetails(true);
                  }}
                  className={`py-1 text-[9px] font-bold uppercase rounded tracking-wider text-center transition-all cursor-pointer ${
                    tradeType === 'sell'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  Sell USD ($)
                </button>
              </div>

              <div className={`transition-all duration-300 ${
                showExecutionDetails ? 'block opacity-100' : 'hidden md:block md:opacity-100'
              } space-y-3 flex-1 flex flex-col justify-between`}>
                {/* Ticket row key values */}
                <div className="space-y-1.5 py-1 text-[10px]">
                  <div className="flex justify-between border-b border-neutral-900/50 pb-1">
                    <span className="text-neutral-300">Active Asset:</span>
                    <span className="text-white font-bold">{selectedSymbol}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-900/50 pb-1">
                    <span className="text-neutral-300">Market Price:</span>
                    <span className="text-neutral-300 font-semibold">${currentDetails.price.toLocaleString(undefined, { minimumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2, maximumFractionDigits: selectedSymbol === 'BTC' ? 0 : 2 })}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] text-neutral-300 uppercase">
                      <span>Dollar Amount ($):</span>
                      <span className="text-indigo-400 font-bold">MIN: $50.00</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button 
                        type="button"
                        onClick={() => setQuantity(String(Math.max(0, (parseFloat(quantity) || 0) - 10)))}
                        className="w-8 h-8 sm:w-6 sm:h-6 bg-neutral-900/10 hover:bg-neutral-900/30 border border-neutral-800/40 rounded flex items-center justify-center text-white text-xs cursor-pointer active:scale-95 transition-all"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <input
                        type="number"
                        id="homepage-qty-input"
                        ref={amountInputRef}
                        value={quantity}
                        onChange={(e) => {
                          let cleaned = e.target.value;
                          if (/^0\d+/.test(cleaned)) {
                            cleaned = cleaned.replace(/^0+/, '');
                          }
                          setQuantity(cleaned);
                        }}
                        className="flex-1 bg-neutral-900/10 border border-neutral-800/40 rounded text-center py-1.5 sm:py-0.5 text-white focus:outline-none focus:border-amber-500/40 text-[10px] font-mono"
                      />
                      <button 
                        type="button"
                        onClick={() => setQuantity(String((parseFloat(quantity) || 0) + 10))}
                        className="w-8 h-8 sm:w-6 sm:h-6 bg-neutral-900/10 hover:bg-neutral-900/30 border border-neutral-800/40 rounded flex items-center justify-center text-white text-xs cursor-pointer active:scale-95 transition-all"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1.5 min-h-[32px]">
                    <input
                      type="checkbox"
                      id="bracket-check"
                      checked={bracketProtection}
                      onChange={(e) => setBracketProtection(e.target.checked)}
                      className="rounded border-neutral-800/40 text-amber-500 focus:ring-0 bg-transparent w-4 h-4 sm:w-3 sm:h-3 cursor-pointer"
                    />
                    <label htmlFor="bracket-check" className="text-[8.5px] sm:text-[9px] text-neutral-300 uppercase tracking-wider cursor-pointer select-none">
                      Add bracket protection (SL/TP)
                    </label>
                  </div>

                  <div className="flex justify-between border-t border-neutral-900 pt-1.5 mt-1">
                    <span className="text-neutral-300 font-bold uppercase text-[9px]">Est. Cost ($):</span>
                    <span className="text-white font-bold text-xs">${estTotal}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-indigo-400 mt-1">
                    <span>Est. Shares:</span>
                    <span className="font-bold">{((parseFloat(quantity) || 0) / currentDetails.price).toFixed(6)} shares</span>
                  </div>
                  {parseFloat(quantity) < 50 && (
                    <div className="text-rose-400 text-[8px] font-bold text-center mt-1 uppercase tracking-wide">
                      ⚠️ Minimum purchase is $50.00
                    </div>
                  )}
                  </div>

                {/* Order Submission Button */}
                <button
                  id="homepage-submit-btn"
                  ref={submitButtonRef}
                  onClick={handleSimulatedOrder}
                  disabled={isOrderRouting}
                  className={`w-full py-2 font-bold uppercase text-[9px] tracking-widest rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    tradeType === 'buy'
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-rose-600 text-white hover:bg-rose-500'
                  } disabled:opacity-50`}
                >
                  {isOrderRouting ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Routing Order...
                    </>
                  ) : (
                    <>
                      {tradeType === 'buy' ? 'Route Simulated Buy ($)' : 'Route Simulated Sell ($)'}
                    </>
                  )}
                </button>
              </div>
            </div>
            )}
          </div>

          {/* Success / Warning log message overlay */}
          <AnimatePresence>
            {routingSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-950/25 border border-emerald-500/20 text-emerald-400 p-2.5 rounded text-[10px] leading-normal flex items-start gap-2"
              >
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <span className="font-bold">SYSTEM BROADCAST: </span>
                  {routingSuccess}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated Cursor Overlay */}
          {cursor.visible && (
            <motion.div
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                zIndex: 1000,
              }}
              animate={{
                left: cursor.x,
                top: cursor.y,
                scale: cursor.clicking ? 0.8 : 1,
              }}
              transition={{
                left: { type: 'spring', stiffness: 80, damping: 18 },
                top: { type: 'spring', stiffness: 80, damping: 18 },
                scale: { duration: 0.15 }
              }}
              className="flex flex-col items-start"
            >
              <svg 
                className="w-5.5 h-5.5 text-amber-500 filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.65)]" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M5.5 3.5V18.5L9.34 14.66L11.47 19.78L14.23 18.63L12.11 13.51L17.2 13.38L5.5 3.5Z" 
                  fill="#ffffff" 
                  stroke="#f59e0b" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
              {cursor.clicking && (
                <span className="absolute left-1.5 top-1.5 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-amber-500/80 animate-ping pointer-events-none" />
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* 2. PORTFOLIO DESK SIMULATOR */}
      {activeWorkspace === 'portfolio' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 text-xs font-mono text-neutral-300"
        >
          <div className="border-b border-neutral-900 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-white uppercase font-bold block">Portfolio Breakdown Summary</span>
              <span className="text-[8px] text-neutral-300">Live custody asset audit desk</span>
            </div>
            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 rounded">
              NAV: $1,248,500.00
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Asset Allocation progress bars */}
            <div className="space-y-2.5 bg-transparent border border-neutral-800/50 p-3.5 rounded hover:bg-neutral-900/10 transition-colors">
              <span className="text-[9px] text-neutral-300 uppercase tracking-wider font-bold block mb-1">Asset Exposure Weightings</span>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white">US Equities (Core Systematic)</span>
                    <span className="text-neutral-300">65%</span>
                  </div>
                  <div className="w-full bg-neutral-950/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white">Structured Options & Hedging</span>
                    <span className="text-neutral-300">15%</span>
                  </div>
                  <div className="w-full bg-neutral-950/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500/70 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white">Fixed Income & Macro Bonds</span>
                    <span className="text-neutral-300">10%</span>
                  </div>
                  <div className="w-full bg-neutral-950/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500/40 h-1.5 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white">Unallocated Collateral Cash</span>
                    <span className="text-neutral-300">10%</span>
                  </div>
                  <div className="w-full bg-neutral-950/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500/15 h-1.5 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Slider Panel */}
            <div className="space-y-3 bg-transparent border border-neutral-800/50 p-3.5 rounded flex flex-col justify-between hover:bg-neutral-900/10 transition-colors">
              <div>
                <span className="text-[9px] text-neutral-300 uppercase tracking-wider font-bold block mb-1">Risk Protection Valve (VaR Guard)</span>
                <p className="text-[10px] text-neutral-300 leading-relaxed font-sans mb-3">
                  Slide to adjust your daily Portfolio Value-at-Risk safety limit trigger.
                </p>

                {/* Range Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-white">
                    <span>Daily VaR Limit:</span>
                    <span className="text-amber-400">{varLimit.toFixed(2)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.05"
                    value={varLimit}
                    onChange={(e) => setVarLimit(parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-950/40 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[8px] text-neutral-300">
                    <span>0.50% (Strict)</span>
                    <span>5.00% (High Exposure)</span>
                  </div>
                </div>
              </div>

              {/* Dynamic status notice */}
              <div className="bg-neutral-900/10 border border-neutral-800/40 rounded p-2 flex items-center justify-between text-[9px]">
                <span className="text-neutral-300">Safeguard Status:</span>
                <span className={`font-bold uppercase ${
                  varLimit <= 1.5 
                    ? 'text-emerald-400' 
                    : varLimit <= 3.0 
                      ? 'text-amber-500' 
                      : 'text-rose-500'
                }`}>
                  {varLimit <= 1.5 ? 'Conservative & Optimized' : varLimit <= 3.0 ? 'Balanced exposure' : '⚠️ elevated risk limit'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive returns estimator */}
          <div className="bg-transparent border border-neutral-800/50 rounded p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-neutral-900/10 transition-colors">
            <div className="space-y-1">
              <span className="text-[9px] text-neutral-300 uppercase font-bold block">Compound Projection calculator</span>
              <div className="text-[10px] text-white font-sans font-light">
                Projecting <span className="font-bold text-amber-500">{portfolioYears} Years</span> of systematic compound growth on your NAV.
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex bg-neutral-900/10 rounded border border-neutral-800/40 p-0.5">
                {[3, 5, 10].map(y => (
                  <button
                    key={y}
                    onClick={() => setPortfolioYears(y)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer ${
                      portfolioYears === y 
                        ? 'bg-neutral-800 text-white' 
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    {y}Y
                  </button>
                ))}
              </div>
              <div className="text-right">
                <div className="text-[10px] text-neutral-300 uppercase">Estimated Return:</div>
                <div className="text-white font-bold text-xs">
                  ${(1248500 * Math.pow(1.12, portfolioYears)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. WATCHLIST DASHBOARD SIMULATOR */}
      {activeWorkspace === 'watchlist' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3 text-xs font-mono text-neutral-300"
        >
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
            <span className="text-[10px] text-white uppercase font-bold block">Dynamic Watchlist Filter</span>
            <div className="relative w-36">
              <Search className="absolute left-2 top-2 w-3 h-3 text-neutral-300" />
              <input
                type="text"
                placeholder="Filter symbols..."
                value={watchlistQuery}
                onChange={(e) => setWatchlistQuery(e.target.value)}
                className="w-full bg-neutral-900/10 border border-neutral-800/40 rounded pl-7 pr-2 py-1.5 text-[10px] text-white font-mono focus:outline-none focus:border-amber-500/40"
              />
            </div>
          </div>

          <div className="overflow-x-auto bg-transparent border border-neutral-800/50 rounded hover:bg-neutral-900/10 transition-colors">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-950/20 text-neutral-300 uppercase text-[9px] tracking-wider">
                  <th className="p-2.5">Symbol</th>
                  <th className="p-2.5">Price</th>
                  <th className="p-2.5">Change (24h)</th>
                  <th className="p-2.5 text-right">Volume (24h)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {[
                  { sym: 'AAPL', name: 'Apple Inc.', price: 316.22, change: '+1.42%', isUp: true, vol: '$4.2B' },
                  { sym: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: '-2.35%', isUp: false, vol: '$2.8B' },
                  { sym: 'NVDA', name: 'NVIDIA Corp.', price: 128.45, change: '+4.81%', isUp: true, vol: '$5.5B' },
                  { sym: 'MSFT', name: 'Microsoft Corp.', price: 415.80, change: '+0.51%', isUp: true, vol: '$3.1B' },
                  { sym: 'BTCUSD', name: 'Bitcoin / USD', price: 58450.00, change: '-1.27%', isUp: false, vol: '$24.6B' },
                ]
                  .filter(item => item.sym.toLowerCase().includes(watchlistQuery.toLowerCase()) || item.name.toLowerCase().includes(watchlistQuery.toLowerCase()))
                  .map(ticker => (
                    <tr
                      key={ticker.sym}
                      onMouseEnter={() => setHighlightedRow(ticker.sym)}
                      onMouseLeave={() => setHighlightedRow(null)}
                      className={`hover:bg-neutral-900/30 transition-colors cursor-pointer ${
                        highlightedRow === ticker.sym ? 'bg-neutral-900/40' : ''
                      }`}
                    >
                      <td className="p-2.5">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{ticker.sym}</span>
                          <span className="text-[9px] text-neutral-300">{ticker.name}</span>
                        </div>
                      </td>
                      <td className="p-2.5 font-bold text-neutral-300">
                        ${ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                          ticker.isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {ticker.change}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-bold text-neutral-300">
                        {ticker.vol}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

        </motion.div>
      )}

      {/* 4. FUNDING DESK SIMULATOR */}
      {activeWorkspace === 'funding' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 text-xs font-mono text-neutral-300"
        >
          <div className="border-b border-neutral-900 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-white uppercase font-bold block">Instant Collateral Wire Gate</span>
              <span className="text-[8px] text-neutral-300">Fast margin settlement logs</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Transfer Form */}
            <div className="bg-transparent border border-neutral-800/50 p-3.5 rounded space-y-3 hover:bg-neutral-900/10 transition-colors">
              <span className="text-[9px] text-neutral-300 uppercase tracking-wider font-bold block">Initiate Bank Wire Deposit</span>
              
              <div className="space-y-1.5">
                <label className="text-[8px] text-neutral-300 uppercase">Select Custodian Bank:</label>
                <select
                  value={fundingBank}
                  onChange={(e) => setFundingBank(e.target.value)}
                  className="w-full bg-neutral-900/10 border border-neutral-800/40 rounded px-2.5 py-1 text-white focus:outline-none focus:border-amber-500/40 text-[10px]"
                >
                  <option value="J.P. Morgan">J.P. Morgan Chase & Co.</option>
                  <option value="Goldman Sachs">Goldman Sachs Group Inc.</option>
                  <option value="Citi">Citibank N.A.</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] text-neutral-300 uppercase">Deposit Amount (USD):</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-neutral-300">$</span>
                  <input
                    type="number"
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                    className="w-full bg-neutral-900/10 border border-neutral-800/40 rounded pl-5 pr-2 py-1 text-white font-bold focus:outline-none focus:border-amber-500/40 text-[10px]"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setFundingSuccess(`WIRE TRANSFER INITIATED: Received transfer request of $${parseFloat(fundingAmount || "0").toLocaleString()} via ${fundingBank} clearing network.`);
                  setTimeout(() => setFundingSuccess(null), 5000);
                }}
                className="w-full py-2 bg-white text-black hover:bg-neutral-200 rounded font-bold uppercase text-[9px] tracking-wider transition-all cursor-pointer"
              >
                Initiate Bank Wire
              </button>
            </div>

            {/* Simulated Balance Logs */}
            <div className="bg-transparent border border-neutral-800/50 p-3.5 rounded space-y-3 flex flex-col justify-between hover:bg-neutral-900/10 transition-colors">
              <div>
                <span className="text-[9px] text-neutral-300 uppercase tracking-wider font-bold block mb-1">Segregated Balance Ledgers</span>
                
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between border-b border-neutral-900 pb-1">
                    <span className="text-neutral-300">Clearing Pool Balance:</span>
                    <span className="text-white font-bold">$1,000,000.00</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-900 pb-1">
                    <span className="text-neutral-300">Secured Margin Cushion:</span>
                    <span className="text-neutral-300 font-bold">$248,500.00</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-900 pb-1">
                    <span className="text-neutral-300">Direct Credit Line:</span>
                    <span className="text-neutral-300 font-bold">$5,000,000.00</span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900/10 rounded p-2 text-[8px] text-neutral-300 leading-normal border border-neutral-800/40 font-sans font-light">
                ⚠️ Wire settlements require manual clearance from our regulatory compliance desk. Typically processed inside 10 minutes.
              </div>
            </div>
          </div>

          <AnimatePresence>
            {fundingSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-950/25 border border-emerald-500/20 text-emerald-400 p-2.5 rounded text-[10px] leading-normal flex items-start gap-2"
              >
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <span className="font-bold">TRANSFER NOTIFICATION: </span>
                  {fundingSuccess}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 5. ACTIVITY DESK SIMULATOR */}
      {activeWorkspace === 'activity' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3 text-xs font-mono text-neutral-300"
        >
          <div className="border-b border-neutral-900 pb-2 flex items-center justify-between">
            <span className="text-[10px] text-white uppercase font-bold block">Historical Audit Execution Logs</span>
            <span className="text-[9px] font-bold text-neutral-300">6 transactions cleared</span>
          </div>

          <div className="space-y-1.5">
            {[
              { time: '10:05:00', type: 'Custodial Settlement', desc: 'Liquidated underlying share certificates', asset: 'AAPL', status: 'Success' },
              { time: '09:42:15', type: 'Limit Buy Order', desc: 'Execution filled at limit target $125.10', asset: 'NVDA', status: 'Success' },
              { time: '09:15:30', type: 'Wire Deposit Gate', desc: 'J.P. Morgan Clearing wire received', asset: 'USD', status: 'Success' },
              { time: '08:00:10', type: 'Daily VaR Reset', desc: 'State synchronized with cloud Firestore rules', asset: 'SYSTEM', status: 'Synced' },
              { time: '07:30:00', type: 'System Boot', desc: 'Secure brokerage socket listener established', asset: 'NODE_01', status: 'Success' },
              { time: '06:15:45', type: 'Margin Audit', desc: 'Pre-market leverage requirements verified', asset: 'SYSTEM', status: 'Passed' },
            ].map((log, index) => (
              <div 
                key={index} 
                className="bg-transparent border border-neutral-800/50 p-2 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-[10px] hover:border-neutral-700/60 hover:bg-neutral-900/10 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-neutral-300 font-bold text-[9px]">{log.time}</span>
                  <span className="text-white font-bold bg-neutral-900/10 border border-neutral-800/40 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">{log.type}</span>
                  <span className="text-neutral-300 font-light font-sans">{log.desc}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 text-[9px]">
                  <span className="text-neutral-300 font-bold">{log.asset}</span>
                  <span className="text-emerald-400 font-bold">{log.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-1 flex justify-end">
            <button
              onClick={() => onLaunchTerminal()}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-white font-bold uppercase text-[9px] tracking-wider transition-all cursor-pointer"
            >
              Export Complete CSV Ledger
            </button>
          </div>
        </motion.div>
      )}

      {/* 6. MARKET ANALYSIS SIMULATOR */}
      {activeWorkspace === 'analysis' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 text-xs font-mono text-neutral-300"
        >
          <div className="border-b border-[#16161c] pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-white uppercase font-bold block">Cross-Asset Correlation Heatmap</span>
              <span className="text-[8px] text-neutral-300">Mathematical portfolio correlation indexes</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* 4x4 Grid Matrix */}
            <div className="bg-transparent border border-neutral-800/50 p-3 rounded space-y-2 w-full max-w-[240px] hover:bg-neutral-900/10 transition-colors">
              <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] text-neutral-300 font-bold uppercase">
                <div></div>
                <div>AAPL</div>
                <div>NVDA</div>
                <div>SPY</div>
                <div>BTC</div>
              </div>

              {[
                { label: 'AAPL', r: [1.0, 0.65, 0.85, 0.22] },
                { label: 'NVDA', r: [0.65, 1.0, 0.72, 0.35] },
                { label: 'SPY', r: [0.85, 0.72, 1.0, 0.18] },
                { label: 'BTC', r: [0.22, 0.35, 0.18, 1.0] },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-5 gap-1.5 items-center text-center">
                  <div className="text-left font-bold text-[9px] text-neutral-300">{row.label}</div>
                  {row.r.map((val, idx) => {
                    const bgColor = val === 1.0 
                      ? 'rgba(245, 158, 11, 0.85)' 
                      : val >= 0.7 
                        ? 'rgba(245, 158, 11, 0.5)' 
                        : val >= 0.5 
                          ? 'rgba(245, 158, 11, 0.35)' 
                          : 'rgba(245, 158, 11, 0.15)';
                    return (
                      <div
                        key={idx}
                        className="aspect-square flex items-center justify-center font-bold text-[9px] text-black rounded transition-all hover:scale-105 cursor-help"
                        style={{ backgroundColor: bgColor, color: val >= 0.7 ? '#000000' : '#ffffff' }}
                        title={`Correlation Coefficient: ${val}`}
                      >
                        {val.toFixed(2)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Details panel */}
            <div className="space-y-3 flex-1">
              <span className="text-[9px] text-neutral-300 uppercase tracking-wider font-bold block">Statistical Insights</span>
              <p className="text-[11px] text-neutral-300 leading-relaxed font-sans font-light">
                Our analysis modules measure real-time co-movements across core systematic asset pools. Shaded boxes represent Pearson correlation coefficients. 
              </p>
              
              <div className="bg-neutral-900/10 border border-neutral-800/40 rounded p-2.5 space-y-1.5 text-[9px]">
                <div className="flex justify-between">
                  <span className="text-neutral-300">Highest Link:</span>
                  <span className="text-amber-500 font-bold">AAPL vs SPY (0.85)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-300">Hedging Diversifier:</span>
                  <span className="text-emerald-400 font-bold">BTCUSD vs SPY (0.18)</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Custom hook to dynamically manage document title, meta descriptions, Open Graph, and Twitter tags for SEO
function useMetaTagManager(activeWorkspaceId: string) {
  useEffect(() => {
    const workspace = workspacesData.find(w => w.id === activeWorkspaceId);
    if (!workspace) return;

    const baseTitle = "mtx Securities | Engineered for Systematic Capital";
    const title = `${workspace.seoTitle || workspace.name} | ${baseTitle}`;
    const description = `Access the MTX Securities ${workspace.name} (${workspace.seoTitle}) engineered for systematic capital. ${workspace.roleExplanation || workspace.desc} Optimize stock, bond, treasury & option trading with real-time portfolio margin and high-yield cash sweeps.`;
    
    // Dynamic workspace-based keywords to prevent stale index headers
    const workspaceKeywords: Record<string, string> = {
      markets: "fractional shares buying, live order book analysis, candlestick charts, stock trading platform, real-time stock tickers, market depth",
      portfolio: "Value-at-Risk calculations, portfolio asset distribution, compound interest estimator, brokerage balance desk",
      watchlist: "custom stock watchlist, asset tracker, rapid symbol switching, continuous volatility filters, market level score",
      funding: "bank wire deposit ledger, capital custody solution, institutional clearance, credit line application, balance logs, wallet",
      activity: "audited execution logs, trading ledger history, regulatory compliance reporting, brokerage receipt",
      analysis: "pearson correlation heatmap, trend indices, systematic benchmarking, statistical co-movement matrix, asset analysis"
    };

    const keywords = `Securities Brokerage, Stock Trading Platform, buy shares, sell shares, stock trading, investment platform, share market, real-time analytics, stocks, bonds, treasury, option trading, high yield cash account, 1% match IRA, tax loss harvesting, direct indexing, quantitative trade agents, ${workspaceKeywords[activeWorkspaceId] || ""}`;

    const prevTitle = document.title;
    document.title = title;

    // Helper to get or create element
    const getOrCreateMeta = (attrName: string, attrValue: string, keyName: string = "name") => {
      let el = document.querySelector(`meta[${keyName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(keyName, attrValue);
        document.head.appendChild(el);
      }
      return el;
    };

    // Update Meta Description
    const metaDesc = getOrCreateMeta("name", "description");
    const prevDesc = metaDesc.getAttribute('content') || '';
    metaDesc.setAttribute('content', description);

    // Update Keywords
    const metaKeywords = getOrCreateMeta("name", "keywords");
    const prevKeywords = metaKeywords.getAttribute('content') || '';
    metaKeywords.setAttribute('content', keywords);

    // Update Robots
    const metaRobots = getOrCreateMeta("name", "robots");
    const prevRobots = metaRobots.getAttribute('content') || '';
    metaRobots.setAttribute('content', "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");

    // Update Open Graph (og:title)
    const ogTitle = getOrCreateMeta("property", "og:title", "property");
    const prevOgTitle = ogTitle.getAttribute('content') || '';
    ogTitle.setAttribute('content', title);

    // Update Open Graph (og:description)
    const ogDesc = getOrCreateMeta("property", "og:description", "property");
    const prevOgDesc = ogDesc.getAttribute('content') || '';
    ogDesc.setAttribute('content', description);

    // Update Open Graph (og:url)
    const ogUrl = getOrCreateMeta("property", "og:url", "property");
    const prevOgUrl = ogUrl.getAttribute('content') || '';
    ogUrl.setAttribute('content', window.location.href);

    // Update Open Graph (og:type)
    const ogType = getOrCreateMeta("property", "og:type", "property");
    const prevOgType = ogType.getAttribute('content') || '';
    ogType.setAttribute('content', "website");

    // Update Twitter Title
    const twitterTitle = getOrCreateMeta("name", "twitter:title");
    const prevTwitterTitle = twitterTitle.getAttribute('content') || '';
    twitterTitle.setAttribute('content', title);

    // Update Twitter Description
    const twitterDesc = getOrCreateMeta("name", "twitter:description");
    const prevTwitterDesc = twitterDesc.getAttribute('content') || '';
    twitterDesc.setAttribute('content', description);

    // Update Twitter Card
    const twitterCard = getOrCreateMeta("name", "twitter:card");
    const prevTwitterCard = twitterCard.getAttribute('content') || '';
    twitterCard.setAttribute('content', "summary_large_image");

    // Canonical link tag setup
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    let prevCanonicalHref = '';
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    } else {
      prevCanonicalHref = canonicalLink.getAttribute('href') || '';
    }
    canonicalLink.setAttribute('href', window.location.origin + window.location.pathname);

    // Inject JSON-LD Schema.org Structured Data
    let schemaScript = document.getElementById('json-ld-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('id', 'json-ld-schema');
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }

    const jsonLdSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "FinancialService",
          "@id": `${window.location.origin}/#organization`,
          "name": "mtxquant",
          "url": window.location.origin,
          "logo": `${window.location.origin}/assets/logo.png`,
          "description": "mtxquant is an institutional prime brokerage engineered for systematic capital. We support high-performance capital custody, real-time risk analytics, and multi-asset routing for stocks, bonds, and treasuries.",
          "category": "Investment Brokerage",
          "feesAndCommissionsSpecification": `${window.location.origin}/#portal`,
          "knowsAbout": [
            "Quantitative Finance",
            "Algorithmic Trading",
            "Risk Management",
            "Prime Brokerage Services",
            "Value-at-Risk Analysis",
            "Order Book Execution",
            "Multi-Asset Clearing",
            "Sovereign Treasuries",
            "Tax-Loss Harvesting"
          ]
        },
        {
          "@type": "SoftwareApplication",
          "@id": `${window.location.origin}/#application`,
          "name": `mtxquant Suite - ${workspace.name}`,
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All",
          "browserRequirements": "Requires HTML5 compatible web browser",
          "description": workspace.desc,
          "softwareVersion": "1.0.0",
          "author": {
            "@type": "Organization",
            "name": "mtxquant"
          },
          "featureList": workspace.features,
          "screenshot": `${window.location.origin}/assets/hero-screenshot.png`
        },
        {
          "@type": "FinancialProduct",
          "@id": `${window.location.origin}/#product-cash`,
          "name": "High-Yield Cash Account",
          "description": "Premium interest-bearing cash management sweep program routing capital to partner banks for FDIC coverage and high yield APY.",
          "offers": {
            "@type": "Offer",
            "price": "0.00",
            "priceCurrency": "USD"
          },
          "provider": {
            "@type": "Organization",
            "name": "mtxquant"
          }
        },
        {
          "@type": "FinancialProduct",
          "@id": `${window.location.origin}/#product-bonds`,
          "name": "Bond Account",
          "description": "Yield-optimized active fixed income bond portfolio programmatically balanced to capture high interest rate premiums.",
          "provider": {
            "@type": "Organization",
            "name": "mtxquant"
          }
        },
        {
          "@type": "FinancialProduct",
          "@id": `${window.location.origin}/#product-ira`,
          "name": "Retirement IRA Match",
          "description": "Traditional and Roth IRAs with an accelerator match program providing a complementary 1% capital boost.",
          "provider": {
            "@type": "Organization",
            "name": "mtxquant"
          }
        },
        {
          "@type": "FinancialProduct",
          "@id": `${window.location.origin}/#product-indexing`,
          "name": "Direct Indexing",
          "description": "Tax-optimized benchmark replication with fractional share allocations, supporting automated loss-harvesting.",
          "provider": {
            "@type": "Organization",
            "name": "mtxquant"
          }
        },
        {
          "@type": "FinancialProduct",
          "@id": `${window.location.origin}/#product-agents`,
          "name": "Autonomous AI Trade Agents",
          "description": "Quantitative trading algorithms running continuous volatility-based position resizing and automated risk management.",
          "provider": {
            "@type": "Organization",
            "name": "mtxquant"
          }
        }
      ]
    };

    schemaScript.textContent = JSON.stringify(jsonLdSchema);

    return () => {
      document.title = prevTitle;
      if (metaDesc) metaDesc.setAttribute('content', prevDesc);
      if (metaKeywords) metaKeywords.setAttribute('content', prevKeywords);
      if (metaRobots) metaRobots.setAttribute('content', prevRobots);
      if (ogTitle) ogTitle.setAttribute('content', prevOgTitle);
      if (ogDesc) ogDesc.setAttribute('content', prevOgDesc);
      if (ogUrl) ogUrl.setAttribute('content', prevOgUrl);
      if (ogType) ogType.setAttribute('content', prevOgType);
      if (twitterTitle) twitterTitle.setAttribute('content', prevTwitterTitle);
      if (twitterDesc) twitterDesc.setAttribute('content', prevTwitterDesc);
      if (twitterCard) twitterCard.setAttribute('content', prevTwitterCard);
      if (canonicalLink) {
        if (prevCanonicalHref) {
          canonicalLink.setAttribute('href', prevCanonicalHref);
        } else {
          canonicalLink.remove();
        }
      }
      if (schemaScript) {
        schemaScript.remove();
      }
    };
  }, [activeWorkspaceId]);
}

interface HomepageProps {
  onLaunchTerminal: (initialTab?: 'signin' | 'register') => void;
  onSignIn: () => void;
}

export default function Homepage({ onLaunchTerminal, onSignIn }: HomepageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // Interactive Brokerage Calculator States
  const [initialDeposit, setInitialDeposit] = useState<number>(100000);
  const [selectedLeverage, setSelectedLeverage] = useState<number>(20); // 20x Max
  const [assetType, setAssetType] = useState<'equities' | 'derivatives' | 'macro'>('equities');

  // Terminal telemetry indicators
  const [activeWorkspace, setActiveWorkspace] = useState<string>('markets');
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState<boolean>(true);
  const [selectedInstrument, setSelectedInstrument] = useState<string>('');

  useEffect(() => {
    setIsWorkspaceLoading(true);
    const timer = setTimeout(() => {
      setIsWorkspaceLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeWorkspace]);
  
  // Call dynamic SEO meta tag manager hook
  useMetaTagManager(activeWorkspace);
  const [sessionTime, setSessionTime] = useState<string>('00:00:00');
  const [currentLatency, setCurrentLatency] = useState<number>(24);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hrs = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
      setSessionTime(`${hrs}:${mins}:${secs}`);
    }, 1000);

    const latencyInterval = setInterval(() => {
      setCurrentLatency(Math.floor(Math.random() * 14) + 11);
    }, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(latencyInterval);
    };
  }, []);

  // SEO Optimization: Inject meta description, page title, and structured schema JSON-LD
  useEffect(() => {
    document.title = "MTXquant | Modern Prime Brokerage for Systematic Capital";

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      'content',
      'MTXquant is a premium institutional prime brokerage and quantitative platform built for modern global investors. We support systematic desks and sophisticated portfolios with advanced clearing and real-time risk analytics.'
    );

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute(
      'content',
      'MTXquant, quantitative brokerage, prime broker, portfolio margin, systematic clearing, direct market access, risk management, equities clearing, professional trader account'
    );

    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BrokerageBusiness",
          "@id": `${window.location.origin}/#brokerage`,
          "name": "MTXquant Prime Services",
          "description": "Premium quantitative prime brokerage and clearing platform for systematic proprietary trading desks and professional investment firms.",
          "url": window.location.origin,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "New York",
            "addressRegion": "NY",
            "addressCountry": "US"
          }
        },
        {
          "@type": "SoftwareApplication",
          "@id": `${window.location.origin}/#software`,
          "name": "MTXquant Institutional Trading Terminal",
          "description": "An advanced, high-performance web-based trading terminal with multi-asset index charts, live order books, and real-time risk analytics.",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All",
          "browserRequirements": "Requires HTML5, WebGL, WebSockets",
          "url": window.location.origin,
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        },
        {
          "@type": "FAQPage",
          "@id": `${window.location.origin}/#faq`,
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What clearing models does MTXquant support?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "MTXquant operates under a fully segregated custody model. We offer both standard Regulation T clearing and advanced Portfolio Margining based on real-time Value-at-Risk (VaR) analysis. This optimizes capital efficiency for multi-legged options strategies and highly correlated equity books."
              }
            },
            {
              "@type": "Question",
              "name": "Who is eligible for an MTXquant prime account?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our brokerage services are tailored for systematic proprietary trading groups, family offices, high-net-worth individuals, and emerging hedge fund managers. Standard registration requires completion of standard KYC/AML onboarding guidelines."
              }
            },
            {
              "@type": "Question",
              "name": "How does the platform secure client assets?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Client funds are secured with premier global custody partners and Tier-1 banking institutions. Our digital portals and risk-syncing database engines are fully backed up in secure cloud clusters with end-to-end encryption to preserve watchlists, trading notes, and active portfolio configurations."
              }
            },
            {
              "@type": "Question",
              "name": "Are there minimum capital mandates to access the terminal?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our introductory account level, Starter Prime, has no minimum balance requirement and provides comprehensive access to our core Markets Terminal. Professional Prime accounts requiring institutional leverage lines are subject to capital clearing baseline thresholds."
              }
            },
            {
              "@type": "Question",
              "name": "What are the cross-border clearing and multi-currency settlement protocols?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "MTXquant implements an advanced, highly resilient cross-border clearing system, utilizing dynamic multi-currency collateral sweeps across global Tier-1 custody banks including BNY Mellon, JP Morgan Chase, and Euroclear. We facilitate direct bilateral and central clearing under the European Market Infrastructure Regulation (EMIR) and Dodd-Frank Act guidelines, minimizing systemic risk. Multi-currency settlements are executed using Real-Time Gross Settlement (RTGS) platforms (such as TARGET2, Fedwire, and CHIPS) as well as accredited tri-party clearing agents. This framework supports instant margin optimization and automatic currency conversions across USD, EUR, GBP, JPY, and SGD with automated collateral rehypothecation shielding for global macro derivative portfolios."
              }
            },
            {
              "@type": "Question",
              "name": "What are the technical specifications and latency metrics of the MTXquant REST/WebSocket API?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The MTXquant API suite supports high-frequency algorithmic execution via REST and WebSocket protocols, designed for systematic trading desks. Our matching engines, co-located in Equinix NY4 (Secaucus), LD4 (Slough), and TY3 (Tokyo), utilize Kernel Bypass (Solarflare Onload technology) to bypass standard network stack overhead. The HTTP/2 REST API delivers an execution latency of less than 4 milliseconds, while the low-latency TCP WebSocket streams provide real-time Level 2 (L2) and Level 3 (L3) order book updates in under 500 microseconds. For maximum serialization efficiency, payloads are delivered in high-performance Protocol Buffers (Protobuf) or compressed JSON format. Authenticated requests are verified using asymmetric Ed25519 cryptographic signatures with rate-limiting configured up to 5,000 requests per minute per IP subnet, upgradable for institutional lease lines."
              }
            }
          ]
        }
      ]
    };

    let schemaScript = document.getElementById('seo-json-ld');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('id', 'seo-json-ld');
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }
    schemaScript.innerHTML = JSON.stringify(schemaData, null, 2);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', window.location.origin + window.location.pathname);
  }, []);

  const faqs = [
    {
      q: "Does MTXquant support multi-asset clearing and unified collateral sweeps?",
      a: "Yes. Our clearing framework aggregates multi-venue liquidity to provide tight execution margins and unified collateral sweeping across standard, synthetically formulated, and tax-advantaged instruments."
    },
    {
      q: "What clearing models does MTXquant support?",
      a: "MTXquant operates under a fully segregated custody model. We offer both standard Regulation T clearing and advanced Portfolio Margining based on real-time Value-at-Risk (VaR) analysis. This optimizes capital efficiency for multi-legged options strategies and highly correlated equity books."
    },
    {
      q: "Who is eligible for an MTXquant prime account?",
      a: "Our brokerage services are tailored for systematic proprietary trading groups, family offices, high-net-worth individuals, and emerging hedge fund managers. Standard registration requires completion of standard KYC/AML onboarding guidelines."
    },
    {
      q: "How does the platform secure client assets?",
      a: "Client funds are secured with premier global custody partners and Tier-1 banking institutions. Our digital portals and risk-syncing database engines are fully backed up in secure cloud clusters with end-to-end encryption to preserve watchlists, trading notes, and active portfolio configurations."
    },
    {
      q: "Are there minimum capital mandates to access the terminal?",
      a: "Our introductory account level, Starter Prime, has no minimum balance requirement and provides comprehensive access to our core Markets Terminal. Professional Prime accounts requiring institutional leverage lines are subject to capital clearing baseline thresholds."
    },
    {
      q: "What are the cross-border clearing and multi-currency settlement protocols?",
      a: "MTXquant implements an advanced, highly resilient cross-border clearing system, utilizing dynamic multi-currency collateral sweeps across global Tier-1 custody banks including BNY Mellon, JP Morgan Chase, and Euroclear. We facilitate direct bilateral and central clearing under the European Market Infrastructure Regulation (EMIR) and Dodd-Frank Act guidelines, minimizing systemic risk. Multi-currency settlements are executed using Real-Time Gross Settlement (RTGS) platforms (such as TARGET2, Fedwire, and CHIPS) as well as accredited tri-party clearing agents. This framework supports instant margin optimization and automatic currency conversions across USD, EUR, GBP, JPY, and SGD with automated collateral rehypothecation shielding for global macro derivative portfolios."
    },
    {
      q: "What are the technical specifications and latency metrics of the MTXquant REST/WebSocket API?",
      a: "The MTXquant API suite supports high-frequency algorithmic execution via REST and WebSocket protocols, designed for systematic trading desks. Our matching engines, co-located in Equinix NY4 (Secaucus), LD4 (Slough), and TY3 (Tokyo), utilize Kernel Bypass (Solarflare Onload technology) to bypass standard network stack overhead. The HTTP/2 REST API delivers an execution latency of less than 4 milliseconds, while the low-latency TCP WebSocket streams provide real-time Level 2 (L2) and Level 3 (L3) order book updates in under 500 microseconds. For maximum serialization efficiency, payloads are delivered in high-performance Protocol Buffers (Protobuf) or compressed JSON format. Authenticated requests are verified using asymmetric Ed25519 cryptographic signatures with rate-limiting configured up to 5,000 requests per minute per IP subnet, upgradable for institutional lease lines."
    }
  ];

  // Interactive Calculator Logic
  const calculateBuyingPower = () => {
    let multiplier = selectedLeverage;
    if (assetType === 'equities') multiplier = Math.min(selectedLeverage, 20);
    else if (assetType === 'derivatives') multiplier = Math.min(selectedLeverage, 15);
    else multiplier = Math.min(selectedLeverage, 30);

    const totalBuyingPower = initialDeposit * multiplier;
    const maintenanceMargin = totalBuyingPower * (assetType === 'equities' ? 0.25 : assetType === 'derivatives' ? 0.15 : 0.10);
    const estimatedClearingFee = totalBuyingPower * 0.0001;

    return {
      buyingPower: totalBuyingPower,
      marginRequirement: maintenanceMargin,
      clearingFee: estimatedClearingFee
    };
  };

  const calcResults = calculateBuyingPower();

  return (
    <div className="min-h-screen bg-[#060608] text-neutral-200 font-sans selection:bg-neutral-800 selection:text-white relative">
      
      {/* Sistine Chapel inspired financial background painted with divine candlestick arches & Fibonacci spirals */}
      <SistineFinancialCeiling />
      
      {/* Structural Swiss Grid & Clean Aesthetic Lines layered on top with low opacity */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141418_1px,transparent_1px),linear-gradient(to_bottom,#141418_1px,transparent_1px)] bg-[size:6rem_6rem] pointer-events-none z-[1] opacity-30" />
      
      {/* Header Sticky Navigation */}
      <header className="sticky top-0 z-50 bg-[#060608]/85 backdrop-blur-md border-b border-neutral-900/80 px-6 lg:px-12 py-4 flex flex-col justify-center relative z-10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div>
              <span className="text-base font-black tracking-tight text-white block lowercase">mtxquant</span>
            </div>
          </div>

          {/* Minimal Swiss Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
            <a href="#about" className="hover:text-white transition-colors">Our Firm</a>
            <a href="#services" className="hover:text-white transition-colors">Brokerage Services</a>
            <a href="#portal" className="hover:text-white transition-colors">Client Workspaces</a>
            <a href="#onboarding" className="hover:text-white transition-colors">Onboarding</a>
          </nav>

          {/* Action Controls */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onLaunchTerminal('signin')}
              className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black rounded font-mono text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Sign In
            </button>
            
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-200 hover:text-white transition-colors cursor-pointer rounded border border-neutral-850 bg-neutral-950/80"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="lg:hidden overflow-hidden mt-4 pt-4 border-t border-neutral-900"
            >
              <nav className="flex flex-col space-y-4 font-mono text-[11px] uppercase tracking-widest text-neutral-300 pb-4">
                <a 
                  href="#about" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-white transition-colors py-1.5 border-b border-neutral-950"
                >
                  Our Firm
                </a>
                <a 
                  href="#services" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-white transition-colors py-1.5 border-b border-neutral-950"
                >
                  Brokerage Services
                </a>
                <a 
                  href="#portal" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-white transition-colors py-1.5 border-b border-neutral-950"
                >
                  Client Workspaces
                </a>
                <a 
                  href="#onboarding" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-white transition-colors py-1.5 border-b border-neutral-950"
                >
                  Onboarding
                </a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Structural Layout */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 py-16 lg:py-24 space-y-32">
        
        {/* Editorial Hero Section */}
        <section className="min-h-[calc(100vh-200px)] flex flex-col justify-center pb-20 sm:pb-28 space-y-8 text-left max-w-4xl relative -top-8 sm:-top-12 z-10">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white font-bold block">
            Institutional Prime Brokerage & Quant Suite
          </span>
          
          <h1 className="text-4xl sm:text-6xl font-sans tracking-tight text-white leading-[1.05] font-light">
            Modern prime brokerage <br />
            <span className="font-semibold text-neutral-200">engineered for systematic capital.</span>
          </h1>
          
          <p className="text-sm sm:text-base text-neutral-200 leading-relaxed max-w-2xl font-light">
            MTXquant equips quantitative proprietary desks, family offices, and sophisticated global investors with optimized clearing channels, institutional margin leverage, and real-time risk analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
            <button 
              onClick={() => onLaunchTerminal('register')}
              className="px-6 py-3 bg-white hover:bg-neutral-200 text-black font-mono font-bold uppercase tracking-widest text-xs rounded transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              Open Account <ArrowRight className="w-4 h-4" />
            </button>
            <a 
              href="#portal"
              className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-mono font-bold uppercase tracking-widest text-xs rounded border border-neutral-800 transition-all text-center cursor-pointer"
            >
              Explore Workspaces
            </a>
          </div>
        </section>

        {/* Section: Universal Instrument Spectrum (WITHOUT TITLE AND SUBTITLE AS REQUESTED) */}
        <section id="instruments" className="py-1 sm:py-4 px-1 sm:px-0">
          <div className="w-full py-2 sm:py-4 flex flex-col justify-center items-center text-center relative overflow-hidden">
            {/* Subtle background glow effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.02),transparent_65%)] pointer-events-none"></div>
            
            <div 
              className="w-full flex flex-col gap-3 sm:gap-10 z-10 select-none"
              onMouseLeave={() => setSelectedInstrument('')}
            >
              {instrumentRows.map((row, rIndex) => (
                <div key={rIndex} className="flex flex-wrap items-center justify-center gap-x-2.5 sm:gap-x-6 gap-y-2.5 sm:gap-y-4 text-center leading-normal">
                  {row.map((item, iIndex) => {
                    const isAnyHovered = selectedInstrument !== '';
                    const isHovered = selectedInstrument === item.name;
                    const hasBadge = item.hasBadge;
                    
                    return (
                      <React.Fragment key={item.name}>
                        <div
                          onMouseEnter={() => setSelectedInstrument(item.name)}
                          className="group relative text-center py-0.5 sm:py-1 flex items-center gap-1.5 sm:gap-2 transition-all duration-300"
                        >
                          <span 
                            className={`font-serif text-lg sm:text-3xl md:text-4xl lg:text-5xl tracking-normal leading-none transition-all duration-500 ${
                              isHovered 
                                ? 'text-white scale-[1.04] filter drop-shadow-[0_0_15px_rgba(255,255,255,0.25)] font-normal opacity-100' 
                                : isAnyHovered 
                                  ? 'text-neutral-200/10 opacity-30' 
                                  : 'text-neutral-200 group-hover:text-white'
                            }`}
                          >
                            {item.name}
                          </span>

                          {hasBadge && (
                            <span 
                              className={`text-[7px] sm:text-[9px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded transition-all duration-500 border ${
                                isHovered 
                                  ? 'bg-white/10 border-white/40 text-white scale-105' 
                                  : isAnyHovered 
                                    ? 'bg-transparent border-neutral-800/10 text-neutral-600/20'
                                    : 'bg-[#09090b] border-neutral-800 text-neutral-400 group-hover:border-neutral-700 group-hover:text-neutral-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        
                        {iIndex < row.length - 1 && (
                          <span 
                            className={`text-neutral-800/65 font-sans text-xs sm:text-base md:text-lg select-none pointer-events-none transition-all duration-500 ${
                              isAnyHovered ? 'text-neutral-900/20' : 'text-neutral-800/65'
                            }`}
                          >
                            ·
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-neutral-800" />

        {/* Section: Minimal Firm Statement */}
        <section id="about" className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-4 space-y-3">
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 font-bold block">01 / Structural Foundation</span>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Our Perspective</h2>
          </div>
          <div className="lg:col-span-8 space-y-6 text-neutral-200 font-light leading-relaxed text-sm">
            <p>
              Traditional prime brokerages rely on outdated clearing processes and opaque capital distribution structures. At MTX Securities, we build software first. We focus on modern clearing architectures, real-time collateral pricing, and transparent transaction fees.
            </p>
            <p>
              By utilizing premium Tier-1 institutional custody relationships, we provide retail and professional traders with structural isolation, ensuring that client collateral remains strictly segregated.
            </p>
          </div>
        </section>

        {/* Section: Real Brokerage Services (Bento Editorial Style) */}
        <section id="services" className="space-y-12">
          <div className="space-y-3">
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 font-bold block">02 / Architecture Specifications</span>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Clearing & Margin Services</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 border-t border-b border-neutral-800 py-1">
            
            <article className="p-6 space-y-4 hover:bg-neutral-900/30 transition-all rounded">
              <span className="text-xs font-mono text-neutral-300 block">02.1</span>
              <h3 className="text-base font-bold text-white tracking-tight">Portfolio Margin Accounts</h3>
              <p className="text-xs text-neutral-200 leading-relaxed font-light">
                Utilize real-time Value-at-Risk (VaR) clearing rules. We dynamically calculate historical asset correlations to deliver optimal leverage allocations on diversified books.
              </p>
            </article>

            <article className="p-6 space-y-4 hover:bg-neutral-900/30 transition-all rounded">
              <span className="text-xs font-mono text-neutral-300 block">02.2</span>
              <h3 className="text-base font-bold text-white tracking-tight">Multi-Asset Capital Allocation</h3>
              <p className="text-xs text-neutral-200 leading-relaxed font-light">
                Trade US Equities, major indices, exchange-traded derivatives, and macro pairs. Maintain optimized collateral within a single cross-margin clearing pool.
              </p>
            </article>

            <article className="p-6 space-y-4 hover:bg-neutral-900/30 transition-all rounded">
              <span className="text-xs font-mono text-neutral-300 block">02.3</span>
              <h3 className="text-base font-bold text-white tracking-tight">Systematic Risk Protections</h3>
              <p className="text-xs text-neutral-200 leading-relaxed font-light">
                Set automated risk limits directly inside your dashboard. Access customizable daily loss locks, trailing risk parameters, and continuous volatility hedges.
              </p>
            </article>

          </div>
        </section>

        {/* Section: Client Portal Terminal App Integration - Synthesized Workspaces */}
        <section id="portal" className="space-y-10">

          <div className="space-y-16 max-w-5xl mx-auto">
            {workspacesData.map((ws, index) => {
              return (
                <div key={ws.id} className="space-y-4">
                  {/* SEO-Engineered Feature Title & Explanation */}
                  <div className="space-y-2 text-center flex flex-col items-center justify-center px-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-black flex items-center gap-1.5">
                        {ws.icon} {ws.badge}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug font-sans">
                      {ws.seoTitle}
                    </h3>
                    <p className="text-xs text-neutral-200 font-sans font-light leading-relaxed max-w-3xl mx-auto">
                      {ws.roleExplanation}
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-[#050507]/65 backdrop-blur-md border border-neutral-800/80 rounded-lg p-5 sm:p-6 flex flex-col justify-between font-mono space-y-6 shadow-xl relative overflow-hidden text-left"
                  >
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.03),transparent_70%)] pointer-events-none"></div>
                    
                    {/* Top amber accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/25 to-transparent"></div>

                    {/* Core Visual Interactive Screen */}
                    <div className="relative min-h-[300px] flex flex-col justify-between z-10">
                      <WorkspaceVisualSimulator 
                        activeWorkspace={ws.id} 
                        onLaunchTerminal={onLaunchTerminal} 
                      />
                    </div>

                    {/* Documentation drawer for workspace details */}
                    <div className="border-t border-neutral-900 pt-4 space-y-3 relative z-10 text-left">
                      <div id={`terminal-description-${ws.id}`} className="space-y-1 scroll-mt-24">
                        <span className="text-[8px] text-amber-500 font-bold uppercase tracking-widest block">Specifications Matrix</span>
                        <p className="text-[11px] text-neutral-200 leading-relaxed font-sans font-light">
                          {ws.desc}
                        </p>
                      </div>

                      {/* Sub Capabilities */}
                      <div className="grid grid-cols-2 gap-2 text-[9px] text-neutral-300">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate font-sans font-light">Fully functional sandbox execution</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate font-sans font-light">Reactive state binding</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-neutral-800/60" />

        {/* Section: Structured FAQ Section (Excellent for SEO) */}
        <section id="onboarding" className="space-y-12 max-w-3xl">
          <div className="space-y-3">
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 font-bold block">04 / Regulatory & Operations</span>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-neutral-200 leading-relaxed font-light">
              Understand our operational safeguards, co-location structures, and clearing mechanics.
            </p>
          </div>

          <div className="space-y-1 border-t border-b border-neutral-800 py-1">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="border-b border-neutral-800/50 last:border-none"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full py-4 text-left flex items-center justify-between font-sans font-semibold text-sm text-white hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-300 transition-transform duration-200 ${activeFaq === index ? 'rotate-180 text-white' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {activeFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden bg-neutral-950/40 rounded-b px-4 pb-4"
                    >
                      <p className="text-xs text-neutral-200 leading-relaxed font-sans font-light">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Onboarding CTA */}
        <section className="bg-[#0b0b0d] border border-neutral-800 rounded-lg p-8 lg:p-12 text-center space-y-6">
          <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-300 font-bold block">Onboarding Portal</span>
          <h2 className="text-3xl font-light tracking-tight text-white max-w-2xl mx-auto leading-tight">
            Deploy systematic portfolios with a compliant quantitative broker.
          </h2>
          <p className="text-xs text-neutral-200 max-w-xl mx-auto font-sans font-light leading-relaxed">
            Register and configure watchlists, track correlation benchmarks, manage transactions, and secure daily setups instantaneously.
          </p>

          <div className="pt-4">
            <button
              onClick={() => onLaunchTerminal('register')}
              className="px-8 py-3 bg-white hover:bg-neutral-200 text-black font-mono font-bold uppercase tracking-widest text-xs rounded transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
            >
              Start Onboarding <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

      </main>

      {/* SEO Optimized Semantic Footer */}
      <footer className="block border-t border-neutral-800 bg-[#060608] py-16 px-6 lg:px-12 text-left relative z-10 font-sans">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-4 col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2">
              <span className="text-base font-black tracking-tight text-white block lowercase">mtxquant</span>
            </div>
            <p className="text-[10px] text-neutral-300 leading-relaxed font-light">
              Pioneering high-frequency visualizers and client-backed quantitative analysis tools.
            </p>
            <div className="space-y-2 pt-2">
              <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-300 font-bold block">
                Get us on
              </span>
              <div className="flex flex-row flex-wrap gap-2">
                <motion.a 
                  href="#"
                  whileHover={{ scale: 1.02, borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(23, 23, 23, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 bg-neutral-950/80 border border-neutral-900 px-3 py-1.5 rounded transition-all duration-150 cursor-pointer"
                >
                  <Apple className="w-3.5 h-3.5 text-white shrink-0" />
                  <div className="text-left font-sans">
                    <span className="text-[6.5px] text-neutral-300 block uppercase font-bold leading-none tracking-tight">Download on the</span>
                    <span className="text-[9.5px] text-white font-bold leading-none block mt-0.5">App Store</span>
                  </div>
                </motion.a>
                <motion.a 
                  href="#"
                  whileHover={{ scale: 1.02, borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(23, 23, 23, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 bg-neutral-950/80 border border-neutral-900 px-3 py-1.5 rounded transition-all duration-150 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10 shrink-0" />
                  <div className="text-left font-sans">
                    <span className="text-[6.5px] text-neutral-300 block uppercase font-bold leading-none tracking-tight">Get it on</span>
                    <span className="text-[9.5px] text-white font-bold leading-none block mt-0.5">Google Play</span>
                  </div>
                </motion.a>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-200 block">Clearing Services</span>
            <ul className="text-[9.5px] text-neutral-300 space-y-2 font-mono uppercase tracking-wider">
              <li><a href="#services" className="hover:text-white transition-colors">Portfolio Margining</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Collateral Pools</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Risk Sandbox</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Execution DMA</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-200 block">Institutional Portal</span>
            <ul className="text-[9.5px] text-neutral-300 space-y-2 font-mono uppercase tracking-wider">
              <li><a href="#portal" className="hover:text-white transition-colors">Markets Terminal</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Account Tiers</a></li>
              <li><a href="#onboarding" className="hover:text-white transition-colors">Operations FAQ</a></li>
              <li><span className="text-neutral-300">SEC Code: 15c3-3</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-200 block">Regulatory Compliance</span>
            <p className="text-[9px] text-neutral-300 leading-relaxed font-light">
              Disclaimer: MTX Securities is a registered trademark. Stock investing, options leveraging, and margin allocations carry significant capital risk. Customer accounts are strictly segregated under SEC and FINRA protocols.
            </p>
          </div>

        </div>

        <div className="max-w-6xl mx-auto border-t border-neutral-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-300 text-[10px] font-mono uppercase tracking-wider">
          <span>MTX Securities Brokerage Terminal &copy; 2026. MTX Securities is a registered trademark of MTXcapital.</span>
          <div className="flex space-x-6">
            <span className="hover:text-white transition-colors cursor-help">Terms of service</span>
            <span className="hover:text-white transition-colors cursor-help">Privacy policy</span>
            <span className="hover:text-white transition-colors cursor-help">risk warnings</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
