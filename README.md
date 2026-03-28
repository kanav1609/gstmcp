# GSTMCP

India's first hosted compliance MCP server. Gives Claude Desktop, Cursor, and any MCP-compatible AI client instant access to GST verification, PAN lookup, HSN codes, PIN codes, company registry, and more.

## Setup

```bash
cd gstmcp
npm install
npm run seed
npm start
```

The server starts on port 3456.

## Endpoints

- `GET /health` - Health check
- `POST /mcp` - MCP JSON-RPC endpoint (requires Bearer token)
- `GET /mcp` - Server info
- `GET /oauth/register` - Signup form
- `GET /oauth/authorize` - Login form
- `POST /oauth/token` - Exchange auth code for token
- `GET /.well-known/oauth-authorization-server` - OAuth metadata

## Claude Desktop Config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gstmcp": {
      "url": "http://localhost:3456/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

Replace `YOUR_API_KEY` with the key you get from `/oauth/register`.

## Cursor Config

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "gstmcp": {
      "url": "http://localhost:3456/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
PORT=3456
BASE_URL=https://yourdomain.com
APPYFLOW_KEY=your_key   # Optional: enables live GST verification
JWT_SECRET=random_string
```

## Tools

| Tool | Input | Description |
|------|-------|-------------|
| `gst_verify` | `{ gstin }` | Full GSTIN verification with business details |
| `pan_verify` | `{ pan }` | PAN validation and holder info |
| `gst_calculator` | `{ amount, gstRate, isInterstate }` | CGST/SGST/IGST breakdown |
| `gstin_status` | `{ gstin }` | Quick active/inactive status check |
| `company_search` | `{ query }` | MCA company lookup by name or CIN |
| `pincode_lookup` | `{ pincode }` | City/district/state for any PIN code |
| `hsn_lookup` | `{ code }` or `{ query }` | HSN/SAC description and GST rate |
| `gst_return_status` | `{ gstin }` | Recent GSTR1/GSTR3B filing status |

## Rate Limits

- Free: 10 calls/day
- Pro: 1,000 calls/month
- Business: 5,000 calls/month

## Testing

```bash
# Health check
curl http://localhost:3456/health

# MCP: initialize
curl -X POST http://localhost:3456/mcp \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26"},"id":1}'

# MCP: list tools
curl -X POST http://localhost:3456/mcp \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'

# MCP: call gst_verify
curl -X POST http://localhost:3456/mcp \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"gst_verify","arguments":{"gstin":"29ABCDE1234F1Z5"}},"id":3}'
```
