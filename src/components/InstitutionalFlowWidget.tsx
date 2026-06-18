/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Candlestick, MarketMetrics, MarketSymbol } from '../types';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  HelpCircle, 
  LineChart, 
  Activity, 
  Settings, 
  ShieldAlert, 
  Info,
  Layers,
  ChevronDown,
  Compass,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';

interface InstitutionalFlowWidgetProps {
  symbol: MarketSymbol;
  candles: Candlestick[];
  metrics: MarketMetrics | null;
}

export default function InstitutionalFlowWidget({ symbol, candles, metrics }: InstitutionalFlowWidgetProps) {
  const [lookback, setLookback] = useState<number>(20);
  const [volSpikeThreshold, setVolSpikeThreshold] = useState<number>(1.8);
  const [volatilityThreshold, setVolatilityThreshold] = useState<number>(0.9);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const d3Container = useRef<SVGSVGElement | null>(null);

  // ==========================================
  // CORE CALCULATION ENGINE
  // ==========================================
  const flowStats = useMemo(() => {
    if (!candles || candles.length < 5) {
      return {
        score: 50,
        volumeSpikeRatio: 1.0,
        volatilityRatio: 1.0,
        isVolumeSpiked: false,
        isLowVolatility: false,
        highIntensity: false,
        buyVolume: 0,
        sellVolume: 0,
        netDelta: 0,
        classification: 'Neutral Equilibrium',
        avgVolumePrev: 1000,
        latestVolume: 1000,
        avgVolatilityPrev: 0.001,
        latestVolatility: 0.001,
      };
    }

    // Limit window bounds
    const N = Math.min(lookback, candles.length);
    const windowCandles = candles.slice(-N);
    const prevCandles = candles.slice(-Math.min(candles.length, N + 30), -1);

    let sumWeightedVolume = 0;
    let sumTotalVolume = 0;
    let buyVolume = 0;
    let sellVolume = 0;

    // 1. Calculate weighted order flow delta across lookup window
    windowCandles.forEach(c => {
      const body = c.close - c.open;
      const range = c.high - c.low;
      const dir = range === 0 ? 0 : body / range; // delta coefficient -1 to +1
      
      const weightedVol = dir * c.volume;
      sumWeightedVolume += weightedVol;
      sumTotalVolume += c.volume;

      if (body >= 0) {
        buyVolume += c.volume * (0.5 + Math.abs(dir) * 0.5);
        sellVolume += c.volume * (0.5 - Math.abs(dir) * 0.5);
      } else {
        sellVolume += c.volume * (0.5 + Math.abs(dir) * 0.5);
        buyVolume += c.volume * (0.5 - Math.abs(dir) * 0.5);
      }
    });

    // Normalize net order flow ratio between -1 and +1
    const netDelta = buyVolume - sellVolume;
    const netOrderFlowRatio = sumTotalVolume > 0 ? sumWeightedVolume / sumTotalVolume : 0;
    
    // Scale score from 0 (very bearish) to 100 (very bullish), default 50
    const rawScore = (netOrderFlowRatio * 50) + 50;
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    // 2. Identify volume spikes during low volatility
    // Average volume of previous lookup window (excluding the absolute latest candle)
    const latestCandle = candles[candles.length - 1];
    const avgVolumePrev = prevCandles.length > 0 
      ? prevCandles.reduce((acc, c) => acc + c.volume, 0) / prevCandles.length 
      : 1000;

    const latestVolume = latestCandle ? latestCandle.volume : 0;
    const volumeSpikeRatio = avgVolumePrev > 0 ? latestVolume / avgVolumePrev : 1.0;
    const isVolumeSpiked = volumeSpikeRatio >= volSpikeThreshold;

    // Calculate relative range / body range as volatility index
    const getRelRange = (c: Candlestick) => {
      const avgPrice = (c.high + c.low + c.close) / 3;
      return avgPrice > 0 ? (c.high - c.low) / avgPrice : 0.001;
    };

    const avgVolatilityPrev = prevCandles.length > 0
      ? prevCandles.reduce((acc, c) => acc + getRelRange(c), 0) / prevCandles.length
      : 0.001;

    const latestVolatility = latestCandle ? getRelRange(latestCandle) : 0.001;
    
    // Volatility ratio (Latest Volatility / Historical Volatility)
    const volatilityRatio = avgVolatilityPrev > 0 ? latestVolatility / avgVolatilityPrev : 1.0;
    
    // Low volatility condition: latest volatility is below low-volatility threshold
    const isLowVolatility = volatilityRatio <= volatilityThreshold;

    // High intensity threshold: Volume spike concurrently occurs with low price range expansion (Absorption/Distribution block)
    const highIntensity = isVolumeSpiked && isLowVolatility;

    // Classification string mapping
    let classification = 'Consolidation Equilibrium';
    if (score < 25) {
      classification = 'Severe Block Liquidation';
    } else if (score < 42) {
      classification = 'Passive Distribution';
    } else if (score <= 58) {
      classification = 'Structural Equilibrium';
    } else if (score <= 75) {
      classification = 'Passive Accumulation';
    } else {
      classification = 'Aggressive Block Demand';
    }

    return {
      score,
      volumeSpikeRatio,
      volatilityRatio,
      isVolumeSpiked,
      isLowVolatility,
      highIntensity,
      buyVolume,
      sellVolume,
      netDelta,
      classification,
      avgVolumePrev,
      latestVolume,
      avgVolatilityPrev,
      latestVolatility
    };
  }, [candles, lookback, volSpikeThreshold, volatilityThreshold]);

  // ==========================================
  // D3 GAUGE DRAWING EFFECT
  // ==========================================
  useEffect(() => {
    if (!d3Container.current) return;
    
    const svg = d3.select(d3Container.current);
    svg.selectAll('*').remove(); // Flush previous canvas

    const width = d3Container.current.clientWidth || 240;
    const height = 150;
    const margin = { top: 18, right: 15, bottom: 5, left: 15 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const radius = Math.min(innerWidth / 2, innerHeight) - 8;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height - 12})`);

    const arcMin = -Math.PI / 2;
    const arcMax = Math.PI / 2;

    const angleScale = d3.scaleLinear()
      .domain([0, 100])
      .range([arcMin, arcMax]);

    // Draw solid arcs color scales representing block thresholds
    const numSteps = 45;
    const deltaAngle = (arcMax - arcMin) / numSteps;

    // High fidelity color interpolator for cyber slate looks
    const colorScale = d3.scaleLinear<string>()
      .domain([0, 35, 50, 65, 100])
      .range(['#f43f5e', '#fb7185', '#3b82f6', '#34d399', '#10b981']);

    const arcGenerator = d3.arc<any>()
      .innerRadius(radius - 12)
      .outerRadius(radius)
      .cornerRadius(1.5);

    for (let i = 0; i < numSteps; i++) {
      const startAngle = arcMin + i * deltaAngle;
      const endAngle = startAngle + deltaAngle + 0.005;
      const scoreVal = (i / numSteps) * 100;
      const chunkColor = colorScale(scoreVal);

      g.append('path')
        .attr('d', arcGenerator({
          startAngle,
          endAngle,
        } as any))
        .attr('fill', chunkColor)
        .attr('opacity', 0.8)
        .attr('class', 'transition-all duration-300');
    }

    // Embed minor circular ticks on internal radius ring
    const ticks = [0, 25, 50, 75, 100];
    const tickArcRef = radius - 18;

    ticks.forEach(t => {
      const angle = angleScale(t);
      const x = Math.cos(angle - Math.PI / 2) * tickArcRef;
      const y = Math.sin(angle - Math.PI / 2) * tickArcRef;

      // Draw dots
      g.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 1.8)
        .attr('fill', t === 50 ? '#6366f1' : '#ffffff30');

      // Ticks text label
      g.append('text')
        .attr('x', x * 1.25)
        .attr('y', y * 1.25)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '8px')
        .attr('fill', '#ffffff30')
        .attr('font-weight', 'bold')
        .attr('font-family', 'var(--font-mono)')
        .text(t === 50 ? 'MID' : t);
    });

    // Outer framing arc ring
    const borderArc = d3.arc<any>()
      .innerRadius(radius + 2)
      .outerRadius(radius + 3)
      .startAngle(arcMin)
      .endAngle(arcMax);

    g.append('path')
      .attr('d', borderArc as any)
      .attr('fill', '#ffffff10');

    // Pointer needle parameters
    const needleAngle = angleScale(flowStats.score);
    const needleLen = radius - 6;

    const needlePath = d3.line()([
      [0, -3.5],
      [-3.5, 0],
      [0, -needleLen],
      [3.5, 0],
      [0, -3.5]
    ]);

    const pointerGroup = g.append('g')
      .attr('transform', `rotate(${(needleAngle * 180) / Math.PI})`);

    // Draw shadow or glow path underneath needle
    pointerGroup.append('path')
      .attr('d', needlePath as string)
      .attr('fill', '#312e81')
      .attr('opacity', 0.3)
      .attr('transform', 'translate(1, 1)');

    // Real needle
    pointerGroup.append('path')
      .attr('d', needlePath as string)
      .attr('fill', '#6366f1')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.6)
      .attr('opacity', 0.95);

    // Core Cap circular button
    const cap = g.append('g');

    cap.append('circle')
      .attr('r', 5.5)
      .attr('fill', '#020204')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 1.8);

    cap.append('circle')
      .attr('r', 2)
      .attr('fill', '#ffffff');

  }, [flowStats.score]);

  const copyStatsToClipboard = () => {
    const text = `MTX REAL-TIME INSTITUTIONAL FLOW REPORT\n` + 
                 `Asset Symbol: ${symbol}\n` + 
                 `Interest Score: ${flowStats.score}/100 [${flowStats.classification}]\n` +
                 `Net Volume Delta: ${flowStats.netDelta.toFixed(1)} lots\n` +
                 `Vol Spike Ratio: ${flowStats.volumeSpikeRatio.toFixed(2)}x\n` +
                 `Volatility Index: ${flowStats.volatilityRatio.toFixed(2)}x\n` +
                 `Absorption Event flags: ${flowStats.highIntensity ? 'ACTIVATED' : 'STABLE'}\n` +
                 `UTC Timestamp: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-[#070709] border border-white/5 rounded-lg p-5 shadow-xl space-y-5">
      
      {/* Title block with mini radar */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-400">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-black text-white tracking-widest flex items-center gap-1.5">
              INSTITUTIONAL FLOW RADAR
              <span className="text-[7.5px] bg-emerald-500/20 text-emerald-400 font-mono font-bold px-1 rounded uppercase tracking-wider animate-pulse">Live Tracking</span>
            </span>
            <p className="text-[9px] text-white/35 font-sans mt-0.5">Weighted order volume delta mapping against current price parameters</p>
          </div>
        </div>

        {/* Action icons bar */}
        <div className="flex items-center gap-1.5 font-mono">
          <button
            onClick={() => setShowExplanation(prev => !prev)}
            className={`p-1.5 rounded text-white/45 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer`}
            title="Show structural math methodology"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={copyStatsToClipboard}
            className="p-1.5 px-2 bg-white/5 hover:bg-white/15 border border-white/10 rounded font-mono text-[9.5px] text-white/75 hover:text-white cursor-pointer transition-colors"
          >
            {isCopied ? 'COPIED!' : 'REPORT'}
          </button>
        </div>
      </div>

      {/* Main Dual Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column (D3 Gauge) - Span 5 */}
        <div className="lg:col-span-5 bg-black/40 border border-white/5 rounded-lg p-4.5 flex flex-col items-center justify-center space-y-2 relative overflow-hidden min-h-[220px]">
          
          <div className="absolute top-2.5 right-3 text-right">
            <span className="text-[8px] text-white/20 uppercase font-mono tracking-tight block">Score Metric</span>
            <span className={`text-[12px] font-mono font-black ${
              flowStats.score > 60 ? 'text-emerald-400' : flowStats.score < 40 ? 'text-rose-400' : 'text-blue-400'
            }`}>
              {flowStats.score} / 100
            </span>
          </div>

          {/* D3 Canvas mount SVG */}
          <div className="w-full flex justify-center">
            <svg 
              ref={d3Container} 
              className="w-full max-w-[245px] h-[150px] overflow-visible"
            />
          </div>

          <div className="text-center space-y-1 z-10">
            <span className="text-[8.5px] uppercase font-mono text-white/30 tracking-widest block font-extrabold">Calculated Directional Bias</span>
            <span className={`text-[11px] font-mono font-black uppercase tracking-wider block px-2 py-0.5 rounded ${
              flowStats.score > 60 
                ? 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-400' 
                : flowStats.score < 40 
                  ? 'bg-rose-500/10 border border-rose-400/20 text-rose-400' 
                  : 'bg-blue-500/10 border border-blue-400/20 text-blue-400'
            }`}>
              {flowStats.classification}
            </span>
          </div>
        </div>

        {/* Right Column (Flow indicators stats & flags) - Span 7 */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3.5">
          
          {/* Main indicators numerical grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Bid-Ask Volume Delta */}
            <div className="bg-[#020204]/70 border border-white/5 rounded-lg p-3 space-y-1.5 font-mono">
              <span className="text-white/25 text-[8.5px] uppercase font-black tracking-normal block">Volume Delta balance</span>
              <div className="flex items-baseline justify-between">
                <span className={`text-[13px] font-black ${flowStats.netDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {flowStats.netDelta >= 0 ? '+' : ''}{flowStats.netDelta.toFixed(1)} <span className="text-[9.5px] font-medium text-white/40">LOTS</span>
                </span>
                <span className="text-[8.5px] text-white/45">Window total</span>
              </div>
              
              {/* Visual mini side-by-side volume bar */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300" 
                  style={{ width: `${flowStats.buyVolume + flowStats.sellVolume > 0 ? (flowStats.buyVolume / (flowStats.buyVolume + flowStats.sellVolume)) * 100 : 50}%` }}
                />
                <div 
                  className="h-full bg-rose-500 transition-all duration-300" 
                  style={{ width: `${flowStats.buyVolume + flowStats.sellVolume > 0 ? (flowStats.sellVolume / (flowStats.buyVolume + flowStats.sellVolume)) * 100 : 50}%` }}
                />
              </div>
              <div className="flex justify-between text-[7.5px] text-white/30 pt-0.5 leading-none">
                <span>BUY: {(flowStats.buyVolume / (flowStats.buyVolume + flowStats.sellVolume || 1) * 100).toFixed(0)}%</span>
                <span>SELL: {(flowStats.sellVolume / (flowStats.buyVolume + flowStats.sellVolume || 1) * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Lookback Config Parameters */}
            <div className="bg-[#020204]/70 border border-white/5 rounded-lg p-3 space-y-1 font-mono">
              <div className="flex items-center justify-between text-white/25 text-[8.5px] uppercase font-black">
                <span>Lookback Settings</span>
                <Settings className="w-3 h-3 text-indigo-400/50" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[9px] text-white/50">
                <div>
                  <label className="block text-[8px] text-white/35 font-sans mb-0.5">Sample Window</label>
                  <select 
                    value={lookback} 
                    onChange={(e) => setLookback(Number(e.target.value))}
                    className="w-full bg-black border border-white/10 hover:border-white/20 rounded px-1.5 py-0.8 text-white text-[9.5px] cursor-pointer outline-none"
                  >
                    <option value={10}>10 Bars</option>
                    <option value={20}>20 Bars</option>
                    <option value={50}>50 Bars</option>
                    <option value={100}>100 Bars</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] text-white/35 font-sans mb-0.5">Spike Multi.</label>
                  <select 
                    value={volSpikeThreshold} 
                    onChange={(e) => setVolSpikeThreshold(Number(e.target.value))}
                    className="w-full bg-black border border-white/10 hover:border-white/20 rounded px-1.5 py-0.8 text-white text-[9.5px] cursor-pointer outline-none"
                  >
                    <option value={1.5}>1.5x Vol</option>
                    <option value={1.8}>1.8x Vol</option>
                    <option value={2.2}>2.2x Vol</option>
                    <option value={3.0}>3.0x Vol</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Volume Spike & Volatility Ratio Diagnostics Panel */}
          <div className="bg-black/30 border border-white/5 p-3 rounded-lg grid grid-cols-2 gap-4 font-mono text-[9.5px]">
            <div className="space-y-0.5">
              <span className="text-white/35 block text-[8px] uppercase font-bold">Relative tick Volume</span>
              <div className="flex items-center space-x-1.5">
                <span className={`font-black text-[11px] ${flowStats.isVolumeSpiked ? 'text-amber-400' : 'text-white/60'}`}>
                  {flowStats.volumeSpikeRatio.toFixed(2)}x
                </span>
                <span className={`text-[7.5px] font-bold px-1 uppercase rounded leading-none ${
                  flowStats.isVolumeSpiked ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400' : 'bg-white/5 text-white/30'
                }`}>
                  {flowStats.isVolumeSpiked ? 'SPIKED' : 'NORMAL'}
                </span>
              </div>
              <span className="text-[7.5px] text-white/25 block leading-tight">Latest: {flowStats.latestVolume.toFixed(0)} lots (Avg: {flowStats.avgVolumePrev.toFixed(0)})</span>
            </div>

            <div className="space-y-0.5 border-l border-white/5 pl-4">
              <span className="text-white/35 block text-[8px] uppercase font-bold">relative session volatility</span>
              <div className="flex items-center space-x-1.5">
                <span className={`font-black text-[11px] ${flowStats.isLowVolatility ? 'text-indigo-400' : 'text-white/60'}`}>
                  {flowStats.volatilityRatio.toFixed(2)}x
                </span>
                <span className={`text-[7.5px] font-bold px-1 uppercase rounded leading-none ${
                  flowStats.isLowVolatility ? 'bg-indigo-500/15 border border-indigo-400/25 text-indigo-400 animate-pulse' : 'bg-white/5 text-white/35'
                }`}>
                  {flowStats.isLowVolatility ? 'LOW VOL' : 'STANDARD'}
                </span>
              </div>
              <span className="text-[7.5px] text-white/25 block leading-tight">Threshold factor set at {volatilityThreshold}x historical range</span>
            </div>
          </div>

          {/* Real-time High Intensity flag block with warning layout */}
          <div className="pt-1">
            <AnimatePresence mode="wait">
              {flowStats.highIntensity ? (
                <motion.div
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.98, opacity: 0 }}
                  className="bg-rose-950/25 border-l-2 border-rose-500 rounded p-3 text-rose-300 font-mono text-[9px] flex items-start space-x-3 gap-1 relative overflow-hidden"
                >
                  <div className="absolute right-2 top-2 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                  <div className="space-y-1">
                    <strong className="text-[10px] uppercase font-black tracking-wider text-rose-400 block">
                      ⚡ HIGH-INTENSITY VOLUMETRIC ABSORPTION EVENT DETECTED ⚡
                    </strong>
                    <p className="text-rose-200/70 leading-normal">
                      The latest block volume of <strong className="text-white font-extrabold">{flowStats.latestVolume.toFixed(0)} lots</strong> has crossed your <strong className="text-white font-extrabold">{volSpikeThreshold}x</strong> spike threshold inside a tightly consolidated, low-volatility price range. This is the hallmark signature of institutional absorption of liquidity (passive limit block fills).
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-[#0b0c10]/40 border border-white/5 p-3 rounded text-white/45 font-mono text-[9px] flex items-center space-x-2.5">
                  <ShieldAlert className="w-4 h-4 text-white/20" />
                  <span>Absorption Engine is actively monitoring symbol volume spikes inside low-volatility segments. System currently healthy.</span>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Collapsible educational / mathematical explanation section */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#020204] border border-white/10 rounded-lg p-4 font-mono text-[9px] leading-relaxed text-white/55 space-y-2.5 overflow-hidden"
          >
            <div className="flex items-center space-x-1.5 text-indigo-300 font-bold border-b border-white/5 pb-1.5 pb-2">
              <Info className="w-3.5 h-3.5" />
              <span className="uppercase text-[9.5px]">Volumetric Integration Methodology</span>
            </div>
            
            <p>
              The <strong>Institutional Interest Score (0 to 100)</strong> acts as a real-time proxy for dominant capital direction. The indicator operates as a weighted ratio calculation:
            </p>
            
            <div className="bg-black/50 p-2.5 rounded text-white border border-white/5 space-y-1 text-center italic text-[9.2px] select-all my-1.5 font-bold">
              Institutional Delta Coefficient (dir) = (Close - Open) / (High - Low)
              <br />
              Weighted Volumetric Sum = Σ [ dir * Candle Volume ] across lookback window
              <br />
              Normalizer Gauge Score = (Weighted Volumetric Sum / Total Summed Vol * 50) + 50
            </div>

            <p>
              <strong>Liquidity Absorption Diagnostics:</strong> True institutional volume is often masked through passive limit blocks so as not to trigger adverse price spikes. By mapping <strong>Volume Spikes</strong> concurrently occurring during <strong>Low Volatility (tight bodies)</strong>, the algorithm catches large orders filling quietly inside a price consolidation field prior to a structural expansion.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
