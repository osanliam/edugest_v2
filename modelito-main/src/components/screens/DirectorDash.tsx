/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '../shared/GlassCard';
import { BarChart3, TrendingUp, AlertCircle, Zap } from 'lucide-react';

const performanceData = [
  { dept: 'AI Eng', performance: 88, target: 85 },
  { dept: 'Data Sci', performance: 84, target: 85 },
  { dept: 'Ethics', performance: 91, target: 85 },
  { dept: 'Systems', performance: 86, target: 85 },
];

export function DirectorDash() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <GlassCard title="Overall Health" icon={<Zap className="w-4 h-4" />}>
        <div className="text-4xl font-bold neon-text-cyan mt-4">94.2%</div>
        <p className="text-xs text-gray-500 mt-2">System operational</p>
      </GlassCard>

      <GlassCard title="Active Issues" icon={<AlertCircle className="w-4 h-4" />}>
        <div className="text-4xl font-bold text-cyber-orange mt-4">2</div>
        <p className="text-xs text-gray-500 mt-2">Requiring attention</p>
      </GlassCard>

      <GlassCard title="Growth" icon={<TrendingUp className="w-4 h-4" />}>
        <div className="text-4xl font-bold text-green-400 mt-4">+12%</div>
        <p className="text-xs text-gray-500 mt-2">YoY enrollment</p>
      </GlassCard>

      <GlassCard title="Department Performance" className="lg:col-span-3">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="dept" stroke="#4d4d4d" fontSize={10} />
              <YAxis stroke="#4d4d4d" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0a1428', border: '1px solid #00f2ff', borderRadius: '8px' }} />
              <Bar dataKey="performance" fill="#00f2ff" radius={[4, 4, 0, 0]} name="Actual" />
              <Bar dataKey="target" fill="#ff8c00" radius={[4, 4, 0, 0]} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
