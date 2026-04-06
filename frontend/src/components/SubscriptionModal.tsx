import React, { useState } from 'react';
import { X, Check, Zap, Crown, ShieldCheck } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Pro',
      price: '₹1',
      tagline: '2-Day Trial then ₹29/mo',
      features: ['₹1 for 2 days Trial', 'Then ₹29/month Autopay', 'Unlimited Applies', 'Cancel Anytime'],
      icon: <Zap className="w-6 h-6 text-[#1C4670]" />,
      color: 'navy'
    },
    {
      id: 'yearly',
      name: 'Yearly Elite',
      price: '₹399',
      tagline: 'Save 40% Today',
      features: ['Priority Application', 'Real-time Tracking', 'Premium Support', 'Featured Profile'],
      icon: <Crown className="w-6 h-6 text-[#FFA229]" />,
      color: 'orange',
      popular: true
    },
    {
      id: 'lifetime',
      name: 'Lifetime Master',
      price: '₹799',
      tagline: 'Ultimate Job Security',
      features: ['All Exclusive Features', 'Lifetime Access', '24/7 Priority Support', 'Dedicated Bot Cluster'],
      icon: <ShieldCheck className="w-6 h-6 text-[#1C4670]" />,
      color: 'navy'
    }
  ];

  const handlePayment = async (planId: string) => {
    setLoading(true);
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
            alert(planId === 'monthly' ? 'Trial Activated! Autopay scheduled.' : 'Subscription Activated!');
            onClose();
            window.location.reload();
          }
        },
        prefill: { email },
        theme: { color: "#1C4670" }
      };

      if (planId === 'monthly') {
        options.subscription_id = order.id;
      } else {
        options.order_id = order.id;
        options.amount = order.amount;
        options.currency = "INR";
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden relative animate-in fade-in zoom-in duration-300 border border-slate-200 dark:border-white/10">
        <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all group z-10">
          <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
        </button>

        <div className="p-8 md:p-12 text-center relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-[#1C4670]/5 to-transparent pointer-events-none" />

            <h2 className="text-4xl md:text-5xl font-black text-[#1C4670] dark:text-white mb-4 tracking-tighter uppercase">Level Up Your Career! 🚀</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-12 max-w-2xl mx-auto font-medium">You've reached your free limit. Unlock unlimited job applications and land your dream job faster with our premium membership.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                {plans.map((plan) => (
                    <div 
                      key={plan.id} 
                      className={`relative p-8 rounded-[32px] border-2 transition-all duration-500 transform hover:-translate-y-2 flex flex-col ${
                        plan.popular 
                        ? 'border-[#1C4670] bg-[#FFF2E5]/30 dark:bg-[#1C4670]/10 shadow-2xl shadow-[#1C4670]/10' 
                        : 'border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 hover:border-[#FFA229]/30'
                      }`}
                    >
                        {plan.popular && (
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1C4670] text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-xl shadow-[#1C4670]/30 border border-white/20">Most Popular</span>
                        )}
                        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-white/5">
                            {plan.icon}
                        </div>
                        <h3 className="text-xl font-black text-[#1C4670] dark:text-white mb-1 uppercase tracking-tight">{plan.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#FFA229] mb-6">{plan.tagline}</p>
                        
                        <div className="flex flex-col items-center mb-8">
                           <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{plan.price}</div>
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">One Time / Recurring</div>
                        </div>
                        
                        <ul className="space-y-4 mb-10 text-left flex-1">
                            {plan.features.map((f, i) => (
                                <li key={i} className="flex items-center text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-tight">
                                    <div className={`mr-3 p-1 rounded-full ${plan.popular ? 'bg-[#1C4670] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        <Check className="w-3 h-3" />
                                    </div>
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button 
                            disabled={loading}
                            onClick={() => handlePayment(plan.id)}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 ${
                              plan.popular 
                              ? 'bg-[#FFA229] text-white hover:bg-[#FFB34D] shadow-[#FFA229]/25 hover:shadow-[#FFA229]/40' 
                              : 'bg-[#1C4670] text-white hover:bg-[#2A6BA3] shadow-[#1C4670]/25'
                            } disabled:opacity-50`}
                        >
                            {loading ? 'Processing...' : 'Get Started Now'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex items-center justify-center gap-4 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
               <ShieldCheck className="w-5 h-5 text-[#1C4670]" />
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Safe & Secure UPI Payments Powered by Razorpay</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
