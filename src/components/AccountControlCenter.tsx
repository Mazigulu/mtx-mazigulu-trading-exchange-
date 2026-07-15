import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Shield, 
  Settings, 
  Volume2, 
  VolumeX, 
  LogOut, 
  FileText, 
  Check,
  Activity,
  Sun,
  Moon,
  Clock,
  Radio,
  AlertTriangle,
  TrendingUp,
  Layers,
  Sparkles,
  Target,
  Flame,
  Power,
  ChevronDown,
  ChevronUp,
  Building,
  CreditCard,
  Lock,
  Smartphone,
  CheckCircle2,
  Upload,
  Plus,
  HelpCircle,
  MessageSquare,
  Globe,
  Database,
  Sliders,
  DollarSign,
  Wallet,
  Phone,
  MapPin,
  Trash2,
  X,
  FileCheck,
  Send,
  Bell,
  Cpu,
  Laptop
} from 'lucide-react';

const menuCategories = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'verification', label: 'Verification (KYC)', icon: FileCheck },
  { id: 'payment', label: 'Bank & Payments', icon: Wallet },
  { id: 'support', label: 'Support Center', icon: HelpCircle },
  { id: 'settings', label: 'General Settings', icon: Settings }
];

interface AccountControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  traderEmail: string;
  sessionSeconds: number;
  brokerPing: number;
  soundAlertsEnabled: boolean;
  onToggleSoundAlerts: () => void;
  onWipeTerminal: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  idleTimeout: string;
  onSetIdleTimeout: (timeout: string) => void;
  volatilityAlertEnabled: boolean;
  onToggleVolatilityAlert: () => void;
  dailyPnLGoal: number;
  onSetDailyPnLGoal: (goal: number) => void;
  dailyPnLAlertEnabled: boolean;
  onToggleDailyPnLAlert: () => void;
  dailyPnLPositiveThreshold: number;
  onSetDailyPnLPositiveThreshold: (val: number) => void;
  dailyPnLNegativeThreshold: number;
  onSetDailyPnLNegativeThreshold: (val: number) => void;
  highlightOrderBlocks: boolean;
  onToggleHighlightOrderBlocks: () => void;
  trendProjectionEnabled: boolean;
  onToggleTrendProjection: () => void;
  isBrokerBridgePaused: boolean;
  onToggleBrokerBridge: () => void;
}

