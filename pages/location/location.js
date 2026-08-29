import { setStorage, getStorage } from '../../scripts/storage.js';
import { initTheme } from '../../scripts/theme.js';
import { getLanguage, t, tf, applyTranslations } from '../../scripts/translation.js';

initTheme();

const backBtn = document.getElementById('backBtn');
const currentLocationText = document.getElementById('currentLocationText');

const automaticView = document.getElementById('automaticView');
const manualView = document.getElementById('manualView');

const tabSwitcher = document.getElementById('tabSwitcher');
const tabAutomatic = document.getElementById('tabAutomatic');
const tabManual = document.getElementById('tabManual');

const detectBtn = document.getElementById('detectLocationBtn');
const statusText = document.getElementById('statusText');
const setLocationBtn = document.getElementById('setLocationBtn');

const addressInput = document.getElementById('addressInput');
const resultsList = document.getElementById('resultsList');
const saveAddressBtn = document.getElementById('saveAddressBtn');

let pendingLocation = null;
let selectedResult = null;
let searchDebounce = null;
let lang = 'en';

function setStatus(text, state) {
  statusText.textContent = text;
  statusText.classList.remove('detected', 'error');
  if (state) statusText.classList.add(state);
}

function showView(view) {
  const isAutomatic = view === 'automatic';
  automaticView.classList.toggle('hidden', !isAutomatic);
  manualView.classList.toggle('hidden', isAutomatic);
  tabAutomatic.classList.toggle('active', isAutomatic);
  tabManual.classList.toggle('active', !isAutomatic);
  tabSwitcher.classList.toggle('manual-active', !isAutomatic);
}

async function loadSavedLocation() {
  const { location } = await getStorage('location');
  if (location) {
    currentLocationText.textContent = location.label || `${location.latitude}, ${location.longitude}`;
  }
}

backBtn.addEventListener('click', () => {
  const params = new URLSearchParams(window.location.search);
  window.location.href = params.get('from') === 'settings'
    ? '../settings/settings.html'
    : '../popup/popup.html';
});

tabAutomatic.addEventListener('click', () => showView('automatic'));
tabManual.addEventListener('click', () => showView('manual'));

detectBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus(t('geolocationUnsupported', lang), 'error');
    return;
  }

  setStatus(t('detectingLocation', lang));
  setLocationBtn.classList.add('hidden');
  pendingLocation = null;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const label = await reverseGeocode(latitude, longitude);
        pendingLocation = { latitude, longitude, label };
        setStatus(tf('detectedLabel', lang, { label }), 'detected');
        setLocationBtn.classList.remove('hidden');
      } catch {
        pendingLocation = { latitude, longitude, label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
        setStatus(t('locationDetectedNoAddress', lang), 'detected');
        setLocationBtn.classList.remove('hidden');
      }
    },
    (error) => {
      setStatus(tf('couldNotDetect', lang, { error: error.message }), 'error');
    }
  );
});

setLocationBtn.addEventListener('click', async () => {
  if (!pendingLocation) return;
  await setStorage({ location: pendingLocation });
  currentLocationText.textContent = pendingLocation.label;
  setStatus(t('locationSaved', lang), 'detected');
});

addressInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  saveAddressBtn.classList.add('hidden');
  selectedResult = null;

  const query = addressInput.value.trim();
  if (query.length < 3) {
    resultsList.classList.add('hidden');
    resultsList.innerHTML = '';
    return;
  }

  searchDebounce = setTimeout(() => searchAddress(query), 400);
});

saveAddressBtn.addEventListener('click', async () => {
  if (!selectedResult) return;

  const location = {
    latitude: selectedResult.lat,
    longitude: selectedResult.lon,
    label: selectedResult.label,
  };

  await setStorage({ location });
  currentLocationText.textContent = location.label;
  saveAddressBtn.querySelector('span').textContent = t('locationSaved', lang);
  setTimeout(() => {
    saveAddressBtn.querySelector('span').textContent = t('saveAddress', lang);
  }, 1500);
});

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Reverse geocoding failed');
  const data = await response.json();
  if (!data || !data.display_name) throw new Error('No address found');
  return data.display_name;
}

async function searchAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;

  try {
    const response = await fetch(url);
    const results = await response.json();
    renderResults(results);
  } catch {
    resultsList.classList.add('hidden');
  }
}

function renderResults(results) {
  resultsList.innerHTML = '';

  if (!results || results.length === 0) {
    resultsList.classList.add('hidden');
    return;
  }

  results.forEach((result) => {
    const item = document.createElement('li');
    item.className = 'result-item';

    const parts = result.display_name.split(',');
    const name = parts[0].trim();
    const detail = parts.slice(1).join(',').trim();

    item.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <div>
        <div class="result-item__name">${name}</div>
        <div class="result-item__detail">${detail}</div>
      </div>
    `;

    item.addEventListener('click', () => {
      selectedResult = {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        label: result.display_name,
      };
      addressInput.value = name;
      resultsList.classList.add('hidden');
      saveAddressBtn.classList.remove('hidden');
    });

    resultsList.appendChild(item);
  });

  resultsList.classList.remove('hidden');
}

async function init() {
  lang = await getLanguage();
  applyTranslations(lang);
  addressInput.placeholder = t('addressPlaceholder', lang);
  await loadSavedLocation();
}

init();