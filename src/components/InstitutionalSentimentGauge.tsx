/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MarketSymbol, NewsEvent } from '../types';
import { motion } from 'motion/react';
import { 
  Gauge, 
  HelpCircle, 
  Newspaper, 
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  Percent,
  Sliders,
  Scale,
  Building2,
  Calendar,
  Layers,
  Info
} from 'lucide-react';

interface AssetSentiment {
  symbol: MarketSymbol;
  overallScore: number;
  technicalScore: number;
  newsScore: number;
  state: 'Volatile' | 'Trending' | 'Mean Reverting';
  impactFactor: number;
  currentPrice: number;
  rsi: number;
  atr: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  imbalance: number;
  eventsCount: number;
}

interface SentimentResponse {
  sentiment: Record<string, AssetSentiment>;
  timestamp: string;
}

export default function InstitutionalSentimentGauge() {
  const [data, setData] = useState<SentimentResponse | null>(null);
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected asset
  const [selectedSymbol, setSelectedSymbol] = useState<MarketSymbol>('EUR/USD');

  // Multiplier weights
  const [newsWeight, setNewsWeight] = useState<number>(50);
  const [orderFlowWeight, setOrderFlowWeight] = useState<number>(50);

  // Simulated live tick updates for visual fidelity
  const [tick, setTick] = useState<number>(0);

  const symbols: MarketSymbol[] = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP',
    'GOLD/USD', 'SILVER/USD',
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
    'US30', 'NAS100', 'GER40', 'SPX500'
  ];

  // Fetch sentiment aggregates and經濟行事曆
  const fetchAllData = async () => {
    try {
      const [sentimentRes, eventsRes] = await Promise.all([
        fetch('/api/market-sentiment'),
        fetch('/api/forex-factory')
      ]);

      if (!sentimentRes.ok || !eventsRes.ok) {
        throw new Error('Failed to retrieve institutional intelligence data.');
      }

      const sentimentJson = await sentimentRes.json();
      const eventsJson = await eventsRes.json();

      setData(sentimentJson);
      setNewsEvents(eventsJson);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Sentiment aggregation endpoints failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Refresh to sync up with fast orderbook flow and macroeconomic updates
    const interval = setInterval(fetchAllData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Update a local tick loop for subtle simulated order book visual update flickers
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const activeAsset = useMemo(() => {
    return data?.sentiment[selectedSymbol] || null;
  }, [data, selectedSymbol]);

  // Filter economic events related to the active symbol
  const activeEvents = useMemo(() => {
    if (!selectedSymbol) return [];
    const parts = selectedSymbol.split('/');
    const baseCur = parts[0];
    const quoteCur = parts[1] || 'USD';

    return newsEvents.filter(ev => 
      ev.currency === baseCur || 
      ev.currency === quoteCur ||
      (selectedSymbol === 'BTC/USDT' && ev.currency === 'USD') ||
      (selectedSymbol === 'GOLD/USD' && ev.currency === 'USD')
    ).slice(0, 5); // display the top 5
  }, [newsEvents, selectedSymbol]);

  // Dynamic Synthesis Calculation
  const synthesisResult = useMemo(() => {
    if (!activeAsset) return { score: 50, label: 'NEUTRAL', colorClass: 'text-white/60', description: 'No active metric telemetry' };

    // Scale imbalance (-100 to +100) raw value into a 0 to 100 scale
    // e.g., -100 imbalance => 0 sentiment score, +100 imbalance => 100 sentiment score
    const flowScore = 50 + (activeAsset.imbalance / 2);
    const nScore = activeAsset.newsScore; // 15 to 85

    // Weighted mathematical average
    const totalWeight = newsWeight + orderFlowWeight;
    const finalScore = totalWeight > 0 
      ? Math.round(((nScore * newsWeight) + (flowScore * orderFlowWeight)) / totalWeight)
      : 50;

    let label = 'BALANCED EQUILIBRIUM';
    let colorClass = 'text-indigo-400';
    let badgeBg = 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300';
    let description = 'Macro intelligence events and low-latency order flow imbalance values are perfectly offset. Ideal ranging and high-tf channel containment zone.';

    if (finalScore >= 75) {
      label = 'INSTITUTIONAL ACCUMULATION / EXTREME BULLISH';
      colorClass = 'text-emerald-400';
      badgeBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
      description = 'Aggressive institutional buying detected! Strong bid-side imbalance aligned with highly favorable macro economic announcements. Pivot points protect entries.';
    } else if (finalScore >= 58) {
      label = 'BULLISH BLOCK SUPPORT';
      colorClass = 'text-emerald-300';
      badgeBg = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400/90';
      description = 'Moderate order flow defense. Sentiment registers passive accumulation with buyers front-running localized institutional order blocks.';
    } else if (finalScore <= 25) {
      label = 'INSTITUTIONAL DISTRIBUTION / EXTREME BEARISH';
      colorClass = 'text-rose-400';
      badgeBg = 'bg-rose-500/15 border-rose-500/30 text-rose-300';
      description = 'Aggressive institutional liquidation. Red-folder news panic or capital flow flight combined with deep ask-side real-time DOM imbalances.';
    } else if (finalScore <= 42) {
      label = 'BEARISH DISTRIBUTION INTRUSION';
      colorClass = 'text-rose-300';
      badgeBg = 'bg-rose-500/10 border-rose-500/20 text-rose-400/90';
      description = 'Moderate distribution pressure. Low liquidity support with brief moments of short hedging occurring near local resistance bands.';
    }

    return {
      score: finalScore,
      flowScore: Math.round(flowScore),
      newsScore: Math.round(nScore),
      label,
      colorClass,
      badgeBg,
      description
    };
  }, [activeAsset, newsWeight, orderFlowWeight]);

  // Convert score (0 - 100) to rotation angle for SVG speed needle (-90 to +90 degrees)
  const needleAngle = useMemo(() => {
    return -90 + (synthesisResult.score * 1.8);
  }, [synthesisResult.score]);

  // Simulated order book volume bars for micro context
  const bookVolumes = useMemo(() => {
    // Deterministic random-looking volumes based on active asset details so it changes nicely
    const imbalanceVal = activeAsset ? activeAsset.imbalance : 0;
    const baseBidVal = 50 + imbalanceVal * 0.4;
    const baseAskVal = 50 - imbalanceVal * 0.4;

    return Array.from({ length: 5 }).map((_, idx) => {
      // Create interesting level ranges
      const stepFactor = (idx + 1) * 0.15;
      const bidFlicker = Math.sin(tick + idx) * 4;
      const askFlicker = Math.cos(tick - idx) * 4;

      const bids = Math.max(10, Math.round((baseBidVal * (1 - stepFactor * 0.5)) + bidFlicker + 25));
      const asks = Math.max(10, Math.round((baseAskVal * (1 - stepFactor * 0.5)) + askFlicker + 25));
      const total = bids + asks;

      return {
        priceOffset: (idx + 1) * 1.5,
        bids,
        asks,
        bidPercent: Math.round((bids / total) * 100),
        askPercent: Math.round((asks / total) * 100),
      };
    });
  }, [activeAsset, tick]);

  return (
    <div id="institutional-sentiment-gauge-card" className="bg-[#0c0c0e]/95 border border-white/5 rounded-lg p-5 md:p-6 flex flex-col justify-between h-auto select-none mt-6">
      
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-500/10 pb-4 mb-4 gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 rounded border border-indigo-500/25 text-indigo-400 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
              Institutional Sentiment Gauge
              <span className="text-[8.5px] font-mono text-indigo-400 font-extrabold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/15">SMC COGNITION</span>
            </h3>
            <p className="text-[9.5px] text-white/40 font-sans mt-0.5">Dual-input synthesis of Macro Economic News Calendar events and Micro Level Order Flow imbalance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9.5px] font-mono text-white/30 hidden sm:inline">Active Symbol:</span>
          <select 
            id="gauge-symbol-select"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value as MarketSymbol)}
            className="bg-[#050505] text-[10.5px] text-indigo-200 border border-indigo-500/20 hover:border-indigo-500/40 rounded px-2.5 py-1.5 font-mono outline-none focus:ring-1 focus:ring-indigo-500/10 cursor-pointer"
          >
            {symbols.map(sym => (
              <option key={sym} value={sym} className="bg-[#070709] text-white font-mono">{sym}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          <span className="text-[10px] text-white/30 font-mono tracking-wider">HARVESTING INSTITUTIONAL TELEMETRY...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center space-x-2 py-16 text-rose-400 font-mono text-[10px] bg-rose-950/10 border border-rose-900/10 rounded">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT SECTION: Interactive Weight adjustment + High-End SVG Gauge */}
          <div className="lg:col-span-6 bg-[#050507] border border-white/5 rounded-xl p-5 flex flex-col items-center justify-between space-y-4">
            
            {/* Control weights */}
            <div className="w-full space-y-3.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/40 uppercase font-bold tracking-wider border-b border-white/5 pb-2">
                <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-indigo-400" /> Interactive Synthesis weighting</span>
                <span className="text-white/20">W_News / W_Flow</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* News Sentiment Slider */}
                <div className="space-y-1.5 bg-[#09090b] border border-white/5 p-2.5 rounded-lg">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-indigo-300 font-bold flex items-center gap-1">
                      <Newspaper className="w-3 h-3 text-indigo-400" /> Macro Weight:
                    </span>
                    <span className="text-white font-black">{newsWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={newsWeight}
                    onChange={(e) => setNewsWeight(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-white/5 hover:bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-white/35 font-mono">
                    <span>Pure Micro</span>
                    <span>Pure Macro</span>
                  </div>
                </div>

                {/* Order Book Flow Imbalance Slider */}
                <div className="space-y-1.5 bg-[#09090b] border border-white/5 p-2.5 rounded-lg">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-indigo-300 font-bold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-400" /> Dom Flow Weight:
                    </span>
                    <span className="text-white font-black">{orderFlowWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={orderFlowWeight}
                    onChange={(e) => setOrderFlowWeight(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-white/5 hover:bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-white/35 font-mono">
                    <span>Pure Macro</span>
                    <span>Pure Order Flow</span>
                  </div>
                </div>
              </div>
            </div>

            {/* High-Fidelity SVG SPEEDOMETER GAUGE */}
            <div className="relative w-full max-w-[280px] aspect-[2/1] flex flex-col items-center justify-end overflow-hidden pb-1 mt-2">
              <svg viewBox="0 0 200 100" className="w-full h-auto overflow-visible select-none">
                <defs>
                  {/* Gauge gradients */}
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" /> {/* Bearish Deep Red */}
                    <stop offset="35%" stopColor="#fda4af" /> {/* Soft Red */}
                    <stop offset="50%" stopColor="#818cf8" /> {/* Neutral Indigo */}
                    <stop offset="65%" stopColor="#a7f3d0" /> {/* Soft Green */}
                    <stop offset="100%" stopColor="#10b981" /> {/* Bullish Deep Emerald */}
                  </linearGradient>
                  
                  {/* Drop-shadow for gauge needle */}
                  <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.75" />
                  </filter>
                </defs>

                {/* Backtrack Arc */}
                <path 
                  d="M 20 90 A 80 80 0 0 1 180 90" 
                  fill="none" 
                  stroke="#121216" 
                  strokeWidth="16" 
                  strokeLinecap="round" 
                />

                {/* Colored Core Track */}
                <path 
                  d="M 20 90 A 80 80 0 0 1 180 90" 
                  fill="none" 
                  stroke="url(#gaugeGradient)" 
                  strokeWidth="12" 
                  strokeLinecap="round" 
                />

                {/* Grid tick notches */}
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => {
                  const angle = Math.PI - (val / 100) * Math.PI;
                  const innerR = 74;
                  const outerR = 82;
                  const x1 = 100 + innerR * Math.cos(angle);
                  const y1 = 90 - innerR * Math.sin(angle);
                  const x2 = 100 + outerR * Math.cos(angle);
                  const y2 = 90 - outerR * Math.sin(angle);
                  
                  return (
                    <line 
                      key={val} 
                      x1={x1} 
                      y1={y1} 
                      x2={x2} 
                      y2={y2} 
                      stroke="#050505" 
                      strokeWidth={val === 50 ? "2.5" : "1.2"} 
                    />
                  );
                })}

                {/* Text Labels under Arch */}
                <text x="25" y="98" fill="#f43f5e" fontSize="7.5" fontWeight="bold" textAnchor="middle" className="font-mono">SHORT</text>
                <text x="100" y="32" fill="#818cf8" fontSize="8" fontWeight="black" textAnchor="middle" className="font-mono">EQUILIBRIUM</text>
                <text x="175" y="98" fill="#10b981" fontSize="7.5" fontWeight="bold" textAnchor="middle" className="font-mono">LONG</text>

                {/* Needle path pointing to customized angle */}
                <g transform={`translate(100, 90) rotate(${needleAngle})`} className="transition-transform duration-[750ms] ease-out">
                  <path 
                    d="M -4 2 L -1 -80 A 1 1 0 0 1 1 -80 L 4 2 Z" 
                    fill="#dfdfeb" 
                    filter="url(#needleShadow)" 
                  />
                  <circle cx="0" cy="0" r="6" fill="#312e81" stroke="#818cf8" strokeWidth="2.5" />
                  <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
                </g>
              </svg>

              {/* Central absolute value pill overlay */}
              <div className="absolute bottom-1 bg-black/60 border border-white/10 px-3 py-1 rounded-full flex flex-col items-center shadow-lg">
                <span className={`text-xl font-mono font-black tracking-tight leading-none ${synthesisResult.colorClass}`}>
                  {synthesisResult.score}%
                </span>
              </div>
            </div>

            {/* Dial feedback box */}
            <div className="w-full text-center space-y-1 mt-2">
              <span className={`inline-flex px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${synthesisResult.badgeBg}`}>
                {synthesisResult.label}
              </span>
              <p className="text-[10px] text-white/50 leading-relaxed max-w-sm mx-auto font-sans">
                {synthesisResult.description}
              </p>
            </div>

            {/* Diagnostic stats list */}
            <div className="w-full grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-[9px] font-mono text-white/40">
              <div className="text-center bg-[#09090b] p-1.5 border border-white/5 rounded">
                <span className="block text-[8px] text-white/30 uppercase font-semibold">Macro Score</span>
                <motion.span 
                  key={synthesisResult.newsScore}
                  initial={{ opacity: 0.5, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-indigo-300 font-bold text-[10.5px] block mt-0.5"
                >
                  {synthesisResult.newsScore}%
                </motion.span>
              </div>
              <div className="text-center bg-[#09090b] p-1.5 border border-white/5 rounded">
                <span className="block text-[8px] text-white/30 uppercase font-semibold">Flow Score</span>
                <motion.span 
                  key={synthesisResult.flowScore}
                  initial={{ opacity: 0.5, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-emerald-400 font-bold text-[10.5px] block mt-0.5"
                >
                  {synthesisResult.flowScore}%
                </motion.span>
              </div>
              <div className="text-center bg-[#09090b] p-1.5 border border-white/5 rounded">
                <span className="block text-[8px] text-white/30 uppercase font-semibold">RSI Parameter</span>
                <motion.span 
                  key={activeAsset?.rsi || '50'}
                  initial={{ opacity: 0.5, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-amber-400 font-bold text-[10.5px] block mt-0.5"
                >
                  {activeAsset?.rsi || '50'}
                </motion.span>
              </div>
            </div>

          </div>

          {/* RIGHT SECTION: Detailed dual-tab columns: Macro events & Order book Imbalances */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            
            {/* Top right container: Real-time Orderbook Flow Imbalances */}
            <div className="bg-[#050507] border border-white/5 rounded-xl p-4 flex flex-col justify-between flex-1">
              <div className="flex justify-between items-center border-b border-indigo-500/10 pb-2 mb-3">
                <div className="flex items-center space-x-2">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <h4 className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-white">
                    Order Flow Imbalances (Micro)
                  </h4>
                </div>
                <span className="text-[8.5px] font-mono text-emerald-400 font-black animate-pulse flex items-center gap-1">
                  ● LIVE L2 QUEUES
                </span>
              </div>

              {/* DOM Imbalance visualizer */}
              <div className="space-y-2 font-mono text-[9px]">
                <div className="flex items-center justify-between bg-[#0b0b0e] hover:bg-[#101015] border border-indigo-500/10 p-2 rounded-lg gap-3">
                  <div className="w-1/2 flex flex-col">
                    <span className="text-[8px] text-white/35">BID DENSITY (BUYERS)</span>
                    <motion.span 
                      key={activeAsset?.imbalance}
                      initial={{ opacity: 0.6, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className="text-xs font-black text-emerald-400 mt-1"
                    >
                      {50 + (activeAsset?.imbalance || 0) / 2}%
                    </motion.span>
                  </div>
                  <div className="flex-1 bg-[#050505] h-3.5 border border-white/5 rounded relative overflow-hidden flex items-center">
                    {/* Visual split fill bar */}
                    <motion.div 
                      className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 border-r border-emerald-500/40"
                      initial={false}
                      animate={{ width: `${50 + (activeAsset?.imbalance || 0) / 2}%` }}
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    />
                    <motion.div 
                      className="absolute right-0 top-0 bottom-0 bg-rose-500/10"
                      initial={false}
                      animate={{ width: `${50 - (activeAsset?.imbalance || 0) / 2}%` }}
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    />
                    <span className="absolute left-2 text-[8px] font-black text-white/40 z-10">BIDS</span>
                    <span className="absolute right-2 text-[8px] font-black text-white/40 z-10">ASKS</span>
                  </div>
                  <div className="w-1/2 text-right flex flex-col">
                    <span className="text-[8px] text-white/35">ASK DENSITY (SELLERS)</span>
                    <motion.span 
                      key={activeAsset?.imbalance}
                      initial={{ opacity: 0.6, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                      className="text-xs font-black text-rose-400 mt-1"
                    >
                      {50 - (activeAsset?.imbalance || 0) / 2}%
                    </motion.span>
                  </div>
                </div>

                {/* High frequency ladder depth ticks mock */}
                <div className="space-y-1.5 pt-1.5 border-t border-white/5 mt-2">
                  <div className="grid grid-cols-12 text-[8px] text-white/30 uppercase pb-1 border-b border-white/5">
                    <span className="col-span-3">LIQUIDITY DEPTH</span>
                    <span className="col-span-3 text-center">BIDS</span>
                    <span className="col-span-3 text-center">PRESSURE DIAL</span>
                    <span className="col-span-3 text-right">ASKS</span>
                  </div>

                  {bookVolumes.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-center text-[9px] font-mono leading-none py-0.5">
                      <span className="col-span-3 text-white/45">Tier Level {idx + 1}</span>
                      <span className="col-span-3 text-emerald-400/80 font-bold text-center">{item.bids} lots</span>
                      
                      <div className="col-span-3 flex bg-[#030303] h-2 border border-white/5 rounded-full overflow-hidden relative">
                        <div 
                          className="bg-emerald-500/80" 
                          style={{ width: `${item.bidPercent}%` }}
                        />
                        <div 
                          className="bg-rose-500/80" 
                          style={{ width: `${item.askPercent}%` }}
                        />
                      </div>

                      <span className="col-span-3 text-rose-400/80 font-bold text-right">{item.asks} lots</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom right container: Macro Economic News Feed Synthesis */}
            <div className="bg-[#050507] border border-white/5 rounded-xl p-4 flex flex-col justify-between flex-1">
              <div className="flex justify-between items-center border-b border-indigo-500/10 pb-2 mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <h4 className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-white">
                    Economic News Feed Analysis (Macro)
                  </h4>
                </div>
                <span className="text-[8.5px] text-white/30 font-mono">36h Window</span>
              </div>

              {activeEvents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/30">
                  <Info className="w-5 h-5 text-indigo-400/40 mb-1.5" />
                  <span className="text-[9.5px] font-sans">No key macro reports scheduled in research queue.</span>
                </div>
              ) : (
                <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                  {activeEvents.map((ev) => {
                    // Determine bias direction
                    const isBullishBias = ev.title.length % 2 === 0;
                    
                    return (
                      <div 
                        key={ev.id} 
                        className="p-2 bg-[#09090b] hover:bg-[#0c0c0f] border border-white/5 rounded-lg flex items-center justify-between gap-3 text-[9px] font-mono"
                      >
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase font-mono ${
                            ev.impact === 'HIGH' 
                              ? 'bg-rose-500/15 border border-rose-500/20 text-rose-400' 
                              : ev.impact === 'MEDIUM' 
                              ? 'bg-amber-500/15 border border-amber-500/20 text-amber-400' 
                              : 'bg-white/5 border border-white/10 text-white/50'
                          }`}>
                            {ev.impact}
                          </span>
                          <span className="text-white/80 font-bold uppercase tracking-tight">{ev.currency}</span>
                        </div>

                        <span className="text-white/60 truncate font-sans text-[10px] flex-1 font-medium">{ev.title}</span>

                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            isBullishBias 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isBullishBias ? <TrendingUp className="w-2 h-2 text-emerald-400" /> : <TrendingDown className="w-2 h-2 text-rose-400" />}
                            {isBullishBias ? 'BULL' : 'BEAR'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
