import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const FEATURES_DIR = path.resolve(__dirname);

function isPageFile(relPath: string): boolean {
  return relPath.endsWith('.tsx') && !relPath.endsWith('.test.tsx') && !relPath.endsWith('.test.ts');
}

function collectPageFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectPageFiles(full));
    } else if (isPageFile(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const FORBIDDEN_PATTERNS = [
  /@\/mocks\/fixtures/,
  /\.\.\/mocks\/fixtures/,
  /src\/mocks\/fixtures/,
];

describe('fixture boundary', () => {
  it('no page file imports from mocks/fixtures', () => {
    const pageFiles = collectPageFiles(FEATURES_DIR);
    const violations: string[] = [];

    for (const file of pageFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          violations.push(`${path.relative(FEATURES_DIR, file)} matches ${pattern}`);
        }
      }
    }

    expect(violations, `Fixture imports found in page files:\n${violations.join('\n')}`).toHaveLength(0);
  });
});