import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingDown, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Download, 
  Filter, 
  Activity, 
  Calendar,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Trade } from '../types';

interface RiskSessionLog {
  id: string;
  sessionName: string;
  date: string;
  peakDrawdown: number; // max % drawdown reached during session
  endDrawdown: number;  // ending % drawdown of session
  averageExposure: number; // % margin/capital exposure
  pnlImpact: number; // USD
  activePositions: number;
  volatilityGrade: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  hedged: boolean;
  notes: string;
}

interface RiskExposureJournalProps {
  trades: Trade[];
}

const DEFAULT_SESSIONS: RiskSessionLog[] = [
  {
    id: 'seq-1',
    sessionName: 'US CPI Headline Release Sweep',
    date: '2026-06-10',
    peakDrawdown: 4.65,
    endDrawdown: 1.20,
    averageExposure: 3.50,
    pnlImpact: -1450,
    activePositions: 5,
    volatilityGrade: 'CRITICAL',
    hedged: false,
    notes: 'Extreme bid-ask liquidity slippage on target stop-loss levels. High-frequency algorithm sweeps triggered multiple standard buy stops before returning to base value.'
  },
  {
    id: 'seq-2',
    sessionName: 'London Breakout Reversal Phase',
    date: '2026-06-11',
    peakDrawdown: 1.80,
    endDrawdown: 0.40,
    averageExposure: 1.20,
    pnlImpact: 890,
    activePositions: 3,
    volatilityGrade: 'MEDIUM',
    hedged: true,
    notes: 'Correlation hedging active across EUR/USD and GBP/USD. Protected aggregate margin while capturing structural breakout continuation.'
  },
  {
    id: 'seq-3',
    sessionName: 'FOMC Interest Rate Speculation',
    date: '2026-06-12',
    peakDrawdown: 3.10,
    endDrawdown: 2.85,
    averageExposure: 2.40,
    pnlImpact: -820,
    activePositions: 4,
    volatilityGrade: 'HIGH',
    hedged: false,
    notes: 'Exceeded maximum sector lot boundaries before decision announcement. High volatile swings resulted in early invalidations.'
  },
  {
    id: 'seq-4',
    sessionName: 'Tokyo Midday Sideways Range',
    date: '2026-06-15',
    peakDrawdown: 0.35,
    endDrawdown: 0.10,
    averageExposure: 0.80,
    pnlImpact: 240,
    activePositions: 2,
    volatilityGrade: 'LOW',
    hedged: true,
    notes: 'Clean low-risk mean reversion trading near supply block. Low volume pools reduced potential risk-to-reward variance.'
  },
  {
    id: 'seq-5',
    sessionName: 'New York Open Liquidity Grab',
    date: '2026-06-16',
    peakDrawdown: 2.15,
    endDrawdown: -0.80, // Negative drawdown means ending in net profit high above start water mark
    averageExposure: 1.95,
    pnlImpact: 1780,
    activePositions: 6,
    volatilityGrade: 'HIGH',
    hedged: true,
    notes: 'Swept sell-side liquidity pools on Gold before institutional bid expansion. Captured 1:3.2 risk-reward ratios.'
  }
];

