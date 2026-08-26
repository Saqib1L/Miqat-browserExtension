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

initTheme();

const PRAYER_KEYS = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

const els = {
  settingsBtn: document.getElementById("settingsBtn"),
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

els.userLocation.addEventListener("click", () => {
  window.location.href = "../location/location.html";
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
  const outClass =
    direction === "next" ? "slide-out-left" : "slide-out-right";

  const inClass =
    direction === "next"
      ? "slide-in-from-right"
      : "slide-in-from-left";

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
  els.currentPrayerName.textContent = selectedDate.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );

  els.nextPrayerCountdown.textContent =
    dayOffset > 0 ? "Upcoming day" : "Past day";

  highlightActivePrayer(null);
}

function renderDates(selectedDate) {
  els.gregorianDate.textContent = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  els.hijriDate.textContent = formatHijriDate(
    selectedDate,
    settings?.hijriAdjustment ?? 0
  );
}

function renderPrayerCards(prayerTimes) {
  PRAYER_KEYS.forEach((prayer) => {
    const card = document.querySelector(
      `.prayer-card[data-prayer="${prayer}"]`
    );

    if (!card) return;

    card.querySelector(".prayer-time").textContent =
      formatTime(prayerTimes[prayer]);
  });
}

function startCountdown(prayerTimes, next, location) {
  const updateCountdown = () => {
    const now = new Date();
    const latestNext = getNextPrayer(prayerTimes, location, now, settings);

    if (
      latestNext.name !== next.name ||
      latestNext.millisUntil <= 0
    ) {
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
    card.classList.toggle(
      "active",
      card.dataset.prayer === activePrayer
    );
  });
}

renderPrayerTimes();