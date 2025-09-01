import { readFileSync } from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

// This tests build-time redirect fallback HTML and presence of redirect code in legacy page

describe('legacy security-scanner redirect', () => {
  it('contains redirect helper exporting GET()', () => {
    const filePath = path.join(process.cwd(), 'src/pages/security-scanner.astro');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/redirect\('\/enhanced-security-scanner'/);
    expect(content).toMatch(/export async function GET/);
  });
  it('contains meta refresh fallback for non-JS clients', () => {
    const filePath = path.join(process.cwd(), 'src/pages/security-scanner.astro');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/meta http-equiv="refresh"/i);
  });
});
