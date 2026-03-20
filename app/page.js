'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Server, Cloud, Database, Activity, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Which connections are active per status
const ACTIVE_MAP = {
  pending:         [],
  fetching:        ['enerkey-pf', 'pf-sf', 'pf-rb'],
  salesforce_done: ['enerkey-pf', 'pf-sf', 'sf-pf'],
  recordbox_done:  ['enerkey-pf', 'pf-sf', 'pf-rb', 'sf-pf', 'rb-pf'],
  merging:         ['enerkey-pf', 'sf-pf', 'rb-pf'],
  complete:        ['pf-enerkey'],
};

const ACTIVE_BOXES = {
  pending:         ['enerkey', 'pathfinder'],
  fetching:        ['pathfinder', 'salesforce', 'recordbox'],
  salesforce_done: ['pathfinder', 'salesforce'],
  recordbox_done:  ['pathfinder', 'salesforce', 'recordbox'],
  merging:         ['pathfinder'],
  complete:        ['enerkey', 'pathfinder'],
};

const STATUS_LABEL = {
  pending:         'Request received',
  fetching:        'Fetching from sources',
  salesforce_done: 'Salesforce data ready',
  recordbox_done:  'All source data ready',
  merging:         'Merging datasets',
  complete:        'Import complete!',
};

function FlowArrow({ id, active, reverse = false }) {
  return (
    <div className={`h-0.5 w-full transition-all duration-300 ${active ? 'opacity-100' : 'opacity-20'}`}>
      <div
        className="h-full w-full"
        style={{
          backgroundImage: active
            ? 'linear-gradient(90deg, transparent, #3b82f6 40%, #60a5fa 60%, #3b82f6 80%, transparent)'
            : 'none',
          backgroundColor: active ? 'transparent' : '#1e3a5f',
          backgroundSize: active ? '200% 100%' : 'auto',
          animation: active ? (reverse ? 'flowRight 1s linear infinite reverse' : 'flowRight 1s linear infinite') : 'none',
        }}
      />
    </div>
  );
}

