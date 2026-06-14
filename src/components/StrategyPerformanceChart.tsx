/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area,
  ComposedChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  Compass, 
  Target, 
  Lightbulb, 
  TrendingDown, 
  ArrowRight,
  ShieldAlert,
  Sliders,
  Zap,
  Info,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

// Type definitions for strategies
type StrategyId = 'ALL' | 'FVG' | 'OB' | 'SWEEP' | 'APEX_COMBO';

interface StrategyDetail {
  id: StrategyId;
  name: string;
  description: string;
  creator: string;
  timeframe: string;
  winRate: number;
  avgRR: number;
  totalTrades: number;
  profitFactor: number;
}

const STRATEGIES: Record<StrategyId, StrategyDetail> = {
  ALL: {
    id: 'ALL',
    name: 'All Integrated Strategies',
    description: 'Aggregated view comparing FVG Mitigation, Order Block, Liquidity Hunt and Combo algorithm metrics.',
    creator: 'MTXquant Core',
    timeframe: 'Multi-Timeframe',
    winRate: 61.2,
    avgRR: 1.95,
    totalTrades: 384,
    profitFactor: 2.15
  },
  APEX_COMBO: {
    id: 'APEX_COMBO',
    name: 'MTXquant Confluence Multi-Heuristic',
    description: 'Ensemble algorithm combining multiple structural confirmation signals to trade under high confidence flags.',
    creator: 'MTXquant Labs',
    timeframe: 'H1 / H4',
    winRate: 68.5,
    avgRR: 2.30,
    totalTrades: 124,
    profitFactor: 2.48
  },
  FVG: {
    id: 'FVG',
    name: 'ICT Fair Value Gap Mitigation',
    description: 'Algorithm identifying unbalanced price spikes and buying/selling on zone mitigation retests.',
    creator: 'SMC Engine',
    timeframe: 'M15',
    winRate: 58.0,
    avgRR: 1.85,
    totalTrades: 98,
    profitFactor: 1.92
  },
  OB: {
    id: 'OB',
    name: 'ICT Order Block Zone Retests',
    description: 'Detects heavy institutional accumulation zones and places limit orders on re-evaluation touches.',
    creator: 'Volume Profile AI',
    timeframe: 'H1',
    winRate: 60.5,
    avgRR: 2.10,
    totalTrades: 82,
    profitFactor: 2.22
  },
  SWEEP: {
    id: 'SWEEP',
    name: 'Liquidity Hunter Sweep Extractor',
    description: 'Hunts for false breakout traps above daily session highs/lows and trades the immediate reversal.',
    creator: 'Session Wick Hunt',
    timeframe: 'M5 / M15',
    winRate: 54.2,
    avgRR: 2.45,
    totalTrades: 80,
    profitFactor: 1.88
  }
};

