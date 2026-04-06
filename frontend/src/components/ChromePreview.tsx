import React, { useState, useEffect } from 'react';
import { Camera, Maximize2, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE from '../config';

interface ChromePreviewProps {
  email: string;
  isRunning: boolean;
  botId: string;
}

const ChromePreview: React.FC<ChromePreviewProps> = ({ email, isRunning, botId }) => {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    let interval: number | undefined;

    const fetchScreenshot = async () => {
      try {
        // Use a cache-busting timestamp to force image refresh
        const url = `${API_BASE}/live-screenshot?email=${email}&t=${new Date().getTime()}`;
        
        // Pre-fetch to check if image exists
        const response = await fetch(url);
        if (response.ok) {
          setScreenshotUrl(url);
          setLoading(false);
          setError(false);
          setLastUpdate(new Date().toLocaleTimeString());
        } else {
          // If 404, bot might be starting but no image yet
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch screenshot", err);
        setError(true);
        setLoading(false);
      }
    };

    if (isRunning) {
      fetchScreenshot();
      interval = setInterval(fetchScreenshot, 5000) as unknown as number;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [email, isRunning, botId]);

  if (!isRunning) return null;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 overflow-hidden rounded-[32px] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f172a] shadow-xl shadow-[#1C4670]/10 group"
      >
        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-[#1C4670]/10 flex items-center justify-center">
                <Camera className="w-4 h-4 text-[#1C4670]" />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Chrome Preview</h3>
                <p className="text-[10px] text-slate-500 font-medium">Real-time bot monitor • {lastUpdate || 'Syncing...'}</p>
             </div>
          </div>
          <button 
            onClick={() => setIsExpanded(true)}
            className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
          >
            <Maximize2 className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="relative aspect-video bg-slate-100 dark:bg-[#0a0d14] p-4 flex items-center justify-center overflow-hidden">
          {loading ? (
             <div className="flex flex-col items-center gap-4 text-center">
                <RefreshCw className="w-8 h-8 text-[#FFA229] animate-spin" />
                <p className="text-xs font-bold text-slate-500 tracking-tighter uppercase">Initializing Engine...</p>
             </div>
          ) : error || !screenshotUrl ? (
             <div className="flex flex-col items-center gap-4 text-center max-w-[280px]">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                   <RefreshCw className="w-6 h-6 text-amber-500 animate-pulse" />
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                  Waiting for browser instance... <br/>
                  <span className="text-[10px] font-medium italic">Screenshots will appear once the bot performs its first action.</span>
                </p>
             </div>
          ) : (
             <motion.img 
               key={screenshotUrl}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               src={screenshotUrl} 
               alt="Chrome Preview" 
               className="w-full h-full object-contain rounded-2xl shadow-2xl transition-all hover:scale-[1.01]"
             />
          )}

          {/* Badge Overlay */}
          <div className="absolute top-8 left-8 px-3 py-1.5 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
             Live Feed
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isExpanded && screenshotUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0a0d14]/95 backdrop-blur-xl p-8 md:p-16 flex flex-col items-center justify-center"
          >
             <button 
               onClick={() => setIsExpanded(false)}
               className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-rose-500/20 text-white rounded-3xl transition-all group"
             >
               <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
             </button>

             <motion.div 
               layoutId="preview"
               className="w-full max-w-6xl aspect-video rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_100px_-20px_rgba(28,70,112,0.3)]"
             >
                <img src={screenshotUrl} alt="Chrome Preview" className="w-full h-full object-contain bg-black" />
             </motion.div>
             
             <div className="mt-8 flex flex-col items-center text-center">
                <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-2">Omniscient Browser View</h2>
                <p className="text-slate-400 text-sm font-medium">Monitoring {botId} • Last Sync: {lastUpdate}</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChromePreview;
