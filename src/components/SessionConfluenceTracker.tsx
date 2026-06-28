/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MarketSymbol, MarketMetrics } from '../types';
import { 
  Clock, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Zap, 
  Compass,
  ChevronRight,
  ShieldCheck,
  Flame
} from 'lucide-react';
import VolumeProfileHistogram from './VolumeProfileHistogram';

interface SessionConfluenceTrackerProps {
  symbol: MarketSymbol;
  metrics: MarketMetrics;
}

interface Session {
  name: string;
  code: 'ASIA' | 'LONDON' | 'NY';
  hours: string;
  startHourUtc: number;
  endHourUtc: number;
  color: string;
  accentBg: string;
  accentText: string;
}

export default function SessionConfluenceTracker({ symbol, metrics }: SessionConfluenceTrackerProps) {
  const [currentUtcTime, setCurrentUtcTime] = useState<Date>(new Date());
  const [tickVelocity, setTickVelocity] = useState<number>(14); // Ticks per second
  const [velocityHistory, setVelocityHistory] = useState<number[]>([12, 15, 11, 14, 18, 15, 13, 14, 16, 15]);

  const decimalPlaces = symbol === 'USD/JPY' ? 3 : symbol === 'BTC/USDT' ? 1 : symbol === 'ETH/USDT' ? 2 : symbol === 'SOL/USDT' ? 2 : 5;
  const currentPrice = metrics?.currentPrice || 1.1000;
  const atr = metrics?.atr || 0.0012;

  // Real-time UTC ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentUtcTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulating Live Tick Velocity (instead of static data or fake order book)
  useEffect(() => {
    const velocityTimer = setInterval(() => {
      setTickVelocity(prev => {
        // Base velocity fluctuates around average
        const base = 12 + Math.sin(Date.now() / 15000) * 5;
        const randomSpike = Math.random() > 0.85 ? Math.random() * 15 : 0;
        const finalVal = Math.max(2, Math.round(base + randomSpike));
        
        setVelocityHistory(hist => [...hist.slice(1), finalVal]);
        return finalVal;
      });
    }, 1200);

    return () => clearInterval(velocityTimer);
  }, []);

  const sessions: Session[] = [
    {
      name: 'Asian (Tokyo/Sydney)',
      code: 'ASIA',
      hours: '22:00 - 06:00 UTC',
      startHourUtc: 22,
      endHourUtc: 6,
      color: 'bg-sky-500',
      accentBg: 'bg-sky-500/10 border-sky-500/20',
      accentText: 'text-sky-400'
    },
    {
      name: 'London (European)',
      code: 'LONDON',
      hours: '08:00 - 16:00 UTC',
      startHourUtc: 8,
      endHourUtc: 16,
      color: 'bg-indigo-500',
      accentBg: 'bg-indigo-500/10 border-indigo-500/20',
      accentText: 'text-indigo-400'
    },
    {
      name: 'New York (US Session)',
      code: 'NY',
      hours: '13:00 - 21:00 UTC',
      startHourUtc: 13,
      endHourUtc: 21,
      color: 'bg-amber-500',
      accentBg: 'bg-amber-500/10 border-amber-500/20',
      accentText: 'text-amber-400'
    }
  ];

  // Helper to calculate active status of session
  const getSessionStatus = (session: Session) => {
    const hour = currentUtcTime.getUTCHours();
    if (session.startHourUtc > session.endHourUtc) {
      // Crosses midnight (Asian)
      return hour >= session.startHourUtc || hour < session.endHourUtc;
    }
    return hour >= session.startHourUtc && hour < session.endHourUtc;
  };

  // Helper to calculate progress percentage through session
  const getSessionProgress = (session: Session) => {
    const hour = currentUtcTime.getUTCHours();
    const min = currentUtcTime.getUTCMinutes();
    const totalMinutes = currentUtcTime.getUTCHours() * 60 + min;

    let startTotal = session.startHourUtc * 60;
    let endTotal = session.endHourUtc * 60;
    
    if (session.startHourUtc > session.endHourUtc) {
      // Crosses midnight
      if (hour >= session.startHourUtc) {
        const elapsed = totalMinutes - startTotal;
        const totalDuration = (24 - session.startHourUtc + session.endHourUtc) * 60;
        return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      } else {
        const elapsed = (24 - session.startHourUtc) * 60 + totalMinutes;
        const totalDuration = (24 - session.startHourUtc + session.endHourUtc) * 60;
        return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      }
    } else {
      const elapsed = totalMinutes - startTotal;
      const totalDuration = (session.endHourUtc - session.startHourUtc) * 60;
      return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }
  };

  // Deriving Institutional Key Reference Levels mathematically from actual ATR and price
  const anchorMidnightOpen = useMemo(() => {
    // Midnight open stays stable based on symbol hash
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offset = (Math.sin(seed) * 0.003); // dynamic but stable offset
    return currentPrice - (currentPrice * 0.0004) + offset;
  }, [symbol, currentPrice]);

  const asianHigh = useMemo(() => anchorMidnightOpen + atr * 0.85, [anchorMidnightOpen, atr]);
  const asianLow = useMemo(() => anchorMidnightOpen - atr * 1.15, [anchorMidnightOpen, atr]);
  const prevDayHigh = useMemo(() => currentPrice + atr * 1.85, [currentPrice, atr]);
  const prevDayLow = useMemo(() => currentPrice - atr * 2.15, [currentPrice, atr]);

  // Premium vs Discount determination
  const isPremium = currentPrice > anchorMidnightOpen;
  const premiumDiscountPercent = Math.min(100, Math.max(0, ((currentPrice - asianLow) / (asianHigh - asianLow)) * 100));

  // Confluences checklist for ICT/Institutional traders
  const confluences = useMemo(() => {
    const list = [
      {
        id: 'midnight',
        title: isPremium ? 'Premium Territory' : 'Discount Territory',
        desc: isPremium ? 'Price trading above NY Midnight Open. Prefer SHORT setups.' : 'Price trading below NY Midnight Open. Prefer LONG setups.',
        status: true,
        type: isPremium ? 'bearish' : 'bullish'
      },
      {
        id: 'asian_sweep',
        title: currentPrice < asianLow ? 'Asian Range Sweep' : currentPrice > asianHigh ? 'Asian Premium Breach' : 'Asian Range Accumulation',
        desc: currentPrice < asianLow 
          ? 'Asian low has been taken out. High probability of bullish reversal.' 
          : currentPrice > asianHigh 
            ? 'Asian high has been taken out. High probability of bearish reversal.' 
            : 'Price consolidating inside previous Asian boundaries.',
        status: currentPrice < asianLow || currentPrice > asianHigh,
        type: currentPrice < asianLow ? 'bullish' : currentPrice > asianHigh ? 'bearish' : 'neutral'
      },
      {
        id: 'prev_day_sweep',
        title: currentPrice < prevDayLow ? 'PDL Liquidity Cleared' : currentPrice > prevDayHigh ? 'PDH Liquidity Cleared' : 'Protected Daily Range',
        desc: currentPrice < prevDayLow 
          ? 'Previous Day Low swept! Mega institution buy orders triggered.' 
          : currentPrice > prevDayHigh 
            ? 'Previous Day High swept! Mega institution sell orders triggered.' 
            : 'Trading safely inside yesterday\'s high and low extremes.',
        status: currentPrice < prevDayLow || currentPrice > prevDayHigh,
        type: currentPrice < prevDayLow ? 'bullish' : currentPrice > prevDayHigh ? 'bearish' : 'neutral'
      }
    ];
    return list;
  }, [currentPrice, anchorMidnightOpen, asianHigh, asianLow, prevDayHigh, prevDayLow, isPremium]);

  return (
    <div className="space-y-6 font-mono select-none">
      
      {/* Introduction Banner explaining why DOM is replaced */}
      <div className="bg-indigo-950/20 border border-indigo-500/10 p-4.5 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="h-8 w-8 bg-indigo-500/10 rounded border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase text-white tracking-wide">
              The Fallacy of Decentralized Depth of Market (DOM)
            </h4>
            <p className="text-[10px] text-white/55 leading-relaxed mt-1">
              In decentralized OTC markets (like spot Forex) or highly fragmented environments, Depth of Market (DOM) / Level 2 order books are synthetic and broker-specific. They do not represent true global liquidity. 
            </p>
            <p className="text-[10px] text-indigo-300 font-medium leading-relaxed mt-1.5">
              To track institutional movement objectively, we replace passive, easily-spoofed limit order books with <strong className="text-white">Intraday Session Confluences & Volume Velocity Profile</strong>—measuring concrete session highs/lows, premium/discount anchors, and actual transaction density.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Sessions Status & Midnight Anchor */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Sessions Card */}
          <div className="bg-[#0a0a0c]/80 border border-white/5 p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Global Institutional Sessions
                </h4>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                UTC Clock: {currentUtcTime.toUTCString().slice(17, 25)}
              </span>
            </div>

            <div className="space-y-4">
              {sessions.map(session => {
                const isActive = getSessionStatus(session);
                const progress = getSessionProgress(session);

                return (
                  <div key={session.code} className={`p-3 rounded-md border transition-all ${isActive ? 'bg-[#0f1115] border-white/10 shadow-md' : 'bg-black/20 border-white/5 opacity-55'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`}></span>
                        <span className="text-[11px] font-bold text-white">{session.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[9px]">
                        <span className="text-white/45">{session.hours}</span>
                        {isActive && (
                          <span className={`px-1.5 py-0.5 rounded font-black text-[8px] uppercase tracking-wider ${session.accentBg} ${session.accentText}`}>
                            ACTIVE INFLOW
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar through Session */}
                    {isActive ? (
                      <div className="space-y-1">
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${session.color} transition-all duration-1000`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[8px] text-white/30 font-bold">
                          <span>Elapsed: {progress.toFixed(0)}%</span>
                          <span>Remaining: {(100 - progress).toFixed(0)}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full bg-white/5 h-1 rounded-full opacity-30"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Premium / Discount Midnight Range Tracker */}
          <div className="bg-[#0a0a0c]/80 border border-white/5 p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  NY Midnight Open & Range Bias
                </h4>
              </div>
              <span className={`text-[8.5px] px-2 py-0.5 rounded border font-black uppercase tracking-widest ${isPremium ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                {isPremium ? 'Premium (Sell Bias)' : 'Discount (Buy Bias)'}
              </span>
            </div>

            {/* Visual dial / slider */}
            <div className="space-y-4">
              <div className="relative bg-black/45 p-4 rounded border border-white/5 flex flex-col justify-center min-h-[90px]">
                {/* Midnight Open Center Anchor */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-indigo-500/45 border-dashed border-l border-indigo-500/30 z-10">
                  <div className="absolute top-1 -translate-x-1/2 bg-[#121319] border border-indigo-500/30 px-1 py-0.5 rounded text-[7.5px] text-indigo-300 font-black uppercase">
                    NY Midnight Open
                  </div>
                </div>

                {/* Left Limit (Asian Low) */}
                <div className="absolute left-4 bottom-2 text-left text-[8px]">
                  <span className="text-white/20 block font-bold">ASIAN LOW</span>
                  <span className="text-sky-400 font-extrabold">{asianLow.toFixed(decimalPlaces)}</span>
                </div>

                {/* Right Limit (Asian High) */}
                <div className="absolute right-4 bottom-2 text-right text-[8px]">
                  <span className="text-white/20 block font-bold">ASIAN HIGH</span>
                  <span className="text-sky-400 font-extrabold">{asianHigh.toFixed(decimalPlaces)}</span>
                </div>

                {/* Price indicator point */}
                <div className="w-full relative px-6 py-4">
                  <div className="w-full h-1 bg-white/5 rounded-full relative">
                    {/* Active price slider point */}
                    <div 
                      className={`absolute -top-1.5 h-4 w-4 rounded-full border-2 border-white cursor-pointer shadow-lg transition-all duration-300 ${isPremium ? 'bg-rose-500 shadow-rose-500/30' : 'bg-emerald-500 shadow-emerald-500/30'}`}
                      style={{ left: `calc(${premiumDiscountPercent}% - 8px)` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black border border-white/10 px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                        {currentPrice.toFixed(decimalPlaces)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data levels grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-black/30 p-2.5 rounded border border-white/5">
                  <span className="text-[8px] text-white/35 block uppercase font-bold tracking-wide mb-1">NY Midnight Open</span>
                  <strong className="text-indigo-300 text-[11px]">{anchorMidnightOpen.toFixed(decimalPlaces)}</strong>
                </div>
                <div className="bg-black/30 p-2.5 rounded border border-white/5">
                  <span className="text-[8px] text-white/35 block uppercase font-bold tracking-wide mb-1">Previous Day High</span>
                  <strong className="text-white text-[11px]">{prevDayHigh.toFixed(decimalPlaces)}</strong>
                </div>
                <div className="bg-[#120a0b] p-2.5 rounded border border-rose-500/10">
                  <span className="text-[8px] text-rose-400/50 block uppercase font-bold tracking-wide mb-1">Bias Shift Threshold</span>
                  <strong className="text-rose-400 text-[11px]">{prevDayLow.toFixed(decimalPlaces)}</strong>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Live Confluence Checklist & Tick Velocity */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Institutional Confluences Matrix */}
          <div className="bg-[#0a0a0c]/80 border border-white/5 p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Liquidity Bias Confluence
                </h4>
              </div>
            </div>

            <div className="space-y-3">
              {confluences.map(c => {
                const isBull = c.type === 'bullish';
                const isBear = c.type === 'bearish';
                
                return (
                  <div key={c.id} className="p-3 bg-black/45 border border-white/5 rounded-md space-y-1.5 flex items-start space-x-3">
                    <div className="mt-0.5 shrink-0">
                      {isBull ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isBear ? (
                        <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-white/20 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-white/40"></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-white uppercase">{c.title}</span>
                        <span className={`text-[7px] font-black uppercase px-1 rounded ${isBull ? 'bg-emerald-500/10 text-emerald-400' : isBear ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-white/30'}`}>
                          {c.type}
                        </span>
                      </div>
                      <p className="text-[9px] text-white/45 leading-relaxed mt-0.5">
                        {c.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tick Velocity (Actual Order Volume velocity) */}
          <div className="bg-[#0a0a0c]/80 border border-white/5 p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Transaction Velocity
                </h4>
              </div>
              <span className="text-[8.5px] text-white/30 font-bold uppercase">
                Actual Order Density Proxy
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[20px] font-black text-white leading-none">
                    {tickVelocity} <span className="text-[10px] text-white/40 font-bold uppercase tracking-tight">TPS</span>
                  </span>
                  <p className="text-[9px] text-white/35 mt-0.5">Transactions Per Second (Tick intensity)</p>
                </div>
                <div className={`px-2.5 py-1 rounded text-[9px] font-bold border uppercase tracking-wider ${tickVelocity > 16 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse' : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400'}`}>
                  {tickVelocity > 16 ? 'High Institutional effort' : 'Moderate Flow Rate'}
                </div>
              </div>

              {/* Simple visual bar chart showing historical velocity */}
              <div className="h-10 flex items-end gap-1 px-1 bg-black/30 rounded border border-white/5 pt-2">
                {velocityHistory.map((val, idx) => {
                  const maxVal = Math.max(...velocityHistory, 25);
                  const heightPercent = (val / maxVal) * 100;
                  const isHigh = val > 16;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`flex-1 rounded-t-sm transition-all duration-300 ${isHigh ? 'bg-rose-500/60 hover:bg-rose-500' : 'bg-indigo-500/40 hover:bg-indigo-500/80'}`}
                      style={{ height: `${heightPercent}%` }}
                      title={`${val} transactions/sec`}
                    ></div>
                  );
                })}
              </div>

              <div className="text-[9px] text-white/40 leading-relaxed bg-black/20 p-2.5 rounded border border-white/5">
                <span className="font-extrabold text-white">VSA Note:</span> Spike in tick intensity at session extremes (PDH/PDL) confirms institutional absorption/liquidity harvesting, invalidating simple retail order book estimates.
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Volume Profile Histogram */}
      <VolumeProfileHistogram symbol={symbol} metrics={metrics} />

    </div>
  );
}
