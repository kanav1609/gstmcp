import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser, getUserByEmail, getUserById,
  createApiKey, getApiKey, saveAuthCode, consumeAuthCode
} from './db.js';

const router = Router();

// GET /oauth/register - signup form
router.get('/register', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign Up - GSTMCP</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #1a1d27; border: 1px solid #2d3148; border-radius: 12px; padding: 40px; width: 100%; max-width: 420px; }
    .logo { font-size: 22px; font-weight: 700; color: #1D9E75; margin-bottom: 8px; }
    h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
    p { color: #94a3b8; margin-bottom: 28px; font-size: 14px; }
    label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: #cbd5e1; }
    input { width: 100%; padding: 10px 14px; background: #0f1117; border: 1px solid #2d3148; border-radius: 8px; color: #e2e8f0; font-size: 14px; margin-bottom: 16px; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: #1D9E75; }
    button { width: 100%; padding: 12px; background: #1D9E75; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #16856a; }
    .login-link { text-align: center; margin-top: 16px; font-size: 13px; color: #94a3b8; }
    .login-link a { color: #1D9E75; text-decoration: none; }
    .error { background: #2d1a1a; border: 1px solid #5c2a2a; color: #f87171; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">GSTMCP</div>
    <h1>Create account</h1>
    <p>Get your API key and start querying Indian compliance data.</p>
    ${req.query.error ? `<div class="error">${req.query.error}</div>` : ''}
    <form method="POST" action="/oauth/register">
      <input type="hidden" name="redirect_uri" value="${req.query.redirect_uri || ''}">
      <input type="hidden" name="client_id" value="${req.query.client_id || ''}">
      <input type="hidden" name="state" value="${req.query.state || ''}">
      <label>Full Name</label>
      <input type="text" name="name" placeholder="Rahul Sharma" required autocomplete="name">
      <label>Email</label>
      <input type="email" name="email" placeholder="rahul@example.com" required autocomplete="email">
      <button type="submit">Create Account and Get API Key</button>
    </form>
    <div class="login-link">Already have an account? <a href="/oauth/authorize${req.query.redirect_uri ? '?redirect_uri=' + encodeURIComponent(req.query.redirect_uri) : ''}">Sign in</a></div>
  </div>
</body>
</html>`);
});

// POST /oauth/register - handle signup
// Dynamic Client Registration (DCR) for MCP clients like Claude
router.post('/register', (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('application/json')) return next();
  const { client_name, redirect_uris, grant_types, response_types, token_endpoint_auth_method } = req.body;
  const clientId = uuidv4();
  const clientSecret = uuidv4();
  return res.status(201).json({
    client_id: clientId,
    client_secret: clientSecret,
    client_name: client_name || 'MCP Client',
    redirect_uris: redirect_uris || [],
    grant_types: grant_types || ['authorization_code'],
    response_types: response_types || ['code'],
    token_endpoint_auth_method: token_endpoint_auth_method || 'client_secret_post'
  });
});

router.post('/register', (req, res) => {
  const { email, name, redirect_uri, client_id, state } = req.body;
  if (!email || !name) {
    const q = new URLSearchParams({ error: 'Name and email are required', redirect_uri: redirect_uri || '', client_id: client_id || '', state: state || '' });
    return res.redirect('/oauth/register?' + q.toString());
  }

  let user = getUserByEmail(email);
  if (!user) {
    const id = uuidv4();
    createUser(id, email, name);
    user = getUserById(id);
  }

  if (redirect_uri) {
    const code = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    saveAuthCode(code, user.id, expiresAt);
    const redirect = new URL(redirect_uri);
    redirect.searchParams.set('code', code);
    if (state) redirect.searchParams.set('state', state);
    return res.redirect(redirect.toString());
  }

  // Direct signup: show API key
  let key = uuidv4();
  createApiKey(key, user.id);
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your API Key - GSTMCP</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #1a1d27; border: 1px solid #2d3148; border-radius: 12px; padding: 40px; width: 100%; max-width: 500px; }
    .logo { font-size: 22px; font-weight: 700; color: #1D9E75; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
    p { color: #94a3b8; margin-bottom: 24px; font-size: 14px; }
    .key-box { background: #0f1117; border: 1px solid #1D9E75; border-radius: 8px; padding: 14px 16px; font-family: monospace; font-size: 13px; word-break: break-all; margin-bottom: 16px; color: #1D9E75; }
    .copy-btn { width: 100%; padding: 10px; background: #1D9E75; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 24px; }
    .instructions { background: #0f1117; border-radius: 8px; padding: 16px; font-size: 13px; color: #94a3b8; }
    .instructions h3 { color: #e2e8f0; margin-bottom: 8px; }
    .instructions code { color: #1D9E75; font-family: monospace; }
    .warning { color: #f59e0b; font-size: 12px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">GSTMCP</div>
    <h1>Welcome, ${name}!</h1>
    <p>Your account is ready. Here is your API key:</p>
    <div class="key-box" id="apikey">${key}</div>
    <button class="copy-btn" onclick="navigator.clipboard.writeText('${key}');this.textContent='Copied!'">Copy API Key</button>
    <p class="warning">Save this key securely. You won't see it again.</p>
    <div class="instructions">
      <h3>Quick Setup</h3>
      <p>Add to Claude Desktop config:</p>
      <br>
      <code>"gstmcp": {<br>&nbsp;&nbsp;"url": "${process.env.BASE_URL || 'http://localhost:3456'}/mcp",<br>&nbsp;&nbsp;"headers": { "Authorization": "Bearer ${key}" }<br>}</code>
    </div>
  </div>
</body>
</html>`);
});

// GET /oauth/authorize - login/authorize form
router.get('/authorize', (req, res) => {
  const { redirect_uri, client_id, state, response_type } = req.query;
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize - GSTMCP</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #1a1d27; border: 1px solid #2d3148; border-radius: 12px; padding: 40px; width: 100%; max-width: 420px; }
    .logo { font-size: 22px; font-weight: 700; color: #1D9E75; margin-bottom: 8px; }
    h1 { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
    p { color: #94a3b8; margin-bottom: 28px; font-size: 14px; }
    label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: #cbd5e1; }
    input { width: 100%; padding: 10px 14px; background: #0f1117; border: 1px solid #2d3148; border-radius: 8px; color: #e2e8f0; font-size: 14px; margin-bottom: 16px; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: #1D9E75; }
    button { width: 100%; padding: 12px; background: #1D9E75; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
    button:hover { background: #16856a; }
    .signup-link { text-align: center; margin-top: 16px; font-size: 13px; color: #94a3b8; }
    .signup-link a { color: #1D9E75; text-decoration: none; }
    .error { background: #2d1a1a; border: 1px solid #5c2a2a; color: #f87171; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">GSTMCP</div>
    <h1>Sign in</h1>
    <p>Enter your email to get an authorization code.</p>
    ${req.query.error ? `<div class="error">${req.query.error}</div>` : ''}
    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="redirect_uri" value="${redirect_uri || ''}">
      <input type="hidden" name="client_id" value="${client_id || ''}">
      <input type="hidden" name="state" value="${state || ''}">
      <label>Email</label>
      <input type="email" name="email" placeholder="rahul@example.com" required autocomplete="email">
      <button type="submit">Continue</button>
    </form>
    <div class="signup-link">New here? <a href="/oauth/register?redirect_uri=${encodeURIComponent(redirect_uri || '')}&client_id=${encodeURIComponent(client_id || '')}&state=${encodeURIComponent(state || '')}">Create account</a></div>
  </div>
</body>
</html>`);
});

// POST /oauth/authorize - handle login
router.post('/authorize', (req, res) => {
  const { email, redirect_uri, client_id, state } = req.body;
  if (!email) {
    const q = new URLSearchParams({ error: 'Email is required', redirect_uri: redirect_uri || '', client_id: client_id || '', state: state || '' });
    return res.redirect('/oauth/authorize?' + q.toString());
  }

  const user = getUserByEmail(email);
  if (!user) {
    const q = new URLSearchParams({ error: 'No account found. Please sign up.', redirect_uri: redirect_uri || '', client_id: client_id || '', state: state || '' });
    return res.redirect('/oauth/authorize?' + q.toString());
  }

  if (redirect_uri) {
    const code = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    saveAuthCode(code, user.id, expiresAt);
    const redirect = new URL(redirect_uri);
    redirect.searchParams.set('code', code);
    if (state) redirect.searchParams.set('state', state);
    return res.redirect(redirect.toString());
  }

  res.json({ error: 'redirect_uri required' });
});

// POST /oauth/token - exchange auth code for token (API key)
router.post('/token', (req, res) => {
  const { code, grant_type } = req.body;

  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }
  if (!code) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'code is required' });
  }

  const authCode = consumeAuthCode(code);
  if (!authCode) {
    return res.status(400).json({ error: 'invalid_grant', error_description: 'Code is invalid or expired' });
  }

  const user = getUserById(authCode.user_id);
  if (!user) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  const accessToken = uuidv4();
  createApiKey(accessToken, user.id);

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    scope: 'mcp',
    user_id: user.id,
    email: user.email
  });
});

// Middleware: validate Bearer token
export function requireApiKey(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Missing or invalid Authorization header' },
      id: null
    });
  }
  const key = auth.slice(7).trim();
  const keyRecord = getApiKey(key);
  if (!keyRecord) {
    return res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Invalid or inactive API key' },
      id: null
    });
  }
  req.apiKey = key;
  req.userPlan = keyRecord.plan;
  req.userId = keyRecord.user_id;
  next();
}

// GET /oauth/protected-resource - OAuth 2.0 protected resource metadata
router.get('/protected-resource', (req, res) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3456}`;
  res.json({
    resource: `${baseUrl}/mcp`,
    authorization_servers: [`${baseUrl}`]
  });
});

export default router;
