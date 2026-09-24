import type { NodeCoordinate } from './types';

export const nodeColorStyles: Record<
  NodeCoordinate['color'],
  { dot: string; border: string }
> = {
  emerald: { dot: 'bg-emerald-500', border: 'border-emerald-500/40 shadow-emerald-500/10' },
  cyan: { dot: 'bg-cyan-500', border: 'border-cyan-500/40 shadow-cyan-500/10' },
  violet: { dot: 'bg-violet-500', border: 'border-violet-500/40 shadow-violet-500/10' },
  amber: { dot: 'bg-amber-500', border: 'border-amber-500/40 shadow-amber-500/10' },
  indigo: { dot: 'bg-indigo-500', border: 'border-indigo-500/40 shadow-indigo-500/10' },
  fuchsia: { dot: 'bg-fuchsia-500', border: 'border-fuchsia-500/40 shadow-fuchsia-500/10' },
};
