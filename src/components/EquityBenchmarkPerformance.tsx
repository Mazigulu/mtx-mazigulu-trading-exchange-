/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Trade, MarketSymbol } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Calendar,
  Layers,
  Briefcase,
  LineChart as ChartIcon,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Percent,
  Info,
  RefreshCw,
  Gauge
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface EquityBenchmarkPerformanceProps {
  trades: Trade[];
}

// Key benchmarks information
interface BenchmarkMeta {
  id: string;
  name: string;
  ticker: string;
  description: string;
  color: string;
  baseReturn: number; // typical annual return baseline
  volatility: number; // baseline volatility
}

const BENCHMARKS: BenchmarkMeta[] = [
  {
    id: 'spy',
    name: 'S&P 500 Index ETF',
    ticker: 'SPY',
    description: 'Systemic broad US equity market gauge comprising 500 blue-chip market caps.',
    color: '#10b981', // emerald
    baseReturn: 0.12,
    volatility: 0.13
  },
  {
    id: 'qqq',
    name: 'Nasdaq 100 ETF',
    ticker: 'QQQ',
    description: 'Invesco high-beta tech-heavy index measuring top non-financial technology enterprises.',
    color: '#06b6d4', // cyan
    baseReturn: 0.18,
    volatility: 0.18
  },
  {
    id: 'xlk',
    name: 'Technology Select Sector',
    ticker: 'XLK',
    description: 'State Street sector fund isolating software, hardware, and IT service titans.',
    color: '#8b5cf6', // violet
    baseReturn: 0.22,
    volatility: 0.22
  },
  {
    id: 'smh',
    name: 'Semiconductor ETF',
    ticker: 'SMH',
    description: 'VanEck highly concentrated exposure tracking global microchip and fabrication systems.',
    color: '#ec4899', // pink
    baseReturn: 0.32,
    volatility: 0.30
  }
];

// Individual Stock meta for customizable weights
interface StockMeta {
  symbol: MarketSymbol;
  name: string;
  sector: string;
  baseVolatility: number;
  betaToSpy: number;
  color: string;
}

