import { initTheme } from "../../../scripts/theme.js";
import { HIGH_LATITUDE_RULES } from "../../../scripts/settings-schema.js";
import { getSettings, updateSettings } from "../../../scripts/settings-store.js";

initTheme();

const group = document.getElementById("hlGroup");

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
});

const CHECK_SVG = `<svg class="option__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

function renderOptions(active) {
  group.innerHTML = "";
  for (const { value, label, description } of HIGH_LATITUDE_RULES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.value = value;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(value === active));

    const inner = document.createElement("span");
    inner.className = "option__native";
    inner.innerHTML = `${label}<span class="option__description">${description}</span>`;

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
  const { highLatitudeRule } = await getSettings();
  renderOptions(highLatitudeRule);
})();
