import { setStorage, getStorage } from '../../scripts/storage.js';
import { initTheme } from '../../scripts/theme.js';

initTheme();

const backBtn = document.getElementById('backBtn');
const currentLocationText = document.getElementById('currentLocationText');

const automaticView = document.getElementById('automaticView');
const manualView = document.getElementById('manualView');

const detectBtn = document.getElementById('detectLocationBtn');
const statusRow = document.getElementById('statusRow');
const statusText = document.getElementById('statusText');
const setLocationBtn = document.getElementById('setLocationBtn');
const showManualBtn = document.getElementById('showManualBtn');
const showAutomaticBtn = document.getElementById('showAutomaticBtn');

const addressInput = document.getElementById('addressInput');
const resultsList = document.getElementById('resultsList');
const saveAddressBtn = document.getElementById('saveAddressBtn');

let pendingLocation = null;
let selectedResult = null;
let searchDebounce = null;

function setStatus(text, state) {
  statusText.textContent = text;
  statusRow.classList.remove('detected', 'error');
  if (state) statusRow.classList.add(state);
}

function showView(view) {
  automaticView.classList.toggle('hidden', view !== 'automatic');
  manualView.classList.toggle('hidden', view !== 'manual');
}

async function loadSavedLocation() {
  const { location } = await getStorage('location');
  if (location) {
    currentLocationText.textContent = location.label || `${location.latitude}, ${location.longitude}`;
  }
}

backBtn.addEventListener('click', () => {
  window.location.href = '../popup/popup.html';
});

showManualBtn.addEventListener('click', () => showView('manual'));
showAutomaticBtn.addEventListener('click', () => showView('automatic'));

detectBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Geolocation is not supported in this browser.', 'error');
    return;
  }

  setStatus('Detecting your location...');
  setLocationBtn.disabled = true;
  pendingLocation = null;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const label = await reverseGeocode(latitude, longitude);
        pendingLocation = { latitude, longitude, label };
        setStatus(`Detected: ${label}`, 'detected');
        setLocationBtn.disabled = false;
      } catch {
        pendingLocation = { latitude, longitude, label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
        setStatus('Detected coordinates, but could not resolve an address.', 'detected');
        setLocationBtn.disabled = false;
      }
    },
    (error) => {
      setStatus(`Could not detect location: ${error.message}`, 'error');
    }
  );
});

setLocationBtn.addEventListener('click', async () => {
  if (!pendingLocation) return;
  await setStorage({ location: pendingLocation });
  currentLocationText.textContent = pendingLocation.label;
  setStatus('Location saved.', 'detected');
});

addressInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  saveAddressBtn.disabled = true;
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
  showView('automatic');
  setStatus('Location saved.', 'detected');
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

  const countEl = document.createElement('div');
  countEl.className = 'results-list__count';
  countEl.textContent = `${results.length} RESULT${results.length === 1 ? '' : 'S'}`;
  resultsList.appendChild(countEl);

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
      saveAddressBtn.disabled = false;
    });

    resultsList.appendChild(item);
  });

  resultsList.classList.remove('hidden');
}

loadSavedLocation();