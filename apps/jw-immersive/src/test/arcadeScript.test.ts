import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('BaseLayout arcade script inclusion', () => {
  it('includes public retro arcade script reference', () => {
    const filePath = path.join(process.cwd(), 'src/layouts/BaseLayout.astro');
    const src = fs.readFileSync(filePath, 'utf-8');
    expect(src).toContain('src="/retro-arcade.js"');
    expect(src).not.toContain('/src/scripts/retro-arcade.client.js');
  });
});
