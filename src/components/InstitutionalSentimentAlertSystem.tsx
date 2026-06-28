/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Bell, 
  Sparkles, 
  X, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Info,
  Sliders,
  Play
} from 'lucide-react';
import { MarketSymbol } from '../types';

interface SentimentDivergence {
  symbol: MarketSymbol;
  type: 'BEARISH_DIVERGENCE' | 'BULLISH_DIVERGENCE';
  timestamp: string;
  price: number;
  overallScore: number;
  newsScore: number;
  technicalScore: number;
  rsi: number;
  trend: 'BULLISH' | 'BEARISH';
  state: string;
}

export default function InstitutionalSentimentAlertSystem({ bannerOnly = false }: { bannerOnly?: boolean }) {
  const [divergences, setDivergences] = useState<SentimentDivergence[]>([]);
  const [activeNotification, setActiveNotification] = useState<SentimentDivergence | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [alertSettingsOpen, setAlertSettingsOpen] = useState<boolean>(false);
  
  // Custom threshold limits
  const [divergenceThreshold, setDivergenceThreshold] = useState<number>(80); // e.g. 80% sentiment bias
  const [activeOnly, setActiveOnly] = useState<boolean>(true);

  // Keep track of symbols we've already alerted to prevent repeated sounds
  const alertedSymbolsRef = useRef<Record<string, { lastScore: number; timestamp: number }>>({});

  // Synthetic audio synthesizer with high-end dual oscillator design
  const playSoftChime = (type: 'BEARISH_DIVERGENCE' | 'BULLISH_DIVERGENCE') => {
    if (!isAudioEnabled) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      
      // Dynamic master gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      masterGain.connect(ctx.destination);

      // Low Pass Filter to make the sound "soft" and ambient rather than harsh
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.connect(masterGain);

      if (type === 'BULLISH_DIVERGENCE') {
        // High-end rising dual wave
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.3); // E5

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(392.00, ctx.currentTime); // G4
        osc2.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.35); // C5

        osc1.connect(filter);
        osc2.connect(filter);

        osc1.start();
        osc2.start();

        osc1.stop(ctx.currentTime + 0.8);
        osc2.stop(ctx.currentTime + 0.8);
      } else {
        // Warning dual wave with a subtle professional chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440.00, ctx.currentTime); // A4
        osc1.frequency.exponentialRampToValueAtTime(349.23, ctx.currentTime + 0.4); // F4

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
        osc2.frequency.exponentialRampToValueAtTime(261.63, ctx.currentTime + 0.45); // C4

        // Add a tiny bit of frequency modulation
        osc1.connect(filter);
        osc2.connect(filter);

        osc1.start();
        osc2.start();

        osc1.stop(ctx.currentTime + 0.9);
        osc2.stop(ctx.currentTime + 0.9);
      }
    } catch (e) {
      console.warn('Web Audio playback context not allowed or initiated:', e);
    }
  };

  const checkSentimentDivergences = async () => {
    try {
      const res = await fetch('/api/market-sentiment');
      if (!res.ok) return;
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return;
      }
      const data = await res.json();
      if (!data || !data.sentiment) return;

      const detectedList: SentimentDivergence[] = [];
      const now = Date.now();

      Object.entries(data.sentiment).forEach(([sym, asset]: [string, any]) => {
        const trend = asset.trend; // 'BULLISH' | 'BEARISH' | 'NEUTRAL'
        const score = asset.overallScore; // 0 - 100

        // 1. Bearish Divergence: >80% bearish sentiment (overallScore <= 20) during an uptrend (BULLISH)
        if (trend === 'BULLISH' && score <= (100 - divergenceThreshold)) {
          detectedList.push({
            symbol: sym as MarketSymbol,
            type: 'BEARISH_DIVERGENCE',
            timestamp: new Date().toLocaleTimeString(),
            price: asset.currentPrice,
            overallScore: score,
            newsScore: asset.newsScore,
            technicalScore: asset.technicalScore,
            rsi: asset.rsi,
            trend: 'BULLISH',
            state: asset.state
          });
        }
        // 2. Bullish Divergence: >80% bullish sentiment (overallScore >= 80) during a downtrend (BEARISH)
        else if (trend === 'BEARISH' && score >= divergenceThreshold) {
          detectedList.push({
            symbol: sym as MarketSymbol,
            type: 'BULLISH_DIVERGENCE',
            timestamp: new Date().toLocaleTimeString(),
            price: asset.currentPrice,
            overallScore: score,
            newsScore: asset.newsScore,
            technicalScore: asset.technicalScore,
            rsi: asset.rsi,
            trend: 'BEARISH',
            state: asset.state
          });
        }
      });

      setDivergences(detectedList);

      // Evaluate new vs old to trigger audio and banner warning
      if (detectedList.length > 0) {
        // Grab the most critical or just the first new one
        const freshAlerts = detectedList.filter(div => {
          const key = `${div.symbol}-${div.type}`;
          const existing = alertedSymbolsRef.current[key];
          
          // Trigger if we haven't alerted this state in the last 15 minutes OR if the score shifted significantly (>5 pts)
          if (!existing || (now - existing.timestamp > 900000) || Math.abs(existing.lastScore - div.overallScore) > 5) {
            alertedSymbolsRef.current[key] = { lastScore: div.overallScore, timestamp: now };
            return true;
          }
          return false;
        });

        if (freshAlerts.length > 0) {
          const newest = freshAlerts[0];
          setActiveNotification(newest);
          playSoftChime(newest.type);

          // Clear banner notification automatically after 10 seconds
          const timer = setTimeout(() => {
            setActiveNotification(prev => prev?.symbol === newest.symbol && prev?.type === newest.type ? null : prev);
          }, 10000);
          return () => clearTimeout(timer);
        }
      }
    } catch (err) {
      console.error('Error running divergence checks:', err);
    }
  };

  useEffect(() => {
    checkSentimentDivergences();
    const timer = setInterval(checkSentimentDivergences, 4000);
    return () => clearInterval(timer);
  }, [divergenceThreshold]);

  // Ability to trigger a test simulation so the developer / user can observe it immediately
  const triggerMockTest = (type: 'BULLISH' | 'BEARISH') => {
    const symbol: MarketSymbol = type === 'BULLISH' ? 'BTC/USDT' : 'EUR/USD';
    const mockAlert: SentimentDivergence = {
      symbol,
      type: type === 'BULLISH' ? 'BULLISH_DIVERGENCE' : 'BEARISH_DIVERGENCE',
      timestamp: new Date().toLocaleTimeString(),
      price: type === 'BULLISH' ? 68250.40 : 1.08450,
      overallScore: type === 'BULLISH' ? 84 : 16,
      newsScore: type === 'BULLISH' ? 88 : 12,
      technicalScore: type === 'BULLISH' ? 81 : 19,
      rsi: type === 'BULLISH' ? 24 : 76,  // Overbought rsi but bearish trend, or oversold trend but bullish sentiment
      trend: type === 'BULLISH' ? 'BEARISH' : 'BULLISH',
      state: 'Volatile'
    };

    setActiveNotification(mockAlert);
    playSoftChime(mockAlert.type);
  };

  if (bannerOnly) {
    return (
      <div id="institutional-sentiment-alert-hub" className="relative z-[320]">
        <AnimatePresence>
          {activeNotification && (
            <motion.div
              initial={{ opacity: 0, x: 250, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 150, scale: 0.95, transition: { duration: 0.25 } }}
              className={`fixed top-4 right-4 z-[400] w-[350px] rounded-lg border shadow-xl overflow-hidden font-mono ${
                activeNotification.type === 'BEARISH_DIVERGENCE'
                  ? 'bg-[#150a0d] border-rose-500/30 shadow-rose-950/20'
                  : 'bg-[#081512] border-emerald-500/30 shadow-emerald-950/20'
              }`}
            >
              {/* Header Status Bar Indicator */}
              <div className={`p-1 flex items-center justify-between text-[8px] font-extrabold uppercase tracking-widest leading-none ${
                activeNotification.type === 'BEARISH_DIVERGENCE' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                <span className="flex items-center gap-1.5 px-1">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>INSTITUTIONAL SENTIMENT ALERT ENGINE</span>
                </span>
                <button 
                  onClick={() => setActiveNotification(null)}
                  className="hover:bg-white/5 p-1 rounded transition-colors text-white/50 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded mt-0.5 ${
                    activeNotification.type === 'BEARISH_DIVERGENCE' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-black uppercase text-white tracking-wide">
                      {activeNotification.type === 'BEARISH_DIVERGENCE' ? 'Bearish Sentiment Divergence' : 'Bullish Sentiment Divergence'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-black text-indigo-300">{activeNotification.symbol}</span>
                      <span className="text-white/20">|</span>
                      <span className="text-[10px] text-white/60">Price: {activeNotification.price}</span>
                    </div>
                  </div>
                </div>

                {/* Alert Variables Grid */}
                <div className="bg-black/40 border border-white/5 rounded p-2.5 space-y-1.5 text-[9.5px]">
                  <div className="flex justify-between items-center text-white/40">
                    <span>MARKET TREND BIAS:</span>
                    <span className={`font-black flex items-center gap-1 ${
                      activeNotification.trend === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {activeNotification.trend === 'BULLISH' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {activeNotification.trend}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-white/40">
                    <span>AGGREGATED SENTIMENT:</span>
                    <span className={`font-black uppercase tracking-wider ${
                      activeNotification.type === 'BEARISH_DIVERGENCE' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {activeNotification.type === 'BEARISH_DIVERGENCE' 
                        ? `Bearish (${100 - activeNotification.overallScore}%)` 
                        : `Bullish (${activeNotification.overallScore}%)`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-white/40">
                    <span>DIVERGENCE THRESHOLD:</span>
                    <span className="font-extrabold text-blue-400">&gt;{divergenceThreshold}% Bias Difference</span>
                  </div>
                </div>

                {/* Action and Dismiss Toggles */}
                <div className="flex items-center justify-between gap-2.5 pt-1">
                  <button
                    onClick={() => {
                      setIsAudioEnabled(!isAudioEnabled);
                      playSoftChime(activeNotification.type);
                    }}
                    className="px-2 py-1 border border-white/10 hover:border-white/20 rounded text-[9px] hover:text-white text-white/50 flex items-center gap-1 transition-all"
                    title="Toggle Audio Alerts"
                  >
                    {isAudioEnabled ? <Volume2 className="w-3 h-3 text-indigo-400" /> : <VolumeX className="w-3 h-3 text-white/30" />}
                    <span>{isAudioEnabled ? 'AUDIO ON' : 'MUTED'}</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveNotification(null)}
                      className={`px-3 py-1 rounded text-[9.5px] font-black uppercase transition-all border ${
                        activeNotification.type === 'BEARISH_DIVERGENCE'
                          ? 'bg-rose-950/20 border-rose-500/20 text-rose-400 hover:bg-rose-950/40 hover:border-rose-500/40'
                          : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500/40'
                      }`}
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Soft decorative bottom progress line to convey auto-dismiss time */}
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 10, ease: 'linear' }}
                className={`h-[1px] ${
                  activeNotification.type === 'BEARISH_DIVERGENCE' ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div id="institutional-sentiment-alert-hub" className="relative z-[300]">
      {/* Dynamic Floating Banner Notification Overlay */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, x: 250, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 150, scale: 0.95, transition: { duration: 0.25 } }}
            className={`fixed top-4 right-4 z-[400] w-[350px] rounded-lg border shadow-xl overflow-hidden font-mono ${
              activeNotification.type === 'BEARISH_DIVERGENCE'
                ? 'bg-[#150a0d] border-rose-500/30 shadow-rose-950/20'
                : 'bg-[#081512] border-emerald-500/30 shadow-emerald-950/20'
            }`}
          >
            {/* Header Status Bar Indicator */}
            <div className={`p-1 flex items-center justify-between text-[8px] font-extrabold uppercase tracking-widest leading-none ${
              activeNotification.type === 'BEARISH_DIVERGENCE' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <span className="flex items-center gap-1.5 px-1">
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>INSTITUTIONAL SENTIMENT ALERT ENGINE</span>
              </span>
              <button 
                onClick={() => setActiveNotification(null)}
                className="hover:bg-white/5 p-1 rounded transition-colors text-white/50 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded mt-0.5 ${
                  activeNotification.type === 'BEARISH_DIVERGENCE' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-black uppercase text-white tracking-wide">
                    {activeNotification.type === 'BEARISH_DIVERGENCE' ? 'Bearish Sentiment Divergence' : 'Bullish Sentiment Divergence'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black text-indigo-300">{activeNotification.symbol}</span>
                    <span className="text-white/20">|</span>
                    <span className="text-[10px] text-white/60">Price: {activeNotification.price}</span>
                  </div>
                </div>
              </div>

              {/* Alert Variables Grid */}
              <div className="bg-black/40 border border-white/5 rounded p-2.5 space-y-1.5 text-[9.5px]">
                <div className="flex justify-between items-center text-white/40">
                  <span>MARKET TREND BIAS:</span>
                  <span className={`font-black flex items-center gap-1 ${
                    activeNotification.trend === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {activeNotification.trend === 'BULLISH' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {activeNotification.trend}
                  </span>
                </div>

                <div className="flex justify-between items-center text-white/40">
                  <span>AGGREGATED SENTIMENT:</span>
                  <span className={`font-black uppercase tracking-wider ${
                    activeNotification.type === 'BEARISH_DIVERGENCE' ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {activeNotification.type === 'BEARISH_DIVERGENCE' 
                      ? `Bearish (${100 - activeNotification.overallScore}%)` 
                      : `Bullish (${activeNotification.overallScore}%)`}
                  </span>
                </div>

                <div className="flex justify-between items-center text-white/40">
                  <span>DIVERGENCE THRESHOLD:</span>
                  <span className="font-extrabold text-blue-400">&gt;{divergenceThreshold}% Bias Difference</span>
                </div>
              </div>

              {/* Action and Dismiss Toggles */}
              <div className="flex items-center justify-between gap-2.5 pt-1">
                <button
                  onClick={() => {
                    setIsAudioEnabled(!isAudioEnabled);
                    playSoftChime(activeNotification.type);
                  }}
                  className="px-2 py-1 border border-white/10 hover:border-white/20 rounded text-[9px] hover:text-white text-white/50 flex items-center gap-1 transition-all"
                  title="Toggle Audio Alerts"
                >
                  {isAudioEnabled ? <Volume2 className="w-3 h-3 text-indigo-400" /> : <VolumeX className="w-3 h-3 text-white/30" />}
                  <span>{isAudioEnabled ? 'AUDIO ON' : 'MUTED'}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveNotification(null)}
                    className={`px-3 py-1 rounded text-[9.5px] font-black uppercase transition-all border ${
                      activeNotification.type === 'BEARISH_DIVERGENCE'
                        ? 'bg-rose-950/20 border-rose-500/20 text-rose-400 hover:bg-rose-950/40 hover:border-rose-500/40'
                        : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500/40'
                    }`}
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            </div>
            
            {/* Soft decorative bottom progress line to convey auto-dismiss time */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 10, ease: 'linear' }}
              className={`h-[1px] ${
                activeNotification.type === 'BEARISH_DIVERGENCE' ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Alert Monitor Control widget inside the settings panel or dashboard layout */}
      <div className="bg-[#0a0a0b] border border-white/5 p-4 rounded-lg flex flex-col justify-between font-mono select-none">
        
        <div className="flex justify-between items-center border-b border-white/5 pb-2.5 mb-3">
          <div className="flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Institutional Sentiment Divergence Engine
            </span>
          </div>
          
          <button
            onClick={() => setAlertSettingsOpen(!alertSettingsOpen)}
            className="text-[9.5px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Config</span>
          </button>
        </div>

        <p className="text-[10px] text-white/45 leading-relaxed mb-3 font-sans">
          This system continuously scans aggregated, multi-exchange orderbook sentiment models and news calendar indexes. It detects abnormal institutional liquidity shifts mirroring high-impact sentiment-trend divergences.
        </p>

        {/* Dynamic settings accordion drawer */}
        {alertSettingsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-b border-white/5 py-3.5 my-2.5 space-y-3"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/40 uppercase">Divergence Sensitivity (Bias Threshold):</span>
              <span className="font-extrabold text-white font-mono">{divergenceThreshold}%</span>
            </div>
            <input 
              type="range" 
              min="65" 
              max="95" 
              value={divergenceThreshold}
              onChange={(e) => setDivergenceThreshold(parseInt(e.target.value))}
              className="w-full h-1 bg-[#101012] rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/5" 
            />
            <div className="flex items-center justify-between text-[9px] text-white/30 font-sans italic">
              <span>*Lower values (e.g. 70%) trigger alerts more frequently. Higher values (e.g. 90%) require extreme asset divergence.</span>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-[10px] text-white/40 uppercase">Audio Output Chime:</span>
              <button
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`px-3 py-1 rounded text-[10px] uppercase font-bold transition-all border ${
                  isAudioEnabled 
                    ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300' 
                    : 'bg-white/[0.02] border-white/5 text-white/30'
                }`}
              >
                {isAudioEnabled ? 'Chime Active' : 'Chime Muted'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Current Active Alerts State Table */}
        <div className="bg-black/50 border border-white/5 rounded p-2.5 max-h-[140px] overflow-y-auto space-y-2">
          {divergences.length === 0 ? (
            <div className="text-center py-6 text-[9.5px] text-white/30 flex flex-col items-center justify-center gap-1 font-sans">
              <Activity className="w-4 h-4 text-white/15 animate-ping" />
              <span>Scanning live exchange pipelines for divergences...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[8px] text-white/30 font-bold uppercase tracking-widest pb-1 border-b border-white/5 flex justify-between">
                <span>ACTIVE PAIRS</span>
                <span>BIAS SHIFT</span>
              </div>
              {divergences.map((div) => (
                <div 
                  key={`${div.symbol}-${div.type}`}
                  onClick={() => {
                    setActiveNotification(div);
                    playSoftChime(div.type);
                  }}
                  className={`p-2 rounded border text-[10px] flex items-center justify-between transition-all hover:scale-[1.01] cursor-pointer ${
                    div.type === 'BEARISH_DIVERGENCE'
                      ? 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/10 hover:border-rose-500/25 text-rose-400'
                      : 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10 hover:border-emerald-500/25 text-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{div.symbol}</span>
                    <span className="text-white/10">|</span>
                    <span className="text-[9px] font-sans text-white/50 lowercase">Price: {div.price}</span>
                  </div>
                  <div className="text-right flex items-center gap-1">
                    <span className="font-extrabold text-[9px]">
                      {div.type === 'BEARISH_DIVERGENCE' 
                        ? `BEARISH (${100 - div.overallScore}%)` 
                        : `BULLISH (${div.overallScore}%)`}
                    </span>
                    <span>{div.type === 'BEARISH_DIVERGENCE' ? '▼' : '▲'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Trigger Buttons so user can test sound & motion banner immediately */}
        <div className="mt-3.5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[9px] font-sans text-white/30">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Developer Sandbox Trigger Controls:</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => triggerMockTest('BEARISH')}
              className="px-2.5 py-1 border border-rose-500/20 hover:border-rose-500/50 bg-rose-500/5 rounded font-mono text-[9px] text-rose-400 font-bold tracking-tight hover:bg-rose-500/10 transition-all flex items-center gap-1"
              title="Test standard warning playbell and slide banner layout for Bearish Divergences"
            >
              <Play className="w-2.5 h-2.5" />
              <span>Test Bearish</span>
            </button>
            <button
              onClick={() => triggerMockTest('BULLISH')}
              className="px-2.5 py-1 border border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-500/5 rounded font-mono text-[9px] text-emerald-400 font-bold tracking-tight hover:bg-emerald-500/10 transition-all flex items-center gap-1"
              title="Test standard warning playbell and slide banner layout for Bullish Divergences"
            >
              <Play className="w-2.5 h-2.5" />
              <span>Test Bullish</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
