import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Sparkles, 
  PieChart, 
  X, 
  Check, 
  ArrowRight, 
  Plus, 
  Layers, 
  ShieldCheck, 
  TrendingUp,
  Coins,
  DollarSign
} from 'lucide-react';
import { PortfolioGroup, PortfolioHoldingItem } from '../types';

interface CreatePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCash: number;
  onCreatePortfolio: (portfolio: PortfolioGroup) => void;
}

const TEMPLATES: {
  title: string;
  tag: 'GROWTH' | 'VALUE' | 'DIVIDEND' | 'CRYPTO' | 'MOMENTUM' | 'CUSTOM' | 'HEDGE';
  color: string;
  description: string;
  targetApy: number;
  allocPct: number;
  holdings: { symbol: string; name: string; isin: string; defaultPrice: number; weight: number }[];
}[] = [
  {
    title: 'Alpha Tech & AI Momentum',
    tag: 'GROWTH',
    color: '#6366f1',
    description: 'High-conviction exposure to accelerated computing, cloud hyperscalers, and AI infrastructure leaders.',
    targetApy: 24.5,
    allocPct: 35,
    holdings: [
      { symbol: 'NVDA', name: 'NVIDIA Corp.', isin: 'US67066G1040', defaultPrice: 125.40, weight: 45 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', isin: 'US5949181045', defaultPrice: 421.90, weight: 30 },
      { symbol: 'AAPL', name: 'Apple Inc.', isin: 'US0378331005', defaultPrice: 182.30, weight: 25 }
    ]
  },
  {
    title: 'Blue Chip Dividend Fortress',
    tag: 'DIVIDEND',
    color: '#10b981',
    description: 'Defensive cash-flow generation focusing on steady compounders, high free-cash-flow yields, and broad market indexing.',
    targetApy: 12.8,
    allocPct: 25,
    holdings: [
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF', isin: 'US78462F1030', defaultPrice: 510.00, weight: 60 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', isin: 'US5949181045', defaultPrice: 421.90, weight: 40 }
    ]
  },
  {
    title: 'Institutional Crypto & DeFi',
    tag: 'CRYPTO',
    color: '#f59e0b',
    description: 'Tactical digital asset allocation capturing layer-1 dominance, liquidity expansions, and institutional ETF inflows.',
    targetApy: 38.0,
    allocPct: 20,
    holdings: [
      { symbol: 'BTC-USD', name: 'Bitcoin (BTC)', isin: 'US09061G1013', defaultPrice: 67250.00, weight: 60 },
      { symbol: 'ETH-USD', name: 'Ethereum (ETH)', isin: 'US29760G1035', defaultPrice: 3450.00, weight: 25 },
      { symbol: 'SOL-USD', name: 'Solana (SOL)', isin: 'US83410G1025', defaultPrice: 145.00, weight: 15 }
    ]
  },
  {
    title: 'Global Macro Systematic Hedge',
    tag: 'HEDGE',
    color: '#ec4899',
    description: 'Asymmetric risk-mitigation portfolio designed to preserve capital across market regimes and rate volatility.',
    targetApy: 16.2,
    allocPct: 20,
    holdings: [
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', isin: 'US46090E1038', defaultPrice: 440.00, weight: 50 },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF', isin: 'US78462F1030', defaultPrice: 510.00, weight: 50 }
    ]
  }
];

