import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Scan button accessibility', () => {
  it('has an aria-label for screen readers', () => {
    const layoutPath = path.join(process.cwd(), 'src/layouts/BaseLayout.astro');
    const src = fs.readFileSync(layoutPath, 'utf-8');
    const anchorRegex = /<a[^>]+href="\/enhanced-security-scanner"[^>]*aria-label="Open Enhanced Security Scanner"/;
    expect(anchorRegex.test(src)).toBe(true);
  });
});
