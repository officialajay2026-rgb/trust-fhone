import React from 'react';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

const FraudScoreMeter = ({ score = 0, size = 'md' }) => {
  const getColor = (score) => {
    if (score < 30) return { stroke: '#22c55e', text: 'Highly Trusted', icon: ShieldCheck };
    if (score < 60) return { stroke: '#eab308', text: 'Moderate Risk', icon: Shield };
    return { stroke: '#ef4444', text: 'High Risk', icon: ShieldAlert };
  };

  const { stroke, text, icon: Icon } = getColor(score);
  const radius = size === 'lg' ? 70 : size === 'sm' ? 40 : 55;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const svgSize = size === 'lg' ? 180 : size === 'sm' ? 100 : 140;
  const center = svgSize / 2;

  return (
    <div className="flex flex-col items-center" data-testid="fraud-score-meter">
      <svg width={svgSize} height={svgSize} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={size === 'lg' ? 12 : size === 'sm' ? 6 : 10}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={stroke}
          strokeWidth={size === 'lg' ? 12 : size === 'sm' ? 6 : 10}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease',
            filter: `drop-shadow(0 0 8px ${stroke}66)`
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: size === 'lg' ? '90px' : size === 'sm' ? '50px' : '70px' }}>
        <Icon
          className={`${size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'} mb-1`}
          style={{ color: stroke }}
        />
        <span className={`${size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl'} font-bold text-white`}>
          {100 - score}
        </span>
        <span className={`${size === 'lg' ? 'text-sm' : 'text-xs'} text-slate-400 uppercase tracking-wider`}>
          Trust Score
        </span>
      </div>
      <p className={`mt-2 ${size === 'lg' ? 'text-base' : 'text-sm'} font-medium`} style={{ color: stroke }}>
        {text}
      </p>
    </div>
  );
};

export default FraudScoreMeter;