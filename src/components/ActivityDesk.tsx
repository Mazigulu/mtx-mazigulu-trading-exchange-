import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Sliders, 
  X, 
  ChevronRight, 
  Download, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRightLeft, 
  Laptop, 
  UserCheck, 
  AlertTriangle, 
  Layers, 
  List, 
  FileText 
} from 'lucide-react';

interface TimelineStep {
  label: string;
  timestamp: string;
  description: string;
}

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'CONVERSION' | 'STABLECOIN' | 'BUY' | 'SELL' | 'FRACTIONAL_BUY' | 'DIVIDEND' | 'REDEMPTION' | 'STOCK_SPLIT' | 'TICKER_CHANGE' | 'REBALANCING' | 'VERIFICATION' | 'PASSWORD_CHANGE' | 'LOGIN' | 'PAYMENT_ADDED' | 'DELAYED' | 'MAINTENANCE' | 'HALT';
  category: 'funding' | 'investment' | 'corporate' | 'account' | 'system';
  eventName: string;
  asset: string;
  methodOrDetail: string;
  amount: string;
  amountUSDValue: number;
  status: 'Completed' | 'Pending' | 'Processing' | 'Cancelled' | 'Failed' | 'Partially Filled';
  refId: string;
  
  // Detailed metadata for Drawer
  quantity?: string;
  price?: string;
  network?: string;
  settlementRail?: string;
  fees?: string;
  timeline: TimelineStep[];
}

