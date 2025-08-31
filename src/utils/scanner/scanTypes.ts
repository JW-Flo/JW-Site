// Scanner type definitions (Lite version)
export type BusinessScanKey = 'headers' | 'ssl' | 'info' | 'common';
export type EngineerScanKey = 'advanced-headers' | 'waf' | 'tech-stack';
export type SuperAdminScanKey = 'content-analysis' | 'privacy-compliance' | 'performance-security';

export type ScanKey = BusinessScanKey | EngineerScanKey | SuperAdminScanKey;

export interface Finding {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'warning' | 'info' | 'excellent';
  title: string;
  description: string;
  recommendation?: string;
  businessImpact?: string;
}

export interface ScanContext {
  url: string;
  mode: 'business' | 'engineer' | 'super-admin';
  selected: ScanKey[];
  adminKey?: string;
}

export interface ScanBundle {
  findings: Finding[];
  meta: { durationMs: number; scanKeys: ScanKey[] };
  scores: { businessScore: number; technicalScore: number };
}
