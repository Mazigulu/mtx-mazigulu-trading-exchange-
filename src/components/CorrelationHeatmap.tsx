import React, { useState, useEffect, useMemo } from 'react';
import { MarketSymbol, Trade } from '../types';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';
import { 
  Flame, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Compass, 
  RefreshCw, 
  Info,
  Network,
  Zap,
  DollarSign
} from 'lucide-react';

interface CorrelationResponse {
  matrix: Record<string, Record<string, number>>;
  timestamp: string;
}

interface CorrelationHeatmapProps {
  trades: Trade[];
}

export default function CorrelationHeatmap({ trades }: CorrelationHeatmapProps) {
  const [data, setData] = useState<CorrelationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Interaction selection state
  const [selectedCell, setSelectedCell] = useState<{ s1: MarketSymbol; s2: MarketSymbol } | null>(null);

  const ALL_SYMBOLS: MarketSymbol[] = [
    'US30', 'NAS100', 'GER40', 'SPX500',
    'AAPL', 'MSFT', 'NVDA', 'TSLA'
  ];

  const CATEGORIES = [
    { id: 'ALL', name: 'All Instruments' },
    { id: 'INDICES', name: 'Indices' },
    { id: 'EQUITIES', name: 'Equities' },
  ];

  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const getFilteredSymbols = (): MarketSymbol[] => {
    switch (selectedCategory) {
      case 'ALL':
        return ALL_SYMBOLS;
      case 'INDICES':
        return ['US30', 'NAS100', 'GER40', 'SPX500'];
      case 'EQUITIES':
        return ['AAPL', 'MSFT', 'NVDA', 'TSLA'];
      default:
        return ALL_SYMBOLS;
    }
  };

  const symbols = getFilteredSymbols();

  useEffect(() => {
    const list = getFilteredSymbols();
    if (list.length >= 2) {
      if (!selectedCell || !list.includes(selectedCell.s1) || !list.includes(selectedCell.s2)) {
        setSelectedCell({ s1: list[0], s2: list[1] });
      }
    }
  }, [selectedCategory]);

  const fetchCorrelation = async () => {
    try {
      const response = await fetch('/api/market-correlation');
      if (!response.ok) {
        throw new Error('Failed to retrieve real-time correlations');
      }
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Correlation sync temporary offline');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCorrelation();
    const interval = setInterval(fetchCorrelation, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCorrelation();
  };

  // 1. Calculate precise active exposure metrics per symbol
  const openTrades = useMemo(() => trades.filter(t => t.status === 'OPEN'), [trades]);

  const exposuresBySymbol = useMemo(() => {
    const map: Record<MarketSymbol, { 
      direction: 'LONG' | 'SHORT' | 'FLAT'; 
      lots: number; 
      riskPercent: number; 
      pnl: number; 
      riskUSD: number;
      tradesCount: number;
    }> = {} as any;

    symbols.forEach(sym => {
      const symTrades = openTrades.filter(t => t.symbol === sym);
      let buyLots = 0;
      let sellLots = 0;
      let totalPnl = 0;
      let totalRiskUSD = 0;

      symTrades.forEach(t => {
        totalPnl += t.pnl;
        const slDistance = Math.abs(t.entryPrice - t.stopLoss);
        let tradeRisk = 0;

        // Systemic precision contract multipliers matched from database core
        if (t.symbol === 'BTC/USDT') {
          tradeRisk = slDistance * t.size;
        } else if (t.symbol === 'USD/JPY') {
          const contractLots = t.size * 100000;
          tradeRisk = slDistance * contractLots * (1 / t.entryPrice);
        } else {
          const contractLots = t.size * 100000;
          tradeRisk = slDistance * contractLots;
        }

        if (t.stopLoss > 0 && slDistance > 0) {
          totalRiskUSD += tradeRisk;
        } else {
          // Fallback margin buffer
          totalRiskUSD += t.size * (t.symbol === 'BTC/USDT' ? 100 : 0.0020) * (t.symbol === 'BTC/USDT' ? 1 : 100000);
        }

        if (t.side === 'BUY') {
          buyLots += t.size;
        } else {
          sellLots += t.size;
        }
      });

      const netSize = buyLots - sellLots;
      let direction: 'LONG' | 'SHORT' | 'FLAT' = 'FLAT';
      if (Math.abs(netSize) > 0.0001) {
        direction = netSize > 0 ? 'LONG' : 'SHORT';
      }

      map[sym] = {
        direction,
        lots: parseFloat(Math.abs(netSize).toFixed(3)),
        riskUSD: totalRiskUSD,
        riskPercent: parseFloat(((totalRiskUSD / 10000) * 100).toFixed(2)),
        pnl: parseFloat(totalPnl.toFixed(2)),
        tradesCount: symTrades.length
      };
    });

    return map;
  }, [openTrades]);

  // Safe accessor for pairwise correlation coefficient
  const getCorrelation = (s1: string, s2: string): number => {
    if (!data || !data.matrix || !data.matrix[s1]) return 0;
    return data.matrix[s1][s2] !== undefined ? data.matrix[s1][s2] : 0;
  };

  // 2. Compute visual risk cluster metrics between two symbols.
  // Instantly highlights clusters of high-correlation risks in the portfolio
  const getCellRiskProfile = (s1: MarketSymbol, s2: MarketSymbol) => {
    const isDiagonal = s1 === s2;
    const r = getCorrelation(s1, s2);
    const exp1 = exposuresBySymbol[s1];
    const exp2 = exposuresBySymbol[s2];

    const hasExposure1 = exp1 && exp1.direction !== 'FLAT';
    const hasExposure2 = exp2 && exp2.direction !== 'FLAT';

    // Default return structure
    const profile = {
      isDiagonal,
      r,
      hasCoExposure: hasExposure1 && hasExposure2,
      riskMultiplier: 0,
      status: 'NEUTRAL' as 'NEUTRAL' | 'HEDGED' | 'WARNING' | 'CRITICAL',
      label: 'Normal Relationship',
      desc: '',
      colorClass: ''
    };

    if (isDiagonal) {
      profile.status = 'NEUTRAL';
      profile.label = 'Base Identity';
      profile.desc = 'Correlation is inherently perfect.';
      profile.colorClass = 'bg-[#0f0f12] text-white/30 border-white/5';
      return profile;
    }

    if (hasExposure1 && hasExposure2) {
      // Both have active positions. Analyze directional alignment compared to Pearson 'r'
      const sameDirection = exp1.direction === exp2.direction;
      const positiveCorrelation = r >= 0.35;
      const negativeCorrelation = r <= -0.35;

      const isCoAlignedRisk = (positiveCorrelation && sameDirection) || (negativeCorrelation && !sameDirection);
      const isOpposingHedge = (positiveCorrelation && !sameDirection) || (negativeCorrelation && sameDirection);

      const totalCombinedExposurePercent = exp1.riskPercent + exp2.riskPercent;

      if (isCoAlignedRisk) {
        // High Pearson correlation + Same directional bets = Risk multiplier cluster!
        profile.riskMultiplier = parseFloat((totalCombinedExposurePercent * Math.abs(r)).toFixed(2));
        
        if (Math.abs(r) >= 0.6 && totalCombinedExposurePercent >= 1.2) {
          profile.status = 'CRITICAL';
          profile.label = 'CRITICAL CLUSTER';
          profile.desc = `Systemic risk cluster! High correlation (${r.toFixed(2)}) + aligned ${exp1.direction} exposures generates a risk multiplier of ${profile.riskMultiplier}x.`;
          profile.colorClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse-slow';
        } else {
          profile.status = 'WARNING';
          profile.label = 'COMPOUNDED RISK';
          profile.desc = `Co-aligned directional exposure on correlated symbols (${r.toFixed(2)}) expands total leverage vulnerability.`;
          profile.colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/35';
        }
      } else if (isOpposingHedge) {
        // High correlation but opposing directions, or negative correlation and same direction = Hedge offset!
        profile.status = 'HEDGED';
        profile.label = 'HEDGED DEVIATION';
        profile.desc = `Correlated offset active (${r.toFixed(2)}). Opposite direction hedging protects your net drawdown threshold organically.`;
        profile.colorClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      } else {
        profile.status = 'NEUTRAL';
        profile.label = 'UNCORRELATED EXPOSURES';
        profile.desc = 'Both symbols hold active exposure, but correlations are near zero. Independent fluctuation spread is nominal.';
        profile.colorClass = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      }
    } else {
      // Passive correlation mapping colors (when one or both have zero exposure)
      if (r >= 0.7) {
        profile.colorClass = 'bg-emerald-500/5 text-emerald-400/80 border-emerald-500/10 hover:bg-emerald-500/10';
        profile.label = 'Strong Positive';
      } else if (r >= 0.3) {
        profile.colorClass = 'bg-emerald-500/1 text-emerald-300/40 border-emerald-500/5 hover:bg-emerald-500/5';
        profile.label = 'Moderate Positive';
      } else if (r <= -0.7) {
        profile.colorClass = 'bg-rose-500/5 text-rose-400/80 border-rose-500/10 hover:bg-rose-500/10';
        profile.label = 'Strong Negative';
      } else if (r <= -0.3) {
        profile.colorClass = 'bg-rose-500/1 text-rose-300/40 border-rose-500/5 hover:bg-rose-500/5';
        profile.label = 'Moderate Negative';
      } else {
        profile.colorClass = 'bg-white/[0.01] text-white/40 border-white/5 hover:bg-white/[0.03]';
        profile.label = 'Uncorrelated';
      }
    }

    return profile;
  };

  // Compile active warnings & risk clusters to display to user at a glance
  const criticalClusters = useMemo(() => {
    const list: Array<{ s1: MarketSymbol; s2: MarketSymbol; r: number; rMultiplier: number; type: 'CRITICAL' | 'WARNING' | 'HEDGED' }> = [];
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const s1 = symbols[i];
        const s2 = symbols[j];
        const prof = getCellRiskProfile(s1, s2);
        
        if (prof.status === 'CRITICAL' || prof.status === 'WARNING' || prof.status === 'HEDGED') {
          list.push({
            s1,
            s2,
            r: prof.r,
            rMultiplier: prof.riskMultiplier,
            type: prof.status as any
          });
        }
      }
    }
    return list.sort((a, b) => b.rMultiplier - a.rMultiplier);
  }, [exposuresBySymbol, data]);

  // For the Multi-Dimensional Scatter Map chart in Recharts:
  // We represent each asset pair as a node showing:
  // Correlation coefficient (X-axis), Combined active risk % (Y-axis), and Risk status (Color/Scatter point)
  const scatterChartData = useMemo(() => {
    const nodes: Array<{
      name: string;
      r: number;
      combinedRisk: number;
      riskUSD: number;
      size: number;
      status: 'NEUTRAL' | 'HEDGED' | 'WARNING' | 'CRITICAL';
    }> = [];

    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const s1 = symbols[i];
        const s2 = symbols[j];
        const rVal = getCorrelation(s1, s2);
        const exp1 = exposuresBySymbol[s1];
        const exp2 = exposuresBySymbol[s2];
        const combinedRisk = (exp1?.riskPercent || 0) + (exp2?.riskPercent || 0);
        const combinedUSD = (exp1?.riskUSD || 0) + (exp2?.riskUSD || 0);

        const prof = getCellRiskProfile(s1, s2);

        nodes.push({
          name: `${s1} vs ${s2}`,
          r: parseFloat(rVal.toFixed(2)),
          combinedRisk: parseFloat(combinedRisk.toFixed(2)),
          riskUSD: parseFloat(combinedUSD.toFixed(2)),
          size: combinedUSD > 0 ? Math.min(100, Math.max(20, combinedUSD / 5)) : 10,
          status: prof.status
        });
      }
    }
    return nodes;
  }, [exposuresBySymbol, data]);

  // Default active selected cell pair to display diagnostics
  const activePair = useMemo(() => {
    if (selectedCell) return selectedCell;
    
    // Choose first critical if available, else a classic direct pair EUR/USD vs GBP/USD
    if (criticalClusters.length > 0) {
      return { s1: criticalClusters[0].s1, s2: criticalClusters[0].s2 };
    }
    return { s1: 'EUR/USD' as MarketSymbol, s2: 'GBP/USD' as MarketSymbol };
  }, [selectedCell, criticalClusters]);

  const activeProfile = getCellRiskProfile(activePair.s1, activePair.s2);
  const activeExp1 = exposuresBySymbol[activePair.s1];
  const activeExp2 = exposuresBySymbol[activePair.s2];

  return (
    <div id="risk-portfolio-correlation-heatmap-workspace" className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 flex flex-col space-y-5 h-auto">
      
      {/* Upper header action area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4 select-none">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-500/20 text-indigo-400">
              <Network className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                <span>Vulnerability Correlation Heatmap</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8.5px] text-amber-400 font-bold uppercase tracking-normal">
                  Exposure-Mapped
                </span>
              </h3>
              <p className="text-[10px] text-white/30 font-mono mt-0.5">
                Dynamic inter-asset risk analysis cross-referencing active portfolio leverage with Pearson correlations
              </p>
            </div>
          </div>
        </div>

        <button
          id="btn-vuln-heatmap-refresh"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded border border-white/5 transition-all text-xs flex items-center space-x-1.5 font-mono cursor-pointer disabled:opacity-50 font-semibold"
          title="Recalculate inter-asset beta values"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Sync Pearson Closes</span>
        </button>
      </div>

      {/* Category Tabs Menu */}
      <div className="flex flex-wrap gap-1.5 mb-2 border-b border-white/5 pb-3">
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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column: Interactive Heatmap Grid overlay */}
        <div className="xl:col-span-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] uppercase text-white/30 font-mono font-bold tracking-tight">
              A) Asset Grid Overlay & Compound Risk Flasher
            </span>
            <div className="flex items-center space-x-2.5 text-[8.5px] font-mono leading-none select-none">
              <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500/80 animate-pulse"></span> <span className="text-rose-400">Critical Cluster</span></span>
              <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500/80"></span> <span className="text-amber-400">Warning</span></span>
              <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span> <span className="text-emerald-400">Hedged</span></span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-black/10 border border-white/5 rounded-lg space-y-3">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              <span className="text-[10px] text-white/30 font-mono uppercase">Analyzing trading book correlations...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center space-x-2 py-16 text-rose-400 font-mono text-[10.5px] bg-rose-950/10 border border-rose-900/10 rounded">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="overflow-x-auto select-none min-w-[320px]">
              
              {/* Matrix Heatmap Elements */}
              <div 
                className="grid gap-1.5 font-mono text-[10px]"
                style={{ gridTemplateColumns: `repeat(${symbols.length + 1}, minmax(0, 1fr))` }}
              >
                
                {/* Empty corner indicator */}
                <div className="flex items-center justify-end text-[8.5px] text-white/20 uppercase tracking-widest pr-3 font-semibold select-none pb-1">
                  Symbol
                </div>

                {/* X-axis Headers (Column labels) */}
                {symbols.map((sym) => {
                  const label = sym.split('/')[0];
                  const exp = exposuresBySymbol[sym];
                  const holdsActive = exp && exp.direction !== 'FLAT';
                  
                  return (
                    <div 
                      key={`col-${sym}`}
                      className={`py-1.5 text-center rounded border border-transparent transition-all duration-200 text-[10px] ${
                        holdsActive 
                          ? 'bg-indigo-500/10 text-indigo-300 font-black border-indigo-500/25' 
                          : 'text-white/45 font-medium'
                      }`}
                      title={`${sym} - ${holdsActive ? `${exp.direction} (${exp.riskPercent}% Risk)` : 'No active exposure'}`}
                    >
                      <div>{label}</div>
                      {holdsActive && (
                        <div className={`text-[8px] font-black leading-none mt-0.5 ${exp.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {exp.direction}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Matrix Y-axis headers & cellular items */}
                {symbols.map((s1) => {
                  const label1 = s1.split('/')[0];
                  const exp1 = exposuresBySymbol[s1];
                  const holdsActive1 = exp1 && exp1.direction !== 'FLAT';

                  return (
                    <React.Fragment key={`row-${s1}`}>
                      
                      {/* Left header cell */}
                      <div 
                        className={`flex flex-col items-end justify-center pr-3 font-mono transition-all duration-200 ${
                          holdsActive1 
                            ? 'text-indigo-300 font-black' 
                            : 'text-white/45 font-medium'
                        }`}
                      >
                        <span className="text-[10px]">{label1}</span>
                        {holdsActive1 && (
                          <span className={`text-[8px] font-black uppercase tracking-tighter leading-none mt-0.5 ${
                            exp1.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {exp1.riskPercent.toFixed(1)}%
                          </span>
                        )}
                      </div>

                      {/* Columns */}
                      {symbols.map((s2) => {
                        const cellRisk = getCellRiskProfile(s1, s2);
                        const isSelected = activePair.s1 === s1 && activePair.s2 === s2;
                        const isDiagonal = s1 === s2;

                        return (
                          <div
                            key={`cell-${s1}-${s2}`}
                            onClick={() => setSelectedCell({ s1, s2 })}
                            className={`py-4 rounded text-center transition-all duration-200 relative cursor-pointer border select-none ${
                              cellRisk.colorClass
                            } ${
                              isSelected 
                                ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0a0a0b] scale-[1.03] z-10 font-black' 
                                : 'font-semibold'
                            }`}
                          >
                            <span className="text-[11px] block tracking-tighter">
                              {isDiagonal ? '1.0' : cellRisk.r >= 0 ? `+${cellRisk.r.toFixed(2)}` : cellRisk.r.toFixed(2)}
                            </span>

                            {/* Risk badge overlays for compound risks or hedges */}
                            {!isDiagonal && cellRisk.status === 'CRITICAL' && (
                              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 border border-black shadow-[0_0_8px_#f43f5e] animate-ping"></span>
                            )}
                            {!isDiagonal && cellRisk.status === 'WARNING' && (
                              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400 border border-black shadow-[0_0_6px_#fbbf24]"></span>
                            )}
                            {!isDiagonal && cellRisk.status === 'HEDGED' && (
                              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 border border-black shadow-[0_0_6px_#34d399]"></span>
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

          {/* Quick legend info box */}
          <div className="bg-[#0e0e11] border border-white/5 rounded p-3 text-[9.5px] leading-relaxed text-white/40 font-mono">
            <span className="text-white/70 font-semibold uppercase text-[8.5px] tracking-wider block mb-1">How Risk Overlap is Flagged:</span>
            <p>
              When holding active trades in highly correlated asset blocks (e.g. <span className="text-[#3b82f6]">Forex indices</span>, <span className="text-[#a16207]">Commodities</span>), the system instantly monitors co-alignment vectors. Direct trades matching positive coefficients trigger <span className="text-rose-400 font-bold">Vulnerability Warnings</span>. Opposing positions trigger <span className="text-emerald-400 font-bold">Hedged offsets</span>.
            </p>
          </div>
        </div>

        {/* Right Column: Multi-Dimensional Portfolio Cluster Scatter Map + Advisory Panel */}
        <div className="xl:col-span-6 flex flex-col justify-between space-y-4">
          
          {/* Scatter map using Recharts */}
          <div className="flex flex-col space-y-2.5">
            <span className="text-[9.5px] uppercase text-white/30 font-mono font-bold tracking-tight block select-none">
              B) Multi-Dimensional Portfolio Cluster Threat Map (Recharts)
            </span>

            <div className="h-[155px] w-full bg-black/40 border border-white/5 rounded-lg p-2 relative">
              
              {/* Overlay axes guidelines */}
              <div className="absolute top-1 right-2.5 text-[8.5px] font-mono text-white/20 select-none uppercase">
                X: Pearson (r) • Y: Combined Risk %
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 15, right: 15, bottom: -10, left: -25 }}>
                  <XAxis 
                    type="number" 
                    dataKey="r" 
                    name="Correlation (r)" 
                    domain={[-1, 1]} 
                    tickFormatter={(v) => `r:${v}`}
                    stroke="rgba(255,255,255,0.15)"
                    tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="combinedRisk" 
                    name="Combined Stop Loss Risk" 
                    domain={[0, 'auto']} 
                    tickFormatter={(v) => `${v}%`}
                    stroke="rgba(255,255,255,0.15)"
                    tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }}
                  />
                  <ZAxis type="number" dataKey="size" range={[15, 200]} />
                  <RechartsTooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        let borderStyling = 'border-indigo-500/50 border-l-3 border-l-indigo-500';
                        if (data.status === 'CRITICAL') borderStyling = 'border-rose-500/50 border-l-3 border-l-rose-500';
                        else if (data.status === 'WARNING') borderStyling = 'border-amber-500/50 border-l-3 border-l-amber-500';
                        else if (data.status === 'HEDGED') borderStyling = 'border-emerald-500/50 border-l-3 border-l-emerald-500';
                        return (
                          <div className={`bg-[#0c0c0e] border ${borderStyling} p-2.5 rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.95)] text-[10px] font-mono`}>
                            <span className="text-white font-bold block border-b border-white/5 pb-1 select-none">{data.name}</span>
                            <div className="mt-1 space-y-0.5 text-white/70">
                              <p>Correlation Coeff: <span className="font-bold text-indigo-400">{data.r >= 0 ? `+${data.r}` : data.r}</span></p>
                              <p>Combined Exposure: <span className="font-bold text-amber-500">{data.combinedRisk}%</span></p>
                              <p>Dollar Value At-Risk: <span className="font-semibold text-rose-400">${data.riskUSD.toFixed(2)}</span></p>
                              <p className="pt-1 mt-1 border-t border-white/5 text-[9px] uppercase font-bold text-indigo-300">
                                Cluster Status: {data.status}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Asset Pair Clusters" data={scatterChartData}>
                    {scatterChartData.map((entry, index) => {
                      let color = '#6b7280'; // gray neutral
                      if (entry.combinedRisk > 0) {
                        if (entry.status === 'CRITICAL') color = '#f43f5e'; // red
                        else if (entry.status === 'WARNING') color = '#f59e0b'; // amber
                        else if (entry.status === 'HEDGED') color = '#10b981'; // emerald
                        else color = '#6366f1'; // indigo
                      }
                      return <Cell key={`dot-${index}`} fill={color} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Real-time Cluster Pair Diagnostic Panel */}
          <div className="bg-[#050506] border border-white/5 rounded-lg p-3.5 space-y-3 font-mono">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1.5 select-none">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pairwise Diagnostics: {activePair.s1} vs {activePair.s2}</span>
              </span>
              <span className={`text-[10.5px] font-black px-1.5 py-0.5 rounded ${
                activeProfile.r >= 0.35 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : activeProfile.r <= -0.35 
                  ? 'bg-rose-500/10 text-rose-400' 
                  : 'bg-white/5 text-white/50'
              }`}>
                r = {activeProfile.r.toFixed(3)}
              </span>
            </div>

            {/* Direct Side-by-side exposures of the active pair */}
            <div className="grid grid-cols-2 gap-3.5 select-none">
              
              {/* Asset 1 Block */}
              <div className="bg-black/40 border border-white/5 rounded p-2.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-white/30 uppercase font-bold block">{activePair.s1} Position</span>
                  <span className={`text-xs font-black block mt-0.5 ${
                    activeExp1?.direction === 'LONG' ? 'text-emerald-400' : activeExp1?.direction === 'SHORT' ? 'text-rose-400' : 'text-white/40'
                  }`}>
                    {activeExp1?.direction !== 'FLAT' ? `${activeExp1?.direction} (${activeExp1?.lots} Lots)` : 'SQUARE (FLAT)'}
                  </span>
                </div>
                {activeExp1?.direction !== 'FLAT' && (
                  <div className="flex justify-between items-center text-[9px] text-white/55 mt-2 border-t border-white/5 pt-1.5">
                    <span>PnL: <strong className={activeExp1?.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>${activeExp1?.pnl.toFixed(1)}</strong></span>
                    <span>Risk: <strong>{activeExp1?.riskPercent}%</strong></span>
                  </div>
                )}
              </div>

              {/* Asset 2 Block */}
              <div className="bg-black/40 border border-white/5 rounded p-2.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-white/30 uppercase font-bold block">{activePair.s2} Position</span>
                  <span className={`text-xs font-black block mt-0.5 ${
                    activeExp2?.direction === 'LONG' ? 'text-emerald-400' : activeExp2?.direction === 'SHORT' ? 'text-rose-400' : 'text-white/40'
                  }`}>
                    {activeExp2?.direction !== 'FLAT' ? `${activeExp2?.direction} (${activeExp2?.lots} Lots)` : 'SQUARE (FLAT)'}
                  </span>
                </div>
                {activeExp2?.direction !== 'FLAT' && (
                  <div className="flex justify-between items-center text-[9px] text-white/55 mt-2 border-t border-white/5 pt-1.5">
                    <span>PnL: <strong className={activeExp2?.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>${activeExp2?.pnl.toFixed(1)}</strong></span>
                    <span>Risk: <strong>{activeExp2?.riskPercent}%</strong></span>
                  </div>
                )}
              </div>

            </div>

            {/* Diagnostic Advice */}
            <div className="pt-1.5">
              <span className="text-[9px] uppercase text-white/30 font-bold block select-none">Cluster Risk Evaluation:</span>
              <div className="flex items-start space-x-2 mt-1.5">
                {activeProfile.status === 'CRITICAL' ? (
                  <Flame className="w-4.5 h-4.5 text-rose-500 animate-pulse shrink-0" />
                ) : activeProfile.status === 'WARNING' ? (
                  <ShieldAlert className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                ) : activeProfile.status === 'HEDGED' ? (
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                ) : (
                  <Info className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                )}
                
                <div className="space-y-1">
                  <h4 className={`text-[10px] font-black leading-none uppercase ${
                    activeProfile.status === 'CRITICAL' ? 'text-rose-400' : activeProfile.status === 'WARNING' ? 'text-amber-400' : activeProfile.status === 'HEDGED' ? 'text-emerald-400' : 'text-white/70'
                  }`}>
                    {activeProfile.label}
                  </h4>
                  <p className="text-[10px] text-white/60 leading-normal font-sans">
                    {activeProfile.desc || `No active compounding or hedging overlaps identified between ${activePair.s1} and ${activePair.s2}. This pair adheres strictly to standard diversification rules.`}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
