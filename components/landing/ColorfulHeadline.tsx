'use client';

import React from 'react';
import { motion } from 'motion/react';

export const ColorfulHeadline: React.FC = () => {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.04 }}
      className="text-2xl sm:text-3xl lg:text-[30px] font-extrabold tracking-tight text-neutral-800 dark:text-white leading-snug"
    >
      <span>Empower AI with </span>
      <motion.span
        className="inline-block bg-gradient-to-r from-emerald-500 via-teal-400 via-cyan-500 via-violet-500 to-fuchsia-500 bg-[length:300%_auto] bg-clip-text text-transparent font-black"
        animate={{ backgroundPosition: ['0% center', '100% center', '0% center'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        Autonomous Eyes
      </motion.span>
      <br />
      <span>& Hands for the </span>
      <span className="relative inline-block text-neutral-800 dark:text-white underline decoration-emerald-500/60 decoration-wavy decoration-2">
        Modern Web
      </span>
    </motion.h1>
  );
};
