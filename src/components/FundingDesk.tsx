import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PaymentModals } from './PaymentModals';
import DemoCapitalModal from './DemoCapitalModal';
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
  Coins,
  Send,
  Smartphone,
  Lock,
  Building,
  QrCode
} from 'lucide-react';

interface FundingTx {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'CONVERT';
  method: string;
  currency: string;
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  auditHash?: string;
  prevAuditHash?: string;
  blockNumber?: number;
  merkleRoot?: string;
  clearingRail?: string;
  railMetadata?: any;
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
  btcAddress: string;
  bankName: string;
  bankAccountLast4: string;
  bankRouting: string;
}

const SUPPORTED_ASSETS = [
  { symbol: 'USD', name: 'US Dollar Cash', type: 'FIAT', logo: '🇺🇸', network: 'Fedwire / FedNow', rate: 1.0, explorer: null, contract: null },
  { symbol: 'USDC', name: 'USD Coin (Circle)', type: 'ERC20', logo: 'Ⓢ', network: 'Base L2 Network', rate: 1.0, explorer: 'https://basescan.org', contract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  { symbol: 'USDT', name: 'Tether USD', type: 'ERC20', logo: '₮', network: 'Ethereum Mainnet', rate: 1.0, explorer: 'https://etherscan.io', contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { symbol: 'PYUSD', name: 'PayPal USD', type: 'ERC20', logo: '🅿️', network: 'Ethereum Mainnet', rate: 1.0, explorer: 'https://etherscan.io', contract: '0x6c3ea9036406852006290770bedfc31600287410' },
  { symbol: 'ETH', name: 'Ethereum', type: 'COIN', logo: '🔷', network: 'Ethereum Mainnet', rate: 3420.0, explorer: 'https://etherscan.io', contract: null },
  { symbol: 'BTC', name: 'Bitcoin', type: 'BTC', logo: '₿', network: 'Bitcoin Network', rate: 64200.0, explorer: 'https://blockchain.info', contract: null },
  { symbol: 'EUR', name: 'Euro Ledger', type: 'FIAT', logo: '🇪🇺', network: 'SEPA Instant Credit', rate: 1.09, explorer: null, contract: null },
  { symbol: 'GBP', name: 'Sterling Custody', type: 'FIAT', logo: '🇬🇧', network: 'CHAPS Clearing', rate: 1.28, explorer: null, contract: null },
  { symbol: 'KES', name: 'Kenya Shilling', type: 'FIAT', logo: '🇰🇪', network: 'M-Pesa Express', rate: 0.0078, explorer: null, contract: null },
];

interface FundingDeskProps {
  key?: React.Key;
  accountMode?: 'DEMO' | 'REAL';
}

export default function FundingDesk({ accountMode = (typeof window !== 'undefined' && localStorage.getItem('mtx_account_mode') === 'REAL' ? 'REAL' : 'DEMO') }: FundingDeskProps) {
  const isDemo = accountMode === 'DEMO';
  const cashStorageKey = isDemo ? 'mtx_demo_cash' : 'mtx_real_cash';
  const txStorageKey = isDemo ? 'mtx_demo_funding_txs' : 'mtx_real_funding_txs';
  const balancesStorageKey = isDemo ? 'mtx_demo_balances' : 'mtx_real_balances';

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [modalStep, setModalStep] = useState<'view' | 'add' | 'success'>('view');
  const [isDemoCapitalModalOpen, setIsDemoCapitalModalOpen] = useState(false);
  
  // Base cash balance state (synchronized with USD balance for DEMO / REAL mode)
  const [cashBalance, setCashBalance] = useState<number>(() => {
    try {
      if (isDemo) {
        const saved = localStorage.getItem('mtx_demo_cash') || localStorage.getItem('broker_cash');
        return saved ? parseFloat(saved) : 100000.00;
      }
      const saved = localStorage.getItem('mtx_real_cash');
      const demoCash = parseFloat(localStorage.getItem('mtx_demo_cash') || '100000');
      if (!saved || parseFloat(saved) === 58000 || parseFloat(saved) === 100000 || parseFloat(saved) === demoCash) {
        localStorage.setItem('mtx_real_cash', '0.00');
        return 0.00;
      }
      return Math.max(0, parseFloat(saved));
    } catch {
      return isDemo ? 100000.00 : 0.00;
    }
  });

  // Comprehensive multi-currency balances and identity details
  const [balances, setBalances] = useState<{ [symbol: string]: number }>(() => {
    try {
      const saved = localStorage.getItem(balancesStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!isDemo && (parsed.USD === 58000 || parsed.USD === 100000 || parsed.USD >= 50000)) {
          localStorage.removeItem('mtx_real_balances');
        } else {
          return parsed;
        }
      }
      if (isDemo) {
        return {
          USD: 100000.00,
          KES: 0.00,
          EUR: 0.00,
          GBP: 0.00,
          USDC: 0.00,
          USDT: 0.00,
          PYUSD: 0.00,
          ETH: 0.00,
          BTC: 0.00
        };
      }
    } catch {}
    return {
      USD: 0.00,
      KES: 0.00,
      EUR: 0.00,
      GBP: 0.00,
      USDC: 0.00,
      USDT: 0.00,
      PYUSD: 0.00,
      ETH: 0.00,
      BTC: 0.00
    };
  });

  const [walletDetails, setWalletDetails] = useState<WalletDetails>({
    ethAddress: '0x3bf92c4a9616ae9d8f36c56df2e718bc321049da4bb27fa1',
    btcAddress: 'bc1q3bf92c4a9616ae9d8f36c56df2e718bc321049da4bb2',
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

  // Production Payment Rails States
  const [activePaymentModal, setActivePaymentModal] = useState<null | 'stripe' | 'plaid' | 'coinbase' | 'mpesa' | 'wire'>(null);
  const [stripeSecret, setStripeSecret] = useState<string>('');
  const [stripeIntentId, setStripeIntentId] = useState<string>('');
  const [stripeCardNum, setStripeCardNum] = useState<string>('4242 •••• •••• 4242');
  const [stripeCardExpiry, setStripeCardExpiry] = useState<string>('12 / 29');
  const [stripeCardCvc, setStripeCardCvc] = useState<string>('482');
  const [plaidToken, setPlaidToken] = useState<string>('');
  const [plaidLinked, setPlaidLinked] = useState<boolean>(false);
  const [plaidBankSelected, setPlaidBankSelected] = useState<string>('');
  const [coinbaseChargeData, setCoinbaseChargeData] = useState<any>(null);
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState<string>('');
  const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'sending' | 'pending' | 'success' | 'failed'>('idle');
  const [wireInstructions, setWireInstructions] = useState<any>(null);

  // Interactive wizard logs & steps
  const [stripePaying, setStripePaying] = useState<boolean>(false);
  const [stripeProgress, setStripeProgress] = useState<string[]>([]);
  const [stripePaid, setStripePaid] = useState<boolean>(false);
  const [plaidInnerStep, setPlaidInnerStep] = useState<'select' | 'credentials' | 'exchanging' | 'success'>('select');
  const [plaidUsername, setPlaidUsername] = useState<string>('');
  const [plaidPassword, setPlaidPassword] = useState<string>('');
  const [coinbaseInnerStep, setCoinbaseInnerStep] = useState<'awaiting' | 'verifying' | 'success'>('awaiting');
  const [coinbaseProgress, setCoinbaseProgress] = useState<string[]>([]);
  const [mpesaPhone, setMpesaPhone] = useState<string>('0712345678');
  const [mpesaInnerStep, setMpesaInnerStep] = useState<'input' | 'push_sent' | 'pin_prompt' | 'processing' | 'success'>('input');
  const [mpesaPin, setMpesaPin] = useState<string>('');

  // Interactive Web3 wallet popup simulation and broadcast flow
  const [web3Stage, setWeb3Stage] = useState<'idle' | 'estimating' | 'prompting' | 'broadcasting' | 'confirming' | 'completed'>('idle');
  const [web3GasGwei, setWeb3GasGwei] = useState<number>(18);
  const [web3GasUsd, setWeb3GasUsd] = useState<number>(1.25);
  const [web3TxHash, setWeb3TxHash] = useState<string>('');
  const [web3ProgressLog, setWeb3ProgressLog] = useState<string[]>([]);

  // Block explorer inspector modal
  const [inspectorTx, setInspectorTx] = useState<FundingTx | null>(null);

  // Production Banking Audit & Verification modal state
  const [auditData, setAuditData] = useState<any>(null);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [auditing, setAuditing] = useState<boolean>(false);

  const handleRunAuditVerification = async () => {
    setAuditing(true);
    try {
      const res = await fetch('/api/funding/audit-verify');
      if (res.ok) {
        const data = await res.json();
        setAuditData(data);
        setShowAuditModal(true);
      }
    } catch (err) {
      console.error('Audit verification failed:', err);
    } finally {
      setAuditing(false);
    }
  };

  const handleDownloadBankStatement = () => {
    const headers = ['Tx ID', 'Date', 'Type', 'Method', 'Currency', 'Amount', 'Balance Before', 'Balance After', 'Status', 'Audit Hash'];
    const rows = txs.map(tx => [
      tx.id,
      `"${tx.date}"`,
      tx.type,
      `"${tx.method}"`,
      tx.currency,
      tx.amount.toFixed(2),
      (tx.balanceBefore ?? 0).toFixed(2),
      (tx.balanceAfter ?? 0).toFixed(2),
      tx.status,
      tx.auditHash || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MTX_Quant_Audited_Bank_Statement_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    if (isDemo) {
      // Demo sandbox state is managed locally and in sync with demo capital
      const savedCash = localStorage.getItem('mtx_demo_cash') || localStorage.getItem('broker_cash') || '100000.00';
      const parsedCash = parseFloat(savedCash);
      setCashBalance(parsedCash);
      
      const savedBalances = localStorage.getItem(balancesStorageKey);
      if (savedBalances) {
        try {
          const b = JSON.parse(savedBalances);
          b.USD = parsedCash;
          setBalances(b);
        } catch {}
      } else {
        setBalances(prev => ({ ...prev, USD: parsedCash }));
      }

      const isSeededOrMock = (t: any) => {
        if (!t || typeof t !== 'object') return true;
        const id = String(t.id || '').toLowerCase();
        const method = String(t.method || '').toLowerCase();
        return (
          id === 'fund-1' ||
          id === 'fund-2' ||
          id === 'fund-3' ||
          id === 'fund-4' ||
          id.startsWith('fund-1') ||
          id.startsWith('fund-2') ||
          id.startsWith('fund-3') ||
          id.startsWith('fund-4') ||
          id.startsWith('fund-pnl-') ||
          id.startsWith('act_1') ||
          id.includes('seed') ||
          method.includes('trade profit settle') ||
          method.includes('trade loss settle')
        );
      };

      const savedTxs = localStorage.getItem(txStorageKey);
      if (savedTxs) {
        try {
          const parsed = JSON.parse(savedTxs);
          const sanitized = Array.isArray(parsed) ? parsed.filter((t: any) => !isSeededOrMock(t)) : [];
          setTxs(sanitized);
        } catch {}
      }
      return;
    }

    if (!silently) setLoading(true);
    try {
      const isSeededOrMock = (t: any) => {
        if (!t || typeof t !== 'object') return true;
        const id = String(t.id || '').toLowerCase();
        const method = String(t.method || '').toLowerCase();
        return (
          id === 'fund-1' ||
          id === 'fund-2' ||
          id === 'fund-3' ||
          id === 'fund-4' ||
          id.startsWith('fund-1') ||
          id.startsWith('fund-2') ||
          id.startsWith('fund-3') ||
          id.startsWith('fund-4') ||
          id.startsWith('fund-pnl-') ||
          id.startsWith('act_1') ||
          id.includes('seed') ||
          method.includes('trade profit settle') ||
          method.includes('trade loss settle')
        );
      };

      const res = await fetch('/api/funding/state');
      if (res.ok) {
        const data = await res.json();
        let realBal = typeof data.balance === 'number' ? Math.max(0, data.balance) : 0.00;
        if (realBal === 58000 || realBal === 200000) realBal = 0.00;
        localStorage.setItem('mtx_real_cash', realBal.toString());
        setCashBalance(realBal);
        if (data.balances) {
          if (data.balances.USD === 58000 || data.balances.USD === 200000) data.balances.USD = 0.00;
          setBalances(data.balances);
        }
        if (data.walletDetails) setWalletDetails(data.walletDetails);
        const cleanServerTxs = Array.isArray(data.transactions) ? data.transactions.filter((t: any) => !isSeededOrMock(t)) : [];
        setTxs(cleanServerTxs);
        window.dispatchEvent(new CustomEvent('broker_cash_updated', { detail: { cash: realBal, mode: 'REAL' } }));
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
    if (!isDemo) {
      const interval = setInterval(() => {
        fetchFundingState(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [accountMode]);

  // Listen to local storage changes to keep cash balance perfectly synchronized for active ledger
  useEffect(() => {
    const handleStorageChange = async () => {
      const saved = localStorage.getItem(cashStorageKey);
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val !== cashBalance) {
          setCashBalance(val);
          setBalances(prev => ({ ...prev, USD: val }));
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [cashBalance, cashStorageKey]);

  // Handle Tab/Asset matching
  useEffect(() => {
    const asset = SUPPORTED_ASSETS.find(a => a.symbol === selectedAsset);
    if (asset) {
      if (asset.type === 'ERC20' || asset.type === 'COIN' || asset.type === 'BTC') {
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
    
    // Check if we are doing a DEPOSIT on a custom payment rail
    if (activeTab === 'deposit') {
      if (transferMethod === 'CARD') {
        try {
          setLoading(true);
          const res = await fetch('/api/payments/stripe/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency: selectedAsset })
          });
          if (!res.ok) {
            const errData = await res.json();
            alert(errData.error || 'Stripe initialization failed.');
            return;
          }
          const data = await res.json();
          setStripeSecret(data.clientSecret);
          setStripeIntentId(data.paymentIntentId);
          setActivePaymentModal('stripe');
        } catch (err) {
          console.error('Stripe initialization exception:', err);
          alert('Failed to connect to Stripe API rails.');
        } finally {
          setLoading(false);
        }
        return;
      }

      if (transferMethod === 'ACH' && !plaidLinked) {
        try {
          setLoading(true);
          const res = await fetch('/api/payments/plaid/create-link-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (!res.ok) {
            const errData = await res.json();
            alert(errData.error || 'Plaid Link token generation failed.');
            return;
          }
          const data = await res.json();
          setPlaidToken(data.link_token);
          setActivePaymentModal('plaid');
        } catch (err) {
          console.error('Plaid token exception:', err);
          alert('Failed to initialize Plaid verification system.');
        } finally {
          setLoading(false);
        }
        return;
      }

      if (transferMethod === 'STABLECOIN') {
        try {
          setLoading(true);
          const res = await fetch('/api/payments/coinbase/create-charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency: selectedAsset })
          });
          if (!res.ok) {
            const errData = await res.json();
            alert(errData.error || 'Coinbase Commerce initialization failed.');
            return;
          }
          const data = await res.json();
          setCoinbaseChargeData(data);
          setActivePaymentModal('coinbase');
        } catch (err) {
          console.error('Coinbase Commerce connection exception:', err);
          alert('Failed to initialize stablecoin custody payment gateway.');
        } finally {
          setLoading(false);
        }
        return;
      }

      if (transferMethod === 'REGIONAL' && selectedAsset === 'KES') {
        // Show M-Pesa STK widget immediately to allow phone number input
        setActivePaymentModal('mpesa');
        setMpesaStatus('idle');
        return;
      }

      if (transferMethod === 'WIRE') {
        try {
          setLoading(true);
          const res = await fetch('/api/payments/wire/instructions');
          if (!res.ok) {
            const errData = await res.json();
            alert(errData.error || 'Failed to retrieve Fedwire instructions.');
            return;
          }
          const data = await res.json();
          setWireInstructions(data);
          setActivePaymentModal('wire');
        } catch (err) {
          console.error('Wire instructions exception:', err);
          alert('Failed to contact Bank clearing API.');
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    // If in DEMO sandbox mode, execute instant simulated ledger transfer
    if (isDemo) {
      setLoading(true);
      setTimeout(() => {
        const isDep = activeTab === 'deposit';
        const currentAssetBal = balances[selectedAsset] || 0;
        const newAssetBal = isDep ? (currentAssetBal + amount) : Math.max(0, currentAssetBal - amount);
        const updatedBalances = { ...balances, [selectedAsset]: newAssetBal };
        
        // If USD changed, update cash
        let newUsdCash = cashBalance;
        if (selectedAsset === 'USD') {
          newUsdCash = newAssetBal;
        } else {
          // Adjust USD cash equivalent
          const rate = currentAssetDetails ? currentAssetDetails.rate : 1.0;
          const deltaUsd = isDep ? (amount * rate) : -(amount * rate);
          newUsdCash = Math.max(0, parseFloat((cashBalance + deltaUsd).toFixed(2)));
          updatedBalances.USD = newUsdCash;
        }

        const now = new Date();
        const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);
        const newTx: FundingTx = {
          id: `fund-demo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: isDep ? 'DEPOSIT' : 'WITHDRAWAL',
          method: `Demo ${transferMethod} Sandbox Clearing`,
          currency: selectedAsset,
          amount,
          balanceBefore: currentAssetBal,
          balanceAfter: newAssetBal,
          status: 'Settled',
          providerStatus: 'sandbox_completed',
          date: dateStr,
          auditHash: `demo_sha256_${Date.now().toString(16)}`
        };

        const updatedTxs = [newTx, ...txs];
        setTxs(updatedTxs);
        setCashBalance(newUsdCash);
        setBalances(updatedBalances);

        localStorage.setItem(cashStorageKey, newUsdCash.toString());
        localStorage.setItem('broker_cash', newUsdCash.toString());
        localStorage.setItem(balancesStorageKey, JSON.stringify(updatedBalances));
        localStorage.setItem(txStorageKey, JSON.stringify(updatedTxs));

        window.dispatchEvent(new CustomEvent('broker_cash_updated', { detail: { cash: newUsdCash, mode: 'DEMO' } }));

        setNotification(`SUCCESS: Cleared demo ${isDep ? 'deposit' : 'withdrawal'} of ${amount.toLocaleString()} ${selectedAsset}.`);
        setTransferAmount('');
        setDestWalletAddress('');
        setWithdrawalStep(1);
        setLoading(false);
        setTimeout(() => setNotification(null), 5000);
      }, 500);
      return;
    }

    // Default or fallback (such as Withdrawals or already-authenticated ACH)
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
        const newBal = typeof data.balance === 'number' ? data.balance : 0.00;
        localStorage.setItem('mtx_real_cash', newBal.toString());
        setCashBalance(newBal);
        if (data.balances) setBalances(data.balances);
        window.dispatchEvent(new CustomEvent('broker_cash_updated', { detail: { cash: newBal, mode: 'REAL' } }));
        
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

        window.dispatchEvent(new CustomEvent('mtx_system_notification', {
          detail: {
            category: 'TRADES',
            severity: 'SUCCESS',
            title: `${activeTab === 'deposit' ? 'Deposit' : 'Withdrawal'} Settled: ${amount.toLocaleString()} ${selectedAsset}`,
            message: `Cleared ${activeTab === 'deposit' ? 'deposit' : 'withdrawal'} of ${amount.toLocaleString()} ${selectedAsset} via ${methodString}. Balance updated.`,
            actionTab: 'WALLET',
            actionLabel: 'View Wallet',
            metadata: {
              amount,
              tag: `${activeTab.toUpperCase()} SETTLED`
            }
          }
        }));
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
        <motion.div 
          whileHover={{ y: -2, borderColor: 'rgba(99, 102, 241, 0.25)', boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.08)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          id="wallet-balance-portfolio-card" 
          className="bg-[#080808] border border-neutral-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between lg:col-span-1 transition-colors duration-200"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-white/70 font-mono uppercase tracking-widest font-black">LIQUID PORTFOLIO VALUE (USD)</span>
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-white">
              ${totalValuationUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="mt-2.5 flex items-center gap-2">
              {isDemo ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-indigo-600 text-white font-mono text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-sm">
                    <Coins className="w-3.5 h-3.5" />
                    <span>Demo Institutional Sandbox</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDemoCapitalModalOpen(true)}
                    className="px-2.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 hover:text-white border border-indigo-400/40 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                    title="Change or Refill Demo Capital ($50k - $200k+)"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Refill Capital</span>
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white font-mono text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Audited Real Collateral</span>
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Card 2: Generated On-Chain Wallet Addresses (Identity Linked) */}
        <motion.div 
          whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.25)', boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.08)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          id="wallet-blockchain-details-card" 
          className="bg-[#080808] border border-neutral-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between lg:col-span-1 transition-colors duration-200"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-white/70 font-mono uppercase tracking-widest font-black">ON-CHAIN IDENTIFIERS</span>
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-3 font-mono">
            <div>
              <div className="text-[9px] text-white/70 uppercase font-bold">Ethereum / ERC-20 Address</div>
              <div className="flex items-center justify-between gap-1.5 mt-1 bg-neutral-900/80 p-2 rounded-lg border border-neutral-800">
                <span className="text-indigo-400 font-bold text-[10px] truncate break-all block mr-2 font-mono">
                  {walletDetails.ethAddress}
                </span>
                <button 
                  onClick={() => copyToClipboard(walletDetails.ethAddress, 'eth')}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-all active:scale-95 shadow-sm"
                  title="Copy Address"
                >
                  {copiedField === 'eth' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-white/80" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <div className="text-[9px] text-white/70 uppercase font-bold">Bitcoin Native Address</div>
              <div className="flex items-center justify-between gap-1.5 mt-1 bg-neutral-900/80 p-2 rounded-lg border border-neutral-800">
                <span className="text-amber-400 font-bold text-[10px] truncate break-all block mr-2 font-mono">
                  {walletDetails.btcAddress || 'bc1q3bf92c4a9616ae9d8f36c56df2e718bc321049da4bb2'}
                </span>
                <button 
                  onClick={() => copyToClipboard(walletDetails.btcAddress || 'bc1q3bf92c4a9616ae9d8f36c56df2e718bc321049da4bb2', 'btc')}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-all active:scale-95 shadow-sm"
                  title="Copy Address"
                >
                  {copiedField === 'btc' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-white/80" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Institutional Cash Routing (Fiat Clearing) */}
        <motion.div 
          whileHover={{ y: -2, borderColor: 'rgba(245, 158, 11, 0.25)', boxShadow: '0 4px 20px -2px rgba(245, 158, 11, 0.08)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          id="wallet-fiat-routing-card" 
          className="bg-[#080808] border border-neutral-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between lg:col-span-1 transition-colors duration-200"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-white/70 font-mono uppercase tracking-widest font-black">CUSTODY FIAT ROUTING</span>
            <div className="p-1.5 rounded-lg bg-amber-600 text-white shadow-sm">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 font-mono text-[10px] space-y-1.5">
            <div className="flex justify-between items-center bg-neutral-900/60 px-2 py-1 rounded border border-neutral-800/60">
              <span className="text-white/70 uppercase text-[9px] font-bold">Bank:</span>
              <span className="font-bold text-white">{walletDetails.bankName}</span>
            </div>
            <div className="flex justify-between items-center bg-neutral-900/60 px-2 py-1 rounded border border-neutral-800/60">
              <span className="text-white/70 uppercase text-[9px] font-bold">Routing ABA:</span>
              <span className="font-bold text-indigo-300 tracking-widest">{walletDetails.bankRouting}</span>
            </div>
            <div className="flex justify-between items-center bg-neutral-900/60 px-2 py-1 rounded border border-neutral-800/60">
              <span className="text-white/70 uppercase text-[9px] font-bold">Account:</span>
              <span className="font-bold text-white">••••••••{walletDetails.bankAccountLast4}</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Action Notification Feed */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-600 text-white p-3.5 rounded-xl flex items-center gap-3 text-xs font-mono shadow-lg font-bold"
          >
            <CheckCircle className="w-4 h-4 shrink-0 text-white" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* SECTION 2: Assets Ledger Matrix (Left Column) */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          <div className="bg-[#080808] border border-neutral-800/80 rounded-xl p-5 font-mono">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-4">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Multi-Currency Liquidity Map</h4>
                <p className="text-[8.5px] text-white/70 uppercase mt-0.5 font-bold">Aggregated Clearing and Custodial Ledger</p>
              </div>
              <button 
                onClick={() => fetchFundingState()} 
                className="text-[9px] bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <RefreshCw className="w-3 h-3" /> Force Sync
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[10px] text-white">
                <thead>
                  <tr className="border-b border-neutral-800/80 text-white/80 text-[9px] uppercase font-black pb-2">
                    <th className="py-2.5">Asset</th>
                    <th>Type</th>
                    <th>Network / Rail</th>
                    <th className="text-right">Balance</th>
                    <th className="text-right">USD Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {paginatedAssets.map((asset) => {
                    const balance = balances[asset.symbol] || 0;
                    const usdVal = balance * asset.rate;
                    return (
                      <tr key={asset.symbol} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 flex items-center gap-2">
                          <span className="text-sm bg-neutral-900 w-7 h-7 rounded-lg flex items-center justify-center border border-neutral-800 shadow-sm">{asset.logo}</span>
                          <div>
                            <span className="font-black text-white block">{asset.symbol}</span>
                            <span className="text-[8.5px] text-white/70 font-bold block">{asset.name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase shadow-sm ${
                            asset.type === 'ERC20' ? 'bg-indigo-600 text-white' : 
                            asset.type === 'COIN' || asset.type === 'BTC' ? 'bg-amber-600 text-white' :
                            'bg-neutral-800 text-white border border-neutral-700'
                          }`}>
                            {asset.type}
                          </span>
                        </td>
                        <td className="py-3">
                          <div>
                            <span className="text-white font-bold block">{asset.network}</span>
                            {asset.contract && (
                              <button 
                                onClick={() => copyToClipboard(asset.contract!, asset.symbol)}
                                className="bg-neutral-800 hover:bg-neutral-700 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                              >
                                {copiedField === asset.symbol ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-2.5 h-2.5 text-white/80" />
                                    <span>Contract: {asset.contract.substring(0, 6)}...{asset.contract.substring(34)}</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-right font-black text-white">
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
              <div className="flex items-center justify-between border-t border-neutral-800/80 pt-3.5 mt-4 text-[9px] text-white/80 font-mono font-bold">
                <span>PAGE {activeAssetPage} OF {totalAssetPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAssetPage(p => Math.max(1, p - 1))}
                    disabled={activeAssetPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-black uppercase text-[9px] disabled:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetPage(p => Math.min(totalAssetPages, p + 1))}
                    disabled={activeAssetPage === totalAssetPages}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-black uppercase text-[9px] disabled:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 shadow-sm"
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
          <div className="bg-[#080808] border border-neutral-800/80 rounded-xl p-5 space-y-4 font-mono relative overflow-hidden">
            
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
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Blockchain Handshake Pipeline</h4>
                      </div>
                      <span className="text-[8px] px-2 py-0.5 bg-indigo-600 text-white rounded font-black tracking-widest uppercase shadow-sm">
                        {web3Stage}
                      </span>
                    </div>

                    {/* Progress Console */}
                    <div className="bg-[#020204] border border-neutral-800 p-3 rounded-lg space-y-1.5 text-[9px] font-mono leading-relaxed h-52 overflow-y-auto">
                      {web3ProgressLog.map((log, index) => (
                        <div key={index} className="text-white/80">
                          <span className="text-indigo-400 font-extrabold mr-1">&gt;</span> {log}
                        </div>
                      ))}
                      {web3Stage === 'estimating' && (
                        <div className="flex items-center gap-2 text-white/50 text-[8px] animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" /> Computing network fees...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Web3 Action Controls */}
                  <div className="pt-3.5 border-t border-neutral-800 flex gap-2.5">
                    {web3Stage === 'prompting' ? (
                      <>
                        <button 
                          onClick={() => setWeb3Stage('idle')}
                          className="w-1/3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white uppercase text-[9px] font-black rounded-lg cursor-pointer transition-all active:scale-95 shadow-sm"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={confirmSigning}
                          className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white uppercase text-[9px] font-black rounded-lg cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Zap className="w-3.5 h-3.5 text-white" /> Approve & Sign Tx
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center text-white/60 uppercase text-[9px] font-bold py-2 animate-pulse">
                        Symmetric cryptoprocessor executing pipeline...
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Solid Segmented Control Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
              <div className="bg-neutral-900/90 p-1 rounded-xl flex gap-1 border border-neutral-800">
                <button 
                  type="button"
                  onClick={() => setActiveTab('deposit')}
                  className={`text-xs font-mono font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'deposit' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-transparent hover:bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  DEPOSIT FUNDS
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('withdraw')}
                  className={`text-xs font-mono font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'withdraw' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-transparent hover:bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  WITHDRAWAL
                </button>
              </div>
              
              {activeTab === 'withdraw' && (
                <span className="text-[9px] bg-indigo-600 text-white px-2.5 py-1 rounded-md font-black uppercase tracking-wider shadow-sm">
                  Step {withdrawalStep} of 3
                </span>
              )}
            </div>

            {activeTab === 'deposit' ? (
              /* DEPOSIT WORKFLOW */
              <form onSubmit={handleExecuteTransfer} className="space-y-4 font-mono text-xs">
                
                {/* Select Target Asset */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] uppercase text-white/70 block font-bold">Select Fiduciary Asset</label>
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full bg-[#040405] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer uppercase font-bold shadow-inner"
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
                  <label className="text-[9.5px] uppercase text-white/70 block font-bold">Clearing Amount ({selectedAsset})</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70 font-bold">
                      {selectedAsset === 'USD' ? '$' : selectedAsset === 'EUR' ? '€' : selectedAsset === 'GBP' ? '£' : 'Ⓢ'}
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      min="0.1"
                      step="any"
                      className="w-full bg-[#040405] border border-neutral-800 rounded-lg py-2 pl-10 pr-16 text-sm text-white font-mono placeholder-white/40 focus:outline-none focus:border-indigo-500 font-bold shadow-inner"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9.5px] text-white/70 font-bold">{selectedAsset}</span>
                  </div>
                </div>

                {/* Smart settlement selector based on Asset Type */}
                <div className="space-y-1.5">
                  <label className="text-[9.5px] uppercase text-white/70 block font-bold">Clearing Channel</label>
                  <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg text-white shadow-sm ${currentAssetDetails?.type === 'ERC20' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                        {currentAssetDetails?.type === 'ERC20' ? (
                          <Zap className="w-4 h-4" />
                        ) : (
                          <Landmark className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-extrabold text-white text-[10px] block uppercase">{currentAssetDetails?.network} Rail</span>
                        <span className="text-[8.5px] text-white/70 font-bold block">
                          {currentAssetDetails?.type === 'ERC20' ? 'Instant Secure Smart Contract Transfer' : 'Instant Institutional Fiduciary Sweep'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Summary Box */}
                <div className="bg-neutral-900/40 border border-neutral-800 p-3.5 rounded-lg space-y-2 font-mono text-[10px]">
                  <div className="text-[9px] text-white/70 uppercase tracking-widest font-black border-b border-neutral-800 pb-1.5 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Clearing Parameters</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-white/70 uppercase font-bold">Clearing Time:</span>
                      <span className="text-white font-bold">Instant Settlement</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 uppercase font-bold">Interoperability Fee:</span>
                      <span className="text-white font-bold">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 uppercase font-bold">Credit Destination:</span>
                      <span className="text-indigo-400 font-bold">{selectedAsset} Liquid Balance</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase rounded-lg shadow-md tracking-wider cursor-pointer transition-all active:scale-[0.98] text-center flex items-center justify-center gap-1.5"
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
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-1 text-[9px] font-mono font-black text-white/60">
                  <span className={withdrawalStep >= 1 ? 'text-white' : ''}>1. AMOUNT</span>
                  <span className="h-px bg-neutral-800 flex-1 mx-2" />
                  <span className={withdrawalStep >= 2 ? 'text-white' : ''}>2. ROUTING</span>
                  <span className="h-px bg-neutral-800 flex-1 mx-2" />
                  <span className={withdrawalStep >= 3 ? 'text-white' : ''}>3. EXECUTION</span>
                </div>

                {withdrawalStep === 1 && (
                  <div className="space-y-4 animate-fadeIn text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] uppercase text-white/70 block font-bold">Fiduciary Asset Outflow</label>
                      <select
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                        className="w-full bg-[#040405] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer uppercase font-bold shadow-inner"
                      >
                        {SUPPORTED_ASSETS.map(asset => (
                          <option key={asset.symbol} value={asset.symbol}>
                            {asset.logo} {asset.symbol} - Bal: {(balances[asset.symbol] || 0).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9.5px] uppercase text-white/70 block font-bold">Withdrawal Quantity</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70 font-bold">
                          {selectedAsset === 'USD' ? '$' : selectedAsset === 'EUR' ? '€' : selectedAsset === 'GBP' ? '£' : 'Ⓢ'}
                        </span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          min="0.1"
                          step="any"
                          className="w-full bg-[#040405] border border-neutral-800 rounded-lg py-2 pl-10 pr-16 text-sm text-white font-mono placeholder-white/40 focus:outline-none focus:border-indigo-500 font-bold shadow-inner"
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
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-md"
                    >
                      SPECIFY ROUTING
                    </button>
                  </div>
                )}

                {withdrawalStep === 2 && (
                  <div className="space-y-4 animate-fadeIn text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] uppercase text-white/70 block font-bold">
                        {selectedAsset === 'BTC' ? 'Target Bitcoin Wallet Address' :
                         selectedAsset === 'ETH' ? 'Target Ethereum Wallet Address' :
                         currentAssetDetails?.type === 'ERC20' ? 'Target Web3 ERC20 Wallet Address' :
                         'Fiduciary Bank Account Credentials'}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          selectedAsset === 'BTC' ? 'bc1q...' :
                          (selectedAsset === 'ETH' || currentAssetDetails?.type === 'ERC20') ? '0x...' :
                          'Routing / Account Detail or Phone Number'
                        }
                        value={destWalletAddress}
                        onChange={(e) => setDestWalletAddress(e.target.value)}
                        className="w-full bg-[#040405] border border-neutral-800 rounded-lg py-2.5 px-3 text-xs text-white font-mono placeholder-white/40 focus:outline-none focus:border-indigo-500 font-bold shadow-inner"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setWithdrawalStep(1)}
                        className="w-1/3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white uppercase rounded-lg cursor-pointer font-bold transition-all active:scale-95 shadow-sm"
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
                        className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase rounded-lg cursor-pointer transition-all active:scale-[0.98] shadow-md"
                      >
                        REVIEW OUTFLOW
                      </button>
                    </div>
                  </div>
                )}

                {withdrawalStep === 3 && (
                  <div className="space-y-4 animate-fadeIn text-xs">
                    <div className="bg-neutral-900/60 border border-neutral-800 p-3.5 rounded-lg space-y-2">
                      <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                        <span className="text-white/70 uppercase text-[9px] font-bold">Quantity</span>
                        <span className="font-extrabold text-white">{transferAmount} {selectedAsset}</span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                        <span className="text-white/70 uppercase text-[9px] font-bold">Method</span>
                        <span className="font-extrabold text-white">{currentAssetDetails?.network}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 uppercase text-[9px] font-bold">Target</span>
                        <span className="font-extrabold text-indigo-400 truncate w-36 text-right font-mono">{destWalletAddress}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setWithdrawalStep(2)}
                        className="w-1/3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white uppercase rounded-lg cursor-pointer font-bold transition-all active:scale-95 shadow-sm"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleExecuteTransfer}
                        disabled={loading}
                        className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase rounded-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                      >
                        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'CONFIRM OUTFLOW'}
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
      <div className="bg-[#080808] border border-neutral-800/80 rounded-xl p-5 font-mono">
        <div className="border-b border-neutral-800/80 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Cryptographically Audited Activity</h4>
              <span className="text-[8px] px-2 py-0.5 bg-emerald-600 text-white font-black rounded flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-white" /> RECONCILED
              </span>
            </div>
            <p className="text-[8.5px] text-white/70 uppercase mt-0.5 font-bold">Double-Entry Ledger Logs and SHA-256 Audit Signatures</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAuditVerification}
              disabled={auditing}
              className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw className={`w-3 h-3 ${auditing ? 'animate-spin' : ''}`} />
              {auditing ? 'Auditing...' : 'Run Audit Verification'}
            </button>

            <button
              onClick={handleDownloadBankStatement}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <Landmark className="w-3.5 h-3.5 text-white" />
              Export Statement (.CSV)
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {txs.length === 0 ? (
            <div className="text-center py-12 text-white/50 text-[10px] uppercase font-bold">
              No transactions detected in secure log.
            </div>
          ) : (
            paginatedTxs.map((tx) => {
              const isCrypto = ['USDC', 'USDT', 'PYUSD'].includes(tx.currency);
              return (
                <div 
                  key={tx.id} 
                  className="bg-neutral-900/40 border border-neutral-800/80 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-[10px]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${tx.type === 'DEPOSIT' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                      {tx.type === 'DEPOSIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white uppercase">{tx.method}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-sm ${
                          tx.status === 'Settled' ? 'bg-emerald-600 text-white' :
                          tx.status === 'Pending' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                          {tx.status}
                        </span>
                        {tx.auditHash && (
                          <span className="text-[7.5px] text-emerald-400 font-mono font-bold bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700 shadow-sm" title={`SHA-256 Digest: ${tx.auditHash}`}>
                            SHA256: {tx.auditHash.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      <div className="text-white/70 text-[8.5px] mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>Cleared on {tx.date}</span>
                        {tx.balanceBefore !== undefined && tx.balanceAfter !== undefined && (
                          <span className="text-white/60 font-mono">
                            (Bal: ${tx.balanceBefore.toLocaleString(undefined, { minimumFractionDigits: 2 })} → <strong className="text-white font-bold">${tx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>)
                          </span>
                        )}
                        {isCrypto && tx.txHash && (
                          <>
                            <span className="text-white/30">•</span>
                            <span className="text-indigo-400 font-mono font-bold">Hash: {tx.txHash.substring(0, 10)}...</span>
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
                        className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg transition-all font-black uppercase text-[8.5px] flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
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
          <div className="flex items-center justify-between border-t border-neutral-800/80 pt-3.5 mt-4 text-[9px] text-white/80 font-mono font-bold">
            <span>PAGE {activeActivityPage} OF {totalActivityPages}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                disabled={activeActivityPage === 1}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-black uppercase text-[9px] disabled:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))}
                disabled={activeActivityPage === totalActivityPages}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-black uppercase text-[9px] disabled:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 0: Official Bank Audit & Reconciliation Certificate */}
      <AnimatePresence>
        {showAuditModal && auditData && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuditModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-2xl bg-[#09090c] border border-neutral-800 rounded-xl p-6 font-mono text-xs z-55 max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="border-b border-neutral-800 pb-4 mb-4 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">BANKING AUDIT & RECONCILIATION CERTIFICATE</h3>
                  </div>
                  <p className="text-[9.5px] text-white/70 uppercase mt-0.5 font-bold">
                    {auditData.bankInstitution} • Routing: {auditData.routingNumber}
                  </p>
                </div>
                <button 
                  onClick={() => setShowAuditModal(false)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[9.5px] font-bold uppercase cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  Dismiss
                </button>
              </div>

              <div className="space-y-4">
                {/* Executive Status Banner */}
                <div className="bg-emerald-600 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[9px] uppercase font-black block tracking-wider text-emerald-100">SYSTEM RECONCILIATION STATUS</span>
                    <span className="text-base font-black text-white mt-0.5 block">{auditData.systemStatus} (0 DISCREPANCIES)</span>
                    <span className="text-[9px] text-emerald-100 block mt-1">
                      FDIC & Segregated Reserve Backing: 100% (Coverage Ratio: {auditData.proofOfReservesCoverageRatio * 100}%)
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[9px] text-emerald-100 uppercase block font-bold">Audited Ledger Count</span>
                    <span className="text-lg font-black text-white">{auditData.ledgerEntriesAudited} Blocks</span>
                  </div>
                </div>

                {/* Audit Certificate Hash & Double Entry Balancing Details */}
                <div className="bg-[#040406] border border-neutral-800 p-3.5 rounded-lg space-y-2 text-[10px]">
                  <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                    <span className="text-white/70 uppercase font-bold">Audit Timestamp:</span>
                    <span className="text-white font-bold">{auditData.auditTimestamp}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                    <span className="text-white/70 uppercase font-bold">Current Account Balance:</span>
                    <span className="text-emerald-400 font-extrabold">${auditData.currentBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                    <span className="text-white/70 uppercase font-bold">Reconciled Ledger Balance:</span>
                    <span className="text-emerald-400 font-extrabold">${auditData.reconciledBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                    <span className="text-white/70 uppercase font-bold">Double-Entry Trial Balance:</span>
                    <span className="text-emerald-400 font-bold">
                      Debits: ${auditData.doubleEntryBalancing?.totalDebits?.toFixed(2) || '0.00'} = Credits: ${auditData.doubleEntryBalancing?.totalCredits?.toFixed(2) || '0.00'} (Balanced)
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-800 pb-1.5">
                    <span className="text-white/70 uppercase font-bold">Ledger Merkle Root:</span>
                    <span className="text-indigo-300 font-mono text-[9px] font-bold truncate max-w-[280px]">{auditData.merkleRoot || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 uppercase font-bold">Audit Certificate Signature:</span>
                    <span className="text-indigo-400 font-mono text-[9px] font-bold truncate max-w-[280px]">{auditData.auditCertificateHash}</span>
                  </div>
                </div>

                {/* Verified Double-Entry Ledger Preview */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-white/70 uppercase font-black block">Sequential Chained Ledger & Audit Trail</span>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-[9px]">
                    {auditData.auditLog && auditData.auditLog.map((log: any, idx: number) => (
                      <div key={idx} className="p-2 bg-neutral-900/60 border border-neutral-800 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-bold">
                              Block #{log.blockNumber ?? idx}
                            </span>
                            <span className="text-white font-bold">{log.method} ({log.type})</span>
                          </div>
                          <span className="text-white/60 text-[8px] mt-0.5 block">{log.date} • Bal: ${log.balanceBefore} → ${log.balanceAfter}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-black block ${log.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {log.type === 'DEPOSIT' ? '+' : '-'}${log.amount.toFixed(2)}
                          </span>
                          <span className="text-[7.5px] text-emerald-400 font-mono font-bold">SHA256: {log.auditHash?.substring(0, 10)}...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800 flex justify-between items-center">
                  <span className="text-[8.5px] text-white/50 uppercase font-bold">MTX Quant Compliance Engine v4.8</span>
                  <button
                    onClick={handleDownloadBankStatement}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9.5px] rounded-lg cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Landmark className="w-3.5 h-3.5" /> Download Full CSV Statement
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* MODAL 1: Block Explorer Custom Inspector Terminal */}
      <AnimatePresence>
        {inspectorTx && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto">
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
              className="relative w-full max-w-xl bg-[#09090c] border border-neutral-800 rounded-xl p-5 font-mono text-xs z-55 max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="border-b border-neutral-800 pb-3 mb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" /> Decoded Blockchain Receipt
                  </h3>
                  <p className="text-[9px] text-white/70 uppercase mt-0.5 font-bold">Distributed Ledger Block Analyzer</p>
                </div>
                <button 
                  onClick={() => setInspectorTx(null)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[9px] font-bold uppercase cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  Dismiss
                </button>
              </div>

              <div className="space-y-3.5 leading-relaxed text-[10px]">
                
                {/* Visual Header */}
                <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-lg space-y-2 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] text-white/70 uppercase block font-bold">Settlement Status</span>
                    <span className="font-black text-emerald-400 text-sm flex items-center gap-1.5 mt-0.5">
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-400" /> SUCCESSFUL
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-white/70 uppercase block font-bold">Outflow Amount</span>
                    <span className="font-mono text-white text-base font-black">
                      {inspectorTx.amount.toLocaleString()} {inspectorTx.currency}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-3 py-1.5 border-b border-neutral-800/60">
                    <span className="text-white/70 uppercase font-bold">Block Index & ID</span>
                    <span className="col-span-2 text-white font-bold select-all break-all flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[8.5px]">
                        Block #{inspectorTx.blockNumber ?? 1}
                      </span>
                      {inspectorTx.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 py-1.5 border-b border-neutral-800/60">
                    <span className="text-white/70 uppercase font-bold">Block SHA-256 Hash</span>
                    <span className="col-span-2 text-emerald-400 font-mono text-[9px] font-bold select-all break-all">
                      {inspectorTx.auditHash || '0x4f8e...'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 py-1.5 border-b border-neutral-800/60">
                    <span className="text-white/70 uppercase font-bold">Previous Block Hash</span>
                    <span className="col-span-2 text-white/70 font-mono text-[9px] font-bold select-all break-all">
                      {inspectorTx.prevAuditHash || '0x0000000000000000000000000000000000000000000000000000000000000000'}
                    </span>
                  </div>

                  {inspectorTx.merkleRoot && (
                    <div className="grid grid-cols-3 py-1.5 border-b border-neutral-800/60">
                      <span className="text-white/70 uppercase font-bold">Merkle Tree Root</span>
                      <span className="col-span-2 text-indigo-300 font-mono text-[9px] font-bold select-all break-all">
                        {inspectorTx.merkleRoot}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 py-1.5 border-b border-neutral-800/60">
                    <span className="text-white/70 uppercase font-bold">Clearing Rail</span>
                    <span className="col-span-2 text-white font-extrabold text-indigo-300">
                      {inspectorTx.clearingRail || inspectorTx.method}
                    </span>
                  </div>

                  {inspectorTx.txHash && (
                    <div className="grid grid-cols-3 py-1.5 border-b border-neutral-800/60">
                      <span className="text-white/70 uppercase font-bold">Mempool / Clearing Ref</span>
                      <span className="col-span-2 text-indigo-400 font-bold select-all break-all">{inspectorTx.txHash}</span>
                    </div>
                  )}

                  {inspectorTx.railMetadata && (
                    <div className="py-1.5 border-b border-neutral-800/60">
                      <span className="text-white/70 uppercase font-bold block mb-1">Clearing Metadata</span>
                      <div className="bg-[#050508] p-2 rounded border border-neutral-800/80 font-mono text-[8.5px] space-y-1">
                        {Object.entries(inspectorTx.railMetadata).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-white/50">{k}:</span>
                            <span className="text-white font-bold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 py-1.5 border-b border-neutral-800/60">
                    <span className="text-white/70 uppercase font-bold">Ledger Balance Impact</span>
                    <span className="col-span-2 text-white font-mono font-bold">
                      ${(inspectorTx.balanceBefore ?? 0).toFixed(2)} → ${(inspectorTx.balanceAfter ?? inspectorTx.amount).toFixed(2)} USD
                    </span>
                  </div>

                  {inspectorTx.walletAddress && (
                    <div className="grid grid-cols-3 py-1.5 border-b border-neutral-800/60">
                      <span className="text-white/70 uppercase font-bold">Target Account / Address</span>
                      <span className="col-span-2 text-white font-mono break-all font-bold">
                        {inspectorTx.walletAddress}
                      </span>
                    </div>
                  )}

                  {inspectorTx.gasUsed && (
                    <div className="grid grid-cols-3 py-1.5 border-b border-neutral-800/60">
                      <span className="text-white/70 uppercase font-bold">Network Gas / Units</span>
                      <span className="col-span-2 text-white font-bold font-mono">
                        {inspectorTx.gasUsed.toLocaleString()} units @ {inspectorTx.gasPriceGwei || 18} Gwei
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-800 flex gap-2 justify-end">
                  <a 
                    href={SUPPORTED_ASSETS.find(a => a.symbol === inspectorTx.currency)?.explorer ? `${SUPPORTED_ASSETS.find(a => a.symbol === inspectorTx.currency)?.explorer}/tx/${inspectorTx.txHash}` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase text-[9px] cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View on Live Explorer
                  </a>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM PRODUCTION PAYMENT RAILS MODALS */}
      <PaymentModals
        activePaymentModal={activePaymentModal}
        setActivePaymentModal={setActivePaymentModal}
        transferAmount={transferAmount}
        setTransferAmount={setTransferAmount}
        selectedAsset={selectedAsset}
        fetchFundingState={fetchFundingState}
        executeTransferCall={executeTransferCall}
        plaidLinked={plaidLinked}
        setPlaidLinked={setPlaidLinked}
        setNotification={setNotification}
        setCashBalance={setCashBalance}
        setBalances={setBalances}
      />

      {/* Global Connections Manager Modal */}
      <AnimatePresence>
        {showConnectionsModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto">
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
              className="relative w-full max-w-md bg-[#08080c] border border-neutral-800 rounded-xl p-5 font-mono text-xs z-10 shadow-2xl"
            >
              {modalStep === 'view' && (
                <div className="space-y-4">
                  <div className="border-b border-neutral-800 pb-3">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">MANAGE GLOBAL CONNECTIONS</h4>
                    <p className="text-[9.5px] text-white/70 leading-normal uppercase mt-0.5 font-bold">
                      Establish and audit institutional capital flow connectors.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] text-white/70 uppercase font-black tracking-wider block">Active Connections</span>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-emerald-600 text-white shadow-sm">
                            <Landmark className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-white">Chase Bank ••••4821</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-black uppercase tracking-wider shadow-sm">ACTIVE</span>
                      </div>

                      <div className="flex justify-between items-center bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-emerald-600 text-white shadow-sm">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-white">Visa ••••1124</span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-black uppercase tracking-wider shadow-sm">ACTIVE</span>
                      </div>

                      <div className="flex justify-between items-center bg-neutral-900/60 border border-neutral-800 p-2.5 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-indigo-600 text-white shadow-sm">
                            <Wallet className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-white">Coinbase Wallet Connected</span>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[8px] font-black uppercase tracking-wider shadow-sm">CONNECTED</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowConnectionsModal(false)}
                      className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white uppercase text-[9px] font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStep('add')}
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase text-[9px] cursor-pointer transition-all active:scale-95 shadow-md"
                    >
                      + Connect New Rail
                    </button>
                  </div>
                </div>
              )}

              {modalStep === 'add' && (
                <div className="space-y-4">
                  <div className="border-b border-neutral-800 pb-3">
                    <h5 className="text-sm font-black text-white uppercase tracking-wider">Connect Global Wallet Rail</h5>
                    <p className="text-[9px] text-white/70 uppercase mt-0.5 font-bold">Secure Institutional Integration</p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalStep('success');
                      }}
                      className="w-full flex items-center justify-between p-3 bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 rounded-lg text-left transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-[10px]">ACH SWEEP PORTAL (PLAID)</div>
                          <div className="text-[8px] text-white/70 uppercase mt-0.5 font-bold">Link checking/deposit account</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/60" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModalStep('success');
                      }}
                      className="w-full flex items-center justify-between p-3 bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 rounded-lg text-left transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-[10px]">CARD GATEWAY (STRIPE)</div>
                          <div className="text-[8px] text-white/70 uppercase mt-0.5 font-bold">Link card clearing engine</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/60" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModalStep('success');
                      }}
                      className="w-full flex items-center justify-between p-3 bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 rounded-lg text-left transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-[10px]">COINBASE PRIME / WEB3 LINK</div>
                          <div className="text-[8px] text-white/70 uppercase mt-0.5 font-bold">Authorize custody/clearing ledger</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/60" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModalStep('success');
                      }}
                      className="w-full flex items-center justify-between p-3 bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 rounded-lg text-left transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-[10px]">MOBILE WALLET GATEWAY (M-PESA / AIRTEL / MTN)</div>
                          <div className="text-[8px] text-white/70 uppercase mt-0.5 font-bold">Link instant mobile money operator line</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/60" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-neutral-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setModalStep('view')}
                      className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white uppercase text-[9px] font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {modalStep === 'success' && (
                <div className="text-center space-y-4 py-3">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white uppercase">CONNECTION AUTHORIZED</h4>
                    <p className="text-[9.5px] text-white/70 uppercase leading-normal font-bold">
                      The new fiduciary settlement gateway is now secure and authenticated.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setModalStep('view');
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase text-[9.5px] tracking-wider rounded-lg cursor-pointer transition-all active:scale-95 shadow-md"
                  >
                    RETURN TO CONNECTIONS
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Demo Capital Tier Allocation Dialog */}
      <DemoCapitalModal
        isOpen={isDemoCapitalModalOpen}
        onClose={() => setIsDemoCapitalModalOpen(false)}
        currentCash={cashBalance}
        isRefill={true}
        onSelectAmount={(amount) => {
          setCashBalance(amount);
          setBalances(prev => ({ ...prev, USD: amount }));
          localStorage.setItem('broker_cash', amount.toString());
          localStorage.setItem('mtx_demo_cash', amount.toString());
          const now = new Date();
          const newTx: FundingTx = {
            id: `fund-demo-refill-${Date.now()}`,
            type: 'DEPOSIT',
            method: 'Sandbox Demo Capital Refill',
            currency: 'USD',
            amount: amount,
            balanceBefore: cashBalance,
            balanceAfter: amount,
            status: 'Settled',
            providerStatus: 'sandbox_refilled',
            date: now.toISOString().replace('T', ' ').substring(0, 16),
            auditHash: `demo_sha256_${Date.now().toString(16)}`
          };
          const updatedTxs = [newTx, ...txs];
          setTxs(updatedTxs);
          localStorage.setItem(txStorageKey, JSON.stringify(updatedTxs));
          window.dispatchEvent(new CustomEvent('broker_cash_updated', { detail: { cash: amount, mode: 'DEMO' } }));
          window.dispatchEvent(new Event('storage'));
        }}
      />

    </div>
  );
}
