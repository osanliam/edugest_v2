/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GlassCard } from '../shared/GlassCard';
import { MessageSquare, Video, Phone, MoreHorizontal, Send, Paperclip, Search, Plus } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function Messaging() {
  const contacts = [
    { name: 'Dr. Evelyn Reed', role: 'Director', status: 'online', avatar: 'ER' },
    { name: 'Prof. Alan Chen', role: 'CS Dept', status: 'busy', avatar: 'AC' },
    { name: 'Dr. Sarah Jenkins', role: 'Humanities', status: 'away', avatar: 'SJ' },
    { name: 'Research Group Alpha', role: 'Active Project', status: 'online', avatar: 'RA' },
    { name: 'Student Council', role: 'Official', status: 'offline', avatar: 'SC' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
      {/* Contact List */}
      <GlassCard title="Neural Mesh Contacts" className="lg:col-span-1 flex flex-col">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Find user..."
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs font-mono"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-1">
          {contacts.map((contact, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-all border border-transparent hover:border-cyber-cyan/20">
              <div className="relative">
                <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center font-bold text-xs group-hover:neon-border-cyan transition-all">
                  {contact.avatar}
                </div>
                <div className={cn(
                  "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-cyber-bg",
                  contact.status === 'online' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" :
                  contact.status === 'busy' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" :
                  contact.status === 'away' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" :
                  "bg-gray-600"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate group-hover:text-cyber-cyan transition-colors">{contact.name}</p>
                <p className="text-[10px] text-gray-500 font-mono italic">{contact.role}</p>
              </div>
              <div className="hidden group-hover:flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-cyber-cyan/60" />
              </div>
            </div>
          ))}
        </div>
        
        <button className="mt-4 w-full py-2 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-lg text-cyber-cyan text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-cyber-cyan/20 transition-all">
          <Plus className="w-3 h-3" /> New Frequency
        </button>
      </GlassCard>

      {/* active Conversation */}
      <GlassCard className="lg:col-span-3 flex flex-col p-0">
        <div className="p-4 border-b border-cyber-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center font-bold text-xs text-cyber-cyan">ER</div>
            <div>
              <h4 className="text-sm font-bold">Dr. Evelyn Reed <span className="text-[10px] lowercase text-green-500 ml-2 font-mono">● active_stream</span></h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Directorate / Strategic Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-cyber-cyan transition-colors"><Phone className="w-5 h-5" /></button>
            <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-cyber-cyan transition-colors"><Video className="w-5 h-5" /></button>
            <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-cyber-cyan transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-center">
            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-mono text-gray-500 uppercase tracking-widest">Data Stream Connected: 2026-04-19</span>
          </div>

          {[
            { sender: 'ER', msg: "The latest enrollment figures are promising. We need to discuss the AI resource allocation plan for next quarter.", time: '09:42 AM', side: 'left' },
            { sender: 'You', msg: "Understood, Director. I've analyzed the current data and will share the forecast shortly. Should I include the new Lab 4 requirements?", time: '09:45 AM', side: 'right' },
            { sender: 'ER', msg: "Definitely. The board is particularly interested in the predictive maintenance ROI.", time: '09:46 AM', side: 'left' }
          ].map((msg, i) => (
            <div key={i} className={cn(
              "flex items-end gap-3",
              msg.side === 'right' ? "flex-row-reverse" : "flex-row"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold",
                msg.side === 'right' ? "border-cyber-cyan text-cyber-cyan" : "border-white/20 text-gray-400"
              )}>
                {msg.sender === 'You' ? 'YO' : msg.sender}
              </div>
              <div className="space-y-1 max-w-[60%]">
                <div className={cn(
                  "p-4 rounded-2xl text-[13px] leading-relaxed shadow-lg",
                  msg.side === 'right' ? "bg-cyber-cyan text-black font-medium" : "glass-panel bg-white/5"
                )}>
                  {msg.msg}
                </div>
                <p className={cn(
                  "text-[8px] font-mono uppercase tracking-widest text-gray-600",
                  msg.side === 'right' ? "text-right" : "text-left"
                )}>{msg.time}</p>
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-2 mt-8">
            <p className="text-[10px] uppercase font-mono text-cyber-cyan tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-ping" /> AI Smart Reply Suggestion:
            </p>
            <div className="flex gap-2">
              {['Prepare Forecast Report', 'Schedule Meeting', 'Acknowledge & Archive'].map(action => (
                <button key={action} className="px-4 py-1.5 rounded-full border border-cyber-cyan/30 bg-cyber-cyan/5 text-[10px] text-cyber-cyan font-bold hover:bg-cyber-cyan hover:text-black transition-all">
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-cyber-border/40">
          <div className="relative">
            <textarea 
              placeholder="Transmit message via encrypted channel..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-24 text-sm focus:outline-none focus:border-cyber-cyan transition-all resize-none font-mono"
            />
            <div className="absolute right-4 bottom-4 flex gap-2">
              <button className="p-2 rounded-xl hover:bg-white/10 text-gray-500 transition-colors"><Paperclip className="w-5 h-5" /></button>
              <button className="p-2 rounded-xl bg-cyber-cyan text-black shadow-[0_0_15px_rgba(0,242,255,0.4)] hover:shadow-[0_0_25px_rgba(0,242,255,0.6)] transition-all">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
