import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  LineChart as ChartIcon, 
  PieChart as PieIcon, 
  Zap, 
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Activity,
  Layers,
  Award,
  Search,
  Filter,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Building,
  RefreshCw,
  Sliders,
  Trash2,
  Lock,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import StockPickerModal, { CATALOG_ASSETS } from './StockPickerModal';
import { executeRootOrder } from '../services/tradingService';

interface Holding {
  symbol: string;
  name: string;
  isin: string;
  qty: number;
  avgCost: number;
  currentPrice: number;
}

const TICKER_META: Record<string, { name: string; isin: string; defaultPrice: number; type: 'stock' | 'etf' | 'crypto' | 'bluechip'; sector?: string }> = {
  'NVDA': { name: 'NVIDIA Corp.', isin: 'US67066G1040', defaultPrice: 125.40, type: 'stock', sector: 'technology' },
  'AAPL': { name: 'Apple Inc.', isin: 'US0378331005', defaultPrice: 182.30, type: 'stock', sector: 'technology' },
  'MSFT': { name: 'Microsoft Corp.', isin: 'US5949181045', defaultPrice: 421.90, type: 'stock', sector: 'technology' },
  'TSLA': { name: 'Tesla Inc.', isin: 'US88160R1014', defaultPrice: 178.60, type: 'stock', sector: 'large-cap' },
  'AMZN': { name: 'Amazon.com Inc.', isin: 'US0231351067', defaultPrice: 186.50, type: 'stock', sector: 'technology' },
  'GOOGL': { name: 'Alphabet Inc.', isin: 'US02079K3059', defaultPrice: 175.20, type: 'stock', sector: 'technology' },
  'META': { name: 'Meta Platforms Inc.', isin: 'US30303M1027', defaultPrice: 502.80, type: 'stock', sector: 'technology' },
  'AMD': { name: 'Advanced Micro Devices', isin: 'US0079031078', defaultPrice: 158.40, type: 'stock', sector: 'technology' },
  'PLTR': { name: 'Palantir Technologies', isin: 'US69608A1088', defaultPrice: 28.50, type: 'stock', sector: 'technology' },
  'SPY': { name: 'SPDR S&P 500 ETF Trust', isin: 'US78462F1030', defaultPrice: 510.00, type: 'etf', sector: 'large-cap' },
  'QQQ': { name: 'Invesco QQQ Trust', isin: 'US46090E1038', defaultPrice: 440.00, type: 'etf', sector: 'technology' },
  'VOO': { name: 'Vanguard S&P 500 ETF', isin: 'US9229083632', defaultPrice: 468.20, type: 'etf', sector: 'large-cap' },
  'DIA': { name: 'SPDR Dow Jones Industrial', isin: 'US78467X1090', defaultPrice: 392.40, type: 'etf', sector: 'large-cap' },
  'IWM': { name: 'iShares Russell 2000 ETF', isin: 'US4642876555', defaultPrice: 202.10, type: 'etf', sector: 'large-cap' },
  'BTC-USD': { name: 'Bitcoin (BTC)', isin: 'US09061G1013', defaultPrice: 67250.00, type: 'crypto', sector: 'crypto' },
  'ETH-USD': { name: 'Ethereum (ETH)', isin: 'US29760G1035', defaultPrice: 3450.00, type: 'crypto', sector: 'crypto' },
  'SOL-USD': { name: 'Solana (SOL)', isin: 'US83410G1025', defaultPrice: 145.00, type: 'crypto', sector: 'crypto' },
  'JPM': { name: 'JPMorgan Chase & Co.', isin: 'US46625H1005', defaultPrice: 198.50, type: 'stock', sector: 'large-cap' },
  'V': { name: 'Visa Inc.', isin: 'US92826C8394', defaultPrice: 275.60, type: 'stock', sector: 'large-cap' },
  'UNH': { name: 'UnitedHealth Group', isin: 'US91324P1021', defaultPrice: 488.00, type: 'stock', sector: 'large-cap' },
  'PG': { name: 'Procter & Gamble Co.', isin: 'US7427181091', defaultPrice: 165.20, type: 'stock', sector: 'large-cap' }
};

const DAILY_RETURNS: Record<string, number> = {
  'NVDA': 3.40,
  'AAPL': 2.10,
  'MSFT': 1.80,
  'TSLA': -1.20,
  'AMZN': 1.45,
  'GOOGL': 0.90,
  'META': 2.65,
  'AMD': 2.80,
  'PLTR': 4.15,
  'SPY': 0.85,
  'QQQ': 1.55,
  'VOO': 0.82,
  'DIA': 0.45,
  'IWM': 1.10,
  'BTC-USD': 2.40,
  'ETH-USD': 1.50,
  'SOL-USD': 4.20,
  'JPM': 0.70,
  'V': 0.50,
  'UNH': -0.30,
  'PG': 0.25
};

const TOTAL_RETURNS: Record<string, number> = {
  'NVDA': 45.50,
  'AAPL': 18.00,
  'MSFT': 9.00,
  'TSLA': -4.80,
  'AMZN': 22.10,
  'GOOGL': 14.50,
  'META': 36.20,
  'AMD': 19.80,
  'PLTR': 48.00,
  'SPY': 12.30,
  'QQQ': 15.10,
  'VOO': 12.10,
  'DIA': 8.60,
  'IWM': 6.40,
  'BTC-USD': 62.40,
  'ETH-USD': 28.90,
  'SOL-USD': 85.00,
  'JPM': 11.20,
  'V': 9.80,
  'UNH': 5.40,
  'PG': 4.20
};

interface PortfolioDeskProps {
  key?: React.Key;
  traderEmail: string;
  accountMode?: 'DEMO' | 'REAL';
}

