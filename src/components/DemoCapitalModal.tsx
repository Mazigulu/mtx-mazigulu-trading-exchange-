import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  Briefcase, 
  Zap, 
  ArrowRight, 
  Check, 
  Layers, 
  RefreshCw, 
  Sliders, 
  Lock, 
  Globe, 
  X,
  CreditCard,
  Building2,
  Cpu
} from 'lucide-react';
import { playNotificationSound } from '../utils/audioNotifier';

interface DemoCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAmount: (amount: number) => void;
  currentAmount?: number;
  currentCash?: number;
  isRefill?: boolean;
}

interface TierOption {
  amount: number;
  label: string;
  badge: string;
  highlight?: boolean;
  description: string;
  features: string[];
  recommendedRole: string;
  icon: typeof Zap;
  color: string;
}

const TIERS: TierOption[] = [
  {
    amount: 50000,
    label: '$50,000 USD',
    badge: 'TACTICAL STARTER',
    description: 'Optimal for intraday scalping, algorithmic strategy testing, and focused single-portfolio momentum setups.',
    features: [
      'Core US Equities & Tech CFD trading',
      'Fractional shares & bracket order risk engine',
      '1 to 2 custom dedicated portfolios',
      'Live institutional orderbook feed'
    ],
    recommendedRole: 'Swing Traders & Quant Backtesters',
    icon: Zap,
    color: 'border-blue-500/40 hover:border-blue-500 bg-blue-950/10'
  },
  {
    amount: 100000,
    label: '$100,000 USD',
    badge: 'POPULAR CHOICE',
    highlight: true,
    description: 'The standard institutional benchmark. Balanced across multiple asset classes, sector diversification, and multi-portfolio management.',
    features: [
      'Multi-portfolio cross-asset allocation',
      'Global Equities, ETFs, FX & Digital Assets',
      'Advanced factor weights & screener engine',
      'Unlimited custom portfolio creation & rebalancing'
    ],
    recommendedRole: 'Professional & Wealth Allocators',
    icon: Sparkles,
    color: 'border-indigo-500/60 hover:border-indigo-400 bg-indigo-950/20'
  },
  {
    amount: 200000,
    label: '$200,000 USD',
    badge: 'MASTER HEDGE FUND',
    description: 'Designed for advanced multi-manager portfolios, quantitative pairs trading, macro hedging, and institutional stress tests.',
    features: [
      'Deep liquidity multi-portfolio clusters',
      'High-notional position sizing & margin simulations',
      'Unlimited wealth projection models',
      'Direct orderbook liquidity sweep engine'
    ],
    recommendedRole: 'Family Offices & Macro Prop Desks',
    icon: Building2,
    color: 'border-amber-500/40 hover:border-amber-400 bg-amber-950/10'
  }
];

