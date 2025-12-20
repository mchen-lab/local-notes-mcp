import React from 'react';

export default function Logo({ className }) {
  // Just the L, grey color
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
        {/* Large Grey L */}
        <span className="text-4xl font-black leading-none text-muted-foreground/50 select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
            L
        </span>
    </div>
  );
}
