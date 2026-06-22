/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { Candlestick, FVG, OrderBlock, LiquiditySweep, MarketMetrics, Trade, NewsEvent, MarketSymbol, CorrelationData, getSymbolCorrelations, PriceAlert } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Eye, TrendingUp, HelpCircle, Activity, Plus, Minus, Bell, Volume2, VolumeX, Trash2, X, Sliders, Zap, Server, Magnet, Crosshair, Maximize2, Minimize2, ArrowRightLeft, ArrowRight, ChevronDown, Clock, Type, Newspaper } from 'lucide-react';
import DOMPriceLadder from './DOMPriceLadder';

const FRIENDLY_NAMES: Record<string, string> = {
  'EUR/USD': 'Euro / U.S. Dollar',
  'GBP/USD': 'Great Britain Pound / U.S. Dollar',
  'USD/JPY': 'U.S. Dollar / Japanese Yen',
  'AUD/USD': 'Australian Dollar / U.S. Dollar',
  'EUR/GBP': 'Euro / Great Britain Pound',
  'GOLD/USD': 'Gold Spot / U.S. Dollar',
  'SILVER/USD': 'Silver Spot / U.S. Dollar',
  'BTC/USDT': 'Bitcoin / TetherUS',
  'ETH/USDT': 'Ethereum / TetherUS',
  'SOL/USDT': 'Solana / TetherUS',
  'US30': 'Dow Jones 30 Index',
  'NAS100': 'Nasdaq 100 Index',
  'GER40': 'DAX 40 Index',
  'SPX500': 'S&P 500 Index',
};

const FEED_SOURCES: Record<string, string> = {
  'EUR/USD': 'OANDA',
  'GBP/USD': 'OANDA',
  'USD/JPY': 'OANDA',
  'AUD/USD': 'OANDA',
  'EUR/GBP': 'OANDA',
  'GOLD/USD': 'LMAX',
  'SILVER/USD': 'LMAX',
  'BTC/USDT': 'BINANCE',
  'ETH/USDT': 'BINANCE',
  'SOL/USDT': 'BINANCE',
  'US30': 'MT5_FEED',
  'NAS100': 'MT5_FEED',
  'GER40': 'MT5_FEED',
  'SPX500': 'MT5_FEED',
};

const FLAG_EMOJIS: Record<string, { f1: string; f2: string }> = {
  'EUR/USD': { f1: '', f2: '' },
  'GBP/USD': { f1: '🇬🇧', f2: '🇺🇸' },
  'USD/JPY': { f1: '🇺🇸', f2: '🇯🇵' },
  'AUD/USD': { f1: '🇦🇺', f2: '🇺🇸' },
  'EUR/GBP': { f1: '🇪🇺', f2: '🇬🇧' },
  'GOLD/USD': { f1: '🪙', f2: '🇺🇸' },
  'SILVER/USD': { f1: '💵', f2: '🥈' },
  'BTC/USDT': { f1: '🪙', f2: '🪙' },
  'ETH/USDT': { f1: '💎', f2: '💎' },
  'SOL/USDT': { f1: '☀️', f2: '☀️' },
  'US30': { f1: '🇺🇸', f2: '📈' },
  'NAS100': { f1: '🇺🇸', f2: '📊' },
  'GER40': { f1: '🇩🇪', f2: '📈' },
  'SPX500': { f1: '🇺🇸', f2: '📊' },
};

const playAlertSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1100, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 0.4);
    osc2.stop(audioCtx.currentTime + 0.4);
  } catch (error) {
    console.warn("Audio alert failed: Web Audio API not supported.", error);
  }
};

export interface SmartAlert {
  id: string;
  symbol: string;
  type: 'GAP_PIPS_PRICE' | 'TREND_STRENGTH';
  comparison: 'EXCEEDS' | 'BELOW';
  value: number;
  isActive: boolean;
  triggeredCount: number;
  lastTriggered?: string;
  lastTriggeredPrice?: number;
}

export interface VisualPriceAlert {
  id: string;
  symbol: string;
  price: number;
  isActive: boolean;
  isTriggered: boolean;
  type: 'CROSS_UP' | 'CROSS_DOWN';
  createdAt: string;
  lastTriggeredTime?: string;
}

export interface PriceActionAlert {
  id: string;
  symbol: string;
  type: 'BREAKING_OB' | 'FVG_TAP';
  direction: 'BULLISH' | 'BEARISH' | 'ANY';
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
  lastTriggeredTime?: string;
}

export interface PersistentToast {
  id: string;
  symbol: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info' | 'error';
  badge: string;
  read: boolean;
}

