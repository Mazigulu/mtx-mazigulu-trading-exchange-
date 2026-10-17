import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Coins, 
  CreditCard, 
  GitCommit, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  Code2,
  FileCode,
  Building,
  Key,
  Database,
  Lock,
  Workflow,
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Erc3643ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Erc3643ArchitectureModal: React.FC<Erc3643ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'COMPONENT' | 'SEQUENCE' | 'CLASS' | 'PAYMENT'>('COMPONENT');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-5xl bg-[#08080a] border border-[#6366f1]/40 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.2)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-[#0c0c12] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-mono uppercase tracking-wide text-white">
                  T-REX ERC-3643 System Architecture
                </h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                  1:1 Share Tokenization
                </span>
              </div>
              <p className="text-xs text-white/60 font-mono mt-0.5">
                Permissioned RWA Securities Engine, Identity Registry & Multi-Rail Payment Aggregation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 bg-[#0a0a0f] border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'COMPONENT', label: '1. System Component Diagram', icon: Layers },
            { id: 'SEQUENCE', label: '2. DvP Settlement Sequence', icon: Workflow },
            { id: 'CLASS', label: '3. ERC-3643 Contract Class Diagram', icon: Code2 },
            { id: 'PAYMENT', label: '4. Payment Aggregations Matrix', icon: Coins },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'border-indigo-500 text-white bg-indigo-600/10'
                    : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.02]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-white/40'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body / Diagram Viewport */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-white font-mono text-xs">
          
          {/* TAB 1: SYSTEM COMPONENT DIAGRAM */}
          {activeTab === 'COMPONENT' && (
            <div className="space-y-6">
              <div className="bg-[#050508] border border-white/10 rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                  <span className="text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                    UML Component Diagram: End-to-End Regulated Tokenization Topology
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">1 Token = 1 Fiduciary Share Backed</span>
                </div>

                {/* Architecture Visual Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Layer 1: Client & Identity */}
                  <div className="bg-[#0a0a10] border border-indigo-500/30 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-[10px] uppercase border-b border-white/5 pb-2">
                      <Key className="w-3.5 h-3.5" />
                      <span>1. Client & ONCHAINID</span>
                    </div>
                    <div className="space-y-2 text-[10px] text-white/70">
                      <div className="p-2 bg-black/60 rounded border border-white/5">
                        <strong className="text-white block font-mono">Web3 User Wallet</strong>
                        Metamask, Base L2, WalletConnect (Bound to ONCHAINID)
                      </div>
                      <div className="p-2 bg-black/60 rounded border border-white/5">
                        <strong className="text-white block font-mono">Decentralized ID (ONCHAINID)</strong>
                        ERC-734 Key Manager & ERC-735 Claim Issuer
                      </div>
                      <div className="p-2 bg-black/60 rounded border border-white/5">
                        <strong className="text-white block font-mono">KYC / AML Claim</strong>
                        Signed by trusted accredited verifiers
                      </div>
                    </div>
                  </div>

                  {/* Layer 2: Payment Aggregator Hub */}
                  <div className="bg-[#0a0a10] border border-emerald-500/30 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-[10px] uppercase border-b border-white/5 pb-2">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>2. Payment Aggregator</span>
                    </div>
                    <div className="space-y-2 text-[10px] text-white/70">
                      <div className="p-2 bg-black/60 rounded border border-white/5">
                        <strong className="text-white block font-mono">Fiat Rails</strong>
                        Plaid ACH, Stripe Cards, SEPA Instant, FedNow
                      </div>
                      <div className="p-2 bg-black/60 rounded border border-white/5">
                        <strong className="text-white block font-mono">Stablecoin Gateways</strong>
                        USDC (Base L2), USDT, PYUSD Smart Contracts
                      </div>
                      <div className="p-2 bg-black/60 rounded border border-white/5">
                        <strong className="text-white block font-mono">Liquidity & Escrow</strong>
                        Instant fiduciary sweep & collateral settlement
                      </div>
                    </div>
                  </div>

                  {/* Layer 3: ERC-3643 Smart Contract Suite */}
                  <div className="bg-[#0a0a10] border border-purple-500/30 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center gap-2 text-purple-300 font-bold text-[10px] uppercase border-b border-white/5 pb-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>3. T-REX ERC-3643 Engine</span>
                    </div>
                    <div className="space-y-2 text-[10px] text-white/70">
                      <div className="p-2 bg-black/60 rounded border border-white/5">
                        <strong className="text-white block font-mono">Token.sol (ERC-3643)</strong>
                        1:1 tokenized share representation with compliance hooks
                      </div>
                      <div className="p-2 bg-black/60 rounded border border-white/5">
                        <strong className="text-white block font-mono">Identity Registry</strong>
                        Matches wallets to verified ONCHAINID identities
                      </div>
                      <div className="p-2 bg-black/60 rounded border border-white/5">
                        <strong className="text-white block font-mono">Compliance.sol</strong>
                        Real-time country, holding & concentration limits
                      </div>
                    </div>
                  </div>

                  {/* Layer 4: Custody & Depository Backing */}
                  <div className="bg-[#0a0a10] border border-amber-500/30 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-[10px] uppercase border-b border-white/5 pb-2">
                      <Building className="w-3.5 h-3.5" />
                      <span>4. 1:1 Fiduciary Custody</span>
                    </div>
                    <div className="space-y-2 text-[10px] text-white/70">
                      <div className="p-2 bg-black/60 rounded border border-white/5">
                        <strong className="text-white block font-mono">Regulated Custodian</strong>
                        Broker-Dealer holding underlying stock certificate
                      </div>
                      <div className="p-2 bg-black/60 rounded border border-white/5">
                        <strong className="text-white block font-mono">DTC / Transfer Agent</strong>
                        1:1 master shareholder ledger synchronization
                      </div>
                      <div className="p-2 bg-black/60 rounded border border-white/5">
                        <strong className="text-white block font-mono">Proof of Reserve Oracle</strong>
                        Automated continuous solvency verification
                      </div>
                    </div>
                  </div>
                </div>

                {/* ASCII UML Flow Block */}
                <div className="mt-5 p-4 bg-black/80 rounded-lg border border-white/5 font-mono text-[9px] text-indigo-300/90 overflow-x-auto leading-relaxed">
                  <pre>{`+--------------------+      1. Select Shares & Payment Rail     +-----------------------------+
| Investor / Client  | =======================================> | Multi-Rail Payment Gateway  |
| (ONCHAINID Holder) |                                          | (Fiat ACH / USDC / Card)    |
+--------------------+                                          +-----------------------------+
         ||                                                                   ||
         || 4. Receive 1:1 ERC-3643 Token                                     || 2. Confirm Funds
         \/                                                                   \/
+--------------------+      3. Atomic DvP Issuance Trigger      +-----------------------------+
| ERC-3643 Security  | <======================================= | MTX DvP Settlement Engine   |
| Token (Token.sol)  |                                          | (Fiduciary Escrow Router)   |
+--------------------+                                          +-----------------------------+
         ||                                                                   ||
  verifyTransfer()                                                    Synchronize Ledger
         ||                                                                   ||
         \/                                                                   \/
+--------------------+      Validated Claims & Limits           +-----------------------------+
| Identity Registry  | <--------------------------------------- | Regulated Stock Custodian   |
| & Compliance Rules |                                          | (1:1 Share Vault at DTC)    |
+--------------------+                                          +-----------------------------+`}</pre>
                </div>
              </div>

              {/* Security Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 bg-[#0a0a0f] border border-white/5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Exact 1:1 Share Backing</span>
                  </div>
                  <p className="text-[10px] text-white/60">
                    Each ERC-3643 token corresponds strictly to one genuine corporate share held in regulated custody. No fractional unbacked minting is permitted.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0a0a0f] border border-white/5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>On-Chain Permissioning</span>
                  </div>
                  <p className="text-[10px] text-white/60">
                    Transfers between wallets fail automatically on-chain if the receiver lacks an approved ONCHAINID claim or violates jurisdictional compliance.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0a0a0f] border border-white/5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Coins className="w-4 h-4" />
                    <span>Multi-Rail Settlement</span>
                  </div>
                  <p className="text-[10px] text-white/60">
                    Aggregates cards, ACH, wire, Base L2 USDC, Ethereum USDT, and Web3 wallets with automated atomic Delivery-vs-Payment (DvP).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEQUENCE DIAGRAM */}
          {activeTab === 'SEQUENCE' && (
            <div className="space-y-5">
              <div className="bg-[#050508] border border-white/10 rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                  <span className="text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                    UML Sequence Diagram: Delivery-vs-Payment (DvP) Purchase & Token Minting
                  </span>
                  <span className="text-[10px] text-white/50 font-mono">Synchronous & Asynchronous Lifecycle</span>
                </div>

                {/* Sequence Step-by-Step Breakdown */}
                <div className="space-y-3">
                  {[
                    {
                      step: 'Step 01',
                      actor: 'Investor → Platform',
                      action: 'Initiate Order & Choose Payment Method',
                      desc: 'User inputs ticker (e.g., NVDA, AAPL), confirms purchase, and selects rail (ACH, Credit Card, USDC Base L2, or USDT).',
                      theme: 'text-indigo-400 border-indigo-500/30'
                    },
                    {
                      step: 'Step 02',
                      actor: 'IdentityRegistry & Compliance',
                      action: 'Pre-flight Investor Qualification Audit',
                      desc: 'The platform checks isVerified(investorWallet). Validates ONCHAINID has active KYC claim topic and respects jurisdiction rules.',
                      theme: 'text-purple-400 border-purple-500/30'
                    },
                    {
                      step: 'Step 03',
                      actor: 'Payment Aggregator Hub',
                      action: 'Funds Capture & Settlement Escrow',
                      desc: 'Fiat is charged via ACH/Card, or stablecoins are transferred to the Fiduciary Settlement Escrow. Gateway emits PaymentConfirmed event.',
                      theme: 'text-emerald-400 border-emerald-500/30'
                    },
                    {
                      step: 'Step 04',
                      actor: 'Custodian / Depository',
                      action: '1:1 Underlying Share Custody Lock',
                      desc: 'Broker-dealer executes purchase on exchange or locks designated equity share into the institutional depository vault.',
                      theme: 'text-amber-400 border-amber-500/30'
                    },
                    {
                      step: 'Step 05',
                      actor: 'ERC-3643 Token Contract',
                      action: 'Atomic Minting / Transfer to Investor Wallet',
                      desc: 'Token.mint(investorWallet, shareAmount) is executed by the authorized Agent. Token balance now represents verifiable 1:1 legal ownership.',
                      theme: 'text-cyan-400 border-cyan-500/30'
                    }
                  ].map((s) => (
                    <div key={s.step} className={`p-3 bg-[#0a0a0f] border ${s.theme} rounded-xl flex items-start gap-3`}>
                      <span className="px-2 py-0.5 rounded bg-white/5 font-bold font-mono text-[9px] uppercase shrink-0 text-white">
                        {s.step}
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-[11px]">{s.action}</span>
                          <span className="text-[9px] text-white/40">({s.actor})</span>
                        </div>
                        <p className="text-[10px] text-white/60">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* UML Sequence Notation */}
                <div className="mt-5 p-4 bg-black/80 rounded-lg border border-white/5 font-mono text-[9px] text-indigo-300/90 overflow-x-auto leading-relaxed">
                  <pre>{`Investor        PaymentGateway       SettlementEngine      Custodian Vault     IdentityRegistry      ERC3643 Token
   |                   |                    |                    |                   |                   |
   |-- 1. Buy Order -> |                    |                    |                   |                   |
   |   (Shares, Rail)  |-- 2. Verify KYC -> | -------------------------------------> |                   |
   |                   |                    |                    |                   |-- isVerified()? ->|
   |                   |                    |                    |                   |<- true/false -----|
   |                   |-- 3. Capture Funds |                    |                   |                   |
   |                   |   (Fiat/Crypto) -> |                    |                   |                   |
   |                   |                    |-- 4. Lock 1:1 ---->|                   |                   |
   |                   |                    |   Share at DTC     |                   |                   |
   |                   |                    |<-- Custody Receipt-|                   |                   |
   |                   |                    |                                                            |
   |                   |                    |-- 5. mint(investorWallet, 1:1 Amount) -------------------->|
   |                   |                    |                                                            |-- canTransfer()?
   |                   |                    |                                                            |-- executeMint()
   |<----------------- Token Credited to Web3 Wallet ----------------------------------------------------|`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLASS DIAGRAM */}
          {activeTab === 'CLASS' && (
            <div className="space-y-5">
              <div className="bg-[#050508] border border-white/10 rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                  <span className="text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                    UML Class Diagram: T-REX / ERC-3643 Contract Hierarchy & Interfaces
                  </span>
                  <span className="text-[10px] text-white/50 font-mono">Standardized Smart Contracts</span>
                </div>

                {/* Class Diagram Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Class 1: Token */}
                  <div className="p-3 bg-[#0a0a0f] border border-indigo-500/30 rounded-xl space-y-2">
                    <div className="border-b border-white/5 pb-1">
                      <span className="text-[8px] text-white/40 block">«interface»</span>
                      <strong className="text-white text-xs font-mono">IERC3643 (Token)</strong>
                    </div>
                    <div className="text-[9px] text-indigo-300 font-mono space-y-1">
                      <div>+ decimals(): uint8 (0 for shares)</div>
                      <div>+ onchainID(): address</div>
                      <div>+ identityRegistry(): IIdentityRegistry</div>
                      <div>+ compliance(): ICompliance</div>
                      <div>+ isFrozen(wallet): bool</div>
                    </div>
                    <div className="border-t border-white/5 pt-1 text-[9px] text-emerald-400 font-mono space-y-1">
                      <div>+ transfer(to, amount): bool</div>
                      <div>+ mint(to, amount) [Agent]</div>
                      <div>+ burn(from, amount) [Agent]</div>
                      <div>+ freezePartialTokens(wallet, amt)</div>
                    </div>
                  </div>

                  {/* Class 2: Identity Registry */}
                  <div className="p-3 bg-[#0a0a0f] border border-purple-500/30 rounded-xl space-y-2">
                    <div className="border-b border-white/5 pb-1">
                      <span className="text-[8px] text-white/40 block">«interface»</span>
                      <strong className="text-white text-xs font-mono">IIdentityRegistry</strong>
                    </div>
                    <div className="text-[9px] text-purple-300 font-mono space-y-1">
                      <div>+ identityStorage(): address</div>
                      <div>+ issuersRegistry(): address</div>
                      <div>+ topicsRegistry(): address</div>
                      <div>+ investorCountry(wallet): uint16</div>
                    </div>
                    <div className="border-t border-white/5 pt-1 text-[9px] text-emerald-400 font-mono space-y-1">
                      <div>+ isVerified(wallet): bool</div>
                      <div>+ registerIdentity(wallet, onchainID)</div>
                      <div>+ deleteIdentity(wallet)</div>
                      <div>+ updateCountry(wallet, country)</div>
                    </div>
                  </div>

                  {/* Class 3: Modular Compliance */}
                  <div className="p-3 bg-[#0a0a0f] border border-emerald-500/30 rounded-xl space-y-2">
                    <div className="border-b border-white/5 pb-1">
                      <span className="text-[8px] text-white/40 block">«interface»</span>
                      <strong className="text-white text-xs font-mono">ICompliance</strong>
                    </div>
                    <div className="text-[9px] text-emerald-300 font-mono space-y-1">
                      <div>+ maxInvestors(): uint256</div>
                      <div>+ maxShareHoldings(country): uint256</div>
                      <div>+ isCountryRestricted(code): bool</div>
                    </div>
                    <div className="border-t border-white/5 pt-1 text-[9px] text-amber-400 font-mono space-y-1">
                      <div>+ canTransfer(from, to, val): bool</div>
                      <div>+ created(from, to, val)</div>
                      <div>+ destroyed(from, to, val)</div>
                      <div>+ transferred(from, to, val)</div>
                    </div>
                  </div>
                </div>

                {/* Additional Supporting Contracts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-[#0a0a0f] border border-white/5 rounded-xl space-y-1">
                    <strong className="text-white text-[11px] font-mono block">ITrustedIssuersRegistry</strong>
                    <p className="text-[10px] text-white/60">
                      Holds the list of trusted claim issuer contracts (KYC entities, national identity authorities) permitted to sign claims for investors.
                    </p>
                  </div>
                  <div className="p-3 bg-[#0a0a0f] border border-white/5 rounded-xl space-y-1">
                    <strong className="text-white text-[11px] font-mono block">IClaimTopicsRegistry</strong>
                    <p className="text-[10px] text-white/60">
                      Defines the mandatory claim topics required by the security token (e.g. Topic 1: Standard KYC/AML, Topic 7: Accredited Investor, Topic 12: Reg D).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENT AGGREGATIONS MATRIX */}
          {activeTab === 'PAYMENT' && (
            <div className="space-y-5">
              <div className="bg-[#050508] border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                    Multi-Rail Payment Aggregations Matrix & Routing Engine
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Real-Time Collateral Conversion</span>
                </div>

                {/* Rails comparison table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-white/70 uppercase text-[9px] bg-white/[0.02]">
                        <th className="py-2.5 px-3">Payment Method</th>
                        <th className="py-2.5 px-3">Type / Network</th>
                        <th className="py-2.5 px-3">Settlement Speed</th>
                        <th className="py-2.5 px-3">Escrow Processing</th>
                        <th className="py-2.5 px-3">DvP Token Minting</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      <tr className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-bold text-indigo-300">Base L2 USDC</td>
                        <td className="py-2.5 px-3">Stablecoin (Ethereum Layer 2)</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">&lt; 2 Seconds</td>
                        <td className="py-2.5 px-3">Smart Contract Escrow</td>
                        <td className="py-2.5 px-3 text-emerald-400">Atomic On-Chain</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-bold text-indigo-300">Ethereum USDT</td>
                        <td className="py-2.5 px-3">ERC-20 Stablecoin</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">~12 Seconds</td>
                        <td className="py-2.5 px-3">Smart Contract Escrow</td>
                        <td className="py-2.5 px-3 text-emerald-400">Atomic On-Chain</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-bold text-indigo-300">Plaid ACH Transfer</td>
                        <td className="py-2.5 px-3">Fiat Bank Integration</td>
                        <td className="py-2.5 px-3 text-amber-400 font-bold">Instant Credit / T+1</td>
                        <td className="py-2.5 px-3">Fiduciary Clearing Account</td>
                        <td className="py-2.5 px-3 text-cyan-400">Escrow Mint Trigger</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-bold text-indigo-300">Debit / Credit Card</td>
                        <td className="py-2.5 px-3">Stripe Gateway (Visa/MC)</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">Instant (Real-time)</td>
                        <td className="py-2.5 px-3">Merchant Escrow Pool</td>
                        <td className="py-2.5 px-3 text-cyan-400">Immediate Post-Auth</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-bold text-indigo-300">SEPA Instant / FedNow</td>
                        <td className="py-2.5 px-3">Central Bank Rails (EUR/USD)</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">&lt; 10 Seconds</td>
                        <td className="py-2.5 px-3">Central Bank Wire Clearing</td>
                        <td className="py-2.5 px-3 text-emerald-400">Instant Release</td>
                      </tr>
                      <tr className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-bold text-indigo-300">Bitcoin (BTC)</td>
                        <td className="py-2.5 px-3">Native SegWit / Lightning</td>
                        <td className="py-2.5 px-3 text-amber-400 font-bold">Instant (LN) / 10m</td>
                        <td className="py-2.5 px-3">Multi-Sig Cold Storage Vault</td>
                        <td className="py-2.5 px-3 text-cyan-400">Oracle Validation Mint</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Aggregator Core Mechanism */}
                <div className="p-4 bg-black/60 rounded-xl border border-white/5 space-y-2 text-[10.5px] text-white/70">
                  <strong className="text-white block font-mono">How Payment Aggregation Guarantees 1:1 Share Backing:</strong>
                  <p>
                    Regardless of whether payment originates from fiat bank ACH, credit card, or Layer-2 stablecoins, the <strong>Payment Aggregation Router</strong> normalizes incoming funds into fiduciary cash or digital collateral. The <strong>DvP Engine</strong> simultaneously purchases or allocates the exact matching equity share at the regulated broker-custodian before calling the ERC-3643 contract to issue the token to the investor's verified wallet.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a0a0f] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-white/50 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ERC-3643 (T-REX) Standard · Regulated RWA Tokenization Specification</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Close Architecture View
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
