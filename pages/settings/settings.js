import { initTheme } from "../../scripts/theme.js";
import { getLanguage, TRANSLATIONS } from "../../scripts/translation.js";
import { getSettings } from "../../scripts/settings-store.js";
import { getStorage } from "../../scripts/storage.js";
import { formatHijriOffset } from "../../scripts/hijri.js";
import {
  HIGH_LATITUDE_RULES,
  PRAYERS_WITH_ADJUSTMENTS,
  findMethod,
  detectMethod,
} from "../../scripts/settings-schema.js";

initTheme();

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../popup/popup.html";
});

async function init() {
  const [lang, settings, { location }] = await Promise.all([
    getLanguage(),
    getSettings(),
    getStorage("location"),
  ]);

  document.getElementById("currentLang").textContent =
    TRANSLATIONS[lang]?.langName ?? lang;

  const isAuto = settings.calculationMethod === "Auto";
  const effective = findMethod(isAuto ? detectMethod(location) : settings.calculationMethod);
  document.getElementById("currentMethod").textContent = isAuto
    ? `Auto \u2014 ${effective?.label ?? "Muslim World League"}`
    : (effective?.label ?? settings.calculationMethod);

  const angles = settings.customAngles ?? {};
  document.getElementById("currentAngles").textContent =
    angles.auto === false
      ? `Fajr ${angles.fajrAngle}\u00b0 \u00b7 Isha ${angles.ishaAngle}\u00b0`
      : "Auto set";

  const madhabLabels = { Shafi: "Shafi'i / Maliki / Hanbali", Hanafi: "Hanafi" };
  document.getElementById("currentMadhab").textContent =
    madhabLabels[settings.madhab] ?? settings.madhab;

  const hlRule = HIGH_LATITUDE_RULES.find(r => r.value === settings.highLatitudeRule);
  document.getElementById("currentHighLatitude").textContent =
    hlRule?.label ?? settings.highLatitudeRule;

  const adj = settings.prayerAdjustments ?? {};
  const nonZero = PRAYERS_WITH_ADJUSTMENTS.filter(p => (adj[p.key] ?? 0) !== 0);
  document.getElementById("currentAdjustments").textContent =
    nonZero.length === 0
      ? "None"
      : nonZero.map(p => `${p.label} ${adj[p.key] > 0 ? "+" : ""}${adj[p.key]}m`).join(", ");

  document.getElementById("currentHijri").textContent =
    formatHijriOffset(settings.hijriAdjustment ?? 0);

  const notif = settings.notifications ?? {};
  const enabledCount = Object.values(notif).filter(Boolean).length;
  const totalCount = Object.keys(notif).length;
  document.getElementById("currentNotifications").textContent =
    enabledCount === 0 ? "All off" :
    enabledCount === totalCount ? "All on" :
    `${enabledCount} of ${totalCount} on`;
}

init();
