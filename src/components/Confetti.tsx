import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

const colors = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
];

export function Confetti({ isActive, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = [];
      
      // Create 50 confetti pieces
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: `confetti-${i}`,
          x: Math.random() * 100,
          y: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360,
          delay: Math.random() * 0.5,
        });
      }
      
      setPieces(newPieces);
      
      // Auto-cleanup after animation
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              borderRadius: '2px',
            }}
            initial={{
              opacity: 0,
              scale: 0,
              rotate: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0],
              rotate: [0, 360, 720],
              y: [0, -200, -400],
              x: [0, (Math.random() - 0.5) * 200],
            }}
            transition={{
              duration: 3,
              delay: piece.delay,
              ease: "easeOut",
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ConfettiBurst({ trigger }: { trigger: number }) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger > 0) {
      setIsActive(true);
    }
  }, [trigger]);

  return (
    <Confetti 
      isActive={isActive} 
      onComplete={() => setIsActive(false)} 
    />
  );
}
