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
  | 'US30' 
  | 'NAS100' 
  | 'GER40' 
  | 'SPX500'
  | 'AAPL'
  | 'MSFT'
  | 'NVDA'
  | 'TSLA';

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
  latency?: number; // Broker bridge latency in ms
  slippage?: number; // Broker trade slippage in pips/points
  trailingStopActive?: boolean;
  trailingStopDistance?: number;
  trailingTakeProfitActive?: boolean;
  trailingTakeProfitDistance?: number;
  maxPriceReached?: number;
  minPriceReached?: number;
  lavTslActive?: boolean;
  lavTslAtrMultiplier?: number;
  lavTslLiquidityActive?: boolean;
  lavTslTighteningActive?: boolean;
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
    case 'US30':
      list.push({ sym: 'SPX500', coef: 0.94, desc: 'Lockstep broad industrialized stock indexes' });
      list.push({ sym: 'NAS100', coef: 0.87, desc: 'Systemic US equity capital allocation' });
      list.push({ sym: 'GER40', coef: 0.78, desc: 'Highly correlated international exporter indexes' });
      break;
    case 'NAS100':
      list.push({ sym: 'SPX500', coef: 0.92, desc: 'US growth capital capitalization tracking' });
      list.push({ sym: 'US30', coef: 0.87, desc: 'Coordinate domestic industrial capital drift' });
      list.push({ sym: 'AAPL', coef: 0.88, desc: 'Heavy weighting inside tech growth index' });
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
    case 'AAPL':
      list.push({ sym: 'NAS100', coef: 0.88, desc: 'Heavy weighting inside tech growth index' });
      list.push({ sym: 'MSFT', coef: 0.75, desc: 'Big-tech sector capitalization co-exposure' });
      list.push({ sym: 'SPX500', coef: 0.82, desc: 'Broad-market corporate leader integration' });
      break;
    case 'MSFT':
      list.push({ sym: 'NAS100', coef: 0.89, desc: 'Heavy weighting inside tech growth index' });
      list.push({ sym: 'AAPL', coef: 0.75, desc: 'Big-tech sector capitalization co-exposure' });
      list.push({ sym: 'SPX500', coef: 0.84, desc: 'Broad-market corporate leader integration' });
      break;
    case 'NVDA':
      list.push({ sym: 'NAS100', coef: 0.91, desc: 'High-beta growth semiconductor momentum' });
      list.push({ sym: 'AAPL', coef: 0.65, desc: 'Tech hardware sector co-drift' });
      break;
    case 'TSLA':
      list.push({ sym: 'NAS100', coef: 0.72, desc: 'High-volatility growth vehicle benchmark' });
      list.push({ sym: 'SPX500', coef: 0.60, desc: 'Broad-market index inclusion volatility' });
      break;
    default:
      list.push({ sym: 'SPX500', coef: 0.30, desc: 'Market benchmark reference' });
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

