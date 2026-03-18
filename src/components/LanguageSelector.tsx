import { useState, useEffect } from 'react';
import { LANGUAGES } from '../constants';
import { Language } from '../types';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  currentLang: Language;
  onLangChange: (lang: Language) => void;
}

export default function LanguageSelector({ currentLang, onLangChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
      >
        <Globe size={16} className="text-white/60" />
        <span>{selectedLang.name}</span>
        <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-2 right-0 w-48 bg-[#151619] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onLangChange(lang.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/5 transition-colors",
                  currentLang === lang.code ? "text-white bg-white/5" : "text-white/60"
                )}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper for cn in this file since I can't import from utils easily in a multi-file thought if I haven't verified it yet
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
