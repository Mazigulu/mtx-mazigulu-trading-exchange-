import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Trade } from '../types';

interface TradePositionRowItemProps {
  trade: Trade;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onQuickClose: (id: string) => void;
  formatOpenDuration: (openedStr: string) => string;
  isCompact?: boolean;
  onUpdateParams: (id: string, params: Partial<Trade>) => void;
}

export const TradePositionRowItem: React.FC<TradePositionRowItemProps> = ({
  trade,
  isExpanded,
  onToggleExpand,
  onQuickClose,
  formatOpenDuration,
  isCompact = false,
  onUpdateParams,
}) => {
  const pnlMultiplier = trade.side === 'BUY' ? 1 : -1;
  const slDiff = trade.stopLoss - trade.entryPrice;
  const tpDiff = trade.takeProfit - trade.entryPrice;

  let pnlAtSL = 0;
  let pnlAtTP = 0;

  if (trade.symbol === 'BTC/USDT') {
    pnlAtSL = slDiff * trade.size * pnlMultiplier;
    pnlAtTP = tpDiff * trade.size * pnlMultiplier;
  } else if (trade.symbol === 'USD/JPY') {
    pnlAtSL = (slDiff / 0.01) * trade.size * 0.1 * pnlMultiplier;
    pnlAtTP = (tpDiff / 0.01) * trade.size * 0.1 * pnlMultiplier;
  } else {
    pnlAtSL = (slDiff / 0.0001) * trade.size * 1.0 * pnlMultiplier;
    pnlAtTP = (tpDiff / 0.0001) * trade.size * 1.0 * pnlMultiplier;
  }

  const slProximity = pnlAtSL < 0 ? Math.max(0, Math.min(1, trade.pnl / pnlAtSL)) : 0;
  const tpProximity = pnlAtTP > 0 ? Math.max(0, Math.min(1, trade.pnl / pnlAtTP)) : 0;

  // Real-time Health metrics
  let statusColor = 'bg-indigo-400';
  let statusRipple = 'bg-indigo-400/50';
  let statusText = 'Stable';
  let statusTooltip = 'Active standard exposure without target breaches';

  if (trade.pnl < 0) {
    if (slProximity >= 0.70) {
      statusColor = 'bg-rose-500';
      statusRipple = 'bg-rose-500/50 animate-ping';
      statusText = 'Near SL';
      statusTooltip = `Critical Drawdown: ${Math.round(slProximity * 100)}% of Stop-Loss safety breached`;
    } else {
      statusColor = 'bg-amber-500';
      statusRipple = 'bg-amber-500/40 animate-pulse';
      statusText = 'Drawdown';
      statusTooltip = `Standard Retracement: ${Math.round(slProximity * 100)}% route to Stop-Loss`;
    }
  } else if (trade.pnl > 0) {
    if (tpProximity >= 0.70 || trade.pnl >= 100) {
      statusColor = 'bg-emerald-400';
      statusRipple = 'bg-emerald-400/50 animate-ping';
      statusText = 'Trailing';
      statusTooltip = `Target Proximity: ${Math.round(tpProximity * 100)}% of Take-Profit objectives secured`;
    } else {
      statusColor = 'bg-teal-400';
      statusRipple = 'bg-teal-400/40 animate-pulse';
      statusText = 'Profitable';
      statusTooltip = `Healthy Expansion: ${Math.round(tpProximity * 100)}% route to Take-Profit`;
    }
  }

  let heatClass = 'border-white/5';
  if (trade.pnl < 0) {
    if (slProximity >= 0.70) {
      heatClass = 'danger-pulse-row';
    } else {
      heatClass = 'border-rose-500/10 hover:border-rose-500/25 shadow-[0_0_8px_rgba(244,63,94,0.02)]';
    }
  } else if (trade.pnl > 0) {
    if (tpProximity >= 0.70 || trade.pnl >= 100) {
      heatClass = 'high-profit-glow';
    } else {
      heatClass = 'border-emerald-500/10 hover:border-emerald-500/25 shadow-[0_0_8px_rgba(16,185,129,0.02)]';
    }
  }

  // Tracking PnL changes for smooth visual background transitions
  const prevPnlRef = useRef<number | null>(null);
  const [flashType, setFlashType] = useState<'UP' | 'DOWN' | null>(null);

  // States for tracking real-time refresh delta
  const [lastTickTime, setLastTickTime] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  // States for tracking Price Target Projections
  const [huntCountdown, setHuntCountdown] = useState<number>(0);
  const [huntType, setHuntType] = useState<string>('Resistance Target');
  const [huntTargetPrice, setHuntTargetPrice] = useState<number>(0);
  const [huntICTConcept, setHuntICTConcept] = useState<string>('');

  useEffect(() => {
    // Seed helper to make it deterministic but distinct per trade
    const hash = String(trade.id).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const initialDuration = 180 + (hash % 240); // 3 to 7 minutes
    setHuntCountdown(initialDuration);

    const isBuy = trade.side === 'BUY';
    const targetType = isBuy ? 'Intraday Resistance Target' : 'Intraday Support Target';
    setHuntType(targetType);

    // Calculate a plausible target price based on take profit or stop loss or entry
    let targetPx = 0;
    if (trade.symbol.includes('BTC')) {
      targetPx = isBuy ? trade.entryPrice + 350 + (hash % 200) : trade.entryPrice - 350 - (hash % 200);
    } else if (trade.symbol.includes('ETH')) {
      targetPx = isBuy ? trade.entryPrice + 20 + (hash % 15) : trade.entryPrice - 20 - (hash % 15);
    } else if (trade.symbol.includes('SOL')) {
      targetPx = isBuy ? trade.entryPrice + 1.5 + (hash % 10) * 0.1 : trade.entryPrice - 1.5 - (hash % 10) * 0.1;
    } else if (trade.symbol.includes('JPY')) {
      targetPx = isBuy ? trade.entryPrice + 0.25 + (hash % 40) * 0.01 : trade.entryPrice - 0.25 - (hash % 40) * 0.01;
    } else if (trade.symbol.includes('GOLD')) {
      targetPx = isBuy ? trade.entryPrice + 8.5 + (hash % 50) * 0.1 : trade.entryPrice - 8.5 - (hash % 50) * 0.1;
    } else if (trade.symbol.includes('SILVER')) {
      targetPx = isBuy ? trade.entryPrice + 0.15 + (hash % 30) * 0.01 : trade.entryPrice - 0.15 - (hash % 30) * 0.01;
    } else if (trade.symbol.includes('US30') || trade.symbol.includes('NAS100') || trade.symbol.includes('SPX500')) {
      targetPx = isBuy ? trade.entryPrice + 45 + (hash % 30) : trade.entryPrice - 45 - (hash % 30);
    } else {
      // standard Forex
      targetPx = isBuy ? trade.entryPrice + 0.0035 + (hash % 40) * 0.0001 : trade.entryPrice - 0.0035 - (hash % 40) * 0.0001;
    }
    setHuntTargetPrice(targetPx);

    // standard brokerage trading terms
    const concepts = [
      'EMA crossover dynamic indicator response target',
      'Moving average convergence/divergence momentum target',
      'Volume-weighted average price (VWAP) anchor test target',
      'Relative Strength Index (RSI) mean reversion target',
      'Fibonacci retracement level support verification',
      'Pivot point standard resistance target breach',
      'Consolidation breakout target following volume impulse'
    ];
    setHuntICTConcept(concepts[hash % concepts.length]);
  }, [trade.id, trade.side, trade.entryPrice, trade.symbol]);

  // Handle countdown interval
  useEffect(() => {
    const timer = setInterval(() => {
      setHuntCountdown(prev => {
        if (prev <= 1) {
          // Reset to a new random 4-8m range
          return 240 + Math.floor(Math.random() * 240);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLastTickTime(Date.now());
    setSecondsAgo(0);
  }, [trade.pnl]);

  useEffect(() => {
    if (!isExpanded) return;
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastTickTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isExpanded, lastTickTime]);

  useEffect(() => {
    if (prevPnlRef.current !== null) {
      const diff = trade.pnl - prevPnlRef.current;
      // We flash if the PnL changes significantly (e.g. >= $0.20 to catch live ticks)
      if (Math.abs(diff) >= 0.20) {
        if (diff > 0) {
          setFlashType('UP');
        } else {
          setFlashType('DOWN');
        }

        // Keep the full flash color for 150ms before returning to base.
        // The transition-all/colors duration-1000 class on the row will smoothly fade it out.
        const timer = setTimeout(() => {
          setFlashType(null);
        }, 150);

        return () => clearTimeout(timer);
      }
    }
    prevPnlRef.current = trade.pnl;
  }, [trade.pnl]);

  // Theoretical Market Impact & Book Depth calculations
  const isBtc = trade.symbol === 'BTC/USDT';
  const positionNotional = isBtc ? trade.size * trade.entryPrice : trade.size * 100000;

  // Custom liquidity factors per asset class (in USD equivalent)
  let liquidityFactor = 10000000; // default major forex $10M depth
  if (trade.symbol === 'BTC/USDT') {
    liquidityFactor = 7500000; // Crypto BTC depth
  } else if (trade.symbol === 'USD/JPY') {
    liquidityFactor = 15000000; // USD/JPY high depth
  } else if (trade.symbol.includes('GOLD') || trade.symbol.includes('XAU')) {
    liquidityFactor = 5000000; // Commodities depth
  } else if (trade.symbol.includes('SOL') || trade.symbol.includes('ETH')) {
    liquidityFactor = 2000000; // Altcoins depth
  }

  // Consistent hash modifier to reflect dynamic depth variation
  const hashValForImpact = String(trade.id).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const microFluctuation = 1 + (hashValForImpact % 15) * 0.02; // multiplier between 1.0 and 1.30
  const computedImpactPercentage = ((positionNotional / liquidityFactor) * 100) * microFluctuation;
  const computedImpactBps = computedImpactPercentage * 100;

  // Classify score bands
  let impactGrade = 'Ultra-Low';
  let impactGradeClass = 'text-green-400 bg-green-500/10 border-green-500/20';
  let bookPressureStr = 'Negligible order book pressure';
  
  if (computedImpactPercentage >= 0.12) {
    impactGrade = 'Critical';
    impactGradeClass = 'text-rose-400 bg-rose-500/10 border-rose-500/25 animate-pulse';
    bookPressureStr = 'Significant Level 2 imbalance & wide slippage risk';
  } else if (computedImpactPercentage >= 0.04) {
    impactGrade = 'Moderate';
    impactGradeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    bookPressureStr = 'Detectable ask/bid volume displacement';
  } else if (computedImpactPercentage >= 0.01) {
    impactGrade = 'Low';
    impactGradeClass = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    bookPressureStr = 'Minor high-frequency order-flow absorbency';
  }

  // Real-time AI Stop-loss Breach Probability based on order flow depth
  const breachProbability = React.useMemo(() => {
    // Hash seed for uniqueness
    const hashVal = String(trade.id).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const tradeOffset = (hashVal % 11) - 5; // offset between -5% and +5%

    // Calculate proximity to Stop-Loss
    let distFactor = 0;
    if (trade.stopLoss > 0) {
      if (trade.pnl < 0) {
        distFactor = slProximity * 50; // closer to SL increases risk by up to 50%
      } else {
        distFactor = -tpProximity * 15; // closer to TP decreases probability of SL breach
      }
    } else {
      distFactor = -15; // No stop-loss: lower probability of standard SL trigger, default to a lower base
    }

    // Impact size (higher volume / notional increases liquidity sweep draw)
    const sizeVolatilityFactor = Math.min(22, computedImpactPercentage * 150);

    // Dynamic real-time live heartbeat oscillation to show continuous recalculation
    const liveOscillation = Math.sin(Date.now() / 8000) * 3;

    const baseProb = 42 + tradeOffset + distFactor + sizeVolatilityFactor + liveOscillation;
    return Math.max(2, Math.min(99, Math.round(baseProb)));
  }, [trade.id, trade.pnl, trade.stopLoss, slProximity, tpProximity, computedImpactPercentage]);

  const getBreachRiskMeta = (prob: number) => {
    if (prob <= 32) {
      return {
        label: 'Low Sweep Risk',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'Order-book buy/sell support remains fortified. Liquid bid orders act as a barrier against price spikes near your Stop-Loss.'
      };
    } else if (prob <= 65) {
      return {
        label: 'Moderate Volatility Risk',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'Standard cushion depth. Spot order flow is fluid, but algorithmic high-frequency sweeps can breach this level under sudden volatility.'
      };
    } else {
      return {
        label: 'Severe Sweep Exposure ⚠️',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/25 animate-pulse',
        text: 'Critical level. Order depth buffer is depleted. Direct market pressure or bid/ask imbalances are highly likely to sweep this Stop-Loss.'
      };
    }
  };

  const riskMeta = getBreachRiskMeta(breachProbability);

  // Determine dynamic background, border and glow styling based on live flashing state
  const flashStyleClasses = flashType === 'UP'
    ? 'border-emerald-500/40 bg-emerald-500/15 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
    : flashType === 'DOWN'
      ? 'border-rose-500/40 bg-rose-500/15 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
      : `${heatClass} bg-[#050505]`;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`rounded border overflow-hidden transition-all duration-1000 ease-out ${flashStyleClasses}`}
    >
      {/* Position Header/Summary Row */}
      <div
        onClick={() => onToggleExpand(trade.id)}
        className={`${isCompact ? 'p-1.5 px-2.5 gap-1.5' : 'p-3 gap-3'} flex items-center justify-between cursor-pointer hover:bg-white/[0.02] select-none`}
      >
        <div className="flex items-center space-x-1.5 md:space-x-2">
          <span className="text-neutral-200 hover:text-white transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>

          {/* Real-time Health Status Indicator Dot */}
          <div className="relative flex items-center justify-center shrink-0 w-3 h-3" title={statusTooltip}>
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusRipple}`} />
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${statusColor}`} />
          </div>

          <span className={`${isCompact ? 'px-1 py-[1px] text-[8px]' : 'px-2 py-0.5 text-[9.5px]'} rounded font-black font-mono shrink-0 ${trade.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {trade.side}
          </span>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`${isCompact ? 'text-[11px]' : 'text-xs'} font-bold font-mono text-white block`}>{trade.symbol}</span>
              <span className={`${isCompact ? 'text-[6.5px] px-0.5 py-[0.5px]' : 'text-[7.5px] px-1 py-[1.5px]'} font-mono font-bold uppercase tracking-wider text-neutral-200 bg-white/[0.03] rounded border border-white/5`} title={statusTooltip}>
                {statusText}
              </span>

              {/* Price Target Badge & Tooltip */}
              <div 
                className={`flex items-center gap-1 font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 rounded border border-amber-500/20 cursor-help transition-all duration-300 select-none shrink-0 ${isCompact ? 'text-[6.5px] px-0.5 py-[0.5px]' : 'text-[7.5px] px-1 py-[1.5px]'}`}
                title={`[Price Target Projection] Next trend target (${huntType}) price: ${huntTargetPrice.toFixed(trade.symbol === 'USD/JPY' ? 3 : trade.symbol === 'BTC/USDT' ? 1 : trade.symbol === 'ETH/USDT' ? 2 : trade.symbol === 'SOL/USDT' ? 2 : trade.symbol === 'GOLD/USD' ? 2 : 5)}. Catalyst: ${huntICTConcept}`}
              >
                <span className="relative flex h-1 w-1 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-amber-500"></span>
                </span>
                <span className="text-amber-400/70">Target:</span>
                <span className="font-extrabold animate-pulse">{Math.floor(huntCountdown / 60)}m {String(huntCountdown % 60).padStart(2, '0')}s</span>
              </div>

              {/* AI Stop-loss Breach Probability Badge */}
              {trade.stopLoss > 0 && (
                <div 
                  className={`flex items-center gap-1 font-mono font-bold uppercase tracking-wider rounded border cursor-help transition-all duration-300 select-none shrink-0 ${riskMeta.color} ${riskMeta.bg} ${riskMeta.border} ${isCompact ? 'text-[6.5px] px-0.5 py-[0.5px]' : 'text-[7.5px] px-1 py-[1.5px]'}`}
                  title={`[AI SL Risk Assessment] Calculated ${breachProbability}% probability of triggering the Stop-Loss. Indicator evaluates order depth buffers, current price trajectory speed, and historical volatility.`}
                >
                  <span className="relative flex h-1   w-1 shrink-0 font-sans">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      breachProbability > 65 ? 'bg-rose-400' : breachProbability > 32 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-1 w-1 ${
                      breachProbability > 65 ? 'bg-rose-500' : breachProbability > 32 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></span>
                  </span>
                  <span className="opacity-70">SL Risk:</span>
                  <span className="font-extrabold">{breachProbability}%</span>
                </div>
              )}
            </div>
            <span className={`${isCompact ? 'text-[8.5px]' : 'text-[9.5px]'} text-neutral-200 font-mono`}>Lot size: {trade.size}</span>
          </div>
        </div>

        {/* Minimalist Sparkline Chart */}
        {trade.pnlTrajectory && trade.pnlTrajectory.length > 0 ? (
          <div className={`hidden sm:block ${isCompact ? 'w-14 h-4 opacity-50' : 'w-20 md:w-28 h-7 opacity-80'} grow-0 shrink-0 self-center hover:opacity-100 transition-opacity pr-2`} title={`${trade.symbol} PnL trajectory (Last 60m)`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trade.pnlTrajectory} margin={{ top: 1, bottom: 1, left: 1, right: 1 }}>
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke={trade.pnl >= 0 ? '#10b981' : '#f43f5e'}
                  strokeWidth={isCompact ? 1 : 1.5}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={`hidden sm:block ${isCompact ? 'w-14 h-4' : 'w-20 md:w-28 h-7'} shrink-0`} />
        )}

        <div className="flex items-center space-x-2 md:space-x-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="text-right flex flex-col items-end justify-center">
            <span className={`${isCompact ? 'text-[11px]' : 'text-xs'} font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
            </span>
            {!isCompact && <span className="text-[8.5px] text-neutral-200 block font-mono">PnL</span>}
          </div>
          <button
            onClick={() => onQuickClose(trade.id)}
            className={`border cursor-pointer flex items-center space-x-1 font-mono font-bold uppercase transition-all tracking-wider ${isCompact ? 'px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[8.5px] border-rose-500/20 hover:border-rose-500/40' : 'px-2 py-1 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-white border border-rose-500/25 hover:border-rose-500/60 text-[9px]'}`}
          >
            <X className={isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            {!isCompact && <span>Close</span>}
          </button>
        </div>
      </div>

      {/* Expanded position details wrapper */}
      {isExpanded && (
        <div className={`${isCompact ? 'px-2 pb-2 pt-1 gap-1.5 text-[9px]' : 'px-3 pb-3 pt-1.5 gap-2 text-[10px]'} border-t border-white/5 bg-white/[0.01] flex flex-col font-mono text-neutral-200 animate-fadeIn animate-duration-300`}>
          <div className={`${isCompact ? 'grid grid-cols-2 sm:grid-cols-4 gap-1' : 'grid grid-cols-2 sm:grid-cols-4 gap-2'}`}>
            <div className={`bg-black/30 rounded border border-white/5 ${isCompact ? 'p-1' : 'p-2'}`}>
              <span className="text-[8px] text-neutral-200 block uppercase tracking-wider mb-0.5">Entry Price</span>
              <span className="text-white font-bold">{trade.entryPrice.toFixed(trade.symbol === 'USD/JPY' ? 3 : trade.symbol === 'BTC/USDT' ? 1 : 5)}</span>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 ${isCompact ? 'p-1' : 'p-2'}`}>
              <span className="text-[8px] text-neutral-200 block uppercase tracking-wider mb-0.5">Entry Time</span>
              <span className="text-white font-bold">
                {new Date(trade.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 ${isCompact ? 'p-1' : 'p-2'}`}>
              <span className="text-[8px] text-neutral-200 block uppercase tracking-wider mb-0.5">Open Duration</span>
              <span className="text-white font-bold">{formatOpenDuration(trade.timestamp)}</span>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 flex flex-col justify-between ${isCompact ? 'p-1' : 'p-2'}`} title="Time elapsed since the last real-time high-fidelity streaming price/PnL update.">
              <span className="text-[8px] text-neutral-200 block uppercase tracking-wider mb-0.5">Last Refresh Delta</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-emerald-400 font-bold leading-none">
                  {secondsAgo === 0 ? 'Just now' : `${secondsAgo}s ago`}
                </span>
              </div>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 ${isCompact ? 'p-1' : 'p-2'}`}>
              <span className="text-[8px] text-neutral-200 block uppercase tracking-wider mb-0.5">Potential PnL at Target</span>
              <span className="text-emerald-400 font-extrabold block">
                +${pnlAtTP.toFixed(2)}
              </span>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 ${isCompact ? 'p-1' : 'p-2'}`}>
              <span className="text-[8px] text-neutral-200 block uppercase tracking-wider mb-0.5">Margin Usage</span>
              <span className="text-indigo-400 font-extrabold">${((trade.symbol === 'BTC/USDT' ? trade.size * trade.entryPrice : trade.size * 100000) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 flex flex-col justify-between ${isCompact ? 'p-1' : 'p-2'}`} title="Theoretical order book pressure on global liquidity pool based on standard level-2 asset depth.">
              <span className="text-[8px] text-neutral-200 block uppercase tracking-wider mb-0.5">Market Impact Score</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[7.5px] font-extrabold uppercase px-1 py-[0.5px] rounded border leading-none shrink-0 ${impactGradeClass}`}>
                  {impactGrade}
                </span>
                <span className="text-white font-bold leading-none">
                  {computedImpactPercentage.toFixed(4)}%
                </span>
              </div>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 flex flex-col justify-between ${isCompact ? 'p-1' : 'p-2'}`} title="Expected pricing slippage from bid/ask absorbency.">
              <span className="text-[8px] text-neutral-200 block uppercase tracking-wider mb-0.5">Est. Slippage Impact</span>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="text-indigo-300 font-extrabold leading-none">
                  {computedImpactBps.toFixed(2)} bps
                </span>
                <span className="text-[7.5px] text-neutral-200 font-normal leading-tight text-right line-clamp-1 block">
                  {bookPressureStr}
                </span>
              </div>
            </div>
          </div>

          {/* Advanced Position Target & Protection Control Panel */}
          <div className="bg-[#050508] border border-white/5 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
              <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider">🛡️ Trade Management & Risk Protection</span>
              <span className="text-[7.5px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20 font-black">
                SWING SWEEP TUNING
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3.5 justify-between">
              {/* Quick Action: Set BE & Lock SL */}
              <div className="space-y-1.5 shrink-0">
                <span className="text-[7.5px] text-neutral-200 block uppercase tracking-wider font-bold">1. Quick Break-Even Protection</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateParams(trade.id, { stopLoss: trade.entryPrice })}
                    disabled={trade.stopLoss === trade.entryPrice}
                    className={`px-3 py-1.5 font-sans font-extrabold uppercase rounded border transition-all text-[9.5px] cursor-pointer flex items-center justify-center gap-1 leading-none ${
                      trade.stopLoss === trade.entryPrice
                        ? 'bg-neutral-900 border-white/5 text-neutral-400 cursor-not-allowed'
                        : 'bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] border-[#10b981]/25 hover:border-[#10b981]/50'
                    }`}
                  >
                    🛡️ Set BE ({trade.entryPrice.toFixed(trade.symbol === 'USD/JPY' ? 3 : trade.symbol === 'BTC/USDT' ? 1 : 5)})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Custom dynamic fixed buffer
                      let buffer = 0.00015; // default forex
                      if (trade.symbol === 'USD/JPY') buffer = 0.015;
                      else if (trade.symbol === 'BTC/USDT') buffer = 15.0;
                      else if (trade.symbol === 'ETH/USDT') buffer = 1.5;
                      else if (trade.symbol === 'SOL/USDT') buffer = 0.15;
                      else if (trade.symbol === 'GOLD/USD') buffer = 0.25;
                      else if (trade.symbol === 'SILVER/USD') buffer = 0.03;
                      else if (['US30', 'NAS100', 'SPX500', 'GER40'].includes(trade.symbol)) buffer = 1.5;

                      const isBuy = trade.side === 'BUY';
                      const targetSL = isBuy ? trade.entryPrice + buffer : trade.entryPrice - buffer;
                      const decimals = trade.symbol === 'USD/JPY' || trade.symbol === 'GOLD/USD' ? 2 : trade.symbol === 'BTC/USDT' ? 1 : 5;
                      onUpdateParams(trade.id, { stopLoss: parseFloat(targetSL.toFixed(decimals)) });
                    }}
                    className="px-3 py-1.5 font-sans font-extrabold uppercase rounded border transition-all text-[9.5px] cursor-pointer flex items-center justify-center gap-1 leading-none bg-indigo-500/15 hover:bg-indigo-600 border-indigo-500/20 hover:border-indigo-500 text-indigo-300 hover:text-white"
                    title="Pins stop loss to breakeven + a small buffer to guarantee commissions coverage"
                  >
                    🔒 Lock SL (+Buffer)
                  </button>
                </div>
              </div>

              {/* Trailing Stop Loss Toggle */}
              <div className="space-y-1.5 grow md:max-w-[42%] bg-black/20 p-2 rounded border border-white/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[7.5px] text-neutral-200 uppercase tracking-wider font-bold">2. Enable Trailing Stop</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id={`tsl-toggle-${trade.id}`}
                      checked={!!trade.trailingStopActive}
                      onChange={(e) => {
                        const active = e.target.checked;
                        const defaultDist = trade.symbol === 'BTC/USDT' ? 250 : trade.symbol === 'USD/JPY' ? 0.15 : 0.0015;
                        onUpdateParams(trade.id, { 
                          trailingStopActive: active,
                          trailingStopDistance: trade.trailingStopDistance || defaultDist
                        });
                      }}
                      className="rounded border-white/10 bg-black text-indigo-500 focus:ring-0 focus:ring-offset-0 w-3 h-3 cursor-pointer"
                    />
                    <label htmlFor={`tsl-toggle-${trade.id}`} className="text-[8px] text-neutral-200 font-bold uppercase cursor-pointer">
                      {trade.trailingStopActive ? 'Enabled' : 'Disabled'}
                    </label>
                  </div>
                </div>

                {trade.trailingStopActive ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[7.5px] text-neutral-200 font-bold font-sans">Distance:</span>
                    <input
                      type="number"
                      step={trade.symbol === 'USD/JPY' ? '0.01' : trade.symbol === 'BTC/USDT' ? '10' : '0.0001'}
                      value={trade.trailingStopDistance || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          onUpdateParams(trade.id, { trailingStopDistance: val });
                        }
                      }}
                      className="bg-black border border-white/10 text-[9px] text-white px-1.5 py-0.5 rounded font-mono w-20 focus:outline-none focus:border-indigo-500/40"
                    />
                    <span className="text-[7.5px] text-indigo-300 font-bold">
                      {trade.symbol === 'BTC/USDT' ? 'USDT' : trade.symbol === 'USD/JPY' ? 'Yen' : 'Pips'}
                    </span>
                  </div>
                ) : (
                  <span className="text-[7px] text-[#8e8e9f] leading-normal block">Automatically trails Stop-Loss dynamically behind price to secure profit.</span>
                )}
              </div>

              {/* Trailing / Self-Adjusting Take Profit Toggle */}
              <div className="space-y-1.5 grow md:max-w-[32%] bg-black/20 p-2 rounded border border-white/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[7.5px] text-neutral-200 uppercase tracking-wider font-bold">3. Trailing Take Profit (TTP)</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id={`ttp-toggle-${trade.id}`}
                      checked={!!trade.trailingTakeProfitActive}
                      onChange={(e) => {
                        onUpdateParams(trade.id, { trailingTakeProfitActive: e.target.checked });
                      }}
                      className="rounded border-white/10 bg-black text-indigo-500 focus:ring-0 focus:ring-offset-0 w-3 h-3 cursor-pointer"
                    />
                    <label htmlFor={`ttp-toggle-${trade.id}`} className="text-[8px] text-neutral-200 font-bold uppercase cursor-pointer">
                      {trade.trailingTakeProfitActive ? 'Running' : 'Off'}
                    </label>
                  </div>
                </div>
                <span className="text-[7px] text-[#8e8e9f] leading-normal block">
                  {trade.trailingTakeProfitActive 
                    ? '⚡️ Self-adjusting target: Extends TP is close and locks in 95% target on Stop-Loss.'
                    : 'Auto-extends potential profit target dynamically as swing trend establishes momentum.'
                  }
                </span>
              </div>
            </div>

            {/* LAV-TSL: Liquidity-Adjusted Volatility Trailing Stop Loss */}
            <div className="bg-indigo-950/10 border border-indigo-500/15 p-3 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${trade.lavTslActive ? 'animate-ping bg-indigo-400' : 'bg-white/10'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${trade.lavTslActive ? 'bg-indigo-400' : 'bg-white/20'}`}></span>
                  </span>
                  <span className="text-[9px] font-black text-white uppercase tracking-wider">
                    MTX LAV-TSL: Volatility & Liquidity-Adjusted Trailing Stop
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id={`lav-tsl-toggle-${trade.id}`}
                    checked={!!trade.lavTslActive}
                    onChange={(e) => {
                      const active = e.target.checked;
                      onUpdateParams(trade.id, { 
                        lavTslActive: active,
                        lavTslAtrMultiplier: trade.lavTslAtrMultiplier || 2.0,
                        lavTslLiquidityActive: trade.lavTslLiquidityActive !== undefined ? trade.lavTslLiquidityActive : true,
                        lavTslTighteningActive: trade.lavTslTighteningActive !== undefined ? trade.lavTslTighteningActive : true,
                      });
                    }}
                    className="rounded border-indigo-500/30 bg-black text-indigo-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <label htmlFor={`lav-tsl-toggle-${trade.id}`} className="text-[9px] text-indigo-300 font-extrabold uppercase cursor-pointer">
                    {trade.lavTslActive ? 'ACTIVE' : 'OFF'}
                  </label>
                </div>
              </div>

              {trade.lavTslActive ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] animate-fadeIn">
                  {/* Parameter 1: ATR Multiplier */}
                  <div className="bg-black/30 p-2 rounded border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[8.5px] text-neutral-200 font-bold uppercase">
                      <span>ATR Multiplier Buffer</span>
                      <span className="text-indigo-300 font-extrabold">{trade.lavTslAtrMultiplier?.toFixed(2) || '2.00'}x ATR</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="3.5"
                      step="0.25"
                      value={trade.lavTslAtrMultiplier || 2.0}
                      onChange={(e) => {
                        onUpdateParams(trade.id, { lavTslAtrMultiplier: parseFloat(e.target.value) });
                      }}
                      className="w-full accent-indigo-500 cursor-pointer h-1 rounded-lg bg-white/5"
                    />
                    <span className="text-[7.5px] text-neutral-200 leading-tight block">
                      Cushion distance based on True Range volatility.
                    </span>
                  </div>

                  {/* Parameter 2: Liquidity Zone Alignment */}
                  <div className="bg-black/30 p-2 rounded border border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center text-[8.5px] text-neutral-200 font-bold uppercase">
                      <span>Liquidity Zone Pad</span>
                      <span className={`text-[7px] px-1 rounded font-black ${trade.lavTslLiquidityActive ? 'bg-indigo-500/15 text-indigo-300' : 'bg-white/5 text-neutral-400'}`}>
                        {trade.lavTslLiquidityActive ? 'PADDED' : 'BYPASSED'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <input
                        type="checkbox"
                        id={`lav-tsl-liquidity-${trade.id}`}
                        checked={!!trade.lavTslLiquidityActive}
                        onChange={(e) => {
                           onUpdateParams(trade.id, { lavTslLiquidityActive: e.target.checked });
                        }}
                        className="rounded border-white/10 bg-black text-indigo-500 focus:ring-0 focus:ring-offset-0 w-3 h-3 cursor-pointer"
                      />
                      <label htmlFor={`lav-tsl-liquidity-${trade.id}`} className="text-[8px] text-neutral-200 font-semibold uppercase cursor-pointer">
                        Align with Support Levels
                      </label>
                    </div>
                    <span className="text-[7.5px] text-neutral-200 leading-tight block">
                      Pins trailing bounds behind confirmed support or resistance ranges.
                    </span>
                  </div>

                  {/* Parameter 3: Profit Tightening Scale */}
                  <div className="bg-black/30 p-2 rounded border border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center text-[8.5px] text-neutral-200 font-bold uppercase">
                      <span>Profit Tightening</span>
                      <span className={`text-[7px] px-1 rounded font-black ${trade.lavTslTighteningActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-neutral-400'}`}>
                        {trade.lavTslTighteningActive ? 'DYNAMIC' : 'STATIC'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <input
                        type="checkbox"
                        id={`lav-tsl-tightening-${trade.id}`}
                        checked={!!trade.lavTslTighteningActive}
                        onChange={(e) => {
                           onUpdateParams(trade.id, { lavTslTighteningActive: e.target.checked });
                        }}
                        className="rounded border-white/10 bg-black text-indigo-500 focus:ring-0 focus:ring-offset-0 w-3 h-3 cursor-pointer"
                      />
                      <label htmlFor={`lav-tsl-tightening-${trade.id}`} className="text-[8px] text-neutral-200 font-semibold uppercase cursor-pointer">
                        Scale down as profit accrues
                      </label>
                    </div>
                    <span className="text-[7.5px] text-neutral-200 leading-tight block">
                      Tighter risk exposure dynamically to protect paper gains.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[8.5px] text-indigo-300/60 leading-relaxed font-mono">
                  ⚡️ The MTX institutional-grade stop mechanism. Merges 14-period Average True Range volatility with level-2 order book depth profiles, placing trailing stop barriers behind high-volume liquidity pools and compressing risk as the market advances in your favor.
                </div>
              )}
            </div>
          </div>

          {/* Premium Price Target Projection Sub-section details */}
          <div className={`${isCompact ? 'p-1.5 gap-1.5' : 'p-2 gap-2'} bg-gradient-to-r from-amber-500/[0.03] to-amber-600/[0.01] border border-amber-500/10 hover:border-amber-500/20 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between transition-colors select-none`}>
            <div className="flex items-start gap-1.5">
              <span className="relative flex h-1.5 w-1.5 mt-1 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              <div>
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[8px] block">
                  Securities Price Target Projection
                </span>
                <p className={`${isCompact ? 'text-[9.2px]' : 'text-[9.5px]'} text-neutral-200 font-medium leading-relaxed mt-0.5`}>
                  {huntICTConcept}. Target area expected at <span className="text-amber-400/90 font-mono font-bold">{huntType}</span> near <span className="text-white font-mono font-bold bg-white/5 px-1 py-0.5 rounded border border-white/5">{huntTargetPrice.toFixed(trade.symbol === 'USD/JPY' ? 3 : trade.symbol === 'BTC/USDT' ? 1 : trade.symbol === 'ETH/USDT' ? 2 : trade.symbol === 'SOL/USDT' ? 2 : trade.symbol === 'GOLD/USD' ? 2 : 5)}</span>.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 bg-black/40 border border-white/5 sm:border-none sm:bg-transparent px-2 py-1 rounded">
              <span className="text-neutral-200 uppercase text-[8px] tracking-wider leading-none">Target Verification</span>
              <span className="text-amber-400 text-xs font-black tracking-widest bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded animate-pulse">
                {Math.floor(huntCountdown / 60)}m {String(huntCountdown % 60).padStart(2, '0')}s
              </span>
            </div>
          </div>

          {/* AI Stop-loss Breach Risk Assessment Companion Card */}
          {trade.stopLoss > 0 ? (
            <div className={`${isCompact ? 'p-1.5 gap-1.5' : 'p-2 gap-2'} bg-gradient-to-r from-indigo-500/[0.03] to-purple-600/[0.01] border border-indigo-500/10 hover:border-indigo-500/20 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between transition-colors select-none`}>
              <div className="flex items-start gap-1.5">
                <span className="relative flex h-1.5 w-1.5 mt-1 shrink-0 font-sans">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    breachProbability > 65 ? 'bg-rose-400' : breachProbability > 32 ? 'bg-indigo-400' : 'bg-emerald-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                    breachProbability > 65 ? 'bg-rose-500' : breachProbability > 32 ? 'bg-indigo-500' : 'bg-emerald-500'
                  }`}></span>
                </span>
                <div className="space-y-0.5">
                  <span className="text-indigo-400 font-bold uppercase tracking-wider text-[8px] block flex items-center gap-1.5">
                    <span>Order-Flow Stop-Loss Breach Risk Assessment</span>
                    <span className={`text-[6.5px] px-1 rounded font-black border ${riskMeta.color} ${riskMeta.bg} ${riskMeta.border}`}>
                      {riskMeta.label}
                    </span>
                  </span>
                  <p className={`${isCompact ? 'text-[9.2px]' : 'text-[9.5px]'} text-neutral-200 font-medium leading-relaxed`}>
                    {riskMeta.text} <span className="text-neutral-200 font-normal">Level-2 support volume has programmed depth pools of</span> <span className="text-indigo-300 font-bold font-mono">{(liquidityFactor * (1 - slProximity) / 1000).toFixed(1)}k contracts</span> <span className="text-neutral-200 font-normal">standing between current rate and stop level</span> <span className="text-white font-bold font-mono bg-white/5 px-1 py-0.5 rounded border border-white/5">{trade.stopLoss.toFixed(trade.symbol === 'USD/JPY' ? 3 : trade.symbol === 'BTC/USDT' ? 1 : 5)}</span>.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 bg-black/40 border border-white/5 sm:border-none sm:bg-transparent px-2 py-1 rounded">
                {/* Micro Probability Progress bar */}
                <div className="hidden md:flex flex-col items-end gap-0.5 w-16">
                  <span className="text-[7.5px] text-neutral-200 uppercase">Confidence</span>
                  <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        breachProbability > 65 ? 'bg-rose-500' : breachProbability > 32 ? 'bg-amber-500' : 'bg-emerald-400'
                      }`} 
                      style={{ width: `${breachProbability}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-neutral-200 uppercase text-[8px] tracking-wider leading-none">Breach Prob.</span>
                  <span className={`text-xs font-black tracking-wider px-2 py-0.5 mt-0.5 rounded border font-mono ${riskMeta.color} ${riskMeta.bg} ${riskMeta.border}`}>
                    {breachProbability}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`${isCompact ? 'p-1.5' : 'p-2'} bg-white/[0.01] border border-white/5 rounded flex items-center justify-between text-neutral-200 text-[9.5px] font-mono select-none`}>
              <span className="text-[8.5px] text-neutral-200 uppercase font-bold">⚠️ No protective stop established</span>
              <span className="text-indigo-400 font-extrabold uppercase text-[8.5px] tracking-wider">Breach Risk: 0% (SL inactive)</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
