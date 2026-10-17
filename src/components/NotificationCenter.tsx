import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  TrendingUp, 
  ShieldAlert, 
  Radio, 
  Target, 
  Clock, 
  ArrowUpRight, 
  Briefcase, 
  Layers, 
  Activity, 
  BarChart2, 
  Compass, 
  Eye, 
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import { 
  SystemNotification, 
  NotificationCategory, 
  MarketSymbol, 
  Trade, 
  MarketMetrics 
} from '../types';
import { playNotificationSound, NotificationSoundType } from '../utils/audioNotifier';

interface NotificationCenterProps {
  activeTab: 'MARKETS' | 'DISCOVER' | 'SCREENER' | 'PORTFOLIO' | 'WALLET' | 'WATCHLIST' | 'ACTIVITY' | 'ANALYSIS';
  onNavigateTab: (tab: 'MARKETS' | 'DISCOVER' | 'SCREENER' | 'PORTFOLIO' | 'WALLET' | 'WATCHLIST' | 'ACTIVITY' | 'ANALYSIS') => void;
  onSelectSymbol?: (symbol: MarketSymbol) => void;
  trades?: Trade[];
  metrics?: MarketMetrics | null;
  soundAlertsEnabled?: boolean;
  notificationSound?: NotificationSoundType;
}

const STORAGE_KEY = 'apex_system_notifications_v1';

