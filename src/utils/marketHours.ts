/**
 * Market Hours & Trading Session Utility
 * Determines real-time session state for equities, forex, commodities, and crypto.
 */

/**
 * Checks if the market is open for a given ticker symbol.
 * Crypto trades 24/7/365.
 * Equities, ETFs, Index Futures, and Forex are closed on weekends (Saturday/Sunday)
 * and outside regular/extended market hours.
 */
export function isMarketOpenForSymbol(symbol: string): boolean {
  if (!symbol) return false;
  const upper = symbol.toUpperCase().trim();

  // Crypto assets trade 24/7/365
  const isCrypto =
    upper.includes('BTC') ||
    upper.includes('ETH') ||
    upper.includes('SOL') ||
    upper.includes('AVAX') ||
    upper.includes('DOGE') ||
    upper.includes('XRP') ||
    upper.includes('CRYPTO') ||
    (upper.endsWith('USD') && !['SPYUSD', 'QQQUSD', 'IWMUSD', 'DIAUSD'].includes(upper) && (upper.startsWith('BTC') || upper.startsWith('ETH') || upper.startsWith('SOL') || upper.startsWith('AVAX') || upper.startsWith('DOGE')));

  if (isCrypto) {
    return true;
  }

  // Determine current EST (Eastern Standard Time) date & time
  const now = new Date();
  const estDateStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const estDate = new Date(estDateStr);
  const dayOfWeek = estDate.getDay(); // 0 = Sunday, 6 = Saturday

  // Traditional Equity & Forex markets are closed on Weekends (Saturday & Sunday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Check EST market trading hours:
  // Pre-market starts at 4:00 AM EST, Regular 9:30 AM - 4:00 PM EST, After-hours ends at 8:00 PM EST (20:00)
  const hours = estDate.getHours();
  const minutes = estDate.getMinutes();
  const totalMins = hours * 60 + minutes;

  // 4:00 AM = 240 mins, 8:00 PM = 1200 mins
  if (totalMins < 240 || totalMins >= 1200) {
    return false;
  }

  return true;
}

/**
 * Returns human-readable market session info for display in headers and tickers.
 */
export function getMarketSessionInfo(symbol: string): { isOpen: boolean; statusLabel: string; isWeekend: boolean } {
  if (!symbol) return { isOpen: false, statusLabel: 'MARKET CLOSED', isWeekend: false };
  const upper = symbol.toUpperCase().trim();

  const isCrypto =
    upper.includes('BTC') ||
    upper.includes('ETH') ||
    upper.includes('SOL') ||
    upper.includes('AVAX') ||
    upper.includes('DOGE') ||
    upper.includes('XRP') ||
    upper.includes('CRYPTO') ||
    (upper.endsWith('USD') && !['SPYUSD', 'QQQUSD', 'IWMUSD', 'DIAUSD'].includes(upper) && (upper.startsWith('BTC') || upper.startsWith('ETH') || upper.startsWith('SOL') || upper.startsWith('AVAX') || upper.startsWith('DOGE')));

  if (isCrypto) {
    return { isOpen: true, statusLabel: '24/7 LIVE CRYPTO', isWeekend: false };
  }

  const now = new Date();
  const estDateStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const estDate = new Date(estDateStr);
  const dayOfWeek = estDate.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isOpen: false, statusLabel: 'WEEKEND - MARKET CLOSED', isWeekend: true };
  }

  const hours = estDate.getHours();
  const minutes = estDate.getMinutes();
  const totalMins = hours * 60 + minutes;

  if (totalMins < 240 || totalMins >= 1200) {
    return { isOpen: false, statusLabel: 'AFTER-HOURS CLOSED', isWeekend: false };
  }

  if (totalMins >= 240 && totalMins < 570) {
    return { isOpen: true, statusLabel: 'PRE-MARKET OPEN', isWeekend: false };
  }

  if (totalMins >= 570 && totalMins <= 960) {
    return { isOpen: true, statusLabel: 'REGULAR MARKET OPEN', isWeekend: false };
  }

  return { isOpen: true, statusLabel: 'AFTER-HOURS OPEN', isWeekend: false };
}
