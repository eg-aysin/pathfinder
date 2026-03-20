'use client';
import { useState, useEffect, useRef } from 'react';
import { Zap, Upload, CheckCircle2, Loader2, AlertCircle, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const STEPS_META = {
  1: { label: 'Request received by Pathfinder',       color: 'text-blue-400',   icon: '⚡' },
  2: { label: 'Querying Salesforce API',              color: 'text-violet-400', icon: '☁' },
  3: { label: 'Querying RecordBox storage',           color: 'text-emerald-400',icon: '🗄' },
  4: { label: 'Salesforce data received',             color: 'text-violet-400', icon: '✓' },
  5: { label: 'RecordBox data received',              color: 'text-emerald-400',icon: '✓' },
  6: { label: 'Merging datasets',                     color: 'text-amber-400',  icon: '⚙' },
  7: { label: 'Import complete — output ready',       color: 'text-green-400',  icon: '✅' },
};

export default function EnerkeyPage() {
  const [facilityName, setFacilityName] = useState('');
  const [processId, setProcessId] = useState(null);
  const [processData, setProcessData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  // Stop polling when complete
  useEffect(() => {
    if (processData?.status === 'complete') {
      clearInterval(pollRef.current);
    }
  }, [processData?.status]);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  async function startImport() {
    if (!facilityName.trim()) { setError('Please enter a facility name'); return; }
    setError('');
    setLoading(true);
    setProcessData(null);

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityName: facilityName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to start import');
      const { processId: id } = await res.json();
      setProcessId(id);
      setLoading(false);

      // Start polling
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/status/${id}`);
          const data = await r.json();
          setProcessData(data);
        } catch {}
      }, 500);
    } catch (e) {
      setError('Import failed. Is the server running?');
      setLoading(false);
    }
  }

  function reset() {
    clearInterval(pollRef.current);
    setProcessId(null);
    setProcessData(null);
    setFacilityName('');
    setError('');
  }

  const isComplete = processData?.status === 'complete';
  const isRunning  = processId && !isComplete;
  const steps      = processData?.steps || [];
  const mergedData = processData?.mergedData || [];

  return (
    <div className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
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
        {/* Left — MSS Import panel */}
        <div className="lg:col-span-2">
          <Card className={`transition-all duration-300 ${isRunning ? 'glow-card-active' : ''}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Upload size={18} className="text-blue-400" />
                <CardTitle>MSS Import</CardTitle>
              </div>
              <CardDescription>
                Import meter & contract data by facility name via Pathfinder integration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="facility">Facility Name</Label>
                <Input
                  id="facility"
                  placeholder="e.g. Helsinki Main Office"
                  value={facilityName}
                  onChange={e => setFacilityName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && !isRunning && startImport()}
                  disabled={loading || isRunning}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              {!processId ? (
                <Button
                  className="w-full"
                  onClick={startImport}
                  disabled={loading || !facilityName.trim()}
                  size="lg"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Starting…</>
                  ) : (
                    <><Upload size={16} /> Start MSS Import</>
                  )}
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={reset}>
                  <RefreshCw size={15} />
                  New Import
                </Button>
              )}

              {/* Progress bar */}
              {processId && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progress</span>
                    <span>{steps.length}/7 steps</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-blue-950 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(steps.length / 7) * 100}%`,
                        background: isComplete
                          ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                          : 'linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)',
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connection info card */}
          <div className="mt-4 rounded-xl p-4 text-xs space-y-2"
            style={{ background: '#0a0a1e', border: '1px solid rgba(59,130,246,0.1)' }}>
            <div className="text-slate-400 font-medium mb-3">Connected Services</div>
            {[
              { label: 'Pathfinder', status: 'online', color: 'text-blue-400' },
              { label: 'Salesforce (via Pathfinder)', status: 'online', color: 'text-violet-400' },
              { label: 'RecordBox (via Pathfinder)',  status: 'online', color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className={s.color}>{s.label}</span>
                <Badge variant="success" className="text-xs">Online</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Status + Result */}
        <div className="lg:col-span-3 space-y-5">
          {/* Step log */}
          {processId && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle2 size={17} className="text-green-400" />
                    ) : (
                      <Loader2 size={17} className="text-blue-400 animate-spin" />
                    )}
                    {isComplete ? 'Import Successful' : 'Import in Progress'}
                  </CardTitle>
                  {processData?.id && (
                    <span className="text-xs text-slate-600 font-mono">
                      {processData.id.slice(0, 8)}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {steps.map((step, i) => {
                    const meta = STEPS_META[step.id] || { label: step.message, color: 'text-slate-400', icon: '·' };
                    return (
                      <div
                        key={step.id}
                        className="log-entry flex items-center gap-3 py-2 px-3 rounded-lg"
                        style={{
                          background: 'rgba(59,130,246,0.04)',
                          border: '1px solid rgba(59,130,246,0.08)',
                          animationDelay: `${i * 30}ms`,
                        }}
                      >
                        <span className="text-base leading-none w-5 flex-none text-center">
                          {meta.icon}
                        </span>
                        <span className={`text-sm flex-1 ${meta.color}`}>{meta.label}</span>
                        <span className="text-xs text-slate-600 font-mono flex-none">
                          +{((step.timestamp - (steps[0]?.timestamp || step.timestamp)) / 1000).toFixed(1)}s
                        </span>
                        <ChevronRight size={12} className="text-slate-700 flex-none" />
                      </div>
                    );
                  })}

                  {/* Pending steps (animated placeholders) */}
                  {!isComplete && Array.from({ length: 7 - steps.length }).map((_, i) => (
                    <div key={`pending-${i}`} className="flex items-center gap-3 py-2 px-3 rounded-lg opacity-20"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-5 h-3 rounded bg-slate-700 animate-pulse" />
                      <div className="h-3 rounded bg-slate-800 animate-pulse flex-1" style={{ animationDelay: `${i * 100}ms` }} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Merged data table */}
          {isComplete && mergedData.length > 0 && (
            <Card className="glow-card-active">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Download size={16} className="text-green-400" />
                    Import Output — {mergedData.length} records
                  </CardTitle>
                  <Badge variant="success">output.xlsx ready</Badge>
                </div>
                <CardDescription>
                  Merged from Salesforce (contracts) + RecordBox (meter readings) for <strong className="text-slate-300">{processData?.facilityName}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(59,130,246,0.15)' }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'rgba(59,130,246,0.1)' }}>
                        {['Facility', 'Contract ID', 'Energy Type', 'Supplier', 'Meter ID', 'Reading', 'Unit', 'Period', 'Status'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 text-slate-400 font-medium whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mergedData.map((row, i) => (
                        <tr key={i} className="border-t border-blue-900/20 hover:bg-white/[0.02] transition-colors log-entry"
                          style={{ animationDelay: `${i * 80}ms` }}>
                          <td className="px-3 py-2 text-blue-300 font-medium">{row.facility}</td>
                          <td className="px-3 py-2 text-slate-300 font-mono">{row.contractId}</td>
                          <td className="px-3 py-2 text-slate-400">{row.energyType}</td>
                          <td className="px-3 py-2 text-slate-400">{row.supplier}</td>
                          <td className="px-3 py-2 text-slate-400 font-mono">{row.meterId}</td>
                          <td className="px-3 py-2 text-white font-medium">{row.reading.toLocaleString()}</td>
                          <td className="px-3 py-2 text-slate-500">{row.unit}</td>
                          <td className="px-3 py-2 text-slate-400">{row.period}</td>
                          <td className="px-3 py-2">
                            <Badge variant={row.status === 'Verified' ? 'success' : 'warning'}>
                              {row.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!processId && (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl text-center"
              style={{ background: '#0a0a1e', border: '1px dashed rgba(59,130,246,0.15)' }}>
              <Upload size={36} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">Enter a facility name and click</p>
              <p className="text-slate-500 text-sm font-medium">"Start MSS Import" to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
