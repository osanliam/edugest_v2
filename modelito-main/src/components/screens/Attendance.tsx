/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlassCard } from '../shared/GlassCard';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const attendanceData = [
  { week: 'Week 1', present: 18, absent: 2, late: 1 },
  { week: 'Week 2', present: 19, absent: 1, late: 0 },
  { week: 'Week 3', present: 20, absent: 0, late: 0 },
  { week: 'Week 4', present: 18, absent: 1, late: 1 },
];

export function Attendance() {
  const totalPresent = attendanceData.reduce((sum, w) => sum + w.present, 0);
  const totalAbsent = attendanceData.reduce((sum, w) => sum + w.absent, 0);
  const attendance = ((totalPresent / (totalPresent + totalAbsent)) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <GlassCard title="Attendance Rate" icon={<CheckCircle className="w-4 h-4" />}>
        <div className="text-4xl font-bold neon-text-cyan mt-4">{attendance}%</div>
        <p className="text-xs text-gray-500 mt-2">{totalPresent} present</p>
      </GlassCard>

      <GlassCard title="Absences" icon={<XCircle className="w-4 h-4" />}>
        <div className="text-4xl font-bold text-red-400 mt-4">{totalAbsent}</div>
        <p className="text-xs text-gray-500 mt-2">This month</p>
      </GlassCard>

      <GlassCard title="Late Arrivals" icon={<Clock className="w-4 h-4" />}>
        <div className="text-4xl font-bold text-cyber-orange mt-4">2</div>
        <p className="text-xs text-gray-500 mt-2">This month</p>
      </GlassCard>

      <GlassCard title="Weekly Summary" className="md:col-span-3">
        <div className="space-y-2">
          {attendanceData.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm p-2">
              <span className="text-gray-400">{item.week}</span>
              <div className="flex items-center gap-4">
                <span className="text-green-400">✓ {item.present}</span>
                <span className="text-red-400">✕ {item.absent}</span>
                <span className="text-cyber-orange">⏰ {item.late}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
