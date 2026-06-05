import React, { useState, useEffect } from 'react';
import { BreachEvent } from '../types';
import { 
  ShieldAlert, 
  Search, 
  Download, 
  Clock, 
  RefreshCw,
  FileCheck
} from 'lucide-react';

export default function HistoricalBreachLog() {
  const [breaches, setBreaches] = useState<BreachEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchBreaches = async () => {
    try {
      const res = await fetch('/api/risk/breaches');
      if (res.ok) {
        const data = await res.json();
        setBreaches(data);
      }
    } catch (e) {
      console.error('Failed to sync breach log:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBreaches();
    
    // Poll breaches every 8 seconds to reflect any live terminal breaches
    const interval = setInterval(() => {
      fetchBreaches();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBreaches();
  };

  const filteredBreaches = breaches.filter(b => 
    b.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportCSV = () => {
    let csv = 'Timestamp,Symbol Responsible,Active Exposure (%),PnL Impact ($),Reason\n';
    breaches.forEach(b => {
      csv += `"${b.timestamp}",${b.symbol},${b.exposure},${b.pnlAtBreach},"${b.reason.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Historical_Exposure_Breaches_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      id="historical-breach-log-workspace" 
      className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 flex flex-col h-auto"
    >
      {/* Header controls layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 mb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-rose-500/10 rounded border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Historical Compliance Breach Log
              </h3>
              <p className="text-[10px] text-white/30 font-mono mt-0.5">
                Audit log monitoring account threshold exposure over-steps (Cap: 1.50%)
              </p>
            </div>
          </div>
        </div>

        {/* Search & Action bar */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="breach-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter symbol/reason..."
              className="bg-black/50 text-[10px] text-white font-mono rounded border border-white/10 hover:border-white/15 focus:border-indigo-500/50 pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-0 placeholder-white/20 w-44"
            />
          </div>

          <button
            id="btn-breach-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded border border-white/5 transition-all text-xs flex items-center space-x-1 font-mono cursor-pointer disabled:opacity-50 font-semibold"
            title="Reload log"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            id="btn-breach-export"
            onClick={exportCSV}
            disabled={breaches.length === 0}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white rounded border border-white/5 transition-all text-[10px] uppercase font-mono font-bold flex items-center space-x-1 cursor-pointer select-none"
            title="Download CSV"
          >
            <Download className="w-3 h-3" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table view / list box */}
      <div className="overflow-x-auto min-h-[140px] max-h-[280px] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
            <p className="text-[10px] font-mono text-white/30 uppercase">Fetching security records...</p>
          </div>
        ) : filteredBreaches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileCheck className="w-8 h-8 text-emerald-500/20 mb-2" />
            <h4 className="text-[10.5px] font-mono text-white/50 uppercase font-black">All compliance audits clear</h4>
            <p className="text-[9.5px] text-white/30 font-sans mt-1 max-w-[320px] mx-auto">
              {searchQuery ? 'No compliance records match your current filter query.' : 'No active or historical exposure breaches detected above the 1.50% threshold guideline.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left font-mono border-collapse text-[10.5px]">
            <thead>
              <tr className="border-b border-white/5 text-[9px] uppercase text-white/30 select-none pb-2">
                <th className="pb-2.5 font-bold">Severity</th>
                <th className="pb-2.5 font-bold">Incurred Timestamp</th>
                <th className="pb-2.5 font-bold">Asset Cause</th>
                <th className="pb-2.5 font-bold text-right">Exposure Value</th>
                <th className="pb-2.5 font-bold text-right">PnL Buffer Delta</th>
                <th className="pb-2.5 font-bold pl-6">Failure Diagnostics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredBreaches.map((b) => {
                const exposureSeverityColor = b.exposure >= 1.8 ? 'text-rose-500' : 'text-amber-500';
                const formattedDate = new Date(b.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                });

                return (
                  <tr key={b.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="py-2.5 select-none text-[9.5px]">
                      <span className={`px-1.5 py-0.5 rounded font-black border uppercase ${
                        b.exposure >= 1.8 
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {b.exposure >= 1.8 ? 'CRITICAL' : 'WARNING'}
                      </span>
                    </td>
                    <td className="py-2.5 text-white/60">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3 h-3 text-white/20" />
                        <span>{formattedDate}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-white font-extrabold pr-4">
                      {b.symbol}
                    </td>
                    <td className={`py-2.5 text-right font-black ${exposureSeverityColor}`}>
                      {b.exposure.toFixed(2)}%
                    </td>
                    <td className="py-2.5 text-right text-rose-400/90 font-bold">
                      -${Math.abs(b.pnlAtBreach).toFixed(2)}
                    </td>
                    <td className="py-2.5 text-white/40 group-hover:text-white/60 transition-colors pl-6 max-w-[340px] truncate leading-relaxed text-[10px]" title={b.reason}>
                      {b.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom informational footline */}
      <div className="flex justify-between items-center border-t border-white/5 pt-3.5 mt-3 text-[9px] text-white/20 font-mono select-none">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>Risk Watchdog Listening</span>
        </div>
        <span>Total Logs Recorded: {breaches.length} incidents</span>
      </div>
    </div>
  );
}
