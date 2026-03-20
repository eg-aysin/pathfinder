'use client';
import { useState, useEffect } from 'react';
import { Cloud, Shield, Database, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SalesforcePage() {
  const [log, setLog] = useState([]);
  const [status, setStatus] = useState('online');

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/salesforce');
        const data = await res.json();
        setLog(data.log || []);
        setStatus(data.status);
      } catch {}
    };
    fetch_();
    const interval = setInterval(fetch_, 1000);
    return () => clearInterval(interval);
  }, []);

  const processing = log.filter(l => l.status === 'processing');

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-600">
          <Cloud size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Salesforce</h1>
          <p className="text-slate-500 text-sm">Blackbox API Gateway</p>
        </div>
        <div className="ml-auto">
          <Badge variant="success" className="text-sm px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 inline-block" />
            Online
          </Badge>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Served',   value: log.length,           icon: Database },
          { label: 'Active',         value: processing.length,    icon: Loader2, spin: processing.length > 0 },
          { label: 'Endpoint',       value: 'REST v58',           icon: Shield },
        ].map(({ label, value, icon: Icon, spin }) => (
          <div key={label} className="rounded-xl p-4 text-center"
            style={{ background: '#0a0a1e', border: '1px solid rgba(139,92,246,0.15)' }}>
            <Icon size={16} className={`text-violet-400 mx-auto mb-2 ${spin ? 'animate-spin' : ''}`} />
            <div className="text-lg font-bold text-white">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Blackbox notice */}
      <div className="rounded-xl p-4 mb-6 flex items-start gap-3"
        style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <Shield size={16} className="text-violet-400 mt-0.5 flex-none" />
        <div>
          <p className="text-xs font-semibold text-violet-300 mb-0.5">Blackbox Service</p>
          <p className="text-xs text-slate-500">
            Internal implementation hidden from Enerkey. Pathfinder communicates with this service to retrieve
            facility contracts and energy supplier data (file1.xlsx).
          </p>
        </div>
      </div>

      {/* Request log */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: '#0a0a1e', border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="px-5 py-3.5 border-b border-violet-900/20 flex items-center gap-2">
          <Clock size={14} className="text-violet-400" />
          <span className="text-sm font-medium text-slate-300">Incoming Requests from Pathfinder</span>
        </div>

        {log.length === 0 ? (
          <div className="py-12 text-center text-slate-600 text-sm">
            <Cloud size={28} className="mx-auto mb-3 opacity-30" />
            No requests yet
          </div>
        ) : (
          <div className="divide-y divide-violet-900/10">
            {log.map((entry, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3 log-entry">
                {entry.status === 'processing' ? (
                  <Loader2 size={14} className="text-violet-400 animate-spin flex-none" />
                ) : (
                  <CheckCircle size={14} className="text-green-400 flex-none" />
                )}
                <div className="flex-1">
                  <span className="text-sm text-slate-300">{entry.facilityName}</span>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {new Date(entry.timestamp).toLocaleTimeString()} — Contracts + supplier data
                  </div>
                </div>
                <Badge variant={entry.status === 'processing' ? 'default' : 'success'}>
                  {entry.status === 'processing' ? 'Processing' : 'Served'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mock data preview */}
      <div className="mt-6 rounded-xl overflow-hidden"
        style={{ background: '#0a0a1e', border: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="px-5 py-3.5 border-b border-violet-900/20">
          <span className="text-sm font-medium text-slate-300">Mock Response Schema</span>
          <span className="text-xs text-slate-600 ml-2">(file1.xlsx format)</span>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(139,92,246,0.1)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(139,92,246,0.08)' }}>
                  {['Facility name', 'Sales Items ID', 'Sales item display name', 'Start date', 'Currency', 'Qty', 'Rate'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-violet-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['AsOy Kotikontu 10',       'SalesItem-2001', 'EMS Efficient package',     '1/1/2026', 'EUR', '1', '15'],
                  ['AsOy Kotikontu 10',       'SalesItem-2002', 'EMS Basic package',          '1/1/2026', 'EUR', '2', '10'],
                  ['Green Valley Apartments', 'SalesItem-2001', 'EMS Efficient package',     '2/1/2026', 'USD', '1', '16'],
                  ['Green Valley Apartments', 'SalesItem-2002', 'EMS Basic package',          '2/1/2026', 'USD', '2', '11'],
                ].map((row, i) => (
                  <tr key={i} className="border-t border-violet-900/15">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 text-slate-400 font-mono whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
