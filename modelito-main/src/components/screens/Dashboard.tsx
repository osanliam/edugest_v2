/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { GlassCard } from '../shared/GlassCard';
import { StatCard } from '../shared/StatCard';
import { TrendingUp, Users, Cpu, Activity, AlertCircle, HardDrive, Clock } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

const enrollmentData = [
  { year: '2023', students: 1100 },
  { year: '2024', students: 1450 },
  { year: 'Forecast 2025', students: 2100 },
];

const budgetData = [
  { name: 'Instructional', value: 45, color: '#93c5fd' },
  { name: 'Facilities', value: 25, color: '#f9a8d4' },
  { name: 'Technology', value: 15, color: '#6ee7b7' },
  { name: 'Admin', value: 10, color: '#c4b5fd' },
  { name: 'Other', value: 5, color: '#fcd34d' },
];

const departmentData = [
  { name: 'Science', grade: 8.5, research: 7.2, satisfaction: 8.0 },
  { name: 'Arts', grade: 7.8, research: 5.5, satisfaction: 8.5 },
  { name: 'Humanities', grade: 8.2, research: 6.0, satisfaction: 7.8 },
  { name: 'Engineering', grade: 9.1, research: 8.5, satisfaction: 7.2 },
];

export function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="USUARIOS ACTIVOS"
          value="342"
          icon={<Users className="w-5 h-5" />}
          change="+12%"
          variant="blue"
        />
        <StatCard
          title="ALMACENAMIENTO"
          value="2.4 GB"
          icon={<HardDrive className="w-5 h-5" />}
          change="+8%"
          variant="pink"
        />
        <StatCard
          title="TIEMPO DE ACTIVIDAD"
          value="99.9%"
          icon={<Clock className="w-5 h-5" />}
          change="Excelente"
          variant="green"
        />
        <StatCard
          title="ALERTAS"
          value="3"
          icon={<AlertCircle className="w-5 h-5" />}
          change="Críticas"
          variant="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Enrollment Growth */}
      <GlassCard
        title="Enrollment Growth (YoY)"
        icon={<TrendingUp className="w-4 h-4" />}
        className="col-span-1"
      >
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={enrollmentData}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#93c5fd" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="year" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '8px', color: '#374151' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Area type="monotone" dataKey="students" stroke="#60a5fa" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Budget Allocation */}
      <GlassCard
        title="Budget Allocation"
        icon={<Activity className="w-4 h-4" />}
      >
        <div className="h-64 flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={budgetData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {budgetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] mt-2 uppercase tracking-tighter">
            {budgetData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-500">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Real-time AI Alerts */}
      <GlassCard
        title="Real-time AI Alerts"
        icon={<AlertCircle className="w-4 h-4 text-pink-400" />}
      >
        <div className="space-y-4">
          {[
            { time: '33m ago', msg: 'RCI Invalid protocol detected on node-24', type: 'error' },
            { time: '2h ago', msg: 'System efficiency increased by 15%', type: 'success' },
            { time: '5h ago', msg: 'Predictive maintenance required for Lab 4', type: 'warning' },
            { time: '12h ago', msg: 'New curriculum model successfully optimized', type: 'info' }
          ].map((alert, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/60 border border-gray-200 hover:border-blue-300/60 transition-all group">
              <div className={cn(
                "w-10 h-10 rounded flex items-center justify-center shrink-0",
                alert.type === 'error' ? "bg-red-100 text-red-500" :
                alert.type === 'warning' ? "bg-orange-100 text-orange-500" :
                alert.type === 'success' ? "bg-green-100 text-green-600" :
                "bg-blue-100 text-blue-500"
              )}>
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono mb-1">{alert.time}</p>
                <p className="text-sm font-medium text-gray-700 line-clamp-1 group-hover:text-blue-500 transition-colors">{alert.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Department Performance */}
      <GlassCard
        title="Department Performance Overview"
        icon={<Users className="w-4 h-4" />}
        className="col-span-1 md:col-span-2"
      >
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151' }}
              />
              <Bar dataKey="grade" name="Avg Grade" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="research" name="Research Output" fill="#f9a8d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="satisfaction" name="Satisfaction" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* System Health */}
      <GlassCard
        title="System Health Index"
        icon={<Activity className="w-4 h-4" />}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-gray-100"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 80}
                strokeDashoffset={2 * Math.PI * 80 * (1 - 0.924)}
                className="text-blue-400"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-mono font-bold text-blue-500">92.4</span>
              <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Health Score</span>
            </div>
          </div>
          <div className="w-full space-y-3">
            {[
              { label: 'AI Sync', value: 98 },
              { label: 'Cloud Load', value: 42 },
              { label: 'Security', value: 100 }
            ].map(stat => (
              <div key={stat.label} className="w-full">
                <div className="flex justify-between text-[10px] uppercase tracking-widest mb-1 items-center">
                  <span className="text-gray-500">{stat.label}</span>
                  <span className="text-blue-500">{stat.value}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.value}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-blue-400 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
      </div>
    </div>
  );
}
