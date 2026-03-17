import React from 'react';

export default function Card({ 
  children, 
  className = '', 
  padding = 'var(--gutter-m)',
  hoverable = false 
}) {
  return (
    <div 
      className={`card ${hoverable ? '' : 'card-static'} ${className}`}
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-card)',
        padding: padding,
        boxShadow: 'var(--shadow-base)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {children}
      <style>{`
        .card {
          transition: all .3s ease;
        }
        .card:hover:not(.card-static) {
          transform: translateY(-6px);
          box-shadow: var(--shadow-hover);
        }
      `}</style>
    </div>
  );
}