// Backtest runs progression series over 15 historical evaluation epochs
const STRATEGY_HISTORY_DATA = [
  { epoch: 'E1', FVG_win: 50.0, FVG_rr: 1.50, OB_win: 48.0, OB_rr: 1.80, SWEEP_win: 45.0, SWEEP_rr: 2.10, APEX_win: 52.0, APEX_rr: 2.00 },
  { epoch: 'E2', FVG_win: 51.5, FVG_rr: 1.55, OB_win: 50.5, OB_rr: 1.85, SWEEP_win: 46.5, SWEEP_rr: 2.15, APEX_win: 55.0, APEX_rr: 2.05 },
  { epoch: 'E3', FVG_win: 53.0, FVG_rr: 1.62, OB_win: 52.0, OB_rr: 1.90, SWEEP_win: 48.0, SWEEP_rr: 2.20, APEX_win: 58.5, APEX_rr: 2.10 },
  { epoch: 'E4', FVG_win: 52.2, FVG_rr: 1.60, OB_win: 51.2, OB_rr: 1.88, SWEEP_win: 49.5, SWEEP_rr: 2.22, APEX_win: 57.0, APEX_rr: 2.12 },
  { epoch: 'E5', FVG_win: 54.8, FVG_rr: 1.70, OB_win: 53.8, OB_rr: 1.95, SWEEP_win: 51.0, SWEEP_rr: 2.28, APEX_win: 60.5, APEX_rr: 2.18 },
  { epoch: 'E6', FVG_win: 56.1, FVG_rr: 1.75, OB_win: 55.4, OB_rr: 2.02, SWEEP_win: 50.2, SWEEP_rr: 2.30, APEX_win: 63.0, APEX_rr: 2.22 },
  { epoch: 'E7', FVG_win: 55.5, FVG_rr: 1.72, OB_win: 56.0, OB_rr: 2.00, SWEEP_win: 52.5, SWEEP_rr: 2.35, APEX_win: 62.1, APEX_rr: 2.20 },
  { epoch: 'E8', FVG_win: 57.0, FVG_rr: 1.78, OB_win: 57.5, OB_rr: 2.08, SWEEP_win: 53.0, SWEEP_rr: 2.38, APEX_win: 64.8, APEX_rr: 2.25 },
  { epoch: 'E9', FVG_win: 58.2, FVG_rr: 1.82, OB_win: 58.9, OB_rr: 2.12, SWEEP_win: 52.0, SWEEP_rr: 2.40, APEX_win: 66.0, APEX_rr: 2.28 },
  { epoch: 'E10', FVG_win: 57.8, FVG_rr: 1.80, OB_win: 58.2, OB_rr: 2.08, SWEEP_win: 53.8, SWEEP_rr: 2.42, APEX_win: 65.2, APEX_rr: 2.24 },
  { epoch: 'E11', FVG_win: 59.5, FVG_rr: 1.88, OB_win: 59.4, OB_rr: 2.15, SWEEP_win: 54.5, SWEEP_rr: 2.45, APEX_win: 67.5, APEX_rr: 2.32 },
  { epoch: 'E12', FVG_win: 60.2, FVG_rr: 1.90, OB_win: 61.0, OB_rr: 2.18, SWEEP_win: 53.9, SWEEP_rr: 2.43, APEX_win: 68.8, APEX_rr: 2.35 },
  { epoch: 'E13', FVG_win: 59.0, FVG_rr: 1.85, OB_win: 60.1, OB_rr: 2.12, SWEEP_win: 55.0, SWEEP_rr: 2.48, APEX_win: 67.0, APEX_rr: 2.28 },
  { epoch: 'E14', FVG_win: 58.4, FVG_rr: 1.82, OB_win: 59.7, OB_rr: 2.10, SWEEP_win: 54.0, SWEEP_rr: 2.42, APEX_win: 66.8, APEX_rr: 2.26 },
  { epoch: 'E15', FVG_win: 58.0, FVG_rr: 1.85, OB_win: 60.5, OB_rr: 2.10, SWEEP_win: 54.2, SWEEP_rr: 2.45, APEX_win: 68.5, APEX_rr: 2.30 },
];

