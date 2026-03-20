'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap, Upload, CheckCircle2, Loader2, AlertCircle, ChevronRight,
  Download, RefreshCw, X, Search, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const STEPS_META = {
  1: { label: 'Request received by Pathfinder',  color: 'text-blue-400',    icon: '⚡' },
  2: { label: 'Querying Salesforce API',          color: 'text-violet-400',  icon: '☁' },
  3: { label: 'Querying RecordBox storage',       color: 'text-emerald-400', icon: '🗄' },
  4: { label: 'Salesforce data received',         color: 'text-violet-400',  icon: '✓' },
  5: { label: 'RecordBox data received',          color: 'text-emerald-400', icon: '✓' },
  6: { label: 'Merging datasets',                 color: 'text-amber-400',   icon: '⚙' },
  7: { label: 'Import complete — output ready',   color: 'text-green-400',   icon: '✅' },
};

const STATUS_PROGRESS = {
  pending: 5, fetching: 35, salesforce_done: 55,
  recordbox_done: 70, merging: 85, complete: 100,
};

// ─── Chip input component ────────────────────────────────────────────────────
function FacilityChipInput({ chips, onChange, disabled }) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  function addChip(raw) {
    const names = raw.split(',').map(s => s.trim()).filter(Boolean);
    const unique = names.filter(n => !chips.includes(n));
    if (unique.length) onChange([...chips, ...unique]);
  }

  function handleKeyDown(e) {
    if ((e.key === ',' || e.key === 'Enter') && inputVal.trim()) {
      e.preventDefault();
      addChip(inputVal);
      setInputVal('');
    } else if (e.key === 'Backspace' && !inputVal && chips.length) {
      onChange(chips.slice(0, -1));
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    addChip(text);
    setInputVal('');
  }

  function removeChip(name) {
    onChange(chips.filter(c => c !== name));
  }

  return (
    <div
      className="min-h-[42px] w-full rounded-lg px-3 py-2 flex flex-wrap gap-1.5 items-center cursor-text transition-all duration-200"
      style={{
        background: 'rgba(30,27,75,0.2)',
        border: '1px solid rgba(59,130,246,0.3)',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {chips.map(name => (
        <span
          key={name}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
          style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#93c5fd' }}
        >
          <Building2 size={10} />
          {name}
          {!disabled && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeChip(name); }}
              className="ml-0.5 text-blue-300/60 hover:text-blue-200 transition-colors"
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          ref={inputRef}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => { if (inputVal.trim()) { addChip(inputVal); setInputVal(''); } }}
          placeholder={chips.length === 0 ? 'Type name, press comma or Enter to add…' : 'Add another…'}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-white placeholder:text-slate-600 outline-none"
        />
      )}
    </div>
  );
}

// ─── Per-facility progress row ────────────────────────────────────────────────
function FacilityProgress({ facilityName, proc }) {
  const [expanded, setExpanded] = useState(false);
  const status   = proc?.status || 'pending';
  const steps    = proc?.steps  || [];
  const progress = STATUS_PROGRESS[status] || 5;
  const isDone   = status === 'complete';

  return (
    <div className="rounded-lg overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(59,130,246,0.03)',
        border: `1px solid ${isDone ? 'rgba(34,197,94,0.25)' : 'rgba(59,130,246,0.12)'}`,
      }}>
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        {isDone
          ? <CheckCircle2 size={15} className="text-green-400 flex-none" />
          : <Loader2 size={15} className="text-blue-400 animate-spin flex-none" />
        }
        <span className="text-sm font-medium text-white flex-1 truncate">{facilityName}</span>
        <span className="text-xs text-slate-500 font-mono mr-2">{steps.length}/7</span>
        <div className="w-24 h-1.5 rounded-full bg-blue-950 overflow-hidden flex-none">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: isDone ? '#22c55e' : 'linear-gradient(90deg,#1d4ed8,#3b82f6)',
            }}
          />
        </div>
        <ChevronRight size={13} className={`text-slate-600 flex-none ml-2 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded steps */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-blue-900/20">
          {steps.map((step, i) => {
            const meta = STEPS_META[step.id] || { label: step.message, color: 'text-slate-400', icon: '·' };
            return (
              <div key={step.id} className="log-entry flex items-center gap-2 py-1.5 text-xs"
                style={{ animationDelay: `${i * 20}ms` }}>
                <span className="w-4 text-center flex-none">{meta.icon}</span>
                <span className={`flex-1 ${meta.color}`}>{meta.label}</span>
                <span className="text-slate-600 font-mono">
                  +{((step.timestamp - (steps[0]?.timestamp || step.timestamp)) / 1000).toFixed(1)}s
                </span>
              </div>
            );
          })}
          {!isDone && (
            <div className="flex items-center gap-2 py-1 text-xs text-slate-700 opacity-60">
              <Loader2 size={10} className="animate-spin" />
              Processing…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EnerkeyPage() {
  const [chips, setChips]           = useState([]);
  const [jobMap, setJobMap]         = useState({}); // facilityName → { processId, data }
  const [running, setRunning]       = useState(false);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const pollRef                     = useRef(null);

  // Derived
  const jobs       = Object.values(jobMap);
  const allDone    = jobs.length > 0 && jobs.every(j => j.data?.status === 'complete');
  const anyRunning = jobs.some(j => j.data && j.data.status !== 'complete');

  const allMerged = jobs
    .filter(j => j.data?.mergedData)
    .flatMap(j => j.data.mergedData);

  const COLS = ['Facility name', 'Sales Items ID', 'Sales item display name',
    'NetSuite account', 'Subscription ID', 'Subscription item ID',
    'Start date', 'Currency', 'Qty', 'Rate'];

  const filteredData = search.trim()
    ? allMerged.filter(row => {
        const q = search.toLowerCase();
        return (
          row.facilityName?.toLowerCase().includes(q) ||
          row.salesItemId?.toLowerCase().includes(q) ||
          row.displayName?.toLowerCase().includes(q) ||
          row.netSuiteAccount?.toLowerCase().includes(q) ||
          row.subscriptionId?.toLowerCase().includes(q) ||
          row.subscriptionItemId?.toLowerCase().includes(q) ||
          row.startDate?.toLowerCase().includes(q) ||
          row.currency?.toLowerCase().includes(q)
        );
      })
    : allMerged;

  // Poll all active processes
  const poll = useCallback(async (currentJobMap) => {
    const entries = Object.entries(currentJobMap);
    const incomplete = entries.filter(([, j]) => j.processId && j.data?.status !== 'complete');
    if (!incomplete.length) { clearInterval(pollRef.current); setRunning(false); return; }

    await Promise.all(incomplete.map(async ([name, job]) => {
      try {
        const res  = await fetch(`/api/status/${job.processId}`);
        const data = await res.json();
        setJobMap(prev => ({ ...prev, [name]: { ...prev[name], data } }));
      } catch {}
    }));
  }, []);

  useEffect(() => {
    if (!running) return;
    pollRef.current = setInterval(() => {
      setJobMap(current => { poll(current); return current; });
    }, 500);
    return () => clearInterval(pollRef.current);
  }, [running, poll]);

  async function startImport() {
    if (!chips.length) { setError('Add at least one facility name'); return; }
    setError('');
    setRunning(true);
    setJobMap({});
    setSearch('');

    // Fire off one process per facility in parallel
    const entries = await Promise.all(
      chips.map(async name => {
        try {
          const res = await fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ facilityName: name }),
          });
          const { processId } = await res.json();
          return [name, { processId, data: null }];
        } catch {
          return [name, { processId: null, data: null, error: true }];
        }
      })
    );

    setJobMap(Object.fromEntries(entries));
  }

  function reset() {
    clearInterval(pollRef.current);
    setChips([]);
    setJobMap({});
    setRunning(false);
    setError('');
    setSearch('');
  }

  const hasJobs    = jobs.length > 0;
  const chipsFull  = chips.length >= 10;

  return (
    <div className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-600">
          <Zap size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Enerkey</h1>
          <p className="text-slate-500 text-sm">Energy Management Platform</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full dot-online" />
          CONNECTED TO PATHFINDER
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: import panel ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card className={`transition-all duration-300 ${anyRunning ? 'glow-card-active' : ''}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Upload size={18} className="text-blue-400" />
                <CardTitle>MSS Import</CardTitle>
              </div>
              <CardDescription>
                Add one or more facility names — separate with <kbd className="px-1 py-0.5 rounded text-xs bg-white/10 text-slate-300">comma</kbd> or <kbd className="px-1 py-0.5 rounded text-xs bg-white/10 text-slate-300">Enter</kbd>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Facility Names</Label>
                  {chips.length > 0 && (
                    <span className="text-xs text-slate-500">{chips.length} selected</span>
                  )}
                </div>
                <FacilityChipInput
                  chips={chips}
                  onChange={setChips}
                  disabled={running}
                />
                {!running && chips.length === 0 && (
                  <p className="text-xs text-slate-600">
                    Hint: paste a comma-separated list to add multiple at once
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              {!hasJobs ? (
                <Button
                  className="w-full"
                  onClick={startImport}
                  disabled={running || chips.length === 0}
                  size="lg"
                >
                  {running ? (
                    <><Loader2 size={16} className="animate-spin" /> Starting…</>
                  ) : (
                    <><Upload size={16} /> Start MSS Import ({chips.length || 0})</>
                  )}
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={reset}>
                  <RefreshCw size={15} />
                  New Import
                </Button>
              )}

              {/* Overall progress */}
              {hasJobs && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Overall</span>
                    <span>{jobs.filter(j => j.data?.status === 'complete').length}/{jobs.length} complete</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-blue-950 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${jobs.length ? (jobs.filter(j => j.data?.status === 'complete').length / jobs.length) * 100 : 0}%`,
                        background: allDone
                          ? 'linear-gradient(90deg,#16a34a,#22c55e)'
                          : 'linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)',
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected services */}
          <div className="rounded-xl p-4 text-xs space-y-2"
            style={{ background: '#0a0a1e', border: '1px solid rgba(59,130,246,0.1)' }}>
            <div className="text-slate-400 font-medium mb-3">Connected Services</div>
            {[
              { label: 'Pathfinder',                  color: 'text-blue-400' },
              { label: 'Salesforce (via Pathfinder)', color: 'text-violet-400' },
              { label: 'RecordBox (via Pathfinder)',  color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className={s.color}>{s.label}</span>
                <Badge variant="success" className="text-xs">Online</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: progress + results ── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Per-facility progress */}
          {hasJobs && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {allDone
                    ? <CheckCircle2 size={17} className="text-green-400" />
                    : <Loader2 size={17} className="text-blue-400 animate-spin" />}
                  {allDone ? `Import complete — ${jobs.length} facilit${jobs.length === 1 ? 'y' : 'ies'}` : 'Import in progress…'}
                </CardTitle>
                <CardDescription>Click a row to expand the step log</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {chips.map(name => (
                    <FacilityProgress
                      key={name}
                      facilityName={name}
                      proc={jobMap[name]?.data}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Merged results table */}
          {allDone && allMerged.length > 0 && (
            <Card className="glow-card-active">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download size={16} className="text-green-400" />
                    Import Output — {allMerged.length} records
                  </CardTitle>
                  <Badge variant="success">output.xlsx ready</Badge>
                </div>
                <CardDescription>
                  {jobs.length} facilit{jobs.length === 1 ? 'y' : 'ies'} · Salesforce + RecordBox merged on Facility name &amp; Sales Items ID
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search bar */}
                <div className="relative mb-4">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by facility, sales item, subscription ID…"
                    className="w-full rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(30,27,75,0.3)',
                      border: search ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(59,130,246,0.15)',
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Result count */}
                {search && (
                  <p className="text-xs text-slate-500 mb-3">
                    {filteredData.length} of {allMerged.length} rows match
                    <span className="text-blue-400 font-medium"> "{search}"</span>
                  </p>
                )}

                <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(59,130,246,0.15)' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'rgba(59,130,246,0.1)' }}>
                        {COLS.map(h => (
                          <th key={h} className="text-left px-3 py-2.5 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={COLS.length} className="px-3 py-8 text-center text-slate-600">
                            No rows match your search
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((row, i) => (
                          <tr key={i}
                            className="border-t border-blue-900/20 hover:bg-white/[0.02] transition-colors log-entry"
                            style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                            <td className="px-3 py-2 text-blue-300 font-medium whitespace-nowrap">{row.facilityName}</td>
                            <td className="px-3 py-2 text-slate-300 font-mono whitespace-nowrap">{row.salesItemId}</td>
                            <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{row.displayName}</td>
                            <td className="px-3 py-2 text-slate-400 font-mono">{row.netSuiteAccount}</td>
                            <td className="px-3 py-2 text-slate-400 font-mono whitespace-nowrap">{row.subscriptionId}</td>
                            <td className="px-3 py-2 text-slate-400 font-mono whitespace-nowrap">{row.subscriptionItemId}</td>
                            <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.startDate}</td>
                            <td className="px-3 py-2 text-slate-400">{row.currency}</td>
                            <td className="px-3 py-2 text-white font-medium text-center">{row.quantity}</td>
                            <td className="px-3 py-2 text-white font-medium">{row.rate}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!hasJobs && (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl text-center"
              style={{ background: '#0a0a1e', border: '1px dashed rgba(59,130,246,0.15)' }}>
              <Upload size={36} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">Add facility names above and click</p>
              <p className="text-slate-500 text-sm font-medium">"Start MSS Import" to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
