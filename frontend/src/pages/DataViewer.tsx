import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Trash2, Filter, AlertTriangle } from 'lucide-react';
import Skeleton from '../components/Skeleton';

import API_BASE from '../config';


interface DataViewerProps {
  email: string;
}

const DataViewer: React.FC<DataViewerProps> = ({ email }) => {
  const [activeTab, setActiveTab] = useState<'internshala' | 'naukri' | 'indeed' | 'company_crawler'>('internshala');
  const [data, setData] = useState<Record<string, string | number | boolean | undefined>[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/data/${activeTab}?email=${email}`);
      setData(res.data.data);
    } catch {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, email]);

  useEffect(() => {
    if (email) {
      fetchData();
    }
  }, [email, fetchData]);

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/data/${activeTab}?email=${email}`);
      setData([]);
      setShowConfirm(false);
    } catch {
      alert("Failed to delete file");
    }
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Data Archive</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Manage and export your scraped and applied job records.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
           <div className="flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
             <button 
               onClick={() => setActiveTab('internshala')}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'internshala' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
             >
               Internshala
             </button>
             <button 
               onClick={() => setActiveTab('naukri')}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'naukri' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
             >
               Naukri
             </button>
             <button 
               onClick={() => setActiveTab('indeed')}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'indeed' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
             >
               Indeed
             </button>
             <button 
               onClick={() => setActiveTab('company_crawler')}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'company_crawler' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
             >
               Crawler
             </button>
           </div>
           
           <button 
             onClick={() => setShowConfirm(true)}
             className="hidden sm:flex p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
             title="Clear All Data"
           >
             <Trash2 className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-6 py-3 glass-card text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-1 sm:flex-none justify-center">
               <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex-1 sm:flex-none justify-center">
               <Download className="w-4 h-4" /> Export
            </button>
         </div>
      </div>

      <motion.div 
        layout
        className="glass-card overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
      >
        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50 dark:bg-slate-900/40 sticky top-0 z-10">
              <tr>
                {data.length > 0 && Object.keys(data[0]).map(key => (
                  <th key={key} className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[9px] font-black tracking-[0.2em]">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                 Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                  </tr>
                 ))
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredData.map((item, idx) => (
                  <motion.tr 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors group"
                  >
                    {Object.entries(item).map(([key, val], vIdx) => {
                      const isLink = key.toLowerCase().includes('link');
                      const isStatus = key.toLowerCase().includes('status');
                      const isDate = key.toLowerCase().includes('at');
                      
                      return (
                        <td key={vIdx} className="px-6 py-4 border-b border-slate-50 dark:border-slate-800/20">
                          {isLink ? (
                             <a 
                               href={String(val)} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-indigo-600 dark:text-indigo-400 hover:underline transition-all text-xs font-medium flex items-center gap-1 max-w-[200px] truncate"
                             >
                               {String(val)}
                             </a>
                          ) : isStatus ? (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border ${
                              String(val).toLowerCase().includes('success') ? 'bg-emerald-500 text-white border-emerald-600' :
                              String(val).toLowerCase().includes('failed') || String(val).toLowerCase().includes('error') ? 'bg-rose-500 text-white border-rose-600' :
                              'bg-indigo-500 text-white border-indigo-600'
                            }`}>
                              {val}
                            </span>
                          ) : (
                            <span className={`line-clamp-1 ${vIdx === 0 ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'} ${isDate ? 'text-[11px] font-mono opacity-60' : ''}`}>
                              {String(val)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800/50 min-h-[400px]">
           {loading ? (
             <div className="p-4 space-y-4">
                <Skeleton className="h-48 w-full" count={3} />
             </div>
           ) : (
             <AnimatePresence mode="popLayout">
               {filteredData.map((item, idx) => (
               <motion.div 
                 key={idx}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="p-5 flex flex-col gap-4 bg-white dark:bg-transparent"
               >
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                           {String(Object.values(item)[0])}
                        </h3>
                        {Object.keys(item).length > 1 && (
                          <p className="text-xs font-semibold text-slate-500">
                             {String(Object.values(item)[1])}
                          </p>
                        )}
                     </div>
                     {Object.entries(item).find(([k]) => k.toLowerCase().includes('status')) && (
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          String(Object.entries(item).find(([k]) => k.toLowerCase().includes('status'))?.[1]).toLowerCase().includes('success') 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-slate-400'
                        }`}>
                          {String(Object.entries(item).find(([k]) => k.toLowerCase().includes('status'))?.[1])}
                        </span>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                     {Object.entries(item).slice(2, 6).map(([key, val], vIdx) => (
                        <div key={vIdx} className="space-y-1">
                           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">{key}</span>
                           <span className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1">{String(val)}</span>
                        </div>
                     ))}
                  </div>

                  {Object.entries(item).find(([k]) => k.toLowerCase().includes('link')) && (
                     <a 
                       href={String(Object.entries(item).find(([k]) => k.toLowerCase().includes('link'))?.[1])} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="w-full py-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 shadow-sm"
                     >
                       View Original Posting
                     </a>
                  )}
               </motion.div>
             ))}
           </AnimatePresence>
           )}
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="px-6 py-24 text-center">
             <div className="flex flex-col items-center opacity-40">
                <AlertTriangle className="w-12 h-12 mb-4 text-indigo-500 animate-pulse" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">Zero matches found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
             </div>
          </div>
        )}
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 text-red-500 dark:text-red-400 mb-6">
                 <div className="p-3 bg-red-100 dark:bg-red-500/10 rounded-xl">
                   <AlertTriangle className="w-8 h-8" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Job Data?</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
                 </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-8">
                You are about to delete the historical records for <span className="font-bold text-slate-900 dark:text-white uppercase">{activeTab}</span>. 
                The Excel file will be permanently removed from the server.
              </p>
              <div className="flex gap-4">
                 <button 
                   onClick={() => setShowConfirm(false)}
                   className="flex-1 px-4 py-3 glass-card hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-slate-700 dark:text-slate-200"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleDelete}
                   className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-red-500/20 hover:bg-red-600 transition-colors"
                 >
                   Delete Forever
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataViewer;
