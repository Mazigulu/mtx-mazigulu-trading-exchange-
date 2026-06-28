/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MarketSymbol, MarketMetrics } from '../types';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight, 
  X, 
  Radio, 
  ShieldAlert,
  History,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2
} from 'lucide-react';

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

  // Firestore & Chat Session States
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatTitle, setActiveChatTitle] = useState<string>('');
  const [savedChats, setSavedChats] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isObserveMode, setIsObserveMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('apex_advisor_observe_mode');
      return saved === 'true';
    } catch (_) {
      return false;
    }
  });

  // Load chat history from Firestore
  const fetchChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/chat/history');
      if (response.ok) {
        const data = await response.json();
        setSavedChats(data);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Sync state on load
  useEffect(() => {
    fetchChatHistory();
  }, []);

  // Save current chat session helper
  const saveChatSession = async (chatId: string, title: string, messagesToSave: Message[]) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: chatId,
          title,
          symbol,
          messages: messagesToSave
        })
      });
      if (response.ok) {
        fetchChatHistory();
      }
    } catch (err) {
      console.error('Error auto-saving chat session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Switch to a previous saved conversation
  const handleLoadChat = (chat: any) => {
    setActiveChatId(chat.id);
    setActiveChatTitle(chat.title);
    setMessages(chat.messages);
    setShowHistory(false);
  };

  // Delete a saved conversation
  const handleDeleteChat = async (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/chat/history/${idToDelete}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        if (activeChatId === idToDelete) {
          setMessages([]);
          setActiveChatId(null);
          setActiveChatTitle('');
        }
        fetchChatHistory();
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  // Initialize a completely new chat session
  const handleStartNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
    setActiveChatTitle('');
    setShowHistory(false);
  };

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
    const modeMessage: Message = nextVal ? {
      role: 'assistant',
      text: `🛡️ **Wait & Observe Mode Engaged**: Silent diagnostic scanning initialized. All discretionary trade signals (FVG mitigations, EMA pullbacks, RSI divergence trackers) are **suppressed** to screen out noise. MTX AI is focusing exclusively on high-dispersion **Institutional Liquidity Sweeps**.`
    } : {
      role: 'assistant',
      text: `📡 **Wait & Observe Mode Decycled**: Standard dual-channel sweeps and discretionary trade alert feeds are now restored.`
    };

    const nextMessages = [...messages, modeMessage];
    setMessages(nextMessages);

    // Save mode trigger to current chat session
    if (activeChatId) {
      saveChatSession(activeChatId, activeChatTitle, nextMessages);
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
      ];

      // Broadcast new alert event
      if (Math.random() < 0.15) {
        const picked = simulatedAlerts[Math.floor(Math.random() * simulatedAlerts.length)];
        if (isObserveMode && !picked.isCritical) return; // Suppression

        const alertText = picked.text;
        const autoMsg: Message = { role: 'assistant', text: alertText };
        
        setMessages((prev) => {
          const next = [...prev, autoMsg];
          if (activeChatId) {
            saveChatSession(activeChatId, activeChatTitle, next);
          }
          return next;
        });
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [symbol, isObserveMode, activeChatId, activeChatTitle]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, showHistory]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMsg;
    if (!query.trim()) return;

    if (!textToSend) setInputMsg('');

    const userMsg: Message = { role: 'user', text: query };
    const messagesWithUser = [...messages, userMsg];
    setMessages(messagesWithUser);
    setLoading(true);

    // Determine or generate unique ID and title for session
    let chatId = activeChatId;
    let chatTitle = activeChatTitle;
    if (!chatId) {
      chatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setActiveChatId(chatId);
      chatTitle = query.length > 35 ? query.slice(0, 35) + '...' : query;
      setActiveChatTitle(chatTitle);
    }

    // Persist immediately to Firestore
    await saveChatSession(chatId, chatTitle, messagesWithUser);

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

      const assistantMsg: Message = { role: 'assistant', text: data.text };
      const finalMessages = [...messagesWithUser, assistantMsg];
      setMessages(finalMessages);
      
      // Persist assistant reply to Firestore
      await saveChatSession(chatId, chatTitle, finalMessages);
    } catch (e) {
      const errorMsg: Message = {
        role: 'assistant',
        text: '⚡ *API Context Fault*: Failed to fetch instant feedback. Verify server connection of container.',
      };
      const finalMessagesWithError = [...messagesWithUser, errorMsg];
      setMessages(finalMessagesWithError);
      await saveChatSession(chatId, chatTitle, finalMessagesWithError);
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
    <div id="advisor-chat-root" className="bg-[#080808] border border-white/10 rounded p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col justify-between h-full overflow-hidden">
      
      {/* HEADER SECTION */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs md:text-sm font-sans flex items-center gap-1.5">
                MTX AI Chat
                {isSaving && (
                  <span className="text-[8px] text-indigo-400 bg-indigo-400/10 px-1 py-0.5 rounded animate-pulse font-mono uppercase tracking-widest">
                    Saving...
                  </span>
                )}
              </h4>
              <p className="text-[9px] text-white/40 font-mono uppercase tracking-tight">Trading Bible & ICT Guidance</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            {/* History Toggle */}
            <button
              id="chat-history-toggle-btn"
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) fetchChatHistory();
              }}
              className={`p-1.5 rounded border text-xs cursor-pointer transition-colors ${
                showHistory 
                  ? 'bg-indigo-600 border-indigo-500 text-white' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
              }`}
              title="View Chat Sessions History"
            >
              <History className="w-3.5 h-3.5" />
            </button>

            {/* New Chat Button */}
            <button
              id="new-chat-session-btn"
              onClick={handleStartNewChat}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Start New Chat Session"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {onClose && (
              <button
                id="close-advisor-chat-btn"
                onClick={onClose}
                className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Minimize MTX AI Chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic active session title bar */}
        {activeChatTitle && !showHistory && (
          <div className="bg-[#0b0c10] border-b border-white/5 px-2.5 py-1.5 flex items-center justify-between text-[9px] font-mono text-indigo-300">
            <span className="truncate max-w-[80%] font-semibold">📍 Session: {activeChatTitle}</span>
            <span className="text-[8px] uppercase tracking-wider text-white/30 bg-white/5 px-1 py-0.5 rounded">{symbol}</span>
          </div>
        )}

        {/* Wait & Observe Mode Toggle Panel (Only show when not looking at history) */}
        {!showHistory && (
          <>
            <div id="observe-mode-toggle-panel" className="flex items-center justify-between mt-2.5 bg-[#0c0c0e]/95 border border-white/5 rounded px-2.5 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
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
                className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold border transition-all cursor-pointer ${
                  isObserveMode
                    ? 'bg-amber-500/15 border-amber-500/25 text-amber-400 hover:bg-amber-500/25'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10'
                }`}
                title="Suppress non-critical trade alerts and focus on Sweep signals"
              >
                {isObserveMode ? 'ACTIVE' : 'DECYCLED'}
              </button>
            </div>

            {isObserveMode && (
              <div id="observe-mode-status-bar" className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 mt-1.5 rounded flex items-center justify-between text-[9px] font-mono text-amber-400 animate-pulse">
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-ping" />
                  <span className="font-extrabold uppercase tracking-wider text-[8px]">Observation Mode Active</span>
                </div>
                <span className="text-[7px] bg-amber-400/20 px-1 py-0.5 rounded text-amber-300 font-extrabold font-mono tracking-tight">SWE_ONLY</span>
              </div>
            )}

            {/* Hot Key Queries Area */}
            <div className="flex flex-wrap gap-1.5 mt-2.5 border-b border-white/5 pb-2.5">
              {hotQueries.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.query)}
                  className="px-2 py-0.5 bg-[#050505] border border-white/5 hover:border-white/25 text-[9px] text-white/40 hover:text-white/80 font-mono rounded transition-all cursor-pointer flex items-center space-x-1"
                >
                  <span className="truncate max-w-[120px]">{item.label}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-white/20 shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CHAT VIEW VS. HISTORY DRAWER CANVAS */}
      <div className="flex-1 overflow-y-auto my-3.5 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        
        {showHistory ? (
          /* HISTORY SCREEN */
          <div className="space-y-3 py-1 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-[10px] font-mono font-black uppercase text-white/50 tracking-wider">Saved Trade Inquiries ({savedChats.length})</span>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" /> Back to chat
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest">Loading records...</span>
              </div>
            ) : savedChats.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-xs font-mono">
                No saved inquiries found.
                <button
                  onClick={handleStartNewChat}
                  className="block mx-auto mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold uppercase transition-all"
                >
                  Start First Session
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[310px] overflow-y-auto">
                {savedChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleLoadChat(chat)}
                    className={`p-2.5 bg-[#050505] border rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                      activeChatId === chat.id 
                        ? 'border-indigo-500 bg-indigo-500/5' 
                        : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="space-y-1.5 max-w-[80%]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 px-1 py-0.5 rounded shrink-0">
                          {chat.symbol || 'ASSET'}
                        </span>
                        <span className="text-[10px] text-white/85 font-semibold font-sans truncate block leading-tight">
                          {chat.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[8px] text-white/30 font-mono">
                        <span>{chat.messages?.length || 0} messages</span>
                        <span>•</span>
                        <span>{new Date(chat.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="p-1 text-white/25 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer shrink-0"
                      title="Delete Session Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE CHAT LOG */
          <>
            {messages.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 rounded-full inline-block">
                  <Bot className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-[11px] font-black uppercase tracking-widest text-white/80">ICT Strategy Assistant</h5>
                  <p className="text-[10px] text-white/40 max-w-[240px] mx-auto leading-relaxed">
                    Start chatting or select a hot key to analyze order blocks, liquidity sweeps, or EMA trend alignment. Previous messages will auto-save to Firestore.
                  </p>
                </div>
              </div>
            )}

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
                    className={`max-w-[85%] rounded p-3 ${
                      isBot
                        ? 'bg-[#050505]/40 border border-white/5 text-white/85 rounded-tl-none'
                        : 'bg-indigo-600 border border-indigo-500/30 text-white rounded-tr-none'
                    }`}
                  >
                    {isBot ? formatMarkdown(m.text) : <p className="text-[11px] font-sans leading-relaxed">{m.text}</p>}
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
          </>
        )}
      </div>

      {/* INPUT FORM SECTION */}
      <div className="relative border-t border-white/10 pt-3 shrink-0">
        <input
          id="chat-input"
          type="text"
          value={inputMsg}
          disabled={loading || showHistory}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={showHistory ? "History view active. Click Back to chat." : `Submit setup prompt for ${symbol}...`}
          className="w-full bg-[#050505] border border-white/10 rounded pl-3.5 pr-12 py-2.5 text-xs text-white/90 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
        />
        <button
          id="send-chat-btn"
          disabled={loading || !inputMsg.trim() || showHistory}
          onClick={() => handleSendMessage()}
          className="absolute right-1.5 top-4.5 transform bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 disabled:text-white/30 text-white p-1.5 rounded transition-all shrink-0 duration-200 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
