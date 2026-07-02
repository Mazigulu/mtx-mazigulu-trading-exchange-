/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MarketSymbol, Trade } from '../types';
import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Info, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw, 
  Target, 
  Activity, 
  Compass, 
  Plus, 
  Trash2,
  HelpCircle,
  ShieldCheck,
  Percent,
  Sliders
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  Cell 
} from 'recharts';

interface CorrelationResponse {
  matrix: Record<string, Record<string, number>>;
  timestamp: string;
}

interface PositionDependencyViewProps {
  currentSymbol: MarketSymbol;
  trades: Trade[];
}

interface VirtualTrade {
  id: string;
  symbol: MarketSymbol;
  side: 'BUY' | 'SELL';
  size: number;
}

export default function PositionDependencyView({ currentSymbol, trades }: PositionDependencyViewProps) {
  const [data, setData] = useState<CorrelationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Active Symbol for target correlation analysis (defaults to the workspace currentSymbol)
  const [targetSymbol, setTargetSymbol] = useState<MarketSymbol>(currentSymbol);

  // Sync with workspace currentSymbol whenever it changes
  useEffect(() => {
    setTargetSymbol(currentSymbol);
  }, [currentSymbol]);

  // Mode: 'ACTUAL' or 'SANDBOX'
  const [viewMode, setViewMode] = useState<'ACTUAL' | 'SANDBOX'>('ACTUAL');

  // Sandbox Virtual Trades
  const [sandboxTrades, setSandboxTrades] = useState<VirtualTrade[]>(() => {
    // Seed some initial sandbox positions so it has beautiful content out of the box if no actual open trades exist
    return [
      { id: 'sb-1', symbol: 'NAS100', side: 'BUY', size: 1.5 },
      { id: 'sb-2', symbol: 'SPX500', side: 'SELL', size: 1.0 },
      { id: 'sb-3', symbol: 'AAPL', side: 'BUY', size: 0.8 },
      { id: 'sb-4', symbol: 'NVDA', side: 'SELL', size: 0.5 },
    ];
  });

  // Sandbox inputs
  const [sbSymbol, setSbSymbol] = useState<MarketSymbol>('NAS100');
  const [sbSide, setSbSide] = useState<'BUY' | 'SELL'>('BUY');
  const [sbSize, setSbSize] = useState<number>(1.0);

  // Help section toggle
  const [showExplanation, setShowExplanation] = useState(false);

  const ALL_SYMBOLS: MarketSymbol[] = [
    'US30', 'NAS100', 'GER40', 'SPX500',
    'AAPL', 'MSFT', 'NVDA', 'TSLA'
  ];

  const fetchCorrelations = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
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
      setError(err?.message || 'Correlation analyzer sync offline');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCorrelations();
    const interval = setInterval(() => fetchCorrelations(false), 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter actual active trades
  const activeActualTrades = useMemo(() => {
    return trades.filter(t => t.status === 'OPEN');
  }, [trades]);

  // Active items being analyzed depending on viewMode
  const activeAnalysisItems = useMemo(() => {
    if (viewMode === 'ACTUAL') {
      return activeActualTrades.map(t => ({
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        size: t.size,
        pnl: t.pnl,
        isVirtual: false
      }));
    } else {
      return sandboxTrades.map(t => ({
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        size: t.size,
        pnl: 0,
        isVirtual: true
      }));
    }
  }, [viewMode, activeActualTrades, sandboxTrades]);

  // Compute dependency calculations for each active item relative to the targetSymbol
  const dependencies = useMemo(() => {
    if (!data?.matrix) return [];

    return activeAnalysisItems.map(item => {
      let rawCorrelation = 1.0;
      if (item.symbol === targetSymbol) {
        rawCorrelation = 1.0;
      } else {
        const matrixRow = data.matrix[item.symbol];
        rawCorrelation = matrixRow ? (matrixRow[targetSymbol] ?? 0) : 0;
      }

      // Direction-adjusted correlation:
      // BUY means alignment with underlying. SELL means inverse of underlying.
      const multiplier = item.side === 'BUY' ? 1 : -1;
      const directionalCorrelation = rawCorrelation * multiplier;

      // Contribution weight based on position size
      const sizeWeight = item.size;

      return {
        ...item,
        rawCorrelation,
        directionalCorrelation,
        sizeWeight,
        weightedContribution: directionalCorrelation * sizeWeight
      };
    });
  }, [activeAnalysisItems, targetSymbol, data]);

  // Aggregate stats: Risk Exposure Ratio and Net Directional Bias
  const stats = useMemo(() => {
    if (dependencies.length === 0) {
      return {
        riskExposureRatio: 0,
        netDirectionalBias: 0,
        totalLots: 0,
        riskClassification: 'NO ACTIVE EXPOSURE',
        riskColor: 'text-zinc-400 bg-zinc-950 border-white/5',
        description: 'No active trades to map for dependency. Select sandbox mode on the right to simulate hypothetical trade co-exposures.'
      };
    }

    const totalLots = dependencies.reduce((acc, d) => acc + d.sizeWeight, 0);
    if (totalLots === 0) {
      return {
        riskExposureRatio: 0,
        netDirectionalBias: 0,
        totalLots: 0,
        riskClassification: 'DECORRELATED',
        riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        description: 'Total lot volume is zero. Diversification satisfies sovereign compliance matrices.'
      };
    }

    // Risk Exposure Ratio: weighted sum of absolute directional correlations
    const sumAbsoluteContribution = dependencies.reduce((acc, d) => acc + (Math.abs(d.directionalCorrelation) * d.sizeWeight), 0);
    const riskExposureRatio = sumAbsoluteContribution / totalLots;

    // Net Directional Bias Ratio: weighted sum of actual directional correlations
    const sumWeightedContribution = dependencies.reduce((acc, d) => acc + d.weightedContribution, 0);
    const netDirectionalBias = sumWeightedContribution / totalLots;

    // Let's classify the risk rating
    let riskClassification = 'NOMINAL DIVERSIFICATION';
    let riskColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    let description = 'Portfolio is highly decorrelated. Low risk of systemic cascading losses in relation to this symbol.';

    if (riskExposureRatio > 0.7) {
      riskClassification = 'CRITICAL CO-DEPENDENCY';
      riskColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse';
      description = `Critical risk! Over 70% of your portfolio lot capacity moves in unison with ${targetSymbol}. Extreme vulnerability to directional volatility.`;
    } else if (riskExposureRatio > 0.4) {
      riskClassification = 'MODERATE CO-DEPENDENCY';
      riskColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      description = `Moderate risk. Around ${(riskExposureRatio * 100).toFixed(0)}% of your portfolio is coupled with ${targetSymbol}. Consider adding neutral hedges.`;
    } else if (Math.abs(netDirectionalBias) < 0.15 && riskExposureRatio > 0.3) {
      riskClassification = 'BALANCED LONG/SHORT HEDGE';
      riskColor = 'text-teal-400 bg-teal-500/10 border-teal-500/20';
      description = 'Superb market-neutral structuring. Positive and negative exposures offsets limit net systemic downside.';
    }

    return {
      riskExposureRatio,
      netDirectionalBias,
      totalLots,
      riskClassification,
      riskColor,
      description
    };
  }, [dependencies, targetSymbol]);

  // Add virtual trade
  const handleAddSandboxTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (sbSize <= 0) return;

    const newTrade: VirtualTrade = {
      id: `sandbox-${Date.now()}`,
      symbol: sbSymbol,
      side: sbSide,
      size: sbSize
    };

    setSandboxTrades(prev => [...prev, newTrade]);
    setSbSize(1.0);
  };

  // Remove sandbox trade
  const handleRemoveSandboxTrade = (id: string) => {
    setSandboxTrades(prev => prev.filter(t => t.id !== id));
  };

  // Chart data for Recharts
  const chartData = useMemo(() => {
    return dependencies.map((dep, index) => {
      const shortId = dep.id.toString().substring(0, 5);
      return {
        name: `${dep.symbol} (${dep.side})`,
        label: `${dep.symbol} (#${shortId})`,
        'Raw Pearson (R)': parseFloat(dep.rawCorrelation.toFixed(2)),
        'Net Dependency': parseFloat(dep.directionalCorrelation.toFixed(2)),
        'Risk Weight (Lots)': parseFloat(dep.sizeWeight.toFixed(2)),
        amt: index
      };
    });
  }, [dependencies]);

  return (
    <div id="position-dependency-view-root" className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 font-mono select-none space-y-6">
      
      {/* Title Segment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-md border border-indigo-500/20 text-indigo-400">
            <Compass className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
              <span>Position Dependency Analyzer</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            </h3>
            <p className="text-[10px] text-white/40 font-sans mt-0.5">
              Pearson statistical co-exposure modeling of open trades against designated target tickers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Mode Selector */}
          <div className="bg-[#050507] p-0.5 rounded border border-white/10 flex items-center text-[9px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('ACTUAL')}
              className={`px-2.5 py-1 uppercase rounded transition-all cursor-pointer ${
                viewMode === 'ACTUAL'
                  ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              Actual Portfolio ({activeActualTrades.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('SANDBOX')}
              className={`px-2.5 py-1 uppercase rounded transition-all cursor-pointer ${
                viewMode === 'SANDBOX'
                  ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              Sandbox Simulator ({sandboxTrades.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="px-2.5 py-1 text-[9px] font-bold border border-white/15 text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-all flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>
          
          <button
            type="button"
            onClick={() => fetchCorrelations(true)}
            disabled={loading || refreshing}
            className="p-1 px-2.5 text-[9px] border border-white/5 bg-black/40 hover:bg-black text-white/70 hover:text-white rounded-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Pearson Matrix"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Explainer Block */}
      {showExplanation && (
        <div className="bg-indigo-950/10 border border-indigo-500/25 p-4 rounded-lg text-[10.5px] text-white/70 leading-relaxed space-y-2.5 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-indigo-300 font-bold uppercase text-[11px]">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>Fiduciary Co-Dependency Analytics</span>
          </div>
          <p>
            This system analyzes how price swings in individual assets translate to exposure risk on other tickers.
            When you hold multiple open positions, their directional risk is highly coupled through underlying currency, asset-class, or macro-liquidity correlations:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[10px] text-white/60">
            <li>
              <strong className="text-white">Directional Pearson Factor (Net Dependency):</strong> We evaluate the Pearson correlation ($R$) of each trade's symbol with the selected **Target Ticker**. We then adjust for the position direction. If you hold a <code className="text-emerald-400">BUY</code>, it correlates directly with the $R$ coefficient. If you hold a <code className="text-rose-400">SELL</code>, it correlates inversely (since the trade profits when price falls).
            </li>
            <li>
              <strong className="text-white">Risk Exposure Ratio (RER):</strong> Calculated as the weighted average of absolute directional dependencies:
              <span className="block my-1.5 bg-black/40 p-2 rounded text-center text-indigo-300 font-semibold border border-white/5">
                RER = &Sigma; ( |Net Dependency| &times; Lot Size ) / Total Lot Size
              </span>
              An RER of <code className="text-rose-400 font-bold">100%</code> means your entire portfolio is perfectly bound to the volatility of the target ticker. An RER below <code className="text-emerald-400 font-bold">30%</code> indicates highly diversified, insulated structures.
            </li>
            <li>
              <strong className="text-white">Net Directional Bias (NDB):</strong> Measures whether your overall portfolio has an aggregate positive (Bullish) or negative (Bearish) exposure to the target symbol:
              <span className="block my-1.5 bg-black/40 p-2 rounded text-center text-indigo-300 font-semibold border border-white/5">
                NDB = &Sigma; ( Net Dependency &times; Lot Size ) / Total Lot Size
              </span>
              An NDB near <code className="text-teal-400">0.00</code> with a moderate RER represents a perfectly structured neutral **Hedged Basket**, minimizing net directional exposure.
            </li>
          </ul>
        </div>
      )}

      {/* Analyzer Layout Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Aggregated stats and Interactive Configuration */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Target Symbol Controller */}
          <div className="bg-[#050507] border border-white/5 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span>Selected Target Ticker</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[8px] font-black uppercase">
                REFERENCE
              </span>
            </div>
            
            <div className="space-y-2">
              <select
                value={targetSymbol}
                onChange={(e) => setTargetSymbol(e.target.value as MarketSymbol)}
                className="w-full bg-black border border-white/10 rounded px-3 py-2 text-xs text-white font-bold outline-none focus:border-indigo-500 transition-colors"
              >
                {ALL_SYMBOLS.map((s) => (
                  <option key={`target-${s}`} value={s}>
                    {s} {s === currentSymbol ? '(Active Workspace Ticker)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[9.5px] text-white/30 leading-relaxed font-sans">
                The analyzer calculates how your entire portfolio is exposed to a price swing in this chosen asset.
              </p>
            </div>
          </div>

          {/* Metric: Risk Exposure Ratio */}
          <div className={`p-4 rounded-lg border flex flex-col justify-between h-auto ${stats.riskColor} transition-all duration-300`}>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] text-white/50 block font-bold uppercase tracking-wider">
                  Portfolio Risk Exposure Ratio
                </span>
                <span className="text-[9.5px] font-black font-mono">
                  {(stats.riskExposureRatio * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-black">
                  {(stats.riskExposureRatio).toFixed(3)}
                </span>
                <span className="text-[9.5px] text-white/60 font-sans">RER score</span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.riskExposureRatio > 0.7 ? 'bg-rose-500' :
                    stats.riskExposureRatio > 0.4 ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, stats.riskExposureRatio * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-3.5 space-y-1 pt-2 border-t border-white/5">
              <span className="text-[8px] opacity-60 font-black uppercase tracking-wider block">Risk Threat Assessment:</span>
              <div className="text-[10px] font-extrabold uppercase text-white flex items-center gap-1">
                {stats.riskExposureRatio > 0.4 ? '⚠️' : '✓'} {stats.riskClassification}
              </div>
              <p className="text-[9px] text-white/65 leading-relaxed font-sans">
                {stats.description}
              </p>
            </div>
          </div>

          {/* Metric: Net Directional Bias Ratio */}
          <div className="bg-[#050507] border border-white/5 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[8.5px] text-white/40 block font-bold uppercase tracking-wider">
                Directional Bias Vector
              </span>
              <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded ${
                stats.netDirectionalBias > 0.15 ? 'bg-emerald-500/10 text-emerald-400' :
                stats.netDirectionalBias < -0.15 ? 'bg-rose-500/10 text-rose-400' :
                'bg-white/5 text-white/50'
              }`}>
                {stats.netDirectionalBias >= 0 ? 'BULLISH ALIGNED' : 'BEARISH ALIGNED'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-baseline space-x-1.5">
                <span className={`text-xl font-extrabold ${
                  stats.netDirectionalBias > 0.15 ? 'text-emerald-400' :
                  stats.netDirectionalBias < -0.15 ? 'text-rose-400' :
                  'text-indigo-300'
                }`}>
                  {stats.netDirectionalBias >= 0 ? '+' : ''}{stats.netDirectionalBias.toFixed(3)}
                </span>
                <span className="text-[9.5px] text-white/30 font-sans">NDB score</span>
              </div>
              
              <div className="text-right text-[10px]">
                <div className="text-white/60 font-bold">Total Lots Evaluated</div>
                <div className="text-indigo-400 font-extrabold font-mono">{stats.totalLots.toFixed(2)} lots</div>
              </div>
            </div>

            <p className="text-[9px] text-white/35 leading-relaxed font-sans border-t border-white/[0.04] pt-2">
              If {targetSymbol} advances, a positive bias results in portfolio profit gains, whereas a negative bias suggests inverse profitability (downside shield).
            </p>
          </div>

        </div>

        {/* Middle Column: Graphical Recharts representation */}
        <div className="lg:col-span-5 bg-white/[0.01] border border-white/5 p-4 rounded-lg flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Position Correlation Breakdown</span>
            </h4>
            <p className="text-[9px] text-white/35 font-sans leading-normal">
              Bar index displays raw Pearson R vs Net Directional Dependency adjusted for buy/sell side.
            </p>
          </div>

          <div className="h-60 w-full mt-4">
            {chartData.length === 0 ? (
              <div className="w-full h-full border border-dashed border-white/5 rounded flex flex-col items-center justify-center p-6 text-center space-y-1.5">
                <Sliders className="w-6 h-6 text-white/10" />
                <span className="text-[9.5px] text-white/30">No open positions map values in chart matrix.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#8a8ab0" 
                    fontSize={8.5} 
                    tickLine={false}
                    axisLine={{ stroke: '#2e2e42' }}
                  />
                  <YAxis 
                    stroke="#8a8ab0" 
                    fontSize={8.5}
                    domain={[-1, 1]}
                    tickCount={5}
                    tickLine={false}
                    axisLine={{ stroke: '#2e2e42' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#08080c',
                      borderColor: '#1f1f2e',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontFamily: 'monospace'
                    }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <ReferenceLine y={0} stroke="#2e2e42" />
                  <Bar dataKey="Net Dependency" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, index) => {
                      const val = entry['Net Dependency'];
                      const isHighRisk = Math.abs(val) >= 0.7;
                      const isInverse = val < 0;
                      
                      let cellColor = '#6366f1'; // Indigo base
                      if (isHighRisk) {
                        cellColor = isInverse ? '#f43f5e' : '#10b981'; // Rose for inverse risk, emerald for alignment
                      } else if (isInverse) {
                        cellColor = '#f43f5e90';
                      } else {
                        cellColor = '#10b98190';
                      }

                      return <Cell key={`cell-${index}`} fill={cellColor} />;
                    })}
                  </Bar>
                  <Bar dataKey="Raw Pearson (R)" fill="#475569" opacity={0.4} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-2 flex items-center justify-center gap-4 text-[8px] text-white/40 border-t border-white/[0.04] pt-2">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-sm"></span>
              <span>Positive Dependency</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-rose-500 rounded-sm"></span>
              <span>Negative Dependency</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-slate-600 opacity-40 rounded-sm"></span>
              <span>Raw Correlation (R)</span>
            </span>
          </div>

        </div>

        {/* Right Column: In-View Positions Ledger & Sandbox Form */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Sandbox Injector Panel */}
          {viewMode === 'SANDBOX' && (
            <div className="bg-[#050507] border border-white/5 p-3 rounded-lg space-y-2.5">
              <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Sandbox Injector</span>
              </h5>

              <form onSubmit={handleAddSandboxTrade} className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-1">
                    <span className="text-[8px] text-white/40 uppercase">Ticker</span>
                    <select
                      value={sbSymbol}
                      onChange={(e) => setSbSymbol(e.target.value as MarketSymbol)}
                      className="w-full bg-black border border-white/10 rounded px-1.5 py-1 text-[9.5px] text-white font-bold outline-none"
                    >
                      {ALL_SYMBOLS.map((s) => (
                        <option key={`sb-opt-${s}`} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] text-white/40 uppercase">Action</span>
                    <select
                      value={sbSide}
                      onChange={(e) => setSbSide(e.target.value as any)}
                      className="w-full bg-black border border-white/10 rounded px-1.5 py-1 text-[9.5px] text-white font-bold outline-none"
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-white/[0.04] pt-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-white/40 uppercase">Lots:</span>
                    <input
                      type="number"
                      min="0.1"
                      max="15.0"
                      step="0.1"
                      value={sbSize}
                      onChange={(e) => setSbSize(parseFloat(e.target.value) || 1.0)}
                      className="w-12 bg-black border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-center font-bold text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/30 text-white font-black text-[9px] rounded uppercase transition-all cursor-pointer"
                  >
                    Inject Trade
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Ledger block */}
          <div className="space-y-2">
            <span className="text-[9px] text-white/30 uppercase tracking-wider block font-bold">
              In-Model positions ({dependencies.length})
            </span>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {dependencies.length === 0 ? (
                <div className="p-8 border border-dashed border-white/5 rounded-lg text-center text-[9px] text-white/20">
                  {viewMode === 'ACTUAL' 
                    ? 'No actual active open positions detected.' 
                    : 'Sandbox is currently empty. Use the injector above.'}
                </div>
              ) : (
                dependencies.map((dep) => {
                  const assessmentColor = Math.abs(dep.directionalCorrelation) >= 0.7 
                    ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' 
                    : Math.abs(dep.directionalCorrelation) >= 0.3
                    ? 'text-amber-400 border-amber-500/20 bg-amber-500/5'
                    : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';

                  return (
                    <div 
                      key={dep.id} 
                      className={`p-2 rounded border transition-all ${
                        dep.symbol === targetSymbol 
                          ? 'border-indigo-500/20 bg-indigo-500/5' 
                          : 'border-white/5 bg-black/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-[10px]">
                          <span className={`px-1 rounded text-[8px] font-black ${dep.side === 'BUY' ? 'text-sky-400 bg-sky-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                            {dep.side}
                          </span>
                          <span className="font-bold text-white">{dep.symbol}</span>
                          <span className="text-[9px] text-white/40">({dep.sizeWeight} lots)</span>
                        </div>

                        {dep.isVirtual ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveSandboxTrade(dep.id)}
                            className="text-white/30 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                            title="Remove Simulation Position"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className={`text-[9px] font-black ${dep.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {dep.pnl >= 0 ? '+' : ''}${dep.pnl.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.04] text-[8.5px]">
                        <span className="text-white/30">Target Coef:</span>
                        <span className={`font-mono font-bold ${assessmentColor} px-1 rounded`}>
                          r = {dep.directionalCorrelation >= 0 ? '+' : ''}{dep.directionalCorrelation.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