// 25+ highly detailed records covering all required operational actions inside MTXQuant
const INITIAL_ACTIVITIES: ActivityEvent[] = [
  {
    id: 'act_101',
    timestamp: '2026-07-03 11:24:06',
    type: 'BUY',
    category: 'investment',
    eventName: 'Purchased Apple Inc.',
    asset: 'AAPL',
    methodOrDetail: 'USD Balance',
    amount: '$500.00',
    amountUSDValue: 500,
    status: 'Completed',
    refId: 'ord_92845',
    quantity: '1.62 Shares',
    price: '$307.92',
    network: 'Nasdaq Equities Feed',
    settlementRail: 'Apex DTC Instant Settlement',
    fees: '$0.15 (0.03% Clearing)',
    timeline: [
      { label: 'Order Submitted', timestamp: '11:24:01', description: 'Limit Buy order routed via terminal interface' },
      { label: 'Settlement Initiated', timestamp: '11:24:03', description: 'Internal treasury clearance validation triggered' },
      { label: 'Settlement Completed', timestamp: '11:24:06', description: 'Securities ledger credited and cash asset debited' }
    ]
  },
  {
    id: 'act_102',
    timestamp: '2026-07-03 11:17:42',
    type: 'DEPOSIT',
    category: 'funding',
    eventName: 'KES Deposit via M-Pesa',
    asset: 'KES',
    methodOrDetail: 'M-Pesa Gateway',
    amount: 'KES 30,000',
    amountUSDValue: 230.77,
    status: 'Completed',
    refId: 'dep_29182',
    quantity: 'N/A',
    price: '1.00 KES',
    network: 'Safaricom API integration',
    settlementRail: 'Safaricom Paybill #408892',
    fees: 'KES 450.00 (Merchant Processing Fee)',
    timeline: [
      { label: 'M-Pesa Prompt Triggered', timestamp: '11:16:30', description: 'USSD push sent to customer phone ending in *492' },
      { label: 'Safaricom Authentication Verified', timestamp: '11:17:15', description: 'Customer completed PIN verification successfully' },
      { label: 'Account Ledger Credited', timestamp: '11:17:42', description: 'Deposit matched to reference ID: dep_29182' }
    ]
  },
  {
    id: 'act_103',
    timestamp: '2026-07-03 10:52:11',
    type: 'CONVERSION',
    category: 'funding',
    eventName: 'Currency Conversion KES → USD',
    asset: 'KES → USD',
    methodOrDetail: 'MTX Instant FX Spot',
    amount: '$230.00',
    amountUSDValue: 230,
    status: 'Completed',
    refId: 'fx_10283',
    quantity: 'KES 29,550.00',
    price: '0.00778 USD/KES',
    network: 'Bloomberg FX Desk Fix',
    settlementRail: 'MTX Spot Settlement Pool',
    fees: '$0.92 (0.4% FX Spread Markup)',
    timeline: [
      { label: 'FX Rate Locked', timestamp: '10:51:55', description: 'Spot contract quote accepted at 128.48 KES/USD' },
      { label: 'Asset Swapped', timestamp: '10:52:05', description: 'Settled KES balance subtracted and USD credited' },
      { label: 'Clearing Settlement Finished', timestamp: '10:52:11', description: 'FX blotter updated' }
    ]
  },
  {
    id: 'act_104',
    timestamp: '2026-07-03 09:45:00',
    type: 'WITHDRAWAL',
    category: 'funding',
    eventName: 'Withdrawal to Commercial Bank',
    asset: 'USD',
    methodOrDetail: 'Fedwire Transfer',
    amount: '$1,000.00',
    amountUSDValue: 1000,
    status: 'Pending',
    refId: 'wd_82920',
    quantity: 'N/A',
    price: '1.00 USD',
    network: 'Federal Reserve Wire Network',
    settlementRail: 'Chase ACH/Fedwire Gate #12',
    fees: '$15.00 (Standard Outgoing Wire fee)',
    timeline: [
      { label: 'Withdrawal Instruction Received', timestamp: '09:44:12', description: 'Outgoing wire request initiated by verified user' },
      { label: 'Dual-Factor Audit Cleared', timestamp: '09:44:55', description: 'Secured via hardware security key confirmation' },
      { label: 'Awaiting Federal Reserve Settlement', timestamp: '09:45:00', description: 'Held in clearing status. Cutoff window next settlement: 14:00' }
    ]
  },
  {
    id: 'act_105',
    timestamp: '2026-07-02 16:21:18',
    type: 'DIVIDEND',
    category: 'investment',
    eventName: 'Dividend Credit',
    asset: 'VOO',
    methodOrDetail: 'Vanguard S&P 500 ETF',
    amount: '$12.40',
    amountUSDValue: 12.4,
    status: 'Completed',
    refId: 'div_18281',
    quantity: '7.82 Shares (Held on Record Date)',
    price: '$1.585 per Share',
    network: 'SEC Registered Custodian Feed',
    settlementRail: 'DTCC Corporate Action Pool',
    fees: '$0.00 (No fee on incoming dividend credits)',
    timeline: [
      { label: 'Ex-Dividend Date Logged', timestamp: '2026-06-28 09:00:00', description: 'Record position verified' },
      { label: 'Dividend Disbursed', timestamp: '2026-07-02 12:00:00', description: 'Vanguard disbursed capital distribution to custodial clearing' },
      { label: 'Ledger Settlement Cleared', timestamp: '2026-07-02 16:21:18', description: 'Portfolio cash balances credited' }
    ]
  },
  {
    id: 'act_106',
    timestamp: '2026-07-02 14:10:02',
    type: 'STABLECOIN',
    category: 'funding',
    eventName: 'Stablecoin Transfer Inbound',
    asset: 'USDC',
    methodOrDetail: 'Arbitrum Network',
    amount: '1,500.00 USDC',
    amountUSDValue: 1500,
    status: 'Completed',
    refId: 'dep_usdc_7729',
    quantity: '1,500.00 USDC',
    price: '$1.00',
    network: 'Arbitrum L2 Blockchain',
    settlementRail: 'Circle Smart Contract Vault #0x7721...',
    fees: '$0.02 (Gas absorbed by MTX)',
    timeline: [
      { label: 'Transaction Detected', timestamp: '14:09:15', description: 'Block #19208453 validated inbound USDC to allocated deposit address' },
      { label: '6 Confirmations Cleared', timestamp: '14:09:45', description: 'Optimistic settlement finalized on Arbitrum rollup' },
      { label: 'Ledger Balance Updated', timestamp: '14:10:02', description: 'Credited directly to core USD collateral vault' }
    ]
  },
  {
    id: 'act_107',
    timestamp: '2026-07-02 11:45:12',
    type: 'SELL',
    category: 'investment',
    eventName: 'Sold Exposure Position',
    asset: 'BTC-USD',
    methodOrDetail: 'Crypto Desk',
    amount: '$2,345.00',
    amountUSDValue: 2345,
    status: 'Completed',
    refId: 'ord_btc_88291',
    quantity: '0.0348 BTC',
    price: '$67,385.00',
    network: 'Coinbase Prime Institutional Execution',
    settlementRail: 'MTX Liquidity Partner Settlement',
    fees: '$2.35 (0.10% Spot Commission)',
    timeline: [
      { label: 'Limit Sell Triggered', timestamp: '11:45:01', description: 'Position liquidated at BTC target level of $67,385' },
      { label: 'Order Matched', timestamp: '11:45:04', description: 'Routed to order-matching engine with Coinbase Prime liquidity bridge' },
      { label: 'Execution Certified', timestamp: '11:45:12', description: 'Subtracted 0.0348 BTC, added $2,345.00 cash' }
    ]
  },
  {
    id: 'act_108',
    timestamp: '2026-07-01 10:00:00',
    type: 'REBALANCING',
    category: 'corporate',
    eventName: 'ETF Rebalancing Allocation',
    asset: 'QQQ',
    methodOrDetail: 'Invesco Portfolio Rebalancing',
    amount: 'N/A',
    amountUSDValue: 0,
    status: 'Completed',
    refId: 'corp_91082',
    quantity: 'Adjusted Weights',
    price: 'Market close fixings',
    network: 'Nasdaq Indexing Services',
    settlementRail: 'Apex Clearing Portfolio Recalibration',
    fees: '$0.00 (Automatic Internal Corporate Action)',
    timeline: [
      { label: 'Notification of Weight Modification', timestamp: '2026-06-25 08:30:00', description: 'Invesco Index announced reweighting adjustments for top Nasdaq holdings' },
      { label: 'Recalibration Phase Initiated', timestamp: '2026-07-01 09:30:00', description: 'Portfolio weights balanced according to standard index specifications' },
      { label: 'Heuristics Validated', timestamp: '2026-07-01 10:00:00', description: 'Fractional holdings matching finalized' }
    ]
  },
  {
    id: 'act_109',
    timestamp: '2026-07-01 08:30:22',
    type: 'LOGIN',
    category: 'account',
    eventName: 'New Device Security Login',
    asset: 'System Audit',
    methodOrDetail: 'Secured Web Terminal',
    amount: 'N/A',
    amountUSDValue: 0,
    status: 'Completed',
    refId: 'evt_log_48192',
    quantity: 'N/A',
    price: 'N/A',
    network: 'MTX Identity Gateway',
    settlementRail: 'Cloudflare Zero Trust Guard',
    fees: '$0.00',
    timeline: [
      { label: 'Access Attempt Detected', timestamp: '08:30:05', description: 'Inbound session from IP 197.234.18.91 (Nairobi, Kenya)' },
      { label: 'Dual Factor Authenticated', timestamp: '08:30:18', description: 'FIDO2 WebAuthn security key validation successful' },
      { label: 'Session Certificate Provisioned', timestamp: '08:30:22', description: 'Assigned session token: MTX_SESS_6576B...' }
    ]
  },
  {
    id: 'act_110',
    timestamp: '2026-06-30 15:45:00',
    type: 'DELAYED',
    category: 'system',
    eventName: 'Settlement Delayed Alert',
    asset: 'Chase Bank ACH Rail',
    methodOrDetail: 'ACH Clearing',
    amount: 'N/A',
    amountUSDValue: 0,
    status: 'Processing',
    refId: 'sys_warn_2910',
    quantity: 'N/A',
    price: 'N/A',
    network: 'Automated Operations Monitor',
    settlementRail: 'FedACH Processing Gate #4',
    fees: 'N/A',
    timeline: [
      { label: 'Processing Lag Logged', timestamp: '15:40:00', description: 'ACH endpoint did not return standard settlement signal' },
      { label: 'Warning Disseminated', timestamp: '15:45:00', description: 'Delay advisory posted. Standard settlement operations extended by 30 mins' }
    ]
  },
  {
    id: 'act_111',
    timestamp: '2026-06-30 09:12:15',
    type: 'STOCK_SPLIT',
    category: 'corporate',
    eventName: 'Stock Split (NVIDIA 10:1)',
    asset: 'NVDA',
    methodOrDetail: 'Corporate Restructure',
    amount: 'Adjusted x10',
    amountUSDValue: 0,
    status: 'Completed',
    refId: 'corp_nvda_split',
    quantity: 'Position multiplied by 10',
    price: '$125.40 (Adjusted from $1,254.00)',
    network: 'SEC Registered Securities Transfer Corp',
    settlementRail: 'Apex Custodian Board',
    fees: '$0.00',
    timeline: [
      { label: 'Corporate Decision Promulgated', timestamp: '2026-06-05 09:00:00', description: 'Board announced 10-for-1 forward split' },
      { label: 'Split Ratio Evaluated', timestamp: '2026-06-30 08:00:00', description: 'Calculated holding expansion. Multiplied shares from 10 to 100' },
      { label: 'Trading Commenced (Post-Split)', timestamp: '2026-06-30 09:12:15', description: 'Position cost bases recalibrated to prevent synthetic capital gain/loss' }
    ]
  },
  {
    id: 'act_112',
    timestamp: '2026-06-29 17:33:04',
    type: 'PASSWORD_CHANGE',
    category: 'account',
    eventName: 'Identity Password Reset',
    asset: 'Security Creds',
    methodOrDetail: 'User Self-Service Portal',
    amount: 'N/A',
    amountUSDValue: 0,
    status: 'Completed',
    refId: 'sec_pwd_910',
    quantity: 'N/A',
    price: 'N/A',
    network: 'Identity Security Shield',
    settlementRail: 'Firebase Authentication Auth-Service',
    fees: 'N/A',
    timeline: [
      { label: 'Reset Email Requested', timestamp: '17:29:12', description: 'Verification link sent to user email: maziguluj@gmail.com' },
      { label: 'One-Time Secret Validated', timestamp: '17:32:00', description: 'User clicked cryptographic token and verified identity' },
      { label: 'Security Password Committed', timestamp: '17:33:04', description: 'Salts updated in database. Current user active sessions retained' }
    ]
  },
  {
    id: 'act_113',
    timestamp: '2026-06-29 14:00:00',
    type: 'HALT',
    category: 'system',
    eventName: 'NYSE Regulatory Trading Halt',
    asset: 'TSLA',
    methodOrDetail: 'Volatility Circuit Breaker',
    amount: 'Halt Level LULD',
    amountUSDValue: 0,
    status: 'Cancelled',
    refId: 'hlt_tsla_2910',
    quantity: 'N/A',
    price: 'N/A',
    network: 'NYSE SIP Market Feed',
    settlementRail: 'NASDAQ SIP / Securities Information Processor',
    fees: 'N/A',
    timeline: [
      { label: 'Trigger Event Logged', timestamp: '13:55:00', description: 'TSLA fell -10.2% within a 5-minute interval' },
      { label: 'Circuit Breaker Inundation', timestamp: '14:00:00', description: 'LULD (Limit-Up Limit-Down) level 1 halt. Trading restricted on all public venues' },
      { label: 'Halt Revoked', timestamp: '14:05:00', description: 'Market re-entered standard auction order match mode' }
    ]
  },
  {
    id: 'act_114',
    timestamp: '2026-06-28 11:32:10',
    type: 'FRACTIONAL_BUY',
    category: 'investment',
    eventName: 'Fractional Share Purchase',
    asset: 'MSFT',
    methodOrDetail: 'USD Cash Ledger',
    amount: '$100.00',
    amountUSDValue: 100,
    status: 'Completed',
    refId: 'ord_frac_881',
    quantity: '0.238 Shares',
    price: '$420.168',
    network: 'MTX Fractional Fractionalization Feed',
    settlementRail: 'Apex Co-Ownership Brokerage Ledger',
    fees: '$0.03',
    timeline: [
      { label: 'Fractional Request Scheduled', timestamp: '11:32:01', description: 'Allocated portion of full-share matching block' },
      { label: 'Cleared internally', timestamp: '11:32:05', description: 'Matched with corresponding fractional buy/sell blocks from alternate accounts' },
      { label: 'Position Ledger Certified', timestamp: '11:32:10', description: 'Fractional balance adjusted dynamically' }
    ]
  },
  {
    id: 'act_115',
    timestamp: '2026-06-27 10:15:00',
    type: 'WITHDRAWAL',
    category: 'funding',
    eventName: 'Withdrawal to Bank Card',
    asset: 'KES',
    methodOrDetail: 'Visa / Mastercard payout',
    amount: 'KES 150,000',
    amountUSDValue: 1153.85,
    status: 'Failed',
    refId: 'wd_card_910',
    quantity: 'N/A',
    price: 'N/A',
    network: 'Equity Bank Nairobi Card Clearing',
    settlementRail: 'Visa Direct Payout API',
    fees: 'KES 0.00 (Refunded completely upon abort)',
    timeline: [
      { label: 'Transaction Triggered', timestamp: '10:14:15', description: 'Card payout request sent to Visa gateway' },
      { label: 'Authorization Denied', timestamp: '10:15:00', description: 'Card issuer bank returned decline code: "54 - Expired Card / Restriction on Account"' },
      { label: 'Ledger Rollback Executed', timestamp: '10:15:05', description: 'Capital re-credited to KES wallet balance instantly' }
    ]
  },
  {
    id: 'act_116',
    timestamp: '2026-06-26 12:00:00',
    type: 'MAINTENANCE',
    category: 'system',
    eventName: 'Scheduled Database Optimization',
    asset: 'MTX Core Infrastructure',
    methodOrDetail: 'Maintenance Window',
    amount: 'N/A',
    amountUSDValue: 0,
    status: 'Completed',
    refId: 'sys_maint_919',
    quantity: 'N/A',
    price: 'N/A',
    network: 'GCP Kubernetes Engine Control',
    settlementRail: 'System redundancy switchover',
    fees: 'N/A',
    timeline: [
      { label: 'Preparatory Sync Initiated', timestamp: '11:30:00', description: 'All database transactions safely flushed to cold storage Spanner' },
      { label: 'Re-indexing Sequence Started', timestamp: '12:00:00', description: 'Secondary replication sets rebuilt to reduce telemetry overhead' },
      { label: 'Full Access Restored', timestamp: '12:05:00', description: 'API routes and WebSocket streaming servers successfully verified' }
    ]
  },
  {
    id: 'act_117',
    timestamp: '2026-06-25 15:44:09',
    type: 'PAYMENT_ADDED',
    category: 'account',
    eventName: 'New Settlement Bank Bound',
    asset: 'Commercial Bank',
    methodOrDetail: 'Plaid ACH Connection',
    amount: 'Account Linked',
    amountUSDValue: 0,
    status: 'Completed',
    refId: 'evt_bnk_098',
    quantity: 'N/A',
    price: 'N/A',
    network: 'Plaid API Core Network',
    settlementRail: 'Chase ACH Protocol Verification',
    fees: 'N/A',
    timeline: [
      { label: 'Link Initiated', timestamp: '15:42:15', description: 'Plaid link widget initialized' },
      { label: 'Bank Credentials Cleared', timestamp: '15:43:50', description: 'Secured login authorized by JPMorgan Chase bank system' },
      { label: 'Direct Debit Mandate Verified', timestamp: '15:44:09', description: 'ACH mandate approved for routing ...4402' }
    ]
  },
  {
    id: 'act_118',
    timestamp: '2026-06-25 09:15:30',
    type: 'DEPOSIT',
    category: 'funding',
    eventName: 'Wire Transfer Inbound Deposit',
    asset: 'USD',
    methodOrDetail: 'Chase Bank Wire',
    amount: '$10,000.00',
    amountUSDValue: 10000,
    status: 'Completed',
    refId: 'dep_wire_0029',
    quantity: 'N/A',
    price: '1.00 USD',
    network: 'Federal Reserve Wire Network',
    settlementRail: ' chase-institutional-settlement-gateway',
    fees: '$0.00 (Inbound institutional wire fees waived)',
    timeline: [
      { label: 'SWIFT Message Processed', timestamp: '08:15:00', description: 'Fedwire incoming block received' },
      { label: 'Treasury Matching Succeeded', timestamp: '09:05:10', description: 'Matched sub-account code to maziguluj@gmail.com' },
      { label: 'Ledger Capital Certified', timestamp: '09:15:30', description: 'USD Balance increased to support active positions' }
    ]
  },
  {
    id: 'act_119',
    timestamp: '2026-06-24 14:12:00',
    type: 'VERIFICATION',
    category: 'account',
    eventName: 'Tier-2 KYC Verification',
    asset: 'Compliance Audit',
    methodOrDetail: 'Sumsub Automated Biometrics',
    amount: 'Approved',
    amountUSDValue: 0,
    status: 'Completed',
    refId: 'kyc_tier2_2291',
    quantity: 'N/A',
    price: 'N/A',
    network: 'Sumsub AML Compliance DB',
    settlementRail: 'MTX Identity Ledger API',
    fees: 'N/A',
    timeline: [
      { label: 'Identity Documents Uploaded', timestamp: '13:58:00', description: 'National ID and Proof of Residency submitted' },
      { label: 'Facial Biometric Cleared', timestamp: '13:59:45', description: 'Liveness test matched ID image exactly' },
      { label: 'Compliance Audit Authorized', timestamp: '14:12:00', description: 'PEP database scans completed. Verification grade assigned: Tier-2 Cleared' }
    ]
  },
  {
    id: 'act_120',
    timestamp: '2026-06-24 10:15:00',
    type: 'REDEMPTION',
    category: 'investment',
    eventName: 'Asset Redemption Event',
    asset: 'SPY',
    methodOrDetail: 'Custodial Clearing',
    amount: '$3,400.00',
    amountUSDValue: 3400,
    status: 'Completed',
    refId: 'rdm_88291',
    quantity: '6.67 Shares',
    price: '$510.12',
    network: 'Apex DTC Clearing Core',
    settlementRail: 'Custodial Redemption Gate',
    fees: '$0.00',
    timeline: [
      { label: 'Redemption Request Initiated', timestamp: '09:30:00', description: 'Redemption protocol selected for SPY index balance' },
      { label: 'Custodial Settlement Cleared', timestamp: '10:05:00', description: 'APEX liquidated underlying share certificates' },
      { label: 'Capital Disbursed', timestamp: '10:15:00', description: 'Proceeds credited to main dollar wallet' }
    ]
  },
  {
    id: 'act_121',
    timestamp: '2026-06-23 11:20:15',
    type: 'CONVERSION',
    category: 'funding',
    eventName: 'Currency Conversion USD → EUR',
    asset: 'USD → EUR',
    methodOrDetail: 'MTX Instant FX Spot',
    amount: '€4,500.00',
    amountUSDValue: 4860,
    status: 'Completed',
    refId: 'fx_77281',
    quantity: '$4,860.00',
    price: '0.9259 EUR/USD',
    network: 'LMAX Institutional FX Engine',
    settlementRail: 'MTX Multi-Currency Liquidity Pool',
    fees: '$4.86 (0.10% Spot Markup)',
    timeline: [
      { label: 'Spot Exchange Requested', timestamp: '11:19:40', description: 'Exchange bid processed for $4,860' },
      { label: 'Spread Calculation Complete', timestamp: '11:20:02', description: 'Locked exchange rate at 0.9259 EUR per USD' },
      { label: 'Ledger balances posted', timestamp: '11:20:15', description: 'Swapped USD for EUR successfully' }
    ]
  },
  {
    id: 'act_122',
    timestamp: '2026-06-22 16:11:42',
    type: 'BUY',
    category: 'investment',
    eventName: 'Purchased Microsoft Corp.',
    asset: 'MSFT',
    methodOrDetail: 'USD Cash Balance',
    amount: '$2,500.00',
    amountUSDValue: 2500,
    status: 'Completed',
    refId: 'ord_91028',
    quantity: '5.92 Shares',
    price: '$421.90',
    network: 'NASDAQ direct clearing',
    settlementRail: 'Apex clearing block',
    fees: '$0.75',
    timeline: [
      { label: 'Order placed', timestamp: '16:11:02', description: 'Routed via smart-order broker group' },
      { label: 'Order filled', timestamp: '16:11:15', description: 'Filled on institutional dark pool' },
      { label: 'Equity position logged', timestamp: '16:11:42', description: 'MSFT holding updated' }
    ]
  },
  {
    id: 'act_123',
    timestamp: '2026-06-22 10:45:10',
    type: 'TICKER_CHANGE',
    category: 'corporate',
    eventName: 'Corporate Ticker Change (FB → META)',
    asset: 'META',
    methodOrDetail: 'Mandatory Asset Rename',
    amount: 'Ticker Changed',
    amountUSDValue: 0,
    status: 'Completed',
    refId: 'corp_fb_meta_rename',
    quantity: 'N/A',
    price: 'N/A',
    network: 'SEC Master Securities database',
    settlementRail: 'DTC Master Registry',
    fees: '$0.00',
    timeline: [
      { label: 'Advisory Released', timestamp: '2026-06-15 09:00:00', description: 'DTC scheduled corporate identifier modifications' },
      { label: 'Ledger Asset Remapped', timestamp: '2026-06-22 08:30:00', description: 'Renamed class identifiers from FB to META in all client positions' },
      { label: 'Registry Sync Finalized', timestamp: '2026-06-22 10:45:10', description: 'Securities ledger verified as structurally intact' }
    ]
  },
  {
    id: 'act_124',
    timestamp: '2026-06-21 09:00:00',
    type: 'DEPOSIT',
    category: 'funding',
    eventName: 'Wire Transfer Inbound Deposit',
    asset: 'USD',
    methodOrDetail: 'JP Morgan Chase Wire',
    amount: '$5,000.00',
    amountUSDValue: 5000,
    status: 'Partially Filled',
    refId: 'dep_wire_0028',
    quantity: 'N/A',
    price: '1.00 USD',
    network: 'Federal Reserve Wire Network',
    settlementRail: 'Chase-Institutional-Settlement-Gateway',
    fees: '$0.00',
    timeline: [
      { label: 'SWIFT Message Processed', timestamp: '08:00:00', description: 'Fedwire incoming block received' },
      { label: 'Treasury Matching Suspended', timestamp: '08:30:00', description: 'Amount did not match matching wire instruction precisely. Held for partial matching' },
      { label: 'Partial Release Completed', timestamp: '09:00:00', description: 'Authorized partial posting of $5,000.00 pending full clearance check' }
    ]
  }
];

