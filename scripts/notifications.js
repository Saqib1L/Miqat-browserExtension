import { getStorage } from "./storage.js";
import { getSettings } from "./settings-store.js";
import { calculatePrayerTimes } from "./prayer-times.js";
import {
  NOTIFIABLE_PRAYERS,
  ATTENTION_SOUND,
  getNotificationSettings,
} from "./notification-settings.js";
import { playAdhan, playChime, stopAdhan } from "./adhan-audio.js";
import { getLanguage, t, tf } from "./translation.js";

const PREFIX_AT = "notif:";
const PREFIX_REMINDER = "notif-reminder:";
const PREFIX_POST = "notif-post:";


export function isNotificationAlarm(name) {
  return (
    typeof name === "string" &&
    (name.startsWith(PREFIX_AT) ||
      name.startsWith(PREFIX_REMINDER) ||
      name.startsWith(PREFIX_POST))
  );
}

async function clearNotificationAlarms() {
  const alarms = await chrome.alarms.getAll();
  await Promise.all(
    alarms
      .filter((a) => isNotificationAlarm(a.name))
      .map((a) => chrome.alarms.clear(a.name)),
  );
}

export async function scheduleNotifications() {
  try {
    await clearNotificationAlarms();

    const notif = await getNotificationSettings();
    if (!notif.enabled) return;

    const [{ location }, settings] = await Promise.all([
      getStorage("location"),
      getSettings(),
    ]);
    if (!location) return;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const today = calculatePrayerTimes(location, now, settings);
    const next = calculatePrayerTimes(location, tomorrow, settings);

    for (const { key } of NOTIFIABLE_PRAYERS) {
      const prayer = notif.prayers[key];

      const prayerToday = today[key].getTime();
      const prayerNext = next[key].getTime();

      if (prayer.atTime) {
        let when = prayerToday;
        if (when <= now.getTime()) when = prayerNext;
        if (when > now.getTime()) {
          chrome.alarms.create(PREFIX_AT + key, { when });
        }
      }

      if (prayer.reminder) {
        const leadMs = prayer.reminderTime * 60000;
        let when = prayerToday - leadMs;
        if (when <= now.getTime()) when = prayerNext - leadMs;
        if (when > now.getTime()) {
          chrome.alarms.create(PREFIX_REMINDER + key, { when });
        }
      }

      if (prayer.post) {
        const postMs = prayer.postTime * 60000;
        let when = prayerToday + postMs;
        if (when <= now.getTime()) when = prayerNext + postMs;
        if (when > now.getTime()) {
          chrome.alarms.create(PREFIX_POST + key, { when });
        }
      }
    }
  } catch (err) {
    console.error("Scheduling notifications failed:", err);
  }
}

let isRescheduling = false;

export async function handleNotificationAlarm(name) {
  const isReminder = name.startsWith(PREFIX_REMINDER);
  const isPost = name.startsWith(PREFIX_POST);
  const prefix = isReminder ? PREFIX_REMINDER : isPost ? PREFIX_POST : PREFIX_AT;
  const key = name.slice(prefix.length);

  if (!NOTIFIABLE_PRAYERS.some((p) => p.key === key)) return;

  const notif = await getNotificationSettings();
  if (!notif.enabled) return;

  const prayer = notif.prayers[key];
  if (!prayer) return;
  if (isReminder && !prayer.reminder) return;
  if (isPost && !prayer.post) return;
  if (!isReminder && !isPost && !prayer.atTime) return;

  const lang = await getLanguage();
  const label = t(key, lang);

  let message;
  if (isReminder) {
    message = tf("notifMsgReminder", lang, { prayer: label, minutes: prayer.reminderTime });
  } else if (isPost) {
    message = tf("notifMsgPost", lang, { prayer: label, minutes: prayer.postTime });
  } else {
    message = tf("notifMsgAtTime", lang, { prayer: label });
  }

  const isAdhan = !isReminder && !isPost;
  const hasAudio = notif.sound && notif.volume > 0;
  const withSound = isAdhan && hasAudio;
  const withChime = (isReminder || isPost) && hasAudio;

  const notifId = `${prefix}${key}:${Date.now()}`;
  chrome.notifications.create(notifId, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("media/masjid.png"),
    title: "Miqat",
    message,
    priority: 2,
    
    requireInteraction: withSound,
    buttons: withSound ? [{ title: t("notifStopAdhan", lang) }] : [],
  });

  if (withSound) {
    await chrome.storage.session.set({ activeNotifId: notifId, adhanPlaying: true });
    playAdhan(notif.soundFile, notif.volume);
  } else if (withChime) {
    playChime(ATTENTION_SOUND, notif.volume);
  }

  if (!isRescheduling) {
    isRescheduling = true;
    scheduleNotifications().finally(() => { isRescheduling = false; });
  }
}

export async function handleNotificationClosed(notificationId) {
  const { activeNotifId } = await chrome.storage.session.get("activeNotifId");
  if (notificationId === activeNotifId) stopAdhan();
}