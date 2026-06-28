import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, boolean, jsonb } from 'drizzle-orm/pg-core';

// Define the 'users' table.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'trades' table.
export const trades = pgTable('trades', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id), // Nullable if guest, or linked to user
  symbol: text('symbol').notNull(),
  side: text('side').notNull(),
  entryPrice: doublePrecision('entry_price').notNull(),
  stopLoss: doublePrecision('stop_loss').notNull(),
  takeProfit: doublePrecision('take_profit').notNull(),
  size: doublePrecision('size').notNull(),
  status: text('status').notNull(), // 'OPEN' | 'CLOSED'
  pnl: doublePrecision('pnl').notNull(),
  exitPrice: doublePrecision('exit_price'),
  timestamp: text('timestamp').notNull(),
  exitTimestamp: text('exit_timestamp'),
  reason: text('reason').notNull(),
  confidence: integer('confidence'),
  confluences: jsonb('confluences'), // string[]
  annotation: text('annotation'),
  tags: jsonb('tags'), // string[]
  sentimentRating: text('sentiment_rating'),
  screenshot: text('screenshot'),
  pnlTrajectory: jsonb('pnl_trajectory'),
  marketNote: text('market_note'),
  autoBreakEvenProfitPct: doublePrecision('auto_break_even_profit_pct'),
  autoBreakEvenTriggered: boolean('auto_break_even_triggered'),
  latency: integer('latency'),
  slippage: doublePrecision('slippage'),
  trailingStopActive: boolean('trailing_stop_active'),
  trailingStopDistance: doublePrecision('trailing_stop_distance'),
  trailingTakeProfitActive: boolean('trailing_take_profit_active'),
  trailingTakeProfitDistance: doublePrecision('trailing_take_profit_distance'),
  maxPriceReached: doublePrecision('max_price_reached'),
  minPriceReached: doublePrecision('min_price_reached'),
  lavTslActive: boolean('lav_tsl_active'),
  lavTslAtrMultiplier: doublePrecision('lav_tsl_atr_multiplier'),
  lavTslLiquidityActive: boolean('lav_tsl_liquidity_active'),
  lavTslTighteningActive: boolean('lav_tsl_tightening_active'),
});

// Define relationships for the 'users' table.
export const usersRelations = relations(users, ({ many }) => ({
  trades: many(trades),
}));

// Define relationships for the 'trades' table.
export const tradesRelations = relations(trades, ({ one }) => ({
  user: one(users, {
    fields: [trades.userId],
    references: [users.id],
  }),
}));
