/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { OrderBook } from '../types';
import { ShieldCheck, BarChart2, Layers, TrendingUp, Scale, ArrowRight, Info, Plus, Minus } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface OrderBookTrackerProps {
  symbol: string;
  orderBook: OrderBook;
}

export default function OrderBookTracker({ symbol, orderBook }: OrderBookTrackerProps) {
  const [activeTab, setActiveTab] = useState<'DOM' | 'IMBALANCE_HIST' | 'CUM_DEPTH'>('DOM');

  // Find maximum amount in both bids & asks to draw relative bars
  const maxAmount = useMemo(() => {
    const bidMax = orderBook.bids.length > 0 ? Math.max(...orderBook.bids.map((b) => b.amount)) : 1;
    const askMax = orderBook.asks.length > 0 ? Math.max(...orderBook.asks.map((a) => a.amount)) : 1;
    return Math.max(bidMax, askMax, 1);
  }, [orderBook]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalBidQty = orderBook.bids.reduce((sum, b) => sum + b.amount, 0);
    const totalAskQty = orderBook.asks.reduce((sum, a) => sum + a.amount, 0);
    const totalQty = totalBidQty + totalAskQty || 1;

    const bidPct = Math.round((totalBidQty / totalQty) * 100);
    const askPct = 100 - bidPct;

    // Find the heavy blocks (institutional liquidity pools)
    const maxBidEntry = orderBook.bids.reduce((max, b) => (b.amount > max.amount ? b : max), { price: 0, amount: 0 });
    const maxAskEntry = orderBook.asks.reduce((max, a) => (a.amount > max.amount ? a : max), { price: 0, amount: 0 });

    return {
      totalBidQty,
      totalAskQty,
      bidPct,
      askPct,
      maxBidEntry,
      maxAskEntry,
    };
  }, [orderBook]);

  // Level-by-level delta dataset
  const imbalanceHistogramData = useMemo(() => {
    const bids = orderBook.bids;
    const asks = orderBook.asks;
    const levels = [];

    // Length of bids and asks is usually 8 from simulator
    const size = Math.min(bids.length, asks.length);
    for (let i = 0; i < size; i++) {
      const bid = bids[i];
      const ask = asks[i];
      // Positive means more buy volume, negative means more sell volume
      const delta = bid.amount - ask.amount;
      levels.push({
        level: `L${i + 1}`,
        bidPrice: bid.price,
        askPrice: ask.price,
        bidAmount: bid.amount,
        askAmount: ask.amount,
        delta: delta,
      });
    }
    return levels;
  }, [orderBook]);

  // Integrated Cumulative Depth Data (price order: low to high)
  const depthChartData = useMemo(() => {
    const bids = [...orderBook.bids]; // closest to furthest (index 0 is closest)
    const asks = [...orderBook.asks]; // closest to furthest (index 0 is closest)

    // Accumulate bids starting from closest going outwards (Bids index 0 is closest)
    let bidCum = 0;
    const bidPoints = bids.map((b) => {
      bidCum += b.amount;
      return {
        price: b.price,
        BidVolume: bidCum,
        AskVolume: 0,
      };
    });
    // For visual correct price X-Axis representation, reverse bids to ascending order
    bidPoints.reverse();

    // Accumulate asks starting from closest going outwards (Asks index 0 is closest)
    let askCum = 0;
    const askPoints = asks.map((a) => {
      askCum += a.amount;
      return {
        price: a.price,
        BidVolume: 0,
        AskVolume: askCum,
      };
    });

    return [...bidPoints, ...askPoints];
  }, [orderBook]);

  // Micro layout helper for custom recharts tooltip to match institutional terminal design
  const CustomHistTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isExcessBid = data.delta >= 0;
      return (
        <div className="bg-[#0b0b0e] border border-white/10 p-3 rounded shadow-xl font-mono text-[11px] space-y-1.5 text-white">
          <p className="text-gray-400 font-bold tracking-tight uppercase border-b border-white/5 pb-1 block mb-1">
            Book Offset: {data.level}
          </p>
          <div className="flex justify-between space-x-6">
            <span className="text-emerald-400">Bid (Buy Limit):</span>
            <span className="font-bold">{data.bidAmount} Lots @ {data.bidPrice}</span>
          </div>
          <div className="flex justify-between space-x-6">
            <span className="text-rose-400">Ask (Sell Limit):</span>
            <span className="font-bold">{data.askAmount} Lots @ {data.askPrice}</span>
          </div>
          <div className="flex justify-between space-x-6 pt-1 border-t border-white/5 font-semibold">
            <span>Net Imbalance:</span>
            <span className={isExcessBid ? 'text-emerald-400' : 'text-rose-400'}>
              {isExcessBid ? `+${data.delta}` : `${data.delta}`} Lots ({(isExcessBid ? 'BULLS' : 'BEARS')})
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDepthTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isBid = data.BidVolume > 0;
      const formattedPrice = data.price;
      return (
        <div className="bg-[#0b0b0e] border border-white/10 p-3 rounded shadow-xl font-mono text-[11px] text-white">
          <p className="text-gray-400 font-bold border-b border-white/5 pb-1 mb-1 text-center">
            Price Level: {formattedPrice}
          </p>
          <div className="flex justify-between space-x-6 my-1">
            <span>Side Class:</span>
            <span className={isBid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {isBid ? 'BIDS (CUMULATIVE BUY)' : 'ASKS (CUMULATIVE SELL)'}
            </span>
          </div>
          <div className="flex justify-between space-x-6 font-semibold">
            <span>Total Depth:</span>
            <span className={isBid ? 'text-emerald-400' : 'text-rose-400'}>
              {isBid ? `${data.BidVolume}` : `${data.AskVolume}`} Lots
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="orderbook-root" className="bg-[#080808] border border-white/10 rounded-lg p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.65)] flex flex-col justify-between">
      <div>
        {/* Main Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/10">
              <BarChart2 className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm md:text-base font-sans tracking-tight">Order Flow & Imbalance</h4>
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Live Institutional Volume Delta</p>
            </div>
          </div>
          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono px-2.5 py-1 rounded select-none uppercase font-bold tracking-wider">
            {symbol}
          </span>
        </div>

        {/* Order imbalance visualizer dial */}
        <div className="mt-4 bg-[#050505] p-3.5 rounded border border-white/5">
          <div className="flex items-center justify-between text-xs font-mono text-white/40">
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              Order Flow Imbalance (OFI)
            </span>
            <span className={orderBook.imbalance >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {orderBook.imbalance >= 0 ? `+${orderBook.imbalance}% Bulls` : `${orderBook.imbalance}% Bears`}
            </span>
          </div>
          
          {/* Centered dial bar */}
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden mt-2.5 border border-white/5">
            <div
              className={`absolute top-0 bottom-0 transition-all duration-500 rounded-full ${
                orderBook.imbalance >= 0 ? 'bg-emerald-500 right-1/2' : 'bg-rose-500 left-1/2'
              }`}
              style={{
                width: `${Math.abs(orderBook.imbalance) / 2}%`,
                transform: orderBook.imbalance >= 0 ? 'translateX(100%)' : 'translateX(-100%)',
              }}
            />
            {/* Center zero mark */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 z-10" />
          </div>

          <p className="text-[10px] text-white/45 mt-2 font-mono text-center leading-relaxed">
            {orderBook.imbalance > 20
              ? '⚡ Strong buy limit imbalance indicating institutional absorption'
              : orderBook.imbalance < -20
              ? '⚡ Strong sell limit imbalance indicating heavy institution distribution'
              : '⚡ Balanced order depth. General retail range consolidation.'}
          </p>
        </div>

        {/* Quick Analytics Bar / Institutional Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4 text-[10px] font-mono">
          <div className="bg-[#060608] border border-white/5 p-2 rounded flex flex-col justify-between">
            <span className="text-white/30 uppercase tracking-wider">Total Bid Liquidity</span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-emerald-400 font-bold text-xs">{stats.totalBidQty} L</span>
              <span className="text-gray-500">({stats.bidPct}%)</span>
            </div>
          </div>
          <div className="bg-[#060608] border border-white/5 p-2 rounded flex flex-col justify-between">
            <span className="text-white/30 uppercase tracking-wider">Total Ask Liquidity</span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-rose-400 font-bold text-xs">{stats.totalAskQty} L</span>
              <span className="text-gray-500">({stats.askPct}%)</span>
            </div>
          </div>
        </div>

        {/* Dynamic Support/Resistance Liquidity Pools */}
        <div className="mt-3.5 bg-[#070709] border border-white/5 px-3 py-2 rounded font-mono text-[9.5px] text-white/50 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              Major Institutional Buy Block:
            </span>
            <span className="text-emerald-400 font-bold">
              {stats.maxBidEntry.amount}L @ ${stats.maxBidEntry.price}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
              Major Institutional Sell Block:
            </span>
            <span className="text-rose-400 font-bold">
              {stats.maxAskEntry.amount}L @ ${stats.maxAskEntry.price}
            </span>
          </div>
        </div>

        {/* HUD Navigation Tabs */}
        <div className="flex items-center border-b border-white/5 mt-4 text-[10px] select-none font-mono tracking-tight text-white/40">
          <button
            id="tab-dom-view"
            onClick={() => setActiveTab('DOM')}
            className={`flex-1 py-2 text-center border-b-2 font-bold cursor-pointer transition-colors ${
              activeTab === 'DOM'
                ? 'text-indigo-400 border-indigo-500/80 bg-indigo-500/[0.02]'
                : 'border-transparent hover:text-white hover:bg-white/[0.01]'
            }`}
          >
            DOM Grid
          </button>
          <button
            id="tab-histogram-view"
            onClick={() => setActiveTab('IMBALANCE_HIST')}
            className={`flex-1 py-2 text-center border-b-2 font-bold cursor-pointer transition-colors ${
              activeTab === 'IMBALANCE_HIST'
                ? 'text-indigo-400 border-indigo-500/80 bg-indigo-500/[0.02]'
                : 'border-transparent hover:text-white hover:bg-white/[0.01]'
            }`}
          >
            Imbalance Delta
          </button>
          <button
            id="tab-depth-curve-view"
            onClick={() => setActiveTab('CUM_DEPTH')}
            className={`flex-1 py-2 text-center border-b-2 font-bold cursor-pointer transition-colors ${
              activeTab === 'CUM_DEPTH'
                ? 'text-indigo-400 border-indigo-500/80 bg-indigo-500/[0.02]'
                : 'border-transparent hover:text-white hover:bg-white/[0.01]'
            }`}
          >
            Depth Curve
          </button>
        </div>

        {/* Content rendering dependent on active tabs */}
        <div className="mt-4 min-h-[178px]">
          {activeTab === 'DOM' && (
            <div className="grid grid-cols-2 gap-4 animate-fadeIn">
              {/* Bids Column (Green buys) */}
              <div>
                <h5 className="font-semibold text-emerald-400 text-[10px] font-mono mb-2 border-b border-emerald-500/10 pb-1 flex justify-between items-center tracking-wider">
                  <span>BIDS (LIQUIDITY SUPPORT)</span>
                  <Plus className="w-3 h-3 text-emerald-500/60" />
                </h5>
                <div className="space-y-1">
                  {orderBook.bids.slice(0, 7).map((entry, idx) => {
                    const widthPct = (entry.amount / maxAmount) * 100;
                    return (
                      <div key={`bid-${idx}`} className="relative flex items-center justify-between py-1 px-1.5 font-mono text-[11px] text-white/70 overflow-hidden">
                        <div
                          className="absolute top-0 bottom-0 left-0 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors rounded"
                          style={{ width: `${widthPct}%` }}
                        />
                        <span className="text-emerald-400/90 relative z-10 font-bold">{entry.price}</span>
                        <span className="text-white/50 relative z-10 font-bold">{entry.amount}L</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Asks Column (Red sells) */}
              <div>
                <h5 className="font-semibold text-rose-400 text-[10px] font-mono mb-2 border-b border-rose-500/10 pb-1 flex justify-between items-center tracking-wider font-bold">
                  <span>ASKS (LIQUIDITY RESISTANCE)</span>
                  <Minus className="w-3 h-3 text-rose-500/60" />
                </h5>
                <div className="space-y-1">
                  {orderBook.asks.slice(0, 7).map((entry, idx) => {
                    const widthPct = (entry.amount / maxAmount) * 100;
                    return (
                      <div key={`ask-${idx}`} className="relative flex items-center justify-between py-1 px-1.5 font-mono text-[11px] text-white/70 overflow-hidden">
                        <div
                          className="absolute top-0 bottom-0 right-0 bg-rose-500/5 hover:bg-rose-500/10 transition-colors rounded"
                          style={{ width: `${widthPct}%` }}
                        />
                        <span className="text-rose-400/90 relative z-10 font-bold">{entry.price}</span>
                        <span className="text-white/50 relative z-10 font-bold">{entry.amount}L</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'IMBALANCE_HIST' && (
            <div className="w-full h-[178px] animate-fadeIn">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={imbalanceHistogramData} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis
                    dataKey="level"
                    stroke="#ffffff"
                    strokeOpacity={0.15}
                    fontSize={9}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis
                    stroke="#ffffff"
                    strokeOpacity={0.15}
                    fontSize={8}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
                  />
                  <Tooltip content={<CustomHistTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                  <Bar dataKey="delta">
                    {imbalanceHistogramData.map((entry, index) => {
                      const isExcessBid = entry.delta >= 0;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={isExcessBid ? 'rgba(52, 211, 153, 0.25)' : 'rgba(248, 113, 113, 0.25)'}
                          stroke={isExcessBid ? '#34d399' : '#f87171'}
                          strokeWidth={1}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === 'CUM_DEPTH' && (
            <div className="w-full h-[178px] animate-fadeIn">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={depthChartData} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorBid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAsk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis
                    dataKey="price"
                    stroke="#ffffff"
                    strokeOpacity={0.15}
                    fontSize={8}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                    tickFormatter={(v) => parseFloat(v).toFixed(symbol === 'USD/JPY' ? 1 : symbol === 'BTC/USDT' ? 0 : 4)}
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
                  <Tooltip content={<CustomDepthTooltip />} />
                  <Area
                    type="stepAfter"
                    dataKey="BidVolume"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorBid)"
                    connectNulls
                  />
                  <Area
                    type="stepAfter"
                    dataKey="AskVolume"
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorAsk)"
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/5 leading-normal flex items-center space-x-2 text-[10.5px] font-mono text-white/30">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Matching liquidity filters confirm active HTF Order Blocks.</span>
      </div>
    </div>
  );
}
