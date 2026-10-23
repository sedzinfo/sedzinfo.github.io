// The footer of every site under https://sedzinfo.github.io/ — the ONLY place it is defined.
// Used by the home page and the vignettes sites (Quarto, via quarto/_ga_consent.html, and the
// vignettes list, via build_index.py). The pkgdown sites (rwf, worldbankmodular, crypto) keep
// pkgdown's own footer, set in their _pkgdown.yml.
// A site loads it BEFORE consent.js (both deferred, so they run in this order):
//   <script src="https://sedzinfo.github.io/footer.js" defer></script>
//   <script src="https://sedzinfo.github.io/consent.js" defer></script>
// consent.js adds its own "Cookie settings" link only to a footer that has none; this footer
// already carries one, so loading footer.js first keeps a single link.
// The footer fills <footer id="sedzinfo-footer"></footer> when the page has one; on a Quarto
// site it fills the footer Quarto draws (an empty page-footer in _quarto.yml, so it sits at the
// bottom of the page); otherwise it is added at the end of <body>.
// Styles are inline, so it needs no Bootstrap.
(function () {
  const HOME = "https://sedzinfo.github.io/";
  const LINKS = [
    ["github.com/sedzinfo", "https://github.com/sedzinfo"],
    ["Cookie settings", "#cookie-settings"],   // opens the banner of consent.js
    ["Privacy", HOME + "privacy.html"],
  ];
  // text at the left of the footer for the sites that need one, by address
  const NOTES = {
    "/vignettes/cat_irt_eap/": "Adapted from catR (Magis, Raîche &amp; Barrada), GPL-3",
  };

  function init() {
    // where it goes: the page's own placeholder, else the footer Quarto (page-footer) already
    // lays out at the bottom of the page, else a new one at the end of <body>
    let footer = document.getElementById("sedzinfo-footer") ||
                 document.querySelector("footer.footer");
    if (footer) footer.id = "sedzinfo-footer";
    else {
      footer = document.createElement("footer");
      footer.id = "sedzinfo-footer";
      document.body.appendChild(footer);
    }
    // note at the left, links centred, Home at the right edge
    footer.setAttribute("style",
      "display:grid; grid-template-columns:1fr auto 1fr; align-items:center; column-gap:1rem;" +
      "border-top:1px solid #dee2e6; padding:1rem 1.5rem; font-size:14px; line-height:1.5;" +
      "color:#6c757d; background:#fff; clear:both");
    const link = (text, href) => '<a href="' + href + '" style="color:inherit">' + text + "</a>";
    const path = location.pathname;
    const note = Object.keys(NOTES).find(p => path.indexOf(p) === 0);
    footer.innerHTML =
      "<span>" + (note ? NOTES[note] : "") + "</span>" +
      '<span style="text-align:center">' + LINKS.map(l => link(l[0], l[1])).join(" · ") + "</span>" +
      '<span style="text-align:right">' + link("Home", HOME) + "</span>";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
