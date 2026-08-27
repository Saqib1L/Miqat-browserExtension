import { initTheme } from "../../../scripts/theme.js";
import { MADHAB_OPTIONS } from "../../../scripts/settings-schema.js";
import { getSettings, updateSettings } from "../../../scripts/settings-store.js";
import { getLanguage, t, applyTranslations } from "../../../scripts/translation.js";

initTheme();

const group = document.getElementById("madhabGroup");

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
});

const CHECK_SVG = `<svg class="option__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

const MADHAB_I18N_KEYS = {
  Shafi: "madhabShafi",
  Hanafi: "madhabHanafi",
};

function renderOptions(active, lang) {
  group.innerHTML = "";
  for (const { value } of MADHAB_OPTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.value = value;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(value === active));

    const labelEl = document.createElement("span");
    labelEl.className = "option__native";
    labelEl.textContent = t(MADHAB_I18N_KEYS[value], lang);

    btn.appendChild(labelEl);
    btn.insertAdjacentHTML("beforeend", CHECK_SVG);
    group.appendChild(btn);
  }
}

let lang = "en";

group.addEventListener("click", async (e) => {
  const btn = e.target.closest(".option");
  if (!btn || btn.getAttribute("aria-checked") === "true") return;
  await updateSettings({ madhab: btn.dataset.value });
  renderOptions(btn.dataset.value, lang);
});

(async function init() {
  const [{ madhab }, loadedLang] = await Promise.all([getSettings(), getLanguage()]);
  lang = loadedLang;
  applyTranslations(lang);
  renderOptions(madhab, lang);
})();