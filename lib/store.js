// In-memory store — persists as long as the dev server runs

const processStore = new Map();
const salesforceLog = [];
const recordboxLog = [];

// ─── file1.xlsx mock data (from Salesforce) ───────────────────────────────────
// Columns: Facility name, Sales Items ID, Sales item display name, Start date, Currency, Quantity, Rate (Unit price)
const FILE1_DATA = [
  { facilityName: 'AsOy Kotikontu 10',      salesItemId: 'SalesItem-2001', displayName: 'EMS Efficient package',     startDate: '1/1/2026', currency: 'EUR', quantity: 1, rate: 15 },
  { facilityName: 'AsOy Kotikontu 10',      salesItemId: 'SalesItem-2002', displayName: 'EMS Basic package',          startDate: '1/1/2026', currency: 'EUR', quantity: 2, rate: 10 },
  { facilityName: 'AsOy Kotikontu 10',      salesItemId: 'SalesItem-2003', displayName: 'EMS Premium package',        startDate: '1/1/2026', currency: 'EUR', quantity: 1, rate: 25 },
  { facilityName: 'AsOy Kotikontu 10',      salesItemId: 'SalesItem-2004', displayName: 'Energy Monitoring Standard', startDate: '1/1/2026', currency: 'EUR', quantity: 3, rate: 12 },
  { facilityName: 'AsOy Kotikontu 10',      salesItemId: 'SalesItem-2005', displayName: 'Smart Energy Pro',           startDate: '1/1/2026', currency: 'EUR', quantity: 1, rate: 18 },
  { facilityName: 'AsOy Kotikontu 10',      salesItemId: 'SalesItem-2006', displayName: 'Energy Analytics Suite',     startDate: '1/1/2026', currency: 'EUR', quantity: 2, rate: 22 },

  { facilityName: 'Green Valley Apartments', salesItemId: 'SalesItem-2001', displayName: 'EMS Efficient package',     startDate: '2/1/2026', currency: 'USD', quantity: 1, rate: 16 },
  { facilityName: 'Green Valley Apartments', salesItemId: 'SalesItem-2002', displayName: 'EMS Basic package',          startDate: '2/1/2026', currency: 'USD', quantity: 2, rate: 11 },
  { facilityName: 'Green Valley Apartments', salesItemId: 'SalesItem-2003', displayName: 'EMS Premium package',        startDate: '2/1/2026', currency: 'USD', quantity: 1, rate: 26 },
  { facilityName: 'Green Valley Apartments', salesItemId: 'SalesItem-2004', displayName: 'Energy Monitoring Standard', startDate: '2/1/2026', currency: 'USD', quantity: 3, rate: 13 },
  { facilityName: 'Green Valley Apartments', salesItemId: 'SalesItem-2005', displayName: 'Smart Energy Pro',           startDate: '2/1/2026', currency: 'USD', quantity: 1, rate: 19 },
  { facilityName: 'Green Valley Apartments', salesItemId: 'SalesItem-2006', displayName: 'Energy Analytics Suite',     startDate: '2/1/2026', currency: 'USD', quantity: 2, rate: 23 },

  { facilityName: 'Sunrise Residency',       salesItemId: 'SalesItem-2001', displayName: 'EMS Efficient package',     startDate: '3/1/2026', currency: 'GBP', quantity: 1, rate: 15 },
  { facilityName: 'Sunrise Residency',       salesItemId: 'SalesItem-2002', displayName: 'EMS Basic package',          startDate: '3/1/2026', currency: 'GBP', quantity: 2, rate: 10 },
  { facilityName: 'Sunrise Residency',       salesItemId: 'SalesItem-2003', displayName: 'EMS Premium package',        startDate: '3/1/2026', currency: 'GBP', quantity: 1, rate: 25 },
  { facilityName: 'Sunrise Residency',       salesItemId: 'SalesItem-2004', displayName: 'Energy Monitoring Standard', startDate: '3/1/2026', currency: 'GBP', quantity: 3, rate: 12 },
  { facilityName: 'Sunrise Residency',       salesItemId: 'SalesItem-2005', displayName: 'Smart Energy Pro',           startDate: '3/1/2026', currency: 'GBP', quantity: 1, rate: 18 },
  { facilityName: 'Sunrise Residency',       salesItemId: 'SalesItem-2006', displayName: 'Energy Analytics Suite',     startDate: '3/1/2026', currency: 'GBP', quantity: 2, rate: 22 },

  { facilityName: 'Lakeview Towers',         salesItemId: 'SalesItem-2001', displayName: 'EMS Efficient package',     startDate: '4/1/2026', currency: 'EUR', quantity: 1, rate: 15 },
  { facilityName: 'Lakeview Towers',         salesItemId: 'SalesItem-2002', displayName: 'EMS Basic package',          startDate: '4/1/2026', currency: 'EUR', quantity: 2, rate: 10 },
  { facilityName: 'Lakeview Towers',         salesItemId: 'SalesItem-2003', displayName: 'EMS Premium package',        startDate: '4/1/2026', currency: 'EUR', quantity: 1, rate: 25 },
  { facilityName: 'Lakeview Towers',         salesItemId: 'SalesItem-2004', displayName: 'Energy Monitoring Standard', startDate: '4/1/2026', currency: 'EUR', quantity: 3, rate: 12 },
  { facilityName: 'Lakeview Towers',         salesItemId: 'SalesItem-2005', displayName: 'Smart Energy Pro',           startDate: '4/1/2026', currency: 'EUR', quantity: 1, rate: 18 },
  { facilityName: 'Lakeview Towers',         salesItemId: 'SalesItem-2006', displayName: 'Energy Analytics Suite',     startDate: '4/1/2026', currency: 'EUR', quantity: 2, rate: 22 },
];

