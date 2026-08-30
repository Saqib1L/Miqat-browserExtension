import {
  NOTIFIABLE_PRAYERS,
  PRESET_TIMES,
  ADHAN_SOUNDS,
  getNotificationSettings,
  updateNotificationSettings,
} from "../../../scripts/notification-settings.js";

import { initTheme } from "../../../scripts/theme.js";
import { getLanguage, applyTranslations, t, tf } from "../../../scripts/translation.js";

let lang = "en";

initTheme();

const masterToggle = document.getElementById("masterToggle");
const detailSection = document.getElementById("detailSection");
const prayerToggles = document.getElementById("prayerToggles");
const soundToggle = document.getElementById("soundToggle");
const soundSection = document.getElementById("soundSection");
const soundDropdown = document.getElementById("soundDropdown");
const soundDropdownButton = document.getElementById("soundDropdownButton");
const soundDropdownValue = document.getElementById("soundDropdownValue");
const soundDropdownMenu = document.getElementById("soundDropdownMenu");
const volumeSlider = document.getElementById("volumeSlider");
const volumePercent = document.getElementById("volumePercent");
const muteBtn = document.getElementById("muteBtn");
const muteIcon = document.getElementById("muteIcon");
const soundPlayBtn = document.getElementById("soundPlayBtn");
const soundPlayIcon = document.getElementById("soundPlayIcon");
const soundPlayLabel = document.getElementById("soundPlayLabel");

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
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

const PLAY_SVG = `<polygon points="8 5 19 12 8 19"></polygon>`;
const PAUSE_SVG = `<rect x="7" y="5" width="4" height="14"></rect><rect x="13" y="5" width="4" height="14"></rect>`;

let lastVolume = 0.8;

function timePickerHTML(key, type, activeTime, isCustom, visible) {
  const suffix = t("notifMinuteSuffix", lang);
  const presets = PRESET_TIMES.map(m => `
    <button type="button" class="prayer-time-btn ${!isCustom && m === activeTime ? "is-active" : ""}"
      data-prayer="${key}" data-type="${type}" data-minutes="${m}">${m}${suffix}</button>
  `).join("");

  const customInput = `
    <input type="number" class="custom-minutes-input ${isCustom ? "is-active" : ""}"
      min="1" max="120" placeholder="–"
      value="${isCustom ? activeTime : ""}"
      data-prayer="${key}" data-type="${type}"
      aria-label="${t("notifCustomMinutesAria", lang)}">
  `;

  return `
    <div class="prayer-card__times ${visible ? "" : "is-hidden"}" data-prayer="${key}" data-type="${type}">
      <div class="prayer-time-btns">${presets}${customInput}</div>
    </div>
  `;
}

function renderPrayerCards(prayers) {
  prayerToggles.innerHTML = "";

  for (const { key, i18n } of NOTIFIABLE_PRAYERS) {
    const p = prayers[key];

    const card = document.createElement("div");
    card.className = "prayer-card";
    card.dataset.key = key;

    card.innerHTML = `
      <div class="prayer-card__header">
        <span class="prayer-card__label">${t(key, lang)}</span>
      </div>
      <div class="prayer-card__rows">
        <div class="prayer-card__row">
          <span class="prayer-card__row-label">${t("notifAtAdhan", lang)}</span>
          <label class="toggle">
            <input type="checkbox" data-prayer="${key}" data-field="atTime" ${p.atTime ? "checked" : ""}>
            <span class="toggle__track"></span>
          </label>
        </div>
        <div class="prayer-card__row">
          <span class="prayer-card__row-label">${t("notifPreReminder", lang)}</span>
          <label class="toggle">
            <input type="checkbox" data-prayer="${key}" data-field="reminder" ${p.reminder ? "checked" : ""}>
            <span class="toggle__track"></span>
          </label>
        </div>
      </div>
      ${timePickerHTML(key, "reminder", p.reminderTime, p.reminderCustom, p.reminder)}
      <div class="prayer-card__rows">
        <div class="prayer-card__row">
          <span class="prayer-card__row-label">${t("notifPostAdhan", lang)}</span>
          <label class="toggle">
            <input type="checkbox" data-prayer="${key}" data-field="post" ${p.post ? "checked" : ""}>
            <span class="toggle__track"></span>
          </label>
        </div>
      </div>
      ${timePickerHTML(key, "post", p.postTime, p.postCustom, p.post)}`;

    prayerToggles.appendChild(card);
  }
}

