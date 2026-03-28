import 'node:process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter, { requireApiKey } from './auth.js';
import { handleMcpRequest } from './mcp-handler.js';
import { getDb } from './db.js';
import { getToolDefinitions } from './tools/index.js';

// Load .env manually (no dotenv dependency)
try {
  const envFile = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // .env not present, rely on environment variables
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize DB on startup
getDb();

const app = express();
const PORT = process.env.PORT || 3456;
const HOST = process.env.HOST || '0.0.0.0';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Security
app.use(helmet({
  contentSecurityPolicy: false // Allow inline styles on HTML pages
}));

// CORS: allow all origins for MCP endpoint (AI tools need this)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(join(__dirname, '..', 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    tools: getToolDefinitions().length,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// OAuth discovery endpoints (RFC 8414)
app.get('/.well-known/oauth-authorization-server', (req, res) => {
  res.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/oauth/authorize`,
    token_endpoint: `${BASE_URL}/oauth/token`,
    registration_endpoint: `${BASE_URL}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['none']
  });
});

app.get('/.well-known/oauth-protected-resource', (req, res) => {
  res.json({
    resource: `${BASE_URL}/mcp`,
    authorization_servers: [BASE_URL]
  });
});

// OAuth routes
app.use('/oauth', authRouter);

// MCP endpoint (requires API key)
app.post('/mcp', requireApiKey, async (req, res) => {
  try {
    const response = await handleMcpRequest(req.body, req.apiKey, req.userPlan);
    if (response === null) {
      // Notification: no response needed
      return res.status(204).send();
    }
    res.json(response);
  } catch (err) {
    console.error('MCP handler error:', err);
    res.status(500).json({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'Internal server error' },
      id: req.body?.id ?? null
    });
  }
});

// MCP GET endpoint: return server metadata for discovery
app.get('/mcp', (req, res) => {
  res.json({
    name: 'GSTMCP',
    description: "India's first hosted compliance MCP server",
    version: '1.0.0',
    tools: getToolDefinitions().length,
    auth: 'Bearer token required',
    signup: `${BASE_URL}/oauth/register`
  });
});

// 404 handler
app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(join(__dirname, '..', 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  console.log(`GSTMCP server running at http://${HOST}:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Sign up: http://localhost:${PORT}/oauth/register`);
});
