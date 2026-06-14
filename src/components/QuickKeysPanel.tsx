/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Volume2, 
  ShieldAlert, 
  HelpCircle,
  TrendingUp,
  Activity,
  Sliders,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';

interface QuickKeysProps {
  onSettingsChanged?: () => void;
}

export interface Keybindings {
  EmergencyClose: string;
  ToggleVolatility: string;
  TabResearch: string;
  TabExecution: string;
  TabSettings: string;
  TabDashboard: string;
}

const DEFAULT_BINDINGS: Keybindings = {
  EmergencyClose: 'Alt+X',
  ToggleVolatility: 'Alt+V',
  TabResearch: 'Alt+R',
  TabExecution: 'Alt+E',
  TabSettings: 'Alt+S',
  TabDashboard: 'Alt+D'
};

const SHORTCUT_LABELS: Record<keyof Keybindings, string> = {
  EmergencyClose: 'Emergency Close All Positions',
  ToggleVolatility: 'Toggle Volatility Alert',
  TabDashboard: 'Quick Nav: Dashboard Tab',
  TabResearch: 'Quick Nav: Research Tab',
  TabExecution: 'Quick Nav: Execution Tab',
  TabSettings: 'Quick Nav: Settings Tab',
};

export default function QuickKeysPanel({ onSettingsChanged }: QuickKeysProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [bindings, setBindings] = useState<Keybindings>(DEFAULT_BINDINGS);
  const [rebindingKey, setRebindingKey] = useState<keyof Keybindings | null>(null);
  
  // Loaded state indicator
  const [loaded, setLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('apex_institutional_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const loadedBindings = {
          EmergencyClose: parsed.keybindEmergencyClose || DEFAULT_BINDINGS.EmergencyClose,
          ToggleVolatility: parsed.keybindToggleVolatility || DEFAULT_BINDINGS.ToggleVolatility,
          TabResearch: parsed.keybindTabResearch || DEFAULT_BINDINGS.TabResearch,
          TabExecution: parsed.keybindTabExecution || DEFAULT_BINDINGS.TabExecution,
          TabSettings: parsed.keybindTabSettings || DEFAULT_BINDINGS.TabSettings,
          TabDashboard: parsed.keybindTabDashboard || DEFAULT_BINDINGS.TabDashboard,
        };
        setBindings(loadedBindings);
      }
    } catch (e) {
      console.warn('Failed loading custom keybindings from local storage:', e);
    }
    setLoaded(true);
  }, []);

  // Save to LocalStorage helper
  const saveBindings = (newBindings: Keybindings) => {
    try {
      const saved = localStorage.getItem('apex_institutional_settings');
      const parsed = saved ? JSON.parse(saved) : {};
      
      const updatedSettings = {
        ...parsed,
        keybindEmergencyClose: newBindings.EmergencyClose,
        keybindToggleVolatility: newBindings.ToggleVolatility,
        keybindTabResearch: newBindings.TabResearch,
        keybindTabExecution: newBindings.TabExecution,
        keybindTabSettings: newBindings.TabSettings,
        keybindTabDashboard: newBindings.TabDashboard,
      };

      localStorage.setItem('apex_institutional_settings', JSON.stringify(updatedSettings));
      window.dispatchEvent(new Event('storage'));
      if (onSettingsChanged) onSettingsChanged();
    } catch (e) {
      console.error('Failed to save updated keybindings:', e);
    }
  };

  // Rebinding listener context
  useEffect(() => {
    if (rebindingKey === null) return;

    const handleKeyCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keyName = e.key;

      // Filter out raw standalone modifier keystrokes
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(keyName)) {
        return;
      }

      // Format standard shortcut notation
      const keys: string[] = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.metaKey) keys.push('Meta');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');

      const formattedKey = keyName.length === 1 ? keyName.toUpperCase() : keyName;
      keys.push(formattedKey);

      const capturedShortcut = keys.join('+');

      // Set state and save immediately
      const updated = {
        ...bindings,
        [rebindingKey]: capturedShortcut
      };
      setBindings(updated);
      saveBindings(updated);
      setRebindingKey(null);
    };

    window.addEventListener('keydown', handleKeyCapture, true);
    return () => {
      window.removeEventListener('keydown', handleKeyCapture, true);
    };
  }, [rebindingKey, bindings]);

  // Reset to default presets
  const handleReset = () => {
    setBindings(DEFAULT_BINDINGS);
    saveBindings(DEFAULT_BINDINGS);
    setRebindingKey(null);
  };

  return (
    <div id="quick-keys-reference" className="bg-[#0a0a0b] border border-white/5 rounded-lg overflow-hidden transition-all duration-300">
      
      {/* 1. Header Trigger button */}
      <button
        id="btn-toggle-quick-keys"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#0e0e11] hover:bg-[#131317] border-b border-white/5 transition-colors cursor-pointer select-none text-left"
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded">
            <Keyboard className="w-4 h-4 animate-pulse text-indigo-400" />
          </div>
          <div>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">Quick Keys & Hotkey Bindings</span>
            <span className="text-[9px] text-white/40 font-mono block mt-0.5">Customize real-time shortcut actions and failsafe routines.</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 text-white/40">
          <span className="text-[8.5px] font-mono tracking-widest uppercase border border-white/10 px-1.5 py-0.5 rounded leading-none hidden sm:inline-block">
            REBINDABLE
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* 2. Collapsible content window */}
      {isOpen && (
        <div className="p-5 space-y-4 font-mono select-none animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-500/10 pb-3 gap-2">
            <span className="text-[10px] text-slate-400 leading-relaxed max-w-lg">
              Click any hotkey value to enter <strong>Rebind Mode</strong>, then press your desired key combination (e.g. <span className="bg-white/10 px-1 rounded text-white text-[9.5px]">Ctrl+Alt+P</span>) to lock it in.
            </span>

            <button
              id="btn-reset-keybindings"
              onClick={handleReset}
              className="text-[9px] font-black text-indigo-400 border border-indigo-500/15 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/35 rounded px-2.5 py-1.5 transition-all text-center uppercase cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-center"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Defaults
            </button>
          </div>

          {/* Shortcut grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.keys(SHORTCUT_LABELS) as Array<keyof Keybindings>).map((key) => {
              const currentVal = bindings[key];
              const isRebinding = rebindingKey === key;
              const isEmergency = key === 'EmergencyClose';

              return (
                <div 
                  key={key}
                  className={`bg-[#05055] p-3 rounded-lg border flex items-center justify-between transition-all group ${
                    isRebinding 
                      ? 'bg-indigo-500/5 border-indigo-500/50 ring-1 ring-indigo-500/30' 
                      : 'bg-[#030305] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <span className={`text-[10px] font-bold block truncate ${isEmergency ? 'text-rose-400/90' : 'text-white/80'}`}>
                      {SHORTCUT_LABELS[key]}
                    </span>
                    <span className="text-[8.5px] text-white/35 block font-sans">
                      {isEmergency ? 'Triggers instant failsafe close' : 'Universal navigation and telemetry'}
                    </span>
                  </div>

                  <button
                    id={`btn-rebind-${key}`}
                    onClick={() => setRebindingKey(isRebinding ? null : key)}
                    title={isRebinding ? "Keystroke capture active..." : "Click to assign new shortcut"}
                    className={`px-3 py-1.5 rounded font-black text-[10px] min-w-[76px] tracking-wide text-center border font-mono transition-all leading-none uppercase cursor-pointer relative overflow-hidden ${
                      isRebinding
                        ? 'bg-indigo-500 text-white border-indigo-400 animate-pulse'
                        : isEmergency
                          ? 'bg-rose-500/15 border-rose-500/20 text-rose-400 hover:bg-rose-500/25'
                          : 'bg-white/5 border-white/10 text-indigo-300 hover:text-white hover:bg-white/10 hover:border-indigo-500/40'
                    }`}
                  >
                    {isRebinding ? (
                      <span className="flex items-center gap-1 justify-center">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        PRESS...
                      </span>
                    ) : (
                      currentVal
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Test Playground widget */}
          <div className="bg-[#050505]/40 border border-white/5 p-3 rounded-lg flex items-center justify-between gap-3 text-[10px]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-white/50">Active profiles:</span>
              <span className="text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded leading-none text-[8.5px]">LIVE BINDINGS DETECTED</span>
            </div>
            <div className="text-[9px] text-white/30 hidden sm:block">
              Key bindings autosave in real-time across your browser.
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
