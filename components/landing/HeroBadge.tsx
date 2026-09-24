'use client';

import React from 'react';
import { motion } from 'motion/react';
import { SparklesIcon } from '@/components/ui/icons';

export const HeroBadge: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-white/90 dark:bg-zinc-900/90 px-3.5 py-1 text-xs font-semibold shadow-xs backdrop-blur-md"
    >
      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
      <span className="flex h-2 w-2 rounded-full bg-emerald-500 -ml-4" />
      <span className="text-zinc-800 dark:text-zinc-200">
        Next-Gen Autonomous Web Agents
      </span>
      <SparklesIcon className="h-3.5 w-3.5 text-amber-500 ml-0.5" />
    </motion.div>
  );
};
