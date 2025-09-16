import { EnhancedScanType, EnhancedFinding, ScanModule } from './types';
import { headersScanModule } from './headers';
import { sslScanModule } from './ssl';
import { infoScanModule } from './info';
import { commonScanModule } from './common';

import { EnhancedScanResult } from './types';

// Helper to create an empty EnhancedScanResult
function emptyScanResult(scanType: EnhancedScanType, url: string): EnhancedScanResult {
  return {
    scanId: 'empty-scan',
    url,
    scanType,
    timestamp: new Date().toISOString(),
    duration: 0,
    findings: [],
    summary: {
      totalFindings: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      securityScore: 100
    },
    businessMetrics: {
      trustScore: 100,
      professionalismScore: 100,
      userExperienceScore: 100,
      brandProtectionScore: 100
    },
    metadata: {
      scannerVersion: '2.0-modular',
      scanDepth: 1,
      externalApisUsed: []
    }
  };
}

// Registry of all scan modules
const scanModules: Record<EnhancedScanType, ScanModule> = {
  'headers': headersScanModule,
  'ssl': sslScanModule,
  'info': infoScanModule,
  'common': commonScanModule,
  // Placeholder modules for remaining scan types
  'advanced-headers': { name: 'advanced-headers', description: 'Advanced headers analysis', scan: async (url: string) => emptyScanResult('advanced-headers', url) },
  'waf': { name: 'waf', description: 'Web Application Firewall detection', scan: async (url: string) => emptyScanResult('waf', url) },
  'subdomain': { name: 'subdomain', description: 'Subdomain enumeration', scan: async (url: string) => emptyScanResult('subdomain', url) },
  'tech-stack': { name: 'tech-stack', description: 'Technology stack detection', scan: async (url: string) => emptyScanResult('tech-stack', url) },
  'cve': { name: 'cve', description: 'CVE vulnerability analysis', scan: async (url: string) => emptyScanResult('cve', url) },
  'content-analysis': { name: 'content-analysis', description: 'Content security analysis', scan: async (url: string) => emptyScanResult('content-analysis', url) },
  'privacy-compliance': { name: 'privacy-compliance', description: 'Privacy compliance analysis', scan: async (url: string) => emptyScanResult('privacy-compliance', url) },
  'performance-security': { name: 'performance-security', description: 'Performance security analysis', scan: async (url: string) => emptyScanResult('performance-security', url) },
  'social-media-audit': { name: 'social-media-audit', description: 'Social media security audit', scan: async (url: string) => emptyScanResult('social-media-audit', url) },
  'third-party-scripts': { name: 'third-party-scripts', description: 'Third-party scripts analysis', scan: async (url: string) => emptyScanResult('third-party-scripts', url) },
  'seo-security': { name: 'seo-security', description: 'SEO security analysis', scan: async (url: string) => emptyScanResult('seo-security', url) },
  'accessibility-security': { name: 'accessibility-security', description: 'Accessibility security analysis', scan: async (url: string) => emptyScanResult('accessibility-security', url) },
  'infrastructure-mapping': { name: 'infrastructure-mapping', description: 'Infrastructure mapping', scan: async (url: string) => emptyScanResult('infrastructure-mapping', url) },
  'api-security': { name: 'api-security', description: 'API security analysis', scan: async (url: string) => emptyScanResult('api-security', url) },
  'business-logic': { name: 'business-logic', description: 'Business logic security analysis', scan: async (url: string) => emptyScanResult('business-logic', url) },
  'cloud-security': { name: 'cloud-security', description: 'Cloud security analysis', scan: async (url: string) => emptyScanResult('cloud-security', url) },
  'compliance-frameworks': { name: 'compliance-frameworks', description: 'Compliance frameworks analysis', scan: async (url: string) => emptyScanResult('compliance-frameworks', url) },
  'threat-intel': { name: 'threat-intel', description: 'Threat intelligence analysis', scan: async (url: string) => emptyScanResult('threat-intel', url) },
  'full': { name: 'full', description: 'Comprehensive full scan', scan: async (url: string) => emptyScanResult('full', url) }
};

/**
 * Run a specific scan type against a URL
 */
export async function runScan(scanType: EnhancedScanType, url: string, options?: any): Promise<EnhancedScanResult> {
  const module = scanModules[scanType];

  if (!module) {
    throw new Error(`Unknown scan type: ${scanType}`);
  }

  try {
    return await module.scan(url, options);
  } catch (error) {
    console.error(`Error running ${scanType} scan:`, error);
    // Return a valid EnhancedScanResult with error finding
    return {
      scanId: 'error-scan',
      url,
      scanType,
      timestamp: new Date().toISOString(),
      duration: 0,
      findings: [{
        severity: 'high',
        category: 'Scan Error',
        title: `Scan Failed: ${scanType}`,
        description: `Failed to complete ${scanType} scan for ${url}`,
        recommendation: 'Retry the scan or contact support for assistance.',
        businessImpact: 'Failed scans prevent comprehensive security assessment.',
        consultingOpportunity: 'Advanced security scanning and troubleshooting services available.'
      }],
      summary: {
        totalFindings: 1,
        criticalCount: 0,
        highCount: 1,
        mediumCount: 0,
        lowCount: 0,
        securityScore: 0
      },
      businessMetrics: {
        trustScore: 0,
        professionalismScore: 0,
        userExperienceScore: 0,
        brandProtectionScore: 0
      },
      metadata: {
        scannerVersion: '2.0-modular',
        scanDepth: 1,
        externalApisUsed: []
      }
    };
  }
}

/**
 * Get all available scan types
 */
export function getAvailableScanTypes(): EnhancedScanType[] {
  return Object.keys(scanModules) as EnhancedScanType[];
}

/**
 * Get scan module information
 */
export function getScanModuleInfo(scanType: EnhancedScanType): ScanModule | null {
  return scanModules[scanType] || null;
}

/**
 * Run multiple scan types
 */
export async function runMultipleScans(scanTypes: EnhancedScanType[], url: string, options?: any): Promise<EnhancedScanResult[]> {
  const allResults: EnhancedScanResult[] = [];

  for (const scanType of scanTypes) {
    try {
      const result = await runScan(scanType, url, options);
      allResults.push(result);
    } catch (error) {
      console.error(`Error in ${scanType} scan:`, error);
      // Continue with other scans even if one fails
    }
  }

  return allResults;
}
