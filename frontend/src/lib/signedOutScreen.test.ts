import { describe, it, expect } from 'vitest';
import { hashForScreen, screenFromHash, initialScreen } from './signedOutScreen';

describe('signed-out screens', () => {
  it('maps hashes to screens and back', () => {
    expect(screenFromHash('#signup')).toBe('signup');
    expect(screenFromHash('#login')).toBe('login');
    expect(screenFromHash('')).toBe('landing');
    expect(screenFromHash('#somewhere')).toBe('landing');
    for (const s of ['landing', 'signup', 'login'] as const) expect(screenFromHash(hashForScreen(s))).toBe(s);
  });

  it('opens new visitors on the landing page', () => {
    expect(initialScreen('', false)).toBe('landing');
  });

  it('sends returning visitors straight to Log in', () => {
    expect(initialScreen('', true)).toBe('login');
  });

  it('follows a #signup or #login link either way', () => {
    expect(initialScreen('#signup', true)).toBe('signup');
    expect(initialScreen('#login', false)).toBe('login');
  });
});
