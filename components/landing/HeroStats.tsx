'use client';

import React from 'react';
import { motion } from 'motion/react';

const stats = [
  { label: 'Cloud Execution', value: '<48ms Latency', color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Captcha Bypass', value: '99.8% Success', color: 'text-cyan-600 dark:text-cyan-400' },
  { label: 'Context Engine', value: 'Persistent CDP', color: 'text-violet-600 dark:text-violet-400' },
];

export const HeroStats: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="mt-8 flex flex-wrap items-center gap-6 border-t border-zinc-200/60 dark:border-zinc-800 pt-5 text-xs text-zinc-500"
    >
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col">
          <span className="font-mono text-[10px] uppercase text-zinc-400">{s.label}</span>
          <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
        </div>
      ))}
    </motion.div>
  );
};
