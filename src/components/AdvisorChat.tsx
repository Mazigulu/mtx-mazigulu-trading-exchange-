/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MarketSymbol, MarketMetrics } from '../types';
import { Bot, User, Send, Sparkles, AlertCircle, HelpCircle, ArrowRight, X } from 'lucide-react';

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
    <div id="advisor-chat-root" className="bg-[#080808] border border-white/10 rounded p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between h-[510px]">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm md:text-base font-sans">Institutional Advisor Chat</h4>
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
                title="Minimize Adviser Chat"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </div>

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
