import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  HelpCircle, 
  Shield, 
  Cookie, 
  FileText, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Search,
  BookOpen,
  Scale
} from 'lucide-react';

interface BureaucracyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'faq' | 'cookies' | 'privacy' | 'terms' | 'risk' | 'docs' | 'compliance';
}

export const BureaucracyModal: React.FC<BureaucracyModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'faq' 
}) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'cookies' | 'privacy' | 'terms' | 'risk' | 'docs' | 'compliance'>(initialTab);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Sync state if initialTab changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const faqs = [
    {
      q: "What is MTXquant?",
      a: "MTXquant is a next-generation high-fidelity quantitative analysis and trade execution terminal. It integrates real-time institutional-grade order-flow modeling, depth of market (DOM) pricing arrays, and advanced algorithmic execution engines with custom proprietary bridges.",
      tag: "General",
    },
    {
      q: "How does the Fixed Fractional Risk Safeguard work?",
      a: "The suite operates under strict mathematical risk management rules. Every submitted trade is instantly evaluated by the risk safeguard controller. Capital exposure is limited to a maximum of 1% Stop-Loss (SL) invalidation based on equity formulas. This prevents catastrophic drawdowns by automatically rejecting orders exceeding risk tolerances.",
      tag: "Risk Management",
    },
    {
      q: "What is the ICT Liquidity Hunt Indicator?",
      a: "Based on Inner Circle Trader (ICT) concepts, this module tracks high-displacement market structures, Fair Value Gaps (FVG), and Order Blocks (OB). It forecasts impending sweeps of Buy-Side Liquidity (BSL) or Sell-Side Liquidity (SSL) to pinpoint optimal sweep-to-fill entry locations.",
      tag: "Technical Analysis",
    },
    {
      q: "How do the Broker Bridge latency safeguards protect my execution?",
      a: "The terminal maintains a continuous high-frequency ping loop with the Broker Gateway instance. If packet latency rises above the critical threshold of 45ms, visual alarms are triggered and automatic position mitigation triggers are set. You are immediately warned to avoid executing rapid-scale scale-in sweeps until stable connection speeds resume.",
      tag: "Execution",
    },
    {
      q: "Is past quantitative performance indicative of future returns?",
      a: "Absolutely not. Standard algorithmic backtests and historical metrics show structural performance under historical parameters. Real live market conditions feature dynamic slippage, variable institutional spreads, and black-swan systemic liquidity shocks which cannot be completely controlled by models.",
      tag: "Legal Disclosure",
    },
    {
      q: "How do I secure my external system API Keys?",
      a: "MTXquant relies entirely on high-security server-side proxy controls. Your API keys are strictly sandboxed inside your isolated secure environment, utilizing encrypted environmental injections. They are never exposed to the client-side browser context.",
      tag: "Security",
    }
  ];

  const filteredFaqs = faqs.filter(
    item => 
      item.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
      item.a.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(faqSearchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="bureaucracy-modal-overlay" className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          {/* Main Backdrop Closer */}
          <div className="absolute inset-0 cursor-default" onClick={onClose} />

          {/* Modal Container */}
          <motion.div 
            id="bureaucracy-modal bg-panel"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0b0c10] border border-indigo-500/20 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.15)] select-none text-left z-10"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-b from-white/[0.04] to-transparent border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <div>
                  <h2 className="text-sm font-black font-sans uppercase tracking-[0.1em] text-white">
                    Compliance & Technical Documentation
                  </h2>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">
                    Terminal Legal Framework & Architecture Disclosures
                  </p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-white/5 text-white/50 hover:text-white transition-colors cursor-pointer"
                aria-label="Close Documentation Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content Area split */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              
              {/* Sidebar Navigation */}
              <div className="w-full md:w-56 bg-black/20 border-b md:border-b-0 md:border-r border-white/5 p-3 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0 min-h-0">
                <button
                  onClick={() => setActiveTab('docs')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded text-xs font-bold transition-all duration-200 shrink-0 select-none ${
                    activeTab === 'docs' 
                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.05)]' 
                      : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Technical Guide</span>
                </button>

                <button
                  onClick={() => setActiveTab('compliance')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded text-xs font-bold transition-all duration-200 shrink-0 select-none ${
                    activeTab === 'compliance' 
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]' 
                      : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <Scale className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sovereign Compliance</span>
                </button>

                <button
                  onClick={() => setActiveTab('faq')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded text-xs font-bold transition-all duration-200 shrink-0 select-none ${
                    activeTab === 'faq' 
                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.05)]' 
                      : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Interactive FAQ</span>
                </button>

                <button
                  onClick={() => setActiveTab('risk')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded text-xs font-bold transition-all duration-200 shrink-0 select-none ${
                    activeTab === 'risk' 
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]' 
                      : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Risk Disclosure</span>
                </button>

                <button
                  onClick={() => setActiveTab('cookies')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded text-xs font-bold transition-all duration-200 shrink-0 select-none ${
                    activeTab === 'cookies' 
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]' 
                      : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <Cookie className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cookie Policy</span>
                </button>

                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded text-xs font-bold transition-all duration-200 shrink-0 select-none ${
                    activeTab === 'privacy' 
                      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20 shadow-[0_0_12px_rgba(20,184,166,0.05)]' 
                      : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <Shield className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Privacy Charter</span>
                </button>

                <button
                  onClick={() => setActiveTab('terms')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded text-xs font-bold transition-all duration-200 shrink-0 select-none ${
                    activeTab === 'terms' 
                      ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.05)]' 
                      : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <Scale className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Terms & Mandates</span>
                </button>
              </div>

              {/* Document View Pane */}
              <div className="flex-1 p-5 md:p-6 overflow-y-auto min-h-0 bg-black/10">
                <AnimatePresence mode="wait">
                  {activeTab === 'docs' && (
                    <motion.div
                      key="docs"
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-5"
                    >
                      <div className="border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-indigo-400" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                            Technical Strategy & Algorithmic Documentation
                          </h3>
                        </div>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">
                          In-depth blueprints, execution safeguards, and indicator heuristics
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Section 1: Spatial OB/FVG Confluences */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 space-y-2.5">
                          <h4 className="text-xs font-black text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> ICT Structure Engine
                          </h4>
                          <p className="text-[10px] text-white/60 leading-relaxed font-mono">
                            MTXquant relies on Inner Circle Trader (ICT) concepts for structural liquidity setups. The indicator constantly maps:
                          </p>
                          <ul className="list-disc pl-4 space-y-1 text-[9.5px] text-white/40 font-mono">
                            <li><strong className="text-white/70">Fair Value Gaps (FVG):</strong> 3-candle imbalance structures left behind during high displacement movements.</li>
                            <li><strong className="text-white/70">Order Blocks (OB):</strong> High-volume institutional blocks indicating systemic turnaround zones.</li>
                            <li><strong className="text-white/70">Sovereign Sweeps:</strong> Rapid spikes capturing Sell-Side (SSL) or Buy-Side (BSL) pools before reversals.</li>
                          </ul>
                        </div>

                        {/* Section 2: Fixed Fractional Risk Equation */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 space-y-2.5">
                          <h4 className="text-xs font-black text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> 1% Risk Formula
                          </h4>
                          <p className="text-[10px] text-white/60 leading-relaxed font-mono">
                            Every algorithmic entry passes an immutable safeguard module calculating risk exposure dynamically.
                          </p>
                          <div className="bg-black/30 p-2 border border-white/5 rounded text-center text-indigo-200 font-mono text-[9px] leading-normal font-bold">
                            Lot Size = (Balance × Risk%)<br />
                            ÷ (Stop Loss Pips × Pip Weight)
                          </div>
                          <p className="text-[9px] text-white/40 font-mono leading-tight">
                            The safeguard instantly blocks orders that violate the 1.0% equity rule, preventing catastrophic margin calls.
                          </p>
                        </div>

                        {/* Section 3: High-Frequency Broker Bridge */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 space-y-2.5 md:col-span-2">
                          <h4 className="text-xs font-black text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Cloud Infrastructure & Full-Stack Architecture
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] text-white/50 leading-relaxed font-mono">
                            <div className="bg-black/20 p-2.5 rounded border border-white/5 text-left">
                              <span className="text-white font-bold block mb-1 uppercase text-[9px] text-indigo-400">Container Runtime</span>
                              Server-side code is bundled and executed in an isolated Google Cloud Run container. This maintains sandboxed system processes and safe thread execution.
                            </div>
                            <div className="bg-black/20 p-2.5 rounded border border-white/5 text-left">
                              <span className="text-white font-bold block mb-1 uppercase text-[9px] text-indigo-400">Port Ingress Routing</span>
                              The full-stack application forces bindings strictly to Port 3000. All external requests are managed via an institutional-grade Nginx reverse proxy routing.
                            </div>
                            <div className="bg-black/20 p-2.5 rounded border border-white/5 text-left">
                              <span className="text-white font-bold block mb-1 uppercase text-[9px] text-indigo-400">Database Ledger Sync</span>
                              Sensitive user accounts, system configuration states, and trading blotted records are persistent, utilizing Google Firebase Auth and secure Firestore blueprints.
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'compliance' && (
                    <motion.div
                      key="compliance"
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-5"
                    >
                      <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                              Platform & Architectural Compliance
                            </h3>
                          </div>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5">
                            Google Cloud Run microservices runtime, Firebase Auth/Firestore security, and API proxies
                          </p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[8.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          Architecture: Google Cloud Run & Firebase Sandboxed
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Audit Log Table */}
                        <div className="bg-white/[0.01] border border-white/5 rounded-lg p-4 space-y-2.5">
                          <h4 className="text-xs font-black text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                            Architectural Directives & Container Guardrails
                          </h4>
                          <p className="text-[10px] text-white/60 leading-relaxed font-mono">
                            MTXquant complies with Google AI Studio's secure cloud execution mandates, utilizing full-stack microservices and secure storage blueprints:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono mt-2">
                            <div className="border border-white/5 p-3 rounded bg-black/20 font-sans">
                              <p className="text-white font-bold font-mono text-[9px] uppercase text-emerald-400">Container Sandboxing</p>
                              <p className="text-white/40 mt-1 leading-normal text-[9.5px]">
                                The application operates in an isolated Google Cloud Run container sandbox. All external ingress traffic is exclusively routed through Port 3000 via a secure Nginx reverse proxy layer.
                              </p>
                            </div>
                            <div className="border border-white/5 p-3 rounded bg-black/20 font-sans">
                              <p className="text-white font-bold font-mono text-[9px] uppercase text-emerald-400">Secure Secrets Proxying</p>
                              <p className="text-white/40 mt-1 leading-normal text-[9.5px]">
                                Sensitive credentials (including Gemini API and DB keys) are kept strictly server-side in container environment configurations. Public browser leakage is prevented by routing operations through /api/* endpoints.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Compliance Audit Checklist */}
                        <div className="bg-white/[0.01] border border-white/5 rounded-lg p-4 space-y-3 font-mono">
                          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                            Active Integrity & System Checklist
                          </h4>
                          <div className="space-y-2.5 text-[10.5px]">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <span className="text-white/70">1. Cloud Run Container Ingress Sandbox (Port 3000 Exclusive)</span>
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[8.5px] uppercase border border-emerald-500/20">Active</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <span className="text-white/70">2. Secure Server-Side Secrets Management (Non-VITE Env Keys)</span>
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[8.5px] uppercase border border-emerald-500/20">Active</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <span className="text-white/70">3. Firebase Firestore Security Blueprints & Auth Safeguards</span>
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[8.5px] uppercase border border-emerald-500/20">Active</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white/70">4. Secure Auto-Logout Idle Termination System (Configure in ACC)</span>
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[8.5px] uppercase border border-emerald-500/20">Active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'faq' && (
                    <motion.div
                      key="faq"
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                            Frequently Asked Questions
                          </h3>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5">
                            Terminal capabilities, safeguards, and infrastructure logic
                          </p>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="relative shrink-0">
                          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/30" />
                          <input
                            type="text"
                            placeholder="Filter queries..."
                            value={faqSearchQuery}
                            onChange={(e) => setFaqSearchQuery(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded px-2.5 py-1.5 pl-8 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 w-full sm:w-48 font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                        {filteredFaqs.length === 0 ? (
                          <div className="py-10 text-center text-white/30 font-mono text-xs">
                            No match found matching your structural filter.
                          </div>
                        ) : (
                          filteredFaqs.map((faq, i) => {
                            const isExpanded = expandedFaqIndex === i;
                            return (
                              <div 
                                key={i} 
                                className="border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] rounded-lg overflow-hidden transition-colors"
                              >
                                <button
                                  onClick={() => setExpandedFaqIndex(isExpanded ? null : i)}
                                  className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 pr-4">
                                    <span className="text-[8px] font-bold font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 rounded leading-none shrink-0 uppercase">
                                      {faq.tag}
                                    </span>
                                    <span className="text-xs font-bold text-white leading-snug">
                                      {faq.q}
                                    </span>
                                  </div>
                                  <span className="text-white/40 shrink-0">
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </span>
                                </button>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-4 pt-1.5 border-t border-white/5 text-[11px] font-mono text-white/65 bg-black/30 leading-relaxed">
                                        {faq.a}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'risk' && (
                    <motion.div
                      key="risk"
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <div className="border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                            Leverage Quantitative System Risk Disclosure
                          </h3>
                        </div>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">
                          High-risk execution disclosure mandate
                        </p>
                      </div>

                      <div className="text-[11px] font-mono text-white/60 space-y-4 leading-relaxed bg-[#0f0f13] border border-amber-500/10 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-amber-300 font-bold uppercase tracking-wide text-xs">
                            LEVERAGE & MARGIN MARGINAL CRITICAL ALARM WARNING
                          </p>
                        </div>
                        <p>
                          Trading financial derivatives, spot assets, indices, and currency pairings carries an extremely substantial level of risk. This system is geared towards quantitative professionals. Because leverage operates with double-sided magnitude, losses can occur with extreme speed and equal the initial capital reserve pool.
                        </p>
                        <p className="font-bold text-white">
                          By operating MTXquant and activating internal algorithmic scale-in strategies, you fully agree to:
                        </p>
                        <ul className="list-disc pl-4 space-y-1.5 text-white/50">
                          <li>Accept that the 1% maximum fixed fractional safe protection layer is a client-side and proxy control mechanism and cannot guarantee avoidance of market slippage in highly displaced environments (such as Silver Bullet or Judas Swings).</li>
                          <li>Acknowledge that dynamic data pipelines are for backtest visualization, and real-time live trading requires consistent broker infrastructure alignments.</li>
                          <li>Accept entire self-sovereign fiduciary accountability for any resulting balances, including unexpected balance drawdowns from automated execution mistakes.</li>
                        </ul>
                        <p className="border-t border-white/5 pt-3 text-[10px] text-white/35">
                          Federal regulatory guidance (CFTC / ESMA / NFA): Simulated backtesting execution does not reflect actual live capital margins. Always trade responsibly.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'cookies' && (
                    <motion.div
                      key="cookies"
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <div className="border-b border-white/5 pb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                          Cookie & Session Storage Policy
                        </h3>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">
                          Disclosure on browser state cookies and storage caches
                        </p>
                      </div>

                      <div className="text-[11px] font-mono text-white/65 space-y-3.5 leading-relaxed">
                        <p>
                          At MTXquant Terminal, we hold the highest standards regarding data privacy and user tracking structures. We do not use intrusive third-party analytical cross-site advertising cookies. Only strictly necessary technical states are cached.
                        </p>
                        
                        <div className="bg-white/[0.02] border border-white/5 p-3 rounded font-bold text-white mt-1">
                          Terminal Local Storage Matrix
                        </div>

                        <div className="border border-white/5 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-[10px] font-mono">
                            <thead className="bg-white/[0.03] border-b border-white/5 text-white/40 font-bold uppercase tracking-wider">
                              <tr>
                                <th className="p-2.5">Key Node Type</th>
                                <th className="p-2.5">Specific Objective</th>
                                <th className="p-2.5">Persistence Period</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              <tr>
                                <td className="p-2.5 font-bold text-indigo-300">mtx_settings</td>
                                <td className="p-2.5 text-white/60">Stores layout bounds, theme configuration presets, and terminal visual nodes.</td>
                                <td className="p-2.5 text-white/40">Indefinite (Local Cache)</td>
                              </tr>
                              <tr>
                                <td className="p-2.5 font-bold text-indigo-300">apex_idle_timeout</td>
                                <td className="p-2.5 text-white/60">Auto-Logout idle timer setting configured in the Account Control Center.</td>
                                <td className="p-2.5 text-white/40">Indefinite (Local Cache)</td>
                              </tr>
                              <tr>
                                <td className="p-2.5 font-bold text-indigo-300">firebase_auth_token</td>
                                <td className="p-2.5 text-white/60">Firebase session token for secure cloud database authentication and synchronization checks.</td>
                                <td className="p-2.5 text-white/40">Browser Session (Auto-Refresh)</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <p className="text-white/45">
                          You may configure your browser parameters to automatically refuse local storage structures, though this will immediately result in system parameters resetting to defaults on every single manual tab rebuild event.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'privacy' && (
                    <motion.div
                      key="privacy"
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <div className="border-b border-white/5 pb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                          System Privacy Charter & Sandbox Protections
                        </h3>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">
                          Operational directives on trading records and IP sovereignty
                        </p>
                      </div>

                      <div className="text-[11px] font-mono text-white/65 space-y-3 px-1 leading-relaxed">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                          <Shield className="w-4 h-4 shrink-0" />
                          <span>No Outbound Exposure Pledge</span>
                        </div>
                        <p>
                          Automated trading involves highly valuable proprietary strategies, stop triggers, and account information. We do not sell, distribute, or capture your trade logs, strategic presets, or active order-book limits.
                        </p>
                        <ul className="list-disc pl-4 space-y-2 text-white/50">
                          <li>
                            <strong className="text-white">Encrypted Local Logic:</strong> All strategies, economic calendar triggers, and backtest results operate entirely on sandbox environments or safe server systems without central database tracking.
                          </li>
                          <li>
                            <strong className="text-white">API Key Safety:</strong> Secrets loaded into `.env` configurations remain server-side and are loaded instantaneously exclusively during direct broker trade execution events.
                          </li>
                          <li>
                            <strong className="text-white">Telemetry Exclusion:</strong> The system logs debugging errors (e.g., websocket heartbeat losses) strictly on localized system runtimes. No central telemetry server is pinged.
                          </li>
                        </ul>
                        <p className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded text-[10px] text-indigo-300">
                          MTXquant conforms to strict data hygiene frameworks matching leading quantitative hedge fund structures, ensuring absolute proprietary silence.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'terms' && (
                    <motion.div
                      key="terms"
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-4"
                    >
                      <div className="border-b border-white/5 pb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                          Terms of Service & Algorithmic Mandate
                        </h3>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">
                          Mutual operational agreements and systemic limits
                        </p>
                      </div>

                      <div className="text-[11px] font-mono text-white/65 space-y-3 leading-relaxed">
                        <p>
                          Welcome to the MTXquant terminal suite. By loading this page and executing algorithmic operations on the asset dashboard, you enter a binding structural contract.
                        </p>

                        <div className="space-y-4 text-white/55 text-[10px] pl-2 border-l-2 border-white/10">
                          <p>
                            <strong>1. System Integrity Protection:</strong> You are strictly prohibited from utilizing the terminal interface to conduct market manipulation campaigns, latency-arbitrage exploitation schemes, or toxic high-frequency traffic attacks against broker endpoints.
                          </p>
                          <p>
                            <strong>2. Automated System Breakers:</strong> Any user-instantiated order sequence triggering more than 15 validation failures inside a 60-second span will result in the automated local execution gateway entering full self-defensive block state.
                          </p>
                          <p>
                            <strong>3. Sovereign Execution License:</strong> MTXquant grants a non-distributable single terminal node license to run and tweak strategies. Reverse engineering the compiled analytical models of the displacement engine is prohibited.
                          </p>
                        </div>

                        <p className="text-white/40 text-[9.5px]">
                          These terms are dynamically interpreted in alignment with the regulatory definitions under the MiFID II algorithmic trade safety frameworks.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-[10px] font-mono text-white/35">
              <span>MTXquant Governance Council &bull; Version 4.12.0</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-80" />
                <span className="text-emerald-400 font-bold uppercase tracking-wider">
                  Compliance Status: Dynamic Aligned
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
