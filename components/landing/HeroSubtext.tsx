'use client';

import React from 'react';
import { motion } from 'motion/react';

export const HeroSubtext: React.FC = () => {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 }}
      className="mt-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 max-w-xl leading-relaxed"
    >
      Provision anti-detect cloud browsers, inspect live DOM trees, bypass
      complex captchas, and execute multi-step AI web journeys with sub-second
      telemetry and zero-data-retention security.
    </motion.p>
  );
};
