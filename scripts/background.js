import '../lib/adhan.umd.min.js';
import { updateBadge } from './badge.js';
import {
  scheduleNotifications,
  isNotificationAlarm,
  handleNotificationAlarm,
} from './notifications.js';

// notification handlers, alarm listeners, and events
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