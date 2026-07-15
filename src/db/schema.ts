import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, boolean, jsonb, index } from 'drizzle-orm/pg-core';

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
}, (table) => [
  index('trades_user_id_idx').on(table.userId),
  index('trades_status_idx').on(table.status),
  index('trades_symbol_idx').on(table.symbol),
  index('trades_user_status_idx').on(table.userId, table.status)
]);

// Define relationships for the 'users' table.
export const usersRelations = relations(users, ({ many }) => ({
  trades: many(trades),
  walletBalances: many(walletBalances),
  walletTransactions: many(walletTransactions),
}));

// Define relationships for the 'trades' table.
export const tradesRelations = relations(trades, ({ one }) => ({
  user: one(users, {
    fields: [trades.userId],
    references: [users.id],
  }),
}));

// Define the 'wallet_balances' table.
export const walletBalances = pgTable('wallet_balances', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  currency: text('currency').notNull(),
  balance: doublePrecision('balance').notNull().default(0.0),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('wallet_balances_user_id_idx').on(table.userId),
  index('wallet_balances_currency_idx').on(table.currency),
  index('wallet_balances_user_currency_idx').on(table.userId, table.currency)
]);

// Define the 'wallet_transactions' table.
export const walletTransactions = pgTable('wallet_transactions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(), // 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE_PNL' | 'FEE'
  method: text('method').notNull(),
  currency: text('currency').notNull(),
  amount: doublePrecision('amount').notNull(),
  fee: doublePrecision('fee').notNull().default(0.0),
  status: text('status').notNull(), // 'Pending' | 'Settled' | 'Failed' | 'Processing' | 'Cancelled'
  providerStatus: text('provider_status'),
  date: text('date').notNull(),
  walletAddress: text('wallet_address'),
  txHash: text('tx_hash'),
  gasUsed: integer('gas_used'),
  gasPriceGwei: integer('gas_price_gwei'),
  referenceId: text('reference_id'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('wallet_transactions_user_id_idx').on(table.userId),
  index('wallet_transactions_status_idx').on(table.status),
  index('wallet_transactions_reference_idx').on(table.referenceId),
]);

export const walletBalancesRelations = relations(walletBalances, ({ one }) => ({
  user: one(users, {
    fields: [walletBalances.userId],
    references: [users.id],
  }),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  user: one(users, {
    fields: [walletTransactions.userId],
    references: [users.id],
  }),
}));