export default function NotificationCenter({
  activeTab,
  onNavigateTab,
  onSelectSymbol,
  trades = [],
  metrics,
  soundAlertsEnabled = true,
  notificationSound = 'chime'
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Notifications State - purely dynamic, no seeded or mock notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Strip out any legacy pre-seeded initial mock notifications
          return parsed.filter((n: any) => n && n.id && n.id !== 'sys-init-ready' && !String(n.id).startsWith('mock-'));
        }
      }
    } catch (e) {
      console.warn('Failed to load notifications from storage:', e);
    }
    return [];
  });

  // Keep notifications synced to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  // Handle outside clicks to close popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Add Notification Helper with Audio Dispatch
  const addNotification = useCallback((notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'> & { id?: string; timestamp?: string }) => {
    const newNotif: SystemNotification = {
      id: notif.id || `stock-notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: notif.timestamp || new Date().toISOString(),
      read: false,
      ...notif
    };

    setNotifications(prev => [newNotif, ...prev.slice(0, 99)]);

    if (soundAlertsEnabled) {
      playNotificationSound(notificationSound, true);
    }
  }, [soundAlertsEnabled, notificationSound]);

  // Listen to Global Custom Notification Events across the entire application
  useEffect(() => {
    const handleCustomNotif = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail && customEvent.detail.title) {
        addNotification(customEvent.detail);
      }
    };

    window.addEventListener('mtx_system_notification', handleCustomNotif);
    return () => {
      window.removeEventListener('mtx_system_notification', handleCustomNotif);
    };
  }, [addNotification]);

  // Track previous trades to emit reactive execution events exclusively for live session orders
  const isInitialTradesSyncRef = useRef<boolean>(true);
  const prevTradesCountRef = useRef<number>(trades.length);
  const notifiedTradeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // On initial mount/fetch, record existing trade IDs without triggering false historical alerts
    if (isInitialTradesSyncRef.current) {
      if (trades.length > 0) {
        trades.forEach(t => {
          if (t?.id) notifiedTradeIdsRef.current.add(t.id);
        });
        prevTradesCountRef.current = trades.length;
        isInitialTradesSyncRef.current = false;
      }
      return;
    }

    if (trades.length > prevTradesCountRef.current) {
      const latestTrade = trades[trades.length - 1];
      if (latestTrade && latestTrade.id && !notifiedTradeIdsRef.current.has(latestTrade.id)) {
        notifiedTradeIdsRef.current.add(latestTrade.id);

        // Only announce if order was executed during the current active session (within last 60s)
        const tradeTime = latestTrade.timestamp ? new Date(latestTrade.timestamp).getTime() : 0;
        const isRecent = tradeTime > 0 ? (Date.now() - tradeTime < 60000) : false;

        if (isRecent) {
          addNotification({
            category: 'TRADES',
            severity: 'INFO',
            title: `Stock Order Executed: ${latestTrade.side} ${latestTrade.symbol}`,
            message: `Filled ${latestTrade.size} shares of ${latestTrade.symbol} @ $${latestTrade.entryPrice}. TP: ${latestTrade.takeProfit ? '$' + latestTrade.takeProfit : 'None'}, SL: ${latestTrade.stopLoss ? '$' + latestTrade.stopLoss : 'None'}.`,
            symbol: latestTrade.symbol,
            actionTab: 'ACTIVITY',
            actionLabel: 'View in Activity',
            metadata: {
              price: latestTrade.entryPrice,
              shares: latestTrade.size,
              tradeId: latestTrade.id,
              tag: `${latestTrade.side} FILL`
            }
          });
        }
      }
    }
    prevTradesCountRef.current = trades.length;
  }, [trades, addNotification]);

  // Automatically mark all notifications as read when opening the notification panel
  useEffect(() => {
    if (isOpen) {
      setNotifications(prev => {
        if (prev.some(n => !n.read)) {
          return prev.map(n => ({ ...n, read: true }));
        }
        return prev;
      });
    }
  }, [isOpen]);

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Delete single notification
  const deleteNotification = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Handle action click
  const handleActionClick = (notif: SystemNotification) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.symbol && onSelectSymbol) {
      onSelectSymbol(notif.symbol);
    }
    if (notif.actionTab) {
      onNavigateTab(notif.actionTab);
    }
    setIsOpen(false);
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const hasCriticalUnread = useMemo(() => {
    return notifications.some(n => !n.read && (n.severity === 'CRITICAL' || n.severity === 'WARNING'));
  }, [notifications]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = Date.now();
      // Handle legacy space-separated UTC strings e.g. "2026-10-12 18:30:00"
      let normalized = isoString;
      if (typeof normalized === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(normalized)) {
        normalized = normalized.replace(' ', 'T') + 'Z';
      }
      const parsedTime = new Date(normalized).getTime();
      if (isNaN(parsedTime)) return 'Just now';
      const diffMs = now - parsedTime;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      if (diffSec < 45 || diffMs < 0) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      return `${diffDay}d ago`;
    } catch {
      return 'Recent';
    }
  };

  const getCategoryMeta = (category: NotificationCategory) => {
    switch (category) {
      case 'TRADES':
        return {
          icon: TrendingUp,
          color: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          label: 'Trade'
        };
      case 'RISK':
        return {
          icon: ShieldAlert,
          color: 'text-rose-400',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          label: 'Risk'
        };
      case 'MARKET':
        return {
          icon: Radio,
          color: 'text-indigo-400',
          badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          label: 'Whale'
        };
      case 'ALERTS':
      default:
        return {
          icon: Target,
          color: 'text-amber-400',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          label: 'Alert'
        };
    }
  };

  const getDeskIcon = (tab?: string) => {
    switch (tab) {
      case 'MARKETS': return BarChart2;
      case 'DISCOVER': return Compass;
      case 'SCREENER': return Layers;
      case 'PORTFOLIO': return Briefcase;
      case 'WATCHLIST': return Eye;
      case 'ACTIVITY': return Activity;
      case 'ANALYSIS': return BarChart2;
      default: return ArrowUpRight;
    }
  };

  return (
    <div className="relative shrink-0 font-sans">
      {/* ──────────────────── 1. HEADER BELL TRIGGER ──────────────────── */}
      <button
        ref={buttonRef}
        id="stock-notification-center-trigger"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative h-8 w-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer select-none ${
          isOpen
            ? 'bg-zinc-800 border-zinc-600 text-white'
            : unreadCount > 0
            ? 'bg-zinc-900 border-zinc-700 text-white hover:border-zinc-500 hover:bg-zinc-800'
            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
        }`}
        title={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-3.5 h-3.5" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span 
            className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center text-white border ${
              hasCriticalUnread 
                ? 'bg-rose-600 border-rose-500' 
                : 'bg-indigo-600 border-indigo-500'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ──────────────────── 2. NOTIFICATION POPOVER FLYOUT ──────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="fixed md:absolute right-2 md:right-0 top-14 md:top-10 z-[700] w-[calc(100vw-16px)] md:w-[420px] max-h-[78vh] bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
          >
            {/* Clean, Minimal Header */}
            <div className="px-3.5 py-2.5 border-b border-zinc-800 bg-[#09090b] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-white tracking-wide">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[10px] text-zinc-400 hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification Item Feed */}
            <div className="overflow-y-auto max-h-[60vh] p-2 space-y-1.5 divide-y divide-transparent thin-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-10 px-4 flex flex-col items-center justify-center text-center space-y-2.5 font-mono">
                  <div className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-300">
                      No Notifications
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Real-time events will log automatically
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => {
                  const meta = getCategoryMeta(notif.category);
                  const Icon = meta.icon;
                  const DeskIcon = getDeskIcon(notif.actionTab);

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleActionClick(notif)}
                      className={`group relative p-2.5 rounded-lg border transition-all font-mono cursor-pointer ${
                        !notif.read
                          ? 'bg-[#0f0f13] border-zinc-700/80 hover:border-indigo-500/50 hover:bg-[#121218]'
                          : 'bg-[#09090b] border-zinc-800/80 hover:border-zinc-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {/* Unread Left Indicator Line */}
                      {!notif.read && (
                        <div className="absolute left-0 top-2.5 bottom-2.5 w-0.5 bg-indigo-500 rounded-r" />
                      )}

                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                          <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5">
                            <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Top Meta Line: Category, Symbol, Tag, Time */}
                            <div className="flex items-center space-x-1.5 text-[9px] flex-wrap gap-y-1">
                              <span className={`px-1.5 py-0.2 rounded border font-medium ${meta.badgeBg}`}>
                                {meta.label}
                              </span>

                              {notif.symbol && (
                                <span className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold">
                                  {notif.symbol}
                                </span>
                              )}

                              {notif.metadata?.tag && (
                                <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium">
                                  {notif.metadata.tag}
                                </span>
                              )}

                              <span className="text-zinc-500 flex items-center gap-1 ml-auto">
                                <Clock className="w-2.5 h-2.5" />
                                {formatRelativeTime(notif.timestamp)}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className={`text-xs font-semibold leading-tight ${notif.read ? 'text-zinc-300' : 'text-white group-hover:text-indigo-300'}`}>
                              {notif.title}
                            </h4>

                            {/* Description */}
                            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans font-normal">
                              {notif.message}
                            </p>

                            {/* Metrics Readout */}
                            {notif.metadata && (notif.metadata.pnl !== undefined || notif.metadata.price !== undefined || notif.metadata.shares !== undefined || notif.metadata.amount !== undefined || notif.metadata.threshold !== undefined) && (
                              <div className="flex items-center space-x-1.5 pt-0.5 text-[9px] flex-wrap gap-y-1">
                                {notif.metadata.pnl !== undefined && (
                                  <span className={`px-1.5 py-0.2 rounded border font-medium ${
                                    notif.metadata.pnl >= 0
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  }`}>
                                    PnL: {notif.metadata.pnl >= 0 ? '+' : ''}${notif.metadata.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                )}
                                {notif.metadata.shares !== undefined && (
                                  <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                                    Size: {notif.metadata.shares} Shs
                                  </span>
                                )}
                                {notif.metadata.price !== undefined && (
                                  <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                                    Price: ${notif.metadata.price.toFixed(2)}
                                  </span>
                                )}
                                {notif.metadata.threshold !== undefined && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                    Level: {notif.metadata.threshold}%
                                  </span>
                                )}
                                {notif.metadata.amount !== undefined && (
                                  <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                                    Amount: ${notif.metadata.amount >= 1000000 ? `${(notif.metadata.amount / 1000000).toFixed(1)}M` : notif.metadata.amount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Direct Action Link */}
                            {notif.actionTab && (
                              <div className="pt-1">
                                <span
                                  className="inline-flex px-2 py-0.5 rounded bg-zinc-800 group-hover:bg-indigo-950/60 border border-zinc-700 group-hover:border-indigo-700/60 text-zinc-200 group-hover:text-indigo-200 text-[9.5px] font-medium items-center gap-1 transition-colors"
                                >
                                  <DeskIcon className="w-3 h-3 text-zinc-400 group-hover:text-indigo-400" />
                                  <span>{notif.actionLabel || `Open ${notif.actionTab}`}</span>
                                  <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-indigo-400" />
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Quick Controls */}
                        <div className="flex flex-col items-end space-y-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => deleteNotification(notif.id, e)}
                            className="p-1 text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Dismiss Notification"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Subtle Footer */}
            {notifications.length > 0 && (
              <div className="px-3 py-2 border-t border-zinc-800 bg-[#09090b] flex items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0">
                <span>{notifications.length} logged event{notifications.length === 1 ? '' : 's'}</span>
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
