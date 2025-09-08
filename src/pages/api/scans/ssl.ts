import { EnhancedFinding } from './types';

export const sslScanModule = {
  name: 'ssl',
  description: 'SSL/TLS certificate and configuration analysis',

  scan: async function scanEnhancedSSL(url: string): Promise<EnhancedFinding[]> {
    const findings: EnhancedFinding[] = [];

    try {
      // For SSL analysis, we need to make an HTTPS request
      const httpsUrl = url.replace(/^http:/, 'https:');
      const response = await fetch(httpsUrl, { method: 'HEAD' });

      if (response.ok) {
        findings.push({
          severity: 'excellent',
          category: 'SSL/TLS',
          title: 'HTTPS Successfully Enabled',
          description: 'The website is properly configured with HTTPS.',
          recommendation: 'Continue monitoring SSL certificate expiration and renew as needed.',
          businessImpact: 'HTTPS encryption protects user data and builds customer trust.',
          consultingOpportunity: 'SSL certificate management and HTTPS migration services available.'
        });
      }

      // Check for HSTS header (already covered in headers scan, but good to note here)
      const hstsHeader = response.headers.get('Strict-Transport-Security');
      if (hstsHeader) {
        findings.push({
          severity: 'excellent',
          category: 'SSL/TLS',
          title: 'HSTS Header Present',
          description: 'HTTP Strict Transport Security (HSTS) is properly configured.',
          recommendation: 'Ensure HSTS max-age is set appropriately for your security requirements.',
          businessImpact: 'HSTS prevents SSL stripping attacks and ensures secure connections.',
          consultingOpportunity: 'SSL/TLS security configuration services available.'
        });
      }

    } catch (error) {
      // If HTTPS fails, check if HTTP works (mixed content issues)
      try {
        const httpResponse = await fetch(url.replace(/^https:/, 'http:'), { method: 'HEAD' });
        if (httpResponse.ok) {
          findings.push({
            severity: 'high',
            category: 'SSL/TLS',
            title: 'HTTPS Not Available',
            description: 'The website is only available over HTTP, not HTTPS.',
            recommendation: 'Implement SSL/TLS certificates and redirect HTTP to HTTPS.',
            businessImpact: 'Lack of HTTPS exposes user data to interception and undermines trust.',
            consultingOpportunity: 'SSL certificate installation and HTTPS configuration services available.'
          });
        }
      } catch (httpError) {
        // Handle the HTTP error
        console.warn(`HTTP check failed for ${url}:`, httpError);
        findings.push({
          severity: 'critical',
          category: 'Connectivity',
          title: 'Website Unreachable',
          description: `Unable to connect to ${url} over HTTP or HTTPS.`,
          recommendation: 'Check website availability and DNS configuration.',
          businessImpact: 'Website unavailability prevents security assessment and user access.',
          consultingOpportunity: 'Website availability and infrastructure assessment services available.'
        });
      }
    }

    return findings;
  }
};
