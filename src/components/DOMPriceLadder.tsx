import React, { useState, useEffect, useMemo } from 'react';
import { Trade, MarketSymbol, LiquiditySweep, Candlestick, MarketMetrics } from '../types';
import { Zap, Play, Square, Activity, ShieldAlert, BadgeAlert, Plus, Minus, Trash2 } from 'lucide-react';

interface DOMPriceLadderProps {
  symbol: MarketSymbol;
  livePrice: number;
  trades: Trade[];
  oneClickLots: number;
  onTradeExecuted?: () => void;
  basePrice: number;
  sweeps?: LiquiditySweep[];
  candles?: Candlestick[];
  showTWVP?: boolean;
  metrics?: MarketMetrics;
}

const TICK_CONFIG: Record<string, { tickSize: number; decimals: number; pipMultiplier: number }> = {
  'EUR/USD': { tickSize: 0.00005, decimals: 5, pipMultiplier: 10000 },
  'GBP/USD': { tickSize: 0.00005, decimals: 5, pipMultiplier: 10000 },
  'USD/JPY': { tickSize: 0.005, decimals: 3, pipMultiplier: 100 },
  'BTC/USDT': { tickSize: 5.0, decimals: 1, pipMultiplier: 1 },
  'GOLD/USD': { tickSize: 0.05, decimals: 2, pipMultiplier: 10 },
};

