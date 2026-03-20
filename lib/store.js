// In-memory store for demo — persists as long as the dev server runs

const processStore = new Map();
const salesforceLog = [];
const recordboxLog = [];

const MOCK_SALESFORCE_DATA = [
  { facilityId: 'FAC-001', contractId: 'CT-2024-0089', energyType: 'Electricity', supplier: 'Nordic Energy AB', startDate: '2024-01-01', endDate: '2025-12-31', tariff: 'Spot+5' },
  { facilityId: 'FAC-001', contractId: 'CT-2024-0090', energyType: 'District Heating', supplier: 'City Heat OY', startDate: '2024-03-01', endDate: '2026-02-28', tariff: 'Fixed' },
  { facilityId: 'FAC-001', contractId: 'CT-2023-0212', energyType: 'Gas', supplier: 'GasPower Ltd', startDate: '2023-06-01', endDate: '2025-05-31', tariff: 'Spot' },
];

const MOCK_RECORDBOX_DATA = [
  { meterId: 'MTR-E-4421', energyType: 'Electricity', reading: 142850, unit: 'kWh', date: '2025-03', status: 'Verified' },
  { meterId: 'MTR-E-4422', energyType: 'Electricity', reading: 38920, unit: 'kWh', date: '2025-03', status: 'Verified' },
  { meterId: 'MTR-H-1103', energyType: 'District Heating', reading: 6240, unit: 'MWh', date: '2025-03', status: 'Pending' },
  { meterId: 'MTR-G-0087', energyType: 'Gas', reading: 9870, unit: 'm³', date: '2025-03', status: 'Verified' },
];

function createMergedData(facilityName) {
  return MOCK_SALESFORCE_DATA.map((sf, i) => {
    const rec = MOCK_RECORDBOX_DATA[i] || MOCK_RECORDBOX_DATA[0];
    return {
      facility: facilityName,
      contractId: sf.contractId,
      energyType: sf.energyType,
      supplier: sf.supplier,
      tariff: sf.tariff,
      meterId: rec.meterId,
      reading: rec.reading,
      unit: rec.unit,
      period: rec.date,
      status: rec.status,
    };
  });
}

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
    salesforceData: null,
    recordboxData: null,
    mergedData: null,
  };

  processStore.set(id, proc);

  // Simulate the async flow with timeouts
  setTimeout(() => {
    const p = processStore.get(id);
    if (!p) return;
    p.status = 'fetching';
    p.steps.push({ id: 2, message: 'Querying Salesforce API for facility contracts', source: 'salesforce', timestamp: Date.now() });
    p.steps.push({ id: 3, message: 'Querying RecordBox for meter readings', source: 'recordbox', timestamp: Date.now() });
    salesforceLog.unshift({ facilityName, timestamp: Date.now(), status: 'processing' });
    recordboxLog.unshift({ facilityName, timestamp: Date.now(), status: 'processing' });
  }, 900);

  setTimeout(() => {
    const p = processStore.get(id);
    if (!p) return;
    p.salesforceData = MOCK_SALESFORCE_DATA;
    p.steps.push({ id: 4, message: `Salesforce responded — ${MOCK_SALESFORCE_DATA.length} contract records`, source: 'salesforce', timestamp: Date.now() });
    if (salesforceLog[0]?.facilityName === facilityName) salesforceLog[0].status = 'done';
  }, 2400);

  setTimeout(() => {
    const p = processStore.get(id);
    if (!p) return;
    p.recordboxData = MOCK_RECORDBOX_DATA;
    p.steps.push({ id: 5, message: `RecordBox responded — ${MOCK_RECORDBOX_DATA.length} meter records`, source: 'recordbox', timestamp: Date.now() });
    if (recordboxLog[0]?.facilityName === facilityName) recordboxLog[0].status = 'done';
  }, 2900);

  setTimeout(() => {
    const p = processStore.get(id);
    if (!p) return;
    p.status = 'merging';
    p.steps.push({ id: 6, message: 'Merging datasets — joining on facility name & energy type', source: 'pathfinder', timestamp: Date.now() });
  }, 3600);

  setTimeout(() => {
    const p = processStore.get(id);
    if (!p) return;
    p.status = 'complete';
    p.mergedData = createMergedData(facilityName);
    p.steps.push({ id: 7, message: `Export ready — ${p.mergedData.length} merged records`, source: 'pathfinder', timestamp: Date.now() });
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
