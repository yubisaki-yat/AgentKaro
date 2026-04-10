import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Briefcase, Globe, Info, CheckCircle, Clock, FileText } from 'lucide-react';

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
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all hover:border-[#FFA229]/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Icon className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-[9px] text-slate-400">Current: {isChecked ? "Enabled" : "Disabled"}</p>
          </div>
        </div>
        <button 
          type="button"
          onClick={() => onChange(isChecked ? "false" : "true")}
          className={`w-12 h-6 rounded-full transition-all relative ${isChecked ? 'bg-[#FFA229]' : 'bg-slate-300 dark:bg-slate-700'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isChecked ? 'right-1' : 'left-1'}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 sm:space-y-2">
      <label className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{label}</label>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600 group-focus-within:text-[#1C4670] dark:group-focus-within:text-[#FFA229] transition-colors z-10" />
        <input 
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-12 py-3 text-sm focus:border-[#FFA229] outline-none transition-all shadow-inner text-slate-800 dark:text-slate-200"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
           {isPassword && (
             <button 
               type="button"
               onClick={() => setShowPassword(!showPassword)}
               className="p-2 text-slate-400 hover:text-[#FFA229] transition-colors"
             >
               <Lock className="w-4 h-4" />
             </button>
           )}
           <button 
             type="button"
             onClick={copyToClipboard}
             className="p-2 text-slate-400 hover:text-[#FFA229] transition-colors"
           >
             <FileText className="w-4 h-4" />
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
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to synchronize settings with vault server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase italic flex items-center gap-4">
            <span className="p-2 bg-[#FFA229] rounded-xl text-white shadow-lg shadow-[#FFA229]/30"><Briefcase className="w-8 h-8"/></span>
            Core Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Configure credentials and autonomous agent parameters for legally smart automation.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section: Auth Credentials */}
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#1C4670] text-white rounded-xl shadow-lg shadow-[#1C4670]/20">
                     <User className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Internshala Access</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <InputField 
                   label="Login Email" icon={User} 
                   value={env.INTERNSHALA_EMAIL} 
                   onChange={(v) => handleChange('INTERNSHALA_EMAIL', v)}
                   placeholder="internshala@example.com"
                 />
                 <InputField 
                   label="Login Password" icon={Lock} type="password"
                   value={env.INTERNSHALA_PASSWORD} 
                   onChange={(v) => handleChange('INTERNSHALA_PASSWORD', v)}
                   placeholder="••••••••"
                 />
               </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#1C4670] text-white rounded-xl">
                     <Briefcase className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Naukri Access</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <InputField 
                   label="Login Email" icon={User} 
                   value={env.NAUKRI_EMAIL} 
                   onChange={(v) => handleChange('NAUKRI_EMAIL', v)}
                 />
                 <InputField 
                   label="Login Password" icon={Lock} type="password"
                   value={env.NAUKRI_PASSWORD} 
                   onChange={(v) => handleChange('NAUKRI_PASSWORD', v)}
                 />
               </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-cyan-600 text-white rounded-xl">
                     <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Indeed Access</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <InputField 
                   label="Login Email" icon={User} 
                   value={env.INDEED_EMAIL} 
                   onChange={(v) => handleChange('INDEED_EMAIL', v)}
                 />
                 <InputField 
                   label="Login Password" icon={Lock} type="password"
                   value={env.INDEED_PASSWORD} 
                   onChange={(v) => handleChange('INDEED_PASSWORD', v)}
                 />
               </div>
            </motion.div>
          </div>

          {/* Section: Bot Intelligence & Behavior */}
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 sm:p-8 space-y-6 border-[#FFA229]/20">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#FFA229] text-white rounded-xl shadow-lg shadow-[#FFA229]/20">
                     <Info className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Agent Intelligence Profile</h3>
               </div>
               <div className="space-y-4">
                 <InputField 
                    label="Preferred Roles (Comma Separated)" icon={Briefcase} 
                    value={env.PREFERRED_ROLES} 
                    onChange={(v) => handleChange('PREFERRED_ROLES', v)}
                    placeholder="Software Engineer, Data Analytics"
                 />
                 <InputField 
                    label="Target Locations" icon={Globe} 
                    value={env.TARGET_LOCATIONS} 
                    onChange={(v) => handleChange('TARGET_LOCATIONS', v)}
                    placeholder="Bangalore, Remote, Delhi"
                 />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField 
                      label="Max Applies Per Day" icon={CheckCircle} type="number"
                      value={env.DAILY_APPLY_LIMIT} 
                      onChange={(v) => handleChange('DAILY_APPLY_LIMIT', v)}
                      placeholder="50"
                    />
                    <InputField 
                      label="Experience (Numeric)" icon={Clock} type="number"
                      value={env.YEARS_OF_EXPERIENCE} 
                      onChange={(v) => handleChange('YEARS_OF_EXPERIENCE', v)}
                      placeholder="2"
                    />
                 </div>
               </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 sm:p-8 space-y-6">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl">
                     <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Autonomous Behavior</h3>
               </div>
               <div className="space-y-4">
                 <InputField 
                    label="Headless Mode (Background Execution)" icon={Info} 
                    value={env.BOT_HEADLESS} 
                    isToggle={true}
                    onChange={(v) => handleChange('BOT_HEADLESS', v)}
                 />
                 <InputField 
                    label="AI Resume Sync (Auto-Extraction)" icon={Info} 
                    value={env.AI_SYNC_ENABLED} 
                    isToggle={true}
                    onChange={(v) => handleChange('AI_SYNC_ENABLED', v)}
                 />
               </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 sm:p-8 space-y-6">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-600 text-white rounded-xl">
                     <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">SMTP Outreach Profile</h3>
               </div>
               <InputField 
                 label="Sender Gmail" icon={User} 
                 value={env.SMTP_EMAIL} 
                 onChange={(v) => handleChange('SMTP_EMAIL', v)}
                 placeholder="your-app-email@gmail.com"
               />
               <InputField 
                 label="Gmail App Password" icon={Lock} type="password"
                 value={env.SMTP_PASSWORD} 
                 onChange={(v) => handleChange('SMTP_PASSWORD', v)}
               />
            </motion.div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-8 pointer-events-none lg:ml-64">
           <div className="max-w-6xl mx-auto flex justify-center sm:justify-end">
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-x border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-4 flex items-center justify-between shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.1)] pointer-events-auto w-full sm:w-auto sm:min-w-[450px]"
              >
                <div className="hidden sm:flex items-center gap-3 pr-8">
                   <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Vault Protected</p>
                     <p className="text-[9px] text-slate-400">Settings are encrypted in transit</p>
                   </div>
                </div>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-none px-12 py-3.5 bg-[#FFA229] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#FFA229]/30 hover:shadow-[#FFA229]/50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Synchronizing...
                    </>
                  ) : "Save Configuration"}
                </button>
              </motion.div>
           </div>
        </div>
      </form>

      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-4 shadow-2xl shadow-emerald-500/30"
          >
            <div className="bg-white/20 p-1 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
            Settings Synchronized With Vault
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
