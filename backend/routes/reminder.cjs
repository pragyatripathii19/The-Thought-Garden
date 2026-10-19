const express = require('express');
const crypto = require('crypto');

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Text values in a calendar file escape backslashes, commas, semicolons and newlines. */
const escapeText = (s) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

/**
 * A daily "Plant a thought" event. The time has no zone, so calendars keep it at that
 * time wherever the person is; tapping the event's link opens a new thought.
 */
function buildReminderIcs({ time, date, appUrl, now = new Date(), uid = crypto.randomUUID() }) {
  const [, hh, mm] = TIME.exec(time);
  const [, y, mo, d] = DATE.exec(date);
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Thought Garden//Daily reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@thought-garden`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${y}${mo}${d}T${hh}${mm}00`,
    'DURATION:PT5M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:Plant a thought',
    `DESCRIPTION:${escapeText(`A minute in your Thought Garden: ${appUrl}`)}`,
    `URL:${appUrl}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Plant a thought',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Calendar files keep lines to 75 characters; longer ones continue on the next line after a space. */
function fold(line) {
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(' ' + line.slice(i, i + 74));
  return parts.join('\r\n');
}

/** GET /api/reminder.ics?time=20:00&date=2026-10-19 — no account needed; it holds nothing personal. */
function reminderRoutes() {
  const router = express.Router();
  router.get('/reminder.ics', (req, res) => {
    const time = String(req.query.time || '20:00');
    const date = String(req.query.date || new Date().toISOString().slice(0, 10));
    if (!TIME.test(time) || !DATE.test(date)) {
      return res.status(400).json({ error: 'Choose a time like 20:00.' });
    }
    const appUrl = `${req.protocol}://${req.get('host')}/?new=1`;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="thought-garden-reminder.ics"');
    res.send(buildReminderIcs({ time, date, appUrl }));
  });
  return router;
}

module.exports = { reminderRoutes, buildReminderIcs };
