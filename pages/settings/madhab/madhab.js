import { initTheme } from "../../../scripts/theme.js";
import { MADHAB_OPTIONS } from "../../../scripts/settings-schema.js";
import { getSettings, updateSettings } from "../../../scripts/settings-store.js";

initTheme();

const group = document.getElementById("madhabGroup");

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
});

const CHECK_SVG = `<svg class="option__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

function renderOptions(active) {
  group.innerHTML = "";
  for (const { value, label } of MADHAB_OPTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.value = value;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(value === active));

    const labelEl = document.createElement("span");
    labelEl.className = "option__native";
    labelEl.textContent = label;

    btn.appendChild(labelEl);
    btn.insertAdjacentHTML("beforeend", CHECK_SVG);
    group.appendChild(btn);
  }
}

group.addEventListener("click", async (e) => {
  const btn = e.target.closest(".option");
  if (!btn || btn.getAttribute("aria-checked") === "true") return;
  await updateSettings({ madhab: btn.dataset.value });
  renderOptions(btn.dataset.value);
});

(async function init() {
  const { madhab } = await getSettings();
  renderOptions(madhab);
})();
