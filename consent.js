// Cookie banner and Google Analytics for every site under https://sedzinfo.github.io/
// Each site loads this file with <script src="/consent.js" defer></script>:
//   the home page (index.html), the vignettes sites (quarto/_ga_consent.html in that repo)
//   and the rwf and worldbankmodular pkgdown sites (template: includes: after_body in _pkgdown.yml).
// Google Analytics loads only after the visitor accepts. The choice is kept in localStorage,
// which all the sites share, so visitors answer once.
// Any link to #cookie-settings reopens the banner; one is added to the footer if the page has none.
(function () {
  const GA_ID = "G-VSX11PYNWT";
  const KEY = "ga-consent";
  let loaded = false;

  function getConsent() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function saveConsent(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadGA() {
    window["ga-disable-" + GA_ID] = false;
    if (loaded) return;
    loaded = true;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });
  }

  function stopGA() {
    window["ga-disable-" + GA_ID] = true;
    // Remove the _ga cookies Google Analytics may already have set
    document.cookie.split(";").map(c => c.trim().split("=")[0]).filter(n => n.indexOf("_ga") === 0).forEach(n => {
      document.cookie = n + "=; Max-Age=0; path=/";
      document.cookie = n + "=; Max-Age=0; path=/; domain=." + location.hostname;
    });
  }

  function init() {
    // All the sites use Bootstrap 5, so the banner is styled with its classes
    const banner = document.createElement("div");
    banner.id = "cookie-banner";
    banner.className = "position-fixed bottom-0 start-0 end-0 bg-dark text-light p-3 shadow d-none";
    banner.style.zIndex = "1080";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML =
      '<div class="container d-flex flex-column flex-md-row align-items-md-center gap-3">' +
        '<p class="mb-0 small flex-grow-1">This site uses Google Analytics cookies to count visits and see which pages are read. ' +
        'No data is collected unless you accept. You can change your choice at any time from "Cookie settings" at the bottom of the page.</p>' +
        '<div class="d-flex gap-2 flex-shrink-0">' +
          '<button type="button" class="btn btn-light btn-sm" data-consent="no">Reject</button>' +
          '<button type="button" class="btn btn-light btn-sm" data-consent="yes">Accept</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);

    banner.querySelectorAll("[data-consent]").forEach(btn => btn.addEventListener("click", () => {
      const v = btn.dataset.consent;
      saveConsent(v);
      banner.classList.add("d-none");
      if (v === "yes") loadGA(); else stopGA();
    }));

    // pkgdown footers have no Cookie settings link, so add one (the other sites have it in their footer)
    if (!document.querySelector('a[href$="#cookie-settings"]')) {
      const footer = document.querySelector(".pkgdown-footer-right") || document.querySelector("footer");
      if (footer) {
        const p = document.createElement("p");
        p.innerHTML = '<a href="#cookie-settings">Cookie settings</a>';
        footer.appendChild(p);
      }
    }

    document.addEventListener("click", e => {
      const a = e.target.closest('a[href$="#cookie-settings"]');
      if (!a) return;
      e.preventDefault();
      banner.classList.remove("d-none");
    });

    const c = getConsent();
    if (c === "yes") loadGA();
    else if (c === null) banner.classList.remove("d-none");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
