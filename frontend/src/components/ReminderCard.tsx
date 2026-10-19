import React, { useState } from 'react';
import { BellRing, CalendarPlus } from 'lucide-react';

/** Today's date where the person is, as YYYY-MM-DD, so the reminder starts today in their time zone. */
function localDate(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * A daily nudge with no servers involved: a repeating event in the person's own calendar.
 * Tapping the event opens a new thought.
 */
export const ReminderCard: React.FC = () => {
  const [time, setTime] = useState('20:00');
  const href = `/api/reminder.ics?time=${encodeURIComponent(time)}&date=${localDate()}`;

  return (
    <div className="bg-garden-card border border-garden-line rounded-2xl p-5 sm:p-6 space-y-3">
      <h3 className="font-serif text-2xl font-semibold text-garden-ink flex items-center gap-2">
        <BellRing className="w-5 h-5 text-garden-moss" />
        Daily reminder
      </h3>
      <p className="text-sm text-garden-ink-soft">
        Add a gentle daily nudge to your calendar. Tap it when it pops up to plant a thought.
      </p>
      <div className="flex flex-wrap items-center gap-2.5">
        <label htmlFor="reminder-time" className="text-sm text-garden-ink-soft">
          Every day at
        </label>
        <input
          id="reminder-time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value || '20:00')}
          className="px-3 py-1.5 rounded-xl bg-[#FDFBF3] border border-garden-line text-sm text-garden-ink focus:outline-none focus:border-garden-moss"
        />
        <a
          href={href}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-garden-moss hover:bg-garden-moss-dark text-garden-paper rounded-full text-sm font-semibold transition-transform active:scale-95"
        >
          <CalendarPlus className="w-4 h-4" />
          Add to my calendar
        </a>
      </div>
      <p className="text-xs text-garden-ink-faint">To stop it, delete the event in your calendar.</p>
    </div>
  );
};
