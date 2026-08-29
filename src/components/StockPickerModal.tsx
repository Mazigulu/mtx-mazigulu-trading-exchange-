import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Layers, 
  Coins, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playNotificationSound } from '../utils/audioNotifier';

export interface AvailableAsset {
  symbol: string;
  name: string;
  isin: string;
  category: 'tech' | 'etf' | 'crypto' | 'bluechip';
  defaultPrice: number;
  dailyChange: number;
  description: string;
}

export const CATALOG_ASSETS: AvailableAsset[] = [
  // Mega Tech
  { symbol: 'NVDA', name: 'NVIDIA Corporation', isin: 'US67066G1040', category: 'tech', defaultPrice: 125.40, dailyChange: 3.40, description: 'AI accelerator GPUs & CUDA enterprise computing platform.' },
  { symbol: 'AAPL', name: 'Apple Inc.', isin: 'US0378331005', category: 'tech', defaultPrice: 182.30, dailyChange: 2.10, description: 'Consumer silicon, services ecosystem & spatial computing.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', isin: 'US5949181045', category: 'tech', defaultPrice: 421.90, dailyChange: 1.80, description: 'Enterprise cloud infrastructure, Azure AI, and Office 365.' },
  { symbol: 'TSLA', name: 'Tesla Inc.', isin: 'US88160R1014', category: 'tech', defaultPrice: 178.60, dailyChange: -1.20, description: 'EV mobility, humanoid robotics, and autonomous energy systems.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', isin: 'US0231351067', category: 'tech', defaultPrice: 186.50, dailyChange: 1.45, description: 'Global e-commerce marketplace & AWS hyperscaler services.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', isin: 'US02079K3059', category: 'tech', defaultPrice: 175.20, dailyChange: 0.90, description: 'Google search, Gemini multimodal models, and Cloud TPU clusters.' },
  { symbol: 'META', name: 'Meta Platforms Inc.', isin: 'US30303M1027', category: 'tech', defaultPrice: 502.80, dailyChange: 2.65, description: 'Llama open AI models, social network ads, and Reality Labs.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', isin: 'US0079031078', category: 'tech', defaultPrice: 158.40, dailyChange: 2.80, description: 'x86 microprocessors, Instinct AI GPUs, and FPGA computing.' },
  { symbol: 'PLTR', name: 'Palantir Technologies', isin: 'US69608A1088', category: 'tech', defaultPrice: 28.50, dailyChange: 4.15, description: 'AIP institutional ontology & defense intelligence software.' },
  
  // ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', isin: 'US78462F1030', category: 'etf', defaultPrice: 510.00, dailyChange: 0.85, description: 'Benchmark exposure to the 500 leading US publicly traded corporations.' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', isin: 'US46090E1038', category: 'etf', defaultPrice: 440.00, dailyChange: 1.55, description: 'Top 100 non-financial tech-forward Nasdaq companies.' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', isin: 'US9229083632', category: 'etf', defaultPrice: 468.20, dailyChange: 0.82, description: 'Ultra low-cost foundational US large cap index fund.' },
  { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average', isin: 'US78467X1090', category: 'etf', defaultPrice: 392.40, dailyChange: 0.45, description: 'Price-weighted index of 30 blue-chip American industry giants.' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', isin: 'US4642876555', category: 'etf', defaultPrice: 202.10, dailyChange: 1.10, description: 'Broad diversification across US small-cap growth & value equities.' },

  // Crypto
  { symbol: 'BTC-USD', name: 'Bitcoin (BTC)', isin: 'US09061G1013', category: 'crypto', defaultPrice: 67250.00, dailyChange: 2.40, description: 'Decentralized digital store of value & algorithmic scarce asset.' },
  { symbol: 'ETH-USD', name: 'Ethereum (ETH)', isin: 'US29760G1035', category: 'crypto', defaultPrice: 3450.00, dailyChange: 1.50, description: 'Programmable smart contract network and decentralized finance layer.' },
  { symbol: 'SOL-USD', name: 'Solana (SOL)', isin: 'US83410G1025', category: 'crypto', defaultPrice: 145.00, dailyChange: 4.20, description: 'High-throughput parallelized blockchain with sub-second finality.' },
  
  // Blue Chips
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', isin: 'US46625H1005', category: 'bluechip', defaultPrice: 198.50, dailyChange: 0.70, description: 'Global institutional investment banking and balance sheet liquidity.' },
  { symbol: 'V', name: 'Visa Inc.', isin: 'US92826C8394', category: 'bluechip', defaultPrice: 275.60, dailyChange: 0.50, description: 'Worldwide digital retail transaction processing network.' },
  { symbol: 'UNH', name: 'UnitedHealth Group', isin: 'US91324P1021', category: 'bluechip', defaultPrice: 488.00, dailyChange: -0.30, description: 'Diversified healthcare coverage and Optum health tech services.' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', isin: 'US7427181091', category: 'bluechip', defaultPrice: 165.20, dailyChange: 0.25, description: 'Global consumer staples and defensive dividend cash flow.' }
];

interface StockPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCash: number;
  currentHoldings?: Record<string, number>;
  onAddStock: (symbol: string, name: string, isin: string, dollarAmount: number, price: number) => void;
}

