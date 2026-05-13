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
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Import real pages
import Dashboard from './pages/Dashboard';
import AIJobSearch from './pages/AIJobSearch';
import BotControl from './pages/BotControl';
import DataViewer from './pages/DataViewer';
import Settings from './pages/Settings';
import Browser from './pages/Browser';
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
        const res = await axios.get(`${API_BASE}/status?email=${email}`, { timeout: 30000 });
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
      }, { timeout: 30000 });

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
      }, { timeout: 30000 });

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
          const res = await axios.post(`${API_BASE}/auth/github`, { code }, { timeout: 30000 });
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
    { name: 'Web Browser', path: '/browser', icon: Globe },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const isPremium = subscription !== 'free';

  return (
    <div className="flex h-screen bg-white dark:bg-[#0a0d14] text-slate-800 dark:text-slate-200 overflow-hidden font-sans selection:bg-[#FFA229]/30 transition-colors duration-300">
      {/* Mobile Header - Visible only on small screens */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white/70 dark:bg-[#0a0d14]/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between px-6 z-[60] shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all duration-300">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-11 h-11 flex items-center justify-center logo-drop-shadow"
          >
            <img src="/logo.png" alt="AgentsKaro Logo" className="w-full h-full object-contain" />
          </motion.div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter text-[#1C4670] dark:text-white leading-none uppercase italic">
              Agents<span className="logo-karo-gradient">Karo</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-3 bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl transition-all border border-slate-200/50 dark:border-white/10 active:scale-95"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-[#1C4670]" />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-3 bg-[#1C4670] text-white rounded-2xl transition-all shadow-lg shadow-[#1C4670]/20 active:scale-95"
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
        fixed lg:relative inset-y-0 left-0 w-[85%] sm:w-80 bg-white/80 dark:bg-[#0a0d14]/80 backdrop-blur-3xl border-r border-slate-200/50 dark:border-white/5 flex flex-col z-[80] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-[40px_0_100px_rgba(0,0,0,0.3)]' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Sidebar Header: Logo */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-4 mb-6 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 1.2, ease: "anticipate" }}
              className="relative"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#1C4670] shadow-xl shadow-[#1C4670]/20 border border-white/10">
                <img src="/logo.png" alt="AgentsKaro Logo" className="w-8 h-8 object-contain" />
              </div>
            </motion.div>
            <div className="overflow-hidden">
              <h1 className="font-black text-xl tracking-tight text-[#1C4670] dark:text-white leading-none uppercase">
                AGENTS<span className="logo-karo-gradient">KARO</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Autonomous v3.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Body: Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-none">
          <nav className="space-y-1">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black transition-all duration-300 group relative
                    ${isActive
                      ? 'bg-[#1C4670] text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#1C4670] dark:hover:text-[#FFA229]'
                    }
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
                    ${isActive ? 'bg-white/10' : 'bg-slate-100/50 dark:bg-white/5 group-hover:bg-white/10'}
                  `}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-inherit'}`} />
                  </div>
                  <span className="flex-1 tracking-widest uppercase">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-dot"
                      className="w-1 h-4 bg-[#FFA229] rounded-full shadow-[0_0_8px_rgba(255,162,41,0.5)]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Status & Account */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800/50 space-y-3 bg-white/50 dark:bg-[#0f172a]/50 backdrop-blur-xl">
          {/* Bot Status Summary */}
          <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">System Pulse</span>
              </div>
              {isPremium && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#FF8C42]/10 text-[#FF8C42] text-[8px] font-black uppercase tracking-widest rounded-md border border-[#FF8C42]/20">
                  <Sparkles className="w-2 h-2" />
                  Pro
                </div>
              )}
            </div>

            {!email ? (
              <div className="space-y-2">
                <p className="text-[9px] text-slate-400 leading-tight italic">Authentication required for bot access.</p>
                <button
                  onClick={() => setShowIdentityModal(true)}
                  className="w-full py-2 bg-[#2D3748] text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:shadow-lg hover:shadow-[#2D3748]/10 transition-all active:scale-[0.98]"
                >
                  Login Portal
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                {(() => {
                  const activeBots = [
                    { id: 'internshala', color: 'bg-emerald-500', name: 'Int' },
                    { id: 'naukri', color: 'bg-[#2D3748]', name: 'Nau' },
                    { id: 'indeed', color: 'bg-[#FF8C42]', name: 'Ind' }
                  ].filter(bot => status[bot.id]?.running);

                  if (activeBots.length === 0) {
                    return (
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 opacity-50" />
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tight italic">No bots active</span>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-wrap gap-3">
                      {activeBots.map(bot => (
                        <div key={bot.id} className="flex items-center gap-1.5 group/bot cursor-help" title={`${bot.id.toUpperCase()} is running`}>
                          <div className="relative">
                            <div className={`w-1.5 h-1.5 rounded-full ${bot.color}`} />
                            <div className={`absolute inset-0 rounded-full ${bot.color} blur-[2px] opacity-60 animate-pulse`} />
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400">{bot.name}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Logout/Account Section */}
          {email && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-1 py-1 group/account">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-slate-200 dark:border-white/10 group-hover/account:rotate-3 transition-transform">
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0f172a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{email.split('@')[0]}</p>
                  <p className="text-[8px] text-slate-400 uppercase tracking-tighter font-medium">{subscription} Member</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {!isPremium && (
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="w-full py-2 bg-gradient-to-r from-[#FF8C42] to-[#FF6B6B] text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group/upgrade"
                >
                  <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                  Upgrade Pro
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 relative overflow-auto custom-scrollbar bg-slate-50 dark:bg-transparent ${location.pathname === '/browser' ? 'pt-0' : 'pt-24 lg:pt-0'}`}>

        {location.pathname !== '/browser' && (
          <header className="hidden lg:flex sticky top-0 w-full h-14 bg-white/70 dark:bg-[#0a0d14]/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/5 items-center justify-between px-8 z-40 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Link to="/" className="hover:text-[#1C4670] dark:hover:text-white transition-colors">Home</Link>
                {location.pathname !== '/' && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#1C4670] dark:text-[#FFA229]">{location.pathname.substring(1).replace('-', ' ')}</span>
                  </>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                API Operational
              </div>
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-90"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#1C4670]" />}
              </button>
            </div>
          </header>
        )}

        <div className={`relative z-10 mx-auto min-h-[calc(100vh-64px)] ${location.pathname === '/browser' ? 'p-0 max-w-none' : 'p-4 md:p-8 max-w-[1600px]'}`}>
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
                  element={<BotControl botId="internshala" title="Internshala Bot" icon={Bot} color="bg-[#2D3748]" email={email} subscription={isPremium ? 'lifetime' : subscription} onLimitReached={() => setShowSubscriptionModal(true)} />}
                />
                <Route
                  path="/naukri"
                  element={<BotControl botId="naukri" title="Naukri Scraper" icon={Search} color="bg-[#2D3748]" email={email} subscription={isPremium ? 'lifetime' : subscription} onLimitReached={() => setShowSubscriptionModal(true)} />}
                />
                <Route
                  path="/indeed"
                  element={<BotControl botId="indeed" title="Indeed Bot" icon={Globe} color="bg-[#FF8C42]" email={email} subscription={isPremium ? 'lifetime' : subscription} onLimitReached={() => setShowSubscriptionModal(true)} />}
                />
                <Route
                  path="/company-crawler"
                  element={<BotControl botId="company_crawler" title="Company Crawler" icon={Rocket} color="bg-orange-500" email={email} subscription={isPremium ? 'lifetime' : subscription} onLimitReached={() => setShowSubscriptionModal(true)} />}
                />
                <Route path="/data" element={<DataViewer email={email} />} />
                <Route path="/browser" element={<Browser />} />
                <Route path="/settings" element={<Settings email={email} />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Modals & Overlays */}
        {showIdentityModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/90 backdrop-blur-3xl p-4 overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FFA229]/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white/95 dark:bg-[#0a0f1e]/95 w-full max-w-md rounded-3xl sm:rounded-[2rem] shadow-[0_32px_60px_rgba(0,0,0,0.4)] border border-slate-200/50 dark:border-white/5 overflow-hidden relative backdrop-blur-xl"
            >


              {/* Subtle Texture Overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

              {/* Close Button */}
              <button
                onClick={() => setShowIdentityModal(false)}
                className="absolute top-8 right-8 p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all group z-50"
              >
                <X className="w-5 h-5 text-slate-400 group-hover:text-rose-500" />
              </button>

              <div className="p-6 sm:p-8 pt-10 relative z-10">

                <div className="flex flex-col items-center text-center mb-8">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-16 h-16 bg-gradient-to-br from-white to-slate-50 dark:from-white/5 dark:to-white/[0.02] rounded-2xl flex items-center justify-center shadow-xl mb-5 border border-slate-200/50 dark:border-white/10 relative group"
                  >
                    <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img src="/logo.png" alt="AgentsKaro Logo" className="w-10 h-10 object-contain relative z-10" />
                  </motion.div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-2">
                    IDENTITY <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[#FFA229]">VAULT</span>
                  </h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 opacity-60">Security Node Access</p>
                </div>



                {/* Modern Tab Switcher */}
                <div className="flex p-1 bg-slate-100/50 dark:bg-white/5 rounded-xl mb-6 border border-slate-200/50 dark:border-white/5 relative">
                  {[
                    { id: false, label: "Access", icon: Lock },
                    { id: true, label: "Register", icon: User }
                  ].map((tab) => (
                    <button
                      key={tab.label}
                      onClick={() => setIsRegistering(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${isRegistering === tab.id ? 'text-[#1C4670] dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                      <tab.icon className={`w-3 h-3 ${isRegistering === tab.id ? 'text-blue-500' : ''}`} />
                      {tab.label}
                      {isRegistering === tab.id && (
                        <motion.div 
                          layoutId="auth-tab-active"
                          className="absolute inset-0 bg-white dark:bg-blue-600/20 rounded-[10px] shadow-sm border border-slate-200 dark:border-blue-500/30 -z-10"
                        />
                      )}
                    </button>
                  ))}
                </div>



                {syncSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                  >
                    <div className="relative w-24 h-24 mx-auto mb-8">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                      <div className="relative w-full h-full bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-widest uppercase mb-2">Authenticated</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-60">Synchronizing session...</p>
                  </motion.div>

                ) : (
                  <form onSubmit={handleIdentify} className="space-y-4">
                    {errorHeader && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 text-[10px] font-black rounded-2xl border text-center uppercase tracking-widest bg-rose-500/10 text-rose-500 border-rose-500/20"
                      >
                        {errorHeader}
                      </motion.div>
                    )}

                    <div className="space-y-3">
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 transition-colors group-focus-within:bg-blue-500/10 z-10">
                          <Mail className="w-3 h-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type="email"
                          placeholder="Email Identity"
                          required
                          disabled={identifying}
                          className="w-full bg-slate-50/30 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-xl pl-14 pr-4 py-3.5 text-[11px] font-bold input-focus-ring outline-none transition-all dark:text-white placeholder:text-slate-400/50 shadow-inner relative z-0"
                          value={tempEmail}
                          onChange={(e) => setTempEmail(e.target.value)}
                        />
                      </div>

                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 transition-colors group-focus-within:bg-blue-500/10 z-10">
                          <Lock className="w-3 h-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type="password"
                          placeholder="Security Cipher"
                          required
                          disabled={identifying}
                          className="w-full bg-slate-50/30 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-xl pl-14 pr-4 py-3.5 text-[11px] font-bold input-focus-ring outline-none transition-all dark:text-white placeholder:text-slate-400/50 shadow-inner relative z-0"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>



                    {!isRegistering && (
                      <div className="flex justify-end px-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!tempEmail) {
                              setErrorHeader("Enter email for recovery.");
                              return;
                            }
                            setIdentifying(true);
                            try {
                              const res = await axios.post(`${API_BASE}/forgot-password`, { email: tempEmail });
                              setErrorHeader(res.data.message);
                            } catch {
                              setErrorHeader("Recovery protocol failed.");
                            }
                            setIdentifying(false);
                          }}
                          className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1C4670] transition-colors"
                        >
                          Forgot Cipher?
                        </button>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ y: -1, shadow: "0 10px 30px rgba(59, 130, 246, 0.2)" }}
                      whileTap={{ scale: 0.99 }}
                      disabled={identifying}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 shimmer opacity-10" />
                      {identifying ? (
                        <RefreshCw className="w-4 h-4 animate-spin relative z-10" />
                      ) : (
                        <>
                          <span className="relative z-10">{isRegistering ? "Confirm Registration" : "Initialize Access"}</span>
                          <ArrowRight className="w-3.5 h-3.5 relative z-10 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </motion.button>




                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100 dark:border-white/5"></div>
                      </div>
                      <div className="relative flex justify-center text-[9px] font-black uppercase tracking-widest">
                        <span className="px-4 bg-white dark:bg-[#0f172a] text-slate-400">Social Federation</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div id="google-login-button" className="flex justify-center transition-all hover:brightness-105 active:scale-[0.99]"></div>
                      <motion.button
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        onClick={handleGitHubLogin}
                        className="w-full h-[44px] bg-[#0d1117] text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 border border-white/5 shadow-md group"
                      >
                        <div className="p-1 bg-white/5 rounded group-hover:bg-white/10 transition-colors">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.44 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                        </div>
                        <span className="opacity-70 group-hover:opacity-100 transition-opacity">GitHub Passport</span>
                      </motion.button>
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
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#2D3748]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-[#FF8C42]/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      </main>
    </div>
  );
};

export default App;
