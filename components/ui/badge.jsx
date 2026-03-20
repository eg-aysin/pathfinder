import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:   'bg-blue-600/20 text-blue-300 border border-blue-500/30',
        secondary: 'bg-white/5 text-slate-400 border border-white/10',
        success:   'bg-green-600/20 text-green-300 border border-green-500/30',
        warning:   'bg-amber-600/20 text-amber-300 border border-amber-500/30',
        danger:    'bg-red-600/20 text-red-300 border border-red-500/30',
        purple:    'bg-purple-600/20 text-purple-300 border border-purple-500/30',
        cyan:      'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
