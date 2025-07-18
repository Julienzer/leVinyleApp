import React, { useState } from 'react';

export default function Avatar({ src, alt, size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (imageError || !src) {
    return (
      <div className={`${sizes[size]} ${className} rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm`}>
        {getInitials(alt)}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className={`${sizes[size]} ${className} rounded-full object-cover`}
      onError={() => setImageError(true)}
    />
  );
} 