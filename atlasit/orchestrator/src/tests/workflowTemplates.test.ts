import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templatesRoot = join(__dirname, '..', '..', 'templates');

const knownConnectorAliases = new Set([
  'activeDirectory',
  'office365',
  'slack',
  'jira',
  'confluence',
  'google-workspace',
  'slack-enterprise',
  'dropbox',
  'dropbox-business',
  'paycom-manual',
]);

const collectTemplateFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      return collectTemplateFiles(full);
    }
    return extname(entry) === '.json' ? [full] : [];
  });
};

describe('Workflow templates', () => {
  const templateFiles = collectTemplateFiles(templatesRoot);

  templateFiles.forEach((file) => {
    it(`validates ${relative(templatesRoot, file)}`, () => {
      const content = readFileSync(file, 'utf-8');
      let parsed: any;
      expect(() => {
        parsed = JSON.parse(content);
      }).not.toThrow();

      expect(parsed).toBeTruthy();
      if (typeof parsed.name !== 'string') {
        // Skip non-standard definitions (e.g., Flowweave examples)
        return;
      }

      const resources = (parsed.resources?.connectors ?? {}) as Record<string, string>;
      Object.entries(resources).forEach(([alias, value]) => {
        expect(typeof value).toBe('string');
        const expectedToken = `{{connectors.${alias}}}`;
        expect(value.includes(expectedToken)).toBe(true);
      });

      const registeredAliases = new Set(Object.keys(resources));
      const allowedAliases = new Set([...knownConnectorAliases, ...registeredAliases]);

      (parsed.cards ?? []).forEach((card: any) => {
        const connectorAlias = card?.config?.connector;
        if (typeof connectorAlias === 'string') {
          expect(allowedAliases.has(connectorAlias)).toBe(true);
        }
      });
    });
  });
});
