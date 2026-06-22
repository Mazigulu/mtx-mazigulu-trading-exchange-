/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MarketSymbol, MarketMetrics } from '../types';
import { Bot, User, Send, Sparkles, AlertCircle, HelpCircle, ArrowRight, X, Radio, ShieldAlert } from 'lucide-react';

export interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface AdvisorChatProps {
  symbol: MarketSymbol;
  metrics: MarketMetrics;
  onClose?: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function AdvisorChat({ symbol, metrics, onClose, messages, setMessages }: AdvisorChatProps) {
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isObserveMode, setIsObserveMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('apex_advisor_observe_mode');
      return saved === 'true';
    } catch (_) {
      return false;
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('apex_advisor_observe_mode');
        const boolVal = saved === 'true';
        setIsObserveMode(boolVal);
      } catch (_) {}
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('observe_mode_changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('observe_mode_changed', handleStorageChange);
    };
  }, []);

  const toggleObserveMode = () => {
    const nextVal = !isObserveMode;
    setIsObserveMode(nextVal);
    try {
      localStorage.setItem('apex_advisor_observe_mode', String(nextVal));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('observe_mode_changed'));
    } catch (_) {}

    // Push immediate status feedback directly as assistance message
    if (nextVal) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `🛡️ **Wait & Observe Mode Engaged**: Silent diagnostic scanning initialized. All discretionary trade signals (FVG mitigations, EMA pullbacks, RSI divergence trackers) are **suppressed** to screen out noise. MTX AI is focusing exclusively on high-dispersion **Institutional Liquidity Sweeps**.`
        }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `📡 **Wait & Observe Mode Decycled**: Standard dual-channel sweeps and discretionary trade alert feeds are now restored.`
        }
      ]);
    }
  };

  // Monitor background algorithmic news, trade alerts, and sweep signals
  useEffect(() => {
    const interval = setInterval(() => {
      const simulatedAlerts = [
        {
          isCritical: false,
          isSweep: false,
          text: `⚡ **ALGORITHMIC TRADE ALERT [DISCRETIONARY]**\n- **Asset**: \`${symbol}\`\n- **Signal**: 5m FVG Structural Mitigation Retest\n- **Severity**: LOW\n- **Action**: Monitor local candlestick closes.`
        },
        {
          isCritical: false,
          isSweep: false,
          text: `⚡ **EMA REBOUND ALERT [DISCRETIONARY]**\n- **Asset**: \`${symbol}\`\n- **Signal**: 15m 50-EMA Pullback alignment\n- **Severity**: LOW\n- **Action**: Look for discretionary reaction trigger.`
        },
        {
          isCritical: true,
          isSweep: true,
          text: `🔥 **INSTITUTIONAL SWEEP ALERT [CRITICAL]**\n- **Asset**: \`${symbol}\`\n- **Signal**: Daily Session Swing Low Sweep (SSL Captured)\n- **Severity**: CRITICAL (Institutional Sweep)\n- **L2 Vol**: 1,640 Lots\n- **Action**: Watch for high-displacement impulse to validate bullish order block.`
        },
        {
          isCritical: false,
          isSweep: false,
          text: `⚡ **DIVERGENCE THRESHOLD ALERT [DISCRETIONARY]**\n- **Asset**: \`GOLD/USD\`\n- **Signal**: H4 Overbought RSI Exhaustion\n- **Severity**: MEDIUM\n- **Action**: Moderate potential for pullback scale exhaustion.`
        },
        {
          isCritical: true,
          isSweep: true,
          text: `🔥 **INSTITUTIONAL SWEEP ALERT [CRITICAL]**\n- **Asset**: \`${symbol}\`\n- **Signal**: London Session Swing High Sweep (BSL Captured)\n- **Severity**: CRITICAL (Institutional Sweep)\n- **L2 Vol**: 1,280 Lots\n- **Action**: Retest point of origin. Watch for low-timeframe Market Structure Shift (MSS).`
        },
        {
          isCritical: true,
          isSweep: true,
          text: `🔥 **INSTITUTIONAL SWEEP ALERT [CRITICAL]**\n- **Asset**: \`BTC/USDT\`\n- **Signal**: Retail Double Bottom Hunt completed (SSL Sweep)\n- **Severity**: CRITICAL (Institutional Sweep)\n- **L2 Vol**: 2,340 Lots\n- **Action**: Clean systemic capture of retail stop losses. Ready for impulse.`
        }
      ];

      const alert = simulatedAlerts[Math.floor(Math.random() * simulatedAlerts.length)];

      // Check current observe mode state filters
      if (isObserveMode) {
        if (!alert.isCritical || !alert.isSweep) {
          console.log(`[MTX AI Advisor] Suppressed non-critical alert in Wait & Observe Mode.`);
          return; // Suppress it completely
        }
      }

      // Prepend to messages array
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: alert.text
        }
      ]);

      // Sound retro advisor alerts
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          if (alert.isCritical) {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(540, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(780, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
          } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(380, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(420, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
          }
          
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      } catch (_) {}

    }, 32000); // Poll and push every 32 seconds to avoid excessive flood

    return () => clearInterval(interval);
  }, [isObserveMode, symbol]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMsg;
    if (!query.trim()) return;

    if (!textToSend) setInputMsg('');

    const newMessages = [...messages, { role: 'user' as const, text: query }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          currentSymbol: symbol,
          history: messages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          })),
        }),
      });

      if (!response.ok) throw new Error('API server failed');
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format: server returned HTML instead of JSON.');
      }
      const data = await response.json();

      setMessages((prev) => [...prev, { role: 'assistant', text: data.text }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: '⚡ *API Context Fault*: Failed to fetch instant feedback. Verify server connection of container.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const hotQueries = [
    { label: 'Check 50-EMA Bias', query: 'Analyze the 4H/Daily trend bias and EMA 50 alignment for the asset. Is it premium or discount?' },
    { label: 'Locate 4H FVG Entry', query: 'Where are the closest active Fair Value Gaps (FVG) and Order Blocks (OB) for entries?' },
    { label: 'Explain Stop-Loss Rules', query: 'Based on the Trading Bible, where should my Stop Loss be placed to avoid premature stop-outs?' },
  ];

  // Helper to format basic markdown markers like **bold** and *italic* and bullet points
  const formatMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      let content = line;

      // Handle bullets
      const isBullet = line.trim().startsWith('-');
      if (isBullet) {
        content = line.replace(/^\s*-\s*/, '');
      }

      // Simple regex for bold
      const parts = content.split('**');
      const formattedParts = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={`b-${pIdx}`} className="text-white font-bold">{part}</strong>;
        }
        // Simple italics within the part
        const subParts = part.split('*');
        return subParts.map((sub, sIdx) => {
          if (sIdx % 2 === 1) {
            return <em key={`e-${sIdx}`} className="text-indigo-300 font-italic">{sub}</em>;
          }
          return sub;
        });
      });

      if (isBullet) {
        return (
          <li key={`line-${lIdx}`} className="ml-4 list-disc pl-1 text-[11.5px] leading-relaxed text-white/80 mb-1 font-sans">
            {formattedParts}
          </li>
        );
      }

      if (line.trim().startsWith('###')) {
        return (
          <h5 key={`line-${lIdx}`} className="text-indigo-400 font-bold font-sans text-xs uppercase tracking-wider mt-3 mb-1.5 border-b border-white/10 pb-0.5">
            {line.replace(/^###\s*/, '')}
          </h5>
        );
      }

      if (line.trim().startsWith('##')) {
        return (
          <h4 key={`line-${lIdx}`} className="text-white/90 font-bold font-sans text-sm mt-3.5 mb-2">
            {line.replace(/^##\s*/, '')}
          </h4>
        );
      }

      return (
        <p key={`line-${lIdx}`} className="text-[11px] leading-relaxed text-white/70 font-sans mb-2 font-light">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div id="advisor-chat-root" className="bg-[#080808] border border-white/10 rounded p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm md:text-base font-sans">MTX AI Chat</h4>
              <p className="text-xs text-white/40 font-mono uppercase tracking-tight">Trading Bible & ICT Guidance</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="p-1 px-1.5 bg-indigo-500/10 border border-white/10 rounded font-mono text-[9px] text-indigo-300 uppercase font-semibold flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-indigo-300 animate-spin" />
              <span>AI Online</span>
            </span>
            {onClose && (
              <button
                id="close-advisor-chat-btn"
                onClick={onClose}
                className="p-1 px-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded text-white/50 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                title="Minimize MTX AI Chat"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Wait & Observe Mode Toggle Panel */}
        <div id="observe-mode-toggle-panel" className="flex items-center justify-between mt-3 bg-[#0c0c0e]/95 border border-white/5 rounded px-2.5 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          <div className="flex items-center space-x-2">
            <Radio className={`w-3.5 h-3.5 ${isObserveMode ? 'text-amber-400 animate-pulse' : 'text-white/30'}`} />
            <div>
              <span className="text-[10px] text-white/90 font-mono font-bold block leading-tight">Wait & Observe Mode</span>
              <span className="text-[8px] text-white/40 font-sans block">Focus only on Institutional Sweeps</span>
            </div>
          </div>
          <button
            id="btn-observe-mode-toggle"
            onClick={toggleObserveMode}
            className={`px-2.5 py-0.5 rounded text-[8px] font-mono font-extrabold border transition-all cursor-pointer ${
              isObserveMode
                ? 'bg-amber-500/15 border-amber-500/25 text-amber-400 hover:bg-amber-500/25'
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10'
            }`}
            title="Suppress non-critical trade alerts and focus on Sweep signals"
          >
            {isObserveMode ? 'ACTIVE' : 'DECYCLED'}
          </button>
        </div>

        {/* Observation Mode Active Status Bar */}
        {isObserveMode && (
          <div id="observe-mode-status-bar" className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 mt-2 rounded flex items-center justify-between text-[9px] font-mono text-amber-400 animate-pulse">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-ping" />
              <span className="font-extrabold uppercase tracking-wider">Observation Mode Active</span>
            </div>
            <span className="text-[7.5px] bg-amber-400/20 px-1 py-0.5 rounded text-amber-300 font-extrabold font-mono tracking-tight">SWE_ONLY</span>
          </div>
        )}

        {/* Hot Key Queries Area */}
        <div className="flex flex-wrap gap-2 mt-3 border-b border-white/10 pb-3">
          {hotQueries.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.query)}
              className="px-2.5 py-1 bg-[#050505] border border-white/5 hover:border-white/20 text-[10px] text-white/40 hover:text-white/80 font-mono rounded transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>{item.label}</span>
              <ArrowRight className="w-3 h-3 text-white/20" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Dialogue Log Canvas */}
      <div className="flex-1 overflow-y-auto my-3 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((m, idx) => {
          const isBot = m.role === 'assistant';
          return (
            <div
              key={idx}
              className={`flex space-x-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg shrink-0 h-8 w-8 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] rounded p-3.5 ${
                  isBot
                    ? 'bg-[#050505]/40 border border-white/5 text-white/80 rounded-tl-none'
                    : 'bg-indigo-600 border border-indigo-500/30 text-white rounded-tr-none'
                }`}
              >
                {isBot ? formatMarkdown(m.text) : <p className="text-[11.5px] font-sans leading-relaxed">{m.text}</p>}
              </div>

              {!isBot && (
                <div className="p-1.5 bg-[#0c0c0c] border border-white/10 rounded shrink-0 h-8 w-8 flex items-center justify-center">
                  <User className="w-4 h-4 text-white/60" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex space-x-2.5 justify-start">
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded shrink-0 h-8 w-8 flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <div className="bg-[#050505]/40 border border-white/5 rounded rounded-tl-none p-3.5 max-w-[80%] flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce duration-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce duration-300 delay-75" />
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce duration-300 delay-150" />
              <span className="text-[10px] text-white/30 font-mono pl-1">Consulting The Trading Bible...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Form container */}
      <div className="relative border-t border-white/10 pt-3">
        <input
          id="chat-input"
          type="text"
          value={inputMsg}
          disabled={loading}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={`Submit setup prompt for ${symbol}...`}
          className="w-full bg-[#050505] border border-white/10 rounded pl-4 pr-12 py-3 text-xs text-white/90 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
        />
        <button
          id="send-chat-btn"
          disabled={loading || !inputMsg.trim()}
          onClick={() => handleSendMessage()}
          className="absolute right-2 top-5 transform bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 text-white p-1.5 rounded transition-all shrink-0 duration-200 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
