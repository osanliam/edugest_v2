/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlassCard } from '../shared/GlassCard';
import { FileText, Download, BarChart3 } from 'lucide-react';

const reports = [
  { name: 'Enrollment Analysis', type: 'PDF', size: '2.4 MB', date: '2024-04-15' },
  { name: 'Performance Review', type: 'Excel', size: '1.1 MB', date: '2024-04-14' },
  { name: 'Financial Summary', type: 'PDF', size: '3.7 MB', date: '2024-04-10' },
  { name: 'Curriculum Audit', type: 'Word', size: '890 KB', date: '2024-04-08' },
];

export function Reports() {
  return (
    <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <GlassCard title="Available Reports" icon={<BarChart3 className="w-4 h-4" />}>
        <div className="space-y-3">
          {reports.map((report, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-cyber-border/40 hover:border-cyber-cyan/50 transition-all group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-cyber-cyan shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{report.name}</p>
                  <p className="text-xs text-gray-500">{report.type} • {report.size} • {report.date}</p>
                </div>
              </div>
              <button className="ml-4 p-2 hover:bg-cyber-cyan/20 rounded transition-all">
                <Download className="w-4 h-4 text-cyber-cyan" />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
