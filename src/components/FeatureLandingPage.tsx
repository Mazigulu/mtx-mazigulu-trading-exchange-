import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSeoMetadata, WorkspaceSeoKey } from '../hooks/useSeoMetadata';
import { 
  ArrowLeft, 
  ArrowRight, 
  LineChart, 
  Briefcase, 
  List, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  BarChart2, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Cpu, 
  Lock, 
  Download, 
  Sparkles, 
  Sliders, 
  HelpCircle, 
  ExternalLink,
  ChevronDown,
  Globe,
  Database,
  Radio,
  Clock,
  PieChart,
  Search,
  Filter,
  Menu,
  X,
  Apple,
  Play
} from 'lucide-react';

export type FeatureId = 
  | 'markets' 
  | 'portfolio' 
  | 'watchlist' 
  | 'funding' 
  | 'activity' 
  | 'analysis' 
  | 'backtest' 
  | 'sentiment';

interface FeatureLandingPageProps {
  featureId: FeatureId;
  onClose: () => void;
  onLaunchTerminal: (mode?: 'signin' | 'register') => void;
  onNavigateToFeature: (id: FeatureId) => void;
}

interface FeatureDetailSpec {
  id: FeatureId;
  name: string;
  badge: string;
  category: string;
  seoTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  icon: React.ReactNode;
  specs: { label: string; value: string; desc: string }[];
  problemStatement: string;
  solutionNarrative: string;
  architectureHighlights: { title: string; desc: string; icon: React.ReactNode }[];
  workflowSteps: { step: string; title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  keywords: string[];
}

export const FEATURE_SPECS: Record<FeatureId, FeatureDetailSpec> = {
  markets: {
    id: 'markets',
    name: 'Markets View & Execution Engine',
    badge: 'Core Match Engine',
    category: 'High-Frequency Trading Terminal',
    seoTitle: 'Quantitative Trading Terminal & Multi-Asset Execution Engine | MTXquant',
    metaDescription: 'Experience sub-millisecond order routing, Level 2 multi-asset order books, interactive technical charts, and volatility-adjusted ATR position sizing calculators.',
    heroHeadline: 'Sub-Millisecond Execution Engine & Advanced Quantitative Terminal',
    heroSubheadline: 'Engineered for high-frequency proprietary desks and systematic traders requiring direct market access, depth-of-market order books, and real-time ATR risk calculators.',
    icon: <LineChart className="w-5 h-5 text-amber-400" />,
    specs: [
      { label: 'Execution Latency', value: '< 1.2ms', desc: 'Direct DMA gateway co-located at Equinix NY4' },
      { label: 'Order Routing', value: 'Smart DMA / L2', desc: 'Multi-venue liquidity aggregation' },
      { label: 'Position Sizing', value: 'Dynamic ATR', desc: 'Volatility-adjusted position sizing calculator' },
      { label: 'Data Serialization', value: 'Protobuf / WSS', desc: 'Sub-500μs WebSocket L2/L3 order streams' }
    ],
    problemStatement: 'Retail trading interfaces introduce order execution slippage, opaque fill latency, and static lot sizing that ignores intraday volatility shifts. When market volatility surges, static position sizing causes catastrophic account drawdowns.',
    solutionNarrative: 'The MTXquant Markets Terminal solves this by embedding an ATR Volatility Calculator directly into the order ticket. Every trade is dynamically sized based on current market noise, automatically protecting your capital with real-time risk parameters before the order hits the matching engine.',
    architectureHighlights: [
      {
        title: 'Kernel-Bypass Matching',
        desc: 'Solarflare Onload technology bypasses OS network stack overhead to process incoming limit orders in under 1.2 milliseconds.',
        icon: <Zap className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'L2/L3 Aggregated Depth',
        desc: 'Aggregates bid/ask liquidity across 18 tier-1 prime brokers, delivering institutional tight spreads.',
        icon: <Layers className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'ATR-Driven Risk Gate',
        desc: 'Automatically enforces account volatility caps by calculating optimal contract size from Average True Range.',
        icon: <Cpu className="w-4 h-4 text-amber-400" />
      }
    ],
    workflowSteps: [
      { step: '01', title: 'Asset Sourcing & Charting', desc: 'Select multi-asset symbols (Equities, Forex, Crypto, Derivatives) with synchronized technical indicators.' },
      { step: '02', title: 'ATR Volatility Calculation', desc: 'Enter entry price and stop loss; the system evaluates intraday ATR to determine optimal position size.' },
      { step: '03', title: 'Smart Order Routing', desc: 'Orders pass pre-trade risk checks and are executed across co-located liquidity pools within 1.2ms.' }
    ],
    faqs: [
      { q: 'What order types are supported in the Markets View?', a: 'MTXquant supports Market, Limit, Stop-Market, Stop-Limit, Bracket Orders (TP/SL), Iceberg, and OCO (One-Cancels-the-Other) orders.' },
      { q: 'How does the ATR Position Sizing Calculator work?', a: 'The calculator reads the current 14-period Average True Range (ATR). Based on your maximum account risk percentage (e.g. 1%), it calculates the exact share or contract count needed so your stop loss matches your risk threshold.' },
      { q: 'Can I stream Level 2 market depth over WebSockets?', a: 'Yes. Our WebSocket API streams full L2 order book depth with sub-500 microsecond updates formatted in JSON or Protocol Buffers.' }
    ],
    keywords: ['Quantitative Trading Terminal', 'Multi-Asset Order Book', 'ATR Position Sizing Calculator', 'Level 2 Depth Stream', 'Sub-millisecond Execution']
  },
  portfolio: {
    id: 'portfolio',
    name: 'Portfolio Risk Desk & Compounding Engine',
    badge: 'Risk/Analytics',
    category: 'Institutional Risk Engine',
    seoTitle: 'Real-Time Portfolio Value-at-Risk (VaR) & Compounding Engine | MTXquant',
    metaDescription: 'Monitor real-time Value-at-Risk (VaR), Sharpe ratios, asset allocation weightings, leverage exposure safety gates, and multi-year wealth accumulation projections.',
    heroHeadline: 'Dynamic Value-at-Risk Monitoring & Wealth Compounding Engine',
    heroSubheadline: 'Real-time capital custody analytics that measure multi-asset portfolio heat, enforce portfolio margin rulesets, and model multi-year wealth compounding trajectories.',
    icon: <Briefcase className="w-5 h-5 text-amber-400" />,
    specs: [
      { label: 'Risk Ruleset', value: 'TIMS VaR Model', desc: 'Calculates non-linear portfolio risk' },
      { label: 'Leverage Check', value: 'Dynamic Safety Gate', desc: 'Prevents forced liquidation cascades' },
      { label: 'Projection Horizon', value: '1Y to 30Y NAV', desc: 'Compound interest & CAGR modeling' },
      { label: 'Rebalance Engine', value: 'Automated Drift', desc: 'Alerts when asset weight deviates > 2%' }
    ],
    problemStatement: 'Most portfolio trackers only show historical profit and loss, ignoring directional risk concentration, leverage exposure, and tail-risk volatility correlations. Traders unknowingly over-concentrate in correlated assets.',
    solutionNarrative: 'MTXquant provides continuous, real-time Value-at-Risk (VaR) calculations and asset weight breakdowns. The system continuously stress-tests your net asset value (NAV) against market shocks, ensuring your portfolio remains resilient.',
    architectureHighlights: [
      {
        title: 'Non-Linear VaR Engine',
        desc: 'Evaluates delta, gamma, and vega risk vectors across multi-asset holdings to calculate exact 99% 1-day Value-at-Risk.',
        icon: <ShieldCheck className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Compound Growth Sandbox',
        desc: 'Simulates long-term net asset value growth under varying interest rate environments and annual yield projections.',
        icon: <TrendingUp className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Leverage Safeguard Valve',
        desc: 'Real-time safety guard that restricts new order entry if total margin utilization exceeds user-defined limits.',
        icon: <Lock className="w-4 h-4 text-amber-400" />
      }
    ],
    workflowSteps: [
      { step: '01', title: 'Asset Aggregation', desc: 'Consolidate equities, fixed income, crypto, and cash into a single cross-margin collateral pool.' },
      { step: '02', title: 'VaR Stress Testing', desc: 'The system runs 10,000 Monte Carlo scenarios to compute your maximum expected daily draw-down.' },
      { step: '03', title: 'Compounding Projection', desc: 'Adjust allocation sliders to project multi-year NAV growth and evaluate rebalancing strategies.' }
    ],
    faqs: [
      { q: 'How is Portfolio Value-at-Risk (VaR) calculated?', a: 'MTXquant uses historical simulation and parametric covariance matrices based on 252 days of tick data, evaluating multi-asset correlations to measure potential loss at a 99% confidence interval.' },
      { q: 'What happens if my portfolio exceeds my VaR risk limit?', a: 'The VaR Guard displays visual risk alerts and can automatically prevent new leverage-increasing orders from executing until collateral is rebalanced.' },
      { q: 'Can I project multi-year compound interest on my capital?', a: 'Yes. The built-in Compound Wealth Simulator projects NAV growth over 1 to 30 years based on customizable expected yield and monthly deposit inputs.' }
    ],
    keywords: ['Portfolio Risk Analytics', 'Value at Risk Calculator', 'Compound Interest Simulator', 'Portfolio Margin', 'Asset Weight Distribution']
  },
  watchlist: {
    id: 'watchlist',
    name: 'Dynamic Watchlist & Volatility Screener',
    badge: 'Execution Filters',
    category: 'Market Intelligence Radar',
    seoTitle: 'Dynamic Stock Watchlist & Market Volatility Screener | MTXquant',
    metaDescription: 'Filter high-frequency symbol data, monitor multi-asset index tickers, calculate saliency scores, and jump instantly into active trading charts.',
    heroHeadline: 'High-Frequency Market Watchlist & Saliency Radar',
    heroSubheadline: 'Scan thousands of instruments in real-time with automated saliency scoring, continuous volatility monitoring, and instantaneous symbol switching.',
    icon: <List className="w-5 h-5 text-amber-400" />,
    specs: [
      { label: 'Saliency Matrix', value: 'Real-Time Score', desc: 'Ranks assets by volume and volatility spikes' },
      { label: 'Filter Velocity', value: '< 5ms Render', desc: 'Instant search across 2,500+ symbols' },
      { label: 'Data Stream', value: 'Live Ticker Feed', desc: 'Synchronized price updates' },
      { label: 'Sector Spread', value: '11 Global Sectors', desc: 'Tech, Finance, Energy, Crypto, Forex' }
    ],
    problemStatement: 'Traders waste crucial seconds toggling between disparate charting sites, missing high-momentum breakouts and order flow imbalances due to fragmented watchlists.',
    solutionNarrative: 'Our Watchlist Screener aggregates live pricing, 24-hour volume velocity, and proprietary saliency scores into a unified filter. Spot market anomalies instantly and switch chart views in one click.',
    architectureHighlights: [
      {
        title: 'Saliency Scoring Engine',
        desc: 'Calculates dynamic saliency vectors combining relative volume (RVOL), ATR expansion, and order imbalance.',
        icon: <Sparkles className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Sub-5ms Filtering',
        desc: 'Client-side memory index allows sub-5ms filtering across thousands of global equities, ETFs, and crypto tokens.',
        icon: <Filter className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Direct Terminal Binding',
        desc: 'Clicking any symbol instantly synchronizes the entire terminal, updating charts, order depth, and option chains.',
        icon: <ExternalLink className="w-4 h-4 text-amber-400" />
      }
    ],
    workflowSteps: [
      { step: '01', title: 'Set Filter Parameters', desc: 'Filter symbols by market cap, sector, 24h price change, or volume surge velocity.' },
      { step: '02', title: 'Analyze Saliency Rank', desc: 'Review high-saliency assets flagged by our volatility algorithms.' },
      { step: '03', title: 'Instant Chart Launch', desc: 'Click any row to open the high-performance execution terminal pre-loaded with that asset.' }
    ],
    faqs: [
      { q: 'What is a Saliency Score in the Watchlist?', a: 'Saliency score measures an asset relative market activity by combining relative volume (RVOL), percentage price shift, and order book imbalance into a 0-100 score.' },
      { q: 'Can I create custom watchlists and save them?', a: 'Yes. Custom watchlists persist across browser sessions and sync automatically with your cloud user profile.' }
    ],
    keywords: ['Stock Watchlist Screener', 'Market Volatility Radar', 'Relative Volume Filter', 'Real-time Ticker Feed']
  },
  funding: {
    id: 'funding',
    name: 'Institutional Wallet & Custody Desk',
    badge: 'Capital Custody',
    category: 'Segregated Treasury Infrastructure',
    seoTitle: 'Institutional Wallet Desk & Capital Custody Infrastructure | MTXquant',
    metaDescription: 'Manage segregated client capital, direct ledger settlements, instant bank wire transfers, credit line applications, and FDIC cash sweep allocations.',
    heroHeadline: 'Direct Capital Custody & Treasury Management Gateway',
    heroSubheadline: 'Bank-grade custody infrastructure providing segregated ledger settlements, institutional cash sweep networks, and instant wire funding.',
    icon: <DollarSign className="w-5 h-5 text-amber-400" />,
    specs: [
      { label: 'Custody Structure', value: 'Segregated Trust', desc: 'Bankruptcy-remote Tier-1 banking partners' },
      { label: 'FDIC Sweep Limit', value: 'Up to $5,000,000', desc: 'Programmatic multi-bank cash distribution' },
      { label: 'Settlement Time', value: 'Instant / T+0', desc: 'Real-time internal clearing ledgers' },
      { label: 'Wire Gateways', value: 'Fedwire / SWIFT', desc: 'Direct corporate treasury connectivity' }
    ],
    problemStatement: 'Traditional brokerage funding involves multi-day hold times, uncompensated idle cash, and opaque pooled accounts where client funds lack bankruptcy isolation.',
    solutionNarrative: 'MTXquant offers segregated custody architecture. Unallocated capital is automatically swept into FDIC-insured partner bank accounts earning optimized yields, while remaining instantly available for trading collateral.',
    architectureHighlights: [
      {
        title: 'FDIC Multi-Bank Sweep',
        desc: 'Distributes cash balances across Tier-1 bank networks to expand FDIC insurance up to $5M per account.',
        icon: <ShieldCheck className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Segregated Ledger Audit',
        desc: 'Cryptographically timestamped balance logs ensure full bankruptcy-remote isolation.',
        icon: <Database className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Instant Credit Line Engine',
        desc: 'Programmatically approves collateral-backed credit lines against eligible equity and Treasury holdings.',
        icon: <DollarSign className="w-4 h-4 text-amber-400" />
      }
    ],
    workflowSteps: [
      { step: '01', title: 'Initiate Wire Deposit', desc: 'Connect bank account via Plaid or wire instructions to initiate instant ledger credit.' },
      { step: '02', title: 'Automated Cash Sweep', desc: 'Unallocated idle cash sweeps automatically into high-yield FDIC partner accounts.' },
      { step: '03', title: 'Collateral Credit Line', desc: 'Unlock instant borrowing power against your portfolio holdings without selling assets.' }
    ],
    faqs: [
      { q: 'How are my cash balances protected?', a: 'Unallocated cash is held in segregated trust accounts at Tier-1 institutions like BNY Mellon and swept across partner banks for up to $5 million in FDIC coverage.' },
      { q: 'What is the processing time for withdrawals?', a: 'Internal wallet transfers are instant. Fedwire and ACH withdrawals are processed on standard banking rails with same-day or T+1 settlement.' }
    ],
    keywords: ['Institutional Wallet Desk', 'FDIC Cash Sweep', 'Segregated Custody', 'Bank Wire Gateway', 'Treasury Management']
  },
  activity: {
    id: 'activity',
    name: 'Transaction Audit Logs & Quantitative Ledgers',
    badge: 'Certified Audits',
    category: 'Regulatory Compliance Engine',
    seoTitle: 'Compliant Transaction Audit Logs & Quantitative Trade Ledgers | MTXquant',
    metaDescription: 'Inspect time-stamped execution receipts, audit clearing fees, verify cryptographic execution hashes, and download certified PDF/CSV reports.',
    heroHeadline: 'Cryptographic Audit Trail & Certified Execution Ledgers',
    heroSubheadline: 'Regulatory-compliant reporting infrastructure generating millisecond time-stamped transaction receipts, fee diagnostics, and exportable audit matrices.',
    icon: <Activity className="w-5 h-5 text-amber-400" />,
    specs: [
      { label: 'Time-Stamp Accuracy', value: 'PTP Microseconds', desc: 'Precision Time Protocol timestamping' },
      { label: 'Audit Standard', value: 'SOC 2 Type II', desc: 'Verified security and availability controls' },
      { label: 'Export Formats', value: 'PDF / CSV / JSON', desc: 'Compatible with tax software and quantitative pipelines' },
      { label: 'Receipt Hashing', value: 'SHA-256 Verified', desc: 'Immutable transaction proof' }
    ],
    problemStatement: 'Most trading platforms provide vague account statements that hide execution fees, route rebates, and exact execution microsecond timestamps, making tax auditing and execution analysis painful.',
    solutionNarrative: 'Our Activity Desk logs every order lifecycle event—from client submit to broker ack and exchange fill. Download cryptographically verified execution receipts with complete clearing fee transparency.',
    architectureHighlights: [
      {
        title: 'SHA-256 Receipt Verification',
        desc: 'Generates immutable cryptographic hashes for every filled trade ticket, proving exact fill price and timestamp.',
        icon: <CheckCircle2 className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Tax & Compliance Exporter',
        desc: 'One-click export of Form 8949 gain/loss matrices, Form 1099 equivalents, and raw CSV ledger data.',
        icon: <Download className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Fee Transparency Diagnostics',
        desc: 'Breaks down regulatory fees (SEC, FINRA, OCC), exchange maker/taker rebates, and clearing costs.',
        icon: <BarChart2 className="w-4 h-4 text-amber-400" />
      }
    ],
    workflowSteps: [
      { step: '01', title: 'Filter Execution Logs', desc: 'Query transactions by date range, asset class, order ID, or execution status.' },
      { step: '02', title: 'Inspect Fill Microseconds', desc: 'Review exact time-stamped fill details, venue routing notes, and fee breakdowns.' },
      { step: '03', title: 'Export Certified Reports', desc: 'Download PDF tax reports or raw JSON audit payloads for internal reporting.' }
    ],
    faqs: [
      { q: 'Are trade confirmation receipts legally binding?', a: 'Yes. Official trade confirmation receipts generated by MTXquant meet FINRA Rule 2232 standards.' },
      { q: 'How long are historical transaction records stored?', a: 'All execution logs and account ledgers are stored indefinitely in secure, read-only cloud archives.' }
    ],
    keywords: ['Transaction Audit Logs', 'Execution Receipts', 'Tax Loss Export', 'SOC2 Compliance', 'Clearing Fee Transparency']
  },
  analysis: {
    id: 'analysis',
    name: 'Market Analysis & Correlation Intelligence',
    badge: 'Intelligence',
    category: 'Quantitative Market Analytics',
    seoTitle: 'Mathematical Asset Correlation & Intelligence Center | MTXquant',
    metaDescription: 'Explore Pearson asset correlation heatmaps, macro trend indices, benchmark models, and statistical correlation matrices for systematic strategies.',
    heroHeadline: 'Mathematical Correlation Matrix & Cross-Asset Intelligence',
    heroSubheadline: 'Uncover hidden systemic risk correlations, sector rotation trends, and statistical arbitrage opportunities with live Pearson correlation heatmaps.',
    icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
    specs: [
      { label: 'Correlation Method', value: 'Pearson / Spearman', desc: 'Evaluates linear & rank-order correlations' },
      { label: 'Lookback Windows', value: '1D, 7D, 30D, 1Y', desc: 'Dynamic correlation lookback adjustment' },
      { label: 'Benchmark Index', value: 'S&P 500 / Nasdaq', desc: 'Alpha & Beta benchmark calculations' },
      { label: 'Matrix Depth', value: 'Up to 50x50 Assets', desc: 'Real-time multi-asset matrix calculation' }
    ],
    problemStatement: 'Traders often buy multiple assets believing they are diversified, only to suffer massive losses when market panics cause correlations to spike to 1.0 across asset classes.',
    solutionNarrative: 'The Market Analysis Center dynamically computes Pearson correlation coefficients between equities, bonds, crypto, and commodities. Identify inverse hedges and remove redundant positions before market stress hits.',
    architectureHighlights: [
      {
        title: 'Pearson Heatmap Engine',
        desc: 'Computes real-time pairwise covariance matrices across 50+ tickers to highlight hidden systemic dependencies.',
        icon: <Grid2X2Icon className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Sector Rotation Tracker',
        desc: 'Tracks relative strength and money flow momentum across all 11 GICS market sectors.',
        icon: <TrendingUp className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Macro Benchmark Model',
        desc: 'Calculates portfolio Beta, Jensen Alpha, and Treynor Ratio relative to S&P 500 and Treasury yields.',
        icon: <BarChart2 className="w-4 h-4 text-amber-400" />
      }
    ],
    workflowSteps: [
      { step: '01', title: 'Select Asset Universe', desc: 'Choose your portfolio holdings or selected watchlist tickers.' },
      { step: '02', title: 'Analyze Pairwise Correlation', desc: 'Inspect the heat matrix for red zones (+0.80 to +1.0) indicating dangerous position overlap.' },
      { step: '03', title: 'Optimize Hedging Strategy', desc: 'Identify negative correlation assets (-0.50 to -1.0) to construct delta-neutral hedges.' }
    ],
    faqs: [
      { q: 'How often is the correlation matrix updated?', a: 'Correlation heatmaps re-calculate dynamically every 10 seconds using real-time price tick feeds.' },
      { q: 'How do I interpret Pearson correlation values?', a: '+1.0 indicates perfect positive correlation, 0.0 indicates no correlation, and -1.0 indicates perfect inverse correlation.' }
    ],
    keywords: ['Asset Correlation Heatmap', 'Pearson Correlation Matrix', 'Quantitative Market Intelligence', 'Sector Rotation Model']
  },
  backtest: {
    id: 'backtest',
    name: 'Algorithmic Strategy Backtest Simulator',
    badge: 'Quant Sandbox',
    category: 'Quantitative Backtesting Engine',
    seoTitle: 'Algorithmic Backtest Simulator & Monte Carlo Risk Analytics | MTXquant',
    metaDescription: 'Run historical strategy backtests, simulate Monte Carlo drawdown distributions, account for realistic slippage, and compute Sharpe/Sortino ratios.',
    heroHeadline: 'Algorithmic Backtest Sandbox & Monte Carlo Simulator',
    heroSubheadline: 'Validate systematic trading algorithms against years of tick-by-tick historical market data with realistic slippage, commission modeling, and drawdown distributions.',
    icon: <BarChart2 className="w-5 h-5 text-amber-400" />,
    specs: [
      { label: 'Backtest Speed', value: '1M Ticks / sec', desc: 'C++ compiled backtesting pipeline' },
      { label: 'Data Resolution', value: '1-Minute & Tick', desc: 'Historical data spanning 10+ years' },
      { label: 'Slippage Model', value: 'Volume-Weighted', desc: 'Simulates realistic order book fill decay' },
      { label: 'Simulation Runs', value: '1,000 Scenarios', desc: 'Monte Carlo randomized path testing' }
    ],
    problemStatement: 'Most retail backtesters overfit data and ignore execution slippage, leading to strategies that look profitable on paper but fail miserably in live production.',
    solutionNarrative: 'Our Backtest Simulator integrates volume-weighted fill models, spread decay, and Monte Carlo randomized sequencing. Test your strategy under worst-case liquidity scenarios before risking live capital.',
    architectureHighlights: [
      {
        title: 'High-Fidelity Tick Engine',
        desc: 'Replays historical bid/ask order book state at microsecond resolution for precise fill accuracy.',
        icon: <Clock className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Monte Carlo Stress Tester',
        desc: 'Shuffles historical trade sequences to generate 1,000 probable equity curves and maximum draw-down bounds.',
        icon: <Sparkles className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Sharpe & Sortino Optimizer',
        desc: 'Computes risk-adjusted performance metrics, profit factor, max consecutive losses, and recovery factor.',
        icon: <TrendingUp className="w-4 h-4 text-amber-400" />
      }
    ],
    workflowSteps: [
      { step: '01', title: 'Define Strategy Parameters', desc: 'Set moving average lengths, ATR multiplier targets, or RSI thresholds.' },
      { step: '02', title: 'Run Backtest Execution', desc: 'Simulate performance over historical market regimes (bull, bear, high volatility).' },
      { step: '03', title: 'Review Monte Carlo Curves', desc: 'Evaluate drawdown probabilities and deploy verified code directly to live execution.' }
    ],
    faqs: [
      { q: 'How does the backtester model slippage?', a: 'Slippage is modeled dynamically using order size relative to historical top-of-book depth at that exact timestamp.' },
      { q: 'Can I export backtested trading strategies to the live terminal?', a: 'Yes. Once a strategy passes backtest thresholds, you can deploy it directly into the live Markets Terminal with one click.' }
    ],
    keywords: ['Algorithmic Backtester', 'Monte Carlo Trading Simulation', 'Sharpe Ratio Optimizer', 'Historical Tick Data']
  },
  sentiment: {
    id: 'sentiment',
    name: 'Institutional Sentiment & Flow Intelligence',
    badge: 'Flow Radar',
    category: 'Institutional Order Analytics',
    seoTitle: 'Institutional Sentiment Radar & Dark Pool Flow Intelligence | MTXquant',
    metaDescription: 'Track dark pool sweep transactions, institutional order flow divergence, options gamma exposure, and smart money positioning alerts.',
    heroHeadline: 'Institutional Order Flow Radar & Dark Pool Intelligence',
    heroSubheadline: 'Uncover hidden institutional accumulation, dark pool sweeps, option delta surges, and smart-money-vs-retail sentiment divergences in real-time.',
    icon: <Radio className="w-5 h-5 text-amber-400" />,
    specs: [
      { label: 'Order Scanning', value: 'Dark Pool & Lit', desc: 'Tracks off-exchange block trades' },
      { label: 'Flow Detection', value: 'Option Sweeps', desc: 'Flags unusual aggressive call/put buying' },
      { label: 'Divergence Alert', value: 'Smart vs Retail', desc: 'Triggers when smart money opposes retail sentiment' },
      { label: 'Update Cadence', value: 'Real-Time Event', desc: 'Instant alerts on institutional sweeps' }
    ],
    problemStatement: 'Institutional block orders and dark pool sweeps account for over 40% of daily stock volume, yet retail traders remain blind to these market-moving transactions.',
    solutionNarrative: 'Our Institutional Sentiment Radar monitors off-exchange block prints and aggressive option sweeps, surfacing smart money positioning before price movements materialize in public exchanges.',
    architectureHighlights: [
      {
        title: 'Dark Pool Block Scanner',
        desc: 'Identifies institutional prints on dark venues and aggregates volume clusters at critical support/resistance levels.',
        icon: <Radio className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Options Gamma Surge Detector',
        desc: 'Scans options exchanges for multi-leg sweeps that trigger dealer gamma hedging flows.',
        icon: <Zap className="w-4 h-4 text-amber-400" />
      },
      {
        title: 'Sentiment Divergence Radar',
        desc: 'Highlights key moments when institutional buying pressure accelerates while retail sentiment remains bearish.',
        icon: <BarChart2 className="w-4 h-4 text-amber-400" />
      }
    ],
    workflowSteps: [
      { step: '01', title: 'Monitor Flow Feed', desc: 'Scan incoming dark pool prints and high-dollar options sweeps.' },
      { step: '02', title: 'Identify Institutional Clusters', desc: 'Locate price levels where heavy institutional buying or selling has concentrated.' },
      { step: '03', title: 'Align Execution', desc: 'Place directional trades alongside institutional momentum in the Markets Terminal.' }
    ],
    faqs: [
      { q: 'What is an options sweep order?', a: 'A sweep order splits a large options trade across multiple exchanges simultaneously to stealthily accumulate positions before market pricing adjusts.' },
      { q: 'How does the radar detect dark pool volume?', a: 'The radar filters FINRA Trade Reporting Facility (TRF) feeds to identify off-exchange prints that exceed standard size thresholds.' }
    ],
    keywords: ['Institutional Order Flow', 'Dark Pool Scanner', 'Unusual Options Activity', 'Smart Money Flow', 'Gamma Exposure']
  }
};

function Grid2X2Icon(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  );
}

