import { useEffect } from 'react';

export type WorkspaceSeoKey = 
  | 'HOMEPAGE'
  | 'MARKETS'
  | 'DISCOVER'
  | 'PORTFOLIO'
  | 'WATCHLIST'
  | 'FUNDING'
  | 'ACTIVITY'
  | 'ANALYSIS'
  | 'BACKTEST'
  | 'SENTIMENT';

export interface WorkspaceSeoSpec {
  title: string;
  description: string;
  keywords: string;
  category: string;
  featureList: string[];
  schemaType: 'FinancialService' | 'SoftwareApplication';
  priceCurrency?: string;
  price?: string;
}

export const WORKSPACE_SEO_SPECS: Record<WorkspaceSeoKey, WorkspaceSeoSpec> = {
  HOMEPAGE: {
    title: 'MTXquant | Institutional Quantitative Trading Terminal & DMA Platform',
    description: 'MTXquant is a high-frequency quantitative trading platform featuring sub-millisecond order routing, real-time Value-at-Risk (VaR) analytics, Level 2 depth feeds, and direct market access.',
    keywords: 'Quantitative Trading, DMA Terminal, High-Frequency Trading, Order Execution Engine, Multi-Asset Trading, Level 2 Order Book, Financial Software',
    category: 'Institutional Trading Platform',
    featureList: [
      'Sub-1.2ms DMA Order Matching Engine',
      'Real-Time Level 2 / Level 3 Depth Feeds',
      'Non-Linear Portfolio Value-at-Risk (VaR) Engine',
      'ATR Volatility-Adjusted Position Sizing Calculator',
      'Segregated Bank Custody & FDIC Cash Sweeps'
    ],
    schemaType: 'FinancialService'
  },
  MARKETS: {
    title: 'Quantitative Trading Terminal & DMA Matching Engine | MTXquant',
    description: 'Execute equities, forex, crypto, and derivatives with sub-millisecond order routing, dynamic ATR position sizing, and live Level 2 depth of market.',
    keywords: 'Quantitative Trading Terminal, Direct Market Access, Level 2 Order Book, ATR Position Sizing, Real-time Charting, Equity Execution',
    category: 'Trading Execution Terminal',
    featureList: [
      'Sub-millisecond Direct Market Access (DMA)',
      'Depth-of-Market (DOM) Order Book Aggregation',
      'Interactive ATR Volatility Risk Sizing Ticket',
      'Multiple Order Types: Limit, Stop-Limit, Iceberg, Bracket'
    ],
    schemaType: 'SoftwareApplication',
    priceCurrency: 'USD',
    price: '0.00'
  },
  DISCOVER: {
    title: 'Market Discovery & Systematic Equity Screener | MTXquant',
    description: 'Scan global equities and crypto assets using quantitative valuation ratios, multi-factor momentum filters, and real-time relative volume anomaly alerts.',
    keywords: 'Stock Screener, Market Discovery, Multi-Factor Screening, Relative Volume Anomaly, PE Ratio Filter, Quantitative Stock Radar',
    category: 'Financial Market Intelligence',
    featureList: [
      'Multi-factor Market Cap and Valuation Filters',
      'Intraday Relative Volume (RVOL) Spike Alerts',
      'Cross-Asset Sector Weight Distribution Matrices'
    ],
    schemaType: 'SoftwareApplication'
  },
  PORTFOLIO: {
    title: 'Real-Time Value-at-Risk (VaR) & Compounding Engine | MTXquant',
    description: 'Monitor multi-asset portfolio heat, 99% daily Value-at-Risk bounds, leverage safety gates, and project long-term wealth compounding trajectories.',
    keywords: 'Portfolio Risk Desk, Value at Risk Calculator, Parametric VaR, Compound Wealth Simulator, Portfolio Margin Safety Gate',
    category: 'Portfolio Risk Analytics',
    featureList: [
      'Non-Linear Parametric 99% 1-Day VaR Calculation',
      'Multi-Year Compound Wealth Accumulation Sandbox',
      'Leverage Safety Guard & Liquidation Prevention'
    ],
    schemaType: 'SoftwareApplication'
  },
  WATCHLIST: {
    title: 'Dynamic Watchlist & Saliency Radar Screener | MTXquant',
    description: 'Track multi-asset index tickers with proprietary saliency scoring, sub-5ms client filtering, and instant terminal chart synchronization.',
    keywords: 'Stock Watchlist Radar, Saliency Score, Real-time Ticker Feed, Volatility Filter, Direct Chart Binding',
    category: 'Market Watchlist Engine',
    featureList: [
      'Proprietary 0-100 Saliency Volatility Score',
      'Sub-5ms Memory-Indexed Ticker Filtering',
      'One-Click Direct Terminal Synchronization'
    ],
    schemaType: 'SoftwareApplication'
  },
  FUNDING: {
    title: 'Institutional Wallet & Segregated Treasury Custody | MTXquant',
    description: 'Manage segregated trust accounts, FDIC multi-bank cash sweeps up to $5M, instant Fedwire funding, and collateral-backed credit lines.',
    keywords: 'Institutional Wallet Desk, FDIC Cash Sweep, Segregated Trust Custody, Treasury Management, Fedwire Settlement',
    category: 'Capital Custody Infrastructure',
    featureList: [
      'Bankruptcy-Remote Segregated Trust Custody',
      'Programmatic FDIC Cash Sweep up to $5,000,000',
      'Instant Fedwire & ACH Ledger Clearing'
    ],
    schemaType: 'FinancialService'
  },
  ACTIVITY: {
    title: 'Cryptographic Transaction Audit Logs & Execution Ledgers | MTXquant',
    description: 'Inspect microsecond time-stamped execution receipts, SHA-256 verified trade hashes, FINRA Rule 2232 compliant tax matrices, and fee diagnostics.',
    keywords: 'Transaction Audit Logs, SHA-256 Trade Receipts, FINRA Compliant Reports, Execution Microsecond Timestamps, Tax Loss Export',
    category: 'Compliance & Audit Engine',
    featureList: [
      'Precision Time Protocol (PTP) Microsecond Timestamps',
      'Cryptographically Hashed SHA-256 Execution Receipts',
      'One-Click Form 8949 Tax Matrix PDF & CSV Export'
    ],
    schemaType: 'SoftwareApplication'
  },
  ANALYSIS: {
    title: 'Mathematical Asset Correlation & Market Intelligence | MTXquant',
    description: 'Explore pairwise Pearson correlation heatmaps across 50+ instruments, sector rotation models, Jensen Alpha, and systemic risk matrices.',
    keywords: 'Asset Correlation Heatmap, Pearson Matrix, Quantitative Market Intelligence, Sector Rotation Tracker, Beta Alpha Analytics',
    category: 'Quantitative Market Analytics',
    featureList: [
      'Dynamic Pearson Correlation Coefficient Heatmap',
      '11 GICS Sector Rotation Money Flow Vectors',
      'Jensen Alpha & Treynor Ratio Benchmark Calculations'
    ],
    schemaType: 'SoftwareApplication'
  },
  BACKTEST: {
    title: 'Algorithmic Strategy Backtester & Monte Carlo Simulator | MTXquant',
    description: 'Replay years of microsecond tick data, model volume-weighted slippage, evaluate 1,000 Monte Carlo drawdown paths, and optimize Sharpe ratios.',
    keywords: 'Algorithmic Backtester, Monte Carlo Simulation, Order Book Slippage Engine, Sharpe Ratio Optimizer, Strategy Backtesting',
    category: 'Quantitative Strategy Sandbox',
    featureList: [
      'Microsecond Tick-Level Historical Replay Engine',
      '1,000-Scenario Monte Carlo Drawdown Simulator',
      'Volume-Weighted Slippage & Spread Decay Modeling'
    ],
    schemaType: 'SoftwareApplication'
  },
  SENTIMENT: {
    title: 'Institutional Dark Pool Radar & Options Gamma Flow | MTXquant',
    description: 'Track off-exchange dark pool block prints, aggressive multi-leg options sweeps, smart money flow, and retail sentiment divergence alerts.',
    keywords: 'Dark Pool Scanner, Institutional Order Flow, Options Sweep Radar, Gamma Surge Detector, Smart Money Divergence',
    category: 'Order Flow Intelligence',
    featureList: [
      'TRF Dark Pool Block Print Volume Clustering',
      'Aggressive Multi-Leg Options Sweep Detection',
      'Smart Money vs. Retail Sentiment Divergence Alerts'
    ],
    schemaType: 'SoftwareApplication'
  }
};

