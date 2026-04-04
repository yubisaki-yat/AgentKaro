import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Search, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = "http://localhost:8000/api";

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

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

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
      className="glass-card p-8 border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
          <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">AI Resume Search</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-4">
          <label className="block">
            <div className={`
              border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer
              transition-all duration-300 group
              ${file ? 'border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/5' : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/5'}
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
                  <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:scale-110 transition-all mb-2" />
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
              w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
              ${!file || uploading 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                : 'premium-gradient text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]'}
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
                      className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 rounded-full text-xs font-medium"
                    >
                      {kw}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
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
                className="py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all text-xs"
              >
                <Search className="w-4 h-4" />
                Naukri Search
              </button>
              <button
                onClick={() => startSearch('internshala')}
                className="py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all text-xs"
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
