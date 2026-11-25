/* Loaded before styles so the saved appearance is applied before the first paint. */
(() => {
  'use strict';
  const key = 'malowanie-bielsko-appearance';
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const normalize = value => value === 'light' || value === 'dark' ? value : 'system';
  const readPreference = () => {
    try { return normalize(window.localStorage.getItem(key)); }
    catch { return 'system'; }
  };
  let preference = readPreference();

  function applyAppearance() {
    const theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    // The site's own palette takes priority over automatic browser recolouring.
    const scheme = `only ${theme}`;
    root.style.colorScheme = scheme;
    const schemeMeta = document.querySelector('meta[name="color-scheme"]');
    if (schemeMeta) schemeMeta.content = scheme;
    const browserColor = document.querySelector('meta[name="theme-color"]');
    if (browserColor) browserColor.content = theme === 'dark' ? '#102b36' : '#e3f0ef';
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const label = theme === 'dark' ? 'Włącz jasny wygląd' : 'Włącz ciemny wygląd';
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
    });
    document.querySelectorAll('input[name="appearance"]').forEach(input => {
      input.checked = input.value === theme;
    });
  }

  function chooseAppearance(value) {
    preference = normalize(value);
    try {
      if (preference === 'system') window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, preference);
    } catch { /* The control still works if browser storage is unavailable. */ }
    applyAppearance();
  }

  applyAppearance();
  const onSystemChange = () => { if (preference === 'system') applyAppearance(); };
  if (system.addEventListener) system.addEventListener('change', onSystemChange);
  else if (system.addListener) system.addListener(onSystemChange);
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      preference = readPreference();
      applyAppearance();
    }
  });
  window.addEventListener('pageshow', () => {
    preference = readPreference();
    applyAppearance();
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.addEventListener('click', () => chooseAppearance(root.dataset.theme === 'dark' ? 'light' : 'dark'));
    });
    document.querySelectorAll('input[name="appearance"]').forEach(input => {
      const select = () => {
        if (input.checked && preference !== input.value) chooseAppearance(input.value);
      };
      input.addEventListener('change', select);
      input.addEventListener('click', select);
    });
    applyAppearance();
  }, { once: true });
})();
