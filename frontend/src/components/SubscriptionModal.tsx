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
  razorpay_order_id: string;
  razorpay_signature: string;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, email }) => {
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '₹29',
      tagline: 'Best for Trial',
      features: ['Unlimited Applies', 'Email Notifications', 'Basic Support'],
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      color: 'blue'
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '₹399',
      tagline: 'Save 40%',
      features: ['Priority Application', 'Real-time Tracking', 'Premium Support'],
      icon: <Crown className="w-6 h-6 text-purple-500" />,
      color: 'purple',
      popular: true
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: '₹799',
      tagline: 'Job Guarantee',
      features: ['All Exclusive Features', 'Lifetime Access', '24/7 Priority Support'],
      icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
      color: 'green'
    }
  ];

  const handlePayment = async (planId: string) => {
    setLoading(true);
    try {
      // 0. Get Config
      const configRes = await fetch(`${API_BASE}/config`);
      const configData = await configRes.json();
      const razorpayKey = configData.razorpay_key;

      // 1. Create Order
      const res = await fetch(`${API_BASE}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, email })
      });
      const order = await res.json();

      // 2. Open Razorpay
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: "INR",
        name: "Job Apply Dashboard",
        description: `${planId} Subscription`,
        order_id: order.id,
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
            alert('Subscription Activated!');
            onClose();
            window.location.reload();
          }
        },
        prefill: { email },
        theme: { color: "#3B82F6" }
      };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden relative animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-7 h-7" />
        </button>

        <div className="p-8 md:p-12 text-center">
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Level Up Your Career! 🚀</h2>
            <p className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto">You've reached your free limit. Unlock unlimited job applications and land your dream job faster with our premium features.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div key={plan.id} className={`relative p-8 rounded-3xl border-2 transition-all duration-300 transform hover:-translate-y-2 ${plan.popular ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                        {plan.popular && (
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Most Popular</span>
                        )}
                        <div className="mb-6 inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-md">
                            {plan.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{plan.tagline}</p>
                        <div className="text-4xl font-black text-gray-900 mb-8">{plan.price}</div>
                        
                        <ul className="space-y-4 mb-10 text-left">
                            {plan.features.map((f, i) => (
                                <li key={i} className="flex items-center text-gray-600 text-sm font-medium">
                                    <div className={`mr-3 p-0.5 rounded-full ${plan.popular ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button 
                            disabled={loading}
                            onClick={() => handlePayment(plan.id)}
                            className={`w-full py-4 rounded-2xl font-bold transition-all shadow-md active:scale-95 ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-900 text-white hover:bg-black'}`}
                        >
                            Get Started
                        </button>
                    </div>
                ))}
            </div>

            <p className="mt-12 text-sm text-gray-400 font-medium">Safe & Secure UPI Payments Powered by Razorpay</p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
