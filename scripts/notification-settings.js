import { getStorage, setStorage } from './storage.js';

export const NOTIFIABLE_PRAYERS = [
  { key: 'fajr',    label: 'Fajr' },
  { key: 'dhuhr',   label: 'Dhuhr' },
  { key: 'asr',     label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha',    label: 'Isha' },
];

export const PRESET_TIMES = [5, 10, 15];

export const ADHAN_SOUNDS = [
  { file: 'madinah.opus',     label: 'Madinah Adhan' },
  { file: 'islam-sobhi.opus', label: 'Adhan by Islam Sobhi' },
];

export const ATTENTION_SOUND = 'attention.mp3';

const DEFAULT_PRAYER = {
  atTime: true,
  reminder: false,
  reminderTime: 10,
  reminderCustom: false,
  post: false,
  postTime: 10,
  postCustom: false,
};

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: false,
  sound: false,
  soundFile: 'madinah.opus',
  volume: 0.8,
  prayers: {
    fajr:    { ...DEFAULT_PRAYER },
    dhuhr:   { ...DEFAULT_PRAYER },
    asr:     { ...DEFAULT_PRAYER },
    maghrib: { ...DEFAULT_PRAYER },
    isha:    { ...DEFAULT_PRAYER },
  },
};

export async function getNotificationSettings() {
  const { notificationSettings } = await getStorage('notificationSettings');
  const saved = notificationSettings ?? {};
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...saved,
    prayers: Object.fromEntries(
      NOTIFIABLE_PRAYERS.map(({ key }) => [
        key,
        {
          ...DEFAULT_PRAYER,
          ...(saved.prayers?.[key] ?? {}),
        },
      ])
    ),
  };
}

export async function updateNotificationSettings(partial) {
  const current = await getNotificationSettings();
  const merged = {
    ...current,
    ...partial,
    prayers: Object.fromEntries(
      NOTIFIABLE_PRAYERS.map(({ key }) => [
        key,
        {
          ...current.prayers[key],
          ...(partial.prayers?.[key] ?? {}),
        },
      ])
    ),
  };
  await setStorage({ notificationSettings: merged });
  return merged;
}