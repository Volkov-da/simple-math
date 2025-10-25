import { motion } from 'framer-motion';



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


