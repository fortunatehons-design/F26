import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import CountdownTimer from '../components/CountdownTimer';
import { ChevronRight, Play } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Background Video/Image Placeholder */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover opacity-40"
          alt="Stadium"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      {/* Hero Content */}
      <main className="relative z-10 pt-32 pb-20 px-6 md:px-16 flex flex-col items-center justify-center min-h-screen text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl w-full"
        >
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-light tracking-tighter text-white mb-6 leading-none">
            FIFA WORLD CUP <br />
            <span className="font-black italic text-emerald-400">2026</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/60 font-light tracking-widest uppercase mb-8 md:mb-12 px-4">
            The Pinnacle of Hospitality. The Future of Football.
          </p>

          <CountdownTimer />

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 md:mt-12 px-4">
            <Link 
              to="/packages"
              className="group flex items-center justify-center gap-2 px-8 md:px-12 py-4 bg-white text-black rounded-full font-bold text-xs md:text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all hover:scale-105"
            >
              <span>Explore Packages</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="flex items-center justify-center gap-2 px-8 md:px-12 py-4 bg-white/10 text-white border border-white/20 rounded-full font-bold text-xs md:text-sm uppercase tracking-widest hover:bg-white/20 transition-all">
              <Play size={18} fill="currentColor" />
              <span>Watch Experience</span>
            </button>
          </div>
        </motion.div>

        {/* Floating Stats */}
        <div className="mt-16 md:absolute md:bottom-12 md:left-0 md:right-0 flex flex-wrap justify-center gap-8 md:gap-24 px-8">
          {[
            { label: 'Host Cities', value: '16' },
            { label: 'VIP Lounges', value: '48' },
            { label: 'Exclusive Events', value: '100+' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 + i * 0.2 }}
              className="text-center min-w-[100px]"
            >
              <div className="text-xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/40">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