const STOCK_ASSETS: Record<string, StockMeta> = {
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconductors', baseVolatility: 0.42, betaToSpy: 1.85, color: '#22c55e' },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Software & Cloud', baseVolatility: 0.20, betaToSpy: 1.15, color: '#3b82f6' },
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Consumer Hardware', baseVolatility: 0.18, betaToSpy: 1.05, color: '#a855f7' },
  TSLA: { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive & Energy', baseVolatility: 0.48, betaToSpy: 1.60, color: '#eab308' }
};

export default function EquityBenchmarkPerformance({ trades }: EquityBenchmarkPerformanceProps) {
  const [timeHorizon, setTimeHorizon] = useState<'1M' | '3M' | '6M' | '1Y' | 'YTD'>('6M');
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(['spy', 'xlk']);
  
  // Custom Portfolio Stock Weights (must sum to 100%)
  const [weights, setWeights] = useState<Record<MarketSymbol, number>>({
    NVDA: 35,
    MSFT: 25,
    AAPL: 20,
    TSLA: 20,
    US30: 0,
    NAS100: 0,
    GER40: 0,
    SPX500: 0
  });

  const [activeTab, setActiveTab] = useState<'CHART' | 'METRICS' | 'SECTORS'>('CHART');

  // Derive current weights from actual trades if they exist
  const handleLoadActualWeights = () => {
    const stockTrades = trades.filter(t => t.status === 'OPEN' && ['AAPL', 'MSFT', 'NVDA', 'TSLA'].includes(t.symbol));
    if (stockTrades.length === 0) {
      // Set to standard balanced weights
      setWeights(prev => ({
        ...prev,
        NVDA: 25,
        MSFT: 25,
        AAPL: 25,
        TSLA: 25
      }));
      return;
    }

    const totalAllocated = stockTrades.reduce((sum, t) => sum + (t.size * t.entryPrice), 0);
    if (totalAllocated === 0) return;

    const newWeights = { ...weights };
    let assigned = 0;
    
    ['AAPL', 'MSFT', 'NVDA', 'TSLA'].forEach((symbol) => {
      const symTrades = stockTrades.filter(t => t.symbol === symbol);
      const symVal = symTrades.reduce((sum, t) => sum + (t.size * t.entryPrice), 0);
      const pct = Math.round((symVal / totalAllocated) * 100);
      newWeights[symbol as MarketSymbol] = pct;
      assigned += pct;
    });

    // Handle rounding issues to ensure sum === 100
    if (assigned !== 100 && assigned > 0) {
      const diff = 100 - assigned;
      // adjust NVDA or any other
      newWeights.NVDA = Math.max(0, newWeights.NVDA + diff);
    }

    setWeights(newWeights);
  };

  const handleEqualWeights = () => {
    setWeights(prev => ({
      ...prev,
      NVDA: 25,
      MSFT: 25,
      AAPL: 25,
      TSLA: 25
    }));
  };

  // Adjust a single weight and redistribute the rest to maintain 100% total
  const handleWeightChange = (symbol: MarketSymbol, newVal: number) => {
    const keys: MarketSymbol[] = ['NVDA', 'MSFT', 'AAPL', 'TSLA'];
    const otherKeys = keys.filter(k => k !== symbol);
    
    const remaining = 100 - newVal;
    const currentOthersSum = otherKeys.reduce((sum, k) => sum + weights[k], 0);

    const updated = { ...weights };
    updated[symbol] = newVal;

    if (currentOthersSum === 0) {
      // Distribute remaining equally
      otherKeys.forEach(k => {
        updated[k] = Math.round(remaining / otherKeys.length);
      });
    } else {
      // Proportionally scale other weights
      let checkSum = newVal;
      otherKeys.forEach((k, idx) => {
        if (idx === otherKeys.length - 1) {
          updated[k] = 100 - checkSum; // ensure exact 100% sum
        } else {
          const scaled = Math.round((weights[k] / currentOthersSum) * remaining);
          updated[k] = scaled;
          checkSum += scaled;
        }
      });
    }
    setWeights(updated);
  };

  // Generate realistic historical daily walk data based on time horizon
  const benchmarkData = useMemo(() => {
    let days = 126; // 6M standard business days
    if (timeHorizon === '1M') days = 21;
    if (timeHorizon === '3M') days = 63;
    if (timeHorizon === '6M') days = 126;
    if (timeHorizon === '1Y') days = 252;
    if (timeHorizon === 'YTD') {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const diffTime = Math.abs(today.getTime() - startOfYear.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      days = Math.max(20, Math.min(252, Math.round(diffDays * 5 / 7))); // business days estimate
    }

    // Historical daily paths seed
    // Using deterministic pseudo-random generator with fixed seed to avoid chaotic jumps on UI state changes,
    // but allowing interaction inputs to reshape curves beautifully.
    const seedRandom = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const dataPoints = [];
    let portfolioPrice = 100;
    let spyPrice = 100;
    let qqqPrice = 100;
    let xlkPrice = 100;
    let smhPrice = 100;

    // Define daily drifts and standard deviations (matching realistic stock/ETF parameters)
    const stats = {
      spy: { drift: 0.0004, vol: 0.008 },
      qqq: { drift: 0.0006, vol: 0.011 },
      xlk: { drift: 0.0008, vol: 0.013 },
      smh: { drift: 0.0011, vol: 0.018 },
      NVDA: { drift: 0.0022, vol: 0.024 },
      MSFT: { drift: 0.0007, vol: 0.012 },
      AAPL: { drift: 0.0006, vol: 0.011 },
      TSLA: { drift: 0.0009, vol: 0.028 }
    };

    const today = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Daily random walk vectors (using seed correlated to step index for stability)
      const rGlobal = seedRandom(i + 4) - 0.48; // broad market systemic shock
      const rTech = seedRandom(i + 12) - 0.47;  // technology sectoral shock
      const rSemi = seedRandom(i + 27) - 0.46;  // hardware specific shock
      const rTesla = seedRandom(i + 91) - 0.50;  // idiosyncratic TSLA shock

      // Calculate stock returns
      const nvdaReturn = stats.NVDA.drift + (stats.NVDA.vol * (rGlobal * 0.4 + rTech * 0.5 + rSemi * 0.6));
      const msftReturn = stats.MSFT.drift + (stats.MSFT.vol * (rGlobal * 0.6 + rTech * 0.7));
      const aaplReturn = stats.AAPL.drift + (stats.AAPL.vol * (rGlobal * 0.7 + rTech * 0.5));
      const tslaReturn = stats.TSLA.drift + (stats.TSLA.vol * (rGlobal * 0.5 + rTesla * 1.2));

      // Benchmark returns
      const spyReturn = stats.spy.drift + (stats.spy.vol * rGlobal);
      const qqqReturn = stats.qqq.drift + (stats.qqq.vol * (rGlobal * 0.5 + rTech * 0.8));
      const xlkReturn = stats.xlk.drift + (stats.xlk.vol * (rGlobal * 0.4 + rTech * 0.9));
      const smhReturn = stats.smh.drift + (stats.smh.vol * (rGlobal * 0.3 + rTech * 0.6 + rSemi * 0.8));

      // Portfolio combined return based on user weights
      const portfolioReturn = 
        (weights.NVDA / 100) * nvdaReturn +
        (weights.MSFT / 100) * msftReturn +
        (weights.AAPL / 100) * aaplReturn +
        (weights.TSLA / 100) * tslaReturn;

      if (i === days) {
        // Initializing baseline
        dataPoints.push({
          date: dateString,
          'My Portfolio': 0.0,
          'SPY (S&P 500)': 0.0,
          'QQQ (Nasdaq 100)': 0.0,
          'XLK (Tech ETF)': 0.0,
          'SMH (Semi ETF)': 0.0
        });
      } else {
        portfolioPrice *= (1 + portfolioReturn);
        spyPrice *= (1 + spyReturn);
        qqqPrice *= (1 + qqqReturn);
        xlkPrice *= (1 + xlkReturn);
        smhPrice *= (1 + smhReturn);

        dataPoints.push({
          date: dateString,
          'My Portfolio': parseFloat(((portfolioPrice - 100)).toFixed(2)),
          'SPY (S&P 500)': parseFloat(((spyPrice - 100)).toFixed(2)),
          'QQQ (Nasdaq 100)': parseFloat(((qqqPrice - 100)).toFixed(2)),
          'XLK (Tech ETF)': parseFloat(((xlkPrice - 100)).toFixed(2)),
          'SMH (Semi ETF)': parseFloat(((smhPrice - 100)).toFixed(2))
        });
      }
    }

    return dataPoints;
  }, [timeHorizon, weights]);

  // Derived Performance Metrics for comparison table
  const finalMetrics = useMemo(() => {
    const lastPoint = benchmarkData[benchmarkData.length - 1];
    
    // Total Cumulative Returns
    const pRet = lastPoint['My Portfolio'];
    const spyRet = lastPoint['SPY (S&P 500)'];
    const qqqRet = lastPoint['QQQ (Nasdaq 100)'];
    const xlkRet = lastPoint['XLK (Tech ETF)'];
    const smhRet = lastPoint['SMH (Semi ETF)'];

    // Volatility estimations based on weight vectors
    const calcVol = () => {
      const nv = weights.NVDA / 100;
      const ms = weights.MSFT / 100;
      const ap = weights.AAPL / 100;
      const ts = weights.TSLA / 100;

      // Simplistic portfolio variance with modest positive covariances
      const variance = 
        (nv * 0.42) ** 2 + (ms * 0.20) ** 2 + (ap * 0.18) ** 2 + (ts * 0.48) ** 2 +
        2 * nv * ms * (0.42 * 0.20 * 0.35) +
        2 * nv * ap * (0.42 * 0.18 * 0.30) +
        2 * ms * ap * (0.20 * 0.18 * 0.55) +
        2 * nv * ts * (0.42 * 0.48 * 0.25);
      return Math.sqrt(variance);
    };

    const pVol = calcVol();
    const spyVol = 0.125;
    const qqqVol = 0.168;
    const xlkVol = 0.194;
    const smhVol = 0.285;

    // Sharpe Ratio (assume 3.5% risk free rate)
    const rf = 0.035;
    const daysFactor = timeHorizon === '1M' ? 1/12 : timeHorizon === '3M' ? 3/12 : timeHorizon === '6M' ? 6/12 : 1;
    const pSharpe = (pRet / 100 - rf * daysFactor) / (pVol * Math.sqrt(daysFactor));
    const spySharpe = (spyRet / 100 - rf * daysFactor) / (spyVol * Math.sqrt(daysFactor));
    const qqqSharpe = (qqqRet / 100 - rf * daysFactor) / (qqqVol * Math.sqrt(daysFactor));
    const xlkSharpe = (xlkRet / 100 - rf * daysFactor) / (xlkVol * Math.sqrt(daysFactor));
    const smhSharpe = (smhRet / 100 - rf * daysFactor) / (smhVol * Math.sqrt(daysFactor));

    // Drawdowns
    const pMaxDd = -4.5 - (weights.NVDA * 0.15 + weights.TSLA * 0.22 + weights.MSFT * 0.06 + weights.AAPL * 0.05);
    const spyMaxDd = -7.2;
    const qqqMaxDd = -9.8;
    const xlkMaxDd = -11.4;
    const smhMaxDd = -18.2;

    // Beta estimation
    const pBeta = 
      (weights.NVDA / 100) * 1.85 +
      (weights.MSFT / 100) * 1.15 +
      (weights.AAPL / 100) * 1.05 +
      (weights.TSLA / 100) * 1.60;

    // Alpha annualized estimation
    const pAlpha = (pRet - spyRet * pBeta);

    return {
      portfolio: { return: pRet, vol: pVol * 100, sharpe: pSharpe, maxDd: pMaxDd, beta: pBeta, alpha: pAlpha },
      spy: { return: spyRet, vol: spyVol * 100, sharpe: spySharpe, maxDd: spyMaxDd, beta: 1.0, alpha: 0 },
      qqq: { return: qqqRet, vol: qqqVol * 100, sharpe: qqqSharpe, maxDd: qqqMaxDd, beta: 1.34, alpha: 2.1 },
      xlk: { return: xlkRet, vol: xlkVol * 100, sharpe: xlkSharpe, maxDd: xlkMaxDd, beta: 1.48, alpha: 4.8 },
      smh: { return: smhRet, vol: smhVol * 100, sharpe: smhSharpe, maxDd: smhMaxDd, beta: 2.12, alpha: 12.4 }
    };
  }, [benchmarkData, weights, timeHorizon]);

  // Benchmark Line details to render dynamically
  const activeBenchmarkLines = useMemo(() => {
    return BENCHMARKS.filter(b => selectedBenchmarks.includes(b.id));
  }, [selectedBenchmarks]);

  // Qualitative analysis commentary based on custom configuration
  const performanceCommentary = useMemo(() => {
    const portfolioReturn = finalMetrics.portfolio.return;
    const spyReturn = finalMetrics.spy.return;
    const trackingDiff = portfolioReturn - spyReturn;
    const sortedStocks = (['NVDA', 'MSFT', 'AAPL', 'TSLA'] as MarketSymbol[]).map(sym => ({
      symbol: sym,
      weight: weights[sym] || 0
    })).sort((a, b) => b.weight - a.weight);
    
    const highStock = sortedStocks[0].symbol;
    const isOverperforming = trackingDiff > 0;
    
    let analysis = '';
    let category = '';
    
    if (weights.NVDA > 40 || weights.TSLA > 40) {
      category = 'Aggressive Alpha Chaser';
      analysis = `Your strategy is heavily geared towards high-momentum beta. Your dominant allocation in ${highStock} (${weights[highStock as MarketSymbol]}%) increases system risk but has generated ${trackingDiff.toFixed(1)}% of absolute tracking drift against the S&P 500. Under restrictive monetary policy or technical selloffs, expect standard drawdown depths to exceed historical indices by 2.1x.`;
    } else if (weights.MSFT > 35 && weights.AAPL > 35) {
      category = 'Tech Heavyweight Conservative';
      analysis = `Your portfolio is positioned primarily in tech megacaps. This anchors your returns closely to the QQQ and XLK benchmarks, providing a lower standard deviation (${finalMetrics.portfolio.vol.toFixed(1)}%) compared to semiconductor sector indexes, while capturing a robust Sharpe Ratio of ${finalMetrics.portfolio.sharpe.toFixed(2)}. This represents excellent risk-adjusted compounding.`;
    } else {
      category = 'Balanced Tech Portfolio';
      analysis = `By distributing equity weight fairly evenly across software and hardware titans, you maintain a balanced technology profile. Your Beta against SPY is optimized at ${finalMetrics.portfolio.beta.toFixed(2)}, providing superior upside capture in market expansions while keeping your Max Drawdown constrained to ${finalMetrics.portfolio.maxDd.toFixed(1)}%.`;
    }

    return {
      category,
      analysis,
      isOverperforming
    };
  }, [weights, finalMetrics]);

  return (
    <div id="equity-benchmark-panel" className="bg-[#0a0a0c] border border-white/5 rounded-xl p-5 font-mono select-none overflow-hidden relative">
      
      {/* Absolute Decorative Glow lines in background */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[8.5px] font-black tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 uppercase">
              Equity Engine
            </span>
            <span className="text-[10px] text-neutral-200">QUANT-SYSTEM v2.9</span>
          </div>
          <h2 className="text-base font-black text-white uppercase tracking-tight mt-1 flex items-center gap-2">
            <ChartIcon className="w-4.5 h-4.5 text-indigo-400" />
            Equity Performance & Benchmarking
          </h2>
          <p className="text-[10px] text-neutral-200 mt-0.5 leading-relaxed">
            Side-by-side performance matching of your custom tech holdings against broad indices (SPY, QQQ) and select sector funds (XLK, SMH).
          </p>
        </div>

        {/* Time-horizon switch */}
        <div className="flex items-center bg-[#050507] p-1 rounded border border-white/5">
          {(['1M', '3M', '6M', '1Y', 'YTD'] as const).map((h) => (
            <button
              key={h}
              onClick={() => setTimeHorizon(h)}
              className={`px-2.5 py-1 text-[9px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                timeHorizon === h 
                  ? 'bg-indigo-650 text-indigo-100 font-black border border-indigo-500/20' 
                  : 'text-neutral-450 hover:text-neutral-200'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Main Core Grid Layout (Controls Left, Viz Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT COLUMN: Weights & Customizer Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#050507] p-4 rounded-lg border border-white/5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="text-[11px] font-extrabold uppercase text-white tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Portfolio Allocation Weights
              </h3>
              <div className="flex gap-1.5">
                <button 
                  onClick={handleLoadActualWeights} 
                  title="Pull open position weights"
                  className="p-1 rounded bg-white/5 hover:bg-white/10 active:bg-white/15 text-neutral-200 hover:text-white transition-all text-[8.5px] font-bold tracking-wider uppercase cursor-pointer"
                >
                  Live
                </button>
                <button 
                  onClick={handleEqualWeights} 
                  title="Rebalance equally"
                  className="p-1 rounded bg-white/5 hover:bg-white/10 active:bg-white/15 text-neutral-200 hover:text-white transition-all text-[8.5px] font-bold tracking-wider uppercase cursor-pointer"
                >
                  Equal
                </button>
              </div>
            </div>

            {/* Weights info text */}
            <p className="text-[9.5px] text-neutral-200 leading-relaxed">
              Manually drag the equity weights below. Dynamic scaling guarantees a systemic 100% net allocation.
            </p>

            {/* Sliders loop */}
            <div className="space-y-3.5 pt-1">
              {(['NVDA', 'MSFT', 'AAPL', 'TSLA'] as const).map((sym) => {
                const sMeta = STOCK_ASSETS[sym];
                return (
                  <div key={sym} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sMeta.color }} />
                        <span className="font-extrabold text-white">{sym}</span>
                        <span className="text-[8.5px] text-neutral-200">({sMeta.sector})</span>
                      </div>
                      <span className="font-black text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/10 font-mono">
                        {weights[sym]}%
                      </span>
                    </div>

                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={weights[sym]} 
                      onChange={(e) => handleWeightChange(sym, parseInt(e.target.value) || 0)}
                      className="w-full accent-indigo-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
              <span className="text-neutral-200 font-semibold">Aggregate System Weight:</span>
              <span className="font-black text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                100% Locked
              </span>
            </div>
          </div>

          {/* Benchmark Selectors */}
          <div className="bg-[#050507] p-4 rounded-lg border border-white/5 space-y-3">
            <h3 className="text-[11px] font-extrabold uppercase text-white tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Benchmark Comparators
            </h3>
            
            <p className="text-[9.5px] text-neutral-200 leading-relaxed">
              Select benchmarks to overlay on the performance timeline.
            </p>

            <div className="space-y-2 pt-1">
              {BENCHMARKS.map((bench) => {
                const isSelected = selectedBenchmarks.includes(bench.id);
                return (
                  <button
                    key={bench.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedBenchmarks(prev => prev.filter(id => id !== bench.id));
                      } else {
                        setSelectedBenchmarks(prev => [...prev, bench.id]);
                      }
                    }}
                    className={`w-full text-left p-2 rounded border text-[10px] flex items-center justify-between transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-white/[0.02] border-indigo-500/20 shadow-sm' 
                        : 'border-white/5 hover:border-white/10 hover:bg-white/[0.01]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bench.color }} />
                      <div>
                        <span className="font-extrabold text-white">{bench.ticker}</span>
                        <span className="text-[8.5px] text-neutral-200 block mt-0.5">{bench.name}</span>
                      </div>
                    </div>
                    <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-neutral-400'
                    }`}>
                      {isSelected ? 'ACTIVE' : 'MUTED'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Visualizer Chart & Tables */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Internal sub-tab selector */}
          <div className="flex border-b border-white/5 font-mono text-[10px] font-bold space-x-2">
            <button
              onClick={() => setActiveTab('CHART')}
              className={`pb-2.5 px-2 uppercase tracking-wide border-b-2 transition-all cursor-pointer ${
                activeTab === 'CHART'
                  ? 'border-indigo-500 text-white font-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Return Curve Comparison
            </button>
            <button
              onClick={() => setActiveTab('METRICS')}
              className={`pb-2.5 px-2 uppercase tracking-wide border-b-2 transition-all cursor-pointer ${
                activeTab === 'METRICS'
                  ? 'border-indigo-500 text-white font-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Risk & Factor Analysis
            </button>
            <button
              onClick={() => setActiveTab('SECTORS')}
              className={`pb-2.5 px-2 uppercase tracking-wide border-b-2 transition-all cursor-pointer ${
                activeTab === 'SECTORS'
                  ? 'border-indigo-500 text-white font-black'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Correlation & Weights
            </button>
          </div>

          {/* VIZ VIEWPORT 1: Curve Chart */}
          {activeTab === 'CHART' && (
            <div className="bg-[#050507] p-4 rounded-lg border border-white/5 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wide">Comparative Equity Yield Timeline</h4>
                  <p className="text-[9.5px] text-neutral-200 mt-0.5">Tracking percent delta returns from inception baseline of 0%.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded border border-white/5 text-[9px]">
                  <span className="text-neutral-200">Total Period Delta:</span>
                  <span className={`font-black ${finalMetrics.portfolio.return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {finalMetrics.portfolio.return >= 0 ? '+' : ''}{finalMetrics.portfolio.return.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Chart Frame */}
              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={benchmarkData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#ffffff25" 
                      tick={{ fill: '#ffffff50', fontSize: 9 }} 
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#ffffff25" 
                      tick={{ fill: '#ffffff50', fontSize: 9 }} 
                      tickFormatter={(val) => `${val}%`}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#050507',
                        borderColor: '#ffffff10',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        color: '#fff',
                        borderRadius: '6px'
                      }}
                      formatter={(value: any) => [`${value}%`, '']}
                    />
                    
                    {/* Primary Line: My Portfolio */}
                    <Line
                      type="monotone"
                      dataKey="My Portfolio"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, stroke: '#6366f1', strokeWidth: 1 }}
                    />

                    {/* Benchmark Lines */}
                    {selectedBenchmarks.includes('spy') && (
                      <Line
                        type="monotone"
                        dataKey="SPY (S&P 500)"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                    {selectedBenchmarks.includes('qqq') && (
                      <Line
                        type="monotone"
                        dataKey="QQQ (Nasdaq 100)"
                        stroke="#06b6d4"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                    {selectedBenchmarks.includes('xlk') && (
                      <Line
                        type="monotone"
                        dataKey="XLK (Tech ETF)"
                        stroke="#8b5cf6"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                    {selectedBenchmarks.includes('smh') && (
                      <Line
                        type="monotone"
                        dataKey="SMH (Semi ETF)"
                        stroke="#ec4899"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Legends explanation */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/5 text-[9.5px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#6366f1]" />
                  <span className="font-extrabold text-white">My Portfolio (Weighted)</span>
                </div>
                {activeBenchmarkLines.map(b => (
                  <div key={b.id} className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: b.color }} />
                    <span className="text-neutral-200">{b.ticker} Benchmark</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIZ VIEWPORT 2: Detailed KPI Matrix */}
          {activeTab === 'METRICS' && (
            <div className="bg-[#050507] p-4 rounded-lg border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wide font-mono font-bold">Modern Portfolio Theory Risk-Return Grid</h4>
                  <p className="text-[9.5px] text-neutral-200 mt-0.5 font-bold">Annualized Sharpe Ratios, Tracking Error, Alpha, and Beta comparisons.</p>
                </div>
              </div>

              {/* Structured Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-[9px] uppercase text-neutral-200 font-mono">
                      <th className="pb-2">Performance Basket</th>
                      <th className="pb-2 text-right">Total Yield</th>
                      <th className="pb-2 text-right">Ann. Volatility</th>
                      <th className="pb-2 text-right">Sharpe Ratio</th>
                      <th className="pb-2 text-right">Max Drawdown</th>
                      <th className="pb-2 text-right">Beta vs SPY</th>
                      <th className="pb-2 text-right">Alpha vs SPY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {/* Primary: My Portfolio */}
                    <tr className="bg-indigo-500/[0.03]">
                      <td className="py-2.5 font-extrabold text-indigo-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        My Custom Portfolio
                      </td>
                      <td className="text-right text-white font-extrabold">
                        {finalMetrics.portfolio.return >= 0 ? '+' : ''}{finalMetrics.portfolio.return.toFixed(1)}%
                      </td>
                      <td className="text-right text-neutral-200">{finalMetrics.portfolio.vol.toFixed(1)}%</td>
                      <td className="text-right font-black text-amber-400">{finalMetrics.portfolio.sharpe.toFixed(2)}</td>
                      <td className="text-right text-rose-400">{finalMetrics.portfolio.maxDd.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">{finalMetrics.portfolio.beta.toFixed(2)}</td>
                      <td className="text-right text-emerald-400 font-bold">
                        {finalMetrics.portfolio.alpha >= 0 ? '+' : ''}{finalMetrics.portfolio.alpha.toFixed(1)}%
                      </td>
                    </tr>

                    {/* Benchmarks */}
                    <tr>
                      <td className="py-2.5 font-bold text-neutral-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        SPY (S&P 500 Index)
                      </td>
                      <td className="text-right text-neutral-200">{finalMetrics.spy.return >= 0 ? '+' : ''}{finalMetrics.spy.return.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">{finalMetrics.spy.vol.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">{finalMetrics.spy.sharpe.toFixed(2)}</td>
                      <td className="text-right text-rose-500/75">{finalMetrics.spy.maxDd.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">1.00 (Base)</td>
                      <td className="text-right text-neutral-200">--</td>
                    </tr>

                    <tr>
                      <td className="py-2.5 font-bold text-neutral-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        QQQ (Nasdaq 100)
                      </td>
                      <td className="text-right text-neutral-200">{finalMetrics.qqq.return >= 0 ? '+' : ''}{finalMetrics.qqq.return.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">{finalMetrics.qqq.vol.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">{finalMetrics.qqq.sharpe.toFixed(2)}</td>
                      <td className="text-right text-rose-500/75">{finalMetrics.qqq.maxDd.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">{finalMetrics.qqq.beta.toFixed(2)}</td>
                      <td className="text-right text-emerald-500/60">+{finalMetrics.qqq.alpha.toFixed(1)}%</td>
                    </tr>

                    <tr>
                      <td className="py-2.5 font-bold text-neutral-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        XLK (Technology Sector)
                      </td>
                      <td className="text-right text-neutral-200">{finalMetrics.xlk.return >= 0 ? '+' : ''}{finalMetrics.xlk.return.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">{finalMetrics.xlk.vol.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">{finalMetrics.xlk.sharpe.toFixed(2)}</td>
                      <td className="text-right text-rose-500/75">{finalMetrics.xlk.maxDd.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">{finalMetrics.xlk.beta.toFixed(2)}</td>
                      <td className="text-right text-emerald-500/60">+{finalMetrics.xlk.alpha.toFixed(1)}%</td>
                    </tr>

                    <tr>
                      <td className="py-2.5 font-bold text-neutral-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                        SMH (Semiconductor ETF)
                      </td>
                      <td className="text-right text-neutral-200">{finalMetrics.smh.return >= 0 ? '+' : ''}{finalMetrics.smh.return.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">{finalMetrics.smh.vol.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">{finalMetrics.smh.sharpe.toFixed(2)}</td>
                      <td className="text-right text-rose-500/75">{finalMetrics.smh.maxDd.toFixed(1)}%</td>
                      <td className="text-right text-neutral-200">{finalMetrics.smh.beta.toFixed(2)}</td>
                      <td className="text-right text-emerald-500/60">+{finalMetrics.smh.alpha.toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Informative definitions footer */}
              <div className="bg-black/40 p-2.5 rounded border border-white/5 text-[9px] text-neutral-200 space-y-1">
                <div className="flex gap-2">
                  <span className="font-bold text-neutral-200">Sharpe Ratio:</span> 
                  <span>Risk-adjusted excess return per unit of annualized volatility. Higher represents stronger structural compounding safety.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-neutral-200">Beta Exposure:</span> 
                  <span>Systemic correlation multiplier to broad index. Beta &gt; 1 indicates high momentum elasticity, amplifying broad index swings.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-neutral-200">Active Alpha:</span> 
                  <span>Outperformance or residual returns generated above and beyond systemic market beta predictions.</span>
                </div>
              </div>
            </div>
          )}

          {/* VIZ VIEWPORT 3: Weightings vs Sector ETFs */}
          {activeTab === 'SECTORS' && (
            <div className="bg-[#050507] p-4 rounded-lg border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wide">Sector ETF Tracking & Exposure Breakdown</h4>
                  <p className="text-[9.5px] text-neutral-200 mt-0.5">Calculating tracking correlation offsets to technology indexes.</p>
                </div>
              </div>

              {/* Horizontal weight visual bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-neutral-200">Core Hardware & Chips (SMH Equivalent)</span>
                    <span className="font-bold text-white">{weights.NVDA}%</span>
                  </div>
                  <div className="w-full bg-[#0a0a0c] h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-pink-500 h-full rounded-full" style={{ width: `${weights.NVDA}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-neutral-200">Software & Enterprise Systems (XLK Equivalent)</span>
                    <span className="font-bold text-white">{(weights.MSFT + weights.AAPL)}%</span>
                  </div>
                  <div className="w-full bg-[#0a0a0c] h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${weights.MSFT + weights.AAPL}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-neutral-200">Automotive & Clean Tech (Discretionary)</span>
                    <span className="font-bold text-white">{weights.TSLA}%</span>
                  </div>
                  <div className="w-full bg-[#0a0a0c] h-2 rounded-full overflow-hidden border border-white/5">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${weights.TSLA}%` }} />
                  </div>
                </div>
              </div>

              {/* Performance Drivers list */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <h5 className="text-[10px] font-black uppercase text-white">Dynamic Asset Performance Contributions</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-black/35 p-3 rounded border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-emerald-500/10 rounded">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-white block">NVDA Alpha Catalyst</span>
                        <span className="text-[8.5px] text-neutral-200 block">Semiconductor Tailwinds</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-400">+{((weights.NVDA * 0.32) / 10).toFixed(1)}% Cont.</span>
                  </div>

                  <div className="bg-black/35 p-3 rounded border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-blue-500/10 rounded">
                        <Gauge className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-white block">MSFT Heavy Anchor</span>
                        <span className="text-[8.5px] text-neutral-200 block">Enterprise SaaS Stability</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-blue-400">+{((weights.MSFT * 0.14) / 10).toFixed(1)}% Cont.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE ADVISORY CALLOUT (Updates dynamically) */}
          <div className={`p-4 rounded-lg border flex items-start gap-3.5 transition-all ${
            performanceCommentary.isOverperforming
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}>
            <Info className={`w-4.5 h-4.5 mt-0.5 shrink-0 ${performanceCommentary.isOverperforming ? 'text-emerald-400' : 'text-rose-400'}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black font-mono uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded">
                  {performanceCommentary.category}
                </span>
                <span className="text-[9px] text-neutral-200">TRACKING SENSITIVITY ADVISORY</span>
              </div>
              <p className="text-[10px] leading-relaxed mt-1.5 text-neutral-200 font-mono">
                {performanceCommentary.analysis}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
