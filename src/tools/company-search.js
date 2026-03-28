const CIN_REGEX = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

const MOCK_COMPANIES = [
  {
    companyName: 'DEMO SOFTWARE SOLUTIONS PRIVATE LIMITED',
    cin: 'U72900KA2018PTC123456',
    registrationDate: '2018-03-15',
    status: 'Active',
    authorizedCapital: 1000000,
    paidUpCapital: 100000,
    companyCategory: 'Company limited by Shares',
    companySubcategory: 'Non-govt company',
    state: 'Karnataka',
    directors: [
      { name: 'RAHUL SHARMA', din: '08123456', designation: 'Director' },
      { name: 'PRIYA PATEL', din: '08654321', designation: 'Director' }
    ]
  },
  {
    companyName: 'SAMPLE INDUSTRIES LIMITED',
    cin: 'L24100MH1985PLC035678',
    registrationDate: '1985-07-22',
    status: 'Active',
    authorizedCapital: 50000000,
    paidUpCapital: 25000000,
    companyCategory: 'Company limited by Shares',
    companySubcategory: 'Non-govt company',
    state: 'Maharashtra',
    directors: [
      { name: 'VIJAY MEHTA', din: '00987654', designation: 'Managing Director' }
    ]
  }
];

export const definition = {
  name: 'company_search',
  description: 'Search for an Indian company by name or CIN (Corporate Identification Number) and return registration details, status, authorized capital, and directors.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Company name (partial or full) or CIN number to search for'
      }
    },
    required: ['query']
  }
};

export async function handler({ query }) {
  if (!query) return { error: 'query is required' };

  const q = query.toUpperCase().trim();

  // Check if it looks like a CIN
  if (CIN_REGEX.test(q)) {
    const match = MOCK_COMPANIES.find(c => c.cin === q);
    if (match) return match;
    return {
      companyName: 'COMPANY NOT FOUND',
      cin: q,
      status: 'Not Found',
      _note: 'Mock data. Integrate MCA API for live company search.'
    };
  }

  // Search by name
  const results = MOCK_COMPANIES.filter(c => c.companyName.includes(q));
  if (results.length === 0) {
    return {
      results: [],
      total: 0,
      query,
      _note: 'Mock data. Integrate MCA API for live company search.'
    };
  }

  return {
    results,
    total: results.length,
    query,
    _note: 'Mock data. Integrate MCA API for live company search.'
  };
}
