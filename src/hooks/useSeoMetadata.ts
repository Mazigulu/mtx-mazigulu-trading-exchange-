import { useEffect } from 'react';

export type WorkspaceSeoKey = 
  | 'HOMEPAGE'
  | 'MARKETS'
  | 'DISCOVER'
  | 'SCREENER'
  | 'PORTFOLIO'
  | 'WALLET'
  | 'WATCHLIST'
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
  fractionalProps?: {
    minInvestment: string;
    precision: string;
    assetCoverage: string[];
  };
}

export const WORKSPACE_SEO_SPECS: Record<WorkspaceSeoKey, WorkspaceSeoSpec> = {
  HOMEPAGE: {
    title: 'MTXcapital | Institutional Fractional Trading Platform | Stocks, Bonds & Treasuries',
    description: 'MTXcapital is an institutional-grade multi-asset brokerage for fractional equities, corporate bonds, and US Treasuries starting at $1 with sub-millisecond execution, 0 commission, real-time VaR portfolio margin, and 4.85% APY cash sweeps.',
    keywords: 'fractional trading platform, buy fractionalized stocks, fractional shares broker, buy fractional bonds, fractional US treasuries, fractional ETF purchases, fractional trading app, zero commission fractional trading, US treasury bills 1 dollar',
    category: 'Fractional Trading Platform',
    featureList: [
      'Fractional stock execution starting at $1 across US equities',
      'Fractional US Treasury bills and corporate bond trading with 8-decimal precision',
      'Sub-1.2ms DMA order matching engine with zero commission',
      'Real-time Level 2 depth feeds & interactive candlestick charting',
      'Parametric 99% 1-Day Value-at-Risk (VaR) portfolio margin engine',
      'Automated 4.85% APY FDIC-insured multi-bank cash sweep and 1% matching IRAs'
    ],
    schemaType: 'FinancialService',
    fractionalProps: {
      minInvestment: '$1.00 USD',
      precision: '8 decimal places (0.00000001)',
      assetCoverage: ['US Equities', 'US Treasuries', 'Corporate Bonds', 'ETFs', 'Crypto']
    }
  },
  MARKETS: {
    title: 'Fractional Stock & Bond Trading Terminal | MTXcapital',
    description: 'Execute fractional shares on 5,000+ US equities, corporate bonds, and US Treasuries with sub-millisecond order routing, ATR volatility risk sizing, and Level 2 depth.',
    keywords: 'fractional share trading terminal, fractional stock order, Level 2 depth of market, ATR position sizing, stock order execution',
    category: 'Trading Execution Terminal',
    featureList: [
      'Precision fractional order routing down to 8 decimal places',
      'Sub-millisecond Direct Market Access (DMA) execution',
      'Interactive ATR volatility-adjusted position sizing calculator',
      'Depth-of-Market (DOM) order book aggregation with live trade tape'
    ],
    schemaType: 'SoftwareApplication',
    priceCurrency: 'USD',
    price: '0.00'
  },
  DISCOVER: {
    title: 'Fractional Asset Discovery & Systematic Equity Screener | MTXcapital',
    description: 'Scan fractionalized equities, ETF index baskets, and sovereign bonds using quantitative valuation ratios, multi-factor momentum filters, and relative volume anomaly alerts.',
    keywords: 'fractional stock discovery, systematic stock screener, multi-factor screening, relative volume anomaly, PE ratio filter, alpha momentum scanner',
    category: 'Financial Market Intelligence',
    featureList: [
      'Multi-factor market cap and valuation factor screening',
      'Intraday relative volume (RVOL) anomaly detector',
      'Cross-asset sector weight distribution matrices'
    ],
    schemaType: 'SoftwareApplication'
  },
  SCREENER: {
    title: 'Multi-Asset Quantitative Screener & Fractional Bond Desk | MTXcapital',
    description: 'Filter 290+ global equities, fractional corporate bonds, US Treasuries, and crypto assets using custom multi-factor weighting, ROE, debt-to-equity bounds, and institutional strategy presets.',
    keywords: 'fractional bond screener, quantitative stock screener, treasury yield screener, multi-factor stock filter, alpha rank screener, family office presets',
    category: 'Quantitative Stock Screening',
    featureList: [
      'Multi-factor custom weighting matrix with live ranking',
      'Prop desk and institutional strategy presets',
      'Fractional US Treasury and corporate bond filter desk',
      'Institutional CSV and JSON data export engine'
    ],
    schemaType: 'SoftwareApplication'
  },
  PORTFOLIO: {
    title: 'Fractional Portfolio Risk, Value-at-Risk (VaR) & 4.85% Cash Sweep | MTXcapital',
    description: 'Monitor multi-asset fractional portfolios, 99% daily Value-at-Risk bounds, leverage safety gates, automated 4.85% APY FDIC cash sweep ledgers, and multi-year compounding trajectories.',
    keywords: 'fractional portfolio manager, Value at Risk calculator, 4.85% cash sweep, compound wealth simulator, portfolio margin safety gate, fractional asset allocation',
    category: 'Portfolio Risk Analytics',
    featureList: [
      'Non-linear parametric 99% 1-Day VaR calculation',
      'Automated 4.85% APY FDIC-insured multi-bank cash sweep ledger',
      'Multi-year compound wealth accumulation sandbox',
      'Leverage safety guard and liquidation prevention barrier'
    ],
    schemaType: 'SoftwareApplication'
  },
  WALLET: {
    title: 'Multi-Asset Funding Desk & Institutional Capital Wallet | MTXcapital',
    description: 'Instant multi-currency deposits, fiat bank wire clearing, automated stablecoin rails (USDC, USDT, PYUSD), on-chain custody addresses, and real-time ledger settlement.',
    keywords: 'institutional wallet, brokerage funding, bank wire deposit, stablecoin crypto rails, ACH clearing, instant deposit, withdrawal ledger',
    category: 'Funding & Custody Desk',
    featureList: [
      'Multi-currency fiat bank rails (USD, EUR, GBP, KES) and ACH clearing',
      'Real-time ERC20, Bitcoin, and Base stablecoin deposit gateways',
      'On-chain identity-linked custody address generator',
      'Instant settlement & audited capital ledger reconciliation'
    ],
    schemaType: 'FinancialService'
  },
  WATCHLIST: {
    title: 'Dynamic Watchlist & Fractional Asset Saliency Radar | MTXcapital',
    description: 'Track multi-asset fractional tickers with proprietary 0-100 volatility saliency scoring, sub-5ms client memory indexing, and instant terminal chart synchronization.',
    keywords: 'fractional stock watchlist, saliency score radar, real-time ticker feed, volatility filter, direct chart binding',
    category: 'Market Watchlist Engine',
    featureList: [
      'Proprietary 0-100 volatility saliency scoring algorithm',
      'Sub-5ms memory-indexed ticker search and filtering',
      'One-click direct terminal synchronization'
    ],
    schemaType: 'SoftwareApplication'
  },
  ACTIVITY: {
    title: 'Cryptographic Execution Logs & Fractional Trade Receipts | MTXcapital',
    description: 'Inspect microsecond time-stamped fractional execution receipts, SHA-256 verified trade hashes, FINRA Rule 2232 compliant tax matrices (Form 8949), and fee diagnostics.',
    keywords: 'fractional trade audit log, SHA-256 trade receipts, FINRA compliant reports, execution microsecond timestamps, form 8949 tax export',
    category: 'Compliance & Audit Engine',
    featureList: [
      'Precision Time Protocol (PTP) microsecond timestamps',
      'Cryptographically hashed SHA-256 execution receipts',
      'One-click Form 8949 tax matrix PDF & CSV export'
    ],
    schemaType: 'SoftwareApplication'
  },
  ANALYSIS: {
    title: 'Mathematical Asset Correlation & Sector Intelligence | MTXcapital',
    description: 'Explore pairwise Pearson correlation heatmaps across 50+ fractional instruments, sector rotation models, Jensen Alpha, and systemic risk matrices.',
    keywords: 'asset correlation heatmap, pearson matrix, sector rotation tracker, quantitative market intelligence, beta alpha analytics',
    category: 'Quantitative Market Analytics',
    featureList: [
      'Dynamic Pearson correlation coefficient heatmap',
      '11 GICS sector rotation money flow vectors',
      'Jensen Alpha & Treynor ratio benchmark calculations'
    ],
    schemaType: 'SoftwareApplication'
  },
  BACKTEST: {
    title: 'Algorithmic Strategy Backtester & Monte Carlo Simulator | MTXcapital',
    description: 'Replay years of microsecond tick data, model fractional volume-weighted slippage, evaluate 1,000 Monte Carlo drawdown paths, and optimize Sharpe ratios.',
    keywords: 'algorithmic backtester, monte carlo simulation, fractional order slippage, sharpe ratio optimizer, quantitative strategy testing',
    category: 'Quantitative Strategy Sandbox',
    featureList: [
      'Microsecond tick-level historical replay engine',
      '1,000-scenario Monte Carlo drawdown simulator',
      'Volume-weighted slippage & spread decay modeling'
    ],
    schemaType: 'SoftwareApplication'
  },
  SENTIMENT: {
    title: 'Institutional Dark Pool Radar & Options Gamma Flow | MTXcapital',
    description: 'Track off-exchange dark pool block prints, aggressive multi-leg options sweeps, smart money flow vectors, and retail sentiment divergence alerts.',
    keywords: 'dark pool scanner, institutional order flow, options sweep radar, gamma surge detector, smart money divergence',
    category: 'Order Flow Intelligence',
    featureList: [
      'TRF dark pool block print volume clustering',
      'Aggressive multi-leg options sweep detection',
      'Smart money vs. retail sentiment divergence alerts'
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
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://mtxcapital.ai.studio';
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://mtxcapital.ai.studio';

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
        element.setAttribute(rel, rel);
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
    setMetaTag('property', 'og:site_name', 'MTXcapital Multi-Asset Trading Platform');

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
        'name': 'MTXcapital Terminal',
        'item': baseUrl
      }
    ];

    if (activeWorkspace === 'HOMEPAGE') {
      breadcrumbItems.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'Institutional Fractionalized Trading Platform',
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
          'name': 'MTXcapital Technologies',
          'url': baseUrl,
          'logo': `${baseUrl}/icon.png`,
          'description': 'Global leader in multi-asset fractionalized trading infrastructure, prime brokerage, and quantitative execution technologies.',
          'knowsAbout': [
            'Fractionalized Stock Trading',
            'Quantitative Execution',
            'Fractional US Treasury Bills',
            'Fractional Corporate Bonds',
            'Quantitative Finance',
            'Direct Market Access',
            'Portfolio Value-at-Risk (VaR)',
            'High-Yield Cash Sweeps (4.85% APY)'
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
            'name': 'MTXcapital'
          },
          'hasOfferCatalog': {
            '@type': 'OfferCatalog',
            'name': `${spec.category} Features Catalog`,
            'itemListElement': spec.featureList.map((feat, idx) => ({
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': feat,
                'description': `Fractionalized capability: ${feat}`
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
              'name': 'MTXcapital'
            }
          }
        }
      ]
    };

    scriptElement.textContent = JSON.stringify(jsonLdData, null, 2);

    return () => {
      // Keep it cleanly mounted
    };
  }, [activeWorkspace]);
}
