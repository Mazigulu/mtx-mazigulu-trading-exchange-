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
  RefreshCw,
  Eye,
  ExternalLink,
  ShieldCheck,
  Globe,
  Coins
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
  walletAddress?: string;
  txHash?: string;
  gasUsed?: number;
  gasPriceGwei?: number;
}

interface WalletDetails {
  ethAddress: string;
  bankName: string;
  bankAccountLast4: string;
  bankRouting: string;
}

const SUPPORTED_ASSETS = [
  { symbol: 'USD', name: 'US Dollar Cash', type: 'FIAT', logo: '🇺🇸', network: 'Fedwire / FedNow', rate: 1.0, explorer: null, contract: null },
  { symbol: 'USDC', name: 'USD Coin (Circle)', type: 'ERC20', logo: 'Ⓢ', network: 'Base L2 Network', rate: 1.0, explorer: 'https://basescan.org', contract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  { symbol: 'USDT', name: 'Tether USD', type: 'ERC20', logo: '₮', network: 'Ethereum Mainnet', rate: 1.0, explorer: 'https://etherscan.io', contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { symbol: 'PYUSD', name: 'PayPal USD', type: 'ERC20', logo: '🅿️', network: 'Ethereum Mainnet', rate: 1.0, explorer: 'https://etherscan.io', contract: '0x6c3ea9036406852006290770bedfc31600287410' },
  { symbol: 'EUR', name: 'Euro Ledger', type: 'FIAT', logo: '🇪🇺', network: 'SEPA Instant Credit', rate: 1.09, explorer: null, contract: null },
  { symbol: 'GBP', name: 'Sterling Custody', type: 'FIAT', logo: '🇬🇧', network: 'CHAPS Clearing', rate: 1.28, explorer: null, contract: null },
  { symbol: 'KES', name: 'Kenya Shilling', type: 'FIAT', logo: '🇰🇪', network: 'M-Pesa Express', rate: 0.0078, explorer: null, contract: null },
];

export default function FundingDesk() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [modalStep, setModalStep] = useState<'view' | 'add' | 'success'>('view');
  
  // Base cash balance state (synchronized with USD balance)
  const [cashBalance, setCashBalance] = useState<number>(() => {
    const saved = localStorage.getItem('broker_cash');
    return saved ? parseFloat(saved) : 58000.00;
  });

  // Comprehensive multi-currency balances and identity details
  const [balances, setBalances] = useState<{ [symbol: string]: number }>({
    USD: 58000.00,
    KES: 32000.00,
    EUR: 5000.00,
    GBP: 2500.00,
    USDC: 1200.00,
    USDT: 4500.00,
    PYUSD: 1500.00
  });

  const [walletDetails, setWalletDetails] = useState<WalletDetails>({
    ethAddress: '0x3bf92c4a9616ae9d8f36c56df2e718bc321049da4bb27fa1',
    bankName: 'Chase Bank N.A.',
    bankAccountLast4: '4821',
    bankRouting: '021000021'
  });

  const [txs, setTxs] = useState<FundingTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form states
  const [selectedAsset, setSelectedAsset] = useState<string>('USDC');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferMethod, setTransferMethod] = useState<'ACH' | 'WIRE' | 'CARD' | 'STABLECOIN' | 'REGIONAL'>('STABLECOIN');
  const [regionalMethod, setRegionalMethod] = useState<'M-Pesa' | 'Airtel Money' | 'PIX' | 'UPI' | 'PayNow'>('M-Pesa');
  const [withdrawalStep, setWithdrawalStep] = useState<number>(1);
  const [destWalletAddress, setDestWalletAddress] = useState<string>('');

  // Interactive Web3 wallet popup simulation and broadcast flow
  const [web3Stage, setWeb3Stage] = useState<'idle' | 'estimating' | 'prompting' | 'broadcasting' | 'confirming' | 'completed'>('idle');
  const [web3GasGwei, setWeb3GasGwei] = useState<number>(18);
  const [web3GasUsd, setWeb3GasUsd] = useState<number>(1.25);
  const [web3TxHash, setWeb3TxHash] = useState<string>('');
  const [web3ProgressLog, setWeb3ProgressLog] = useState<string[]>([]);

  // Block explorer inspector modal
  const [inspectorTx, setInspectorTx] = useState<FundingTx | null>(null);

  // Pagination configuration
  const [assetPage, setAssetPage] = useState<number>(1);
  const assetsPerPage = 6;
  const totalAssetPages = Math.max(1, Math.ceil(SUPPORTED_ASSETS.length / assetsPerPage));
  const activeAssetPage = Math.min(assetPage, totalAssetPages);
  const paginatedAssets = SUPPORTED_ASSETS.slice((activeAssetPage - 1) * assetsPerPage, activeAssetPage * assetsPerPage);

  const [activityPage, setActivityPage] = useState<number>(1);
  const activitiesPerPage = 6;
  const totalActivityPages = Math.max(1, Math.ceil(txs.length / activitiesPerPage));
  const activeActivityPage = Math.min(activityPage, totalActivityPages);
  const paginatedTxs = txs.slice((activeActivityPage - 1) * activitiesPerPage, activeActivityPage * activitiesPerPage);

  // Calculate aggregate portfolio valuation in USD
  const totalValuationUsd = Object.entries(balances).reduce((acc: number, [symbol, bal]) => {
    const asset = SUPPORTED_ASSETS.find(a => a.symbol === symbol);
    const rate = asset ? asset.rate : 1.0;
    return acc + ((bal as number) * rate);
  }, 0);

  // 1. Fetch balance and transaction list from backend server
  const fetchFundingState = async (silently = false) => {
    if (!silently) setLoading(true);
    try {
      const res = await fetch('/api/funding/state');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('broker_cash', data.balance.toString());
        setCashBalance(data.balance);
        if (data.balances) setBalances(data.balances);
        if (data.walletDetails) setWalletDetails(data.walletDetails);
        setTxs(data.transactions || []);
      }
    } catch (err) {
      console.warn('Failed to fetch funding state:', err);
    } finally {
      if (!silently) setLoading(false);
    }
  };

  // Fetch state on mount and poll for background transaction simulation (pending status)
  useEffect(() => {
    fetchFundingState();
    const interval = setInterval(() => {
      fetchFundingState(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen to local storage changes to keep cash balance perfectly synchronized with other trading desks
  useEffect(() => {
    const handleStorageChange = async () => {
      const saved = localStorage.getItem('broker_cash');
      if (saved) {
        const val = parseFloat(saved);
        if (val !== cashBalance) {
          setCashBalance(val);
          try {
            const res = await fetch('/api/funding/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientBalance: val })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.balances) setBalances(data.balances);
            }
          } catch (e) {
            console.warn('Failed to sync trading balance to server:', e);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [cashBalance]);

  // Handle Tab/Asset matching
  useEffect(() => {
    const asset = SUPPORTED_ASSETS.find(a => a.symbol === selectedAsset);
    if (asset) {
      if (asset.type === 'ERC20') {
        setTransferMethod('STABLECOIN');
      } else {
        if (selectedAsset === 'USD') setTransferMethod('ACH');
        else if (selectedAsset === 'KES') setTransferMethod('REGIONAL');
        else setTransferMethod('WIRE');
      }
    }
  }, [selectedAsset]);

  // Reset multi-step withdrawal states when tab changes
  useEffect(() => {
    setWithdrawalStep(1);
    setDestWalletAddress('');
    setTransferAmount('');
    setWeb3Stage('idle');
  }, [activeTab]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Run the mock Web3 Smart Contract Broadcast Simulation
  const runWeb3Broadcaster = (amount: number, callback: () => void) => {
    setWeb3Stage('estimating');
    setWeb3ProgressLog(['[MEMPOOL] Initiating Web3 RPC handshake...', '[GAS] Fetching gas estimations on Base L2 Network...']);
    
    // Simulate smart contract interactions
    setTimeout(() => {
      setWeb3GasGwei(Math.floor(14 + Math.random() * 8));
      setWeb3GasUsd(parseFloat((0.25 + Math.random() * 0.9).toFixed(2)));
      setWeb3Stage('prompting');
      setWeb3ProgressLog(prev => [...prev, '[ESTIMATION] Gas Fee: ~' + web3GasUsd + ' USD. Signature requested...']);
    }, 1200);
  };

  const confirmSigning = async () => {
    setWeb3Stage('broadcasting');
    setWeb3ProgressLog(prev => [...prev, '[SIGNATURE] Secure payload signed using client hardware wallet.', '[BROADCAST] Propagating transaction to distributed memory pool...']);
    
    const hex = '0123456789abcdef';
    let tempHash = '0x';
    for (let i = 0; i < 64; i++) tempHash += hex[Math.floor(Math.random() * 16)];
    setWeb3TxHash(tempHash);

    setTimeout(() => {
      setWeb3Stage('confirming');
      setWeb3ProgressLog(prev => [
        ...prev,
        `[HASH] Broadcast success. TXID: ${tempHash.substring(0, 16)}...`,
        '[BLOCK] Waiting for block inclusion & consensus confirmation...'
      ]);

      setTimeout(() => {
        setWeb3Stage('completed');
        setWeb3ProgressLog(prev => [...prev, '[SETTLEMENT] Consensus settled. 2 network block confirmations validated successfully!']);
        setTimeout(() => {
          setWeb3Stage('idle');
          executeTransferCall();
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const executeTransferCall = async () => {
    const amount = parseFloat(transferAmount);
    try {
      setLoading(true);
      const res = await fetch('/api/funding/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL',
          method: transferMethod,
          regionalMethod,
          currency: selectedAsset,
          amount,
          walletAddress: activeTab === 'withdraw' ? destWalletAddress : walletDetails.ethAddress
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Payment rail communication failed.');
        return;
      }

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('broker_cash', data.balance.toString());
        setCashBalance(data.balance);
        if (data.balances) setBalances(data.balances);
        
        let methodString = '';
        if (transferMethod === 'ACH') methodString = 'Bank ACH Sweep';
        else if (transferMethod === 'WIRE') methodString = 'USD Wire';
        else if (transferMethod === 'CARD') methodString = 'Card Instant';
        else if (transferMethod === 'STABLECOIN') methodString = `${selectedAsset} On-Chain Ledger`;
        else if (transferMethod === 'REGIONAL') methodString = `${regionalMethod}`;

        setNotification(`SUCCESS: Cleared transfer of ${amount.toLocaleString()} ${selectedAsset} via ${methodString}.`);
        setTransferAmount('');
        setDestWalletAddress('');
        setWithdrawalStep(1);
        await fetchFundingState(true);
        setTimeout(() => setNotification(null), 6000);
      }
    } catch (err) {
      console.error('Payment transfer exception:', err);
      alert('Fiduciary API gateway lost network connection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const currentBal = balances[selectedAsset] || 0;
    if (activeTab === 'withdraw' && amount > currentBal) {
      alert(`Insufficient ${selectedAsset} balance to complete this withdrawal.`);
      return;
    }

    const asset = SUPPORTED_ASSETS.find(a => a.symbol === selectedAsset);
    if (asset && asset.type === 'ERC20') {
      runWeb3Broadcaster(amount, executeTransferCall);
    } else {
      executeTransferCall();
    }
  };

  const currentAssetDetails = SUPPORTED_ASSETS.find(a => a.symbol === selectedAsset);

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Production-Grade Wallet Identity & Core Valuations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Card 1: Combined Aggregated Valuation */}
        <div id="wallet-balance-portfolio-card" className="bg-[#09090c] border border-white/5 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between lg:col-span-1">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-indigo-500/5 blur-3xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-black">LIQUID PORTFOLIO VALUE (USD)</span>
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-white">
              ${totalValuationUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[9.5px] text-emerald-400 font-mono uppercase tracking-wider block mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 inline text-emerald-400" />
              <span>Identity & Funds Audited & Fully Collateralized</span>
            </span>
          </div>
        </div>

        {/* Card 2: Generated On-Chain Wallet Addresses (Identity Linked) */}
        <div id="wallet-blockchain-details-card" className="bg-[#09090c] border border-white/5 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between lg:col-span-1">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-emerald-500/5 blur-3xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-black">ON-CHAIN IDENTIFIER (ERC-20)</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono">
            <div className="text-[9px] text-white/30 uppercase font-bold">Base L2 / Ethereum Deposit Address</div>
            <div className="flex items-center justify-between gap-1 mt-1 bg-white/[0.02] p-2 rounded border border-white/5">
              <span className="text-white font-bold text-[10px] truncate break-all block mr-2 text-indigo-400 font-mono">
                {walletDetails.ethAddress}
              </span>
              <button 
                onClick={() => copyToClipboard(walletDetails.ethAddress, 'eth')}
                className="text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Copy Address"
              >
                {copiedField === 'eth' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Institutional Cash Routing (Fiat Clearing) */}
        <div id="wallet-fiat-routing-card" className="bg-[#09090c] border border-white/5 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between lg:col-span-1">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-amber-500/5 blur-3xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-black">CUSTODY FIAT ROUTING</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 font-mono text-[10px] space-y-1">
            <div className="flex justify-between">
              <span className="text-white/30 uppercase text-[9px]">Bank:</span>
              <span className="font-bold text-white">{walletDetails.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/30 uppercase text-[9px]">Routing ABA:</span>
              <span className="font-bold text-white tracking-widest">{walletDetails.bankRouting}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/30 uppercase text-[9px]">Account Number:</span>
              <span className="font-bold text-white">••••••••{walletDetails.bankAccountLast4}</span>
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* SECTION 2: Assets Ledger Matrix (Left Column) */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          <div className="bg-[#09090c] border border-white/5 rounded-xl p-5 font-mono">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Multi-Currency Liquidity Map</h4>
                <p className="text-[8.5px] text-white/30 uppercase mt-0.5 font-bold">Aggregated Clearing and Custodial Ledger</p>
              </div>
              <button 
                onClick={() => fetchFundingState()} 
                className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3 animate-pulse" /> Force Sync Ledger
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[10px] text-white">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 text-[9px] uppercase font-black pb-2">
                    <th className="py-2.5">Asset</th>
                    <th>Type</th>
                    <th>Network / Rail</th>
                    <th className="text-right">Balance</th>
                    <th className="text-right">USD Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {paginatedAssets.map((asset) => {
                    const balance = balances[asset.symbol] || 0;
                    const usdVal = balance * asset.rate;
                    return (
                      <tr key={asset.symbol} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 flex items-center gap-2">
                          <span className="text-sm bg-white/5 w-6 h-6 rounded-full flex items-center justify-center border border-white/10">{asset.logo}</span>
                          <div>
                            <span className="font-extrabold text-white block">{asset.symbol}</span>
                            <span className="text-[8.5px] text-white/30 block">{asset.name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${asset.type === 'ERC20' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-white/50 border border-white/5'}`}>
                            {asset.type}
                          </span>
                        </td>
                        <td className="py-3">
                          <div>
                            <span className="text-white/80 font-medium block">{asset.network}</span>
                            {asset.contract && (
                              <button 
                                onClick={() => copyToClipboard(asset.contract!, asset.symbol)}
                                className="text-[8px] text-white/30 hover:text-indigo-400 uppercase tracking-widest mt-0.5 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                {copiedField === asset.symbol ? 'Copied Contract' : `Contract: ${asset.contract.substring(0, 6)}...${asset.contract.substring(34)}`}
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-right font-bold text-white">
                          {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right font-black text-indigo-300">
                          ${usdVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalAssetPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-4 text-[9px] text-white/50 font-mono">
                <span>PAGE {activeAssetPage} OF {totalAssetPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAssetPage(p => Math.max(1, p - 1))}
                    disabled={activeAssetPage === 1}
                    className="px-2.5 py-1 rounded bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/[0.03] transition-colors uppercase font-bold cursor-pointer disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetPage(p => Math.min(totalAssetPages, p + 1))}
                    disabled={activeAssetPage === totalAssetPages}
                    className="px-2.5 py-1 rounded bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/[0.03] transition-colors uppercase font-bold cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Deposit/Withdraw Terminal Form (Right Column) */}
        <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">
          <div className="bg-[#09090c] border border-white/5 rounded-xl p-5 space-y-4 font-mono relative overflow-hidden">
            
            {/* Simulation Broadcast Overlay */}
            <AnimatePresence>
              {web3Stage !== 'idle' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#060609]/95 backdrop-blur-md z-30 p-5 flex flex-col justify-between font-mono"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Blockchain Handshake Pipeline</h4>
                      </div>
                      <span className="text-[8px] px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded font-black tracking-widest uppercase">
                        {web3Stage}
                      </span>
                    </div>

                    {/* Progress Console */}
                    <div className="bg-[#020204] border border-white/5 p-3 rounded-lg space-y-1.5 text-[9px] font-mono leading-relaxed h-52 overflow-y-auto">
                      {web3ProgressLog.map((log, index) => (
                        <div key={index} className="text-white/60">
                          <span className="text-indigo-400 font-extrabold mr-1">&gt;</span> {log}
                        </div>
                      ))}
                      {web3Stage === 'estimating' && (
                        <div className="flex items-center gap-2 text-white/30 text-[8px] animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" /> Computing network fees...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Web3 Action Controls */}
                  <div className="pt-3.5 border-t border-white/5 flex gap-2.5">
                    {web3Stage === 'prompting' ? (
                      <>
                        <button 
                          onClick={() => setWeb3Stage('idle')}
                          className="w-1/3 py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white uppercase text-[9px] font-black rounded-lg cursor-pointer transition-colors"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={confirmSigning}
                          className="w-2/3 py-2 bg-indigo-600 hover:bg-indigo-750 text-white uppercase text-[9px] font-black rounded-lg cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5 hover:shadow-indigo-500/10"
                        >
                          <Zap className="w-3.5 h-3.5 text-indigo-300" /> Approve & Sign Tx
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center text-white/40 uppercase text-[9px] font-bold py-2 animate-pulse">
                        Symmetric cryptoprocessor executing pipeline...
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  WITHDRAWAL
                </button>
              </div>
              
              {activeTab === 'withdraw' && (
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-indigo-500/20">
                  Step {withdrawalStep} of 3
                </span>
              )}
            </div>

            {activeTab === 'deposit' ? (
              /* DEPOSIT WORKFLOW */
              <form onSubmit={handleExecuteTransfer} className="space-y-4 font-mono text-xs">
                
                {/* Select Target Asset */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] uppercase text-white/40 block">Select Fiduciary Asset</label>
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full bg-[#040405] border border-white/10 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer uppercase font-bold"
                  >
                    {SUPPORTED_ASSETS.map(asset => (
                      <option key={asset.symbol} value={asset.symbol} className="bg-[#09090c] text-white">
                        {asset.logo} {asset.symbol} - {asset.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Numeric Entry */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] uppercase text-white/40 block">Clearing Amount ({selectedAsset})</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 font-bold">
                      {selectedAsset === 'USD' ? '$' : selectedAsset === 'EUR' ? '€' : selectedAsset === 'GBP' ? '£' : 'Ⓢ'}
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      min="0.1"
                      step="any"
                      className="w-full bg-[#040405] border border-white/10 rounded-lg py-2 pl-10 pr-16 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-indigo-500 font-bold"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9.5px] text-white/30 font-bold">{selectedAsset}</span>
                  </div>
                </div>

                {/* Smart settlement selector based on Asset Type */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] uppercase text-white/40 block">Clearing Channel</label>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {currentAssetDetails?.type === 'ERC20' ? (
                        <Zap className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Landmark className="w-4 h-4 text-emerald-400" />
                      )}
                      <div>
                        <span className="font-extrabold text-white text-[10px] block uppercase">{currentAssetDetails?.network} Rail</span>
                        <span className="text-[8.5px] text-white/30 block">
                          {currentAssetDetails?.type === 'ERC20' ? 'Instant Secure Smart Contract Transfer' : 'Instant Institutional Fiduciary Sweep'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Summary Box */}
                <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-lg space-y-2 font-mono text-[10px]">
                  <div className="text-[9px] text-white/30 uppercase tracking-widest font-black border-b border-white/5 pb-1.5 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-indigo-400" />
                    <span>Clearing Parameters</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-white/40 uppercase">Clearing Time:</span>
                      <span className="text-white font-bold">Instant Settlement</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40 uppercase">Interoperability Fee:</span>
                      <span className="text-white font-bold">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40 uppercase">Credit Destination:</span>
                      <span className="text-indigo-400 font-bold">{selectedAsset} Liquid Balance</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase rounded-lg shadow-md tracking-wider cursor-pointer transition-all text-center flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> PROVISIONING BALANCES...
                    </>
                  ) : (
                    currentAssetDetails?.type === 'ERC20' ? 'INJECT STABLECOIN COLLATERAL' : 'SWEEP FIAT BALANCE'
                  )}
                </button>
              </form>
            ) : (
              /* WITHDRAWAL PROCESSOR */
              <div className="space-y-4">
                
                {/* Step indicators */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-1 text-[9px] font-mono font-black text-white/40">
                  <span className={withdrawalStep >= 1 ? 'text-white' : ''}>1. AMOUNT</span>
                  <span className="h-px bg-white/5 flex-1 mx-2" />
                  <span className={withdrawalStep >= 2 ? 'text-white' : ''}>2. ROUTING</span>
                  <span className="h-px bg-white/5 flex-1 mx-2" />
                  <span className={withdrawalStep >= 3 ? 'text-white' : ''}>3. EXECUTION</span>
                </div>

                {withdrawalStep === 1 && (
                  <div className="space-y-4 animate-fadeIn text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] uppercase text-white/40 block">Fiduciary Asset Outflow</label>
                      <select
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                        className="w-full bg-[#040405] border border-white/10 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer uppercase font-bold"
                      >
                        {SUPPORTED_ASSETS.map(asset => (
                          <option key={asset.symbol} value={asset.symbol}>
                            {asset.logo} {asset.symbol} - Bal: {(balances[asset.symbol] || 0).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9.5px] uppercase text-white/40 block">Withdrawal Quantity</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 font-bold">
                          {selectedAsset === 'USD' ? '$' : selectedAsset === 'EUR' ? '€' : selectedAsset === 'GBP' ? '£' : 'Ⓢ'}
                        </span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          min="0.1"
                          step="any"
                          className="w-full bg-[#040405] border border-white/10 rounded-lg py-2 pl-10 pr-16 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-indigo-500 font-bold"
                          required
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const amount = parseFloat(transferAmount);
                        if (isNaN(amount) || amount <= 0) {
                          alert('Please enter a valid withdrawal amount.');
                          return;
                        }
                        const currentBal = balances[selectedAsset] || 0;
                        if (amount > currentBal) {
                          alert(`Insufficient ${selectedAsset} balance to withdraw.`);
                          return;
                        }
                        setWithdrawalStep(2);
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase rounded-lg transition-all cursor-pointer"
                    >
                      SPECIFY ROUTING
                    </button>
                  </div>
                )}

                {withdrawalStep === 2 && (
                  <div className="space-y-4 animate-fadeIn text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] uppercase text-white/40 block">
                        {currentAssetDetails?.type === 'ERC20' ? 'Target Web3 ERC20 Wallet Address' : 'Fiduciary Bank Account Credentials'}
                      </label>
                      <input
                        type="text"
                        placeholder={currentAssetDetails?.type === 'ERC20' ? '0x...' : 'Routing / Account Detail or Phone Number'}
                        value={destWalletAddress}
                        onChange={(e) => setDestWalletAddress(e.target.value)}
                        className="w-full bg-[#040405] border border-white/10 rounded-lg py-2.5 px-3 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-indigo-500 font-bold"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setWithdrawalStep(1)}
                        className="w-1/3 py-2 bg-white/5 hover:bg-white/10 text-white/50 uppercase rounded-lg cursor-pointer font-bold"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          if (!destWalletAddress.trim()) {
                            alert('Please specify the destination details.');
                            return;
                          }
                          setWithdrawalStep(3);
                        }}
                        className="w-2/3 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase rounded-lg cursor-pointer"
                      >
                        REVIEW OUTFLOW
                      </button>
                    </div>
                  </div>
                )}

                {withdrawalStep === 3 && (
                  <div className="space-y-4 animate-fadeIn text-xs">
                    <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-lg space-y-2">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-white/40 uppercase text-[9px]">Quantity</span>
                        <span className="font-extrabold text-white">{transferAmount} {selectedAsset}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-white/40 uppercase text-[9px]">Method</span>
                        <span className="font-extrabold text-white">{currentAssetDetails?.network}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40 uppercase text-[9px]">Target</span>
                        <span className="font-extrabold text-indigo-400 truncate w-32 text-right">{destWalletAddress}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setWithdrawalStep(2)}
                        className="w-1/3 py-2 bg-white/5 hover:bg-white/10 text-white/50 uppercase rounded-lg cursor-pointer font-bold"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleExecuteTransfer}
                        disabled={loading}
                        className="w-2/3 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        {loading ? <RefreshCw className="w-3 animate-spin" /> : 'CONFIRM OUTFLOW'}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>

      </div>

      {/* SECTION 4: Audited Ledger Logs */}
      <div className="bg-[#09090c] border border-white/5 rounded-xl p-5 font-mono">
        <div className="border-b border-white/5 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Cryptographically Audited Activity</h4>
            <p className="text-[8.5px] text-white/30 uppercase mt-0.5 font-bold">Ledger Logs and Settlement Receipts</p>
          </div>
          <span className="text-[8px] px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold rounded">
            TOTAL TRANSFERS: {txs.length}
          </span>
        </div>

        <div className="space-y-2">
          {txs.length === 0 ? (
            <div className="text-center py-12 text-white/20 text-[10px] uppercase font-bold">
              No transactions detected in secure log.
            </div>
          ) : (
            paginatedTxs.map((tx) => {
              const isCrypto = ['USDC', 'USDT', 'PYUSD'].includes(tx.currency);
              return (
                <div 
                  key={tx.id} 
                  className="bg-white/[0.01] border border-white/5 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-[10px]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {tx.type === 'DEPOSIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white uppercase">{tx.method}</span>
                        <span className={`px-1.5 py-0.2 rounded-[3px] text-[7.5px] font-black ${
                          tx.status === 'Settled' ? 'bg-emerald-500/10 text-emerald-400' :
                          tx.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-white/30 text-[8.5px] mt-0.5 flex items-center gap-1">
                        <span>Cleared on {tx.date}</span>
                        {isCrypto && tx.txHash && (
                          <>
                            <span className="text-white/10">•</span>
                            <span className="text-indigo-400 font-mono">Hash: {tx.txHash.substring(0, 10)}...</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between md:justify-end">
                    <div className="text-right">
                      <span className={`font-black text-xs block ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {tx.currency}
                      </span>
                    </div>
                    {isCrypto && tx.txHash && (
                      <button 
                        onClick={() => setInspectorTx(tx)}
                        className="py-1 px-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 rounded-md transition-colors font-black uppercase text-[8.5px] flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Inspect Tx
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalActivityPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-4 text-[9px] text-white/50 font-mono">
            <span>PAGE {activeActivityPage} OF {totalActivityPages}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                disabled={activeActivityPage === 1}
                className="px-2.5 py-1 rounded bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/[0.03] transition-colors uppercase font-bold cursor-pointer disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))}
                disabled={activeActivityPage === totalActivityPages}
                className="px-2.5 py-1 rounded bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/[0.03] transition-colors uppercase font-bold cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Block Explorer Custom Inspector Terminal */}
      <AnimatePresence>
        {inspectorTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectorTx(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-xl bg-[#09090c] border border-white/10 rounded-xl p-5 font-mono text-xs z-55 max-h-[90vh] overflow-y-auto"
            >
              <div className="border-b border-white/5 pb-3 mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" /> Decoded Blockchain Receipt
                  </h3>
                  <p className="text-[9px] text-white/30 uppercase mt-0.5">Distributed Ledger Block Analyzer</p>
                </div>
                <button 
                  onClick={() => setInspectorTx(null)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-white/50 hover:text-white uppercase cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              <div className="space-y-3.5 leading-relaxed text-[10px]">
                
                {/* Visual Header */}
                <div className="bg-[#040405] border border-white/5 p-4 rounded-lg space-y-2 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-white/30 uppercase block">Settlement Status</span>
                    <span className="font-black text-emerald-400 text-sm flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-400" /> SUCCESSFUL
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-white/30 uppercase block">Outflow Amount</span>
                    <span className="font-mono text-white text-base font-black">
                      {inspectorTx.amount.toLocaleString()} {inspectorTx.currency}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-3 py-1.5 border-b border-white/[0.03]">
                    <span className="text-white/30 uppercase">Transaction ID</span>
                    <span className="col-span-2 text-white font-bold select-all break-all">{inspectorTx.id}</span>
                  </div>

                  <div className="grid grid-cols-3 py-1.5 border-b border-white/[0.03]">
                    <span className="text-white/30 uppercase">Tx Hash (mempool)</span>
                    <span className="col-span-2 text-indigo-400 font-bold select-all break-all">{inspectorTx.txHash}</span>
                  </div>

                  <div className="grid grid-cols-3 py-1.5 border-b border-white/[0.03]">
                    <span className="text-white/30 uppercase">Stablecoin Contract</span>
                    <span className="col-span-2 text-white font-bold truncate">
                      {SUPPORTED_ASSETS.find(a => a.symbol === inspectorTx.currency)?.contract || 'Unknown contract address'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 py-1.5 border-b border-white/[0.03]">
                    <span className="text-white/30 uppercase">Clearing Network</span>
                    <span className="col-span-2 text-white font-extrabold text-indigo-300">
                      {SUPPORTED_ASSETS.find(a => a.symbol === inspectorTx.currency)?.network || 'Crypto Chain'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 py-1.5 border-b border-white/[0.03]">
                    <span className="text-white/30 uppercase">Target Address</span>
                    <span className="col-span-2 text-white font-mono break-all font-bold">
                      {inspectorTx.walletAddress || walletDetails.ethAddress}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 py-1.5 border-b border-white/[0.03]">
                    <span className="text-white/30 uppercase">Network Gas Limit</span>
                    <span className="col-span-2 text-white font-bold">
                      {inspectorTx.gasUsed ? (inspectorTx.gasUsed + 12500).toLocaleString() : 'N/A'} units
                    </span>
                  </div>

                  <div className="grid grid-cols-3 py-1.5 border-b border-white/[0.03]">
                    <span className="text-white/30 uppercase">Gas Price (Gwei)</span>
                    <span className="col-span-2 text-white font-bold font-mono">
                      {inspectorTx.gasPriceGwei || 'N/A'} Gwei
                    </span>
                  </div>

                  <div className="grid grid-cols-3 py-1.5 border-b border-white/[0.03]">
                    <span className="text-white/30 uppercase">Consensus Cost</span>
                    <span className="col-span-2 text-white font-bold">
                      {inspectorTx.gasUsed && inspectorTx.gasPriceGwei ? (
                        <span>
                          {((inspectorTx.gasUsed * inspectorTx.gasPriceGwei) / 1e9).toFixed(6)} ETH
                          <span className="text-white/30 font-normal ml-1">
                            (~${((inspectorTx.gasUsed * inspectorTx.gasPriceGwei * 3420) / 1e9).toFixed(2)})
                          </span>
                        </span>
                      ) : 'Free / Subsidized'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex gap-2 justify-end">
                  <a 
                    href={SUPPORTED_ASSETS.find(a => a.symbol === inspectorTx.currency)?.explorer ? `${SUPPORTED_ASSETS.find(a => a.symbol === inspectorTx.currency)?.explorer}/tx/${inspectorTx.txHash}` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase text-[9px] cursor-pointer flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View on Live Explorer
                  </a>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    <h5 className="text-sm font-black text-white uppercase tracking-wider">Connect Global Wallet Rail</h5>
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
                      className="w-full flex items-center justify-between p-3 bg-[#09090c] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg text-left transition-all cursor-pointer"
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
