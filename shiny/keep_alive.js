// Sends a ping to the server every 15 seconds, so proxies do not close idle connections.
// Shared by the Shiny apps (golemcat, golemcrypto, golemirt, golemstockindices), which load it from
// https://sedzinfo.github.io/shiny/keep_alive.js when they run with keep_alive = TRUE; their server
// reads the pings as input$count.
var keepAliveInterval;
var keepAliveCount = 0;

$(document).on('shiny:connected', function() {
  keepAliveInterval = setInterval(function() {
    Shiny.setInputValue('count', keepAliveCount++);
  }, 15000);
});

$(document).on('shiny:disconnected', function() {
  clearInterval(keepAliveInterval);
});
