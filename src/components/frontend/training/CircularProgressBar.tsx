import React from 'react';

interface CircularProgressBarProps {
  progress: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  completed?: boolean;
  showText?: boolean;
  className?: string;
}

export const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  progress,
  size = 36,
  strokeWidth = 3.5,
  completed = false,
  showText = true,
  className = '',
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const isDone = completed || normalizedProgress >= 100;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  // Determine color theme based on completion status
  const strokeColor = isDone
    ? '#10b981' // emerald-500
    : normalizedProgress > 0
    ? '#3b82f6' // blue-500
    : '#cbd5e1'; // slate-300

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Center percentage label or checkmark */}
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isDone ? (
            <span
              className="font-bold text-emerald-600 leading-none"
              style={{ fontSize: Math.max(9, Math.round(size * 0.32)) }}
            >
              ✓
            </span>
          ) : (
            <span
              className="font-mono font-bold text-slate-700 leading-none"
              style={{ fontSize: Math.max(8, Math.round(size * 0.28)) }}
            >
              {normalizedProgress}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};
