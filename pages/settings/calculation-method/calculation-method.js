import { initTheme } from "../../../scripts/theme.js";
import {
  CALCULATION_METHODS,
  findMethod,
  detectMethod,
} from "../../../scripts/settings-schema.js";
import { getSettings, updateSettings } from "../../../scripts/settings-store.js";
import { getStorage } from "../../../scripts/storage.js";
import { getLanguage, t, tf, applyTranslations } from "../../../scripts/translation.js";

initTheme();

const group = document.getElementById("methodGroup");

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
});

const CHECK_SVG = `<svg class="option__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

let detected = null;
let lang = "en";

function describe(method) {
  if (method.value === "Auto") {
    const label = findMethod(detected)?.label ?? "Muslim World League";
    return tf("autoDetectedFor", lang, { method: label });
  }
  if (method.value === "Custom") return t("customAnglesMethodDesc", lang);
  if (method.description) return method.description;
  if (method.ishaInterval) return `Fajr ${method.fajrAngle}\u00b0 \u00b7 Isha ${method.ishaInterval} min after Maghrib`;
  return `Fajr ${method.fajrAngle}\u00b0 \u00b7 Isha ${method.ishaAngle}\u00b0`;
}

function renderOptions(active) {
  group.innerHTML = "";
  for (const method of CALCULATION_METHODS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.method = method.value;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(method.value === active));

    const inner = document.createElement("span");
    inner.className = "option__native";
    inner.textContent = method.value === "Auto" ? t("autoDetect", lang) : method.label;
    const desc = document.createElement("span");
    desc.className = "option__description";
    desc.textContent = describe(method);
    inner.appendChild(desc);

    btn.appendChild(inner);
    btn.insertAdjacentHTML("beforeend", CHECK_SVG);
    group.appendChild(btn);
  }
}

group.addEventListener("click", async (e) => {
  const btn = e.target.closest(".option");
  if (!btn || btn.getAttribute("aria-checked") === "true") return;
  await updateSettings({ calculationMethod: btn.dataset.method });
  renderOptions(btn.dataset.method);
});

(async function init() {
  const [{ calculationMethod }, { location }, loadedLang] = await Promise.all([
    getSettings(),
    getStorage("location"),
    getLanguage(),
  ]);
  lang = loadedLang;
  detected = detectMethod(location);
  applyTranslations(lang);
  const stored = findMethod(calculationMethod);
  renderOptions(calculationMethod === "Auto" ? "Auto" : (stored?.value ?? "MuslimWorldLeague"));
})();