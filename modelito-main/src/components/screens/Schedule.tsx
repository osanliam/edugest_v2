/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlassCard } from '../shared/GlassCard';
import { Clock, BookOpen } from 'lucide-react';

const schedule = [
  { day: 'Monday', time: '09:00 - 10:30', class: 'Neural Networks 101', room: 'Lab 3' },
  { day: 'Monday', time: '11:00 - 12:30', class: 'Advanced AI Ethics', room: 'Hall A' },
  { day: 'Tuesday', time: '10:00 - 11:30', class: 'Data Science Fundamentals', room: 'Lab 2' },
  { day: 'Wednesday', time: '09:00 - 10:30', class: 'Cybersecurity Protocols', room: 'Lab 4' },
  { day: 'Friday', time: '14:00 - 15:30', class: 'Research Methods', room: 'Hall B' },
];

export function Schedule() {
  return (
    <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <GlassCard title="Weekly Schedule" icon={<Clock className="w-4 h-4" />}>
        <div className="space-y-3">
          {schedule.map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-cyber-border/40 hover:border-cyber-cyan/50 transition-all">
              <BookOpen className="w-5 h-5 text-cyber-cyan shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-semibold">{item.class}</p>
                  <span className="text-[10px] text-cyber-cyan font-mono">{item.time}</span>
                </div>
                <p className="text-xs text-gray-500">{item.day} • {item.room}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
