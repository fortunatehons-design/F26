import { Language, Translation } from './types';

export const FIFA_2026_START_DATE = new Date('2026-06-11T00:00:00Z');

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

export const TRANSLATIONS: Translation = {
  welcome: {
    en: 'Experience FIFA 2026 in Ultimate Luxury',
    es: 'Vive el Mundial 2026 con el Máximo Lujo',
    fr: 'Vivez la Coupe du Monde 2026 dans un Luxe Ultime',
    de: 'Erleben Sie die FIFA 2026 in ultimativem Luxus',
    pt: 'Experimente a Copa do Mundo 2026 em Luxo Supremo',
    it: 'Vivi la FIFA 2026 nel Massimo Lusso',
    ar: 'استمتع بكأس العالم 2026 في رفاهية مطلقة',
    ja: '究極のラグジュアリーでFIFA 2026を体験',
  },
  countdown_title: {
    en: 'Countdown to Kickoff',
    es: 'Cuenta Regresiva para el Inicio',
    fr: 'Compte à Rebours avant le Coup d\'Envoi',
    de: 'Countdown bis zum Anstoß',
    pt: 'Contagem Regressiva para o Início',
    it: 'Conto alla Rovescia per il Calcio d\'Inizio',
    ar: 'العد التنازلي للبداية',
    ja: 'キックオフまでのカウントダウン',
  },
  reserve_now: {
    en: 'Reserve VIP Tickets',
    es: 'Reservar Entradas VIP',
    fr: 'Réserver des Billets VIP',
    de: 'VIP-Tickets reservieren',
    pt: 'Reservar Ingressos VIP',
    it: 'Prenota Biglietti VIP',
    ar: 'احجز تذاكر VIP',
    ja: 'VIPチケットを予約する',
  },
  // Add more as needed...
};
