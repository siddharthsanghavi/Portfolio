// Theme: follows the system setting until the visitor picks one, then
// remembers that choice across pages. Loaded in <head> so there is no flash.
(function () {
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function saved() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }

  function apply(dark) {
    root.classList.toggle('dark', dark);
    var button = document.getElementById('dark-toggle');
    if (button) button.textContent = dark ? 'LIGHT MODE' : 'DARK MODE';
  }

  function current() {
    var choice = saved();
    return choice ? choice === 'dark' : media.matches;
  }

  apply(current());

  media.addEventListener('change', function () {
    if (!saved()) apply(media.matches);
  });

  document.addEventListener('DOMContentLoaded', function () {
    apply(current());
    var button = document.getElementById('dark-toggle');
    if (!button) return;
    button.addEventListener('click', function () {
      var dark = !root.classList.contains('dark');
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
      apply(dark);
    });
  });
})();
