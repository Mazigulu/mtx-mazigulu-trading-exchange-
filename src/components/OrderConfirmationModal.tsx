import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight, 
  X, 
  RefreshCw, 
  Building2, 
  DollarSign, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Sliders
} from 'lucide-react';

export interface OrderDetails {
  symbol: string;
  name?: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  limitPrice?: number;
  dollarAmount?: number;
  sharesOrUnits?: number;
  unitLabel?: string; // 'shares', 'Lots', etc.
  executionPrice: number;
  useBracketProtection?: boolean;
  stopLossPrice?: number;
  stopLossPct?: number;
  takeProfitPrice?: number;
  takeProfitPct?: number;
  currentBalance?: number;
  postBalance?: number;
  reason?: string;
  confluences?: string[];
}

export interface OrderConfirmationModalProps {
  isOpen: boolean;
  orderDetails: OrderDetails | null;
  isRouting?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function OrderConfirmationModal({
  isOpen,
  orderDetails,
  isRouting = false,
  onConfirm,
  onClose
}: OrderConfirmationModalProps) {
  if (!isOpen || !orderDetails) return null;

  const isBuy = orderDetails.side === 'BUY';
  const symbol = orderDetails.symbol.toUpperCase();
  const name = orderDetails.name || symbol;
  const unitLabel = orderDetails.unitLabel || 'shares';
  const executionPrice = orderDetails.executionPrice || 0;
  
  const dollarVal = orderDetails.dollarAmount !== undefined 
    ? orderDetails.dollarAmount 
    : (orderDetails.sharesOrUnits || 0) * executionPrice;

  const qty = orderDetails.sharesOrUnits !== undefined 
    ? orderDetails.sharesOrUnits 
    : (executionPrice > 0 ? dollarVal / executionPrice : 0);

  const currentBal = orderDetails.currentBalance;
  const postBal = orderDetails.postBalance !== undefined
    ? orderDetails.postBalance
    : (currentBal !== undefined ? (isBuy ? currentBal - dollarVal : currentBal + dollarVal) : undefined);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isRouting ? onClose : undefined}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#09090d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 font-mono text-white"
          >
            <div className="p-5 sm:p-6 space-y-5">
              {/* Asset & Order Badge Banner */}
              <div className="p-3.5 bg-[#040406] border border-white/5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white">{symbol}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-semibold">
                      {orderDetails.orderType === 'LIMIT' ? `LIMIT @ $${(orderDetails.limitPrice || executionPrice).toFixed(2)}` : 'MARKET (FILL NOW)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-0.5 truncate max-w-[220px] sm:max-w-xs">{name}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-lg border font-black text-xs uppercase flex items-center gap-1.5 ${
                    isBuy 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                  }`}>
                    {isBuy ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{isBuy ? 'BUY ORDER' : 'SELL ORDER'}</span>
                  </div>

                  <button
                    type="button"
                    disabled={isRouting}
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/5 border border-white/5 rounded-lg text-white/40 hover:text-white transition-all cursor-pointer disabled:opacity-30"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Core Order Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-[#040406] border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] text-white/40 uppercase block font-semibold">Total Order Value</span>
                  <span className="text-sm font-black text-white">
                    ${dollarVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3 bg-[#040406] border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] text-white/40 uppercase block font-semibold">Execution Price</span>
                  <span className="text-sm font-black text-indigo-300">
                    ${executionPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </span>
                </div>

                <div className="p-3 bg-[#040406] border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] text-white/40 uppercase block font-semibold">Estimated Volume</span>
                  <span className="text-xs font-bold text-white">
                    {qty < 1 ? qty.toFixed(6) : qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {unitLabel}
                  </span>
                </div>

                <div className="p-3 bg-[#040406] border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] text-white/40 uppercase block font-semibold">Routing Fee</span>
                  <span className="text-xs font-bold text-emerald-400">
                    $0.00 <span className="text-[8px] text-white/30">(PRIME ZERO)</span>
                  </span>
                </div>
              </div>

              {/* Bracket Protection SL/TP if applicable */}
              {orderDetails.useBracketProtection && (orderDetails.stopLossPrice || orderDetails.takeProfitPrice || orderDetails.stopLossPct) ? (
                <div className="p-3 bg-[#040406] border border-white/5 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/50 uppercase font-bold">
                    <Sliders className="w-3 h-3 text-sky-400" />
                    <span>Bracket Risk Protection</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex justify-between items-center bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg text-rose-300">
                      <span className="text-[9px] text-rose-400/80 font-bold uppercase">Stop Loss</span>
                      <span className="font-bold font-mono">
                        {orderDetails.stopLossPrice ? `$${orderDetails.stopLossPrice.toFixed(2)}` : `${orderDetails.stopLossPct}%`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-emerald-300">
                      <span className="text-[9px] text-emerald-400/80 font-bold uppercase">Take Profit</span>
                      <span className="font-bold font-mono">
                        {orderDetails.takeProfitPrice ? `$${orderDetails.takeProfitPrice.toFixed(2)}` : `${orderDetails.takeProfitPct}%`}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Capital & Settlement Preview */}
              {currentBal !== undefined && (
                <div className="p-3 bg-[#040406] border border-white/5 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-white/40 text-[10px] uppercase">
                    <span>Account Balance Before</span>
                    <span className="text-white/80 font-mono">${currentBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-white/60">Estimated Post-Trade Balance</span>
                    <span className={postBal !== undefined && postBal < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      ${postBal !== undefined ? postBal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </span>
                  </div>
                </div>
              )}

              {/* Institutional Notice */}
              <div className="flex items-start gap-2.5 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] text-indigo-300">
                <Building2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Confirming this order dispatches it to the MTX Liquidity Pool. Market orders execute immediately upon verification.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isRouting}
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-40"
                >
                  Cancel / Edit
                </button>

                <button
                  type="button"
                  disabled={isRouting}
                  onClick={onConfirm}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isBuy
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
                  } disabled:opacity-50`}
                >
                  {isRouting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Routing Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Route</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
