const VALID_GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 7.5, 12, 18, 28];

export const definition = {
  name: 'gst_calculator',
  description: 'Calculate GST breakdown (CGST, SGST, IGST) for a given amount and GST rate. For interstate transactions, full GST applies as IGST. For intrastate, it splits equally into CGST and SGST.',
  inputSchema: {
    type: 'object',
    properties: {
      amount: {
        type: 'number',
        description: 'The base amount (before GST) in rupees'
      },
      gstRate: {
        type: 'number',
        description: 'GST rate as a percentage (e.g., 18 for 18% GST)'
      },
      isInterstate: {
        type: 'boolean',
        description: 'True if the transaction is interstate (different states), false for intrastate (same state)'
      }
    },
    required: ['amount', 'gstRate', 'isInterstate']
  }
};

export async function handler({ amount, gstRate, isInterstate }) {
  if (amount === undefined || amount === null) return { error: 'amount is required' };
  if (gstRate === undefined || gstRate === null) return { error: 'gstRate is required' };
  if (isInterstate === undefined) return { error: 'isInterstate is required' };

  const amt = parseFloat(amount);
  const rate = parseFloat(gstRate);

  if (isNaN(amt) || amt < 0) return { error: 'amount must be a non-negative number' };
  if (isNaN(rate) || rate < 0) return { error: 'gstRate must be a non-negative number' };

  const totalGst = parseFloat(((amt * rate) / 100).toFixed(2));
  const totalAmount = parseFloat((amt + totalGst).toFixed(2));

  let cgst = 0, sgst = 0, igst = 0;

  if (isInterstate) {
    igst = totalGst;
  } else {
    cgst = parseFloat((totalGst / 2).toFixed(2));
    sgst = parseFloat((totalGst / 2).toFixed(2));
    // Fix rounding: ensure cgst + sgst = totalGst
    if (cgst + sgst !== totalGst) {
      sgst = parseFloat((totalGst - cgst).toFixed(2));
    }
  }

  return {
    baseAmount: parseFloat(amt.toFixed(2)),
    gstRate: rate,
    transactionType: isInterstate ? 'Interstate' : 'Intrastate',
    cgst,
    sgst,
    igst,
    totalGst,
    totalAmount
  };
}
