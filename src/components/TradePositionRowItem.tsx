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
}

export const TradePositionRowItem: React.FC<TradePositionRowItemProps> = ({
  trade,
  isExpanded,
  onToggleExpand,
  onQuickClose,
  formatOpenDuration,
  isCompact = false,
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

  // States for tracking ICT Liquidity Hunt Estimation
  const [huntCountdown, setHuntCountdown] = useState<number>(0);
  const [huntType, setHuntType] = useState<string>('BSL Shift');
  const [huntTargetPrice, setHuntTargetPrice] = useState<number>(0);
  const [huntICTConcept, setHuntICTConcept] = useState<string>('');

  useEffect(() => {
    // Seed helper to make it deterministic but distinct per trade
    const hash = String(trade.id).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const initialDuration = 180 + (hash % 240); // 3 to 7 minutes
    setHuntCountdown(initialDuration);

    const isBuy = trade.side === 'BUY';
    const targetType = isBuy ? 'BSL (Buy-Side Liquidity)' : 'SSL (Sell-Side Liquidity)';
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

    // ICT displacement / market state terms
    const concepts = [
      'MSS (Market Structure Shift) confirmed on M1; rapid displacement expansion',
      'Silver Bullet Session volume spike; driving towards swing liquidity',
      'Fair Value Gap (FVG) rebalancing vector following high-displacement impulse',
      'OTE (Optimal Trade Entry) response triggering ICT breaker mitigation',
      'Equal Highs (EQH) retail stop pool sweep acceleration',
      'Equal Lows (EQL) sell-stop harvest acceleration under support',
      'London session Judas Swing displacement targeting range extremity'
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
          <span className="text-white/30 hover:text-white transition-colors">
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
              <span className={`${isCompact ? 'text-[6.5px] px-0.5 py-[0.5px]' : 'text-[7.5px] px-1 py-[1.5px]'} font-mono font-bold uppercase tracking-wider text-white/35 bg-white/[0.03] rounded border border-white/5`} title={statusTooltip}>
                {statusText}
              </span>

              {/* Liquidity Hunt Badge & Tooltip */}
              <div 
                className={`flex items-center gap-1 font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 rounded border border-amber-500/20 cursor-help transition-all duration-300 select-none shrink-0 ${isCompact ? 'text-[6.5px] px-0.5 py-[0.5px]' : 'text-[7.5px] px-1 py-[1.5px]'}`}
                title={`[ICT Displacement Forecast] Next liquidity hunt (${huntType}) target: ${huntTargetPrice.toFixed(trade.symbol === 'USD/JPY' ? 3 : trade.symbol === 'BTC/USDT' ? 1 : trade.symbol === 'ETH/USDT' ? 2 : trade.symbol === 'SOL/USDT' ? 2 : trade.symbol === 'GOLD/USD' ? 2 : 5)}. Catalyst: ${huntICTConcept}`}
              >
                <span className="relative flex h-1 w-1 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-amber-500"></span>
                </span>
                <span className="text-amber-400/70">Hunt:</span>
                <span className="font-extrabold animate-pulse">{Math.floor(huntCountdown / 60)}m {String(huntCountdown % 60).padStart(2, '0')}s</span>
              </div>
            </div>
            <span className={`${isCompact ? 'text-[8.5px]' : 'text-[9.5px]'} text-white/30 font-mono`}>Lot size: {trade.size}</span>
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
            {!isCompact && <span className="text-[8.5px] text-white/20 block font-mono">PnL</span>}
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
        <div className={`${isCompact ? 'px-2 pb-2 pt-1 gap-1.5 text-[9px]' : 'px-3 pb-3 pt-1.5 gap-2 text-[10px]'} border-t border-white/5 bg-white/[0.01] flex flex-col font-mono text-white/50 animate-fadeIn animate-duration-300`}>
          <div className={`${isCompact ? 'grid grid-cols-2 sm:grid-cols-4 gap-1' : 'grid grid-cols-2 sm:grid-cols-4 gap-2'}`}>
            <div className={`bg-black/30 rounded border border-white/5 ${isCompact ? 'p-1' : 'p-2'}`}>
              <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Entry Price</span>
              <span className="text-white font-bold">{trade.entryPrice.toFixed(trade.symbol === 'USD/JPY' ? 3 : trade.symbol === 'BTC/USDT' ? 1 : 5)}</span>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 ${isCompact ? 'p-1' : 'p-2'}`}>
              <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Entry Time</span>
              <span className="text-white font-bold">
                {new Date(trade.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 ${isCompact ? 'p-1' : 'p-2'}`}>
              <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Open Duration</span>
              <span className="text-white font-bold">{formatOpenDuration(trade.timestamp)}</span>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 flex flex-col justify-between ${isCompact ? 'p-1' : 'p-2'}`} title="Time elapsed since the last real-time high-fidelity streaming price/PnL update.">
              <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Last Refresh Delta</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-emerald-400 font-bold leading-none">
                  {secondsAgo === 0 ? 'Just now' : `${secondsAgo}s ago`}
                </span>
              </div>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 ${isCompact ? 'p-1' : 'p-2'}`}>
              <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Potential PnL at Target</span>
              <span className="text-emerald-400 font-extrabold block">
                +${pnlAtTP.toFixed(2)}
              </span>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 ${isCompact ? 'p-1' : 'p-2'}`}>
              <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Margin Usage</span>
              <span className="text-indigo-400 font-extrabold">${((trade.symbol === 'BTC/USDT' ? trade.size * trade.entryPrice : trade.size * 100000) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className={`bg-black/30 rounded border border-white/5 flex flex-col justify-between ${isCompact ? 'p-1' : 'p-2'}`} title="Theoretical order book pressure on global liquidity pool based on standard level-2 asset depth.">
              <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Market Impact Score</span>
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
              <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Est. Slippage Impact</span>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="text-indigo-300 font-extrabold leading-none">
                  {computedImpactBps.toFixed(2)} bps
                </span>
                <span className="text-[7.5px] text-white/40 font-normal leading-tight text-right line-clamp-1 block">
                  {bookPressureStr}
                </span>
              </div>
            </div>
          </div>

          {/* Premium ICT Liquidity Hunt Sub-section details */}
          <div className={`${isCompact ? 'p-1.5 gap-1.5' : 'p-2 gap-2'} bg-gradient-to-r from-amber-500/[0.03] to-amber-600/[0.01] border border-amber-500/10 hover:border-amber-500/20 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between transition-colors select-none`}>
            <div className="flex items-start gap-1.5">
              <span className="relative flex h-1.5 w-1.5 mt-1 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              <div>
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[8px] block">
                  ICT Liquidity Displacement Hunt Forecast
                </span>
                <p className={`${isCompact ? 'text-[9.2px]' : 'text-[9.5px]'} text-white/60 font-medium leading-relaxed mt-0.5`}>
                  {huntICTConcept}. Target area expected at <span className="text-amber-400/90 font-mono font-bold">{huntType}</span> near <span className="text-white font-mono font-bold bg-white/5 px-1 py-0.5 rounded border border-white/5">{huntTargetPrice.toFixed(trade.symbol === 'USD/JPY' ? 3 : trade.symbol === 'BTC/USDT' ? 1 : trade.symbol === 'ETH/USDT' ? 2 : trade.symbol === 'SOL/USDT' ? 2 : trade.symbol === 'GOLD/USD' ? 2 : 5)}</span>.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 bg-black/40 border border-white/5 sm:border-none sm:bg-transparent px-2 py-1 rounded">
              <span className="text-white/35 uppercase text-[8px] tracking-wider leading-none">Sweep Countdown</span>
              <span className="text-amber-400 text-xs font-black tracking-widest bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded animate-pulse">
                {Math.floor(huntCountdown / 60)}m {String(huntCountdown % 60).padStart(2, '0')}s
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
