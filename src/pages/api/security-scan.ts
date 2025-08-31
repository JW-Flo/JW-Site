import type { APIRoute } from 'astro';

// Security scan types
type ScanType = 'headers' | 'ssl' | 'info' | 'common' | 'advanced-headers' | 'waf' | 'subdomain' | 'tech-stack' | 'cve';

interface ScanRequest {
  url: string;
  type: ScanType;
  engineerMode?: boolean;
}

interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  recommendation?: string;
}

interface ScanResult {
  findings: Finding[];
  metadata?: any;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url, type, engineerMode }: ScanRequest = await request.json();
    
    if (!url || !type) {
      return new Response(JSON.stringify({ error: 'Missing url or type parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return new Response(JSON.stringify({ error: 'Only HTTP and HTTPS URLs are supported' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let result: ScanResult;

    switch (type) {
      case 'headers':
        result = await scanSecurityHeaders(targetUrl.toString(), engineerMode);
        break;
      case 'ssl':
        result = await scanSSL(targetUrl, engineerMode);
        break;
      case 'info':
        result = await scanInformationDisclosure(targetUrl.toString(), engineerMode);
        break;
      case "common":
          result = await scanCommonFiles(url, engineerMode);
          break;
      case 'advanced-headers':
        result = await scanAdvancedHeaders(targetUrl.toString(), engineerMode);
        break;
      case 'waf':
        result = await scanWAF(targetUrl.toString(), engineerMode);
        break;
      case 'subdomain':
        result = await scanSubdomains(targetUrl.toString(), engineerMode);
        break;
      case 'tech-stack':
        result = await scanTechStack(targetUrl.toString(), engineerMode);
        break;
      case 'cve':
        result = await scanCVE(targetUrl.toString(), engineerMode);
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid scan type' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Security scan error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      findings: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function scanSecurityHeaders(url: string, engineerMode?: boolean): Promise<ScanResult> {
  const findings: Finding[] = [];
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Security-Scanner/1.0'
      }
    });

    const headers = response.headers;
    console.log(`Scanning headers for ${url}`, Object.fromEntries(headers.entries()));

    // Check for important security headers
    const securityHeaders = [
      {
        name: 'Strict-Transport-Security',
        severity: 'medium' as const,
        description: 'HSTS header missing - site vulnerable to SSL stripping attacks',
        recommendation: 'Add Strict-Transport-Security header with appropriate max-age value'
      },
      {
        name: 'Content-Security-Policy',
        severity: 'high' as const,
        description: 'CSP header missing - site vulnerable to XSS attacks',
        recommendation: 'Implement Content-Security-Policy header to prevent code injection'
      },
      {
        name: 'X-Frame-Options',
        severity: 'medium' as const,
        description: 'X-Frame-Options header missing - site vulnerable to clickjacking',
        recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN header'
      },
      {
        name: 'X-Content-Type-Options',
        severity: 'low' as const,
        description: 'X-Content-Type-Options header missing - MIME type sniffing possible',
        recommendation: 'Add X-Content-Type-Options: nosniff header'
      },
      {
        name: 'Referrer-Policy',
        severity: 'low' as const,
        description: 'Referrer-Policy header missing - referrer information may leak',
        recommendation: 'Add Referrer-Policy header with appropriate value'
      }
    ];

    securityHeaders.forEach(header => {
      if (!headers.has(header.name.toLowerCase())) {
        findings.push({
          severity: header.severity,
          category: 'Security Headers',
          title: `Missing ${header.name} Header`,
          description: header.description,
          recommendation: header.recommendation
        });
      }
    });

    // Check for potentially dangerous headers
    const serverHeader = headers.get('server');
    if (serverHeader) {
      findings.push({
        severity: 'info',
        category: 'Security Headers',
        title: 'Server Information Disclosed',
        description: `Server header reveals: ${serverHeader}`,
        recommendation: 'Consider removing or obfuscating server information'
      });
    }

    const poweredByHeader = headers.get('x-powered-by');
    if (poweredByHeader) {
      findings.push({
        severity: 'low',
        category: 'Security Headers',
        title: 'Technology Stack Disclosed',
        description: `X-Powered-By header reveals: ${poweredByHeader}`,
        recommendation: 'Remove X-Powered-By header to reduce information disclosure'
      });
    }

    // Check HSTS configuration if present
    const hstsHeader = headers.get('strict-transport-security');
    if (hstsHeader) {
      const maxAge = hstsHeader.match(/max-age=(\d+)/);
      if (maxAge && parseInt(maxAge[1]) < 31536000) { // Less than 1 year
        findings.push({
          severity: 'warning',
          category: 'Security Headers',
          title: 'HSTS Max-Age Too Short',
          description: `HSTS max-age is ${maxAge[1]} seconds (recommended: 31536000+)`,
          recommendation: 'Increase HSTS max-age to at least 1 year (31536000 seconds)'
        });
      }
    }

  } catch (error) {
    findings.push({
      severity: 'warning',
      category: 'Security Headers',
      title: 'Unable to Fetch Headers',
      description: 'Could not retrieve HTTP headers for analysis',
      recommendation: 'Verify URL accessibility and network connectivity'
    });
  }

  return { findings };
}

