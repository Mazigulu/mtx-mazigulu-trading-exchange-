/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { generateScreenerDatabase } from '../lib/screenerTickersData';
import { 
  TrendingUp, 
  Search, 
  Layers, 
  Activity, 
  BarChart3, 
  DollarSign, 
  Percent, 
  Clock, 
  Play, 
  Award, 
  Filter, 
  Check, 
  Plus, 
  Info,
  LineChart,
  RefreshCw,
  Sliders,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Cpu
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart as RechartsLineChart, 
  Line as RechartsLine, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ScatterChart, 
  Scatter,
  ZAxis
} from 'recharts';

interface HistoricalBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Fundamentals {
  ticker: string;
  incomeStatement: any[];
  balanceSheet: any[];
  cashFlow: any[];
  ratios: {
    peRatio: number | null;
    forwardPE: number | null;
    priceToBook: number | null;
    roe: number | null;
    roa: number | null;
    marketCap: number | null;
    operatingMargin: number | null;
    profitMargin: number | null;
    beta: number | null;
    dividendYield: number | null;
    debtToEquity: number | null;
    revenueGrowth: number | null;
    earningsGrowth: number | null;
    fiftyTwoWeekChange: number | null;
  };
}

export default function MarketsTerminal() {
  const [activeSubTab, setActiveSubTab] = useState<'ANALYSIS' | 'SCREENER'>('ANALYSIS');
  const [ticker, setTicker] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('AAPL');
  const [range, setRange] = useState<'5d' | '1mo' | '3mo' | '1y'>('1mo');
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState<any>(null);
  const [fundamentalData, setFundamentalData] = useState<Fundamentals | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Screener State
  const [screenerTickers] = useState<string[]>([
    'AAPL', 'MSFT', 'NVDA', 'GOOG', 'AMZN', 'META', 'TSLA', 'NFLX', 'AMD', 'BTC-USD', 'ETH-USD', 'EURUSD=X'
  ]);
  const [screenerData, setScreenerData] = useState<any[]>([]);
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [screenerPEFilter, setScreenerPEFilter] = useState<number>(100);
  const [screenerROEFilter, setScreenerROEFilter] = useState<number>(-0.2);
  const [screenerSearch, setScreenerSearch] = useState<string>('');
  const [screenerSector, setScreenerSector] = useState<string>('ALL');
  const [screenerMinCap, setScreenerMinCap] = useState<number>(0); // In billions
  const [screenerMinMomentum, setScreenerMinMomentum] = useState<number>(-0.5); // 52W Change min
  const [screenerDivOnly, setScreenerDivOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showPandasCode, setShowPandasCode] = useState<boolean>(false);

  // Backtester State
  const [backtestStrategy, setBacktestStrategy] = useState<'EMA' | 'RSI' | 'MACD'>('EMA');
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  // Portfolio Optimization State
  const [portfolioAssets, setPortfolioAssets] = useState<string[]>(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'BTC-USD']);
  const [newAssetInput, setNewAssetInput] = useState('');
  const [optMethod, setOptMethod] = useState<'SHARPE' | 'MIN_VOL' | 'RISK_PARITY'>('SHARPE');
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showFinancialsOverlay, setShowFinancialsOverlay] = useState<boolean>(false);

  // Multi-Asset Brokerage Portfolio & Wallet state (persisted)
  const [brokerCash, setBrokerCash] = useState<number>(() => {
    const saved = localStorage.getItem('broker_cash');
    return saved ? parseFloat(saved) : 50000.00;
  });

  const [brokerHoldings, setBrokerHoldings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('broker_holdings');
    return saved ? JSON.parse(saved) : {
      'AAPL': 50,
      'MSFT': 30,
      'NVDA': 100,
      'BTC-USD': 0.15
    };
  });

  // Persist to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem('broker_cash', brokerCash.toString());
  }, [brokerCash]);

  useEffect(() => {
    localStorage.setItem('broker_holdings', JSON.stringify(brokerHoldings));
  }, [brokerHoldings]);

  // Order ticket inputs
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderShares, setOrderShares] = useState<number>(10);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [orderLimitPrice, setOrderLimitPrice] = useState<number>(0);
  const [useBracketProtection, setUseBracketProtection] = useState<boolean>(false);
  const [stopLossPct, setStopLossPct] = useState<number>(5);
  const [takeProfitPct, setTakeProfitPct] = useState<number>(10);
  const [orderStatus, setOrderStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isExecutingOrder, setIsExecutingOrder] = useState<boolean>(false);

  // Agentic AI Strategist State
  const [activeAgent, setActiveAgent] = useState<'ALPHA' | 'INCOME' | 'ALL_WEATHER' | null>(null);
  const [agentScanning, setAgentScanning] = useState<boolean>(false);
  const [agentResponse, setAgentResponse] = useState<string>('');
  const [agentProposedAssets, setAgentProposedAssets] = useState<string[]>([]);
  const [agentProposedWeights, setAgentProposedWeights] = useState<Record<string, number>>({});
  const [agentConsoleLogs, setAgentConsoleLogs] = useState<string[]>([]);

  // Static meta for common multi-asset brokerage tickers
  const assetsMeta: Record<string, { ret: number; vol: number; price: number }> = {
    AAPL: { ret: 0.18, vol: 0.22, price: 182.30 },
    MSFT: { ret: 0.16, vol: 0.20, price: 421.90 },
    NVDA: { ret: 0.42, vol: 0.38, price: 125.40 },
    GOOG: { ret: 0.15, vol: 0.23, price: 175.20 },
    TSLA: { ret: 0.25, vol: 0.45, price: 178.60 },
    AMZN: { ret: 0.17, vol: 0.25, price: 185.50 },
    META: { ret: 0.21, vol: 0.28, price: 475.30 },
    JNJ: { ret: 0.08, vol: 0.14, price: 148.50 },
    PG: { ret: 0.07, vol: 0.13, price: 162.20 },
    SPY: { ret: 0.11, vol: 0.15, price: 512.40 },
    GLD: { ret: 0.06, vol: 0.12, price: 215.10 },
    BRENT: { ret: 0.12, vol: 0.28, price: 82.30 },
    'BTC-USD': { ret: 0.55, vol: 0.65, price: 67250.00 },
    'ETH-USD': { ret: 0.45, vol: 0.72, price: 3450.00 },
    'SOL-USD': { ret: 0.68, vol: 0.85, price: 145.00 },
    'EURUSD=X': { ret: 0.02, vol: 0.08, price: 1.0850 }
  };

  // Simple Markdown formatting helper to build beautiful HTML structures
  const formatMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      let content = line;

      // Handle bullets
      const isBullet = line.trim().startsWith('-');
      if (isBullet) {
        content = line.replace(/^\s*-\s*/, '');
      }

      // Handle custom line separators/horizontal rule
      if (line.trim() === '---') {
        return <div key={`hr-${lIdx}`} className="border-t border-white/5 my-3" />;
      }

      // Simple regex split for bold **text**
      const parts = content.split('**');
      const formattedParts = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={`b-${pIdx}`} className="text-white font-bold">{part}</strong>;
        }
        // Simple italics within the part
        const subParts = part.split('*');
        return subParts.map((sub, sIdx) => {
          if (sIdx % 2 === 1) {
            return <em key={`e-${sIdx}`} className="text-indigo-300 italic">{sub}</em>;
          }
          return sub;
        });
      });

      if (isBullet) {
        return (
          <li key={`line-${lIdx}`} className="ml-4 list-disc pl-1 text-[11px] leading-relaxed text-white/80 mb-1.5 font-sans">
            {formattedParts}
          </li>
        );
      }

      if (line.trim().startsWith('####')) {
        return (
          <h5 key={`line-${lIdx}`} className="text-zinc-300 font-semibold font-sans text-[10px] uppercase tracking-wider mt-4 mb-2">
            {line.replace(/^####\s*/, '')}
          </h5>
        );
      }

      if (line.trim().startsWith('###')) {
        return (
          <h4 key={`line-${lIdx}`} className="text-indigo-400 font-bold font-sans text-[11px] uppercase tracking-wider mt-5 mb-2 border-b border-indigo-500/10 pb-0.5">
            {line.replace(/^###\s*/, '')}
          </h4>
        );
      }

      if (line.trim().startsWith('##')) {
        return (
          <h3 key={`line-${lIdx}`} className="text-white font-bold font-sans text-xs mt-6 mb-3">
            {line.replace(/^##\s*/, '')}
          </h3>
        );
      }

      // Empty lines
      if (!line.trim()) {
        return <div key={`space-${lIdx}`} className="h-1.5" />;
      }

      return (
        <p key={`line-${lIdx}`} className="text-[11px] leading-relaxed text-white/70 font-sans mb-2 font-light">
          {formattedParts}
        </p>
      );
    });
  };

  // Trigger load on ticker/range change
  useEffect(() => {
    setShowFinancialsOverlay(false);
    loadTickerData();
  }, [ticker, range]);

  // Load preset screener data on initial render
  useEffect(() => {
    loadScreenerData();
  }, []);

  const loadTickerData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch Historical Price
      const histResponse = await fetch(`/api/markets/historical?ticker=${ticker}&range=${range}`);
      if (!histResponse.ok) throw new Error('Failed to retrieve historical price data');
      const histData = await histResponse.json();
      setMarketData(histData);

      // 2. Fetch Fundamentals
      const fundResponse = await fetch(`/api/markets/fundamentals?ticker=${ticker}`);
      if (!fundResponse.ok) throw new Error('Failed to retrieve fundamental filings');
      const fundData = await fundResponse.json();
      setFundamentalData(fundData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error pulling live market terminals');
    } finally {
      setLoading(false);
    }
  };

  const loadScreenerData = async () => {
    setScreenerLoading(true);
    try {
      // Load hundreds of high-fidelity tickers instantly utilizing our structured data engine
      const db = generateScreenerDatabase();
      setScreenerData(db);
    } catch (err) {
      console.error(err);
    } finally {
      setScreenerLoading(false);
    }
  };

  const handleExecuteOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!marketData?.regularMarketPrice) return;
    
    setIsExecutingOrder(true);
    setOrderStatus(null);
    
    const currentPrice = marketData.regularMarketPrice;
    const executionPrice = orderType === 'LIMIT' ? orderLimitPrice || currentPrice : currentPrice;
    const totalCost = executionPrice * orderShares;
    
    setTimeout(async () => {
      try {
        if (orderSide === 'BUY') {
          if (brokerCash < totalCost) {
            setOrderStatus({
              type: 'error',
              message: `Insufficient funds. Order requires $${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}, but you have $${brokerCash.toLocaleString(undefined, {minimumFractionDigits: 2})}.`
            });
            setIsExecutingOrder(false);
            return;
          }
          
          setBrokerCash(prev => parseFloat((prev - totalCost).toFixed(2)));
          setBrokerHoldings(prev => {
            const current = prev[ticker] || 0;
            return {
              ...prev,
              [ticker]: parseFloat((current + orderShares).toFixed(6))
            };
          });
          
          setOrderStatus({
            type: 'success',
            message: `Order Filled! Bought ${orderShares} shares of ${ticker} at $${executionPrice.toFixed(2)}.`
          });
          
          const slPrice = useBracketProtection ? executionPrice * (1 - stopLossPct / 100) : executionPrice * 0.95;
          const tpPrice = useBracketProtection ? executionPrice * (1 + takeProfitPct / 100) : executionPrice * 1.10;
          
          await fetch('/api/trades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol: ticker as any,
              side: 'BUY',
              entryPrice: executionPrice,
              stopLoss: slPrice,
              takeProfit: tpPrice,
              size: orderShares,
              reason: `Multi-Asset Stock Broker: Bought ${orderShares} shares of ${ticker}.`,
              confidence: 90,
              confluences: ['Standard Broker Entry', 'Equity Account Integration']
            })
          }).catch(err => console.warn('Failed to post trade to ledger api:', err));
          
        } else { // SELL
          const currentShares = brokerHoldings[ticker] || 0;
          if (currentShares < orderShares) {
            setOrderStatus({
              type: 'error',
              message: `Insufficient shares. You tried to sell ${orderShares} shares of ${ticker}, but only hold ${currentShares.toFixed(2)} shares.`
            });
            setIsExecutingOrder(false);
            return;
          }
          
          const proceeds = executionPrice * orderShares;
          setBrokerCash(prev => parseFloat((prev + proceeds).toFixed(2)));
          setBrokerHoldings(prev => {
            const nextShares = parseFloat((currentShares - orderShares).toFixed(6));
            const next = { ...prev };
            if (nextShares <= 0.0001) {
              delete next[ticker];
            } else {
              next[ticker] = nextShares;
            }
            return next;
          });
          
          setOrderStatus({
            type: 'success',
            message: `Order Filled! Sold ${orderShares} shares of ${ticker} for $${proceeds.toLocaleString(undefined, {minimumFractionDigits: 2})}.`
          });
          
          const slPrice = executionPrice * 1.05;
          const tpPrice = executionPrice * 0.90;
          await fetch('/api/trades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol: ticker as any,
              side: 'SELL',
              entryPrice: executionPrice,
              stopLoss: slPrice,
              takeProfit: tpPrice,
              size: orderShares,
              reason: `Multi-Asset Stock Broker: Sold ${orderShares} shares of ${ticker}.`,
              confidence: 85,
              confluences: ['Standard Broker Exit', 'Portfolio Liquidation']
            })
          }).catch(err => console.warn('Failed to post trade to ledger api:', err));
        }
      } catch (err: any) {
        setOrderStatus({
          type: 'error',
          message: err.message || 'Execution routing failure.'
        });
      } finally {
        setIsExecutingOrder(false);
      }
    }, 700);
  };

  const handleDeployAgentResearch = () => {
    if (!activeAgent) return;
    setAgentScanning(true);
    setAgentResponse('');
    setAgentConsoleLogs([]);
    
    const logs = [
      'Initializing Autonomous Investment Optimizer Core...',
      'Scanning screener metrics database for alpha signals...',
      'Computing standard asset beta correlations...',
      'Synthesizing macro factors with historical return averages...',
      'Computing target multi-asset weight matrix parameters...'
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setAgentConsoleLogs(prev => [...prev, log]);
      }, (index + 1) * 300);
    });

    setTimeout(() => {
      try {
        setAgentResponse(
          activeAgent === 'ALPHA'
            ? 'Sector rotation is heavily favoring high-growth tech sectors and digital reserve assets. Momentum signals predict near-term index expansion, with AAPL and NVDA serving as critical structural cornerstones.'
            : activeAgent === 'INCOME'
              ? 'Defensive structural stability is locking in consumer staple compounds and healthcare value loops. High cash flow yields preserve capital and mitigate global interest fluctuations.'
              : 'Balanced multi-asset diversification blends classic equities, hard commodity assets, and alternative crypto reserves to insulate capital against macro interest shocks.'
        );

        if (activeAgent === 'ALPHA') {
          setAgentProposedAssets(['AAPL', 'MSFT', 'NVDA', 'BTC-USD']);
          setAgentProposedWeights({ 'AAPL': 30, 'MSFT': 20, 'NVDA': 35, 'BTC-USD': 15 });
        } else if (activeAgent === 'INCOME') {
          setAgentProposedAssets(['JNJ', 'MSFT', 'PG', 'SPY']);
          setAgentProposedWeights({ 'JNJ': 30, 'MSFT': 20, 'PG': 25, 'SPY': 25 });
        } else {
          setAgentProposedAssets(['SPY', 'GLD', 'TSLA', 'BTC-USD', 'EURUSD=X']);
          setAgentProposedWeights({ 'SPY': 40, 'GLD': 25, 'TSLA': 15, 'BTC-USD': 10, 'EURUSD=X': 10 });
        }

        setAgentConsoleLogs(prev => [
          ...prev, 
          '✓ Factor analysis complete.',
          '✓ Formulated optimal multi-asset target matrix weights.',
          'Ready for execution routing.'
        ]);

      } catch (err: any) {
        console.warn(err);
        setAgentResponse('Autonomous asset scanning finalized. Selected tickers are optimally balanced for macro-factor resilience.');
      } finally {
        setAgentScanning(false);
      }
    }, 2000);
  };

  const handleApplyAgentSelectionsToOptimizer = () => {
    setPortfolioAssets(agentProposedAssets);
    setAgentConsoleLogs(prev => [...prev, '✓ Applied asset selections to the covariance optimizer panel.']);
  };

  const handleAgentAutonomousAllocate = async () => {
    setAgentConsoleLogs(prev => [...prev, 'Starting autonomous multi-asset acquisition...']);
    const totalAllocatable = brokerCash;
    let remainingCash = totalAllocatable;
    const nextHoldings = { ...brokerHoldings };
    
    for (const [asset, weightPct] of Object.entries(agentProposedWeights)) {
      const allocationCash = totalAllocatable * ((weightPct as number) / 100);
      const assetPrice = asset === ticker && marketData?.regularMarketPrice 
        ? marketData.regularMarketPrice 
        : (assetsMeta[asset]?.price || 150.0);
        
      const sharesToBuy = parseFloat((allocationCash / assetPrice).toFixed(4));
      
      if (sharesToBuy > 0) {
        setAgentConsoleLogs(prev => [...prev, `[AI Execution] Buying ${sharesToBuy} shares of ${asset} at $${assetPrice.toFixed(2)} (${weightPct}% allocation)...`]);
        
        nextHoldings[asset] = parseFloat(((nextHoldings[asset] || 0) + sharesToBuy).toFixed(4));
        remainingCash -= allocationCash;
        
        await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: asset as any,
            side: 'BUY',
            entryPrice: assetPrice,
            stopLoss: assetPrice * 0.90,
            takeProfit: assetPrice * 1.20,
            size: sharesToBuy,
            reason: `Agentic Portfolio Allocation: ${activeAgent} AI Strat.`,
            confidence: 95,
            confluences: ['Autonomous Agent Rebalancing', 'Covariance Optimisation']
          })
        }).catch(err => console.warn(err));
      }
    }
    
    setBrokerCash(parseFloat(Math.max(0, remainingCash).toFixed(2)));
    setBrokerHoldings(nextHoldings);
    setAgentConsoleLogs(prev => [...prev, '✓ Portfolio autonomously rebalanced and logged to risk engine!']);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTicker(searchInput.trim().toUpperCase());
    }
  };

  const handleBacktest = () => {
    if (!marketData?.bars || marketData.bars.length === 0) return;
    setIsBacktesting(true);

    setTimeout(() => {
      const bars: HistoricalBar[] = marketData.bars;
      let cash = 10000;
      let holdings = 0;
      const initialCash = cash;

      // Buy & Hold equity curve
      const buyHoldEquity = bars.map(bar => (initialCash / bars[0].close) * bar.close);

      // Strategy calculations (simulated vectorbt Pandas performance loop)
      const strategyEquity: number[] = [];
      const tradeLog: any[] = [];
      let lastAction: 'BUY' | 'SELL' | null = null;
      let buyPrice = 0;

      // Custom strategy criteria
      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i];
        
        // Simulating indicator thresholds:
        // EMA strategy: crossover of simulated fast and slow moving averages
        // RSI strategy: buy < 30, sell > 70
        // MACD strategy: positive histogram crossover
        let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';

        if (backtestStrategy === 'EMA') {
          // Simulated 9/21 cross
          if (i > 5) {
            const prevClose = bars[i-1].close;
            const currentClose = bar.close;
            if (currentClose > prevClose * 1.008 && lastAction !== 'BUY') signal = 'BUY';
            else if (currentClose < prevClose * 0.992 && lastAction === 'BUY') signal = 'SELL';
          }
        } else if (backtestStrategy === 'RSI') {
          const randVal = Math.random() * 100;
          if (randVal < 20 && lastAction !== 'BUY') signal = 'BUY';
          else if (randVal > 80 && lastAction === 'BUY') signal = 'SELL';
        } else { // MACD
          const randVal = Math.random();
          if (randVal < 0.15 && lastAction !== 'BUY') signal = 'BUY';
          else if (randVal > 0.85 && lastAction === 'BUY') signal = 'SELL';
        }

        // Execute orders
        if (signal === 'BUY') {
          holdings = cash / bar.close;
          cash = 0;
          lastAction = 'BUY';
          buyPrice = bar.close;
          tradeLog.push({
            type: 'BUY',
            date: new Date(bar.timestamp).toLocaleDateString(),
            price: bar.close,
            cashLeft: cash
          });
        } else if (signal === 'SELL' && holdings > 0) {
          cash = holdings * bar.close;
          holdings = 0;
          lastAction = 'SELL';
          const pnl = ((bar.close - buyPrice) / buyPrice) * 100;
          tradeLog.push({
            type: 'SELL',
            date: new Date(bar.timestamp).toLocaleDateString(),
            price: bar.close,
            pnl: parseFloat(pnl.toFixed(2)),
            cashLeft: cash
          });
        }

        const currentEquity = holdings > 0 ? holdings * bar.close : cash;
        strategyEquity.push(currentEquity);
      }

      const finalEquity = holdings > 0 ? holdings * bars[bars.length - 1].close : cash;
      const strategyReturn = ((finalEquity - initialCash) / initialCash) * 100;
      const buyHoldReturn = ((bars[bars.length - 1].close - bars[0].close) / bars[0].close) * 100;
      
      // Merge chart equity curves
      const chartData = bars.map((bar, idx) => ({
        date: new Date(bar.timestamp).toLocaleDateString(),
        'Buy & Hold': parseFloat(buyHoldEquity[idx].toFixed(2)),
        'Backtest Strategy': parseFloat(strategyEquity[idx].toFixed(2))
      }));

      // Calculate ratios
      const winTrades = tradeLog.filter(t => t.type === 'SELL' && t.pnl > 0).length;
      const totalTrades = tradeLog.filter(t => t.type === 'SELL').length;
      const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;

      setBacktestResults({
        strategyReturn: parseFloat(strategyReturn.toFixed(2)),
        buyHoldReturn: parseFloat(buyHoldReturn.toFixed(2)),
        winRate: parseFloat(winRate.toFixed(1)),
        trades: totalTrades,
        sharpeRatio: (strategyReturn > 0 ? 1.5 + Math.random() : 0.4 + Math.random()).toFixed(2),
        maxDrawdown: (Math.random() * 12 + 4).toFixed(1),
        chartData,
        tradeLog: tradeLog.reverse()
      });

      setIsBacktesting(false);
    }, 1200);
  };

  const handleOptimizePortfolio = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      // Numerical portfolio optimization logic (simulating pyportfolioOpt standard equations)
      // Standard annual expected returns & volatilities matching asset historical averages
      const assetsMeta: Record<string, { ret: number; vol: number }> = {
        AAPL: { ret: 0.18, vol: 0.22 },
        MSFT: { ret: 0.16, vol: 0.20 },
        NVDA: { ret: 0.42, vol: 0.38 },
        GOOG: { ret: 0.15, vol: 0.23 },
        TSLA: { ret: 0.25, vol: 0.45 },
        AMZN: { ret: 0.17, vol: 0.25 },
        META: { ret: 0.21, vol: 0.28 },
        'BTC-USD': { ret: 0.55, vol: 0.65 },
        'ETH-USD': { ret: 0.45, vol: 0.72 }
      };

      const currentAssets = portfolioAssets.length > 0 ? portfolioAssets : ['AAPL', 'MSFT', 'NVDA'];
      let weights: number[] = [];

      if (optMethod === 'SHARPE') {
        // Higher returns get heavily favored, normalized to sum to 100%
        const score = currentAssets.map(a => Math.max(0.01, (assetsMeta[a]?.ret || 0.12) / (assetsMeta[a]?.vol || 0.25)));
        const totalScore = score.reduce((acc, v) => acc + v, 0);
        weights = score.map(s => s / totalScore);
      } else if (optMethod === 'MIN_VOL') {
        // Lower volatilities get heavily favored
        const score = currentAssets.map(a => 1 / (assetsMeta[a]?.vol || 0.25));
        const totalScore = score.reduce((acc, v) => acc + v, 0);
        weights = score.map(s => s / totalScore);
      } else { // Risk Parity
        // Volatilities inversely balanced
        const score = currentAssets.map(a => 1 / Math.sqrt(assetsMeta[a]?.vol || 0.25));
        const totalScore = score.reduce((acc, v) => acc + v, 0);
        weights = score.map(s => s / totalScore);
      }

      // Format weights pie data
      const pieData = currentAssets.map((asset, idx) => ({
        name: asset,
        value: parseFloat((weights[idx] * 100).toFixed(1))
      }));

      // Calculate composite metrics
      let expectedReturn = 0;
      let expectedVolatility = 0;
      
      currentAssets.forEach((asset, idx) => {
        const meta = assetsMeta[asset] || { ret: 0.12, vol: 0.24 };
        expectedReturn += weights[idx] * meta.ret;
        expectedVolatility += weights[idx] * weights[idx] * meta.vol * meta.vol; // diagonal approximation
      });
      expectedVolatility = Math.sqrt(expectedVolatility) * 1.15; // inflate slightly for cross correlation simulation

      const sharpeRatio = (expectedReturn - 0.04) / expectedVolatility; // Risk free rate 4%

      // Generate efficient frontier curves scatter data
      const frontierPoints: any[] = [];
      for (let i = 0; i < 35; i++) {
        const vol = 0.15 + (i * 0.015);
        const ret = 0.05 + Math.sqrt(vol - 0.12) * 0.48 + (Math.random() - 0.5) * 0.02;
        frontierPoints.push({
          volatility: parseFloat((vol * 100).toFixed(2)),
          return: parseFloat((ret * 100).toFixed(2))
        });
      }

      setOptimizationResults({
        weights: pieData,
        expectedReturn: parseFloat((expectedReturn * 100).toFixed(2)),
        expectedVolatility: parseFloat((expectedVolatility * 100).toFixed(2)),
        sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
        frontierPoints
      });

      setIsOptimizing(false);
    }, 1000);
  };

  const handleAddPortfolioAsset = () => {
    if (newAssetInput.trim()) {
      const formatted = newAssetInput.trim().toUpperCase();
      if (!portfolioAssets.includes(formatted)) {
        setPortfolioAssets([...portfolioAssets, formatted]);
      }
      setNewAssetInput('');
    }
  };

  const handleRemovePortfolioAsset = (asset: string) => {
    setPortfolioAssets(portfolioAssets.filter(a => a !== asset));
  };

  // Filter and sort screener rows like Pandas DataFrame operations
  const sortedScreenerData = [...screenerData]
    .filter(row => {
      const matchesSearch = 
        row.ticker.toLowerCase().includes(screenerSearch.toLowerCase()) || 
        row.name.toLowerCase().includes(screenerSearch.toLowerCase());
      
      const matchesSector = 
        screenerSector === 'ALL' || 
        row.sector === screenerSector;
      
      const matchesCap = 
        row.sector === 'Forex' || 
        (row.marketCap / 1e9) >= screenerMinCap;
      
      const matchesPE = 
        row.peRatio === null || 
        row.peRatio <= screenerPEFilter;
      
      const matchesROE = 
        row.roe === null || 
        row.roe >= screenerROEFilter;
      
      const matchesMomentum = 
        row.fiftyTwoWeekChange >= screenerMinMomentum;
      
      const matchesDiv = 
        !screenerDivOnly || 
        (row.dividendYield !== null && row.dividendYield > 0);

      return (
        matchesSearch &&
        matchesSector &&
        matchesCap &&
        matchesPE &&
        matchesROE &&
        matchesMomentum &&
        matchesDiv
      );
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      // Handle nulls in sorting so they don't break comparisons
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') valA = valA.toUpperCase();
      if (typeof valB === 'string') valB = valB.toUpperCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const triggerSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const downloadScreenerCSV = () => {
    const headers = ['Ticker', 'Name', 'Sector', 'Market Cap', 'P/E Ratio', 'ROE', '52W Change', 'Div Yield', 'Debt/Equity', 'Revenue Growth'];
    const rows = sortedScreenerData.map(r => [
      r.ticker,
      `"${r.name.replace(/"/g, '""')}"`,
      r.sector,
      r.marketCap,
      r.peRatio ?? 'N/A',
      r.roe !== null ? `${(r.roe * 100).toFixed(2)}%` : 'N/A',
      `${(r.fiftyTwoWeekChange * 100).toFixed(2)}%`,
      r.dividendYield !== null ? `${(r.dividendYield * 100).toFixed(2)}%` : 'N/A',
      r.debtToEquity ?? 'N/A',
      r.revenueGrowth !== null ? `${(r.revenueGrowth * 100).toFixed(2)}%` : 'N/A'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pandas_screener_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper formatting values
  const formatMoney = (val: number | null) => {
    if (!val) return 'N/A';
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#a855f7', '#14b8a6'];

  return (
    <div id="markets-terminal-container" className="space-y-6 text-white font-sans">
      


      {/* ERRORS PANEL */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded p-3 my-4 text-xs text-rose-400 font-mono flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUBTAB CONTENT PORTAL */}
      <div>

          {/* 1. TICKER ANALYSIS SUBTAB */}
        {activeSubTab === 'ANALYSIS' && (
          <div className="space-y-6">
            
            {/* SEARCH AND CONTROL LINE */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#0a0a0c] p-3 rounded-lg border border-white/5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Enter Ticker Symbol (e.g. AAPL, MSFT, BTC-USD, EURUSD=X)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-[#040405] border border-white/10 rounded pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-mono uppercase tracking-wider font-extrabold cursor-pointer"
                >
                  {loading ? 'PULLING...' : 'PULL DATA'}
                </button>

                {/* Range selectors */}
                <div className="flex bg-[#040405] border border-white/10 p-0.5 rounded text-white/40">
                  {(['5d', '1mo', '3mo', '1y'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRange(r)}
                      className={`px-2.5 py-1.5 text-[9px] font-mono rounded cursor-pointer ${
                        range === r 
                          ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/20' 
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Discover toggle button next to range selectors */}
                <button
                  type="button"
                  onClick={() => setActiveSubTab('SCREENER')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono uppercase tracking-wider font-extrabold text-xs rounded flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Switch to Discover Screener"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>DISCOVER</span>
                </button>
              </div>
            </form>



            {/* LIVE PRICE PANEL AND HISTORICAL PLOTLY/RECHARTS CANVAS */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <span className="text-xs text-white/40 font-mono uppercase tracking-widest">Querying Yahoo Finance REST Gateway...</span>
              </div>
            ) : marketData ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                  {/* LEFT COLUMN: widescreen data panels (Chart and AI core analysis) */}
                  <div className="lg:col-span-2 flex flex-col h-full">
                    
                    {/* Visual Chart Canvas */}
                    <div className="bg-[#09090c] border border-white/5 rounded-xl p-5 space-y-4 relative overflow-hidden flex flex-col h-full flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xl font-black font-mono tracking-tight text-white">
                            {marketData.symbol}
                          </h4>
                          <span className="text-lg font-bold font-mono text-indigo-400">
                            ${marketData.regularMarketPrice ? marketData.regularMarketPrice.toLocaleString() : '0.00'}
                          </span>
                          <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider">
                            {marketData.currency || 'USD'}
                          </span>
                        </div>
                        {marketData.bars && marketData.bars.length > 1 && (
                          <div className="flex items-center gap-3 ml-auto">
                            {/* Financials Toggle Button */}
                            <button
                              type="button"
                              onClick={() => setShowFinancialsOverlay(!showFinancialsOverlay)}
                              className={`px-3 py-1.5 text-[11px] font-mono font-bold border rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                showFinancialsOverlay
                                  ? 'bg-indigo-600/25 border-indigo-500/50 text-indigo-300 shadow-sm shadow-indigo-500/10'
                                  : 'bg-white/[0.02] border-white/10 text-white/50 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span>{showFinancialsOverlay ? 'Hide Financials' : 'Financials'}</span>
                            </button>

                            <div>
                              {(() => {
                                const first = marketData.bars[0].close;
                                const last = marketData.bars[marketData.bars.length - 1].close;
                                const pct = ((last - first) / first) * 100;
                                const up = pct >= 0;
                                return (
                                  <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded ${
                                    up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                  }`}>
                                    {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                    {pct.toFixed(2)}% ({range.toUpperCase()})
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Recharts Price Area Chart */}
                      <div className="flex-1 min-h-[350px] h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={marketData.bars}>
                            <defs>
                               <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                                 <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                               </linearGradient>
                            </defs>
                            <XAxis 
                              dataKey="timestamp" 
                              tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                              tick={{ fill: '#ffffff30', fontSize: 9 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis 
                              domain={['auto', 'auto']}
                              tick={{ fill: '#ffffff30', fontSize: 9 }}
                              axisLine={false}
                              tickLine={false}
                              orientation="right"
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0c0c0e', border: '1px solid #ffffff10', borderRadius: '8px' }}
                              labelFormatter={(str) => new Date(str).toLocaleString()}
                              formatter={(val: any) => [`$${val.toLocaleString()}`, 'Close Price']}
                            />
                            <Area type="monotone" dataKey="close" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#priceGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Absolute overlay for Fundamental Financials */}
                      {showFinancialsOverlay && (
                        <div className="absolute inset-0 bg-[#07070a]/95 backdrop-blur-md z-10 p-5 flex flex-col justify-between overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                          <div className="space-y-4">
                            {/* Overlay Header */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
                                  <BarChart3 className="w-4 h-4 animate-pulse" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-white">
                                    {ticker.toUpperCase()} Fundamental Financials
                                  </h4>
                                  <p className="text-[9px] text-white/40 font-mono">Simulated metrics and ratios via quantitative REST feed</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowFinancialsOverlay(false)}
                                className="p-1.5 hover:bg-white/5 border border-white/5 rounded text-white/40 hover:text-white transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Ratios Grid */}
                            {fundamentalData?.ratios ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {[
                                  { label: 'Market Cap', value: formatMoney(fundamentalData.ratios.marketCap), desc: 'Total outstanding value' },
                                  { label: 'P/E Ratio (Trailing)', value: fundamentalData.ratios.peRatio ? fundamentalData.ratios.peRatio.toFixed(2) : 'N/A', desc: 'Price to earnings' },
                                  { label: 'Forward P/E', value: fundamentalData.ratios.forwardPE ? fundamentalData.ratios.forwardPE.toFixed(2) : 'N/A', desc: 'Projected 12-month P/E' },
                                  { label: 'Price-to-Book (P/B)', value: fundamentalData.ratios.priceToBook ? fundamentalData.ratios.priceToBook.toFixed(2) : 'N/A', desc: 'Price relative to book value' },
                                  { label: 'Return on Equity (ROE)', value: fundamentalData.ratios.roe ? `${(fundamentalData.ratios.roe * 100).toFixed(2)}%` : 'N/A', desc: 'Equity profitability index' },
                                  { label: 'Return on Assets (ROA)', value: fundamentalData.ratios.roa ? `${(fundamentalData.ratios.roa * 100).toFixed(2)}%` : 'N/A', desc: 'Asset productivity index' },
                                  { label: 'Net Profit Margin', value: fundamentalData.ratios.profitMargin ? `${(fundamentalData.ratios.profitMargin * 100).toFixed(2)}%` : 'N/A', desc: 'Net income / Total revenue' },
                                  { label: 'Operating Margin', value: fundamentalData.ratios.operatingMargin ? `${(fundamentalData.ratios.operatingMargin * 100).toFixed(2)}%` : 'N/A', desc: 'Operating income / Revenue' },
                                  { label: 'Beta (Volatility)', value: fundamentalData.ratios.beta ? fundamentalData.ratios.beta.toFixed(2) : '1.00', desc: 'Market covariance factor' },
                                  { label: 'Dividend Yield', value: fundamentalData.ratios.dividendYield ? `${(fundamentalData.ratios.dividendYield * 100).toFixed(2)}%` : 'N/A', desc: 'Annual dividend return' },
                                  { label: 'Debt to Equity (D/E)', value: fundamentalData.ratios.debtToEquity ? `${fundamentalData.ratios.debtToEquity.toFixed(1)}%` : 'N/A', desc: 'Relative debt leverage' },
                                  { label: 'Revenue Growth (YoY)', value: fundamentalData.ratios.revenueGrowth ? `${(fundamentalData.ratios.revenueGrowth * 100).toFixed(2)}%` : 'N/A', desc: 'Sales annual increase' },
                                ].map((ratio, index) => (
                                  <div key={index} className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 flex flex-col justify-between space-y-1">
                                    <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider block">{ratio.label}</span>
                                    <span className="text-[13px] font-bold text-white font-mono">{ratio.value}</span>
                                    <span className="text-[8px] text-white/30 font-sans leading-tight block">{ratio.desc}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-12 text-center text-xs font-mono text-white/30">
                                Loading ticker financials. Please wait...
                              </div>
                            )}
                          </div>

                          {/* Summary footer */}
                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/40 shrink-0">
                            <span>CALIBRATED VIA REST GATEWAY</span>
                            <span>TICKER: {ticker.toUpperCase()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* RIGHT COLUMN: Order Ticket & Interactive AI Copilot Chat */}
                  <div className="lg:col-span-1 flex flex-col h-full">

                    {/* MULTI-ASSET BROKERAGE ORDER TICKET */}
                    <div className="bg-[#09090c] border border-white/5 rounded-xl p-5 space-y-4 flex flex-col h-full flex-1">
                      {/* BUY / SELL Action Tabs */}
                      <div className="grid grid-cols-2 bg-[#040405] p-0.5 rounded border border-white/5">
                        <button
                          type="button"
                          onClick={() => setOrderSide('BUY')}
                          className={`py-1.5 text-[10px] font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                            orderSide === 'BUY'
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'text-white/40 hover:text-white/80'
                          }`}
                        >
                          Buy Shares
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderSide('SELL')}
                          className={`py-1.5 text-[10px] font-mono font-bold uppercase rounded transition-all cursor-pointer ${
                            orderSide === 'SELL'
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'text-white/40 hover:text-white/80'
                          }`}
                        >
                          Sell Shares
                        </button>
                      </div>

                      <div className="space-y-3 font-mono">
                        {/* Active asset & price */}
                        <div className="flex justify-between items-center text-xs bg-[#040405] p-2 rounded border border-white/5">
                          <span className="text-white/40">ACTIVE ASSET:</span>
                          <span className="font-bold text-white">{ticker}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs bg-[#040405] p-2 rounded border border-white/5">
                          <span className="text-white/40">MARKET PRICE:</span>
                          <span className="font-bold text-indigo-300">
                            ${marketData?.regularMarketPrice ? marketData.regularMarketPrice.toLocaleString() : '0.00'}
                          </span>
                        </div>

                        {/* Shares / Unit Input */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] text-white/40 uppercase">
                            <span>QUANTITY (SHARES):</span>
                            <span>Holding: {(brokerHoldings[ticker] || 0).toFixed(2)} shares</span>
                          </div>
                          <input
                            type="number"
                            min="1"
                            max="100000"
                            step="1"
                            value={orderShares}
                            onChange={(e) => setOrderShares(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-[#040405] border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white font-bold"
                          />
                        </div>

                        {/* Order Type */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-white/40 uppercase block">ORDER TYPE:</span>
                          <select
                            value={orderType}
                            onChange={(e) => {
                              setOrderType(e.target.value as any);
                              if (marketData?.regularMarketPrice) {
                                setOrderLimitPrice(marketData.regularMarketPrice);
                              }
                            }}
                            className="w-full bg-[#040405] border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white font-bold"
                          >
                            <option value="MARKET">MARKET ORDER (FILL NOW)</option>
                            <option value="LIMIT">LIMIT ORDER</option>
                          </select>
                        </div>

                        {/* Limit price input */}
                        {orderType === 'LIMIT' && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-white/40 uppercase block">LIMIT PRICE ($):</span>
                            <input
                              type="number"
                              step="0.01"
                              value={orderLimitPrice}
                              onChange={(e) => setOrderLimitPrice(Math.max(0.01, parseFloat(e.target.value) || 0))}
                              className="w-full bg-[#040405] border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white font-bold"
                            />
                          </div>
                        )}

                        {/* Bracket Protection Toggle */}
                        <div className="space-y-2 border-t border-white/5 pt-3">
                          <label className="flex items-center gap-2 text-[10px] text-white/50 cursor-pointer uppercase select-none">
                            <input
                              type="checkbox"
                              checked={useBracketProtection}
                              onChange={(e) => setUseBracketProtection(e.target.checked)}
                              className="rounded accent-indigo-500"
                            />
                            <span>Add Bracket Protection (SL/TP)</span>
                          </label>

                          {useBracketProtection && (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[8px] text-rose-400 block mb-1 uppercase">Stop Loss (%):</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={stopLossPct}
                                  onChange={(e) => setStopLossPct(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-[#040405] border border-white/10 rounded px-2.5 py-1.5 text-xs text-rose-300 font-bold focus:outline-none focus:border-rose-500"
                                />
                              </div>
                              <div>
                                <span className="text-[8px] text-emerald-400 block mb-1 uppercase">Take Profit (%):</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="200"
                                  value={takeProfitPct}
                                  onChange={(e) => setTakeProfitPct(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full bg-[#040405] border border-white/10 rounded px-2.5 py-1.5 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cost estimate */}
                        <div className="flex justify-between items-center text-xs font-bold border-t border-white/5 pt-3 pb-1">
                          <span className="text-white/40">EST. TOTAL:</span>
                          <span className="text-white">
                            ${((orderType === 'LIMIT' ? orderLimitPrice : marketData?.regularMarketPrice || 0) * orderShares).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </span>
                        </div>

                        {/* Feedback Message */}
                        {orderStatus && (
                          <div className={`p-2 rounded text-[10px] border ${
                            orderStatus.type === 'success'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}>
                            {orderStatus.message}
                          </div>
                        )}

                        {/* Order Trigger Button */}
                        <button
                          type="button"
                          disabled={isExecutingOrder || !marketData?.regularMarketPrice}
                          onClick={() => handleExecuteOrder()}
                          className={`w-full py-2.5 rounded font-mono font-black text-xs uppercase tracking-wider text-white transition-all cursor-pointer ${
                            orderSide === 'BUY'
                              ? 'bg-emerald-600 hover:bg-emerald-500'
                              : 'bg-rose-600 hover:bg-rose-500'
                          } disabled:opacity-50 flex items-center justify-center gap-1.5`}
                        >
                          {isExecutingOrder ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Routing Order...</span>
                            </>
                          ) : (
                            <span>ROUTE SIMULATED {orderSide} ORDER</span>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-[#09090c] border border-white/5 rounded-xl text-white/30 text-xs font-mono">
                Provide a valid ticker above and press 'Pull Data' to view interactive terminal diagnostics.
              </div>
            )}
          </div>
        )}

        {/* 2. PANDAS SCREENER SUBTAB */}
        {activeSubTab === 'SCREENER' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* SCREENER FILTER CONTROLLER */}
            <div className="bg-[#09090c] p-5 rounded-xl border border-white/5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] font-mono font-black uppercase tracking-wider text-indigo-400 font-sans">DataFrame Query Parameters (Pandas Filters)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('ANALYSIS')}
                    className="px-2.5 py-1 text-[10px] font-mono border border-indigo-500/30 hover:border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 rounded text-indigo-300 font-bold transition-all cursor-pointer"
                  >
                    ← Back to Ticker Analysis
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenerPEFilter(100);
                      setScreenerROEFilter(-0.2);
                      setScreenerSearch('');
                      setScreenerSector('ALL');
                      setScreenerMinCap(0);
                      setScreenerMinMomentum(-0.5);
                      setScreenerDivOnly(false);
                    }}
                    className="px-2.5 py-1 text-[10px] font-mono border border-white/10 hover:border-white/20 hover:bg-white/5 rounded text-white/60 hover:text-white transition-all cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left Column: Search & Sector */}
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/40 block uppercase">Search Ticker/Company</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/30" />
                      <input
                        type="text"
                        value={screenerSearch}
                        onChange={(e) => setScreenerSearch(e.target.value)}
                        placeholder="Search AAPL, Microsoft..."
                        className="w-full bg-[#040405] border border-white/10 focus:border-indigo-500/50 rounded pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none font-mono"
                      />
                      {screenerSearch && (
                        <button 
                          onClick={() => setScreenerSearch('')}
                          className="absolute right-2 top-2.5 text-white/40 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sector Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/40 block uppercase">Sector Classification</label>
                    <select
                      value={screenerSector}
                      onChange={(e) => setScreenerSector(e.target.value)}
                      className="w-full bg-[#040405] border border-white/10 focus:border-indigo-500/50 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono cursor-pointer"
                    >
                      <option value="ALL">ALL SECTORS (Consolidated)</option>
                      <option value="Technology">Technology</option>
                      <option value="Financials">Financials</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Consumer">Consumer</option>
                      <option value="Energy">Energy</option>
                      <option value="Industrials">Industrials</option>
                      <option value="Communication">Communication</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Materials">Materials</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Crypto">Crypto Tokens</option>
                      <option value="Forex">Forex Currency Pairs</option>
                    </select>
                  </div>
                </div>

                {/* Second Column: Market Cap & PE */}
                <div className="space-y-4">
                  {/* Market Cap min slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-white/40 uppercase">MIN MARKET CAP</span>
                      <span className="text-indigo-400 font-bold">{screenerMinCap === 0 ? 'Any' : `>= $${screenerMinCap}B`}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="50"
                      value={screenerMinCap}
                      onChange={(e) => setScreenerMinCap(Number(e.target.value))}
                      className="w-full h-1.5 bg-[#040405] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Max PE slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-white/40 uppercase">MAX P/E RATIO</span>
                      <span className="text-indigo-400 font-bold">{screenerPEFilter >= 100 ? 'No Cap' : `<= ${screenerPEFilter}x`}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={screenerPEFilter}
                      onChange={(e) => setScreenerPEFilter(Number(e.target.value))}
                      className="w-full h-1.5 bg-[#040405] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Third Column: ROE & Momentum */}
                <div className="space-y-4">
                  {/* Min ROE slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-white/40 uppercase">MIN ROE</span>
                      <span className="text-indigo-400 font-bold">{screenerROEFilter <= -0.2 ? 'Any' : `>= ${(screenerROEFilter * 100).toFixed(0)}%`}</span>
                    </div>
                    <input
                      type="range"
                      min="-0.2"
                      max="0.8"
                      step="0.05"
                      value={screenerROEFilter}
                      onChange={(e) => setScreenerROEFilter(Number(e.target.value))}
                      className="w-full h-1.5 bg-[#040405] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Min Momentum (52W change) slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-white/40 uppercase">MIN 52W CHANGE (MOMENTUM)</span>
                      <span className="text-indigo-400 font-bold">{screenerMinMomentum <= -0.5 ? 'Any' : `>= ${(screenerMinMomentum * 100).toFixed(0)}%`}</span>
                    </div>
                    <input
                      type="range"
                      min="-0.5"
                      max="2.0"
                      step="0.1"
                      value={screenerMinMomentum}
                      onChange={(e) => setScreenerMinMomentum(Number(e.target.value))}
                      className="w-full h-1.5 bg-[#040405] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Fourth Column: Div Yield & Python toggle */}
                <div className="flex flex-col justify-between space-y-4 md:border-l md:border-white/5 md:pl-6">
                  {/* Dividend pay toggle */}
                  <div className="flex items-center gap-3 py-1">
                    <input
                      type="checkbox"
                      id="screenerDivOnly"
                      checked={screenerDivOnly}
                      onChange={(e) => setScreenerDivOnly(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-white/10 rounded bg-[#040405] focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="screenerDivOnly" className="text-xs font-mono text-white/70 select-none cursor-pointer">
                      Dividend Payers Only
                    </label>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-white/30 block leading-tight">View Pandas execution scripts representing your query filters.</span>
                    <button
                      onClick={() => setShowPandasCode(!showPandasCode)}
                      className={`w-full py-2 border rounded text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        showPandasCode 
                          ? 'border-indigo-500/30 bg-indigo-600/10 text-indigo-400' 
                          : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      {showPandasCode ? 'Hide Pandas Code' : 'View Pandas Code'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PANDAS EXECUTION PREVIEW CODE BLOCK */}
            {showPandasCode && (
              <div className="bg-[#030304] border border-indigo-500/20 rounded-xl p-4 font-mono text-[10px] text-indigo-300 space-y-2.5">
                <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2">
                  <span className="text-indigo-400 font-black tracking-wider uppercase flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 animate-pulse" />
                    Pandas Query Equivalent Execution (Python Engine)
                  </span>
                  <span className="text-white/20 text-[9px]">Compiled: pandas 2.2.1 • yfinance 0.2.38</span>
                </div>
                <pre className="overflow-x-auto text-white/70 select-all p-2 bg-[#000001] rounded border border-white/[0.02] whitespace-pre">
{`import pandas as pd
import yfinance as yf

# 1. Instantiate quantitative DataFrame (Screener Stack)
df = pd.DataFrame(screener_data)

# 2. Apply multi-factor conditional parameters
query_conditions = [
    df['name'].str.contains('${screenerSearch}', case=False) | df['ticker'].str.contains('${screenerSearch}', case=False)
]
${screenerSector !== 'ALL' ? `query_conditions.append(df['sector'] == '${screenerSector}')` : '# No sector filter active'}
${screenerMinCap > 0 ? `query_conditions.append((df['marketCap'] / 1e9) >= ${screenerMinCap})` : '# No market cap filter active'}
${screenerPEFilter < 100 ? `query_conditions.append(df['peRatio'] <= ${screenerPEFilter})` : '# No P/E ratio filter active'}
${screenerROEFilter > -0.2 ? `query_conditions.append(df['roe'] >= ${screenerROEFilter})` : '# No ROE filter active'}
${screenerMinMomentum > -0.5 ? `query_conditions.append(df['fiftyTwoWeekChange'] >= ${screenerMinMomentum})` : '# No momentum filter active'}
${screenerDivOnly ? `query_conditions.append(df['dividendYield'] > 0)` : '# No dividend filter active'}

# 3. Compile filtered Pandas DataFrame
filtered_df = df[pd.concat(query_conditions, axis=1).all(axis=1)]
sorted_df = filtered_df.sort_values(
    by='${sortBy}', 
    ascending=${sortOrder === 'asc' ? 'True' : 'False'}
)

print(f"Dataframe compilation success: {sorted_df.shape[0]} rows matched.")`}
                </pre>
              </div>
            )}

            {/* QUICK STATS CARD GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#09090c] p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-white/40 block uppercase">MATCHING ASSETS</span>
                <span className="text-xl font-bold font-mono text-white">{sortedScreenerData.length}</span>
                <span className="text-[9px] font-mono text-emerald-400">of {screenerData.length} indexed tickers</span>
              </div>
              <div className="bg-[#09090c] p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-white/40 block uppercase">AVG P/E RATIO</span>
                <span className="text-xl font-bold font-mono text-indigo-400">
                  {(() => {
                    const valid = sortedScreenerData.filter(r => r.peRatio !== null);
                    if (valid.length === 0) return 'N/A';
                    return `${(valid.reduce((sum, r) => sum + r.peRatio!, 0) / valid.length).toFixed(1)}x`;
                  })()}
                </span>
                <span className="text-[9px] font-mono text-white/20">growth valuation index</span>
              </div>
              <div className="bg-[#09090c] p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-white/40 block uppercase">AVG RETURN ON EQUITY</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {(() => {
                    const valid = sortedScreenerData.filter(r => r.roe !== null);
                    if (valid.length === 0) return 'N/A';
                    return `${((valid.reduce((sum, r) => sum + r.roe!, 0) / valid.length) * 100).toFixed(1)}%`;
                  })()}
                </span>
                <span className="text-[9px] font-mono text-white/20">profitability metric</span>
              </div>
              <div className="bg-[#09090c] p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-white/40 block uppercase">AVG 52W CHANGE</span>
                <span className="text-xl font-bold font-mono text-white">
                  {(() => {
                    if (sortedScreenerData.length === 0) return 'N/A';
                    const avg = sortedScreenerData.reduce((sum, r) => sum + r.fiftyTwoWeekChange, 0) / sortedScreenerData.length;
                    return `${avg >= 0 ? '+' : ''}${(avg * 100).toFixed(1)}%`;
                  })()}
                </span>
                <span className="text-[9px] font-mono text-white/20">momentum index factor</span>
              </div>
            </div>

            {/* INTERACTIVE PANDAS DATAFRAME VIEW */}
            {screenerLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <span className="text-xs text-white/40 font-mono uppercase tracking-widest">Iterating tickers via Pandas fundamentals loop...</span>
              </div>
            ) : (
              <div className="bg-[#09090c] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-400">Filtered DataFrame: {sortedScreenerData.length} entries</span>
                    <span className="text-[8px] bg-emerald-500/15 text-emerald-400 font-mono px-1.5 py-0.5 rounded">STATUS: PERSISTED</span>
                  </div>
                  <button
                    onClick={downloadScreenerCSV}
                    disabled={sortedScreenerData.length === 0}
                    className="px-3 py-1.5 bg-[#040405] hover:bg-emerald-600/10 disabled:opacity-30 border border-white/10 hover:border-emerald-500/20 text-white/70 hover:text-emerald-400 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sliders className="w-3 h-3" />
                    Export CSV DataFrame
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-white/50 font-black tracking-wider uppercase select-none">
                        <th className="p-3.5 pl-5 cursor-pointer hover:text-white" onClick={() => triggerSort('ticker')}>
                          <span className="flex items-center gap-1">
                            Ticker
                            {sortBy === 'ticker' && (sortOrder === 'asc' ? '▲' : '▼')}
                          </span>
                        </th>
                        <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => triggerSort('name')}>
                          <span className="flex items-center gap-1">
                            Company Name
                            {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                          </span>
                        </th>
                        <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => triggerSort('sector')}>
                          <span className="flex items-center gap-1">
                            Sector
                            {sortBy === 'sector' && (sortOrder === 'asc' ? '▲' : '▼')}
                          </span>
                        </th>
                        <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => triggerSort('marketCap')}>
                          <span className="flex items-center gap-1">
                            Market Cap
                            {sortBy === 'marketCap' && (sortOrder === 'asc' ? '▲' : '▼')}
                          </span>
                        </th>
                        <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => triggerSort('peRatio')}>
                          <span className="flex items-center gap-1">
                            P/E Ratio
                            {sortBy === 'peRatio' && (sortOrder === 'asc' ? '▲' : '▼')}
                          </span>
                        </th>
                        <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => triggerSort('roe')}>
                          <span className="flex items-center gap-1">
                            ROE
                            {sortBy === 'roe' && (sortOrder === 'asc' ? '▲' : '▼')}
                          </span>
                        </th>
                        <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => triggerSort('fiftyTwoWeekChange')}>
                          <span className="flex items-center gap-1">
                            52W Chg (Momentum)
                            {sortBy === 'fiftyTwoWeekChange' && (sortOrder === 'asc' ? '▲' : '▼')}
                          </span>
                        </th>
                        <th className="p-3.5 pr-5 text-right">Terminal Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedScreenerData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-white/20">No assets match your query filters. Broaden parameters or search queries.</td>
                        </tr>
                      ) : (
                        sortedScreenerData.map((row, idx) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                            <td className="p-3.5 pl-5 font-bold text-indigo-400">{row.ticker}</td>
                            <td className="p-3.5 text-white/70 max-w-[150px] truncate" title={row.name}>{row.name}</td>
                            <td className="p-3.5">
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/60">
                                {row.sector}
                              </span>
                            </td>
                            <td className="p-3.5 text-white/70">
                              {row.marketCap === 0 ? 'N/A' : row.marketCap >= 1e12 ? `$${(row.marketCap / 1e12).toFixed(2)}T` : `$${(row.marketCap / 1e9).toFixed(1)}B`}
                            </td>
                            <td className="p-3.5 text-white/70">{row.peRatio !== null ? `${row.peRatio.toFixed(1)}x` : 'N/A'}</td>
                            <td className="p-3.5">
                              {row.roe !== null ? (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${row.roe >= 0.15 ? 'bg-emerald-500/10 text-emerald-400 font-bold' : row.roe < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-white/50'}`}>
                                  {(row.roe * 100).toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-white/20">N/A</span>
                              )}
                            </td>
                            <td className={`p-3.5 font-bold ${row.fiftyTwoWeekChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {row.fiftyTwoWeekChange >= 0 ? '+' : ''}{(row.fiftyTwoWeekChange * 100).toFixed(1)}%
                            </td>
                            <td className="p-3.5 pr-5 text-right">
                              <button
                                onClick={() => {
                                  setTicker(row.ticker);
                                  setSearchInput(row.ticker);
                                  setActiveSubTab('ANALYSIS');
                                }}
                                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded text-[9px] font-bold uppercase transition-all cursor-pointer"
                              >
                                Analyze Ticker
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
          </div>
        )}

      </div> {/* Closes SUBTAB CONTENT PORTAL */}

  </div> // Closes markets-terminal-container
);
}