function SystemBox({ id, label, icon: Icon, color, active, href, description, badge }) {
  return (
    <Link href={href} className="block">
      <div
        className={`rounded-xl p-5 border cursor-pointer transition-all duration-300 select-none
          ${active
            ? 'border-blue-400/60 bg-blue-950/40'
            : 'border-blue-900/30 bg-[#0a0a1e]'}
        `}
        style={active ? { boxShadow: '0 0 24px rgba(59,130,246,0.4)' } : {}}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{label}</div>
            {badge && <Badge variant="secondary" className="text-xs mt-0.5">{badge}</Badge>}
          </div>
          {active && <div className="ml-auto w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
        </div>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

export default function OverviewPage() {
  const [processes, setProcesses] = useState([]);
  const [latestStatus, setLatestStatus] = useState(null);
  const announcedId = useRef(null);

  const fetchProcesses = useCallback(async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      setProcesses(data.processes || []);
      const latest = data.processes?.[0];
      if (!latest) return;

      if (latest.status !== 'complete') {
        // Active process — always show current status
        announcedId.current = null;
        setLatestStatus(latest.status);
      } else if (latest.id !== announcedId.current) {
        // Just completed — show banner once, then clear
        announcedId.current = latest.id;
        setLatestStatus('complete');
        setTimeout(() => setLatestStatus(null), 3000);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 600);
    return () => clearInterval(interval);
  }, [fetchProcesses]);

  const active = ACTIVE_MAP[latestStatus] || [];
  const activeBoxes = ACTIVE_BOXES[latestStatus] || [];
  const isFlowing = latestStatus && latestStatus !== 'complete';

  const activeProcess = processes[0];

  return (
    <div className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-mono text-blue-400"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <Activity size={12} />
          SYSTEM ARCHITECTURE
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">
          <span className="gradient-text">Pathfinder</span> Integration Flow
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Real-time MSS import pipeline — aggregating Salesforce contracts & RecordBox meter data.
        </p>
      </div>

      {/* Live Status Banner */}
      {latestStatus && (
        <div className="mb-8 flex items-center justify-center">
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-full text-sm font-medium"
            style={{
              background: latestStatus === 'complete'
                ? 'rgba(34,197,94,0.15)'
                : 'rgba(59,130,246,0.15)',
              border: latestStatus === 'complete'
                ? '1px solid rgba(34,197,94,0.3)'
                : '1px solid rgba(59,130,246,0.3)',
              color: latestStatus === 'complete' ? '#86efac' : '#93c5fd',
            }}
          >
            {latestStatus === 'complete' ? (
              <CheckCircle2 size={16} />
            ) : (
              <Loader2 size={16} className="animate-spin" />
            )}
            <span className="font-mono">
              {activeProcess?.facilityName && `[${activeProcess.facilityName}]`} {STATUS_LABEL[latestStatus]}
            </span>
          </div>
        </div>
      )}

      {/* Flow Diagram */}
      <div className="mb-10 rounded-2xl p-8"
        style={{ background: '#070712', border: '1px solid rgba(59,130,246,0.1)' }}>

        <div className="flex items-center gap-4">
          {/* Enerkey */}
          <div className="flex-none w-44">
            <SystemBox
              id="enerkey"
              label="Enerkey"
              icon={Zap}
              color="bg-amber-600"
              active={activeBoxes.includes('enerkey')}
              href="/enerkey"
              description="Energy management platform — initiates MSS imports"
              badge="Client"
            />
          </div>

          {/* Enerkey ↔ Pathfinder arrows */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <FlowArrow id="enerkey-pf" active={active.includes('enerkey-pf')} />
              <ArrowRight size={14} className={active.includes('enerkey-pf') ? 'text-blue-400' : 'text-slate-700'} />
            </div>
            <div className="flex items-center gap-1">
              <ArrowRight size={14} className={`rotate-180 ${active.includes('pf-enerkey') ? 'text-blue-400' : 'text-slate-700'}`} />
              <FlowArrow id="pf-enerkey" active={active.includes('pf-enerkey')} reverse />
            </div>
          </div>

          {/* Pathfinder (center, prominent) */}
          <div className="flex-none w-52">
            <Link href="/pathfinder">
              <div
                className="rounded-xl p-5 border transition-all duration-300 cursor-pointer"
                style={{
                  background: activeBoxes.includes('pathfinder')
                    ? 'linear-gradient(135deg,rgba(29,78,216,0.3),rgba(59,130,246,0.2))'
                    : 'linear-gradient(135deg,rgba(15,23,42,0.9),rgba(10,10,30,0.9))',
                  borderColor: activeBoxes.includes('pathfinder') ? 'rgba(59,130,246,0.7)' : 'rgba(59,130,246,0.25)',
                  boxShadow: activeBoxes.includes('pathfinder')
                    ? '0 0 40px rgba(59,130,246,0.35), inset 0 0 20px rgba(59,130,246,0.05)'
                    : '0 0 0 transparent',
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
                    <Server size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">PATHFINDER</div>
                    <Badge variant="default" className="text-xs mt-0.5">Integration Hub</Badge>
                  </div>
                  {activeBoxes.includes('pathfinder') && (
                    <div className="ml-auto flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400">Orchestrates data from multiple sources & delivers merged output</p>
              </div>
            </Link>
          </div>

          {/* Pathfinder ↔ Blackboxes */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Top: Salesforce */}
            <div className="flex items-center gap-1">
              <FlowArrow id="pf-sf" active={active.includes('pf-sf')} />
              <ArrowRight size={14} className={active.includes('pf-sf') ? 'text-blue-400' : 'text-slate-700'} />
              <ArrowRight size={14} className={`rotate-180 ${active.includes('sf-pf') ? 'text-blue-400' : 'text-slate-700'}`} />
              <FlowArrow id="sf-pf" active={active.includes('sf-pf')} reverse />
            </div>
            {/* Bottom: RecordBox */}
            <div className="flex items-center gap-1">
              <FlowArrow id="pf-rb" active={active.includes('pf-rb')} />
              <ArrowRight size={14} className={active.includes('pf-rb') ? 'text-blue-400' : 'text-slate-700'} />
              <ArrowRight size={14} className={`rotate-180 ${active.includes('rb-pf') ? 'text-blue-400' : 'text-slate-700'}`} />
              <FlowArrow id="rb-pf" active={active.includes('rb-pf')} reverse />
            </div>
          </div>

          {/* Blackboxes */}
          <div className="flex-none w-44 flex flex-col gap-4">
            <SystemBox
              id="salesforce"
              label="Salesforce"
              icon={Cloud}
              color="bg-violet-600"
              active={activeBoxes.includes('salesforce')}
              href="/salesforce"
              description="Contract & facility data source"
              badge="file1.xlsx"
            />
            <SystemBox
              id="recordbox"
              label="RecordBox"
              icon={Database}
              color="bg-emerald-600"
              active={activeBoxes.includes('recordbox')}
              href="/recordbox"
              description="Meter readings & energy data"
              badge="file2.xlsx"
            />
          </div>
        </div>

        {/* Output label */}
        {latestStatus === 'complete' && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}>
              <CheckCircle2 size={15} />
              output.xlsx — Merged dataset delivered to Enerkey
            </div>
          </div>
        )}
      </div>

      {/* Stats + Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard label="Total Imports" value={processes.length} icon={Activity} />
        <StatCard
          label="Completed"
          value={processes.filter(p => p.status === 'complete').length}
          icon={CheckCircle2}
          color="text-green-400"
        />
        <StatCard
          label="Active"
          value={processes.filter(p => p.status !== 'complete').length}
          icon={Loader2}
          color="text-blue-400"
          spin={processes.some(p => p.status !== 'complete')}
        />
      </div>

      {/* Recent Processes */}
      {processes.length > 0 && (
        <div className="rounded-xl overflow-hidden"
          style={{ background: '#0a0a1e', border: '1px solid rgba(59,130,246,0.12)' }}>
          <div className="px-6 py-4 border-b border-blue-900/20 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">Recent Import Requests</span>
            <Link href="/pathfinder">
              <span className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                View in Pathfinder →
              </span>
            </Link>
          </div>
          <div className="divide-y divide-blue-900/10">
            {processes.slice(0, 5).map(p => (
              <div key={p.id} className="px-6 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <StatusDot status={p.status} />
                <span className="text-sm text-white font-medium">{p.facilityName}</span>
                <span className="text-xs text-slate-500 font-mono">{p.id.slice(0, 8)}…</span>
                <StatusBadge status={p.status} />
                <span className="ml-auto text-xs text-slate-600">
                  {new Date(p.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {processes.length === 0 && (
        <div className="text-center py-16 text-slate-600">
          <Activity size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">No import requests yet.</p>
          <p className="text-sm mt-1">
            Go to <Link href="/enerkey" className="text-blue-400 hover:text-blue-300">Enerkey</Link> and trigger an MSS Import.
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 flex justify-center gap-4">
        <Link href="/enerkey">
          <Button size="lg">
            <Zap size={18} />
            Open Enerkey
          </Button>
        </Link>
        <Link href="/pathfinder">
          <Button variant="outline" size="lg">
            <Server size={18} />
            Open Pathfinder
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'text-blue-400', spin = false }) {
  return (
    <div className="rounded-xl p-5 flex items-center gap-4"
      style={{ background: '#0a0a1e', border: '1px solid rgba(59,130,246,0.12)' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-950/50">
        <Icon size={18} className={`${color} ${spin ? 'animate-spin' : ''}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const color = status === 'complete' ? 'bg-green-400' : status === 'pending' ? 'bg-slate-500' : 'bg-blue-400 animate-pulse';
  return <div className={`w-2 h-2 rounded-full ${color}`} />;
}

function StatusBadge({ status }) {
  const map = {
    pending:         { label: 'Pending',   variant: 'secondary' },
    fetching:        { label: 'Fetching',  variant: 'default' },
    salesforce_done: { label: 'Receiving', variant: 'default' },
    recordbox_done:  { label: 'Receiving', variant: 'default' },
    merging:         { label: 'Merging',   variant: 'warning' },
    complete:        { label: 'Complete',  variant: 'success' },
  };
  const { label, variant } = map[status] || { label: status, variant: 'secondary' };
  return <Badge variant={variant}>{label}</Badge>;
}
