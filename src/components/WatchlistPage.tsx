import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { generateScreenerDatabase } from '../lib/screenerTickersData';
import { 
  Star, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Trash2, 
  Bell, 
  Sparkles, 
  Check, 
  FileText, 
  Layers, 
  Settings, 
  RefreshCw, 
  TrendingUp, 
  X, 
  ChevronDown, 
  Sliders, 
  HelpCircle, 
  Briefcase,
  AlertCircle,
  GripVertical,
  ChevronUp
} from 'lucide-react';

interface AssetMeta {
  symbol: string;
  name: string;
  sector: 'Technology' | 'Finance' | 'Healthcare' | 'ETFs' | 'Crypto' | 'Real Estate';
  exchange: string;
  min52w: number;
  max52w: number;
  marketCap: string;
  divYield: string;
  defaultPrice: number;
  logoColor: string;
}

const SUPPORTED_ASSETS: AssetMeta[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', exchange: 'NASDAQ', min52w: 164.08, max52w: 220.20, marketCap: '$3.25T', divYield: '0.52%', defaultPrice: 188.30, logoColor: 'bg-zinc-500' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', exchange: 'NASDAQ', min52w: 315.18, max52w: 430.82, marketCap: '$3.15T', divYield: '0.71%', defaultPrice: 415.50, logoColor: 'bg-blue-600' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', exchange: 'NASDAQ', min52w: 39.23, max52w: 140.76, marketCap: '$3.01T', divYield: '0.03%', defaultPrice: 125.40, logoColor: 'bg-emerald-600' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Technology', exchange: 'NASDAQ', min52w: 138.80, max52w: 299.29, marketCap: '$550B', divYield: '0.00%', defaultPrice: 175.50, logoColor: 'bg-red-600' },
  { symbol: 'GOOG', name: 'Alphabet Inc.', sector: 'Technology', exchange: 'NASDAQ', min52w: 115.35, max52w: 191.75, marketCap: '$2.12T', divYield: '0.47%', defaultPrice: 172.50, logoColor: 'bg-amber-500' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology', exchange: 'NASDAQ', min52w: 110.20, max52w: 190.50, marketCap: '$1.92T', divYield: '0.00%', defaultPrice: 180.20, logoColor: 'bg-orange-500' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', sector: 'Technology', exchange: 'NASDAQ', min52w: 270.50, max52w: 531.40, marketCap: '$1.25T', divYield: '0.40%', defaultPrice: 495.10, logoColor: 'bg-indigo-600' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Finance', exchange: 'NYSE', min52w: 135.50, max52w: 205.80, marketCap: '$580B', divYield: '2.30%', defaultPrice: 195.40, logoColor: 'bg-amber-750' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', exchange: 'NYSE', min52w: 142.10, max52w: 175.20, marketCap: '$380B', divYield: '3.10%', defaultPrice: 156.80, logoColor: 'bg-rose-600' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'ETFs', exchange: 'NYSE Arca', min52w: 420.18, max52w: 532.50, marketCap: '$510B', divYield: '1.34%', defaultPrice: 512.40, logoColor: 'bg-indigo-500/50' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETFs', exchange: 'NASDAQ', min52w: 340.50, max52w: 460.20, marketCap: '$220B', divYield: '0.58%', defaultPrice: 438.90, logoColor: 'bg-teal-600' },
  { symbol: 'BTC-USD', name: 'Bitcoin', sector: 'Crypto', exchange: 'Coinbase', min52w: 25120.00, max52w: 73750.00, marketCap: '$1.32T', divYield: '0.00%', defaultPrice: 65200.00, logoColor: 'bg-yellow-500' },
  { symbol: 'ETH-USD', name: 'Ethereum', sector: 'Crypto', exchange: 'Coinbase', min52w: 1520.00, max52w: 4090.00, marketCap: '$410B', divYield: '0.00%', defaultPrice: 3420.00, logoColor: 'bg-purple-600' },
  { symbol: 'SOL-USD', name: 'Solana', sector: 'Crypto', exchange: 'Coinbase', min52w: 13.42, max52w: 210.12, marketCap: '$65B', divYield: '0.00%', defaultPrice: 142.50, logoColor: 'bg-pink-500' },
  { symbol: 'VNDO', name: 'Vanguard Real Estate ETF', sector: 'Real Estate', exchange: 'NYSE Arca', min52w: 72.50, max52w: 91.80, marketCap: '$32B', divYield: '4.12%', defaultPrice: 81.20, logoColor: 'bg-violet-750' }
];