function renderSounds(activeFile) {
  soundDropdownMenu.innerHTML = "";

  for (const { file, key } of ADHAN_SOUNDS) {
    const label = t(key, lang);
    const option = document.createElement("button");
    option.type = "button";
    option.className = "sound-dropdown__option";
    option.dataset.file = file;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(file === activeFile));
    option.innerHTML = `
      <span class="sound-dropdown__option-label">${label}</span>
      <svg class="sound-dropdown__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>`;
    soundDropdownMenu.appendChild(option);
    if (file === activeFile) soundDropdownValue.textContent = label;
  }
}

function closeSoundDropdown() {
  soundDropdown.classList.remove("is-open");
  soundDropdownButton.setAttribute("aria-expanded", "false");
}

function renderVolume(volume) {
  const pct = Math.round(volume * 100);
  volumeSlider.value = String(pct);
  volumePercent.textContent = `${pct}%`;
  const muted = pct === 0;
  muteIcon.innerHTML = muted ? SPEAKER_OFF : SPEAKER_ON;
  muteBtn.setAttribute("aria-pressed", String(muted));
  muteBtn.setAttribute("aria-label", t(muted ? "unmuteLabel" : "muteLabel", lang));
  if (previewEl) previewEl.volume = volume;
}

function updatePlayButton(playing) {
  soundPlayIcon.innerHTML = playing ? PAUSE_SVG : PLAY_SVG;
  soundPlayLabel.textContent = t(playing ? "pauseLabel" : "playLabel", lang);
  soundPlayBtn.setAttribute("aria-label", t(playing ? "pauseAria" : "playAria", lang));
}

function applyEnabledState(enabled) {
  detailSection.style.opacity = enabled ? "1" : "0.4";
  detailSection.style.pointerEvents = enabled ? "" : "none";
  detailSection.setAttribute("aria-disabled", String(!enabled));
}

function applySoundState(on) {
  soundSection.style.opacity = on ? "1" : "0.4";
  soundSection.style.pointerEvents = on ? "" : "none";
  soundSection.setAttribute("aria-disabled", String(!on));
}

let previewEl = null;

async function previewSound() {
  const { soundFile, volume } = await getNotificationSettings();
  if (!volume) return;
  if (previewEl) previewEl.pause();
  previewEl = new Audio(chrome.runtime.getURL(`media/audio/${soundFile}`));
  previewEl.volume = volume;
  previewEl.addEventListener("ended", () => updatePlayButton(false));
  previewEl.play().catch(() => updatePlayButton(false));
  updatePlayButton(true);
}

async function requestPermission() {
  if (!chrome.permissions) return true;
  return new Promise((resolve) => {
    chrome.notifications.getPermissionLevel((level) => {
      resolve(level === "granted");
    });
  });
}

masterToggle.addEventListener("change", async () => {
  const enabled = masterToggle.checked;
  if (enabled) {
    const granted = await requestPermission();
    if (!granted) {
      masterToggle.checked = false;
      applyEnabledState(false);
      alert(t("notificationsBlocked", lang));
      return;
    }
  }
  applyEnabledState(enabled);
  await updateNotificationSettings({ enabled });
});

prayerToggles.addEventListener("change", async (e) => {
  const input = e.target.closest("input[data-prayer][data-field]");
  if (input) {
    const prayer = input.dataset.prayer;
    const field = input.dataset.field;
    await updateNotificationSettings({ prayers: { [prayer]: { [field]: input.checked } } });
    if (field === "reminder" || field === "post") {
      const type = field;
      const timesEl = prayerToggles.querySelector(`.prayer-card__times[data-prayer="${prayer}"][data-type="${type}"]`);
      if (timesEl) timesEl.classList.toggle("is-hidden", !input.checked);
    }
    return;
  }

  const customInput = e.target.closest(".custom-minutes-input");
  if (customInput) {
    const prayer = customInput.dataset.prayer;
    const type = customInput.dataset.type;
    const timeKey = type === "reminder" ? "reminderTime" : "postTime";
    const customKey = type === "reminder" ? "reminderCustom" : "postCustom";
    const mins = Math.max(1, Math.min(120, Number(customInput.value) || 1));
    customInput.value = mins;
    await updateNotificationSettings({ prayers: { [prayer]: { [timeKey]: mins, [customKey]: true } } });
    const timesEl = prayerToggles.querySelector(`.prayer-card__times[data-prayer="${prayer}"][data-type="${type}"]`);
    if (timesEl) {
      timesEl.querySelectorAll(".prayer-time-btn").forEach(b => b.classList.remove("is-active"));
      customInput.classList.add("is-active");
    }
  }
});

