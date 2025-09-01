import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Regression: ensure trigger button markup & styles exist

describe('Arcade trigger styles', () => {
  it('BaseLayout contains game trigger button element', () => {
    const layoutPath = path.join(process.cwd(), 'src/layouts/BaseLayout.astro');
    const src = fs.readFileSync(layoutPath, 'utf-8');
    expect(src).toContain('id="game-trigger"');
    expect(src).toContain('class="game-trigger-button"');
  });
  it('global.css defines trigger styles', () => {
    const cssPath = path.join(process.cwd(), 'src/styles/global.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.game-trigger-container\s*{/);
    expect(css).toMatch(/\.game-trigger-button\s*{/);
  });
});
