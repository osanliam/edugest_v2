/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Book, Search, User, Bell, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface NavbarProps {
  userName: string;
  userRole: string;
}

export function Navbar({ userName, userRole }: NavbarProps) {
  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-cyber-border/40 bg-white/50 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyber-cyan/15 border border-cyber-cyan/40">
          <Book className="w-6 h-6 text-cyber-cyan" />
        </div>
        <h1 className="text-xl font-bold tracking-tighter uppercase font-sans text-gray-800">
          Director <span className="text-cyber-cyan">Strategic</span> Hub
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group hidden md:block">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-cyber-cyan" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-64 bg-white/40 border border-cyber-border/40 rounded-full py-1.5 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:border-cyber-cyan/60 transition-colors"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-cyber-cyan/10 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-cyber-magenta rounded-full" />
          </button>

          <div className="h-8 w-[1px] bg-cyber-border/40" />

          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-full border-2 border-cyber-cyan/60 p-0.5">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-magenta opacity-60" />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-gray-800">{userName}</p>
              <p className="text-[10px] uppercase tracking-widest text-cyber-cyan">{userRole}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-cyber-cyan transition-colors" />
          </div>
        </div>
      </div>
    </nav>
  );
}
