import { useEffect, useState } from 'react';

/**
 * Adding the app to the home screen.
 * - 'installed': already running as the installed app.
 * - 'prompt': the browser can install it with one tap (Chrome / Edge on Android and laptops).
 * - 'ios': iPhone or iPad, where it's added by hand from the Share menu.
 * - 'unavailable': this browser can't install it (e.g. Firefox on a laptop).
 */
export type InstallState = 'installed' | 'prompt' | 'ios' | 'unavailable';

/** iPhone, iPod or iPad (iPadOS reports itself as a Mac with a touch screen). */
export function isAppleMobile(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true;
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

export function installState(opts: { standalone: boolean; canPrompt: boolean; appleMobile: boolean }): InstallState {
  if (opts.standalone) return 'installed';
  if (opts.canPrompt) return 'prompt';
  if (opts.appleMobile) return 'ios';
  return 'unavailable';
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// The browser offers installing once, early, so listen from startup (see main.tsx).
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installedNow = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function listenForInstall() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // We show our own button instead of the browser's banner.
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installedNow = true;
    notify();
  });
}

function currentState(): InstallState {
  const standalone =
    installedNow ||
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return installState({
    standalone,
    canPrompt: deferredPrompt !== null,
    appleMobile: isAppleMobile(navigator.userAgent, navigator.maxTouchPoints || 0),
  });
}

/** The install state, and install() for when the browser can do it in one tap. */
export function useInstall() {
  const [state, setState] = useState<InstallState>(currentState);

  useEffect(() => {
    const update = () => setState(currentState());
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    const prompt = deferredPrompt;
    deferredPrompt = null; // Each offer can be used once.
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    notify();
    return outcome === 'accepted';
  };

  return { state, install };
}