export interface ManualTrendline {
  id: string;
  symbol: string;
  startIdx: number;
  startPrice: number;
  endIdx: number;
  endPrice: number;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface RiskTemplate {
  name: string;
  size: number;
  rr: number;
  maxRiskPips: number;
  bufferPips: number;
}

const DEFAULT_TEMPLATES: RiskTemplate[] = [
  { name: 'Conservative Scalp', size: 0.25, rr: 2.0, maxRiskPips: 15, bufferPips: 1.0 },
  { name: 'Moderate Swing', size: 0.75, rr: 2.5, maxRiskPips: 20, bufferPips: 1.5 },
  { name: 'Heavy Institutional', size: 1.80, rr: 3.0, maxRiskPips: 25, bufferPips: 2.5 },
];

const ASSET_CLASSES = [
  {
    id: 'CURRENCIES',
    label: 'Forex Currencies',
    color: 'text-sky-400',
    assets: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP'] as MarketSymbol[]
  },
  {
    id: 'INDICES',
    label: 'Equity Indices',
    color: 'text-purple-400',
    assets: ['US30', 'NAS100', 'GER40', 'SPX500'] as MarketSymbol[]
  },
  {
    id: 'METALS',
    label: 'Precious Metals',
    color: 'text-amber-400',
    assets: ['GOLD/USD', 'SILVER/USD'] as MarketSymbol[]
  },
  {
    id: 'CRYPTO',
    label: 'Cryptocurrencies',
    color: 'text-emerald-400',
    assets: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'] as MarketSymbol[]
  }
];

interface ChartContainerProps {
  symbol: MarketSymbol;
  candles: Candlestick[];
  fvgs: FVG[];
  obs: OrderBlock[];
  sweeps: LiquiditySweep[];
  metrics: MarketMetrics;
  onLogEventToAdvisor?: (timestamp: string, price: number) => void;
  trades?: Trade[];
  onTradeExecuted?: () => void;
  newsEvents?: NewsEvent[];
  highlightOrderBlocks?: boolean;
  resetKey?: number;
  jumpRange?: { start: string; end: string; triggerId: number } | null;
  showTWVP?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onSymbolChange?: (sym: MarketSymbol) => void;
  priceAlerts?: PriceAlert[];
  onDeletePriceAlert?: (id: string) => void;
  timeframe?: 'M15' | 'H1' | 'H4' | 'D1';
  onTimeframeChange?: (tf: 'M15' | 'H1' | 'H4' | 'D1') => void;
}

export default function ChartContainer({
  symbol,
  candles: candlesInput,
  fvgs,
  obs,
  sweeps,
  metrics,
  onLogEventToAdvisor,
  trades = [],
  onTradeExecuted,
  newsEvents = [],
  highlightOrderBlocks = false,
  resetKey = 0,
  jumpRange = null,
  showTWVP = false,
  isExpanded = false,
  onToggleExpand,
  onSymbolChange,
  priceAlerts = [],
  onDeletePriceAlert,
  timeframe: timeframeProp,
  onTimeframeChange,
}: ChartContainerProps) {
  const [hoveredCandle, setHoveredCandle] = useState<Candlestick | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleFullscreen = () => {
    const element = document.getElementById("chart-container-root");
    if (!element) {
      setIsFullscreen(prev => !prev);
      return;
    }

    if (isFullscreen) {
      try {
        if (typeof document !== 'undefined' && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (err) {
        console.warn("exitFullscreen failed/blocked", err);
      }
      setIsFullscreen(false);
    } else {
      const currentScroll = typeof window !== 'undefined' ? (window.scrollY || window.pageYOffset || 0) : 0;
      setScrollOffset(currentScroll);
      
      // Fully safe requestFullscreen check
      if (element && typeof element.requestFullscreen === 'function') {
        try {
          element.requestFullscreen()
            .then(() => {
              setIsFullscreen(true);
            })
            .catch((err) => {
              console.warn("requestFullscreen promise rejected, using fallback", err);
              setIsFullscreen(true);
            });
        } catch (err) {
          console.warn("requestFullscreen synchronous error, using fallback", err);
          setIsFullscreen(true);
        }
      } else {
        // Fallback to React-based layout if native API is blocked/not supported
        setIsFullscreen(true);
      }
    }
  };

  const [isLayersDropdownOpen, setIsLayersDropdownOpen] = useState(false);
  const [isDrawDropdownOpen, setIsDrawDropdownOpen] = useState(false);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [isTimeframeSelectorOpen, setIsTimeframeSelectorOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>('CURRENCIES');
  const d3ContainerRef = useRef<SVGGElement | null>(null);

  // Timeframe and Gesture Swipe States
  const [localTimeframe, setLocalTimeframe] = useState<'M15' | 'H1' | 'H4' | 'D1'>('H4');
  const selectedTimeframe = timeframeProp || localTimeframe;
  const setSelectedTimeframe = (tf: 'M15' | 'H1' | 'H4' | 'D1') => {
    setLocalTimeframe(tf);
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    }
  };
  const [swipeFlash, setSwipeFlash] = useState<{ message: string; type: 'SYMBOL' | 'TIMEFRAME'; value: string } | null>(null);

  // Auto-expire the swipe flash feedback notification
  useEffect(() => {
    if (swipeFlash) {
      const timer = setTimeout(() => {
        setSwipeFlash(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [swipeFlash]);

  // Touch gesture state references
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleWorkspaceTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleWorkspaceTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    
    // Verify it's a horizontal swipe with sufficient distance and minimal vertical deviation
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        // Swiped Right -> Go previous
        handleSwipe('RIGHT');
      } else {
        // Swiped Left -> Go next
        handleSwipe('LEFT');
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Swipe Handlers to cycle either symbols
  const handleSwipe = (direction: 'LEFT' | 'RIGHT') => {
    // Subtle haptic vibration trigger if Vibration API is supported
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(15);
      } catch (err) {
        console.debug('Subtle vibration feedback bypassed:', err);
      }
    }

    const allSymbols: MarketSymbol[] = [
      'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP',
      'GOLD/USD', 'SILVER/USD',
      'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
      'US30', 'NAS100', 'GER40', 'SPX500'
    ];
    const currentIndex = allSymbols.indexOf(symbol);
    if (currentIndex !== -1) {
      let nextIndex = direction === 'LEFT' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex >= allSymbols.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = allSymbols.length - 1;
      const newSym = allSymbols[nextIndex];
      if (onSymbolChange) {
        onSymbolChange(newSym);
        setSwipeFlash({
          message: `Switched Asset: ${newSym}`,
          type: 'SYMBOL',
          value: newSym,
        });
      }
    }
  };

  // Safe subsetting and simulation of candelsticks based on selected timeframe
  const processedCandles = useMemo(() => {
    if (!candlesInput || candlesInput.length === 0) return [];
    
    let result: Candlestick[] = [];

    // H4
    if (selectedTimeframe === 'H4') {
      result = candlesInput.map(c => ({ ...c }));
    }
    
    // D1: Aggregate every 4 candles into 1 candle to make it feel dense and daily-like
    else if (selectedTimeframe === 'D1') {
      const aggregated: Candlestick[] = [];
      for (let i = 0; i < candlesInput.length; i += 4) {
        const chunk = candlesInput.slice(i, i + 4);
        if (chunk.length === 0) continue;
        const open = chunk[0].open;
        const close = chunk[chunk.length - 1].close;
        const high = Math.max(...chunk.map(c => c.high));
        const low = Math.min(...chunk.map(c => c.low));
        const volume = chunk.reduce((sum, c) => sum + c.volume, 0);
        aggregated.push({
          timestamp: chunk[0].timestamp,
          open,
          high,
          low,
          close,
          volume,
          ema50: chunk[chunk.length - 1].ema50,
          sma200: chunk[chunk.length - 1].sma200,
        });
      }
      result = aggregated;
    }
    
    // H1: Subdivide candles visually so they display more ticks/periods (simulated)
    else if (selectedTimeframe === 'H1') {
      const subdivided: Candlestick[] = [];
      candlesInput.forEach((c) => {
        subdivided.push({
          ...c,
          timestamp: c.timestamp,
          close: (c.open + c.close) / 2,
          high: Math.max(c.open, c.close, (c.open + c.close) / 2),
        });

        subdivided.push({
          ...c,
          timestamp: c.timestamp,
          open: (c.open + c.close) / 2,
          low: Math.min(c.open, c.close, (c.open + c.close) / 2),
        });
      });
      result = subdivided.slice(-candlesInput.length);
    }
    
    // M15: Shake prices slightly using a procedural sin pattern representing lower scale turbulence
    else if (selectedTimeframe === 'M15') {
      result = candlesInput.map((c, i) => {
        const noise = (Math.sin(i) * 0.0004);
        return {
          ...c,
          open: c.open * (1 + noise),
          close: c.close * (1 - noise),
          high: Math.max(c.open, c.close) * (1 + Math.abs(noise)),
          low: Math.min(c.open, c.close) * (1 - Math.abs(noise)),
        };
      });
    } else {
      result = candlesInput.map(c => ({ ...c }));
    }

    if (result.length === 0) return [];

    // Rewrite timestamps to be aligned perfectly with the active timeframe interval spacing.
    // This allows the x-axis grid and cursor/RSI overlays to align without distortion or overlap.
    const lastOriginalCandle = candlesInput[candlesInput.length - 1];
    const lastTime = new Date(lastOriginalCandle?.timestamp || Date.now()).getTime();

    let intervalMs = 4 * 60 * 60 * 1000; // H4 default
    if (selectedTimeframe === 'D1') intervalMs = 24 * 60 * 60 * 1000;
    else if (selectedTimeframe === 'H4') intervalMs = 4 * 60 * 60 * 1000;
    else if (selectedTimeframe === 'H1') intervalMs = 1 * 60 * 60 * 1000;
    else if (selectedTimeframe === 'M15') intervalMs = 15 * 60 * 1000;

    return result.map((c, idx) => {
      const timeOffset = (result.length - 1 - idx) * intervalMs;
      const computedDate = new Date(lastTime - timeOffset);
      return {
        ...c,
        timestamp: computedDate.toISOString()
      };
    });
  }, [candlesInput, selectedTimeframe]);

  // All downstream logic relies on candles
  const candles = processedCandles;

  // One-Click Quick Entry States
  const [isOneClickActive, setIsOneClickActive] = useState(false);
  const [oneClickLots, setOneClickLots] = useState<number>(0.75);
  const [oneClickRR, setOneClickRR] = useState<number>(2.5);
  const [oneClickBuffer, setOneClickBuffer] = useState<number>(1.5);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('Moderate Swing');
  const [oneClickStatus, setOneClickStatus] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<{
    type: 'FVG' | 'OB';
    id: string;
    gapStart?: number;
    gapEnd?: number;
    high?: number;
    low?: number;
    blockType: 'BULLISH' | 'BEARISH';
  } | null>(null);

  const getPipValue = () => {
    if (symbol === 'USD/JPY') return 0.01;
    if (symbol === 'BTC/USDT') return 1.0;
    if (symbol === 'GOLD/USD') return 0.1;
    return 0.0001;
  };

  // Reset chart view options to standard values upon request (resetKey triggers)
  useEffect(() => {
    if (resetKey > 0) {
      setShowFVG(true);
      setShowOB(true);
      setShowLiquidityMap(true);
      setVisibleCount(40);
      setOffset(0);
    }
  }, [resetKey]);

  const calculateOneClickLevels = (block: {
    type: 'FVG' | 'OB';
    gapStart?: number;
    gapEnd?: number;
    high?: number;
    low?: number;
    blockType: 'BULLISH' | 'BEARISH';
  }) => {
    const entry = livePrice;
    const pip = getPipValue();
    const buffer = oneClickBuffer * pip;
    
    let sl = 0;
    let side: 'BUY' | 'SELL' = block.blockType === 'BULLISH' ? 'BUY' : 'SELL';
    
    if (block.blockType === 'BULLISH') {
      const outerBound = block.type === 'FVG' 
        ? Math.min(block.gapStart || 0, block.gapEnd || 0) 
        : (block.low || 0);
      sl = outerBound - buffer;
      
      if (sl >= entry - (2 * pip)) {
        sl = entry - (20 * pip);
      }
      
      const risk = entry - sl;
      const tp = entry + (risk * oneClickRR);
      return { side, entry, sl, tp };
    } else {
      const outerBound = block.type === 'FVG' 
        ? Math.max(block.gapStart || 0, block.gapEnd || 0) 
        : (block.high || 0);
      sl = outerBound + buffer;
      
      if (sl <= entry + (2 * pip)) {
        sl = entry + (20 * pip);
      }
      
      const risk = sl - entry;
      const tp = entry - (risk * oneClickRR);
      return { side, entry, sl, tp };
    }
  };

  const handleOneClickExecute = async (blockType: 'FVG' | 'OB', block: any) => {
    if (!isOneClickActive) return;
    
    // Calculate SL & TP
    const levels = calculateOneClickLevels({
      type: blockType,
      gapStart: block.gapStart,
      gapEnd: block.gapEnd,
      high: block.high,
      low: block.low,
      blockType: block.type,
    });
    
    const reasonText = `One-Click direct entry triggered via Chart ${blockType} [${block.type}] block. Auto-calculated ${oneClickRR}:1 R:R structural limits.`;
    let userMarketNote = '';
    try {
      userMarketNote = localStorage.getItem('apex_predefined_market_note') || '';
    } catch (_) {}
    
    try {
      setOneClickStatus('EXECUTING...');
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          side: levels.side,
          entryPrice: levels.entry,
          stopLoss: levels.sl,
          takeProfit: levels.tp,
          size: oneClickLots,
          reason: reasonText,
          confidence: 90,
          confluences: [
            blockType === 'FVG' ? 'Fair Value Gap (FVG) Mitigation' : 'Order Block (OB) Validation',
            'One-Click Automated Institutional Template',
            `${selectedTemplateName} Allocation`
          ],
          marketNote: userMarketNote ? `${userMarketNote} (Chart Triggered)` : 'Entered via Chart One-Click template.',
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to execute orders.');
      }
      
      setOneClickStatus('SUCCESS!');
      setTimeout(() => setOneClickStatus(null), 3000);
      
      if (onTradeExecuted) {
        onTradeExecuted();
      }
    } catch (e) {
      console.error(e);
      setOneClickStatus('ERROR');
      setTimeout(() => setOneClickStatus(null), 3000);
    }
  };
  const [showFVG, setShowFVG] = useState(false);
  const [showOB, setShowOB] = useState(false);
  const [showLiquidityMap, setShowLiquidityMap] = useState(false);
  const [showVolumeProfile, setShowVolumeProfile] = useState(false);
  const [showVWAP, setShowVWAP] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showOFI, setShowOFI] = useState(false);
  const [ofiMode, setOfiMode] = useState<'HISTOGRAM' | 'PROFILE'>('HISTOGRAM');
  const [volumeProfileSide, setVolumeProfileSide] = useState<'LEFT' | 'RIGHT'>('RIGHT');
  const [hoveredOfiBin, setHoveredOfiBin] = useState<{
    index: number;
    minPrice: number;
    maxPrice: number;
    buyVolume: number;
    sellVolume: number;
    delta: number;
    imbalancePercent: number;
    hftIntensity: number;
    passiveIntensity: number;
    intensityRating: 'AGGRESSIVE_HFT' | 'PASSIVE_INSTITUTIONAL' | 'BALANCED_LIQUIDITY';
  } | null>(null);
  const [hoveredProfileBin, setHoveredProfileBin] = useState<{
    index: number;
    minPrice: number;
    maxPrice: number;
    volume: number;
    buyVolume: number;
    sellVolume: number;
    type: 'HVN' | 'LVN' | 'NORMAL';
    isPOC: boolean;
  } | null>(null);
  const [cursorY, setCursorY] = useState<number | null>(null);
  const [cursorPrice, setCursorPrice] = useState<number | null>(null);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const [cursorTime, setCursorTime] = useState<string | null>(null);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showNewsOverlay, setShowNewsOverlay] = useState(false);
  const [showHistoricalExecutions, setShowHistoricalExecutions] = useState(true);
  const [hoveredTrade, setHoveredTrade] = useState<{
    trade: Trade;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredNews, setHoveredNews] = useState<{
    id: string;
    x: number;
    y: number;
    title: string;
    currency: string;
    impact: string;
    time: string;
    forecast: string;
    previous: string;
    actual?: string;
    deviation: number;
    trend: string;
  } | null>(null);

  // Sub-second ticking engine for high-fidelity TradingView mockup style
  const lastCandle = candles[candles.length - 1];
  const basePrice = lastCandle ? lastCandle.close : (symbol === 'BTC/USDT' ? 67500 : symbol === 'USD/JPY' ? 155.4 : symbol === 'GBP/USD' ? 1.268 : 1.1645);

  const [livePrice, setLivePrice] = useState(basePrice);
  const [lastTickDir, setLastTickDir] = useState<'UP' | 'DOWN' | 'NEUTRAL'>('NEUTRAL');
  const [ticksCount, setTicksCount] = useState(52200);
  const [liveSpread, setLiveSpread] = useState(1.6);
  const [isTickActive, setIsTickActive] = useState(false);

  // Smart Alert persistent state
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>(() => {
    try {
      const saved = localStorage.getItem('smart_alerts_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return [
      { id: '1', symbol: 'EUR/USD', type: 'TREND_STRENGTH', comparison: 'EXCEEDS', value: 80, isActive: true, triggeredCount: 0 },
      { id: '2', symbol: 'BTC/USDT', type: 'GAP_PIPS_PRICE', comparison: 'EXCEEDS', value: 150, isActive: true, triggeredCount: 0 },
      { id: '3', symbol: 'USD/JPY', type: 'GAP_PIPS_PRICE', comparison: 'EXCEEDS', value: 0.1, isActive: true, triggeredCount: 0 },
    ];
  });

  const [newAlertSymbol, setNewAlertSymbol] = useState('EUR/USD');
  const [newAlertType, setNewAlertType] = useState<'GAP_PIPS_PRICE' | 'TREND_STRENGTH'>('TREND_STRENGTH');
  const [newAlertComparison, setNewAlertComparison] = useState<'EXCEEDS' | 'BELOW'>('EXCEEDS');
  const [newAlertValue, setNewAlertValue] = useState<number>(80);

  useEffect(() => {
    try {
      localStorage.setItem('smart_alerts_config', JSON.stringify(smartAlerts));
    } catch (_) {}
  }, [smartAlerts]);

  // Handle dropdown outside clicks auto-closure
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#dropdown-layers-trigger') && !target.closest('#dropdown-layers-menu')) {
        setIsLayersDropdownOpen(false);
      }
      if (!target.closest('#dropdown-draw-trigger') && !target.closest('#dropdown-draw-menu')) {
        setIsDrawDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Visual Price Alert persistent state and drawer alerts
  const [visualPriceAlerts, setVisualPriceAlerts] = useState<VisualPriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('apex_visual_price_alerts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return [];
  });

  // Custom Price-Action Trend Alerts (OB break, FVG tap)
  const [priceActionAlerts, setPriceActionAlerts] = useState<PriceActionAlert[]>(() => {
    try {
      const saved = localStorage.getItem('apex_price_action_trend_alerts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return [
      { id: 'pa-1', symbol: 'EUR/USD', type: 'FVG_TAP', direction: 'BULLISH', isActive: true, isTriggered: false, createdAt: new Date().toLocaleTimeString() },
      { id: 'pa-2', symbol: 'BTC/USDT', type: 'BREAKING_OB', direction: 'ANY', isActive: true, isTriggered: false, createdAt: new Date().toLocaleTimeString() }
    ];
  });

  const [persistentToasts, setPersistentToasts] = useState<PersistentToast[]>(() => {
    try {
      const saved = localStorage.getItem('apex_persistent_toasts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return [];
  });

  const [alertsActiveTab, setAlertsActiveTab] = useState<'STANDARD' | 'PRICE_ACTION'>('PRICE_ACTION');
  
  // New Price-Action Alert Form settings
  const [newPaSymbol, setNewPaSymbol] = useState('EUR/USD');
  const [newPaType, setNewPaType] = useState<'BREAKING_OB' | 'FVG_TAP'>('BREAKING_OB');
  const [newPaDirection, setNewPaDirection] = useState<'BULLISH' | 'BEARISH' | 'ANY'>('ANY');

  useEffect(() => {
    try {
      localStorage.setItem('apex_price_action_trend_alerts', JSON.stringify(priceActionAlerts));
    } catch (_) {}
  }, [priceActionAlerts]);

  useEffect(() => {
    try {
      localStorage.setItem('apex_persistent_toasts', JSON.stringify(persistentToasts));
    } catch (_) {}
  }, [persistentToasts]);

  const [isDrawingPriceAlert, setIsDrawingPriceAlert] = useState(false);
  const [hoveredY, setHoveredY] = useState<number | null>(null);

  // Manual Trendline persistent state and drawing status
  const [manualTrendlines, setManualTrendlines] = useState<ManualTrendline[]>(() => {
    try {
      const saved = localStorage.getItem('apex_manual_trendlines');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return [];
  });

  const [isDrawingTrendline, setIsDrawingTrendline] = useState(false);
  const [isMagnetActive, setIsMagnetActive] = useState(true);
  const [showCrosshairTool, setShowCrosshairTool] = useState(true);
  const [trendlineStartPoint, setTrendlineStartPoint] = useState<{ xIndex: number; price: number } | null>(null);
  const [trendlineHoverPoint, setTrendlineHoverPoint] = useState<{ xIndex: number; price: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('apex_manual_trendlines', JSON.stringify(manualTrendlines));
    } catch (_) {}
  }, [manualTrendlines]);

  // Price Text Annotations persistent state and drawing status
  interface ChartAnnotation {
    id: string;
    symbol: string;
    xIndex: number;
    price: number;
    text: string;
    createdAt: number;
  }

  const [showTradeStatsOverlay, setShowTradeStatsOverlay] = useState<boolean>(false);
  const [showCorrelationOverlay, setShowCorrelationOverlay] = useState<boolean>(false);
  const [isDrawingAnnotation, setIsDrawingAnnotation] = useState(false);
  const [chartAnnotations, setChartAnnotations] = useState<ChartAnnotation[]>(() => {
    try {
      const saved = localStorage.getItem('apex_chart_annotations');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    return [];
  });
  const [activeInputAnnotation, setActiveInputAnnotation] = useState<{
    xIndex: number;
    price: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('apex_chart_annotations', JSON.stringify(chartAnnotations));
    } catch (_) {}
  }, [chartAnnotations]);

  const handleSaveAnnotation = (text: string) => {
    if (!activeInputAnnotation || !text.trim()) {
      setActiveInputAnnotation(null);
      return;
    }
    const newAnn: ChartAnnotation = {
      id: 'ann-' + Date.now(),
      symbol: symbol,
      xIndex: activeInputAnnotation.xIndex,
      price: activeInputAnnotation.price,
      text: text.trim(),
      createdAt: Date.now()
    };
    setChartAnnotations(prev => [...prev, newAnn]);
    setActiveInputAnnotation(null);
  };
  const [triggeredAlertBanners, setTriggeredAlertBanners] = useState<{
    id: string;
    symbol: string;
    price: number;
    type: 'CROSS_UP' | 'CROSS_DOWN';
    time: string;
  }[]>([]);

  const prevLivePriceRef = React.useRef<number>(livePrice);

  useEffect(() => {
    try {
      localStorage.setItem('apex_visual_price_alerts', JSON.stringify(visualPriceAlerts));
    } catch (_) {}
  }, [visualPriceAlerts]);

  useEffect(() => {
    prevLivePriceRef.current = livePrice;
  }, [livePrice]);

  // Horizontal Scale/Zoom and Drag states
  const [visibleCount, setVisibleCount] = useState(40);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);
  const [isGaugeHovered, setIsGaugeHovered] = useState(false);
  const [isChartShiftActive, setIsChartShiftActive] = useState(true);
  const [chartShiftBars, setChartShiftBars] = useState(15);

  useEffect(() => {
    if (!jumpRange || candles.length === 0) return;
    const startMs = new Date(jumpRange.start).getTime();
    const endMs = new Date(jumpRange.end).getTime();

    let bestStartIdx = -1;
    let bestEndIdx = -1;
    let minStartDiff = Infinity;
    let minEndDiff = Infinity;

    for (let i = 0; i < candles.length; i++) {
      const cTime = new Date(candles[i].timestamp).getTime();
      
      const startDiff = Math.abs(cTime - startMs);
      if (startDiff < minStartDiff) {
        minStartDiff = startDiff;
        bestStartIdx = i;
      }

      const endDiff = Math.abs(cTime - endMs);
      if (endDiff < minEndDiff) {
        minEndDiff = endDiff;
        bestEndIdx = i;
      }
    }

    if (bestStartIdx !== -1 && bestEndIdx !== -1) {
      const sIdx = Math.min(bestStartIdx, bestEndIdx);
      const eIdx = Math.max(bestStartIdx, bestEndIdx);
      const count = eIdx - sIdx + 1;
      const off = candles.length - 1 - eIdx;
      // Safeguard visible count to a comfortable view boundary
      setVisibleCount(Math.max(15, Math.min(100, count)));
      setOffset(off);
    }
  }, [jumpRange, candles]);

  useEffect(() => {
    setLivePrice(basePrice);
  }, [basePrice]);

  const [isMt5Active, setIsMt5Active] = useState(false);

  useEffect(() => {
    const checkMT5Status = async () => {
      try {
        const res = await fetch('/api/mt5/status');
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data && typeof data[symbol] === 'boolean') {
            setIsMt5Active(data[symbol]);
          }
        }
      } catch (err) {
        console.warn('Unable to retrieve MetaTrader 5 status:', err);
      }
    };

    checkMT5Status();
    const interval = setInterval(checkMT5Status, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  useEffect(() => {
    const interval = setInterval(() => {
      const pipSize = symbol === 'BTC/USDT' ? 1.0 : symbol === 'USD/JPY' ? 0.01 : 0.0001;
      const isUp = Math.random() > 0.49;
      // standard micro jitter: e.g. 0.1 to 0.5 pips
      const tickDelta = (Math.random() * 0.4 + 0.1) * pipSize * (isUp ? 1 : -1);
      
      setLivePrice((prev) => {
        const next = prev + tickDelta;
        // Keep it bounded to backend state value limit
        const limitRange = symbol === 'BTC/USDT' ? 60 : 0.0025;
        if (Math.abs(next - basePrice) > limitRange) {
          return basePrice;
        }
        return parseFloat(next.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 1 : 5));
      });

      setLastTickDir(isUp ? 'UP' : 'DOWN');
      setTicksCount((p) => p + Math.floor(Math.random() * 3) - 1);
      
      setLiveSpread(() => {
        const baseSpread = symbol === 'BTC/USDT' ? 15.0 : symbol === 'USD/JPY' ? 1.2 : 1.6;
        const delta = (Math.random() * 0.4 - 0.2);
        return parseFloat((baseSpread + delta).toFixed(1));
      });

      setIsTickActive(true);
      const t = setTimeout(() => setIsTickActive(false), 120);
      return () => clearTimeout(t);
    }, 450);

    return () => clearInterval(interval);
  }, [basePrice, symbol]);

  const pipFactor = symbol === 'BTC/USDT' ? 1.0 : symbol === 'USD/JPY' ? 0.01 : 0.0001;
  const spreadValueInUnits = liveSpread * pipFactor;
  const sellPriceVal = livePrice - (spreadValueInUnits / 2);
  const buyPriceVal = livePrice + (spreadValueInUnits / 2);

  const formattedSell = sellPriceVal.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 1 : 5);
  const formattedBuy = buyPriceVal.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 1 : 5);

  const pairName = FRIENDLY_NAMES[symbol] || symbol;
  const feedSource = FEED_SOURCES[symbol] || 'OANDA';
  const symbolEmoji = FLAG_EMOJIS[symbol] || { f1: '🌎', f2: '💵' };

  // Visual progress bar calculating the strength of the 50 EMA Trend Bias
  const trendIntensity = useMemo(() => {
    const lastCandle = candles[candles.length - 1];
    const basePrice = lastCandle ? lastCandle.close : (symbol === 'BTC/USDT' ? 67500 : symbol === 'USD/JPY' ? 155.4 : symbol === 'GBP/USD' ? 1.268 : 1.1645);
    const activePrice = hoveredCandle ? hoveredCandle.close : (typeof livePrice !== 'undefined' ? livePrice : basePrice);
    
    if (!lastCandle) return { percent: 0, label: 'NONE', displayDistance: '0.0 Pips' };
    
    const currentEma = lastCandle.ema50 || basePrice;
    const distancePrice = Math.abs(activePrice - currentEma);
    
    // Fallbacks for ATR to normalize the metrics
    const atr = metrics.atr || (symbol === 'BTC/USDT' ? 450 : symbol === 'USD/JPY' ? 0.35 : 0.0025);
    const multiplier = distancePrice / (atr || 1);
    
    // Normalize percentage from 0 to 100% based on 1.5 ATR expectation
    const percent = Math.min(100, Math.max(5, Math.round((multiplier / 1.5) * 100)));
    
    // Label depending on intensity strength
    let label = 'WEAK';
    if (percent > 75) label = 'EXTREME';
    else if (percent > 45) label = 'STRONG';
    else if (percent > 20) label = 'MODERATE';
    
    // Helper to format in pips / points depending on symbol
    let displayDistance = '';
    if (symbol === 'USD/JPY') {
      displayDistance = `${(distancePrice).toFixed(3)} ¥`;
    } else if (symbol === 'BTC/USDT') {
      displayDistance = `${Math.round(distancePrice)} USDT`;
    } else {
      displayDistance = `${(distancePrice * 10000).toFixed(1)} Pips`;
    }

    return {
      percent,
      label,
      displayDistance
    };
  }, [candles, hoveredCandle, livePrice, metrics.atr, symbol]);

  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const playedAlarmRef = React.useRef(false);

  // Memoized lists of active trades for direct overlay display of price boundaries
  const activeSymbolTrades = useMemo(() => {
    return trades.filter((t) => t.status === 'OPEN' && t.symbol === symbol);
  }, [trades, symbol]);

  const handleCloseChartTrade = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/trades/${tradeId}/close`, {
        method: 'POST',
      });
      if (res.ok && onTradeExecuted) {
        onTradeExecuted();
      }
    } catch (e) {
      console.warn('Failed to close trade from chart overlay:', e);
    }
  };

  // High-Impact News tracker (using fixed static baseline matching EconomicCalendar context June 1st)
  const targetTimeRef = useMemo(() => new Date('2026-06-01T10:21:59Z'), []);
  const imminentHighImpactNews = useMemo(() => {
    return newsEvents.filter((ev) => {
      if (ev.impact !== 'HIGH') return false;
      const evTime = new Date(ev.time);
      const diffMs = evTime.getTime() - targetTimeRef.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 4;
    });
  }, [newsEvents, targetTimeRef]);

  // News events matched to candlesticks for on-chart overlay backtesting
  const newsEventsWithCandles = useMemo(() => {
    if (!newsEvents || newsEvents.length === 0 || candles.length === 0) return [];

    const candleIntervalMs = candles.length > 1
      ? Math.abs(new Date(candles[1].timestamp).getTime() - new Date(candles[0].timestamp).getTime())
      : 3600000;

    const pipFactor = symbol === 'BTC/USDT' ? 1.0 : symbol === 'USD/JPY' ? 0.01 : 0.0001;

    return newsEvents.map((news) => {
      const newsTime = new Date(news.time).getTime();
      let bestIndex = -1;
      let minDiff = Infinity;

      for (let i = 0; i < candles.length; i++) {
        const candleTime = new Date(candles[i].timestamp).getTime();
        const diff = Math.abs(newsTime - candleTime);
        if (diff < minDiff) {
          minDiff = diff;
          bestIndex = i;
        }
      }

      const isMatch = bestIndex !== -1 && minDiff <= candleIntervalMs * 1.5;

      // Calculate backtesting volatility (max price deviation in the subsequent 4 candles)
      let maxPipsDeviation = 0;
      let postTrend: 'BULLISH' | 'BEARISH' | 'CHOPPY' = 'CHOPPY';

      if (isMatch && bestIndex < candles.length) {
        const startCandle = candles[bestIndex];
        const baselinePrice = startCandle.open;
        const sliceLength = 4;
        const postCandles = candles.slice(bestIndex, bestIndex + sliceLength);
        if (postCandles.length > 0) {
          const highs = postCandles.map(c => c.high);
          const lows = postCandles.map(c => c.low);
          const maxHigh = Math.max(...highs);
          const minLow = Math.min(...lows);
          const devHigh = Math.abs(maxHigh - baselinePrice);
          const devLow = Math.abs(minLow - baselinePrice);
          const maxPriceDiff = Math.max(devHigh, devLow);
          maxPipsDeviation = maxPriceDiff / pipFactor;

          const finalClose = postCandles[postCandles.length - 1].close;
          const ratio = (finalClose - baselinePrice) / (baselinePrice || 1);
          if (ratio > 0.0019) postTrend = 'BULLISH';
          else if (ratio < -0.0019) postTrend = 'BEARISH';
        }
      }

      return {
        event: news,
        candleIndex: isMatch ? bestIndex : -1,
        maxPipsDeviation,
        postTrend,
      };
    }).filter(item => item.candleIndex !== -1);
  }, [newsEvents, candles, symbol]);

  // Historical trades matched to candlesticks for visual on-chart arrow indicators
  const tradesWithCandles = useMemo(() => {
    if (!trades || trades.length === 0 || candles.length === 0) return [];

    const candleIntervalMs = candles.length > 1
      ? Math.abs(new Date(candles[1].timestamp).getTime() - new Date(candles[0].timestamp).getTime())
      : 3600000;

    return trades
      .filter((t) => t.symbol === symbol)
      .map((t) => {
        const tradeTime = new Date(t.timestamp).getTime();
        let bestIndex = -1;
        let minDiff = Infinity;

        for (let i = 0; i < candles.length; i++) {
          const candleTime = new Date(candles[i].timestamp).getTime();
          const diff = Math.abs(tradeTime - candleTime);
          if (diff < minDiff) {
            minDiff = diff;
            bestIndex = i;
          }
        }

        const isMatch = bestIndex !== -1 && minDiff <= candleIntervalMs * 4;

        return {
          trade: t,
          candleIndex: isMatch ? bestIndex : -1,
        };
      })
      .filter(item => item.candleIndex !== -1);
  }, [trades, candles, symbol]);

  useEffect(() => {
    if (isAlarmEnabled && trendIntensity.percent >= 80) {
      if (!playedAlarmRef.current) {
        playAlertSound();
        playedAlarmRef.current = true;
      }
    } else if (trendIntensity.percent < 80) {
      playedAlarmRef.current = false;
    }
  }, [trendIntensity.percent, isAlarmEnabled]);

  // Real-time evaluation of Smart Alerts for the active symbol
  useEffect(() => {
    let changed = false;
    const evaluatedAlerts = smartAlerts.map((alert) => {
      if (!alert.isActive || alert.symbol !== symbol) return alert;

      const lastCandle = candles[candles.length - 1];
      const currentEma = lastCandle?.ema50 || basePrice;
      const distancePrice = Math.abs(livePrice - currentEma);

      let currentVal = 0;
      if (alert.type === 'TREND_STRENGTH') {
        currentVal = trendIntensity.percent;
      } else {
        if (symbol === 'USD/JPY') {
          currentVal = distancePrice;
        } else if (symbol === 'BTC/USDT') {
          currentVal = distancePrice;
        } else {
          currentVal = distancePrice * 10000;
        }
      }

      const isMet = alert.comparison === 'EXCEEDS' 
        ? currentVal >= alert.value 
        : currentVal <= alert.value;

      if (isMet) {
        if (!alert.isTriggered) {
          playAlertSound();
          changed = true;
          return {
            ...alert,
            isTriggered: true,
            triggeredCount: alert.triggeredCount + 1,
            lastTriggered: new Date().toLocaleTimeString(),
            lastTriggeredPrice: livePrice,
          };
        }
      } else {
        if (alert.isTriggered) {
          changed = true;
          return {
            ...alert,
            isTriggered: false,
          };
        }
      }
      return alert;
    });

    if (changed) {
      setSmartAlerts(evaluatedAlerts);
    }
  }, [livePrice, symbol, smartAlerts, trendIntensity.percent, basePrice, candles]);

  // Get price value from coordinate Y pixel location
  const getPriceFromY = (yVal: number) => {
    const plotHeight = height - padding.top - padding.bottom;
    if (plotHeight === 0) return basePrice;
    const ratio = (height - padding.bottom - yVal) / plotHeight;
    const range = priceLimits.max - priceLimits.min;
    return priceLimits.min + ratio * range;
  };

  // Real-time evaluation of Visual price alerts (horizontal lines crossing)
  useEffect(() => {
    let changed = false;
    const prevLivePrice = prevLivePriceRef.current;
    if (prevLivePrice === livePrice) return; // no tick change

    const updatedPriceAlerts = visualPriceAlerts.map((alert) => {
      if (!alert.isActive || alert.isTriggered || alert.symbol !== symbol) return alert;

      const crossedUp = prevLivePrice < alert.price && livePrice >= alert.price;
      const crossedDown = prevLivePrice > alert.price && livePrice <= alert.price;

      if (crossedUp || crossedDown) {
        playAlertSound();
        changed = true;

        if (onLogEventToAdvisor) {
          onLogEventToAdvisor(
            `🔔 Price alert triggered: ${symbol} crossed ${alert.type === 'CROSS_UP' ? 'above' : 'below'} ${alert.price}`,
            livePrice
          );
        }

        // Add beautiful horizontal alert popup banner
        setTriggeredAlertBanners((prev) => [
          ...prev,
          {
            id: Date.now().toString() + '-' + Math.random(),
            symbol: alert.symbol,
            price: alert.price,
            type: alert.type,
            time: new Date().toLocaleTimeString(),
          },
        ]);

        return {
          ...alert,
          isTriggered: true,
          isActive: false, // deactivate once hit
          lastTriggeredTime: new Date().toLocaleTimeString(),
        };
      }
      return alert;
    });

    if (changed) {
      setVisualPriceAlerts(updatedPriceAlerts);
    }
  }, [livePrice, symbol, visualPriceAlerts, onLogEventToAdvisor]);

  // Real-time evaluation of custom PriceActionAlerts (Order Block break, FVG tap)
  useEffect(() => {
    const prevLivePrice = prevLivePriceRef.current;
    if (!prevLivePrice || prevLivePrice === livePrice || priceActionAlerts.length === 0) return;

    let changedRule = false;
    const newToasts: PersistentToast[] = [];

    const evaluatedAlerts = priceActionAlerts.map((alert) => {
      if (!alert.isActive || alert.isTriggered || alert.symbol !== symbol) return alert;

      let triggered = false;
      let reason = '';
      let badge = '';

      if (alert.type === 'BREAKING_OB') {
        const relevantOBs = obs.filter(ob => (alert.direction === 'ANY' || ob.type === alert.direction));
        
        for (const ob of relevantOBs) {
          const crossedObLow = prevLivePrice >= ob.low && livePrice < ob.low;
          const crossedObHigh = prevLivePrice <= ob.high && livePrice > ob.high;

          if (crossedObLow || crossedObHigh) {
            triggered = true;
            reason = `Price crossed the ${ob.type.toLowerCase()} Order Block boundary [${ob.low.toFixed(symbol === 'USD/JPY' ? 2 : 4)} - ${ob.high.toFixed(symbol === 'USD/JPY' ? 2 : 4)}] with live price at ${livePrice.toFixed(symbol === 'USD/JPY' ? 2 : 4)}`;
            badge = `OB BREAK`;
            break;
          }
        }
      } else if (alert.type === 'FVG_TAP') {
        const relevantFVGs = fvgs.filter(fvg => (alert.direction === 'ANY' || fvg.type === alert.direction));

        for (const fvg of relevantFVGs) {
          const maxGap = Math.max(fvg.gapStart, fvg.gapEnd);
          const minGap = Math.min(fvg.gapStart, fvg.gapEnd);

          const tappedTop = prevLivePrice > maxGap && livePrice <= maxGap;
          const tappedBottom = prevLivePrice < minGap && livePrice >= minGap;

          if (tappedTop || tappedBottom) {
            triggered = true;
            reason = `Price tapped into ${fvg.type.toLowerCase()} Fair Value Gap range [${minGap.toFixed(symbol === 'USD/JPY' ? 2 : 4)} - ${maxGap.toFixed(symbol === 'USD/JPY' ? 2 : 4)}] at live price ${livePrice.toFixed(symbol === 'USD/JPY' ? 2 : 4)}`;
            badge = `FVG TAP`;
            break;
          }
        }
      }

      if (triggered) {
        changedRule = true;
        playAlertSound();

        newToasts.push({
          id: 'pa-toast-' + Date.now() + '-' + Math.random(),
          symbol: alert.symbol,
          title: alert.type === 'BREAKING_OB' ? '🚫 Order Block Structural Break' : '🟢 Fair Value Gap (FVG) Tapped',
          message: `${reason}. Zone confluences updated.`,
          timestamp: new Date().toLocaleTimeString(),
          type: alert.type === 'BREAKING_OB' ? 'warning' : 'success',
          badge: badge,
          read: false
        });

        if (onLogEventToAdvisor) {
          onLogEventToAdvisor(
            `🚨 Price-action alert triggered: [${alert.symbol}] ${badge} - ${reason}`,
            livePrice
          );
        }

        return {
          ...alert,
          isTriggered: true,
          isActive: false,
          lastTriggeredTime: new Date().toLocaleTimeString()
        };
      }

      return alert;
    });

    if (changedRule) {
      setPriceActionAlerts(evaluatedAlerts);
    }
    if (newToasts.length > 0) {
      setPersistentToasts(prev => [...newToasts, ...prev]);
    }
  }, [livePrice, symbol, priceActionAlerts, obs, fvgs, onLogEventToAdvisor]);

  // Escape key drawing-mode cancel listener & fullscreen exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawingPriceAlert(false);
        setIsDrawingTrendline(false);
        setIsDrawingAnnotation(false);
        setTrendlineStartPoint(null);
        setTrendlineHoverPoint(null);
        setHoveredY(null);
        setIsFullscreen(false);
        setActiveInputAnnotation(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // HTML5 requestFullscreen synchronization effect
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleFSChange = () => {
      const isCurrentlyFS = !!document.fullscreenElement;
      if (isCurrentlyFS) {
        setScrollOffset(window.scrollY || window.pageYOffset || 0);
      }
      if (isCurrentlyFS !== isFullscreen) {
        setIsFullscreen(isCurrentlyFS);
      }
    };

    document.addEventListener('fullscreenchange', handleFSChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
    };
  }, [isFullscreen]);

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAlertValue <= 0) return;
    const newAlert: SmartAlert = {
      id: Date.now().toString(),
      symbol: newAlertSymbol,
      type: newAlertType,
      comparison: newAlertComparison,
      value: newAlertValue,
      isActive: true,
      triggeredCount: 0
    };
    setSmartAlerts((prev) => [...prev, newAlert]);
  };

  const handleDeleteAlert = (id: string) => {
    setSmartAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const handleToggleAlertActive = (id: string) => {
    setSmartAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, isActive: !alert.isActive, isTriggered: false } : alert
      )
    );
  };

  const handleResetTriggerCount = (id: string) => {
    setSmartAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, triggeredCount: 0, lastTriggered: undefined, lastTriggeredPrice: undefined, isTriggered: false } : alert
      )
    );
  };

  const handleAddPaAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: PriceActionAlert = {
      id: 'pa-' + Date.now().toString(),
      symbol: newPaSymbol,
      type: newPaType,
      direction: newPaDirection,
      isActive: true,
      isTriggered: false,
      createdAt: new Date().toLocaleTimeString()
    };
    setPriceActionAlerts((prev) => [newAlert, ...prev]);
  };

  const handleDeletePaAlert = (id: string) => {
    setPriceActionAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const handleTogglePaAlertActive = (id: string) => {
    setPriceActionAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, isActive: !alert.isActive, isTriggered: false } : alert
      )
    );
  };

  // SVG dimensions for candlestick pane (updated dynamically via ResizeObserver)
  const [dimensions, setDimensions] = useState({ width: 800, height: 360 });
  const width = dimensions.width;
  const height = dimensions.height;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: rectWidth, height: rectHeight } = entries[0].contentRect;
      if (rectWidth > 0 && rectHeight > 0) {
        setDimensions({
          width: Math.floor(rectWidth),
          height: Math.floor(rectHeight)
        });
      } else if (rectWidth > 0) {
        setDimensions((prev) => ({
          ...prev,
          width: Math.floor(rectWidth)
        }));
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isFullscreen]);

  // Prevent parent body scroll and lock layout bounds when in fullscreen pop-up mode
  useEffect(() => {
    if (isFullscreen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyHeight = document.body.style.height;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalHtmlHeight = document.documentElement.style.height;

      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100vh';
      
      // Auto-focus and scroll to absolute top of view to align overlays perfectly
      window.scrollTo(0, 0);

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.height = originalBodyHeight;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.documentElement.style.height = originalHtmlHeight;
      };
    }
  }, [isFullscreen]);

  const padding = { top: 20, right: 70, bottom: 30, left: 20 };

  // Constrain visibleCount and offset based on current candles
  const actualVisibleCount = Math.min(visibleCount, candles.length || 40);
  const maxOffset = Math.max(0, candles.length - actualVisibleCount);
  const actualOffset = Math.min(offset, maxOffset);

  // If chart shift is active and we are at the front of the timeline (actualOffset is small),
  // we add empty Future Columns to the right to leave workspace space for predictions.
  const shiftAmount = isChartShiftActive ? chartShiftBars : 0;
  const endIndex = candles.length > 0 
    ? Math.min(candles.length - 1 - actualOffset + shiftAmount, candles.length - 1 + shiftAmount) 
    : 0;
  const startIndex = Math.max(0, endIndex - actualVisibleCount + 1);

  // Filter visible candles for dynamic Y-axis scaling (cap slicing within array limits)
  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    return candles.slice(startIndex, Math.min(endIndex + 1, candles.length));
  }, [candles, startIndex, endIndex]);

  // Calculate scales based on visible candles for auto-fitting Y-axis
  const priceLimits = useMemo(() => {
    if (visibleCandles.length === 0) return { min: 0, max: 100 };
    const highs = visibleCandles.map((c) => c.high);
    const lows = visibleCandles.map((c) => c.low);
    let minPrice = Math.min(...lows);
    let maxPrice = Math.max(...highs);

    // Give some breathing padding
    const range = maxPrice - minPrice || 1;
    minPrice -= range * 0.08;
    maxPrice += range * 0.08;

    return { min: minPrice, max: maxPrice };
  }, [visibleCandles]);

  const volumeProfile = useMemo(() => {
    if (visibleCandles.length === 0) return null;

    const numBins = 24;
    const minPrice = priceLimits.min;
    const maxPrice = priceLimits.max;
    const range = maxPrice - minPrice;
    if (range <= 0) return null;

    const binSize = range / numBins;

    // Initialize bins
    const bins = Array.from({ length: numBins }, (_, i) => {
      const binMinPrice = minPrice + i * binSize;
      const binMaxPrice = binMinPrice + binSize;
      return {
        index: i,
        minPrice: binMinPrice,
        maxPrice: binMaxPrice,
        volume: 0,
        buyVolume: 0,
        sellVolume: 0,
      };
    });

    // Distribute volume of visible candles into bins
    visibleCandles.forEach((candle) => {
      const volume = candle.volume || 0;
      const low = candle.low;
      const high = candle.high;
      const open = candle.open;
      const close = candle.close;
      const isBullish = close >= open;

      // Split volume fractionally into buy and sell volumes for visual aesthetics
      const buyFraction = isBullish ? 0.65 : 0.35;
      const sellFraction = isBullish ? 0.35 : 0.65;
      const buyVolume = volume * buyFraction;
      const sellVolume = volume * sellFraction;

      const span = high - low;
      if (span <= 0) {
        const binIdx = Math.min(numBins - 1, Math.max(0, Math.floor((close - minPrice) / binSize)));
        bins[binIdx].volume += volume;
        bins[binIdx].buyVolume += buyVolume;
        bins[binIdx].sellVolume += sellVolume;
      } else {
        // Distribute fractional volume according to exact bin overlaps
        bins.forEach((bin) => {
          const intersectMin = Math.max(low, bin.minPrice);
          const intersectMax = Math.min(high, bin.maxPrice);
          if (intersectMax > intersectMin) {
            const overlapFraction = (intersectMax - intersectMin) / span;
            const allocatedVol = volume * overlapFraction;
            bin.volume += allocatedVol;
            bin.buyVolume += buyVolume * overlapFraction;
            bin.sellVolume += sellVolume * overlapFraction;
          }
        });
      }
    });

    // Calculate POC, HVN, and LVN labels
    const totalVol = bins.reduce((sum, b) => sum + b.volume, 0);
    const avgVol = totalVol / numBins;
    let maxVol = Math.max(...bins.map((b) => b.volume));
    if (maxVol <= 0) maxVol = 1;

    let pocIndex = -1;
    let maxV = -1;
    bins.forEach((b, idx) => {
      if (b.volume > maxV) {
        maxV = b.volume;
        pocIndex = idx;
      }
    });

    const nodes = bins.map((bin, idx) => {
      const vol = bin.volume;
      const prevVol = idx > 0 ? bins[idx - 1].volume : 0;
      const nextVol = idx < numBins - 1 ? bins[idx + 1].volume : 0;

      let type: 'HVN' | 'LVN' | 'NORMAL' = 'NORMAL';
      if (idx === pocIndex) {
        type = 'HVN'; // Point of Control is always high volume
      } else if (vol > prevVol && vol > nextVol && vol > avgVol * 1.1) {
        type = 'HVN';
      } else if (vol < prevVol && vol < nextVol && vol < avgVol * 0.9 && vol > 0) {
        type = 'LVN';
      }

      return {
        ...bin,
        type,
        isPOC: idx === pocIndex,
      };
    });

    return {
      bins: nodes,
      maxVolume: maxVol,
      avgVolume: avgVol,
      pocIndex,
    };
  }, [visibleCandles, priceLimits]);

  // Real-time Order Flow Imbalance (OFI) Calculation
  const orderFlowImbalanceData = useMemo(() => {
    if (visibleCandles.length === 0) return null;

    const numBins = 24;
    const minPrice = priceLimits.min;
    const maxPrice = priceLimits.max;
    const range = maxPrice - minPrice;
    if (range <= 0) return null;

    const binSize = range / numBins;

    // Initialize bins
    const bins = Array.from({ length: numBins }, (_, i) => {
      const binMinPrice = minPrice + i * binSize;
      const binMaxPrice = binMinPrice + binSize;
      return {
        index: i,
        minPrice: binMinPrice,
        maxPrice: binMaxPrice,
        buyVolume: 0,
        sellVolume: 0,
        delta: 0,
        imbalancePercent: 0,
        hftIntensity: 0,
        passiveIntensity: 0,
        intensityRating: 'BALANCED_LIQUIDITY' as 'AGGRESSIVE_HFT' | 'PASSIVE_INSTITUTIONAL' | 'BALANCED_LIQUIDITY'
      };
    });

    // Distribute fractional volumes specifically aligned with institutional buyer vs seller footprints
    visibleCandles.forEach((candle, cIdx) => {
      const volume = candle.volume || 100;
      const low = candle.low;
      const high = candle.high;
      const open = candle.open;
      const close = candle.close;
      const isBullish = close >= open;

      // Extract institutional pressure factor based on price action and relative close location inside candle
      const candleRange = high - low || 1;
      const closeLocationPercent = (close - low) / candleRange;
      
      // Calculate realistic buy/sell split percentage
      let buyFraction = closeLocationPercent;
      if (buyFraction < 0.15) buyFraction = 0.15;
      if (buyFraction > 0.85) buyFraction = 0.85;

      // Inject deterministic high-frequency tick noise for a realistic live-broker environment feel
      const noise = (Math.sin(cIdx * 987.654 + Date.now() * 0.0001) + 1) / 2 * 0.08 - 0.04;
      buyFraction = Math.min(0.92, Math.max(0.08, buyFraction + noise));
      
      const sellFraction = 1 - buyFraction;
      const buyVol = volume * buyFraction;
      const sellVol = volume * sellFraction;

      const span = high - low;
      if (span <= 0) {
        const binIdx = Math.min(numBins - 1, Math.max(0, Math.floor((close - minPrice) / binSize)));
        bins[binIdx].buyVolume += buyVol;
        bins[binIdx].sellVolume += sellVol;
      } else {
        bins.forEach((bin) => {
          const intersectMin = Math.max(low, bin.minPrice);
          const intersectMax = Math.min(high, bin.maxPrice);
          if (intersectMax > intersectMin) {
            const overlapFraction = (intersectMax - intersectMin) / span;
            bin.buyVolume += buyVol * overlapFraction;
            bin.sellVolume += sellVol * overlapFraction;
          }
        });
      }
    });

    const maxTotalVolume = Math.max(...bins.map((b) => b.buyVolume + b.sellVolume)) || 1;

    // Compute delta, percentage imbalance, and intensity metrics
    bins.forEach((bin) => {
      const total = bin.buyVolume + bin.sellVolume;
      bin.delta = bin.buyVolume - bin.sellVolume;
      bin.imbalancePercent = total > 0 ? (bin.delta / total) * 100 : 0;

      const imbalanceRatio = total > 0 ? Math.abs(bin.delta) / total : 0;
      const relativeVol = total / maxTotalVolume;

      // Real-time HFT Aggression: High when directional sweep has high relative volume
      // Real-time Passive Absorption: High when relative volume is massive, but imbalance ratio is low
      const computedHft = Math.round(imbalanceRatio * 100);
      const computedPassive = Math.round((1 - imbalanceRatio) * 100);

      bin.hftIntensity = computedHft;
      bin.passiveIntensity = computedPassive;

      if (imbalanceRatio >= 0.28 && relativeVol >= 0.15) {
        bin.intensityRating = 'AGGRESSIVE_HFT';
      } else if (imbalanceRatio < 0.28 && relativeVol >= 0.40) {
        bin.intensityRating = 'PASSIVE_INSTITUTIONAL';
      } else {
        bin.intensityRating = 'BALANCED_LIQUIDITY';
      }
    });

    let maxAbsDelta = Math.max(...bins.map((b) => Math.abs(b.delta)));
    if (maxAbsDelta <= 0) maxAbsDelta = 1;

    return {
      bins,
      maxAbsDelta,
      maxTotalVolume,
    };
  }, [visibleCandles, priceLimits]);

  const xStep = useMemo(() => {
    return (width - padding.left - padding.right) / (actualVisibleCount || 1);
  }, [width, actualVisibleCount, padding.left, padding.right]);

  // Convert price coordinate to SVG container height based on shifted startIndex
  const getX = (index: number) => {
    return padding.left + (index - startIndex) * xStep + xStep / 2;
  };

  const getIndexFromX = (xVal: number) => {
    if (xStep === 0) return startIndex;
    const rawVal = startIndex + (xVal - padding.left - xStep / 2) / xStep;
    return Math.round(rawVal);
  };

  const getY = (price: number) => {
    const range = priceLimits.max - priceLimits.min;
    if (range === 0) return height / 2;
    const ratio = (price - priceLimits.min) / range;
    return height - padding.bottom - ratio * (height - padding.top - padding.bottom);
  };

  // Synchronize D3 overlays for Order Blocks and Fair Value Gaps
  useEffect(() => {
    if (!d3ContainerRef.current) return;

    // Direct selection with d3
    const container = d3.select(d3ContainerRef.current);
    container.selectAll('*').remove();

    if (!highlightOrderBlocks) return;

    // Draw detected Fair Value Gaps (FVGs)
    const fvgGroup = container.append('g').attr('class', 'd3-fvg-overlays');
    
    fvgs.forEach((fvg) => {
      const startX = getX(fvg.index - 1);
      const endX = getX(fvg.index + 1);
      const blockWidth = endX - startX;
      
      const topY = getY(Math.max(fvg.gapStart, fvg.gapEnd));
      const bottomY = getY(Math.min(fvg.gapStart, fvg.gapEnd));
      const blockHeight = bottomY - topY;

      if (blockHeight <= 0 || blockWidth <= 0) return;

      const fillColor = fvg.type === 'BULLISH' ? '#10b981' : '#f43f5e';
      const strokeColor = fvg.type === 'BULLISH' ? '#34d399' : '#fda4af';

      // Draw SVG rect using D3 selection
      const rect = fvgGroup.append('rect')
        .attr('x', startX)
        .attr('y', topY)
        .attr('width', blockWidth)
        .attr('height', Math.max(2, blockHeight))
        .attr('fill', fillColor)
        .attr('fill-opacity', 0.18)
        .attr('stroke', strokeColor)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,2')
        .attr('rx', 3)
        .style('cursor', 'pointer')
        .style('pointer-events', 'auto');

      // Add a textual tag indicating institutional D3 detection
      const textGroup = fvgGroup.append('g')
        .style('pointer-events', 'none');

      // Little container pill for text
      textGroup.append('rect')
        .attr('x', startX + 4)
        .attr('y', topY + 4)
        .attr('width', 52)
        .attr('height', 10)
        .attr('fill', '#050515')
        .attr('fill-opacity', 0.85)
        .attr('stroke', strokeColor)
        .attr('stroke-opacity', 0.5)
        .attr('stroke-width', 0.5)
        .attr('rx', 2);

      textGroup.append('text')
        .attr('x', startX + 8)
        .attr('y', topY + 11)
        .attr('fill', strokeColor)
        .attr('font-size', '6px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
        .attr('font-weight', 'bold')
        .text(`D3 ${fvg.type === 'BULLISH' ? 'BULL' : 'BEAR'} FVG`);

      // Hover interaction effects with D3 transitions
      rect.on('mouseenter', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.35)
          .attr('stroke', fvg.type === 'BULLISH' ? '#05f29a' : '#ff4a68')
          .attr('stroke-width', 3);
      });

      rect.on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.18)
          .attr('stroke', strokeColor)
          .attr('stroke-width', 2);
      });
    });

    // Draw detected Order Blocks (OBs)
    const obGroup = container.append('g').attr('class', 'd3-ob-overlays');

    obs.forEach((ob) => {
      const obX = getX(ob.index);
      const blockWidth = xStep * 4; // draw forward block representing validity
      const topY = getY(ob.high);
      const bottomY = getY(ob.low);
      const blockHeight = bottomY - topY;

      if (blockHeight <= 0 || blockWidth <= 0) return;

      const fillColor = ob.type === 'BULLISH' ? '#6366f1' : '#a855f7';
      const strokeColor = ob.type === 'BULLISH' ? '#818cf8' : '#c084fc';

      const rect = obGroup.append('rect')
        .attr('x', obX)
        .attr('y', topY)
        .attr('width', blockWidth)
        .attr('height', Math.max(3, blockHeight))
        .attr('fill', fillColor)
        .attr('fill-opacity', 0.22)
        .attr('stroke', strokeColor)
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', ob.isBroken ? '3,3' : 'none')
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .style('pointer-events', 'auto');

      // Textual overlay for Order Block
      const labelGroup = obGroup.append('g')
        .style('pointer-events', 'none');

      labelGroup.append('rect')
        .attr('x', obX + 4)
        .attr('y', topY + 4)
        .attr('width', 58)
        .attr('height', 10)
        .attr('fill', '#050515')
        .attr('fill-opacity', 0.85)
        .attr('stroke', strokeColor)
        .attr('stroke-opacity', 0.5)
        .attr('stroke-width', 0.5)
        .attr('rx', 2);

      labelGroup.append('text')
        .attr('x', obX + 8)
        .attr('y', topY + 11)
        .attr('fill', strokeColor)
        .attr('font-size', '6px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
        .attr('font-weight', 'extrabold')
        .text(`D3 ${ob.type === 'BULLISH' ? 'BULL' : 'BEAR'} OB`);

      // Hover interactions for OBs
      rect.on('mouseenter', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.4)
          .attr('stroke', ob.type === 'BULLISH' ? '#10b981' : '#f43f5e')
          .attr('stroke-width', 3.5);
      });

      rect.on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill-opacity', 0.22)
          .attr('stroke', strokeColor)
          .attr('stroke-width', 2.5);
      });
    });

    // Draw Simulated Predictive Trend Path
    const lastVisibleCandleIdx = Math.min(endIndex, candles.length - 1);
    if (candles.length > 0 && startIndex <= endIndex && lastVisibleCandleIdx >= startIndex) {
      const lastCandle = candles[lastVisibleCandleIdx];
      const lastClose = lastCandle.close;
      const startX = getX(lastVisibleCandleIdx);
      const startY = getY(lastClose);

      // Determine simulated trend direction and label
      const trendDirection = metrics.trend; // 'BULLISH' | 'BEARISH' | 'NEUTRAL'
      const atr = metrics.atr || (lastClose * 0.005);
      
      let p1Y = startY;
      let p2Y = startY;
      let p3Y = startY;
      
      let color = '#a855f7'; // Neutral: purple/indigo
      let strokeGlow = 'rgba(168, 85, 247, 0.4)';
      let label = 'SYSTEM NEUTRAL: NO CLEAR DIRECTIONAL BIAS';

      if (trendDirection === 'BULLISH') {
        const targetPrice1 = lastClose + atr * 0.7;
        const targetPrice2 = lastClose + atr * 1.4;
        const targetPrice3 = lastClose + atr * 2.1;
        p1Y = getY(targetPrice1);
        p2Y = getY(targetPrice2);
        p3Y = getY(targetPrice3);
        color = '#10b981'; // green
        strokeGlow = 'rgba(16, 185, 129, 0.4)';
        label = '📈 FORECAST VECTOR: BULLISH TRAJECTORY';
      } else if (trendDirection === 'BEARISH') {
        const targetPrice1 = lastClose - atr * 0.7;
        const targetPrice2 = lastClose - atr * 1.4;
        const targetPrice3 = lastClose - atr * 2.1;
        p1Y = getY(targetPrice1);
        p2Y = getY(targetPrice2);
        p3Y = getY(targetPrice3);
        color = '#ef4444'; // red
        strokeGlow = 'rgba(239, 68, 68, 0.4)';
        label = '📉 FORECAST VECTOR: BEARISH TRAJECTORY';
      } else {
        // Sideways / Neutral / Range Consolidation
        const targetPrice1 = lastClose + atr * 0.2;
        const targetPrice2 = lastClose - atr * 0.3;
        const targetPrice3 = lastClose + atr * 0.1;
        p1Y = getY(targetPrice1);
        p2Y = getY(targetPrice2);
        p3Y = getY(targetPrice3);
        color = '#a855f7'; // Purple
        strokeGlow = 'rgba(168, 85, 247, 0.3)';
        label = '⚠️ SYSTEM RANGE: NO CLEAR TREND DETECTED';
      }

      // Draw the projection line
      const futureGroup = container.append('g').attr('class', 'd3-future-vector');

      const maxPlotX = width - padding.right;
      
      const p1X = Math.min(maxPlotX - 35, getX(lastVisibleCandleIdx + 1));
      const p2X = Math.min(maxPlotX - 15, getX(lastVisibleCandleIdx + 2));
      const p3X = Math.min(maxPlotX - 4, getX(lastVisibleCandleIdx + 3));

      const pathData: [number, number][] = [
        [startX, startY],
        [p1X, p1Y],
        [p2X, p2Y],
        [p3X, p3Y]
      ];

      // Define a custom arrow marker in <defs>
      const svgRoot = d3.select(d3ContainerRef.current.ownerSVGElement);
      let defs = svgRoot.select('defs');
      if (defs.empty()) {
        defs = svgRoot.append('defs');
      }
      
      // Clear existing predictive arrowheads
      defs.selectAll('.pred-arrow').remove();

      // Append arrow marker
      defs.append('marker')
        .attr('class', 'pred-arrow')
        .attr('id', 'predictive-arrowhead')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', '6')
        .attr('refY', '5')
        .attr('markerWidth', '5')
        .attr('markerHeight', '5')
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', color);

      // Draw neon path glow
      const curveGenerator = d3.line<[number, number]>().curve(d3.curveBasis);

      futureGroup.append('path')
        .attr('d', curveGenerator(pathData))
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 5)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.15)
        .style('filter', 'blur(2px)');

      // Draw animated dashed forecast line
      const dashedPath = futureGroup.append('path')
        .attr('d', curveGenerator(pathData))
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,3')
        .attr('marker-end', 'url(#predictive-arrowhead)');

      // Add simple animated dash effect
      let offsetCycle = 0;
      const animateDash = () => {
        offsetCycle = (offsetCycle - 1) % 32;
        dashedPath.style('stroke-dashoffset', offsetCycle.toString());
      };
      const intervalId = setInterval(animateDash, 60);

      // Draw prediction target pin (pulsing circle)
      const pin = futureGroup.append('g')
        .attr('transform', `translate(${p3X}, ${p3Y})`);

      pin.append('circle')
        .attr('r', 5)
        .attr('fill', color)
        .attr('opacity', 0.82);

      pin.append('circle')
        .attr('r', 12)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.5)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', '4;15;4')
        .attr('dur', '2s')
        .attr('repeatCount', 'indefinite');

      // Forecast HUD block overlay showing the forward signal
      const hudGroup = futureGroup.append('g')
        .attr('transform', `translate(${Math.max(padding.left + 5, p3X - 160)}, ${Math.max(padding.top + 5, p3Y - 26)})`);

      hudGroup.append('rect')
        .attr('width', 155)
        .attr('height', 16)
        .attr('fill', '#05050c')
        .attr('fill-opacity', 0.95)
        .attr('stroke', color)
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1)
        .attr('rx', 3);

      hudGroup.append('text')
        .attr('x', 77.5)
        .attr('y', 10.5)
        .attr('fill', color)
        .attr('font-size', '6.5px')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
        .attr('font-weight', 'extrabold')
        .attr('text-anchor', 'middle')
        .text(label);

      // Clean interval on unmount
      return () => {
        clearInterval(intervalId);
      };
    }

  }, [
    highlightOrderBlocks,
    fvgs,
    obs,
    width,
    height,
    startIndex,
    actualVisibleCount,
    xStep,
    priceLimits.min,
    priceLimits.max,
    metrics,
    candles.length,
    endIndex,
  ]);

  // Find swing highs and swing lows dynamically and calculate stop-loss density bins
  const liquidityHeatmap = useMemo(() => {
    if (candles.length === 0) return [];
    
    // 1. Identify swing highs and lows (using a window size of 3 on preceding/succeeding candles)
    const swings: { price: number; type: 'HIGH' | 'LOW'; weight: number }[] = [];
    const windowSize = 3;
    
    for (let i = windowSize; i < candles.length - windowSize; i++) {
       const cur = candles[i];
       const isHigh = candles.slice(i - windowSize, i + windowSize + 1).every((c, idx) => {
         if (idx === windowSize) return true;
         return cur.high >= c.high;
       });
       const isLow = candles.slice(i - windowSize, i + windowSize + 1).every((c, idx) => {
         if (idx === windowSize) return true;
         return cur.low <= c.low;
       });
       
       if (isHigh) {
         swings.push({ price: cur.high, type: 'HIGH', weight: cur.volume || 1000 });
       }
       if (isLow) {
         swings.push({ price: cur.low, type: 'LOW', weight: cur.volume || 1000 });
       }
    }

    // 2. Divide vertical limit space into 36 horizontal bins for heatmap matrix
    const numBins = 36;
    const minP = priceLimits.min;
    const maxP = priceLimits.max;
    const binSize = (maxP - minP) / numBins;
    if (binSize <= 0) return [];

    const bins = Array.from({ length: numBins }, (_, index) => {
      const priceMin = minP + index * binSize;
      const priceMax = priceMin + binSize;
      const priceMid = priceMin + binSize / 2;
      return {
        priceMin,
        priceMax,
        priceMid,
        shortLiquidity: 0, // Buy-side stop losses concentrated above highs
        longLiquidity: 0,  // Sell-side stop losses concentrated below lows
      };
    });

    // 3. Populate bin stop loss density
    const atr = metrics.atr || (symbol === 'BTC/USDT' ? 450 : symbol === 'USD/JPY' ? 0.35 : 0.0025);

    swings.forEach((swing) => {
      bins.forEach((bin) => {
        const dist = bin.priceMid - swing.price;
        
        if (swing.type === 'HIGH') {
          // Shorts place rest stops slightly ABOVE swing highs
          const peakOffset = 0.15 * atr; 
          const dispersion = atr * 0.7;
          const targetOffset = dist - peakOffset;
          const distFromPeak = Math.abs(targetOffset);
          
          if (dist > 0 && dist < atr * 1.4) {
            const intensity = Math.max(0, 1 - (distFromPeak / dispersion));
            bin.shortLiquidity += intensity * (swing.weight / 1000);
          }
        } else {
          // Longs place rest stops slightly BELOW swing lows
          const peakOffset = -0.15 * atr;
          const dispersion = atr * 0.7;
          const targetOffset = dist - peakOffset;
          const distFromPeak = Math.abs(targetOffset);
          
          if (dist < 0 && dist > -atr * 1.4) {
            const intensity = Math.max(0, 1 - (distFromPeak / dispersion));
            bin.longLiquidity += intensity * (swing.weight / 1000);
          }
        }
      });
    });

    // Normalize density weights
    const maxShort = Math.max(...bins.map(b => b.shortLiquidity)) || 1;
    const maxLong = Math.max(...bins.map(b => b.longLiquidity)) || 1;

    return bins.map(bin => ({
      ...bin,
      shortDensity: bin.shortLiquidity / maxShort,
      longDensity: bin.longLiquidity / maxLong,
    }));
  }, [candles, priceLimits, metrics.atr, symbol]);

  // Calculate specific spot densities for interactive cursor tooltips
  const getLiquidityDensityAtPrice = (price: number) => {
    if (liquidityHeatmap.length === 0) return { short: 0, long: 0, type: 'NONE' as const, density: 0 };
    
    let closestBin = liquidityHeatmap[0];
    let minDiff = Math.abs(closestBin.priceMid - price);
    
    for (let i = 1; i < liquidityHeatmap.length; i++) {
      const diff = Math.abs(liquidityHeatmap[i].priceMid - price);
      if (diff < minDiff) {
        minDiff = diff;
        closestBin = liquidityHeatmap[i];
      }
    }
    
    const densityVal = Math.max(closestBin.shortDensity, closestBin.longDensity);
    const liqType = closestBin.shortDensity > closestBin.longDensity ? ('BSL' as const) : ('SSL' as const);
    
    return {
      short: closestBin.shortDensity,
      long: closestBin.longDensity,
      type: densityVal > 0.1 ? liqType : ('NONE' as const),
      density: densityVal,
    };
  };

  // Convert index to grid time
  const formatIndexTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      const isD1 = selectedTimeframe === 'D1';
      const datePart = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
      if (isD1) return datePart;
      const hourPart = d.getUTCHours().toString().padStart(2, '0');
      const minutePart = d.getUTCMinutes().toString().padStart(2, '0');
      return `${datePart} ${hourPart}:${minutePart}`;
    } catch {
      return '';
    }
  };

  const timeframeIntervalMs = useMemo(() => {
    switch (selectedTimeframe) {
      case 'D1': return 24 * 60 * 60 * 1000;
      case 'H4': return 4 * 60 * 60 * 1000;
      case 'H1': return 1 * 60 * 60 * 1000;
      case 'M15': return 15 * 60 * 1000;
      default: return 4 * 60 * 60 * 1000;
    }
  }, [selectedTimeframe]);

  // Safely extrapolate future timestamps for forecast/shifted bars on the right-hand side of the chart
  const getIndexTimestampAndHour = (idx: number) => {
    if (idx < candles.length) {
      const c = candles[idx];
      const d = new Date(c.timestamp);
      return { timestamp: c.timestamp, hour: d.getUTCHours() };
    } else if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      // extrapolate based on active timeframe interval
      const timeDiff = (idx - (candles.length - 1)) * timeframeIntervalMs;
      const d = new Date(new Date(lastCandle.timestamp).getTime() + timeDiff);
      return { timestamp: d.toISOString(), hour: d.getUTCHours() };
    }
    return null;
  };

  // Adaptive, dynamic price grid lines that automatically adjust their granularity based on zoom level
  const priceGridData = useMemo(() => {
    const minVal = priceLimits.min;
    const maxVal = priceLimits.max;
    const range = maxVal - minVal;
    if (range <= 0) return { majorTicks: [], minorTicks: [] };

    // Determine target grid density based on horizontal zoom level (visibleCount)
    // Zoomed in (low visibleCount) -> higher density of grid lines for precision
    // Zoomed out (high visibleCount) -> lower density to prevent clutter
    let targetLines = 5;
    if (visibleCount <= 22) {
      targetLines = 8; // Zoomed in: high granularity
    } else if (visibleCount <= 45) {
      targetLines = 5; // Medium zoom
    } else {
      targetLines = 3; // Zoomed out: low granularity
    }

    // Rough step size
    const roughStep = range / targetLines;

    // Normalize roughStep to find the base-10 exponent
    const exponent = Math.floor(Math.log10(roughStep));
    const base10 = Math.pow(10, exponent);

    // Find the cleanest step multiplier: 1, 2, 2.5, 5, or 10
    const ratio = roughStep / base10;
    let cleanStepMultiplier = 1;
    if (ratio < 1.5) {
      cleanStepMultiplier = 1;
    } else if (ratio < 2.25) {
      cleanStepMultiplier = 2;
    } else if (ratio < 3.5) {
      cleanStepMultiplier = 2.5;
    } else if (ratio < 7.5) {
      cleanStepMultiplier = 5;
    } else {
      cleanStepMultiplier = 10;
    }

    const step = cleanStepMultiplier * base10;

    // Generate ticks aligned on step multiples
    const startTick = Math.ceil(minVal / step) * step;
    const majorTicks: number[] = [];
    for (let current = startTick; current <= maxVal; current += step) {
      majorTicks.push(current);
    }

    // Generate minor sub-ticks halfway between major ticks when zoomed in
    const minorTicks: number[] = [];
    if (visibleCount <= 30) {
      const minorStep = step / 2;
      const startMinor = Math.ceil(minVal / minorStep) * minorStep;
      for (let current = startMinor; current <= maxVal; current += minorStep) {
        // Exclude ticks that lie on or extremely close to major ticks
        const isCloseToMajor = majorTicks.some(major => Math.abs(current - major) < step * 0.1);
        if (!isCloseToMajor) {
          minorTicks.push(current);
        }
      }
    }

    return { majorTicks, minorTicks };
  }, [priceLimits, visibleCount]);

  const priceTicks = priceGridData.majorTicks;

  // Generate EMA & SMA SVG paths (only include visible paths or render with getX mapping)
  const emaPath = useMemo(() => {
    return candles
      .map((c, idx) => {
        if (!c.ema50) return '';
        const x = getX(idx);
        const y = getY(c.ema50);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [candles, startIndex, xStep, priceLimits, width, height]);

  const smaPath = useMemo(() => {
    return candles
      .map((c, idx) => {
        if (!c.sma200) return '';
        const x = getX(idx);
        const y = getY(c.sma200);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [candles, startIndex, xStep, priceLimits, width, height]);

  // Session overlays for global institutions (Asian, London Killzone, New York Open)
  const sessionsBlocks = useMemo(() => {
    if (!actualVisibleCount || !candles.length) return [];
    
    interface SessionBlock {
      startIdx: number;
      endIdx: number;
      session: 'ASIA' | 'LONDON' | 'NY';
      label: string;
      color: string;
      textColor: string;
    }

    const blocks: SessionBlock[] = [];
    let currentSession: 'ASIA' | 'LONDON' | 'NY' | null = null;
    let currentStart = startIndex;
    
    const endLimit = Math.min(candles.length, startIndex + actualVisibleCount);
    for (let idx = startIndex; idx < endLimit; idx++) {
      const details = getIndexTimestampAndHour(idx);
      if (!details) continue;
      const { hour } = details;
      
      let session: 'ASIA' | 'LONDON' | 'NY' = 'ASIA';
      if (hour >= 8 && hour < 14) {
        session = 'LONDON';
      } else if (hour >= 14 && hour < 22) {
        session = 'NY';
      } else {
        session = 'ASIA';
      }
      
      if (currentSession === null) {
        currentSession = session;
        currentStart = idx;
      } else if (currentSession !== session) {
        blocks.push({
          startIdx: currentStart,
          endIdx: idx - 1,
          session: currentSession,
          label: currentSession === 'LONDON' ? 'LONDON SECTOR' : currentSession === 'NY' ? 'US SESSION OPEN' : 'ASIA BREAKOUT RANGE',
          color: currentSession === 'LONDON' ? 'rgba(99, 102, 241, 0.04)' : currentSession === 'NY' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(20, 184, 166, 0.03)',
          textColor: currentSession === 'LONDON' ? '#818cf8' : currentSession === 'NY' ? '#fbbf24' : '#2dd4bf'
        });
        currentSession = session;
        currentStart = idx;
      }
    }
    
    if (currentSession !== null) {
      blocks.push({
        startIdx: currentStart,
        endIdx: endLimit - 1,
        session: currentSession,
        label: currentSession === 'LONDON' ? 'LONDON SECTOR' : currentSession === 'NY' ? 'US SESSION OPEN' : 'ASIA BREAKOUT RANGE',
        color: currentSession === 'LONDON' ? 'rgba(99, 102, 241, 0.04)' : currentSession === 'NY' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(20, 184, 166, 0.03)',
        textColor: currentSession === 'LONDON' ? '#818cf8' : currentSession === 'NY' ? '#fbbf24' : '#2dd4bf'
      });
    }
    
    return blocks;
  }, [startIndex, actualVisibleCount, candles, getIndexTimestampAndHour]);

  // Volume-Weighted Average Price (VWAP) with Standard Deviation bands
  const vwapData = useMemo(() => {
    let cumulativeVolumePrice = 0;
    let cumulativeVolume = 0;
    
    // First pass: compute the regular running VWAP
    const pointsRaw = candles.map((c, idx) => {
      const typicalPrice = (c.high + c.low + c.close) / 3;
      const vol = c.volume || 100;
      cumulativeVolumePrice += typicalPrice * vol;
      cumulativeVolume += vol;
      const vwap = cumulativeVolume > 0 ? (cumulativeVolumePrice / cumulativeVolume) : typicalPrice;
      return { index: idx, vwap, typicalPrice, volume: vol };
    });

    // Second pass: running variance calculation
    let cumulativeVolumeVariance = 0;
    const vwapPoints = pointsRaw.map((p, idx) => {
      const squaredDiff = Math.pow(p.typicalPrice - p.vwap, 2);
      cumulativeVolumeVariance += p.volume * squaredDiff;
      const vwapVariance = cumulativeVolume > 0 ? (cumulativeVolumeVariance / cumulativeVolume) : 0;
      const vwapStdDev = Math.sqrt(vwapVariance);
      
      const c = candles[idx];
      const minStdDev = (c.high - c.low) * 0.4 || (p.vwap * 0.0008);
      const stdDev = Math.max(vwapStdDev, minStdDev);
      
      const x = getX(idx);
      const yVwap = getY(p.vwap);
      const yUpper1 = getY(p.vwap + stdDev * 1.5);
      const yLower1 = getY(p.vwap - stdDev * 1.5);
      const yUpper2 = getY(p.vwap + stdDev * 3.0);
      const yLower2 = getY(p.vwap - stdDev * 3.0);

      return {
        idx,
        x,
        yVwap,
        yUpper1,
        yLower1,
        yUpper2,
        yLower2,
        vwap: p.vwap,
        upper1: p.vwap + stdDev * 1.5,
        lower1: p.vwap - stdDev * 1.5,
        upper2: p.vwap + stdDev * 3.0,
        lower2: p.vwap - stdDev * 3.0
      };
    });

    const pathVwap = vwapPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yVwap}`).join(' ');
    const pathUpper1 = vwapPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yUpper1}`).join(' ');
    const pathLower1 = vwapPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yLower1}`).join(' ');
    const pathUpper2 = vwapPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yUpper2}`).join(' ');
    const pathLower2 = vwapPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yLower2}`).join(' ');

    return {
      points: vwapPoints,
      pathVwap,
      pathUpper1,
      pathLower1,
      pathUpper2,
      pathLower2
    };
  }, [candles, startIndex, xStep, priceLimits, width, height]);

  // Prepare data for the secondary RSI area chart (Recharts)
  const rsiChartData = useMemo(() => {
    return candles.map((c, idx) => ({
      index: idx,
      rsi: c.rsi || 50,
      time: formatIndexTime(c.timestamp),
    }));
  }, [candles]);

  // Navigation handlers for zooming and panning HUD
  const zoomIn = () => {
    setVisibleCount(prev => Math.max(15, prev - 5));
  };

  const zoomOut = () => {
    setVisibleCount(prev => Math.min(candles.length || 40, prev + 5));
  };

  const resetZoom = () => {
    setVisibleCount(candles.length || 40);
    setOffset(0);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? -1 : 1;
    setVisibleCount((prev) => {
      const step = Math.max(1, Math.ceil(prev * 0.08));
      const next = prev + factor * step;
      return Math.min(Math.max(15, next), candles.length || 40);
    });
  };

  const getSnappedPriceAndIndex = (index: number, rawPrice: number) => {
    const boundedIndex = Math.max(0, Math.min(candles.length - 1, index));
    const candle = candles[boundedIndex];
    if (!candle) return { index: boundedIndex, price: rawPrice };

    if (isMagnetActive) {
      const candidates = [
        { label: 'Open', val: candle.open },
        { label: 'High', val: candle.high },
        { label: 'Low', val: candle.low },
        { label: 'Close', val: candle.close }
      ];
      let closestVal = rawPrice;
      let minDiff = Infinity;
      candidates.forEach(c => {
        const diff = Math.abs(c.val - rawPrice);
        if (diff < minDiff) {
          minDiff = diff;
          closestVal = c.val;
        }
      });
      return { index: boundedIndex, price: closestVal };
    }
    return { index: boundedIndex, price: rawPrice };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only process left click dragging

    if (isDrawingPriceAlert) {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      
      const clickedPrice = getPriceFromY(relativeY);
      const targetAlertPrice = parseFloat(clickedPrice.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5));
      const alertType = livePrice < targetAlertPrice ? 'CROSS_UP' : 'CROSS_DOWN';
      
      const newAlert: VisualPriceAlert = {
        id: 'vis-' + Date.now(),
        symbol: symbol,
        price: targetAlertPrice,
        isActive: true,
        isTriggered: false,
        type: alertType,
        createdAt: new Date().toLocaleTimeString()
      };
      
      setVisualPriceAlerts(prev => [...prev, newAlert]);
      setIsDrawingPriceAlert(false);
      setHoveredY(null);

      if (onLogEventToAdvisor) {
        onLogEventToAdvisor(`Set price alert for ${symbol} at ${targetAlertPrice}`, livePrice);
      }
      return;
    }

    if (isDrawingTrendline) {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      const clickIdx = getIndexFromX(relativeX);
      const clickedPrice = getPriceFromY(relativeY);
      const snapped = getSnappedPriceAndIndex(clickIdx, clickedPrice);

      if (!trendlineStartPoint) {
        setTrendlineStartPoint({ xIndex: snapped.index, price: snapped.price });
      } else {
        const finalPrice = parseFloat(snapped.price.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5));
        const finalIdx = snapped.index;

        const newTrend: ManualTrendline = {
          id: 'tl-' + Date.now(),
          symbol: symbol,
          startIdx: trendlineStartPoint.xIndex,
          startPrice: trendlineStartPoint.price,
          endIdx: finalIdx,
          endPrice: finalPrice,
          color: '#22c55e', // default emerald/green tone
          style: 'solid'
        };

        setManualTrendlines(prev => [...prev, newTrend]);
        setTrendlineStartPoint(null);
        setTrendlineHoverPoint(null);
        setIsDrawingTrendline(false);

        if (onLogEventToAdvisor) {
          onLogEventToAdvisor(`Drew manual trendline for ${symbol} from price ${trendlineStartPoint.price.toFixed(symbol === 'USD/JPY' ? 2 : 4)} to ${finalPrice.toFixed(symbol === 'USD/JPY' ? 2 : 4)}`, livePrice);
        }
      }
      return;
    }

    if (isDrawingAnnotation) {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      const clickIdx = getIndexFromX(relativeX);
      const clickedPrice = getPriceFromY(relativeY);

      setActiveInputAnnotation({
        xIndex: clickIdx,
        price: clickedPrice,
        x: relativeX,
        y: relativeY
      });

      setIsDrawingAnnotation(false);
      return;
    }

    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartOffset(offset);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    if (relativeY >= padding.top && relativeY <= height - padding.bottom &&
        relativeX >= padding.left && relativeX <= width - padding.right) {
      setCursorY(relativeY);
      setCursorPrice(getPriceFromY(relativeY));

      const hoverIdx = getIndexFromX(relativeX);
      if (hoverIdx >= 0 && hoverIdx < candles.length) {
        setCursorX(getX(hoverIdx));
        setCursorTime(candles[hoverIdx].timestamp);
      } else {
        setCursorX(null);
        setCursorTime(null);
      }
    } else {
      setCursorY(null);
      setCursorPrice(null);
      setCursorX(null);
      setCursorTime(null);
    }

    if (isDrawingPriceAlert) {
      if (relativeY >= padding.top && relativeY <= height - padding.bottom) {
        setHoveredY(relativeY);
      } else {
        setHoveredY(null);
      }
      return;
    }

    if (isDrawingTrendline) {
      if (relativeY >= padding.top && relativeY <= height - padding.bottom &&
          relativeX >= padding.left && relativeX <= width - padding.right) {
        const hoverIdx = getIndexFromX(relativeX);
        const hoverPrice = getPriceFromY(relativeY);
        const snapped = getSnappedPriceAndIndex(hoverIdx, hoverPrice);
        setTrendlineHoverPoint({ xIndex: snapped.index, price: snapped.price });
      } else {
        setTrendlineHoverPoint(null);
      }
      return;
    }

    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX;
    const candleShift = Math.round(deltaX / xStep);
    // Grab/pan backwards or forwards
    const nextOffset = dragStartOffset + candleShift;
    const maxOffset = Math.max(0, candles.length - actualVisibleCount);
    setOffset(Math.min(Math.max(0, nextOffset), maxOffset));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setCursorY(null);
    setCursorPrice(null);
    setCursorX(null);
    setCursorTime(null);
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStartX(touch.clientX);
      setDragStartOffset(offset);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartX;
    const candleShift = Math.round(deltaX / xStep);
    const nextOffset = dragStartOffset + candleShift;
    const maxOffset = Math.max(0, candles.length - actualVisibleCount);
    setOffset(Math.min(Math.max(0, nextOffset), maxOffset));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const activeLayersCount = [showFVG, showOB, showIndicators, showNewsOverlay, showLiquidityMap, showVolumeProfile, showTradeStatsOverlay, showCorrelationOverlay, showVWAP, showSessions, showOFI, showHistoricalExecutions].filter(Boolean).length;
  const isDrawingActive = isDrawingPriceAlert || isDrawingTrendline || isDrawingAnnotation || !showCrosshairTool || isMagnetActive;
  const activeAlertsCount = smartAlerts.filter(a => a.isActive).length;

  const isNativeFS = typeof document !== 'undefined' && !!document.fullscreenElement;
  const shouldUseFallbackAbsolute = isFullscreen && !isNativeFS;

  const chartMainContent = (
    <div 
      id="chart-container-root" 
      className={`bg-[#080808] border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative transition-all duration-300 select-none ${
        isFullscreen 
          ? 'fixed inset-0 z-[99999999] w-screen h-screen !max-w-none !max-h-none !rounded-none p-0 m-0 flex flex-col overflow-hidden bg-[#050505]' 
          : `z-[155] ${isAssetSelectorOpen || isTimeframeSelectorOpen || isLayersDropdownOpen || isDrawDropdownOpen ? 'overflow-visible' : 'overflow-hidden'}`
      }`}
      style={shouldUseFallbackAbsolute ? { 
        position: 'absolute', 
        top: `${scrollOffset}px`, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        zIndex: 999999999
      } : undefined}
      onTouchStart={handleWorkspaceTouchStart}
      onTouchEnd={handleWorkspaceTouchEnd}
    >
      {/* Floating Gesture Swipe HUD Indicator notification overlay */}
      <AnimatePresence>
        {swipeFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#0c0c11] border border-white/15 px-5 py-3 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] flex flex-col items-center justify-center space-y-2 pointer-events-none text-center"
          >
            <div className="flex items-center space-x-2">
              {swipeFlash.type === 'SYMBOL' ? (
                <div className="p-1.5 bg-amber-500/15 rounded-full border border-amber-500/25 text-amber-400">
                  <ArrowRightLeft className="w-3.5 h-3.5 animate-pulse" />
                </div>
              ) : (
                <div className="p-1.5 bg-indigo-500/15 rounded-full border border-indigo-500/25 text-indigo-400">
                  <Sliders className="w-3.5 h-3.5 animate-pulse" />
                </div>
              )}
              <span className="font-mono text-[8px] uppercase tracking-widest text-[#e3e3e3]/40">Horizontal Swipe</span>
            </div>
            <div className="text-[12px] font-sans font-black text-white leading-none tracking-tight">
              {swipeFlash.message}
            </div>
            <div className="text-[7.5px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-1.5 pt-0.5 border-t border-white/5 w-full justify-center">
              <span>Haptic feedback pulse triggered</span>
              <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consolidated Institutional Terminal Header */}
      {!isFullscreen && (
        <div id="chart-consolidated-header" className="relative z-[200] flex flex-col gap-3.5 px-3 py-2.5 md:px-6 md:py-3.5 border-b border-white/10 bg-[#0c0c0c] select-none rounded-t-lg">
        
        {/* ROW 1: Symbol Info & Instant Rates */}
        <div id="chart-header-row-1" className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full pointer-events-auto">
          {/* Left Hand Indicator: Pair and Info Stream */}
          <div className="flex items-center justify-center sm:justify-start space-x-3 w-full sm:w-auto text-center sm:text-left">
            {/* Overlapping Flags Representation - integrated cleanly */}
          {symbolEmoji.f1 && (
            <div className="relative w-8 h-8 items-center shrink-0 hidden sm:flex bg-white/[0.03] border border-white/5 rounded-full justify-center">
              <span className="text-[15px] absolute select-none drop-shadow-sm filter saturate-125">
                {symbolEmoji.f1}
              </span>
            </div>
          )}
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 font-sans leading-none">
              {/* Forward-extending Asset Selection Menu */}
              <div className="relative inline-block text-left" id="tv-pair-selector-dropdown-container">
                <button
                  id="tv-pair-heading-trigger"
                  type="button"
                  onClick={() => setIsAssetSelectorOpen(!isAssetSelectorOpen)}
                  className={`group font-mono font-black text-[13px] md:text-[14px] text-white tracking-tight flex items-center gap-2.5 bg-neutral-900/90 border border-white/10 hover:border-indigo-500/40 hover:bg-neutral-850 transition-all px-3 py-2 rounded-lg select-none cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${isAssetSelectorOpen ? 'ring-1 ring-indigo-500/30 border-indigo-500/30' : ''}`}
                >
                  <span className="flex items-center gap-1.5 shrink-0">
                    {(symbolEmoji.f1 || symbolEmoji.f2) && (
                      <span className="text-xs filter saturate-110 drop-shadow-sm select-none">{symbolEmoji.f1} {symbolEmoji.f2}</span>
                    )}
                    <span className="text-white hover:text-indigo-300 font-bold tracking-wider">{symbol}</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/40 group-hover:text-indigo-400 transition-transform duration-300 ${isAssetSelectorOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                </button>

                <AnimatePresence>
                  {isAssetSelectorOpen && (
                    <>
                      {/* Transparent global click-away backdrop */}
                      <div 
                        className="fixed inset-0 z-[490] bg-transparent"
                        onClick={() => setIsAssetSelectorOpen(false)}
                      />
                      
                      {/* Cascading Menu */}
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 mt-3 w-[34rem] max-w-[calc(100vw-24px)] z-[500] bg-[#0c0c0c] border border-white/15 rounded-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.95)] flex min-h-[250px] overflow-hidden"
                      >
                        {/* Categories panel (Left Column) */}
                        <div className="w-[165px] border-r border-white/10 bg-[#050505] p-2.5 shrink-0 flex flex-col space-y-1 select-none">
                          <div className="text-[8px] font-mono font-bold tracking-widest text-white/20 uppercase px-2.5 py-2 border-b border-white/5 mb-1.5 flex items-center gap-1.5">
                            <Server className="w-3 h-3 text-indigo-400/80" />
                            <span>Broker Groups</span>
                          </div>
                          
                          {ASSET_CLASSES.map((category) => {
                            const active = hoveredCategory === category.id;
                            return (
                              <button
                                key={category.id}
                                type="button"
                                onMouseEnter={() => setHoveredCategory(category.id)}
                                onClick={() => setHoveredCategory(category.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg font-mono text-[9.5px] font-bold uppercase transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                                  active
                                    ? 'bg-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500 pl-2'
                                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.02]'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                                    category.id === 'CURRENCIES' ? 'bg-sky-400' :
                                    category.id === 'INDICES' ? 'bg-purple-400' :
                                    category.id === 'METALS' ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`} />
                                  {category.id}
                                </span>
                                <ArrowRight className={`w-3 h-3 text-white/20 transition-transform duration-200 group-hover:translate-x-0.5 ${active ? 'opacity-100 text-indigo-400 scale-105' : 'opacity-40'}`} />
                              </button>
                            );
                          })}
                        </div>

                        {/* Sub-assets dynamic panel (Right Column) */}
                        <div className="flex-1 p-3.5 bg-[#090909] flex flex-col min-h-0 select-none">
                          {(() => {
                            const activeCat = ASSET_CLASSES.find(c => c.id === hoveredCategory) || ASSET_CLASSES[0];
                            return (
                              <>
                                {/* Header */}
                                <div className="border-b border-white/5 pb-2 mb-2 flex items-center justify-between shrink-0">
                                  <span className="text-[9.5px] uppercase font-mono font-extrabold tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <span>{activeCat.label}</span>
                                  </span>
                                  <span className="text-[8px] font-mono text-white/30 lowercase font-bold bg-white/[0.03] border border-white/5 py-0.5 px-1.5 rounded-full">
                                    {activeCat.assets.length} active assets
                                  </span>
                                </div>

                                {/* List Grid */}
                                <div className="grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar flex-1 pr-0.5 animate-fade-in-shorter">
                                  {activeCat.assets.map((sym) => {
                                    const selected = symbol === sym;
                                    const flags = FLAG_EMOJIS[sym] || { f1: '🌎', f2: '💵' };
                                    const friendly = FRIENDLY_NAMES[sym] || sym;
                                    
                                    // Mock dynamic institutional information
                                    const mockSpreads: Record<string, string> = {
                                      'EUR/USD': '0.1 pips', 'GBP/USD': '0.3 pips', 'USD/JPY': '0.2 pips', 'AUD/USD': '0.4 pips', 'EUR/GBP': '0.3 pips',
                                      'US30': '1.2 pts', 'NAS100': '0.8 pts', 'GER40': '1.0 pts', 'SPX500': '0.3 pts',
                                      'GOLD/USD': '12¢ spread', 'SILVER/USD': '0.8¢ spread',
                                      'BTC/USDT': '0.01% fee', 'ETH/USDT': '0.01% fee', 'SOL/USDT': '0.02% fee'
                                    };
                                    const mockSpread = mockSpreads[sym] || '0.1 pips';

                                    return (
                                      <button
                                        key={sym}
                                        type="button"
                                        onClick={() => {
                                          if (onSymbolChange) {
                                            onSymbolChange(sym);
                                          }
                                          setIsAssetSelectorOpen(false);
                                        }}
                                        className={`p-2 border rounded-xl text-left transition-all hover:bg-neutral-800/40 hover:border-white/10 flex flex-col justify-between h-[58px] cursor-pointer relative ${
                                          selected
                                            ? 'bg-indigo-600/10 border-indigo-500/40 text-white shadow-[0_4px_16px_rgba(99,102,241,0.08)]'
                                            : 'bg-white/[0.015] border-white/5 text-white/70 hover:text-white'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span className="text-[11px] font-mono font-bold tracking-tight uppercase flex items-center gap-1.5">
                                            {(flags.f1 || flags.f2) && (
                                              <span className="text-[13px] filter saturate-110 drop-shadow-sm select-none">{flags.f1} {flags.f2}</span>
                                            )}
                                            {sym}
                                          </span>
                                          {selected ? (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                                          ) : (
                                            <span className="text-[7px] font-mono text-white/20 group-hover:text-white/40">{mockSpread}</span>
                                          )}
                                        </div>
                                        
                                        <div className="text-[7.5px] font-sans text-white/30 truncate uppercase mt-1 leading-none font-medium">
                                          {friendly}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Custom Timeframe Selector Dropdown */}
              <div className="relative inline-block text-left" id="tv-timeframe-dropdown-container">
                <button
                  id="tv-timeframe-selector-trigger"
                  type="button"
                  onClick={() => setIsTimeframeSelectorOpen(!isTimeframeSelectorOpen)}
                  className={`group font-mono font-black text-[11px] md:text-[12px] text-white tracking-tight flex items-center gap-2 bg-neutral-900/90 border border-white/10 hover:border-indigo-500/40 hover:bg-neutral-850 transition-all px-2.5 py-1.5 rounded-lg select-none cursor-pointer h-7 md:h-8 shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${isTimeframeSelectorOpen ? 'ring-1 ring-indigo-500/30 border-indigo-500/30' : ''}`}
                  title="Select Chart Analysis Timeframe"
                >
                  <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-white hover:text-indigo-300 font-bold select-none uppercase">{selectedTimeframe}</span>
                  <ChevronDown className={`w-3 h-3 text-white/40 group-hover:text-indigo-400 transition-transform duration-300 ${isTimeframeSelectorOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                </button>

                <AnimatePresence>
                  {isTimeframeSelectorOpen && (
                    <>
                      {/* Transparent click-away backdrop */}
                      <div 
                        className="fixed inset-0 z-[490] bg-transparent"
                        onClick={() => setIsTimeframeSelectorOpen(false)}
                      />
                      
                      {/* Dropdown Menu */}
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 mt-2 w-44 z-[500] bg-[#0c0c0c] border border-white/15 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.95)] p-1.5 space-y-0.5 text-left"
                      >
                        <div className="text-[8px] font-mono font-bold tracking-widest text-white/20 uppercase px-2 py-1 select-none border-b border-white/5 mb-1 flex items-center gap-1.5">
                          <Clock className="w-2.5 h-2.5 text-indigo-400/80" />
                          <span>Resolutions</span>
                        </div>
                        {[
                          { id: 'M15', label: '15 Minutes', dicon: '15m' },
                          { id: 'H1', label: '1 Hour', dicon: '1h' },
                          { id: 'H4', label: '4 Hours', dicon: '4h' },
                          { id: 'D1', label: 'Daily (1D)', dicon: '1d' }
                        ].map((tf) => {
                          const selected = selectedTimeframe === tf.id;
                          return (
                            <button
                              key={tf.id}
                              type="button"
                              onClick={() => {
                                setSelectedTimeframe(tf.id as any);
                                setIsTimeframeSelectorOpen(false);
                                if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                                  navigator.vibrate(8);
                                }
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg font-mono text-[9.5px] font-bold uppercase transition-all duration-150 flex items-center justify-between cursor-pointer ${
                                selected
                                  ? 'bg-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500 pl-2'
                                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.02]'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${selected ? 'bg-indigo-400 shadow-[0_0_6px_#818cf8]' : 'bg-transparent border border-white/25'}`} />
                                {tf.label}
                              </span>
                              <span className="text-[7.5px] text-white/35 font-semibold bg-white/[0.03] border border-white/5 px-1 rounded">{tf.dicon}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              {/* OANDA FEED ON THE VERY TOP */}
              <div className="relative group cursor-help z-[210] hover:z-[280] font-mono">
                {isMt5Active ? (
                  <span className="flex items-center text-emerald-400 font-extrabold uppercase bg-[#071911] border border-emerald-500/50 hover:border-emerald-500/70 px-2 py-0.5 rounded text-[8.5px] tracking-wider transition-all h-5.5 select-none cursor-pointer">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1 animate-ping shrink-0" />
                    MT5 INSTITUTIONAL
                  </span>
                ) : (
                  <span className="text-indigo-300 hover:text-indigo-200 font-bold uppercase tracking-wider bg-[#0c0d1a] border border-indigo-500/55 hover:border-indigo-500/75 px-2 py-0.5 rounded text-[8.5px] transition-all flex items-center gap-1.5 h-5.5 select-none cursor-pointer duration-200">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-70"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400"></span>
                    </span>
                    <Server className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="uppercase font-bold text-[8.5px] tracking-wider text-indigo-200">Oanda Feed</span>
                  </span>
                )}
                
                {/* Hover Tooltip Details for Feed Provider - opens downwards because it is at the very top */}
                <div className="absolute top-full left-0 mt-2 p-3 bg-[#0a0a0c] border border-white/25 rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.95)] text-left leading-tight z-[250] w-[240px] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 text-[10px] font-mono">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                    <span className="text-white font-bold text-[9.5px] flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-indigo-400" /> Liquidity feed provider
                    </span>
                    <span className="text-white/40 text-[7px] uppercase tracking-wider">Gateway S9</span>
                  </div>
                  <div className="space-y-1.5 text-white/75 text-[9px]">
                    <div className="flex justify-between">
                      <span className="text-white/40">Feed Endpoint:</span>
                      <span className="font-semibold text-white">{isMt5Active ? 'MetaTrader 5 Bridge' : `${feedSource} API`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Gateway Security:</span>
                      <span className="text-emerald-400 font-bold font-mono">TLS 1.3 Secure</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Heartbeat SLA:</span>
                      <span className="text-white font-semibold">99.999% Guaranteed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Refresh Rate:</span>
                      <span className="text-white font-mono font-bold text-emerald-400 animate-pulse">Ticks under 15ms</span>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-1.5 mt-2 text-[8px] text-white/30">
                    High throughput premium connection feed.
                  </div>
                </div>
              </div>

              <span id="tv-pair-heading-dot" className="text-white/20 select-none hidden sm:inline-flex">•</span>
              <span className="text-[9.5px] text-white/50 font-mono tracking-tight font-semibold items-center bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded-md hidden sm:inline-flex">
                {pairName}
              </span>
            </div>
          </div>
        </div>

        {/* ROW 1 RIGHT SECTION */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 shrink-0 pointer-events-auto">
          <div className="flex items-center space-x-1.5 md:space-x-2 font-sans">
            {/* SELL BUTTON */}
            <div className="relative flex flex-col items-center">
              <div className={`px-2 py-1 md:px-3.5 md:py-1 bg-[#050505] border ${
                lastTickDir === 'DOWN' ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_12px_rgba(239,68,68,0.15)]' : 'border-rose-500/20'
              } rounded transition-all duration-150 w-[78px] md:w-[96px] text-center flex flex-col justify-center leading-none hover:border-rose-500/60 cursor-pointer`}>
                <div id="tv-sell-rate" className="text-rose-500 font-bold text-[11px] md:text-[13px] font-mono tracking-tight flex items-baseline justify-center">
                  <span>{formattedSell.substring(0, formattedSell.length - 1)}</span>
                  <span className="text-[8px] md:text-[10px] font-extrabold">{formattedSell.substring(formattedSell.length - 1)}</span>
                </div>
                <span className="text-[6.5px] md:text-[7.5px] uppercase tracking-wider font-bold text-rose-500/50 mt-0.5">SELL</span>
              </div>
            </div>

            {/* SPREAD INDICATOR */}
            <div className="flex flex-col items-center justify-center px-1 md:px-1.5 py-0.5 text-[9px] md:text-[10px] font-mono font-semibold text-white/45 border border-white/5 bg-[#050505] rounded min-w-[36px] md:min-w-[48px] h-[30px] md:h-[34px]">
              <span className="text-[6px] md:text-[7px] uppercase tracking-tighter text-white/30 font-sans block leading-none">Spread</span>
              <span id="tv-spread-val" className="text-[#999999] text-[9.5px] md:text-[10px] font-bold leading-none mt-0.5">{liveSpread.toFixed(1)}</span>
            </div>

            {/* BUY BUTTON */}
            <div className="relative flex flex-col items-center">
              <div className={`px-2 py-1 md:px-3.5 md:py-1 bg-[#050505] border ${
                lastTickDir === 'UP' ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_12px_rgba(14,165,233,0.15)]' : 'border-sky-500/20'
              } rounded transition-all duration-150 w-[78px] md:w-[96px] text-center flex flex-col justify-center leading-none hover:border-sky-500/60 cursor-pointer`}>
                <div id="tv-buy-rate" className="text-sky-500 font-bold text-[11px] md:text-[13px] font-mono tracking-tight flex items-baseline justify-center">
                  <span>{formattedBuy.substring(0, formattedBuy.length - 1)}</span>
                  <span className="text-[8px] md:text-[10px] font-extrabold">{formattedBuy.substring(formattedBuy.length - 1)}</span>
                </div>
                <span className="text-[6.5px] md:text-[7.5px] uppercase tracking-wider font-bold text-sky-500/50 mt-0.5">BUY</span>
              </div>
            </div>
          </div>

          {/* Live Feed Ticking rate metric */}
          <div className="hidden sm:flex bg-neutral-900/90 border border-white/10 rounded-lg px-3 py-1.5 items-center space-x-2.5 font-mono h-[38px] shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <span className="text-[9px] text-white/40 uppercase tracking-wider flex items-center leading-none font-bold">
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${lastTickDir === 'UP' ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-rose-400 shadow-[0_0_6px_#f43f5e]'}`} />
              Ticks
            </span>
            <span id="tv-ticks-live" className="text-[11px] font-mono text-emerald-400/95 font-black leading-none">
              {(ticksCount / 1000).toFixed(1)}K
            </span>
          </div>
        </div>
      </div>

      {/* ROW 2: Resolution selection & Overlay toggles dropdowns */}
      <div id="chart-header-row-2" className="flex flex-row items-center justify-between gap-3 w-full border-t border-white/[0.05] pt-3 pointer-events-auto flex-wrap">
        {/* Left Hand: Timeframe pills + stream badges */}
        <div className="flex flex-wrap items-center gap-3">


              {/* Stream & Confluence Metadata - Fitted on the second row next to the resolution pills */}
              <div className="hidden md:flex flex-wrap items-center gap-2.5">
                
                {/* 1. Live Price Action Badge with Interactive Hover Details */}
                <div className="relative group cursor-help z-[210] hover:z-[280]">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0f0f12] border border-white/15 hover:border-indigo-500/40 hover:bg-[#131317] transition-all text-[#e5e5e5]/80 h-5.5">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                    </span>
                    <span className="uppercase font-bold text-[8.5px] tracking-wider text-white/95">Live Price Action</span>
                    <span className="text-white/30 text-[8px] font-sans">|</span>
                    <span className={`text-[8.5px] font-extrabold flex items-center ${
                      (metrics?.trend || 'NEUTRAL') === 'BULLISH' ? 'text-emerald-400' : (metrics?.trend || 'NEUTRAL') === 'BEARISH' ? 'text-[#ff5555]' : 'text-amber-400'
                    }`}>
                      {(metrics?.trend || 'NEUTRAL') === 'BULLISH' ? 'BULLISH ↗' : (metrics?.trend || 'NEUTRAL') === 'BEARISH' ? 'BEARISH ↘' : 'RANGE ⇌'}
                    </span>
                  </span>
                  
                  {/* Hover Tooltip Details for Price Action */}
                  <div className="absolute top-full left-0 mt-2 p-3 bg-[#0a0a0c] border border-white/25 rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.95)] text-left leading-tight z-[250] w-[240px] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 text-[10px] font-mono">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                      <span className="text-white font-bold text-[9.5px] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Live Market Feed
                      </span>
                      <span className="text-emerald-400 text-[8px] font-bold uppercase tracking-widest bg-emerald-500/10 px-1 py-0.5 rounded">Active</span>
                    </div>
                    <div className="space-y-1.5 text-white/75">
                      <div className="flex justify-between">
                        <span className="text-white/40">Active Symbol:</span>
                        <span className="font-bold text-white">{symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Resolution:</span>
                        <span className="font-semibold text-white">4-Hour (H4) stream</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">ATR Volatility:</span>
                        <span className="font-bold text-white font-mono">{(metrics?.atr || 0).toFixed(symbol === 'USD/JPY' ? 3 : symbol === 'BTC/USDT' ? 1 : 5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">Heartbeat State:</span>
                        <span className="text-emerald-400 font-semibold">Healthy & Streaming</span>
                      </div>
                    </div>
                    <div className="border-t border-white/5 pt-1.5 mt-2 text-[8px] text-white/30 italic">
                      Updated live at millisecond interval rates.
                    </div>
                  </div>
                </div>

                {/* 2. HTF Confluence Badge with Technical Checklist */}
                <div className="relative group cursor-help z-[210] hover:z-[280]">
                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all text-[8.5px] font-bold uppercase tracking-wider h-5.5 duration-200 ${
                    (metrics?.dailyBias || 'BULLISH') === (metrics?.trend || 'NEUTRAL')
                      ? 'bg-[#071911] border-emerald-500/50 hover:border-emerald-500/70 text-emerald-400'
                      : 'bg-[#0c0d1a] border-indigo-500/55 hover:border-indigo-500/75 text-indigo-300'
                  }`}>
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${
                        (metrics?.dailyBias || 'BULLISH') === (metrics?.trend || 'NEUTRAL') ? 'bg-emerald-400' : 'bg-indigo-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        (metrics?.dailyBias || 'BULLISH') === (metrics?.trend || 'NEUTRAL') ? 'bg-emerald-400' : 'bg-indigo-400'
                      }`}></span>
                    </span>
                    <Zap className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="uppercase font-bold text-[8.5px] tracking-wider text-white/95">Confluence</span>
                    <span className="text-white/30 text-[8px] font-sans">|</span>
                    <span className="text-[8.5px] font-extrabold flex items-center">
                      {(metrics?.dailyBias || 'BULLISH') === 'BULLISH' && (metrics?.trend || 'NEUTRAL') === 'BULLISH' ? 'STRONG BUY ⚡' :
                       (metrics?.dailyBias || 'BULLISH') === 'BEARISH' && (metrics?.trend || 'NEUTRAL') === 'BEARISH' ? 'STRONG SELL ⚡' :
                       (metrics?.dailyBias || 'BULLISH') === 'BULLISH' ? 'BUY BIAS ↗' : 'SELL BIAS ↘'}
                    </span>
                  </span>
                  
                  {/* Hover Tooltip Details for HTF Confluence */}
                  <div className="absolute top-full left-0 mt-2 p-3 bg-[#0a0a0c] border border-white/25 rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.95)] text-left leading-tight z-[250] w-[240px] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 text-[10px] font-mono">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                      <span className="text-white font-bold text-[9.5px] flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-amber-400" /> HTF Confluence Audit
                      </span>
                      <span className="text-white/40 text-[7px] uppercase tracking-wider">Multi-Timeframe</span>
                    </div>
                    
                    {/* Confluence Checklist */}
                    <div className="space-y-1.5 text-white/75 uppercase text-[8.5px]">
                      <div className="flex items-center justify-between pb-1 border-b border-white/[0.03]">
                        <span className="text-white/40">Dual H4 Bias:</span>
                        <span className={`font-bold px-1 rounded text-[8px] ${
                          (metrics?.dailyBias || 'BULLISH') === 'BULLISH' ? 'text-emerald-400 bg-emerald-500/10' : 'text-[#ff5555] bg-[#ff5555]/10'
                        }`}>
                          {metrics?.dailyBias || 'BULLISH'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pb-1 border-b border-white/[0.03]">
                        <span className="text-white/40">Current 4H Trend:</span>
                        <span className={`font-bold px-1 rounded text-[8px] ${
                          (metrics?.trend || 'NEUTRAL') === 'BULLISH' ? 'text-emerald-400 bg-emerald-500/10' : (metrics?.trend || 'NEUTRAL') === 'BEARISH' ? 'text-[#ff5555] bg-[#ff5555]/10' : 'text-amber-400 bg-amber-500/10'
                        }`}>
                          {metrics?.trend || 'NEUTRAL'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pb-1 border-b border-white/[0.03]">
                        <span className="text-white/40">Momentum RSI:</span>
                        <span className={`font-bold ${
                          (metrics?.rsi || 50) > 70 ? 'text-[#ff5555]' : (metrics?.rsi || 50) < 30 ? 'text-emerald-400' : 'text-white'
                        }`}>
                          {(metrics?.rsi || 50).toFixed(1)} &middot; {(metrics?.rsi || 50) > 70 ? 'Overbought' : (metrics?.rsi || 50) < 30 ? 'Oversold' : 'Balanced'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40">Active Order Blocks:</span>
                        <span className="font-semibold text-white">{(obs || []).length > 0 ? `${(obs || []).length} Blocks` : 'None detected'}</span>
                      </div>
                    </div>
                    <div className="border-t border-white/5 pt-1.5 mt-2 flex items-center justify-between text-[8px]">
                      <span className="text-white/30">Alignment Confidence:</span>
                      <span className="text-indigo-400 font-bold font-mono">
                        {(metrics?.dailyBias || 'BULLISH') === (metrics?.trend || 'NEUTRAL') ? '92% Strong Alignment' : '65% Divergent Mode'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Institutional Bias Badge with interactive details */}
                <div className="relative group cursor-help z-[210] hover:z-[280] font-mono">
                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all text-[8.5px] font-bold uppercase tracking-wider h-5.5 duration-200 ${
                    metrics?.dailyBias === 'BULLISH'
                      ? 'bg-[#071911] border-emerald-500/50 hover:border-emerald-500/70 text-emerald-400'
                      : 'bg-[#1a0a0c] border-rose-500/50 hover:border-rose-500/70 text-rose-400'
                  }`}>
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${
                        metrics?.dailyBias === 'BULLISH' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        metrics?.dailyBias === 'BULLISH' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}></span>
                    </span>
                    <TrendingUp className={`w-3 h-3 shrink-0 ${metrics?.dailyBias === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`} />
                    <span className="uppercase font-bold text-[8.5px] tracking-wider text-white/95">Bias</span>
                    <span className="text-white/30 text-[8px] font-sans">|</span>
                    <span className="text-[8.5px] font-extrabold flex items-center">
                      {metrics?.dailyBias} (50 EMA)
                    </span>
                  </span>
                  
                  {/* Hover Tooltip Details for Trend Bias & Gauge & Alarm */}
                  <div className="absolute top-full left-0 mt-2 p-3 bg-[#0a0a0c] border border-white/25 rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.95)] text-left leading-tight z-[250] w-[270px] pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 text-[10px] font-mono">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                      <span className="text-white font-bold text-[9.5px] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Institutional Bias Audit
                      </span>
                      <span className="text-white/40 text-[7px] uppercase tracking-wider">50-Period EMA</span>
                    </div>
                    
                    <div className="space-y-2 text-white/75">
                      <div className="flex justify-between">
                        <span className="text-white/40 font-semibold uppercase text-[8px]">Direction:</span>
                        <span className={`font-black uppercase tracking-wider ${
                          metrics?.dailyBias === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {metrics?.dailyBias} (50 EMA)
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-white/40 font-semibold uppercase text-[8px]">EMA Gap:</span>
                        <span className="font-bold text-white font-mono">{trendIntensity.displayDistance}</span>
                      </div>

                      {/* Progress Bar / Gauge */}
                      <div className="flex flex-col space-y-1 bg-white/[0.02] border border-white/5 rounded p-1.5">
                        <div className="flex justify-between items-center text-[7.5px] text-white/50">
                          <span className="font-bold">MOMENTUM STRENGTH</span>
                          <span className="font-bold text-white">{trendIntensity.percent}% ({trendIntensity.label})</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              metrics?.dailyBias === 'BULLISH' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${trendIntensity.percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Audible Momentum Alarm Action */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                        <span className="text-white/40 font-semibold uppercase text-[8px]">Momentum Alarm:</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setIsAlarmEnabled(!isAlarmEnabled);
                          }}
                          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-all pointer-events-auto cursor-pointer ${
                            isAlarmEnabled
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 font-bold'
                              : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60'
                          }`}
                        >
                          {isAlarmEnabled ? <Volume2 className="w-2.5 h-2.5 text-amber-300 animate-pulse" /> : <VolumeX className="w-2.5 h-2.5 text-white/40" />}
                          <span className="text-[7.5px] font-bold uppercase tracking-wider">{isAlarmEnabled ? 'ACTIVE: ON' : 'OFF'}</span>
                        </button>
                      </div>

                      {/* Mean Reversion Signal Info (from original) */}
                      {trendIntensity.percent >= 70 && (
                        <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded text-[8.5px] text-amber-300 font-bold tracking-tight animate-pulse transition-all">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                          </span>
                          <span>OVEREXTENDED (MEAN REVERSION RISK)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

        {/* ROW 2 RIGHT SECTION: Multi-Layer Overlays & Draw utilities */}
        <div className="flex items-center justify-center sm:justify-end gap-2.5 sm:gap-3 pointer-events-auto shrink-0">
          
          {/* Consolidated LAYERS AND OVERLAYS Dropdown */}
          <div className="relative pointer-events-auto">
            <button
              id="dropdown-layers-trigger"
              onClick={(e) => {
                e.stopPropagation();
                setIsLayersDropdownOpen(!isLayersDropdownOpen);
                setIsDrawDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.07] transition-all text-[#e5e5e5]/80 h-5.5 outline-none select-none cursor-pointer duration-200 ${
                isLayersDropdownOpen ? 'border-indigo-500/40 bg-indigo-500/10' : ''
              }`}
              title="Toggle Chart Layers & Structural Overlays (OB, FVG, EMA, News, Liquidity, etc.)"
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                {activeLayersCount > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-70"></span>
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${activeLayersCount > 0 ? 'bg-indigo-400' : 'bg-white/25'}`}></span>
              </span>
              <Eye className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="uppercase font-bold text-[8.5px] tracking-wider text-white/95">Layers</span>
              <span className="text-white/30 text-[8px] font-sans">|</span>
              <span className={`text-[8.5px] font-extrabold flex items-center ${
                activeLayersCount > 0 ? 'text-indigo-400' : 'text-white/45'
              }`}>
                {activeLayersCount > 0 ? `${activeLayersCount} ACTIVE` : 'STANDARD'}
              </span>
              <ChevronDown className={`w-2.5 h-2.5 text-white/40 transition-transform duration-200 ${isLayersDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLayersDropdownOpen && (
              <div 
                id="dropdown-layers-menu"
                className="absolute right-0 mt-2 w-56 bg-[#0a0a0d] border border-white/20 rounded-md shadow-[0_12px_32px_rgba(0,0,0,0.95)] z-[500] p-1.5 space-y-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[8.5px] font-bold text-white/35 uppercase tracking-wider px-2 py-1 select-none border-b border-white/5 mb-1.5">
                  Visibility Layers
                </div>

                <button
                  onClick={() => setShowFVG(!showFVG)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${showFVG ? 'bg-indigo-400 shadow-[0_0_6px_#818cf8]' : 'bg-transparent border border-white/30'}`} />
                    Fair Value Gaps (FVG)
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${showFVG ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white/30'}`}>
                    {showFVG ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => setShowOB(!showOB)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${showOB ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-transparent border border-white/30'}`} />
                    Order Blocks (OB)
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${showOB ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/30'}`}>
                    {showOB ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => setShowIndicators(!showIndicators)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${showIndicators ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-transparent border border-white/30'}`} />
                    EMA/SMA Averages
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${showIndicators ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/30'}`}>
                    {showIndicators ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => setShowHistoricalExecutions(!showHistoricalExecutions)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                  title="Toggles historical trade entry/exit execution arrows on chart"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${showHistoricalExecutions ? 'bg-indigo-300 shadow-[0_0_6px_#a5b4fc]' : 'bg-transparent border border-white/30'}`} />
                    Trade Executions (Buy/Sell Arrows)
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${showHistoricalExecutions ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white/30'}`}>
                    {showHistoricalExecutions ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => setShowLiquidityMap(!showLiquidityMap)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${showLiquidityMap ? 'bg-yellow-400 shadow-[0_0_6px_#facc15]' : 'bg-transparent border border-white/30'}`} />
                    Liquidity Heatmap
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${showLiquidityMap ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/5 text-white/30'}`}>
                    {showLiquidityMap ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                <div id="btn-toggle-volume-profile" className="w-full flex flex-col p-1 rounded hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between w-full px-1 py-0.5">
                    <button
                      onClick={() => setShowVolumeProfile(!showVolumeProfile)}
                      className="flex items-center gap-2 text-[10px] font-sans text-left text-white/80"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${showVolumeProfile ? 'bg-indigo-300 shadow-[0_0_6px_#a5b4fc]' : 'bg-transparent border border-white/30'}`} />
                      Volume Profile
                    </button>
                    <button
                      onClick={() => setShowVolumeProfile(!showVolumeProfile)}
                      className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded cursor-pointer ${showVolumeProfile ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white/30'}`}
                    >
                      {showVolumeProfile ? 'ACTIVE' : 'OFF'}
                    </button>
                  </div>
                  {showVolumeProfile && (
                    <div className="flex items-center justify-between pt-1 pb-0.5 pl-3.5 pr-1 border-t border-white/[0.03] mt-1">
                      <span className="text-[8.5px] font-sans text-white/45">Axis Alignment:</span>
                      <div className="flex items-center border border-white/10 bg-black/50 rounded overflow-hidden">
                        <button
                          onClick={(e) => { e.stopPropagation(); setVolumeProfileSide('LEFT'); }}
                          className={`px-1.5 py-0.5 text-[8px] font-mono font-bold transition-all ${volumeProfileSide === 'LEFT' ? 'bg-indigo-600/20 text-indigo-300' : 'text-white/35 hover:text-white/60'}`}
                        >
                          Left
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setVolumeProfileSide('RIGHT'); }}
                          className={`px-1.5 py-0.5 text-[8px] font-mono font-bold transition-all border-l border-white/10 ${volumeProfileSide === 'RIGHT' ? 'bg-indigo-600/20 text-indigo-300' : 'text-white/35 hover:text-white/60'}`}
                        >
                          Right
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowOFI(!showOFI)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${showOFI ? 'bg-[#0284c7] shadow-[0_0_6px_#0284c7]' : 'bg-transparent border border-white/30'}`} />
                    Order Flow Imbalance (OFI)
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${showOFI ? 'bg-sky-500/20 text-sky-300' : 'bg-white/5 text-white/30'}`}>
                    {showOFI ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                {showOFI && (
                  <div className="mx-2 mb-2 p-2 rounded bg-black/40 border border-white/5 flex flex-col gap-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-[8px] font-mono text-white/40">
                      <span>FLOW INTENSITY HEATMAP</span>
                      <span className="text-sky-400 font-bold tracking-widest text-[6px] bg-sky-500/10 px-1 rounded animate-pulse">LIVE</span>
                    </div>
                    {/* Visual gradient scale */}
                    <div className="h-1.5 rounded bg-gradient-to-r from-[#0d9488] via-[#0284c7] to-[#ec4899] w-full opacity-80" />
                    <div className="flex justify-between items-center text-[7px] font-mono leading-none text-white/50 mb-1">
                      <span className="flex items-center gap-1">🛡️ Passive Limit Base</span>
                      <span className="flex items-center gap-1">⚡ HFT Sweep Edge</span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 pb-0.5 border-t border-white/[0.04] mt-0.5">
                      <span className="text-[8.5px] font-sans text-white/50">Imbalance Summary:</span>
                      <div className="flex items-center border border-white/10 bg-black/50 rounded overflow-hidden p-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOfiMode('HISTOGRAM'); }}
                          className={`px-1.5 py-0.5 text-[7.5px] font-mono font-bold transition-all rounded-sm ${ofiMode === 'HISTOGRAM' ? 'bg-[#0284c7]/20 text-sky-400 border border-[#0284c7]/30' : 'text-white/40 hover:text-white/70 border border-transparent'}`}
                          title="Histogram Mode: Delta value at each level"
                        >
                          Histogram
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOfiMode('PROFILE'); }}
                          className={`px-1.5 py-0.5 text-[7.5px] font-mono font-bold transition-all rounded-sm border-l border-white/10 ${ofiMode === 'PROFILE' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-white/40 hover:text-white/70 border border-transparent'}`}
                          title="Profile Mode: Cumulative volume profile shaped by delta"
                        >
                          Profile Mode
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowNewsOverlay(!showNewsOverlay)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${showNewsOverlay ? 'bg-rose-400 shadow-[0_0_6px_#f87171]' : 'bg-transparent border border-white/30'}`} />
                    Timeline News flags
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${showNewsOverlay ? 'bg-rose-500/20 text-rose-300' : 'bg-white/5 text-white/30'}`}>
                    {showNewsOverlay ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => setShowSessions(!showSessions)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${showSessions ? 'bg-teal-400 shadow-[0_0_6px_#2dd4bf]' : 'bg-transparent border border-white/30'}`} />
                    Institutional Sessions & Kill-Zones
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${showSessions ? 'bg-teal-500/20 text-teal-300' : 'bg-white/5 text-white/30'}`}>
                    {showSessions ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => setShowVWAP(!showVWAP)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${showVWAP ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-transparent border border-white/30'}`} />
                    Institutional VWAP & Bands
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${showVWAP ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/30'}`}>
                    {showVWAP ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => setShowTradeStatsOverlay(!showTradeStatsOverlay)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                  id="btn-toggle-trade-stats-overlay"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${showTradeStatsOverlay ? 'bg-indigo-400 shadow-[0_0_6px_#818cf8]' : 'bg-transparent border border-white/30'}`} />
                    Trade Stats Overlay
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${showTradeStatsOverlay ? 'bg-indigo-500/10 text-indigo-300' : 'bg-white/5 text-white/30'}`}>
                    {showTradeStatsOverlay ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => setShowCorrelationOverlay(!showCorrelationOverlay)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                  id="btn-toggle-correlation-overlay"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span className={`w-1.5 h-1.5 rounded-full ${showCorrelationOverlay ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-transparent border border-white/30'}`} />
                    Correlation Overlay
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${showCorrelationOverlay ? 'bg-amber-500/10 text-amber-300' : 'bg-white/5 text-white/30'}`}>
                    {showCorrelationOverlay ? 'ON' : 'OFF'}
                  </span>
                </button>

                <div className="border-t border-white/5 my-1.5 pt-1.5" />

                <button
                  onClick={() => setIsOneClickActive(!isOneClickActive)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-white/85 font-semibold">
                    <Zap className={`w-3.5 h-3.5 ${isOneClickActive ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-white/40'}`} />
                    One-Click Executions
                  </span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${isOneClickActive ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/30'}`}>
                    {isOneClickActive ? 'ENABLED' : 'DISABLED'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Consolidated DRAWING AND UTILITIES Dropdown */}
          <div className="relative pointer-events-auto">
            <button
              id="dropdown-draw-trigger"
              onClick={(e) => {
                e.stopPropagation();
                setIsDrawDropdownOpen(!isDrawDropdownOpen);
                setIsLayersDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-emerald-500/35 hover:bg-white/[0.07] transition-all text-[#e5e5e5]/80 h-5.5 outline-none select-none cursor-pointer duration-200 ${
                isDrawDropdownOpen ? 'border-emerald-500/40 bg-emerald-500/10' : ''
              }`}
              title="Set price levels alerts, diagonal trendlines, guides snap modes"
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                {isDrawingActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70"></span>
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isDrawingActive ? 'bg-emerald-400' : 'bg-white/25'}`}></span>
              </span>
              <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="uppercase font-bold text-[8.5px] tracking-wider text-white/95">Draw</span>
              <span className="text-white/30 text-[8px] font-sans">|</span>
              <span className={`text-[8.5px] font-extrabold flex items-center ${
                isDrawingActive ? 'text-emerald-400' : 'text-white/45'
              }`}>
                {isDrawingPriceAlert ? 'ALERT LINE' : isDrawingTrendline ? 'TRENDLINE' : isDrawingAnnotation ? 'ANNOTATION' : isMagnetActive ? 'MAGNET ON' : !showCrosshairTool ? 'NO CROSS' : 'READY'}
              </span>
              <ChevronDown className={`w-2.5 h-2.5 text-white/40 transition-transform duration-200 ${isDrawDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDrawDropdownOpen && (
              <div 
                id="dropdown-draw-menu"
                className="absolute right-0 mt-2 w-56 bg-[#0a0a0d] border border-white/20 rounded-md shadow-[0_12px_32px_rgba(0,0,0,0.95)] z-[500] p-1.5 space-y-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[8.5px] font-bold text-white/35 uppercase tracking-wider px-2 py-1 select-none border-b border-white/5 mb-1.5">
                  Analysis Drawings
                </div>

                <button
                  onClick={() => {
                    setIsDrawingPriceAlert(!isDrawingPriceAlert);
                    if (!isDrawingPriceAlert) {
                      setIsAlertsOpen(true);
                    }
                    setIsDrawingTrendline(false);
                    setTrendlineStartPoint(null);
                    setIsDrawDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors ${
                    isDrawingPriceAlert ? 'bg-amber-500/15 text-amber-300' : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    Set Alert Line
                  </span>
                  {isDrawingPriceAlert && <span className="text-[8px] font-bold text-amber-400 animate-pulse">ACTIVE</span>}
                </button>

                <button
                  onClick={() => {
                    const nextState = !isDrawingTrendline;
                    setIsDrawingTrendline(nextState);
                    if (nextState) {
                      setIsDrawingPriceAlert(false);
                      setTrendlineStartPoint(null);
                      setTrendlineHoverPoint(null);
                      setIsAlertsOpen(true);
                    }
                    setIsDrawDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors ${
                    isDrawingTrendline ? 'bg-emerald-500/15 text-emerald-300' : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Draw Trendline
                  </span>
                  {isDrawingTrendline && <span className="text-[8px] font-bold text-emerald-400 animate-pulse">ACTIVE</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrawingAnnotation(!isDrawingAnnotation);
                    setIsDrawingPriceAlert(false);
                    setIsDrawingTrendline(false);
                    setTrendlineStartPoint(null);
                    setIsDrawDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors ${
                    isDrawingAnnotation ? 'bg-indigo-500/15 text-indigo-300' : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Type className="w-3.5 h-3.5 text-indigo-400" />
                    Place Text Annotation
                  </span>
                  {isDrawingAnnotation && <span className="text-[8px] font-bold text-indigo-400 animate-pulse">ACTIVE</span>}
                </button>

                <div className="text-[8.5px] font-bold text-white/35 uppercase tracking-wider px-2 py-1 select-none border-t border-white/5 my-1.5 pt-1.5">
                  Assists & Guides
                </div>

                <button
                  onClick={() => setShowCrosshairTool(!showCrosshairTool)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <Crosshair className="w-3.5 h-3.5 text-sky-450" />
                    Crosshair guideline
                  </span>
                  <span className={`text-[8.5px] font-mono px-1 py-0.5 rounded leading-none ${showCrosshairTool ? 'text-sky-300 bg-sky-500/10' : 'text-white/30'}`}>
                    {showCrosshairTool ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => setIsMagnetActive(!isMagnetActive)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-sans text-left transition-colors hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <Magnet className="w-3.5 h-3.5 text-indigo-400" />
                    Wick/Body Magnet
                  </span>
                  <span className={`text-[8.5px] font-mono px-1 py-0.5 rounded leading-none ${isMagnetActive ? 'text-indigo-300 bg-indigo-500/10' : 'text-white/30'}`}>
                    {isMagnetActive ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Smart Alerts Trigger Drawer Toggle Button */}
          <button
            id="toggle-smart-alerts"
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-amber-500/35 hover:bg-white/[0.07] transition-all text-[#e5e5e5]/80 h-5.5 outline-none select-none cursor-pointer duration-200 ${
              isAlertsOpen ? 'border-amber-500/40 bg-amber-500/10' : ''
            }`}
            title="Configure Proximity Alarms & Actionable Thresholds"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              {(isAlertsOpen || activeAlertsCount > 0) && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-70"></span>
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isAlertsOpen || activeAlertsCount > 0 ? 'bg-amber-400' : 'bg-white/25'}`}></span>
            </span>
            <Sliders className={`w-3 h-3 text-amber-400 shrink-0 ${isAlertsOpen ? 'animate-pulse' : ''}`} />
            <span className="uppercase font-bold text-[8.5px] tracking-wider text-white/95">Alerts</span>
            <span className="text-white/30 text-[8px] font-sans">|</span>
            <span className={`text-[8.5px] font-extrabold flex items-center ${
              isAlertsOpen || activeAlertsCount > 0 ? 'text-amber-400' : 'text-white/45'
            }`}>
              {isAlertsOpen ? 'DRAWER' : activeAlertsCount > 0 ? `${activeAlertsCount} ACTIVE` : 'OFF'}
            </span>
          </button>
        </div>
      </div>
    </div>
      )}

      {/* Main Candlestick Frame */}
      <div className={`relative select-none ${
        isFullscreen ? 'flex-1 min-h-0 flex flex-col p-0 mt-2' : 'p-4 md:p-6 pb-2 min-h-[380px]'
      }`}>


        {/* Responsive Candlestick Canvas SVG and DOM Price Ladder */}
        <div className={`relative ${
          isFullscreen 
            ? 'flex-1 flex flex-col min-h-0 w-full' 
            : 'grid grid-cols-1 lg:grid-cols-12 gap-5 h-auto'
        }`}>
          {/* Main Chart Column */}
          <div className={`relative flex flex-col ${
            isFullscreen 
              ? 'flex-1 min-h-0 w-full' 
              : 'col-span-12 lg:col-span-9 min-h-[380px]'
          }`}>
            <div 
              ref={containerRef}
              className={`w-full overflow-hidden rounded bg-[#050505]/50 border border-white/5 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] transition-all duration-300 ${
                isFullscreen 
                  ? 'flex-1 h-full bg-[#050505]' 
                  : isExpanded ? 'h-[550px]' : 'h-[360px]'
              }`}
              onWheel={handleWheel}
            >
              {/* Dynamic OHLCAV Info Strip and Fullscreen control within the chart HUD canvas */}
              <div className="absolute top-4 left-4 z-[115] flex items-center gap-2 max-w-[95%] overflow-x-auto no-scrollbar pointer-events-auto">
                {/* Fullscreen Analysis Box Symbol in the top left corner */}
                <button
                  id="btn-chart-canvas-fullscreen"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                    setIsAlertsOpen(false);
                    setIsAssetSelectorOpen(false);
                  }}
                  className="p-1.5 rounded bg-[#0a0a0c]/85 border border-white/10 hover:border-indigo-500/40 hover:bg-neutral-800 hover:text-white text-white/50 transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer flex items-center justify-center group shrink-0"
                  title={isFullscreen ? "Exit Fullscreen Analysis" : "Fullscreen Analysis"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-105" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 text-white/70 group-hover:scale-105" />
                  )}
                </button>
              </div>

          {/* Draw Mode Info Ribbon overlaying chart */}
          {isDrawingPriceAlert && (
            <div className="absolute top-4 left-1/2 -track-translate-x-1/2 -translate-x-1/2 z-[110] bg-amber-500 text-black font-sans text-[10px] font-black px-4 py-2 rounded-full shadow-2xl border border-amber-300 flex items-center space-x-2 animate-bounce select-none pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-[#050505] animate-ping" />
              <span className="uppercase tracking-wider">Left-click on the chart to lock an alert (ESC to cancel)</span>
            </div>
          )}

          {isDrawingAnnotation && (
            <div className="absolute top-4 left-1/2 -track-translate-x-1/2 -translate-x-1/2 z-[110] bg-indigo-600 text-white font-sans text-[10px] font-black px-4 py-2 rounded-full shadow-2xl border border-indigo-400 flex items-center space-x-2 animate-bounce select-none pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="uppercase tracking-wider">Left-click on chart to place a text note (ESC to cancel)</span>
            </div>
          )}

          {/* Asset Correlation Strengths Floating Widget */}
          {showCorrelationOverlay && (
            <div 
              id="chart-correlation-strengths-dashboard"
              className="absolute bottom-16 left-4 z-[95] bg-[#09090b]/95 border border-white/10 hover:border-indigo-500/30 rounded-xl p-3 shadow-2xl font-sans w-52 pointer-events-auto text-left select-none backdrop-blur-md transition-all duration-300"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[9px] font-mono font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0 select-none animate-pulse" />
                  Asset Correlations
                </span>
                <button 
                  onClick={() => setShowCorrelationOverlay(false)}
                  className="text-[12px] font-bold text-white/40 hover:text-white px-1 leading-none cursor-pointer transition-colors"
                  title="Hide Overlay"
                >
                  ×
                </button>
              </div>

              <div className="text-[8px] text-white/35 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                <span>Base Target:</span>
                <strong className="text-white font-black bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded">{symbol}</strong>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {getSymbolCorrelations(symbol as MarketSymbol).map((cor) => {
                  const isPositive = cor.coefficient >= 0;
                  const isStrong = Math.abs(cor.coefficient) >= 0.7;
                  const absPct = Math.round(Math.abs(cor.coefficient) * 100);

                  const badgeBg = isStrong
                    ? (isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_8px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-450 border-rose-500/25 shadow-[0_0_8px_rgba(244,63,94,0.1)]')
                    : (isPositive ? 'bg-emerald-500/5 text-emerald-300 border-emerald-500/15' : 'bg-rose-500/5 text-rose-300 border-rose-500/15');

                  const barBg = isStrong
                    ? (isPositive ? 'bg-emerald-500/40' : 'bg-rose-500/40')
                    : (isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20');

                  return (
                    <div 
                      key={cor.symbol} 
                      className="group/item flex flex-col p-1.5 rounded bg-white/[0.01] hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all text-[9.5px]"
                      title={cor.description}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-white/80 font-bold">{cor.symbol}</span>
                        <span className={`text-[8px] font-mono px-1 py-0.2 rounded border font-bold uppercase transition-transform group-hover/item:scale-105 ${badgeBg}`}>
                          {isPositive ? '+' : ''}{cor.coefficient.toFixed(2)}
                        </span>
                      </div>

                      {/* Small inline visual progress bar */}
                      <div className="w-full bg-white/[0.03] h-1 rounded overflow-hidden mt-1.5">
                        <div 
                          className={`h-full rounded-full transition-all ${barBg}`}
                          style={{ width: `${absPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Floating One-Click Template Configuration Panel */}
          {isOneClickActive && (
            <div 
              id="one-click-cockpit"
              className="absolute top-4 right-4 z-[99] bg-[#0c0c0e] border border-amber-500/60 p-3 rounded-lg shadow-2xl w-72 pointer-events-auto text-left select-none hover:border-amber-500/85 transition-all font-mono"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                <span className="text-amber-400 font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                  <Zap className="w-3.5 h-3.5 fill-amber-400" />
                  One-Click Cockpit
                </span>
                <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  oneClickStatus === 'EXECUTING...' ? 'bg-amber-500/20 text-amber-300 animate-pulse' :
                  oneClickStatus === 'SUCCESS!' ? 'bg-emerald-500/20 text-emerald-400' :
                  oneClickStatus === 'ERROR' ? 'bg-rose-500/20 text-[#f43f5e]' :
                  'bg-white/5 text-white/40'
                }`}>
                  {oneClickStatus || 'READY'}
                </span>
              </div>
              
              <div className="space-y-2 text-[10px]">
                <div>
                  <label className="text-[8.5px] text-white/40 uppercase font-black tracking-wider block mb-1">Risk Preset</label>
                  <select
                    value={selectedTemplateName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setSelectedTemplateName(name);
                      if (name !== 'Custom') {
                        const preset = DEFAULT_TEMPLATES.find(p => p.name === name);
                        if (preset) {
                          setOneClickLots(preset.size);
                          setOneClickRR(preset.rr);
                          setOneClickBuffer(preset.bufferPips);
                        }
                      }
                    }}
                    className="w-full bg-[#050505] text-[10px] text-white border border-white/10 rounded px-2 py-1 outline-none h-7 font-bold text-amber-300/90 cursor-pointer"
                  >
                    {DEFAULT_TEMPLATES.map(p => (
                      <option key={p.name} value={p.name}>{p.name} ({p.size} Lot, {p.rr}:1 RR)</option>
                    ))}
                    <option value="Custom">Custom Template Editor</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[8px] text-white/35 uppercase font-black tracking-wider block mb-0.5">Lotsize</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      max="10.0"
                      value={oneClickLots}
                      onChange={(e) => {
                        setSelectedTemplateName('Custom');
                        setOneClickLots(parseFloat(e.target.value) || 0.01);
                      }}
                      className="w-full bg-[#050505] text-[10.5px] text-white font-bold border border-white/10 rounded px-1.5 py-0.5 outline-none h-6 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-white/35 uppercase font-black tracking-wider block mb-0.5 font-bold">R:R Ratio</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="10.0"
                      value={oneClickRR}
                      onChange={(e) => {
                        setSelectedTemplateName('Custom');
                        setOneClickRR(parseFloat(e.target.value) || 1.0);
                      }}
                      className="w-full bg-[#050505] text-[10.5px] text-white font-bold border border-white/10 rounded px-1.5 py-0.5 outline-none h-6 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-white/35 uppercase font-black tracking-wider block mb-0.5">Buffer (pips)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.0"
                      max="10.0"
                      value={oneClickBuffer}
                      onChange={(e) => {
                        setSelectedTemplateName('Custom');
                        setOneClickBuffer(parseFloat(e.target.value) || 0.0);
                      }}
                      className="w-full bg-[#050505] text-[10.5px] text-white font-bold border border-white/10 rounded px-1.5 py-0.5 outline-none h-6 text-center"
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-1.5 mt-1 text-[8px] text-white/40 leading-normal font-sans">
                  <span className="text-amber-500 font-bold font-mono text-[8.5px] block mb-0.5 uppercase tracking-wider">⚡ QUICK INSTRUCTION</span>
                  Move mouse over any active <span className="text-emerald-400 font-semibold font-mono">FVG / OB</span> boundary overlay on the chart below to preview. Click inside the highlighted shape to execute an instant order structure.
                </div>
              </div>
            </div>
          )}

          {/* Floating Triggered Alert Banners */}
          <div className="absolute bottom-4 left-4 z-[120] space-y-2 pointer-events-auto max-w-[280px]">
            <AnimatePresence>
              {/* Render Standard crossing alerts */}
              {triggeredAlertBanners.slice(-2).map((banner) => (
                <motion.div 
                  key={banner.id}
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTriggeredAlertBanners(prev => prev.filter(b => b.id !== banner.id));
                  }}
                  title="Click to dismiss notification"
                  className="bg-[#0c0c0d] border border-amber-500/60 p-3 rounded-lg shadow-2xl flex items-start space-x-2.5 cursor-pointer select-none hover:bg-[#121215] hover:border-amber-400 active:scale-[0.98] transition-all duration-150"
                >
                  <div className="p-1 bg-amber-500/10 rounded text-amber-400 shrink-0 mt-0.5 animate-bounce">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 font-mono text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-black uppercase text-[10px] tracking-tight">{banner.symbol} Level Alert!</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setTriggeredAlertBanners(prev => prev.filter(b => b.id !== banner.id));
                        }}
                        className="text-white/40 hover:text-white font-bold ml-1 hover:bg-white/5 px-1.5 py-0.5 rounded text-[11px] leading-none transition-colors"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-white/70 mt-1 leading-normal font-sans text-[9.5px]">
                      Price crossed {banner.type === 'CROSS_UP' ? 'above' : 'below'} your target of <span className="text-amber-400 font-bold">{banner.price}</span>.
                    </p>
                    <span className="text-white/35 text-[8px] block mt-1">{banner.time}</span>
                  </div>
                </motion.div>
              ))}

              {/* Render Price-Action Persistent Toasts */}
              {persistentToasts.slice(-2).map((toast) => (
                <motion.div 
                  key={toast.id}
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPersistentToasts(prev => prev.filter(t => t.id !== toast.id));
                  }}
                  title="Click to dismiss persistent alert"
                  className={`p-3 rounded-lg shadow-2xl flex items-start space-x-2.5 cursor-pointer select-none active:scale-[0.98] transition-all duration-150 bg-[#0c0c0d] border ${
                    toast.type === 'success' 
                      ? 'border-emerald-500/50 hover:border-emerald-400 hover:bg-[#0c1410]' 
                      : 'border-amber-500/50 hover:border-amber-400 hover:bg-[#14120c]'
                  }`}
                >
                  <div className={`p-1 rounded shrink-0 mt-0.5 animate-pulse ${
                    toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {toast.type === 'success' ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 font-mono text-[10px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[7.5px] font-black uppercase tracking-wider px-1 py-0.2 rounded leading-none ${
                          toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {toast.badge}
                        </span>
                        <span className="text-white font-black uppercase text-[10px] tracking-tight">{toast.symbol}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPersistentToasts(prev => prev.filter(t => t.id !== toast.id));
                        }}
                        className="text-white/40 hover:text-white font-bold ml-1 hover:bg-white/5 px-1.5 py-0.5 rounded text-[11px] leading-none transition-colors animate-none"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-white/75 mt-1 leading-normal font-sans text-[9.5px]">
                      {toast.message}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[8px] text-white/35">
                      <span>Tactical Alert Triggered</span>
                      <span>{toast.timestamp}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className={`w-full h-full font-mono text-[9px] fill-white/20 stroke-white/20 select-none ${
              isDragging 
                ? 'cursor-grabbing' 
                : (showCrosshairTool || isDrawingAnnotation)
                  ? 'cursor-crosshair' 
                  : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <defs>
              <clipPath id="chart-plot-area">
                <rect
                  x={padding.left}
                  y={padding.top}
                  width={width - padding.left - padding.right}
                  height={height - padding.top - padding.bottom}
                />
              </clipPath>
              
              {/* Premium Magnet Snap Snapping Halo Filter & Gradients */}
              <filter id="anchor-magnet-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur1" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <radialGradient id="magnet-radial-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
                <stop offset="45%" stopColor="#4f46e5" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Grid Lines */}
            {/* Minor Dynamic Price Grid Lines (rendered with high transparency for deep fine-grained clarity) */}
            {priceGridData.minorTicks.map((tick, idx) => (
              <g key={`minor-grid-${idx}`}>
                <line
                  x1={padding.left}
                  y1={getY(tick)}
                  x2={width - padding.right}
                  y2={getY(tick)}
                  className="stroke-white/[0.015]"
                  strokeDasharray="2,4"
                />
                <text
                  x={width - padding.right + 8}
                  y={getY(tick) + 2.5}
                  className="fill-white/15 font-sans text-[7.5px] select-none"
                >
                  {tick.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 4)}
                </text>
              </g>
            ))}

            {/* Major Dynamic Price Grid Lines */}
            {priceGridData.majorTicks.map((tick, idx) => (
              <g key={`major-grid-${idx}`}>
                <line
                  x1={padding.left}
                  y1={getY(tick)}
                  x2={width - padding.right}
                  y2={getY(tick)}
                  className="stroke-white/[0.05]"
                  strokeDasharray="4,4"
                />
                <text
                  x={width - padding.right + 8}
                  y={getY(tick) + 3}
                  className="fill-white/40 font-medium font-sans text-[9px] select-none"
                >
                  {tick.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 4)}
                </text>
              </g>
            ))}

            {/* Time Grid Lines (extrapolated safely for shift/forecast bars) */}
            {(() => {
              const gridLines: React.JSX.Element[] = [];
              if (candles.length === 0) return null;

              // Adaptive grid step depending on zoom level to ensure visual clarity and prevent overlapping labels
              let gridStep = 8;
              if (actualVisibleCount <= 18) {
                gridStep = 2;
              } else if (actualVisibleCount <= 32) {
                gridStep = 4;
              } else if (actualVisibleCount <= 60) {
                gridStep = 8;
              } else if (actualVisibleCount <= 90) {
                gridStep = 15;
              } else {
                gridStep = 24;
              }

              // Grid aligns perfectly on multiples of gridStep indices
              const startGridIndex = Math.ceil(startIndex / gridStep) * gridStep;
              for (let idx = startGridIndex; idx <= endIndex; idx += gridStep) {
                const x = getX(idx);
                if (x < padding.left || x > width - padding.right) continue;

                const details = getIndexTimestampAndHour(idx);
                if (!details) continue;

                const { timestamp, hour } = details;
                let sessionName = 'Asian';
                let sessionColor = 'fill-[#38bdf8]'; // sky-400
                let lineStroke = 'rgba(56, 189, 248, 0.08)';
                if (hour >= 8 && hour < 14) {
                  sessionName = 'London';
                  sessionColor = 'fill-[#fbbf24]'; // amber-400
                  lineStroke = 'rgba(251, 191, 36, 0.08)';
                } else if (hour >= 14 && hour < 22) {
                  sessionName = 'New York';
                  sessionColor = 'fill-[#34d399]'; // emerald-400
                  lineStroke = 'rgba(52, 211, 153, 0.08)';
                }

                // Protect against clipping/overlapping on horizontal extremes, especially the right scale area (padding.right is 70px)
                const showText = x >= padding.left + 35 && x <= width - padding.right - 45;

                gridLines.push(
                  <g key={`time-grid-${idx}`}>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={height - padding.bottom}
                      stroke={lineStroke}
                      strokeWidth={1}
                      strokeDasharray="2,2"
                    />
                    {showText && (
                      <>
                        {/* Date and Hour tag - perfectly centered with textAnchor="middle" */}
                        <text
                          x={x}
                          y={height - padding.bottom + 12}
                          textAnchor="middle"
                          className="fill-white/40 font-mono text-[9px] select-none"
                        >
                          {formatIndexTime(timestamp)}
                        </text>
                        {/* Session Dot and Name - perfectly centered with textAnchor="middle" */}
                        <text
                          x={x}
                          y={height - padding.bottom + 23}
                          textAnchor="middle"
                          className={`font-sans font-bold text-[8.5px] uppercase tracking-wider select-none ${sessionColor}`}
                        >
                          ● {sessionName}
                        </text>
                      </>
                    )}
                  </g>
                );
              }
              return gridLines;
            })()}

            {/* Plot elements wrapped inside area clipping path */}
            <g clipPath="url(#chart-plot-area)">
              {/* D3 visual overlays group container */}
              <g ref={d3ContainerRef} id="d3-visual-overlays-layer" />

              {/* Sessions and Kill Zones Overlays */}
              {showSessions && sessionsBlocks.map((block, bIdx) => {
                const sX1 = getX(block.startIdx) - xStep / 2;
                const sX2 = getX(block.endIdx) + xStep / 2;
                const rectWidth = sX2 - sX1;
                const rectHeight = height - padding.top - padding.bottom;
                if (rectWidth <= 0) return null;

                return (
                  <g key={`session-block-${bIdx}`} className="pointer-events-none">
                    {/* Background fill overlay */}
                    <rect
                      x={sX1}
                      y={padding.top}
                      width={rectWidth}
                      height={rectHeight}
                      fill={block.color}
                    />
                    {/* Light dotted boundary marker */}
                    <line
                      x1={sX1}
                      y1={padding.top}
                      x2={sX1}
                      y2={height - padding.bottom}
                      stroke={block.textColor}
                      strokeWidth={0.8}
                      strokeDasharray="3,3"
                      opacity={0.35}
                    />
                    {/* Label text placed near the top */}
                    <text
                      x={sX1 + 5}
                      y={padding.top + 12}
                      className="font-mono text-[8px] font-bold tracking-wider"
                      fill={block.textColor}
                      opacity={0.55}
                    >
                      ● {block.label}
                    </text>
                  </g>
                );
              })}

              {/* Volume-Weighted Average Price (VWAP) & Bands */}
              {showVWAP && vwapData.pathVwap && (
                <g id="institutional-vwap-layer" className="pointer-events-none select-none">
                  {/* Inner Band 1.5 SD fill */}
                  {vwapData.points.length > 1 && (
                    <path
                      d={`${vwapData.pathUpper1} L ${[...vwapData.points].reverse().map(p => `${p.x} ${p.yLower1}`).join(' ')} Z`}
                      fill="rgba(99, 102, 241, 0.02)"
                      stroke="none"
                    />
                  )}
                  
                  {/* Outer Band 3.0 Standard Deviation (Institutional Liquidity Reversal Limit) */}
                  <path
                    d={vwapData.pathUpper2}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth={0.8}
                    strokeDasharray="4,6"
                    opacity={0.4}
                  />
                  <path
                    d={vwapData.pathLower2}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth={0.8}
                    strokeDasharray="4,6"
                    opacity={0.4}
                  />

                  {/* Mid Band 1.5 Standard Deviation */}
                  <path
                    d={vwapData.pathUpper1}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth={0.8}
                    strokeDasharray="2,4"
                    opacity={0.5}
                  />
                  <path
                    d={vwapData.pathLower1}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth={0.8}
                    strokeDasharray="2,4"
                    opacity={0.5}
                  />

                  {/* Main VWAP Line */}
                  <path
                    d={vwapData.pathVwap}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    opacity={0.85}
                  />

                  {/* Outer bands labels */}
                  {vwapData.points.length > 10 && (() => {
                    const lastPt = vwapData.points[vwapData.points.length - 1];
                    if (!lastPt || lastPt.x < padding.left || lastPt.x > width - padding.right) return null;
                    return (
                      <>
                        <text x={lastPt.x - 38} y={lastPt.yVwap - 4} className="fill-amber-400 font-bold font-mono text-[7px]" opacity={0.7}>
                          VWAP
                        </text>
                        <text x={lastPt.x - 48} y={lastPt.yUpper2 - 4} className="fill-indigo-400 font-bold font-mono text-[6.5px]" opacity={0.5}>
                          +3.0 SD BAND
                        </text>
                        <text x={lastPt.x - 48} y={lastPt.yLower2 + 8} className="fill-indigo-400 font-bold font-mono text-[6.5px]" opacity={0.5}>
                          -3.0 SD BAND
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}

              {/* Volume Profile Overlay (rendered as a background-midground histogram) */}
              {showVolumeProfile && volumeProfile && (
                <g id="volume-profile-layer" className="pointer-events-auto">
                  {volumeProfile.bins.map((bin) => {
                    const topY = getY(bin.maxPrice);
                    const bottomY = getY(bin.minPrice);
                    const rectHeight = Math.max(1, bottomY - topY - 0.5);

                    const maxProfileWidth = (width - padding.left - padding.right) * 0.22;
                    const totalBarWidth = (bin.volume / volumeProfile.maxVolume) * maxProfileWidth;
                    
                    const buyFraction = bin.volume > 0 ? bin.buyVolume / bin.volume : 0.5;
                    const buyWidth = totalBarWidth * buyFraction;
                    const sellWidth = totalBarWidth * (1 - buyFraction);

                    const isHovered = hoveredProfileBin?.index === bin.index;

                    const isRightSide = volumeProfileSide === 'RIGHT';

                    const buyX = isRightSide 
                      ? width - padding.right - buyWidth 
                      : padding.left;
                    
                    const sellX = isRightSide 
                      ? width - padding.right - totalBarWidth 
                      : padding.left + buyWidth;

                    const labelX = isRightSide
                      ? width - padding.right - totalBarWidth - 6
                      : padding.left + totalBarWidth + 6;

                    return (
                      <g 
                        key={`vp-bin-${bin.index}`} 
                        className="cursor-help"
                        onMouseEnter={() => setHoveredProfileBin(bin)}
                        onMouseLeave={() => setHoveredProfileBin(null)}
                      >
                        {/* Background row highlighting on hover */}
                        {isHovered && (
                          <rect
                            x={padding.left}
                            y={topY}
                            width={width - padding.left - padding.right}
                            height={Math.max(1, bottomY - topY)}
                            fill="rgba(99, 102, 241, 0.05)"
                            className="pointer-events-none"
                          />
                        )}

                        {/* Buy volume portion (vivid cyan-green, semi-transparent) */}
                        {buyWidth > 0 && (
                          <rect
                            x={buyX}
                            y={topY}
                            width={buyWidth}
                            height={rectHeight}
                            fill="#10b981"
                            opacity={isHovered ? 0.45 : 0.22}
                            style={{ transition: 'opacity 0.2s', mixBlendMode: 'screen' }}
                          />
                        )}

                        {/* Sell volume portion (vivid rose-red, semi-transparent) */}
                        {sellWidth > 0 && (
                          <rect
                            x={sellX}
                            y={topY}
                            width={sellWidth}
                            height={rectHeight}
                            fill="#ef4444"
                            opacity={isHovered ? 0.45 : 0.22}
                            style={{ transition: 'opacity 0.2s', mixBlendMode: 'screen' }}
                          />
                        )}

                        {/* Label indicators (HVN/LVN/POC) at the edge of the bar */}
                        {totalBarWidth > 12 && (bin.type === 'HVN' || bin.type === 'LVN') && (
                          <g transform={`translate(${labelX}, ${topY + (bottomY - topY) / 2 + 3})`}>
                            <text
                              textAnchor={isRightSide ? "end" : "start"}
                              className={`font-mono text-[7px] font-black tracking-wider uppercase select-none ${
                                bin.isPOC 
                                  ? 'fill-amber-400' 
                                  : bin.type === 'HVN' 
                                    ? 'fill-indigo-300' 
                                    : 'fill-rose-400/90'
                              }`}
                            >
                              {bin.isPOC ? 'POC' : bin.type}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Red POC / High-Volume Line */}
                  {volumeProfile.pocIndex !== -1 && (
                    (() => {
                      const pocBin = volumeProfile.bins[volumeProfile.pocIndex];
                      const yCenter = getY((pocBin.minPrice + pocBin.maxPrice) / 2);
                      return (
                        <g className="pointer-events-none">
                          <line
                            x1={padding.left}
                            y1={yCenter}
                            x2={width - padding.right}
                            y2={yCenter}
                            stroke="#f59e0b"
                            strokeWidth={1.2}
                            strokeDasharray="4,3"
                            opacity={0.75}
                          />
                          <g transform={`translate(${width - padding.right - 42}, ${yCenter - 6})`}>
                            <rect
                              width={36}
                              height={12}
                              rx={2}
                              fill="#f59e0b"
                            />
                            <text
                              x={18}
                              y={9}
                              textAnchor="middle"
                              className="fill-black font-mono text-[7.5px] font-black tracking-widest leading-none"
                            >
                              POC
                            </text>
                          </g>
                        </g>
                      );
                    })()
                  )}

                  {/* Floating tooltip overlay for hovered volume profile bin stats */}
                  {hoveredProfileBin && (
                    <g 
                      transform={`translate(${Math.max(padding.left + 15, width / 2 - 90)}, ${Math.min(height - padding.bottom - 65, Math.max(padding.top + 10, getY((hoveredProfileBin.minPrice + hoveredProfileBin.maxPrice) / 2) - 30))})`} 
                      className="pointer-events-none select-none"
                    >
                      <rect
                        width={185}
                        height={60}
                        rx={6}
                        fill="#0c0c0e"
                        stroke="rgba(99, 102, 241, 0.4)"
                        strokeWidth={1}
                        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.85))' }}
                      />
                      {/* Left border-like high-contrast highlight accent line */}
                      <rect
                        x={0.5}
                        y={0.5}
                        width={3}
                        height={59}
                        rx={1}
                        fill="#6366f1"
                      />
                      <text x={10} y={15} className="fill-white font-bold font-sans text-[8.5px] uppercase tracking-wide">
                        {hoveredProfileBin.isPOC 
                          ? '⭐ Point of Control (POC)' 
                          : hoveredProfileBin.type === 'HVN' 
                            ? '🔥 High Volume Node (HVN)' 
                            : hoveredProfileBin.type === 'LVN' 
                              ? '❄️ Low Volume Node (LVN)' 
                              : '📊 Profile Volume Node'}
                      </text>
                      <text x={10} y={28} className="fill-white/60 font-mono text-[8px]">
                        Price: {hoveredProfileBin.minPrice.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5)} - {hoveredProfileBin.maxPrice.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5)}
                      </text>
                      <text x={10} y={39} className="fill-white/65 font-mono text-[8px]">
                        Vol: {Math.round(hoveredProfileBin.volume).toLocaleString()} units
                      </text>
                      <text x={10} y={50} className="fill-emerald-400 font-mono text-[8px] font-bold">
                        BUY {Math.round(hoveredProfileBin.buyVolume).toLocaleString()} <tspan className="fill-white/20">|</tspan> <tspan className="fill-rose-400">SELL {Math.round(hoveredProfileBin.sellVolume).toLocaleString()}</tspan>
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* REAL-TIME ORDER FLOW IMBALANCE (OFI) LAYER */}
              {showOFI && orderFlowImbalanceData && (
                <g id="order-flow-imbalance-layer" className="pointer-events-auto">
                  {/* Dynamic Gradient Defs for each price bin representing 'Order Flow Intensity' heat-map values */}
                  <defs>
                    {orderFlowImbalanceData.bins.map((bin) => {
                      const gradientId = `ofi-intensity-grad-${bin.index}`;
                      const isBuying = bin.delta >= 0;
                      const ofiSide = volumeProfileSide === 'RIGHT' ? 'LEFT' : 'RIGHT';
                      const isRightSide = ofiSide === 'RIGHT';

                      // Direction matches physical base of the profile (passive/resting) to tip of profile (aggressive/momentum sweep)
                      const x1 = isRightSide ? "100%" : "0%";
                      const x2 = isRightSide ? "0%" : "100%";

                      // Base limit fills (Teal for Buy block absorption, Crimson for Sell block absorption)
                      const stopBase = isBuying ? "#0f766e" : "#881337";
                      // Mid-ground core prices
                      const stopMid = isBuying ? "#0284c7" : "#e11d48";
                      // High-Frequency Sweeps limit (Fuchsia / Vivid Orange representing aggression burst)
                      const stopTip = isBuying ? "#c084fc" : "#ea580c";

                      return (
                        <linearGradient key={gradientId} id={gradientId} x1={x1} y1="0%" x2={x2} y2="0%">
                          <stop offset="0%" stopColor={stopBase} />
                          <stop offset="45%" stopColor={stopMid} />
                          <stop offset="100%" stopColor={stopTip} />
                        </linearGradient>
                      );
                    })}
                  </defs>

                  {orderFlowImbalanceData.bins.map((bin) => {
                    const topY = getY(bin.maxPrice);
                    const bottomY = getY(bin.minPrice);
                    const rectHeight = Math.max(1, bottomY - topY - 0.5);

                    const maxOfiWidth = ofiMode === 'PROFILE'
                      ? (width - padding.left - padding.right) * 0.24
                      : (width - padding.left - padding.right) * 0.18;

                    // Compute dynamic barWidth based on active OFI view mode
                    const totalVolume = bin.buyVolume + bin.sellVolume;
                    const barWidth = ofiMode === 'PROFILE'
                      ? (totalVolume / (orderFlowImbalanceData.maxTotalVolume || 1)) * maxOfiWidth
                      : (Math.abs(bin.delta) / orderFlowImbalanceData.maxAbsDelta) * maxOfiWidth;

                    const isHovered = hoveredOfiBin?.index === bin.index;
                    const ofiSide = volumeProfileSide === 'RIGHT' ? 'LEFT' : 'RIGHT';
                    const isRightSide = ofiSide === 'RIGHT';

                    const rectX = isRightSide
                      ? width - padding.right - barWidth
                      : padding.left;

                    const edgeX = isRightSide
                      ? width - padding.right - barWidth
                      : padding.left + barWidth;

                    // Color palette according to institutional buying vs selling pressure
                    const isBuyingImbalance = bin.delta >= 0;
                    const barFill = `url(#ofi-intensity-grad-${bin.index})`;
                    const edgeStroke = isBuyingImbalance ? '#38bdf8' : '#fb7185';
                    const isHighImbalance = Math.abs(bin.imbalancePercent) >= 28;

                    return (
                      <g
                        key={`ofi-bin-${bin.index}`}
                        className="cursor-crosshair"
                        onMouseEnter={() => setHoveredOfiBin(bin)}
                        onMouseLeave={() => setHoveredOfiBin(null)}
                      >
                        {/* Background row highlight on hover */}
                        {isHovered && (
                          <rect
                            x={padding.left}
                            y={topY}
                            width={width - padding.left - padding.right}
                            height={Math.max(1, bottomY - topY)}
                            fill="rgba(14, 165, 233, 0.04)"
                            className="pointer-events-none"
                          />
                        )}

                        {/* Imbalance bar styled with cumulative/histogram width parameters */}
                        {barWidth > 0 && (
                          <rect
                            x={rectX}
                            y={topY}
                            width={barWidth}
                            height={rectHeight}
                            fill={barFill}
                            opacity={isHovered ? 0.75 : isHighImbalance ? 0.50 : 0.35}
                            style={{ transition: 'opacity 0.2s', mixBlendMode: 'screen' }}
                          />
                        )}

                        {/* Edge line highlighting footprint precision */}
                        {barWidth > 0 && (
                          <line
                            x1={edgeX}
                            y1={topY}
                            x2={edgeX}
                            y2={topY + rectHeight}
                            stroke={edgeStroke}
                            strokeWidth={isHighImbalance ? 1.2 : 0.6}
                            opacity={isHovered ? 0.9 : 0.55}
                            style={{ transition: 'opacity 0.2s' }}
                          />
                        )}

                        {/* Imbalance percentage / relative size labels inside or near the bar */}
                        {barWidth > 20 && rectHeight >= 7 && (
                          <text
                            x={isRightSide ? edgeX - 4 : edgeX + 4}
                            y={topY + rectHeight / 2 + 2.5}
                            textAnchor={isRightSide ? "end" : "start"}
                            className="font-mono text-[6.5px] font-bold tracking-tight select-none pointer-events-none"
                            fill={isBuyingImbalance ? '#7dd3fc' : '#fda4af'}
                            opacity={isHovered ? 1.0 : isHighImbalance ? 0.85 : 0.6}
                          >
                            {isHighImbalance ? '⚡' : ''}
                            {ofiMode === 'PROFILE' ? 'P:' : ''}
                            {isBuyingImbalance ? '+' : ''}{Math.round(bin.imbalancePercent)}%
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* High Imbalance Mitigation Lines (Support/Resistance Imbalance bands) */}
                  {orderFlowImbalanceData.bins.map((bin) => {
                    const isHighImbalance = Math.abs(bin.imbalancePercent) >= 33;
                    if (!isHighImbalance) return null;

                    const yCenter = getY((bin.minPrice + bin.maxPrice) / 2);
                    const isBuying = bin.delta >= 0;

                    return (
                      <g key={`ofi-mitigation-${bin.index}`} className="pointer-events-none select-none">
                        <line
                          x1={padding.left}
                          y1={yCenter}
                          x2={width - padding.right}
                          y2={yCenter}
                          stroke={isBuying ? '#0284c7' : '#f43f5e'}
                          strokeWidth={0.5}
                          strokeDasharray="2,5"
                          opacity={0.35}
                        />
                      </g>
                    );
                  })}

                   {/* Floating tooltip overlay for hovered OFI bin stats with complete intensity classification breakdowns */}
                  {hoveredOfiBin && (
                    <g
                      transform={`translate(${Math.max(padding.left + 15, width / 2 - 95)}, ${Math.min(height - padding.bottom - 118, Math.max(padding.top + 10, getY((hoveredOfiBin.minPrice + hoveredOfiBin.maxPrice) / 2) - 55))})`}
                      className="pointer-events-none select-none"
                    >
                      <rect
                        width={190}
                        height={112}
                        rx={6}
                        fill="#060608"
                        stroke={ofiMode === 'PROFILE' ? 'rgba(99, 102, 241, 0.45)' : 'rgba(14, 165, 233, 0.45)'}
                        strokeWidth={1}
                        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.85))' }}
                      />
                      {/* Left border-like high-contrast highlight accent line */}
                      <rect
                        x={0.5}
                        y={0.5}
                        width={3}
                        height={111}
                        rx={1}
                        fill={hoveredOfiBin.intensityRating === 'AGGRESSIVE_HFT' ? '#ec4899' : hoveredOfiBin.intensityRating === 'PASSIVE_INSTITUTIONAL' ? '#2dd4bf' : '#38bdf8'}
                      />
                      <text x={10} y={15} className="fill-white font-bold font-sans text-[8.5px] uppercase tracking-wide">
                        {ofiMode === 'PROFILE' 
                          ? (hoveredOfiBin.intensityRating === 'PASSIVE_INSTITUTIONAL' ? '📊 Cumulative Passive Block' : '📊 Cumulative Momentum Sweep')
                          : (hoveredOfiBin.intensityRating === 'AGGRESSIVE_HFT'
                            ? '⚡ High-Frequency Sweep'
                            : hoveredOfiBin.intensityRating === 'PASSIVE_INSTITUTIONAL'
                              ? '🛡️ Institutional passive depth'
                              : '⚖️ Balanced Order Flow')}
                      </text>
                      <text x={10} y={28} className="fill-white/60 font-mono text-[8px]">
                        Price: {hoveredOfiBin.minPrice.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5)} - {hoveredOfiBin.maxPrice.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5)}
                      </text>
                      <text x={10} y={39} className="fill-white/65 font-mono text-[8px]">
                        Delta: <tspan className={hoveredOfiBin.delta >= 0 ? "fill-sky-400 font-bold" : "fill-rose-400 font-bold"}>{hoveredOfiBin.delta >= 0 ? '+' : ''}{Math.round(hoveredOfiBin.delta).toLocaleString()} lots</tspan>
                      </text>
                      <text x={10} y={50} className="fill-white/50 font-mono text-[8px]">
                        Total Vol: <tspan className="fill-white font-black">{Math.round(hoveredOfiBin.buyVolume + hoveredOfiBin.sellVolume).toLocaleString()} lots</tspan> | <tspan className="fill-[#38bdf8]">{(hoveredOfiBin.buyVolume / (hoveredOfiBin.buyVolume + hoveredOfiBin.sellVolume || 1) * 100).toFixed(0)}% Ask</tspan>
                      </text>

                      {/* HFT Speed aggression slider indicator */}
                      <text x={10} y={69} className="fill-white/40 font-mono text-[7px] uppercase tracking-wider">HFT Aggressive sweep:</text>
                      <rect x={105} y={64} width={70} height={4} rx={1.5} fill="rgba(168, 85, 247, 0.15)" />
                      <rect x={105} y={64} width={70 * (hoveredOfiBin.hftIntensity / 100)} height={4} rx={1.5} fill="#ec4899" />
                      <text x={181} y={68} className="fill-pink-400 font-bold font-mono text-[7px]" textAnchor="end">{hoveredOfiBin.hftIntensity}%</text>

                      {/* Passive liquidity block absorption slider indicator */}
                      <text x={10} y={81} className="fill-white/40 font-mono text-[7px] uppercase tracking-wider">Passive block absorption:</text>
                      <rect x={105} y={76} width={70} height={4} rx={1.5} fill="rgba(45, 212, 191, 0.15)" />
                      <rect x={105} y={76} width={70 * (hoveredOfiBin.passiveIntensity / 100)} height={4} rx={1.5} fill="#2dd4bf" />
                      <text x={181} y={80} className="fill-teal-300 font-bold font-mono text-[7px]" textAnchor="end">{hoveredOfiBin.passiveIntensity}%</text>

                      <rect x={10} y={91} width={171} height={1} fill="rgba(255,255,255,0.08)" />

                      <text x={10} y={102} className={`font-mono text-[7px] font-black uppercase tracking-widest ${hoveredOfiBin.intensityRating === 'AGGRESSIVE_HFT' ? 'fill-pink-400' : hoveredOfiBin.intensityRating === 'PASSIVE_INSTITUTIONAL' ? 'fill-teal-400' : 'fill-white/40'}`}>
                        {ofiMode === 'PROFILE' ? `Zone Interest: ${hoveredOfiBin.intensityRating.replace('_', ' ')}` : `Footprint: ${hoveredOfiBin.intensityRating.replace('_', ' ')}`}
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* Liquidity Heatmap Grid Layers */}
              {showLiquidityMap && liquidityHeatmap.map((bin, bIdx) => {
                const topY = getY(bin.priceMax);
                const bottomY = getY(bin.priceMin);
                const rectHeight = Math.max(1, bottomY - topY);

                return (
                  <g key={`liq-heatmap-row-${bIdx}`}>
                    {/* Sell Stop Liquidity (SSL) below swings - Violet/Purple glow */}
                    {bin.longDensity > 0.08 && (
                      <rect
                        x={padding.left}
                        y={topY}
                        width={width - padding.left - padding.right}
                        height={rectHeight}
                        fill="#8b5cf6"
                        opacity={bin.longDensity * 0.16}
                        style={{ mixBlendMode: 'screen' }}
                      />
                    )}
                    {/* Buy Stop Liquidity (BSL) above swings - Amber/Yellow glow */}
                    {bin.shortDensity > 0.08 && (
                      <rect
                        x={padding.left}
                        y={topY}
                        width={width - padding.left - padding.right}
                        height={rectHeight}
                        fill="#fbbf24"
                        opacity={bin.shortDensity * 0.16}
                        style={{ mixBlendMode: 'screen' }}
                      />
                    )}
                  </g>
                );
              })}

              {/* FVG Highlight Areas (As overlays behind wicks) */}
              {showFVG && !highlightOrderBlocks &&
                fvgs.map((fvg, fIdx) => {
                  const startX = getX(fvg.index - 1);
                  const endX = getX(fvg.index + 1);
                  const blockWidth = endX - startX;
                  
                  const topY = getY(Math.max(fvg.gapStart, fvg.gapEnd));
                  const bottomY = getY(Math.min(fvg.gapStart, fvg.gapEnd));
                  const blockHeight = bottomY - topY;

                  const colorClass = fvg.type === 'BULLISH'
                    ? 'fill-emerald-500/10 stroke-emerald-500/20'
                    : 'fill-rose-500/10 stroke-rose-500/20';

                  const hoverClasses = isOneClickActive 
                    ? (fvg.type === 'BULLISH' 
                        ? 'cursor-pointer hover:fill-emerald-500/30 hover:stroke-emerald-500/50 transition-colors pointer-events-auto' 
                        : 'cursor-pointer hover:fill-rose-500/30 hover:stroke-rose-500/50 transition-colors pointer-events-auto')
                    : 'pointer-events-none';

                  return (
                    <g key={`fvg-${fIdx}`}>
                      <rect
                        x={startX}
                        y={topY}
                        width={blockWidth}
                        height={Math.max(2, blockHeight)}
                        className={`${colorClass} ${hoverClasses}`}
                        strokeWidth={1}
                        strokeDasharray={fvg.isMitigated ? '1,1' : 'none'}
                        onClick={(e) => {
                          if (isOneClickActive) {
                            e.stopPropagation();
                            handleOneClickExecute('FVG', fvg);
                          }
                        }}
                        onMouseDown={(e) => {
                          if (isOneClickActive) {
                            e.stopPropagation();
                          }
                        }}
                        onMouseEnter={() => {
                          if (isOneClickActive) {
                            setHoveredBlock({
                              type: 'FVG',
                              id: fvg.id,
                              gapStart: fvg.gapStart,
                              gapEnd: fvg.gapEnd,
                              blockType: fvg.type,
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          if (isOneClickActive) {
                            setHoveredBlock(null);
                          }
                        }}
                      />
                      {!fvg.isMitigated && (
                        <text
                          x={startX + 5}
                          y={topY + 12}
                          className={fvg.type === 'BULLISH' ? 'fill-emerald-400 font-semibold' : 'fill-rose-400 font-semibold'}
                          fontSize="7px"
                        >
                          4H {fvg.type} FVG
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Order Blocks Highlights */}
              {showOB && !highlightOrderBlocks &&
                obs.map((ob, oIdx) => {
                  const obX = getX(ob.index);
                  const blockWidth = xStep * 4; // draw forward block representing validity
                  const topY = getY(ob.high);
                  const bottomY = getY(ob.low);
                  const blockHeight = bottomY - topY;

                  const colorClass = ob.type === 'BULLISH'
                    ? 'fill-indigo-500/10 stroke-indigo-500/20'
                    : 'fill-purple-500/10 stroke-purple-500/20';

                  const hoverClasses = isOneClickActive 
                    ? (ob.type === 'BULLISH' 
                        ? 'cursor-pointer hover:fill-indigo-500/30 hover:stroke-indigo-500/50 transition-colors pointer-events-auto' 
                        : 'cursor-pointer hover:fill-purple-500/30 hover:stroke-purple-500/50 transition-colors pointer-events-auto')
                    : 'pointer-events-none';

                  return (
                    <g key={`ob-${ob.id}-${oIdx}`}>
                      <rect
                        x={obX}
                        y={topY}
                        width={blockWidth}
                        height={Math.max(2, blockHeight)}
                        className={`${colorClass} ${hoverClasses}`}
                        strokeWidth={1}
                        strokeDasharray={ob.isBroken ? '2,2' : 'none'}
                        onClick={(e) => {
                          if (isOneClickActive) {
                            e.stopPropagation();
                            handleOneClickExecute('OB', ob);
                          }
                        }}
                        onMouseDown={(e) => {
                          if (isOneClickActive) {
                            e.stopPropagation();
                          }
                        }}
                        onMouseEnter={() => {
                          if (isOneClickActive) {
                            setHoveredBlock({
                              type: 'OB',
                              id: ob.id,
                              high: ob.high,
                              low: ob.low,
                              blockType: ob.type,
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          if (isOneClickActive) {
                            setHoveredBlock(null);
                          }
                        }}
                      />
                      {!ob.isBroken && (
                        <text
                          x={obX + 4}
                          y={topY + 12}
                          className={ob.type === 'BULLISH' ? 'fill-indigo-400 font-bold' : 'fill-purple-400 font-bold'}
                          fontSize="7px"
                        >
                          +OB: Level Confirmation
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Liquidity Sweep Indicators */}
              {sweeps.slice(-3).map((sw, sIdx) => {
                const xValue = getX(sw.index);
                const yValue = getY(sw.level);
                return (
                  <g key={`sweep-${sIdx}`} className="stroke-none">
                    {sw.type === 'SELL_SIDE' ? (
                      <>
                        <circle cx={xValue} cy={yValue} r={4} className="fill-emerald-500/70" />
                        <line x1={xValue - 15} y1={yValue} x2={xValue + 15} y2={yValue} className="stroke-emerald-400" strokeWidth={1} />
                        <text x={xValue - 25} y={yValue + 14} className="fill-emerald-300 font-bold" fontSize="7px">
                          Sell Sweep (Discount)
                        </text>
                      </>
                    ) : (
                      <>
                        <circle cx={xValue} cy={yValue} r={4} className="fill-rose-500/70" />
                        <line x1={xValue - 15} y1={yValue} x2={xValue + 15} y2={yValue} className="stroke-rose-400" strokeWidth={1} />
                        <text x={xValue - 25} y={yValue - 8} className="fill-rose-300 font-bold" fontSize="7px">
                          Buy Sweep (Premium)
                        </text>
                      </>
                    )}
                  </g>
                );
              })}

              {/* Draw Candlesticks */}
              {candles.map((candle, idx) => {
                const x = getX(idx);
                const highY = getY(candle.high);
                const lowY = getY(candle.low);
                const openY = getY(candle.open);
                const closeY = getY(candle.close);

                const isGreen = candle.close >= candle.open;
                const colorClass = isGreen
                  ? 'stroke-emerald-500/80 fill-emerald-500/80 shadow-emerald-500/20'
                  : 'stroke-rose-500/80 fill-rose-500/80 shadow-rose-500/20';

                const bodyWidth = Math.max(2, xStep * 0.62);

                return (
                  <g
                    key={`candle-${idx}`}
                    onMouseEnter={() => setHoveredCandle(candle)}
                    onMouseLeave={() => setHoveredCandle(null)}
                    className="cursor-crosshair pointer-events-auto"
                  >
                    {/* Wick (vertical line) */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      className={isGreen ? 'stroke-emerald-500/60' : 'stroke-rose-500/60'}
                      strokeWidth={1.2}
                    />
                    {/* Body (rectangle) */}
                    <rect
                      x={x - bodyWidth / 2}
                      y={Math.min(openY, closeY)}
                      width={bodyWidth}
                      height={Math.max(1.5, Math.abs(openY - closeY))}
                      className={`${colorClass}`}
                      strokeWidth={0.5}
                      rx={1}
                    />

                    {/* Invisible broad pillar for precise mouse hover detection */}
                    <rect
                      x={x - xStep / 2}
                      y={padding.top}
                      width={xStep}
                      height={height - padding.top - padding.bottom}
                      className="fill-transparent stroke-none cursor-crosshair opacity-0"
                    />
                  </g>
                );
              })}

              {/* Historical Trade Execution Indicator Layer */}
              {showHistoricalExecutions && tradesWithCandles.map((item, idx) => {
                const { trade, candleIndex } = item;
                if (candleIndex < startIndex || candleIndex > endIndex) return null;

                const x = getX(candleIndex);
                if (x < padding.left || x > width - padding.right) return null;

                const y = getY(trade.entryPrice);
                const isBuy = trade.side === 'BUY';
                
                // Colors match institutional themes: green for Buy, red for Sell
                const arrowColor = isBuy ? '#10b981' : '#f43f5e';
                const arrowGlowClass = isBuy 
                  ? 'drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]' 
                  : 'drop-shadow-[0_0_6px_rgba(244,63,94,0.7)]';

                // Upward arrow for BUY: apex at (x, y), extends downwards
                // Downward arrow for SELL: apex at (x, y), extends upwards
                const arrowPath = isBuy
                  ? `M ${x} ${y} L ${x - 5} ${y + 9} L ${x - 2} ${y + 9} L ${x - 2} ${y + 16} L ${x + 2} ${y + 16} L ${x + 2} ${y + 9} L ${x + 5} ${y + 9} Z`
                  : `M ${x} ${y} L ${x - 5} ${y - 9} L ${x - 2} ${y - 9} L ${x - 2} ${y - 16} L ${x + 2} ${y - 16} L ${x + 2} ${y - 9} L ${x + 5} ${y - 9} Z`;

                const labelY = isBuy ? y + 25 : y - 22;

                return (
                  <g 
                    key={`chart-trade-${trade.id}-${idx}`} 
                    className="select-none font-sans cursor-pointer pointer-events-auto transition-all"
                    onMouseEnter={(e) => {
                      const svgElement = e.currentTarget.ownerSVGElement;
                      const svgRect = svgElement?.getBoundingClientRect();
                      const clientX = e.clientX;
                      const clientY = e.clientY;
                      const relativeX = svgRect ? (clientX - svgRect.left) : x;
                      const relativeY = svgRect ? (clientY - svgRect.top) : y;

                      setHoveredTrade({
                        trade,
                        x: relativeX,
                        y: relativeY,
                      });
                    }}
                    onMouseLeave={() => setHoveredTrade(null)}
                  >
                    {/* Glowing highlight anchor circle at entry point */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={4.5} 
                      fill="transparent" 
                      stroke={arrowColor} 
                      strokeWidth={1}
                      className="animate-pulse"
                    />

                    {/* Small inner solid point */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={1.8} 
                      fill={arrowColor} 
                    />

                    {/* Highly stylized arrow */}
                    <path
                      d={arrowPath}
                      fill={arrowColor}
                      stroke={isBuy ? '#059669' : '#dc2626'}
                      strokeWidth={0.8}
                      className={arrowGlowClass}
                    />

                    {/* Text Annotation label of execution under/above arrow */}
                    <rect
                      x={x - 20}
                      y={labelY - 5}
                      width={40}
                      height={9.5}
                      rx={1.5}
                      fill="#0d0d11"
                      stroke={arrowColor}
                      strokeWidth={0.4}
                      opacity={0.85}
                    />
                    <text
                      x={x}
                      y={labelY + 2.5}
                      fill={arrowColor}
                      fontSize="6.5px"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono tracking-tighter"
                    >
                      {trade.side} {trade.size}
                    </text>
                  </g>
                );
              })}

              {/* Indicator Lines (EMA and SMA paths overlay) */}
              {showIndicators && (
                <>
                  <path
                    d={emaPath}
                    fill="none"
                    className="stroke-amber-400"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                  <path
                    d={smaPath}
                    fill="none"
                    className="stroke-indigo-400"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </>
              )}
            </g>

            {/* Active Open Positions Overlay (With clickable on-chart close button) */}
            {activeSymbolTrades.map((trade) => {
              const yEntry = getY(trade.entryPrice);
              const ySL = getY(trade.stopLoss);
              const yTP = getY(trade.takeProfit);

              // Render elements if they are within visible chart limits
              const minVal = padding.top;
              const maxVal = height - padding.bottom;

              const isEntryVisible = yEntry >= minVal && yEntry <= maxVal;
              const isSLVisible = ySL >= minVal && ySL <= maxVal;
              const isTPVisible = yTP >= minVal && yTP <= maxVal;

              const displayFormat = symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5;

              return (
                <g key={`trade-overlay-${trade.id}`} className="font-sans select-none">
                  {/* SL Level Line & Badge */}
                  {isSLVisible && (
                    <g>
                      <line
                        x1={padding.left}
                        y1={ySL}
                        x2={width - padding.right}
                        y2={ySL}
                        stroke="#ef4444"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                        className="opacity-70"
                      />
                      <rect
                        x={width - padding.right - 92}
                        y={ySL - 7}
                        width={88}
                        height={14}
                        rx={2}
                        fill="#b91c1c"
                        className="opacity-90"
                      />
                      <text
                        x={width - padding.right - 48}
                        y={ySL + 3}
                        fill="#ffffff"
                        fontSize="8px"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        SL @ {trade.stopLoss.toFixed(displayFormat)}
                      </text>
                    </g>
                  )}

                  {/* TP Level Line & Badge */}
                  {isTPVisible && (
                    <g>
                      <line
                        x1={padding.left}
                        y1={yTP}
                        x2={width - padding.right}
                        y2={yTP}
                        stroke="#10b981"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                        className="opacity-70"
                      />
                      <rect
                        x={width - padding.right - 92}
                        y={yTP - 7}
                        width={88}
                        height={14}
                        rx={2}
                        fill="#047857"
                        className="opacity-90"
                      />
                      <text
                        x={width - padding.right - 48}
                        y={yTP + 3}
                        fill="#ffffff"
                        fontSize="8px"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        TP @ {trade.takeProfit.toFixed(displayFormat)}
                      </text>
                    </g>
                  )}

                  {/* Entry Price Line & Badge + Clickable Close Button */}
                  {isEntryVisible && (
                    <g>
                      <line
                        x1={padding.left}
                        y1={yEntry}
                        x2={width - padding.right}
                        y2={yEntry}
                        stroke="#06b6d4"
                        strokeWidth={1.5}
                        strokeDasharray="2,2"
                      />
                      
                      {/* Entry details container (Left of the line) */}
                      <rect
                        x={padding.left + 10}
                        y={yEntry - 9}
                        width={268}
                        height={18}
                        rx={3}
                        fill="#0c0c0c"
                        stroke="#06b6d4"
                        strokeWidth={1}
                        className="backdrop-blur"
                      />

                      {/* Trade side and volume text */}
                      <text
                        x={padding.left + 18}
                        y={yEntry + 3}
                        fill="#22d3ee"
                        fontSize="8px"
                        fontWeight="black"
                        className="font-mono uppercase tracking-wider text-cyan-300"
                      >
                        {trade.side} {trade.size} LOT @ {trade.entryPrice.toFixed(displayFormat)}
                      </text>

                      {/* Quick Interactive on-chart close button */}
                      <g
                        cursor="pointer"
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleCloseChartTrade(trade.id);
                        }}
                        className="pointer-events-auto hover:brightness-110 active:scale-95 transition-all"
                      >
                        <rect
                          x={padding.left + 175}
                          y={yEntry - 6}
                          width={95}
                          height={12}
                          rx={2}
                          fill="#ef4444"
                        />
                        <text
                          x={padding.left + 222}
                          y={yEntry + 3}
                          fill="#ffffff"
                          fontSize="7.5px"
                          fontWeight="black"
                          textAnchor="middle"
                          className="font-mono"
                        >
                          CLOSE PNL: {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Price Y-Axis Floating Trade PnL Tags overlay */}
            {showTradeStatsOverlay && activeSymbolTrades.map((trade) => {
              const yEntry = getY(trade.entryPrice);
              const isEntryVisible = yEntry >= padding.top && yEntry <= height - padding.bottom;
              if (!isEntryVisible) return null;

              const isProfitable = trade.pnl >= 0;
              const bgColor = isProfitable ? '#064e3b' : '#3f1a1d';
              const strokeColor = isProfitable ? '#10b981' : '#f43f5e';
              const textColor = isProfitable ? '#34d399' : '#fda4af';
              const sign = isProfitable ? '+' : '';
              const pnlStr = `${sign}$${trade.pnl.toFixed(2)}`;

              const itemWidth = 58;
              const itemHeight = 12;
              const rx = 2;
              const tagX = width - padding.right + 4;
              const tagY = yEntry - itemHeight / 2;

              return (
                <g 
                  key={`trade-axis-tag-${trade.id}`} 
                  className="font-mono select-none pointer-events-auto cursor-help"
                  title={`${trade.side} ${trade.size} LOT position floating PnL: ${pnlStr}`}
                >
                  {/* Subtle connection horizontal tick line */}
                  <line
                    x1={width - padding.right}
                    y1={yEntry}
                    x2={tagX}
                    y2={yEntry}
                    stroke={strokeColor}
                    strokeWidth={1}
                    strokeDasharray="2,2"
                    opacity={0.8}
                  />
                  {/* Outer tag container shape */}
                  <rect
                    x={tagX}
                    y={tagY}
                    width={itemWidth}
                    height={itemHeight}
                    rx={rx}
                    fill={bgColor}
                    fillOpacity={0.95}
                    stroke={strokeColor}
                    strokeWidth={1}
                  />
                  <text
                    x={tagX + itemWidth / 2}
                    y={yEntry + 3}
                    fill={textColor}
                    fontSize="7.5px"
                    fontWeight="black"
                    textAnchor="middle"
                  >
                    {pnlStr}
                  </text>
                </g>
              );
            })}

            {/* One-Click Quick Entry Live Target Preview Overlay */}
            {isOneClickActive && hoveredBlock && (() => {
              const preview = calculateOneClickLevels(hoveredBlock);
              const yEntry = getY(preview.entry);
              const ySL = getY(preview.sl);
              const yTP = getY(preview.tp);
              
              const isEntryVisible = yEntry >= padding.top && yEntry <= height - padding.bottom;
              const isSLVisible = ySL >= padding.top && ySL <= height - padding.bottom;
              const isTPVisible = yTP >= padding.top && yTP <= height - padding.bottom;
              
              const displayFormat = symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5;
              const xStart = padding.left;
              const xEnd = width - padding.right;
              
              return (
                <g className="pointer-events-none select-none font-sans opacity-95 animate-fadeIn">
                  {/* Risk Zone Box overlay (Red) */}
                  <rect
                    x={xStart}
                    y={Math.min(yEntry, ySL)}
                    width={xEnd - xStart}
                    height={Math.abs(yEntry - ySL)}
                    fill="#ef4444"
                    fillOpacity={0.08}
                    stroke="#ef4444"
                    strokeWidth={0.5}
                    strokeDasharray="2,2"
                  />
                  
                  {/* Reward Zone Box overlay (Green) */}
                  <rect
                    x={xStart}
                    y={Math.min(yEntry, yTP)}
                    width={xEnd - xStart}
                    height={Math.abs(yEntry - yTP)}
                    fill="#10b981"
                    fillOpacity={0.08}
                    stroke="#10b981"
                    strokeWidth={0.5}
                    strokeDasharray="2,2"
                  />

                  {/* SL Preview Line & Badge */}
                  {isSLVisible && (
                    <g>
                      <line
                        x1={xStart}
                        y1={ySL}
                        x2={xEnd}
                        y2={ySL}
                        stroke="#f43f5e"
                        strokeWidth={1.5}
                        strokeDasharray="3,3"
                      />
                      <rect
                        x={xEnd - 110}
                        y={ySL - 7}
                        width={105}
                        height={14}
                        rx={2}
                        fill="#be123c"
                      />
                      <text
                        x={xEnd - 57}
                        y={ySL + 3}
                        fill="#ffffff"
                        fontSize="8px"
                        fontWeight="black"
                        textAnchor="middle"
                        className="font-mono text-[7.5px]"
                      >
                        PREVIEW SL: {preview.sl.toFixed(displayFormat)}
                      </text>
                    </g>
                  )}

                  {/* TP Preview Line & Badge */}
                  {isTPVisible && (
                    <g>
                      <line
                        x1={xStart}
                        y1={yTP}
                        x2={xEnd}
                        y2={yTP}
                        stroke="#10b981"
                        strokeWidth={1.5}
                        strokeDasharray="3,3"
                      />
                      <rect
                        x={xEnd - 110}
                        y={yTP - 7}
                        width={105}
                        height={14}
                        rx={2}
                        fill="#047857"
                      />
                      <text
                        x={xEnd - 57}
                        y={yTP + 3}
                        fill="#ffffff"
                        fontSize="8px"
                        fontWeight="black"
                        textAnchor="middle"
                        className="font-mono text-[7.5px]"
                      >
                        PREVIEW TP: {preview.tp.toFixed(displayFormat)}
                      </text>
                    </g>
                  )}

                  {/* Dynamic Entry Line */}
                  {isEntryVisible && (
                    <g>
                      <line
                        x1={xStart}
                        y1={yEntry}
                        x2={xEnd}
                        y2={yEntry}
                        stroke="#fbbf24"
                        strokeWidth={2}
                      />
                      <rect
                        x={xStart + 15}
                        y={yEntry - 9}
                        width={215}
                        height={18}
                        rx={3}
                        fill="#0c0c0e"
                        stroke="#fbbf24"
                        strokeWidth={1.2}
                      />
                      <text
                        x={xStart + 23}
                        y={yEntry + 3}
                        fill="#fbbf24"
                        fontSize="8px"
                        fontWeight="black"
                        textAnchor="start"
                        className="font-mono text-[7.5px]"
                      >
                        ⚡ ONE-CLICK {preview.side} ({oneClickLots} LOT, {oneClickRR}:1 R:R)
                      </text>
                    </g>
                  )}
                </g>
              );
            })()}

            {/* Visual Backtesting News Impact Overlay */}
            {showNewsOverlay && newsEventsWithCandles.map((item, idx) => {
              const { candleIndex, event } = item;
              if (candleIndex < startIndex || candleIndex > endIndex) return null;
              
              const x = getX(candleIndex);
              if (x < padding.left || x > width - padding.right) return null;
              
              // Count offsets down the timeline line to stack multiple events at same timestamp
              const previousSameCandleEventsCount = newsEventsWithCandles
                .slice(0, idx)
                .filter(other => other.candleIndex === candleIndex)
                .length;
                
              const badgeY = padding.top + 4 + previousSameCandleEventsCount * 17;
              const isHighImpact = event.impact === 'HIGH';
              
              return (
                <g key={`chart-news-${event.id}`} className="select-none font-sans">
                  {/* Vertical dotted timeline line */}
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke={isHighImpact ? '#ef4444' : '#f59e0b'}
                    strokeWidth={1}
                    strokeDasharray="3,4"
                    opacity={0.35}
                    className="pointer-events-none"
                  />
                  
                  {/* Interactive flag / tag anchor */}
                  <g
                    cursor="pointer"
                    onMouseEnter={(e) => {
                      const svgElement = e.currentTarget.ownerSVGElement;
                      const svgRect = svgElement?.getBoundingClientRect();
                      const clientX = e.clientX;
                      const clientY = e.clientY;
                      const relativeX = svgRect ? (clientX - svgRect.left) : x;
                      const relativeY = svgRect ? (clientY - svgRect.top) : badgeY;
                      
                      setHoveredNews({
                        id: event.id,
                        x: relativeX,
                        y: relativeY,
                        title: event.title,
                        currency: event.currency,
                        impact: event.impact,
                        time: event.time,
                        forecast: event.forecast,
                        previous: event.previous,
                        actual: event.actual,
                        deviation: item.maxPipsDeviation,
                        trend: item.postTrend,
                      });
                    }}
                    onMouseLeave={() => setHoveredNews(null)}
                    className="pointer-events-auto hover:brightness-125 transition-all"
                  >
                    {/* Event flag pin line */}
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={badgeY + 8}
                      stroke={isHighImpact ? '#f43f5e' : '#f59e0b'}
                      strokeWidth={1}
                      opacity={0.8}
                    />
                    
                    {/* Flag visual node */}
                    <rect
                      x={x - 24}
                      y={badgeY}
                      width={48}
                      height={14}
                      rx={2.5}
                      fill={isHighImpact ? '#ef4444' : '#f59e0b'}
                      className="opacity-95"
                    />
                    
                    {/* Text abbreviation */}
                    <text
                      x={x}
                      y={badgeY + 10}
                      fill="#ffffff"
                      fontSize="7.5px"
                      fontWeight="950"
                      textAnchor="middle"
                      className="font-mono tracking-tighter"
                    >
                      📢 {event.currency}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Visual Price Alerts Overlay */}
            {visualPriceAlerts
              .filter(alert => alert.symbol === symbol && alert.isActive)
              .map(alert => {
                const yPos = getY(alert.price);
                const isVisible = yPos >= padding.top && yPos <= height - padding.bottom;
                if (!isVisible) return null;

                const displayFormat = symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5;

                return (
                  <g key={`vis-price-alert-${alert.id}`} className="font-sans select-none pointer-events-auto">
                    {/* Dotted indicator line */}
                    <line
                      x1={padding.left}
                      y1={yPos}
                      x2={width - padding.right}
                      y2={yPos}
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      strokeDasharray="4,4"
                      className="animate-pulse"
                    />

                    {/* Left badge anchor */}
                    <g className="cursor-pointer hover:brightness-110 transition-all">
                      <rect
                        x={padding.left + 8}
                        y={yPos - 8}
                        width={130}
                        height={16}
                        rx={3}
                        fill="#050505"
                        stroke="#f59e0b"
                        strokeWidth={1}
                        className="backdrop-blur"
                      />
                      <text
                        x={padding.left + 16}
                        y={yPos + 4}
                        fill="#f59e0b"
                        fontSize="8px"
                        fontWeight="black"
                        className="font-mono uppercase tracking-wider"
                      >
                        🔔 ALERT @ {alert.price.toFixed(displayFormat)}
                      </text>

                      {/* Quick Interactive on-chart delete button (the "X") */}
                      <g
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setVisualPriceAlerts(prev => prev.filter(p => p.id !== alert.id));
                        }}
                        className="hover:scale-110 transition-transform cursor-pointer pointer-events-auto"
                        title="Delete alert"
                      >
                        <circle cx={padding.left + 125} cy={yPos} r={5} fill="#ef4444" />
                        <text
                          x={padding.left + 125}
                          y={yPos + 2.5}
                          style={{ fontSize: '7px', fontWeight: 'bold', fill: '#ffffff', textAnchor: 'middle' }}
                        >
                          ×
                        </text>
                      </g>
                    </g>
                  </g>
                );
              })
            }

            {/* Custom Active, Non-Triggered Parent Price Targets Overlay */}
            {priceAlerts && priceAlerts
              .filter(alert => alert.symbol === symbol && !alert.isTriggered)
              .map(alert => {
                const yPos = getY(alert.targetPrice);
                const isVisible = yPos >= padding.top && yPos <= height - padding.bottom;
                if (!isVisible) return null;

                const displayFormat = symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5;

                return (
                  <g key={`prop-price-alert-${alert.id}`} className="font-sans select-none pointer-events-auto">
                    {/* Dash/Dot line indicator */}
                    <line
                      x1={padding.left}
                      y1={yPos}
                      x2={width - padding.right}
                      y2={yPos}
                      stroke="#818cf8"
                      strokeWidth={1.5}
                      strokeDasharray="5,3"
                      className="animate-pulse"
                    />

                    {/* Badge */}
                    <g className="cursor-pointer hover:brightness-110 transition-all">
                      <rect
                        x={padding.left + 8}
                        y={yPos - 8}
                        width={140}
                        height={16}
                        rx={3}
                        fill="#050510"
                        stroke="#818cf8"
                        strokeWidth={1}
                        className="backdrop-blur"
                      />
                      <text
                        x={padding.left + 16}
                        y={yPos + 4}
                        fill="#a5b4fc"
                        fontSize="8px"
                        fontWeight="black"
                        className="font-mono uppercase tracking-wider"
                      >
                        🔔 TARGET ({alert.condition}) @ {alert.targetPrice.toFixed(displayFormat)}
                      </text>

                      {/* Delete button ("X") */}
                      {onDeletePriceAlert && (
                        <g
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onDeletePriceAlert(alert.id);
                          }}
                          className="hover:scale-110 transition-transform cursor-pointer pointer-events-auto"
                          title="Delete target alert"
                        >
                          <circle cx={padding.left + 135} cy={yPos} r={5} fill="#ef4444" />
                          <text
                            x={padding.left + 135}
                            y={yPos + 2.5}
                            style={{ fontSize: '7px', fontWeight: 'bold', fill: '#ffffff', textAnchor: 'middle' }}
                          >
                            ×
                          </text>
                        </g>
                      )}
                    </g>
                  </g>
                );
              })
            }

            {/* Visual price alert preview line */}
            {isDrawingPriceAlert && hoveredY !== null && (
              <g className="pointer-events-none">
                <line
                  x1={padding.left}
                  y1={hoveredY}
                  x2={width - padding.right}
                  y2={hoveredY}
                  stroke="#f59e0b"
                  strokeWidth={1.2}
                  strokeDasharray="2,2"
                  opacity={0.8}
                />
                
                {/* Price Label on Right axis */}
                <rect
                  x={width - padding.right - 70}
                  y={hoveredY - 8}
                  width={68}
                  height={16}
                  rx={2}
                  fill="#f59e0b"
                />
                <text
                  x={width - padding.right - 36}
                  y={hoveredY + 3.5}
                  fill="#000000"
                  fontSize="8.5px"
                  fontWeight="black"
                  textAnchor="middle"
                  className="font-mono font-bold"
                >
                  SET: {getPriceFromY(hoveredY).toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5)}
                </text>
              </g>
            )}

            {/* Manual Trendlines Overlay */}
            <g clipPath="url(#chart-plot-area)">
              {manualTrendlines
                .filter((tl) => tl.symbol === symbol)
                .map((tl) => {
                  const startX = getX(tl.startIdx);
                  const startY = getY(tl.startPrice);
                  const endX = getX(tl.endIdx);
                  const endY = getY(tl.endPrice);

                  const isDashed = tl.style === 'dashed';
                  const isDotted = tl.style === 'dotted';

                  return (
                    <g key={tl.id} className="group/trendline select-none font-sans">
                      {/* Interactive Selection Target (thick line underneath) */}
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="transparent"
                        strokeWidth={12}
                        className="cursor-pointer pointer-events-auto"
                      />

                      {/* Main Trendline render path */}
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={tl.color || '#22c55e'}
                        strokeWidth={2}
                        strokeDasharray={isDashed ? '5,5' : isDotted ? '2,2' : 'none'}
                        className="transition-all"
                      />

                      {/* Anchor vertex circles */}
                      <circle
                        cx={startX}
                        cy={startY}
                        r={3.5}
                        fill="#050515"
                        stroke={tl.color || '#22c55e'}
                        strokeWidth={1.5}
                      />
                      <circle
                        cx={endX}
                        cy={endY}
                        r={3.5}
                        fill="#050515"
                        stroke={tl.color || '#22c55e'}
                        strokeWidth={1.5}
                      />

                      {/* Floating Interactive Delete Button on trendline center vertex */}
                      <g
                        className="cursor-pointer pointer-events-auto opacity-0 group-hover/trendline:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setManualTrendlines(prev => prev.filter(t => t.id !== tl.id));
                        }}
                        title="Delete Trendline"
                      >
                        <circle
                          cx={(startX + endX) / 2}
                          cy={(startY + endY) / 2}
                          r={7.5}
                          fill="#ef4444"
                          stroke="#ffffff"
                          strokeWidth={0.5}
                        />
                        <text
                          x={(startX + endX) / 2}
                          y={(startY + endY) / 2 + 2.5}
                          style={{ fontSize: '7.5px', fontWeight: 'bold', fill: '#ffffff', textAnchor: 'middle' }}
                        >
                          ×
                        </text>
                      </g>
                    </g>
                  );
                })
              }

              {/* Price Text Annotations Overlay */}
              {chartAnnotations
                .filter((ann) => ann.symbol === symbol)
                .map((ann) => {
                  const x = getX(ann.xIndex);
                  const y = getY(ann.price);

                  // Only render if within visual bounds
                  if (x < padding.left || x > width - padding.right) return null;
                  if (y < padding.top || y > height - padding.bottom) return null;

                  // Dynamic sizing based on text length
                  const textLengthPercent = ann.text.length;
                  const estimatedWidth = Math.max(70, textLengthPercent * 5.8 + 22);
                  const cardHeight = 18;
                  const rx = 3;

                  return (
                    <g key={ann.id} className="group/annotation select-none font-sans pointer-events-auto">
                      {/* Connection pointer dotted line */}
                      <line
                        x1={x}
                        y1={y}
                        x2={x + 10}
                        y2={y - 12}
                        stroke="#818cf8"
                        strokeWidth={1}
                        strokeDasharray="1,1"
                        opacity={0.8}
                      />

                      {/* Connection Point Halo */}
                      <circle cx={x} cy={y} r={6} fill="#6366f1" opacity={0.2} className="animate-pulse" />
                      <circle cx={x} cy={y} r={2.5} fill="#6366f1" stroke="#ffffff" strokeWidth={0.8} />

                      {/* Card background */}
                      <rect
                        x={x + 10}
                        y={y - 21}
                        width={estimatedWidth}
                        height={cardHeight}
                        rx={rx}
                        fill="#08080f"
                        stroke="#818cf8"
                        strokeWidth={1}
                        className="filter drop-shadow-lg"
                        opacity={0.95}
                      />

                      {/* Annotation Content Text */}
                      <text
                        x={x + 16}
                        y={y - 9}
                        fill="#e2e8f0"
                        fontSize="9px"
                        fontWeight="600"
                        textAnchor="start"
                        className="font-medium font-sans"
                      >
                        {ann.text}
                      </text>

                      {/* Delete X 'Button' on the right */}
                      <g
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setChartAnnotations((prev) => prev.filter((a) => a.id !== ann.id));
                        }}
                      >
                        <rect
                          x={x + 10 + estimatedWidth - 16}
                          y={y - 19}
                          width={14}
                          height={14}
                          rx={2}
                          fill="transparent"
                          className="hover:fill-rose-500/10"
                        />
                        <text
                          x={x + 10 + estimatedWidth - 9}
                          y={y - 9}
                          fill="#f87171"
                          fontSize="9px"
                          fontWeight="bold"
                          textAnchor="middle"
                          title="Click to remove note"
                        >
                          ×
                        </text>
                      </g>
                    </g>
                  );
                })}

              {/* If drawing trendline but start point is not placed yet, render a hover target indicator */}
              {isDrawingTrendline && !trendlineStartPoint && trendlineHoverPoint && (
                <g className="pointer-events-none select-none">
                  {isMagnetActive ? (
                    // Magnet active glowing halo
                    <g>
                      {/* Soft underlying neon aura */}
                      <circle
                        cx={getX(trendlineHoverPoint.xIndex)}
                        cy={getY(trendlineHoverPoint.price)}
                        r={24}
                        fill="url(#magnet-radial-glow)"
                        className="animate-pulse"
                      />
                      {/* Interactive snapping halo with standard glow filter */}
                      <circle
                        cx={getX(trendlineHoverPoint.xIndex)}
                        cy={getY(trendlineHoverPoint.price)}
                        r={12}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={1.8}
                        filter="url(#anchor-magnet-glow)"
                        className="animate-pulse"
                      />
                      <circle
                        cx={getX(trendlineHoverPoint.xIndex)}
                        cy={getY(trendlineHoverPoint.price)}
                        r={18}
                        fill="none"
                        stroke="rgba(56, 189, 248, 0.3)"
                        strokeWidth={1}
                        className="animate-ping"
                        style={{ animationDuration: '2.5s' }}
                      />
                      <circle
                        cx={getX(trendlineHoverPoint.xIndex)}
                        cy={getY(trendlineHoverPoint.price)}
                        r={8}
                        fill="rgba(56, 189, 248, 0.08)"
                        stroke="rgba(99, 102, 241, 0.6)"
                        strokeWidth={1}
                      />
                      {/* Precise target crosshairs showing wick/body lock-on */}
                      <line
                        x1={getX(trendlineHoverPoint.xIndex) - 14}
                        y1={getY(trendlineHoverPoint.price)}
                        x2={getX(trendlineHoverPoint.xIndex) - 6}
                        y2={getY(trendlineHoverPoint.price)}
                        stroke="rgba(56, 189, 248, 0.95)"
                        strokeWidth={1.2}
                      />
                      <line
                        x1={getX(trendlineHoverPoint.xIndex) + 6}
                        y1={getY(trendlineHoverPoint.price)}
                        x2={getX(trendlineHoverPoint.xIndex) + 14}
                        y2={getY(trendlineHoverPoint.price)}
                        stroke="rgba(56, 189, 248, 0.95)"
                        strokeWidth={1.2}
                      />
                      <line
                        x1={getX(trendlineHoverPoint.xIndex)}
                        y1={getY(trendlineHoverPoint.price) - 14}
                        x2={getX(trendlineHoverPoint.xIndex)}
                        y2={getY(trendlineHoverPoint.price) - 6}
                        stroke="rgba(56, 189, 248, 0.95)"
                        strokeWidth={1.2}
                      />
                      <line
                        x1={getX(trendlineHoverPoint.xIndex)}
                        y1={getY(trendlineHoverPoint.price) + 6}
                        x2={getX(trendlineHoverPoint.xIndex)}
                        y2={getY(trendlineHoverPoint.price) + 14}
                        stroke="rgba(56, 189, 248, 0.95)"
                        strokeWidth={1.2}
                      />
                      <circle
                        cx={getX(trendlineHoverPoint.xIndex)}
                        cy={getY(trendlineHoverPoint.price)}
                        r={3}
                        fill="#38bdf8"
                      />
                    </g>
                  ) : (
                    // Standard hover target indicator
                    <g>
                      <circle
                        cx={getX(trendlineHoverPoint.xIndex)}
                        cy={getY(trendlineHoverPoint.price)}
                        r={6}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth={1}
                        className="animate-pulse"
                      />
                      <circle
                        cx={getX(trendlineHoverPoint.xIndex)}
                        cy={getY(trendlineHoverPoint.price)}
                        r={2.5}
                        fill="#22c55e"
                      />
                    </g>
                  )}
                </g>
              )}

              {/* Live drawing preview trendline */}
              {isDrawingTrendline && trendlineStartPoint && trendlineHoverPoint && (
                <g className="pointer-events-none select-none font-sans">
                  <line
                    x1={getX(trendlineStartPoint.xIndex)}
                    y1={getY(trendlineStartPoint.price)}
                    x2={getX(trendlineHoverPoint.xIndex)}
                    y2={getY(trendlineHoverPoint.price)}
                    stroke="#22c55e"
                    strokeWidth={1.5}
                    strokeDasharray="4,4"
                  />
                  {isMagnetActive ? (
                    // Glowing start anchor point wick lock
                    <g>
                      <circle
                        cx={getX(trendlineStartPoint.xIndex)}
                        cy={getY(trendlineStartPoint.price)}
                        r={12}
                        fill="rgba(99, 102, 241, 0.08)"
                        stroke="rgba(129, 140, 248, 0.45)"
                        strokeWidth={1}
                        className="animate-pulse"
                      />
                      <circle
                        cx={getX(trendlineStartPoint.xIndex)}
                        cy={getY(trendlineStartPoint.price)}
                        r={6}
                        fill="#050505"
                        stroke="#818cf8"
                        strokeWidth={2}
                      />
                    </g>
                  ) : (
                    // Standard start point
                    <circle
                      cx={getX(trendlineStartPoint.xIndex)}
                      cy={getY(trendlineStartPoint.price)}
                      r={5}
                      fill="#050505"
                      stroke="#22c55e"
                      strokeWidth={2}
                    />
                  )}

                  {isMagnetActive ? (
                    // Glowing hover anchor point wick lock
                    <g>
                      <circle
                        cx={getX(trendlineHoverPoint.xIndex)}
                        cy={getY(trendlineHoverPoint.price)}
                        r={18}
                        fill="rgba(99, 102, 241, 0.12)"
                        stroke="rgba(129, 140, 248, 0.4)"
                        strokeWidth={1}
                        className="animate-ping"
                        style={{ animationDuration: '2.5s' }}
                      />
                      <circle
                        cx={getX(trendlineHoverPoint.xIndex)}
                        cy={getY(trendlineHoverPoint.price)}
                        r={10}
                        fill="rgba(99, 102, 241, 0.05)"
                        stroke="rgba(99, 102, 241, 0.7)"
                        strokeWidth={1.2}
                      />
                      <line
                        x1={getX(trendlineHoverPoint.xIndex) - 14}
                        y1={getY(trendlineHoverPoint.price)}
                        x2={getX(trendlineHoverPoint.xIndex) - 6}
                        y2={getY(trendlineHoverPoint.price)}
                        stroke="rgba(129, 140, 248, 0.85)"
                        strokeWidth={1}
                      />
                      <line
                        x1={getX(trendlineHoverPoint.xIndex) + 6}
                        y1={getY(trendlineHoverPoint.price)}
                        x2={getX(trendlineHoverPoint.xIndex) + 14}
                        y2={getY(trendlineHoverPoint.price)}
                        stroke="rgba(129, 140, 248, 0.85)"
                        strokeWidth={1}
                      />
                      <line
                        x1={getX(trendlineHoverPoint.xIndex)}
                        y1={getY(trendlineHoverPoint.price) - 14}
                        x2={getX(trendlineHoverPoint.xIndex)}
                        y2={getY(trendlineHoverPoint.price) - 6}
                        stroke="rgba(129, 140, 248, 0.85)"
                        strokeWidth={1}
                      />
                      <line
                        x1={getX(trendlineHoverPoint.xIndex)}
                        y1={getY(trendlineHoverPoint.price) + 6}
                        x2={getX(trendlineHoverPoint.xIndex)}
                        y2={getY(trendlineHoverPoint.price) + 14}
                        stroke="rgba(129, 140, 248, 0.85)"
                        strokeWidth={1}
                      />
                      <circle
                        cx={getX(trendlineHoverPoint.xIndex)}
                        cy={getY(trendlineHoverPoint.price)}
                        r={6}
                        fill="#050505"
                        stroke="#38bdf8"
                        strokeWidth={2}
                      />
                    </g>
                  ) : (
                    // Standard hover point
                    <circle
                      cx={getX(trendlineHoverPoint.xIndex)}
                      cy={getY(trendlineHoverPoint.price)}
                      r={5}
                      fill="#050505"
                      stroke="#22c55e"
                      strokeWidth={2}
                      className="animate-ping"
                    />
                  )}
                  <g transform={`translate(${Math.max(padding.left + 10, Math.min(getX(trendlineHoverPoint.xIndex) + 12, width - padding.right - 120))}, ${Math.max(padding.top + 10, Math.min(getY(trendlineHoverPoint.price) - 25, height - padding.bottom - 30))})`}>
                    <rect
                      width={105}
                      height={18}
                      rx={3}
                      fill="#050505"
                      stroke="#22c55e"
                      strokeWidth={1}
                      fillOpacity={0.9}
                    />
                    <text
                      x={52.5}
                      y={11.5}
                      fill="#22c55e"
                      fontSize="7.5px"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      Click to Lock Endpoint
                    </text>
                  </g>
                </g>
              )}
            </g>

            {/* General Hover Crosshair and Liquidity Telemetry */}
            {showCrosshairTool && !isDrawingPriceAlert && cursorY !== null && cursorPrice !== null && (
              (() => {
                const { type, density } = getLiquidityDensityAtPrice(cursorPrice);
                const isHighDensity = density > 0.15;
                const labelBg = type === 'BSL' ? '#fbbf24' : type === 'SSL' ? '#8b5cf6' : '#1e1b4b'; // Dark blue indigo theme for normal
                const labelFg = type === 'BSL' || type === 'SSL' ? '#000000' : '#e0e7ff';
                const densityPercent = Math.round(density * 100);
                const densityLabel = type !== 'NONE' ? ` ${type}(${densityPercent}%)` : '';
                
                // Dynamically fit tag width within the right padding bounds to avoid SVG clipping
                const tagWidth = type !== 'NONE' ? 112 : 62;
                const tx = Math.min(width - tagWidth - 2, width - padding.right + 4);
                
                return (
                  <g className="pointer-events-none" id="crosshair-precision-layer">
                    {/* Horizontal crosshair line */}
                    <line
                      x1={padding.left}
                      y1={cursorY}
                      x2={width - padding.right}
                      y2={cursorY}
                      stroke={isHighDensity ? labelBg : '#6366f1'}
                      strokeWidth={0.75}
                      strokeDasharray="3,3"
                      opacity={isHighDensity ? 0.85 : 0.45}
                    />

                    {/* Vertical crosshair line synced to cursor center */}
                    {cursorX !== null && (
                      <line
                        x1={cursorX}
                        y1={padding.top}
                        x2={cursorX}
                        y2={height - padding.bottom}
                        stroke="#6366f1"
                        strokeWidth={0.75}
                        strokeDasharray="3,3"
                        opacity={0.45}
                      />
                    )}

                    {/* Intersection target indicator */}
                    {cursorX !== null && (
                      <g id="crosshair-intersection-target">
                        <circle
                          cx={cursorX}
                          cy={cursorY}
                          r={8}
                          fill="none"
                          stroke={isHighDensity ? labelBg : '#818cf8'}
                          strokeWidth={1}
                          opacity={0.6}
                          className="animate-pulse"
                        />
                        <circle
                          cx={cursorX}
                          cy={cursorY}
                          r={2.5}
                          fill={isHighDensity ? labelBg : '#e0e7ff'}
                        />
                      </g>
                    )}
                    
                    {/* Crosshair horizontal tag background on the right Y-axis */}
                    <rect
                      x={tx}
                      y={cursorY - 8}
                      width={tagWidth}
                      height={16}
                      rx={2}
                      fill={labelBg}
                      stroke={isHighDensity ? '#ffffff' : '#818cf8'}
                      strokeWidth={0.5}
                      opacity={0.95}
                    />
                    
                    {/* Crosshair horizontal tag text */}
                    <text
                      x={tx + 4}
                      y={cursorY + 3.5}
                      fill={labelFg}
                      fontSize="8.5px"
                      fontWeight="bold"
                      textAnchor="start"
                      className="font-mono"
                    >
                      {cursorPrice.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5)}{densityLabel}
                    </text>

                    {/* Vertical Timestamp Tag on bottom horizontal X-axis */}
                    {cursorX !== null && cursorTime !== null && (
                      (() => {
                        const tagWidth = 92;
                        const rx = Math.max(padding.left, Math.min(width - padding.right - tagWidth, cursorX - tagWidth / 2));
                        return (
                          <g id="crosshair-timestamp-tag">
                            <rect
                              x={rx}
                              y={height - padding.bottom + 2}
                              width={tagWidth}
                              height={16}
                              rx={2}
                              fill="#4f46e5"
                              stroke="#818cf8"
                              strokeWidth={0.5}
                              opacity={0.95}
                            />
                            <text
                              x={rx + tagWidth / 2}
                              y={height - padding.bottom + 13}
                              fill="#ffffff"
                              fontSize="8.2px"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="font-mono tracking-tight"
                            >
                              {formatIndexTime(cursorTime)}
                            </text>
                          </g>
                        );
                      })()
                    )}
                  </g>
                );
              })()
            )}
          </svg>

          {/* Floating/Inline Text Annotation Input */}
          {activeInputAnnotation && (
            <div 
              className="absolute z-[130] bg-[#0c0c0e]/95 border border-indigo-500/80 rounded p-2 shadow-2xl flex items-center space-x-2 backdrop-blur"
              style={{ 
                left: `${(activeInputAnnotation.x / width) * 100}%`, 
                top: `${(activeInputAnnotation.y / height) * 100}%`,
                transform: 'translate(-50%, -100%)',
                marginTop: '-10px'
              }}
            >
              <input
                id="floating-annotation-input"
                type="text"
                autoFocus
                placeholder="Type note & hit Enter..."
                className="bg-[#050505] text-[10px] text-white border border-white/10 px-2 py-1 rounded outline-none w-44 font-sans font-medium placeholder-white/20 focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveAnnotation(e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    setActiveInputAnnotation(null);
                  }
                }}
                onBlur={(e) => {
                  handleSaveAnnotation(e.target.value);
                }}
              />
              <button
                onClick={() => setActiveInputAnnotation(null)}
                className="text-white/40 hover:text-white font-bold px-1.5 py-0.5 rounded text-[11px] hover:bg-white/5 transition-all outline-none"
                title="Cancel"
              >
                ×
              </button>
            </div>
          )}

          {/* Floating Zoom & Pan HUD in the bottom left of the chart area */}
          <div className="absolute bottom-10 left-6 z-10 flex items-center space-x-1 bg-[#050505] border border-white/10 p-1.5 rounded shadow-lg pointer-events-auto">
            <button
              id="chart-zoom-in"
              onClick={zoomIn}
              className="p-1 px-1.5 hover:bg-white/10 border border-transparent hover:border-white/5 rounded text-white/60 hover:text-white transition-all cursor-pointer flex items-center justify-center font-bold"
              style={{ minWidth: '24px', height: '24px' }}
              title="Zoom In"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              id="chart-zoom-out"
              onClick={zoomOut}
              className="p-1 px-1.5 hover:bg-white/10 border border-transparent hover:border-white/5 rounded text-white/60 hover:text-white transition-all cursor-pointer flex items-center justify-center font-bold"
              style={{ minWidth: '24px', height: '24px' }}
              title="Zoom Out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              id="chart-reset"
              onClick={resetZoom}
              className="px-2.5 py-1 text-[9px] font-mono leading-none hover:bg-white/10 border border-transparent hover:border-white/5 rounded text-white/60 hover:text-white transition-all cursor-pointer uppercase h-6 flex items-center justify-center"
              title="Reset View"
            >
              Reset
            </button>

            {/* MT5 Chart Shift controls spacer */}
            <span className="text-white/10 mx-1 select-none">|</span>

            {/* Chart Shift toggle */}
            <button
              id="chart-shift-toggle"
              onClick={() => setIsChartShiftActive(prev => !prev)}
              className={`px-2 py-1 text-[9px] font-mono leading-none rounded border transition-all cursor-pointer h-6 flex items-center justify-center gap-1 uppercase select-none ${
                isChartShiftActive 
                  ? 'bg-indigo-600/25 text-indigo-300 border-indigo-500/40 font-black shadow-[0_0_8px_rgba(99,102,241,0.25)]' 
                  : 'bg-[#0a0a0c] text-white/40 border-white/10 hover:text-white hover:bg-white/5'
              }`}
              title="Toggle MT5-Style Right-Margin Shift (Extra space for predictive path modeling)"
            >
              <ArrowRightLeft className="w-2.5 h-2.5" />
              <span>Shift: {isChartShiftActive ? chartShiftBars : 'OFF'}</span>
            </button>

            {isChartShiftActive && (
              <div className="flex items-center space-x-0.5 ml-1 bg-[#050505] p-0.5 rounded border border-white/5">
                <button
                  id="chart-shift-inc"
                  onClick={() => setChartShiftBars(prev => Math.min(45, prev + 5))}
                  className="p-1 hover:bg-white/10 rounded text-sky-400 hover:text-sky-300 transition-all cursor-pointer flex items-center justify-center font-bold"
                  style={{ width: '18px', height: '18px' }}
                  title="Increase Right-Margin Empty Space (+5 Columns)"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
                <button
                  id="chart-shift-dec"
                  onClick={() => setChartShiftBars(prev => Math.max(5, prev - 5))}
                  className="p-1 hover:bg-white/10 rounded text-rose-500 hover:text-rose-400 transition-all cursor-pointer flex items-center justify-center font-bold"
                  style={{ width: '18px', height: '18px' }}
                  title="Decrease Right-Margin Empty Space (-5 Columns)"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
              </div>
            )}

            {(offset > 0 || visibleCount < (candles.length || 40)) && (
              <span className="text-[8px] text-indigo-400 font-mono font-bold px-1.5 animate-pulse select-none uppercase tracking-wider">
                Zoomed
              </span>
            )}
          </div>

          {/* Floated Visual Backtesting News Details Tooltip */}
          {hoveredNews && (
            <div 
              className={`absolute bg-[#0c0c0e] border ${
                hoveredNews.impact === 'HIGH' 
                  ? 'border-rose-500/50 border-l-3 border-l-rose-500' 
                  : 'border-amber-500/50 border-l-3 border-l-amber-500'
              } p-3 rounded-lg shadow-[0_16px_36px_rgba(0,0,0,0.95)] z-[110] font-mono text-[10.5px] text-white select-none pointer-events-none w-[240px]`}
              style={{ left: `${Math.min(hoveredNews.x + 10, width - 260)}px`, top: `${Math.max(hoveredNews.y - 120, 10)}px` }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                    hoveredNews.impact === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {hoveredNews.impact}
                  </span>
                  <span className="font-extrabold text-white/90">{hoveredNews.currency}</span>
                </div>
                <span className="text-[9px] text-white/40">{(() => {
                  if (!hoveredNews.time) return '—';
                  const d = new Date(hoveredNews.time);
                  if (isNaN(d.getTime())) return hoveredNews.time;
                  try {
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  } catch {
                    return hoveredNews.time;
                  }
                })()}</span>
              </div>
              
              <div className="font-sans font-bold text-white/95 text-xs mb-2 leading-tight font-sans">
                {hoveredNews.title}
              </div>

              <div className="grid grid-cols-3 gap-1 bg-[#050505] p-1.5 rounded border border-white/5 mb-2 text-center text-[9px]">
                <div>
                  <span className="text-white/30 block text-[7.5px] uppercase font-bold font-sans">Forecast</span>
                  <span className="font-bold text-white/90">{hoveredNews.forecast || '—'}</span>
                </div>
                <div>
                  <span className="text-white/30 block text-[7.5px] uppercase font-bold font-sans">Previous</span>
                  <span className="font-bold text-white/90">{hoveredNews.previous || '—'}</span>
                </div>
                <div>
                  <span className="text-white/30 block text-[7.5px] uppercase font-bold font-sans">Actual</span>
                  <span className={`font-bold ${hoveredNews.actual ? 'text-emerald-400' : 'text-amber-400/80 italic'}`}>
                    {hoveredNews.actual || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Backtesting statistics section */}
              <div className="pt-2 border-t border-white/10 text-[9px]">
                <div className="text-rose-400 font-extrabold uppercase text-[8px] tracking-wider mb-1 flex items-center gap-1 font-sans">
                  <span>📊</span> BACKTEST NEWS VOLATILITY (4H)
                </div>
                <div className="flex items-center justify-between text-[11.5px] font-bold py-0.5">
                  <span className="text-white/50 font-sans font-medium">Max Deviation:</span>
                  <span className="text-rose-400 font-mono font-extrabold">{hoveredNews.deviation.toFixed(1)} Pips</span>
                </div>
                <div className="flex items-center justify-between text-[11.5px] font-bold py-0.5">
                  <span className="text-white/50 font-sans font-medium">Post-Event Bias:</span>
                  <span className={`font-mono font-extrabold ${
                    hoveredNews.trend === 'BULLISH' ? 'text-emerald-400' : hoveredNews.trend === 'BEARISH' ? 'text-rose-400' : 'text-white/30'
                  }`}>
                    {hoveredNews.trend}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Floated Visual Trade Execution Tooltip */}
          {hoveredTrade && (
            <div 
              className={`absolute bg-[#0c0c0e]/95 border ${
                hoveredTrade.trade.side === 'BUY' 
                  ? 'border-emerald-500/50 border-l-3 border-l-emerald-500' 
                  : 'border-rose-500/50 border-l-3 border-l-rose-500'
              } p-3 rounded-lg shadow-[0_16px_36px_rgba(0,0,0,0.95)] z-[110] font-mono text-[10.5px] text-white select-none pointer-events-none w-[240px]`}
              style={{ 
                left: `${Math.min(hoveredTrade.x + 10, width - 260)}px`, 
                top: `${Math.max(hoveredTrade.y - 120, 10)}px` 
              }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5 font-sans">
                <div className="flex items-center gap-1.5 font-sans">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                    hoveredTrade.trade.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {hoveredTrade.trade.side}
                  </span>
                  <span className="font-extrabold text-white/90 font-sans">{hoveredTrade.trade.symbol}</span>
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  hoveredTrade.trade.status === 'OPEN' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-neutral-800 text-neutral-400 border border-transparent'
                }`}>
                  {hoveredTrade.trade.status}
                </span>
              </div>
              
              <div className="font-sans font-extrabold text-white/95 text-xs mb-2 flex items-center justify-between">
                <span>Execution Size:</span>
                <span className="text-white font-mono">{hoveredTrade.trade.size} Lots</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 bg-[#050505] p-1.5 rounded border border-white/5 mb-2.5 text-center text-[9px]">
                <div>
                  <span className="text-white/30 block text-[7.5px] uppercase font-bold font-sans">Entry Price</span>
                  <span className="font-bold text-white/90">${hoveredTrade.trade.entryPrice.toFixed(symbol === 'USD/JPY' ? 3 : symbol === 'BTC/USDT' ? 1 : 5)}</span>
                </div>
                <div>
                  <span className="text-white/30 block text-[7.5px] uppercase font-bold font-sans">Exit Status PnL</span>
                  <span className={`font-bold font-mono ${hoveredTrade.trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {hoveredTrade.trade.pnl >= 0 ? '+' : ''}${hoveredTrade.trade.pnl.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Technical Confluences / Details */}
              <div className="pt-1.5 border-t border-white/10 text-[9px]">
                <div className="text-indigo-400 font-extrabold uppercase text-[8px] tracking-wider mb-1 flex items-center gap-1 font-sans">
                  <span>🔒</span> INSTITUTIONAL TRADE SPECS
                </div>
                <div className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-white/50 font-sans font-medium">SL Limit:</span>
                  <span className="text-rose-300 font-mono">${hoveredTrade.trade.stopLoss > 0 ? hoveredTrade.trade.stopLoss.toFixed(symbol === 'USD/JPY' ? 3 : symbol === 'BTC/USDT' ? 1 : 5) : 'None'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-white/50 font-sans font-medium">TP Limit:</span>
                  <span className="text-emerald-300 font-mono">${hoveredTrade.trade.takeProfit > 0 ? hoveredTrade.trade.takeProfit.toFixed(symbol === 'USD/JPY' ? 3 : symbol === 'BTC/USDT' ? 1 : 5) : 'None'}</span>
                </div>
                {hoveredTrade.trade.reason && (
                  <div className="mt-1.5 text-[8.5px] text-white/60 font-sans leading-relaxed border-t border-white/[0.03] pt-1">
                    <strong className="text-indigo-300 font-sans">Rationale:</strong> {hoveredTrade.trade.reason}
                  </div>
                )}
              </div>
            </div>
          )}
            </div>
          </div>

          {/* DOM Price Ladder Column */}
          {!isFullscreen && (
            <div className={`col-span-12 lg:col-span-3 transition-all duration-300 ${
              isExpanded ? 'lg:h-[550px]' : 'lg:h-[360px]'
            }`}>
              <DOMPriceLadder
                symbol={symbol as any}
                livePrice={hoveredCandle ? hoveredCandle.close : (typeof livePrice !== 'undefined' ? livePrice : basePrice)}
                trades={trades}
                oneClickLots={oneClickLots}
                onTradeExecuted={onTradeExecuted}
                basePrice={basePrice}
                sweeps={sweeps}
                candles={candles}
                showTWVP={showTWVP}
                metrics={metrics}
              />
            </div>
          )}
        </div>

        {/* Smart Alerts Sidebar Drawer */}
        <AnimatePresence>
          {isAlertsOpen && (
            <motion.div 
              id="smart-alerts-drawer"
              initial={{ opacity: 0, scale: 0.98, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.98, x: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute top-0 right-0 bottom-0 w-[310px] sm:w-[350px] bg-[#0c0c0c]/98 border-l border-white/10 z-[100] flex flex-col shadow-[-12px_0_40px_rgba(0,0,0,0.95)] font-mono pointer-events-auto h-full"
            >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02] shrink-0">
            <div className="flex items-center space-x-2 text-amber-300">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Smart Proximity Alerts</span>
            </div>
            <button 
              onClick={() => setIsAlertsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Indicator Gauge Peek */}
          <div className="p-3.5 bg-white/[0.01] border-b border-white/5 text-[10.5px] shrink-0">
            <div className="flex items-center justify-between text-white/50 mb-1.5 font-bold">
              <span className="uppercase tracking-tight text-[10px]">Active Symbol: {symbol}</span>
              <span className={metrics.dailyBias === 'BULLISH' ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-extrabold'}>{metrics.dailyBias} Bias</span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-[#050505] p-2 rounded border border-white/5 text-center">
              <div>
                <span className="text-[8px] text-white/30 block uppercase tracking-wider mb-0.5">50 EMA Strength</span>
                <span className="text-white font-bold text-xs">{trendIntensity.percent}%</span>
              </div>
              <div>
                <span className="text-[8px] text-white/30 block uppercase tracking-wider mb-0.5">Price to EMA Gap</span>
                <span className="text-indigo-300 font-bold text-xs">{trendIntensity.displayDistance}</span>
              </div>
            </div>
          </div>
          <div className="flex border-b border-white/10 shrink-0 text-[10px] select-none bg-white/[0.01]">
            <button
              id="pa-alerts-tab"
              type="button"
              onClick={() => setAlertsActiveTab('PRICE_ACTION')}
              className={`flex-1 text-center py-2.5 font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                alertsActiveTab === 'PRICE_ACTION'
                  ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5'
                  : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/5'
              }`}
            >
              🔄 PA Alerts ({priceActionAlerts.filter(a => a.isActive).length})
            </button>
            <button
              id="standard-alerts-tab"
              type="button"
              onClick={() => setAlertsActiveTab('STANDARD')}
              className={`flex-1 text-center py-2.5 font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
                alertsActiveTab === 'STANDARD'
                  ? 'text-amber-400 border-amber-500 bg-amber-500/5'
                  : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/5'
              }`}
            >
              📊 EMA/Gap Alerts
            </button>
          </div>

          {alertsActiveTab === 'STANDARD' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
              {/* Smart Add Alert Form Section */}
              <form onSubmit={handleAddAlert} className="p-3.5 border-b border-white/10 space-y-2.5 bg-white/[0.01] shrink-0">
                <span className="text-[9px] uppercase font-bold tracking-wider text-white/40 block mb-1">Create Multi-Instrument Alert</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8.5px] uppercase font-semibold text-white/40 block mb-1 font-mono">Instrument</label>
                    <select
                      value={newAlertSymbol}
                      onChange={(e) => {
                        setNewAlertSymbol(e.target.value);
                        if (newAlertType === 'TREND_STRENGTH') {
                          setNewAlertValue(80);
                        } else {
                          setNewAlertValue(e.target.value === 'BTC/USDT' ? 150 : e.target.value === 'GOLD/USD' ? 5 : e.target.value === 'USD/JPY' ? 0.1 : 10);
                        }
                      }}
                      className="w-full bg-[#050505] text-[10px] text-white/90 border border-white/10 rounded px-1.5 py-1 outline-none focus:border-indigo-500 font-mono"
                    >
                      {Object.keys(FRIENDLY_NAMES).map((sym) => (
                        <option key={sym} value={sym}>{sym}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[8.5px] uppercase font-semibold text-white/40 block mb-1 font-mono">Metric Type</label>
                    <select
                      value={newAlertType}
                      onChange={(e) => {
                        const val = e.target.value as 'GAP_PIPS_PRICE' | 'TREND_STRENGTH';
                        setNewAlertType(val);
                        if (val === 'TREND_STRENGTH') {
                          setNewAlertValue(80);
                        } else {
                          setNewAlertValue(newAlertSymbol === 'BTC/USDT' ? 150 : newAlertSymbol === 'GOLD/USD' ? 5 : newAlertSymbol === 'USD/JPY' ? 0.1 : 10);
                        }
                      }}
                      className="w-full bg-[#050505] text-[10px] text-white/90 border border-white/10 rounded px-1.5 py-1 outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="TREND_STRENGTH">Strength (%)</option>
                      <option value="GAP_PIPS_PRICE">EMA Gap</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8.5px] uppercase font-semibold text-white/40 block mb-1 font-mono font-bold">Comparison</label>
                    <select
                      value={newAlertComparison}
                      onChange={(e) => setNewAlertComparison(e.target.value as 'EXCEEDS' | 'BELOW')}
                      className="w-full bg-[#050505] text-[10px] text-white/90 border border-white/10 rounded px-1.5 py-1 outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="EXCEEDS">Exceeds (&gt;=)</option>
                      <option value="BELOW">Falls Below (&lt;=)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[8.5px] uppercase font-semibold text-white/40 block mb-1 font-mono font-bold">
                      {newAlertType === 'TREND_STRENGTH' ? 'Threshold (%)' : `Threshold (${newAlertSymbol === 'BTC/USDT' ? 'USDT' : newAlertSymbol === 'USD/JPY' ? '¥' : 'Pips'})`}
                    </label>
                    <input
                      type="number"
                      step={newAlertSymbol === 'USD/JPY' && newAlertType === 'GAP_PIPS_PRICE' ? '0.01' : '1'}
                      value={newAlertValue}
                      onChange={(e) => setNewAlertValue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#050505] text-[11px] font-bold text-white border border-white/10 rounded px-1.5 py-1 outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white border border-amber-500/30 hover:border-amber-500/60 transition-all rounded py-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 mt-2 pointer-events-auto"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  Add Alert Rule
                </button>
              </form>

              {/* List of Scheduled Alerts */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2 custom-scrollbar shrink">
                <div className="text-[9px] uppercase font-bold tracking-wider text-white/45 block mb-1 flex items-center justify-between">
                  <span>Active Alerts ({smartAlerts.length})</span>
                  {smartAlerts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Delete all Smart Alerts?")) {
                          setSmartAlerts([]);
                        }
                      }}
                      className="text-[8.5px] text-rose-500 hover:text-rose-400 uppercase tracking-tight cursor-pointer font-bold"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {smartAlerts.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/5 rounded px-2.5">
                    <span className="text-[10px] text-white/35 italic block leading-relaxed">No smart alerts scheduled. Set a custom rule above to capture high-conviction trends.</span>
                  </div>
                ) : (
                  smartAlerts.map((alert) => {
                    const isCur = alert.symbol === symbol;
                    const unitLabel = alert.type === 'TREND_STRENGTH' 
                      ? '%' 
                      : (alert.symbol === 'BTC/USDT' ? ' USDT' : alert.symbol === 'USD/JPY' ? ' ¥' : ' Pips');
                    
                    return (
                      <div 
                        key={alert.id}
                        className={`relative flex flex-col p-2.5 rounded border transition-all ${
                          alert.isTriggered && alert.isActive
                            ? 'bg-rose-500/20 border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse'
                            : alert.isActive
                              ? 'bg-white/[0.02] border-white/10 hover:border-white/20'
                              : 'bg-white/[0.01] border-white/5 opacity-55'
                        }`}
                      >
                        {/* Flag and symbol line */}
                        <div className="flex items-center justify-between mb-1.5 border-b border-white/5 pb-1 select-none">
                          <div className="flex items-center space-x-1.5">
                            <span className={`inline-block text-[9px] px-1 py-0.5 rounded font-bold font-sans ${isCur ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white/50'}`}>
                              {alert.symbol}
                            </span>
                            <span className="text-[8px] text-white/30 uppercase tracking-wider font-extrabold">
                              {alert.type === 'TREND_STRENGTH' ? 'STRENGTH' : 'GAP'}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1.5">
                            {/* Active / Disable toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleAlertActive(alert.id)}
                              className={`text-[8.5px] uppercase font-bold tracking-tight px-1 py-0.5 rounded transition-all cursor-pointer border ${
                                alert.isActive
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/30'
                                  : 'bg-white/5 text-white/35 border-white/5 hover:bg-white/10 hover:text-white/60'
                              }`}
                              title={alert.isActive ? "Deactivate active alert" : "Activate disabled alert"}
                            >
                              {alert.isActive ? 'ACTIVE' : 'MUTED'}
                            </button>

                            {/* Trash indicator */}
                            <button
                              type="button"
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="p-1 hover:bg-rose-500/10 hover:text-rose-400 text-white/20 rounded transition-all cursor-pointer"
                              title="Delete custom alert"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Config explanation */}
                        <div className="text-[10px] sm:text-[10.5px] text-white/85 font-semibold flex items-center flex-wrap gap-1 leading-tight select-none">
                          <span>Trigger when</span>
                          <span className="bg-white/5 text-white text-[9px] px-1 py-0.5 rounded font-black font-sans">
                            {alert.comparison === 'EXCEEDS' ? '>=' : '<='}
                          </span>
                          <span className="text-amber-300 font-bold">{alert.value}{unitLabel}</span>
                        </div>

                        {/* Triggers logged stats */}
                        {alert.triggeredCount > 0 && (
                          <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-between text-[8px] text-white/40 select-none">
                            <span className="text-rose-400 font-bold flex items-center gap-0.5">
                              <span className="w-1 h-1 rounded bg-rose-400 animate-ping inline-block" />
                              ALARM ({alert.triggeredCount}x)
                            </span>
                            <div className="flex items-center space-x-1.5">
                              {alert.lastTriggered && (
                                <span title={`At price: ${alert.lastTriggeredPrice}`}>Last: {alert.lastTriggered}</span>
                              )}
                              <span className="text-white/20">|</span>
                              <button
                                type="button"
                                onClick={() => handleResetTriggerCount(alert.id)}
                                className="text-white/35 hover:text-white/60 hover:underline cursor-pointer font-bold text-[8px] uppercase tracking-tighter"
                              >
                                Reset
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Visual Price alert section */}
                <div className="pt-4 border-t border-white/10 mt-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block mb-2 flex items-center justify-between">
                    <span>Visual Alert Lines ({visualPriceAlerts.length})</span>
                    {visualPriceAlerts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Delete all Visual Price Alerts?")) {
                            setVisualPriceAlerts([]);
                          }
                        }}
                        className="text-[8.5px] text-rose-500 hover:text-rose-400 uppercase tracking-tight cursor-pointer font-bold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {visualPriceAlerts.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded px-2.5">
                      <span className="text-[10px] text-white/35 italic block leading-relaxed">
                        No visual alert lines set. Click on "Set Alert Line" above and click anywhere on the chart canvas to add one.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {visualPriceAlerts.map((alert) => {
                        const displayFormat = alert.symbol === 'USD/JPY' ? 2 : alert.symbol === 'BTC/USDT' ? 0 : 5;
                        const isCur = alert.symbol === symbol;
                        return (
                          <div 
                            key={alert.id}
                            className={`flex flex-col p-2.5 rounded border transition-all ${
                              alert.isTriggered
                                ? 'bg-amber-500/10 border-amber-500/40 opacity-70'
                                : alert.isActive
                                  ? 'bg-white/[0.02] border-white/10'
                                  : 'bg-white/[0.01] border-white/5 opacity-55'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-1.5">
                                <span className={`inline-block text-[8px] px-1 py-0.5 rounded font-bold font-sans ${isCur ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-white/50'}`}>
                                  {alert.symbol}
                                </span>
                                <span className="text-[8px] text-white/40 uppercase tracking-wider font-extrabold flex items-center gap-1">
                                  <span>CROSSING</span>
                                  <span className={alert.type === 'CROSS_UP' ? 'text-emerald-400' : 'text-rose-400'}>
                                    {alert.type === 'CROSS_UP' ? '▲ UP' : '▼ DOWN'}
                                  </span>
                                </span>
                              </div>

                              <div className="flex items-center space-x-1.5">
                                {/* Mute toggle button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVisualPriceAlerts(prev => prev.map(p => p.id === alert.id ? { ...p, isActive: !p.isActive, isTriggered: false } : p));
                                  }}
                                  className={`text-[8.5px] uppercase font-bold tracking-tight px-1 py-0.5 rounded transition-all cursor-pointer border ${
                                    alert.isActive && !alert.isTriggered
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/20 hover:bg-amber-500/30'
                                      : 'bg-white/5 text-white/35 border-white/5 hover:bg-white/10 hover:text-white/60'
                                  }`}
                                >
                                  {alert.isTriggered ? 'TRIGGERED' : alert.isActive ? 'ACTIVE' : 'MUTED'}
                                </button>

                                {/* Trash button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVisualPriceAlerts(prev => prev.filter(p => p.id !== alert.id));
                                  }}
                                  className="p-1 hover:bg-rose-500/10 hover:text-rose-400 text-white/20 rounded transition-all cursor-pointer"
                                  title="Delete visual alert"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="text-[11px] font-bold text-white leading-tight mt-1 flex items-center justify-between">
                              <span>
                                Level: <span className="text-amber-400">{alert.price.toFixed(displayFormat)}</span>
                              </span>
                              <span className="text-white/30 text-[8px] font-normal">{alert.createdAt}</span>
                            </div>

                            {/* Trigger details label if crossed */}
                            {alert.isTriggered && alert.lastTriggeredTime && (
                              <div className="mt-1.5 pt-1 border-t border-white/5 text-[8.5px] text-amber-400/80">
                                🔔 Triggered at {alert.lastTriggeredTime}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Manual Trendlines Section */}
                <div className="pt-4 border-t border-white/10 mt-4 pb-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block mb-2 flex items-center justify-between">
                    <span>Drawn Trendlines ({manualTrendlines.length})</span>
                    {manualTrendlines.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Delete all manually drawn trendlines?")) {
                            setManualTrendlines([]);
                          }
                        }}
                        className="text-[8.5px] text-rose-500 hover:text-rose-400 uppercase tracking-tight cursor-pointer font-bold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {manualTrendlines.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded px-2.5">
                      <span className="text-[10px] text-white/35 italic block leading-relaxed">
                        No custom trendlines drawn. Click on "Draw Trendline" above and click two points on the chart to set one.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {manualTrendlines.map((tl) => {
                        const displayFormat = tl.symbol === 'USD/JPY' ? 2 : tl.symbol === 'BTC/USDT' ? 0 : 5;
                        const isCur = tl.symbol === symbol;
                        return (
                          <div
                            key={tl.id}
                            className={`p-2 bg-white/[0.01] border hover:bg-white/[0.02] transition-all rounded ${
                              isCur ? 'border-emerald-500/25' : 'border-white/5'
                            } ${!isCur ? 'opacity-65' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <div className="flex items-center space-x-1">
                                <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${isCur ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                                  {tl.symbol}
                                </span>
                                <span className="text-[7.5px] text-white/45 font-mono uppercase tracking-tight">
                                  Pts: #{tl.startIdx} → #{tl.endIdx}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1.5 font-bold">
                                {/* Style Selector */}
                                <select
                                  value={tl.style || 'solid'}
                                  onChange={(e) => {
                                    const newStyle = e.target.value as 'solid' | 'dashed' | 'dotted';
                                    setManualTrendlines(prev => prev.map(t => t.id === tl.id ? { ...t, style: newStyle } : t));
                                  }}
                                  className="text-[8px] bg-[#050505] text-white/70 border border-white/10 rounded px-1 py-0.5 focus:outline-none cursor-pointer"
                                >
                                  <option value="solid">Solid</option>
                                  <option value="dashed">Dashed</option>
                                  <option value="dotted">Dotted</option>
                                </select>

                                {/* Trash button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setManualTrendlines(prev => prev.filter(t => t.id !== tl.id));
                                  }}
                                  className="p-1 hover:bg-rose-500/10 hover:text-rose-400 text-white/20 hover:text-rose-400 rounded transition-all cursor-pointer"
                                  title="Delete trendline"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>

                            {/* Interactive Color selection pallet */}
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="text-[9.5px] text-white/50 font-mono">
                                Range: <span className="text-white/80 font-semibold">{tl.startPrice.toFixed(displayFormat)}</span> - <span className="text-white/80 font-semibold">{tl.endPrice.toFixed(displayFormat)}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                {['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'].map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => {
                                      setManualTrendlines(prev => prev.map(t => t.id === tl.id ? { ...t, color: c } : t));
                                    }}
                                    className={`w-2.5 h-2.5 rounded-full transition-transform cursor-pointer hover:scale-125 ${(tl.color || '#22c55e') === c ? 'ring-1 ring-white/70 scale-110' : 'opacity-65'}`}
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Stored Text Annotations Section */}
                <div className="pt-4 border-t border-white/10 mt-4">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block mb-2 flex items-center justify-between">
                    <span>Chart Annotations ({chartAnnotations.length})</span>
                    {chartAnnotations.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Delete all chart text annotations?")) {
                            setChartAnnotations([]);
                          }
                        }}
                        className="text-[8.5px] text-rose-500 hover:text-rose-450 uppercase tracking-tight cursor-pointer font-bold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {chartAnnotations.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded px-2.5">
                      <span className="text-[10px] text-white/35 italic block leading-relaxed">
                        No text annotations placed yet. Click "Place Text Annotation" under analysis drawings and click on the chart.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {chartAnnotations.map((ann) => {
                        const displayFormat = ann.symbol === 'USD/JPY' ? 2 : ann.symbol === 'BTC/USDT' ? 0 : 5;
                        const isCur = ann.symbol === symbol;
                        return (
                          <div
                            key={ann.id}
                            className={`p-2 bg-white/[0.01] border hover:bg-white/[0.02] transition-all rounded ${
                              isCur ? 'border-indigo-500/25' : 'border-white/5'
                            } ${!isCur ? 'opacity-65' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${isCur ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-white/40'}`}>
                                {ann.symbol}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setChartAnnotations(prev => prev.filter(a => a.id !== ann.id));
                                }}
                                className="p-1 hover:bg-rose-500/10 hover:text-rose-450 text-white/25 hover:text-rose-400 rounded transition-all cursor-pointer"
                                title="Delete annotation"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <div className="text-[9.5px] text-white/90 font-medium break-all whitespace-pre-wrap leading-normal font-sans">{ann.text}</div>
                            <div className="text-[8.5px] text-white/40 font-mono mt-1">
                              At Price: <span className="text-white/60 font-semibold">{ann.price.toFixed(displayFormat)}</span> (Idx #{ann.xIndex})
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
              {/* Form specifically for custom Price-Action Trend Alerts */}
              <form onSubmit={handleAddPaAlert} className="p-3.5 border-b border-white/10 space-y-2.5 bg-white/[0.01] shrink-0">
                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 block mb-1 font-mono">Create Price-Action Trend Alert</span>
                
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="text-[8px] uppercase font-semibold text-white/40 block mb-1 font-mono">Instrument</label>
                    <select
                      value={newPaSymbol}
                      onChange={(e) => setNewPaSymbol(e.target.value)}
                      className="w-full bg-[#050505] text-[9.5px] text-white/90 border border-white/10 rounded px-1 py-1 outline-none focus:border-emerald-500 font-mono cursor-pointer"
                    >
                      {Object.keys(FRIENDLY_NAMES).map((sym) => (
                        <option key={sym} value={sym}>{sym}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] uppercase font-semibold text-white/40 block mb-1 font-mono">Event Type</label>
                    <select
                      value={newPaType}
                      onChange={(e) => setNewPaType(e.target.value as 'BREAKING_OB' | 'FVG_TAP')}
                      className="w-full bg-[#050505] text-[9.5px] text-white/90 border border-white/10 rounded px-1 py-1 outline-none focus:border-emerald-500 font-mono cursor-pointer"
                    >
                      <option value="BREAKING_OB">OB Break</option>
                      <option value="FVG_TAP">FVG Tap</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] uppercase font-semibold text-white/40 block mb-1 font-mono">Direction</label>
                    <select
                      value={newPaDirection}
                      onChange={(e) => setNewPaDirection(e.target.value as 'BULLISH' | 'BEARISH' | 'ANY')}
                      className="w-full bg-[#050505] text-[9.5px] text-white/90 border border-white/10 rounded px-1 py-1 outline-none focus:border-emerald-500 font-mono cursor-pointer"
                    >
                      <option value="ANY">Any Zone</option>
                      <option value="BULLISH">Bullish Only</option>
                      <option value="BEARISH">Bearish Only</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-500/60 transition-all rounded py-1.5 text-[9.5px] font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 pointer-events-auto"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  Configure PA Alert
                </button>
              </form>

              {/* List of custom Price-Action Trend Alert rules */}
              <div className="flex-grow overflow-y-auto p-3.5 space-y-3 custom-scrollbar min-h-0">
                <div className="text-[9px] uppercase font-bold tracking-wider text-emerald-400/80 block mb-1 flex items-center justify-between">
                  <span>PA Trend Rules ({priceActionAlerts.length})</span>
                  {priceActionAlerts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Delete all Custom Price Action Alerts?")) {
                          setPriceActionAlerts([]);
                        }
                      }}
                      className="text-[8px] text-rose-500 hover:text-rose-400 uppercase tracking-tight cursor-pointer font-bold"
                    >
                      Clear Rules
                    </button>
                  )}
                </div>

                {priceActionAlerts.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-white/5 rounded px-2">
                    <span className="text-[9.5px] text-white/35 italic block leading-relaxed select-none">
                      No tactical price action alerts configured. Toggle settings above to establish smart indicators.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {priceActionAlerts.map((alert) => {
                      const isCur = alert.symbol === symbol;
                      return (
                        <div
                          key={alert.id}
                          className={`p-2 bg-white/[0.01] border hover:bg-white/[0.02] transition-all rounded ${
                            alert.isTriggered
                              ? 'border-emerald-500/10 opacity-60 bg-black/20'
                              : alert.isActive
                                ? 'border-emerald-500/25 bg-black/40'
                                : 'border-white/5 opacity-55'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1 select-none">
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${isCur ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                                {alert.symbol}
                              </span>
                              <span className="text-[7.5px] text-white/50 font-mono uppercase tracking-tight font-black">
                                {alert.type === 'BREAKING_OB' ? 'OB BREAK' : 'FVG TAP'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleTogglePaAlertActive(alert.id)}
                                className={`text-[8.5px] uppercase font-bold tracking-tight px-1 py-0.5 rounded transition-all cursor-pointer border ${
                                  alert.isActive
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/30 font-extrabold'
                                    : 'bg-white/5 text-white/35 border-white/5 hover:bg-white/10'
                                }`}
                              >
                                {alert.isTriggered ? 'TRIGGERED' : alert.isActive ? 'ACTIVE' : 'MUTED'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePaAlert(alert.id)}
                                className="p-0.5 hover:bg-rose-500/10 hover:text-rose-400 text-white/20 hover:text-rose-400 rounded transition-all cursor-pointer"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-[9.5px] text-white/70 font-sans mt-0.5 flex items-center justify-between select-none">
                            <span>
                              Check {alert.direction === 'ANY' ? 'any' : alert.direction.toLowerCase()} instances
                            </span>
                            {alert.lastTriggeredTime && (
                              <span className="text-[7.5px] text-emerald-400 italic font-mono font-bold">Hit: {alert.lastTriggeredTime}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* PERSISTENT TOASTS HISTORY INBOX IN DRAWER */}
                <div className="pt-3 border-t border-white/10 mt-2 pb-4">
                  <div className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 block mb-2 flex items-center justify-between">
                    <span>Persistent Toasts Inbox ({persistentToasts.length})</span>
                    {persistentToasts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Clear all persistent toast notifications history?")) {
                            setPersistentToasts([]);
                          }
                        }}
                        className="text-[8px] text-rose-500 hover:text-rose-400 uppercase tracking-tight cursor-pointer font-bold"
                      >
                        Clear Inbox
                      </button>
                    )}
                  </div>

                  {persistentToasts.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-white/5 rounded px-2 bg-black/[0.15]">
                      <span className="text-[9px] text-white/25 italic block leading-relaxed select-none">
                        No custom trend alerts triggered yet. Price action crossings will register persistent items here.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                      {persistentToasts.map((toast) => (
                        <div
                          key={toast.id}
                          className={`p-2 bg-black/45 hover:bg-white/[0.01] border rounded flex flex-col gap-0.5 relative transition-all text-left ${
                            toast.type === 'success' ? 'border-emerald-500/15' : 'border-amber-500/15'
                          }`}
                        >
                          <div className="flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center space-x-1.5 select-none">
                              <span className={`text-[7px] font-black tracking-wider px-1 py-0.5 rounded leading-none ${
                                toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {toast.badge}
                              </span>
                              <span className="text-[8.5px] text-white/80 font-mono font-bold">{toast.symbol}</span>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => setPersistentToasts(prev => prev.filter(t => t.id !== toast.id))}
                              className="text-white/35 hover:text-rose-400 font-bold hover:bg-white/5 rounded px-1 cursor-pointer transition-colors text-[9px] leading-none"
                              title="Dismiss alert history"
                            >
                              ×
                            </button>
                          </div>

                          <p className="text-[8.5px] text-white/60 leading-normal font-sans pr-4 select-text">
                            {toast.message}
                          </p>
                          
                          <div className="text-[7.5px] text-white/30 text-right select-none font-mono">
                            {toast.timestamp}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pane 2: Recharts RSI Panel */}
      {!isFullscreen && (
        <div className="px-6 py-3 border-t border-white/10 bg-[#0c0c0c]/20">
        <div className="flex items-center justify-between pb-1 text-xs text-white/40 font-mono">
          <div className="flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Relative Strength Index (RSI 14)</span>
          </div>
          <span className="font-bold text-white/60">
            Current: {metrics.rsi} (Limit thresholds: Overbought 70% | Oversold 30%)
          </span>
        </div>

        <div className="w-full h-16 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rsiChartData} margin={{ top: 2, right: 70, left: 20, bottom: 2 }}>
              <defs>
                <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="index" hide />
              <YAxis domain={[10, 90]} hide />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const value = Number(payload[0].value);
                    const isOverbought = value >= 70;
                    const isOversold = value <= 30;
                    const borderAccent = isOverbought 
                      ? 'border-rose-500/50 border-l-2 border-l-rose-500' 
                      : isOversold 
                        ? 'border-emerald-500/50 border-l-2 border-l-emerald-500'
                        : 'border-indigo-500/50 border-l-2 border-l-indigo-500';
                    return (
                      <div className={`bg-[#0c0c0e] border ${borderAccent} px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-white/90 shadow-[0_12px_32px_rgba(0,0,0,0.85)]`}>
                        RSI: <span className="text-indigo-400 font-extrabold">{payload[0].value}</span>
                        {isOverbought && <span className="text-[8px] text-rose-400 font-bold block mt-0.5 uppercase tracking-wide">Overbought</span>}
                        {isOversold && <span className="text-[8px] text-emerald-400 font-bold block mt-0.5 uppercase tracking-wide">Oversold</span>}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Reference thresholds */}
              <ReferenceLine y={70} stroke="#f43f5e" strokeWidth={0.5} strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#10b981" strokeWidth={0.5} strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="rsi"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#rsiGradient)"
                strokeWidth={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* Footer Info Ledger */}
      {!isFullscreen && (
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/10 bg-[#0c0c0c]/40 p-4 divide-x divide-white/5 font-mono text-center">
        <div className="py-1">
          <span className="text-white/35 text-[10px] block uppercase font-mono tracking-tight">Average True Range</span>
          <span className="text-white/90 text-sm font-semibold">{metrics.atr.toFixed(symbol === 'BTC/USDT' ? 0 : 5)}</span>
        </div>
        <div className="py-1">
          <span className="text-white/35 text-[10px] block uppercase font-mono tracking-tight">Plotted FVGs</span>
          <span className="text-white/90 text-sm font-semibold">{fvgs.filter(f => !f.isMitigated).length} Open</span>
        </div>
        <div className="py-1">
          <span className="text-white/35 text-[10px] block uppercase font-mono tracking-tight">Active OB blocks</span>
          <span className="text-white/90 text-sm font-semibold">{obs.filter(o => !o.isBroken).length} Intact</span>
        </div>
        <div className="py-1">
          <span className="text-white/35 text-[10px] block uppercase font-mono tracking-tight">MSS Sweeps</span>
          <span className="text-white/90 text-sm font-semibold">{sweeps.length} Detected</span>
        </div>
      </div>
      )}
    </div>
  );

  if (isFullscreen) {
    const portalTarget = typeof document !== 'undefined' ? document.body : null;
    return (
      <>
        {/* Placeholder inside inline layout to preserve exact spatial layout of dashboard */}
        <div 
          id="chart-placeholder"
          className="w-full bg-[#0a0a0c]/20 border border-dashed border-white/5 rounded-lg h-[420px] md:h-[500px]"
        />
        {isMounted && portalTarget && typeof createPortal === 'function'
          ? createPortal(chartMainContent, portalTarget)
          : chartMainContent}
      </>
    );
  }

  return chartMainContent;
}
