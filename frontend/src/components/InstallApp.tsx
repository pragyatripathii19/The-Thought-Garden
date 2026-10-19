import React, { useState } from 'react';
import { Smartphone, Share, SquarePlus, Download, X, Check } from 'lucide-react';
import { useInstall } from '../lib/install';

const DISMISSED_KEY = 'thought_garden_install_card_dismissed';

const buttonClass =
  'inline-flex items-center gap-1.5 px-4 py-2 bg-garden-moss hover:bg-garden-moss-dark text-garden-paper rounded-full text-sm font-semibold transition-transform active:scale-95';

/** Share → Add to Home Screen, the way it's done on iPhone and iPad. */
const IosSteps: React.FC = () => (
  <ol className="space-y-1.5 text-sm text-garden-ink-soft">
    <li className="flex items-center gap-2">
      <span className="w-5 text-center font-semibold text-garden-ink">1</span>
      In Safari, tap <Share className="w-4 h-4 text-garden-moss" aria-label="Share" /> Share
    </li>
    <li className="flex items-center gap-2">
      <span className="w-5 text-center font-semibold text-garden-ink">2</span>
      Choose <SquarePlus className="w-4 h-4 text-garden-moss" aria-hidden="true" /> Add to Home Screen
    </li>
  </ol>
);

/** A gentle, dismissible nudge on Home, shown only where the app can be added. */
export const InstallHomeCard: React.FC = () => {
  const { state, install } = useInstall();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed || (state !== 'prompt' && state !== 'ios')) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Storage unavailable: it just shows again next time.
    }
  };

  return (
    <div className="relative mb-6 bg-garden-card border border-garden-line rounded-2xl p-4 sm:p-5 flex gap-3.5 shadow-soft">
      <span className="w-10 h-10 shrink-0 rounded-2xl bg-garden-pill/60 border border-[#CBD5AE] text-garden-moss flex items-center justify-center">
        <Smartphone className="w-5 h-5" />
      </span>
      <div className="space-y-2.5 pr-6">
        <div>
          <p className="font-serif text-xl font-semibold text-garden-ink">Keep your garden one tap away</p>
          <p className="text-sm text-garden-ink-soft">Add it to your home screen and it opens like an app.</p>
        </div>
        {state === 'prompt' ? (
          <button type="button" onClick={install} className={buttonClass}>
            <Download className="w-4 h-4" />
            Install app
          </button>
        ) : (
          <IosSteps />
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        title="Not now"
        className="absolute top-3 right-3 p-1 rounded-lg text-garden-ink-faint hover:text-garden-ink"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/** Settings: how to add the app, whatever the device. */
export const InstallSettingsCard: React.FC = () => {
  const { state, install } = useInstall();

  return (
    <div className="bg-garden-card border border-garden-line rounded-2xl p-5 sm:p-6 space-y-3">
      <h3 className="font-serif text-2xl font-semibold text-garden-ink flex items-center gap-2">
        <Smartphone className="w-5 h-5 text-garden-moss" />
        Get the app
      </h3>
      {state === 'installed' && (
        <p className="text-sm text-garden-ink-soft flex items-center gap-2">
          <Check className="w-4 h-4 text-garden-moss" />
          You're using the app. Open it from your home screen any time.
        </p>
      )}
      {state === 'prompt' && (
        <>
          <p className="text-sm text-garden-ink-soft">Add The Thought Garden to this device. It opens in its own window, like an app.</p>
          <button type="button" onClick={install} className={buttonClass}>
            <Download className="w-4 h-4" />
            Install app
          </button>
        </>
      )}
      {state === 'ios' && (
        <>
          <p className="text-sm text-garden-ink-soft">Add it to your home screen and it opens like an app.</p>
          <IosSteps />
          <p className="text-xs text-garden-ink-faint">You'll log in once more inside the app.</p>
        </>
      )}
      {state === 'unavailable' && (
        <p className="text-sm text-garden-ink-soft">
          On your phone, open this site in Safari (iPhone) or Chrome (Android) and add it to your home screen. It opens
          like an app.
        </p>
      )}
    </div>
  );
};
