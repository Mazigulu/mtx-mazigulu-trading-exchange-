/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MarketSymbol, Trade } from '../types';
import { 
  Scale, 
  HelpCircle, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Plus, 
  Trash2, 
  Shuffle, 
  Info, 
  Sparkles, 
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

interface CorrelationResponse {
  matrix: Record<string, Record<string, number>>;
  timestamp: string;
}

interface PortfolioCorrelationWidgetProps {
  trades: Trade[];
}

interface VirtualPosition {
  id: string;
  symbol: MarketSymbol;
  side: 'BUY' | 'SELL';
  size: number;
}

export default function PortfolioCorrelationWidget({ trades }: PortfolioCorrelationWidgetProps) {
  const [data, setData] = useState<CorrelationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Virtual Sandbox Positions
  const [virtualPositions, setVirtualPositions] = useState<VirtualPosition[]>([]);
  // Form state for adding virtual positions
  const [newSymbol, setNewSymbol] = useState<MarketSymbol>('NAS100');
  const [newSide, setNewSide] = useState<'BUY' | 'SELL'>('BUY');
  const [newSize, setNewSize] = useState<number>(0.1);

  // Help Modal state
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
      setError(err?.message || 'Correlation ledger synchronization offline');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCorrelations();
  }, []);

  // Filter actual active trades
  const activeActualPositions = useMemo(() => {
    return trades.filter(t => t.status === 'OPEN').map(t => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      size: t.size,
      isVirtual: false
    }));
  }, [trades]);

  // Combined portfolio list (actual active + virtual sandbox ones)
  const combinedPortfolio = useMemo(() => {
    const list = [...activeActualPositions];
    virtualPositions.forEach(vp => {
      list.push({
        id: vp.id,
        symbol: vp.symbol,
        side: vp.side,
        size: vp.size,
        isVirtual: true
      });
    });
    return list;
  }, [activeActualPositions, virtualPositions]);

  // If no actual trades and no virtual positions exist, we pre-seed with a realistic set of initial demo positions
  // so the UI never displays broken and has functional, high-fidelity mock assets to interact with
  const demoVirtualPositions: VirtualPosition[] = useMemo(() => [
    { id: 'v1', symbol: 'NAS100', side: 'BUY', size: 1.0 },
    { id: 'v2', symbol: 'SPX500', side: 'BUY', size: 0.5 },
    { id: 'v3', symbol: 'AAPL', side: 'SELL', size: 1.2 }
  ], []);

  const ultimatePortfolio = useMemo(() => {
    if (combinedPortfolio.length > 0) {
      return combinedPortfolio;
    }
    // Pre-seed demo portfolio
    return demoVirtualPositions.map(p => ({
      ...p,
      isVirtual: true,
      id: `seed-${p.id}`
    }));
  }, [combinedPortfolio, demoVirtualPositions]);

  // Compute pairwise correlation coefficients for the portfolio
  const pairwiseCorrelations = useMemo(() => {
    if (!data?.matrix) return [];

    const results = [];
    const n = ultimatePortfolio.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const pos1 = ultimatePortfolio[i];
        const pos2 = ultimatePortfolio[j];

        // Retrieve raw Pearson correlation
        let rawCorr = 1.0;
        if (pos1.symbol === pos2.symbol) {
          rawCorr = 1.0;
        } else {
          const s1_matrix = data.matrix[pos1.symbol];
          rawCorr = s1_matrix ? (s1_matrix[pos2.symbol] ?? 0) : 0;
        }

        // Direction adjusted risk correlation
        // If both same direction: BUY & BUY or SELL & SELL, they both go up/down together. Price correlation matters directly.
        // If opposite directions: BUY & SELL, they hedge. If price correlation is +0.8, buying A and selling B is a *negative* risk correlation (reducing risk).
        // So: directional_risk = raw_correlation * (side1 === side2 ? 1 : -1)
        const sidesMatch = pos1.side === pos2.side;
        const directionalCorr = parseFloat((rawCorr * (sidesMatch ? 1 : -1)).toFixed(3));

        results.push({
          pos1,
          pos2,
          rawCorr,
          directionalCorr,
          sidesMatch
        });
      }
    }

    return results;
  }, [ultimatePortfolio, data]);

  // Aggregate stats
  const portfolioStats = useMemo(() => {
    if (pairwiseCorrelations.length === 0) {
      return {
        avgRawCorr: 0,
        avgDirectionalCorr: 0,
        riskRating: 'WELL DIVERSIFIED',
        riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        alertLevel: 'NOMINAL'
      };
    }

    const totalRaw = pairwiseCorrelations.reduce((acc, c) => acc + Math.abs(c.rawCorr), 0);
    const totalDir = pairwiseCorrelations.reduce((acc, c) => acc + c.directionalCorr, 0);
    const avgRawCorr = totalRaw / pairwiseCorrelations.length;
    const avgDirectionalCorr = totalDir / pairwiseCorrelations.length;

    let riskRating = 'WELL DIVERSIFIED';
    let riskColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    let alertLevel = 'NOMINAL';

    // Highlight directional correlation risks
    if (avgDirectionalCorr > 0.6) {
      riskRating = 'CRITICAL OVER-EXPOSURE';
      riskColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse';
      alertLevel = 'CRITICAL';
    } else if (avgDirectionalCorr > 0.3) {
      riskRating = 'MODERATE CO-DEPENDENCY';
      riskColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      alertLevel = 'WARNING';
    } else if (avgDirectionalCorr < -0.3) {
      riskRating = 'HEDGED PORTFOLIO CLUSTER';
      riskColor = 'text-teal-400 bg-teal-500/10 border-teal-500/20';
      alertLevel = 'HEDGED';
    }

    return {
      avgRawCorr,
      avgDirectionalCorr,
      riskRating,
      riskColor,
      alertLevel
    };
  }, [pairwiseCorrelations]);

  const addVirtualPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const newPos: VirtualPosition = {
      id: `virtual-${Date.now()}`,
      symbol: newSymbol,
      side: newSide,
      size: newSize
    };
    setVirtualPositions(prev => [...prev, newPos]);
    // Reset inputs gently
    setNewSize(0.1);
  };

  const removeVirtualPosition = (id: string) => {
    setVirtualPositions(prev => prev.filter(p => p.id !== id));
  };

  const clearAllVirtual = () => {
    setVirtualPositions([]);
  };

  const getThreatLabel = (directionalCorr: number) => {
    if (directionalCorr >= 0.7) return { label: 'CRITICAL WARNING', style: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    if (directionalCorr >= 0.3) return { label: 'ELEVATED EXPOSURE', style: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (directionalCorr <= -0.4) return { label: 'DYNAMIC HEDGE', style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    return { label: 'DECORRELATED', style: 'text-white/40 bg-white/5 border-white/5' };
  };

  const isDemoMode = activeActualPositions.length === 0 && virtualPositions.length === 0;

  return (
    <div id="portfolio-correlation-widget-root" className="bg-[#0a0a0b]/90 border border-white/5 rounded-lg p-5 font-mono select-none space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-md border border-indigo-500/20 text-indigo-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5">
              <span>Portfolio Correlation Desk</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </h3>
            <p className="text-[10px] text-white/40 font-sans mt-0.5">
              Active co-exposure analyzer calculating Pearson price coupling & net portfolio directional threat
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="px-2.5 py-1 text-[9px] font-bold border border-white/15 text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-all flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>How it works</span>
          </button>
          
          <button
            type="button"
            onClick={() => fetchCorrelations(true)}
            disabled={loading || refreshing}
            className="p-1 px-2.5 text-[9px] border border-white/5 bg-black/40 hover:bg-black text-white/70 hover:text-white rounded-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh correlation calculations"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Explainer Segment (Toggleable) */}
      {showExplanation && (
        <div className="bg-indigo-950/15 border border-indigo-500/20 p-4 rounded-lg text-[10.5px] text-white/70 leading-relaxed space-y-2 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-indigo-300 font-bold uppercase text-[11px]">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Under the Hood: Fiduciary Coupling Analysis</span>
          </div>
          <p>
            Standard asset correlation models often isolate raw instrument prices, which does not reflect your true exposure.
            Our **Directional Exposure Correlation Model** dynamically resolves price trends with trade directions:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[10px] text-white/60">
            <li>
              <strong className="text-white">Raw Pearson Coef (R):</strong> Evaluates the historical close price correlation values over the last 30 intervals. Value ranges from <code className="text-amber-400 font-bold">-1.00</code> (perfect inverted move) to <code className="text-emerald-400 font-bold">+1.00</code> (perfect mirror move).
            </li>
            <li>
              <strong className="text-white">Trade-Adjusted risk correlation (TR):</strong> Multiplies the raw Pearson coefficient by alignment weight. If both trades are same-directional (<code className="text-rose-400 font-bold">BUY/BUY</code> or <code className="text-sky-400 font-bold">SELL/SELL</code>), the correlation acts as an multiplier of portfolio drawdown risk. If opposite directions are active (<code className="text-rose-400 font-bold">BUY/SELL</code>), a positive historical correlation represents a **natural hedge coefficient**, mitigating risk.
            </li>
            <li>
              <strong className="text-white">Anti-Overlapping Rule:</strong> Keeps you alert before doubling down on separate instruments with identical systemic market factors (e.g., buying both <code className="text-indigo-300">EUR/USD</code> and <code className="text-indigo-300">GBP/USD</code> together is financially identical to double-leverage on USD).
            </li>
          </ul>
        </div>
      )}

      {/* Main Aggregated Risk Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Metric 1: Risk Status Card */}
        <div className={`p-4 rounded-lg border flex flex-col justify-between ${portfolioStats.riskColor} transition-all`}>
          <div className="space-y-1">
            <span className="text-[9px] text-white/50 block font-bold uppercase tracking-wider">AGGREGATE EXPOSURE FIT</span>
            <div className="text-[15px] font-black uppercase tracking-wide">
              {portfolioStats.riskRating}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {portfolioStats.alertLevel === 'CRITICAL' ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
            ) : portfolioStats.alertLevel === 'HEDGED' ? (
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            )}
            <span className="text-[10px] font-semibold text-white/80">
              {portfolioStats.alertLevel === 'CRITICAL' 
                ? 'High threat of unified drawdown during major USD sentiment shifts.' 
                : portfolioStats.alertLevel === 'WARNING'
                ? 'Moderate correlation threat detected. Limit co-exposure.'
                : portfolioStats.alertLevel === 'HEDGED'
                ? 'Active hedges are softening aggregate downside risk.'
                : 'Excellent diversification. Decorrelated portfolios locked.'}
            </span>
          </div>
        </div>

        {/* Metric 2: Average Raw Correlation */}
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-lg flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-white/40 block font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Mean Historical Sympathy</span>
              <Shuffle className="w-3 h-3 text-indigo-400" />
            </span>
            <div className="text-xl font-extrabold text-white">
              {(portfolioStats.avgRawCorr).toFixed(3)}
            </div>
          </div>
          <p className="text-[9.5px] text-white/35 font-sans leading-relaxed mt-2">
            Average historical synchrony coefficient (absolute values) regardless of the buy/sell trade side.
          </p>
        </div>

        {/* Metric 3: Average Directional Correlation */}
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-lg flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[9px] text-white/40 block font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Direction-Adjusted Threat Vector</span>
              <AlertTriangle className="w-3 h-3 text-indigo-400" />
            </span>
            <div className={`text-xl font-extrabold ${portfolioStats.avgDirectionalCorr > 0.4 ? 'text-rose-400' : portfolioStats.avgDirectionalCorr <= -0.1 ? 'text-emerald-400' : 'text-indigo-300'}`}>
              {(portfolioStats.avgDirectionalCorr >= 0 ? '+' : '')}{(portfolioStats.avgDirectionalCorr).toFixed(3)}
            </div>
          </div>
          <p className="text-[9.5px] text-white/35 font-sans leading-relaxed mt-2">
            Accounts for BUY vs. SELL trade offsets. Negative figures signify defensive portfolio hedging.
          </p>
        </div>
      </div>

      {/* Two-Column split: Active ledger and simulation setup */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Col (2/3): Pairwise list */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-white/45" />
              <span>CO-CODING PAIRWISE LEDGER</span>
              {isDemoMode && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[8px] font-black border border-amber-500/20 tracking-wider">
                  PRE-SEEDED DEMO PORTFOLIO
                </span>
              )}
            </h4>
            
            {!isDemoMode && (
              <span className="text-[9px] text-indigo-300 font-black">
                {ultimatePortfolio.length} POSITIONS MAPPED
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center rounded-lg border border-dashed border-white/10 bg-black/40 text-xs text-white/40">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
              Computing multi-interval statistical covariance matrices...
            </div>
          ) : pairwiseCorrelations.length === 0 ? (
            <div className="p-12 text-center rounded-lg border border-dashed border-white/5 bg-black/45 space-y-1.5">
              <Info className="w-6 h-6 text-indigo-500/20 mx-auto" />
              <h5 className="text-xs font-bold text-white/40 uppercase">Isolate Position Detected</h5>
              <p className="text-[9px] text-white/25 max-w-sm mx-auto font-sans leading-relaxed">
                Add virtual trades inside the Sandbox simulator on the right to gauge theoretical asset correlations prior to live launch.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-white/5 rounded-lg bg-black/40">
              <table className="w-full text-left text-[10.5px]">
                <thead>
                  <tr className="bg-white/[0.02] text-white/45 font-bold border-b border-white/5 text-[9px] uppercase">
                    <th className="p-3">Asset 1 Block</th>
                    <th className="p-3">Asset 2 Block</th>
                    <th className="p-3 text-right">Raw Pearson (R)</th>
                    <th className="p-3 text-right">Threat Vector (TR)</th>
                    <th className="p-3 text-center">Threat Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {pairwiseCorrelations.map((c, index) => {
                    const statusInfo = getThreatLabel(c.directionalCorr);
                    return (
                      <tr key={`pairwise-${index}`} className="hover:bg-white/[0.01] transition-colors">
                        {/* Position 1 info */}
                        <td className="p-3 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-1 py-0.5 rounded font-black ${c.pos1.side === 'BUY' ? 'text-sky-400 bg-sky-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                              {c.pos1.side}
                            </span>
                            <span className="text-white font-bold">{c.pos1.symbol}</span>
                            {c.pos1.isVirtual && (
                              <span className="text-[8px] px-1 bg-white/10 text-white/50 rounded uppercase">Sim</span>
                            )}
                          </div>
                        </td>
                        
                        {/* Position 2 info */}
                        <td className="p-3 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-1 py-0.5 rounded font-black ${c.pos2.side === 'BUY' ? 'text-sky-400 bg-sky-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                              {c.pos2.side}
                            </span>
                            <span className="text-white font-bold">{c.pos2.symbol}</span>
                            {c.pos2.isVirtual && (
                              <span className="text-[8px] px-1 bg-white/10 text-white/50 rounded uppercase">Sim</span>
                            )}
                          </div>
                        </td>

                        {/* Raw score */}
                        <td className="p-3 text-right font-bold text-white/80 font-mono">
                          {c.rawCorr >= 0 ? '+' : ''}{c.rawCorr.toFixed(3)}
                        </td>

                        {/* Net risk adjusted */}
                        <td className="p-3 text-right font-black font-mono">
                          <span className={c.directionalCorr > 0.4 ? 'text-rose-400' : c.directionalCorr <= -0.3 ? 'text-emerald-400' : 'text-indigo-300'}>
                            {c.directionalCorr >= 0 ? '+' : ''}{c.directionalCorr.toFixed(3)}
                          </span>
                        </td>

                        {/* Badge category */}
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-black border whitespace-nowrap uppercase ${statusInfo.style}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col (1/3): Sandbox Simulator */}
        <div className="bg-white/[0.01] border border-white/5 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Shuffle className="w-3.5 h-3.5" />
              <span>CO-EXPOSURE SANDBOX</span>
            </h4>
            
            {virtualPositions.length > 0 && (
              <button
                type="button"
                onClick={clearAllVirtual}
                className="text-[9px] text-white/40 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="Clear all sandbox test assets"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <p className="text-[9.5px] text-white/35 font-sans leading-relaxed">
            Test how hypothetical trades affect the risk profile. Added items below fuse seamlessly into correlation tables.
          </p>

          {/* Setup virtual position form */}
          <form onSubmit={addVirtualPosition} className="space-y-3.5 bg-black/40 border border-white/5 p-3 rounded-md">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-[8.5px] font-bold text-white/40 uppercase">Instrument</label>
                <select
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value as MarketSymbol)}
                  className="w-full bg-[#030303] border border-white/10 rounded px-2 py-1.5 text-[10px] text-indigo-300 font-bold outline-none focus:border-indigo-500"
                >
                  {ALL_SYMBOLS.map((s) => (
                    <option key={`opt-${s}`} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8.5px] font-bold text-white/40 uppercase">Position Action</label>
                <div className="grid grid-cols-2 gap-1 bg-[#030303] border border-white/10 rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => setNewSide('BUY')}
                    className={`py-1 text-[9.5px] font-black rounded uppercase cursor-pointer ${
                      newSide === 'BUY' 
                        ? 'bg-sky-500/15 text-sky-400 font-extrabold' 
                        : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSide('SELL')}
                    className={`py-1 text-[9.5px] font-black rounded uppercase cursor-pointer ${
                      newSide === 'SELL' 
                        ? 'bg-rose-500/15 text-rose-400 font-extrabold' 
                        : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <span className="text-[8.5px] font-bold text-white/40 uppercase">Size (Lots):</span>
                <input
                  type="number"
                  min="0.01"
                  max="10.0"
                  step="0.05"
                  value={newSize}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) setNewSize(val);
                  }}
                  className="bg-[#030303] border border-white/10 rounded px-2 py-1 text-[10px] text-center font-bold text-white w-14 outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[9.5px] transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inject to Model</span>
              </button>
            </div>
          </form>

          {/* Sandbox Position list */}
          <div className="space-y-2">
            <span className="text-[8.5px] font-bold text-white/30 uppercase block">Sandbox Test positions:</span>
            
            {virtualPositions.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-white/5 rounded-md text-[9px] text-white/20 select-none">
                No active tester positions injected. Seed assets are currently active.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {virtualPositions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-black/30 border border-white/5 p-2 rounded text-[10px] hover:border-indigo-500/20 transition-all">
                    <div className="flex items-center gap-2">
                      <span className={`px-1 py-0.5 rounded text-[8.5px] font-black ${p.side === 'BUY' ? 'text-sky-400 bg-sky-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                        {p.side}
                      </span>
                      <strong className="text-white">{p.symbol}</strong>
                      <span className="text-white/45 font-sans">({p.size} lots)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVirtualPosition(p.id)}
                      className="text-white/35 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
                      title="Remove test asset"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
