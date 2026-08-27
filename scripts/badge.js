import { getStorage } from './storage.js';
import { getSettings } from './settings-store.js';
import { calculatePrayerTimes, getNextPrayer } from './prayer-times.js';

export async function updateBadge() {
  try {
    const [{ location }, settings] = await Promise.all([
      getStorage('location'),
      getSettings(),
    ]);

    if (!location) {
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    const now = new Date();
    const prayerTimes = calculatePrayerTimes(location, now, settings);
    const next = getNextPrayer(prayerTimes, location, now, settings);

    const totalSeconds = Math.max(0, Math.floor(next.millisUntil / 1000));

    chrome.action.setBadgeText({ text: formatBadge(totalSeconds) });
    chrome.action.setBadgeBackgroundColor({ color: '#F3D98B' });
    chrome.action.setBadgeTextColor({ color: '#172544' });

    scheduleNext(totalSeconds);
  } catch (err) {
    console.error('Badge update failed:', err);
    chrome.action.setBadgeText({ text: '' });
  }
}

function formatBadge(totalSeconds) {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const pad = n => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}`;
}

function scheduleNext(totalSeconds) {
  let delayMs;

  if (totalSeconds < 60) {
    delayMs = 1000;
  } else {
    const now = new Date();
    delayMs = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    if (delayMs <= 0) delayMs = 60000;
  }

  chrome.alarms.create('badgeTick', { when: Date.now() + delayMs });
}