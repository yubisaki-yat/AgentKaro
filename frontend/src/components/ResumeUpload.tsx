import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Search, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import API_BASE from '../config';

interface ResumeUploadProps {
  onSearchInitiated?: (keywords: string[]) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onSearchInitiated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setExtractedKeywords([]);
    }
  };

  const uploadResume = async () => {
    if (!file) return;

    const email = localStorage.getItem('user_email');
    if (!email) {
      console.error("User email not found in localStorage");
      setStatus('error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);

    try {
      const response = await axios.post(`${API_BASE}/upload-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 'success') {
        setExtractedKeywords(response.data.keywords);
        setStatus('success');
      }
    } catch (error) {
      console.error("Upload failed", error);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const startSearch = (target: 'naukri' | 'internshala') => {
    if (extractedKeywords.length > 0) {
      if (target === 'naukri') {
        const topKeyword = extractedKeywords[0];
        navigate(`/naukri?keyword=${encodeURIComponent(topKeyword)}`);
      } else {
        const topRoles = extractedKeywords.slice(0, 3).join(',');
        navigate(`/internshala?roles=${encodeURIComponent(topRoles)}`);
      }
      if (onSearchInitiated) onSearchInitiated(extractedKeywords);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-10 border border-slate-200/50 dark:border-white/5 relative overflow-hidden group shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#1C4670] via-transparent to-[#FFA229] opacity-[0.03]" />
      
      <div className="relative z-10 flex items-center gap-4 mb-10">
        <div className="p-3 bg-[#FFA229]/10 rounded-2xl shadow-lg shadow-[#FFA229]/10">
          <Sparkles className="w-5 h-5 text-[#FFA229]" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-0.5">Resume Intelligence</h2>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Autonomous Skill Extraction Engine</p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Upload Column */}
        <div className="space-y-6">
          <label className="block">
            <div className={`
              border-2 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center justify-center cursor-pointer
              transition-all duration-500 group relative overflow-hidden
              ${file 
                ? 'border-emerald-500/30 bg-emerald-500/[0.03]' 
                : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:border-[#FFA229]/40 hover:bg-[#FFA229]/5'}
            `}>
              <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx" />
              {file ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <FileText className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight mb-2 truncate max-w-[200px] mx-auto">{file.name}</p>
                  <button 
                    onClick={(e) => { e.preventDefault(); setFile(null); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <X className="w-3 h-3" /> Remove Node
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-slate-200/50 dark:border-white/10 group-hover:scale-110 transition-transform shadow-sm">
                    <Upload className="w-7 h-7 text-slate-400 group-hover:text-[#FFA229] transition-colors" />
                  </div>
                  <p className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Initialize Node Upload</p>
                  <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter italic opacity-60">PDF / DOCX - Enterprise Standard</p>
                </>
              )}
            </div>
          </label>

          <button
            onClick={uploadResume}
            disabled={!file || uploading}
            className={`
              w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all
              ${!file || uploading 
                ? 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-white/5' 
                : 'bg-[#1C4670] text-white shadow-xl shadow-[#1C4670]/20 hover:scale-[1.02] active:scale-95'}
            `}
          >
            {uploading ? (
              <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Commit to Neural Analysis</span>
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Intelligence Column */}
        <div className="glass-card bg-slate-50 dark:bg-white/[0.02] p-8 flex flex-col border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-inner">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              Neural Extractions
              {status === 'success' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
            </h3>
            {status === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
          </div>

          <div className="flex-1 min-h-[160px]">
            <AnimatePresence mode='popLayout'>
              {extractedKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {extractedKeywords.map((kw, i) => (
                      <motion.span
                        key={kw}
                        initial={{ opacity: 0, scale: 0.8, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-4 py-2 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:border-[#FFA229]/40 hover:text-[#FFA229] transition-all cursor-default"
                      >
                        {kw}
                      </motion.span>
                  ))}
                </div>
              ) : status === 'error' ? (
                <div className="h-full flex flex-col items-center justify-center text-rose-500/80 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 opacity-20" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Protocol Failure</p>
                    <p className="text-[9px] mt-1 font-bold uppercase tracking-tighter opacity-60">Neural bridge synchronization failed.</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400/50 text-center space-y-4">
                  <Search className="w-12 h-12 opacity-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest max-w-[140px]">Awaiting analysis initialization</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {extractedKeywords.length > 0 && (
            <div className="mt-10 grid grid-cols-2 gap-4">
              <button
                onClick={() => startSearch('naukri')}
                className="py-4 bg-[#1C4670] text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-xl shadow-[#1C4670]/20 transition-all text-[9px]"
              >
                <Search className="w-4 h-4" />
                Naukri
              </button>
              <button
                onClick={() => startSearch('internshala')}
                className="py-4 bg-[#FFA229] text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-xl shadow-[#FFA229]/20 transition-all text-[9px]"
              >
                <Sparkles className="w-4 h-4" />
                Internshala
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ResumeUpload;
