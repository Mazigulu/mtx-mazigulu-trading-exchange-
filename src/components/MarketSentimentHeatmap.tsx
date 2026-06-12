/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MarketSymbol } from '../types';
import { 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  HelpCircle, 
  Newspaper, 
  Sparkles, 
  AlertTriangle,
  Zap,
  Gauge,
  Activity,
  ArrowRightLeft
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

export default function MarketSentimentHeatmap() {
  const [data, setData] = useState<SentimentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected asset for highlighting detailed macro composition
  const [selectedSymbol, setSelectedSymbol] = useState<MarketSymbol>('EUR/USD');

  // Pagination for list of instruments exceeding 5 items
  const [currentPage, setCurrentPage] = useState(0);

  const fetchSentiment = async () => {
    try {
      const response = await fetch('/api/market-sentiment');
      if (!response.ok) {
        throw new Error('Failed to retrieve aggregate sentiment intelligence');
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format: server returned HTML instead of JSON.');
      }
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Sentiment aggregation endpoint failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
    // Update every 4 seconds to sync with orderbook & simulator tick rates
    const interval = setInterval(fetchSentiment, 4000);
    return () => clearInterval(interval);
  }, []);

  const symbols: MarketSymbol[] = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP',
    'GOLD/USD', 'SILVER/USD',
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
    'US30', 'NAS100', 'GER40', 'SPX500'
  ];

  const CATEGORIES = [
    { id: 'ALL', name: 'All Instruments' },
    { id: 'FOREX', name: 'Forex' },
    { id: 'METALS', name: 'Metals' },
    { id: 'CRYPTO', name: 'Crypto' },
    { id: 'INDICES', name: 'Indices' },
  ];

  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const getFilteredSymbols = () => {
    switch (selectedCategory) {
      case 'FOREX':
        return ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP'];
      case 'METALS':
        return ['GOLD/USD', 'SILVER/USD'];
      case 'CRYPTO':
        return ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
      case 'INDICES':
        return ['US30', 'NAS100', 'GER40', 'SPX500'];
      default:
        return symbols;
    }
  };

  const filteredSymbols = getFilteredSymbols();

  useEffect(() => {
    setCurrentPage(0);
    if (filteredSymbols.length > 0 && !filteredSymbols.includes(selectedSymbol)) {
      setSelectedSymbol(filteredSymbols[0] as MarketSymbol);
    }
  }, [selectedCategory]);

  // Style helper for Overall Sentiment Score Backgrounds
  const getScoreColorClass = (score: number) => {
    if (score >= 65) {
      return {
        bg: 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 text-emerald-400',
        bar: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
        label: 'BULLISH',
        textColor: 'text-emerald-400'
      };
    }
    if (score >= 55) {
      return {
        bg: 'bg-emerald-400/5 hover:bg-emerald-400/10 border-emerald-400/10 text-emerald-300',
        bar: 'bg-emerald-400/85',
        label: 'MODERATE BULLISH',
        textColor: 'text-emerald-300'
      };
    }
    if (score <= 35) {
      return {
        bg: 'bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/20 text-rose-400',
        bar: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
        label: 'BEARISH',
        textColor: 'text-rose-400'
      };
    }
    if (score <= 45) {
      return {
        bg: 'bg-rose-400/5 hover:bg-rose-400/10 border-rose-400/10 text-rose-300',
        bar: 'bg-rose-400/85',
        label: 'MODERATE BEARISH',
        textColor: 'text-rose-300'
      };
    }
    return {
      bg: 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-white/75',
      bar: 'bg-slate-400',
      label: 'NEUTRAL',
      textColor: 'text-white/60'
    };
  };

  // Style helper for state tags
  const getStateBadge = (state: 'Volatile' | 'Trending' | 'Mean Reverting') => {
    switch (state) {
      case 'Volatile':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/25 animate-pulse">
            <Flame className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Volatile</span>
          </span>
        );
      case 'Trending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-wide bg-blue-500/15 text-indigo-300 border border-blue-500/25">
            <TrendingUp className="w-3 h-3 text-indigo-300 shrink-0" />
            <span>Trending</span>
          </span>
        );
      case 'Mean Reverting':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <RotateCcw className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>Mean Reverting</span>
          </span>
        );
    }
  };

  const pageSize = 5;
  const totalSymbols = filteredSymbols.length;
  const totalPages = Math.ceil(totalSymbols / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalSymbols);
  const displayedSymbols = filteredSymbols.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const firstOnNewPage = filteredSymbols[newPage * pageSize];
    if (firstOnNewPage) {
      setSelectedSymbol(firstOnNewPage as MarketSymbol);
    }
  };

  const activeAsset = data?.sentiment[selectedSymbol];

  return (
    <div id="market-sentiment-card" className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 flex flex-col justify-between h-auto select-none">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Gauge className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
            Macro Sentiment & Market State Heatmap
          </h3>
        </div>
        <div className="text-[10px] text-white/30 font-mono flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-rose-500/80 animate-pulse" />
          <span>News & Price Action Stream</span>
        </div>
      </div>

      <p className="text-[10.5px] text-white/40 leading-relaxed mb-4">
        Aggregates live exchange order-flow metrics and macroeconomic news calendar weights. Displays calculated Pearson shifts, RSI parameters, and ATR volatility boundaries.
      </p>

      {/* Category Tabs Menu */}
      <div className="flex flex-wrap gap-1.5 mb-4 border-b border-white/5 pb-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                : 'bg-white/[0.02] border border-white/5 hover:border-white/15 text-white/40 hover:text-white/70'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Main Grid: Heatmap Blocks + Detail Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Heatmap block items */}
        <div className="lg:col-span-7 space-y-2.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400"></div>
              <span className="text-[9.5px] text-white/30 font-mono">Synthesizing live news impact curves...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center space-x-2 py-16 text-rose-400 font-mono text-[10px] bg-rose-950/10 border border-rose-900/10 rounded">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedSymbols.map((sym) => {
                const asset = data?.sentiment[sym];
                if (!asset) return null;

                const config = getScoreColorClass(asset.overallScore);
                const isSelected = selectedSymbol === sym;

                return (
                  <div
                    key={sym}
                    onClick={() => setSelectedSymbol(sym)}
                    className={`p-3 rounded-lg border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${config.bg} ${
                      isSelected 
                        ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0a0a0b] scale-[1.01] border-indigo-500/40 z-10' 
                        : 'border-white/5'
                    }`}
                  >
                    {/* Left: Asset description & state */}
                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="w-20 font-mono text-xs font-black text-white uppercase tracking-tight">
                        {sym}
                      </div>
                      <div className="w-[110px] leading-none shrink-0 border-l border-white/5 pl-3">
                        {getStateBadge(asset.state)}
                      </div>
                    </div>

                    {/* Middle: score dial bar */}
                    <div className="flex-1 flex flex-col justify-center min-w-[120px]">
                      <div className="flex justify-between items-center text-[9px] font-mono text-white/40 mb-1">
                        <span>SENTIMENT</span>
                        <span className={`font-black uppercase tracking-wider ${config.textColor}`}>
                          {config.label} ({asset.overallScore}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#050505] h-1.5 rounded-full overflow-hidden border border-white/5 relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${config.bar}`} 
                          style={{ width: `${asset.overallScore}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Right: Technical quick glance summary */}
                    <div className="text-right font-mono text-[9.5px] text-white/45 sm:w-28 flex sm:flex-col justify-between sm:justify-start">
                      <div className="flex justify-end gap-1 text-[10px] text-white font-extrabold">
                        <span>RSI: {asset.rsi}</span>
                        <span className="text-white/20">|</span>
                        <span>{asset.trend === 'BULLISH' ? '▲' : asset.trend === 'BEARISH' ? '▼' : '⬌'}</span>
                      </div>
                      <span className="text-[8px] text-white/35 block mt-0.5 font-sans">
                        Imb: {asset.imbalance >= 0 ? `+${asset.imbalance}` : asset.imbalance}%
                      </span>
                    </div>

                  </div>
                );
              })}

              {/* Dynamic inline pagination block */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3 font-mono text-[10px] text-white/50 select-none">
                  <span className="text-[9.5px] text-white/30 font-sans">
                    Showing <span className="font-bold font-mono text-indigo-400">{startIndex + 1}</span>-
                    <span className="font-bold font-mono text-indigo-400">{endIndex}</span> of{' '}
                    <span className="font-bold font-mono text-indigo-200">{totalSymbols}</span> instruments
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer select-none ${
                        currentPage === 0
                          ? 'border-white/5 text-white/20 bg-transparent cursor-not-allowed'
                          : 'border-white/10 text-white/75 bg-white/5 hover:border-indigo-500/40 hover:text-indigo-300'
                      }`}
                    >
                      ◀ Prev
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages - 1}
                      className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer select-none ${
                        currentPage === totalPages - 1
                          ? 'border-white/5 text-white/20 bg-transparent cursor-not-allowed'
                          : 'border-white/10 text-white/75 bg-white/5 hover:border-indigo-500/40 hover:text-indigo-300'
                      }`}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Selected asset macro-sentiment detailed breakdowns */}
        <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-5 font-mono">
          
          {activeAsset ? (
            <div className="space-y-3.5 h-full flex flex-col justify-between">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] text-white/30 uppercase font-bold tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>State Diagnostics</span>
                  </span>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    {activeAsset.symbol}
                  </span>
                </div>

                <div className="bg-[#050505] border border-white/5 p-3.5 rounded-lg space-y-3">
                  
                  {/* Category description explanation */}
                  <div>
                    <h4 className="text-[10px] font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/5">
                      {activeAsset.state === 'Volatile' ? (
                        <>
                          <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-bounce" />
                          <span>HIGH COMPRESSION VOLATILITY</span>
                        </>
                      ) : activeAsset.state === 'Trending' ? (
                        <>
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>DIRECTIONAL SWEEP PHASING</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>REVERSION CORRIDOR ZONE</span>
                        </>
                      )}
                    </h4>
                    <p className="text-[10px] text-white/45 mt-2 leading-relaxed font-sans">
                      {activeAsset.state === 'Volatile' 
                        ? 'High ADR ratios are detected alongside pending macro alerts. Orderbooks reflect elevated liquidity withdrawals. Risk parameters should be scaled down to safeguard capital.' 
                        : activeAsset.state === 'Trending' 
                        ? 'Systematic momentum models are dominating. Strong correlation bias is recorded across liquidity levels. Strategic breakout setups offer optimal trade-to-risk profiles.' 
                        : 'Price behaves cyclically inside static supply, with volume settling down near average levels. Ideal conditions for grid executions or mean-reversion trading bounds.'}
                    </p>
                  </div>

                  {/* Score breakdown metrics */}
                  <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                    
                    <div className="bg-[#0c0c0e]/60 border border-white/5 p-2 rounded flex flex-col justify-between">
                      <span className="text-[8px] text-white/35 font-mono uppercase font-bold tracking-wide flex items-center gap-1">
                        <Newspaper className="w-2.5 h-2.5 text-indigo-400" /> News Feed Force
                      </span>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-sm font-black text-white">{activeAsset.newsScore}%</span>
                        <span className="text-[8px] text-white/35 block italic">Score</span>
                      </div>
                      <span className="text-[8px] text-white/30 block mt-1 font-sans">
                        Events matched: {activeAsset.eventsCount}
                      </span>
                    </div>

                    <div className="bg-[#0c0c0e]/60 border border-white/5 p-2 rounded flex flex-col justify-between">
                      <span className="text-[8px] text-white/35 font-mono uppercase font-bold tracking-wide flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-indigo-400" /> Tech Indicator Weight
                      </span>
                      <div className="flex items-baseline gap-1 mt-1.5">
                        <span className="text-sm font-black text-white">{activeAsset.technicalScore}%</span>
                        <span className="text-[8px] text-white/35 block italic">Score</span>
                      </div>
                      <span className="text-[8px] text-white/30 block mt-1 font-sans">
                        RSI Momentum: {activeAsset.rsi}
                      </span>
                    </div>

                  </div>

                  {/* ATR Metrics Block */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center text-[9px] font-mono text-white/30">
                      <span>AVERAGE TRUE RANGE (30 CANDLES):</span>
                      <span className="font-bold text-white/80">
                        {activeAsset.atr?.toFixed(selectedSymbol === 'USD/JPY' ? 3 : selectedSymbol === 'BTC/USDT' ? 1 : 5)}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Actionable Guideline Footnote */}
              <p className="text-[9.5px] text-white/20 leading-normal font-sans italic mt-3 lg:mt-0">
                *Heatmap metrics are calculated through server-side regression of 36h news timelines mapped against continuous ATR parameters. Always verify key levels before order entry.
              </p>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-6 text-[10px] text-white/30">
              <HelpCircle className="w-6 h-6 text-white/10 mb-2" />
              <span>Select an asset to view advanced sentiment diagnostics.</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