export default function ActivityDesk() {
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITIES);
  const [selectedActivity, setSelectedActivity] = useState<ActivityEvent | null>(null);
  const [viewMode, setViewMode] = useState<'TABLE' | 'TIMELINE'>('TABLE');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7D' | '30D' | '90D' | 'CUSTOM'>('ALL');
  
  // Custom Date range states
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Fetch real-time wallet transactions and integrate them into Activity Workspace logs
  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const fetchWalletActivities = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const res = await fetch('/api/funding/state');
        if (res.ok && isMounted) {
          const data = await res.json();
          const walletTxs: any[] = data.transactions || [];
          
          // Map wallet transactions to ActivityEvents
          const mappedWalletActivities: ActivityEvent[] = walletTxs.map((tx: any) => {
            const isOutbound = tx.type === 'WITHDRAWAL';
            
            // Format amount nicely
            let displayAmount = `${tx.currency} ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
            if (tx.currency === 'USD') displayAmount = `$${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
            else if (tx.currency === 'EUR') displayAmount = `€${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
            else if (tx.currency === 'GBP') displayAmount = `£${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

            // Determine rate for USD calculation
            let rate = 1.0;
            if (tx.currency === 'EUR') rate = 1.09;
            else if (tx.currency === 'GBP') rate = 1.28;
            else if (tx.currency === 'KES') rate = 0.0078;
            
            const amountUSDValue = tx.amount * rate;

            // Map status
            let status: 'Completed' | 'Pending' | 'Processing' | 'Cancelled' | 'Failed' = 'Completed';
            if (tx.status === 'Settled') status = 'Completed';
            else if (tx.status === 'Pending') status = 'Pending';
            else if (tx.status === 'Processing') status = 'Processing';
            else if (tx.status === 'Cancelled') status = 'Cancelled';
            else if (tx.status === 'Failed') status = 'Failed';

            // Settlement rail details
            let settlementRail = 'Apex DTC Instant Settlement';
            if (tx.method?.includes('ACH')) settlementRail = 'Chase ACH Protocol Verification';
            else if (tx.method?.includes('Wire')) settlementRail = 'Federal Reserve Wire Network';
            else if (tx.method?.includes('Card')) settlementRail = 'Visa Direct Payout API';
            else if (tx.method?.includes('M-Pesa')) settlementRail = 'Safaricom Paybill #408892';
            else if (tx.method?.includes('Transfer') || tx.method?.includes('Deposit') || tx.method?.includes('Withdrawal')) {
              if (['USDC', 'USDT', 'PYUSD'].includes(tx.currency)) {
                settlementRail = 'Circle Smart Contract Vault';
              }
            }

            // Timeline steps
            const timelineSteps = [];
            if (status === 'Completed') {
              timelineSteps.push(
                { label: 'Order Submitted', timestamp: '09:00:00', description: `Inbound transfer of ${tx.amount} ${tx.currency} initiated.` },
                { label: 'Settlement Initiated', timestamp: '09:05:00', description: 'Internal treasury clearance validation triggered.' },
                { label: 'Settlement Completed', timestamp: '09:15:00', description: 'Securities ledger credited and cash asset debited.' }
              );
            } else if (status === 'Pending' || status === 'Processing') {
              timelineSteps.push(
                { label: 'Order Submitted', timestamp: '09:00:00', description: `Inbound transfer of ${tx.amount} ${tx.currency} initiated.` },
                { label: 'Awaiting Settlement', timestamp: '09:05:00', description: 'Held in clearing status. Awaiting external network authorization.' }
              );
            } else {
              timelineSteps.push(
                { label: 'Order Submitted', timestamp: '09:00:00', description: `Inbound transfer of ${tx.amount} ${tx.currency} initiated.` },
                { label: 'Settlement Failed', timestamp: '09:15:00', description: 'External system returned decline code or network exception.' }
              );
            }

            return {
              id: tx.id,
              timestamp: tx.date.length === 16 ? `${tx.date}:00` : tx.date,
              type: tx.type,
              category: 'funding',
              eventName: `${tx.currency} ${tx.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} via ${tx.method}`,
              asset: tx.currency,
              methodOrDetail: tx.method,
              amount: displayAmount,
              amountUSDValue: amountUSDValue,
              status: status,
              refId: tx.id,
              quantity: 'N/A',
              price: `1.00 ${tx.currency}`,
              network: ['USDC', 'USDT', 'PYUSD'].includes(tx.currency) ? 'Base L2 Network' : 'Standard Clearing Rails',
              settlementRail: settlementRail,
              fees: tx.method?.includes('Wire') ? '$15.00' : '$0.00',
              timeline: timelineSteps
            };
          });

          // Merge with INITIAL_ACTIVITIES, filtering out any existing events with matching IDs to prevent duplicates
          if (isMounted) {
            setActivities(prev => {
              const filteredPrev = prev.filter(p => !mappedWalletActivities.some(w => w.id === p.id));
              const merged = [...mappedWalletActivities, ...filteredPrev];
              // Sort by timestamp descending
              return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch wallet activities:', err);
      } finally {
        isFetching = false;
      }
    };

    fetchWalletActivities();
    const interval = setInterval(fetchWalletActivities, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 1-to-1 mappings of category filters from prompt
  const CATEGORY_CHIPS = [
    { label: 'All', value: 'ALL' },
    { label: 'Deposits', value: 'DEPOSIT' },
    { label: 'Withdrawals', value: 'WITHDRAWAL' },
    { label: 'Purchases', value: 'BUY_FRACTIONAL' }, // matches BUY and FRACTIONAL_BUY
    { label: 'Sales', value: 'SELL' },
    { label: 'Conversions', value: 'CONVERSION' },
    { label: 'Dividends', value: 'DIVIDEND' },
    { label: 'Corporate Actions', value: 'CORPORATE' }, // rebalancing, stock_split, ticker_change
    { label: 'System Events', value: 'SYSTEM' } // delayed, maintenance, halt
  ];

  // Operations metrics calculations based on INITIAL_ACTIVITIES to maintain operational overview
  const operationsMetrics = useMemo(() => {
    const today = new Date('2026-07-03').getTime(); // align to custom simulated local time
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Today's Activity Events
    const todaysEvents = activities.filter(a => {
      const eventTime = new Date(a.timestamp.substring(0, 10)).getTime();
      return eventTime === today;
    });

    // Pending Actions Count
    const pendingActions = activities.filter(a => a.status === 'Pending' || a.status === 'Processing');
    const pendingWithdrawalCount = pendingActions.filter(a => a.type === 'WITHDRAWAL').length;
    const pendingInvestmentCount = pendingActions.filter(a => a.type === 'BUY' || a.type === 'SELL' || a.type === 'FRACTIONAL_BUY').length;

    // Settled Transactions
    const completedEvents = activities.filter(a => a.status === 'Completed').length;
    const failedOrCancelledEvents = activities.filter(a => a.status === 'Failed' || a.status === 'Cancelled').length;
    const successRate = completedEvents > 0 
      ? (completedEvents / (completedEvents + failedOrCancelledEvents)) * 100 
      : 99.6;

    // Total Transaction Volume (Since Account Creation)
    const totalVolume = activities.reduce((sum, a) => sum + a.amountUSDValue, 0);

    return {
      todaysEventsCount: todaysEvents.length,
      pendingCount: pendingActions.length,
      pendingWithdrawals: pendingWithdrawalCount,
      pendingInvestments: pendingInvestmentCount,
      completedCount: completedEvents,
      successRate: parseFloat(successRate.toFixed(1)),
      totalVolumeUSD: totalVolume
    };
  }, [activities]);

  // Filtering Logic
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      // 1. Text Search Filter (Asset, Reference ID, Date, Amount, Payment Method)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesAsset = a.asset.toLowerCase().includes(query);
        const matchesRefId = a.refId.toLowerCase().includes(query);
        const matchesTimestamp = a.timestamp.toLowerCase().includes(query);
        const matchesAmount = a.amount.toLowerCase().includes(query);
        const matchesMethod = a.methodOrDetail.toLowerCase().includes(query);
        const matchesEventName = a.eventName.toLowerCase().includes(query);
        const matchesType = a.type.toLowerCase().includes(query);

        if (!matchesAsset && !matchesRefId && !matchesTimestamp && !matchesAmount && !matchesMethod && !matchesEventName && !matchesType) {
          return false;
        }
      }

      // 2. Category Chips Filter
      if (activeCategoryFilter !== 'ALL') {
        if (activeCategoryFilter === 'DEPOSIT') {
          if (a.type !== 'DEPOSIT' && a.type !== 'STABLECOIN') return false;
        } else if (activeCategoryFilter === 'WITHDRAWAL') {
          if (a.type !== 'WITHDRAWAL') return false;
        } else if (activeCategoryFilter === 'BUY_FRACTIONAL') {
          if (a.type !== 'BUY' && a.type !== 'FRACTIONAL_BUY') return false;
        } else if (activeCategoryFilter === 'SELL') {
          if (a.type !== 'SELL') return false;
        } else if (activeCategoryFilter === 'CONVERSION') {
          if (a.type !== 'CONVERSION') return false;
        } else if (activeCategoryFilter === 'DIVIDEND') {
          if (a.type !== 'DIVIDEND') return false;
        } else if (activeCategoryFilter === 'CORPORATE') {
          if (a.category !== 'corporate') return false;
        } else if (activeCategoryFilter === 'SYSTEM') {
          if (a.category !== 'system' && a.category !== 'account') return false;
        }
      }

      // 3. Date Filters (Simulated with baseline 2026-07-03 as Today)
      const baseToday = new Date('2026-07-03');
      const itemDate = new Date(a.timestamp.substring(0, 10));
      const diffTime = Math.abs(baseToday.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateFilter === 'TODAY') {
        if (a.timestamp.substring(0, 10) !== '2026-07-03') return false;
      } else if (dateFilter === '7D') {
        if (diffDays > 7) return false;
      } else if (dateFilter === '30D') {
        if (diffDays > 30) return false;
      } else if (dateFilter === '90D') {
        if (diffDays > 90) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate && itemDate < new Date(customStartDate)) return false;
        if (customEndDate && itemDate > new Date(customEndDate)) return false;
      }

      return true;
    });
  }, [activities, searchQuery, activeCategoryFilter, dateFilter, customStartDate, customEndDate]);

  // Download Blotter CSV to emphasize professional compliance and auditability
  const handleDownloadCSV = () => {
    try {
      const headers = ['Timestamp', 'Type', 'Category', 'Event', 'Asset', 'Method/Details', 'Amount', 'Status', 'Reference ID'];
      const csvRows = [headers.join(',')];
      
      filteredActivities.forEach(a => {
        const row = [
          `"${a.timestamp}"`,
          `"${a.type}"`,
          `"${a.category}"`,
          `"${a.eventName}"`,
          `"${a.asset}"`,
          `"${a.methodOrDetail}"`,
          `"${a.amount}"`,
          `"${a.status}"`,
          `"${a.refId}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `mtx_audit_trail_${new Date().toISOString().substring(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed generating audit blotter CSV:', err);
    }
  };

  return (
    <div className="space-y-6 text-white font-mono">
      
      {/* Page Title & Operational Info Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-[9px] font-black tracking-widest text-indigo-400">
              LEDGER CORE
            </span>
            <span className="text-[10px] text-neutral-200 uppercase tracking-widest">Permanent Registry</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-1.5 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400 stroke-[2.5px]" />
            Activity Workspace
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-lg bg-black/40 border border-white/5 p-1">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'TABLE' 
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30' 
                  : 'text-neutral-200 hover:text-white'
              }`}
              title="Table Grid Blotter View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setViewMode('TIMELINE')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'TIMELINE' 
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30' 
                  : 'text-neutral-200 hover:text-white'
              }`}
              title="Chronological Timeline View"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline View</span>
            </button>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center gap-2"
            title="Download CSV Statement Audit Blotter"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export statement CSV</span>
          </button>
        </div>
      </div>

      {/* ──────────────────── TOP SUMMARY CARDS (FOUR-CARD LAYOUT) ──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Today's Activity */}
        <div className="bg-[#08080c] border border-white/10 rounded-xl p-4 shadow-xl text-left relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/[0.02] rounded-full blur-2xl group-hover:bg-indigo-500/[0.05] transition-all" />
          <span className="text-neutral-200 text-[8.5px] font-black uppercase tracking-widest block">Today's Activity</span>
          <span className="text-2xl font-black text-white block mt-1.5">
            {operationsMetrics.todaysEventsCount} Events
          </span>
          <span className="text-[10px] text-emerald-400 font-bold block mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            +3 Since Yesterday
          </span>
        </div>

        {/* Card 2: Pending Actions */}
        <div className="bg-[#08080c] border border-white/10 rounded-xl p-4 shadow-xl text-left relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/[0.02] rounded-full blur-2xl group-hover:bg-amber-500/[0.05] transition-all" />
          <span className="text-neutral-200 text-[8.5px] font-black uppercase tracking-widest block">Pending Actions</span>
          <span className="text-2xl font-black text-amber-400 block mt-1.5">
            {operationsMetrics.pendingCount} Pending
          </span>
          <div className="text-[9.5px] text-neutral-200 block mt-2 leading-relaxed space-y-0.5">
            <div className="flex justify-between">
              <span>Withdrawal Limit Queue:</span>
              <span className="font-bold text-white">{operationsMetrics.pendingWithdrawals} Outbound</span>
            </div>
            <div className="flex justify-between">
              <span>Investment Fills:</span>
              <span className="font-bold text-white">{operationsMetrics.pendingInvestments} Order</span>
            </div>
          </div>
        </div>

        {/* Card 3: Settled Transactions */}
        <div className="bg-[#08080c] border border-white/10 rounded-xl p-4 shadow-xl text-left relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-2xl group-hover:bg-emerald-500/[0.05] transition-all" />
          <span className="text-neutral-200 text-[8.5px] font-black uppercase tracking-widest block">Settled Transactions</span>
          <span className="text-2xl font-black text-white block mt-1.5">
            {operationsMetrics.completedCount} Completed
          </span>
          <span className="text-[10px] text-[#10b981] font-bold block mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {operationsMetrics.successRate}% Success Rate
          </span>
        </div>

        {/* Card 4: Total Transaction Volume */}
        <div className="bg-[#08080c] border border-white/10 rounded-xl p-4 shadow-xl text-left relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/[0.02] rounded-full blur-2xl group-hover:bg-purple-500/[0.05] transition-all" />
          <span className="text-neutral-200 text-[8.5px] font-black uppercase tracking-widest block">Total Transaction Volume</span>
          <span className="text-2xl font-black text-indigo-300 block mt-1.5">
            ${operationsMetrics.totalVolumeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-neutral-200 font-semibold block mt-2">
            Cumulative Since Account Creation
          </span>
        </div>

      </div>

      {/* ──────────────────── SEARCH & FILTERS SECTION ──────────────────── */}
      <div className="bg-[#08080d] border border-white/10 rounded-xl p-5 space-y-4 shadow-lg text-left">
        
        {/* Core Inputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Search Box */}
          <div className="lg:col-span-5 relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-200">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by asset, ref ID, amount, payment method..."
              className="w-full bg-[#040406] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-[11px] placeholder-neutral-200 text-white focus:outline-none focus:border-indigo-500/40 transition-colors"
            />
          </div>

          {/* Date Picker Filter Options */}
          <div className="lg:col-span-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full bg-[#040406] border border-white/10 rounded-lg py-2.5 px-3 text-[11px] text-white/80 focus:outline-none focus:border-indigo-500/40 transition-colors cursor-pointer"
            >
              <option value="ALL">All Recorded Dates</option>
              <option value="TODAY">Today (2026-07-03)</option>
              <option value="7D">Past 7 Days</option>
              <option value="30D">Past 30 Days</option>
              <option value="90D">Past 90 Days</option>
              <option value="CUSTOM">Custom Range...</option>
            </select>
          </div>

          {/* Custom Date Picker inputs */}
          {dateFilter === 'CUSTOM' && (
            <div className="lg:col-span-4 grid grid-cols-2 gap-2 animate-fadeIn">
              <div className="relative">
                <span className="absolute top-2.5 left-2.5 text-[8px] text-neutral-200 uppercase tracking-widest font-black">From</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-[#040406] border border-white/10 rounded-lg pt-4 pb-1 px-2.5 text-[10px] text-white focus:outline-none focus:border-indigo-500/40 transition-colors"
                />
              </div>
              <div className="relative">
                <span className="absolute top-2.5 left-2.5 text-[8px] text-neutral-200 uppercase tracking-widest font-black">To</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-[#040406] border border-white/10 rounded-lg pt-4 pb-1 px-2.5 text-[10px] text-white focus:outline-none focus:border-indigo-500/40 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Quick Clear Action (Displays only if filters are active) */}
          {(searchQuery || activeCategoryFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <div className="lg:col-span-2 flex items-center justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategoryFilter('ALL');
                  setDateFilter('ALL');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="w-full lg:w-auto px-3 py-2.5 border border-rose-500/10 hover:border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-lg text-[9.5px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}

        </div>

        {/* Filter Chips Horizontal Slider Row */}
        <div className="border-t border-white/5 pt-3.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
            <span className="text-[9px] text-neutral-200 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 select-none">
              <Filter className="w-3 h-3 text-indigo-400" />
              Event Filters:
            </span>
            {CATEGORY_CHIPS.map(chip => (
              <button
                key={chip.value}
                onClick={() => setActiveCategoryFilter(chip.value)}
                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wide transition-all shrink-0 cursor-pointer ${
                  activeCategoryFilter === chip.value 
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm' 
                    : 'bg-black/35 text-neutral-200 border border-white/5 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ──────────────────── MAIN RESULTS BLOTTER LIST ──────────────────── */}
      {filteredActivities.length === 0 ? (
        <div className="border border-dashed border-white/10 bg-[#08080c] rounded-2xl p-16 text-center space-y-4">
          <div className="p-3 bg-white/5 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-neutral-200">
            <History className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-white tracking-widest">No matched transaction entries</h4>
            <p className="text-[10px] text-neutral-200 max-w-md mx-auto leading-relaxed">
              No permanently committed ledger records correspond to your criteria. Try loosening search terms or switching categories.
            </p>
          </div>
        </div>
      ) : (
        viewMode === 'TABLE' ? (
          
          /* TABLE VIEW: Institutional Trade Blotter */
          <div className="bg-[#08080c] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/10 text-[9px] font-bold uppercase tracking-wider text-neutral-200">
                    <th className="py-4 px-5">Timestamp</th>
                    <th className="py-4 px-5">Event</th>
                    <th className="py-4 px-5">Asset / Method</th>
                    <th className="py-4 px-5 text-right">Amount</th>
                    <th className="py-4 px-5 text-center">Status</th>
                    <th className="py-4 px-5 font-mono text-center">Reference ID</th>
                    <th className="py-4 px-5 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[10px]">
                  {filteredActivities.map(activity => {
                    const isOutbound = activity.type === 'WITHDRAWAL' || activity.type === 'SELL';
                    const isNeutral = ['LOGIN', 'PASSWORD_CHANGE', 'VERIFICATION', 'PAYMENT_ADDED', 'DELAYED', 'MAINTENANCE', 'HALT', 'REBALANCING', 'STOCK_SPLIT', 'TICKER_CHANGE'].includes(activity.type);
                    
                    return (
                      <tr 
                        key={activity.id}
                        onClick={() => setSelectedActivity(activity)}
                        className="hover:bg-white/[0.02] active:bg-white/[0.04] transition-all cursor-pointer group"
                        title="Click row to open permanent audit ledger details"
                      >
                        {/* Timestamp */}
                        <td className="py-3.5 px-5 text-neutral-200 font-mono whitespace-nowrap">
                          {activity.timestamp}
                        </td>

                        {/* Event details */}
                        <td className="py-3.5 px-5 font-black text-white whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            {isNeutral ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            ) : isOutbound ? (
                              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            {activity.eventName}
                          </span>
                        </td>

                        {/* Asset / Method */}
                        <td className="py-3.5 px-5 text-neutral-200 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-semibold text-white/80">
                            {activity.asset}
                          </span>
                          <span className="text-[9px] text-neutral-200 ml-2 font-normal">
                            ({activity.methodOrDetail})
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-5 text-right font-black whitespace-nowrap font-mono">
                          {isNeutral ? (
                            <span className="text-neutral-200">N/A</span>
                          ) : (
                            <span className={isOutbound ? 'text-rose-400' : 'text-emerald-400'}>
                              {isOutbound ? '-' : '+'}{activity.amount}
                            </span>
                          )}
                        </td>

                        {/* Status Badges */}
                        <td className="py-3.5 px-5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide leading-none ${
                            activity.status === 'Completed' ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' :
                            activity.status === 'Pending' ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400 animate-pulse' :
                            activity.status === 'Processing' ? 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 animate-pulse' :
                            activity.status === 'Cancelled' ? 'bg-white/5 border border-white/10 text-neutral-200' :
                            activity.status === 'Partially Filled' ? 'bg-sky-500/10 border border-sky-500/25 text-sky-400' :
                            'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                          }`}>
                            {activity.status}
                          </span>
                        </td>

                        {/* Reference ID */}
                        <td className="py-3.5 px-5 text-center font-mono text-neutral-200 font-semibold text-[9.5px]">
                          {activity.refId}
                        </td>

                        {/* Drawer Review Chevron CTA */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap text-neutral-400 group-hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-0.5 transition-transform" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          
          /* TIMELINE VIEW: chronological audit stream layout */
          <div className="relative pl-6 md:pl-10 space-y-6 text-left">
            {/* Connecting Vertical line */}
            <div className="absolute top-2 bottom-2 left-2.5 md:left-4 w-[1px] bg-white/10" />

            {filteredActivities.map(activity => {
              const isOutbound = activity.type === 'WITHDRAWAL' || activity.type === 'SELL';
              const isNeutral = ['LOGIN', 'PASSWORD_CHANGE', 'VERIFICATION', 'PAYMENT_ADDED', 'DELAYED', 'MAINTENANCE', 'HALT', 'REBALANCING', 'STOCK_SPLIT', 'TICKER_CHANGE'].includes(activity.type);
              
              return (
                <div 
                  key={activity.id}
                  onClick={() => setSelectedActivity(activity)}
                  className="relative group cursor-pointer bg-[#08080c] border border-white/10 hover:border-indigo-500/30 rounded-xl p-4 shadow-md transition-all active:scale-[0.99] max-w-3xl"
                >
                  {/* Outer circle marker on timeline */}
                  <div className="absolute -left-[27px] md:-left-[35px] top-4.5 w-3.5 h-3.5 rounded-full bg-[#050505] border border-white/20 flex items-center justify-center group-hover:border-indigo-400 transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isNeutral ? 'bg-indigo-400' : isOutbound ? 'bg-rose-400' : 'bg-emerald-400'
                    }`} />
                  </div>

                  {/* Body Content Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Left: Time and Title */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] text-neutral-200 font-mono tracking-tight font-semibold">
                          {activity.timestamp}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[7.5px] font-extrabold uppercase tracking-widest ${
                          activity.status === 'Completed' ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' :
                          activity.status === 'Pending' ? 'bg-amber-500/5 text-amber-400 border border-amber-500/10 animate-pulse' :
                          activity.status === 'Processing' ? 'bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 animate-pulse' :
                          activity.status === 'Cancelled' ? 'bg-white/5 text-neutral-400' :
                          'bg-rose-500/5 text-rose-400 border border-rose-500/10'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white group-hover:text-indigo-300 transition-colors">
                        {activity.eventName}
                      </h4>
                      <p className="text-[10px] text-neutral-200">
                        Payment system rail: <strong className="text-white font-semibold">{activity.methodOrDetail}</strong> • Ref: <span className="font-mono text-indigo-300">{activity.refId}</span>
                      </p>
                    </div>

                    {/* Right: Amount or Value block */}
                    <div className="sm:text-right shrink-0 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0 flex sm:flex-col justify-between sm:justify-center">
                      <span className="text-[8.5px] text-neutral-200 uppercase tracking-widest block sm:mb-0.5">Clearing Value</span>
                      <span className={`text-[12px] font-black font-mono ${
                        isNeutral ? 'text-neutral-200' : isOutbound ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {isNeutral ? 'N/A' : isOutbound ? `-${activity.amount}` : `+${activity.amount}`}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ──────────────────── TRANSACTION DETAILS DRAWER (SIDE MODAL) ──────────────────── */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex justify-end">
          
          {/* Backdrop click closer */}
          <div 
            onClick={() => setSelectedActivity(null)}
            className="absolute inset-0 cursor-pointer"
          />

          {/* Side Sheet Panel */}
          <div className="relative bg-[#09090d] border-l border-white/10 w-full max-w-md h-full shadow-2xl flex flex-col z-10 animate-slideLeft">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 bg-[#0e0e12] flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-[8px] font-black tracking-widest text-indigo-400">
                  REGISTRY METADATA
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mt-1.5">
                  Permanent Ledger Record
                </h3>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-200 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-left text-[11px] leading-relaxed no-scrollbar">
              
              {/* SECTION 1: Event Summary */}
              <div className="bg-[#040405] p-4 rounded-xl border border-white/5 text-center space-y-1.5">
                <span className="text-[8.5px] text-neutral-200 uppercase tracking-widest block font-semibold">Event Description</span>
                <h4 className="text-sm font-black text-white">{selectedActivity.eventName}</h4>
                <div className="flex justify-center gap-2 pt-1">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide leading-none ${
                    selectedActivity.status === 'Completed' ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' :
                    selectedActivity.status === 'Pending' ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400 animate-pulse' :
                    selectedActivity.status === 'Processing' ? 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 animate-pulse' :
                    selectedActivity.status === 'Cancelled' ? 'bg-white/5 border border-white/10 text-neutral-200' :
                    'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                  }`}>
                    {selectedActivity.status}
                  </span>
                </div>
              </div>

              {/* SECTION 2: Settlement Timeline Operations (Audit Trail) */}
              <div className="space-y-3.5">
                <span className="text-[9.5px] text-neutral-200 uppercase tracking-widest font-black block border-b border-white/5 pb-2">
                  Chronological Audit Trail
                </span>
                
                <div className="relative pl-5 space-y-4">
                  {/* timeline line */}
                  <div className="absolute top-1 bottom-1 left-1.5 w-[1px] bg-white/10" />

                  {selectedActivity.timeline.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* marker dot */}
                      <div className="absolute -left-[18.5px] top-1 w-2 h-2 rounded-full bg-[#09090d] border border-indigo-400" />
                      <div className="flex justify-between items-center text-[9.5px]">
                        <span className="font-bold text-white">{step.label}</span>
                        <span className="text-neutral-200 font-mono">{step.timestamp}</span>
                      </div>
                      <p className="text-[9px] text-neutral-200 mt-0.5 leading-normal">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: Transaction Details Grid */}
              <div className="space-y-3">
                <span className="text-[9.5px] text-neutral-200 uppercase tracking-widest font-black block border-b border-white/5 pb-2">
                  Asset Parameters
                </span>
                
                <div className="grid grid-cols-2 gap-4 bg-[#040405] p-3.5 rounded-xl border border-white/5">
                  <div>
                    <span className="text-neutral-200 text-[8px] uppercase tracking-wider block">Target Asset / Currency</span>
                    <span className="text-white font-bold block mt-0.5">{selectedActivity.asset}</span>
                  </div>
                  <div>
                    <span className="text-neutral-200 text-[8px] uppercase tracking-wider block">Quantity / Volume</span>
                    <span className="text-white font-bold block mt-0.5">{selectedActivity.quantity || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-200 text-[8px] uppercase tracking-wider block">Reference Spot Price</span>
                    <span className="text-white font-bold block mt-0.5">{selectedActivity.price || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-200 text-[8px] uppercase tracking-wider block">Execution Gross Value</span>
                    <span className={`font-black block mt-0.5 ${
                      selectedActivity.type === 'WITHDRAWAL' || selectedActivity.type === 'SELL' 
                        ? 'text-rose-400' 
                        : ['LOGIN', 'PASSWORD_CHANGE', 'VERIFICATION', 'PAYMENT_ADDED', 'DELAYED', 'MAINTENANCE', 'HALT', 'REBALANCING', 'STOCK_SPLIT', 'TICKER_CHANGE'].includes(selectedActivity.type)
                          ? 'text-neutral-200' 
                          : 'text-emerald-400'
                    }`}>
                      {selectedActivity.amount}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Metadata Parameters */}
              <div className="space-y-3.5">
                <span className="text-[9.5px] text-neutral-200 uppercase tracking-widest font-black block border-b border-white/5 pb-2">
                  Permanent Cryptographic Identifiers
                </span>

                <div className="space-y-2 bg-[#040405] p-3.5 rounded-xl border border-white/5 font-mono text-[9px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-200">REFERENCE IDENTIFIER:</span>
                    <span className="text-white font-semibold">{selectedActivity.refId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-200">CUSTODIAL GATEWAY:</span>
                    <span className="text-white font-semibold">{selectedActivity.network || 'Internal Pool Core'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-200">SETTLEMENT CLEAR RAIL:</span>
                    <span className="text-white font-semibold">{selectedActivity.settlementRail || 'MTX Liquidity Swap'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-200">CLEARING DESK FEES:</span>
                    <span className="text-indigo-400 font-bold">{selectedActivity.fees || '0.00%'}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/5 mt-1.5">
                    <span className="text-neutral-200">LEDGER STATE BLOCK:</span>
                    <span className="text-emerald-400 font-bold">CERTIFIED AMENDABLE</span>
                  </div>
                </div>
              </div>

              {/* Help & Safeguard Banner */}
              <div className="p-3 bg-indigo-950/10 border border-indigo-500/10 rounded-lg text-[9px] text-indigo-300">
                <div className="flex gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <p className="leading-relaxed text-neutral-200">
                    This transaction represents an immutable ledger entry registered on the MTX clearing protocol under sovereign clearing authority.
                  </p>
                </div>
              </div>

            </div>

            {/* Footer Closer CTA */}
            <div className="p-4 bg-[#0e0e12] border-t border-white/5 flex items-center justify-end gap-3.5">
              <button
                onClick={() => setSelectedActivity(null)}
                className="w-full px-4 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/35 rounded-lg text-[10px] font-black uppercase tracking-wider text-indigo-300 hover:text-white transition-all cursor-pointer text-center"
              >
                Close Audit Record
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
