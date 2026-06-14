/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MarketSymbol } from '../types';
import { 
  ShieldAlert, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Activity, 
  Sliders, 
  Layers,
  ArrowUpRight,
  Info,
  DollarSign
} from 'lucide-react';

interface SweepEvent {
  id: string;
  symbol: MarketSymbol;
  timestamp: string;
  price: number;
  lots: number;
  type: 'BUY_SIDE' | 'SELL_SIDE'; // BSL or SSL
  zone: string;
  imbalancePct: number;
}

const SYMBOLS: MarketSymbol[] = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP',
  'GOLD/USD', 'SILVER/USD',
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
  'US30', 'NAS100', 'GER40', 'SPX500'
];

const SWEEP_ZONES = [
  'Previous Day High Rest-Pool',
  'Previous Day Low Stop-Pool',
  '4H Fair Value Gap Void',
  'Weekly Liquidity Equilibrium',
  'Asia Session Swing High',
  'London Swing Low Sweep',
  'Retail Double Top Trigger',
  'Retail Double Bottom Hunt',
  'High Timeframe Daily Range Limit',
  'Orderbook Level-8 Dense Liquidity'
];

export default function InstitutionalSweepAlert() {
  const [alerts, setAlerts] = useState<SweepEvent[]>([]);
  const [minThresholdLots, setMinThresholdLots] = useState<number>(500);
  const [selectedSymbol, setSelectedSymbol] = useState<MarketSymbol | 'ALL'>('ALL');
  const [isLive, setIsLive] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [flashId, setFlashId] = useState<string | null>(null);

  // Cumulative metrics
  const [totalSweptLots, setTotalSweptLots] = useState<number>(0);
  const [bslCount, setBslCount] = useState<number>(0);
  const [sslCount, setSslCount] = useState<number>(0);

  // Frequency rate: interval delay in ms (1500ms to 6000ms)
  const [simulateIntervalMs, setSimulateIntervalMs] = useState<number>(3000);

  // Web Audio Synth for sweet retro terminal sounds
  const playChime = (type: 'BUY_SIDE' | 'SELL_SIDE') => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Synth design
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'BUY_SIDE') {
        // High ascending sweet chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      } else {
        // Warning descending sweep chime
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.2);
      }
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) {
      // Audio auto-play block bypass
    }
  };

  // Populate default base log
  useEffect(() => {
    const historicalTime = (offsetMins: number) => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - offsetMins);
      return d.toLocaleTimeString();
    };

    const initialLogs: SweepEvent[] = [
      {
        id: 'initial-1',
        symbol: 'EUR/USD',
        timestamp: historicalTime(12),
        price: 1.08450,
        lots: 742,
        type: 'BUY_SIDE',
        zone: 'Previous Day High Rest-Pool',
        imbalancePct: 82
      },
      {
        id: 'initial-2',
        symbol: 'BTC/USDT',
        timestamp: historicalTime(25),
        price: 68420.50,
        lots: 1250,
        type: 'SELL_SIDE',
        zone: 'Retail Double Bottom Hunt',
        imbalancePct: 91
      },
      {
        id: 'initial-3',
        symbol: 'GOLD/USD',
        timestamp: historicalTime(41),
        price: 2315.40,
        lots: 680,
        type: 'BUY_SIDE',
        zone: 'Asia Session Swing High',
        imbalancePct: 78
      }
    ];

    setAlerts(initialLogs);
    setTotalSweptLots(742 + 1250 + 680);
    setBslCount(2);
    setSslCount(1);
  }, []);

  // Interval simulation loop
  useEffect(() => {
    if (!isLive) return;

    const interval = setTimeout(async () => {
      // Pick a random symbol
      const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      
      // Fetch latest price if possible, or randomize realistically
      let price = 1.0;
      if (sym.startsWith('EUR')) price = 1.08 + Math.random() * 0.01;
      else if (sym.startsWith('GBP')) price = 1.27 + Math.random() * 0.01;
      else if (sym.startsWith('USD/JPY')) price = 156.40 + Math.random() * 1.5;
      else if (sym.startsWith('BTC')) price = 67000 + Math.random() * 3000;
      else if (sym.startsWith('ETH')) price = 3400 + Math.random() * 200;
      else if (sym.startsWith('SOL')) price = 145 + Math.random() * 15;
      else if (sym.startsWith('GOLD')) price = 2300 + Math.random() * 50;
      else if (sym.startsWith('SILVER')) price = 29.50 + Math.random() * 1.5;
      else if (sym.startsWith('NAS') || sym.startsWith('SPX')) price = 18000 + Math.random() * 500;
      else price = 39000 + Math.random() * 1000;

      // Random lot size of the executed block order (some small, some giant)
      const isGiant = Math.random() < 0.45;
      const lots = isGiant 
        ? Math.floor(Math.random() * 1800) + 500 
        : Math.floor(Math.random() * 380) + 60;

      const typeValue = Math.random() > 0.5 ? 'BUY_SIDE' : 'SELL_SIDE';
      const zoneString = SWEEP_ZONES[Math.floor(Math.random() * SWEEP_ZONES.length)];
      
      // If the randomized lot size exceeds the MIN lots threshold we trigger alert
      if (lots >= minThresholdLots) {
        const newAlert: SweepEvent = {
          id: `sweep-${Date.now()}`,
          symbol: sym,
          timestamp: new Date().toLocaleTimeString(),
          price: parseFloat(price.toFixed(sym === 'USD/JPY' ? 2 : sym.includes('BTC') ? 1 : 5)),
          lots: lots,
          type: typeValue,
          zone: zoneString,
          imbalancePct: Math.floor(Math.random() * 25) + 75 // 75-99% imbalance on block sweeps
        };

        // Prepend to array
        setAlerts(prev => [newAlert, ...prev].slice(0, 50));
        setTotalSweptLots(prev => prev + lots);
        if (typeValue === 'BUY_SIDE') setBslCount(b => b + 1);
        else setSslCount(s => s + 1);

        // Visual flash trigger
        setFlashId(newAlert.id);
        setTimeout(() => setFlashId(null), 800);

        // Play synth chime
        playChime(typeValue);
      }

    }, simulateIntervalMs);

    return () => clearTimeout(interval);
  }, [isLive, minThresholdLots, simulateIntervalMs, isMuted]);

  // Filtering criteria
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      // Size filter matches
      if (a.lots < minThresholdLots) return false;
      // Symbol filter
      if (selectedSymbol !== 'ALL' && a.symbol !== selectedSymbol) return false;
      return true;
    });
  }, [alerts, minThresholdLots, selectedSymbol]);

  const bslPct = useMemo(() => {
    const total = bslCount + sslCount;
    if (total === 0) return 50;
    return Math.round((bslCount / total) * 100);
  }, [bslCount, sslCount]);

  return (
    <div id="institutional-sweep-alerts-card" className="bg-[#0c0c0e]/95 border border-white/5 rounded-lg p-5 md:p-6 flex flex-col justify-between h-auto select-none mt-6">
      
      {/* 1. Header Portion with Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-500/10 pb-4 mb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 rounded border border-indigo-500/25 text-indigo-400 shrink-0">
            <ShieldAlert className="w-4 h-4 animate-pulse text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              Institutional Sweep Alert (BSL/SSL)
              <span className="text-[8px] font-mono font-extrabold bg-rose-500/15 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded leading-none">
                L2 DEPTH SPIKES
              </span>
            </h3>
            <p className="text-[9.5px] text-white/40 font-sans mt-0.5">
              Tracks real-time institutional liquidity raid triggers where filled limit queues exceed predefined size thresholds.
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live stream status */}
          <button
            id="btn-sweep-toggle-stream"
            onClick={() => setIsLive(!isLive)}
            className={`px-2.5 py-1.5 rounded font-mono text-[9px] font-black border transition-all cursor-pointer flex items-center gap-1.5 uppercase ${
              isLive 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-white/5 border-white/10 text-white/40'
            }`}
          >
            {isLive ? <Play className="w-3 h-3 fill-emerald-400" /> : <Pause className="w-3 h-3" />}
            {isLive ? 'ACTIVE FEED' : 'PAUSED'}
          </button>

          {/* Sound Alert Mute */}
          <button
            id="btn-sweep-toggle-sound"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Enable Synthetic Audio Chimes on Spikes" : "Mute Sweep Auditives"}
            className={`px-2 py-1.5 rounded border font-mono text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              !isMuted 
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' 
                : 'bg-[#050505]/40 border-white/5 text-white/30'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-300" />}
            <span>CHIMES</span>
          </button>

          {/* Recycle log */}
          <button
            id="btn-sweep-clear-logs"
            onClick={() => {
              setAlerts([]);
              setTotalSweptLots(0);
              setBslCount(0);
              setSslCount(0);
            }}
            title="Clear live logs cache"
            className="p-1.5 bg-[#050505] border border-white/5 text-white/40 hover:text-rose-400 hover:border-rose-500/20 rounded hover:bg-rose-500/5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top-tier Synthesis stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Total Volumes Swept */}
        <div className="bg-[#050507] border border-white/5 rounded-lg p-3 flex items-center justify-between font-mono text-[9px]">
          <div>
            <span className="text-white/30 block uppercase font-bold tracking-tight">Total Volume Aggregated</span>
            <span className="text-xs text-white font-extrabold mt-0.5 block">{totalSweptLots.toLocaleString()} Lots</span>
          </div>
          <Activity className="w-4 h-4 text-indigo-400/50" />
        </div>

        {/* BSL Capture counts */}
        <div className="bg-[#050507] border border-white/5 rounded-lg p-3 flex flex-col justify-between font-mono text-[9px]">
          <div className="flex justify-between items-center">
            <span className="text-emerald-400/80 block uppercase font-black tracking-tight flex items-center gap-1">
              • Buy-Side Sweeps (BSL)
            </span>
            <span className="text-white font-bold">{bslCount} events</span>
          </div>
          <div className="w-full bg-[#030303] h-1.5 rounded overflow-hidden mt-1.5 relative border border-white/5">
            <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${bslPct}%` }} />
          </div>
        </div>

        {/* SSL Capture counts */}
        <div className="bg-[#050507] border border-white/5 rounded-lg p-3 flex flex-col justify-between font-mono text-[9px]">
          <div className="flex justify-between items-center">
            <span className="text-rose-400/80 block uppercase font-black tracking-tight flex items-center gap-1">
              • Sell-Side Sweeps (SSL)
            </span>
            <span className="text-white font-bold">{sslCount} events</span>
          </div>
          <div className="w-full bg-[#030303] h-1.5 rounded overflow-hidden mt-1.5 relative border border-white/5">
            <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${100 - bslPct}%` }} />
          </div>
        </div>
      </div>

      {/* 3. Sliding Threshold controls */}
      <div className="bg-[#050507] border border-white/5 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Slider trigger */}
          <div className="md:col-span-6 space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-indigo-300 font-bold flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Minimum Sweep Threshold:
              </span>
              <span className="text-white font-black bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15">
                {minThresholdLots} Lots
              </span>
            </div>
            <input 
              type="range"
              min="100"
              max="1500"
              step="50"
              value={minThresholdLots}
              onChange={(e) => setMinThresholdLots(parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-white/5 hover:bg-white/10 rounded-lg appearance-none cursor-pointer mt-1"
            />
            <div className="flex justify-between text-[8px] text-white/35 font-mono">
              <span>100 Lots (Sensitive)</span>
              <span>1,500 Lots (Major Blocks Only)</span>
            </div>
          </div>

          {/* Simulation Frequency rate slider */}
          <div className="md:col-span-4 space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-indigo-300 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Update Interval speed:
              </span>
              <span className="text-white font-normal">
                {(simulateIntervalMs / 1000).toFixed(1)}s
              </span>
            </div>
            <input 
              type="range"
              min="1500"
              max="6500"
              step="500"
              value={simulateIntervalMs}
              onChange={(e) => setSimulateIntervalMs(parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-white/5 hover:bg-white/10 rounded-lg appearance-none cursor-pointer mt-1"
            />
            <div className="flex justify-between text-[8px] text-white/35 font-mono">
              <span>HFT Fast (1.5s)</span>
              <span>Calibrated (6.5s)</span>
            </div>
          </div>

          {/* Asset Filtering Column */}
          <div className="md:col-span-2 flex flex-col justify-end">
            <span className="text-[8.5px] font-mono text-white/30 uppercase tracking-tight block mb-1">Pair Filter:</span>
            <select
              id="sweep-pair-filter"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value as any)}
              className="bg-[#050505] text-[10px] text-indigo-200 border border-indigo-500/20 hover:border-indigo-500/45 rounded px-2 py-1.5 font-mono outline-none cursor-pointer w-full text-center"
            >
              <option value="ALL">ALL PAIRS</option>
              {SYMBOLS.map(sym => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* 4. Active Sweeps alerts output list */}
      <div className="bg-[#030305] border border-white/5 rounded-xl overflow-hidden max-h-[310px] overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-white/30">
            <Info className="w-5 h-5 text-indigo-500/40 mb-2" />
            <span className="text-[10px] font-mono uppercase tracking-wider block">No sweeps logged exceeding threshold in session.</span>
            <p className="text-[9px] font-sans text-white/20 mt-1 max-w-xs">
              Decline minimum slider to capture smaller block sizes or toggle Active Feed to begin streaming live.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 select-none font-mono text-[10px]">
            {filteredAlerts.map((alert) => {
              const isFlashed = flashId === alert.id;
              const isBSL = alert.type === 'BUY_SIDE';
              
              return (
                <div 
                  key={alert.id}
                  className={`p-3 md:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-300 ${
                    isFlashed 
                      ? 'bg-indigo-500/10' 
                      : 'hover:bg-white/[0.01]'
                  }`}
                >
                  {/* Left Side: Time, Badge, Symbol */}
                  <div className="flex items-center space-x-3.5">
                    {/* Time frame */}
                    <div className="flex items-center text-white/30 space-x-1 shrink-0 text-[10px]">
                      <Clock className="w-3.5 h-3.5 text-white/25" />
                      <span>{alert.timestamp}</span>
                    </div>

                    {/* BSL/SSL Badge */}
                    <span className={`px-2 py-1.5 rounded font-black text-[9px] tracking-wide shrink-0 border text-center font-mono leading-none flex items-center gap-1.5 ${
                      isBSL
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                      {isBSL ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-rose-400" />}
                      {isBSL ? 'BSL ACCUM' : 'SSL DISTRIB'}
                    </span>

                    {/* Target Symbol */}
                    <span className="text-white font-extrabold text-[11px] font-mono tracking-tight shrink-0">{alert.symbol}</span>
                  </div>

                  {/* Mid Section: Target zone info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-white/35 font-sans block text-[8px] uppercase tracking-wide">Liquidity Zone Target:</span>
                    <span className="text-white/70 block text-[10.5px] truncate font-sans font-medium">{alert.zone}</span>
                  </div>

                  {/* Right Side: Price, Lot size & Arrow indicator */}
                  <div className="flex items-center space-x-4 justify-between sm:justify-end">
                    
                    {/* Size and Pricing stats */}
                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <span className="text-white/35 block text-[8px] uppercase tracking-tight">Swiped Size</span>
                        <span className={`font-black text-[11px] ${isBSL ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {alert.lots.toLocaleString()} Lots
                        </span>
                      </div>
                      <div className="border-l border-white/5 pl-3">
                        <span className="text-white/35 block text-[8px] uppercase tracking-tight">Raid Price</span>
                        <span className="text-white font-bold">{alert.price}</span>
                      </div>
                    </div>

                    <div className={`p-1.5 rounded-full shrink-0 ${
                      isBSL ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      <ArrowUpRight className={`w-3.5 h-3.5 transform ${!isBSL && 'rotate-90'}`} />
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