export default function StrategyPerformanceChart() {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyId>('ALL');
  
  // Highlighting specific metric under comparison mode
  const [comparisonMetric, setComparisonMetric] = useState<'WIN_RATE' | 'RISK_REWARD'>('WIN_RATE');

  // Compute selected strategy stats details
  const strategyInfo = useMemo(() => {
    return STRATEGIES[selectedStrategy];
  }, [selectedStrategy]);

  // Restructure history data based on active filters for seamless charting
  const formattedGraphData = useMemo(() => {
    return STRATEGY_HISTORY_DATA.map((d, index) => {
      const stepLabel = `Epoch ${index + 1}`;
      
      if (selectedStrategy !== 'ALL') {
        const strategyPrefix = selectedStrategy === 'APEX_COMBO' ? 'APEX' : selectedStrategy;
        return {
          name: stepLabel,
          winRate: (d as any)[`${strategyPrefix}_win`],
          riskReward: (d as any)[`${strategyPrefix}_rr`],
        };
      }
      
      return {
        name: stepLabel,
        'Fair Value Gap': d.FVG_win,
        'Order Block': d.OB_win,
        'Liquidity Sweep': d.SWEEP_win,
        'MTXquant Combo': d.APEX_win,
        'Fair Value Gap R:R': d.FVG_rr,
        'Order Block R:R': d.OB_rr,
        'Liquidity Sweep R:R': d.SWEEP_rr,
        'MTXquant Combo R:R': d.APEX_rr,
      };
    });
  }, [selectedStrategy]);

  // Get color schemes per strategy to match Recharts lines perfectly
  const getStrategyColor = (id: StrategyId) => {
    switch (id) {
      case 'APEX_COMBO': return '#6366f1'; // Indigo
      case 'FVG': return '#38bdf8'; // Sky blue
      case 'OB': return '#10b981'; // Emerald
      case 'SWEEP': return '#f59e0b'; // Amber
      default: return '#a855f7'; // Purple
    }
  };

  return (
    <div id="strategy-performance-workspace" className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 flex flex-col space-y-5">
      
      {/* Header section with branding & overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-500/20 text-indigo-400">
            <Target className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
              <span>Strategy Performance Analytics</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8.5px] text-emerald-400 font-bold uppercase tracking-normal">
                Multi-Heuristic Backtests
              </span>
            </h3>
            <p className="text-[10px] text-white/30 font-mono mt-0.5">
              Evaluate real-time algorithmic win ratios & payoff indices across live training sessions
            </p>
          </div>
        </div>

        {/* Dynamic Select Input */}
        <div className="flex items-center space-x-2">
          <span className="text-[9.5px] uppercase font-mono text-white/30 font-semibold tracking-tight">Focus Context:</span>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value as StrategyId)}
            className="bg-[#121214] border border-white/10 text-xs text-white/90 px-2.5 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
          >
            <option value="ALL">Compare All Strategies</option>
            <option value="APEX_COMBO">MTXquant Confluence (68.5%)</option>
            <option value="FVG">ICT Fair Value Gap (58.0%)</option>
            <option value="OB">ICT Order Block Zone (60.5%)</option>
            <option value="SWEEP">Liquidity Hunter (54.2%)</option>
          </select>
        </div>
      </div>

      {/* Strategy Summary Infographic Panels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 select-none">
        
        {/* Win Rate Panel */}
        <div className="bg-[#050506] border border-white/5 p-3 rounded flex flex-col justify-between">
          <span className="text-white/30 text-[9px] uppercase tracking-wider block font-bold font-mono">
            Backtested Win Rate
          </span>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-xl font-mono font-black text-[#e5e5e5]">
              {strategyInfo.winRate}%
            </span>
            <span className="text-[9px] font-mono font-semibold text-emerald-400 flex items-center">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
              +5.4%
            </span>
          </div>
          <p className="text-[8.5px] text-white/20 font-mono mt-1">
            Expected true probability threshold
          </p>
        </div>

        {/* Avg Risk Reward Ratio */}
        <div className="bg-[#050506] border border-white/5 p-3 rounded flex flex-col justify-between">
          <span className="text-white/30 text-[9px] uppercase tracking-wider block font-bold font-mono">
            Average Payoff R:R
          </span>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-xl font-mono font-black text-amber-500">
              {strategyInfo.avgRR}:1
            </span>
            <span className="text-[9px] font-mono font-semibold text-amber-400">
              Realized Gap
            </span>
          </div>
          <p className="text-[8.5px] text-white/20 font-mono mt-1">
            Average stop length vs target depth
          </p>
        </div>

        {/* Total Sample Size */}
        <div className="bg-[#050506] border border-white/5 p-3 rounded flex flex-col justify-between">
          <span className="text-white/30 text-[9px] uppercase tracking-wider block font-bold font-mono">
            Backtest Sample Size
          </span>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-xl font-mono font-black text-indigo-400">
              {strategyInfo.totalTrades}
            </span>
            <span className="text-[9.5px] text-white/40 font-mono">trades</span>
          </div>
          <p className="text-[8.5px] text-white/20 font-mono mt-1">
            Over last 12-week forward evaluation
          </p>
        </div>

        {/* Profit Factor */}
        <div className="bg-[#050506] border border-white/5 p-3 rounded flex flex-col justify-between">
          <span className="text-white/30 text-[9px] uppercase tracking-wider block font-bold font-mono">
            Profit Factor (G:L)
          </span>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-xl font-mono font-black text-emerald-400">
              {strategyInfo.profitFactor}x
            </span>
            <span className="text-[8.5px] py-0.5 px-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-mono rounded">
              OPTIMAL
            </span>
          </div>
          <p className="text-[8.5px] text-white/20 font-mono mt-1">
            Gross gains divided by gross losses
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        
        {/* Left pane: Strategy description information cards */}
        <div className="xl:col-span-4 flex flex-col justify-between space-y-4">
          <div className="bg-[#040405] border border-white/5 p-4 rounded-md h-full flex flex-col justify-between">
            <div className="space-y-3.5">
              <span className="text-[9.5px] text-white/20 font-mono font-semibold tracking-wider uppercase block">
                Algorithmic Strategy Blueprint
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase font-sans">
                  {strategyInfo.name}
                </h4>
                <div className="flex items-center space-x-3 mt-1.5 text-[9px] font-mono text-white/40">
                  <span className="flex items-center"><Award className="w-3 h-3 mr-1 text-amber-500" /> By {strategyInfo.creator}</span>
                  <span className="flex items-center"><Clock className="w-3 h-3 mr-1 text-indigo-400" /> {strategyInfo.timeframe}</span>
                </div>
              </div>

              <p className="text-[10px] text-white/50 leading-relaxed font-sans border-t border-white/5 pt-3">
                {strategyInfo.description}
              </p>

              {/* Dynamic helper advise prompt */}
              <div className="p-3 bg-indigo-500/5 rounded border border-indigo-500/10 text-[9.5px] text-white/40 leading-normal font-sans">
                <span className="text-indigo-300 font-semibold uppercase text-[8.5px] tracking-wider block mb-1 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" /> Quantitative Guidance
                </span>
                {selectedStrategy === 'ALL' ? (
                  <span>
                    Comparative mode displays epochs E1 to E15 showing performance iterations. The ensemble <strong>MTXquant Multi-Heuristic</strong> algorithm outperforms individual modules by combining spatial confirmations with strict trend filtering.
                  </span>
                ) : selectedStrategy === 'APEX_COMBO' ? (
                  <span>
                    Highest win-to-loss validation. Combines liquidity sweeps with re-allocating order block zones to yield robust returns under medium/long duration volatile conditions.
                  </span>
                ) : selectedStrategy === 'FVG' ? (
                  <span>
                    Aggressive execution cycle. Places multiple micro stop distances under momentum. Prone to minor drawdowns in tight session trends but rewards heavily on clean expansion runs.
                  </span>
                ) : selectedStrategy === 'OB' ? (
                  <span>
                    Relies on structural volume signatures. Highly stable with an average 60.5% win rate. It is recommended to bypass execution near massive high-impact monetary events.
                  </span>
                ) : (
                  <span>
                    High risk-reward threshold strategy (2.45:1). Extracts high-yield alpha at structural edges. Triggers moderate drawdowns if the session breakout develops into an institutional run.
                  </span>
                )}
              </div>
            </div>

            {/* Strategic selection controls if comparing */}
            {selectedStrategy === 'ALL' && (
              <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between">
                <span className="text-[9px] uppercase font-mono text-white/30 font-bold">Comparison Vector:</span>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => setComparisonMetric('WIN_RATE')}
                    className={`px-2 py-1 text-[8.5px] font-mono uppercase tracking-tight rounded cursor-pointer border transition-all ${
                      comparisonMetric === 'WIN_RATE'
                        ? 'bg-indigo-600 border-indigo-500 text-white font-black'
                        : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    Win Ratios
                  </button>
                  <button
                    onClick={() => setComparisonMetric('RISK_REWARD')}
                    className={`px-2 py-1 text-[8.5px] font-mono uppercase tracking-tight rounded cursor-pointer border transition-all ${
                      comparisonMetric === 'RISK_REWARD'
                        ? 'bg-[#d97706]/20 border-amber-600 text-amber-300 font-black'
                        : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    Reward Index (R:R)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Recharts Strategy Performance Graph */}
        <div className="xl:col-span-8 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] uppercase text-white/30 font-mono font-bold tracking-tight select-none">
              {selectedStrategy === 'ALL' 
                ? `C) Strategy Contrast Trace: ${comparisonMetric === 'WIN_RATE' ? 'Win Ratio (%)' : 'Average Payoff (R:R)'}` 
                : `C) Multi-Axis Structural Analytics: Cumulative Win Rate & Payoff Ratio`
              }
            </span>
            <div className="flex items-center gap-2 text-[8.5px] font-mono text-white/30 tracking-tight">
              <span>Syncing with Backtester engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>

          <div className="h-[210px] w-full bg-black/40 border border-white/5 rounded-lg p-3 relative">
            
            {selectedStrategy === 'ALL' ? (
              // Multi-line Strategy Comparison Chart
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedGraphData} margin={{ top: 12, right: 10, bottom: -5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255,255,255,0.15)"
                    tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.15)"
                    domain={comparisonMetric === 'WIN_RATE' ? [40, 75] : [1.0, 3.0]}
                    tickFormatter={(v) => comparisonMetric === 'WIN_RATE' ? `${v}%` : `${v}:1`}
                    tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0c0c0e', 
                      border: '1px solid rgba(99, 102, 241, 0.4)', 
                      borderLeft: '3px solid #6366f1',
                      borderRadius: '6px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.85)',
                      fontSize: '10px', 
                      fontFamily: 'monospace' 
                    }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={30} 
                    iconSize={8}
                    wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', color: '#a1a1aa' }}
                  />
                  
                  {comparisonMetric === 'WIN_RATE' ? (
                    <>
                      <Line type="monotone" dataKey="Fair Value Gap" stroke={getStrategyColor('FVG')} strokeWidth={1.5} dot={{ r: 1.5 }} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Order Block" stroke={getStrategyColor('OB')} strokeWidth={1.5} dot={{ r: 1.5 }} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Liquidity Sweep" stroke={getStrategyColor('SWEEP')} strokeWidth={1.5} dot={{ r: 1.5 }} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="MTXquant Combo" stroke={getStrategyColor('APEX_COMBO')} strokeWidth={2.5} dot={{ r: 2.5 }} activeDot={{ r: 5 }} />
                    </>
                  ) : (
                    <>
                      <Line type="monotone" dataKey="Fair Value Gap R:R" name="Fair Value Gap R:R" stroke={getStrategyColor('FVG')} strokeWidth={1.5} dot={{ r: 1.5 }} />
                      <Line type="monotone" dataKey="Order Block R:R" name="Order Block R:R" stroke={getStrategyColor('OB')} strokeWidth={1.5} dot={{ r: 1.5 }} />
                      <Line type="monotone" dataKey="Liquidity Sweep R:R" name="Liquidity Sweep R:R" stroke={getStrategyColor('SWEEP')} strokeWidth={1.5} dot={{ r: 1.5 }} />
                      <Line type="monotone" dataKey="MTXquant Combo R:R" name="MTXquant Combo R:R" stroke={getStrategyColor('APEX_COMBO')} strokeWidth={2.5} dot={{ r: 2.5 }} />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              // Focus Strategy Multi-Axis Chart (Win Rate Area on Left Axis, Risk Reward Line on Right Axis)
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={formattedGraphData} margin={{ top: 12, right: -15, bottom: -5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255,255,255,0.15)"
                    tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}
                  />
                  
                  {/* Left Axis - Win Rate */}
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    stroke={getStrategyColor(selectedStrategy)}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}
                  />

                  {/* Right Axis - Risk Reward */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#f59e0b"
                    domain={['dataMin - 0.2', 'dataMax + 0.2']}
                    tickFormatter={(v) => `${v}:1`}
                    tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}
                  />

                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0c0c0e', 
                      border: '1px solid rgba(245, 158, 11, 0.4)', 
                      borderLeft: '3px solid #f59e0b',
                      borderRadius: '6px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.85)',
                      fontSize: '10px', 
                      fontFamily: 'monospace' 
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={30} 
                    iconSize={8}
                    wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace' }}
                  />

                  {/* Dynamic Area covering cumulative Win Ratios */}
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="winRate" 
                    name="Cumulative Win Rate %" 
                    fill={`${getStrategyColor(selectedStrategy)}15`} 
                    stroke={getStrategyColor(selectedStrategy)} 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />

                  {/* Dynamic Line track covering Payoff Ratio */}
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="riskReward" 
                    name="Risk-Reward Ratio Average" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
