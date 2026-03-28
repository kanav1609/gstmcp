# Progress

## Done

- [x] package.json (ES modules, all deps)
- [x] .env.example + .env
- [x] src/db.js (SQLite schema: users, api_keys, usage_logs, rate_limits, auth_codes, hsn_codes, pincodes)
- [x] src/auth.js (OAuth 2.0 flow: /register, /authorize, /token; requireApiKey middleware)
- [x] src/rate-limiter.js (free: 10/day, pro: 1000/mo, business: 5000/mo)
- [x] src/tools/gst-verify.js
- [x] src/tools/pan-verify.js
- [x] src/tools/gst-calculator.js
- [x] src/tools/gstin-status.js
- [x] src/tools/company-search.js
- [x] src/tools/pincode-lookup.js
- [x] src/tools/hsn-lookup.js
- [x] src/tools/gst-return-status.js
- [x] src/tools/index.js (tool registry)
- [x] src/mcp-handler.js (JSON-RPC 2.0: initialize, tools/list, tools/call, ping)
- [x] src/index.js (Express server, all routes wired)
- [x] src/utils/seed-data.js (120+ HSN codes, 250+ PIN codes for major cities)
- [x] public/index.html (landing page, dark theme)
- [x] README.md
- [x] claude.md / progress.md / to-do.md / roadmap.md
