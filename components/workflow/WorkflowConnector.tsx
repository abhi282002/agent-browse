"use client";

import React from "react";
import { motion } from "motion/react";

interface WorkflowConnectorProps {
  isActive: boolean;
  isCompleted: boolean;
}

export function WorkflowConnector({ isActive, isCompleted }: WorkflowConnectorProps) {
  return (
    <div className="relative flex flex-col items-center justify-center my-1">
      {/* Background connector track */}
      <div className="h-6 w-[2px] bg-zinc-200 relative overflow-hidden">
        {/* Fill progress if completed */}
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isCompleted ? "bg-zinc-800" : "bg-transparent"
          }`}
        />

        {/* Traveling laser beam when active */}
        {isActive && (
          <motion.div
            className="absolute left-0 right-0 h-3 bg-gradient-to-b from-transparent via-emerald-500 to-transparent shadow-[0_0_8px_rgba(16,185,129,0.9)]"
            initial={{ top: "-100%" }}
            animate={{ top: "100%" }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
      </div>

      {/* Center connector dot */}
      <div
        className={`h-2 w-2 rounded-full border transition-all duration-300 ${
          isCompleted
            ? "border-zinc-800 bg-zinc-800"
            : isActive
            ? "border-emerald-500 bg-emerald-500 ring-2 ring-emerald-100"
            : "border-zinc-300 bg-zinc-200"
        }`}
      />

      {/* Lower track */}
      <div className="h-6 w-[2px] bg-zinc-200 relative overflow-hidden">
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isCompleted ? "bg-zinc-800" : "bg-transparent"
          }`}
        />
        {isActive && (
          <motion.div
            className="absolute left-0 right-0 h-3 bg-gradient-to-b from-transparent via-emerald-500 to-transparent shadow-[0_0_8px_rgba(16,185,129,0.9)]"
            initial={{ top: "-100%" }}
            animate={{ top: "100%" }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "linear",
              delay: 0.45,
            }}
          />
        )}
      </div>
    </div>
  );
}
