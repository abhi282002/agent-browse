'use client';

import React from 'react';
import { motion } from 'motion/react';
import { nodeColorStyles } from './nodeColorStyles';
import type { NodeCoordinate } from './types';

export const FloatingNodeItem: React.FC<{ node: NodeCoordinate }> = ({
  node,
}) => {
  const { dot, border } = nodeColorStyles[node.color];
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: node.entrance.offsetX,
        y: node.entrance.offsetY,
        scale: 0.95,
      }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: node.delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`absolute z-10 flex items-center gap-2 rounded-xl border ${border} bg-white dark:bg-zinc-900 px-3 py-1.5 shadow-md backdrop-blur-md select-none`}
      style={{ left: node.x, top: node.y }}
    >
      <span className={`h-2 w-2 rounded-full ${dot} animate-pulse`} />
      <motion.div
        initial={{ opacity: 0, x: -3 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.2,
          delay: node.delay + 0.08,
          ease: 'easeOut',
        }}
        className="flex flex-col"
      >
        <span className="text-xs font-semibold tracking-tight text-neutral-800 dark:text-neutral-200">
          {node.label}
        </span>
        <span className="text-[9px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-medium">
          {node.category}
        </span>
      </motion.div>
    </motion.div>
  );
};
