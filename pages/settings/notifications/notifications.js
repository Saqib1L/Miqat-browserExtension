import { initTheme } from "../../../scripts/theme.js";
import { PRAYERS_WITH_ADJUSTMENTS } from "../../../scripts/settings-schema.js";
import { getSettings, updateSettings } from "../../../scripts/settings-store.js";

initTheme();

const list = document.getElementById("toggleList");

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
});

function renderToggles(notifications) {
  list.innerHTML = "";
  for (const { key, label } of PRAYERS_WITH_ADJUSTMENTS) {
    const row = document.createElement("div");
    row.className = "toggle-row";

    const id = `notif-${key}`;
    row.innerHTML = `
      <label class="toggle-row__label" for="${id}">${label}</label>
      <label class="toggle" aria-label="Toggle ${label} notification">
        <input type="checkbox" id="${id}" data-prayer="${key}" ${notifications[key] ? "checked" : ""}>
        <span class="toggle__track"></span>
      </label>
    `;

    list.appendChild(row);
  }
}

list.addEventListener("change", async (e) => {
  const input = e.target.closest("input[data-prayer]");
  if (!input) return;
  const { notifications } = await getSettings();
  await updateSettings({
    notifications: { ...notifications, [input.dataset.prayer]: input.checked }
  });
});

(async function init() {
  const { notifications } = await getSettings();
  renderToggles(notifications);
})();
