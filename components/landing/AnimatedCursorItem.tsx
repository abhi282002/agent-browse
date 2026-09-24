'use client';

import React from 'react';
import { motion } from 'motion/react';
import { CursorPointerSvg } from './CursorPointerSvg';
import type { CursorTarget } from './types';

export const AnimatedCursorItem: React.FC<{ cursor: CursorTarget; initialDelay?: number }> = ({
  cursor,
  initialDelay = 1.2,
}) => {
  const xValues = cursor.path.map((p) => p.x);
  const yValues = cursor.path.map((p) => p.y);
  const totalDuration = cursor.path.reduce((acc, p) => acc + p.duration, 0);

  return (
    <motion.div
      className="absolute z-20 pointer-events-none flex items-start gap-1"
      initial={{ left: cursor.path[0].x, top: cursor.path[0].y, opacity: 0 }}
      animate={{ left: xValues, top: yValues, opacity: 1 }}
      transition={{
        left: { duration: totalDuration, repeat: Infinity, ease: 'easeInOut', delay: initialDelay },
        top: { duration: totalDuration, repeat: Infinity, ease: 'easeInOut', delay: initialDelay },
        opacity: { duration: 0.5, delay: initialDelay, ease: 'easeOut' },
      }}
    >
      <motion.div
        animate={{ scale: [1, 0.75, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: initialDelay }}
        className="relative"
      >
        <CursorPointerSvg color={cursor.color} />
        <motion.span
          className="absolute -top-1 -left-1 h-7 w-7 rounded-full border-2 border-white pointer-events-none"
          style={{ backgroundColor: cursor.color }}
          animate={{ scale: [0.5, 2.5], opacity: [0.8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: initialDelay }}
        />
      </motion.div>
      <span
        className={`rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-md ${cursor.badgeBg}`}
      >
        {cursor.name}
      </span>
    </motion.div>
  );
};
