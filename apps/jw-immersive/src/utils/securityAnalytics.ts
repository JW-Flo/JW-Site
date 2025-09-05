// Security Scanner Analytics and Data Collection
// Legitimate business intelligence for cybersecurity tool improvement

export interface ScannerUsageData {
  scanType: string;
  targetDomain: string;
  userAgent: string;
  timestamp: number;
  scanDuration: number;
  vulnerabilitiesFound: number;
  region?: string;
  scanMode: 'standard' | 'engineer' | 'super-admin';
  sessionId: string;
}

export interface SecurityResearchData {
  vulnerabilityTypes: string[];
  commonMisconfigurations: string[];
  technologyStack: string[];
  securityHeaders: Record<string, boolean>;
  anonymizedDomain: string;
  timestamp: number;
}

class SecurityAnalytics {
  private hasConsent(): boolean {
    return window.cookieConsent?.hasConsent('analytics') || false;
  }
  
  private hasResearchConsent(): boolean {
    return window.cookieConsent?.hasConsent('research') || false;
  }
  
  private generateSessionId(): string {
    return crypto.randomUUID();
  }
  
  private async anonymizeDomain(domain: string): Promise<string> {
    // Create hash of domain for research while preserving privacy
    const encoder = new TextEncoder();
    const data = encoder.encode(domain + 'security-salt-2024');
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async trackScannerUsage(data: Partial<ScannerUsageData>): Promise<void> {
    if (!this.hasConsent()) {
      console.log('📊 Analytics tracking skipped - no consent');
      return;
    }
    
    try {
      const usageData: ScannerUsageData = {
        scanType: data.scanType || 'unknown',
        targetDomain: this.sanitizeDomain(data.targetDomain || ''),
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        scanDuration: data.scanDuration || 0,
        vulnerabilitiesFound: data.vulnerabilitiesFound || 0,
        region: await this.getRegion(),
        scanMode: data.scanMode || 'standard',
        sessionId: this.getSessionId()
      };
      
      // Send to analytics endpoint
      await this.sendAnalytics('/api/analytics/scanner-usage', usageData);
      
      console.log('📊 Scanner usage tracked:', {
        scanType: usageData.scanType,
        mode: usageData.scanMode,
        vulnerabilities: usageData.vulnerabilitiesFound
      });
      
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }
  
  async trackSecurityResearch(scanResults: any): Promise<void> {
    if (!this.hasResearchConsent()) {
      console.log('🔬 Security research tracking skipped - no consent');
      return;
    }
    
    try {
      const researchData: SecurityResearchData = {
        vulnerabilityTypes: this.extractVulnerabilityTypes(scanResults),
        commonMisconfigurations: this.extractMisconfigurations(scanResults),
        technologyStack: this.extractTechStack(scanResults),
        securityHeaders: this.extractSecurityHeaders(scanResults),
        anonymizedDomain: await this.anonymizeDomain(scanResults.domain || ''),
        timestamp: Date.now()
      };
      
      // Send to research endpoint
      await this.sendAnalytics('/api/analytics/security-research', researchData);
      
      console.log('🔬 Security research data collected:', {
        vulnerabilityTypes: researchData.vulnerabilityTypes.length,
        techStack: researchData.technologyStack.length
      });
      
    } catch (error) {
      console.error('Security research tracking error:', error);
    }
  }
  
  private sanitizeDomain(domain: string): string {
    // Remove sensitive subdomains, keep only root domain for analytics
    try {
      const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
      const parts = url.hostname.split('.');
      
      // Keep only root domain (last 2 parts)
      if (parts.length > 2) {
        return parts.slice(-2).join('.');
      }
      return url.hostname;
    } catch {
      return 'invalid-domain';
    }
  }
  
  private async getRegion(): Promise<string> {
    try {
      // Use Cloudflare's geo data if available
      if (window.CF?.country) {
        return window.CF.country;
      }
      
      // Fallback to timezone-based region detection
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return timezone.split('/')[0]; // e.g., "America", "Europe", "Asia"
    } catch {
      return 'unknown';
    }
  }
  
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('security-scanner-session');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('security-scanner-session', sessionId);
    }
    return sessionId;
  }
  
  private extractVulnerabilityTypes(results: any): string[] {
    const types: string[] = [];
    
    if (results.missingHeaders?.length > 0) {
      types.push('missing-security-headers');
    }
    
    if (results.sslIssues?.length > 0) {
      types.push('ssl-configuration');
    }
    
    if (results.infoDisclosure?.length > 0) {
      types.push('information-disclosure');
    }
    
    if (results.commonFiles?.vulnerabilities?.length > 0) {
      types.push('exposed-files');
    }
    
    return types;
  }
  
  private extractMisconfigurations(results: any): string[] {
    const misconfigs: string[] = [];
    
    results.missingHeaders?.forEach((header: any) => {
      misconfigs.push(`missing-${header.name.toLowerCase()}`);
    });
    
    if (results.sslScore < 80) {
      misconfigs.push('ssl-misconfiguration');
    }
    
    return misconfigs;
  }
  
  private extractTechStack(results: any): string[] {
    const techStack: string[] = [];
    
    if (results.serverHeaders?.server) {
      techStack.push(results.serverHeaders.server.split('/')[0].toLowerCase());
    }
    
    if (results.serverHeaders?.['x-powered-by']) {
      techStack.push(results.serverHeaders['x-powered-by'].toLowerCase());
    }
    
    return techStack;
  }
  
  private extractSecurityHeaders(results: any): Record<string, boolean> {
    const headers: Record<string, boolean> = {};
    
    const securityHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
      'permissions-policy'
    ];
    
    securityHeaders.forEach(header => {
      headers[header] = Boolean(results.headers?.[header]);
    });
    
    return headers;
  }
  
  private async sendAnalytics(endpoint: string, data: any): Promise<void> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userConsent: {
            analytics: this.hasConsent(),
            research: this.hasResearchConsent(),
            timestamp: Date.now()
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }
  
  // Public methods for scanner integration
  startScan(scanType: string, targetDomain: string, mode: 'standard' | 'engineer' | 'super-admin' = 'standard') {
    this.scanStartTime = Date.now();
    
    if (this.hasConsent()) {
      console.log(`🔍 Starting ${scanType} scan for ${targetDomain} in ${mode} mode`);
    }
  }
  
  async endScan(scanResults: any) {
    const scanDuration = Date.now() - (this.scanStartTime || Date.now());
    
    // Track usage analytics
    await this.trackScannerUsage({
      scanType: scanResults.scanType,
      targetDomain: scanResults.domain,
      scanDuration,
      vulnerabilitiesFound: this.countVulnerabilities(scanResults),
      scanMode: scanResults.mode
    });
    
    // Track security research data
    await this.trackSecurityResearch(scanResults);
  }
  
  private countVulnerabilities(results: any): number {
    let count = 0;
    
    count += results.missingHeaders?.length || 0;
    count += results.sslIssues?.length || 0;
    count += results.infoDisclosure?.length || 0;
    count += results.commonFiles?.vulnerabilities?.length || 0;
    
    return count;
  }
  
  private scanStartTime?: number;
}

// Global analytics instance
export const securityAnalytics = new SecurityAnalytics();

// Export for global access
declare global {
  interface Window {
    securityAnalytics: SecurityAnalytics;
    cookieConsent?: any;
    CF?: any;
  }
}

window.securityAnalytics = securityAnalytics;