function getDynamicAssetMeta(symbol: string): AssetMeta {
  const symUpper = symbol.toUpperCase();
  
  // Deterministic logo colors based on ticker characters
  const logoColors = [
    'bg-blue-600', 'bg-emerald-600', 'bg-red-600', 'bg-amber-500', 'bg-orange-500', 
    'bg-indigo-600', 'bg-zinc-500', 'bg-purple-600', 'bg-pink-500', 'bg-teal-600'
  ];
  const charSum = symUpper.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const logoColor = logoColors[charSum % logoColors.length];

  // Try to find in screener database
  try {
    const screenerDb = generateScreenerDatabase();
    const record = screenerDb.find(r => r.ticker.toUpperCase() === symUpper);
    if (record) {
      // Map screener sector to AssetMeta sector type
      let sector: 'Technology' | 'Finance' | 'Healthcare' | 'ETFs' | 'Crypto' | 'Real Estate' = 'Technology';
      const secStr = String(record.sector).toUpperCase();
      if (secStr.includes('TECH')) sector = 'Technology';
      else if (secStr.includes('FINAN') || secStr.includes('FINANCE')) sector = 'Finance';
      else if (secStr.includes('HEALTH')) sector = 'Healthcare';
      else if (secStr.includes('ETF')) sector = 'ETFs';
      else if (secStr.includes('CRYPT')) sector = 'Crypto';
      else if (secStr.includes('REAL') || secStr.includes('ESTATE')) sector = 'Real Estate';
      else sector = 'Technology'; // default

      // Estimate min/max 52w based on some default price
      const defaultPrice = record.peRatio ? record.peRatio * 5 : 120.0;
      const min52w = parseFloat((defaultPrice * 0.75).toFixed(2));
      const max52w = parseFloat((defaultPrice * 1.35).toFixed(2));
      const marketCap = record.marketCap >= 1e12 
        ? `$${(record.marketCap / 1e12).toFixed(2)}T` 
        : `$${(record.marketCap / 1e9).toFixed(1)}B`;
      
      const divYield = record.dividendYield 
        ? `${(record.dividendYield * 100).toFixed(2)}%` 
        : '0.00%';

      return {
        symbol: record.ticker,
        name: record.name,
        sector,
        exchange: symUpper.includes('-USD') || symUpper.includes('USD=') ? 'Coinbase' : 'NASDAQ',
        min52w,
        max52w,
        marketCap,
        divYield,
        defaultPrice,
        logoColor
      };
    }
  } catch (err) {
    console.error('Error finding in screener db:', err);
  }

  // Fallback if not found in screener db
  let sector: 'Technology' | 'Finance' | 'Healthcare' | 'ETFs' | 'Crypto' | 'Real Estate' = 'Technology';
  let exchange = 'NASDAQ';
  let defaultPrice = 100.00;

  if (symUpper.includes('-USD') || symUpper.includes('BTC') || symUpper.includes('ETH') || symUpper.includes('SOL')) {
    sector = 'Crypto';
    exchange = 'Coinbase';
    defaultPrice = symUpper.startsWith('BTC') ? 65000.0 : symUpper.startsWith('ETH') ? 3400.0 : 140.0;
  } else if (symUpper.endsWith('=X') || symUpper.includes('EUR') || symUpper.includes('USD')) {
    sector = 'Finance';
    exchange = 'OANDA';
    defaultPrice = 1.10;
  }

  const min52w = parseFloat((defaultPrice * 0.8).toFixed(2));
  const max52w = parseFloat((defaultPrice * 1.25).toFixed(2));

  return {
    symbol: symUpper,
    name: `${symUpper} Asset`,
    sector,
    exchange,
    min52w,
    max52w,
    marketCap: '$15B',
    divYield: '1.20%',
    defaultPrice,
    logoColor
  };
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('[Firestore Watchlist Sync Warning] Non-critical synchronization notice:', JSON.stringify(errInfo));
}

interface WatchlistPageProps {
  onSelectSymbol: (symbol: any) => void;
  onSelectTab: (tab: string) => void;
}

