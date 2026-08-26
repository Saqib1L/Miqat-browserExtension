import '../lib/adhan.umd.min.js';
import { updateBadge } from './badge.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Prayer Times extension initialized.');
  updateBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'badgeTick') updateBadge();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.location) {
    updateBadge();
  }
});

updateBadge();