import { lookupPincode } from '../db.js';

export const definition = {
  name: 'pincode_lookup',
  description: 'Look up city, district, state, and region for any Indian PIN code.',
  inputSchema: {
    type: 'object',
    properties: {
      pincode: {
        type: 'string',
        description: 'The 6-digit Indian PIN code (e.g., 560001)'
      }
    },
    required: ['pincode']
  }
};

export async function handler({ pincode }) {
  if (!pincode) return { error: 'pincode is required' };

  const cleaned = String(pincode).trim();
  if (!/^\d{6}$/.test(cleaned)) {
    return { error: 'Invalid PIN code. Must be exactly 6 digits.' };
  }

  const result = lookupPincode(cleaned);
  if (!result) {
    return { error: `PIN code ${cleaned} not found in database. Database contains top 1000 Indian PIN codes.` };
  }

  return {
    pincode: result.pincode,
    city: result.city,
    district: result.district,
    state: result.state,
    region: result.region || ''
  };
}
