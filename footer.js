// Shared footer for every site under https://sedzinfo.github.io/ — one place to edit it.
// A site loads it BEFORE consent.js (both deferred, so they run in this order):
//   <script src="https://sedzinfo.github.io/footer.js" defer></script>
//   <script src="https://sedzinfo.github.io/consent.js" defer></script>
// consent.js adds its own "Cookie settings" link only to a footer that has none; this footer
// already carries one, so loading footer.js first keeps a single link.
// The footer fills <footer id="sedzinfo-footer"></footer> when the page has one (to choose
// where it goes); otherwise it is added at the end of <body>.
// Styles are inline, so it needs no Bootstrap. The Quarto sites keep their own page-footer in
// _quarto.yml (same links and layout): keep the two in step.
(function () {
  const HOME = "https://sedzinfo.github.io/";
  const LINKS = [
    ["github.com/sedzinfo", "https://github.com/sedzinfo"],
    ["Cookie settings", "#cookie-settings"],   // opens the banner of consent.js
    ["Privacy", HOME + "privacy.html"],
  ];

  function init() {
    let footer = document.getElementById("sedzinfo-footer");
    if (!footer) {
      footer = document.createElement("footer");
      footer.id = "sedzinfo-footer";
      document.body.appendChild(footer);
    }
    // links centred, Home at the right edge
    footer.setAttribute("style",
      "display:grid; grid-template-columns:1fr auto 1fr; align-items:center; column-gap:1rem;" +
      "border-top:1px solid #dee2e6; padding:1rem 1.5rem; font-size:.875em; color:#6c757d");
    const link = (text, href) => '<a href="' + href + '" style="color:inherit">' + text + "</a>";
    footer.innerHTML =
      "<span></span>" +
      '<span style="text-align:center">' + LINKS.map(l => link(l[0], l[1])).join(" · ") + "</span>" +
      '<span style="text-align:right">' + link("Home", HOME) + "</span>";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
