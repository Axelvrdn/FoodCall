import { describe, it, expect } from 'vitest';

const pageModules = import.meta.glob('../features/**/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const FORBIDDEN_PATTERNS = [
  /@\/mocks\/fixtures/,
  /\.\.\/mocks\/fixtures/,
  /src\/mocks\/fixtures/,
];

function isPageFile(relPath: string): boolean {
  return relPath.endsWith('.tsx') && !relPath.endsWith('.test.tsx');
}

describe('fixture boundary', () => {
  it('no page file imports from mocks/fixtures', () => {
    const violations: string[] = [];

    for (const [relPath, content] of Object.entries(pageModules)) {
      if (!isPageFile(relPath)) continue;
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${relPath} matches ${pattern}`);
        }
      }
    }

    expect(violations, `Fixture imports found in page files:\n${violations.join('\n')}`).toHaveLength(0);
  });
});