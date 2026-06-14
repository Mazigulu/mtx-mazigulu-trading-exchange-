import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Sun
} from 'lucide-react';

interface MarketBriefing {
  narrative: string;
  majorThemes: string[];
  sentimentBias: 'BULLISH' | 'BEARISH' | 'MIXED';
  volatilityIndex: 'HIGH' | 'MEDIUM' | 'LOW';
  economicAlarms: number;
  lastUpdated: string;
  isLive: boolean;
  isCachedFallback?: boolean;
  err?: string;
}

export default function DailyBriefing() {
  const [briefing, setBriefing] = useState<MarketBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = async (isRef = false) => {
    try {
      if (isRef) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const url = isRef ? '/api/market-briefing?force=true' : '/api/market-briefing';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load Daily Briefing (Status: ${response.status})`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format: server returned HTML instead of JSON. The backend server might still be starting.');
      }
      const data = await response.json();
      setBriefing(data);
    } catch (err: any) {
      console.error('Error loading briefing:', err);
      setError(err.message || 'Briefing index offline.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

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
        return <div key={`hr-${lIdx}`} className="border-t border-white/5 my-4" />;
      }

      // Simple regex split for bold **text**
      const parts = content.split('**');
      const formattedParts = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={`b-${pIdx}`} className="text-white font-semibold">{part}</strong>;
        }
        // Simple italics within the part
        const subParts = part.split('*');
        return subParts.map((sub, sIdx) => {
          if (sIdx % 2 === 1) {
            return <em key={`e-${sIdx}`} className="text-indigo-300 font-normal italic">{sub}</em>;
          }
          return sub;
        });
      });

      if (isBullet) {
        return (
          <li key={`line-${lIdx}`} className="ml-5 list-disc pl-1 text-[12px] leading-relaxed text-white/80 mb-2 font-sans">
            {formattedParts}
          </li>
        );
      }

      if (line.trim().startsWith('####')) {
        return (
          <h5 key={`line-${lIdx}`} className="text-zinc-300 font-semibold font-sans text-xs uppercase tracking-wider mt-5 mb-2.5">
            {line.replace(/^####\s*/, '')}
          </h5>
        );
      }

      if (line.trim().startsWith('###')) {
        return (
          <h4 key={`line-${lIdx}`} className="text-indigo-400 font-bold font-sans text-[13px] uppercase tracking-wider mt-6 mb-3 border-b border-indigo-500/10 pb-1">
            {line.replace(/^###\s*/, '')}
          </h4>
        );
      }

      if (line.trim().startsWith('##')) {
        return (
          <h3 key={`line-${lIdx}`} className="text-white font-bold font-sans text-base mt-7 mb-4">
            {line.replace(/^##\s*/, '')}
          </h3>
        );
      }

      // Empty lines
      if (!line.trim()) {
        return <div key={`space-${lIdx}`} className="h-2" />;
      }

      return (
        <p key={`line-${lIdx}`} className="text-[12px] leading-relaxed text-white/70 font-sans mb-3 font-light">
          {formattedParts}
        </p>
      );
    });
  };

  const getBiasConfig = (bias: 'BULLISH' | 'BEARISH' | 'MIXED' | undefined) => {
    switch (bias) {
      case 'BULLISH':
        return {
          title: 'Bullish Consensus',
          bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
          pillColor: 'bg-emerald-400'
        };
      case 'BEARISH':
        return {
          title: 'Bearish Consensus',
          bgColor: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
          pillColor: 'bg-rose-400'
        };
      default:
        return {
          title: 'Mixed / Neutral',
          bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          icon: <Zap className="w-4 h-4 text-amber-400" />,
          pillColor: 'bg-amber-400'
        };
    }
  };

  const getVolConfig = (vol: 'HIGH' | 'MEDIUM' | 'LOW' | undefined) => {
    switch (vol) {
      case 'HIGH':
        return 'border-red-500/20 text-red-400 bg-red-500/5';
      case 'MEDIUM':
        return 'border-orange-500/20 text-orange-400 bg-orange-500/5';
      default:
        return 'border-zinc-800 text-zinc-400 bg-zinc-900/50';
    }
  };

  const biasStyle = getBiasConfig(briefing?.sentimentBias);

  return (
    <div 
      id="daily-briefing-card" 
      className="bg-[#080808] border border-white/10 rounded-lg p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
    >
      {/* Header section with sunrise look */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 sm:p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
            <Sun className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold tracking-tight text-white font-sans uppercase">
                Institutional Daily Briefing
              </h2>
              {briefing && (
                briefing.isLive ? (
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-300 font-mono border border-indigo-500/30 px-1.5 py-0.2 rounded uppercase">
                    Live AI
                  </span>
                ) : briefing.isCachedFallback ? (
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 font-mono border border-amber-500/30 px-1.5 py-0.2 rounded uppercase" title="Serving cached AI morning briefing to protect quota limits">
                    Cached AI
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 font-mono border border-amber-500/30 px-1.5 py-0.2 rounded uppercase" title="Serving resilient real-time ICT quantitative simulation">
                    Simulation
                  </span>
                )
              )}
            </div>
            <p className="text-[11px] text-white/40 font-mono mt-0.5">
              Macro sentiment & structural confluence engine
            </p>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex items-center space-x-3 mt-3 sm:mt-0 self-end sm:self-center">
          <button
            id="refresh-briefing-btn"
            onClick={() => fetchBriefing(true)}
            disabled={loading || refreshing}
            className="flex items-center space-x-1.5 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-[10.5px] font-mono text-white/70 hover:text-white border border-white/10 px-2.5 py-1.5 rounded transition disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Sync Brief'}</span>
          </button>
        </div>
      </div>

      {/* Primary loaders */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500" />
          <p className="text-[11px] font-mono text-white/40">Synthesizing institutional morning matrices...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500/80" />
          <div className="space-y-1">
            <p className="text-[12px] font-mono text-rose-400">Analysis Pipeline Idle</p>
            <p className="text-[11px] text-white/40 font-sans max-w-sm">{error}</p>
          </div>
          <button
            onClick={() => fetchBriefing()}
            className="text-[10px] bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 px-3 py-1 rounded font-mono transition"
          >
            Retry Synchronization
          </button>
        </div>
      ) : briefing ? (
        <div className="space-y-5 animate-fadeIn">
          {/* Quota limit warning banner */}
          {(!briefing.isLive && !briefing.isCachedFallback) && (
            <div className="bg-[#121008] border border-amber-500/40 rounded-md p-3 text-[11px] font-mono flex items-start space-x-2.5 text-amber-300">
              <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-bold tracking-tight text-amber-400">MTXQUANT HIGH-FIDELITY SIMULATION MODE</p>
                <p className="text-white/60 font-sans mt-1 leading-relaxed text-[11px]">
                  The live AI service is currently resolving standard public quota constraints (20 requests per day limit). The platform has seamlessly loaded the high-fidelity SMC institutional confluence matrix so your active sessions continue without delay.
                </p>
              </div>
            </div>
          )}

          {/* Top key indicators row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sentiment pill */}
            <div className={`p-4 border rounded-md flex items-center justify-between transition ${biasStyle.bgColor}`}>
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wide opacity-50 font-mono">Consensus Bias</span>
                <p className="text-[13px] font-bold tracking-tight">{biasStyle.title}</p>
              </div>
              <div className="p-2 bg-black/20 rounded-full border border-white/5">
                {biasStyle.icon}
              </div>
            </div>

            {/* Volatility Index */}
            <div className={`p-4 border rounded-md flex items-center justify-between transition ${getVolConfig(briefing?.volatilityIndex)}`}>
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wide opacity-50 font-mono">Volatility Index</span>
                <p className="text-[13px] font-bold tracking-tight uppercase">{briefing?.volatilityIndex} EXPECTED</p>
              </div>
              <div className="p-2 bg-black/20 rounded-full border border-white/5">
                <ShieldAlert className="w-4 h-4 text-current" />
              </div>
            </div>

            {/* News warnings */}
            <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-md flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wide text-white/30 font-mono">Macro Calendars</span>
                <p className="text-[13px] font-bold text-white/90">
                  {briefing?.economicAlarms > 0 
                    ? `${briefing.economicAlarms} Red-Folder Event`
                    : 'Clear Calendar Today'}
                </p>
              </div>
              <div className="p-2 bg-black/20 rounded-full border border-white/5">
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Micro Headline themes */}
          <div className="bg-zinc-950/80 border border-white/5 rounded-md overflow-hidden">
            <div className="px-3.5 py-1.5 bg-white/[0.02] border-b border-white/5 flex items-center space-x-2">
              <Newspaper className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[9.5px] uppercase tracking-wider font-mono text-white/50">Core Session Directives</span>
            </div>
            <div className="p-3.5 space-y-2.5">
              {briefing.majorThemes.map((theme, idx) => (
                <div key={idx} className="flex items-start space-x-2.5">
                  <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
                  <p className="text-[11.5px] text-white/80 font-sans leading-relaxed">
                    {theme}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Core Markdown narrative section */}
          <div className="bg-zinc-900/10 border border-white/5 rounded-md p-4 max-h-[350px] overflow-y-auto custom-scrollbar">
            <div className="space-y-1 font-light">
              {formatMarkdown(briefing.narrative)}
            </div>
          </div>

          {/* Footer stats stamp */}
          <div className="flex items-center justify-between text-[10px] font-mono text-white/30 pt-1">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Snapshot Sync: {(() => {
                if (!briefing.lastUpdated) return '—';
                const d = new Date(briefing.lastUpdated);
                if (isNaN(d.getTime())) return briefing.lastUpdated;
                try {
                  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                } catch {
                  return briefing.lastUpdated;
                }
              })()}</span>
            </div>
            <span>Status: Operational (100% Core Alignment)</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
