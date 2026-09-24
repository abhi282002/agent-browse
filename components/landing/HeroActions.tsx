'use client';

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { BotIcon, TerminalIcon } from '@/components/ui/icons';

export const HeroActions: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="mt-6 flex flex-wrap items-center gap-3"
    >
      <Link href="/workflow">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 shadow-md transition-shadow hover:shadow-lg"
        >
          <BotIcon className="h-4 w-4 text-emerald-400" />
          <span>Launch AI Workflow</span>
        </motion.button>
      </Link>
      <a href="#sandbox-demo">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-xs"
        >
          <TerminalIcon className="h-4 w-4 text-zinc-500" />
          <span>Live Cloud Sandbox</span>
        </motion.button>
      </a>
    </motion.div>
  );
};
