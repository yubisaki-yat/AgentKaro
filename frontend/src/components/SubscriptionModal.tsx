import React, { useState } from 'react';
import { Zap, Crown, ShieldCheck, Check, Sparkles, X, RefreshCw, ArrowRight, Lock, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE from '../config';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, email }) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Pro',
      price: '₹1',
      originalPrice: '₹49',
      tagline: '2-Day Trial then ₹29/mo',
      description: 'Rapid testing of autonomous engines.',
      features: ['₹1 for 2 days Trial', 'Unlimited Bot Usage', 'Real-time Tracking', 'Global Search'],
      icon: <Zap className="w-4 h-4 text-[#1C4670]" />,
      gradient: 'from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50',
      btnColor: 'bg-[#1C4670]'
    },
    {
      id: 'yearly',
      name: 'Yearly Elite',
      price: '₹399',
      originalPrice: '₹999',
      tagline: 'Save 60% Today',
      description: 'The definitive career acceleration choice.',
      features: ['Priority Bot Speed', 'Advanced AI Filters', 'Dedicated Intelligence', 'Featured Status'],
      icon: <Crown className="w-4 h-4 text-[#FFA229]" />,
      gradient: 'from-[#FFA229]/5 to-[#FFA229]/10',
      btnColor: 'bg-[#FFA229]',
      popular: true,
      saveBadge: 'Best Value'
    },
    {
      id: 'lifetime',
      name: 'Lifetime Master',
      price: '₹799',
      originalPrice: '₹2499',
      tagline: 'Ultimate Job Security',
      description: 'Eternal access to all modules.',
      features: ['All Exclusive Features', 'Lifetime Node Access', 'Priority API Cluster', 'Multi-Device Sync'],
      icon: <ShieldCheck className="w-4 h-4 text-[#1C4670]" />,
      gradient: 'from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50',
      btnColor: 'bg-[#1C4670]'
    }
  ];

  const handlePayment = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const configRes = await fetch(`${API_BASE}/config`);
      const configData = await configRes.json();
      const razorpayKey = configData.razorpay_key;

      const endpoint = planId === 'monthly' ? 'create-subscription' : 'create-order';
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, email })
      });
      const order = await res.json();

      const options: any = {
        key: razorpayKey,
        name: "AgentsKaro Pro",
        description: planId === 'monthly' ? "2-Day Trial + Monthly Autopay" : `${planId} Subscription`,
        handler: async function (response: RazorpayResponse) {
          const verifyRes = await fetch(`${API_BASE}/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              email,
              plan: planId
            })
          });
          const result = await verifyRes.json();
          if (result.status === 'success') {
            localStorage.setItem('user_sub', planId);
            onClose();
            window.location.reload();
          }
        },
        prefill: { email: email },
        theme: { color: "#1C4670" }
      };

      if (planId === 'monthly') {
        options.subscription_id = order.id;
      } else {
        options.order_id = order.id;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0a0d14]/90 backdrop-blur-2xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-[#0f172a] rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-white/10 flex flex-col"
          >

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all group z-50 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
            >
              <X className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
            </button>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-10 lg:p-12 text-center">

              <div className="relative z-10 mb-10">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFA229]/10 rounded-full border border-[#FFA229]/20 mb-4"
                >
                  <Sparkles className="w-3 h-3 text-[#FFA229]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FFA229]">Enterprise Access</span>
                </motion.div>

                <h2 className="text-3xl sm:text-4xl font-black text-[#1C4670] dark:text-white mb-3 tracking-tighter uppercase leading-none italic">
                  Scale Your <span className="logo-karo-gradient">Efficiency</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] max-w-sm mx-auto font-black uppercase tracking-widest opacity-60 leading-relaxed">
                  Select your intelligence tier and synchronize your career.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 max-w-5xl mx-auto items-stretch">
                {plans.map((plan, idx) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative p-6 rounded-[2rem] glass-card border flex flex-col h-full bg-white dark:bg-white/[0.01] transition-all duration-300 group
                    ${plan.popular
                        ? 'border-[#FFA229]/40 shadow-2xl scale-[1.02] z-20'
                        : 'border-slate-200/50 dark:border-white/5 shadow-xl hover:border-[#1C4670]/30'
                      }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30">
                        <span className="bg-gradient-to-r from-[#FF8C42] to-[#FFA229] text-white text-[8px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                          Best Value
                        </span>
                      </div>
                    )}

                    <div className={`mb-6 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} border border-slate-200 dark:border-white/10 shadow-md group-hover:scale-105 transition-transform`}>
                      {plan.icon}
                    </div>

                    <div className="text-left mb-6">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{plan.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{plan.price}</span>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 line-through opacity-40">{plan.originalPrice}</span>
                        </div>
                      </div>
                      <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1.5">{plan.tagline}</p>
                      <p className="mt-3 text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic opacity-70">{plan.description}</p>
                    </div>

                    <div className="flex-1 space-y-4 mb-8 text-left">
                      <ul className="space-y-3">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                            <div className="w-4 h-4 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                              <Check className="w-2.5 h-2.5 text-emerald-500" />
                            </div>
                            <span className="uppercase tracking-tight opacity-90">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      disabled={loadingPlan !== null}
                      onClick={() => handlePayment(plan.id)}
                      className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn
                      ${plan.popular
                          ? 'bg-[#FFA229] text-white shadow-xl shadow-orange-500/20'
                          : 'bg-[#1C4670] text-white shadow-lg shadow-slate-900/10'
                        } disabled:opacity-50 active:scale-95 hover:shadow-2xl`}
                    >
                      {loadingPlan === plan.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span className="relative z-10">{plan.id === 'monthly' ? 'Start Trial' : 'Get Access'}</span>
                          <ArrowRight className="w-3.5 h-3.5 relative z-10 group-hover/btn:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 flex items-center justify-center gap-10 opacity-30">
                {[
                  { icon: Lock, text: 'SSL Encrypted' },
                  { icon: ShieldCheck, text: 'Neural Gateway' },
                  { icon: Target, text: 'Instant Sync' }
                ].map((trust, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <trust.icon className="w-4 h-4 text-slate-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{trust.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;
