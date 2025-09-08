import { EnhancedScanType, EnhancedFinding, ScanModule } from './types';
import { headersScanModule } from './headers';
import { sslScanModule } from './ssl';
import { infoScanModule } from './info';
import { commonScanModule } from './common';

// Registry of all scan modules
const scanModules: Record<EnhancedScanType, ScanModule> = {
  'headers': headersScanModule,
  'ssl': sslScanModule,
  'info': infoScanModule,
  'common': commonScanModule,
  // Placeholder modules for remaining scan types
  'advanced-headers': { name: 'advanced-headers', description: 'Advanced headers analysis', scan: async () => [] },
  'waf': { name: 'waf', description: 'Web Application Firewall detection', scan: async () => [] },
  'subdomain': { name: 'subdomain', description: 'Subdomain enumeration', scan: async () => [] },
  'tech-stack': { name: 'tech-stack', description: 'Technology stack detection', scan: async () => [] },
  'cve': { name: 'cve', description: 'CVE vulnerability analysis', scan: async () => [] },
  'content-analysis': { name: 'content-analysis', description: 'Content security analysis', scan: async () => [] },
  'privacy-compliance': { name: 'privacy-compliance', description: 'Privacy compliance analysis', scan: async () => [] },
  'performance-security': { name: 'performance-security', description: 'Performance security analysis', scan: async () => [] },
  'social-media-audit': { name: 'social-media-audit', description: 'Social media security audit', scan: async () => [] },
  'third-party-scripts': { name: 'third-party-scripts', description: 'Third-party scripts analysis', scan: async () => [] },
  'seo-security': { name: 'seo-security', description: 'SEO security analysis', scan: async () => [] },
  'accessibility-security': { name: 'accessibility-security', description: 'Accessibility security analysis', scan: async () => [] },
  'infrastructure-mapping': { name: 'infrastructure-mapping', description: 'Infrastructure mapping', scan: async () => [] },
  'api-security': { name: 'api-security', description: 'API security analysis', scan: async () => [] },
  'business-logic': { name: 'business-logic', description: 'Business logic security analysis', scan: async () => [] },
  'cloud-security': { name: 'cloud-security', description: 'Cloud security analysis', scan: async () => [] },
  'compliance-frameworks': { name: 'compliance-frameworks', description: 'Compliance frameworks analysis', scan: async () => [] },
  'threat-intel': { name: 'threat-intel', description: 'Threat intelligence analysis', scan: async () => [] },
  'full': { name: 'full', description: 'Comprehensive full scan', scan: async () => [] }
};

/**
 * Run a specific scan type against a URL
 */
export async function runScan(scanType: EnhancedScanType, url: string, options?: any): Promise<EnhancedFinding[]> {
  const module = scanModules[scanType];

  if (!module) {
    throw new Error(`Unknown scan type: ${scanType}`);
  }

  try {
    return await module.scan(url, options);
  } catch (error) {
    console.error(`Error running ${scanType} scan:`, error);
    return [{
      severity: 'high',
      category: 'Scan Error',
      title: `Scan Failed: ${scanType}`,
      description: `Failed to complete ${scanType} scan for ${url}`,
      recommendation: 'Retry the scan or contact support for assistance.',
      businessImpact: 'Failed scans prevent comprehensive security assessment.',
      consultingOpportunity: 'Advanced security scanning and troubleshooting services available.'
    }];
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
export async function runMultipleScans(scanTypes: EnhancedScanType[], url: string, options?: any): Promise<EnhancedFinding[]> {
  const allFindings: EnhancedFinding[] = [];

  for (const scanType of scanTypes) {
    try {
      const findings = await runScan(scanType, url, options);
      allFindings.push(...findings);
    } catch (error) {
      console.error(`Error in ${scanType} scan:`, error);
      // Continue with other scans even if one fails
    }
  }

  return allFindings;
}
