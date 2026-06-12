/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MarketSymbol } from '../types';
import { 
  Percent, 
  HelpCircle, 
  TrendingUp, 
  TrendingDown, 
  Shuffle, 
  Sparkles, 
  ShieldAlert, 
  Info,
  Scale
} from 'lucide-react';

interface CorrelationResponse {
  matrix: Record<string, Record<string, number>>;
  timestamp: string;
}

export default function CorrelationMatrix() {
  const [data, setData] = useState<CorrelationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Interaction states for details
  const [selectedPair, setSelectedPair] = useState<{ s1: MarketSymbol; s2: MarketSymbol } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ s1: string; s2: string } | null>(null);

  const ALL_SYMBOLS: MarketSymbol[] = [
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

  const [selectedCategory, setSelectedCategory] = useState('FOREX');

  const getFilteredSymbols = () => {
    switch (selectedCategory) {
      case 'ALL':
        return ALL_SYMBOLS;
      case 'FOREX':
        return ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP'];
      case 'METALS':
        return ['GOLD/USD', 'SILVER/USD'];
      case 'CRYPTO':
        return ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
      case 'INDICES':
        return ['US30', 'NAS100', 'GER40', 'SPX500'];
      default:
        return ['EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USDT', 'GOLD/USD'];
    }
  };

  const symbols = getFilteredSymbols();

  useEffect(() => {
    const activeList = getFilteredSymbols();
    if (activeList.length >= 2) {
      if (!selectedPair || !activeList.includes(selectedPair.s1) || !activeList.includes(selectedPair.s2)) {
        setSelectedPair({ s1: activeList[0], s2: activeList[1] });
      }
    }
  }, [selectedCategory]);

  const fetchCorrelation = async () => {
    try {
      const response = await fetch('/api/market-correlation');
      if (!response.ok) {
        throw new Error('Failed to retrieve institutional correlation matrix');
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
      setError(err?.message || 'Correlation extraction timed out');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelation();
    const interval = setInterval(fetchCorrelation, 4000);
    return () => clearInterval(interval);
  }, []);

  // Compute helper styles based on numeric Pearson score
  const getCellStyles = (score: number, isDiagonal: boolean) => {
    if (isDiagonal) {
      return 'bg-[#0f0f12] text-white/40 border border-white/5 font-bold';
    }
    
    // High positive correlation
    if (score >= 0.7) {
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/25 transition-colors cursor-pointer';
    }
    // Moderately positive correlation
    if (score >= 0.3) {
      return 'bg-emerald-500/5 text-emerald-300/80 border border-emerald-500/5 hover:bg-emerald-500/15 transition-colors cursor-pointer';
    }
    // High inverse correlation
    if (score <= -0.7) {
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/10 hover:bg-rose-500/25 transition-colors cursor-pointer';
    }
    // Moderately inverse correlation
    if (score <= -0.3) {
      return 'bg-rose-500/5 text-rose-300/80 border border-rose-500/5 hover:bg-rose-500/15 transition-colors cursor-pointer';
    }
    // Very weak / uncorrelated
    return 'bg-white/[0.02] text-white/55 border border-white/5 hover:bg-white/[0.06] transition-colors cursor-pointer';
  };

  // Safe fetch for pairwise value
  const getScore = (s1: string, s2: string): number => {
    if (!data || !data.matrix || !data.matrix[s1]) return 0;
    return data.matrix[s1][s2] !== undefined ? data.matrix[s1][s2] : 0;
  };

  // Generate automated hedge advisory text for selected correlation
  const getHedgeRecommendation = (s1: MarketSymbol, s2: MarketSymbol, score: number) => {
    const isDiagonal = s1 === s2;
    if (isDiagonal) {
      return {
        title: 'Primary Asset Reference',
        type: 'STABLE',
        desc: `Pairing ${s1} with itself produces a perfect linear correlation coefficient of 1.0. Perfect correlation offers no diversification offset within the singular instrument block.`,
        action: 'Exposure validation limit: Max 1% per position context.'
      };
    }

    if (score >= 0.7) {
      return {
        title: 'Strong Direct Correlation Opportunities',
        type: 'DIRECT',
        desc: `${s1} and ${s2} possess a highly positive Pearson factor of ${score.toFixed(2)}. They are moving in strong directional symmetry relative to global order book flows.`,
        action: `🛡️ CO-ALIGNMENT HEDGE: Buying ${s1} while simultaneously selling ${s2} acts as a robust market-neutral hedge. Since they trend together, their opposing positions net out market movement risks.`
      };
    }

    if (score <= -0.7) {
      return {
        title: 'Strong Inverse (Negative) Correlation Opportunities',
        type: 'INVERSE',
        desc: `${s1} and ${s2} drift in contrasting structures with an extreme inverse coefficient of ${score.toFixed(2)}. This represents classical inverse supply and demand offset forces.`,
        action: `🛡️ CONTRA-ALIGNMENT HEDGE: Buying both ${s1} and ${s2} forms a strategic reverse hedge. As their price movements trend symmetrically in opposite directions, holding directional buys in both minimizes net asset drawdown.`
      };
    }

    if (score >= 0.3) {
      return {
        title: 'Moderate Direct Symmetry',
        type: 'MODERATE_DIRECT',
        desc: `Moderate synergy (${score.toFixed(2)}) exists. They may occasionally share macro order blocks but diverge frequently in intraday price actions.`,
        action: '⚠️ Partial hedge potential. Diversification risk offset is present, but historical reliability is low-to-medium.'
      };
    }

    if (score <= -0.3) {
      return {
        title: 'Moderate Inverse Symmetry',
        type: 'MODERATE_INVERSE',
        desc: `Moderate inverse correlation (${score.toFixed(2)}) detected. Often driven by dollar indexing fluctuations (USD weighting).`,
        action: '⚠️ Secondary hedge potential. Best integrated into multi-variable risk weight allocations rather than active strict hedging.'
      };
    }

    return {
      title: 'Neutral / Divorced Movement Block',
      type: 'NEUTRAL',
      desc: `Extremely low correlation of ${score.toFixed(2)} between ${s1} and ${s2}. Their algorithmic execution corridors are completely independent.`,
      action: '✨ OPTIMAL DIVERSIFICATION: This pairing represents excellent portfolio diversification value. Executing strategies on both pairs simultaneously spreads systemic risk safely because they move independently.'
    };
  };

  // Select a default pairing to show details if nothing is active
  const activeS1 = selectedPair ? selectedPair.s1 : 'EUR/USD';
  const activeS2 = selectedPair ? selectedPair.s2 : 'USD/JPY';
  const activeScore = getScore(activeS1, activeS2);
  const hedgeInfo = getHedgeRecommendation(activeS1, activeS2, activeScore);

  return (
    <div id="correlation-matrix-card" className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 flex flex-col justify-between h-auto select-none">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Scale className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
            Institution Inter-Asset Correlation
          </h3>
        </div>
        <div className="text-[10px] text-white/30 font-mono flex items-center gap-1">
          <Percent className="w-3.5 h-3.5 text-indigo-400/80" />
          <span>Real-time Closes (30 candles)</span>
        </div>
      </div>

      <p className="text-[10.5px] text-white/40 leading-relaxed mb-4">
        Pearson correlation factors are re-calculated on live ticker intervals. Heavy green tiles represent matching price structures, while red indicates inverse drift patterns. Use these correlations to execute directional hedges.
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

      {/* Main Container layout: heat grid + side description */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Heatmap Area */}
        <div className="lg:col-span-7 flex flex-col justify-center overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b border-indigo-400"></div>
              <span className="text-[9.5px] text-white/30 font-mono">Computing mathematical correlations...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center space-x-2 py-12 text-rose-400 font-mono text-[10px] bg-rose-950/10 border border-rose-900/10 rounded">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="min-w-[340px] select-none">
              
              {/* Matrix Element Grid */}
              <div 
                className="grid gap-1.5 font-mono text-[10px]"
                style={{ gridTemplateColumns: `repeat(${symbols.length + 1}, minmax(0, 1fr))` }}
              >
                
                {/* Row 0: Top Header corner (empty) */}
                <div className="flex items-center justify-center text-[8.5px] text-white/30 tracking-wider text-right pr-2">
                  PAIR
                </div>

                {/* Top Headers */}
                {symbols.map((sym) => {
                  const label = sym.split('/')[0]; // EUR, GBP, etc.
                  const isHoveredCol = hoveredCell?.s2 === sym;
                  const isActiveCol = selectedPair?.s2 === sym;
                  
                  return (
                    <div 
                      key={sym} 
                      className={`py-2 text-center rounded font-semibold transition-all duration-200 border border-transparent ${
                        isHoveredCol || isActiveCol
                          ? 'text-indigo-400 font-bold bg-indigo-500/5' 
                          : 'text-white/45'
                      }`}
                      title={sym}
                    >
                      {label}
                    </div>
                  );
                })}

                {/* Next Rows */}
                {symbols.map((s1) => {
                  const s1Label = s1.split('/')[0];
                  const isHoveredRow = hoveredCell?.s1 === s1;
                  const isActiveRow = selectedPair?.s1 === s1;

                  return (
                    <React.Fragment key={s1}>
                      
                      {/* Left Header */}
                      <div 
                        className={`flex items-center justify-end pr-2.5 font-semibold transition-all duration-200 text-right ${
                          isHoveredRow || isActiveRow 
                            ? 'text-indigo-400 font-bold' 
                            : 'text-white/45'
                        }`}
                        title={s1}
                      >
                        {s1Label}
                      </div>

                      {/* Elements */}
                      {symbols.map((s2) => {
                        const score = getScore(s1, s2);
                        const isDiagonal = s1 === s2;
                        const cellStyles = getCellStyles(score, isDiagonal);
                        
                        const isSelected = selectedPair?.s1 === s1 && selectedPair?.s2 === s2;
                        const isHovered = hoveredCell?.s1 === s1 && hoveredCell?.s2 === s2;

                        return (
                          <div
                            key={`${s1}-${s2}`}
                            onMouseEnter={() => setHoveredCell({ s1, s2 })}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => !isDiagonal && setSelectedPair({ s1, s2 })}
                            className={`py-3.5 rounded text-center font-bold tracking-tight select-none transition-all duration-200 text-[11px] flex items-center justify-center relative ${cellStyles} ${
                              isSelected 
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0a0a0b] scale-[1.03] z-10' 
                                : isHovered
                                ? 'scale-[1.02]'
                                : ''
                            }`}
                          >
                            <span className="font-mono">
                              {isDiagonal ? '1.0' : score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}
                            </span>

                            {/* Small decorative dot for active select */}
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></span>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}

              </div>
            </div>
          )}
        </div>

        {/* Dynamic Hedge Opportunities Advisor (Right side) */}
        <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-5 font-mono">
          
          <div className="space-y-3.5">
            <div className="flex items-center space-x-2 text-[10px] text-white/30 uppercase font-bold tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Hedge Analysis Intel</span>
            </div>

            <div className="bg-[#050505] border border-white/5 p-3.5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white uppercase flex items-center gap-1">
                  {activeS1} <Shuffle className="w-3 h-3 text-white/30" /> {activeS2}
                </span>

                <span className={`text-[11.5px] font-black px-2 py-0.5 rounded ${
                  activeScore >= 0.7 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10' 
                    : activeScore <= -0.7 
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/10'
                    : 'bg-white/5 text-white/60 border border-white/5'
                }`}>
                  r = {activeScore.toFixed(3)}
                </span>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-white/70 uppercase tracking-wide flex items-center gap-1.5">
                  {activeScore >= 0.7 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                  ) : activeScore <= -0.7 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" />
                  )}
                  {hedgeInfo.title}
                </h4>
                <p className="text-[10.5px] text-white/45 mt-1.5 leading-relaxed font-sans">
                  {hedgeInfo.desc}
                </p>
              </div>

              <div className="bg-[#0f0f12] p-2.5 rounded border border-white/5">
                <p className="text-[10.5px] text-white/80 leading-relaxed font-sans font-medium">
                  {hedgeInfo.action}
                </p>
              </div>
            </div>
          </div>

          <p className="text-[9.5px] text-white/20 mt-4 leading-normal font-sans italic">
            *Advisor reference conforms strictly to macro inter-market liquidity sweeps described in The Trading Bible. Select any valid correlation block above to update analysis.
          </p>
        </div>

      </div>

    </div>
  );
}
