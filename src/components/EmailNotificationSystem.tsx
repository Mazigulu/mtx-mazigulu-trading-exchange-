import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Eye, 
  Code, 
  Send, 
  Terminal, 
  Inbox, 
  Copy, 
  Check, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  Sliders, 
  ChevronRight, 
  Clock, 
  Trash2,
  Info
} from 'lucide-react';

interface EmailNotificationSystemProps {
  traderEmail: string;
}

interface EmailItem {
  id: string;
  subject: string;
  type: 'welcome_signup' | 'kyc_status' | 'api_key_created' | 'capital_settlement' | 'order_fill' | 'margin_alert' | 'capital_outflow' | 'security_clearance' | 'passkey_updated' | 'account_deletion';
  timestamp: string;
  sender: string;
  htmlContent: string;
  isUnread: boolean;
  variables: Record<string, string>;
}

export default function EmailNotificationSystem({ traderEmail }: EmailNotificationSystemProps) {
  // 1. Template Definitions & Initial Variable Sets
  const [activeTemplateType, setActiveTemplateType] = useState<EmailItem['type']>('welcome_signup');
  const [activeTab, setActiveTab] = useState<'preview' | 'html_code'>('preview');
  
  // Variables states mapped by template type
  const [welcomeVariables, setWelcomeVariables] = useState({
    traderName: 'Mazi Guluj',
    activationCode: 'MTX-8492-QL',
    inviteMethod: 'Direct Institutional Invitation',
    temporaryPasscode: '********',
    supportDesk: 'vip-desk@mtxquant.com',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  });

  const [orderVariables, setOrderVariables] = useState({
    id: 'TXN-95038-MTX',
    symbol: 'NAS100',
    action: 'BUY / LONG',
    price: '19,850.25',
    qty: '15.00',
    value: '297,753.75',
    commission: '8.50',
    route: 'MTX Liquid Core (XNAS)',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  });

  const [marginVariables, setMarginVariables] = useState({
    accountId: 'ACT-4921-KE',
    leverage: '50:1',
    marginRatio: '108.4%',
    requiredMargin: '250,000.00',
    freeEquity: '12,450.00',
    liquidationRisk: 'CRITICAL / IMMEDIATE',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  });

  const [kycVariables, setKycVariables] = useState({
    traderName: 'Mazi Guluj',
    clearanceLevel: 'Level 3 (Premium Institutional)',
    filingId: 'SEC-KYC-990-281a',
    limit: '50,000,000.00',
    taxResidency: 'Kenya (W-8BEN Certified)',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  });

  const [apiKeyVariables, setApiKeyVariables] = useState({
    keyName: 'Production Trade Bot Alpha',
    clientId: 'cli_990184f9b2',
    keySuffix: '...9H4j8f9a',
    scopePermissions: 'Read-Write (Positions & Orders only)',
    whitelistedIps: '197.234.18.91, 104.24.12.5',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  });

  const [securityVariables, setSecurityVariables] = useState({
    ipAddress: '197.234.18.91',
    location: 'Nairobi, Kenya',
    device: 'Linux x86_64 / Chrome 126.0.0',
    authMethod: 'FIDO2 WebAuthn (YubiKey 5C)',
    countryCode: 'KE',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  });

  const [fundingVariables, setFundingVariables] = useState({
    depositRef: 'DEP-9938210',
    channel: 'FedWire Automated Clearing',
    grossCredit: '1,250,000.00',
    fee: '0.00 (Tier-1 Waived)',
    netCredit: '1,250,000.00',
    settledBalance: '4,198,321.42',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  });

  const [outflowVariables, setOutflowVariables] = useState({
    withdrawalRef: 'WTH-1092837',
    destinationBank: 'Standard Chartered London (IBAN Ending 4910)',
    grossDebit: '450,000.00',
    fee: '45.00 (Standard Wire Fee)',
    netDebit: '449,955.00',
    settledBalance: '3,748,366.42',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  });

  const [passkeyVariables, setPasskeyVariables] = useState({
    credentialId: 'cred-9f201-fido2',
    actionType: 'REGISTERED / ADDED',
    authenticatorName: 'Google Chrome WebAuthn (MacBook TouchID)',
    status: 'ACTIVE / WHITELISTED',
    ipAddress: '197.234.18.91',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  });

  const [deletionVariables, setDeletionVariables] = useState({
    reasonCode: 'Institutional Downsizing',
    retentionDays: '30 Days (Regulatory Mandated)',
    complianceId: 'SEC-TERM-9912a',
    refundDestination: 'Cleared to Origin FedWire',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  });

  // Get variables for currently active template
  const getActiveVariables = () => {
    switch (activeTemplateType) {
      case 'welcome_signup': return welcomeVariables;
      case 'kyc_status': return kycVariables;
      case 'api_key_created': return apiKeyVariables;
      case 'capital_settlement': return fundingVariables;
      case 'order_fill': return orderVariables;
      case 'margin_alert': return marginVariables;
      case 'capital_outflow': return outflowVariables;
      case 'security_clearance': return securityVariables;
      case 'passkey_updated': return passkeyVariables;
      case 'account_deletion': return deletionVariables;
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    switch (activeTemplateType) {
      case 'welcome_signup':
        setWelcomeVariables(prev => ({ ...prev, [key]: value }));
        break;
      case 'kyc_status':
        setKycVariables(prev => ({ ...prev, [key]: value }));
        break;
      case 'api_key_created':
        setApiKeyVariables(prev => ({ ...prev, [key]: value }));
        break;
      case 'capital_settlement':
        setFundingVariables(prev => ({ ...prev, [key]: value }));
        break;
      case 'order_fill':
        setOrderVariables(prev => ({ ...prev, [key]: value }));
        break;
      case 'margin_alert':
        setMarginVariables(prev => ({ ...prev, [key]: value }));
        break;
      case 'capital_outflow':
        setOutflowVariables(prev => ({ ...prev, [key]: value }));
        break;
      case 'security_clearance':
        setSecurityVariables(prev => ({ ...prev, [key]: value }));
        break;
      case 'passkey_updated':
        setPasskeyVariables(prev => ({ ...prev, [key]: value }));
        break;
      case 'account_deletion':
        setDeletionVariables(prev => ({ ...prev, [key]: value }));
        break;
    }
  };

  // Helper to generate custom subject line dynamically
  const getSubjectLine = (type: EmailItem['type'], vars: any) => {
    switch (type) {
      case 'welcome_signup':
        return `[WELCOME] Welcome to MTXquant: Institutional Account Activation Required`;
      case 'kyc_status':
        return `[COMPLIANCE] Regulatory Status Updated: Approved SEC Level 3 for ${vars.traderName}`;
      case 'api_key_created':
        return `[DEVELOPER] New API Access Key Generated: "${vars.keyName}"`;
      case 'capital_settlement':
        return `[CREDIT] Direct Wire Settlement Receipt: +$${vars.netCredit} USD Cleared`;
      case 'order_fill':
        return `[CONFIRMATION] MTXquant Trade Execution Advice: ${vars.action} ${vars.qty} ${vars.symbol}`;
      case 'margin_alert':
        return `[ALERT] URGENT: Critical Margin Coverage Deficiency on ${vars.accountId} (${vars.marginRatio})`;
      case 'capital_outflow':
        return `[DEBIT] Direct Wire Withdrawal Receipt: -$${vars.netDebit} USD Cleared`;
      case 'security_clearance':
        return `[SECURITY] Critical Security Dispatch: Unrecognized Login from ${vars.ipAddress}`;
      case 'passkey_updated':
        return `[SECURITY] Hardware Passkey Record Modified: ${vars.actionType}`;
      case 'account_deletion':
        return `[COMPLIANCE] Account Deletion & Termination Clearance: ID ${vars.complianceId}`;
    }
  };

  // 2. Email HTML Code Templates Builder (Inline CSS, high-fidelity responsive layout)
  const buildEmailHTML = (type: EmailItem['type'], vars: any): string => {
    const brandColor = '#00e5ff'; // MTX Neon Cyan
    const darkBg = '#0b0c10';     // Immersive email dark canvas
    const innerBg = '#141722';    // High contrast container
    const borderCol = '#1f2937';  // Muted steel lines
    const textCol = '#f3f4f6';    // Bright readable text
    const textMuted = '#9ca3af';  // Muted gray labels

    let emailContentHeader = '';
    let emailContentBody = '';
    let accentBarColor = brandColor;

    if (type === 'welcome_signup') {
      accentBarColor = '#6366f1'; // Indigo for welcome
      emailContentHeader = `
        <div style="background-color: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 4px; padding: 16px; margin-bottom: 24px; text-align: left;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #6366f1; text-transform: uppercase; letter-spacing: 1px;">Sovereign Clearance</span>
          <h2 style="margin: 6px 0 0 0; font-size: 16px; font-weight: bold; color: #ffffff;">INSTITUTIONAL ACCOUNT PROVISIONED</h2>
        </div>
      `;
      emailContentBody = `
        <p style="margin-top: 0; line-height: 1.6; color: ${textCol};">Dear ${vars.traderName},</p>
        <p style="line-height: 1.6; color: ${textCol};">Welcome to MTXquant. An institutional-grade, highly specialized systematic trading allocation account has been successfully provisioned for your entity under modern regulatory compliance charters.</p>
        <p style="line-height: 1.6; color: ${textCol};">Please complete your secure terminal onboarding sequence to finalize authentication whitelisting and activate programmatic trading gateways.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Primary Account Holder</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.traderName}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Invitation Method</td>
            <td style="padding: 10px 0; font-weight: bold; color: #6366f1; text-align: right;">${vars.inviteMethod}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Activation Reference</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.activationCode}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Onboarding Passcode</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ea580c; text-align: right;">${vars.temporaryPasscode}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Dedicated Support Desk</td>
            <td style="padding: 10px 0; color: #00e5ff; text-align: right;">${vars.supportDesk}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Provisioned Time</td>
            <td style="padding: 10px 0; color: ${textMuted}; text-align: right;">${vars.timestamp}</td>
          </tr>
        </table>
        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="#" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block; letter-spacing: 0.5px; text-transform: uppercase;">Complete Onboarding Flow</a>
        </div>
      `;
    } else if (type === 'kyc_status') {
      accentBarColor = '#6366f1'; // Indigo for KYC status
      emailContentHeader = `
        <div style="background-color: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 4px; padding: 16px; margin-bottom: 24px; text-align: left;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #6366f1; text-transform: uppercase; letter-spacing: 1px;">Compliance Certified</span>
          <h2 style="margin: 6px 0 0 0; font-size: 16px; font-weight: bold; color: #ffffff;">REGULATORY VERIFICATION COMPLETED</h2>
        </div>
      `;
      emailContentBody = `
        <p style="margin-top: 0; line-height: 1.6; color: ${textCol};">Dear ${vars.traderName},</p>
        <p style="line-height: 1.6; color: ${textCol};">We are pleased to inform you that our Institutional Audits and Compliance department has completed its verification review of your updated corporate identification and global tax filing status.</p>
        <p style="line-height: 1.6; color: ${textCol};">Your master trader profile has been upgraded to the highest regulatory tier, unlocking unlimited capital flow capabilities and premium systematic routing channels.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Trader Account Name</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.traderName}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Compliance Clearance Tier</td>
            <td style="padding: 10px 0; font-weight: bold; color: #6366f1; text-align: right;">${vars.clearanceLevel}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">SEC Audit Filing ID</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.filingId}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Tax Residency / Treaty Status</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.taxResidency}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Single-Order Exposure Limit</td>
            <td style="padding: 10px 0; font-weight: bold; color: #10b981; text-align: right;">$${vars.limit} USD</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Verification Timestamp</td>
            <td style="padding: 10px 0; color: ${textMuted}; text-align: right;">${vars.timestamp}</td>
          </tr>
        </table>
        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="#" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block; letter-spacing: 0.5px; text-transform: uppercase;">Download Compliance Certificate</a>
        </div>
      `;
    } else if (type === 'api_key_created') {
      accentBarColor = '#00e5ff'; // Cyan for API key
      emailContentHeader = `
        <div style="background-color: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 4px; padding: 16px; margin-bottom: 24px; text-align: left;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #00e5ff; text-transform: uppercase; letter-spacing: 1px;">Programmatic Access</span>
          <h2 style="margin: 6px 0 0 0; font-size: 16px; font-weight: bold; color: #ffffff;">NEW API ACCESS CREDENTIAL GENERATED</h2>
        </div>
      `;
      emailContentBody = `
        <p style="margin-top: 0; line-height: 1.6; color: ${textCol};"><strong>DEVELOPER WATCHDOG SUMMARY:</strong> A brand new high-performance cryptographic API access token was successfully compiled and linked to your MTXquant algorithmic trading container.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Key Identifier Label</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.keyName}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Client ID Mapping</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.clientId}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Key Suffix Signature</td>
            <td style="padding: 10px 0; font-weight: bold; color: #00e5ff; text-align: right;">${vars.keySuffix}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Gateways & Scopes</td>
            <td style="padding: 10px 0; color: #ffffff; font-size: 11px; text-align: right;">${vars.scopePermissions}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">IP Firewall Whitelist</td>
            <td style="padding: 10px 0; font-weight: bold; color: #10b981; text-align: right; font-size: 10px;">${vars.whitelistedIps}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Generation Time</td>
            <td style="padding: 10px 0; color: ${textMuted}; text-align: right;">${vars.timestamp}</td>
          </tr>
        </table>

        <div style="background-color: #0c121e; border-left: 3px solid #00e5ff; padding: 12px; margin: 20px 0; font-size: 11px; color: #e0f2fe; line-height: 1.5;">
          <strong>SECURITY WARNING:</strong> Ensure that your private keys are stored within secure hardware environments. MTXquant compliance never stores raw private keys; they cannot be retrieved if misplaced.
        </div>

        <div style="text-align: center; margin: 24px 0 10px 0;">
          <a href="#" style="background-color: #00e5ff; color: #090d16; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block; letter-spacing: 0.5px; text-transform: uppercase;">Revoke / Manage API Keys</a>
        </div>
      `;
    } else if (type === 'capital_settlement') {
      accentBarColor = '#10b981'; // Green for capital settlement
      emailContentHeader = `
        <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 4px; padding: 16px; margin-bottom: 24px; text-align: left;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #10b981; text-transform: uppercase; letter-spacing: 1px;">Settlement Cleared</span>
          <h2 style="margin: 6px 0 0 0; font-size: 16px; font-weight: bold; color: #ffffff;">DIRECT CAPITAL WIRE CREDIT CONFIRMATION</h2>
        </div>
      `;
      emailContentBody = `
        <p style="margin-top: 0; line-height: 1.6; color: ${textCol};">We are pleased to advise you that a direct capital funding settlement has successfully cleared into your MTXquant prime custody brokerage allocation.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Deposit Registry ID</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.depositRef}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Settlement Channel</td>
            <td style="padding: 10px 0; font-weight: bold; color: #00e5ff; text-align: right;">${vars.channel}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Gross Credit Inflow</td>
            <td style="padding: 10px 0; font-weight: bold; color: #10b981; font-size: 14px; text-align: right;">+$${vars.grossCredit} USD</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Clearing & Routing Fee</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.fee}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Net Settled Ledger Credit</td>
            <td style="padding: 10px 0; font-weight: bold; color: #10b981; text-align: right;">+$${vars.netCredit} USD</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Current Settled Cash Balance</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">$${vars.settledBalance} USD</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Settlement Finality Time</td>
            <td style="padding: 10px 0; color: ${textMuted}; text-align: right;">${vars.timestamp}</td>
          </tr>
        </table>
        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="#" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block; letter-spacing: 0.5px; text-transform: uppercase;">Download Wire PDF Receipt</a>
        </div>
      `;
    } else if (type === 'order_fill') {
      accentBarColor = '#10b981'; // Green for fills
      emailContentHeader = `
        <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 4px; padding: 16px; margin-bottom: 24px; text-align: left;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #10b981; text-transform: uppercase; letter-spacing: 1px;">Execution Cleared</span>
          <h2 style="margin: 6px 0 0 0; font-size: 16px; font-weight: bold; color: #ffffff;">TRADE ORDER FILLED SUCCESSFULLY</h2>
        </div>
      `;
      emailContentBody = `
        <p style="margin-top: 0; line-height: 1.6; color: ${textCol};">We are pleased to advise you of the execution details for the transaction requested on your MTXquant institutional account.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Transaction ID</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.id}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Instrument Symbol</td>
            <td style="padding: 10px 0; font-weight: bold; color: #00e5ff; text-align: right;">${vars.symbol}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Direction</td>
            <td style="padding: 10px 0; font-weight: bold; color: ${vars.action.includes('BUY') ? '#10b981' : '#f43f5e'}; text-align: right;">${vars.action}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Average Price</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">$${vars.price} USD</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Executed Quantity</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.qty} Units</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Total Principal Value</td>
            <td style="padding: 10px 0; font-weight: bold; color: #10b981; text-align: right;">$${vars.value} USD</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Clearing Commission</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">$${vars.commission} USD</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Execution Venue</td>
            <td style="padding: 10px 0; color: #ffffff; text-align: right;">${vars.route}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Fulfillment Time</td>
            <td style="padding: 10px 0; color: ${textMuted}; text-align: right;">${vars.timestamp}</td>
          </tr>
        </table>
        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="#" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block; letter-spacing: 0.5px; text-transform: uppercase;">View Terminal Portfolio</a>
        </div>
      `;
    } else if (type === 'margin_alert') {
      accentBarColor = '#f43f5e'; // Red for margin alerts
      emailContentHeader = `
        <div style="background-color: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); border-radius: 4px; padding: 16px; margin-bottom: 24px; text-align: left;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #f43f5e; text-transform: uppercase; letter-spacing: 1px;">Urgent Risk Clearance Warning</span>
          <h2 style="margin: 6px 0 0 0; font-size: 16px; font-weight: bold; color: #ffffff;">CRITICAL COLLATERAL MARGIN ALERT</h2>
        </div>
      `;
      emailContentBody = `
        <p style="margin-top: 0; line-height: 1.6; color: ${textCol};"><strong>URGENT REGULATORY ADVICE:</strong> Your institutional sub-account margin coverage ratio has dropped below the minimum required compliance limit of <strong>120.00%</strong>.</p>
        
        <div style="background-color: #1a0f12; border-left: 3px solid #f43f5e; padding: 12px; margin: 18px 0; font-size: 11px; color: #fecdd3; line-height: 1.5;">
          <strong>ATTENTION:</strong> Failure to deposit additional collateral or downscale high-exposure leveraged holdings within 15 minutes of this automated dispatch may trigger systemic liquidations of open derivatives positions.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Sub-Account ID</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.accountId}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">System Leverage Ratio</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.leverage}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Current Margin Ratio</td>
            <td style="padding: 10px 0; font-weight: bold; color: #f43f5e; font-size: 13px; text-align: right;">${vars.marginRatio}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Required Maintenance Margin</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">$${vars.requiredMargin} USD</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Available Free Equity</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">$${vars.freeEquity} USD</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Assessed Liquidation Risk</td>
            <td style="padding: 10px 0; font-weight: bold; color: #f43f5e; text-align: right; text-transform: uppercase;">${vars.liquidationRisk}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Evaluation Time</td>
            <td style="padding: 10px 0; color: ${textMuted}; text-align: right;">${vars.timestamp}</td>
          </tr>
        </table>
        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="#" style="background-color: #f43f5e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block; letter-spacing: 0.5px; text-transform: uppercase;">Inject Wallet Collateral</a>
        </div>
      `;
    } else if (type === 'capital_outflow') {
      accentBarColor = '#ea580c'; // Orange-red for withdrawals
      emailContentHeader = `
        <div style="background-color: rgba(234, 88, 12, 0.1); border: 1px solid rgba(234, 88, 12, 0.2); border-radius: 4px; padding: 16px; margin-bottom: 24px; text-align: left;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #ea580c; text-transform: uppercase; letter-spacing: 1px;">Outflow Dispatched</span>
          <h2 style="margin: 6px 0 0 0; font-size: 16px; font-weight: bold; color: #ffffff;">DIRECT CAPITAL OUTFLOW WIRE CLEARANCE</h2>
        </div>
      `;
      emailContentBody = `
        <p style="margin-top: 0; line-height: 1.6; color: ${textCol};">We are writing to confirm that an authorized capital withdrawal settlement has cleared through MTXquant custody channels and has been securely dispatched to your designated institution destination.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Withdrawal Reference</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.withdrawalRef}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Recipient Banking Node</td>
            <td style="padding: 10px 0; font-weight: bold; color: #00e5ff; text-align: right; font-size: 11px;">${vars.destinationBank}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Gross Debit Request</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ea580c; font-size: 14px; text-align: right;">-$${vars.grossDebit} USD</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Disbursal & Clearing Fee</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.fee}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Net Dispatched Wire</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ea580c; text-align: right;">-$${vars.netDebit} USD</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Remaining Settled Cash Balance</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">$${vars.settledBalance} USD</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Settlement Finality Time</td>
            <td style="padding: 10px 0; color: ${textMuted}; text-align: right;">${vars.timestamp}</td>
          </tr>
        </table>
        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="#" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block; letter-spacing: 0.5px; text-transform: uppercase;">Audit Transfer Ledger</a>
        </div>
      `;
    } else if (type === 'security_clearance') {
      accentBarColor = '#ea580c'; // Orange for security alerts
      emailContentHeader = `
        <div style="background-color: rgba(234, 88, 12, 0.1); border: 1px solid rgba(234, 88, 12, 0.2); border-radius: 4px; padding: 16px; margin-bottom: 24px; text-align: left;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #ea580c; text-transform: uppercase; letter-spacing: 1px;">Security Watchdog Audit</span>
          <h2 style="margin: 6px 0 0 0; font-size: 16px; font-weight: bold; color: #ffffff;">UNRECOGNIZED DEVICE AUTHORIZATION DISPATCH</h2>
        </div>
      `;
      emailContentBody = `
        <p style="margin-top: 0; line-height: 1.6; color: ${textCol};"><strong>ALERT:</strong> A terminal access session was successfully authorized for your trader account using a device or geolocation node not previously registered in your hardware whitelist.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Inbound IP Address</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ea580c; text-align: right;">${vars.ipAddress}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Assessed Geolocation</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.location}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Device Client Agent</td>
            <td style="padding: 10px 0; color: #ffffff; font-size: 11px; text-align: right; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${vars.device}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Security Bypass Method</td>
            <td style="padding: 10px 0; font-weight: bold; color: #10b981; text-align: right;">${vars.authMethod}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">ISO Country Tag</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.countryCode}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Access Timestamp</td>
            <td style="padding: 10px 0; color: ${textMuted}; text-align: right;">${vars.timestamp}</td>
          </tr>
        </table>

        <div style="background-color: #1a120d; border-left: 3px solid #ea580c; padding: 12px; margin: 20px 0; font-size: 11px; color: #ffedd5; line-height: 1.5;">
          <strong>CRITICAL SAFETY INTERVENTION:</strong> If you did NOT authorize this terminal connection, your security keys may have been compromised. Click the trigger below to immediately invalidate all sessions and lock capital outflows.
        </div>

        <div style="text-align: center; margin: 24px 0 10px 0;">
          <a href="#" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block; letter-spacing: 0.5px; text-transform: uppercase;">Immediate Account Lockout</a>
        </div>
      `;
    } else if (type === 'passkey_updated') {
      accentBarColor = '#a855f7'; // Purple for passkeys
      emailContentHeader = `
        <div style="background-color: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 4px; padding: 16px; margin-bottom: 24px; text-align: left;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #a855f7; text-transform: uppercase; letter-spacing: 1px;">Auth Ledger Update</span>
          <h2 style="margin: 6px 0 0 0; font-size: 16px; font-weight: bold; color: #ffffff;">HARDWARE SECURITY PASSKEY MODIFIED</h2>
        </div>
      `;
      emailContentBody = `
        <p style="margin-top: 0; line-height: 1.6; color: ${textCol};">We are writing to advise you that a FIDO2 WebAuthn cryptographic hardware security key has been successfully modified on your MTXquant master trader account.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Hardware Key Credential ID</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right; font-size: 11px;">${vars.credentialId}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Action Event Type</td>
            <td style="padding: 10px 0; font-weight: bold; color: #a855f7; text-align: right;">${vars.actionType}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Authenticator Device Name</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right; font-size: 10px;">${vars.authenticatorName}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Operational Clearance Status</td>
            <td style="padding: 10px 0; font-weight: bold; color: #10b981; text-align: right;">${vars.status}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Request IP Address</td>
            <td style="padding: 10px 0; color: #ffffff; text-align: right;">${vars.ipAddress}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Modification Time</td>
            <td style="padding: 10px 0; color: ${textMuted}; text-align: right;">${vars.timestamp}</td>
          </tr>
        </table>
        
        <div style="background-color: #160e1d; border-left: 3px solid #a855f7; padding: 12px; margin: 20px 0; font-size: 11px; color: #f3e8ff; line-height: 1.5;">
          <strong>VERIFICATION DISPATCH:</strong> If you did not initiate this change, malicious actors may have gained access to your active terminal interface. Click below to lock down your credentials immediately.
        </div>

        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="#" style="background-color: #a855f7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block; letter-spacing: 0.5px; text-transform: uppercase;">Review Authenticator Devices</a>
        </div>
      `;
    } else if (type === 'account_deletion') {
      accentBarColor = '#ef4444'; // Red for account deletion
      emailContentHeader = `
        <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 4px; padding: 16px; margin-bottom: 24px; text-align: left;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #ef4444; text-transform: uppercase; letter-spacing: 1px;">Account Termination Notice</span>
          <h2 style="margin: 6px 0 0 0; font-size: 16px; font-weight: bold; color: #ffffff;">INSTITUTIONAL DELETION REQUEST APPROVED</h2>
        </div>
      `;
      emailContentBody = `
        <p style="margin-top: 0; line-height: 1.6; color: ${textCol};"><strong>COMPLIANCE DESK RECORD PURGE ADVICE:</strong> We are writing to formally confirm that your institutional account deletion and trading portal termination request has been approved and processed.</p>
        
        <div style="background-color: #1c0a0a; border-left: 3px solid #ef4444; padding: 12px; margin: 20px 0; font-size: 11px; color: #fee2e2; line-height: 1.5;">
          <strong>REGULATORY RETENTION COMPLIANCE:</strong> Per SEC, MiFID II, and global banking data retention regulations, certain transactional audits, PDF ledge reports, and compliance logs will remain archived under strict cryptographic lock for the mandated retention window before complete server deletion.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Termination Audit ID</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right;">${vars.complianceId}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Formal Termination Reason</td>
            <td style="padding: 10px 0; font-weight: bold; color: #ffffff; text-align: right; font-size: 11px;">${vars.reasonCode}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Regulatory Retention Period</td>
            <td style="padding: 10px 0; font-weight: bold; color: #f43f5e; text-align: right;">${vars.retentionDays}</td>
          </tr>
          <tr style="border-bottom: 1px solid ${borderCol};">
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Refund Disbursements</td>
            <td style="padding: 10px 0; font-weight: bold; color: #10b981; text-align: right; font-size: 11px;">${vars.refundDestination}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: ${textMuted}; text-transform: uppercase;">Approval Finality Time</td>
            <td style="padding: 10px 0; color: ${textMuted}; text-align: right;">${vars.timestamp}</td>
          </tr>
        </table>
        
        <p style="line-height: 1.6; color: ${textCol};">Should you wish to establish a new systemic trading relationship with MTXquant in the future, please reach out to our institutional onboarding division.</p>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
            body {
              margin: 0;
              padding: 0;
              background-color: ${darkBg};
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              color: ${textCol};
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            img {
              border: 0;
              outline: none;
              text-decoration: none;
            }
          </style>
        </head>
        <body style="margin: 0; padding: 24px 0; background-color: ${darkBg}; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: ${innerBg}; border: 1px solid ${borderCol}; border-radius: 8px; overflow: hidden; border-top: 4px solid ${accentBarColor}; border-collapse: collapse;">
            
            <!-- MTXquant Header Banner -->
            <tr>
              <td style="padding: 20px 32px; border-bottom: 1px solid ${borderCol}; text-align: left; background: linear-gradient(135deg, #0f1016 0%, #050608 100%);">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td>
                      <!-- Institutional Wordmark Logo -->
                      <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        <tr>
                          <td style="vertical-align: middle;">
                            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 19px; font-weight: 900; letter-spacing: -0.8px; color: #ffffff; text-transform: lowercase; line-height: 1; display: inline-block;">
                              mtxquant
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 8.5px; color: ${textMuted}; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; vertical-align: middle;">
                      SECURE TERMINAL BROADCAST
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Main Interactive Content Container -->
            <tr>
              <td style="padding: 32px; text-align: left; background-color: ${innerBg};">
                ${emailContentHeader}
                ${emailContentBody}
              </td>
            </tr>

            <!-- Signature block / Verification footer -->
            <tr>
              <td style="padding: 24px 32px; border-top: 1px solid ${borderCol}; background-color: #0d0f17; font-family: 'JetBrains Mono', monospace; font-size: 8.5px; color: ${textMuted}; line-height: 1.6;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding-bottom: 12px; font-weight: bold; text-transform: uppercase; color: #ffffff; letter-spacing: 0.5px;">
                      Cryptographic Dispatch Security Manifest
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 6px;">
                      SHA256 SIGNATURE: <span style="color: #00e5ff; font-weight: bold;">0x9df1bc10ef2a297fc9a5b3a39ea49d01f8dcb1a4096d297afcb3e8b105a</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 14px;">
                      ENCRYPTION PROTOCOL: RSA-4096-PSS / TLS 1.3 COMPLIANT • SYSTEM_ID: MTX_RUN_V2
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top: 1px solid ${borderCol}; padding-top: 12px; font-family: 'Inter', sans-serif; font-size: 8px; color: rgba(156, 163, 175, 0.5); line-height: 1.4;">
                      DISCLAIMER: This document is confidential. It contains proprietary information intended solely for the registered trader client. If you have received this transmission in error, please contact the MTX compliance desk immediately and destroy all physical or virtual copies. MTXquant prime brokerage is regulated under authorized securities frameworks.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  };

  // 3. Simulated Inbox Store with seeds
  const [inboxEmails, setInboxEmails] = useState<EmailItem[]>(() => {
    try {
      const saved = localStorage.getItem('mtx_simulated_inbox');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }

    const initialVars = {
      traderName: 'Mazi Guluj',
      clearanceLevel: 'Level 3 (Premium Institutional)',
      filingId: 'SEC-KYC-990-281a',
      limit: '50,000,000.00',
      taxResidency: 'Kenya (W-8BEN Certified)',
      timestamp: '2026-07-05 11:24:06 UTC'
    };
    
    // Seed inbox with initial compliance approval email
    return [
      {
        id: 'msg_seed_1',
        subject: '[COMPLIANCE] Regulatory Status Updated: Approved SEC Level 3 for Mazi Guluj',
        type: 'kyc_status',
        timestamp: '1 Day ago',
        sender: 'compliance@mtxquant.com',
        htmlContent: '', // dynamically built on request
        isUnread: true,
        variables: initialVars
      }
    ];
  });

  const [selectedInboxEmail, setSelectedInboxEmail] = useState<EmailItem | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('mtx_simulated_inbox', JSON.stringify(inboxEmails));
    } catch (e) {
      console.error(e);
    }
  }, [inboxEmails]);

  // 4. SMTP Live Server Simulator States
  const [isSending, setIsSending] = useState(false);
  const [smtpLog, setSmtpLog] = useState<string[]>([]);
  const [showSmtpTerminal, setShowSmtpTerminal] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll SMTP terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [smtpLog]);

  const triggerSmtpDispatch = async () => {
    if (isSending) return;
    setIsSending(true);
    setShowSmtpTerminal(true);
    setSmtpLog([]);

    const vars = getActiveVariables();
    const currentSubject = getSubjectLine(activeTemplateType, vars);
    const htmlBody = buildEmailHTML(activeTemplateType, vars);

    const logLines = [
      `Connecting to mail.mtxquant.com [197.234.18.91] on port 587...`,
      `S: 220 mail.mtxquant.com ESMTP Postfix (Ubuntu/MTXSecure)`,
      `C: EHLO terminal.mtxquant.local`,
      `S: 250-mail.mtxquant.com, PIPELINING, SIZE 31457280, 8BITMIME, STARTTLS`,
      `C: STARTTLS`,
      `S: 220 2.0.0 Ready to start TLS handshake`,
      `>> Cryptographic TLS v1.3 handshake negotiation established: Cipher=TLS_AES_256_GCM_SHA384`,
      `C: EHLO terminal.mtxquant.local`,
      `S: 250-mail.mtxquant.com, PIPELINING, SIZE 31457280, AUTH PLAIN LOGIN`,
      `C: AUTH PLAIN MTBYX0F1dGg4OTMyOGNjOTEyMmI=`,
      `S: 235 2.7.0 Authentication successful`,
      `C: MAIL FROM: <alerts@mtxquant.com>`,
      `S: 250 2.1.0 Ok`,
      `C: RCPT TO: <${traderEmail}>`,
      `S: 250 2.1.5 Ok - recipient validated`,
      `C: DATA`,
      `S: 354 End data with <CR><LF>.<CR><LF>`,
      `C: From: MTXquant Security Dispatch <alerts@mtxquant.com>`,
      `C: To: Trader <${traderEmail}>`,
      `C: Subject: ${currentSubject}`,
      `C: Content-Type: text/html; charset=UTF-8`,
      `C: [Transmission of ${Math.round(htmlBody.length / 102) / 10} KB responsive HTML packet]`,
      `C: .`,
      `S: 250 2.0.0 Ok: queued as MTX_DISPATCH_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      `C: QUIT`,
      `S: 221 2.0.0 Bye - SMTP Connection closed cleanly`
    ];

    // Stagger SMTP printout
    for (let i = 0; i < logLines.length; i++) {
      await new Promise(resolve => setTimeout(resolve, i === 6 || i === 21 ? 400 : 80));
      setSmtpLog(prev => [...prev, logLines[i]]);
    }

    // Add to simulated inbox
    const newMail: EmailItem = {
      id: `msg_${Date.now()}`,
      subject: currentSubject,
      type: activeTemplateType,
      timestamp: 'Just now',
      sender: 'alerts@mtxquant.com',
      htmlContent: htmlBody,
      isUnread: true,
      variables: { ...vars }
    };

    setInboxEmails(prev => [newMail, ...prev]);
    setIsSending(false);
  };

  const clearSimulatedInbox = () => {
    if (window.confirm("Confirm deletion of all simulated inbox records?")) {
      setInboxEmails([]);
      setSelectedInboxEmail(null);
    }
  };

  // Build the current live HTML
  const currentLiveHtml = buildEmailHTML(activeTemplateType, getActiveVariables());

  // Copy HTML source to clipboard
  const [copiedCode, setCopiedCode] = useState(false);
  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(currentLiveHtml);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      alert("Failed to copy source HTML.");
    }
  };

  // Helper labels for sidebar
  const templatesMetaData = [
    { type: 'welcome_signup', label: 'Welcome & Onboarding', badge: 'Onboarding', color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
    { type: 'kyc_status', label: 'Compliance Audit Update', badge: 'KYC Certified', color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
    { type: 'api_key_created', label: 'Programmatic API Key', badge: 'Developer Access', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' },
    { type: 'capital_settlement', label: 'Capital Wire Settlement', badge: 'Credit Finality', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { type: 'order_fill', label: 'Trade Order Filled', badge: 'Active Execution', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { type: 'margin_alert', label: 'Critical Margin Alert', badge: 'Risk Coverage', color: 'text-rose-400 border-rose-500/20 bg-rose-500/5' },
    { type: 'capital_outflow', label: 'Capital Wire Withdrawal', badge: 'Debit Dispatched', color: 'text-orange-400 border-orange-500/20 bg-orange-500/5' },
    { type: 'security_clearance', label: 'Security Login Audit', badge: 'SecOps Watchdog', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
    { type: 'passkey_updated', label: 'Hardware Passkey Key', badge: 'Credential MFA', color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
    { type: 'account_deletion', label: 'Account Termination', badge: 'Regulatory Purge', color: 'text-rose-500 border-rose-600/20 bg-rose-600/5' }
  ] as const;

  return (
    <div id="email-system-panel" className="w-full text-left font-mono text-[11px] text-white/90 space-y-6">
      
      {/* Overview Block */}
      <div className="bg-[#0b0c14]/50 border border-white/10 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4 animate-pulse text-indigo-400" />
            Institutional Notification Lab & Template Center
          </h3>
          <p className="text-[10px] text-white/40 mt-1 max-w-3xl leading-relaxed">
            Configure dynamic variables, render production-ready transactional HTML email templates built on modular tables and inline styling, and inspect SMTP server handshakes. Simulated emails populate your integrated sandbox inbox dynamically.
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowSmtpTerminal(!showSmtpTerminal)}
            className={`px-3 py-1.5 rounded text-[9.5px] uppercase font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showSmtpTerminal 
                ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-300' 
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            {showSmtpTerminal ? 'Hide SMTP Logs' : 'View SMTP Logs'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Template Selection & Live Variables Configuration (col-span-4) */}
        <div className="xl:col-span-4 space-y-5">
          
          {/* Template Selector Card */}
          <div className="bg-[#08080c]/80 border border-white/10 rounded-lg p-4 space-y-3">
            <span className="text-[8.5px] text-white/30 font-black uppercase tracking-widest block select-none">
              1. Select Email Template
            </span>
            <div className="space-y-1.5">
              {templatesMetaData.map(temp => (
                <button
                  key={temp.type}
                  onClick={() => {
                    setActiveTemplateType(temp.type);
                    setSelectedInboxEmail(null);
                  }}
                  className={`w-full text-left p-2.5 rounded-md border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                    activeTemplateType === temp.type && !selectedInboxEmail
                      ? 'bg-indigo-600/10 border-indigo-500/40 text-white font-bold'
                      : 'bg-transparent border-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.01]'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block font-bold text-[10px] uppercase truncate">{temp.label}</span>
                  </div>
                  <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 border rounded shrink-0 ${temp.color}`}>
                    {temp.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Variables Configuration Form */}
          {!selectedInboxEmail && (
            <div className="bg-[#08080c]/80 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center select-none">
                <span className="text-[8.5px] text-white/30 font-black uppercase tracking-widest block">
                  2. Customize Template Fields
                </span>
                <Sliders className="w-3.5 h-3.5 text-white/20" />
              </div>

              {/* Order Fill Variables */}
              {activeTemplateType === 'order_fill' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Txn ID</label>
                      <input 
                        type="text" 
                        value={orderVariables.id} 
                        onChange={(e) => handleVariableChange('id', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Instrument</label>
                      <input 
                        type="text" 
                        value={orderVariables.symbol} 
                        onChange={(e) => handleVariableChange('symbol', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Direction</label>
                      <select 
                        value={orderVariables.action} 
                        onChange={(e) => handleVariableChange('action', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px] cursor-pointer"
                      >
                        <option value="BUY / LONG">BUY / LONG</option>
                        <option value="SELL / SHORT">SELL / SHORT</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Average Price</label>
                      <input 
                        type="text" 
                        value={orderVariables.price} 
                        onChange={(e) => handleVariableChange('price', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Quantity</label>
                      <input 
                        type="text" 
                        value={orderVariables.qty} 
                        onChange={(e) => handleVariableChange('qty', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Principal Value</label>
                      <input 
                        type="text" 
                        value={orderVariables.value} 
                        onChange={(e) => handleVariableChange('value', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8.5px] text-white/40 uppercase">Execution Venue</label>
                    <input 
                      type="text" 
                      value={orderVariables.route} 
                      onChange={(e) => handleVariableChange('route', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                    />
                  </div>
                </div>
              )}

              {/* Margin Warning Variables */}
              {activeTemplateType === 'margin_alert' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Account ID</label>
                      <input 
                        type="text" 
                        value={marginVariables.accountId} 
                        onChange={(e) => handleVariableChange('accountId', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Leverage</label>
                      <input 
                        type="text" 
                        value={marginVariables.leverage} 
                        onChange={(e) => handleVariableChange('leverage', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Margin Ratio</label>
                      <input 
                        type="text" 
                        value={marginVariables.marginRatio} 
                        onChange={(e) => handleVariableChange('marginRatio', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px] text-rose-400 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Risk Level</label>
                      <input 
                        type="text" 
                        value={marginVariables.liquidationRisk} 
                        onChange={(e) => handleVariableChange('liquidationRisk', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px] text-rose-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Required Margin</label>
                      <input 
                        type="text" 
                        value={marginVariables.requiredMargin} 
                        onChange={(e) => handleVariableChange('requiredMargin', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Free Equity</label>
                      <input 
                        type="text" 
                        value={marginVariables.freeEquity} 
                        onChange={(e) => handleVariableChange('freeEquity', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Compliance Status Variables */}
              {activeTemplateType === 'kyc_status' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-white/40 uppercase">Trader Full Name</label>
                    <input 
                      type="text" 
                      value={kycVariables.traderName} 
                      onChange={(e) => handleVariableChange('traderName', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8.5px] text-white/40 uppercase">Clearance Level</label>
                    <input 
                      type="text" 
                      value={kycVariables.clearanceLevel} 
                      onChange={(e) => handleVariableChange('clearanceLevel', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px] text-indigo-400 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Filing ID</label>
                      <input 
                        type="text" 
                        value={kycVariables.filingId} 
                        onChange={(e) => handleVariableChange('filingId', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Exposure Limit ($)</label>
                      <input 
                        type="text" 
                        value={kycVariables.limit} 
                        onChange={(e) => handleVariableChange('limit', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8.5px] text-white/40 uppercase">Tax Residency Compliance</label>
                    <input 
                      type="text" 
                      value={kycVariables.taxResidency} 
                      onChange={(e) => handleVariableChange('taxResidency', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                    />
                  </div>
                </div>
              )}

              {/* Security Audit Variables */}
              {activeTemplateType === 'security_clearance' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">IP Address</label>
                      <input 
                        type="text" 
                        value={securityVariables.ipAddress} 
                        onChange={(e) => handleVariableChange('ipAddress', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px] text-amber-400 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Country Code</label>
                      <input 
                        type="text" 
                        value={securityVariables.countryCode} 
                        onChange={(e) => handleVariableChange('countryCode', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8.5px] text-white/40 uppercase">Assessed Geolocation</label>
                    <input 
                      type="text" 
                      value={securityVariables.location} 
                      onChange={(e) => handleVariableChange('location', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8.5px] text-white/40 uppercase">Device Signature</label>
                    <input 
                      type="text" 
                      value={securityVariables.device} 
                      onChange={(e) => handleVariableChange('device', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8.5px] text-white/40 uppercase">MFA Method</label>
                    <input 
                      type="text" 
                      value={securityVariables.authMethod} 
                      onChange={(e) => handleVariableChange('authMethod', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                    />
                  </div>
                </div>
              )}

              {/* Capital Wire Variables */}
              {activeTemplateType === 'capital_settlement' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Deposit ID</label>
                      <input 
                        type="text" 
                        value={fundingVariables.depositRef} 
                        onChange={(e) => handleVariableChange('depositRef', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Wallet Channel</label>
                      <input 
                        type="text" 
                        value={fundingVariables.channel} 
                        onChange={(e) => handleVariableChange('channel', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Credit Credit</label>
                      <input 
                        type="text" 
                        value={fundingVariables.grossCredit} 
                        onChange={(e) => handleVariableChange('grossCredit', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px] text-emerald-400 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-white/40 uppercase">Clearing Fee</label>
                      <input 
                        type="text" 
                        value={fundingVariables.fee} 
                        onChange={(e) => handleVariableChange('fee', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8.5px] text-white/40 uppercase">Current Settled Cash Balance</label>
                    <input 
                      type="text" 
                      value={fundingVariables.settledBalance} 
                      onChange={(e) => handleVariableChange('settledBalance', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-white focus:outline-none focus:border-indigo-500/50 text-[9.5px]"
                    />
                  </div>
                </div>
              )}

              {/* Dispatch Action Button */}
              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={triggerSmtpDispatch}
                  disabled={isSending}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold uppercase rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-[10px] tracking-wide disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-bounce' : ''}`} />
                  {isSending ? 'TRANSMITTING VIA SMTP...' : 'SEND LIVE TEST EMAIL'}
                </button>
              </div>
            </div>
          )}

          {/* SIMULATED INBOX LIST */}
          <div className="bg-[#08080c]/80 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center select-none">
              <span className="text-[8.5px] text-white/30 font-black uppercase tracking-widest flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 text-indigo-400" /> Simulated Trader Inbox ({inboxEmails.length})
              </span>
              {inboxEmails.length > 0 && (
                <button 
                  onClick={clearSimulatedInbox}
                  className="text-[8px] text-rose-400/70 hover:text-rose-400 font-bold uppercase cursor-pointer"
                  title="Purge Inbox"
                >
                  Clear
                </button>
              )}
            </div>

            {inboxEmails.length === 0 ? (
              <div className="p-8 border border-dashed border-white/5 rounded-lg text-center text-white/20 text-[9px] flex flex-col items-center gap-2">
                <Mail className="w-5 h-5 opacity-40 text-white/30" />
                <span>Inbox is empty.<br />Deploy a test email above to seed this channel.</span>
              </div>
            ) : (
              <div className="space-y-1 max-h-[220px] overflow-y-auto no-scrollbar">
                {inboxEmails.map(mail => {
                  const isSelected = selectedInboxEmail?.id === mail.id;
                  return (
                    <button
                      key={mail.id}
                      onClick={() => {
                        // Mark as read
                        if (mail.isUnread) {
                          setInboxEmails(prev => prev.map(m => m.id === mail.id ? { ...m, isUnread: false } : m));
                        }
                        // Set active template variables and select
                        setSelectedInboxEmail(mail);
                        setActiveTemplateType(mail.type);
                      }}
                      className={`w-full text-left p-2 rounded border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600/10 border-indigo-500/40 text-white font-bold'
                          : mail.isUnread
                            ? 'bg-white/[0.03] border-white/10 text-white/90 hover:bg-white/[0.05]'
                            : 'bg-transparent border-transparent text-neutral-200 hover:text-white hover:bg-white/[0.01]'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[7.5px] text-neutral-200 font-bold">
                        <span className="truncate max-w-[140px] uppercase tracking-wider">{mail.sender}</span>
                        <span className="shrink-0 flex items-center gap-1">
                          {mail.isUnread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
                          {mail.timestamp}
                        </span>
                      </div>
                      <span className="text-[9.5px] truncate block leading-snug">
                        {mail.subject}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive High-Fidelity Viewer Frame (col-span-8) */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* SMTP Terminal Monitor Component */}
          {showSmtpTerminal && (
            <div className="bg-[#030408] border border-[#1e1b4b] rounded-lg overflow-hidden flex flex-col shadow-xl animate-slideDown">
              <div className="bg-[#0d0e16] border-b border-white/5 px-4 py-2 flex items-center justify-between">
                <span className="text-[8.5px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                  <Terminal className="w-3.5 h-3.5 animate-pulse" /> SMTP Real-Time Dispatch Terminal
                </span>
                <span className="text-[7.5px] font-mono text-neutral-200 uppercase">SYSTEM CLEARANCE</span>
              </div>
              <div className="p-4 bg-[#020204] font-mono text-[9px] text-indigo-200/80 leading-relaxed max-h-48 overflow-y-auto space-y-1 text-left no-scrollbar">
                {smtpLog.length === 0 ? (
                  <span className="text-neutral-200 italic">Awaiting SMTP dispatch socket handshake... Trigger "SEND LIVE TEST EMAIL" above to initiate.</span>
                ) : (
                  smtpLog.map((log, idx) => {
                    let textCol = 'text-indigo-200/60';
                    if (log.startsWith('S:')) textCol = 'text-cyan-400 font-bold';
                    else if (log.startsWith('C:')) textCol = 'text-indigo-300';
                    else if (log.startsWith('>>')) textCol = 'text-emerald-400 font-extrabold';
                    else if (log.includes('Connecting')) textCol = 'text-neutral-200';
                    return (
                      <div key={idx} className={`${textCol} break-words whitespace-pre-wrap`}>
                        {log}
                      </div>
                    );
                  })
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}

          {/* Browser & Preview Sandbox Frame */}
          <div className="bg-[#08080c] border border-white/10 rounded-lg overflow-hidden flex flex-col shadow-2xl">
            
            {/* Window header - Simulated Browser Chrome */}
            <div className="bg-[#0f111a] border-b border-white/10 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
              
              <div className="flex items-center space-x-2">
                {/* Simulated window dots */}
                <div className="flex space-x-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                </div>
                
                <span className="h-4 w-px bg-white/10"></span>
                
                {/* Recipient meta */}
                <div className="min-w-0">
                  <span className="text-[8px] text-neutral-200 font-bold uppercase tracking-wider block">TO RECIPIENT</span>
                  <span className="text-[10px] text-indigo-300 font-bold truncate block">
                    {traderEmail}
                  </span>
                </div>
              </div>

              {/* Primary selector tabs */}
              <div className="flex bg-black/45 border border-white/5 rounded p-0.5 self-start sm:self-center">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 text-[9.5px] rounded font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'preview' 
                      ? 'bg-indigo-600/15 text-indigo-300 font-extrabold' 
                      : 'text-neutral-200 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Live Render
                </button>
                <button
                  onClick={() => setActiveTab('html_code')}
                  className={`px-3 py-1 text-[9.5px] rounded font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'html_code' 
                      ? 'bg-indigo-600/15 text-indigo-300 font-extrabold' 
                      : 'text-neutral-200 hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" /> HTML Source
                </button>
              </div>

            </div>

            {/* Simulated Email Envelope details */}
            <div className="bg-[#121420] border-b border-white/5 px-4 py-3 text-[10px] text-neutral-200 space-y-1.5 text-left border-dashed">
              <div className="flex justify-between items-start gap-3">
                <span className="font-bold text-white">
                  Subject: <span className="text-[#00e5ff]">{selectedInboxEmail ? selectedInboxEmail.subject : getSubjectLine(activeTemplateType, getActiveVariables())}</span>
                </span>
                {selectedInboxEmail && (
                  <button 
                    onClick={() => {
                      setSelectedInboxEmail(null);
                    }}
                    className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[8px] text-neutral-200 hover:text-indigo-300 font-bold uppercase flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> RETURN TO EDITOR
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-neutral-200 font-mono text-[9px]">
                <span className="uppercase">From:</span>
                <span className="text-white">MTXquant Dispatch Service &lt;{selectedInboxEmail ? selectedInboxEmail.sender : 'alerts@mtxquant.com'}&gt;</span>
              </div>
            </div>

            {/* Main viewports */}
            <div className="relative bg-[#020204] min-h-[500px] flex flex-col">
              
              {activeTab === 'preview' ? (
                <div className="w-full flex-1 p-5 overflow-auto flex justify-center items-start">
                  {/* isolated iframe keeps styles segregated from parent Tailwind */}
                  <iframe
                    title="Live HTML Email Viewport"
                    srcDoc={selectedInboxEmail ? selectedInboxEmail.htmlContent : currentLiveHtml}
                    className="w-full max-w-[620px] h-[550px] border-0 rounded-lg shadow-inner bg-black/40"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-full flex-1 p-4 font-mono text-[9px] text-emerald-400 overflow-auto text-left max-h-[550px] space-y-3 bg-[#020203]">
                  
                  {/* Code Toolbar */}
                  <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg p-2.5 mb-2 select-none">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-neutral-200 text-[8.5px]">STRICT COMPATIBILITY HTML BLOCK (TABLES & INLINE STYLES)</span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[9.5px] font-bold uppercase rounded transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCode ? 'COPIED!' : 'COPY CODE'}
                    </button>
                  </div>

                  {/* HTML Source printout */}
                  <pre className="p-3 bg-black/60 border border-white/5 rounded-lg overflow-x-auto text-[9.5px] leading-relaxed text-indigo-200 select-all no-scrollbar max-h-[440px]">
                    {selectedInboxEmail ? selectedInboxEmail.htmlContent : currentLiveHtml}
                  </pre>
                </div>
              )}

            </div>

          </div>

          {/* Quick Informative Info Box */}
          <div className="bg-[#100b08]/30 border border-amber-500/15 rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-relaxed text-neutral-200 text-left">
              <strong className="text-amber-400 font-bold block uppercase tracking-wider mb-1">Email Client Compatibility Charter</strong>
              All templates are constructed strictly using compliant nesting tables, explicit width constraints, inline styles, and web-safe font-stack declarations (`Inter`, `monospace`, etc.). This guarantees visual consistency across Microsoft Outlook, Apple Mail, Gmail, and Thunderbird.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
