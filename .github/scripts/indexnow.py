"""Tell the search engines that take IndexNow pings which pages under https://<owner>.github.io/ changed.

IndexNow reaches Bing (whose index also feeds DuckDuckGo, Copilot and ChatGPT search), Yandex, Seznam,
Naver and Yep, without an account at any of them. Run by .github/workflows/sitemap.yml after
build_sitemap.py. It
- reads every page listed in the sitemaps that sitemap.xml indexes (404 pages left out),
- fingerprints what a search engine indexes on each page: the text, the title, the description,
  robots and canonical tags, and any JSON-LD. Scripts, styles and asset links do not count, so a
  rebuild that changes only those sends nothing,
- compares the fingerprints with .github/indexnow.json, which the last successful run wrote,
- sends the pages that are new, changed or gone to https://api.indexnow.org/indexnow,
- and writes .github/indexnow.json once IndexNow accepts them. The workflow commits it.
The first run sends every page. Each page is requested with the ETag from the last run, so a site
that has not been redeployed answers 304 and is not downloaded again. A page that cannot be read
keeps its old fingerprint and is tried again on the next run.

IndexNow checks that the site is ours by loading the key file: <key>.txt at the root of this
repository, whose name and content are both the key. To change the key, replace that file.

Run locally from the repository root. This reads the pages but sends and writes nothing:
    python .github/scripts/indexnow.py --dry-run
"""
import gzip
import hashlib
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlsplit

OWNER = os.environ.get("GITHUB_REPOSITORY_OWNER", "sedzinfo")
HOST = f"{OWNER.lower()}.github.io"
BASE = f"https://{HOST}/"
ENDPOINT = "https://api.indexnow.org/indexnow"   # shared by the IndexNow engines: one ping reaches them all
STATE = Path(".github/indexnow.json")            # outside the published site: Jekyll skips dot folders
USER_AGENT = f"{OWNER}-sitemap-bot"
BATCH = 10_000                                   # the most URLs IndexNow takes in one request
DRY_RUN = "--dry-run" in sys.argv

LOC = re.compile(r"<loc>\s*([^<\s]+)\s*</loc>")
KEEP = re.compile(r'<meta\b[^>]*\bname="(?:description|robots)"[^>]*>'
                  r'|<link\b[^>]*\brel="canonical"[^>]*>'
                  r'|<script\b[^>]*application/ld\+json[^>]*>.*?</script>', re.I | re.S)
DROP = re.compile(r"<(script|style|noscript)\b.*?</\1\s*>|<!--.*?-->", re.I | re.S)
TAG = re.compile(r"<[^>]+>")


def read(url, etag=None):
    """("ok", etag, text), ("same", etag, None) on 304, ("gone", None, None) on 404 or 410,
    or ("error", None, reason)."""
    headers = {"User-Agent": USER_AGENT, "Accept-Encoding": "gzip"}
    if etag:
        headers["If-None-Match"] = etag
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as response:
            body = response.read()
            if response.headers.get("Content-Encoding") == "gzip":
                body = gzip.decompress(body)
            return "ok", response.headers.get("ETag"), body.decode("utf-8", "replace")
    except urllib.error.HTTPError as error:
        if error.code == 304:
            return "same", etag, None
        if error.code in (404, 410):
            return "gone", None, None
        return "error", None, f"answered {error.code}"
    except Exception as error:   # timeouts, dropped connections, broken gzip: try again next run
        return "error", None, str(error) or type(error).__name__


def fingerprint(page):
    """Hash of what a search engine indexes on a page."""
    kept = KEEP.findall(page)
    text = " ".join(html.unescape(TAG.sub(" ", DROP.sub(" ", page))).split())
    return hashlib.sha256("\n".join(kept + [text]).encode("utf-8")).hexdigest()[:16]


def sitemap_pages():
    """The pages listed in the sitemaps that sitemap.xml indexes, or None if a sitemap cannot be read."""
    pages = []
    for sitemap in LOC.findall(Path("sitemap.xml").read_text(encoding="utf-8")):
        local = Path(sitemap[len(BASE):]) if sitemap.startswith(BASE) else None
        if local and local.parent == Path(".") and local.is_file():
            body = local.read_text(encoding="utf-8")   # sitemap-home.xml: this checkout may be newer than the live site
        else:
            status, _, body = read(sitemap)
            if status != "ok":
                print(f"::warning::{sitemap} could not be read ({body or status}); nothing was sent")
                return None
        pages += LOC.findall(body)
    return [url for url in dict.fromkeys(pages)
            if urlsplit(url).hostname == HOST and not url.endswith("/404.html")]


