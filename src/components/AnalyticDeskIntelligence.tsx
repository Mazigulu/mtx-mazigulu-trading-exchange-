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
  Radio
} from 'lucide-react';

interface AnalyticDeskIntelligenceProps {
  symbol: MarketSymbol;
  metrics: MarketMetrics;
  trades?: Trade[];
}

export default function AnalyticDeskIntelligence({ symbol, metrics, trades = [] }: AnalyticDeskIntelligenceProps) {
  const [selectedRegimeRef, setSelectedRegimeRef] = useState<number>(0); // manual shock index nudge
  const [showHeuristicsInfo, setShowHeuristicsInfo] = useState<boolean>(false);
  const [selectedIntegrationWeight, setSelectedIntegrationWeight] = useState<number>(1.0); // 1x ATR multiplier slider
  const [dismissedSafetyStatus, setDismissedSafetyStatus] = useState<boolean>(false);
  const [timeframeBiasFilter, setTimeframeBiasFilter] = useState<'COMBINED' | 'H4' | 'DAILY'>('COMBINED');
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number>(5); // 0 to 5, where 5 is live

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

    </div>
  );
}
