import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Calculator, 
  Sliders, 
  DollarSign, 
  TrendingDown, 
  Info, 
  Percent, 
  ShieldAlert, 
  Scale, 
  HelpCircle,
  TrendingUp as ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

interface TickerPreset {
  ticker: string;
  name: string;
  currentPrice: number;
  revenue: number; // in Billions USD
  fcf: number; // in Billions USD
  sharesOutstanding: number; // in Billions
  cash: number; // in Billions
  debt: number; // in Billions
  defaultGrowth: number; // %
  defaultMargin: number; // %
  defaultWacc: number; // %
  defaultTerminalMultiple: number; // x
}

const TICKER_PRESETS: Record<string, TickerPreset> = {
  AAPL: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 188.30,
    revenue: 385.7,
    fcf: 99.5,
    sharesOutstanding: 15.4,
    cash: 162.0,
    debt: 111.0,
    defaultGrowth: 8.0,
    defaultMargin: 26.0,
    defaultWacc: 8.5,
    defaultTerminalMultiple: 25,
  },
  MSFT: {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    currentPrice: 420.50,
    revenue: 245.1,
    fcf: 70.6,
    sharesOutstanding: 7.43,
    cash: 80.0,
    debt: 72.0,
    defaultGrowth: 12.0,
    defaultMargin: 43.0,
    defaultWacc: 9.0,
    defaultTerminalMultiple: 28,
  },
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    currentPrice: 850.00,
    revenue: 96.3,
    fcf: 39.0,
    sharesOutstanding: 2.46,
    cash: 26.0,
    debt: 9.7,
    defaultGrowth: 28.0,
    defaultMargin: 52.0,
    defaultWacc: 10.5,
    defaultTerminalMultiple: 35,
  },
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    currentPrice: 178.50,
    revenue: 96.8,
    fcf: 4.4,
    sharesOutstanding: 3.19,
    cash: 29.0,
    debt: 5.0,
    defaultGrowth: 18.0,
    defaultMargin: 12.0,
    defaultWacc: 11.0,
    defaultTerminalMultiple: 30,
  }
};

