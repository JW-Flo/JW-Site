import type { Finding } from './scanTypes.js';

export function computeScores(findings: Finding[]) {
  let base = 100;
  let tech = 100;
  findings.forEach(f => {
    switch (f.severity) {
      case 'critical': base -= 25; tech -= 30; break;
      case 'high': base -= 15; tech -= 20; break;
      case 'medium': base -= 8; tech -= 10; break;
      case 'low': base -= 4; tech -= 5; break;
      case 'warning': base -= 2; tech -= 2; break;
    }
  });
  base = Math.max(0, base);
  tech = Math.max(0, tech);
  return { businessScore: base, technicalScore: tech };
}
