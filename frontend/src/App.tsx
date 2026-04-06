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
  Sparkles,
  CheckCircle,
  RefreshCw,
  LogOut,
  Mail,
  Lock,
  X
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
  const [subscription, setSubscription] = useState<string>("free");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false); // Default false for guest mode
  const [tempEmail, setTempEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identifying, setIdentifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [errorHeader, setErrorHeader] = useState("");
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
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      const message = err.message;

      if (status === 404) {
        setErrorHeader(`API Error (404): Endpoint not found at ${API_BASE}`);
      } else if (status === 500) {
        setErrorHeader(detail || `Server Error (500): ${message}`);
      } else if (message === "Network Error") {
        setErrorHeader(`Network Error: Failed to reach Backend at ${API_BASE}. Ensure VITE_API_URL is set in Render.`);
      } else {
        setErrorHeader(detail || `Auth failed: ${message}`);
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
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.message;
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
            initialize: (config: { client_id: string; callback: (resp: any) => void }) => void;
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

  const menuItems = [
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
    <div className="flex h-screen bg-slate-50 dark:bg-[#0a0d14] text-slate-800 dark:text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-colors duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-slate-900 dark:text-white leading-none">AGENTSKARO</h1>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Autonomous</span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/5' 
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto px-4 w-full">
          <div className="p-4 bg-slate-50 dark:bg-indigo-500/5 border border-slate-200 dark:border-indigo-500/10 rounded-2xl">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 overflow-hidden">
                   <User className="w-4 h-4 text-indigo-500 shrink-0" />
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{email ? email.split('@')[0] : "Guest"}</span>
                </div>
                 {email ? (
                   <div className="flex items-center gap-2">
                     <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                       isPremium 
                       ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                       : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                     }`}>
                       {isPremium ? 'PRO' : 'FREE'}
                     </span>
                     <button 
                       onClick={handleLogout}
                       className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors group"
                       title="Sign Out"
                     >
                       <LogOut className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 ) : (
                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                      GUEST
                    </span>
                 )}
             </div>
             
             {!email ? (
               <div className="space-y-3">
                 <p className="text-[10px] text-slate-500 leading-relaxed italic">You are currently in view-only guest mode.</p>
                 <button 
                   onClick={() => setShowIdentityModal(true)}
                   className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-indigo-500/20"
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
                        className="w-full mt-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-indigo-500/20"
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
      <main className="flex-1 relative overflow-auto custom-scrollbar bg-slate-50 dark:bg-transparent">
        <header className="sticky top-0 w-full h-16 bg-white/80 dark:bg-[#0a0d14]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-40 transition-colors duration-300">
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
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
              </button>
           </div>
        </header>

        <div className="relative z-10 min-h-[calc(100vh-64px)]">
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
                  element={<BotControl botId="internshala" title="Internshala Bot" icon={Bot} color="bg-indigo-500" email={email} subscription={isPremium ? 'lifetime' : subscription} onLimitReached={() => setShowSubscriptionModal(true)} />} 
                />
                <Route 
                  path="/naukri" 
                  element={<BotControl botId="naukri" title="Naukri Scraper" icon={Search} color="bg-blue-500" email={email} subscription={isPremium ? 'lifetime' : subscription} onLimitReached={() => setShowSubscriptionModal(true)} />} 
                />
                <Route 
                  path="/indeed" 
                  element={<BotControl botId="indeed" title="Indeed Bot" icon={Globe} color="bg-cyan-500" email={email} subscription={isPremium ? 'lifetime' : subscription} onLimitReached={() => setShowSubscriptionModal(true)} />} 
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

        {/* Identity Modal */}
        {showIdentityModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0d14]/60 backdrop-blur-2xl p-4 overflow-y-auto">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               className="bg-white/90 dark:bg-[#0f172a]/95 p-8 md:p-10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] w-full max-w-md border border-white dark:border-white/10 relative overflow-hidden backdrop-blur-3xl"
             >
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                
                <button 
                  onClick={() => setShowIdentityModal(false)}
                  className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all z-10"
                  title="Close"
                >
                  <X className="w-5 h-5 transition-transform active:rotate-90 duration-300" />
                </button>
                
                <div className="flex items-center gap-2 mb-6 p-1.5 bg-slate-100/80 dark:bg-white/5 backdrop-blur-md rounded-[1.5rem] w-fit mx-auto border border-slate-200/50 dark:border-white/10">
                  <button 
                    onClick={() => setIsRegistering(false)}
                    className={`px-8 py-2 text-xs font-black uppercase tracking-widest rounded-[1.2rem] transition-all duration-300 ${!isRegistering ? 'bg-white dark:bg-indigo-600 shadow-xl shadow-indigo-500/20 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setIsRegistering(true)}
                    className={`px-8 py-2 text-xs font-black uppercase tracking-widest rounded-[1.2rem] transition-all duration-300 ${isRegistering ? 'bg-white dark:bg-indigo-600 shadow-xl shadow-indigo-500/20 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Register
                  </button>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-3xl font-black mb-2 tracking-tighter text-slate-900 dark:text-white leading-tight">
                    {isRegistering ? 'Join the Elite' : 'Welcome Professional'}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-[0.05em]">
                    {isRegistering ? 'The future of autonomous job hunting' : 'Access your private AI dashboard'}
                  </p>
                </div>

                 {syncSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-12 text-center"
                    >
                      <div className="inline-flex p-5 bg-emerald-500/20 text-emerald-500 rounded-[2rem] mb-6 shadow-xl shadow-emerald-500/10">
                         <CheckCircle className="w-12 h-12" />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Identity Synced!</h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Redirecting to session...</p>
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
                                <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                              </div>
                              <input 
                                type="email" 
                                placeholder="Email Address" 
                                required
                                disabled={identifying}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-5 py-5 focus:ring-4 ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-semibold dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                              />
                           </div>
                        </div>

                        <div className="space-y-2 group">
                           <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none pr-3 border-r border-slate-200 dark:border-white/10 h-1/2">
                                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                              </div>
                              <input 
                                type="password" 
                                placeholder="Security Password" 
                                required
                                disabled={identifying}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-5 py-5 focus:ring-4 ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-semibold dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                           </div>
                        </div>

                        <button 
                          disabled={identifying}
                          className="w-full py-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden group shadow-lg shadow-indigo-500/20"
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
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      </main>
    </div>
  );
};

export default App;
