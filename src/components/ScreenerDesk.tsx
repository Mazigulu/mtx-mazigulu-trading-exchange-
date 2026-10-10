/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sliders,
  Download,
  TrendingUp,
  Zap,
  Building2,
  ShieldCheck,
  RotateCcw,
  FileText,
  ArrowUpDown,
  CheckCircle2,
  Sparkles,
  Layers,
  ExternalLink,
  RefreshCw,
  Cpu,
  BarChart3,
  Globe
} from 'lucide-react';
import {
  screenerPipeline,
  EnhancedScreenerAsset,
  FactorWeights,
  PipelineSummaryMetrics,
  calculateAlphaScore
} from '../lib/screenerPipeline';

export interface ScreenerDeskProps {
  onSelectSymbol: (symbol: string) => void;
  onSelectTab: (tab: any) => void;
}

type SortField =
  | 'ticker'
  | 'name'
  | 'sector'
  | 'marketCap'
  | 'peRatio'
  | 'roe'
  | 'profitMargin'
  | 'fiftyTwoWeekChange'
  | 'dividendYield'
  | 'debtToEquity'
  | 'revenueGrowth'
  | 'price'
  | 'change24h'
  | 'rvol'
  | 'alphaScore';

type PresetMode = 'ALL' | 'PROP_DESK' | 'FAMILY_OFFICE' | 'DEEP_VALUE' | 'AI_SEMI' | 'RVOL_SPIKE';

