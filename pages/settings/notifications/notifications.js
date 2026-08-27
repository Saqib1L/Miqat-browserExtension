import {
  NOTIFIABLE_PRAYERS,
  LEAD_TIMES,
  ADHAN_SOUNDS,
  getNotificationSettings,
  updateNotificationSettings,
} from "../../../scripts/notification-settings.js";

import { initTheme } from "../../../scripts/theme.js";

initTheme();

const masterToggle = document.getElementById("masterToggle");
const detailSection = document.getElementById("detailSection");
const prayerToggles = document.getElementById("prayerToggles");
const leadTimeGroup = document.getElementById("leadTimeGroup");
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

const CHECK_SVG = `<svg class="option__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

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

function leadTimeLabel(minutes) {
  return minutes === 0 ? "At prayer time" : `${minutes} minutes before`;
}

function renderPrayerToggles(prayers) {
  prayerToggles.innerHTML = "";

  for (const { key, label } of NOTIFIABLE_PRAYERS) {
    const row = document.createElement("div");
    row.className = "toggle-row";
    row.innerHTML = `
      <span class="toggle-row__label">${label}</span>
      <label class="toggle">
        <input type="checkbox" data-prayer="${key}" ${prayers[key] ? "checked" : ""}>
        <span class="toggle__track"></span>
      </label>`;
    prayerToggles.appendChild(row);
  }
}

function renderLeadTimes(active) {
  leadTimeGroup.innerHTML = "";

  for (const minutes of LEAD_TIMES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.value = String(minutes);
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(minutes === active));

    const inner = document.createElement("span");
    inner.className = "option__native";
    inner.textContent = leadTimeLabel(minutes);

    btn.appendChild(inner);
    btn.insertAdjacentHTML("beforeend", CHECK_SVG);
    leadTimeGroup.appendChild(btn);
  }
}

function renderSounds(activeFile) {
  soundDropdownMenu.innerHTML = "";

  for (const { file, label } of ADHAN_SOUNDS) {
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

    if (file === activeFile) {
      soundDropdownValue.textContent = label;
    }
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
  muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");

  if (previewEl) {
    previewEl.volume = volume;
  }
}

function updatePlayButton(playing) {
  soundPlayIcon.innerHTML = playing ? PAUSE_SVG : PLAY_SVG;
  soundPlayLabel.textContent = playing ? "Pause" : "Play";
  soundPlayBtn.setAttribute("aria-label", playing ? "Pause selected adhan" : "Play selected adhan");
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

  previewEl.addEventListener("ended", () => {
    updatePlayButton(false);
  });

  previewEl.play().catch(() => {
    updatePlayButton(false);
  });

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
      alert("Notifications are blocked for this browser. Enable them in your browser and system notification settings, then try again.");
      return;
    }
  }

  applyEnabledState(enabled);
  await updateNotificationSettings({ enabled });
});

prayerToggles.addEventListener("change", async (e) => {
  const input = e.target.closest("input[data-prayer]");

  if (!input) return;

  await updateNotificationSettings({
    prayers: { [input.dataset.prayer]: input.checked }
  });
});

leadTimeGroup.addEventListener("click", async (e) => {
  const btn = e.target.closest(".option");

  if (!btn || btn.getAttribute("aria-checked") === "true") return;

  const minutes = Number(btn.dataset.value);

  await updateNotificationSettings({ leadTime: minutes });
  renderLeadTimes(minutes);
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
  if (!soundDropdown.contains(e.target)) {
    closeSoundDropdown();
  }
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

  if (volume > 0 && previewEl && !previewEl.paused) {
    previewEl.volume = volume;
  }
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
  const settings = await getNotificationSettings();

  masterToggle.checked = settings.enabled;
  applyEnabledState(settings.enabled);

  renderPrayerToggles(settings.prayers);
  renderLeadTimes(settings.leadTime);

  soundToggle.checked = settings.sound;
  applySoundState(settings.sound);

  renderSounds(settings.soundFile);
  renderVolume(settings.volume);

  lastVolume = settings.volume || 0.8;
})();