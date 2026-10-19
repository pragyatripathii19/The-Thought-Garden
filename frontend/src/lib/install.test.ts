import { describe, it, expect } from 'vitest';
import { isAppleMobile, installState } from './install';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';

describe('adding the app to the home screen', () => {
  it('recognises iPhones and iPads, including iPads that report a Mac', () => {
    expect(isAppleMobile(IPHONE, 5)).toBe(true);
    expect(isAppleMobile(IPAD, 5)).toBe(true);
    expect(isAppleMobile(IPAD, 0)).toBe(false); // a real Mac
    expect(isAppleMobile(ANDROID, 5)).toBe(false);
  });

  it('says installed when already running as the app', () => {
    expect(installState({ standalone: true, canPrompt: true, appleMobile: true })).toBe('installed');
  });

  it('prefers the one-tap install when the browser offers it', () => {
    expect(installState({ standalone: false, canPrompt: true, appleMobile: false })).toBe('prompt');
  });

  it('falls back to the Share-menu steps on iPhone', () => {
    expect(installState({ standalone: false, canPrompt: false, appleMobile: true })).toBe('ios');
  });

  it('is unavailable elsewhere', () => {
    expect(installState({ standalone: false, canPrompt: false, appleMobile: false })).toBe('unavailable');
  });
});
