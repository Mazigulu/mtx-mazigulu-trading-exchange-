/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Key, 
  Send, 
  Bell, 
  Check, 
  Copy, 
  Download, 
  ShieldCheck, 
  Signal, 
  Database,
  Unlock,
  Lock,
  User,
  Eye,
  EyeOff,
  Sliders,
  AlertTriangle,
  Bot,
  Target,
  Save,
  Layout,
  Trash2,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import Mt5BridgeGuide from './Mt5BridgeGuide';
import QuickKeysPanel from './QuickKeysPanel';

export interface WorkspacePreset {
  id: string;
  name: string;
  isFactory?: boolean;
  createdAt?: string;
  layoutState: {
    showSentimentGauge: boolean;
    showMarketSentimentHeatmap: boolean;
    showSweepAlert: boolean;
    showHeatmap: boolean;
    showTWVP: boolean;
    showSessionPerformance: boolean;
    showPriceAlertsPanel: boolean;
  };
}

interface SettingsPanelProps {
  layoutState?: {
    showSentimentGauge: boolean;
    showMarketSentimentHeatmap: boolean;
    showSweepAlert: boolean;
    showHeatmap: boolean;
    showTWVP: boolean;
    showSessionPerformance: boolean;
    showPriceAlertsPanel: boolean;
  };
  setLayoutState?: {
    setShowSentimentGauge: (val: boolean) => void;
    setShowMarketSentimentHeatmap: (val: boolean) => void;
    setShowSweepAlert: (val: boolean) => void;
    setShowHeatmap: (val: boolean) => void;
    setShowTWVP: (val: boolean) => void;
    setShowSessionPerformance: (val: boolean) => void;
    setShowPriceAlertsPanel: (val: boolean) => void;
  };
}

interface ConnectionState {
  brokerServer: string;
  brokerLogin: string;
  brokerMode: 'SANDBOX' | 'LIVE_MT5' | 'FUNDED_PROP';
  telegramToken: string;
  telegramChatId: string;
  latencyLimit: number;
  soundAlerts: boolean;
  fvgAudioAlerts: boolean;
  smsOnExecution: boolean;
  telegramOnExecution: boolean;
  mockApiKey: string;
  volatilityAlertEnabled: boolean;
  desktopNotificationsEnabled?: boolean;
  dailyPnLGoal?: number;
  dailyPnLAlertEnabled?: boolean;
  dailyPnLPositiveThreshold?: number;
  dailyPnLNegativeThreshold?: number;
}

