import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Globe, 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  Search, 
  ExternalLink,
  Layers,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  Filter,
  ArrowUpDown,
  Compass,
  CheckCircle2,
  Terminal
} from 'lucide-react';
import { 
  getRegisteredSitemapRoutes, 
  generateXmlSitemap, 
  downloadSitemapXml, 
  SitemapRoute 
} from '../utils/sitemapGenerator';

interface InteractiveSitemapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (routePath: string) => void;
}

export const InteractiveSitemapModal: React.FC<InteractiveSitemapModalProps> = ({ 
  isOpen, 
  onClose,
  onNavigate 
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'xml'>('visual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'title' | 'category'>('priority');
  const [copied, setCopied] = useState(false);

  const currentOrigin = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://mtxquant.com';
  }, []);

  const routes = useMemo(() => getRegisteredSitemapRoutes(currentOrigin), [currentOrigin]);
  const xmlOutput = useMemo(() => generateXmlSitemap(currentOrigin), [currentOrigin]);
  const xmlSizeKb = useMemo(() => (new Blob([xmlOutput]).size / 1024).toFixed(1), [xmlOutput]);

  // Categories list with counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: routes.length };
    routes.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [routes]);

  const categories = useMemo(() => ['ALL', ...Array.from(new Set(routes.map(r => r.category)))], [routes]);

  const filteredRoutes = useMemo(() => {
    return routes
      .filter(route => {
        const matchesSearch = 
          route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          route.loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (route.description && route.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'ALL' || route.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') return b.priority - a.priority;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        return 0;
      });
  }, [routes, searchQuery, selectedCategory, sortBy]);

  const handleCopyXml = () => {
    navigator.clipboard.writeText(xmlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRouteClick = (path: string, loc: string) => {
    if (onNavigate) {
      onNavigate(path);
      onClose();
    } else {
      // Fallback: update hash or navigate
      window.location.href = loc;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-[#070709] border border-amber-500/20 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col text-neutral-200 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-[#0a0a0e]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white tracking-wide font-mono uppercase">
                    Institutional XML Sitemap & Indexing Register
                  </h2>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1 uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" /> W3C 0.9 COMPLIANT
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Dynamic URL index automatically registering workspace routes, quantitative feature modules, and symbol terminals for search engines.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Telemetry KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-neutral-800 bg-[#08080a] text-xs font-mono">
            <div className="p-3 border-r border-neutral-800/60 flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[9px] text-neutral-400 uppercase tracking-widest block">INDEXED ROUTES</span>
                <span className="text-sm font-bold text-white tabular-nums">{routes.length} URLs</span>
              </div>
            </div>
            <div className="p-3 border-r border-neutral-800/60 flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[9px] text-neutral-400 uppercase tracking-widest block">SCHEMA SIZE</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">{xmlSizeKb} KB</span>
              </div>
            </div>
            <div className="p-3 border-r border-neutral-800/60 flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-[9px] text-neutral-400 uppercase tracking-widest block">CRAWLER STATUS</span>
                <span className="text-sm font-bold text-sky-300">LIVE SYNCED</span>
              </div>
            </div>
            <div className="p-3 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[9px] text-neutral-400 uppercase tracking-widest block">ENDPOINT LOCATION</span>
                <span className="text-xs font-bold text-amber-300 font-mono truncate">/sitemap.xml</span>
              </div>
            </div>
          </div>

          {/* Action Bar & Mode Switch */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#0a0a0d] border-b border-neutral-800">
            <div className="flex items-center gap-1.5 bg-[#050507] p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => setActiveTab('visual')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'visual'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" /> VISUAL EXPLORER ({routes.length})
              </button>
              <button
                onClick={() => setActiveTab('xml')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'xml'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-400" /> RAW XML SCHEMA
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyXml}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 font-mono font-bold border border-neutral-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                {copied ? 'COPIED XML' : 'COPY XML'}
              </button>
              <button
                onClick={() => downloadSitemapXml(currentOrigin)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-xs text-black font-mono font-bold shadow-md hover:shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> DOWNLOAD sitemap.xml
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          {activeTab === 'visual' ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#060608]">
              {/* Filter & Sorting Controls */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search routes by title, path, symbol or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#0a0a0d] border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 font-mono"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-neutral-500 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#0a0a0d] border border-neutral-800 rounded-lg p-1 text-[11px] font-mono">
                    <ArrowUpDown className="w-3 h-3 text-neutral-400 ml-1" />
                    <span className="text-neutral-500 text-[10px] uppercase">SORT:</span>
                    <button
                      onClick={() => setSortBy('priority')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${sortBy === 'priority' ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400'}`}
                    >
                      PRIORITY
                    </button>
                    <button
                      onClick={() => setSortBy('title')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${sortBy === 'title' ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400'}`}
                    >
                      TITLE
                    </button>
                    <button
                      onClick={() => setSortBy('category')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${sortBy === 'category' ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400'}`}
                    >
                      CATEGORY
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Pills Header */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
                <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0 mr-1" />
                {categories.map((cat) => {
                  const count = categoryCounts[cat] || 0;
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'bg-[#0a0a0e] text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`px-1 rounded text-[9px] ${isSelected ? 'bg-amber-500/30 text-amber-200' : 'bg-neutral-800 text-neutral-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Registered Routes List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRoutes.map((route, idx) => {
                  const isPriorityHigh = route.priority >= 0.9;
                  return (
                    <div 
                      key={idx}
                      className="p-3.5 bg-[#09090c] border border-neutral-800 hover:border-amber-500/40 rounded-xl transition-all group flex flex-col justify-between space-y-2.5 shadow-sm hover:shadow-amber-500/5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                            {route.title}
                          </h4>
                          <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border shrink-0 ${
                            isPriorityHigh 
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                              : 'bg-neutral-800/80 text-neutral-300 border-neutral-700'
                          }`}>
                            PRIORITY: {route.priority.toFixed(2)}
                          </span>
                        </div>

                        {route.description && (
                          <p className="text-[11px] text-neutral-400 line-clamp-2 font-normal leading-relaxed mb-2">
                            {route.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-neutral-400 bg-[#050507] px-2.5 py-1.5 rounded border border-neutral-800/80">
                          <span className="text-amber-400/90 font-semibold truncate">{route.path}</span>
                          <button
                            onClick={() => handleRouteClick(route.path, route.loc)}
                            className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold uppercase shrink-0 hover:underline cursor-pointer"
                            title="Open in Terminal"
                          >
                            <span>Navigate</span>
                            <ArrowUpRight className="w-3 h-3 text-amber-400" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-2 border-t border-neutral-800/60">
                        <span className="bg-neutral-900 px-2 py-0.5 rounded text-neutral-300 border border-neutral-800 font-bold uppercase">
                          {route.category}
                        </span>
                        <div className="flex items-center gap-3">
                          <span>FREQ: <strong className="text-neutral-200">{route.changefreq}</strong></span>
                          <span>UPDATED: <strong className="text-neutral-200">{route.lastmod}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredRoutes.length === 0 && (
                <div className="p-10 text-center bg-[#09090c] rounded-xl border border-neutral-800 space-y-2">
                  <p className="text-xs text-neutral-400 font-mono">No registered routes match your filter parameters.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                    className="px-3 py-1.5 bg-neutral-800 text-white font-mono text-xs rounded hover:bg-neutral-700 transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 bg-[#030304] font-mono text-[11px] text-emerald-400/90 leading-relaxed border-b border-neutral-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[10px] text-neutral-400">
                <span>W3C Sitemap 0.9 XML Representation</span>
                <span>{routes.length} Node Elements</span>
              </div>
              <pre className="whitespace-pre-wrap select-all text-neutral-300 font-mono text-xs bg-[#060608] p-4 rounded border border-neutral-800">
                {xmlOutput}
              </pre>
            </div>
          )}

          {/* Footer Info */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-[#0a0a0d] border-t border-neutral-800 text-[11px] font-mono text-neutral-400 gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Served natively at <code className="text-amber-300 bg-black px-1.5 py-0.5 rounded border border-neutral-800">{currentOrigin}/sitemap.xml</code>
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-neutral-400">Auto-synced with workspace manifests</span>
              <span className="text-neutral-600">|</span>
              <span className="text-emerald-400 font-bold">SEC & Search Engine Compliant</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
