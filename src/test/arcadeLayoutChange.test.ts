import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Arcade layout updates', () => {
  const layoutPath = path.join(process.cwd(), 'src/layouts/BaseLayout.astro');
  const cssPath = path.join(process.cwd(), 'src/styles/global.css');

  it('leaderboard markup removed or commented out', () => {
    const src = fs.readFileSync(layoutPath, 'utf-8');
    // Remove Astro JSX comment blocks {/** ... */}
    const withoutAstroComments = src.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    const activeLeaderboard = /<div id="leaderboard"[^>]*>/g.test(withoutAstroComments);
    expect(activeLeaderboard).toBe(false);
  });

  it('trigger container now uses bottom positioning in CSS', () => {
    const css = fs.readFileSync(cssPath, 'utf-8');
    const regex = /\.game-trigger-container\s*{[^}]*}/g;
    const containerBlockMatch = regex.exec(css);
    expect(containerBlockMatch).toBeTruthy();
    if (containerBlockMatch) {
      const block = containerBlockMatch[0];
      expect(/bottom:\s*1rem/.test(block)).toBe(true);
      expect(/top:\s*1rem/.test(block)).toBe(false);
    }
  });
});
