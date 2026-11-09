import { randomBytes, timingSafeEqual } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

/**
 * The MCP bearer token: RECIPES_MCP_TOKEN, else a file made on first start (mode 600), like
 * other home MCP servers do. Clients read the file; it is never printed.
 */
export function loadToken(): { token: string; file?: string } {
  if (process.env.RECIPES_MCP_TOKEN) return { token: process.env.RECIPES_MCP_TOKEN };
  const file = process.env.RECIPES_MCP_TOKEN_FILE ?? join(homedir(), ".config", "recipes", "mcp-token");
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, randomBytes(32).toString("base64url") + "\n", { mode: 0o600 });
  }
  chmodSync(file, 0o600);
  return { token: readFileSync(file, "utf8").trim(), file };
}

export function bearerMatches(header: string | undefined, token: string): boolean {
  const given = Buffer.from(header?.replace(/^Bearer\s+/i, "") ?? "");
  const want = Buffer.from(token);
  return given.length === want.length && timingSafeEqual(given, want);
}
