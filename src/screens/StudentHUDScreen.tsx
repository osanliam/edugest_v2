import { motion } from "motion/react";
import { 
  Trophy, 
  Target, 
  Calendar, 
  BookOpen, 
  Search, 
  MoreVertical,
  GraduationCap
} from "lucide-react";
import { GlassCard } from "../components/GlassCard";

export function StudentHUDScreen() {
  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-blue/20 rounded-lg neon-border-cyan">
             <GraduationCap className="w-8 h-8 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase italic">Cyber-Student <span className="text-neon-magenta">Personal HUD</span></h1>
            <p className="text-xs opacity-50 font-mono tracking-widest">RANK: TOP CODER | LEVEL: 78</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:text-neon-magenta transition-colors" />
            <input 
              type="text" 
              placeholder="Search goals..." 
              className="bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-neon-magenta/50 w-64 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full py-1 pl-1 pr-4">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-magenta to-neon-blue p-0.5">
               <img src="https://picsum.photos/seed/student/100/100" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
             </div>
             <p className="text-xs font-bold">Alex Rivera</p>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Goals */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <GlassCard title="My Goals" icon={Target} variant="cyan">
            <div className="space-y-6 pt-2">
              {[
                { name: 'Math Mastery', progress: 85, color: 'bg-neon-cyan' },
                { name: 'Science Project', progress: 60, color: 'bg-neon-blue' },
                { name: 'Coding Challenge', progress: 45, color: 'bg-neon-magenta' },
              ].map((goal) => (
                <div key={goal.name} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{goal.name}</span>
                    <span className="opacity-60">({goal.progress}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full ${goal.color} shadow-[0_0_10px_currentColor]`}
                    ></motion.div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard title="Schedule" icon={Calendar} variant="magenta">
            <div className="relative h-48 mt-4">
               <div className="absolute top-1/2 w-full h-0.5 bg-white/10 -translate-y-1/2"></div>
               <div className="absolute left-0 top-1/2 -translate-y-1/2 flex justify-between w-full px-4">
                  {[
                    { node: 'Physic Class A', time: 'Deadline 1', top: true },
                    { node: 'Phasic Class B', time: 'Deadline 2', top: false },
                    { node: 'History Class B', time: 'Deadline 2', top: true },
                    { node: 'History Class C', time: 'Deadline 4', top: false },
                  ].map((evt, i) => (
                    <div key={i} className={`flex flex-col items-center gap-2 relative ${evt.top ? '-mt-16' : 'mt-4'}`}>
                       <div className={`w-3 h-3 rounded-full border-2 border-cyber-bg ${i < 2 ? 'bg-neon-cyan' : 'bg-neon-magenta'}`}></div>
                       <div className="glass-card p-2 text-[10px] min-w-24 border-white/5">
                          <p className="font-bold opacity-80">{evt.node}</p>
                          <p className="opacity-40">{evt.time}</p>
                       </div>
                    </div>
                  ))}
               </div>
               {/* Arrow */}
               <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 border-t-2 border-r-2 border-white/20 rotate-45"></div>
            </div>
          </GlassCard>
        </div>

        {/* Central Hologram Globe */}
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-center items-center relative min-h-[500px]">
           <GlassCard className="absolute inset-0 z-0 border-white/5 opacity-50" variant="gray">
             <div></div>
           </GlassCard>
           
           <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-80 h-80 flex items-center justify-center">
                 {/* Rotating Rings */}
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                   className="absolute inset-0 border-2 border-dashed border-neon-cyan/20 rounded-full"
                 ></motion.div>
                 <motion.div 
                   animate={{ rotate: -360 }}
                   transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                   className="absolute inset-4 border border-neon-magenta/30 rounded-full"
                 ></motion.div>
                 
                 {/* Globe Image/Visual */}
                 <div className="w-64 h-64 rounded-full bg-gradient-to-br from-neon-blue/20 to-transparent flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000')] bg-cover opacity-60 mix-blend-screen animate-pulse"></div>
                    <div className="relative z-10 text-center glass-card p-6 border-white/10 scale-110 shadow-2xl">
                       <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Academic Completion</p>
                       <p className="text-5xl font-black text-white">78%</p>
                    </div>
                 </div>
              </div>
           </div>
           
           <GlassCard title="Homework Widgets" className="w-full mt-6" variant="cyan" icon={BookOpen}>
              <div className="flex gap-4">
                 <div className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-neon-cyan transition-all cursor-pointer">
                    <p className="text-xs font-bold text-neon-cyan">Algorithm Practice</p>
                    <p className="text-[10px] opacity-40 mt-1">(New)</p>
                 </div>
              </div>
           </GlassCard>
        </div>

        {/* Achievements & Widgets */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <GlassCard title="Achievements" icon={Trophy} variant="magenta">
            <div className="flex justify-around items-end h-32 pt-4">
              {[
                { name: 'Top Coder', icon: '❶', color: 'text-neon-cyan', scale: 'scale-90' },
                { name: 'Dean\'s List', icon: '🏆', color: 'text-neon-magenta', scale: 'scale-110' },
                { name: 'Research Star', icon: '★', color: 'text-neon-blue', scale: 'scale-100' },
              ].map((ach, i) => (
                <div key={i} className={`flex flex-col items-center gap-2 ${ach.scale}`}>
                   <div className={`text-4xl ${ach.color} drop-shadow-[0_0_10px_currentColor]`}>{ach.icon}</div>
                   <p className="text-[10px] font-bold opacity-60 uppercase">{ach.name}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-4">
            <GlassCard title="Homework Widgets" icon={BookOpen} variant="blue">
               <div className="space-y-3">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-neon-cyan transition-all cursor-pointer">
                    <h5 className="text-sm font-bold">Physics Lab Report</h5>
                    <p className="text-[10px] opacity-40 mt-1">(Due Tomorrow)</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-neon-magenta transition-all cursor-pointer">
                    <h5 className="text-sm font-bold">History Essay</h5>
                    <p className="text-[10px] opacity-40 mt-1">(In Progress)</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-neon-blue transition-all cursor-pointer">
                    <h5 className="text-sm font-bold">Algorithm Practice</h5>
                    <p className="text-[10px] opacity-40 mt-1">(New)</p>
                  </div>
               </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
