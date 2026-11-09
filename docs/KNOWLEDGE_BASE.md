# Growing the knowledge base

Recipes live in `kb/recipes/*.json`, one file each. The format is in
[RECIPE_SCHEMA.md](RECIPE_SCHEMA.md). The app picks up new files at build time.

## Where the first 46 came from

Three research passes, split by cuisine, searched Reddit, YouTube, TikTok, Instagram and
toddler-food blogs. Search engines surfaced mostly blogs (Yummy Toddler Food, Kids Eat in Color,
MJ and Hungryman, Baby Foode, NHS Start for Life and others), so most `sources` are blogs. A
few recipes are common family dishes with no single source (`platform: "family"`).
`popularity` is an estimate from how often a dish came up, not measured engagement.

## Pulling from Reddit and YouTube with real numbers

```sh
REDDIT_CLIENT_ID=... REDDIT_CLIENT_SECRET=... YOUTUBE_API_KEY=... pnpm harvest "toddler dinner"
```

This writes ranked candidates (title, link, upvotes or views, a short excerpt) to
`kb/candidates/`, which git ignores. Read the top ones and write recipes from them.

- Reddit: create a "script" app at https://www.reddit.com/prefs/apps.
- YouTube: enable "YouTube Data API v3" in Google Cloud and make an API key.
- TikTok and Instagram have no public search API. Paste post links into `sources` by hand.

## Reading the real recipe from a blog

```sh
pnpm scrape https://some-blog.com/toddler-muffins/   # one or more URLs
pnpm scrape --kb                                     # every source URL already in kb/recipes
pnpm scrape --candidates kb/candidates/<file>.json   # links found by `pnpm harvest`
```

This uses [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) (MIT) to read the
structured recipe data most blogs publish for search engines: the real ingredient list,
quantities, steps, yield, time and ratings. Results go to `kb/candidates/scraped/`, with a
`_report.json` of the pages that failed. It needs [uv](https://docs.astral.sh/uv/), which
installs the library on first run; no other Python setup.

Expect about half of pages to fail: some sites block scripts (HTTP 403), and article pages have
no recipe card. Reddit, YouTube, TikTok and Instagram are skipped; they have no recipe data.

## Writing a recipe from a candidate

1. Write ingredients and steps in your own words. Never paste a creator's instructions.
2. Credit the post in `sources` with its real URL. Take quantities from the scraped copy when
   there is one, scaled to the recipe's `yield`.
3. Set `popularity` from the engagement: roughly 0.9 for a top post of the year, 0.5 for average.
4. Run `pnpm test`. It checks the schema, every `{token}`, and that steps get a scene.
5. Run `pnpm render-check` to read the steps with optional ingredients removed.

Claude Code can do steps 1-5 for you: point it at a candidates file and this doc.
