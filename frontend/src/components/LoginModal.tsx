import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Chrome, Github, AlertCircle, Mail, Lock, RefreshCw, ArrowRight, Shield, Zap, CheckCircle2 } from 'lucide-react';

// Defensive icon wrapper
const SafeIcon = ({ icon: Icon, size = 16, className = "" }: { icon: any, size?: number, className?: string }) => {
    if (!Icon) return <div className={`w-${Math.ceil(size/4)} h-${Math.ceil(size/4)} bg-slate-400/20 rounded-sm`} />;
    return <Icon size={size} className={className} />;
};
import axios from 'axios';
import API_BASE from '../config';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, subscription: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = isRegister ? '/register' : '/identify';
      const res = await axios.post(`${API_BASE}${endpoint}`, { email, password });
      
      if (res.data.email) {
        setSuccess(true);
        setTimeout(() => {
          localStorage.setItem('user_email', res.data.email);
          localStorage.setItem('user_sub', res.data.subscription || 'free');
          onLogin(res.data.email, res.data.subscription || 'free');
          setLoading(false);
          setSuccess(false);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSocialLogin = (platform: 'google' | 'github') => {
    // In a real app, this would redirect to OAuth flow
    // For now, we'll just show an alert or placeholder logic
    alert(`${platform} login is coming soon to the production build!`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0d14]/90 backdrop-blur-2xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-[3rem] border border-white/10 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Top Branding / Close */}
            <div className="absolute top-8 right-8 z-20">
               <button 
                 onClick={onClose}
                 className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-500"
               >
                 <SafeIcon icon={X} size={20} />
               </button>
            </div>

            {/* Content Area */}
            <div className="relative z-10 px-10 py-14 sm:px-14">
               {/* Header */}
               <div className="text-center mb-12 space-y-4">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto shadow-2xl border border-slate-200 dark:border-white/10 p-4 transition-all hover:scale-110">
                     <img src="/logo.png" alt="AgentsKaro" className="w-full h-full object-contain" />
                  </div>
                  <div className="space-y-1">
                     <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
                        {isRegister ? 'Create Profile' : 'Access Vault'}
                     </h2>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
                        {isRegister ? 'Join the autonomous workforce' : 'Resume Neural Connection'}
                     </p>
                  </div>
               </div>

               {success ? (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="py-12 text-center space-y-6"
                 >
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                       <SafeIcon icon={CheckCircle2} size={48} className="text-emerald-500" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white uppercase tracking-tight">Identity Verified</h3>
                       <p className="text-slate-500 text-sm mt-1 font-medium">Synchronizing your workspace...</p>
                    </div>
                 </motion.div>
               ) : (
                 <div className="space-y-8">
                    {/* Social Logins */}
                    <div className="grid grid-cols-2 gap-4">
                       <button 
                         onClick={() => handleSocialLogin('google')}
                         className="flex items-center justify-center gap-3 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group"
                       >
                          <SafeIcon icon={Chrome} size={18} className="text-brand-secondary group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Google</span>
                       </button>
                       <button 
                         onClick={() => handleSocialLogin('github')}
                         className="flex items-center justify-center gap-3 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group"
                       >
                          <SafeIcon icon={Github} size={18} className="text-slate-800 dark:text-white group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">GitHub</span>
                       </button>
                    </div>

                    <div className="relative">
                       <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200 dark:border-white/5" />
                       </div>
                       <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.3em]">
                          <span className="px-4 bg-white dark:bg-[#0f172a] text-slate-400">OR CONTINUE WITH EMAIL</span>
                       </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                       {error && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500"
                          >
                             <SafeIcon icon={AlertCircle} size={18} />
                             <span className="text-[11px] font-bold tracking-tight">{error}</span>
                          </motion.div>
                       )}

                       <div className="space-y-4">
                          <div className="relative group">
                             <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-slate-100 dark:bg-white/5 rounded-xl group-focus-within:bg-brand-primary/10 transition-colors">
                                <SafeIcon icon={Mail} size={16} className="text-slate-400 group-focus-within:text-brand-primary" />
                             </div>
                             <input 
                               type="email" 
                               required
                               placeholder="Email Address"
                               className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl pl-16 pr-6 py-4.5 text-sm font-bold focus:border-brand-primary outline-none transition-all dark:text-white"
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                             />
                          </div>

                          <div className="relative group">
                             <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-slate-100 dark:bg-white/5 rounded-xl group-focus-within:bg-brand-primary/10 transition-colors">
                                <SafeIcon icon={Lock} size={16} className="text-slate-400 group-focus-within:text-brand-primary" />
                             </div>
                             <input 
                               type="password" 
                               required
                               placeholder="Vault Password"
                               className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl pl-16 pr-6 py-4.5 text-sm font-bold focus:border-brand-primary outline-none transition-all dark:text-white"
                               value={password}
                               onChange={(e) => setPassword(e.target.value)}
                             />
                          </div>
                       </div>

                       <button 
                         disabled={loading}
                         type="submit"
                         className="w-full py-5 bg-gradient-to-r from-brand-primary to-[#2D3748] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                       >
                          {loading ? (
                             <SafeIcon icon={RefreshCw} size={20} className="animate-spin" />
                          ) : (
                             <>
                                {isRegister ? 'Initialize Account' : 'Decrypt Vault'}
                                <SafeIcon icon={ArrowRight} size={18} />
                             </>
                          )}
                       </button>
                    </form>

                    {/* Footer */}
                    <div className="flex flex-col items-center gap-6">
                       <button 
                         onClick={() => setIsRegister(!isRegister)}
                         className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-primary transition-colors"
                       >
                          {isRegister ? 'Already have credentials? Access Vault' : 'New operator? Initialize profile'}
                       </button>

                       <div className="flex items-center gap-6 opacity-30">
                          <div className="flex items-center gap-2">
                             <SafeIcon icon={Shield} size={12} className="text-emerald-500" />
                             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">AES-256</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <SafeIcon icon={Zap} size={12} className="text-amber-500" />
                             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Low Latency</span>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>

            {/* Bottom Accent */}
            <div className="h-2 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