export default function DcfValuationSandbox() {
  const [selectedTicker, setSelectedTicker] = useState<'AAPL' | 'MSFT' | 'NVDA' | 'TSLA'>('AAPL');
  const preset = TICKER_PRESETS[selectedTicker];

  // Sliders/User Inputs
  const [growthRate, setGrowthRate] = useState<number>(preset.defaultGrowth);
  const [operatingMargin, setOperatingMargin] = useState<number>(preset.defaultMargin);
  const [wacc, setWacc] = useState<number>(preset.defaultWacc);
  const [terminalMultiple, setTerminalMultiple] = useState<number>(preset.defaultTerminalMultiple);
  const [taxRate, setTaxRate] = useState<number>(21); // % Standard Corporate Tax Rate

  // Reset parameters when preset changes
  const handlePresetChange = (ticker: 'AAPL' | 'MSFT' | 'NVDA' | 'TSLA') => {
    setSelectedTicker(ticker);
    const p = TICKER_PRESETS[ticker];
    setGrowthRate(p.defaultGrowth);
    setOperatingMargin(p.defaultMargin);
    setWacc(p.defaultWacc);
    setTerminalMultiple(p.defaultTerminalMultiple);
  };

  // Perform DCF mathematical modeling
  const dcfResults = useMemo(() => {
    const fcfBase = preset.fcf;
    const projectedFcfs: { year: number; revenue: number; fcf: number; pv: number }[] = [];
    
    let currentRev = preset.revenue;
    let cumulatedPv = 0;

    for (let i = 1; i <= 5; i++) {
      currentRev = currentRev * (1 + growthRate / 100);
      // FCF is approximated based on revenue, operating margin, tax rate and capital expenditure offsets
      // Let's model a realistic standard conversion factor of operating profits to Free Cash Flow
      const operatingProfit = currentRev * (operatingMargin / 100);
      const afterTaxProfit = operatingProfit * (1 - taxRate / 100);
      // Assume reinvestment/depreciation adjustment results in FCF of roughly after-tax profit + depreciation buffer
      const yearFcf = Math.max(0.1, afterTaxProfit * 0.9); 
      
      const discountFactor = Math.pow(1 + wacc / 100, i);
      const pv = yearFcf / discountFactor;
      
      projectedFcfs.push({
        year: i,
        revenue: Number(currentRev.toFixed(1)),
        fcf: Number(yearFcf.toFixed(1)),
        pv: Number(pv.toFixed(1))
      });
      cumulatedPv += pv;
    }

    // Terminal Value
    const lastYearFcf = projectedFcfs[4].fcf;
    const terminalValue = lastYearFcf * terminalMultiple;
    const pvOfTerminalValue = terminalValue / Math.pow(1 + wacc / 100, 5);

    // Enterprise Value
    const enterpriseValue = cumulatedPv + pvOfTerminalValue;

    // Equity Value
    const equityValue = enterpriseValue + preset.cash - preset.debt;

    // Intrinsic Value per share
    const intrinsicValue = equityValue / preset.sharesOutstanding;

    // Margin of Safety or Overvaluation Pct
    const currentPrice = preset.currentPrice;
    const marginOfSafety = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;

    return {
      projectedFcfs,
      cumulatedPv,
      terminalValue,
      pvOfTerminalValue,
      enterpriseValue,
      equityValue,
      intrinsicValue,
      marginOfSafety
    };
  }, [selectedTicker, growthRate, operatingMargin, wacc, terminalMultiple, taxRate, preset]);

  // Generate sensitivity matrix: WACC (columns) vs Multiple (rows)
  const sensitivityData = useMemo(() => {
    const waccSteps = [wacc - 2, wacc - 1, wacc, wacc + 1, wacc + 2];
    const multipleSteps = [terminalMultiple - 6, terminalMultiple - 3, terminalMultiple, terminalMultiple + 3, terminalMultiple + 6];

    return multipleSteps.map((m) => {
      const row: any = { multiple: m };
      waccSteps.forEach((w) => {
        let currentRev = preset.revenue;
        let cumPv = 0;
        let finalYearFcf = 0;

        for (let i = 1; i <= 5; i++) {
          currentRev = currentRev * (1 + growthRate / 100);
          const operatingProfit = currentRev * (operatingMargin / 100);
          const afterTaxProfit = operatingProfit * (1 - taxRate / 100);
          const yearFcf = Math.max(0.1, afterTaxProfit * 0.9);
          cumPv += yearFcf / Math.pow(1 + w / 100, i);
          if (i === 5) finalYearFcf = yearFcf;
        }

        const tVal = finalYearFcf * m;
        const pvOfTVal = tVal / Math.pow(1 + w / 100, 5);
        const entValue = cumPv + pvOfTVal;
        const eqValue = entValue + preset.cash - preset.debt;
        const valPerShare = eqValue / preset.sharesOutstanding;
        
        row[`wacc_${w.toFixed(1)}`] = Number(valPerShare.toFixed(2));
      });
      return row;
    });
  }, [preset, growthRate, operatingMargin, wacc, terminalMultiple, taxRate]);

  const valuationStatus = dcfResults.intrinsicValue > preset.currentPrice 
    ? { text: 'UNDERVALUED', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', desc: 'Intrinsic value exceeds market price. Sizable Margin of Safety present.' }
    : { text: 'OVERVALUED', color: 'text-rose-400 bg-rose-500/10 border-rose-500/25', desc: 'Market price is premium to calculated intrinsic model. Restrict exposure setups.' };

  return (
    <div id="dcf-valuation-sandbox-root" className="bg-[#08080a] border border-white/10 rounded-lg p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-md border border-indigo-500/25 text-indigo-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-sm md:text-base uppercase tracking-wider font-mono">Equity Valuation Sandbox (DCF)</h4>
            <p className="text-xs text-white/40 mt-0.5">Adjust growth, margin & hurdle parameters to model intrinsic value per share</p>
          </div>
        </div>

        {/* Ticker Selector */}
        <div className="flex items-center bg-black/40 border border-white/5 rounded-lg p-0.5 gap-1">
          {(Object.keys(TICKER_PRESETS) as ('AAPL' | 'MSFT' | 'NVDA' | 'TSLA')[]).map((tickerKey) => {
            const isActive = selectedTicker === tickerKey;
            return (
              <button
                key={tickerKey}
                onClick={() => handlePresetChange(tickerKey)}
                className={`px-3 py-1 text-[10.5px] font-mono font-black uppercase rounded transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-black shadow-[0_0_8px_rgba(99,102,241,0.1)]'
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                }`}
              >
                {tickerKey}
              </button>
            );
          })}
        </div>
      </div>

      {/* THREE PANEL GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* PANEL 1: CONFIGURATION SLIDERS (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-[#0a0a0d] border border-white/5 rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-mono">Model Parameters</span>
          </div>

          {/* Revenue Growth Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-white/45 uppercase">Revenue Growth (1-5 Yr):</span>
              <span className="text-indigo-300 font-bold">{growthRate}%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="50" 
              step="0.5"
              value={growthRate}
              onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-white/5 rounded-lg appearance-none"
            />
            <span className="text-[9px] text-white/20 block">Estimates long-term corporate top-line compound expansion rate.</span>
          </div>

          {/* Operating Margin Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-white/45 uppercase">Target Operating Margin:</span>
              <span className="text-indigo-300 font-bold">{operatingMargin}%</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="65" 
              step="0.5"
              value={operatingMargin}
              onChange={(e) => setOperatingMargin(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-white/5 rounded-lg appearance-none"
            />
            <span className="text-[9px] text-white/20 block">Operating profits convertibility directly impacts ultimate FCF flows.</span>
          </div>

          {/* WACC Discount Rate Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-white/45 uppercase">Discount Rate (WACC):</span>
              <span className="text-indigo-300 font-bold">{wacc}%</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="20" 
              step="0.25"
              value={wacc}
              onChange={(e) => setWacc(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-white/5 rounded-lg appearance-none"
            />
            <span className="text-[9px] text-white/20 block">Cost of Capital hurdle rate representing risks of systemic index volatility.</span>
          </div>

          {/* Terminal multiple slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-white/45 uppercase">Terminal FCF Multiple:</span>
              <span className="text-indigo-300 font-bold">{terminalMultiple}x</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="55" 
              step="1"
              value={terminalMultiple}
              onChange={(e) => setTerminalMultiple(parseInt(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-white/5 rounded-lg appearance-none"
            />
            <span className="text-[9px] text-white/20 block">Exit multiplier applied to Year 5 FCF to quantify terminal value.</span>
          </div>

          {/* Base Specs Block */}
          <div className="pt-3 border-t border-white/5 space-y-2 text-[10.5px] font-mono text-white/45">
            <div className="flex justify-between">
              <span>Shares Outstanding:</span>
              <span className="text-white/80">{preset.sharesOutstanding}B</span>
            </div>
            <div className="flex justify-between">
              <span>Base Year Revenue:</span>
              <span className="text-white/80">${preset.revenue}B</span>
            </div>
            <div className="flex justify-between">
              <span>Net Cash / (Debt):</span>
              <span className={`font-bold ${preset.cash >= preset.debt ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${(preset.cash - preset.debt).toFixed(1)}B
              </span>
            </div>
            <button 
              onClick={() => {
                setGrowthRate(preset.defaultGrowth);
                setOperatingMargin(preset.defaultMargin);
                setWacc(preset.defaultWacc);
                setTerminalMultiple(preset.defaultTerminalMultiple);
              }}
              className="w-full mt-2 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/5 rounded text-[9.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>RESET PRESET BASELINES</span>
            </button>
          </div>
        </div>

        {/* PANEL 2: DETAILED OUTCOMES & VALUATION COMPASS (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          
          {/* Main Valuation Summary Card */}
          <div className="bg-[#0b0b10] border border-white/10 rounded-lg p-4 flex flex-col justify-between flex-1 relative overflow-hidden">
            
            {/* Background watermarks or visual shapes */}
            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="text-[10px] text-white/35 uppercase tracking-widest font-bold font-mono">Valuation Output</div>
              <h5 className="text-base font-extrabold text-white mt-1 leading-tight">{preset.name} ({preset.ticker})</h5>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-black/30 p-2.5 rounded border border-white/5">
                  <span className="text-[9px] text-white/35 uppercase block">Current Market Price</span>
                  <span className="text-sm font-mono font-bold text-white mt-1 block">${preset.currentPrice.toFixed(2)}</span>
                </div>
                <div className="bg-black/30 p-2.5 rounded border border-indigo-500/10">
                  <span className="text-[9px] text-indigo-300/45 uppercase block font-mono">Intrinsic Fair Value</span>
                  <span className="text-sm font-mono font-black text-indigo-300 mt-1 block">${dcfResults.intrinsicValue.toFixed(2)}</span>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`mt-4 p-3 border rounded-lg flex items-start space-x-2.5 ${valuationStatus.color}`}>
                {dcfResults.intrinsicValue > preset.currentPrice ? (
                  <TrendingUp className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                )}
                <div>
                  <div className="text-xs font-black uppercase font-mono tracking-wide">
                    {valuationStatus.text} ({dcfResults.marginOfSafety > 0 ? `+${dcfResults.marginOfSafety.toFixed(1)}%` : `${dcfResults.marginOfSafety.toFixed(1)}%`})
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-75 mt-0.5">{valuationStatus.desc}</p>
                </div>
              </div>
            </div>

            {/* Model Breakdown Details */}
            <div className="border-t border-white/5 pt-3 mt-4 space-y-2 text-[11px] font-mono">
              <div className="flex justify-between text-white/35">
                <span>Sum of 5-Yr PV Cash Flows:</span>
                <span className="text-white/80 font-bold">${dcfResults.cumulatedPv.toFixed(1)}B</span>
              </div>
              <div className="flex justify-between text-white/35">
                <span>PV of Terminal Value ({terminalMultiple}x):</span>
                <span className="text-white/80 font-bold">${dcfResults.pvOfTerminalValue.toFixed(1)}B</span>
              </div>
              <div className="flex justify-between text-white/35">
                <span>Total Enterprise Value (EV):</span>
                <span className="text-indigo-200 font-bold">${dcfResults.enterpriseValue.toFixed(1)}B</span>
              </div>
              <div className="flex justify-between text-white/35">
                <span>Total Shareholder Equity Value:</span>
                <span className="text-indigo-400 font-extrabold">${dcfResults.equityValue.toFixed(1)}B</span>
              </div>
            </div>
          </div>

        </div>

        {/* PANEL 3: CASH FLOW CHARTS & SENSITIVITY TABLE (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-[#0a0a0d] border border-white/5 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-1 pb-2 border-b border-white/5 mb-3">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-mono">Cash Flow Projections</span>
            </div>

            {/* Bar Chart representing projected cash flows */}
            <div className="h-28 w-full mt-1.5 select-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dcfResults.projectedFcfs} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="year" stroke="#444" tickFormatter={(v) => `Yr ${v}`} style={{ fontSize: '8px', fontFamily: 'monospace' }} />
                  <YAxis stroke="#444" style={{ fontSize: '8px', fontFamily: 'monospace' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#050505', borderColor: '#333', fontSize: '10px', fontFamily: 'monospace', borderRadius: '4px' }}
                    labelFormatter={(v) => `Year ${v} Projection`}
                    formatter={(val: any) => [`$${val}B`, 'Free Cash Flow']}
                  />
                  <Bar dataKey="fcf" fill="#6366f1" radius={[2, 2, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Inline Valuation Sensitivity Table */}
          <div className="pt-3 border-t border-white/5 mt-3 select-none">
            <div className="text-[10px] text-white/35 font-mono uppercase font-bold tracking-widest mb-2 flex justify-between">
              <span>Sensitivity Analysis Matrix</span>
              <span className="text-indigo-300 text-[8.5px]">WACC vs Multiple (Fair Price)</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[8px] text-white/40 leading-tight">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-1 text-white">Mult \ WACC</th>
                    <th className="py-1 text-center font-bold">{(wacc - 1).toFixed(1)}%</th>
                    <th className="py-1 text-center font-bold text-indigo-300 underline">{(wacc).toFixed(1)}%</th>
                    <th className="py-1 text-center font-bold">{(wacc + 1).toFixed(1)}%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sensitivityData.slice(1, 4).map((row, idx) => {
                    const isCoreMult = row.multiple === terminalMultiple;
                    return (
                      <tr key={idx} className={isCoreMult ? 'bg-indigo-950/20 text-indigo-200' : ''}>
                        <td className="py-1 font-bold text-white">{row.multiple}x</td>
                        <td className="py-1 text-center">${row[`wacc_${(wacc - 1).toFixed(1)}`]}</td>
                        <td className="py-1 text-center font-bold text-indigo-300">${row[`wacc_${(wacc).toFixed(1)}`]}</td>
                        <td className="py-1 text-center">${row[`wacc_${(wacc + 1).toFixed(1)}`]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
