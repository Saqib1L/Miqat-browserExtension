const OFFSCREEN_PATH = 'pages/offscreen/offscreen.html';

let creating = null;

async function hasOffscreen() {
  if (!chrome.runtime.getContexts) return false;
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_PATH)],
  });
  return contexts.length > 0;
}

async function ensureOffscreen() {
  if (await hasOffscreen()) return;
  if (creating) { await creating; return; }

  creating = chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Play the adhan when a prayer time notification fires.',
  });

  try {
    await creating;
  } catch (err) {
    if (!String(err?.message).includes('Only a single offscreen')) throw err;
  } finally {
    creating = null;
  }
}

export async function playAdhan(soundFile, volume = 1) {
  try {
    await ensureOffscreen();
    await chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'playAdhan',
      url: chrome.runtime.getURL(`media/audio/${soundFile}`),
      volume,
    });
  } catch (err) {
    console.error('Could not play adhan:', err);
  }
}

export async function playChime(soundFile, volume = 1) {
  try {
    await ensureOffscreen();
    await chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'playChime',
      url: chrome.runtime.getURL(`media/audio/${soundFile}`),
      volume,
    });
  } catch (err) {
    console.error('Could not play chime:', err);
  }
}

export async function isAdhanActive() {
  return hasOffscreen();
}

export async function stopAdhan() {
  
  if (!(await hasOffscreen())) return;
  try {
    await chrome.runtime.sendMessage({ target: 'offscreen', type: 'stopAdhan' });
  } catch (err) {
    console.error('Could not stop adhan:', err);
  }
}

export async function closeAdhanPlayer() {
  if (await hasOffscreen()) {
    await chrome.offscreen.closeDocument().catch(() => {});
  }
}