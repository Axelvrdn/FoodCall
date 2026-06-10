export function validateEmail(email: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const rules: Array<[boolean, string]> = [
    [password.length >= 12, '12 caractères minimum'],
    [/[A-Z]/.test(password), 'une majuscule'],
    [/[a-z]/.test(password), 'une minuscule'],
    [/\d/.test(password), 'un chiffre'],
    [/[^A-Za-z0-9]/.test(password), 'un symbole'],
  ];
  const errors = rules.filter(([ok]) => !ok).map(([, message]) => message);
  return { valid: errors.length === 0, errors };
}

export function validateInviteCode(code: string): boolean { return /^[A-Z0-9]{8}$/.test(code); }
