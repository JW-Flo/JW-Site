import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Simple static render test: ensure the input does NOT contain chalant.net value by default
// (We are not executing the client JS here; just inspecting source.)

describe('Enhanced Security Scanner initial HTML', () => {
  it('does not prefill chalant.net in target-url input', () => {
    const filePath = path.join(process.cwd(), 'src/pages/enhanced-security-scanner.astro');
    const src = fs.readFileSync(filePath, 'utf-8');
    // Ensure placeholder updated
    expect(src).toContain('placeholder="https://example.com/"');
    // Ensure no hard-coded value attribute with chalant.net
    // (Value is added dynamically only in super admin mode).
    expect(src).not.toMatch(/value\s*=\s*"https:\/\/www\.chalant\.net\/"/);
  });
});
