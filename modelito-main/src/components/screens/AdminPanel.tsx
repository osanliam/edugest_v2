/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlassCard } from '../shared/GlassCard';
import { Activity, Users, Shield, AlertTriangle, Server, Database } from 'lucide-react';

export function AdminPanel() {
  const stats = [
    { label: 'Active Users', value: '2,847', icon: <Users className="w-4 h-4" /> },
    { label: 'System Uptime', value: '99.98%', icon: <Server className="w-4 h-4" /> },
    { label: 'Security Alerts', value: '3', icon: <AlertTriangle className="w-4 h-4" /> },
    { label: 'Database Status', value: 'Healthy', icon: <Database className="w-4 h-4" /> },
  ];

  const recentActivity = [
    { action: 'User Created', detail: 'New teacher account activated', time: '5m ago' },
    { action: 'System Update', detail: 'Core modules updated to v4.2.1', time: '2h ago' },
    { action: 'Security Patch', detail: 'Applied authentication protocol upgrade', time: '4h ago' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {stats.map((stat, i) => (
        <GlassCard key={i} title={stat.label} icon={stat.icon}>
          <div className="text-4xl font-bold neon-text-cyan mt-4">{stat.value}</div>
        </GlassCard>
      ))}

      <GlassCard title="System Activity" icon={<Activity className="w-4 h-4" />} className="lg:col-span-4">
        <div className="space-y-4">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-3 bg-white/5 rounded-lg border border-cyber-border/40">
              <Shield className="w-5 h-5 text-cyber-cyan shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{item.action}</p>
                <p className="text-xs text-gray-500">{item.detail}</p>
              </div>
              <span className="text-[10px] text-gray-600 whitespace-nowrap">{item.time}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
