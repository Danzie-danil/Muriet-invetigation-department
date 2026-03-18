import React, { useState, useEffect } from 'react';
import { SkeletonImage } from './Skeleton';

/**
 * A wrapper for images that shows a skeleton placeholder while loading
 * and applies a smooth fade-in effect once ready.
 */
export default function OptimizedImage({ src, alt, className, style, skeletonStyle }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => {
      setIsLoaded(true);
      setError(true);
    };
  }, [src]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      {!isLoaded && (
        <SkeletonImage 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            borderRadius: 'inherit',
            ...skeletonStyle 
          }} 
        />
      )}
      
      {!error ? (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease-in-out',
            ...style
          }}
        />
      ) : (
        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Image Error</div>
      )}
    </div>
  );
}
