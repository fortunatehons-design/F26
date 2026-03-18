import { useState, useEffect } from 'react';
import { FIFA_2026_START_DATE } from '../constants';
import { motion } from 'motion/react';

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +FIFA_2026_START_DATE - +new Date();
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timerItems = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-3 sm:gap-4 md:gap-8 justify-center items-center py-6 md:py-8">
      {timerItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex flex-col items-center min-w-[60px] sm:min-w-[80px]"
        >
          <div className="text-3xl sm:text-4xl md:text-6xl font-light tracking-tighter text-white">
            {String(item.value).padStart(2, '0')}
          </div>
          <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1 md:mt-2 font-medium">
            {item.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
