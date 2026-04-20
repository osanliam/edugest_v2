import { motion } from 'motion/react';
import React from 'react';

interface DataGridProps {
  headers: string[];
  rows: (string | number)[][];
  animated?: boolean;
}

export default function DataGrid({ headers, rows, animated = true }: DataGridProps) {
  return (
    <motion.div
      initial={animated ? { opacity: 0 } : {}}
      animate={animated ? { opacity: 1 } : {}}
      className="overflow-hidden rounded-xl border border-cyan-400/40 bg-gradient-to-b from-cyan-950/50 to-cyan-900/30 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="grid gap-4 border-b border-cyan-400/40 bg-gradient-to-r from-cyan-900/60 to-cyan-950/40 p-4">
        {headers.map((header, i) => (
          <motion.div
            key={i}
            initial={animated ? { opacity: 0, x: -20 } : {}}
            animate={animated ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.05 }}
            className="text-sm font-bold uppercase tracking-widest text-cyan-200"
          >
            {header}
          </motion.div>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-0.5 p-4">
        {rows.map((row, rowIdx) => (
          <motion.div
            key={rowIdx}
            initial={animated ? { opacity: 0, x: -20 } : {}}
            animate={animated ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 + rowIdx * 0.05 }}
            className="grid gap-4 border-l-2 border-cyan-400/40 bg-gradient-to-r from-cyan-900/30 to-cyan-950/20 p-4 hover:bg-gradient-to-r hover:from-cyan-900/50 hover:to-cyan-900/30 transition-all duration-300"
          >
            {row.map((cell, cellIdx) => (
              <div key={cellIdx} className="text-sm text-white font-medium">
                {cell}
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
