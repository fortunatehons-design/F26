import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth, db } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import Navbar from './components/Navbar';
import AIConcierge from './components/AIConcierge';
import Home from './pages/Home';
import Packages from './pages/Packages';
import Reservation from './pages/Reservation';
import Confirmation from './pages/Confirmation';
import AdminDashboard from './pages/AdminDashboard';
import { Language } from './types';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    if (user) {
      const syncUser = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: user.email === 'fortunatehons@gmail.com' ? 'admin' : 'user',
              createdAt: serverTimestamp(),
              lastActive: serverTimestamp()
            });
          } else {
            await updateDoc(userRef, {
              lastActive: serverTimestamp(),
              displayName: user.displayName,
              photoURL: user.photoURL
            });
          }
        } catch (error) {
          console.error("Error syncing user profile:", error);
        }
      };
      syncUser();
    }
  }, [user]);

  useEffect(() => {
    // Auto-detect language
    const browserLang = navigator.language.split('-')[0] as Language;
    const supportedLangs: Language[] = ['en', 'es', 'fr', 'de', 'pt', 'it', 'ar', 'ja'];
    if (supportedLangs.includes(browserLang)) {
      setLanguage(browserLang);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className={language === 'ar' ? 'rtl' : 'ltr'}>
        <Navbar currentLang={language} onLangChange={setLanguage} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/reserve/:packageId" element={<Reservation />} />
          <Route path="/confirmation/:orderId" element={<Confirmation />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>

        <AIConcierge />
      </div>
    </Router>
  );
}
