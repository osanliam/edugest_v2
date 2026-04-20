/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlassCard } from '../shared/GlassCard';
import { Play, BookOpen, Send, Mic, MoreVertical, Globe, Layers, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export function Classroom() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full pb-6">
      {/* Sidebar Info */}
      <div className="lg:col-span-1 space-y-6">
        <GlassCard title="Current Module" icon={<Layers className="w-4 h-4" />}>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
            <div className="w-12 h-12 bg-cyber-magenta/20 rounded-lg flex items-center justify-center mb-3 border border-cyber-magenta/30">
              <Globe className="w-6 h-6 text-cyber-magenta" />
            </div>
            <h4 className="text-sm font-bold mb-1">Futuristic Virtual Learning</h4>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Quantum Physics 101</p>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-cyber-magenta shadow-[0_0_8px_rgba(255,0,255,0.8)]" />
            </div>
            <div className="flex justify-between mt-1 text-[8px] font-mono uppercase">
              <span>Progress</span>
              <span className="text-cyber-magenta">67%</span>
            </div>
          </div>
          <button className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors uppercase tracking-widest font-bold">
            View Syllabus
          </button>
        </GlassCard>

        <GlassCard title="Upcoming Live Sessions" icon={<Zap className="w-4 h-4" />}>
          <div className="space-y-3">
            {[
              { title: 'Neural Ethics', time: '12:00 AM - 12:30 PM', active: true },
              { title: 'Cyber Defense', time: '10:00 AM - 12:00 PM', active: false },
              { title: 'AI Engineering', time: 'Tomorrow 09:00', active: false }
            ].map((session, i) => (
              <div key={i} className={cn(
                "p-3 rounded-lg border flex items-center justify-between group cursor-pointer transition-all",
                session.active ? "bg-cyber-cyan/10 border-cyber-cyan/30" : "bg-white/5 border-white/10 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
              )}>
                <div>
                  <h5 className="text-[11px] font-bold">{session.title}</h5>
                  <p className="text-[9px] text-gray-500 font-mono italic">{session.time}</p>
                </div>
                {session.active && <Play className="w-3 h-3 text-cyber-cyan fill-cyber-cyan" />}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Main Holographic View */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <GlassCard title="Lesson Topic: Quantum Superposition" className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-96 h-96 border-2 border-dashed border-cyber-cyan rounded-full animate-[spin_20s_linear_infinite]" />
            <div className="absolute w-80 h-80 border border-cyber-magenta rounded-full animate-[spin_15s_linear_infinite_reverse]" />
          </div>
          
          <div className="relative h-full flex flex-col items-center justify-center py-10">
            <motion.div
              animate={{ 
                rotateY: 360,
                y: [0, -20, 0]
              }}
              transition={{ 
                rotateY: { duration: 20, repeat: Infinity, ease: "linear" },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-48 h-48 bg-gradient-to-br from-cyber-cyan/20 to-cyber-magenta/20 backdrop-blur-sm rounded-2xl border-4 border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(0,242,255,0.2)]"
            >
              <Globe className="w-24 h-24 text-cyber-cyan drop-shadow-[0_0_15px_rgba(0,242,255,1)]" />
            </motion.div>
            
            <div className="mt-12 text-center max-w-sm">
              <h3 className="text-xl font-bold neon-text-cyan mb-2">Holographic Particle Model v2</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                Explore the behavior of subatomic particles in high-pressure vacuums. Use the neural glove to rotate the model.
              </p>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
            <button className="p-3 rounded-full glass-panel hover:neon-border-cyan transition-all"><Globe className="w-5 h-5" /></button>
            <button className="p-3 rounded-full glass-panel hover:neon-border-cyan transition-all"><Layers className="w-5 h-5" /></button>
            <button className="p-3 rounded-full glass-panel hover:neon-border-cyan transition-all"><Zap className="w-5 h-5" /></button>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-6">
          <GlassCard title="Course Materials" icon={<BookOpen className="w-4 h-4" />}>
            <div className="space-y-2">
              {['Quantum_Mechanics_Vol1.pdf', 'Lab_Notes_Week_4.nx', 'Formula_Sheet_Final.svg'].map(doc => (
                <div key={doc} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded bg-cyber-cyan/10 flex items-center justify-center border border-cyber-cyan/20 group-hover:border-cyber-cyan transition-colors">
                    <BookOpen className="w-4 h-4 text-cyber-cyan" />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 truncate">{doc}</span>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard title="Student Progress" className="flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - 0.87)} className="text-cyber-magenta" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold font-mono">87%</span>
              </div>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-gray-500">Mastery Level</p>
          </GlassCard>
        </div>
      </div>

      {/* AI Assistant Chat */}
      <GlassCard title="AI Learning Assistant" className="lg:col-span-1 h-full flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {[
            { role: 'assistant', msg: 'Hi student! I see you are analyzing the quantum model. Need help with the math?', time: '10:02' },
            { role: 'user', msg: 'Yes, what is the uncertainty principle again?', time: '10:03' },
            { role: 'assistant', msg: 'It states that you cannot precisely know both the position and momentum of a particle simultaneously.', time: '10:03' }
          ].map((chat, i) => (
            <div key={i} className={cn(
              "flex flex-col max-w-[85%]",
              chat.role === 'user' ? "ml-auto items-end" : "items-start"
            )}>
              <div className={cn(
                "p-3 rounded-2xl text-[11px] leading-relaxed",
                chat.role === 'user' ? "bg-cyber-cyan text-black font-medium" : "bg-white/5 border border-white/10"
              )}>
                {chat.msg}
              </div>
              <span className="text-[8px] text-gray-600 font-mono mt-1 uppercase tracking-tighter">{chat.time}</span>
            </div>
          ))}
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Query AI..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-20 text-xs focus:outline-none focus:border-cyber-cyan transition-colors font-mono"
          />
          <div className="absolute right-2 top-1.5 flex gap-1">
            <button className="p-1.5 rounded-lg hover:bg-cyber-cyan/20 text-gray-500 transition-colors"><Mic className="w-4 h-4" /></button>
            <button className="p-1.5 rounded-lg bg-cyber-cyan text-black hover:shadow-[0_0_10px_rgba(0,242,255,0.5)] transition-all font-bold">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
