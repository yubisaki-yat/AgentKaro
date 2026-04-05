import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle, Search, Building, RefreshCw, Zap, User, Star } from 'lucide-react';

import API_BASE from '../config';


interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="glass-card p-6 flex items-center gap-6 relative overflow-hidden group"
  >
    <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
    </div>
    <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-[0.03] rounded-full translate-x-1/2 -translate-y-1/2`} />
  </motion.div>
);

interface DashboardProps {
  email: string;
  subscription: string;
  status: Record<string, { running: boolean; elapsed: string }>;
}

const Dashboard: React.FC<DashboardProps> = ({ email, subscription }) => {
  const [data, setData] = useState<{
    internshala: any[];
    naukri: any[];
    indeed: any[];
    company_crawler: any[];
  }>({ internshala: [], naukri: [], indeed: [], company_crawler: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [intRes, nauRes, indRes, crawlRes] = await Promise.all([
        axios.get(`${API_BASE}/data/internshala?email=${email}`),
        axios.get(`${API_BASE}/data/naukri?email=${email}`),
        axios.get(`${API_BASE}/data/indeed?email=${email}`),
        axios.get(`${API_BASE}/data/company_crawler?email=${email}`)
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
  };

  useEffect(() => {
    if (email) {
      fetchData();
    }
  }, [email]);

  const stats = [
    { 
      title: "Applications Sent", 
      value: data.internshala.length, 
      icon: Briefcase, 
      color: "bg-indigo-500",
      delay: 0.1
    },
    { 
      title: "Success Rate", 
      value: `${Math.round((data.internshala.filter((i: any) => i.Status === 'Success').length / (data.internshala.length || 1)) * 100)}%`, 
      icon: CheckCircle, 
      color: "bg-emerald-500",
      delay: 0.2
    },
    { 
      title: "Indeed Scrapes", 
      value: data.indeed.length, 
      icon: Search, 
      color: "bg-cyan-500",
      delay: 0.3
    },
    { 
      title: "Crawler Leads", 
      value: data.company_crawler.length, 
      icon: Building, 
      color: "bg-orange-500",
      delay: 0.4
    }
  ];

  if (!email) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center max-w-lg"
        >
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-indigo-500" />
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">Welcome to JobAgent AI</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            You are currently browsing in <strong>Guest Mode</strong>. Connect your identity to start using our autonomous job automation bots and track your applications in real-time.
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-login'))}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20"
          >
            Sign In to Start
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h1>
            {subscription !== 'free' && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-tighter rounded shadow-lg shadow-amber-500/20">
                <Star className="w-3 h-3 fill-current" /> PRO
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            Signed in as <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
          </p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 glass-card hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 text-slate-700 dark:text-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-bold">Sync Analytics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => <KpiCard key={s.title} {...s} />)}
      </div>

      {/* Subscription Status Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass-card p-8 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/10 flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-indigo-500/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full translate-x-1/4 -translate-y-1/2 pointer-events-none" />
        
        <div className="flex-1 space-y-4">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
                 <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold">Subscription Insights</h3>
           </div>
           <p className="text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
             You are currently on the <span className="font-black text-indigo-500 uppercase tracking-wider">{subscription} Plan</span>. 
             {subscription === 'free' ? " Upgrade to premium to remove all application limits, unlock AI Resume Search, and access priority support." : " Enjoy your unlimited access, early feature access, and premium priority support!"}
           </p>
        </div>

        <div className="w-full md:w-80 space-y-4">
           <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Usage Tracker</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{(data.internshala?.length || 0)} <span className="text-slate-400 font-medium text-sm">/ 10 Applications</span></span>
              </div>
              <span className={`text-xs font-bold ${subscription !== 'free' ? 'text-emerald-500' : (data.internshala?.length || 0) >= 10 ? 'text-rose-500' : (data.internshala?.length || 0) >= 8 ? 'text-amber-500' : 'text-indigo-500'}`}>
                {subscription !== 'free' ? 'Unlimited' : (data.internshala?.length || 0) >= 10 ? 'Limit Reached' : `${10 - (data.internshala?.length || 0)} Remaining`}
              </span>
           </div>
           <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: subscription !== 'free' ? '100%' : `${Math.min(((data.internshala?.length || 0) / 10) * 100, 100)}%` }}
                className={`h-full rounded-full ${subscription !== 'free' ? 'bg-emerald-500' : (data.internshala?.length || 0) >= 10 ? 'bg-rose-500' : (data.internshala?.length || 0) >= 8 ? 'bg-amber-500' : 'premium-gradient'}`}
              />
           </div>
           <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
              <span>Current usage</span>
              <span>Platform Limit: Internshala</span>
           </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Internshala Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card overflow-hidden border-indigo-500/10 shadow-lg shadow-indigo-500/5"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-500/5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Internshala Applications</h2>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">Last 5</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 uppercase text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent">
                <tr>
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {data.internshala.slice(-5).reverse().map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{item['Job Title'] || "N/A"}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.Company || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.Status === 'Success' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
                      }`}>
                        {item.Status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.internshala.length === 0 && (
                   <tr>
                     <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">No applications found.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Naukri Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card overflow-hidden border-blue-500/10 shadow-lg shadow-blue-500/5"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-500/5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Naukri Scrapes</h2>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">Last 5</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 uppercase text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent">
                <tr>
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {data.naukri.slice(-5).reverse().map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{item['Job Title'] || "N/A"}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.Company || "N/A"}</td>
                    <td className="px-6 py-4 text-slate-500">{item.Location || "Remote"}</td>
                  </tr>
                ))}
                {data.naukri.length === 0 && (
                   <tr>
                     <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">No jobs scraped yet.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
