/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { NewsEvent } from '../types';
import { Calendar, AlertOctagon, Terminal, Clock, ShieldAlert } from 'lucide-react';

interface EconomicCalendarProps {
  events: NewsEvent[];
}

export default function EconomicCalendar({ events }: EconomicCalendarProps) {
  // Use filter state for HIGH, MEDIUM, LOW impact events
  const [selectedImpacts, setSelectedImpacts] = useState<Record<'HIGH' | 'MEDIUM' | 'LOW', boolean>>({
    HIGH: true,
    MEDIUM: true,
    LOW: true,
  });

  const toggleImpact = (impact: 'HIGH' | 'MEDIUM' | 'LOW') => {
    setSelectedImpacts((prev) => ({
      ...prev,
      [impact]: !prev[impact],
    }));
  };

  // Check if any high-impact news event is coming up soon
  // Let's assume current time is June 1st, 2026 10:21:59Z, matching our context
  const targetTime = useMemo(() => new Date('2026-06-01T10:21:59Z'), []);

  const imminentEvent = useMemo(() => {
    // Find if any HIGH impact news is within 4 hours of June 1st 10:21 AM
    // (Notice ISM Manufacturing is at 14:00, which is exactly 3 hours 38 minutes away!)
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

  const getImpactBadge = (impact: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (impact) {
      case 'HIGH':
        return (
          <span id="news-impact-high" className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-rose-400 text-[10px] rounded font-semibold font-mono uppercase tracking-wide">
            High Impact
          </span>
        );
      case 'MEDIUM':
        return (
          <span id="news-impact-medium" className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] rounded font-semibold font-mono uppercase tracking-wide">
            Med Impact
          </span>
        );
      case 'LOW':
        return (
          <span id="news-impact-low" className="px-2 py-1 bg-[#0c0c0c] border border-white/10 text-white/40 text-[10px] rounded font-semibold font-mono uppercase tracking-wide">
            Low Impact
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
    <div id="economic-calendar-root" className="bg-[#080808] border border-white/10 rounded p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/10 rounded">
              <Calendar className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm md:text-base font-sans">Econ News Radar</h4>
              <p className="text-xs text-white/40 font-mono uppercase tracking-tight">Forex Factory Live Feed</p>
            </div>
          </div>
          <div className="text-[10px] bg-[#050505] px-2 py-1 border border-white/10 text-white/40 rounded font-mono">
            Time: 10:21 UTC
          </div>
        </div>

        {/* Dynamic News Impact Filters */}
        <div className="flex items-center justify-between mt-3.5 pb-2.5 border-b border-white/5 select-none">
          <span className="text-[10px] text-white/35 uppercase tracking-wider font-mono font-bold">Impact Filter</span>
          <div className="flex gap-1.5">
            <button
              id="btn-filter-news-high"
              onClick={() => toggleImpact('HIGH')}
              className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-tight cursor-pointer border transition-all ${
                selectedImpacts.HIGH
                  ? 'bg-red-500/15 border-red-500/30 text-rose-400'
                  : 'bg-transparent border-white/5 text-white/20 hover:border-white/10 hover:text-white/40'
              }`}
            >
              High
            </button>
            <button
              id="btn-filter-news-medium"
              onClick={() => toggleImpact('MEDIUM')}
              className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-tight cursor-pointer border transition-all ${
                selectedImpacts.MEDIUM
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-transparent border-white/5 text-white/20 hover:border-white/10 hover:text-white/40'
              }`}
            >
              Medium
            </button>
            <button
              id="btn-filter-news-low"
              onClick={() => toggleImpact('LOW')}
              className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold tracking-tight cursor-pointer border transition-all ${
                selectedImpacts.LOW
                  ? 'bg-white/10 border-white/25 text-white/80'
                  : 'bg-transparent border-white/5 text-white/20 hover:border-white/10 hover:text-white/40'
              }`}
            >
              Low
            </button>
          </div>
        </div>

        {/* Trade Hold Status warning */}
        {imminentEvent && (
          <div id="news-block-alert" className="mt-4 p-4.5 bg-red-950/20 border border-red-500/35 rounded text-rose-300 text-xs flex items-start space-x-3 shadow-md animate-pulse">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-rose-400">
                Automated Trade Freeze Warning
              </p>
              <p className="mt-1 leading-relaxed text-rose-300">
                A high impact event (<span className="font-bold underline">{imminentEvent.title}</span>) is scheduled today in less than 4 hours. No new setups should be triggered until 30 minutes post-release.
              </p>
            </div>
          </div>
        )}

        {/* Events listing */}
        <div className="space-y-3.5 mt-4 max-h-[310px] overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <div id="news-empty-state" className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/5 rounded bg-[#030303]/40">
              <span className="text-xs text-white/25 font-mono">No news events match selected filter</span>
              <button 
                id="btn-reset-news-filters"
                onClick={() => setSelectedImpacts({ HIGH: true, MEDIUM: true, LOW: true })}
                className="mt-3 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold font-mono transition-colors uppercase tracking-wider cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isHigh = ev.impact === 'HIGH';
              return (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded border flex items-center justify-between transition-all hover:bg-white/5 ${
                    isHigh ? 'bg-red-500/5 border-red-500/20' : 'bg-[#050505]/40 border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className={`p-2 rounded font-mono font-bold text-xs shrink-0 ${isHigh ? 'bg-red-500/10 text-rose-300' : 'bg-white/5 text-[#e5e5e5]'}`}>
                      {ev.currency}
                    </div>
                    <div className="truncate">
                      <h5 className="font-medium text-white/80 text-xs truncate font-sans">{ev.title}</h5>
                      <div className="flex items-center space-x-2 mt-1 leading-none">
                        <Clock className="w-3 h-3 text-white/30" />
                        <span className="text-[10px] text-white/40 font-mono">
                          {formatTime(ev.time)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <div className="mb-1.5">{getImpactBadge(ev.impact)}</div>
                    <div className="font-mono text-[9px] text-white/30 grid grid-cols-2 gap-x-2">
                      <span>F: <span className="text-[#e5e5e5]/80">{ev.forecast}</span></span>
                      <span>P: <span className="text-white/45">{ev.previous}</span></span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/30">
        <span className="flex items-center">
          <Terminal className="w-3.5 h-3.5 mr-1 text-white/30" />
          <span>System: Auto-Sync Latency &lt; 2s</span>
        </span>
        <span className="text-emerald-400 flex items-center font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping mr-1.5"></span>
          <span>Online</span>
        </span>
      </div>
    </div>
  );
}
