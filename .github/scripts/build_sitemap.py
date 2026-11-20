"""Rebuild sitemap.xml, the index of the sitemaps of every GitHub Pages site under https://<owner>.github.io/.

Run by .github/workflows/sitemap.yml every day and on demand. It
- lists the owner's public repositories that publish a GitHub Pages site (GitHub API),
- finds the sitemaps of each site: <site>/sitemap.xml, or, for a site without one (vignettes holds
  several Quarto sites behind a hub page), the sitemap.xml of each folder its landing page links to,
- keeps the sitemaps that load and list pages (<urlset>),
- writes sitemap.xml, the index of those sitemaps, and sitemap-home.xml: the home page, plus the
  landing page of every site with no sitemap at its root, since no other sitemap lists those pages.
A file is rewritten only when its content changes. If a site cannot be reached (an error other than
404), nothing is written, so a short outage does not drop a site from the index.

Run locally from the repository root:  python .github/scripts/build_sitemap.py
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urljoin
from xml.sax.saxutils import escape

OWNER = os.environ.get("GITHUB_REPOSITORY_OWNER", "sedzinfo")
BASE = f"https://{OWNER.lower()}.github.io/"
NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
HEADER = "<!-- Written by .github/scripts/build_sitemap.py (workflow: .github/workflows/sitemap.yml). Do not edit by hand. -->\n"


def fetch(url, api=False):
    """Return the body of url, or None on 404. A server error (5xx) or a failed connection is tried again
    after 20 s and after 60 s more: GitHub Pages answers 503 at times, for a few seconds. Any other
    failure, or the third, stops the script."""
    headers = {"User-Agent": f"{OWNER}-sitemap-bot"}
    if api:
        headers["Accept"] = "application/vnd.github+json"
        if os.environ.get("GITHUB_TOKEN"):
            headers["Authorization"] = f"Bearer {os.environ['GITHUB_TOKEN']}"
    for wait in (20, 60, None):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
            if error.code < 500 or wait is None:
                sys.exit(f"::error::{url} answered {error.code}; sitemap.xml was not changed")
            problem = f"answered {error.code}"
        except (urllib.error.URLError, TimeoutError) as error:
            if wait is None:
                sys.exit(f"::error::{url} could not be reached ({error}); sitemap.xml was not changed")
            problem = f"could not be reached ({error})"
        print(f"::warning::{url} {problem}; trying again in {wait} s")
        time.sleep(wait)


def lists_pages(url):
    """True when url is a sitemap that lists pages (<urlset>), not a missing file or a sitemap index."""
    body = fetch(url)
    if body is None:
        return False
    try:
        return ET.fromstring(body).tag == NS + "urlset"
    except ET.ParseError:
        print(f"::warning::{url} is not valid XML; left out")
        return False


def pages_repos():
    """Names of the owner's public repositories that publish a GitHub Pages site, except the user site."""
    names, page = [], 1
    while True:
        repos = json.loads(fetch(f"https://api.github.com/users/{OWNER}/repos?type=owner&per_page=100&page={page}", api=True))
        if not repos:
            return sorted(names, key=str.lower)
        names += [r["name"] for r in repos if r.get("has_pages") and r["name"].lower() != f"{OWNER.lower()}.github.io"]
        page += 1


def linked_folders(site):
    """Folders of site that its landing page links to, such as <site>/example/."""
    html = fetch(site)
    if html is None:
        return None
    folders = set()
    for href in re.findall(r'href="([^"#?]+)', html.decode("utf-8", "replace")):
        url = urljoin(site, href)
        rest = url[len(site):] if url.startswith(site) else ""
        if "/" in rest:
            folders.add(site + rest.split("/")[0] + "/")
    return sorted(folders)


def write(path, text):
    if Path(path).exists() and Path(path).read_text(encoding="utf-8") == text:
        print(f"{path}: unchanged")
        return
    Path(path).write_text(text, encoding="utf-8", newline="\n")
    print(f"{path}: written")


sitemaps, home = [], [BASE]
for repo in pages_repos():
    site = f"{BASE}{repo}/"
    if lists_pages(site + "sitemap.xml"):
        sitemaps.append(site + "sitemap.xml")
        continue
    folders = linked_folders(site)
    if folders is None:
        print(f"::warning::{site} answered 404; left out")
        continue
    home.append(site)
    found = [f + "sitemap.xml" for f in folders if lists_pages(f + "sitemap.xml")]
    sitemaps += found
    if not found:
        print(f"::warning::{site} has no sitemap; only its landing page is listed, in sitemap-home.xml")

write("sitemap-home.xml",
      '<?xml version="1.0" encoding="UTF-8"?>\n' + HEADER
      + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + "".join(f"  <url><loc>{escape(u)}</loc></url>\n" for u in home)
      + "</urlset>\n")
write("sitemap.xml",
      '<?xml version="1.0" encoding="UTF-8"?>\n' + HEADER
      + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + "".join(f"  <sitemap><loc>{escape(u)}</loc></sitemap>\n" for u in [BASE + "sitemap-home.xml"] + sitemaps)
      + "</sitemapindex>\n")
print(f"{len(sitemaps)} site sitemaps; home pages: {', '.join(home)}")
