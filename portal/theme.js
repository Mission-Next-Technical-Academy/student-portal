/* Mission Next appearance preference shared by all first-party app surfaces. */
(function () {
  'use strict';
  var key = 'mission-next-theme';
  var root = document.documentElement;

  function readTheme() {
    try { return localStorage.getItem(key) === 'night' ? 'night' : 'day'; }
    catch (_) { return 'day'; }
  }

  function applyTheme(theme) {
    theme = theme === 'night' ? 'night' : 'day';
    root.dataset.mnTheme = theme;
    root.style.colorScheme = theme === 'night' ? 'dark' : 'light';
    var button = document.getElementById('mn-theme-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(theme === 'night'));
      button.setAttribute('aria-label', 'Switch to ' + (theme === 'night' ? 'day' : 'night') + ' mode');
      button.innerHTML = theme === 'night'
        ? '<span aria-hidden="true">☀</span><span>Day mode</span>'
        : '<span aria-hidden="true">☾</span><span>Night mode</span>';
    }
  }

  applyTheme(readTheme());
  function mountToggle() {
    if (document.getElementById('mn-theme-toggle')) return;
    var button = document.createElement('button');
    button.id = 'mn-theme-toggle';
    button.type = 'button';
    button.className = 'mn-theme-toggle';
    button.addEventListener('click', function () {
      var next = root.dataset.mnTheme === 'night' ? 'day' : 'night';
      try { localStorage.setItem(key, next); } catch (_) { /* session still works */ }
      applyTheme(next);
    });
    document.body.appendChild(button);
    applyTheme(readTheme());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountToggle, { once: true });
  else mountToggle();
  window.addEventListener('storage', function (event) {
    if (event.key === key) applyTheme(event.newValue === 'night' ? 'night' : 'day');
  });
})();
