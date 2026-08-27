import { initTheme } from "../../../scripts/theme.js";
import { HIGH_LATITUDE_RULES } from "../../../scripts/settings-schema.js";
import { getSettings, updateSettings } from "../../../scripts/settings-store.js";
import { getLanguage, t, applyTranslations } from "../../../scripts/translation.js";

initTheme();

const group = document.getElementById("hlGroup");

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
});

const CHECK_SVG = `<svg class="option__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

const HL_I18N_KEYS = {
  None: { label: "hlNone", description: "hlNoneDesc" },
  NightMiddle: { label: "hlNightMiddle", description: "hlNightMiddleDesc" },
  SeventhOfNight: { label: "hlSeventhOfNight", description: "hlSeventhOfNightDesc" },
  TwilightAngle: { label: "hlTwilightAngle", description: "hlTwilightAngleDesc" },
};

let lang = "en";

function renderOptions(active) {
  group.innerHTML = "";
  for (const { value } of HIGH_LATITUDE_RULES) {
    const keys = HL_I18N_KEYS[value];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.value = value;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(value === active));

    const inner = document.createElement("span");
    inner.className = "option__native";
    inner.innerHTML = `${t(keys.label, lang)}<span class="option__description">${t(keys.description, lang)}</span>`;

    btn.appendChild(inner);
    btn.insertAdjacentHTML("beforeend", CHECK_SVG);
    group.appendChild(btn);
  }
}

group.addEventListener("click", async (e) => {
  const btn = e.target.closest(".option");
  if (!btn || btn.getAttribute("aria-checked") === "true") return;
  await updateSettings({ highLatitudeRule: btn.dataset.value });
  renderOptions(btn.dataset.value);
});

(async function init() {
  const [{ highLatitudeRule }, loadedLang] = await Promise.all([getSettings(), getLanguage()]);
  lang = loadedLang;
  applyTranslations(lang);
  renderOptions(highLatitudeRule);
})();