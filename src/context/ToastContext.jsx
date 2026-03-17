import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && createPortal(
        <div 
          className={`toast-container toast-${toast.type}`}
          style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            zIndex: 200000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '90vw',
            animation: 'toastZoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            border: '1px solid var(--border-color)',
            borderLeft: `4px solid ${toast.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}`
          }}
        >
          <div style={{ color: toast.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex' }}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          </div>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            flex: 1,
            whiteSpace: 'pre-wrap'
          }}>
            {toast.message}
          </span>
          <button 
            onClick={hideToast}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-muted)',
              display: 'flex',
              padding: '4px',
              borderRadius: '4px'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            <X size={16} />
          </button>
        </div>,
        document.body
      )}
      <style>{`
        @keyframes toastZoomIn {
          0% { transform: translate(-50%, 40px) scale(0.8); opacity: 0; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
