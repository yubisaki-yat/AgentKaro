import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Search, 
  Shield, 
  Activity,
  Plus,
  X,
  Lock,
  ChevronRight,
  RefreshCw,
  Settings as SettingsIcon,
  Bot,
  Terminal,
  ExternalLink,
  Monitor,
  Layout,
  Maximize2,
  MousePointer2,
  Cpu,
  Bookmark,
  Zap,
  Command,
  ChevronLeft
} from 'lucide-react';
import axios from 'axios';
import API_BASE from '../config';

// Defensive icon wrapper to prevent crashes if icons are missing in user's version
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
  const [activeBotId, setActiveBotId] = useState('internshala');
  const [isLive, setIsLive] = useState(true);
  
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

  useEffect(() => {
    if (email) {
      fetchScreenshot();
      // HIGH FREQUENCY POLLING (800ms) for real-time smoothness
      const interval = setInterval(fetchScreenshot, 800); 
      return () => clearInterval(interval);
    }
  }, [email, fetchScreenshot]);

  const sendAction = async (action: any) => {
    if (!email) return;
    try {
      await axios.post(`${API_BASE}/browser/action`, { ...action, email });
      // Minor delay to allow bot to perform action before next snapshot
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

  // Wheel/Scroll support
  const handleWheel = (e: React.WheelEvent) => {
    // Throttled scroll
    if (Math.abs(e.deltaY) > 50) {
        sendAction({ type: 'scroll', delta_y: e.deltaY });
    }
  };

  // Keyboard capture with Visual Feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        
        if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') {
            // Optimistic Typing Feedback
            setTypedChars(prev => [...prev.slice(-10), e.key === 'Enter' ? '⏎' : e.key]);
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => setTypedChars([]), 1500);

            sendAction({ type: 'type', text: e.key === 'Enter' ? '\n' : e.key });
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [email]);

  return (
    <div className="flex flex-col h-screen bg-[#020617] overflow-hidden select-none">
      {/* Top Chrome: Tabs */}
      <div className="bg-[#0f172a] pt-3 px-3 flex items-center gap-1 border-b border-white/5 relative z-50 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            className={`group relative flex items-center gap-3 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-t-2xl transition-all min-w-[150px] cursor-pointer ${
                tab.active 
                ? 'bg-[#020617] text-white' 
                : 'text-slate-500 hover:bg-white/5'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${tab.active ? 'bg-[#FFA229] animate-pulse' : 'bg-slate-700'}`} />
            <span className="truncate flex-1">{tab.title}</span>
            <X size={10} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded-full" />
            
            {tab.active && (
                <>
                    <div className="absolute -left-3 bottom-0 w-3 h-3 bg-[#020617]" style={{ clipPath: 'radial-gradient(circle at 0% 0%, transparent 12px, #020617 12px)' }} />
                    <div className="absolute -right-3 bottom-0 w-3 h-3 bg-[#020617]" style={{ clipPath: 'radial-gradient(circle at 100% 0%, transparent 12px, #020617 12px)' }} />
                </>
            )}
          </div>
        ))}
        <button className="p-3 text-slate-500 hover:text-white transition-all">
          <Plus size={14} />
        </button>
      </div>

      {/* Main Bar: Navigation & URL */}
      <div className="bg-[#020617] px-6 py-4 flex items-center gap-6 border-b border-white/5 relative z-40">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-2xl border border-white/5">
          <button onClick={() => sendAction({ type: 'back' })} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
            <SafeIcon icon={ChevronLeft} size={18} />
          </button>
          <button onClick={() => sendAction({ type: 'forward' })} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
            <SafeIcon icon={ChevronRight} size={18} />
          </button>
          <button onClick={handleRefresh} className={`p-2 hover:bg-white/10 rounded-xl transition-all ${isLoading ? 'animate-spin text-[#FFA229]' : 'text-slate-400 hover:text-white'}`}>
            <SafeIcon icon={RefreshCw} size={16} />
          </button>
        </div>

        <div className="flex-1 relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <SafeIcon icon={Shield} size={12} className="text-emerald-500" />
            <div className="h-4 w-px bg-white/10" />
          </div>
          <input 
            type="text" 
            value={displayUrl}
            onChange={(e) => setDisplayUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate(displayUrl)}
            className="w-full bg-white/5 border border-white/5 rounded-[22px] pl-16 pr-14 py-4 text-[13px] font-bold text-slate-200 outline-none focus:ring-4 ring-[#FFA229]/5 focus:bg-white/10 transition-all font-mono"
            placeholder="Search or enter secure URL..."
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <div className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-black text-slate-500 border border-white/5">SSL</div>
             <Search size={14} className="text-slate-500" />
          </div>
        </div>

        <div className="flex items-center gap-4">
            {/* BOT SELECTOR */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 mr-4">
                {['internshala', 'naukri', 'indeed', 'crawler'].map(id => (
                    <button 
                        key={id}
                        onClick={() => setActiveBotId(id)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            activeBotId === id 
                            ? 'bg-[#FFA229] text-white shadow-lg' 
                            : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        {id}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Stream</span>
            </div>
            <button onClick={() => setShowConsole(!showConsole)} className={`p-3.5 rounded-2xl transition-all ${showConsole ? 'bg-[#FFA229] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                <SafeIcon icon={Terminal} size={20} />
            </button>
        </div>
      </div>

      {/* Bookmarks / Quick Access Bar */}
      <div className="bg-[#020617] px-8 py-2 flex items-center gap-6 border-b border-white/5 animate-in slide-in-from-top duration-700">
         {[
            { label: 'Internshala', url: 'https://internshala.com', icon: Zap },
            { label: 'Naukri', url: 'https://naukri.com', icon: Search },
            { label: 'Indeed', url: 'https://in.indeed.com', icon: Globe },
            { label: 'Google Search', url: 'https://google.com', icon: Command },
         ].map(item => (
            <button 
                key={item.label}
                onClick={() => handleNavigate(item.url)}
                className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-[#FFA229] uppercase tracking-widest transition-all hover:scale-105"
            >
                <SafeIcon icon={item.icon} size={12} className="opacity-70" />
                {item.label}
            </button>
         ))}
      </div>

      {/* Main Viewport Area */}
      <div className="flex-1 flex min-h-0 relative">
        <div 
          ref={containerRef}
          onWheel={handleWheel}
          className="flex-1 bg-black relative cursor-crosshair overflow-hidden group"
          onClick={async (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            // Visual Interaction Feedback
            const ripple = document.createElement('div');
            ripple.className = 'absolute w-12 h-12 bg-[#FFA229]/20 border border-[#FFA229]/50 rounded-full animate-ping pointer-events-none z-50';
            ripple.style.left = `${x}%`;
            ripple.style.top = `${y}%`;
            ripple.style.transform = 'translate(-50%, -50%)';
            e.currentTarget.appendChild(ripple);
            setTimeout(() => ripple.remove(), 1000);

            sendAction({ type: 'click', x, y });
          }}
        >
          {screenshotUrl ? (
            <motion.img 
              key={screenshotUrl}
              src={screenshotUrl} 
              alt="Remote View" 
              className="w-full h-full object-contain pointer-events-none transition-all duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#020617]">
                <div className="text-center">
                    <div className="w-24 h-24 bg-[#1C4670]/5 rounded-[40px] flex items-center justify-center mx-auto mb-8 animate-pulse border border-white/5 shadow-2xl">
                        <Monitor size={40} className="text-[#1C4670]" />
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Initializing Secure Tunnel</h3>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mt-4 opacity-50">Residential Node Handshake... Pipelines Active.</p>
                </div>
            </div>
          )}

          {/* HUD Overlays (Top Right Flush) */}
          <div className="absolute top-8 right-8 flex items-center gap-3 pointer-events-none">
             <div className="px-5 py-3.5 bg-black/60 backdrop-blur-3xl rounded-[24px] border border-white/10 flex flex-col items-center shadow-2xl">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Resolution</span>
                <span className="text-[11px] font-black text-white font-mono uppercase">1920x1080</span>
             </div>
             <div className="px-5 py-3.5 bg-black/60 backdrop-blur-3xl rounded-[24px] border border-white/10 flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tunneling</span>
                <span className="text-[11px] font-black text-emerald-400 font-mono uppercase">Encrypted</span>
             </div>
          </div>

          {/* TYPING OVERLAY (Optimistic UI) */}
          <AnimatePresence>
            {typedChars.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    className="absolute left-1/2 bottom-32 -translate-x-1/2 px-10 py-5 bg-[#FFA229]/90 backdrop-blur-xl text-white rounded-[40px] shadow-2xl z-[100] border-4 border-white/20"
                >
                    <div className="flex items-center gap-6">
                        <KeyboardFeedback chars={typedChars} />
                        <div className="h-8 w-px bg-white/30" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Injecting Key Stream...</span>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Stats HUD (Bottom Left) */}
          <div className="absolute left-8 bottom-8 flex items-center gap-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
             <div className="px-5 py-4 bg-[#020617]/90 backdrop-blur-2xl rounded-[30px] border border-white/10 shadow-2xl flex items-center gap-8">
                <div className="flex flex-col gap-0.5">
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">User Latency</span>
                   <span className="text-[14px] font-black text-white font-mono tracking-tighter">0.42ms <span className="text-[10px] text-emerald-500">▲ Local</span></span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col gap-0.5">
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Network Speed</span>
                   <span className="text-[14px] font-black text-white font-mono tracking-tighter">1.2 Gbps</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                      <Cpu size={20} className="text-[#FFA229]" />
                   </div>
                   <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Node Engine</span>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest italic font-serif">V8 Enterprise</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Master Agent Console Drawer */}
        <AnimatePresence>
          {showConsole && (
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-[500px] bg-[#0f172a] shadow-[-32px_0_64px_-16px_rgba(0,0,0,0.8)] border-l border-white/5 z-50 flex flex-col"
            >
                <div className="p-10 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-gradient-to-tr from-[#FFA229] to-orange-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-[#FFA229]/20">
                          <Terminal size={24} className="text-white" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Master Console</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Live Engine Feed - Unit 7</p>
                       </div>
                    </div>
                    <button onClick={() => setShowConsole(false)} className="p-4 hover:bg-white/5 rounded-3xl transition-all">
                        <X size={24} className="text-slate-500 hover:text-white" />
                    </button>
                </div>

                <div className="flex-1 p-10 font-mono text-[12px] bg-[#020617]/50 overflow-auto custom-scrollbar space-y-4">
                    <div className="flex gap-5">
                        <span className="text-slate-700">11:42:12</span>
                        <span className="text-emerald-500 font-black tracking-widest uppercase">BRIDGE</span>
                        <span className="text-slate-300">Secure node synchronization successful.</span>
                    </div>
                    <div className="flex gap-5">
                        <span className="text-slate-700">11:42:15</span>
                        <span className="text-[#FFA229] font-black tracking-widest uppercase">STREAM</span>
                        <span className="text-slate-300">Target viewport rendered at 1920x1080px.</span>
                    </div>
                    <div className="flex gap-5">
                        <span className="text-slate-700">11:42:18</span>
                        <span className="text-blue-500 font-black tracking-widest uppercase">INPUT</span>
                        <span className="text-slate-300">Keyboard stream redirected to remote instance.</span>
                    </div>
                    <div className="flex gap-5 animate-pulse">
                        <span className="text-slate-700">11:42:20</span>
                        <span className="text-white font-black tracking-widest uppercase opacity-30">SCANNING</span>
                        <span className="text-slate-500 italic">Listening for action injection hooks...</span>
                    </div>
                    
                    <div className="pt-10 mt-10 border-t border-white/5">
                       <div className="flex items-center gap-5">
                          <div className="w-2 h-5 bg-[#FFA229] animate-pulse" />
                          <span className="text-slate-500 font-black">root@agentskaro:~/active-node#</span>
                          <span className="text-white font-black italic">await session.input();</span>
                       </div>
                    </div>
                </div>

                <div className="p-10 bg-[#020617] mt-auto flex flex-col gap-4">
                    <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Process Memory</span>
                        <span className="text-[10px] font-black text-white font-mono">1.24 GB / 8 GB</span>
                    </div>
                    <button className="w-full py-6 bg-gradient-to-r from-[#1C4670] to-[#2A6BA3] text-white rounded-3xl text-sm font-black uppercase tracking-[0.4em] flex items-center justify-center gap-6 shadow-2xl shadow-[#1C4670]/20 hover:scale-[1.02] active:scale-95 transition-all">
                        <Maximize2 size={24} />
                        Detached Mode
                    </button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chrome Status Bar */}
      <div className="bg-[#0f172a] px-8 py-2.5 flex items-center justify-between border-t border-white/5 relative z-50">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Secure Residential Bridge</span>
            </div>
            <div className="flex items-center gap-3">
               <Activity size={12} className="text-slate-500" />
               <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Node CPU: 12%</span>
            </div>
         </div>
         <div className="flex items-center gap-8">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Remote OS: Chromium Enterprise (Linux)</span>
            <div className="flex items-center gap-3 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                <SafeIcon icon={Shield} size={10} className="text-emerald-500" />
                <span className="text-[9px] font-black text-white font-mono uppercase tracking-widest">{lastUpdate}</span>
            </div>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}} />
    </div>
  );
};

// Helper Sub-component for Typing Feedback
const KeyboardFeedback = ({ chars }: { chars: string[] }) => (
    <div className="flex items-center gap-3">
        {chars.map((char, idx) => (
            <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.5, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black text-lg font-mono shadow-lg border border-white/20"
            >
                {char}
            </motion.div>
        ))}
    </div>
);

export default Browser;
