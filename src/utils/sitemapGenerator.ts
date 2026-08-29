import { WORKSPACE_SEO_SPECS, WorkspaceSeoKey } from '../hooks/useSeoMetadata';
import { workspacesData, WorkspaceSpec } from '../components/Homepage';

export interface SitemapRoute {
  loc: string;
  path: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  priority: number;
  title: string;
  category: string;
  description?: string;
}

export const LEGAL_AND_DOCUMENTATION_ROUTES: Array<Omit<SitemapRoute, 'loc' | 'lastmod'>> = [
  {
    path: '/#discover',
    changefreq: 'always',
    priority: 0.95,
    title: 'Market Discovery & Systematic Equity Screener',
    category: 'Workspaces',
    description: 'Scan global equities and fractional assets using quantitative valuation ratios, multi-factor momentum filters, and relative volume anomaly alerts.'
  },
  {
    path: '/#account',
    changefreq: 'weekly',
    priority: 0.88,
    title: 'Account Control Center & Institutional Profile Settings',
    category: 'Account & Security',
    description: 'Manage trader profile credentials, multi-factor security, identity verification, API keys, and notification triggers.'
  },
  {
    path: '/#backtest',
    changefreq: 'always',
    priority: 0.90,
    title: 'Algorithmic Strategy Backtester & Monte Carlo Sandbox',
    category: 'Quantitative Analytics',
    description: 'Replay years of microsecond tick data, model fractional volume-weighted slippage, evaluate 1,000 Monte Carlo drawdown scenarios, and optimize Sharpe ratios.'
  },
  {
    path: '/#dcf',
    changefreq: 'weekly',
    priority: 0.86,
    title: 'Discounted Cash Flow (DCF) Valuation & Sensitivity Matrix Sandbox',
    category: 'Quantitative Analytics',
    description: 'Interactive DCF valuation model with dynamic WACC recalculations, terminal growth rates, and sensitivity matrices.'
  },
  {
    path: '/#sentiment',
    changefreq: 'always',
    priority: 0.92,
    title: 'Dark Pool Institutional Flow & Options Sweep Radar',
    category: 'Order Flow Intelligence',
    description: 'Real-time dark pool block prints, aggressive multi-leg options sweeps, smart money flow vectors, and retail sentiment divergence.'
  },
  {
    path: '/#status',
    changefreq: 'always',
    priority: 0.85,
    title: 'Infrastructure Health, API Latency & System Status Monitor',
    category: 'System Telemetry',
    description: 'Live order routing latency benchmarks, FIX protocol connectivity, WebSocket heartbeats, and exchange gateway status.'
  },
  {
    path: '/#risk-logs',
    changefreq: 'daily',
    priority: 0.84,
    title: 'Historical Risk Breach Log & Margin Audit Trail',
    category: 'Risk Management',
    description: 'Historical records of portfolio margin thresholds, Value-at-Risk breaches, leverage warnings, and automated risk mitigations.'
  },
  {
    path: '/#position-dependency',
    changefreq: 'daily',
    priority: 0.84,
    title: 'Position Dependency & Cross-Margin Matrix View',
    category: 'Risk Management',
    description: 'Network graph visualization of open position dependencies, asset co-movements, and cross-collateral margin requirements.'
  },
  {
    path: '/#instruments',
    changefreq: 'weekly',
    priority: 0.90,
    title: 'Fractionalized Financial Assets & Multi-Asset Directory',
    category: 'Market Data Catalog',
    description: 'Comprehensive directory of fractional equities, sovereign US Treasury yields, corporate bonds, index futures, and digital assets.'
  },
  {
    path: '/#calculator',
    changefreq: 'weekly',
    priority: 0.88,
    title: 'Dollar-Based Fractional Position & Margin Calculator',
    category: 'Systemic Calculators',
    description: 'Interactive dollar-to-fraction calculator, portfolio margin simulator, Value at Risk (VaR) analyzer, and compound return projections.'
  },
  {
    path: '/#compliance',
    changefreq: 'monthly',
    priority: 0.80,
    title: 'FINRA / SEC Compliance Framework & SEC 15c3-3 Customer Isolation',
    category: 'Regulatory & Compliance',
    description: 'Regulatory audit standards, SEC Rule 15c3-3 customer asset isolation protocols, and FINRA reporting workflows.'
  },
  {
    path: '/#docs',
    changefreq: 'weekly',
    priority: 0.85,
    title: 'Fractional Trading Developer API & FIX Protocol Documentation',
    category: 'Documentation',
    description: 'REST API endpoints, WebSocket streaming protocols, FIX 4.4 engine specifications, and algorithmic SDK references.'
  },
  {
    path: '/#faq',
    changefreq: 'weekly',
    priority: 0.85,
    title: 'Fractional Trading & Operations FAQ Documentation',
    category: 'Documentation',
    description: 'Comprehensive documentation covering fractional share mechanics, 8-decimal precision, SEC 15c3-3 customer isolation, and execution latency benchmarks.'
  },
  {
    path: '/#support',
    changefreq: 'weekly',
    priority: 0.80,
    title: 'Institutional Gateway Support & Help Desk',
    category: 'Support & Assistance',
    description: 'Direct communication desk for prime brokerage assistance, execution query resolution, and live technical support.'
  },
  {
    path: '/#legal',
    changefreq: 'monthly',
    priority: 0.70,
    title: 'Legal Center & Custodial Agreements Overview',
    category: 'Regulatory & Compliance',
    description: 'Master prime brokerage agreement index, custodial trust structures, and SEC customer protection rule disclosures.'
  },
  {
    path: '/#terms',
    changefreq: 'monthly',
    priority: 0.65,
    title: 'Terms of Service & Fractional Custodial Agreements',
    category: 'Regulatory & Compliance',
    description: 'Institutional prime brokerage service terms, customer account segregation standards, and execution rulesets.'
  },
  {
    path: '/#privacy',
    changefreq: 'monthly',
    priority: 0.65,
    title: 'Privacy Policy & Data Security Protocols',
    category: 'Regulatory & Compliance',
    description: 'End-to-end telemetry encryption policies, zero-knowledge credentials handling, and data retention standards.'
  },
  {
    path: '/#disclosures',
    changefreq: 'monthly',
    priority: 0.65,
    title: 'Regulatory Risk Disclosures & Margin Warnings',
    category: 'Regulatory & Compliance',
    description: 'FINRA / SEC margin disclosures, systemic liquidity risks, and options risk disclosure statements.'
  },
  {
    path: '/#sitemap',
    changefreq: 'daily',
    priority: 0.90,
    title: 'Interactive XML Sitemap & Indexing Register',
    category: 'Sitemap & Indexing',
    description: 'Dynamic URL index automatically registering workspace routes, fractional trading feature modules, and symbol terminals for search engines.'
  },
  {
    path: '/#llms',
    changefreq: 'daily',
    priority: 0.92,
    title: 'AI Knowledge Graph & LLM Machine-Readable Index (/llms.txt)',
    category: 'AI & LLM Indexing',
    description: 'Standardized Markdown knowledge index designed for AI search engines, GPTBot, ClaudeBot, PerplexityBot, and autonomous agents.'
  },
  {
    path: '/#login',
    changefreq: 'weekly',
    priority: 0.80,
    title: 'Institutional Gateway & OAuth Handshake Portal',
    category: 'Authentication',
    description: 'Secure multi-factor authentication portal and hardware key handshake for prime brokerage accounts.'
  }
];

