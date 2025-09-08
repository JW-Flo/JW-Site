import { EnhancedFinding } from './types';

// Constants
export const MAX_URL_LENGTH = 2048;
export const BUILD_SUPER_ADMIN_KEY = 'atlasit-super-admin-key';

// Business metrics calculation
export function calculateBusinessMetrics(findings: EnhancedFinding[]) {
  let trustScore = 100;
  let professionalismScore = 100;
  let userExperienceScore = 100;
  let brandProtectionScore = 100;
  
  findings.forEach(finding => {
    const impact = {
      'critical': -20,
      'high': -15,
      'medium': -10,
      'low': -5,
      'warning': -3,
      'info': 0,
      'excellent': +5
    };
    
    const reduction = impact[finding.severity] || 0;
    
    // Apply different weights to different categories
    if (finding.category.includes('SSL') || finding.category.includes('Security')) {
      trustScore += reduction;
      brandProtectionScore += reduction;
    }
    
    if (finding.category.includes('Performance') || finding.category.includes('Accessibility')) {
      userExperienceScore += reduction;
      professionalismScore += reduction * 0.5;
    }
    
    if (finding.category.includes('Privacy') || finding.category.includes('Content')) {
      brandProtectionScore += reduction;
      trustScore += reduction * 0.5;
    }
    
    if (finding.category.includes('SEO') || finding.category.includes('Social')) {
      professionalismScore += reduction;
    }
  });
  
  return {
    trustScore: Math.max(0, Math.min(100, trustScore)),
    professionalismScore: Math.max(0, Math.min(100, professionalismScore)),
    userExperienceScore: Math.max(0, Math.min(100, userExperienceScore)),
    brandProtectionScore: Math.max(0, Math.min(100, brandProtectionScore))
  };
}

// Security score calculation
export function calculateSecurityScore(findings: EnhancedFinding[]): number {
  const severityWeights = {
    'critical': -20,
    'high': -15,
    'medium': -10,
    'low': -5,
    'warning': -3,
    'info': 0,
    'excellent': 10
  };

  let totalScore = 100;
  for (const finding of findings) {
    totalScore += severityWeights[finding.severity] || 0;
  }

  return Math.max(0, Math.min(100, totalScore));
}

// URL validation
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);

    if (url.length > MAX_URL_LENGTH) {
      return { isValid: false, error: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters` };
    }

    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

// Generate scan ID
export function generateScanId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
