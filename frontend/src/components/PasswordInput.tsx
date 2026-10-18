import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

/**
 * A password field with an eye button to show or hide what's typed.
 * The password goes back to hidden whenever its form is submitted.
 */
export const PasswordInput: React.FC<PasswordInputProps> = ({ className = '', ...props }) => {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const hide = () => setVisible(false);
    form.addEventListener('submit', hide);
    return () => form.removeEventListener('submit', hide);
  }, []);

  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="relative">
      <input {...props} ref={inputRef} type={visible ? 'text' : 'password'} className={`${className} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        // Keep focus (and the cursor) in the field while toggling.
        onMouseDown={(e) => e.preventDefault()}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={props.id}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-garden-ink-faint hover:text-garden-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-garden-pill"
      >
        <Icon className="w-4 h-4" />
      </button>
    </div>
  );
};
