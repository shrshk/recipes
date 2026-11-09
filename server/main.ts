// Highchair Chef server: the app, the custom-recipe API and an MCP endpoint, in one process.
//
//   node dist-server/main.js            HTTP on 127.0.0.1:8726 (RECIPES_HOST / RECIPES_PORT)
//   node dist-server/main.js --stdio    MCP over stdio, for desktop clients that launch servers
//
// Trust model (docs/HOSTING.md): no user accounts. The app and its API trust the network they
// are served on (localhost, LAN or Tailscale). /mcp always needs the bearer token. Never expose
// this to the internet without an access layer in front (e.g. Cloudflare Access).

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { knowledgeBase } from "../src/kb";
import { createMcpServer } from "./mcp";
import { CustomStore, defaultDataDir } from "./store";
import { bearerMatches, loadToken } from "./token";

const MAX_BODY = 1_000_000;
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json", ".webmanifest": "application/manifest+json",
};

const kb = knowledgeBase().recipes;
const store = new CustomStore(defaultDataDir(), new Set(kb.map((r) => r.id)));

if (process.argv.includes("--stdio")) {
  createMcpServer(kb, store)
    .connect(new StdioServerTransport())
    .catch((err) => {
      console.error("stdio_failed", err);
      process.exit(1);
    });
} else {
  startHttp();
}

function startHttp() {
  const { token, file } = loadToken();
  const host = process.env.RECIPES_HOST ?? "127.0.0.1";
  const port = Number(process.env.RECIPES_PORT ?? 8726);
  const staticDir = resolve(process.env.RECIPES_STATIC_DIR ?? "dist");

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://local");
      if (url.pathname === "/mcp") return await handleMcp(req, res, token);
      if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
      return serveStatic(res, staticDir, url.pathname);
    } catch (err) {
      console.error("request_failed", req.method, req.url, err);
      if (!res.headersSent) json(res, 500, { error: "server error" });
    }
  });
  server.listen(port, host, () => {
    console.log(`highchair-chef on http://${host}:${port}  (custom recipes: ${store.dir}; mcp token: ${file ?? "RECIPES_MCP_TOKEN"})`);
  });
}

async function handleMcp(req: IncomingMessage, res: ServerResponse, token: string) {
  if (!bearerMatches(req.headers.authorization, token)) return json(res, 401, { error: "missing or wrong bearer token" });
  if (req.method !== "POST") return json(res, 405, { error: "stateless server: POST only" });
  const body = await readJson(req);
  // Stateless: a fresh server and transport per request; nothing to clean up between calls.
  const mcp = createMcpServer(kb, store);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => {
    void transport.close();
    void mcp.close();
  });
  await mcp.connect(transport);
  await transport.handleRequest(req, res, body);
}

async function handleApi(req: IncomingMessage, res: ServerResponse, url: URL) {
  // Writes from a browser must come from this app: a cross-site page can't forge Origin.
  if (req.method !== "GET" && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) {
    return json(res, 403, { error: "cross-origin write refused" });
  }
  if (url.pathname === "/api/health") return json(res, 200, { ok: true, recipes: kb.length });
  if (url.pathname === "/api/custom-recipes" && req.method === "GET") return json(res, 200, store.list());

  const m = url.pathname.match(/^\/api\/custom-recipes\/([a-z0-9-]+)$/);
  if (m && req.method === "PUT") {
    if (!req.headers["content-type"]?.startsWith("application/json")) return json(res, 415, { error: "send JSON" });
    const body = await readJson(req);
    if ((body as { id?: unknown })?.id !== m[1]) return json(res, 400, { error: "id in body must match the URL" });
    const result = store.save(body);
    return result.ok ? json(res, 200, result.recipe) : json(res, 422, { problems: result.problems });
  }
  if (m && req.method === "DELETE") return store.delete(m[1]) ? json(res, 200, { deleted: m[1] }) : json(res, 404, { error: "not found" });
  return json(res, 404, { error: "not found" });
}

function serveStatic(res: ServerResponse, dir: string, pathname: string) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(dir, safe);
  if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) file = join(dir, "index.html");
  if (!existsSync(file)) return json(res, 404, { error: "app not built; run pnpm build" });
  const type = TYPES[extname(file)] ?? "application/octet-stream";
  const cache = file.includes(`${join(dir, "assets")}`) ? "public, max-age=31536000, immutable" : "no-cache";
  res.writeHead(200, { "Content-Type": type, "Cache-Control": cache });
  createReadStream(file).pipe(res);
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new Error("body too large");
    chunks.push(chunk as Buffer);
  }
  if (!chunks.length) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return undefined;
  }
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}
