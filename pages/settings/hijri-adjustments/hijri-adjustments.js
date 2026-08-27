import { initTheme } from "../../../scripts/theme.js";
import { getSettings, updateSettings } from "../../../scripts/settings-store.js";
import { formatHijriDate, HIJRI_LIMITS } from "../../../scripts/hijri.js";
import { getLanguage, t, applyTranslations } from "../../../scripts/translation.js";

initTheme();

const valueEl = document.getElementById("hijriValue");
const decBtn = document.getElementById("decBtn");
const incBtn = document.getElementById("incBtn");
const { min: MIN, max: MAX } = HIJRI_LIMITS;

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
});

let current = 0;
let lang = "en";

function gregorian(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

function render(val) {
  current = val;
  valueEl.textContent = val > 0 ? `+${val}` : `${val}`;
  decBtn.disabled = val <= MIN;
  incBtn.disabled = val >= MAX;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  document.getElementById("todayGregorian").textContent = gregorian(today);
  document.getElementById("todayHijri").textContent = formatHijriDate(today, val);
  document.getElementById("todayHijriBase").textContent =
    val === 0 ? t("hijriNoOffset", lang) : `${t("hijriUnadjusted", lang)}: ${formatHijriDate(today, 0)}`;

  document.getElementById("tomorrowGregorian").textContent = gregorian(tomorrow);
  document.getElementById("tomorrowHijri").textContent = formatHijriDate(tomorrow, val);
}

async function adjust(delta) {
  const next = Math.min(MAX, Math.max(MIN, current + delta));
  if (next === current) return;
  await updateSettings({ hijriAdjustment: next });
  render(next);
}

decBtn.addEventListener("click", () => adjust(-1));
incBtn.addEventListener("click", () => adjust(1));

(async function init() {
  const [{ hijriAdjustment }, loadedLang] = await Promise.all([getSettings(), getLanguage()]);
  lang = loadedLang;
  applyTranslations(lang);
  render(hijriAdjustment ?? 0);
})();