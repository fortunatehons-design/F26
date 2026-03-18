import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Send, Volume2, VolumeX, X, MessageSquare, MicOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Package, BankAccount, Match, KnowledgeBaseEntry } from '../types';
import { useNavigate } from 'react-router-dom';

export default function AIConcierge() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Welcome to FIFA 2026 VIP Hospitality. How can I assist you with your luxury experience today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([]);
  const [bankInfo, setBankInfo] = useState<BankAccount | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        const toggleButton = document.getElementById('ai-concierge-toggle');
        if (toggleButton && toggleButton.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchData = async () => {
      const [pSnap, mSnap, kSnap, bSnap] = await Promise.all([
        getDocs(collection(db, 'packages')),
        getDocs(collection(db, 'matches')),
        getDocs(collection(db, 'knowledgeBase')),
        getDocs(collection(db, 'bankAccounts'))
      ]);

      setPackages(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package)));
      setMatches(mSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
      setKnowledgeBase(kSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeBaseEntry)));
      
      const activeBank = bSnap.docs.find(doc => doc.data().active);
      if (activeBank) setBankInfo({ id: activeBank.id, ...activeBank.data() } as BankAccount);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg = { role: 'user' as const, text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const reserveTicketFunction = {
        name: "reserveTicket",
        parameters: {
          type: Type.OBJECT,
          description: "Redirect the user to the reservation page for a specific package.",
          properties: {
            packageId: {
              type: Type.STRING,
              description: "The ID of the package to reserve.",
            },
            packageName: {
              type: Type.STRING,
              description: "The name of the package for confirmation.",
            }
          },
          required: ["packageId", "packageName"],
        },
      };

      const systemInstruction = `You are the FIFA 2026 VIP Hospitality Concierge.
Your goal is to provide a premium, helpful, and efficient experience for VIP guests.

VERIFIED DATA:
- PACKAGES: ${JSON.stringify(packages)}
- MATCHES: ${JSON.stringify(matches)}
- KNOWLEDGE BASE: ${JSON.stringify(knowledgeBase)}
- BANK INFO: ${JSON.stringify(bankInfo)}
- COUNTDOWN: The FIFA World Cup 2026 starts on June 11, 2026.

STRICT RULES:
1. Only use the VERIFIED DATA provided above.
2. If information is missing, say: "I don't have enough information to answer that."
3. Do not invent roles, policies, or internal records.
4. Be concise and professional.
5. If a user wants to book, use the 'reserveTicket' tool.
6. For payments, explain that we only accept wire transfers and provide the BANK INFO when asked.
7. Mention the countdown to the World Cup if relevant.`;

      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: text,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [reserveTicketFunction] }],
        }
      });

      const response = await model;
      
      // Check for function calls
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === 'reserveTicket') {
          const { packageId, packageName } = call.args as any;
          setMessages(prev => [...prev, { role: 'ai', text: `Excellent choice. I am redirecting you to the reservation page for the ${packageName}. Please prepare your card for authorization.` }]);
          if (isSpeaking || isVoiceMode) speak(`Excellent choice. I am redirecting you to the reservation page for the ${packageName}.`);
          setTimeout(() => {
            setIsOpen(false);
            navigate(`/reserve/${packageId}`);
          }, 2000);
          return;
        }
      }

      const aiText = response.text || "I apologize, I am having trouble processing that request.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      
      if (isSpeaking || isVoiceMode) {
        speak(aiText);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "I encountered an error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => {
      setIsListening(false);
      // If in voice mode and not typing, maybe restart listening after a delay?
      // But usually we wait for AI to finish speaking.
    };
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };

    recognitionRef.current.start();
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    
    utterance.onend = () => {
      if (isVoiceMode && isOpen) {
        setTimeout(startListening, 500);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceMode = () => {
    const newMode = !isVoiceMode;
    setIsVoiceMode(newMode);
    if (newMode) {
      setIsSpeaking(true);
      if (messages.length > 0) {
        speak(messages[messages.length - 1].text);
      }
    } else {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  };

  return (
    <>
      <button
        id="ai-concierge-toggle"
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState && isVoiceMode) setTimeout(startListening, 1000);
        }}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
      >
        <MessageSquare size={24} className={cn("md:w-7 md:h-7 transition-all", isVoiceMode && "text-emerald-500")} />
        {isVoiceMode && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-0 right-0 md:bottom-28 md:right-8 w-full md:w-[400px] h-full md:h-[600px] bg-[#151619] border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-6 border-bottom border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-white font-medium">AI Concierge</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                  {isListening ? "Listening..." : "FIFA 2026 VIP"}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={toggleVoiceMode}
                  className={cn(
                    "p-2 rounded-full transition-all flex items-center gap-2",
                    isVoiceMode ? "bg-emerald-400 text-black" : "text-white/40 bg-white/5 hover:bg-white/10"
                  )}
                  title="Toggle Voice Mode"
                >
                  {isVoiceMode ? <Mic size={18} /> : <MicOff size={18} />}
                  {isVoiceMode && <span className="text-[10px] font-bold uppercase pr-1">Voice ON</span>}
                </button>
                <button 
                  onClick={() => setIsSpeaking(!isSpeaking)}
                  className={cn("p-2 rounded-full transition-colors", isSpeaking ? "text-white bg-white/10" : "text-white/40")}
                >
                  {isSpeaking ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                    m.role === 'user' ? "bg-white text-black shadow-lg shadow-white/5" : "bg-white/5 text-white border border-white/10"
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 text-white/40 p-4 rounded-2xl text-sm italic animate-pulse">
                    Concierge is thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 bg-white/5 border-t border-white/5">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
                  placeholder={isListening ? "Listening..." : "Ask about VIP packages..."}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full py-3 px-6 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                />
                <button
                  onClick={startListening}
                  className={cn(
                    "p-3 rounded-full transition-all",
                    isListening ? "bg-red-500 text-white animate-pulse" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  <Mic size={18} />
                </button>
                <button
                  onClick={() => handleSend(input)}
                  className="p-3 bg-white text-black rounded-full hover:scale-105 transition-transform"
                >
                  <Send size={18} />
                </button>
              </div>
              {isVoiceMode && (
                <p className="text-[9px] text-center text-white/20 uppercase tracking-widest mt-4">
                  Voice Mode Active • Hands-free Reservation Enabled
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
