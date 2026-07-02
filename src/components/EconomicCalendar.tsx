import React, { useEffect, useMemo, useState } from 'react';
import { NewsEvent } from '../types';
import { 
  Calendar, 
  Terminal, 
  Clock, 
  ShieldAlert, 
  FileText, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Info,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EconomicCalendarProps {
  events: NewsEvent[];
}

// SEC Filing details or Analyst estimates dictionary to simulate deep filings view
const EVENT_SEC_FILINGS: Record<string, {
  reportType: string;
  ticker: string;
  period: string;
  summary: string;
  highlights: string[];
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  analystRating?: string;
  optionImpliedMove?: string;
}> = {
  'news-1': {
    reportType: 'Q2 Earnings Announcement',
    ticker: 'NVDA',
    period: 'Q2 2026',
    summary: 'NVIDIA Corp. is scheduled to release its Q2 financial results. Market anticipation is extremely high given generative AI infrastructure hyper-scaler capital expenditure trends.',
    highlights: [
      'Wall Street Consensus EPS Estimate: $0.64 (YoY +18%)',
      'Revenue Estimate: $28.50 Billion (YoY +22%)',
      'Option implied volatility suggests an expected post-earnings move of ±8.4%',
      'Focus areas: Blackwell chip supply chain speed, sovereign AI cloud orders, gross margin sustainability (target 75%-77%)'
    ],
    sentiment: 'BULLISH',
    optionImpliedMove: '±8.4%'
  },
  'news-2': {
    reportType: 'SEC Form 4 (Statement of Changes in Beneficial Ownership)',
    ticker: 'MSFT',
    period: 'Filing Date: June 2, 2026',
    summary: 'Form 4 filed with the Securities and Exchange Commission indicates Satya Nadella, Chief Executive Officer, executed a sizable direct purchase of 45,000 common shares in the open market.',
    highlights: [
      'Total Purchase Value: $18,922,500 USD',
      'Average Entry Price: $420.50 per share',
      'Total Direct Ownership post-transaction: 1,420,550 shares',
      'Historical context: Insider open-market purchases of this scale by top-tier officers typically signal strong long-term internal valuation support.'
    ],
    sentiment: 'BULLISH'
  },
  'news-3': {
    reportType: 'Annual WWDC Conference Keynote',
    ticker: 'AAPL',
    period: 'Event Date: June 3, 2026',
    summary: 'Apple Inc. is set to initiate its Worldwide Developers Conference. Analysts predict core focus on operating system deep-integration of advanced local and private cloud AI agents.',
    highlights: [
      'Expected launch: Siri 3.0 autonomous system-level action engine',
      'Partnership confirmations: Potential deep-link integration with cloud API providers',
      'Hardware announcements: Next-generation M4 Ultra chip for desktop professionals',
      'Market impact: Historically, Apple WWDC keynotes produce intraday volatility in consumer electronics suppliers and competitors.'
    ],
    sentiment: 'BULLISH',
    analystRating: 'Consensus: Overweight'
  },
  'news-4': {
    reportType: 'Q2 Production & Delivery Metrics Release',
    ticker: 'TSLA',
    period: 'Q2 2026 Deliveries',
    summary: 'Tesla, Inc. will report its quarterly aggregate vehicle delivery and assembly metrics. Crucial benchmark for global EV market demand trajectories and structural pricing margins.',
    highlights: [
      'Delivery Consensus: 442,000 vehicles (VS 412,000 Q1)',
      'Production Consensus: 455,000 vehicles',
      'Expected Energy Storage deployment: 4.8 GWh',
      'Key focus: Model Y refresh delivery momentum in EMEA and APAC, regulatory credit income'
    ],
    sentiment: 'NEUTRAL',
    optionImpliedMove: '±6.8%'
  },
  'news-5': {
    reportType: 'SEC Form 10-Q (Quarterly Financial Disclosure)',
    ticker: 'GOOG',
    period: 'Q1 2026',
    summary: 'Alphabet Inc. quarterly financial disclosure detailing revenue segments across Google Search, YouTube Ads, Google Cloud, and Other Bets.',
    highlights: [
      'Google Cloud operating income margins expanded to 11.2%',
      'Total capital expenditures: $12.1B (mostly TPU and GPU clusters)',
      'Share buyback update: $15.4B of stock repurchased under current program',
      'Regulatory risks: Sizable update regarding DOJ antitrust trial progress and legal defense accruals'
    ],
    sentiment: 'NEUTRAL'
  },
  'news-6': {
    reportType: 'Board of Directors Dividend Announcement',
    ticker: 'META',
    period: 'Q2 Dividend Cycle',
    summary: 'Meta Platforms Inc. announced a recurring quarterly cash dividend declaration, reinforcing capital allocation policy matching ongoing share buyback execution.',
    highlights: [
      'Dividend amount: $0.50 per share of Common Stock',
      'Record Date: June 15, 2026 | Payout Date: June 30, 2026',
      'Annual Dividend Yield: ~0.45% at current market prices',
      'Capital returned metrics: Dividend represents a total cash outlay of approximately $1.28 Billion quarterly.'
    ],
    sentiment: 'BULLISH'
  }
};

export default function EconomicCalendar({ events }: EconomicCalendarProps) {
  const [selectedImpacts, setSelectedImpacts] = useState<Record<'HIGH' | 'MEDIUM' | 'LOW', boolean>>({
    HIGH: true,
    MEDIUM: true,
    LOW: true,
  });

  const [newsPage, setNewsPage] = useState(0);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  useEffect(() => {
    setNewsPage(0);
  }, [selectedImpacts]);

  const toggleImpact = (impact: 'HIGH' | 'MEDIUM' | 'LOW') => {
    setSelectedImpacts((prev) => ({
      ...prev,
      [impact]: !prev[impact],
    }));
  };

  const targetTime = useMemo(() => new Date('2026-06-01T10:21:59Z'), []);

  const imminentEvent = useMemo(() => {
    return events.find((ev) => {
      if (ev.impact !== 'HIGH') return false;
      const evTime = new Date(ev.time);
      const diffMs = evTime.getTime() - targetTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 4;
    });
  }, [events, targetTime]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => selectedImpacts[ev.impact]);
  }, [events, selectedImpacts]);

  const newsPageSize = 5;
  const totalNews = filteredEvents.length;
  const totalNewsPages = Math.ceil(totalNews / newsPageSize);
  const newsStartIndex = newsPage * newsPageSize;
  const newsEndIndex = Math.min(newsStartIndex + newsPageSize, totalNews);
  
  const displayedEvents = useMemo(() => {
    return filteredEvents.slice(newsStartIndex, newsEndIndex);
  }, [filteredEvents, newsStartIndex, newsEndIndex]);

  const getImpactBadge = (impact: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (impact) {
      case 'HIGH':
        return (
          <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] rounded font-semibold font-mono uppercase tracking-wide">
            High Volatility
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] rounded font-semibold font-mono uppercase tracking-wide">
            Med Volatility
          </span>
        );
      case 'LOW':
        return (
          <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/40 text-[9px] rounded font-semibold font-mono uppercase tracking-wide">
            Low Volatility
          </span>
        );
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <div id="economic-calendar-root" className="bg-[#08080a] border border-white/10 rounded-lg p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] h-full flex flex-col justify-between">
      <div>
        {/* TITLE HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded border border-indigo-500/25 text-indigo-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs md:text-sm font-mono uppercase tracking-widest">Earnings & filings desk</h4>
              <p className="text-[9.5px] text-white/40 uppercase tracking-wider font-mono">SEC EDGAR & Corporate Event Stream</p>
            </div>
          </div>
          <div className="text-[9px] bg-black/40 px-2.5 py-1 border border-white/5 text-indigo-300 rounded font-mono font-bold">
            DATE: 2026-06-01 | 10:21 UTC
          </div>
        </div>

        {/* Dynamic News Impact Filters */}
        <div className="flex items-center justify-between mt-3.5 pb-2.5 border-b border-white/5 select-none">
          <span className="text-[10px] text-white/35 uppercase tracking-wider font-mono font-bold">Volatility Filter</span>
          <div className="flex gap-1.5">
            {(['HIGH', 'MEDIUM', 'LOW'] as const).map((impact) => (
              <button
                key={impact}
                onClick={() => toggleImpact(impact)}
                className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-black tracking-tight cursor-pointer border transition-all ${
                  selectedImpacts[impact]
                    ? impact === 'HIGH' 
                      ? 'bg-red-500/15 border-red-500/30 text-rose-400' 
                      : impact === 'MEDIUM'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-white/10 border-white/20 text-white/80'
                    : 'bg-transparent border-white/5 text-white/20 hover:border-white/10'
                }`}
              >
                {impact}
              </button>
            ))}
          </div>
        </div>

        {/* Trade Hold Status warning */}
        {imminentEvent && (
          <div id="news-block-alert" className="mt-4 p-4.5 bg-red-950/20 border border-red-500/35 rounded text-rose-300 text-xs flex items-start space-x-3 shadow-md animate-pulse">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-rose-400 font-mono text-[10.5px]">
                ⚠️ IMMINENT HIGH-STAKES CORPORATE RELEASE
              </p>
              <p className="mt-1 leading-relaxed text-rose-300 text-[10.5px]">
                NVIDIA ({imminentEvent.currency}) is scheduled to release its <span className="font-bold underline">{imminentEvent.title}</span> in less than 4 hours. Option chain volatility is surging; freeze automatic tech equity setups.
              </p>
            </div>
          </div>
        )}

        {/* Events listing */}
        <div className="space-y-3 mt-4 max-h-[380px] overflow-y-auto pr-1">
          {displayedEvents.length === 0 ? (
            <div id="news-empty-state" className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/5 rounded bg-[#030303]/40">
              <span className="text-xs text-white/25 font-mono">No corporate events match selected filters</span>
              <button 
                id="btn-reset-news-filters"
                onClick={() => setSelectedImpacts({ HIGH: true, MEDIUM: true, LOW: true })}
                className="mt-3 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold font-mono transition-colors uppercase tracking-wider cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            displayedEvents.map((ev) => {
              const isHigh = ev.impact === 'HIGH';
              const isExpanded = expandedEventId === ev.id;
              const details = EVENT_SEC_FILINGS[ev.id];
              
              return (
                <div key={ev.id} className="space-y-2">
                  <div
                    onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                    className={`p-3.5 rounded border flex items-center justify-between transition-all hover:bg-white/5 cursor-pointer ${
                      isHigh ? 'bg-red-500/5 border-red-500/20' : 'bg-[#050505]/40 border-white/5'
                    } ${isExpanded ? 'border-indigo-500/40 bg-indigo-950/5' : ''}`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className={`p-2 rounded font-mono font-black text-xs shrink-0 ${
                        isHigh ? 'bg-red-500/10 text-rose-300' : 'bg-white/5 text-[#e5e5e5]'
                      }`}>
                        {ev.currency}
                      </div>
                      <div className="truncate">
                        <h5 className="font-bold text-white/95 text-xs truncate font-sans">{ev.title}</h5>
                        <div className="flex items-center space-x-2 mt-1 leading-none">
                          <Clock className="w-3 h-3 text-white/30" />
                          <span className="text-[10px] text-white/40 font-mono">
                            {formatTime(ev.time)}
                          </span>
                          <span className="text-white/20">|</span>
                          <span className="text-[9px] text-indigo-400 font-mono flex items-center gap-0.5">
                            {isExpanded ? 'Click to hide draft' : 'Click to inspect SEC EDGAR draft'}
                            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <div className="mb-1.5">{getImpactBadge(ev.impact)}</div>
                      <div className="font-mono text-[9px] text-white/30 grid grid-cols-2 gap-x-2">
                        <span>EST: <span className="text-[#e5e5e5]/80">{ev.forecast}</span></span>
                        <span>ACT: <span className="text-white/45">{ev.actual || 'PENDING'}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* COLLAPSIBLE SEC EDGAR DETAILS PANEL */}
                  <AnimatePresence>
                    {isExpanded && details && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-[#040406] border border-white/5 rounded-lg p-3.5 text-xs text-white/70 space-y-3 shadow-inner"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-white/5 font-mono text-[10px]">
                          <div className="flex items-center gap-1.5 text-indigo-300">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{details.reportType}</span>
                          </div>
                          <span className="text-white/30">{details.period}</span>
                        </div>

                        <p className="leading-relaxed text-white/80">{details.summary}</p>

                        <div className="space-y-1.5 pl-2.5 border-l border-indigo-500/35">
                          {details.highlights.map((hl, idx) => (
                            <div key={idx} className="flex items-start gap-1 text-[11px] text-white/70">
                              <span className="text-indigo-400 font-mono font-bold">•</span>
                              <span>{hl}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 font-mono text-[9.5px]">
                          <div className="flex items-center gap-1">
                            <span className="text-white/30">Model Sentiment Bias:</span>
                            <span className={`font-black uppercase px-1 rounded ${
                              details.sentiment === 'BULLISH' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-neutral-500/15 text-white/60'
                            }`}>
                              {details.sentiment}
                            </span>
                          </div>
                          {details.optionImpliedMove && (
                            <div className="text-amber-400 font-bold">
                              Implied Move: {details.optionImpliedMove}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Dynamic Inline Pagination for News Events */}
        {totalNewsPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-3 font-mono text-[10px] text-white/50 select-none">
            <span className="text-[9.5px] text-white/30 font-sans">
              Showing <span className="font-bold font-mono text-indigo-400">{newsStartIndex + 1}</span>-
              <span className="font-bold font-mono text-indigo-400">{newsEndIndex}</span> of{' '}
              <span className="font-bold font-mono text-indigo-200">{totalNews}</span> events
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setNewsPage(prev => Math.max(0, prev - 1))}
                disabled={newsPage === 0}
                className={`px-2 py-0.5 rounded border text-[9.5px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer select-none ${
                  newsPage === 0
                    ? 'border-white/5 text-white/20 bg-transparent cursor-not-allowed'
                    : 'border-white/10 text-white/75 bg-white/5 hover:border-indigo-500/40 hover:text-indigo-300'
                }`}
              >
                ◀ Prev
              </button>
              <button
                onClick={() => setNewsPage(prev => Math.min(totalNewsPages - 1, prev + 1))}
                disabled={newsPage === totalNewsPages - 1}
                className={`px-2 py-0.5 rounded border text-[9.5px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer select-none ${
                  newsPage === totalNewsPages - 1
                    ? 'border-white/5 text-white/20 bg-transparent cursor-not-allowed'
                    : 'border-white/10 text-white/75 bg-white/5 hover:border-indigo-500/40 hover:text-indigo-300'
                }`}
              >
                Next ▶
              </button>
            </div>
          </div>
        )}

      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/30">
        <span className="flex items-center">
          <Terminal className="w-3.5 h-3.5 mr-1 text-white/30" />
          <span>EDGAR Feed Sync latency: &lt; 0.5s</span>
        </span>
        <span className="text-emerald-400 flex items-center font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping mr-1.5 animate-pulse"></span>
          <span>Live Ingress</span>
        </span>
      </div>
    </div>
  );
}
