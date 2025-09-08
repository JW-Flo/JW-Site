import { EnhancedFinding } from './types';

export const infoScanModule = {
  name: 'info',
  description: 'Information disclosure analysis',

  scan: async function scanEnhancedInfoDisclosure(url: string): Promise<EnhancedFinding[]> {
    const findings: EnhancedFinding[] = [];

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
            businessImpact: 'Exposed technology information helps attackers identify potential vulnerabilities.',
            consultingOpportunity: 'Information disclosure prevention and server hardening services available.'
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
            businessImpact: 'Directory listing exposes file structure and potentially sensitive files.',
            consultingOpportunity: 'Web server configuration and security hardening services available.'
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
              businessImpact: 'Exposed sensitive files can contain credentials, configuration, or source code.',
              consultingOpportunity: 'File system security and access control services available.'
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
        businessImpact: 'Incomplete analysis may miss critical information disclosure vulnerabilities.',
        consultingOpportunity: 'Comprehensive security assessment services available.'
      });
    }

    return findings;
  }
};
