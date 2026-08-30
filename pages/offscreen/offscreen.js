const player = document.getElementById('player');

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.target !== 'offscreen') return;

  if (msg.type === 'playAdhan') {
    player.pause();
    player.src = msg.url;
    player.volume = typeof msg.volume === 'number' ? msg.volume : 1;
    player.currentTime = 0;
    player.play().catch((err) => console.error('Adhan playback failed:', err.name, err.message));
    chrome.runtime.sendMessage({ type: 'adhanStarted' }).catch(() => {});

    player.onended = () => {
      chrome.runtime.sendMessage({ type: 'adhanFinished' }).catch(() => {});
    };
  }

  if (msg.type === 'playChime') {
    const chime = new Audio(msg.url);
    chime.volume = typeof msg.volume === 'number' ? msg.volume : 1;
    chime.play().catch((err) => console.error('Chime playback failed:', err.name, err.message));
  }

  if (msg.type === 'stopAdhan') {
    player.pause();
    player.currentTime = 0;
    chrome.runtime.sendMessage({ type: 'adhanFinished' }).catch(() => {});
  }
});