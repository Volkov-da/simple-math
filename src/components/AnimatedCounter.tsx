import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = value * easeOutCubic;
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  const formatValue = (val: number) => {
    return val.toFixed(decimals);
  };

  return (
    <motion.span
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {prefix}{formatValue(displayValue)}{suffix}
    </motion.span>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  animated?: boolean;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'text-gray-600',
  animated = true,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0
}: StatCardProps) {
  return (
    <motion.div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className={`text-2xl font-bold ${color}`}>
        {animated ? (
          <AnimatedCounter value={value} duration={0.8} prefix={prefix} suffix={suffix} decimals={decimals} />
        ) : (
          `${prefix}${value.toFixed(decimals)}${suffix}`
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
}

