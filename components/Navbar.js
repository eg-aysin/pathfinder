'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Zap, Database, Cloud, Server } from 'lucide-react';

const links = [
  { href: '/',            label: 'Overview',    icon: Activity },
  { href: '/pathfinder',  label: 'Pathfinder',  icon: Server,   primary: true },
  { href: '/enerkey',     label: 'Enerkey',     icon: Zap },
  { href: '/salesforce',  label: 'Salesforce',  icon: Cloud },
  { href: '/recordbox',   label: 'RecordBox',   icon: Database },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6"
      style={{
        background: 'rgba(4,4,14,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(59,130,246,0.12)',
      }}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mr-10 group">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
          <div className="w-3 h-3 rounded-sm bg-white opacity-90" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">
          Path<span className="text-blue-400">finder</span>
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {links.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${active
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
                ${primary && !active ? 'text-blue-400 hover:text-blue-300' : ''}`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Right side — live indicator */}
      <div className="ml-auto flex items-center gap-2">
        <span className="w-2 h-2 rounded-full dot-online animate-pulse" />
        <span className="text-xs text-slate-500 font-mono">LIVE</span>
      </div>
    </nav>
  );
}
