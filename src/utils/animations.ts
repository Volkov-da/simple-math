import { motion } from 'framer-motion';

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2 }
};

export const bounceIn = {
  initial: { opacity: 0, scale: 0.3 },
  animate: { opacity: 1, scale: 1 },
  transition: { 
    type: "spring",
    stiffness: 500,
    damping: 15
  }
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const numberCountUp = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.5, ease: "easeOut" }
};

export const progressRing = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1 },
  transition: { duration: 1, ease: "easeInOut" }
};

export const confettiVariants = {
  initial: { 
    opacity: 0, 
    scale: 0,
    rotate: 0 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    rotate: 360,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0,
    y: -100,
    transition: {
      duration: 0.3
    }
  }
};

export const streakGlow = {
  animate: {
    boxShadow: [
      "0 0 0px rgba(34, 197, 94, 0)",
      "0 0 20px rgba(34, 197, 94, 0.8)",
      "0 0 0px rgba(34, 197, 94, 0)"
    ],
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatType: "reverse" as const
    }
  }
};

export const shake = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  }
};

export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: "reverse" as const
    }
  }
};

export const float = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const glow = {
  animate: {
    boxShadow: [
      "0 0 5px rgba(34, 197, 94, 0.5)",
      "0 0 20px rgba(34, 197, 94, 0.8)",
      "0 0 5px rgba(34, 197, 94, 0.5)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
