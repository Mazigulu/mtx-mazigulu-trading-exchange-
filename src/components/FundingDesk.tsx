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
  status: 'Settled' | 'Pending' | 'Failed';
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

  const [txs, setTxs] = useState<FundingTx[]>([
    { id: 'fund-1', type: 'DEPOSIT', method: 'Bank ACH Sweep', currency: 'USD', amount: 5000.00, status: 'Settled', date: '2026-06-25 10:14' },
    { id: 'fund-2', type: 'DEPOSIT', method: 'M-Pesa Deposit', currency: 'KES', amount: 32000.00, status: 'Settled', date: '2026-06-25 10:22' },
    { id: 'fund-3', type: 'DEPOSIT', method: 'USDC Deposit', currency: 'USDC', amount: 1200.00, status: 'Settled', date: '2026-06-25 11:40' },
    { id: 'fund-4', type: 'WITHDRAWAL', method: 'Withdrawal Request', currency: 'USD', amount: 2500.00, status: 'Pending', date: '2026-06-25 13:55' }
  ]);

  // Sync state changes to local storage to maintain absolute unity with Market Desk root
  useEffect(() => {
    localStorage.setItem('broker_cash', cashBalance.toString());
  }, [cashBalance]);

  // Listen to external storage events to sync cash balances across components
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('broker_cash');
      if (saved) {
        setCashBalance(parseFloat(saved));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }

    if (activeTab === 'withdraw' && (currency === 'USD' || currency === 'USDC') && amount > cashBalance) {
      alert('Insufficient funds to complete this withdrawal.');
      return;
    }

    let methodString = '';
    if (transferMethod === 'ACH') methodString = 'Bank ACH Sweep';
    else if (transferMethod === 'WIRE') methodString = 'USD Wire';
    else if (transferMethod === 'CARD') methodString = 'Card Instant';
    else if (transferMethod === 'STABLECOIN') methodString = 'USDC Deposit';
    else if (transferMethod === 'REGIONAL') methodString = `${regionalMethod} Deposit`;

    if (activeTab === 'deposit') {
      if (currency === 'USD' || currency === 'USDC') {
        setCashBalance(prev => prev + amount);
      }
      const newTx: FundingTx = {
        id: `fund-${Date.now()}`,
        type: 'DEPOSIT',
        method: methodString,
        currency: currency,
        amount: amount,
        status: transferMethod === 'WIRE' ? 'Pending' : 'Settled',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setTxs(prev => [newTx, ...prev]);
      setNotification(`SUCCESS: Deposited ${currency === 'USD' ? '$' : currency + ' '}${amount.toLocaleString()} via ${methodString}.`);
    } else {
      // Withdrawal
      if (currency === 'USD' || currency === 'USDC') {
        setCashBalance(prev => prev - amount);
      }
      const newTx: FundingTx = {
        id: `fund-${Date.now()}`,
        type: 'WITHDRAWAL',
        method: transferMethod === 'REGIONAL' ? `${regionalMethod} Withdrawal` : 'Withdrawal Request',
        currency: currency,
        amount: amount,
        status: 'Pending',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setTxs(prev => [newTx, ...prev]);
      setNotification(`SUCCESS: Initiated withdrawal of ${currency === 'USD' ? '$' : currency + ' '}${amount.toLocaleString()} to connected rail.`);
    }

    setTransferAmount('');
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Funding Desk Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
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

        {/* CARD 3: Clearing Latency */}
        <div id="funding-clearing-latency-card" className="bg-[#09090c] border border-white/5 rounded-xl p-4.5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-purple-500/5 blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-bold">CLEARING ENGINE LATENCY</span>
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
              <Zap className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black font-mono tracking-tight text-white flex items-center gap-1.5">
              T+0 AVAILABLE
            </h3>
            <span className="text-[9px] text-white/30 font-mono uppercase tracking-wider block mt-1">
              Capital immediately deployable
            </span>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Deposit/Withdraw terminal form */}
        <div className="lg:col-span-5 bg-[#09090c] border border-white/5 rounded-xl p-5 space-y-4 font-mono">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
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
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-755 text-white font-bold uppercase rounded-lg shadow-lg tracking-wider cursor-pointer transition-colors"
            >
              {activeTab === 'deposit' ? 'INITIATE DEPOSIT REQUEST' : 'INITIATE WITHDRAWAL REQUEST'}
            </button>

          </form>
        </div>

        {/* Historic Settlement Records Table */}
        <div className="lg:col-span-7 bg-[#09090c] border border-white/5 rounded-xl p-5 space-y-4 font-mono">
          <div className="pb-3 border-b border-white/5 flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">SETTLEMENT & CLEARING RECORDS</h4>
            <span className="text-[8.5px] text-white/30 font-mono uppercase tracking-wider">Fiduciary Ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full font-mono text-left text-[11px]">
              <thead>
                <tr className="border-b border-white/5 text-[9px] text-white/40 uppercase tracking-wider pb-2">
                  <th className="py-2.5 font-bold">Transfer Ref ID</th>
                  <th className="py-2.5 font-bold">Timestamp</th>
                  <th className="py-2.5 font-bold">Method</th>
                  <th className="py-2.5 font-bold">Currency</th>
                  <th className="py-2.5 font-bold text-right">Amount</th>
                  <th className="py-2.5 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {txs.map(tx => {
                  const formatAmount = (amount: number, curr: string) => {
                    if (curr === 'USD') return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                    if (curr === 'EUR') return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                    if (curr === 'GBP') return `£${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                    if (curr === 'KES') return `KES ${amount.toLocaleString()}`;
                    if (curr === 'USDC') return `${amount.toLocaleString()}`;
                    return `${amount.toLocaleString()}`;
                  };

                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="py-3 font-bold text-white/50">{tx.id}</td>
                      <td className="py-3 text-white/40">{tx.date}</td>
                      <td className="py-3 font-semibold">
                        <div className="flex items-center gap-1.5">
                          {tx.type === 'DEPOSIT' ? (
                            <span className="p-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ArrowUpRight className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="p-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <ArrowDownLeft className="w-3 h-3" />
                            </span>
                          )}
                          <span>{tx.method}</span>
                        </div>
                      </td>
                      <td className="py-3 font-bold text-white/60">{tx.currency || 'USD'}</td>
                      <td className="py-3 text-right font-black text-white">
                        {formatAmount(tx.amount, tx.currency || 'USD')}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold ${
                          tx.status === 'Settled' 
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
