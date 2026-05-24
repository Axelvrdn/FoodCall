import { describe, expect, it } from 'vitest';
import { formatBudget, formatDistance } from './formatters';
import { parseBudget, parseCoords } from './parsers';
import { validatePassword } from './validators';

describe('FoodCall utilities', () => {
  it('formats French distances and budgets', () => {
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(1250)).toBe('1,3 km');
    expect(formatBudget('15.00')).toBe('15,00 €');
  });
  it('parses API string values at the boundary', () => {
    expect(parseCoords('48.856600', '2.352200')).toEqual({ lat: 48.8566, lng: 2.3522 });
    expect(parseBudget('15.00')).toBe(15);
    expect(() => parseCoords('', '')).toThrow('Coordonnées invalides');
  });
  it('validates API password rules', () => {
    expect(validatePassword('Weak').valid).toBe(false);
    expect(validatePassword('ValidPass123!').valid).toBe(true);
  });
});
