import { getToolDefinitions, getTool } from './tools/index.js';
import { checkRateLimit } from './rate-limiter.js';
import { logUsage } from './db.js';

const SERVER_INFO = {
  name: 'gstmcp',
  version: '1.0.0'
};

const PROTOCOL_VERSION = '2025-03-26';

function makeError(id, code, message) {
  return { jsonrpc: '2.0', error: { code, message }, id };
}

async function handleInitialize(params, id) {
  return {
    jsonrpc: '2.0',
    result: {
      protocolVersion: PROTOCOL_VERSION,
      serverInfo: SERVER_INFO,
      capabilities: { tools: {} }
    },
    id
  };
}

async function handleToolsList(params, id) {
  return {
    jsonrpc: '2.0',
    result: { tools: getToolDefinitions() },
    id
  };
}

async function handleToolsCall(params, id, apiKey, userPlan) {
  const { name, arguments: args } = params || {};

  if (!name) {
    return makeError(id, -32602, 'Missing tool name');
  }

  const handler = getTool(name);
  if (!handler) {
    return makeError(id, -32601, `Tool not found: ${name}`);
  }

  // Check rate limit
  const rateCheck = checkRateLimit(apiKey, userPlan);
  if (!rateCheck.allowed) {
    return makeError(id, -32029, `Rate limit exceeded. Resets at ${rateCheck.resetAt}. Upgrade to Pro or Business for higher limits.`);
  }

  const start = Date.now();
  let success = true;
  let result;

  try {
    result = await handler(args || {});
  } catch (err) {
    success = false;
    result = { error: 'Internal error executing tool', details: err.message };
  }

  const responseMs = Date.now() - start;
  logUsage(apiKey, name, responseMs, success);

  const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

  return {
    jsonrpc: '2.0',
    result: {
      content: [{ type: 'text', text }]
    },
    id
  };
}

async function handleNotificationsInitialized(params, id) {
  // Notifications don't require a response, but acknowledge
  return null;
}

export async function handleMcpRequest(body, apiKey, userPlan) {
  // Support batched requests
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map(req => handleSingle(req, apiKey, userPlan))
    );
    return responses.filter(r => r !== null);
  }
  return handleSingle(body, apiKey, userPlan);
}

async function handleSingle(req, apiKey, userPlan) {
  const { jsonrpc, method, params, id } = req || {};

  if (jsonrpc !== '2.0') {
    return makeError(id ?? null, -32600, 'Invalid JSON-RPC version');
  }

  if (!method) {
    return makeError(id ?? null, -32600, 'Method is required');
  }

  switch (method) {
    case 'initialize':
      return handleInitialize(params, id);
    case 'notifications/initialized':
      return handleNotificationsInitialized(params, id);
    case 'tools/list':
      return handleToolsList(params, id);
    case 'tools/call':
      return handleToolsCall(params, id, apiKey, userPlan);
    case 'ping':
      return { jsonrpc: '2.0', result: {}, id };
    default:
      return makeError(id ?? null, -32601, `Method not found: ${method}`);
  }
}
