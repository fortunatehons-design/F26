import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import LanguageSelector from './LanguageSelector';
import { Language } from '../types';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogIn, User, ShieldCheck, Menu, X, LogOut, ShoppingBag, Package } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';

interface Props {
  currentLang: Language;
  onLangChange: (lang: Language) => void;
}

export default function Navbar({ currentLang, onLangChange }: Props) {
  const [user] = useAuthState(auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
    setIsMenuOpen(false);
  };

  const navLinks = [
    { to: '/packages', label: 'Packages', icon: Package },
    ...(user ? [{ to: '/orders', label: 'My Orders', icon: ShoppingBag }] : []),
    ...(user?.email === 'fortunatehons@gmail.com' ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck, color: 'text-emerald-400' }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-8 md:px-16 z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm border-b border-white/5">
      <Link to="/" className="flex items-center gap-3 z-50" onClick={() => setIsMenuOpen(false)}>
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <span className="text-black font-black text-xl italic">F</span>
        </div>
        <div>
          <h1 className="text-white font-bold tracking-tighter leading-none">FIFA 2026</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">VIP Hospitality</p>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        <div className="flex items-center gap-8 mr-8">
          {navLinks.map(link => (
            <Link 
              key={link.to} 
              to={link.to} 
              className={cn(
                "text-sm hover:text-white transition-colors uppercase tracking-widest font-medium flex items-center gap-2",
                link.color || "text-white/60"
              )}
            >
              {link.icon && <link.icon size={14} />}
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 pl-8 border-l border-white/10">
          <LanguageSelector currentLang={currentLang} onLangChange={onLangChange} />
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <User size={14} className="text-white/60" />
                <span className="text-xs text-white/80 font-medium truncate max-w-[100px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-xs uppercase tracking-widest font-bold"
                title="Logout"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link 
              to="/packages"
              className="flex items-center gap-2 px-6 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-emerald-400 transition-colors"
            >
              <LogIn size={16} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden z-50 text-white p-2"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-black z-40 flex flex-col pt-32 px-8"
          >
            <div className="flex flex-col gap-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link 
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "text-3xl font-light tracking-tighter flex items-center gap-4",
                      link.color || "text-white"
                    )}
                  >
                    {link.icon && <link.icon size={24} />}
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-auto mb-12 space-y-8">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-white/40 uppercase tracking-widest text-xs">Language</span>
                <LanguageSelector currentLang={currentLang} onLangChange={onLangChange} />
              </div>

              {user ? (
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                      <User size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-bold truncate max-w-[150px]">{user.email}</p>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">Authenticated</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-6 py-4 bg-white/10 text-white rounded-2xl hover:bg-red-500/20 hover:text-red-500 transition-all font-bold uppercase tracking-widest text-sm"
                  >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link 
                  to="/packages"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-white text-black rounded-full font-bold uppercase tracking-widest"
                >
                  <LogIn size={20} />
                  <span>Login / Sign Up</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
