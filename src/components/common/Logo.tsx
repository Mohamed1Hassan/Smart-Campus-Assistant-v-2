import React from 'react';
import Image from 'next/image';

export const Logo = ({ 
  className = "w-full h-full",
  mode // Optional: 'light' or 'dark' to override system/tailwind theme
}: { 
  className?: string;
  mode?: 'light' | 'dark' | 'auto';
}) => {
  const isForcedLight = mode === 'light';
  const isForcedDark = mode === 'dark';
  const isAuto = !mode || mode === 'auto';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Light Mode Logo */}
      {(isForcedLight || (isAuto && true)) && (
        <Image
          src="/logo-light.png"
          alt="Smart Campus Assistant Logo"
          fill
          className={`object-contain p-1 ${isAuto ? 'dark:hidden' : (isForcedLight ? 'block' : 'hidden')}`}
          priority
          fetchPriority="high"
        />
      )}
      {/* Dark Mode Logo */}
      {(isForcedDark || (isAuto && true)) && (
        <Image
          src="/logo-dark.png"
          alt="Smart Campus Assistant Logo"
          fill
          className={`object-contain p-1 ${isAuto ? 'hidden dark:block' : (isForcedDark ? 'block' : 'hidden')}`}
          priority
          fetchPriority="high"
        />
      )}
    </div>
  );
};
