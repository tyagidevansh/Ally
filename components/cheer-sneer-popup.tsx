"use client";
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface CheerSneerData {
  id: string;
  type: 'CHEER' | 'SNEER';
  message: string;
  from: {
    name: string;
    imageUrl: string;
  };
}

interface CheerSneerPopupProps {
  cheers: CheerSneerData[];
  onDismiss: () => void;
}

// Particle component for the animated background effects
const Particle = ({ type, index }: { type: 'CHEER' | 'SNEER'; index: number }) => {
  const isCheer = type === 'CHEER';
  const emojis = isCheer
    ? ['🎉', '🔥', '⚡', '💪', '🏆', '✨', '🌟', '👏', '🙌', '💯']
    : ['👀', '😤', '💀', '🫠', '😈', '👎', '🤡', '💩', '😏', '🫵'];

  const emoji = emojis[index % emojis.length];
  const randomX = Math.random() * 300 - 150;
  const randomDelay = Math.random() * 0.5;
  const randomDuration = 2 + Math.random() * 1.5;

  return (
    <motion.div
      className="absolute text-2xl pointer-events-none select-none"
      style={{ left: '50%', top: '50%' }}
      initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: randomX,
        y: -(100 + Math.random() * 200),
        scale: [0, 1.2, 1, 0.5],
        rotate: Math.random() * 360,
      }}
      transition={{
        duration: randomDuration,
        delay: randomDelay,
        ease: 'easeOut',
      }}
    >
      {emoji}
    </motion.div>
  );
};

const CheerSneerPopup = ({ cheers, onDismiss }: CheerSneerPopupProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [particles, setParticles] = useState<number[]>([]);

  const current = cheers[currentIndex];
  const isCheer = current?.type === 'CHEER';
  const hasMore = currentIndex < cheers.length - 1;

  // Spawn particles on mount and when switching
  useEffect(() => {
    setParticles(Array.from({ length: 16 }, (_, i) => i));
    const timer = setTimeout(() => {
      setParticles(prev => [...prev, ...Array.from({ length: 8 }, (_, i) => prev.length + i)]);
    }, 800);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  if (!current) return null;

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex(prev => prev + 1);
      setParticles([]);
    } else {
      onDismiss();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop with animated gradient */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: isCheer
              ? 'radial-gradient(ellipse at center, rgba(34,197,94,0.25) 0%, rgba(0,0,0,0.85) 70%)'
              : 'radial-gradient(ellipse at center, rgba(239,68,68,0.25) 0%, rgba(0,0,0,0.85) 70%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          onClick={onDismiss}
        />

        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map(i => (
            <Particle key={`${currentIndex}-${i}`} type={current.type} index={i} />
          ))}
        </div>

        {/* Main card */}
        <motion.div
          className="relative w-full max-w-sm"
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {/* Glow effect behind the card */}
          <div
            className="absolute -inset-1 rounded-2xl blur-xl opacity-40"
            style={{
              background: isCheer
                ? 'linear-gradient(135deg, #22c55e, #10b981, #059669)'
                : 'linear-gradient(135deg, #ef4444, #f97316, #dc2626)',
            }}
          />

          <div
            className="relative rounded-2xl border overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(17,24,39,0.97) 0%, rgba(9,9,11,0.99) 100%)',
              borderColor: isCheer ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
            }}
          >
            {/* Top decorative bar */}
            <div
              className="h-1 w-full"
              style={{
                background: isCheer
                  ? 'linear-gradient(90deg, #22c55e, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #ef4444, #f97316, #fb923c)',
              }}
            />

            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-800/50 hover:bg-gray-700/70 transition-colors z-10"
            >
              <X size={14} className="text-gray-400" />
            </button>

            <div className="px-6 pt-6 pb-5">
              {/* Icon + Type header */}
              <div className="flex flex-col items-center mb-5">
                <motion.div
                  className="text-5xl mb-3"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
                >
                  {isCheer ? '🎉' : '😈'}
                </motion.div>

                <motion.h2
                  className="text-lg font-bold tracking-wide uppercase"
                  style={{ color: isCheer ? '#4ade80' : '#fb923c' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {isCheer ? 'You got cheered!' : 'You got sneered!'}
                </motion.h2>

                <motion.p
                  className="text-xs text-gray-500 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  from {current.from.name}
                </motion.p>
              </div>

              {/* Message bubble */}
              <motion.div
                className="relative rounded-xl px-5 py-4 mb-5"
                style={{
                  background: isCheer
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.08))'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(249,115,22,0.08))',
                  border: `1px solid ${isCheer ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
                }}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.45, type: 'spring', damping: 20 }}
              >
                {/* Quote marks */}
                <span
                  className="absolute -top-2 left-3 text-3xl font-serif leading-none select-none"
                  style={{ color: isCheer ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }}
                >
                  &ldquo;
                </span>
                <p className="text-gray-200 text-center text-sm leading-relaxed italic pl-2">
                  {current.message}
                </p>
                <span
                  className="absolute -bottom-4 right-3 text-3xl font-serif leading-none select-none"
                  style={{ color: isCheer ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)' }}
                >
                  &rdquo;
                </span>
              </motion.div>

              {/* Action button */}
              <motion.button
                onClick={handleNext}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200"
                style={{
                  background: isCheer
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                }}
                whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                {hasMore ? `Next (${cheers.length - currentIndex - 1} more)` : (isCheer ? 'Thanks! 🙌' : 'Whatever 😤')}
              </motion.button>

              {/* Counter */}
              {cheers.length > 1 && (
                <motion.div
                  className="flex justify-center gap-1.5 mt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {cheers.map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        background: i === currentIndex
                          ? (isCheer ? '#22c55e' : '#ef4444')
                          : 'rgba(107,114,128,0.4)',
                        transform: i === currentIndex ? 'scale(1.3)' : 'scale(1)',
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CheerSneerPopup;