export const TOP_TICKER_SYMBOLS = [
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Equities / Tech', priority: 0.95 },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Equities / Tech', priority: 0.92 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Equities / Consumer', priority: 0.90 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Equities / Tech', priority: 0.90 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Equities / Consumer', priority: 0.88 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Equities / Tech', priority: 0.88 },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Equities / Tech', priority: 0.88 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Equities / Tech', priority: 0.86 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'Indices / ETFs', priority: 0.94 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'Indices / ETFs', priority: 0.92 },
  { symbol: 'US10Y', name: '10-Year US Treasury Yield', sector: 'Sovereign Debt', priority: 0.90 },
  { symbol: 'US03M', name: '3-Month US Treasury Bill', sector: 'Sovereign Debt', priority: 0.88 },
  { symbol: 'BTC', name: 'Bitcoin / USD', sector: 'Digital Assets', priority: 0.90 },
  { symbol: 'ETH', name: 'Ethereum / USD', sector: 'Digital Assets', priority: 0.86 },
  { symbol: 'SOL', name: 'Solana / USD', sector: 'Digital Assets', priority: 0.84 },
];

/**
 * Dynamically crawls workspaces, SEO specifications, ticker databases,
 * and core endpoints to construct a production-ready, structured sitemap.
 */
export function getRegisteredSitemapRoutes(domain: string = 'https://mtxcapital.ai.studio'): SitemapRoute[] {
  const cleanDomain = domain.replace(/\/+$/, '');
  const currentDate = new Date().toISOString().split('T')[0];

  const routes: SitemapRoute[] = [];
  const registeredPaths = new Set<string>();

  const addRoute = (route: SitemapRoute) => {
    if (!registeredPaths.has(route.path)) {
      registeredPaths.add(route.path);
      routes.push(route);
    }
  };

  // 1. Root / Homepage
  const homeSpec = WORKSPACE_SEO_SPECS.HOMEPAGE;
  addRoute({
    loc: `${cleanDomain}/`,
    path: '/',
    lastmod: currentDate,
    changefreq: 'daily',
    priority: 1.00,
    title: homeSpec.title,
    category: 'Core Terminal',
    description: homeSpec.description
  });

  // 2. Primary Workspaces & Feature Landing Modules
  workspacesData.forEach((ws: WorkspaceSpec) => {
    const slug = ws.id.toLowerCase();

    // Primary Workspace Path
    addRoute({
      loc: `${cleanDomain}/#${slug}`,
      path: `/#${slug}`,
      lastmod: currentDate,
      changefreq: 'always',
      priority: slug === 'markets' || slug === 'portfolio' || slug === 'screener' ? 0.95 : 0.88,
      title: `${ws.seoTitle} | MTXcapital Multi-Asset Platform`,
      category: 'Workspaces',
      description: ws.desc
    });

    // Deep Feature Specification Route
    addRoute({
      loc: `${cleanDomain}/#feature-${slug}`,
      path: `/#feature-${slug}`,
      lastmod: currentDate,
      changefreq: 'always',
      priority: 0.90,
      title: `${ws.name} - Fractional Feature Architecture & Technical Specs`,
      category: 'Deep Feature Architecture',
      description: ws.roleExplanation
    });

    // Individual Feature Items inside each workspace
    ws.features.forEach((feat) => {
      const featSlug = feat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      addRoute({
        loc: `${cleanDomain}/#feature-${slug}-${featSlug}`,
        path: `/#feature-${slug}-${featSlug}`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.82,
        title: `${feat} (${ws.name}) | MTXcapital Engine`,
        category: 'Workspace Modules',
        description: `Explore ${feat} capabilities integrated directly into the ${ws.name} workspace.`
      });
    });
  });

  // 3. Fallback SEO Metadata Keys check
  const seoKeys = Object.keys(WORKSPACE_SEO_SPECS) as WorkspaceSeoKey[];
  seoKeys.forEach((key) => {
    if (key === 'HOMEPAGE') return;
    const spec = WORKSPACE_SEO_SPECS[key];
    const slug = key.toLowerCase();

    addRoute({
      loc: `${cleanDomain}/#${slug}`,
      path: `/#${slug}`,
      lastmod: currentDate,
      changefreq: 'always',
      priority: 0.85,
      title: spec.title,
      category: spec.category || 'Workspaces',
      description: spec.description
    });
  });

  // 4. Institutional Symbol Terminal Pages
  TOP_TICKER_SYMBOLS.forEach((item) => {
    const symSlug = item.symbol.toLowerCase();
    addRoute({
      loc: `${cleanDomain}/#markets-${symSlug}`,
      path: `/#markets-${symSlug}`,
      lastmod: currentDate,
      changefreq: 'always',
      priority: item.priority,
      title: `${item.symbol} (${item.name}) - Dollar-Based Fractional Quotes, Depth & Risk Analytics`,
      category: 'Fractional Symbols',
      description: `Buy fractional shares of ${item.name} (${item.symbol}) starting at $1. Live multi-venue liquidity depth, order book imbalance metrics, and volatility risk profiles.`
    });
  });

  // 5. Utility, Legal, Disclosures, Calculators & AI Grounding
  LEGAL_AND_DOCUMENTATION_ROUTES.forEach((route) => {
    addRoute({
      loc: `${cleanDomain}${route.path}`,
      path: route.path,
      lastmod: currentDate,
      changefreq: route.changefreq,
      priority: route.priority,
      title: route.title,
      category: route.category,
      description: route.description
    });
  });

  // Sort logically by priority descending, then by title
  return routes.sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title));
}

/**
 * Generates formatted, W3C-compliant XML sitemap.
 */
export function generateXmlSitemap(domain: string = 'https://mtxcapital.ai.studio'): string {
  const routes = getRegisteredSitemapRoutes(domain);

  const urlNodes = routes
    .map((r) => {
      return `  <url>
    <loc>${escapeXml(r.loc)}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(2)}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>`;
}

/**
 * Helper to trigger browser download of sitemap.xml
 */
export function downloadSitemapXml(domain?: string): void {
  if (typeof window === 'undefined') return;

  const currentDomain = domain || window.location.origin;
  const xmlContent = generateXmlSitemap(currentDomain);
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'sitemap.xml');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
