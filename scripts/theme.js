import { getStorage, setStorage } from './storage.js';

export function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
}

export async function initTheme() {
  try {
    const result = await getStorage('theme');
    applyTheme(result.theme || 'dark');
  } catch (error) {
    console.error('Failed to load theme:', error);
    applyTheme('dark');
  }

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', async () => {
      const currentTheme = document.body.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      applyTheme(newTheme);
      
      try {
        await setStorage({ theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme:', error);
      }
    });
  }
}