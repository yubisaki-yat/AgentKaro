import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, ChevronLeft, ChevronRight, RefreshCw, Shield, 
  Search, Terminal, Zap, Globe, Command, Monitor, 
  Cpu, Maximize2, Activity, ArrowRight
} from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

// Defensive icon wrapper
const SafeIcon = ({ icon: Icon, size = 16, className = "" }: { icon: any, size?: number, className?: string }) => {
    if (!Icon) return <div className={`w-${Math.ceil(size/4)} h-${Math.ceil(size/4)} bg-slate-400/20 rounded-sm`} />;
    return <Icon size={size} className={className} />;
};

const Browser: React.FC = () => {
  const [url, setUrl] = useState('https://internshala.com');
  const [displayUrl, setDisplayUrl] = useState('https://internshala.com');
  const [isLoading, setIsLoading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [tabs, setTabs] = useState([{ id: 1, title: 'Internshala', active: true, url: 'https://internshala.com' }]);
  const [showConsole, setShowConsole] = useState(false);
  const [typedChars, setTypedChars] = useState<string[]>([]);
  const [activeBotId, setActiveBotId] = useState('browser');
  const [isLive, setIsLive] = useState(true);
  const [isBotRunning, setIsBotRunning] = useState(false);
  
  const email = localStorage.getItem('user_email');
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<any>(null);

  const fetchScreenshot = useCallback(async () => {
    if (!email || !isLive) return;
    try {
      const timestamp = new Date().getTime();
      setScreenshotUrl(`${API_BASE}/live-screenshot?email=${email}&bot_id=${activeBotId}&t=${timestamp}`);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to fetch live view", err);
    }
  }, [email, isLive, activeBotId]);

  const checkStatus = useCallback(async () => {
    if (!email) return;
    try {
      const res = await axios.get(`${API_BASE}/status?email=${email}`, { timeout: 5000 });
      setIsBotRunning(res.data.status?.[activeBotId]?.running || false);
    } catch (err) {
      console.error("Status check failed", err);
    }
  }, [email, activeBotId]);

  useEffect(() => {
    if (email) {
      checkStatus();
      fetchScreenshot();
      const interval = setInterval(fetchScreenshot, 800); 
      const statusInterval = setInterval(checkStatus, 3000);
      return () => {
        clearInterval(interval);
        clearInterval(statusInterval);
      };
    }
  }, [email, fetchScreenshot, checkStatus]);

  const sendAction = async (action: any) => {
    if (!email) return;
    try {
      await axios.post(`${API_BASE}/browser/action`, { ...action, email });
      setTimeout(fetchScreenshot, 500);
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  const handleNavigate = (target: string) => {
    setIsLoading(true);
    let finalUrl = target;
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
    setUrl(finalUrl);
    setDisplayUrl(finalUrl);
    sendAction({ type: 'navigate', url: finalUrl });
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    sendAction({ type: 'reload' });
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] overflow-hidden select-none">
      {/* Top Chrome: Tabs */}
      <div className="bg-[#0f172a] pt-3 px-3 flex items-center gap-1 border-b border-white/5 relative z-50 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            className={`group relative flex items-center gap-3 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-t-2xl transition-all min-w-[160px] cursor-pointer ${
                tab.active 
                ? 'bg-[#020617] text-white' 
                : 'text-slate-500 hover:bg-white/5'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${tab.active ? 'bg-[#FFA229] animate-pulse shadow-[0_0_8px_rgba(255,162,41,0.5)]' : 'bg-slate-700'}`} />
            <span className="truncate flex-1">{tab.title}</span>
            <X size={10} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded-full transition-opacity" />
            
            {tab.active && (
                <>
                    <div className="absolute -left-3 bottom-0 w-3 h-3 bg-[#020617]" style={{ clipPath: 'radial-gradient(circle at 0% 0%, transparent 12px, #020617 12px)' }} />
                    <div className="absolute -right-3 bottom-0 w-3 h-3 bg-[#020617]" style={{ clipPath: 'radial-gradient(circle at 100% 0%, transparent 12px, #020617 12px)' }} />
                </>
            )}
          </div>
        ))}
        <button className="p-3 text-slate-600 hover:text-white transition-colors">
          <Plus size={14} />
        </button>
      </div>

      {/* Main Bar: Navigation & URL */}
      <div className="bg-[#020617] px-6 py-4 flex items-center gap-6 border-b border-white/5 relative z-40">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          <button onClick={() => sendAction({ type: 'back' })} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => sendAction({ type: 'forward' })} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
            <ChevronRight size={18} />
          </button>
          <button onClick={handleRefresh} className={`p-2.5 hover:bg-white/10 rounded-xl transition-all ${isLoading ? 'animate-spin text-[#FFA229]' : 'text-slate-400 hover:text-white'}`}>
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="flex-1 relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <Shield size={12} className="text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            <div className="h-4 w-px bg-white/10" />
          </div>
          <input 
            type="text" 
            value={displayUrl}
            onChange={(e) => setDisplayUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate(displayUrl)}
            className="w-full bg-white/5 border border-white/5 rounded-[22px] pl-16 pr-14 py-3.5 text-xs font-bold text-slate-300 outline-none focus:border-[#FFA229]/30 transition-all font-mono shadow-inner"
            placeholder="Search or enter secure node URL..."
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <div className="px-2 py-0.5 bg-[#FFA229]/10 text-[#FFA229] text-[8px] font-black rounded-md border border-[#FFA229]/20 uppercase tracking-widest">Secure</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
                {['browser', 'internshala', 'naukri', 'indeed'].map(id => (
                    <button 
                        key={id}
                        onClick={() => setActiveBotId(id)}
                        className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all ${
                            activeBotId === id 
                            ? 'bg-[#1C4670] text-white shadow-lg shadow-[#1C4670]/20' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {id}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest">Live</span>
            </div>

            <button 
              onClick={() => setShowConsole(!showConsole)} 
              className={`p-3 rounded-2xl transition-all border ${showConsole ? 'bg-[#FFA229] border-[#FFA229] text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
            >
                <Terminal size={18} />
            </button>
        </div>
      </div>

      {/* Quick Access Bar */}
      <div className="bg-[#020617] px-8 py-2.5 flex items-center gap-8 border-b border-white/5">
         {[
            { label: 'Internshala', url: 'https://internshala.com', icon: Zap },
            { label: 'Naukri', url: 'https://naukri.com', icon: Search },
            { label: 'Indeed', url: 'https://in.indeed.com', icon: Globe },
            { label: 'Google', url: 'https://google.com', icon: Command },
         ].map(item => (
            <button 
                key={item.label}
                onClick={() => handleNavigate(item.url)}
                className="flex items-center gap-2 text-[9px] font-black text-slate-500 hover:text-[#FFA229] uppercase tracking-[0.2em] transition-all group"
            >
                <item.icon size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                {item.label}
            </button>
         ))}
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative bg-[#020617] flex items-center justify-center p-6 sm:p-10 lg:p-14 overflow-hidden">
        {/* Background Grids */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617] pointer-events-none" />

        <div 
          ref={containerRef}
          className="relative w-full max-w-7xl aspect-video bg-black rounded-[2.5rem] shadow-[0_48px_100px_-24px_rgba(0,0,0,0.8)] overflow-hidden border-8 border-[#0f172a] group"
        >
          {screenshotUrl ? (
            <img 
              src={screenshotUrl} 
              alt="Remote Node View" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-[#0a0d14]">
                <div className="w-16 h-16 rounded-full border-4 border-[#FFA229]/20 border-t-[#FFA229] animate-spin" />
                <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Establishing Neural Link</p>
                    <p className="text-[9px] text-slate-700 font-bold uppercase mt-2 italic">Awaiting synchronization with remote agent...</p>
                </div>
            </div>
          )}

          {/* Viewport HUD */}
          <div className="absolute top-6 left-6 flex flex-col gap-2">
            <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/5 flex items-center gap-2">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">Node: {activeBotId}</span>
            </div>
            {isBotRunning && (
                <div className="px-3 py-1 bg-[#FFA229]/20 backdrop-blur-md rounded-lg border border-[#FFA229]/30 flex items-center gap-2">
                    <Activity size={10} className="text-[#FFA229] animate-pulse" />
                    <span className="text-[8px] font-black text-[#FFA229] uppercase tracking-widest">Agent Active</span>
                </div>
            )}
          </div>

          <div className="absolute bottom-6 right-6">
            <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/5 text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-3">
                <Monitor size={12} />
                1920 x 1080
            </div>
          </div>

          {/* Typing Feedback Overlay */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
            <AnimatePresence>
                {typedChars.length > 0 && (
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center gap-3"
                    >
                        {typedChars.map((char, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center font-black text-lg text-white border border-white/20 shadow-2xl"
                            >
                                {char}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Console Overlay */}
        <AnimatePresence>
          {showConsole && (
            <motion.div 
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="absolute right-10 top-10 bottom-10 w-1/3 bg-[#0a0d14]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden z-[100]"
            >
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-4">
                       <div className="p-2.5 bg-[#FFA229] rounded-xl text-white">
                          <Terminal size={20} />
                       </div>
                       <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-widest">Master Console</h3>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Live Engine Feed</p>
                       </div>
                    </div>
                    <button onClick={() => setShowConsole(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
                        <X size={20} className="text-slate-500 hover:text-white" />
                    </button>
                </div>

                <div className="flex-1 p-8 font-mono text-[11px] overflow-auto custom-scrollbar space-y-4">
                    <div className="flex gap-4">
                        <span className="text-slate-600">10:24:12</span>
                        <span className="text-emerald-500 font-black tracking-widest uppercase">NODE</span>
                        <span className="text-slate-400">Synchronization successful.</span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-slate-600">10:24:15</span>
                        <span className="text-[#FFA229] font-black tracking-widest uppercase">STREAM</span>
                        <span className="text-slate-400">Viewport rendered at 1080p.</span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-slate-600">10:24:18</span>
                        <span className="text-blue-500 font-black tracking-widest uppercase">INPUT</span>
                        <span className="text-slate-400">Stream redirected to remote.</span>
                    </div>
                    <div className="flex gap-4 animate-pulse">
                        <span className="text-slate-600">10:24:20</span>
                        <span className="text-white/30 font-black tracking-widest uppercase">SCANNING</span>
                        <span className="text-slate-600 italic">Listening for hooks...</span>
                    </div>
                    
                    <div className="pt-8 mt-8 border-t border-white/5">
                       <div className="flex items-center gap-4">
                          <div className="w-1.5 h-4 bg-[#FFA229] animate-pulse" />
                          <span className="text-slate-500 font-black">root@agentskaro:~/active#</span>
                          <span className="text-white font-black italic">await session.input();</span>
                       </div>
                    </div>
                </div>

                <div className="p-8 bg-[#020617] mt-auto flex flex-col gap-4">
                    <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Process Mem</span>
                        <span className="text-[9px] font-black text-white font-mono">1.24 GB / 8 GB</span>
                    </div>
                    <button className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 border border-white/10 transition-all">
                        <Maximize2 size={16} />
                        Detached Mode
                    </button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chrome Status Bar */}
      <div className="bg-[#0f172a] px-8 py-3 flex items-center justify-between border-t border-white/5 relative z-50">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Secure Node Bridge</span>
            </div>
            <div className="flex items-center gap-3">
               <Activity size={10} className="text-slate-600" />
               <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">CPU: 12%</span>
            </div>
         </div>
         <div className="flex items-center gap-8">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Remote OS: Chromium (Linux)</span>
            <div className="flex items-center gap-3 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                <Shield size={10} className="text-emerald-500" />
                <span className="text-[8px] font-black text-white/40 font-mono tracking-widest">{lastUpdate || '--:--:--'}</span>
            </div>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}} />
    </div>
  );
};

export default Browser;
