import { initTheme } from "../../../scripts/theme.js";
import { getSettings, updateSettings } from "../../../scripts/settings-store.js";
import { getStorage } from "../../../scripts/storage.js";
import { ANGLE_LIMITS } from "../../../scripts/settings-schema.js";
import {
  calculatePrayerTimes,
  resolveAngles,
  resolveMethod,
  formatTime,
} from "../../../scripts/prayer-times.js";

initTheme();

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
});

const autoToggle = document.getElementById("autoToggle");
const angleList = document.getElementById("angleList");
const hint = document.getElementById("angleHint");

let settings = null;
let location = null;

function render() {
  const custom = settings.customAngles ?? {};
  const auto = custom.auto !== false;
  const effective = resolveAngles(settings, location);

  autoToggle.checked = auto;
  angleList.querySelectorAll("[data-angle]").forEach((stepper) => {
    stepper.querySelectorAll("button").forEach((b) => (b.disabled = auto));
  });

  document.getElementById("fajrAngleValue").textContent = `${effective.fajrAngle}\u00b0`;
  document.getElementById("ishaAngleValue").textContent = effective.ishaInterval
    ? `${effective.ishaInterval}m`
    : `${effective.ishaAngle}\u00b0`;

  if (auto) {
    hint.textContent = `Angles taken from ${resolveMethod(settings, location).label}.`;
  } else {
    hint.textContent = `Allowed range ${ANGLE_LIMITS.min}\u00b0 \u2013 ${ANGLE_LIMITS.max}\u00b0, in ${ANGLE_LIMITS.step}\u00b0 steps.`;
  }

  renderPreview();
}

function renderPreview() {
  const fajrEl = document.getElementById("fajrPreview");
  const ishaEl = document.getElementById("ishaPreview");

  if (!location) {
    fajrEl.textContent = "Set a location to preview";
    ishaEl.textContent = "";
    return;
  }

  const times = calculatePrayerTimes(location, new Date(), settings);
  fajrEl.textContent = `Today: ${formatTime(times.fajr)}`;
  ishaEl.textContent = `Today: ${formatTime(times.isha)}`;
}

autoToggle.addEventListener("change", async () => {
  const effective = resolveAngles(settings, location);
  const patch = autoToggle.checked
    ? { customAngles: { auto: true } }
    : {
        customAngles: {
          auto: false,
          fajrAngle: effective.fajrAngle || 18,
          ishaAngle: effective.ishaAngle || 17,
        },
      };
  settings = await updateSettings(patch);
  render();
});

angleList.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn || btn.disabled) return;
  const key = btn.closest("[data-angle]").dataset.angle;
  const current = Number(settings.customAngles?.[key] ?? (key === "fajrAngle" ? 18 : 17));
  const delta = btn.dataset.action === "inc" ? ANGLE_LIMITS.step : -ANGLE_LIMITS.step;
  const next = Math.min(ANGLE_LIMITS.max, Math.max(ANGLE_LIMITS.min, current + delta));
  if (next === current) return;
  settings = await updateSettings({ customAngles: { auto: false, [key]: next } });
  render();
});

(async function init() {
  const [loadedSettings, stored] = await Promise.all([getSettings(), getStorage("location")]);
  settings = loadedSettings;
  location = stored.location ?? null;
  render();
})();
