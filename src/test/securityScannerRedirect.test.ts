import { readFileSync } from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

// Tests for legacy /security-scanner page now acting purely as a 301 redirect with fallback HTML.

describe('legacy security-scanner redirect', () => {
  const filePath = path.join(process.cwd(), 'src/pages/security-scanner.astro');
  const content = readFileSync(filePath, 'utf-8');

  it('exports GET and POST handlers returning permanent redirect (301/308) with Location header', () => {
    expect(content).toMatch(/export async function GET/);
    expect(content).toMatch(/export async function POST/);
    // Ensure Location header for enhanced scanner is present
    expect(content).toMatch(/Location: '\/enhanced-security-scanner'/);
    // Accept either 301 or 308 status codes (current implementation uses 308)
    expect(/status: 30[18]/.test(content)).toBe(true);
    // Ensure prerender is disabled for runtime redirect
    expect(content).toMatch(/export const prerender = false/);
  });

  it('contains meta refresh fallback pointing to enhanced scanner', () => {
    // The html string escapes quotes inside the template literal, so look for http-equiv=\"refresh\"
    expect(content).toMatch(/http-equiv=\\"refresh\\"/i);
    expect(content).toMatch(/url=\/enhanced-security-scanner/);
  });
});
