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
  fiftyTwoWeekChange: number; // Momentum!
  dividendYield: number | null;
  debtToEquity: number | null;
  revenueGrowth: number | null;
}

// Generate a deterministic high-fidelity database of 250+ global financial assets
export function generateScreenerDatabase(): ScreenerRecord[] {
  const database: ScreenerRecord[] = [];

  const sectors = [
    { name: 'Technology', count: 40 },
    { name: 'Financials', count: 35 },
    { name: 'Healthcare', count: 35 },
    { name: 'Consumer', count: 35 },
    { name: 'Energy', count: 25 },
    { name: 'Industrials', count: 25 },
    { name: 'Communication', count: 20 },
    { name: 'Utilities', count: 15 },
    { name: 'Materials', count: 10 },
    { name: 'Real Estate', count: 10 },
    { name: 'Crypto', count: 10 },
    { name: 'Forex', count: 10 }
  ] as const;

  const baseTech = [
    { ticker: 'AAPL', name: 'Apple Inc.', cap: 3250e9, pe: 29.5, roe: 1.45, pm: 0.26, mom: 0.18, div: 0.005, debt: 1.4, revG: 0.08 },
    { ticker: 'MSFT', name: 'Microsoft Corp.', cap: 3180e9, pe: 35.2, roe: 0.38, pm: 0.34, mom: 0.24, div: 0.007, debt: 0.45, revG: 0.12 },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', cap: 2950e9, pe: 68.4, roe: 1.15, pm: 0.53, mom: 1.85, div: 0.0002, debt: 0.18, revG: 1.25 },
    { ticker: 'AVGO', name: 'Broadcom Inc.', cap: 640e9, pe: 42.1, roe: 0.22, pm: 0.21, mom: 0.55, div: 0.012, debt: 1.1, revG: 0.15 },
    { ticker: 'ORCL', name: 'Oracle Corp.', cap: 380e9, pe: 31.8, roe: 0.48, pm: 0.20, mom: 0.42, div: 0.009, debt: 3.2, revG: 0.09 },
    { ticker: 'AMD', name: 'Advanced Micro Devices', cap: 270e9, pe: 75.0, roe: 0.06, pm: 0.08, mom: 0.28, div: null, debt: 0.08, revG: 0.11 },
    { ticker: 'CRM', name: 'Salesforce Inc.', cap: 290e9, pe: 28.4, roe: 0.12, pm: 0.15, mom: 0.19, div: 0.005, debt: 0.15, revG: 0.11 },
    { ticker: 'ADBE', name: 'Adobe Inc.', cap: 240e9, pe: 32.5, roe: 0.34, pm: 0.25, mom: 0.11, div: null, debt: 0.22, revG: 0.10 },
    { ticker: 'QCOM', name: 'Qualcomm Inc.', cap: 195e9, pe: 16.2, roe: 0.42, pm: 0.22, mom: 0.22, div: 0.019, debt: 0.65, revG: 0.07 },
    { ticker: 'CSCO', name: 'Cisco Systems Inc.', cap: 210e9, pe: 15.5, roe: 0.28, pm: 0.21, mom: 0.05, div: 0.031, debt: 0.52, revG: 0.03 }
  ];

  const baseFinancials = [
    { ticker: 'JPM', name: 'JPMorgan Chase & Co.', cap: 580e9, pe: 11.8, roe: 0.17, pm: 0.28, mom: 0.29, div: 0.024, debt: 1.25, revG: 0.08 },
    { ticker: 'BAC', name: 'Bank of America Corp.', cap: 310e9, pe: 12.5, roe: 0.11, pm: 0.22, mom: 0.15, div: 0.027, debt: 1.55, revG: 0.04 },
    { ticker: 'MS', name: 'Morgan Stanley', cap: 165e9, pe: 14.8, roe: 0.12, pm: 0.18, mom: 0.18, div: 0.032, debt: 2.1, revG: 0.06 },
    { ticker: 'GS', name: 'Goldman Sachs Group', cap: 155e9, pe: 13.2, roe: 0.10, pm: 0.19, mom: 0.25, div: 0.025, debt: 2.5, revG: 0.09 },
    { ticker: 'WFC', name: 'Wells Fargo & Co.', cap: 205e9, pe: 11.2, roe: 0.11, pm: 0.21, mom: 0.32, div: 0.023, debt: 1.4, revG: 0.05 },
    { ticker: 'V', name: 'Visa Inc.', cap: 540e9, pe: 31.4, roe: 0.46, pm: 0.51, mom: 0.14, div: 0.008, debt: 0.42, revG: 0.09 },
    { ticker: 'MA', name: 'Mastercard Inc.', cap: 430e9, pe: 34.8, roe: 1.05, pm: 0.45, mom: 0.16, div: 0.006, debt: 0.85, revG: 0.11 },
    { ticker: 'BLK', name: 'BlackRock Inc.', cap: 135e9, pe: 21.5, roe: 0.14, pm: 0.30, mom: 0.22, div: 0.026, debt: 0.38, revG: 0.07 }
  ];

  const baseHealthcare = [
    { ticker: 'LLY', name: 'Eli Lilly & Co.', cap: 820e9, pe: 115.0, roe: 0.48, pm: 0.18, mom: 0.85, div: 0.006, debt: 0.95, revG: 0.28 },
    { ticker: 'UNH', name: 'UnitedHealth Group Inc.', cap: 480e9, pe: 19.5, roe: 0.24, pm: 0.06, mom: 0.04, div: 0.016, debt: 0.68, revG: 0.14 },
    { ticker: 'JNJ', name: 'Johnson & Johnson', cap: 380e9, pe: 15.2, roe: 0.21, pm: 0.17, mom: -0.06, div: 0.029, debt: 0.44, revG: 0.05 },
    { ticker: 'ABBV', name: 'AbbVie Inc.', cap: 315e9, pe: 22.8, roe: 0.38, pm: 0.15, mom: 0.22, div: 0.036, debt: 2.8, revG: 0.04 },
    { ticker: 'MRK', name: 'Merck & Co. Inc.', cap: 295e9, pe: 16.4, roe: 0.15, pm: 0.12, mom: 0.12, div: 0.027, debt: 0.72, revG: 0.06 },
    { ticker: 'PFE', name: 'Pfizer Inc.', cap: 160e9, pe: 14.5, roe: 0.08, pm: 0.09, mom: -0.18, div: 0.058, debt: 0.82, revG: -0.12 }
  ];

  const baseConsumer = [
    { ticker: 'AMZN', name: 'Amazon.com Inc.', cap: 1950e9, pe: 41.5, roe: 0.21, pm: 0.06, mom: 0.32, div: null, debt: 0.35, revG: 0.13 },
    { ticker: 'TSLA', name: 'Tesla Inc.', cap: 620e9, pe: 54.2, roe: 0.18, pm: 0.09, mom: -0.12, div: null, debt: 0.08, revG: 0.08 },
    { ticker: 'HD', name: 'Home Depot Inc.', cap: 360e9, pe: 23.4, roe: 1.22, pm: 0.10, mom: 0.08, div: 0.024, debt: 2.1, revG: 0.02 },
    { ticker: 'MCD', name: 'McDonalds Corp.', cap: 210e9, pe: 24.1, roe: 0.85, pm: 0.33, mom: 0.05, div: 0.025, debt: 4.5, revG: 0.04 },
    { ticker: 'NKE', name: 'Nike Inc.', cap: 140e9, pe: 26.5, roe: 0.35, pm: 0.11, mom: -0.14, div: 0.016, debt: 0.48, revG: 0.02 },
    { ticker: 'COST', name: 'Costco Wholesale Corp.', cap: 385e9, pe: 48.2, roe: 0.28, pm: 0.03, mom: 0.44, div: 0.005, debt: 0.12, revG: 0.08 }
  ];

  const baseEnergy = [
    { ticker: 'XOM', name: 'Exxon Mobil Corp.', cap: 475e9, pe: 12.4, roe: 0.19, pm: 0.11, mom: 0.12, div: 0.034, debt: 0.18, revG: 0.04 },
    { ticker: 'CVX', name: 'Chevron Corp.', cap: 295e9, pe: 13.1, roe: 0.15, pm: 0.10, mom: 0.06, div: 0.041, debt: 0.22, revG: 0.03 },
    { ticker: 'COP', name: 'ConocoPhillips', cap: 140e9, pe: 11.5, roe: 0.18, pm: 0.14, mom: 0.15, div: 0.028, debt: 0.35, revG: 0.05 },
    { ticker: 'SLB', name: 'Schlumberger N.V.', cap: 68e9, pe: 14.2, roe: 0.21, pm: 0.13, mom: 0.09, div: 0.022, debt: 0.58, revG: 0.08 }
  ];

  const baseIndustrials = [
    { ticker: 'GE', name: 'General Electric Co.', cap: 185e9, pe: 22.4, roe: 0.16, pm: 0.09, mom: 0.72, div: 0.006, debt: 0.62, revG: 0.11 },
    { ticker: 'CAT', name: 'Caterpillar Inc.', cap: 175e9, pe: 15.2, roe: 0.52, pm: 0.15, mom: 0.38, div: 0.017, debt: 1.85, revG: 0.07 },
    { ticker: 'HON', name: 'Honeywell International', cap: 130e9, pe: 21.1, roe: 0.28, pm: 0.16, mom: 0.08, div: 0.021, debt: 0.92, revG: 0.05 },
    { ticker: 'LMT', name: 'Lockheed Martin Corp.', cap: 115e9, pe: 16.8, roe: 0.65, pm: 0.10, mom: 0.14, div: 0.028, debt: 1.45, revG: 0.03 }
  ];

  const baseCommunication = [
    { ticker: 'GOOG', name: 'Alphabet Inc.', cap: 2180e9, pe: 25.4, roe: 0.27, pm: 0.24, mom: 0.36, div: 0.004, debt: 0.09, revG: 0.14 },
    { ticker: 'META', name: 'Meta Platforms Inc.', cap: 1240e9, pe: 28.1, roe: 0.31, pm: 0.32, mom: 0.78, div: 0.004, debt: 0.07, revG: 0.22 },
    { ticker: 'NFLX', name: 'Netflix Inc.', cap: 285e9, pe: 38.2, roe: 0.29, pm: 0.18, mom: 0.48, div: null, debt: 0.68, revG: 0.15 },
    { ticker: 'DIS', name: 'Walt Disney Co.', cap: 180e9, pe: 24.5, roe: 0.05, pm: 0.04, mom: 0.12, div: 0.007, debt: 0.42, revG: 0.05 }
  ];

  const baseUtilities = [
    { ticker: 'NEE', name: 'NextEra Energy Inc.', cap: 150e9, pe: 21.2, roe: 0.10, pm: 0.22, mom: -0.04, div: 0.031, debt: 1.35, revG: 0.06 },
    { ticker: 'SO', name: 'Southern Company', cap: 85e9, pe: 18.5, roe: 0.11, pm: 0.14, mom: 0.11, div: 0.039, debt: 1.52, revG: 0.04 },
    { ticker: 'DUK', name: 'Duke Energy Corp.', cap: 80e9, pe: 17.8, roe: 0.08, pm: 0.11, mom: 0.05, div: 0.042, debt: 1.48, revG: 0.03 }
  ];

  const baseMaterials = [
    { ticker: 'LIN', name: 'Linde plc', cap: 215e9, pe: 28.5, roe: 0.15, pm: 0.18, mom: 0.18, div: 0.013, debt: 0.48, revG: 0.05 },
    { ticker: 'FCX', name: 'Freeport-McMoRan', cap: 72e9, pe: 24.8, roe: 0.14, pm: 0.11, mom: 0.32, div: 0.007, debt: 0.32, revG: 0.09 }
  ];

  const baseRealEstate = [
    { ticker: 'PLD', name: 'Prologis Inc.', cap: 98e9, pe: 32.4, roe: 0.07, pm: 0.35, mom: -0.08, div: 0.034, debt: 0.78, revG: 0.08 },
    { ticker: 'AMT', name: 'American Tower Corp.', cap: 88e9, pe: 41.2, roe: 0.12, pm: 0.14, mom: 0.04, div: 0.032, debt: 2.4, revG: 0.05 }
  ];

  const baseCrypto = [
    { ticker: 'BTC-USD', name: 'Bitcoin / USD', cap: 1350e9, pe: null, roe: null, pm: null, mom: 1.12, div: null, debt: null, revG: null },
    { ticker: 'ETH-USD', name: 'Ethereum / USD', cap: 420e9, pe: null, roe: null, pm: null, mom: 0.85, div: null, debt: null, revG: null },
    { ticker: 'SOL-USD', name: 'Solana / USD', cap: 78e9, pe: null, roe: null, pm: null, mom: 3.42, div: null, debt: null, revG: null },
    { ticker: 'ADA-USD', name: 'Cardano / USD', cap: 18e9, pe: null, roe: null, pm: null, mom: 0.42, div: null, debt: null, revG: null },
    { ticker: 'LINK-USD', name: 'Chainlink / USD', cap: 11e9, pe: null, roe: null, pm: null, mom: 0.98, div: null, debt: null, revG: null }
  ];

  const baseForex = [
    { ticker: 'EURUSD=X', name: 'Euro / US Dollar', cap: 0, pe: null, roe: null, pm: null, mom: 0.02, div: null, debt: null, revG: null },
    { ticker: 'GBPUSD=X', name: 'British Pound / US Dollar', cap: 0, pe: null, roe: null, pm: null, mom: 0.05, div: null, debt: null, revG: null },
    { ticker: 'USDJPY=X', name: 'US Dollar / Japanese Yen', cap: 0, pe: null, roe: null, pm: null, mom: 0.12, div: null, debt: null, revG: null },
    { ticker: 'AUDUSD=X', name: 'Australian Dollar / US Dollar', cap: 0, pe: null, roe: null, pm: null, mom: -0.01, div: null, debt: null, revG: null },
    { ticker: 'USDCAD=X', name: 'US Dollar / Canadian Dollar', cap: 0, pe: null, roe: null, pm: null, mom: 0.03, div: null, debt: null, revG: null }
  ];

  // Helper to generate a realistic entity dynamically
  const addSectorFillers = (
    sectorName: ScreenerRecord['sector'],
    baseList: Array<any>,
    targetCount: number,
    peRange: [number, number],
    roeRange: [number, number],
    pmRange: [number, number],
    momRange: [number, number],
    divRange: [number, number] | null,
    debtRange: [number, number] | null
  ) => {
    // Add existing base list first
    baseList.forEach(item => {
      database.push({
        ticker: item.ticker,
        name: item.name,
        sector: sectorName,
        marketCap: item.cap,
        peRatio: item.pe,
        roe: item.roe,
        profitMargin: item.pm,
        fiftyTwoWeekChange: item.mom,
        dividendYield: item.div,
        debtToEquity: item.debt,
        revenueGrowth: item.revG
      });
    });

    // Fill up to target count
    const symbols = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ];

    let seed = sectorName.charCodeAt(0) + sectorName.charCodeAt(1);
    const pseudorand = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const countToCreate = targetCount - baseList.length;
    for (let i = 0; i < countToCreate; i++) {
      const tickerLength = pseudorand() > 0.4 ? 4 : 3;
      let tickerStr = '';
      for (let j = 0; j < tickerLength; j++) {
        tickerStr += symbols[Math.floor(pseudorand() * symbols.length)];
      }

      // Ensure unique ticker
      if (database.some(d => d.ticker === tickerStr)) {
        tickerStr += symbols[i % symbols.length];
      }

      const pRand = pseudorand();
      const pe = peRange[0] + pRand * (peRange[1] - peRange[0]);
      const roe = roeRange[0] + pRand * (roeRange[1] - roeRange[0]);
      const pm = pmRange[0] + pRand * (pmRange[1] - pmRange[0]);
      const mom = momRange[0] + pseudorand() * (momRange[1] - momRange[0]);
      const cap = (10 + Math.floor(pseudorand() * 120)) * 1e9; // $10B - $130B
      const div = divRange ? divRange[0] + pseudorand() * (divRange[1] - divRange[0]) : null;
      const debt = debtRange ? debtRange[0] + pseudorand() * (debtRange[1] - debtRange[0]) : null;
      const revG = 0.01 + pseudorand() * 0.18;

      database.push({
        ticker: tickerStr,
        name: `${tickerStr} Corp.`,
        sector: sectorName,
        marketCap: cap,
        peRatio: Number(pe.toFixed(1)),
        roe: Number(roe.toFixed(3)),
        profitMargin: Number(pm.toFixed(3)),
        fiftyTwoWeekChange: Number(mom.toFixed(3)),
        dividendYield: div ? Number(div.toFixed(4)) : null,
        debtToEquity: debt ? Number(debt.toFixed(2)) : null,
        revenueGrowth: Number(revG.toFixed(3))
      });
    }
  };

  // Run generation for all categories to construct 250+ rows
  addSectorFillers('Technology', baseTech, 40, [18, 55], [0.12, 0.45], [0.10, 0.28], [-0.15, 0.65], [0.002, 0.018], [0.1, 1.8]);
  addSectorFillers('Financials', baseFinancials, 35, [8, 18], [0.08, 0.16], [0.12, 0.32], [-0.10, 0.40], [0.018, 0.045], [0.8, 3.2]);
  addSectorFillers('Healthcare', baseHealthcare, 35, [14, 45], [0.10, 0.32], [0.06, 0.22], [-0.20, 0.50], [0.005, 0.035], [0.2, 1.5]);
  addSectorFillers('Consumer', baseConsumer, 35, [15, 38], [0.14, 0.60], [0.03, 0.16], [-0.25, 0.45], [0.005, 0.030], [0.1, 2.5]);
  addSectorFillers('Energy', baseEnergy, 25, [6, 15], [0.10, 0.24], [0.08, 0.18], [-0.15, 0.25], [0.020, 0.060], [0.1, 0.8]);
  addSectorFillers('Industrials', baseIndustrials, 25, [12, 28], [0.12, 0.40], [0.05, 0.14], [-0.10, 0.55], [0.008, 0.028], [0.4, 2.0]);
  addSectorFillers('Communication', baseCommunication, 20, [15, 35], [0.10, 0.30], [0.08, 0.25], [-0.20, 0.80], [0.002, 0.015], [0.05, 1.2]);
  addSectorFillers('Utilities', baseUtilities, 15, [14, 22], [0.06, 0.12], [0.08, 0.15], [-0.08, 0.18], [0.030, 0.055], [1.0, 2.2]);
  addSectorFillers('Materials', baseMaterials, 15, [12, 25], [0.08, 0.18], [0.06, 0.15], [-0.10, 0.40], [0.010, 0.035], [0.2, 1.0]);
  addSectorFillers('Real Estate', baseRealEstate, 15, [20, 45], [0.04, 0.12], [0.10, 0.40], [-0.20, 0.15], [0.030, 0.065], [0.5, 2.8]);

  // Crypto fillers (No PE, ROE, margins, dividend, debt)
  baseCrypto.forEach(item => {
    database.push({
      ticker: item.ticker,
      name: item.name,
      sector: 'Crypto',
      marketCap: item.cap,
      peRatio: null,
      roe: null,
      profitMargin: null,
      fiftyTwoWeekChange: item.mom,
      dividendYield: null,
      debtToEquity: null,
      revenueGrowth: null
    });
  });
  const cryptoAssets = ['DOGE-USD', 'XRP-USD', 'LTC-USD', 'DOT-USD', 'AVAX-USD', 'SHIB-USD', 'NEAR-USD', 'UNI-USD', 'ICP-USD', 'XLM-USD'];
  let cryptoSeed = 42;
  cryptoAssets.forEach((cSym, idx) => {
    const mom = -0.3 + (Math.sin(cryptoSeed++) * 1.5);
    const cap = (2 + (cryptoSeed % 12)) * 1e9;
    database.push({
      ticker: cSym,
      name: `${cSym.split('-')[0]} Crypto Token`,
      sector: 'Crypto',
      marketCap: cap,
      peRatio: null,
      roe: null,
      profitMargin: null,
      fiftyTwoWeekChange: Number(mom.toFixed(3)),
      dividendYield: null,
      debtToEquity: null,
      revenueGrowth: null
    });
  });

  // Forex fillers
  baseForex.forEach(item => {
    database.push({
      ticker: item.ticker,
      name: item.name,
      sector: 'Forex',
      marketCap: 0,
      peRatio: null,
      roe: null,
      profitMargin: null,
      fiftyTwoWeekChange: item.mom,
      dividendYield: null,
      debtToEquity: null,
      revenueGrowth: null
    });
  });
  const forexAssets = ['NZDUSD=X', 'EURGBP=X', 'EURJPY=X', 'GBPJPY=X', 'AUDJPY=X', 'CHFJPY=X', 'EURCAD=X', 'GBPCAD=X', 'AUDCAD=X', 'EURAUD=X'];
  let fxSeed = 99;
  forexAssets.forEach((fxSym, idx) => {
    const mom = -0.05 + (Math.sin(fxSeed++) * 0.15);
    database.push({
      ticker: fxSym,
      name: `${fxSym.substring(0, 3)} / ${fxSym.substring(3, 6)} Currency Pair`,
      sector: 'Forex',
      marketCap: 0,
      peRatio: null,
      roe: null,
      profitMargin: null,
      fiftyTwoWeekChange: Number(mom.toFixed(3)),
      dividendYield: null,
      debtToEquity: null,
      revenueGrowth: null
    });
  });

  return database;
}
