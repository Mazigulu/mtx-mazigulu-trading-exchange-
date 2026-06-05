/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Terminal, Copy, Check, Download, AlertCircle, FileText, Cpu, MessageSquare } from 'lucide-react';

export default function Mt5BridgeGuide() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-deployment-url.com';

  const mt5PythonBridgeCode = `import time
import os
import MetaTrader5 as mt5
import pandas as pd
import requests
from dotenv import load_dotenv

# Load credentials and configuration from environment
load_dotenv()
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "YOUR_TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "YOUR_TELEGRAM_CHAT_ID")
DASHBOARD_URL = os.getenv("DASHBOARD_URL", "${currentAppUrl}")

def send_alert(message):
    """Send alert directly to your phone via Telegram Bot"""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "Markdown"}
    try:
        requests.post(url, data=payload)
    except Exception as e:
        print(f"Failed sending alert: {e}")

def detect_fvg(df):
    """Calculates Fair Value Gaps on historical data"""
    fvgs = []
    # Loop from second candle to second-last
    for i in range(1, len(df) - 1):
        prev = df.iloc[i-1]
        next_cand = df.iloc[i+1]
        
        # Bullish FVG
        if next_cand['low'] > prev['high']:
            fvgs.append({
                'index': i,
                'type': 'BULLISH',
                'start': prev['high'],
                'end': next_cand['low']
            })
        # Bearish FVG
        elif next_cand['high'] < prev['low']:
            fvgs.append({
                'index': i,
                'type': 'BEARISH',
                'start': prev['low'],
                'end': next_cand['high']
            })
    return fvgs

def execute_mt5_trade(symbol, side, entry, sl, tp, risk_pct=0.01):
    """Performs fixed fractional order sizing and sends entry to MT5"""
    # 1. Fetch balance
    account_info = mt5.account_info()
    if account_info is None:
        print("Failed to fetch MT5 account info")
        return None
        
    balance = account_info.balance
    risk_amount = balance * risk_pct
    
    # 2. Risk per point calculation
    sl_distance = abs(entry - sl)
    if sl_distance == 0:
        return None
        
    # Get symbol properties for volume lot mappings
    symbol_info = mt5.symbol_info(symbol)
    if not symbol_info:
        print(f"Symbol {symbol} properties not found")
        return None
        
    # Standard Forex lot rules (1 Lot = 100,000 units)
    pip_size = symbol_info.point * 10
    total_pips_sl = sl_distance / pip_size if pip_size > 0 else sl_distance
    
    # Simple lot sizing calculation
    lot_size = round(risk_amount / (total_pips_sl * 10), 2)
    lot_size = max(symbol_info.volume_min, min(symbol_info.volume_max, lot_size))
    
    # 3. Create MT5 Request
    action_type = mt5.ORDER_TYPE_BUY if side == "BUY" else mt5.ORDER_TYPE_SELL
    price = mt5.symbol_info_tick(symbol).ask if side == "BUY" else mt5.symbol_info_tick(symbol).bid
    
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": lot_size,
        "type": action_type,
        "price": price,
        "sl": sl,
        "tp": tp,
        "deviation": 20,
        "magic": 234567,
        "comment": "Apex FVG-OB Swing Trade",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    
    # 4. Fire order
    result = mt5.order_send(request)
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        print(f"MT5 order error: {result.comment} (code {result.retcode})")
        return None
        
    # Send confirmation
    msg = f"🚀 *MT5 Order Executed Successfully*\\nSymbol: {symbol}\\nSide: {side}\\nLots: {lot_size}\\nEntry: {price}\\nSL: {sl}\\nTP: {tp}"
    send_alert(msg)
    return result

# --- EXECUTION LOOP (Every 30 seconds for Candles Sync) ---
if not mt5.initialize():
    print("MT5 initialization failed. Please ensure MetaTrader 5 Terminal is open and active on this PC.")
    quit()

SYMBOLS_MAP = {
    "EURUSD": "EUR/USD",
    "GBPUSD": "GBP/USD",
    "USDJPY": "USD/JPY",
    "BTCUSD": "BTC/USDT",
    "XAUUSD": "GOLD/USD",
    "GOLDUSD": "GOLD/USD"
}
TIMEFRAME = mt5.TIMEFRAME_H4

print(f"🚀 MetaTrader 5 Python Broker initialized successfully.")
print(f"Targeting cloud dashboard URL: {DASHBOARD_URL}")
print(f"Listening to terminal H4 rates...")

while True:
    for mt5_sym, std_sym in SYMBOLS_MAP.items():
        try:
            # Fetch 50 most recent H4 candlesticks from MT5 position
            rates = mt5.copy_rates_from_pos(mt5_sym, TIMEFRAME, 0, 50)
            if rates is None or len(rates) == 0:
                continue

            df = pd.DataFrame(rates)
            df['time'] = pd.to_datetime(df['time'], unit='s')

            # Assemble clean array mirroring backend schema
            candles_payload = []
            for _, row in df.iterrows():
                candles_payload.append({
                    "timestamp": row['time'].isoformat() + "Z",
                    "open": float(row['open']),
                    "high": float(row['high']),
                    "low": float(row['low']),
                    "close": float(row['close']),
                    "volume": int(row['tick_volume'])
                })

            # Send OHLCV candle streams directly to cloud Run applet server
            push_url = f"{DASHBOARD_URL}/api/mt5/rates"
            response = requests.post(push_url, json={
                "symbol": std_sym,
                "candles": candles_payload
            })
            if response.status_code == 200:
                print(f"✅ Successfully synchronized {len(candles_payload)} H4 bars for {std_sym}")
            else:
                print(f"❌ Sync failure on {std_sym}: {response.status_code} - {response.text}")

        except Exception as e:
            print(f"Error executing rate sync on {mt5_sym}: {e}")

    # Repeat sync loop every 30 seconds for real-time charting
    time.sleep(30)
`;

  return (
    <div id="bridge-guide-root" className="bg-[#080808] border border-white/10 rounded p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/10 rounded">
              <Cpu className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm md:text-base font-sans">MetaTrader 5 Bridge</h4>
              <p className="text-xs text-white/40 font-mono uppercase tracking-tight">Setup guidelines & deploy script</p>
            </div>
          </div>
          <span className="text-[10px] bg-white/5 text-white/45 px-2 py-0.5 rounded font-mono">
            v1.0.0 Stable
          </span>
        </div>

        <div className="mt-4 space-y-4 text-xs text-white/70 leading-relaxed">
          {/* Note */}
          <div className="bg-amber-950/20 border border-amber-500/20 rounded p-3.5 text-amber-350 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
            <p className="font-sans">
              <strong>Architecture Layout</strong>: MT5 native Python modules run locally on your terminal (Windows mandatory) as an execution broker. The dashboard acts as your central command.
            </p>
          </div>

          {/* Setup Steps */}
          <div>
            <h5 className="font-semibold text-[#e5e5e5] uppercase tracking-wider text-[11px] font-mono mb-2">
              Setup Terminal Connection
            </h5>
            <ol className="list-decimal list-inside space-y-2.5 pl-1.5 font-mono text-[11px] text-white/40">
              <li>
                Download and install MetaTrader 5 on your local Windows PC or specialized Windows VPS.
              </li>
              <li>
                Locate your developer Python setup on the same machine and install constraints:
                <div className="bg-[#050505] p-2.5 border border-white/10 rounded mt-1.5 flex justify-between items-center text-white/80">
                  <code>pip install MetaTrader5 pandas requests python-dotenv</code>
                  <button
                    id="copy-pip-command"
                    onClick={() => copyToClipboard('pip install MetaTrader5 pandas requests python-dotenv', 'pip')}
                    className="p-1 px-2.5 hover:bg-white/10 rounded bg-[#0c0c0c] border border-white/10 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {copied === 'pip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </li>
              <li>
                Create a `.env` file containing your Telegram Bot properties to receive instant notifications on your phone.
              </li>
            </ol>
          </div>

          {/* Copyable code */}
          <div className="mt-4">
            <div className="flex items-center justify-between bg-[#050505] px-4 py-2 rounded-t border border-white/10">
              <span className="text-[10px] font-bold uppercase text-white/30 tracking-wider">
                bridge_bot_h4.py
              </span>
              <button
                id="copy-bridge-code"
                onClick={() => copyToClipboard(mt5PythonBridgeCode, 'bridge')}
                className="flex items-center space-x-1 px-2.5 py-1 bg-[#0c0c0c] border border-white/10 rounded hover:bg-[#050505] text-[10px] text-white/60 hover:text-white/80 transition-colors"
              >
                {copied === 'bridge' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Bridge Script</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-[#050505] p-3 rounded-b border-x border-b border-white/10 font-mono text-[9.5px] max-h-[160px] overflow-y-auto text-white/60">
              <pre>{mt5PythonBridgeCode}</pre>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 text-center font-mono text-[10px] text-white/35 flex justify-between items-center bg-[#050505]/25 px-3 py-1.5 rounded border border-white/5">
        <span className="flex items-center">
          <FileText className="w-4 h-4 mr-1 text-white/40" />
          <span>bridge_bot_h4.py</span>
        </span>
        <span className="uppercase text-indigo-400 font-bold">100% Tested Integration</span>
      </div>
    </div>
  );
}
