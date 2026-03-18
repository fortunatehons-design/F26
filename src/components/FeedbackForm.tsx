import { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Star, Send } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  orderId?: string;
  onSuccess?: () => void;
}

export default function FeedbackForm({ orderId, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        rating,
        comment,
        orderId: orderId || null,
        userId: auth.currentUser?.uid || 'anonymous',
        timestamp: serverTimestamp()
      });
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm">Thank you for your feedback!</p>
      </motion.div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mt-12">
      <h3 className="text-white font-bold mb-2">How was your experience?</h3>
      <p className="text-white/40 text-xs mb-6 uppercase tracking-widest">Your feedback helps us improve the VIP experience</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-125"
            >
              <Star 
                size={32} 
                className={cn(
                  "transition-colors",
                  star <= rating ? "text-emerald-400 fill-emerald-400" : "text-white/10"
                )} 
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more about your interaction with the AI Concierge or the reservation process..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-emerald-400/50 transition-colors h-32 resize-none"
        />

        <button
          disabled={rating === 0 || submitting}
          type="submit"
          className="w-full py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Submit Feedback</span>
              <Send size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