async function scanSSL(targetUrl: URL, engineerMode?: boolean): Promise<ScanResult> {
  const findings: Finding[] = [];
  
  // Basic SSL checks that can be performed from the browser/edge
  if (targetUrl.protocol === 'http:') {
    findings.push({
      severity: 'high',
      category: 'SSL/TLS',
      title: 'Unencrypted Connection',
      description: 'Website uses HTTP instead of HTTPS',
      recommendation: 'Implement SSL/TLS encryption and redirect HTTP to HTTPS'
    });
  } else {
    // For HTTPS sites, we can do basic certificate validation
    try {
      const response = await fetch(targetUrl.toString(), {
        method: 'HEAD',
        headers: { 'User-Agent': 'Security-Scanner/1.0' }
      });
      
      // If we get here, certificate validation passed at the transport layer
      findings.push({
        severity: 'info',
        category: 'SSL/TLS',
        title: 'HTTPS Connection Successful',
        description: 'SSL/TLS certificate appears to be valid',
        recommendation: 'Consider testing with detailed SSL analysis tools for comprehensive validation'
      });
      
    } catch (error) {
      findings.push({
        severity: 'high',
        category: 'SSL/TLS',
        title: 'SSL Certificate Issue',
        description: 'Failed to establish secure connection - possible certificate problem',
        recommendation: 'Verify SSL certificate validity, expiration, and proper configuration'
      });
    }
  }

  return { findings };
}

async function scanInformationDisclosure(url: string, engineerMode?: boolean): Promise<ScanResult> {
  const findings: Finding[] = [];
  
  try {
    // Check for common information disclosure paths
    const testPaths = [
      { path: '/.env', description: 'Environment configuration file' },
      { path: '/.git/config', description: 'Git configuration file' },
      { path: '/robots.txt', description: 'Robots.txt file (informational)' },
      { path: '/.well-known/security.txt', description: 'Security policy file (positive finding)' }
    ];

    for (const test of testPaths) {
      try {
        const testUrl = new URL(test.path, url).toString();
        const response = await fetch(testUrl, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Security-Scanner/1.0' }
        });

        if (response.ok) {
          if (test.path === '/.env' || test.path === '/.git/config') {
            findings.push({
              severity: 'high',
              category: 'Information Disclosure',
              title: `Sensitive File Accessible: ${test.path}`,
              description: `${test.description} is publicly accessible`,
              recommendation: 'Restrict access to sensitive configuration files'
            });
          } else if (test.path === '/.well-known/security.txt') {
            findings.push({
              severity: 'info',
              category: 'Information Disclosure',
              title: 'Security Policy Found',
              description: 'Website has a security.txt file with security contact information',
              recommendation: 'Ensure security.txt contains current and accurate information'
            });
          }
        }
      } catch (error) {
        // Ignore individual path errors
      }
    }

    // Check main page for common information disclosure
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Security-Scanner/1.0' }
    });
    
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      const html = await response.text();
      
      // Check for common information disclosure patterns
      if (html.includes('Index of /')) {
        findings.push({
          severity: 'medium',
          category: 'Information Disclosure',
          title: 'Directory Listing Enabled',
          description: 'Web server directory listing is enabled',
          recommendation: 'Disable directory listing and implement proper access controls'
        });
      }
      
      // Check for debug information
      const debugPatterns = [
        /error_log|debug|stack trace|exception/i,
        /phpinfo\(\)|phpversion/i,
        /select \* from|mysql_|sql error/i
      ];
      
      debugPatterns.forEach((pattern, index) => {
        if (pattern.test(html)) {
          findings.push({
            severity: 'medium',
            category: 'Information Disclosure',
            title: 'Debug Information Exposed',
            description: 'Page contains debug or error information that could aid attackers',
            recommendation: 'Remove debug information from production pages'
          });
        }
      });
    }

  } catch (error) {
    findings.push({
      severity: 'info',
      category: 'Information Disclosure',
      title: 'Information Disclosure Scan Incomplete',
      description: 'Unable to complete information disclosure checks',
      recommendation: 'Manual review recommended for sensitive file exposure'
    });
  }

  return { findings };
}

