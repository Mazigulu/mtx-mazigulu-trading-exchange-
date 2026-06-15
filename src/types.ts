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
  marketNote?: string;
  autoBreakEvenProfitPct?: number;
  autoBreakEvenTriggered?: boolean;
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

export interface PriceAlert {
  id: string;
  symbol: MarketSymbol;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  isTriggered: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface CorrelationData {
  symbol: MarketSymbol;
  coefficient: number; // -1 to 1
  strength: 'STRONG_POSITIVE' | 'POSITIVE' | 'WEAK' | 'NEGATIVE' | 'STRONG_NEGATIVE';
  description: string;
}

export function getSymbolCorrelations(symbol: MarketSymbol): CorrelationData[] {
  const list: { sym: MarketSymbol; coef: number; desc: string }[] = [];

  switch (symbol) {
    case 'EUR/USD':
      list.push({ sym: 'GBP/USD', coef: 0.88, desc: 'Highly synchronized European USD proxy' });
      list.push({ sym: 'USD/JPY', coef: -0.82, desc: 'Strong dollar safe-haven safeflow' });
      list.push({ sym: 'GOLD/USD', coef: 0.45, desc: 'Commodity inflation hedge connection' });
      list.push({ sym: 'EUR/GBP', coef: 0.21, desc: 'Regional cross exchange valuation' });
      list.push({ sym: 'BTC/USDT', coef: 0.35, desc: 'Macro risk-on liquid drift' });
      break;
    case 'GBP/USD':
      list.push({ sym: 'EUR/USD', coef: 0.88, desc: 'High positive coordinate synchronization' });
      list.push({ sym: 'USD/JPY', coef: -0.72, desc: 'Inverse safe-haven demand disparity' });
      list.push({ sym: 'EUR/GBP', coef: -0.35, desc: 'Regional cross relative value shift' });
      list.push({ sym: 'GOLD/USD', coef: 0.38, desc: 'Dollar-denominated commodity alignment' });
      break;
    case 'USD/JPY':
      list.push({ sym: 'EUR/USD', coef: -0.82, desc: 'Inverse safe-haven exchange tracking' });
      list.push({ sym: 'GBP/USD', coef: -0.72, desc: 'Stereotyped sterling safe-haven flight' });
      list.push({ sym: 'GOLD/USD', coef: -0.35, desc: 'Interest rate yield differential drag' });
      list.push({ sym: 'US30', coef: 0.65, desc: 'Blue-chip export competitiveness inflow' });
      break;
    case 'BTC/USDT':
      list.push({ sym: 'ETH/USDT', coef: 0.92, desc: 'Direct locked leader-to-beta correlation' });
      list.push({ sym: 'SOL/USDT', coef: 0.85, desc: 'Macro high-beta asset cycle synchronization' });
      list.push({ sym: 'NAS100', coef: 0.58, desc: 'Global speculative capital pool drift' });
      list.push({ sym: 'GOLD/USD', coef: 0.25, desc: 'Digital hedge store-of-value narrative' });
      break;
    case 'ETH/USDT':
      list.push({ sym: 'BTC/USDT', coef: 0.92, desc: 'Locked index leader beta alignment' });
      list.push({ sym: 'SOL/USDT', coef: 0.82, desc: 'Layer-1 smart contract correlation' });
      list.push({ sym: 'NAS100', coef: 0.52, desc: 'High-tech risk capital correlation' });
      break;
    case 'SOL/USDT':
      list.push({ sym: 'BTC/USDT', coef: 0.85, desc: 'Speculative network beta alignment' });
      list.push({ sym: 'ETH/USDT', coef: 0.82, desc: 'DeFi & developer resource tracking' });
      break;
    case 'GOLD/USD':
      list.push({ sym: 'SILVER/USD', coef: 0.81, desc: 'Locked coordinate physical precious metals' });
      list.push({ sym: 'EUR/USD', coef: 0.45, desc: 'Anti-dollar inflation hedge alignment' });
      list.push({ sym: 'USD/JPY', coef: -0.35, desc: 'Dollar yield competition allocation' });
      list.push({ sym: 'BTC/USDT', coef: 0.25, desc: 'Digital gold capital flow relationship' });
      break;
    case 'SILVER/USD':
      list.push({ sym: 'GOLD/USD', coef: 0.81, desc: 'Coordinate physical demand lockstep' });
      list.push({ sym: 'EUR/USD', coef: 0.38, desc: 'Broad inflation hedge commodity flows' });
      break;
    case 'US30':
      list.push({ sym: 'SPX500', coef: 0.94, desc: 'Lockstep broad industrialized stock indexes' });
      list.push({ sym: 'NAS100', coef: 0.87, desc: 'Systemic US equity capital allocation' });
      list.push({ sym: 'GER40', coef: 0.78, desc: 'Highly correlated international exporter indexes' });
      break;
    case 'NAS100':
      list.push({ sym: 'SPX500', coef: 0.92, desc: 'US growth capital capitalization tracking' });
      list.push({ sym: 'US30', coef: 0.87, desc: 'Coordinate domestic industrial capital drift' });
      list.push({ sym: 'BTC/USDT', coef: 0.58, desc: 'Macro tech speculative alignment' });
      break;
    case 'SPX500':
      list.push({ sym: 'US30', coef: 0.94, desc: 'Coordinate domestic corporate index' });
      list.push({ sym: 'NAS100', coef: 0.92, desc: 'Locked largest-cap weighted tech growth' });
      list.push({ sym: 'GER40', coef: 0.82, desc: 'Global industrial economic integration' });
      break;
    case 'GER40':
      list.push({ sym: 'SPX500', coef: 0.82, desc: 'Coordinate global investment covariance' });
      list.push({ sym: 'US30', coef: 0.78, desc: 'Exporter-driven machinery alignment' });
      break;
    default:
      list.push({ sym: 'EUR/USD', coef: 0.30, desc: 'Market benchmark reference' });
  }

  return list.map((item) => {
    let strength: CorrelationData['strength'] = 'WEAK';
    if (item.coef >= 0.7) strength = 'STRONG_POSITIVE';
    else if (item.coef >= 0.3) strength = 'POSITIVE';
    else if (item.coef <= -0.7) strength = 'STRONG_NEGATIVE';
    else if (item.coef <= -0.3) strength = 'NEGATIVE';

    return {
      symbol: item.sym,
      coefficient: item.coef,
      strength,
      description: item.desc,
    };
  });
}

