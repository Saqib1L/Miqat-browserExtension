export function calculatePrayerTimes(location, date = new Date()) {
  const coordinates = new adhan.Coordinates(location.latitude, location.longitude);
  const params = adhan.CalculationMethod.MuslimWorldLeague();
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

export function getNextPrayer(prayerTimes, location, now = new Date()) {
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
  const tomorrowTimes = calculatePrayerTimes(location, tomorrow);

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

export function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}