async function scanCommonFiles(url: string, engineerMode?: boolean): Promise<ScanResult> {
  const findings: Finding[] = [];
  
  // Common vulnerable files and directories
  const commonPaths = [
    { path: '/admin', severity: 'medium' as const, description: 'Admin interface' },
    { path: '/login', severity: 'info' as const, description: 'Login page' },
    { path: '/wp-admin', severity: 'info' as const, description: 'WordPress admin' },
    { path: '/phpmyadmin', severity: 'high' as const, description: 'phpMyAdmin interface' },
    { path: '/backup', severity: 'high' as const, description: 'Backup directory' },
    { path: '/config', severity: 'medium' as const, description: 'Configuration directory' },
    { path: '/test', severity: 'medium' as const, description: 'Test directory' },
    { path: '/dev', severity: 'medium' as const, description: 'Development directory' },
    { path: '/.git', severity: 'high' as const, description: 'Git repository' },
    { path: '/.svn', severity: 'high' as const, description: 'SVN repository' }
  ];

  for (const test of commonPaths) {
    try {
      const testUrl = new URL(test.path, url).toString();
      const response = await fetch(testUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Security-Scanner/1.0' }
      });

      if (response.ok) {
        findings.push({
          severity: test.severity,
          category: 'Common Files',
          title: `Accessible Path: ${test.path}`,
          description: `${test.description} is publicly accessible`,
          recommendation: 'Review access controls and consider restricting public access'
        });
      }
    } catch (error) {
      // Ignore individual path errors - this is expected for most paths
      console.error('Path test error:', error);
    }
  }

  return { findings };
}

// Engineer mode scan functions
async function scanAdvancedHeaders(url: string, engineerMode?: boolean): Promise<ScanResult> {
  const findings: Finding[] = [];
  
  if (!engineerMode) return { findings };
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Security-Scanner/1.0 (Advanced Mode)' }
    });

    const headers = response.headers;
    
    // Advanced security header analysis
    const cspHeader = headers.get('content-security-policy');
    if (cspHeader) {
      // Analyze CSP for potential bypasses
      if (cspHeader.includes("'unsafe-inline'")) {
        findings.push({
          severity: 'medium',
          category: 'Advanced Headers',
          title: 'CSP allows unsafe-inline',
          description: "Content Security Policy allows 'unsafe-inline' which may enable XSS",
          recommendation: 'Use nonces or hashes instead of unsafe-inline'
        });
      }
      
      if (cspHeader.includes("'unsafe-eval'")) {
        findings.push({
          severity: 'high',
          category: 'Advanced Headers',
          title: 'CSP allows unsafe-eval',
          description: "Content Security Policy allows 'unsafe-eval' which may enable code injection",
          recommendation: 'Remove unsafe-eval from CSP directives'
        });
      }
    }
    
    // Check for security.txt
    const securityResponse = await fetch(new URL('/.well-known/security.txt', url).toString());
    if (securityResponse.ok) {
      findings.push({
        severity: 'info',
        category: 'Advanced Headers',
        title: 'Security.txt Present',
        description: 'Security contact information is available',
        recommendation: 'Verify security.txt contains current contact information'
      });
    }

  } catch (error) {
    console.error('Advanced headers scan error:', error);
  }

  return { findings };
}

