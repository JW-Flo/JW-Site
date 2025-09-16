// Shared types and interfaces for enhanced security scans
export type EnhancedScanType =
  | 'headers'
  | 'ssl'
  | 'info'
  | 'common'
  | 'advanced-headers'
  | 'waf'
  | 'subdomain'
  | 'tech-stack'
  | 'cve'
  | 'content-analysis'
  | 'privacy-compliance'
  | 'performance-security'
  | 'social-media-audit'
  | 'third-party-scripts'
  | 'seo-security'
  | 'accessibility-security'
  | 'infrastructure-mapping'
  | 'api-security'
  | 'business-logic'
  | 'cloud-security'
  | 'compliance-frameworks'
  | 'threat-intel'
  | 'full';

export interface EnhancedScanRequest {
  url: string;
  scanType: EnhancedScanType;
  options?: {
    depth?: number;
    includeSubdomains?: boolean;
    maxTimeout?: number;
    followRedirects?: boolean;
  };
}

export interface EnhancedFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'warning' | 'info' | 'excellent';
  category: string;
  title: string;
  description: string;
  recommendation?: string;
  businessImpact?: string;
  technicalDetails?: {
    cve?: string;
    cvss?: number;
    affectedComponent?: string;
    remediationSteps?: string[];
  };
  costEstimate?: {
    currency: string;
    amount: number;
    timeframe: string;
  };
}

export interface EnhancedScanResult {
  scanId: string;
  url: string;
  scanType: EnhancedScanType;
  timestamp: string;
  duration: number;
  findings: EnhancedFinding[];
  summary: {
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    securityScore: number;
  };
  businessMetrics: {
    trustScore: number;
    professionalismScore: number;
    userExperienceScore: number;
    brandProtectionScore: number;
  };
  metadata: {
    scannerVersion: string;
    scanDepth: number;
    externalApisUsed: string[];
  };
}

export interface ScanModule {
  name: string;
  description: string;
  scan: (url: string, options?: any) => Promise<EnhancedScanResult>;
}
