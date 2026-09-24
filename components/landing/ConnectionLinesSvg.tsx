'use client';

import React from 'react';
import { motion } from 'motion/react';

export const ConnectionLinesSvg: React.FC = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.45 }}
      transition={{ duration: 0.3, delay: 0.28, ease: 'easeOut' }}
      className="absolute inset-0 h-full w-full pointer-events-none"
    >
      <motion.line
        x1="12%" y1="20%" x2="54%" y2="16%"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6"
        className="text-emerald-500"
        animate={{ strokeDashoffset: [0, -40] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      <motion.line
        x1="54%" y1="16%" x2="74%" y2="40%"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6"
        className="text-cyan-500"
        animate={{ strokeDashoffset: [0, -40] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
      />
      <motion.line
        x1="74%" y1="40%" x2="78%" y2="72%"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6"
        className="text-violet-500"
        animate={{ strokeDashoffset: [0, 40] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
      />
      <motion.line
        x1="18%" y1="60%" x2="50%" y2="76%"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6"
        className="text-amber-500"
        animate={{ strokeDashoffset: [0, -40] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
      <motion.line
        x1="50%" y1="76%" x2="78%" y2="72%"
        stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6"
        className="text-indigo-500"
        animate={{ strokeDashoffset: [0, -40] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
    </motion.svg>
  );
};
