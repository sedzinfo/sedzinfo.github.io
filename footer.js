// The footer of every site under https://sedzinfo.github.io/ — the ONLY place it is defined.
// Used by the home page and the vignettes sites (Quarto, via quarto/_shared/_ga_consent.html, and
// the vignettes list, via build_index.py). The pkgdown sites of the R packages keep pkgdown's own
// footer, set in their _pkgdown.yml.
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
    // links centred, Home at the right edge (the empty left cell keeps the links centred).
    // A site's own note (e.g. a licence) goes in that site, above this footer: on Quarto,
    // body-footer in its _quarto.yml
    footer.setAttribute("style",
      "display:grid; grid-template-columns:1fr auto 1fr; align-items:center; column-gap:1rem;" +
      "border-top:1px solid #dee2e6; padding:1rem 1.5rem; font-size:14px; line-height:1.5;" +
      "color:#6c757d; background:#fff; clear:both");
    // where the links wrap (narrow phones), a link stays whole and each dot stays with the link
    // before it (a no-break space before the dot), rather than starting a line
    const link = (text, href) => '<a href="' + href + '" style="color:inherit; white-space:nowrap">' + text + "</a>";
    footer.innerHTML =
      "<span></span>" +
      '<span style="text-align:center">' + LINKS.map(l => link(l[0], l[1])).join("&nbsp;· ") + "</span>" +
      '<span style="text-align:right">' + link("Home", HOME) + "</span>";
    // phones and other touch screens: the links 40px high, big enough for a finger (a line of
    // text is 21px); on phones, the links centred with Home under them, instead of Home squeezed
    // in at the right. A stylesheet, as inline styles cannot depend on the screen (hence the
    // !important against them). A desktop with a mouse is not affected
    if (!document.getElementById("sedzinfo-footer-style")) {
      const style = document.createElement("style");
      style.id = "sedzinfo-footer-style";
      style.textContent =
        "@media (max-width: 767.98px), (hover: none) and (pointer: coarse) {" +
          " #sedzinfo-footer a { display: inline-block; padding: 10px 4px; }" +
        " }" +
        " @media (max-width: 575.98px) {" +
          " #sedzinfo-footer { grid-template-columns: 1fr !important; }" +
          " #sedzinfo-footer > span:first-child { display: none; }" +
          " #sedzinfo-footer > span { text-align: center !important; }" +
        " }";
      document.head.appendChild(style);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