export default function PortfolioDesk({ traderEmail, accountMode: propAccountMode }: PortfolioDeskProps) {
  const accountMode = propAccountMode || (
    typeof window !== 'undefined' ? (localStorage.getItem('mtx_account_mode') === 'REAL' ? 'REAL' : 'DEMO') : 'DEMO'
  );
  const isDemo = accountMode === 'DEMO';
  const cashStorageKey = isDemo ? 'mtx_demo_cash' : 'mtx_real_cash';
  const holdingsStorageKey = isDemo ? 'broker_holdings_demo' : 'broker_holdings_real';

  // Account cash balance state strictly isolated by mode
  const [cashBalance, setCashBalance] = useState<number>(() => {
    try {
      if (isDemo) {
        const saved = localStorage.getItem('mtx_demo_cash') || localStorage.getItem('broker_cash');
        return saved ? parseFloat(saved) : 100000.00;
      } else {
        const saved = localStorage.getItem('mtx_real_cash');
        const demoCash = parseFloat(localStorage.getItem('mtx_demo_cash') || '100000');
        // Unfunded real accounts strictly start at 0.00
        if (!saved || parseFloat(saved) === 58000 || parseFloat(saved) === 100000 || parseFloat(saved) === demoCash) {
          localStorage.setItem('mtx_real_cash', '0.00');
          return 0.00;
        }
        return Math.max(0, parseFloat(saved));
      }
    } catch {
      return isDemo ? 100000.00 : 0.00;
    }
  });

  // Stock Picker Modal state
  const [isStockPickerOpen, setIsStockPickerOpen] = useState(false);

  // Listen for global broker cash updates strictly matching active mode
  useEffect(() => {
    const handleCashUpdate = (e: any) => {
      if (e?.detail?.cash !== undefined) {
        if (e.detail.mode) {
          if ((e.detail.mode === 'DEMO' && isDemo) || (e.detail.mode === 'REAL' && !isDemo)) {
            setCashBalance(e.detail.cash);
          }
        } else {
          setCashBalance(e.detail.cash);
        }
      }
    };
    window.addEventListener('broker_cash_updated', handleCashUpdate);
    return () => window.removeEventListener('broker_cash_updated', handleCashUpdate);
  }, [isDemo]);
  
  // Custom interactive holdings list connected to mode-specific holdings storage
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    let holdingsMap: Record<string, number> = {};
    const detailedKey = `portfolio_detailed_holdings_${accountMode}`;
    try {
      const savedDetailed = localStorage.getItem(detailedKey);
      if (savedDetailed) {
        const parsedDetailed = JSON.parse(savedDetailed);
        if (Array.isArray(parsedDetailed) && parsedDetailed.length > 0) {
          return parsedDetailed
            .filter((h: any) => h && h.symbol && typeof h.qty === 'number' && h.qty > 0)
            .map((h: any) => ({
              symbol: h.symbol,
              name: h.name || `${h.symbol} Security`,
              isin: h.isin || ('US' + Math.random().toString(36).substring(2, 12).toUpperCase()),
              qty: h.qty,
              avgCost: h.avgCost || h.currentPrice || 150.00,
              currentPrice: h.currentPrice || 150.00
            }));
        }
      }
    } catch {}

    try {
      let saved = localStorage.getItem(holdingsStorageKey);
      if (!saved && isDemo) {
        saved = localStorage.getItem('broker_holdings');
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Detect legacy default mock portfolio (which pre-populated 6 mock stocks without user action)
          const keys = Object.keys(parsed);
          const isLegacyDefault = 
            keys.length === 6 && 
            parsed['AAPL'] === 50 && 
            parsed['MSFT'] === 30 && 
            parsed['NVDA'] === 100 && 
            parsed['BTC-USD'] === 0.15 && 
            parsed['SPY'] === 25 && 
            parsed['QQQ'] === 20;
          
          if (!isLegacyDefault) {
            holdingsMap = parsed;
          } else {
            localStorage.setItem(holdingsStorageKey, JSON.stringify({}));
          }
        }
      }
    } catch (e) {
      console.warn('Error loading holdings from localStorage:', e);
    }
    
    // Clean slate: If no executions, start with empty table
    if (Object.keys(holdingsMap).length === 0) {
      return [];
    }

    return Object.entries(holdingsMap)
      .filter(([_, qty]) => typeof qty === 'number' && qty > 0)
      .map(([symbol, qty]) => {
        const meta = TICKER_META[symbol] || { 
          name: `${symbol} Security`, 
          isin: 'US' + Math.random().toString(36).substring(2, 12).toUpperCase(), 
          defaultPrice: 150.00,
          type: 'stock' as const
        };
        return {
          symbol,
          name: meta.name,
          isin: meta.isin,
          qty,
          avgCost: meta.defaultPrice,
          currentPrice: meta.defaultPrice
        };
      });
  });

  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [liveReturns, setLiveReturns] = useState<Record<string, number>>({});

  const [timeframe, setTimeframe] = useState<string>('1M');
  const [tradeModal, setTradeModal] = useState<{ isOpen: boolean; holding: Holding | null; type: 'BUY' | 'SELL' }>({
    isOpen: false,
    holding: null,
    type: 'BUY'
  });
  const [tradeQuantity, setTradeQuantity] = useState<string>('');
  const [tradeStatusMsg, setTradeStatusMsg] = useState<string>('');
  const [selectedHistoryAsset, setSelectedHistoryAsset] = useState<Holding | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // Wealth Projection Calculator states
  const [wealthInitialInvestment, setWealthInitialInvestment] = useState<number>(10000);
  const [wealthMonthlyContribution, setWealthMonthlyContribution] = useState<number>(500);
  const [wealthYears, setWealthYears] = useState<number>(10);
  const [wealthApy, setWealthApy] = useState<number>(() => {
    const saved = localStorage.getItem('wealth_selected_apy');
    return saved ? parseFloat(saved) : 5.12;
  });

  // Handler for purchasing stocks via the Stock Picker
  const handleAddStockFromPicker = async (
    symbol: string,
    name: string,
    isin: string,
    dollarAmount: number,
    price: number
  ) => {
    if (dollarAmount > cashBalance) return;
    
    const acquiredShares = dollarAmount / price;
    
    const result = await executeRootOrder({
      symbol,
      name,
      isin,
      side: 'BUY',
      orderType: 'MARKET',
      sharesOrUnits: acquiredShares,
      dollarAmount,
      executionPrice: price,
      accountMode,
      paymentMethod: 'WALLET_CASH',
      reason: `Portfolio Desk Picker: Acquired $${dollarAmount.toFixed(2)} (${acquiredShares.toFixed(4)} shares) of ${symbol}.`,
      confidence: 95,
      confluences: ['Portfolio Desk Allocation', 'Stock Catalog Picker']
    });

    if (result.success) {
      setCashBalance(result.newCash);
      setHoldings(prev => {
        const existingIndex = prev.findIndex(h => h.symbol === symbol);
        let updated: Holding[];
        
        if (existingIndex >= 0) {
          const existing = prev[existingIndex];
          const oldVal = existing.qty * existing.avgCost;
          const totalVal = oldVal + dollarAmount;
          const totalQty = existing.qty + acquiredShares;
          const newAvg = totalQty > 0 ? totalVal / totalQty : price;
          
          updated = [...prev];
          updated[existingIndex] = {
            ...existing,
            qty: totalQty,
            avgCost: newAvg,
            currentPrice: price
          };
        } else {
          updated = [
            ...prev,
            {
              symbol,
              name,
              isin,
              qty: acquiredShares,
              avgCost: price,
              currentPrice: price
            }
          ];
        }
        return updated;
      });
    }
  };

  // Handler for liquidating all positions and resetting back to 100% demo/real cash
  const handleResetToCash = () => {
    const totalAssetsValue = holdingsWithLivePrices.reduce((sum, h) => sum + (h.qty * h.currentPrice), 0);
    const newCash = parseFloat((cashBalance + totalAssetsValue).toFixed(2));
    
    setCashBalance(newCash);
    localStorage.setItem(cashStorageKey, newCash.toString());
    if (isDemo) {
      localStorage.setItem('broker_cash', newCash.toString());
    }
    setHoldings([]);
    localStorage.setItem(holdingsStorageKey, JSON.stringify({}));
    const detailedKey = `portfolio_detailed_holdings_${accountMode}`;
    localStorage.removeItem(detailedKey);
    if (!isDemo) {
      syncCashWithServer(newCash);
    }
    
    window.dispatchEvent(new CustomEvent('broker_cash_updated', { detail: { cash: newCash, mode: accountMode } }));
    window.dispatchEvent(new Event('storage'));
  };

  // Helper to sync updated client cash balance with server ledger (for REAL accounts)
  const syncCashWithServer = async (newBalance: number) => {
    try {
      const res = await fetch('/api/funding/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientBalance: newBalance })
      });
      if (!res.ok) {
        console.warn('Failed to sync cash balance with server ledger (using local cache)');
      }
    } catch (e) {
      console.warn('Error syncing cash balance:', e);
    }
  };

  // Sync state changes to local storage to maintain absolute unity with Market Desk root
  useEffect(() => {
    // Guard against demo capital leaking into real cash storage
    if (!isDemo && (cashBalance === 100000 || cashBalance === 58000)) {
      return;
    }
    localStorage.setItem(cashStorageKey, cashBalance.toString());
    if (isDemo) {
      localStorage.setItem('broker_cash', cashBalance.toString());
    }
  }, [cashBalance, cashStorageKey, isDemo]);

  useEffect(() => {
    const holdingsMap: Record<string, number> = {};
    holdings.forEach(item => {
      holdingsMap[item.symbol] = item.qty;
    });
    localStorage.setItem(holdingsStorageKey, JSON.stringify(holdingsMap));
    const detailedKey = `portfolio_detailed_holdings_${accountMode}`;
    localStorage.setItem(detailedKey, JSON.stringify(holdings));
  }, [holdings, holdingsStorageKey, accountMode]);

  // Sync cash state from SQL database funding ledger on mount and poll for REAL accounts
  useEffect(() => {
    if (isDemo) return;
    let active = true;
    const fetchServerState = async () => {
      try {
        const res = await fetch('/api/funding/state');
        if (res.ok && active) {
          const data = await res.json();
          if (data && data.balance !== undefined) {
            const finalBal = data.balance === 58000 ? 0.00 : Math.max(0, data.balance);
            setCashBalance(finalBal);
            localStorage.setItem('mtx_real_cash', finalBal.toString());
            window.dispatchEvent(new CustomEvent('broker_cash_updated', { detail: { cash: finalBal, mode: 'REAL' } }));
          }
        }
      } catch (e) {
        console.warn('Failed to fetch funding state on load (handled fallback):', e);
      }
    };
    fetchServerState();
    
    // Poll every 4 seconds to grab real-time settled ledger updates for REAL accounts
    const interval = setInterval(fetchServerState, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isDemo]);

  // Fetch live market prices and returns dynamically from Yahoo Finance proxy
  useEffect(() => {
    let active = true;

    const fetchLiveMarketData = async () => {
      try {
        // Fetch top stocks for AAPL, MSFT, NVDA, TSLA
        const stocksRes = await fetch('/api/top-stocks');
        if (stocksRes.ok && active) {
          const data = await stocksRes.json();
          if (data && data.stocks) {
            const priceMap: Record<string, number> = {};
            const returnMap: Record<string, number> = {};
            data.stocks.forEach((stock: any) => {
              priceMap[stock.symbol] = stock.current;
              returnMap[stock.symbol] = stock.changePercent;
            });
            setLivePrices(prev => ({ ...prev, ...priceMap }));
            setLiveReturns(prev => ({ ...prev, ...returnMap }));
          }
        }

        // Fetch ETF, Crypto, and all active user-held tickers in parallel for live prices and day change percentages
        const defaultTickers = ['SPY', 'QQQ', 'BTC-USD', 'ETH-USD', 'SOL-USD'];
        const heldSymbols = holdings.map(h => h.symbol);
        const remainingTickers = Array.from(new Set([...defaultTickers, ...heldSymbols]))
          .filter(t => !['AAPL', 'MSFT', 'NVDA', 'TSLA'].includes(t));

        await Promise.all(
          remainingTickers.map(async (ticker) => {
            try {
              const res = await fetch(`/api/markets/historical?ticker=${ticker}&range=1d`);
              if (res.ok && active) {
                const data = await res.json();
                if (data) {
                  const price = data.regularMarketPrice || (data.bars && data.bars.length > 0 ? data.bars[data.bars.length - 1].close : null);
                  if (price !== null) {
                    setLivePrices(prev => ({ ...prev, [ticker]: price }));
                  }
                  if (data.bars && data.bars.length > 1) {
                    const first = data.bars[0].close;
                    const last = data.bars[data.bars.length - 1].close;
                    const changePercent = ((last - first) / first) * 100;
                    setLiveReturns(prev => ({ ...prev, [ticker]: parseFloat(changePercent.toFixed(2)) }));
                  }
                }
              }
            } catch (err) {
              console.warn(`Failed to fetch live data for ticker ${ticker}:`, err);
            }
          })
        );
      } catch (err) {
        console.warn('Error fetching live market data in PortfolioDesk:', err);
      }
    };

    fetchLiveMarketData();
    const interval = setInterval(fetchLiveMarketData, 10000); // refresh every 10s
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [holdings]);

  // Sync state with local storage updates & periodic checks
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCash = localStorage.getItem(cashStorageKey);
      if (savedCash) {
        setCashBalance(parseFloat(savedCash));
      } else {
        setCashBalance(isDemo ? 100000.00 : 0.00);
      }

      // Check detailed holdings first for exact trade execution cost basis
      const detailedKey = `portfolio_detailed_holdings_${accountMode}`;
      try {
        const savedDetailed = localStorage.getItem(detailedKey);
        if (savedDetailed) {
          const parsedDetailed = JSON.parse(savedDetailed);
          if (Array.isArray(parsedDetailed) && parsedDetailed.length > 0) {
            const list = parsedDetailed
              .filter((h: any) => h && h.symbol && typeof h.qty === 'number' && h.qty > 0)
              .map((h: any) => ({
                symbol: h.symbol,
                name: h.name || `${h.symbol} Security`,
                isin: h.isin || ('US' + Math.random().toString(36).substring(2, 12).toUpperCase()),
                qty: h.qty,
                avgCost: h.avgCost || h.currentPrice || 150.00,
                currentPrice: h.currentPrice || 150.00
              }));
            setHoldings(list);
            return;
          }
        }
      } catch {}

      let savedHoldings = localStorage.getItem(holdingsStorageKey);
      if (!savedHoldings && isDemo) {
        savedHoldings = localStorage.getItem('broker_holdings');
      }
      if (savedHoldings) {
        try {
          const parsed = JSON.parse(savedHoldings);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const holdingsMap: Record<string, number> = parsed;
            const newHoldingsList: Holding[] = Object.entries(holdingsMap)
              .filter(([_, qty]) => typeof qty === 'number' && qty > 0)
              .map(([symbol, qty]) => {
                const meta = TICKER_META[symbol] || {
                  name: `${symbol} Security`,
                  isin: 'US' + Math.random().toString(36).substring(2, 12).toUpperCase(),
                  defaultPrice: 150.00,
                  type: 'stock' as const
                };
                return {
                  symbol,
                  name: meta.name,
                  isin: meta.isin,
                  qty,
                  avgCost: meta.defaultPrice,
                  currentPrice: meta.defaultPrice
                };
              });
            setHoldings(newHoldingsList);
          }
        } catch (e) {
          console.warn('Failed to parse broker holdings local storage:', e);
        }
      } else {
        if (!isDemo) {
          setHoldings([]);
        }
      }
      const savedApy = localStorage.getItem('wealth_selected_apy');
      if (savedApy) {
        setWealthApy(parseFloat(savedApy));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('mtx_order_executed', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mtx_order_executed', handleStorageChange);
      clearInterval(interval);
    };
  }, [isDemo, accountMode, cashStorageKey, holdingsStorageKey]);

  // Build holdings array enriched with real-time live prices
  const holdingsWithLivePrices = holdings.map(item => {
    const livePrice = livePrices[item.symbol];
    return {
      ...item,
      currentPrice: livePrice !== undefined ? livePrice : item.currentPrice
    };
  });

  // Calculations
  const assetValue = holdingsWithLivePrices.reduce((sum, item) => sum + (item.qty * item.currentPrice), 0);
  const totalValue = assetValue + cashBalance;

  // Dynamic returns based on current active holdings
  const todayReturnAmount = holdingsWithLivePrices.reduce((sum, item) => {
    const retPercent = liveReturns[item.symbol] !== undefined ? liveReturns[item.symbol] : (DAILY_RETURNS[item.symbol] || 0);
    return sum + (item.qty * item.currentPrice * (retPercent / 100));
  }, 0);
  
  const todayReturnPercent = totalValue > 0 ? (todayReturnAmount / totalValue) * 100 : 0;

  // Lifetime return calculations from user-picked stock cost bases
  const totalCostBasis = holdingsWithLivePrices.reduce((sum, item) => sum + (item.qty * item.avgCost), 0);
  const netContributions = totalCostBasis + cashBalance;
  const lifetimeReturnAmount = holdingsWithLivePrices.length > 0 ? (assetValue - totalCostBasis) : 0;
  const lifetimeReturnPercent = totalCostBasis > 0 ? (lifetimeReturnAmount / totalCostBasis) * 100 : 0;

  // Asset class breakdown
  const getCategoryWeights = () => {
    let stocks = 0;
    let etfs = 0;
    let crypto = 0;
    
    holdingsWithLivePrices.forEach(item => {
      const meta = TICKER_META[item.symbol];
      const type = meta ? meta.type : 'stock';
      const val = item.qty * item.currentPrice;
      if (type === 'stock') stocks += val;
      else if (type === 'etf') etfs += val;
      else if (type === 'crypto') crypto += val;
    });

    const totalAssets = stocks + etfs + crypto + cashBalance;
    if (totalAssets === 0) return { stocks: 0, etfs: 0, crypto: 0, cash: 100 };

    return {
      stocks: (stocks / totalAssets) * 100,
      etfs: (etfs / totalAssets) * 100,
      crypto: (crypto / totalAssets) * 100,
      cash: (cashBalance / totalAssets) * 100
    };
  };

  const weights = getCategoryWeights();
  const allocationPieData = [
    { name: 'Stocks', value: weights.stocks, color: '#6366f1' },
    { name: 'ETFs', value: weights.etfs, color: '#10b981' },
    { name: 'Crypto', value: weights.crypto, color: '#f59e0b' },
    { name: 'Cash', value: weights.cash, color: '#06b6d4' }
  ].filter(item => item.value > 0.01);

  // Portfolio performance chart data
  const getPerformanceData = () => {
    const baseValue = totalValue;
    switch (timeframe) {
      case '1D':
        return Array.from({ length: 24 }, (_, i) => ({
          name: `${String(i).padStart(2, '0')}:00`,
          value: baseValue * (0.985 + (i * 0.015 / 23) + Math.sin(i / 2) * 0.003)
        }));
      case '1W':
        return [
          { name: 'Mon', value: baseValue * 0.965 },
          { name: 'Tue', value: baseValue * 0.98 },
          { name: 'Wed', value: baseValue * 0.972 },
          { name: 'Thu', value: baseValue * 0.99 },
          { name: 'Fri', value: baseValue * 0.985 },
          { name: 'Sat', value: baseValue * 1.002 },
          { name: 'Sun', value: baseValue }
        ];
      case '1M':
      default:
        return [
          { name: '06/02', value: baseValue * 0.91 },
          { name: '06/05', value: baseValue * 0.925 },
          { name: '06/08', value: baseValue * 0.94 },
          { name: '06/11', value: baseValue * 0.93 },
          { name: '06/14', value: baseValue * 0.95 },
          { name: '06/17', value: baseValue * 0.942 },
          { name: '06/20', value: baseValue * 0.965 },
          { name: '06/23', value: baseValue * 0.971 },
          { name: '06/26', value: baseValue * 0.99 },
          { name: '06/30', value: baseValue }
        ];
      case '3M':
        return [
          { name: 'Apr', value: baseValue * 0.84 },
          { name: 'May', value: baseValue * 0.92 },
          { name: 'Jun', value: baseValue }
        ];
      case 'YTD':
        return [
          { name: 'Jan', value: baseValue * 0.78 },
          { name: 'Feb', value: baseValue * 0.81 },
          { name: 'Mar', value: baseValue * 0.85 },
          { name: 'Apr', value: baseValue * 0.83 },
          { name: 'May', value: baseValue * 0.91 },
          { name: 'Jun', value: baseValue }
        ];
      case '1Y':
        return [
          { name: 'Jul 25', value: baseValue * 0.72 },
          { name: 'Sep 25', value: baseValue * 0.76 },
          { name: 'Nov 25', value: baseValue * 0.81 },
          { name: 'Jan 26', value: baseValue * 0.78 },
          { name: 'Mar 26', value: baseValue * 0.85 },
          { name: 'May 26', value: baseValue * 0.92 },
          { name: 'Jul 26', value: baseValue }
        ];
      case '5Y':
        return [
          { name: '2022', value: baseValue * 0.45 },
          { name: '2023', value: baseValue * 0.60 },
          { name: '2024', value: baseValue * 0.72 },
          { name: '2025', value: baseValue * 0.86 },
          { name: '2026', value: baseValue }
        ];
    }
  };

  // Compound Calculator Math for Portfolio Desk integration
  const calculateWealthCompoundData = () => {
    const rate = wealthApy / 100;
    const compoundFrequency = 12; // Monthly compounding
    const data = [];
    
    let totalContribution = wealthInitialInvestment;
    let balance = wealthInitialInvestment;

    data.push({
      year: 'Year 0',
      'Principal Invested': totalContribution,
      'Compounded Wealth': balance
    });

    for (let i = 1; i <= wealthYears; i++) {
      // Compounding loop for 12 months
      for (let m = 0; m < 12; m++) {
        balance = (balance + wealthMonthlyContribution) * (1 + rate / compoundFrequency);
        totalContribution += wealthMonthlyContribution;
      }
      data.push({
        year: `Yr ${i}`,
        'Principal Invested': Math.round(totalContribution),
        'Compounded Wealth': Math.round(balance)
      });
    }
    return data;
  };

  const wealthChartData = calculateWealthCompoundData();
  const wealthFinalBalance = wealthChartData[wealthChartData.length - 1]['Compounded Wealth'];
  const wealthFinalPrincipal = wealthChartData[wealthChartData.length - 1]['Principal Invested'];
  const wealthAccruedProfit = wealthFinalBalance - wealthFinalPrincipal;

  // Insights (Daily Briefing) calculations
  const largestPosition = holdingsWithLivePrices.length > 0 
    ? [...holdingsWithLivePrices].sort((a, b) => (b.qty * b.currentPrice) - (a.qty * a.currentPrice))[0]?.symbol 
    : 'None';
  
  const bestPerformer = holdingsWithLivePrices.length > 0
    ? [...holdingsWithLivePrices].sort((a, b) => {
        const aRet = liveReturns[a.symbol] !== undefined ? liveReturns[a.symbol] : (DAILY_RETURNS[a.symbol] || 0);
        const bRet = liveReturns[b.symbol] !== undefined ? liveReturns[b.symbol] : (DAILY_RETURNS[b.symbol] || 0);
        return bRet - aRet;
      })[0]?.symbol
    : 'None';

  const worstPerformer = holdingsWithLivePrices.length > 0
    ? [...holdingsWithLivePrices].sort((a, b) => {
        const aRet = liveReturns[a.symbol] !== undefined ? liveReturns[a.symbol] : (DAILY_RETURNS[a.symbol] || 0);
        const bRet = liveReturns[b.symbol] !== undefined ? liveReturns[b.symbol] : (DAILY_RETURNS[b.symbol] || 0);
        return aRet - bRet;
      })[0]?.symbol
    : 'None';

  // Exposure Breakdown calculations
  const techValue = holdingsWithLivePrices
    .filter(item => TICKER_META[item.symbol]?.sector === 'technology')
    .reduce((sum, item) => sum + (item.qty * item.currentPrice), 0);
  const techPct = (techValue / totalValue) * 100;

  const largeCapValue = holdingsWithLivePrices
    .filter(item => TICKER_META[item.symbol]?.sector === 'large-cap')
    .reduce((sum, item) => sum + (item.qty * item.currentPrice), 0);
  const largeCapPct = (largeCapValue / totalValue) * 100;

  const dividendValue = holdingsWithLivePrices
    .filter(item => ['AAPL', 'MSFT', 'SPY'].includes(item.symbol))
    .reduce((sum, item) => sum + (item.qty * item.currentPrice), 0);
  const dividendPct = (dividendValue / totalValue) * 100;

  // Open Trade Dialog
  const openTrade = (holding: Holding, type: 'BUY' | 'SELL') => {
    setTradeModal({ isOpen: true, holding, type });
    setTradeQuantity('');
    setTradeStatusMsg('');
  };

  // Execute Trade Order
  const executeTrade = async () => {
    if (!tradeModal.holding) return;
    const dollarAmt = parseFloat(tradeQuantity);
    if (isNaN(dollarAmt) || dollarAmt <= 0) {
      setTradeStatusMsg('ERROR: Enter a valid positive dollar amount.');
      return;
    }

    if (tradeModal.type === 'BUY' && dollarAmt < 10) {
      setTradeStatusMsg('ERROR: Minimum purchase amount is $10.00 for orders.');
      return;
    }

    const price = tradeModal.holding.currentPrice;
    const calculatedShares = dollarAmt / price;

    const result = await executeRootOrder({
      symbol: tradeModal.holding.symbol,
      name: tradeModal.holding.name,
      isin: tradeModal.holding.isin,
      side: tradeModal.type,
      orderType: 'MARKET',
      sharesOrUnits: calculatedShares,
      dollarAmount: dollarAmt,
      executionPrice: price,
      accountMode,
      paymentMethod: 'WALLET_CASH',
      reason: `Portfolio Desk Quick Order: ${tradeModal.type} $${dollarAmt.toFixed(2)} (${calculatedShares.toFixed(4)} shares) of ${tradeModal.holding.symbol}.`,
      confidence: 90,
      confluences: ['Portfolio Desk Execution', 'Direct Position Rebalance']
    });

    if (!result.success) {
      setTradeStatusMsg(`ERROR: ${result.error || 'Execution failed.'}`);
      return;
    }

    setCashBalance(result.newCash);
    if (tradeModal.type === 'BUY') {
      const updatedHoldings = holdings.map(item => {
        if (item.symbol === tradeModal.holding?.symbol) {
          return { ...item, qty: item.qty + calculatedShares };
        }
        return item;
      });
      setHoldings(updatedHoldings);
      setTradeStatusMsg(`SUCCESS: Purchase executed. Acquired ${calculatedShares.toFixed(4)} fractional shares.`);
    } else {
      const updatedHoldings = holdings.map(item => {
        if (item.symbol === tradeModal.holding?.symbol) {
          return { ...item, qty: Math.max(0, item.qty - calculatedShares) };
        }
        return item;
      }).filter(item => item.qty > 0.0001);
      setHoldings(updatedHoldings);
      setTradeStatusMsg(`SUCCESS: Sale executed. Disposed ${calculatedShares.toFixed(4)} fractional shares.`);
    }

    setTimeout(() => {
      setTradeModal({ isOpen: false, holding: null, type: 'BUY' });
      setTradeStatusMsg('');
    }, 1500);
  };

  // Quick Action Switch to Markets
  const viewAssetOnTerminal = (symbol: string) => {
    localStorage.setItem('broker_selected_symbol', symbol);
    // Custom window notification so MarketsTerminal will pull it if they switch tabs
    window.dispatchEvent(new CustomEvent('broker_symbol_select', { detail: { symbol } }));
    
    // We can show a beautiful toast
    const alertBox = document.createElement('div');
    alertBox.className = "fixed bottom-5 right-5 bg-indigo-900/90 border border-indigo-500 text-white font-mono text-[11px] p-4 rounded-lg shadow-2xl z-[9999] animate-fadeIn";
    alertBox.innerHTML = `<div><strong>INSTRUMENT SELECTED</strong></div><div class="text-white/70 mt-1">Loaded ${symbol} on System Terminal memory. Switch to Markets Workspace to view details.</div>`;
    document.body.appendChild(alertBox);
    setTimeout(() => {
      alertBox.className = alertBox.className + " animate-fadeOut";
      setTimeout(() => alertBox.remove(), 500);
    }, 4000);
  };

  const generateAssetHistory = (symbol: string, currentPrice: number) => {
    const points = [];
    const totalRet = TOTAL_RETURNS[symbol] || 15.0;
    const startPrice = currentPrice / (1 + totalRet / 100);
    const diff = currentPrice - startPrice;
    const months = ['Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26'];
    for (let i = 0; i < 12; i++) {
      const progress = i / 11;
      const noise = (Math.sin(i * 1.5) * 0.05 + Math.cos(i * 0.9) * 0.03) * currentPrice;
      const val = startPrice + (diff * progress) + noise;
      points.push({
        date: months[i],
        price: parseFloat(val.toFixed(2)),
        volume: Math.round((100000 + Math.sin(i) * 40000) * (currentPrice > 1000 ? 0.1 : 1))
      });
    }
    return points;
  };

  const getAssetStats = (symbol: string, currentPrice: number) => {
    const meta = TICKER_META[symbol] || { name: 'Unknown', isin: 'N/A', defaultPrice: 100, type: 'stock' };
    const retTotal = TOTAL_RETURNS[symbol] || 12.5;
    const isin = meta.isin || 'US0000000000';
    const high52 = currentPrice * 1.15;
    const low52 = currentPrice * 0.82;
    const volatility = Math.abs(retTotal * 0.4) + 12.2;
    const beta = meta.type === 'crypto' ? 1.85 : (meta.type === 'etf' ? 1.0 : 1.25);
    const sharpe = meta.type === 'crypto' ? 1.45 : 1.95;
    const volume24h = Math.round(currentPrice * 500000);

    return {
      isin,
      high52: `$${high52.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      low52: `$${low52.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      volatility: `${volatility.toFixed(2)}%`,
      beta: beta.toFixed(2),
      sharpe: sharpe.toFixed(2),
      volume24h: `$${volume24h.toLocaleString()}`,
      marketCap: meta.type === 'crypto' ? 'Decentralized Ledger' : (meta.type === 'etf' ? '$512.4 B' : `$${(currentPrice * 12500000 / 1e9).toFixed(1)} B`),
    };
  };

  return (
    <div className="space-y-6 text-white">

      {/* ──────────────────── TOP SUMMARY SECTION ──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Portfolio Value */}
        <motion.div 
          whileHover={{ y: -2, borderColor: 'rgba(99, 102, 241, 0.25)', boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.08)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          id="portfolio-val-card" 
          className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between transition-colors duration-200"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider font-bold block">Portfolio Value</span>
            <div className="p-1 text-indigo-400">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4 min-w-0">
            <h3 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white truncate">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className={`flex flex-wrap items-center gap-1 mt-1 font-bold text-[10px] font-mono ${todayReturnAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {todayReturnAmount >= 0 ? <TrendingUp className="w-3 h-3 shrink-0" /> : <TrendingDown className="w-3 h-3 shrink-0" />}
              <span className="truncate">{todayReturnAmount >= 0 ? '+' : '-'}${Math.abs(todayReturnAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Today</span>
              <span className={`shrink-0 ${todayReturnAmount >= 0 ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>({todayReturnPercent >= 0 ? '+' : ''}{todayReturnPercent.toFixed(2)}%)</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Invested Assets */}
        <motion.div 
          whileHover={{ y: -2, borderColor: 'rgba(16, 185, 129, 0.25)', boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.08)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          id="portfolio-invested-card" 
          className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between transition-colors duration-200"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider font-bold block">Invested Assets</span>
            <div className="p-1 text-emerald-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black font-mono tracking-tight text-white">
              ${assetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-white/70 font-mono block mt-1">
              {((assetValue / totalValue) * 100).toFixed(0)}% of Portfolio
            </span>
          </div>
        </motion.div>

        {/* Card 3: Available Cash */}
        <motion.div 
          whileHover={{ y: -2, borderColor: 'rgba(245, 158, 11, 0.25)', boxShadow: '0 4px 20px -2px rgba(245, 158, 11, 0.08)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          id="portfolio-cash-card" 
          className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between transition-colors duration-200"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider font-bold block">Available Cash</span>
            <div className="p-1 text-amber-400">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black font-mono tracking-tight text-white">
              ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-white/70 font-mono block mt-1">
              {((cashBalance / totalValue) * 100).toFixed(0)}% Cash Allocation
            </span>
          </div>
        </motion.div>

        {/* Card 4: Lifetime Return */}
        <motion.div 
          whileHover={{ y: -2, borderColor: 'rgba(99, 102, 241, 0.25)', boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.08)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          id="portfolio-lifetime-card" 
          className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between transition-colors duration-200"
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider font-bold block">Lifetime Return</span>
            <div className={`p-1 ${lifetimeReturnAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {lifetimeReturnAmount >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-black font-mono tracking-tight ${lifetimeReturnAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {lifetimeReturnAmount >= 0 ? '+' : ''}${lifetimeReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-white/70 font-mono block mt-1">
              {lifetimeReturnPercent >= 0 ? '+' : ''}{lifetimeReturnPercent.toFixed(2)}% Since Inception
            </span>
          </div>
        </motion.div>

      </div>

      {/* ──────────────────── MAIN PERFORMANCE SECTION & RIGHT SIDEBAR ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Performance Chart & Compounding Wealth Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Performance Chart Card */}
          <div className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 flex flex-col space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
              <div className="flex items-center gap-2">
                <ChartIcon className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Portfolio Performance Chart</h4>
              </div>
              
              {/* Timeframes Selector */}
              <div className="flex items-center bg-[#050505] border border-white/10 rounded-lg p-0.5 font-mono text-[9.5px] overflow-x-auto no-scrollbar max-w-full">
                {['1D', '1W', '1M', '3M', 'YTD', '1Y', '5Y'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer select-none shrink-0 focus:outline-none focus-visible:outline-none ${
                      timeframe === tf 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Main Visual Anchor Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getPerformanceData()} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ffffff" strokeOpacity={0.03} strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff" 
                    strokeOpacity={0.3} 
                    tick={{ fill: '#ffffff', fontSize: 9.5, fontFamily: 'monospace' }}
                    dy={6}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#ffffff" 
                    strokeOpacity={0.3} 
                    tick={{ fill: '#ffffff', fontSize: 9.5, fontFamily: 'monospace' }}
                    dx={-6}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={false} 
                    tickFormatter={(v) => `$${Math.round(v/1000)}k`} 
                    domain={['dataMin - 5000', 'dataMax + 5000']} 
                  />
                  <Tooltip 
                    cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.8)', fontSize: '9.5px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Under-chart metrics overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-t border-white/5 pt-4">
              <div className="font-mono min-w-0">
                <span className="text-[9px] text-white/70 uppercase tracking-wider block">Today's Return</span>
                <span className="text-xs font-black text-emerald-400 mt-0.5 block truncate">
                  +${todayReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({todayReturnPercent.toFixed(2)}%)
                </span>
              </div>
              <div className="font-mono border-t sm:border-t-0 sm:border-l border-white/5 pt-2 sm:pt-0 pl-0 sm:pl-4 min-w-0">
                <span className="text-[9px] text-white/70 uppercase tracking-wider block">Total Return</span>
                <span className={`text-xs font-black mt-0.5 block truncate ${lifetimeReturnAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {lifetimeReturnAmount >= 0 ? '+' : ''}${lifetimeReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({lifetimeReturnPercent.toFixed(2)}%)
                </span>
              </div>
              <div className="font-mono border-t sm:border-t-0 sm:border-l border-white/5 pt-2 sm:pt-0 pl-0 sm:pl-4 min-w-0">
                <span className="text-[9px] text-white/70 uppercase tracking-wider block">Net Contributions</span>
                <span className="text-xs font-black text-white/85 mt-0.5 block truncate">
                  ${netContributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: COMPOUNDING WEALTH PROJECTION */}
          <div id="portfolio-wealth-projection" className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 space-y-5">
            <div className="pb-3 border-b border-neutral-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Compounding Wealth Projection</h4>
                <p className="text-[9.5px] text-white/70 font-mono uppercase tracking-wider mt-0.5">Asset Allocation model using selected APY ({wealthApy.toFixed(2)}%)</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[9.5px] font-mono font-bold tracking-tight uppercase shadow-sm">
                Accumulation Engine
              </span>
            </div>

            {/* Controller Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-white/70 text-[10px]">
                  <span>Initial Deposit:</span>
                  <span className="text-indigo-400 font-bold">${wealthInitialInvestment.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="250000"
                  step="1000"
                  value={wealthInitialInvestment}
                  onChange={(e) => setWealthInitialInvestment(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-white/70 text-[10px]">
                  <span>Monthly Addition:</span>
                  <span className="text-indigo-400 font-bold">${wealthMonthlyContribution.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={wealthMonthlyContribution}
                  onChange={(e) => setWealthMonthlyContribution(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-white/70 text-[10px]">
                  <span>Accumulation Years:</span>
                  <span className="text-indigo-400 font-bold">{wealthYears} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={wealthYears}
                  onChange={(e) => setWealthYears(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Recharts Compound Chart representation */}
            <div className="h-44 font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={wealthChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portWealthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="portPrincipalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ffffff" strokeOpacity={0.03} strokeDasharray="3 3" />
                  <XAxis dataKey="year" stroke="#ffffff" fontSize={9.5} fontFamily="monospace" dy={4} tickLine={false} tick={{ fill: '#ffffff' }} />
                  <YAxis stroke="#ffffff" fontSize={9.5} fontFamily="monospace" dx={-4} tickLine={false} tick={{ fill: '#ffffff' }} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip 
                    cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '9.5px', fontFamily: 'monospace' }}
                    itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Area type="monotone" dataKey="Principal Invested" stroke="#4f46e5" strokeWidth={1.5} fillOpacity={1} fill="url(#portPrincipalGrad)" />
                  <Area type="monotone" dataKey="Compounded Wealth" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#portWealthGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Calculation Readout Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#050505] border border-white/5 p-4 rounded-xl text-center font-mono text-xs">
              <div>
                <span className="text-[9px] text-white/70 uppercase tracking-wider block">Total Sourced Principal</span>
                <span className="text-base font-bold text-white block mt-1">${wealthFinalPrincipal.toLocaleString()}</span>
              </div>
              <div className="border-t sm:border-t-0 sm:border-x border-white/5 py-3 sm:py-0">
                <span className="text-[9px] text-white/70 uppercase tracking-wider block">Est. Interest Compounded</span>
                <span className="text-base font-bold text-emerald-400 block mt-1">+${wealthAccruedProfit.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-white/70 uppercase tracking-wider block">Projected Total Wealth</span>
                <span className="text-base font-black text-indigo-400 block mt-1">${wealthFinalBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          
          {/* Card 1: Asset Allocation */}
          <div className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 flex flex-col relative">
            <span className="text-[10px] text-white/70 font-mono uppercase tracking-widest font-black mb-3">Asset Allocation</span>
            
            <div className="h-44 flex items-center justify-center relative my-1 select-none">
              <svg viewBox="0 0 200 200" className="w-full h-full max-w-[175px] max-h-[175px] overflow-visible">
                {allocationPieData.length === 1 ? (
                  <circle
                    cx="100"
                    cy="100"
                    r="58"
                    fill="none"
                    stroke={allocationPieData[0].color}
                    strokeWidth="18"
                    className="transition-all duration-300"
                    onMouseEnter={() => setHoveredSlice(allocationPieData[0].name)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                ) : (
                  (() => {
                    const totalWeight = allocationPieData.reduce((acc, curr) => acc + curr.value, 0) || 100;
                    let currentAngle = 0;
                    return allocationPieData.map((slice) => {
                      const angleSweep = (slice.value / totalWeight) * 360;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angleSweep;
                      currentAngle += angleSweep;

                      const isHovered = hoveredSlice === slice.name;
                      const innerR = isHovered ? 46 : 48;
                      const outerR = isHovered ? 72 : 68;
                      
                      const gap = angleSweep > 5 ? 2.5 : 0;
                      const pStart = startAngle + gap / 2;
                      const pEnd = endAngle - gap / 2;

                      // Helper for polar coords
                      const rad = (deg: number) => ((deg - 90) * Math.PI) / 180.0;
                      const sOuter = { x: 100 + outerR * Math.cos(rad(pEnd)), y: 100 + outerR * Math.sin(rad(pEnd)) };
                      const eOuter = { x: 100 + outerR * Math.cos(rad(pStart)), y: 100 + outerR * Math.sin(rad(pStart)) };
                      const sInner = { x: 100 + innerR * Math.cos(rad(pStart)), y: 100 + innerR * Math.sin(rad(pStart)) };
                      const eInner = { x: 100 + innerR * Math.cos(rad(pEnd)), y: 100 + innerR * Math.sin(rad(pEnd)) };

                      const largeArc = (pEnd - pStart) <= 180 ? '0' : '1';
                      const pathData = `M ${sOuter.x} ${sOuter.y} A ${outerR} ${outerR} 0 ${largeArc} 0 ${eOuter.x} ${eOuter.y} L ${sInner.x} ${sInner.y} A ${innerR} ${innerR} 0 ${largeArc} 1 ${eInner.x} ${eInner.y} Z`;

                      return (
                        <path
                          key={slice.name}
                          d={pathData}
                          fill={slice.color}
                          stroke="#050505"
                          strokeWidth="2"
                          className="cursor-pointer transition-all duration-200 hover:brightness-115"
                          style={{
                            filter: isHovered ? `drop-shadow(0 0 6px ${slice.color}88)` : 'none'
                          }}
                          onMouseEnter={() => setHoveredSlice(slice.name)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      );
                    });
                  })()
                )}
              </svg>

              {/* Central Dynamic Readout */}
              <div className="absolute text-center flex flex-col items-center justify-center pointer-events-none">
                {(() => {
                  const activeHover = hoveredSlice ? allocationPieData.find(s => s.name === hoveredSlice) : null;
                  if (activeHover) {
                    const activeAmount = (activeHover.value / 100) * totalValue;
                    return (
                      <>
                        <span className="text-[7.5px] uppercase tracking-wider font-mono font-bold" style={{ color: activeHover.color }}>
                          {activeHover.name}
                        </span>
                        <span className="text-[11.5px] font-black text-white font-mono mt-0.5">
                          ${Math.round(activeAmount).toLocaleString()}
                        </span>
                        <span className="text-[8px] text-white/50 font-mono">
                          {activeHover.value.toFixed(1)}%
                        </span>
                      </>
                    );
                  }
                  return (
                    <>
                      <span className="text-[8px] text-white/60 uppercase tracking-wider font-mono">Portfolio</span>
                      <span className="text-[12px] font-black text-white font-mono mt-0.5">
                        ${Math.round(totalValue).toLocaleString()}
                      </span>
                      <span className="text-[7.5px] text-emerald-400 font-mono font-bold">
                        100% ALLOCATED
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {['Stocks', 'ETFs', 'Crypto', 'Cash'].map((cat, idx) => {
                const colors = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4'];
                const values = [weights.stocks, weights.etfs, weights.crypto, weights.cash];
                const isHovered = hoveredSlice === cat;
                return (
                  <div 
                    key={cat} 
                    onMouseEnter={() => setHoveredSlice(cat)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`flex items-center justify-between p-1.5 rounded font-mono text-[9px] cursor-pointer transition-all duration-150 border ${
                      isHovered 
                        ? 'bg-white/10 border-white/20 shadow-sm' 
                        : 'bg-[#050505] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[idx] }} />
                      <span className={isHovered ? 'text-white font-bold' : 'text-white/70'}>{cat}</span>
                    </div>
                    <span className="text-white font-bold">{Math.round(values[idx])}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Portfolio Insights */}
          <div className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 font-mono text-[10px] space-y-3.5">
            <span className="text-[10px] text-white/70 font-mono uppercase tracking-widest font-black block">Portfolio Insights</span>
            
            <div className="space-y-2 bg-[#050505] p-3 rounded-lg border border-neutral-800/80">
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/80">
                <span className="text-white/70">Largest Position</span>
                <span className="text-white font-black">{largestPosition}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/80">
                <span className="text-white/70">Best Performer</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  {bestPerformer} <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800/80">
                <span className="text-white/70">Worst Performer</span>
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  {worstPerformer} <ArrowDownRight className="w-3 h-3 text-rose-400" />
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-white/70">Cash Position</span>
                <span className="text-amber-400 font-bold">{weights.cash.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Exposure Breakdown */}
          <div className="bg-[#050505] border border-neutral-800/80 rounded-xl p-5 font-mono text-[10px] space-y-3.5">
            <div className="flex justify-between items-center border-b border-neutral-800/80 pb-2">
              <div>
                <span className="text-[10px] text-white/70 font-mono uppercase tracking-widest font-black block">Asset Exposure Weightings</span>
                <span className="text-[8px] text-white/60 font-sans block mt-0.5">Click category to audit contributing assets</span>
              </div>
              <Layers className="w-3.5 h-3.5 text-white/60" />
            </div>
            
            <div className="space-y-3">
              {[
                {
                  id: 'technology',
                  label: 'Technology sector',
                  pct: techPct,
                  barColor: 'bg-indigo-500',
                  colorTheme: 'text-indigo-400',
                  assets: holdingsWithLivePrices.filter(item => TICKER_META[item.symbol]?.sector === 'technology')
                },
                {
                  id: 'large-cap',
                  label: 'Large Cap assets',
                  pct: largeCapPct,
                  barColor: 'bg-emerald-500',
                  colorTheme: 'text-emerald-400',
                  assets: holdingsWithLivePrices.filter(item => TICKER_META[item.symbol]?.sector === 'large-cap')
                },
                {
                  id: 'dividend',
                  label: 'Dividend Assets',
                  pct: dividendPct,
                  barColor: 'bg-amber-500',
                  colorTheme: 'text-amber-400',
                  assets: holdingsWithLivePrices.filter(item => ['AAPL', 'MSFT', 'SPY'].includes(item.symbol))
                },
                {
                  id: 'cash',
                  label: 'Cash Position',
                  pct: weights.cash,
                  barColor: 'bg-pink-500',
                  colorTheme: 'text-pink-400',
                  assets: [
                    {
                      symbol: 'USD',
                      name: 'Unallocated Collateral Cash',
                      qty: 1,
                      currentPrice: cashBalance,
                      avgCost: 1.0,
                      isin: 'US-CASH-COLLATERAL'
                    }
                  ]
                }
              ].map((category) => {
                const isExpanded = expandedCategory === category.id;
                return (
                  <div key={category.id} className="border border-white/5 rounded-lg p-2 hover:border-white/10 transition-colors">
                    {/* Header */}
                    <div 
                      onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                      className="flex justify-between items-center cursor-pointer select-none py-1 group"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between text-[9px] mb-1 pr-2">
                          <span className="text-white/60 group-hover:text-white transition-colors flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${category.barColor}`} />
                            {category.label}
                          </span>
                          <span className="text-white/80 font-bold group-hover:text-white transition-colors">
                            {category.pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-[#040405] h-1 rounded overflow-hidden">
                          <div className={`${category.barColor} h-full transition-all duration-500`} style={{ width: `${category.pct}%` }} />
                        </div>
                      </div>
                      <div className="pl-2 text-neutral-500 group-hover:text-white/80 transition-colors">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {/* Expandable Asset Table */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ 
                            height: { type: 'spring', stiffness: 240, damping: 26 },
                            opacity: { duration: 0.15 }
                          }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2">
                            <div className="p-2 bg-[#040405] border border-white/5 rounded-md overflow-x-auto">
                            <table className="w-full text-left font-mono text-[8px] text-neutral-400 border-collapse">
                              <thead>
                                <tr className="border-b border-white/10 text-white/80">
                                  <th className="py-1 px-1 font-bold uppercase tracking-wider">Asset</th>
                                  <th className="py-1 px-1 text-right font-bold uppercase tracking-wider">Qty</th>
                                  <th className="py-1 px-1 text-right font-bold uppercase tracking-wider">Price</th>
                                  <th className="py-1 px-1 text-right font-bold uppercase tracking-wider">Value</th>
                                  <th className="py-1 px-1 text-right font-bold uppercase tracking-wider">Weight</th>
                                </tr>
                              </thead>
                              <tbody>
                                {category.assets.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="py-2 text-center text-white/50 italic">No assets active in this category</td>
                                  </tr>
                                ) : (
                                  category.assets.map((asset) => {
                                    const value = asset.qty * asset.currentPrice;
                                    const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
                                    return (
                                      <tr key={asset.symbol} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                        <td className="py-1.5 px-1 font-bold text-white flex flex-col">
                                          <span>{asset.symbol}</span>
                                          <span className="text-[7px] text-white/60 font-normal truncate max-w-[85px]" title={asset.name}>
                                            {asset.name}
                                          </span>
                                        </td>
                                        <td className="py-1.5 px-1 text-right font-mono">
                                          {asset.qty >= 1 ? asset.qty.toLocaleString() : asset.qty.toFixed(4)}
                                        </td>
                                        <td className="py-1.5 px-1 text-right font-mono">
                                          ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-1.5 px-1 text-right font-bold text-amber-400">
                                          ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className={`py-1.5 px-1 text-right font-bold ${category.colorTheme}`}>
                                          {weight.toFixed(1)}%
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ──────────────────── PORTFOLIO METRICS SECTION ──────────────────── */}
      <div className="bg-[#050505] border border-white/5 rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 font-mono text-[10px]">
          <div className="p-2.5 bg-[#050505] border border-white/5 rounded-lg flex flex-col justify-between">
            <span className="text-white/70 uppercase tracking-wider text-[8px]">Day P/L</span>
            <span className="text-xs font-black text-emerald-400 mt-1">
              +${todayReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2.5 bg-[#050505] border border-white/5 rounded-lg flex flex-col justify-between">
            <span className="text-white/70 uppercase tracking-wider text-[8px]">Total P/L</span>
            <span className={`text-xs font-black mt-1 ${lifetimeReturnAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {lifetimeReturnAmount >= 0 ? '+' : ''}${lifetimeReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2.5 bg-[#050505] border border-white/5 rounded-lg flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-white/70 uppercase tracking-wider text-[8px]">Annualized Return</span>
            <span className="text-xs font-black text-indigo-400 mt-1">
              +13.4%
            </span>
          </div>

          <div className="p-2.5 bg-[#050505] border border-white/5 rounded-lg flex flex-col justify-between">
            <span className="text-white/70 uppercase tracking-wider text-[8px]">Net Contributions</span>
            <span className="text-xs font-black text-white/80 mt-1">
              ${netContributions.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 bg-[#050505] border border-white/5 rounded-lg flex flex-col justify-between">
            <span className="text-white/70 uppercase tracking-wider text-[8px]">Buying Power</span>
            <span className="text-xs font-black text-amber-400 mt-1">
              ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────────── HOLDINGS TABLE ──────────────────── */}
      <div className="bg-[#050505] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Custom Portfolio Holdings</h4>
            <span className="px-2 py-0.5 bg-white/5 text-white/70 rounded text-[9px] font-mono">
              {holdingsWithLivePrices.length} {holdingsWithLivePrices.length === 1 ? 'Asset' : 'Assets'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {holdingsWithLivePrices.length > 0 && (
              <button
                onClick={handleResetToCash}
                className="px-3 py-1.5 bg-white/5 hover:bg-rose-500/10 text-white/70 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                title="Liquidate all positions and return to 100% demo cash"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Cash
              </button>
            )}
            
            <button
              onClick={() => setIsStockPickerOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              Pick Stocks & Build Portfolio
            </button>
          </div>
        </div>

        {holdingsWithLivePrices.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Portfolio is 100% Cash Ready
              </h3>
              <p className="text-xs text-white/60 font-mono leading-relaxed">
                You currently have <span className="text-emerald-400 font-bold">${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> in demo cash. Build your custom investment allocation by choosing from our tech giants, index ETFs, blue chips, or crypto assets.
              </p>
            </div>
            <button
              onClick={() => setIsStockPickerOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer hover:scale-[1.03]"
            >
              <Plus className="w-4 h-4" />
              Pick Stocks Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#050505] font-mono text-[9px] text-white/80 uppercase tracking-wider">
                  <th className="py-3 px-5 font-bold">Symbol</th>
                  <th className="py-3 px-5 font-bold">Asset Name</th>
                  <th className="py-3 px-5 font-bold text-right">Quantity</th>
                  <th className="py-3 px-5 font-bold text-right">Average Cost</th>
                  <th className="py-3 px-5 font-bold text-right">Market Price</th>
                  <th className="py-3 px-5 font-bold text-right">Market Value</th>
                  <th className="py-3 px-5 font-bold text-right">Today's Return</th>
                  <th className="py-3 px-5 font-bold text-right">Total Return</th>
                  <th className="py-3 px-5 font-bold text-right">Allocation %</th>
                  <th className="py-3 px-5 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {holdingsWithLivePrices.map((item) => {
                  const mktVal = item.qty * item.currentPrice;
                  const weightPct = totalValue > 0 ? (mktVal / totalValue) * 100 : 0;
                  const retToday = liveReturns[item.symbol] !== undefined ? liveReturns[item.symbol] : (DAILY_RETURNS[item.symbol] || 0.00);
                  const retTotal = item.avgCost > 0 
                    ? ((item.currentPrice - item.avgCost) / item.avgCost) * 100 
                    : (TOTAL_RETURNS[item.symbol] || 0.00);

                  return (
                    <tr 
                      key={item.symbol} 
                      onClick={() => setSelectedHistoryAsset(item)}
                      className="hover:bg-white/[0.03] active:bg-white/[0.05] transition-all group cursor-pointer"
                      title="Click row to view detailed historical performance"
                    >
                      <td className="py-3.5 px-5 font-black text-white">{item.symbol}</td>
                      <td className="py-3.5 px-5 text-white/70">{item.name}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-white/95">
                        {item.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>
                      <td className="py-3.5 px-5 text-right text-white/80">
                        ${item.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-indigo-300">
                        ${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-white">
                        ${mktVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3.5 px-5 text-right font-bold ${retToday >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {retToday >= 0 ? '+' : ''}{retToday.toFixed(2)}%
                      </td>
                      <td className={`py-3.5 px-5 text-right font-bold ${retTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {retTotal >= 0 ? '+' : ''}{retTotal.toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-5 text-right text-white/70">{weightPct.toFixed(1)}%</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => { e.stopPropagation(); openTrade(item, 'BUY'); }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold uppercase transition-all cursor-pointer focus:outline-none focus-visible:outline-none hover:scale-[1.03] shadow-sm select-none"
                            title="Instant Buy Order"
                          >
                            BUY
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openTrade(item, 'SELL'); }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[9px] font-bold uppercase transition-all cursor-pointer focus:outline-none focus-visible:outline-none hover:scale-[1.03] shadow-sm select-none"
                            title="Instant Sell Order"
                          >
                            SELL
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Optional Section: Dividend summary indicators */}
        <div className="p-4 bg-gradient-to-r from-[#040405] to-transparent border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-3">
            <Info className="w-3.5 h-3.5 text-white/60" />
            <span className="text-white/70">Portfolio Dividend Estimate:</span>
            <span className="text-white font-bold">
              ${(holdingsWithLivePrices.length > 0 ? 612.00 : 0.00).toFixed(2)} Annual
            </span>
            <span className="text-white/40">|</span>
            <span className="text-white/70">Weighted Yield:</span>
            <span className="text-emerald-400 font-bold">
              {holdingsWithLivePrices.length > 0 ? '1.8%' : '0.0%'}
            </span>
          </div>
          <span className="text-white/50 font-light text-[9px]">MTX Portfolio Analyst v3.0</span>
        </div>
      </div>

      {/* ──────────────────── INTERACTIVE ORDER TRADE FORM DIALOG ──────────────────── */}
      {tradeModal.isOpen && tradeModal.holding && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#09090c] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4 font-mono animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-[9px] font-bold tracking-widest shadow-sm ${tradeModal.type === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                  {tradeModal.type} ORDER
                </span>
                <span className="text-xs font-bold text-white">{tradeModal.holding.symbol}</span>
              </div>
              <button 
                onClick={() => setTradeModal({ isOpen: false, holding: null, type: 'BUY' })}
                className="p-1 hover:bg-white/5 rounded text-white/60 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price Readout */}
            <div className="bg-[#040405] p-3 rounded border border-white/5 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-white/70">Instrument:</span>
                <span className="text-white font-bold">{tradeModal.holding.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Settlement Price:</span>
                <span className="text-indigo-300 font-bold">${tradeModal.holding.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Current Position:</span>
                <span className="text-white font-bold">{tradeModal.holding.qty} shares</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1.5 text-amber-400">
                <span>Available Cash:</span>
                <span className="font-bold">${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-2">
              <label className="text-[9px] text-white/70 uppercase tracking-wider block">
                {tradeModal.type === 'BUY' ? 'Dollar Amount to Buy ($)' : 'Dollar Amount to Sell ($)'} {tradeModal.type === 'BUY' && <span className="text-emerald-400 font-bold">(MIN $50)</span>}
              </label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 font-bold font-mono">$</span>
                  <input
                    type="number"
                    step="any"
                    value={tradeQuantity}
                    onChange={(e) => {
                      let cleaned = e.target.value;
                      if (/^0\d+/.test(cleaned)) {
                        cleaned = cleaned.replace(/^0+/, '');
                      }
                      setTradeQuantity(cleaned);
                    }}
                    placeholder="0.00"
                    className="w-full bg-[#040405] border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:outline-none rounded pl-7 pr-3 py-2 text-white font-bold text-sm text-left font-mono"
                  />
                </div>
                
                {/* Max Quick Selector */}
                <button
                  type="button"
                  onClick={() => {
                    if (tradeModal.type === 'BUY') {
                      setTradeQuantity(cashBalance.toFixed(2));
                    } else {
                      const maxSellVal = (tradeModal.holding?.qty || 0) * (tradeModal.holding?.currentPrice || 0);
                      setTradeQuantity(maxSellVal.toFixed(2));
                    }
                  }}
                  className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] transition-all font-bold shadow-sm select-none cursor-pointer focus:outline-none focus-visible:outline-none"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Total Transaction Calculation */}
            {parseFloat(tradeQuantity) > 0 && (
              <div className="p-2.5 bg-indigo-500/5 rounded border border-indigo-500/10 text-[10px] space-y-1 text-indigo-300">
                <div className="flex justify-between items-center">
                  <span>Calculated Shares:</span>
                  <span className="font-mono text-white font-bold">
                    {(parseFloat(tradeQuantity) / (tradeModal.holding?.currentPrice || 1)).toFixed(6)} shares
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px] text-white/70">
                  <span>Fractional Settlement:</span>
                  <span className="uppercase text-emerald-400 font-bold">Guaranteed Match</span>
                </div>
              </div>
            )}

            {/* Status alerts */}
            {tradeStatusMsg && (
              <div className={`p-2 rounded text-[9px] text-center font-bold ${tradeStatusMsg.startsWith('SUCCESS') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {tradeStatusMsg}
              </div>
            )}

            {/* Execution CTA Action */}
            <button
              onClick={executeTrade}
              className={`w-full py-2.5 rounded font-bold tracking-widest text-xs transition-all uppercase shadow-md select-none cursor-pointer focus:outline-none focus-visible:outline-none ${tradeModal.type === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'}`}
            >
              EXECUTE SECURE {tradeModal.type}
            </button>

          </div>
        </div>
      )}

      {/* ──────────────────── DETAILED HISTORICAL PERFORMANCE DIALOG ──────────────────── */}
      {selectedHistoryAsset && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#09090c] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-5 font-mono animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-indigo-600 rounded text-[9px] font-bold tracking-widest text-white shadow-sm">
                    HISTORICAL METRICS
                  </span>
                  <span className="text-xs font-bold text-white">{selectedHistoryAsset.symbol}</span>
                  <span className="text-[10px] text-white/60 font-normal">| {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).isin}</span>
                </div>
                <h3 className="text-base font-black text-white mt-1.5">{selectedHistoryAsset.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedHistoryAsset(null)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price Performance Metrics Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#040405] p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-[8px] text-white/70 uppercase tracking-wider block">Current Price</span>
                <span className="text-base font-black text-white block mt-1">
                  ${selectedHistoryAsset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[8px] text-white/70 uppercase tracking-wider block">Your Position</span>
                <span className="text-base font-bold text-indigo-300 block mt-1">
                  {selectedHistoryAsset.qty.toLocaleString()} shares
                </span>
              </div>
              <div>
                <span className="text-[8px] text-white/70 uppercase tracking-wider block">Total Value</span>
                <span className="text-base font-black text-white block mt-1">
                  ${(selectedHistoryAsset.qty * selectedHistoryAsset.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[8px] text-white/70 uppercase tracking-wider block">Overall Return</span>
                {(() => {
                  const modalRet = selectedHistoryAsset.avgCost > 0
                    ? ((selectedHistoryAsset.currentPrice - selectedHistoryAsset.avgCost) / selectedHistoryAsset.avgCost) * 100
                    : (TOTAL_RETURNS[selectedHistoryAsset.symbol] || 0.00);
                  return (
                    <span className={`text-base font-black mt-1 block ${modalRet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {modalRet >= 0 ? '+' : ''}{modalRet.toFixed(2)}%
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Performance Chart Title */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-white/70 uppercase tracking-wider font-bold block">12-Month Historical Price Trend</span>
              <span className="text-[9px] text-white bg-emerald-600 px-2.5 py-1 rounded font-bold shadow-sm">
                Daily Updated Settlement
              </span>
            </div>

            {/* Performance Chart */}
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={generateAssetHistory(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice)} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="historyColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#ffffff" fontSize={9} fontFamily="monospace" tickLine={false} tick={{ fill: '#ffffff' }} />
                  <YAxis stroke="#ffffff" fontSize={9} fontFamily="monospace" tickLine={false} tick={{ fill: '#ffffff' }} tickFormatter={(v) => `$${v}`} domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                    formatter={(value: any) => [`$${value}`, 'Price']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#historyColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Asset Statistics Bento Grid */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <span className="text-[10px] text-white/70 uppercase tracking-wider font-bold block">Key Quantitative Indicators</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg">
                  <span className="text-white/70 text-[8px] uppercase tracking-wider block">52-Week High</span>
                  <span className="text-white font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).high52}
                  </span>
                </div>
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg">
                  <span className="text-white/70 text-[8px] uppercase tracking-wider block">52-Week Low</span>
                  <span className="text-white font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).low52}
                  </span>
                </div>
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg">
                  <span className="text-white/70 text-[8px] uppercase tracking-wider block">24h Volumics</span>
                  <span className="text-white font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).volume24h}
                  </span>
                </div>
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg">
                  <span className="text-white/70 text-[8px] uppercase tracking-wider block">Est. Market Cap</span>
                  <span className="text-white font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).marketCap}
                  </span>
                </div>
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg">
                  <span className="text-white/70 text-[8px] uppercase tracking-wider block">Annualized Vol</span>
                  <span className="text-indigo-400 font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).volatility}
                  </span>
                </div>
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg">
                  <span className="text-white/70 text-[8px] uppercase tracking-wider block">Systemic Beta</span>
                  <span className="text-emerald-400 font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).beta}
                  </span>
                </div>
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg col-span-2">
                  <span className="text-white/70 text-[8px] uppercase tracking-wider block">Sharpe Ratio / Quality Grade</span>
                  <span className="text-white font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).sharpe} (Institutional AA+)
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Close CTA */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setSelectedHistoryAsset(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shadow-md select-none focus:outline-none focus-visible:outline-none"
              >
                Close Analytical Review
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────── STOCK PICKER MODAL ──────────────────── */}
      <StockPickerModal
        isOpen={isStockPickerOpen}
        onClose={() => setIsStockPickerOpen(false)}
        availableCash={cashBalance}
        currentHoldings={holdings.reduce((acc, h) => { acc[h.symbol] = h.qty; return acc; }, {} as Record<string, number>)}
        onAddStock={handleAddStockFromPicker}
      />

    </div>
  );
}
