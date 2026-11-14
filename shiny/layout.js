// The phone layout of the Shiny apps whose tabs are charts under a navbar, on Bootstrap 3:
// golemeurostat and golemworldbank. It is kept here only (https://sedzinfo.github.io/shiny/layout.js),
// and each app loads it with layout.css (shared_layout() in its R code). A change here reaches both
// apps without deploying them: check it in both, on a phone upright and sideways.

// Phones: close the menu of the navbar toggle once a tab is chosen in it, so that the
// tab is seen at once (Bootstrap 3 leaves the menu open over the top of the page).
// On a desktop the menu is never collapsed, so this does nothing there.
$(document).on('click', '.navbar-collapse.in a[data-toggle="tab"], .navbar-collapse.in a[data-bs-toggle="tab"]', function() {
  $(this).closest('.navbar-collapse').collapse('hide');
});

// Phones: a layout of the charts that fits a phone. The charts are made for a desktop window
// (a 20px font, 100px margins, the legend over the plot, the Play, Pause and Stop buttons and
// the year slider over the labels of the x axis), which leaves a phone almost no room for the
// plot. On a phone the chart that the server sends is changed just before plotly draws it:
// - the font is 12px, and the margins only as wide as the labels need;
// - long titles, axis titles and legend names are broken into lines that fit;
// - the Play, Pause and Stop buttons are in a row under the x axis, the year slider under them;
// - upright, the title is under the plotly toolbar and the legend under the title, above the
//   plot, the color bar of the map lies under the map, and a chart grows when its plot would be
//   too short (the page scrolls);
// - sideways, where the height is short, a short title is at the top left, beside the toolbar,
//   and the legend at the right of the plot;
// - the bubbles of the Scatterplot and the year of the Barplot are smaller, the Barplot labels
//   fewer ranks, and the pyramid has fewer ticks, smaller labels on its bars and room for them.
// The phones are the screens of layout.css. A desktop window draws the chart as it is sent.
// When the width of a chart changes (a phone turned sideways), it is drawn again for the new
// width.
(function() {
  var phone = window.matchMedia('(max-width: 767px), (max-height: 500px) and (pointer: coarse)');
  var FONT = 12, TITLE = 14, LEGEND = 11;
  var LINE = 1.3;      // plotly puts the lines of a text 1.3 font sizes apart
  var TOOLBAR = 30;    // the height of the plotly toolbar, at the top right of the chart
  var canvas = document.createElement('canvas').getContext('2d');

  // the width of a text in the font of plotly
  function textWidth(text, size) {
    canvas.font = size + 'px "Open Sans", verdana, arial, sans-serif';
    return canvas.measureText(text).width;
  }
  // the words of a text in lines no wider than max (a longer word has a line of its own)
  function lines(text, size, max) {
    var out = [], line = '';
    String(text).split(' ').forEach(function(word) {
      var next = line ? line + ' ' + word : word;
      if (line && textWidth(next, size) > max) {
        out.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) out.push(line);
    return out;
  }
  // a title of plotly is a text, or an object with the text in text
  function titleText(title) {
    if (title === null || title === undefined) return '';
    return typeof title === 'object' ? (title.text || '') : String(title);
  }
  // the traces of the chart and of every frame of its animation
  function allTraces(x) {
    var traces = x.data.slice();
    (x.frames || []).forEach(function(frame) { traces = traces.concat(frame.data || []); });
    return traces;
  }
  // bars with their labels outside (plotly R gives textposition for every bar)
  function labelsOutside(trace) {
    return trace.type === 'bar' && [].concat(trace.textposition).indexOf('outside') !== -1;
  }
  // the first step whose ticks are at least gap apart, when one unit is unit pixels
  function tickStep(unit, gap) {
    return [1, 2, 5, 10, 20, 25, 50].filter(function(s) { return s * unit >= gap; })[0] || 50;
  }

  // a copy of the chart sent by the server, laid out for its place on the page (el)
  function fit(value, el) {
    var v = JSON.parse(JSON.stringify(value)), x = v.x, L = x.layout, traces = allTraces(x);
    el.style.minHeight = '';   // the height that the page gives the chart (see below)
    var W = el.clientWidth || window.innerWidth, H = el.clientHeight || 400;
    var wide = W >= 600;   // sideways: room at the sides, little in height
    var xa = L.xaxis, ya = L.yaxis, slider = L.sliders && L.sliders[0];
    var animated = !!(L.updatemenus && slider && slider.steps && slider.steps.length);
    L.font = $.extend({}, L.font, {size: FONT});
    L.margin = {l: 8, r: 8, t: 8, b: 8, pad: 0};

    // a legend of one entry too, when the chart asks for it (one country chosen)
    var legend = L.showlegend === true || (L.showlegend !== false && x.data.length > 1);
    var yTitleLines = ya && titleText(ya.title) ? 2 : 0;
    // the left margin that the y axis takes: at the least (tick labels of 20px) and at the most
    var leftMin = 8 + 20 + yTitleLines * FONT * LINE, leftMax = leftMin + 30;

    // the title: upright under the toolbar, sideways (when short) at the top left, beside it
    var top = TOOLBAR, title = titleText(L.title);
    var titleLines = title ? lines(title, TITLE, W - 16) : [];
    if (wide && titleLines.length === 1 && textWidth(title, TITLE) < W - 360) {
      L.title = {text: title, font: {size: TITLE}, xref: 'container', x: 0, xanchor: 'left',
                 yref: 'container', y: 1, yanchor: 'top', pad: {l: 8, t: 8}};
      top = 8 + TITLE * LINE;
    } else if (title) {
      // plotly puts a title of more than one line 10px higher than a title of one line
      L.title = {text: titleLines.join('<br>'), font: {size: TITLE}, xref: 'container', x: 0.5,
                 xanchor: 'center', yref: 'container', y: 1, yanchor: 'top',
                 pad: {t: titleLines.length > 1 ? TOOLBAR + 10 : TOOLBAR}};
      top = TOOLBAR + titleLines.length * TITLE * LINE;
    }

    // the legend. Sideways it is at the right of the plot. Upright it is above the plot, under the
    // title: centered in one row when the names fit in it, otherwise in columns as wide as the
    // chart (plotly gives that width only to a legend that starts left of the plot).
    var legendHeight = 0, legendWidth = 0;
    if (legend) {
      var names = x.data.map(function(trace) { return trace.name || ''; });
      var widths = names.map(function(name) { return textWidth(name, LEGEND) + 45; });
      var max, columns;
      if (wide) {
        max = 150;
        L.legend = {orientation: 'v', x: 1, xanchor: 'left', y: 1, yanchor: 'top', font: {size: LEGEND}};
        legendWidth = max + 50;
        top = Math.max(top, TOOLBAR);
      } else if (widths.reduce(function(a, b) { return a + b; }, 0) <= W - leftMax - 8) {
        max = W - 70;
        columns = names.length;
        L.legend = {orientation: 'h', x: 0.5, xanchor: 'center', y: 1, yanchor: 'bottom', font: {size: LEGEND}};
      } else {
        // an entry of the legend is its symbol (40px) and its name (entrywidth)
        columns = Math.max(2, Math.min(4, Math.floor((W - 16) / Math.max.apply(null, widths))));
        var nameWidth = Math.floor((W - 16) / columns) - 44;
        max = nameWidth - 5;
        L.legend = {orientation: 'h', x: -(leftMin - 4) / (W - leftMin - 8), xanchor: 'left', y: 1,
                    yanchor: 'bottom', font: {size: LEGEND}, entrywidth: nameWidth, entrywidthmode: 'pixels'};
      }
      traces.forEach(function(trace) {
        if (trace.name) trace.name = lines(trace.name, LEGEND, max).join('<br>');
      });
      // the height that plotly gives it: rows as high as their highest entry (1.3 font sizes a
      // line, at least 16px, and 3px), and 10px
      if (!wide) {
        legendHeight = 10;
        for (var i = 0; i < names.length; i += columns) {
          legendHeight += Math.max.apply(null, names.slice(i, i + columns).map(function(name) {
            return Math.max(lines(name, LEGEND, max).length * LEGEND * LINE, 16) + 3;
          }));
        }
        legendHeight = Math.ceil(legendHeight) + 4;
      }
    }
    // the plot starts under the title and the legend (plotly puts the legend right above the plot)
    L.margin.t = Math.ceil(top + (legendHeight || 6));

    // the x axis title in lines (in the font of the chart: plotly makes axis titles 1.2 times
    // bigger), then the room under the plot for its labels (or the color bar)
    if (xa && titleText(xa.title)) {
      // the title is centered under the plot, and may be wider than the plot, not than the chart
      var middle = function(left) { return left + (W - left - 8 - legendWidth) / 2; };
      var half = Math.min(middle(leftMin) - 4, W - 4 - middle(leftMax));
      xa.title = $.extend(typeof xa.title === 'object' ? xa.title : {},
                          {text: lines(titleText(xa.title), FONT, 2 * half).join('<br>'), font: {size: FONT}});
    }
    var below = 6, colorbar = false;
    traces.forEach(function(trace) {
      if (!trace.colorbar) return;
      colorbar = true;
      $.extend(trace.colorbar, wide ? {thickness: 10, len: 0.9, xpad: 4} :
               {orientation: 'h', x: 0.5, xanchor: 'center', y: 0, yanchor: 'top', len: 0.9,
                thickness: 10, xpad: 0, ypad: 4});
    });
    if (colorbar && !wide) below += 10 + 4 + FONT * LINE + 8;
    if (xa && !L.geo && xa.showticklabels !== false) below += FONT * LINE + 4;
    if (xa && titleText(xa.title)) {
      // plotly puts a title of n lines n - 1 lines lower than a title of one line
      var n = titleText(xa.title).split('<br>').length;
      below += (2 * n - 1) * FONT * LINE + (xa.title.standoff || 0) + 6;
    }
    var controls = animated ? 80 : 0;   // the buttons and the slider under them
    var plotHeight = H - top - legendHeight - below - controls;
    var plotWidth = Math.max(100, W - 80 - legendWidth);
    // upright, where the page scrolls, a chart grows to keep its plot 220px high (the
    // Scatterplot, with its legend of 7 regions, on a small phone)
    if (!wide && plotHeight < 220) {
      H += 220 - plotHeight;
      el.style.minHeight = Math.ceil(H) + 'px';
      plotHeight = 220;
    }

    // the y axis title in lines along the plot
    if (ya && titleText(ya.title)) {
      ya.title = $.extend(typeof ya.title === 'object' ? ya.title : {},
                          {text: lines(titleText(ya.title), FONT, plotHeight * 0.9).join('<br>'), font: {size: FONT}});
    }

    // the pyramid: a tick for every 1% leaves no room for the labels, and the labels outside the
    // longest bars need room at the ends of the axis
    if (traces.some(labelsOutside) && xa && xa.range) {
      var room = (xa.range[1] - xa.range[0]) * 30 / plotWidth;
      xa.range = [xa.range[0] - room, xa.range[1] + room];
    }
    if (xa && xa.tickmode === 'array' && xa.tickvals && xa.tickvals.length > 20 && xa.range) {
      var step = tickStep(plotWidth / (xa.range[1] - xa.range[0]), 45);
      var keep = xa.tickvals.map(function(val) { return val % step === 0; });
      xa.tickvals = xa.tickvals.filter(function(val, i) { return keep[i]; });
      xa.ticktext = xa.ticktext.filter(function(val, i) { return keep[i]; });
    }
    // the Barplot: a label for every rank only when there is room for it
    if (ya && ya.dtick === 1 && ya.range) {
      ya.dtick = tickStep(plotHeight / Math.abs(ya.range[1] - ya.range[0]), FONT * 1.2);
      ya.tick0 = ya.dtick === 2 ? 1 : 0;
    }

    // smaller labels outside the bars (pyramid), bubbles (Scatterplot) and year (Barplot)
    var scale = Math.min(1, Math.min(W, H) / 900);
    traces.forEach(function(trace) {
      if (labelsOutside(trace)) trace.textfont = $.extend({}, trace.textfont, {size: 9});
      var m = trace.marker;
      // the bubbles with their names too (golemeurostat's), not the dots of the line charts
      if (trace.type === 'scatter' && /markers/.test(trace.mode || '') && !/lines/.test(trace.mode || '') &&
          m && m.size !== undefined) {
        m.size = Array.isArray(m.size) ? m.size.map(function(s) { return s * scale; }) : m.size * scale;
      }
    });
    function smallYear(annotations) {
      (annotations || []).forEach(function(a) {
        if (a.font && a.font.size > 100) a.font.size = Math.min(a.font.size, Math.round(W / 3));
      });
    }
    smallYear(L.annotations);
    (x.frames || []).forEach(function(frame) { if (frame.layout) smallYear(frame.layout.annotations); });

    // Play, Pause and Stop in one menu under the x axis, in the row of the year of the slider;
    // the slider under them
    if (animated) {
      var buttons = [];
      L.updatemenus.forEach(function(menu) { buttons = buttons.concat(menu.buttons || []); });
      buttons.sort(function(a, b) { return (b.label === 'Play') - (a.label === 'Play'); });
      L.updatemenus = [{type: 'buttons', direction: 'right', showactive: false, buttons: buttons,
                        x: 0, xanchor: 'left', y: 0, yanchor: 'top', pad: {t: below, l: 0, r: 0, b: 0},
                        font: {size: FONT}}];
      $.extend(slider, {x: 0, len: 1, xanchor: 'left', y: 0, yanchor: 'top', font: {size: LEGEND},
                        pad: {t: below, l: 0, r: 0, b: 4}});
      slider.currentvalue = $.extend({}, slider.currentvalue, {
        font: $.extend({}, slider.currentvalue && slider.currentvalue.font, {size: FONT})
      });
    }
    return v;
  }

  // the chart as the server sends it is kept, and on a phone a fitted copy is drawn
  $(document).on('shiny:value', function(e) {
    var el = e.target;
    if (!$(el).hasClass('plotly') || !e.value || !e.value.x || !e.value.x.layout) return;
    el.sentChart = e.value;
    el.fittedWidth = phone.matches ? el.clientWidth : 0;
    if (phone.matches) e.value = fit(e.value, el);
  });

  // a chart whose width changed (or that went from a phone to a desktop, or back) is drawn again
  function refit() {
    $('.plotly.html-widget-output').each(function() {
      var el = this, width = phone.matches ? el.clientWidth : 0;
      var binding = $(el).data('shiny-output-binding');
      if (!el.sentChart || !binding || !el.offsetParent || Math.abs(width - el.fittedWidth) < 20) return;
      el.fittedWidth = width;
      if (!width) el.style.minHeight = '';
      binding.onValueChange(width ? fit(el.sentChart, el) : el.sentChart);
    });
  }
  var timer;
  $(window).on('resize', function() {
    clearTimeout(timer);
    timer = setTimeout(refit, 300);
  });
  $(document).on('shown.bs.tab', refit);
})();