// ─── file2.xlsx mock data (from RecordBox) ────────────────────────────────────
// Columns: Facility name, Sales Items ID, NetSuite account, NetSuite subscription ID, NetSuite subscription item ID
const FILE2_DATA = [
  { facilityName: 'AsOy Kotikontu 10',      salesItemId: 'SalesItem-2001', netSuiteAccount: 'Account-1001', subscriptionId: 'Subscription-2001', subscriptionItemId: 'SubscriptionItem-3001' },
  { facilityName: 'AsOy Kotikontu 10',      salesItemId: 'SalesItem-2002', netSuiteAccount: 'Account-1001', subscriptionId: 'Subscription-2001', subscriptionItemId: 'SubscriptionItem-3002' },
  { facilityName: 'AsOy Kotikontu 10',      salesItemId: 'SalesItem-2003', netSuiteAccount: 'Account-1001', subscriptionId: 'Subscription-2001', subscriptionItemId: 'SubscriptionItem-3003' },
  { facilityName: 'AsOy Kotikontu 10',      salesItemId: 'SalesItem-2004', netSuiteAccount: 'Account-1001', subscriptionId: 'Subscription-2001', subscriptionItemId: 'SubscriptionItem-3004' },
  { facilityName: 'AsOy Kotikontu 10',      salesItemId: 'SalesItem-2005', netSuiteAccount: 'Account-1001', subscriptionId: 'Subscription-2001', subscriptionItemId: 'SubscriptionItem-3005' },
  { facilityName: 'AsOy Kotikontu 10',      salesItemId: 'SalesItem-2006', netSuiteAccount: 'Account-1001', subscriptionId: 'Subscription-2001', subscriptionItemId: 'SubscriptionItem-3006' },

  { facilityName: 'Green Valley Apartments', salesItemId: 'SalesItem-2001', netSuiteAccount: 'Account-1002', subscriptionId: 'Subscription-2002', subscriptionItemId: 'SubscriptionItem-3007' },
  { facilityName: 'Green Valley Apartments', salesItemId: 'SalesItem-2002', netSuiteAccount: 'Account-1002', subscriptionId: 'Subscription-2002', subscriptionItemId: 'SubscriptionItem-3008' },
  { facilityName: 'Green Valley Apartments', salesItemId: 'SalesItem-2003', netSuiteAccount: 'Account-1002', subscriptionId: 'Subscription-2002', subscriptionItemId: 'SubscriptionItem-3009' },
  { facilityName: 'Green Valley Apartments', salesItemId: 'SalesItem-2004', netSuiteAccount: 'Account-1002', subscriptionId: 'Subscription-2002', subscriptionItemId: 'SubscriptionItem-3010' },
  { facilityName: 'Green Valley Apartments', salesItemId: 'SalesItem-2005', netSuiteAccount: 'Account-1002', subscriptionId: 'Subscription-2002', subscriptionItemId: 'SubscriptionItem-3011' },
  { facilityName: 'Green Valley Apartments', salesItemId: 'SalesItem-2006', netSuiteAccount: 'Account-1002', subscriptionId: 'Subscription-2002', subscriptionItemId: 'SubscriptionItem-3012' },

  { facilityName: 'Sunrise Residency',       salesItemId: 'SalesItem-2001', netSuiteAccount: 'Account-1003', subscriptionId: 'Subscription-2003', subscriptionItemId: 'SubscriptionItem-3013' },
  { facilityName: 'Sunrise Residency',       salesItemId: 'SalesItem-2002', netSuiteAccount: 'Account-1003', subscriptionId: 'Subscription-2003', subscriptionItemId: 'SubscriptionItem-3014' },
  { facilityName: 'Sunrise Residency',       salesItemId: 'SalesItem-2003', netSuiteAccount: 'Account-1003', subscriptionId: 'Subscription-2003', subscriptionItemId: 'SubscriptionItem-3015' },
  { facilityName: 'Sunrise Residency',       salesItemId: 'SalesItem-2004', netSuiteAccount: 'Account-1003', subscriptionId: 'Subscription-2003', subscriptionItemId: 'SubscriptionItem-3016' },
  { facilityName: 'Sunrise Residency',       salesItemId: 'SalesItem-2005', netSuiteAccount: 'Account-1003', subscriptionId: 'Subscription-2003', subscriptionItemId: 'SubscriptionItem-3017' },
  { facilityName: 'Sunrise Residency',       salesItemId: 'SalesItem-2006', netSuiteAccount: 'Account-1003', subscriptionId: 'Subscription-2003', subscriptionItemId: 'SubscriptionItem-3018' },

  { facilityName: 'Lakeview Towers',         salesItemId: 'SalesItem-2001', netSuiteAccount: 'Account-1004', subscriptionId: 'Subscription-2004', subscriptionItemId: 'SubscriptionItem-3019' },
  { facilityName: 'Lakeview Towers',         salesItemId: 'SalesItem-2002', netSuiteAccount: 'Account-1004', subscriptionId: 'Subscription-2004', subscriptionItemId: 'SubscriptionItem-3020' },
  { facilityName: 'Lakeview Towers',         salesItemId: 'SalesItem-2003', netSuiteAccount: 'Account-1004', subscriptionId: 'Subscription-2004', subscriptionItemId: 'SubscriptionItem-3021' },
  { facilityName: 'Lakeview Towers',         salesItemId: 'SalesItem-2004', netSuiteAccount: 'Account-1004', subscriptionId: 'Subscription-2004', subscriptionItemId: 'SubscriptionItem-3022' },
  { facilityName: 'Lakeview Towers',         salesItemId: 'SalesItem-2005', netSuiteAccount: 'Account-1004', subscriptionId: 'Subscription-2004', subscriptionItemId: 'SubscriptionItem-3023' },
  { facilityName: 'Lakeview Towers',         salesItemId: 'SalesItem-2006', netSuiteAccount: 'Account-1004', subscriptionId: 'Subscription-2004', subscriptionItemId: 'SubscriptionItem-3024' },
];

