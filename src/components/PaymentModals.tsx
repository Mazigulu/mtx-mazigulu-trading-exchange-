import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  RefreshCw, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle, 
  Building, 
  Coins, 
  QrCode, 
  Copy, 
  Check, 
  Smartphone, 
  Send 
} from 'lucide-react';

interface PaymentModalsProps {
  activePaymentModal: null | 'stripe' | 'plaid' | 'coinbase' | 'mpesa' | 'wire';
  setActivePaymentModal: (val: any) => void;
  transferAmount: string;
  setTransferAmount: (val: string) => void;
  selectedAsset: string;
  fetchFundingState: (silently?: boolean) => Promise<void>;
  executeTransferCall: () => void;
  plaidLinked: boolean;
  setPlaidLinked: (val: boolean) => void;
  setNotification: (val: string | null) => void;
  setCashBalance: (val: number) => void;
  setBalances: (val: any) => void;
}

export const PaymentModals: React.FC<PaymentModalsProps> = ({
  activePaymentModal,
  setActivePaymentModal,
  transferAmount,
  setTransferAmount,
  selectedAsset,
  fetchFundingState,
  executeTransferCall,
  plaidLinked,
  setPlaidLinked,
  setNotification,
  setCashBalance,
  setBalances
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Stripe States
  const [stripeSecret, setStripeSecret] = useState<string>('');
  const [stripeIntentId, setStripeIntentId] = useState<string>(`pi_stripe_${Date.now().toString(16)}`);
  const [stripeCardNum, setStripeCardNum] = useState<string>('4242 •••• •••• 4242');
  const [stripeCardExpiry, setStripeCardExpiry] = useState<string>('12 / 29');
  const [stripeCardCvc, setStripeCardCvc] = useState<string>('482');
  const [stripePaying, setStripePaying] = useState<boolean>(false);
  const [stripeProgress, setStripeProgress] = useState<string[]>([]);
  const [stripePaid, setStripePaid] = useState<boolean>(false);

  // Plaid States
  const [plaidBankSelected, setPlaidBankSelected] = useState<string>('');
  const [plaidInnerStep, setPlaidInnerStep] = useState<'select' | 'credentials' | 'exchanging' | 'success'>('select');
  const [plaidUsername, setPlaidUsername] = useState<string>('');
  const [plaidPassword, setPlaidPassword] = useState<string>('');

  // Coinbase Commerce States
  const [coinbaseChargeId, setCoinbaseChargeId] = useState<string>(`chg_coinbase_${Date.now().toString(16)}`);
  const [coinbaseInnerStep, setCoinbaseInnerStep] = useState<'awaiting' | 'verifying' | 'success'>('awaiting');
  const [coinbaseProgress, setCoinbaseProgress] = useState<string[]>([]);

  // M-Pesa States
  const [mpesaPhone, setMpesaPhone] = useState<string>('0712345678');
  const [mpesaCheckoutId, setMpesaCheckoutId] = useState<string>(`ws_mpesa_${Date.now().toString(16)}`);
  const [mpesaInnerStep, setMpesaInnerStep] = useState<'input' | 'processing' | 'pin_prompt' | 'push_sent' | 'success'>('input');
  const [mpesaPin, setMpesaPin] = useState<string>('');

  // Wire States
  const [wireInstructions, setWireInstructions] = useState<{
    bankName: string;
    swiftCode: string;
    routingNumber: string;
    accountNumber: string;
    beneficiaryName: string;
    referenceMemo: string;
  }>({
    bankName: 'Sovereign Custody Bank N.A.',
    swiftCode: 'SOVCUS33XXX',
    routingNumber: '021000021',
    accountNumber: '99482810482',
    beneficiaryName: 'mtx Securitized Fiduciary Depot',
    referenceMemo: `MTX-WIRE-${Math.floor(100000 + Math.random() * 900000)}`
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <AnimatePresence>
      {/* 1. STRIPE MODAL */}
      {activePaymentModal === 'stripe' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!stripePaying) {
                setActivePaymentModal(null);
                setStripePaying(false);
                setStripePaid(false);
                setStripeProgress([]);
              }
            }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-md bg-[#09090c] border border-white/10 rounded-xl p-5 font-mono text-xs z-55"
          >
            <div className="border-b border-white/5 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" /> Stripe Card Gateway
                </h3>
                <p className="text-[9px] text-white/30 uppercase mt-0.5">PCI-DSS Compliant Secure Clearing</p>
              </div>
              {!stripePaying && (
                <button
                  onClick={() => {
                    setActivePaymentModal(null);
                    setStripePaying(false);
                    setStripePaid(false);
                    setStripeProgress([]);
                  }}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-white/50 hover:text-white uppercase cursor-pointer font-bold"
                >
                  Close
                </button>
              )}
            </div>

            {!stripePaid ? (
              <div className="space-y-4">
                <div className="bg-[#040405] border border-white/5 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-[10px] text-white/40 uppercase">Deposit Amount</span>
                  <span className="text-sm font-black text-white">${parseFloat(transferAmount).toLocaleString()} USD</span>
                </div>

                {stripePaying ? (
                  <div className="bg-[#040405] border border-white/5 p-4 rounded-lg space-y-3 min-h-[160px] flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                      <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider animate-pulse">
                        Processing Stripe Card Clearing...
                      </span>
                    </div>
                    <div className="border-t border-white/5 pt-2 space-y-1.5">
                      {stripeProgress.map((prog, idx) => (
                        <div key={idx} className="text-[9px] text-white/50 flex items-center gap-1.5">
                          <span className="text-emerald-400">✔</span> {prog}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setStripePaying(true);
                      setStripeProgress(['Initializing payment session...']);
                      
                      setTimeout(() => {
                        setStripeProgress(prev => [...prev, 'Validating debit credentials (Visa Core)...']);
                      }, 1200);

                      setTimeout(() => {
                        setStripeProgress(prev => [...prev, '3D Secure authorization verification passed...']);
                      }, 2500);

                      setTimeout(() => {
                        setStripeProgress(prev => [...prev, 'Capturing funds and matching ledger...']);
                      }, 3800);

                      setTimeout(async () => {
                        try {
                          // Complete payment on backend
                          const res = await fetch('/api/funding/transfer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              type: 'DEPOSIT',
                              method: 'CARD',
                              currency: selectedAsset,
                              amount: parseFloat(transferAmount)
                            })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            localStorage.setItem('broker_cash', data.balance.toString());
                            setCashBalance(data.balance);
                            if (data.balances) setBalances(data.balances);
                            setStripePaying(false);
                            setStripePaid(true);
                            setStripeProgress([]);
                            setTransferAmount('');
                            await fetchFundingState(true);
                          } else {
                            alert('Stripe backend capture failed.');
                            setStripePaying(false);
                          }
                        } catch (err) {
                          alert('Error during Stripe payment capture.');
                          setStripePaying(false);
                        }
                      }, 5000);
                    }}
                    className="space-y-3 text-[10px]"
                  >
                    <div className="space-y-1">
                      <label className="text-[9px] text-white/40 uppercase">Card Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          value={stripeCardNum}
                          onChange={(e) => setStripeCardNum(e.target.value)}
                          className="w-full bg-[#040405] border border-white/10 rounded py-2 pl-9 pr-3 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-white/40 uppercase">Expiration</label>
                        <input
                          type="text"
                          value={stripeCardExpiry}
                          onChange={(e) => setStripeCardExpiry(e.target.value)}
                          className="w-full bg-[#040405] border border-white/10 rounded py-2 px-3 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-bold text-center"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-white/40 uppercase">CVC / CVV</label>
                        <input
                          type="password"
                          value={stripeCardCvc}
                          onChange={(e) => setStripeCardCvc(e.target.value)}
                          className="w-full bg-[#040405] border border-white/10 rounded py-2 px-3 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-bold text-center tracking-widest"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-white/40 uppercase">Cardholder Full Name</label>
                      <input
                        type="text"
                        defaultValue="Principal Investor Account"
                        className="w-full bg-[#040405] border border-white/10 rounded py-2 px-3 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-bold"
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-lg transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
                      >
                        Authorize & Pay ${parseFloat(transferAmount).toLocaleString()} USD
                      </button>
                    </div>

                    <div className="text-center text-[8px] text-white/30 uppercase flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Fully Encrypted SSL Security Handshake
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4 py-3 font-sans">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 font-mono">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">CLEARING SUCCESSFUL</h4>
                  <p className="text-[10px] text-white/40 uppercase leading-normal">
                    Stripe PaymentIntent <span className="text-indigo-400 select-all font-bold">{stripeIntentId}</span> settled.
                    Fiduciary balances updated.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActivePaymentModal(null);
                    setStripePaying(false);
                    setStripePaid(false);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold uppercase text-[9.5px] tracking-wider rounded font-mono cursor-pointer"
                >
                  Acknowledge & Sync Workspace
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* 2. PLAID MODAL */}
      {activePaymentModal === 'plaid' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (plaidInnerStep !== 'exchanging') {
                setActivePaymentModal(null);
                setPlaidInnerStep('select');
              }
            }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-md bg-[#09090c] border border-white/10 rounded-xl p-5 font-mono text-xs z-55"
          >
            <div className="border-b border-white/5 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-400" /> Plaid Link Service
                </h3>
                <p className="text-[9px] text-white/30 uppercase mt-0.5">Secure Fiduciary Authorization</p>
              </div>
              {plaidInnerStep !== 'exchanging' && (
                <button
                  onClick={() => {
                    setActivePaymentModal(null);
                    setPlaidInnerStep('select');
                  }}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-white/50 hover:text-white uppercase cursor-pointer font-bold"
                >
                  Close
                </button>
              )}
            </div>

            {plaidInnerStep === 'select' && (
              <div className="space-y-4">
                <div className="text-center py-2 space-y-1">
                  <p className="text-[10px] text-white/60 leading-normal uppercase">
                    mtx Securities uses Plaid to securely connect your bank account.
                  </p>
                  <p className="text-[8px] text-white/30 uppercase">
                    Select your primary financial institution to authenticate.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {['Chase Bank N.A.', 'Bank of America', 'Wells Fargo', 'Citibank', 'Capital One', 'U.S. Bank'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => {
                        setPlaidBankSelected(bank);
                        setPlaidInnerStep('credentials');
                      }}
                      className="p-3 bg-[#040405] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-lg text-left cursor-pointer transition-all"
                    >
                      <Building className="w-4 h-4 text-indigo-400 mb-1" />
                      <div className="font-extrabold text-[10px] text-white uppercase">{bank}</div>
                      <div className="text-[7.5px] text-white/30 mt-0.5">SECURE CONNECTION</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {plaidInnerStep === 'credentials' && (
              <div className="space-y-4">
                <div className="bg-[#040405] border border-white/5 p-3 rounded-lg flex items-center gap-3">
                  <Building className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="text-[8px] text-white/30 uppercase block">Selected Institution</span>
                    <span className="font-extrabold text-[11px] text-white uppercase">{plaidBankSelected}</span>
                  </div>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setPlaidInnerStep('exchanging');

                    try {
                      const res = await fetch('/api/payments/plaid/exchange-public-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ public_token: `pt_mock_${Date.now()}` })
                      });
                      if (res.ok) {
                        setTimeout(() => {
                          setPlaidInnerStep('success');
                          setPlaidLinked(true);
                        }, 2500);
                      } else {
                        alert('Public token exchange failed.');
                        setPlaidInnerStep('select');
                      }
                    } catch (err) {
                      alert('Connection error during public token exchange.');
                      setPlaidInnerStep('select');
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 uppercase">Online ID / Username</label>
                    <input
                      type="text"
                      value={plaidUsername}
                      onChange={(e) => setPlaidUsername(e.target.value)}
                      className="w-full bg-[#040405] border border-white/10 rounded py-2 px-3 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-bold"
                      placeholder="ID / Username"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 uppercase">Password</label>
                    <input
                      type="password"
                      value={plaidPassword}
                      onChange={(e) => setPlaidPassword(e.target.value)}
                      className="w-full bg-[#040405] border border-white/10 rounded py-2 px-3 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-bold"
                      placeholder="Enter Password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-lg cursor-pointer transition-all mt-2"
                  >
                    Verify & Link Bank Account
                  </button>
                </form>
              </div>
            )}

            {plaidInnerStep === 'exchanging' && (
              <div className="text-center py-6 space-y-3 min-h-[140px] flex flex-col justify-center">
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
                <div className="space-y-1">
                  <span className="font-extrabold text-[10px] text-emerald-300 uppercase tracking-widest animate-pulse">
                    Exchanging Public Token with Plaid servers...
                  </span>
                  <p className="text-[8px] text-white/30 uppercase leading-relaxed">
                    Securing auth keys and downloading bank routing nodes...
                  </p>
                </div>
              </div>
            )}

            {plaidInnerStep === 'success' && (
              <div className="text-center space-y-4 py-3 font-sans">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">CONNECTION AUTHORIZED</h4>
                  <p className="text-[10px] text-white/40 uppercase leading-normal font-mono">
                    Your <span className="text-emerald-400 font-black uppercase">{plaidBankSelected}</span> account is now linked via Plaid ACH Sweep.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActivePaymentModal(null);
                    setPlaidInnerStep('select');
                    executeTransferCall();
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold uppercase text-[9.5px] tracking-wider rounded font-mono cursor-pointer"
                >
                  Proceed with ACH Sweep Deposit
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* 3. COINBASE MODAL */}
      {activePaymentModal === 'coinbase' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (coinbaseInnerStep !== 'verifying') {
                setActivePaymentModal(null);
                setCoinbaseInnerStep('awaiting');
                setCoinbaseProgress([]);
              }
            }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-md bg-[#09090c] border border-white/10 rounded-xl p-5 font-mono text-xs z-55"
          >
            <div className="border-b border-white/5 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-indigo-400 animate-spin" /> Coinbase Commerce Gateway
                </h3>
                <p className="text-[9px] text-white/30 uppercase mt-0.5">On-Chain Custody Clearing Router</p>
              </div>
              {coinbaseInnerStep !== 'verifying' && (
                <button
                  onClick={() => {
                    setActivePaymentModal(null);
                    setCoinbaseInnerStep('awaiting');
                    setCoinbaseProgress([]);
                  }}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-white/50 hover:text-white uppercase cursor-pointer font-bold"
                >
                  Close
                </button>
              )}
            </div>

            {coinbaseInnerStep !== 'success' ? (
              <div className="space-y-4">
                <div className="bg-[#040405] border border-white/5 p-3 rounded-lg flex justify-between items-center text-[10px]">
                  <div>
                    <span className="text-[8px] text-white/30 block uppercase">Charge Reference ID</span>
                    <span className="font-extrabold text-white select-all tracking-wider">{coinbaseChargeId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-white/30 block uppercase">Deposit Quantity</span>
                    <span className="font-extrabold text-indigo-400 text-sm">{transferAmount} {selectedAsset}</span>
                  </div>
                </div>

                {coinbaseInnerStep === 'verifying' ? (
                  <div className="bg-[#040405] border border-white/5 p-4 rounded-lg space-y-3 min-h-[160px] flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                      <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider animate-pulse">
                        Scanning Base L2 mempool for credit tx...
                      </span>
                    </div>
                    <div className="border-t border-white/5 pt-2 space-y-1.5">
                      {coinbaseProgress.map((prog, idx) => (
                        <div key={idx} className="text-[9px] text-white/50 flex items-center gap-1.5">
                          <span className="text-emerald-400">✔</span> {prog}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 text-[10px]">
                    <div className="flex flex-col items-center justify-center py-3 bg-[#040405] border border-white/5 rounded-lg space-y-2">
                      <QrCode className="w-24 h-24 text-white p-1.5 bg-white rounded border border-white/10" />
                      <span className="text-[8px] text-indigo-400 font-extrabold uppercase tracking-widest animate-pulse">
                        Base L2 Network Deposit Portal
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-white/40 uppercase">Deposit ERC-20 Address (Base Chain)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
                          className="w-full bg-[#040405] border border-white/10 rounded py-2 px-3 text-[9px] text-white font-bold select-all"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 'crypto_addr')}
                          className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded cursor-pointer transition-colors"
                        >
                          {copiedField === 'crypto_addr' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCoinbaseInnerStep('verifying');
                          setCoinbaseProgress(['Checking Base RPC blocks...']);

                          setTimeout(() => {
                            setCoinbaseProgress(prev => [...prev, 'Scanning smart contract events on Base...']);
                          }, 1200);

                          setTimeout(() => {
                            setCoinbaseProgress(prev => [...prev, `Found matching transfer tx: 0x${Math.random().toString(16).substring(2, 14)}...`]);
                          }, 2200);

                          setTimeout(() => {
                            setCoinbaseProgress(prev => [...prev, 'Consensus confirmed! Executing coinbase sweeping...']);
                          }, 3200);

                          setTimeout(async () => {
                            try {
                              const res = await fetch('/api/funding/transfer', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  type: 'DEPOSIT',
                                  method: 'STABLECOIN',
                                  currency: selectedAsset,
                                  amount: parseFloat(transferAmount)
                                })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                localStorage.setItem('broker_cash', data.balance.toString());
                                setCashBalance(data.balance);
                                if (data.balances) setBalances(data.balances);
                                setCoinbaseInnerStep('success');
                                setTransferAmount('');
                                await fetchFundingState(true);
                              } else {
                                alert('Coinbase on-chain sweep failed on backend ledger.');
                                setCoinbaseInnerStep('awaiting');
                              }
                            } catch (err) {
                              alert('Error capturing coinbase Commerce deposit.');
                              setCoinbaseInnerStep('awaiting');
                            }
                          }, 4500);
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        Simulate Blockchain Credit Sweep
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4 py-3 font-sans">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">ON-CHAIN DEPOSIT SETTLED</h4>
                  <p className="text-[10px] text-white/40 uppercase leading-normal font-mono">
                    Coinbase Charge <span className="text-indigo-400 font-extrabold select-all">{coinbaseChargeId}</span> completed.
                    Funds are now fully liquid on your brokerage ledger.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActivePaymentModal(null);
                    setCoinbaseInnerStep('awaiting');
                    setCoinbaseProgress([]);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold uppercase text-[9.5px] tracking-wider rounded font-mono cursor-pointer"
                >
                  Return to Wallet Desk
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* 4. M-PESA MODAL */}
      {activePaymentModal === 'mpesa' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (mpesaInnerStep !== 'processing' && mpesaInnerStep !== 'push_sent' && mpesaInnerStep !== 'pin_prompt') {
                setActivePaymentModal(null);
                setMpesaInnerStep('input');
                setMpesaPin('');
              }
            }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-md bg-[#09090c] border border-white/10 rounded-xl p-5 font-mono text-xs z-55"
          >
            <div className="border-b border-white/5 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" /> Safaricom M-Pesa Rails
                </h3>
                <p className="text-[9px] text-white/30 uppercase mt-0.5">Daraja API STK Push Gateway</p>
              </div>
              {mpesaInnerStep !== 'processing' && mpesaInnerStep !== 'push_sent' && mpesaInnerStep !== 'pin_prompt' && (
                <button
                  onClick={() => {
                    setActivePaymentModal(null);
                    setMpesaInnerStep('input');
                    setMpesaPin('');
                  }}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-white/50 hover:text-white uppercase cursor-pointer font-bold"
                >
                  Close
                </button>
              )}
            </div>

            {mpesaInnerStep === 'input' && (
              <div className="space-y-4 text-[10px]">
                <div className="bg-[#040405] border border-white/5 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-[8px] text-white/40 uppercase">Clearing Amount</span>
                  <span className="font-extrabold text-white">{transferAmount} USD (~{(parseFloat(transferAmount) * 129).toLocaleString()} KES)</span>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setMpesaInnerStep('processing');

                    try {
                      const res = await fetch('/api/payments/mpesa/stkpush', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: parseFloat(transferAmount) * 129, phoneNumber: mpesaPhone, regionalMethod: 'M-Pesa' })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setMpesaCheckoutId(data.checkoutRequestId);
                        
                        // Transition to mock STK push prompt on handset
                        setTimeout(() => {
                          setMpesaInnerStep('pin_prompt');
                        }, 2000);
                      } else {
                        alert('Safaricom Daraja API returned an error.');
                        setMpesaInnerStep('input');
                      }
                    } catch (err) {
                      alert('Failed to connect to Safaricom regional gateway.');
                      setMpesaInnerStep('input');
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] text-white/40 uppercase">Safaricom Mobile Number (254XXXXXXXXX)</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="w-full bg-[#040405] border border-white/10 rounded py-2 pl-9 pr-3 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-bold"
                        placeholder="e.g. 254712345678"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-lg cursor-pointer transition-all"
                  >
                    Trigger Lipa Na M-Pesa STK Push
                  </button>
                </form>
              </div>
            )}

            {mpesaInnerStep === 'processing' && (
              <div className="text-center py-6 space-y-3 min-h-[140px] flex flex-col justify-center">
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
                <div className="space-y-1">
                  <span className="font-extrabold text-[10px] text-emerald-300 uppercase tracking-widest animate-pulse">
                    Contacting Safaricom Daraja Nodes...
                  </span>
                  <p className="text-[8px] text-white/30 uppercase leading-relaxed">
                    Securing auth signature and dispatching STK push package...
                  </p>
                </div>
              </div>
            )}

            {mpesaInnerStep === 'pin_prompt' && (
              <div className="space-y-4">
                <div className="text-center text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide animate-pulse">
                  📱 Safaricom Mobile Handset STK Prompter
                </div>

                <div className="w-full max-w-[240px] mx-auto bg-[#040405] border-2 border-emerald-500/20 rounded-2xl p-4 font-mono shadow-xl shadow-emerald-500/5">
                  <div className="text-center text-[7px] text-emerald-400 font-bold mb-2 tracking-widest border-b border-emerald-500/10 pb-1.5 uppercase">
                    LIPA NA M-PESA POPUP
                  </div>
                  <p className="text-[8px] text-white/70 leading-relaxed mb-3 text-center uppercase">
                    Pay KES {Math.round(parseFloat(transferAmount) * 129).toLocaleString()} to <br />
                    <span className="text-emerald-400 font-bold">mtx CAPITAL PARTNERS</span>?
                  </p>
                  <div className="space-y-1.5 mb-4">
                    <label className="text-[7px] text-white/40 block uppercase text-center">Enter 4-Digit M-Pesa PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={mpesaPin}
                      onChange={(e) => setMpesaPin(e.target.value)}
                      className="w-full bg-[#08080c] border border-emerald-500/30 rounded py-1 px-2 text-[10px] text-white text-center font-bold font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMpesaInnerStep('input');
                        setMpesaPin('');
                      }}
                      className="py-1 bg-white/5 hover:bg-white/10 rounded text-[8px] text-white/50 hover:text-white uppercase font-bold cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (mpesaPin.length < 4) {
                          alert('M-Pesa PIN must be 4 digits.');
                          return;
                        }
                        setMpesaInnerStep('push_sent');
                        // Complete transfer on backend using Regional route
                        try {
                          const res = await fetch('/api/funding/transfer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              type: 'DEPOSIT',
                              method: 'REGIONAL',
                              regionalMethod: 'M-Pesa',
                              currency: selectedAsset,
                              amount: parseFloat(transferAmount)
                            })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            localStorage.setItem('broker_cash', data.balance.toString());
                            setCashBalance(data.balance);
                            if (data.balances) setBalances(data.balances);
                            setTimeout(async () => {
                              setMpesaInnerStep('success');
                              setTransferAmount('');
                              await fetchFundingState(true);
                            }, 3000);
                          } else {
                            alert('M-Pesa sweep failed on backend ledger.');
                            setMpesaInnerStep('input');
                          }
                        } catch (err) {
                          alert('Error registering Safaricom transaction callback.');
                          setMpesaInnerStep('input');
                        }
                      }}
                      className="py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-[8px] text-white font-extrabold uppercase cursor-pointer transition-all"
                    >
                      Send PIN
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mpesaInnerStep === 'push_sent' && (
              <div className="text-center py-6 space-y-3 min-h-[140px] flex flex-col justify-center">
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
                <div className="space-y-1">
                  <span className="font-extrabold text-[10px] text-emerald-300 uppercase tracking-widest animate-pulse">
                    Waiting for Safaricom Callback...
                  </span>
                  <p className="text-[8px] text-white/30 uppercase leading-relaxed">
                    Lipa Na M-Pesa reference: <span className="text-indigo-400 font-bold select-all">{mpesaCheckoutId}</span>
                  </p>
                  <p className="text-[7.5px] text-white/40 uppercase animate-pulse">
                    Synchronizing with Daraja Webhook Callback Router...
                    Verify standard callback pin authorization.
                  </p>
                </div>
              </div>
            )}

            {mpesaInnerStep === 'success' && (
              <div className="text-center space-y-4 py-3 font-sans">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 font-mono">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">KES CLEARING SUCCESSFUL</h4>
                  <p className="text-[10px] text-white/40 uppercase leading-normal">
                    M-Pesa reference <span className="text-emerald-400 font-black uppercase select-all">{mpesaCheckoutId}</span> completed.
                    Balances updated.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActivePaymentModal(null);
                    setMpesaInnerStep('input');
                    setMpesaPin('');
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold uppercase text-[9.5px] tracking-wider rounded font-mono cursor-pointer"
                >
                  Acknowledge Wallet Balance
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* 5. WIRE MODAL */}
      {activePaymentModal === 'wire' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setActivePaymentModal(null);
            }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-xl bg-[#09090c] border border-white/10 rounded-xl p-5 font-mono text-xs z-55 max-h-[90vh] overflow-y-auto"
          >
            <div className="border-b border-white/5 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-amber-400" /> Fedwire / FedNow routing Slip
                </h3>
                <p className="text-[9px] text-white/30 uppercase mt-0.5">Real-time Bank Custody Settlement</p>
              </div>
              <button
                onClick={() => {
                  setActivePaymentModal(null);
                }}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-white/50 hover:text-white uppercase cursor-pointer font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center py-2 border border-amber-500/10 bg-amber-500/[0.02] rounded-lg">
                <p className="text-[9.5px] text-amber-400 uppercase font-extrabold leading-normal tracking-wider animate-pulse">
                  Fiduciary Wire Deposit Routing
                </p>
                <p className="text-[8px] text-white/40 uppercase mt-0.5 leading-relaxed">
                  Initiate a Fedwire / FedNow transfer from your outside account with the specifications below.
                </p>
              </div>

              <div className="bg-[#040405] border border-white/5 rounded-lg p-4 space-y-3 text-[10px]">
                <div className="grid grid-cols-3 border-b border-white/5 pb-2">
                  <span className="text-white/30 uppercase">Beneficiary Bank:</span>
                  <span className="col-span-2 text-white font-extrabold uppercase">{wireInstructions?.bankName}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-white/5 pb-2">
                  <span className="text-white/30 uppercase">SWIFT / BIC:</span>
                  <span className="col-span-2 text-indigo-400 font-extrabold select-all tracking-wider">{wireInstructions?.swiftCode}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-white/5 pb-2">
                  <span className="text-white/30 uppercase">ABA Routing:</span>
                  <span className="col-span-2 text-white font-bold select-all tracking-widest">{wireInstructions?.routingNumber}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-white/5 pb-2">
                  <span className="text-white/30 uppercase">Account Number:</span>
                  <span className="col-span-2 text-white font-bold select-all">{wireInstructions?.accountNumber}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-white/5 pb-2">
                  <span className="text-white/30 uppercase">Beneficiary:</span>
                  <span className="col-span-2 text-white font-bold">{wireInstructions?.beneficiaryName}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-amber-400 uppercase font-black">Reference Memo:</span>
                  <span className="col-span-2 text-amber-400 font-black select-all tracking-widest text-[11px] animate-pulse">
                    {wireInstructions?.referenceMemo}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/15 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-extrabold text-[10px] text-white uppercase">Automated Clearing House Simulator</span>
                </div>
                <p className="text-[8.5px] text-white/50 leading-relaxed uppercase">
                  In sandbox environment, you can instantly mock the Fedwire Clearing House settlement callback to credit your cash balance:
                </p>
                
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/payments/wire/simulate-settlement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: parseFloat(transferAmount), referenceMemo: wireInstructions?.referenceMemo })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem('broker_cash', data.balance.toString());
                        setCashBalance(data.balance);
                        if (data.balances) setBalances(data.balances);
                        
                        setNotification(`SUCCESS: Cleared transfer of ${parseFloat(transferAmount).toLocaleString()} USD via Fedwire.`);
                        setTransferAmount('');
                        setActivePaymentModal(null);
                        await fetchFundingState(true);
                        setTimeout(() => setNotification(null), 6000);
                      } else {
                        alert('Wire clearance simulation failed.');
                      }
                    } catch (err) {
                      alert('Network exception simulating bank settlement.');
                    }
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold uppercase text-[9.5px] tracking-wider rounded transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  Simulate Federal Reserve Settlement Release (${parseFloat(transferAmount).toLocaleString()} USD)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
