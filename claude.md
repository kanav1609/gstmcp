# GSTMCP Project Context

## What It Is
India's first hosted compliance MCP server. Node.js + Express + SQLite. Lets AI tools (Claude Desktop, Cursor, ChatGPT) do Indian compliance lookups via a single hosted URL.

## Tech Stack
- Node.js + Express, plain JS, ES modules (type: module)
- better-sqlite3 for all persistence
- No TypeScript, no em dashes, keep it simple

## Key Decisions
- MCP transport: Streamable HTTP (POST /mcp, JSON-RPC 2.0)
- Auth: OAuth 2.0 flow, but the access token IS the API key (UUID, stored in api_keys table)
- Rate limiting: stored in SQLite rate_limits table, checked on every tools/call
- Tools are mock-first with real API hooks: swap one function call to go live
- HSN and pincode data seeded into SQLite at startup via npm run seed

## Plans/gst rate
- Free: 10/day
- Pro: Rs 1500/mo, 1000 calls/month
- Business: Rs 5000/mo, 5000 calls/month

## Deployment Target
- Domain: gstmcp.manufaster.in
- Platform: any VPS running Node.js

## File Map
- src/index.js: Express server, routing
- src/db.js: SQLite schema + all query helpers
- src/auth.js: OAuth routes + requireApiKey middleware
- src/rate-limiter.js: Per-plan rate limit check/increment
- src/mcp-handler.js: JSON-RPC 2.0 MCP protocol handler
- src/tools/: 8 tool files + index.js registry
- src/utils/seed-data.js: Seeds HSN + PIN data
- public/index.html: Landing page (dark theme, #1D9E75 green)
