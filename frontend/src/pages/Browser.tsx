import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Search, 
  Shield, 
  ExternalLink,
  Monitor,
  Layout,
  Terminal,
  Activity
} from 'lucide-react';
import API_BASE from '../config';

const Browser: React.FC = () => {
  const url = 'https://internshala.com';
  const [isLoading, setIsLoading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const email = localStorage.getItem('user_email');

  const fetchScreenshot = useCallback(async () => {
    if (!email) return;
    try {
      // Add timestamp to bypass cache
      const timestamp = new Date().getTime();
      setScreenshotUrl(`${API_BASE}/live-screenshot?email=${email}&t=${timestamp}`);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to fetch live view", err);
    }
  }, [email]);

  useEffect(() => {
    if (email) {
      fetchScreenshot();
      const interval = setInterval(fetchScreenshot, 3000); // Update every 3 seconds
      return () => clearInterval(interval);
    }
  }, [email, fetchScreenshot]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchScreenshot();
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-6">
      {/* Header / Address Bar Area */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-none"
      >
        <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-800">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 cursor-not-allowed">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 cursor-not-allowed">
            <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={handleRefresh}
            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${isLoading ? 'animate-spin text-[#FFA229]' : 'text-slate-600 dark:text-slate-400'}`}
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hidden sm:inline">Secure</span>
          </div>
          <input 
            type="text" 
            value={url}
            readOnly
            className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl pl-12 pr-10 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 outline-none focus:ring-2 ring-[#FFA229]/20 transition-all font-mono"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
             <Search className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bot Identity</span>
              <span className="text-[10px] font-bold text-[#FFA229] uppercase">{email?.split('@')[0]}</span>
           </div>
           <div className="w-10 h-10 bg-[#1C4670] rounded-xl flex items-center justify-center shadow-lg shadow-[#1C4670]/20">
              <Globe className="w-5 h-5 text-white" />
           </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Browser Feed (Large) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 glass-card bg-slate-900 border-slate-800 overflow-hidden relative group shadow-2xl shadow-black/20"
        >
          {/* Browser Controls / Tabs Mockup */}
          <div className="bg-slate-800/80 p-2 flex items-center gap-2 border-b border-white/5">
             <div className="flex gap-1.5 px-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
             </div>
             <div className="px-4 py-1.5 bg-slate-900 rounded-t-lg rounded-b-none border-t border-x border-white/5 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3 text-[#FFA229] animate-pulse" />
                Live Agent Feed
             </div>
          </div>

          <div className="relative w-full h-full bg-[#0a0d14] flex items-center justify-center group">
            {screenshotUrl ? (
              <img 
                src={screenshotUrl} 
                alt="Bot Live View" 
                className="w-full h-full object-contain"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                }}
              />
            ) : (
              <div className="text-center space-y-4 p-12">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto animate-pulse">
                   <Monitor className="w-10 h-10 text-slate-600" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">Waiting for Agent</h3>
                   <p className="text-slate-500 text-sm mt-2 max-w-[280px] mx-auto italic">Launch a bot engine from the control panel to see the live browser interactions here.</p>
                </div>
              </div>
            )}

            {/* Overlay Status */}
            <div className="absolute top-6 right-6 flex flex-col gap-3">
               <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Agent Active</span>
               </div>
               {lastUpdate && (
                  <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-center">
                     <span className="text-[9px] font-bold text-slate-400 uppercase block">Last Sync</span>
                     <span className="text-[10px] font-black text-white">{lastUpdate}</span>
                  </div>
               )}
            </div>

            {/* Interactive Hints Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="flex items-center justify-center gap-8">
                   <div className="flex items-center gap-2">
                      <div className="p-1 px-2 bg-white/20 rounded text-[9px] font-mono text-white">SHIFT + S</div>
                      <span className="text-[10px] font-black text-white/70 uppercase">Status Snapshot</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="p-1 px-2 bg-white/20 rounded text-[9px] font-mono text-white">CTRL + R</div>
                      <span className="text-[10px] font-black text-white/70 uppercase">Hard Reload</span>
                   </div>
                </div>
            </div>
          </div>
        </motion.div>

        {/* Sidebar Info (Status/Logs) */}
        <div className="space-y-6 flex flex-col min-h-0">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]"
          >
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Layout className="w-5 h-5 text-emerald-500" />
               </div>
               <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Viewport Specs</h3>
            </div>
            
            <div className="space-y-4">
               {[
                 { label: "Resolution", value: "1920 x 1080" },
                 { label: "Platform", value: "Undetected Chromium" },
                 { label: "Encrypted", value: "AES-256-GCM" },
                 { label: "Proxy", value: "Residential Node" }
               ].map((item) => (
                 <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">{item.value}</span>
                 </div>
               ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 glass-card p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FFA229]/10 rounded-lg">
                     <Terminal className="w-5 h-5 text-[#FFA229]" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Bot Console</h3>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase">Synced</span>
               </div>
            </div>

            <div className="flex-1 bg-slate-900 dark:bg-black rounded-2xl p-4 font-mono text-[11px] overflow-auto custom-scrollbar-slim space-y-2 text-slate-400 leading-relaxed border border-slate-800">
               <div className="flex gap-2">
                  <span className="text-[#FFA229] shrink-0">[$]</span>
                  <span>Agent initialized for session...</span>
               </div>
               <div className="flex gap-2 border-l-2 border-emerald-500/30 pl-2 ml-1">
                  <span className="text-emerald-500 shrink-0">[INFO]</span>
                  <span>Authenticating secure fingerprint...</span>
               </div>
               <div className="flex gap-2 border-l-2 border-blue-500/30 pl-2 ml-1">
                  <span className="text-blue-500 shrink-0">[DEBUG]</span>
                  <span>Navigating to internshala.com</span>
               </div>
               <div className="flex gap-2 animate-pulse mt-4">
                  <span className="text-slate-600 shrink-0">&gt;</span>
                  <span className="w-20 h-3 bg-slate-800 rounded-sm" />
               </div>
            </div>

            <button className="w-full mt-6 py-4 bg-[#1C4670] hover:bg-[#2A6BA3] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-[#1C4670]/20">
               <ExternalLink className="w-4 h-4" />
               Raw Engine Logs
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Browser;
