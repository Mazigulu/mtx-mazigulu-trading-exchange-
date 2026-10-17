import React, { useEffect, useRef, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { isMarketOpenForSymbol, getMarketSessionInfo } from '../utils/marketHours';

interface TopStock {
  symbol: string;
  name: string;
  prevClose: number;
  current: number;
  change: number;
  changePercent: number;
}

const DEFAULT_TOP_STOCKS: TopStock[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', prevClose: 125.20, current: 128.45, change: 3.25, changePercent: 2.60 },
  { symbol: 'AAPL', name: 'Apple Inc', prevClose: 224.30, current: 226.10, change: 1.80, changePercent: 0.80 },
  { symbol: 'MSFT', name: 'Microsoft Corp', prevClose: 440.50, current: 443.20, change: 2.70, changePercent: 0.61 },
  { symbol: 'TSLA', name: 'Tesla Inc', prevClose: 248.80, current: 252.30, change: 3.50, changePercent: 1.41 },
  { symbol: 'AMZN', name: 'Amazon.com Inc', prevClose: 185.10, current: 187.40, change: 2.30, changePercent: 1.24 },
  { symbol: 'META', name: 'Meta Platforms', prevClose: 512.00, current: 518.60, change: 6.60, changePercent: 1.29 },
  { symbol: 'GOOGL', name: 'Alphabet Inc', prevClose: 178.40, current: 180.20, change: 1.80, changePercent: 1.01 },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway', prevClose: 445.10, current: 446.80, change: 1.70, changePercent: 0.38 },
  { symbol: 'AVGO', name: 'Broadcom Inc', prevClose: 168.20, current: 171.50, change: 3.30, changePercent: 1.96 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', prevClose: 154.60, current: 155.40, change: 0.80, changePercent: 0.52 },
];

export default function SistineFinancialCeiling() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stocks, setStocks] = useState<TopStock[]>(DEFAULT_TOP_STOCKS);
  const stocksRef = useRef<TopStock[]>(DEFAULT_TOP_STOCKS);

  useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);

  useEffect(() => {
    let isMounted = true;
    let abortController: AbortController | null = null;

    const fetchStocksData = async () => {
      if (document.hidden || !isMounted) return;
      try {
        const cacheKey = 'sistine_top_stocks';
        const cacheTimeKey = 'sistine_top_stocks_time';
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);
        const now = Date.now();

        // 30 seconds caching on client for fast initial render
        if (cachedData && cachedTime && (now - parseInt(cachedTime)) < 30 * 1000) {
          try {
            const parsed = JSON.parse(cachedData);
            if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
              setStocks(parsed);
            }
          } catch (e) {
            console.warn('Error parsing cached stocks, refetching...');
          }
        }

        abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          try { abortController?.abort(); } catch {}
        }, 8000);

        const response = await fetch('/api/top-stocks', {
          signal: abortController.signal
        });
        clearTimeout(timeoutId);

        if (response.ok && isMounted) {
          const data = await response.json();
          if (data && Array.isArray(data.stocks) && data.stocks.length > 0) {
            setStocks(prev => {
              // Merge live server prices into existing stock objects preserving micro-ticks
              return data.stocks.map((s: TopStock) => {
                const existing = prev.find(p => p.symbol === s.symbol);
                const prevClose = Number.isFinite(s.prevClose) ? s.prevClose : (existing?.prevClose || 100);
                const current = Number.isFinite(s.current) && s.current > 0 ? s.current : (existing?.current || prevClose);
                const change = Number.isFinite(s.change) ? s.change : (current - prevClose);
                const changePercent = Number.isFinite(s.changePercent) ? s.changePercent : (prevClose > 0 ? (change / prevClose) * 100 : 0);
                return {
                  symbol: s.symbol || 'STK',
                  name: s.name || s.symbol || 'Equity',
                  prevClose,
                  current,
                  change: parseFloat(change.toFixed(2)),
                  changePercent: parseFloat(changePercent.toFixed(2)),
                };
              });
            });
            try {
              localStorage.setItem(cacheKey, JSON.stringify(data.stocks));
              localStorage.setItem(cacheTimeKey, now.toString());
            } catch {}
          }
        }
      } catch (err: any) {
        // Non-blocking fallback: graceful degradation to cached quotes or defaults
        if (err?.name !== 'AbortError') {
          console.warn('Background ceiling stock ticker fetch skipped or offline, using fallback quotes:', err?.message || err);
        }
      }
    };

    fetchStocksData();
    // Poll every 10 seconds for updated prices
    const pollInterval = setInterval(fetchStocksData, 10000);

    // Live micro-tick simulation every 1.5 seconds for active rotational background stocks
    const tickInterval = setInterval(() => {
      if (document.hidden || !isMounted) return;
      setStocks(prevStocks => {
        if (!prevStocks || prevStocks.length === 0) return prevStocks;
        return prevStocks.map(stock => {
          // If market is closed for this symbol (e.g. weekend for stocks/equities), do NOT simulate live ticks!
          if (!isMarketOpenForSymbol(stock.symbol)) {
            return stock;
          }

          // 40% chance of a micro tick on each interval when market is open
          if (Math.random() > 0.4) {
            const baseClose = Number.isFinite(stock.prevClose) && stock.prevClose > 0 ? stock.prevClose : 100;
            const currentPrice = Number.isFinite(stock.current) && stock.current > 0 ? stock.current : baseClose;
            // random delta between -0.15% and +0.15%
            const deltaPercent = (Math.random() - 0.48) * 0.003;
            let newPrice = currentPrice * (1 + deltaPercent);
            // Clamp drift to within +/- 15% of prevClose to avoid unrealistic runaway prices
            newPrice = Math.max(baseClose * 0.85, Math.min(baseClose * 1.15, newPrice));
            const newChange = newPrice - baseClose;
            const newChangePercent = baseClose > 0 ? (newChange / baseClose) * 100 : 0;
            return {
              ...stock,
              current: parseFloat(newPrice.toFixed(2)),
              change: parseFloat(newChange.toFixed(2)),
              changePercent: parseFloat(newChangePercent.toFixed(2)),
            };
          }
          return stock;
        });
      });
    }, 1500);

    return () => {
      isMounted = false;
      if (abortController) {
        try { abortController.abort(); } catch {}
      }
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, []);

  // Michelangelo-inspired Vaulted Arches structural settings (SVG overlay)
  const arches = useMemo(() => {
    return [
      { d: "M -100 120 Q 50vw -80 120vw 120", color: "rgba(245, 158, 11, 0.4)", width: 2 },
      { d: "M -50 240 Q 50vw 60 110vw 240", color: "rgba(245, 158, 11, 0.2)", width: 1, dash: "5,5" },
      { d: "M -150 420 Q 50vw 180 130vw 420", color: "rgba(6, 182, 212, 0.25)", width: 1.5 },
      { d: "M -20 620 Q 50vw 350 110vw 620", color: "rgba(245, 158, 11, 0.15)", width: 1 },
    ];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Track mouse coordinates for interactive reactive background
    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      targetMouseX = -1000;
      targetMouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Set canvas dimensions with devicePixelRatio for high-DPI support (crystal-sharp 1080p+)
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Re-calculate dimensions on resize
    const handleResize = () => {
      if (!canvas) return;
      const currentDpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * currentDpr;
      canvas.height = height * currentDpr;
      ctx.scale(currentDpr, currentDpr);
    };
    window.addEventListener('resize', handleResize);

    // --- SYSTEM CLASS 1: SPIRALLY DISTINCTIVE FIBONACCI GOLD SWIRLS ---
    // A brilliant set of particles tracing out the sacred Golden Proportion spiral
    const goldenRatio = 1.61803398875;
    const fibonacciParticlesCount = 180;
    const fibonacciParticles: {
      angleOffset: number;
      radiusSpeed: number;
      baseSpeed: number;
      color: string;
      size: number;
      phase: number;
    }[] = [];

    for (let i = 0; i < fibonacciParticlesCount; i++) {
      // Golden spiral distribution (Fermat's spiral / Fibonacci phyllotaxis inspired)
      const theta = i * 2.39996; // Golden angle in radians
      fibonacciParticles.push({
        angleOffset: theta,
        radiusSpeed: 0.15 + (i * 0.003),
        baseSpeed: 0.01 + (Math.random() * 0.005),
        color: i % 4 === 0 
          ? 'rgba(255, 215, 0, 0.95)' // Divine Gold (increased opacity)
          : i % 4 === 1 
            ? 'rgba(245, 158, 11, 0.85)' // Amber (increased opacity)
            : i % 4 === 2
              ? 'rgba(253, 224, 71, 0.9)' // Sunbeam Yellow (increased opacity)
              : 'rgba(255, 255, 255, 0.8)', // Celestial White (increased opacity)
        size: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // --- SYSTEM CLASS 2: FLUID FINANCIAL VECTOR WAVES (SWIRLS) ---
    const vectorWaves = [
      {
        yOffset: 0.22,
        amplitude: 55,
        frequency: 0.0015,
        speed: 0.0012,
        color: 'rgba(245, 158, 11, 0.12)', // Divine gold swirl (increased contrast)
        lineWidth: 1.5,
      },
      {
        yOffset: 0.42,
        amplitude: 80,
        frequency: 0.0009,
        speed: -0.0008,
        color: 'rgba(6, 182, 212, 0.10)', // Celestial cyan flow (increased contrast)
        lineWidth: 2,
      },
      {
        yOffset: 0.65,
        amplitude: 65,
        frequency: 0.0018,
        speed: 0.0015,
        color: 'rgba(168, 85, 247, 0.08)', // Quant violet streamline (increased contrast)
        lineWidth: 1.2,
      },
    ];

    // --- SYSTEM CLASS 3: MULTI-LAYERED BACKGROUND CANDLESTICKS ---
    // Floating financial candles representing vaults of history in the church backdrop
    const backgroundCandlesCount = 35;
    const backgroundCandles: {
      x: number;
      y: number;
      width: number;
      height: number;
      isBullish: boolean;
      opacity: number;
      speed: number;
      scaleY: number;
      glowSize: number;
    }[] = [];

    for (let i = 0; i < backgroundCandlesCount; i++) {
      backgroundCandles.push({
        x: Math.random() * 100, // percentage-based
        y: 25 + Math.random() * 60, // percentage-based
        width: 3 + Math.floor(Math.random() * 5),
        height: 15 + Math.random() * 35,
        isBullish: Math.random() > 0.48, // slightly more bullish candles (green) for divine prosperity
        opacity: 0.12 + Math.random() * 0.18, // increased opacity for richer contrast
        speed: 0.015 + Math.random() * 0.025,
        scaleY: 0.5 + Math.random() * 0.5,
        glowSize: 10 + Math.random() * 25,
      });
    }

    // --- SYSTEM CLASS 4: DIVINE COALITION FLICKERING STARS (STARDUST) ---
    const stardustCount = 50;
    const stardust: {
      x: number;
      y: number;
      size: number;
      color: string;
      flickerSpeed: number;
      offset: number;
    }[] = [];

    for (let i = 0; i < stardustCount; i++) {
      stardust.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 0.8 + Math.random() * 2,
        color: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#22d3ee' : '#ffffff',
        flickerSpeed: 0.02 + Math.random() * 0.04,
        offset: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      if (document.hidden) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      time += 1;
      ctx.clearRect(0, 0, width, height);

      // Interpolate mouse coordinates smoothly (easing)
      if (targetMouseX === -1000) {
        if (mouseX !== -1000) {
          mouseX += (-1000 - mouseX) * 0.1;
          mouseY += (-1000 - mouseY) * 0.1;
          if (Math.abs(mouseX - -1000) < 1) {
            mouseX = -1000;
            mouseY = -1000;
          }
        }
      } else {
        if (mouseX === -1000) {
          mouseX = targetMouseX;
          mouseY = targetMouseY;
        } else {
          mouseX += (targetMouseX - mouseX) * 0.1;
          mouseY += (targetMouseY - mouseY) * 0.1;
        }
      }

      // --- LAYER 1: MASTER AMBIENT CATHEDRAL GOLD LIGHTS ---
      // Clean, clear ambient space with subtle central focus
      const centralFlicker = 1.0 + Math.sin(time * 0.06) * 0.04;
      
      let centralLightX = width / 2;
      let centralLightY = height * 0.35;
      if (mouseX !== -1000) {
        centralLightX += (mouseX - width / 2) * 0.05;
        centralLightY += (mouseY - height * 0.35) * 0.05;
      }

      const radialDivineGlow = ctx.createRadialGradient(
        centralLightX,
        centralLightY,
        2,
        centralLightX,
        centralLightY,
        Math.min(width, height) * 0.35
      );
      radialDivineGlow.addColorStop(0, `rgba(217, 119, 6, ${0.06 * centralFlicker})`);
      radialDivineGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = radialDivineGlow;
      ctx.fillRect(0, 0, width, height);

      // --- LAYER 2: FLUID FINANCIAL SWIRL VECTORS ---
      vectorWaves.forEach((wave) => {
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;
        ctx.beginPath();

        for (let x = 0; x <= width; x += 10) {
          const angle = x * wave.frequency + time * wave.speed;
          // Organic fluid wave math using trigonometric feedback
          const fluidFactor = Math.sin(angle) * Math.cos(angle * 0.7) + Math.sin(angle * 1.8) * 0.25;
          let y = height * wave.yOffset + fluidFactor * wave.amplitude;

          // Warp wave gracefully near cursor
          if (mouseX !== -1000) {
            const dx = x - mouseX;
            const dy = y - mouseY;
            const dist = Math.hypot(dx, dy);
            if (dist < 180) {
              const force = (180 - dist) / 180;
              // Smooth vertical displacement pushing wave away from cursor
              y += (dy >= 0 ? 1 : -1) * force * 35;
            }
          }

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // --- LAYER 3: MULTI-LAYERED FINANCIAL CANDLESTICKS (FRESCO LEDGER COLUMN) ---
      backgroundCandles.forEach((candle, index) => {
        // Drift position slowly horizontally to feel alive
        candle.x += candle.speed;
        if (candle.x > 105) {
          candle.x = -5;
          candle.y = 25 + Math.random() * 60;
        }

        const xPos = (candle.x / 100) * width;
        const yPos = (candle.y / 100) * height;

        // Dynamic height pulse representing changing market ticks
        const currentPulse = 1 + Math.sin(time * 0.01 + index) * 0.15;
        
        // Interactive reactivity when cursor is nearby
        let opacityMultiplier = 1.0;
        let scaleMultiplier = 1.0;
        let extraGlow = 0;
        if (mouseX !== -1000) {
          const dx = xPos - mouseX;
          const dy = yPos - mouseY;
          const dist = Math.hypot(dx, dy);
          if (dist < 160) {
            const force = (160 - dist) / 160;
            opacityMultiplier = 1.0 + force * 1.5; // up to 2.5x brighter
            scaleMultiplier = 1.0 + force * 0.25; // up to 1.25x larger
            extraGlow = force * 20; // extend radial glow radius
          }
        }

        const cHeight = candle.height * currentPulse * scaleMultiplier;
        const cWidth = candle.width * scaleMultiplier;

        // Draw the wick line (financial high/low) with sharp vector precision
        ctx.strokeStyle = candle.isBullish 
          ? `rgba(16, 185, 129, ${Math.min(1.0, 0.7 * opacityMultiplier)})` 
          : `rgba(239, 68, 68, ${Math.min(1.0, 0.7 * opacityMultiplier)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xPos, yPos - cHeight * 0.75);
        ctx.lineTo(xPos, yPos + cHeight * 0.75);
        ctx.stroke();

        // Draw the candle body
        ctx.fillStyle = candle.isBullish 
          ? `rgba(16, 185, 129, ${Math.min(1.0, candle.opacity * 1.2 * opacityMultiplier)})`
          : `rgba(239, 68, 68, ${Math.min(1.0, candle.opacity * 1.2 * opacityMultiplier)})`;
        ctx.fillRect(xPos - cWidth / 2, yPos - cHeight * 0.4, cWidth, cHeight * 0.8);

        // Render delicate top flame (candle flicker) on the wick
        const candleFlicker = 0.85 + Math.sin(time * 0.15 + index) * 0.15;
        ctx.fillStyle = `rgba(251, 191, 36, ${Math.min(1.0, candle.opacity * 4.5 * candleFlicker * opacityMultiplier)})`;
        ctx.beginPath();
        ctx.arc(xPos, yPos - cHeight * 0.75, 2.2 * candleFlicker * scaleMultiplier, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- LAYER 4: SPIRALLY DISTINCTIVE FIBONACCI SWIRL CONSTELLATION ---
      // Anchored primarily at the left-center (divine touchpoint area) to swirl out beautifully
      const spiralCenterX = width * 0.18; // Framed near Left hand ("Creation of Alpha" Genesis)
      const spiralCenterY = height * 0.35;

      // Draw the actual golden mathematical logarithmic spiral lines to show divine architecture
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.38)'; // increased from 0.25 to 0.38 for contrast
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      const numTurns = 8;
      const bGrowth = 0.14; // spiral growth factor
      const spinSpeed = time * 0.0015;
      for (let theta = 0; theta < numTurns * Math.PI * 2; theta += 0.08) {
        const r = 4.0 * Math.pow(Math.E, bGrowth * theta);
        if (r > 380) break;
        const x = spiralCenterX + Math.cos(theta + spinSpeed) * r;
        const y = spiralCenterY + Math.sin(theta + spinSpeed) * r;
        if (theta === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      fibonacciParticles.forEach((p, index) => {
        // Animate radius spiraling outwards with time
        const radiusMultiplier = (time * 0.12) % 350;
        const baseRadius = p.radiusSpeed * radiusMultiplier;
        
        // Spin angle over time
        const angle = p.angleOffset + (time * p.baseSpeed) + Math.sin(time * 0.005 + p.phase) * 0.2;
        
        const px = spiralCenterX + Math.cos(angle) * baseRadius;
        const py = spiralCenterY + Math.sin(angle) * baseRadius;

        // Skip drawing if outside viewport boundaries
        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          // Dynamic alpha trace based on distance from center (sacred golden ratio fadeout)
          const distFromCenter = baseRadius;
          const maxDist = 320;
          let alphaFactor = Math.max(0, 1 - (distFromCenter / maxDist)) * (0.55 + Math.sin(time * 0.04 + index) * 0.25); // increased alpha floor
          
          let dispX = 0;
          let dispY = 0;
          let sizeMultiplier = 1.0;
          let glowBoost = 6;
          
          // Repel from cursor and swell
          if (mouseX !== -1000) {
            const dx = px - mouseX;
            const dy = py - mouseY;
            const dist = Math.hypot(dx, dy);
            if (dist < 150) {
              const force = (150 - dist) / 150;
              dispX = (dx / (dist || 1)) * force * 35;
              dispY = (dy / (dist || 1)) * force * 35;
              sizeMultiplier = 1.0 + force * 1.0; // swell up to 2x when close
              alphaFactor = Math.min(1.0, alphaFactor * (1.0 + force * 1.5)); // brighter
              glowBoost = 6 + Math.floor(force * 10);
            }
          }

          const finalPx = px + dispX;
          const finalPy = py + dispY;

          ctx.fillStyle = p.color;
          ctx.shadowBlur = glowBoost;
          ctx.shadowColor = '#d4af37';
          
          ctx.beginPath();
          ctx.arc(finalPx, finalPy, p.size * (0.85 + Math.sin(time * 0.08 + index) * 0.15) * sizeMultiplier, 0, Math.PI * 2);
          ctx.fill();
          
          // Reset shadow config
          ctx.shadowBlur = 0;
        }
      });

      // --- LAYER 4.5: DIVINE STOCK CONSTELLATIONS SPIRALING OUT ---
      const activeStocks = stocksRef.current;
      if (activeStocks && activeStocks.length > 0) {
        activeStocks.forEach((stock, i) => {
          // Slow progress along the spiral
          // Each stock is spaced out by index
          const offsetTime = time * 0.18 + (i * 55);
          const maxRadius = Math.min(width, height) * 0.45;
          const currentRadius = (offsetTime % 320) / 320 * maxRadius;
          
          // Spiral angle formula: theta increases as radius increases, creating a beautiful spiral path
          const spiralFactor = 0.035; // how tight the spiral is
          const angle = (currentRadius * spiralFactor) + (time * 0.001) + (i * (Math.PI * 2 / activeStocks.length));
          
          const sx = spiralCenterX + Math.cos(angle) * currentRadius;
          const sy = spiralCenterY + Math.sin(angle) * currentRadius;
          
          if (sx >= 0 && sx <= width && sy >= 0 && sy <= height && currentRadius > 15) {
            // Fade in as it departs from center, fade out as it reaches the edge
            const fadeFactor = Math.sin((currentRadius / maxRadius) * Math.PI);
            ctx.globalAlpha = fadeFactor * 0.85; // increased from 0.7 to 0.85
            
            // Neon glowing nodes for each stock
            const changePct = Number.isFinite(stock.changePercent) ? stock.changePercent : 0;
            const isBullish = changePct >= 0;
            const glowColor = isBullish ? '#10b981' : '#ef4444';
            
            ctx.shadowBlur = 8; // increased from 6 to 8 for sharper neon highlights
            ctx.shadowColor = glowColor;
            
            // Draw a tiny circular constellation plate
            ctx.fillStyle = 'rgba(12, 12, 16, 0.95)';
            ctx.strokeStyle = isBullish ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)'; // higher contrast strokes
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw spark center
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // reset shadow
            
            // Write stock ticker & live current price elegantly
            ctx.font = "bold 9px monospace";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(stock.symbol || 'STK', sx + 8, sy - 2);
            
            ctx.font = "8px monospace";
            ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
            const livePrice = Number.isFinite(stock.current) && stock.current > 0 
              ? stock.current 
              : (Number.isFinite(stock.prevClose) ? stock.prevClose : 0);
            ctx.fillText(`$${livePrice.toFixed(1)}`, sx + 8, sy + 7);
            
            // Draw arrow and change percent
            const arrow = isBullish ? '▲' : '▼';
            ctx.fillStyle = glowColor;
            ctx.font = "8px monospace";
            ctx.fillText(`${arrow}${Math.abs(changePct).toFixed(1)}%`, sx + 10 + ((stock.symbol || 'STK').length * 5), sy - 2);
            
            // Draw a delicate tracing line to the next stock node in the constellation to create a "Celestial Ring of Wealth"
            const nextIdx = (i + 1) % activeStocks.length;
            const nextOffsetTime = time * 0.18 + (nextIdx * 55);
            const nextRadius = (nextOffsetTime % 320) / 320 * maxRadius;
            const nextAngle = (nextRadius * spiralFactor) + (time * 0.001) + (nextIdx * (Math.PI * 2 / activeStocks.length));
            const nsx = spiralCenterX + Math.cos(nextAngle) * nextRadius;
            const nsy = spiralCenterY + Math.sin(nextAngle) * nextRadius;
            
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)'; // increased from 0.12 to 0.22 for visibility
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(nsx, nsy);
            ctx.stroke();
            
            ctx.globalAlpha = 1.0;
          }
        });
      }

      // Second complimentary Golden Spiral at the right side to reflect divine symmetry
      const spiralRightX = width * 0.82;
      const spiralRightY = height * 0.55;

      // Draw right side blue complimentary spiral lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.28)'; // increased from 0.18 to 0.28 for visibility
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      const rightSpinSpeed = -time * 0.0012;
      for (let theta = 0; theta < 6 * Math.PI * 2; theta += 0.08) {
        const r = 5.0 * Math.pow(Math.E, 0.15 * theta);
        if (r > 280) break;
        const x = spiralRightX + Math.cos(-theta + rightSpinSpeed) * r;
        const y = spiralRightY + Math.sin(-theta + rightSpinSpeed) * r;
        if (theta === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      fibonacciParticles.slice(0, 90).forEach((p, index) => {
        const radiusMultiplier = (time * 0.1) % 280;
        const baseRadius = p.radiusSpeed * radiusMultiplier;
        const angle = -p.angleOffset - (time * p.baseSpeed * 0.8) + Math.cos(time * 0.004 + p.phase) * 0.15;
        
        const px = spiralRightX + Math.cos(angle) * baseRadius;
        const py = spiralRightY + Math.sin(angle) * baseRadius;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const distFromCenter = baseRadius;
          let alphaFactor = Math.max(0, 1 - (distFromCenter / 240)) * (0.45 + Math.cos(time * 0.05 + index) * 0.2); // increased floor from 0.35 to 0.45
          
          let dispX = 0;
          let dispY = 0;
          let sizeMultiplier = 1.0;
          let glowBoost = 0;
          
          // Repel from cursor and swell
          if (mouseX !== -1000) {
            const dx = px - mouseX;
            const dy = py - mouseY;
            const dist = Math.hypot(dx, dy);
            if (dist < 150) {
              const force = (150 - dist) / 150;
              dispX = (dx / (dist || 1)) * force * 35;
              dispY = (dy / (dist || 1)) * force * 35;
              sizeMultiplier = 1.0 + force * 1.0;
              alphaFactor = Math.min(1.0, alphaFactor * (1.0 + force * 1.5));
              glowBoost = Math.floor(force * 12);
            }
          }

          const finalPx = px + dispX;
          const finalPy = py + dispY;

          ctx.fillStyle = `rgba(6, 182, 212, ${alphaFactor})`; // Celestial blue-cyan
          if (glowBoost > 0) {
            ctx.shadowBlur = glowBoost;
            ctx.shadowColor = '#06b6d4';
          }
          
          ctx.beginPath();
          ctx.arc(finalPx, finalPy, p.size * 0.8 * sizeMultiplier, 0, Math.PI * 2);
          ctx.fill();
          
          if (glowBoost > 0) {
            ctx.shadowBlur = 0;
          }
        }
      });

      // --- LAYER 5: FLICKERING CELESTIAL STARDUST (FRESCO SPECKLES) ---
      stardust.forEach((star) => {
        const starXPos = (star.x / 100) * width;
        const starYPos = (star.y / 100) * height;
        
        let speedMultiplier = 1.0;
        let brightnessBoost = 0;
        
        if (mouseX !== -1000) {
          const dx = starXPos - mouseX;
          const dy = starYPos - mouseY;
          const dist = Math.hypot(dx, dy);
          if (dist < 180) {
            const force = (180 - dist) / 180;
            speedMultiplier = 1.0 + force * 2.0; // Twinkle up to 3x faster near cursor
            brightnessBoost = force * 0.35; // Grow brighter
          }
        }

        const pulse = Math.sin(time * star.flickerSpeed * speedMultiplier + star.offset);
        const currentAlpha = Math.min(1.0, 0.15 + (pulse + 1) * 0.35 + brightnessBoost);
        const glowRad = star.size * (1.0 + pulse * 0.3);

        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(starXPos, starYPos, glowRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // reset
      });

      // --- LAYER 6: CELESTIAL CURSOR RETICLE ---
      if (mouseX !== -1000) {
        ctx.save();
        // Tiny gold center spark
        ctx.fillStyle = 'rgba(245, 158, 11, 0.75)';
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
        ctx.fill();

        // Delicate orbiting dashed halo
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 24, 0, Math.PI * 2);
        ctx.stroke();

        // Delicate outer coordinate crosshairs
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([1, 5]);
        ctx.beginPath();
        // horizontal
        ctx.moveTo(mouseX - 40, mouseY);
        ctx.lineTo(mouseX - 8, mouseY);
        ctx.moveTo(mouseX + 8, mouseY);
        ctx.lineTo(mouseX + 40, mouseY);
        // vertical
        ctx.moveTo(mouseX, mouseY - 40);
        ctx.lineTo(mouseX, mouseY - 8);
        ctx.moveTo(mouseX, mouseY + 8);
        ctx.lineTo(mouseX, mouseY + 40);
        ctx.stroke();
        ctx.restore();
      }

      animationId = requestAnimationFrame(draw);
    };

    const draw = render;
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-screen overflow-hidden pointer-events-none z-0 bg-[#000000]">
      {/* 2D Canvas Layer drawing glowing financial wicks, candlesticks and Golden spirals */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full mix-blend-screen opacity-100 z-[1]" 
        style={{ imageRendering: '-webkit-optimize-contrast', WebkitFontSmoothing: 'antialiased' }}
      />

      {/* The Sacred Vaulted Arches of the Financial Dome (Sistine Chapel ceiling arches) */}
      <svg className="absolute inset-0 w-full h-full opacity-50 z-[1]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="divineGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#d97706" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="etherBlue" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
          <radialGradient id="creationSpark" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="20%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sacred Vaulted arches overlay */}
        {arches.map((arch, idx) => (
          <path
            key={idx}
            d={arch.d}
            fill="none"
            stroke={arch.color}
            strokeWidth={arch.width}
            strokeDasharray={arch.dash || undefined}
          />
        ))}

        {/* Dynamic coordinate cross lines */}
        <line x1="12%" y1="0" x2="32%" y2="100vh" stroke="rgba(245, 158, 11, 0.08)" strokeWidth="1" />
        <line x1="88%" y1="0" x2="68%" y2="100vh" stroke="rgba(245, 158, 11, 0.08)" strokeWidth="1" />
        <line x1="0" y1="42vh" x2="100vw" y2="42vh" stroke="rgba(245, 158, 11, 0.06)" strokeWidth="1.2" />
      </svg>

      {/* THE CREATION OF ALPHA (Michelangelo's "Creation of Adam" with glowing market nodes) */}
      <div className="absolute top-[20vh] md:top-[16vh] left-[50%] -translate-x-[50%] w-[95%] max-w-5xl h-[42vh] z-[1]">
        <svg viewBox="0 0 800 400" className="w-full h-full opacity-85">
          {/* Deliberate Financial Constellation & Star Cluster Networks: ALPHA vs BETA */}
          <g>
            {/* LEFT HAND CONSTELLATION: THE ALPHA ARCHITECTURE (α) */}

            {/* Left Hand Nodes */}
            <circle cx="40" cy="220" r="5" fill="#10b981" className="animate-pulse" />
            <circle cx="140" cy="195" r="5.5" fill="#38bdf8" />
            <circle cx="210" cy="205" r="4.5" fill="#38bdf8" />
            <circle cx="280" cy="215" r="4" fill="#38bdf8" />
            <circle cx="180" cy="240" r="3.5" fill="#38bdf8" />
            <circle cx="310" cy="185" r="6" fill="#f59e0b" className="animate-pulse" />
            <circle cx="320" cy="195" r="5" fill="#f59e0b" />

            {/* RIGHT HAND CONSTELLATION: THE BETA FRAMEWORK (β) */}

            {/* Right Hand Nodes */}
            <circle cx="760" cy="220" r="5" fill="#ef4444" className="animate-pulse" />
            <circle cx="660" cy="235" r="5.5" fill="#a855f7" />
            <circle cx="590" cy="215" r="4.5" fill="#a855f7" />
            <circle cx="520" cy="205" r="4" fill="#a855f7" />
            <circle cx="620" cy="190" r="3.5" fill="#a855f7" />
            <circle cx="490" cy="230" r="6" fill="#f59e0b" className="animate-pulse" />
            <circle cx="480" cy="222" r="5" fill="#f59e0b" />
          </g>

          {/* Reaching fingers (Trend channels converging to the divine spark) */}
          <g stroke="url(#divineGold)" strokeWidth="2.5" fill="none">
            {/* Supply vector (left) extending towards the touch point */}
            <motion.path 
              d="M 310 185 C 345 178, 368 200, 391 204" 
              initial={{ pathLength: 0.85 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
            {/* Demand vector (right) extending towards the touch point */}
            <motion.path 
              d="M 480 222 C 448 226, 430 212, 407 206" 
              initial={{ pathLength: 0.85 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
          </g>

          {/* Halo rings around the sacred touching point of Alpha */}
          <motion.circle 
            cx="399" 
            cy="205" 
            r="28" 
            fill="none" 
            stroke="rgba(245, 158, 11, 0.25)" 
            strokeWidth="1.2"
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.circle 
            cx="399" 
            cy="205" 
            r="40" 
            fill="none" 
            stroke="rgba(6, 182, 212, 0.2)" 
            strokeWidth="0.9"
            strokeDasharray="4 4"
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />

          {/* The Contact Point Spark of Creation (Alpha Generation point) */}
          <g>
            <circle cx="399" cy="205" r="22" fill="url(#creationSpark)" className="mix-blend-screen" />
            <motion.circle 
              cx="399" 
              cy="205" 
              r="6" 
              fill="#ffffff" 
              animate={{ scale: [1, 1.8, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </g>
        </svg>
      </div>

      {/* Neoclassical Financial Ledger Ticker Ribbon */}
      {stocks.length > 0 && (
        <div 
          className="absolute bottom-4 left-0 w-full py-2 z-[10] overflow-hidden flex items-center bg-[#000000]/90 border-y border-white/10 backdrop-blur-md pointer-events-auto group select-none"
          title="Hover to pause rotation"
        >
          <div className="flex whitespace-nowrap animate-ticker-smooth group-hover:[animation-play-state:paused] transform-gpu">
            {/* Repeat the list 4 times for a seamless infinite loop */}
            {[...stocks, ...stocks, ...stocks, ...stocks].map((stock, i) => {
              const changePct = Number.isFinite(stock.changePercent) ? stock.changePercent : 0;
              const isBullish = changePct >= 0;
              const livePrice = Number.isFinite(stock.current) && stock.current > 0 
                ? stock.current 
                : (Number.isFinite(stock.prevClose) ? stock.prevClose : 0);
              const marketOpen = isMarketOpenForSymbol(stock.symbol);

              return (
                <div 
                  key={i} 
                  className="inline-flex items-center mx-3 font-mono text-[11px] tracking-tight shrink-0 px-3 py-1 rounded-md transition-colors duration-150 hover:bg-white/10 hover:border hover:border-amber-500/30 cursor-pointer min-w-[195px]"
                >
                  <span className="text-amber-500/60 font-bold mr-2 text-[10px]">♦</span>
                  <span className="text-neutral-200 font-bold mr-2">{stock.symbol || 'STK'}</span>
                  <span className="text-neutral-100 font-semibold mr-2 tabular-nums">${livePrice.toFixed(2)}</span>
                  <span className={`inline-flex items-center font-bold text-[10px] tabular-nums shrink-0 ${
                    isBullish 
                      ? 'text-emerald-400' 
                      : 'text-rose-400'
                  }`}>
                    {isBullish ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
                  </span>
                  {!marketOpen && (
                    <span className="ml-1.5 text-[8px] font-bold text-amber-400/90 tracking-wider uppercase">
                      CLOSED
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
