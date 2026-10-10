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
    title: 'mtxcapital | Institutional Fractional Trading Platform | Stocks, Bonds & Treasuries',
    description: 'MTXcapital is an institutional-grade multi-asset brokerage and fractional trading platform. Buy fractionalized stocks, corporate bonds, and US Treasuries starting at $1 with sub-millisecond execution, zero commission, real-time Value-at-Risk portfolio margin, 4.85% APY cash sweeps, and 1% matching IRAs.',
    keywords: 'fractional trading platform, buy fractionalized stocks, fractional shares broker, buy fractional bonds, fractional US treasuries, dollar based stock investing, fractional ETF purchases, zero commission fractional trading, US treasury bills 1 dollar, fractional share order routing, fractional fixed income, multi-asset brokerage, quantitative trading terminal, sub-millisecond execution, Value-at-Risk, portfolio margining, high yield cash sweep, 4.85% APY cash sweep, 1% IRA match, NVDA fractional shares, AAPL fractional stock, MSFT fractional shares, TSLA fractional stock, SPY fractional ETF',
    category: 'Fractional Trading Platform',
    featureList: [
      'Fractional stock execution starting at $1 across 5,000+ US equities and ETFs',
      'Fractional US Treasury bills and corporate bond trading with 8-decimal precision',
      'Sub-1.2ms DMA order matching engine with zero commission',
      'Real-time Level 2 depth feeds & interactive technical candlestick charting',
      'Parametric 99% 1-Day Value-at-Risk (VaR) portfolio margin engine',
      'Automated 4.85% APY FDIC-insured multi-bank cash sweep and 1% matching IRAs',
      'Cryptographically verified SHA-256 trade receipts with PTP microsecond timestamps'
    ],
    schemaType: 'FinancialService',
    fractionalProps: {
      minInvestment: '$1.00 USD',
      precision: '8 decimal places (0.00000001)',
      assetCoverage: ['US Equities', 'US Treasuries', 'Corporate Bonds', 'ETFs', 'Digital Assets']
    }
  },
  MARKETS: {
    title: 'Fractional Share Trading Terminal & Broker | Buy Fractionalized Stocks | MTXcapital',
    description: 'Execute dollar-based fractional share orders on 5,000+ US stocks (NVDA, AAPL, MSFT, TSLA) and ETFs starting at $1 with zero commission, sub-millisecond DMA routing, Level 2 depth of market, and ATR volatility risk sizing.',
    keywords: 'fractional share trading terminal, fractional shares broker, buy fractionalized stocks, dollar based stock investing, zero commission fractional trading, NVDA fractional shares, AAPL fractional stock, MSFT fractional shares, TSLA fractional stock, Level 2 depth of market, ATR position sizing, stock order execution',
    category: 'Trading Execution Terminal',
    featureList: [
      'Precision fractional order routing down to 8 decimal places with $1 minimum',
      'Sub-millisecond Direct Market Access (DMA) execution across lit and dark pools',
      'Interactive ATR volatility-adjusted position sizing calculator',
      'Depth-of-Market (DOM) order book aggregation with live trade tape'
    ],
    schemaType: 'SoftwareApplication',
    priceCurrency: 'USD',
    price: '0.00'
  },
  DISCOVER: {
    title: 'Fractional Asset Discovery & Systematic Equity Screener | MTXcapital',
    description: 'Scan fractionalized stocks, benchmark ETFs, and corporate bonds with multi-factor valuation metrics, intraday relative volume (RVOL) anomaly alerts, and quantitative alpha ranking.',
    keywords: 'fractional stock discovery, systematic stock screener, buy fractionalized stocks, fractional ETF purchases, multi-factor screening, relative volume anomaly RVOL, PE ratio filter, alpha momentum scanner',
    category: 'Financial Market Intelligence',
    featureList: [
      'Multi-factor market cap, P/E, EV/EBITDA, and valuation factor screening',
      'Intraday relative volume (RVOL) anomaly detector for high-momentum assets',
      'Cross-asset sector weight distribution matrices for fractional equity portfolios'
    ],
    schemaType: 'SoftwareApplication'
  },
  SCREENER: {
    title: 'Fractional Bond & Treasury Yield Screener | Sovereign Debt & Equities | MTXcapital',
    description: 'Screen fractional US Treasuries (3M, 2Y, 10Y, 30Y) and high-grade corporate bonds starting at $1. Filter 290+ multi-asset instruments with institutional factor presets, yield curves, and fixed income analytics.',
    keywords: 'fractional US treasuries, buy fractional bonds, US treasury bills 1 dollar, fractional fixed income, treasury yield screener, fractional bond desk, quantitative stock screener, multi-factor stock filter, alpha rank screener',
    category: 'Quantitative Stock & Fixed Income Screening',
    featureList: [
      'Fractional US Treasury and corporate bond screening starting at $1',
      'Multi-factor custom weighting matrix with live quantitative ranking',
      'Prop desk and institutional strategy presets for systematic desks',
      'Institutional CSV and JSON data export engine for algorithmic workflows'
    ],
    schemaType: 'SoftwareApplication'
  },
  PORTFOLIO: {
    title: 'Fractional Portfolio Risk, Value-at-Risk (VaR) & 4.85% Cash Sweep | MTXcapital',
    description: 'Monitor multi-asset fractional portfolios, 99% daily Value-at-Risk bounds, real-time portfolio margining, automated 4.85% APY FDIC cash sweep ledgers, and multi-year compound wealth projections.',
    keywords: 'fractional portfolio manager, Value at Risk calculator, portfolio margining, 4.85% APY cash sweep, FDIC cash sweep, 1% IRA match, compound wealth simulator, portfolio margin safety gate, fractional asset allocation',
    category: 'Portfolio Risk Analytics',
    featureList: [
      'Non-linear parametric 99% 1-Day VaR calculation and portfolio margin engine',
      'Automated 4.85% APY FDIC-insured multi-bank cash sweep ledger',
      'Multi-year compound wealth accumulation sandbox with dividend reinvestment',
      'Leverage safety guard and liquidation prevention barrier'
    ],
    schemaType: 'SoftwareApplication'
  },
  WALLET: {
    title: 'Multi-Asset Funding Desk & Institutional Capital Wallet | MTXcapital',
    description: 'Fund your fractional trading account with instant bank wires, ACH, cards, and stablecoin rails (USDC/USDT). Automatic enrollment in 4.85% APY FDIC cash sweeps with Tier-1 segregated custody.',
    keywords: 'institutional wallet, brokerage funding desk, 4.85% APY cash sweep, bank wire deposit, stablecoin crypto rails, ACH clearing, instant deposit broker, segregated custody SEC 15c3-3, withdrawal ledger',
    category: 'Funding & Custody Desk',
    featureList: [
      'Multi-currency fiat bank rails (USD, EUR, GBP) and instant ACH clearing',
      'Real-time ERC20, Bitcoin, and Base stablecoin deposit gateways',
      'Automatic routing to 4.85% APY FDIC-insured multi-bank cash sweep',
      'Instant settlement & audited capital ledger reconciliation'
    ],
    schemaType: 'FinancialService'
  },
  WATCHLIST: {
    title: 'Dynamic Fractional Watchlist & Volatility Saliency Radar | MTXcapital',
    description: 'Track high-volume fractional tickers (NVDA, AAPL, TSLA) with proprietary 0-100 volatility saliency scoring, sub-5ms client memory indexing, and instant terminal chart synchronization.',
    keywords: 'fractional stock watchlist, NVDA fractional shares, AAPL fractional stock, saliency score radar, real-time ticker feed, volatility filter, direct chart binding',
    category: 'Market Watchlist Engine',
    featureList: [
      'Proprietary 0-100 volatility saliency scoring algorithm for top tickers',
      'Sub-5ms memory-indexed ticker search and multi-asset filtering',
      'One-click direct terminal synchronization with Level 2 depth'
    ],
    schemaType: 'SoftwareApplication'
  },
  ACTIVITY: {
    title: 'Cryptographic Execution Logs & Fractional Trade Receipts | MTXcapital',
    description: 'Audit fractional stock and bond executions with microsecond PTP timestamps, SHA-256 cryptographic trade verification receipts, and FINRA Rule 2232 / Form 8949 tax export.',
    keywords: 'fractional trade audit log, SHA-256 trade receipts, FINRA compliant reports, execution microsecond timestamps, form 8949 tax export, zero commission trade receipt',
    category: 'Compliance & Audit Engine',
    featureList: [
      'Precision Time Protocol (PTP) microsecond timestamps on every fractional fill',
      'Cryptographically hashed SHA-256 execution receipts verifiable on-demand',
      'One-click Form 8949 tax matrix PDF & CSV export for seamless accounting'
    ],
    schemaType: 'SoftwareApplication'
  },
  ANALYSIS: {
    title: 'Mathematical Asset Correlation & Sector Intelligence | MTXcapital',
    description: 'Explore pairwise Pearson correlation heatmaps across fractional stocks, Treasuries, and index ETFs. Track 11 GICS sector money flows, Jensen Alpha, and systemic market risk.',
    keywords: 'asset correlation heatmap, pearson matrix, sector rotation tracker, quantitative market intelligence, beta alpha analytics, cross asset correlation',
    category: 'Quantitative Market Analytics',
    featureList: [
      'Dynamic Pearson correlation coefficient heatmap across multi-asset universe',
      '11 GICS sector rotation money flow vectors and momentum indicators',
      'Jensen Alpha & Treynor ratio benchmark calculations against S&P 500'
    ],
    schemaType: 'SoftwareApplication'
  },
  BACKTEST: {
    title: 'Algorithmic Strategy Backtester & Monte Carlo Simulator | MTXcapital',
    description: 'Replay years of microsecond tick data, model fractional volume-weighted slippage, evaluate 1,000 Monte Carlo drawdown paths, and optimize Sharpe ratios.',
    keywords: 'algorithmic backtester, monte carlo simulation, fractional order slippage, sharpe ratio optimizer, quantitative strategy testing, tick level backtesting',
    category: 'Quantitative Strategy Sandbox',
    featureList: [
      'Microsecond tick-level historical replay engine for equities and ETFs',
      '1,000-scenario Monte Carlo drawdown simulator for strategy stress testing',
      'Volume-weighted slippage & spread decay modeling for fractional orders'
    ],
    schemaType: 'SoftwareApplication'
  },
  SENTIMENT: {
    title: 'Institutional Dark Pool Radar & Options Gamma Flow | MTXcapital',
    description: 'Track off-exchange dark pool block prints, aggressive multi-leg options sweeps, smart money flow vectors, and retail sentiment divergence alerts in real time.',
    keywords: 'dark pool scanner, institutional order flow, options sweep radar, gamma surge detector, smart money divergence, unusual options activity',
    category: 'Order Flow Intelligence',
    featureList: [
      'TRF off-exchange dark pool block print volume clustering',
      'Aggressive multi-leg options sweep detection and institutional positioning',
      'Smart money vs. retail sentiment divergence alerts for high-conviction entries'
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
