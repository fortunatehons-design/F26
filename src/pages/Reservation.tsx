import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { Package, BankAccount } from '../types';
import { motion } from 'motion/react';
import { CreditCard, Shield, Info, ChevronRight, AlertCircle, LogIn, User, Check, CheckCircle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Reservation() {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  useEffect(() => {
    const fetchPackage = async () => {
      if (!packageId) return;
      const snap = await getDoc(doc(db, 'packages', packageId));
      if (snap.exists()) {
        setPkg({ id: snap.id, ...snap.data() } as Package);
      }
      setLoading(false);
    };
    fetchPackage();
  }, [packageId]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pkg) return;
    
    setProcessing(true);
    setError('');

    try {
      // 1. Authorize Card (API Call)
      const authRes = await fetch('/api/auth-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: cardData.number,
          expiry: cardData.expiry,
          cvc: cardData.cvc,
          amount: pkg.price * quantity
        })
      });
      const authData = await authRes.json();
      
      if (!authData.success) throw new Error(authData.message);

      // 2. Create Order in Firestore
      const orderData = {
        packageId: pkg.id,
        packageName: pkg.name,
        quantity,
        totalAmount: pkg.price * quantity,
        status: 'pending_wire',
        userEmail: user.email,
        userId: user.uid,
        createdAt: serverTimestamp(),
        cardLast4: cardData.number.slice(-4),
        wireInstructionsSent: false
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // 3. Fetch Bank Details
      const bSnap = await getDocs(collection(db, 'bankAccounts'));
      const activeBank = bSnap.docs.find(doc => doc.data().active);
      
      // 4. Send Wire Instructions (API Call)
      if (activeBank) {
        await fetch('/api/send-wire-instructions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            orderId: orderRef.id,
            packageName: pkg.name,
            totalAmount: pkg.price * quantity,
            bankDetails: activeBank.data()
          })
        });
      }

      navigate(`/confirmation/${orderRef.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to process reservation.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!pkg) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Package not found.</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 md:pt-32 pb-20 px-6 md:px-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left: Order Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-tighter mb-8">
            RESERVE <span className="font-black italic text-emerald-400">TICKETS</span>
          </h2>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                <p className="text-white/40 text-sm">{pkg.city}</p>
              </div>
              <div className="text-emerald-400 font-bold text-lg">{formatCurrency(pkg.price)} / ticket</div>
            </div>

            <div className="flex items-center justify-between py-4 border-y border-white/5 mb-6">
              <span className="text-white/60">Quantity</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/5"
                >
                  -
                </button>
                <span className="text-white font-bold w-4 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(pkg.availability, quantity + 1))}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/5"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-2xl font-black text-white">
              <span>Total</span>
              <span>{formatCurrency(pkg.price * quantity)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-2xl">
              <Shield className="text-emerald-400 shrink-0" size={20} />
              <p className="text-xs text-emerald-400/80 leading-relaxed">
                Your card will be authorized for the total amount to hold your reservation. 
                Payment must be completed via wire transfer within 72 hours.
              </p>
            </div>
            <div className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <Info className="text-white/40 shrink-0" size={20} />
              <p className="text-xs text-white/40 leading-relaxed">
                Wire instructions will be sent to your email immediately after card authorization.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right: Payment Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12"
        >
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border",
                user ? "bg-emerald-400 border-emerald-400 text-black" : "bg-white/10 border-white/20 text-white"
              )}>
                {user ? <Check size={16} /> : "1"}
              </div>
              <h3 className="text-xl font-bold text-white">Identity Verification</h3>
            </div>
            
            {!user ? (
              <div className="pl-0 md:pl-12">
                <p className="text-white/40 text-sm mb-6">To secure your VIP hospitality package, please verify your identity via Google. This will automatically create your hospitality account.</p>
                <div className="max-w-xs mx-auto md:mx-0">
                  <GoogleSignInButton onClick={handleLogin} />
                </div>
              </div>
            ) : (
              <div className="pl-0 md:pl-12 flex items-center justify-between p-4 bg-emerald-400/5 border border-emerald-400/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-400">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{user.email}</p>
                    <p className="text-emerald-400/60 text-[10px] uppercase tracking-widest">Verified Identity</p>
                  </div>
                </div>
                <div className="text-emerald-400">
                  <CheckCircle size={20} />
                </div>
              </div>
            )}
          </div>

          <div className={cn("transition-opacity duration-500", !user && "opacity-20 pointer-events-none")}>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-xs font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-white">Payment Authorization</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pl-0 md:pl-12">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="text-emerald-400" size={20} />
                <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Credit Card Details</span>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Cardholder Name</label>
                  <input 
                    required
                    type="text"
                    value={cardData.name}
                    onChange={e => setCardData({...cardData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
                    placeholder="JOHN DOE"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Card Number</label>
                  <input 
                    required
                    type="text"
                    value={cardData.number}
                    onChange={e => setCardData({...cardData, number: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
                    placeholder="0000 0000 0000 0000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Expiry</label>
                    <input 
                      required
                      type="text"
                      value={cardData.expiry}
                      onChange={e => setCardData({...cardData, expiry: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">CVC</label>
                    <input 
                      required
                      type="text"
                      value={cardData.cvc}
                      onChange={e => setCardData({...cardData, cvc: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>

              <button 
                disabled={processing}
                type="submit"
                className="w-full py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authorize & Reserve</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-white/20 uppercase tracking-widest">
                Secure 256-bit SSL Encrypted Payment
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
