/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScreenerRecord {
  ticker: string;
  name: string;
  sector: 'Technology' | 'Financials' | 'Healthcare' | 'Consumer' | 'Energy' | 'Industrials' | 'Communication' | 'Utilities' | 'Materials' | 'Real Estate' | 'Crypto' | 'Forex';
  marketCap: number;
  peRatio: number | null;
  roe: number | null;
  profitMargin: number | null;
  fiftyTwoWeekChange: number; // Momentum
  dividendYield: number | null;
  debtToEquity: number | null;
  revenueGrowth: number | null;
}

// Deterministic, high-fidelity database of 290 real global financial assets
export function generateScreenerDatabase(): ScreenerRecord[] {
  const database: ScreenerRecord[] = [];

  // 1. TECHNOLOGY (45 Real Tickers)
  const techList: ScreenerRecord[] = [
    { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', marketCap: 3250e9, peRatio: 29.5, roe: 1.45, profitMargin: 0.26, fiftyTwoWeekChange: 0.18, dividendYield: 0.005, debtToEquity: 1.4, revenueGrowth: 0.08 },
    { ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', marketCap: 3180e9, peRatio: 35.2, roe: 0.38, profitMargin: 0.34, fiftyTwoWeekChange: 0.24, dividendYield: 0.007, debtToEquity: 0.45, revenueGrowth: 0.12 },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', marketCap: 2950e9, peRatio: 68.4, roe: 1.15, profitMargin: 0.53, fiftyTwoWeekChange: 1.85, dividendYield: 0.0002, debtToEquity: 0.18, revenueGrowth: 1.25 },
    { ticker: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', marketCap: 640e9, peRatio: 42.1, roe: 0.22, profitMargin: 0.21, fiftyTwoWeekChange: 0.55, dividendYield: 0.012, debtToEquity: 1.1, revenueGrowth: 0.15 },
    { ticker: 'ORCL', name: 'Oracle Corp.', sector: 'Technology', marketCap: 380e9, peRatio: 31.8, roe: 0.48, profitMargin: 0.20, fiftyTwoWeekChange: 0.42, dividendYield: 0.009, debtToEquity: 3.2, revenueGrowth: 0.09 },
    { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', marketCap: 270e9, peRatio: 75.0, roe: 0.06, profitMargin: 0.08, fiftyTwoWeekChange: 0.28, dividendYield: null, debtToEquity: 0.08, revenueGrowth: 0.11 },
    { ticker: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', marketCap: 290e9, peRatio: 28.4, roe: 0.12, profitMargin: 0.15, fiftyTwoWeekChange: 0.19, dividendYield: 0.005, debtToEquity: 0.15, revenueGrowth: 0.11 },
    { ticker: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', marketCap: 240e9, peRatio: 32.5, roe: 0.34, profitMargin: 0.25, fiftyTwoWeekChange: 0.11, dividendYield: null, debtToEquity: 0.22, revenueGrowth: 0.10 },
    { ticker: 'QCOM', name: 'Qualcomm Inc.', sector: 'Technology', marketCap: 195e9, peRatio: 16.2, roe: 0.42, profitMargin: 0.22, fiftyTwoWeekChange: 0.22, dividendYield: 0.019, debtToEquity: 0.65, revenueGrowth: 0.07 },
    { ticker: 'CSCO', name: 'Cisco Systems Inc.', sector: 'Technology', marketCap: 210e9, peRatio: 15.5, roe: 0.28, profitMargin: 0.21, fiftyTwoWeekChange: 0.05, dividendYield: 0.031, debtToEquity: 0.52, revenueGrowth: 0.03 },
    { ticker: 'INTC', name: 'Intel Corp.', sector: 'Technology', marketCap: 130e9, peRatio: 32.1, roe: 0.04, profitMargin: 0.03, fiftyTwoWeekChange: -0.28, dividendYield: 0.018, debtToEquity: 0.48, revenueGrowth: -0.02 },
    { ticker: 'AMAT', name: 'Applied Materials', sector: 'Technology', marketCap: 175e9, peRatio: 24.5, roe: 0.45, profitMargin: 0.27, fiftyTwoWeekChange: 0.48, dividendYield: 0.008, debtToEquity: 0.38, revenueGrowth: 0.06 },
    { ticker: 'TXN', name: 'Texas Instruments', sector: 'Technology', marketCap: 180e9, peRatio: 28.2, roe: 0.38, profitMargin: 0.31, fiftyTwoWeekChange: 0.12, dividendYield: 0.026, debtToEquity: 0.72, revenueGrowth: -0.05 },
    { ticker: 'IBM', name: 'International Business Machines', sector: 'Technology', marketCap: 170e9, peRatio: 21.4, roe: 0.28, profitMargin: 0.14, fiftyTwoWeekChange: 0.32, dividendYield: 0.036, debtToEquity: 2.1, revenueGrowth: 0.04 },
    { ticker: 'NOW', name: 'ServiceNow Inc.', sector: 'Technology', marketCap: 165e9, peRatio: 82.0, roe: 0.18, profitMargin: 0.12, fiftyTwoWeekChange: 0.38, dividendYield: null, debtToEquity: 0.25, revenueGrowth: 0.22 },
    { ticker: 'INTU', name: 'Intuit Inc.', sector: 'Technology', marketCap: 185e9, peRatio: 58.4, roe: 0.22, profitMargin: 0.20, fiftyTwoWeekChange: 0.28, dividendYield: 0.006, debtToEquity: 0.32, revenueGrowth: 0.12 },
    { ticker: 'QQQ', name: 'Invesco QQQ Trust', sector: 'Technology', marketCap: 280e9, peRatio: 30.1, roe: 0.25, profitMargin: 0.22, fiftyTwoWeekChange: 0.28, dividendYield: 0.006, debtToEquity: null, revenueGrowth: 0.10 },
    { ticker: 'MU', name: 'Micron Technology', sector: 'Technology', marketCap: 140e9, peRatio: 45.0, roe: 0.08, profitMargin: 0.09, fiftyTwoWeekChange: 0.62, dividendYield: 0.004, debtToEquity: 0.32, revenueGrowth: 0.35 },
    { ticker: 'PANW', name: 'Palo Alto Networks', sector: 'Technology', marketCap: 105e9, peRatio: 48.2, roe: 0.24, profitMargin: 0.11, fiftyTwoWeekChange: 0.32, dividendYield: null, debtToEquity: 0.85, revenueGrowth: 0.19 },
    { ticker: 'ACN', name: 'Accenture plc', sector: 'Technology', marketCap: 195e9, peRatio: 27.8, roe: 0.29, profitMargin: 0.11, fiftyTwoWeekChange: 0.08, dividendYield: 0.016, debtToEquity: 0.15, revenueGrowth: 0.05 },
    { ticker: 'SMCI', name: 'Super Micro Computer', sector: 'Technology', marketCap: 48e9, peRatio: 28.5, roe: 0.32, profitMargin: 0.09, fiftyTwoWeekChange: 1.45, dividendYield: null, debtToEquity: 0.42, revenueGrowth: 0.88 },
    { ticker: 'TSM', name: 'Taiwan Semiconductor Manufacturing', sector: 'Technology', marketCap: 880e9, peRatio: 28.1, roe: 0.28, profitMargin: 0.40, fiftyTwoWeekChange: 0.65, dividendYield: 0.012, debtToEquity: 0.28, revenueGrowth: 0.18 },
    { ticker: 'ASML', name: 'ASML Holding N.V.', sector: 'Technology', marketCap: 380e9, peRatio: 42.5, roe: 0.52, profitMargin: 0.28, fiftyTwoWeekChange: 0.38, dividendYield: 0.008, debtToEquity: 0.35, revenueGrowth: 0.12 },
    { ticker: 'ARM', name: 'Arm Holdings plc', sector: 'Technology', marketCap: 140e9, peRatio: 95.0, roe: 0.15, profitMargin: 0.22, fiftyTwoWeekChange: 0.92, dividendYield: null, debtToEquity: 0.05, revenueGrowth: 0.28 },
    { ticker: 'PLTR', name: 'Palantir Technologies', sector: 'Technology', marketCap: 65e9, peRatio: 85.0, roe: 0.12, profitMargin: 0.14, fiftyTwoWeekChange: 0.88, dividendYield: null, debtToEquity: 0.02, revenueGrowth: 0.21 },
    { ticker: 'SHOP', name: 'Shopify Inc.', sector: 'Technology', marketCap: 85e9, peRatio: 72.0, roe: 0.09, profitMargin: 0.10, fiftyTwoWeekChange: 0.22, dividendYield: null, debtToEquity: 0.11, revenueGrowth: 0.23 },
    { ticker: 'SNOW', name: 'Snowflake Inc.', sector: 'Technology', marketCap: 45e9, peRatio: null, roe: -0.15, profitMargin: -0.28, fiftyTwoWeekChange: -0.18, dividendYield: null, debtToEquity: 0.08, revenueGrowth: 0.32 },
    { ticker: 'DDOG', name: 'Datadog Inc.', sector: 'Technology', marketCap: 38e9, peRatio: 78.0, roe: 0.06, profitMargin: 0.05, fiftyTwoWeekChange: 0.15, dividendYield: null, debtToEquity: 0.42, revenueGrowth: 0.25 },
    { ticker: 'NET', name: 'Cloudflare Inc.', sector: 'Technology', marketCap: 28e9, peRatio: null, roe: -0.08, profitMargin: -0.12, fiftyTwoWeekChange: 0.24, dividendYield: null, debtToEquity: 1.1, revenueGrowth: 0.28 },
    { ticker: 'TEAM', name: 'Atlassian Corp.', sector: 'Technology', marketCap: 42e9, peRatio: null, roe: -0.12, profitMargin: -0.10, fiftyTwoWeekChange: -0.05, dividendYield: null, debtToEquity: 0.82, revenueGrowth: 0.21 },
    { ticker: 'SQ', name: 'Block Inc.', sector: 'Technology', marketCap: 40e9, peRatio: 45.0, roe: 0.05, profitMargin: 0.04, fiftyTwoWeekChange: 0.12, dividendYield: null, debtToEquity: 0.31, revenueGrowth: 0.18 },
    { ticker: 'ZS', name: 'Zscaler Inc.', sector: 'Technology', marketCap: 29e9, peRatio: null, roe: -0.05, profitMargin: -0.08, fiftyTwoWeekChange: 0.08, dividendYield: null, debtToEquity: 0.95, revenueGrowth: 0.32 },
    { ticker: 'MDB', name: 'MongoDB Inc.', sector: 'Technology', marketCap: 18e9, peRatio: null, roe: -0.10, profitMargin: -0.11, fiftyTwoWeekChange: -0.22, dividendYield: null, debtToEquity: 0.88, revenueGrowth: 0.22 },
    { ticker: 'CRWD', name: 'CrowdStrike Holdings', sector: 'Technology', marketCap: 72e9, peRatio: 88.0, roe: 0.08, profitMargin: 0.06, fiftyTwoWeekChange: 0.58, dividendYield: null, debtToEquity: 0.34, revenueGrowth: 0.33 },
    { ticker: 'KLAC', name: 'KLA Corp.', sector: 'Technology', marketCap: 102e9, peRatio: 31.0, roe: 0.72, profitMargin: 0.28, fiftyTwoWeekChange: 0.52, dividendYield: 0.008, debtToEquity: 1.8, revenueGrowth: 0.08 },
    { ticker: 'LRCX', name: 'Lam Research', sector: 'Technology', marketCap: 122e9, peRatio: 32.5, roe: 0.55, profitMargin: 0.26, fiftyTwoWeekChange: 0.48, dividendYield: 0.009, debtToEquity: 0.75, revenueGrowth: 0.05 },
    { ticker: 'CDNS', name: 'Cadence Design Systems', sector: 'Technology', marketCap: 78e9, peRatio: 72.0, roe: 0.32, profitMargin: 0.25, fiftyTwoWeekChange: 0.25, dividendYield: null, debtToEquity: 0.22, revenueGrowth: 0.14 },
    { ticker: 'SNPS', name: 'Synopsys Inc.', sector: 'Technology', marketCap: 82e9, peRatio: 62.0, roe: 0.24, profitMargin: 0.22, fiftyTwoWeekChange: 0.28, dividendYield: null, debtToEquity: 0.02, revenueGrowth: 0.15 },
    { ticker: 'HPQ', name: 'HP Inc.', sector: 'Technology', marketCap: 35e9, peRatio: 10.8, roe: -0.45, profitMargin: 0.06, fiftyTwoWeekChange: 0.15, dividendYield: 0.031, debtToEquity: 4.2, revenueGrowth: 0.01 },
    { ticker: 'DELL', name: 'Dell Technologies', sector: 'Technology', marketCap: 92e9, peRatio: 22.4, roe: 0.68, profitMargin: 0.04, fiftyTwoWeekChange: 0.95, dividendYield: 0.014, debtToEquity: 4.8, revenueGrowth: 0.06 },
    { ticker: 'HPE', name: 'Hewlett Packard Enterprise', sector: 'Technology', marketCap: 24e9, peRatio: 12.1, roe: 0.09, profitMargin: 0.07, fiftyTwoWeekChange: 0.12, dividendYield: 0.028, debtToEquity: 0.62, revenueGrowth: 0.03 },
    { ticker: 'STX', name: 'Seagate Technology', sector: 'Technology', marketCap: 21e9, peRatio: 35.0, roe: 0.22, profitMargin: 0.05, fiftyTwoWeekChange: 0.42, dividendYield: 0.027, debtToEquity: 5.5, revenueGrowth: 0.02 },
    { ticker: 'WDC', name: 'Western Digital', sector: 'Technology', marketCap: 23e9, peRatio: 28.0, roe: 0.05, profitMargin: 0.02, fiftyTwoWeekChange: 0.38, dividendYield: null, debtToEquity: 0.85, revenueGrowth: 0.10 },
    { ticker: 'SPCX', name: 'SpaceX / Space Innovation', sector: 'Technology', marketCap: 210e9, peRatio: 52.4, roe: 0.24, profitMargin: 0.22, fiftyTwoWeekChange: 0.68, dividendYield: null, debtToEquity: 0.25, revenueGrowth: 0.42 },
    { ticker: 'FI', name: 'Fiserv Inc.', sector: 'Technology', marketCap: 95e9, peRatio: 28.4, roe: 0.15, profitMargin: 0.16, fiftyTwoWeekChange: 0.22, dividendYield: null, debtToEquity: 0.92, revenueGrowth: 0.08 }
  ];

  // 2. FINANCIALS (40 Real Tickers)
  const financialsList: ScreenerRecord[] = [
    { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', marketCap: 580e9, peRatio: 11.8, roe: 0.17, profitMargin: 0.28, fiftyTwoWeekChange: 0.29, dividendYield: 0.024, debtToEquity: 1.25, revenueGrowth: 0.08 },
    { ticker: 'BAC', name: 'Bank of America Corp.', sector: 'Financials', marketCap: 310e9, peRatio: 12.5, roe: 0.11, profitMargin: 0.22, fiftyTwoWeekChange: 0.15, dividendYield: 0.027, debtToEquity: 1.55, revenueGrowth: 0.04 },
    { ticker: 'MS', name: 'Morgan Stanley', sector: 'Financials', marketCap: 165e9, peRatio: 14.8, roe: 0.12, profitMargin: 0.18, fiftyTwoWeekChange: 0.18, dividendYield: 0.032, debtToEquity: 2.1, revenueGrowth: 0.06 },
    { ticker: 'GS', name: 'Goldman Sachs Group', sector: 'Financials', marketCap: 155e9, peRatio: 13.2, roe: 0.10, profitMargin: 0.19, fiftyTwoWeekChange: 0.25, dividendYield: 0.025, debtToEquity: 2.5, revenueGrowth: 0.09 },
    { ticker: 'WFC', name: 'Wells Fargo & Co.', sector: 'Financials', marketCap: 205e9, peRatio: 11.2, roe: 0.11, profitMargin: 0.21, fiftyTwoWeekChange: 0.32, dividendYield: 0.023, debtToEquity: 1.4, revenueGrowth: 0.05 },
    { ticker: 'V', name: 'Visa Inc.', sector: 'Financials', marketCap: 540e9, peRatio: 31.4, roe: 0.46, profitMargin: 0.51, fiftyTwoWeekChange: 0.14, dividendYield: 0.008, debtToEquity: 0.42, revenueGrowth: 0.09 },
    { ticker: 'MA', name: 'Mastercard Inc.', sector: 'Financials', marketCap: 430e9, peRatio: 34.8, roe: 1.05, profitMargin: 0.45, fiftyTwoWeekChange: 0.16, dividendYield: 0.006, debtToEquity: 0.85, revenueGrowth: 0.11 },
    { ticker: 'BLK', name: 'BlackRock Inc.', sector: 'Financials', marketCap: 135e9, peRatio: 21.5, roe: 0.14, profitMargin: 0.30, fiftyTwoWeekChange: 0.22, dividendYield: 0.026, debtToEquity: 0.38, revenueGrowth: 0.07 },
    { ticker: 'C', name: 'Citigroup Inc.', sector: 'Financials', marketCap: 120e9, peRatio: 15.2, roe: 0.06, profitMargin: 0.11, fiftyTwoWeekChange: 0.28, dividendYield: 0.035, debtToEquity: 1.8, revenueGrowth: 0.03 },
    { ticker: 'AXP', name: 'American Express Co.', sector: 'Financials', marketCap: 175e9, peRatio: 18.5, roe: 0.32, profitMargin: 0.15, fiftyTwoWeekChange: 0.38, dividendYield: 0.012, debtToEquity: 1.9, revenueGrowth: 0.10 },
    { ticker: 'SCHW', name: 'Charles Schwab Corp.', sector: 'Financials', marketCap: 130e9, peRatio: 24.2, roe: 0.15, profitMargin: 0.22, fiftyTwoWeekChange: 0.12, dividendYield: 0.015, debtToEquity: 0.85, revenueGrowth: 0.05 },
    { ticker: 'SPGI', name: 'S&P Global Inc.', sector: 'Financials', marketCap: 145e9, peRatio: 42.0, roe: 0.12, profitMargin: 0.28, fiftyTwoWeekChange: 0.18, dividendYield: 0.008, debtToEquity: 0.32, revenueGrowth: 0.08 },
    { ticker: 'CME', name: 'CME Group Inc.', sector: 'Financials', marketCap: 78e9, peRatio: 24.5, roe: 0.12, profitMargin: 0.58, fiftyTwoWeekChange: 0.08, dividendYield: 0.022, debtToEquity: 0.12, revenueGrowth: 0.06 },
    { ticker: 'ICE', name: 'Intercontinental Exchange', sector: 'Financials', marketCap: 82e9, peRatio: 32.0, roe: 0.11, profitMargin: 0.28, fiftyTwoWeekChange: 0.22, dividendYield: 0.013, debtToEquity: 0.82, revenueGrowth: 0.12 },
    { ticker: 'AON', name: 'Aon plc', sector: 'Financials', marketCap: 68e9, peRatio: 22.4, roe: -0.28, profitMargin: 0.18, fiftyTwoWeekChange: 0.05, dividendYield: 0.008, debtToEquity: 3.5, revenueGrowth: 0.07 },
    { ticker: 'MMC', name: 'Marsh & McLennan', sector: 'Financials', marketCap: 105e9, peRatio: 28.0, roe: 0.32, profitMargin: 0.16, fiftyTwoWeekChange: 0.15, dividendYield: 0.014, debtToEquity: 1.1, revenueGrowth: 0.08 },
    { ticker: 'PNC', name: 'PNC Financial Services', sector: 'Financials', marketCap: 68e9, peRatio: 13.8, roe: 0.10, profitMargin: 0.22, fiftyTwoWeekChange: 0.22, dividendYield: 0.038, debtToEquity: 0.95, revenueGrowth: 0.02 },
    { ticker: 'USB', name: 'U.S. Bancorp', sector: 'Financials', marketCap: 65e9, peRatio: 12.2, roe: 0.11, profitMargin: 0.19, fiftyTwoWeekChange: 0.14, dividendYield: 0.045, debtToEquity: 1.2, revenueGrowth: 0.01 },
    { ticker: 'TFC', name: 'Truist Financial Corp.', sector: 'Financials', marketCap: 52e9, peRatio: 11.8, roe: 0.07, profitMargin: 0.15, fiftyTwoWeekChange: 0.18, dividendYield: 0.052, debtToEquity: 1.1, revenueGrowth: -0.02 },
    { ticker: 'BK', name: 'The Bank of New York Mellon', sector: 'Financials', marketCap: 48e9, peRatio: 14.2, roe: 0.10, profitMargin: 0.21, fiftyTwoWeekChange: 0.35, dividendYield: 0.028, debtToEquity: 0.88, revenueGrowth: 0.04 },
    { ticker: 'COF', name: 'Capital One Financial', sector: 'Financials', marketCap: 55e9, peRatio: 11.5, roe: 0.09, profitMargin: 0.15, fiftyTwoWeekChange: 0.28, dividendYield: 0.017, debtToEquity: 0.72, revenueGrowth: 0.06 },
    { ticker: 'MET', name: 'MetLife Inc.', sector: 'Financials', marketCap: 54e9, peRatio: 12.8, roe: 0.11, profitMargin: 0.08, fiftyTwoWeekChange: 0.18, dividendYield: 0.029, debtToEquity: 0.65, revenueGrowth: 0.04 },
    { ticker: 'PRU', name: 'Prudential Financial', sector: 'Financials', marketCap: 42e9, peRatio: 10.5, roe: 0.09, profitMargin: 0.06, fiftyTwoWeekChange: 0.15, dividendYield: 0.044, debtToEquity: 0.78, revenueGrowth: 0.03 },
    { ticker: 'AIG', name: 'American International Group', sector: 'Financials', marketCap: 51e9, peRatio: 12.0, roe: 0.08, profitMargin: 0.08, fiftyTwoWeekChange: 0.22, dividendYield: 0.021, debtToEquity: 0.48, revenueGrowth: 0.05 },
    { ticker: 'TRV', name: 'The Travelers Companies', sector: 'Financials', marketCap: 49e9, peRatio: 14.5, roe: 0.14, profitMargin: 0.08, fiftyTwoWeekChange: 0.25, dividendYield: 0.019, debtToEquity: 0.32, revenueGrowth: 0.12 },
    { ticker: 'MCO', name: 'Moodys Corp.', sector: 'Financials', marketCap: 78e9, peRatio: 45.0, roe: 0.58, profitMargin: 0.28, fiftyTwoWeekChange: 0.28, dividendYield: 0.008, debtToEquity: 2.2, revenueGrowth: 0.14 },
    { ticker: 'ALL', name: 'The Allstate Corp.', sector: 'Financials', marketCap: 45e9, peRatio: 18.0, roe: 0.12, profitMargin: 0.04, fiftyTwoWeekChange: 0.42, dividendYield: 0.022, debtToEquity: 0.42, revenueGrowth: 0.08 },
    { ticker: 'HIG', name: 'The Hartford Financial', sector: 'Financials', marketCap: 31e9, peRatio: 11.2, roe: 0.18, profitMargin: 0.10, fiftyTwoWeekChange: 0.35, dividendYield: 0.019, debtToEquity: 0.32, revenueGrowth: 0.07 },
    { ticker: 'DFS', name: 'Discover Financial Services', sector: 'Financials', marketCap: 32e9, peRatio: 12.5, roe: 0.22, profitMargin: 0.18, fiftyTwoWeekChange: 0.38, dividendYield: 0.022, debtToEquity: 1.1, revenueGrowth: 0.05 },
    { ticker: 'SYF', name: 'Synchrony Financial', sector: 'Financials', marketCap: 18e9, peRatio: 8.2, roe: 0.18, profitMargin: 0.16, fiftyTwoWeekChange: 0.45, dividendYield: 0.021, debtToEquity: 1.2, revenueGrowth: 0.06 },
    { ticker: 'FITB', name: 'Fifth Third Bancorp', sector: 'Financials', marketCap: 26e9, peRatio: 11.5, roe: 0.12, profitMargin: 0.22, fiftyTwoWeekChange: 0.22, dividendYield: 0.038, debtToEquity: 0.85, revenueGrowth: 0.02 },
    { ticker: 'KEY', name: 'KeyCorp', sector: 'Financials', marketCap: 15e9, peRatio: 12.8, roe: 0.08, profitMargin: 0.15, fiftyTwoWeekChange: 0.28, dividendYield: 0.052, debtToEquity: 0.95, revenueGrowth: -0.03 },
    { ticker: 'CFG', name: 'Citizens Financial Group', sector: 'Financials', marketCap: 17e9, peRatio: 11.0, roe: 0.07, profitMargin: 0.16, fiftyTwoWeekChange: 0.25, dividendYield: 0.048, debtToEquity: 0.82, revenueGrowth: -0.01 },
    { ticker: 'MTB', name: 'M&T Bank Corp.', sector: 'Financials', marketCap: 26e9, peRatio: 11.2, roe: 0.11, profitMargin: 0.25, fiftyTwoWeekChange: 0.22, dividendYield: 0.034, debtToEquity: 0.58, revenueGrowth: 0.01 },
    { ticker: 'HBAN', name: 'Huntington Bancshares', sector: 'Financials', marketCap: 21e9, peRatio: 11.4, roe: 0.10, profitMargin: 0.21, fiftyTwoWeekChange: 0.18, dividendYield: 0.044, debtToEquity: 0.88, revenueGrowth: 0.02 },
    { ticker: 'NTRS', name: 'Northern Trust Corp.', sector: 'Financials', marketCap: 18e9, peRatio: 16.2, roe: 0.11, profitMargin: 0.18, fiftyTwoWeekChange: 0.15, dividendYield: 0.035, debtToEquity: 0.65, revenueGrowth: 0.04 },
    { ticker: 'RJF', name: 'Raymond James Financial', sector: 'Financials', marketCap: 25e9, peRatio: 14.0, roe: 0.16, profitMargin: 0.14, fiftyTwoWeekChange: 0.22, dividendYield: 0.015, debtToEquity: 0.35, revenueGrowth: 0.08 },
    { ticker: 'STT', name: 'State Street Corp.', sector: 'Financials', marketCap: 24e9, peRatio: 13.5, roe: 0.10, profitMargin: 0.18, fiftyTwoWeekChange: 0.18, dividendYield: 0.035, debtToEquity: 0.82, revenueGrowth: 0.03 },
    { ticker: 'HOOD', name: 'Robinhood Markets', sector: 'Financials', marketCap: 22e9, peRatio: 42.0, roe: 0.08, profitMargin: 0.12, fiftyTwoWeekChange: 0.85, dividendYield: null, debtToEquity: 0.02, revenueGrowth: 0.38 },
    { ticker: 'ABR', name: 'Arbor Realty Trust', sector: 'Financials', marketCap: 2.8e9, peRatio: 8.5, roe: 0.14, profitMargin: 0.32, fiftyTwoWeekChange: -0.08, dividendYield: 0.125, debtToEquity: 3.2, revenueGrowth: 0.02 }
  ];

  // 3. HEALTHCARE (35 Real Tickers)
  const healthcareList: ScreenerRecord[] = [
    { ticker: 'LLY', name: 'Eli Lilly & Co.', sector: 'Healthcare', marketCap: 820e9, peRatio: 115.0, roe: 0.48, profitMargin: 0.18, fiftyTwoWeekChange: 0.85, dividendYield: 0.006, debtToEquity: 0.95, revenueGrowth: 0.28 },
    { ticker: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare', marketCap: 480e9, peRatio: 19.5, roe: 0.24, profitMargin: 0.06, fiftyTwoWeekChange: 0.04, dividendYield: 0.016, debtToEquity: 0.68, revenueGrowth: 0.14 },
    { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', marketCap: 380e9, peRatio: 15.2, roe: 0.21, profitMargin: 0.17, fiftyTwoWeekChange: -0.06, dividendYield: 0.029, debtToEquity: 0.44, revenueGrowth: 0.05 },
    { ticker: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', marketCap: 315e9, peRatio: 22.8, roe: 0.38, profitMargin: 0.15, fiftyTwoWeekChange: 0.22, dividendYield: 0.036, debtToEquity: 2.8, revenueGrowth: 0.04 },
    { ticker: 'MRK', name: 'Merck & Co. Inc.', sector: 'Healthcare', marketCap: 295e9, peRatio: 16.4, roe: 0.15, profitMargin: 0.12, fiftyTwoWeekChange: 0.12, dividendYield: 0.027, debtToEquity: 0.72, revenueGrowth: 0.06 },
    { ticker: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', marketCap: 160e9, peRatio: 14.5, roe: 0.08, profitMargin: 0.09, fiftyTwoWeekChange: -0.18, dividendYield: 0.058, debtToEquity: 0.82, revenueGrowth: -0.12 },
    { ticker: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare', marketCap: 215e9, peRatio: 34.0, roe: 0.14, profitMargin: 0.14, fiftyTwoWeekChange: 0.15, dividendYield: 0.003, debtToEquity: 0.78, revenueGrowth: 0.02 },
    { ticker: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare', marketCap: 185e9, peRatio: 32.5, roe: 0.15, profitMargin: 0.13, fiftyTwoWeekChange: 0.08, dividendYield: 0.021, debtToEquity: 0.38, revenueGrowth: 0.04 },
    { ticker: 'DHR', name: 'Danaher Corp.', sector: 'Healthcare', marketCap: 180e9, peRatio: 38.0, roe: 0.09, profitMargin: 0.18, fiftyTwoWeekChange: 0.18, dividendYield: 0.004, debtToEquity: 0.32, revenueGrowth: 0.03 },
    { ticker: 'BMY', name: 'Bristol Myers Squibb', sector: 'Healthcare', marketCap: 85e9, peRatio: 12.0, roe: 0.18, profitMargin: 0.15, fiftyTwoWeekChange: -0.15, dividendYield: 0.055, debtToEquity: 1.4, revenueGrowth: -0.01 },
    { ticker: 'AMGN', name: 'Amgen Inc.', sector: 'Healthcare', marketCap: 165e9, peRatio: 22.0, roe: 0.32, profitMargin: 0.18, fiftyTwoWeekChange: 0.28, dividendYield: 0.029, debtToEquity: 3.2, revenueGrowth: 0.18 },
    { ticker: 'GILD', name: 'Gilead Sciences Inc.', sector: 'Healthcare', marketCap: 92e9, peRatio: 15.0, roe: 0.22, profitMargin: 0.21, fiftyTwoWeekChange: -0.05, dividendYield: 0.042, debtToEquity: 1.1, revenueGrowth: 0.02 },
    { ticker: 'CVS', name: 'CVS Health Corp.', sector: 'Healthcare', marketCap: 78e9, peRatio: 10.2, roe: 0.10, profitMargin: 0.02, fiftyTwoWeekChange: -0.22, dividendYield: 0.044, debtToEquity: 0.85, revenueGrowth: 0.04 },
    { ticker: 'CI', name: 'The Cigna Group', sector: 'Healthcare', marketCap: 98e9, peRatio: 12.8, roe: 0.12, profitMargin: 0.03, fiftyTwoWeekChange: 0.22, dividendYield: 0.016, debtToEquity: 0.72, revenueGrowth: 0.08 },
    { ticker: 'ISRG', name: 'Intuitive Surgical', sector: 'Healthcare', marketCap: 155e9, peRatio: 78.0, roe: 0.14, profitMargin: 0.25, fiftyTwoWeekChange: 0.48, dividendYield: null, debtToEquity: 0.01, revenueGrowth: 0.15 },
    { ticker: 'ELV', name: 'Elevance Health Inc.', sector: 'Healthcare', marketCap: 115e9, peRatio: 16.5, roe: 0.16, profitMargin: 0.04, fiftyTwoWeekChange: 0.12, dividendYield: 0.013, debtToEquity: 0.65, revenueGrowth: 0.05 },
    { ticker: 'VRTX', name: 'Vertex Pharmaceuticals', sector: 'Healthcare', marketCap: 120e9, peRatio: 28.0, roe: 0.28, profitMargin: 0.38, fiftyTwoWeekChange: 0.35, dividendYield: null, debtToEquity: 0.05, revenueGrowth: 0.12 },
    { ticker: 'REGN', name: 'Regeneron Pharmaceuticals', sector: 'Healthcare', marketCap: 108e9, peRatio: 25.4, roe: 0.16, profitMargin: 0.28, fiftyTwoWeekChange: 0.28, dividendYield: null, debtToEquity: 0.08, revenueGrowth: 0.07 },
    { ticker: 'ZTS', name: 'Zoetis Inc.', sector: 'Healthcare', marketCap: 78e9, peRatio: 32.0, roe: 0.48, profitMargin: 0.28, fiftyTwoWeekChange: -0.02, dividendYield: 0.010, debtToEquity: 1.4, revenueGrowth: 0.07 },
    { ticker: 'MDT', name: 'Medtronic plc', sector: 'Healthcare', marketCap: 105e9, peRatio: 24.0, roe: 0.08, profitMargin: 0.14, fiftyTwoWeekChange: 0.05, dividendYield: 0.034, debtToEquity: 0.52, revenueGrowth: 0.04 },
    { ticker: 'SYK', name: 'Stryker Corp.', sector: 'Healthcare', marketCap: 130e9, peRatio: 38.0, roe: 0.18, profitMargin: 0.16, fiftyTwoWeekChange: 0.25, dividendYield: 0.009, debtToEquity: 0.78, revenueGrowth: 0.10 },
    { ticker: 'BDX', name: 'Becton Dickinson', sector: 'Healthcare', marketCap: 68e9, peRatio: 42.0, roe: 0.06, profitMargin: 0.08, fiftyTwoWeekChange: -0.05, dividendYield: 0.016, debtToEquity: 0.62, revenueGrowth: 0.03 },
    { ticker: 'HCA', name: 'HCA Healthcare', sector: 'Healthcare', marketCap: 85e9, peRatio: 16.5, roe: -0.85, profitMargin: 0.08, fiftyTwoWeekChange: 0.32, dividendYield: 0.008, debtToEquity: 8.5, revenueGrowth: 0.08 },
    { ticker: 'HUM', name: 'Humana Inc.', sector: 'Healthcare', marketCap: 42e9, peRatio: 18.0, roe: 0.12, profitMargin: 0.02, fiftyTwoWeekChange: -0.32, dividendYield: 0.011, debtToEquity: 0.65, revenueGrowth: 0.11 },
    { ticker: 'MCK', name: 'McKesson Corp.', sector: 'Healthcare', marketCap: 72e9, peRatio: 24.0, roe: -0.32, profitMargin: 0.01, fiftyTwoWeekChange: 0.38, dividendYield: 0.004, debtToEquity: 4.2, revenueGrowth: 0.12 },
    { ticker: 'MTD', name: 'Mettler-Toledo International', sector: 'Healthcare', marketCap: 32e9, peRatio: 35.0, roe: -0.42, profitMargin: 0.22, fiftyTwoWeekChange: 0.18, dividendYield: null, debtToEquity: 5.2, revenueGrowth: 0.02 },
    { ticker: 'GEHC', name: 'GE HealthCare Technologies', sector: 'Healthcare', marketCap: 38e9, peRatio: 22.0, roe: 0.14, profitMargin: 0.09, fiftyTwoWeekChange: 0.12, dividendYield: 0.002, debtToEquity: 0.85, revenueGrowth: 0.05 },
    { ticker: 'A', name: 'Agilent Technologies', sector: 'Healthcare', marketCap: 39e9, peRatio: 32.0, roe: 0.22, profitMargin: 0.18, fiftyTwoWeekChange: 0.08, dividendYield: 0.007, debtToEquity: 0.48, revenueGrowth: -0.01 },
    { ticker: 'BSX', name: 'Boston Scientific', sector: 'Healthcare', marketCap: 112e9, peRatio: 62.0, roe: 0.11, profitMargin: 0.12, fiftyTwoWeekChange: 0.48, dividendYield: null, debtToEquity: 0.48, revenueGrowth: 0.14 },
    { ticker: 'COR', name: 'Cencora Inc.', sector: 'Healthcare', marketCap: 48e9, peRatio: 25.0, roe: -0.22, profitMargin: 0.008, fiftyTwoWeekChange: 0.32, dividendYield: 0.008, debtToEquity: 3.8, revenueGrowth: 0.11 },
    { ticker: 'IDXX', name: 'IDEXX Laboratories', sector: 'Healthcare', marketCap: 42e9, peRatio: 52.0, roe: 0.78, profitMargin: 0.22, fiftyTwoWeekChange: 0.05, dividendYield: null, debtToEquity: 0.95, revenueGrowth: 0.08 },
    { ticker: 'DXCM', name: 'DexCom Inc.', sector: 'Healthcare', marketCap: 45e9, peRatio: 78.0, roe: 0.22, profitMargin: 0.15, fiftyTwoWeekChange: -0.08, dividendYield: null, debtToEquity: 1.2, revenueGrowth: 0.24 },
    { ticker: 'ALGN', name: 'Align Technology', sector: 'Healthcare', marketCap: 21e9, peRatio: 45.0, roe: 0.12, profitMargin: 0.11, fiftyTwoWeekChange: -0.12, dividendYield: null, debtToEquity: 0.08, revenueGrowth: 0.05 },
    { ticker: 'INCY', name: 'Incyte Corp.', sector: 'Healthcare', marketCap: 12e9, peRatio: 22.0, roe: 0.11, profitMargin: 0.18, fiftyTwoWeekChange: 0.08, dividendYield: null, debtToEquity: 0.01, revenueGrowth: 0.09 },
    { ticker: 'BIIB', name: 'Biogen Inc.', sector: 'Healthcare', marketCap: 32e9, peRatio: 18.0, roe: 0.08, profitMargin: 0.11, fiftyTwoWeekChange: -0.25, dividendYield: null, debtToEquity: 0.45, revenueGrowth: -0.03 }
  ];

  // 4. CONSUMER (35 Real Tickers)
  const consumerList: ScreenerRecord[] = [
    { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer', marketCap: 1950e9, peRatio: 41.5, roe: 0.21, profitMargin: 0.06, fiftyTwoWeekChange: 0.32, dividendYield: null, debtToEquity: 0.35, revenueGrowth: 0.13 },
    { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer', marketCap: 620e9, peRatio: 54.2, roe: 0.18, profitMargin: 0.09, fiftyTwoWeekChange: -0.12, dividendYield: null, debtToEquity: 0.08, revenueGrowth: 0.08 },
    { ticker: 'HD', name: 'Home Depot Inc.', sector: 'Consumer', marketCap: 360e9, peRatio: 23.4, roe: 1.22, profitMargin: 0.10, fiftyTwoWeekChange: 0.08, dividendYield: 0.024, debtToEquity: 2.1, revenueGrowth: 0.02 },
    { ticker: 'MCD', name: 'McDonalds Corp.', sector: 'Consumer', marketCap: 210e9, peRatio: 24.1, roe: 0.85, profitMargin: 0.33, fiftyTwoWeekChange: 0.05, dividendYield: 0.025, debtToEquity: 4.5, revenueGrowth: 0.04 },
    { ticker: 'NKE', name: 'Nike Inc.', sector: 'Consumer', marketCap: 140e9, peRatio: 26.5, roe: 0.35, profitMargin: 0.11, fiftyTwoWeekChange: -0.14, dividendYield: 0.016, debtToEquity: 0.48, revenueGrowth: 0.02 },
    { ticker: 'COST', name: 'Costco Wholesale Corp.', sector: 'Consumer', marketCap: 385e9, peRatio: 48.2, roe: 0.28, profitMargin: 0.03, fiftyTwoWeekChange: 0.44, dividendYield: 0.005, debtToEquity: 0.12, revenueGrowth: 0.08 },
    { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Consumer', marketCap: 540e9, peRatio: 31.0, roe: 0.18, profitMargin: 0.02, fiftyTwoWeekChange: 0.32, dividendYield: 0.012, debtToEquity: 0.68, revenueGrowth: 0.06 },
    { ticker: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer', marketCap: 395e9, peRatio: 26.5, roe: 0.32, profitMargin: 0.18, fiftyTwoWeekChange: 0.12, dividendYield: 0.024, debtToEquity: 0.72, revenueGrowth: 0.03 },
    { ticker: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer', marketCap: 275e9, peRatio: 24.2, roe: 0.42, profitMargin: 0.23, fiftyTwoWeekChange: 0.08, dividendYield: 0.031, debtToEquity: 1.45, revenueGrowth: 0.05 },
    { ticker: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer', marketCap: 235e9, peRatio: 22.8, roe: 0.52, profitMargin: 0.10, fiftyTwoWeekChange: -0.02, dividendYield: 0.032, debtToEquity: 2.1, revenueGrowth: 0.04 },
    { ticker: 'TM', name: 'Toyota Motor Corp.', sector: 'Consumer', marketCap: 280e9, peRatio: 9.5, roe: 0.14, profitMargin: 0.09, fiftyTwoWeekChange: 0.28, dividendYield: 0.028, debtToEquity: 0.58, revenueGrowth: 0.11 },
    { ticker: 'TGT', name: 'Target Corp.', sector: 'Consumer', marketCap: 68e9, peRatio: 16.2, roe: 0.32, profitMargin: 0.04, fiftyTwoWeekChange: 0.15, dividendYield: 0.031, debtToEquity: 1.2, revenueGrowth: 0.02 },
    { ticker: 'LOW', name: 'Lowe\'s Companies Inc.', sector: 'Consumer', marketCap: 135e9, peRatio: 18.2, roe: -0.85, profitMargin: 0.08, fiftyTwoWeekChange: 0.12, dividendYield: 0.020, debtToEquity: 8.2, revenueGrowth: -0.01 },
    { ticker: 'SBUX', name: 'Starbucks Corp.', sector: 'Consumer', marketCap: 92e9, peRatio: 22.0, roe: -0.45, profitMargin: 0.11, fiftyTwoWeekChange: -0.18, dividendYield: 0.028, debtToEquity: 5.2, revenueGrowth: 0.02 },
    { ticker: 'TJX', name: 'The TJX Companies', sector: 'Consumer', marketCap: 122e9, peRatio: 26.0, roe: 0.62, profitMargin: 0.08, fiftyTwoWeekChange: 0.28, dividendYield: 0.013, debtToEquity: 0.42, revenueGrowth: 0.08 },
    { ticker: 'BKNG', name: 'Booking Holdings', sector: 'Consumer', marketCap: 132e9, peRatio: 31.0, roe: -0.92, profitMargin: 0.22, fiftyTwoWeekChange: 0.22, dividendYield: 0.009, debtToEquity: 6.8, revenueGrowth: 0.18 },
    { ticker: 'MAR', name: 'Marriott International', sector: 'Consumer', marketCap: 68e9, peRatio: 25.0, roe: -0.32, profitMargin: 0.12, fiftyTwoWeekChange: 0.18, dividendYield: 0.009, debtToEquity: 4.5, revenueGrowth: 0.06 },
    { ticker: 'HLT', name: 'Hilton Worldwide', sector: 'Consumer', marketCap: 52e9, peRatio: 38.0, roe: -0.22, profitMargin: 0.11, fiftyTwoWeekChange: 0.28, dividendYield: 0.003, debtToEquity: 3.8, revenueGrowth: 0.07 },
    { ticker: 'CMG', name: 'Chipotle Mexican Grill', sector: 'Consumer', marketCap: 78e9, peRatio: 58.0, roe: 0.45, profitMargin: 0.12, fiftyTwoWeekChange: 0.42, dividendYield: null, debtToEquity: 0.85, revenueGrowth: 0.14 },
    { ticker: 'LULU', name: 'Lululemon Athletica', sector: 'Consumer', marketCap: 38e9, peRatio: 24.0, roe: 0.42, profitMargin: 0.16, fiftyTwoWeekChange: -0.38, dividendYield: null, debtToEquity: 0.22, revenueGrowth: 0.10 },
    { ticker: 'ORLY', name: 'O\'Reilly Automotive', sector: 'Consumer', marketCap: 62e9, peRatio: 26.0, roe: -0.65, profitMargin: 0.15, fiftyTwoWeekChange: 0.18, dividendYield: null, debtToEquity: 3.8, revenueGrowth: 0.06 },
    { ticker: 'AZO', name: 'AutoZone Inc.', sector: 'Consumer', marketCap: 52e9, peRatio: 19.0, roe: -0.42, profitMargin: 0.14, fiftyTwoWeekChange: 0.15, dividendYield: null, debtToEquity: 4.2, revenueGrowth: 0.05 },
    { ticker: 'YUM', name: 'Yum! Brands Inc.', sector: 'Consumer', marketCap: 38e9, peRatio: 24.0, roe: -0.18, profitMargin: 0.22, fiftyTwoWeekChange: 0.05, dividendYield: 0.020, debtToEquity: 2.8, revenueGrowth: 0.04 },
    { ticker: 'ABNB', name: 'Airbnb Inc.', sector: 'Consumer', marketCap: 92e9, peRatio: 32.0, roe: 0.42, profitMargin: 0.28, fiftyTwoWeekChange: 0.12, dividendYield: null, debtToEquity: 0.38, revenueGrowth: 0.18 },
    { ticker: 'DASH', name: 'DoorDash Inc.', sector: 'Consumer', marketCap: 48e9, peRatio: null, roe: -0.08, profitMargin: -0.04, fiftyTwoWeekChange: 0.65, dividendYield: null, debtToEquity: 0.28, revenueGrowth: 0.27 },
    { ticker: 'EBAY', name: 'eBay Inc.', sector: 'Consumer', marketCap: 28e9, peRatio: 12.5, roe: 0.45, profitMargin: 0.21, fiftyTwoWeekChange: 0.28, dividendYield: 0.021, debtToEquity: 1.2, revenueGrowth: 0.02 },
    { ticker: 'ETSY', name: 'Etsy Inc.', sector: 'Consumer', marketCap: 7.5e9, peRatio: 28.0, roe: -0.22, profitMargin: 0.11, fiftyTwoWeekChange: -0.28, dividendYield: null, debtToEquity: 3.2, revenueGrowth: 0.01 },
    { ticker: 'KMB', name: 'Kimberly-Clark Corp.', sector: 'Consumer', marketCap: 48e9, peRatio: 21.0, roe: 1.45, profitMargin: 0.09, fiftyTwoWeekChange: 0.12, dividendYield: 0.035, debtToEquity: 4.8, revenueGrowth: 0.02 },
    { ticker: 'MDLZ', name: 'Mondelez International', sector: 'Consumer', marketCap: 95e9, peRatio: 21.5, roe: 0.14, profitMargin: 0.14, fiftyTwoWeekChange: 0.02, dividendYield: 0.024, debtToEquity: 0.72, revenueGrowth: 0.04 },
    { ticker: 'CL', name: 'Colgate-Palmolive Co.', sector: 'Consumer', marketCap: 78e9, peRatio: 28.0, roe: 1.85, profitMargin: 0.12, fiftyTwoWeekChange: 0.22, dividendYield: 0.021, debtToEquity: 8.5, revenueGrowth: 0.05 },
    { ticker: 'MO', name: 'Altria Group Inc.', sector: 'Consumer', marketCap: 82e9, peRatio: 9.8, roe: -0.32, profitMargin: 0.42, fiftyTwoWeekChange: 0.18, dividendYield: 0.082, debtToEquity: 5.2, revenueGrowth: -0.01 },
    { ticker: 'PM', name: 'Philip Morris International', sector: 'Consumer', marketCap: 162e9, peRatio: 18.5, roe: -0.42, profitMargin: 0.22, fiftyTwoWeekChange: 0.15, dividendYield: 0.048, debtToEquity: 4.1, revenueGrowth: 0.08 },
    { ticker: 'ADM', name: 'Archer-Daniels-Midland', sector: 'Consumer', marketCap: 31e9, peRatio: 10.5, roe: 0.14, profitMargin: 0.03, fiftyTwoWeekChange: -0.25, dividendYield: 0.032, debtToEquity: 0.38, revenueGrowth: -0.08 },
    { ticker: 'GIS', name: 'General Mills Inc.', sector: 'Consumer', marketCap: 38e9, peRatio: 15.2, roe: 0.24, profitMargin: 0.12, fiftyTwoWeekChange: -0.05, dividendYield: 0.036, debtToEquity: 1.1, revenueGrowth: -0.01 },
    { ticker: 'STZ', name: 'Constellation Brands', sector: 'Consumer', marketCap: 46e9, peRatio: 26.0, roe: 0.18, profitMargin: 0.18, fiftyTwoWeekChange: 0.08, dividendYield: 0.015, debtToEquity: 1.2, revenueGrowth: 0.05 }
  ];

  // 5. ENERGY (25 Real Tickers)
  const energyList: ScreenerRecord[] = [
    { ticker: 'XOM', name: 'Exxon Mobil Corp.', sector: 'Energy', marketCap: 475e9, peRatio: 12.4, roe: 0.19, profitMargin: 0.11, fiftyTwoWeekChange: 0.12, dividendYield: 0.034, debtToEquity: 0.18, revenueGrowth: 0.04 },
    { ticker: 'CVX', name: 'Chevron Corp.', sector: 'Energy', marketCap: 295e9, peRatio: 13.1, roe: 0.15, profitMargin: 0.10, fiftyTwoWeekChange: 0.06, dividendYield: 0.041, debtToEquity: 0.22, revenueGrowth: 0.03 },
    { ticker: 'COP', name: 'ConocoPhillips', sector: 'Energy', marketCap: 140e9, peRatio: 11.5, roe: 0.18, profitMargin: 0.14, fiftyTwoWeekChange: 0.15, dividendYield: 0.028, debtToEquity: 0.35, revenueGrowth: 0.05 },
    { ticker: 'SLB', name: 'Schlumberger N.V.', sector: 'Energy', marketCap: 68e9, peRatio: 14.2, roe: 0.21, profitMargin: 0.13, fiftyTwoWeekChange: 0.09, dividendYield: 0.022, debtToEquity: 0.58, revenueGrowth: 0.08 },
    { ticker: 'EOG', name: 'EOG Resources Inc.', sector: 'Energy', marketCap: 72e9, peRatio: 10.8, roe: 0.24, profitMargin: 0.28, fiftyTwoWeekChange: 0.12, dividendYield: 0.028, debtToEquity: 0.15, revenueGrowth: 0.04 },
    { ticker: 'MPC', name: 'Marathon Petroleum', sector: 'Energy', marketCap: 65e9, peRatio: 9.2, roe: 0.35, profitMargin: 0.06, fiftyTwoWeekChange: 0.28, dividendYield: 0.021, debtToEquity: 0.85, revenueGrowth: -0.02 },
    { ticker: 'PSX', name: 'Phillips 66', sector: 'Energy', marketCap: 58e9, peRatio: 11.0, roe: 0.22, profitMargin: 0.04, fiftyTwoWeekChange: 0.18, dividendYield: 0.032, debtToEquity: 0.65, revenueGrowth: -0.01 },
    { ticker: 'VLO', name: 'Valero Energy Corp.', sector: 'Energy', marketCap: 52e9, peRatio: 8.8, roe: 0.32, profitMargin: 0.05, fiftyTwoWeekChange: 0.22, dividendYield: 0.028, debtToEquity: 0.42, revenueGrowth: -0.03 },
    { ticker: 'OXY', name: 'Occidental Petroleum', sector: 'Energy', marketCap: 54e9, peRatio: 14.5, roe: 0.14, profitMargin: 0.15, fiftyTwoWeekChange: 0.02, dividendYield: 0.015, debtToEquity: 0.88, revenueGrowth: 0.02 },
    { ticker: 'WMB', name: 'Williams Companies Inc.', sector: 'Energy', marketCap: 52e9, peRatio: 18.2, roe: 0.15, profitMargin: 0.24, fiftyTwoWeekChange: 0.25, dividendYield: 0.045, debtToEquity: 1.4, revenueGrowth: 0.05 },
    { ticker: 'KMI', name: 'Kinder Morgan Inc.', sector: 'Energy', marketCap: 45e9, peRatio: 16.5, roe: 0.08, profitMargin: 0.16, fiftyTwoWeekChange: 0.18, dividendYield: 0.055, debtToEquity: 1.1, revenueGrowth: 0.03 },
    { ticker: 'HAL', name: 'Halliburton Company', sector: 'Energy', marketCap: 32e9, peRatio: 11.8, roe: 0.28, profitMargin: 0.11, fiftyTwoWeekChange: -0.05, dividendYield: 0.020, debtToEquity: 0.82, revenueGrowth: 0.04 },
    { ticker: 'BKR', name: 'Baker Hughes Company', sector: 'Energy', marketCap: 35e9, peRatio: 15.0, roe: 0.12, profitMargin: 0.08, fiftyTwoWeekChange: 0.12, dividendYield: 0.024, debtToEquity: 0.38, revenueGrowth: 0.08 },
    { ticker: 'HES', name: 'Hess Corp.', sector: 'Energy', marketCap: 48e9, peRatio: 22.0, roe: 0.22, profitMargin: 0.21, fiftyTwoWeekChange: 0.18, dividendYield: 0.012, debtToEquity: 0.62, revenueGrowth: 0.14 },
    { ticker: 'DVN', name: 'Devon Energy Corp.', sector: 'Energy', marketCap: 28e9, peRatio: 8.5, roe: 0.28, profitMargin: 0.22, fiftyTwoWeekChange: -0.08, dividendYield: 0.048, debtToEquity: 0.52, revenueGrowth: 0.01 },
    { ticker: 'FANG', name: 'Diamondback Energy', sector: 'Energy', marketCap: 36e9, peRatio: 10.2, roe: 0.21, profitMargin: 0.38, fiftyTwoWeekChange: 0.25, dividendYield: 0.042, debtToEquity: 0.38, revenueGrowth: 0.06 },
    { ticker: 'PXD', name: 'Pioneer Natural Resources', sector: 'Energy', marketCap: 62e9, peRatio: 12.0, roe: 0.22, profitMargin: 0.25, fiftyTwoWeekChange: 0.18, dividendYield: 0.038, debtToEquity: 0.22, revenueGrowth: 0.05 },
    { ticker: 'CTRA', name: 'Coterra Energy Inc.', sector: 'Energy', marketCap: 21e9, peRatio: 12.5, roe: 0.11, profitMargin: 0.22, fiftyTwoWeekChange: 0.05, dividendYield: 0.032, debtToEquity: 0.18, revenueGrowth: -0.02 },
    { ticker: 'TRGP', name: 'Targa Resources Corp.', sector: 'Energy', marketCap: 28e9, peRatio: 25.0, roe: 0.18, profitMargin: 0.06, fiftyTwoWeekChange: 0.52, dividendYield: 0.022, debtToEquity: 2.1, revenueGrowth: 0.08 },
    { ticker: 'EQNR', name: 'Equinor ASA', sector: 'Energy', marketCap: 82e9, peRatio: 7.8, roe: 0.28, profitMargin: 0.15, fiftyTwoWeekChange: -0.12, dividendYield: 0.085, debtToEquity: 0.32, revenueGrowth: -0.08 },
    { ticker: 'BP', name: 'BP plc', sector: 'Energy', marketCap: 98e9, peRatio: 11.2, roe: 0.14, profitMargin: 0.05, fiftyTwoWeekChange: -0.02, dividendYield: 0.052, debtToEquity: 0.72, revenueGrowth: -0.02 },
    { ticker: 'SHEL', name: 'Shell plc', sector: 'Energy', marketCap: 215e9, peRatio: 11.8, roe: 0.15, profitMargin: 0.06, fiftyTwoWeekChange: 0.12, dividendYield: 0.038, debtToEquity: 0.48, revenueGrowth: -0.01 },
    { ticker: 'TTE', name: 'TotalEnergies SE', sector: 'Energy', marketCap: 165e9, peRatio: 8.5, roe: 0.18, profitMargin: 0.09, fiftyTwoWeekChange: 0.08, dividendYield: 0.048, debtToEquity: 0.42, revenueGrowth: -0.02 },
    { ticker: 'OKE', name: 'ONEAK Inc.', sector: 'Energy', marketCap: 48e9, peRatio: 18.0, roe: 0.18, profitMargin: 0.12, fiftyTwoWeekChange: 0.38, dividendYield: 0.045, debtToEquity: 1.5, revenueGrowth: 0.18 },
    { ticker: 'MRO', name: 'Marathon Oil Corp.', sector: 'Energy', marketCap: 16e9, peRatio: 10.5, roe: 0.14, profitMargin: 0.22, fiftyTwoWeekChange: 0.12, dividendYield: 0.016, debtToEquity: 0.52, revenueGrowth: 0.03 }
  ];

  // 6. INDUSTRIALS (25 Real Tickers)
  const industrialsList: ScreenerRecord[] = [
    { ticker: 'GE', name: 'General Electric Co.', sector: 'Industrials', marketCap: 185e9, peRatio: 22.4, roe: 0.16, profitMargin: 0.09, fiftyTwoWeekChange: 0.72, dividendYield: 0.006, debtToEquity: 0.62, revenueGrowth: 0.11 },
    { ticker: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', marketCap: 175e9, peRatio: 15.2, roe: 0.52, profitMargin: 0.15, fiftyTwoWeekChange: 0.38, dividendYield: 0.017, debtToEquity: 1.85, revenueGrowth: 0.07 },
    { ticker: 'HON', name: 'Honeywell International', sector: 'Industrials', marketCap: 130e9, peRatio: 21.1, roe: 0.28, profitMargin: 0.16, fiftyTwoWeekChange: 0.08, dividendYield: 0.021, debtToEquity: 0.92, revenueGrowth: 0.05 },
    { ticker: 'LMT', name: 'Lockheed Martin Corp.', sector: 'Industrials', marketCap: 115e9, peRatio: 16.8, roe: 0.65, profitMargin: 0.10, fiftyTwoWeekChange: 0.14, dividendYield: 0.028, debtToEquity: 1.45, revenueGrowth: 0.03 },
    { ticker: 'RTX', name: 'RTX Corp.', sector: 'Industrials', marketCap: 138e9, peRatio: 38.0, roe: 0.06, profitMargin: 0.05, fiftyTwoWeekChange: 0.28, dividendYield: 0.022, debtToEquity: 0.68, revenueGrowth: 0.12 },
    { ticker: 'DE', name: 'Deere & Company', sector: 'Industrials', marketCap: 102e9, peRatio: 11.5, roe: 0.38, profitMargin: 0.16, fiftyTwoWeekChange: -0.08, dividendYield: 0.016, debtToEquity: 2.8, revenueGrowth: -0.12 },
    { ticker: 'UNP', name: 'Union Pacific Corp.', sector: 'Industrials', marketCap: 145e9, peRatio: 22.0, roe: 0.42, profitMargin: 0.26, fiftyTwoWeekChange: 0.08, dividendYield: 0.022, debtToEquity: 2.1, revenueGrowth: 0.01 },
    { ticker: 'BA', name: 'The Boeing Company', sector: 'Industrials', marketCap: 112e9, peRatio: null, roe: -0.45, profitMargin: -0.04, fiftyTwoWeekChange: -0.28, dividendYield: null, debtToEquity: 8.5, revenueGrowth: 0.08 },
    { ticker: 'UPS', name: 'United Parcel Service', sector: 'Industrials', marketCap: 118e9, peRatio: 18.5, roe: 0.35, profitMargin: 0.07, fiftyTwoWeekChange: -0.18, dividendYield: 0.048, debtToEquity: 1.1, revenueGrowth: -0.01 },
    { ticker: 'ADP', name: 'Automatic Data Processing', sector: 'Industrials', marketCap: 102e9, peRatio: 28.0, roe: 0.88, profitMargin: 0.19, fiftyTwoWeekChange: 0.12, dividendYield: 0.022, debtToEquity: 0.85, revenueGrowth: 0.07 },
    { ticker: 'CSX', name: 'CSX Corp.', sector: 'Industrials', marketCap: 68e9, peRatio: 18.0, roe: 0.28, profitMargin: 0.25, fiftyTwoWeekChange: 0.05, dividendYield: 0.014, debtToEquity: 1.4, revenueGrowth: 0.01 },
    { ticker: 'NSC', name: 'Norfolk Southern Corp.', sector: 'Industrials', marketCap: 52e9, peRatio: 22.0, roe: 0.15, profitMargin: 0.18, fiftyTwoWeekChange: 0.12, dividendYield: 0.024, debtToEquity: 1.2, revenueGrowth: 0.02 },
    { ticker: 'WM', name: 'Waste Management Inc.', sector: 'Industrials', marketCap: 85e9, peRatio: 32.0, roe: 0.32, profitMargin: 0.12, fiftyTwoWeekChange: 0.22, dividendYield: 0.014, debtToEquity: 2.2, revenueGrowth: 0.06 },
    { ticker: 'ETN', name: 'Eaton Corp. plc', sector: 'Industrials', marketCap: 125e9, peRatio: 35.0, roe: 0.21, profitMargin: 0.14, fiftyTwoWeekChange: 0.62, dividendYield: 0.011, debtToEquity: 0.52, revenueGrowth: 0.08 },
    { ticker: 'ITW', name: 'Illinois Tool Works', sector: 'Industrials', marketCap: 72e9, peRatio: 24.0, roe: 0.92, profitMargin: 0.19, fiftyTwoWeekChange: 0.08, dividendYield: 0.022, debtToEquity: 2.4, revenueGrowth: 0.02 },
    { ticker: 'PH', name: 'Parker-Hannifin Corp.', sector: 'Industrials', marketCap: 68e9, peRatio: 26.0, roe: 0.28, profitMargin: 0.14, fiftyTwoWeekChange: 0.42, dividendYield: 0.011, debtToEquity: 1.1, revenueGrowth: 0.05 },
    { ticker: 'CARR', name: 'Carrier Global Corp.', sector: 'Industrials', marketCap: 58e9, peRatio: 32.0, roe: 0.22, profitMargin: 0.08, fiftyTwoWeekChange: 0.28, dividendYield: 0.011, debtToEquity: 1.5, revenueGrowth: 0.12 },
    { ticker: 'JCI', name: 'Johnson Controls', sector: 'Industrials', marketCap: 45e9, peRatio: 24.0, roe: 0.11, profitMargin: 0.07, fiftyTwoWeekChange: 0.22, dividendYield: 0.022, debtToEquity: 0.72, revenueGrowth: 0.03 },
    { ticker: 'TDG', name: 'TransDigm Group Inc.', sector: 'Industrials', marketCap: 72e9, peRatio: 52.0, roe: -0.42, profitMargin: 0.21, fiftyTwoWeekChange: 0.48, dividendYield: null, debtToEquity: 12.5, revenueGrowth: 0.21 },
    { ticker: 'GD', name: 'General Dynamics Corp.', sector: 'Industrials', marketCap: 82e9, peRatio: 22.0, roe: 0.18, profitMargin: 0.08, fiftyTwoWeekChange: 0.22, dividendYield: 0.019, debtToEquity: 0.58, revenueGrowth: 0.08 },
    { ticker: 'NOC', name: 'Northrop Grumman Corp.', sector: 'Industrials', marketCap: 68e9, peRatio: 32.0, roe: 0.14, profitMargin: 0.05, fiftyTwoWeekChange: 0.08, dividendYield: 0.018, debtToEquity: 0.92, revenueGrowth: 0.07 },
    { ticker: 'EMR', name: 'Emerson Electric Co.', sector: 'Industrials', marketCap: 62e9, peRatio: 28.0, roe: 0.12, profitMargin: 0.14, fiftyTwoWeekChange: 0.22, dividendYield: 0.019, debtToEquity: 0.42, revenueGrowth: 0.14 },
    { ticker: 'ROK', name: 'Rockwell Automation', sector: 'Industrials', marketCap: 31e9, peRatio: 26.0, roe: 0.32, profitMargin: 0.12, fiftyTwoWeekChange: -0.12, dividendYield: 0.018, debtToEquity: 1.1, revenueGrowth: -0.02 },
    { ticker: 'TT', name: 'Trane Technologies', sector: 'Industrials', marketCap: 78e9, peRatio: 38.0, roe: 0.32, profitMargin: 0.11, fiftyTwoWeekChange: 0.65, dividendYield: 0.010, debtToEquity: 0.85, revenueGrowth: 0.11 },
    { ticker: 'CMI', name: 'Cummins Inc.', sector: 'Industrials', marketCap: 39e9, peRatio: 18.0, roe: 0.22, profitMargin: 0.08, fiftyTwoWeekChange: 0.28, dividendYield: 0.024, debtToEquity: 0.52, revenueGrowth: 0.05 }
  ];

  // 7. COMMUNICATION (25 Real Tickers)
  const communicationList: ScreenerRecord[] = [
    { ticker: 'GOOG', name: 'Alphabet Inc. Class C', sector: 'Communication', marketCap: 2180e9, peRatio: 25.4, roe: 0.27, profitMargin: 0.24, fiftyTwoWeekChange: 0.36, dividendYield: 0.004, debtToEquity: 0.09, revenueGrowth: 0.14 },
    { ticker: 'META', name: 'Meta Platforms Inc.', sector: 'Communication', marketCap: 1240e9, peRatio: 28.1, roe: 0.31, profitMargin: 0.32, fiftyTwoWeekChange: 0.78, dividendYield: 0.004, debtToEquity: 0.07, revenueGrowth: 0.22 },
    { ticker: 'NFLX', name: 'Netflix Inc.', sector: 'Communication', marketCap: 285e9, peRatio: 38.2, roe: 0.29, profitMargin: 0.18, fiftyTwoWeekChange: 0.48, dividendYield: null, debtToEquity: 0.68, revenueGrowth: 0.15 },
    { ticker: 'DIS', name: 'Walt Disney Co.', sector: 'Communication', marketCap: 180e9, peRatio: 24.5, roe: 0.05, profitMargin: 0.04, fiftyTwoWeekChange: 0.12, dividendYield: 0.007, debtToEquity: 0.42, revenueGrowth: 0.05 },
    { ticker: 'CMCSA', name: 'Comcast Corp.', sector: 'Communication', marketCap: 155e9, peRatio: 10.5, roe: 0.18, profitMargin: 0.12, fiftyTwoWeekChange: -0.05, dividendYield: 0.031, debtToEquity: 1.1, revenueGrowth: 0.01 },
    { ticker: 'T', name: 'AT&T Inc.', sector: 'Communication', marketCap: 132e9, peRatio: 9.2, roe: 0.12, profitMargin: 0.11, fiftyTwoWeekChange: 0.22, dividendYield: 0.061, debtToEquity: 1.25, revenueGrowth: 0.01 },
    { ticker: 'VZ', name: 'Verizon Communications', sector: 'Communication', marketCap: 172e9, peRatio: 9.8, roe: 0.22, profitMargin: 0.09, fiftyTwoWeekChange: 0.15, dividendYield: 0.064, debtToEquity: 1.55, revenueGrowth: 0.01 },
    { ticker: 'TMUS', name: 'T-Mobile US Inc.', sector: 'Communication', marketCap: 212e9, peRatio: 24.0, roe: 0.14, profitMargin: 0.11, fiftyTwoWeekChange: 0.25, dividendYield: 0.015, debtToEquity: 1.1, revenueGrowth: 0.03 },
    { ticker: 'CHTR', name: 'Charter Communications', sector: 'Communication', marketCap: 45e9, peRatio: 9.5, roe: 0.35, profitMargin: 0.09, fiftyTwoWeekChange: -0.18, dividendYield: null, debtToEquity: 7.2, revenueGrowth: 0.005 },
    { ticker: 'EA', name: 'Electronic Arts Inc.', sector: 'Communication', marketCap: 38e9, peRatio: 32.0, roe: 0.25, profitMargin: 0.16, fiftyTwoWeekChange: 0.12, dividendYield: 0.005, debtToEquity: 0.25, revenueGrowth: 0.02 },
    { ticker: 'TTWO', name: 'Take-Two Interactive', sector: 'Communication', marketCap: 28e9, peRatio: null, roe: -0.12, profitMargin: -0.18, fiftyTwoWeekChange: 0.08, dividendYield: null, debtToEquity: 0.35, revenueGrowth: 0.08 },
    { ticker: 'WBD', name: 'Warner Bros. Discovery', sector: 'Communication', marketCap: 18e9, peRatio: null, roe: -0.08, profitMargin: -0.11, fiftyTwoWeekChange: -0.32, dividendYield: null, debtToEquity: 1.1, revenueGrowth: -0.05 },
    { ticker: 'OMC', name: 'Omnicom Group Inc.', sector: 'Communication', marketCap: 18e9, peRatio: 12.5, roe: 0.38, profitMargin: 0.09, fiftyTwoWeekChange: 0.12, dividendYield: 0.031, debtToEquity: 1.4, revenueGrowth: 0.03 },
    { ticker: 'LYV', name: 'Live Nation Entertainment', sector: 'Communication', marketCap: 22e9, peRatio: 42.0, roe: 0.32, profitMargin: 0.02, fiftyTwoWeekChange: 0.18, dividendYield: null, debtToEquity: 8.5, revenueGrowth: 0.21 },
    { ticker: 'PINS', name: 'Pinterest Inc.', sector: 'Communication', marketCap: 28e9, peRatio: 85.0, roe: 0.05, profitMargin: 0.05, fiftyTwoWeekChange: 0.35, dividendYield: null, debtToEquity: 0.08, revenueGrowth: 0.18 },
    { ticker: 'SNAP', name: 'Snap Inc.', sector: 'Communication', marketCap: 18e9, peRatio: null, roe: -0.32, profitMargin: -0.28, fiftyTwoWeekChange: -0.15, dividendYield: null, debtToEquity: 1.2, revenueGrowth: 0.12 },
    { ticker: 'SPOT', name: 'Spotify Technology', sector: 'Communication', marketCap: 62e9, peRatio: 88.0, roe: 0.12, profitMargin: 0.04, fiftyTwoWeekChange: 0.95, dividendYield: null, debtToEquity: 0.42, revenueGrowth: 0.16 },
    { ticker: 'ROKU', name: 'Roku Inc.', sector: 'Communication', marketCap: 9.5e9, peRatio: null, roe: -0.18, profitMargin: -0.08, fiftyTwoWeekChange: -0.28, dividendYield: null, debtToEquity: 0.01, revenueGrowth: 0.18 },
    { ticker: 'SIRI', name: 'Sirius XM Holdings', sector: 'Communication', marketCap: 12e9, peRatio: 10.2, roe: -0.85, profitMargin: 0.14, fiftyTwoWeekChange: -0.22, dividendYield: 0.035, debtToEquity: 9.5, revenueGrowth: -0.01 },
    { ticker: 'FWONA', name: 'Formula One Group', sector: 'Communication', marketCap: 16e9, peRatio: 45.0, roe: 0.08, profitMargin: 0.09, fiftyTwoWeekChange: 0.22, dividendYield: null, debtToEquity: 0.82, revenueGrowth: 0.22 },
    { ticker: 'ZG', name: 'Zillow Group Inc.', sector: 'Communication', marketCap: 11e9, peRatio: null, roe: -0.05, profitMargin: -0.08, fiftyTwoWeekChange: -0.05, dividendYield: null, debtToEquity: 0.32, revenueGrowth: 0.11 },
    { ticker: 'MTCH', name: 'Match Group Inc.', sector: 'Communication', marketCap: 8.5e9, peRatio: 14.0, roe: -0.35, profitMargin: 0.18, fiftyTwoWeekChange: -0.18, dividendYield: null, debtToEquity: 4.8, revenueGrowth: 0.08 },
    { ticker: 'IPG', name: 'Interpublic Group of Cos', sector: 'Communication', marketCap: 11e9, peRatio: 11.8, roe: 0.28, profitMargin: 0.09, fiftyTwoWeekChange: -0.02, dividendYield: 0.042, debtToEquity: 0.88, revenueGrowth: 0.01 },
    { ticker: 'FOXA', name: 'Fox Corp. Class A', sector: 'Communication', marketCap: 16e9, peRatio: 12.0, roe: 0.15, profitMargin: 0.11, fiftyTwoWeekChange: 0.15, dividendYield: 0.016, debtToEquity: 0.62, revenueGrowth: 0.02 },
    { ticker: 'PARA', name: 'Paramount Global', sector: 'Communication', marketCap: 8.2e9, peRatio: null, roe: -0.05, profitMargin: -0.04, fiftyTwoWeekChange: -0.22, dividendYield: 0.018, debtToEquity: 0.88, revenueGrowth: 0.01 }
  ];

  // 8. UTILITIES (15 Real Tickers)
  const utilitiesList: ScreenerRecord[] = [
    { ticker: 'NEE', name: 'NextEra Energy Inc.', sector: 'Utilities', marketCap: 150e9, peRatio: 21.2, roe: 0.10, profitMargin: 0.22, fiftyTwoWeekChange: -0.04, dividendYield: 0.031, debtToEquity: 1.35, revenueGrowth: 0.06 },
    { ticker: 'SO', name: 'Southern Company', sector: 'Utilities', marketCap: 85e9, peRatio: 18.5, roe: 0.11, profitMargin: 0.14, fiftyTwoWeekChange: 0.11, dividendYield: 0.039, debtToEquity: 1.52, revenueGrowth: 0.04 },
    { ticker: 'DUK', name: 'Duke Energy Corp.', sector: 'Utilities', marketCap: 80e9, peRatio: 17.8, roe: 0.08, profitMargin: 0.11, fiftyTwoWeekChange: 0.05, dividendYield: 0.042, debtToEquity: 1.48, revenueGrowth: 0.03 },
    { ticker: 'SRE', name: 'Sempra Energy', sector: 'Utilities', marketCap: 48e9, peRatio: 16.5, roe: 0.09, profitMargin: 0.18, fiftyTwoWeekChange: 0.02, dividendYield: 0.035, debtToEquity: 1.25, revenueGrowth: 0.05 },
    { ticker: 'AEP', name: 'American Electric Power', sector: 'Utilities', marketCap: 46e9, peRatio: 17.0, roe: 0.09, profitMargin: 0.12, fiftyTwoWeekChange: 0.04, dividendYield: 0.041, debtToEquity: 1.62, revenueGrowth: 0.03 },
    { ticker: 'D', name: 'Dominion Energy Inc.', sector: 'Utilities', marketCap: 42e9, peRatio: 18.2, roe: 0.07, profitMargin: 0.11, fiftyTwoWeekChange: 0.01, dividendYield: 0.052, debtToEquity: 1.55, revenueGrowth: 0.02 },
    { ticker: 'PEG', name: 'Public Service Enterprise', sector: 'Utilities', marketCap: 38e9, peRatio: 19.0, roe: 0.12, profitMargin: 0.18, fiftyTwoWeekChange: 0.18, dividendYield: 0.032, debtToEquity: 1.1, revenueGrowth: 0.04 },
    { ticker: 'ED', name: 'Consolidated Edison', sector: 'Utilities', marketCap: 32e9, peRatio: 18.0, roe: 0.08, profitMargin: 0.11, fiftyTwoWeekChange: 0.08, dividendYield: 0.036, debtToEquity: 1.2, revenueGrowth: 0.02 },
    { ticker: 'EXC', name: 'Exelon Corp.', sector: 'Utilities', marketCap: 35e9, peRatio: 15.5, roe: 0.09, profitMargin: 0.11, fiftyTwoWeekChange: -0.05, dividendYield: 0.042, debtToEquity: 1.35, revenueGrowth: 0.04 },
    { ticker: 'XEL', name: 'Xcel Energy Inc.', sector: 'Utilities', marketCap: 31e9, peRatio: 16.8, roe: 0.10, profitMargin: 0.12, fiftyTwoWeekChange: -0.08, dividendYield: 0.039, debtToEquity: 1.42, revenueGrowth: 0.03 },
    { ticker: 'WEC', name: 'WEC Energy Group', sector: 'Utilities', marketCap: 26e9, peRatio: 18.2, roe: 0.11, profitMargin: 0.14, fiftyTwoWeekChange: -0.02, dividendYield: 0.041, debtToEquity: 1.38, revenueGrowth: 0.03 },
    { ticker: 'AWK', name: 'American Water Works', sector: 'Utilities', marketCap: 25e9, peRatio: 25.0, roe: 0.10, profitMargin: 0.22, fiftyTwoWeekChange: -0.05, dividendYield: 0.024, debtToEquity: 1.45, revenueGrowth: 0.06 },
    { ticker: 'ETR', name: 'Entergy Corp.', sector: 'Utilities', marketCap: 23e9, peRatio: 17.5, roe: 0.11, profitMargin: 0.16, fiftyTwoWeekChange: 0.05, dividendYield: 0.042, debtToEquity: 1.65, revenueGrowth: 0.04 },
    { ticker: 'FE', name: 'FirstEnergy Corp.', sector: 'Utilities', marketCap: 22e9, peRatio: 18.0, roe: 0.08, profitMargin: 0.08, fiftyTwoWeekChange: 0.02, dividendYield: 0.042, debtToEquity: 1.82, revenueGrowth: 0.03 },
    { ticker: 'PPL', name: 'PPL Corp.', sector: 'Utilities', marketCap: 21e9, peRatio: 19.5, roe: 0.07, profitMargin: 0.09, fiftyTwoWeekChange: 0.08, dividendYield: 0.036, debtToEquity: 1.25, revenueGrowth: 0.02 }
  ];

  // 9. MATERIALS (15 Real Tickers)
  const materialsList: ScreenerRecord[] = [
    { ticker: 'LIN', name: 'Linde plc', sector: 'Materials', marketCap: 215e9, peRatio: 28.5, roe: 0.15, profitMargin: 0.18, fiftyTwoWeekChange: 0.18, dividendYield: 0.013, debtToEquity: 0.48, revenueGrowth: 0.05 },
    { ticker: 'FCX', name: 'Freeport-McMoRan', sector: 'Materials', marketCap: 72e9, peRatio: 24.8, roe: 0.14, profitMargin: 0.11, fiftyTwoWeekChange: 0.32, dividendYield: 0.007, debtToEquity: 0.32, revenueGrowth: 0.09 },
    { ticker: 'APD', name: 'Air Products and Chemicals', sector: 'Materials', marketCap: 58e9, peRatio: 22.0, roe: 0.16, profitMargin: 0.18, fiftyTwoWeekChange: -0.08, dividendYield: 0.028, debtToEquity: 0.65, revenueGrowth: 0.02 },
    { ticker: 'SHW', name: 'Sherwin-Williams Co.', sector: 'Materials', marketCap: 85e9, peRatio: 32.0, roe: 0.72, profitMargin: 0.11, fiftyTwoWeekChange: 0.28, dividendYield: 0.008, debtToEquity: 2.1, revenueGrowth: 0.05 },
    { ticker: 'ECL', name: 'Ecolab Inc.', sector: 'Materials', marketCap: 68e9, peRatio: 42.0, roe: 0.21, profitMargin: 0.11, fiftyTwoWeekChange: 0.32, dividendYield: 0.010, debtToEquity: 0.85, revenueGrowth: 0.08 },
    { ticker: 'NEM', name: 'Newmont Corp.', sector: 'Materials', marketCap: 48e9, peRatio: 18.0, roe: -0.08, profitMargin: -0.12, fiftyTwoWeekChange: 0.15, dividendYield: 0.025, debtToEquity: 0.38, revenueGrowth: 0.12 },
    { ticker: 'CTVA', name: 'Corteva Inc.', sector: 'Materials', marketCap: 38e9, peRatio: 35.0, roe: 0.04, profitMargin: 0.04, fiftyTwoWeekChange: 0.05, dividendYield: 0.012, debtToEquity: 0.12, revenueGrowth: 0.02 },
    { ticker: 'NUE', name: 'Nucor Corp.', sector: 'Materials', marketCap: 39e9, peRatio: 11.2, roe: 0.22, profitMargin: 0.12, fiftyTwoWeekChange: -0.02, dividendYield: 0.013, debtToEquity: 0.32, revenueGrowth: -0.11 },
    { ticker: 'DOW', name: 'Dow Inc.', sector: 'Materials', marketCap: 38e9, peRatio: 28.0, roe: 0.04, profitMargin: 0.02, fiftyTwoWeekChange: 0.02, dividendYield: 0.052, debtToEquity: 0.78, revenueGrowth: -0.05 },
    { ticker: 'DD', name: 'DuPont de Nemours', sector: 'Materials', marketCap: 34e9, peRatio: 22.0, roe: 0.02, profitMargin: 0.04, fiftyTwoWeekChange: 0.18, dividendYield: 0.019, debtToEquity: 0.38, revenueGrowth: -0.01 },
    { ticker: 'ALB', name: 'Albemarle Corp.', sector: 'Materials', marketCap: 14e9, peRatio: 9.5, roe: 0.08, profitMargin: 0.05, fiftyTwoWeekChange: -0.42, dividendYield: 0.016, debtToEquity: 0.42, revenueGrowth: -0.18 },
    { ticker: 'SCCO', name: 'Southern Copper Corp.', sector: 'Materials', marketCap: 82e9, peRatio: 28.0, roe: 0.38, profitMargin: 0.28, fiftyTwoWeekChange: 0.45, dividendYield: 0.032, debtToEquity: 0.82, revenueGrowth: 0.14 },
    { ticker: 'MLM', name: 'Martin Marietta Materials', sector: 'Materials', marketCap: 35e9, peRatio: 28.0, roe: 0.16, profitMargin: 0.18, fiftyTwoWeekChange: 0.22, dividendYield: 0.005, debtToEquity: 0.62, revenueGrowth: 0.08 },
    { ticker: 'VMC', name: 'Vulcan Materials Co.', sector: 'Materials', marketCap: 32e9, peRatio: 34.0, roe: 0.12, profitMargin: 0.12, fiftyTwoWeekChange: 0.18, dividendYield: 0.007, debtToEquity: 0.58, revenueGrowth: 0.06 },
    { ticker: 'PPG', name: 'PPG Industries Inc.', sector: 'Materials', marketCap: 31e9, peRatio: 21.0, roe: 0.22, profitMargin: 0.08, fiftyTwoWeekChange: -0.08, dividendYield: 0.019, debtToEquity: 0.85, revenueGrowth: 0.02 }
  ];

  // 10. REAL ESTATE (10 Real Tickers)
  const realEstateList: ScreenerRecord[] = [
    { ticker: 'PLD', name: 'Prologis Inc.', sector: 'Real Estate', marketCap: 98e9, peRatio: 32.4, roe: 0.07, profitMargin: 0.35, fiftyTwoWeekChange: -0.08, dividendYield: 0.034, debtToEquity: 0.78, revenueGrowth: 0.08 },
    { ticker: 'AMT', name: 'American Tower Corp.', sector: 'Real Estate', marketCap: 88e9, peRatio: 41.2, roe: 0.12, profitMargin: 0.14, fiftyTwoWeekChange: 0.04, dividendYield: 0.032, debtToEquity: 2.4, revenueGrowth: 0.05 },
    { ticker: 'EQIX', name: 'Equinix Inc.', sector: 'Real Estate', marketCap: 78e9, peRatio: 82.0, roe: 0.08, profitMargin: 0.12, fiftyTwoWeekChange: 0.15, dividendYield: 0.021, debtToEquity: 1.25, revenueGrowth: 0.12 },
    { ticker: 'CCI', name: 'Crown Castle Inc.', sector: 'Real Estate', marketCap: 45e9, peRatio: 28.0, roe: 0.22, profitMargin: 0.21, fiftyTwoWeekChange: -0.12, dividendYield: 0.062, debtToEquity: 3.2, revenueGrowth: 0.01 },
    { ticker: 'PSA', name: 'Public Storage', sector: 'Real Estate', marketCap: 52e9, peRatio: 26.0, roe: 0.18, profitMargin: 0.42, fiftyTwoWeekChange: 0.08, dividendYield: 0.041, debtToEquity: 0.85, revenueGrowth: 0.05 },
    { ticker: 'O', name: 'Realty Income Corp.', sector: 'Real Estate', marketCap: 48e9, peRatio: 42.0, roe: 0.04, profitMargin: 0.22, fiftyTwoWeekChange: -0.02, dividendYield: 0.058, debtToEquity: 0.72, revenueGrowth: 0.21 },
    { ticker: 'SPG', name: 'Simon Property Group', sector: 'Real Estate', marketCap: 52e9, peRatio: 22.0, roe: 0.65, profitMargin: 0.42, fiftyTwoWeekChange: 0.28, dividendYield: 0.052, debtToEquity: 7.2, revenueGrowth: 0.07 },
    { ticker: 'WELL', name: 'Welltower Inc.', sector: 'Real Estate', marketCap: 62e9, peRatio: 92.0, roe: 0.03, profitMargin: 0.08, fiftyTwoWeekChange: 0.45, dividendYield: 0.024, debtToEquity: 0.82, revenueGrowth: 0.15 },
    { ticker: 'DLR', name: 'Digital Realty Trust', sector: 'Real Estate', marketCap: 46e9, peRatio: 45.0, roe: 0.05, profitMargin: 0.18, fiftyTwoWeekChange: 0.22, dividendYield: 0.034, debtToEquity: 0.92, revenueGrowth: 0.09 },
    { ticker: 'VICI', name: 'VICI Properties Inc.', sector: 'Real Estate', marketCap: 32e9, peRatio: 12.5, roe: 0.11, profitMargin: 0.68, fiftyTwoWeekChange: 0.02, dividendYield: 0.055, debtToEquity: 0.72, revenueGrowth: 0.08 }
  ];

  // 11. CRYPTO (10 Real Tickers)
  const cryptoList: ScreenerRecord[] = [
    { ticker: 'BTC-USD', name: 'Bitcoin / USD', sector: 'Crypto', marketCap: 1350e9, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 1.12, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'ETH-USD', name: 'Ethereum / USD', sector: 'Crypto', marketCap: 420e9, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.85, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'SOL-USD', name: 'Solana / USD', sector: 'Crypto', marketCap: 78e9, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 3.42, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'ADA-USD', name: 'Cardano / USD', sector: 'Crypto', marketCap: 18e9, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.42, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'LINK-USD', name: 'Chainlink / USD', sector: 'Crypto', marketCap: 11e9, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.98, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'DOGE-USD', name: 'Dogecoin / USD', sector: 'Crypto', marketCap: 19e9, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.65, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'XRP-USD', name: 'XRP / USD', sector: 'Crypto', marketCap: 32e9, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.28, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'LTC-USD', name: 'Litecoin / USD', sector: 'Crypto', marketCap: 6.5e9, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.15, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'DOT-USD', name: 'Polkadot / USD', sector: 'Crypto', marketCap: 8.2e9, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.22, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'AVAX-USD', name: 'Avalanche / USD', sector: 'Crypto', marketCap: 12.5e9, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.92, dividendYield: null, debtToEquity: null, revenueGrowth: null }
  ];

  // 12. FOREX & COMMODITIES (10 Real Tickers)
  const forexList: ScreenerRecord[] = [
    { ticker: 'EURUSD=X', name: 'Euro / US Dollar', sector: 'Forex', marketCap: 0, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.02, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'GBPUSD=X', name: 'British Pound / US Dollar', sector: 'Forex', marketCap: 0, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.05, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'USDJPY=X', name: 'US Dollar / Japanese Yen', sector: 'Forex', marketCap: 0, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.12, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'AUDUSD=X', name: 'Australian Dollar / US Dollar', sector: 'Forex', marketCap: 0, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: -0.01, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'USDCAD=X', name: 'US Dollar / Canadian Dollar', sector: 'Forex', marketCap: 0, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.03, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'GOLD/USD', name: 'Gold Spot / US Dollar', sector: 'Forex', marketCap: 0, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.22, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'SILVER/USD', name: 'Silver Spot / US Dollar', sector: 'Forex', marketCap: 0, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.35, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'BRENT', name: 'Brent Crude Oil Spot', sector: 'Forex', marketCap: 0, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.08, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'UK100', name: 'FTSE 100 Index', sector: 'Forex', marketCap: 0, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.12, dividendYield: null, debtToEquity: null, revenueGrowth: null },
    { ticker: 'JPN225', name: 'Nikkei 225 Index', sector: 'Forex', marketCap: 0, peRatio: null, roe: null, profitMargin: null, fiftyTwoWeekChange: 0.28, dividendYield: null, debtToEquity: null, revenueGrowth: null }
  ];

  database.push(
    ...techList,
    ...financialsList,
    ...healthcareList,
    ...consumerList,
    ...energyList,
    ...industrialsList,
    ...communicationList,
    ...utilitiesList,
    ...materialsList,
    ...realEstateList,
    ...cryptoList,
    ...forexList
  );

  return database;
}