export default function CreatePortfolioModal({
  isOpen,
  onClose,
  availableCash,
  onCreatePortfolio
}: CreatePortfolioModalProps) {
  const [name, setName] = useState<string>('Tactical Growth Alpha');
  const [description, setDescription] = useState<string>('Custom high-performance asset allocation portfolio.');
  const [tag, setTag] = useState<'GROWTH' | 'VALUE' | 'DIVIDEND' | 'CRYPTO' | 'MOMENTUM' | 'CUSTOM' | 'HEDGE'>('GROWTH');
  const [allocatedCash, setAllocatedCash] = useState<number>(() => Math.min(25000, Math.max(5000, Math.round(availableCash * 0.3))));
  const [targetApy, setTargetApy] = useState<number>(18.5);
  const [color, setColor] = useState<string>('#6366f1');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const handleApplyTemplate = (idx: number) => {
    setSelectedTemplateIndex(idx);
    const tmpl = TEMPLATES[idx];
    setName(tmpl.title);
    setDescription(tmpl.description);
    setTag(tmpl.tag);
    setColor(tmpl.color);
    setTargetApy(tmpl.targetApy);
    const calcAmount = Math.max(2000, Math.round((availableCash * tmpl.allocPct) / 100));
    setAllocatedCash(calcAmount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let initialHoldings: PortfolioHoldingItem[] = [];
    if (selectedTemplateIndex !== null) {
      const tmpl = TEMPLATES[selectedTemplateIndex];
      initialHoldings = tmpl.holdings.map(h => {
        const dollarForAsset = (allocatedCash * (h.weight / 100));
        const qty = parseFloat((dollarForAsset / h.defaultPrice).toFixed(4));
        return {
          symbol: h.symbol,
          name: h.name,
          isin: h.isin,
          qty,
          avgCost: h.defaultPrice,
          currentPrice: h.defaultPrice
        };
      });
    }

    const newPortfolio: PortfolioGroup = {
      id: `port-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || 'Untitled Portfolio',
      description: description.trim() || 'Autonomous trading portfolio',
      tag,
      color,
      allocatedCash,
      holdings: initialHoldings,
      createdAt: new Date().toISOString(),
      targetApy
    };

    onCreatePortfolio(newPortfolio);
    onClose();
  };

  const tagColors: Record<string, string> = {
    GROWTH: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    VALUE: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    DIVIDEND: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    CRYPTO: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    MOMENTUM: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    HEDGE: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    CUSTOM: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#0a0a0d] border border-white/15 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Top Accent Bar */}
          <div 
            className="h-1.5 w-full transition-colors duration-300"
            style={{ background: color }}
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="p-6 pb-4 border-b border-white/10 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Multi-Portfolio Architecture</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans">
              Create New Portfolio
            </h2>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">
              Furnish and isolate capital into a dedicated portfolio strategy to manage assets, rebalance weights, and monitor standalone yield.
            </p>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-left">
            
            {/* Quick Templates */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300 mb-2 flex items-center justify-between">
                <span>Select Strategy Template (or Customize)</span>
                <span className="text-indigo-400 text-[9px]">1-Click Presets</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TEMPLATES.map((tmpl, idx) => {
                  const isSelected = selectedTemplateIndex === idx;
                  return (
                    <button
                      key={tmpl.title}
                      type="button"
                      onClick={() => handleApplyTemplate(idx)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-white/[0.06] border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${tagColors[tmpl.tag]}`}>
                          {tmpl.tag}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400">
                          {tmpl.targetApy}% Target APY
                        </span>
                      </div>
                      <div className="font-mono text-xs font-bold text-white mb-1">
                        {tmpl.title}
                      </div>
                      <div className="text-[10px] text-neutral-400 line-clamp-2">
                        {tmpl.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Portfolio Name & Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Portfolio Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSelectedTemplateIndex(null);
                  }}
                  required
                  placeholder="e.g. Alpha Momentum Fund"
                  className="w-full bg-black border border-white/15 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Strategy Tag
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value as any)}
                  className="w-full bg-black border border-white/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="GROWTH">GROWTH</option>
                  <option value="VALUE">VALUE</option>
                  <option value="DIVIDEND">DIVIDEND</option>
                  <option value="CRYPTO">CRYPTO</option>
                  <option value="MOMENTUM">MOMENTUM</option>
                  <option value="HEDGE">HEDGE</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>
            </div>

            {/* Capital Allocation Slider & Input */}
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300">
                    Allocated Demo Capital
                  </label>
                  <span className="text-[9.5px] font-mono text-neutral-400">
                    Available Demo Pool: ${availableCash.toLocaleString()} USD
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black font-mono text-indigo-400">
                    ${allocatedCash.toLocaleString()} USD
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={1000}
                max={Math.max(10000, availableCash)}
                step={500}
                value={allocatedCash}
                onChange={(e) => setAllocatedCash(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>$1,000 (Min)</span>
                <span>${(availableCash / 2).toLocaleString()} (50%)</span>
                <span>${availableCash.toLocaleString()} (Max)</span>
              </div>
            </div>

            {/* Target APY & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Portfolio Objective / Notes
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Strategy goals and rebalancing thesis"
                  className="w-full bg-black border border-white/15 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Target APY (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="100"
                  value={targetApy}
                  onChange={(e) => setTargetApy(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-white/15 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Isolated risk & portfolio-level margin accounting</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold font-mono uppercase text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black font-mono uppercase tracking-wider shadow-lg shadow-indigo-950/60 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Portfolio</span>
                </button>
              </div>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
