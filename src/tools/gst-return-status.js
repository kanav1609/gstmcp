import fetch from 'node-fetch';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function getMockReturns(gstin) {
  const now = new Date();
  const months = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`);
  }

  return {
    gstin,
    returns: [
      { type: 'GSTR1', period: months[0], status: 'Filed', dateOfFiling: new Date(now.getFullYear(), now.getMonth(), 11).toISOString().slice(0, 10) },
      { type: 'GSTR3B', period: months[0], status: 'Filed', dateOfFiling: new Date(now.getFullYear(), now.getMonth(), 20).toISOString().slice(0, 10) },
      { type: 'GSTR1', period: months[1], status: 'Filed', dateOfFiling: new Date(now.getFullYear(), now.getMonth() - 1, 11).toISOString().slice(0, 10) },
      { type: 'GSTR3B', period: months[1], status: 'Filed', dateOfFiling: new Date(now.getFullYear(), now.getMonth() - 1, 20).toISOString().slice(0, 10) },
      { type: 'GSTR1', period: months[2], status: 'Filed', dateOfFiling: new Date(now.getFullYear(), now.getMonth() - 2, 11).toISOString().slice(0, 10) },
      { type: 'GSTR3B', period: months[2], status: 'Filed', dateOfFiling: new Date(now.getFullYear(), now.getMonth() - 2, 20).toISOString().slice(0, 10) }
    ],
    _note: 'Mock data. Integrate GST portal API for live return status.'
  };
}

export const definition = {
  name: 'gst_return_status',
  description: 'Check if a GSTIN has filed recent GST returns (GSTR1, GSTR3B) and get the filing dates and status for the past few months.',
  inputSchema: {
    type: 'object',
    properties: {
      gstin: {
        type: 'string',
        description: 'The 15-character GSTIN to check return filing status for'
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

  // Real API integration point: swap getMockReturns with GST portal API call
  return getMockReturns(cleaned);
}
