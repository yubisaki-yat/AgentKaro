import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  CheckCircle,
  Search,
  Building,
  RefreshCw,
  User,
  Star,
  Shield,
  TrendingUp,
  Zap,
  Clock,
  ArrowUpRight,
  Sparkles,
  Target,
  Activity
} from 'lucide-react';
import Skeleton from '../components/Skeleton';
import API_BASE from '../config';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay: number;
  loading?: boolean;
  trend?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, color, delay, loading, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="glass-card p-5 flex flex-col gap-3 relative overflow-hidden group border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-xl transition-all"
  >
    <div className="flex items-center justify-between relative z-10">
      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg shadow-black/5`}>
        <Icon className="w-4 h-4" />
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </div>
      )}
    </div>

    <div className="relative z-10">
      <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1.5">{title}</p>
      {loading ? (
        <Skeleton className="h-7 w-20 rounded-lg" />
      ) : (
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{value}</p>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#FFA229] transition-colors" />
        </div>
      )}

    </div>

    <div className={`absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br ${color} opacity-[0.03] blur-[30px] rounded-full group-hover:scale-125 transition-transform duration-500`} />
  </motion.div>
);

interface DashboardProps {
  email: string;
  subscription: string;
  status: Record<string, { running: boolean; elapsed: string }>;
}

interface JobData {
  'Job Title'?: string;
  Company?: string;
  Status?: string;
  Location?: string;
  [key: string]: string | number | boolean | undefined;
}

const Dashboard: React.FC<DashboardProps> = ({ email, subscription, status }) => {
  const [data, setData] = useState<{
    internshala: JobData[];
    naukri: JobData[];
    indeed: JobData[];
    company_crawler: JobData[];
  }>({ internshala: [], naukri: [], indeed: [], company_crawler: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [intRes, nauRes, indRes, crawlRes] = await Promise.all([
        axios.get(`${API_BASE}/data/internshala?email=${email}`).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE}/data/naukri?email=${email}`).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE}/data/indeed?email=${email}`).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE}/data/company_crawler?email=${email}`).catch(() => ({ data: { data: [] } }))
      ]);
      setData({
        internshala: intRes.data.data || [],
        naukri: nauRes.data.data || [],
        indeed: indRes.data.data || [],
        company_crawler: crawlRes.data.data || []
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (email) {
      fetchData();
    }
  }, [email, fetchData]);

  const stats = [
    {
      title: "Applications Sent",
      value: data.internshala.length + data.naukri.length,
      icon: Briefcase,
      color: "from-[#1C4670] to-[#2D3748]",
      delay: 0.1,
      trend: "+24% Vol"
    },
    {
      title: "Success Rate",
      value: `${Math.round((data.internshala.filter((i: JobData) => i.Status === 'Success').length / (data.internshala.length || 1)) * 100)}%`,
      icon: Target,
      color: "from-[#FFA229] to-[#FF8C42]",
      delay: 0.2,
      trend: "Optimal"
    },
    {
      title: "Search Nodes",
      value: data.indeed.length + data.naukri.length,
      icon: Search,
      color: "from-[#00A8FF] to-[#00E5FF]",
      delay: 0.3,
      trend: "Live"
    },
    {
      title: "Crawler Leads",
      value: data.company_crawler.length,
      icon: Building,
      color: "from-[#FF6B6B] to-[#FF8C42]",
      delay: 0.4,
      trend: "Synced"
    }
  ];

  if (!email) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative max-w-2xl w-full p-12 text-center overflow-hidden"
        >
          {/* Premium backdrop */}
          <div className="absolute inset-0 glass-card opacity-50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-secondary/20 blur-[100px] rounded-full" />

          <div className="relative z-10">
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="w-24 h-24 bg-gradient-to-br from-[#1C4670] to-[#2D3748] rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-black/20 border border-white/10"
            >
              <Shield className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-5xl font-black mb-6 tracking-tighter uppercase italic leading-[0.9]">
              Authentication <span className="logo-karo-gradient">Required</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-12 text-lg font-medium leading-relaxed max-w-md mx-auto">
              Your autonomous agents are standing by. Verify your identity to initialize the control sequence.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-login'))}
              className="px-12 py-5 bg-[#1C4670] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] hover:scale-105 hover:shadow-2xl hover:shadow-[#1C4670]/40 transition-all active:scale-95 flex items-center justify-center gap-4 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Initialize Portal
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 lg:space-y-12 max-w-[1600px] mx-auto pb-32">
      {/* Hero Stats Section */}
      <div className="relative p-8 sm:p-12 glass-card overflow-hidden group border border-slate-200/50 dark:border-white/5 shadow-xl">
        {/* Abstract background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C4670] via-transparent to-[#FFA229] opacity-[0.02]" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#FFA229]/5 blur-[120px] rounded-full group-hover:opacity-10 transition-opacity" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFA229]/10 border border-[#FFA229]/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFA229]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#FFA229]">System Operational</span>
            </motion.div>

            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-[0.9]">
                Mission <span className="logo-karo-gradient">Control</span>
              </h1>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] pl-1">Autonomic Intelligence v3.0</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 px-5 py-3 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#FFA229]/10 flex items-center justify-center border border-[#FFA229]/20">
                <User className="w-5 h-5 text-[#FFA229]" />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Operator</p>
                <p className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[120px]">{email.split('@')[0]}</p>
              </div>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="group/sync px-8 py-4 bg-[#1C4670] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#1C4670]/20 flex items-center gap-3 transition-all hover:scale-105 hover:shadow-[#1C4670]/40 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 transition-transform group-hover/sync:rotate-180 ${loading ? 'animate-spin' : ''}`} />
              Sync Link
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
        {stats.map((stat, i) => (
          <KpiCard key={i} {...stat} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Main Content Area */}
        <div className="xl:col-span-8 space-y-10 lg:space-y-16">

          {/* Efficiency Report / Premium Promo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative p-0.5 bg-gradient-to-br from-brand-secondary via-[#FF6B6B] to-brand-accent rounded-[2.5rem] shadow-2xl"
          >
            <div className="bg-[#0f172a] rounded-[2.4rem] p-8 sm:p-10 relative overflow-hidden">

              {/* Abstract glows */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-secondary/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-accent/5 blur-[100px] rounded-full" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-14">
                <div className="flex-1 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-secondary/20 rounded-2xl flex items-center justify-center border border-brand-secondary/30">
                      <Zap className="w-6 h-6 text-brand-secondary" />
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Neural <span className="text-brand-secondary">Throttling</span></h3>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] mt-1.5 opacity-50">Resource Management Active</p>
                    </div>
                  </div>


                  <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-lg">
                    {subscription === 'free'
                      ? "You are currently running on legacy protocols. Upgrade to v3.0 Pro for unlimited multi-threaded agents and neural outreach."
                      : "Neural link fully operational. All autonomous engines are running at maximum efficiency without bandwidth caps."}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Proxy Rotation On</span>
                    </div>
                    <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Anti-Bot Bypass On</span>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-96 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl space-y-8">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block">Application Quota</span>
                      <span className="text-4xl font-black text-white tracking-tighter leading-none">
                        {data.internshala.length + data.naukri.length}
                        <span className="text-lg text-slate-600 ml-2">/ 10</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <div className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${subscription !== 'free' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-brand-secondary/10 border-brand-secondary/20 text-brand-secondary'}`}>
                        {subscription !== 'free' ? 'Unlimited' : 'Limited'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: subscription !== 'free' ? '100%' : `${Math.min(((data.internshala.length + data.naukri.length) / 10) * 100, 100)}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={`h-full rounded-full shadow-[0_0_20px_rgba(255,140,66,0.3)] ${subscription !== 'free' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-brand-secondary to-[#FF6B6B]'}`}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                      <span>Identity Verified</span>
                      <span>Tier Threshold</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {/* Table Card 1 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card overflow-hidden group border-none shadow-2xl"
            >
              <div className="p-7 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-900/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Neural Feed</h2>
                </div>
                <div className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                  Live Sync
                </div>
              </div>
              <div className="p-3">
                <table className="w-full text-left">
                  <thead className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-5 py-5">Extracted Entity</th>
                      <th className="px-5 py-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                      [1, 2, 3, 4].map(i => (
                        <tr key={i}><td colSpan={2} className="px-5 py-5"><Skeleton className="h-5 w-full rounded-xl" /></td></tr>
                      ))
                    ) : (data.internshala.length === 0 ? (
                      <tr><td colSpan={2} className="px-5 py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest opacity-50 italic">No activity detected</td></tr>
                    ) : (
                      data.internshala.slice(-6).reverse().map((item: JobData, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group/row">
                          <td className="px-5 py-5">
                            <p className="font-black text-slate-800 dark:text-slate-200 group-hover/row:text-brand-secondary transition-colors uppercase tracking-tight">{item['Job Title'] || "Unknown"}</p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tighter opacity-60">{item.Company || "Proprietary"}</p>
                          </td>
                          <td className="px-5 py-5 text-right">
                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${item.Status === 'Success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-transparent'}`}>
                              {item.Status || "Queued"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Table Card 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card overflow-hidden group border-none shadow-2xl"
            >
              <div className="p-7 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-900/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                    <Search className="w-5 h-5 text-sky-500" />
                  </div>
                  <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Search Matrix</h2>
                </div>
                <div className="px-3 py-1 bg-sky-500/10 text-sky-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-sky-500/20">
                  Naukri
                </div>
              </div>
              <div className="p-3">
                <table className="w-full text-left">
                  <thead className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-5 py-5">Pattern Match</th>
                      <th className="px-5 py-5 text-right">Identifier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                      [1, 2, 3, 4].map(i => (
                        <tr key={i}><td colSpan={2} className="px-5 py-5"><Skeleton className="h-5 w-full rounded-xl" /></td></tr>
                      ))
                    ) : (data.naukri.length === 0 ? (
                      <tr><td colSpan={2} className="px-5 py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest opacity-50 italic">No data extracted</td></tr>
                    ) : (
                      data.naukri.slice(-6).reverse().map((item: JobData, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group/row">
                          <td className="px-5 py-5">
                            <p className="font-black text-slate-800 dark:text-slate-200 group-hover/row:text-sky-500 transition-colors uppercase tracking-tight truncate max-w-[200px]">{item['Job Title'] || "N/A"}</p>
                          </td>
                          <td className="px-5 py-5 text-right">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter truncate max-w-[120px] ml-auto opacity-70">{item.Company || "N/A"}</p>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Sidebar: Status & Pulse */}
        <div className="xl:col-span-4 space-y-10">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 border-none shadow-2xl relative overflow-hidden"
          >

            {/* Background pattern */}
            <div className="absolute inset-0 bg-slate-900/[0.02] dark:bg-white/[0.02] pointer-events-none" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-secondary/5 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2" />

            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Neural Pulse</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60 italic">Real-time Agent Monitoring</p>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center animate-pulse border border-emerald-500/20">
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0f172a] shadow-lg" />
              </div>
            </div>

            <div className="space-y-10">
              {Object.entries(status).map(([botId, s]) => (
                <div key={botId} className="group relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full transition-all duration-500 ${s.running ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-125' : 'bg-slate-200 dark:bg-slate-800'}`} />
                      <span className={`text-[12px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${s.running ? 'text-slate-900 dark:text-white' : 'text-slate-400 opacity-50'}`}>
                        {botId.replace('_', ' ')}
                      </span>
                    </div>
                    {s.running && (
                      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/10">
                        <Clock className="w-3.5 h-3.5 text-brand-secondary" />
                        <span className="text-[11px] font-mono font-black text-slate-600 dark:text-slate-300">{s.elapsed}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-slate-100 dark:border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: s.running ? '100%' : '0%' }}
                      transition={{ duration: 1, ease: "anticipate" }}
                      className={`h-full rounded-full ${s.running ? 'bg-gradient-to-r from-emerald-500 to-brand-secondary' : 'bg-transparent'}`}
                    />
                  </div>

                  {!s.running && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Idle</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-14 pt-10 border-t border-slate-100 dark:border-white/5"
            >
              <div className="p-6 bg-gradient-to-br from-brand-secondary/10 to-transparent rounded-[2.5rem] border border-brand-secondary/20 relative overflow-hidden group/tip">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/tip:opacity-20 transition-opacity">
                  <TrendingUp className="w-16 h-16 text-brand-secondary" />
                </div>
                <div className="flex items-center gap-3 text-brand-secondary mb-3">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Efficiency Insight</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                  Autonomous throughput is <span className="text-brand-secondary">420% higher</span> than average manual processing.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Quick Support Card */}
          <div className="p-8 glass-card border-brand-accent/20 bg-brand-accent/5 flex items-center justify-between group cursor-pointer hover:bg-brand-accent/10 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center border border-brand-accent/20">
                <Shield className="w-6 h-6 text-brand-accent" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Priority Vault</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">24/7 Security Operations</p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-brand-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
