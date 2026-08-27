import { getStorage } from './storage.js';
import { getSettings } from './settings-store.js';
import { calculatePrayerTimes } from './prayer-times.js';
import { NOTIFIABLE_PRAYERS, getNotificationSettings } from './notification-settings.js';

const PREFIX = 'notif:';

const LABELS = Object.fromEntries(NOTIFIABLE_PRAYERS.map(p => [p.key, p.label]));

export function isNotificationAlarm(name) {
  return typeof name === 'string' && name.startsWith(PREFIX);
}

async function clearNotificationAlarms() {
  const alarms = await chrome.alarms.getAll();
  await Promise.all(
    alarms.filter(a => isNotificationAlarm(a.name)).map(a => chrome.alarms.clear(a.name))
  );
}

/** Wipe and rebuild every upcoming prayer alarm. Safe to call repeatedly. */
export async function scheduleNotifications() {
  try {
    await clearNotificationAlarms();

    const notif = await getNotificationSettings();
    if (!notif.enabled) return;

    const [{ location }, settings] = await Promise.all([
      getStorage('location'),
      getSettings(),
    ]);
    if (!location) return;

    const now = new Date();
    const leadMs = (notif.leadTime ?? 0) * 60000;

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const today = calculatePrayerTimes(location, now, settings);
    const next = calculatePrayerTimes(location, tomorrow, settings);

    for (const { key } of NOTIFIABLE_PRAYERS) {
      if (!notif.prayers[key]) continue;

      let when = today[key].getTime() - leadMs;
      if (when <= now.getTime()) when = next[key].getTime() - leadMs;
      if (when <= now.getTime()) continue;

      chrome.alarms.create(PREFIX + key, { when });
    }
  } catch (err) {
    console.error('Scheduling notifications failed:', err);
  }
}

/** Fire the desktop notification for a triggered alarm. */
export async function handleNotificationAlarm(name) {
  const key = name.slice(PREFIX.length);
  const label = LABELS[key];
  if (!label) return;

  const notif = await getNotificationSettings();
  if (!notif.enabled || !notif.prayers[key]) return;

  const lead = notif.leadTime ?? 0;
  const message = lead === 0
    ? `It is time for ${label}.`
    : `${label} is in ${lead} minutes.`;

  chrome.notifications.create(`${PREFIX}${key}:${Date.now()}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('media/moon.png'),
    title: 'Miqat',
    message,
    priority: 2,
  });

  // Re-arm this prayer for tomorrow.
  scheduleNotifications();
}