// Reports the tabs of a Shiny app, and its downloads, to Google Analytics, as pages and downloads.
// Shared by the Shiny apps (golemcat, golemcrypto, golemenviro, golemirt, golemstockindices,
// golemworldbank), which load it from https://sedzinfo.github.io/shiny/analytics.js, after consent.js,
// when they run with analytics = TRUE. A change here reaches all of them: the privacy note
// (/privacy.html) says what is counted, so keep the two in step.
// gtag() only exists once the visitor accepts on the cookie banner (consent.js), so nothing is sent before.
// Bootstrap 3 and 5 alike: their tab links are a[data-toggle="tab"] and a[data-bs-toggle="tab"].
(function() {
  // the tab shown: Bootstrap 5 marks its link active, Bootstrap 3 the <li> around the link
  function activeTab() {
    return $('.navbar .nav-link.active').attr('data-value') || $('.navbar li.active > a').attr('data-value');
  }

  $(document).on('shown.bs.tab', 'a[data-toggle="tab"], a[data-bs-toggle="tab"]', function(e) {
    if (typeof gtag !== 'function') return;
    const tab = $(e.target).attr('data-value');
    gtag('event', 'page_view', {
      page_title: tab,
      page_location: location.origin + location.pathname + '#' + encodeURIComponent(tab)
    });
  });

  // a download link can name its file type and its label (data-file-extension, data-link-text, as the
  // PDF report of golemcat does); without them, it is a CSV file of the tab shown
  $(document).on('click', '.shiny-download-link', function() {
    if (typeof gtag !== 'function') return;
    gtag('event', 'file_download', {
      file_extension: $(this).attr('data-file-extension') || 'csv',
      link_text: $(this).attr('data-link-text') || activeTab()
    });
  });
})();
