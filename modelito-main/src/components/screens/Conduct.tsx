/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlassCard } from '../shared/GlassCard';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const conductRecords = [
  { student: 'Alex Rivera', incident: 'Late submission (2 days)', date: '2024-04-10', status: 'resolved' },
  { student: 'Jordan Smith', incident: 'Classroom disruption', date: '2024-04-12', status: 'pending' },
  { student: 'Taylor Johnson', incident: 'Academic integrity review', date: '2024-04-08', status: 'resolved' },
  { student: 'Morgan Davis', incident: 'Attendance warning', date: '2024-04-14', status: 'active' },
];

export function Conduct() {
  return (
    <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <GlassCard title="Conduct Records" icon={<AlertTriangle className="w-4 h-4" />}>
        <div className="space-y-3">
          {conductRecords.map((record, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-cyber-border/40">
              {record.status === 'resolved' && <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />}
              {record.status === 'pending' && <Clock className="w-5 h-5 text-cyber-orange shrink-0 mt-0.5" />}
              {record.status === 'active' && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{record.student}</p>
                <p className="text-xs text-gray-500 mt-1">{record.incident}</p>
                <p className="text-[10px] text-gray-600 mt-1">{record.date}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
