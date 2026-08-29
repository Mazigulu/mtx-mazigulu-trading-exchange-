/**
 * Market Hours & Trading Session Utility
 * Determines real-time session state for equities, forex, commodities, and crypto.
 */

interface NYTimeInfo {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  hours: number;     // 0-23
  minutes: number;   // 0-59
  totalMins: number; // 0-1439
}

/**
 * Accurately extracts New York time components using Intl.DateTimeFormat
 * avoiding string-parsing timezone conversion bugs in JS runtimes.
 */
function getNYTimeInfo(date = new Date()): NYTimeInfo {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  let weekdayStr = 'Sun';
  let hours = 0;
  let minutes = 0;

  for (const part of parts) {
    if (part.type === 'weekday') weekdayStr = part.value;
    if (part.type === 'hour') {
      hours = parseInt(part.value, 10);
      if (hours === 24) hours = 0;
    }
    if (part.type === 'minute') minutes = parseInt(part.value, 10);
  }

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const dayOfWeek = dayMap[weekdayStr] ?? 0;
  const totalMins = hours * 60 + minutes;

  return { dayOfWeek, hours, minutes, totalMins };
}

/**
 * Helper to identify asset class from ticker symbol
 */
function getAssetCategory(symbol: string): 'CRYPTO' | 'FOREX' | 'FUTURES' | 'EQUITY' {
  if (!symbol) return 'EQUITY';
  const upper = symbol.toUpperCase().trim();

  // Crypto assets (24/7/365)
  if (
    upper.includes('BTC') ||
    upper.includes('ETH') ||
    upper.includes('SOL') ||
    upper.includes('AVAX') ||
    upper.includes('DOGE') ||
    upper.includes('XRP') ||
    upper.includes('CRYPTO') ||
    (upper.endsWith('USD') &&
      !['SPYUSD', 'QQQUSD', 'IWMUSD', 'DIAUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'XAUUSD', 'XAGUSD'].includes(upper) &&
      (upper.startsWith('BTC') || upper.startsWith('ETH') || upper.startsWith('SOL') || upper.startsWith('AVAX') || upper.startsWith('DOGE')))
  ) {
    return 'CRYPTO';
  }

  // Forex pairs
  if (
    ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'].includes(upper) ||
    (upper.length === 6 && upper.endsWith('USD') && !['SPYUSD', 'QQQUSD'].includes(upper))
  ) {
    return 'FOREX';
  }

  // Futures & Commodities
  if (
    ['ES', 'NQ', 'SPX', 'NAS100', 'US30', 'GER30', 'XAUUSD', 'GOLD', 'OIL', 'WTI', 'BRENT', 'CL', 'GC', 'SI'].some(
      (f) => upper.startsWith(f) || upper === f
    )
  ) {
    return 'FUTURES';
  }

  return 'EQUITY';
}

/**
 * Checks if the market is open for a given ticker symbol.
 */
export function isMarketOpenForSymbol(symbol: string): boolean {
  if (!symbol) return false;
  const category = getAssetCategory(symbol);

  // 1. Crypto is open 24/7/365
  if (category === 'CRYPTO') {
    return true;
  }

  const { dayOfWeek, totalMins } = getNYTimeInfo();

  // 2. Forex Session:
  // Opens Sunday 5:00 PM EST (17:00 = 1020 mins)
  // Closes Friday 5:00 PM EST (17:00 = 1020 mins)
  if (category === 'FOREX') {
    if (dayOfWeek === 6) return false; // Saturday closed
    if (dayOfWeek === 0 && totalMins < 1020) return false; // Sunday before 5 PM EST closed
    if (dayOfWeek === 5 && totalMins >= 1020) return false; // Friday after 5 PM EST closed
    return true;
  }

  // 3. Futures & Commodities Session:
  // Opens Sunday 6:00 PM EST (18:00 = 1080 mins)
  // Closes Friday 5:00 PM EST (17:00 = 1020 mins)
  // Daily break: Mon-Thu 5:00 PM - 6:00 PM EST (17:00 - 18:00)
  if (category === 'FUTURES') {
    if (dayOfWeek === 6) return false; // Saturday closed
    if (dayOfWeek === 0 && totalMins < 1080) return false; // Sunday before 6 PM EST closed
    if (dayOfWeek === 5 && totalMins >= 1020) return false; // Friday after 5 PM EST closed
    // Daily 5-6 PM EST maintenance break on Mon-Thu
    if (dayOfWeek >= 1 && dayOfWeek <= 4 && totalMins >= 1020 && totalMins < 1080) {
      return false;
    }
    return true;
  }

  // 4. Equities / ETFs (24/5 Prime Brokerage & Regular/Extended Trading Sessions):
  // Sunday 8:00 PM EST to Friday 8:00 PM EST continuously active (Extended + Overnight)
  // Weekend closure: Friday 8:00 PM EST to Sunday 8:00 PM EST
  if (dayOfWeek === 6) return false; // Saturday closed
  if (dayOfWeek === 0 && totalMins < 1200) return false; // Sunday before 8 PM EST closed
  if (dayOfWeek === 5 && totalMins >= 1200) return false; // Friday after 8 PM EST closed

  return true;
}

/**
 * Returns human-readable market session info for display in headers and tickers.
 */
export function getMarketSessionInfo(symbol: string): { isOpen: boolean; statusLabel: string; isWeekend: boolean } {
  if (!symbol) return { isOpen: false, statusLabel: 'MARKET CLOSED', isWeekend: false };
  const category = getAssetCategory(symbol);

  if (category === 'CRYPTO') {
    return { isOpen: true, statusLabel: '24/7 LIVE CRYPTO', isWeekend: false };
  }

  const { dayOfWeek, totalMins } = getNYTimeInfo();

  if (category === 'FOREX') {
    if (dayOfWeek === 6 || (dayOfWeek === 0 && totalMins < 1020) || (dayOfWeek === 5 && totalMins >= 1020)) {
      return { isOpen: false, statusLabel: 'WEEKEND - FOREX CLOSED', isWeekend: true };
    }
    return { isOpen: true, statusLabel: 'FOREX MARKET OPEN', isWeekend: false };
  }

  if (category === 'FUTURES') {
    if (dayOfWeek === 6 || (dayOfWeek === 0 && totalMins < 1080) || (dayOfWeek === 5 && totalMins >= 1020)) {
      return { isOpen: false, statusLabel: 'WEEKEND - FUTURES CLOSED', isWeekend: true };
    }
    if (dayOfWeek >= 1 && dayOfWeek <= 4 && totalMins >= 1020 && totalMins < 1080) {
      return { isOpen: false, statusLabel: 'DAILY MAINTENANCE BREAK', isWeekend: false };
    }
    return { isOpen: true, statusLabel: 'FUTURES MARKET OPEN', isWeekend: false };
  }

  // Equities & ETFs
  if (dayOfWeek === 6 || (dayOfWeek === 0 && totalMins < 1200) || (dayOfWeek === 5 && totalMins >= 1200)) {
    return { isOpen: false, statusLabel: 'WEEKEND - EQUITY CLOSED', isWeekend: true };
  }

  // Determine specific session label for open equity market:
  // 4:00 AM = 240, 9:30 AM = 570, 4:00 PM = 960, 8:00 PM = 1200
  if (totalMins >= 570 && totalMins < 960 && dayOfWeek >= 1 && dayOfWeek <= 5) {
    return { isOpen: true, statusLabel: 'REGULAR MARKET OPEN', isWeekend: false };
  }
  if (totalMins >= 240 && totalMins < 570 && dayOfWeek >= 1 && dayOfWeek <= 5) {
    return { isOpen: true, statusLabel: 'PRE-MARKET OPEN', isWeekend: false };
  }
  if (totalMins >= 960 && totalMins < 1200 && dayOfWeek >= 1 && dayOfWeek <= 5) {
    return { isOpen: true, statusLabel: 'AFTER-HOURS OPEN', isWeekend: false };
  }

  // 24/5 Overnight Session (Sun 8 PM - Mon 4 AM, Mon-Thu 8 PM - 4 AM)
  return { isOpen: true, statusLabel: 'OVERNIGHT 24/5 SESSION', isWeekend: false };
}
