import {
  DEFAULT_SETTINGS,
  findMethod,
  detectMethod,
  CALCULATION_METHOD_DEFAULT,
} from './settings-schema.js';

const HIGH_LATITUDE_MAP = {
  NightMiddle: 'MiddleOfTheNight',
  SeventhOfNight: 'SeventhOfTheNight',
  TwilightAngle: 'TwilightAngle',
};

/** Method actually in effect (resolves "Auto" against the stored location). */
export function resolveMethod(settings = DEFAULT_SETTINGS, location = null) {
  const raw = settings?.calculationMethod ?? DEFAULT_SETTINGS.calculationMethod;
  const value = raw === 'Auto' ? detectMethod(location) : raw;
  return findMethod(value) ?? findMethod(CALCULATION_METHOD_DEFAULT);
}

/** Fajr / Isha angles in effect, after custom-angle overrides. */
export function resolveAngles(settings = DEFAULT_SETTINGS, location = null) {
  const method = resolveMethod(settings, location);
  const custom = settings?.customAngles ?? DEFAULT_SETTINGS.customAngles;
  const manual = custom.auto === false || method.value === 'Custom';

  if (manual) {
    return {
      fajrAngle: Number(custom.fajrAngle ?? 18),
      ishaAngle: Number(custom.ishaAngle ?? 17),
      ishaInterval: 0,
      manual: true,
    };
  }

  return {
    fajrAngle: method.fajrAngle ?? 18,
    ishaAngle: method.ishaInterval ? 0 : (method.ishaAngle ?? 17),
    ishaInterval: method.ishaInterval ?? 0,
    manual: false,
  };
}

export function buildParams(settings = DEFAULT_SETTINGS, location = null) {
  const method = resolveMethod(settings, location);
  const angles = resolveAngles(settings, location);

  let params;
  if (!angles.manual && method.adhan && typeof adhan.CalculationMethod[method.adhan] === 'function') {
    params = adhan.CalculationMethod[method.adhan]();
  } else {
    params = adhan.CalculationMethod.Other();
    params.fajrAngle = angles.fajrAngle;
    if (angles.ishaInterval) {
      params.ishaInterval = angles.ishaInterval;
      params.ishaAngle = 0;
    } else {
      params.ishaInterval = 0;
      params.ishaAngle = angles.ishaAngle;
    }
  }

  params.madhab =
    (settings?.madhab ?? 'Shafi') === 'Hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;

  const hlKey = HIGH_LATITUDE_MAP[settings?.highLatitudeRule];
  if (hlKey && adhan.HighLatitudeRule?.[hlKey]) {
    params.highLatitudeRule = adhan.HighLatitudeRule[hlKey];
  }

  const adj = { ...DEFAULT_SETTINGS.prayerAdjustments, ...(settings?.prayerAdjustments ?? {}) };
  params.adjustments = {
    fajr: adj.fajr ?? 0,
    sunrise: adj.sunrise ?? 0,
    dhuhr: adj.dhuhr ?? 0,
    asr: adj.asr ?? 0,
    maghrib: adj.maghrib ?? 0,
    isha: adj.isha ?? 0,
  };

  return params;
}

export function calculatePrayerTimes(location, date = new Date(), settings = DEFAULT_SETTINGS) {
  const coordinates = new adhan.Coordinates(location.latitude, location.longitude);
  const params = buildParams(settings, location);
  const times = new adhan.PrayerTimes(coordinates, date, params);

  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

/** Same day, but with every minute offset forced to zero - for previews. */
export function calculateBasePrayerTimes(location, date = new Date(), settings = DEFAULT_SETTINGS) {
  return calculatePrayerTimes(location, date, {
    ...settings,
    prayerAdjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  });
}

export function getCurrentPrayer(prayerTimes, now = new Date()) {
  const order = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  let current = 'isha';

  for (const prayer of order) {
    if (now >= prayerTimes[prayer]) {
      current = prayer;
    }
  }

  return current;
}

export function getNextPrayer(prayerTimes, location, now = new Date(), settings = DEFAULT_SETTINGS) {
  const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  for (const prayer of order) {
    if (prayerTimes[prayer] > now) {
      return {
        name: prayer,
        time: prayerTimes[prayer],
        millisUntil: prayerTimes[prayer] - now,
      };
    }
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = calculatePrayerTimes(location, tomorrow, settings);

  return {
    name: 'fajr',
    time: tomorrowTimes.fajr,
    millisUntil: tomorrowTimes.fajr - now,
  };
}

export function formatDuration(millis) {
  const totalMinutes = Math.max(0, Math.round(millis / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatCountdown(millis) {
  const totalSeconds = Math.max(0, Math.floor(millis / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatTime(date, locale = undefined) {
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
