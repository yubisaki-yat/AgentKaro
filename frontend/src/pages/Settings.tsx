import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Briefcase, Globe, Info, CheckCircle, Clock, FileText, Save, Shield, Settings2, Database, Brain } from 'lucide-react';

import API_BASE from '../config';

interface SettingsProps {
  email: string;
}

interface InputFieldProps {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  isToggle?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon: Icon, value, onChange, type = "text", placeholder = "", isToggle = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value || "");
  };

  if (isToggle) {
    const isChecked = value === "true" || value === true;
    return (
      <div className="flex items-center justify-between p-5 bg-white dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 transition-all hover:border-[#FFA229]/30 group">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-xl group-hover:bg-[#FFA229]/10 transition-colors">
            <Icon className="w-4 h-4 text-slate-500 group-hover:text-[#FFA229] transition-colors" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{isChecked ? "Active" : "Inactive"}</p>
          </div>
        </div>
        <button 
          type="button"
          onClick={() => onChange(isChecked ? "false" : "true")}
          className={`w-12 h-6 rounded-full transition-all relative ${isChecked ? 'bg-[#FFA229]' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
          <motion.div 
            animate={{ x: isChecked ? 24 : 4 }}
            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
          />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors">
          <Icon className="w-4 h-4 text-slate-400 group-focus-within:text-[#FFA229]" />
        </div>
        <input 
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl pl-12 pr-12 py-3.5 text-xs font-bold focus:border-[#FFA229] outline-none transition-all text-slate-800 dark:text-slate-200 shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
           {isPassword && (
             <button 
               type="button"
               onClick={() => setShowPassword(!showPassword)}
               className="p-2 text-slate-400 hover:text-[#FFA229] transition-colors"
             >
               <Lock className="w-3.5 h-3.5" />
             </button>
           )}
           <button 
             type="button"
             onClick={copyToClipboard}
             className="p-2 text-slate-400 hover:text-[#FFA229] transition-colors"
           >
             <FileText className="w-3.5 h-3.5" />
           </button>
        </div>
      </div>
    </div>
  );
};

const Settings: React.FC<SettingsProps> = ({ email }) => {
  const [env, setEnv] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/settings?email=${email}`);
        setEnv(res.data || {});
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    fetchSettings();
  }, [email]);

  const handleChange = (key: string, val: any) => {
    setEnv(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/settings`, {
        email: email,
        data: env
      }, { timeout: 30000 });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err: any) {
      console.error("Save failed:", err);
      alert(`Save Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-10 max-w-7xl mx-auto pb-40">
      {/* Header */}
      <div className="relative p-8 glass-card overflow-hidden group border border-slate-200/50 dark:border-white/5 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C4670] via-transparent to-[#FFA229] opacity-[0.03]" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-1">Command Center</h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFA229] animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">System Configuration & Logic</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <Settings2 className="w-12 h-12 text-slate-200 dark:text-white/10" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Credentials */}
        <div className="lg:col-span-7 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 border border-slate-200/50 dark:border-white/5 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Database className="w-32 h-32" />
            </div>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-[#1C4670] rounded-xl text-white shadow-lg shadow-[#1C4670]/20">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Authentication Matrix</h3>
            </div>

            <div className="space-y-10">
              {/* Platform Groups */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-[#FFA229] rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internshala Access</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Identity Email" icon={User} value={env.INTERNSHALA_EMAIL} onChange={(v) => handleChange('INTERNSHALA_EMAIL', v)} />
                  <InputField label="Secret Key" icon={Lock} type="password" value={env.INTERNSHALA_PASSWORD} onChange={(v) => handleChange('INTERNSHALA_PASSWORD', v)} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-[#1C4670] rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Naukri Access</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Identity Email" icon={User} value={env.NAUKRI_EMAIL} onChange={(v) => handleChange('NAUKRI_EMAIL', v)} />
                  <InputField label="Secret Key" icon={Lock} type="password" value={env.NAUKRI_PASSWORD} onChange={(v) => handleChange('NAUKRI_PASSWORD', v)} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-cyan-500 rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Indeed Access</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Identity Email" icon={User} value={env.INDEED_EMAIL} onChange={(v) => handleChange('INDEED_EMAIL', v)} />
                  <InputField label="Secret Key" icon={Lock} type="password" value={env.INDEED_PASSWORD} onChange={(v) => handleChange('INDEED_PASSWORD', v)} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Intelligence */}
        <div className="lg:col-span-5 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 border border-slate-200/50 dark:border-white/5 shadow-xl relative overflow-hidden h-full"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Brain className="w-32 h-32" />
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-[#FFA229] rounded-xl text-white shadow-lg shadow-[#FFA229]/20">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Neural Parameters</h3>
            </div>

            <div className="space-y-8">
              <InputField label="Preferred Career Roles" icon={Briefcase} value={env.PREFERRED_ROLES} onChange={(v) => handleChange('PREFERRED_ROLES', v)} placeholder="e.g. Software Engineer, AI Developer" />
              <InputField label="Target Geographies" icon={Globe} value={env.TARGET_LOCATIONS} onChange={(v) => handleChange('TARGET_LOCATIONS', v)} placeholder="e.g. Remote, Bangalore, London" />
              
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Daily Apply Cap" icon={CheckCircle} type="number" value={env.DAILY_APPLY_LIMIT} onChange={(v) => handleChange('DAILY_APPLY_LIMIT', v)} />
                <InputField label="Seniority Level" icon={Clock} type="number" value={env.YEARS_OF_EXPERIENCE} onChange={(v) => handleChange('YEARS_OF_EXPERIENCE', v)} />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                <InputField label="Precision Filtering" icon={CheckCircle} value={env.STRICT_FILTERING} isToggle onChange={(v) => handleChange('STRICT_FILTERING', v)} />
                <InputField label="Background Operations" icon={Brain} value={env.BACKGROUND_MODE} isToggle onChange={(v) => handleChange('BACKGROUND_MODE', v)} />
              </div>
            </div>
          </motion.div>
        </div>
      </form>

      {/* Floating Save Actions */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-white dark:bg-[#0a0d14] p-3 rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] flex items-center gap-4"
        >
          <div className="px-6 py-3 border-r border-slate-100 dark:border-white/5 hidden sm:block">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Encrypted Sync</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 px-10 py-4 bg-[#1C4670] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#1C4670]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Syncing...' : 'Commit Changes'}
          </button>
        </motion.div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-[#1C4670] text-white rounded-2xl border border-white/20 shadow-2xl flex items-center gap-4"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest">Success</p>
              <p className="text-xs font-bold opacity-80 uppercase tracking-tight">Configuration Synchronized</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Internal icon for loading
const RefreshCw = ({ className, size = 16 }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} height={size} 
    viewBox="0 0 24 24" fill="none" 
    stroke="currentColor" strokeWidth="2" 
    strokeLinecap="round" strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

export default Settings;
