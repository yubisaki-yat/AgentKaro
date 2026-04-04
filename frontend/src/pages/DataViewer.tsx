import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Trash2, Filter, AlertTriangle } from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

interface DataViewerProps {
  email: string;
}

const DataViewer: React.FC<DataViewerProps> = ({ email }) => {
  const [activeTab, setActiveTab] = useState<'internshala' | 'naukri' | 'indeed' | 'company_crawler'>('internshala');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/data/${activeTab}?email=${email}`);
      setData(res.data.data);
    } catch (e) {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email) {
      fetchData();
    }
  }, [activeTab, email]);

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/data/${activeTab}?email=${email}`);
      setData([]);
      setShowConfirm(false);
    } catch (e) {
      alert("Failed to delete file");
    }
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Job Data Center</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage and export your scraped and applied job records.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
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
             className="p-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all"
             title="Clear All Data"
           >
             <Trash2 className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by job title, company, status..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 glass-card text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full justify-center">
               <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all w-full justify-center">
               <Download className="w-4 h-4" /> Export Excel
            </button>
         </div>
      </div>

      <motion.div 
        layout
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-widest">
              <tr>
                {data.length > 0 && Object.keys(data[0]).map(key => (
                  <th key={key} className="px-6 py-4">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              <AnimatePresence>
                {filteredData.map((item, idx) => (
                  <motion.tr 
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    {Object.entries(item).map(([key, val]: [string, any], vIdx) => {
                      const isLink = key.toLowerCase().includes('link');
                      const isStatus = key.toLowerCase().includes('status');
                      const isDate = key.toLowerCase().includes('at');
                      
                      return (
                        <td key={vIdx} className="px-6 py-4">
                          {isLink ? (
                             <a 
                               href={val} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs flex items-center gap-1 max-w-[200px]"
                             >
                               <span className="truncate">{val}</span>
                             </a>
                          ) : isStatus ? (
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              String(val).toLowerCase().includes('success') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              String(val).toLowerCase().includes('failed') || String(val).toLowerCase().includes('error') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {val}
                            </span>
                          ) : (
                            <span className={`line-clamp-1 ${vIdx === 0 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'} ${isDate ? 'text-[11px] font-mono' : ''}`}>
                              {String(val)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredData.length === 0 && !loading && (
                 <tr>
                    <td colSpan={10} className="px-6 py-24 text-center">
                       <div className="flex flex-col items-center opacity-40">
                          <AlertTriangle className="w-12 h-12 mb-4" />
                          <p className="text-sm font-medium">No records found matching your query.</p>
                       </div>
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
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
