import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Languages } from 'lucide-react';
import Button from './Button';
import { useLanguage, LanguageContext } from '../../context/LanguageContext';
import { translations } from '../../constants/translations';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  primaryAction,
  primaryLabel,
  secondaryAction,
  secondaryLabel,
  isLoading = false,
  isPrimaryLoading = false,
  footerContent,
  onClick,
  size = 'large' // default size
}) {
  const globalContext = useLanguage();
  const { lang: globalLang } = globalContext;
  
  // Local language state to ensure toggle only affects THIS modal
  const [modalLang, setModalLang] = useState(globalLang);

  // Re-sync local language ONLY when modal opens, to match current app setting
  useEffect(() => {
    if (isOpen) {
      setModalLang(globalLang);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, globalLang]);

  if (!isOpen) return null;

  // Local translation function
  const modalT = (key) => {
    const keys = key.split('.');
    let result = translations[modalLang];
    
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        // Fallback to English
        let fallback = translations['en'];
        for (const fk of keys) {
          if (fallback && fallback[fk]) {
            fallback = fallback[fk];
          } else {
            return key;
          }
        }
        return fallback;
      }
    }
    return result;
  };

  const toggleModalLanguage = () => {
    setModalLang(prev => prev === 'en' ? 'sw' : 'en');
  };

  // Provide local override for all children using useLanguage()
  const localContextValue = {
    ...globalContext,
    lang: modalLang,
    t: modalT,
    toggleLanguage: toggleModalLanguage // Overrides persistent global toggle
  };

  const resolveTranslation = (val) => {
    if (typeof val === 'function') return val(modalT, modalLang);
    // If it's a string that looks like a translation key (contains a dot), try to translate it
    if (typeof val === 'string' && val.includes('.')) {
      const translated = modalT(val);
      if (translated !== val) return translated;
    }
    return val;
  };

  const maxWidth = size === 'small' ? '450px' : size === 'medium' ? '650px' : '820px';

  const modalContent = (
    <LanguageContext.Provider value={localContextValue}>
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
            maxWidth: maxWidth,
            maxHeight: '94vh',
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
          {/* Modal Header */}
          <div style={{ 
            padding: 'var(--gutter-s) var(--gutter-m)', 
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'var(--bg-surface)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {resolveTranslation(title)}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleModalLanguage();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '14px',
                  background: 'var(--bg-surface-active)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--primary-color)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <Languages size={14} />
                {modalLang === 'en' ? 'SW' : 'EN'}
              </button>
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
                  padding: '6px',
                  borderRadius: '50%',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div style={{ 
            padding: 'var(--gutter-m)', 
            overflowY: 'auto', 
            flex: 1,
            fontSize: '14px'
          }}>
            {typeof children === 'function' ? children(modalT, modalLang) : children}
          </div>

          {/* Modal Footer */}
          <div style={{ 
            padding: 'var(--gutter-s) var(--gutter-m)', 
            borderTop: '1px solid var(--border-color)',
            display: 'flex', 
            justifyContent: footerContent ? 'space-between' : 'flex-end', 
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg-surface)' 
          }}>
            <div style={{ flex: 1 }}>
              {typeof footerContent === 'function' ? footerContent(modalT, modalLang) : footerContent}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {secondaryAction && (
                <Button variant="secondary" onClick={secondaryAction} disabled={isLoading || isPrimaryLoading}>
                  {resolveTranslation(secondaryLabel) || modalT('common.cancel')}
                </Button>
              )}
              {primaryAction && (
                <Button variant="primary" onClick={primaryAction} isLoading={isPrimaryLoading}>
                  {resolveTranslation(primaryLabel) || modalT('common.save')}
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
    </LanguageContext.Provider>
  );

  return createPortal(modalContent, document.body);
}
