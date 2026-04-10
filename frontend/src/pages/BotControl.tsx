import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Play, Square, Trash2, Clock, Terminal, Settings, Activity } from 'lucide-react';

import API_BASE from '../config';


interface BotControlProps {
  botId: 'internshala' | 'naukri' | 'indeed' | 'company_crawler';
  title: string;
  icon: React.ElementType;
  color: string;
  email: string;
  subscription: string;
  onLimitReached: () => void;
}

interface BotConfig {
  roles?: string[];
  max_applies?: number;
  keyword?: string;
  location?: string;
  max_pages?: number;
  company_url?: string;
  headless?: boolean;
}

const BotControl: React.FC<BotControlProps> = ({ botId, title, icon: Icon, color, email, subscription, onLimitReached }) => {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState("00:00:00");
  const [logs, setLogs] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");
  const [searchParams] = useSearchParams();
  const logEndRef = useRef<HTMLDivElement>(null);

  // Initialize config based on query params if present
  const [config, setConfig] = useState<BotConfig>(() => {
    const k = searchParams.get('keyword');
    const r = searchParams.get('roles');
    const url = searchParams.get('url');
    
    if (botId === 'naukri' || botId === 'indeed') {
      return { roles: r ? r.split(',') : (k ? [k] : ["Software Engineer", "React Developer"]), location: "", max_pages: 10, headless: true };
    } else if (botId === 'company_crawler') {
      return { company_url: url || "", roles: ["Software Engineer"], headless: true };
    } else {
      return { roles: r ? r.split(',') : ["Software Engineer", "Machine Learning"], max_applies: 20, headless: true };
    }
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/status?email=${email}`);
        setRunning(res.data.status[botId].running);
        setElapsed(res.data.status[botId].elapsed);
      } catch (err) {
        console.error("Status fetch failed", err);
      }
    };

    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/bot/${botId}/logs?email=${email}`);
        if (res.data.logs.length > 0) {
          setLogs(res.data.logs);
        }
      } catch (err) {
        console.error("Logs fetch failed", err);
      }
    };

    if (email) {
      fetchStatus();
      const interval = setInterval(() => {
        fetchStatus();
        fetchLogs();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [botId, email]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleStart = async () => {
    try {
      await axios.post(`${API_BASE}/bot/${botId}/start`, { ...config, email });
      setRunning(true);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      if (e.response?.status === 402) {
        onLimitReached();
      } else {
        const msg = e.response?.data?.detail || e.message || "Failed to start bot. Check server logs.";
        alert(`Error: ${msg}`);
      }
    }
  };

  const handleStop = async () => {
    try {
      await axios.post(`${API_BASE}/bot/${botId}/stop`, { email });
    } catch (err) {
      console.error("Stop bot failed", err);
    }
  };

  const handleClearLogs = () => setLogs([]);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${color} bg-opacity-10 shadow-lg shadow-[#1C4670]/10`}>
            <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
               <span className="flex items-center gap-1.5 opacity-60">
                 <Settings className="w-3 h-3" /> Autonomous Agent
               </span>
               <span className="flex items-center gap-1.5">
                 <Clock className="w-3 h-3 text-[#FFA229]" /> Session: <code className="text-[#FFA229] font-mono text-xs">{elapsed}</code>
               </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!email ? (
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-login'))}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#1C4670] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#1C4670]/20 hover:scale-[1.02] transition-all duration-300"
            >
              <Play className="w-4 h-4 fill-current ml-1" /> Sign In to Launch
            </button>
          ) : running ? (
               <button 
                 onClick={handleStop}
                 className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 shadow-lg shadow-rose-500/20"
               >
                 <Square className="w-4 h-4 fill-current" /> Stop Bot
               </button>
          ) : (
             <button 
               onClick={handleStart}
               className={`w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-[#FFA229] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#FFA229]/30 hover:scale-[1.05] active:scale-95 transition-all duration-300 ${
                 botId === 'company_crawler' && subscription === 'free' ? 'opacity-50 grayscale cursor-not-allowed' : ''
               }`}
             >
               <Play className="w-4 h-4 fill-current ml-1" /> 
               {botId === 'company_crawler' && subscription === 'free' ? 'PRO Lifetime Only' : 'Launch Master bot'}
             </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Config Panel */}
        <div className="xl:col-span-1 space-y-6">
           <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-7 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-300 hover:shadow-2xl hover:shadow-[#FFA229]/5">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#FFF2E5] dark:bg-[#1C4670]/20 rounded-xl">
                      <Settings className="w-5 h-5 text-[#1C4670] dark:text-[#FFA229]" />
                    </div>
                    <h3 className="text-xl font-black text-[#1C4670] dark:text-white tracking-tight uppercase">Config</h3>
                  </div>
                  
                  {/* Visibility Toggle */}
                  <div className="flex items-center gap-3 p-1.5 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#1C4670] dark:text-slate-400 pl-2">Browser View</span>
                    <button 
                      onClick={() => setConfig({...config, headless: !config.headless})}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${!config.headless ? 'bg-[#FFA229]' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${!config.headless ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
               </div>
              
              {botId === 'company_crawler' ? (
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Target Company URL</label>
                       <input 
                         type="text" 
                         placeholder="e.g. https://www.google.com"
                         className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-[#FFA229] outline-none transition-all text-slate-800 dark:text-slate-200"
                         value={config.company_url || ""}
                         onChange={(e)=>setConfig({...config, company_url: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Role/Keywords (For Matching)</label>
                       <div className="flex flex-wrap gap-2 min-h-[36px]">
                         {(config.roles || []).map((k: string) => (
                           <span key={k} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-[#FFF2E5] dark:bg-[#1C4670]/30 border border-[#FFA229]/30 text-[#1C4670] dark:text-[#FFA229]">
                             {k}
                             <button
                               type="button"
                               onClick={() => setConfig({ ...config, roles: (config.roles || []).filter((x: string) => x !== k) })}
                               className="ml-0.5 hover:text-red-400 transition-colors leading-none font-bold text-[#FFA229]"
                               title={`Remove ${k}`}
                             >
                               &times;
                             </button>
                           </span>
                         ))}
                         {(config.roles || []).length === 0 && (
                           <span className="text-xs text-slate-400 italic py-1 pl-1">No keywords — add one below</span>
                         )}
                       </div>
                       <div className="flex gap-2 mt-2">
                         <input
                           type="text"
                           placeholder="Type keyword & press enter..."
                           className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-[#FFA229] outline-none transition-all text-slate-800 dark:text-slate-200"
                           value={newRole}
                           onChange={(e) => setNewRole(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter' && newRole.trim()) {
                               e.preventDefault();
                               if (!(config.roles || []).includes(newRole.trim())) {
                                 setConfig({ ...config, roles: [...(config.roles || []), newRole.trim()] });
                               }
                               setNewRole("");
                             }
                           }}
                         />
                         <button
                           type="button"
                           onClick={() => {
                             if (newRole.trim() && !(config.roles || []).includes(newRole.trim())) {
                               setConfig({ ...config, roles: [...(config.roles || []), newRole.trim()] });
                               setNewRole("");
                             }
                           }}
                           className="px-3 py-1.5 bg-[#1C4670] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#2A6BA3] transition-colors shadow-sm"
                         >
                           Add
                         </button>
                       </div>
                    </div>
                 </div>
               ) : botId === 'internshala' ? (
                 <>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Target Roles</label>
                      <div className="flex flex-wrap gap-2 min-h-[36px]">
                        {(config.roles || []).map((r: string) => (
                          <span key={r} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-[#FFF2E5] dark:bg-[#1C4670]/30 border border-[#FFA229]/20 text-[#1C4670] dark:text-[#FFA229]">
                            {r}
                            <button
                              type="button"
                              onClick={() => setConfig({ ...config, roles: (config.roles || []).filter((x: string) => x !== r) })}
                              className="ml-0.5 hover:text-red-400 transition-colors leading-none font-bold text-[#FFA229]"
                              title={`Remove ${r}`}
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                        {(config.roles || []).length === 0 && (
                          <span className="text-xs text-slate-400 italic py-1 pl-1">No roles — add one below</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Type custom role & press enter..."
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-[#FFA229] outline-none transition-all text-slate-800 dark:text-slate-200"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newRole.trim()) {
                              e.preventDefault();
                              if (!(config.roles || []).includes(newRole.trim())) {
                                setConfig({ ...config, roles: [...(config.roles || []), newRole.trim()] });
                              }
                              setNewRole("");
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newRole.trim() && !(config.roles || []).includes(newRole.trim())) {
                              setConfig({ ...config, roles: [...(config.roles || []), newRole.trim()] });
                              setNewRole("");
                            }
                          }}
                          className="px-3 py-1.5 bg-[#1C4670] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#2A6BA3] transition-colors shadow-sm"
                        >
                          Add
                        </button>
                      </div>
                   </div>
                   <div className="space-y-2 pt-2">
                      <div className="flex justify-between">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Max Applications</label>
                         <span className="text-xs font-black text-[#FFA229]">{config.max_applies}</span>
                      </div>
                      <input 
                        type="range" min="1" max="100" 
                        value={config.max_applies}
                        onChange={(e)=>setConfig({...config, max_applies: parseInt(e.target.value)})}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFA229]"
                      />
                   </div>
                 </>
               ) : (
                 <>
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Target Keywords</label>
                         <div className="flex flex-wrap gap-2 min-h-[36px]">
                            {(config.roles || []).map((k: string) => (
                              <span
                                key={k}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-[#FFF2E5] dark:bg-[#1C4670]/30 border border-[#FFA229]/20 text-[#1C4670] dark:text-[#FFA229]"
                              >
                                {k}
                                <button
                                  type="button"
                                  onClick={() => setConfig({ ...config, roles: (config.roles || []).filter((x: string) => x !== k) })}
                                  className="ml-0.5 hover:text-red-400 transition-colors leading-none font-bold text-[#FFA229]"
                                  title={`Remove ${k}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {(config.roles || []).length === 0 && (
                              <span className="text-xs text-slate-400 italic py-1 pl-1">No keywords — add one below</span>
                            )}
                         </div>
                         <div className="flex gap-2 mt-2">
                           <input
                             type="text"
                             placeholder="Type custom keyword & press enter..."
                             className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-[#FFA229] outline-none transition-all text-slate-800 dark:text-slate-200"
                             value={newRole}
                             onChange={(e) => setNewRole(e.target.value)}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter' && newRole.trim()) {
                                 e.preventDefault();
                                 if (!(config.roles || []).includes(newRole.trim())) {
                                   setConfig({ ...config, roles: [...(config.roles || []), newRole.trim()] });
                                 }
                                 setNewRole("");
                               }
                             }}
                           />
                           <button
                             type="button"
                             onClick={() => {
                               if (newRole.trim() && !(config.roles || []).includes(newRole.trim())) {
                                 setConfig({ ...config, roles: [...(config.roles || []), newRole.trim()] });
                                 setNewRole("");
                               }
                             }}
                             className="px-3 py-1.5 bg-[#1C4670] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#2A6BA3] transition-colors shadow-sm"
                           >
                             Add
                           </button>
                         </div>
                      </div>
                      <div className="space-y-4 pt-2">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Location</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Remote, Bangalore"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:border-[#FFA229] outline-none transition-all text-slate-800 dark:text-slate-200"
                              value={config.location}
                              onChange={(e)=>setConfig({...config, location: e.target.value})}
                            />
                         </div>
                         <div className="space-y-2">
                            <div className="flex justify-between">
                               <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Max Pages</label>
                               <span className="text-xs font-black text-[#FFA229]">{config.max_pages}</span>
                            </div>
                            <input 
                              type="range" min="1" max="50" 
                              value={config.max_pages}
                              onChange={(e)=>setConfig({...config, max_pages: parseInt(e.target.value)})}
                              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFA229]"
                            />
                         </div>
                      </div>
                   </div>
                 </>
               )}
           </div>

           <div className="bg-gradient-to-br from-[#FFF2E5] to-[#FFA229]/10 dark:from-[#1C4670]/10 dark:to-[#FFA229]/10 border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-start gap-4 relative overflow-hidden transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                 <Activity className="w-24 h-24 text-[#1C4670]/20" />
              </div>
              <div className="relative">
                 {running ? (
                    <span className="relative flex h-5 w-5 mt-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500"></span>
                    </span>
                 ) : (
                    <Activity className="w-6 h-6 text-[#1C4670] dark:text-[#FFA229] mt-0.5 relative z-10" />
                 )}
              </div>
              <div className="relative z-10">
                 <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1.5">Status Report</h4>
                 <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                   {running ? "Process is active and monitoring network requests for job matching." : "Bot is idle. Configure parameters and launch to begin automation."}
                 </p>
              </div>
           </div>

        </div>

        {/* Terminal Panel */}
        <div className="xl:col-span-2 flex flex-col h-[600px] bg-[#0a0f1c] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative group">
           {/* Terminal Header macOS style */}
           <div className="h-12 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 absolute top-0 w-full z-20">
              <div className="flex items-center gap-2">
                 <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]"></div>
                 <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]"></div>
                 <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-50">
                 <Terminal className="w-4 h-4 text-white" />
                 <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Live_Execution_Stream</span>
              </div>
              <button 
                onClick={handleClearLogs}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear Logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
           </div>
           
           <div className="flex-1 pt-16 pb-6 px-6 font-mono text-[13px] text-[#FFA229]/80 overflow-y-auto custom-scrollbar relative z-10 w-full break-all">
              {logs.length > 0 ? (
                 <div className="space-y-1">
                   {logs.map((log, i) => (
                      <div key={i} className="flex gap-4 group">
                         <span className="text-slate-700 select-none min-w-[30px]">{i + 1}</span>
                         <span className="opacity-80 group-hover:opacity-100 transition-opacity">
                            {log.startsWith('[LAUNCH]') ? <span className="text-[#FFA229] font-black">{log}</span> : 
                             log.startsWith('[ERROR]') ? <span className="text-red-400">{log}</span> :
                             log.startsWith('[DONE]') ? <span className="text-emerald-400 uppercase font-bold">{log}</span> :
                             log}
                         </span>
                      </div>
                   ))}
                    <div ref={logEndRef} />
                 </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-60">
                   <div className="relative">
                      <div className="absolute inset-0 border-[#1C4670] rounded-full animate-ping opacity-20"></div>
                      <Activity className="w-12 h-12 mb-4 text-[#1C4670]/50" />
                   </div>
                   <p className="text-xs font-black tracking-widest uppercase text-[#1C4670]/50 dark:text-[#FFA229]/50">Awaiting Subprocess Initialization...</p>
                </div>
              )}
           </div>
           {/* Terminal background glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#1C4670]/5 blur-[100px] rounded-full pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default BotControl;
