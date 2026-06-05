/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Candlestick, FVG, OrderBlock, LiquiditySweep, MarketMetrics, Trade, NewsEvent } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Eye, TrendingUp, HelpCircle, Activity, Plus, Minus, Bell, Volume2, VolumeX, Trash2, X, Sliders } from 'lucide-react';

const FRIENDLY_NAMES: Record<string, string> = {
  'EUR/USD': 'Euro / U.S. Dollar',
  'GBP/USD': 'Great Britain Pound / U.S. Dollar',
  'USD/JPY': 'U.S. Dollar / Japanese Yen',
  'BTC/USDT': 'Bitcoin / TetherUS',
  'GOLD/USD': 'Gold Spot / U.S. Dollar',
};

const FEED_SOURCES: Record<string, string> = {
  'EUR/USD': 'OANDA',
  'GBP/USD': 'OANDA',
  'USD/JPY': 'OANDA',
  'BTC/USDT': 'BINANCE',
  'GOLD/USD': 'LMAX',
};

const FLAG_EMOJIS: Record<string, { f1: string; f2: string }> = {
  'EUR/USD': { f1: '🇪🇺', f2: '🇺🇸' },
  'GBP/USD': { f1: '🇬🇧', f2: '🇺🇸' },
  'USD/JPY': { f1: '🇺🇸', f2: '🇯🇵' },
  'BTC/USDT': { f1: '🪙', f2: '🇺🇸' },
  'GOLD/USD': { f1: '🪙', f2: '🇺🇸' },
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

interface ChartContainerProps {
  symbol: string;
  candles: Candlestick[];
  fvgs: FVG[];
  obs: OrderBlock[];
  sweeps: LiquiditySweep[];
  metrics: MarketMetrics;
  onLogEventToAdvisor?: (timestamp: string, price: number) => void;
  trades?: Trade[];
  onTradeExecuted?: () => void;
  newsEvents?: NewsEvent[];
}

export default function ChartContainer({
  symbol,
  candles,
  fvgs,
  obs,
  sweeps,
  metrics,
  onLogEventToAdvisor,
  trades = [],
  onTradeExecuted,
  newsEvents = [],
}: ChartContainerProps) {
  const [hoveredCandle, setHoveredCandle] = useState<Candlestick | null>(null);
  const [showFVG, setShowFVG] = useState(true);
  const [showOB, setShowOB] = useState(true);
  const [showLiquidityMap, setShowLiquidityMap] = useState(true);
  const [cursorY, setCursorY] = useState<number | null>(null);
  const [cursorPrice, setCursorPrice] = useState<number | null>(null);
  const [showIndicators, setShowIndicators] = useState(true);
  const [showNewsOverlay, setShowNewsOverlay] = useState(true);
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

  const [isDrawingPriceAlert, setIsDrawingPriceAlert] = useState(false);
  const [hoveredY, setHoveredY] = useState<number | null>(null);
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

  // Escape key drawing-mode cancel listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawingPriceAlert(false);
        setHoveredY(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // SVG dimensions for candlestick pane
  const width = 800;
  const height = 360;
  const padding = { top: 20, right: 70, bottom: 30, left: 20 };

  // Constrain visibleCount and offset based on current candles
  const actualVisibleCount = Math.min(visibleCount, candles.length || 40);
  const maxOffset = Math.max(0, candles.length - actualVisibleCount);
  const actualOffset = Math.min(offset, maxOffset);

  const endIndex = candles.length > 0 ? candles.length - 1 - actualOffset : 0;
  const startIndex = Math.max(0, endIndex - actualVisibleCount + 1);

  // Filter visible candles for dynamic Y-axis scaling
  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    return candles.slice(startIndex, endIndex + 1);
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

  const xStep = useMemo(() => {
    return (width - padding.left - padding.right) / (actualVisibleCount || 1);
  }, [actualVisibleCount, padding.left, padding.right]);

  // Convert price coordinate to SVG container height based on shifted startIndex
  const getX = (index: number) => {
    return padding.left + (index - startIndex) * xStep + xStep / 2;
  };

  const getY = (price: number) => {
    const range = priceLimits.max - priceLimits.min;
    if (range === 0) return height / 2;
    const ratio = (price - priceLimits.min) / range;
    return height - padding.bottom - ratio * (height - padding.top - padding.bottom);
  };

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
      return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${d.getUTCHours()}:00`;
    } catch {
      return '';
    }
  };

  // Price ticks on right axis matching current dynamic price limits
  const priceTicks = useMemo(() => {
    const ticks = [];
    const step = (priceLimits.max - priceLimits.min) / 5;
    for (let i = 0; i <= 5; i++) {
      ticks.push(priceLimits.min + i * step);
    }
    return ticks;
  }, [priceLimits]);

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
  }, [candles, startIndex, xStep, priceLimits]);

  const smaPath = useMemo(() => {
    return candles
      .map((c, idx) => {
        if (!c.sma200) return '';
        const x = getX(idx);
        const y = getY(c.sma200);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [candles, startIndex, xStep, priceLimits]);

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

    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartOffset(offset);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    
    if (relativeY >= padding.top && relativeY <= height - padding.bottom) {
      setCursorY(relativeY);
      setCursorPrice(getPriceFromY(relativeY));
    } else {
      setCursorY(null);
      setCursorPrice(null);
    }

    if (isDrawingPriceAlert) {
      if (relativeY >= padding.top && relativeY <= height - padding.bottom) {
        setHoveredY(relativeY);
      } else {
        setHoveredY(null);
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
  };

  return (
    <div id="chart-container-root" className="bg-[#080808] border border-white/10 rounded overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      {/* Consolidated Institutional Terminal Header */}
      <div id="chart-consolidated-header" className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/10 bg-[#0c0c0c]/85 select-none">
        
        {/* Left Hand Indicator: Pair and Info Stream */}
        <div className="flex items-center space-x-3.5">
          {/* Overlapping Flags Representation */}
          <div className="relative w-8 h-8 flex items-center shrink-0">
            <span className="text-xl absolute left-0 top-0 select-none drop-shadow">
              {symbolEmoji.f1}
            </span>
            <span className="text-xl absolute right-1 bottom-0 select-none drop-shadow z-10 font-sans">
              {symbolEmoji.f2}
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-sans leading-none">
              <span id="tv-pair-heading" className="font-extrabold text-[16px] sm:text-[18px] text-white tracking-tight">{symbol} 4H Stream</span>
              <span className="text-white/40 text-sm">•</span>
              <span className="text-xs text-white/80 font-mono tracking-tight font-semibold flex items-center">
                {pairName}
              </span>
            </div>
            
            {/* Stream & Confluence Metadata */}
            <p className="text-[10.5px] text-white/45 font-mono mt-1 flex flex-wrap items-center gap-1.5 leading-none">
              <span>Live Price Action</span>
              <span className="text-white/25">•</span>
              <span>HTF Confluence</span>
              <span className="text-white/25">•</span>
              {isMt5Active ? (
                <span className="flex items-center text-emerald-400 font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[9px]">
                  <span className="h-1 w-1 rounded bg-emerald-400 mr-1 animate-ping shrink-0" />
                  MT5 LIVE
                </span>
              ) : (
                <span className="text-indigo-400 font-bold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[9px]">{feedSource} FEED</span>
              )}
            </p>
          </div>
        </div>

        {/* Center: Realtime SELL / BUY Interactive Rates Container */}
        <div className="flex items-center space-x-2 font-sans md:mx-auto">
          {/* SELL BUTTON */}
          <div className="relative flex flex-col items-center">
            <div className={`px-3.5 py-1 bg-[#050505] border ${
              lastTickDir === 'DOWN' ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_12px_rgba(239,68,68,0.15)]' : 'border-rose-500/20'
            } rounded transition-all duration-150 w-[96px] text-center flex flex-col justify-center leading-none hover:border-rose-500/60 cursor-pointer`}>
              <div id="tv-sell-rate" className="text-rose-500 font-bold text-[13px] font-mono tracking-tight flex items-baseline justify-center">
                <span>{formattedSell.substring(0, formattedSell.length - 1)}</span>
                <span className="text-[10px] font-extrabold">{formattedSell.substring(formattedSell.length - 1)}</span>
              </div>
              <span className="text-[7.5px] uppercase tracking-wider font-bold text-rose-500/50 mt-0.5">SELL</span>
            </div>
          </div>

          {/* SPREAD INDICATOR */}
          <div className="flex flex-col items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-white/45 border border-white/5 bg-[#050505] rounded min-w-[48px] h-[34px]">
            <span className="text-[7px] uppercase tracking-tighter text-white/30 font-sans block leading-none">Spread</span>
            <span id="tv-spread-val" className="text-[#999999] text-[10px] font-bold leading-none mt-0.5">{liveSpread.toFixed(1)}</span>
          </div>

          {/* BUY BUTTON */}
          <div className="relative flex flex-col items-center">
            <div className={`px-3.5 py-1 bg-[#050505] border ${
              lastTickDir === 'UP' ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_12px_rgba(14,165,233,0.15)]' : 'border-sky-500/20'
            } rounded transition-all duration-150 w-[96px] text-center flex flex-col justify-center leading-none hover:border-sky-500/60 cursor-pointer`}>
              <div id="tv-buy-rate" className="text-sky-500 font-bold text-[13px] font-mono tracking-tight flex items-baseline justify-center">
                <span>{formattedBuy.substring(0, formattedBuy.length - 1)}</span>
                <span className="text-[10px] font-extrabold">{formattedBuy.substring(formattedBuy.length - 1)}</span>
              </div>
              <span className="text-[7.5px] uppercase tracking-wider font-bold text-sky-500/50 mt-0.5">BUY</span>
            </div>
          </div>
        </div>

        {/* Right Hand: Ticking Stats + Multi-Layer Overlays Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Feed Ticking rate metric */}
          <div className="bg-[#050505] border border-white/5 rounded px-2.5 py-1 flex items-center space-x-2 font-mono h-[34px]">
            <span className="text-[8.5px] text-white/40 uppercase tracking-wider flex items-center leading-none">
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${lastTickDir === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              Ticks
            </span>
            <span id="tv-ticks-live" className="text-[11px] font-mono text-emerald-400/95 font-bold leading-none">
              {(ticksCount / 1000).toFixed(1)}K
            </span>
          </div>

          {/* Quick Indicator Control Dock */}
          <div className="flex items-center space-x-1 p-1 bg-[#050505] rounded border border-white/5 h-[34px]">
            <button
              id="toggle-fvg"
              onClick={() => setShowFVG(!showFVG)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all font-bold cursor-pointer h-full flex items-center justify-center ${
                showFVG 
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
              }`}
              title="Fair Value Gap Imbalances"
            >
              FVG
            </button>
            <button
              id="toggle-ob"
              onClick={() => setShowOB(!showOB)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all font-bold cursor-pointer h-full flex items-center justify-center ${
                showOB 
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30' 
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
              }`}
              title="Institutional Order Blocks"
            >
              OB
            </button>
            <button
              id="toggle-indicators"
              onClick={() => setShowIndicators(!showIndicators)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all font-bold cursor-pointer h-full flex items-center justify-center ${
                showIndicators 
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' 
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
              }`}
              title="50 EMA & 200 SMA Confluence Lines"
            >
              EMA/SMA
            </button>
            <button
              id="toggle-news-overlay"
              onClick={() => setShowNewsOverlay(!showNewsOverlay)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all font-bold cursor-pointer h-full flex items-center justify-center ${
                showNewsOverlay 
                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30' 
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
              }`}
              title="Overlay Macro News flags on the chart timeline"
            >
              NEWS
            </button>
            <button
              id="toggle-liquidity-map"
              onClick={() => setShowLiquidityMap(!showLiquidityMap)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all font-bold cursor-pointer h-full flex items-center justify-center ${
                showLiquidityMap 
                  ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30' 
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
              }`}
              title="Liquidity pools stop-loss density heatmap (swing extrema)"
            >
              LIQ MAP
            </button>
          </div>

          {/* Visual ALERT DRAW INITIATOR Tool Button */}
          <button
            id="toggle-draw-alert"
            onClick={() => {
              setIsDrawingPriceAlert(!isDrawingPriceAlert);
              if (!isDrawingPriceAlert) {
                setIsAlertsOpen(true); // Auto-open the sidebar drawer to show the visual alerts checklist
              }
            }}
            className={`px-3 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer h-[34px] border transition-all pointer-events-auto shrink-0 ${
              isDrawingPriceAlert
                ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] font-bold animate-pulse'
                : 'bg-[#050505] text-white/50 hover:text-white/80 border-white/10 hover:bg-white/5'
            }`}
            title="Click here, then click anywhere on the chart canvas to set a horizontal price level crossing alert (ESC to cancel)"
          >
            <Bell className={`w-3.5 h-3.5 ${isDrawingPriceAlert ? 'text-black stroke-[2.5px]' : 'text-white/45'}`} />
            <span className="uppercase tracking-tight text-[10px]">
              {isDrawingPriceAlert ? 'MAPPING LEVEL...' : 'Set Alert Line'}
            </span>
          </button>

          {/* Smart Alerts Trigger Button */}
          <button
            id="toggle-smart-alerts"
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className={`px-3 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer h-[34px] border transition-all pointer-events-auto ${
              isAlertsOpen 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                : 'bg-[#050505] text-white/50 hover:text-white/80 border-white/10 hover:bg-white/5'
            }`}
            title="Configure Smart Alerts (Proximity to EMA)"
          >
            <Sliders className={`w-3.5 h-3.5 ${isAlertsOpen ? 'text-amber-300' : 'text-white/45'}`} />
            <span className="uppercase tracking-tight text-[10px]">Alerts ({smartAlerts.filter(a => a.isActive).length})</span>
          </button>
        </div>

      </div>

      {/* Main Candlestick Frame */}
      <div className="relative p-4 md:p-6 pb-2 min-h-[380px] select-none">
        {/* Dynamic OHLCAV Info Strip */}
        <div className="absolute top-6 left-6 z-10 flex flex-wrap gap-x-4 gap-y-1 bg-[#050505]/90 backdrop-blur border border-white/10 px-4 py-2 rounded font-mono text-xs shadow-lg max-w-[90%] pointer-events-none">
          {hoveredCandle ? (
            <>
              <span className="text-white/40 font-mono">Time: <span className="text-indigo-400 font-bold">{formatIndexTime(hoveredCandle.timestamp)}</span></span>
              <span className="text-white/40 font-mono">O: <span className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{hoveredCandle.open}</span></span>
              <span className="text-white/40 font-mono">H: <span className="text-white/90">{hoveredCandle.high}</span></span>
              <span className="text-white/40 font-mono">L: <span className="text-white/90">{hoveredCandle.low}</span></span>
              <span className="text-white/40 font-mono">C: <span className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{hoveredCandle.close}</span></span>
              <span className="text-white/40 font-mono">V: <span className="text-white/60">{hoveredCandle.volume}</span></span>
            </>
          ) : (
            <>
              <span className="text-white uppercase font-bold tracking-wider">Trend Bias:</span>
              <span className={metrics.dailyBias === 'BULLISH' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                Institutional {metrics.dailyBias} (50 EMA)
              </span>
              <span className="text-white/20">|</span>
              <div className="flex items-center space-x-2.5">
                <span className="text-white/40 font-mono text-[10px] uppercase tracking-wider">EMA GAP:</span>
                <span className="text-white font-mono text-[10.5px] font-semibold">{trendIntensity.displayDistance}</span>
                <div className="relative flex items-center">
                  <div 
                    id="trend-gauge-track" 
                    onMouseEnter={() => setIsGaugeHovered(true)}
                    onMouseLeave={() => setIsGaugeHovered(false)}
                    className="w-16 sm:w-20 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5 relative flex items-center cursor-help pointer-events-auto"
                  >
                    <div 
                      id="trend-gauge-fill" 
                      className={`h-full rounded-full transition-all duration-300 ${
                        metrics.dailyBias === 'BULLISH' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${trendIntensity.percent}%` }}
                    />
                  </div>
                  {isGaugeHovered && (
                    <div 
                      id="gauge-tooltip"
                      className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 bg-[#0c0c0c]/95 backdrop-blur-md border border-white/10 px-3 py-2 rounded shadow-[0_8px_24px_rgba(0,0,0,0.9)] text-[10px] whitespace-nowrap z-[100] flex flex-col items-center gap-1 min-w-[130px]"
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="text-white/40 font-mono uppercase tracking-wider text-[8.5px]">50 EMA Gap:</span>
                        <span className="font-bold font-mono text-white">{trendIntensity.displayDistance}</span>
                      </div>
                      <div className="flex items-center justify-between w-full gap-2 border-t border-white/5 pt-1">
                        <span className="text-white/40 font-mono uppercase tracking-wider text-[8.5px]">Trend Bias:</span>
                        <span className={`font-extrabold uppercase font-mono tracking-wider ${
                          metrics.dailyBias === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {metrics.dailyBias}
                        </span>
                      </div>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="text-white/40 font-mono uppercase tracking-wider text-[8.5px]">Strength:</span>
                        <span className={`font-black font-mono tracking-wider ${
                          metrics.dailyBias === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {trendIntensity.percent}% {trendIntensity.label}
                        </span>
                      </div>
                      <div className="w-1.5 h-1.5 bg-[#0c0c0c] border-r border-b border-white/10 rotate-45 absolute top-[calc(100%-4px)] left-1/2 -translate-x-1/2" />
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-mono font-extrabold ${
                  metrics.dailyBias === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {trendIntensity.percent}% {trendIntensity.label}
                </span>
                <button
                  id="audible-alarm-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsAlarmEnabled(!isAlarmEnabled);
                  }}
                  className={`pointer-events-auto p-1 rounded border transition-all cursor-pointer flex items-center gap-1 h-5 ${
                    isAlarmEnabled 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 font-bold' 
                      : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60'
                  }`}
                  title={isAlarmEnabled ? "Audible momentum alarm is active (>80% threshold)" : "Enable audible alarm for high-conviction momentum"}
                >
                  {isAlarmEnabled ? (
                    <Volume2 className="w-3 h-3 text-amber-300 animate-pulse shrink-0" />
                  ) : (
                    <VolumeX className="w-3 h-3 text-white/40 shrink-0" />
                  )}
                  <span className="text-[7.5px] font-mono font-bold uppercase tracking-wider leading-none">
                    {isAlarmEnabled ? 'ALARM: ON' : 'ALARM: OFF'}
                  </span>
                </button>
              </div>
              <span className="text-white/20">|</span>
              {trendIntensity.percent >= 70 ? (
                <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-[9.5px] text-amber-300 font-mono font-bold tracking-tight animate-pulse transition-all">
                  <span id="mean-reversion-pulse" className="flex items-center space-x-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                    </span>
                    <span>MEAN REVERSION SIGNAL (OVEREXTENDED)</span>
                  </span>
                  <button
                    id="log-backtest-bell"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (!onLogEventToAdvisor) return;
                      const activePrice = hoveredCandle ? hoveredCandle.close : (typeof livePrice !== 'undefined' ? livePrice : basePrice);
                      const activeTimestamp = hoveredCandle ? hoveredCandle.timestamp : (lastCandle ? lastCandle.timestamp : new Date().toISOString());
                      onLogEventToAdvisor(activeTimestamp, activePrice);
                    }}
                    className="ml-1 p-0.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-400 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 pointer-events-auto"
                    title="Log current timestamp and price to Advisor Chat"
                  >
                    <Bell className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <span className="text-white/40 font-serif italic">Hover over candles for metrics</span>
              )}

              {imminentHighImpactNews.length > 0 && (
                <>
                  <span className="text-white/20">|</span>
                  <div className="flex flex-wrap gap-1.5 items-center pointer-events-auto select-none">
                    {imminentHighImpactNews.slice(0, 2).map((news, idx) => {
                      const evTime = new Date(news.time);
                      const target = new Date('2026-06-01T10:21:59Z');
                      const diffMinutes = Math.round((evTime.getTime() - target.getTime()) / (1000 * 60));
                      const hours = Math.floor(diffMinutes / 60);
                      const mins = diffMinutes % 60;
                      const displayTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                      
                      return (
                        <div
                          key={`warn-${idx}`}
                          className="flex items-center space-x-1.5 bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 rounded text-[9.5px] text-rose-300 font-sans font-bold tracking-tight animate-pulse cursor-help"
                          title={`${news.currency} ${news.title} ${news.impact} Impact Macroeconomic Event Scheduled in ${displayTime}.`}
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                          </span>
                          <span className="font-mono uppercase">🚨 {news.currency} {news.title} IN {displayTime}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Responsive Candlestick Canvas SVG */}
        <div 
          className="w-full h-[360px] overflow-hidden rounded bg-[#050505]/50 border border-white/5 relative"
          onWheel={handleWheel}
        >
          {/* Draw Mode Info Ribbon overlaying chart */}
          {isDrawingPriceAlert && (
            <div className="absolute top-4 left-1/2 -track-translate-x-1/2 -translate-x-1/2 z-[110] bg-amber-500 text-black font-sans text-[10px] font-black px-4 py-2 rounded-full shadow-2xl border border-amber-300 flex items-center space-x-2 animate-bounce select-none pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-[#050505] animate-ping" />
              <span className="uppercase tracking-wider">Left-click on the chart to lock an alert (ESC to cancel)</span>
            </div>
          )}

          {/* Floating Triggered Alert Banners */}
          {triggeredAlertBanners.length > 0 && (
            <div className="absolute bottom-4 left-4 z-[120] space-y-2 pointer-events-auto max-w-[280px]">
              {triggeredAlertBanners.slice(-3).map((banner) => (
                <div 
                  key={banner.id}
                  className="bg-[#0c0c0d]/95 border border-amber-500/60 p-3 rounded-lg shadow-2xl flex items-start space-x-2.5 animate-fadeIn backdrop-blur-md"
                >
                  <div className="p-1 bg-amber-500/10 rounded text-amber-400 shrink-0 mt-0.5 animate-bounce">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 font-mono text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-black uppercase text-[10px] tracking-tight">{banner.symbol} Level Alert!</span>
                      <button 
                        onClick={() => setTriggeredAlertBanners(prev => prev.filter(b => b.id !== banner.id))}
                        className="text-white/40 hover:text-white font-bold ml-1"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-white/70 mt-1 leading-normal font-sans text-[9.5px]">
                      Price crossed {banner.type === 'CROSS_UP' ? 'above' : 'below'} your target of <span className="text-amber-400 font-bold">{banner.price}</span>.
                    </p>
                    <span className="text-white/35 text-[8px] block mt-1">{banner.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className={`w-full h-full font-mono text-[9px] fill-white/20 stroke-white/20 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
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
            </defs>

            {/* Grid Lines */}
            {priceTicks.map((tick, idx) => (
              <g key={`grid-${idx}`}>
                <line
                  x1={padding.left}
                  y1={getY(tick)}
                  x2={width - padding.right}
                  y2={getY(tick)}
                  className="stroke-white/[0.04]"
                  strokeDasharray="4,4"
                />
                <text
                  x={width - padding.right + 8}
                  y={getY(tick) + 3}
                  className="fill-white/40 font-medium font-sans"
                >
                  {tick.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 4)}
                </text>
              </g>
            ))}

            {/* Time Grid Lines (e.g., every 8 candles) */}
            {candles.map((c, idx) => {
              if (idx % 8 === 0) {
                const x = getX(idx);
                // Only render if within the visible boundary thresholds
                if (x < padding.left || x > width - padding.right) return null;

                const d = new Date(c.timestamp);
                const hour = d.getUTCHours();
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

                return (
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
                    {/* Date and Hour tag */}
                    <text
                      x={x - 20}
                      y={height - padding.bottom + 12}
                      className="fill-white/40 font-mono text-[9px] select-none"
                    >
                      {formatIndexTime(c.timestamp).split(' ')[0]} {hour.toString().padStart(2, '0')}:00
                    </text>
                    {/* Session Dot and Name */}
                    <text
                      x={x - 20}
                      y={height - padding.bottom + 23}
                      className={`font-sans font-bold text-[8.5px] uppercase tracking-wider select-none ${sessionColor}`}
                    >
                      ● {sessionName}
                    </text>
                  </g>
                );
              }
              return null;
            })}

            {/* Plot elements wrapped inside area clipping path */}
            <g clipPath="url(#chart-plot-area)">
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
              {showFVG &&
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

                  return (
                    <g key={`fvg-${fIdx}`}>
                      <rect
                        x={startX}
                        y={topY}
                        width={blockWidth}
                        height={Math.max(2, blockHeight)}
                        className={colorClass}
                        strokeWidth={1}
                        strokeDasharray={fvg.isMitigated ? '1,1' : 'none'}
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
              {showOB &&
                obs.map((ob, oIdx) => {
                  const obX = getX(ob.index);
                  const blockWidth = xStep * 4; // draw forward block representing validity
                  const topY = getY(ob.high);
                  const bottomY = getY(ob.low);
                  const blockHeight = bottomY - topY;

                  const colorClass = ob.type === 'BULLISH'
                    ? 'fill-indigo-500/10 stroke-indigo-500/20'
                    : 'fill-purple-500/10 stroke-purple-500/20';

                  return (
                    <g key={`ob-${ob.id}-${oIdx}`}>
                      <rect
                        x={obX}
                        y={topY}
                        width={blockWidth}
                        height={Math.max(2, blockHeight)}
                        className={colorClass}
                        strokeWidth={1}
                        strokeDasharray={ob.isBroken ? '2,2' : 'none'}
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

            {/* General Hover Crosshair and Liquidity Telemetry */}
            {!isDrawingPriceAlert && cursorY !== null && cursorPrice !== null && (
              (() => {
                const { type, density } = getLiquidityDensityAtPrice(cursorPrice);
                const isHighDensity = density > 0.15;
                const labelBg = type === 'BSL' ? '#fbbf24' : type === 'SSL' ? '#8b5cf6' : '#27272a';
                const labelFg = type === 'BSL' || type === 'SSL' ? '#000000' : '#ffffff';
                const densityPercent = Math.round(density * 100);
                const densityLabel = type !== 'NONE' ? ` ${type}(${densityPercent}%)` : '';
                
                return (
                  <g className="pointer-events-none">
                    {/* Horizontal crosshair */}
                    <line
                      x1={padding.left}
                      y1={cursorY}
                      x2={width - padding.right}
                      y2={cursorY}
                      stroke={isHighDensity ? labelBg : '#ffffff'}
                      strokeWidth={0.5}
                      strokeDasharray="2,2"
                      opacity={isHighDensity ? 0.7 : 0.3}
                    />
                    
                    {/* Crosshair tag background */}
                    <rect
                      x={width - padding.right + 4}
                      y={cursorY - 8}
                      width={112}
                      height={16}
                      rx={2}
                      fill={labelBg}
                      opacity={0.9}
                    />
                    
                    {/* Crosshair tag text */}
                    <text
                      x={width - padding.right + 8}
                      y={cursorY + 3.5}
                      fill={labelFg}
                      fontSize="8.5px"
                      fontWeight="bold"
                      textAnchor="start"
                      className="font-mono"
                    >
                      {cursorPrice.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 5)}{densityLabel}
                    </text>
                  </g>
                );
              })()
            )}
          </svg>

          {/* Floating Zoom & Pan HUD in the bottom left of the chart area */}
          <div className="absolute bottom-10 left-6 z-10 flex items-center space-x-1 bg-[#050505]/95 backdrop-blur border border-white/10 p-1.5 rounded shadow-lg">
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
            {(offset > 0 || visibleCount < (candles.length || 40)) && (
              <span className="text-[8px] text-indigo-400 font-mono font-bold px-1.5 animate-pulse select-none uppercase tracking-wider">
                Zoomed
              </span>
            )}
          </div>

          {/* Floated Visual Backtesting News Details Tooltip */}
          {hoveredNews && (
            <div 
              className="absolute bg-[#0b0b0c]/95 border border-rose-500/40 p-3 rounded-md shadow-[0_4px_22px_rgba(244,63,94,0.18)] z-[110] font-mono text-[10.5px] text-white select-none backdrop-blur-md pointer-events-none w-[240px]"
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
                <span className="text-[9px] text-white/40">{new Date(hoveredNews.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
        </div>

        {/* Smart Alerts Sidebar Drawer */}
        <div 
          id="smart-alerts-drawer"
          className={`absolute top-0 right-0 bottom-0 w-[310px] sm:w-[350px] bg-[#0c0c0c]/98 border-l border-white/10 z-[100] flex flex-col shadow-[-12px_0_40px_rgba(0,0,0,0.95)] transition-all duration-300 transform font-mono pointer-events-auto h-full ${
            isAlertsOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
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
                  <option value="EUR/USD">EUR/USD</option>
                  <option value="GBP/USD">GBP/USD</option>
                  <option value="USD/JPY">USD/JPY</option>
                  <option value="BTC/USDT">BTC/USDT</option>
                  <option value="GOLD/USD">GOLD/USD</option>
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
          </div>
        </div>
      </div>

      {/* Pane 2: Recharts RSI Panel */}
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
                    return (
                      <div className="bg-[#050505] border border-white/10 px-2 py-1 rounded text-[10px] font-mono text-white/80">
                        RSI: <span className="text-indigo-400 font-bold">{payload[0].value}</span>
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

      {/* Footer Info Ledger */}
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
    </div>
  );
}