// Interactive Feature Widget Renderer
function InteractiveFeatureWidget({ featureId }: { featureId: FeatureId }) {
  // Markets Widget state
  const [ticker, setTicker] = useState('NVDA');
  const [accountEquity, setAccountEquity] = useState(100000);
  const [riskPct, setRiskPct] = useState(1.0);
  const [entryPrice, setEntryPrice] = useState(210.00);
  const [stopLoss, setStopLoss] = useState(205.00);
  const [atrValue, setAtrValue] = useState(4.20);

  // Portfolio Widget state
  const [navAmount, setNavAmount] = useState(250000);
  const [growthYears, setGrowthYears] = useState(10);
  const [expectedReturnPct, setExpectedReturnPct] = useState(12.5);
  const [varLimitPct, setVarLimitPct] = useState(1.5);

  // Watchlist Widget state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'TECH' | 'FINANCE' | 'CRYPTO'>('ALL');

  // Activity Widget state
  const [selectedReceipt, setSelectedReceipt] = useState<string>('REC-884920');

  // Analysis Widget state
  const [correlationTimeframe, setCorrelationTimeframe] = useState<'1D' | '30D' | '1Y'>('30D');

  // Calculations for Markets ATR Sizing
  const maxRiskDollar = (accountEquity * riskPct) / 100;
  const riskPerShare = Math.max(0.01, Math.abs(entryPrice - stopLoss));
  const calculatedShares = Math.floor(maxRiskDollar / riskPerShare);
  const totalPositionNotional = calculatedShares * entryPrice;
  const atrMultiplier = (riskPerShare / atrValue).toFixed(2);

  // Calculations for Portfolio Compound Growth
  const compoundedNAV = Math.round(navAmount * Math.pow(1 + expectedReturnPct / 100, growthYears));
  const totalGain = compoundedNAV - navAmount;

  return (
    <div className="bg-[#050508] border border-neutral-800 rounded-xl p-5 sm:p-6 space-y-6 text-neutral-200 font-mono shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Interactive Feature Sandbox
          </span>
        </div>
        <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded font-bold uppercase">
          Live Reactive Model
        </span>
      </div>

      {/* MARKETS WIDGET */}
      {featureId === 'markets' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4 bg-neutral-950/60 p-4 rounded-lg border border-neutral-900">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                ATR Risk & Position Sizing Controls
              </span>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase block mb-1">Target Asset Symbol</label>
                  <div className="flex space-x-2">
                    {['NVDA', 'AAPL', 'TSLA', 'BTCUSD'].map(sym => (
                      <button
                        key={sym}
                        onClick={() => {
                          setTicker(sym);
                          if (sym === 'NVDA') { setEntryPrice(210); setStopLoss(205); setAtrValue(4.2); }
                          if (sym === 'AAPL') { setEntryPrice(330); setStopLoss(322); setAtrValue(5.1); }
                          if (sym === 'TSLA') { setEntryPrice(310); setStopLoss(298); setAtrValue(8.4); }
                          if (sym === 'BTCUSD') { setEntryPrice(64000); setStopLoss(62500); setAtrValue(1800); }
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                          ticker === sym ? 'bg-amber-500 text-black' : 'bg-neutral-900 text-neutral-300 hover:text-white'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-400">Account Equity NAV:</span>
                    <span className="text-white font-bold">${accountEquity.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" min="10000" max="1000000" step="10000"
                    value={accountEquity}
                    onChange={e => setAccountEquity(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-neutral-900 rounded"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-400">Max Account Risk (%):</span>
                    <span className="text-amber-400 font-bold">{riskPct.toFixed(1)}% (${maxRiskDollar.toLocaleString()})</span>
                  </div>
                  <input 
                    type="range" min="0.25" max="3.0" step="0.25"
                    value={riskPct}
                    onChange={e => setRiskPct(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-neutral-900 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <label className="text-neutral-400 block">Entry Price ($)</label>
                    <input 
                      type="number" value={entryPrice} 
                      onChange={e => setEntryPrice(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block">Stop Loss ($)</label>
                    <input 
                      type="number" value={stopLoss} 
                      onChange={e => setStopLoss(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-rose-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations Result Matrix */}
            <div className="bg-neutral-950/80 p-4 rounded-lg border border-amber-500/20 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">
                  Calculated Order Routing Ticket
                </span>

                <div className="space-y-2 border-b border-neutral-900 pb-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400">Recommended Size:</span>
                    <span className="text-xl font-bold text-white font-mono">{calculatedShares.toLocaleString()} Units</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400">Notional Order Value:</span>
                    <span className="text-sm font-bold text-amber-400">${totalPositionNotional.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400">Risk per Unit:</span>
                    <span className="text-rose-400 font-bold">${riskPerShare.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400">ATR Stop Multiplier:</span>
                    <span className="text-white font-bold">{atrMultiplier}x 14D ATR</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 text-[10px] text-emerald-300">
                <span className="font-bold block mb-0.5">✓ Volatility Safety Gate Passed</span>
                Position size dynamically constrained to limit max drawdown to ${maxRiskDollar.toLocaleString()} if stop loss triggers.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PORTFOLIO WIDGET */}
      {featureId === 'portfolio' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4 bg-neutral-950/60 p-4 rounded-lg border border-neutral-900">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                Compound Wealth & VaR Simulator
              </span>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-400">Starting Portfolio NAV:</span>
                    <span className="text-white font-bold">${navAmount.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" min="25000" max="2000000" step="25000"
                    value={navAmount}
                    onChange={e => setNavAmount(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-neutral-900 rounded"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-400">Projection Time Horizon:</span>
                    <span className="text-amber-400 font-bold">{growthYears} Years</span>
                  </div>
                  <div className="flex space-x-2 mt-1">
                    {[3, 5, 10, 20].map(y => (
                      <button
                        key={y}
                        onClick={() => setGrowthYears(y)}
                        className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer ${
                          growthYears === y ? 'bg-amber-500 text-black' : 'bg-neutral-900 text-neutral-300'
                        }`}
                      >
                        {y} Years
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-400">Expected Annual Return (CAGR):</span>
                    <span className="text-emerald-400 font-bold">{expectedReturnPct.toFixed(1)}%</span>
                  </div>
                  <input 
                    type="range" min="4" max="25" step="0.5"
                    value={expectedReturnPct}
                    onChange={e => setExpectedReturnPct(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-neutral-900 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Projection Outcome */}
            <div className="bg-neutral-950/80 p-4 rounded-lg border border-amber-500/20 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                  Projected Capital Trajectory
                </span>

                <div className="space-y-2 border-b border-neutral-900 pb-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400">Projected Future NAV:</span>
                    <span className="text-2xl font-bold text-white">${compoundedNAV.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400">Total Profit Generated:</span>
                    <span className="text-emerald-400 font-bold">+${totalGain.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400">1-Day VaR (99% Confidence):</span>
                    <span className="text-rose-400 font-bold">${Math.round(navAmount * 0.015).toLocaleString()} (1.50%)</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-neutral-400 leading-relaxed font-sans font-light">
                *Projections incorporate automated rebalancing across multi-asset collateral buckets with continuous Value-at-Risk monitoring.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WATCHLIST WIDGET */}
      {featureId === 'watchlist' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/60 p-3 rounded-lg border border-neutral-900">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search symbol (e.g. NVDA, AAPL, BTC)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 font-mono"
              />
            </div>
            <div className="flex space-x-1">
              {(['ALL', 'TECH', 'FINANCE', 'CRYPTO'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded cursor-pointer ${
                    selectedCategory === cat ? 'bg-amber-500 text-black' : 'bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Screener Table Preview */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 text-[10px] uppercase">
                  <th className="py-2 px-3">Symbol</th>
                  <th className="py-2 px-3">Price</th>
                  <th className="py-2 px-3">24h Change</th>
                  <th className="py-2 px-3">Saliency Score</th>
                  <th className="py-2 px-3">Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/60">
                {[
                  { sym: 'NVDA', name: 'NVIDIA Corp', price: 206.84, change: '-0.62%', saliency: 98, signal: 'High Volatility' },
                  { sym: 'AAPL', name: 'Apple Inc', price: 333.02, change: '+2.57%', saliency: 92, signal: 'Bullish Volume' },
                  { sym: 'TSLA', name: 'Tesla Inc', price: 313.03, change: '-2.81%', saliency: 89, signal: 'Support Test' },
                  { sym: 'BTCUSD', name: 'Bitcoin / USD', price: 64351.33, change: '+0.39%', saliency: 96, signal: '24/7 Live' }
                ]
                .filter(row => row.sym.toLowerCase().includes(searchQuery.toLowerCase()) || row.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(row => (
                  <tr key={row.sym} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-2 px-3 font-bold text-white">{row.sym} <span className="text-[9px] text-neutral-500 font-normal">{row.name}</span></td>
                    <td className="py-2 px-3 text-neutral-200">${row.price.toLocaleString()}</td>
                    <td className={`py-2 px-3 font-bold ${row.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{row.change}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full" style={{ width: `${row.saliency}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-amber-400">{row.saliency}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[10px] text-neutral-400 uppercase">{row.signal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FUNDING WIDGET */}
      {featureId === 'funding' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-900 space-y-2">
              <span className="text-[9px] text-neutral-400 uppercase font-bold block">Segregated Cash Pool</span>
              <div className="text-xl font-bold text-white">$185,420.00</div>
              <span className="text-[10px] text-emerald-400 block">✓ FDIC Insured Sweep</span>
            </div>
            <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-900 space-y-2">
              <span className="text-[9px] text-neutral-400 uppercase font-bold block">Available Collateral</span>
              <div className="text-xl font-bold text-amber-400">$620,000.00</div>
              <span className="text-[10px] text-neutral-400 block">3.5x Portfolio Margin</span>
            </div>
            <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-900 space-y-2">
              <span className="text-[9px] text-neutral-400 uppercase font-bold block">Instant Wire Gateway</span>
              <div className="text-xl font-bold text-emerald-400">Active (Fedwire)</div>
              <span className="text-[10px] text-neutral-400 block">T+0 Real-Time Ledger</span>
            </div>
          </div>

          <div className="bg-neutral-950/80 p-4 rounded-lg border border-neutral-900 space-y-3">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
              Multi-Bank Sweep Distribution Protocol
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 bg-neutral-900 rounded border border-neutral-850">
                <span className="text-neutral-500 block">BNY Mellon</span>
                <span className="text-white font-bold">$1,250,000</span>
              </div>
              <div className="p-2 bg-neutral-900 rounded border border-neutral-850">
                <span className="text-neutral-500 block">JP Morgan Chase</span>
                <span className="text-white font-bold">$1,250,000</span>
              </div>
              <div className="p-2 bg-neutral-900 rounded border border-neutral-850">
                <span className="text-neutral-500 block">Citigroup</span>
                <span className="text-white font-bold">$1,250,000</span>
              </div>
              <div className="p-2 bg-neutral-900 rounded border border-neutral-850">
                <span className="text-neutral-500 block">Goldman Sachs</span>
                <span className="text-white font-bold">$1,250,000</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY WIDGET */}
      {featureId === 'activity' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs border-b border-neutral-900 pb-2">
            <span className="text-amber-400 font-bold uppercase">Cryptographic Receipt Verifier</span>
            <span className="text-neutral-500 text-[10px]">SOC2 Type II Standard</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] text-neutral-400 uppercase block">Recent Execution Logs</span>
              {[
                { id: 'REC-884920', time: '14:22:01.004 EST', symbol: 'NVDA', type: 'BUY 500 LIMIT', price: '$206.84', status: 'FILLED' },
                { id: 'REC-884918', time: '11:15:42.892 EST', symbol: 'AAPL', type: 'SELL 250 STOP', price: '$333.00', status: 'FILLED' },
                { id: 'REC-884912', time: '09:30:12.115 EST', symbol: 'TSLA', type: 'BUY 100 MKT', price: '$313.03', status: 'FILLED' }
              ].map(rec => (
                <div 
                  key={rec.id}
                  onClick={() => setSelectedReceipt(rec.id)}
                  className={`p-2.5 rounded border cursor-pointer text-xs flex justify-between items-center transition-all ${
                    selectedReceipt === rec.id ? 'bg-amber-500/10 border-amber-500/40 text-white' : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-white">{rec.symbol} · {rec.type}</span>
                    <span className="text-[9px] text-neutral-500">{rec.id} · {rec.time}</span>
                  </div>
                  <span className="font-bold text-emerald-400 text-[10px]">{rec.status}</span>
                </div>
              ))}
            </div>

            <div className="bg-neutral-950 p-3.5 rounded border border-neutral-900 space-y-3">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">Verified Execution Details ({selectedReceipt})</span>
              <div className="space-y-1.5 text-[10px] font-mono text-neutral-300">
                <div className="flex justify-between"><span className="text-neutral-500">Matching Venue:</span><span>Equinix NY4 DMA</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Fill Latency:</span><span>842 microseconds</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Clearing Fee:</span><span>$0.0012 / share</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">SHA-256 Hash:</span><span className="truncate text-amber-400 font-bold w-32">e3b0c44298fc1c149...</span></div>
              </div>

              <button className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[10px] uppercase tracking-wider rounded border border-neutral-800 flex items-center justify-center gap-1">
                <Download className="w-3 h-3" /> Export Official Tax PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANALYSIS WIDGET */}
      {featureId === 'analysis' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-amber-400 font-bold uppercase">Pearson Pairwise Correlation Heatmap</span>
            <div className="flex space-x-1">
              {(['1D', '30D', '1Y'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setCorrelationTimeframe(tf)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                    correlationTimeframe === tf ? 'bg-amber-500 text-black' : 'bg-neutral-900 text-neutral-400'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
            <div className="p-2 font-bold text-neutral-500"></div>
            {['NVDA', 'AAPL', 'TSLA', 'BTC'].map(sym => (
              <div key={sym} className="p-2 font-bold text-white bg-neutral-950 rounded">{sym}</div>
            ))}

            {[
              { row: 'NVDA', values: [1.00, 0.72, 0.64, 0.45] },
              { row: 'AAPL', values: [0.72, 1.00, 0.58, 0.31] },
              { row: 'TSLA', values: [0.64, 0.58, 1.00, 0.52] },
              { row: 'BTC',  values: [0.45, 0.31, 0.52, 1.00] }
            ].map((r, rIdx) => (
              <React.Fragment key={rIdx}>
                <div className="p-2 font-bold text-white bg-neutral-950 rounded flex items-center justify-center">{r.row}</div>
                {r.values.map((val, cIdx) => (
                  <div 
                    key={cIdx} 
                    className={`p-2 rounded font-bold flex items-center justify-center ${
                      val === 1.00 ? 'bg-neutral-900 text-neutral-500' :
                      val > 0.65 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      val > 0.40 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {val.toFixed(2)}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* BACKTEST WIDGET */}
      {featureId === 'backtest' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-amber-400 font-bold uppercase">Monte Carlo Strategy Backtest Sandbox</span>
            <span className="text-emerald-400 font-bold text-[10px]">✓ 1,000 Iterations Computed</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-neutral-950 rounded border border-neutral-900">
              <span className="text-[9px] text-neutral-500 block uppercase font-bold">Sharpe Ratio</span>
              <span className="text-lg font-bold text-emerald-400">2.42</span>
            </div>
            <div className="p-3 bg-neutral-950 rounded border border-neutral-900">
              <span className="text-[9px] text-neutral-500 block uppercase font-bold">Win Rate</span>
              <span className="text-lg font-bold text-white">68.4%</span>
            </div>
            <div className="p-3 bg-neutral-950 rounded border border-neutral-900">
              <span className="text-[9px] text-neutral-500 block uppercase font-bold">Max Drawdown</span>
              <span className="text-lg font-bold text-rose-400">-4.20%</span>
            </div>
            <div className="p-3 bg-neutral-950 rounded border border-neutral-900">
              <span className="text-[9px] text-neutral-500 block uppercase font-bold">Profit Factor</span>
              <span className="text-lg font-bold text-amber-400">3.15</span>
            </div>
          </div>
        </div>
      )}

      {/* SENTIMENT WIDGET */}
      {featureId === 'sentiment' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-amber-400 font-bold uppercase">Dark Pool Sweep & Institutional Flow Stream</span>
            <span className="text-xs font-bold text-white bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded">
              BULLISH SWEEP DETECTED
            </span>
          </div>

          <div className="space-y-2">
            {[
              { symbol: 'NVDA', type: 'DARK POOL PRINT', detail: '$4.2M Block @ $206.80', venue: 'FINRA TRF', badge: 'INSTITUTIONAL BUY' },
              { symbol: 'AAPL', type: 'OPTION SWEEP', detail: '2,500 Calls $340 Exp Sep', venue: 'CBOE / PHLX', badge: 'BULLISH SWEEP' },
              { symbol: 'TSLA', type: 'GAMMA ACCELERATION', detail: 'Delta Expansion Threshold Passed', venue: 'AMEX', badge: 'GAMMA SURGE' }
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-neutral-950 border border-neutral-900 rounded flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white block">{item.symbol} · {item.type}</span>
                  <span className="text-[9px] text-neutral-500">{item.detail} · {item.venue}</span>
                </div>
                <span className="text-amber-400 font-bold text-[9px] uppercase tracking-wider">
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeatureLandingPage({
  featureId,
  onClose,
  onLaunchTerminal,
  onNavigateToFeature
}: FeatureLandingPageProps) {
  const spec = FEATURE_SPECS[featureId] || FEATURE_SPECS.markets;
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamically update page title, meta tags, and inject JSON-LD schema using useSeoMetadata hook
  const seoKey = (featureId ? featureId.toUpperCase() : 'MARKETS') as WorkspaceSeoKey;
  useSeoMetadata(seoKey);

  // Always scroll feature page to top whenever featureId changes or page opens
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [featureId]);

  // Prevent double scrollbars by locking background body scroll while modal page is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-[#000000] text-neutral-200 overflow-y-auto selection:bg-neutral-800 selection:text-white font-sans">
      
      {/* Background Swiss Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none z-0 opacity-40" />

      {/* Header Sticky Navigation (Homepage Header) */}
      <header className="sticky top-0 z-50 bg-[#000000]/85 backdrop-blur-md border-b border-neutral-900/80 px-6 lg:px-12 py-4 flex flex-col justify-center relative z-10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <button 
              onClick={onClose}
              className="text-base font-black tracking-tight text-white block lowercase hover:opacity-80 transition-opacity cursor-pointer text-left"
            >
              mtxquant
            </button>
          </div>

          {/* Minimal Swiss Navigation */}
          <nav className="hidden lg:flex items-center space-x-8 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
            <a 
              href="#about" 
              onClick={(e) => {
                e.preventDefault();
                onClose();
                setTimeout(() => {
                  const el = document.getElementById('about');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Our Firm
            </a>
            <a 
              href="#services" 
              onClick={(e) => {
                e.preventDefault();
                onClose();
                setTimeout(() => {
                  const el = document.getElementById('services');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Brokerage Services
            </a>
            <a 
              href="#portal" 
              onClick={(e) => {
                e.preventDefault();
                onClose();
                setTimeout(() => {
                  const el = document.getElementById('portal');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Client Workspaces
            </a>
            <a 
              href="#onboarding" 
              onClick={(e) => {
                e.preventDefault();
                onClose();
                setTimeout(() => {
                  const el = document.getElementById('onboarding');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Onboarding
            </a>
          </nav>

          {/* Action Controls */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onLaunchTerminal('signin')}
              className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black rounded font-mono text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Sign In
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-200 hover:text-white transition-colors cursor-pointer rounded border border-neutral-850 bg-neutral-950/80"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="lg:hidden overflow-hidden mt-4 pt-4 border-t border-neutral-900"
            >
              <nav className="flex flex-col space-y-4 font-mono text-[11px] uppercase tracking-widest text-neutral-300 pb-4">
                <a 
                  href="#about" 
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    onClose();
                    setTimeout(() => {
                      const el = document.getElementById('about');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="hover:text-white transition-colors py-1.5 border-b border-neutral-950"
                >
                  Our Firm
                </a>
                <a 
                  href="#services" 
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    onClose();
                    setTimeout(() => {
                      const el = document.getElementById('services');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="hover:text-white transition-colors py-1.5 border-b border-neutral-950"
                >
                  Brokerage Services
                </a>
                <a 
                  href="#portal" 
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    onClose();
                    setTimeout(() => {
                      const el = document.getElementById('portal');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="hover:text-white transition-colors py-1.5 border-b border-neutral-950"
                >
                  Client Workspaces
                </a>
                <a 
                  href="#onboarding" 
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    onClose();
                    setTimeout(() => {
                      const el = document.getElementById('onboarding');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className="hover:text-white transition-colors py-1.5 border-b border-neutral-950"
                >
                  Onboarding
                </a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 py-12 space-y-16">
        
        {/* HERO SECTION */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-amber-400 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              {spec.icon} {spec.badge}
            </span>
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
              {spec.category}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-sans tracking-tight text-white leading-tight font-semibold">
            {spec.heroHeadline}
          </h1>

          <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed max-w-3xl">
            {spec.heroSubheadline}
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-900">
            {spec.specs.map((item, idx) => (
              <div key={idx} className="bg-neutral-950 border border-neutral-900 p-3 rounded-lg space-y-1">
                <span className="text-[9px] font-mono text-neutral-500 uppercase block font-bold">{item.label}</span>
                <span className="text-base font-mono font-bold text-white block">{item.value}</span>
                <span className="text-[9px] font-sans text-neutral-400 block">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* INTERACTIVE DEMO WIDGET */}
        <section className="space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-widest block">
              01 / Hands-On Exploration
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Interactive Feature Preview & Live Sandbox
            </h2>
          </div>

          <InteractiveFeatureWidget featureId={featureId} />
        </section>

        {/* PROBLEM & SOLUTION NARRATIVE */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-neutral-950/80 border border-neutral-900 p-6 sm:p-8 rounded-xl">
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-rose-400 uppercase font-bold tracking-widest block">
              The Legacy Limitation
            </span>
            <h3 className="text-lg font-bold text-white">Why Traditional Tools Fall Short</h3>
            <p className="text-xs text-neutral-300 leading-relaxed font-light">
              {spec.problemStatement}
            </p>
          </div>

          <div className="space-y-3 border-t md:border-t-0 md:border-l border-neutral-900 pt-6 md:pt-0 md:pl-8">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-widest block">
              The MTXquant Advantage
            </span>
            <h3 className="text-lg font-bold text-white">Engineered for Precision & Speed</h3>
            <p className="text-xs text-neutral-300 leading-relaxed font-light">
              {spec.solutionNarrative}
            </p>
          </div>
        </section>

        {/* ARCHITECTURE HIGHLIGHTS */}
        <section className="space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-widest block">
              02 / Architecture & Engineering
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Technical Specifications & System Design
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {spec.architectureHighlights.map((arch, idx) => (
              <div key={idx} className="bg-neutral-950 border border-neutral-900 p-5 rounded-lg space-y-3 hover:border-amber-500/30 transition-colors">
                <div className="p-2 bg-neutral-900 rounded w-fit border border-neutral-800">
                  {arch.icon}
                </div>
                <h3 className="text-sm font-bold text-white">{arch.title}</h3>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">{arch.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WORKFLOW STEPS ("How It Works") */}
        <section className="space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-widest block">
              03 / Step-by-step Execution
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              How It Works in Production
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {spec.workflowSteps.map((step, idx) => (
              <div key={idx} className="bg-neutral-950 border border-neutral-900 p-5 rounded-lg space-y-2 relative">
                <span className="text-2xl font-mono font-black text-amber-400/40 block">{step.step}</span>
                <h3 className="text-sm font-bold text-white">{step.title}</h3>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SEO FREQUENTLY ASKED QUESTIONS */}
        <section className="space-y-6 border-t border-neutral-900 pt-10">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-widest block">
              04 / Technical & Regulatory FAQ
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {spec.faqs.map((faq, idx) => (
              <div key={idx} className="bg-neutral-950 border border-neutral-900 rounded-lg overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-5 py-4 text-left font-bold text-xs text-white flex justify-between items-center cursor-pointer hover:bg-neutral-900/50"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${activeFaq === idx ? 'rotate-180 text-amber-400' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-neutral-400 font-light leading-relaxed border-t border-neutral-900 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-950 border border-amber-500/30 p-8 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-bold text-white">Ready to deploy {spec.name}?</h3>
            <p className="text-xs text-neutral-300 font-light max-w-xl">
              Access the live terminal, configure your custom risk limits, and execute trades with institutional leverage.
            </p>
          </div>
          <button
            onClick={() => onLaunchTerminal('register')}
            className="px-6 py-3 bg-white hover:bg-neutral-200 text-black font-mono font-bold uppercase tracking-wider text-xs rounded transition-all cursor-pointer shrink-0 shadow-lg"
          >
            Launch Terminal Now
          </button>
        </section>

        {/* EXPLORE OTHER PLATFORM FEATURES DIRECTORY */}
        <section className="space-y-6 border-t border-neutral-900 pt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono text-amber-500 uppercase font-bold tracking-widest block">
                Platform Navigation Matrix
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Explore Institutional Workspaces
              </h3>
            </div>
            <p className="text-xs text-neutral-400 font-sans font-light">
              Select any workspace below to open its full quantitative specification page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {(Object.keys(FEATURE_SPECS) as FeatureId[]).map(id => {
              const item = FEATURE_SPECS[id];
              const isActive = id === featureId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onNavigateToFeature(id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`p-5 sm:p-6 rounded-xl border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-start space-y-2 relative overflow-hidden ${
                    isActive 
                      ? 'bg-[#101018] border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.12)]' 
                      : 'bg-[#07070a] hover:bg-[#0f0f16] border-neutral-800/90 hover:border-amber-500/50 shadow-md'
                  }`}
                >
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-amber-500 block">
                    {item.badge}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug font-sans group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </h4>
                </button>
              );
            })}
          </div>
        </section>

      </main>

      {/* SEO Optimized Semantic Footer */}
      <footer className="block border-t border-neutral-800 bg-[#060608] py-16 px-6 lg:px-12 text-left relative z-10 font-sans">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-4 col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2">
              <button 
                onClick={onClose}
                className="text-base font-black tracking-tight text-white block lowercase hover:opacity-80 transition-opacity cursor-pointer text-left"
              >
                mtxquant
              </button>
            </div>
            <p className="text-[10px] text-neutral-300 leading-relaxed font-light">
              Pioneering high-frequency visualizers and client-backed quantitative analysis tools.
            </p>
            <div className="space-y-2 pt-2">
              <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-300 font-bold block">
                Get us on
              </span>
              <div className="flex flex-row flex-wrap gap-2">
                <motion.a 
                  href="#"
                  whileHover={{ scale: 1.02, borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(23, 23, 23, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 bg-neutral-950/80 border border-neutral-900 px-3 py-1.5 rounded transition-all duration-150 cursor-pointer"
                >
                  <Apple className="w-3.5 h-3.5 text-white shrink-0" />
                  <div className="text-left font-sans">
                    <span className="text-[6.5px] text-neutral-300 block uppercase font-bold leading-none tracking-tight">Download on the</span>
                    <span className="text-[9.5px] text-white font-bold leading-none block mt-0.5">App Store</span>
                  </div>
                </motion.a>
                <motion.a 
                  href="#"
                  whileHover={{ scale: 1.02, borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(23, 23, 23, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 bg-neutral-950/80 border border-neutral-900 px-3 py-1.5 rounded transition-all duration-150 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10 shrink-0" />
                  <div className="text-left font-sans">
                    <span className="text-[6.5px] text-neutral-300 block uppercase font-bold leading-none tracking-tight">Get it on</span>
                    <span className="text-[9.5px] text-white font-bold leading-none block mt-0.5">Google Play</span>
                  </div>
                </motion.a>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-200 block">Clearing Services</span>
            <ul className="text-[9.5px] text-neutral-300 space-y-2 font-mono uppercase tracking-wider">
              <li><a href="#services" onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => { const el = document.getElementById('services'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50); }} className="hover:text-white transition-colors">Portfolio Margining</a></li>
              <li><a href="#services" onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => { const el = document.getElementById('services'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50); }} className="hover:text-white transition-colors">Collateral Pools</a></li>
              <li><a href="#services" onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => { const el = document.getElementById('services'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50); }} className="hover:text-white transition-colors">Risk Sandbox</a></li>
              <li><a href="#services" onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => { const el = document.getElementById('services'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50); }} className="hover:text-white transition-colors">Execution DMA</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-200 block">Institutional Portal</span>
            <ul className="text-[9.5px] text-neutral-300 space-y-2 font-mono uppercase tracking-wider">
              <li><a href="#portal" onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => { const el = document.getElementById('portal'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50); }} className="hover:text-white transition-colors">Markets Terminal</a></li>
              <li><a href="#pricing" onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => { const el = document.getElementById('pricing'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50); }} className="hover:text-white transition-colors">Account Tiers</a></li>
              <li><a href="#onboarding" onClick={(e) => { e.preventDefault(); onClose(); setTimeout(() => { const el = document.getElementById('onboarding'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50); }} className="hover:text-white transition-colors">Operations FAQ</a></li>
              <li><span className="text-neutral-300">SEC Code: 15c3-3</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-neutral-200 block">Regulatory Compliance</span>
            <p className="text-[9px] text-neutral-300 leading-relaxed font-light">
              Disclaimer: MTX Securities is a registered trademark. Stock investing, options leveraging, and margin allocations carry significant capital risk. Customer accounts are strictly segregated under SEC and FINRA protocols.
            </p>
          </div>

        </div>

        <div className="max-w-6xl mx-auto border-t border-neutral-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-300 text-[10px] font-mono uppercase tracking-wider">
          <span>MTX Securities Brokerage Terminal &copy; 2026. MTX Securities is a registered trademark of MTXcapital.</span>
          <div className="flex space-x-6">
            <span className="hover:text-white transition-colors cursor-help">Terms of service</span>
            <span className="hover:text-white transition-colors cursor-help">Privacy policy</span>
            <span className="hover:text-white transition-colors cursor-help">risk warnings</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