async function scanWAF(url: string, engineerMode?: boolean): Promise<ScanResult> {
  const findings: Finding[] = [];
  
  if (!engineerMode) return { findings };
  
  try {
    // Test common WAF detection patterns
    const testPayloads = [
      { payload: '?test=<script>alert(1)</script>', name: 'XSS Test' },
      { payload: "?test=' OR 1=1--", name: 'SQL Injection Test' },
      { payload: '?test=../../../etc/passwd', name: 'Path Traversal Test' }
    ];
    
    for (const test of testPayloads) {
      try {
        const testUrl = url + test.payload;
        const response = await fetch(testUrl, {
          headers: { 'User-Agent': 'Security-Scanner/1.0' }
        });
        
        // Common WAF response indicators
        if (response.status === 403 || response.status === 406) {
          const serverHeader = response.headers.get('server') || '';
          
          if (serverHeader.toLowerCase().includes('cloudflare')) {
            findings.push({
              severity: 'info',
              category: 'WAF Detection',
              title: 'Cloudflare WAF Detected',
              description: `WAF blocked ${test.name} payload`,
              recommendation: 'WAF is properly configured - consider additional testing'
            });
            break;
          }
        }
      } catch (error) {
        console.error('WAF test error:', error);
      }
    }

  } catch (error) {
    console.error('WAF scan error:', error);
  }

  return { findings };
}

async function scanSubdomains(url: string, engineerMode?: boolean): Promise<ScanResult> {
  const findings: Finding[] = [];
  
  if (!engineerMode) return { findings };
  
  try {
    const domain = new URL(url).hostname;
    
    // Basic subdomain enumeration (limited for demo)
    findings.push({
      severity: 'info',
      category: 'Subdomain Enumeration',
      title: 'Subdomain Discovery',
      description: `Target domain: ${domain}`,
      recommendation: 'Use tools like amass, subfinder, or assetfinder for comprehensive enumeration'
    });

  } catch (error) {
    console.error('Subdomain scan error:', error);
  }

  return { findings };
}

async function scanTechStack(url: string, engineerMode?: boolean): Promise<ScanResult> {
  const findings: Finding[] = [];
  
  if (!engineerMode) return { findings };
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Security-Scanner/1.0' }
    });
    
    const headers = response.headers;
    const html = await response.text();
    
    // Server fingerprinting
    const serverHeader = headers.get('server');
    if (serverHeader) {
      findings.push({
        severity: 'info',
        category: 'Technology Stack',
        title: 'Server Technology Detected',
        description: `Server: ${serverHeader}`,
        recommendation: 'Consider hiding server version information'
      });
    }
    
    // Framework detection
    const frameworks = [
      { pattern: /WordPress/i, name: 'WordPress' },
      { pattern: /Drupal/i, name: 'Drupal' },
      { pattern: /React/i, name: 'React' },
      { pattern: /Vue\.js/i, name: 'Vue.js' },
      { pattern: /Angular/i, name: 'Angular' }
    ];
    
    frameworks.forEach(framework => {
      if (framework.pattern.test(html)) {
        findings.push({
          severity: 'info',
          category: 'Technology Stack',
          title: `${framework.name} Detected`,
          description: `Application appears to use ${framework.name}`,
          recommendation: 'Ensure framework is updated to latest secure version'
        });
      }
    });

  } catch (error) {
    console.error('Tech stack scan error:', error);
  }

  return { findings };
}

async function scanCVE(url: string, engineerMode?: boolean): Promise<ScanResult> {
  const findings: Finding[] = [];
  
  if (!engineerMode) return { findings };
  
  try {
    // Simulated CVE analysis (would require actual CVE database in production)
    findings.push({
      severity: 'info',
      category: 'CVE Analysis',
      title: 'CVE Database Check',
      description: 'Cross-reference with known vulnerabilities requires additional context',
      recommendation: 'Use tools like Nuclei or integrate with CVE databases for comprehensive analysis'
    });

  } catch (error) {
    console.error('CVE scan error:', error);
  }

  return { findings };
}
