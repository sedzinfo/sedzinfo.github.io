# sedzinfo.github.io

---

## Overview

Home page for the sites published from the [sedzinfo](https://github.com/sedzinfo) repositories with GitHub Pages: https://sedzinfo.github.io/

## Sites

| Site | Description |
|---|---|
| [vignettes](https://sedzinfo.github.io/vignettes/) | Tutorials and worked examples in R: adaptive testing with EAP scoring, data visualisation, machine learning, psychometrics and scale validation |
| [rwf](https://sedzinfo.github.io/rwf/) | R package for statistical reporting and visualisation of common methods in psychology |
| [worldbankmodular](https://sedzinfo.github.io/worldbankmodular/) | Shiny application for exploring World Bank development indicators |

## How it works

- `index.html` is the home page. It uses the same theme (Bootswatch flatly) as the vignettes sites.
- Each repository with GitHub Pages turned on is served under its own path, for example `https://sedzinfo.github.io/rwf/`.
- The home page lists the sites above and adds a card for any other repository published with GitHub Pages.
- `consent.js` is the cookie banner and Google Analytics for every site above: each one loads it from `/consent.js`, so keep it here and edit the banner only in this file.
- `footer.js` is the shared footer (github.com/sedzinfo · Cookie settings · Privacy, and Home at the right). A site loads it before `consent.js` with `<script src="https://sedzinfo.github.io/footer.js" defer></script>`; it fills `<footer id="sedzinfo-footer"></footer>` or adds the footer at the end of the page. Edit the footer only in this file. The Quarto sites keep the same links in the `page-footer` of their `_quarto.yml`.
- `privacy.html` is the privacy note, linked from the banner and from the home page footer. It describes what `consent.js` does, so update the two together.
- `404.html` is the page shown for any missing address on the domain that no site handles. GitHub Pages serves it at any path, so all its links are absolute.
- `robots.txt` lets all crawlers in and lists the sitemaps of the sites above. GitHub Pages serves it only from this repository, so it covers the whole domain: add the sitemap of any new site here.
- `favicon.svg` is the site icon (a bell curve). `favicon.ico` holds the same icon at 16x16 and 32x32 for browsers that ask for `/favicon.ico`, which also gives the icon to the pkgdown and Quarto sites, and `apple-touch-icon.png` (180x180) is the icon for phone home screens.

![Stars](https://img.shields.io/github/stars/sedzinfo/sedzinfo.github.io)
![Watchers](https://img.shields.io/github/watchers/sedzinfo/sedzinfo.github.io)
![Repo Size](https://img.shields.io/github/repo-size/sedzinfo/sedzinfo.github.io)
![Open Issues](https://img.shields.io/github/issues/sedzinfo/sedzinfo.github.io)
![Forks](https://img.shields.io/github/forks/sedzinfo/sedzinfo.github.io)
![Last Commit](https://img.shields.io/github/last-commit/sedzinfo/sedzinfo.github.io)
![Contributors](https://img.shields.io/github/contributors/sedzinfo/sedzinfo.github.io)
![License](https://img.shields.io/github/license/sedzinfo/sedzinfo.github.io)
