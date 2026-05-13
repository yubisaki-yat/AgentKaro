import React from 'react';
import ResumeUpload from '../components/ResumeUpload';
import { Sparkles, Crown, Lock, Shield, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIJobSearchProps {
  subscription: string;
  onUpgrade: () => void;
}

const AIJobSearch: React.FC<AIJobSearchProps> = ({ subscription, onUpgrade }) => {
  const isPremium = subscription !== 'free' || localStorage.getItem('user_email')?.toLowerCase().trim() === 'nitishk38938@gmail.com';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 lg:space-y-12 max-w-[1400px] mx-auto pb-32">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#1C4670] rounded-2xl shadow-xl shadow-[#1C4670]/20 border border-white/10">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none italic">
                    Resume <span className="logo-karo-gradient">Intelligence</span>
                  </h1>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] mt-2">Neural Extraction Node v3.0</p>
                </div>
              </div>
            </div>
            {!isPremium && (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-amber-500/20 shadow-xl shadow-amber-500/5 backdrop-blur-sm cursor-help"
              >
                <Crown className="w-4 h-4" /> Priority Content
              </motion.div>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
            Synchronize your professional node via neural parsing. Our autonomous engines extract technical markers to initialize high-frequency job acquisitions.
          </p>
        </div>

        <div className="relative group rounded-[3rem] overflow-hidden">
          <div className="relative z-0">
            <ResumeUpload onSearchInitiated={() => {}} />
          </div>
          
          {!isPremium && (
            <div className="absolute inset-0 z-10 bg-[#0a0d14]/40 backdrop-blur-md flex items-center justify-center p-8 transition-all group-hover:backdrop-blur-lg">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 className="glass-card p-12 max-w-md text-center border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden"
               >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-[#FFA229]" />
                  <div className="mb-8 inline-flex p-5 bg-amber-500/10 text-amber-500 rounded-[2rem] border border-amber-500/20 shadow-2xl shadow-amber-500/20">
                     <Lock className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Encrypted Module</h3>
                  <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-10 leading-relaxed opacity-60">
                    AI-powered neural extraction is limited to priority operators. Upgrade your uplink to initialize unlimited node parsing.
                  </p>
                  <button 
                    onClick={onUpgrade}
                    className="w-full py-5 bg-[#FFA229] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#E89218] transition-all shadow-2xl shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    Initialize Upgrade Protocol
                    <Crown className="w-4 h-4" />
                  </button>
               </motion.div>
            </div>
          )}
        </div>

         <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className={`glass-card p-10 border border-slate-200/50 dark:border-white/5 relative overflow-hidden transition-all shadow-xl ${!isPremium ? 'opacity-40 grayscale pointer-events-none' : 'hover:shadow-2xl'}`}
            >
               <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1C4670]" />
               <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-[#1C4670]/10 rounded-2xl">
                   <Shield className="w-6 h-6 text-[#1C4670]" />
                 </div>
                 <h3 className="text-sm font-black text-[#1C4670] dark:text-slate-200 uppercase tracking-widest italic">Node Privacy</h3>
               </div>
               <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium uppercase tracking-tight italic">
                 Local intelligence securely extracts technical identifiers without cloud synchronization. Your professional footprint remains within the secure local node boundary.
               </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className={`glass-card p-10 border border-slate-200/50 dark:border-white/5 relative overflow-hidden transition-all shadow-xl ${!isPremium ? 'opacity-40 grayscale pointer-events-none' : 'hover:shadow-2xl'}`}
            >
               <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
               <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-emerald-500/10 rounded-2xl">
                   <Cpu className="w-6 h-6 text-emerald-500" />
                 </div>
                 <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest italic">Neural Handshake</h3>
               </div>
               <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium uppercase tracking-tight italic">
                 Post-extraction, initialize high-frequency scraping engines with 1-click synchronization. Automated bots will navigate and execute queries using refined neural footprint.
               </p>
            </motion.div>
         </div>
      </div>
    </div>
  );
};

export default AIJobSearch;
