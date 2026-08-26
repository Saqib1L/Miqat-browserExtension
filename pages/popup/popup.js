import { initTheme } from "../../scripts/theme.js";
import { getStorage } from "../../scripts/storage.js";
import {
  calculatePrayerTimes,
  getCurrentPrayer,
  getNextPrayer,
  formatCountdown,
  formatTime,
} from "../../scripts/prayer-times.js";

initTheme();

const PRAYER_LABELS = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

const settingsBtn = document.getElementById('settingsBtn');
const userLocationEl = document.getElementById('userLocation');

settingsBtn.addEventListener('click', () => {
  window.location.href = '../settings/settings.html';
});

userLocationEl.addEventListener('click', () => {
  window.location.href = '../location/location.html';
});

async function renderPrayerTimes() {
  const { location } = await getStorage('location');

  if (!location) {
    // No location saved yet — prompt the user to set one instead
    // of showing fake/hardcoded times.
    document.getElementById('currentPrayerName').textContent = 'No location set';
    document.getElementById('nextPrayerCountdown').textContent = '';
    userLocationEl.querySelector('.location-text').textContent = 'Tap to set location';
    return;
  }

  userLocationEl.querySelector('.location-text').textContent = location.label || 'Current Location';
  userLocationEl.title = location.label || 'Current Location';

  const now = new Date();
  const prayerTimes = calculatePrayerTimes(location, now);
  const current = getCurrentPrayer(prayerTimes, now);
  const next = getNextPrayer(prayerTimes, location, now);

  // Hero: current prayer + countdown
  document.getElementById('currentPrayerName').textContent = PRAYER_LABELS[current];
  document.getElementById('nextPrayerCountdown').textContent =
    `${PRAYER_LABELS[next.name]} in ${formatCountdown(next.millisUntil)}`;

  // Date strip
  document.getElementById('gregorianDate').textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  // Hijri date via Intl — no extra library needed
  document.getElementById('hijriDate').textContent = new Intl.DateTimeFormat(
    'en-US-u-ca-islamic',
    { day: 'numeric', month: 'long', year: 'numeric' }
  ).format(now);

  // Prayer list rows
  ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((prayer) => {
    const card = document.querySelector(`.prayer-card[data-prayer="${prayer}"]`);
    if (!card) return;

    card.querySelector('.prayer-time').textContent = formatTime(prayerTimes[prayer]);
    card.classList.toggle('active', prayer === current);
  });
}

renderPrayerTimes();
setInterval(renderPrayerTimes, 1000);