import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  ArrowLeftRight, 
  Plus, 
  Minus, 
  Landmark, 
  DollarSign, 
  ChevronRight, 
  Info, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Zap, 
  Copy, 
  Check, 
  RefreshCw 
} from 'lucide-react';

interface FundingTx {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  method: string;
  currency: string;
  amount: number;
  status: 'Settled' | 'Pending' | 'Failed' | 'Processing' | 'Cancelled';
  providerStatus: string;
  date: string;
}

export default function FundingDesk() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [modalStep, setModalStep] = useState<'view' | 'add' | 'success'>('view');
  
  // Funding account cash balance state - connected to Market Desk root (broker_cash)
  const [cashBalance, setCashBalance] = useState<number>(() => {
    const saved = localStorage.getItem('broker_cash');
    return saved ? parseFloat(saved) : 58000.00;
  });

  const [transferAmount, setTransferAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'KES' | 'EUR' | 'GBP' | 'USDC'>('USD');
  const [transferMethod, setTransferMethod] = useState<'ACH' | 'WIRE' | 'CARD' | 'STABLECOIN' | 'REGIONAL'>('ACH');
  const [regionalMethod, setRegionalMethod] = useState<'M-Pesa' | 'Airtel Money' | 'PIX' | 'UPI' | 'PayNow'>('M-Pesa');
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Multi-step withdrawal form state
  const [withdrawalStep, setWithdrawalStep] = useState<number>(1);
  const [walletAddress, setWalletAddress] = useState<string>('');

  const [txs, setTxs] = useState<FundingTx[]>([]);

  // 1. Fetch balance and transaction list from the backend server
  const fetchFundingState = async (silently = false) => {
    if (!silently) setLoading(true);
    try {
      const res = await fetch('/api/funding/state');
      if (res.ok) {
        const data = await res.json();
        // Update local storage so other components see the latest broker cash
        localStorage.setItem('broker_cash', data.balance.toString());
        setCashBalance(data.balance);
        setTxs(data.transactions || []);
      }
    } catch (err) {
      console.warn('Failed to fetch funding state:', err);
    } finally {
      if (!silently) setLoading(false);
    }
  };

  // 2. Fetch state on mount and poll every 4 seconds to catch background webhook simulation updates
  useEffect(() => {
    fetchFundingState();
    const interval = setInterval(() => {
      fetchFundingState(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // 3. Listen to local storage changes (if user traded in another tab) and sync to backend
  useEffect(() => {
    const handleStorageChange = async () => {
      const saved = localStorage.getItem('broker_cash');
      if (saved) {
        const val = parseFloat(saved);
        setCashBalance(val);
        try {
          await fetch('/api/funding/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientBalance: val })
          });
        } catch (e) {
          console.warn('Failed to sync trading balance to server:', e);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Periodically run checking interval
    const interval = setInterval(() => {
      const saved = localStorage.getItem('broker_cash');
      if (saved && parseFloat(saved) !== cashBalance) {
        handleStorageChange();
      }
    }, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [cashBalance]);

  // Reset multi-step withdrawal states when tab changes
  useEffect(() => {
    if (activeTab === 'deposit') {
      setWithdrawalStep(1);
      setWalletAddress('');
    }
  }, [activeTab]);

  // 4. Handle Transfer deposit/withdrawal submission
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }

    if (activeTab === 'withdraw' && (currency === 'USD' || currency === 'USDC') && amount > cashBalance) {
      alert('Insufficient funds on server to complete this withdrawal.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/funding/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL',
          method: transferMethod,
          regionalMethod,
          currency,
          amount,
          walletAddress: activeTab === 'withdraw' ? walletAddress : undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Payment gateway connection failed.');
        return;
      }

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('broker_cash', data.balance.toString());
        setCashBalance(data.balance);
        
        let methodString = '';
        if (transferMethod === 'ACH') methodString = 'Bank ACH Sweep';
        else if (transferMethod === 'WIRE') methodString = 'USD Wire';
        else if (transferMethod === 'CARD') methodString = 'Card Instant';
        else if (transferMethod === 'STABLECOIN') methodString = 'USDC Stablecoin';
        else if (transferMethod === 'REGIONAL') methodString = `${regionalMethod}`;

        if (activeTab === 'deposit') {
          setNotification(`SUCCESS: Initiated deposit of ${currency === 'USD' ? '$' : currency + ' '}${amount.toLocaleString()} via ${methodString}. Status: ${data.transaction.status} (${data.transaction.providerStatus})`);
        } else {
          setNotification(`SUCCESS: Initiated withdrawal of ${currency === 'USD' ? '$' : currency + ' '}${amount.toLocaleString()} via ${methodString} to ${walletAddress || 'destination'}. Status: ${data.transaction.status} (${data.transaction.providerStatus})`);
        }

        setTransferAmount('');
        setWalletAddress('');
        setWithdrawalStep(1);
        await fetchFundingState(true);
        setTimeout(() => setNotification(null), 6000);
      }
    } catch (err) {
      console.error('Payment transfer exception:', err);
      alert('Fiduciary API gateway network connection lost. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Funding Desk Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD 1: Cash Portfolio (USD) */}
        <div id="funding-cash-balance-card" className="bg-[#09090c] border border-white/5 rounded-xl p-4.5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-indigo-500/5 blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-bold">CASH PORTFOLIO (USD)</span>
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black font-mono tracking-tight text-white">
              ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-[9.5px] text-white/40 font-mono uppercase tracking-wider block mt-0.5">
              Ready for securities settlement
            </span>
            <div className="mt-3 pt-2.5 border-t border-white/5 grid grid-cols-3 gap-1 font-mono text-[9px] text-white/50">
              <div>
                <span className="block text-white/30 uppercase text-[8px]">USD Available:</span>
                <span className="font-bold text-white">${Math.round(cashBalance).toLocaleString()}</span>
              </div>
              <div className="border-x border-white/5 px-2">
                <span className="block text-white/30 uppercase text-[8px]">KES Available:</span>
                <span className="font-bold text-white">KES 24,500</span>
              </div>
              <div className="pl-1">
                <span className="block text-white/30 uppercase text-[8px]">USDC Available:</span>
                <span className="font-bold text-white">1,300</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Linked Funding Account status */}
        <div id="funding-linked-rail-card" className="bg-[#09090c] border border-white/5 rounded-xl p-4.5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-emerald-500/5 blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-bold">LINKED BANKING RAIL</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <Landmark className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="space-y-0.5 font-mono text-[10px] text-white/80">
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>Chase Bank ••••4821</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>Visa ••••1124</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>Coinbase Wallet Connected</span>
              </div>
            </div>
            <button 
              onClick={() => { setShowConnectionsModal(true); setModalStep('view'); }}
              className="text-[9px] text-indigo-400 hover:text-indigo-300 font-mono uppercase tracking-wider block mt-2.5 transition-colors font-bold text-left cursor-pointer"
            >
              MANAGE CONNECTIONS
            </button>
          </div>
        </div>

      </div>

      {/* Action Notification Feed */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl flex items-center gap-3 text-xs font-mono"
          >
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Funding Gateway Structure */}
      <div className="max-w-2xl mx-auto w-full">
        
        {/* Deposit/Withdraw terminal form */}
        <div className="bg-[#09090c] border border-white/5 rounded-xl p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setActiveTab('deposit')}
                className={`text-xs font-mono font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'deposit' ? 'text-white border-indigo-500' : 'text-white/40 border-transparent hover:text-white/70'
                }`}
              >
                DEPOSIT FUNDS
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('withdraw')}
                className={`text-xs font-mono font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'withdraw' ? 'text-white border-indigo-500' : 'text-white/40 border-transparent hover:text-white/70'
                }`}
              >
                WITHDRAW CAPITAL
              </button>
            </div>
            
            {activeTab === 'withdraw' && (
              <span className="text-[9.5px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Step {withdrawalStep} of 3
              </span>
            )}
          </div>

          {activeTab === 'deposit' ? (
            /* SIMPLE SINGLE-STEP DEPOSIT FORM */
            <form onSubmit={handleExecuteTransfer} className="space-y-4 font-mono text-xs">
              {/* Input target value amount & Currency Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[9.5px] uppercase text-white/40 block">Dollar Amount (USD)</label>
                  <div className="relative inline-block text-left">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as any)}
                      className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9.5px] text-white/85 font-mono focus:outline-none focus:border-indigo-500 cursor-pointer uppercase font-bold"
                    >
                      <option value="USD" className="bg-[#09090c] text-white">USD ▼</option>
                      <option value="KES" className="bg-[#09090c] text-white">KES ▼</option>
                      <option value="EUR" className="bg-[#09090c] text-white">EUR ▼</option>
                      <option value="GBP" className="bg-[#09090c] text-white">GBP ▼</option>
                      <option value="USDC" className="bg-[#09090c] text-white">USDC ▼</option>
                    </select>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 font-bold">
                    {currency === 'USD' && '$'}
                    {currency === 'EUR' && '€'}
                    {currency === 'GBP' && '£'}
                    {currency === 'KES' && 'KSh'}
                    {currency === 'USDC' && 'Ⓢ'}
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-16 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-indigo-500/40 font-bold"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9.5px] text-white/30 font-bold">{currency}</span>
                </div>
              </div>

              {/* Transfer method selectors */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] uppercase text-white/40 block">Select Settlement Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferMethod('ACH')}
                    className={`p-2.5 border rounded-lg text-center transition-all cursor-pointer ${
                      transferMethod === 'ACH' 
                        ? 'bg-indigo-600/15 border-indigo-500 text-white font-bold' 
                        : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/70'
                    }`}
                  >
                    <div className="font-extrabold uppercase text-[10px]">ACH SWEEP</div>
                    <div className="text-[8px] text-white/30 block mt-0.5">Instant • Free</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransferMethod('WIRE')}
                    className={`p-2.5 border rounded-lg text-center transition-all cursor-pointer ${
                      transferMethod === 'WIRE' 
                        ? 'bg-indigo-600/15 border-indigo-500 text-white font-bold' 
                        : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/70'
                    }`}
                  >
                    <div className="font-extrabold uppercase text-[10px]">USD WIRE</div>
                    <div className="text-[8px] text-white/30 block mt-0.5">T+0 • $15 Fee</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransferMethod('CARD')}
                    className={`p-2.5 border rounded-lg text-center transition-all cursor-pointer ${
                      transferMethod === 'CARD' 
                        ? 'bg-indigo-600/15 border-indigo-500 text-white font-bold' 
                        : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/70'
                    }`}
                  >
                    <div className="font-extrabold uppercase text-[10px]">CARD INSTANT</div>
                    <div className="text-[8px] text-white/30 block mt-0.5">Instant • Free</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransferMethod('STABLECOIN')}
                    className={`p-2.5 border rounded-lg text-center transition-all cursor-pointer ${
                      transferMethod === 'STABLECOIN' 
                        ? 'bg-indigo-600/15 border-indigo-500 text-white font-bold' 
                        : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/70'
                    }`}
                  >
                    <div className="font-extrabold uppercase text-[10px]">STABLECOIN DEPOSIT</div>
                    <div className="text-[8px] text-white/30 block mt-0.5">Instant • Free</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransferMethod('REGIONAL')}
                    className={`col-span-2 p-2.5 border rounded-lg text-center transition-all cursor-pointer ${
                      transferMethod === 'REGIONAL' 
                        ? 'bg-indigo-600/15 border-indigo-500 text-white font-bold' 
                        : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/70'
                    }`}
                  >
                    <div className="font-extrabold uppercase text-[10px]">REGIONAL PAYMENTS</div>
                    <div className="text-[8px] text-white/30 block mt-0.5">M-Pesa, Airtel, PIX, UPI, PayNow</div>
                  </button>
                </div>
              </div>

              {/* Regional Payments Expand Sub-selector */}
              {transferMethod === 'REGIONAL' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[9px] uppercase text-white/40 block font-bold">Select Regional Connector</label>
                  <div className="grid grid-cols-5 gap-1">
                    {(['M-Pesa', 'Airtel Money', 'PIX', 'UPI', 'PayNow'] as const).map((prov) => (
                      <button
                        type="button"
                        key={prov}
                        onClick={() => setRegionalMethod(prov)}
                        className={`py-1.5 border rounded text-[9px] text-center transition-all cursor-pointer ${
                          regionalMethod === prov
                            ? 'bg-indigo-500/20 border-indigo-500 text-white font-bold'
                            : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/70'
                        }`}
                      >
                        {prov}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Information Box / Funding Summary */}
              <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-lg space-y-2 font-mono text-[10px]">
                <div className="text-[9px] text-white/30 uppercase tracking-widest font-black border-b border-white/5 pb-1.5 flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-indigo-400" />
                  <span>Funding Summary</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/40 uppercase">Method:</span>
                    <span className="text-white font-bold">
                      {transferMethod === 'ACH' && 'Bank ACH Sweep'}
                      {transferMethod === 'WIRE' && 'USD Wire'}
                      {transferMethod === 'CARD' && 'Card Instant'}
                      {transferMethod === 'STABLECOIN' && 'Stablecoin Deposit'}
                      {transferMethod === 'REGIONAL' && `${regionalMethod} Deposit`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 uppercase">Estimated Arrival:</span>
                    <span className="text-white font-bold">
                      {transferMethod === 'WIRE' ? 'T+0' : 'Instant'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 uppercase">Fees:</span>
                    <span className="text-white font-bold">
                      {transferMethod === 'WIRE' ? '$15.00' : '$0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 uppercase">Destination:</span>
                    <span className="text-indigo-400 font-bold">USD Cash Portfolio</span>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase rounded-lg shadow-lg tracking-wider cursor-pointer transition-colors"
              >
                INITIATE DEPOSIT REQUEST
              </button>

            </form>
          ) : (
            /* MULTI-STEP WITHDRAWAL PROCESSOR */
            <div className="space-y-4">
              {/* Step Progress Indicators */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/5 mb-2 text-[9px] font-mono">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-mono ${withdrawalStep >= 1 ? 'bg-indigo-600 text-white font-black' : 'bg-white/5 text-white/40'}`}>1</span>
                  <span className={withdrawalStep >= 1 ? 'text-white font-extrabold' : 'text-white/40'}>AMOUNT</span>
                </div>
                <div className="h-0.5 flex-1 mx-2 bg-white/5 relative">
                  <div className={`absolute top-0 bottom-0 left-0 bg-indigo-500 transition-all duration-300 ${withdrawalStep === 1 ? 'w-0' : withdrawalStep === 2 ? 'w-1/2' : 'w-full'}`} />
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-mono ${withdrawalStep >= 2 ? 'bg-indigo-600 text-white font-black' : 'bg-white/5 text-white/40'}`}>2</span>
                  <span className={withdrawalStep >= 2 ? 'text-white font-extrabold' : 'text-white/40'}>DESTINATION</span>
                </div>
                <div className="h-0.5 flex-1 mx-2 bg-white/5 relative">
                  <div className={`absolute top-0 bottom-0 left-0 bg-indigo-500 transition-all duration-300 ${withdrawalStep <= 2 ? 'w-0' : 'w-full'}`} />
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-mono ${withdrawalStep >= 3 ? 'bg-indigo-600 text-white font-black' : 'bg-white/5 text-white/40'}`}>3</span>
                  <span className={withdrawalStep >= 3 ? 'text-white font-extrabold' : 'text-white/40'}>REVIEW</span>
                </div>
              </div>

              {withdrawalStep === 1 && (
                <div className="space-y-4 animate-fadeIn text-xs">
                  {/* Input target value amount & Currency Selector */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[9.5px] uppercase text-white/40 block">Withdrawal Amount</label>
                      <div className="relative inline-block text-left">
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as any)}
                          className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9.5px] text-white/85 font-mono focus:outline-none focus:border-indigo-500 cursor-pointer uppercase font-bold"
                        >
                          <option value="USD" className="bg-[#09090c] text-white">USD ▼</option>
                          <option value="KES" className="bg-[#09090c] text-white">KES ▼</option>
                          <option value="EUR" className="bg-[#09090c] text-white">EUR ▼</option>
                          <option value="GBP" className="bg-[#09090c] text-white">GBP ▼</option>
                          <option value="USDC" className="bg-[#09090c] text-white">USDC ▼</option>
                        </select>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 font-bold">
                        {currency === 'USD' && '$'}
                        {currency === 'EUR' && '€'}
                        {currency === 'GBP' && '£'}
                        {currency === 'KES' && 'KSh'}
                        {currency === 'USDC' && 'Ⓢ'}
                      </span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        min="1"
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-16 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-indigo-500/40 font-bold"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9.5px] text-white/30 font-bold">{currency}</span>
                    </div>
                    <span className="text-[9px] text-white/30 block text-right">
                      Max Liquid Cash Available: <span className="text-white/60 font-bold font-mono">${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </span>
                  </div>

                  {/* Transfer method selectors */}
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] uppercase text-white/40 block">Select Settlement Route</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTransferMethod('ACH')}
                        className={`p-2.5 border rounded-lg text-center transition-all cursor-pointer ${
                          transferMethod === 'ACH' 
                            ? 'bg-indigo-600/15 border-indigo-500 text-white font-bold' 
                            : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/70'
                        }`}
                      >
                        <div className="font-extrabold uppercase text-[10px]">ACH OUTFLOW</div>
                        <div className="text-[8px] text-white/30 block mt-0.5">1-2 Business Days • Free</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferMethod('WIRE')}
                        className={`p-2.5 border rounded-lg text-center transition-all cursor-pointer ${
                          transferMethod === 'WIRE' 
                            ? 'bg-indigo-600/15 border-indigo-500 text-white font-bold' 
                            : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/70'
                        }`}
                      >
                        <div className="font-extrabold uppercase text-[10px]">USD WIRE SWEEP</div>
                        <div className="text-[8px] text-white/30 block mt-0.5">Same Day • $15.00 Fee</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferMethod('CARD')}
                        className={`p-2.5 border rounded-lg text-center transition-all cursor-pointer ${
                          transferMethod === 'CARD' 
                            ? 'bg-indigo-600/15 border-indigo-500 text-white font-bold' 
                            : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/70'
                        }`}
                      >
                        <div className="font-extrabold uppercase text-[10px]">CARD SWEEP</div>
                        <div className="text-[8px] text-white/30 block mt-0.5">Instant Transfer • Free</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferMethod('STABLECOIN')}
                        className={`p-2.5 border rounded-lg text-center transition-all cursor-pointer ${
                          transferMethod === 'STABLECOIN' 
                            ? 'bg-indigo-600/15 border-indigo-500 text-white font-bold' 
                            : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/70'
                        }`}
                      >
                        <div className="font-extrabold uppercase text-[10px]">STABLECOIN WALLET</div>
                        <div className="text-[8px] text-white/30 block mt-0.5">Instant (ERC20) • Free</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransferMethod('REGIONAL')}
                        className={`col-span-2 p-2.5 border rounded-lg text-center transition-all cursor-pointer ${
                          transferMethod === 'REGIONAL' 
                            ? 'bg-indigo-600/15 border-indigo-500 text-white font-bold' 
                            : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/70'
                        }`}
                      >
                        <div className="font-extrabold uppercase text-[10px]">REGIONAL PAYMENTS</div>
                        <div className="text-[8px] text-white/30 block mt-0.5">M-Pesa, Airtel, PIX, UPI, PayNow</div>
                      </button>
                    </div>
                  </div>

                  {/* Regional Payments Expand Sub-selector */}
                  {transferMethod === 'REGIONAL' && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="text-[9px] uppercase text-white/40 block font-bold">Select Regional Mobile Rail</label>
                      <div className="grid grid-cols-5 gap-1">
                        {(['M-Pesa', 'Airtel Money', 'PIX', 'UPI', 'PayNow'] as const).map((prov) => (
                          <button
                            type="button"
                            key={prov}
                            onClick={() => setRegionalMethod(prov)}
                            className={`py-1.5 border rounded text-[9px] text-center transition-all cursor-pointer ${
                              regionalMethod === prov
                                ? 'bg-indigo-500/20 border-indigo-500 text-white font-bold'
                                : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/70'
                            }`}
                          >
                            {prov}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const amount = parseFloat(transferAmount);
                      if (isNaN(amount) || amount <= 0) {
                        alert('Please enter a valid amount.');
                        return;
                      }
                      if ((currency === 'USD' || currency === 'USDC') && amount > cashBalance) {
                        alert('Insufficient funds in your cash balance.');
                        return;
                      }
                      setWithdrawalStep(2);
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase rounded-lg shadow-lg tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5 animate-pulse"
                  >
                    CONTINUE TO DESTINATION DETAILS <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {withdrawalStep === 2 && (
                <div className="space-y-4 animate-fadeIn text-xs">
                  {/* Capturing the address dynamically based on settlement method */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase text-white/40 block font-bold">
                      {transferMethod === 'STABLECOIN' && 'USDC Destination Wallet Address'}
                      {transferMethod === 'ACH' && 'Recipient Bank Account & Routing Transit Number'}
                      {transferMethod === 'WIRE' && 'SWIFT/BIC Code & Recipient Bank Account'}
                      {transferMethod === 'REGIONAL' && `${regionalMethod} Mobile Number / Wallet ID`}
                      {transferMethod === 'CARD' && 'Receiving Debit Card Number (Visa / Mastercard Sweep)'}
                    </label>
                    
                    <input
                      type="text"
                      placeholder={
                        transferMethod === 'STABLECOIN' ? 'e.g. 0x71C36... or G8paX92...' :
                        transferMethod === 'ACH' ? 'e.g. Routing: 021000021, Acc: 4821099' :
                        transferMethod === 'WIRE' ? 'e.g. SWIFT: CHASEUS33, Acc: 9948210' :
                        transferMethod === 'REGIONAL' ? 'e.g. Mobile: +254 712 345678' :
                        'e.g. Card: •••• •••• •••• 1124'
                      }
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-3 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-indigo-500/40 font-bold"
                      required
                    />

                    <span className="text-[9px] text-white/30 uppercase leading-relaxed block">
                      ⚠️ Double check address characters carefully. Incorrect addresses will result in catastrophic, irreversible capital loss under fiduciary rules.
                    </span>

                    {/* Fast Auto-fills / Pre-saved wallets for easy testing */}
                    <div className="pt-1.5 space-y-1.5">
                      <span className="text-[8.5px] uppercase text-white/40 font-bold block">Preset Linked Destinations:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {transferMethod === 'STABLECOIN' && (
                          <button
                            type="button"
                            onClick={() => setWalletAddress('0x4b726c5dfd6f96cfb6a3ce63c1a2f6479018e11b')}
                            className="text-[8.5px] px-2 py-1 bg-white/5 border border-white/5 rounded text-white/60 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/20 transition-all cursor-pointer font-mono"
                          >
                            🔗 Coinbase Wallet (0x4b72...e11b)
                          </button>
                        )}
                        {transferMethod === 'ACH' && (
                          <button
                            type="button"
                            onClick={() => setWalletAddress('Routing: 021000021, Account: ••••4821')}
                            className="text-[8.5px] px-2 py-1 bg-white/5 border border-white/5 rounded text-white/60 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/20 transition-all cursor-pointer font-mono"
                          >
                            🔗 Chase Checking (••••4821)
                          </button>
                        )}
                        {transferMethod === 'WIRE' && (
                          <button
                            type="button"
                            onClick={() => setWalletAddress('SWIFT: CHASEUS33XXX, Account: ••••4821')}
                            className="text-[8.5px] px-2 py-1 bg-white/5 border border-white/5 rounded text-white/60 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/20 transition-all cursor-pointer font-mono"
                          >
                            🔗 Chase Wire Account (••••4821)
                          </button>
                        )}
                        {transferMethod === 'REGIONAL' && (
                          <button
                            type="button"
                            onClick={() => setWalletAddress('+254 712 345678')}
                            className="text-[8.5px] px-2 py-1 bg-white/5 border border-white/5 rounded text-white/60 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/20 transition-all cursor-pointer font-mono"
                          >
                            🔗 Linked Phone (+254 ••• ••78)
                          </button>
                        )}
                        {transferMethod === 'CARD' && (
                          <button
                            type="button"
                            onClick={() => setWalletAddress('Visa Debit ••••1124')}
                            className="text-[8.5px] px-2 py-1 bg-white/5 border border-white/5 rounded text-white/60 hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/20 transition-all cursor-pointer font-mono"
                          >
                            🔗 Visa Debit (••••1124)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setWithdrawalStep(1)}
                      className="w-1/3 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 font-bold uppercase rounded-lg cursor-pointer transition-colors font-mono"
                    >
                      BACK
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!walletAddress.trim()) {
                          alert('Please specify the destination details.');
                          return;
                        }
                        setWithdrawalStep(3);
                      }}
                      className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase rounded-lg shadow-lg tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5 font-mono"
                    >
                      CONTINUE TO REVIEW <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {withdrawalStep === 3 && (
                <div className="space-y-4 animate-fadeIn text-xs">
                  {/* REVIEW SUMMARY SCREEN */}
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3 font-mono">
                    <div className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5" />
                      <span>Fiduciary Disbursal Order Review</span>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-white/40 uppercase">Transaction Type</span>
                        <span className="text-amber-400 font-bold uppercase">Capital Withdrawal</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-0.5 border-t border-white/[0.03] pt-1.5">
                        <span className="text-white/40 uppercase">Requested Amount</span>
                        <span className="text-white font-bold font-mono text-sm">
                          {currency === 'USD' && '$'}
                          {currency === 'EUR' && '€'}
                          {currency === 'GBP' && '£'}
                          {currency === 'KES' && 'KSh '}
                          {currency === 'USDC' && 'Ⓢ '}
                          {parseFloat(transferAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-0.5 border-t border-white/[0.03] pt-1.5">
                        <span className="text-white/40 uppercase">Settlement Method</span>
                        <span className="text-white font-bold">
                          {transferMethod === 'ACH' && 'Bank ACH Outflow'}
                          {transferMethod === 'WIRE' && 'USD Wire Sweep'}
                          {transferMethod === 'CARD' && 'Card Sweep'}
                          {transferMethod === 'STABLECOIN' && 'USDC Wallet Disbursal'}
                          {transferMethod === 'REGIONAL' && `${regionalMethod} Regional Transfer`}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-0.5 border-t border-white/[0.03] pt-1.5">
                        <span className="text-white/40 uppercase">Estimated Processing</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          {transferMethod === 'WIRE' ? 'T+0 Same Day' : 'Instant Settlement'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-0.5 border-t border-white/[0.03] pt-1.5">
                        <span className="text-white/40 uppercase">Fiduciary Routing Fees</span>
                        <span className="text-white font-mono font-bold">
                          {transferMethod === 'WIRE' ? '$15.00' : '$0.00'}
                        </span>
                      </div>

                      <div className="flex flex-col py-2 border-t border-white/5 mt-2 space-y-1 bg-white/[0.01] p-2.5 rounded border border-dashed border-white/5">
                        <span className="text-white/40 uppercase text-[9px] font-bold">Target Address / Destination Details</span>
                        <span className="text-indigo-400 font-mono font-bold break-all text-[10px]">
                          {walletAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleExecuteTransfer} className="space-y-4 font-mono text-xs">
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => setWithdrawalStep(2)}
                        disabled={loading}
                        className="w-1/3 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 font-bold uppercase rounded-lg cursor-pointer transition-colors"
                      >
                        BACK
                      </button>
                      
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase rounded-lg shadow-lg tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> DISBURSING...
                          </>
                        ) : (
                          'CONFIRM & DISBURSE CAPITAL'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Global Connections Manager Modal */}
      <AnimatePresence>
        {showConnectionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConnectionsModal(false)}
              className="absolute inset-0 bg-[#000000]/80 backdrop-blur-md cursor-pointer"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-md bg-[#08080c] border border-white/10 rounded-xl p-5 font-mono text-xs z-10"
            >
              {modalStep === 'view' && (
                <div className="space-y-4">
                  <div className="border-b border-white/5 pb-3">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">MANAGE GLOBAL CONNECTIONS</h4>
                    <p className="text-[9.5px] text-white/40 leading-normal uppercase">
                      Establish and audit institutional capital flow connectors.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] text-white/30 uppercase font-black tracking-wider block">Active Connections</span>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-2.5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-bold text-white">Chase Bank ••••4821</span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[8px] font-bold">ACTIVE</span>
                      </div>

                      <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-2.5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-bold text-white">Visa ••••1124</span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[8px] font-bold">ACTIVE</span>
                      </div>

                      <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-2.5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-bold text-white">Coinbase Wallet Connected</span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[8px] font-bold">CONNECTED</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowConnectionsModal(false)}
                      className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white uppercase text-[9px] font-bold cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStep('add')}
                      className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-750 text-white font-bold uppercase text-[9px] cursor-pointer"
                    >
                      + Connect New Rail
                    </button>
                  </div>
                </div>
              )}

              {modalStep === 'add' && (
                <div className="space-y-4">
                  <div className="border-b border-white/5 pb-3">
                    <h5 className="text-sm font-black text-white uppercase tracking-wider">Connect Global Funding Rail</h5>
                    <p className="text-[9px] text-white/30 uppercase mt-0.5">Secure Institutional Integration</p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalStep('success');
                      }}
                      className="w-full flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg text-left transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Landmark className="w-4 h-4 text-indigo-400" />
                        <div>
                          <div className="font-bold text-white text-[10px]">ACH SWEEP PORTAL (PLAID)</div>
                          <div className="text-[8px] text-white/40 uppercase mt-0.5">Link checking/deposit account</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModalStep('success');
                      }}
                      className="w-full flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg text-left transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-4 h-4 text-indigo-400" />
                        <div>
                          <div className="font-bold text-white text-[10px]">CARD GATEWAY (STRIPE)</div>
                          <div className="text-[8px] text-white/40 uppercase mt-0.5">Link card clearing engine</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModalStep('success');
                      }}
                      className="w-full flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg text-left transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet className="w-4 h-4 text-indigo-400" />
                        <div>
                          <div className="font-bold text-white text-[10px]">COINBASE PRIME / WEB3 LINK</div>
                          <div className="text-[8px] text-white/40 uppercase mt-0.5">Authorize custody/clearing ledger</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setModalStep('view')}
                      className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white uppercase text-[9px] font-bold cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {modalStep === 'success' && (
                <div className="text-center space-y-4 py-3">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white uppercase">CONNECTION AUTHORIZED</h4>
                    <p className="text-[9.5px] text-white/40 uppercase leading-normal">
                      The new fiduciary settlement gateway is now secure and authenticated.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setModalStep('view');
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold uppercase text-[9.5px] tracking-wider rounded cursor-pointer"
                  >
                    RETURN TO CONNECTIONS
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
