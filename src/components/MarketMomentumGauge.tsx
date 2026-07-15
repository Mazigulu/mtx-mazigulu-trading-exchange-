import React, { useMemo } from 'react';
import { MarketSymbol, Candlestick, MarketMetrics } from '../types';
import { Gauge, Zap, TrendingUp, HelpCircle, Activity, Compass, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface MarketMomentumGaugeProps {
  symbol: MarketSymbol;
  candles: Candlestick[];
  metrics: MarketMetrics | null;
}

export default function MarketMomentumGauge({ symbol, candles, metrics }: MarketMomentumGaugeProps) {
  // Compute momentum metrics
  const { score, status, description, colorClass, strokeColor, rsiVal, volRatio, trendStrength } = useMemo(() => {
    if (!candles || candles.length < 15) {
      return {
        score: 50,
        status: 'STABLE CONSOLIDATION',
        description: 'Standard trading flow. Awaiting deeper liquidity triggers.',
        colorClass: 'text-indigo-400',
        strokeColor: '#6366f1',
        rsiVal: 50,
        volRatio: 1.0,
        trendStrength: 50
      };
    }

    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];

    // 1. RSI Divergence (Distance from neutral 50)
    // We prefer metrics.rsi, otherwise compute a quick SMA of closes to estimate
    let rsiVal = metrics?.rsi;
    if (rsiVal === undefined || rsiVal === null || isNaN(rsiVal)) {
      // Fallback RSI approximation from recent candle win-rate
      const slice = candles.slice(-14);
      let upDays = 0;
      let downDays = 0;
      for (let i = 1; i < slice.length; i++) {
        const diff = slice[i].close - slice[i-1].close;
        if (diff > 0) upDays += diff;
        else downDays += Math.abs(diff);
      }
      const rs = downDays === 0 ? 100 : upDays / downDays;
      rsiVal = downDays === 0 ? 100 : 100 - (100 / (1 + rs));
    }

    // Clamp RSI
    rsiVal = Math.min(100, Math.max(0, rsiVal));
    const rsiDivergence = Math.abs(rsiVal - 50) * 2.0; // scale to 0-100

    // 2. Volatility Ratio (Standard SMC compression vs expansion ratio)
    // Compare the average candle range of the last 3 candles against the last 15 candles
    const shortTermRange = candles.slice(-3).reduce((acc, c) => acc + (c.high - c.low), 0) / 3;
    const longTermRange = candles.slice(-15).reduce((acc, c) => acc + (c.high - c.low), 0) / 15;
    const volRatio = longTermRange > 0 ? (shortTermRange / longTermRange) : 1.0;

    // Map Vol Ratio (0.4 to 2.2) onto standard 0-100 scale
    // Normal vol is around 1.0. 1.0 -> 50 score. 0.4 -> 10 score. 2.0 -> 90 score.
    const volScore = Math.min(100, Math.max(0, ((volRatio - 0.4) / 1.6) * 80 + 10));

    // 3. Trend Intensity & Directional Persistence (SMC imbalance)
    // Check close price progression / winrate over the last 15 bars
    const recentCloses = candles.slice(-15);
    let upwardCount = 0;
    for (let i = 1; i < recentCloses.length; i++) {
      if (recentCloses[i].close > recentCloses[i-1].close) upwardCount++;
    }
    const winRate = upwardCount / (recentCloses.length - 1); // 0 to 1
    const trendStrength = Math.min(100, Math.max(0, Math.abs(winRate - 0.5) * 200)); // 0 to 100

    // 4. Tick micro-movement addition for organic movement
    const lastPriceChange = lastCandle && prevCandle ? (lastCandle.close - prevCandle.close) / prevCandle.close : 0;
    const microAdjustment = Math.min(4, Math.max(-4, lastPriceChange * 2000));

    // Combine factors with appropriate weights:
    // 45% Volatility (ATR, High-Low range shifts)
    // 30% RSI Overbought/Oversold pressure
    // 25% Trend direction consistency
    const rawScore = (volScore * 0.45) + (rsiDivergence * 0.3) + (trendStrength * 0.25) + microAdjustment;
    const score = Math.min(100, Math.max(0, Math.round(rawScore)));

    // Categorize
    let status = 'STABLE CONSOLIDATION';
    let description = 'Healthy trading liquidity. Price is ranging within standard value bands with low risk of breakouts.';
    let colorClass = 'text-[#10b981]'; // Emerald/Teal
    let strokeColor = '#10b981';

    if (score <= 25) {
      status = 'EXTREME COMPRESSION';
      description = 'Ranging in a tight squeeze block. Volatility is suppressed, signaling a high-conviction breakout is building.';
      colorClass = 'text-sky-500';
      strokeColor = '#0ea5e9';
    } else if (score >= 26 && score <= 55) {
      status = 'STABLE CONSOLIDATION';
      description = 'Balanced volume with minor directional pull. Optimal environment for rangebound mean-reversion algorithms.';
      colorClass = 'text-emerald-400';
      strokeColor = '#34d399';
    } else if (score >= 56 && score <= 80) {
      status = 'STRONG IMPULSIVE TREND';
      description = 'Solid institutional order flow detected. Strong momentum is breaking structures. Ideal for trailing stop-losses.';
      colorClass = 'text-amber-400';
      strokeColor = '#fbbf24';
    } else {
      status = 'VOLATILITY HYPER-EXPANSION';
      description = 'Extreme hyper-extended movement! Trend speed is critical. High probability of liquidity sweeps or exhaustive reversals.';
      colorClass = 'text-rose-500 font-extrabold animate-pulse';
      strokeColor = '#f43f5e';
    }

    return {
      score,
      status,
      description,
      colorClass,
      strokeColor,
      rsiVal,
      volRatio,
      trendStrength
    };
  }, [symbol, candles, metrics]);

  // Gauge circular mathematics
  // Total dial is 240 degrees (from -120 to +120).
  // Center is (60, 60), radius is 45.
  // Circumference = 2 * Math.PI * 45 = 282.74
  const radius = 45;
  const strokeWidth = 5.5;
  const circumference = 2 * Math.PI * radius;
  // We use 240 degrees of the circle, which is 240 / 360 = 2/3 of circumference.
  const arcLength = circumference * (240 / 360); 
  const strokeDashoffset = arcLength - (score / 100) * arcLength;

  return (
    <div 
      id={`market-momentum-${symbol.replace('/', '-')}`}
      className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 flex flex-col justify-between h-full select-none"
    >
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-555/20 text-indigo-400">
            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-white">
              Market Momentum
            </h4>
            <p className="text-[9px] text-neutral-200 font-mono">
              Intensity index for {symbol}
            </p>
          </div>
        </div>
        
        {/* Simple tooltip status indicator */}
        <div className="flex items-center space-x-1 font-mono text-[8.5px] uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10 text-neutral-200">
          <Activity className="w-2.5 h-2.5 text-indigo-400" />
          <span>Real-time</span>
        </div>
      </div>

      {/* Main Gauge Visual Dial */}
      <div className="flex flex-col items-center justify-center py-5 relative">
        <svg 
          viewBox="0 0 120 120" 
          className="w-36 h-36 drop-shadow-[0_0_15px_rgba(99,102,241,0.03)]"
        >
          {/* Definitions for gradient */}
          <defs>
            <linearGradient id="momentumGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />     {/* sky-400 */}
              <stop offset="40%" stopColor="#34d399" />    {/* emerald-400 */}
              <stop offset="75%" stopColor="#fbbf24" />    {/* amber-400 */}
              <stop offset="100%" stopColor="#f43f5e" />   {/* rose-500 */}
            </linearGradient>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Underlay glow shadow */}
          <circle cx="60" cy="60" r="38" fill="url(#glow)" />

          {/* Background track arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="#1d222d"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (120 / 360)} // cut the bottom 120 degrees
            transform="rotate(150 60 60)" // orient nicely
            strokeLinecap="round"
          />

          {/* Value colored dial arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="url(#momentumGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (120 / 360) + strokeDashoffset}
            transform="rotate(150 60 60)"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Dynamic glowing dot needle rider */}
          {/* Map score 0-100 onto rotation angle. Over 240 degrees total, starting at 150 deg (left pointer) and ending at 390 deg (right pointer) */}
          {(() => {
            const angle = 150 + (score / 100) * 240;
            const angleRad = (angle * Math.PI) / 180;
            const dotX = 60 + radius * Math.cos(angleRad);
            const dotY = 60 + radius * Math.sin(angleRad);
            return (
              <g className="transition-all duration-700 ease-out">
                {/* Visual needle line from center */}
                <line
                  x1="60"
                  y1="60"
                  x2={dotX}
                  y2={dotY}
                  stroke={strokeColor}
                  strokeWidth="1.2"
                  opacity="0.32"
                />
                {/* Needle glowing ring */}
                <circle
                  cx={dotX}
                  cy={dotY}
                  r="4.5"
                  fill="#050505"
                  stroke={strokeColor}
                  strokeWidth="2.2"
                  className="shadow-md"
                />
              </g>
            );
          })()}

          {/* Center score readout */}
          <text
            x="60"
            y="56"
            className="font-mono text-[14px] font-black text-white"
            textAnchor="middle"
          >
            {score}
          </text>
          <text
            x="60"
            y="66"
            className="font-mono text-[6px] font-bold fill-white/35 uppercase tracking-wider"
            textAnchor="middle"
          >
            MOMENTUM
          </text>

          {/* Low / High boundaries labels */}
          <text
            x="24"
            y="100"
            className="font-mono text-[6.5px] font-bold fill-sky-400"
            textAnchor="middle"
          >
            SQUEEZE
          </text>
          <text
            x="96"
            y="100"
            className="font-mono text-[6.5px] font-bold fill-rose-500"
            textAnchor="middle"
          >
            EUPHORIA
          </text>
        </svg>

        {/* Textual status block inside dial shadow */}
        <div className="text-center mt-2.5">
          <span className={`text-[10.5px] font-mono font-black uppercase tracking-wider block ${colorClass}`}>
            {status}
          </span>
          <p className="text-[9.5px] text-neutral-200 font-sans mt-1.5 leading-relaxed max-w-[260px] mx-auto text-center px-2">
            {description}
          </p>
        </div>
      </div>

      {/* Volatility metric factors list */}
      <div className="pt-3 border-t border-white/5 space-y-2 mt-1">
        <h5 className="text-[8px] font-mono uppercase tracking-wider font-extrabold text-neutral-300">
          Volatility Matrix Contributors
        </h5>
        
        <div className="grid grid-cols-3 gap-2">
          {/* Vol Ratio stat block */}
          <div className="bg-black/40 p-2.5 rounded border border-white/5 text-center">
            <span className="text-[8px] text-neutral-200 uppercase tracking-tight block">Vol Ratio (3/15)</span>
            <div className="text-[10px] font-mono font-bold mt-1 text-white flex items-center justify-center space-x-1 h-4">
              <motion.span 
                key={volRatio}
                initial={{ opacity: 0.3, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className={volRatio >= 1.2 ? 'text-amber-400 font-extrabold' : 'text-emerald-400 font-semibold'}
              >
                {volRatio.toFixed(2)}x
              </motion.span>
            </div>
            <span className="text-[7.5px] text-neutral-300 block font-sans mt-0.5">
              {volRatio >= 1.2 ? 'Expansion' : 'Compression'}
            </span>
          </div>

          {/* RSI Deviation block */}
          <div className="bg-black/40 p-2.5 rounded border border-white/5 text-center">
            <span className="text-[8px] text-neutral-200 uppercase tracking-tight block">RSI Deviation</span>
            <div className="text-[10px] font-mono font-bold mt-1 text-white flex items-center justify-center space-x-1 h-4">
              <motion.span 
                key={rsiVal}
                initial={{ opacity: 0.3, scale: 0.85, y: -2 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className={Math.abs(rsiVal - 50) >= 15 ? 'text-amber-400 font-black' : 'text-emerald-400 font-semibold'}
              >
                {Math.abs(Math.round(rsiVal - 50))}
              </motion.span>
            </div>
            <span className="text-[7.5px] text-neutral-300 block font-sans mt-0.5">
              Ref: {Math.round(rsiVal)}
            </span>
          </div>

          {/* Trend strength stat block */}
          <div className="bg-black/40 p-2.5 rounded border border-white/5 text-center">
            <span className="text-[8px] text-neutral-200 uppercase tracking-tight block">Trend Persist</span>
            <div className="text-[10px] font-mono font-bold mt-1 text-white flex items-center justify-center space-x-1 h-4">
              <motion.span 
                key={trendStrength}
                initial={{ opacity: 0.3, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className={trendStrength >= 60 ? 'text-indigo-400 font-extrabold' : 'text-neutral-200 font-semibold'}
              >
                {Math.round(trendStrength)}%
              </motion.span>
            </div>
            <span className="text-[7.5px] text-neutral-300 block font-sans mt-0.5">
              {trendStrength >= 65 ? 'Impaired' : 'Balanced'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
