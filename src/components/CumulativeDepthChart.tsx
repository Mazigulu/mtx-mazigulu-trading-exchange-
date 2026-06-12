/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { OrderBook } from '../types';
import { BarChart2, Activity, Info, ZoomIn, ZoomOut, Maximize2, Scale } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface CumulativeDepthChartProps {
  symbol: string;
  orderBook: OrderBook;
}

export default function CumulativeDepthChart({ symbol, orderBook }: CumulativeDepthChartProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(8); // Support limiting visibility depth default 8 levels

  // Derive highest bid and lowest ask
  const highestBid = useMemo(() => {
    return orderBook.bids.length > 0 ? orderBook.bids[0].price : 0;
  }, [orderBook]);

  const lowestAsk = useMemo(() => {
    return orderBook.asks.length > 0 ? orderBook.asks[0].price : 0;
  }, [orderBook]);

  const midPrice = useMemo(() => {
    if (highestBid && lowestAsk) {
      return (highestBid + lowestAsk) / 2;
    }
    return highestBid || lowestAsk || 0;
  }, [highestBid, lowestAsk]);

  // Total available depth sums
  const totals = useMemo(() => {
    const totalBidQty = orderBook.bids.slice(0, zoomLevel).reduce((sum, b) => sum + b.amount, 0);
    const totalAskQty = orderBook.asks.slice(0, zoomLevel).reduce((sum, a) => sum + a.amount, 0);
    const totalCombined = totalBidQty + totalAskQty || 1;
    const bidPercentage = Math.round((totalBidQty / totalCombined) * 100);
    const askPercentage = 100 - bidPercentage;
    const netImbalance = totalBidQty - totalAskQty;

    return {
      totalBidQty,
      totalAskQty,
      bidPercentage,
      askPercentage,
      netImbalance,
    };
  }, [orderBook, zoomLevel]);

  // Aggregate step-chart data
  const depthData = useMemo(() => {
    const bidsSlice = [...orderBook.bids].slice(0, zoomLevel);
    const asksSlice = [...orderBook.asks].slice(0, zoomLevel);

    // Cumulative Bids (ascending price order)
    let bidSum = 0;
    const bidPoints = bidsSlice.map((b) => {
      bidSum += b.amount;
      return {
        price: b.price,
        cumulativeBid: bidSum,
        cumulativeAsk: null,
      };
    });
    // Reverse so lowest price bid is first, highest price is last
    bidPoints.reverse();

    // Cumulative Asks (ascending price order)
    let askSum = 0;
    const askPoints = asksSlice.map((a) => {
      askSum += a.amount;
      return {
        price: a.price,
        cumulativeBid: null,
        cumulativeAsk: askSum,
      };
    });

    // Create immediate boundary points to form clean step chart transitions dropped to zero at mid
    const stepMiddleBid = bidPoints.length > 0 ? {
      price: bidPoints[bidPoints.length - 1].price,
      cumulativeBid: 0,
      cumulativeAsk: null,
    } : null;

    const stepMiddleAsk = askPoints.length > 0 ? {
      price: askPoints[0].price,
      cumulativeBid: null,
      cumulativeAsk: 0,
    } : null;

    const dataset = [];

    // Push bids
    dataset.push(...bidPoints);
    if (stepMiddleBid) dataset.push(stepMiddleBid);

    // Spacer middle price
    dataset.push({
      price: midPrice,
      cumulativeBid: 0,
      cumulativeAsk: 0,
    });

    // Push asks
    if (stepMiddleAsk) dataset.push(stepMiddleAsk);
    dataset.push(...askPoints);

    return dataset;
  }, [orderBook, zoomLevel, midPrice]);

  // Helper for decimals depending on symbol
  const priceDecimals = useMemo(() => {
    if (symbol === 'BTC/USDT') return 1;
    if (symbol === 'USD/JPY') return 3;
    return 5;
  }, [symbol]);

  // Custom high precision institutional tooltip
  const CustomDepthTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isBidRange = data.price < midPrice;
      const distFromMid = Math.abs(data.price - midPrice);
      const prcDistPct = midPrice > 0 ? ((distFromMid / midPrice) * 100).toFixed(2) : '0.00';

      const showBid = isBidRange && typeof data.cumulativeBid === 'number' && data.cumulativeBid > 0;
      const showAsk = !isBidRange && typeof data.cumulativeAsk === 'number' && data.cumulativeAsk > 0;

      return (
        <div className="bg-[#0b0b0f] border border-white/10 p-3 rounded-lg shadow-2xl font-mono text-[10.5px] text-white/90 space-y-1.5 min-w-[210px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-1 block mb-1">
            <span className="text-white/40 uppercase tracking-widest text-[8.5px]">Price level</span>
            <span className="text-[#a5b4fc] font-black">{data.price.toFixed(priceDecimals)}</span>
          </div>

          <div className="flex justify-between space-x-6 text-[10px]">
            <span className="text-white/40">Distance to Mid:</span>
            <span className="font-semibold text-white/70">
              {distFromMid.toFixed(priceDecimals)} ({prcDistPct}%)
            </span>
          </div>

          {showBid && (
            <div className="flex justify-between space-x-6 pt-1">
              <span className="text-emerald-400 font-extrabold">Bid Stack (Cumulative):</span>
              <span className="font-black text-emerald-300">{data.cumulativeBid} L</span>
            </div>
          )}

          {showAsk && (
            <div className="flex justify-between space-x-6 pt-1">
              <span className="text-rose-400 font-extrabold">Ask Stack (Cumulative):</span>
              <span className="font-black text-rose-300">{data.cumulativeAsk} L</span>
            </div>
          )}

          <div className="text-[8px] text-white/20 uppercase tracking-wider text-center pt-1.5 border-t border-white/5">
            Institutional Limit Order Book
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="cumulative-depth-wrapper" className="bg-[#08080a] border border-white/10 rounded-lg p-4 md:p-5 shadow-xl flex flex-col justify-between font-sans">
      
      {/* 1. Header with details and zoom buttons */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-500/10 rounded text-indigo-400 border border-indigo-500/15">
            <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Cumulative Depth Curve</h4>
            <p className="text-[9px] text-white/40 font-mono tracking-tight uppercase">Wall volume against price offsets</p>
          </div>
        </div>

        {/* Dynamic Zoom Control */}
        <div className="flex items-center space-x-1.5 bg-[#050505] p-1 rounded border border-white/5">
          <button
            onClick={() => setZoomLevel((prev) => Math.max(3, prev - 1))}
            disabled={zoomLevel <= 3}
            title="Narrow Depth Grid"
            className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white disabled:opacity-20 cursor-pointer transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9.5px] font-mono font-bold text-white/60 px-1.5 pb-0.5">{zoomLevel} Lvl</span>
          <button
            onClick={() => setZoomLevel((prev) => Math.min(10, prev + 1))}
            disabled={zoomLevel >= 10}
            title="Expand Depth Grid"
            className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white disabled:opacity-20 cursor-pointer transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Step-chart plot container */}
      <div className="mt-4 w-full h-[185px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={depthData} margin={{ top: 10, right: 3, left: -26, bottom: 0 }}>
            <defs>
              <linearGradient id="curveBid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="curveAsk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="price"
              stroke="#ffffff"
              strokeOpacity={0.15}
              fontSize={8.5}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
              dy={5}
              domain={['auto', 'auto']}
              tickFormatter={(v) => typeof v === 'number' ? v.toFixed(priceDecimals) : v}
            />
            <YAxis
              stroke="#ffffff"
              strokeOpacity={0.15}
              fontSize={8}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}L`}
            />
            <Tooltip content={<CustomDepthTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
            
            {/* Visual marker of the mid price split between Bid/Ask walls */}
            <ReferenceLine
              x={midPrice}
              stroke="rgba(241, 245, 249, 0.25)"
              strokeDasharray="2 3"
              strokeWidth={1}
              label={{
                value: `MID ${midPrice.toFixed(priceDecimals)}`,
                position: 'top',
                fill: 'rgba(255, 255, 255, 0.4)',
                fontSize: 7.5,
                fontFamily: 'monospace',
                offset: 10,
              }}
            />

            {/* Bids Step Area */}
            <Area
              type="stepBefore"
              dataKey="cumulativeBid"
              stroke="#10b981"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#curveBid)"
              connectNulls={false}
              name="Bids"
            />
            {/* Asks Step Area */}
            <Area
              type="stepAfter"
              dataKey="cumulativeAsk"
              stroke="#ef4444"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#curveAsk)"
              connectNulls={false}
              name="Asks"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Cumulative Imbalance dial bar */}
      <div className="mt-4 bg-[#050507] p-2.5 rounded border border-white/5 font-mono text-[9px]">
        <div className="flex items-center justify-between text-white/40 font-bold">
          <span className="flex items-center gap-1">
            <Scale className="w-3 h-3 text-indigo-400" />
            Cumulative Depth Imbalance
          </span>
          <span className={totals.netImbalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {totals.netImbalance >= 0 ? `+${totals.netImbalance.toFixed(0)}L Bull Bias` : `${totals.netImbalance.toFixed(0)}L Bear Bias`}
          </span>
        </div>
        
        {/* Fill Gauge */}
        <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden mt-2 flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${totals.bidPercentage}%` }}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300 flex-1"
            style={{ width: `${totals.askPercentage}%` }}
          />
        </div>
        
        {/* Percent labels */}
        <div className="flex items-center justify-between text-[8px] text-white/35 mt-1.5 font-bold">
          <span className="text-emerald-400">BIDS: {totals.bidPercentage}% ({totals.totalBidQty.toFixed(0)}L)</span>
          <span className="text-rose-400">ASKS: {totals.askPercentage}% ({totals.totalAskQty.toFixed(0)}L)</span>
        </div>
      </div>

    </div>
  );
}
