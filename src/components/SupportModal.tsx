import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  HelpCircle, 
  MessageSquare, 
  Check, 
  FileText, 
  ExternalLink,
  ShieldAlert,
  Terminal,
  Clock
} from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  traderEmail: string;
}

interface SupportTicket {
  id: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

export default function SupportModal({ isOpen, onClose, traderEmail }: SupportModalProps) {
  const [activeTab, setActiveTab] = useState<'ticket' | 'history' | 'faq'>('ticket');
  const [category, setCategory] = useState('Execution & Slippage');
  const [priority, setPriority] = useState('Medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Load existing tickets from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('apex_support_tickets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTickets(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading tickets:', e);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    const newTicket: SupportTicket = {
      id: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
      category,
      priority,
      subject,
      description,
      status: 'OPEN',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    localStorage.setItem('apex_support_tickets', JSON.stringify(updated));

    setSubmittedId(newTicket.id);
    setSubject('');
    setDescription('');
    
    // Auto clear success message after 4s
    setTimeout(() => {
      setSubmittedId(null);
      setActiveTab('history');
    }, 3000);
  };

  const handleClearHistory = () => {
    setTickets([]);
    localStorage.removeItem('apex_support_tickets');
  };

  const faqs = [
    {
      q: "Why is my trade order execution taking over 200ms?",
      a: "Our prime brokerage router uses direct DMA (Direct Market Access) to route execution orders to global dark pools and institutional ECNs. Network latency below 500ms is standard, but you can enable 'Observed Router Mode' in Trade controls to audit routing packets manually."
    },
    {
      q: "How can I verify the high-frequency execution data feed?",
      a: "The elapsed time indicator on the header shows seconds since the last WebSocket/REST ticker fetch. If you suspect latency drift, you can click the 'Manual Sync' circular arrow icon in the footer/header to pull fresh financial order books instantly."
    },
    {
      q: "What is the Tier-1 Core Leverage Limit?",
      a: "Apex Quant institutional traders start with a 1:10 leverage allocation across FX and Equities. You can request high margin limit expansions by submitting a high priority ticket directly to our compliance desk."
    },
    {
      q: "How is the cryptographic bearer token secured?",
      a: "The bearer token is signed on client startup and hashed locally. It is never stored in plaintext on any global database. Keep this token strictly confidential to safeguard automated API trade scripts."
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="support-modal-backdrop" className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            id="support-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-2xl bg-[#08080c] border border-white/10 rounded-xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col font-mono text-white text-xs text-left"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-transparent to-transparent border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-[13px] font-black uppercase tracking-wider text-white">Institutional Support Desk</h2>
                  <p className="text-[9px] text-neutral-200">Secure communications line linked directly to Desk-4 Support Team</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-neutral-200 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/5 bg-black/20 shrink-0 text-[10px]">
              <button
                onClick={() => setActiveTab('ticket')}
                className={`flex-1 py-3 text-center border-b font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'ticket' 
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                    : 'border-transparent text-neutral-200 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                Submit Ticket
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 text-center border-b font-bold tracking-wider uppercase transition-all cursor-pointer relative ${
                  activeTab === 'history' 
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                    : 'border-transparent text-neutral-200 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                Ticket Log ({tickets.length})
              </button>
              <button
                onClick={() => setActiveTab('faq')}
                className={`flex-1 py-3 text-center border-b font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === 'faq' 
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                    : 'border-transparent text-neutral-200 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                F.A.Q & Resources
              </button>
            </div>

            {/* Body Area */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {activeTab === 'ticket' && (
                <>
                  {submittedId ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 border border-emerald-500/20 bg-emerald-500/5 rounded-lg text-center space-y-3.5 my-4"
                    >
                      <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Ticket Created Successfully</h3>
                        <p className="text-[10px] text-neutral-200">Reference Code: <strong className="text-white select-all">{submittedId}</strong></p>
                      </div>
                      <p className="text-[9.5px] text-neutral-200 max-w-sm mx-auto leading-normal">
                        Your request has been filed in the secure ledger. Support specialists will contact your registered email address ({traderEmail}) shortly.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-neutral-200 uppercase block">Ticket Category</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-[#040405] border border-white/10 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option>Execution & Slippage</option>
                            <option>Wallet & Balances</option>
                            <option>API & Automated Scripts</option>
                            <option>KYC Compliance & Verification</option>
                            <option>Technical Bug / UI Flaw</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-neutral-200 uppercase block">Risk Urgency / Priority</label>
                          <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full bg-[#040405] border border-white/10 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option>Low (Routine Inquiry)</option>
                            <option>Medium (Action Delayed)</option>
                            <option>High (Slippage / Balance Discrepancy)</option>
                            <option>CRITICAL (Execution Fault / Stuck Trade)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-200 uppercase block">Subject Line</label>
                        <input
                          type="text"
                          required
                          placeholder="Briefly summarize the execution or UI anomaly..."
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-[#040405] border border-white/10 rounded px-2.5 py-2 text-xs text-white placeholder:text-neutral-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-200 uppercase block">Detailed Inquiry / Description</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Provide the step-by-step description of what happened. Include specific ticker symbols, order IDs, or browser logs if applicable."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full bg-[#040405] border border-white/10 rounded px-2.5 py-2 text-xs text-white placeholder:text-neutral-400 focus:outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded text-[9.5px] text-neutral-200 flex items-start gap-2">
                        <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">Automatic Diagnostic Attachment</p>
                          <p className="mt-0.5 leading-normal text-[9px]">To fast-track troubleshooting, session metadata (browser, active network ping, and current token state) will be secured and coupled with this ticket.</p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 rounded font-bold uppercase text-[10px] tracking-wider transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Support Request
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[11px] font-black uppercase text-white">Historical Communication Logs</h3>
                      <p className="text-[9px] text-neutral-200">Audit trail of all support requests made within this active session</p>
                    </div>
                    {tickets.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        className="text-[9px] font-bold text-rose-400 border border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/5 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        Clear Logs
                      </button>
                    )}
                  </div>

                  {tickets.length === 0 ? (
                    <div className="p-10 text-center border border-white/5 rounded bg-black/15 space-y-2">
                      <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto" />
                      <p className="text-[10px] text-neutral-200 uppercase font-bold tracking-wider">No Active Tickets</p>
                      <p className="text-[9px] text-neutral-300 max-w-xs mx-auto">There are no support inquiries logged under your institutional profile at this time.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map((t) => (
                        <div key={t.id} className="border border-white/10 bg-[#040405] rounded p-3.5 text-left space-y-2.5 hover:border-indigo-500/30 transition-all">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/25 rounded text-[8.5px] font-bold text-indigo-300">
                                {t.id}
                              </span>
                              <span className="text-[10px] text-white font-bold truncate max-w-[200px] sm:max-w-xs">
                                {t.subject}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-extrabold uppercase ${
                                t.status === 'OPEN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                              }`}>
                                {t.status}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[9px] text-neutral-200">
                            <div>
                              <span className="font-bold uppercase">CATEGORY:</span>{' '}
                              <span className="text-neutral-200">{t.category}</span>
                            </div>
                            <div>
                              <span className="font-bold uppercase">PRIORITY:</span>{' '}
                              <span className={`font-bold ${
                                t.priority.startsWith('CRITICAL') ? 'text-rose-400' :
                                t.priority.startsWith('High') ? 'text-amber-400' : 'text-indigo-300'
                              }`}>{t.priority}</span>
                            </div>
                            <div className="col-span-2 sm:col-span-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="text-neutral-200">{t.createdAt}</span>
                            </div>
                          </div>

                          <p className="text-[9.5px] text-neutral-200 bg-black/25 p-2 border border-white/5 rounded leading-relaxed select-text whitespace-pre-wrap">
                            {t.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-[11px] font-black uppercase text-white">Frequently Answered Queries</h3>
                    <p className="text-[9px] text-neutral-200">Direct answers to critical technical questions regarding the trading workspace</p>
                  </div>

                  <div className="space-y-3.5">
                    {faqs.map((faq, i) => (
                      <div key={i} className="border border-white/5 bg-black/15 rounded p-3 text-left space-y-1.5">
                        <h4 className="font-bold text-indigo-300 text-[10px] flex items-start gap-1.5">
                          <span className="px-1 text-[7.5px] font-black bg-indigo-500/10 border border-indigo-500/30 rounded">Q</span>
                          <span>{faq.q}</span>
                        </h4>
                        <p className="text-neutral-200 leading-normal pl-5 text-[9.5px] select-text">
                          {faq.a}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Hotlines */}
                  <div className="p-4 bg-gradient-to-r from-indigo-950/20 to-transparent border border-indigo-500/20 rounded-lg text-left space-y-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-indigo-400" />
                      <span className="font-black text-[10px] text-white uppercase tracking-wider">Apex Brokerage Emergency Line</span>
                    </div>
                    <p className="text-[9px] text-neutral-200 leading-normal">
                      For rapid portfolio liquidation or server connection failure emergencies, please use the direct broker hotline link:
                    </p>
                    <div className="flex flex-wrap gap-2.5 pt-1 text-[9px]">
                      <span className="px-2 py-1 bg-[#040405] border border-white/10 rounded font-mono text-neutral-200 select-all">
                        TEL: +1-800-APEX-DMA (2739)
                      </span>
                      <span className="px-2 py-1 bg-[#040405] border border-white/10 rounded font-mono text-neutral-200 select-all">
                        SECURE_IRC: mtxquant-otc-line
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5 bg-black/40 flex justify-between items-center text-[9px] text-neutral-200 shrink-0">
              <span>ACTIVE SESSION SECURITY ID: {Math.floor(10000000 + Math.random() * 90000000)}</span>
              <span className="text-indigo-400">SUPPORT_DESK_CONNECTED</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
