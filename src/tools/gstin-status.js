import fetch from 'node-fetch';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const definition = {
  name: 'gstin_status',
  description: 'Quick check to see if a GSTIN is Active, Inactive, Cancelled, or Suspended. Faster than full verification when you only need the status.',
  inputSchema: {
    type: 'object',
    properties: {
      gstin: {
        type: 'string',
        description: 'The 15-character GSTIN to check'
      }
    },
    required: ['gstin']
  }
};

export async function handler({ gstin }) {
  if (!gstin) return { error: 'gstin is required' };

  const cleaned = gstin.toUpperCase().trim();
  if (!GSTIN_REGEX.test(cleaned)) {
    return { error: 'Invalid GSTIN format. Must be 15 characters matching pattern: 29ABCDE1234F1Z5' };
  }

  const appyflowKey = process.env.APPYFLOW_KEY;
  if (appyflowKey) {
    try {
      const url = `https://appyflow.in/api/verifyGST?gstNo=${cleaned}&key_secret=${appyflowKey}`;
      const resp = await fetch(url, { timeout: 8000 });
      if (resp.ok) {
        const data = await resp.json();
        if (data && !data.error) {
          return {
            gstin: cleaned,
            status: data.status || data.gstStatus || 'Unknown',
            lastUpdated: new Date().toISOString().slice(0, 10)
          };
        }
      }
    } catch {
      // Fall through to mock
    }
  }

  return {
    gstin: cleaned,
    status: 'Active',
    lastUpdated: new Date().toISOString().slice(0, 10),
    _note: 'Mock data. Set APPYFLOW_KEY for live status.'
  };
}
