import { getStorage, setStorage } from './storage.js';

export const NOTIFIABLE_PRAYERS = [
  { key: 'fajr',    label: 'Fajr' },
  { key: 'dhuhr',   label: 'Dhuhr' },
  { key: 'asr',     label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha',    label: 'Isha' },
];

export const LEAD_TIMES = [0, 5, 10, 15, 30];

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: false,          // master kill-switch
  leadTime: 0,             // minutes before adhan
  prayers: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
};

export async function getNotificationSettings() {
  const { notificationSettings } = await getStorage('notificationSettings');
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...notificationSettings,
    prayers: {
      ...DEFAULT_NOTIFICATION_SETTINGS.prayers,
      ...(notificationSettings?.prayers ?? {}),
    },
  };
}

export async function updateNotificationSettings(partial) {
  const current = await getNotificationSettings();
  const merged = {
    ...current,
    ...partial,
    prayers: { ...current.prayers, ...(partial.prayers ?? {}) },
  };
  await setStorage({ notificationSettings: merged });
  return merged;
}