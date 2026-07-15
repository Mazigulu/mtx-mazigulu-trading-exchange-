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
  X
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface Holding {
  symbol: string;
  name: string;
  isin: string;
  qty: number;
  avgCost: number;
  currentPrice: number;
}

const TICKER_META: Record<string, { name: string; isin: string; defaultPrice: number; type: 'stock' | 'etf' | 'crypto'; sector?: string }> = {
  'AAPL': { name: 'Apple Inc.', isin: 'US0378331005', defaultPrice: 182.30, type: 'stock', sector: 'technology' },
  'MSFT': { name: 'Microsoft Corp.', isin: 'US5949181045', defaultPrice: 421.90, type: 'stock', sector: 'technology' },
  'NVDA': { name: 'NVIDIA Corp.', isin: 'US67066G1040', defaultPrice: 125.40, type: 'stock', sector: 'technology' },
  'TSLA': { name: 'Tesla Inc.', isin: 'US88160R1014', defaultPrice: 178.60, type: 'stock', sector: 'large-cap' },
  'SPY': { name: 'SPDR S&P 500 ETF Trust', isin: 'US78462F1030', defaultPrice: 510.00, type: 'etf', sector: 'large-cap' },
  'QQQ': { name: 'Invesco QQQ Trust', isin: 'US46090E1038', defaultPrice: 440.00, type: 'etf', sector: 'technology' },
  'BTC-USD': { name: 'Bitcoin (BTC)', isin: 'US09061G1013', defaultPrice: 67250.00, type: 'crypto', sector: 'crypto' },
  'ETH-USD': { name: 'Ethereum (ETH)', isin: 'US29760G1035', defaultPrice: 3450.00, type: 'crypto', sector: 'crypto' },
  'SOL-USD': { name: 'Solana (SOL)', isin: 'US83410G1025', defaultPrice: 145.00, type: 'crypto', sector: 'crypto' }
};

const DAILY_RETURNS: Record<string, number> = {
  'AAPL': 2.10,
  'MSFT': 1.80,
  'NVDA': 3.40,
  'TSLA': -1.20,
  'SPY': 0.85,
  'QQQ': 1.55,
  'BTC-USD': -0.80,
  'ETH-USD': 1.50,
  'SOL-USD': 4.20
};

const TOTAL_RETURNS: Record<string, number> = {
  'AAPL': 18.00,
  'MSFT': 9.00,
  'NVDA': 45.50,
  'TSLA': -4.80,
  'SPY': 12.30,
  'QQQ': 15.10,
  'BTC-USD': 62.40,
  'ETH-USD': 28.90,
  'SOL-USD': 85.00
};

interface PortfolioDeskProps {
  traderEmail: string;
}

