import { initTheme } from "../../../scripts/theme.js";
import { PRAYERS_WITH_ADJUSTMENTS } from "../../../scripts/settings-schema.js";
import { getSettings, updateSettings } from "../../../scripts/settings-store.js";
import { getStorage } from "../../../scripts/storage.js";
import {
  calculatePrayerTimes,
  calculateBasePrayerTimes,
  formatTime,
} from "../../../scripts/prayer-times.js";

initTheme();

const list = document.getElementById("stepperList");
const MIN = -60, MAX = 60;

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
});

let settings = null;
let location = null;

function previewFor(key, value) {
  if (!location) return "Set a location to preview times";
  const today = new Date();
  const base = calculateBasePrayerTimes(location, today, settings);
  const adjusted = calculatePrayerTimes(location, today, settings);
  if (value === 0) return `Today: ${formatTime(adjusted[key])}`;
  return `Today: ${formatTime(base[key])} \u2192 ${formatTime(adjusted[key])}`;
}

function renderSteppers() {
  const adj = settings.prayerAdjustments ?? {};
  list.innerHTML = "";
  for (const { key, label } of PRAYERS_WITH_ADJUSTMENTS) {
    const value = adj[key] ?? 0;
    const row = document.createElement("div");
    row.className = "stepper-row";
    row.innerHTML = `
      <span class="stepper-row__label">${label}<span class="stepper-row__preview">${previewFor(key, value)}</span></span>
      <div class="stepper" data-prayer="${key}">
        <button class="stepper__btn" data-action="dec" aria-label="Decrease ${label}" ${value <= MIN ? "disabled" : ""}>\u2212</button>
        <span class="stepper__value">${value > 0 ? "+" : ""}${value}m</span>
        <button class="stepper__btn" data-action="inc" aria-label="Increase ${label}" ${value >= MAX ? "disabled" : ""}>+</button>
      </div>
    `;
    list.appendChild(row);
  }
}

list.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const key = btn.closest("[data-prayer]").dataset.prayer;
  const current = settings.prayerAdjustments?.[key] ?? 0;
  const delta = btn.dataset.action === "inc" ? 1 : -1;
  const next = Math.min(MAX, Math.max(MIN, current + delta));
  if (next === current) return;
  settings = await updateSettings({ prayerAdjustments: { [key]: next } });
  renderSteppers();
});

(async function init() {
  const [loadedSettings, stored] = await Promise.all([getSettings(), getStorage("location")]);
  settings = loadedSettings;
  location = stored.location ?? null;
  renderSteppers();
})();
