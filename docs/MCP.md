# Connecting an LLM client (MCP)

The server exposes the recipes over [MCP](https://modelcontextprotocol.io), so an assistant
(OpenClaw, Claude Desktop, Claude Code, any MCP client) can find, adapt and save recipes. Saved
recipes show up in the app right away, with a "Your recipe" badge.

## Tools

| Tool | What it does |
|---|---|
| `find_recipes` | Search and rank. Filters: `query`, `cuisines`, `meal`, `maxMinutes`, `avoid` (allergens, hard filter), `ageMonths`, `picky`. |
| `get_recipe` | Full recipe JSON. |
| `prepare_recipe` | The recipe with `remove`, `swaps`, `extras`, `portions` applied, as the parent will cook it. |
| `get_recipe_format` | The recipe format and rules. Clients should read it before saving. |
| `save_custom_recipe` | Validate and save. Invalid recipes come back with a list of problems to fix. |
| `list_custom_recipes`, `delete_custom_recipe` | Manage saved recipes. Built-in recipes cannot be changed or deleted. |

Try: *"Make a dairy-free version of the butternut mac and cheese for 6 portions and save it as
Maya's mac."* The client reads the original, rewrites it, and calls `save_custom_recipe`.

## Over HTTP (OpenClaw, remote clients)

`pnpm build && pnpm start` serves `/mcp` (Streamable HTTP, stateless) on `127.0.0.1:8725`. Every
call needs `Authorization: Bearer <token>`. The token is created on first start in
`~/.config/recipes/mcp-token` (mode 600), or set `RECIPES_MCP_TOKEN`.

OpenClaw `config.json`:

```json
"mcp": {
  "servers": {
    "highchair-chef": {
      "url": "http://127.0.0.1:8725/mcp",
      "transport": "streamable-http",
      "headers": { "Authorization": "Bearer ${RECIPES_MCP_TOKEN}" }
    }
  }
}
```

Put the token in OpenClaw's environment from the file (never paste it into the config), then
`openclaw mcp reload`.

## Over stdio (Claude Desktop and other launch-a-process clients)

```json
{
  "mcpServers": {
    "highchair-chef": {
      "command": "node",
      "args": ["/path/to/recipes/dist-server/main.js", "--stdio"],
      "env": { "RECIPES_DATA_DIR": "/path/to/custom-recipes" }
    }
  }
}
```

No token on stdio: the client starts the process itself. Point `RECIPES_DATA_DIR` at the same
folder as the HTTP server if both run, so they share custom recipes.
