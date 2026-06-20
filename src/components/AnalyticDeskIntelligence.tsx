/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { MarketSymbol, MarketMetrics, Trade } from '../types';
import { 
  Compass, 
  Activity, 
  Gauge, 
  Layers, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  LineChart, 
  Cpu, 
  Dribbble, 
  ArrowRight,
  Globe,
  Radio,
  Sliders,
  ShieldAlert,
  Sparkles,
  Check,
  RefreshCw
} from 'lucide-react';

interface AnalyticDeskIntelligenceProps {
  symbol: MarketSymbol;
  metrics: MarketMetrics;
  trades?: Trade[];
  onUpdateTradeParams?: (id: string, params: Partial<Trade>) => Promise<void> | void;
}

export default function AnalyticDeskIntelligence({ symbol, metrics, trades = [], onUpdateTradeParams }: AnalyticDeskIntelligenceProps) {
  const [selectedRegimeRef, setSelectedRegimeRef] = useState<number>(0); // manual shock index nudge
  const [showHeuristicsInfo, setShowHeuristicsInfo] = useState<boolean>(false);
  const [selectedIntegrationWeight, setSelectedIntegrationWeight] = useState<number>(1.0); // 1x ATR multiplier slider
  const [dismissedSafetyStatus, setDismissedSafetyStatus] = useState<boolean>(false);
  const [timeframeBiasFilter, setTimeframeBiasFilter] = useState<'COMBINED' | 'H4' | 'DAILY'>('COMBINED');
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number>(5); // 0 to 5, where 5 is live
  const [strategyPreset, setStrategyPreset] = useState<'ICT_2022' | 'POWER_OF_3'>('ICT_2022');

  // ATR Volatility-Adjusted Stop Loss states
  const [slModel, setSlModel] = useState<'TRAILING' | 'FIXED_ENTRY'>('TRAILING');
  const [slMultiplier, setSlMultiplier] = useState<number>(2.0);
  const [slShowAllSymbols, setSlShowAllSymbols] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionSuccess, setActionSuccess] = useState<Record<string, boolean>>({});

  // Real-time Order Flow Intensity Heatmap states
  const [heatmapSensitivity, setHeatmapSensitivity] = useState<number>(35);
  const [showHiddenLiquidityOnly, setShowHiddenLiquidityOnly] = useState<boolean>(false);
  const [heatmapTicks, setHeatmapTicks] = useState<any[]>([]);
  const [icebergDiscoveredLogs, setIcebergDiscoveredLogs] = useState<string[]>([]);
  const [lastOrderFlowDelta, setLastOrderFlowDelta] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const getTickStepForSymbol = (sym: string) => {
    if (sym === 'BTC/USDT') return 10.0;
    if (sym === 'ETH/USDT') return 1.0;
    if (sym === 'SOL/USDT') return 0.1;
    if (sym === 'GOLD/USD') return 0.25;
    if (sym === 'SILVER/USD') return 0.02;
    if (sym.includes('JPY')) return 0.05;
    if (sym === 'US30' || sym === 'NAS100' || sym === 'GER40') return 5.0;
    if (sym === 'SPX500') return 0.5;
    return 0.0001; 
  };

  const formatPriceForSymbol = (val: number, sym: string) => {
    if (sym === 'BTC/USDT') return val.toFixed(1);
    if (sym === 'ETH/USDT') return val.toFixed(2);
    if (sym === 'SOL/USDT') return val.toFixed(2);
    if (sym === 'GOLD/USD' || sym === 'SILVER/USD') return val.toFixed(2);
    if (sym.includes('JPY')) return val.toFixed(3);
    if (sym === 'US30' || sym === 'NAS100' || sym === 'GER40' || sym === 'SPX500') return val.toFixed(2);
    return val.toFixed(5);
  };

  useEffect(() => {
    const step = getTickStepForSymbol(symbol);
    const centerPrice = metrics.currentPrice;
    
    const generateCluster = (offsetSteps: number, isAsk: boolean) => {
      const price = centerPrice + (offsetSteps * step * (isAsk ? 1 : -1));
      const seedVal = Math.sin(price * 1000 + (isAsk ? 50 : 20));
      const baseVol = Math.abs(seedVal) * 50 + 5;
      
      const isIceberg = Math.abs(offsetSteps) === 3 || Math.abs(offsetSteps) === 7;
      const volume = isIceberg ? baseVol * 6.5 + 135 : baseVol;
      const intensity = Math.min(1, volume / 355);
      
      return {
        price,
        offsetSteps,
        volume,
        type: isAsk ? 'SELL_ASK' : 'BUY_BID',
        intensity,
        isIceberg,
        filledPercentage: Math.floor(Math.abs(Math.sin(price)) * 80 + 10)
      };
    };

    const makeTicks = () => {
      const asks = Array.from({ length: 8 }).map((_, i) => generateCluster(i + 1, true)).reverse();
      const bids = Array.from({ length: 8 }).map((_, i) => generateCluster(i + 1, false));
      setHeatmapTicks([...asks, ...bids]);
    };
    
    makeTicks();

    const interval = setInterval(() => {
      setHeatmapTicks(prevTicks => {
        if (prevTicks.length === 0) return prevTicks;
        const updated = prevTicks.map(t => {
          const shift = (Math.random() - 0.5) * (t.isIceberg ? 10 : 5);
          const volume = Math.max(5, t.volume + shift);
          const intensity = Math.min(1, volume / 355);
          const filledChange = Math.random() > 0.7 ? (Math.random() > 0.5 ? 2 : -2) : 0;
          const filledPercentage = Math.min(99, Math.max(1, t.filledPercentage + filledChange));
          
          return {
            ...t,
            volume,
            intensity,
            filledPercentage
          };
        });

        const totalAsksVol = updated.filter(t => t.type === 'SELL_ASK').reduce((acc, t) => acc + t.volume, 0);
        const totalBidsVol = updated.filter(t => t.type === 'BUY_BID').reduce((acc, t) => acc + t.volume, 0);
        const delta = totalBidsVol - totalAsksVol;
        setLastOrderFlowDelta(delta);

        return updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [symbol, metrics.currentPrice]);

  const triggerDeepScan = () => {
    setIsScanning(true);
    setIcebergDiscoveredLogs([]);
    setTimeout(() => {
      setIsScanning(false);
      const discoveredIcebergs = heatmapTicks
        .filter(t => t.isIceberg)
        .map(t => `Detected hidden ${t.type === 'BUY_BID' ? 'Buy Wall' : 'Sell Wall'} (Iceberg Order) at ${formatPriceForSymbol(t.price, symbol)} with clustered volume of ${t.volume.toFixed(1)} lots.`);
      setIcebergDiscoveredLogs(discoveredIcebergs);
    }, 1200);
  };

  // Helper to estimate symbol proportional ATR
  const getAtrForSymbol = (tradeSymbol: string) => {
    if (tradeSymbol === symbol) return metrics.atr;
    const symbolRatio: Record<string, number> = {
      'EUR/USD': 0.0014,
      'GBP/USD': 0.0017,
      'USD/JPY': 0.28,
      'AUD/USD': 0.0011,
      'EUR/GBP': 0.0009,
      'GOLD/USD': 11.50,
      'SILVER/USD': 0.22,
      'BTC/USDT': 820.0,
      'ETH/USDT': 48.5,
      'SOL/USDT': 3.8,
      'US30': 165.0,
      'NAS100': 130.0,
      'SPX500': 28.0,
      'GER40': 90.0,
    };
    return symbolRatio[tradeSymbol] || (metrics.atr * 1.0);
  };

  const getTradeCurrentPrice = (t: Trade) => {
    if (t.symbol === symbol) {
      return metrics.currentPrice;
    }
    const isBtc = t.symbol === 'BTC/USDT' || t.symbol === 'ETH/USDT' || t.symbol === 'SOL/USDT';
    const isGold = t.symbol === 'GOLD/USD' || t.symbol === 'SILVER/USD';
    const isIndex = t.symbol === 'US30' || t.symbol === 'NAS100' || t.symbol === 'SPX500' || t.symbol === 'GER40';
    
    let scale = 100000; // default forex
    if (isBtc) scale = 1;
    else if (isGold) scale = 100;
    else if (isIndex) scale = t.symbol === 'SPX500' ? 100 : 10;
    
    if (t.symbol === 'USD/JPY') {
      scale = 1000;
    }

    const denominator = t.size * scale;
    if (denominator === 0) return t.entryPrice;

    const priceDiff = t.pnl / denominator;
    const multiplier = t.side === 'BUY' ? 1 : -1;
    return t.entryPrice + (priceDiff * multiplier);
  };

  const slSuggestions = useMemo(() => {
    return trades
      .filter(t => t.status === 'OPEN' && (slShowAllSymbols ? true : t.symbol === symbol))
      .map(t => {
        const curPx = getTradeCurrentPrice(t);
        const atrValue = getAtrForSymbol(t.symbol);
        const buffer = atrValue * slMultiplier;
        
        let proposedSL = 0;
        if (slModel === 'TRAILING') {
          proposedSL = t.side === 'BUY' ? curPx - buffer : curPx + buffer;
        } else {
          // fixed entry relative SL
          proposedSL = t.side === 'BUY' ? t.entryPrice - buffer : t.entryPrice + buffer;
        }

        const isBtc = t.symbol === 'BTC/USDT';
        const isJpy = t.symbol === 'USD/JPY';
        const isGold = t.symbol === 'GOLD/USD';
        const decimals = isBtc ? 1 : (isJpy || isGold ? 2 : 5);
        
        proposedSL = parseFloat(proposedSL.toFixed(decimals));
        
        // Calculate contract and dollar value parameters to compute current vs suggested risks
        let contractScale = 100000;
        if (isBtc || t.symbol === 'ETH/USDT' || t.symbol === 'SOL/USDT') contractScale = 1;
        else if (isGold || t.symbol === 'SILVER/USD') contractScale = 100;
        else if (t.symbol === 'US30' || t.symbol === 'NAS100' || t.symbol === 'SPX500' || t.symbol === 'GER40') contractScale = t.symbol === 'SPX500' ? 100 : 10;
        
        if (t.symbol === 'USD/JPY') contractScale = 1000;

        const currentSLRisk = t.stopLoss > 0
          ? Math.abs(t.entryPrice - t.stopLoss) * t.size * contractScale
          : null;
          
        const proposedSLRisk = Math.abs(t.entryPrice - proposedSL) * t.size * contractScale;
        
        const isSlLockedProfit = t.side === 'BUY' ? proposedSL > t.entryPrice : proposedSL < t.entryPrice;
        const lockedProfitAmount = isSlLockedProfit 
          ? Math.abs(proposedSL - t.entryPrice) * t.size * contractScale
          : 0;

        return {
          trade: t,
          currentPrice: curPx,
          atrValue,
          proposedSL,
          currentSLRisk,
          proposedSLRisk,
          isSlLockedProfit,
          lockedProfitAmount,
          decimals,
          contractScale
        };
      });
  }, [trades, symbol, slShowAllSymbols, slModel, slMultiplier, metrics.currentPrice, metrics.atr]);

  const handleUpdateParams = async (id: string, newStopLoss: number) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      if (onUpdateTradeParams) {
        await onUpdateTradeParams(id, { stopLoss: newStopLoss });
      } else {
        // Direct API invocation fallback
        const res = await fetch(`/api/trades/${id}/update-params`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stopLoss: newStopLoss }),
        });
        if (!res.ok) {
          throw new Error('Failed to update stop loss');
        }
      }
      setActionSuccess(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setActionSuccess(prev => ({ ...prev, [id]: false }));
      }, 2500);
    } catch (err) {
      console.error('Failed to update dynamic stop loss:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const [useLiveMetrics, setUseLiveMetrics] = useState<boolean>(true);
  const [manualVolatility, setManualVolatility] = useState<number>(65);
  const [manualVolume, setManualVolume] = useState<number>(55);

  const predictionResult = useMemo(() => {
    // 1. Volatility estimation
    let vol = manualVolatility;
    let volMethod = 'MANUAL COEFFICIENT';
    if (useLiveMetrics) {
      const baseAtr = metrics.atr;
      const isCrypto = symbol.includes('USDT');
      const isGold = symbol.includes('GOLD') || symbol.includes('SILVER');
      
      if (isCrypto) {
        vol = Math.round((baseAtr / 250) * 100) || 75;
      } else if (isGold) {
        vol = Math.round((baseAtr / 3) * 100) || 55;
      } else {
        vol = Math.round((baseAtr / 0.002) * 100) || 45;
      }
      vol = Math.min(150, Math.max(15, vol));
      volMethod = 'LIVE ATR VOLATILITY';
    }

    // 2. Volume estimation
    let volume = manualVolume;
    let volumeMethod = 'MANUAL STREAMING';
    if (useLiveMetrics) {
      let baseVal = 50;
      if (symbol.includes('BTC') || symbol.includes('ETH')) {
        baseVal = 20000;
      } else if (symbol.includes('GOLD')) {
        baseVal = 8500;
      } else {
        baseVal = 1300;
      }
      const rsiFactor = metrics.rsi > 50 ? (metrics.rsi / 50) : (50 / Math.max(10, metrics.rsi));
      const calculatedVolume = baseVal * rsiFactor;
      
      volume = Math.round((calculatedVolume / (symbol.includes('USDT') ? 22000 : symbol.includes('GOLD') ? 9500 : 1500)) * 60) || 50;
      volume = Math.min(150, Math.max(10, volume));
      volumeMethod = 'LIVE FEED DEPTH';
    }

    // Ratio
    const ratio = parseFloat((vol / Math.max(1, volume)).toFixed(2));
    
    // Categorization
    let regime: 'Trending' | 'Mean-Reverting' = 'Mean-Reverting';
    let label = 'HIGH ABSORPTION RANGE';
    let desc = 'Accumulated order depths cushion against clean breakouts. Price oscillates predictably back to standard median levels.';
    let sizeCoefficient = 1.35;
    let confidence = 85;

    if (ratio >= 1.25) {
      regime = 'Trending';
      label = 'MOMENTUM VELOCITY BIAS';
      desc = 'Volatility outpaces available liquidity depth, clearing order books. Aggressive impulses are generating persistent trend breakouts.';
      sizeCoefficient = 0.65;
      confidence = Math.min(99, Math.round(70 + (ratio * 12)));
    } else if (ratio < 0.6) {
      regime = 'Mean-Reverting';
      label = 'COMPRESSED CONGESTION REGIME';
      desc = 'Extremely quiet ATR. Highly compressed price levels holding within narrow bands. Scalping / grid strategies highly suitable.';
      sizeCoefficient = 1.10;
      confidence = Math.round(92 - (ratio * 15));
    }

    return {
      vol,
      volume,
      ratio,
      regime,
      label,
      desc,
      sizeCoefficient,
      confidence,
      volMethod,
      volumeMethod
    };
  }, [useLiveMetrics, manualVolatility, manualVolume, symbol, metrics]);

  // 1. LIQUIDITY SWEEP levels list generator based on asset
  const liquidityZones = useMemo(() => {
    const price = metrics.currentPrice;
    const atr = metrics.atr;
    
    // Create systematic liquidity zones based on ATR steps
    return [
      {
        id: 'pdh',
        name: 'Prior Day High (PDH)',
        level: price + atr * 1.25,
        type: 'BUY_SIDE' as const,
        status: 'Unmitigated' as const,
        poolSize: 'High (Liquidity Pool)',
        imbalance: 62,
      },
      {
        id: 'pdl',
        name: 'Prior Day Low (PDL)',
        level: price - atr * 1.4,
        type: 'SELL_SIDE' as const,
        status: 'Mitigated' as const,
        poolSize: 'Depleted (prior sweep confirmed)',
        imbalance: 89,
      },
      {
        id: 'london-h',
        name: 'London Session Session High',
        level: price + atr * 0.65,
        type: 'BUY_SIDE' as const,
        status: 'Unmitigated' as const,
        poolSize: 'Medium (Buy-side stops)',
        imbalance: 44,
      },
      {
        id: 'ny-l',
        name: 'NY Opening NY Low (NYL)',
        level: price - atr * 0.95,
        type: 'SELL_SIDE' as const,
        status: 'Unmitigated' as const,
        poolSize: 'High (Sell-side stops)',
        imbalance: 78,
      },
    ];
  }, [metrics.currentPrice, metrics.atr]);

  // Compute live H4/Daily Candle Closes institutional metrics
  const htfBiasAnalysis = useMemo(() => {
    const price = metrics.currentPrice;
    const rsi = metrics.rsi;
    const atr = metrics.atr;
    const trend = metrics.trend;

    // Simulate standard H4 & Daily close levels based on ATR
    const h4Close = price - atr * 0.15;
    const dailyClose = price + atr * 0.25;
    
    // Premium / Discount calculation (H4 Range)
    const rangeHigh = price + atr * 1.5;
    const rangeLow = price - atr * 1.5;
    const eqLevel = (rangeHigh + rangeLow) / 2;
    const isPremium = price > eqLevel;

    // Dynamic Accumulation or Distribution Bias based on RSI/Trend
    let h4Bias: 'ACCUMULATION' | 'DISTRIBUTION' | 'MITIGATION' = 'MITIGATION';
    let dailyBias: 'ACCUMULATION' | 'DISTRIBUTION' | 'MITIGATION' = 'MITIGATION';
    
    if (rsi < 45) {
      h4Bias = 'ACCUMULATION';
    } else if (rsi > 55) {
      h4Bias = 'DISTRIBUTION';
    }

    if (trend === 'BULLISH' && rsi < 60) {
      dailyBias = 'ACCUMULATION';
    } else if (trend === 'BEARISH' || rsi >= 60) {
      dailyBias = 'DISTRIBUTION';
    }

    const h4VolumeDelta = rsi < 45 ? '+18.4% (Absorption)' : rsi > 55 ? '-22.1% (Selling Imbalance)' : '+2.5% (Symmetric)';
    const dailyVolumeDelta = trend === 'BULLISH' ? '+34.8% (Strong Passive Bid)' : '-29.4% (Supply Sweep)';

    return {
      h4Close,
      dailyClose,
      rangeHigh,
      rangeLow,
      eqLevel,
      isPremium,
      h4Bias,
      dailyBias,
      h4VolumeDelta,
      dailyVolumeDelta,
      riskMultiplierAdjustedBuffer: atr * selectedIntegrationWeight
    };
  }, [metrics, selectedIntegrationWeight]);

  // Dynamic historical session bias timeline
  const historicalBiasTimeline = useMemo(() => {
    const price = metrics.currentPrice;
    const isCrypto = symbol.includes('USDT');
    const isGold = symbol.includes('GOLD') || symbol.includes('SILVER');
    const multiplier = isCrypto ? 1200 : isGold ? 12 : 0.0045;
    
    return [
      {
        id: 'h-24',
        label: 'T-24h (Yesterday Close)',
        timeString: '24 hours ago',
        price: price - multiplier * 1.8,
        bias: 'ACCUMULATION' as const,
        flowSentiment: 82, // percentage of institutional buy flow
        volumeDelta: '+32.4% Block Inflow',
        outcome: 'Triggered sequential sweeps of prior session lows. Followed by a strong +45 pip breakout reversal.',
        confluenceAlert: 'Smart Money Re-accumulation Zone Confirmed'
      },
      {
        id: 'h-18',
        label: 'T-18h (London Open)',
        timeString: '18 hours ago',
        price: price - multiplier * 0.9,
        bias: 'ACCUMULATION' as const,
        flowSentiment: 69,
        volumeDelta: '+18.1% Absorption Support',
        outcome: 'Price consolidated above equilibrium median. Buy stops holding at London high remain unmitigated.',
        confluenceAlert: 'Passive limit buy pool absorbing sellers.'
      },
      {
        id: 'h-12',
        label: 'T-12h (NY AM Session)',
        timeString: '12 hours ago',
        price: price + multiplier * 1.2,
        bias: 'DISTRIBUTION' as const,
        flowSentiment: 28,
        volumeDelta: '-41.5% Imbalance Drop',
        outcome: 'Price swept session high and matched PDH. Institutional block orders triggered heavy market selling.',
        confluenceAlert: 'Overbought Distribution block hit.'
      },
      {
        id: 'h-6',
        label: 'T-6h (London Close)',
        timeString: '6 hours ago',
        price: price + multiplier * 0.4,
        bias: 'NEUTRAL' as const,
        flowSentiment: 48,
        volumeDelta: '+2.1% Symmetric Flows',
        outcome: 'Sideways coiling into standard deviation bands. Liquidity absorbed at the center of gravity.',
        confluenceAlert: 'Standard Mean-Reverting capital cycle.'
      },
      {
        id: 'h-1',
        label: 'T-1h (Prev Hour Close)',
        timeString: '1 hour ago',
        price: price - multiplier * 0.2,
        bias: 'ACCUMULATION' as const,
        flowSentiment: 64,
        volumeDelta: '+14.8% Active Absorption',
        outcome: 'Bounced off the NY Low. Unmitigated sell-side stops fully completed.',
        confluenceAlert: 'Local support consolidation block.'
      },
      {
        id: 'live',
        label: 'LIVE (Current Session)',
        timeString: 'Active Live Feed',
        price: price,
        bias: htfBiasAnalysis.h4Bias,
        flowSentiment: htfBiasAnalysis.h4Bias === 'ACCUMULATION' ? 76 : htfBiasAnalysis.h4Bias === 'DISTRIBUTION' ? 24 : 50,
        volumeDelta: htfBiasAnalysis.h4Bias === 'ACCUMULATION' ? htfBiasAnalysis.h4VolumeDelta : htfBiasAnalysis.dailyVolumeDelta,
        outcome: 'Current active trading block. Correlating live order flows with continuous validation.',
        confluenceAlert: 'Dynamic Oracle scanning for anomalies.'
      }
    ];
  }, [metrics.currentPrice, symbol, htfBiasAnalysis]);

  // Dynamic calculated scores for the 4 pillars
  // Heuristic 1: Liquidity Imbalance index
  const liquidityMetrics = useMemo(() => {
    const unmitigatedCount = liquidityZones.filter(z => z.status === 'Unmitigated').length;
    const totalImbalance = liquidityZones.reduce((sum, z) => sum + z.imbalance, 0) / liquidityZones.length;
    return {
      unmitigatedCount,
      totalImbalance,
      biasSignal: totalImbalance > 60 ? 'IMBALANCE EXTENSION' : 'MEAN STABILITY',
    };
  }, [liquidityZones]);

  // Heuristic 2: Dynamic Regime shock index Calculation
  // Combine ATR, RSI, Trends to output a "Regime Profile"
  const regimeProfile = useMemo(() => {
    const rsi = metrics.rsi;
    const isBull = metrics.trend === 'BULLISH';
    const isBear = metrics.trend === 'BEARISH';
    
    // Compute shock index (0 - 100)
    let score = 50;
    if (rsi > 70 || rsi < 30) {
      score += 20;
    }
    if (metrics.trend !== 'NEUTRAL') {
      score += 15;
    }
    // Add manual nudge factor
    score = Math.min(100, Math.max(0, score + selectedRegimeRef));

    let type: 'MEAN REVERTING' | 'VOLATILITY TREND RUN' | 'CONGESTION SQUEEZE' = 'MEAN REVERTING';
    let description = 'Price is contained within standard daily deviation bands. Liquidity is being extracted from the center of gravity.';
    let recommendations = 'Prefer Limit Orders. Avoid chasing breakouts. Strategy target: 1-1.5% profit takers.';
    let indicatorCss = 'text-amber-400 border-amber-500/30 bg-amber-500/5';

    if (score > 75) {
      type = 'VOLATILITY TREND RUN' as const;
      description = 'Aggressive institutional force and directional trend expansion. Liquidity pools are being cleared sequentially.';
      recommendations = 'Prefer Market Orders / Trailing bracket stops. Capitalize on momentum continuation.';
      indicatorCss = 'text-rose-400 border-rose-500/30 bg-rose-500/5';
    } else if (score < 35) {
      type = 'CONGESTION SQUEEZE' as const;
      description = 'Coil phase. Order book depth is highly balanced with compressed ATR bands. A big expansion is brewing.';
      recommendations = 'Set Breakout trigger limits on PDH/PDL bounds. Maintain dry powder.';
      indicatorCss = 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5';
    }

    return {
      score,
      type,
      description,
      recommendations,
      indicatorCss,
    };
  }, [metrics.rsi, metrics.trend, selectedRegimeRef]);

  // Heuristic 3: Cross-Asset Macro Correlation (DXY, SPX, Bonds)
  // Generates alignment index of macro confluence
  const intermarketSynergy = useMemo(() => {
    const bias = metrics.dailyBias;
    const isBullish = bias === 'BULLISH';
    
    // Create detailed intermarket indicators depending on current symbol
    let dxyBias = isBullish ? 'DOWNWARD BIAS' : 'UPWARD BIAS';
    let macroConfluencePct = 78;
    let crossAssetStatus = 'SYMMETRIC CONFLUENTIAL' as const;
    let reason = 'Global dollar liquidity flows are negative, supporting upward movements and capital expansion.';

    if (symbol === 'USD/JPY') {
      dxyBias = isBullish ? 'UPWARD BIAS' : 'DOWNWARD BIAS';
      macroConfluencePct = 84;
      reason = 'Yield spread expansions confirm safe-haven flight and strong DXY correlation alignment.';
    } else if (symbol === 'BTC/USDT' || symbol === 'ETH/USDT' || symbol === 'SOL/USDT') {
      dxyBias = 'DXY LIQUIDITY CAPTURE';
      macroConfluencePct = 91;
      reason = 'Risk-on indices (SPX/NDX) are in breakout continuation zones, driving smart-contract bid accumulation.';
    } else if (symbol === 'EUR/GBP' || symbol === 'EUR/USD' || symbol === 'GBP/USD') {
      macroConfluencePct = 72;
      reason = 'ECB and BOE central bank rate differentials remain aligned in an expansionary corridor.';
    }

    // Let the weight affect consistency
    const modifiedConfluence = Math.min(100, Math.round(macroConfluencePct * (1 + (selectedIntegrationWeight - 1) * 0.15)));

    return {
      dxyBias,
      macroConfluencePct: modifiedConfluence,
      crossAssetStatus,
      reason,
    };
  }, [symbol, metrics.dailyBias, selectedIntegrationWeight]);

  // Heuristic 4: Order Block Depth & Invalidation Oracle
  // Advises valid buffers based on ATR & Order book spreads
  const obOracle = useMemo(() => {
    const atr = metrics.atr;
    const price = metrics.currentPrice;
    
    // Invalidation padding recommendations
    const invalidationBuffer = atr * selectedIntegrationWeight;
    const targetSymbolDecimals = symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : symbol === 'GOLD/USD' ? 1 : 4;
    
    return {
      bufferPips: Math.round(invalidationBuffer * (symbol.includes('JPY') ? 100 : symbol.includes('USDT') ? 1 : 10000)),
      recommendedValue: invalidationBuffer,
      lowerBoundInvalidation: price - invalidationBuffer,
      upperBoundInvalidation: price + invalidationBuffer,
      confidenceScore: Math.round(85 + (selectedIntegrationWeight * 5)),
    };
  }, [metrics.atr, metrics.currentPrice, symbol, selectedIntegrationWeight]);

  // Dynamic Intelligence Layer Signal generation based on active Strategy Preset
  const presetSignal = useMemo(() => {
    const price = metrics.currentPrice;
    const atr = metrics.atr;
    const rsi = metrics.rsi;
    const isCrypto = symbol.includes('USDT');
    const isGold = symbol.includes('GOLD') || symbol.includes('SILVER');
    
    const decimalPlaces = isCrypto ? 1 : isGold ? 2 : 4;
    
    if (strategyPreset === 'ICT_2022') {
      const isBullish = rsi < 45;
      const isBearish = rsi > 55;
      
      let signalHeadline = 'LIQUIDITY HUNT (Neutral Accumulation)';
      let badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      let entryZoneText = '';
      let targetZoneText = '';
      let invalidationZoneText = '';
      let description = '';
      let currentPhase = 'SWEPT LIQUIDITY IDENTIFICATION';
      let flowDirection = 'NEUTRAL / DISCONGRUENT';
      
      const oteLower = isBullish ? price - atr * 0.65 : price + atr * 0.35;
      const oteUpper = isBullish ? price - atr * 0.35 : price + atr * 0.65;
      
      const fvgLower = price - atr * 0.15;
      const fvgUpper = price + atr * 0.15;
      
      const stopLossLevel = isBullish ? price - atr * 1.1 * selectedIntegrationWeight : price + atr * 1.1 * selectedIntegrationWeight;
      
      if (isBullish) {
        signalHeadline = 'BULLISH DISPLACEMENT (MSS CONFIRMED)';
        badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        entryZoneText = `${oteLower.toFixed(decimalPlaces)} - ${oteUpper.toFixed(decimalPlaces)} (Pullback to 62%-79% OTE fib)`;
        targetZoneText = `${(price + atr * 1.55).toFixed(decimalPlaces)} (Prior Day Session High target)`;
        invalidationZoneText = `${stopLossLevel.toFixed(decimalPlaces)} (Below swing low block)`;
        description = 'Prior Day Low (PDL) swept cleanly with significant lower timeframe volume displacement. A Market Structure Shift (MSS) is validated. Recommend buy entries on a steady pullback to optimal trade alignment (OTE) with validation overlays.';
        currentPhase = 'DISPLACEMENT & FVG BUILDUP';
        flowDirection = 'BULLISH REVERSAL FLIGHT';
      } else if (isBearish) {
        signalHeadline = 'BEARISH DISPLACEMENT (MSS CONFIRMED)';
        badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse';
        entryZoneText = `${oteLower.toFixed(decimalPlaces)} - ${oteUpper.toFixed(decimalPlaces)} (Premium retest of unmitigated sellers)`;
        targetZoneText = `${(price - atr * 1.6).toFixed(decimalPlaces)} (Prior Day Session Low stop target)`;
        invalidationZoneText = `${stopLossLevel.toFixed(decimalPlaces)} (Above current swing high)`;
        description = 'Prior Day High (PDH) swept cleanly on high Relative Strength Index thresholds. Dynamic displacement confirms strong downward institutional order flow and the creation of unmitigated fair value gaps. Short on premium retrace.';
        currentPhase = 'FVG RETRACE / MITIGATION SQUEEZE';
        flowDirection = 'BEARISH DIRECTIONAL TRAIL';
      } else {
        entryZoneText = `${fvgLower.toFixed(decimalPlaces)} - ${fvgUpper.toFixed(decimalPlaces)} (Range mid levels)`;
        targetZoneText = `${(price + atr * 1.1).toFixed(decimalPlaces)} (Range highs)`;
        invalidationZoneText = `${stopLossLevel.toFixed(decimalPlaces)}`;
        description = 'Asset price coordinates are coiling within standard daily deviation bands. No direct Market Structure Shift identified. Smart Money is maintaining standard passive bid placements. Limit orders or scalping on range boundaries remains highly suitable.';
      }
      
      return {
        strategyName: 'ICT 2022 Model',
        iconType: 'ICT',
        signalHeadline,
        badgeColor,
        entryZoneText,
        targetZoneText,
        invalidationZoneText,
        description,
        currentPhase,
        flowDirection,
        metricLabel1: 'OTE Fibonacci Array',
        metricValue1: '62% - 79% Optimal',
        metricLabel2: 'Fair Value Gap (FVG)',
        metricValue2: `${fvgLower.toFixed(decimalPlaces)} - ${fvgUpper.toFixed(decimalPlaces)}`
      };
    } else {
      // POWER_OF_3 (AMD)
      const isManipulationLong = rsi < 43;
      const isDistributionShort = rsi > 57;
      
      let signalHeadline = 'ACCUMULATION PHASE (Session Block Squeeze)';
      let badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      let entryZoneText = '';
      let targetZoneText = '';
      let invalidationZoneText = '';
      let description = '';
      let currentPhase = 'ACCUMULATION CONSOLIDATION';
      let flowDirection = 'RANGE-BOUND CONGESTION';
      
      const accLower = price - atr * 0.35;
      const accUpper = price + atr * 0.35;
      
      const judasSwingLevel = price - atr * 0.95;
      const distributionTarget = price + atr * 1.55;
      
      if (isManipulationLong) {
        signalHeadline = 'BULLISH MANIPULATION (Judas Swing Short Trap)';
        badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse';
        entryZoneText = `Buy near ${judasSwingLevel.toFixed(decimalPlaces)} (Capture liquidity below accumulation base)`;
        targetZoneText = `${distributionTarget.toFixed(decimalPlaces)} (Distribution expansion projection)`;
        invalidationZoneText = `${(price - atr * 1.5).toFixed(decimalPlaces)} (Standard limit breach boundary)`;
        description = 'Power of 3 AMD sequence matches: Yesterday close accumulation range has been swept by a high velocity Judas swing downward. Institutional buyers are absorbing the retail-dump volume with passive limit bid traps. High confidence long reversal.';
        currentPhase = 'MANIPULATION DISPLACEMENT PHASE';
        flowDirection = 'INSTITUTIONAL ACCUMULATION INTAKE';
      } else if (isDistributionShort) {
        signalHeadline = 'DISTRIBUTION CYCLE (Peak Session Expansion)';
        badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        entryZoneText = `Sell / Take profits above ${(price + atr * 0.9).toFixed(decimalPlaces)} (Premium distribution high)`;
        targetZoneText = `${(price - atr * 1.45).toFixed(decimalPlaces)} (Re-accumulation low target)`;
        invalidationZoneText = `${(price + atr * 1.85).toFixed(decimalPlaces)} (Extreme high breakout limit)`;
        description = 'Power of 3 sequence indicates expansion phase is fully exhausted. Momentum is distributing at session premium limits. Extreme buy-stop vacuum in progress. Scaling down long positions and establishing structured trend short limits is optimal.';
        currentPhase = 'SESSION EXPANSION / DISTRIBUTION';
        flowDirection = 'DISTRIBUTION / TRANSFER ZONE';
      } else {
        entryZoneText = `${accLower.toFixed(decimalPlaces)} - ${accUpper.toFixed(decimalPlaces)} (Accumulation Range)`;
        targetZoneText = `${(price + atr * 1.15).toFixed(decimalPlaces)} (Judas swing projection)`;
        invalidationZoneText = `${(price - atr * 0.85).toFixed(decimalPlaces)}`;
        description = 'Session is coiling inside the original initial balance accumulation box. Open depth volume is symmetrical. Standard market makers are providing depth on both bid/ask levels. Setup limit orders on prior low/high manipulation limits.';
      }
      
      return {
        strategyName: 'Power of 3 (AMD)',
        iconType: 'PO3',
        signalHeadline,
        badgeColor,
        entryZoneText,
        targetZoneText,
        invalidationZoneText,
        description,
        currentPhase,
        flowDirection,
        metricLabel1: 'Accumulation Box Median',
        metricValue1: `${price.toFixed(decimalPlaces)}`,
        metricLabel2: 'Judas Sweep Bounds',
        metricValue2: `-${(atr * 0.95).toFixed(decimalPlaces)} USD/PIP`
      };
    }
  }, [strategyPreset, metrics, symbol, selectedIntegrationWeight]);

  return (
    <div id="analytic-desk-intelligence-root" className="bg-[#0a0a0b] border border-white/5 p-5 md:p-6 rounded-lg select-none">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-md bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-white font-mono">
                MTX PRO ANALYTIC DESK INTELLIGENCE
              </h3>
              <span className="text-[8px] font-mono font-black text-rose-400 border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 rounded animate-pulse">
                LIVE HEURISTICS
              </span>
            </div>
            <p className="text-[10px] text-white/35 mt-0.5">Four-tiered institutional analytic engine. Aligned to the MTXQUANT skeleton blueprint.</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Trade Strategy Preset Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#050506] border border-white/5 rounded px-2.5 py-1">
            <span className="text-[8px] font-mono text-white/30 uppercase font-black">Strategy Preset:</span>
            <select
              id="trade-strategy-preset-select"
              value={strategyPreset}
              onChange={(e) => setStrategyPreset(e.target.value as 'ICT_2022' | 'POWER_OF_3')}
              className="bg-transparent text-[9.5px] font-mono font-bold text-indigo-400 border-none outline-none focus:ring-0 cursor-pointer p-0 pr-4"
              style={{ colorScheme: 'dark' }}
            >
              <option value="ICT_2022" className="bg-[#0b0b0d] text-indigo-400">ICT 2022 Model</option>
              <option value="POWER_OF_3" className="bg-[#0b0b0d] text-indigo-400">Power of 3 (PO3)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#050506] border border-white/5 rounded px-2.5 py-1">
            <span className="text-[8px] font-mono text-white/30 uppercase font-black">Weight Control:</span>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.1" 
              value={selectedIntegrationWeight}
              onChange={(e) => setSelectedIntegrationWeight(parseFloat(e.target.value))}
              className="w-16 h-1 accent-indigo-500 focus:outline-none cursor-ew-resize bg-neutral-700 rounded-sm"
              title="Adjusts dynamic ATR risk multiplier factors for recommendations"
            />
            <span className="text-[9px] font-mono text-indigo-305 font-bold">{selectedIntegrationWeight.toFixed(1)}x ATR</span>
          </div>

          <button
            onClick={() => setShowHeuristicsInfo(prev => !prev)}
            className="p-1 px-2.5 bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 rounded text-[9.5px] font-mono font-bold text-white/40 hover:text-white/80 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Logic Info</span>
          </button>
        </div>
      </div>

      {/* Logic Information Block */}
      {showHeuristicsInfo && (
        <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-lg text-white/75 text-[10.5px] font-sans leading-relaxed mb-5 animate-fadeIn space-y-2">
          <div className="font-bold font-mono text-indigo-300 text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-4 h-4" /> Analytic Desk Core Logic Blueprint
          </div>
          <p>
            The MTX Modern Analytic Desk operates on a 4-Tier structured safety & trend architecture. Each block models live system variables to identify anomalies, protect from volatile liquidity stops, and classify market paradigms with zero guessing games.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[10px] font-mono">
            <div>
              <strong className="text-white">PDH/PDL Sweep Map:</strong> Evaluates unmitigated session highs where institutional order flow holds major buy/sell stop liquidity pools ready to trigger sweeps.
            </div>
            <div>
              <strong className="text-white">Regime Classifier:</strong> Combines real-time volatility thresholds with depth spreads to determine whether momentum is distributing or coiling.
            </div>
            <div>
              <strong className="text-white">Macro Correlation:</strong> Maps global dollar trends and yields directly to the chosen symbol to confirm cross-asset fundamental support.
            </div>
            <div>
              <strong className="text-white">OB Invalidation Oracle:</strong> Optimizes stop buffers according to current ATR size, ensuring trading parameters survive standard noise.
            </div>
          </div>
        </div>
      )}

      {/* Logic Information Block */}
      {showHeuristicsInfo && (
        <div className="bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-lg text-white/75 text-[10.5px] font-sans leading-relaxed mb-5 animate-fadeIn space-y-2">
          <div className="font-bold font-mono text-indigo-300 text-[11px] uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-4 h-4" /> Analytic Desk Core Logic Blueprint
          </div>
          <p>
            The MTX Modern Analytic Desk operates on a 4-Tier structured safety & trend architecture. Each block models live system variables to identify anomalies, protect from volatile liquidity stops, and classify market paradigms with zero guessing games.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[10px] font-mono">
            <div>
              <strong className="text-white">PDH/PDL Sweep Map:</strong> Evaluates unmitigated session highs where institutional order flow holds major buy/sell stop liquidity pools ready to trigger sweeps.
            </div>
            <div>
              <strong className="text-white">Regime Classifier:</strong> Combines real-time volatility thresholds with depth spreads to determine whether momentum is distributing or coiling.
            </div>
            <div>
              <strong className="text-white">Macro Correlation:</strong> Maps global dollar trends and yields directly to the chosen symbol to confirm cross-asset fundamental support.
            </div>
            <div>
              <strong className="text-white">OB Invalidation Oracle:</strong> Optimizes stop buffers according to current ATR size, ensuring trading parameters survive standard noise.
            </div>
          </div>
        </div>
      )}

      {/* INSTITUTIONAL BIAS FILTER (H4 & DAILY CLOSES PROCESSOR) */}
      <div id="institutional-bias-filter-block" className="bg-[#0b0b0d] border border-white/5 rounded-lg p-4 mb-6 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-white">
                Institutional Bias Filter Desk
              </span>
              <span className="text-[9px] text-white/30 block">Live HTF candle closes & order-flow absorption delta analysis</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#050506]/90 border border-white/5 rounded-md">
            <button
              id="bias-btn-combined"
              onClick={() => setTimeframeBiasFilter('COMBINED')}
              className={`px-2 py-1 text-[8.5px] font-bold rounded transition-colors ${
                timeframeBiasFilter === 'COMBINED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              COMBINED CONFLUENCE
            </button>
            <button
              id="bias-btn-h4"
              onClick={() => setTimeframeBiasFilter('H4')}
              className={`px-2 py-1 text-[8.5px] font-bold rounded transition-colors ${
                timeframeBiasFilter === 'H4'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              H4 CANDLES
            </button>
            <button
              id="bias-btn-daily"
              onClick={() => setTimeframeBiasFilter('DAILY')}
              className={`px-2 py-1 text-[8.5px] font-bold rounded transition-colors ${
                timeframeBiasFilter === 'DAILY'
                  ? 'bg-[#a855f7]/10 text-[#c084fc] border border-[#a855f7]/20'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              DAILY CANDLES
            </button>
          </div>
        </div>

        {/* Dynamic Display of processed Candle Closes based on filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Metric Panel */}
          <div className="bg-[#050506] border border-white/5 p-3 rounded space-y-2">
            <span className="text-[8px] text-white/30 uppercase font-black block tracking-wider">Processed Closed Flow Bias:</span>
            
            {timeframeBiasFilter === 'COMBINED' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-white">CONFLUENCE BIAS</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                    htfBiasAnalysis.h4Bias === 'ACCUMULATION' && htfBiasAnalysis.dailyBias === 'ACCUMULATION'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : htfBiasAnalysis.h4Bias === 'DISTRIBUTION' || htfBiasAnalysis.dailyBias === 'DISTRIBUTION'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {htfBiasAnalysis.h4Bias === htfBiasAnalysis.dailyBias ? htfBiasAnalysis.h4Bias : 'MITIGATION MIXED'}
                  </span>
                </div>
                <p className="text-[9.5px] text-white/50 leading-relaxed font-sans mt-1">
                  Both multi-hour and full daily settlement intervals have been compiled. Current layout suggests smart money is 
                  {htfBiasAnalysis.h4Bias === 'ACCUMULATION' ? ' absorbing bids at discount boundaries.' : ' distributing risk into overbought high liquidity.'}
                </p>
              </div>
            )}

            {timeframeBiasFilter === 'H4' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-indigo-400">H4 CLOSE REGIME</span>
                  <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded ${
                    htfBiasAnalysis.h4Bias === 'ACCUMULATION' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {htfBiasAnalysis.h4Bias}
                  </span>
                </div>
                <div className="text-[9px] text-white/50 space-y-1">
                  <div className="flex justify-between"><span>Last H4 Close:</span><strong className="text-white">{htfBiasAnalysis.h4Close.toFixed(symbol.includes('JPY') ? 2 : symbol.includes('USDT') ? 0 : 4)}</strong></div>
                  <div className="flex justify-between"><span>Absorption Delta:</span><span className="text-emerald-400">{htfBiasAnalysis.h4VolumeDelta}</span></div>
                </div>
              </div>
            )}

            {timeframeBiasFilter === 'DAILY' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[#c084fc]">DAILY TIMEFRAME</span>
                  <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded ${
                    htfBiasAnalysis.dailyBias === 'ACCUMULATION' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {htfBiasAnalysis.dailyBias}
                  </span>
                </div>
                <div className="text-[9px] text-white/50 space-y-1">
                  <div className="flex justify-between"><span>Daily Settlement:</span><strong className="text-white">{htfBiasAnalysis.dailyClose.toFixed(symbol.includes('JPY') ? 2 : symbol.includes('USDT') ? 0 : 4)}</strong></div>
                  <div className="flex justify-between"><span>High-Timeframe Delta:</span><span className="text-purple-400 font-bold">{htfBiasAnalysis.dailyVolumeDelta}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Premium vs Discount locator mapping */}
          <div className="bg-[#050506] border border-white/5 p-3 rounded space-y-2">
            <span className="text-[8px] text-white/30 uppercase font-black block tracking-wider">Premium vs Discount Range Mappings:</span>
            
            <div className="space-y-1 bg-white/[0.01] border border-white/[0.04] p-2 rounded">
              <div className="flex justify-between text-[9px]">
                <span className="text-white/40">Range High:</span>
                <span className="text-slate-200 font-bold">{htfBiasAnalysis.rangeHigh.toFixed(symbol.includes('JPY') ? 2 : symbol.includes('USDT') ? 0 : 4)}</span>
              </div>
              <div className="flex justify-between text-[9px] text-emerald-400/80">
                <span>Equilibrium Median (50%):</span>
                <span>{htfBiasAnalysis.eqLevel.toFixed(symbol.includes('JPY') ? 2 : symbol.includes('USDT') ? 0 : 4)}</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-white/40">Range Low:</span>
                <span className="text-slate-200 font-bold">{htfBiasAnalysis.rangeLow.toFixed(symbol.includes('JPY') ? 2 : symbol.includes('USDT') ? 0 : 4)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] pt-0.5">
              <span className="text-white/30">Asset Location status:</span>
              <span className={`font-black uppercase px-1.5 py-0.5 rounded ${
                htfBiasAnalysis.isPremium ? 'text-amber-400 bg-amber-500/5 border border-amber-500/10' : 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10'
              }`}>
                {htfBiasAnalysis.isPremium ? 'PREMIUM (Sellers Dominant / Distributing)' : 'DISCOUNT (Highly Undervalued / Accumulating)'}
              </span>
            </div>
          </div>

          {/* Forward integration instruction with Copilot note */}
          <div className="bg-[#050506] border border-white/5 p-3 rounded flex flex-col justify-between">
            <div>
              <span className="text-[8px] text-emerald-400 uppercase font-black tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" />
                MTX Engine Feedback loop
              </span>
              <p className="text-[9.5px] text-white/50 leading-relaxed font-sans mt-1.5">
                These dynamic close levels feed directly into the <strong className="text-indigo-400 text-[9px]">MTX Draft Engine API</strong> to determine target ranges, protect Stop Loss bounds, and filter entry triggers.
              </p>
            </div>
            <div className="text-[8px] text-white/30 pt-2 border-t border-white/[0.04] mt-1">
              Active HTF Bias: <strong className="text-emerald-400">{htfBiasAnalysis.h4Bias}</strong> ({htfBiasAnalysis.isPremium ? 'Premium' : 'Discount'})
            </div>
          </div>
        </div>
      </div>

      {/* HISTORICAL SENTIMENT CHRONICLE & SCENARIO SCRUBBER */}
      <div id="historical-sentiment-chronicle-block" className="bg-[#0b0b0d] border border-white/5 rounded-lg p-4 md:p-5 mb-6 font-mono select-none">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-[#a855f7]">
                Sentinel Chronology: Historical Bias Tracker
              </span>
              <span className="text-[9px] text-white/35 block font-sans">Scrub through prior sentiment gauges to correlate institutional flows with actual price action waves</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[9px] text-white/40">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
            <span>PLAYBACK SYNCHRONIZED</span>
          </div>
        </div>

        {/* The Timeline Scrubber Track */}
        <div className="bg-[#050506] p-4 border border-white/5 rounded-lg space-y-4 mb-5">
          <div className="flex justify-between items-center text-[9px] text-white/50">
            <span>SCRUB CHRONOLOGY TIMELINE:</span>
            <span className="text-indigo-300 font-extrabold font-mono uppercase tracking-widest text-right">
              Selected: {historicalBiasTimeline[selectedHistoryIndex]?.label || ''}
            </span>
          </div>

          {/* Sizing Slider Track */}
          <div className="relative pt-2 pb-1 px-1">
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={selectedHistoryIndex}
              onChange={(e) => setSelectedHistoryIndex(parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#a855f7] focus:outline-none"
              title="Drag slider to scrub through past institutional bias intervals"
            />
            
            {/* Tick labels */}
            <div className="flex justify-between mt-2.5 text-[8.5px] font-bold text-white/30">
              {historicalBiasTimeline.map((item, idx) => {
                const isActive = selectedHistoryIndex === idx;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedHistoryIndex(idx)}
                    className={`hover:text-white transition-colors cursor-pointer text-[8px] sm:text-[9.5px] ${
                      isActive ? 'text-[#a855f7] font-black' : ''
                    }`}
                  >
                    <span className="block text-center">{idx === 5 ? 'LIVE' : `T-${24 - idx * 4.8}h`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Chronology Data Detail Panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Left panel: Active Gauge & Sentiment Metrics */}
          <div className="md:col-span-4 bg-[#050506] border border-white/5 p-4 rounded-lg flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[8px] text-white/30 uppercase font-black block tracking-wider">Historical Sentiment Metric:</span>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-[12px] font-black text-white uppercase font-sans">
                  {historicalBiasTimeline[selectedHistoryIndex]?.label || ''}
                </span>
                <span className="text-[9.5px] font-mono text-white/30">
                  {historicalBiasTimeline[selectedHistoryIndex]?.timeString || ''}
                </span>
              </div>

              {/* Sentiment value circular representation / gauge */}
              <div className="flex flex-col items-center justify-center py-4 bg-white/[0.01] border border-white/[0.04] rounded-md my-3 relative overflow-hidden">
                <div className="text-[28px] font-black text-white leading-none font-mono">
                  {historicalBiasTimeline[selectedHistoryIndex]?.flowSentiment || 50}%
                </div>
                <div className="text-[8.5px] text-white/40 uppercase tracking-widest font-black mt-1.5">
                  INST BUY-PRESSURE FLOW
                </div>

                {/* Micro trend trend tag bar */}
                <div className="w-full h-1 bg-neutral-900 absolute bottom-0 left-0 right-0">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      (historicalBiasTimeline[selectedHistoryIndex]?.flowSentiment || 50) > 60 
                        ? 'bg-emerald-500' 
                        : (historicalBiasTimeline[selectedHistoryIndex]?.flowSentiment || 50) < 40 
                          ? 'bg-rose-500' 
                          : 'bg-indigo-500'
                    }`} 
                    style={{ width: `${historicalBiasTimeline[selectedHistoryIndex]?.flowSentiment || 50}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-white/30">HISTORICAL BIAS:</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                  historicalBiasTimeline[selectedHistoryIndex]?.bias === 'ACCUMULATION' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                    : historicalBiasTimeline[selectedHistoryIndex]?.bias === 'DISTRIBUTION'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}>
                  {historicalBiasTimeline[selectedHistoryIndex]?.bias || 'NEUTRAL'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-white/30">HISTORIC SPOT PRICE:</span>
                <strong className="text-[#38bdf8] font-mono font-black">
                  {historicalBiasTimeline[selectedHistoryIndex]?.price.toFixed(symbol.includes('JPY') ? 2 : symbol.includes('USDT') ? 0 : 5) || ''}
                </strong>
              </div>
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-white/30">VOLUME FLOW STATE:</span>
                <span className="text-white/70">{historicalBiasTimeline[selectedHistoryIndex]?.volumeDelta || ''}</span>
              </div>
            </div>

          </div>

          {/* Right panel: Live Price Action Correlation Graph Simulator */}
          <div className="md:col-span-8 bg-[#050506] border border-white/5 p-4 rounded-lg flex flex-col justify-between space-y-4">
            
            {/* Spark Alignment line visual mockup representation using clean HTML divs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[8px] text-white/30 uppercase tracking-wider font-black">
                <span>Timeline Correlation Align Map:</span>
                <span>price action outcome correlation</span>
              </div>

              {/* CSS Sparkline Representation */}
              <div className="bg-[#020203] border border-white/5 h-20 rounded p-1.5 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-end justify-between h-12 w-full pt-1">
                  {historicalBiasTimeline.map((item, idx) => {
                    const isActive = selectedHistoryIndex === idx;
                    // Compute a dynamic percentage height for visual representation of price changes
                    const pMax = Math.max(...historicalBiasTimeline.map(h => h.price));
                    const pMin = Math.min(...historicalBiasTimeline.map(h => h.price));
                    const heightPercent = pMax === pMin ? 50 : Math.round(((item.price - pMin) / (pMax - pMin)) * 80) + 10;
                    
                    return (
                      <div key={item.id} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        {/* Connecting line marker */}
                        <div 
                          className={`w-2.5 rounded-t transition-all duration-300 ${
                            isActive 
                              ? 'bg-gradient-to-t from-indigo-500 to-purple-500 h-full opacity-100 shadow-[0_0_8px_rgba(168,85,247,0.5)]' 
                              : item.bias === 'ACCUMULATION' 
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/40' 
                                : 'bg-rose-500/20 hover:bg-rose-500/40'
                          }`} 
                          style={{ height: `${heightPercent}%` }}
                        />
                        {/* Selected overlay dot */}
                        {isActive && (
                          <span className="absolute -top-1 h-1.5 w-1.5 rounded-full bg-white border border-purple-500 shadow-md animate-ping" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis scale */}
                <div className="flex justify-between text-[7px] text-white/20 border-t border-white/[0.04] pt-1">
                  <span>Yesterday</span>
                  <span>London Open</span>
                  <span>NY Session</span>
                  <span>London Close</span>
                  <span>1h Ago</span>
                  <span className="text-indigo-400">Live</span>
                </div>
              </div>
            </div>

            {/* Price outcome description and explanation */}
            <div className="space-y-2">
              <div className="bg-indigo-950/10 border border-indigo-500/10 p-2.5 rounded">
                <span className="text-[8px] text-indigo-300 font-extrabold block uppercase tracking-widest mb-1">
                  MARKET CORRELATION OUTCOME:
                </span>
                <p className="text-[10px] text-white/70 font-sans leading-relaxed">
                  {historicalBiasTimeline[selectedHistoryIndex]?.outcome || ''}
                </p>
              </div>

              <div className="bg-neutral-900/30 p-2 border border-white/[0.03] rounded text-[8.5px] text-white/35 flex items-center justify-between gap-2 leading-none">
                <span>Correlation Alert: <strong className="text-white/60 font-mono font-bold">{historicalBiasTimeline[selectedHistoryIndex]?.confluenceAlert || ''}</strong></span>
                <span className="text-[8px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1 py-0.5 rounded font-black shrink-0">SENTINEL SCANNER</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MARKET REGIME PREDICTOR */}
      <div id="market-regime-predictor-block" className="bg-[#0b0b0d] border border-white/5 rounded-lg p-4 md:p-5 mb-6 font-mono select-none">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-[#10b981] animate-pulse" />
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-[#10b981]">
                Volatility-to-Volume Ratio: Market Regime Predictor
              </span>
              <span className="text-[9px] text-white/35 block font-sans">
                Real-time liquidity and impulse correlation engine classifying structural trend and range fatigue
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-[9px] text-[#10b981] font-bold">
              <input
                type="checkbox"
                checked={useLiveMetrics}
                onChange={(e) => setUseLiveMetrics(e.target.checked)}
                className="rounded bg-neutral-950 border-white/10 text-emerald-550 focus:ring-0 cursor-pointer h-3 w-3"
              />
              <span>SYNC LIVE MARKET SENSORS</span>
            </label>
          </div>
        </div>

        {/* Dynamic Controls / Interactive Dashboard Sliders */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Controls column */}
          <div className="lg:col-span-4 bg-[#050506] border border-white/5 p-4 rounded-lg space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-[8.5px] text-white/40 uppercase tracking-wider font-extrabold block mb-3">
                REGIME MODULATION INPUTS:
              </span>

              {/* Volatility Input Slider */}
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-white/40 uppercase">VOLATILITY (ATR/IMPLIED):</span>
                  <span className="text-[#10b981] font-extrabold font-mono">{predictionResult.vol} Vol</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  disabled={useLiveMetrics}
                  value={predictionResult.vol}
                  onChange={(e) => setManualVolatility(parseInt(e.target.value))}
                  className={`w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer focus:outline-none ${useLiveMetrics ? 'accent-emerald-700/50 opacity-40 cursor-not-allowed' : 'accent-emerald-400'}`}
                  title={useLiveMetrics ? "Using live asset ATR parameters. Toggle 'Sync Live' to override." : "Drag to change manual volatility level metric"}
                />
                <span className="text-[7.5px] text-white/20 block">{predictionResult.volMethod}</span>
              </div>

              {/* Volume Input Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-white/40 uppercase">VOLUME (ORDER FLOW DEPTH):</span>
                  <span className="text-indigo-400 font-extrabold font-mono">{predictionResult.volume} Vol</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  disabled={useLiveMetrics}
                  value={predictionResult.volume}
                  onChange={(e) => setManualVolume(parseInt(e.target.value))}
                  className={`w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer focus:outline-none ${useLiveMetrics ? 'accent-indigo-700/50 opacity-40 cursor-not-allowed' : 'accent-indigo-400'}`}
                  title={useLiveMetrics ? "Using live order book activity. Toggle 'Sync Live' to override." : "Drag to change manual volume flow rate metric"}
                />
                <span className="text-[7.5px] text-white/20 block">{predictionResult.volumeMethod}</span>
              </div>
            </div>

            {/* Micro-metrics block */}
            <div className="bg-[#0b0b0d] border border-white/[0.04] p-2.5 rounded text-[8.5px] text-white/40 space-y-1.5 font-mono">
              <div className="flex justify-between items-center">
                <span>VOLATILITY:VOLUME RATIO:</span>
                <strong className={`font-mono text-[9.5px] ${predictionResult.ratio >= 1.25 ? 'text-amber-400' : 'text-[#38bdf8]'}`}>
                  {predictionResult.ratio}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span>SYSTEM STATUS CONFIDENCE:</span>
                <span className="text-white/60 font-mono font-bold">{predictionResult.confidence}% matches</span>
              </div>
            </div>
          </div>

          {/* Results column */}
          <div className="lg:col-span-8 bg-[#050506] border border-white/5 p-4 rounded-lg flex flex-col justify-between space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Regime Classification result */}
              <div className="bg-[#0b0b0d] border border-white/5 p-3 rounded">
                <span className="text-[8px] text-white/30 uppercase font-black block tracking-wider mb-2">CLASSIFIED REGIME:</span>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded border ${
                    predictionResult.regime === 'Trending'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20'
                  }`}>
                    {predictionResult.regime}
                  </span>
                  <span className="text-[9px] text-white/30 uppercase font-bold">{predictionResult.label}</span>
                </div>
                
                <p className="text-[9.5px] text-white/50 leading-relaxed font-sans mt-3">
                  {predictionResult.desc}
                </p>
              </div>

              {/* Trade Sizing advice segment */}
              <div className="bg-[#0b0b0d] border border-white/5 p-3 rounded flex flex-col justify-between">
                <div>
                  <span className="text-[8px] text-emerald-400 uppercase font-black tracking-wider flex items-center gap-1">
                    <Percent className="w-3 h-3 text-emerald-400" />
                    SUGGESTED TRADE SIZING
                  </span>
                  
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-white font-mono">{predictionResult.sizeCoefficient}x</span>
                    <span className="text-[9px] text-[#10b981] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded">
                      COEFFICIENT RATIO
                    </span>
                  </div>

                  <p className="text-[9px] text-white/40 font-sans leading-relaxed mt-2 select-none">
                    {predictionResult.regime === 'Trending'
                      ? 'Volatility outpaces liquidity depth. Recommend reduced position sizes with wider Stop Losses to counter swift institutional spikes.'
                      : 'Highly stable absorption waves. Safe to scale up entry limits to extract higher range boundary profits with minimal slippage risk.'}
                  </p>
                </div>

                <div className="text-[8px] text-white/35 pt-2 border-t border-white/[0.04] mt-3 flex justify-between items-center">
                  <span>ATR-SPREAD RATIO MATCHED</span>
                  <span className="text-[#10b981] font-bold">STABILITY OPTIMIZED</span>
                </div>
              </div>

            </div>

            {/* Sizing impact note */}
            <div className="bg-indigo-950/10 border border-indigo-500/10 p-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[9.5px]">
              <span className="text-white/70 leading-relaxed font-sans">
                <strong className="text-indigo-300">Sizing Advisory:</strong> Applying this sizing coefficient directly handles portfolio equity allocation risk. For highly balanced trading desks, use <strong className="text-white">{predictionResult.sizeCoefficient}x</strong> of your standard base lot size.
              </span>
              <button
                type="button"
                className="bg-indigo-505 hover:bg-neutral-800 hover:text-white font-extrabold border border-indigo-500/30 text-indigo-300 hover:border-indigo-500 duration-200 uppercase tracking-wider text-[8px] font-mono px-3 py-1.5 rounded shrink-0 transition-all select-none cursor-pointer"
                onClick={() => {
                  try {
                    localStorage.setItem('apex_dynamic_sizing_coefficient', String(predictionResult.sizeCoefficient));
                    // Alert replacement safe
                    console.log(`Trade sizing coefficient ${predictionResult.sizeCoefficient}x successfully applied!`);
                  } catch {}
                }}
              >
                APPLY SIZING COEFFICIENT
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* DYNAMIC VOLATILITY-ADJUSTED STOP LOSS ADVISER PANEL (INTEGRATED) */}
      <div id="volatility-stop-loss-adviser" className="bg-[#0b0b0d] border border-white/5 rounded-lg p-5 mb-6 font-mono select-none">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/[0.04] pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 block">
                ATR Volatility-Adjusted Stop Loss Advisor
              </span>
              <span className="text-[9px] text-white/35 block font-sans mt-0.5">
                Calculates dynamic, volatility-appropriate stop-loss levels aligned to live market ATR cushions.
              </span>
            </div>
          </div>

          {/* Quick interactive controls for SL Adviser */}
          <div className="flex flex-wrap items-center gap-3 text-[9.5px]">
            {/* Symbol Filtering Toggle */}
            <div className="flex items-center bg-black/40 rounded border border-white/5 p-1">
              <button 
                type="button"
                onClick={() => setSlShowAllSymbols(true)}
                className={`px-2 py-1 rounded text-[8.5px] transition-all cursor-pointer ${slShowAllSymbols ? 'bg-indigo-600 font-bold text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                All Symbols ({trades.filter(t => t.status === 'OPEN').length})
              </button>
              <button 
                type="button"
                onClick={() => setSlShowAllSymbols(false)}
                className={`px-2 py-1 rounded text-[8.5px] transition-all cursor-pointer ${!slShowAllSymbols ? 'bg-indigo-600 font-bold text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                {symbol} Only ({trades.filter(t => t.status === 'OPEN' && t.symbol === symbol).length})
              </button>
            </div>

            {/* SL Calculation Origin Model */}
            <div className="flex items-center bg-black/40 rounded border border-white/5 p-1">
              <button 
                type="button"
                onClick={() => setSlModel('TRAILING')}
                className={`px-2 py-1 rounded text-[8.5px] transition-all cursor-pointer ${slModel === 'TRAILING' ? 'bg-indigo-600 font-bold text-white' : 'text-white/40 hover:text-white/70'}`}
                title="Skins ATR cushion below CURRENT PRICE to trail profits up"
              >
                Dynamic Trailing
              </button>
              <button 
                type="button"
                onClick={() => setSlModel('FIXED_ENTRY')}
                className={`px-2 py-1 rounded text-[8.5px] transition-all cursor-pointer ${slModel === 'FIXED_ENTRY' ? 'bg-indigo-600 font-bold text-white' : 'text-white/40 hover:text-white/70'}`}
                title="Skins ATR cushion below ENTRY PRICE for locked static risk"
              >
                Fixed Strategic
              </button>
            </div>

            {/* Custom Multipliers */}
            <div className="flex items-center space-x-1 border border-white/5 bg-black/30 p-1 rounded">
              <span className="text-white/30 uppercase tracking-wider text-[8px] mr-1">Multiplier:</span>
              {[1.5, 2.0, 2.5, 3.0].map((m) => (
                <button
                  key={`sl-mult-sel-${m}`}
                  type="button"
                  onClick={() => setSlMultiplier(m)}
                  className={`w-8 py-0.5 rounded text-[8px] transition-all font-mono font-bold cursor-pointer ${slMultiplier === m ? 'bg-indigo-505 border border-indigo-500/30 text-indigo-300 font-black' : 'text-white/30 hover:text-white/60'}`}
                >
                  {m.toFixed(1)}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* OPEN TRADES AND SL COMPUTATIONS TABLE */}
        {slSuggestions.length === 0 ? (
          <div className="bg-[#050506]/55 border border-white/5 rounded-lg p-6 text-center space-y-2 select-none">
            <ShieldAlert className="w-7 h-7 text-white/20 mx-auto" />
            <p className="text-[10px] text-white/50 uppercase tracking-wider">No active positions matching current selection criteria</p>
            <p className="text-[9.5px] text-white/30 font-sans max-w-sm mx-auto">
              Please initialize open positions in the <strong>Trade Execution Terminal</strong> to activate this real-time risk simulation framework.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="hidden lg:grid grid-cols-12 gap-2 text-[8px] text-white/30 uppercase tracking-wider pb-1.5 border-b border-white/[0.04]">
              <div className="col-span-3">Position Context</div>
              <div className="col-span-3">Current Pricing & Limit</div>
              <div className="col-span-4">ATR Cushion SL Recommendation</div>
              <div className="col-span-2 text-right">Risk Action Desk</div>
            </div>

            <div className="space-y-3">
              {slSuggestions.map(({ trade: t, currentPrice, atrValue, proposedSL, currentSLRisk, proposedSLRisk, isSlLockedProfit, lockedProfitAmount, decimals, contractScale }) => {
                const isBuy = t.side === 'BUY';
                const hasStopLoss = t.stopLoss > 0;
                
                // Risk efficiency indicator calculations
                let riskComparisonString = '';
                let isRiskDecreasing = false;
                
                if (!hasStopLoss) {
                  riskComparisonString = 'Secures unmanaged extreme tail-risk';
                  isRiskDecreasing = true;
                } else if (isSlLockedProfit) {
                  riskComparisonString = `Locks in +$${lockedProfitAmount.toFixed(2)} guaranteed PnL`;
                  isRiskDecreasing = true;
                } else {
                  const slDiff = currentSLRisk ? currentSLRisk - proposedSLRisk : 0;
                  if (slDiff > 0) {
                    riskComparisonString = `Reduces loss exposure by $${slDiff.toFixed(2)} (${Math.round((slDiff / currentSLRisk!) * 100)}%)`;
                    isRiskDecreasing = true;
                  } else {
                    riskComparisonString = `Adds $${Math.abs(slDiff).toFixed(2)} volatility cushion spacing`;
                    isRiskDecreasing = false;
                  }
                }

                const displayAtrVal = t.symbol === 'USD/JPY' ? (atrValue * 100).toFixed(1) : t.symbol === 'BTC/USDT' || t.symbol === 'GOLD/USD' ? atrValue.toFixed(1) : (atrValue * 10000).toFixed(1);
                const displayAtrUnit = t.symbol === 'BTC/USDT' || t.symbol === 'GOLD/USD' ? 'USD' : 'pips';

                const isLoading = actionLoading[t.id];
                const isSuccess = actionSuccess[t.id];

                return (
                  <div 
                    key={`sl-adv-row-${t.id}`} 
                    className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center bg-[#050506]/75 border border-white/5 p-3 rounded-lg hover:border-white/10 transition-colors"
                  >
                    {/* Column 1: Position details */}
                    <div className="col-span-1 lg:col-span-3 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border leading-none font-mono ${isBuy ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' : 'bg-rose-500/10 text-rose-450 border-rose-500/20'}`}>
                          {t.side}
                        </span>
                        <span className="text-[10.5px] font-bold text-white font-mono">{t.symbol}</span>
                      </div>
                      <div className="text-[9.5px] font-sans text-white/40">
                        Size: <strong className="text-white font-mono">{t.size} Lots</strong>
                        <span className="text-white/20 mx-1">|</span>
                        PnL: <span className={`font-bold font-mono ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Current pricing & initial limit */}
                    <div className="col-span-1 lg:col-span-3 space-y-1">
                      <div className="text-[9.5px] text-white/70">
                        Entry: <span className="font-mono text-white/50">${t.entryPrice.toLocaleString(undefined, { minimumFractionDigits: decimals })}</span>
                      </div>
                      <div className="text-[10px] text-white/40">
                        Current SL: {hasStopLoss ? (
                          <span className="font-mono text-emerald-300 font-bold bg-[#14532d]/20 border border-emerald-500/20 px-1 py-0.5 rounded">
                            ${t.stopLoss.toLocaleString(undefined, { minimumFractionDigits: decimals })}
                          </span>
                        ) : (
                          <span className="font-mono text-red-400 font-extrabold bg-[#7f1d1d]/30 border border-red-500/20 px-1.5 py-0.5 rounded animate-pulse">
                            ⚠️ UNPROTECTED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column 3: ATR dynamic suggestions */}
                    <div className="col-span-1 lg:col-span-4 space-y-1 bg-black/35 p-2 rounded border border-white/[0.03]">
                      <div className="flex justify-between items-center text-[9.5px]">
                        <span className="text-white/30 text-[8.5px] uppercase">DYNAMIC SL PROPOSAL:</span>
                        <strong className="text-indigo-300 font-extrabold animate-pulse">
                          ${proposedSL.toLocaleString(undefined, { minimumFractionDigits: decimals })}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-[8.5px] pt-1 border-t border-white/5">
                        <span className="text-white/30">Cushion ({slMultiplier}x ATR):</span>
                        <span className="text-white/60 font-mono">
                          {displayAtrVal} {displayAtrUnit}
                        </span>
                      </div>
                      <div className="text-[8.5px] text-white/40 pt-1 flex items-center gap-1 font-sans">
                        <span className={`inline-block w-1 h-1 rounded-full ${isRiskDecreasing ? 'bg-emerald-400' : 'bg-indigo-300'}`} />
                        <span className={isRiskDecreasing ? 'text-emerald-400 font-semibold' : 'text-indigo-350'}>
                          {riskComparisonString}
                        </span>
                      </div>
                    </div>

                    {/* Column 4: Apply Button */}
                    <div className="col-span-1 lg:col-span-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleUpdateParams(t.id, proposedSL)}
                        disabled={isLoading || isSuccess}
                        className={`w-full py-2 px-2.5 rounded border text-[9px] font-bold font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1 ${
                          isSuccess
                            ? 'bg-emerald-600 border-emerald-500 text-white font-extrabold cursor-default'
                            : isLoading
                              ? 'bg-neutral-800 border-neutral-700 text-neutral-400 cursor-not-allowed animate-pulse'
                              : 'bg-indigo-500/10 hover:bg-indigo-600 border-indigo-500/20 hover:border-indigo-500 text-indigo-300 hover:text-white hover:shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                        }`}
                      >
                        {isSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>SL Applied!</span>
                          </>
                        ) : isLoading ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Sliders className="w-3 h-3" />
                            <span>Apply SL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* STRATEGY PRESET INTELLIGENCE LAYER */}
      <div id="strategy-preset-intelligence-panel" className="bg-[#0b0b0d] border border-white/5 rounded-lg p-5 mb-6 font-mono select-none relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/[0.04] pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 block">
                ACTIVE STRATEGY ENGINE: {presetSignal.strategyName}
              </span>
              <span className="text-[9px] text-white/35 block font-sans mt-0.5">
                Automatically adapts the dynamic confluence matrix and real-time order execution bounds based on {presetSignal.strategyName} rules.
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[8px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/45 uppercase tracking-wide">
              Active Template: {presetSignal.strategyName}
            </span>
            <span className="text-[8.5px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md px-2 py-0.5 font-bold">
              SYS OPTIMIZED
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Signal status summary card */}
          <div className="lg:col-span-5 bg-black/40 border border-white/5 p-4 rounded-lg flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[8px] uppercase font-bold text-white/30 block tracking-wider">
                CURRENT INTELLIGENCE SIGNAL:
              </span>
              <div className="mt-2.5">
                <span className={`px-3 py-1.5 rounded-md text-[10.5px] font-black border uppercase tracking-wider block text-center ${presetSignal.badgeColor}`}>
                  {presetSignal.signalHeadline}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-t border-white/5 pt-3 text-[9px]">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-white/30">ENGINE PHASE:</span>
                <span className="text-white font-bold">{presetSignal.currentPhase}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-white/30">ORDER-FLOW BIAS:</span>
                <span className="text-indigo-400 font-bold uppercase">{presetSignal.flowDirection}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-white/30">{presetSignal.metricLabel1}:</span>
                <span className="text-amber-400 font-extrabold">{presetSignal.metricValue1}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-white/30">{presetSignal.metricLabel2}:</span>
                <span className="text-indigo-400 font-extrabold">{presetSignal.metricValue2}</span>
              </div>
            </div>
          </div>

          {/* Boundaries and parameters table */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#050506]/85 border border-white/5 rounded p-2.5">
                  <span className="text-[8px] text-white/30 block mb-1">PROPOSED ENTRY RANGE</span>
                  <span className="text-[9.5px] font-bold text-emerald-400 block break-words">
                    {presetSignal.entryZoneText}
                  </span>
                </div>
                <div className="bg-[#050506]/85 border border-white/5 rounded p-2.5">
                  <span className="text-[8px] text-white/30 block mb-1">SESSION TARGET CORRIDOR</span>
                  <span className="text-[9.5px] font-bold text-indigo-300 block break-words">
                    {presetSignal.targetZoneText}
                  </span>
                </div>
                <div className="bg-[#050506]/85 border border-white/5 rounded p-2.5">
                  <span className="text-[8px] text-white/30 block mb-1">ORACLE INVALIDATION LIMIT</span>
                  <span className="text-[9.5px] font-bold text-rose-400 block break-words">
                    {presetSignal.invalidationZoneText}
                  </span>
                </div>
              </div>

              <div className="bg-[#050506]/55 border border-white/5 rounded p-3">
                <span className="text-[8px] font-bold uppercase tracking-wider text-indigo-400 block mb-1.5">
                  Strategic Setup Breakdown & Market Assessment:
                </span>
                <p className="text-[10px] text-white/70 font-sans leading-relaxed">
                  {presetSignal.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of the 4 analytic tiers in sequence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* PILLAR 1: Liquidity Sweep Map & Volume Balance Scorecard */}
        <div className="bg-[#0b0b0d] border border-white/5 rounded-lg p-4 font-mono flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-2 mb-2">
              <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                Pillar 1: Liquidity Sweep Map
              </span>
              <span className="text-[9px] text-white/30 lowercase text-right">unmitigated limits</span>
            </div>
            
            <p className="text-[10.5px] font-sans leading-relaxed text-slate-350 pr-2">
              Tracking unmitigated high-timeframe structural zones. If prioritized, price typically accelerates off these supply corridors once a partial or full sweep occurs.
            </p>

            <div className="space-y-1.5 mt-3">
              {liquidityZones.map((zone) => {
                const isPDH = zone.id === 'pdh';
                const distancePips = Math.round(Math.abs(metrics.currentPrice - zone.level) * (symbol.includes('JPY') ? 100 : symbol.includes('USDT') ? 1 : 10000));
                
                return (
                  <div key={zone.id} className="bg-[#050506] border border-white/5 p-2 rounded flex items-center justify-between gap-1.5">
                    <div>
                      <span className="text-[9.5px] font-bold text-white block">{zone.name}</span>
                      <span className="text-[8.5px] text-white/30 block mt-0.5">
                        Pool Level: <strong className="text-white/60">{zone.level.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 4)}</strong> ({distancePips} pips out)
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded ${
                        zone.status === 'Mitigated' 
                          ? 'bg-neutral-800 text-neutral-400' 
                          : isPDH 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {zone.status}
                      </span>
                      <span className="text-[8px] text-white/30 block mt-1">Imbalance: {zone.imbalance}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#050506]/90 p-2 border border-indigo-500/10 rounded flex items-center justify-between text-[9px]">
            <span className="text-white/30">SCORECARD INDEX:</span>
            <span className="text-emerald-400 font-bold uppercase">{liquidityMetrics.biasSignal}</span>
            <span className="text-slate-300 font-mono font-black">{Math.round(liquidityMetrics.totalImbalance)}% IMBL</span>
          </div>
        </div>

        {/* PILLAR 2: Low-Latency Macro Regime Classifier */}
        <div className="bg-[#0b0b0d] border border-white/5 rounded-lg p-4 font-mono flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-2 mb-2">
              <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                Pillar 2: Capital Regime Classifier
              </span>
              <span className="text-[9px] text-white/30 lowercase text-right">RSIx index</span>
            </div>

            <p className="text-[10.5px] font-sans leading-relaxed text-slate-350 pr-2">
              Categorizes volatility contractions and expansion corridors. Dynamic tracking of volume shifts protects margins from sideways distribution blocks.
            </p>

            <div className="space-y-3 mt-3">
              <div className="bg-[#050506] p-2.5 border border-white/5 rounded space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] text-white/30 uppercase tracking-wider font-bold">Classified Regime State:</span>
                  <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded border ${regimeProfile.indicatorCss}`}>
                    {regimeProfile.type}
                  </span>
                </div>
                <p className="text-[9.5px] text-white/60 font-sans leading-relaxed">
                  {regimeProfile.description}
                </p>
              </div>

              {/* Dynamic advice segment */}
              <div className="p-2 bg-indigo-500/[0.02] border border-indigo-500/10 rounded space-y-1">
                <span className="text-[8.5px] text-indigo-300 font-black uppercase tracking-widest block">SUGGESTED STRATEGIC ADVICE:</span>
                <span className="text-[9.5px] text-white/70 font-sans leading-tight block">{regimeProfile.recommendations}</span>
              </div>
            </div>
          </div>

          {/* Shock index nudge simulation slider */}
          <div className="bg-[#050506F] p-2.5 border border-white/5 rounded space-y-1">
            <div className="flex justify-between items-center text-[8.5px]">
              <span className="text-white/35">SIMULATED SHOCK STRESS NUDGE:</span>
              <span className={`font-bold ${regimeProfile.score > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>{regimeProfile.score} / 100</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedRegimeRef(prev => Math.max(-40, prev - 10))}
                className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-[8px] cursor-pointer"
              >
                -10 Vol
              </button>
              <div className="flex-1 h-1 bg-neutral-800 rounded overflow-hidden relative">
                <div className="absolute top-0 bottom-0 left-0 bg-indigo-500 transition-all duration-300" style={{ width: `${regimeProfile.score}%` }} />
              </div>
              <button 
                onClick={() => setSelectedRegimeRef(prev => Math.min(40, prev + 10))}
                className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-[8px] cursor-pointer"
              >
                +10 Vol
              </button>
            </div>
          </div>
        </div>

        {/* PILLAR 3: Cross-Asset Macro Correlation & Intermarket Synergy */}
        <div className="bg-[#0b0b0d] border border-white/5 rounded-lg p-4 font-mono flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-2 mb-2">
              <span className="text-[10px] uppercase font-black text-[#a855f7] tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#a855f7]" />
                Pillar 3: Intermarket Synergy (IMS)
              </span>
              <span className="text-[9px] text-white/30 lowercase text-right">macro overlays</span>
            </div>

            <p className="text-[10.5px] font-sans leading-relaxed text-slate-350 pr-2">
              Monitors fundamental linkages across global assets. Avoids taking technical entries that are directly contradicted by broader inter-currency DXY flows or Treasury bonds momentum.
            </p>

            <div className="space-y-2 mt-3">
              <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                <div className="bg-[#050506] p-2 border border-white/5 rounded">
                  <span className="text-white/30 block uppercase font-bold text-[8px]">USD Proxy (DXY)</span>
                  <span className="font-extrabold text-white mt-1 block">{intermarketSynergy.dxyBias}</span>
                </div>
                <div className="bg-[#050506] p-2 border border-white/5 rounded">
                  <span className="text-white/30 block uppercase font-bold text-[8px]">Symmetry Rate</span>
                  <span className="font-extrabold text-[#c084fc] mt-1 block">{intermarketSynergy.macroConfluencePct}% Match</span>
                </div>
              </div>

              <div className="bg-[#050506]/50 p-2 border border-[#a855f7]/10 rounded space-y-1">
                <span className="text-[8px] font-bold uppercase tracking-wider text-[#c084fc] block">INTELLIGENCE SYNERGY REASONING:</span>
                <p className="text-[9.5px] text-white/60 font-sans leading-relaxed">
                  {intermarketSynergy.reason}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#050506] p-2 border border-white/5 rounded text-[8.5px] font-mono leading-tight flex items-start gap-2 text-white/45">
            <Radio className="w-3.5 h-3.5 text-[#a855f7] shrink-0 mt-0.5 text-right font-bold animate-pulse" />
            <span>
              <strong>IMS Guard Active:</strong> Any index synergy matching below 60% will flag a passive "Liquidity SMT Divergence Warning" on your trade ticket logic.
            </span>
          </div>
        </div>

        {/* PILLAR 4: Institutional Order Block Depth & Invalidation Oracle */}
        <div className="bg-[#0b0b0d] border border-white/5 rounded-lg p-4 font-mono flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-2 mb-2">
              <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Pillar 4: OB Invalidation Oracle
              </span>
              <span className="text-[9px] text-white/30 lowercase text-right">ATR padding bounds</span>
            </div>

            <p className="text-[10.5px] font-sans leading-relaxed text-slate-350 pr-2">
              Quantifies recommended invalidation limits surrounding the closest active high-volume Order Block, safeguarding stops against sudden temporary imbalances.
            </p>

            <div className="space-y-2 mt-3 text-[9.5px]">
              <div className="bg-[#050506] p-2.5 border border-white/5 rounded space-y-1.5">
                <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded border border-white/5">
                  <span className="text-white/40">ATR-Calibrated Cushion:</span>
                  <strong className="text-emerald-400 font-bold">+{obOracle.bufferPips} pips</strong>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[8.5px] pt-1 leading-normal text-white/50">
                  <div>
                    <span className="text-[7.5px] uppercase block text-white/30">Discount Margin</span>
                    <strong className="text-[#a16244] font-bold">{obOracle.lowerBoundInvalidation.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 4)}</strong>
                  </div>
                  <div>
                    <span className="text-[7.5px] uppercase block text-white/30">Premium Margin</span>
                    <strong className="text-slate-300 font-bold">{obOracle.upperBoundInvalidation.toFixed(symbol === 'USD/JPY' ? 2 : symbol === 'BTC/USDT' ? 0 : 4)}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/[0.02] border border-emerald-500/20 p-2.5 rounded flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-emerald-300 font-black text-[9px] uppercase tracking-wider shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  No Threat Alert
                </div>
                <span className="text-[8.5px] text-white/40 text-right leading-none">
                  Safety Margin: {obOracle.confidenceScore}% stable
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#050506] p-2 border border-white/5 rounded text-[8.5px] text-white/40 leading-relaxed text-left">
            Change the <strong className="text-white">Weight Control</strong> at the top of the panel to expand or shrink Stop Loss security distances for custom high-leverage portfolios.
          </div>
        </div>

      </div>

      {/* REAL-TIME ORDER FLOW INTENSITY HEATMAP MODULE */}
      <div id="order-flow-intensity-heatmap" className="bg-[#0b0b0d] border border-white/5 rounded-lg p-5 mb-6 font-mono select-none">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/[0.04] pb-4 mb-4 font-mono">
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Layers className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-[#f43f5e] block">
                Real-Time Order Flow intensity heatmap
              </span>
              <span className="text-[9px] text-white/35 block font-sans mt-0.5">
                Tracks buy/sell volume density clusters and institutional iceberg positions at tick levels to isolate hidden support/resistance pools.
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono uppercase tracking-wider flex items-center gap-1 font-bold ${
              lastOrderFlowDelta > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-550/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
              Delta: {lastOrderFlowDelta > 0 ? '+' : ''}{lastOrderFlowDelta.toFixed(1)} lots
            </span>
            <span className="text-[8px] border border-white/10 px-2 py-0.5 bg-black/60 rounded text-white/40 uppercase">
              Speed: 1.5s refresh
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono">
          {/* Controls column */}
          <div className="lg:col-span-4 bg-[#050506] border border-white/5 p-4 rounded-lg space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[8.5px] text-white/40 uppercase tracking-wider font-extrabold block mb-2.5">
                  Filter Thresholds:
                </span>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-white/45 font-mono">SENSITIVITY (MIN LOTS):</span>
                    <span className="text-rose-400 font-extrabold font-mono">{heatmapSensitivity} Lots</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={heatmapSensitivity}
                    onChange={(e) => setHeatmapSensitivity(parseInt(e.target.value))}
                    className="w-full h-1 accent-rose-500 focus:outline-none cursor-ew-resize bg-neutral-700 rounded-sm"
                  />
                  <div className="flex justify-between text-[7px] text-white/25 mt-0.5 font-mono select-none">
                    <span>5 (All orders)</span>
                    <span>100 (Institutionals Only)</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-[9.5px] text-white/70 hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={showHiddenLiquidityOnly}
                    onChange={(e) => setShowHiddenLiquidityOnly(e.target.checked)}
                    className="rounded bg-neutral-950 border-white/10 text-rose-500 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                  />
                  <span>SHOW ONLY ICEBERG WALLS (HIDDEN)</span>
                </label>
                <p className="text-[8px] text-white/30 font-sans mt-1 leading-normal">
                  Hides normal standard flow to map only masked blocks representing high conviction interbank liquidity deposits.
                </p>
              </div>

              <div className="border-t border-white/5 pt-3 space-y-2">
                <span className="text-[8px] uppercase font-bold text-white/30 block tracking-wider">
                  Liquidity Delta Interpretation:
                </span>
                <div className="p-2.5 bg-black rounded border border-white/[0.03] space-y-1.5 text-[9px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-white/45">Ask Resistance Stack:</span>
                    <span className="text-rose-400 font-bold">
                      {heatmapTicks.filter(t => t.type === 'SELL_ASK').reduce((acc, t) => acc + t.volume, 0).toFixed(0)} lots
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/45">Bid Cushion Support:</span>
                    <span className="text-emerald-400 font-bold">
                      {heatmapTicks.filter(t => t.type === 'BUY_BID').reduce((acc, t) => acc + t.volume, 0).toFixed(0)} lots
                    </span>
                  </div>
                  <div className="h-1 w-full bg-zinc-900 rounded-sm overflow-hidden flex mt-1">
                    {(() => {
                      const askTot = heatmapTicks.filter(t => t.type === 'SELL_ASK').reduce((acc, t) => acc + t.volume, 0) || 1;
                      const bidTot = heatmapTicks.filter(t => t.type === 'BUY_BID').reduce((acc, t) => acc + t.volume, 0) || 1;
                      const total = askTot + bidTot;
                      const bidPct = (bidTot / total) * 100;
                      return (
                        <>
                          <div className="h-full bg-emerald-500" style={{ width: `${bidPct}%` }} />
                          <div className="h-full bg-rose-500" style={{ width: `${100 - bidPct}%` }} />
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={triggerDeepScan}
                disabled={isScanning}
                className={`w-full py-2 px-3 border rounded text-[9.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isScanning 
                    ? 'bg-zinc-800 border-zinc-700 text-white/50' 
                    : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/25 text-rose-400'
                }`}
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning Hidden Depth...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 bg-current text-rose-400 rounded-full scale-75" />
                    <span>Deep Liquidity Scanner</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Heatmap Visual Lattice column */}
          <div className="lg:col-span-8 space-y-4">
            <div className="border border-white/5 rounded-lg bg-black/40 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 bg-neutral-950 px-3.5 py-2.5 text-[8.5px] text-white/40 uppercase tracking-widest font-black border-b border-white/5 select-none font-mono">
                <div className="col-span-3">DEPTH TYPE</div>
                <div className="col-span-3 text-right">TICK PRICE ({symbol.split('/')[1] || 'USD'})</div>
                <div className="col-span-3 text-right">VOLUME (LOTS)</div>
                <div className="col-span-3 text-right text-right pr-4">INTENSITY HEAT</div>
              </div>

              <div className="divide-y divide-white/[0.03] max-h-[305px] overflow-y-auto font-mono text-[10px]">
                {heatmapTicks
                  .filter(t => {
                    if (showHiddenLiquidityOnly && !t.isIceberg) return false;
                    return t.volume >= heatmapSensitivity;
                  })
                  .map((tick, idx) => {
                    const isAsk = tick.type === 'SELL_ASK';
                    
                    const heatPercent = Math.min(100, Math.round(tick.intensity * 100));
                    
                    let bgStyle = '';
                    let textStyle = '';
                    let borderStyle = '';
                    
                    if (isAsk) {
                      bgStyle = `rgba(244, 63, 94, ${Math.max(0.04, tick.intensity * 0.45)})`;
                      textStyle = 'text-rose-400';
                      borderStyle = tick.isIceberg ? 'border-l-[3px] border-l-rose-500' : 'border-l-[3px] border-l-rose-500/30';
                    } else {
                      bgStyle = `rgba(16, 185, 129, ${Math.max(0.04, tick.intensity * 0.45)})`;
                      textStyle = 'text-emerald-400';
                      borderStyle = tick.isIceberg ? 'border-l-[3px] border-l-emerald-500' : 'border-l-[3px] border-l-emerald-500/30';
                    }

                    return (
                      <div 
                        key={idx} 
                        style={{ backgroundColor: bgStyle }}
                        className={`grid grid-cols-12 gap-2 items-center px-3.5 py-2 hover:bg-white/[0.02] transition-colors ${borderStyle}`}
                      >
                        <div className="col-span-3 font-extrabold flex items-center gap-1.5 select-none font-mono">
                          <span className={`h-1.5 w-1.5 rounded-full ${isAsk ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <span className={isAsk ? 'text-rose-400/50 text-[9px]' : 'text-emerald-400/50 text-[9px]'}>
                            {isAsk ? `ASK +${tick.offsetSteps}` : `BID -${tick.offsetSteps}`}
                          </span>
                          {tick.isIceberg && (
                            <span className="px-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[7px] font-black rounded tracking-wide animate-pulse">
                              ICEBERG
                            </span>
                          )}
                        </div>

                        <div className="col-span-3 text-right font-black text-[#e5e5e5]">
                          {formatPriceForSymbol(tick.price, symbol)}
                        </div>

                        <div className="col-span-3 text-right text-white/80 font-bold">
                          {tick.volume.toFixed(1)} <span className="text-[7.5px] text-white/35">lots</span>
                        </div>

                        <div className="col-span-3 flex items-center justify-end gap-2.5">
                          <div className="w-16 h-2 bg-black/60 rounded overflow-hidden p-0.5 border border-white/5 relative flex">
                            <div 
                              className={`h-full rounded-sm ${isAsk ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'}`} 
                              style={{ width: `${heatPercent}%` }}
                            />
                          </div>
                          <span className={`${textStyle} text-[9px] font-black w-7 text-right`}>
                            {heatPercent}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {heatmapTicks.length === 0 && (
                  <div className="py-12 text-center text-white/20 select-none">
                    Establishing live data connection to depth ladder...
                  </div>
                )}
              </div>
            </div>

            {/* Simulated instant iceberg alerts and interbank tracking */}
            {icebergDiscoveredLogs.length > 0 && (
              <div className="p-3 bg-zinc-950 border border-white/5 text-[9px] text-[#888888] rounded-md space-y-1 font-mono">
                <span className="text-[#f43f5e] font-black uppercase text-[8px] tracking-wider block mb-1">
                  🛡️ Sentinel Iceberg discovery logs:
                </span>
                {icebergDiscoveredLogs.map((log, lidx) => (
                  <div key={lidx} className="flex items-start gap-1">
                    <span className="text-white/30 font-black">•</span>
                    <p className="text-slate-300 leading-normal">{log}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
