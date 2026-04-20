/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlassCard } from '../shared/GlassCard';
import { Users, Award, TrendingUp } from 'lucide-react';

const faculty = [
  { name: 'Dr. Sarah Chen', dept: 'AI Engineering', rating: 4.8, students: 142 },
  { name: 'Prof. James Wilson', dept: 'Data Science', rating: 4.6, students: 128 },
  { name: 'Dr. Maria Lopez', dept: 'Ethics & Policy', rating: 4.9, students: 95 },
  { name: 'Prof. Ahmed Hassan', dept: 'Systems Design', rating: 4.7, students: 156 },
];

export function Faculty() {
  return (
    <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <GlassCard title="Faculty Members" icon={<Users className="w-4 h-4" />}>
        <div className="space-y-3">
          {faculty.map((person, i) => (
            <div key={i} className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-cyber-border/40 hover:border-cyber-cyan/50 transition-all">
              <div className="flex-1">
                <p className="text-sm font-semibold">{person.name}</p>
                <p className="text-xs text-gray-500 mt-1">{person.dept}</p>
              </div>
              <div className="text-right ml-4">
                <div className="flex items-center gap-1 text-cyber-orange text-xs font-semibold">
                  <Award className="w-3 h-3" />
                  {person.rating}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{person.students} students</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
