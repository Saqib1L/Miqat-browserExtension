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
const dayContent = document.getElementById('dayContent');
const todayBtn = document.getElementById('todayBtn');
const prevDateBtn = document.getElementById('prevDateBtn');
const nextDateBtn = document.getElementById('nextDateBtn');

let dayOffset = 0;
const ANIMATION_MS = 220;

settingsBtn.addEventListener('click', () => {
  window.location.href = '../settings/settings.html';
});

userLocationEl.addEventListener('click', () => {
  window.location.href = '../location/location.html';
});

nextDateBtn.addEventListener('click', () => {
  dayOffset += 1;
  navigateWithAnimation('next');
});

prevDateBtn.addEventListener('click', () => {
  dayOffset -= 1;
  navigateWithAnimation('prev');
});

todayBtn.addEventListener('click', () => {
  if (dayOffset === 0) return;
  const direction = dayOffset > 0 ? 'prev' : 'next';
  dayOffset = 0;
  navigateWithAnimation(direction);
});

function getSelectedDate() {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date;
}

function navigateWithAnimation(direction) {
  const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
  const inClass = direction === 'next' ? 'slide-in-from-right' : 'slide-in-from-left';

  dayContent.classList.add(outClass);

  setTimeout(async () => {
    await renderPrayerTimes();

    dayContent.classList.remove(outClass);
    dayContent.classList.add(inClass);

    void dayContent.offsetWidth; // force reflow so the next class change transitions

    dayContent.classList.remove(inClass);
  }, ANIMATION_MS);
}

async function renderPrayerTimes() {
  const { location } = await getStorage('location');

  todayBtn.classList.toggle('away-from-today', dayOffset !== 0);
  todayBtn.classList.toggle('direction-left', dayOffset > 0);
  todayBtn.classList.toggle('direction-right', dayOffset < 0);

  if (!location) {
    document.getElementById('currentPrayerName').textContent = 'No location set';
    document.getElementById('nextPrayerCountdown').textContent = '';
    userLocationEl.querySelector('.location-text').textContent = 'Tap to set location';
    return;
  }

  userLocationEl.querySelector('.location-text').textContent = location.label || 'Current Location';
  userLocationEl.title = location.label || 'Current Location';

  const selectedDate = getSelectedDate();
  const isToday = dayOffset === 0;
  const prayerTimes = calculatePrayerTimes(location, selectedDate);

  if (isToday) {
    const now = new Date();
    const current = getCurrentPrayer(prayerTimes, now);
    const next = getNextPrayer(prayerTimes, location, now);

    document.getElementById('currentPrayerName').textContent = PRAYER_LABELS[current];
    document.getElementById('nextPrayerCountdown').textContent =
      `${PRAYER_LABELS[next.name]} in ${formatCountdown(next.millisUntil)}`;

    highlightActivePrayer(current);
  } else {
    document.getElementById('currentPrayerName').textContent = selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    document.getElementById('nextPrayerCountdown').textContent =
      dayOffset > 0 ? 'Upcoming day' : 'Past day';

    highlightActivePrayer(null);
  }

  document.getElementById('gregorianDate').textContent = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  document.getElementById('hijriDate').textContent = new Intl.DateTimeFormat(
    'en-US-u-ca-islamic',
    { day: 'numeric', month: 'long', year: 'numeric' }
  ).format(selectedDate);

  ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((prayer) => {
    const card = document.querySelector(`.prayer-card[data-prayer="${prayer}"]`);
    if (!card) return;
    card.querySelector('.prayer-time').textContent = formatTime(prayerTimes[prayer]);
  });
}

function highlightActivePrayer(activePrayer) {
  document.querySelectorAll('.prayer-card').forEach((card) => {
    card.classList.toggle('active', card.dataset.prayer === activePrayer);
  });
}

renderPrayerTimes();
setInterval(() => {
  if (dayOffset === 0) renderPrayerTimes();
}, 1000);