import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Search, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
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
      className="glass-card p-8 border-slate-200 dark:border-slate-800 bg-[#FFF2E5]/30 dark:bg-[#1C4670]/5 overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#FFF2E5] dark:bg-[#1C4670]/20 rounded-lg">
          <Sparkles className="w-5 h-5 text-[#FFA229] dark:text-[#FFA229]" />
        </div>
        <h2 className="text-xl font-black text-[#1C4670] dark:text-white tracking-tight uppercase">AI Resume Search</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-4">
          <label className="block">
            <div className={`
              border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer
              transition-all duration-300 group
              ${file ? 'border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/5' : 'border-slate-300 dark:border-slate-700 hover:border-[#FFA229] dark:hover:border-[#FFA229]/50 hover:bg-[#FFF2E5] dark:hover:bg-[#1C4670]/10'}
            `}>
              <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx" />
              {file ? (
                <>
                  <FileText className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mb-2" />
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{file.name}</p>
                  <button 
                    onClick={(e) => { e.preventDefault(); setFile(null); }}
                    className="mt-2 text-xs text-slate-500 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 group-hover:text-[#FFA229] dark:group-hover:text-[#FFA229] group-hover:scale-110 transition-all mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click to upload resume</p>
                  <p className="text-xs text-slate-500 mt-1">PDF or DOCX supported</p>
                </>
              )}
            </div>
          </label>

          <button
            onClick={uploadResume}
            disabled={!file || uploading}
            className={`
              w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all
              ${!file || uploading 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                : 'bg-[#FFA229] text-white shadow-lg shadow-[#FFA229]/20 hover:scale-[1.02] active:scale-[0.98]'}
            `}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Analyze with AI</>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="glass-card bg-slate-50 dark:bg-slate-900/50 p-6 flex flex-col border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            Extracted Keywords
            {status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
            {status === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />}
          </h3>

          <div className="flex-1 min-h-[120px]">
            <AnimatePresence mode='popLayout'>
              {extractedKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {extractedKeywords.map((kw, i) => (
                      <motion.span
                        key={kw}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-3 py-1 bg-[#FFF2E5] dark:bg-[#1C4670]/30 text-[#1C4670] dark:text-[#FFA229] border border-[#FFA229]/20 rounded-full text-[10px] font-black uppercase tracking-wider"
                      >
                        {kw}
                      </motion.span>
                  ))}
                </div>
              ) : status === 'error' ? (
                <div className="h-full flex flex-col items-center justify-center text-rose-500 text-center">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-80" />
                  <p className="text-xs font-bold uppercase tracking-tight">AI Extraction Failed</p>
                  <p className="text-[10px] mt-1 opacity-70">Check internet connection or<br/>try a different file format.</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 text-center">
                  <Search className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">Upload your resume to see<br/>extracted skills and keywords.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {extractedKeywords.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => startSearch('naukri')}
                className="py-3 bg-[#FFF2E5] dark:bg-[#1C4670]/20 text-[#1C4670] dark:text-[#FFA229] border border-[#FFA229]/20 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#FFA229]/10 transition-all text-[10px]"
              >
                <Search className="w-4 h-4" />
                Naukri
              </button>
              <button
                onClick={() => startSearch('internshala')}
                className="py-3 bg-[#1C4670] text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#2A6BA3] transition-all text-[10px] shadow-lg shadow-[#1C4670]/20"
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