prayerToggles.addEventListener("click", async (e) => {
  const btn = e.target.closest(".prayer-time-btn");
  if (!btn) return;
  const prayer = btn.dataset.prayer;
  const type = btn.dataset.type;
  const mins = Number(btn.dataset.minutes);
  const timeKey = type === "reminder" ? "reminderTime" : "postTime";
  const customKey = type === "reminder" ? "reminderCustom" : "postCustom";
  await updateNotificationSettings({ prayers: { [prayer]: { [timeKey]: mins, [customKey]: false } } });
  const timesEl = prayerToggles.querySelector(`.prayer-card__times[data-prayer="${prayer}"][data-type="${type}"]`);
  if (timesEl) {
    timesEl.querySelectorAll(".prayer-time-btn").forEach(b => {
      b.classList.toggle("is-active", Number(b.dataset.minutes) === mins);
    });
    const customInput = timesEl.querySelector(".custom-minutes-input");
    if (customInput) {
      customInput.classList.remove("is-active");
      customInput.value = "";
    }
  }
});

prayerToggles.addEventListener("focusin", (e) => {
  const customInput = e.target.closest(".custom-minutes-input");
  if (!customInput) return;
  const timesEl = customInput.closest(".prayer-card__times");
  timesEl?.querySelectorAll(".prayer-time-btn").forEach(b => b.classList.remove("is-active"));
  customInput.classList.add("is-active");
});

soundToggle.addEventListener("change", async () => {
  applySoundState(soundToggle.checked);
  await updateNotificationSettings({ sound: soundToggle.checked });
  if (!soundToggle.checked && previewEl) {
    previewEl.pause();
    updatePlayButton(false);
  }
});

soundDropdownButton.addEventListener("click", () => {
  const open = soundDropdown.classList.toggle("is-open");
  soundDropdownButton.setAttribute("aria-expanded", String(open));
});

soundDropdownMenu.addEventListener("click", async (e) => {
  const option = e.target.closest(".sound-dropdown__option");
  if (!option) return;
  const file = option.dataset.file;
  await updateNotificationSettings({ soundFile: file });
  renderSounds(file);
  closeSoundDropdown();
  if (previewEl && !previewEl.paused) {
    previewEl.pause();
    updatePlayButton(false);
  }
});

document.addEventListener("click", (e) => {
  if (!soundDropdown.contains(e.target)) closeSoundDropdown();
});

soundPlayBtn.addEventListener("click", async () => {
  if (previewEl && !previewEl.paused) {
    previewEl.pause();
    updatePlayButton(false);
    return;
  }
  await previewSound();
});

volumeSlider.addEventListener("input", () => {
  renderVolume(Number(volumeSlider.value) / 100);
});

volumeSlider.addEventListener("change", async () => {
  const volume = Number(volumeSlider.value) / 100;
  if (volume > 0) lastVolume = volume;
  await updateNotificationSettings({ volume });
  if (volume > 0 && previewEl && !previewEl.paused) previewEl.volume = volume;
});

muteBtn.addEventListener("click", async () => {
  const current = Number(volumeSlider.value) / 100;
  const next = current === 0 ? (lastVolume || 0.8) : 0;
  if (current > 0) lastVolume = current;
  renderVolume(next);
  await updateNotificationSettings({ volume: next });
  if (previewEl && next === 0) {
    previewEl.pause();
    updatePlayButton(false);
  }
});

window.addEventListener("pagehide", () => {
  if (previewEl) previewEl.pause();
});

(async function init() {
  lang = await getLanguage();
  applyTranslations(lang);
  const settings = await getNotificationSettings();
  masterToggle.checked = settings.enabled;
  applyEnabledState(settings.enabled);
  renderPrayerCards(settings.prayers);
  soundToggle.checked = settings.sound;
  applySoundState(settings.sound);
  renderSounds(settings.soundFile);
  renderVolume(settings.volume);
  lastVolume = settings.volume || 0.8;
})();