// ─── Join file1 + file2 on facilityName + salesItemId ────────────────────────
function createMergedData(facilityName) {
  // Case-insensitive match, fall back to first known facility if not found
  const normalize = s => s.trim().toLowerCase();
  const target = normalize(facilityName);

  const file1Rows = FILE1_DATA.filter(r => normalize(r.facilityName) === target);
  const file2Rows = FILE2_DATA.filter(r => normalize(r.facilityName) === target);

  // If unknown facility, use first known facility rows as demo data
  const src1 = file1Rows.length ? file1Rows : FILE1_DATA.slice(0, 6);
  const src2 = file2Rows.length ? file2Rows : FILE2_DATA.slice(0, 6);

  // Build a lookup map from file2 keyed by salesItemId
  const file2Map = {};
  src2.forEach(r => { file2Map[r.salesItemId] = r; });

  // output.xlsx columns: all file1 columns + NetSuite columns from file2
  return src1.map(row => {
    const rec = file2Map[row.salesItemId] || {};
    return {
      facilityName:       row.facilityName,
      salesItemId:        row.salesItemId,
      displayName:        row.displayName,
      netSuiteAccount:    rec.netSuiteAccount    || '—',
      subscriptionId:     rec.subscriptionId     || '—',
      subscriptionItemId: rec.subscriptionItemId || '—',
      startDate:          row.startDate,
      currency:           row.currency,
      quantity:           row.quantity,
      rate:               row.rate,
    };
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createProcess(facilityName) {
  const id = crypto.randomUUID();
  const now = Date.now();

  const proc = {
    id,
    facilityName,
    status: 'pending',
    createdAt: now,
    steps: [
      { id: 1, message: 'Request received from Enerkey', source: 'pathfinder', timestamp: now },
    ],
    file1Data: null,
    file2Data: null,
    mergedData: null,
  };

  processStore.set(id, proc);

  const normalize = s => s.trim().toLowerCase();
  const target = normalize(facilityName);
  const file1Rows = FILE1_DATA.filter(r => normalize(r.facilityName) === target);
  const file2Rows = FILE2_DATA.filter(r => normalize(r.facilityName) === target);
  const count1 = file1Rows.length || 6;
  const count2 = file2Rows.length || 6;

  setTimeout(() => {
    const p = processStore.get(id);
    if (!p) return;
    p.status = 'fetching';
    p.steps.push({ id: 2, message: `Querying Salesforce for facility "${facilityName}"`, source: 'salesforce', timestamp: Date.now() });
    p.steps.push({ id: 3, message: `Querying RecordBox for facility "${facilityName}"`, source: 'recordbox', timestamp: Date.now() });
    salesforceLog.unshift({ facilityName, timestamp: Date.now(), status: 'processing' });
    recordboxLog.unshift({ facilityName, timestamp: Date.now(), status: 'processing' });
  }, 900);

  setTimeout(() => {
    const p = processStore.get(id);
    if (!p) return;
    p.file1Data = file1Rows.length ? file1Rows : FILE1_DATA.slice(0, 6);
    p.steps.push({ id: 4, message: `Salesforce responded — ${count1} sales item rows (file1.xlsx)`, source: 'salesforce', timestamp: Date.now() });
    if (salesforceLog[0]?.facilityName === facilityName) salesforceLog[0].status = 'done';
  }, 2400);

  setTimeout(() => {
    const p = processStore.get(id);
    if (!p) return;
    p.file2Data = file2Rows.length ? file2Rows : FILE2_DATA.slice(0, 6);
    p.steps.push({ id: 5, message: `RecordBox responded — ${count2} subscription rows (file2.xlsx)`, source: 'recordbox', timestamp: Date.now() });
    if (recordboxLog[0]?.facilityName === facilityName) recordboxLog[0].status = 'done';
  }, 2900);

  setTimeout(() => {
    const p = processStore.get(id);
    if (!p) return;
    p.status = 'merging';
    p.steps.push({ id: 6, message: 'Joining on Facility name + Sales Items ID → output.xlsx', source: 'pathfinder', timestamp: Date.now() });
  }, 3600);

  setTimeout(() => {
    const p = processStore.get(id);
    if (!p) return;
    p.status = 'complete';
    p.mergedData = createMergedData(facilityName);
    p.steps.push({ id: 7, message: `Export ready — ${p.mergedData.length} merged rows`, source: 'pathfinder', timestamp: Date.now() });
    p.completedAt = Date.now();
  }, 5100);

  return id;
}

export function getProcess(id) {
  return processStore.get(id) || null;
}

export function getAllProcesses() {
  return Array.from(processStore.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function getSalesforceLog() {
  return salesforceLog.slice(0, 10);
}

export function getRecordboxLog() {
  return recordboxLog.slice(0, 10);
}

// Export raw schema for the blackbox pages
export { FILE1_DATA, FILE2_DATA };
