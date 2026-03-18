import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { Package } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Star, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

const SAMPLE_PACKAGES = [
  {
    name: "Diamond Final Experience",
    city: "New York / New Jersey",
    price: 25000,
    description: "The ultimate luxury for the World Cup Final. Private suite, Michelin-star dining, and pitch-side access.",
    availability: 12,
    features: ["Private Suite", "Pitch-side Access", "Michelin Dining", "Luxury Transport"]
  },
  {
    name: "Platinum Semi-Finals",
    city: "Los Angeles",
    price: 15000,
    description: "Premium seating for the semi-finals with exclusive lounge access and meet-and-greet with legends.",
    availability: 24,
    features: ["Premium Seating", "Legends Lounge", "Gourmet Buffet", "Gift Bag"]
  },
  {
    name: "Gold Group Stage",
    city: "Mexico City",
    price: 5000,
    description: "Experience the passion of the opening matches with high-end hospitality and prime views.",
    availability: 50,
    features: ["Hospitality Lounge", "Prime Views", "Open Bar", "Fast-track Entry"]
  },
  {
    name: "Silver Opening Match",
    city: "Toronto",
    price: 7500,
    description: "Be there for the historic kickoff in Canada with full hospitality services.",
    availability: 30,
    features: ["Lounge Access", "Catering", "Commemorative Gift", "Parking"]
  }
];

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const q = query(collection(db, 'packages'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          // Only attempt initialization if user is the known admin
          if (auth.currentUser?.email === 'fortunatehons@gmail.com') {
            const newPackages: Package[] = [];
            for (const p of SAMPLE_PACKAGES) {
              const docRef = await addDoc(collection(db, 'packages'), p);
              newPackages.push({ id: docRef.id, ...p } as Package);
            }
            setPackages(newPackages);
          } else {
            setPackages([]);
          }
        } else {
          setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package)));
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
        // Use the error handler for better diagnostics
        try {
          handleFirestoreError(error, OperationType.LIST, 'packages');
        } catch (e) {
          // Error already logged to console by handleFirestoreError
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 md:pt-32 pb-20 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-light text-white tracking-tighter mb-4">
            VIP <span className="font-black italic text-emerald-400">PACKAGES</span>
          </h2>
          <p className="text-white/40 tracking-widest uppercase text-[10px] sm:text-xs md:text-sm">Select your gateway to football history</p>
        </header>

        <div className="space-y-6">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-400/50 transition-all flex flex-col md:flex-row items-stretch"
            >
              <div className="w-full md:w-72 h-48 md:h-auto overflow-hidden relative shrink-0">
                <img 
                  src={`https://picsum.photos/seed/${pkg.id}/800/600`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={pkg.name}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row flex-grow items-start md:items-center justify-between gap-6">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest mb-3">
                    <MapPin size={12} className="text-emerald-400" />
                    <span>{pkg.city}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{pkg.name}</h3>
                  <p className="text-white/50 text-sm mb-6 max-w-2xl leading-relaxed line-clamp-2 md:line-clamp-none">
                    {pkg.description}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {pkg.features?.slice(0, 4).map(f => (
                      <div key={f} className="flex items-center gap-2 text-white/30 text-[10px] uppercase tracking-wider font-medium">
                        <Star size={10} className="text-emerald-400" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4 shrink-0 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-white/5">
                  <div className="text-left md:text-right w-full md:w-auto">
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Starting from</p>
                    <p className="text-3xl font-black text-emerald-400 italic tracking-tighter leading-none">{formatCurrency(pkg.price)}</p>
                  </div>
                  <Link 
                    to={`/reserve/${pkg.id}`}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest group-hover:bg-emerald-400 transition-all w-full md:w-auto hover:scale-105 active:scale-95"
                  >
                    <span>Reserve Package</span>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
