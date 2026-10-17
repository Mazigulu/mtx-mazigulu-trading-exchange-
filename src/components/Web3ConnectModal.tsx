import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  ArrowRight, 
  Layers, 
  Database,
  Lock,
  Zap,
  Globe,
  Wallet
} from 'lucide-react';
import {
  detectWeb3Providers,
  connectWeb3Wallet,
  generateAuthMessage,
  signWeb3AuthChallenge,
  syncWeb3LoginToBackend,
  formatAddress,
  Web3UserProfile,
  saveWeb3Profile,
  Web3ProviderInfo
} from '../utils/web3Wallet';

interface Web3ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (addressOrEmail: string, demoCapital?: number, profile?: Web3UserProfile) => void;
}

type ConnectStep = 'provider' | 'sign' | 'profile' | 'ready';

export default function Web3ConnectModal({
  isOpen,
  onClose,
  onSuccess
}: Web3ConnectModalProps) {
  const [step, setStep] = useState<ConnectStep>('provider');
  const [selectedProvider, setSelectedProvider] = useState<'injected' | 'metamask' | 'coinbase' | 'sandbox'>('metamask');
  const [providersList, setProvidersList] = useState<Web3ProviderInfo[]>([]);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [chainId, setChainId] = useState<string>('1');
  const [networkName, setNetworkName] = useState<string>('Ethereum Mainnet');
  const [providerDisplayName, setProviderDisplayName] = useState<'MetaMask' | 'Coinbase' | 'Injected' | 'Hardware Sandbox'>('MetaMask');
  
  const [challengeNonce, setChallengeNonce] = useState<string>('');
  const [challengeMessage, setChallengeMessage] = useState<string>('');
  const [signatureHash, setSignatureHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile configuration state
  const [traderName, setTraderName] = useState<string>('');
  const [traderRole, setTraderRole] = useState<string>('Quantitative Trader');
  const [demoCapital, setDemoCapital] = useState<number>(100000);
  const [traderEmail, setTraderEmail] = useState<string>('');

  // Auto detect provider on modal open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      const list = detectWeb3Providers();
      setProvidersList(list);
      const hasMetaMask = list.find(p => p.id === 'metamask' && p.isAvailable);
      if (hasMetaMask) {
        setSelectedProvider('metamask');
      } else {
        setSelectedProvider('sandbox');
      }
    } else {
      setStep('provider');
      setIsLoading(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Step 1: Connect to Provider
  const handleConnectProvider = async (providerType: 'injected' | 'metamask' | 'coinbase' | 'sandbox') => {
    setSelectedProvider(providerType);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const conn = await connectWeb3Wallet(providerType);
      const address = conn.address.toLowerCase();
      setWalletAddress(address);
      setChainId(conn.chainId);
      setNetworkName(conn.networkName);
      setProviderDisplayName(conn.providerName);
      setTraderName(`Trader ${address.slice(0, 6).toUpperCase()}`);

      // Request fresh nonce from backend
      let nonceVal = Math.random().toString(36).substring(2, 15);
      try {
        const nonceRes = await fetch('/api/auth/web3-nonce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });
        if (nonceRes.ok) {
          const data = await nonceRes.json();
          if (data.nonce) nonceVal = data.nonce;
        }
      } catch (nErr) {
        console.warn('Nonce fetch fallback:', nErr);
      }
      setChallengeNonce(nonceVal);

      // Generate EIP-4361 SIWE formatted challenge
      const { message } = generateAuthMessage(address, nonceVal, conn.chainId);
      setChallengeMessage(message);

      setStep('sign');
    } catch (err: any) {
      console.error('Provider connect error:', err);
      setErrorMsg(err?.message || 'Failed to establish connection to Web3 node.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Sign Challenge
  const handleSignChallenge = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { signature } = await signWeb3AuthChallenge(walletAddress, challengeMessage, selectedProvider);
      setSignatureHash(signature);
      setStep('profile');
    } catch (err: any) {
      console.error('Signing error:', err);
      setErrorMsg(err?.message || 'Cryptographic signature was rejected.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Complete Profile & Authenticate
  const handleFinalizeProfile = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const finalProfile: Web3UserProfile = {
        address: walletAddress,
        name: traderName.trim() || `Trader ${walletAddress.slice(0, 6).toUpperCase()}`,
        handle: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}.mtx`,
        role: traderRole,
        email: traderEmail.trim(),
        avatarColor: 'indigo',
        chainId: chainId,
        demoCapital: demoCapital,
        networkName: networkName,
        walletProvider: providerDisplayName,
        signatureHash,
        signedMessage: challengeMessage,
        nonce: challengeNonce,
        createdAt: new Date().toISOString(),
        isVerified: true
      };

      // Provision profile and auth on backend
      try {
        const res = await syncWeb3LoginToBackend(finalProfile);
        if (res.token) {
          localStorage.setItem('apex_web3_token', res.token);
        }
      } catch (bErr) {
        console.warn('Backend Web3 sync fallback:', bErr);
      }

      try {
        saveWeb3Profile(finalProfile);
        localStorage.setItem('apex_trader_wallet', walletAddress);
        localStorage.setItem('apex_trader_name', finalProfile.name);
        localStorage.setItem('apex_user_email', walletAddress);
      } catch {}

      setStep('ready');
    } catch (err: any) {
      console.error('Finalize profile error:', err);
      setErrorMsg(err?.message || 'Failed to initialize terminal ledger profile.');
    } finally {
      setIsLoading(false);
    }
  };

  // Launch terminal workspace
  const handleEnterTerminal = () => {
    const finalProfile: Web3UserProfile = {
      address: walletAddress,
      name: traderName.trim() || `Trader ${walletAddress.slice(0, 6).toUpperCase()}`,
      handle: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}.mtx`,
      role: traderRole,
      email: traderEmail.trim(),
      avatarColor: 'indigo',
      chainId: chainId,
      demoCapital: demoCapital,
      networkName: networkName,
      walletProvider: providerDisplayName,
      signatureHash,
      signedMessage: challengeMessage,
      nonce: challengeNonce,
      createdAt: new Date().toISOString(),
      isVerified: true
    };
    onSuccess(walletAddress, demoCapital, finalProfile);
    onClose();
  };

  return (
    <div 
      id="web3-terminal-dialog-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
    >
      <div 
        className="fixed inset-0 z-[-1]" 
        onClick={onClose}
      />

      <motion.div
        id="web3-terminal-dialog"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative w-full max-w-xl bg-[#060609] border border-white/10 rounded shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden font-mono text-white flex flex-col my-auto"
      >
        {/* Terminal Accent Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500" />

        {/* Terminal Header Bar */}
        <div className="px-4 py-3 bg-[#08080c] border-b border-white/10 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-white">
              MTX // WEB3 NODE GATEWAY
            </span>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase">
              EIP-1193 / SIWE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[8.5px] text-white/40 hidden sm:inline">
              SEC.15c3 // AUDITED
            </span>
            <button
              type="button"
              id="web3-dialog-close-btn"
              onClick={onClose}
              className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer"
              title="Close (ESC)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Step Progress Matrix */}
        <div className="grid grid-cols-4 border-b border-white/10 bg-[#09090e] text-[8.5px] uppercase font-bold tracking-wider select-none divide-x divide-white/5">
          <div className={`px-2.5 py-2 flex items-center gap-1.5 transition-colors ${step === 'provider' ? 'text-indigo-400 bg-indigo-500/10' : (step !== 'provider' ? 'text-emerald-400' : 'text-white/30')}`}>
            <span>01</span>
            <span className="truncate">Node</span>
            {step !== 'provider' && <Check className="w-2.5 h-2.5 ml-auto text-emerald-400" />}
          </div>
          <div className={`px-2.5 py-2 flex items-center gap-1.5 transition-colors ${step === 'sign' ? 'text-indigo-400 bg-indigo-500/10' : (['profile', 'ready'].includes(step) ? 'text-emerald-400' : 'text-white/30')}`}>
            <span>02</span>
            <span className="truncate">SIWE Sign</span>
            {['profile', 'ready'].includes(step) && <Check className="w-2.5 h-2.5 ml-auto text-emerald-400" />}
          </div>
          <div className={`px-2.5 py-2 flex items-center gap-1.5 transition-colors ${step === 'profile' ? 'text-indigo-400 bg-indigo-500/10' : (step === 'ready' ? 'text-emerald-400' : 'text-white/30')}`}>
            <span>03</span>
            <span className="truncate">Profile</span>
            {step === 'ready' && <Check className="w-2.5 h-2.5 ml-auto text-emerald-400" />}
          </div>
          <div className={`px-2.5 py-2 flex items-center gap-1.5 transition-colors ${step === 'ready' ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/30'}`}>
            <span>04</span>
            <span className="truncate">Cleared</span>
          </div>
        </div>

        {/* Error Notification Strip */}
        {errorMsg && (
          <div className="px-4 py-2.5 bg-rose-950/40 border-b border-rose-500/30 text-rose-300 text-[9.5px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="leading-tight">{errorMsg}</span>
            </div>
            {errorMsg.toLowerCase().includes('metamask') && (
              <button
                type="button"
                onClick={() => handleConnectProvider('sandbox')}
                className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded text-[8.5px] font-bold uppercase tracking-wider shrink-0 cursor-pointer transition-colors"
              >
                Use Hardware Sandbox
              </button>
            )}
          </div>
        )}

        {/* Terminal Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* STEP 1: Provider Selection */}
          {step === 'provider' && (
            <div className="space-y-3">
              <div className="border-b border-white/5 pb-2.5">
                <span className="text-[9px] uppercase font-bold text-indigo-400 block tracking-widest">
                  SYS.CALL // NODE_HANDSHAKE
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mt-0.5">
                  Select Decentralized EVM Signer
                </h3>
                <p className="text-[9px] text-white/50 leading-relaxed mt-1">
                  Connect your non-custodial hardware or browser extension node to access institutional clearing.
                </p>
              </div>

              {/* Provider Rows Table */}
              <div className="border border-white/10 rounded bg-[#09090e] divide-y divide-white/5">
                {/* MetaMask Row */}
                <div 
                  onClick={() => handleConnectProvider('metamask')}
                  className="px-3.5 py-2.5 hover:bg-white/[0.03] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 13.06l-2.02-3.8-3.92-2-1.95-6.26-2.11 3.52 4.14 1.74-1.12 3.61s-2.03-1.01-3.02-1.02c-1 0-3.03 1.02-3.03 1.02l-1.12-3.61 4.14-1.74-2.11-3.52-1.95 6.26-3.92 2L2 13.06l8.03 2.15 1.97 4.79 1.97-4.79L22 13.06z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">MetaMask Browser Node</span>
                        {providersList.find(p => p.id === 'metamask')?.isAvailable && (
                          <span className="text-[7.5px] font-bold px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ● DETECTED
                          </span>
                        )}
                      </div>
                      <span className="text-[8px] text-white/40 block">EIP-1193 Direct Browser Extension Ingestion</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-white/5 group-hover:bg-indigo-600 group-hover:text-white border border-white/10 group-hover:border-indigo-500 rounded text-[8.5px] font-bold uppercase tracking-wider transition-all"
                  >
                    Connect Node
                  </button>
                </div>

                {/* Coinbase Wallet Row */}
                <div 
                  onClick={() => handleConnectProvider('coinbase')}
                  className="px-3.5 py-2.5 hover:bg-white/[0.03] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-[10px]">
                      C
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Coinbase Smart Wallet</span>
                      <span className="text-[8px] text-white/40 block">Institutional EVM Passkey & Seedless Gateway</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-white/5 group-hover:bg-indigo-600 group-hover:text-white border border-white/10 group-hover:border-indigo-500 rounded text-[8.5px] font-bold uppercase tracking-wider transition-all"
                  >
                    Connect Node
                  </button>
                </div>

                {/* Generic Injected Provider */}
                <div 
                  onClick={() => handleConnectProvider('injected')}
                  className="px-3.5 py-2.5 hover:bg-white/[0.03] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Standard Injected Provider</span>
                      <span className="text-[8px] text-white/40 block">Rainbow, Brave, Rabby, or Native Node</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-white/5 group-hover:bg-indigo-600 group-hover:text-white border border-white/10 group-hover:border-indigo-500 rounded text-[8.5px] font-bold uppercase tracking-wider transition-all"
                  >
                    Connect Node
                  </button>
                </div>

                {/* Sandbox Enclave Fallback */}
                <div 
                  onClick={() => handleConnectProvider('sandbox')}
                  className="px-3.5 py-2.5 hover:bg-white/[0.03] transition-colors flex items-center justify-between cursor-pointer group bg-neutral-950/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Simulated Hardware Enclave</span>
                        <span className="text-[7.5px] font-bold px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          ZERO-EXTENSION
                        </span>
                      </div>
                      <span className="text-[8px] text-white/40 block">Sandbox Node for Development & Browser Testing</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-white/5 group-hover:bg-emerald-600 group-hover:text-white border border-white/10 group-hover:border-emerald-500 rounded text-[8.5px] font-bold uppercase tracking-wider transition-all"
                  >
                    Launch Enclave
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SIWE Challenge Signing */}
          {step === 'sign' && (
            <div className="space-y-3">
              <div className="border-b border-white/5 pb-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-widest">
                    SYS.CHALLENGE // EIP-4361_SIWE
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mt-0.5">
                    Sign Cryptographic Challenge
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-white/40 uppercase block">TARGET ADDRESS</span>
                  <span className="text-[9px] text-indigo-300 font-bold tracking-wider">{formatAddress(walletAddress)}</span>
                </div>
              </div>

              {/* SIWE Message Terminal Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[8px] text-white/40 uppercase tracking-wider">
                  <span>RAW PAYLOAD TO SIGN</span>
                  <span>METHOD: PERSONAL_SIGN</span>
                </div>
                <div className="bg-black border border-white/10 rounded p-3 text-[9px] font-mono text-emerald-400/90 leading-relaxed overflow-x-auto max-h-36 thin-scrollbar whitespace-pre-wrap select-all">
                  {challengeMessage}
                </div>
              </div>

              {/* Technical Nonce Footnote */}
              <div className="p-2 bg-white/[0.02] border border-white/5 rounded flex items-center justify-between text-[8.5px] text-white/50">
                <span>NONCE: <strong className="text-white font-mono">{challengeNonce}</strong></span>
                <span>TTL: <strong className="text-emerald-400 font-mono">300s</strong></span>
                <span>CHAIN ID: <strong className="text-white font-mono">{chainId} (EVM)</strong></span>
              </div>

              {/* Sign Action Button */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('provider')}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  id="web3-execute-signature-btn"
                  disabled={isLoading}
                  onClick={handleSignChallenge}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 rounded text-[9.5px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Awaiting Signature in Wallet...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Sign Challenge via EIP-1193</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Configure Trader Profile */}
          {step === 'profile' && (
            <div className="space-y-3">
              <div className="border-b border-white/5 pb-2.5">
                <span className="text-[9px] uppercase font-bold text-indigo-400 block tracking-widest">
                  SYS.LEDGER // IDENTITY_PROVISION
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mt-0.5">
                  Institutional Profile Setup
                </h3>
                <p className="text-[9px] text-white/50 leading-relaxed mt-0.5">
                  Configure your desk identity to be bonded with your public key in the terminal ledger.
                </p>
              </div>

              {/* Form Grid */}
              <div className="space-y-2.5">
                {/* Public Key Display (Read-Only) */}
                <div>
                  <label className="text-[8.5px] uppercase font-bold text-white/40 block mb-1">
                    Bonded Public Key Address
                  </label>
                  <div className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-[9.5px] text-white/80 font-mono flex items-center justify-between">
                    <span className="truncate">{walletAddress}</span>
                    <span className="text-[7.5px] font-bold text-emerald-400 px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 ml-2 shrink-0">
                      SIGNED
                    </span>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="text-[8.5px] uppercase font-bold text-white/40 block mb-1">
                    Trader Handle / Display Name
                  </label>
                  <input
                    type="text"
                    id="web3-profile-name-input"
                    value={traderName}
                    onChange={(e) => setTraderName(e.target.value)}
                    placeholder="e.g. Satoshi Desk"
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-[10px] text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Desk Role */}
                <div>
                  <label className="text-[8.5px] uppercase font-bold text-white/40 block mb-1">
                    Quantitative Desk Role
                  </label>
                  <select
                    value={traderRole}
                    onChange={(e) => setTraderRole(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="Quantitative Trader">Quantitative Trader</option>
                    <option value="Lead Desk Analyst">Lead Desk Analyst</option>
                    <option value="Systematic Portfolio Manager">Systematic Portfolio Manager</option>
                    <option value="Macro Prop Allocator">Macro Prop Allocator</option>
                    <option value="Risk & Margining Officer">Risk & Margining Officer</option>
                  </select>
                </div>

                {/* Demo Capital Tier */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[8.5px] uppercase font-bold text-white/40">
                      Simulated Paper Trading Allocation
                    </label>
                    <span className="text-[9px] font-bold text-emerald-400 font-mono">
                      ${demoCapital.toLocaleString()} USD
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[50000, 100000, 250000, 500000].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setDemoCapital(cap)}
                        className={`py-1.5 px-2 rounded border text-[8.5px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${demoCapital === cap ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-black border-white/10 text-white/60 hover:text-white hover:bg-white/5'}`}
                      >
                        ${cap >= 1000000 ? `${cap / 1000000}M` : `${cap / 1000}k`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Complete Action Button */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('sign')}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  id="web3-save-profile-btn"
                  disabled={isLoading}
                  onClick={handleFinalizeProfile}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-black border border-emerald-400/40 rounded text-[9.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisioning Profile...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Save Profile & Authorize Session</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Terminal Clearance Confirmed */}
          {step === 'ready' && (
            <div className="space-y-3 text-center py-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-widest">
                  CLEARANCE GRANTED // STATUS: 200 OK
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-0.5">
                  Web3 Terminal Session Established
                </h3>
                <p className="text-[9px] text-white/50 leading-relaxed mt-1 max-w-sm mx-auto">
                  Your cryptographic SIWE verification was verified. Institutional clearing telemetry and demo portfolios have been provisioned.
                </p>
              </div>

              {/* Telemetry Summary Card */}
              <div className="border border-white/10 rounded bg-[#09090e] p-3 text-left space-y-1.5 text-[8.5px] font-mono">
                <div className="flex justify-between">
                  <span className="text-white/40">NODE ADDRESS:</span>
                  <span className="text-white font-bold">{formatAddress(walletAddress)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">TRADER IDENTITY:</span>
                  <span className="text-indigo-300 font-bold">{traderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">DESK ROLE:</span>
                  <span className="text-white">{traderRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">INITIAL ALLOCATION:</span>
                  <span className="text-emerald-400 font-bold">${demoCapital.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/5">
                  <span className="text-white/40">SIGNATURE PROOF:</span>
                  <span className="text-white/60 truncate max-w-[220px]">{signatureHash.slice(0, 20)}...</span>
                </div>
              </div>

              {/* Launch Button */}
              <div className="pt-2">
                <button
                  type="button"
                  id="web3-launch-terminal-btn"
                  onClick={handleEnterTerminal}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black border border-indigo-400/40 rounded text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]"
                >
                  <span>Launch Quantitative Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Terminal Bottom Audit Footer */}
        <div className="px-4 py-2 bg-[#08080c] border-t border-white/10 flex items-center justify-between text-[8px] text-white/30 select-none">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SESSION RUNTIME: TLS 1.3 // SEC SEGREGATED ESCROW</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:text-white transition-colors cursor-pointer uppercase"
          >
            [ ESC // ABORT ]
          </button>
        </div>
      </motion.div>
    </div>
  );
}
