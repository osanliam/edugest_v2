/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlassCard } from '../shared/GlassCard';
import { Users, UserPlus, TrendingUp, Target } from 'lucide-react';

const studentStats = [
  { label: 'Total Students', value: '1,245', icon: <Users className="w-4 h-4" /> },
  { label: 'New Enrollments', value: '42', icon: <UserPlus className="w-4 h-4" /> },
  { label: 'Avg Performance', value: '83.2%', icon: <TrendingUp className="w-4 h-4" /> },
  { label: 'Completion Rate', value: '94.5%', icon: <Target className="w-4 h-4" /> },
];

const topStudents = [
  { name: 'Alex Rivera', gpa: 3.95, major: 'AI Engineering' },
  { name: 'Jordan Smith', gpa: 3.89, major: 'Data Science' },
  { name: 'Taylor Johnson', gpa: 3.87, major: 'Systems Design' },
];

export function Students() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {studentStats.map((stat, i) => (
        <GlassCard key={i} title={stat.label} icon={stat.icon}>
          <div className="text-3xl font-bold neon-text-cyan mt-4">{stat.value}</div>
        </GlassCard>
      ))}

      <GlassCard title="Top Performers" className="lg:col-span-4">
        <div className="space-y-3">
          {topStudents.map((student, i) => (
            <div key={i} className="flex items-start justify-between p-3 bg-white/5 rounded-lg border border-cyber-border/40">
              <div>
                <p className="text-sm font-semibold">{student.name}</p>
                <p className="text-xs text-gray-500">{student.major}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-cyber-cyan">{student.gpa}</p>
                <p className="text-[10px] text-gray-500">GPA</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