export default function PortfolioDesk({ traderEmail }: PortfolioDeskProps) {
  // Account cash balance state
  const [cashBalance, setCashBalance] = useState<number>(() => {
    const saved = localStorage.getItem('broker_cash');
    return saved ? parseFloat(saved) : 58000.00;
  });
  
  // Custom interactive holdings list connected to the Market Desk root (broker_holdings)
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    let holdingsMap: Record<string, number> = {
      'AAPL': 50,
      'MSFT': 30,
      'NVDA': 100,
      'BTC-USD': 0.15,
      'SPY': 25,
      'QQQ': 20
    };
    try {
      const saved = localStorage.getItem('broker_holdings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          holdingsMap = parsed;
        }
      }
    } catch (e) {
      console.error('Error loading holdings from localStorage:', e);
    }
    
    return Object.entries(holdingsMap).map(([symbol, qty]) => {
      const meta = TICKER_META[symbol] || { 
        name: `${symbol} Security`, 
        isin: 'US' + Math.random().toString(36).substring(2, 12).toUpperCase(), 
        defaultPrice: 150.00,
        type: 'stock'
      };
      return {
        symbol,
        name: meta.name,
        isin: meta.isin,
        qty,
        avgCost: meta.defaultPrice / (1 + (TOTAL_RETURNS[symbol] || 10) / 100),
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

  // Wealth Projection Calculator states
  const [wealthInitialInvestment, setWealthInitialInvestment] = useState<number>(10000);
  const [wealthMonthlyContribution, setWealthMonthlyContribution] = useState<number>(500);
  const [wealthYears, setWealthYears] = useState<number>(10);
  const [wealthApy, setWealthApy] = useState<number>(() => {
    const saved = localStorage.getItem('wealth_selected_apy');
    return saved ? parseFloat(saved) : 5.12;
  });

  // Helper to sync updated client cash balance with server ledger
  const syncCashWithServer = async (newBalance: number) => {
    try {
      const res = await fetch('/api/funding/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientBalance: newBalance })
      });
      if (!res.ok) {
        console.error('Failed to sync cash balance with server ledger');
      }
    } catch (e) {
      console.error('Error syncing cash balance:', e);
    }
  };

  // Sync state changes to local storage to maintain absolute unity with Market Desk root
  useEffect(() => {
    localStorage.setItem('broker_cash', cashBalance.toString());
  }, [cashBalance]);

  useEffect(() => {
    const holdingsMap: Record<string, number> = {};
    holdings.forEach(item => {
      holdingsMap[item.symbol] = item.qty;
    });
    localStorage.setItem('broker_holdings', JSON.stringify(holdingsMap));
  }, [holdings]);

  // Sync cash state from SQL database funding ledger on mount and poll
  useEffect(() => {
    let active = true;
    const fetchServerState = async () => {
      try {
        const res = await fetch('/api/funding/state');
        if (res.ok && active) {
          const data = await res.json();
          if (data && data.balance !== undefined) {
            setCashBalance(data.balance);
            localStorage.setItem('broker_cash', data.balance.toString());
          }
        }
      } catch (e) {
        console.error('Failed to fetch funding state on load:', e);
      }
    };
    fetchServerState();
    
    // Poll every 4 seconds to grab real-time settled ledger updates (e.g., from closed terminal CFD trades)
    const interval = setInterval(fetchServerState, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

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

        // Fetch ETF and Crypto tickers in parallel for live prices and day change percentages
        const remainingTickers = ['SPY', 'QQQ', 'BTC-USD', 'ETH-USD', 'SOL-USD'];
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
        console.error('Error fetching live market data in PortfolioDesk:', err);
      }
    };

    fetchLiveMarketData();
    const interval = setInterval(fetchLiveMarketData, 10000); // refresh every 10s
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Sync state with local storage updates & periodic checks
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCash = localStorage.getItem('broker_cash');
      if (savedCash) {
        setCashBalance(parseFloat(savedCash));
      }
      const savedHoldings = localStorage.getItem('broker_holdings');
      if (savedHoldings) {
        try {
          const parsed = JSON.parse(savedHoldings);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const holdingsMap: Record<string, number> = parsed;
            setHoldings(prevHoldings => {
              return prevHoldings.map(item => {
                const qty = holdingsMap[item.symbol] !== undefined ? holdingsMap[item.symbol] : item.qty;
                return {
                  ...item,
                  qty
                };
              });
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
      const savedApy = localStorage.getItem('wealth_selected_apy');
      if (savedApy) {
        setWealthApy(parseFloat(savedApy));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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

  // Let's compute dynamic returns based on current holdings weights!
  const todayReturnAmount = holdingsWithLivePrices.reduce((sum, item) => {
    const retPercent = liveReturns[item.symbol] !== undefined ? liveReturns[item.symbol] : (DAILY_RETURNS[item.symbol] || 0);
    return sum + (item.qty * item.currentPrice * (retPercent / 100));
  }, 0);
  
  const todayReturnPercent = assetValue > 0 ? (todayReturnAmount / totalValue) * 100 : 0;

  // Lifetime return calculations
  const netContributions = 85000.00;
  const lifetimeReturnAmount = totalValue - netContributions;
  const lifetimeReturnPercent = (lifetimeReturnAmount / netContributions) * 100;

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
    { name: 'Cash', value: weights.cash, color: '#ec4899' }
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
      case 'ALL':
        return [
          { name: '2023', value: baseValue * 0.45 },
          { name: '2024', value: baseValue * 0.65 },
          { name: '2025', value: baseValue * 0.82 },
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
  const executeTrade = () => {
    if (!tradeModal.holding) return;
    const qty = parseFloat(tradeQuantity);
    if (isNaN(qty) || qty <= 0) {
      setTradeStatusMsg('ERROR: Enter a valid positive quantity.');
      return;
    }

    const price = tradeModal.holding.currentPrice;
    const cost = qty * price;

    if (tradeModal.type === 'BUY') {
      if (cost > cashBalance) {
        setTradeStatusMsg('ERROR: Insufficient buying power cash available.');
        return;
      }
      // Update cash
      const newCash = cashBalance - cost;
      setCashBalance(newCash);
      localStorage.setItem('broker_cash', newCash.toString());
      syncCashWithServer(newCash);

      // Update holdings
      const updatedHoldings = holdings.map(item => {
        if (item.symbol === tradeModal.holding?.symbol) {
          return { ...item, qty: item.qty + qty };
        }
        return item;
      });
      setHoldings(updatedHoldings);
      setTradeStatusMsg('SUCCESS: Purchase executed successfully.');
    } else {
      if (qty > tradeModal.holding.qty) {
        setTradeStatusMsg('ERROR: Exceeds current available position quantity.');
        return;
      }
      // Update cash
      const newCash = cashBalance + cost;
      setCashBalance(newCash);
      localStorage.setItem('broker_cash', newCash.toString());
      syncCashWithServer(newCash);

      // Update holdings
      const updatedHoldings = holdings.map(item => {
        if (item.symbol === tradeModal.holding?.symbol) {
          return { ...item, qty: item.qty - qty };
        }
        return item;
      }).filter(item => item.qty > 0);
      setHoldings(updatedHoldings);
      setTradeStatusMsg('SUCCESS: Sale executed successfully.');
    }

    setTimeout(() => {
      setTradeModal({ isOpen: false, holding: null, type: 'BUY' });
    }, 1200);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Portfolio Value */}
        <div id="portfolio-val-card" className="bg-[#09090c] border border-white/5 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-indigo-500/5 blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-black">Portfolio Value</span>
            <div className="p-1 text-indigo-400">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black font-mono tracking-tight text-white">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-emerald-400 font-bold text-[10px] font-mono">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span>+${todayReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Today</span>
              <span className="text-emerald-500/80">({todayReturnPercent >= 0 ? '+' : ''}{todayReturnPercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Invested Assets */}
        <div id="portfolio-invested-card" className="bg-[#09090c] border border-white/5 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-emerald-500/5 blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-black">Invested Assets</span>
            <div className="p-1 text-emerald-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black font-mono tracking-tight text-white">
              ${assetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-white/40 font-mono block mt-1">
              {((assetValue / totalValue) * 100).toFixed(0)}% of Portfolio
            </span>
          </div>
        </div>

        {/* Card 3: Available Cash */}
        <div id="portfolio-cash-card" className="bg-[#09090c] border border-white/5 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-amber-500/5 blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-black">Available Cash</span>
            <div className="p-1 text-amber-400">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black font-mono tracking-tight text-white">
              ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-white/40 font-mono block mt-1">
              {((cashBalance / totalValue) * 100).toFixed(0)}% Cash Allocation
            </span>
          </div>
        </div>

        {/* Card 4: Lifetime Return */}
        <div id="portfolio-lifetime-card" className="bg-[#09090c] border border-white/5 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-purple-500/5 blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-black">Lifetime Return</span>
            <div className={`p-1 ${lifetimeReturnAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {lifetimeReturnAmount >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-black font-mono tracking-tight ${lifetimeReturnAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {lifetimeReturnAmount >= 0 ? '+' : ''}${lifetimeReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-white/40 font-mono block mt-1">
              {lifetimeReturnPercent >= 0 ? '+' : ''}{lifetimeReturnPercent.toFixed(2)}% Since Inception
            </span>
          </div>
        </div>

      </div>

      {/* ──────────────────── MAIN PERFORMANCE SECTION & RIGHT SIDEBAR ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Performance Chart & Compounding Wealth Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Performance Chart Card */}
          <div className="bg-[#09090c] border border-white/5 rounded-xl p-5 flex flex-col space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Portfolio Performance Chart</h4>
            </div>
            
            {/* Timeframes Selector */}
            <div className="flex bg-black border border-white/10 rounded p-0.5 self-start sm:self-auto">
              {['1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 text-[9px] font-mono font-black rounded transition-all cursor-pointer ${timeframe === tf ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          {/* Main Visual Anchor Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getPerformanceData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#ffffff" opacity={0.1} fontSize={9} fontFamily="monospace" tickLine={false} />
                <YAxis stroke="#ffffff" opacity={0.1} fontSize={9} fontFamily="monospace" tickLine={false} tickFormatter={(v) => `$${Math.round(v/1000)}k`} domain={['dataMin - 5000', 'dataMax + 5000']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={1.5} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Under-chart metrics overview */}
          <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
            <div className="font-mono">
              <span className="text-[9px] text-white/30 uppercase tracking-wider block">Today's Return</span>
              <span className="text-xs font-black text-emerald-400 mt-0.5 block">
                +${todayReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({todayReturnPercent.toFixed(2)}%)
              </span>
            </div>
            <div className="font-mono border-l border-white/5 pl-4">
              <span className="text-[9px] text-white/30 uppercase tracking-wider block">Total Return</span>
              <span className={`text-xs font-black mt-0.5 block ${lifetimeReturnAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {lifetimeReturnAmount >= 0 ? '+' : ''}${lifetimeReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({lifetimeReturnPercent.toFixed(2)}%)
              </span>
            </div>
            <div className="font-mono border-l border-white/5 pl-4">
              <span className="text-[9px] text-white/30 uppercase tracking-wider block">Net Contributions</span>
              <span className="text-xs font-black text-white/85 mt-0.5 block">
                ${netContributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: COMPOUNDING WEALTH PROJECTION */}
        <div id="portfolio-wealth-projection" className="bg-[#09090c] border border-white/5 rounded-xl p-5 space-y-5">
          <div className="pb-3 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Compounding Wealth Projection</h4>
              <p className="text-[9.5px] text-white/30 font-mono uppercase tracking-wider mt-0.5">Asset Allocation model using selected APY ({wealthApy.toFixed(2)}%)</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9.5px] font-bold tracking-tight uppercase">
              Accumulation Engine
            </span>
          </div>

          {/* Controller Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between text-white/50 text-[10px]">
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
              <div className="flex justify-between text-white/50 text-[10px]">
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
              <div className="flex justify-between text-white/50 text-[10px]">
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
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#ffffff" opacity={0.15} fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#ffffff" opacity={0.15} fontSize={10} fontFamily="monospace" tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'monospace' }}
                  itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="Principal Invested" stroke="#6366f1" strokeWidth={1} fillOpacity={1} fill="url(#portPrincipalGrad)" />
                <Area type="monotone" dataKey="Compounded Wealth" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#portWealthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Calculation Readout Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/[0.02] border border-white/5 p-4 rounded-xl text-center font-mono text-xs">
            <div>
              <span className="text-[9px] text-white/30 uppercase tracking-wider block">Total Sourced Principal</span>
              <span className="text-base font-bold text-white block mt-1">${wealthFinalPrincipal.toLocaleString()}</span>
            </div>
            <div className="border-t sm:border-t-0 sm:border-x border-white/5 py-3 sm:py-0">
              <span className="text-[9px] text-white/30 uppercase tracking-wider block">Est. Interest Compounded</span>
              <span className="text-base font-bold text-emerald-400 block mt-1">+${wealthAccruedProfit.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[9px] text-white/30 uppercase tracking-wider block">Projected Total Wealth</span>
              <span className="text-base font-black text-indigo-400 block mt-1">${wealthFinalBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          
          {/* Card 1: Asset Allocation */}
          <div className="bg-[#09090c] border border-white/5 rounded-xl p-5 flex flex-col relative">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-black mb-3">Asset Allocation</span>
            
            <div className="h-44 flex items-center justify-center relative my-1">
              <ResponsiveContainer width="100%" height="100%" key={`pie-container-${allocationPieData.length}-${Math.round(totalValue)}`}>
                <PieChart>
                  <Pie
                    data={allocationPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {allocationPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#09090c" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      const amount = (Number(value) / 100) * totalValue;
                      return [`$${Math.round(amount).toLocaleString()} (${Number(value).toFixed(1)}%)`, name];
                    }}
                    contentStyle={{ backgroundColor: '#09090c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px' }}
                    itemStyle={{ color: '#fff', fontSize: '10px', fontFamily: 'monospace' }}
                    labelStyle={{ display: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[8px] text-white/30 uppercase tracking-wider font-mono">Portfolio</span>
                <span className="text-[12px] font-black text-white font-mono mt-0.5">
                  ${Math.round(totalValue).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {['Stocks', 'ETFs', 'Crypto', 'Cash'].map((cat, idx) => {
                const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];
                const values = [weights.stocks, weights.etfs, weights.crypto, weights.cash];
                return (
                  <div key={cat} className="flex items-center justify-between p-1.5 bg-[#040405] border border-white/5 rounded font-mono text-[9px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[idx] }} />
                      <span className="text-white/50">{cat}</span>
                    </div>
                    <span className="text-white font-bold">{Math.round(values[idx])}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Portfolio Insights */}
          <div className="bg-[#09090c] border border-white/5 rounded-xl p-5 font-mono text-[10px] space-y-3.5">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-black block">Portfolio Insights</span>
            
            <div className="space-y-2 bg-[#040405] p-3 rounded-lg border border-white/5">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-white/40">Largest Position</span>
                <span className="text-white font-black">{largestPosition}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-white/40">Best Performer</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  {bestPerformer} <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-white/40">Worst Performer</span>
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  {worstPerformer} <ArrowDownRight className="w-3 h-3 text-rose-400" />
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-white/40">Cash Position</span>
                <span className="text-amber-400 font-bold">{weights.cash.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Exposure Breakdown */}
          <div className="bg-[#09090c] border border-white/5 rounded-xl p-5 font-mono text-[10px] space-y-3.5">
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest font-black block">Exposure Breakdown</span>
            
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-white/50">Technology sector</span>
                  <span className="text-white/80 font-bold">{techPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#040405] h-1 rounded overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${techPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-white/50">Large Cap assets</span>
                  <span className="text-white/80 font-bold">{largeCapPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#040405] h-1 rounded overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${largeCapPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-white/50">Dividend Assets</span>
                  <span className="text-white/80 font-bold">{dividendPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#040405] h-1 rounded overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${dividendPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-white/50">Cash Position</span>
                  <span className="text-white/80 font-bold">{weights.cash.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#040405] h-1 rounded overflow-hidden">
                  <div className="bg-pink-500 h-full" style={{ width: `${weights.cash}%` }} />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ──────────────────── PORTFOLIO METRICS SECTION ──────────────────── */}
      <div className="bg-[#09090c] border border-white/5 rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 font-mono text-[10px]">
          <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg flex flex-col justify-between">
            <span className="text-white/30 uppercase tracking-wider text-[8px]">Day P/L</span>
            <span className="text-xs font-black text-emerald-400 mt-1">
              +${todayReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg flex flex-col justify-between">
            <span className="text-white/30 uppercase tracking-wider text-[8px]">Total P/L</span>
            <span className={`text-xs font-black mt-1 ${lifetimeReturnAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {lifetimeReturnAmount >= 0 ? '+' : ''}${lifetimeReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-white/30 uppercase tracking-wider text-[8px]">Annualized Return</span>
            <span className="text-xs font-black text-indigo-400 mt-1">
              +13.4%
            </span>
          </div>

          <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg flex flex-col justify-between">
            <span className="text-white/30 uppercase tracking-wider text-[8px]">Net Contributions</span>
            <span className="text-xs font-black text-white/80 mt-1">
              ${netContributions.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg flex flex-col justify-between">
            <span className="text-white/30 uppercase tracking-wider text-[8px]">Buying Power</span>
            <span className="text-xs font-black text-amber-400 mt-1">
              ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────────── HOLDINGS TABLE ──────────────────── */}
      <div className="bg-[#09090c] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Institutional Portfolio Holdings</h4>
          </div>
          <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-mono text-indigo-300 rounded font-black tracking-widest uppercase">
            ACTIVE REAL-TIME SETTLEMENT
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#040405] font-mono text-[9px] text-white/40 uppercase tracking-wider">
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
                const weightPct = (mktVal / totalValue) * 100;
                const retToday = liveReturns[item.symbol] !== undefined ? liveReturns[item.symbol] : (DAILY_RETURNS[item.symbol] || 0.00);
                const retTotal = TOTAL_RETURNS[item.symbol] || 0.00;

                return (
                  <tr 
                    key={item.symbol} 
                    onClick={() => setSelectedHistoryAsset(item)}
                    className="hover:bg-white/[0.03] active:bg-white/[0.05] transition-all group cursor-pointer"
                    title="Click row to view detailed historical performance"
                  >
                    <td className="py-3.5 px-5 font-black text-white">{item.symbol}</td>
                    <td className="py-3.5 px-5 text-white/50">{item.name}</td>
                    <td className="py-3.5 px-5 text-right font-bold text-white/95">
                      {item.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>
                    <td className="py-3.5 px-5 text-right text-white/60">
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
                    <td className="py-3.5 px-5 text-right text-white/40">{weightPct.toFixed(1)}%</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => { e.stopPropagation(); openTrade(item, 'BUY'); }}
                          className="px-1.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded text-[9px] text-emerald-400 hover:text-emerald-300 transition-all font-black cursor-pointer"
                          title="Instant Buy Order"
                        >
                          BUY
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openTrade(item, 'SELL'); }}
                          className="px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded text-[9px] text-rose-400 hover:text-rose-300 transition-all font-black cursor-pointer"
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

        {/* Optional Section: Dividend summary indicators */}
        <div className="p-4 bg-gradient-to-r from-[#040405] to-transparent border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-3">
            <Info className="w-3.5 h-3.5 text-white/30" />
            <span className="text-white/40">Portfolio Dividend Estimate:</span>
            <span className="text-white font-bold">$612.00 Annual</span>
            <span className="text-white/20">|</span>
            <span className="text-white/40">Weighted Yield:</span>
            <span className="text-emerald-400 font-bold">1.8%</span>
          </div>
          <span className="text-white/20 font-light text-[9px]">MTX Portfolio Analyst v3.0</span>
        </div>
      </div>

      {/* ──────────────────── INTERACTIVE ORDER TRADE FORM DIALOG ──────────────────── */}
      {tradeModal.isOpen && tradeModal.holding && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#09090c] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4 font-mono animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${tradeModal.type === 'BUY' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}>
                  {tradeModal.type} ORDER
                </span>
                <span className="text-xs font-bold text-white">{tradeModal.holding.symbol}</span>
              </div>
              <button 
                onClick={() => setTradeModal({ isOpen: false, holding: null, type: 'BUY' })}
                className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price Readout */}
            <div className="bg-[#040405] p-3 rounded border border-white/5 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-white/40">Instrument:</span>
                <span className="text-white font-bold">{tradeModal.holding.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Settlement Price:</span>
                <span className="text-indigo-300 font-bold">${tradeModal.holding.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Current Position:</span>
                <span className="text-white font-bold">{tradeModal.holding.qty} shares</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1.5 text-amber-400">
                <span>Available Cash:</span>
                <span className="font-bold">${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-2">
              <label className="text-[9px] text-white/40 uppercase tracking-wider block">Quantity to execute</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-[#040405] border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:outline-none rounded px-3 py-2 text-white font-bold text-sm text-center"
                />
                
                {/* Max Quick Selector */}
                <button
                  onClick={() => {
                    if (tradeModal.type === 'BUY') {
                      const maxBuy = cashBalance / (tradeModal.holding?.currentPrice || 1);
                      setTradeQuantity(maxBuy.toFixed(4));
                    } else {
                      setTradeQuantity((tradeModal.holding?.qty || 0).toString());
                    }
                  }}
                  className="px-3 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 rounded text-[10px] text-indigo-300 hover:text-white transition-all font-black"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Total Transaction Calculation */}
            {parseFloat(tradeQuantity) > 0 && (
              <div className="p-2 bg-indigo-500/5 rounded border border-indigo-500/10 text-[10px] flex justify-between items-center text-indigo-300">
                <span>Estimated Value:</span>
                <span className="font-black text-xs">
                  ${(parseFloat(tradeQuantity) * (tradeModal.holding?.currentPrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
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
              className={`w-full py-2.5 rounded font-black tracking-widest text-xs transition-all uppercase ${tradeModal.type === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/10'}`}
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
                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-[9px] font-black tracking-widest text-indigo-400">
                    HISTORICAL METRICS
                  </span>
                  <span className="text-xs font-bold text-white">{selectedHistoryAsset.symbol}</span>
                  <span className="text-[10px] text-white/30 font-normal">| {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).isin}</span>
                </div>
                <h3 className="text-base font-black text-white mt-1.5">{selectedHistoryAsset.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedHistoryAsset(null)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price Performance Metrics Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#040405] p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-[8px] text-white/40 uppercase tracking-wider block">Current Price</span>
                <span className="text-base font-black text-white block mt-1">
                  ${selectedHistoryAsset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[8px] text-white/40 uppercase tracking-wider block">Your Position</span>
                <span className="text-base font-bold text-indigo-300 block mt-1">
                  {selectedHistoryAsset.qty.toLocaleString()} shares
                </span>
              </div>
              <div>
                <span className="text-[8px] text-white/40 uppercase tracking-wider block">Total Value</span>
                <span className="text-base font-black text-white block mt-1">
                  ${(selectedHistoryAsset.qty * selectedHistoryAsset.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[8px] text-white/40 uppercase tracking-wider block">Overall Return</span>
                <span className={`text-base font-black mt-1 block ${(TOTAL_RETURNS[selectedHistoryAsset.symbol] || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(TOTAL_RETURNS[selectedHistoryAsset.symbol] || 0) >= 0 ? '+' : ''}{(TOTAL_RETURNS[selectedHistoryAsset.symbol] || 0).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Performance Chart Title */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold block">12-Month Historical Price Trend</span>
              <span className="text-[9px] text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-500/10 font-bold">
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
                  <XAxis dataKey="date" stroke="#ffffff" opacity={0.15} fontSize={9} fontFamily="monospace" tickLine={false} />
                  <YAxis stroke="#ffffff" opacity={0.15} fontSize={9} fontFamily="monospace" tickLine={false} tickFormatter={(v) => `$${v}`} domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'monospace' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                    formatter={(value: any) => [`$${value}`, 'Price']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#historyColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Asset Statistics Bento Grid */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold block">Key Quantitative Indicators</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg">
                  <span className="text-white/30 text-[8px] uppercase tracking-wider block">52-Week High</span>
                  <span className="text-white font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).high52}
                  </span>
                </div>
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg">
                  <span className="text-white/30 text-[8px] uppercase tracking-wider block">52-Week Low</span>
                  <span className="text-white font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).low52}
                  </span>
                </div>
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg">
                  <span className="text-white/30 text-[8px] uppercase tracking-wider block">24h Volumics</span>
                  <span className="text-white font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).volume24h}
                  </span>
                </div>
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg">
                  <span className="text-white/30 text-[8px] uppercase tracking-wider block">Est. Market Cap</span>
                  <span className="text-white font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).marketCap}
                  </span>
                </div>
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg">
                  <span className="text-white/30 text-[8px] uppercase tracking-wider block">Annualized Vol</span>
                  <span className="text-indigo-400 font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).volatility}
                  </span>
                </div>
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg">
                  <span className="text-white/30 text-[8px] uppercase tracking-wider block">Systemic Beta</span>
                  <span className="text-emerald-400 font-bold mt-1 block">
                    {getAssetStats(selectedHistoryAsset.symbol, selectedHistoryAsset.currentPrice).beta}
                  </span>
                </div>
                <div className="p-2.5 bg-[#040405] border border-white/5 rounded-lg col-span-2">
                  <span className="text-white/30 text-[8px] uppercase tracking-wider block">Sharpe Ratio / Quality Grade</span>
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
                className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 rounded-lg text-xs font-bold text-indigo-300 hover:text-white transition-all cursor-pointer"
              >
                Close Analytical Review
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
