import React, { useState } from 'react';
import { Sprout, ArrowRight, CloudOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ReasonPicker } from '../components/ReasonPicker';
import { SeedToSproutAnimation } from '../components/BotanicalIllustrations';
import { ART } from '../lib/art';
import { joinReasons } from '../lib/profileReasons';
import { suggestCollectionIcon } from '../lib/collectionIcons';

const inputClass =
  'w-full px-4 py-3 rounded-2xl bg-garden-card border border-garden-line text-garden-ink placeholder-garden-ink-faint text-sm focus:outline-none focus:border-garden-moss focus:ring-2 focus:ring-garden-pill/60 transition-all';
const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-garden-ink-soft';

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-screen flex items-center justify-center px-4 pt-10 pb-40 font-sans text-garden-ink overflow-hidden">
    {/* A meadow along the bottom of the page */}
    <img
      src={ART.meadow}
      alt=""
      aria-hidden="true"
      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160%] sm:w-full max-w-none sm:max-w-[1400px] opacity-90 pointer-events-none select-none"
    />
    <div className="relative z-10 sm:bg-garden-card/90 sm:border sm:border-garden-line rounded-3xl w-full max-w-lg sm:p-8 sm:shadow-soft-lg space-y-6">
      {children}
    </div>
  </div>
);

const Emblem: React.FC = () => (
  <div className="w-12 h-12 rounded-2xl bg-garden-pill/60 border border-[#CBD5AE] text-garden-moss flex items-center justify-center mx-auto">
    <Sprout className="w-6 h-6" />
  </div>
);

/** Shown while checking the session, and when the server can't be reached. */
export const AuthStatusScreen: React.FC<{ status: 'loading' | 'unreachable'; onRetry: () => void }> = ({
  status,
  onRetry,
}) => (
  <Shell>
    {status === 'loading' ? (
      <div className="flex flex-col items-center gap-3 py-8 text-sm text-garden-ink-soft" role="status">
        <SeedToSproutAnimation className="w-8 h-8 text-garden-moss" />
        <span>Opening your garden…</span>
      </div>
    ) : (
      <div className="text-center space-y-4 py-4">
        <div className="w-12 h-12 rounded-2xl bg-[#f7efe4] text-[#a46343] flex items-center justify-center mx-auto">
          <CloudOff className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-[32px] font-semibold">Can't reach the garden</h1>
        <p className="text-sm text-garden-ink-soft">
          The server isn't responding. It may be waking up, which can take up to a minute. Check your connection and
          try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-full bg-garden-moss hover:bg-garden-moss-dark text-garden-paper text-sm font-medium"
        >
          Try again
        </button>
      </div>
    )}
  </Shell>
);

export const AuthView: React.FC = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reasons, setReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const switchMode = () => {
    setMode(isSignup ? 'login' : 'signup');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    try {
      setIsSubmitting(true);
      if (isSignup) {
        await signup({
          email: email.trim(),
          password,
          name: name.trim(),
          // Starter collections follow these; a free-text answer gets its own collection.
          reasons: joinReasons(reasons, customReason),
          customReasonIcon: customReason.trim() ? suggestCollectionIcon(customReason) : undefined,
          // Smart organising is on by default; it can be switched off in Settings.
          smartOrganizing: true,
        });
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="text-center space-y-2">
        <Emblem />
        <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold text-garden-ink">
          {isSignup ? 'Welcome to The Thought Garden' : 'Welcome back'}
        </h1>
        <p className="text-xs sm:text-sm text-garden-ink-soft">
          {isSignup
            ? 'Every thought has a home. Create your account to start your garden.'
            : 'Log in to pick up where you left off.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isSignup && (
          <div className="space-y-1.5">
            <label htmlFor="auth-name" className={labelClass}>
              What should we call you?
            </label>
            <input
              id="auth-name"
              type="text"
              required
              autoComplete="name"
              maxLength={80}
              placeholder="Your first name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="auth-email" className={labelClass}>
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="auth-password" className={labelClass}>
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            required
            minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            placeholder={isSignup ? 'At least 8 characters' : ''}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {isSignup && (
          <div className="space-y-2">
            <span className={labelClass}>Why are you growing a garden? (optional)</span>
            <ReasonPicker
              selected={reasons}
              onChange={setReasons}
              custom={customReason}
              onCustomChange={setCustomReason}
              customHint="We’ll start a collection for it in your garden."
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs text-[#7a2e2e] bg-[#fff1f1] border border-[#f1c9c9] rounded-2xl p-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-5 rounded-full bg-garden-moss hover:bg-garden-moss-dark disabled:opacity-40 disabled:cursor-not-allowed text-garden-paper font-medium text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <SeedToSproutAnimation className="w-5 h-5 text-garden-paper" />
              <span>{isSignup ? 'Preparing your garden…' : 'Logging in…'}</span>
            </>
          ) : (
            <>
              <span>{isSignup ? 'Create my garden' : 'Log in'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="space-y-3 text-center">
        <p className="text-xs text-garden-ink-soft">
          {isSignup ? 'Already have a garden?' : 'New here?'}{' '}
          <button type="button" onClick={switchMode} className="font-semibold text-garden-moss underline underline-offset-2">
            {isSignup ? 'Log in' : 'Create an account'}
          </button>
        </p>
        {!isSignup && (
          <p className="text-[11px] text-garden-ink-faint">Forgot your password? Ask the person who invited you to reset it.</p>
        )}
        <p className="text-[11px] text-garden-ink-faint leading-relaxed">
          Your thoughts are saved to your account on the Thought Garden server, so they're safe if you clear your
          browser or switch devices. Only you can see them in the app, though whoever runs the server can access the
          database.
        </p>
      </div>
    </Shell>
  );
};
