import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Sliders, 
  X, 
  ChevronRight, 
  Download, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRightLeft, 
  Laptop, 
  UserCheck, 
  AlertTriangle, 
  Layers, 
  List, 
  FileText 
} from 'lucide-react';

interface TimelineStep {
  label: string;
  timestamp: string;
  description: string;
}

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'CONVERSION' | 'STABLECOIN' | 'BUY' | 'SELL' | 'FRACTIONAL_BUY' | 'DIVIDEND' | 'REDEMPTION' | 'STOCK_SPLIT' | 'TICKER_CHANGE' | 'REBALANCING' | 'VERIFICATION' | 'PASSWORD_CHANGE' | 'LOGIN' | 'PAYMENT_ADDED' | 'DELAYED' | 'MAINTENANCE' | 'HALT';
  category: 'funding' | 'investment' | 'corporate' | 'account' | 'system';
  eventName: string;
  asset: string;
  methodOrDetail: string;
  amount: string;
  amountUSDValue: number;
  status: 'Completed' | 'Pending' | 'Processing' | 'Cancelled' | 'Failed' | 'Partially Filled';
  refId: string;
  
  // Detailed metadata for Drawer
  quantity?: string;
  price?: string;
  network?: string;
  settlementRail?: string;
  fees?: string;
  timeline: TimelineStep[];
}

// Clean slate: activities populated dynamically from actual trades and wallet transactions
const INITIAL_ACTIVITIES: ActivityEvent[] = [];

interface ActivityDeskProps {
  accountMode?: 'DEMO' | 'REAL';
}

