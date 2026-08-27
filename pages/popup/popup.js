import { initTheme } from "../../scripts/theme.js";
import { getStorage } from "../../scripts/storage.js";
import { getSettings } from "../../scripts/settings-store.js";
import { formatHijriDate } from "../../scripts/hijri.js";
import { getLanguage, t, tf, applyTranslations } from "../../scripts/translation.js";
import {
  calculatePrayerTimes,
  getCurrentPrayer,
  getNextPrayer,
  formatCountdown,
  formatTime,
} from "../../scripts/prayer-times.js";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../../scripts/notification-settings.js";

initTheme();

const PRAYER_KEYS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

const els = {
  settingsBtn: document.getElementById("settingsBtn"),
  volumeToggle: document.getElementById("volume-toggle"),
  volumeIcon: document.getElementById("popup-volume-icon"),
  userLocation: document.getElementById("userLocation"),
  locationText: document.querySelector("#userLocation .location-text"),
  dayContent: document.getElementById("dayContent"),
  todayBtn: document.getElementById("todayBtn"),
  prevDateBtn: document.getElementById("prevDateBtn"),
  nextDateBtn: document.getElementById("nextDateBtn"),
  currentPrayerName: document.getElementById("currentPrayerName"),
  nextPrayerCountdown: document.getElementById("nextPrayerCountdown"),
  gregorianDate: document.getElementById("gregorianDate"),
  hijriDate: document.getElementById("hijriDate"),
};

let dayOffset = 0;
let countdownTimer = null;
let settings = null;
let lang = "en";
const ANIMATION_MS = 220;

els.settingsBtn.addEventListener("click", () => {
  window.location.href = "../settings/settings.html";
});

const SPEAKER_ON = `
  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
  <path d="M19 5a9 9 0 0 1 0 14"></path>
`;

const SPEAKER_OFF = `
  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
  <line x1="23" y1="9" x2="17" y2="15"></line>
  <line x1="17" y1="9" x2="23" y2="15"></line>
`;

let lastVolume = 0.8;

function updateVolumeButton(volume) {
  const muted = volume === 0;
  els.volumeIcon.innerHTML = muted ? SPEAKER_OFF : SPEAKER_ON;
  els.volumeToggle.setAttribute("aria-label", muted ? "Enable Notification Sound" : "Disable Notification Sound");
  els.volumeToggle.setAttribute("aria-pressed", String(muted));
}

els.volumeToggle.addEventListener("click", async () => {
  const notificationSettings = await getNotificationSettings();
  const currentVolume = notificationSettings.volume ?? 0.8;
  const nextVolume = currentVolume === 0 ? lastVolume : 0;
  if (currentVolume > 0) lastVolume = currentVolume;
  await updateNotificationSettings({ volume: nextVolume });
  updateVolumeButton(nextVolume);
});

async function initVolumeButton() {
  const notificationSettings = await getNotificationSettings();
  const volume = notificationSettings.volume ?? 0.8;
  if (volume > 0) lastVolume = volume;
  updateVolumeButton(volume);
}

els.userLocation.addEventListener("click", () => {
  window.location.href = "../location/location.html?from=popup";
});

els.nextDateBtn.addEventListener("click", () => {
  dayOffset += 1;
  navigateWithAnimation("next");
});

els.prevDateBtn.addEventListener("click", () => {
  dayOffset -= 1;
  navigateWithAnimation("prev");
});

els.todayBtn.addEventListener("click", () => {
  if (dayOffset === 0) return;
  const direction = dayOffset > 0 ? "prev" : "next";
  dayOffset = 0;
  navigateWithAnimation(direction);
});

function getSelectedDate() {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return date;
}

function navigateWithAnimation(direction) {
  const outClass = direction === "next" ? "slide-out-left" : "slide-out-right";
  const inClass = direction === "next" ? "slide-in-from-right" : "slide-in-from-left";
  els.dayContent.classList.add(outClass);
  setTimeout(async () => {
    await renderPrayerTimes();
    els.dayContent.classList.remove(outClass);
    els.dayContent.classList.add(inClass);
    void els.dayContent.offsetWidth;
    els.dayContent.classList.remove(inClass);
  }, ANIMATION_MS);
}

async function renderPrayerTimes() {
  clearCountdown();
  const [{ location }, loadedSettings, loadedLang] = await Promise.all([
    getStorage("location"),
    getSettings(),
    getLanguage(),
  ]);
  settings = loadedSettings;
  lang = loadedLang;
  applyTranslations(lang);
  els.todayBtn.classList.toggle("away-from-today", dayOffset !== 0);
  els.todayBtn.classList.toggle("direction-left", dayOffset > 0);
  els.todayBtn.classList.toggle("direction-right", dayOffset < 0);

  if (!location) {
    els.currentPrayerName.textContent = "No location set";
    els.nextPrayerCountdown.textContent = "";
    els.locationText.textContent = "Tap to set location";
    highlightActivePrayer(null);
    PRAYER_KEYS.forEach((key) => {
      document.querySelector(`.prayer-card[data-prayer="${key}"] .prayer-time`).textContent = "--:--";
    });
    document.querySelector(".hero-section").style.visibility = "visible";
    document.querySelector(".date-strip").style.visibility = "visible";
    document.querySelector(".prayer-list").style.visibility = "visible";
    return;
  }

  const locationLabel = location.label || "Current Location";
  els.locationText.textContent = locationLabel;
  els.userLocation.title = locationLabel;
  const selectedDate = getSelectedDate();
  const isToday = dayOffset === 0;
  const prayerTimes = calculatePrayerTimes(location, selectedDate, settings);

  if (isToday) {
    renderToday(prayerTimes, location);
  } else {
    renderOtherDay(selectedDate);
  }

  renderDates(selectedDate);
  renderPrayerCards(prayerTimes);
}

function renderToday(prayerTimes, location) {
  const now = new Date();
  const current = getCurrentPrayer(prayerTimes, now);
  const next = getNextPrayer(prayerTimes, location, now, settings);
  els.currentPrayerName.textContent = t(current, lang);
  highlightActivePrayer(current);
  startCountdown(prayerTimes, next, location);
}

function renderOtherDay(selectedDate) {
  els.currentPrayerName.textContent = selectedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  els.nextPrayerCountdown.textContent = dayOffset > 0 ? "Upcoming day" : "Past day";
  highlightActivePrayer(null);
}

function renderDates(selectedDate) {
  els.gregorianDate.textContent = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  els.hijriDate.textContent = formatHijriDate(selectedDate, settings?.hijriAdjustment ?? 0);
}

function renderPrayerCards(prayerTimes) {
  PRAYER_KEYS.forEach((prayer) => {
    const card = document.querySelector(`.prayer-card[data-prayer="${prayer}"]`);
    if (!card) return;
    card.querySelector(".prayer-time").textContent = formatTime(prayerTimes[prayer]);
  });
}

function startCountdown(prayerTimes, next, location) {
  const updateCountdown = () => {
    const now = new Date();
    const latestNext = getNextPrayer(prayerTimes, location, now, settings);

    if (latestNext.name !== next.name || latestNext.millisUntil <= 0) {
      renderPrayerTimes();
      return;
    }

    els.nextPrayerCountdown.textContent = tf("countdown", lang, {
      time: formatCountdown(latestNext.millisUntil),
      prayer: t(latestNext.name, lang),
    });
  };

  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
}

function clearCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function highlightActivePrayer(activePrayer) {
  document.querySelectorAll(".prayer-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.prayer === activePrayer);
  });
}

initVolumeButton();
renderPrayerTimes();