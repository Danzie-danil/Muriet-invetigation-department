import React from 'react';

export function SkeletonText({ lines = 1, width = '100%', style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton skeleton-text" 
          style={{ width: i === lines - 1 && lines > 1 ? '70%' : width }}
        />
      ))}
    </div>
  );
}

export function SkeletonImage({ style = {} }) {
  return (
    <div className="skeleton skeleton-image" style={style} />
  );
}

export function Spinner({ size = 24 }) {
  return (
    <div className="spinner" style={{ width: size, height: size }} />
  );
}
