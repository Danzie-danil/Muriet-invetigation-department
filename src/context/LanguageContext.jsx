import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../constants/translations';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabase';

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { profile, user } = useAuth();
  const { showToast } = useToast();
  // Always default to English initially
  const [lang, setLang] = useState('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync with Profile on Login or Refresh
  useEffect(() => {
    if (profile?.preferred_language && !isInitialized) {
      setLang(profile.preferred_language);
      setIsInitialized(true);
    }
  }, [profile, isInitialized]);

  // Reset to English on Logout
  useEffect(() => {
    if (!user) {
      setLang('en');
      setIsInitialized(false);
      localStorage.removeItem('mpid_lang');
    }
  }, [user]);

  // Handle document attributes
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => {
    const keys = key.split('.');
    let result = translations[lang];
    
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        // Fallback to English if key doesn't exist in current lang
        let fallback = translations['en'];
        for (const fk of keys) {
          if (fallback && fallback[fk]) {
            fallback = fallback[fk];
          } else {
            return key; // Return the key itself as last resort
          }
        }
        return fallback;
      }
    }
    return result;
  };

  const toggleLanguage = async () => {
    const newLang = lang === 'en' ? 'sw' : 'en';
    setLang(newLang);

    // Persist to database if logged in
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ preferred_language: newLang })
          .eq('id', user.id);
        
        if (error) throw error;
      } catch (err) {
        console.error('Failed to persist language preference:', err);
      }
    }

    const toastMsg = newLang === 'en' ? 'English activated successfully' : 'Kiswahili kimewezeshwa';
    showToast(toastMsg, 'success');
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