/**
 * Custom React Hook to dynamically inject JSON-LD Schema.org metadata
 * and update standard document SEO meta tags based on active workspace view.
 */
export function useSeoMetadata(activeWorkspace: WorkspaceSeoKey) {
  useEffect(() => {
    const spec = WORKSPACE_SEO_SPECS[activeWorkspace] || WORKSPACE_SEO_SPECS.HOMEPAGE;
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://mtxquant.com';
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://mtxquant.com';

    // 1. Update Document Title
    document.title = spec.title;

    // Helper to create or update meta tag
    const setMetaTag = (attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to create or update link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', spec.description);
    setMetaTag('name', 'keywords', spec.keywords);
    setMetaTag('name', 'robots', 'index, follow, max-snippet:-1, max-image-preview:large');

    // 3. Open Graph Meta Tags
    setMetaTag('property', 'og:title', spec.title);
    setMetaTag('property', 'og:description', spec.description);
    setMetaTag('property', 'og:type', spec.schemaType === 'FinancialService' ? 'website' : 'article');
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:site_name', 'MTXquant Institutional Trading Platform');

    // 4. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', spec.title);
    setMetaTag('name', 'twitter:description', spec.description);

    // 5. Canonical Link
    setLinkTag('canonical', currentUrl);

    // 6. JSON-LD Structured Data Schema Injection
    const scriptId = 'json-ld-financial-schema';
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = scriptId;
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }

    // Construct BreadcrumbList schema items
    const breadcrumbItems = [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'MTXquant Terminal',
        'item': baseUrl
      }
    ];

    if (activeWorkspace === 'HOMEPAGE') {
      breadcrumbItems.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'Institutional Quantitative Trading & DMA Platform',
        'item': baseUrl
      });
    } else {
      breadcrumbItems.push({
        '@type': 'ListItem',
        'position': 2,
        'name': spec.category,
        'item': `${baseUrl}#${spec.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      });
      breadcrumbItems.push({
        '@type': 'ListItem',
        'position': 3,
        'name': spec.title.split('|')[0].trim(),
        'item': currentUrl
      });
    }

    // Construct Schema.org JSON Object
    const jsonLdData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${baseUrl}#organization`,
          'name': 'MTXquant Capital Technologies',
          'url': baseUrl,
          'logo': `${baseUrl}/icon.png`,
          'description': 'Institutional quantitative trading infrastructure and direct market access execution technologies.',
          'knowsAbout': [
            'Quantitative Finance',
            'Direct Market Access',
            'Order Matching Engines',
            'Portfolio Value-at-Risk',
            'High-Frequency Algorithmic Execution'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${baseUrl}#breadcrumb`,
          'itemListElement': breadcrumbItems
        },
        {
          '@type': spec.schemaType,
          '@id': `${baseUrl}#${activeWorkspace.toLowerCase()}-service`,
          'name': spec.title,
          'description': spec.description,
          'url': currentUrl,
          'category': spec.category,
          'provider': {
            '@type': 'Organization',
            'name': 'MTXquant Capital'
          },
          'hasOfferCatalog': {
            '@type': 'OfferCatalog',
            'name': `${spec.category} Features Catalog`,
            'itemListElement': spec.featureList.map((feat, idx) => ({
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': feat,
                'description': `Institutional feature capability: ${feat}`
              },
              'position': idx + 1
            }))
          },
          'offers': {
            '@type': 'Offer',
            'price': spec.price || '0.00',
            'priceCurrency': spec.priceCurrency || 'USD',
            'availability': 'https://schema.org/InStock',
            'seller': {
              '@type': 'Organization',
              'name': 'MTXquant'
            }
          }
        }
      ]
    };

    scriptElement.textContent = JSON.stringify(jsonLdData, null, 2);

    return () => {
      // Clean up script if hook unmounts
      if (scriptElement && scriptElement.parentNode) {
        // We keep it updated rather than removing to avoid flash of metadata
      }
    };
  }, [activeWorkspace]);
}