def find_key():
    """The IndexNow key: the name, and the content, of the one <key>.txt at the repository root."""
    keys = [path.stem for path in Path(".").glob("*.txt")
            if re.fullmatch(r"[A-Za-z0-9-]{8,128}", path.stem)
            and path.read_text(encoding="utf-8").strip() == path.stem]
    if len(keys) != 1:
        sys.exit(f"::error::expected one IndexNow key file (<key>.txt holding the key) at the repository root, found {len(keys)}")
    return keys[0]


def key_is_live(key, tries):
    """True once the site serves the key file. Right after the push that adds it, GitHub Pages needs a
    minute or two, so this tries every 30 seconds. The query string skips a 404 the CDN may have cached."""
    for attempt in range(tries):
        status, _, body = read(f"{BASE}{key}.txt?check={int(time.time())}")
        if status == "ok" and body.strip() == key:
            return True
        if attempt + 1 < tries:
            time.sleep(30)
    return False


def ping(key, urls):
    """Send urls to IndexNow. True when every request is accepted (200, or 202 while the key is checked)."""
    for start in range(0, len(urls), BATCH):
        batch = urls[start:start + BATCH]
        payload = json.dumps({"host": HOST, "key": key, "keyLocation": f"{BASE}{key}.txt", "urlList": batch})
        request = urllib.request.Request(ENDPOINT, data=payload.encode("utf-8"), headers={
            "User-Agent": USER_AGENT, "Content-Type": "application/json; charset=utf-8"})
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                print(f"IndexNow answered {response.status} for {len(batch)} pages")
        except urllib.error.HTTPError as error:
            print(f"::error::IndexNow answered {error.code}: {error.read().decode('utf-8', 'replace')[:300]}")
            return False
        except Exception as error:
            print(f"::error::IndexNow could not be reached ({error})")
            return False
    return True


def write_state(state):
    """One line per page, so the commits show which pages changed."""
    lines = [f"{json.dumps(url)}: {json.dumps(value)}" for url, value in sorted(state.items())]
    STATE.write_text("{\n" + ",\n".join(lines) + "\n}\n", encoding="utf-8", newline="\n")
    print(f"{STATE}: written")


old = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}   # url: [etag, fingerprint]
pages = sitemap_pages()
if pages is None:
    sys.exit(0)

with ThreadPoolExecutor(max_workers=8) as pool:
    results = dict(zip(pages, pool.map(lambda url: read(url, (old.get(url) or [None])[0]), pages)))

new, send, failed = {}, [], []
for url, (status, etag, body) in results.items():
    before = old.get(url)
    if status == "ok":
        new[url] = [etag, fingerprint(body)]
        if not before or before[1] != new[url][1]:
            send.append(url)
    elif status == "same":
        new[url] = before
    elif status == "gone":
        if before:
            send.append(url)          # a deleted page: the engines recrawl it, find the 404 and drop it
    else:
        failed.append(f"{url} ({body})")
        if before:
            new[url] = before
send += [url for url in old if url not in results]   # dropped from every sitemap
send.sort()

counts = {s: sum(r[0] == s for r in results.values()) for s in ("ok", "same", "gone", "error")}
print(f"{len(pages)} pages: {counts['ok']} downloaded, {counts['same']} not redeployed (304), "
      f"{counts['gone']} gone, {counts['error']} unreadable; {len(send)} to send")
for line in failed[:10]:
    print(f"::warning::{line} could not be read; it is tried again next run")

if DRY_RUN:
    print("Dry run: nothing sent or written. Would send:", *(f"  {url}" for url in send[:20]), sep="\n")
    if len(send) > 20:
        print(f"  ... and {len(send) - 20} more")
    sys.exit(0)
if send:
    key = find_key()
    if not key_is_live(key, tries=10):
        sys.exit(f"::error::{BASE}{key}.txt is not live, so IndexNow could not check the key; nothing was sent")
    if not ping(key, send):
        sys.exit(1)                   # .github/indexnow.json is not written, so these pages are sent next run
if new != old:
    write_state(new)                  # also when only ETags changed, so tomorrow's requests get 304
else:
    print(f"{STATE}: unchanged")
