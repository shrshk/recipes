# Hosting and where custom recipes live

## Two ways to run

| | Static site (`dist/`) | Server (`pnpm start`) |
|---|---|---|
| Built-in recipes, picks, cook mode | ✅ | ✅ |
| Answers, history, edits (per browser) | ✅ localStorage | ✅ localStorage |
| Save "my recipe", custom recipes from assistants | — | ✅ |
| MCP for LLM clients | — | ✅ `/mcp` |

The app notices which one it is on: with no server, the save button simply doesn't appear.

## Run it as a service on a Mac

```sh
pnpm install && pnpm build
bash scripts/install-mac.sh     # LaunchAgent dev.highchair-chef: starts at login, restarts if it stops
```

To update: `git pull && pnpm install && pnpm build && launchctl kickstart -k gui/$UID/dev.highchair-chef`.

## Server settings

| Variable | Default | |
|---|---|---|
| `RECIPES_HOST` | `127.0.0.1` | Set to `0.0.0.0` or a Tailscale IP to reach it from a phone. |
| `RECIPES_PORT` | `8726` | |
| `RECIPES_DATA_DIR` | `~/.local/share/recipes/custom` | One JSON file per custom recipe. Back this folder up. |
| `RECIPES_MCP_TOKEN` / `RECIPES_MCP_TOKEN_FILE` | `~/.config/recipes/mcp-token` | Bearer token for `/mcp`. |
| `RECIPES_STATIC_DIR` | `dist` | The built app. |

## Custom recipe storage

Custom recipes are plain files in the same format as `kb/recipes`. No database to run, backups
are a folder copy, and a recipe the family loves can join the built-in set by moving the file
into `kb/recipes/` (it then goes through the same tests).

## Security model: no accounts, on purpose

There is no login. The trust boundary is the network:

- The **app and its `/api`** trust whoever can reach them: localhost, your home LAN, or your
  Tailscale tailnet. Writes from a browser must come from the app itself (the server refuses a
  cross-site `Origin`), so another website can't write to it through your browser.
- **`/mcp` always needs the bearer token**, because assistants and scripts are not people on
  your network.

This fits one household. **Do not put the server on the public internet as it is.** If you want
it reachable from anywhere, put an access layer in front instead of building login:

- **Tailscale** (simplest): keep `RECIPES_HOST` on the tailnet; only your devices can reach it.
- **Cloudflare Tunnel + Cloudflare Access**: a login page (email code or Google) at Cloudflare's
  edge, free for small teams, no code here. Give machine clients an Access service token.

Real accounts (each family with its own private recipes) become worth building only when the app
is offered to other families. That would mean per-user storage and a login provider; the file
store and MCP tools are shaped so a user id can be added in front of them later.
