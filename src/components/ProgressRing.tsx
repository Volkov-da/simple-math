import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
  animated?: boolean;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#22c55e',
  backgroundColor = '#e5e7eb',
  className = '',
  animated = true
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          initial={animated ? { strokeDashoffset: circumference } : undefined}
          animate={animated ? { strokeDashoffset } : undefined}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color }}>
            {Math.round(progress * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimerRingProps {
  timeLeft: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
  warningThreshold?: number; // When to show warning color (0-1)
  className?: string;
}

export function TimerRing({
  timeLeft,
  totalTime,
  size = 80,
  strokeWidth = 6,
  warningThreshold = 0.2,
  className = ''
}: TimerRingProps) {
  const progress = timeLeft / totalTime;
  const isWarning = progress <= warningThreshold;
  
  const color = isWarning ? '#ef4444' : '#22c55e';
  const backgroundColor = isWarning ? '#fecaca' : '#dcfce7';

  return (
    <ProgressRing
      progress={progress}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      backgroundColor={backgroundColor}
      className={className}
      animated={true}
    />
  );
}

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showPercentage?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  max,
  size = 100,
  strokeWidth = 8,
  color = '#3b82f6',
  showPercentage = true,
  className = ''
}: CircularProgressProps) {
  const progress = Math.min(value / max, 1);
  const percentage = Math.round(progress * 100);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * (size - strokeWidth) / 2}`}
          initial={{ strokeDashoffset: 2 * Math.PI * (size - strokeWidth) / 2 }}
          animate={{ 
            strokeDashoffset: 2 * Math.PI * (size - strokeWidth) / 2 * (1 - progress)
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-lg font-semibold" style={{ color }}>
            {percentage}%
          </div>
        </div>
      )}
    </div>
  );
}
