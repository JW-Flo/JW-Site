import { EnhancedFinding } from './types';

export const headersScanModule = {
  name: 'headers',
  description: 'Enhanced security headers analysis',

  scan: async function scanEnhancedSecurityHeaders(url: string): Promise<EnhancedFinding[]> {
    const findings: EnhancedFinding[] = [];

    try {
      const response = await fetch(url, { method: 'HEAD' });
      const headers = response.headers;

      // Check for security headers
      const securityHeaders = {
        'Strict-Transport-Security': {
          present: headers.get('Strict-Transport-Security') !== null,
          severity: 'high',
          title: 'Missing HSTS Header',
          description: 'HTTP Strict Transport Security (HSTS) header is missing.',
          recommendation: 'Implement HSTS header to enforce HTTPS connections.'
        },
        'Content-Security-Policy': {
          present: headers.get('Content-Security-Policy') !== null,
          severity: 'high',
          title: 'Missing CSP Header',
          description: 'Content Security Policy (CSP) header is missing.',
          recommendation: 'Implement CSP header to prevent XSS attacks.'
        },
        'X-Frame-Options': {
          present: headers.get('X-Frame-Options') !== null,
          severity: 'medium',
          title: 'Missing X-Frame-Options Header',
          description: 'X-Frame-Options header is missing.',
          recommendation: 'Implement X-Frame-Options header to prevent clickjacking.'
        },
        'X-Content-Type-Options': {
          present: headers.get('X-Content-Type-Options') !== null,
          severity: 'medium',
          title: 'Missing X-Content-Type-Options Header',
          description: 'X-Content-Type-Options header is missing.',
          recommendation: 'Implement X-Content-Type-Options header to prevent MIME sniffing.'
        },
        'Referrer-Policy': {
          present: headers.get('Referrer-Policy') !== null,
          severity: 'low',
          title: 'Missing Referrer-Policy Header',
          description: 'Referrer-Policy header is missing.',
          recommendation: 'Implement Referrer-Policy header to control referrer information.'
        }
      };

      for (const [headerName, config] of Object.entries(securityHeaders)) {
        if (!config.present) {
          findings.push({
            severity: config.severity as any,
            category: 'Security Headers',
            title: config.title,
            description: config.description,
            recommendation: config.recommendation,
            businessImpact: 'Missing security headers can expose the application to various attacks.',
            consultingOpportunity: 'Security headers implementation and configuration services available.'
          });
        }
      }

      // Check for information disclosure headers
      const serverHeader = headers.get('Server');
      if (serverHeader) {
        findings.push({
          severity: 'info',
          category: 'Information Disclosure',
          title: 'Server Information Disclosed',
          description: `Server header reveals: ${serverHeader}`,
          recommendation: 'Consider removing or obscuring server information in production.',
          businessImpact: 'Server information can help attackers identify potential vulnerabilities.',
          consultingOpportunity: 'Server hardening and information disclosure prevention services available.'
        });
      }

    } catch (error) {
      findings.push({
        severity: 'high',
        category: 'Connection Error',
        title: 'Unable to Analyze Headers',
        description: `Failed to fetch headers from ${url}: ${error}`,
        recommendation: 'Ensure the URL is accessible and properly configured.',
        businessImpact: 'Inability to analyze security headers prevents proper security assessment.',
        consultingOpportunity: 'Network security and connectivity assessment services available.'
      });
    }

    return findings;
  }
};
