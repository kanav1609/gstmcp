const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const PAN_TYPE_MAP = {
  P: 'Individual',
  C: 'Company',
  H: 'Hindu Undivided Family',
  F: 'Firm',
  A: 'Association of Persons',
  T: 'Trust',
  B: 'Body of Individuals',
  L: 'Local Authority',
  J: 'Artificial Juridical Person',
  G: 'Government'
};

function getMockData(pan) {
  const typeChar = pan[3];
  const category = PAN_TYPE_MAP[typeChar] || 'Unknown';
  return {
    pan,
    name: 'DEMO ENTITY NAME',
    category,
    status: 'Valid',
    aadhaarLinked: true,
    _note: 'Mock data. Integrate Setu or NSDL API for live verification.'
  };
}

export const definition = {
  name: 'pan_verify',
  description: 'Verify a PAN (Permanent Account Number) and return the holder name, category (individual, company, etc.), and Aadhaar linkage status.',
  inputSchema: {
    type: 'object',
    properties: {
      pan: {
        type: 'string',
        description: 'The 10-character PAN to verify (e.g., ABCDE1234F)'
      }
    },
    required: ['pan']
  }
};

export async function handler({ pan }) {
  if (!pan) return { error: 'pan is required' };

  const cleaned = pan.toUpperCase().trim();
  if (!PAN_REGEX.test(cleaned)) {
    return { error: 'Invalid PAN format. Must be 10 characters: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)' };
  }

  // Real API integration point: swap getMockData with Setu/NSDL call
  return getMockData(cleaned);
}
