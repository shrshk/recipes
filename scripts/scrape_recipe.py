# /// script
# requires-python = ">=3.10"
# dependencies = ["recipe-scrapers>=15.6,<16"]
# ///
"""Pull a recipe's real ingredients and steps from a web page, as raw material for kb/recipes.

Most recipe sites publish structured recipe data for search engines (schema.org). This reads it
with recipe-scrapers (MIT, github.com/hhursev/recipe-scrapers). The output is for reading, not
for shipping: write the kb recipe in your own words and credit the URL. See docs/KNOWLEDGE_BASE.md.

    pnpm scrape https://www.yummytoddlerfood.com/...     # one or more URLs
    pnpm scrape --kb                                     # every source URL in kb/recipes
    pnpm scrape --candidates kb/candidates/<file>.json   # links from `pnpm harvest`
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
import warnings
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from recipe_scrapers import scrape_html
from recipe_scrapers._exceptions import RecipeScrapersExceptions

# recipe-scrapers warns when a site returns a fixed site name; harmless here.
warnings.filterwarnings("ignore", message=".*returns a constant value.*")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "kb" / "candidates" / "scraped"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"
# Social and video pages carry no recipe data; skip them instead of reporting failures.
SKIP_HOSTS = ("reddit.com", "youtube.com", "youtu.be", "tiktok.com", "instagram.com")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en"})
    with urllib.request.urlopen(req, timeout=20) as res:
        return res.read().decode(res.headers.get_content_charset() or "utf-8", errors="replace")


def field(scraper, name: str):
    """Read one field; sites leave many out, and recipe-scrapers raises for a missing one."""
    try:
        return getattr(scraper, name)()
    except (RecipeScrapersExceptions, AttributeError, NotImplementedError, TypeError, ValueError):
        return None


def scrape(url: str) -> dict:
    if any(h in url for h in SKIP_HOSTS):
        return {"url": url, "ok": False, "error": "skipped: social/video page"}
    try:
        html = fetch(url)
    except urllib.error.HTTPError as e:
        return {"url": url, "ok": False, "error": f"HTTP {e.code}"}
    except (urllib.error.URLError, TimeoutError) as e:
        return {"url": url, "ok": False, "error": f"fetch failed: {getattr(e, 'reason', e)}"}
    try:
        s = scrape_html(html, org_url=url, supported_only=False)
    except RecipeScrapersExceptions as e:
        return {"url": url, "ok": False, "error": f"no recipe data: {type(e).__name__}"}
    data = {
        "url": url,
        "ok": True,
        "title": field(s, "title"),
        "author": field(s, "author"),
        "site": field(s, "site_name") or field(s, "host"),
        "yields": field(s, "yields"),
        "total_minutes": field(s, "total_time"),
        "ingredients": field(s, "ingredients") or [],
        "steps": field(s, "instructions_list") or [],
        "cuisine": field(s, "cuisine"),
        "category": field(s, "category"),
        "ratings": field(s, "ratings"),
        "ratings_count": field(s, "ratings_count"),
    }
    if not data["ingredients"] and not data["steps"]:
        data.update(ok=False, error="page has no ingredients or steps")
    return data


def kb_urls() -> dict[str, list[str]]:
    """Source URL -> recipe ids that cite it."""
    urls: dict[str, list[str]] = {}
    for f in sorted((ROOT / "kb" / "recipes").glob("*.json")):
        recipe = json.loads(f.read_text())
        for src in recipe["sources"]:
            if src["url"]:
                urls.setdefault(src["url"], []).append(recipe["id"])
    return urls


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:70]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("urls", nargs="*")
    ap.add_argument("--kb", action="store_true", help="scrape every source URL in kb/recipes")
    ap.add_argument("--candidates", type=Path, help="a kb/candidates/*.json file from `pnpm harvest`")
    args = ap.parse_args()

    cited_by: dict[str, list[str]] = kb_urls() if args.kb else {}
    urls = list(args.urls) + list(cited_by)
    if args.candidates:
        urls += [c["url"] for c in json.loads(args.candidates.read_text())["results"]]
    urls = list(dict.fromkeys(urls))
    if not urls:
        ap.print_help()
        return 2

    OUT.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(8) as pool:
        results = list(pool.map(scrape, urls))

    ok = 0
    for r in results:
        r["cited_by"] = cited_by.get(r["url"], [])
        if r["ok"]:
            ok += 1
            name = slug(r["title"] or r["url"])
            (OUT / f"{name}.json").write_text(json.dumps(r, indent=2, ensure_ascii=False) + "\n")
            print(f"  ok    {len(r['ingredients']):>2} ingredients {len(r['steps']):>2} steps  {name}")
        else:
            print(f"  skip  {r['error']:<34} {r['url']}")
    (OUT / "_report.json").write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n")
    print(f"{ok}/{len(results)} pages had recipe data -> {OUT.relative_to(ROOT)}/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
