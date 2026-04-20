/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Chrome } from 'lucide-react';
import { cn } from '@/src/lib/utils';

type UserRole = 'admin' | 'director' | 'subdirector' | 'teacher' | 'student' | 'parent';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const DEMO_CREDENTIALS: Array<{ label: string; role: UserRole; email: string; desc: string }> = [
  { label: 'Admin', role: 'admin', email: 'admin@escuela.edu', desc: 'Full System Access' },
  { label: 'Director', role: 'director', email: 'director@escuela.edu', desc: 'Director Access' },
  { label: 'Teacher', role: 'teacher', email: 'teacher@escuela.edu', desc: 'Teacher Access' },
  { label: 'Student', role: 'student', email: 'student@escuela.edu', desc: 'Student Access' },
  { label: 'Parent', role: 'parent', email: 'parent@escuela.edu', desc: 'Parent Access' },
];

export function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg relative overflow-hidden p-6">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-cyan/15 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-magenta/15 rounded-full blur-[120px] animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="glass-panel p-8 md:p-10 border-2 border-cyber-cyan/40">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tighter uppercase mb-2 text-gray-800">
              Role <span className="neon-text-cyan">Selection</span> Portal
            </h2>
            <p className="text-xs text-gray-600 font-mono tracking-widest uppercase">Choose your access level</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {DEMO_CREDENTIALS.map((cred) => (
              <motion.button
                key={cred.role}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedRole(cred.role)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all",
                  selectedRole === cred.role
                    ? "border-cyber-cyan bg-cyber-cyan/20 shadow-lg"
                    : "border-cyber-border/40 hover:border-cyber-cyan/60 bg-white/30"
                )}
              >
                <div className="text-sm font-bold uppercase text-gray-800">{cred.label}</div>
                <div className="text-[10px] text-gray-600 mt-1">{cred.desc}</div>
              </motion.button>
            ))}
          </div>

          <div className="space-y-1.5 mb-6 p-4 bg-white/40 rounded-xl border border-cyber-border/40">
            <label className="text-[10px] uppercase tracking-widest text-cyber-cyan font-semibold">Selected Credential</label>
            <p className="text-sm font-mono text-gray-800">{DEMO_CREDENTIALS.find(c => c.role === selectedRole)?.email}</p>
          </div>

          <button
            onClick={() => onLogin(selectedRole)}
            className="w-full py-4 rounded-xl bg-cyber-cyan text-white font-bold uppercase tracking-widest text-sm hover:translate-y-[-2px] hover:shadow-lg transition-all active:scale-[0.98]"
          >
            Access System
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-700 font-mono tracking-widest uppercase">
            © 2026 DIRECTOR STRATEGIC HUB // v1.0.0-PASTEL
          </p>
        </div>
      </motion.div>
    </div>
  );
}