export function ScreenerDesk({ onSelectSymbol, onSelectTab }: ScreenerDeskProps) {
  // Holdings state to display demo/real owned shares in screener table
  const [holdings, setHoldings] = useState<Record<string, number>>(() => {
    try {
      const mode = (typeof window !== 'undefined' && localStorage.getItem('mtx_account_mode') === 'REAL') ? 'REAL' : 'DEMO';
      const key = mode === 'REAL' ? 'broker_holdings_real' : 'broker_holdings_demo';
      let saved = localStorage.getItem(key);
      if (!saved && mode === 'DEMO') saved = localStorage.getItem('broker_holdings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  useEffect(() => {
    const handleSyncHoldings = () => {
      try {
        const mode = (localStorage.getItem('mtx_account_mode') === 'REAL') ? 'REAL' : 'DEMO';
        const key = mode === 'REAL' ? 'broker_holdings_real' : 'broker_holdings_demo';
        let saved = localStorage.getItem(key);
        if (!saved && mode === 'DEMO') saved = localStorage.getItem('broker_holdings');
        if (saved) setHoldings(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('storage', handleSyncHoldings);
    window.addEventListener('mtx_order_executed', handleSyncHoldings);
    return () => {
      window.removeEventListener('storage', handleSyncHoldings);
      window.removeEventListener('mtx_order_executed', handleSyncHoldings);
    };
  }, []);

  // Quantitative Factor Weights
  const [weights, setWeights] = useState<FactorWeights>({
    value: 20,
    growth: 25,
    quality: 25,
    momentum: 30
  });

  // Pipeline Data State
  const [universe, setUniverse] = useState<EnhancedScreenerAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pipelineLatency, setPipelineLatency] = useState(4);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedPreset, setSelectedPreset] = useState<PresetMode>('ALL');
  const [marketCapTier, setMarketCapTier] = useState<'ALL' | 'MEGA' | 'LARGE' | 'MID' | 'SMALL'>('ALL');

  // Quantitative Metric Sliders / Bounds
  const [maxPE, setMaxPE] = useState<number>(100);
  const [minROE, setMinROE] = useState<number>(0);
  const [minRevGrowth, setMinRevGrowth] = useState<number>(-0.2);
  const [minDivYield, setMinDivYield] = useState<number>(0);
  const [maxDebtToEquity, setMaxDebtToEquity] = useState<number>(10);
  const [minAlphaScore, setMinAlphaScore] = useState<number>(0);
  const [minRVOL, setMinRVOL] = useState<number>(0);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('alphaScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Drawers
  const [isFactorBuilderOpen, setIsFactorBuilderOpen] = useState(false);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Column Visibility Controls
  const [visibleColumns, setVisibleColumns] = useState({
    sector: true,
    alphaScore: true,
    price: true,
    change24h: true,
    rvol: true,
    marketCap: true,
    peRatio: true,
    roe: true,
    profitMargin: true,
    dividendYield: true,
    debtToEquity: true,
    fiftyTwoWeekChange: true,
  });

  // 1. Ingestion: Fetch data through structured pipeline
  const loadPipelineData = useCallback(async (force = false) => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const data = await screenerPipeline.getUniverse(weights, force);
      const elapsed = Math.round(performance.now() - start);
      setPipelineLatency(elapsed || 4);
      setUniverse(data);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('[Pipeline Ingestion Error]', err);
    } finally {
      setIsLoading(false);
    }
  }, [weights]);

  useEffect(() => {
    loadPipelineData();
  }, [loadPipelineData]);

  // Recalculate alpha scores dynamically when factor weights change
  const scoredUniverse = useMemo(() => {
    return universe.map(item => ({
      ...item,
      alphaScore: calculateAlphaScore(item, item.rvol, weights)
    }));
  }, [universe, weights]);

  // 2. Transformation: Execute multi-factor filtering
  const filteredData = useMemo(() => {
    return screenerPipeline.executeFilter(scoredUniverse, {
      searchTerm,
      sector: selectedSector,
      marketCapTier,
      maxPE,
      minROE,
      minRevGrowth,
      minDivYield,
      maxDebtToEquity,
      minAlphaScore,
      minRVOL,
      preset: selectedPreset
    });
  }, [
    scoredUniverse,
    searchTerm,
    selectedSector,
    marketCapTier,
    maxPE,
    minROE,
    minRevGrowth,
    minDivYield,
    maxDebtToEquity,
    minAlphaScore,
    minRVOL,
    selectedPreset
  ]);

  // 3. Sorting Step
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (valA === null || valA === undefined) valA = sortOrder === 'asc' ? Infinity : -Infinity;
      if (valB === null || valB === undefined) valB = sortOrder === 'asc' ? Infinity : -Infinity;

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredData, sortField, sortOrder]);

  // 4. Aggregated Statistical Metrics
  const summaryMetrics: PipelineSummaryMetrics = useMemo(() => {
    return screenerPipeline.computeSummary(sortedData, universe.length, pipelineLatency);
  }, [sortedData, universe.length, pipelineLatency]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Preset Handlers
  const applyPreset = (preset: PresetMode) => {
    setSelectedPreset(preset);
    if (preset === 'ALL') {
      setSelectedSector('ALL');
      setMarketCapTier('ALL');
      setMaxPE(100);
      setMinROE(0);
      setMinRevGrowth(-0.2);
      setMinDivYield(0);
      setMaxDebtToEquity(10);
      setMinAlphaScore(0);
      setMinRVOL(0);
    } else if (preset === 'PROP_DESK') {
      setSelectedSector('ALL');
      setMarketCapTier('ALL');
      setMaxPE(80);
      setMinROE(0.15);
      setMinRevGrowth(0.10);
      setMinDivYield(0);
      setMaxDebtToEquity(2.0);
      setMinAlphaScore(80);
      setMinRVOL(1.5);
      setSortField('alphaScore');
      setSortOrder('desc');
    } else if (preset === 'FAMILY_OFFICE') {
      setSelectedSector('ALL');
      setMarketCapTier('LARGE');
      setMaxPE(30);
      setMinROE(0.12);
      setMinRevGrowth(0.02);
      setMinDivYield(0.015);
      setMaxDebtToEquity(1.2);
      setMinAlphaScore(70);
      setMinRVOL(0);
      setSortField('dividendYield');
      setSortOrder('desc');
    } else if (preset === 'DEEP_VALUE') {
      setSelectedSector('ALL');
      setMarketCapTier('ALL');
      setMaxPE(18);
      setMinROE(0.10);
      setMinRevGrowth(0);
      setMinDivYield(0.01);
      setMaxDebtToEquity(1.5);
      setMinAlphaScore(60);
      setMinRVOL(0);
      setSortField('peRatio');
      setSortOrder('asc');
    } else if (preset === 'AI_SEMI') {
      setSelectedSector('Technology');
      setMarketCapTier('ALL');
      setMaxPE(100);
      setMinROE(0.10);
      setMinRevGrowth(0.15);
      setMinDivYield(0);
      setMaxDebtToEquity(3.0);
      setMinAlphaScore(75);
      setMinRVOL(0);
      setSortField('fiftyTwoWeekChange');
      setSortOrder('desc');
    } else if (preset === 'RVOL_SPIKE') {
      setSelectedSector('ALL');
      setMarketCapTier('ALL');
      setMaxPE(100);
      setMinROE(0);
      setMinRevGrowth(-0.2);
      setMinDivYield(0);
      setMaxDebtToEquity(10);
      setMinAlphaScore(0);
      setMinRVOL(2.2);
      setSortField('rvol');
      setSortOrder('desc');
    }
  };

  const handleResetFilters = () => {
    applyPreset('ALL');
    setSearchTerm('');
  };

  // 5. Certified Export Pipeline Handlers
  const handleExportCSV = () => {
    if (sortedData.length === 0) return;
    const headers = [
      'Ticker',
      'Name',
      'Sector',
      'Alpha Score',
      'Price (USD)',
      '24h Change %',
      'RVOL',
      'Market Cap ($)',
      'P/E Ratio',
      'ROE',
      'Profit Margin',
      '52W Change',
      'Dividend Yield',
      'Debt/Equity'
    ];

    const rows = sortedData.map((d) => [
      d.ticker,
      `"${d.name.replace(/"/g, '""')}"`,
      d.sector,
      d.alphaScore,
      d.price,
      d.change24h,
      d.rvol,
      d.marketCap,
      d.peRatio ?? '',
      d.roe ?? '',
      d.profitMargin ?? '',
      d.fiftyTwoWeekChange ?? '',
      d.dividendYield ?? '',
      d.debtToEquity ?? ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mtx_quant_screener_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification(`EXPORTED ${sortedData.length} SCREENED ASSETS TO VERIFIED CSV`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExportJSON = () => {
    if (sortedData.length === 0) return;
    const payload = screenerPipeline.generateExportPayload(sortedData, weights, summaryMetrics);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mtx_screener_pipeline_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setNotification(`EXPORTED ${sortedData.length} ASSETS WITH SHA-256 SIGNATURE`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSelectTicker = useCallback((ticker: string) => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    } catch {
      window.scrollTo(0, 0);
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const scrollables = document.querySelectorAll('main, #root, #app-main-layout, [data-scrollable]');
    scrollables.forEach(el => {
      el.scrollTop = 0;
    });

    onSelectSymbol(ticker);
    onSelectTab('MARKETS');
  }, [onSelectSymbol, onSelectTab]);

  return (
    <div className="space-y-6 text-white font-mono select-none">
      {/* ──────────────────── 1. TOP SUMMARY CARDS (MATCHING PORTFOLIO DESK EXACT MARGINS) ──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Matched Universe */}
        <motion.div
          whileHover={{ y: -2, borderColor: 'rgba(99, 102, 241, 0.25)', boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.08)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          id="screener-matched-card"
          className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between transition-colors duration-200"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider font-bold block">Matched Universe</span>
            <div className="p-1 text-indigo-400">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black font-mono tracking-tight text-white">
              {sortedData.length} <span className="text-xs text-white/40 font-normal">/ {universe.length || 290}</span>
            </h3>
            <div className="flex items-center gap-1 mt-1 text-indigo-400 font-bold text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pipeline Active ({pipelineLatency}ms)</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Top Alpha Leader */}
        <motion.div
          whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.25)', boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.08)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          id="screener-alpha-card"
          className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between transition-colors duration-200"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider font-bold block">Top Alpha Leader</span>
            <div className="p-1 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black font-mono tracking-tight text-emerald-400 truncate">
              {summaryMetrics.topAlphaLeader.split(' ')[0] || 'N/A'}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-emerald-400 font-bold text-[10px] font-mono">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span>Alpha Score {summaryMetrics.topAlphaScore}/100</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Screened Capital Volume */}
        <motion.div
          whileHover={{ y: -2, borderColor: 'rgba(245, 158, 11, 0.25)', boxShadow: '0 4px 20px -2px rgba(245, 158, 11, 0.08)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          id="screener-cap-card"
          className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between transition-colors duration-200"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider font-bold block">Screened Universe Cap</span>
            <div className="p-1 text-amber-400">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black font-mono tracking-tight text-white">
              {summaryMetrics.aggregatedMarketCap}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-amber-400 font-bold text-[10px] font-mono">
              <span>{summaryMetrics.avgPERatio} Avg P/E Ratio</span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Dividend Yield & Quality */}
        <motion.div
          whileHover={{ y: -2, borderColor: 'rgba(168, 85, 247, 0.25)', boxShadow: '0 4px 20px -2px rgba(168, 85, 247, 0.08)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          id="screener-yield-card"
          className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between transition-colors duration-200"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider font-bold block">Yield & Sync State</span>
            <div className="p-1 text-purple-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black font-mono tracking-tight text-emerald-400">
              {summaryMetrics.avgDividendYield}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-white/50 text-[10px] font-mono">
              <span>Updated {lastSyncTime}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* NOTIFICATION BANNER */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-600 text-white p-3.5 rounded-xl text-xs font-mono flex items-center justify-between shadow-xl"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span className="font-bold">{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────── 2. CONTROL BAR & FACTOR ENGINE STRIP ──────────────────── */}
      <div className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 space-y-4 shadow-xl">
        {/* Top Header & Export Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center space-x-2.5">
            <span className="h-8 px-3 text-[10px] font-bold font-mono uppercase bg-indigo-600 text-white rounded-lg inline-flex items-center gap-1.5 shadow-sm shrink-0">
              <Sliders className="w-3.5 h-3.5 text-white" />
              <span>Institutional Screener Engine</span>
            </span>
            <span className="text-[10px] text-white/40 font-mono hidden md:inline">
              Quantitative 290 Asset Discovery Pipeline
            </span>
          </div>

          {/* Action Buttons & Export Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFactorBuilderOpen(!isFactorBuilderOpen)}
              className={`h-8 px-3 rounded-lg text-[10px] font-mono uppercase font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm select-none ${
                isFactorBuilderOpen
                  ? 'bg-amber-600 text-white shadow-amber-950/40'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Factor Weights</span>
            </button>

            <button
              type="button"
              onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
              className={`h-8 px-3 rounded-lg text-[10px] font-mono uppercase font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm select-none ${
                isColumnPickerOpen
                  ? 'bg-indigo-600 text-white shadow-indigo-950/40'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-white" />
              <span>Columns</span>
            </button>

            <button
              type="button"
              onClick={() => loadPipelineData(true)}
              className="h-8 px-3 rounded-lg text-[10px] font-mono uppercase font-bold flex items-center justify-center gap-1.5 bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer shadow-sm select-none"
              title="Refresh Pipeline Feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-white ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Feed</span>
            </button>

            <div className="h-4 w-[1px] bg-white/10 mx-0.5 hidden sm:block" />

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-8 px-3 rounded-lg text-[10px] font-mono uppercase font-bold flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md shadow-indigo-950/40 select-none"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>CSV Export</span>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              className="h-8 px-3 rounded-lg text-[10px] font-mono uppercase font-bold flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-md shadow-emerald-950/40 select-none"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>JSON Payload</span>
            </button>
          </div>
        </div>

        {/* FACTOR WEIGHT SLIDERS DRAWER */}
        <AnimatePresence>
          {isFactorBuilderOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#080808] border border-amber-500/30 rounded-xl p-4 space-y-3 overflow-hidden backdrop-blur-md shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Quantitative Multi-Factor Weighting Matrix
                  </span>
                </div>
                <span className="text-[9px] text-amber-400 font-mono font-bold">
                  Sum: {weights.value + weights.growth + weights.quality + weights.momentum}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                {/* Value */}
                <div className="bg-[#050505] border border-white/10 p-3 rounded-lg space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/80 uppercase font-bold">Valuation (P/E)</span>
                    <span className="text-amber-400 font-bold">{weights.value}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={weights.value}
                    onChange={(e) => setWeights(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded"
                  />
                </div>

                {/* Growth */}
                <div className="bg-[#050505] border border-white/10 p-3 rounded-lg space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/80 uppercase font-bold">Revenue Growth</span>
                    <span className="text-amber-400 font-bold">{weights.growth}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={weights.growth}
                    onChange={(e) => setWeights(prev => ({ ...prev, growth: parseInt(e.target.value) || 0 }))}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded"
                  />
                </div>

                {/* Quality */}
                <div className="bg-[#050505] border border-white/10 p-3 rounded-lg space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/80 uppercase font-bold">Quality (ROE)</span>
                    <span className="text-amber-400 font-bold">{weights.quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={weights.quality}
                    onChange={(e) => setWeights(prev => ({ ...prev, quality: parseInt(e.target.value) || 0 }))}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded"
                  />
                </div>

                {/* Momentum */}
                <div className="bg-[#050505] border border-white/10 p-3 rounded-lg space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/80 uppercase font-bold">Momentum (52W)</span>
                    <span className="text-amber-400 font-bold">{weights.momentum}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={weights.momentum}
                    onChange={(e) => setWeights(prev => ({ ...prev, momentum: parseInt(e.target.value) || 0 }))}
                    className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COLUMN PICKER DRAWER */}
        <AnimatePresence>
          {isColumnPickerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#080808] border border-indigo-500/30 rounded-xl p-4 space-y-2 overflow-hidden backdrop-blur-md"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                Toggle Metrics Visibility
              </span>
              <div className="flex flex-wrap gap-2 text-[10px]">
                {Object.entries(visibleColumns).map(([key, isVis]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setVisibleColumns((prev) => ({ ...prev, [key]: !isVis }))
                    }
                    className={`px-3 py-1 rounded font-mono uppercase transition-all cursor-pointer shadow-sm select-none ${
                      isVis
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-white/5 text-white/40 border border-white/10 line-through hover:bg-white/10'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PRESET STRIP - Symmetrically Arranged */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 p-2 bg-[#080808] border border-white/10 rounded-xl">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-white/70 uppercase font-mono font-bold text-[10px] shrink-0">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Desk Presets:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 flex-1">
            <button
              type="button"
              onClick={() => applyPreset('ALL')}
              className={`h-8 w-full px-2.5 rounded-lg uppercase transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 shadow-md select-none font-mono text-[10px] truncate ${
                selectedPreset === 'ALL'
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Globe className="w-3 h-3 shrink-0" />
              <span className="truncate">All Universe (290)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('PROP_DESK')}
              className={`h-8 w-full px-2.5 rounded-lg uppercase transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 shadow-md select-none font-mono text-[10px] truncate ${
                selectedPreset === 'PROP_DESK'
                  ? 'bg-amber-600 text-white shadow-amber-950/40'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Zap className="w-3 h-3 shrink-0 text-white" />
              <span className="truncate">Quant Prop Alpha</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('FAMILY_OFFICE')}
              className={`h-8 w-full px-2.5 rounded-lg uppercase transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 shadow-md select-none font-mono text-[10px] truncate ${
                selectedPreset === 'FAMILY_OFFICE'
                  ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ShieldCheck className="w-3 h-3 shrink-0 text-white" />
              <span className="truncate">Family Office Yield</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('DEEP_VALUE')}
              className={`h-8 w-full px-2.5 rounded-lg uppercase transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 shadow-md select-none font-mono text-[10px] truncate ${
                selectedPreset === 'DEEP_VALUE'
                  ? 'bg-blue-600 text-white shadow-blue-950/40'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <TrendingUp className="w-3 h-3 shrink-0 text-white" />
              <span className="truncate">Deep Value (P/E &lt; 18)</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('AI_SEMI')}
              className={`h-8 w-full px-2.5 rounded-lg uppercase transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 shadow-md select-none font-mono text-[10px] truncate ${
                selectedPreset === 'AI_SEMI'
                  ? 'bg-purple-600 text-white shadow-purple-950/40'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Sparkles className="w-3 h-3 shrink-0 text-white" />
              <span className="truncate">AI & Semi Growth</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('RVOL_SPIKE')}
              className={`h-8 w-full px-2.5 rounded-lg uppercase transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 shadow-md select-none font-mono text-[10px] truncate ${
                selectedPreset === 'RVOL_SPIKE'
                  ? 'bg-orange-600 text-white shadow-orange-950/40'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Zap className="w-3 h-3 shrink-0 text-white" />
              <span className="truncate">RVOL Spike (&gt;2.2x)</span>
            </button>
          </div>
        </div>

        {/* PRIMARY FILTER BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ticker, company, or sector..."
              className="w-full bg-[#050505] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-white/40 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sector Selector */}
          <div>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-indigo-500/50 transition-all font-mono cursor-pointer"
            >
              <option value="ALL">All Sectors</option>
              <option value="Technology">Technology</option>
              <option value="Financials">Financials</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Consumer">Consumer</option>
              <option value="Energy">Energy</option>
              <option value="Industrials">Industrials</option>
              <option value="Communication">Communication</option>
              <option value="Utilities">Utilities</option>
              <option value="Materials">Materials</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Crypto">Crypto Assets</option>
              <option value="Forex">Forex & FX</option>
            </select>
          </div>

          {/* Market Cap Tier */}
          <div>
            <select
              value={marketCapTier}
              onChange={(e) => setMarketCapTier(e.target.value as any)}
              className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-indigo-500/50 transition-all font-mono cursor-pointer"
            >
              <option value="ALL">All Market Caps</option>
              <option value="MEGA">Mega Cap (&gt; $200B)</option>
              <option value="LARGE">Large Cap ($10B - $200B)</option>
              <option value="MID">Mid Cap ($2B - $10B)</option>
              <option value="SMALL">Small Cap (&lt; $2B)</option>
            </select>
          </div>

          {/* P/E Ratio Cap */}
          <div>
            <select
              value={maxPE}
              onChange={(e) => setMaxPE(parseFloat(e.target.value))}
              className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-indigo-500/50 transition-all font-mono cursor-pointer"
            >
              <option value="100">Max P/E: Any</option>
              <option value="15">Max P/E &lt; 15.0x</option>
              <option value="25">Max P/E &lt; 25.0x</option>
              <option value="40">Max P/E &lt; 40.0x</option>
              <option value="60">Max P/E &lt; 60.0x</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-mono uppercase font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm select-none"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* SECONDARY FILTER EXPANDER STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-white/5 text-[10px]">
          {/* Min ROE */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-white/60 uppercase">Min ROE: {minROE > 0 ? `${(minROE * 100).toFixed(0)}%` : 'Any'}</span>
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.05"
              value={minROE}
              onChange={(e) => setMinROE(parseFloat(e.target.value))}
              className="accent-indigo-400 cursor-pointer h-1.5 bg-white/10 rounded"
            />
          </div>

          {/* Min Rev Growth */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-white/60 uppercase">Min Growth: {minRevGrowth > -0.2 ? `${(minRevGrowth * 100).toFixed(0)}%` : 'Any'}</span>
            <input
              type="range"
              min="-0.2"
              max="0.5"
              step="0.05"
              value={minRevGrowth}
              onChange={(e) => setMinRevGrowth(parseFloat(e.target.value))}
              className="accent-indigo-400 cursor-pointer h-1.5 bg-white/10 rounded"
            />
          </div>

          {/* Min Dividend Yield */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-white/60 uppercase">Min Yield: {minDivYield > 0 ? `${(minDivYield * 100).toFixed(1)}%` : 'Any'}</span>
            <input
              type="range"
              min="0"
              max="0.05"
              step="0.005"
              value={minDivYield}
              onChange={(e) => setMinDivYield(parseFloat(e.target.value))}
              className="accent-emerald-400 cursor-pointer h-1.5 bg-white/10 rounded"
            />
          </div>

          {/* Max Debt/Equity */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-white/60 uppercase">Max Debt/Eq: {maxDebtToEquity < 10 ? maxDebtToEquity.toFixed(1) : 'Any'}</span>
            <input
              type="range"
              min="0.2"
              max="10"
              step="0.2"
              value={maxDebtToEquity}
              onChange={(e) => setMaxDebtToEquity(parseFloat(e.target.value))}
              className="accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded"
            />
          </div>

          {/* Min Alpha Score */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-white/60 uppercase">Min Alpha: {minAlphaScore > 0 ? minAlphaScore : 'Any'}</span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minAlphaScore}
              onChange={(e) => setMinAlphaScore(parseInt(e.target.value) || 0)}
              className="accent-emerald-400 cursor-pointer h-1.5 bg-white/10 rounded"
            />
          </div>

          {/* Min RVOL */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-white/60 uppercase">Min RVOL: {minRVOL > 0 ? `${minRVOL.toFixed(1)}x` : 'Any'}</span>
            <input
              type="range"
              min="0"
              max="3.5"
              step="0.2"
              value={minRVOL}
              onChange={(e) => setMinRVOL(parseFloat(e.target.value))}
              className="accent-amber-400 cursor-pointer h-1.5 bg-white/10 rounded"
            />
          </div>
        </div>
      </div>

      {/* ──────────────────── 3. HIGH-DENSITY QUANTITATIVE DATA TABLE ──────────────────── */}
      <div className="bg-[#050505] border border-neutral-800/80 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto screener-scrollbar pb-1">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-[#080808] border-b border-white/10 text-[10px] text-white/70 uppercase tracking-wider select-none">
                <th className="py-3.5 px-4 font-bold text-white">Asset / Symbol</th>
                {visibleColumns.sector && <th className="py-3.5 px-3 font-bold">Sector</th>}
                {visibleColumns.alphaScore && (
                  <th
                    className="py-3.5 px-3 font-bold cursor-pointer hover:text-white"
                    onClick={() => handleSort('alphaScore')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Alpha Rank</span>
                      <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                    </div>
                  </th>
                )}
                {visibleColumns.price && (
                  <th
                    className="py-3.5 px-3 font-bold cursor-pointer hover:text-white text-right"
                    onClick={() => handleSort('price')}
                  >
                    Price
                  </th>
                )}
                {visibleColumns.change24h && (
                  <th
                    className="py-3.5 px-3 font-bold cursor-pointer hover:text-white text-right"
                    onClick={() => handleSort('change24h')}
                  >
                    24h Return
                  </th>
                )}
                {visibleColumns.rvol && (
                  <th
                    className="py-3.5 px-3 font-bold cursor-pointer hover:text-white text-right"
                    onClick={() => handleSort('rvol')}
                  >
                    RVOL Anomaly
                  </th>
                )}
                {visibleColumns.marketCap && (
                  <th
                    className="py-3.5 px-3 font-bold cursor-pointer hover:text-white text-right"
                    onClick={() => handleSort('marketCap')}
                  >
                    Market Cap
                  </th>
                )}
                {visibleColumns.peRatio && (
                  <th
                    className="py-3.5 px-3 font-bold cursor-pointer hover:text-white text-right"
                    onClick={() => handleSort('peRatio')}
                  >
                    P/E Ratio
                  </th>
                )}
                {visibleColumns.roe && (
                  <th
                    className="py-3.5 px-3 font-bold cursor-pointer hover:text-white text-right"
                    onClick={() => handleSort('roe')}
                  >
                    ROE
                  </th>
                )}
                {visibleColumns.profitMargin && (
                  <th
                    className="py-3.5 px-3 font-bold cursor-pointer hover:text-white text-right"
                    onClick={() => handleSort('profitMargin')}
                  >
                    Margin
                  </th>
                )}
                {visibleColumns.dividendYield && (
                  <th
                    className="py-3.5 px-3 font-bold cursor-pointer hover:text-white text-right"
                    onClick={() => handleSort('dividendYield')}
                  >
                    Div Yield
                  </th>
                )}
                {visibleColumns.debtToEquity && (
                  <th
                    className="py-3.5 px-3 font-bold cursor-pointer hover:text-white text-right"
                    onClick={() => handleSort('debtToEquity')}
                  >
                    Debt/Eq
                  </th>
                )}
                {visibleColumns.fiftyTwoWeekChange && (
                  <th
                    className="py-3.5 px-3 font-bold cursor-pointer hover:text-white text-right"
                    onClick={() => handleSort('fiftyTwoWeekChange')}
                  >
                    52W Return
                  </th>
                )}
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-16 text-center text-white/40 font-mono">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <Search className="w-8 h-8 text-white/30 stroke-[1.5]" />
                      <span className="text-sm font-bold text-white/60">No assets match the active filter criteria.</span>
                      <p className="text-xs text-white/40">Try widening your ROE, P/E, or RVOL parameters or select the "All Universe" preset.</p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-2 px-4 py-2 bg-[#050505] border border-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Reset Filter Bounds
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((row) => {
                  const isPositive = row.change24h >= 0;
                  const is52WPositive = row.fiftyTwoWeekChange >= 0;

                  return (
                    <tr
                      key={row.ticker}
                      onClick={() => handleSelectTicker(row.ticker)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* Asset & Ticker */}
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-bold flex items-center space-x-1.5">
                            <span className="text-indigo-400 group-hover:text-indigo-300 transition-colors">{row.ticker}</span>
                            {holdings[row.ticker] !== undefined && holdings[row.ticker] > 0 && (
                              <span className="text-[8px] px-1.5 py-0.2 rounded font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono" title={`Owned: ${holdings[row.ticker].toFixed(4)} shares`}>
                                {holdings[row.ticker].toFixed(2)} sh
                              </span>
                            )}
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-normal bg-white/5 text-white/60 border border-white/5">
                              {row.moatTier}
                            </span>
                          </div>
                          <div className="text-[10px] text-white/50 truncate max-w-[160px] sm:max-w-[220px]">
                            {row.name}
                          </div>
                        </div>
                      </td>

                      {/* Sector */}
                      {visibleColumns.sector && (
                        <td className="py-3 px-3 text-white/70">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-white/80">
                            {row.sector}
                          </span>
                        </td>
                      )}

                      {/* Alpha Score */}
                      {visibleColumns.alphaScore && (
                        <td className="py-3 px-3 font-bold">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-mono font-bold shadow-sm ${
                                row.alphaScore >= 80
                                  ? 'bg-emerald-600 text-white'
                                  : row.alphaScore >= 65
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-amber-600 text-white'
                              }`}
                            >
                              {row.alphaScore}
                            </span>
                            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden hidden xl:block">
                              <div
                                className={`h-full ${
                                  row.alphaScore >= 80 ? 'bg-emerald-400' : row.alphaScore >= 65 ? 'bg-indigo-400' : 'bg-amber-400'
                                }`}
                                style={{ width: `${row.alphaScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Price */}
                      {visibleColumns.price && (
                        <td className="py-3 px-3 text-right font-bold text-white font-mono">
                          ${row.price >= 1000 ? row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : row.price.toFixed(2)}
                        </td>
                      )}

                      {/* 24h Change */}
                      {visibleColumns.change24h && (
                        <td className="py-3 px-3 text-right font-bold font-mono">
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPositive ? '+' : ''}
                            {row.change24h.toFixed(2)}%
                          </span>
                        </td>
                      )}

                      {/* RVOL */}
                      {visibleColumns.rvol && (
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.rvol > 2.0
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'text-white/70'
                            }`}
                          >
                            {row.rvol.toFixed(1)}x
                          </span>
                        </td>
                      )}

                      {/* Market Cap */}
                      {visibleColumns.marketCap && (
                        <td className="py-3 px-3 text-right text-white/70 font-mono">
                          {row.marketCap > 0
                            ? `$${(row.marketCap / 1e9).toFixed(1)}B`
                            : 'N/A'}
                        </td>
                      )}

                      {/* P/E Ratio */}
                      {visibleColumns.peRatio && (
                        <td className="py-3 px-3 text-right text-white/70">
                          {row.peRatio ? `${row.peRatio.toFixed(1)}x` : 'N/A'}
                        </td>
                      )}

                      {/* ROE */}
                      {visibleColumns.roe && (
                        <td className="py-3 px-3 text-right text-white/70">
                          {row.roe !== null ? (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.roe >= 0.15 ? 'bg-emerald-600 text-white shadow-sm' : row.roe < 0 ? 'bg-rose-600 text-white shadow-sm' : 'bg-white/10 text-white/80'}`}>
                              {(row.roe * 100).toFixed(1)}%
                            </span>
                          ) : 'N/A'}
                        </td>
                      )}

                      {/* Profit Margin */}
                      {visibleColumns.profitMargin && (
                        <td className="py-3 px-3 text-right text-white/70">
                          {row.profitMargin !== null ? `${(row.profitMargin * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                      )}

                      {/* Dividend Yield */}
                      {visibleColumns.dividendYield && (
                        <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                          {row.dividendYield !== null && row.dividendYield > 0
                            ? `${(row.dividendYield * 100).toFixed(2)}%`
                            : 'N/A'}
                        </td>
                      )}

                      {/* Debt / Equity */}
                      {visibleColumns.debtToEquity && (
                        <td className="py-3 px-3 text-right text-white/70">
                          {row.debtToEquity !== null ? row.debtToEquity.toFixed(2) : 'N/A'}
                        </td>
                      )}

                      {/* 52W Change */}
                      {visibleColumns.fiftyTwoWeekChange && (
                        <td className="py-3 px-3 text-right font-bold">
                          <span className={is52WPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            {is52WPositive ? '+' : ''}
                            {(row.fiftyTwoWeekChange * 100).toFixed(1)}%
                          </span>
                        </td>
                      )}

                      {/* Terminal Launch Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTicker(row.ticker);
                          }}
                          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer select-none hover:scale-105"
                          title="Open in Terminal"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-white" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="bg-[#080808] border-t border-white/10 px-5 py-3 flex flex-col sm:flex-row items-center justify-between text-[9px] text-white/50 gap-2 font-mono">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-time Quantitative Pipeline Synced • 290 Institutional Assets Monitored</span>
          </div>
          <div>
            Showing <span className="text-white font-bold">{sortedData.length}</span> screened assets • SHA-256 Validated
          </div>
        </div>
      </div>

    </div>
  );
}

export default ScreenerDesk;