export default function DemoCapitalModal({
  isOpen,
  onClose,
  onSelectAmount,
  currentAmount = 100000,
  isRefill = false
}: DemoCapitalModalProps) {
  const [selectedTier, setSelectedTier] = useState<number>(() => {
    if (currentAmount === 50000 || currentAmount === 100000 || currentAmount === 200000) {
      return currentAmount;
    }
    return 100000;
  });
  const [customMode, setCustomMode] = useState<boolean>(false);
  const [customValue, setCustomValue] = useState<string>(currentAmount.toString());

  if (!isOpen) return null;

  const handleConfirm = () => {
    let finalAmount = selectedTier;
    if (customMode) {
      const parsed = parseFloat(customValue.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed) && parsed >= 5000 && parsed <= 5000000) {
        finalAmount = parsed;
      } else {
        finalAmount = 100000;
      }
    }
    
    playNotificationSound('quantum_ping');
    onSelectAmount(finalAmount);
    
    window.dispatchEvent(new CustomEvent('mtx_system_notification', {
      detail: {
        category: 'TRADES',
        severity: 'SUCCESS',
        title: isRefill ? `Sandbox Refilled: $${finalAmount.toLocaleString()}` : `Sandbox Initialized: $${finalAmount.toLocaleString()}`,
        message: `Allocated $${finalAmount.toLocaleString()} in virtual trading capital to your demo sandbox. Ready for live order routing.`,
        actionTab: 'MARKETS',
        actionLabel: 'Open Markets',
        metadata: {
          amount: finalAmount,
          tag: 'DEMO CAPITAL'
        }
      }
    }));

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-[#09090d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Top Header Accent */}
          <div className="h-1 w-full bg-indigo-600" />

          {/* Close Button (if user is just refilling / closing) */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header Section */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10.5px] font-mono font-bold uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5" />
                <span>{isRefill ? 'Refill & Reallocate Sandbox' : 'Interactive Demo Account Setup'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-sans">
                {isRefill ? 'Provision New Demo Capital' : 'Choose Your Demo Trading Capital'}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
                Select your starting sandbox allocation. This capital will be instantly furnished to your demo account to create custom portfolios, simulate live executions, and test risk models.
              </p>
            </div>

            {/* Tier Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {TIERS.map((tier) => {
                const Icon = tier.icon;
                const isSelected = !customMode && selectedTier === tier.amount;
                return (
                  <div
                    key={tier.amount}
                    onClick={() => {
                      setSelectedTier(tier.amount);
                      setCustomMode(false);
                    }}
                    className={`relative rounded-xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950/50 scale-[1.02]' 
                        : `${tier.color} border-white/10 hover:border-white/20 bg-white/[0.02]`
                    }`}
                  >
                    {tier.highlight && (
                      <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-indigo-600 border border-indigo-400/40 text-white text-[9px] font-mono font-black uppercase tracking-wider shadow-sm">
                        {tier.badge}
                      </div>
                    )}
                    {!tier.highlight && (
                      <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        {tier.badge}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                          {tier.label}
                        </div>
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white/5 text-neutral-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>

                      <p className="text-[11px] text-neutral-300 font-sans leading-relaxed min-h-[44px]">
                        {tier.description}
                      </p>

                      <div className="pt-2 border-t border-white/10 space-y-1.5">
                        {tier.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[10px] text-neutral-300">
                            <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-neutral-500'}`} />
                            <span className="leading-tight">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-neutral-400 uppercase">
                        {tier.recommendedRole}
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-neutral-600'}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Amount Option Toggle */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase font-mono">Custom Demo Amount</div>
                  <div className="text-[11px] text-neutral-400">Specify any custom sandbox capital balance ($5,000 – $5,000,000)</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {customMode ? (
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-neutral-400">$</span>
                    <input
                      type="number"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      placeholder="100000"
                      min={5000}
                      max={5000000}
                      className="w-36 bg-black border border-indigo-500/80 rounded-lg px-3 py-1.5 pl-6 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMode(true);
                      setCustomValue(selectedTier.toString());
                    }}
                    className="px-3 py-1.5 rounded-lg border border-white/20 text-xs font-mono font-bold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Enter Custom Value
                  </button>
                )}
                {customMode && (
                  <button
                    type="button"
                    onClick={() => setCustomMode(false)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-neutral-400 hover:text-white hover:bg-white/5"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Real Account Notice / Dual Mode Explanation */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3 text-xs text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-emerald-300 uppercase tracking-wide font-mono text-[11px]">
                  Seamless Switch Between Demo and Real Production Account
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Your <span className="text-white font-bold">Demo Account</span> allows you to create portfolios, execute live market tests, and simulate strategies with furnished capital. You can switch to your <span className="text-emerald-400 font-bold">Real Account</span> anytime from the top bar—which starts at $0.00 and is funded securely via credit card, wire transfer, or stablecoins.
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-neutral-500 font-mono">
                No real funds or credit card required for Demo Sandbox.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold font-mono uppercase text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-md shadow-indigo-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  <span>
                    {isRefill ? 'Refill Demo Balance' : 'Furnish Demo Account'} (
                    {customMode
                      ? `$${parseFloat(customValue || '0').toLocaleString()} USD`
                      : `$${selectedTier.toLocaleString()} USD`}
                    )
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
