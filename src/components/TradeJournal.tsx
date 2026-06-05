import React, { useState, useMemo } from 'react';
import { Trade, MarketSymbol } from '../types';
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
  Lightbulb
} from 'lucide-react';

interface TradeJournalProps {
  trades: Trade[];
  onTradeUpdated: () => void;
}

export default function TradeJournal({ trades, onTradeUpdated }: TradeJournalProps) {
  // Only interested in CLOSED trades for journal self-review
  const closedTrades = useMemo(() => {
    return trades
      .filter(t => t.status === 'CLOSED')
      .sort((a, b) => {
        const timeA = a.exitTimestamp ? new Date(a.exitTimestamp).getTime() : new Date(a.timestamp).getTime();
        const timeB = b.exitTimestamp ? new Date(b.exitTimestamp).getTime() : new Date(b.timestamp).getTime();
        return timeB - timeA; // most recent first
      });
  }, [trades]);

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

  // List of all distinct strategy tags for dropdown
  const allAvailableTags = useMemo(() => {
    const tagSet = new Set<string>();
    // Guarantee basic strategy style options are present
    tagSet.add('#ICT_Setup');
    tagSet.add('#NewsEvent');
    tagSet.add('#MeanReversion');
    tagSet.add('#TrendFollowing');
    tagSet.add('#Breakout');
    
    closedTrades.forEach((t) => {
      if (t.tags) {
        t.tags.forEach((tag) => {
          let cleaned = tag.trim();
          if (cleaned) {
            if (!cleaned.startsWith('#')) {
              cleaned = '#' + cleaned;
            }
            tagSet.add(cleaned);
          }
        });
      }
    });
    return Array.from(tagSet);
  }, [closedTrades]);

  // Apply Tag Filtering to closed trades catalog list
  const filteredClosedTrades = useMemo(() => {
    if (selectedTagFilter === 'ALL') return closedTrades;
    return closedTrades.filter((t) => {
      if (!t.tags) return false;
      return t.tags.some((tag) => {
        let cleaned = tag.trim();
        if (!cleaned.startsWith('#')) {
          cleaned = '#' + cleaned;
        }
        return cleaned.toLowerCase() === selectedTagFilter.toLowerCase();
      });
    });
  }, [closedTrades, selectedTagFilter]);

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
              <p className="text-[9px] text-white/35 font-mono">
                Log for performance self-review ({filteredClosedTrades.length} entries)
              </p>
            </div>
          </div>
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

        {/* Closed trades list container */}
        <div className="grid grid-cols-1 gap-2 mt-4 overflow-y-auto pr-1 flex-1">
          {closedTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4">
              <AlertCircle className="w-8 h-8 text-white/10 mb-2" />
              <p className="text-[10px] font-mono text-white/40 uppercase">No closed trades found</p>
              <p className="text-[9px] text-white/20 mt-1 leading-normal">
                Execute and close positions in the Trade Terminal or let standard price cycles auto-trigger a closed state.
              </p>
            </div>
          ) : filteredClosedTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4 border border-dashed border-white/5 bg-black/15 rounded">
              <AlertCircle className="w-6 h-6 text-white/20 mb-2" />
              <p className="text-[10px] font-mono text-white/45 uppercase tracking-wide">No tag matches</p>
              <p className="text-[9px] text-white/30 mt-1 leading-relaxed">
                No trades have the strategy tag "{selectedTagFilter}" attached yet. Please choose another tag or tag a trade first.
              </p>
            </div>
          ) : (
            filteredClosedTrades.map((t) => {
              const profitColor = t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500';
              const ratingPreset = sentimentPresets.find(p => p.value === t.sentimentRating);
              const isSelected = selectedTrade?.id === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTrade(t)}
                  className={`w-full text-left p-2.5 rounded border transition-all text-sm cursor-pointer select-none ${
                    isSelected 
                      ? 'bg-indigo-500/10 border-indigo-500/40 shadow-md' 
                      : 'bg-black/30 hover:bg-black/50 border-white/5 hover:border-white/10'
                  }`}
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
                  {t.tags && t.tags.length > 0 && (
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

                  <div className="flex items-center justify-between mt-2.5">
                    <div className="text-[9px] text-white/35 font-mono flex items-center space-x-1">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{t.exitTimestamp ? new Date(t.exitTimestamp).toLocaleDateString() : new Date(t.timestamp).toLocaleDateString()}</span>
                    </div>

                    {/* Badge for tags or annotations completed */}
                    <div className="flex items-center space-x-1.5">
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
                        <span className="text-[7.5px] bg-white/5 border border-white/10 text-white/45 px-1 py-0.2 rounded font-mono block">
                          REVIEWED
                        </span>
                      ) : (
                        <span className="text-[7.5px] bg-[#f43f5e]/10 border border-[#f43f5e]/10 text-rose-400 px-1 py-0.2 rounded font-mono block animate-pulse">
                          PENDING
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
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
                <span className="text-[8.5px] text-white/30 uppercase tracking-tight block">PnL Realized</span>
                <span className={`text-xs font-black ${selectedTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {selectedTrade.pnl >= 0 ? '+' : ''}${selectedTrade.pnl.toFixed(2)}
                </span>
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
              <h5 className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5 pb-2 border-b border-white/5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Journal Reflection & Retrospective Notes
              </h5>
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
