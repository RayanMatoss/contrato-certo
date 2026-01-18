import React from "react";

interface LicityLogoProps {
  className?: string;
  size?: number;
}

export function LicityLogo({ className, size = 36 }: LicityLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Blue to purple gradient for bars - lighter at top, richer at bottom */}
        <linearGradient id="barGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="barGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="barGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        {/* Orange to red gradient for arrow - bright orange to deep red */}
        <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="50%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      
      {/* Bar Chart - 3 bars increasing in height with vertical gradients */}
      <rect x="4" y="20" width="4" height="8" rx="1" fill="url(#barGradient1)" />
      <rect x="10" y="16" width="4" height="12" rx="1" fill="url(#barGradient2)" />
      <rect x="16" y="12" width="4" height="16" rx="1" fill="url(#barGradient3)" />
      
      {/* Curved Arrow - Thicker, smoother curve from bottom-left to top-right */}
      <path
        d="M 6 26 Q 10 20, 16 16 Q 22 12, 28 10"
        stroke="url(#arrowGradient)"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow head - more prominent */}
      <path
        d="M 24 8 L 28 10 L 26 13"
        stroke="url(#arrowGradient)"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
