export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  displayName?: string;
  photoURL?: string;
  lastActive?: any;
  createdAt?: any;
}

export interface Package {
  id: string;
  name: string;
  city: string;
  price: number;
  description: string;
  availability: number;
  features?: string[];
  category?: string;
}

export interface Order {
  id: string;
  packageId: string;
  packageName: string;
  quantity: number;
  totalAmount: number;
  status: 'pending_wire' | 'paid' | 'cancelled';
  userEmail: string;
  userId: string;
  createdAt: any;
  cardLast4: string;
  wireInstructionsSent: boolean;
  wireTransferScreenshot?: string;
  paymentConfirmedByUser?: boolean;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  swift: string;
  active: boolean;
}

export interface Feedback {
  id: string;
  rating: number;
  comment: string;
  userId: string;
  orderId?: string;
  timestamp: any;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue: string;
  city: string;
  stage: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  topic: string;
  content: string;
  category: 'general' | 'stadium' | 'travel' | 'faq';
}

export type Language = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'ar' | 'ja';

export interface Translation {
  [key: string]: {
    [lang in Language]: string;
  };
}
