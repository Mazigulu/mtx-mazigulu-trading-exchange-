import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileText, 
  Printer, 
  Download, 
  Check, 
  ShieldAlert, 
  Scale, 
  Lock, 
  Info,
  ExternalLink
} from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LegalModal({ isOpen, onClose }: LegalModalProps) {
  const [activeSection, setActiveSection] = useState<'risk' | 'lease' | 'privacy' | 'regulation'>('risk');
  const [hasAccepted, setHasAccepted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handlePrint = () => {
    try {
      // Simulate/trigger custom formatted print of legal contents
      const content = document.getElementById('legal-doc-content')?.innerText;
      if (content) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>MTXquant Institutional Legal Agreement</title>
                <style>
                  body { font-family: monospace; padding: 40px; line-height: 1.6; color: #111; font-size: 11px; }
                  h1 { border-bottom: 2px solid #000; padding-bottom: 10px; font-size: 14px; text-transform: uppercase; }
                  h2 { font-size: 12px; text-transform: uppercase; margin-top: 30px; }
                  pre { white-space: pre-wrap; word-wrap: break-word; }
                </style>
              </head>
              <body>
                <h1>MTXquant Terminal Compliance Documentation</h1>
                <pre>${content}</pre>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (e) {
      alert("Print failed or was blocked by the browser frame policies.");
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText("https://mtxquant.mtxcapital.com/legal/institutional-agreement-2026");
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.warn("Clipboard copy failed");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="legal-modal-backdrop" className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <motion.div
            id="legal-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-3xl bg-[#08080c] border border-white/10 rounded-xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col font-mono text-white text-xs text-left"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-transparent to-transparent border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded">
                  <Scale className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-[13px] font-black uppercase tracking-wider text-white">Compliance & Legal Library</h2>
                  <p className="text-[9px] text-white/40">Regulatory disclosures, terms of service and execution disclaimers</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-white/40 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions Header Strip */}
            <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-[9px] text-white/50 shrink-0">
              <div className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Last Updated: January 14, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/80 transition-all cursor-pointer hover:border-white/20"
                >
                  <Printer className="w-3 h-3 text-indigo-400" />
                  Print Doc
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/80 transition-all cursor-pointer hover:border-white/20"
                >
                  <FileText className="w-3 h-3 text-indigo-400" />
                  {copiedLink ? 'Link Copied!' : 'Copy Direct Link'}
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {/* Sidebar Tabs */}
              <div className="w-full md:w-52 border-b md:border-b-0 md:border-r border-white/10 bg-black/15 flex md:flex-col p-2.5 gap-1 overflow-x-auto md:overflow-x-visible shrink-0 text-[10px]">
                <button
                  onClick={() => setActiveSection('risk')}
                  className={`flex-1 md:flex-none text-left px-3 py-2.5 rounded transition-all flex items-center gap-2 cursor-pointer ${
                    activeSection === 'risk' 
                      ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 font-bold' 
                      : 'border border-transparent text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Risk Disclosure</span>
                </button>
                <button
                  onClick={() => setActiveSection('lease')}
                  className={`flex-1 md:flex-none text-left px-3 py-2.5 rounded transition-all flex items-center gap-2 cursor-pointer ${
                    activeSection === 'lease' 
                      ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 font-bold' 
                      : 'border border-transparent text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Terms of Lease</span>
                </button>
                <button
                  onClick={() => setActiveSection('privacy')}
                  className={`flex-1 md:flex-none text-left px-3 py-2.5 rounded transition-all flex items-center gap-2 cursor-pointer ${
                    activeSection === 'privacy' 
                      ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 font-bold' 
                      : 'border border-transparent text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Data Privacy</span>
                </button>
                <button
                  onClick={() => setActiveSection('regulation')}
                  className={`flex-1 md:flex-none text-left px-3 py-2.5 rounded transition-all flex items-center gap-2 cursor-pointer ${
                    activeSection === 'regulation' 
                      ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 font-bold' 
                      : 'border border-transparent text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Regulatory Notes</span>
                </button>
              </div>

              {/* Scrollable Document Content */}
              <div 
                id="legal-doc-content"
                className="flex-1 p-5 overflow-y-auto space-y-4 bg-black/5 select-text leading-relaxed text-[10px] text-white/70"
              >
                {activeSection === 'risk' && (
                  <div className="space-y-3">
                    <h3 className="text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      SECURE PORTFOLIO RISK DISCLOSURE
                    </h3>
                    <p className="text-amber-400 font-bold uppercase text-[9px] leading-snug">
                      WARNING: HIGH-FREQUENCY QUANTITATIVE EXECUTION CARRIES IMMENSE FINANCIAL RISK. TRADING IS COMPLETELY AUTOMATED AND SUBJECT TO SLIPPAGE.
                    </p>
                    <div className="space-y-2 text-white/60">
                      <p>
                        1. <strong>Leverage Risks:</strong> Operating under global prime brokerage arrangements permits the allocation of up to 1:10 leverage margins. Small adverse movements in derivative price indexes can yield rapid full liquidation of core balances.
                      </p>
                      <p>
                        2. <strong>Direct Market Access (DMA) Outages:</strong> Direct packet routing to OTC liquidity pools and Lmax gateway bridges might undergo network latencies exceeding 800ms during macroeconomic briefings. Apex holds no responsibility for order-book synchronization delays.
                      </p>
                      <p>
                        3. <strong>Algorithmic Execution Drift:</strong> Auto-allocation tools use mathematical metrics that depend on historical benchmark parameters. Past performance or backtested metrics are no guarantee of real-time execution safety.
                      </p>
                      <p>
                        4. <strong>Auto-Liquidation Safeguard:</strong> The terminal reserves the right to trigger automatic global risk shutdowns (Emergency Close) whenever structural margin requirements fall below 105%.
                      </p>
                    </div>
                  </div>
                )}

                {activeSection === 'lease' && (
                  <div className="space-y-3">
                    <h3 className="text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      SECURITIES TRADING & PORTFOLIO TERMS
                    </h3>
                    <p className="text-indigo-300 font-bold uppercase text-[9px] leading-snug">
                      Securities Trading Customer Agreement
                    </p>
                    <div className="space-y-2 text-white/60">
                      <p>
                        1. <strong>Licensing Bounds:</strong> MTX Securities grants a non-assignable, fully restricted license to active traders to utilize financial calculation tools, live stock order books, and portfolio simulators.
                      </p>
                      <p>
                        2. <strong>Reverse Engineering Restriction:</strong> You are strictly forbidden from inspecting, reverse-compiling, or extracting the core execution pipeline scripts, AI logic parameters, or broker authentication tokens.
                      </p>
                      <p>
                        3. <strong>Terminal Usage Metrics:</strong> Apex records diagnostic usage telemetry logs (session durations, interface toggles, connection latency metrics) to optimize API endpoints and verify multi-terminal synchronization.
                      </p>
                      <p>
                        4. <strong>Security of Keys:</strong> The client is entirely responsible for preserving local security tokens and keeping MetaMask connections private. No representative of MTXcapital will request raw passwords or encrypted bearer files.
                      </p>
                    </div>
                  </div>
                )}

                {activeSection === 'privacy' && (
                  <div className="space-y-3">
                    <h3 className="text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                      <Lock className="w-4 h-4 text-indigo-400" />
                      DATA PRIVACY & COOKIE COVENANT
                    </h3>
                    <p className="text-indigo-300 font-bold uppercase text-[9px] leading-snug">
                      ISO-27001 Certified Client Diagnostic Data Protection standards
                    </p>
                    <div className="space-y-2 text-white/60">
                      <p>
                        1. <strong>Encrypted Storage:</strong> All personalization parameters (active tab preferences, system volumes, custom sound toggle parameters) are stored in client-side secure localStorage keys and never leaked.
                      </p>
                      <p>
                        2. <strong>Cookie Usage Policies:</strong> This terminal uses functional cookies exclusively to manage secure Firebase authentication session variables and track MetaMask connectivity. No marketing trackers or pixel scripts are used.
                      </p>
                      <p>
                        3. <strong>Log Retention:</strong> Compliance logs are retained locally inside browser buffers. Clearing active caches via Settings permanently deletes session files.
                      </p>
                    </div>
                  </div>
                )}

                {activeSection === 'regulation' && (
                  <div className="space-y-3">
                    <h3 className="text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                      <Scale className="w-4 h-4 text-indigo-400" />
                      REGULATORY REGISTRY COMPLIANCE
                    </h3>
                    <p className="text-indigo-300 font-bold uppercase text-[9px] leading-snug">
                      SEC Rule 15c3-5 & MIFID II Algorithmic Risk Disclosures
                    </p>
                    <div className="space-y-2 text-white/60">
                      <p>
                        1. <strong>SEC Rule 15c3-5 Compliant Controls:</strong> Pre-trade algorithmic checks must block orders that exceed preset core thresholds or violate daily capital caps. Risk filters cannot be disabled under standard lease levels.
                      </p>
                      <p>
                        2. <strong>Reporting Protocols:</strong> In accordance with MiFID II regulations, all high-frequency transactions are logged into an audit ledger containing exact millisecond timestamps and microsecond latency values.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Accord / Interactive Consent */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <label className="flex items-center gap-2.5 text-[9.5px] text-white/60 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={hasAccepted}
                  onChange={(e) => setHasAccepted(e.target.checked)}
                  className="rounded bg-[#040405] border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-indigo-500"
                />
                <span className="group-hover:text-white transition-colors">
                  I have read and agree to the compliance risk guidelines.
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className={`px-4 py-2 font-bold uppercase text-[9.5px] rounded border transition-all cursor-pointer ${
                    hasAccepted 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/20 hover:shadow-[0_0_12px_rgba(99,102,241,0.25)]' 
                      : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed hover:bg-white/5'
                  }`}
                  disabled={!hasAccepted}
                >
                  Confirm Compliance
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
