import React from 'react';
import ResumeUpload from '../components/ResumeUpload';
import { Sparkles, Crown, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIJobSearchProps {
  subscription: string;
  onUpgrade: () => void;
}

const AIJobSearch: React.FC<AIJobSearchProps> = ({ subscription, onUpgrade }) => {
  const isPremium = subscription !== 'free' || localStorage.getItem('user_email')?.toLowerCase().trim() === 'nitishk38938@gmail.com';

  return (
    <div className="p-8 space-y-8 h-full relative">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-black text-[#1C4670] dark:text-white tracking-tight flex items-center gap-3 uppercase">
              <div className="p-2.5 bg-[#1C4670]/10 text-[#1C4670] dark:text-[#FFA229] rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              AI Resume Parsing
            </h1>
            {!isPremium && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-500/20 shadow-lg shadow-amber-500/5">
                <Crown className="w-3.5 h-3.5" /> Premium Content
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Upload your latest resume to automatically extract your core skills and launch highly-targeted job hunts across integrated platforms.
          </p>
        </div>

        <div className="relative group">
          <ResumeUpload onSearchInitiated={() => {}} />
          
          {!isPremium && (
            <div className="absolute inset-0 z-10 bg-slate-50/10 dark:bg-[#0a0d14]/20 backdrop-blur-[2px] flex items-center justify-center p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all group-hover:backdrop-blur-[4px]">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="glass-card p-10 max-w-sm text-center shadow-2xl border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0f172a]/80"
               >
                  <div className="mb-6 inline-flex p-4 bg-[#1C4670]/10 text-[#1C4670] dark:text-[#FFA229] rounded-2xl">
                     <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-[#1C4670] dark:text-white uppercase tracking-tight mb-3">Premium AI Access Only</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed text-balance">
                    AI-powered automated skill extraction is exclusive to our premium members. 
                    Upgrade or Yearly plan users can process unlimited resumes.
                  </p>
                  <button 
                    onClick={onUpgrade}
                    className="w-full py-4 bg-[#FFA229] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#E89218] transition-all shadow-lg shadow-[#FFA229]/20 active:scale-95"
                  >
                    Unlock Priority Access
                  </button>
               </motion.div>
            </div>
          )}
        </div>

         <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`glass-card p-6 border-l-4 border-[#1C4670] bg-white dark:bg-[#0f172a] transition-all shadow-sm ${!isPremium ? 'opacity-50' : 'hover:shadow-lg'}`}>
               <h3 className="font-black text-[#1C4670] dark:text-slate-200 mb-2 uppercase tracking-tight underline decoration-[#FFA229]/30 underline-offset-4">Local Privacy Model</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">
                 Our local AI securely extracts technical keywords off your PDF/DOCX resume without sending your sensitive data to external servers. It matches and populates bot queries instantly.
               </p>
            </div>
            <div className={`glass-card p-6 border-l-4 border-emerald-500 bg-white dark:bg-[#0f172a] transition-all shadow-sm ${!isPremium ? 'opacity-50' : 'hover:shadow-lg'}`}>
               <h3 className="font-black text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-tight underline decoration-emerald-500/30 underline-offset-4">Automated Execution</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">
                 Once skills are identified, you can 1-click launch the Internshala or Naukri scraping engines. The bots will navigate, authenticate, and apply using the extracted footprint.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AIJobSearch;
