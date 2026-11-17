// Large numbers in short form for DT tables: 1299577870776.02 -> 1.30T, 31523009386.82 -> 31.52B,
// 718194850.32 -> 718.19M, 369852.43 -> 369.85K, below a thousand two decimals, with an optional
// prefix ('$'). Only what is shown changes: sorting and searching keep the full number.
// Shared by the Shiny apps (golemcrypto, golemstockindices), which load it from
// https://sedzinfo.github.io/shiny/short_number.js and call it from the render function of a column
// (R: short_number_render()), which shows the plain number when this file has not loaded.
window.shortNumber = function (data, type, prefix) {
  if (type !== 'display' || data === null || data === '' || isNaN(Number(data))) return data;
  var x = Number(data), sign = x < 0 ? '-' : '', a = Math.abs(x);
  var units = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  prefix = prefix || '';
  for (var i = 0; i < units.length; i++) {
    if (a >= units[i][0]) return sign + prefix + (a / units[i][0]).toFixed(2) + units[i][1];
  }
  return sign + prefix + a.toFixed(2);
};
