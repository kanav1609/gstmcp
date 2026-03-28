import { lookupHsn, searchHsn } from '../db.js';

export const definition = {
  name: 'hsn_lookup',
  description: 'Look up HSN (Harmonized System of Nomenclature) or SAC (Services Accounting Code) details including description, GST rate, and category. Search by code or keyword.',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'HSN/SAC code to look up (e.g., 1001 for wheat, 9983 for IT services)'
      },
      query: {
        type: 'string',
        description: 'Keyword to search HSN descriptions (e.g., "rice", "software", "textile")'
      }
    }
  }
};

export async function handler({ code, query }) {
  if (!code && !query) {
    return { error: 'Either code or query is required' };
  }

  if (code) {
    const cleaned = String(code).trim();
    const result = lookupHsn(cleaned);
    if (!result) {
      return { error: `HSN code ${cleaned} not found. Try searching by keyword with the query parameter.` };
    }
    return {
      hsnCode: result.code,
      description: result.description,
      gstRate: result.gst_rate,
      category: result.category || ''
    };
  }

  // Search by keyword
  const results = searchHsn(query.trim());
  if (!results || results.length === 0) {
    return { results: [], total: 0, query };
  }

  return {
    results: results.map(r => ({
      hsnCode: r.code,
      description: r.description,
      gstRate: r.gst_rate,
      category: r.category || ''
    })),
    total: results.length,
    query
  };
}
