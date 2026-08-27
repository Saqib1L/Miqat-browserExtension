import '../lib/adhan.umd.min.js';
import { updateBadge } from './badge.js';
import { stopAdhan, closeAdhanPlayer } from './adhan-audio.js';
import {
  scheduleNotifications,
  isNotificationAlarm,
  handleNotificationAlarm,
  handleNotificationClosed,
} from './notifications.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Prayer Times extension initialized.');
  updateBadge();
  scheduleNotifications();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'badgeTick') {
    updateBadge();
  } else if (isNotificationAlarm(alarm.name)) {
    handleNotificationAlarm(alarm.name);
  }
});

chrome.notifications.onButtonClicked.addListener((id) => {
  if (isNotificationAlarm(id)) {
    stopAdhan();
    chrome.notifications.clear(id);
  }
});

chrome.notifications.onClosed.addListener(handleNotificationClosed);
chrome.notifications.onClicked.addListener(handleNotificationClosed);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'adhanFinished') closeAdhanPlayer();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (changes.location) {
    updateBadge();
    scheduleNotifications();
  } else if (changes.settings || changes.notificationSettings) {
    scheduleNotifications();
  }
});

updateBadge();
scheduleNotifications();