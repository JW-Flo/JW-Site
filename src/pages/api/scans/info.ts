// import removed, not needed

export const infoScanModule = {
  name: 'info',
  description: 'Information disclosure analysis',
  scan: async function scanEnhancedInfoDisclosure(url: string): Promise<import('./types').EnhancedScanResult> {
    const findings: import('./types').EnhancedFinding[] = [];

    try {
      const response = await fetch(url, { method: 'HEAD' });
      const headers = response.headers;

      // Check for sensitive information in headers
      const sensitiveHeaders = [
        'X-Powered-By',
        'X-AspNet-Version',
        'X-AspNetMvc-Version',
        'Server',
        'X-Generator',
        'X-Drupal-Cache',
        'X-Varnish'
      ];

      for (const headerName of sensitiveHeaders) {
        const headerValue = headers.get(headerName);
        if (headerValue) {
          findings.push({
            severity: 'medium',
            category: 'Information Disclosure',
            title: `Sensitive Header Exposed: ${headerName}`,
            description: `Header ${headerName} reveals: ${headerValue}`,
            recommendation: 'Remove or obscure sensitive headers that disclose technology stack information.',
            businessImpact: 'Exposed technology information helps attackers identify potential vulnerabilities.'
          });
        }
      }

      // Check for directory listing
      try {
        const dirResponse = await fetch(`${url}/backup/`, { method: 'HEAD' });
        if (dirResponse.status === 200) {
          findings.push({
            severity: 'high',
            category: 'Information Disclosure',
            title: 'Directory Listing Enabled',
            description: 'Directory listing is enabled for /backup/ path.',
            recommendation: 'Disable directory listing and remove backup directories from web root.',
            businessImpact: 'Directory listing exposes file structure and potentially sensitive files.'
          });
        }
      } catch {
        // Directory not accessible - this is good
      }

      // Check for common sensitive files
      const sensitiveFiles = [
        '/.git/HEAD',
        '/.env',
        '/config.php',
        '/wp-config.php',
        '/.htaccess',
        '/web.config',
        '/phpinfo.php'
      ];

      for (const file of sensitiveFiles) {
        try {
          const fileResponse = await fetch(`${url}${file}`, { method: 'HEAD' });
          if (fileResponse.status === 200) {
            findings.push({
              severity: 'critical',
              category: 'Information Disclosure',
              title: `Sensitive File Exposed: ${file}`,
              description: `Sensitive file ${file} is accessible via web.`,
              recommendation: 'Remove sensitive files from web root or restrict access.',
              businessImpact: 'Exposed sensitive files can contain credentials, configuration, or source code.'
            });
          }
        } catch {
          // File not accessible - continue
        }
      }

    } catch (error) {
      console.warn(`Info disclosure scan failed for ${url}:`, error);
      findings.push({
        severity: 'medium',
        category: 'Scan Error',
        title: 'Unable to Complete Information Disclosure Scan',
        description: `Failed to analyze information disclosure for ${url}`,
        recommendation: 'Ensure the URL is accessible for comprehensive security analysis.',
        businessImpact: 'Incomplete analysis may miss critical information disclosure vulnerabilities.'
      });
    }

    // Compose EnhancedScanResult
    return {
      scanId: 'info-' + Math.random().toString(36).slice(2,10),
      url,
      scanType: 'info',
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