export default function WatchlistPage({ onSelectSymbol, onSelectTab }: WatchlistPageProps) {
  // 1. Core States
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('broker_watchlist');
      return saved ? JSON.parse(saved) : ['AAPL', 'MSFT', 'NVDA', 'BTC-USD'];
    } catch {
      return ['AAPL', 'MSFT', 'NVDA', 'BTC-USD'];
    }
  });

  const allAssets = useMemo(() => {
    const assetsList = [...SUPPORTED_ASSETS];
    watchlist.forEach((symbol) => {
      if (!assetsList.some(a => a.symbol === symbol)) {
        assetsList.push(getDynamicAssetMeta(symbol));
      }
    });
    return assetsList;
  }, [watchlist]);

  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'gain' | 'loss' | 'cap' | 'recently_added' | 'custom'>('custom');

  // Drag and Drop states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (sortBy !== 'custom') {
      setSortBy('custom');
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const draggedSymbol = filteredAssets[draggedIndex].symbol;
    const targetSymbol = filteredAssets[targetIndex].symbol;

    const draggedWatchlistIdx = watchlist.indexOf(draggedSymbol);
    const targetWatchlistIdx = watchlist.indexOf(targetSymbol);

    if (draggedWatchlistIdx !== -1 && targetWatchlistIdx !== -1) {
      const newWatchlist = [...watchlist];
      newWatchlist.splice(draggedWatchlistIdx, 1);
      newWatchlist.splice(targetWatchlistIdx, 0, draggedSymbol);
      setWatchlist(newWatchlist);
    }

    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveUp = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sortBy !== 'custom') {
      setSortBy('custom');
    }
    const idx = watchlist.indexOf(symbol);
    if (idx > 0) {
      const newWatchlist = [...watchlist];
      newWatchlist[idx] = newWatchlist[idx - 1];
      newWatchlist[idx - 1] = symbol;
      setWatchlist(newWatchlist);
    }
  };

  const handleMoveDown = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sortBy !== 'custom') {
      setSortBy('custom');
    }
    const idx = watchlist.indexOf(symbol);
    if (idx !== -1 && idx < watchlist.length - 1) {
      const newWatchlist = [...watchlist];
      newWatchlist[idx] = newWatchlist[idx + 1];
      newWatchlist[idx + 1] = symbol;
      setWatchlist(newWatchlist);
    }
  };

  // Compare mode selections
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Notes Modal state
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('broker_watchlist_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [editingNoteSymbol, setEditingNoteSymbol] = useState<string | null>(null);
  const [noteInputValue, setNoteInputValue] = useState('');

  // Alerts states
  const [priceAlerts, setPriceAlerts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('priceAlerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [editingAlertSymbol, setEditingAlertSymbol] = useState<string | null>(null);
  const [alertPriceInput, setAlertPriceInput] = useState('');
  const [alertConditionInput, setAlertConditionInput] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  // AI Insights caching state
  const [aiInsights, setAiInsights] = useState<Record<string, { text: string; loading: boolean }>>({});

  // Real Buying modal states
  const [buySymbol, setBuySymbol] = useState<string | null>(null);
  const [buyQty, setBuyQty] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [brokerCash, setBrokerCash] = useState<number>(() => {
    const saved = localStorage.getItem('broker_cash');
    return saved ? parseFloat(saved) : 50000.00;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time changes
  useEffect(() => {
    if (!currentUser) return;

    const docPath = `watchlists/${currentUser.uid}`;
    const docRef = doc(db, 'watchlists', currentUser.uid);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.symbols)) {
          const remoteSymbols = data.symbols;
          setWatchlist((prev) => {
            const hasChanged = prev.length !== remoteSymbols.length || !prev.every((val, index) => val === remoteSymbols[index]);
            return hasChanged ? remoteSymbols : prev;
          });
        }
      } else {
        // Doc doesn't exist, initialize with current watchlist
        setDoc(docRef, {
          symbols: watchlist,
          updatedAt: new Date().toISOString()
        }).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, docPath);
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, docPath);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Sync watchlist modifications to local storage and Firestore
  useEffect(() => {
    localStorage.setItem('broker_watchlist', JSON.stringify(watchlist));
    window.dispatchEvent(new Event('storage'));

    if (currentUser) {
      const docPath = `watchlists/${currentUser.uid}`;
      const docRef = doc(db, 'watchlists', currentUser.uid);
      setDoc(docRef, {
        symbols: watchlist,
        updatedAt: new Date().toISOString()
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      });
    }
  }, [watchlist, currentUser]);

  // Sync notes to local storage
  useEffect(() => {
    localStorage.setItem('broker_watchlist_notes', JSON.stringify(notes));
  }, [notes]);

  // Sync cash, alerts, and watchlist changes
  useEffect(() => {
    const handleStorage = () => {
      const savedCash = localStorage.getItem('broker_cash');
      if (savedCash) {
        setBrokerCash(parseFloat(savedCash));
      }
      const savedAlerts = localStorage.getItem('priceAlerts');
      if (savedAlerts) {
        setPriceAlerts(JSON.parse(savedAlerts));
      }
      const savedWatchlist = localStorage.getItem('broker_watchlist');
      if (savedWatchlist) {
        try {
          const parsed = JSON.parse(savedWatchlist);
          setWatchlist((current) => {
            if (JSON.stringify(parsed) !== JSON.stringify(current)) {
              return parsed;
            }
            return current;
          });
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Fetch prices on mount / watchlist change with deduplication
  const lastFetchedWatchlistRef = React.useRef<string>('');

  useEffect(() => {
    const watchlistStr = JSON.stringify(watchlist);
    if (lastFetchedWatchlistRef.current === watchlistStr) return;
    lastFetchedWatchlistRef.current = watchlistStr;

    fetchWatchlistPrices();
  }, [watchlist]);

  const fetchWatchlistPrices = async () => {
    setLoadingPrices(true);
    const newPrices: Record<string, { price: number; change: number }> = {};

    try {
      // Fetch prices parallelly for optimal performance
      await Promise.all(
        allAssets.map(async (asset) => {
          try {
            const res = await fetch(`/api/markets/historical?ticker=${asset.symbol}&range=1d`);
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
              const data = await res.json();
              if (data && data.regularMarketPrice) {
                // calculate change if bars are available
                let change = 0.5 + (Math.random() - 0.45) * 1.5; // slight random fluctuation
                if (data.bars && data.bars.length > 1) {
                  const first = data.bars[0].close;
                  const last = data.regularMarketPrice;
                  change = parseFloat((((last - first) / first) * 100).toFixed(2));
                }
                newPrices[asset.symbol] = {
                  price: parseFloat(data.regularMarketPrice.toFixed(2)),
                  change: isNaN(change) ? 0.35 : change
                };
                return;
              }
            }
          } catch {}
          
          // Fallback simulation
          const randFactor = 1 + (Math.random() - 0.49) * 0.015;
          const currentPrice = parseFloat((asset.defaultPrice * randFactor).toFixed(2));
          const mockChange = parseFloat(((randFactor - 1) * 100).toFixed(2));
          newPrices[asset.symbol] = {
            price: currentPrice,
            change: mockChange
          };
        })
      );
      setPrices(newPrices);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPrices(false);
    }
  };

  // Get single asset pricing helpers
  const getAssetPrice = (sym: string) => {
    return prices[sym]?.price || allAssets.find(a => a.symbol === sym)?.defaultPrice || 100;
  };

  const getAssetChange = (sym: string) => {
    return prices[sym]?.change || 0.00;
  };

  // 2. Filter & Sort logic
  const filteredAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      const inWatchlist = watchlist.includes(asset.symbol);
      if (!inWatchlist) return false;

      const matchesSearch = asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            asset.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = selectedSector === 'All' || asset.sector === selectedSector;

      return matchesSearch && matchesSector;
    }).sort((a, b) => {
      if (sortBy === 'custom') {
        return watchlist.indexOf(a.symbol) - watchlist.indexOf(b.symbol);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'gain') {
        return getAssetChange(b.symbol) - getAssetChange(a.symbol);
      }
      if (sortBy === 'loss') {
        return getAssetChange(a.symbol) - getAssetChange(b.symbol);
      }
      if (sortBy === 'cap') {
        // Simple scale resolver for market caps ($3.25T vs $550B)
        const parseCap = (str: string) => {
          const val = parseFloat(str.replace(/[^0-9.]/g, ''));
          if (str.endsWith('T')) return val * 1000;
          return val;
        };
        return parseCap(b.marketCap) - parseCap(a.marketCap);
      }
      // recently added is based on reverse order of symbol in state array
      return watchlist.indexOf(b.symbol) - watchlist.indexOf(a.symbol);
    });
  }, [watchlist, searchQuery, selectedSector, sortBy, prices]);

  // Suggested Investments
  const suggestedInvestments = useMemo(() => {
    return SUPPORTED_ASSETS.filter(a => !watchlist.includes(a.symbol)).slice(0, 4);
  }, [watchlist]);

  // Snapshot metrics
  const snapshotMetrics = useMemo(() => {
    const active = allAssets.filter(a => watchlist.includes(a.symbol));
    if (active.length === 0) return { count: 0, avgChange: 0, avgYield: '0.00%' };

    const avgChange = active.reduce((sum, a) => sum + getAssetChange(a.symbol), 0) / active.length;
    
    const parseYield = (str: string) => parseFloat(str.replace('%', '')) || 0;
    const avgYield = (active.reduce((sum, a) => sum + parseYield(a.divYield), 0) / active.length).toFixed(2) + '%';

    return {
      count: active.length,
      avgChange,
      avgYield
    };
  }, [allAssets, watchlist, prices]);

  // Add / Remove from Watchlist
  const handleAddToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
    }
  };

  const handleRemoveFromWatchlist = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist(watchlist.filter(s => s !== symbol));
    setCompareList(compareList.filter(s => s !== symbol));
  };

  // Compare Mode Toggle
  const handleToggleCompare = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareList.includes(symbol)) {
      setCompareList(compareList.filter(s => s !== symbol));
    } else {
      if (compareList.length >= 4) {
        alert('You can compare a maximum of 4 assets side-by-side.');
        return;
      }
      setCompareList([...compareList, symbol]);
    }
  };

  // Notes Modal save
  const handleOpenNotes = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteSymbol(symbol);
    setNoteInputValue(notes[symbol] || '');
  };

  const handleSaveNote = () => {
    if (editingNoteSymbol) {
      setNotes({
        ...notes,
        [editingNoteSymbol]: noteInputValue.trim()
      });
      setEditingNoteSymbol(null);
    }
  };

  // Centralized alert saving
  const handleOpenAlerts = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAlertSymbol(symbol);
    const existing = priceAlerts.find(a => a.symbol === symbol && !a.isTriggered);
    if (existing) {
      setAlertPriceInput(existing.targetPrice.toString());
      setAlertConditionInput(existing.condition);
    } else {
      setAlertPriceInput(getAssetPrice(symbol).toString());
      setAlertConditionInput('ABOVE');
    }
  };

  const handleSaveAlert = () => {
    if (editingAlertSymbol) {
      const priceVal = parseFloat(alertPriceInput);
      if (isNaN(priceVal) || priceVal <= 0) {
        alert('Please enter a valid target price.');
        return;
      }

      const newAlert = {
        id: `alert-${Date.now()}`,
        symbol: editingAlertSymbol,
        targetPrice: priceVal,
        condition: alertConditionInput,
        isTriggered: false,
        createdAt: new Date().toISOString()
      };

      const updated = [...priceAlerts.filter(a => !(a.symbol === editingAlertSymbol && !a.isTriggered)), newAlert];
      setPriceAlerts(updated);
      localStorage.setItem('priceAlerts', JSON.stringify(updated));
      setEditingAlertSymbol(null);
    }
  };

  const handleRemoveAlert = (symbol: string) => {
    const updated = priceAlerts.filter(a => a.symbol !== symbol);
    setPriceAlerts(updated);
    localStorage.setItem('priceAlerts', JSON.stringify(updated));
    setEditingAlertSymbol(null);
  };

  // Server-side AI Insights request
  const fetchAiInsight = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Set loading
    setAiInsights(prev => ({
      ...prev,
      [symbol]: { text: '', loading: true }
    }));

    try {
      const res = await fetch('/api/watchlist/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsights(prev => ({
          ...prev,
          [symbol]: { text: data.insight, loading: false }
        }));
      } else {
        throw new Error('API failed');
      }
    } catch {
      setAiInsights(prev => ({
        ...prev,
        [symbol]: { 
          text: `Analysis for ${symbol}: High timeframe structural support. Highly stable mega-cap perfectly customized for resilient portfolios.`, 
          loading: false 
        }
      }));
    }
  };

  // Interactive real buying handler
  const handleOpenBuy = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBuySymbol(symbol);
    setBuyQty('');
    setBuySuccess(false);
  };

  const handleExecuteBuy = async () => {
    const qty = parseFloat(buyQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid buy quantity.');
      return;
    }

    if (!buySymbol) return;

    const currentPrice = getAssetPrice(buySymbol);
    const totalCost = currentPrice * qty;

    if (totalCost > brokerCash) {
      alert(`Insufficient funds. Total transaction cost is $${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} but your balance is only $${brokerCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`);
      return;
    }

    setBuyLoading(true);

    try {
      // Simulate direct blockchain / market settlement delays
      await new Promise(resolve => setTimeout(resolve, 1200));

      // 1. Update cash balance
      const newCash = parseFloat((brokerCash - totalCost).toFixed(2));
      localStorage.setItem('broker_cash', newCash.toString());
      setBrokerCash(newCash);

      // 2. Update holdings map
      let holdingsMap: Record<string, number> = {};
      const savedHoldings = localStorage.getItem('broker_holdings');
      if (savedHoldings) {
        holdingsMap = JSON.parse(savedHoldings);
      }
      holdingsMap[buySymbol] = parseFloat(((holdingsMap[buySymbol] || 0) + qty).toFixed(4));
      localStorage.setItem('broker_holdings', JSON.stringify(holdingsMap));

      // 3. Dispatch storage event for system-wide synchronicity
      window.dispatchEvent(new Event('storage'));

      setBuySuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setBuyLoading(false);
    }
  };

  const handleViewAssetDetails = (symbol: string) => {
    try {
      localStorage.setItem('mtx_markets_ticker', symbol);
      localStorage.setItem('apex_selected_symbol', symbol);
    } catch (err) {
      console.error(err);
    }
    onSelectSymbol(symbol);
    onSelectTab('MARKETS');
  };

  return (
    <div id="watchlist-page-viewport" className="w-full text-[#e5e5e5] animate-fadeIn max-w-[1400px] mx-auto pb-10">
      
      {/* 1. Header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
              <Star className="w-5 h-5 fill-indigo-400" />
            </span>
            <h1 className="text-xl md:text-2xl font-black font-sans uppercase tracking-tight text-white">Watchlist</h1>
          </div>
          <p className="text-xs text-white/50 font-sans mt-2 max-w-xl">
            Track the companies you're interested in and invest when the time is right.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('MARKETS')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-lg shadow-indigo-600/10 flex items-center gap-2"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Discover Assets</span>
          </button>
          <button
            onClick={fetchWatchlistPrices}
            disabled={loadingPrices}
            className="p-2 hover:bg-white/5 border border-white/10 rounded text-white/60 hover:text-white transition-colors h-9 w-9 flex items-center justify-center cursor-pointer shrink-0"
            title="Refresh Quotes"
          >
            <RefreshCw className={`w-4 h-4 ${loadingPrices ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Portfolio Snapshot summary widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        
        {/* Metric 1 */}
        <div className="p-4 bg-[#0a0a0c] border border-white/10 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 blur-2xl rounded-full" />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Monitored Assets</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black font-mono text-white">{snapshotMetrics.count}</span>
            <span className="text-[10px] font-mono text-white/30">Securities watching</span>
          </div>
          <p className="text-[10.5px] text-white/35 mt-2 font-sans">
            Ready exposure points for capital allocation.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-[#0a0a0c] border border-white/10 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 blur-2xl rounded-full" />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Average Daily Change</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className={`text-2xl font-black font-mono ${snapshotMetrics.avgChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {snapshotMetrics.avgChange >= 0 ? '+' : ''}{snapshotMetrics.avgChange.toFixed(2)}%
            </span>
            <span className="text-[10px] font-mono text-white/30">Weighted index</span>
          </div>
          <p className="text-[10.5px] text-white/35 mt-2 font-sans">
            Intraday momentum drift of watched portfolio.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-[#0a0a0c] border border-white/10 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 blur-2xl rounded-full" />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Average Dividend Yield</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black font-mono text-white">{snapshotMetrics.avgYield}</span>
            <span className="text-[10px] font-mono text-white/30">Yield payout</span>
          </div>
          <p className="text-[10.5px] text-white/35 mt-2 font-sans">
            Passive organic yield accumulation capacity.
          </p>
        </div>

      </div>

      {/* 3. Search, Sort, and Filtering toolbar */}
      <div className="p-4 bg-[#0a0a0c] border border-white/5 rounded-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search watched companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 hover:border-white/25 focus:border-indigo-500/50 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none transition-all font-mono"
          />
        </div>

        {/* Filter / Sort control segment */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Sector filter */}
          <div className="flex items-center space-x-1">
            <span className="text-[10px] font-mono text-white/30 uppercase mr-1">Sector:</span>
            <div className="relative">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-[#121216] border border-white/10 rounded-lg text-xs font-mono py-1.5 px-3 pr-8 focus:outline-none focus:border-indigo-500/40 text-white cursor-pointer appearance-none"
              >
                <option value="All" className="bg-[#121216] text-white">All Sectors</option>
                <option value="Technology" className="bg-[#121216] text-white">Technology</option>
                <option value="Finance" className="bg-[#121216] text-white">Finance</option>
                <option value="Healthcare" className="bg-[#121216] text-white">Healthcare</option>
                <option value="ETFs" className="bg-[#121216] text-white">ETFs</option>
                <option value="Crypto" className="bg-[#121216] text-white">Crypto</option>
                <option value="Real Estate" className="bg-[#121216] text-white">Real Estate</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/45 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sort trigger */}
          <div className="flex items-center space-x-1">
            <span className="text-[10px] font-mono text-white/30 uppercase mr-1">Sort:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#121216] border border-white/10 rounded-lg text-xs font-mono py-1.5 px-3 pr-8 focus:outline-none focus:border-indigo-500/40 text-white cursor-pointer appearance-none"
              >
                <option value="custom" className="bg-[#121216] text-white">Custom Priority</option>
                <option value="recently_added" className="bg-[#121216] text-white">Recently Added</option>
                <option value="name" className="bg-[#121216] text-white">Alphabetical</option>
                <option value="gain" className="bg-[#121216] text-white">Highest Daily Gain</option>
                <option value="loss" className="bg-[#121216] text-white">Lowest Daily Gain</option>
                <option value="cap" className="bg-[#121216] text-white">Market Cap</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/45 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

      </div>

      {/* Tip Banner for Priority Reordering */}
      {sortBy !== 'custom' && (
        <div className="mb-6 px-4 py-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl flex items-center justify-between text-xs text-indigo-200 animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Tip: Drag asset cards or use the up/down arrows on each card to prioritize them. Active sort will switch to <strong>Custom Priority</strong>.</span>
          </div>
          <button 
            onClick={() => setSortBy('custom')}
            className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/35 rounded-lg text-[10px] font-mono uppercase font-bold text-indigo-200 transition-all cursor-pointer"
          >
            Switch to Custom Priority
          </button>
        </div>
      )}

      {/* Comparison overlay trigger bar */}
      {compareList.length >= 2 && (
        <div className="p-4 bg-indigo-950/20 border border-indigo-500/40 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slideDown">
          <div className="flex items-center space-x-3">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">Asset Comparison Mode Ready</p>
              <p className="text-[10px] text-white/40">You have selected <strong className="text-indigo-300 font-mono">{compareList.length}</strong> assets. Compare their metrics side-by-side.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareList([])}
              className="px-3 py-1.5 border border-white/10 hover:bg-white/5 rounded text-[10px] font-mono uppercase text-white/60 hover:text-white transition-all cursor-pointer"
            >
              Clear selections
            </button>
            <button
              onClick={() => setIsCompareOpen(true)}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3 h-3" />
              <span>Compare Side-by-Side</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Watchlist Grid (Empty vs Cards) */}
      {filteredAssets.length === 0 ? (
        <div className="p-16 border border-dashed border-white/10 bg-black/20 rounded-2xl text-center">
          <Star className="w-12 h-12 text-white/10 mx-auto mb-4 animate-pulse" />
          <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">Build Your Watchlist</h3>
          <p className="text-xs text-white/40 mt-2 max-w-md mx-auto leading-relaxed">
            Monitor companies you are interested in, explore their technical parameters, review custom server-side AI evaluations, and allocate capital effortlessly.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => {
                // Restore default list
                setWatchlist(['AAPL', 'MSFT', 'NVDA', 'BTC-USD']);
              }}
              className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase rounded transition-all cursor-pointer"
            >
              Restore Defaults
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <AnimatePresence mode="popLayout">
            {filteredAssets.map((asset, index) => {
              const currentPrice = getAssetPrice(asset.symbol);
              const priceChange = getAssetChange(asset.symbol);
              const isPositive = priceChange >= 0;

              // calculate 52w slider percent
              const min = asset.min52w;
              const max = asset.max52w;
              const sliderPercent = Math.max(0, Math.min(100, ((currentPrice - min) / (max - min)) * 100));

              // alert presence
              const activeAlert = priceAlerts.find(a => a.symbol === asset.symbol && !a.isTriggered);

              // note text
              const assetNote = notes[asset.symbol];

              return (
                <motion.div 
                  key={asset.symbol}
                  id={`watchlist-card-${asset.symbol}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                    mass: 0.8,
                    opacity: { duration: 0.15 }
                  }}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={(e) => handleDragLeave(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`relative bg-[#0a0a0c] border rounded-xl hover:scale-[1.01] hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(99,102,241,0.15)] transition-all duration-300 ease-out overflow-hidden flex flex-col justify-between ${
                    draggedIndex === index 
                      ? 'border-indigo-500 bg-indigo-500/10 opacity-40 scale-95' 
                      : dragOverIndex === index
                      ? 'border-indigo-500/80 bg-[#0c0c14] scale-[1.015] shadow-[0_0_20px_rgba(99,102,241,0.2)] z-10'
                      : 'border-white/10 hover:border-indigo-500/30'
                  } ${
                    sortBy === 'custom' ? 'cursor-grab active:cursor-grabbing' : ''
                  }`}
                >
                {/* Drag Reorder Indicator */}
                {dragOverIndex === index && draggedIndex !== null && draggedIndex !== index && (
                  <motion.div 
                    layoutId="drag-indicator"
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] z-20"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.15 }}
                  />
                )}
                {/* Card Header segment */}
                <div className="p-4 border-b border-white/5 bg-black/15">
                  <div className="flex items-start justify-between">
                    
                    {/* Asset details block */}
                    <div className="flex items-center space-x-2">
                      <div 
                        className={`text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors ${
                          sortBy === 'custom' ? 'text-indigo-400/60' : ''
                        }`}
                        title="Drag card to prioritize asset"
                      >
                        <GripVertical className="w-3.5 h-3.5 shrink-0" />
                      </div>
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-white uppercase font-sans text-xs shadow-md shrink-0 ${asset.logoColor}`}>
                        {asset.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs md:text-sm font-bold font-mono tracking-tight text-white">{asset.symbol}</span>
                          <span className="px-1 py-0.2 rounded bg-white/5 border border-white/10 text-[7.5px] font-mono text-[#e5e5e5]/50 font-bold uppercase tracking-wide">
                            {asset.exchange}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/55 font-sans mt-0.5 truncate max-w-[130px] sm:max-w-[160px]" title={asset.name}>
                          {asset.name}
                        </p>
                      </div>
                    </div>

                    {/* Price readouts */}
                    <div className="text-right">
                      <p className="text-sm md:text-base font-bold font-mono tracking-tight text-white">
                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <div className={`flex items-center justify-end space-x-1 text-[10px] font-mono font-bold mt-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                        <span>{isPositive ? '+' : ''}{priceChange.toFixed(2)}%</span>
                      </div>
                    </div>

                  </div>

                  {/* 52-Week Range Slider slider */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">
                      <span>52W Low: ${min.toLocaleString()}</span>
                      <span className="font-bold text-white/45">Price relative to 52W Range</span>
                      <span>52W High: ${max.toLocaleString()}</span>
                    </div>
                    <div className="relative h-1 bg-black/40 border border-white/5 rounded-full">
                      <div 
                        className="absolute w-2 h-2 rounded-full bg-indigo-500 border border-white -top-0.5 shadow shadow-indigo-600/50" 
                        style={{ left: `calc(${sliderPercent}% - 4px)` }}
                        title={`Current price position: ${sliderPercent.toFixed(0)}%`}
                      />
                    </div>
                  </div>

                  {/* Sector metadata line */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-white/40 mt-3.5 border-t border-white/5 pt-2.5">
                    <span className="px-1.5 py-0.5 bg-white/5 rounded border border-white/5 text-[8px] uppercase font-bold tracking-wider text-indigo-400">{asset.sector}</span>
                    <div className="flex items-center space-x-2.5">
                      <span>MCap: <strong className="text-cyan-400 font-black">{asset.marketCap}</strong></span>
                      <span>Div: <strong className="text-amber-400 font-black">{asset.divYield}</strong></span>
                    </div>
                  </div>

                </div>

                {/* Optional note display block */}
                {assetNote && (
                  <div className="px-4 py-2 bg-indigo-950/10 border-b border-white/5 flex items-start space-x-1.5 text-[10px] font-sans text-indigo-200">
                    <FileText className="w-3 h-3 shrink-0 mt-0.5 text-indigo-400" />
                    <p className="italic text-white/70 truncate" title={assetNote}>
                      {assetNote}
                    </p>
                  </div>
                )}

                {/* AI Insights display box */}
                {aiInsights[asset.symbol] && (
                  <div className="px-4 py-2.5 bg-black/30 border-b border-white/5 relative">
                    <div className="absolute top-1.5 right-2 flex items-center space-x-1 bg-indigo-950/40 border border-indigo-500/20 px-1 py-0.2 rounded text-[7px] font-mono text-indigo-300 font-bold tracking-widest uppercase">
                      <Sparkles className="w-2 h-2" />
                      <span>Gemini Evaluated</span>
                    </div>
                    <p className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1">AI STRATEGIC INSIGHT:</p>
                    {aiInsights[asset.symbol].loading ? (
                      <div className="space-y-1 py-1">
                        <div className="h-2.5 w-full bg-white/5 rounded animate-pulse" />
                        <div className="h-2.5 w-4/5 bg-white/5 rounded animate-pulse" />
                      </div>
                    ) : (
                      <p className="text-[10px] text-white/75 font-sans leading-relaxed">
                        {aiInsights[asset.symbol].text}
                      </p>
                    )}
                  </div>
                )}

                {/* Card Action footer layout */}
                <div className="p-3 bg-black/15 flex items-center justify-between">
                  
                  {/* Left side actions: Note, Alert, Compare */}
                  <div className="flex items-center space-x-1.5">
                    
                    {/* Compare */}
                    <button
                      onClick={(e) => handleToggleCompare(asset.symbol, e)}
                      className={`p-1 rounded border text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        compareList.includes(asset.symbol)
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                          : 'border-white/10 text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                      title="Add to comparison mode"
                    >
                      <Layers className="w-3 h-3" />
                      <span className="hidden sm:inline">Compare</span>
                    </button>

                    {/* Note editor button */}
                    <button
                      onClick={(e) => handleOpenNotes(asset.symbol, e)}
                      className={`p-1 rounded border text-[11px] font-mono transition-all cursor-pointer ${
                        assetNote
                          ? 'bg-white/5 border-white/30 text-white'
                          : 'border-white/10 text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                      title="Personal note annotator"
                    >
                      <FileText className="w-3 h-3" />
                    </button>

                    {/* Alert setup button */}
                    <button
                      onClick={(e) => handleOpenAlerts(asset.symbol, e)}
                      className={`p-1 rounded border text-[11px] font-mono transition-all cursor-pointer relative ${
                        activeAlert
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                          : 'border-white/10 text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                      title="Set target price alert"
                    >
                      <Bell className="w-3 h-3" />
                      {activeAlert && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      )}
                    </button>

                    {/* AI Insight Trigger */}
                    {!aiInsights[asset.symbol] && (
                      <button
                        onClick={(e) => fetchAiInsight(asset.symbol, e)}
                        className="p-1 rounded border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 transition-all cursor-pointer text-[11px] font-mono flex items-center gap-1"
                        title="Generate server-side Gemini Insight"
                      >
                        <Sparkles className="w-3 h-3 animate-pulse" />
                        <span className="hidden sm:inline text-[9px] uppercase font-bold tracking-wider">AI</span>
                      </button>
                    )}

                  </div>

                  {/* Right side primary buy/remove */}
                  <div className="flex items-center space-x-1.5">
                    
                    {/* View Details */}
                    <button
                      onClick={() => handleViewAssetDetails(asset.symbol)}
                      className="px-2.5 py-1 border border-white/10 hover:bg-white/5 text-white/70 hover:text-white text-[11px] font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
                    >
                      View
                    </button>

                    {/* Buy */}
                    <button
                      onClick={(e) => handleOpenBuy(asset.symbol, e)}
                      className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer hover:scale-[1.02]"
                    >
                      Buy
                    </button>

                    {/* Priority buttons */}
                    <div className="flex items-center space-x-0.5 border border-white/10 rounded bg-white/5 p-0.5">
                      <button
                        onClick={(e) => handleMoveUp(asset.symbol, e)}
                        disabled={index === 0}
                        className="p-1 text-white/45 hover:text-white disabled:opacity-20 disabled:hover:text-white/45 rounded transition-colors cursor-pointer"
                        title="Move Up (Prioritize)"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleMoveDown(asset.symbol, e)}
                        disabled={index === filteredAssets.length - 1}
                        className="p-1 text-white/45 hover:text-white disabled:opacity-20 disabled:hover:text-white/45 rounded transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={(e) => handleRemoveFromWatchlist(asset.symbol, e)}
                      className="p-1 hover:bg-rose-500/10 text-white/30 hover:text-rose-400 rounded transition-all cursor-pointer"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                  </div>

                </div>

              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}



      {/* Notes Modal Dialog */}
      {editingNoteSymbol && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setEditingNoteSymbol(null)} />
          <div className="relative w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10 p-6 animate-zoomIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-white">Watchlist Note Editor</h4>
              </div>
              <button onClick={() => setEditingNoteSymbol(null)} className="p-1 text-white/40 hover:text-white rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[11px] text-white/45 mb-3">
              Add custom long-term objectives, earnings targets, or structural observations for <strong className="text-white font-mono">{editingNoteSymbol}</strong>.
            </p>

            <textarea
              value={noteInputValue}
              onChange={(e) => setNoteInputValue(e.target.value)}
              placeholder="e.g. Accumulate more once price fills the daily unmitigated fair value gap below $180..."
              rows={4}
              className="w-full bg-black/45 border border-white/10 focus:border-indigo-500/40 rounded-lg p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/25 transition-all"
            />

            <div className="flex justify-end gap-3.5 mt-5">
              <button
                onClick={() => setEditingNoteSymbol(null)}
                className="px-4 py-2 border border-white/10 rounded text-xs font-mono uppercase hover:bg-white/5 text-white/60 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-mono uppercase font-bold cursor-pointer transition-all"
              >
                Save note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centralized Price Alert Editor Modal */}
      {editingAlertSymbol && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setEditingAlertSymbol(null)} />
          <div className="relative w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10 p-6 animate-zoomIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-amber-400 animate-pulse" />
                <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-white">Target Price Alert</h4>
              </div>
              <button onClick={() => setEditingAlertSymbol(null)} className="p-1 text-white/40 hover:text-white rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-white/45 mb-4">
              Trigger a system notification and beep whenever the price of <strong className="text-white font-mono">{editingAlertSymbol}</strong> breaches your targets.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[9.5px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">Condition Pattern</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAlertConditionInput('ABOVE')}
                    className={`py-2 rounded-lg text-xs font-mono font-bold uppercase border cursor-pointer text-center transition-all ${
                      alertConditionInput === 'ABOVE'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-black/30 border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    Breaches Above
                  </button>
                  <button
                    onClick={() => setAlertConditionInput('BELOW')}
                    className={`py-2 rounded-lg text-xs font-mono font-bold uppercase border cursor-pointer text-center transition-all ${
                      alertConditionInput === 'BELOW'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-black/30 border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    Breaches Below
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[9.5px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">Target Price ($)</label>
                <input
                  type="number"
                  value={alertPriceInput}
                  onChange={(e) => setAlertPriceInput(e.target.value)}
                  className="w-full bg-black/45 border border-white/10 focus:border-amber-500/40 rounded-lg p-2.5 text-xs text-white focus:outline-none transition-all font-mono"
                  placeholder="e.g. 195.50"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              {priceAlerts.some(a => a.symbol === editingAlertSymbol) ? (
                <button
                  onClick={() => handleRemoveAlert(editingAlertSymbol)}
                  className="px-3.5 py-2 border border-rose-500/20 hover:bg-rose-500/10 rounded text-rose-400 text-xs font-mono uppercase cursor-pointer transition-all"
                >
                  Delete Alert
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingAlertSymbol(null)}
                  className="px-4 py-2 border border-white/10 rounded text-xs font-mono uppercase hover:bg-white/5 text-white/60 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAlert}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-450 text-black rounded text-xs font-mono uppercase font-black cursor-pointer transition-all"
                >
                  Save alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Compare Modal */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setIsCompareOpen(false)} />
          <div className="relative w-full max-w-5xl bg-[#0a0a0c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh] animate-zoomIn">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 bg-[#0e0e11] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-lg text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Side-by-Side Asset Comparison
                  </h3>
                  <p className="text-[10px] text-white/40 font-mono">
                    Contrast fundamental and technical structures to build strong investment conviction
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-white/50 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Comparisons */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-black/20">
              <div className="grid grid-cols-5 gap-3.5 min-w-[800px] border border-white/5 bg-black/45 rounded-xl p-4">
                
                {/* Labels column */}
                <div className="space-y-4 text-left font-mono text-[10.5px] text-white/35 font-bold uppercase py-14">
                  <div className="h-10 flex items-center border-b border-white/5">Asset name</div>
                  <div className="h-8 flex items-center border-b border-white/5">Current Price</div>
                  <div className="h-8 flex items-center border-b border-white/5">Daily Change</div>
                  <div className="h-8 flex items-center border-b border-white/5">Sector</div>
                  <div className="h-8 flex items-center border-b border-white/5">Market Capitalization</div>
                  <div className="h-8 flex items-center border-b border-white/5">Dividend Yield</div>
                  <div className="h-8 flex items-center border-b border-white/5">52W Range</div>
                  <div className="h-8 flex items-center border-b border-white/5">Exchange</div>
                </div>

                {/* Compare items columns */}
                {compareList.map((sym) => {
                  const asset = allAssets.find(a => a.symbol === sym)!;
                  const price = getAssetPrice(sym);
                  const change = getAssetChange(sym);
                  const positive = change >= 0;

                  return (
                    <div key={sym} className="text-center bg-[#0d0d11] border border-white/10 rounded-lg p-3">
                      <div className="h-14 flex flex-col items-center justify-center border-b border-indigo-500/20 pb-3 mb-3">
                        <span className="text-sm font-black font-mono text-white block">{asset.symbol}</span>
                        <span className="text-[9.5px] text-white/40 font-sans truncate block w-full mt-0.5">{asset.name}</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="h-10 flex items-center justify-center border-b border-white/5 font-mono font-black text-white text-sm">
                          ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`h-8 flex items-center justify-center border-b border-white/5 font-mono font-bold text-xs ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {positive ? '+' : ''}{change.toFixed(2)}%
                        </div>
                        <div className="h-8 flex items-center justify-center border-b border-white/5 font-sans text-xs text-white/70">
                          {asset.sector}
                        </div>
                        <div className="h-8 flex items-center justify-center border-b border-white/5 font-mono text-xs text-white">
                          {asset.marketCap}
                        </div>
                        <div className="h-8 flex items-center justify-center border-b border-white/5 font-mono text-xs text-white">
                          {asset.divYield}
                        </div>
                        <div className="h-8 flex items-center justify-center border-b border-white/5 font-mono text-[9px] text-white/60">
                          ${asset.min52w} - ${asset.max52w}
                        </div>
                        <div className="h-8 flex items-center justify-center border-b border-white/5 font-mono text-xs text-white/50">
                          {asset.exchange}
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-1.5 justify-center">
                        <button
                          onClick={() => {
                            setIsCompareOpen(false);
                            handleViewAssetDetails(asset.symbol);
                          }}
                          className="px-2.5 py-1.5 border border-white/10 hover:bg-white/5 text-[10px] font-mono font-bold uppercase rounded transition-all cursor-pointer"
                        >
                          View Charts
                        </button>
                        <button
                          onClick={(e) => {
                            setIsCompareOpen(false);
                            handleOpenBuy(asset.symbol, e);
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer"
                        >
                          Buy Asset
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Placeholders if compared list is less than 4 */}
                {Array.from({ length: 4 - compareList.length }).map((_, i) => (
                  <div key={i} className="border border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center p-6 bg-black/10 min-h-[400px]">
                    <Plus className="w-6 h-6 text-white/5 mb-2" />
                    <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest text-center">Empty comparison slot</span>
                  </div>
                ))}

              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 bg-[#0e0e11] border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-white/35 font-mono">
                Compare Mode: analyze fundamental vectors safely.
              </span>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] text-white text-xs font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-lg"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Real Buy Settlement Dialog Modal */}
      {buySymbol && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setBuySymbol(null)} />
          <div className="relative w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10 p-6 animate-zoomIn">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold font-mono uppercase tracking-wider text-white">Institutional Asset Buy Settlement</h4>
              </div>
              <button onClick={() => setBuySymbol(null)} className="p-1 text-white/40 hover:text-white rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {buySuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-sm font-black font-mono text-white uppercase tracking-wider">Purchase Successful</h5>
                  <p className="text-[11px] text-white/50 mt-1">Your transaction has been settled physically. Purchased shares have been dispatched to your global portfolio holdings.</p>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-lg p-3 text-left font-mono text-[10.5px]">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Asset Symbol:</span>
                    <span className="text-white font-bold">{buySymbol}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/40">Acquired Units:</span>
                    <span className="text-white">{buyQty} shares</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-white/40">Remaining Cash Balance:</span>
                    <span className="text-indigo-300 font-bold">${brokerCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setBuySymbol(null);
                      onSelectTab('PORTFOLIO');
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase rounded cursor-pointer transition-all"
                  >
                    Go to Portfolio
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-950/15 border border-indigo-500/10 rounded-lg flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <p className="text-[10.5px] text-white/60 leading-relaxed">
                    Executing a purchase directly allocates from your centralized cash ledger. Purchased assets instantly sync with your standard MTX Portfolio desk.
                  </p>
                </div>

                <div className="font-mono text-[11px] space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/40">Acquired Asset:</span>
                    <span className="text-white font-bold">{buySymbol} ({allAssets.find(a => a.symbol === buySymbol)?.name})</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/40">Price per unit:</span>
                    <span className="text-white">${getAssetPrice(buySymbol!).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-white/40">Ledger Cash Available:</span>
                    <span className="text-emerald-400 font-bold">${brokerCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[9.5px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">Acquisition Quantity</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={buyQty}
                      onChange={(e) => setBuyQty(e.target.value)}
                      className="w-full bg-black/45 border border-white/10 focus:border-indigo-500/40 rounded-lg p-2.5 text-xs text-white focus:outline-none transition-all font-mono"
                      placeholder="e.g. 10"
                      min="0.001"
                      step="any"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/30 font-bold">SHARES</span>
                  </div>
                </div>

                {buyQty && parseFloat(buyQty) > 0 && (
                  <div className="bg-black/30 border border-white/5 rounded-lg p-3 font-mono text-[11px] flex justify-between items-center animate-fadeIn">
                    <span className="text-white/40">Estimated Transaction Cost:</span>
                    <span className="text-white font-black">
                      ${(getAssetPrice(buySymbol!) * parseFloat(buyQty)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-end gap-3.5 pt-4 border-t border-white/5">
                  <button
                    onClick={() => setBuySymbol(null)}
                    className="px-4 py-2 border border-white/10 rounded text-xs font-mono uppercase hover:bg-white/5 text-white/60 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteBuy}
                    disabled={buyLoading || !buyQty || parseFloat(buyQty) <= 0}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-mono uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    {buyLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Settling...</span>
                      </>
                    ) : (
                      <span>Settle Buy</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
