import { definition as gstVerifyDef, handler as gstVerifyHandler } from './gst-verify.js';
import { definition as panVerifyDef, handler as panVerifyHandler } from './pan-verify.js';
import { definition as gstCalcDef, handler as gstCalcHandler } from './gst-calculator.js';
import { definition as gstinStatusDef, handler as gstinStatusHandler } from './gstin-status.js';
import { definition as companySearchDef, handler as companySearchHandler } from './company-search.js';
import { definition as pincodeDef, handler as pincodeHandler } from './pincode-lookup.js';
import { definition as hsnDef, handler as hsnHandler } from './hsn-lookup.js';
import { definition as gstReturnDef, handler as gstReturnHandler } from './gst-return-status.js';

const tools = [
  { definition: gstVerifyDef, handler: gstVerifyHandler },
  { definition: panVerifyDef, handler: panVerifyHandler },
  { definition: gstCalcDef, handler: gstCalcHandler },
  { definition: gstinStatusDef, handler: gstinStatusHandler },
  { definition: companySearchDef, handler: companySearchHandler },
  { definition: pincodeDef, handler: pincodeHandler },
  { definition: hsnDef, handler: hsnHandler },
  { definition: gstReturnDef, handler: gstReturnHandler }
];

const toolMap = new Map(tools.map(t => [t.definition.name, t.handler]));
const toolDefinitions = tools.map(t => t.definition);

export function getToolDefinitions() {
  return toolDefinitions;
}

export function getTool(name) {
  return toolMap.get(name);
}
