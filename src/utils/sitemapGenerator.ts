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
    path: '/#instruments',
    changefreq: 'weekly',
    priority: 0.85,
    title: 'Financial Assets & Multi-Asset Instruments Catalog',
    category: 'Market Data Catalog',
    description: 'Comprehensive directory of equities, treasury yields, index futures, option chains, and digital assets available for prime execution.'
  },
  {
    path: '/#calculator',
    changefreq: 'weekly',
    priority: 0.85,
    title: 'Institutional Margin & Volatility Position Calculator',
    category: 'Systemic Calculators',
    description: 'Interactive portfolio margin requirement simulator, Value at Risk (VaR) analyzer, and compound return projections.'
  },
  {
    path: '/#faq',
    changefreq: 'weekly',
    priority: 0.75,
    title: 'Operations FAQ & Clearing Terminal Documentation',
    category: 'Documentation',
    description: 'Detailed platform documentation covering order routing rules, SEC 15c3-3 customer isolation, and execution latency benchmarks.'
  },
  {
    path: '/#terms',
    changefreq: 'monthly',
    priority: 0.60,
    title: 'Terms of Service & Custodial Agreements',
    category: 'Regulatory & Compliance',
    description: 'Institutional prime brokerage service terms, customer account segregation standards, and execution rulesets.'
  },
  {
    path: '/#privacy',
    changefreq: 'monthly',
    priority: 0.60,
    title: 'Privacy Policy & Data Security Protocols',
    category: 'Regulatory & Compliance',
    description: 'End-to-end telemetry encryption policies, zero-knowledge credentials handling, and data retention standards.'
  },
  {
    path: '/#disclosures',
    changefreq: 'monthly',
    priority: 0.60,
    title: 'Regulatory Risk Disclosures & Leverage Warnings',
    category: 'Regulatory & Compliance',
    description: 'FINRA / SEC margin disclosures, systemic liquidity risks, and options risk disclosure statements.'
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
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Equities / Tech', priority: 0.88 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Equities / Tech', priority: 0.90 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Equities / Consumer', priority: 0.88 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Equities / Tech', priority: 0.88 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Equities / Consumer', priority: 0.85 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'Indices / ETFs', priority: 0.92 },
  { symbol: 'BTC', name: 'Bitcoin / USD', sector: 'Digital Assets', priority: 0.90 },
  { symbol: 'ETH', name: 'Ethereum / USD', sector: 'Digital Assets', priority: 0.85 },
];

/**
 * Dynamically crawls workspaces, SEO specifications, ticker databases,
 * and core endpoints to construct a production-ready, structured sitemap.
 */
export function getRegisteredSitemapRoutes(domain: string = 'https://mtxquant.com'): SitemapRoute[] {
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
      title: `${ws.seoTitle} | MTXcapital Prime Terminal`,
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
      title: `${ws.name} - Quantitative Feature Architecture & Technical Specs`,
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
      title: `${item.symbol} (${item.name}) - Real-Time Quotes, Order Depth & Risk Analytics`,
      category: 'Symbol Terminal',
      description: `Live multi-venue liquidity depth, order book imbalance metrics, and volatility risk profiles for ${item.name} (${item.symbol}).`
    });
  });

  // 5. Utility, Legal, Disclosures, and Calculators
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
export function generateXmlSitemap(domain: string = 'https://mtxquant.com'): string {
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
