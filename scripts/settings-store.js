import { getStorage, setStorage } from './storage.js';
import { DEFAULT_SETTINGS } from './settings-schema.js';

export async function getSettings() {
  const { settings } = await getStorage('settings');
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function updateSettings(partial) {
  const current = await getSettings();
  const merged = deepMerge(current, partial);
  await setStorage({ settings: merged });
  return merged;
}

function deepMerge(base, override) {
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(base[key] ?? {}, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
