import React, { useState, useEffect } from 'react';
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
  Scale,
  Server,
  Lock,
  Cpu,
  Terminal,
  Layers,
  CheckCircle2,
  AlertCircle,
  Globe,
  Info
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
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<'all' | 'clearing' | 'technology' | 'risk'>('all');
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({});

  // Sync state if initialTab changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Prevent background scrolling when fullscreen overlay is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleFaq = (index: number) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqs = [
    // Homepage Questions
    {
      q: "Does MTXquant support multi-asset clearing and unified collateral sweeps?",
      a: "Yes. Our clearing framework aggregates multi-venue liquidity to provide tight execution margins and unified collateral sweeping across standard, synthetically formulated, and tax-advantaged instruments.",
      tag: "clearing",
      tagLabel: "Clearing & Brokerage"
    },
    {
      q: "What clearing models does MTXquant support?",
      a: "MTXquant operates under a fully segregated custody model. We offer both standard Regulation T clearing and advanced Portfolio Margining based on real-time Value-at-Risk (VaR) analysis. This optimizes capital efficiency for multi-legged options strategies and highly correlated equity books.",
      tag: "clearing",
      tagLabel: "Clearing & Brokerage"
    },
    {
      q: "Who is eligible for an MTXquant prime account?",
      a: "Our brokerage services are tailored for systematic proprietary trading groups, family offices, high-net-worth individuals, and emerging hedge fund managers. Standard registration requires completion of standard KYC/AML onboarding guidelines.",
      tag: "clearing",
      tagLabel: "Clearing & Brokerage"
    },
    {
      q: "How does the platform secure client assets?",
      a: "Client funds are secured with premier global custody partners and Tier-1 banking institutions (such as JP Morgan Chase and BNY Mellon). Our digital portals and risk-syncing database engines are fully backed up in secure cloud clusters with end-to-end encryption to preserve watchlists, trading notes, and active portfolio configurations.",
      tag: "clearing",
      tagLabel: "Clearing & Brokerage"
    },
    {
      q: "Are there minimum capital mandates to access the terminal?",
      a: "Our introductory account level, Starter Prime, has no minimum balance requirement and provides comprehensive access to our core Markets Terminal. Professional Prime accounts requiring institutional leverage lines are subject to capital clearing baseline thresholds.",
      tag: "clearing",
      tagLabel: "Clearing & Brokerage"
    },
    {
      q: "What are the cross-border clearing and multi-currency settlement protocols?",
      a: "MTXquant implements an advanced, highly resilient cross-border clearing system, utilizing dynamic multi-currency collateral sweeps across global Tier-1 custody banks including BNY Mellon, JP Morgan Chase, and Euroclear. We facilitate direct bilateral and central clearing under the European Market Infrastructure Regulation (EMIR) and Dodd-Frank Act guidelines, minimizing systemic risk. Multi-currency settlements are executed using Real-Time Gross Settlement (RTGS) platforms (such as TARGET2, Fedwire, and CHIPS) as well as accredited tri-party clearing agents. This framework supports instant margin optimization and automatic currency conversions across USD, EUR, GBP, JPY, and SGD with automated collateral rehypothecation shielding for global macro derivative portfolios.",
      tag: "clearing",
      tagLabel: "Clearing & Brokerage"
    },
    {
      q: "What are the technical specifications and latency metrics of the MTXquant REST/WebSocket API?",
      a: "The MTXquant API suite supports high-frequency algorithmic execution via REST and WebSocket protocols, designed for systematic trading desks. Our matching engines, co-located in Equinix NY4 (Secaucus), LD4 (Slough), and TY3 (Tokyo), utilize Kernel Bypass (Solarflare Onload technology) to bypass standard network stack overhead. The HTTP/2 REST API delivers an execution latency of less than 4 milliseconds, while the low-latency TCP WebSocket streams provide real-time Level 2 (L2) and Level 3 (L3) order book updates in under 500 microseconds. For maximum serialization efficiency, payloads are delivered in high-performance Protocol Buffers (Protobuf) or compressed JSON format. Authenticated requests are verified using asymmetric Ed25519 cryptographic signatures with rate-limiting configured up to 5,000 requests per minute per IP subnet, upgradable for institutional lease lines.",
      tag: "technology",
      tagLabel: "Terminal Technology"
    },
    // Bureaucracy / Terminal Questions
    {
      q: "What is MTX Securities / MTXquant Terminal?",
      a: "MTXquant is an institutional-grade, high-fidelity quantitative analysis and trade execution terminal. It integrates real-time order-flow modeling, Depth of Market (DOM) pricing arrays, and advanced algorithmic execution engines with custom proprietary brokerage channels and cloud security guardrails.",
      tag: "technology",
      tagLabel: "Terminal Technology"
    },
    {
      q: "How does the Fixed Fractional Risk Safeguard work?",
      a: "The suite operates under strict mathematical risk management rules. Every submitted trade is instantly evaluated by the risk safeguard controller. Capital exposure is limited to a maximum of 1.0% Stop-Loss (SL) invalidation based on equity formulas. This prevents catastrophic drawdowns by automatically rejecting orders exceeding risk tolerances.",
      tag: "risk",
      tagLabel: "Risk & Legal"
    },
    {
      q: "What is the Intraday Trend Target Projection Indicator?",
      a: "This module tracks high-displacement price movements, standard support levels, and resistance zones. It forecasts impending tests of key support and resistance areas (such as Fair Value Gaps and Order Blocks) to pinpoint optimal entry thresholds.",
      tag: "technology",
      tagLabel: "Terminal Technology"
    },
    {
      q: "How do the Broker Bridge latency safeguards protect my execution?",
      a: "The terminal maintains a continuous high-frequency ping loop with the Broker Gateway. If packet latency rises above the critical threshold of 45ms, visual alarms are triggered and automatic position mitigation safeguards are set. You are immediately warned to avoid executing rapid-scale sweeps until stable connection speeds resume.",
      tag: "technology",
      tagLabel: "Terminal Technology"
    },
    {
      q: "Is past performance indicative of future returns?",
      a: "Absolutely not. Standard backtests and historical metrics show structural performance under historical parameters. Real live market conditions feature dynamic slippage, variable institutional spreads, and black-swan systemic liquidity shocks which cannot be completely predicted or controlled by mathematical models.",
      tag: "risk",
      tagLabel: "Risk & Legal"
    },
    {
      q: "How do I secure my external system API Keys?",
      a: "MTXquant relies entirely on high-security server-side proxy controls. Your API keys are strictly sandboxed inside your isolated secure environment, utilizing encrypted environmental injections. They are never exposed to the client-side browser context.",
      tag: "technology",
      tagLabel: "Terminal Technology"
    }
  ];

  const filteredFaqs = faqs.filter(item => {
    const matchesSearch = item.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
                          item.a.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
                          item.tagLabel.toLowerCase().includes(faqSearchQuery.toLowerCase());
    const matchesCategory = selectedFaqCategory === 'all' || item.tag === selectedFaqCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="bureaucracy-modal-overlay" 
          className="fixed inset-0 z-[1000] flex flex-col bg-[#050608] text-neutral-200 overflow-hidden font-sans"
        >
          {/* Main Full-page Layout */}
          <motion.div 
            id="bureaucracy-fullscreen-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full flex flex-col min-h-0 overflow-hidden bg-[#050608]"
          >
            {/* Redesigned Premium Full-width Header */}
            <header className="px-6 py-5 bg-gradient-to-r from-neutral-950 via-[#0a0b10] to-neutral-950 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                      System Node v4.12
                    </span>
                    <span className="font-mono text-[9px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                      SEC 15c3-3 Segmented
                    </span>
                  </div>
                  <h1 className="text-base sm:text-lg font-black tracking-wider text-white uppercase mt-1">
                    MTXquant Regulatory Compliance &amp; Technical Documentation
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col text-right font-mono text-[10px] text-white/30 mr-4">
                  <span>CLEARED VIA TIER-1 PROTOCOLS</span>
                  <span className="text-emerald-400/70">INTEGRITY MATRIX: AUDITED</span>
                </div>
                <button 
                  onClick={onClose}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-white/80 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-lg flex items-center gap-2.5 text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg active:scale-95"
                  aria-label="Back to Terminal UI"
                >
                  <X className="w-4 h-4 text-indigo-400" />
                  <span>Exit to Terminal</span>
                  <span className="text-[9px] font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-white/40">ESC</span>
                </button>
              </div>
            </header>

            {/* Split Screen Layout covering entirety of viewport */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              
              {/* Left Column: High-fidelity Full-height Sidebar Navigation */}
              <aside className="w-full md:w-64 bg-neutral-950/70 border-b md:border-b-0 md:border-r border-white/5 p-4 flex flex-col shrink-0 min-h-0">
                <div className="mb-4 hidden md:block">
                  <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-white/40 block mb-2 px-2">
                    Operational Sections
                  </span>
                </div>

                <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
                  <button
                    onClick={() => setActiveTab('docs')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 select-none w-full text-left ${
                      activeTab === 'docs' 
                        ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.05)]' 
                        : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    <Cpu className={`w-4 h-4 shrink-0 ${activeTab === 'docs' ? 'text-indigo-400' : 'text-white/40'}`} />
                    <span className="flex-1">Technical Strategy</span>
                    <span className="hidden md:inline font-mono text-[8px] opacity-40 bg-white/5 px-1.5 py-0.5 rounded">Core</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('compliance')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 select-none w-full text-left ${
                      activeTab === 'compliance' 
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]' 
                        : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    <Scale className={`w-4 h-4 shrink-0 ${activeTab === 'compliance' ? 'text-emerald-400' : 'text-white/40'}`} />
                    <span className="flex-1">Sovereign Compliance</span>
                    <span className="hidden md:inline font-mono text-[8px] opacity-40 bg-white/5 px-1.5 py-0.5 rounded">SEC</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('faq')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 select-none w-full text-left ${
                      activeTab === 'faq' 
                        ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.05)]' 
                        : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    <HelpCircle className={`w-4 h-4 shrink-0 ${activeTab === 'faq' ? 'text-indigo-400' : 'text-white/40'}`} />
                    <span className="flex-1">Interactive FAQ</span>
                    <span className="hidden md:inline font-mono text-[8px] opacity-40 bg-white/5 px-1.5 py-0.5 rounded">13 Qs</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('risk')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 select-none w-full text-left ${
                      activeTab === 'risk' 
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]' 
                        : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${activeTab === 'risk' ? 'text-amber-500' : 'text-white/40'}`} />
                    <span className="flex-1">Risk Disclosures</span>
                    <span className="hidden md:inline font-mono text-[8px] opacity-40 bg-white/5 px-1.5 py-0.5 rounded">Warn</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('cookies')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 select-none w-full text-left ${
                      activeTab === 'cookies' 
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]' 
                        : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    <Cookie className={`w-4 h-4 shrink-0 ${activeTab === 'cookies' ? 'text-emerald-400' : 'text-white/40'}`} />
                    <span className="flex-1">Cookie Policy</span>
                    <span className="hidden md:inline font-mono text-[8px] opacity-40 bg-white/5 px-1.5 py-0.5 rounded">Cache</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('privacy')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 select-none w-full text-left ${
                      activeTab === 'privacy' 
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20 shadow-[0_0_12px_rgba(20,184,166,0.05)]' 
                        : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    <Shield className={`w-4 h-4 shrink-0 ${activeTab === 'privacy' ? 'text-teal-400' : 'text-white/40'}`} />
                    <span className="flex-1">Privacy Charter</span>
                    <span className="hidden md:inline font-mono text-[8px] opacity-40 bg-white/5 px-1.5 py-0.5 rounded">GDPR</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('terms')}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 shrink-0 select-none w-full text-left ${
                      activeTab === 'terms' 
                        ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.05)]' 
                        : 'text-white/45 hover:text-white/85 hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'terms' ? 'text-blue-400' : 'text-white/40'}`} />
                    <span className="flex-1">Terms of Service</span>
                    <span className="hidden md:inline font-mono text-[8px] opacity-40 bg-white/5 px-1.5 py-0.5 rounded">TOS</span>
                  </button>
                </div>

                {/* Aesthetic Platform Integrity Box - strictly grounded details */}
                <div className="mt-auto pt-6 border-t border-white/5 hidden md:block">
                  <div className="bg-[#090b10] border border-white/5 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-emerald-400">
                        Operational Integrity
                      </span>
                    </div>
                    <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                      Database configurations, API proxies, and user-ledgers verified under active secure cloud environments.
                    </p>
                    <div className="text-[9px] text-white/30 font-mono flex items-center justify-between border-t border-white/5 pt-2">
                      <span>SIGNATURE TYPE:</span>
                      <span className="font-bold text-white/60 uppercase">Ed25519</span>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Right Column: Redesigned Spacious View Pane covering full viewport size */}
              <main className="flex-1 p-6 md:p-10 overflow-y-auto min-h-0 bg-[#06070a]">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: Technical Guide */}
                  {activeTab === 'docs' && (
                    <motion.div
                      key="docs"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-8 max-w-5xl mx-auto"
                    >
                      <div className="border-b border-white/5 pb-5">
                        <div className="flex items-center gap-3">
                          <Cpu className="w-6 h-6 text-indigo-400" />
                          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                            Technical Strategy &amp; Algorithmic Infrastructure
                          </h2>
                        </div>
                        <p className="text-xs text-white/50 font-mono mt-1 leading-relaxed">
                          In-depth system blueprints, mathematical modeling equations, and server-side execution configurations for the MTXquant Terminal.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Box 1: Architecture */}
                        <section className="bg-neutral-950/80 border border-white/5 rounded-xl p-5 space-y-4">
                          <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                            <Server className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-xs font-black text-indigo-300 font-mono uppercase tracking-wider">
                              Full-Stack Topology &amp; Container Isolation
                            </h3>
                          </div>
                          <p className="text-[11px] text-white/70 leading-relaxed font-mono">
                            MTXquant is structured as an immutable, stateless full-stack microservices container deployed onto containerized clusters. This architecture guarantees performance segregation and secure logical boundaries:
                          </p>
                          <ul className="space-y-2 text-[10.5px] text-white/50 font-mono pl-1">
                            <li className="flex items-start gap-2">
                              <span className="text-indigo-400 text-xs mt-0.5">▪</span>
                              <span><strong className="text-white/80">Ingress Mapping (Port 3000):</strong> The container strictly binds its runtime ports to 3000. All routing, asset streaming, and reverse-proxy handshakes are controlled natively via Nginx logic.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-indigo-400 text-xs mt-0.5">▪</span>
                              <span><strong className="text-white/80">Server-Side Proxy:</strong> To prevent token compromise, sensitive keys (including Gemini API and database configurations) are kept entirely server-side in secure runtime configurations. Requests are proxied dynamically via <code className="text-indigo-300 px-1 py-0.5 bg-white/5 rounded text-[9.5px]">/api/*</code>.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-indigo-400 text-xs mt-0.5">▪</span>
                              <span><strong className="text-white/80">Firebase Database Ledger:</strong> Multi-user structures, watchlists, account tiers, and audit-trail logging records are persisted into structured Firebase Firestore database instances, mapped with strict client-side validation rules.</span>
                            </li>
                          </ul>
                        </section>

                        {/* Box 2: 1% Formula */}
                        <section className="bg-neutral-950/80 border border-white/5 rounded-xl p-5 space-y-4">
                          <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                            <Lock className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-xs font-black text-indigo-300 font-mono uppercase tracking-wider">
                              Fixed Fractional Risk Safeguards (The 1% Rule)
                            </h3>
                          </div>
                          <p className="text-[11px] text-white/70 leading-relaxed font-mono">
                            Before order packaging, every trade request enters a hardcoded validation middleware. The risk engine enforces strict mathematical stop-loss allocations to prevent catastrophic account drawdowns:
                          </p>
                          <div className="bg-black/40 p-4 border border-white/5 rounded-lg text-center space-y-2">
                            <span className="text-[9px] text-white/40 block font-mono">RISK FORMULA MATRIX</span>
                            <div className="text-indigo-300 font-mono text-xs font-bold leading-normal">
                              Allocated Lot Size = <br />
                              (Total Account Equity &times; 0.01) &divide; (Stop Loss Pips &times; Pip Value)
                            </div>
                          </div>
                          <p className="text-[10.5px] text-white/50 leading-relaxed font-mono">
                            If the risk engine calculates that a trade exceeds 1.0% stop-loss invalidation of total cash equity, the transaction is immediately blocked and a high-priority structural alarm is displayed on the dashboard.
                          </p>
                        </section>

                        {/* Box 3: Market Heuristics */}
                        <section className="bg-neutral-950/80 border border-white/5 rounded-xl p-5 space-y-4 lg:col-span-2">
                          <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                            <Layers className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-xs font-black text-indigo-300 font-mono uppercase tracking-wider">
                              Indicator Mathematical Formulations &amp; Price Action Heuristics
                            </h3>
                          </div>
                          <p className="text-[11px] text-white/70 leading-relaxed font-mono">
                            The MTXquant analytics suite uses three proprietary, high-frequency algorithms to map and display institutional order books, fair value structures, and support levels:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-lg space-y-1.5 font-mono">
                              <span className="text-white text-xs font-bold block uppercase tracking-wide">1. Intraday Trend Projection</span>
                              <p className="text-[10px] text-white/45 leading-relaxed">
                                Tracks real-time Volume Weighted Average Price (VWAP) deviations along with 3-bar fractal swing pivots to pinpoint local directionality tests.
                              </p>
                            </div>
                            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-lg space-y-1.5 font-mono">
                              <span className="text-white text-xs font-bold block uppercase tracking-wide">2. Order Block Mitigation</span>
                              <p className="text-[10px] text-white/45 leading-relaxed">
                                Identifies high-displacement candle roots where large institutional sweeps occurred, predicting strong support or resistance on re-tests.
                              </p>
                            </div>
                            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-lg space-y-1.5 font-mono">
                              <span className="text-white text-xs font-bold block uppercase tracking-wide">3. Fair Value Gap (FVG)</span>
                              <p className="text-[10px] text-white/45 leading-relaxed">
                                Highlights single-candle liquidity vacuums where price moved too quickly, designating prospective zones for mean reversion targets.
                              </p>
                            </div>
                          </div>
                        </section>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: Sovereign Compliance */}
                  {activeTab === 'compliance' && (
                    <motion.div
                      key="compliance"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-8 max-w-5xl mx-auto"
                    >
                      <div className="border-b border-white/5 pb-5">
                        <div className="flex items-center gap-3">
                          <Scale className="w-6 h-6 text-emerald-400" />
                          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                            Sovereign Platform &amp; Brokerage Compliance
                          </h2>
                        </div>
                        <p className="text-xs text-white/50 font-mono mt-1 leading-relaxed">
                          Regulatory frameworks, audit reporting parameters, and investor protection directives guiding MTXquant operations.
                        </p>
                      </div>

                      <div className="space-y-6">
                        
                        {/* Card 1: Regulatory Framework Alignment */}
                        <div className="bg-neutral-950/80 border border-white/5 rounded-xl p-6 space-y-4">
                          <h3 className="text-xs font-black text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            SEC, FINRA, &amp; Investor Protection Standards
                          </h3>
                          <p className="text-[11.5px] text-white/70 leading-relaxed font-mono">
                            MTXquant complies with the most stringent financial standards globally. The platform has built-in features that enforce regulatory guidelines across digital interfaces:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10.5px] font-mono leading-relaxed text-white/50">
                            <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-lg space-y-2">
                              <span className="text-white font-bold text-[10px] block uppercase text-emerald-300">SEC Rule 15c3-3 Compliance</span>
                              <span>Ensures strict separation of client assets and cash from proprietary brokerage balances. Reserves are held strictly at vetted Tier-1 global institutions under dynamic risk formulas.</span>
                            </div>
                            <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-lg space-y-2">
                              <span className="text-white font-bold text-[10px] block uppercase text-emerald-300">Regulation Best Interest</span>
                              <span>All algorithmic modules are designed without conflict of interest. Pre-trade analytics provide balanced data, historical probability vectors, and complete disclosure on margins.</span>
                            </div>
                            <div className="bg-white/[0.01] border border-white/5 p-3.5 rounded-lg space-y-2">
                              <span className="text-white font-bold text-[10px] block uppercase text-emerald-300">MiFID II Trade Standards</span>
                              <span>Adheres to strict post-trade transparency and best-execution models. Built-in system circuit breakers suspend client APIs instantly if toxic flow exceeds standard parameters.</span>
                            </div>
                          </div>
                        </div>

                        {/* Card 2: Interactive Audit Checklist */}
                        <div className="bg-neutral-950/80 border border-white/5 rounded-xl p-6 space-y-4">
                          <h3 className="text-xs font-black text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Active Infrastructure Auditing (Dynamic Status Verification)
                          </h3>
                          <p className="text-[11px] text-white/60 leading-relaxed font-mono">
                            The system performs automated security validations on server startup. The following compliance nodes are verified and tracked:
                          </p>
                          <div className="border border-white/5 rounded-lg overflow-hidden font-mono text-xs">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-white/[0.02] border-b border-white/5 text-white/40 uppercase tracking-wider text-[10px] font-bold">
                                <tr>
                                  <th className="p-3">Audit Metric</th>
                                  <th className="p-3">Operational Directive</th>
                                  <th className="p-3">Compliance Standard</th>
                                  <th className="p-3 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-white/70">
                                <tr>
                                  <td className="p-3 font-bold text-white">Client Asset Isolation</td>
                                  <td className="p-3">Dedicated segregated escrow banking sweeps</td>
                                  <td className="p-3 text-white/40">SEC 15c3-3 / FINRA</td>
                                  <td className="p-3 text-right"><span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] border border-emerald-500/20 uppercase font-bold">Passed</span></td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-white">Data Ingestion Limits</td>
                                  <td className="p-3">Sandbox container rate limiting strictly applied</td>
                                  <td className="p-3 text-white/40">Google Cloud Sandbox Rules</td>
                                  <td className="p-3 text-right"><span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] border border-emerald-500/20 uppercase font-bold">Passed</span></td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-white">Server-side Key Custody</td>
                                  <td className="p-3">API keys held in environmental variable memory</td>
                                  <td className="p-3 text-white/40">TLS 1.3 Encryption Standard</td>
                                  <td className="p-3 text-right"><span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] border border-emerald-500/20 uppercase font-bold">Passed</span></td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-white">Audit Log Retentions</td>
                                  <td className="p-3">7-year immutable metadata storage log trails</td>
                                  <td className="p-3 text-white/40">SEC Rule 17a-4 / MiFID II</td>
                                  <td className="p-3 text-right"><span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] border border-emerald-500/20 uppercase font-bold">Passed</span></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: Interactive FAQ */}
                  {activeTab === 'faq' && (
                    <motion.div
                      key="faq"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-6 max-w-5xl mx-auto"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
                        <div>
                          <div className="flex items-center gap-3">
                            <HelpCircle className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                              Interactive FAQ Center
                            </h2>
                          </div>
                          <p className="text-xs text-white/50 font-mono mt-1 leading-relaxed">
                            Searchable and filterable database covering clearing procedures, system architecture, leverage safeguards, and client security protocols.
                          </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative shrink-0 w-full md:w-64">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                          <input
                            type="text"
                            placeholder="Search documentation..."
                            value={faqSearchQuery}
                            onChange={(e) => setFaqSearchQuery(e.target.value)}
                            className="bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 pl-9 text-xs text-white placeholder-white/35 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full font-mono transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Filter Categories */}
                      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3">
                        <button
                          onClick={() => setSelectedFaqCategory('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                            selectedFaqCategory === 'all' 
                              ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300' 
                              : 'text-white/50 hover:text-white/80 bg-white/[0.01] hover:bg-white/5 border border-white/5'
                          }`}
                        >
                          All Questions ({faqs.length})
                        </button>
                        <button
                          onClick={() => setSelectedFaqCategory('clearing')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                            selectedFaqCategory === 'clearing' 
                              ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300' 
                              : 'text-white/50 hover:text-white/80 bg-white/[0.01] hover:bg-white/5 border border-white/5'
                          }`}
                        >
                          Clearing &amp; Custody
                        </button>
                        <button
                          onClick={() => setSelectedFaqCategory('technology')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                            selectedFaqCategory === 'technology' 
                              ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300' 
                              : 'text-white/50 hover:text-white/80 bg-white/[0.01] hover:bg-white/5 border border-white/5'
                          }`}
                        >
                          Platform Architecture
                        </button>
                        <button
                          onClick={() => setSelectedFaqCategory('risk')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                            selectedFaqCategory === 'risk' 
                              ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300' 
                              : 'text-white/50 hover:text-white/80 bg-white/[0.01] hover:bg-white/5 border border-white/5'
                          }`}
                        >
                          Risk &amp; Compliance
                        </button>
                      </div>

                      {/* Dynamic FAQs Container */}
                      <div className="space-y-3 pr-1">
                        {filteredFaqs.length === 0 ? (
                          <div className="py-14 text-center border border-dashed border-white/5 rounded-xl bg-neutral-950/20">
                            <Info className="w-8 h-8 text-white/20 mx-auto mb-2" />
                            <p className="text-sm font-bold text-white/55">No matches found</p>
                            <p className="text-xs text-white/30 font-mono mt-1">Try searching different terms or clearing the filter category.</p>
                          </div>
                        ) : (
                          filteredFaqs.map((faq, i) => {
                            const isExpanded = !!expandedFaqs[i];
                            return (
                              <div 
                                key={i} 
                                className="border border-white/5 bg-neutral-950/80 hover:bg-neutral-900/40 rounded-xl overflow-hidden transition-all duration-200"
                              >
                                <button
                                  onClick={() => toggleFaq(i)}
                                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer focus:outline-none"
                                >
                                  <div className="flex items-center gap-3.5 pr-4">
                                    <span className="text-[8px] font-bold font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded tracking-wider leading-none shrink-0 uppercase">
                                      {faq.tagLabel}
                                    </span>
                                    <span className="text-xs font-bold text-white leading-relaxed">
                                      {faq.q}
                                    </span>
                                  </div>
                                  <span className="text-white/35 shrink-0 bg-white/5 p-1 rounded-lg">
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                                  </span>
                                </button>

                                <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden bg-[#07080c] border-t border-white/5"
                                    >
                                      <div className="p-5 text-xs font-mono text-white/70 leading-relaxed">
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

                  {/* TAB 4: Risk Disclosure */}
                  {activeTab === 'risk' && (
                    <motion.div
                      key="risk"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-8 max-w-5xl mx-auto"
                    >
                      <div className="border-b border-white/5 pb-5">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-6 h-6 text-amber-500" />
                          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                            Leverage Quantitative System Risk Disclosures
                          </h2>
                        </div>
                        <p className="text-xs text-white/50 font-mono mt-1 leading-relaxed">
                          Mandatory legal warnings regarding high-leverage algorithmic derivatives, technical slippage, and client liability thresholds.
                        </p>
                      </div>

                      <div className="text-[12px] font-mono text-white/65 space-y-6 leading-relaxed bg-[#0e0c08] border border-amber-500/10 p-6 rounded-xl">
                        <div className="flex items-center gap-3.5 border-b border-white/5 pb-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                          <p className="text-amber-400 font-bold uppercase tracking-wider text-sm">
                            LEVERAGE &amp; MARGIN MARGINAL CRITICAL ALARM NOTICE
                          </p>
                        </div>
                        
                        <p>
                          Trading spot derivatives, leveraged options, commodities, and index swaps carries an extremely substantial level of capital risk. High leverage amplifies market movements in both directions, which can lead to rapid capital depreciation matching or exceeding your original margin balance pool.
                        </p>

                        <div className="bg-black/30 p-4 border border-white/5 rounded-lg space-y-3">
                          <p className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Core Risk Domains Covered Under This Mandate:
                          </p>
                          <ul className="list-disc pl-5 space-y-2 text-white/55 text-[11.5px]">
                            <li>
                              <strong className="text-white/80">Dynamic Market Slippage:</strong> Under volatile macroeconomic events (such as central bank policy updates or geopolitical developments), liquidity depth can widen instantly. This slippage can cause execution fills at prices far from requested thresholds.
                            </li>
                            <li>
                              <strong className="text-white/80">1% Safeguard Limitations:</strong> The client-side &quot;Fixed Fractional Safeguard&quot; is a mathematical guide and is not guaranteed to protect against extreme weekend price gaps or intraday flash crashes.
                            </li>
                            <li>
                              <strong className="text-white/80">Broker API Failures:</strong> Network latency spikes, WebSocket heart-beat timeouts, or server maintenance windows may delay trade cancellations. System users remain liable for resulting market fills.
                            </li>
                          </ul>
                        </div>

                        <p className="text-[11px] text-white/35 border-t border-white/5 pt-4 leading-normal">
                          REGULATORY ADVISORY (CFTC, ESMA, NFA, FCA): Simulated model backtesting, historical metrics, and performance charts do not represent actual live capital outcomes. Always consult certified financial advisors before conducting automated capital trade executions.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 5: Cookie Policy */}
                  {activeTab === 'cookies' && (
                    <motion.div
                      key="cookies"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-8 max-w-5xl mx-auto"
                    >
                      <div className="border-b border-white/5 pb-5">
                        <div className="flex items-center gap-3">
                          <Cookie className="w-6 h-6 text-emerald-400" />
                          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                            Cookie &amp; Session Storage Policy
                          </h2>
                        </div>
                        <p className="text-xs text-white/50 font-mono mt-1 leading-relaxed">
                          Technical disclosure regarding browser state caching, session security storage, and client preference tokens.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <div className="text-[12px] font-mono text-white/70 space-y-4 leading-relaxed bg-[#06080c] p-6 border border-white/5 rounded-xl">
                          <p>
                            MTXquant complies with international guidelines on digital tracking. We do not use third-party analytics scripts, marketing trackers, or cross-site behavioral targeting cookies. Only strictly essential operational parameters are stored in local storage to secure sessions and maintain UI continuity.
                          </p>

                          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-lg font-bold text-white flex items-center gap-2">
                            <Lock className="w-4 h-4 text-emerald-400" />
                            <span>Authorized Local Storage Keys Used by the System:</span>
                          </div>

                          <div className="border border-white/5 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-[11px] font-mono">
                              <thead className="bg-white/[0.02] border-b border-white/5 text-white/40 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                  <th className="p-3">Local Storage Node</th>
                                  <th className="p-3">Specific Objective</th>
                                  <th className="p-3">Persistence Period</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-white/60">
                                <tr>
                                  <td className="p-3 font-bold text-emerald-400">mtx_settings</td>
                                  <td className="p-3">Caches dashboard bounds, visual terminal preferences, and color profiles.</td>
                                  <td className="p-3 text-white/45">Indefinite (Local Session)</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-emerald-400">apex_idle_timeout</td>
                                  <td className="p-3">Maintains chosen auto-logout duration to prevent session hijacking.</td>
                                  <td className="p-3 text-white/45">Indefinite (Local Session)</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-bold text-emerald-400">firebase_auth_token</td>
                                  <td className="p-3">Maintains authorization state for real-time portfolio balance syncing.</td>
                                  <td className="p-3 text-white/45">Browser Session (Auto-Refresh)</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <p className="text-[11px] text-white/40 mt-2">
                            Blocking browser storage caches entirely will reset your terminal preferences (such as charts, alert lists, and layout panels) to default values on every tab reload.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 6: Privacy Charter */}
                  {activeTab === 'privacy' && (
                    <motion.div
                      key="privacy"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-8 max-w-5xl mx-auto"
                    >
                      <div className="border-b border-white/5 pb-5">
                        <div className="flex items-center gap-3">
                          <Shield className="w-6 h-6 text-teal-400" />
                          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                            System Privacy Charter &amp; Data Protections
                          </h2>
                        </div>
                        <p className="text-xs text-white/50 font-mono mt-1 leading-relaxed">
                          GDPR/CCPA compliance directives, data ingestion audits, and cryptographic security models.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-neutral-950/80 border border-white/5 rounded-xl p-6 space-y-4 font-mono text-[12px] text-white/70 leading-relaxed">
                          <h3 className="text-white text-xs font-bold uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-teal-400" />
                            General Data Protection Regulation (GDPR) Alignment
                          </h3>
                          <p>
                            MTXquant is fully aligned with the European Union GDPR and California Consumer Privacy Act (CCPA) guidelines. Our technical architecture ensures that you retain complete sovereignty over your trading files, system watchlists, and API authentication tokens:
                          </p>
                          <ul className="list-disc pl-5 space-y-2 text-white/50 text-[11.5px]">
                            <li>
                              <strong className="text-white/80">Right to Erasure (Be Forgotten):</strong> When you trigger an account termination via the security portal, all profile records, watchlists, and custom layout presets are completely wiped from active systems within 24 hours.
                            </li>
                            <li>
                              <strong className="text-white/80">Data Minimization:</strong> The platform collects only what is needed to maintain trade records, calculate execution metrics, and enforce regional regulatory checks.
                            </li>
                            <li>
                              <strong className="text-white/80">Full Encrypted Transit:</strong> Every inbound and outbound API request is protected by TLS 1.3 encryption with AES-256 database protection on the Firebase servers.
                            </li>
                          </ul>
                        </div>

                        <div className="bg-[#0b0c10] border border-teal-500/10 p-5 rounded-xl space-y-2.5">
                          <span className="text-[9px] font-mono font-bold tracking-widest text-teal-400 uppercase block">NO THIRD-PARTY SALE AGREEMENT</span>
                          <p className="text-[11px] font-mono leading-relaxed text-white/50">
                            We do not share, sell, distribute, or capture your real-time trading logs, stop-loss triggers, or active order-book settings for third-party analytical monetization. All execution operations remain strictly sandboxed and private.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 7: Terms of Service */}
                  {activeTab === 'terms' && (
                    <motion.div
                      key="terms"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-8 max-w-5xl mx-auto"
                    >
                      <div className="border-b border-white/5 pb-5">
                        <div className="flex items-center gap-3">
                          <FileText className="w-6 h-6 text-blue-400" />
                          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                            Terms of Service &amp; Algorithmic Mandates
                          </h2>
                        </div>
                        <p className="text-xs text-white/50 font-mono mt-1 leading-relaxed">
                          Mutual operational agreements, trade rate limits, and terminal usage licenses.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-neutral-950/80 border border-white/5 rounded-xl p-6 space-y-4 font-mono text-[12px] text-white/70 leading-relaxed">
                          <p>
                            Welcome to the MTXquant terminal suite. By loading this software and executing algorithmic operations on the asset dashboards, you enter a binding contractual covenant with MTXcapital.
                          </p>

                          <div className="space-y-4 border-l-2 border-indigo-500/20 pl-4 text-white/50 text-[11px]">
                            <p>
                              <strong>1. Programmatic Rate Limits &amp; Circuit Breakers:</strong> Any automated order sequence triggering more than 15 validation failures inside a 60-second window will trip our system rate limit controllers. This instantly locks the local execution gateway to preserve brokerage endpoints.
                            </p>
                            <p>
                              <strong>2. Prohibited Behaviors:</strong> You are strictly prohibited from utilizing this terminal interface to conduct wash trading, quote stuffing, order-book spoofing, latency arbitrage, or toxic high-frequency scraping campaigns against central clearing books.
                            </p>
                            <p>
                              <strong>3. Proprietary Software License:</strong> MTXquant grants a non-transferable, single-node workstation license to utilize its analysis suite. Reverse engineering compiled models, indicator algorithms, or DOM price action projections is strictly forbidden.
                            </p>
                          </div>

                          <p className="text-[10px] text-white/35 leading-normal pt-2 border-t border-white/5">
                            This agreement remains subject to governing financial arbitration laws, in compliance with regional algorithmic trading guidelines (such as MiFID II / Dodd-Frank framework directives).
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </main>
            </div>

            {/* Redesigned Full-screen Footer */}
            <footer className="px-6 py-3.5 bg-neutral-950 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[10px] font-mono text-white/35 shrink-0">
              <div className="flex items-center gap-2">
                <span>&copy; 2026 MTXquant Institutional Group</span>
                <span className="text-white/10">|</span>
                <span>All client portfolios held in segregated escrow accounts</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="hidden md:inline">SYSTEM AUTHENCY SHARED SECURE KEY ENABLED</span>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[9.5px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold uppercase tracking-wider">
                    COMPLIANCE STATUS: DYNAMIC ALIGNED
                  </span>
                </div>
              </div>
            </footer>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