export default function DOMPriceLadder({
  symbol,
  livePrice,
  trades,
  oneClickLots,
  onTradeExecuted,
  basePrice,
  sweeps = [],
  candles = [],
  showTWVP = false,
  metrics,
}: DOMPriceLadderProps) {
  const config = useMemo(() => TICK_CONFIG[symbol] || { tickSize: 0.0001, decimals: 4, pipMultiplier: 10000 }, [symbol]);
  
  // Local configuration for execution size, SL, TP (independent from or initialized by props)
  const [lotSize, setLotSize] = useState<number>(oneClickLots || 0.1);
  const [stopLossPips, setStopLossPips] = useState<number>(10);
  const [takeProfitPips, setTakeProfitPips] = useState<number>(20);
  const [useOneClick, setUseOneClick] = useState<boolean>(true);
  const [executingState, setExecutingState] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [statusMsg, setStatusMsg] = useState<string>('');

  // Snych lotSize when parent change happens
  useEffect(() => {
    if (oneClickLots) {
      setLotSize(oneClickLots);
    }
  }, [oneClickLots]);

  // Keep track of dynamically fluctuating depths to simulate a real order book feed
  const [depthSeeds, setDepthSeeds] = useState<Record<number, { bidIdx: number; askIdx: number }>>({});

  useEffect(() => {
    // Fluctuating Depth Simulation
    const interval = setInterval(() => {
      setDepthSeeds((prev) => {
        const next: Record<number, { bidIdx: number; askIdx: number }> = { ...prev };
        const centerTick = Math.round(livePrice / config.tickSize);
        // seed a clean viewport of 15 ticks around the center tick
        for (let i = -10; i <= 10; i++) {
          const t = centerTick + i;
          const current = next[t] || { 
            bidIdx: Math.floor(Math.random() * 40 + 10), 
            askIdx: Math.floor(Math.random() * 40 + 10) 
          };
          
          // Micro fluctuations (-3 to +3 lots)
          const bidDelta = Math.floor(Math.sin(Date.now() / 1500 + i) * 4);
          const askDelta = Math.floor(Math.cos(Date.now() / 1500 - i) * 4);
          
          next[t] = {
            bidIdx: Math.max(2, current.bidIdx + bidDelta),
            askIdx: Math.max(2, current.askIdx + askDelta)
          };
        }
        return next;
        
      });
    }, 900);

    return () => clearInterval(interval);
  }, [livePrice, config]);

  // Derive active symbol positions
  const openPositions = useMemo(() => {
    return (trades || []).filter((t) => t.symbol === symbol && t.status === 'OPEN');
  }, [trades, symbol]);

  // Base price center calculations
  const centerTick = useMemo(() => {
    if (!livePrice || isNaN(livePrice)) return basePrice || 1.0;
    return Math.round(livePrice / config.tickSize) * config.tickSize;
  }, [livePrice, config, basePrice]);

  // Compute 13 levels surrounding the center tick
  const ladderLevels = useMemo(() => {
    const levelsList = [];
    const tickCount = 6; // 6 above, 6 below

    for (let i = tickCount; i >= -tickCount; i--) {
      const price = centerTick + i * config.tickSize;
      const roundedPrice = parseFloat(price.toFixed(config.decimals));
      const rawTick = Math.round(roundedPrice / config.tickSize);

      const isSpread = Math.abs(roundedPrice - livePrice) < config.tickSize * 0.45;
      const isAsk = roundedPrice > livePrice;
      const isBid = roundedPrice < livePrice;

      // retrieve or fallback simulated depth sizes
      const seeds = depthSeeds[rawTick] || { bidIdx: 15, askIdx: 18 };
      let bidDepth = isBid ? seeds.bidIdx : 0;
      let askDepth = isAsk ? seeds.askIdx : 0;

      // Let's add extra liquidity around FVG / OB or key order flow zones
      const isHighLiquidityZone = i === 3 || i === -4;
      if (isHighLiquidityZone) {
        if (isBid) bidDepth = Math.round(bidDepth * 2.5);
        if (isAsk) askDepth = Math.round(askDepth * 2.5);
      }

      // Find any positions sitting precisely on this price tick
      const matchedPositions = openPositions.filter((pos) => {
        const diff = Math.abs(pos.entryPrice - roundedPrice);
        return diff < config.tickSize * 0.5;
      });

      // Find if any liquidity sweeps coincide with this specific priced row
      const coincidedSweep = sweeps.find((sw) => {
        const priceDiff = Math.abs(sw.level - roundedPrice);
        return priceDiff < config.tickSize * 0.5;
      });

      // Check for S/R proximity touches
      const isSupportZone = metrics?.supportLevels?.some((lvl) => {
        const diff = Math.abs(lvl - roundedPrice);
        return diff < config.tickSize * 0.95;
      }) || false;

      const isResistanceZone = metrics?.resistanceLevels?.some((lvl) => {
        const diff = Math.abs(lvl - roundedPrice);
        return diff < config.tickSize * 0.95;
      }) || false;

      const isHistoricalSR = isSupportZone || isResistanceZone;

      levelsList.push({
        price: roundedPrice,
        isAsk,
        isBid,
        isSpread,
        bidDepth,
        askDepth,
        isHighLiquidityZone,
        positions: matchedPositions,
        coincidedSweep,
        isSupportZone,
        isResistanceZone,
        isHistoricalSR,
      });
    }

    return levelsList;
  }, [centerTick, config, livePrice, depthSeeds, openPositions, sweeps, metrics]);

  // Find highest bid in ladder levels (closest to current price from below)
  const bestBidPrice = useMemo(() => {
    const bids = ladderLevels.filter(lvl => lvl.isBid);
    if (bids.length === 0) return null;
    return Math.max(...bids.map(b => b.price));
  }, [ladderLevels]);

  // Find lowest ask in ladder levels (closest to current price from above)
  const bestAskPrice = useMemo(() => {
    const asks = ladderLevels.filter(lvl => lvl.isAsk);
    if (asks.length === 0) return null;
    return Math.min(...asks.map(a => a.price));
  }, [ladderLevels]);

  // Compute total depth sizes to draw beautiful fill percentages
  const maxDepthVal = useMemo(() => {
    let max = 1;
    ladderLevels.forEach((lvl) => {
      if (lvl.bidDepth > max) max = lvl.bidDepth;
      if (lvl.askDepth > max) max = lvl.askDepth;
    });
    return max;
  }, [ladderLevels]);

  // Compute maximum absolute delta to draw beautiful dynamic bidirectional fill percentages
  const maxAbsDelta = useMemo(() => {
    let max = 1;
    ladderLevels.forEach((lvl) => {
      const d = Math.abs(lvl.bidDepth - lvl.askDepth);
      if (d > max) max = d;
    });
    return max;
  }, [ladderLevels]);

  // Spread and Imbalance calculations
  const spreadValue = useMemo(() => {
    const asks = ladderLevels.filter(l => l.isAsk);
    const bids = ladderLevels.filter(l => l.isBid);
    if (asks.length === 0 || bids.length === 0) return 0.5;
    const lowestAsk = Math.min(...asks.map(a => a.price));
    const highestBid = Math.max(...bids.map(b => b.price));
    return parseFloat((lowestAsk - highestBid).toFixed(config.decimals));
  }, [ladderLevels, config]);

  const spreadPips = useMemo(() => {
    return (spreadValue * config.pipMultiplier).toFixed(1);
  }, [spreadValue, config]);

  // Proximity to Support or Resistance checking (within 3 pips)
  const isCloseToSR = useMemo(() => {
    if (!metrics) return false;
    const sLevels = metrics.supportLevels || [];
    const rLevels = metrics.resistanceLevels || [];
    const allLevels = [...sLevels, ...rLevels];
    return allLevels.some((lvl) => {
      const diffInPips = Math.abs(lvl - livePrice) * config.pipMultiplier;
      return diffInPips <= 3.05;
    });
  }, [metrics, livePrice, config]);

  const closestSRZone = useMemo(() => {
    if (!metrics) return null;
    const sLevels = metrics.supportLevels || [];
    const rLevels = metrics.resistanceLevels || [];
    
    let closestDist = Infinity;
    let closestType: 'SUPPORT' | 'RESISTANCE' | null = null;
    let closestVal = 0;

    sLevels.forEach((lvl) => {
      const diffInPips = Math.abs(lvl - livePrice) * config.pipMultiplier;
      if (diffInPips <= 3.05 && diffInPips < closestDist) {
        closestDist = diffInPips;
        closestType = 'SUPPORT';
        closestVal = lvl;
      }
    });

    rLevels.forEach((lvl) => {
      const diffInPips = Math.abs(lvl - livePrice) * config.pipMultiplier;
      if (diffInPips <= 3.05 && diffInPips < closestDist) {
        closestDist = diffInPips;
        closestType = 'RESISTANCE';
        closestVal = lvl;
      }
    });

    if (!closestType) return null;

    const levelStr = closestVal.toFixed(config.decimals);
    if (closestType === 'SUPPORT') {
      return {
        type: 'SUPPORT',
        name: 'Institutional Demand Block',
        shortName: 'DEMAND',
        price: closestVal,
        dist: closestDist
      };
    } else {
      return {
        type: 'RESISTANCE',
        name: 'Institutional Supply Block',
        shortName: 'SUPPLY',
        price: closestVal,
        dist: closestDist
      };
    }
  }, [metrics, livePrice, config]);

  const bidRatio = useMemo(() => {
    let bidSum = 0;
    let askSum = 0;
    ladderLevels.forEach((l) => {
      bidSum += l.bidDepth;
      askSum += l.askDepth;
    });
    const total = bidSum + askSum;
    if (total === 0) return 50;
    return Math.round((bidSum / total) * 100);
  }, [ladderLevels]);

  const totalBids = useMemo(() => {
    return ladderLevels.reduce((acc, lvl) => acc + lvl.bidDepth, 0);
  }, [ladderLevels]);

  const totalAsks = useMemo(() => {
    return ladderLevels.reduce((acc, lvl) => acc + lvl.askDepth, 0);
  }, [ladderLevels]);

  const netOrderFlow = useMemo(() => {
    return totalBids - totalAsks;
  }, [totalBids, totalAsks]);

  const netImbalancePercent = useMemo(() => {
    const total = totalBids + totalAsks;
    if (total === 0) return 0;
    return Math.round((Math.abs(netOrderFlow) / total) * 100);
  }, [netOrderFlow, totalBids, totalAsks]);

  // Calculate Time-Weighted Volume Profile for the ladder levels
  const twvpProfile = useMemo(() => {
    if (!showTWVP || !candles || candles.length === 0) return null;

    // Use latest 50 candles for high-accuracy local profile
    const relevantCandles = candles.slice(-50);
    const totalCandles = relevantCandles.length;

    // Calculate time-decay weighted volumes at each ladder level's price
    const profileMap: Record<number, { volume: number; buyVolume: number; sellVolume: number }> = {};

    ladderLevels.forEach((level) => {
      profileMap[level.price] = { volume: 0, buyVolume: 0, sellVolume: 0 };
    });

    relevantCandles.forEach((candle, idx) => {
      // Exponential or linear time decay weights: more recent candles have higher weight
      // distance from latest (which has idx = totalCandles - 1)
      const distance = (totalCandles - 1) - idx;
      const timeWeight = Math.pow(0.97, distance); // time decay weight

      const candleVol = (candle.volume || 0) * timeWeight;
      const isBullish = candle.close >= candle.open;
      const buyFraction = isBullish ? 0.65 : 0.35;
      const sellFraction = isBullish ? 0.35 : 0.65;

      const span = candle.high - candle.low;

      ladderLevels.forEach((level) => {
        let overlap = 0;
        const halfTick = config.tickSize / 2;
        const tickMin = level.price - halfTick;
        const tickMax = level.price + halfTick;

        if (span <= 0) {
          if (Math.abs(level.price - candle.close) < config.tickSize * 0.5) {
            overlap = 1;
          }
        } else {
          const overlapMin = Math.max(candle.low, tickMin);
          const overlapMax = Math.min(candle.high, tickMax);
          if (overlapMax > overlapMin) {
            overlap = (overlapMax - overlapMin) / span;
          }
        }

        if (overlap > 0) {
          const allocatedVol = candleVol * overlap;
          profileMap[level.price].volume += allocatedVol;
          profileMap[level.price].buyVolume += allocatedVol * buyFraction;
          profileMap[level.price].sellVolume += allocatedVol * sellFraction;
        }
      });
    });

    // Find the maximum weighted volume in the ladder to normalize the bar widths
    let maxWeightedVol = 1.0;
    ladderLevels.forEach((lvl) => {
      const data = profileMap[lvl.price];
      if (data && data.volume > maxWeightedVol) {
        maxWeightedVol = data.volume;
      }
    });

    return {
      profileMap,
      maxWeightedVol,
    };
  }, [ladderLevels, candles, showTWVP, config]);

  // Instant order execution helper
  const handlePlaceOrder = async (side: 'BUY' | 'SELL', customPrice?: number) => {
    if (executingState === 'SENDING') return;

    setExecutingState('SENDING');
    setStatusMsg('');

    // standard execution calculations
    const activeEntryPrice = customPrice !== undefined ? customPrice : livePrice;
    
    // Auto-calculate structural Stop Loss and Take Profit
    const pipFactor = 1 / config.pipMultiplier;
    const slUnits = stopLossPips * pipFactor;
    const tpUnits = takeProfitPips * pipFactor;

    const stopLoss = side === 'BUY' 
      ? parseFloat((activeEntryPrice - slUnits).toFixed(config.decimals))
      : parseFloat((activeEntryPrice + slUnits).toFixed(config.decimals));

    const takeProfit = side === 'BUY'
      ? parseFloat((activeEntryPrice + tpUnits).toFixed(config.decimals))
      : parseFloat((activeEntryPrice - tpUnits).toFixed(config.decimals));

    const orderTypeLabel = customPrice !== undefined ? 'LIMIT' : 'MARKET';
    const reasonText = `${orderTypeLabel} entry executed via MT5 DOM Price Ladder at price ${activeEntryPrice.toFixed(config.decimals)}. Auto SL (${stopLossPips} pips), TP (${takeProfitPips} pips).`;

    let userMarketNote = '';
    try {
      userMarketNote = localStorage.getItem('apex_predefined_market_note') || '';
    } catch (_) {}

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          side,
          entryPrice: activeEntryPrice,
          stopLoss,
          takeProfit,
          size: lotSize,
          reason: reasonText,
          confidence: 95,
          confluences: [
            'MT5 Depth Of Market execution',
            'Order Flow Liquidity Confirmation',
            `${bidRatio}% Bid-to-Ask Imbalance Bias`
          ],
          marketNote: userMarketNote ? `${userMarketNote} (DOM Execution)` : 'Entered via MT5 Price Ladder.',
        }),
      });

      if (!res.ok) {
        throw new Error('Server rejected the order.');
      }

      setExecutingState('SUCCESS');
      setStatusMsg(`${side} ${orderTypeLabel} Executed!`);
      
      if (onTradeExecuted) {
        onTradeExecuted();
      }

      setTimeout(() => {
        setExecutingState('IDLE');
        setStatusMsg('');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setExecutingState('ERROR');
      setStatusMsg('Order Denied');
      setTimeout(() => setExecutingState('IDLE'), 2000);
    }
  };

  // Close all trades callback
  const handleCloseAllTrades = async () => {
    if (openPositions.length === 0) return;
    
    if (window.confirm(`Are you sure you want to CLOSE ALL ${openPositions.length} active positions for ${symbol}?`)) {
      setExecutingState('SENDING');
      try {
        for (const pos of openPositions) {
          await fetch(`/api/trades/${pos.id}/close`, {
            method: 'POST',
          });
        }
        
        setExecutingState('SUCCESS');
        setStatusMsg('All Closed!');
        if (onTradeExecuted) {
          onTradeExecuted();
        }
        setTimeout(() => {
          setExecutingState('IDLE');
          setStatusMsg('');
        }, 2000);
      } catch (err) {
        setExecutingState('ERROR');
        setStatusMsg('Failed Close');
        setTimeout(() => setExecutingState('IDLE'), 2000);
      }
    }
  };

  return (
    <div 
      id="dom-ladder-wrapper" 
      className={`flex flex-col h-full bg-[#070709] border transition-all duration-500 rounded-lg shadow-2xl relative select-none ${
        isCloseToSR 
          ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
          : 'border-white/10'
      }`}
    >
      
      {/* 1. DOM Title and Real-time Status Deck */}
      <div className="px-3 py-2.5 border-b border-white/10 bg-[#0c0c0f]/90 flex items-center justify-between shrink-0 font-sans">
        <div className="flex items-center space-x-1.5 flex-1 min-w-0 mr-2">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse transition-all duration-300 shrink-0 ${closestSRZone ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-cyan-400'}`} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#60a5fa] font-sans shrink-0">Depth Of Market</span>
          {closestSRZone && (
            <span 
              className="text-[7.2px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/35 animate-pulse tracking-wide font-mono font-bold leading-none uppercase truncate"
              title={`${closestSRZone.name} proximity detected`}
            >
              {closestSRZone.name}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 text-[9px] font-mono text-white/50 bg-[#050505] px-2 py-0.5 rounded border border-white/5">
          <span className="uppercase text-white/35">Spread:</span>
          <span className="text-amber-400 font-bold">{spreadPips} Pips</span>
        </div>
      </div>

      {/* 2. Buy/Sell Imbalance Bar */}
      <div className="px-3 py-1 bg-[#09090b] border-b border-white/5 flex flex-col shrink-0 text-[8px] font-mono">
        <div className="flex justify-between items-center text-white/40 mb-1 font-bold">
          <span className="text-emerald-400">BID {bidRatio}%</span>
          <span>IMBALANCE</span>
          <span className="text-rose-400">ASK {100 - bidRatio}%</span>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex">
          <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${bidRatio}%` }} />
          <div className="bg-rose-500 h-full transition-all duration-500 flex-1" style={{ width: `${100 - bidRatio}%` }} />
        </div>
      </div>

      {/* 3. The Price Ladder Rows Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-start min-h-0 bg-[#060608]/50 select-none">
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 text-[8px] text-white/35 font-bold uppercase py-1 border-b border-white/5 bg-[#0a0a0c]/40 text-center shrink-0">
          <span className="col-span-2 text-left pl-2">Bid Qty</span>
          <span className="col-span-3">Delta (B-A)</span>
          <span className="col-span-3">Price</span>
          <span className="col-span-2">Positions</span>
          <span className="col-span-2 text-right pr-2">Ask Qty</span>
        </div>

        {/* Dynamic Levels List */}
        <div className="flex-1 flex flex-col justify-around min-h-[190px] py-1 select-none font-mono">
          {ladderLevels.map((level, idx) => {
            const bidPct = Math.min(100, Math.round((level.bidDepth / maxDepthVal) * 100));
            const askPct = Math.min(100, Math.round((level.askDepth / maxDepthVal) * 100));

            // Calculate bidirectional Delta (Bids minus Asks)
            const delta = level.bidDepth - level.askDepth;
            const deltaPct = Math.min(100, Math.round((Math.abs(delta) / maxAbsDelta) * 100));

            const isBestBid = level.price === bestBidPrice;
            const isBestAsk = level.price === bestAskPrice;

            // Determine background row highlight if we are right on the spread or active price
            let rowBg = 'hover:bg-white/[0.01] border-y border-transparent';
            let sideAccent = null;

            if (isBestBid) {
              rowBg = 'bg-emerald-500/10 hover:bg-emerald-500/15 border-y border-emerald-500/40 shadow-[inset_0_0_12px_rgba(16,185,129,0.15)]';
              sideAccent = <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 shadow-[0_0_10px_#10b981] z-20" />;
            } else if (isBestAsk) {
              rowBg = 'bg-rose-500/10 hover:bg-rose-500/15 border-y border-rose-500/40 shadow-[inset_0_0_12px_rgba(239,68,68,0.15)]';
              sideAccent = <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-rose-500 shadow-[0_0_10px_#ef4444] z-20" />;
            } else if (level.coincidedSweep) {
              if (level.coincidedSweep.type === 'BUY_SIDE') {
                rowBg = 'bg-amber-500/[0.06] hover:bg-amber-500/[0.1] border-y border-dashed border-amber-500/30 shadow-[inset_0_0_8px_rgba(245,158,11,0.1)]';
                sideAccent = <span className="absolute right-0 top-[-1px] bottom-[-1px] w-[3px] bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] z-25 animate-pulse" />;
              } else {
                rowBg = 'bg-purple-500/[0.06] hover:bg-purple-500/[0.1] border-y border-dashed border-purple-500/30 shadow-[inset_0_0_8px_rgba(168,85,247,0.15)]';
                sideAccent = <span className="absolute left-0 top-[-1px] bottom-[-1px] w-[3px] bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] z-25 animate-pulse" />;
              }
            } else if (level.isSpread) {
              rowBg = 'bg-white/[0.02] border-y border-white/[0.04] py-0.5 style-pulse';
            } else if (level.isHistoricalSR) {
              rowBg = 'sr-gold-pulse border-y border-amber-500/30 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]';
              sideAccent = <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] z-20 animate-pulse" />;
            } else if (level.isHighLiquidityZone) {
              rowBg = 'bg-blue-500/[0.01] hover:bg-white/[0.02] border-y border-transparent';
            }

            // Overlay subtle ring accent for S/R zone if a higher priority background is active
            if (level.isHistoricalSR && !rowBg.includes('sr-gold-pulse')) {
              rowBg += ' ring-1 ring-amber-500/30';
            }

            return (
              <div
                key={`dom-row-${idx}`}
                className={`grid grid-cols-12 text-[10px] items-center relative transition-all group select-none py-1 ${rowBg}`}
              >
                {sideAccent}
                
                {/* A. Bid Quantity Cell (Interactive Click to Place BUY LIMIT) */}
                <button
                  onClick={() => handlePlaceOrder('BUY', level.price)}
                  disabled={!useOneClick}
                  className="col-span-2 relative h-6 flex items-center text-left text-emerald-400 font-extrabold cursor-pointer border border-transparent hover:border-emerald-500/30 transition-all font-mono pl-2 bg-transparent outline-none"
                  title={useOneClick ? `Click to place Instant BUY LIMIT order at ${level.price}` : 'DOM execution locked'}
                >
                  {/* Visual limit queue progress bar */}
                  {level.isBid && (
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-500/[0.08] transition-all duration-300"
                      style={{ width: `${bidPct}%` }}
                    />
                  )}
                  {level.isBid && (
                    <span className="relative z-10 flex items-center gap-1 group-hover:text-emerald-300">
                      {level.bidDepth}
                      <span className="text-[7px] text-white/20 opacity-0 group-hover:opacity-100 uppercase tracking-widest font-sans">LMT</span>
                    </span>
                  )}
                </button>

                {/* Dynamic Bidirectional Delta Bar */}
                <div className="col-span-3 relative h-6 flex items-center justify-center font-mono text-[9px] border-r border-white/5 overflow-hidden">
                  {/* Underlay Bar */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {/* Left side (negative delta, rose red) */}
                    <div className="w-1/2 h-full flex justify-end relative">
                      <div 
                        className="bg-rose-500/20 h-full border-r border-rose-500/40 transition-all duration-500 ease-out" 
                        style={{ width: `${delta < 0 ? deltaPct : 0}%` }}
                      />
                    </div>
                    {/* Centered thin divider line */}
                    <div className="w-[1px] h-full bg-white/10 z-10" />
                    {/* Right side (positive delta, emerald green) */}
                    <div className="w-1/2 h-full flex justify-start relative">
                      <div 
                        className="bg-emerald-500/20 h-full border-l border-emerald-500/40 transition-all duration-500 ease-out" 
                        style={{ width: `${delta > 0 ? deltaPct : 0}%` }}
                      />
                    </div>
                  </div>
                  {/* Explicit Delta numerical label */}
                  <span className={`relative z-10 font-bold ${
                    delta > 0 ? 'text-emerald-400/90' : delta < 0 ? 'text-rose-450 text-[#ff5555]' : 'text-white/35 font-normal'
                  }`}>
                    {delta > 0 ? `+${delta}` : delta === 0 ? '0' : delta}
                  </span>
                </div>

                {/* B. Active Positions & Sweeps Flags Column */}
                <div className="col-span-2 flex flex-wrap items-center justify-center gap-1 z-10 pointer-events-none">
                  {level.positions.length > 0 && (
                    level.positions.map((pos) => (
                      <span
                        key={pos.id}
                        className={`text-[7px] font-black tracking-tighter px-1 py-0.2 rounded scale-95 animate-pulse uppercase ${
                          pos.side === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                        title={`Active ${pos.side} Position at ${pos.entryPrice}`}
                      >
                        {pos.side === 'BUY' ? 'B' : 'S'} {pos.size}
                      </span>
                    ))
                  )}
                  {level.coincidedSweep && (
                    <span
                      className={`text-[7px] font-black tracking-tight px-1 py-0.5 rounded leading-none shrink-0 ${
                        level.coincidedSweep.type === 'BUY_SIDE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      } flex items-center gap-0.5`}
                      title={`Liquidity Sweep [${level.coincidedSweep.type}] detected at ${level.coincidedSweep.level.toFixed(config.decimals)}`}
                    >
                      <Zap className="w-2.5 h-2.5 fill-current animate-pulse shrink-0 text-amber-400" />
                      {level.coincidedSweep.type === 'BUY_SIDE' ? 'BSL' : 'SSL'}
                    </span>
                  )}
                  {level.positions.length === 0 && !level.coincidedSweep && level.isSpread && (
                    <div className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400"></span>
                    </div>
                  )}
                </div>

                {/* C. Monospace Central Price Column with Time-Weighted Volume Profile Overlay */}
                <div className="col-span-3 relative h-6 flex flex-col items-center justify-center z-10 border-l border-white/5">
                  {/* Underlay visual representing raw Time-Weighted Volume Profile (split left/right) */}
                  {showTWVP && twvpProfile && twvpProfile.profileMap[level.price] && (
                    <div className="absolute inset-y-0.5 inset-x-1.5 flex items-center justify-center opacity-25 pointer-events-none z-0 rounded overflow-hidden">
                      {/* Left Side Buy Volume (soft emerald) */}
                      <div className="w-1/2 h-full flex justify-end">
                        <div 
                           className="bg-emerald-500/30 h-full border-r border-indigo-400/10"
                           style={{ width: `${(twvpProfile.profileMap[level.price].buyVolume / twvpProfile.maxWeightedVol) * 100}%` }}
                        />
                      </div>
                      {/* Right Side Sell Volume (soft rose/red) */}
                      <div className="w-1/2 h-full flex justify-start">
                        <div 
                           className="bg-rose-500/30 h-full"
                           style={{ width: `${(twvpProfile.profileMap[level.price].sellVolume / twvpProfile.maxWeightedVol) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* S/R Shimmer background */}
                  {level.isHistoricalSR && (
                    <div className="absolute inset-0 bg-amber-500/[0.04] border-x border-amber-500/20 pointer-events-none z-0 sr-gold-pulse animate-pulse" />
                  )}

                  {/* S/R Label badge overlay */}
                  {level.isHistoricalSR && (
                    <span 
                      className="absolute left-1 top-1/2 -translate-y-1/2 text-[6px] px-1 py-[1.5px] rounded-[2px] font-sans font-black leading-none bg-[#f59e0b]/25 text-amber-300 border border-amber-500/40 shadow-[0_0_6px_rgba(245,158,11,0.2)] animate-pulse tracking-wide select-none uppercase"
                      title={level.isSupportZone ? 'Historical Support Level (Order Block Zone)' : 'Historical Resistance Level (Order Block Zone)'}
                    >
                      {level.isSupportZone ? 'DEMAND' : 'SUPPLY'}
                    </span>
                  )}

                  {/* S/R Specific Name Label Hover Overlay */}
                  {level.isHistoricalSR && (
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[6.5px] px-1.5 py-[2px] rounded font-sans font-black leading-none bg-[#0a0a0d] border border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.35)] z-40 tracking-wider whitespace-nowrap pointer-events-none uppercase">
                      {level.isSupportZone ? 'DEMAND BLOCK (OB SUPPORT)' : 'SUPPLY BLOCK (OB RESISTANCE)'}
                    </span>
                  )}

                  <span className={`font-mono text-center relative z-10 px-1 py-0.2 rounded text-[10px] ${
                    level.isHistoricalSR ? 'text-amber-400 font-extrabold shadow-[0_0_4px_rgba(245,158,11,0.25)]' :
                    level.isSpread ? 'text-indigo-400 font-black tracking-tight' :
                    level.isAsk ? 'text-[#ff5555] opacity-90' :
                    'text-emerald-400 opacity-90'
                  }`}>
                    {level.price.toFixed(config.decimals)}
                  </span>

                  {/* High accuracy hover badge indicating cumulative weight */}
                  {showTWVP && twvpProfile && twvpProfile.profileMap[level.price] && twvpProfile.profileMap[level.price].volume > 0 && (
                    <span className="absolute bottom-[-9px] scale-[0.65] opacity-0 group-hover:opacity-100 text-[8.5px] font-mono font-bold text-indigo-300 bg-[#08080a] border border-white/10 px-1 py-0.2 rounded z-30 transition-all duration-150 shadow-md backdrop-blur-sm pointer-events-none whitespace-nowrap">
                      TWVP: {Math.round(twvpProfile.profileMap[level.price].volume).toLocaleString()} L
                    </span>
                  )}
                </div>

                {/* D. Ask Quantity Cell (Interactive Click to Place SELL LIMIT) */}
                <button
                  onClick={() => handlePlaceOrder('SELL', level.price)}
                  disabled={!useOneClick}
                  className="col-span-2 relative h-6 flex items-center justify-end text-right text-rose-400 font-extrabold cursor-pointer border border-transparent hover:border-rose-500/30 transition-all font-mono pr-2 bg-transparent outline-none"
                  title={useOneClick ? `Click to place Instant SELL LIMIT order at ${level.price}` : 'DOM execution locked'}
                >
                  {/* Visual limit queue progress bar */}
                  {level.isAsk && (
                    <div
                      className="absolute inset-y-0 right-0 bg-rose-500/[0.08] transition-all duration-300"
                      style={{ width: `${askPct}%` }}
                    />
                  )}
                  {level.isAsk && (
                    <span className="relative z-10 flex items-center gap-1 group-hover:text-rose-300">
                      <span className="text-[7px] text-white/20 opacity-0 group-hover:opacity-100 uppercase tracking-widest font-sans">LMT</span>
                      {level.askDepth}
                    </span>
                  )}
                </button>

              </div>
            );
          })}
        </div>
      </div>

      {/* Order Flow Imbalance Summary Footer */}
      <div id="dom-order-flow-summary" className="px-3 py-2 border-t border-b border-white/10 bg-[#09090c] flex flex-col space-y-1.5 shrink-0 font-mono text-[9px] select-none">
        <div className="flex items-center justify-between text-[8px] text-white/40 uppercase tracking-widest font-bold">
          <span>Depth Order Flow</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Active Depth
          </span>
        </div>
        <div className="flex items-center justify-between text-white/80 py-0.5">
          <span className="text-emerald-400 font-extrabold flex items-center gap-1">
            Bids: <span className="text-white">{totalBids} L</span>
          </span>
          <span className="text-white/30">|</span>
          <span className="text-rose-400 font-extrabold flex items-center gap-1">
            Asks: <span className="text-white">{totalAsks} L</span>
          </span>
          <span className="text-white/30">|</span>
          <span className={`font-black ${netOrderFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netOrderFlow >= 0 ? '+' : ''}{netOrderFlow} L
          </span>
        </div>
        <div className="flex items-center justify-between text-[8px] pt-0.5">
          <span className="text-white/35">Net Bias:</span>
          <span className={`font-extrabold uppercase tracking-wider ${
            netOrderFlow > 0 ? 'text-emerald-400 font-black' : netOrderFlow < 0 ? 'text-rose-400 font-black' : 'text-white/50'
          }`}>
            {netOrderFlow > 0 ? `Buyer Lean (${netImbalancePercent}%)` : netOrderFlow < 0 ? `Seller Lean (${netImbalancePercent}%)` : 'Neutral'}
          </span>
        </div>
      </div>

      {/* 4. Instant Order Execution Panel Footer */}
      <div className="px-3 py-2.5 border-t border-white/10 bg-[#0b0b0e] space-y-2.5 shrink-0">
        
        {/* Rapid Lot Size Buttons & Manual inputs */}
        <div className="flex items-center justify-between text-[9px] font-bold">
          <span className="text-white/40 uppercase tracking-widest font-sans text-[8px]">Lots</span>
          <div className="flex items-center gap-1">
            {['0.01', '0.10', '0.50', '1.0'].map((val) => (
              <button
                key={val}
                onClick={() => setLotSize(parseFloat(val))}
                className={`px-1.5 py-0.5 rounded text-[8.5px] border cursor-pointer font-mono ${
                  lotSize === parseFloat(val)
                    ? 'bg-indigo-600 border-indigo-500 text-white font-extrabold'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic numeric fields for SL & TP offsets */}
        <div className="grid grid-cols-2 gap-2 text-[9px] font-bold">
          <div className="flex flex-col">
            <span className="text-white/45 uppercase tracking-wider mb-1 font-sans text-[7.5px] font-bold">Stop Loss (Pips)</span>
            <div className="flex items-center rounded border border-white/10 bg-[#050505] p-0.5">
              <button 
                type="button" 
                onClick={() => setStopLossPips(prev => Math.max(0, prev - 5))}
                className="p-1 hover:bg-white/5 text-white/30 hover:text-white cursor-pointer rounded"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <input
                type="number"
                value={stopLossPips}
                onChange={(e) => setStopLossPips(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-transparent text-center font-mono font-extrabold text-white text-[10.5px] outline-none"
              />
              <button 
                type="button" 
                onClick={() => setStopLossPips(prev => Math.min(100, prev + 5))}
                className="p-1 hover:bg-white/5 text-white/30 hover:text-white cursor-pointer rounded"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-white/45 uppercase tracking-wider mb-1 font-sans text-[7.5px] font-bold">Take Profit (Pips)</span>
            <div className="flex items-center rounded border border-white/10 bg-[#050505] p-0.5">
              <button 
                type="button" 
                onClick={() => setTakeProfitPips(prev => Math.max(0, prev - 5))}
                className="p-1 hover:bg-white/5 text-white/30 hover:text-white cursor-pointer rounded"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <input
                type="number"
                value={takeProfitPips}
                onChange={(e) => setTakeProfitPips(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-transparent text-center font-mono font-extrabold text-white text-[10.5px] outline-none"
              />
              <button 
                type="button" 
                onClick={() => setTakeProfitPips(prev => Math.min(200, prev + 5))}
                className="p-1 hover:bg-white/5 text-white/30 hover:text-white cursor-pointer rounded"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Status ticker overlay / Order flow state notifier */}
        {statusMsg ? (
          <div className={`p-1.5 rounded text-[9px] font-extrabold text-center uppercase tracking-wider ${
            executingState === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            executingState === 'ERROR' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
            'bg-amber-500/25 text-amber-300 border border-amber-500/30 animate-pulse'
          }`}>
            {statusMsg}
          </div>
        ) : (
          <div className="flex justify-between items-center text-[7.5px] text-white/30 uppercase tracking-widest font-mono">
            <span>Lots: {lotSize.toFixed(2)}</span>
            <span>SL: {stopLossPips}p</span>
            <span>TP: {takeProfitPips}p</span>
          </div>
        )}

        {/* Quick Market Execution Buttons */}
        <div className="grid grid-cols-2 gap-2 pb-0.5 font-bold">
          <button
            onClick={() => handlePlaceOrder('BUY')}
            disabled={executingState === 'SENDING'}
            className="h-8.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] tracking-widest rounded-md cursor-pointer hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1 select-none active:scale-95 transition-all outline-none"
          >
            <Play className="w-3 h-3 fill-white text-white rotate-0" />
            BUY MKT
          </button>
          
          <button
            onClick={() => handlePlaceOrder('SELL')}
            disabled={executingState === 'SENDING'}
            className="h-8.5 bg-rose-600 hover:bg-[#ff5555] text-white font-extrabold text-[10px] tracking-widest rounded-md cursor-pointer hover:shadow-[0_0_12px_rgba(239,68,68,0.25)] flex items-center justify-center gap-1 select-none active:scale-95 transition-all outline-none"
          >
            <Square className="w-2.5 h-2.5 fill-white text-white" />
            SELL MKT
          </button>
        </div>

        {/* Direct Cancel / Panic Close Button */}
        {openPositions.length > 0 && (
          <button
            onClick={handleCloseAllTrades}
            id="panic-close-all-symbol"
            className="w-full h-7 border border-rose-500/40 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/15 text-rose-300 hover:text-white rounded font-bold text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            PANIC CLOSE ({openPositions.length} POSITIONS)
          </button>
        )}

      </div>

    </div>
  );
}
