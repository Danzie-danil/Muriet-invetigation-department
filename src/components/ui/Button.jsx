import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  ...props 
}) {
  const isSmall = props.size === 'sm';

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--gutter-xs)',
    minHeight: isSmall ? '32px' : 'var(--touch-target)',
    padding: isSmall ? '0 var(--gutter-xs)' : '0 var(--gutter-s)',
    borderRadius: 'var(--radius-btn)',
    fontFamily: 'var(--font-main)',
    fontWeight: 600,
    fontSize: isSmall ? '12px' : '14px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    opacity: isLoading ? 0.7 : 1,
    whiteSpace: 'nowrap'
  };

  const variants = {
    primary: {
      background: 'var(--primary-color)',
      color: 'white',
      boxShadow: '0 2px 4px rgba(39, 73, 119, 0.2)',
    },
    secondary: {
      background: 'var(--bg-surface-hover)',
      color: 'var(--text-primary)',
    },
    outline: {
      background: 'transparent',
      border: '1px solid var(--border-dark)',
      color: 'var(--text-primary)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
    },
    danger: {
      background: 'var(--danger-color)',
      color: 'white',
    }
  };

  return (
    <button 
      style={{ ...baseStyle, ...variants[variant] }} 
      disabled={isLoading}
      className={`btn-ref ${className}`}
      onMouseOver={(e) => {
        if (!isLoading && variant === 'primary') e.currentTarget.style.background = 'var(--primary-hover)';
        if (!isLoading && variant === 'secondary') e.currentTarget.style.background = 'var(--border-color)';
        if (!isLoading && variant === 'ghost') e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
        if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseOut={(e) => {
        if (!isLoading) {
          e.currentTarget.style.background = variants[variant] ? variants[variant].background : 'transparent';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
      {...props}
    >
      {isLoading && (
        <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'transparent', borderTopColor: 'currentColor' }} />
      )}
      {children}
    </button>
  );
}