export default function ActivityDesk({ accountMode: propAccountMode }: ActivityDeskProps = {}) {
  const currentMode = propAccountMode || (typeof window !== 'undefined' ? (localStorage.getItem('mtx_account_mode') === 'REAL' ? 'REAL' : 'DEMO') : 'DEMO');
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityEvent | null>(null);
  const [viewMode, setViewMode] = useState<'TABLE' | 'TIMELINE'>('TABLE');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7D' | '30D' | '90D' | 'CUSTOM'>('ALL');
  
  // Custom Date range states
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Fetch real-time wallet transactions and integrate them into Activity Workspace logs
  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const fetchWalletActivities = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const isMockOrSeeded = (item: any) => {
          if (!item || typeof item !== 'object') return true;
          const id = String(item.id || '').toLowerCase();
          const method = String(item.method || item.methodOrDetail || item.eventName || '').toLowerCase();
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
            id.includes('seed') ||
            id.includes('mock') ||
            method.includes('trade profit settle') ||
            method.includes('trade loss settle')
          );
        };

        // 1. Read cached trade activity events from trading service
        let localTradeActivities: any[] = [];
        try {
          const cached = localStorage.getItem('mtx_activity_events');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              // Unseed legacy mock activities and filter by account mode
              localTradeActivities = parsed.filter((a: any) => {
                if (isMockOrSeeded(a)) return false;
                if (currentMode === 'REAL') {
                  return a.accountMode === 'REAL';
                } else {
                  return a.accountMode !== 'REAL';
                }
              });

              // Clean out the mock data from localStorage if found
              if (localTradeActivities.length !== parsed.length) {
                const cleanedRaw = parsed.filter((a: any) => !isMockOrSeeded(a));
                localStorage.setItem('mtx_activity_events', JSON.stringify(cleanedRaw));
              }
            }
          }
        } catch (e) {
          console.warn('Error reading cached trade activities:', e);
        }

        // 1b. Fetch server trades from backend API
        let serverTradeActivities: ActivityEvent[] = [];
        try {
          const rTrades = await fetch('/api/trades');
          if (rTrades.ok && isMounted) {
            const data = await rTrades.json();
            if (Array.isArray(data)) {
              const filteredTrades = data.filter((t: any) => {
                if (isMockOrSeeded(t)) return false;
                const tradeMode = t.accountMode || (t.marketNote?.includes('[REAL]') ? 'REAL' : 'DEMO');
                return currentMode === 'REAL' ? tradeMode === 'REAL' : tradeMode !== 'REAL';
              });

              serverTradeActivities = filteredTrades.map((t: any) => {
                const notional = (t.size || 0) * (t.entryPrice || 0);
                const isBuy = t.side === 'BUY';
                const timeStr = t.timestamp ? (t.timestamp.includes('T') ? t.timestamp.substring(11, 19) : t.timestamp) : '12:00:00';

                return {
                  id: t.id,
                  timestamp: t.timestamp ? (t.timestamp.length === 16 ? `${t.timestamp}:00` : t.timestamp) : new Date().toISOString(),
                  type: (isBuy ? (t.size < 1 ? 'FRACTIONAL_BUY' : 'BUY') : 'SELL') as any,
                  category: 'investment' as const,
                  eventName: isBuy ? `Purchased ${t.symbol}` : `Sold ${t.symbol}`,
                  asset: t.symbol,
                  methodOrDetail: t.marketNote || 'Terminal Execution',
                  amount: `$${notional.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  amountUSDValue: notional,
                  status: (t.status === 'OPEN' || t.status === 'CLOSED' ? 'Completed' : 'Pending') as any,
                  refId: t.id,
                  quantity: `${t.size < 1 ? t.size.toFixed(4) : t.size.toFixed(2)} Shares`,
                  price: `$${t.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`,
                  network: ['BTC', 'ETH', 'SOL'].some(c => t.symbol?.includes(c)) ? 'Crypto Clearing Rails' : 'Prime Clearing Rails',
                  settlementRail: 'Apex DTC Instant Settlement',
                  fees: '$0.00 (0% Commission Tier)',
                  timeline: [
                    { label: 'Order Dispatched', timestamp: timeStr, description: `${t.side} market execution routed` },
                    { label: 'Treasury Clearance', timestamp: timeStr, description: `Securities ledger credited: ${t.symbol}` },
                    { label: 'Settlement Finalized', timestamp: timeStr, description: `Executed at $${t.entryPrice}. Status: ${t.status}` }
                  ]
                };
              });
            }
          }
        } catch (tradeFetchErr) {
          console.warn('Trades fetch warning in ActivityDesk:', tradeFetchErr);
        }

        // Combine local cached trade activities and server trade activities, deduplicating by ID
        const tradesMap = new Map<string, ActivityEvent>();
        for (const act of localTradeActivities) {
          tradesMap.set(act.id, act);
        }
        for (const act of serverTradeActivities) {
          if (!tradesMap.has(act.id)) {
            tradesMap.set(act.id, act);
          }
        }
        const combinedTradeActivities = Array.from(tradesMap.values());

        let walletTxs: any[] = [];
        const isDemoAccount = currentMode !== 'REAL';
        if (isDemoAccount) {
          try {
            const demoTxsSaved = localStorage.getItem('mtx_demo_funding_txs');
            if (demoTxsSaved) {
              const parsedDemo = JSON.parse(demoTxsSaved);
              if (Array.isArray(parsedDemo)) {
                walletTxs = parsedDemo.filter((t: any) => !isMockOrSeeded(t));
                if (walletTxs.length !== parsedDemo.length) {
                  localStorage.setItem('mtx_demo_funding_txs', JSON.stringify(walletTxs));
                }
              }
            }
          } catch (e) {
            console.warn('Error reading demo funding txs:', e);
          }
        }

        try {
          const res = await fetch('/api/funding/state');
          if (res.ok && isMounted) {
            const data = await res.json();
            const serverTxs: any[] = (data.transactions || []).filter((t: any) => !isMockOrSeeded(t));
            if (!isDemoAccount) {
              walletTxs = serverTxs;
            } else if (walletTxs.length === 0 && serverTxs.length > 0) {
              walletTxs = serverTxs;
            }
          }
        } catch (fetchErr) {
          console.warn('Funding state fetch warning:', fetchErr);
        }

        // Map wallet transactions to ActivityEvents
        const mappedWalletActivities: ActivityEvent[] = walletTxs.map((tx: any) => {
          const isOutbound = tx.type === 'WITHDRAWAL';
          
          // Format amount nicely
          let displayAmount = `${tx.currency} ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          if (tx.currency === 'USD') displayAmount = `$${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          else if (tx.currency === 'EUR') displayAmount = `€${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          else if (tx.currency === 'GBP') displayAmount = `£${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

          // Determine rate for USD calculation
          let rate = 1.0;
          if (tx.currency === 'EUR') rate = 1.09;
          else if (tx.currency === 'GBP') rate = 1.28;
          else if (tx.currency === 'KES') rate = 0.0078;
          
          const amountUSDValue = tx.amount * rate;

          // Map status
          let status: 'Completed' | 'Pending' | 'Processing' | 'Cancelled' | 'Failed' = 'Completed';
          if (tx.status === 'Settled') status = 'Completed';
          else if (tx.status === 'Pending') status = 'Pending';
          else if (tx.status === 'Processing') status = 'Processing';
          else if (tx.status === 'Cancelled') status = 'Cancelled';
          else if (tx.status === 'Failed') status = 'Failed';

          // Settlement rail details
          let settlementRail = 'Apex DTC Instant Settlement';
          if (tx.method?.includes('ACH')) settlementRail = 'Chase ACH Protocol Verification';
          else if (tx.method?.includes('Wire')) settlementRail = 'Federal Reserve Wire Network';
          else if (tx.method?.includes('Card')) settlementRail = 'Visa Direct Payout API';
          else if (tx.method?.includes('M-Pesa')) settlementRail = 'Safaricom Paybill #408892';
          else if (tx.method?.includes('Transfer') || tx.method?.includes('Deposit') || tx.method?.includes('Withdrawal')) {
            if (['USDC', 'USDT', 'PYUSD'].includes(tx.currency)) {
              settlementRail = 'Circle Smart Contract Vault';
            }
          }

          // Timeline steps
          const timelineSteps = [];
          if (status === 'Completed') {
            timelineSteps.push(
              { label: 'Order Submitted', timestamp: '09:00:00', description: `Inbound transfer of ${tx.amount} ${tx.currency} initiated.` },
              { label: 'Settlement Initiated', timestamp: '09:05:00', description: 'Internal treasury clearance validation triggered.' },
              { label: 'Settlement Completed', timestamp: '09:15:00', description: 'Securities ledger credited and cash asset debited.' }
            );
          } else if (status === 'Pending' || status === 'Processing') {
            timelineSteps.push(
              { label: 'Order Submitted', timestamp: '09:00:00', description: `Inbound transfer of ${tx.amount} ${tx.currency} initiated.` },
              { label: 'Awaiting Settlement', timestamp: '09:05:00', description: 'Held in clearing status. Awaiting external network authorization.' }
            );
          } else {
            timelineSteps.push(
              { label: 'Order Submitted', timestamp: '09:00:00', description: `Inbound transfer of ${tx.amount} ${tx.currency} initiated.` },
              { label: 'Settlement Failed', timestamp: '09:15:00', description: 'External system returned decline code or network exception.' }
            );
          }

          return {
            id: tx.id,
            timestamp: tx.date.length === 16 ? `${tx.date}:00` : tx.date,
            type: tx.type,
            category: 'funding',
            eventName: `${tx.currency} ${tx.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} via ${tx.method}`,
            asset: tx.currency,
            methodOrDetail: tx.method,
            amount: displayAmount,
            amountUSDValue: amountUSDValue,
            status: status,
            refId: tx.id,
            quantity: 'N/A',
            price: `1.00 ${tx.currency}`,
            network: ['USDC', 'USDT', 'PYUSD'].includes(tx.currency) ? 'Base L2 Network' : 'Standard Clearing Rails',
            settlementRail: settlementRail,
            fees: tx.method?.includes('Wire') ? '$15.00' : '$0.00',
            timeline: timelineSteps
          };
        });

        // Set exclusively dynamic real operations without mock seed retention
        if (isMounted) {
          const allDynamic = [...combinedTradeActivities, ...mappedWalletActivities];
          allDynamic.sort((a, b) => {
            const timeA = new Date(String(a.timestamp).includes('T') ? a.timestamp : String(a.timestamp).replace(' ', 'T') + 'Z').getTime() || 0;
            const timeB = new Date(String(b.timestamp).includes('T') ? b.timestamp : String(b.timestamp).replace(' ', 'T') + 'Z').getTime() || 0;
            return timeB - timeA;
          });
          setActivities(allDynamic);
        }
      } catch (err) {
        console.warn('Failed to fetch wallet activities:', err);
      } finally {
        isFetching = false;
      }
    };

    fetchWalletActivities();
    const interval = setInterval(fetchWalletActivities, 4000);

    const handleTradeSync = () => {
      fetchWalletActivities();
    };

    window.addEventListener('mtx_order_executed', handleTradeSync);
    window.addEventListener('broker_cash_updated', handleTradeSync);
    window.addEventListener('storage', handleTradeSync);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('mtx_order_executed', handleTradeSync);
      window.removeEventListener('broker_cash_updated', handleTradeSync);
      window.removeEventListener('storage', handleTradeSync);
    };
  }, [currentMode]);

  // 1-to-1 mappings of category filters from prompt
  const CATEGORY_CHIPS = [
    { label: 'All', value: 'ALL' },
    { label: 'Deposits', value: 'DEPOSIT' },
    { label: 'Withdrawals', value: 'WITHDRAWAL' },
    { label: 'Purchases', value: 'BUY_FRACTIONAL' }, // matches BUY and FRACTIONAL_BUY
    { label: 'Sales', value: 'SELL' },
    { label: 'Conversions', value: 'CONVERSION' },
    { label: 'Dividends', value: 'DIVIDEND' },
    { label: 'Corporate Actions', value: 'CORPORATE' }, // rebalancing, stock_split, ticker_change
    { label: 'System Events', value: 'SYSTEM' } // delayed, maintenance, halt
  ];

  // Operations metrics calculations based on recorded activity ledger
  const operationsMetrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);
    
    // Today's Activity Events
    const todaysEvents = activities.filter(a => a.timestamp.startsWith(todayStr));
    const yesterdaysEvents = activities.filter(a => a.timestamp.startsWith(yesterdayStr));
    const deltaSinceYesterday = todaysEvents.length - yesterdaysEvents.length;

    // Pending Actions Count
    const pendingActions = activities.filter(a => a.status === 'Pending' || a.status === 'Processing');
    const pendingWithdrawalCount = pendingActions.filter(a => a.type === 'WITHDRAWAL').length;
    const pendingInvestmentCount = pendingActions.filter(a => a.type === 'BUY' || a.type === 'SELL' || a.type === 'FRACTIONAL_BUY').length;

    // Settled Transactions
    const completedEvents = activities.filter(a => a.status === 'Completed').length;
    const failedOrCancelledEvents = activities.filter(a => a.status === 'Failed' || a.status === 'Cancelled').length;
    const successRate = completedEvents > 0 
      ? (completedEvents / (completedEvents + failedOrCancelledEvents)) * 100 
      : (failedOrCancelledEvents > 0 ? 0.0 : 100.0);

    // Total Transaction Volume (Since Account Creation)
    const totalVolume = activities.reduce((sum, a) => sum + (a.amountUSDValue || 0), 0);

    return {
      todaysEventsCount: todaysEvents.length,
      totalEventsCount: activities.length,
      deltaSinceYesterday,
      pendingCount: pendingActions.length,
      pendingWithdrawals: pendingWithdrawalCount,
      pendingInvestments: pendingInvestmentCount,
      completedCount: completedEvents,
      successRate: parseFloat(successRate.toFixed(1)),
      totalVolumeUSD: totalVolume
    };
  }, [activities]);

  // Filtering Logic
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      // 1. Text Search Filter (Asset, Reference ID, Date, Amount, Payment Method)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesAsset = a.asset.toLowerCase().includes(query);
        const matchesRefId = a.refId.toLowerCase().includes(query);
        const matchesTimestamp = a.timestamp.toLowerCase().includes(query);
        const matchesAmount = a.amount.toLowerCase().includes(query);
        const matchesMethod = a.methodOrDetail.toLowerCase().includes(query);
        const matchesEventName = a.eventName.toLowerCase().includes(query);
        const matchesType = a.type.toLowerCase().includes(query);

        if (!matchesAsset && !matchesRefId && !matchesTimestamp && !matchesAmount && !matchesMethod && !matchesEventName && !matchesType) {
          return false;
        }
      }

      // 2. Category Chips Filter
      if (activeCategoryFilter !== 'ALL') {
        if (activeCategoryFilter === 'DEPOSIT') {
          if (a.type !== 'DEPOSIT' && a.type !== 'STABLECOIN') return false;
        } else if (activeCategoryFilter === 'WITHDRAWAL') {
          if (a.type !== 'WITHDRAWAL') return false;
        } else if (activeCategoryFilter === 'BUY_FRACTIONAL') {
          if (a.type !== 'BUY' && a.type !== 'FRACTIONAL_BUY') return false;
        } else if (activeCategoryFilter === 'SELL') {
          if (a.type !== 'SELL') return false;
        } else if (activeCategoryFilter === 'CONVERSION') {
          if (a.type !== 'CONVERSION') return false;
        } else if (activeCategoryFilter === 'DIVIDEND') {
          if (a.type !== 'DIVIDEND') return false;
        } else if (activeCategoryFilter === 'CORPORATE') {
          if (a.category !== 'corporate') return false;
        } else if (activeCategoryFilter === 'SYSTEM') {
          if (a.category !== 'system' && a.category !== 'account') return false;
        }
      }

      // 3. Dynamic Date Filters based on real calendar days
      const now = new Date();
      const todayStr = now.toISOString().substring(0, 10);
      const itemDate = new Date(a.timestamp.substring(0, 10));
      const diffTime = Math.max(0, now.getTime() - itemDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (dateFilter === 'TODAY') {
        if (!a.timestamp.startsWith(todayStr)) return false;
      } else if (dateFilter === '7D') {
        if (diffDays > 7) return false;
      } else if (dateFilter === '30D') {
        if (diffDays > 30) return false;
      } else if (dateFilter === '90D') {
        if (diffDays > 90) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate && a.timestamp.substring(0, 10) < customStartDate) return false;
        if (customEndDate && a.timestamp.substring(0, 10) > customEndDate) return false;
      }

      return true;
    });
  }, [activities, searchQuery, activeCategoryFilter, dateFilter, customStartDate, customEndDate]);

  // Download Blotter CSV to emphasize professional compliance and auditability
  const handleDownloadCSV = () => {
    try {
      const headers = ['Timestamp', 'Type', 'Category', 'Event', 'Asset', 'Method/Details', 'Amount', 'Status', 'Reference ID'];
      const csvRows = [headers.join(',')];
      
      filteredActivities.forEach(a => {
        const row = [
          `"${a.timestamp}"`,
          `"${a.type}"`,
          `"${a.category}"`,
          `"${a.eventName}"`,
          `"${a.asset}"`,
          `"${a.methodOrDetail}"`,
          `"${a.amount}"`,
          `"${a.status}"`,
          `"${a.refId}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `mtx_audit_trail_${new Date().toISOString().substring(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed generating audit blotter CSV:', err);
    }
  };

  return (
    <div className="space-y-6 text-white font-mono">
      
      {/* ──────────────────── TOP SUMMARY CARDS (FOUR-CARD LAYOUT) ──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Today's Activity */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-[#050505] border border-neutral-800 rounded-xl p-4 shadow-xl text-left relative overflow-hidden group"
        >
          <span className="text-neutral-400 text-[8.5px] font-black uppercase tracking-widest block">Today's Activity</span>
          <span className="text-2xl font-black text-white block mt-1.5">
            {operationsMetrics.todaysEventsCount} Events
          </span>
          {operationsMetrics.totalEventsCount === 0 ? (
            <span className="text-[10px] text-neutral-500 font-bold block mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
              Clean Slate (0 Total)
            </span>
          ) : operationsMetrics.deltaSinceYesterday > 0 ? (
            <span className="text-[10px] text-emerald-400 font-bold block mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              +{operationsMetrics.deltaSinceYesterday} Since Yesterday
            </span>
          ) : operationsMetrics.deltaSinceYesterday < 0 ? (
            <span className="text-[10px] text-rose-400 font-bold block mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              {operationsMetrics.deltaSinceYesterday} Since Yesterday
            </span>
          ) : (
            <span className="text-[10px] text-neutral-400 font-bold block mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
              Equal to Yesterday ({operationsMetrics.todaysEventsCount})
            </span>
          )}
        </motion.div>

        {/* Card 2: Pending Actions */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-[#050505] border border-neutral-800 rounded-xl p-4 shadow-xl text-left relative overflow-hidden group"
        >
          <span className="text-neutral-400 text-[8.5px] font-black uppercase tracking-widest block">Pending Actions</span>
          <span className="text-2xl font-black text-amber-400 block mt-1.5">
            {operationsMetrics.pendingCount} Pending
          </span>
          <div className="text-[9.5px] text-neutral-300 block mt-2 leading-relaxed space-y-0.5 font-bold">
            <div className="flex justify-between">
              <span>Withdrawal Limit Queue:</span>
              <span className="font-black text-white">{operationsMetrics.pendingWithdrawals} Outbound</span>
            </div>
            <div className="flex justify-between">
              <span>Investment Fills:</span>
              <span className="font-black text-white">{operationsMetrics.pendingInvestments} Order</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Settled Transactions */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-[#050505] border border-neutral-800 rounded-xl p-4 shadow-xl text-left relative overflow-hidden group"
        >
          <span className="text-neutral-400 text-[8.5px] font-black uppercase tracking-widest block">Settled Transactions</span>
          <span className="text-2xl font-black text-white block mt-1.5">
            {operationsMetrics.completedCount} Completed
          </span>
          <span className="text-[10px] text-emerald-400 font-bold block mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {operationsMetrics.successRate}% Success Rate
          </span>
        </motion.div>

        {/* Card 4: Total Transaction Volume */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-[#050505] border border-neutral-800 rounded-xl p-4 shadow-xl text-left relative overflow-hidden group"
        >
          <span className="text-neutral-400 text-[8.5px] font-black uppercase tracking-widest block">Total Transaction Volume</span>
          <span className="text-2xl font-black text-indigo-300 block mt-1.5">
            ${operationsMetrics.totalVolumeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-neutral-400 font-bold block mt-2">
            Cumulative Since Account Creation
          </span>
        </motion.div>

      </div>

      {/* ──────────────────── SEARCH & FILTERS SECTION ──────────────────── */}
      <div className="bg-[#050505] border border-neutral-800 rounded-xl p-5 space-y-4 shadow-lg text-left">
        
        {/* Core Inputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Search Box */}
          <div className="lg:col-span-5 relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by asset, ref ID, amount, payment method..."
              className="w-full bg-neutral-900/80 border border-neutral-700/80 rounded-lg py-2.5 pl-10 pr-4 text-[11px] placeholder-neutral-500 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          {/* Date Picker Filter Options */}
          <div className="lg:col-span-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full bg-neutral-900/80 border border-neutral-700/80 rounded-lg py-2.5 px-3 text-[11px] text-white font-bold focus:outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="ALL">All Recorded Dates</option>
              <option value="TODAY">Today</option>
              <option value="7D">Past 7 Days</option>
              <option value="30D">Past 30 Days</option>
              <option value="90D">Past 90 Days</option>
              <option value="CUSTOM">Custom Range...</option>
            </select>
          </div>

          {/* Custom Date Picker inputs */}
          {dateFilter === 'CUSTOM' && (
            <div className="lg:col-span-4 grid grid-cols-2 gap-2 animate-fadeIn">
              <div className="relative">
                <span className="absolute top-2.5 left-2.5 text-[8px] text-neutral-400 uppercase tracking-widest font-black">From</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg pt-4 pb-1 px-2.5 text-[10px] text-white font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div className="relative">
                <span className="absolute top-2.5 left-2.5 text-[8px] text-neutral-400 uppercase tracking-widest font-black">To</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg pt-4 pb-1 px-2.5 text-[10px] text-white font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Quick Clear Action (Displays only if filters are active) */}
          {(searchQuery || activeCategoryFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <div className="lg:col-span-2 flex items-center justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategoryFilter('ALL');
                  setDateFilter('ALL');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="w-full lg:w-auto px-3 py-2.5 border border-rose-800/60 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-[9.5px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}

        </div>

        {/* Filter Chips Horizontal Slider Row & Action Controls */}
        <div className="border-t border-neutral-800 pt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 select-none">
              <Filter className="w-3 h-3 text-indigo-400" />
              Filters:
            </span>
            {CATEGORY_CHIPS.map(chip => (
              <button
                key={chip.value}
                onClick={() => setActiveCategoryFilter(chip.value)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all shrink-0 cursor-pointer shadow-sm ${
                  activeCategoryFilter === chip.value 
                    ? 'bg-indigo-600 text-white border border-indigo-500 shadow-md' 
                    : 'bg-neutral-900 text-neutral-300 font-bold border border-neutral-800 hover:text-white hover:bg-neutral-800 active:scale-95'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 shadow-sm">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 rounded text-[8.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <List className="w-3 h-3" />
                Table
              </button>
              <button
                onClick={() => setViewMode('TIMELINE')}
                className={`px-2.5 py-1 rounded text-[8.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'TIMELINE'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Clock className="w-3 h-3" />
                Timeline
              </button>
            </div>

            {/* Export Blotter CSV */}
            <button
              onClick={handleDownloadCSV}
              className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-sm"
              title="Export filtered records as CSV"
            >
              <Download className="w-3 h-3 text-neutral-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

      </div>

      {/* ──────────────────── MAIN RESULTS BLOTTER LIST ──────────────────── */}
      {filteredActivities.length === 0 ? (
        <div className="border border-dashed border-neutral-800 bg-[#050505] rounded-xl p-16 text-center space-y-4 shadow-lg">
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-neutral-400">
            <History className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-white tracking-widest">No matched transaction entries</h4>
            <p className="text-[10px] text-neutral-400 max-w-md mx-auto leading-relaxed font-bold">
              No permanently committed ledger records correspond to your criteria. Try loosening search terms or switching categories.
            </p>
          </div>
        </div>
      ) : (
        viewMode === 'TABLE' ? (
          
          /* TABLE VIEW: Institutional Trade Blotter */
          <div className="bg-[#050505] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900/90 border-b border-neutral-800 text-[9px] font-black uppercase tracking-wider text-neutral-300">
                    <th className="py-4 px-5">Timestamp</th>
                    <th className="py-4 px-5">Event</th>
                    <th className="py-4 px-5">Asset / Method</th>
                    <th className="py-4 px-5 text-right">Amount</th>
                    <th className="py-4 px-5 text-center">Status</th>
                    <th className="py-4 px-5 font-mono text-center">Reference ID</th>
                    <th className="py-4 px-5 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/70 text-[10px]">
                  {filteredActivities.map(activity => {
                    const isOutbound = activity.type === 'WITHDRAWAL' || activity.type === 'SELL';
                    const isNeutral = ['LOGIN', 'PASSWORD_CHANGE', 'VERIFICATION', 'PAYMENT_ADDED', 'DELAYED', 'MAINTENANCE', 'HALT', 'REBALANCING', 'STOCK_SPLIT', 'TICKER_CHANGE'].includes(activity.type);
                    
                    return (
                      <tr 
                        key={activity.id}
                        onClick={() => setSelectedActivity(activity)}
                        className="hover:bg-neutral-900/60 active:bg-neutral-800/80 transition-all cursor-pointer group"
                        title="Click row to open permanent audit ledger details"
                      >
                        {/* Timestamp */}
                        <td className="py-3.5 px-5 text-neutral-200 font-bold font-mono whitespace-nowrap">
                          {activity.timestamp}
                        </td>

                        {/* Event details */}
                        <td className="py-3.5 px-5 font-black text-white whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            {isNeutral ? (
                              <div className="w-2 h-2 rounded-full bg-indigo-400" />
                            ) : isOutbound ? (
                              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            {activity.eventName}
                          </span>
                        </td>

                        {/* Asset / Method */}
                        <td className="py-3.5 px-5 text-neutral-200 font-bold whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-700/80 rounded-md font-black text-white shadow-sm">
                            {activity.asset}
                          </span>
                          <span className="text-[9px] text-neutral-400 ml-2 font-bold">
                            ({activity.methodOrDetail})
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-5 text-right font-black whitespace-nowrap font-mono">
                          {isNeutral ? (
                            <span className="text-neutral-400 font-bold">N/A</span>
                          ) : (
                            <span className={isOutbound ? 'text-rose-400 font-black' : 'text-emerald-400 font-black'}>
                              {isOutbound ? '-' : '+'}{activity.amount}
                            </span>
                          )}
                        </td>

                        {/* Status Badges */}
                        <td className="py-3.5 px-5 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider leading-none shadow-sm ${
                            activity.status === 'Completed' || activity.status === 'Filled' ? 'bg-emerald-500 text-neutral-950' :
                            activity.status === 'Pending' || activity.status === 'Processing' ? 'bg-amber-400 text-neutral-950 animate-pulse' :
                            activity.status === 'Cancelled' || activity.status === 'Failed' ? 'bg-rose-600 text-white' :
                            activity.status === 'Partially Filled' ? 'bg-sky-500 text-neutral-950' :
                            'bg-rose-600 text-white'
                          }`}>
                            {activity.status}
                          </span>
                        </td>

                        {/* Reference ID */}
                        <td className="py-3.5 px-5 text-center font-mono text-white font-black text-[9.5px]">
                          {activity.refId}
                        </td>

                        {/* Drawer Review Chevron CTA */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap text-neutral-400 group-hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-0.5 transition-transform" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          
          /* TIMELINE VIEW: chronological audit stream layout */
          <div className="relative pl-6 md:pl-10 space-y-6 text-left">
            {/* Connecting Vertical line */}
            <div className="absolute top-2 bottom-2 left-2.5 md:left-4 w-[2px] bg-neutral-800" />

            {filteredActivities.map(activity => {
              const isOutbound = activity.type === 'WITHDRAWAL' || activity.type === 'SELL';
              const isNeutral = ['LOGIN', 'PASSWORD_CHANGE', 'VERIFICATION', 'PAYMENT_ADDED', 'DELAYED', 'MAINTENANCE', 'HALT', 'REBALANCING', 'STOCK_SPLIT', 'TICKER_CHANGE'].includes(activity.type);
              
              return (
                <div 
                  key={activity.id}
                  onClick={() => setSelectedActivity(activity)}
                  className="relative group cursor-pointer bg-[#050505] border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 shadow-md transition-all active:scale-[0.99] max-w-3xl"
                >
                  {/* Outer circle marker on timeline */}
                  <div className="absolute -left-[27px] md:-left-[35px] top-4.5 w-4 h-4 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center group-hover:border-indigo-400 transition-colors shadow-sm">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isNeutral ? 'bg-indigo-400' : isOutbound ? 'bg-rose-400' : 'bg-emerald-400'
                    }`} />
                  </div>

                  {/* Body Content Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Left: Time and Title */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] text-neutral-300 font-mono tracking-tight font-bold">
                          {activity.timestamp}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[7.5px] font-black uppercase tracking-widest shadow-sm ${
                          activity.status === 'Completed' || activity.status === 'Filled' ? 'bg-emerald-500 text-neutral-950' :
                          activity.status === 'Pending' || activity.status === 'Processing' ? 'bg-amber-400 text-neutral-950 animate-pulse' :
                          activity.status === 'Cancelled' || activity.status === 'Failed' ? 'bg-rose-600 text-white' :
                          'bg-sky-500 text-neutral-950'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white group-hover:text-indigo-300 transition-colors">
                        {activity.eventName}
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-bold">
                        Payment system rail: <strong className="text-white font-bold">{activity.methodOrDetail}</strong> • Ref: <span className="font-mono text-indigo-300 font-black">{activity.refId}</span>
                      </p>
                    </div>

                    {/* Right: Amount or Value block */}
                    <div className="sm:text-right shrink-0 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-neutral-800 sm:border-t-0 flex sm:flex-col justify-between sm:justify-center">
                      <span className="text-[8.5px] text-neutral-400 uppercase tracking-widest block sm:mb-0.5 font-bold">Clearing Value</span>
                      <span className={`text-[12px] font-black font-mono ${
                        isNeutral ? 'text-neutral-300 font-bold' : isOutbound ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {isNeutral ? 'N/A' : isOutbound ? `-${activity.amount}` : `+${activity.amount}`}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ──────────────────── TRANSACTION DETAILS DRAWER (SIDE MODAL) ──────────────────── */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex justify-end">
          
          {/* Backdrop click closer */}
          <div 
            onClick={() => setSelectedActivity(null)}
            className="absolute inset-0 cursor-pointer"
          />

          {/* Side Sheet Panel */}
          <div className="relative bg-[#09090c] border-l border-neutral-800 w-full max-w-md h-full shadow-2xl flex flex-col z-10 animate-slideLeft">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between shadow-sm">
              <div>
                <span className="px-2 py-0.5 bg-indigo-600 rounded text-[8px] font-black tracking-widest text-white shadow-sm">
                  REGISTRY METADATA
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mt-1.5">
                  Permanent Ledger Record
                </h3>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-left text-[11px] leading-relaxed no-scrollbar">
              
              {/* SECTION 1: Event Summary */}
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 text-center space-y-2 shadow-sm">
                <span className="text-[8.5px] text-neutral-400 uppercase tracking-widest block font-bold">Event Description</span>
                <h4 className="text-sm font-black text-white">{selectedActivity.eventName}</h4>
                <div className="flex justify-center gap-2 pt-1">
                  <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-wider leading-none shadow-sm ${
                    selectedActivity.status === 'Completed' || selectedActivity.status === 'Filled' ? 'bg-emerald-500 text-neutral-950' :
                    selectedActivity.status === 'Pending' || selectedActivity.status === 'Processing' ? 'bg-amber-400 text-neutral-950 animate-pulse' :
                    selectedActivity.status === 'Cancelled' || selectedActivity.status === 'Failed' ? 'bg-rose-600 text-white' :
                    'bg-sky-500 text-neutral-950'
                  }`}>
                    {selectedActivity.status}
                  </span>
                </div>
              </div>

              {/* SECTION 2: Settlement Timeline Operations (Audit Trail) */}
              <div className="space-y-3.5">
                <span className="text-[9.5px] text-neutral-300 uppercase tracking-widest font-black block border-b border-neutral-800 pb-2">
                  Chronological Audit Trail
                </span>
                
                <div className="relative pl-5 space-y-4">
                  {/* timeline line */}
                  <div className="absolute top-1 bottom-1 left-1.5 w-[2px] bg-neutral-800" />

                  {selectedActivity.timeline.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* marker dot */}
                      <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-neutral-900 border-2 border-indigo-500 shadow-sm" />
                      <div className="flex justify-between items-center text-[9.5px]">
                        <span className="font-bold text-white">{step.label}</span>
                        <span className="text-neutral-300 font-mono font-bold">{step.timestamp}</span>
                      </div>
                      <p className="text-[9px] text-neutral-400 mt-0.5 leading-normal font-bold">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: Transaction Details Grid */}
              <div className="space-y-3">
                <span className="text-[9.5px] text-neutral-300 uppercase tracking-widest font-black block border-b border-neutral-800 pb-2">
                  Asset Parameters
                </span>
                
                <div className="grid grid-cols-2 gap-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 shadow-sm">
                  <div>
                    <span className="text-neutral-400 text-[8px] uppercase tracking-wider block font-bold">Target Asset / Currency</span>
                    <span className="text-white font-black block mt-0.5">{selectedActivity.asset}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[8px] uppercase tracking-wider block font-bold">Quantity / Volume</span>
                    <span className="text-white font-black block mt-0.5">{selectedActivity.quantity || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[8px] uppercase tracking-wider block font-bold">Reference Spot Price</span>
                    <span className="text-white font-black block mt-0.5">{selectedActivity.price || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[8px] uppercase tracking-wider block font-bold">Execution Gross Value</span>
                    <span className={`font-black block mt-0.5 ${
                      selectedActivity.type === 'WITHDRAWAL' || selectedActivity.type === 'SELL' 
                        ? 'text-rose-400' 
                        : ['LOGIN', 'PASSWORD_CHANGE', 'VERIFICATION', 'PAYMENT_ADDED', 'DELAYED', 'MAINTENANCE', 'HALT', 'REBALANCING', 'STOCK_SPLIT', 'TICKER_CHANGE'].includes(selectedActivity.type)
                          ? 'text-neutral-300 font-bold' 
                          : 'text-emerald-400'
                    }`}>
                      {selectedActivity.amount}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Metadata Parameters */}
              <div className="space-y-3.5">
                <span className="text-[9.5px] text-neutral-300 uppercase tracking-widest font-black block border-b border-neutral-800 pb-2">
                  Permanent Cryptographic Identifiers
                </span>

                <div className="space-y-2 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 font-mono text-[9px] shadow-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-bold">REFERENCE IDENTIFIER:</span>
                    <span className="text-white font-black">{selectedActivity.refId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-bold">CUSTODIAL GATEWAY:</span>
                    <span className="text-white font-bold">{selectedActivity.network || 'Internal Pool Core'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-bold">SETTLEMENT CLEAR RAIL:</span>
                    <span className="text-white font-bold">{selectedActivity.settlementRail || 'MTX Liquidity Swap'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 font-bold">CLEARING DESK FEES:</span>
                    <span className="text-indigo-400 font-bold">{selectedActivity.fees || '0.00%'}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-neutral-800 mt-1.5">
                    <span className="text-neutral-400 font-bold">LEDGER STATE BLOCK:</span>
                    <span className="text-emerald-400 font-black">CERTIFIED AMENDABLE</span>
                  </div>
                </div>
              </div>

              {/* Help & Safeguard Banner */}
              <div className="p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-[9px] text-neutral-300 shadow-sm">
                <div className="flex gap-2.5 items-start">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-neutral-300 font-bold">
                    This transaction represents an immutable ledger entry registered on the MTX clearing protocol under sovereign clearing authority.
                  </p>
                </div>
              </div>

            </div>

            {/* Footer Closer CTA */}
            <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-end shadow-md">
              <button
                onClick={() => setSelectedActivity(null)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-black uppercase text-[10px] tracking-wider rounded-lg transition-all cursor-pointer text-center active:scale-95 shadow-md"
              >
                Close Audit Record
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
