/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlassCard } from '../shared/GlassCard';
import { Target, Trophy, Calendar, Clock, BookOpen, GraduationCap, Award, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export function StudentHUD() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-6">
      {/* Left Column: Goals & Schedule */}
      <div className="lg:col-span-1 space-y-6">
        <GlassCard title="My Neural Goals" icon={<Target className="w-4 h-4" />}>
          <div className="space-y-6">
            {[
              { label: 'Math Mastery', progress: 85, color: '#00f2ff' },
              { label: 'Quantum Project', progress: 60, color: '#ff00ff' },
              { label: 'Neural Ethics', progress: 45, color: '#ff8c00' }
            ].map(goal => (
              <div key={goal.label} className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-200">{goal.label}</span>
                  <span style={{ color: goal.color }}>({goal.progress}%)</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: goal.color, boxShadow: `0 0 10px ${goal.color}66` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Time-Space Schedule" icon={<Calendar className="w-4 h-4" />}>
          <div className="relative pl-4 space-y-6 after:absolute after:left-[21px] after:top-2 after:bottom-2 after:w-[1px] after:bg-cyber-cyan/30">
            {[
              { time: '09:00', title: 'Quantum Physics A', deadline: 'Deadline T-Minus 2h', active: true },
              { time: '11:00', title: 'Ethics in AI', deadline: 'No Pending Tasks', active: false },
              { time: '14:30', title: 'Lab Session 4', deadline: 'Report Required', active: false }
            ].map((item, i) => (
              <div key={i} className="relative flex gap-6 items-start">
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 z-10 mt-1 shrink-0 transition-all",
                  item.active ? "bg-cyber-cyan border-cyber-cyan shadow-[0_0_10px_rgba(0,242,255,1)]" : "bg-cyber-bg border-cyber-cyan/50"
                )} />
                <div className={cn(
                  "flex-1 p-3 rounded-lg border transition-all",
                  item.active ? "bg-cyber-cyan/10 border-cyber-cyan/40" : "bg-white/5 border-white/10 opacity-60"
                )}>
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="text-[11px] font-bold">{item.title}</h5>
                    <span className="text-[9px] font-mono text-cyber-cyan">{item.time}</span>
                  </div>
                  <p className="text-[9px] font-mono text-gray-500 italic">{item.deadline}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Middle Column: Global Achievement Globe */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <GlassCard title="Academic Completion Orbit" className="flex-1 relative overflow-hidden flex flex-col justify-center items-center">
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <div className="w-[300px] h-[300px] border border-cyber-cyan rounded-full animate-pulse blur-sm" />
            <div className="absolute w-[400px] h-[400px] border border-cyber-magenta/30 rounded-full animate-ping blur-md" />
          </div>

          <div className="relative z-10 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="relative w-48 h-48 mx-auto"
            >
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-cyber-cyan/40 p-4">
                <div className="w-full h-full rounded-full border-4 border-cyber-magenta/20" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <GraduationCap className="w-20 h-20 text-cyber-cyan drop-shadow-[0_0_20px_rgba(0,242,255,0.8)]" />
              </div>
            </motion.div>
            
            <div className="mt-8 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">Global Mastery Rank</p>
              <h3 className="text-5xl font-mono font-bold neon-text-cyan">78%</h3>
              <p className="text-xs text-cyber-magenta font-semibold tracking-widest uppercase">Expert Tier Candidate</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard title="AI Intelligence Boosts" icon={<Clock className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-cyber-cyan/5 border border-cyber-cyan/20 hover:border-cyber-cyan transition-all group">
              <span className="text-[9px] font-mono text-gray-500 block mb-1">Algorithm Assist</span>
              <p className="text-[11px] font-bold group-hover:text-cyber-cyan transition-colors">Practice Set B-12</p>
            </div>
            <div className="p-3 rounded-lg bg-cyber-magenta/5 border border-cyber-magenta/20 hover:border-cyber-magenta transition-all group">
              <span className="text-[9px] font-mono text-gray-500 block mb-1">Predictive Tutor</span>
              <p className="text-[11px] font-bold group-hover:text-cyber-magenta transition-colors">Lab Preparation</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Right Column: Achievements & Widgets */}
      <div className="lg:col-span-1 space-y-6">
        <GlassCard title="Medal Grid" icon={<Award className="w-4 h-4" />}>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 1, label: 'Top Coder', icon: <Trophy />, color: 'text-cyber-cyan' },
              { id: 2, label: "Dean's List", icon: <Award />, color: 'text-cyber-magenta' },
              { id: 3, label: 'Research Star', icon: <Star />, color: 'text-cyber-orange' }
            ].map(medal => (
              <div key={medal.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className={cn(
                  "w-12 h-12 rounded-full glass-panel flex items-center justify-center transition-all group-hover:scale-110",
                  medal.id === 1 ? "group-hover:neon-border-cyan" : medal.id === 2 ? "group-hover:border-cyber-magenta" : "group-hover:border-cyber-orange"
                )}>
                  <div className={medal.color}>{medal.icon}</div>
                </div>
                <span className="text-[9px] font-mono uppercase tracking-tighter text-gray-400 group-hover:text-white transition-colors">{medal.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Homework Hub" icon={<BookOpen className="w-4 h-4" />}>
          <div className="space-y-4">
            {[
              { title: 'Physics Lab Report', status: 'Due Tomorrow', color: 'border-l-cyber-cyan' },
              { title: 'History of AI Ethics', status: 'In Progress', color: 'border-l-cyber-magenta' },
              { title: 'Neural Analysis', status: 'Next Week', color: 'border-l-cyber-orange' }
            ].map((hw, i) => (
              <div key={i} className={cn(
                "p-4 rounded-xl glass-panel border-l-4 hover:translate-x-1 transition-all group cursor-pointer",
                hw.color
              )}>
                <div className="flex justify-between items-center">
                  <h6 className="text-[11px] font-bold group-hover:text-cyber-cyan transition-colors">{hw.title}</h6>
                  <span className="text-[9px] font-mono text-gray-500">{hw.status}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
