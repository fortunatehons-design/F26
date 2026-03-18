import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, updateDoc, doc, addDoc, query, orderBy } from 'firebase/firestore';
import { Order, Package, BankAccount, Feedback, Match, KnowledgeBaseEntry, UserProfile } from '../types';
import { motion } from 'motion/react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { GoogleGenAI, Type } from '@google/genai';
import { Shield, Package as PackageIcon, ShoppingBag, CreditCard, MessageSquare, Check, X, Plus, Image as ImageIcon, ExternalLink, Trophy, BookOpen, Save, LogIn, LogOut, Sparkles, Loader2, Users as UsersIcon, User, Clock, Activity } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const [user, authLoading] = useAuthState(auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'packages' | 'matches' | 'knowledge' | 'bank' | 'feedback' | 'users'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<KnowledgeBaseEntry | null>(null);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportType, setBulkImportType] = useState<'matches' | 'packages' | 'knowledge'>('matches');
  const [bulkText, setBulkText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isWikiImporting, setIsWikiImporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      
      try {
        const [oSnap, pSnap, mSnap, kSnap, bSnap, fSnap, uSnap] = await Promise.all([
          getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))).catch(() => ({ docs: [] })),
          getDocs(collection(db, 'packages')).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, 'matches'), orderBy('date', 'asc'))).catch(() => ({ docs: [] })),
          getDocs(collection(db, 'knowledgeBase')).catch(() => ({ docs: [] })),
          getDocs(collection(db, 'bankAccounts')).catch(() => ({ docs: [] })),
          getDocs(query(collection(db, 'feedback'), orderBy('timestamp', 'desc'))).catch(() => ({ docs: [] })),
          getDocs(collection(db, 'users')).catch(() => ({ docs: [] }))
        ]);

        setOrders((oSnap as any).docs.map((d: any) => ({ id: d.id, ...d.data() } as Order)));
        setPackages((pSnap as any).docs.map((d: any) => ({ id: d.id, ...d.data() } as Package)));
        setMatches((mSnap as any).docs.map((d: any) => ({ id: d.id, ...d.data() } as Match)));
        setKnowledgeBase((kSnap as any).docs.map((d: any) => ({ id: d.id, ...d.data() } as KnowledgeBaseEntry)));
        setBankAccounts((bSnap as any).docs.map((d: any) => ({ id: d.id, ...d.data() } as BankAccount)));
        setFeedback((fSnap as any).docs.map((d: any) => ({ id: d.id, ...d.data() } as Feedback)));
        setUsers((uSnap as any).docs.map((d: any) => ({ id: d.id, ...d.data() } as UserProfile)));
        
        // Initialize bank account if none exists
        if ((bSnap as any).empty && user?.email === 'fortunatehons@gmail.com') {
          const defaultBank = {
            bankName: "Global Reserve Bank",
            accountHolder: "FIFA 2026 Hospitality Group",
            iban: "US12 3456 7890 1234 5678 90",
            swift: "GRBUSA33",
            active: true
          };
          const dRef = await addDoc(collection(db, 'bankAccounts'), defaultBank);
          setBankAccounts([{ id: dRef.id, ...defaultBank }]);
        }

        // Initialize packages if empty
        if ((pSnap as any).empty && user?.email === 'fortunatehons@gmail.com') {
          const defaultPackage = {
            name: "Diamond Final Experience",
            city: "Los Angeles",
            price: 25000,
            availability: 10,
            category: "Finals",
            description: "The ultimate luxury experience for the FIFA World Cup 2026 Final. Includes private suite, gourmet dining, and exclusive field access."
          };
          const dRef = await addDoc(collection(db, 'packages'), defaultPackage);
          setPackages([{ id: dRef.id, ...defaultPackage } as Package]);
        }

        // Initialize matches if empty
        if ((mSnap as any).empty && user?.email === 'fortunatehons@gmail.com') {
          const defaultMatch = {
            homeTeam: "USA",
            awayTeam: "TBD",
            date: "2026-06-11",
            venue: "SoFi Stadium",
            city: "Los Angeles",
            stage: "Opening Match"
          };
          const dRef = await addDoc(collection(db, 'matches'), defaultMatch);
          setMatches([{ id: dRef.id, ...defaultMatch } as Match]);
        }

        // Initialize knowledge base if empty
        if ((kSnap as any).empty && user?.email === 'fortunatehons@gmail.com') {
          const defaultKnowledge = {
            topic: "Stadium Security Protocol",
            content: "VIP guests have dedicated security lanes. Please ensure you have your digital hospitality pass ready on your mobile device for seamless entry.",
            category: "stadium" as const
          };
          const dRef = await addDoc(collection(db, 'knowledgeBase'), defaultKnowledge);
          setKnowledgeBase([{ id: dRef.id, ...defaultKnowledge } as KnowledgeBaseEntry]);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading]);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    await updateDoc(doc(db, 'orders', orderId), { status });
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handlePackageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      alert('You must be signed in to perform this action.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const pkgData = {
      name: formData.get('name') as string,
      city: formData.get('city') as string,
      price: Number(formData.get('price')),
      availability: Number(formData.get('availability')),
      category: formData.get('category') as string,
      description: formData.get('description') as string,
    };

    try {
      if (editingPackage) {
        await updateDoc(doc(db, 'packages', editingPackage.id), pkgData);
        setPackages(packages.map(p => p.id === editingPackage.id ? { ...p, ...pkgData } : p));
        alert('Package updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'packages'), pkgData);
        setPackages([...packages, { id: docRef.id, ...pkgData } as Package]);
        alert('Package created successfully!');
      }
      setIsAddingPackage(false);
      setEditingPackage(null);
    } catch (error) {
      console.error("Error saving package:", error);
      alert('Error saving package: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleMatchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      alert('You must be signed in to perform this action.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const matchData = {
      homeTeam: formData.get('homeTeam') as string,
      awayTeam: formData.get('awayTeam') as string,
      date: formData.get('date') as string,
      venue: formData.get('venue') as string,
      city: formData.get('city') as string,
      stage: formData.get('stage') as string,
    };

    try {
      if (editingMatch) {
        await updateDoc(doc(db, 'matches', editingMatch.id), matchData);
        setMatches(matches.map(m => m.id === editingMatch.id ? { ...m, ...matchData } : m));
        alert('Match updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'matches'), matchData);
        setMatches([...matches, { id: docRef.id, ...matchData } as Match]);
        alert('Match created successfully!');
      }
      setIsAddingMatch(false);
      setEditingMatch(null);
    } catch (error) {
      console.error("Error saving match:", error);
      alert('Error saving match: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleKnowledgeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      alert('You must be signed in to perform this action.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const kData = {
      topic: formData.get('topic') as string,
      content: formData.get('content') as string,
      category: formData.get('category') as KnowledgeBaseEntry['category'],
    };

    try {
      if (editingKnowledge) {
        await updateDoc(doc(db, 'knowledgeBase', editingKnowledge.id), kData);
        setKnowledgeBase(knowledgeBase.map(k => k.id === editingKnowledge.id ? { ...k, ...kData } : k));
        alert('Knowledge entry updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'knowledgeBase'), kData);
        setKnowledgeBase([...knowledgeBase, { id: docRef.id, ...kData } as KnowledgeBaseEntry]);
        alert('Knowledge entry created successfully!');
      }
      setIsAddingKnowledge(false);
      setEditingKnowledge(null);
    } catch (error) {
      console.error("Error saving knowledge entry:", error);
      alert('Error saving knowledge entry: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleWikiImport = async () => {
    setIsWikiImporting(true);
    setIsParsing(true);
    setParsedData([]);
    setBulkImportType('matches');
    setIsBulkImporting(true);

    try {
      const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
      if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
        throw new Error("Gemini API key is missing or invalid.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const matchSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            homeTeam: { type: Type.STRING },
            awayTeam: { type: Type.STRING },
            date: { type: Type.STRING, description: "YYYY-MM-DD format" },
            venue: { type: Type.STRING },
            city: { type: Type.STRING },
            stage: { type: Type.STRING }
          },
          required: ["homeTeam", "awayTeam", "date", "venue", "city", "stage"]
        }
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Extract all FIFA World Cup 2026 matches from https://en.wikipedia.org/wiki/2026_FIFA_World_Cup#Match_schedule. For each match, extract: homeTeam, awayTeam, date (YYYY-MM-DD), venue, city, and stage. Return as a JSON array.",
        config: {
          tools: [{ urlContext: {} }],
          responseMimeType: "application/json",
          responseSchema: matchSchema
        }
      });

      if (!response.text) {
        throw new Error("AI returned an empty response.");
      }

      const data = JSON.parse(response.text);
      setParsedData(data);
    } catch (error) {
      console.error("Wiki import error:", error);
      alert(`Failed to import from Wikipedia: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsParsing(false);
      setIsWikiImporting(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setIsParsing(true);
    setParsedData([]);

    try {
      const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
      if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
        throw new Error("Gemini API key is missing or invalid. Please ensure it is set in the environment.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const matchSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            homeTeam: { type: Type.STRING },
            awayTeam: { type: Type.STRING },
            date: { type: Type.STRING, description: "YYYY-MM-DD format" },
            venue: { type: Type.STRING },
            city: { type: Type.STRING },
            stage: { type: Type.STRING }
          },
          required: ["homeTeam", "awayTeam", "date", "venue", "city", "stage"]
        }
      };

      const packageSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            city: { type: Type.STRING },
            price: { type: Type.NUMBER },
            availability: { type: Type.NUMBER },
            category: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "city", "price", "availability", "category", "description"]
        }
      };

      const knowledgeSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: "A concise title for the knowledge entry" },
            content: { type: Type.STRING, description: "The detailed information or answer" },
            category: { type: Type.STRING, description: "One of: general, stadium, travel, faq" }
          },
          required: ["topic", "content", "category"]
        }
      };

      const prompt = `You are a data extraction expert. Your task is to extract ${bulkImportType} from the provided text.
      
      Instructions:
      1. Organize the text into logical entries.
      2. Clean up any formatting errors, typos, or irrelevant snippets.
      3. Deduplicate information if the same topic appears multiple times.
      4. For Knowledge Base entries, ensure the 'topic' is clear and the 'content' is helpful.
      5. If the text is messy or unstructured, do your best to infer the correct fields.
      6. If no ${bulkImportType} can be found at all, return an empty array [].
      
      Text to process:
      ${bulkText}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: bulkImportType === 'matches' ? matchSchema : (bulkImportType === 'packages' ? packageSchema : knowledgeSchema)
        }
      });

      if (!response.text) {
        throw new Error("AI returned an empty response. Please try with different text.");
      }

      const data = JSON.parse(response.text);
      setParsedData(data);
    } catch (error) {
      console.error("Bulk import error:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to parse text: ${msg}. Please ensure the format is clear and try again.`);
    } finally {
      setIsParsing(false);
    }
  };

  const saveBulkData = async () => {
    if (!parsedData.length) return;
    setIsParsing(true);

    try {
      const collectionName = bulkImportType === 'matches' ? 'matches' : (bulkImportType === 'packages' ? 'packages' : 'knowledgeBase');
      
      const normalizedData = parsedData.map(item => {
        if (bulkImportType === 'knowledge') {
          const validCategories = ['general', 'stadium', 'travel', 'faq'];
          const category = (item.category || 'general').toLowerCase();
          return {
            ...item,
            category: validCategories.includes(category) ? category : 'general'
          };
        }
        return item;
      });

      const promises = normalizedData.map(item => addDoc(collection(db, collectionName), item));
      await Promise.all(promises);
      
      // Refresh local state
      if (bulkImportType === 'matches') {
        const mSnap = await getDocs(query(collection(db, 'matches'), orderBy('date', 'asc')));
        setMatches(mSnap.docs.map(d => ({ id: d.id, ...d.data() } as Match)));
      } else if (bulkImportType === 'packages') {
        const pSnap = await getDocs(collection(db, 'packages'));
        setPackages(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Package)));
      } else {
        const kSnap = await getDocs(collection(db, 'knowledgeBase'));
        setKnowledgeBase(kSnap.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgeBaseEntry)));
      }

      alert(`Successfully imported ${parsedData.length} ${bulkImportType}!`);
      setIsBulkImporting(false);
      setBulkText('');
      setParsedData([]);
    } catch (error) {
      console.error("Error saving bulk data:", error);
      alert("Failed to save imported data.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleBankUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bankId = bankAccounts[0]?.id;
    if (!bankId) return;

    const bankData = {
      bankName: formData.get('bankName') as string,
      accountHolder: formData.get('accountHolder') as string,
      iban: formData.get('iban') as string,
      swift: formData.get('swift') as string,
    };

    try {
      await updateDoc(doc(db, 'bankAccounts', bankId), bankData);
      setBankAccounts([{ id: bankId, ...bankAccounts[0], ...bankData }]);
      setIsEditingBank(false);
    } catch (error) {
      console.error("Error updating bank details:", error);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error(err);
      alert('Login failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (authLoading || loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Admin...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
        <Shield size={48} className="text-emerald-400 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-widest">Admin Access Required</h2>
        <p className="text-white/40 text-center max-w-md mb-8">Please sign in with your administrator account to access the control center.</p>
        <div className="w-full max-w-xs">
          <GoogleSignInButton text="Sign In with Google" onClick={handleLogin} />
        </div>
      </div>
    );
  }

  if (user.email !== 'fortunatehons@gmail.com') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
        <Shield size={48} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-widest">Access Denied</h2>
        <p className="text-white/40 text-center max-w-md mb-8">
          This area is reserved for administrators only. <br />
          Current account: <span className="text-white font-bold">{user.email}</span>
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-white/10 text-white rounded-full font-bold uppercase tracking-widest hover:bg-white/20 transition-colors"
          >
            Return Home
          </button>
          <button 
            onClick={() => auth.signOut()}
            className="px-8 py-4 bg-red-500/20 text-red-500 rounded-full font-bold uppercase tracking-widest hover:bg-red-500/30 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'packages', label: 'Packages', icon: PackageIcon },
    { id: 'matches', label: 'Matches', icon: Trophy },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'bank', label: 'Bank Info', icon: CreditCard },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 md:pt-32 pb-20 px-4 sm:px-8 md:px-16">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-6">
            <div>
              <div className="flex items-center gap-3 text-emerald-400 mb-2">
                <Shield size={20} />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Admin Control Center</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-light text-white tracking-tighter">
                DASHBOARD <span className="font-black italic text-emerald-400">INSIGHTS</span>
              </h2>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-400">
                  <User size={16} />
                </div>
                <div className="hidden sm:block">
                  <p className="text-white text-[10px] font-bold truncate max-w-[150px]">{user.email}</p>
                  <p className="text-white/40 text-[8px] uppercase tracking-widest">Administrator</p>
                </div>
              </div>
              <button 
                onClick={() => auth.signOut()}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 min-w-max">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all",
                    activeTab === tab.id ? "bg-white text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
        >
          {activeTab === 'orders' && (
            <div>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/40">
                      <th className="px-8 py-6">Order</th>
                      <th className="px-8 py-6">Customer</th>
                      <th className="px-8 py-6">Package</th>
                      <th className="px-8 py-6">Amount</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map(order => (
                      <tr key={order.id} className="text-sm text-white/80 hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6 font-mono text-[10px] text-white/40">#{order.id.slice(0, 6)}</td>
                        <td className="px-8 py-6">
                          <div className="truncate max-w-[200px]">{order.userEmail}</div>
                          {order.paymentConfirmedByUser && (
                            <div className="flex items-center gap-1 mt-1 text-emerald-400 text-[9px] uppercase font-bold">
                              <Check size={10} />
                              <span>Confirmed</span>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6">{order.packageName} (x{order.quantity})</td>
                        <td className="px-8 py-6 font-bold">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-2">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit",
                              order.status === 'paid' ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                            )}>
                              {order.status.replace('_', ' ')}
                            </span>
                            {order.wireTransferScreenshot && (
                              <button 
                                onClick={() => setSelectedScreenshot(order.wireTransferScreenshot)}
                                className="flex items-center gap-1 text-[9px] text-white/40 hover:text-white transition-colors uppercase tracking-widest font-bold"
                              >
                                <ImageIcon size={10} />
                                <span>Receipt</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {order.status !== 'paid' && (
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'paid')}
                              className="p-2 bg-emerald-400 text-black rounded-lg hover:scale-110 transition-transform inline-flex"
                            >
                              <Check size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-white/5">
                {orders.map(order => (
                  <div key={order.id} className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[10px] font-mono text-white/40 mb-1">#{order.id.slice(0, 6)}</div>
                        <div className="text-white font-bold text-sm truncate max-w-[200px]">{order.userEmail}</div>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest",
                        order.status === 'paid' ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                      )}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-y border-white/5">
                      <div className="text-xs text-white/60">
                        {order.packageName} <span className="text-white/40 ml-1">x{order.quantity}</span>
                      </div>
                      <div className="text-sm font-bold text-white">{formatCurrency(order.totalAmount)}</div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-4">
                        {order.wireTransferScreenshot && (
                          <button 
                            onClick={() => setSelectedScreenshot(order.wireTransferScreenshot)}
                            className="flex items-center gap-2 text-[10px] text-emerald-400 uppercase tracking-widest font-bold"
                          >
                            <ImageIcon size={14} />
                            <span>View Receipt</span>
                          </button>
                        )}
                        {order.paymentConfirmedByUser && (
                          <div className="flex items-center gap-1 text-emerald-400 text-[10px] uppercase font-bold">
                            <Check size={12} />
                            <span>User Confirmed</span>
                          </div>
                        )}
                      </div>
                      {order.status !== 'paid' && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'paid')}
                          className="px-4 py-2 bg-emerald-400 text-black rounded-lg text-[10px] font-bold uppercase tracking-widest"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-4 md:p-8">
              <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-8">Registered Users</h3>
              
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-4 px-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">User</th>
                      <th className="py-4 px-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Role</th>
                      <th className="py-4 px-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Selected Package</th>
                      <th className="py-4 px-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Last Active</th>
                      <th className="py-4 px-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const userOrders = orders.filter(o => o.userId === u.id);
                      const latestOrder = userOrders[0];
                      const lastActiveDate = u.lastActive?.toDate ? u.lastActive.toDate() : null;
                      const isOnline = lastActiveDate && (new Date().getTime() - lastActiveDate.getTime()) < 5 * 60 * 1000;
                      
                      return (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/10 overflow-hidden">
                                  {u.photoURL ? <img src={u.photoURL} alt="" /> : <UsersIcon size={14} />}
                                </div>
                                {isOnline && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#151619] rounded-full" />
                                )}
                              </div>
                              <div>
                                <div className="text-white font-bold text-sm">{u.displayName || 'Anonymous'}</div>
                                <div className="text-white/40 text-xs">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={cn(
                              "text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest",
                              u.role === 'admin' ? "bg-emerald-400/10 text-emerald-400" : "bg-white/10 text-white/60"
                            )}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {latestOrder ? (
                              <div className="text-white text-sm">
                                {latestOrder.packageName}
                                <div className="text-white/40 text-[10px] uppercase tracking-widest">
                                  {formatCurrency(latestOrder.totalAmount)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-white/20 text-xs italic">No orders yet</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-white/60 text-xs">
                              <Clock size={12} />
                              {lastActiveDate ? lastActiveDate.toLocaleString() : 'Never'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                isOnline ? "bg-emerald-400" : "bg-white/20"
                              )} />
                              <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">
                                {isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {users.map((u) => {
                  const userOrders = orders.filter(o => o.userId === u.id);
                  const latestOrder = userOrders[0];
                  const lastActiveDate = u.lastActive?.toDate ? u.lastActive.toDate() : null;
                  const isOnline = lastActiveDate && (new Date().getTime() - lastActiveDate.getTime()) < 5 * 60 * 1000;

                  return (
                    <div key={u.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/10 overflow-hidden">
                              {u.photoURL ? <img src={u.photoURL} alt="" /> : <UsersIcon size={16} />}
                            </div>
                            {isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#151619] rounded-full" />
                            )}
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm">{u.displayName || 'Anonymous'}</div>
                            <div className="text-white/40 text-[10px]">{u.email}</div>
                          </div>
                        </div>
                        <span className={cn(
                          "text-[9px] px-2 py-1 rounded-full font-bold uppercase tracking-widest",
                          u.role === 'admin' ? "bg-emerald-400/10 text-emerald-400" : "bg-white/10 text-white/60"
                        )}>
                          {u.role}
                        </span>
                      </div>

                      <div className="py-3 border-y border-white/5">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Latest Activity</div>
                        {latestOrder ? (
                          <div className="text-white text-xs">
                            Reserved <span className="font-bold">{latestOrder.packageName}</span>
                            <div className="text-emerald-400 font-bold mt-0.5">{formatCurrency(latestOrder.totalAmount)}</div>
                          </div>
                        ) : (
                          <div className="text-white/20 text-xs italic">No purchase history</div>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-widest font-bold">
                        <div className="flex items-center gap-2">
                          <Clock size={12} />
                          <span>{lastActiveDate ? lastActiveDate.toLocaleDateString() : 'Never'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-emerald-400" : "bg-white/20")} />
                          <span>{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="p-4 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Manage Packages</h3>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => { setBulkImportType('packages'); setIsBulkImporting(true); }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-400/10 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-400/20 hover:bg-emerald-400/20 transition-all"
                  >
                    <Sparkles size={14} />
                    <span>Bulk Import</span>
                  </button>
                  <button 
                    onClick={() => setIsAddingPackage(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-400 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
                  >
                    <Plus size={14} />
                    <span>Add Package</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {packages.map(pkg => (
                  <div key={pkg.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl group relative">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingPackage(pkg)}
                        className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <Plus size={14} className="rotate-45" />
                      </button>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2">{pkg.category}</div>
                    <h4 className="text-white font-bold mb-2">{pkg.name}</h4>
                    <p className="text-white/40 text-xs mb-4 line-clamp-2">{pkg.description}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <span className="text-emerald-400 font-bold">{formatCurrency(pkg.price)}</span>
                      <span className="text-white/20 text-[10px] uppercase tracking-widest font-bold">Stock: {pkg.availability}</span>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => setIsAddingPackage(true)}
                  className="flex flex-col items-center justify-center p-6 border border-dashed border-white/20 rounded-2xl text-white/40 hover:text-white hover:border-white/40 transition-all min-h-[160px]"
                >
                  <Plus size={24} className="mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest">Add New Package</span>
                </button>
              </div>

              {/* Add/Edit Package Modal */}
              <AnimatePresence>
                {(isAddingPackage || editingPackage) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-[#151619] border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-light text-white tracking-tight">
                          {isAddingPackage ? 'ADD' : 'EDIT'} <span className="font-black italic text-emerald-400">PACKAGE</span>
                        </h3>
                        <button 
                          onClick={() => { setIsAddingPackage(false); setEditingPackage(null); }}
                          className="p-2 text-white/40 hover:text-white transition-colors"
                        >
                          <X size={24} />
                        </button>
                      </div>

                      <form onSubmit={handlePackageSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Package Name</label>
                          <input 
                            required
                            name="name"
                            defaultValue={editingPackage?.name}
                            placeholder="e.g. Diamond Final Experience"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-400/50 outline-none transition-colors" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">City</label>
                          <input 
                            required
                            name="city"
                            defaultValue={editingPackage?.city}
                            placeholder="e.g. Los Angeles"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-400/50 outline-none transition-colors" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Price (USD)</label>
                          <input 
                            required
                            type="number"
                            name="price"
                            defaultValue={editingPackage?.price}
                            placeholder="25000"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-400/50 outline-none transition-colors" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Availability</label>
                          <input 
                            required
                            type="number"
                            name="availability"
                            defaultValue={editingPackage?.availability}
                            placeholder="10"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-400/50 outline-none transition-colors" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Category</label>
                          <select 
                            name="category"
                            defaultValue={editingPackage?.category || 'Finals'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-400/50 outline-none transition-colors appearance-none"
                          >
                            <option value="Finals">Finals</option>
                            <option value="Semi-Finals">Semi-Finals</option>
                            <option value="Group Stage">Group Stage</option>
                            <option value="Opening Match">Opening Match</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Description</label>
                          <textarea 
                            required
                            name="description"
                            defaultValue={editingPackage?.description}
                            rows={4}
                            placeholder="Detailed package benefits..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-400/50 outline-none transition-colors resize-none" 
                          />
                        </div>
                        <div className="md:col-span-2 pt-4">
                          <button 
                            type="submit"
                            className="w-full py-4 bg-emerald-400 text-black rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform"
                          >
                            {isAddingPackage ? 'Create Package' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="p-4 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Match Schedule</h3>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <button 
                    onClick={handleWikiImport}
                    disabled={isWikiImporting}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-400/10 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-400/20 hover:bg-emerald-400/20 transition-all disabled:opacity-50"
                  >
                    {isWikiImporting ? <Loader2 className="animate-spin" size={14} /> : <ExternalLink size={14} />}
                    <span>Sync with Wikipedia</span>
                  </button>
                  <button 
                    onClick={() => {
                      setBulkImportType('matches');
                      setIsBulkImporting(true);
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <Sparkles size={14} />
                    <span>Bulk Import</span>
                  </button>
                  <button 
                    onClick={() => setIsAddingMatch(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-400 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
                  >
                    <Plus size={14} />
                    <span>Add Match</span>
                  </button>
                </div>
              </div>
              
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/40">
                      <th className="px-4 py-6">Date</th>
                      <th className="px-4 py-6">Matchup</th>
                      <th className="px-4 py-6">Venue</th>
                      <th className="px-4 py-6">Stage</th>
                      <th className="px-4 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {matches.map(match => (
                      <tr key={match.id} className="text-sm text-white/80 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-6 font-mono text-[10px]">{match.date}</td>
                        <td className="px-4 py-6">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{match.homeTeam}</span>
                            <span className="text-white/20">vs</span>
                            <span className="font-bold">{match.awayTeam}</span>
                          </div>
                        </td>
                        <td className="px-4 py-6">
                          <div>{match.venue}</div>
                          <div className="text-[10px] text-white/40 uppercase tracking-widest">{match.city}</div>
                        </td>
                        <td className="px-4 py-6">
                          <span className="px-2 py-1 bg-white/5 rounded text-[10px] uppercase tracking-widest font-bold">
                            {match.stage}
                          </span>
                        </td>
                        <td className="px-4 py-6 text-right">
                          <button 
                            onClick={() => {
                              setEditingMatch(match);
                              setIsAddingMatch(true);
                            }}
                            className="p-2 text-white/40 hover:text-white transition-colors"
                          >
                            <ExternalLink size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {matches.map(match => (
                  <div key={match.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{match.date}</div>
                      <span className="px-2 py-1 bg-white/5 rounded text-[9px] uppercase tracking-widest font-bold text-white/60">
                        {match.stage}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="text-center flex-1">
                        <div className="text-sm font-bold text-white">{match.homeTeam}</div>
                      </div>
                      <div className="text-[10px] text-white/20 font-bold italic">VS</div>
                      <div className="text-center flex-1">
                        <div className="text-sm font-bold text-white">{match.awayTeam}</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-white/80">{match.venue}</div>
                        <div className="text-[9px] text-white/40 uppercase tracking-widest">{match.city}</div>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingMatch(match);
                          setIsAddingMatch(true);
                        }}
                        className="p-2 bg-white/10 rounded-lg text-white/60"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add/Edit Match Modal */}
              <AnimatePresence>
                {(isAddingMatch || editingMatch) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-[#151619] border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-light text-white tracking-tight">
                          {isAddingMatch ? 'ADD' : 'EDIT'} <span className="font-black italic text-emerald-400">MATCH</span>
                        </h3>
                        <button 
                          onClick={() => { setIsAddingMatch(false); setEditingMatch(null); }}
                          className="p-2 text-white/40 hover:text-white transition-colors"
                        >
                          <X size={24} />
                        </button>
                      </div>

                      <form onSubmit={handleMatchSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Home Team</label>
                          <input required name="homeTeam" defaultValue={editingMatch?.homeTeam} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Away Team</label>
                          <input required name="awayTeam" defaultValue={editingMatch?.awayTeam} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Date</label>
                          <input required type="date" name="date" defaultValue={editingMatch?.date} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Stage</label>
                          <input required name="stage" defaultValue={editingMatch?.stage} placeholder="e.g. Quarter-Final" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Venue</label>
                          <input required name="venue" defaultValue={editingMatch?.venue} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">City</label>
                          <input required name="city" defaultValue={editingMatch?.city} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm" />
                        </div>
                        <div className="md:col-span-2 pt-4">
                          <button type="submit" className="w-full py-4 bg-emerald-400 text-black rounded-xl font-bold uppercase tracking-widest">
                            {isAddingMatch ? 'Create Match' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="p-4 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Knowledge Base</h3>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => { setBulkImportType('knowledge'); setIsBulkImporting(true); }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-400/10 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-400/20 hover:bg-emerald-400/20 transition-all"
                  >
                    <Sparkles size={14} />
                    <span>Bulk AI Import</span>
                  </button>
                  <button 
                    onClick={() => setIsAddingKnowledge(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-400 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
                  >
                    <Plus size={14} />
                    <span>Add Entry</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {knowledgeBase.map(entry => (
                  <div key={entry.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl group relative">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingKnowledge(entry)}
                        className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <Plus size={14} className="rotate-45" />
                      </button>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2">{entry.category}</div>
                    <h4 className="text-white font-bold mb-2">{entry.topic}</h4>
                    <p className="text-white/40 text-xs line-clamp-3 leading-relaxed">{entry.content}</p>
                  </div>
                ))}
                <button 
                  onClick={() => setIsAddingKnowledge(true)}
                  className="flex flex-col items-center justify-center p-6 border border-dashed border-white/20 rounded-2xl text-white/40 hover:text-white hover:border-white/40 transition-all min-h-[160px]"
                >
                  <Plus size={24} className="mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest">Add Knowledge Entry</span>
                </button>
              </div>

              {/* Add/Edit Knowledge Modal */}
              <AnimatePresence>
                {(isAddingKnowledge || editingKnowledge) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-[#151619] border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-light text-white tracking-tight">
                          {isAddingKnowledge ? 'ADD' : 'EDIT'} <span className="font-black italic text-emerald-400">KNOWLEDGE</span>
                        </h3>
                        <button 
                          onClick={() => { setIsAddingKnowledge(false); setEditingKnowledge(null); }}
                          className="p-2 text-white/40 hover:text-white transition-colors"
                        >
                          <X size={24} />
                        </button>
                      </div>

                      <form onSubmit={handleKnowledgeSubmit} className="space-y-6">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Topic</label>
                          <input required name="topic" defaultValue={editingKnowledge?.topic} placeholder="e.g. Stadium Security Protocol" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Category</label>
                          <select name="category" defaultValue={editingKnowledge?.category || 'general'} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm appearance-none">
                            <option value="general">General</option>
                            <option value="stadium">Stadium</option>
                            <option value="travel">Travel</option>
                            <option value="faq">FAQ</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Content</label>
                          <textarea required name="content" defaultValue={editingKnowledge?.content} rows={6} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm resize-none" />
                        </div>
                        <div className="pt-4">
                          <button type="submit" className="w-full py-4 bg-emerald-400 text-black rounded-xl font-bold uppercase tracking-widest">
                            {isAddingKnowledge ? 'Add Entry' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="p-6 md:p-8 max-w-2xl">
              {bankAccounts.map(bank => (
                <form key={bank.id} onSubmit={handleBankUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Bank Name</label>
                      <input 
                        name="bankName"
                        readOnly={!isEditingBank} 
                        defaultValue={bank.bankName} 
                        className={cn(
                          "w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm transition-all",
                          !isEditingBank && "text-white/40 cursor-not-allowed"
                        )} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Account Holder</label>
                      <input 
                        name="accountHolder"
                        readOnly={!isEditingBank} 
                        defaultValue={bank.accountHolder} 
                        className={cn(
                          "w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm transition-all",
                          !isEditingBank && "text-white/40 cursor-not-allowed"
                        )} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">IBAN</label>
                    <input 
                      name="iban"
                      readOnly={!isEditingBank} 
                      defaultValue={bank.iban} 
                      className={cn(
                        "w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white font-mono text-sm transition-all",
                        !isEditingBank && "text-white/40 cursor-not-allowed"
                      )} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">SWIFT / BIC</label>
                    <input 
                      name="swift"
                      readOnly={!isEditingBank} 
                      defaultValue={bank.swift} 
                      className={cn(
                        "w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white font-mono text-sm transition-all",
                        !isEditingBank && "text-white/40 cursor-not-allowed"
                      )} 
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    {!isEditingBank ? (
                      <button 
                        type="button"
                        onClick={() => setIsEditingBank(true)}
                        className="w-full sm:w-auto px-8 py-3 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors"
                      >
                        Edit Bank Details
                      </button>
                    ) : (
                      <>
                        <button 
                          type="submit"
                          className="flex items-center gap-2 px-8 py-3 bg-emerald-400 text-black rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
                        >
                          <Save size={14} />
                          <span>Save Changes</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsEditingBank(false)}
                          className="px-8 py-3 bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </form>
              ))}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="p-8 space-y-6">
              {feedback.map(f => (
                <div key={f.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < f.rating ? "text-emerald-400 fill-emerald-400" : "text-white/10"} />
                      ))}
                    </div>
                    <span className="text-[10px] text-white/20 uppercase tracking-widest">
                      {new Date(f.timestamp?.toDate()).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{f.comment}</p>
                </div>
              ))}
              {feedback.length === 0 && (
                <div className="text-center py-20 text-white/20 uppercase tracking-widest text-sm">
                  No feedback received yet
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {isBulkImporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#151619] border border-white/10 rounded-3xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <Sparkles size={16} />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold italic">AI Powered</span>
                  </div>
                  <h3 className="text-2xl font-light text-white tracking-tight">
                    BULK <span className="font-black italic text-emerald-400 uppercase">{bulkImportType}</span> IMPORT
                  </h3>
                </div>
                <button 
                  onClick={() => { setIsBulkImporting(false); setParsedData([]); setBulkText(''); }}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {!parsedData.length ? (
                <div className="space-y-6">
                  <p className="text-white/40 text-sm leading-relaxed">
                    Paste unstructured text containing {bulkImportType} details (e.g., from a PDF, email, or website). 
                    Our AI will automatically extract and organize the data for you.
                  </p>
                  <textarea 
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder={`Paste ${bulkImportType} data here...`}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm font-mono min-h-[300px] focus:border-emerald-400/50 outline-none transition-all resize-none"
                  />
                  <button 
                    onClick={handleBulkImport}
                    disabled={isParsing || !bulkText.trim()}
                    className="w-full py-5 bg-emerald-400 text-black rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Analyzing Text...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Extract & Organize</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40 uppercase tracking-widest font-bold">
                      Found {parsedData.length} {bulkImportType}
                    </span>
                    <button 
                      onClick={() => setParsedData([])}
                      className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold hover:underline"
                    >
                      Edit Source Text
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsedData.map((item, i) => (
                      <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                        {bulkImportType === 'matches' ? (
                          <>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] text-emerald-400 font-bold uppercase">{item.stage}</span>
                              <span className="text-[10px] text-white/20 font-mono">{item.date}</span>
                            </div>
                            <div className="text-white font-bold">{item.homeTeam} vs {item.awayTeam}</div>
                            <div className="text-white/40 text-[10px] mt-1">{item.venue}, {item.city}</div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] text-emerald-400 font-bold uppercase">{item.category}</span>
                              <span className="text-[10px] text-white/20 font-mono">{formatCurrency(item.price)}</span>
                            </div>
                            <div className="text-white font-bold">{item.name}</div>
                            <div className="text-white/40 text-[10px] mt-1">{item.city} • Stock: {item.availability}</div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={saveBulkData}
                      disabled={isParsing}
                      className="flex-1 py-5 bg-emerald-400 text-black rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
                    >
                      {isParsing ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                      <span>Confirm & Save All</span>
                    </button>
                    <button 
                      onClick={() => { setIsBulkImporting(false); setParsedData([]); setBulkText(''); }}
                      className="px-8 py-5 bg-white/5 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screenshot Modal */}
      <AnimatePresence>
        {selectedScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedScreenshot(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-full overflow-hidden rounded-3xl border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedScreenshot(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors z-10"
              >
                <X size={20} />
              </button>
              <img src={selectedScreenshot} alt="Wire Receipt" className="w-full h-auto max-h-[80vh] object-contain" />
              <div className="p-6 bg-[#151619] border-t border-white/10 flex justify-between items-center">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Wire Transfer Confirmation Receipt</span>
                <a 
                  href={selectedScreenshot} 
                  download="wire-receipt.png"
                  className="flex items-center gap-2 text-xs text-white hover:text-emerald-400 transition-colors font-bold uppercase tracking-widest"
                >
                  <ExternalLink size={14} />
                  <span>Download Original</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Star({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
