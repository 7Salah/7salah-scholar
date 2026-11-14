/* 7salah Scholar — theme controller (v19q visual foundation) */
(function () {
  "use strict";
  var KEY = "7s_theme";
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function readTheme() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch (_) {}
    return media && media.matches ? "dark" : "light";
  }
  function paint(theme) {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0d1728" : "#001449");
    var button = document.getElementById("theme-toggle");
    if (button) {
      var dark = theme === "dark";
      var lang = (root.lang || "ar").slice(0, 2);
      button.innerHTML = dark
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/></svg>';
      button.setAttribute("aria-pressed", String(dark));
      var lbl = lang === "en" ? (dark ? "Switch to light mode" : "Switch to dark mode") : lang === "fr" ? (dark ? "Passer en mode clair" : "Passer en mode sombre") : (dark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن");
      button.setAttribute("aria-label", lbl);
      button.setAttribute("title", lbl);
    }
  }
  function set(theme, save) {
    paint(theme === "dark" ? "dark" : "light");
    if (save !== false) {
      try { localStorage.setItem(KEY, theme); } catch (_) {}
    }
  }
  window.ScholarTheme = { set: set, get: function () { return root.getAttribute("data-theme") || readTheme(); }, sync: function () { paint(root.getAttribute("data-theme") || readTheme()); } };
  set(readTheme(), false);
  document.addEventListener("DOMContentLoaded", function () {
    var button = document.getElementById("theme-toggle");
    if (button) button.addEventListener("click", function () {
      set(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    });
  });
  if (media && media.addEventListener) media.addEventListener("change", function (event) {
    try { if (!localStorage.getItem(KEY)) set(event.matches ? "dark" : "light", false); } catch (_) {}
  });
})();
