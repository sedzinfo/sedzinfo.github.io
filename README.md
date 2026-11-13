# sedzinfo.github.io

Home page for the sites published from the [sedzinfo](https://github.com/sedzinfo) repositories with GitHub Pages: https://sedzinfo.github.io/

## Files shared by the sites and the Shiny apps

Each file below is kept here only, and loaded by its full address (`https://sedzinfo.github.io/...`),
so a fix reaches every site and app that uses it without deploying them again. Browsers may keep
the old file for up to 10 minutes after a push. Push this repository before an app that starts
using a new file is deployed, or the app asks for a file that is not there yet.

| File | What it does | Used by |
|---|---|---|
| `consent.js` | cookie banner; loads Google Analytics only after the visitor accepts | every site and app with analytics |
| `footer.js` | the footer of the sites | the home page and the vignettes sites |
| `shiny/apps.css` | the stylesheet of the apps: dark mode, plotly's toolbar, the About tab, the footer, tap targets on phones; each app keeps only its own rules | all 7 apps |
| `shiny/analytics.js` | reports the tabs and the downloads of an app to Google Analytics, after consent | golemcat, golemcrypto, golemenviro, golemirt, golemstockindices, golemworldbank |
| `shiny/analytics.css` | the cookie banner and the footer on the Bootstrap 3 apps | golemenviro, golemworldbank |
| `shiny/keep_alive.js` | a ping every 15 seconds, so that proxies keep an idle app connected | golemcat, golemcrypto, golemirt, golemstockindices (run with `keep_alive = TRUE`) |
| `shiny/dark_mode.js` | the moon/sun button and the dark mode of the apps that draw their own | golemenviro, golemeurostat, golemirt, golemworldbank |

The privacy note (`privacy.html`) describes what `consent.js` and `shiny/analytics.js` do: keep it in step.


![Stars](https://img.shields.io/github/stars/sedzinfo/sedzinfo.github.io)
![Watchers](https://img.shields.io/github/watchers/sedzinfo/sedzinfo.github.io)
![Repo Size](https://img.shields.io/github/repo-size/sedzinfo/sedzinfo.github.io)
![Open Issues](https://img.shields.io/github/issues/sedzinfo/sedzinfo.github.io)
![Forks](https://img.shields.io/github/forks/sedzinfo/sedzinfo.github.io)
![Last Commit](https://img.shields.io/github/last-commit/sedzinfo/sedzinfo.github.io)
![Contributors](https://img.shields.io/github/contributors/sedzinfo/sedzinfo.github.io)
![License](https://img.shields.io/github/license/sedzinfo/sedzinfo.github.io)
