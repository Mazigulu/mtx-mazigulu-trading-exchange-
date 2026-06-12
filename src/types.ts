/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Candlestick {
  timestamp: string; // ISO or formatted
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema50?: number;
  sma200?: number;
  rsi?: number;
  atr?: number;
}

export interface FVG {
  id: string;
  index: number;
  type: 'BULLISH' | 'BEARISH';
  gapStart: number;
  gapEnd: number;
  isMitigated: boolean;
  timestamp: string;
}

export interface OrderBlock {
  id: string;
  index: number;
  type: 'BULLISH' | 'BEARISH';
  high: number;
  low: number;
  isBroken: boolean;
  timestamp: string;
}

export interface LiquiditySweep {
  id: string;
  index: number;
  type: 'BUY_SIDE' | 'SELL_SIDE';
  level: number;
  timestamp: string;
}

export type MarketSymbol = 
  | 'EUR/USD' 
  | 'GBP/USD' 
  | 'USD/JPY' 
  | 'AUD/USD' 
  | 'EUR/GBP' 
  | 'GOLD/USD' 
  | 'SILVER/USD' 
  | 'BTC/USDT' 
  | 'ETH/USDT' 
  | 'SOL/USDT' 
  | 'US30' 
  | 'NAS100' 
  | 'GER40' 
  | 'SPX500';

export interface Trade {
  id: string;
  symbol: MarketSymbol;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  size: number; // calculated position size (units)
  status: 'OPEN' | 'CLOSED';
  pnl: number;
  exitPrice?: number;
  timestamp: string;
  exitTimestamp?: string;
  reason: string;
  confidence?: number; // 0-100%
  confluences?: string[]; // array of confluences checked
  annotation?: string;
  tags?: string[];
  sentimentRating?: string; // journal sentiment, e.g. '1'-'5', 'HAPPY', 'ANXIOUS', etc.
  screenshot?: string; // base64 encoded data-URL or image URL
  pnlTrajectory?: { minute: number; pnl: number }[];
}

export interface NewsEvent {
  id: string;
  currency: string;
  title: string;
  time: string; // Formatting
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  forecast: string;
  previous: string;
  actual?: string;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  imbalance: number; // -100 to +100
}

export interface MarketMetrics {
  atr: number;
  rsi: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  dailyBias: 'BULLISH' | 'BEARISH';
  supportLevels: number[];
  resistanceLevels: number[];
  currentPrice: number;
}

export interface BreachEvent {
  id: string;
  timestamp: string;
  symbol: MarketSymbol;
  exposure: number;
  pnlAtBreach: number;
  reason: string;
}

