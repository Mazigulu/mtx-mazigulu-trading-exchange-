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
}

export const TradePositionRowItem: React.FC<TradePositionRowItemProps> = ({
  trade,
  isExpanded,
  onToggleExpand,
  onQuickClose,
  formatOpenDuration,
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
        className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] select-none"
      >
        <div className="flex items-center space-x-2 md:space-x-3">
          <span className="text-white/30 hover:text-white transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
          <span className={`px-2 py-0.5 rounded text-[9.5px] font-black font-mono ${trade.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {trade.side}
          </span>
          <div>
            <span className="text-xs font-bold font-mono text-white block">{trade.symbol}</span>
            <span className="text-[9.5px] text-white/30 font-mono">Lot size: {trade.size}</span>
          </div>
        </div>

        {/* Minimalist Sparkline Chart */}
        {trade.pnlTrajectory && trade.pnlTrajectory.length > 0 ? (
          <div className="hidden sm:block w-20 md:w-28 h-7 grow-0 shrink-0 self-center opacity-80 hover:opacity-100 transition-opacity pr-2" title={`${trade.symbol} PnL trajectory (Last 60m)`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trade.pnlTrajectory} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke={trade.pnl >= 0 ? '#10b981' : '#f43f5e'}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="hidden sm:block w-20 md:w-28 h-7 shrink-0" />
        )}

        <div className="flex items-center space-x-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="text-right">
            <span className={`text-xs font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
            </span>
            <span className="text-[8.5px] text-white/20 block font-mono">PnL</span>
          </div>
          <button
            onClick={() => onQuickClose(trade.id)}
            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-white border border-rose-500/25 hover:border-rose-500/60 rounded text-[9px] font-mono font-bold uppercase transition-all tracking-wider cursor-pointer flex items-center space-x-1"
          >
            <X className="w-3 h-3" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Expanded position details wrapper */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1.5 border-t border-white/5 bg-white/[0.01] grid grid-cols-3 gap-2 text-[10px] font-mono text-white/50 animate-fadeIn">
          <div className="bg-black/30 p-2 rounded border border-white/5">
            <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Entry Price</span>
            <span className="text-white font-bold">{trade.entryPrice.toFixed(trade.symbol === 'USD/JPY' ? 3 : trade.symbol === 'BTC/USDT' ? 1 : 5)}</span>
          </div>
          <div className="bg-black/30 p-2 rounded border border-white/5">
            <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Open Duration</span>
            <span className="text-white font-bold">{formatOpenDuration(trade.timestamp)}</span>
          </div>
          <div className="bg-black/30 p-2 rounded border border-white/5">
            <span className="text-[8px] text-white/35 block uppercase tracking-wider mb-0.5">Margin Usage</span>
            <span className="text-indigo-400 font-extrabold">${((trade.symbol === 'BTC/USDT' ? trade.size * trade.entryPrice : trade.size * 100000) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
