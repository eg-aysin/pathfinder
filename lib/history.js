import fs from 'fs';
import path from 'path';

const DATA_DIR  = path.join(process.cwd(), 'data');
const HIST_FILE = path.join(DATA_DIR, 'history.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(HIST_FILE)) fs.writeFileSync(HIST_FILE, '[]', 'utf8');
}

function readAll() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(HIST_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeAll(entries) {
  ensureFile();
  fs.writeFileSync(HIST_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

export function appendToHistory(proc) {
  if (proc.status !== 'complete') return;
  const entries = readAll();
  // Avoid duplicates on hot-reload
  if (entries.some(e => e.id === proc.id)) return;
  entries.unshift({
    id:           proc.id,
    facilityName: proc.facilityName,
    status:       proc.status,
    createdAt:    proc.createdAt,
    completedAt:  proc.completedAt,
    duration:     proc.completedAt - proc.createdAt,
    recordCount:  proc.mergedData?.length ?? 0,
    steps:        proc.steps,
  });
  writeAll(entries);
}

export function getHistory({ facility, from, to } = {}) {
  let entries = readAll();
  if (facility) {
    const q = facility.toLowerCase();
    entries = entries.filter(e => e.facilityName.toLowerCase().includes(q));
  }
  if (from) {
    const fromTs = new Date(from).getTime();
    entries = entries.filter(e => e.createdAt >= fromTs);
  }
  if (to) {
    // include the full "to" day
    const toTs = new Date(to).getTime() + 86400000 - 1;
    entries = entries.filter(e => e.createdAt <= toTs);
  }
  return entries;
}

export function deleteEntry(id) {
  const entries = readAll().filter(e => e.id !== id);
  writeAll(entries);
}

export function clearHistory() {
  writeAll([]);
}

export function getStats() {
  const entries = readAll();
  const done    = entries.filter(e => e.status === 'complete');
  const avgMs   = done.length
    ? done.reduce((s, e) => s + (e.duration || 0), 0) / done.length
    : 0;
  return {
    total:      entries.length,
    facilities: [...new Set(entries.map(e => e.facilityName))].length,
    avgDuration: Math.round(avgMs / 1000),
    totalRecords: entries.reduce((s, e) => s + (e.recordCount || 0), 0),
  };
}
