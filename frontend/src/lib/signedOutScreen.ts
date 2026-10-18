/** What someone who isn't logged in sees: the landing page, or the sign-up / log-in form. */
export type SignedOutScreen = 'landing' | 'signup' | 'login';

/** The URL hash for each screen; the landing page has none. */
export function hashForScreen(screen: SignedOutScreen): string {
  return screen === 'landing' ? '' : `#${screen}`;
}

/** Reads the screen from a URL hash. Anything unknown is the landing page. */
export function screenFromHash(hash: string): SignedOutScreen {
  if (hash === '#signup') return 'signup';
  if (hash === '#login') return 'login';
  return 'landing';
}

/**
 * The screen to open on a fresh visit. A link to #signup or #login wins;
 * otherwise someone who has signed in on this browser before goes straight to Log in.
 */
export function initialScreen(hash: string, returning: boolean): SignedOutScreen {
  const fromHash = screenFromHash(hash);
  if (fromHash !== 'landing') return fromHash;
  return returning ? 'login' : 'landing';
}
