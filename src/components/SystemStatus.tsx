/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Activity, 
  Server, 
  Cpu, 
  Wifi, 
  Send, 
  Database as DbIcon, 
  Terminal, 
  Clock, 
  AlertCircle,
  AlertTriangle,
  Heart
} from 'lucide-react';

interface LogMessage {
  time: string;
  source: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
}

interface ServiceState {
  id: string;
  name: string;
  desc: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  latency: number; // in ms
  packetLoss: number; // in %
  heartbeats: number;
  icon: React.ComponentType<{ className?: string }>;
}

export default function SystemStatus() {
  const [ticker, setTicker] = useState(0);

  // Initial historic logs
  const [logs, setLogs] = useState<LogMessage[]>([
    {
      time: '07:01:21',
      source: 'GATEWAY',
      level: 'INFO',
      message: 'Establishing TLS Handshake to premium Lmax Liquidity Providers...'
    },
    {
      time: '07:01:25',
      source: 'GATEWAY',
      level: 'SUCCESS',
      message: 'Broker Connection established. Inbound pipeline active. Ping: 28ms.'
    },
    {
      time: '07:01:32',
      source: 'BRIDGE',
      level: 'INFO',
      message: 'Liquidity Provider API Gateway connector initialized under loopback 127.0.0.1:3000.'
    },
    {
      time: '07:02:11',
      source: 'DATABASE',
      level: 'SUCCESS',
      message: 'trades_db.json read complete. Syncing 12 closed transaction logs.'
    },
    {
      time: '07:02:14',
      source: 'STRATEGY',
      level: 'INFO',
      message: 'Evaluating structural liquidity sweeps on EUR/USD... Spread 0.8 pips acceptable.'
    },
    {
      time: '07:03:45',
      source: 'TELEGRAM',
      level: 'SUCCESS',
      message: 'Session heartbeats dispatched to verified Risk Admins.'
    },
    {
      time: '07:04:00',
      source: 'EXECUTION',
      level: 'SUCCESS',
      message: 'All core system structures online. 100% operational, ready for institutional execution.'
    }
  ]);

  // Real-time Service Heartbeat Statuses
  const [services, setServices] = useState<ServiceState[]>([
    {
      id: 'sys-feed',
      name: 'Market Feed Ingress',
      desc: 'H4 WebSockets direct streaming pipeline',
      status: 'OPERATIONAL',
      latency: 14,
      packetLoss: 0,
      heartbeats: 1042,
      icon: Wifi
    },
    {
      id: 'sys-gateway',
      name: 'Execution Gateway',
      desc: 'High-speed broker order execution gateway (FIX)',
      status: 'OPERATIONAL',
      latency: 12,
      packetLoss: 0,
      heartbeats: 1042,
      icon: Cpu
    },
    {
      id: 'sys-db',
      name: 'Secure Database Sync',
      desc: 'trades_db.json file persistence loop',
      status: 'OPERATIONAL',
      latency: 1,
      packetLoss: 0,
      heartbeats: 1042,
      icon: DbIcon
    },
    {
      id: 'sys-broker',
      name: 'Broker Stream LP',
      desc: 'Institutional LP High-Speed Bridge Link',
      status: 'OPERATIONAL',
      latency: 28,
      packetLoss: 0,
      heartbeats: 1042,
      icon: Server
    },
    {
      id: 'sys-engine',
      name: 'Matching Engine',
      desc: 'Core Mean-Reversion order processor',
      status: 'OPERATIONAL',
      latency: 3,
      packetLoss: 0,
      heartbeats: 1042,
      icon: Activity
    }
  ]);

  // Periodic heartbeat tick & latency generator
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setTicker((prev) => prev + 1);

      setServices((prevServices) => {
        return prevServices.map((srv) => {
          if (srv.status === 'DOWN') {
            return {
              ...srv,
              latency: 0,
              packetLoss: 100,
              heartbeats: srv.heartbeats + 1
            };
          }

          // Compute basic fluctuated latency
          const baseLatency = srv.id === 'sys-ai' ? 1480 : srv.id === 'sys-feed' ? 14 : srv.id === 'sys-gateway' ? 12 : srv.id === 'sys-broker' ? 28 : srv.id === 'sys-engine' ? 3 : 1;
          const jitterCap = srv.id === 'sys-ai' ? 120 : 4;
          const jitter = Math.round((Math.random() * jitterCap) - (jitterCap / 2));
          
          let targetLatency = Math.max(1, baseLatency + jitter);
          let targetLoss = 0;

          if (srv.status === 'DEGRADED') {
            targetLatency = Math.round(baseLatency * 6 + Math.random() * 80);
            targetLoss = Math.round(Math.random() * 12 + 4); // 4-16% packet loss
          }

          return {
            ...srv,
            latency: targetLatency,
            packetLoss: targetLoss,
            heartbeats: srv.heartbeats + 1
          };
        });
      });
    }, 2500);

    return () => clearInterval(pulseInterval);
  }, []);

  // System Reliability Metric calculation based on operational components
  const reliabilityScore = useMemo(() => {
    let totalScore = 100;
    
    services.forEach((srv) => {
      if (srv.status === 'DOWN') {
        totalScore -= 22.5; // High penalty for downtime
      } else if (srv.status === 'DEGRADED') {
        totalScore -= 7.5; // Medium penalty for degradation
      } else {
        // Minor penalty for slow response thresholds
        if (srv.latency > 150 && srv.id !== 'sys-ai') {
          totalScore -= 1.2;
        }
        if (srv.packetLoss > 0) {
          totalScore -= srv.packetLoss * 0.4;
        }
      }
    });

    return Math.max(0, Math.min(100, parseFloat(totalScore.toFixed(2))));
  }, [services]);

  // Auto-generate heartbeat verification logs in the Terminal Console
  useEffect(() => {
    const logInterval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      
      const isAnyDown = services.some(s => s.status === 'DOWN');
      const isAnyDegraded = services.some(s => s.status === 'DEGRADED');
      
      let level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' = 'SUCCESS';
      let message = `[PULSE] Heartbeat OK. All services verified. System Reliability is at ${reliabilityScore}%.`;
      let source = 'HEARTBEAT';

      if (isAnyDown) {
        level = 'ERROR';
        const downs = services.filter(s => s.status === 'DOWN').map(s => s.name).join(', ');
        message = `[PULSE] Error. Missing response on: [${downs}]. Reliability dropped to ${reliabilityScore}%. Attempting backup retry-loop.`;
      } else if (isAnyDegraded) {
        level = 'WARN';
        const degraded = services.filter(s => s.status === 'DEGRADED').map(s => s.name).join(', ');
        message = `[PULSE] Latency Spike. degraded packets on [${degraded}]. Real-time reliability score degraded at ${reliabilityScore}%.`;
      }

      setLogs((prev) => {
        const nextLogs = [...prev, { time: timeStr, source, level, message }];
        return nextLogs.slice(-40);
      });
    }, 5000);

    return () => clearInterval(logInterval);
  }, [services, reliabilityScore]);

  // Adjust Status manually under Sandbox diagnostics controls
  const handleToggleState = (id: string, nextStatus: 'OPERATIONAL' | 'DEGRADED' | 'DOWN') => {
    setServices((prev) => 
      prev.map((srv) => {
        if (srv.id === id) {
          const originalStatus = srv.status;
          if (originalStatus !== nextStatus) {
            // Append log immediately for manual control switch
            const now = new Date();
            const timeStr = now.toTimeString().split(' ')[0];
            const level = nextStatus === 'DOWN' ? 'ERROR' : nextStatus === 'DEGRADED' ? 'WARN' : 'SUCCESS';
            const logMsg = `Diagnostic switch: Changed ${srv.name} status from ${originalStatus} to ${nextStatus}.`;
            setLogs((p) => [...p, { time: timeStr, source: 'DIAGNOSTICS', level, message: logMsg }].slice(-40));
          }
          return { ...srv, status: nextStatus };
        }
        return srv;
      })
    );
  };

  // Instant Reset function
  const handleResetAllComponents = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    setServices((prev) => prev.map(s => ({ ...s, status: 'OPERATIONAL' })));
    setLogs((prev) => [
      ...prev,
      {
        time: timeStr,
        source: 'DIAGNOSTICS',
        level: 'SUCCESS',
        message: 'Master Reset executed. Re-established nominal heartbeat thresholds for all operational loops.'
      }
    ].slice(-40));
  };

  return (
    <div id="system-status-root" className="space-y-6">
      
      {/* Upper overview status summary banner with Live Pulse score */}
      <div className="bg-[#0a0a0b] border border-white/5 p-5 rounded-lg flex flex-col xl:flex-row items-center justify-between gap-6 select-none relative overflow-hidden">
        
        {/* Abstract design element background indicator */}
        <div className={`absolute top-0 right-0 w-80 h-full opacity-10 pointer-events-none blur-3xl transition-colors duration-500 ${
          reliabilityScore === 100 
            ? 'bg-emerald-500' 
            : reliabilityScore > 85 
            ? 'bg-amber-500' 
            : 'bg-rose-500'
        }`} />

        <div className="flex flex-col md:flex-row items-center gap-5 w-full xl:w-auto">
          <div className="relative">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center border transition-all duration-300 ${
              reliabilityScore === 100 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : reliabilityScore > 85
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <Heart className={`w-7 h-7 ${reliabilityScore === 100 ? 'animate-pulse' : 'animate-bounce text-red-400'}`} />
            </div>
            
            <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5">
              {reliabilityScore === 100 ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </>
              ) : reliabilityScore > 85 ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                </>
              )}
            </span>
          </div>

          <div className="text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                System Health Pulse active
              </h2>
              <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold font-mono tracking-wide ${
                reliabilityScore === 100 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10' 
                  : reliabilityScore > 85
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/10'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/10'
              }`}>
                {reliabilityScore === 100 ? 'SECURED' : reliabilityScore > 85 ? 'DEGRADED WARNING' : 'CRITICAL WARNING'}
              </span>
            </div>
            <p className="text-[10.5px] text-white/40 mt-1 max-w-md">
              Synchronizing heartbeat packages across Lmax Gateway and direct API connector nodes. Real-time diagnostic verification active.
            </p>
          </div>
        </div>

        {/* Real-time System Reliability Score */}
        <div className="flex flex-wrap items-center justify-around gap-6 text-right font-mono text-xs w-full xl:w-auto xl:justify-end border-t xl:border-t-0 border-white/[0.05] pt-4 xl:pt-0">
          <div className="px-4">
            <span className="text-white/30 text-[9px] uppercase tracking-wider block font-bold">Reliability Score</span>
            <span className={`text-2xl font-black tracking-tight ${
              reliabilityScore === 100 
                ? 'text-emerald-400' 
                : reliabilityScore > 85 
                ? 'text-amber-400' 
                : 'text-rose-400'
            }`}>
              {reliabilityScore}%
            </span>
          </div>

          <div className="border-l border-white/5 pl-6 pr-4">
            <span className="text-white/30 text-[9px] uppercase tracking-wider block font-bold">Latency Standard Dev</span>
            <span className="text-white/80 font-bold block mt-1">
              ±{reliabilityScore === 100 ? '1.4ms' : reliabilityScore > 85 ? '18.2ms' : '124.9ms'}
            </span>
          </div>

          <div className="border-l border-white/5 pl-6 pr-4">
            <span className="text-white/30 text-[9px] uppercase tracking-wider block font-bold">Heartbeat state</span>
            <span className="text-indigo-400 font-bold block mt-1 uppercase flex items-center gap-1 justify-end">
              <Activity className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
              Pulse Active
            </span>
          </div>
        </div>
      </div>

      {/* Grid of monitored services with dynamic properties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 select-none">
        {services.map((sys) => {
          const SysIcon = sys.icon;
          const isDown = sys.status === 'DOWN';
          const isDegraded = sys.status === 'DEGRADED';
          
          return (
            <div 
              key={sys.id} 
              className={`bg-[#0a0a0b] border p-4.5 rounded-lg flex flex-col justify-between h-[155px] transition-all duration-300 ${
                isDown 
                  ? 'border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.06)]' 
                  : isDegraded 
                  ? 'border-amber-500/30' 
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded transition-colors ${
                    isDown 
                      ? 'bg-rose-500/10' 
                      : isDegraded 
                      ? 'bg-amber-500/10' 
                      : 'bg-emerald-500/10'
                  }`}>
                    <SysIcon className={`w-4 h-4 transition-colors ${
                      isDown 
                        ? 'text-rose-400' 
                        : isDegraded 
                        ? 'text-amber-400' 
                        : 'text-emerald-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-white font-mono">{sys.name}</h4>
                    <p className="text-[9px] text-white/40 leading-relaxed mt-0.5 max-w-[180px]">{sys.desc}</p>
                  </div>
                </div>
                
                {/* State Indicator Icon */}
                {isDown ? (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse animate-bounce" />
                ) : isDegraded ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>

              {/* Live telemetry row inside card */}
              <div className="space-y-1 my-2">
                <div className="flex items-center justify-between font-mono text-[9.5px]">
                  <span className="text-white/30">ROUND-TRIP DELAY</span>
                  <span className={`font-semibold ${isDown ? 'text-rose-400' : isDegraded ? 'text-amber-400' : 'text-white/80'}`}>
                    {isDown ? '---' : `${sys.latency}ms`}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[9.5px]">
                  <span className="text-white/30">PACKET REJECTIONS</span>
                  <span className={`font-semibold ${isDown || sys.packetLoss > 0 ? 'text-rose-400' : 'text-white/40'}`}>
                    {sys.packetLoss}%
                  </span>
                </div>
              </div>

              {/* Status and Heartbeats counts */}
              <div className="flex items-center justify-between border-t border-white/[0.03] pt-2 font-mono text-[9.5px]">
                <span className={`font-bold uppercase tracking-wide flex items-center gap-1 ${
                  isDown 
                    ? 'text-rose-400' 
                    : isDegraded 
                    ? 'text-amber-400' 
                    : 'text-emerald-400'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full inline-block ${
                    isDown ? 'bg-rose-500 animate-pulse' : isDegraded ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                  }`} />
                  {sys.status}
                </span>
                <span className="text-white/20">
                  Pulses: <strong className="text-white/55 font-normal">{sys.heartbeats}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sandbox diagnostics & Outage corruption console */}
      <div className="bg-[#0a0a0b] border border-white/5 p-5 rounded-lg select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3.5 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4.5 h-4.5 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              MTXQUANT Diagnostic Fault injection rack
            </h3>
          </div>
          <button
            onClick={handleResetAllComponents}
            className="text-[10px] uppercase font-mono tracking-wider bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 hover:border-white/20 px-3 py-1 rounded transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-indigo-400" />
            Restore Master nominal Heartbeats
          </button>
        </div>

        <p className="text-[10.5px] text-white/40 mb-4 max-w-3xl">
          Conduct failover simulation tests using the levers below. Simulating an outage or degrading latency triggers instant reliability recalculations and logs warning payloads to verify automatic defense mechanisms.
        </p>

        {/* Selector Grid of components for diagnostics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-1">
          {services.map((sys) => (
            <div key={sys.id} className="border border-white/5 bg-[#050505]/40 p-3 rounded-md space-y-2.5">
              <span className="text-[10.5px] font-bold text-white/80 font-mono block truncate uppercase">{sys.name}</span>
              
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => handleToggleState(sys.id, 'OPERATIONAL')}
                  className={`text-[9px] py-1 font-mono uppercase tracking-tight rounded border transition-all text-center cursor-pointer ${
                    sys.status === 'OPERATIONAL'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold'
                      : 'bg-transparent text-white/25 border-transparent hover:text-white/50'
                  }`}
                >
                  Nominal
                </button>
                <button
                  onClick={() => handleToggleState(sys.id, 'DEGRADED')}
                  className={`text-[9px] py-1 font-mono uppercase tracking-tight rounded border transition-all text-center cursor-pointer ${
                    sys.status === 'DEGRADED'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold'
                      : 'bg-transparent text-white/25 border-transparent hover:text-white/50'
                  }`}
                >
                  Degrade
                </button>
                <button
                  onClick={() => handleToggleState(sys.id, 'DOWN')}
                  className={`text-[9px] py-1 font-mono uppercase tracking-tight rounded border transition-all text-center cursor-pointer ${
                    sys.status === 'DOWN'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold'
                      : 'bg-transparent text-white/25 border-transparent hover:text-white/50'
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal logs component */}
      <div className="bg-[#0a0a0b] border border-white/5 p-5 rounded-lg flex flex-col">
        <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-3.5 select-none">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">Live Operations Console Logs</h3>
          </div>
          <div className="text-[10px] text-white/30 font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>UTC Heartbeat Stream log: Active</span>
          </div>
        </div>

        {/* Console Box container with automatic scroll */}
        <div className="bg-[#050505] border border-white/5 p-4 rounded-lg font-mono text-[10.5px] leading-relaxed text-slate-300 space-y-2 h-[220px] overflow-y-auto overflow-x-hidden border-indigo-500/10 shadow-[inner_0_2px_10px_rgba(0,0,0,0.8)]">
          {logs.map((log, idx) => {
            const levelColor = 
              log.level === 'SUCCESS' ? 'text-emerald-400' :
              log.level === 'WARN' ? 'text-amber-400' :
              log.level === 'ERROR' ? 'text-rose-400' :
              'text-indigo-300';
              
            return (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5 hover:bg-white/[0.02] py-0.5 px-1 rounded transition-colors duration-150">
                <span className="text-white/30 text-[9.5px] shrink-0">{log.time}</span>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[8.5px] font-black tracking-tight px-1 rounded bg-[#0c0c0d] border border-white/5 ${levelColor}`}>
                    {log.level}
                  </span>
                  <span className="text-indigo-400/90 font-bold uppercase text-[9px] tracking-tight">[{log.source}]</span>
                </div>

                <span className="text-[#e5e5e5]/80 break-words flex-1 leading-snug">
                  {log.message}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safeguard SLA description footer banner */}
      <div className="bg-[#0a0a0b] border border-white/5 p-4 rounded-lg select-none flex items-center space-x-3.5 text-white/45 text-[10.5px]">
        <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
        <p>
          MTXquant algorithmic systems leverage real-time stateful node routing. If a critical gateway's reliability index falls below <strong>95%</strong>, order execution algorithms trigger safe-mode validation routing over backup local virtual bridges instantly, safely preserving active lot exposures.
        </p>
      </div>

    </div>
  );
}
