import React, { useState, useMemo, useEffect } from 'react';
import { Trade, MarketSymbol, getSymbolCorrelations, FVG, OrderBlock } from '../types';
import { 
  BookOpen, 
  Camera, 
  Save, 
  Tag, 
  Trash2, 
  Smile, 
  Award, 
  AlertCircle, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Check, 
  Activity, 
  Clock,
  Eye,
  FileText,
  AlertTriangle,
  Lightbulb,
  Play,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Download
} from 'lucide-react';

interface TradeJournalProps {
  trades: Trade[];
  onTradeUpdated: () => void;
  onReplayTrade?: (trade: Trade) => void;
}

export default function TradeJournal({ trades, onTradeUpdated, onReplayTrade }: TradeJournalProps) {
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalJournalPages, setTotalJournalPages] = useState(1);
  const [fetching, setFetching] = useState(false);

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Form states
  const [annotation, setAnnotation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [sentimentRating, setSentimentRating] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [dragActive, setDragActive] = useState(false);

  // Tag filter selection state
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');

  // Pagination states
  const [journalPage, setJournalPage] = useState(1);
  const journalItemsPerPage = 5;

  // List of all distinct strategy tags for dropdown
  const [allAvailableTags, setAllAvailableTags] = useState<string[]>([
    '#ICT_Setup',
    '#NewsEvent',
    '#MeanReversion',
    '#TrendFollowing',
    '#Breakout'
  ]);

  const [groupBySymbol, setGroupBySymbol] = useState(false);
  const [collapsedSymbols, setCollapsedSymbols] = useState<Record<string, boolean>>({});
  const [highDensity, setHighDensity] = useState(false);

  // Fetch paginated closed trades from server
  const fetchPaginatedTrades = async () => {
    try {
      setFetching(true);
      const limitValue = groupBySymbol ? 500 : journalItemsPerPage;
      const pageValue = groupBySymbol ? 1 : journalPage;
      const res = await fetch(`/api/trades/history?page=${pageValue}&limit=${limitValue}&tag=${encodeURIComponent(selectedTagFilter)}`);
      if (res.ok) {
        const data = await res.json();
        setClosedTrades(data.trades || []);
        setTotalCount(data.total || 0);
        setTotalJournalPages(groupBySymbol ? 1 : (data.totalPages || 1));
        if (data.allTags && Array.isArray(data.allTags)) {
          setAllAvailableTags(data.allTags);
        }
      }
    } catch (err) {
      console.error('Failed to load server-side trade history pagination:', err);
    } finally {
      setFetching(false);
    }
  };

  // Reset pagination on filter change
  useEffect(() => {
    setJournalPage(1);
  }, [selectedTagFilter, groupBySymbol]);

  // Sync data when page, tag, or external trades trigger changes (e.g. from automatic close simulation or parent state alterations)
  useEffect(() => {
    fetchPaginatedTrades();
  }, [journalPage, selectedTagFilter, trades, groupBySymbol]);

  // Computed grouped trades list by Symbol
  const groupedTrades = useMemo(() => {
    if (!groupBySymbol) return [];
    const groups: Record<string, Trade[]> = {};
    closedTrades.forEach(t => {
      if (!groups[t.symbol]) {
        groups[t.symbol] = [];
      }
      groups[t.symbol].push(t);
    });
    return Object.entries(groups).map(([symbol, list]) => {
      const totalPnL = list.reduce((sum, t) => sum + (t.pnl || 0), 0);
      return {
        symbol,
        trades: list,
        totalPnL
      };
    }).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [closedTrades, groupBySymbol]);

  const handleCollapseAll = () => {
    const fresh: Record<string, boolean> = {};
    groupedTrades.forEach(({ symbol }) => {
      fresh[symbol] = true;
    });
    setCollapsedSymbols(fresh);
  };

  const handleExpandAll = () => {
    setCollapsedSymbols({});
  };

  // When a trade is clicked, populate the editor form
  const handleSelectTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setAnnotation(trade.annotation || '');
    setTags(trade.tags || []);
    setSentimentRating(trade.sentimentRating || 'DISCIPLINED');
    setScreenshot(trade.screenshot || '');
    setNewTag('');
    setSaveStatus('IDLE');
  };

  // Emotion presets
  const sentimentPresets = [
    { value: 'DISCIPLINED', label: 'Disciplined', icon: Award, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
    { value: 'ANXIOUS', label: 'Anxious', icon: Activity, color: 'text-amber-400 bg-amber-500/10 border-amber-500/25' },
    { value: 'GREEDY', label: 'Greedy', icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/25' },
    { value: 'FEARFUL', label: 'Fearful', icon: AlertCircle, color: 'text-sky-400 bg-sky-500/10 border-sky-500/25' },
    { value: 'FOMO', label: 'FOMO Breakout', icon: Clock, color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/25' },
    { value: 'PATIENT', label: 'Patient Entry', icon: Smile, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25' },
  ];

  // Helper to read and encode image uploads to Base64
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Error: Please drag or select a valid image file (PNG/JPG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      if (b64) {
        setScreenshot(b64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop setup handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Add tag ensuring option for strategy-style hash prefixed tag names
  const handleAddTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && newTag.trim()) {
      e.preventDefault();
      let cleaned = newTag.trim();
      if (cleaned) {
        if (!cleaned.startsWith('#')) {
          cleaned = '#' + cleaned;
        }
        const alreadyExists = tags.some(t => t.toLowerCase() === cleaned.toLowerCase());
        if (!alreadyExists) {
          setTags([...tags, cleaned]);
        }
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Post changes to back-end
  const handleSaveJournal = async () => {
    if (!selectedTrade) return;
    setSaving(true);
    setSaveStatus('IDLE');

    try {
      const response = await fetch(`/api/trades/${selectedTrade.id}/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          annotation,
          tags,
          sentimentRating,
          screenshot,
        }),
      });

      if (response.ok) {
        setSaveStatus('SUCCESS');
        onTradeUpdated();
        // Update local memory representing the selected trade
        setSelectedTrade(prev => prev ? {
          ...prev,
          annotation,
          tags,
          sentimentRating,
          screenshot,
        } : null);
        setTimeout(() => setSaveStatus('IDLE'), 3000);
      } else {
        setSaveStatus('ERROR');
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('ERROR');
    } finally {
      setSaving(false);
    }
  };

  const handleExportToCSV = () => {
    // Filter all closed trades that have been loaded or present in general trades catalog
    const allClosed = trades.filter(t => t.status === 'CLOSED');
    
    if (allClosed.length === 0) {
      alert("No closed trades available to export in this session.");
      return;
    }

    const headers = [
      "Trade ID",
      "Symbol",
      "Side",
      "Size",
      "Entry Price",
      "Exit Price",
      "Realized PnL ($)",
      "Stop Loss",
      "Take Profit",
      "Entry Timestamp",
      "Exit Timestamp",
      "Close Reason",
      "Tags",
      "Audit Sentiment",
      "Notes / Annotations"
    ];

    const rows = allClosed.map(t => {
      const escapeCSV = (val: any) => {
        if (val === undefined || val === null) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const entryTime = t.timestamp ? new Date(t.timestamp).toISOString() : '';
      const exitTime = t.exitTimestamp ? new Date(t.exitTimestamp).toISOString() : '';
      const tagsStr = t.tags ? t.tags.join('; ') : '';

      return [
        escapeCSV(t.id),
        escapeCSV(t.symbol),
        escapeCSV(t.side),
        escapeCSV(t.size),
        escapeCSV(t.entryPrice),
        escapeCSV(t.exitPrice),
        escapeCSV(t.pnl),
        escapeCSV(t.stopLoss),
        escapeCSV(t.takeProfit),
        escapeCSV(entryTime),
        escapeCSV(exitTime),
        escapeCSV(t.reason || ''),
        escapeCSV(tagsStr),
        escapeCSV(t.sentimentRating || ''),
        escapeCSV(t.annotation || '')
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `apex_closed_trades_audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const contextData = useMemo(() => {
    const text = annotation || selectedTrade?.annotation || '';
    if (!text) return null;

    const marker = "[AUTO-FILL CONTEXT LOG";
    const startIdx = text.indexOf(marker);
    if (startIdx === -1) return null;

    const block = text.substring(startIdx);
    
    // Parse individual metrics
    const sentimentMatch = block.match(/• Current Market Sentiment:\s*([^\n]+)/);
    const atrMatch = block.match(/• Ticker Volatility \(ATR\):\s*([^\n]+)/);
    const fvgMatch = block.match(/• (Nearest FVG is\s*[^\n]+|No nearby FVGs\s*[^\n]+|No recorded FVGs\s*[^\n]+|FVG data:\s*[^\n]+)/);
    const obMatch = block.match(/• (Nearest OrderBlock is\s*[^\n]+|No nearby OrderBlocks\s*[^\n]+|No recorded OrderBlocks\s*[^\n]+|OrderBlock data:\s*[^\n]+)/);

    if (sentimentMatch || atrMatch || fvgMatch || obMatch) {
      return {
        sentiment: sentimentMatch ? sentimentMatch[1].trim() : null,
        atr: atrMatch ? atrMatch[1].trim() : null,
        fvg: fvgMatch ? fvgMatch[1].trim() : null,
        ob: obMatch ? obMatch[1].trim() : null,
      };
    }
    return null;
  }, [annotation, selectedTrade]);

  const [autoFilling, setAutoFilling] = useState(false);

  const handleAutoFillContext = async () => {
    if (!selectedTrade) return;
    setAutoFilling(true);
    try {
      const [marketRes, sentimentRes] = await Promise.all([
        fetch(`/api/market-data?symbol=${encodeURIComponent(selectedTrade.symbol)}`),
        fetch(`/api/market-sentiment`)
      ]);

      let sentimentStr = '';
      let atrStr = '';
      let fvgStr = '';
      let obStr = '';

      const referencePrice = selectedTrade.exitPrice || selectedTrade.entryPrice;

      // 1. Parsing Market Data
      if (marketRes.ok) {
        const mData = await marketRes.json();
        const metrics = mData.metrics;
        
        // Volatility
        if (metrics && typeof metrics.atr === 'number') {
          const val = metrics.atr;
          let pips = 0;
          if (selectedTrade.symbol.includes('JPY')) pips = val * 100;
          else if (selectedTrade.symbol.includes('GOLD') || selectedTrade.symbol.includes('SILVER')) pips = val * 10;
          else if (selectedTrade.symbol.includes('BTC') || selectedTrade.symbol.includes('ETH') || selectedTrade.symbol.includes('SOL')) pips = val;
          else if (selectedTrade.symbol.includes('US30') || selectedTrade.symbol.includes('NAS100') || selectedTrade.symbol.includes('SPX500') || selectedTrade.symbol.includes('GER40')) pips = val;
          else pips = val * 10000;

          const unit = (selectedTrade.symbol.includes('BTC') || selectedTrade.symbol.includes('ETH') || selectedTrade.symbol.includes('SOL')) 
            ? 'USD' 
            : (selectedTrade.symbol.includes('US30') || selectedTrade.symbol.includes('NAS100') || selectedTrade.symbol.includes('SPX500') || selectedTrade.symbol.includes('GER40'))
            ? 'points'
            : 'pips';

          atrStr = `${val.toFixed(selectedTrade.symbol.includes('JPY') ? 2 : 5)} (${pips.toFixed(1)} ${unit})`;
        } else {
          atrStr = 'Volatility metrics currently unavailable.';
        }

        // Nearest FVG calculation
        const fvgsList: FVG[] = mData.fvgs || [];
        if (fvgsList.length > 0) {
          let closestFVG: FVG | null = null;
          let minDistance = Infinity;
          for (const f of fvgsList) {
            const mid = (f.gapStart + f.gapEnd) / 2;
            const dist = Math.abs(mid - referencePrice);
            if (dist < minDistance) {
              minDistance = dist;
              closestFVG = f;
            }
          }

          if (closestFVG) {
            let distPips = 0;
            if (selectedTrade.symbol.includes('JPY')) distPips = minDistance * 100;
            else if (selectedTrade.symbol.includes('GOLD') || selectedTrade.symbol.includes('SILVER')) distPips = minDistance * 10;
            else if (selectedTrade.symbol.includes('BTC') || selectedTrade.symbol.includes('ETH') || selectedTrade.symbol.includes('SOL')) distPips = minDistance;
            else if (selectedTrade.symbol.includes('US30') || selectedTrade.symbol.includes('NAS100') || selectedTrade.symbol.includes('SPX500') || selectedTrade.symbol.includes('GER40')) distPips = minDistance;
            else distPips = minDistance * 10000;

            const unit = (selectedTrade.symbol.includes('BTC') || selectedTrade.symbol.includes('ETH') || selectedTrade.symbol.includes('SOL')) 
              ? 'USD' 
              : (selectedTrade.symbol.includes('US30') || selectedTrade.symbol.includes('NAS100') || selectedTrade.symbol.includes('SPX500') || selectedTrade.symbol.includes('GER40'))
              ? 'points'
              : 'pips';

            fvgStr = `Nearest FVG is ${distPips.toFixed(1)} ${unit} away [${closestFVG.type} FVG: ${closestFVG.gapStart.toFixed(selectedTrade.symbol.includes('JPY') ? 2 : 5)} - ${closestFVG.gapEnd.toFixed(selectedTrade.symbol.includes('JPY') ? 2 : 5)}] (Mitigated: ${closestFVG.isMitigated ? 'Yes' : 'No'})`;
          } else {
            fvgStr = 'No nearby FVGs detected.';
          }
        } else {
          fvgStr = 'No recorded FVGs found on this timeframe.';
        }

        // Nearest OrderBlock calculation
        const obsList: OrderBlock[] = mData.obs || [];
        if (obsList.length > 0) {
          let closestOB: OrderBlock | null = null;
          let minDistance = Infinity;
          for (const o of obsList) {
            const mid = (o.high + o.low) / 2;
            const dist = Math.abs(mid - referencePrice);
            if (dist < minDistance) {
              minDistance = dist;
              closestOB = o;
            }
          }

          if (closestOB) {
            let distPips = 0;
            if (selectedTrade.symbol.includes('JPY')) distPips = minDistance * 100;
            else if (selectedTrade.symbol.includes('GOLD') || selectedTrade.symbol.includes('SILVER')) distPips = minDistance * 10;
            else if (selectedTrade.symbol.includes('BTC') || selectedTrade.symbol.includes('ETH') || selectedTrade.symbol.includes('SOL')) distPips = minDistance;
            else if (selectedTrade.symbol.includes('US30') || selectedTrade.symbol.includes('NAS100') || selectedTrade.symbol.includes('SPX500') || selectedTrade.symbol.includes('GER40')) distPips = minDistance;
            else distPips = minDistance * 10000;

            const unit = (selectedTrade.symbol.includes('BTC') || selectedTrade.symbol.includes('ETH') || selectedTrade.symbol.includes('SOL')) 
              ? 'USD' 
              : (selectedTrade.symbol.includes('US30') || selectedTrade.symbol.includes('NAS100') || selectedTrade.symbol.includes('SPX500') || selectedTrade.symbol.includes('GER40'))
              ? 'points'
              : 'pips';

            obStr = `Nearest OrderBlock is ${distPips.toFixed(1)} ${unit} away [${closestOB.type} BLOCK: ${closestOB.low.toFixed(selectedTrade.symbol.includes('JPY') ? 2 : 5)} - ${closestOB.high.toFixed(selectedTrade.symbol.includes('JPY') ? 2 : 5)}] (Broken: ${closestOB.isBroken ? 'Yes' : 'No'})`;
          } else {
            obStr = 'No nearby OrderBlocks detected.';
          }
        } else {
          obStr = 'No recorded OrderBlocks found on this timeframe.';
        }
      } else {
        atrStr = 'Volatility metrics: Fetch failed.';
        fvgStr = 'FVG data: Fetch failed.';
        obStr = 'OrderBlock data: Fetch failed.';
      }

      // 2. Parsing Market Sentiment
      if (sentimentRes.ok) {
        const sData = await sentimentRes.json();
        const sInfo = sData.sentiment?.[selectedTrade.symbol];
        if (sInfo) {
          sentimentStr = `Asset Sentiment Index score is ${sInfo.overallScore}/100 [Technical: ${sInfo.technicalScore}/100, News: ${sInfo.newsScore}/100]. Current market state is classified as ${sInfo.state} (RSI: ${sInfo.rsi}, Trend: ${sInfo.trend}, Orderbook Imbalance: ${sInfo.imbalance}%).`;
        } else {
          sentimentStr = 'Current sentiment state is neutral or unavailable.';
        }
      } else {
        sentimentStr = 'Sentiment Index data: Fetch failed.';
      }

      // Compiling the auto-fill payload
      const autoFillHeader = `[AUTO-FILL CONTEXT LOG - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]`;
      const autoFillPayload = `${autoFillHeader}\n• Current Market Sentiment: ${sentimentStr}\n• Ticker Volatility (ATR): ${atrStr}\n• ${fvgStr}\n• ${obStr}`;

      if (annotation.trim()) {
        setAnnotation(prev => prev + '\n\n' + autoFillPayload);
      } else {
        setAnnotation(autoFillPayload);
      }

    } catch (err) {
      console.error('Failed to auto-fill context:', err);
      const errorMsg = `[AUTO-FILL LOG EXCEPTION] Failed to retrieve real-time market metrics from direct interbank channels. Ensure backend server processes are responding.`;
      if (annotation.trim()) {
        setAnnotation(prev => prev + '\n\n' + errorMsg);
      } else {
        setAnnotation(errorMsg);
      }
    } finally {
      setAutoFilling(false);
    }
  };

  // Remove screenshot attachment
  const removeScreenshot = () => {
    setScreenshot('');
  };

  // Generous static insights about selected trade state
  const mockRiskRewardRatio = useMemo(() => {
    if (!selectedTrade) return '—';
    const targetDiff = Math.abs(selectedTrade.takeProfit - selectedTrade.entryPrice);
    const stopDiff = Math.abs(selectedTrade.entryPrice - selectedTrade.stopLoss);
    if (stopDiff === 0) return 'Arbitrary';
    return `1:${(targetDiff / stopDiff).toFixed(1)}`;
  }, [selectedTrade]);

  return (
    <div 
      id="trade-journal-workspace"
      className="bg-[#0a0a0b] border border-white/5 rounded-lg p-5 flex flex-col xl:flex-row gap-6"
    >
      {/* LEFT COLUMN: Closed Trades Catalog Scroll Box */}
      <div className="w-full xl:w-[360px] shrink-0 border-b xl:border-b-0 xl:border-r border-white/5 pb-6 xl:pb-0 xl:pr-6 flex flex-col h-[550px] overflow-hidden">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-500/20 text-indigo-400">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-white">
                Trades Catalog
              </h4>
              <p className="text-[9px] text-white/35 font-mono flex items-center gap-1.5">
                Log for performance self-review ({totalCount} entries)
                {fetching && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                )}
              </p>
            </div>
          </div>

          {/* Export to CSV Action */}
          <button
            id="btn-export-csv"
            type="button"
            onClick={handleExportToCSV}
            title="Export all closed trades to a CSV spreadsheet"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#10b981]/10 hover:bg-[#10b981]/15 text-[#10b981] hover:text-[#34d399] border border-[#10b981]/25 hover:border-[#10b981]/45 font-mono text-[9.5px] font-black uppercase tracking-wider cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Dynamic Strategy Tag Filter Dropdown */}
        <div className="mt-3 pb-3 border-b border-white/5 flex flex-col space-y-1.5 select-none">
          <div className="flex items-center justify-between">
            <label htmlFor="journal-tag-selector" className="text-[9px] uppercase font-mono text-white/30 font-bold tracking-tight">Strategy Style Tag</label>
            {selectedTagFilter !== 'ALL' && (
              <button
                id="btn-clear-tag-filter"
                onClick={() => setSelectedTagFilter('ALL')}
                className="text-[8px] text-indigo-400 hover:text-indigo-300 font-mono uppercase font-bold cursor-pointer transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
          <select
            id="journal-tag-selector"
            value={selectedTagFilter}
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            className="w-full bg-[#121214] border border-white/10 hover:border-white/15 text-[10px] text-white/90 px-2 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono tracking-tight cursor-pointer"
          >
            <option value="ALL">All Strategies (All Tags)</option>
            {allAvailableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        {/* Layout Settings Block */}
        <div className="mt-3 pb-3 border-b border-white/5 flex flex-col space-y-2 select-none">
          {/* Group by Symbol Option */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-mono text-white/30 font-bold tracking-tight">Group by Symbol</span>
            <button
              id="btn-toggle-group-by-symbol"
              type="button"
              onClick={() => setGroupBySymbol(!groupBySymbol)}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-[8px] font-mono font-black uppercase tracking-wider border cursor-pointer transition-all ${
                groupBySymbol 
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                  : 'bg-black/25 border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${groupBySymbol ? 'bg-[#34d399] animate-pulse' : 'bg-white/20'}`}></span>
              <span>{groupBySymbol ? 'ACTIVE' : 'INACTIVE'}</span>
            </button>
          </div>

          {groupBySymbol && (
            <div className="flex items-center space-x-2 font-mono text-[8px] text-indigo-300">
              <button
                id="btn-group-expand-all"
                type="button"
                onClick={handleExpandAll}
                className="hover:text-indigo-100 cursor-pointer uppercase transition-colors"
              >
                [+] Expand All
              </button>
              <span className="text-white/10">|</span>
              <button
                id="btn-group-collapse-all"
                type="button"
                onClick={handleCollapseAll}
                className="hover:text-indigo-100 cursor-pointer uppercase transition-colors"
              >
                [-] Collapse All
              </button>
            </div>
          )}

          {/* High Density Toggle Option */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[9px] uppercase font-mono text-white/30 font-bold tracking-tight">High Density Mode</span>
            <button
              id="btn-toggle-high-density"
              type="button"
              onClick={() => setHighDensity(!highDensity)}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-[8px] font-mono font-black uppercase tracking-wider border cursor-pointer transition-all ${
                highDensity 
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                  : 'bg-black/25 border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${highDensity ? 'bg-[#34d399] animate-pulse' : 'bg-white/20'}`}></span>
              <span>{highDensity ? 'ACTIVE' : 'INACTIVE'}</span>
            </button>
          </div>
        </div>

        {/* Closed trades list container */}
        <div className={`grid grid-cols-1 ${highDensity ? 'gap-1' : 'gap-2'} mt-4 overflow-y-auto pr-1 flex-1 relative`}>
          {fetching && closedTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4">
              <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-2" />
              <p className="text-[10px] font-mono text-white/30 uppercase">Syncing history...</p>
            </div>
          ) : totalCount === 0 && selectedTagFilter === 'ALL' ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4">
              <AlertCircle className="w-8 h-8 text-white/10 mb-2" />
              <p className="text-[10px] font-mono text-white/40 uppercase">No closed trades found</p>
              <p className="text-[9px] text-white/20 mt-1 leading-normal">
                Execute and close positions in the Trade Terminal or let standard price cycles auto-trigger a closed state.
              </p>
            </div>
          ) : totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4 border border-dashed border-white/5 bg-black/15 rounded">
              <AlertCircle className="w-6 h-6 text-white/20 mb-2" />
              <p className="text-[10px] font-mono text-white/45 uppercase tracking-wide">No tag matches</p>
              <p className="text-[9px] text-white/30 mt-1 leading-relaxed">
                No trades have the strategy tag "{selectedTagFilter}" attached yet. Please choose another tag or tag a trade first.
              </p>
            </div>
          ) : groupBySymbol ? (
            groupedTrades.map(({ symbol, trades: groupList, totalPnL }) => {
              const isCollapsed = !!collapsedSymbols[symbol];
              const groupPnLColor = totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-500';
              return (
                <div key={symbol} className={`border border-white/5 rounded bg-black/10 ${highDensity ? 'p-1.5 space-y-1' : 'p-1.5 space-y-1.5'}`}>
                  {/* Symbol Group Header Accordion Trigger */}
                  <div 
                    onClick={() => setCollapsedSymbols(prev => ({ ...prev, [symbol]: !isCollapsed }))}
                    className={`flex items-center justify-between ${highDensity ? 'p-1 px-1.5' : 'p-1.5'} bg-black/40 hover:bg-black/60 rounded cursor-pointer select-none border border-white/5 font-mono text-[10px] transition-colors`}
                  >
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-white/30 flex items-center justify-center">
                        {isCollapsed ? <ChevronRight className="w-3 h-3 text-white/40" /> : <ChevronDown className="w-3 h-3 text-white/40" />}
                      </span>
                      <span className="font-black text-white uppercase tracking-wider">{symbol}</span>
                      <span className="px-1.5 py-0.2 rounded bg-white/5 text-white/50 text-[8px] font-bold">
                        {groupList.length} {groupList.length === 1 ? 'trade' : 'trades'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-right">
                      <span className="text-white/30 text-[8px] uppercase">PnL:</span>
                      <span className={`font-semibold ${groupPnLColor}`}>
                        {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Grouped Trades Child list */}
                  {!isCollapsed && (
                    <div className={`grid grid-cols-1 ${highDensity ? 'gap-1' : 'gap-1.5'} pl-1`}>
                      {groupList.map((t) => {
                        const profitColor = t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500';
                        const ratingPreset = sentimentPresets.find(p => p.value === t.sentimentRating);
                        const isSelected = selectedTrade?.id === t.id;

                        return (
                          <div
                            key={t.id}
                            onClick={() => handleSelectTrade(t)}
                            role="button"
                            tabIndex={0}
                            className={`w-full text-left ${highDensity ? 'p-1.5 px-2' : 'p-2.5'} rounded border transition-all text-sm cursor-pointer select-none ${
                              isSelected 
                                ? 'bg-indigo-500/10 border-indigo-500/40 shadow-sm' 
                                : 'bg-black/20 hover:bg-black/40 border-white/5 hover:border-white/10'
                            }`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleSelectTrade(t);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1.5 font-mono">
                                <span className={`text-[8px] px-1 py-0.2 rounded font-black tracking-widest ${
                                  t.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                                }`}>
                                  {t.side}
                                </span>
                                {t.latency !== undefined && (
                                  <span className={`text-[7.5px] px-1 rounded font-bold leading-none ${
                                    t.latency > 45 ? 'text-amber-400' : 'text-white/40'
                                  }`} title={`MT5 Latency: ${t.latency}ms`}>
                                    ⚡ {t.latency}ms
                                  </span>
                                )}
                              </div>
                              <span className={`text-[10px] font-mono font-extrabold ${profitColor}`}>
                                {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                              </span>
                            </div>

                            {/* Secondary Metadata: Strategy style tags */}
                            {!highDensity && t.tags && t.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {t.tags.map((tag) => (
                                  <span 
                                    key={tag} 
                                    className="text-[7px] font-mono px-1 py-0.2 bg-indigo-500/10 border border-indigo-500/15 text-indigo-300 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Secondary Metadata: Date, Replay, Statuses */}
                            {!highDensity && (
                              <div className="flex items-center justify-between mt-2">
                                <div className="text-[8.5px] text-white/35 font-mono flex items-center space-x-1">
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span>{t.exitTimestamp ? new Date(t.exitTimestamp).toLocaleDateString() : new Date(t.timestamp).toLocaleDateString()}</span>
                                </div>

                                <div className="flex items-center space-x-1">
                                  {onReplayTrade && (
                                    <button
                                      id={`btn-replay-trade-g-${t.id}`}
                                      title="Jump historical replay engine to this trade open timestamp"
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         onReplayTrade(t);
                                      }}
                                      className="px-1 py-0.2 bg-indigo-500/15 hover:bg-indigo-600/35 text-indigo-300 hover:text-white rounded text-[7px] font-mono font-bold flex items-center border border-indigo-500/20 cursor-pointer transition-all"
                                    >
                                      <span>PLAY</span>
                                    </button>
                                  )}
                                  {ratingPreset ? (
                                    <span className={`text-[7px] px-1 rounded font-mono uppercase font-semibold ${ratingPreset.color}`}>
                                      {ratingPreset.label}
                                    </span>
                                  ) : t.annotation ? (
                                    <span className="text-[7px] bg-white/5 border border-white/10 text-white/45 px-1 rounded font-mono block">
                                      REVIEWED
                                    </span>
                                  ) : (
                                    <span className="text-[7px] bg-[#f43f5e]/10 border border-[#f43f5e]/10 text-rose-400 px-1 rounded font-mono block">
                                      PENDING
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            closedTrades.map((t) => {
              const profitColor = t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500';
              const ratingPreset = sentimentPresets.find(p => p.value === t.sentimentRating);
              const isSelected = selectedTrade?.id === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTrade(t)}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left ${highDensity ? 'p-1.5 px-2' : 'p-2.5'} rounded border transition-all text-sm cursor-pointer select-none ${
                    isSelected 
                      ? 'bg-indigo-500/10 border-indigo-500/40 shadow-md' 
                      : 'bg-black/30 hover:bg-black/50 border-white/5 hover:border-white/10'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectTrade(t);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-[11px] font-black text-white">{t.symbol}</span>
                      <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black tracking-widest ${
                        t.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {t.side}
                      </span>
                    </div>
                    <span className={`text-[11px] font-mono font-extrabold ${profitColor}`}>
                      {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                    </span>
                  </div>

                  {/* Render strategy style tags on each trade card if present */}
                  {!highDensity && t.tags && t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {t.tags.map((tag) => (
                        <span 
                           key={tag} 
                           className="text-[7.5px] font-mono px-1 py-0.2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {!highDensity && (
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="text-[9px] text-white/35 font-mono flex items-center space-x-1">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{t.exitTimestamp ? new Date(t.exitTimestamp).toLocaleDateString() : new Date(t.timestamp).toLocaleDateString()}</span>
                      </div>

                      {/* Badge for tags or annotations completed */}
                      <div className="flex items-center space-x-1.5">
                        {onReplayTrade && (
                          <button
                            id={`btn-replay-trade-${t.id}`}
                            title="Jump historical replay engine to this trade open timestamp"
                            onClick={(e) => {
                               e.stopPropagation();
                               onReplayTrade(t);
                            }}
                            className="px-1.5 py-0.5 bg-indigo-500/15 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded text-[7.5px] font-mono font-bold flex items-center space-x-0.5 border border-indigo-500/25 hover:border-indigo-500/45 cursor-pointer transition-all"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>REPLAY</span>
                          </button>
                        )}
                        {t.screenshot && (
                          <span className="p-0.5 bg-indigo-500/20 text-indigo-400 rounded" title="Screenshot Attached">
                            <Camera className="w-2.5 h-2.5" />
                          </span>
                        )}
                        {ratingPreset ? (
                          <span className={`text-[7.5px] px-1 py-0.2 rounded font-mono uppercase font-semibold ${ratingPreset.color}`}>
                            {ratingPreset.label}
                          </span>
                        ) : t.annotation ? (
                          <span className={`text-[7.5px] bg-white/5 border border-white/10 text-white/45 px-1 py-0.2 rounded font-mono block`}>
                            REVIEWED
                          </span>
                        ) : (
                          <span className="text-[7.5px] bg-[#f43f5e]/10 border border-[#f43f5e]/10 text-rose-400 px-1 py-0.2 rounded font-mono block animate-pulse">
                            PENDING
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modular Pagination Controls */}
        {!groupBySymbol && totalJournalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3 select-none font-mono">
            <button
              onClick={() => setJournalPage(prev => Math.max(1, prev - 1))}
              disabled={journalPage === 1}
              className={`px-2.5 py-1 text-[9px] font-bold rounded border transition-colors ${
                journalPage === 1
                  ? 'border-white/5 text-white/20 cursor-not-allowed bg-transparent'
                  : 'border-white/10 text-white/70 hover:text-white hover:bg-white/5 bg-black/20'
              }`}
            >
              ◀ PREV
            </button>
            <span className="text-[10px] text-white/50">
              Page <span className="text-white font-extrabold">{journalPage}</span> of <span className="text-white">{totalJournalPages}</span>
            </span>
            <button
              onClick={() => setJournalPage(prev => Math.min(totalJournalPages, prev + 1))}
              disabled={journalPage === totalJournalPages}
              className={`px-2.5 py-1 text-[9px] font-bold rounded border transition-colors ${
                journalPage === totalJournalPages
                  ? 'border-white/5 text-white/20 cursor-not-allowed bg-transparent'
                  : 'border-white/10 text-white/70 hover:text-white hover:bg-white/5 bg-black/20'
              }`}
            >
              NEXT ▶
            </button>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Review Interface / Form Workspace */}
      <div className="flex-1 flex flex-col justify-between min-h-[550px]">
        {!selectedTrade ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="p-4 bg-indigo-500/5 rounded-full border border-indigo-500/10 text-indigo-400 mb-4 animate-bounce">
              <BookOpen className="w-8 h-8" />
            </div>
            <h5 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              No Journal Trade Selected
            </h5>
            <p className="text-[10px] text-white/40 mt-1.5 max-w-[400px] leading-relaxed mx-auto">
              Please select a completed trade from the catalog on the left to begin compiling annotations, emotional audits, confluences, and chart evidence.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 1. Header Information of Selected Trade */}
            <div className="bg-[#050505] border border-white/5 rounded p-3 flex flex-wrap items-center justify-between gap-3 font-mono">
              <div>
                <span className="text-[8.5px] text-white/30 uppercase tracking-tight block">Target Symbol</span>
                <span className="text-sm font-black text-white">{selectedTrade.symbol}</span>
              </div>
              <div>
                <span className="text-[8.5px] text-white/30 uppercase tracking-tight block">Side</span>
                <span className={`text-[10.5px] font-black uppercase tracking-widest ${
                  selectedTrade.side === 'BUY' ? 'text-emerald-400' : 'text-rose-500'
                }`}>
                  {selectedTrade.side}
                </span>
              </div>
              <div>
                <span className="text-[8.5px] text-white/30 uppercase tracking-tight block">Execution Price</span>
                <span className="text-xs text-white/80">${selectedTrade.entryPrice.toFixed(5)}</span>
              </div>
              <div>
                <span className="text-[8.5px] text-white/30 uppercase tracking-tight block">Exit Price</span>
                <span className="text-xs text-white/80">${selectedTrade.exitPrice?.toFixed(5) || '—'}</span>
              </div>
              <div>
                <span className="text-[8.5px] text-white/30 uppercase tracking-tight block">R:R Parameter</span>
                <span className="text-xs text-indigo-400">{mockRiskRewardRatio}</span>
              </div>
              <div>
                <span className="text-[8.5px] text-white/30 tracking-tight block">PnL Realized</span>
                <span className={`text-xs font-black ${selectedTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {selectedTrade.pnl >= 0 ? '+' : ''}${selectedTrade.pnl.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Trade Correlation Strength Module */}
            <div className="bg-[#0b0c10]/90 border border-white/5 rounded p-4 flex flex-col gap-3 font-sans">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse animate-duration-1000 shrink-0" />
                  Asset Correlation Strength Matrix
                </h5>
                <span className="text-[8px] font-mono text-white/35 uppercase">
                  Co-movement alignment relative to {selectedTrade.symbol}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {getSymbolCorrelations(selectedTrade.symbol).map((cor) => {
                  const isPositive = cor.coefficient >= 0;
                  const isStrong = Math.abs(cor.coefficient) >= 0.7;
                  const absPct = Math.round(Math.abs(cor.coefficient) * 100);

                  // Styling determinations
                  let badgeBg = 'bg-white/5 text-white/50 border-white/10';
                  let progressBg = 'bg-white/10';
                  if (isStrong) {
                    badgeBg = isPositive 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 font-black shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                      : 'bg-rose-500/10 text-rose-450 border-rose-500/25 font-black shadow-[0_0_8px_rgba(244,63,94,0.1)]';
                    progressBg = isPositive ? 'bg-emerald-500/40' : 'bg-rose-500/40';
                  } else if (Math.abs(cor.coefficient) >= 0.3) {
                    badgeBg = isPositive
                      ? 'bg-emerald-500/5 text-emerald-300 border-emerald-500/15'
                      : 'bg-rose-500/5 text-rose-300 border-rose-500/15';
                    progressBg = isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20';
                  }

                  return (
                    <div 
                      key={cor.symbol}
                      className="p-2.5 bg-black/40 border border-white/5 hover:border-white/10 transition-all rounded flex flex-col justify-between"
                      title={cor.description}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-white/90">{cor.symbol}</span>
                        <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border uppercase ${badgeBg}`}>
                          {isPositive ? '+' : ''}{cor.coefficient.toFixed(2)}
                        </span>
                      </div>

                      {/* Small inline visual progress bar */}
                      <div className="w-full bg-white/[0.03] h-1 rounded overflow-hidden mt-2 mb-1">
                        <div 
                          className={`h-full rounded-full transition-all ${progressBg}`}
                          style={{ width: `${absPct}%` }}
                        />
                      </div>

                      <div className="text-[7.5px] font-sans text-white/35 mt-1 leading-normal text-ellipsis overflow-hidden">
                        {cor.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Entry Reasoning and Pre-defined Market Note Block */}
            <div className="bg-[#09090d] border border-indigo-500/15 rounded p-4 flex flex-col gap-2">
              <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 pb-2 border-b border-white/5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Pre-defined Entry reasoning & Note
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                <div className="relative group/reason">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono text-white/30 uppercase tracking-tight block">Automated Strategy Reason:</span>
                    {contextData && (
                      <span className="flex items-center gap-1 text-[8px] font-mono font-extrabold text-[#34d399] bg-[#10b981]/15 border border-[#10b981]/20 px-1.5 py-0.5 rounded leading-none transition-all group-hover/reason:bg-[#10b981]/25 animate-fadeIn">
                        <Sparkles className="w-2.5 h-2.5 animate-pulse text-[#10b981]" />
                        <span>CONTEXT ATTACHED</span>
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] text-white/70 font-sans leading-relaxed italic mt-1 bg-black/20 p-2.5 border rounded transition-all ${
                    contextData 
                      ? 'border-[#10b981]/15 group-hover/reason:border-[#10b981]/40 cursor-help bg-[#10b981]/[0.01] group-hover/reason:bg-[#10b981]/[0.03]' 
                      : 'border-white/5'
                  }`}>
                    {selectedTrade.reason || 'No strategy template reason defined.'}
                  </p>

                  {/* Tooltip Content Popover aligned with group/reason hover */}
                  {contextData && (
                    <div className="absolute z-50 bottom-full left-0 mb-2 w-80 p-3.5 bg-[#08080a]/95 border border-[#10b981]/20 text-white rounded shadow-[0_4px_24px_rgba(0,0,0,0.85)] text-[10px] leading-relaxed font-mono opacity-0 group-hover/reason:opacity-100 transition-all duration-150 pointer-events-none text-left backdrop-blur-md">
                      <div className="border-b border-[#10b981]/20 pb-1.5 mb-2 flex items-center justify-between">
                        <span className="font-bold text-[#34d399] uppercase text-[8.5px] tracking-widest flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#34d399]" />
                          Market Context Metrics
                        </span>
                        <span className="text-[7.5px] text-white/30 font-bold">TERMINAL RECON</span>
                      </div>
                      <div className="space-y-2.5">
                        {contextData.sentiment && (
                          <div>
                            <span className="text-[#34d399]/75 font-bold text-[8px] block uppercase tracking-wider mb-0.5">📊 Market Sentiment:</span>
                            <span className="text-white/85 font-sans text-[9.5px] leading-normal block bg-black/40 p-1.5 border border-white/5 rounded">{contextData.sentiment}</span>
                          </div>
                        )}
                        {contextData.atr && (
                          <div>
                            <span className="text-[#34d399]/75 font-bold text-[8px] block uppercase tracking-wider mb-0.5">⚡ Volatility (14-ATR):</span>
                            <span className="text-white/85 font-mono text-[9px] leading-normal block bg-black/40 p-1.5 border border-white/5 rounded">{contextData.atr}</span>
                          </div>
                        )}
                        {contextData.fvg && (
                          <div>
                            <span className="text-[#34d399]/75 font-bold text-[8px] block uppercase tracking-wider mb-0.5">🔳 Near Fair Value Gap:</span>
                            <span className="text-white/85 font-mono text-[9px] leading-normal block bg-black/40 p-1.5 border border-white/5 rounded">{contextData.fvg}</span>
                          </div>
                        )}
                        {contextData.ob && (
                          <div>
                            <span className="text-[#34d399]/75 font-bold text-[8px] block uppercase tracking-wider mb-0.5">🧱 Near Order Block:</span>
                            <span className="text-white/85 font-mono text-[9px] leading-normal block bg-black/40 p-1.5 border border-white/5 rounded">{contextData.ob}</span>
                          </div>
                        )}
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-6 border-[5px] border-transparent border-t-[#08080a]/95"></div>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[8px] font-mono text-indigo-400/80 uppercase tracking-tight block font-bold">Pre-defined Market Note:</span>
                  <p className="text-[10.5px] text-indigo-200 font-sans leading-relaxed font-semibold mt-1 bg-indigo-500/5 p-2.5 border border-indigo-500/10 rounded break-words">
                    {selectedTrade.marketNote || 'No pre-defined market entry note was supplied.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid for Sentiment Rating and Confluences */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* 2. Sentiment Rating / Psychological Audit Section */}
              <div className="bg-black/30 p-4 rounded border border-white/5 flex flex-col justify-between">
                <div>
                  <h5 className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5 pb-2 border-b border-white/5">
                    <Smile className="w-3.5 h-3.5 text-indigo-400" />
                    Trader Psychological State
                  </h5>
                  <p className="text-[9px] text-white/35 font-sans mt-1">
                    Audit your emotional sentiment when managing this trade. Identify greed or fear bias.
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3.5">
                    {sentimentPresets.map((preset) => {
                      const PresetIcon = preset.icon;
                      const active = sentimentRating === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setSentimentRating(preset.value)}
                          className={`flex items-center space-x-2 p-2 rounded text-[10px] font-mono font-semibold uppercase border transition-all cursor-pointer ${
                            active 
                              ? 'bg-indigo-500/10 border-indigo-400 text-white' 
                              : 'bg-black/40 hover:bg-black/60 border-white/5 text-white/50'
                          }`}
                        >
                          <PresetIcon className={`w-3.5 h-3.5 ${active ? 'text-indigo-400' : 'text-white/30'}`} />
                          <span className="truncate">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Simulated feedback tip based on emotion */}
                <div className="mt-4 p-2 bg-indigo-500/5 border border-indigo-500/10 rounded flex gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[9.5px] text-white/40 leading-relaxed font-sans">
                    {sentimentRating === 'DISCIPLINED' && 'Excellent. Trading plan execution remains objective and repeatable.'}
                    {sentimentRating === 'ANXIOUS' && 'Drawn-out chart watching triggers over-management. Trade with alerts instead.'}
                    {sentimentRating === 'GREEDY' && 'Avoid increasing lot sizes to hunt revenge target payouts. Maintain cold parameters.'}
                    {sentimentRating === 'FEARFUL' && 'Doubt in setups indicates leverage is too high. Scale sizes down.'}
                    {sentimentRating === 'FOMO' && 'Acknowledge missing a trade is normal. Chasing creates critical structural disadvantages.'}
                    {sentimentRating === 'PATIENT' && 'Fidelity in waiting for setup bias pays. Repeat this pattern.'}
                  </p>
                </div>
              </div>

              {/* 3. Trade Confluences and Verification list */}
              <div className="bg-black/30 p-4 rounded border border-white/5 flex flex-col justify-between">
                <div>
                  <h5 className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5 pb-2 border-b border-white/5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Technical Confluences Aligned
                  </h5>
                  <p className="text-[9px] text-white/35 font-sans mt-0.5">
                    Institutional alignment triggers checked at entry point.
                  </p>

                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center space-x-2 text-[10.5px]">
                      <div className="p-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-white/70">Liquidity Sweep Observed</span>
                    </div>

                    <div className="flex items-center space-x-2 text-[10.5px]">
                      <div className="p-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-white/70">High-Probability FVG Entry</span>
                    </div>

                    <div className="flex items-center space-x-2 text-[10.5px]">
                      <div className="p-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-white/70">Order Block Mitigation</span>
                    </div>

                    <div className="flex items-center space-x-2 text-[10.5px]">
                      <div className="p-0.5 bg-indigo-500/10 text-indigo-400 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-white/70">Macro Daily Bias Concordance</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 mt-4 flex items-center justify-between">
                  <span className="text-[8.5px] font-mono text-white/30 uppercase">Entry Confidence Factor:</span>
                  <span className="text-xs font-mono font-bold text-white bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/20">
                    {selectedTrade.confidence || 75}%
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Notes & Annotations Textarea */}
            <div className="bg-black/30 p-4 rounded border border-white/5">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h5 className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Journal Reflection & Retrospective Notes
                </h5>
                <button
                  id="btn-auto-fill-context"
                  type="button"
                  disabled={autoFilling}
                  onClick={handleAutoFillContext}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-300 hover:text-white rounded text-[8.5px] font-mono font-bold cursor-pointer transition-all disabled:opacity-50"
                  title="Auto-fill latest market sentiment, ATR volatility, and closest FVG/OrderBlock from live terminal feeds"
                >
                  <Sparkles className={`w-3 h-3 ${autoFilling ? 'animate-spin' : ''}`} />
                  <span>{autoFilling ? 'SCANNING...' : 'AUTO-FILL CONTEXT'}</span>
                </button>
              </div>
              <text-area className="block w-full mt-3">
                <textarea
                  id="trade-journal-reflection-notes"
                  value={annotation}
                  onChange={(e) => setAnnotation(e.target.value)}
                  placeholder="Record execution details, mistakes made, lesson learned, or why this trade closed out early... Keep parameters objective."
                  className="w-full h-24 bg-black/60 rounded border border-white/10 hover:border-white/15 focus:border-indigo-500/50 p-2.5 font-sans text-[11px] text-white/50 focus:text-white leading-relaxed focus:outline-none focus:ring-0 placeholder-white/20 resize-none"
                />
              </text-area>
            </div>

            {/* 5. Screenshots Attachment and Drag Drop Area */}
            <div className="bg-black/30 p-4 rounded border border-white/5">
              <h5 className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5 pb-2 border-b border-white/5">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                Visual Evidence (Chart Screenshots)
              </h5>
              
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Image upload drop zone container */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`bg-black/40 border border-dashed rounded flex flex-col items-center justify-center py-6 px-4 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-indigo-400 bg-indigo-500/5' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => document.getElementById('journal-file-upload')?.click()}
                >
                  <input
                    id="journal-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  <Upload className="w-6 h-6 text-white/20 mb-2" />
                  <p className="text-[10px] font-mono text-white/60 uppercase">Drag & Drop Image</p>
                  <p className="text-[9px] text-white/30 font-sans mt-1">or Click to select from file system</p>
                  <p className="text-[8px] text-white/20 font-mono mt-1.5">PNG, JPG formats supported</p>
                </div>

                {/* Screenshot preview or instructions */}
                <div className="bg-black/20 border border-white/5 rounded flex flex-col items-center justify-center p-2 min-h-[110px] relative overflow-hidden group">
                  {screenshot ? (
                    <div className="w-full h-full relative flex items-center justify-center min-h-[110px]">
                      <img 
                        src={screenshot} 
                        alt="Trade screenshot" 
                        className="max-h-[110px] rounded object-contain border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const w = window.open();
                            if (w) {
                              w.document.write(`<img src="${screenshot}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                            }
                          }}
                          className="p-1 text-white bg-indigo-500 hover:bg-indigo-600 rounded"
                          title="Open full size"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={removeScreenshot}
                          className="p-1 text-white bg-rose-500 hover:bg-rose-600 rounded"
                          title="Delete screenshot link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-6 h-6 text-white/10 mx-auto mb-1.5" />
                      <p className="text-[9px] text-white/30 font-sans leading-normal">
                        No screenshot attached to this review. Attach trade setups to review patterns later.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* 6. Tag Management Interface */}
            <div className="bg-black/30 p-4 rounded border border-white/5">
              <h5 className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5 pb-2 border-b border-white/5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                Setup Tag Labeling
              </h5>

              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {tags.map((tag) => (
                  <span 
                    key={tag}
                    className="flex items-center space-x-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded font-mono text-[9px] text-white/70"
                  >
                    <span>{tag}</span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-white/30 hover:text-[#f43f5e] cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                
                <input
                  id="trade-journal-tag-input"
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="New tag [Enter]..."
                  className="bg-black/50 text-[10px] text-white font-mono rounded border border-white/10 hover:border-white/15 focus:border-indigo-500/50 px-2 py-0.5 focus:outline-none focus:ring-0 placeholder-white/20 w-32"
                />
              </div>

              {/* Strategy tag style suggestion chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-white/5">
                <span className="text-[8.5px] text-white/30 font-mono uppercase tracking-tight mr-1">Suggestions:</span>
                {['#ICT_Setup', '#NewsEvent', '#MeanReversion', '#TrendFollowing', '#Breakout'].map((preset) => {
                  const alreadyChosen = tags.some(t => t.toLowerCase() === preset.toLowerCase());
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={alreadyChosen}
                      onClick={() => {
                        setTags([...tags, preset]);
                      }}
                      className={`text-[8.5px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        alreadyChosen
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400/50 opacity-40 cursor-not-allowed font-medium'
                          : 'bg-white/5 border-white/10 hover:border-white/20 text-white/60 hover:text-white font-medium'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controls panel: Save and notification status */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="font-mono text-[9px]">
                {saveStatus === 'SUCCESS' && (
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Journal updated successfully.</span>
                  </span>
                )}
                {saveStatus === 'ERROR' && (
                  <span className="text-rose-500 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Save failed. Verify backend.</span>
                  </span>
                )}
                {saveStatus === 'IDLE' && (
                  <span className="text-white/20 uppercase tracking-widest block font-mono">
                    Systemic Review Layer
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-journal-save"
                  type="button"
                  disabled={saving}
                  onClick={handleSaveJournal}
                  className="flex items-center space-x-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 py-2 rounded text-[10.5px] font-mono font-black uppercase text-white cursor-pointer transition-all shadow-md shadow-indigo-500/10"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Review'}</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
