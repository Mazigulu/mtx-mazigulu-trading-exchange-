import React, { useState, useEffect, useRef } from 'react';
import { MarketSymbol } from '../types';

interface TickerPriceProps {
  price: number;
  symbol: MarketSymbol;
}

export default function TickerPrice({ price, symbol }: TickerPriceProps) {
  const [flashType, setFlashType] = useState<'UP' | 'DOWN' | null>(null);
  const prevPriceRef = useRef<number>(price);

  useEffect(() => {
    if (price !== prevPriceRef.current) {
      if (price > prevPriceRef.current) {
        setFlashType('UP');
      } else if (price < prevPriceRef.current) {
        setFlashType('DOWN');
      }
      prevPriceRef.current = price;

      // Subtle flash duration of 800ms
      const timer = setTimeout(() => {
        setFlashType(null);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [price]);

  // Format decimals based on symbol type
  const formattedPrice = price.toFixed(
    symbol === 'USD/JPY' || symbol === 'GOLD/USD' ? 2 : symbol === 'BTC/USDT' ? 0 : 4
  );

  // Transition color styling
  let flashStyle = 'text-white/60';
  if (flashType === 'UP') {
    flashStyle = 'text-emerald-400 font-bold bg-emerald-500/10 scale-102';
  } else if (flashType === 'DOWN') {
    flashStyle = 'text-rose-400 font-bold bg-rose-500/10 scale-102';
  }

  return (
    <span
      className={`px-1.5 py-0.5 rounded transition-all duration-300 ease-out font-mono font-semibold ${flashStyle}`}
    >
      {formattedPrice}
    </span>
  );
}
