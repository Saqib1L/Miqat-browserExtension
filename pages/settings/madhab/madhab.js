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

const MADHAB_DESC_KEYS = {
  Shafi: "madhabShafiDesc",
  Hanafi: "madhabHanafiDesc",
};

const SHADOW_SVG = {
  Shafi: `<svg class="option__shadow" viewBox="0 0 48 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="8" y1="6" x2="8" y2="34"/><line x1="8" y1="34" x2="36" y2="34"/></svg>`,
  Hanafi: `<svg class="option__shadow" viewBox="0 0 48 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="8" y1="20" x2="8" y2="34"/><line x1="8" y1="34" x2="36" y2="34"/></svg>`,
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

    const textWrap = document.createElement("span");
    textWrap.className = "madhab-option__text";

    const labelEl = document.createElement("span");
    labelEl.className = "madhab-option__title";
    labelEl.textContent = t(MADHAB_I18N_KEYS[value], lang);

    const descEl = document.createElement("span");
    descEl.className = "madhab-option__desc";
    descEl.textContent = t(MADHAB_DESC_KEYS[value], lang);

    textWrap.appendChild(labelEl);
    textWrap.appendChild(descEl);
    btn.appendChild(textWrap);
    btn.insertAdjacentHTML("beforeend", SHADOW_SVG[value]);
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