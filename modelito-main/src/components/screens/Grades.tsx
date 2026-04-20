/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '../shared/GlassCard';
import { TrendingUp, Award, AlertCircle } from 'lucide-react';

const gradeData = [
  { month: 'Jan', average: 75, target: 80 },
  { month: 'Feb', average: 78, target: 80 },
  { month: 'Mar', average: 82, target: 80 },
  { month: 'Apr', average: 85, target: 80 },
];

export function Grades() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <GlassCard title="Avg Grade" icon={<Award className="w-4 h-4" />}>
        <div className="text-4xl font-bold neon-text-cyan mt-4">85%</div>
        <p className="text-xs text-gray-500 mt-2">↑ 3% from last month</p>
      </GlassCard>

      <GlassCard title="Class Rank" icon={<TrendingUp className="w-4 h-4" />}>
        <div className="text-4xl font-bold text-cyber-orange mt-4">12/45</div>
        <p className="text-xs text-gray-500 mt-2">Top 26% of class</p>
      </GlassCard>

      <GlassCard title="Status" icon={<AlertCircle className="w-4 h-4" />}>
        <div className="text-2xl font-bold text-green-400 mt-4">Good Standing</div>
        <p className="text-xs text-gray-500 mt-2">No warnings</p>
      </GlassCard>

      <GlassCard title="Grade Trend" className="lg:col-span-3">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="month" stroke="#4d4d4d" fontSize={10} />
              <YAxis stroke="#4d4d4d" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0a1428', border: '1px solid #00f2ff', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="average" stroke="#00f2ff" strokeWidth={3} dot={{ fill: '#00f2ff', r: 4 }} name="Actual" />
              <Line type="monotone" dataKey="target" stroke="#ff8c00" strokeWidth={2} strokeDasharray="5 5" name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
