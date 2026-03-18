import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import tanzaniaCoatOfArms from '../assets/tanzania_coat_of_arms.png';
import murietPoliceEmblem from '../assets/muriet_police_emblem.png';
import { useToast } from '../context/ToastContext';
import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import OptimizedImage from '../components/ui/OptimizedImage';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });

  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, lang, toggleLanguage } = useLanguage();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await login(email, password);
      // AuthContext will handle state, we navigate securely
      navigate('/', { replace: true });
    } catch (err) {
      showToast(t('auth.login.invalidLogin'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage({ type: '', text: '' });
    
    try {
      // In a real scenario, this might trigger an RPC check.
      // For now, standard Supabase reset.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      showToast(t('auth.resetMode.successMsg'), 'success');
      setShowForgot(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ position: 'relative' }}>
      {/* Floating Language Toggle */}
      <button 
        onClick={toggleLanguage}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '20px',
          background: 'var(--bg-surface-active)',
          border: '1.5px solid var(--border-color)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          zIndex: 10
        }}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)' }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)' }}
      >
        <Languages size={18} color="var(--primary-color)" />
        {lang === 'en' ? 'SWAHILI' : 'ENGLISH'}
      </button>

      {/* Top Government Header */}
      <header className="auth-header">
        <OptimizedImage 
          src={tanzaniaCoatOfArms} 
          alt="Tanzania Coat of Arms" 
          style={{ height: '6vh', maxWidth: '60px' }}
        />
        <div className="auth-header-text">
          <h2>{t('auth.headers.country')}</h2>
          <h1>{t('auth.headers.portal')}</h1>
        </div>
      </header>

      {/* Main Auth Card */}
      <main className="auth-card-wrapper">
        {/* Left Side: Branding/Emblem */}
        <section className="auth-brand-side">
          <div className="brand-emblem">
            <OptimizedImage 
              src={murietPoliceEmblem} 
              alt="Muriet Police Emblem" 
              style={{ width: '85%', height: '85%' }}
              skeletonStyle={{ borderRadius: '50%' }}
            />
          </div>
          <div className="brand-tagline">
            <h2>{t('auth.headers.mottoSw')}</h2>
            <p>{t('auth.headers.mottoEn')}</p>
          </div>
        </section>

        {/* Right Side: Login Form */}
        <section className="auth-form-side">
          {!showForgot ? (
            <>
              <div className="auth-form-header">
                <h1>{t('auth.login.welcomeTitle')}</h1>
                <p>{t('auth.login.welcomeSubtitle')}</p>
              </div>

              <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1, minHeight: 0, justifyContent: 'center' }}>
                <div className="auth-input-group" style={{ marginBottom: '4px' }}>
                  <label>{t('auth.login.emailBadgeLabel')}</label>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <input 
                      id="email"
                      name="email"
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={t('auth.login.emailPlaceholder')}
                      autoComplete="username"
                      data-lpignore="true"
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>{t('auth.login.passwordLabel')}</label>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <input 
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder={t('auth.login.passwordPlaceholder')}
                      autoComplete="current-password"
                      data-lpignore="true"
                    />
                    <button 
                      type="button"
                      className="auth-input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', flexShrink: 0 }}>
                  {loading ? t('auth.login.authenticating') : t('auth.login.signInBtn')}
                </button>
              </form>

              <div style={{ marginTop: 'auto', paddingTop: 'var(--s-2)', display: 'flex', justifyContent: 'flex-end', fontSize: '13px' }}>
                <span 
                  onClick={() => setShowForgot(true)}
                  style={{ color: 'var(--danger-color)', cursor: 'pointer', fontWeight: '700' }}
                >
                  {t('auth.login.forgotPasswordLink')}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="auth-form-header">
                <h1>{t('auth.resetMode.title')}</h1>
                <p>{t('auth.resetMode.subtitle')}</p>
              </div>

              <form onSubmit={handleForgotPassword} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1, minHeight: 0, justifyContent: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {t('auth.resetMode.instruction')}
                </p>

                <div className="auth-input-group">
                  <label>{t('auth.resetMode.emailLabel')}</label>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                    <input 
                      id="forgotEmail"
                      name="forgotEmail"
                      type="email" 
                      value={forgotEmail} 
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder={t('auth.login.emailPlaceholder')}
                      autoComplete="username"
                      data-lpignore="true"
                    />
                  </div>
                </div>

                <button className="btn btn-primary" type="submit" disabled={resetLoading} style={{ width: '100%' }}>
                  {resetLoading ? t('auth.resetMode.checking') : t('auth.resetMode.requestBtn')}
                </button>

                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => { setShowForgot(false); setResetMessage({ type: '', text: '' }); }}
                  style={{ width: '100%' }}
                >
                  {t('auth.resetMode.backToSignInBtn')}
                </button>
              </form>
            </>
          )}
        </section>
      </main>

      {/* Footer Branding */}
      <footer className="auth-footer">
        <p>{t('auth.footer.supportMsg')} <a href="#">{t('auth.footer.supportTeam')}</a></p>
        <div className="auth-footer-bottom">
          {t('auth.footer.copyright')}
        </div>
      </footer>
    </div>
  );
};

export default Login;
