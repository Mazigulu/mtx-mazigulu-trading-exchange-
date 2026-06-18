/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Newspaper, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Zap, 
  ShieldAlert,
  ArrowUpRight,
  Filter,
  CheckCircle,
  Eye,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Info,
  DollarSign
} from 'lucide-react';
import { MarketSymbol } from '../types';

export interface BreakingNewsItem {
  id: string;
  timestamp: string; // Formatting
  title: string;
  excerpt: string;
  source: string;
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'MACRO' | 'CRYPTO' | 'FOREX' | 'REGULATORY' | 'LIQUIDITY';
  symbol?: MarketSymbol | 'GLOBAL';
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  url?: string;
  readTimeMins?: number;
}

export default function InstitutionalNewsTicker() {
  const [news, setNews] = useState<BreakingNewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  
  // Filtering Criteria
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<string>('ALL');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('ALL');

  // Currently focused news detail modal
  const [selectedArticle, setSelectedArticle] = useState<BreakingNewsItem | null>(null);

  // Stats / counters
  const [criticalCount, setCriticalCount] = useState<number>(0);
  const [highCount, setHighCount] = useState<number>(0);

  // Web Audio chime for high-impact news alert
  const playAlertSound = (impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    if (isMuted) return;
    if (impact !== 'CRITICAL' && impact !== 'HIGH') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      if (impact === 'CRITICAL') {
        // High urgency alarming chime
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(580, ctx.currentTime);
        osc1.frequency.linearRampToValueAtTime(740, ctx.currentTime + 0.15);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(290, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(370, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
      } else {
        // Normal high-impact chime
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(520, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
      }
      
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
    } catch (_) {
      // Audio block bypass
    }
  };

  const fetchNews = async (isSilent = false) => {
    try {
      if (!isSilent) {
        if (news.length > 0) setRefreshing(true);
        else setLoading(true);
      }

      const res = await fetch('/api/institutional-news');
      if (!res.ok) {
        throw new Error(`Failed to load news (Status: ${res.status})`);
      }
      const data = await res.json();
      
      if (data && Array.isArray(data)) {
        setNews(data);

        // Calculate statistics
        const criticals = data.filter((item: BreakingNewsItem) => item.impact === 'CRITICAL').length;
        const highs = data.filter((item: BreakingNewsItem) => item.impact === 'HIGH').length;
        setCriticalCount(criticals);
        setHighCount(highs);

        // Check if a new CRITICAL or HIGH item has been added, and sound the chime
        if (data.length > 0 && news.length > 0) {
          const newest = data[0];
          const isAreadyKnown = news.some(item => item.id === newest.id);
          if (!isAreadyKnown && (newest.impact === 'CRITICAL' || newest.impact === 'HIGH')) {
            playAlertSound(newest.impact);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching institutional news:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNews();
  }, []);

  // Poll for live breaking updates if live stream active
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      fetchNews(true); // silent update
    }, 12000); // Poll every 12 seconds
    return () => clearInterval(interval);
  }, [isLive, news]);

  // Filtering Logic
  const filteredList = useMemo(() => {
    return news.filter(item => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (selectedImpact !== 'ALL' && item.impact !== selectedImpact) return false;
      if (selectedSymbol !== 'ALL') {
        if (item.symbol !== selectedSymbol) return false;
      }
      return true;
    });
  }, [news, selectedCategory, selectedImpact, selectedSymbol]);

  // Style attributes mapping
  const getImpactStyle = (impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (impact) {
      case 'CRITICAL':
        return {
          textColor: 'text-rose-400 font-extrabold',
          bgColor: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          dotColor: 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-ping',
          cardBorder: 'border-rose-500/40 shadow-[inset_0_1px_8px_rgba(224,24,24,0.1)] bg-[#19090b]'
        };
      case 'HIGH':
        return {
          textColor: 'text-amber-400 font-semibold',
          bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          dotColor: 'bg-amber-400',
          cardBorder: 'border-amber-500/20 hover:border-amber-500/30 bg-[#120e09]'
        };
      case 'MEDIUM':
        return {
          textColor: 'text-sky-400 font-medium',
          bgColor: 'bg-[#27272a] border-white/5 text-sky-400',
          dotColor: 'bg-sky-400',
          cardBorder: 'border-white/5 hover:border-indigo-500/15 bg-[#0a0a0d]'
        };
      default:
        return {
          textColor: 'text-white/55 font-normal',
          bgColor: 'bg-[#151516] border-white/5 text-white/40',
          dotColor: 'bg-white/20',
          cardBorder: 'border-white/5 hover:border-white/10 bg-[#070708]'
        };
    }
  };

  const getSentimentTextAndStyle = (sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL') => {
    switch (sentiment) {
      case 'BULLISH':
        return { text: 'Bullish Bias', style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'BEARISH':
        return { text: 'Bearish Bias', style: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      default:
        return { text: 'Market Neutral', style: 'text-white/40 bg-white/5 border-white/5' };
    }
  };

  return (
    <div id="institutional-news-ticker-card" className="bg-[#0c0c0e]/95 border border-white/5 rounded-lg p-5 md:p-6 flex flex-col justify-between h-auto mt-6">
      
      {/* Live Bloomberg-Style Infinite Scrolling News Ribbon */}
      {news.length > 0 && (
        <div id="live-news-marquee-tape" className="w-full bg-[#050507] border border-white/5 rounded-md py-2.5 overflow-hidden mb-5 relative flex items-center select-none shadow-[inset_0_1px_4px_rgba(255,255,255,0.02)] group">
          {/* Tape Header Label Tag */}
          <div className="absolute left-0 top-0 bottom-0 bg-red-600/90 px-3 flex items-center text-[8.5px] font-mono font-black text-white shrink-0 z-10 tracking-widest uppercase border-r border-[#0c0c0e] shadow-[3px_0_10px_rgba(0,0,0,0.6)]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1.5" />
            LIVE REUTERS TAPE
          </div>
          
          {/* Inner Marquee Container */}
          <div className="flex w-full pl-36 overflow-hidden relative">
            <div className="animate-marquee-smooth flex gap-8 whitespace-nowrap text-[9px] font-mono font-bold tracking-tight">
              {[...news, ...news].map((item, idx) => {
                const isCritical = item.impact === 'CRITICAL';
                const isHigh = item.impact === 'HIGH';
                const colorClass = isCritical 
                  ? 'text-rose-400 font-extrabold shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse' 
                  : isHigh 
                  ? 'text-amber-400' 
                  : item.impact === 'MEDIUM' 
                  ? 'text-sky-400' 
                  : 'text-white/45';
                  
                return (
                  <button
                    key={`${item.id}-marquee-${idx}`}
                    onClick={() => setSelectedArticle(item)}
                    className="hover:text-indigo-400 cursor-pointer flex items-center gap-2 focus:outline-none transition-colors"
                    title="Click to view full direct briefing"
                  >
                    <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-black leading-none border ${
                      isCritical 
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' 
                        : isHigh 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                        : 'bg-white/5 border-white/5 text-white/45'
                    }`}>
                      {item.impact}
                    </span>
                    <span className="text-white/30 uppercase text-[8px] tracking-wider font-semibold">{item.source}:</span>
                    <span className={`${colorClass} hover:underline`}>{item.title}</span>
                    <span className="text-white/20 px-1 font-normal">&middot;&middot;&middot;&middot;</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* CSS Animation style injection */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee-smooth {
              display: flex;
              animation: marquee 50s linear infinite;
            }
            .animate-marquee-smooth:hover {
              animation-play-state: paused;
            }
          `}} />
        </div>
      )}
      
      {/* 1. Header Toolbar Component */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-500/10 pb-4 mb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 rounded border border-indigo-500/25 text-indigo-400 shrink-0">
            <Newspaper className="w-4 h-4 animate-pulse text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              Institutional News Ticker
              <span className="text-[8px] font-mono font-extrabold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded leading-none">
                LIVE TERMINAL
              </span>
            </h3>
            <p className="text-[9.5px] text-white/40 font-sans mt-0.5">
              Aggregated financial news from external feeds paired with high-impact system market briefings.
            </p>
          </div>
        </div>

        {/* Sync Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Streaming Switch */}
          <button
            id="btn-news-toggle-stream"
            onClick={() => setIsLive(!isLive)}
            title={isLive ? "Pause active headline polling" : "Resume active headline polling"}
            className={`px-2.5 py-1.5 rounded font-mono text-[9px] font-black border transition-all cursor-pointer flex items-center gap-1.5 uppercase ${
              isLive 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-white/5 border-white/10 text-white/40'
            }`}
          >
            {isLive ? <Play className="w-3 h-3 fill-emerald-400" /> : <Pause className="w-3 h-3" />}
            {isLive ? 'STREAMING' : 'HOLD'}
          </button>

          {/* Sound Notification Controls */}
          <button
            id="btn-news-toggle-sound"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Enable Synthetic alerts on major events" : "Mute breaking news sound alerts"}
            className={`px-2 py-1.5 rounded border font-mono text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              !isMuted 
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' 
                : 'bg-[#050505]/40 border-white/5 text-white/30'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-300" />}
            <span>CHIMES</span>
          </button>

          {/* Manual reload key */}
          <button
            id="btn-news-manual-sync"
            onClick={() => fetchNews(false)}
            disabled={loading || refreshing}
            className="p-1.5 bg-[#050505] border border-white/5 text-white/40 hover:text-white hover:border-white/20 rounded disabled:opacity-40 hover:bg-[#131317] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing || (loading && news.length > 0) ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top-Tier Severity Overview stats widget */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        {/* Total Headlines Loaded */}
        <div className="bg-[#050507]/90 border border-white/5 rounded-lg p-3 flex items-center justify-between font-mono text-[9px]">
          <div>
            <span className="text-white/30 block uppercase font-bold tracking-tight">Active Coverage</span>
            <span className="text-xs text-indigo-200 mt-0.5 block">{news.length} aggregated feeds</span>
          </div>
          <Zap className="w-4 h-4 text-indigo-400" />
        </div>

        {/* Critical Alerts Counter */}
        <div className="bg-[#050507]/90 border border-white/5 rounded-lg p-3 flex items-center justify-between font-mono text-[9px]">
          <div>
            <span className="text-white/30 block uppercase font-bold tracking-tight">Critical Events</span>
            <span className="text-xs text-rose-400 font-extrabold mt-0.5 block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
              {criticalCount} warnings logged
            </span>
          </div>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>

        {/* High Impact Count */}
        <div className="bg-[#050507]/90 border border-white/5 rounded-lg p-3 flex items-center justify-between font-mono text-[9px]">
          <div>
            <span className="text-white/30 block uppercase font-bold tracking-tight">High Impact News</span>
            <span className="text-xs text-amber-400 font-extrabold mt-0.5 block">
              {highCount} macro alerts
            </span>
          </div>
          <ShieldAlert className="w-4 h-4 text-amber-400" />
        </div>

        {/* Environment Node Source Information */}
        <div className="bg-[#050507]/90 border border-white/5 rounded-lg p-3 flex items-center justify-between font-mono text-[9px]">
          <div>
            <span className="text-white/30 block uppercase font-bold tracking-tight">External Integration</span>
            <span className="text-[10px] text-emerald-400 font-extrabold mt-0.5 block">
              Finnhub / CNBC Public Node
            </span>
          </div>
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* 3. Deep Filters Row */}
      <div className="bg-[#050507] border border-white/5 rounded-xl p-4 mb-4 select-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Category Filter column */}
          <div>
            <span className="text-[8.5px] font-mono text-white/30 uppercase tracking-tight block mb-1">Impact Category:</span>
            <div className="flex flex-wrap gap-1">
              {['ALL', 'MACRO', 'CRYPTO', 'FOREX', 'REGULATORY', 'LIQUIDITY'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300' 
                      : 'bg-[#030303]/60 border-white/5 text-white/30 hover:text-white/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Severity Impact Filter */}
          <div>
            <span className="text-[8.5px] font-mono text-white/30 uppercase tracking-tight block mb-1">Impact Severity Filter:</span>
            <div className="flex flex-wrap gap-1">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((imp) => (
                <button
                  key={imp}
                  onClick={() => setSelectedImpact(imp)}
                  className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all cursor-pointer ${
                    selectedImpact === imp 
                      ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300' 
                      : 'bg-[#030303]/60 border-white/5 text-white/30 hover:text-white/50'
                  }`}
                >
                  {imp}
                </button>
              ))}
            </div>
          </div>

          {/* Asset specific ticker symbols filter */}
          <div>
            <span className="text-[8.5px] font-mono text-white/30 uppercase tracking-tight block mb-1">Symbol filter:</span>
            <select
              id="news-symbol-dropdown-filter"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-[#030303] text-[10px] text-indigo-200 border border-indigo-500/25 hover:border-indigo-500/40 rounded px-2 py-1.5 font-mono outline-none cursor-pointer w-full"
            >
              <option value="ALL">ALL ASSETS / FEED HEADLINES</option>
              <option value="GLOBAL">GLOBAL / MACRO NEWS</option>
              <option value="EUR/USD">EUR/USD (Euro / Dollar)</option>
              <option value="GBP/USD">GBP/USD (Pound / Dollar)</option>
              <option value="USD/JPY">USD/JPY (Dollar / Yen)</option>
              <option value="GOLD/USD">GOLD/USD (Precious Gold)</option>
              <option value="BTC/USDT">BTC/USDT (Bitcoin)</option>
              <option value="ETH/USDT">ETH/USDT (Ethereum)</option>
              <option value="SOL/USDT">SOL/USDT (Solana)</option>
              <option value="SPX500">SPX500 (S&P Index)</option>
              <option value="US30">US30 (Dow Jones Index)</option>
              <option value="NAS100">NAS100 (Nasdaq Index)</option>
            </select>
          </div>

        </div>
      </div>

      {/* 4. Active Headlines Ledger Feed */}
      <div className="bg-[#030305] border border-white/5 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
        {loading && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">Establishing connection to financial RSS news network...</span>
            <p className="text-[9px] font-sans text-white/20 mt-1 max-w-xs">Initializing high-speed market streams.</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center text-white/30">
            <Info className="w-5 h-5 text-indigo-500/40 mb-2" />
            <span className="text-[10px] font-mono uppercase tracking-wider block">No headlines match the specified filtration parameters.</span>
            <p className="text-[9px] font-sans text-white/20 mt-1 max-w-xs">Reset filters or toggle different categories to fetch broader headlines.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 select-none font-mono text-[10px]">
            {filteredList.map((item, index) => {
              const styles = getImpactStyle(item.impact);
              const sentiment = getSentimentTextAndStyle(item.sentiment);
              
              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedArticle(item)}
                  className={`p-3.5 md:p-4 flex flex-col md:flex-row md:items-start justify-between gap-3.5 cursor-pointer leading-relaxed transition-all ${
                    styles.cardBorder
                  }`}
                >
                  {/* Left Column: Metadata tag group */}
                  <div className="flex flex-wrap items-center md:flex-col md:items-start gap-2 shrink-0 md:w-36 text-[9.5px]">
                    {/* Timestamp relative clock */}
                    <div className="flex items-center text-white/30 space-x-1 shrink-0 font-normal">
                      <Clock className="w-3.5 h-3.5 text-white/20" />
                      <span>{item.timestamp}</span>
                    </div>

                    {/* Impact Level Badge */}
                    <span className={`px-1.5 py-0.5 rounded font-black text-[8px] tracking-wide shrink-0 border text-center font-mono leading-none flex items-center gap-1 uppercase ${
                      styles.bgColor
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${styles.dotColor}`} />
                      {item.impact}
                    </span>

                    {/* Category Label */}
                    <span className="text-white/35 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded leading-none text-[8px] tracking-wide uppercase">
                      {item.category}
                    </span>
                  </div>

                  {/* Mid Column: Article Summary */}
                  <div className="flex-1 min-w-0 md:mx-1">
                    <span className="text-white/35 text-[8.5px] uppercase font-bold tracking-tight block mb-0.5 flex items-center gap-1.5">
                      • {item.source}
                      {item.symbol && item.symbol !== 'GLOBAL' && (
                        <span className="text-[8.5px] text-indigo-400 font-extrabold bg-indigo-500/10 px-1 rounded border border-indigo-500/15">
                          {item.symbol}
                        </span>
                      )}
                    </span>
                    <h4 className="text-[11px] font-bold text-white tracking-normal hover:text-indigo-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-white/50 font-sans mt-1 line-clamp-2 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>

                  {/* Right Column: Directional bias action button */}
                  <div className="flex items-center md:flex-col md:items-end justify-between md:justify-start gap-2 shrink-0 self-end md:self-start">
                    {/* Bias indicators */}
                    <span className={`px-2 py-1 rounded font-bold text-[8.5px] border font-mono tracking-tight shrink-0 flex items-center gap-1 ${
                      sentiment.style
                    }`}>
                      {item.sentiment === 'BULLISH' ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : item.sentiment === 'BEARISH' ? <TrendingDown className="w-3 h-3 text-rose-400" /> : null}
                      {sentiment.text}
                    </span>

                    <button className="text-white/30 text-[9.5px] hover:text-white flex items-center gap-1 font-bold">
                      <Eye className="w-3.5 h-3.5 text-indigo-400" /> View Brief
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Article Detail Drawer Modal using AnimatePresence */}
      <AnimatePresence>
        {selectedArticle && (
          <div 
            id="news-briefing-drawer-overlay"
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div 
              id="news-briefing-drawer-content"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-[#0b0b0d] border border-indigo-500/20 max-w-lg w-full rounded-lg overflow-hidden font-mono p-5 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top metadata tags */}
              <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3.5 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded">
                    <Newspaper className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest block">Institutional Bulletin</span>
                    <span className="text-[9.5px] text-indigo-300 block">{selectedArticle.source}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="p-1 bg-[#151518] hover:bg-white/10 hover:text-white border border-white/5 rounded text-white/40 cursor-pointer transition-colors"
                >
                  <span className="text-[10px] font-black uppercase px-1">Close</span>
                </button>
              </div>

              {/* Header Title Information */}
              <div className="space-y-2 mb-4">
                {/* Meta details row */}
                <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
                  <span className={`px-2 py-0.5 rounded font-black border uppercase tracking-wider ${getImpactStyle(selectedArticle.impact).bgColor}`}>
                    {selectedArticle.impact} Severity
                  </span>
                  <span className="text-white/45 bg-white/5 px-2 py-0.5 rounded tracking-wide border border-white/5">
                    {selectedArticle.category} CATEGORY
                  </span>
                  {selectedArticle.symbol && (
                    <span className="text-indigo-300 font-extrabold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {selectedArticle.symbol}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded font-bold border ${getSentimentTextAndStyle(selectedArticle.sentiment).style}`}>
                    {getSentimentTextAndStyle(selectedArticle.sentiment).text}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-white leading-relaxed">
                  {selectedArticle.title}
                </h3>
                
                <div className="flex items-center text-white/30 text-[9px] pt-1">
                  <Clock className="w-3.5 h-3.5 text-white/20 mr-1.5 inline" />
                  <span>Logged at {selectedArticle.timestamp}</span>
                  {selectedArticle.readTimeMins && (
                    <span className="ml-3">• Estimated reading time: {selectedArticle.readTimeMins} mins</span>
                  )}
                </div>
              </div>

              {/* Full News Excerpt Description */}
              <div className="space-y-3.5 text-[10.5px] leading-relaxed select-text font-sans scrollbar-thin text-white/80 border-t border-b border-white/5 py-4 my-4 max-h-[180px] overflow-y-auto">
                <p className="font-semibold text-white">BULLETIN EXCERPT:</p>
                <p>{selectedArticle.excerpt}</p>
                
                <p className="text-white/40 text-[9.5px]">
                  Disclaimer: This bulletin compiles data feeds from direct interbank channels, global press releases, and advanced on-chain liquidity analytics systems. Do not base direct execution strictly on solo flash tickers without auditing correlated price-action indices first.
                </p>
              </div>

              {/* Bottom Drawer Actions */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-[8.5px] text-white/30 uppercase font-mono">
                  FEED NODE: SEC_LEVEL_3_WIFI
                </span>
                
                {selectedArticle.url ? (
                  <a 
                    href={selectedArticle.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 hover:border-indigo-500/40 text-indigo-300 px-3.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 font-bold uppercase font-mono"
                  >
                    Read full coverage <ArrowUpRight className="w-3.5 h-3.5 text-indigo-300" />
                  </a>
                ) : (
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-[10px] bg-[#1a1a1e] hover:bg-[#25252b] border border-white/5 text-white/60 px-3.5 py-1.5 rounded transition-all cursor-pointer uppercase font-semibold"
                  >
                    Briefing Read
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
