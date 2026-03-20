'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Server, Activity, CheckCircle2, Loader2, Clock, Cloud, Database,
  Zap, ArrowRight, TrendingUp, Layers
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const SOURCE_COLOR = {
  pathfinder: { text: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'Pathfinder' },
  salesforce:  { text: 'text-violet-400', bg: 'bg-violet-500/10', label: 'Salesforce'  },
  recordbox:   { text: 'text-emerald-400',bg: 'bg-emerald-500/10',label: 'RecordBox'   },
};

const STATUS_CONFIG = {
  pending:         { label: 'Pending',   variant: 'secondary', progress: 5  },
  fetching:        { label: 'Fetching',  variant: 'default',   progress: 35 },
  salesforce_done: { label: 'Receiving', variant: 'default',   progress: 55 },
  recordbox_done:  { label: 'Receiving', variant: 'default',   progress: 70 },
  merging:         { label: 'Merging',   variant: 'warning',   progress: 85 },
  complete:        { label: 'Complete',  variant: 'success',   progress: 100 },
};

export default function PathfinderPage() {
  const [processes, setProcesses] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetchProcesses = useCallback(async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      setProcesses(data.processes || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 600);
    return () => clearInterval(interval);
  }, [fetchProcesses]);

  // Auto-select latest active process
  useEffect(() => {
    const active = processes.find(p => p.status !== 'complete');
    if (active) setSelected(active.id);
    else if (processes.length && !selected) setSelected(processes[0].id);
  }, [processes]);

  const selectedProc = processes.find(p => p.id === selected);
  const active  = processes.filter(p => p.status !== 'complete');
  const done    = processes.filter(p => p.status === 'complete');
  const avgTime = done.length
    ? Math.round(done.reduce((s, p) => s + ((p.completedAt || p.createdAt) - p.createdAt), 0) / done.length / 1000)
    : null;

  return (
    <div className="min-h-screen px-6 py-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
          <Server size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Pathfinder</h1>
          <p className="text-slate-500 text-sm">Data Integration Hub — MSS Import Orchestrator</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {active.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <Loader2 size={12} className="text-blue-400 animate-spin" />
              <span className="text-blue-300 font-medium">{active.length} active</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full dot-online" />
            ONLINE
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Activity}    label="Total Requests" value={processes.length}  color="blue"  />
        <StatCard icon={Loader2}     label="Active"         value={active.length}     color="blue"  spin={active.length > 0} />
        <StatCard icon={CheckCircle2}label="Completed"      value={done.length}       color="green" />
        <StatCard icon={Clock}       label="Avg Time"       value={avgTime ? `${avgTime}s` : '—'} color="amber" />
      </div>

      {/* Source status */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <SourceCard
          icon={Cloud}
          label="Salesforce API"
          description="Contract & facility records (file1.xlsx)"
          color="violet"
          active={active.some(p => p.status === 'fetching' || p.status === 'salesforce_done')}
        />
        <SourceCard
          icon={Database}
          label="RecordBox Storage"
          description="Meter readings & energy data (file2.xlsx)"
          color="emerald"
          active={active.some(p => p.status === 'fetching' || p.status === 'recordbox_done')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Process list */}
        <div className="xl:col-span-1">
          <div className="rounded-xl overflow-hidden"
            style={{ background: '#0a0a1e', border: '1px solid rgba(59,130,246,0.12)' }}>
            <div className="px-5 py-4 border-b border-blue-900/20 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Layers size={15} className="text-blue-400" />
                Request Queue
              </span>
              <span className="text-xs text-slate-600 font-mono">{processes.length} total</span>
            </div>

            {processes.length === 0 ? (
              <div className="py-12 text-center text-slate-600 text-sm">
                <Server size={28} className="mx-auto mb-3 opacity-30" />
                No requests yet
              </div>
            ) : (
              <div className="divide-y divide-blue-900/10 max-h-[460px] overflow-y-auto">
                {processes.map(p => {
                  const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                  const isSelected = selected === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p.id)}
                      className={`w-full text-left px-5 py-3.5 transition-all duration-150 hover:bg-white/[0.03]
                        ${isSelected ? 'bg-blue-950/30 border-l-2 border-blue-400' : 'border-l-2 border-transparent'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white truncate mr-2">{p.facilityName}</span>
                        <Badge variant={cfg.variant} className="flex-none text-xs">{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 font-mono">{p.id.slice(0, 8)}…</span>
                        <span className="text-xs text-slate-600">
                          {new Date(p.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-2 h-0.5 rounded-full bg-blue-950 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${cfg.progress}%`,
                            background: p.status === 'complete'
                              ? '#22c55e'
                              : 'linear-gradient(90deg,#1d4ed8,#3b82f6)',
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail view */}
        <div className="xl:col-span-2">
          {selectedProc ? (
            <ProcessDetail proc={selectedProc} />
          ) : (
            <div className="flex items-center justify-center h-64 rounded-xl text-slate-600"
              style={{ background: '#0a0a1e', border: '1px dashed rgba(59,130,246,0.12)' }}>
              <div className="text-center">
                <Activity size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a request to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProcessDetail({ proc }) {
  const cfg = STATUS_CONFIG[proc.status] || STATUS_CONFIG.pending;

  return (
    <div className="space-y-5">
      {/* Header card */}
      <Card className={proc.status !== 'complete' ? 'scan-overlay' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <CardTitle>{proc.facilityName}</CardTitle>
                <CardDescription className="font-mono">{proc.id}</CardDescription>
              </div>
            </div>
            <Badge variant={cfg.variant} className="text-sm px-3 py-1">{cfg.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-xs mb-4">
            <div>
              <div className="text-slate-500 mb-0.5">Started</div>
              <div className="text-slate-300">{new Date(proc.createdAt).toLocaleTimeString()}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-0.5">Duration</div>
              <div className="text-slate-300">
                {proc.completedAt
                  ? `${((proc.completedAt - proc.createdAt) / 1000).toFixed(1)}s`
                  : `${((Date.now() - proc.createdAt) / 1000).toFixed(0)}s…`}
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-0.5">Records</div>
              <div className="text-slate-300">
                {proc.mergedData ? `${proc.mergedData.length} merged` : '—'}
              </div>
            </div>
          </div>

          <div className="h-2 rounded-full bg-blue-950 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${cfg.progress}%`,
                background: proc.status === 'complete'
                  ? 'linear-gradient(90deg,#16a34a,#22c55e)'
                  : 'linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)',
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" />
            Processing Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {proc.steps.map((step, i) => {
              const src = SOURCE_COLOR[step.source] || SOURCE_COLOR.pathfinder;
              const elapsed = ((step.timestamp - proc.createdAt) / 1000).toFixed(2);
              return (
                <div key={step.id} className="log-entry flex items-start gap-3"
                  style={{ animationDelay: `${i * 30}ms` }}>
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center flex-none mt-0.5">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 ${step.id === 7 ? 'border-green-400 bg-green-400' : 'border-blue-500 bg-blue-950'}`} />
                    {i < proc.steps.length - 1 && (
                      <div className="w-px flex-1 min-h-[16px] bg-blue-900/40 mt-1" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-medium uppercase tracking-wide ${src.text}`}>
                        {src.label}
                      </span>
                      <span className="text-xs text-slate-600 font-mono ml-auto">+{elapsed}s</span>
                    </div>
                    <p className="text-sm text-slate-300">{step.message}</p>
                  </div>
                </div>
              );
            })}

            {proc.status !== 'complete' && (
              <div className="flex items-center gap-3 opacity-60">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-blue-500/40 flex-none" />
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Loader2 size={12} className="animate-spin text-blue-500/40" />
                  Awaiting next step…
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data preview */}
      {proc.mergedData && proc.mergedData.length > 0 && (
        <Card className="glow-card-active">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              Merged Output — {proc.mergedData.length} records
            </CardTitle>
            <CardDescription>Ready for delivery to Enerkey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(59,130,246,0.12)' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'rgba(59,130,246,0.08)' }}>
                    {['Contract ID', 'Energy Type', 'Supplier', 'Meter ID', 'Reading', 'Unit', 'Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proc.mergedData.map((row, i) => (
                    <tr key={i} className="border-t border-blue-900/15 hover:bg-white/[0.015]">
                      <td className="px-3 py-1.5 text-slate-300 font-mono">{row.contractId}</td>
                      <td className="px-3 py-1.5 text-slate-400">{row.energyType}</td>
                      <td className="px-3 py-1.5 text-slate-400">{row.supplier}</td>
                      <td className="px-3 py-1.5 text-slate-400 font-mono">{row.meterId}</td>
                      <td className="px-3 py-1.5 text-white font-medium">{row.reading.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-slate-500">{row.unit}</td>
                      <td className="px-3 py-1.5">
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
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, spin = false }) {
  const colors = {
    blue:  { bg: 'bg-blue-950/60',  icon: 'text-blue-400',  val: 'text-blue-100' },
    green: { bg: 'bg-green-950/60', icon: 'text-green-400', val: 'text-green-100' },
    amber: { bg: 'bg-amber-950/60', icon: 'text-amber-400', val: 'text-amber-100' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="rounded-xl p-5 flex items-center gap-4"
      style={{ background: '#0a0a1e', border: '1px solid rgba(59,130,246,0.1)' }}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg}`}>
        <Icon size={18} className={`${c.icon} ${spin ? 'animate-spin' : ''}`} />
      </div>
      <div>
        <div className={`text-2xl font-bold ${c.val}`}>{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function SourceCard({ icon: Icon, label, description, color, active }) {
  const colors = {
    violet:  { ring: 'rgba(139,92,246,0.5)', glow: 'rgba(139,92,246,0.2)', text: 'text-violet-400',  bg: 'bg-violet-600' },
    emerald: { ring: 'rgba(52,211,153,0.5)', glow: 'rgba(52,211,153,0.2)', text: 'text-emerald-400', bg: 'bg-emerald-600' },
  };
  const c = colors[color] || colors.violet;

  return (
    <div className="rounded-xl p-5 flex items-center gap-4 transition-all duration-300"
      style={{
        background: '#0a0a1e',
        border: `1px solid ${active ? c.ring : 'rgba(59,130,246,0.1)'}`,
        boxShadow: active ? `0 0 20px ${c.glow}` : 'none',
      }}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-none ${c.bg}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{label}</span>
          {active && <Loader2 size={12} className={`${c.text} animate-spin`} />}
        </div>
        <p className="text-xs text-slate-500 truncate">{description}</p>
      </div>
      <Badge variant={active ? 'default' : 'success'} className="flex-none">
        {active ? 'Querying' : 'Online'}
      </Badge>
    </div>
  );
}
