import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  Search, 
  Database, 
  Settings as SettingsIcon, 
  Rocket,
  Activity,
  User,
  Globe,
  Moon,
  Sun,
  Shield,
  Sparkles,
  CheckCircle,
  RefreshCw,
  LogOut,
  Mail,
  Lock,
  X,
  Menu,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Import real pages
import Dashboard from './pages/Dashboard';
import AIJobSearch from './pages/AIJobSearch';
import BotControl from './pages/BotControl';
import DataViewer from './pages/DataViewer';
import Settings from './pages/Settings';
import SubscriptionModal from './components/SubscriptionModal';

import API_BASE from './config';

const GITHUB_CLIENT_ID = "Ov23ligAAnZRWykTyl4N";
const GOOGLE_CLIENT_ID = "814076574511-cagqln83fbsa02vkou5fj0cr54dhjd23.apps.googleusercontent.com";

const App: React.FC = () => {
  const [status, setStatus] = useState<Record<string, { running: boolean; elapsed: string }>>({ 
    internshala: { running: false, elapsed: "00:00:00" }, 
    naukri: { running: false, elapsed: "00:00:00" },
    indeed: { running: false, elapsed: "00:00:00" },
    company_crawler: { running: false, elapsed: "00:00:00" }
  });
  const [isDark, setIsDark] = useState(false);
  const [email, setEmail] = useState<string>(localStorage.getItem('user_email') || "");
  const [subscription, setSubscription] = useState<string>(localStorage.getItem('user_sub') || "free");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false); // Default false for guest mode
  const [tempEmail, setTempEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identifying, setIdentifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [errorHeader, setErrorHeader] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/status?email=${email}`);
        setStatus(res.data.status);
        if (res.data.subscription) {
          setSubscription(res.data.subscription);
        }
      } catch (err) {
        console.error("Status fetch failed", err);
      }
    };
    if (email) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [email]);

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempEmail) return;
    setIdentifying(true);
    setErrorHeader("");
    try {
      const endpoint = isRegistering ? '/register' : '/identify';
      const res = await axios.post(`${API_BASE}${endpoint}`, { 
        email: tempEmail,
        password: password || null
      });
      
      if (isRegistering) {
        setIsRegistering(false);
        setSyncSuccess(true);
        setTimeout(() => {
          setEmail(tempEmail);
          setSubscription(res.data.subscription || "free");
          setShowIdentityModal(false);
          setIdentifying(false);
          setSyncSuccess(false);
          setPassword("");
          localStorage.setItem('user_email', tempEmail);
          localStorage.setItem('user_sub', res.data.subscription || "free");
        }, 1500);
        return;
      }

      localStorage.setItem('user_email', tempEmail);
      localStorage.setItem('user_sub', res.data.subscription);
      
      setSyncSuccess(true);
      setTimeout(() => {
        setEmail(tempEmail);
        setSubscription(res.data.subscription);
        setShowIdentityModal(false);
        setIdentifying(false);
        setSyncSuccess(false);
        setPassword("");
      }, 1500);
    } catch (err) {
      const axiosError = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      const status = axiosError.response?.status;
      const detail = axiosError.response?.data?.detail;
      const message = axiosError.message;

      if (status === 404) {
        setErrorHeader(detail || `API Error (404): Resource not found at ${API_BASE}`);
      } else if (status === 500) {
        setErrorHeader(detail || `Server Error (500): ${message}`);
      } else if (message === "Network Error") {
        setErrorHeader(`Network Error: Failed to reach Backend at ${API_BASE}. Ensure VITE_API_URL is set in Render.`);
      } else {
        setErrorHeader(detail || `Error: ${message}`);
      }
      setIdentifying(false);
    }
  };

  const handleGoogleLogin = async (response: { credential?: string }) => {
    if (!response.credential) return;
    setIdentifying(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/google`, { 
        token: response.credential 
      });
      
      localStorage.setItem('user_email', res.data.email);
      localStorage.setItem('user_sub', res.data.subscription);
      
      setSyncSuccess(true);
      setTimeout(() => {
        setEmail(res.data.email);
        setSubscription(res.data.subscription);
        setShowIdentityModal(false);
        setIdentifying(false);
        setSyncSuccess(false);
      }, 1500);
    } catch (err) {
      const axiosError = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      const status = axiosError.response?.status;
      const message = axiosError.message;
      if (status === 404) {
        setErrorHeader(`Google login failed (404): Endpoint missing at ${API_BASE}`);
      } else if (message === "Network Error") {
        setErrorHeader(`Network Error: Failed to reach Backend at ${API_BASE}. Ensure VITE_API_URL is set in Render.`);
      } else {
        setErrorHeader(`Google login failed: ${message}`);
      }
      setIdentifying(false);
    }
  };

  const handleGitHubLogin = () => {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email`;
  };

  useEffect(() => {
    // 1. Handle GitHub Callback
    const urlParams = new URLSearchParams(window.location.search);
    const githubCode = urlParams.get('code');
    if (githubCode) {
       // Clear code from URL immediately
       window.history.replaceState({}, document.title, "/");
       
       const loginViaGithub = async (code: string) => {
         setIdentifying(true);
         setShowIdentityModal(true);
         try {
           const res = await axios.post(`${API_BASE}/auth/github`, { code });
           localStorage.setItem('user_email', res.data.email);
           localStorage.setItem('user_sub', res.data.subscription);
           setSyncSuccess(true);
           setTimeout(() => {
             setEmail(res.data.email);
             setSubscription(res.data.subscription);
             setShowIdentityModal(false);
             setIdentifying(false);
             setSyncSuccess(false);
           }, 1500);
         } catch {
           setErrorHeader("GitHub login failed. Refresh and try again.");
           setIdentifying(false);
         }
       };
       loginViaGithub(githubCode);
    }

    const handleOpenLogin = () => setShowIdentityModal(true);
    window.addEventListener('open-login', handleOpenLogin);
    
    // 2. Initialize Google Identity
    const initGoogle = () => {
      interface GoogleGSI {
        accounts: {
          id: {
            initialize: (config: { client_id: string; callback: (resp: { credential?: string }) => void }) => void;
            renderButton: (parent: HTMLElement | null, options: object) => void;
          };
        };
      }
      const google = (window as unknown as { google?: GoogleGSI }).google;

      if (google?.accounts?.id && showIdentityModal) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin
        });
        
        setTimeout(() => {
          const btnContainer = document.getElementById("google-login-button");
          if (btnContainer) {
            google.accounts.id.renderButton(
              btnContainer,
              { 
                theme: "filled_blue", 
                size: "large", 
                width: 320, // Precise pixel width for perfect alignment
                shape: "pill",
                text: "signin_with"
              }
            );
          }
        }, 100);
      }
    };

    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      initGoogle();
    }

    return () => window.removeEventListener('open-login', handleOpenLogin);
  }, [showIdentityModal]);

  const handleLogout = () => {
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_sub');
    setEmail("");
    setSubscription("free");
    setTempEmail("");
    setPassword("");
    setStatus({ 
        internshala: { running: false, elapsed: "00:00:00" }, 
        naukri: { running: false, elapsed: "00:00:00" },
        indeed: { running: false, elapsed: "00:00:00" },
        company_crawler: { running: false, elapsed: "00:00:00" }
    });
    setShowIdentityModal(true);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI Resume Search', path: '/ai-search', icon: Sparkles },
    { name: 'Internshala Bot', path: '/internshala', icon: Bot },
    { name: 'Naukri Scraper', path: '/naukri', icon: Search },
    { name: 'Indeed Bot', path: '/indeed', icon: Globe },
    { name: 'Company Crawler', path: '/company-crawler', icon: Rocket },
    { name: 'Job Data', path: '/data', icon: Database },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const isPremium = subscription !== 'free';

  return (
    <div className="flex h-screen bg-white dark:bg-[#0a0d14] text-slate-800 dark:text-slate-200 overflow-hidden font-sans selection:bg-[#FFA229]/30 transition-colors duration-300">
      {/* Mobile Header - Visible only on small screens */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-[60] shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-[#1C4670] to-[#2A6BA3] rounded-xl flex items-center justify-center shadow-lg shadow-[#1C4670]/20 rotate-3">
             <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter text-[#1C4670] dark:text-white leading-none uppercase">Agents<span className="text-[#FFA229]">Karo</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setIsDark(!isDark)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-[#1C4670]" />}
            </button>
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
            >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Responsive Drawer */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 w-72 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex flex-col z-[80] transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-7">
          <div className="flex items-center gap-4 mb-10 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1C4670] to-[#2A6BA3] rounded-[18px] flex items-center justify-center shadow-xl shadow-slate-200 dark:shadow-none group-hover:rotate-12 transition-transform duration-500">
                <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFA229] rounded-full border-4 border-white dark:border-[#0f172a] z-10" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter text-[#1C4670] dark:text-white leading-none">
                AGENTS<span className="text-[#FFA229]">KARO</span>
              </h1>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1C4670]/80 dark:text-slate-400 mt-1.5 block">Legally Smart Automation</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group
                    ${location.pathname === item.path 
                      ? 'bg-[#1C4670] text-white shadow-lg shadow-[#1C4670]/25' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-[#1C4670] dark:hover:text-[#FFA229]'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${location.pathname === item.path ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="flex-1 tracking-tight">{item.name}</span>
                  {location.pathname === item.path && <ChevronRight className="w-4 h-4 opacity-50" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
           {/* Bot Status Summary */}
           <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Node Status</span>
                 </div>
                 {isPremium && (
                    <span className="px-2 py-0.5 bg-[#FFA229]/10 text-[#FFA229] text-[10px] font-black uppercase tracking-widest rounded-lg border border-[#FFA229]/20">
                      Lifetime
                    </span>
                 )}
              </div>
              
              {!email ? (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">You are currently in view-only guest mode.</p>
                  <button 
                    onClick={() => setShowIdentityModal(true)}
                    className="w-full py-2 bg-[#1C4670] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-[#1C4670]/20"
                  >
                    Get Started / Login
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                     <Activity className="w-4 h-4 text-emerald-500" />
                     <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Status</span>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300">Internshala:</span>
                        <span className={status.internshala?.running ? 'text-emerald-600 dark:text-green-400 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                          {status.internshala?.running ? 'Running' : 'Stopped'}
                        </span>
                     </div>
                     <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300">Naukri:</span>
                        <span className={status.naukri?.running ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                          {status.naukri?.running ? 'Running' : 'Stopped'}
                        </span>
                     </div>
                     {!isPremium && (
                       <button 
                         onClick={() => setShowSubscriptionModal(true)}
                         className="w-full mt-3 py-2 bg-[#FFA229] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-[#FFA229]/20"
                       >
                         Upgrade Now
                       </button>
                     )}
                  </div>
                </>
              )}
           </div>
            {email && (
              <div className="mt-6 flex items-center justify-center gap-6 text-slate-400 dark:text-slate-500 pb-2">
                 <button 
                   onClick={handleLogout}
                   className="flex items-center gap-2 hover:text-red-500 transition-colors group"
                 >
                   <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-bold uppercase tracking-wider">Sign Out</span>
                 </button>
              </div>
            )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-auto custom-scrollbar bg-slate-50 dark:bg-transparent pt-16 lg:pt-0">
        <header className="hidden lg:flex sticky top-0 w-full h-16 bg-white/80 dark:bg-[#0a0d14]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 items-center justify-between px-8 z-40 transition-colors duration-300">
           <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {location.pathname === '/' ? 'Home' : location.pathname.substring(1).split('/')[0].toUpperCase()}
              </span>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900/50 rounded-lg border border-emerald-200 dark:border-emerald-500/20 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm dark:shadow-none">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                API Pulse Online
              </div>
              <button 
                onClick={() => setIsDark(!isDark)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-[#1C4670]" />}
              </button>
           </div>
        </header>

        <div className="relative z-10 p-4 md:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route path="/" element={<Dashboard email={email} subscription={isPremium ? 'lifetime' : subscription} status={status} />} />
                <Route path="/ai-search" element={<AIJobSearch subscription={isPremium ? 'lifetime' : subscription} onUpgrade={() => setShowSubscriptionModal(true)} />} />
                <Route 
                  path="/internshala" 
                  element={<BotControl botId="internshala" title="Internshala Bot" icon={Bot} color="bg-[#1C4670]" email={email} subscription={isPremium ? 'lifetime' : subscription} onLimitReached={() => setShowSubscriptionModal(true)} />} 
                />
                <Route 
                  path="/naukri" 
                  element={<BotControl botId="naukri" title="Naukri Scraper" icon={Search} color="bg-[#1C4670]" email={email} subscription={isPremium ? 'lifetime' : subscription} onLimitReached={() => setShowSubscriptionModal(true)} />} 
                />
                <Route 
                  path="/indeed" 
                  element={<BotControl botId="indeed" title="Indeed Bot" icon={Globe} color="bg-[#FFA229]" email={email} subscription={isPremium ? 'lifetime' : subscription} onLimitReached={() => setShowSubscriptionModal(true)} />} 
                />
                <Route 
                  path="/company-crawler" 
                  element={<BotControl botId="company_crawler" title="Company Crawler" icon={Rocket} color="bg-orange-500" email={email} subscription={isPremium ? 'lifetime' : subscription} onLimitReached={() => setShowSubscriptionModal(true)} />} 
                />
                <Route path="/data" element={<DataViewer email={email} />} />
                <Route path="/settings" element={<Settings email={email} />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Modals & Overlays */}
        {showIdentityModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0d14]/60 backdrop-blur-2xl p-4 overflow-y-auto">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               className="bg-white dark:bg-[#0f172a] w-full max-w-lg rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/10 overflow-hidden relative"
             >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1C4670] via-[#FFA229] to-[#1C4670]" />
                <button 
                  onClick={() => setShowIdentityModal(false)}
                  className="absolute top-8 right-8 p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all group"
                >
                  <X className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                </button>

                <div className="p-10 pt-16">
                  <div className="flex flex-col items-center text-center mb-10">
                    <div className="relative group">
                      <div className="w-24 h-24 bg-gradient-to-tr from-[#1C4670] to-[#FFA229] rounded-[35px] flex items-center justify-center shadow-2xl shadow-slate-200 dark:shadow-none mb-6 rotate-3 group-hover:rotate-12 transition-all duration-700">
                        <Shield className="w-12 h-12 text-white" strokeWidth={2.5} />
                      </div>
                      <div className="absolute inset-0 bg-[#FFA229] blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" />
                    </div>
                    <h2 className="text-4xl font-black text-[#1C4670] dark:text-white tracking-tighter uppercase mb-3 px-4 py-1 bg-white dark:bg-transparent shadow-sm dark:shadow-none rounded-2xl">Agents<span className="text-[#FFA229]">Karo</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black max-w-[280px] leading-relaxed uppercase tracking-[0.2em] opacity-70">Identity Authentication Portal</p>
                  </div>

                  <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-[22px] mb-8">
                    {[
                      { id: false, label: "Log In", icon: Lock },
                      { id: true, label: "Create Account", icon: User }
                    ].map((tab) => (
                      <button 
                        key={tab.label}
                        onClick={() => setIsRegistering(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isRegistering === tab.id ? 'bg-white dark:bg-[#1C4670] text-slate-900 dark:text-white shadow-xl' : 'text-slate-500'}`}
                      >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {syncSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                       <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle className="w-10 h-10 text-emerald-500" />
                       </div>
                       <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-widest uppercase mb-2">Vault Synced</h3>
                       <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Identity verified successfully.</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleIdentify} className="space-y-4">
                        {errorHeader && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-4 text-xs font-bold rounded-2xl border text-center ${errorHeader.includes('successfully') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}
                          >
                             {errorHeader}
                          </motion.div>
                        )}
                        
                        <div className="space-y-2 group">
                           <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none pr-3 border-r border-slate-200 dark:border-white/10 h-1/2">
                                <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-[#1C4670] transition-colors" />
                              </div>
                              <input 
                                type="email" 
                                placeholder="Email Address" 
                                required
                                disabled={identifying}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-5 py-5 focus:ring-4 ring-[#1C4670]/20 focus:border-[#1C4670] outline-none transition-all font-semibold dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                              />
                           </div>
                        </div>

                        <div className="space-y-2 group">
                           <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none pr-3 border-r border-slate-200 dark:border-white/10 h-1/2">
                                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#1C4670] transition-colors" />
                              </div>
                              <input 
                                type="password" 
                                placeholder="Security Password" 
                                required
                                disabled={identifying}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-5 py-5 focus:ring-4 ring-[#1C4670]/20 focus:border-[#1C4670] outline-none transition-all font-semibold dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                           </div>
                        </div>

                        <button 
                          disabled={identifying}
                          className="w-full py-5 bg-[#1C4670] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:shadow-[0_20px_40px_-10px_rgba(28,70,112,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden group shadow-lg shadow-[#1C4670]/20"
                        >
                           <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 pointer-events-none" />
                           {identifying ? (
                             <RefreshCw className="w-5 h-5 animate-spin" />
                           ) : (
                             <>
                               {isRegistering ? "Confirm Registration" : "Enter Dashboard"}
                               <Rocket className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                             </>
                           )}
                        </button>

                        <div className="relative my-6">
                           <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
                           </div>
                           <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                              <span className="px-5 bg-white dark:bg-[#0f172a] text-slate-400 dark:text-slate-500 font-bold tracking-widest">Vault Secure Access</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                           <div id="google-login-button" className="transition-transform active:scale-95 flex justify-center"></div>
                           <button 
                             type="button"
                             onClick={handleGitHubLogin}
                             className="w-[320px] h-[40px] bg-[#1a1f26] text-white rounded-full font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-black/20 group border border-slate-800/50 active:scale-95 mx-auto"
                           >
                             <svg className="w-5 h-5 fill-current group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.44 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                             <span className="tracking-tight">GitHub Passport</span>
                           </button>
                        </div>
                    </form>
                  )}
                </div>
             </motion.div>
          </div>
        )}

        {/* Subscription Modal */}
        <SubscriptionModal 
          isOpen={showSubscriptionModal} 
          onClose={() => setShowSubscriptionModal(false)} 
          email={email} 
        />

        {/* Background Gradients */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#1C4670]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-[#FFA229]/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      </main>
    </div>
  );
};

export default App;
