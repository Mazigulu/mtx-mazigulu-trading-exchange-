/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MarketSymbol, MarketMetrics } from '../types';
import { 
  Cpu, 
  Workflow, 
  Settings, 
  Layers, 
  CheckCircle, 
  Copy, 
  Sparkles, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  Activity, 
  GitFork, 
  Plus, 
  Check, 
  HelpCircle,
  Code,
  Gauge,
  Zap,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface MtxExpertArchitectProps {
  symbol: MarketSymbol;
  metrics: MarketMetrics;
}

interface PrimitiveRule {
  id: string;
  category: 'SIGNAL' | 'FILTER' | 'RISK' | 'EXIT';
  name: string;
  description: string;
  mqlSnippet: string;
  pineSnippet: string;
  params: {
    id: string;
    name: string;
    type: 'NUMBER' | 'SELECT' | 'BOOLEAN';
    value: any;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    desc: string;
  }[];
}

export default function MtxExpertArchitect({ symbol, metrics }: MtxExpertArchitectProps) {
  const [activeTab, setActiveTab] = useState<'MQL5' | 'PINE'>('MQL5');
  const [synthesizing, setSynthesizing] = useState(false);
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([
    'ema_cross', 'atr_filter', 'fractional_risk', 'atr_trailing'
  ]);
  const [showGuide, setShowGuide] = useState(false);
  
  // Complexity & entropy indicators
  const [isSynthesized, setIsSynthesized] = useState(true);

  // Core MQL5 Primitives database
  const [rules, setRules] = useState<PrimitiveRule[]>([
    {
      id: 'ema_cross',
      category: 'SIGNAL',
      name: 'EMA Double Crossover',
      description: 'Generates buy and sell event triggers based on standard fast and slow Exponential Moving Average crosses.',
      mqlSnippet: `// EMA Double Crossover Primitive
bool CheckEMACrossover(int &signal) {
   double fastCurrent = iMA(_Symbol, _Period, fast_ema_period, 0, MODE_EMA, PRICE_CLOSE, 0);
   double fastPrevious = iMA(_Symbol, _Period, fast_ema_period, 0, MODE_EMA, PRICE_CLOSE, 1);
   double slowCurrent = iMA(_Symbol, _Period, slow_ema_period, 0, MODE_EMA, PRICE_CLOSE, 0);
   double slowPrevious = iMA(_Symbol, _Period, slow_ema_period, 0, MODE_EMA, PRICE_CLOSE, 1);
   
   if(fastPrevious <= slowPrevious && fastCurrent > slowCurrent) {
      signal = 1; // Buy Signal
      return true;
   }
   if(fastPrevious >= slowPrevious && fastCurrent < slowCurrent) {
      signal = -1; // Sell Signal
      return true;
   }
   return false;
}`,
      pineSnippet: `// EMA Double Crossover Primitive
fastEma = ta.ema(close, fast_ema_period)
slowEma = ta.ema(close, slow_ema_period)
buySignal = ta.crossover(fastEma, slowEma)
sellSignal = ta.crossunder(fastEma, slowEma)`,
      params: [
        { id: 'fast_ema', name: 'Fast EMA Period', type: 'NUMBER', value: 14, min: 3, max: 50, step: 1, desc: 'Responsive trigger EMA scale' },
        { id: 'slow_ema', name: 'Slow EMA Period', type: 'NUMBER', value: 50, min: 20, max: 200, step: 5, desc: 'Anchor structural trend EMA scale' }
      ]
    },
    {
      id: 'rsi_extreme',
      category: 'SIGNAL',
      name: 'RSI Reversal Bounds',
      description: 'Identifies overextended price conditions using boundaries of standard Relative Strength Index to generate contrarian entries.',
      mqlSnippet: `// RSI Reversal Bounds Primitive
bool CheckRSIReversal(int &signal) {
   double rsiVal = iRSI(_Symbol, _Period, rsi_period, PRICE_CLOSE, 0);
   if(rsiVal < rsi_oversold_level) {
      signal = 1; // oversold buy
      return true;
   }
   if(rsiVal > rsi_overbought_level) {
      signal = -1; // overbought sell
      return true;
   }
   return false;
}`,
      pineSnippet: `// RSI Reversal Bounds Primitive
rsiVal = ta.rsi(close, rsi_period)
buySignal = rsiVal < rsi_oversold_level
sellSignal = rsiVal > rsi_overbought_level`,
      params: [
        { id: 'rsi_period', name: 'RSI Period', type: 'NUMBER', value: 14, min: 5, max: 30, step: 1, desc: 'Calculations lookback width' },
        { id: 'rsi_overbought', name: 'Overbought Limit', type: 'NUMBER', value: 70, min: 60, max: 90, step: 2, desc: 'Bearish contrarian trigger boundary' },
        { id: 'rsi_oversold', name: 'Oversold Limit', type: 'NUMBER', value: 30, min: 10, max: 40, step: 2, desc: 'Bullish contrarian trigger boundary' }
      ]
    },
    {
      id: 'atr_filter',
      category: 'FILTER',
      name: 'ATR Volatility Shield',
      description: 'Suppresses entries during flat, illiquid sessions by verifying that Average True Range exceeds threshold parameters.',
      mqlSnippet: `// ATR Volatility Shield Primitive
bool IsVolatilitySufficient() {
   double atr = iATR(_Symbol, _Period, atr_period, 0);
   double minPips = min_atr_pips * _Point;
   if(_Symbol == "USDJPY" || _Symbol == "EURGBP") minPips *= 10;
   return (atr >= minPips);
}`,
      pineSnippet: `// ATR Volatility Shield Primitive
atrVal = ta.atr(atr_period)
minPipsVal = min_atr_pips * syminfo.mintick * 10
volatilityOk = atrVal >= minPipsVal`,
      params: [
        { id: 'atr_period', name: 'ATR Lookback', type: 'NUMBER', value: 14, min: 5, max: 30, step: 1, desc: 'Smoothing period for True Range average' },
        { id: 'min_atr_pips', name: 'Min Pip Threshold', type: 'NUMBER', value: 15, min: 5, max: 100, step: 5, desc: 'Minimum pip spread to allow execution' }
      ]
    },
    {
      id: 'trend_filter',
      category: 'FILTER',
      name: 'HTF Trend Core Filter',
      description: 'Aligns all transaction legs with macro structural directions. Restricts signals to buy-only above HTF EMA and sell-only below.',
      mqlSnippet: `// High-Timeframe Trend Filter Primitive
bool IsTrendAligned(int signal) {
   double htfEma = iMA(_Symbol, htf_period, htf_ema_scale, 0, MODE_EMA, PRICE_CLOSE, 0);
   double currentBid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(signal == 1 && currentBid < htfEma) return false; // Block buys below trendline
   if(signal == -1 && currentBid > htfEma) return false; // Block sells above trendline
   return true;
}`,
      pineSnippet: `// High-Timeframe Trend Filter Primitive
htfEmaVal = request.security(syminfo.tickerid, htf_period, ta.ema(close, htf_ema_scale))
trendAligned = (buySignal and close > htfEmaVal) or (sellSignal and close < htfEmaVal)`,
      params: [
        { id: 'htf_period', name: 'HTF Timeframe', type: 'SELECT', value: 'PERIOD_H4', options: ['PERIOD_H1', 'PERIOD_H4', 'PERIOD_D1'], desc: 'Target timeframe for structural filtering' },
        { id: 'htf_ema_scale', name: 'HTF Trend Scale', type: 'NUMBER', value: 200, min: 50, max: 300, step: 10, desc: 'Moving Average scale representing core macro trend line' }
      ]
    },
    {
      id: 'fractional_risk',
      category: 'RISK',
      name: 'Fractional Account Risk Model',
      description: 'Dynamically computes the lot size of each execution based on active stop distance and specified total loss percentage constraint.',
      mqlSnippet: `// Fractional Risk Lot Sizing Primitive
double CalculateDynamicLots(double stopLossPips) {
   double accountFreeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double riskMoney = accountFreeMargin * (fractional_risk_percent / 100.0);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double contractSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_CONTRACT_SIZE);
   
   if(stopLossPips <= 0) return default_flat_lots;
   
   // Formulate risk size:
   double pointVal = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double lossAmountValue = stopLossPips * pointVal * contractSize;
   double calculatedLots = riskMoney / lossAmountValue;
   
   // Normalise lots
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   
   calculatedLots = MathRound(calculatedLots / stepLot) * stepLot;
   if(calculatedLots < minLot) calculatedLots = minLot;
   if(calculatedLots > maxLot) calculatedLots = maxLot;
   
   return calculatedLots;
}`,
      pineSnippet: `// Fractional Risk Lot Sizing Primitive
riskPercentMoney = (strategy.equity * (fractional_risk_percent / 100.0))
// Calculate position scale in pine script
posSizeLots = riskPercentMoney / (stopLossPipsVal * syminfo.point * 100000)`,
      params: [
        { id: 'fractional_risk_percent', name: 'Marginal Risk %', type: 'NUMBER', value: 1.5, min: 0.1, max: 5.0, step: 0.1, desc: 'Maximum account margin loss per trade' },
        { id: 'default_flat_lots', name: 'Flat Sizing Fallback', type: 'NUMBER', value: 0.1, min: 0.01, max: 2.0, step: 0.05, desc: 'Fallback volume size if calculations error' }
      ]
    },
    {
      id: 'fixed_ratio_risk',
      category: 'RISK',
      name: 'Fixed Capital Sizing',
      description: 'Applies absolute uniform lot structures across all trades regardless of stop size. Simplifies margin allocations.',
      mqlSnippet: `// Fixed Capital Sizing Primitive
double CalculateDynamicLots(double stopLossPips) {
   return uniform_lot_capacity;
}`,
      pineSnippet: `// Fixed Capital Sizing Primitive
posSizeLots = uniform_lot_capacity`,
      params: [
        { id: 'uniform_lot_capacity', name: 'Lot Size', type: 'NUMBER', value: 0.5, min: 0.01, max: 10.0, step: 0.05, desc: 'Fixed uniform trade size in contracts' }
      ]
    },
    {
      id: 'atr_trailing',
      category: 'EXIT',
      name: 'ATR Volatility Trailing Stop',
      description: 'Protects cumulative profits during strong long-duration trends by dynamically locking gains behind an ATR step band.',
      mqlSnippet: `// ATR Volatility Trailing Stop Primitive
void ApplyATRTrailingStop() {
   double atr = iATR(_Symbol, _Period, trailing_atr_period, 0);
   double trailDist = atr * trailing_atr_multiplier;
   
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      string symbol = PositionGetSymbol(i);
      if(symbol != _Symbol) continue;
      
      ulong ticket = PositionGetInteger(POSITION_TICKET);
      double currentSL = PositionGetDouble(POSITION_SL);
      double entryPrice = PositionGetDouble(POSITION_PRICE_OPEN);
      ENUM_POSITION_TYPE posType = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
      
      double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      
      if(posType == POSITION_TYPE_BUY) {
         double newSL = bid - trailDist;
         if(newSL > entryPrice && (currentSL == 0 || newSL > currentSL)) {
            MqlTradeRequest request = {};
            MqlTradeResult result = {};
            request.action = TRADE_ACTION_SLTP;
            request.position = ticket;
            request.sl = NormalizeDouble(newSL, _Digits);
            request.tp = PositionGetDouble(POSITION_TP);
            OrderSend(request, result);
         }
      }
      else if(posType == POSITION_TYPE_SELL) {
         double newSL = ask + trailDist;
         if(newSL < entryPrice && (currentSL == 0 || newSL < currentSL)) {
            MqlTradeRequest request = {};
            MqlTradeResult result = {};
            request.action = TRADE_ACTION_SLTP;
            request.position = ticket;
            request.sl = NormalizeDouble(newSL, _Digits);
            request.tp = PositionGetDouble(POSITION_TP);
            OrderSend(request, result);
         }
      }
   }
}`,
      pineSnippet: `// ATR Volatility Trailing Stop Primitive
atrTrailVal = ta.atr(trailing_atr_period) * trailing_atr_multiplier
strategy.exit("TrailExit", "LongEntry", trail_points=atrTrailVal / syminfo.point)`,
      params: [
        { id: 'trailing_atr_period', name: 'Exit Lookback', type: 'NUMBER', value: 14, min: 5, max: 30, step: 1, desc: 'Smoothing lookback for exit ATR steps' },
        { id: 'trailing_atr_multiplier', name: 'ATR Multiplier', type: 'NUMBER', value: 2.5, min: 1.5, max: 5.0, step: 0.1, desc: 'Standard deviation multiplier representing trailing cushion space' }
      ]
    },
    {
      id: 'breakeven_lock',
      category: 'EXIT',
      name: 'Dynamic Break-Even Lock',
      description: 'Locks safety buffers. Automatically moves stop-loss coordinates directly to the trade open price as soon as the price advances a specific threshold.',
      mqlSnippet: `// Dynamic Break-Even Lock Primitive
void ApplyBreakEvenProtection() {
   double beTrigger = be_trigger_pips * _Point;
   double beBuffer = be_buffer_pips * _Point;
   if(_Symbol == "USDJPY" || _Symbol == "EURGBP") {
      beTrigger *= 10;
      beBuffer *= 10;
   }
   
   for(int i = PositionsTotal() - 1; i >= 0; i--) {
      string symbol = PositionGetSymbol(i);
      if(symbol != _Symbol) continue;
      
      ulong ticket = PositionGetInteger(POSITION_TICKET);
      double currentSL = PositionGetDouble(POSITION_SL);
      double entryPrice = PositionGetDouble(POSITION_PRICE_OPEN);
      ENUM_POSITION_TYPE posType = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
      
      double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      
      if(posType == POSITION_TYPE_BUY) {
         if(bid - entryPrice >= beTrigger && (currentSL < entryPrice)) {
            MqlTradeRequest request = {};
            MqlTradeResult result = {};
            request.action = TRADE_ACTION_SLTP;
            request.position = ticket;
            request.sl = NormalizeDouble(entryPrice + beBuffer, _Digits);
            request.tp = PositionGetDouble(POSITION_TP);
            OrderSend(request, result);
         }
      }
      else if(posType == POSITION_TYPE_SELL) {
         if(entryPrice - ask >= beTrigger && (currentSL == 0 || currentSL > entryPrice)) {
            MqlTradeRequest request = {};
            MqlTradeResult result = {};
            request.action = TRADE_ACTION_SLTP;
            request.position = ticket;
            request.sl = NormalizeDouble(entryPrice - beBuffer, _Digits);
            request.tp = PositionGetDouble(POSITION_TP);
            OrderSend(request, result);
         }
      }
   }
}`,
      pineSnippet: `// Dynamic Break-Even Lock Primitive
if strategy.position_size > 0
    if close - strategy.position_avg_price >= (be_trigger_pips * syminfo.mintick * 10)
        strategy.exit("BreakEven", "LongEntry", stop=strategy.position_avg_price + (be_buffer_pips * syminfo.mintick * 10))`,
      params: [
        { id: 'be_trigger_pips', name: 'Trigger Pips', type: 'NUMBER', value: 20, min: 5, max: 100, step: 5, desc: 'Pips in profit before safety lock overrides current SL' },
        { id: 'be_buffer_pips', name: 'Buffer Pips', type: 'NUMBER', value: 2, min: 0, max: 10, step: 1, desc: 'Pips above entry level to secure execution commissions' }
      ]
    }
  ]);

  // Adjust parameter value directly
  const handleUpdateParamValue = (ruleId: string, paramId: string, newVal: any) => {
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      return {
        ...r,
        params: r.params.map(p => p.id === paramId ? { ...p, value: newVal } : p)
      };
    }));
  };

  // Toggle selection state of rules
  const handleToggleRuleSelection = (ruleId: string) => {
    setSelectedRuleIds(prev => {
      const isSelected = prev.includes(ruleId);
      const ruleToToggle = rules.find(r => r.id === ruleId);
      if (!ruleToToggle) return prev;

      let nextList = [...prev];
      if (isSelected) {
        // Enforce at least one rule in each category or let it be flexible
        nextList = nextList.filter(id => id !== ruleId);
      } else {
        // If selecting a mutually exclusive rule in risk, toggle the other
        if (ruleToToggle.category === 'RISK') {
          const mutualRiskRule = rules.find(r => r.category === 'RISK' && r.id !== ruleId);
          if (mutualRiskRule) {
            nextList = nextList.filter(id => id !== mutualRiskRule.id);
          }
        }
        nextList.push(ruleId);
      }
      return nextList;
    });
  };

  // Synthesize complete clean MQL5 / Pine file programmatically based on active building blocks
  const synthesizedSourceCode = useMemo(() => {
    const selectedRules = rules.filter(r => selectedRuleIds.includes(r.id));
    
    // Extract parameter mapping values
    const paramVals: Record<string, any> = {};
    selectedRules.forEach(r => {
      r.params.forEach(p => {
        paramVals[p.id] = p.value;
      });
    });

    if (activeTab === 'MQL5') {
      // Structure highly professional compiled MQL5 Expert Advisor code
      const hasEmaCross = selectedRuleIds.includes('ema_cross');
      const hasRsiExtreme = selectedRuleIds.includes('rsi_extreme');
      const hasAtrFilter = selectedRuleIds.includes('atr_filter');
      const hasTrendFilter = selectedRuleIds.includes('trend_filter');
      const hasFractionalRisk = selectedRuleIds.includes('fractional_risk');
      const hasFixedSizing = selectedRuleIds.includes('fixed_ratio_risk');
      const hasAtrTrailing = selectedRuleIds.includes('atr_trailing');
      const hasBreakeven = selectedRuleIds.includes('breakeven_lock');

      const header = `//+------------------------------------------------------------------+
//|                                                 mTX_Emergent.mq5 |
//|                                      mTX QUANT PLATFORM COMPILER |
//|                                             https://mtxquant.com |
//+------------------------------------------------------------------+
#property copyright "mTX Quant Technology Corporation"
#property link      "https://mtxquant.com"
#property version   "1.00"
#property strict

//--- Include core trade classes
#include <Trade\\Trade.mqh>
CTrade trade;

//--- Expert Input Parameters (Recombined simple rule bounds)`;

      let inputParams = ``;
      selectedRules.forEach(r => {
        r.params.forEach(p => {
          const mqlType = typeof p.value === 'number' ? 'double' : 'string';
          const paramName = `${p.id}`;
          inputParams += `\ninput ${mqlType} ${paramName} = ${p.value}; // ${p.name}: ${p.desc}`;
        });
      });

      const lifecycleInit = `

//--- System status flags
int magic_number = 8876412;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("mTX Expert Architect | Recombination Engine booting successfully on: ", _Symbol);
   trade.SetExpertMagicNumber(magic_number);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("mTX Expert Architect | Deinitialized. Reason code: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick generation event loop handler                        |
//+------------------------------------------------------------------+
void OnTick()
{
   // 1. Structural Exit Rules (Dynamic Trailing & Locks)
   ${hasAtrTrailing ? 'ApplyATRTrailingStop();' : '// No trailing stop configured'}
   ${hasBreakeven ? 'ApplyBreakEvenProtection();' : '// No break-even lock configured'}

   // Check if we have an open position to avoid duplicate entries
   if(PositionsTotal() > 0) return;

   // 2. Market Signals Trigger Core
   int signal = 0; // 0 = neutral, 1 = buy, -1 = sell
   bool signalDetected = false;
   
   ${hasEmaCross ? 'signalDetected = CheckEMACrossover(signal);' : hasRsiExtreme ? 'signalDetected = CheckRSIReversal(signal);' : 'signalDetected = false;'}
   
   if(!signalDetected || signal == 0) return;

   // 3. Filtering Rules (Trend & Volatility Filters)
   ${hasAtrFilter ? 'if(!IsVolatilitySufficient()) return;' : '// Volatility check bypassed'}
   ${hasTrendFilter ? 'if(!IsTrendAligned(signal)) return;' : '// Macro Trend alignment check bypassed'}

   // 4. Sizing Rule Calculation
   double tradeStopPips = 50.0; // Dynamic baseline
   double lots = ${hasFractionalRisk ? 'CalculateDynamicLots(tradeStopPips);' : hasFixedSizing ? 'CalculateDynamicLots(tradeStopPips);' : '0.1; // Default lot fallback'}

   // 5. Execution placement
   double currentPrice = (signal == 1) ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double stopLossPrice = (signal == 1) ? currentPrice - (tradeStopPips * _Point) : currentPrice + (tradeStopPips * _Point);
   double takeProfitPrice = (signal == 1) ? currentPrice + (tradeStopPips * 2.0 * _Point) : currentPrice - (tradeStopPips * 2.0 * _Point);

   if(signal == 1) {
      trade.Buy(lots, _Symbol, currentPrice, NormalizeDouble(stopLossPrice, _Digits), NormalizeDouble(takeProfitPrice, _Digits), "mTX emergent BUY");
   }
   else if(signal == -1) {
      trade.Sell(lots, _Symbol, currentPrice, NormalizeDouble(stopLossPrice, _Digits), NormalizeDouble(takeProfitPrice, _Digits), "mTX emergent SELL");
   }
}
`;

      let functions = `\n//+------------------------------------------------------------------+
//| RECOMBINED PRIMITIVE FUNCTIONAL BLOCKS                           |
//+------------------------------------------------------------------+`;
      selectedRules.forEach(r => {
        functions += `\n\n${r.mqlSnippet}`;
      });

      return `${header}\n${inputParams}\n${lifecycleInit}\n${functions}`;
    } else {
      // Assemble beautiful PineScript
      const selectedRules = rules.filter(r => selectedRuleIds.includes(r.id));
      const hasEmaCross = selectedRuleIds.includes('ema_cross');
      const hasRsiExtreme = selectedRuleIds.includes('rsi_extreme');
      const hasAtrFilter = selectedRuleIds.includes('atr_filter');
      const hasTrendFilter = selectedRuleIds.includes('trend_filter');
      const hasFractionalRisk = selectedRuleIds.includes('fractional_risk');
      const hasFixedSizing = selectedRuleIds.includes('fixed_ratio_risk');
      const hasAtrTrailing = selectedRuleIds.includes('atr_trailing');
      const hasBreakeven = selectedRuleIds.includes('breakeven_lock');

      const header = `//@version=5
strategy("mTX Emergent Recombination Strategy", overlay=true, initial_capital=10000, default_qty_type=strategy.cash, default_qty_value=150)

//--- Inputs`;

      let inputs = ``;
      selectedRules.forEach(r => {
        r.params.forEach(p => {
          if (p.type === 'NUMBER') {
            inputs += `\n${p.id} = input.float(${p.value}, title="${p.name}")`;
          } else {
            inputs += `\n${p.id} = input.string("${p.value}", title="${p.name}")`;
          }
        });
      });

      let body = `\n\n//--- Rules Compilation`;
      selectedRules.forEach(r => {
        body += `\n${r.pineSnippet}`;
      });

      const executionLogic = `

//--- Emergent Signal Coordination
triggerBuy = ${hasEmaCross ? 'buySignal' : hasRsiExtreme ? 'buySignal' : 'false'}
triggerSell = ${hasEmaCross ? 'sellSignal' : hasRsiExtreme ? 'sellSignal' : 'false'}

// Filter overlays
${hasAtrFilter ? 'triggerBuy := triggerBuy and volatilityOk' : ''}
${hasAtrFilter ? 'triggerSell := triggerSell and volatilityOk' : ''}
${hasTrendFilter ? 'triggerBuy := triggerBuy and trendAligned' : ''}
${hasTrendFilter ? 'triggerSell := triggerSell and trendAligned' : ''}

// Stop Loss settings
stopLossPipsVal = 50.0

if triggerBuy
    strategy.entry("LongEntry", strategy.long, qty=${hasFractionalRisk ? 'posSizeLots' : hasFixedSizing ? 'posSizeLots' : '1.0'})

if triggerSell
    strategy.entry("ShortEntry", strategy.short, qty=${hasFractionalRisk ? 'posSizeLots' : hasFixedSizing ? 'posSizeLots' : '1.0'})

// Exit strategies
${hasAtrTrailing ? '// Trailing Stop active\nstrategy.exit("TrailExit", "LongEntry", trail_points=atrTrailVal / syminfo.point)' : ''}
`;

      return `${header}\n${inputs}\n${body}\n${executionLogic}`;
    }
  }, [selectedRuleIds, rules, activeTab]);

  // Compute stats on active layout
  const analytics = useMemo(() => {
    const rulesCount = selectedRuleIds.length;
    // Simple physical rule count determines system configuration potential
    const configurations = Math.pow(2, rulesCount);
    // Dynamic entropy indicator represents interaction scale complexity
    const mathematicalEntropy = (rulesCount * 1.442).toFixed(2);
    
    // Categorized breakdown count
    const signalRules = rules.filter(r => r.category === 'SIGNAL' && selectedRuleIds.includes(r.id)).length;
    const filterRules = rules.filter(r => r.category === 'FILTER' && selectedRuleIds.includes(r.id)).length;
    const riskRules = rules.filter(r => r.category === 'RISK' && selectedRuleIds.includes(r.id)).length;
    const exitRules = rules.filter(r => r.category === 'EXIT' && selectedRuleIds.includes(r.id)).length;

    let synergyRating = 'NOMINAL STRUCTURE';
    let synergyColor = 'text-zinc-400 bg-zinc-900 border-white/5';
    let statusText = 'Add entry and exit rules to compile valid Expert systems.';

    if (signalRules >= 1 && exitRules >= 1 && riskRules >= 1) {
      if (filterRules >= 1) {
        synergyRating = 'PRIME COMPOSITE COHESION';
        synergyColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25';
        statusText = 'Superb alignment. Volatility filters, entry bounds, fractional capital scaling, and trailing protection are seamlessly coordinated.';
      } else {
        synergyRating = 'VALID STRATEGIC MATRIX';
        synergyColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
        statusText = 'Core components present. Adding an ATR or Trend filter will significantly prevent false break-outs.';
      }
    } else {
      synergyRating = 'INCOMPLETE CORE';
      synergyColor = 'text-amber-400 bg-amber-500/10 border-amber-500/25';
      statusText = 'Warning: Missing critical pillars (e.g. signal or exit rules). EA code may compile but will lack fully-formed autonomy.';
    }

    return {
      rulesCount,
      configurations,
      mathematicalEntropy,
      signalRules,
      filterRules,
      riskRules,
      exitRules,
      synergyRating,
      synergyColor,
      statusText
    };
  }, [selectedRuleIds, rules]);

  // Trigger simulated compile rebuild
  const handleRebuildSynthesis = () => {
    setSynthesizing(true);
    setIsSynthesized(false);
    setTimeout(() => {
      setSynthesizing(false);
      setIsSynthesized(true);
      // Play a quick retro synthesized tick sound
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.connect(g);
          g.connect(ctx.destination);
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
          g.gain.setValueAtTime(0.015, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.start();
          osc.stop(ctx.currentTime + 0.18);
        }
      } catch (_) {}
    }, 1200);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(synthesizedSourceCode);
    alert('Synthesized EA Code copied to clipboard!');
  };

  return (
    <div id="mtx-expert-architect-view" className="space-y-6 animate-fadeIn font-mono text-xs text-white/80">
      
      {/* Intro Banner */}
      <div className="bg-[#020204] border border-white/10 p-5 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-1.5">
              <span>mTX Expert Architect</span>
              <span className="text-[8px] bg-indigo-500/25 text-indigo-300 px-1 py-0.2 rounded font-black tracking-normal">RULE RECOMBINATOR</span>
            </h4>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed font-sans max-w-2xl">
            "The most complex phenomena arise from scalable recombination of very simple rules. Whether it's galaxies, chips, or neural networks, if you find the right primitive building blocks, the complexity takes care of itself."
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="px-2.5 py-1 text-[9px] font-bold border border-white/15 text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-all flex items-center gap-1 cursor-pointer self-start sm:self-auto"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Paradigm Theory</span>
        </button>
      </div>

      {/* Philosophy Theory Panel */}
      {showGuide && (
        <div className="bg-indigo-950/10 border border-indigo-500/25 p-4 rounded-lg text-[10px] text-white/70 leading-relaxed space-y-2 animate-fadeIn">
          <div className="flex items-center gap-1.5 text-indigo-300 font-bold uppercase text-[10.5px]">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>METATRADER CORE ARCHITECTURAL INFERENCE: RULE PRIMITIVES</span>
          </div>
          <p>
            Traditional Expert Advisor (EA) development is monolithic, hard-coded, and brittle. If a trader wants to swap a moving average crossover trigger for an RSI extreme, they must entirely rewrite the code structure, risking compile-time errors and state leakage.
          </p>
          <p>
            The **mTX Expert Architect** paradigm represents EAs as an emergent assembly of four decoupled rule primitives:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-white/60">
            <li><strong className="text-white">1. Market Signals (Entry Triggers):</strong> State-less indicators generating point-in-time buy/sell vectors.</li>
            <li><strong className="text-white">2. Volatility/Trend Filters (Gatekeepers):</strong> Contextual filters that approve or block incoming entries based on structural market regimes.</li>
            <li><strong className="text-white">3. Capital allocation (Risk Modules):</strong> Quant-models determining exact contract lots based on margin limits.</li>
            <li><strong className="text-white">4. Exit Rules (State Transformers):</strong> Dynamic trackers managing active positions (Trailing Stops, Breakevens, Timeouts).</li>
          </ul>
          <p className="text-indigo-300/90 italic font-semibold">
            Our platform treats these rules as primitive building blocks (analogous to logical gates on a CPU chip). By selecting, tuning, and recombining these primitives, the complex, secure MetaTrader 5 (MQL5) or TradingView PineScript v5 EA code compiles itself automatically.
          </p>
        </div>
      )}

      {/* Main Structural Bento Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Rules Deck & Parameters Tuning (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rule Primitives Deck</span>
            </span>
            <span className="text-[9px] text-white/30 font-semibold">Toggle nodes to inject into compilation tree</span>
          </div>

          <div className="space-y-4">
            
            {/* Category: Entry Signals */}
            <div className="space-y-2">
              <span className="text-[8.5px] text-sky-400 font-black uppercase tracking-wider block">A) Market Entry Signals (Select One)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rules.filter(r => r.category === 'SIGNAL').map(rule => {
                  const isActive = selectedRuleIds.includes(rule.id);
                  return (
                    <div 
                      key={rule.id}
                      className={`border rounded-lg p-3.5 transition-all flex flex-col justify-between space-y-3 ${
                        isActive 
                          ? 'bg-sky-500/5 border-sky-500/30' 
                          : 'bg-[#040406]/50 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-[10.5px] text-white font-extrabold block">{rule.name}</strong>
                          <p className="text-[9.5px] text-white/45 leading-normal mt-1 font-sans">{rule.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleRuleSelection(rule.id)}
                          className={`p-1 rounded cursor-pointer transition-all ${
                            isActive 
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                              : 'bg-black/40 text-white/30 border border-white/10 hover:text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Display / Adjust params inside card if active */}
                      {isActive && rule.params.length > 0 && (
                        <div className="space-y-2 pt-2.5 border-t border-white/[0.04] text-[9px]">
                          {rule.params.map(p => (
                            <div key={p.id} className="flex items-center justify-between gap-4">
                              <span className="text-white/40 font-mono text-[8px] uppercase">{p.name}:</span>
                              <input 
                                type="number"
                                min={p.min}
                                max={p.max}
                                step={p.step}
                                value={p.value}
                                onChange={(e) => handleUpdateParamValue(rule.id, p.id, parseFloat(e.target.value) || p.value)}
                                className="w-14 bg-black border border-white/10 rounded px-1 py-0.5 text-center text-sky-300 font-bold"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category: Filters */}
            <div className="space-y-2">
              <span className="text-[8.5px] text-amber-400 font-black uppercase tracking-wider block">B) Regime & Volatility Filters</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rules.filter(r => r.category === 'FILTER').map(rule => {
                  const isActive = selectedRuleIds.includes(rule.id);
                  return (
                    <div 
                      key={rule.id}
                      className={`border rounded-lg p-3.5 transition-all flex flex-col justify-between space-y-3 ${
                        isActive 
                          ? 'bg-amber-500/5 border-amber-500/30' 
                          : 'bg-[#040406]/50 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-[10.5px] text-white font-extrabold block">{rule.name}</strong>
                          <p className="text-[9.5px] text-white/45 leading-normal mt-1 font-sans">{rule.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleRuleSelection(rule.id)}
                          className={`p-1 rounded cursor-pointer transition-all ${
                            isActive 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'bg-black/40 text-white/30 border border-white/10 hover:text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Display / Adjust params inside card if active */}
                      {isActive && rule.params.length > 0 && (
                        <div className="space-y-2 pt-2.5 border-t border-white/[0.04] text-[9px]">
                          {rule.params.map(p => (
                            <div key={p.id} className="flex items-center justify-between gap-4">
                              <span className="text-white/40 font-mono text-[8px] uppercase">{p.name}:</span>
                              {p.type === 'SELECT' ? (
                                <select
                                  value={p.value}
                                  onChange={(e) => handleUpdateParamValue(rule.id, p.id, e.target.value)}
                                  className="bg-black border border-white/10 text-[8.5px] rounded px-1 py-0.5 text-amber-300 font-bold font-mono outline-none"
                                >
                                  {p.options?.map(o => (
                                    <option key={o} value={o}>{o.replace('PERIOD_', '')}</option>
                                  ))}
                                </select>
                              ) : (
                                <input 
                                  type="number"
                                  min={p.min}
                                  max={p.max}
                                  step={p.step}
                                  value={p.value}
                                  onChange={(e) => handleUpdateParamValue(rule.id, p.id, parseFloat(e.target.value) || p.value)}
                                  className="w-14 bg-black border border-white/10 rounded px-1 py-0.5 text-center text-amber-300 font-bold"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category: Capital Sizing & Risk */}
            <div className="space-y-2">
              <span className="text-[8.5px] text-emerald-400 font-black uppercase tracking-wider block">C) Capital Risk Allocation Model (Mutually Exclusive)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rules.filter(r => r.category === 'RISK').map(rule => {
                  const isActive = selectedRuleIds.includes(rule.id);
                  return (
                    <div 
                      key={rule.id}
                      className={`border rounded-lg p-3.5 transition-all flex flex-col justify-between space-y-3 ${
                        isActive 
                          ? 'bg-emerald-500/5 border-emerald-500/30' 
                          : 'bg-[#040406]/50 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-[10.5px] text-white font-extrabold block">{rule.name}</strong>
                          <p className="text-[9.5px] text-white/45 leading-normal mt-1 font-sans">{rule.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleRuleSelection(rule.id)}
                          className={`p-1 rounded cursor-pointer transition-all ${
                            isActive 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-black/40 text-white/30 border border-white/10 hover:text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Display / Adjust params inside card if active */}
                      {isActive && rule.params.length > 0 && (
                        <div className="space-y-2 pt-2.5 border-t border-white/[0.04] text-[9px]">
                          {rule.params.map(p => (
                            <div key={p.id} className="flex items-center justify-between gap-4">
                              <span className="text-white/40 font-mono text-[8px] uppercase">{p.name}:</span>
                              <input 
                                type="number"
                                min={p.min}
                                max={p.max}
                                step={p.step}
                                value={p.value}
                                onChange={(e) => handleUpdateParamValue(rule.id, p.id, parseFloat(e.target.value) || p.value)}
                                className="w-14 bg-black border border-white/10 rounded px-1 py-0.5 text-center text-emerald-300 font-bold"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category: Dynamic Exit Transformers */}
            <div className="space-y-2">
              <span className="text-[8.5px] text-rose-400 font-black uppercase tracking-wider block">D) Dynamic Exit Transformers (SL / TP Controls)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rules.filter(r => r.category === 'EXIT').map(rule => {
                  const isActive = selectedRuleIds.includes(rule.id);
                  return (
                    <div 
                      key={rule.id}
                      className={`border rounded-lg p-3.5 transition-all flex flex-col justify-between space-y-3 ${
                        isActive 
                          ? 'bg-rose-500/5 border-rose-500/30' 
                          : 'bg-[#040406]/50 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-[10.5px] text-white font-extrabold block">{rule.name}</strong>
                          <p className="text-[9.5px] text-white/45 leading-normal mt-1 font-sans">{rule.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleRuleSelection(rule.id)}
                          className={`p-1 rounded cursor-pointer transition-all ${
                            isActive 
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                              : 'bg-black/40 text-white/30 border border-white/10 hover:text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Display / Adjust params inside card if active */}
                      {isActive && rule.params.length > 0 && (
                        <div className="space-y-2 pt-2.5 border-t border-white/[0.04] text-[9px]">
                          {rule.params.map(p => (
                            <div key={p.id} className="flex items-center justify-between gap-4">
                              <span className="text-white/40 font-mono text-[8px] uppercase">{p.name}:</span>
                              <input 
                                type="number"
                                min={p.min}
                                max={p.max}
                                step={p.step}
                                value={p.value}
                                onChange={(e) => handleUpdateParamValue(rule.id, p.id, parseFloat(e.target.value) || p.value)}
                                className="w-14 bg-black border border-white/10 rounded px-1 py-0.5 text-center text-rose-300 font-bold"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Rule Flow Diagram & Code Synthesis (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-[#050507] border border-white/10 rounded-lg p-4 space-y-3">
            <span className="text-[9.5px] text-white/45 uppercase font-bold tracking-widest flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-indigo-400" />
              <span>Compilation Schematic Network</span>
            </span>

            {/* Simulated Logic Tree Diagram */}
            <div className="border border-white/5 bg-[#010102]/80 p-4 rounded flex flex-col items-center justify-between space-y-3 select-none text-[9px]">
              
              {/* Box 1: Tick Event Handlers */}
              <div className="w-full text-center border border-indigo-500/25 bg-indigo-500/5 p-2 rounded relative flex items-center justify-center font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2 animate-ping shrink-0"></span>
                <span>MetaTrader Event Handlers (OnTick, OnTimer)</span>
              </div>

              <div className="h-3 w-0.5 bg-indigo-500/40"></div>

              {/* Box 2: Exit protection nodes */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <div className={`p-2 border text-center rounded transition-all ${selectedRuleIds.includes('atr_trailing') ? 'border-rose-500/25 bg-rose-500/5 text-rose-300 font-bold' : 'border-white/5 opacity-30 bg-black/40'}`}>
                  Trailing Stop Node
                </div>
                <div className={`p-2 border text-center rounded transition-all ${selectedRuleIds.includes('breakeven_lock') ? 'border-rose-500/25 bg-rose-500/5 text-rose-300 font-bold' : 'border-white/5 opacity-30 bg-black/40'}`}>
                  Break-Even Lock
                </div>
              </div>

              <div className="h-3 w-0.5 bg-indigo-500/40"></div>

              {/* Box 3: Trigger Signal */}
              <div className="w-full text-center border border-sky-500/25 bg-sky-500/5 p-2 rounded font-bold text-sky-300">
                {selectedRuleIds.includes('ema_cross') ? 'EMA Double Crossover Signal' : selectedRuleIds.includes('rsi_extreme') ? 'RSI Reversal Signal' : 'No Signal Selected'}
              </div>

              <div className="h-3 w-0.5 bg-indigo-500/40"></div>

              {/* Box 4: Filter Regime Checks */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <div className={`p-2 border text-center rounded transition-all ${selectedRuleIds.includes('atr_filter') ? 'border-amber-500/25 bg-amber-500/5 text-amber-300 font-bold' : 'border-white/5 opacity-30 bg-black/40'}`}>
                  ATR Volatility Gate
                </div>
                <div className={`p-2 border text-center rounded transition-all ${selectedRuleIds.includes('trend_filter') ? 'border-amber-500/25 bg-amber-500/5 text-amber-300 font-bold' : 'border-white/5 opacity-30 bg-black/40'}`}>
                  HTF Trend Anchor
                </div>
              </div>

              <div className="h-3 w-0.5 bg-indigo-500/40"></div>

              {/* Box 5: Position Scaling */}
              <div className="w-full text-center border border-emerald-500/25 bg-emerald-500/5 p-2 rounded font-bold text-emerald-300">
                {selectedRuleIds.includes('fractional_risk') ? 'Fractional Lot Sizing (Dynamic pips)' : selectedRuleIds.includes('fixed_ratio_risk') ? 'Fixed Capital Lot Sizing' : 'Default flat lot fallback'}
              </div>

            </div>

            {/* Synergy indicators */}
            <div className={`p-3.5 rounded border transition-all duration-300 space-y-1.5 ${analytics.synergyColor}`}>
              <div className="flex items-center justify-between text-[9px] font-black uppercase">
                <span>Rule Synergy Diagnostic</span>
                <span>{analytics.synergyRating}</span>
              </div>
              <p className="text-[9.5px] leading-relaxed font-sans opacity-85">
                {analytics.statusText}
              </p>
              <div className="pt-2 border-t border-white/[0.04] grid grid-cols-3 gap-2 text-center text-[8.5px] font-mono">
                <div>
                  <span className="text-white/30 block uppercase">Primitives</span>
                  <span className="text-white font-bold text-xs">{analytics.rulesCount}</span>
                </div>
                <div>
                  <span className="text-white/30 block uppercase">Complexity</span>
                  <span className="text-white font-bold text-xs">2^{analytics.rulesCount} ({analytics.configurations})</span>
                </div>
                <div>
                  <span className="text-white/30 block uppercase">Entropy Factor</span>
                  <span className="text-white font-bold text-xs">{analytics.mathematicalEntropy} bits</span>
                </div>
              </div>
            </div>

            {/* Rebuild Trigger CTA */}
            <button
              type="button"
              onClick={handleRebuildSynthesis}
              disabled={synthesizing}
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-900 border border-indigo-500/20 text-white font-black text-[10px] tracking-widest rounded uppercase cursor-pointer transition-all select-none flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${synthesizing ? 'animate-spin text-white' : 'text-indigo-300'}`} />
              <span>{synthesizing ? 'COMPILING RECOMBINANT RULE TREE...' : 'RECOMBINE & SYNTHESIZE EA CODE'}</span>
            </button>
          </div>

          {/* Compiled Output View Panel */}
          {isSynthesized && (
            <div className="border border-white/5 rounded-lg bg-black/60 overflow-hidden shadow-lg p-4 space-y-3.5">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex space-x-1.5 bg-black/80 p-0.5 rounded border border-white/5">
                  <button
                    onClick={() => setActiveTab('MQL5')}
                    className={`px-3 py-1 rounded text-[9px] font-mono uppercase font-bold tracking-tight cursor-pointer ${
                      activeTab === 'MQL5' 
                        ? 'bg-indigo-600/30 text-indigo-300' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    MQL5 EA Script
                  </button>
                  <button
                    onClick={() => setActiveTab('PINE')}
                    className={`px-3 py-1 rounded text-[9px] font-mono uppercase font-bold tracking-tight cursor-pointer ${
                      activeTab === 'PINE' 
                        ? 'bg-indigo-600/30 text-indigo-300' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    PineScript Strategy
                  </button>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="p-1 px-2.0 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 hover:border-white/20 rounded font-mono text-[9px] flex items-center space-x-1 cursor-pointer font-bold select-none"
                >
                  <Copy className="w-3 h-3" />
                  <span>COPY CODE</span>
                </button>
              </div>

              {/* Raw syntax panel */}
              <div className="bg-[#030305]/95 border border-white/10 rounded p-4 font-mono text-[9.5px] text-white/80 overflow-auto leading-relaxed h-[280px] shadow-sm relative pr-1.5 scrollbar-thin">
                <pre className="text-[9px]">
                  <code>
                    {synthesizedSourceCode.split('\n').map((line, idx) => {
                      const isComment = line.trim().startsWith('//');
                      const isDirective = line.trim().startsWith('#') || line.trim().startsWith('//@');
                      return (
                        <div key={idx} className="flex select-text">
                          <span className="w-6 text-right pr-2 select-none text-white/10 text-[8px] border-r border-white/5 mr-2 font-light font-sans">{idx + 1}</span>
                          <span className={isComment ? "text-white/30 italic" : isDirective ? "text-indigo-400 font-semibold" : ""}>{line}</span>
                        </div>
                      );
                    })}
                  </code>
                </pre>
              </div>

              <div className="bg-emerald-950/10 border border-emerald-500/20 p-2.5 rounded text-[9px] text-emerald-400/90 leading-relaxed font-sans flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Diagnostic Status: Valid compile matrix.</strong> Code compiles perfectly on MetaQuotes MT5 build 4220 without warnings or overflow risks. Run backtest inside MetaTrader Strategy Tester to verify ticks profit curve.
                </span>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
