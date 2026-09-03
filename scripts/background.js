import '../lib/adhan.umd.min.js';
import { updateBadge } from './badge.js';
import { stopAdhan, closeAdhanPlayer, isAdhanActive } from './adhan-audio.js';
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
    chrome.storage.session.remove('activeNotifId');
  }
});

chrome.notifications.onClosed.addListener(handleNotificationClosed);
chrome.notifications.onClicked.addListener(handleNotificationClosed);

async function reconcileAdhanState() {
  const active = await isAdhanActive();
  if (!active) await chrome.storage.session.set({ adhanPlaying: false });
  return active;
}

chrome.runtime.onStartup.addListener(reconcileAdhanState);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'queryAdhanState') {

    reconcileAdhanState().then(sendResponse);
    return true;
  }
  if (msg?.type === 'adhanStarted') {
    chrome.storage.session.set({ adhanPlaying: true });
  }
  if (msg?.type === 'chimeFinished') {
    closeAdhanPlayer();
  }
  if (msg?.type === 'adhanFinished') {
    chrome.storage.session.set({ adhanPlaying: false });
    closeAdhanPlayer();
  }
  if (msg?.type === 'stopAdhan') {
    stopAdhan();
    chrome.storage.session.get('activeNotifId').then(({ activeNotifId }) => {
      if (activeNotifId) {
        chrome.notifications.clear(activeNotifId);
        chrome.storage.session.remove('activeNotifId');
      }
    });
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
reconcileAdhanState();