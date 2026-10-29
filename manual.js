/* Manuals: follow the calculator's theme and highlight the chapter being read. */
(function () {
  var root = document.documentElement;
  var theme = null;
  try { theme = new URLSearchParams(location.search).get('theme'); } catch (e) { /* ignore */ }
  if (theme !== 'light' && theme !== 'dark') {
    try { theme = localStorage.getItem('compounding_calculator_theme'); } catch (e) { theme = null; }
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  root.setAttribute('data-theme', theme);

  // Opened at a chapter (from the calculator's Help): land on it once images and fonts have settled
  window.addEventListener('load', function () {
    var id = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';
    var el = id && document.getElementById(id);
    if (el) el.scrollIntoView({ block: 'start', behavior: 'auto' });
  });

  document.addEventListener('DOMContentLoaded', function () {
    var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && byId[en.target.id]) {
          links.forEach(function (a) { a.classList.remove('active'); });
          byId[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '0px 0px -70% 0px' });
    Object.keys(byId).forEach(function (id) { var el = document.getElementById(id); if (el) obs.observe(el); });
  });
})();
