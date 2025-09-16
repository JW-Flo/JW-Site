// import removed, not needed

export const headersScanModule = {
  name: 'headers',
  description: 'Enhanced security headers analysis',

  scan: async function scanEnhancedSecurityHeaders(url: string): Promise<import('./types').EnhancedScanResult> {
    const findings: import('./types').EnhancedFinding[] = [];

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
            // consultingOpportunity removed
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
          // consultingOpportunity removed
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
  // consultingOpportunity removed
      });
    }

    // Compose EnhancedScanResult
    return {
      scanId: 'headers-' + Math.random().toString(36).slice(2,10),
      url,
      scanType: 'headers',
      timestamp: new Date().toISOString(),
      duration: 0,
      findings,
      summary: {
        totalFindings: findings.length,
        criticalCount: findings.filter(f => f.severity === 'critical').length,
        highCount: findings.filter(f => f.severity === 'high').length,
        mediumCount: findings.filter(f => f.severity === 'medium').length,
        lowCount: findings.filter(f => f.severity === 'low').length,
        securityScore: findings.length === 0 ? 100 : 100 - findings.length * 10
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
};
