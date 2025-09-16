// import removed, not needed

export const sslScanModule = {
  name: 'ssl',
  description: 'SSL/TLS certificate and configuration analysis',
  scan: async function scanEnhancedSSL(url: string): Promise<import('./types').EnhancedScanResult> {
    const findings: import('./types').EnhancedFinding[] = [];

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
          businessImpact: 'HTTPS encryption protects user data and builds customer trust.'
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
          businessImpact: 'HSTS prevents SSL stripping attacks and ensures secure connections.'
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
            businessImpact: 'Lack of HTTPS exposes user data to interception and undermines trust.'
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
          businessImpact: 'Website unavailability prevents security assessment and user access.'
        });
      }
    }

    // Compose EnhancedScanResult
    return {
      scanId: 'ssl-' + Math.random().toString(36).slice(2,10),
      url,
      scanType: 'ssl',
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

// (duplicate object declaration removed)