export default function AccountControlCenter({
  isOpen,
  onClose,
  traderEmail,
  sessionSeconds,
  brokerPing,
  soundAlertsEnabled,
  onToggleSoundAlerts,
  onWipeTerminal,
  onLogout,
  theme,
  onToggleTheme,
  idleTimeout,
  onSetIdleTimeout,
  volatilityAlertEnabled,
  onToggleVolatilityAlert,
  dailyPnLGoal,
  onSetDailyPnLGoal,
  dailyPnLAlertEnabled,
  onToggleDailyPnLAlert,
  dailyPnLPositiveThreshold,
  onSetDailyPnLPositiveThreshold,
  dailyPnLNegativeThreshold,
  onSetDailyPnLNegativeThreshold,
  highlightOrderBlocks,
  onToggleHighlightOrderBlocks,
  trendProjectionEnabled,
  onToggleTrendProjection,
  isBrokerBridgePaused,
  onToggleBrokerBridge
}: AccountControlCenterProps) {

  // State to manage the large fullscreen-like workspace modal
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<string>('profile');

  // Interactive local states
  // 1. Profile State
  const [profileName, setProfileName] = useState('Maximilian G. Vance');
  const [profilePhone, setProfilePhone] = useState('+1 (555) 392-1082');
  const [profileCountry, setProfileCountry] = useState('United States');
  const [profileLanguage, setProfileLanguage] = useState('English (US)');
  const [profileTimeZone, setProfileTimeZone] = useState('UTC-5 (EST)');
  const [profilePhotoPreset, setProfilePhotoPreset] = useState<number>(0);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  const avatarPresets = [
    'bg-gradient-to-tr from-indigo-600 to-violet-500',
    'bg-gradient-to-tr from-rose-600 to-pink-500',
    'bg-gradient-to-tr from-emerald-600 to-teal-500',
    'bg-gradient-to-tr from-amber-500 to-orange-400'
  ];

  // 2. Account State
  const [accountType, setAccountType] = useState<'Individual' | 'Joint' | 'Corporate' | 'Trust'>('Corporate');
  const [subPlan, setSubPlan] = useState<'Standard' | 'Pro' | 'Institutional Pro' | 'Apex Clearing'>('Institutional Pro');
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'JPY'>('USD');
  const [buyingPower, setBuyingPower] = useState(1245800);

  // 3. Security State
  const [is2FaEnabled, setIs2FaEnabled] = useState(true);
  const [isPasskeysEnabled, setIsPasskeysEnabled] = useState(false);
  const [passwordOld, setPasswordOld] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  // 4. Verification KYC State
  const [kycStatus, setKycStatus] = useState<'VERIFIED' | 'PENDING' | 'UNVERIFIED'>('VERIFIED');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>('government_id_vance.pdf');
  const [isUploading, setIsUploading] = useState(false);
  const [taxResidency, setTaxResidency] = useState('US-W8BEN');
  const [sourceOfFunds, setSourceOfFunds] = useState('Algorithmic Arbitrage Accumulation');
  const [addressDocName, setAddressDocName] = useState<string | null>('utility_statement_june.pdf');

  // 5. Payment Methods State
  const [linkedBanks, setLinkedBanks] = useState([
    { id: 'bank-1', name: 'J.P. Morgan Chase & Co.', account: '•••• 8820', status: 'Primary Clearing' },
    { id: 'bank-2', name: 'Signature Clearing Bank', account: '•••• 4410', status: 'Secondary Routing' }
  ]);
  const [linkedCards, setLinkedCards] = useState([
    { id: 'card-1', brand: 'Visa Infinite', number: '•••• •••• •••• 1092', expiry: '12/29' }
  ]);
  const [wallets, setWallets] = useState([
    { id: 'wallet-1', type: 'Polygon ERC-20 (USDC/USDT)', address: '0x71C83e3F1082df943A1AA918FF0920' },
    { id: 'wallet-2', type: 'Solana SPL (USDC)', address: 'HN7c639mPq18AA8820ZXVance8203' }
  ]);
  const [mpesaNo, setMpesaNo] = useState('+254 712 345678');
  const [airtelNo, setAirtelNo] = useState('+254 733 987654');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState<'bank' | 'card' | 'wallet'>('bank');
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccount, setNewBankAccount] = useState('');

  // 6. Support Center State
  const [supportSubject, setSupportSubject] = useState('');
  const [supportDesc, setSupportDesc] = useState('');
  const [supportAlert, setSupportAlert] = useState<string | null>(null);
  const [supportTickets, setSupportTickets] = useState<{ id: string; subject: string; status: string; date: string }[]>([
    { id: 'TKT-8802', subject: 'Margin allocation clearance rate latency', status: 'In Review', date: '2026-07-14' },
    { id: 'TKT-4410', subject: 'Polygon wallet gas fee reconciliation', status: 'Completed', date: '2026-07-09' }
  ]);
  const [faqOpenIdx, setFaqOpenIdx] = useState<number | null>(null);

  // Live Chat Simulator States
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'agent'; text: string; time: string }[]>([
    { sender: 'agent', text: 'Welcome to MTX Fiduciary Desk. How can we support your market operations today?', time: '12:21 PM' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 7. Settings State
  const [dateFormat, setDateFormat] = useState<'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'>('YYYY-MM-DD');
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.1);
  const [defaultLotSize, setDefaultLotSize] = useState<number>(1.0);
  const [isFontLarge, setIsFontLarge] = useState(false);
  const [shareAnalytics, setShareAnalytics] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<'private' | 'institutional' | 'public'>('institutional');

  // Trigger scroll to bottom on new chat message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatTyping]);

  // Helpers
  const formatSessionTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 2500);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordNew !== passwordConfirm) {
      setPasswordSuccessMsg('Error: Password confirmation mismatch.');
      return;
    }
    setPasswordSuccessMsg('Passcode rotated successfully via RSA HSM.');
    setPasswordOld('');
    setPasswordNew('');
    setPasswordConfirm('');
    setTimeout(() => setPasswordSuccessMsg(null), 3000);
  };

  const handleFileUploadLocal = (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'address') => {
    if (e.target.files && e.target.files[0]) {
      const fileName = e.target.files[0].name;
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        if (type === 'id') {
          setUploadedFileName(fileName);
        } else {
          setAddressDocName(fileName);
        }
      }, 1200);
    }
  };

  const handleAddPaymentLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPaymentType === 'bank' && newBankName && newBankAccount) {
      setLinkedBanks([
        ...linkedBanks,
        { id: `bank-${Date.now()}`, name: newBankName, account: `•••• ${newBankAccount.slice(-4)}`, status: 'Active Channel' }
      ]);
      setNewBankName('');
      setNewBankAccount('');
    }
    setShowAddPaymentModal(false);
  };

  const handleRemoveBankLocal = (id: string) => {
    setLinkedBanks(linkedBanks.filter(b => b.id !== id));
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportDesc) return;
    const nextId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    setSupportTickets([
      { id: nextId, subject: supportSubject, status: 'Open', date: new Date().toISOString().split('T')[0] },
      ...supportTickets
    ]);
    setSupportSubject('');
    setSupportDesc('');
    setSupportAlert(`Support ticket ${nextId} has been logged in the clearing log.`);
    setTimeout(() => setSupportAlert(null), 3500);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: nowStr }]);
    
    setIsChatTyping(true);
    
    // Auto replies based on keyword triggers
    setTimeout(() => {
      setIsChatTyping(false);
      let reply = 'Operational protocols received. A clearing desk officer is compiling your parameters.';
      const msgLower = userMsg.toLowerCase();
      if (msgLower.includes('deposit') || msgLower.includes('fund') || msgLower.includes('bank')) {
        reply = 'Deposits can be facilitated directly via J.P. Morgan ACH or stablecoins (Polygon USDC/USDT) under the Bank & Payment Methods tab. Credit/debit card transfers clear instantly.';
      } else if (msgLower.includes('withdraw') || msgLower.includes('money')) {
        reply = 'Withdrawals are governed by standard KYC protocols. Click the Withdrawal simulator in Bank & Payments to verify your instant clearing line.';
      } else if (msgLower.includes('latency') || msgLower.includes('ping') || msgLower.includes('websocket')) {
        reply = 'System diagnostics indicate the Core Matching Engine is at 100% capacity with 12ms WebSocket feed heartbeat. Your latency is normal.';
      } else if (msgLower.includes('lever') || msgLower.includes('margin')) {
        reply = 'Corporate accounts enjoy 4.0x dynamic portfolio margin. Please keep margin maintenance requirements above 15% to avoid liquidation triggers.';
      }
      
      setChatMessages(prev => [...prev, { sender: 'agent', text: reply, time: nowStr }]);
    }, 1500);
  };

  // Reusable Switch Component
  const SwitchItem = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-indigo-600' : 'bg-white/5'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4 bg-white' : 'translate-x-0.5 bg-white/40'}`}
        style={{ marginTop: '1px' }}
      />
    </button>
  );

  // Stepper helper
  const StepperItem = ({ 
    value, 
    onIncrement, 
    onDecrement, 
    format 
  }: { 
    value: number; 
    onIncrement: () => void; 
    onDecrement: () => void; 
    format: (v: number) => string 
  }) => (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onDecrement}
        className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center font-bold text-[10px] text-white/50 hover:text-white transition-colors cursor-pointer select-none"
      >
        -
      </button>
      <span className="text-[10px] font-bold text-indigo-300 font-mono w-14 text-center">
        {format(value)}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center font-bold text-[10px] text-white/50 hover:text-white transition-colors cursor-pointer select-none"
      >
        +
      </button>
    </div>
  );

  // Open workspace to a specific tab
  const openWorkspaceTab = (tabId: string) => {
    setActiveWorkspaceTab(tabId);
    setIsWorkspaceOpen(true);
    onClose(); // Close dropdown so the workspace page takes focus nicely
  };

  const activeAvatarStyle = avatarPresets[profilePhotoPreset];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div id="account-control-center-container" className="absolute right-0 top-12 z-[250] animate-fadeIn">
            
            <div 
              className="fixed inset-0 z-[-1] bg-black/30 md:bg-transparent" 
              onClick={onClose}
            />

            {/* STACKED LIST DROPDOWN PANEL (FOR PROFESSIONAL FEEL) */}
            <motion.div
              id="institutional-dropdown-menu"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="w-80 sm:w-84 max-h-[85vh] overflow-y-auto no-scrollbar bg-[#060609]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.9)] divide-y divide-white/5 font-mono text-[10px] text-white flex flex-col"
            >
              {/* Profile Brief Identity Header */}
              <div className="p-3 bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent text-left shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-[12px] text-white border border-white/20 shadow-inner ${activeAvatarStyle}`}>
                    {profileName ? profileName.substring(0, 2).toUpperCase() : 'TR'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-black text-white block tracking-tight truncate">{profileName}</span>
                    <span className="text-[8.5px] text-indigo-300 block font-bold tracking-wider uppercase mt-0.5">{subPlan}</span>
                  </div>
                </div>
              </div>

              {/* VERTICALLY STACKED MENU (AS REQUESTED) */}
              <div className="py-1 flex flex-col shrink-0">
                <button
                  type="button"
                  onClick={() => openWorkspaceTab('profile')}
                  className="px-3 py-2.5 hover:bg-white/[0.03] transition-all flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Profile Information</span>
                      <span className="text-[7.5px] text-white/40 block">Personal info, photo, region, language</span>
                    </div>
                  </div>
                  <div className="text-[8px] text-white/20 group-hover:text-indigo-400 transition-colors uppercase font-bold">Configure</div>
                </button>

                <button
                  type="button"
                  onClick={() => openWorkspaceTab('account')}
                  className="px-3 py-2.5 hover:bg-white/[0.03] transition-all flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-500 transition-all">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Brokerage Account</span>
                      <span className="text-[7.5px] text-white/40 block">Account ID, trading permissions, power</span>
                    </div>
                  </div>
                  <div className="text-[8px] text-white/20 group-hover:text-emerald-400 transition-colors uppercase font-bold">Inspect</div>
                </button>

                <button
                  type="button"
                  onClick={() => openWorkspaceTab('security')}
                  className="px-3 py-2.5 hover:bg-white/[0.03] transition-all flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-500 transition-all">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Security & Access</span>
                      <span className="text-[7.5px] text-white/40 block">Rotate passcode, 2FA, passkeys, sessions</span>
                    </div>
                  </div>
                  <div className="text-[8px] text-white/20 group-hover:text-amber-400 transition-colors uppercase font-bold">Secure</div>
                </button>

                <button
                  type="button"
                  onClick={() => openWorkspaceTab('verification')}
                  className="px-3 py-2.5 hover:bg-white/[0.03] transition-all flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-500 transition-all">
                      <FileCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Verification (KYC)</span>
                      <span className="text-[7.5px] text-white/40 block">Compliance, Gov ID upload, tax forms</span>
                    </div>
                  </div>
                  <div className="text-[8px] text-white/20 group-hover:text-cyan-400 transition-colors uppercase font-bold">Verify</div>
                </button>

                <button
                  type="button"
                  onClick={() => openWorkspaceTab('payment')}
                  className="px-3 py-2.5 hover:bg-white/[0.03] transition-all flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-500 transition-all">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Bank & Payments</span>
                      <span className="text-[7.5px] text-white/40 block">Linked cards, banks, crypto, M-Pesa</span>
                    </div>
                  </div>
                  <div className="text-[8px] text-white/20 group-hover:text-rose-400 transition-colors uppercase font-bold">Funds</div>
                </button>

                <button
                  type="button"
                  onClick={() => openWorkspaceTab('support')}
                  className="px-3 py-2.5 hover:bg-white/[0.03] transition-all flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-500 transition-all">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Support Center</span>
                      <span className="text-[7.5px] text-white/40 block">Help, ticket log, FAQs, 24/7 Live Chat</span>
                    </div>
                  </div>
                  <div className="text-[8px] text-white/20 group-hover:text-purple-400 transition-colors uppercase font-bold">Help</div>
                </button>

                <button
                  type="button"
                  onClick={() => openWorkspaceTab('settings')}
                  className="px-3 py-2.5 hover:bg-white/[0.03] transition-all flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-600 group-hover:text-white group-hover:border-zinc-500 transition-all">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">General Settings</span>
                      <span className="text-[7.5px] text-white/40 block">Theme, slippage, order size, warnings</span>
                    </div>
                  </div>
                  <div className="text-[8px] text-white/20 group-hover:text-zinc-300 transition-colors uppercase font-bold">Tune</div>
                </button>
              </div>

              {/* Sign out block */}
              <div className="p-3 bg-black/40 text-left">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_12px_rgba(99,102,241,0.25)] text-white font-black uppercase rounded text-[9px] flex items-center justify-center gap-2 transition-all cursor-pointer border border-indigo-500/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Terminate Session (Sign Out)
                </button>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* WORKSPACE PREFERENCES MODAL - OPENS GRACEFULLY INTO THE WORKSPACE */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isWorkspaceOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] bg-[#07070a] flex flex-col"
            >
              {/* MAIN WORKSPACE DESIGN PANEL */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full h-full bg-[#07070a] flex flex-col font-mono text-white text-[10px]"
              >
              {/* Workspace Header Bar */}
              <div className="px-4 sm:px-5 py-4 bg-gradient-to-r from-[#0d0d16] via-[#07070a] to-[#07070a] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white border border-indigo-500/30 shrink-0">
                    <Cpu className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] xs:text-[11px] sm:text-[12px] font-black text-white tracking-wider block uppercase truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">MTX BROKERAGE ACCOUNTS & SYSTEM CORE</span>
                    <span className="text-[7.5px] sm:text-[8px] text-white/40 block mt-0.5 truncate">Clearing Gateway Node: <span className="text-emerald-400 font-bold">SECURE_ACTIVE_DESK</span></span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsWorkspaceOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer border border-white/10 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Workspace Body Grid: Left Sidebar Nav + Right Spacious Content Frame */}
              <div className="flex-1 min-h-0 flex flex-col md:flex-row">
                
                {/* Left Sidebar navigation */}
                <div className="w-full md:w-56 bg-[#09090e] md:bg-black/35 border-b md:border-b-0 md:border-r border-white/10 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar md:divide-y md:divide-white/5 md:p-2.5 shrink-0 select-none">
                  <div className="p-2.5 hidden md:block">
                    <span className="text-[7.5px] text-white/30 font-black tracking-widest block uppercase">CLEARING HUB CATEGORIES</span>
                  </div>

                  {menuCategories.map((cat) => {
                    const IconComp = cat.icon;
                    const isSelected = activeWorkspaceTab === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveWorkspaceTab(cat.id)}
                        className={`shrink-0 md:w-full py-3 md:py-2.5 px-4 md:px-3 flex items-center gap-2 font-bold transition-all border-b-2 md:border-b-0 md:border-l-2 text-[10px] md:text-[9px] uppercase tracking-wider text-left whitespace-nowrap cursor-pointer ${isSelected ? 'border-indigo-500 text-white bg-indigo-600/10' : 'border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.01]'}`}
                      >
                        <IconComp className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-white/30'}`} />
                        {cat.label}
                      </button>
                    );
                  })}

                  <div className="md:mt-auto pt-3 p-1 hidden md:block w-full">
                    <div className="p-2 bg-indigo-950/20 border border-indigo-500/20 rounded">
                      <span className="text-[8px] text-indigo-300 font-bold block">Secure Session Security</span>
                      <p className="text-[7px] text-white/40 mt-1 leading-relaxed">Dynamic HSM verification ensures all actions logged under active JWT bearer token.</p>
                    </div>
                  </div>
                </div>

                {/* Right Content Frame (well-spaced and fully functional) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#09090d]/30 text-left">
                  
                  {/* PROFILE TAB PAGE */}
                  {activeWorkspaceTab === 'profile' && (
                    <div className="space-y-6 max-w-2xl animate-fadeIn">
                      <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">PERSONAL IDENTITY LEDGER</h2>
                        <p className="text-white/50 text-[9px] mt-1 leading-relaxed">Manage your registered personal account details, custom avatars, phone, tax residency indicators and regional parameters below.</p>
                      </div>

                      {profileSaveSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-300 text-[9px] font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Personal information record updated on decentralized clearing logs successfully.
                        </div>
                      )}

                      <form onSubmit={handleProfileSave} className="space-y-4">
                        {/* Profile photo picker row */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-black text-white border border-white/20 shadow-xl ${activeAvatarStyle}`}>
                            {profileName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-[9px] text-white/40 font-bold block uppercase mb-1.5">CHOOSE PROFILE PHOTO / AVATAR COLOR PRESET</span>
                            <div className="flex items-center gap-2">
                              {avatarPresets.map((style, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setProfilePhotoPreset(idx)}
                                  className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${style} ${profilePhotoPreset === idx ? 'border-indigo-500 scale-110' : 'border-transparent'}`}
                                />
                              ))}
                            </div>
                            <span className="text-[7.5px] text-white/30 block mt-1">Select visual indicator used across institutional trading rails.</span>
                          </div>
                        </div>

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[8px] text-white/40 font-bold uppercase tracking-wider">FULL LEGAL NAME</label>
                            <input
                              type="text"
                              required
                              value={profileName}
                              onChange={(e) => setProfileName(e.target.value)}
                              className="bg-[#0b0b0f] text-white font-mono text-[9.5px] px-3 py-2.5 rounded border border-white/10 outline-none focus:border-indigo-500/50"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[8px] text-white/40 font-bold uppercase tracking-wider">REGISTERED TRADER EMAIL</label>
                            <div className="bg-[#0b0b0f]/60 text-white/40 font-mono text-[9.5px] px-3 py-2.5 rounded border border-white/5 flex items-center justify-between">
                              <span>{traderEmail}</span>
                              <Lock className="w-3.5 h-3.5 text-white/20" />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[8px] text-white/40 font-bold uppercase tracking-wider">PHONE NUMBER</label>
                            <input
                              type="text"
                              required
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value)}
                              className="bg-[#0b0b0f] text-white font-mono text-[9.5px] px-3 py-2.5 rounded border border-white/10 outline-none focus:border-indigo-500/50"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[8px] text-white/40 font-bold uppercase tracking-wider">COUNTRY/REGION</label>
                            <select
                              value={profileCountry}
                              onChange={(e) => setProfileCountry(e.target.value)}
                              className="bg-[#0b0b0f] text-white font-mono text-[9.5px] px-3 py-2.5 rounded border border-white/10 outline-none focus:border-indigo-500/50 cursor-pointer"
                            >
                              <option value="United States">United States</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Singapore">Singapore</option>
                              <option value="Kenya">Kenya</option>
                              <option value="Germany">Germany</option>
                              <option value="South Africa">South Africa</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[8px] text-white/40 font-bold uppercase tracking-wider">PREFERRED LANGUAGE</label>
                            <select
                              value={profileLanguage}
                              onChange={(e) => setProfileLanguage(e.target.value)}
                              className="bg-[#0b0b0f] text-white font-mono text-[9.5px] px-3 py-2.5 rounded border border-white/10 outline-none focus:border-indigo-500/50 cursor-pointer"
                            >
                              <option value="English (US)">English (US)</option>
                              <option value="English (UK)">English (UK)</option>
                              <option value="Spanish">Español</option>
                              <option value="Swahili">Kiswahili</option>
                              <option value="Japanese">日本語</option>
                              <option value="German">Deutsch</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[8px] text-white/40 font-bold uppercase tracking-wider">PREFERRED TIME ZONE</label>
                            <select
                              value={profileTimeZone}
                              onChange={(e) => setProfileTimeZone(e.target.value)}
                              className="bg-[#0b0b0f] text-white font-mono text-[9.5px] px-3 py-2.5 rounded border border-white/10 outline-none focus:border-indigo-500/50 cursor-pointer"
                            >
                              <option value="UTC-5 (EST)">UTC-5 (EST)</option>
                              <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
                              <option value="UTC+1 (CET)">UTC+1 (CET)</option>
                              <option value="UTC+3 (EAT)">UTC+3 (EAT)</option>
                              <option value="UTC+8 (SGT)">UTC+8 (SGT)</option>
                              <option value="UTC+9 (JST)">UTC+9 (JST)</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] text-white font-bold uppercase rounded text-[9px] transition-all cursor-pointer border border-indigo-500/20"
                        >
                          SAVE PROFILE RECORD
                        </button>
                      </form>
                    </div>
                  )}

                  {/* ACCOUNT TAB PAGE */}
                  {activeWorkspaceTab === 'account' && (
                    <div className="space-y-6 max-w-2xl animate-fadeIn">
                      <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">BROKERAGE ACCOUNT REGISTRY</h2>
                        <p className="text-white/50 text-[9px] mt-1 leading-relaxed">Review base clearance parameters, institutional account tiers, trading license rights, and total leverage multipliers.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Summary Widget */}
                        <div className="p-4 bg-gradient-to-br from-indigo-950/15 to-transparent border border-indigo-500/25 rounded-lg space-y-3">
                          <span className="text-[7.5px] text-indigo-400 font-black uppercase tracking-wider">CLEARING ACCOUNT CREDENTIALS</span>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-white/40 font-bold">CLEARING ACCOUNT ID:</span>
                              <span className="text-white font-black text-[9.5px]">MTX-77491-VA-A</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/40 font-bold">ACCOUNT TIER:</span>
                              <select
                                value={accountType}
                                onChange={(e: any) => setAccountType(e.target.value)}
                                className="bg-[#0b0b0f] text-indigo-300 font-bold text-[9px] border border-white/10 px-2 py-1 rounded outline-none cursor-pointer"
                              >
                                <option value="Corporate">Corporate Desk</option>
                                <option value="Individual">Individual Client</option>
                                <option value="Joint">Joint Operations</option>
                                <option value="Trust">Fiduciary Trust</option>
                              </select>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/40 font-bold">SUBSCRIPTION LEVEL:</span>
                              <select
                                value={subPlan}
                                onChange={(e: any) => setSubPlan(e.target.value)}
                                className="bg-[#0b0b0f] text-indigo-300 font-bold text-[9px] border border-white/10 px-2 py-1 rounded outline-none cursor-pointer"
                              >
                                <option value="Institutional Pro">Institutional Pro</option>
                                <option value="Apex Clearing">Apex Clearing</option>
                                <option value="Pro">Pro Access</option>
                                <option value="Standard">Standard Desk</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Buying Power Summary */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg space-y-3">
                          <span className="text-[7.5px] text-emerald-400 font-black uppercase tracking-wider">LIQUID CAPITAL SUMMARY</span>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-white/40 font-bold">BASE CURRENCY:</span>
                              <select
                                value={baseCurrency}
                                onChange={(e: any) => setBaseCurrency(e.target.value)}
                                className="bg-black/40 text-white font-bold text-[8.5px] border border-white/10 px-1.5 py-0.5 rounded outline-none cursor-pointer"
                              >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="JPY">JPY (¥)</option>
                              </select>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-white/40 font-bold">TOTAL LIQUID CAPITAL:</span>
                              <span className="text-xs font-black text-emerald-400">${buyingPower.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40 font-bold">PORTFOLIO LEVERAGE:</span>
                              <span className="text-indigo-300 font-black uppercase">4.0X DYNAMIC LIMIT</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Trading Permissions indicators */}
                      <div className="p-4 bg-black/40 border border-white/5 rounded-lg space-y-3">
                        <span className="text-[8px] text-white/40 font-black uppercase tracking-wider block">APPROVED TRADING PERMISSIONS & LIMITS</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[9px]">
                          <div className="flex items-center gap-2 p-2 bg-white/[0.01] border border-white/5 rounded">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <span className="font-bold text-white block">SPOT DERIVATIVES</span>
                              <span className="text-[7.5px] text-white/40 block">Fully cleared; leverage up to 4.0x enabled.</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-white/[0.01] border border-white/5 rounded">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <span className="font-bold text-white block">MULTI-ASSET SWAPS</span>
                              <span className="text-[7.5px] text-white/40 block">Cleared via instant liquidity networks.</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-white/[0.01] border border-white/5 rounded">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <span className="font-bold text-white block">ALGORITHMIC CLEARING</span>
                              <span className="text-[7.5px] text-white/40 block">Approved for high throughput FIX server engines.</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-white/[0.01] border border-white/5 rounded">
                            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
                            <div>
                              <span className="font-bold text-indigo-300 block">HIGH-FREQUENCY API</span>
                              <span className="text-[7.5px] text-white/40 block">Secured token access active for WebSocket streaming.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECURITY TAB PAGE */}
                  {activeWorkspaceTab === 'security' && (
                    <div className="space-y-6 max-w-2xl animate-fadeIn">
                      <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">CRYPTOGRAPHIC SECURITY MATRIX</h2>
                        <p className="text-white/50 text-[9px] mt-1 leading-relaxed">Configure rotational passwords, activate two-factor hardware tokens, generate emergency backup keys and terminate rogue browser sessions.</p>
                      </div>

                      {passwordSuccessMsg && (
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-300 text-[9px] font-bold">
                          {passwordSuccessMsg}
                        </div>
                      )}

                      {/* Password Rotation */}
                      <form onSubmit={handlePasswordChangeSubmit} className="p-4 bg-white/[0.02] border border-white/5 rounded-lg space-y-3">
                        <span className="text-[8px] text-white/40 font-black uppercase tracking-wider block">ROTATIONAL PASSCODE MATRIX</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[7.5px] text-white/30 font-bold block uppercase">CURRENT CODE</span>
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              value={passwordOld}
                              onChange={(e) => setPasswordOld(e.target.value)}
                              className="bg-[#0b0b0f] text-white text-[9px] px-3 py-2 rounded border border-white/10 outline-none focus:border-indigo-500/50"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[7.5px] text-white/30 font-bold block uppercase">NEW CODE</span>
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              value={passwordNew}
                              onChange={(e) => setPasswordNew(e.target.value)}
                              className="bg-[#0b0b0f] text-white text-[9px] px-3 py-2 rounded border border-white/10 outline-none focus:border-indigo-500/50"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[7.5px] text-white/30 font-bold block uppercase">CONFIRM NEW CODE</span>
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              value={passwordConfirm}
                              onChange={(e) => setPasswordConfirm(e.target.value)}
                              className="bg-[#0b0b0f] text-white text-[9px] px-3 py-2 rounded border border-white/10 outline-none focus:border-indigo-500/50"
                            />
                          </div>
                        </div>

                        {passwordNew && (
                          <div className="text-[7.5px] text-indigo-300 font-bold flex items-center gap-1.5 mt-1">
                            <Shield className="w-3.5 h-3.5" />
                            Security Strength Rating: <span className="text-emerald-400 uppercase font-black tracking-wider">HSM MILITARY-GRADE CLEAR</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-[8px] font-black uppercase rounded border border-white/10 cursor-pointer"
                        >
                          ROTATE PASSCODE RECORD
                        </button>
                      </form>

                      {/* 2FA & Hardware security keys */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Smartphone className="w-5 h-5 text-indigo-400" />
                            <div>
                              <span className="font-bold text-white block">Two-Factor Authentication (2FA)</span>
                              <span className="text-[7.5px] text-white/40 block">Requires one-time OTP for clearing.</span>
                            </div>
                          </div>
                          <SwitchItem checked={is2FaEnabled} onChange={() => setIs2FaEnabled(!is2FaEnabled)} />
                        </div>

                        <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Lock className="w-5 h-5 text-indigo-400" />
                            <div>
                              <span className="font-bold text-white block">FIDO2 Passkeys Verification</span>
                              <span className="text-[7.5px] text-white/40 block">Cryptographic biometric clearing.</span>
                            </div>
                          </div>
                          <SwitchItem checked={isPasskeysEnabled} onChange={() => setIsPasskeysEnabled(!isPasskeysEnabled)} />
                        </div>
                      </div>

                      {/* Trusted Devices & Sessions */}
                      <div className="p-4 bg-black/20 border border-white/5 rounded-lg space-y-3">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-[8px] text-white/40 font-black uppercase tracking-wider block">ACTIVE CLEARING SESSIONS & GEOGRAPHIC TRACKS</span>
                          <button
                            type="button"
                            onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
                            className="text-indigo-400 hover:underline cursor-pointer font-bold text-[8px] uppercase tracking-wider"
                          >
                            {showRecoveryCodes ? 'Hide Backup Codes' : 'Verify Recovery Codes'}
                          </button>
                        </div>

                        {showRecoveryCodes && (
                          <div className="bg-indigo-950/20 p-3 border border-indigo-500/35 rounded-lg text-[9px] text-indigo-300 font-mono space-y-2 mb-2 animate-fadeIn">
                            <span className="font-bold uppercase text-[8px] block text-white/50 mb-1">EMERGENCY CRYPTOGRAPHIC BACKUP RECOVERY CODES</span>
                            <div className="grid grid-cols-3 gap-2 text-center font-bold">
                              <span className="bg-black/40 p-1.5 border border-white/5 rounded">RC_9918_FF_CLEAR</span>
                              <span className="bg-black/40 p-1.5 border border-white/5 rounded">RC_4412_AA_VANCE</span>
                              <span className="bg-black/40 p-1.5 border border-white/5 rounded">RC_1082_ZX_CLEAR</span>
                              <span className="bg-black/40 p-1.5 border border-white/5 rounded">RC_8820_QM_DESK</span>
                              <span className="bg-black/40 p-1.5 border border-white/5 rounded">RC_5033_OB_PROJ</span>
                              <span className="bg-black/40 p-1.5 border border-white/5 rounded">RC_4958_FG_GATE</span>
                            </div>
                            <span className="text-[7.5px] text-white/30 block text-right">Keep these in physical safe vaults. Regenerate rotates database hashes.</span>
                          </div>
                        )}

                        <div className="space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white/[0.01] border border-white/5 rounded">
                            <div className="flex items-center gap-2 min-w-0">
                              <Laptop className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-white block text-[9px] truncate">Apple MacBook Pro (San Francisco, CA)</span>
                                <span className="text-[7.5px] text-white/40 block truncate">IP: 198.51.100.41 • Web Terminal interface</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[7.5px] text-emerald-400 font-bold uppercase tracking-wider animate-pulse self-start sm:self-auto shrink-0">ACTIVE NOW</span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white/[0.01] border border-white/5 rounded">
                            <div className="flex items-center gap-2 min-w-0">
                              <Smartphone className="w-4 h-4 text-white/30 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-white/70 block text-[9px] truncate">iPhone 15 Pro Max (Eldoret, Kenya)</span>
                                <span className="text-[7.5px] text-white/40 block truncate">IP: 102.168.1.108 • Mobile Application Hub</span>
                              </div>
                            </div>
                            <span className="text-[7.5px] text-white/30 self-start sm:self-auto shrink-0">2 hrs ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* KYC TAB PAGE */}
                  {activeWorkspaceTab === 'verification' && (
                    <div className="space-y-6 max-w-2xl animate-fadeIn">
                      <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">COMPLIANCE & KYC IDENTITY GATEWAY</h2>
                        <p className="text-white/50 text-[9px] mt-1 leading-relaxed">To fulfill international fiduciary regulations and SEC clearance, manage your primary corporate registration and identity records here.</p>
                      </div>

                      {/* Big status box */}
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black text-emerald-300 uppercase">TIER-2 INSTITUTIONAL CLEARANCE ACHIEVED</span>
                            <span className="px-2 py-0.2 bg-emerald-500/20 border border-emerald-500/40 rounded text-[7px] text-emerald-300 font-bold uppercase tracking-wider">VERIFIED</span>
                          </div>
                          <span className="text-[7.5px] text-white/50 block mt-1 leading-relaxed">Beneficial ownership logs, address validation certificates, and corporate tax declarations clear all automated AML screening vectors. No compliance barriers currently active.</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* ID Upload Slot */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[8px] text-white/40 font-bold uppercase tracking-wider">GOVERNMENT ID ATTACHMENT</label>
                          <div className="p-5 bg-black/40 border border-white/5 hover:border-white/10 rounded-lg flex flex-col items-center justify-center text-center gap-2.5 transition-all">
                            <Upload className="w-5 h-5 text-white/40" />
                            <div className="space-y-1">
                              <span className="text-[8.5px] text-white/80 font-bold block truncate max-w-[200px]">
                                {uploadedFileName ? uploadedFileName : 'No ID document linked'}
                              </span>
                              <span className="text-[7px] text-white/30 block">PDF/PNG format. Maximum file size 15MB.</span>
                            </div>
                            <input
                              type="file"
                              id="gov-id-file"
                              className="hidden"
                              onChange={(e) => handleFileUploadLocal(e, 'id')}
                            />
                            <label 
                              htmlFor="gov-id-file" 
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[7.5px] text-white font-bold cursor-pointer transition-colors border border-white/10"
                            >
                              {isUploading ? 'SAVING DOCUMENT...' : 'UPLOAD NEW ID'}
                            </label>
                          </div>
                        </div>

                        {/* Address Verification Doc Slot */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[8px] text-white/40 font-bold uppercase tracking-wider">ADDRESS STATEMENT (UTILITY BILL)</label>
                          <div className="p-5 bg-black/40 border border-white/5 hover:border-white/10 rounded-lg flex flex-col items-center justify-center text-center gap-2.5 transition-all">
                            <Upload className="w-5 h-5 text-white/40" />
                            <div className="space-y-1">
                              <span className="text-[8.5px] text-white/80 font-bold block truncate max-w-[200px]">
                                {addressDocName ? addressDocName : 'No address statement linked'}
                              </span>
                              <span className="text-[7px] text-white/30 block">Linked within last 90 calendar days.</span>
                            </div>
                            <input
                              type="file"
                              id="address-doc-file"
                              className="hidden"
                              onChange={(e) => handleFileUploadLocal(e, 'address')}
                            />
                            <label 
                              htmlFor="address-doc-file" 
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[7.5px] text-white font-bold cursor-pointer transition-colors border border-white/10"
                            >
                              {isUploading ? 'SAVING DOCUMENT...' : 'UPLOAD NEW STATEMENT'}
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Tax residency and funds */}
                      <div className="p-4 bg-white/[0.01] border border-white/5 rounded-lg space-y-4">
                        <span className="text-[8px] text-white/40 font-black uppercase tracking-wider block">TAX REGISTRY & SOURCE ATTESTATIONS</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[8px] text-white/40 font-bold uppercase tracking-wider">TAX RESIDENCY DECLARATION STATUS</label>
                            <input
                              type="text"
                              value={taxResidency}
                              onChange={(e) => setTaxResidency(e.target.value)}
                              className="bg-[#0b0b0f] text-white font-mono text-[9.5px] px-3 py-2 rounded border border-white/10 outline-none focus:border-indigo-500/50"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[8px] text-white/40 font-bold uppercase tracking-wider">CERTIFIED SOURCE OF FUNDS</label>
                            <input
                              type="text"
                              value={sourceOfFunds}
                              onChange={(e) => setSourceOfFunds(e.target.value)}
                              className="bg-[#0b0b0f] text-white font-mono text-[9.5px] px-3 py-2 rounded border border-white/10 outline-none focus:border-indigo-500/50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BANK & PAYMENTS TAB PAGE */}
                  {activeWorkspaceTab === 'payment' && (
                    <div className="space-y-6 max-w-2xl animate-fadeIn">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h2 className="text-sm font-black text-white uppercase tracking-wider">CONNECTED TRANSFER & BANKING GATEWAYS</h2>
                          <p className="text-white/50 text-[9px] mt-1 leading-relaxed">Manage clearing bank credentials, card thresholds, stablecoin wallets and mobile operators (M-Pesa/Airtel Money).</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddPaymentModal(true)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-[8px] font-black uppercase text-white flex items-center gap-1.5 cursor-pointer transition-all border border-indigo-500/20 shadow-inner shrink-0 self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5" /> LINK ASSET GATEWAY
                        </button>
                      </div>

                      {showAddPaymentModal && (
                        <form onSubmit={handleAddPaymentLocal} className="p-4 bg-[#0d0d16] border border-indigo-500/30 rounded-lg space-y-3">
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-[8.5px] text-white font-black uppercase tracking-wider">CONNECT NEW TRANSACTION PORT</span>
                            <button type="button" onClick={() => setShowAddPaymentModal(false)} className="text-white/40 hover:text-white cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 xs:grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setNewPaymentType('bank')}
                              className={`py-1.5 rounded font-black text-[8px] uppercase tracking-wider text-center transition-all cursor-pointer ${newPaymentType === 'bank' ? 'bg-indigo-600 text-white shadow' : 'bg-black/40 text-white/40'}`}
                            >
                              BANK ACCOUNT
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewPaymentType('card')}
                              className={`py-1.5 rounded font-black text-[8px] uppercase tracking-wider text-center transition-all cursor-pointer ${newPaymentType === 'card' ? 'bg-indigo-600 text-white shadow' : 'bg-black/40 text-white/40'}`}
                            >
                              DEBIT / CARD
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewPaymentType('wallet')}
                              className={`py-1.5 rounded font-black text-[8px] uppercase tracking-wider text-center transition-all cursor-pointer ${newPaymentType === 'wallet' ? 'bg-indigo-600 text-white shadow' : 'bg-black/40 text-white/40'}`}
                            >
                              CRYPTO WALLET
                            </button>
                          </div>
                          
                          {newPaymentType === 'bank' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                type="text"
                                required
                                placeholder="Bank Name (e.g. CitiCorp)"
                                value={newBankName}
                                onChange={(e) => setNewBankName(e.target.value)}
                                className="bg-[#0b0b0f] text-white font-mono text-[9px] px-3 py-2 rounded border border-white/10 outline-none"
                              />
                              <input
                                type="text"
                                required
                                placeholder="Clearing Account Number"
                                value={newBankAccount}
                                onChange={(e) => setNewBankAccount(e.target.value)}
                                className="bg-[#0b0b0f] text-white font-mono text-[9px] px-3 py-2 rounded border border-white/10 outline-none"
                              />
                            </div>
                          )}

                          {newPaymentType !== 'bank' && (
                            <div className="text-[8px] text-white/40 p-2.5 bg-black/40 rounded border border-white/5 italic">
                              Payment clearing provider configured in mock sandbox mode. Transact directly upon saving.
                            </div>
                          )}

                          <button
                            type="submit"
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase rounded text-[8.5px] tracking-wider transition-colors"
                          >
                            CONFIRM LINKED GATEWAY
                          </button>
                        </form>
                      )}

                      <div className="space-y-4">
                        {/* Banks Stack */}
                        <div className="space-y-1.5 text-left">
                          <span className="text-[8px] text-white/40 font-black uppercase tracking-wider block">LINKED CLEARING BANKS</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {linkedBanks.map(b => (
                              <div key={b.id} className="p-3 bg-black/40 border border-white/5 rounded-lg flex justify-between items-center hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-2.5">
                                  <Building className="w-5 h-5 text-indigo-400" />
                                  <div>
                                    <span className="font-bold text-white block text-[9px]">{b.name}</span>
                                    <span className="text-[7.5px] text-indigo-300 font-bold block">{b.status}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <span className="text-white/40 font-mono font-bold text-[9px]">{b.account}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveBankLocal(b.id)}
                                    className="text-rose-400 hover:text-rose-300 cursor-pointer p-1 rounded hover:bg-rose-500/10 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cards Stack */}
                        <div className="space-y-1.5 text-left">
                          <span className="text-[8px] text-white/40 font-black uppercase tracking-wider block">APPROVED CARD SETTLEMENTS</span>
                          {linkedCards.map(c => (
                            <div key={c.id} className="p-3 bg-black/40 border border-white/5 rounded-lg flex justify-between items-center">
                              <div className="flex items-center gap-2.5">
                                <CreditCard className="w-5 h-5 text-indigo-400" />
                                <div>
                                  <span className="font-bold text-white block text-[9px]">{c.brand}</span>
                                  <span className="text-[7.5px] text-white/40 block">Clearing limit: <span className="text-emerald-400 font-bold">$100,000 / day</span></span>
                                </div>
                              </div>
                              <span className="text-white/40 font-mono font-bold text-[9px]">{c.number} (Exp: {c.expiry})</span>
                            </div>
                          ))}
                        </div>

                        {/* Wallets & Mobile Money */}
                        <div className="space-y-1.5 text-left">
                          <span className="text-[8px] text-white/40 font-black uppercase tracking-wider block">STABLECOIN & MOBILE CLEARING</span>
                          {wallets.map(w => (
                            <div key={w.id} className="p-3 bg-black/40 border border-white/5 rounded-lg flex justify-between items-center">
                              <div className="flex items-center gap-2.5">
                                <Wallet className="w-5 h-5 text-indigo-400" />
                                <div>
                                  <span className="font-bold text-white block text-[9px]">{w.type}</span>
                                  <span className="text-[7.5px] text-indigo-300 font-mono truncate max-w-[200px] block">{w.address}</span>
                                </div>
                              </div>
                              <span className="text-white/30 text-[7px] font-bold uppercase">ERC-20 INSTANT</span>
                            </div>
                          ))}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            <div className="p-3 bg-[#0a0a0f] border border-white/5 rounded-lg text-left">
                              <span className="text-white/30 text-[7.5px] font-bold block uppercase mb-1">M-PESA MOBILE WALLET</span>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                                <input 
                                  type="text" 
                                  value={mpesaNo} 
                                  onChange={(e) => setMpesaNo(e.target.value)}
                                  className="bg-transparent text-white font-mono text-[9px] w-full outline-none focus:text-indigo-300"
                                />
                              </div>
                            </div>
                            <div className="p-3 bg-[#0a0a0f] border border-white/5 rounded-lg text-left">
                              <span className="text-white/30 text-[7.5px] font-bold block uppercase mb-1">AIRTEL MONEY MOBILE WALLET</span>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                                <input 
                                  type="text" 
                                  value={airtelNo} 
                                  onChange={(e) => setAirtelNo(e.target.value)}
                                  className="bg-transparent text-white font-mono text-[9px] w-full outline-none focus:text-indigo-300"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUPPORT CENTER TAB PAGE */}
                  {activeWorkspaceTab === 'support' && (
                    <div className="space-y-6 max-w-2xl animate-fadeIn">
                      <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">HEURISTIC CLIENT DISPATCH</h2>
                        <p className="text-white/50 text-[9px] mt-1 leading-relaxed">Reach our institutional operations desk, file fiduciary complaints, browse dynamic FAQ guidelines, or chat instantly with automated brokers.</p>
                      </div>

                      {supportAlert && (
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-300 text-[9px] font-bold">
                          {supportAlert}
                        </div>
                      )}

                      {/* Interactive Live Chat Sim */}
                      <div className="p-4 bg-black/45 border border-white/5 rounded-xl space-y-3 flex flex-col h-[280px]">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-[8.5px] text-white font-black uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Live Desk Chat Simulation
                          </span>
                          <span className="text-white/30 text-[7.5px] font-bold">Latency: 12ms</span>
                        </div>

                        {/* Message log */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 select-text text-[9px]">
                          {chatMessages.map((msg, idx) => {
                            const isUser = msg.sender === 'user';
                            return (
                              <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[75%] p-2.5 rounded-lg ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 text-white/90 rounded-tl-none border border-white/5'}`}>
                                  <p className="leading-relaxed font-sans">{msg.text}</p>
                                </div>
                                <span className="text-[7px] text-white/20 mt-1 block font-mono">{msg.time} • {isUser ? 'CLIENT' : 'FIDUCIARY OFFICER'}</span>
                              </div>
                            );
                          })}

                          {isChatTyping && (
                            <div className="flex flex-col items-start">
                              <div className="bg-white/5 text-white/40 p-2.5 rounded-lg rounded-tl-none border border-white/5 italic font-sans flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                                MTX Broker dispatch typing...
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Input row */}
                        <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-white/5 pt-2 shrink-0">
                          <input
                            type="text"
                            placeholder="Type diagnostic question (e.g. 'how to deposit?', 'latencies')..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            className="flex-1 bg-[#0b0b0f] text-white text-[9px] px-3 py-2 rounded border border-white/10 outline-none"
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>

                      {/* Ticket Submission Form */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <form onSubmit={handleTicketSubmit} className="p-4 bg-white/[0.02] border border-white/5 rounded-lg space-y-3 text-left">
                          <span className="text-[8px] text-white/40 font-black uppercase tracking-wider block">LOG HIGH-PRIORITY COMPLAINT TICKET</span>
                          <input
                            type="text"
                            required
                            placeholder="Subject (e.g. FIX port discrepancy)"
                            value={supportSubject}
                            onChange={(e) => setSupportSubject(e.target.value)}
                            className="w-full bg-[#0b0b0f] text-white text-[9.5px] px-3 py-2 rounded border border-white/10 outline-none"
                          />
                          <textarea
                            required
                            placeholder="Describe full technical indicators and timestamp variables..."
                            value={supportDesc}
                            onChange={(e) => setSupportDesc(e.target.value)}
                            rows={2}
                            className="w-full bg-[#0b0b0f] text-white text-[9.5px] px-3 py-2 rounded border border-white/10 outline-none resize-none font-mono"
                          />
                          <button
                            type="submit"
                            className="w-full py-2 bg-white/5 hover:bg-white/10 text-[8px] font-black uppercase rounded border border-white/10 cursor-pointer"
                          >
                            DISPATCH TICKET TO QUEUE
                          </button>
                        </form>

                        <div className="space-y-3 text-left">
                          <span className="text-[8px] text-white/40 font-black uppercase tracking-wider block">ACTIVE QUEUE TICKETS</span>
                          <div className="space-y-2">
                            {supportTickets.map((tkt, idx) => (
                              <div key={idx} className="p-3 bg-black/40 border border-white/5 rounded-lg flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-[9px]">
                                <div className="min-w-0">
                                  <span className="font-bold text-white/95 block truncate">{tkt.subject}</span>
                                  <span className="text-[7.5px] text-white/40 block mt-0.5 truncate">{tkt.id} • Submitted {tkt.date}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border shrink-0 self-start xs:self-auto ${tkt.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'}`}>
                                  {tkt.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* FAQs Collapse list */}
                      <div className="space-y-2">
                        <span className="text-[8.5px] text-white/40 font-black uppercase tracking-wider block">CLEARING FAQ DIRECTIVES</span>
                        {[
                          { q: 'How does margin leverage scale inside the MTX desk?', a: 'Leverage scales dynamically relative to overall historical correlation and Pearson co-movements across open portfolio books. Risk compliance maintains strict watch limits.' },
                          { q: 'What is the compliance SLA for funds withdrawal?', a: 'Withdrawals are audited through automated transaction tracking before routing on Ledger or Bank clearing networks within 15 minutes.' },
                          { q: 'Is stablecoin settlement available globally?', a: 'Yes, MTX clears natively on Polygon and Solana networks for USDT and USDC. Transfers reflect upon 3 cryptographic blockchain confirmations.' }
                        ].map((faq, idx) => (
                          <div key={idx} className="bg-[#0b0b0f] border border-white/5 rounded-lg overflow-hidden text-[9px]">
                            <button
                              type="button"
                              onClick={() => setFaqOpenIdx(faqOpenIdx === idx ? null : idx)}
                              className="w-full p-3 flex justify-between items-center text-left text-white/80 hover:text-white cursor-pointer font-bold"
                            >
                              <span>{faq.q}</span>
                              {faqOpenIdx === idx ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                            </button>
                            {faqOpenIdx === idx && (
                              <div className="p-3 bg-black/30 text-white/50 border-t border-white/5 leading-relaxed font-sans">
                                {faq.a}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SETTINGS TAB PAGE */}
                  {activeWorkspaceTab === 'settings' && (
                    <div className="space-y-6 max-w-2xl animate-fadeIn">
                      <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-wider">GENERAL SYSTEM SETTINGS</h2>
                        <p className="text-white/50 text-[9px] mt-1 leading-relaxed">Customize default interface styles, lot sizes, date/time layouts, text accessibility settings, slippage limits, and analytical parameters.</p>
                      </div>

                      <div className="space-y-4">
                        {/* Appearance / Theme and Date Format */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Theme */}
                          <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
                              <div>
                                <span className="font-bold text-white block">Global Theme Mode</span>
                                <span className="text-[7.5px] text-white/40 block">Select high contrast layout.</span>
                              </div>
                            </div>
                            <div className="flex items-center bg-black/40 p-0.5 rounded border border-white/10">
                              <button
                                type="button"
                                onClick={() => theme !== 'dark' && onToggleTheme()}
                                className={`px-2.5 py-1 text-[8px] font-black rounded uppercase transition-colors cursor-pointer ${theme === 'dark' ? 'bg-indigo-600 text-white shadow' : 'text-white/40'}`}
                              >
                                DARK
                              </button>
                              <button
                                type="button"
                                onClick={() => theme !== 'light' && onToggleTheme()}
                                className={`px-2.5 py-1 text-[8px] font-black rounded uppercase transition-colors cursor-pointer ${theme === 'light' ? 'bg-amber-500 text-black shadow' : 'text-white/40'}`}
                              >
                                LIGHT
                              </button>
                            </div>
                          </div>

                          {/* Date Format */}
                          <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <Clock className="w-5 h-5 text-indigo-400" />
                              <div>
                                <span className="font-bold text-white block">Date & Time Format</span>
                                <span className="text-[7.5px] text-white/40 block">Configure ledger timestamps.</span>
                              </div>
                            </div>
                            <select
                              value={dateFormat}
                              onChange={(e: any) => setDateFormat(e.target.value)}
                              className="bg-black/40 text-white text-[9px] font-bold border border-white/10 px-2 py-1 rounded outline-none cursor-pointer"
                            >
                              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            </select>
                          </div>
                        </div>

                        {/* Trading Preferences */}
                        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-lg space-y-3 text-left">
                          <span className="text-[8px] text-white/40 font-black uppercase tracking-wider block font-bold">TRADING PREFERENCES</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-2.5 bg-[#0b0b0f] border border-white/5 rounded-lg">
                              <div>
                                <span className="font-bold text-white block">Max Slippage Limit</span>
                                <span className="text-[7.5px] text-white/40 block">Maximum tolerable execution variance.</span>
                              </div>
                              <StepperItem
                                value={slippageTolerance}
                                onIncrement={() => setSlippageTolerance(parseFloat((slippageTolerance + 0.05).toFixed(2)))}
                                onDecrement={() => setSlippageTolerance(Math.max(0.01, parseFloat((slippageTolerance - 0.05).toFixed(2))))}
                                format={(val) => `${val}%`}
                              />
                            </div>

                            <div className="flex items-center justify-between p-2.5 bg-[#0b0b0f] border border-white/5 rounded-lg">
                              <div>
                                <span className="font-bold text-white block">Default Order size</span>
                                <span className="text-[7.5px] text-white/40 block">Default contract lot magnitude.</span>
                              </div>
                              <StepperItem
                                value={defaultLotSize}
                                onIncrement={() => setDefaultLotSize(parseFloat((defaultLotSize + 0.1).toFixed(1)))}
                                onDecrement={() => setDefaultLotSize(Math.max(0.1, parseFloat((defaultLotSize - 0.1).toFixed(1))))}
                                format={(val) => `${val} Lot`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Risk & Sound Warning Signals */}
                        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-lg space-y-3">
                          <span className="text-[8px] text-white/40 font-black uppercase tracking-wider block font-bold font-mono">RISK & SYSTEM ALIGNMENTS</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[9px]">
                            <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between">
                              <div>
                                <span className="font-bold text-white block">Warning Audio Signals</span>
                                <span className="text-[7.5px] text-white/40 block">Trigger alert acoustics on execution.</span>
                              </div>
                              <SwitchItem checked={soundAlertsEnabled} onChange={onToggleSoundAlerts} />
                            </div>

                            <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between">
                              <div>
                                <span className="font-bold text-indigo-300 block">Intraday Risk Circuit Alerts</span>
                                <span className="text-[7.5px] text-white/40 block">Warn upon Daily PnL boundaries.</span>
                              </div>
                              <SwitchItem checked={dailyPnLAlertEnabled} onChange={onToggleDailyPnLAlert} />
                            </div>
                          </div>
                        </div>

                        {/* Accessibility & Privacy */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Font Accessibility */}
                          <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white block">High Contrast Typography</span>
                              <span className="text-[7.5px] text-white/40 block">Enhance font legibility.</span>
                            </div>
                            <SwitchItem checked={isFontLarge} onChange={() => setIsFontLarge(!isFontLarge)} />
                          </div>

                          {/* Data Sharing */}
                          <div className="p-3 bg-black/40 border border-white/5 rounded-lg flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white block">Fiduciary Analytics Sharing</span>
                              <span className="text-[7.5px] text-white/40 block">Anonymized logs verify performance.</span>
                            </div>
                            <SwitchItem checked={shareAnalytics} onChange={() => setShareAnalytics(!shareAnalytics)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* Workspace Footer diagnostics */}
              <div className="px-4 sm:px-5 py-3 bg-black/50 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[8px] sm:text-[8.5px] shrink-0 text-white/40 select-none text-left">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>Core Matching Engine: <span className="text-emerald-400 font-bold">● 99.99% ONLINE</span></span>
                  <span>WebSocket Ping: <span className="text-indigo-300 font-bold">{isBrokerBridgePaused ? 'PAUSED' : `${brokerPing}ms`}</span></span>
                </div>
                <div className="truncate">
                  <span>Institutional Cryptographic Shield Active • RSA-HSM-256</span>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}
