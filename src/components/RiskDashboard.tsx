/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Trade, MarketSymbol } from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  Zap,
  Activity, 
  PieChart as PieIcon, 
  Flame, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Info,
  DollarSign, 
  ServerCrash,
  UserCheck,
  Percent,
  Briefcase,
  Layers,
  Sparkles,
  ArrowRight,
  Scale,
  Bell,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Coins,
  Gem,
  Globe,
  Download,
  Check,
  Trophy,
  Sliders,
  BellRing
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import CorrelationMatrix from './CorrelationMatrix';
import MarketSentimentHeatmap from './MarketSentimentHeatmap';
import HistoricalBreachLog from './HistoricalBreachLog';
import CorrelationHeatmap from './CorrelationHeatmap';
import PortfolioCorrelationWidget from './PortfolioCorrelationWidget';

interface RiskTooltipProps {
  title: string;
  description: string;
  formula?: string;
  align?: 'left' | 'right' | 'center';
}

function RiskTooltip({ title, description, formula, align = 'center' }: RiskTooltipProps) {
  const alignClasses = 
    align === 'left' ? 'left-0 mb-2 w-64' :
    align === 'right' ? 'right-0 mb-2 w-64 translate-x-0' :
    'left-1/2 -translate-x-1/2 mb-2 w-64';

  const arrowClasses =
    align === 'left' ? 'left-3' :
    align === 'right' ? 'right-3' :
    'left-1/2 -translate-x-1/2';

  return (
    <div className="relative group inline-block ml-1.5 align-middle select-none">
      <Info className="w-3.5 h-3.5 text-white/30 hover:text-white/60 cursor-help transition-colors select-none" />
      <div className={`absolute z-50 bottom-full ${alignClasses} p-3 bg-black/95 border border-white/10 text-white rounded-md shadow-2xl text-[10.5px] leading-relaxed font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none text-left`}>
        <div className="border-b border-white/5 pb-1 mb-1 font-bold text-indigo-400 uppercase text-[9px] tracking-wider">
          {title}
        </div>
        <div className="text-white/75 font-sans">
          {description}
        </div>
        {formula && (
          <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[9.5px] text-amber-500 bg-amber-500/5 p-1 rounded border border-amber-500/10 font-mono">
            <span className="text-white/45 block text-[8px] font-black mb-0.5 uppercase">Calculation Formula:</span>
            {formula}
          </div>
        )}
        <div className={`absolute top-full ${arrowClasses} border-[5px] border-transparent border-t-black/95`}></div>
      </div>
    </div>
  );
}

interface RiskDashboardProps {
  trades: Trade[];
  symbol: MarketSymbol;
  onEmergencyCloseAll?: () => void;
  onPartialCloseAll?: (ratio?: number) => void;
  onRefreshTrades?: () => void;
}

const renderSectorIcon = (iconName: string) => {
  switch (iconName) {
    case 'Globe': return <Globe className="w-4 h-4 text-indigo-400" />;
    case 'Coins': return <Coins className="w-4 h-4 text-amber-400" />;
    case 'Gem': return <Gem className="w-4 h-4 text-emerald-400" />;
    default: return <Briefcase className="w-4 h-4 text-slate-400" />;
  }
};

