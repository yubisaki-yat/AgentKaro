import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Briefcase, Globe, Info, CheckCircle, Clock, FileText } from 'lucide-react';

import API_BASE from '../config';


interface SettingsProps {
  email: string;
}

const Settings: React.FC<SettingsProps> = ({ email }) => {
  const [env, setEnv] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/settings?email=${email}`);
        setEnv(res.data);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    fetchSettings();
  }, [email]);

  const handleChange = (key: string, val: string) => {
    setEnv({ ...env, [key]: val });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  interface InputFieldProps {
    label: string;
    icon: React.ElementType;
    value: string;
    onChange: (val: string) => void;
    type?: string;
    placeholder?: string;
  }

  const InputField: React.FC<InputFieldProps> = ({ label, icon: Icon, value, onChange, type = "text", placeholder = "" }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    const copyToClipboard = () => {
      navigator.clipboard.writeText(value || "");
      // Optional: show a mini toast or change icon briefly
    };

    return (
      <div className="space-y-1.5 sm:space-y-2">
        <label className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{label}</label>
        <div className="relative group">
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors z-10" />
          <input 
            type={isPassword ? (showPassword ? "text" : "password") : type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-12 py-3 text-sm focus:border-indigo-500 outline-none transition-all shadow-inner text-slate-800 dark:text-slate-200"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
             {isPassword && (
               <button 
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
               >
                 <Info className="w-4 h-4" /> {/* Or an eye icon if available */}
               </button>
             )}
             <button 
               type="button"
               onClick={copyToClipboard}
               className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
             >
               <FileText className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">Core Settings</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Configure credentials and autonomous agent parameters.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Section: Internshala Credentials */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-8 space-y-6 border-indigo-200 dark:border-indigo-500/10">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                   <User className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Internshala</h3>
             </div>
             <InputField 
               label="Login Email" icon={User} 
               value={env.INTERNSHALA_EMAIL} 
               onChange={(v:string) => handleChange('INTERNSHALA_EMAIL', v)}
               placeholder="internshala@example.com"
             />
             <InputField 
               label="Login Password" icon={Lock} type="password"
               value={env.INTERNSHALA_PASSWORD} 
               onChange={(v:string) => handleChange('INTERNSHALA_PASSWORD', v)}
               placeholder="••••••••"
             />
          </motion.div>

          {/* Section: Naukri Credentials */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 sm:p-8 space-y-6 border-purple-200 dark:border-purple-500/10">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/20">
                   <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Naukri</h3>
             </div>
             <InputField 
               label="Naukri Email" icon={User} 
               value={env.NAUKRI_EMAIL} 
               onChange={(v:string) => handleChange('NAUKRI_EMAIL', v)}
               placeholder="naukri@example.com"
             />
             <InputField 
               label="Naukri Password" icon={Lock} type="password"
               value={env.NAUKRI_PASSWORD} 
               onChange={(v:string) => handleChange('NAUKRI_PASSWORD', v)}
               placeholder="••••••••"
             />
          </motion.div>

          {/* Section: Indeed Credentials */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 sm:p-8 space-y-6 border-cyan-200 dark:border-cyan-500/10">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-500/20">
                   <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Indeed</h3>
             </div>
             <InputField 
               label="Indeed Email" icon={User} 
               value={env.INDEED_EMAIL} 
               onChange={(v:string) => handleChange('INDEED_EMAIL', v)}
               placeholder="indeed@example.com"
             />
             <InputField 
               label="Indeed Password" icon={Lock} type="password"
               value={env.INDEED_PASSWORD} 
               onChange={(v:string) => handleChange('INDEED_PASSWORD', v)}
               placeholder="••••••••"
             />
          </motion.div>

          {/* Section: Outreach Configuration (SMTP) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 space-y-6 border-orange-200 dark:border-orange-500/10">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/10 rounded-lg text-orange-600 dark:text-orange-400">
                   <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">SMTP Outreach</h3>
             </div>
             <InputField 
               label="Sender Gmail" icon={User} 
               value={env.SMTP_EMAIL} 
               onChange={(v:string) => handleChange('SMTP_EMAIL', v)}
               placeholder="your-app-email@gmail.com"
             />
             <InputField 
               label="Gmail App Password" icon={Lock} type="password"
               value={env.SMTP_PASSWORD} 
               onChange={(v:string) => handleChange('SMTP_PASSWORD', v)}
               placeholder="•••• •••• •••• ••••"
             />
          </motion.div>
        </div>

        {/* Section: Bot Intelligence Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
           <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                 <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Smart Profile Metadata</h3>
              <div className="ml-auto p-2 cursor-help text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Info className="w-4 h-4" />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <InputField label="GitHub URL" icon={Globe} value={env.GITHUB_LINK} onChange={(v)=>handleChange('GITHUB_LINK', v)} />
              <InputField label="Portfolio URL" icon={Globe} value={env.PORTFOLIO_LINK} onChange={(v)=>handleChange('PORTFOLIO_LINK', v)} />
              <InputField label="LinkedIn URL" icon={Globe} value={env.LINKEDIN_LINK} onChange={(v:string)=>handleChange('LINKEDIN_LINK', v)} />
              <InputField label="Resume Absolute Path" icon={FileText} value={env.RESUME_PATH} onChange={(v:string)=>handleChange('RESUME_PATH', v)} placeholder="C:\Users\path\to\resume.pdf" />
              <InputField label="Experience (Years)" icon={Info} value={env.YEARS_OF_EXPERIENCE} onChange={(v:string)=>handleChange('YEARS_OF_EXPERIENCE', v)} />
              <InputField label="Expected CTC" icon={Info} value={env.EXPECTED_CTC} onChange={(v)=>handleChange('EXPECTED_CTC', v)} />
              <InputField label="Notice Period" icon={Clock} value={env.NOTICE_PERIOD} onChange={(v)=>handleChange('NOTICE_PERIOD', v)} />
           </div>
        </motion.div>

        {/* Global Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-8 pointer-events-none lg:ml-64">
           <div className="max-w-6xl mx-auto flex justify-center sm:justify-end">
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between shadow-2xl pointer-events-auto w-full sm:w-auto sm:min-w-[400px]"
              >
                <div className="hidden sm:flex items-center gap-3 pr-8">
                   <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <Lock className="w-4 h-4 text-indigo-500" />
                   </div>
                   <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Encrypted local storage
                   </p>
                </div>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-none px-12 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
              </motion.div>
           </div>
        </div>
      </form>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-emerald-500 text-white rounded-full font-bold flex items-center gap-3 shadow-2xl"
          >
            <CheckCircle className="w-5 h-5" />
            Settings Synchronized Successfully
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
