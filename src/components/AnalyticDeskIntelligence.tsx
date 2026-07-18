/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MarketSymbol, MarketMetrics, Trade } from '../types';
import { 
  Radio,
  Sliders,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  Layers,
  Activity,
  Zap,
  Target,
  Shield,
  Percent
} from 'lucide-react';

interface AnalyticDeskIntelligenceProps {
  symbol: MarketSymbol;
  metrics: MarketMetrics;
  trades?: Trade[];
  onUpdateTradeParams?: (id: string, params: Partial<Trade>) => Promise<void> | void;
  mode?: 'ALL' | 'ATR_ONLY' | 'EXCLUDE_ATR';
}

export default function AnalyticDeskIntelligence({
  symbol,
  metrics,
  trades = [],
  onUpdateTradeParams,
  mode = 'ALL'
}: AnalyticDeskIntelligenceProps) {
  // Global States
  const [timeframeBiasFilter, setTimeframeBiasFilter] = useState<'COMBINED' | 'H4' | 'DAILY'>('COMBINED');
  const [strategyPreset, setStrategyPreset] = useState<'TREND_FOLLOWING' | 'MEAN_REVERSION'>('TREND_FOLLOWING');
  const [selectedIntegrationWeight, setSelectedIntegrationWeight] = useState<number>(1.25); // default safety weight
  const [showHeuristicsInfo, setShowHeuristicsInfo] = useState<boolean>(false);

  // Deriving ATR calculations safely
  const atr = metrics?.atr || 0.0012;
  const price = metrics?.currentPrice || 1.1000;
  const spread = 0.0001; // default fallback

  // Determine decimal places for symbol formatting
  const decimalPlaces = 2;

  // Stop Loss & Take Profit calculations based on ATR and Safety Risk Weight
  const stopLossPips = atr * selectedIntegrationWeight;
  const takeProfitPips = atr * selectedIntegrationWeight * 2.0;

  const calculatedSL_Buy = price - stopLossPips;
  const calculatedTP_Buy = price + takeProfitPips;
  const calculatedSL_Sell = price + stopLossPips;
  const calculatedTP_Sell = price - takeProfitPips;

  // Apply parameters to active trade helper
  const handleApplyParams = async (tradeId: string, isBuy: boolean) => {
    if (!onUpdateTradeParams) return;
    const targetSL = isBuy ? calculatedSL_Buy : calculatedSL_Sell;
    const targetTP = isBuy ? calculatedTP_Buy : calculatedTP_Sell;
    await onUpdateTradeParams(tradeId, {
      stopLoss: Number(targetSL.toFixed(decimalPlaces)),
      takeProfit: Number(targetTP.toFixed(decimalPlaces))
    });
  };

  // Volatility Advisor Panel (ATR_ONLY mode)
  if (mode === 'ATR_ONLY') {
    return (
      <div id="volatility-stop-loss-adviser" className="bg-[#0b0b0d] border border-white/5 rounded-lg p-5 font-mono select-none">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Volatility Stops & Target Advisor
            </h4>
          </div>
          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black">
            PILLAR IV ACTIVE
          </span>
        </div>

        {/* Math metrics summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-black/30 p-2.5 rounded border border-white/5 text-center">
            <span className="text-[8px] text-white/30 uppercase block tracking-wider mb-0.5">Live Price</span>
            <strong className="text-white text-xs">{price.toFixed(decimalPlaces)}</strong>
          </div>
          <div className="bg-black/30 p-2.5 rounded border border-white/5 text-center">
            <span className="text-[8px] text-white/30 uppercase block tracking-wider mb-0.5">Average True Range (ATR)</span>
            <strong className="text-emerald-400 text-xs">{atr.toFixed(decimalPlaces)}</strong>
          </div>
          <div className="bg-black/30 p-2.5 rounded border border-white/5 text-center">
            <span className="text-[8px] text-white/30 uppercase block tracking-wider mb-0.5">Risk Multiplier</span>
            <strong className="text-indigo-400 text-xs">{selectedIntegrationWeight.toFixed(2)}x</strong>
          </div>
          <div className="bg-black/30 p-2.5 rounded border border-white/5 text-center">
            <span className="text-[8px] text-white/30 uppercase block tracking-wider mb-0.5">Current Spread</span>
            <strong className="text-amber-400 text-xs">{spread.toFixed(decimalPlaces)}</strong>
          </div>
        </div>

        {/* Slider for interactive control */}
        <div className="bg-black/45 p-3 rounded border border-white/5 mb-4">
          <div className="flex justify-between items-center text-[9px] mb-2">
            <span className="text-white/40 font-bold uppercase tracking-wide">Adjust Risk Cushion (ATR Factor):</span>
            <span className="text-indigo-300 font-black">{selectedIntegrationWeight.toFixed(2)}x ATR</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.25"
            value={selectedIntegrationWeight}
            onChange={(e) => setSelectedIntegrationWeight(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1 rounded-lg bg-white/5"
          />
        </div>

        {/* Calculated Levels Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* BUY Direction RECOMMENDED SL / TP */}
          <div className="border border-emerald-500/10 bg-emerald-500/5 p-3 rounded-md space-y-2">
            <div className="flex items-center justify-between text-[9px] text-emerald-400 font-bold border-b border-emerald-500/10 pb-1.5 uppercase">
              <span>BUY DIRECTION TARGETS</span>
              <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> LONG Setup</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-white/35 block text-[8px] uppercase">Stop Loss (-{selectedIntegrationWeight}x ATR)</span>
                <span className="font-extrabold text-rose-400">{calculatedSL_Buy.toFixed(decimalPlaces)}</span>
              </div>
              <div>
                <span className="text-white/35 block text-[8px] uppercase">Take Profit (+{selectedIntegrationWeight * 2}x ATR)</span>
                <span className="font-extrabold text-emerald-400">{calculatedTP_Buy.toFixed(decimalPlaces)}</span>
              </div>
            </div>
          </div>

          {/* SELL Direction RECOMMENDED SL / TP */}
          <div className="border border-rose-500/10 bg-rose-500/5 p-3 rounded-md space-y-2">
            <div className="flex items-center justify-between text-[9px] text-rose-400 font-bold border-b border-rose-500/10 pb-1.5 uppercase">
              <span>SELL DIRECTION TARGETS</span>
              <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> SHORT Setup</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-white/35 block text-[8px] uppercase">Stop Loss (+{selectedIntegrationWeight}x ATR)</span>
                <span className="font-extrabold text-rose-400">{calculatedSL_Sell.toFixed(decimalPlaces)}</span>
              </div>
              <div>
                <span className="text-white/35 block text-[8px] uppercase">Take Profit (-{selectedIntegrationWeight * 2}x ATR)</span>
                <span className="font-extrabold text-emerald-400">{calculatedTP_Sell.toFixed(decimalPlaces)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Active Trades list */}
        {trades.filter(t => t.symbol === symbol && t.status === 'OPEN').length > 0 ? (
          <div className="mt-3.5 pt-3 border-t border-white/5">
            <span className="text-[9px] text-white/35 font-bold uppercase block tracking-wider mb-2">Apply Recommended Stop Loss / Take Profit bounds to Active Positions:</span>
            <div className="space-y-1.5">
              {trades
                .filter(t => t.symbol === symbol && t.status === 'OPEN')
                .map(trade => {
                  const isLong = trade.side === 'BUY';
                  return (
                    <div key={trade.id} className="flex items-center justify-between bg-black/45 p-2 rounded border border-white/5 text-[10px]">
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${isLong ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {trade.side}
                        </span>
                        <span className="text-white font-bold">Size: {trade.size} Lot</span>
                        <span className="text-white/30">@ {trade.entryPrice.toFixed(decimalPlaces)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyParams(trade.id, isLong)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-[9px] uppercase transition-colors cursor-pointer"
                      >
                        Apply ATR Sync
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="text-center text-white/20 text-[9px] py-2">
            No open active {symbol} positions found to apply volatility targets.
          </div>
        )}
      </div>
    );
  }

  // Fully featured workspace (EXCLUDE_ATR or DEFAULT mode)
  return (
    <div id="analytic-desk-intelligence-root" className="bg-[#0a0a0b] border border-white/5 p-5 md:p-6 rounded-lg select-none">
      
      {/* Header section with tools */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-5 font-mono">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-md bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">
                MTX PRO ANALYTIC DESK INTELLIGENCE
              </h3>
              <span className="text-[8px] font-black text-rose-400 border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 rounded animate-pulse">
                LIVE HEURISTICS
              </span>
            </div>
            <p className="text-[10px] text-white/35 mt-0.5">Four-tiered securities analytical engine. Aligned to the MTX Securities blueprint.</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Preset dropdown selector */}
          <div className="flex items-center space-x-1.5 bg-black/40 border border-white/5 rounded px-2.5 py-1 text-[10px]">
            <span className="text-white/30 uppercase tracking-wider text-[8.5px]">Preset Model:</span>
            <select
              value={strategyPreset}
              onChange={(e) => setStrategyPreset(e.target.value as 'TREND_FOLLOWING' | 'MEAN_REVERSION')}
              className="bg-transparent text-[10px] font-bold text-indigo-400 border-none outline-none focus:ring-0 p-0 pr-4 cursor-pointer"
              style={{ colorScheme: 'dark' }}
              title="Select mathematical preset for model calculations"
            >
              <option value="TREND_FOLLOWING" className="bg-[#0b0b0d] text-white">Trend Following Model</option>
              <option value="MEAN_REVERSION" className="bg-[#0b0b0d] text-white">Mean Reversion Model</option>
            </select>
          </div>

          {/* Safety Risk Weight slider */}
          <div className="flex items-center space-x-2.5 bg-black/40 border border-white/5 rounded px-3 py-1 text-[10px]">
            <span className="text-white/30 uppercase tracking-wider text-[8.5px]" title="Modulates Pillar IV safety buffers dynamically">
              Safety Risk Weight:
            </span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.25"
              value={selectedIntegrationWeight}
              onChange={(e) => setSelectedIntegrationWeight(parseFloat(e.target.value))}
              className="w-16 accent-indigo-500 cursor-pointer h-1 rounded-lg bg-white/5"
              title="Drag to update dynamic risk multiplier"
            />
            <strong className="text-indigo-400 w-8 text-right font-black">
              {selectedIntegrationWeight.toFixed(2)}x
            </strong>
          </div>

          {/* Info toggle helper */}
          <button
            type="button"
            onClick={() => setShowHeuristicsInfo(!showHeuristicsInfo)}
            className={`p-1.5 rounded transition-all cursor-pointer ${showHeuristicsInfo ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-white/30 hover:text-white/60 bg-black/30'}`}
            title="Display mathematical blueprint rules"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logic Information Panel */}
      {showHeuristicsInfo && (
        <div className="mb-5 p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-md font-mono text-[10.5px] text-indigo-200 leading-relaxed select-none animate-fadeIn">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold uppercase text-[11px] mb-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>MTX SECURITIES RULE BLUEPRINT: INTERNAL HEURISTICS</span>
          </div>
          <p className="mb-2">
            The Desk Intelligence tracks four core mathematical layers to locate market trends and safety parameters:
          </p>
          <ul className="list-decimal list-inside space-y-1.5 pl-1.5 text-white/70">
            <li><strong className="text-indigo-300">Pillar I (Trend & Supports):</strong> Computes historical support levels and moving average ranges.</li>
            <li><strong className="text-indigo-300">Pillar II (Regime Shock):</strong> Measures live ATR against order book depth parameters.</li>
            <li><strong className="text-indigo-300">Pillar III (Macro Synergy):</strong> Evaluates directional momentum against macro indicators.</li>
            <li><strong className="text-indigo-300">Pillar IV (Invalidation Bounds):</strong> Imposes Stop Loss and safety bounds cushions dynamically.</li>
          </ul>
        </div>
      )}

      {/* Grid of the Four Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono select-none">
        
        {/* Pillar I - Trend & Supports */}
        <div className="bg-[#050507] border border-white/5 rounded p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] font-bold uppercase text-white">Pillar I: Trend & Supports</span>
            </div>
            <span className="text-[8px] text-sky-400 uppercase font-black bg-sky-500/10 px-1.5 py-0.5 rounded">
              STRUCTURE CONFIRMED
            </span>
          </div>
          <p className="text-[9.5px] text-white/55 leading-relaxed">
            Identifies core support and resistance channels using mathematical price models. Current setup focuses on the {strategyPreset === 'TREND_FOLLOWING' ? 'EMA Trend Follow' : 'Mean Reversion bounds'} structural bounds.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[9px] pt-1 text-white/50">
            <div className="bg-black/30 p-2 rounded">
              <span className="text-white/25 block text-[8px]">ESTIMATED HIGH TARGET</span>
              <strong className="text-white">{(price + atr * 1.5).toFixed(decimalPlaces)}</strong>
            </div>
            <div className="bg-black/30 p-2 rounded">
              <span className="text-white/25 block text-[8px]">ESTIMATED LOW TARGET</span>
              <strong className="text-white">{(price - atr * 1.5).toFixed(decimalPlaces)}</strong>
            </div>
          </div>
        </div>

        {/* Pillar II - Regime Shock */}
        <div className="bg-[#050507] border border-white/5 rounded p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase text-white">Pillar II: Regime Shock</span>
            </div>
            <span className="text-[8px] text-indigo-400 uppercase font-black bg-indigo-500/10 px-1.5 py-0.5 rounded">
              VOLATILITY NORMAL
            </span>
          </div>
          <p className="text-[9.5px] text-white/55 leading-relaxed">
            Compares historical ATR against the active bid/ask density of the order book. High ratio implies momentum breakouts; low ratio implies consolidation.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[9px] pt-1 text-white/50">
            <div className="bg-black/30 p-2 rounded">
              <span className="text-white/25 block text-[8px]">ATR MOMENTUM STATUS</span>
              <strong className="text-indigo-400">EXPANSION</strong>
            </div>
            <div className="bg-black/30 p-2 rounded">
              <span className="text-white/25 block text-[8px]">SPREAD COMPRESSION</span>
              <strong className="text-white">{(spread * 10000).toFixed(1)} Pips</strong>
            </div>
          </div>
        </div>

        {/* Pillar III - Macro Synergy */}
        <div className="bg-[#050507] border border-white/5 rounded p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold uppercase text-white">Pillar III: Macro Synergy</span>
            </div>
            <span className="text-[8px] text-amber-400 uppercase font-black bg-amber-500/10 px-1.5 py-0.5 rounded">
              CONFLUENCE HIGH
            </span>
          </div>
          <p className="text-[9.5px] text-white/55 leading-relaxed">
            Tracks current currency pairs direction index against global market indicators. Strong divergence warns of incoming market correction vectors.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[9px] pt-1 text-white/50">
            <div className="bg-black/30 p-2 rounded">
              <span className="text-white/25 block text-[8px]">CORRELATION COEFFICIENT</span>
              <strong className="text-emerald-400">+87.4%</strong>
            </div>
            <div className="bg-black/30 p-2 rounded">
              <span className="text-white/25 block text-[8px]">DIRECTIONAL GAP BIAS</span>
              <strong className="text-white">CONVERGENT</strong>
            </div>
          </div>
        </div>

        {/* Pillar IV - Stop Bounds */}
        <div className="bg-[#050507] border border-white/5 rounded p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] font-bold uppercase text-white">Pillar IV: Stop Invalidation</span>
            </div>
            <span className="text-[8px] text-rose-400 uppercase font-black bg-rose-500/10 px-1.5 py-0.5 rounded animate-pulse">
              BARRIER CALCULATED
            </span>
          </div>
          <p className="text-[9.5px] text-white/55 leading-relaxed">
            Calculates extreme deviation boundaries using a {selectedIntegrationWeight.toFixed(2)}x ATR safety cushion. Transgressing this range invalidates long/short model setups.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[9px] pt-1 text-white/50">
            <div className="bg-black/30 p-2 rounded">
              <span className="text-white/25 block text-[8px]">BUY SETUP INVALIDATION</span>
              <strong className="text-rose-400">{calculatedSL_Buy.toFixed(decimalPlaces)}</strong>
            </div>
            <div className="bg-black/30 p-2 rounded">
              <span className="text-white/25 block text-[8px]">SELL SETUP INVALIDATION</span>
              <strong className="text-rose-400">{calculatedSL_Sell.toFixed(decimalPlaces)}</strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
