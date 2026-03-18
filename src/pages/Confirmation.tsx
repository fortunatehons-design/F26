import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { Order, BankAccount } from '../types';
import { motion } from 'motion/react';
import { CheckCircle, Copy, Mail, ExternalLink, Download, Upload, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import FeedbackForm from '../components/FeedbackForm';

export default function Confirmation() {
  const { orderId } = useParams();
  const [user, authLoading] = useAuthState(auth);
  const [order, setOrder] = useState<Order | null>(null);
  const [bank, setBank] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId || authLoading || !user) return;
      
      try {
        const oSnap = await getDoc(doc(db, 'orders', orderId));
        if (oSnap.exists()) {
          const data = oSnap.data() as Order;
          setOrder({ id: oSnap.id, ...data } as Order);
          if (data.wireTransferScreenshot) {
            setScreenshot(data.wireTransferScreenshot);
          }
        }

        const bSnap = await getDocs(collection(db, 'bankAccounts'));
        const activeBank = bSnap.docs.find(doc => doc.data().active);
        if (activeBank) setBank({ id: activeBank.id, ...activeBank.data() } as BankAccount);
      } catch (err: any) {
        console.error("Error fetching confirmation data:", err);
        setError("You don't have permission to view this order or the session expired.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId, user, authLoading]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderId || !screenshot) return;
    setIsConfirming(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        wireTransferScreenshot: screenshot,
        paymentConfirmedByUser: true
      });
      setOrder(prev => prev ? { ...prev, wireTransferScreenshot: screenshot, paymentConfirmedByUser: true } : null);
    } catch (error) {
      console.error("Error confirming payment:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading || authLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4">Access Denied</h3>
          <p className="text-white/60 text-sm mb-8">{error}</p>
          <Link to="/" className="inline-block w-full py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!order || !bank) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Order not found.</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 md:pt-32 pb-20 px-6 md:px-16">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 md:mb-12"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-black md:hidden" />
            <CheckCircle size={40} className="text-black hidden md:block" />
          </div>
          <h2 className="text-3xl md:text-5xl font-light text-white tracking-tighter mb-4">
            RESERVATION <span className="font-black italic text-emerald-400">HELD</span>
          </h2>
          <p className="text-white/60 tracking-widest uppercase text-[10px] md:text-sm">Order #{order.id}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Order Summary */}
          <div className="space-y-8">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8"
            >
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <Mail size={18} className="text-emerald-400" />
                Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Package</span>
                  <span className="text-white">{order.packageName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Quantity</span>
                  <span className="text-white">{order.quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Status</span>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    order.status === 'paid' ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                  )}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </motion.div>

            {/* Payment Confirmation Upload */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8"
            >
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <Upload size={18} className="text-emerald-400" />
                Payment Confirmation
              </h3>
              
              {order.paymentConfirmedByUser ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-emerald-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={24} className="text-emerald-400" />
                  </div>
                  <p className="text-white font-bold text-sm mb-2">Confirmation Received</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">Our team is verifying your transfer</p>
                  {screenshot && (
                    <div className="mt-6 rounded-xl overflow-hidden border border-white/10">
                      <img src={screenshot} alt="Wire Confirmation" className="w-full h-auto" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-xs text-white/40 leading-relaxed">
                    Upload a screenshot or photo of your wire transfer receipt to expedite verification.
                  </p>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={cn(
                      "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-colors",
                      screenshot ? "border-emerald-400/50 bg-emerald-400/5" : "border-white/10 hover:border-white/20"
                    )}>
                      {screenshot ? (
                        <div className="relative w-full">
                          <img src={screenshot} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                            <span className="text-white text-[10px] font-bold uppercase tracking-widest">Change Image</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                            <ImageIcon size={24} className="text-white/40" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Select Screenshot</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={!screenshot || isConfirming}
                    onClick={handleConfirmPayment}
                    className="w-full py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isConfirming ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Confirm Payment</span>
                        <Check size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Wire Instructions */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8"
          >
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <Download size={18} className="text-emerald-400" />
              Wire Instructions
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Bank Name', value: bank.bankName },
                { label: 'Account Holder', value: bank.accountHolder },
                { label: 'IBAN', value: bank.iban },
                { label: 'SWIFT/BIC', value: bank.swift },
              ].map((item) => (
                <div key={item.label} className="group">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">{item.label}</label>
                  <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/5 group-hover:border-white/20 transition-colors">
                    <span className="text-sm text-white font-mono">{item.value}</span>
                    <button 
                      onClick={() => copyToClipboard(item.value, item.label)}
                      className="text-white/20 hover:text-emerald-400 transition-colors"
                    >
                      {copied === item.label ? <span className="text-[10px] font-bold">COPIED</span> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row gap-4 justify-center">
          <Link 
            to="/"
            className="px-12 py-4 bg-white text-black rounded-full font-bold text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all"
          >
            Return Home
          </Link>
          <button className="flex items-center justify-center gap-2 px-12 py-4 bg-white/10 text-white border border-white/20 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-white/20 transition-all">
            <Download size={18} />
            <span>Download PDF</span>
          </button>
        </div>

        <div className="max-w-2xl mx-auto">
          <FeedbackForm orderId={order.id} />
        </div>

        <p className="mt-8 text-white/20 text-[10px] uppercase tracking-[0.3em] max-w-lg mx-auto leading-relaxed">
          Please complete the transfer within 72 hours to avoid cancellation. 
          Use Order ID #{order.id} as reference.
        </p>
      </div>
    </div>
  );
}