export default function RiskExposureJournal({ trades }: RiskExposureJournalProps) {
  const [sessions, setSessions] = useState<RiskSessionLog[]>(() => {
    try {
      const stored = localStorage.getItem('apex_risk_sessions_journal');
      return stored ? JSON.parse(stored) : DEFAULT_SESSIONS;
    } catch {
      return DEFAULT_SESSIONS;
    }
  });

  // Log Form State
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPeakDD, setFormPeakDD] = useState('');
  const [formEndDD, setFormEndDD] = useState('');
  const [formAvgExposure, setFormAvgExposure] = useState('');
  const [formPnl, setFormPnl] = useState('');
  const [formPositions, setFormPositions] = useState('');
  const [formVol, setFormVol] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [formHedged, setFormHedged] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterVol, setFilterVol] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);

  // Sync to localstorage
  useEffect(() => {
    localStorage.setItem('apex_risk_sessions_journal', JSON.stringify(sessions));
  }, [sessions]);

  // Handle manually logging modern workspace stats
  const handleAutoFillFromActive = () => {
    const closedThisSession = trades.filter(t => t.status === 'CLOSED');
    const openTradesCount = trades.filter(t => t.status === 'OPEN').length;
    
    // Compute total session PnL
    const totalPnl = closedThisSession.reduce((acc, t) => acc + t.pnl, 0);
    const posCount = closedThisSession.length + openTradesCount;

    // Estimate realistic peak drawdown based on closed trades losses & current margin metrics
    let peakDD = 0.05; // base simulation
    let endDD = 0.02;
    
    const worstClosed = closedThisSession.filter(t => t.pnl < 0);
    const sumLosses = Math.abs(worstClosed.reduce((acc, t) => acc + t.pnl, 0));
    
    if (sumLosses > 0) {
      // simulate percentage metric of $100k account
      peakDD = parseFloat(Math.min(9.5, (sumLosses / 100000) * 100 + 0.5).toFixed(2));
      endDD = parseFloat(((totalPnl < 0 ? Math.abs(totalPnl) : 0) / 100000 * 100).toFixed(2));
    }

    setFormName('Active Terminal WorkSession');
    setFormPeakDD(String(peakDD > 0 ? peakDD : 0.45));
    setFormEndDD(String(endDD > 0 ? endDD : 0.15));
    setFormAvgExposure(String(openTradesCount > 0 ? (openTradesCount * 0.85).toFixed(2) : '1.20'));
    setFormPnl(String(Math.round(totalPnl)));
    setFormPositions(String(posCount || 2));
    setFormNotes(`Auto-filled from workspace. Evaluated ${closedThisSession.length} closed trades and ${openTradesCount} active positions.`);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const newSession: RiskSessionLog = {
      id: 'session_' + Math.random().toString(36).substring(2, 9),
      sessionName: formName,
      date: formDate,
      peakDrawdown: parseFloat(formPeakDD) || 0.0,
      endDrawdown: parseFloat(formEndDD) || 0.0,
      averageExposure: parseFloat(formAvgExposure) || 0.0,
      pnlImpact: parseFloat(formPnl) || 0,
      activePositions: parseInt(formPositions) || 0,
      volatilityGrade: formVol,
      hedged: formHedged,
      notes: formNotes
    };

    setSessions(prev => [newSession, ...prev]);
    
    // Clear Form fields
    setFormName('');
    setFormPeakDD('');
    setFormEndDD('');
    setFormAvgExposure('');
    setFormPnl('');
    setFormPositions('');
    setFormNotes('');
    setShowAddForm(false);
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm("Delete this Session Drawdown Record?")) {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  // Analytics Computation
  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return { peakLifetme: 0, avgPeak: 0, criticalCount: 0, overallScore: 100 };
    }
    const peaks = sessions.map(s => s.peakDrawdown);
    const peakLifetme = Math.max(...peaks);
    const avgPeak = peaks.reduce((a, b) => a + b, 0) / sessions.length;
    const criticalCount = sessions.filter(s => s.volatilityGrade === 'CRITICAL' || s.peakDrawdown >= 4.0).length;

    // Resilience score (scales down as drawdowns / critical sessions rise)
    let baseResilience = 100 - (avgPeak * 10);
    if (criticalCount > 0) baseResilience -= (criticalCount * 8);
    const overallScore = Math.max(5, Math.min(100, Math.round(baseResilience)));

    return { peakLifetme, avgPeak, criticalCount, overallScore };
  }, [sessions]);

  // Filtered lists
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchSearch = s.sessionName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.date.includes(searchQuery);
      const matchVol = filterVol === 'ALL' || s.volatilityGrade === filterVol;
      return matchSearch && matchVol;
    });
  }, [sessions, searchQuery, filterVol]);

  // Chart data formatting (ordered chronological)
  const chartData = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(s => ({
        name: s.sessionName.length > 18 ? s.sessionName.substring(0, 15) + '...' : s.sessionName,
        'Peak Drawdown (%)': s.peakDrawdown,
        'Ending Drawdown (%)': Math.max(0, s.endDrawdown),
        'Margin Exposure (%)': s.averageExposure,
        date: s.date
      }));
  }, [sessions]);

  const exportCSV = () => {
    let csv = 'Session ID,Session Name,Date,Peak Drawdown (%),Ending Drawdown (%),Avg Exposure (%),PnL Impact ($),Active Positions,Volatility Grade,Hedged Protective Status,Notes\n';
    sessions.forEach(s => {
      const escapedNotes = s.notes.replace(/"/g, '""');
      csv += `${s.id},"${s.sessionName}",${s.date},${s.peakDrawdown},${s.endDrawdown},${s.averageExposure},${s.pnlImpact},${s.activePositions},${s.volatilityGrade},${s.hedged ? 'ACTIVE' : 'NONE'},"${escapedNotes}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `historical_risk_exposure_journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="risk-exposure-journal-workspace" className="space-y-6">
      
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 select-none">
        <div className="p-3.5 bg-[#0a0a0b] rounded-lg border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-white/30 text-[8.5px] uppercase font-bold tracking-wider">Peak Lifetime Drawdown</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold font-mono text-rose-450 tracking-tight">
              {stats.peakLifetme.toFixed(2)}%
            </span>
            <span className="text-[8.5px] text-white/30 block mt-0.5 font-mono">Max equity dip recorded</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#0a0a0b] rounded-lg border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-white/30 text-[8.5px] uppercase font-bold tracking-wider">Average Peak Drawdown</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-bold font-mono text-amber-450 tracking-tight">
              {stats.avgPeak.toFixed(2)}%
            </span>
            <span className="text-[8.5px] text-white/30 block mt-0.5 font-mono">Mean session performance</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#0a0a0b] rounded-lg border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-white/30 text-[8.5px] uppercase font-bold tracking-wider">Risk Resilience Index</span>
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2.5">
            <span className={`text-xl font-bold font-mono tracking-tight ${
              stats.overallScore > 80 ? 'text-emerald-400' : stats.overallScore > 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {stats.overallScore}% Secure
            </span>
            <span className="text-[8.5px] text-white/30 block mt-0.5 font-mono">Account cushion health</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#0a0a0b] rounded-lg border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-white/30 text-[8.5px] uppercase font-bold tracking-wider">Extreme Volatility Incidents</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-2.5">
            <span className={`text-xl font-bold font-mono tracking-tight ${stats.criticalCount > 0 ? 'text-indigo-400' : 'text-white/60'}`}>
              {stats.criticalCount} Session{stats.criticalCount !== 1 ? 's' : ''}
            </span>
            <span className="text-[8.5px] text-white/30 block mt-0.5 font-mono">{"Sessions with >= 4.0% swing"}</span>
          </div>
        </div>
      </div>

      {/* 2. Volatility Drawdown Trend Chart */}
      <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3.5 mb-4 gap-2">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Session-by-Session Drawdown & Volatility Curve
            </h3>
          </div>
          <span className="text-[8.5px] text-white/40 font-mono">
            Tracks peak intra-session floating drawdown vs terminal end boundaries
          </span>
        </div>

        <div className="h-[230px] w-full mt-3 select-none">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEnd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={8.5} 
                  tickLine={false}
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={8.5} 
                  tickLine={false}
                  fontFamily="monospace"
                  unit="%" 
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontFamily: 'monospace'
                  }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '9px', fontFamily: 'monospace', paddingTop: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Peak Drawdown (%)" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPeak)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Ending Drawdown (%)" 
                  stroke="#3b82f6" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#colorEnd)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-[9.5px] font-mono text-white/30 bg-black/20 rounded border border-dashed border-white/5">
              No historical session coordinates loaded. Log a session below to generate volatility graph.
            </div>
          )}
        </div>
      </div>

      {/* 3. Volatility Mitigation Advice Grid (AI Insights) */}
      <div className="bg-gradient-to-r from-[#6366f1]/5 via-transparent to-transparent border border-indigo-500/10 rounded-lg p-4 select-none flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-500/10 rounded border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono">
              AI Dynamic Vulnerability Assessment
            </h4>
            <p className="text-[10px] text-white/60 leading-relaxed max-w-3xl">
              {stats.criticalCount > 0 ? (
                `Detected ${stats.criticalCount} severe systemic drawdown phases in recent sessions. Our telemetry points to peak volatility triggers surrounding sudden news events (US CPI, FOMC Speculation). To safeguard structural assets, consider establishing a maximum concurrent sector limit of 2 lots, deploying stop guarantees, and reducing primary leveraged sizes by 40% when volatility expectations exceed 4.00%.`
              ) : (
                "Dynamic portfolio volatility looks exceptionally well stabilized. The lifetime drawdown peak resides in high-integrity bounds (under 5.0%), meaning capital exposure guidelines are respected perfectly. Keep maintaining close hedge safeguards across correlated symbol pairs like EUR/USD and Gold."
              )}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end text-right justify-center">
          <span className="text-[8px] text-indigo-400 font-mono uppercase font-black tracking-wider block mb-0.5">Recommended Ceiling</span>
          <span className="font-mono text-base text-white font-extrabold block">2.50% Max Cap</span>
        </div>
      </div>

      {/* 4. Filterable Session Ledger & Create controls */}
      <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5">
        
        {/* Sub-header with Search and Trigger creation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 mb-4 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Session Exposure History Logs
            </h3>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            
            {/* Filter select */}
            <div className="flex items-center space-x-1.5 font-mono">
              <Filter className="w-3.5 h-3.5 text-white/30" />
              <select
                id="vol-grade-filter"
                value={filterVol}
                onChange={(e) => setFilterVol(e.target.value)}
                className="bg-black border border-white/10 hover:border-white/20 select-none text-[10px] px-2.5 py-1 text-white/70 outline-none rounded cursor-pointer transition-colors"
              >
                <option value="ALL">All Volatility</option>
                <option value="LOW">Low Volatility</option>
                <option value="MEDIUM">Medium Vol</option>
                <option value="HIGH">High Volatility</option>
                <option value="CRITICAL">Critical Vol</option>
              </select>
            </div>

            {/* General input search */}
            <input
              type="text"
              placeholder="Search session or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/60 border border-white/10 text-[10.5px] px-3 py-1 text-white placeholder-white/30 outline-none rounded font-mono w-48 focus:border-indigo-500/50"
            />

            {/* CSV Export */}
            <button
              onClick={exportCSV}
              className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white/5 text-white/70 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/[0.08] transition-all rounded flex items-center gap-1 cursor-pointer"
              title="Export all logged session data to CSV"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>

            {/* Log New Button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 text-[9.5px] font-mono font-black uppercase bg-indigo-600 hover:bg-indigo-500 text-white transition-all rounded shadow-md shadow-indigo-950/20 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Cancel Form' : 'Log Session'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Log Session Dropdown Form */}
        {showAddForm && (
          <form 
            onSubmit={handleAddSession} 
            className="p-4 bg-white/[0.01] border border-indigo-500/10 rounded-lg mb-5 space-y-4 animate-downIn"
            id="log-session-form"
          >
            <div className="flex items-center justify-between border-b border-white/[0.03] pb-2">
              <div className="flex items-center space-x-1.5 font-mono text-[10.5px] font-black text-white uppercase">
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Log Custom Session Volatility Coordinates</span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillFromActive}
                className="px-2 py-0.5 text-[8.5px] font-mono font-extrabold uppercase rounded bg-indigo-500/10 border border-indigo-500/35 text-indigo-300 hover:bg-indigo-500/15 cursor-pointer flex items-center gap-1"
                title="Populate stats dynamically based on existing mock calculations and closed journal trades"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Auto-fill from active terminal</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 font-mono">
              <div className="space-y-1">
                <label className="text-[8.5px] text-white/40 uppercase block font-bold">Session Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. US NFP Volatility Swing"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-black border border-white/10 px-2.5 py-1 text-xs text-white rounded outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] text-white/40 uppercase block font-bold">Session Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-black border border-white/10 px-2.5 py-1 text-xs text-white rounded outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] text-white/40 uppercase block font-bold">Peak Drawdown (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 2.45"
                  value={formPeakDD}
                  onChange={(e) => setFormPeakDD(e.target.value)}
                  className="w-full bg-black border border-white/10 px-2.5 py-1 text-xs text-white rounded outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] text-white/40 uppercase block font-bold">Ending Drawdown (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 0.85"
                  value={formEndDD}
                  onChange={(e) => setFormEndDD(e.target.value)}
                  className="w-full bg-black border border-white/10 px-2.5 py-1 text-xs text-white rounded outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] text-white/40 uppercase block font-bold">Average Lot Exposure (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 1.50"
                  value={formAvgExposure}
                  onChange={(e) => setFormAvgExposure(e.target.value)}
                  className="w-full bg-black border border-white/10 px-2.5 py-1 text-xs text-white rounded outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] text-white/40 uppercase block font-bold">Session PnL Impact ($)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. -450 or 1200"
                  value={formPnl}
                  onChange={(e) => setFormPnl(e.target.value)}
                  className="w-full bg-black border border-white/10 px-2.5 py-1 text-xs text-white rounded outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] text-white/40 uppercase block font-bold">Active Placement count</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 4"
                  value={formPositions}
                  onChange={(e) => setFormPositions(e.target.value)}
                  className="w-full bg-black border border-white/10 px-2.5 py-1 text-xs text-white rounded outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] text-white/40 uppercase block font-bold">Volatility grade</label>
                <select
                  value={formVol}
                  onChange={(e: any) => setFormVol(e.target.value)}
                  className="w-full bg-black border border-white/10 px-2.5 py-1.5 text-xs text-white rounded outline-none cursor-pointer focus:border-indigo-500"
                >
                  <option value="LOW">Low Volatility</option>
                  <option value="MEDIUM">Medium Vol</option>
                  <option value="HIGH">High Volatility</option>
                  <option value="CRITICAL">Critical Vol / Spike</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 font-mono items-center">
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[8.5px] text-white/40 uppercase block font-bold">Annotated Risk Context Notes</label>
                <textarea
                  placeholder="Analyze bid depth, slippage incidents, or correlation triggers..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-black border border-white/10 px-2.5 py-1 text-[11px] text-white rounded outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="space-y-3 pt-3">
                <label className="flex items-center space-x-2 text-[10px] text-white/70 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formHedged}
                    onChange={(e) => setFormHedged(e.target.checked)}
                    className="accent-indigo-500 w-3.5 h-3.5 rounded border border-white/10 text-indigo-600 bg-black"
                  />
                  <span>Protective Hedges Active?</span>
                </label>
                
                <button
                  type="submit"
                  className="w-full py-1.5 text-[9.5px] font-bold uppercase tracking-wider rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow shadow-indigo-900 transition-all cursor-pointer"
                >
                  Save to Log Record
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 5. Logs Table Grid */}
        <div className="border border-white/5 rounded-lg overflow-hidden bg-black/45 shadow select-none">
          <div className="grid grid-cols-12 bg-white/[0.03] px-4 py-2 border-b border-white/5 text-[8.5px] font-bold uppercase font-mono tracking-wider text-white/40">
            <span className="col-span-3">Session Details</span>
            <span className="col-span-1 text-center">Peak Drawdown</span>
            <span className="col-span-2 text-center">End Drawdown</span>
            <span className="col-span-1 text-center">Exposure</span>
            <span className="col-span-1 text-center">PnL Impact</span>
            <span className="col-span-2 text-center">Positions / Hedge</span>
            <span className="col-span-1 text-center">Volatility</span>
            <span className="col-span-1 text-right">Action</span>
          </div>

          <div className="divide-y divide-white/5">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <div 
                  key={session.id} 
                  className="grid grid-cols-12 px-4 py-3 items-center hover:bg-white/[0.01] transition-all"
                >
                  {/* Title & Date */}
                  <div className="col-span-3 flex flex-col gap-0.5">
                    <span className="font-bold text-[10.5px] text-white truncate max-w-full font-sans" title={session.sessionName}>
                      {session.sessionName}
                    </span>
                    <span className="text-[8.5px] text-white/30 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-white/20" />
                      {session.date}
                    </span>
                  </div>

                  {/* Peak Drawdown */}
                  <div className="col-span-1 text-center font-mono font-bold text-rose-450 text-[11px]">
                    {session.peakDrawdown.toFixed(2)}%
                  </div>

                  {/* End Drawdown */}
                  <div className="col-span-2 text-center font-mono text-[10px] text-white/70">
                    <span className={session.endDrawdown < 0 ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
                      {session.endDrawdown < 0 ? `+${Math.abs(session.endDrawdown).toFixed(2)}% Net` : `${session.endDrawdown.toFixed(2)}%`}
                    </span>
                  </div>

                  {/* Avg Exposure */}
                  <div className="col-span-1 text-center font-mono text-[10.5px] text-white/60">
                    {session.averageExposure.toFixed(2)}%
                  </div>

                  {/* PnL Impact */}
                  <div className="col-span-1 text-center font-mono text-[10.5px] font-semibold">
                    <span className={session.pnlImpact >= 0 ? 'text-emerald-450' : 'text-rose-450'}>
                      {session.pnlImpact >= 0 ? `+$${session.pnlImpact}` : `-$${Math.abs(session.pnlImpact)}`}
                    </span>
                  </div>

                  {/* Positions / Hedge */}
                  <div className="col-span-2 text-center font-mono text-[9.5px]">
                    <div className="flex flex-col items-center gap-0.5 justify-center">
                      <span className="text-white/60">{session.activePositions} positions</span>
                      <span className={`text-[7px] font-black uppercase px-1 rounded border leading-none ${
                        session.hedged 
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' 
                          : 'bg-white/5 text-white/30 border-white/5'
                      }`}>
                        {session.hedged ? 'Hedges Active' : 'No Hedges'}
                      </span>
                    </div>
                  </div>

                  {/* Volatility Grade */}
                  <div className="col-span-1 text-center">
                    <span className={`text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block ${
                      session.volatilityGrade === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 animate-pulse' :
                      session.volatilityGrade === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      session.volatilityGrade === 'MEDIUM' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {session.volatilityGrade}
                    </span>
                  </div>

                  {/* Action delete */}
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-1 hover:bg-rose-500/10 hover:text-rose-450 text-white/20 rounded transition-colors cursor-pointer select-none"
                      title="Delete Session Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Notes sub-display section */}
                  {session.notes && (
                    <div className="col-span-12 mt-2 px-3 py-1.5 bg-white/[0.01] border border-white/[0.03] rounded text-[9.5px] text-white/50 leading-relaxed font-mono flex items-start gap-1 pb-1">
                      <span className="text-indigo-400 shrink-0 select-none">💬 Notes:</span>
                      <p>{session.notes}</p>
                    </div>
                  )}

                </div>
              ))
            ) : (
              <div className="text-center py-10 text-[10.5px] font-mono text-white/30">
                No custom or historical session drawdown logs found matching your filters.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
