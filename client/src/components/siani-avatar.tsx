import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import sianiPortrait from "@assets/F3FA47B8-35EC-49A8-9B1E-729A9F42D6FE_1753793540318.jpeg";

interface SianiAvatarProps {
  isActive?: boolean;
  isSpeaking?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function SianiAvatar({ 
  isActive = false, 
  isSpeaking = false, 
  size = 'md',
  className 
}: SianiAvatarProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (isSpeaking) {
      setPulseAnimation(true);
      const interval = setInterval(() => {
        setPulseAnimation(prev => !prev);
      }, 800);
      return () => clearInterval(interval);
    } else {
      setPulseAnimation(false);
    }
  }, [isSpeaking]);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const glowSizes = {
    sm: 'shadow-[0_0_20px_rgba(221,84,28,0.5)]',
    md: 'shadow-[0_0_40px_rgba(221,84,28,0.6)]',
    lg: 'shadow-[0_0_60px_rgba(221,84,28,0.7)]',
    xl: 'shadow-[0_0_80px_rgba(221,84,28,0.8)]'
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer glow ring - only when active/speaking */}
      {(isActive || isSpeaking) && (
        <div 
          className={cn(
            "absolute rounded-full transition-all duration-500",
            sizeClasses[size],
            isSpeaking 
              ? "animate-pulse bg-gradient-to-r from-[#DD541C] via-[#C65F58] to-[#EDCFB9] opacity-30 scale-125" 
              : "bg-gradient-to-r from-[#DD541C] to-[#C65F58] opacity-20 scale-110"
          )}
          style={{
            filter: `blur(${size === 'xl' ? '8px' : size === 'lg' ? '6px' : '4px'})`
          }}
        />
      )}
      
      {/* Middle glow ring - pulsing when speaking */}
      {isSpeaking && (
        <div 
          className={cn(
            "absolute rounded-full transition-all duration-300",
            sizeClasses[size],
            pulseAnimation ? "scale-110 opacity-40" : "scale-105 opacity-20",
            "bg-gradient-to-r from-[#DD541C] to-[#C65F58]"
          )}
          style={{
            filter: `blur(${size === 'xl' ? '4px' : '2px'})`
          }}
        />
      )}

      {/* Inner avatar circle with SIANI's portrait */}
      <div 
        className={cn(
          "relative rounded-full border-2 transition-all duration-300 overflow-hidden",
          sizeClasses[size],
          isActive || isSpeaking 
            ? "border-[#DD541C]" 
            : "border-[#C65F58]",
          isSpeaking && glowSizes[size]
        )}
      >
        {/* SIANI Portrait Image */}
        <img
          src={sianiPortrait}
          alt="SIANI"
          className="w-full h-full object-cover transition-all duration-300"
          style={{
            filter: isActive || isSpeaking 
              ? 'saturate(1.2) brightness(1.1) contrast(1.05)' 
              : 'saturate(0.9) brightness(0.9)'
          }}
        />
        
        {/* Overlay gradient for integration with glow effect */}
        <div 
          className={cn(
            "absolute inset-0 transition-all duration-300",
            isActive || isSpeaking 
              ? "bg-gradient-to-br from-[#DD541C]/20 via-transparent to-[#C65F58]/20" 
              : "bg-gradient-to-br from-[#55000A]/10 to-transparent"
          )}
        />
        
        {/* Inner glow effect when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#DD541C]/30 to-[#C65F58]/30 animate-pulse" />
        )}
      </div>

      {/* Speaking indicator dots */}
      {isSpeaking && (
        <div className="absolute -bottom-2 flex space-x-1">
          <div className="w-1 h-1 bg-[#DD541C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 bg-[#C65F58] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-1 bg-[#EDCFB9] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
}