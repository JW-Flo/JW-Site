// import removed, not needed

export const commonScanModule = {
  name: 'common',
  description: 'Common vulnerable files and paths analysis',
  scan: async function scanEnhancedCommonFiles(url: string): Promise<import('./types').EnhancedScanResult> {
    const findings: import('./types').EnhancedFinding[] = [];

    // Common vulnerable files and paths to check
    const commonPaths = [
      // Backup files
      '/backup.zip',
      '/backup.tar.gz',
      '/backup.sql',
      '/site-backup.zip',
      '/db-backup.sql',

      // Configuration files
      '/config.php.bak',
      '/config.php~',
      '/config.php.old',
      '/wp-config.php.bak',
      '/web.config.bak',

      // Admin panels
      '/admin/',
      '/administrator/',
      '/admin.php',
      '/wp-admin/',
      '/phpmyadmin/',
      '/pma/',

      // Log files
      '/error.log',
      '/access.log',
      '/debug.log',
      '/logs/error.log',

      // Temporary files
      '/tmp/',
      '/temp/',
      '/cache/',

      // Version control
      '/.git/',
      '/.svn/',
      '/.hg/',

      // CMS specific
      '/wp-content/uploads/',
      '/wp-includes/',
      '/drupal/',
      '/joomla/',
      '/magento/'
    ];

    for (const path of commonPaths) {
      try {
        const response = await fetch(`${url}${path}`, { method: 'HEAD' });
        if (response.status === 200) {
          let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
          let title = 'Potentially Sensitive Path Accessible';
          let recommendation = 'Restrict access to sensitive paths and files.';

          // Adjust severity based on path type
          if (path.includes('backup') || path.includes('config') || path.includes('.git')) {
            severity = 'critical';
            title = 'Critical Sensitive File/Path Exposed';
            recommendation = 'Immediately remove or secure sensitive files and backups.';
          } else if (path.includes('admin') || path.includes('phpmyadmin')) {
            severity = 'high';
            title = 'Administrative Interface Exposed';
            recommendation = 'Secure administrative interfaces with proper authentication and access controls.';
          }

          findings.push({
            severity,
            category: 'Common Vulnerabilities',
            title,
            description: `Accessible path found: ${path}`,
            recommendation,
            businessImpact: 'Exposed sensitive paths can lead to data breaches, unauthorized access, or system compromise.'
          });
        }
      } catch (error) {
        // Path not accessible or error occurred - continue to next path
        console.warn(`Failed to check path ${path}:`, error);
      }
    }

    // Check for common vulnerable patterns
    const vulnerablePatterns = [
      '/.well-known/security.txt', // Should exist but might reveal info
      '/crossdomain.xml',
      '/clientaccesspolicy.xml',
      '/sitemap.xml' // Might reveal site structure
    ];

    for (const pattern of vulnerablePatterns) {
      try {
        const response = await fetch(`${url}${pattern}`, { method: 'HEAD' });
        if (response.status === 200) {
          findings.push({
            severity: 'info',
            category: 'Information Disclosure',
            title: `Information File Found: ${pattern}`,
            description: `Information disclosure file accessible: ${pattern}`,
            recommendation: 'Review content of information files and ensure no sensitive data is exposed.',
            businessImpact: 'Information files can reveal site structure and potential attack vectors.'
          });
        }
      } catch {
        // Pattern not found - continue
      }
    }

    // Compose EnhancedScanResult
    return {
      scanId: 'common-' + Math.random().toString(36).slice(2,10),
      url,
      scanType: 'common',
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
