import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from './Button';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  primaryAction,
  primaryLabel = "Save",
  secondaryAction,
  secondaryLabel = "Cancel",
  isLoading = false,
  isPrimaryLoading = false,
  footerContent,
  onClick
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100000,
        padding: 'var(--gutter-s)',
        animation: 'fadeIn 0.25s ease'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalEntrance 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) onClick();
        }}
      >
        <div style={{ 
          padding: 'var(--gutter-s) var(--gutter-m)', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'var(--bg-surface)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ 
          padding: 'var(--gutter-m)', 
          overflowY: 'auto', 
          flex: 1,
          fontSize: '14px'
        }}>
          {children}
        </div>

        <div style={{ 
          padding: 'var(--gutter-s) var(--gutter-m)', 
          borderTop: '1px solid var(--border-color)',
          display: 'flex', 
          justifyContent: footerContent ? 'space-between' : 'flex-end', 
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-surface)' 
        }}>
          <div>
            {footerContent}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {secondaryAction && (
              <Button variant="secondary" onClick={secondaryAction} disabled={isLoading || isPrimaryLoading}>
                {secondaryLabel}
              </Button>
            )}
            {primaryAction && (
              <Button variant="primary" onClick={primaryAction} isLoading={isPrimaryLoading}>
                {primaryLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalEntrance { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}