export default function StockPickerModal({
  isOpen,
  onClose,
  availableCash,
  currentHoldings = {},
  onAddStock
}: StockPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tech' | 'etf' | 'crypto' | 'bluechip'>('all');
  const [selectedAsset, setSelectedAsset] = useState<AvailableAsset | null>(CATALOG_ASSETS[0]);
  const [investmentAmount, setInvestmentAmount] = useState<string>('5000');
  const [isSuccess, setIsSuccess] = useState(false);

  const filteredAssets = useMemo(() => {
    return CATALOG_ASSETS.filter(asset => {
      const matchesSearch = 
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const numericAmount = parseFloat(investmentAmount) || 0;
  const calculatedShares = selectedAsset && selectedAsset.defaultPrice > 0 ? (numericAmount / selectedAsset.defaultPrice) : 0;
  const remainingCash = Math.max(0, availableCash - numericAmount);
  const isValidAmount = numericAmount >= 10 && numericAmount <= availableCash;

  const handleExecutePurchase = () => {
    if (!selectedAsset || !isValidAmount) return;

    onAddStock(
      selectedAsset.symbol,
      selectedAsset.name,
      selectedAsset.isin,
      numericAmount,
      selectedAsset.defaultPrice
    );

    playNotificationSound('digital_bell');
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  const handleSelectPresetPercent = (pct: number) => {
    const calculated = (availableCash * (pct / 100)).toFixed(2);
    setInvestmentAmount(calculated);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-4xl bg-[#09090c] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>Pick Stocks & Build Portfolio</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  DEMO CAPITAL
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
                Select equities, index ETFs, or digital assets to allocate from your available demo cash balance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end font-mono">
              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">Available Demo Cash</span>
              <span className="text-xs font-black text-amber-400">
                ${availableCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Asset Catalog & Search (7 cols) */}
          <div className="lg:col-span-7 p-4 border-b lg:border-b-0 lg:border-r border-neutral-800/80 flex flex-col overflow-hidden space-y-3">
            
            {/* Search and Category Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ticker, company, or asset (e.g. AAPL, NVIDIA, SPY)..."
                  className="w-full bg-[#050505] border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-[10px]">
                {[
                  { id: 'all', label: 'All Assets' },
                  { id: 'tech', label: 'Tech Alpha' },
                  { id: 'etf', label: 'Index ETFs' },
                  { id: 'crypto', label: 'Digital Assets' },
                  { id: 'bluechip', label: 'Blue Chips' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-white hover:border-white/15'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset List Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[380px] scrollbar-thin">
              {filteredAssets.length === 0 ? (
                <div className="text-center py-10 font-mono text-neutral-500 text-xs">
                  No assets found matching "{searchQuery}"
                </div>
              ) : (
                filteredAssets.map(asset => {
                  const isSelected = selectedAsset?.symbol === asset.symbol;
                  const alreadyHoldingQty = currentHoldings[asset.symbol] || 0;

                  return (
                    <div
                      key={asset.symbol}
                      onClick={() => setSelectedAsset(asset)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-500/10 border-indigo-500/60 ring-1 ring-indigo-500/30'
                          : 'bg-[#050505] border-neutral-800/80 hover:border-neutral-700 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs ${
                          asset.category === 'crypto' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : asset.category === 'etf'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {asset.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-white text-xs">{asset.symbol}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-neutral-400 uppercase">
                              {asset.category}
                            </span>
                            {alreadyHoldingQty > 0 && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                Owned ({alreadyHoldingQty >= 1 ? alreadyHoldingQty.toLocaleString() : alreadyHoldingQty.toFixed(4)})
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-400 truncate max-w-[200px] block font-sans">
                            {asset.name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs font-black text-white">
                          ${asset.defaultPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${
                          asset.dailyChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {asset.dailyChange >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                          <span>{asset.dailyChange >= 0 ? '+' : ''}{asset.dailyChange.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Right Column: Order Configuration & Execution (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-black/40 flex flex-col justify-between space-y-4">
            
            {selectedAsset ? (
              <div className="space-y-4">
                
                {/* Selected Asset Header */}
                <div className="p-3.5 bg-[#050505] border border-neutral-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-black text-white">{selectedAsset.symbol}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase">
                          {selectedAsset.category}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400 font-sans block mt-0.5">
                        {selectedAsset.name}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs font-black text-indigo-300">
                        ${selectedAsset.defaultPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] text-neutral-500 block uppercase">Settlement</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-sans leading-relaxed border-t border-neutral-800/80 pt-2">
                    {selectedAsset.description}
                  </p>
                </div>

                {/* Investment Amount Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-bold flex justify-between">
                    <span>Investment Capital ($ USD)</span>
                    <span className="text-indigo-400">Min $10.00</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono font-black text-sm">$</span>
                    <input
                      type="number"
                      step="any"
                      min="10"
                      max={availableCash}
                      value={investmentAmount}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
                        setInvestmentAmount(val);
                      }}
                      className="w-full bg-[#050505] border border-neutral-800 focus:border-indigo-500 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono font-black text-white focus:outline-none transition-colors"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Percentage Presets */}
                  <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                    {[
                      { label: '10%', val: 10 },
                      { label: '25%', val: 25 },
                      { label: '50%', val: 50 },
                      { label: 'MAX', val: 100 }
                    ].map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleSelectPresetPercent(p.val)}
                        className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-neutral-300 font-bold transition-all cursor-pointer text-center"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order Impact Preview */}
                <div className="p-3 bg-[#050505] border border-neutral-800/80 rounded-xl space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-neutral-400">
                    <span>Acquired Units:</span>
                    <span className="font-black text-white">
                      {calculatedShares.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} shares
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Execution Total:</span>
                    <span className="font-black text-emerald-400">
                      ${numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400 border-t border-neutral-800/80 pt-1.5">
                    <span>Remaining Demo Cash:</span>
                    <span className={`font-black ${remainingCash < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                      ${remainingCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 font-mono text-neutral-500 text-xs">
                Select an asset from the left catalog to configure allocation.
              </div>
            )}

            {/* Execution Button */}
            <div className="space-y-2 pt-2">
              {numericAmount > availableCash && (
                <div className="text-[10px] font-mono text-rose-400 text-center font-bold">
                  Amount exceeds available demo cash (${availableCash.toLocaleString()})
                </div>
              )}

              <button
                type="button"
                disabled={!selectedAsset || !isValidAmount || isSuccess}
                onClick={handleExecutePurchase}
                className={`w-full py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isSuccess
                    ? 'bg-emerald-600 text-white cursor-default'
                    : isValidAmount
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer hover:shadow-indigo-500/20 active:scale-[0.99]'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Asset Added to Portfolio!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Buy & Add {selectedAsset ? selectedAsset.symbol : 'Stock'}</span>
                  </>
                )}
              </button>

              <p className="text-[9px] text-center text-neutral-500 font-mono">
                Instant execution against demo liquidity ledger. 0% commission.
              </p>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}
