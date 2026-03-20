'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Clock, Search, X, Trash2, Download, ChevronDown, ChevronUp,
  CheckCircle2, Activity, Building2, FileText, BarChart3, AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── CSV export (client-side) ─────────────────────────────────────────────────
function exportCSV(entries) {
  const headers = [
    'Date', 'Time', 'Facility Name', 'Status',
    'Duration (s)', 'Records', 'Process ID',
  ];
  const rows = entries.map(e => [
    new Date(e.createdAt).toLocaleDateString(),
    new Date(e.createdAt).toLocaleTimeString(),
    e.facilityName,
    e.status,
    e.duration != null ? (e.duration / 1000).toFixed(1) : '',
    e.recordCount ?? 0,
    e.id,
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `pathfinder_history_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Single history row ───────────────────────────────────────────────────────
function HistoryRow({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const date     = new Date(entry.createdAt);
  const duration = entry.duration != null ? (entry.duration / 1000).toFixed(1) : '—';

  function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    onDelete(entry.id);
  }

  return (
    <div className="rounded-lg overflow-hidden transition-all duration-200 log-entry"
      style={{ background: '#0a0a1e', border: '1px solid rgba(59,130,246,0.1)' }}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <CheckCircle2 size={15} className="text-green-400 flex-none" />

        {/* Date/time */}
        <div className="flex-none w-36 text-xs">
          <div className="text-slate-300">{date.toLocaleDateString()}</div>
          <div className="text-slate-600 font-mono">{date.toLocaleTimeString()}</div>
        </div>

        {/* Facility */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Building2 size={12} className="text-blue-400 flex-none" />
            <span className="text-sm font-medium text-white truncate">{entry.facilityName}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 flex-none text-xs text-slate-500">
          <span>{duration}s</span>
          <span className="text-slate-400">{entry.recordCount} rows</span>
          <span className="font-mono text-slate-700">{entry.id.slice(0, 8)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-none">
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            title="View steps"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {confirming ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="px-2 py-1 rounded text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded step log */}
      {expanded && entry.steps && (
        <div className="border-t border-blue-900/20 px-4 py-3 space-y-1.5">
          {entry.steps.map((step, i) => {
            const srcColor = {
              pathfinder: 'text-blue-400',
              salesforce:  'text-violet-400',
              recordbox:   'text-emerald-400',
            }[step.source] || 'text-slate-400';
            const elapsed = ((step.timestamp - entry.steps[0].timestamp) / 1000).toFixed(2);
            return (
              <div key={step.id} className="flex items-center gap-3 text-xs">
                <span className="w-px h-4 bg-blue-900/50 flex-none" />
                <span className={`font-medium uppercase tracking-wide flex-none w-20 ${srcColor}`}>
                  {step.source}
                </span>
                <span className="text-slate-400 flex-1">{step.message}</span>
                <span className="text-slate-700 font-mono">+{elapsed}s</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [entries, setEntries]     = useState([]);
  const [stats, setStats]         = useState(null);
  const [facility, setFacility]   = useState('');
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [clearConfirm, setClearConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (facility) params.set('facility', facility);
    if (fromDate) params.set('from', fromDate);
    if (toDate)   params.set('to', toDate);

    const [entriesRes, statsRes] = await Promise.all([
      fetch(`/api/history?${params}`),
      fetch('/api/history?stats=true'),
    ]);
    const { entries: e } = await entriesRes.json();
    const s = await statsRes.json();
    setEntries(e || []);
    setStats(s);
    setLoading(false);
  }, [facility, fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function deleteEntry(id) {
    await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
    fetchData();
  }

  async function clearAll() {
    await fetch('/api/history?all=true', { method: 'DELETE' });
    setClearConfirm(false);
    fetchData();
  }

  function clearFilters() {
    setFacility('');
    setFromDate('');
    setToDate('');
  }

  const hasFilters = facility || fromDate || toDate;
  const isFiltered = hasFilters && entries.length !== stats?.total;

  return (
    <div className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
          <Clock size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Request History</h1>
          <p className="text-slate-500 text-sm">All past MSS imports — persisted across server restarts</p>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Activity,    label: 'Total Imports',   value: stats.total,        color: 'text-blue-400' },
            { icon: Building2,   label: 'Unique Facilities', value: stats.facilities, color: 'text-amber-400' },
            { icon: Clock,       label: 'Avg Duration',    value: stats.avgDuration ? `${stats.avgDuration}s` : '—', color: 'text-violet-400' },
            { icon: FileText,    label: 'Total Records',   value: stats.totalRecords, color: 'text-emerald-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: '#0a0a1e', border: '1px solid rgba(59,130,246,0.1)' }}>
              <Icon size={18} className={`${color} flex-none`} />
              <div>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="rounded-xl p-4 mb-6 flex flex-wrap items-end gap-3"
        style={{ background: '#0a0a1e', border: '1px solid rgba(59,130,246,0.1)' }}>
        {/* Facility search */}
        <div className="flex-1 min-w-48">
          <label className="text-xs text-slate-500 mb-1.5 block">Facility name</label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={facility}
              onChange={e => setFacility(e.target.value)}
              placeholder="Search facilities…"
              className="w-full rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition-all"
              style={{ background: 'rgba(30,27,75,0.3)', border: '1px solid rgba(59,130,246,0.2)' }}
            />
            {facility && (
              <button onClick={() => setFacility('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* From date */}
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm text-slate-300 outline-none transition-all"
            style={{ background: 'rgba(30,27,75,0.3)', border: '1px solid rgba(59,130,246,0.2)', colorScheme: 'dark' }}
          />
        </div>

        {/* To date */}
        <div>
          <label className="text-xs text-slate-500 mb-1.5 block">To</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm text-slate-300 outline-none transition-all"
            style={{ background: 'rgba(30,27,75,0.3)', border: '1px solid rgba(59,130,246,0.2)', colorScheme: 'dark' }}
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="self-end">
            <X size={13} /> Clear filters
          </Button>
        )}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            {loading ? 'Loading…' : (
              <>
                <span className="text-white font-medium">{entries.length}</span>
                {hasFilters ? ` of ${stats?.total ?? '?'} imports` : ' imports'}
              </>
            )}
          </span>
          {isFiltered && (
            <Badge variant="default" className="text-xs">Filtered</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => exportCSV(entries)}>
              <Download size={13} />
              Export CSV
            </Button>
          )}
          {stats?.total > 0 && (
            clearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Delete all {stats.total} entries?</span>
                <Button variant="destructive" size="sm" onClick={clearAll}>Yes, clear all</Button>
                <Button variant="ghost" size="sm" onClick={() => setClearConfirm(false)}>Cancel</Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => setClearConfirm(true)}>
                <Trash2 size={13} />
                Clear all
              </Button>
            )
          )}
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-lg animate-pulse"
              style={{ background: '#0a0a1e', border: '1px solid rgba(59,130,246,0.08)' }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center"
          style={{ background: '#0a0a1e', border: '1px dashed rgba(59,130,246,0.12)', borderRadius: '12px' }}>
          {hasFilters ? (
            <>
              <Search size={36} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No imports match your filters</p>
              <button onClick={clearFilters} className="text-blue-400 text-sm mt-2 hover:text-blue-300">
                Clear filters
              </button>
            </>
          ) : (
            <>
              <Clock size={36} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No import history yet</p>
              <p className="text-slate-600 text-xs mt-1">Run an MSS Import in Enerkey to get started</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => (
            <HistoryRow key={entry.id} entry={entry} onDelete={deleteEntry} />
          ))}
        </div>
      )}
    </div>
  );
}
