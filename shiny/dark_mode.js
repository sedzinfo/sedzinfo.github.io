// Dark mode of the Shiny apps that draw their own (golemenviro, golemeurostat, golemirt, golemworldbank),
// which load it from https://sedzinfo.github.io/shiny/dark_mode.js in the head of the page.
// A moon/sun button at the right of the navbar switches the dark-mode class of <html>, which the
// dark_mode.css of each app styles. The choice is remembered; without one, the setting of the system
// is followed. Also:
// - Bootstrap 5 (golemirt) restyles the page itself from data-bs-theme on <html>, and on the navbar,
//   which sets its own; with Bootstrap 3 the attribute is left out.
// - The server is told (input$dark_mode), for the colors it draws itself, such as those of the
//   heatmap of the Daily Pattern tab of golemenviro.
// - The axes of 3D charts, which WebGL draws out of the reach of CSS, are recolored through plotly.
(function() {
  const key = 'dark-mode';
  const saved = (function() { try { return localStorage.getItem(key); } catch (e) { return null; } })();
  const dark = saved === null ? window.matchMedia('(prefers-color-scheme: dark)').matches : saved === 'true';
  const theme = function(on) { return on ? 'dark' : 'light'; };
  const isDark = function() { return document.documentElement.classList.contains('dark-mode'); };
  // Bootstrap 5 has a global bootstrap object, loaded before this file; Bootstrap 3 has none
  const bs5 = typeof window.bootstrap !== 'undefined';
  // set before the page is drawn, so that it does not flash white
  document.documentElement.classList.toggle('dark-mode', dark);
  if (bs5) document.documentElement.setAttribute('data-bs-theme', theme(dark));

  const report = function() {
    if (window.Shiny && Shiny.setInputValue) Shiny.setInputValue('dark_mode', isDark());
  };
  $(document).on('shiny:connected', report);

  // the axes of the 3D charts: light in dark mode, plotly's own colors otherwise
  const sceneColors = function(gd) {
    if (!gd._fullLayout || !window.Plotly) return;
    const on = isDark();
    const update = {};
    Object.keys(gd._fullLayout).filter(function(k) { return /^scene\d*$/.test(k); }).forEach(function(scene) {
      ['xaxis', 'yaxis', 'zaxis'].forEach(function(axis) {
        const color = ((gd.layout[scene] || {})[axis] || {}).color;
        // only when it changes, as relayout draws the chart again
        if (on ? color !== '#ddd' : color !== undefined) {
          update[scene + '.' + axis + '.color'] = on ? '#ddd' : null;
          update[scene + '.' + axis + '.gridcolor'] = on ? '#555' : null;
        }
      });
    });
    if (Object.keys(update).length) Plotly.relayout(gd, update);
  };

  $(function() {
    const navbar = $('nav.navbar');
    if (bs5) navbar.attr('data-bs-theme', theme(isDark()));
    const button = $('<a href="#" id="dark-mode-toggle"></a>');
    if (bs5) button.addClass('nav-link');
    const label = function() {
      const on = isDark();
      button.html(on ? '&#9728;' : '&#9790;').attr('title', on ? 'Light mode' : 'Dark mode');
    };
    label();
    button.on('click', function(e) {
      e.preventDefault();
      const on = document.documentElement.classList.toggle('dark-mode');
      if (bs5) {
        document.documentElement.setAttribute('data-bs-theme', theme(on));
        navbar.attr('data-bs-theme', theme(on));
      }
      try { localStorage.setItem(key, on); } catch (err) {}
      label();
      report();
      $('.js-plotly-plot').each(function() { sceneColors(this); });
    });
    // inside the collapsing part of the navbar, so that it sits on the row of the tabs, at the right;
    // bslib (Bootstrap 5) lets each list of the navbar grow (flex-grow 1), which flex-grow-0 stops for this one
    let collapse = $('.navbar .navbar-collapse').first();
    if (!collapse.length) collapse = $('.navbar .container-fluid').first();
    const list = bs5 ? $('<ul class="nav navbar-nav ms-auto flex-grow-0"></ul>').append($('<li class="nav-item"></li>').append(button))
                     : $('<ul class="nav navbar-nav navbar-right"></ul>').append($('<li></li>').append(button));
    collapse.append(list);
    // a 3D chart drawn later, or drawn again
    $(document).on('plotly_afterplot', '.js-plotly-plot', function() { sceneColors(this); });
  });
})();