export default function SettingsPanel({ layoutState, setLayoutState }: SettingsPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestSuccess, setTelegramTestSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Snapshot Snapshot Presets State
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [snapshotFeedback, setSnapshotFeedback] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<WorkspacePreset[]>(() => {
    try {
      const saved = localStorage.getItem('apex_workspace_layout_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to parse layout presets', e);
      return [];
    }
  });

  const FACTORY_PRESETS: WorkspacePreset[] = [
    {
      id: 'factory_unlocked',
      name: 'Full Analyst Layout',
      isFactory: true,
      layoutState: {
        showSentimentGauge: true,
        showMarketSentimentHeatmap: true,
        showSweepAlert: true,
        showHeatmap: true,
        showTWVP: true,
        showSessionPerformance: true,
        showPriceAlertsPanel: true,
      }
    },
    {
      id: 'factory_minimalist',
      name: 'Execution Clean Space',
      isFactory: true,
      layoutState: {
        showSentimentGauge: false,
        showMarketSentimentHeatmap: false,
        showSweepAlert: false,
        showHeatmap: false,
        showTWVP: false,
        showSessionPerformance: false,
        showPriceAlertsPanel: false,
      }
    },
    {
      id: 'factory_sentiment',
      name: 'Sentiment & Flows Focus',
      isFactory: true,
      layoutState: {
        showSentimentGauge: true,
        showMarketSentimentHeatmap: true,
        showSweepAlert: true,
        showHeatmap: true,
        showTWVP: false,
        showSessionPerformance: false,
        showPriceAlertsPanel: false,
      }
    },
    {
      id: 'factory_analysis',
      name: 'Core Market Analysis',
      isFactory: true,
      layoutState: {
        showSentimentGauge: false,
        showMarketSentimentHeatmap: false,
        showSweepAlert: false,
        showHeatmap: false,
        showTWVP: true,
        showSessionPerformance: true,
        showPriceAlertsPanel: true,
      }
    }
  ];

  const isPresetMatching = (presetState: WorkspacePreset['layoutState']) => {
    if (!layoutState) return false;
    return (
      layoutState.showSentimentGauge === presetState.showSentimentGauge &&
      layoutState.showMarketSentimentHeatmap === presetState.showMarketSentimentHeatmap &&
      layoutState.showSweepAlert === presetState.showSweepAlert &&
      layoutState.showHeatmap === presetState.showHeatmap &&
      layoutState.showTWVP === presetState.showTWVP &&
      layoutState.showSessionPerformance === presetState.showSessionPerformance &&
      layoutState.showPriceAlertsPanel === presetState.showPriceAlertsPanel
    );
  };

  const handleSaveSnapshot = () => {
    if (!newSnapshotName.trim() || !layoutState) return;
    
    const newSnapshot: WorkspacePreset = {
      id: `custom_${Date.now()}`,
      name: newSnapshotName.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString(),
      layoutState: {
        showSentimentGauge: layoutState.showSentimentGauge,
        showMarketSentimentHeatmap: layoutState.showMarketSentimentHeatmap,
        showSweepAlert: layoutState.showSweepAlert,
        showHeatmap: layoutState.showHeatmap,
        showTWVP: layoutState.showTWVP,
        showSessionPerformance: layoutState.showSessionPerformance,
        showPriceAlertsPanel: layoutState.showPriceAlertsPanel,
      }
    };

    const updated = [...customPresets, newSnapshot];
    setCustomPresets(updated);
    localStorage.setItem('apex_workspace_layout_presets', JSON.stringify(updated));
    setNewSnapshotName('');
    
    setSnapshotFeedback(`Snapshot "${newSnapshot.name}" saved!`);
    setTimeout(() => setSnapshotFeedback(null), 3000);
  };

  const handleLoadSnapshot = (preset: WorkspacePreset) => {
    if (!setLayoutState) return;
    
    setLayoutState.setShowSentimentGauge(preset.layoutState.showSentimentGauge);
    setLayoutState.setShowMarketSentimentHeatmap(preset.layoutState.showMarketSentimentHeatmap);
    setLayoutState.setShowSweepAlert(preset.layoutState.showSweepAlert);
    setLayoutState.setShowHeatmap(preset.layoutState.showHeatmap);
    setLayoutState.setShowTWVP(preset.layoutState.showTWVP);
    setLayoutState.setShowSessionPerformance(preset.layoutState.showSessionPerformance);
    setLayoutState.setShowPriceAlertsPanel(preset.layoutState.showPriceAlertsPanel);

    setSnapshotFeedback(`Loaded "${preset.name}" preset!`);
    setTimeout(() => setSnapshotFeedback(null), 3000);
  };

  const handleDeleteSnapshot = (id: string, name: string) => {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    localStorage.setItem('apex_workspace_layout_presets', JSON.stringify(updated));
    
    setSnapshotFeedback(`Snapshot "${name}" deleted.`);
    setTimeout(() => setSnapshotFeedback(null), 3000);
  };

  const [settings, setSettings] = useState<ConnectionState>(() => {
    try {
      const saved = localStorage.getItem('apex_institutional_settings');
      if (saved) {
        return {
          brokerServer: 'icmarkets-demo.com',
          brokerLogin: '88402941',
          brokerMode: 'SANDBOX',
          telegramToken: '',
          telegramChatId: '',
          latencyLimit: 45,
          soundAlerts: true,
          fvgAudioAlerts: false,
          smsOnExecution: false,
          telegramOnExecution: true,
          mockApiKey: '••••••••••••••••••••••••••••',
          volatilityAlertEnabled: false,
          desktopNotificationsEnabled: false,
          dailyPnLGoal: 1000,
          dailyPnLAlertEnabled: false,
          dailyPnLPositiveThreshold: 2000,
          dailyPnLNegativeThreshold: -1000,
          ...JSON.parse(saved)
        };
      }
    } catch (e) {
      console.warn('Failed to parse settings', e);
    }
    return {
      brokerServer: 'icmarkets-demo.com',
      brokerLogin: '88402941',
      brokerMode: 'SANDBOX',
      telegramToken: '',
      telegramChatId: '',
      latencyLimit: 45,
      soundAlerts: true,
      fvgAudioAlerts: false,
      smsOnExecution: false,
      telegramOnExecution: true,
      mockApiKey: '••••••••••••••••••••••••••••',
      volatilityAlertEnabled: false,
      desktopNotificationsEnabled: false,
      dailyPnLGoal: 1000,
      dailyPnLAlertEnabled: false,
      dailyPnLPositiveThreshold: 2000,
      dailyPnLNegativeThreshold: -1000,
    };
  });

  // Keep localStorage reactive and fully synchronized in real-time
  useEffect(() => {
    try {
      localStorage.setItem('apex_institutional_settings', JSON.stringify(settings));
      // Dispatch storage event so other tabs/components hear it instantly
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Failed to auto-save settings change', e);
    }
  }, [settings]);

  const [brokerPassword, setBrokerPassword] = useState('••••••••••••••••');

  const handleSave = () => {
    try {
      localStorage.setItem('apex_institutional_settings', JSON.stringify(settings));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestTelegram = () => {
    setIsTestingTelegram(true);
    setTelegramTestSuccess(false);
    setTimeout(() => {
      setIsTestingTelegram(false);
      setTelegramTestSuccess(true);
      setTimeout(() => setTelegramTestSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div id="settings-panel-root" className="space-y-6 animate-fadeIn select-none">
      
      {/* Settings Action Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-wide uppercase font-mono flex items-center gap-2">
            <Sliders className="w-4.5 h-4.5 text-indigo-400" />
            Institutional Control Room
          </h2>
          <p className="text-[11px] text-white/40 mt-1 font-mono">
            Synchronize external APIs, broker bridge configurations, automated risk parameters, and notifications.
          </p>
        </div>
        <button
          id="btn-save-control-panel-settings"
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-mono font-bold uppercase text-white shadow-lg transition-all hover:scale-102 flex items-center gap-2 cursor-pointer"
        >
          {saveSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              <span>SAVED SECURELY</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5" />
              <span>SAVE CONFIGURATION</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Column 1: Connection configurations (Spans 7 xl-columns) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Card 1: Broker Connections & MT5 */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/25 rounded">
                  <Cpu className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase text-white tracking-widest font-mono">
                    Broker Connections & MT5 Portal
                  </h3>
                  <p className="text-[10px] text-white/30">Direct execution routing to third-party endpoints.</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wide">
                BRIDGE CHANNELS ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Connection Mode */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-white/50 uppercase">Connection Protocol Mode</label>
                <select
                  value={settings.brokerMode}
                  onChange={(e) => setSettings({ ...settings, brokerMode: e.target.value as any })}
                  className="w-full bg-[#050505] border border-white/10 rounded px-2.5 py-2 text-xs text-white"
                >
                  <option value="SANDBOX">MOCK / OFFLINE SANDBOX SIMULATION</option>
                  <option value="LIVE_MT5">LIVE METATRADER 5 PORTAL (DIRECT)</option>
                  <option value="FUNDED_PROP">PROP FIRM ACCOUNT BRIDGE (FTMO/MFF)</option>
                </select>
              </div>

              {/* Server Host */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-white/50 uppercase">MetaTrader Server Address</label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.brokerServer}
                    onChange={(e) => setSettings({ ...settings, brokerServer: e.target.value })}
                    className="w-full bg-[#050505] border border-white/10 rounded pl-8.5 pr-2.5 py-2 text-xs text-white font-mono"
                    placeholder="icmarkets-live02.com"
                  />
                  <Database className="absolute left-2.5 top-2.5 w-4 h-4 text-white/20" />
                </div>
              </div>

              {/* Login ID */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-white/50 uppercase">MT5 Login Account ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.brokerLogin}
                    onChange={(e) => setSettings({ ...settings, brokerLogin: e.target.value })}
                    className="w-full bg-[#050505] border border-white/10 rounded pl-8.5 pr-2.5 py-2 text-xs text-white font-mono font-bold"
                  />
                  <User className="absolute left-2.5 top-2.5 w-4 h-4 text-white/20" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-white/50 uppercase">Terminal Gateways Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={brokerPassword}
                    onChange={(e) => setBrokerPassword(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded pl-8.5 pr-9.5 py-2 text-xs text-white font-mono"
                  />
                  <Lock className="absolute left-2.5 top-2.5 w-4 h-4 text-white/20" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 hover:text-white text-white/35 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Simulated latency threshold limit slider */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-white/50 uppercase">Failsafe Latency Cutoff Threshold</span>
                <span className="text-[11px] font-mono font-bold text-[#b45308] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {settings.latencyLimit}ms Cutoff Limit
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="100"
                value={settings.latencyLimit}
                onChange={(e) => setSettings({ ...settings, latencyLimit: parseInt(e.target.value) })}
                className="w-full h-1 bg-[#101012] rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-[9px] text-[#b45308] font-mono flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-550 shrink-0" />
                Active protection is on: Orders will abort if the bridge latency exceeds limits. Recommended: 45ms.
              </p>
            </div>
          </div>

          {/* Card 2: Telegram Integrations Bot */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/25 rounded">
                  <Bot className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase text-white tracking-widest font-mono">
                    Telegram Notification Webhooks
                  </h3>
                  <p className="text-[10px] text-white/30">Instantly receive custom FVG/order execution alerts on your phone.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-white/50 uppercase">Telegram Bot API Token</label>
                <input
                  type="password"
                  value={settings.telegramToken}
                  onChange={(e) => setSettings({ ...settings, telegramToken: e.target.value })}
                  placeholder="e.g. 523190458:AAHfj..."
                  className="w-full bg-[#050505] border border-white/10 rounded px-2.5 py-2 text-xs text-white font-mono placeholder-white/15"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-white/50 uppercase font-mono">Target Channel/Chat ID</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={settings.telegramChatId}
                    onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                    placeholder="e.g. -10041285038"
                    className="flex-1 bg-[#050505] border border-white/10 rounded px-2.5 py-2 text-xs text-white font-mono placeholder-white/15"
                  />
                  <button
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram || !settings.telegramToken}
                    className="px-3 py-2 bg-[#0c0c0e] hover:bg-white/5 border border-white/10 text-white font-mono font-bold text-[10px] uppercase rounded transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isTestingTelegram ? 'Sending...' : telegramTestSuccess ? 'Delivered ✓' : 'Test Alert'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: API Keys Storage Security */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/25 rounded">
                  <Key className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase text-white tracking-widest font-mono">
                    System Secret Credentials
                  </h3>
                  <p className="text-[10px] text-white/30">Backend authorization credentials.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-white/50 uppercase">Gemini Secret API Key</label>
              <div className="flex items-center justify-between bg-[#050505] p-3 rounded border border-white/5 font-mono text-[11px] text-white">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[#a16207]">SECURED AT SYSTEM INITIALIZATION</span>
                  <span className="text-white/20 select-none">|</span>
                  <span className="text-white/40">process.env.GEMINI_API_KEY</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/10 text-[8.5px] font-black uppercase text-emerald-400">
                  HEALTHY FEED
                </span>
              </div>
              <p className="text-[9.5px] text-white/30 leading-relaxed font-mono">
                API keys are dynamically fed from your secure workspace parameters to keep them protected from browser scraping.
              </p>
            </div>
          </div>

        </div>

        {/* Column 2: Notification Toggles & Info (Spans 5 xl-columns) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Card 4: Terminal Notification Parameters */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
              <Bell className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase text-white tracking-widest font-mono">Notification Decrypt Layer</h3>
            </div>

            <div className="space-y-4">
              
              {/* Push audio sound alert */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-white block uppercase font-mono">System Audio Pings</span>
                  <p className="text-[9.5px] text-white/40 font-mono">Sound micro pings when critical news occurs.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundAlerts}
                  onChange={(e) => setSettings({ ...settings, soundAlerts: e.target.checked })}
                  className="rounded bg-[#050505] border-white/10 text-indigo-500 h-4 w-4 accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* FVG Event notification audible */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-white block uppercase font-mono font-sans font-bold">FVG Multi-Asset Audio Alerts</span>
                  <p className="text-[9.5px] text-white/40 font-mono">Ping immediately when candles scanner registers displacement gaps.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.fvgAudioAlerts}
                  onChange={(e) => setSettings({ ...settings, fvgAudioAlerts: e.target.checked })}
                  className="rounded bg-[#050505] border-white/10 text-indigo-500 h-4 w-4 accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* SMS triggers on executions */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-white block uppercase font-mono">Failsafe SMS alerts</span>
                  <p className="text-[9.5px] text-white/40 font-mono">Dispatch international SMS carriers on order stops execution.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.smsOnExecution}
                  onChange={(e) => setSettings({ ...settings, smsOnExecution: e.target.checked })}
                  className="rounded bg-[#050505] border-white/10 text-indigo-500 h-4 w-4 accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Telegram bot dispatch alerts */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-white block uppercase font-mono">Telegram Telegram PnL Dispatch</span>
                  <p className="text-[9.5px] text-white/40 font-mono">Publish beautiful summaries of closed trades directly to your channel.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.telegramOnExecution}
                  onChange={(e) => setSettings({ ...settings, telegramOnExecution: e.target.checked })}
                  className="rounded bg-[#050505] border-white/10 text-indigo-500 h-4 w-4 accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Automated Volatility Alert toggle */}
              <div className="flex items-center justify-between border-t border-[#f43f5e]/20 hover:border-[#f43f5e]/30 pt-3 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-white block uppercase font-mono flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    Automated Volatility Alert
                  </span>
                  <p className="text-[9.5px] text-white/40 font-mono">Trigger persistent alarm banner when symbol's hourly volatility exceeds 30-day moving average.</p>
                </div>
                <input
                  id="settings-volatility-alert-checkbox"
                  type="checkbox"
                  checked={settings.volatilityAlertEnabled}
                  onChange={(e) => setSettings({ ...settings, volatilityAlertEnabled: e.target.checked })}
                  className="rounded bg-[#050505] border-white/10 text-indigo-500 h-4 w-4 accent-indigo-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Browser-Native Desktop Notifications */}
              <div className="flex flex-col border-t border-white/5 pt-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-white block uppercase font-mono">Desktop Push Decryptor</span>
                    <p className="text-[9.5px] text-white/40 font-mono">Deliver real-time browser-native desktop notifications when positions hit TP or SL targets.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Visual permission indicator */}
                    {typeof window !== 'undefined' && 'Notification' in window && (
                      <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                        permission === 'granted' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : permission === 'denied' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {permission === 'granted' ? 'Allowed' : permission === 'denied' ? 'Blocked' : 'No Permission'}
                      </span>
                    )}
                    <input
                      id="settings-desktop-notifications-checkbox"
                      type="checkbox"
                      checked={settings.desktopNotificationsEnabled || false}
                      onChange={async (e) => {
                        if (e.target.checked) {
                          if (!('Notification' in window)) {
                            alert('This browser does not support desktop notifications.');
                            return;
                          }
                          if (Notification.permission === 'default') {
                            const res = await Notification.requestPermission();
                            setPermission(res);
                            if (res === 'granted') {
                              setSettings({ ...settings, desktopNotificationsEnabled: true });
                              new Notification('System Core Active', {
                                body: 'Desktop trigger alerts configured successfully.',
                                icon: '/assets/favicon.png'
                              });
                            } else {
                              setSettings({ ...settings, desktopNotificationsEnabled: false });
                            }
                          } else if (Notification.permission === 'granted') {
                            setSettings({ ...settings, desktopNotificationsEnabled: true });
                          } else {
                            setSettings({ ...settings, desktopNotificationsEnabled: false });
                          }
                        } else {
                          setSettings({ ...settings, desktopNotificationsEnabled: false });
                        }
                      }}
                      className="rounded bg-[#050505] border-white/10 text-indigo-500 h-4 w-4 accent-indigo-500 focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>
                {permission === 'denied' && (
                  <span className="text-[8.5px] text-rose-400/80 font-mono mt-1 leading-normal">
                    ⚠️ Browser-native notifications are blocked. To receive TP/SL execution alerts, click the lock icon in your URL bar and reset site permissions to "Allow".
                  </span>
                )}
              </div>

              {/* Daily PnL Goal Target */}
              <div className="flex flex-col border-t border-white/5 pt-3">
                <div className="flex items-center justify-between zoom-in-50">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-white block uppercase font-mono flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      Daily Performance Goal ($)
                    </span>
                    <p className="text-[9.5px] text-white/40 font-mono">Target benchmark PnL projection for institutional tracking.</p>
                  </div>
                  <div className="relative">
                    <input
                      id="settings-daily-pnl-goal"
                      type="number"
                      min="50"
                      max="1000000"
                      step="50"
                      value={settings.dailyPnLGoal ?? 1000}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setSettings({ ...settings, dailyPnLGoal: val });
                      }}
                      className="w-28 bg-[#050505] text-white border border-white/10 rounded px-2.5 py-1 text-xs font-mono font-bold text-right outline-none focus:border-indigo-500 hover:border-white/20 transition-colors"
                      title="Enter Daily PnL Goal ($)"
                    />
                  </div>
                </div>
              </div>

              {/* Daily PnL Threshold Alerts */}
              <div className="flex flex-col border-t border-white/5 pt-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-white block uppercase font-mono flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      Daily PnL Threshold Alerts
                    </span>
                    <p className="text-[9.5px] text-white/40 font-mono">
                      Trigger a desktop notification when daily PnL reaches positive or negative threshold.
                    </p>
                  </div>
                  <input
                    id="settings-daily-pnl-alert-checkbox"
                    type="checkbox"
                    checked={settings.dailyPnLAlertEnabled || false}
                    onChange={async (e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        if (typeof window !== 'undefined' && 'Notification' in window) {
                          if (Notification.permission === 'default') {
                            const res = await Notification.requestPermission();
                            setPermission(res);
                            setSettings({
                              ...settings,
                              dailyPnLAlertEnabled: res === 'granted' ? true : false,
                              desktopNotificationsEnabled: res === 'granted' ? true : settings.desktopNotificationsEnabled
                            });
                            return;
                          } else if (Notification.permission === 'denied') {
                            alert('Notifications are blocked by your browser settings. Please enable them to use PnL alerts.');
                            setSettings({ ...settings, dailyPnLAlertEnabled: false });
                            return;
                          }
                        }
                      }
                      setSettings({ ...settings, dailyPnLAlertEnabled: checked });
                    }}
                    className="rounded bg-[#050505] border-white/10 text-indigo-500 h-4 w-4 accent-indigo-500 focus:ring-0 cursor-pointer"
                  />
                </div>

                {settings.dailyPnLAlertEnabled && (
                  <div className="mt-3 grid grid-cols-2 gap-3 pl-5 border-l border-indigo-500/30 animate-fadeIn text-[10px] font-mono">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/45 uppercase font-bold tracking-wider block">Profit Threshold ($)</label>
                      <input
                        id="settings-daily-pnl-pos-threshold"
                        type="number"
                        min="1"
                        max="1000000"
                        step="100"
                        value={settings.dailyPnLPositiveThreshold ?? 2000}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 0);
                          setSettings({ ...settings, dailyPnLPositiveThreshold: val });
                        }}
                        className="w-full bg-[#050505] text-emerald-400 border border-white/10 rounded px-2.5 py-1 text-xs font-bold text-right outline-none focus:border-emerald-500/40 hover:border-white/20 transition-colors"
                        title="Alert triggers above this profit limit"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/45 uppercase font-bold tracking-wider block">Loss Limit Threshold ($)</label>
                      <input
                        id="settings-daily-pnl-neg-threshold"
                        type="number"
                        min="-1000000"
                        max="1000000"
                        step="100"
                        value={settings.dailyPnLNegativeThreshold ?? -1000}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setSettings({ ...settings, dailyPnLNegativeThreshold: val });
                        }}
                        className="w-full bg-[#050505] text-rose-400 border border-white/10 rounded px-2.5 py-1 text-xs font-bold text-right outline-none focus:border-rose-500/40 hover:border-white/20 transition-colors"
                        title="Alert triggers below this loss limit"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Card 5: Configuration snapshots and Layout templates */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 font-mono">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/25 rounded">
                  <Layout className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase text-white tracking-widest">
                    Workspace Layout Snapshots
                  </h3>
                  <p className="text-[10px] text-white/30">Capture or reload custom workspace configurations and widget visibilities.</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/10 text-[8.5px] text-indigo-300 font-bold uppercase tracking-widest hidden sm:inline">
                PRESETS ENGINE
              </span>
            </div>

            {/* Snapshot Action Feed / Message Feedback */}
            {snapshotFeedback && (
              <div id="snapshot-feedback-banner" className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono px-3 py-2 rounded animate-fadeIn flex items-center justify-between select-none">
                <span>{snapshotFeedback}</span>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                </span>
              </div>
            )}

            {/* Input to save active workspace snapshot */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-white/50 uppercase block">Capture Current Layout State</label>
              <div className="flex gap-2">
                <input
                  id="input-new-snapshot-name"
                  type="text"
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  placeholder="e.g. Clean Charting, Full Intelligence"
                  className="flex-1 bg-[#050505] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono placeholder-white/20 outline-none focus:border-indigo-500/40"
                />
                <button
                  id="btn-save-workspace-snapshot"
                  onClick={handleSaveSnapshot}
                  disabled={!newSnapshotName.trim() || !layoutState}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-white/20 disabled:border-transparent text-white border border-indigo-500/30 text-xs font-mono font-bold uppercase rounded transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Capture current layout configuration as snapshot"
                >
                  <Save className="w-3.5 h-3.5" />
                  SNAPSHOT
                </button>
              </div>
              {!layoutState && (
                <p className="text-[8.5px] text-[#fbbf24]/55 font-mono mt-1 leading-normal uppercase">
                  Layout state setters are currently loading. Use the factory presets below to toggle components.
                </p>
              )}
            </div>

            {/* Presets and custom snapshots view list */}
            <div className="space-y-3 pt-2">
              <div className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest border-b border-white/5 pb-1 flex items-center justify-between">
                <span>Available Layouts</span>
                <span>Active Status</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {/* 1. Factory Presets */}
                {FACTORY_PRESETS.map((p) => {
                  const isActive = isPresetMatching(p.layoutState);
                  return (
                    <div 
                      key={p.id}
                      className={`group flex items-center justify-between p-2 rounded border transition-all text-left ${isActive ? 'bg-[#4f46e5]/10 border-indigo-500/35 shadow-[0_0_8px_rgba(99,102,241,0.05)]' : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/15'}`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-mono font-bold text-white group-hover:text-indigo-300 transition-colors uppercase leading-tight">
                          {p.name}
                        </span>
                        <span className="text-[8px] font-mono text-white/30 uppercase">
                          System Template • factory default
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/35 text-[7px] font-mono font-extrabold text-[#10b981] tracking-wider animate-pulse animate-duration-1000">
                            ACTIVE
                          </span>
                        ) : (
                          <button
                            onClick={() => handleLoadSnapshot(p)}
                            disabled={!setLayoutState}
                            className="px-2 py-0.8 bg-[#0c0c0e] hover:bg-white/5 border border-white/10 text-white font-mono text-[8.5px] uppercase rounded transition-all cursor-pointer disabled:opacity-40"
                            title="Load preset workspace layout"
                          >
                            LOAD
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* 2. Custom Presets */}
                {customPresets.map((p) => {
                  const isActive = isPresetMatching(p.layoutState);
                  return (
                    <div 
                      key={p.id}
                      className={`group flex items-center justify-between p-2 rounded border transition-all text-left ${isActive ? 'bg-[#4f46e5]/10 border-indigo-500/35 shadow-[0_0_8px_rgba(99,102,241,0.05)]' : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/15'}`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-mono font-bold text-indigo-200 group-hover:text-indigo-300 transition-colors uppercase leading-tight">
                          {p.name}
                        </span>
                        <span className="text-[8px] font-mono text-[#fbbf24]/60 uppercase">
                          User Snapshot • {p.createdAt || 'Saved Preset'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono">
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/35 text-[7px] font-mono font-extrabold text-[#10b981] tracking-wider">
                            ACTIVE
                          </span>
                        )}
                        
                        {!isActive && (
                          <button
                            onClick={() => handleLoadSnapshot(p)}
                            disabled={!setLayoutState}
                            className="px-2 py-0.8 bg-[#0c0c0e] hover:bg-[#312e81]/30 border border-indigo-500/20 text-white font-mono text-[8.5px] uppercase rounded transition-all cursor-pointer disabled:opacity-40"
                            title="Load layout snapshot configuration"
                          >
                            LOAD
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteSnapshot(p.id, p.name)}
                          className="p-1 text-white/35 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded transition-all cursor-pointer"
                          title="Delete snapshot preset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {customPresets.length === 0 && (
                  <div className="text-center py-4 bg-white/[0.01] rounded border border-white/[0.03] text-white/20 font-mono text-[9px] uppercase tracking-wide">
                    No custom snapshots captured yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Information Deck explaining Broker bindings */}
          <div className="bg-[#0c0c0e] border border-white/5 p-4 rounded-lg italic text-[10.5px] font-mono leading-relaxed text-slate-300 space-y-2">
            <h4 className="font-bold text-indigo-400 not-italic uppercase font-mono text-[9px] tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              MTXquant Guard Security Protocol
            </h4>
            <p>
              Your terminal communicates directly with the Python broker-bridge interface via bidirectional SSL webhooks. All execution requests are encrypted using military-grade AES-GCM and invalidated immediately upon transmission. No private keys are ever stored on cloud servers.
            </p>
          </div>

        </div>

      </div>

      {/* Hotkeys & Quick Keys Configuration Panel */}
      <QuickKeysPanel />

      {/* Embedded direct developer MT5 Bridge reference guidelines */}
      <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5">
        <h3 className="text-xs font-bold uppercase text-white tracking-widest font-mono border-b border-white/5 pb-3 mb-4">
          MT5 Bridge Integration Reference
        </h3>
        <Mt5BridgeGuide />
      </div>

    </div>
  );
}
