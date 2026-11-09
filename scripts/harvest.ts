// Find popular toddler-recipe posts and videos, ranked by engagement, as raw material for new
// kb/recipes files. It does not write recipes: a person (or Claude) reads the candidates, writes
// the recipe in their own words, and credits the source. See docs/KNOWLEDGE_BASE.md.
//
//   REDDIT_CLIENT_ID=... REDDIT_CLIENT_SECRET=... YOUTUBE_API_KEY=... pnpm harvest "toddler dinner"
//
// Reddit: create a "script" app at https://www.reddit.com/prefs/apps (free).
// YouTube: enable "YouTube Data API v3" in Google Cloud and create an API key (free quota).
// TikTok and Instagram have no public search API; add those links by hand (docs/KNOWLEDGE_BASE.md).

import { mkdirSync, writeFileSync } from "node:fs";

interface Candidate {
  platform: "reddit" | "youtube";
  title: string;
  url: string;
  author: string;
  engagement: number;
  /** Post text or video description, cut short. For reading, not for copying. */
  excerpt: string;
}

const SUBREDDITS = ["toddlerfood", "BabyLedWeaning", "Mommit", "daddit", "EatCheapAndHealthy", "MealPrepSunday"];
const UA = "recipes-kb-harvester/0.1 (open-source toddler recipe app)";

async function reddit(query: string): Promise<Candidate[]> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) {
    console.warn("reddit: skipped (set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET)");
    return [];
  }
  const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
    },
    body: "grant_type=client_credentials",
  });
  if (!tokenRes.ok) throw new Error(`reddit token: HTTP ${tokenRes.status}`);
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const out: Candidate[] = [];
  for (const sub of SUBREDDITS) {
    const url = `https://oauth.reddit.com/r/${sub}/search?q=${encodeURIComponent(query)}&restrict_sr=1&sort=top&t=year&limit=25`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${access_token}`, "User-Agent": UA } });
    if (!res.ok) {
      console.warn(`reddit r/${sub}: HTTP ${res.status}`);
      continue;
    }
    const body = (await res.json()) as {
      data: { children: { data: { title: string; permalink: string; author: string; score: number; num_comments: number; selftext: string } }[] };
    };
    for (const { data: p } of body.data.children)
      out.push({
        platform: "reddit",
        title: p.title,
        url: `https://www.reddit.com${p.permalink}`,
        author: `u/${p.author}`,
        engagement: p.score + 2 * p.num_comments,
        excerpt: p.selftext.slice(0, 400),
      });
  }
  return out;
}

async function youtube(query: string): Promise<Candidate[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.warn("youtube: skipped (set YOUTUBE_API_KEY)");
    return [];
  }
  const search = new URL("https://www.googleapis.com/youtube/v3/search");
  search.search = new URLSearchParams({ part: "snippet", q: query, type: "video", maxResults: "25", order: "viewCount", key }).toString();
  const res = await fetch(search);
  if (!res.ok) throw new Error(`youtube search: HTTP ${res.status}`);
  const found = (await res.json()) as { items: { id: { videoId: string } }[] };
  const ids = found.items.map((i) => i.id.videoId).join(",");
  if (!ids) return [];

  const videos = new URL("https://www.googleapis.com/youtube/v3/videos");
  videos.search = new URLSearchParams({ part: "snippet,statistics", id: ids, key }).toString();
  const vres = await fetch(videos);
  if (!vres.ok) throw new Error(`youtube videos: HTTP ${vres.status}`);
  const body = (await vres.json()) as {
    items: { id: string; snippet: { title: string; channelTitle: string; description: string }; statistics: { viewCount?: string; likeCount?: string } }[];
  };
  return body.items.map((v) => ({
    platform: "youtube" as const,
    title: v.snippet.title,
    url: `https://www.youtube.com/watch?v=${v.id}`,
    author: v.snippet.channelTitle,
    engagement: Number(v.statistics.viewCount ?? 0) / 100 + Number(v.statistics.likeCount ?? 0),
    excerpt: v.snippet.description.slice(0, 400),
  }));
}

const query = process.argv.slice(2).join(" ") || "toddler recipe";
const results = (await Promise.all([reddit(query), youtube(query)])).flat().sort((a, b) => b.engagement - a.engagement);
mkdirSync("kb/candidates", { recursive: true });
const file = `kb/candidates/${new Date().toISOString().slice(0, 10)}-${query.replace(/\W+/g, "-").toLowerCase()}.json`;
writeFileSync(file, JSON.stringify({ query, results }, null, 2));
console.log(`${results.length} candidates -> ${file}`);
for (const r of results.slice(0, 15)) console.log(`${String(Math.round(r.engagement)).padStart(7)}  ${r.platform.padEnd(8)} ${r.title}`);