export default function RiskDashboard({ 
  trades, 
  symbol, 
  onEmergencyCloseAll, 
  onPartialCloseAll,
  onRefreshTrades
}: RiskDashboardProps) {
  const INITIAL_BALANCE = 10000;
  const [activeSubTab, setActiveSubTab] = useState<'EXPOSURE' | 'STRESS_TESTS' | 'CORRELATION_SENTIMENT'>('EXPOSURE');
  const [showRebalancePanel, setShowRebalancePanel] = useState(false);
  const [simulatedRebalanceCompleted, setSimulatedRebalanceCompleted] = useState(false);

  // Custom states for automated 'Lock-In Profits' feature
  const [lockInProfits, setLockInProfits] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('apex_lock_in_profits');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [autoLockedTradeIds, setAutoLockedTradeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('apex_auto_locked_trade_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [autoLockLogs, setAutoLockLogs] = useState<{ id: string; symbol: string; size: number; pnl: number; time: string }[]>(() => {
    try {
      const saved = localStorage.getItem('apex_auto_lock_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isExecutingAutoLock, setIsExecutingAutoLock] = useState<boolean>(false);
  const [showAutoLockHistory, setShowAutoLockHistory] = useState<boolean>(false);

  const getTradeRiskUSD = (t: Trade) => {
    const slDistance = Math.abs(t.entryPrice - t.stopLoss);
    if (slDistance === 0) return 50;

    let tradeRiskDollar = 0;
    if (t.symbol === 'BTC/USDT') {
      tradeRiskDollar = slDistance * t.size;
    } else if (t.symbol === 'USD/JPY') {
      const contractLots = t.size * 100000;
      tradeRiskDollar = slDistance * contractLots * (1 / t.entryPrice); // Approximate USD value
    } else {
      const contractLots = t.size * 100000;
      tradeRiskDollar = slDistance * contractLots;
    }
    
    return Math.max(tradeRiskDollar, 50);
  };
  
  // Pulse animation states when exposure metrics update
  const [exposurePulse, setExposurePulse] = useState(false);
  const [allocationPulse, setAllocationPulse] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('apex_risk_threshold');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading risk threshold:', e);
    }
    return 1.5;
  });

  useEffect(() => {
    try {
      localStorage.setItem('apex_risk_threshold', alertThreshold.toString());
    } catch (e) {
      console.error('Error saving risk threshold:', e);
    }
  }, [alertThreshold]);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [dismissedActiveAlert, setDismissedActiveAlert] = useState<boolean>(false);
  const [dismissedProfitAlert, setDismissedProfitAlert] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('apex_dismissed_profit_alert_date');
      const todayStr = new Date().toISOString().split('T')[0];
      return saved === todayStr;
    } catch {}
    return false;
  });

  // Custom Daily Profit Target features
  const [dailyProfitTarget, setDailyProfitTarget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('apex_daily_profit_target');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return 1000; // default $1000 profit target
  });

  const [maxDailyDrawdownLimit, setMaxDailyDrawdownLimit] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('apex_max_daily_drawdown_limit');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return 500; // default $500 max daily drawdown limit (5% of 10k baseline)
  });

  useEffect(() => {
    try {
      localStorage.setItem('apex_max_daily_drawdown_limit', maxDailyDrawdownLimit.toString());
    } catch (e) {
      console.error('Error saving max daily drawdown limit:', e);
    }
  }, [maxDailyDrawdownLimit]);

  const [isLiquidatingWorst, setIsLiquidatingWorst] = useState<boolean>(false);
  const [liquidationLog, setLiquidationLog] = useState<string | null>(null);

  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem('apex_daily_profit_target', dailyProfitTarget.toString());
    } catch (e) {
      console.error('Error saving daily profit target:', e);
    }
    // Automatically re-enable alerts/suggestions when user adjusts their target
    setDismissedProfitAlert(false);
  }, [dailyProfitTarget]);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermissionGranted(permission === 'granted');
    } else {
      alert("This browser does not support desktop notifications.");
    }
  };

  // Strategy limit state per asset class with dynamic local persistence
  const [assetClassLimits, setAssetClassLimits] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('apex_asset_limits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            FOREX: typeof parsed.FOREX === 'number' ? parsed.FOREX : 3,
            CRYPTO: typeof parsed.CRYPTO === 'number' ? parsed.CRYPTO : 1,
            METALS: typeof parsed.METALS === 'number' ? parsed.METALS : 1,
          };
        }
      }
    } catch (e) {
      console.error('Error loading asset limits:', e);
    }
    return {
      FOREX: 3,
      CRYPTO: 1,
      METALS: 1
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('apex_asset_limits', JSON.stringify(assetClassLimits));
    } catch (e) {
      console.error('Error saving asset limits:', e);
    }
  }, [assetClassLimits]);

  // Track currently active open trades
  const openTrades = useMemo(() => {
    return trades.filter((t) => t.status === 'OPEN');
  }, [trades]);

  // Count active open trades per asset class dynamically
  const assetClassCounts = useMemo(() => {
    const counts = { FOREX: 0, CRYPTO: 0, METALS: 0 };
    openTrades.forEach((t) => {
      const sym = t.symbol;
      if (['EUR/USD', 'GBP/USD', 'USD/JPY'].includes(sym)) {
        counts.FOREX++;
      } else if (sym === 'BTC/USDT') {
        counts.CRYPTO++;
      } else if (sym === 'GOLD/USD') {
        counts.METALS++;
      }
    });
    return counts;
  }, [openTrades]);

  // Determine if any asset classes exceed set limits
  const assetClassBreaches = useMemo(() => {
    return {
      FOREX: assetClassCounts.FOREX > assetClassLimits.FOREX,
      CRYPTO: assetClassCounts.CRYPTO > assetClassLimits.CRYPTO,
      METALS: assetClassCounts.METALS > assetClassLimits.METALS,
    };
  }, [assetClassCounts, assetClassLimits]);

  const hasAnyAssetBreach = useMemo(() => {
    return Object.values(assetClassBreaches).some(b => b === true);
  }, [assetClassBreaches]);

  const openRR = useMemo(() => {
    let totalTargetRR = 0;
    let validRRCounts = 0;
    openTrades.forEach((t) => {
      const slDist = Math.abs(t.entryPrice - t.stopLoss);
      const tpDist = Math.abs(t.takeProfit - t.entryPrice);
      if (slDist > 0 && tpDist > 0) {
        totalTargetRR += tpDist / slDist;
        validRRCounts++;
      }
    });
    return validRRCounts > 0 ? totalTargetRR / validRRCounts : 0.0;
  }, [openTrades]);

  // Dynamic Open Risk & Leverage calculation
  const riskMetrics = useMemo(() => {
    let totalRiskAtStake = 0;
    
    openTrades.forEach((t) => {
      totalRiskAtStake += getTradeRiskUSD(t);
    });

    // If no open trades, provide a realistic baseline or current exposure metrics
    const finalOpenRisk = openTrades.length > 0 ? totalRiskAtStake : 185.00; 
    
    // If auto-rebalance was completed, simulate the reduced compliant risk
    let solvedRisk = finalOpenRisk;
    if (simulatedRebalanceCompleted) {
      solvedRisk = Math.min(solvedRisk, 148.50); // Bring under $150 (1.5%)
    }

    const portfolioRiskPercent = parseFloat(((solvedRisk / INITIAL_BALANCE) * 100).toFixed(2));
    
    // Daily Loss Limit default set to 5.0% ($500)
    const dailyLimitMax = 500;
    const dailyLossToday = 85.00; // Mock current session commissions & closed slips
    const dailyLossLimitRemainingPercent = parseFloat((((dailyLimitMax - dailyLossToday) / dailyLimitMax) * 100).toFixed(2));

    return {
      openRiskDollar: solvedRisk,
      portfolioRiskPercent: portfolioRiskPercent > 0 ? portfolioRiskPercent : 1.85,
      dailyLossLimitRemaining: dailyLossLimitRemainingPercent,
      activeLevers: openTrades.length,
    };
  }, [openTrades, simulatedRebalanceCompleted]);

  // Sum closed trades plus open trades PnL
  const dailyProfitToday = useMemo(() => {
    const closedPnl = trades.filter(t => t.status === 'CLOSED').reduce((acc, t) => acc + t.pnl, 0);
    const openPnl = openTrades.reduce((acc, t) => acc + t.pnl, 0);
    return closedPnl + openPnl;
  }, [trades, openTrades]);

  // Drawdown Sentinel calculations
  const drawdownSentinelMetrics = useMemo(() => {
    const activeOpenLosses = openTrades.reduce((acc, t) => acc + (t.pnl < 0 ? Math.abs(t.pnl) : 0), 0);
    const closedLossesOnly = trades.filter(t => t.status === 'CLOSED' && t.pnl < 0).reduce((acc, t) => acc + Math.abs(t.pnl), 0);
    
    const sortedCompleted = [...trades]
      .filter(t => t.status === 'CLOSED')
      .sort((a,b) => {
        const tA = new Date(a.exitTimestamp || a.timestamp).getTime();
        const tB = new Date(b.exitTimestamp || b.timestamp).getTime();
        return tA - tB;
      });

    let currentBalance = 10000;
    let peakBalanceToday = 10000;
    let worstDrawdownUSD = 0;

    sortedCompleted.forEach((trade) => {
      currentBalance += trade.pnl;
      if (currentBalance > peakBalanceToday) {
        peakBalanceToday = currentBalance;
      }
      const dd = peakBalanceToday - currentBalance;
      if (dd > worstDrawdownUSD) {
        worstDrawdownUSD = dd;
      }
    });

    const floatingPnl = openTrades.reduce((acc, t) => acc + t.pnl, 0);
    const currentEquity = currentBalance + floatingPnl;
    const peakEquityTotal = Math.max(peakBalanceToday, currentBalance);
    const currentIntradayDrawdown = Math.max(0, peakEquityTotal - currentEquity);

    const actualDrawdown = Math.max(currentIntradayDrawdown, Math.max(0, -dailyProfitToday));
    
    const maxDrawdown = maxDailyDrawdownLimit;
    const remainingBudget = Math.max(0, maxDrawdown - actualDrawdown);
    const distanceToLimitPercent = maxDrawdown > 0 ? (remainingBudget / maxDrawdown) * 105 : 100;
    const clampedDistancePercent = Math.min(100, Math.max(0, distanceToLimitPercent));
    
    const riskStatus = 
      clampedDistancePercent <= 0 ? 'BREACHED' :
      clampedDistancePercent <= 25 ? 'CRITICAL_BUFFER' :
      clampedDistancePercent <= 60 ? 'GUARD_WARNING' :
      'OPTIMAL_SHIELD';

    return {
      actualDrawdown,
      remainingBudget,
      clampedDistancePercent,
      riskStatus,
      peakEquityTotal,
      currentEquity
    };
  }, [trades, openTrades, dailyProfitToday, maxDailyDrawdownLimit]);

  useEffect(() => {
    if (dailyProfitToday >= dailyProfitTarget && dailyProfitTarget > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const alertedDate = localStorage.getItem('apex_alerted_profit_target_date');
      
      if (alertedDate !== todayStr) {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            const notification = new Notification("🏆 Daily Profit Target Reached!", {
              body: `Incredible! Your daily profit of $${dailyProfitToday.toFixed(2)} reached the target of $${dailyProfitTarget.toFixed(2)}. Click here to automatically secure and close all open positions!`,
              icon: '/favicon.ico',
              requireInteraction: true
            });
            notification.onclick = () => {
              if (onEmergencyCloseAll) {
                onEmergencyCloseAll();
              }
              window.focus();
            };
            localStorage.setItem('apex_alerted_profit_target_date', todayStr);
          }
        }
      }
    }
  }, [dailyProfitToday, dailyProfitTarget, onEmergencyCloseAll]);

  // Trigger automatic partial close of all profitable positions when daily target is met & Lock-In is enabled
  useEffect(() => {
    let active = true;

    const triggerAutoLock = async () => {
      const targetTrades = openTrades.filter(t => t.pnl > 0 && !autoLockedTradeIds.includes(t.id));
      if (targetTrades.length === 0) return;

      setIsExecutingAutoLock(true);
      const newlyLockedIds = [...autoLockedTradeIds];
      const newLogs = [...autoLockLogs];

      try {
        for (const t of targetTrades) {
          const ratio = 0.5; // partial profit ratio of exactly 50%
          const res = await fetch(`/api/trades/${t.id}/partial-close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ratio }),
          });
          
          if (res.ok && active) {
            newlyLockedIds.push(t.id);
            newLogs.unshift({
              id: `${t.id}-${Date.now()}`,
              symbol: t.symbol,
              size: t.size,
              pnl: t.pnl,
              time: new Date().toLocaleTimeString(),
            });
          }
        }

        if (active) {
          setAutoLockedTradeIds(newlyLockedIds);
          localStorage.setItem('apex_auto_locked_trade_ids', JSON.stringify(newlyLockedIds));
          
          setAutoLockLogs(newLogs);
          localStorage.setItem('apex_auto_lock_logs', JSON.stringify(newLogs));

          if (onRefreshTrades) {
            onRefreshTrades();
          }
        }
      } catch (error) {
        console.error('Failed automated lock-in profits partial close:', error);
      } finally {
        if (active) {
          setIsExecutingAutoLock(false);
        }
      }
    };

    if (lockInProfits && dailyProfitToday >= dailyProfitTarget && dailyProfitTarget > 0 && !isExecutingAutoLock) {
      triggerAutoLock();
    }

    return () => {
      active = false;
    };
  }, [lockInProfits, dailyProfitToday, dailyProfitTarget, openTrades, autoLockedTradeIds, autoLockLogs, isExecutingAutoLock, onRefreshTrades]);

  // Dataset for 'Suggest Auto-Rebalance' calculations targeting 1.5% limit
  const rebalanceSuggestions = useMemo(() => {
    const targetThresholdDollar = 150; // 1.5% of $10,000 threshold
    const hasActualTrades = openTrades.length > 0;
    
    if (hasActualTrades) {
      // 1. Calculate actual trade risk list
      const tradeRiskList = openTrades.map(t => {
        const riskUSD = getTradeRiskUSD(t);
        return {
          id: t.id,
          symbol: t.symbol,
          side: t.side,
          entryPrice: t.entryPrice,
          stopLoss: t.stopLoss,
          size: t.size,
          riskUSD
        };
      });
      
      const totalRisk = tradeRiskList.reduce((acc, t) => acc + t.riskUSD, 0);
      
      if (totalRisk <= targetThresholdDollar) {
        return {
          requiresRebalance: false,
          totalRisk,
          targetThresholdDollar,
          reductionNeeded: 0,
          recommendations: []
        };
      }
      
      const reductionNeeded = totalRisk - targetThresholdDollar;
      const reductionFactor = reductionNeeded / totalRisk;
      
      const recommendations = tradeRiskList.map(t => {
        const reducedRisk = t.riskUSD * reductionFactor;
        const percentageToClose = Math.round(reductionFactor * 100);
        const recommendedReduceSize = parseFloat((t.size * reductionFactor).toFixed(3));
        const newSize = parseFloat((t.size - recommendedReduceSize).toFixed(3));
        
        return {
          symbol: t.symbol,
          side: t.side,
          originalSize: t.size,
          recommendedReduceSize,
          newSize,
          currentRisk: t.riskUSD,
          reducedRisk,
          newRisk: t.riskUSD - reducedRisk,
          percentageToClose
        };
      }).filter(r => r.recommendedReduceSize > 0);
      
      return {
        requiresRebalance: true,
        totalRisk,
        targetThresholdDollar,
        reductionNeeded,
        recommendations
      };
    } else {
      // Simulator mode / baseline default if no actual trades
      const mockPositions = [
        { symbol: 'EUR/USD' as MarketSymbol, side: 'BUY' as const, size: 1.10, riskUSD: 105.00 },
        { symbol: 'BTC/USDT' as MarketSymbol, side: 'BUY' as const, size: 0.35, riskUSD: 55.00 },
        { symbol: 'GOLD/USD' as MarketSymbol, side: 'BUY' as const, size: 0.15, riskUSD: 25.00 }
      ];
      
      const totalRisk = mockPositions.reduce((acc, p) => acc + p.riskUSD, 0); // $185
      const reductionNeeded = totalRisk - targetThresholdDollar; // $35
      const reductionFactor = reductionNeeded / totalRisk; // ~18.9%
      
      const recommendations = mockPositions.map(p => {
        const reducedRisk = p.riskUSD * reductionFactor;
        const percentageToClose = Math.round(reductionFactor * 100);
        const recommendedReduceSize = parseFloat((p.size * reductionFactor).toFixed(2));
        const newSize = parseFloat((p.size - recommendedReduceSize).toFixed(2));
        
        return {
          symbol: p.symbol,
          side: p.side,
          originalSize: p.size,
          recommendedReduceSize,
          newSize,
          currentRisk: p.riskUSD,
          reducedRisk,
          newRisk: p.riskUSD - reducedRisk,
          percentageToClose
        };
      });
      
      return {
        requiresRebalance: true,
        totalRisk,
        targetThresholdDollar,
        reductionNeeded,
        recommendations
      };
    }
  }, [openTrades]);

  // Net Symbol Exposure aggregation (For summary block)
  const symbolsList: MarketSymbol[] = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/GBP',
    'GOLD/USD', 'SILVER/USD',
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT',
    'US30', 'NAS100', 'GER40', 'SPX500'
  ];
  
  const netSymbolExposure = useMemo(() => {
    return symbolsList.map((sym) => {
      const symOpenTrades = openTrades.filter((t) => t.symbol === sym);
      
      let netDirection: 'LONG' | 'SHORT' | 'FLAT' = 'FLAT';
      let buySize = 0;
      let sellSize = 0;
      let totalPnl = 0;
      let totalSlRisk = 0;
      let totalTpPotential = 0;

      symOpenTrades.forEach((t) => {
        totalPnl += t.pnl;
        
        // precise distance formulas
        const slDistance = Math.abs(t.entryPrice - t.stopLoss);
        const tpDistance = Math.abs(t.entryPrice - t.takeProfit);
        
        let tradeRisk = 0;
        let tradeTp = 0;
        
        if (t.symbol === 'BTC/USDT') {
          tradeRisk = slDistance * t.size;
          tradeTp = tpDistance * t.size;
        } else if (t.symbol === 'USD/JPY') {
          const contractLots = t.size * 100000;
          tradeRisk = slDistance * contractLots * (1 / t.entryPrice);
          tradeTp = tpDistance * contractLots * (1 / t.entryPrice);
        } else {
          const contractLots = t.size * 100000;
          tradeRisk = slDistance * contractLots;
          tradeTp = tpDistance * contractLots;
        }

        if (t.stopLoss > 0 && slDistance > 0) {
          totalSlRisk += tradeRisk;
        } else {
          // Default stop loss offset if not specified (soft protection)
          totalSlRisk += t.size * (t.symbol === 'BTC/USDT' ? 100 : 0.0020) * (t.symbol === 'BTC/USDT' ? 1 : 100000);
        }
        
        if (t.takeProfit > 0 && tpDistance > 0) {
          totalTpPotential += tradeTp;
        } else {
          // Default target offset
          totalTpPotential += t.size * (t.symbol === 'BTC/USDT' ? 300 : 0.0060) * (t.symbol === 'BTC/USDT' ? 1 : 100000);
        }

        if (t.side === 'BUY') {
          buySize += t.size;
        } else {
          sellSize += t.size;
        }
      });

      const netSize = buySize - sellSize;
      if (Math.abs(netSize) < 0.0001) {
        netDirection = 'FLAT';
      } else if (netSize > 0) {
        netDirection = 'LONG';
      } else {
        netDirection = 'SHORT';
      }

      // Safe fallback formatting for visual realism if no transactions exist but represent structure
      const finalSlRisk = symOpenTrades.length > 0 ? totalSlRisk : 0;
      const finalTpPotential = symOpenTrades.length > 0 ? totalTpPotential : 0;

      return {
        symbol: sym,
        netDirection,
        totalLots: parseFloat(Math.abs(netSize).toFixed(3)),
        totalPnl,
        totalSlRisk: finalSlRisk,
        totalTpPotential: finalTpPotential,
        tradesCount: symOpenTrades.length,
      };
    });
  }, [openTrades]);

  // Net Account Aggregate Metrics
  const netAccountExposureSummary = useMemo(() => {
    let grossPositionsValueUSD = 0;
    let aggregateStopLossRisk = 0;
    let aggregateTakeProfitPotential = 0;
    let totalOpenPnl = 0;

    openTrades.forEach((t) => {
      totalOpenPnl += t.pnl;
      let value = 0;
      if (t.symbol === 'BTC/USDT') {
        value = t.size * t.entryPrice;
      } else {
        value = t.size * 100000;
      }
      grossPositionsValueUSD += value;

      const slDistance = Math.abs(t.entryPrice - t.stopLoss);
      let tradeRisk = 0;
      if (t.symbol === 'BTC/USDT') {
        tradeRisk = slDistance * t.size;
      } else if (t.symbol === 'USD/JPY') {
        const contractLots = t.size * 100000;
        tradeRisk = slDistance * contractLots * (1 / t.entryPrice);
      } else {
        const contractLots = t.size * 100000;
        tradeRisk = slDistance * contractLots;
      }
      aggregateStopLossRisk += Math.max(tradeRisk, t.stopLoss > 0 ? 0 : 45);

      const tpDistance = Math.abs(t.entryPrice - t.takeProfit);
      let tradeTp = 0;
      if (t.symbol === 'BTC/USDT') {
        tradeTp = tpDistance * t.size;
      } else if (t.symbol === 'USD/JPY') {
        const contractLots = t.size * 100000;
        tradeTp = tpDistance * contractLots * (1 / t.entryPrice);
      } else {
        const contractLots = t.size * 100000;
        tradeTp = tpDistance * contractLots;
      }
      aggregateTakeProfitPotential += Math.max(tradeTp, t.takeProfit > 0 ? 0 : 135);
    });

    const hasActive = openTrades.length > 0;
    const finalGrossValue = hasActive ? grossPositionsValueUSD : 110000; // standard base forex lot simulation
    const finalSlRisk = hasActive ? aggregateStopLossRisk : 185.00;
    const finalTpPotential = hasActive ? aggregateTakeProfitPotential : 540.00;
    const finalOpenPnl = hasActive ? totalOpenPnl : -45.50;

    // Evaluate USD Correlation risks (EUR/USD vs GBP/USD direction co-exposure warning)
    const eurUsdDir = netSymbolExposure.find(s => s.symbol === 'EUR/USD')?.netDirection || 'FLAT';
    const gbpUsdDir = netSymbolExposure.find(s => s.symbol === 'GBP/USD')?.netDirection || 'FLAT';
    
    let correlationHedgeStatus: 'NOMINAL' | 'USD_COEXPOSURE_WARNING' | 'USD_HEDGE_ACTIVE' = 'NOMINAL';
    if (eurUsdDir !== 'FLAT' && gbpUsdDir !== 'FLAT') {
      if (eurUsdDir === gbpUsdDir) {
        correlationHedgeStatus = 'USD_COEXPOSURE_WARNING';
      } else {
        correlationHedgeStatus = 'USD_HEDGE_ACTIVE';
      }
    }

    return {
      grossPositionsValueUSD: finalGrossValue,
      aggregateStopLossRisk: finalSlRisk,
      aggregateStopLossRiskPercent: parseFloat(((finalSlRisk / INITIAL_BALANCE) * 100).toFixed(2)),
      aggregateTakeProfitPotential: finalTpPotential,
      aggregateTakeProfitPercent: parseFloat(((finalTpPotential / INITIAL_BALANCE) * 100).toFixed(2)),
      totalOpenPnl: finalOpenPnl,
      correlationHedgeStatus,
    };
  }, [openTrades, netSymbolExposure]);

  // Visual dynamic sector-specific exposure donut configuration
  const assetClassExposureData = useMemo(() => {
    let forexValue = 0;
    let cryptoValue = 0;
    let metalsValue = 0;

    openTrades.forEach((t) => {
      let value = 0;
      if (t.symbol === 'BTC/USDT') {
        value = t.size * t.entryPrice;
        cryptoValue += value;
      } else if (t.symbol === 'GOLD/USD') {
        value = t.size * 100000; // standard $100k contract equivalent
        metalsValue += value;
      } else {
        value = t.size * 100000; // standard base forex lot lot equivalent
        forexValue += value;
      }
    });

    const hasActive = openTrades.length > 0;
    // Align fallback values perfectly with the $110,000 summary baseline when no trade is open
    const displayForex = hasActive ? forexValue : 75000;
    const displayCrypto = hasActive ? cryptoValue : 20000;
    const displayMetals = hasActive ? metalsValue : 15000;
    const displayTotal = displayForex + displayCrypto + displayMetals;

    return [
      { 
        name: 'Forex', 
        value: displayForex, 
        percentage: displayTotal > 0 ? (displayForex / displayTotal) * 100 : 0,
        color: '#6366f1',
        count: hasActive ? assetClassCounts.FOREX : 3,
        symbolsDesc: 'EUR/USD, GBP/USD, USD/JPY'
      },
      { 
        name: 'Crypto', 
        value: displayCrypto, 
        percentage: displayTotal > 0 ? (displayCrypto / displayTotal) * 100 : 0,
        color: '#f59e0b',
        count: hasActive ? assetClassCounts.CRYPTO : 1,
        symbolsDesc: 'BTC/USDT'
      },
      { 
        name: 'Metals', 
        value: displayMetals, 
        percentage: displayTotal > 0 ? (displayMetals / displayTotal) * 100 : 0,
        color: '#10b981',
        count: hasActive ? assetClassCounts.METALS : 1,
        symbolsDesc: 'GOLD/USD'
      }
    ];
  }, [openTrades, assetClassCounts]);

  // Generate 30-day exposure timeline data to track potential over-leveraging periods
  const exposureHistoryData = useMemo(() => {
    const data = [];
    const baseRisk = 1.35; // base percentage dynamic risk simulation
    const numDays = 30;
    const now = new Date();
    
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      // Compute deterministic mathematical wave to emulate market cycles
      const cycleMetric = Math.sin(i * 0.45) * 0.5 + Math.cos(i * 0.25) * 0.25;
      
      // Inject over-leveraging spikes to demonstrate high drawdown sessions
      let eventSpike = 0;
      if (i === 23) eventSpike = 1.35; // System Stress Peak
      if (i === 15) eventSpike = 1.65; // FOMC news spike over-leverage session
      if (i === 8) eventSpike = 1.15;  // Core PPI swing
      
      const exposurePercent = parseFloat(Math.max(0.2, baseRisk + cycleMetric + eventSpike).toFixed(2));
      const valueUSD = Math.round(INITIAL_BALANCE * (exposurePercent / 100));
      
      data.push({
        date: dayStr,
        exposure: exposurePercent,
        valueUSD,
        isOverLeveraged: exposurePercent > alertThreshold,
      });
    }
    return data;
  }, [trades, alertThreshold]);

  // Dynamic sector volatility and asset class exposure breakdown
  const sectorBreakdown = useMemo(() => {
    const hasActive = openTrades.length > 0;

    const initialSectors = {
      FOREX: { 
        name: 'Forex (Currencies)', 
        symbols: ['EUR/USD', 'GBP/USD', 'USD/JPY'], 
        color: '#6366f1', 
        baseValue: 70000, 
        baseRisk: 105.00, 
        baseTp: 320.00,
        basePnl: -15.50, 
        icon: 'Globe'
      },
      CRYPTO: { 
        name: 'Crypto (Digital Assets)', 
        symbols: ['BTC/USDT'], 
        color: '#f59e0b', 
        baseValue: 25000, 
        baseRisk: 55.00, 
        baseTp: 140.00,
        basePnl: -22.00, 
        icon: 'Coins'
      },
      METALS: { 
        name: 'Metals (Precious Alloys)', 
        symbols: ['GOLD/USD'], 
        color: '#10b981', 
        baseValue: 15000, 
        baseRisk: 25.00, 
        baseTp: 80.00,
        basePnl: -8.00, 
        icon: 'Gem'
      },
    };

    let totalRiskCounted = 0;

    const sectors = Object.entries(initialSectors).map(([key, info]) => {
      let sizeSum = 0;
      let grossValue = 0;
      let slRisk = 0;
      let tpPotential = 0;
      let pnl = 0;
      let count = 0;

      const sectorTrades = openTrades.filter(t => info.symbols.includes(t.symbol));
      sectorTrades.forEach(t => {
        sizeSum += t.size;
        count++;
        pnl += t.pnl;

        let value = 0;
        if (t.symbol === 'BTC/USDT') {
          value = t.size * t.entryPrice;
        } else {
          value = t.size * 100000;
        }
        grossValue += value;

        const slDistance = Math.abs(t.entryPrice - t.stopLoss);
        let tradeRisk = 0;
        if (t.symbol === 'BTC/USDT') {
          tradeRisk = slDistance * t.size;
        } else if (t.symbol === 'USD/JPY') {
          const contractLots = t.size * 100000;
          tradeRisk = slDistance * contractLots * (1 / t.entryPrice);
        } else {
          const contractLots = t.size * 100000;
          tradeRisk = slDistance * contractLots;
        }
        slRisk += Math.max(tradeRisk, t.stopLoss > 0 ? 0 : 45);

        const tpDistance = Math.abs(t.entryPrice - t.takeProfit);
        let tradeTp = 0;
        if (t.symbol === 'BTC/USDT') {
          tradeTp = tpDistance * t.size;
        } else if (t.symbol === 'USD/JPY') {
          const contractLots = t.size * 100000;
          tradeTp = tpDistance * contractLots * (1 / t.entryPrice);
        } else {
          const contractLots = t.size * 100000;
          tradeTp = tpDistance * contractLots;
        }
        tpPotential += Math.max(tradeTp, t.takeProfit > 0 ? 0 : 135);
      });

      const actualCount = hasActive ? count : (key === 'FOREX' ? 2 : key === 'CRYPTO' ? 1 : 0);
      const actualLots = hasActive ? sizeSum : (key === 'FOREX' ? 1.10 : key === 'CRYPTO' ? 0.35 : 0.0);
      const finalValue = hasActive ? grossValue : info.baseValue;
      const finalRisk = hasActive ? slRisk : info.baseRisk;
      const finalTp = hasActive ? tpPotential : info.baseTp;
      const finalPnl = hasActive ? pnl : info.basePnl;

      totalRiskCounted += finalRisk;

      return {
        key,
        name: info.name,
        color: info.color,
        icon: info.icon,
        count: actualCount,
        lots: actualLots,
        grossValue: finalValue,
        slRisk: finalRisk,
        tpPotential: finalTp,
        pnl: finalPnl,
        volContribution: 0,
      };
    });

    const totalRiskToDivide = totalRiskCounted > 0 ? totalRiskCounted : 185;
    sectors.forEach(s => {
      s.volContribution = Math.round((s.slRisk / totalRiskToDivide) * 100);
    });

    const sorted = [...sectors].sort((a, b) => b.volContribution - a.volContribution);

    return {
      sectors: sorted,
      highestSectName: sorted[0]?.name || 'Forex',
      highestSectKey: sorted[0]?.key || 'FOREX',
      highestSectVol: sorted[0]?.volContribution || 57,
    };
  }, [openTrades]);

  // Allocation splits dataset (Forex, Crypto, Indices)
  const exposureAllocations = [
    { name: 'Forex (EUR/USD, GBP/USD, USD/JPY)', value: 45, color: '#6366f1' },
    { name: 'Crypto (BTC/USDT)', value: 15, color: '#f59e0b' },
    { name: 'Indices (SPX/NDX Equivalent)', value: 10, color: '#10b981' },
    { name: 'Cash Reserve (Protected US Premium Bonds)', value: 30, color: '#374151' },
  ];

  // Stress-Testing parameters (Predictive scenarios simulating drawdowns)
  const stressTestScenarios = [
    { name: 'CPI Surprise (+0.5% Spike)', EUR_USD: -12.5, GBP_USD: -15.0, BTC: -4.2, status: 'BUFFER ACTIVE', color: '#10b981' },
    { name: 'BOJ Emergency Revision', EUR_USD: -4.1, GBP_USD: -3.2, BTC: -1.5, status: 'STABLE RISK', color: '#10b981' },
    { name: 'Crypto Liquidity Squeeze (-10%)', EUR_USD: +1.2, GBP_USD: +0.8, BTC: -12.8, status: 'AUTO LOCK TRIGGERED', color: '#f59e0b' },
    { name: 'Black Swan Volatility Shift', EUR_USD: -25.8, GBP_USD: -28.4, BTC: -32.0, status: 'MAX SL MITIGATED', color: '#ef4444' },
  ];

  const totalExposureSum = exposureAllocations.slice(0, 3).reduce((acc, v) => acc + v.value, 0);

  useEffect(() => {
    setExposurePulse(true);
    const timer = setTimeout(() => setExposurePulse(false), 900);
    return () => clearTimeout(timer);
  }, [riskMetrics.portfolioRiskPercent]);

  useEffect(() => {
    setAllocationPulse(true);
    const timer = setTimeout(() => setAllocationPulse(false), 900);
    return () => clearTimeout(timer);
  }, [totalExposureSum]);

  const worstPerformers = useMemo(() => {
    return [...openTrades]
      .filter((t) => t.pnl < 0)
      .sort((a,b) => a.pnl - b.pnl); // Most negative floating PnL first
  }, [openTrades]);

  const handleLiquidateWorstPerformers = async () => {
    if (worstPerformers.length === 0) return;
    setIsLiquidatingWorst(true);
    setLiquidationLog('Engaging Sentinel Automated Interceptor...');

    // Select the top 1 or 2 worst performing positions contributing most to session volatility
    const targetToLiquidate = worstPerformers.slice(0, 2);
    
    let liquidatedCount = 0;
    for (const trade of targetToLiquidate) {
      try {
        const res = await fetch(`/api/trades/${trade.id}/close`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          liquidatedCount++;
        }
      } catch (e) {
        console.error('Error closing trade in liquidation trigger:', e);
      }
    }

    setLiquidationLog(`Successfully executed Sentinel liquidation of ${liquidatedCount} worst performing assets.`);
    setIsLiquidatingWorst(false);
    if (onRefreshTrades) {
      onRefreshTrades();
    }
    setTimeout(() => {
      setLiquidationLog(null);
    }, 4000);
  };

  const handleLiquidateSinglePosition = async (tradeId: string) => {
    setIsLiquidatingWorst(true);
    setLiquidationLog(`Liquidating specific volatility target...`);
    try {
      const res = await fetch(`/api/trades/${tradeId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setLiquidationLog('Position liquidated successfully.');
      } else {
        setLiquidationLog('Gateway returned an error executing order close.');
      }
    } catch (e) {
      console.error('Error closing specific trade in sentinel:', e);
      setLiquidationLog('Failed to connect to liquidation gateway.');
    }
    setIsLiquidatingWorst(false);
    if (onRefreshTrades) {
      onRefreshTrades();
    }
    setTimeout(() => {
      setLiquidationLog(null);
    }, 4000);
  };

  const downloadCSVReport = () => {
    const lines = [
      'MTXQUANT RISK MANAGEMENT - COMPLIANCE REVIEW REPORT',
      `Report Generated At,${new Date().toISOString()}`,
      `Risk Threshold Limit,${alertThreshold.toFixed(2)}%`,
      `Current Portfolio Risk,${riskMetrics.portfolioRiskPercent.toFixed(2)}%`,
      `Compliance Status,${riskMetrics.portfolioRiskPercent > alertThreshold ? 'BREACH WARNING' : 'NOMINAL SAFE'}`,
      '',
      'PART 1: CURRENT ASSET EXPOSURE BY MARKET SECTOR',
      'Sector Key,Sector Name,Active Positions,Active Leverage Size (Lots),Gross Exposure Value ($),Capital Stop-Loss Risk ($),Intraday Sector PnL ($),Volatility Contribution Factor (%)'
    ];

    sectorBreakdown.sectors.forEach(sect => {
      lines.push([
        sect.key,
        `"${sect.name}"`,
        sect.count,
        sect.lots.toFixed(2),
        sect.grossValue,
        sect.slRisk.toFixed(2),
        sect.pnl.toFixed(2),
        `${sect.volContribution}%`
      ].join(','));
    });

    lines.push('');
    lines.push('PART 2: RISK THRESHOLD BREACH EVENTS (PAST 30-DAY TIMELINE)');
    lines.push('Date,Active Exposure (%),Theoretical Margin Value ($),Threshold Limit Limit (%),Excess Risk Delta (%),Status');

    const breaches = exposureHistoryData.filter(d => d.isOverLeveraged);
    if (breaches && breaches.length === 0) {
      lines.push(`"No active compliance threshold breaches detected in the past 30-day timeline with threshold set at ${alertThreshold.toFixed(2)}%."`);
    } else {
      breaches.forEach(b => {
        const excess = (b.exposure - alertThreshold).toFixed(2);
        lines.push([
          b.date,
          `${b.exposure}%`,
          `$${b.valueUSD}`,
          `${alertThreshold.toFixed(2)}%`,
          `+${excess}%`,
          'RESTRICTION TRIGGERED'
        ].join(','));
      });
    }

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MTXquant_Risk_Compliance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="risk-view-root" className="space-y-6">
      <style>{`
        @keyframes liveValueFlash {
          0% {
            border-color: rgba(99, 102, 241, 0.75);
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.35);
            background-color: rgba(99, 102, 241, 0.08);
          }
          100% {
            border-color: rgba(255, 255, 255, 0.05);
            box-shadow: none;
            background-color: #0a0a0b;
          }
        }
        .live-value-pulse {
          animation: liveValueFlash 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      
      {/* Top Header containing dynamic tabs to clear layout congestion */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <h2 className="text-sm font-black font-mono uppercase tracking-wider text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            Risk Management Desk
          </h2>
          <p className="text-[10px] text-white/40 font-mono mt-1">
            Real-time fiduciary protection gateway & aggregate portfolio exposure matrix
          </p>
        </div>

        {/* Header Actions Grid containing Tabs and Download Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic sub-tab switcher to isolate and organize views */}
          <div className="flex bg-[#0a0a0b] border border-white/5 p-1 rounded-lg shrink-0 select-none">
            <button
              onClick={() => setActiveSubTab('EXPOSURE')}
              className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all flex items-center space-x-1 ${
                activeSubTab === 'EXPOSURE'
                  ? 'bg-indigo-500/10 text-white border border-indigo-500/20 shadow-sm'
                  : 'text-white/40 hover:text-white border border-transparent'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Exposure & Net View</span>
            </button>
            <button
              onClick={() => setActiveSubTab('STRESS_TESTS')}
              className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all flex items-center space-x-1 ${
                activeSubTab === 'STRESS_TESTS'
                  ? 'bg-indigo-500/10 text-white border border-indigo-500/20 shadow-sm'
                  : 'text-white/40 hover:text-white border border-transparent'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Stress Testing</span>
            </button>
            <button
              onClick={() => setActiveSubTab('CORRELATION_SENTIMENT')}
              className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all flex items-center space-x-1 ${
                activeSubTab === 'CORRELATION_SENTIMENT'
                  ? 'bg-indigo-500/10 text-white border border-indigo-500/20 shadow-sm'
                  : 'text-white/40 hover:text-white border border-transparent'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>Correlation & Sentiment</span>
            </button>
          </div>

          <button
            onClick={downloadCSVReport}
            id="download-risk-report-btn"
            className="px-3 py-2 rounded text-[10px] font-mono font-extrabold uppercase tracking-wide transition-all bg-[#10b981]/10 hover:bg-[#10b981]/15 text-emerald-300 hover:text-white border border-emerald-500/20 hover:border-emerald-500/50 shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* --- Exposure Alert Configuration & Visual Warning Console --- */}
      <div id="risk-alert-console" className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          {/* Left panel info & Status */}
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
              <Bell className={`w-4 h-4 ${riskMetrics.portfolioRiskPercent > alertThreshold && !dismissedActiveAlert ? 'text-rose-400 animate-bounce' : 'text-indigo-400'}`} />
              <span>Exposure Guard Monitor Setup</span>
            </h3>
            <p className="text-[10px] text-white/40 font-mono">
              Fiduciary gatekeeper that raises active visual warnings whenever total account portfolio leverage exceeds your tolerance threshold.
            </p>
            
            {/* Real-time Status Badge */}
            <div className="flex items-center gap-2 pt-1 select-none">
              <span className="text-[9px] text-white/30 uppercase font-mono">Control Status:</span>
              {riskMetrics.portfolioRiskPercent > alertThreshold ? (
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-wide bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  LIMIT BREACHED ⚠️
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  NOMINAL SAFE RANGE ✓
                </span>
              )}
            </div>

            {/* Suggest Auto-Rebalance Trigger Button */}
            <div className="pt-3">
              <button
                id="suggest-rebalance-btn"
                onClick={() => {
                  setShowRebalancePanel(!showRebalancePanel);
                  if (simulatedRebalanceCompleted) {
                    setSimulatedRebalanceCompleted(false); // Reset to view original exposure on re-click
                  }
                }}
                className={`px-4 py-2 rounded text-[10px] font-mono font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                  showRebalancePanel
                    ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500/60'
                }`}
                title="Suggest a recommended set of Partial Close actions for high-exposure symbols to bring total account risk back under the 1.5% threshold."
              >
                <Scale className="w-4 h-4 shrink-0" />
                <span>Suggest Auto-Rebalance</span>
                <span className="px-1.5 py-0.5 rounded bg-black/60 text-[8px] border border-white/5 font-black text-indigo-300">1.5% Target</span>
              </button>
            </div>
          </div>

          {/* Configuration controls & sliders */}
          <div className="flex-1 max-w-xl bg-white/[0.02] border border-white/5 rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] font-bold font-mono text-white/80">Adjust Trigger Threshold:</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Number input */}
                <input 
                  type="number"
                  min="0.1"
                  max="10.0"
                  step="0.05"
                  value={alertThreshold}
                  onChange={(e) => {
                    const parsedVal = parseFloat(e.target.value);
                    if (!isNaN(parsedVal) && parsedVal >= 0) {
                      setAlertThreshold(parsedVal);
                      setDismissedActiveAlert(false); // reactive re-arm on adjustment
                    }
                  }}
                  className="bg-[#050505] border border-white/10 rounded px-2 py-1 text-xs font-mono font-bold text-center text-indigo-400 w-16 outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-white/50 font-mono font-bold">%</span>

                {/* Simulated Siren Button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? "Unmute simulated sirens" : "Mute simulated sirens"}
                  className={`p-1 rounded border transition-colors ${
                    isMuted 
                      ? 'bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10' 
                      : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-450 hover:bg-indigo-500/10'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
                </button>
              </div>
            </div>

            {/* Range Slider & Quick Override Presets */}
            <div className="space-y-3">
              <input 
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={alertThreshold}
                onChange={(e) => {
                  setAlertThreshold(parseFloat(e.target.value));
                  setDismissedActiveAlert(false); // re-arm alerts
                }}
                className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500 outline-none"
              />
              <div className="flex items-center justify-between text-[9px] text-white/30 font-mono">
                <span>0.5% Min Limit</span>
                <span>Active Exposure: {riskMetrics.portfolioRiskPercent}%</span>
                <span>5.0% Max Limit</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-white/[0.03]">
                <span className="text-[9px] text-white/30 font-mono uppercase mr-1">Presets:</span>
                {[1.0, 1.5, 2.0, 3.0].map((preset) => (
                  <button
                    key={`preset-${preset}`}
                    onClick={() => {
                      setAlertThreshold(preset);
                      setDismissedActiveAlert(false);
                    }}
                    className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold transition-all ${
                      alertThreshold === preset
                        ? 'bg-indigo-500/10 text-white border border-indigo-500/30'
                        : 'bg-transparent text-white/40 hover:text-white/80 border border-white/5'
                    }`}
                  >
                    {preset.toFixed(1)}%
                  </button>
                ))}
                
                {/* Smart Match active position preset */}
                <button
                  onClick={() => {
                    setAlertThreshold(riskMetrics.portfolioRiskPercent);
                    setDismissedActiveAlert(false);
                  }}
                  className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-white/5 border border-white/5 hover:border-white/10 text-indigo-300 ml-auto"
                >
                  Match Active ({riskMetrics.portfolioRiskPercent}%)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- AUTO REBALANCE PANEL --- */}
        {showRebalancePanel && (
          <div 
            id="auto-rebalance-panel" 
            className="mt-5 p-5 bg-[#050505] border border-indigo-500/30 rounded-lg animate-fadeIn text-[11px] font-mono select-none"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-500/30 text-indigo-400">
                  <Scale className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-white flex items-center gap-1.5 font-mono">
                    <span>Fiduciary Risk Auto-Rebalance Recommendation Engine</span>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  </h4>
                  <p className="text-[9.5px] text-white/40 block">
                    Calculates professional scale-down actions targeting a safe 1.50% total portfolio risk ceiling.
                  </p>
                </div>
              </div>
              <button
                id="btn-rebalance-dismiss"
                onClick={() => setShowRebalancePanel(false)}
                className="text-white/40 hover:text-white text-[10px] font-bold uppercase hover:bg-white/5 px-2 py-1 rounded border border-transparent hover:border-white/5 transition-all cursor-pointer"
              >
                Close Panel
              </button>
            </div>

            {/* Simulated success banner */}
            {simulatedRebalanceCompleted ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10.5px] flex items-start gap-3 animate-fadeIn mb-2 max-w-4xl">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="text-white uppercase font-bold text-[11px] tracking-wider block">Fiduciary Rebalance Successfully Committed!</strong>
                  <p className="text-slate-200 leading-relaxed">
                    Automated client-side partial close simulation successfully ran. Position sizes have been mathematically trimmed on the gateway, compressing aggregate stop-loss exposures under the 1.50% ceiling.
                  </p>
                  <p className="text-white/40 text-[9.5px] font-semibold pt-1">
                    System updated of virtual changes. To reset and recalculate based on original terminal states, toggle the Suggest Auto-Rebalance button.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Math comparison metrics block */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  <div className="bg-white/[0.01] border border-white/5 p-3 rounded-lg">
                    <span className="text-white/30 text-[8.5px] block uppercase font-bold mb-1">Current Risk Exposure</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-white">{(rebalanceSuggestions.totalRisk / INITIAL_BALANCE * 100).toFixed(2)}%</span>
                      <span className="text-[9.5px] text-white/50">(${rebalanceSuggestions.totalRisk.toFixed(2)})</span>
                    </div>
                    <span className="text-[8.5px] text-rose-400 uppercase font-semibold mt-1 block">
                      {rebalanceSuggestions.requiresRebalance ? 'Exceeding safe target limit' : 'Under compliance ceiling'}
                    </span>
                  </div>

                  <div className="bg-white/[0.01] border border-white/5 p-3 rounded-lg">
                    <span className="text-white/30 text-[8.5px] block uppercase font-bold mb-1">Fiduciary Target Threshold</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-indigo-400">1.50%</span>
                      <span className="text-[9.5px] text-white/50">(${rebalanceSuggestions.targetThresholdDollar.toFixed(2)})</span>
                    </div>
                    <span className="text-[8.5px] text-white/30 uppercase font-semibold mt-1 block">Institutional standard limit</span>
                  </div>

                  <div className="bg-white/[0.01] border border-white/5 p-3 rounded-lg">
                    <span className="text-white/30 text-[8.5px] block uppercase font-bold mb-1">Excess Risk Delta</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-sm font-bold ${rebalanceSuggestions.requiresRebalance ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                        {rebalanceSuggestions.requiresRebalance ? `+${(rebalanceSuggestions.reductionNeeded / INITIAL_BALANCE * 100).toFixed(2)}%` : '0.00%'}
                      </span>
                      <span className="text-[9.5px] text-white/50">(${rebalanceSuggestions.reductionNeeded.toFixed(2)})</span>
                    </div>
                    <span className="text-[8.5px] text-white/30 uppercase font-semibold mt-1 block">
                      {rebalanceSuggestions.requiresRebalance ? 'Requires partial close' : 'Risk compliant'}
                    </span>
                  </div>
                </div>

                {!rebalanceSuggestions.requiresRebalance ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white uppercase font-bold">Fiduciary Compliance Confirmed:</strong>
                      <span className="ml-1 text-[#10b981]/95 text-[10.5px] leading-relaxed block mt-1">
                        Total portfolio exposure is currently safe at <strong>{(rebalanceSuggestions.totalRisk / INITIAL_BALANCE * 100).toFixed(2)}%</strong>, which is fully compliant with the 1.5% ceiling. No emergency partial close actions are required at this time. Great position management discipline!
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-[10px] text-[#fbbf24] bg-[#fbbf24]/5 border border-[#fbbf24]/20 p-3 rounded-md leading-relaxed flex items-center gap-1.5 font-sans">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-[#fbbf24]" />
                      <span>
                        <strong>MATHEMATICAL REBALANCE STRATEGY:</strong> Current exposure exceeds the limit by <strong>${rebalanceSuggestions.reductionNeeded.toFixed(2)}</strong>. To maintain the exact relative weight portfolio structure while reducing aggregate stress-risk, we apply a proportional <strong>{rebalanceSuggestions.recommendations[0]?.percentageToClose}% size reduction</strong> constraint across high-exposure open symbols.
                      </span>
                    </div>

                    <div className="border border-white/5 rounded-lg overflow-hidden bg-black/40">
                      <div className="grid grid-cols-5 bg-white/[0.03] px-4 py-2 border-b border-white/5 text-white/40 uppercase font-bold text-[8.5px] tracking-wider">
                        <span className="col-span-1">Symbol & Side</span>
                        <span className="col-span-1 text-center">Original lots</span>
                        <span className="col-span-1 text-center">Reduce size (lots)</span>
                        <span className="col-span-1 text-center font-mono">Trimmed lots</span>
                        <span className="col-span-1 text-right">Risk trimmed (Saving)</span>
                      </div>
                      
                      <div className="divide-y divide-white/5">
                        {rebalanceSuggestions.recommendations.map((rec, rIdx) => (
                          <div key={`rebalance-rec-${rIdx}`} className="grid grid-cols-5 px-4 py-3 items-center hover:bg-white/[0.01] transition-all">
                            <span className="col-span-1 font-bold text-white flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${rec.percentageToClose > 20 ? 'bg-[#fbbf24]' : 'bg-[#8b5cf6]'}`}></span>
                              <span>{rec.symbol}</span>
                              <span className={`px-1 py-0.2 rounded text-[7.5px] font-black tracking-wide ${rec.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {rec.side}
                              </span>
                            </span>
                            <span className="col-span-1 text-center font-bold text-white/70">{rec.originalSize.toFixed(2)}</span>
                            <span className="col-span-1 text-center font-bold text-[#fbbf24]">-{rec.recommendedReduceSize.toFixed(2)} <span className="text-[#fbbf24]/50 font-semibold">({rec.percentageToClose}%)</span></span>
                            <span className="col-span-1 text-center font-bold text-emerald-400">{rec.newSize.toFixed(2)}</span>
                            <span className="col-span-1 text-right font-black text-indigo-300">
                              -${rec.reducedRisk.toFixed(2)}
                              <span className="text-white/30 text-[9px] block font-semibold">(${rec.currentRisk.toFixed(0)} → ${rec.newRisk.toFixed(0)})</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Execute action footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5">
                      <span className="text-[10px] text-white/30 block text-center sm:text-left">
                        * Execution simulates firing parallel MT5 bridge socket events for Partial Close.
                      </span>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          id="btn-rebalance-simulate-execution"
                          onClick={() => {
                            setSimulatedRebalanceCompleted(true);
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-[#fbbf24] hover:bg-[#fbbf24]/80 text-black font-extrabold uppercase rounded shadow transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer text-center text-[10.5px]"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          <span>Execute Rebalance Partial Closes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* --- DYNAMIC BREACH ALARM BANNER ZONE --- */}
        {riskMetrics.portfolioRiskPercent > alertThreshold && !dismissedActiveAlert ? (
          <div className="mt-4 p-4 bg-gradient-to-r from-[#170508] via-[#0d0d10] to-[#0a0a0c] border border-rose-500/50 rounded-lg animate-pulse relative overflow-hidden">
            {/* Linear abstract backdrop highlight */}
            <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-rose-500/5 to-transparent pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black font-mono tracking-wider text-rose-300 uppercase flex items-center gap-1.5">
                    CRITICAL FIDUCIARY THRESHOLD BREACH DETECTED
                  </h4>
                  <p className="text-[10.5px] leading-relaxed text-slate-300">
                    Your dynamic portfolio leverage risk is currently <strong className="text-rose-400 font-mono font-black">{riskMetrics.portfolioRiskPercent}%</strong>, which strictly exceeds your defined guard threshold limit set at <strong className="text-indigo-300 font-mono">{alertThreshold.toFixed(2)}%</strong>. 
                  </p>
                  <p className="text-[10px] text-white/50 font-mono pt-1">
                    Systemic Risk Delta: <strong className="text-rose-400">+{(riskMetrics.portfolioRiskPercent - alertThreshold).toFixed(2)}%</strong>. Active Bridge Orders: <strong className="text-indigo-400">{openTrades.length} positions</strong>.
                  </p>
                  <div className="text-[9.5px] text-amber-400/90 font-mono pt-2 flex items-center gap-1.5 leading-relaxed bg-amber-500/5 border border-amber-500/10 p-2 rounded-md max-w-2xl">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      <strong>CONTROL PROTOCOL STRATEGY:</strong> We recommend adding contrary directional hedge lot offsets on Euro pairs or utilizing our "Match Active" option to adapt thresholds for current volatile sessions.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons inside warning panel */}
              <div className="flex flex-row md:flex-col items-center justify-end gap-2 self-stretch md:self-center shrink-0">
                <button
                  onClick={() => {
                    setAlertThreshold(riskMetrics.portfolioRiskPercent);
                  }}
                  className="flex-1 md:flex-none px-3 py-1.5 rounded text-[10px] uppercase font-mono font-bold bg-rose-500 hover:bg-rose-400 text-black shadow transition-all hover:scale-[1.01] active:scale-95"
                >
                  Override Limit
                </button>
                <button
                  onClick={() => {
                    setDismissedActiveAlert(true);
                  }}
                  className="flex-1 md:flex-none px-3 py-1.5 rounded text-[10px] uppercase font-mono font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-all hover:scale-[1.01] active:scale-95"
                >
                  Snooze Warn
                </button>
              </div>
            </div>
          </div>
        ) : riskMetrics.portfolioRiskPercent > alertThreshold && dismissedActiveAlert ? (
          <div className="mt-3 p-2 bg-[#050505] border border-white/5 rounded text-[9.5px] font-mono text-white/40 flex items-center justify-between select-none animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Exposure breach alarms are presently running in <strong>Snooze / Silence</strong> mode (Triggered: {riskMetrics.portfolioRiskPercent}% vs limit {alertThreshold}%).
            </span>
            <button
              onClick={() => setDismissedActiveAlert(false)}
              className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all"
            >
              Re-Arm Alarm Monitor
            </button>
          </div>
        ) : null}
      </div>

      {/* DAILY PROFIT TARGET LOCK-IN ASSISTANT */}
      <div id="daily-profit-target-panel" className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 mt-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          {/* Left panel info & Status */}
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Daily Profit Target Assistant</span>
            </h3>
            <p className="text-[10px] text-white/40 font-mono">
              Empower your discipline. Set a dynamic daily profit target. When reached, the system fires native desktop alerts encouraging you to stop trading and lock in your gains.
            </p>
            
            {/* Real-time Status Badge */}
            <div className="flex items-center gap-2 pt-1 select-none">
              <span className="text-[9px] text-white/30 uppercase font-mono">Status:</span>
              {dailyProfitToday >= dailyProfitTarget && dailyProfitTarget > 0 ? (
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 animate-fadeIn">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  TARGET SECURED! 🏆 Lock profits
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
                  ACCUMULATING PROGRESS ({dailyProfitTarget > 0 ? ((Math.max(0, dailyProfitToday) / dailyProfitTarget) * 100).toFixed(0) : 0}%)
                </span>
              )}
            </div>

            {/* Desktop Notification Request Button & Automated Toggle */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={requestNotificationPermission}
                className={`px-2.5 py-1.5 rounded text-[9px] font-mono font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  notificationPermissionGranted
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                    : 'bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500/60'
                }`}
                title="Enables native desktop notifications when your daily target PnL is breached"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>{notificationPermissionGranted ? 'alerts active' : 'enable desktop alerts'}</span>
              </button>

              {/* AUTOMATED LOCK-IN PROFITS TOGGLE SWITCH */}
              <button
                id="lock-in-profits-automation-toggle"
                type="button"
                onClick={() => {
                  const newVal = !lockInProfits;
                  setLockInProfits(newVal);
                  try {
                    localStorage.setItem('apex_lock_in_profits', newVal ? 'true' : 'false');
                  } catch {}
                }}
                className={`px-2.5 py-1.5 rounded text-[9px] font-mono font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  lockInProfits 
                    ? 'bg-emerald-500 text-black border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                    : 'bg-[#1a120c] hover:bg-[#251b14] text-amber-500 hover:text-amber-400 border border-amber-500/20 hover:border-amber-500/40'
                }`}
                title="Automatically calculates and submits partial close orders for all profitable positions once the daily profit target is reached, rather than just notifying you."
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${lockInProfits ? 'stroke-[3px]' : ''}`} />
                <span>Lock-In Profits: {lockInProfits ? 'ENABLED' : 'DISABLED'}</span>
              </button>
              
              {!notificationPermissionGranted && (
                <span className="text-[8px] text-rose-400/80 font-mono italic">
                  *Notifications need permission
                </span>
              )}
            </div>

            {/* Lock-In Profits Automated Status Console */}
            {lockInProfits && (
              <div className="pt-3.5 border-t border-white/[0.04] space-y-2.5 mt-2 select-none">
                <div className="flex items-center justify-between text-[8px] sm:text-[9.5px] font-mono">
                  <span className="text-white/40 uppercase tracking-widest font-black flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${isExecutingAutoLock ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                    <span>Auto-Lock status: {isExecutingAutoLock ? 'Executing Orders...' : 'Monitoring Live Targets'}</span>
                  </span>
                  {autoLockLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAutoLockHistory(!showAutoLockHistory)}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors uppercase font-black text-[8.5px] cursor-pointer"
                    >
                      {showAutoLockHistory ? 'Hide History' : `Review History (${autoLockLogs.length})`}
                    </button>
                  )}
                </div>

                {/* Auto Lock History display list */}
                {showAutoLockHistory && autoLockLogs.length > 0 && (
                  <div className="bg-[#050506]/90 border border-white/5 rounded p-3 max-h-40 overflow-y-auto space-y-2 font-mono text-[9px]">
                    <div className="flex justify-between text-[8px] text-white/35 border-b border-white/[0.04] pb-1.5 select-none">
                      <span>SECURED TRADES HISTORY</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAutoLockLogs([]);
                          setAutoLockedTradeIds([]);
                          try {
                            localStorage.removeItem('apex_auto_lock_logs');
                            localStorage.removeItem('apex_auto_locked_trade_ids');
                          } catch {}
                        }}
                        className="text-rose-400 hover:text-rose-300 uppercase font-bold cursor-pointer"
                      >
                        RESET ENGINE HISTORY
                      </button>
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                      {autoLockLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between py-2 text-white/85">
                          <span className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓ LOCKED {log.symbol}</span>
                            <span className="text-white/40">Size: {log.size.toFixed(2)} lots</span>
                          </span>
                          <span className="font-bold text-emerald-400">
                            +${log.pnl.toFixed(2)} PnL secured <span className="text-white/30 text-[8px] font-normal font-sans">({log.time})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configuration controls & sliders */}
          <div className="flex-1 max-w-xl bg-white/[0.02] border border-white/5 rounded-lg p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold font-mono text-white/80">Profit Target Limit (USD):</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Dollar indicator */}
                <span className="text-white/30 text-[10.5px] font-mono font-black">$</span>
                <input 
                  type="number"
                  min="50"
                  max="5000"
                  step="50"
                  value={dailyProfitTarget}
                  onChange={(e) => {
                    const parsedVal = parseFloat(e.target.value);
                    if (!isNaN(parsedVal) && parsedVal >= 0) {
                      setDailyProfitTarget(parsedVal);
                    }
                  }}
                  className="w-20 bg-black/60 border border-white/10 rounded px-2 py-0.5 text-center text-xs font-mono font-black text-emerald-400 focus:outline-none focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Slider input */}
            <div className="space-y-1 bg-black/40 p-2.5 rounded border border-white/5">
              <input 
                type="range"
                min="100"
                max="3000"
                step="50"
                value={dailyProfitTarget}
                onChange={(e) => {
                  setDailyProfitTarget(parseInt(e.target.value));
                }}
                className="w-full accent-emerald-500 cursor-ew-resize bg-white/5 h-1 rounded-lg"
              />
              <div className="flex items-center justify-between text-[8px] font-mono text-white/30 pt-1 select-none">
                <span>$100 (conservative)</span>
                <span>$1,500</span>
                <span>$3,000 (aggressive)</span>
              </div>
            </div>

            {/* Real-time PnL Progress Tracker */}
            <div className="space-y-2 pt-1 border-t border-white/5 select-none text-[10.5px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-white/40">Today's P&L Accumulation:</span>
                <div className="flex items-baseline gap-1">
                  <span className={`font-black ${dailyProfitToday >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {dailyProfitToday >= 0 ? '+' : '-'}${Math.abs(dailyProfitToday).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-white/35">/ ${dailyProfitTarget.toFixed(2)} Target</span>
                </div>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    dailyProfitToday >= dailyProfitTarget ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, (dailyProfitToday / dailyProfitTarget) * 100))}%` }}
                />
              </div>
            </div>

            {/* Target Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[8px] font-mono text-white/30 uppercase tracking-wider">Presets:</span>
              <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-none">
                {[250, 500, 1000, 1500, 2000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDailyProfitTarget(preset)}
                    className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold transition-all select-none cursor-pointer ${
                      dailyProfitTarget === preset
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-transparent text-white/40 hover:text-white/80 border border-white/5'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Safeguard HUD when target is reached and open positions exist */}
      {dailyProfitToday >= dailyProfitTarget && dailyProfitTarget > 0 && openTrades.length > 0 && !dismissedProfitAlert && (
        <div id="discipline-safeguard-hud" className="bg-[#05110d] border border-emerald-500/30 rounded-lg p-5 mt-4 relative overflow-hidden animate-fadeIn select-none">
          {/* Subtle green ambient backing glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1.5 w-fit">
                <Trophy className="w-3.5 h-3.5 animate-bounce shrink-0" />
                Durable Discipline Suggestion Active
              </span>
              <h4 className="text-xs font-mono font-extrabold text-white uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                Automated Safeguard Action Recommended
              </h4>
              <p className="text-[10.5px] text-white/60 font-sans max-w-2xl leading-relaxed">
                Your daily profit today of <strong className="text-emerald-400 font-mono font-bold">${dailyProfitToday.toFixed(2)}</strong> has surpassed your strict risk-budgeted profit target of <strong className="text-white font-mono font-bold">${dailyProfitTarget.toFixed(2)}</strong>. You currently have <strong className="text-white font-mono font-bold">{openTrades.length} open positions</strong> active. Professional trading rules suggest exiting or executing partial profit taking to lock in your daily gains.
              </p>
            </div>
            
            {/* Quick Actions Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 select-none">
              <button
                type="button"
                onClick={() => {
                  if (onEmergencyCloseAll) {
                    onEmergencyCloseAll();
                  }
                }}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-[10px] uppercase tracking-wider rounded border border-emerald-400/20 shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                title="Closes ALL active positions instantly at current market prices"
              >
                💥 Secure & Close All ({openTrades.length})
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (onPartialCloseAll) {
                    onPartialCloseAll(0.5);
                  }
                }}
                className="px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 hover:text-white text-emerald-300 font-mono font-black text-[10px] uppercase tracking-wider rounded border border-emerald-500/30 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                title="Reduces the volume size of all open positions by exactly 50%"
              >
                ⚖️ 50% Take Profit
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  try {
                    localStorage.setItem('apex_dismissed_profit_alert_date', todayStr);
                  } catch {}
                  setDismissedProfitAlert(true);
                }}
                className="px-3 py-2 bg-transparent hover:bg-white/5 text-white/40 hover:text-white/60 font-mono font-bold text-[10px] uppercase tracking-wider rounded border border-white/5 transition-all cursor-pointer"
                title="Snoozes this advice box until tomorrow"
              >
                Snooze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary metric stats bar, sticky on all pages for consistent tracking */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        {/* Metric 1 */}
        <div className={`bg-[#0a0a0b] border border-white/5 p-3.5 rounded-lg flex flex-col justify-between transition-all duration-300 ${allocationPulse ? 'live-value-pulse' : ''}`}>
          <span className="text-white/30 text-[9px] uppercase tracking-wider block font-bold flex items-center justify-between">
            <span>Capital Allocation (Margin)</span>
            <RiskTooltip 
              title="Capital Allocation & Margin Usage" 
              description="Indicates active lot sizes and total leverage deployed dynamically on the trade terminal as a ratio of account equity." 
              formula="Margin Usage % = (Total Invested margin volume / $10,000 Vault value) * 100"
              align="left"
            />
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-lg font-mono font-black text-white">{totalExposureSum}%</span>
            <span className="text-[9px] text-emerald-400 font-bold font-mono">Nominal</span>
          </div>
          <p className="text-[8.5px] text-white/30 mt-1">Max limit capped at 80% basis</p>
        </div>

        {/* Metric 2 */}
        <div className={`bg-[#0a0a0b] border border-white/5 p-3.5 rounded-lg flex flex-col justify-between transition-all duration-300 ${exposurePulse ? 'live-value-pulse' : ''}`}>
          <span className="text-white/30 text-[9px] uppercase tracking-wider block font-bold flex items-center justify-between">
            <span>Account Exposure (Risk)</span>
            <RiskTooltip 
              title="Account Exposure & Risk Portfolio" 
              description="Aggregated risk ratio denoting stop-loss invalidations relative to overall balance, highlighting risk distribution." 
              formula="Exposure % = (Combined Stop-Loss Risk across active positions / $10,000 Balance) * 100"
              align="center"
            />
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className={`text-lg font-mono font-black ${riskMetrics.portfolioRiskPercent < 2.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {riskMetrics.portfolioRiskPercent}%
            </span>
            <span className="text-[9px] text-white/30 font-mono">/ 3.0% limit</span>
          </div>
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(100, (riskMetrics.portfolioRiskPercent / 3.0) * 100)}%` }}></div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#0a0a0b] border border-white/5 p-3.5 rounded-lg flex flex-col justify-between">
          <span className="text-white/30 text-[9px] uppercase tracking-wider block font-bold flex items-center justify-between">
            <span>Daily Drawdown Cap</span>
            <RiskTooltip 
              title="Daily Drawdown Cap" 
              description="A systematic protection guard. If current intraday drawdown hits 5%, account locks automated channels automatically." 
              formula="Cap Remaining % = 5.0% - (Realized Net Loss / Opening Balance)"
              align="center"
            />
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-lg font-mono font-black text-white">{riskMetrics.dailyLossLimitRemaining}%</span>
            <span className="text-[9px] text-emerald-400 font-bold font-mono">Secured</span>
          </div>
          <p className="text-[8.5px] text-white/30 mt-1">Hard limit halts at $500 drop</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0a0a0b] border border-white/5 p-3.5 rounded-lg flex flex-col justify-between">
          <span className="text-white/30 text-[9px] uppercase tracking-wider block font-bold flex items-center justify-between">
            <span>Live Account At-Risk</span>
            <RiskTooltip 
              title="Absolute Live Value At Risk" 
              description="Maximum capital drawdown exposure (in USD cash) if every active order simultaneously hits scheduled Stop Losses." 
              formula="Dollar Risk Amount = ∑ (Pip distance from level to SL * lot magnitude * pip multiplier)"
              align="right"
            />
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-lg font-mono font-black text-indigo-400">${riskMetrics.openRiskDollar.toFixed(2)}</span>
            <span className="text-[9px] text-white/40 font-serif italic">Stop-Loss based</span>
          </div>
          <p className="text-[8.5px] text-white/30 mt-1">Computed on active orders only</p>
        </div>
      </div>

      {/* Subtab Router Rendering */}
      
      {activeSubTab === 'EXPOSURE' && (
        <div className="space-y-6 animate-fadeIn" id="subtab-exposure-view">
          
          {/* RISK-REWARD EFFICIENCY GAUGE CARD */}
          <div className="bg-[#0a0a0b] border border-indigo-500/10 rounded-lg p-5" id="risk-reward-efficiency-gauge">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-3.5 mb-4 gap-2">
              <div className="flex items-center space-x-2">
                <Scale className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                  <span>Risk-Reward Efficiency Gauge</span>
                  <RiskTooltip 
                    title="Risk-to-Reward Ratio (R:R)" 
                    description="Calculates the ratio between the total potential target profit (Reward) and maximum stop-loss threshold (Risk) of all active positions." 
                    formula="Average R:R = ∑ (TakeProfit - EntryPrice) / ∑ (EntryPrice - StopLoss) for active positions"
                    align="right"
                  />
                </h3>
              </div>
              <div className="px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9.5px] text-indigo-400 font-mono font-semibold">
                Efficiency Index
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Dial Indicator */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-black/40 rounded-lg border border-white/5 h-full min-h-[170px]">
                <div className="relative w-40 h-24 overflow-visible">
                  {(() => {
                    const hasActiveTrades = openTrades.length > 0;
                    const displayRR = hasActiveTrades ? openRR : 2.5; // default/demo value 2.5
                    const maxRR = 5.0;
                    const rrPercentage = Math.min(100, Math.max(0, (displayRR / maxRR) * 100));
                    
                    const r = 45;
                    const circ = 2 * Math.PI * r;
                    const needleRotation = -90 + (rrPercentage / 100) * 180;
                    
                    return (
                      <>
                        <svg width="160" height="100" viewBox="0 0 160 100" className="mx-auto overflow-visible select-none">
                          {/* Gauge track */}
                          <path 
                            d="M 20 80 A 60 60 0 0 1 140 80" 
                            fill="none" 
                            stroke="#1e293b" 
                            strokeWidth="10" 
                            strokeLinecap="round" 
                          />
                          {/* Active colored path split */}
                          <path 
                            d="M 20 80 A 60 60 0 0 1 140 80" 
                            fill="none" 
                            stroke={
                              hasActiveTrades === false ? "#6366f1" :
                              displayRR < 1.0 ? "#f87171" : // red
                              displayRR < 2.0 ? "#fbbf24" : // amber
                              displayRR < 3.5 ? "#10b981" : // emerald
                              "#6366f1" // indigo for highly protective risk ratios
                            }
                            strokeWidth="10" 
                            strokeLinecap="round" 
                            strokeDasharray={circ / 2}
                            strokeDashoffset={(circ / 2) * (1 - rrPercentage / 100)}
                            className="transition-all duration-1000 ease-out"
                          />
                          {/* Tick marks */}
                          <text x="14" y="93" className="text-[9px] fill-white/40 font-mono font-bold text-center">0.0</text>
                          <text x="74" y="16" className="text-[9px] fill-white/40 font-mono font-bold text-center">2.5</text>
                          <text x="134" y="93" className="text-[9px] fill-white/40 font-mono font-bold text-center">5.0+</text>

                          {/* Needle group pivot at (80,80) */}
                          <g transform={`rotate(${needleRotation}, 80, 80)`} className="transition-transform duration-1000 ease-out origin-[80px_80px]">
                            {/* Line */}
                            <line x1="80" y1="80" x2="80" y2="25" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                            {/* Head of pointer */}
                            <polygon points="80,18 77,28 83,28" fill="#ffffff" />
                          </g>
                          {/* Central Hub */}
                          <circle cx="80" cy="80" r="7" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
                          <circle cx="80" cy="80" r="2" fill="#ffffff" />
                        </svg>
                      </>
                    );
                  })()}
                </div>
                {openTrades.length === 0 && (
                  <div className="text-[8px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 mt-2 rounded border border-indigo-500/20 uppercase tracking-widest text-center">
                    DEMO MODEL
                  </div>
                )}
              </div>

              {/* Right Analysis Details */}
              <div className="md:col-span-8 space-y-3 font-mono">
                {(() => {
                  const hasActiveTrades = openTrades.length > 0;
                  const displayRR = hasActiveTrades ? openRR : 2.5;
                  
                  return (
                    <>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold font-mono text-white tracking-tight">
                            {displayRR > 0 ? `1 : ${displayRR.toFixed(2)}` : 'N/A'}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                            hasActiveTrades === false ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' :
                            displayRR < 1.0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            displayRR < 2.0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {hasActiveTrades === false ? 'Standby Mode' :
                             displayRR < 1.0 ? 'Unfavorable / Hazardous' :
                             displayRR < 2.0 ? 'Standard Alignment' :
                             'Highly Efficient ✓'}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono block mt-0.5">
                          {hasActiveTrades === false ? 'Average risk target profile of prospective setups' : 'Aggregate live mathematical expectation threshold'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2.5 border-t border-white/[0.03]">
                        <div>
                          <span className="text-white/30 text-[8px] uppercase block font-bold mb-0.5">Evaluation Status</span>
                          <span className={`text-[9.5px] font-extrabold block ${
                            hasActiveTrades === false ? 'text-indigo-455' :
                            displayRR < 1.0 ? 'text-red-400' :
                            displayRR < 2.0 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {hasActiveTrades === false ? 'Await placements' :
                             displayRR < 1.0 ? 'Under-hedged' :
                             displayRR < 2.0 ? 'Balanced' : 'Optimized Yield'}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/30 text-[8px] uppercase block font-bold mb-0.5">Active Setup Count</span>
                          <span className="text-[10px] font-bold text-white block">
                            {openTrades.filter(t => t.stopLoss > 0 && t.takeProfit > 0).length} Positions with Targets
                          </span>
                        </div>
                        <div className="col-span-2 lg:col-span-1">
                          <span className="text-white/30 text-[8px] uppercase block font-bold mb-0.5">Target Discipline</span>
                          <span className="text-[10px] font-bold text-indigo-300 block">
                            {displayRR >= 2.0 ? 'Institutional (>= 1:2)' : 'Retail scale (< 1:2)'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] leading-relaxed text-white/50 pt-1 font-sans">
                        {hasActiveTrades === false ? (
                          "The dial is currently in standby mode displaying a baseline institutional R:R profile of 1:2.50. Once active positions containing defined Take Profits and Stop Losses are established via the trade terminal, this gauge will mathematically evaluate live account expectancies."
                        ) : displayRR < 1.0 ? (
                          "⚠️ WARNING: Your current active average target exposes more capital in Stop-Loss limits than you stand to gain in Take-Profit expectations. To avoid negative mathematical expectancy over high repetitions, consider resizing target margins or widening profit targets."
                        ) : displayRR < 2.0 ? (
                          "Your current active average target resides in standard retail channels (1:1 to 1:2). While secure, establishing strategic targets where the reward is twice your downside risk improves system expectancy and protects account resilience against high drawdown phases."
                        ) : (
                          "👑 EXCELLENT: Your overall live positions feature a defensive average risk-to-reward ratio. This preserves terminal capital efficiency, meaning you can maintain aggregate profitability even with a win-rate under forty-five percent."
                        )}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
          
          {/* STRATEGY ALERT CONFIGURATION PANEL */}
          <div className="bg-[#0a0a0b] border border-amber-500/10 rounded-lg p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-3.5 mb-4 gap-2">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                  <span>Strategy Alerts & Correlation Safeguard</span>
                  <RiskTooltip 
                    title="Correlation Constraints & Limits" 
                    description="Limits maximum simultaneous active orders per sector to hedge against heavy concentration issues in correlated markets." 
                    formula="Rules: Open Trades <= Sector Custom Ceiling (1 to 10 Trades max)"
                    align="right"
                  />
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9.5px] text-amber-400 font-mono font-semibold">
                  Sectors Guard Activated
                </span>
                {hasAnyAssetBreach && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[9.5px] text-rose-400 font-mono font-bold animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    CORRELATION BREACH WARNING
                  </span>
                )}
              </div>
            </div>

            <p className="text-[10px] text-white/40 font-mono mb-4 leading-relaxed">
              Define the maximum allowed concurrent open positions per asset class to hedge against systemic risk and prevent unintentional high Pearson correlation biases. Alarms will trigger automatically when limit ceilings are breached.
            </p>

            {/* General Alert warning if asset class limit is breached */}
            {hasAnyAssetBreach && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg text-[10px] font-mono flex items-start space-x-2.5 mb-4 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <strong className="text-white uppercase">Symmetric Safeguard Breach:</strong>
                  <span className="ml-1">
                    Your current open positions exceed the allocated strategic ceilings. Please modify active limit rules or liquidate correlating lot positions to restore standard risk profiles.
                  </span>
                </div>
              </div>
            )}

            {/* 3column Grid for FOREX, CRYPTO, METALS limit controllers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Asset class 1: FOREX */}
              <div className={`p-4 rounded-lg bg-black/40 border transition-all ${assetClassBreaches.FOREX ? 'border-rose-500/20 shadow-lg shadow-rose-950/5' : 'border-white/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-500/20">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold font-mono text-white block">Forex Trades</span>
                      <span className="text-[8.5px] text-white/40 uppercase font-mono tracking-wider">EUR, GBP, JPY</span>
                    </div>
                  </div>
                  
                  {assetClassBreaches.FOREX ? (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black font-mono tracking-wide bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 uppercase">
                      <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping"></span>
                      Overweight
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      Safe Bias
                    </span>
                  )}
                </div>

                {/* Progress bar info */}
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5 select-none">
                  <span className="text-white/40">Open Positions:</span>
                  <span className="font-bold text-white">
                    {assetClassCounts.FOREX} <span className="text-white/30">/</span> {assetClassLimits.FOREX} Max
                  </span>
                </div>

                {/* Progress bar visual */}
                <div className="w-full bg-[#050505] h-1.5 rounded-full overflow-hidden border border-white/5 mb-4">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${assetClassBreaches.FOREX ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min(100, (assetClassCounts.FOREX / assetClassLimits.FOREX) * 100)}%` }}
                  />
                </div>

                {/* Counter controls with high-tactility +/- */}
                <div className="flex items-center justify-between bg-[#050505] p-1 rounded border border-white/5">
                  <button 
                    onClick={() => {
                      setAssetClassLimits(prev => ({ ...prev, FOREX: Math.max(1, prev.FOREX - 1) }));
                    }}
                    className="h-6 w-8 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/80 rounded font-mono text-sm font-bold flex items-center justify-center transition-all cursor-pointer select-none"
                    title="Decrease Forex limit"
                    disabled={assetClassLimits.FOREX <= 1}
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-black text-indigo-400">
                    {assetClassLimits.FOREX} {assetClassLimits.FOREX === 1 ? 'Trade' : 'Trades'}
                  </span>
                  <button 
                    onClick={() => {
                      setAssetClassLimits(prev => ({ ...prev, FOREX: Math.min(10, prev.FOREX + 1) }));
                    }}
                    className="h-6 w-8 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/80 rounded font-mono text-sm font-bold flex items-center justify-center transition-all cursor-pointer select-none"
                    title="Increase Forex limit"
                    disabled={assetClassLimits.FOREX >= 10}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Asset class 2: CRYPTO */}
              <div className={`p-4 rounded-lg bg-black/40 border transition-all ${assetClassBreaches.CRYPTO ? 'border-rose-500/20 shadow-lg shadow-rose-950/5' : 'border-white/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/10 rounded border border-amber-500/20">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold font-mono text-white block">Crypto Trades</span>
                      <span className="text-[8.5px] text-white/40 uppercase font-mono tracking-wider">BTC / Digital</span>
                    </div>
                  </div>
                  
                  {assetClassBreaches.CRYPTO ? (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black font-mono tracking-wide bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 uppercase">
                      <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping"></span>
                      Overweight
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      Safe Bias
                    </span>
                  )}
                </div>

                {/* Progress bar info */}
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5 select-none">
                  <span className="text-white/40">Open Positions:</span>
                  <span className="font-bold text-white">
                    {assetClassCounts.CRYPTO} <span className="text-white/30">/</span> {assetClassLimits.CRYPTO} Max
                  </span>
                </div>

                {/* Progress bar visual */}
                <div className="w-full bg-[#050505] h-1.5 rounded-full overflow-hidden border border-white/5 mb-4">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${assetClassBreaches.CRYPTO ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, (assetClassCounts.CRYPTO / assetClassLimits.CRYPTO) * 100)}%` }}
                  />
                </div>

                {/* Counter controls with high-tactility +/- */}
                <div className="flex items-center justify-between bg-[#050505] p-1 rounded border border-white/5">
                  <button 
                    onClick={() => {
                      setAssetClassLimits(prev => ({ ...prev, CRYPTO: Math.max(1, prev.CRYPTO - 1) }));
                    }}
                    className="h-6 w-8 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/80 rounded font-mono text-sm font-bold flex items-center justify-center transition-all cursor-pointer select-none"
                    title="Decrease Crypto limit"
                    disabled={assetClassLimits.CRYPTO <= 1}
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-black text-amber-400">
                    {assetClassLimits.CRYPTO} {assetClassLimits.CRYPTO === 1 ? 'Trade' : 'Trades'}
                  </span>
                  <button 
                    onClick={() => {
                      setAssetClassLimits(prev => ({ ...prev, CRYPTO: Math.min(10, prev.CRYPTO + 1) }));
                    }}
                    className="h-6 w-8 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/80 rounded font-mono text-sm font-bold flex items-center justify-center transition-all cursor-pointer select-none"
                    title="Increase Crypto limit"
                    disabled={assetClassLimits.CRYPTO >= 10}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Asset class 3: METALS */}
              <div className={`p-4 rounded-lg bg-black/40 border transition-all ${assetClassBreaches.METALS ? 'border-rose-500/20 shadow-lg shadow-rose-950/5' : 'border-white/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                      <Gem className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold font-mono text-white block">Metals Trades</span>
                      <span className="text-[8.5px] text-white/40 uppercase font-mono tracking-wider">GOLD / Precious</span>
                    </div>
                  </div>
                  
                  {assetClassBreaches.METALS ? (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black font-mono tracking-wide bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 uppercase">
                      <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping"></span>
                      Overweight
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      Safe Bias
                    </span>
                  )}
                </div>

                {/* Progress bar info */}
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5 select-none">
                  <span className="text-white/40">Open Positions:</span>
                  <span className="font-bold text-white">
                    {assetClassCounts.METALS} <span className="text-white/30">/</span> {assetClassLimits.METALS} Max
                  </span>
                </div>

                {/* Progress bar visual */}
                <div className="w-full bg-[#050505] h-1.5 rounded-full overflow-hidden border border-white/5 mb-4">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${assetClassBreaches.METALS ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (assetClassCounts.METALS / assetClassLimits.METALS) * 100)}%` }}
                  />
                </div>

                {/* Counter controls with high-tactility +/- */}
                <div className="flex items-center justify-between bg-[#050505] p-1 rounded border border-white/5">
                  <button 
                    onClick={() => {
                      setAssetClassLimits(prev => ({ ...prev, METALS: Math.max(1, prev.METALS - 1) }));
                    }}
                    className="h-6 w-8 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/80 rounded font-mono text-sm font-bold flex items-center justify-center transition-all cursor-pointer select-none"
                    title="Decrease Metals limit"
                    disabled={assetClassLimits.METALS <= 1}
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-black text-emerald-400">
                    {assetClassLimits.METALS} {assetClassLimits.METALS === 1 ? 'Trade' : 'Trades'}
                  </span>
                  <button 
                    onClick={() => {
                      setAssetClassLimits(prev => ({ ...prev, METALS: Math.min(10, prev.METALS + 1) }));
                    }}
                    className="h-6 w-8 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/80 rounded font-mono text-sm font-bold flex items-center justify-center transition-all cursor-pointer select-none"
                    title="Increase Metals limit"
                    disabled={assetClassLimits.METALS >= 10}
                  >
                    +
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* DRAWDOWN SENTINEL MODULE */}
          <div className="bg-[#0a0a0b] border border-rose-500/15 rounded-lg p-5" id="drawdown-sentinel-module">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-3.5 mb-4 gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-rose-500/10 rounded border border-rose-500/20 text-rose-400">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                    Drawdown Sentinel Compliance Desk
                    <RiskTooltip 
                      title="Drawdown Sentinel" 
                      description="Monitors session equity peak degradation and handles automatic liquidations when current floating losses approach maximum daily limits to preserve terminal buffer." 
                      formula="Distance % = Max(0, Max Drawdown Limit - Current Intraday Drawdown) / Max Drawdown Limit"
                      align="right"
                    />
                  </h3>
                  <span className="text-[9px] text-[#888888] font-mono uppercase block mt-0.5">
                    Fiduciary Interceptor & Downside Guard
                  </span>
                </div>
              </div>

              {/* Real-time Sentinel Status Pill */}
              <div className="flex items-center gap-1.5">
                {drawdownSentinelMetrics.riskStatus === 'BREACHED' && (
                  <span className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-[9.5px] text-rose-400 font-mono font-black animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    🚨 SENTINEL BREACHED
                  </span>
                )}
                {drawdownSentinelMetrics.riskStatus === 'CRITICAL_BUFFER' && (
                  <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[9.5px] text-amber-550 font-mono font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    ⚠️ CRITICAL SHIELD BUFFER
                  </span>
                )}
                {drawdownSentinelMetrics.riskStatus === 'GUARD_WARNING' && (
                  <span className="px-2.5 py-1 rounded bg-yellow-500/5 border border-yellow-500/20 text-[9.5px] text-yellow-400 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    🛡️ GUARD ACTIVE
                  </span>
                )}
                {drawdownSentinelMetrics.riskStatus === 'OPTIMAL_SHIELD' && (
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9.5px] text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-550"></span>
                    ✓ OPTIMAL SAFE SHIELD
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Parameter controls and Visual progress */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-[10.5px] font-mono mb-1.5 select-none">
                      <span className="text-white/50 uppercase font-semibold">Max Daily Drawdown Limit:</span>
                      <span className="text-rose-400 font-black">${maxDailyDrawdownLimit} USD</span>
                    </div>
                    {/* Input Slider */}
                    <input 
                      type="range" 
                      min="100" 
                      max="2000" 
                      step="50"
                      value={maxDailyDrawdownLimit} 
                      onChange={(e) => setMaxDailyDrawdownLimit(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500 lg:accent-rose-500 focus:outline-none"
                    />
                    <div className="flex justify-between text-[8px] text-white/30 font-mono mt-1 select-none">
                      <span>$100 (Tight)</span>
                      <span>$1,000</span>
                      <span>$2,000 (Loose)</span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 space-y-3.5 font-mono text-[10.5px]">
                    <div className="flex justify-between items-center">
                      <span className="text-white/45">Current Peak today:</span>
                      <span className="font-bold text-white font-mono">${drawdownSentinelMetrics.peakEquityTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/45">Current Session Drawdown:</span>
                      <span className={`font-bold font-mono ${drawdownSentinelMetrics.actualDrawdown > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                        -${drawdownSentinelMetrics.actualDrawdown.toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/45">Active Safeguard Room:</span>
                      <span className="font-bold text-emerald-400 font-mono">${drawdownSentinelMetrics.remainingBudget.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                {/* Drawdown Gauge Arc/Visual */}
                <div className="relative p-4 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center">
                  <div className="w-full text-center mb-1.5 font-mono text-[9px] text-[#888888] uppercase tracking-wider">
                    Distance to Max Daily Drawdown
                  </div>
                  
                  {/* Linear Bar Distance indicator */}
                  <div className="w-full select-none mt-2">
                    <div className="flex justify-between items-baseline text-[11px] font-mono mb-1 font-bold">
                      <span className="text-white/40">SENTINEL INTEGRITY CAP</span>
                      <span className={
                        drawdownSentinelMetrics.clampedDistancePercent <= 25 ? 'text-rose-400 animate-pulse' :
                        drawdownSentinelMetrics.clampedDistancePercent <= 60 ? 'text-amber-400' :
                        'text-emerald-400'
                      }>
                        {drawdownSentinelMetrics.clampedDistancePercent.toFixed(1)}% Remaining
                      </span>
                    </div>
                    
                    {/* Visual Segmented Health Bar */}
                    <div className="h-3.5 bg-zinc-950 rounded border border-white/5 overflow-hidden flex p-0.5 gap-0.5">
                      {Array.from({ length: 20 }).map((_, i) => {
                        const threshold = (i / 20) * 100;
                        const isActive = drawdownSentinelMetrics.clampedDistancePercent > threshold;
                        
                        let barBgColor = 'bg-zinc-805';
                        if (isActive) {
                          if (drawdownSentinelMetrics.clampedDistancePercent <= 25) {
                            barBgColor = 'bg-rose-500 shadow shadow-rose-500/20';
                          } else if (drawdownSentinelMetrics.clampedDistancePercent <= 60) {
                            barBgColor = 'bg-amber-500 shadow shadow-amber-500/20';
                          } else {
                            barBgColor = 'bg-emerald-500 shadow shadow-emerald-500/20';
                          }
                        }
                        
                        return (
                          <div 
                            key={i} 
                            className={`h-full flex-1 rounded-sm transition-all duration-500 ${barBgColor}`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-white/35 font-sans mt-3 leading-relaxed text-center">
                      {drawdownSentinelMetrics.clampedDistancePercent <= 25 ? (
                        "⚠️ CRITICAL SYSTEM WARN: Severe account erosion. Automatic compliance triggers will lock order entry if remaining budget hits absolute flat zero."
                      ) : drawdownSentinelMetrics.clampedDistancePercent <= 60 ? (
                        "Shield level weakened by floating session volatility. Monitor distressed assets or liquidate performers to recover leeway."
                      ) : (
                        "Institutional safeguard running. Strategic drawdown buffer satisfies high integrity compliance parameters."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Outliers and Quick-Action Intercept */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="space-y-3.5 h-full flex flex-col justify-between">
                  <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5 select-none">
                      <span className="text-[10px] text-white/50 uppercase font-mono font-bold flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-rose-500" />
                        Active Downside Volatility Outliers (Floating Losses)
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {worstPerformers.length} {worstPerformers.length === 1 ? 'Asset' : 'Assets'}
                      </span>
                    </div>

                    {worstPerformers.length > 0 ? (
                      <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                        {worstPerformers.map((t) => (
                          <div 
                            key={t.id}
                            className="flex items-center justify-between p-2.5 bg-black/50 hover:bg-zinc-950 border border-white/[0.03] hover:border-white/10 rounded transition-all font-mono"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-extrabold text-white">{t.symbol}</span>
                              <div className="flex items-center gap-1.5 text-[9.5px] text-white/40">
                                <span className={`px-1 rounded text-[8px] uppercase ${t.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                  {t.type}
                                </span>
                                <span>{t.size.toFixed(2)} lot</span>
                                <span className="text-[8px] px-1 bg-zinc-900 border border-white/5 rounded">ID: {t.id.slice(-6).toUpperCase()}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-rose-400">
                                ${t.pnl.toFixed(2)} USD
                              </span>
                              <button
                                onClick={() => handleLiquidateSinglePosition(t.id)}
                                disabled={isExecutingAutoLock || isLiquidatingWorst}
                                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition-all text-[9.5px] font-bold rounded cursor-pointer select-none"
                                title="Liquidate individual position immediately"
                              >
                                Liquidate
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-7 text-center flex flex-col items-center justify-center font-mono">
                        <ShieldCheck className="w-10 h-10 text-emerald-400 mb-2 opacity-80" />
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Vol Zone Compliant</h4>
                        <p className="text-[9.5px] text-white/35 max-w-xs mt-1 leading-relaxed">
                          No distressed open positions contributing negatively. All trades aligned and protected by standard mitigators.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Operational Terminal feedback logs */}
                  {liquidationLog && (
                    <div className="p-3 bg-zinc-950 border border-zinc-900 font-mono text-[10px] text-rose-400 leading-relaxed rounded-md flex items-start gap-2 animate-fadeIn shadow-inner">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping mt-1"></div>
                      <div>
                        <strong className="text-white uppercase">[SENTINEL CORE LOG]:</strong>
                        <span className="ml-1.5 text-zinc-300">{liquidationLog}</span>
                      </div>
                    </div>
                  )}

                  {/* Trigger Action block */}
                  <div className="pt-2">
                    <button
                      onClick={handleLiquidateWorstPerformers}
                      disabled={isLiquidatingWorst || worstPerformers.length === 0}
                      className={`w-full py-3.5 px-4 rounded-lg font-mono text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all select-none cursor-pointer ${
                        worstPerformers.length > 0 
                          ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border-rose-500 shadow-lg shadow-rose-950/20' 
                          : 'bg-zinc-900 text-white/20 border-white/5 cursor-not-allowed'
                      }`}
                      title={worstPerformers.length > 0 ? "Liquidate positions with worst session loss contributors" : "No active positions with floating loss to liquidate"}
                    >
                      {isLiquidatingWorst ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                          <span>Executing Emergency Sentinel Liquidations...</span>
                        </>
                      ) : (
                        <>
                          <Zap className={`w-4 h-4 ${worstPerformers.length > 0 ? 'text-white' : 'text-white/10'}`} />
                          <span>Liquidate Worst Performers</span>
                        </>
                      )}
                    </button>
                    <span className="text-[8.5px] text-white/30 text-center block mt-2 font-mono uppercase tracking-wide select-none">
                      Warning: Intercept closes position(s) contributing deepest floating session risks immediately.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* NET VIEW IMPACT SUMMARY COMPONENT - aggregates total exposure across all symbols */}
          <div className="bg-[#0a0a0b] border border-indigo-500/10 rounded-lg p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-3.5 mb-4 gap-2">
              <div className="flex items-center space-x-2">
                <Layers className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Net Symbol Exposure & Max Impact Summary
                </h3>
              </div>
              <div className="px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9.5px] text-indigo-400 font-mono font-semibold">
                Fiduciary Summary Aggregate
              </div>
            </div>

            {/* Overall Header Summary stats blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5 border-b border-white/[0.03] pb-4 select-none">
              <div className="p-3 bg-[#050505] rounded border border-white/5">
                <span className="text-white/35 text-[8.5px] uppercase font-mono block">Aggregate Symbol Lots</span>
                <span className="text-base font-bold font-mono text-white mt-0.5 block">
                  {openTrades.reduce((acc, t) => acc + t.size, 0).toFixed(2)} Lots Committed
                </span>
              </div>
              <div className="p-3 bg-[#050505] rounded border border-white/5">
                <span className="text-white/35 text-[8.5px] uppercase font-mono block">Gross Position Value (Base/Tokens)</span>
                <span className="text-base font-bold font-mono text-indigo-300 mt-0.5 block">
                  ${netAccountExposureSummary.grossPositionsValueUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="p-3 bg-[#050505] rounded border border-white/5">
                <span className="text-white/35 text-[8.5px] uppercase font-mono block">Absolute Max Loss (SL Hit)</span>
                <span className="text-base font-bold font-mono text-rose-400 mt-0.5 block">
                  -${netAccountExposureSummary.aggregateStopLossRisk.toFixed(2)} <span className="text-[10px] text-white/30">({netAccountExposureSummary.aggregateStopLossRiskPercent}%)</span>
                </span>
              </div>
              <div className="p-3 bg-[#050505] rounded border border-white/5">
                <span className="text-white/35 text-[8.5px] uppercase font-mono block">Potential Take-Profit Upside</span>
                <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                  +${netAccountExposureSummary.aggregateTakeProfitPotential.toFixed(2)} <span className="text-[10px] text-white/30">({netAccountExposureSummary.aggregateTakeProfitPercent}%)</span>
                </span>
              </div>
            </div>

            {/* Split layout: Exposure details & Donut chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 items-stretch">
              
              {/* Left Column: Correlation alerts and Net Symbol Exposure Table (Spans 8 columns) */}
              <div className="lg:col-span-8 flex flex-col justify-between">
                <div>
                  {/* Simulated/Active correlation alerts (Hedge feedback) */}
                  {netAccountExposureSummary.correlationHedgeStatus === 'USD_COEXPOSURE_WARNING' && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-[10px] font-mono flex items-center space-x-2.5 mb-5 font-sans leading-relaxed">
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0 animate-pulse" />
                      <span>
                        <strong>⚠️ HIGH USD CO-EXPOSURE ALERT:</strong> EUR/USD and GBP/USD active net directions align. Your account portfolio is highly exposed to systemic American Dollar indexing swings. Offset with a contrary directional hedge or limit overall lot size.
                      </span>
                    </div>
                  )}
                  {netAccountExposureSummary.correlationHedgeStatus === 'USD_HEDGE_ACTIVE' && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-[10px] font-mono flex items-center space-x-2.5 mb-5 font-sans leading-relaxed">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                      <span>
                        <strong>🛡️ USD CORRELATION HEDGE NOMINAL:</strong> EUR/USD and GBP/USD directions drift contrarily. Linear Pearson exposure is protected by symmetric inter-market offsets, safeguarding Account Capital from systemic dollar moves.
                      </span>
                    </div>
                  )}
                  {netAccountExposureSummary.correlationHedgeStatus === 'NOMINAL' && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-slate-300 rounded-lg text-[10px] font-mono flex items-center space-x-2.5 mb-5 font-sans leading-relaxed">
                      <Info className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                      <span>
                        <strong>✓ CORRELATION PROFILE NOMINAL:</strong> No co-aligned high exposure vectors detected. Inter-market risk limits reside well within fiduciary threshold bounds.
                      </span>
                    </div>
                  )}
                  
                  {/* Net Symbol Exposure Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono border-collapse text-[10.5px]">
                      <thead>
                        <tr className="border-b border-white/5 text-[9px] uppercase text-white/40">
                          <th className="pb-2.5">Asset / Symbol</th>
                          <th className="pb-2.5">Net Directional Bias</th>
                          <th className="pb-2.5 text-right">Aggregate Lots</th>
                          <th className="pb-2.5 text-right">Stop-Loss Risk Basis</th>
                          <th className="pb-2.5 text-right">Max Profit Target</th>
                          <th className="pb-2.5 text-right">Intraday P&L</th>
                          <th className="pb-2.5 text-center">Open Exposures</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {netSymbolExposure.map((row) => (
                          <tr key={row.symbol} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-2.5 font-bold text-white/90 flex items-center space-x-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${row.tradesCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-white/10'}`}></span>
                              <span>{row.symbol}</span>
                            </td>
                            <td className="py-2.5">
                              {row.netDirection === 'LONG' ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                                  NET LONG
                                </span>
                              ) : row.netDirection === 'SHORT' ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                                  NET SHORT
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[9px] font-mono text-white/30 border border-white/5 uppercase">
                                  FLAT (NONE)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-right font-bold text-white/80">
                              {row.tradesCount > 0 ? `${row.totalLots.toFixed(2)} Lots` : '--'}
                            </td>
                            <td className="py-2.5 text-right font-bold text-rose-300">
                              {row.tradesCount > 0 ? (
                                <span>-${row.totalSlRisk.toFixed(2)}</span>
                              ) : (
                                <span className="text-white/20">--</span>
                              )}
                            </td>
                            <td className="py-2.5 text-right font-bold text-emerald-450">
                              {row.tradesCount > 0 ? (
                                <span>+${row.totalTpPotential.toFixed(2)}</span>
                              ) : (
                                <span className="text-white/20">--</span>
                              )}
                            </td>
                            <td className="py-2.5 text-right">
                              {row.tradesCount > 0 ? (
                                <span className={`font-black ${row.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {row.totalPnl >= 0 ? '+' : ''}${row.totalPnl.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-white/25">$0.00</span>
                              )}
                            </td>
                            <td className="py-2.5 text-center text-white/50">
                              {row.tradesCount > 0 ? `${row.tradesCount} active` : '0'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Asset class distribution Donut Chart (Spans 4 columns) */}
              <div className="lg:col-span-4 bg-black/40 border border-white/5 p-4 rounded-lg flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <PieIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-white font-mono flex items-center justify-between w-full">
                      <span>Sector Concentration</span>
                      <RiskTooltip 
                        title="Sector Capital Concentration" 
                        description="Visualizes active asset density distribution across the three primary categories: Foreign Forex exchange, Digital Cryptocurrencies, and Commodities metals." 
                        formula="Sector Concentration % = (Sector Margin Volume / Total Margin Volume) × 100"
                        align="right"
                      />
                    </h4>
                  </div>
                  <p className="text-[9.5px] text-white/40 font-mono leading-relaxed">
                    Gross distribution of committed capital across core trading sectors.
                  </p>
                </div>

                <div className="flex-1 min-h-[130px] flex items-center justify-center relative mt-3 select-none">
                  <ResponsiveContainer width="100%" height={135}>
                    <PieChart>
                      <Pie
                        data={assetClassExposureData}
                        cx="50%"
                        cy="50%"
                        innerRadius={41}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {assetClassExposureData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0c0c0e', 
                          border: '1px solid rgba(99, 102, 241, 0.4)', 
                          borderLeft: '3px solid #6366f1',
                          borderRadius: '6px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.85)',
                          fontFamily: 'monospace', 
                          fontSize: '10px' 
                        }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(v: any) => [`$${parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Exposure']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Hollow center dynamic values */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] text-white/30 uppercase tracking-widest leading-none">Gross Val</span>
                    <span className="text-[11px] font-bold font-mono text-white mt-1 leading-none">
                      ${netAccountExposureSummary.grossPositionsValueUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Highly structured interactive legend panels */}
                <div className="space-y-1.5 mt-3 pt-3 border-t border-white/[0.03]">
                  {assetClassExposureData.map((item, idx) => {
                    const IconComp = item.name === 'Forex' ? Globe : item.name === 'Crypto' ? Coins : Gem;
                    return (
                      <div key={`asset-legend-row-${idx}`} className="flex items-center justify-between text-[9px] font-mono p-1.5 rounded bg-black/25 border border-white/[0.02]">
                        <div className="flex items-center gap-1.5">
                          <IconComp className="w-3 h-3 shrink-0" style={{ color: item.color }} />
                          <div>
                            <span className="text-white font-bold block">{item.name}</span>
                            <span className="text-[8px] text-white/30 block leading-tight">{item.symbolsDesc}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-bold block">${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          <span className="font-extrabold text-[8.5px] block leading-none mt-0.5" style={{ color: item.color }}>{item.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* 30-Day Historical Exposure Trend Chart */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3.5 mb-4 gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5" id="historical-exposure-title">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>30-Day Historical Account Exposure Profile</span>
                  <RiskTooltip 
                    title="Historical Exposure Trend Chart" 
                    description="Chronologically maps the dynamic account leverage footprint and the maximum aggregate risk taken across previous days." 
                    formula="Data Point = Daily Portfolio Risk % measured at midnight server close"
                    align="right"
                  />
                </h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">
                  Daily aggregate risk leverage tracking to identify periods of potential over-leveraging
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500"></span>
                  <span className="text-white/60">Risk Leverage (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0 border-t-2 border-dashed border-rose-500"></span>
                  <span className="text-rose-400 font-bold">{alertThreshold.toFixed(2)}% Warning Limit</span>
                </div>
              </div>
            </div>

            <div className="h-[220px] w-full" id="historical-exposure-linechart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={exposureHistoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={9} 
                    fontFamily="monospace"
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={9} 
                    fontFamily="monospace"
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                    domain={[0, 'auto']}
                  />
                  <ReferenceLine 
                    y={alertThreshold} 
                    stroke="#f43f5e" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ value: `Limit: ${alertThreshold}%`, fill: '#f43f5e', fontSize: 8, position: 'top', className: 'font-mono' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const borderStyle = data.isOverLeveraged 
                          ? 'border-rose-500/50 border-l-3 border-l-rose-500' 
                          : 'border-emerald-500/50 border-l-3 border-l-emerald-500';
                        return (
                          <div className={`bg-[#0c0c0e] border ${borderStyle} rounded-lg p-2.5 font-mono text-[10px] space-y-1 shadow-[0_12px_32px_rgba(0,0,0,0.95)]`}>
                            <p className="text-white/40 border-b border-white/5 pb-1 font-bold">{data.date}</p>
                            <div className="flex justify-between gap-4">
                              <span className="text-white/60">Leverage:</span>
                              <span className="font-bold text-white">{data.exposure}%</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-white/60">Capital Risked:</span>
                              <span className="font-bold text-indigo-400">${data.valueUSD.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between gap-4 pt-1 border-t border-white/5">
                              <span className="text-white/60">Fiduciary Status:</span>
                              {data.isOverLeveraged ? (
                                <span className="font-black text-rose-400 animate-pulse uppercase">OVER-LEVERAGED ⚠️</span>
                              ) : (
                                <span className="font-bold text-emerald-400 uppercase">NOMINAL ✓</span>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="exposure" 
                    stroke="#6366f1" 
                    strokeWidth={2} 
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (payload.isOverLeveraged) {
                        return (
                          <circle cx={cx} cy={cy} r={4} fill="#f43f5e" stroke="#000" strokeWidth={1} key={`dot-${cx}`} />
                        );
                      }
                      return (
                        <circle cx={cx} cy={cy} r={2} fill="#6366f1" stroke="none" key={`dot-${cx}`} />
                      );
                    }}
                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 1 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-3.5 border-t border-white/[0.03] text-[9.5px] font-mono leading-relaxed text-white/40 select-none">
              <div className="flex items-start gap-1.5 p-2 bg-rose-500/5 rounded border border-rose-500/10 text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">WARNING THRESHOLD ({alertThreshold.toFixed(2)}%)</span>
                  Exposure levels above {alertThreshold.toFixed(2)}% trigger systematic leverage alarms and risk mitigation protocols.
                </div>
              </div>
              <div className="flex items-start gap-1.5 p-2 bg-indigo-500/5 rounded border border-white/5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white/80 block">MEDIAN CURRENT CYCLE</span>
                  Average leverage has stabilized at <span className="text-white font-bold">1.48%</span>, representing nominal risk tolerances.
                </div>
              </div>
              <div className="flex items-start gap-1.5 p-2 bg-emerald-500/5 rounded border border-white/5 text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">FIDUCIARY CONTROL DEPLOYED</span>
                  MTXquant control layers automatically scale order lots when 30-day exposure averages trend upward.
                </div>
              </div>
            </div>
          </div>

          {/* Asset Class Exposure & Volatility Driver Breakdown */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3.5 mb-5 gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5" id="sector-breakdown-title">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Asset Class Exposure & Volatility Breakdown</span>
                  <RiskTooltip 
                    title="Asset Volatility Factor" 
                    description="Deconstructs general leverage allocations by market sector. Pinpoints systemic stress factors and outlines the percentage contribution of each asset class to total intraday account volatility." 
                    formula="Volatility Contribution % = (Average True Range (ATR) Weight × Sector Leverage Weight) normalized"
                    align="right"
                  />
                </h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">
                  Dynamic categorization of active risk variables grouped by market sector to pinpoint volatility origins
                </p>
              </div>
              <div className="px-2.5 py-1 rounded bg-[#10b981]/15 text-emerald-300 border border-emerald-500/20 text-[9.5px] font-mono leading-relaxed select-none">
                Core Volatility Origin: <span className="font-extrabold uppercase text-white tracking-wide">{sectorBreakdown.highestSectName.split(' ')[0]} ({sectorBreakdown.highestSectVol}%)</span>
              </div>
            </div>

            {/* Main Sector Breakdown Bento List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {sectorBreakdown.sectors.map((sect) => (
                <div 
                  key={sect.key} 
                  className="bg-white/[0.01] border hover:bg-white/[0.02] border-white/5 rounded-lg p-4 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="space-y-3.5 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/5 rounded border border-white/10 flex items-center justify-center">
                          {renderSectorIcon(sect.icon)}
                        </div>
                        <span className="text-[11.5px] font-bold font-mono text-white/90">{sect.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono tracking-wider font-extrabold bg-[#050505] border border-white/5 text-white/50 uppercase">
                          {sect.count} Open
                        </span>
                      </div>
                    </div>

                    {/* Numeric stats list */}
                    <div className="grid grid-cols-2 gap-3.5 pt-1 text-xs">
                      <div>
                        <span className="text-[8.5px] text-white/35 font-mono uppercase block">Active Leverage Size</span>
                        <span className="font-mono font-bold text-white text-[11px]">
                          {sect.lots > 0 ? `${sect.lots.toFixed(2)} Lots` : '0.00 Lots'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-white/35 font-mono uppercase block">Gross Exposure Value</span>
                        <span className="font-mono font-semibold text-indigo-300 text-[11px]">
                          ${sect.grossValue.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-white/35 font-mono uppercase block">Capital SL Risk</span>
                        <span className="font-mono font-black text-rose-400 text-[11px]">
                          ${sect.slRisk.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-white/35 font-mono uppercase block">Intraday Sector PnL</span>
                        <span className={`font-mono font-black text-[11px] ${sect.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {sect.pnl >= 0 ? '+' : ''}${sect.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Volatility footprint progress bar */}
                    <div className="space-y-1.5 pt-1.5 border-t border-white/[0.03]">
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-white/40 uppercase">Volatility Contribution Factor:</span>
                        <span className="font-black" style={{ color: sect.color }}>{sect.volContribution}%</span>
                      </div>
                      <div className="w-full bg-[#050505] h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full rounded-full transition-all duration-500 ease-out" 
                          style={{ 
                            width: `${sect.volContribution}%`,
                            backgroundColor: sect.color 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Volatility Diagnosis overlay advice block */}
                  <div className="mt-3.5 p-2 bg-[#050505] rounded text-[9.5px] font-mono leading-relaxed text-white/40 border border-white/5 select-none relative z-10">
                    {sect.key === 'FOREX' ? (
                      sect.volContribution > 45 ? (
                        <span>⚠️ <strong className="text-indigo-300 font-bold">Macro Liquidity Overweight:</strong> High Forex co-exposure signals elevated multi-vector Dollar indices sensitivity. Consider contrary limits.</span>
                      ) : (
                        <span>✓ <strong className="text-indigo-400 font-bold">Stable Volatility:</strong> Currencies represent conservative mean reverting positions within safe constraints.</span>
                      )
                    ) : sect.key === 'CRYPTO' ? (
                      sect.pnl < -10 ? (
                        <span>⚠️ <strong className="text-amber-400 font-bold">Asymmetric Drawdown Wave:</strong> Digital assets exhibit high beta swings. Tighten stop loss ratios on volatile range boundaries.</span>
                      ) : (
                        <span>✓ <strong className="text-amber-400 font-bold">High-yield Catalyst Nominal:</strong> Volatility contribution fits current account allocation benchmarks perfectly.</span>
                      )
                    ) : sect.lots > 0.4 ? (
                      <span>⚠️ <strong className="text-emerald-300 font-bold">Commodities Squeeze Risk:</strong> Precious metals trends exhibit intensive margin requirements. Safe guard limits enforced.</span>
                    ) : (
                      <span>✓ <strong className="text-emerald-400 font-bold">Inflation Protection Shield:</strong> Precious alloys stabilize portfolio drawdown offsets effectively.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Sector Volatility Bar Comparison Chart */}
            <div className="mt-5 p-4 bg-white/[0.01] border border-white/5 rounded-lg">
              <h4 className="text-[10px] font-bold text-white/80 font-mono uppercase mb-3 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                Comparative Distribution: Volatility Contribution vs Asset Allotment Limit
              </h4>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={sectorBreakdown.sectors.map(s => ({
                      name: s.name.split(' (')[0],
                      'Volatility Factor (%)': s.volContribution,
                      'Target Cap Limit (%)': s.name.includes('Forex') ? 45 : s.name.includes('Crypto') ? 15 : 10,
                      color: s.color,
                    }))}
                    margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={9} fontFamily="monospace" tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={9} fontFamily="monospace" tickLine={false} tickFormatter={(val) => `${val}%`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0c0c0e', 
                        border: '1px solid rgba(99, 102, 241, 0.4)', 
                        borderLeft: '3px solid #6366f1',
                        borderRadius: '6px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.85)',
                        fontFamily: 'monospace', 
                        fontSize: 10 
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="Volatility Factor (%)" fill="#6366f1" radius={[2, 2, 0, 0]}>
                      {sectorBreakdown.sectors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Bar dataKey="Target Cap Limit (%)" fill="rgba(255,255,255,0.1)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-end gap-4 text-[8.5px] font-mono text-white/40 mt-1 select-none">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>Active Volatility Footprint</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-white/10"></span>
                  <span>Target Capital Limit Cap</span>
                </div>
              </div>
            </div>
          </div>

          {/* Allocation splits & Asset descriptions side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Pie Allocation card */}
            <div className="lg:col-span-5 bg-[#0a0a0b] border border-white/5 p-5 rounded-lg flex flex-col justify-between h-[360px]">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono flex items-center space-x-1.5">
                  <PieIcon className="w-4 h-4 text-indigo-400" />
                  <span>Capital Allocation Splits</span>
                </h3>
                <p className="text-[10px] text-white/40 mt-1">Current assets allocation percentage relative to aggregate balance</p>
              </div>

              <div className="flex-1 w-full flex items-center justify-center p-2">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={exposureAllocations}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {exposureAllocations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0c0c0e', 
                        border: '1px solid rgba(16, 185, 129, 0.4)', 
                        borderLeft: '3px solid #10b981',
                        borderRadius: '6px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.85)',
                        fontFamily: 'monospace' 
                      }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(v) => `${v}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend lines */}
              <div className="space-y-1.5 text-[10px] select-none font-mono">
                {exposureAllocations.map((item, idx) => (
                  <div key={`legend-${idx}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-white/50">{item.name.split(' (')[0]}</span>
                    </div>
                    <span className="text-white font-black">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* High level risk conservation parameters description block */}
            <div className="lg:col-span-7 bg-[#0a0a0b] border border-white/5 p-5 rounded-lg flex flex-col justify-between h-[360px]">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Capital Allocation Philosophy</span>
                </h4>
                <p className="text-[10.5px] leading-relaxed text-slate-400 mt-2">
                  Under the <strong>MTXquant Institutional Framework</strong>, capital is distributed mathematically prioritizing systemic insulation. 
                  Forex allocations acts as the core liquidity block due to its deep mean reverting nature, while high volatility sectors like Bitcoin 
                  and Precious metals (Gold) are micro-leveraged with stop losses restricted to a <strong>1.0% maximum aggregate drawdown limit</strong>.
                </p>
              </div>
              
              <div className="border-t border-white/5 pt-4 space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="p-1 bg-indigo-500/10 rounded border border-indigo-500/20 text-indigo-400 text-xs mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h5 className="text-[11px] font-mono text-white/95 uppercase font-bold">1% Rule Safeguard Enabled</h5>
                    <p className="text-[10px] text-white/45 mt-0.5">Orders with risk parameters higher than $100 (1%) are soft-blocked from transmitting to the metatrader interface.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="p-1 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400 text-xs mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h5 className="text-[11px] font-mono text-white/95 uppercase font-bold">Intraday Drawdown Automated Shield</h5>
                    <p className="text-[10px] text-white/45 mt-0.5">Dynamic limit locks your active bridge account automatically if gross PnL drops past -$500 threshold today.</p>
                  </div>
                </div>
              </div>

              <div className="text-[9.5px] text-white/20 italic font-mono">
                *Aggregates calculated dynamically. Live ticks synchronize at 4-second intervals.
              </div>
            </div>

          </div>

        </div>
      )}

      {activeSubTab === 'STRESS_TESTS' && (
        <div className="space-y-6 animate-fadeIn" id="subtab-stress-view">
          
          {/* Institutional Stress-testing table block */}
          <div className="bg-[#0a0a0b] border border-white/5 p-5 rounded-lg flex flex-col justify-between h-auto">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Institutional Crisis Stress-Testing (VaR Simulation)</span>
                  <RiskTooltip 
                    title="Crisis Stress-Testing" 
                    description="Simulates catastrophic structural market event scenarios (e.g., Flash Crashes or Regulatory Shifts) to measure predictive capital impact under high systemic pressure." 
                    formula="99.00% VaR Floor Limit = Daily Volatility Basis × 2.33 factor scaled by active portfolio beta weights"
                    align="right"
                  />
                </h3>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[9.5px] font-mono text-rose-400 font-bold uppercase">
                  Predictive Modeling Active
                </span>
              </div>
              <p className="text-[10.5px] text-white/40 mt-1">
                Predictive scenario stress analytics mapping potential asset drops relative to protective buffers and stop loss parameters.
              </p>
            </div>

            {/* Table representing simulated crisis results */}
            <div className="overflow-x-auto text-[10.5px] pt-4">
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase text-white/40">
                    <th className="pb-2">Simulated Crisis Mode</th>
                    <th className="pb-2 text-right">Forex Shift</th>
                    <th className="pb-2 text-right">Crypto Shift</th>
                    <th className="pb-2 text-center">Auto Shield Protection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {stressTestScenarios.map((scene, index) => (
                    <tr key={`stress-${index}`} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-2.5 font-bold text-white/95">{scene.name}</td>
                      <td className="text-right text-rose-400 font-bold">{scene.EUR_USD >= 0 ? '+' : ''}{scene.EUR_USD.toFixed(1)}%</td>
                      <td className="text-right text-rose-400 font-bold">{scene.BTC >= 0 ? '+' : ''}{scene.BTC.toFixed(1)}%</td>
                      <td className="text-center py-2">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black ${
                          scene.status.includes('BUFFER') 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                            : scene.status.includes('STABLE')
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                            : scene.status.includes('LOCK')
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {scene.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-white/5 pt-4 mt-5 text-[10.5px] text-white/40 flex items-center gap-1.5 leading-relaxed">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Value at Risk (VaR):</strong> Computed 1-week VaR with a 99% confident floor is <strong className="text-indigo-300">$195.10 (1.95%)</strong> under active protective shield parameters.
              </span>
            </div>
          </div>

          {/* Core preservation rules card */}
          <div className="bg-[#0a0a0b] border border-white/5 p-5 rounded-lg select-none">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Capital Conservation & Risk Invalidation Protocols</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10.5px] leading-relaxed text-white/50">
              <div>
                <h5 className="font-bold text-white/95 mb-1 text-[11px] font-mono">Fixed Fractional Allocation Model</h5>
                <p>Each individual trade placement has its Stop Loss strictly computed at 1.0% maximum risk of the aggregate balance. Large scale margin sweeps or trade volume additions above this threshold are automatically soft-blocked.</p>
              </div>
              <div>
                <h5 className="font-bold text-white/95 mb-1 text-[11px] font-mono">Displacement Gap / Slippage Protection</h5>
                <p>The execution gateway evaluates real-time spreads and order book imbalance values prior to transmission. Orders are held if current symbol spread exceeds 1.5 ATR pips deviation threshold to enforce execution precision.</p>
              </div>
              <div>
                <h5 className="font-bold text-white/95 mb-1 text-[11px] font-mono">Daily Stop/Loss Hard Limit Protection</h5>
                <p>If the account P&L hits a collective intraday decrease of $500.00, our API lock secures the account, suspending algorithmic executions and disabling active bridge tunnels for immediate downside lockdown protection.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'CORRELATION_SENTIMENT' && (
        <div className="space-y-6 animate-fadeIn" id="subtab-correlation-view">
          {/* Exposure-mapped correlation cluster heatmap and multi-dimensional scatter map */}
          <CorrelationHeatmap trades={trades} />

          {/* New Fiduciary Portfolio Correlation Widget */}
          <PortfolioCorrelationWidget trades={trades} />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <CorrelationMatrix />
            <MarketSentimentHeatmap />
          </div>
        </div>
      )}

      {/* Historical Breach Log component */}
      <div className="mt-6">
        <HistoricalBreachLog />
      </div>

    </div>
  );
}
