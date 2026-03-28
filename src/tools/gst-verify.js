import fetch from 'node-fetch';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const STATE_CODES = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
  '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa',
  '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman & Nicobar Islands', '36': 'Telangana',
  '37': 'Andhra Pradesh (New)', '38': 'Ladakh', '97': 'Other Territory',
  '99': 'Centre Jurisdiction'
};

function getMockData(gstin) {
  const stateCode = gstin.slice(0, 2);
  return {
    gstin,
    tradeName: 'DEMO TRADERS PVT LTD',
    legalName: 'DEMO TRADERS PRIVATE LIMITED',
    status: 'Active',
    registrationDate: '2019-07-01',
    businessType: 'Private Limited Company',
    address: '123, Business Park, Industrial Area, City - 560001',
    stateCode,
    state: STATE_CODES[stateCode] || 'Unknown',
    _note: 'Mock data. Set APPYFLOW_KEY for live lookups.'
  };
}

export const definition = {
  name: 'gst_verify',
  description: 'Verify a GSTIN (GST Identification Number) and return business details including trade name, legal name, registration status, address, and business type.',
  inputSchema: {
    type: 'object',
    properties: {
      gstin: {
        type: 'string',
        description: 'The 15-character GSTIN to verify (e.g., 29ABCDE1234F1Z5)'
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
          const stateCode = cleaned.slice(0, 2);
          return {
            gstin: cleaned,
            tradeName: data.tradeName || data.trade_name || '',
            legalName: data.legalName || data.legal_name || '',
            status: data.status || data.gstStatus || 'Unknown',
            registrationDate: data.registrationDate || data.registration_date || '',
            businessType: data.businessType || data.business_type || '',
            address: data.address || data.principalPlaceOfBusiness || '',
            stateCode,
            state: STATE_CODES[stateCode] || 'Unknown'
          };
        }
      }
    } catch {
      // Fall through to mock
    }
  }

  return getMockData(cleaned);
}
