import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronDown,
  Shield, 
  Wifi, 
  Settings, 
  User, 
  CheckCircle, 
  Key, 
  Download, 
  Scale, 
  RefreshCw, 
  Lock, 
  Volume2, 
  VolumeX, 
  Trash2, 
  LogOut, 
  Save, 
  Edit2, 
  Plus, 
  FileText, 
  Smartphone, 
  Tv, 
  AlertTriangle,
  Check,
  Info,
  X,
  LifeBuoy
} from 'lucide-react';

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
  onIdleTimeoutChange: (value: string) => void;
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
  onIdleTimeoutChange
}: AccountControlCenterProps) {
  // Active Flyout Panel Category on the left
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // SECTION 1: PERSONALIZATION STATE
  const [appearance, setAppearance] = useState<'terminal-dark' | 'midnight-blue' | 'light' | 'system'>(() => {
    return theme === 'light' ? 'light' : 'terminal-dark';
  });
  const [language, setLanguage] = useState<'en' | 'sw' | 'fr' | 'ar' | 'es'>('en');
  const [timezone, setTimezone] = useState<string>('UTC');
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'KES' | 'EUR' | 'GBP'>('USD');
  const [defaultWorkspace, setDefaultWorkspace] = useState<'MARKETS' | 'PORTFOLIO' | 'FUNDING' | 'ACTIVITY'>('MARKETS');
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    security: true,
    funding: true,
    investment: true
  });

  // Handle external theme syncing when appearance changes
  const handleAppearanceChange = (mode: 'terminal-dark' | 'midnight-blue' | 'light' | 'system') => {
    setAppearance(mode);
    if (mode === 'light' && theme === 'dark') {
      onToggleTheme();
    } else if (mode === 'terminal-dark' && theme === 'light') {
      onToggleTheme();
    }
  };

  // SECTION 2: PROFILE STATE
  const [fullName, setFullName] = useState('Mazi Guluj');
  const [profileEmail, setProfileEmail] = useState(traderEmail || 'maziguluj@gmail.com');
  const [phone, setPhone] = useState('+254 712 345678');
  const [country, setCountry] = useState('Kenya');
  const [taxResidency, setTaxResidency] = useState('Kenya');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // SECTION 3: SECURITY STATE
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passkeyStatus, setPasskeyStatus] = useState<boolean>(false);
  const [activeDevices, setActiveDevices] = useState([
    { id: 'dev_1', name: 'MacBook Pro 16"', browser: 'Chrome', location: 'Nairobi, KE', lastActive: 'Active' },
    { id: 'dev_2', name: 'iPhone 15 Pro', browser: 'Safari Mobile', location: 'London, UK', lastActive: '15m ago' }
  ]);
  const [loginHistory] = useState([
    { timestamp: '2026-07-02 14:32', location: 'Nairobi', device: 'MacBook Pro / Chrome', status: 'Success' },
    { timestamp: '2026-07-01 08:30', location: 'Nairobi', device: 'MacBook Pro / Chrome', status: 'Success' },
    { timestamp: '2026-06-30 19:45', location: 'London', device: 'iPhone 15 / Safari', status: 'Failed' }
  ]);

  // SECTION 4: DEVELOPER CONSOLE STATE
  const [apiKeys, setApiKeys] = useState([
    { id: 'key_1', name: 'Live Market Fetcher', prefix: 'mtx_live_pk_...29af', created: '2026-06-15' },
    { id: 'key_2', name: 'Auto Execution Bot', prefix: 'mtx_live_pk_...88cd', created: '2026-06-22' }
  ]);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealKeyId, setRevealKeyId] = useState<string | null>(null);

  const [webhooks, setWebhooks] = useState([
    { id: 'wh_1', url: 'https://api.yourdomain.com/mtx-webhook', active: true, events: 'Fills, Deposits' }
  ]);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');

  const [connectedApps] = useState([
    { name: 'Liquidity Provider Gateway', status: 'CONNECTED', scope: 'Trading & Market Data' },
    { name: 'TradingView Alerts Integrator', status: 'CONNECTED', scope: 'Read Alerts' }
  ]);

  // SECTION 5: AUDIT & COMPLIANCE STATE
  const [auditQuery, setAuditQuery] = useState('');
  const [auditLogs] = useState([
    { timestamp: '14:55:12', action: 'API Key Gen', detail: 'Key "Auto Bot" generated', ip: '197.234.18.91' },
    { timestamp: '14:32:05', action: 'Login Clear', detail: 'FIDO2 authentication clear', ip: '197.234.18.91' },
    { timestamp: '11:24:06', action: 'Order Fill', detail: 'AAPL buy filled $500.00', ip: '197.234.18.91' },
    { timestamp: '10:52:11', action: 'Exch Swap', detail: 'KES to USD convert completed', ip: '197.234.18.91' }
  ]);
  const [privacyDiag, setPrivacyDiag] = useState(true);
  const [privacyPromo, setPrivacyPromo] = useState(false);

  // UTILITIES STATE
  const [copiedToken, setCopiedToken] = useState(false);

  // SECTION 6: CONTACT SUPPORT STATE
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportCategory, setSupportCategory] = useState('Trading/Execution');
  const [supportPriority, setSupportPriority] = useState('Medium');
  const [attachDiagnostics, setAttachDiagnostics] = useState(true);
  const [supportTickets, setSupportTickets] = useState<{
    id: string;
    subject: string;
    message: string;
    category: string;
    priority: string;
    timestamp: string;
    status: string;
    hasLogs: boolean;
  }[]>([]);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);

  // Helper formats
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getDiagnosticsLog = () => {
    return `[DIAGNOSTICS LEDGER ROOT - SECURE SESSION]
TIMESTAMP       : ${new Date().toISOString()}
CLIENT_EMAIL    : ${profileEmail}
CLEARANCE_LVL   : LEVEL-2
BROKER_LATENCY  : ${brokerPing}ms (LIVE)
SESSION_UPTIME  : ${formatTime(sessionSeconds)}
SYSTEM_THEME    : ${appearance.toUpperCase()} (ACTIVE: ${theme.toUpperCase()})
AUDIO_ALERTS    : ${soundAlertsEnabled ? 'ACTIVE' : 'MUTED'}
API_KEYS_DEPLOY : ${apiKeys.length} active keys
WEBHOOK_DESTS   : ${webhooks.length} registered endpoints
DEVICE_AGENT    : ${navigator.userAgent.substring(0, 70)}...
RESOLUTION      : ${window.screen.width}x${window.screen.height} (DPR: ${window.devicePixelRatio})
STATE_INTEGRITY : 100% OK
FIDO2_HARDWARE  : ${passkeyStatus ? 'PROVISIONED & VERIFIED' : 'UNREGISTERED'}
FIRMWARE_CHECK  : MTX-V2.8.1-PROD
LOG_CHECKSUM    : SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}
[END DIAGNOSTICS LEDGER]`;
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) return;

    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTicket = {
      id: ticketId,
      subject: supportSubject,
      message: supportMessage,
      category: supportCategory,
      priority: supportPriority,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'OPEN',
      hasLogs: attachDiagnostics
    };

    setSupportTickets([newTicket, ...supportTickets]);
    setSupportSubject('');
    setSupportMessage('');
    setSupportSuccess(ticketId);

    setTimeout(() => {
      setSupportSuccess(null);
    }, 5000);
  };

  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) return;
    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      prefix: `mtx_live_pk_...${Math.random().toString(36).substring(2, 6)}`,
      created: new Date().toISOString().split('T')[0]
    };
    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    setIsCreatingKey(false);
  };

  const handleCreateWebhook = () => {
    if (!newWebhookUrl.trim()) return;
    const newWh = {
      id: `wh_${Date.now()}`,
      url: newWebhookUrl,
      active: true,
      events: 'All Events'
    };
    setWebhooks([...webhooks, newWh]);
    setNewWebhookUrl('');
    setIsCreatingWebhook(false);
  };

  const handleCopyBearerTokenLocal = () => {
    try {
      const emailHash = traderEmail ? traderEmail.split('@')[0].toUpperCase() : 'QUANT_TRADER';
      const mockToken = `MTX_LIVE_BEARER_${emailHash}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      navigator.clipboard.writeText(mockToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch (err) {
      console.error('Failed to copy token:', err);
    }
  };

  const handleWipeAndAlert = () => {
    onClose();
    onWipeTerminal();
  };

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute right-0 mt-2 flex items-stretch gap-3 z-[999]">
          
          {/* SIDE PANEL FLYOUT (ON THE LEFT ON DESKTOP, INSTANT OVERLAY ON MOBILE) */}
          <AnimatePresence mode="wait">
            {expandedSection && (
              <motion.div
                key={expandedSection}
                initial={{ opacity: 0, x: 15, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 15, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={`absolute inset-0 md:relative md:inset-auto bg-[#08080c] border border-white/10 rounded-lg shadow-[0_15px_40px_rgba(0,0,0,0.85)] z-[1001] md:z-[1000] overflow-hidden flex flex-col font-mono text-[10px] text-white divide-y divide-white/5 transition-all duration-200 ${
                  expandedSection === 'support' ? 'md:w-[440px]' : 'md:w-[360px]'
                }`}
              >
                {/* Side Panel Header */}
                <div className="p-3 bg-gradient-to-b from-white/[0.03] to-transparent flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    {expandedSection === 'personalization' && <Settings className="w-3.5 h-3.5 text-indigo-400" />}
                    {expandedSection === 'profile' && <User className="w-3.5 h-3.5 text-sky-400" />}
                    {expandedSection === 'security' && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                    {expandedSection === 'developer' && <Key className="w-3.5 h-3.5 text-indigo-400" />}
                    {expandedSection === 'audit' && <Scale className="w-3.5 h-3.5 text-emerald-400" />}
                    {expandedSection === 'support' && <LifeBuoy className="w-3.5 h-3.5 text-indigo-400" />}
                    <span className="font-bold uppercase tracking-wider text-[9.5px]">
                      {expandedSection === 'personalization' && 'Personalization'}
                      {expandedSection === 'profile' && 'Profile & Verification'}
                      {expandedSection === 'security' && 'Security & Sessions'}
                      {expandedSection === 'developer' && 'API Gateways & Dev'}
                      {expandedSection === 'audit' && 'Compliance & Audit'}
                      {expandedSection === 'support' && 'Contact Support'}
                    </span>
                  </div>
                  <button
                    onClick={() => setExpandedSection(null)}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[8px] font-bold uppercase rounded cursor-pointer transition-colors border border-white/5"
                  >
                    CLOSE [X]
                  </button>
                </div>

                {/* Side Panel Body (Scrollable Content) */}
                <div className="p-3.5 space-y-4 overflow-y-auto flex-1 text-left custom-scrollbar no-scrollbar">
                  
                  {/* CATEGORY 1: PERSONALIZATION CONTENT */}
                  {expandedSection === 'personalization' && (
                    <>
                      {/* Theme selection */}
                      <div className="space-y-2">
                        <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Appearance Theme</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: 'terminal-dark', name: 'Terminal Dark' },
                            { id: 'light', name: 'Light' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => handleAppearanceChange(opt.id as any)}
                              className={`py-1.5 border text-center rounded cursor-pointer transition-all ${
                                appearance === opt.id 
                                  ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-300 font-bold' 
                                  : 'bg-black/35 border-white/5 text-white/50 hover:text-white hover:bg-white/[0.01]'
                              }`}
                            >
                              {opt.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Language Selection */}
                      <div className="space-y-2">
                        <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Language Selection</span>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as any)}
                          className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white/85 focus:outline-none focus:border-indigo-500/50 cursor-pointer font-mono"
                        >
                          <option value="en">English (US)</option>
                          <option value="sw">Swahili (Kenya)</option>
                          <option value="fr">French (France)</option>
                          <option value="es">Spanish (Spain)</option>
                        </select>
                      </div>

                      {/* Timezone and Currency Selection */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-2">
                          <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Timezone</span>
                          <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white/85 focus:outline-none focus:border-indigo-500/50 cursor-pointer font-mono"
                          >
                            <option value="UTC">UTC (Zulu)</option>
                            <option value="EAT">Nairobi (EAT)</option>
                            <option value="EST">New York (EST)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Currency</span>
                          <select
                            value={displayCurrency}
                            onChange={(e) => setDisplayCurrency(e.target.value as any)}
                            className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white/85 focus:outline-none focus:border-indigo-500/50 cursor-pointer font-mono"
                          >
                            <option value="USD">USD ($)</option>
                            <option value="KES">KES (Sh)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </div>
                      </div>

                      {/* Default workspace */}
                      <div className="space-y-2">
                        <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Default Initial</span>
                        <select
                          value={defaultWorkspace}
                          onChange={(e) => setDefaultWorkspace(e.target.value as any)}
                          className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white/85 focus:outline-none focus:border-indigo-500/50 cursor-pointer font-mono"
                        >
                          <option value="MARKETS">Markets</option>
                          <option value="PORTFOLIO">Portfolio</option>
                          <option value="FUNDING">Wallet</option>
                        </select>
                      </div>

                      {/* Alert toggles */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Alert Dispatchers</span>
                        <div className="space-y-2">
                          {[
                            { key: 'push', label: 'Push Notifications' },
                            { key: 'security', label: 'Security Critical Alerts' },
                            { key: 'investment', label: 'Execution/Fills Alerts' }
                          ].map(notif => (
                            <label key={notif.key} className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={(notifications as any)[notif.key]}
                                onChange={(e) => setNotifications({ ...notifications, [notif.key]: e.target.checked })}
                                className="rounded bg-black border-white/15 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white/70 hover:text-white transition-colors">{notif.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* CATEGORY 2: PROFILE CONTENT */}
                  {expandedSection === 'profile' && (
                    <>
                      {/* Identity ledger form */}
                      <div className="p-3 bg-black/20 border border-white/5 rounded-lg space-y-3">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                          <span className="font-bold text-indigo-400 uppercase tracking-tight text-[8px]">Identity Ledger</span>
                          <button
                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                            className="text-[7.5px] text-white/50 hover:text-indigo-400 flex items-center gap-0.5 font-bold uppercase cursor-pointer"
                          >
                            <Edit2 className="w-2.5 h-2.5" /> {isEditingProfile ? 'Cancel' : 'Edit'}
                          </button>
                        </div>
                        
                        <div className="space-y-2.5">
                          <div>
                            <span className="text-white/35 block text-[7.5px] uppercase font-bold tracking-wider">Full Name</span>
                            {isEditingProfile ? (
                              <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-black/50 border border-white/15 rounded px-2 py-1 text-[9px] text-white focus:outline-none focus:border-indigo-500"
                              />
                            ) : (
                              <span className="text-white font-bold">{fullName}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-white/35 block text-[7.5px] uppercase font-bold tracking-wider">Phone Contact</span>
                            {isEditingProfile ? (
                              <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-black/50 border border-white/15 rounded px-2 py-1 text-[9px] text-white focus:outline-none focus:border-indigo-500"
                              />
                            ) : (
                              <span className="text-white/80">{phone}</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-white/35 block text-[7.5px] uppercase font-bold tracking-wider">Country</span>
                              {isEditingProfile ? (
                                <input
                                  type="text"
                                  value={country}
                                  onChange={(e) => setCountry(e.target.value)}
                                  className="w-full bg-black/50 border border-white/15 rounded px-2 py-1 text-[9px] text-white focus:outline-none focus:border-indigo-500"
                                />
                              ) : (
                                <span className="text-white/80">{country}</span>
                              )}
                            </div>
                            <div>
                              <span className="text-white/35 block text-[7.5px] uppercase font-bold tracking-wider">Tax Residency</span>
                              {isEditingProfile ? (
                                <input
                                  type="text"
                                  value={taxResidency}
                                  onChange={(e) => setTaxResidency(e.target.value)}
                                  className="w-full bg-black/50 border border-white/15 rounded px-2 py-1 text-[9px] text-white focus:outline-none focus:border-indigo-500"
                                />
                              ) : (
                                <span className="text-white/80">{taxResidency}</span>
                              )}
                            </div>
                          </div>

                          {isEditingProfile && (
                            <button
                              onClick={() => setIsEditingProfile(false)}
                              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-[8px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            >
                              <Save className="w-2.5 h-2.5" /> Save Profile
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Verification Checks */}
                      <div className="space-y-2">
                        <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Verification & KYC Status</span>
                        <div className="border border-white/5 rounded-lg divide-y divide-white/5 bg-black/20 text-[8.5px]">
                          {[
                            { label: 'Identity Check', status: 'VERIFIED', class: 'text-emerald-400' },
                            { label: 'Address Check', status: 'VERIFIED', class: 'text-emerald-400' },
                            { label: 'Tax Residency Filing', status: 'VERIFIED', class: 'text-emerald-400' }
                          ].map((v, i) => (
                            <div key={i} className="flex justify-between items-center p-2">
                              <span className="text-white/70">{v.label}</span>
                              <span className={`font-bold ${v.class}`}>{v.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tax Filing Downloads */}
                      <div className="space-y-2">
                        <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Compiled Tax Filings</span>
                        <div className="p-2 bg-black/25 border border-white/5 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="text-white block font-bold leading-none">IRS W-8BEN Form</span>
                            <span className="text-[7.5px] text-white/30 block mt-0.5">Filed: 2026-01-10</span>
                          </div>
                          <button
                            onClick={() => alert("Initiating IRS W-8BEN document export stream...")}
                            className="p-1.5 hover:bg-white/5 rounded text-indigo-400 cursor-pointer"
                            title="Download Tax Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* CATEGORY 3: SECURITY CONTENT */}
                  {expandedSection === 'security' && (
                    <>
                      {/* Auto-Logout Idle Timer Setting */}
                      <div className="p-3 bg-black/20 border border-white/5 rounded-lg space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[8px] text-amber-500 font-bold uppercase tracking-wider block">Auto-Logout Security Guard</span>
                            <span className="text-[7.5px] text-white/35 block mt-0.5">Force secure termination after idle duration</span>
                          </div>
                          <span className={`text-[7px] px-1.5 py-0.5 font-bold uppercase rounded ${idleTimeout !== 'off' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-white/5 text-white/30 border border-white/5'}`}>
                            {idleTimeout === 'off' ? 'INACTIVE' : 'ARMED'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={idleTimeout}
                            onChange={(e) => onIdleTimeoutChange(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white/85 text-[8.5px] focus:outline-none focus:border-indigo-500/50 cursor-pointer font-mono"
                          >
                            <option value="off">Disabled - Never Auto-Logout</option>
                            <option value="1">1 Minute (For testing)</option>
                            <option value="5">5 Minutes</option>
                            <option value="15">15 Minutes</option>
                            <option value="30">30 Minutes</option>
                            <option value="60">1 Hour</option>
                          </select>
                        </div>
                      </div>

                      {/* Password reset widget */}
                      <div className="p-3 bg-black/20 border border-white/5 rounded-lg space-y-3">
                        <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider block">Cryptographic Password Key</span>
                        <div className="space-y-2 text-[8.5px]">
                          <input
                            type="password"
                            placeholder="Current Password"
                            value={passwords.current}
                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-[8.5px] focus:outline-none focus:border-indigo-500/50"
                          />
                          <input
                            type="password"
                            placeholder="New Password (12+ chars)"
                            value={passwords.new}
                            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-[8.5px] focus:outline-none focus:border-indigo-500/50"
                          />
                          <button
                            onClick={() => {
                              if (!passwords.current || !passwords.new) {
                                alert("Please fill password credentials.");
                                return;
                              }
                              alert("Master password updated successfully.");
                              setPasswords({ current: '', new: '', confirm: '' });
                            }}
                            className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[7.5px] font-bold uppercase cursor-pointer transition-colors"
                          >
                            Update Password
                          </button>
                        </div>
                      </div>

                      {/* Passkey authentication status */}
                      <div className="flex justify-between items-center p-3 bg-black/25 border border-white/5 rounded-lg text-[8.5px]">
                        <div>
                          <span className="text-white block font-bold">FIDO2 Hardware Key</span>
                          <span className="text-[7.5px] text-white/30 block mt-0.5">Hardware token prompt</span>
                        </div>
                        <button
                          onClick={() => {
                            setPasskeyStatus(!passkeyStatus);
                            alert(passkeyStatus ? "Passkey unregistered." : "FIDO2 key verified & active!");
                          }}
                          className={`px-2 py-1 rounded text-[7.5px] font-bold uppercase border cursor-pointer transition-colors ${
                            passkeyStatus ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-300'
                          }`}
                        >
                          {passkeyStatus ? 'ACTIVE' : 'REGISTER'}
                        </button>
                      </div>

                      {/* Active sessions list */}
                      <div className="space-y-2">
                        <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Active Operational Sessions</span>
                        <div className="border border-white/5 rounded-lg divide-y divide-white/5 bg-black/25 text-[8.5px]">
                          {activeDevices.map(dev => (
                            <div key={dev.id} className="p-2 flex justify-between items-center">
                              <div>
                                <span className="text-white font-bold block leading-none">{dev.name}</span>
                                <span className="text-[7.5px] text-white/30 block mt-1">{dev.browser} • {dev.location}</span>
                              </div>
                              <span className="text-[7px] text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 border border-emerald-500/15 rounded uppercase font-bold">
                                {dev.lastActive}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Login History Log */}
                      <div className="space-y-2">
                        <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Cryptographic Logbook</span>
                        <div className="bg-black/30 border border-white/5 rounded-lg p-2 divide-y divide-white/5 max-h-24 overflow-y-auto no-scrollbar font-mono text-[7.5px] text-white/40">
                          {loginHistory.map((lh, idx) => (
                            <div key={idx} className="py-1 flex justify-between items-center">
                              <span>{lh.timestamp} ({lh.device})</span>
                              <span className={lh.status === 'Success' ? 'text-emerald-400' : 'text-rose-400'}>{lh.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* CATEGORY 4: DEVELOPER CONTENT */}
                  {expandedSection === 'developer' && (
                    <>
                      {/* API Keys management */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white/40 font-bold uppercase text-[8px] tracking-wider">Active API Credentials</span>
                          <button
                            onClick={() => setIsCreatingKey(!isCreatingKey)}
                            className="text-[7.5px] text-indigo-400 flex items-center gap-0.5 font-bold uppercase cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" /> NEW
                          </button>
                        </div>

                        {isCreatingKey && (
                          <div className="p-2.5 bg-black/45 border border-indigo-500/20 rounded-lg space-y-2 mb-1.5 animate-fadeIn">
                            <input
                              type="text"
                              placeholder="Key identifier label..."
                              value={newKeyName}
                              onChange={(e) => setNewKeyName(e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-[8.5px] text-white focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              onClick={handleCreateApiKey}
                              className="w-full py-1 bg-indigo-600 rounded text-[8px] font-bold uppercase transition-colors cursor-pointer"
                            >
                              Deploy Key
                            </button>
                          </div>
                        )}

                        <div className="border border-white/5 rounded-lg divide-y divide-white/5 bg-black/25 text-[8.5px]">
                          {apiKeys.map(key => (
                            <div key={key.id} className="p-2 flex justify-between items-center">
                              <div>
                                <span className="text-white font-bold block leading-none">{key.name}</span>
                                <span className="text-[7.5px] text-white/30 block mt-1">
                                  {revealKeyId === key.id ? 'mtx_live_pk_8830cf8aa249af' : key.prefix}
                                </span>
                              </div>
                              <button
                                onClick={() => setRevealKeyId(revealKeyId === key.id ? null : key.id)}
                                className="text-[7.5px] text-indigo-400 font-bold tracking-tight uppercase hover:underline cursor-pointer"
                              >
                                {revealKeyId === key.id ? 'Hide' : 'Reveal'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Webhook Dispatchers */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white/40 font-bold uppercase text-[8px] tracking-wider">Active Webhooks</span>
                          <button
                            onClick={() => setIsCreatingWebhook(!isCreatingWebhook)}
                            className="text-[7.5px] text-indigo-400 flex items-center gap-0.5 font-bold uppercase cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" /> NEW
                          </button>
                        </div>

                        {isCreatingWebhook && (
                          <div className="p-2.5 bg-black/45 border border-indigo-500/20 rounded-lg space-y-2 mb-1.5 animate-fadeIn">
                            <input
                              type="text"
                              placeholder="Dispatch URL: https://..."
                              value={newWebhookUrl}
                              onChange={(e) => setNewWebhookUrl(e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-[8.5px] text-white focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              onClick={handleCreateWebhook}
                              className="w-full py-1 bg-indigo-600 rounded text-[8px] font-bold uppercase transition-colors cursor-pointer"
                            >
                              Bind Webhook
                            </button>
                          </div>
                        )}

                        <div className="p-2 bg-black/20 border border-white/5 rounded-lg divide-y divide-white/5 text-[8.5px]">
                          {webhooks.map(wh => (
                            <div key={wh.id} className="py-1.5">
                              <span className="text-white block font-bold leading-none truncate max-w-[280px]" title={wh.url}>
                                {wh.url}
                              </span>
                              <span className="text-[7.5px] text-emerald-400 block mt-1 font-bold">Active • {wh.events}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Connected Applications */}
                      <div className="space-y-2">
                        <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Authorized External Apps</span>
                        <div className="border border-white/5 rounded-lg divide-y divide-white/5 bg-black/25 text-[8.5px]">
                          {connectedApps.map((app, idx) => (
                            <div key={idx} className="p-2 flex justify-between items-center">
                              <div>
                                <span className="text-white font-bold block leading-none">{app.name}</span>
                                <span className="text-[7.5px] text-white/30 block mt-1">{app.scope}</span>
                              </div>
                              <span className="text-[7px] text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 border border-emerald-500/10 rounded uppercase font-bold">
                                {app.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* CATEGORY 5: COMPLIANCE & AUDIT CONTENT */}
                  {expandedSection === 'audit' && (
                    <>
                      {/* Logs Search Filter */}
                      <div className="space-y-2">
                        <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Audit Ledger Filter</span>
                        <input
                          type="text"
                          placeholder="Search actions (e.g. key, login)..."
                          value={auditQuery}
                          onChange={(e) => setAuditQuery(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1 text-white text-[8.5px] focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Audit Log records */}
                      <div className="space-y-2">
                        <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Recent Audit Records</span>
                        <div className="bg-black/30 border border-white/5 rounded-lg p-2 divide-y divide-white/5 max-h-32 overflow-y-auto no-scrollbar font-mono text-[7.5px]">
                          {auditLogs
                            .filter(log => !auditQuery || log.action.toLowerCase().includes(auditQuery.toLowerCase()) || log.detail.toLowerCase().includes(auditQuery.toLowerCase()))
                            .map((log, idx) => (
                              <div key={idx} className="py-1.5 flex justify-between items-start gap-1">
                                <div className="text-left">
                                  <span className="text-white/70 font-bold block">{log.action}</span>
                                  <span className="text-[7px] text-white/40 block mt-0.5">{log.detail}</span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-white/30 block font-mono">{log.timestamp}</span>
                                  <span className="text-[6.5px] text-indigo-400 block mt-0.5">{log.ip}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Data usage privacy toggles */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Privacy & Data Sharing</span>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={privacyDiag}
                              onChange={(e) => setPrivacyDiag(e.target.checked)}
                              className="rounded bg-black border-white/15 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-white/60 text-[8px]">Anonymous diagnostics & telemetry</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={privacyPromo}
                              onChange={(e) => setPrivacyPromo(e.target.checked)}
                              className="rounded bg-black border-white/15 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-white/60 text-[8px]">Personalized promotional dispatch</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* CATEGORY 6: CONTACT SUPPORT CONTENT */}
                  {expandedSection === 'support' && (
                    <>
                      {supportSuccess ? (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center space-y-3 animate-fadeIn">
                          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                          <div>
                            <span className="text-white block font-bold text-[10px] uppercase">Ticket Successfully Logged</span>
                            <span className="text-[8px] text-emerald-300 font-mono block mt-1">ID: {supportSuccess}</span>
                          </div>
                          <p className="text-[8px] text-white/60 leading-normal">
                            Your support ticket and attached terminal diagnostic telemetry logs have been routed to MTX. Expect a resolution stream within 15 minutes.
                          </p>
                          <button
                            onClick={() => setSupportSuccess(null)}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded text-[7.5px] font-bold uppercase transition-colors cursor-pointer text-white/80"
                          >
                            Create New Ticket
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleCreateTicket} className="space-y-3.5">
                          <div>
                            <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider mb-1.5">Support Ticket</span>
                            <p className="text-[8px] text-white/50 leading-relaxed mb-2.5">
                              Submit a priority ticket directly to our terminal engineering team. The operational telemetry shown below is automatically compiled and securely attached.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-white/35 block text-[7.5px] uppercase font-bold tracking-wider">Category</span>
                              <select
                                value={supportCategory}
                                onChange={(e) => setSupportCategory(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white/85 text-[8.5px] focus:outline-none focus:border-indigo-500/50 cursor-pointer font-mono"
                              >
                                <option value="Trading/Execution">Trading/Execution</option>
                                <option value="Deposit/Withdrawal">Funds/Wallet</option>
                                <option value="API Gateway">API/Webhooks</option>
                                <option value="UI & Terminal Bug">UI/Terminal Bug</option>
                                <option value="Other Query">Other Query</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <span className="text-white/35 block text-[7.5px] uppercase font-bold tracking-wider">Priority</span>
                              <select
                                value={supportPriority}
                                onChange={(e) => setSupportPriority(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white/85 text-[8.5px] focus:outline-none focus:border-indigo-500/50 cursor-pointer font-mono"
                              >
                                <option value="Low">Low - Info</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High - Priority</option>
                                <option value="Critical">Critical - Urgent</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-white/35 block text-[7.5px] uppercase font-bold tracking-wider">Subject</span>
                            <input
                              type="text"
                              required
                              placeholder="Describe issue summary..."
                              value={supportSubject}
                              onChange={(e) => setSupportSubject(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-white text-[8.5px] focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-white/35 block text-[7.5px] uppercase font-bold tracking-wider">Detailed Message</span>
                            <textarea
                              required
                              rows={3}
                              placeholder="Provide step-by-step issue description..."
                              value={supportMessage}
                              onChange={(e) => setSupportMessage(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-white text-[8.5px] focus:outline-none focus:border-indigo-500 resize-none font-mono"
                            />
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={attachDiagnostics}
                                onChange={(e) => setAttachDiagnostics(e.target.checked)}
                                className="rounded bg-black border-white/15 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-white/60 text-[8px] font-bold uppercase tracking-tight">Attach diagnostics log dump</span>
                            </label>

                            {attachDiagnostics && (
                              <div className="bg-black/50 border border-white/5 rounded p-2 text-white/30 font-mono text-[6.5px] leading-tight select-all max-h-24 overflow-y-auto no-scrollbar whitespace-pre border-dashed mt-1.5">
                                {getDiagnosticsLog()}
                              </div>
                            )}
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-[8px] font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Deploy Support Ticket
                          </button>
                        </form>
                      )}

                      {/* Submitted Tickets History */}
                      {supportTickets.length > 0 && (
                        <div className="space-y-2 pt-2.5 border-t border-white/5">
                          <span className="text-white/40 font-bold uppercase block text-[8px] tracking-wider">Active Ticket Streams ({supportTickets.length})</span>
                          <div className="space-y-1.5 max-h-28 overflow-y-auto no-scrollbar">
                            {supportTickets.map((t) => (
                              <div key={t.id} className="p-2 bg-black/25 border border-white/5 rounded text-[8px] space-y-1 text-left">
                                <div className="flex justify-between items-center">
                                  <span className="text-indigo-300 font-bold font-mono">{t.id}</span>
                                  <span className={`px-1 rounded text-[6.5px] font-black ${
                                    t.priority === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                    t.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-white/5 text-white/50 border border-white/5'
                                  }`}>
                                    {t.priority.toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-white font-bold block truncate">{t.subject}</span>
                                <div className="flex justify-between items-center text-[7px] text-white/35">
                                  <span>{t.category}</span>
                                  <span className="text-emerald-400 font-bold">ROUTE_QUEUED</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN DROPDOWN TERMINAL CONTROL PANEL */}
          <motion.div
            id="institutional-dropdown-menu"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-80 sm:w-[350px] bg-[#08080c] border border-white/10 rounded-lg shadow-[0_15px_40px_rgba(0,0,0,0.85)] overflow-hidden divide-y divide-white/5 font-mono text-[10px] text-white flex flex-col"
          >
            {/* Section 1: Trader Identity Profile & Status */}
            <div className="p-3.5 bg-gradient-to-b from-white/[0.03] to-transparent text-left shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-white/30 text-[8.5px] font-black uppercase tracking-widest block">TRADER PROFILE</span>
                <span className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-[8px] text-indigo-300 font-bold tracking-widest uppercase">
                  TIER-1 CORE
                </span>
              </div>
              <div className="mt-1.5">
                <span className="text-[11px] font-bold text-white block truncate max-w-[280px]" title={traderEmail}>
                  {traderEmail}
                </span>
              </div>
            </div>

            {/* Section 2: Diagnostics Ledger */}
            <div className="p-3 text-left space-y-1 bg-black/10 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-white/30 text-[8px] font-bold uppercase">CLEARANCE:</span>
                <span className="text-white/80 font-bold flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-indigo-400 stroke-[2.5px]" />
                  LEVEL-2
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/30 text-[8px] font-bold uppercase">GATEWAY LINK:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Wifi className="w-2.5 h-2.5 text-emerald-400 stroke-[2.5px]" />
                  {brokerPing}ms (LIVE)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/30 text-[8px] font-bold uppercase">REGION:</span>
                <span className="text-white/80 font-bold">KENYA (AFRICA)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/30 text-[8px] font-bold uppercase">SESSION:</span>
                <span className="text-indigo-300 font-bold font-mono">{formatTime(sessionSeconds)}</span>
              </div>
            </div>

            {/* Section 3: Categories Directory Buttons (Launches Flyouts on left) */}
            <div className="text-left divide-y divide-white/[0.03] shrink-0">
              
              {/* 3.1: PERSONALIZATION BUTTON */}
              <div>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'personalization' ? null : 'personalization')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 transition-all cursor-pointer group ${
                    expandedSection === 'personalization' 
                      ? 'bg-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500 font-bold' 
                      : 'text-white/70 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Settings className={`w-3.5 h-3.5 ${expandedSection === 'personalization' ? 'text-indigo-400' : 'text-white/40'}`} />
                    <span className="font-bold text-[9.5px] uppercase">Personalization</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[7.5px] text-indigo-400/70 font-bold group-hover:opacity-100 opacity-0 transition-opacity uppercase mr-1">Configure &laquo;</span>
                    <ChevronRight className={`w-3 h-3 text-white/30 transition-transform ${expandedSection === 'personalization' ? 'rotate-180 text-indigo-400' : ''}`} />
                  </div>
                </button>
              </div>

              {/* 3.2: PROFILE & KYC BUTTON */}
              <div>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'profile' ? null : 'profile')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 transition-all cursor-pointer group ${
                    expandedSection === 'profile' 
                      ? 'bg-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500 font-bold' 
                      : 'text-white/70 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className={`w-3.5 h-3.5 ${expandedSection === 'profile' ? 'text-sky-400' : 'text-white/40'}`} />
                    <span className="font-bold text-[9.5px] uppercase">Profile & Verification</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[7.5px] text-sky-400/70 font-bold group-hover:opacity-100 opacity-0 transition-opacity uppercase mr-1">Examine &laquo;</span>
                    <ChevronRight className={`w-3 h-3 text-white/30 transition-transform ${expandedSection === 'profile' ? 'rotate-180 text-sky-400' : ''}`} />
                  </div>
                </button>
              </div>

              {/* 3.3: SECURITY & SESSIONS BUTTON */}
              <div>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'security' ? null : 'security')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 transition-all cursor-pointer group ${
                    expandedSection === 'security' 
                      ? 'bg-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500 font-bold' 
                      : 'text-white/70 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lock className={`w-3.5 h-3.5 ${expandedSection === 'security' ? 'text-amber-500' : 'text-white/40'}`} />
                    <span className="font-bold text-[9.5px] uppercase">Security & Active Sessions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[7.5px] text-amber-500/70 font-bold group-hover:opacity-100 opacity-0 transition-opacity uppercase mr-1">Audit Key &laquo;</span>
                    <ChevronRight className={`w-3 h-3 text-white/30 transition-transform ${expandedSection === 'security' ? 'rotate-180 text-amber-500' : ''}`} />
                  </div>
                </button>
              </div>

              {/* 3.4: DEVELOPER CONSOLE BUTTON */}
              <div>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'developer' ? null : 'developer')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 transition-all cursor-pointer group ${
                    expandedSection === 'developer' 
                      ? 'bg-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500 font-bold' 
                      : 'text-white/70 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Key className={`w-3.5 h-3.5 ${expandedSection === 'developer' ? 'text-indigo-450' : 'text-white/40'}`} />
                    <span className="font-bold text-[9.5px] uppercase">Developer & API Gateways</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[7.5px] text-indigo-400/70 font-bold group-hover:opacity-100 opacity-0 transition-opacity uppercase mr-1">Gateways &laquo;</span>
                    <ChevronRight className={`w-3 h-3 text-white/30 transition-transform ${expandedSection === 'developer' ? 'rotate-180 text-indigo-400' : ''}`} />
                  </div>
                </button>
              </div>

              {/* 3.5: AUDIT LOGS BUTTON */}
              <div>
                <button
                  onClick={() => setExpandedSection(expandedSection === 'audit' ? null : 'audit')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 transition-all cursor-pointer group ${
                    expandedSection === 'audit' 
                      ? 'bg-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500 font-bold' 
                      : 'text-white/70 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Scale className={`w-3.5 h-3.5 ${expandedSection === 'audit' ? 'text-emerald-400' : 'text-white/40'}`} />
                    <span className="font-bold text-[9.5px] uppercase">Compliance & Audit Logs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[7.5px] text-emerald-400/70 font-bold group-hover:opacity-100 opacity-0 transition-opacity uppercase mr-1">History &laquo;</span>
                    <ChevronRight className={`w-3 h-3 text-white/30 transition-transform ${expandedSection === 'audit' ? 'rotate-180 text-emerald-400' : ''}`} />
                  </div>
                </button>
              </div>

            </div>

            {/* Section 4: Core Utility Controls (Original dropdown utilities) */}
            <div className="p-3 text-left space-y-2 bg-gradient-to-t from-white/[0.01] to-transparent shrink-0">
              <span className="text-white/30 text-[8px] font-bold uppercase block">CORE UTILITIES</span>
              
              {/* Audio Warnings Switch */}
              <button
                onClick={onToggleSoundAlerts}
                className="w-full p-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-between text-white/80 transition-all cursor-pointer border border-white/5 hover:border-white/10"
              >
                <span className="flex items-center gap-2">
                  {soundAlertsEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5 text-white/30" />}
                  <span className={soundAlertsEnabled ? 'text-white font-bold' : 'text-white/40'}>System Audio Alerts</span>
                </span>
                <span className={`text-[7.5px] font-black px-1 py-0.2 rounded uppercase ${soundAlertsEnabled ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/30 border border-white/5'}`}>
                  {soundAlertsEnabled ? 'ACTIVE' : 'MUTED'}
                </span>
              </button>

              {/* Access Bearer Token Copy */}
              <button
                onClick={handleCopyBearerTokenLocal}
                className="w-full p-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-between text-white/80 transition-all cursor-pointer border border-white/5 hover:border-white/10 group"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-bold">Access Bearer Token</span>
                </span>
                {copiedToken ? (
                  <span className="text-emerald-400 text-[7.5px] font-bold uppercase flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> COPIED
                  </span>
                ) : (
                  <span className="text-white/30 text-[7.5px] font-bold group-hover:text-white/60 transition-colors uppercase">
                    COPY KEY
                  </span>
                )}
              </button>

              {/* Contact Support */}
              <button
                onClick={() => setExpandedSection(expandedSection === 'support' ? null : 'support')}
                className={`w-full p-2 rounded flex items-center justify-between transition-all cursor-pointer border ${
                  expandedSection === 'support'
                    ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300 font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/5 hover:border-white/10'
                }`}
                title="Contact Support with automatically generated system diagnostics"
              >
                <span className="flex items-center gap-2">
                  <LifeBuoy className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-bold">Contact Support</span>
                </span>
                <span className="text-[7px] font-extrabold text-indigo-400/70 uppercase">
                  OPEN TICKET
                </span>
              </button>
            </div>

            {/* Section 5: Secure Terminate Session (Logout) */}
            <div className="p-3 bg-black/45 shrink-0">
              <button
                onClick={onLogout}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_12px_rgba(99,102,241,0.25)] text-white font-bold uppercase rounded text-[9.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-indigo-500/20"
                title="Secure Logout from Quant Session"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.5px]" />
                Secure Terminate Session
              </button>
            </div>

          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}
