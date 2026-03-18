import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import tanzaniaCoatOfArms from '../assets/tanzania_coat_of_arms.png';
import murietPoliceEmblem from '../assets/muriet_police_emblem.png';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { formatPhoneNumbersInText, capitalizeSentences } from '../lib/utils';
import OptimizedImage from '../components/ui/OptimizedImage';
import { ShieldAlert } from 'lucide-react';


const RegisterOfficer = () => {
  const { role } = useAuth();
  const isAdmin = role === 'ocs' || role === 'oc_cid';
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [targetRole, setTargetRole] = useState('io'); // default to io
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { t, lang } = useLanguage();
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Permission denied. Only OCS or OC-CID can register officers.', 'error');
      return;
    }
    setLoading(true);

    setSuccess(false);
    
    try {
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. We use the returned user ID to insert into profiles
      if (authData?.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            full_name: fullName,
            role: targetRole,
            badge_number: badgeNumber
          }

        ]);

        // Note: RLS policies might block this if the OCS isn't allowed to insert, 
        // but we'll assume the OCS has permissions or we use a service role in a backend.
        // For frontend testing, Supabase usually allows inserts if RLS is configured.
        if (profileError) throw profileError;
      }

      showToast(t('registerOfficer.success.toastSuccess').replace('{name}', fullName), 'success');
      setSuccess(true);
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      setBadgeNumber('');
      setTargetRole('io');


    } catch (err) {
      showToast(err.message || t('registerOfficer.success.toastFail'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <ShieldAlert size={64} color="var(--danger-color)" />
        <h1 style={{ fontSize: '24px' }}>Access Denied</h1>
        <p>You do not have administrative privileges to register new officers.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--gutter-m) 16px' }}>

      {/* Main Form Container */}
      <main className="auth-card-wrapper" style={{ margin: 'auto', width: '100%', maxWidth: '1000px', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-base)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', display: 'flex', overflow: 'hidden', height: 'auto', minHeight: '500px' }}>
        {/* Left Side: Guidelines & Instructions */}
        <section className="auth-brand-side" style={{ 
          padding: '40px', 
          flex: '1', 
          display: 'flex', 
          flexDirection: 'column', 
          background: 'linear-gradient(135deg, #f8faff 0%, #ffffff 100%)',
          borderRight: '1px solid var(--border-color)'
        }}>
            <div style={{ marginTop: 'auto', marginBottom: 'auto', textAlign: 'center' }}>
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                <OptimizedImage 
                  src={murietPoliceEmblem} 
                  alt="Muriet Police Emblem" 
                  style={{ width: '120px', height: '120px' }}
                  skeletonStyle={{ borderRadius: '50%' }}
                />
              </div>
              <h2 style={{ 
                color: '#051D43', 
                fontSize: '22px', 
                fontWeight: '800', 
                marginBottom: '28px',
                fontFamily: 'Inter, sans-serif'
              }}>
                {t('registerOfficer.guidelines.title')}
              </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <article>
                <h3 style={{ 
                  color: '#000000', 
                  fontSize: '15px', 
                  fontWeight: '700', 
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {t('registerOfficer.guidelines.creationTitle')}
                </h3>
                <p style={{ 
                  fontSize: '13.5px', 
                  lineHeight: '1.7', 
                  color: 'var(--text-primary)', 
                  textAlign: 'justify', 
                  fontWeight: '500',
                  fontFamily: 'Inter, sans-serif',
                  margin: 0
                }}>
                  {t('registerOfficer.guidelines.creationDesc')}
                </p>
              </article>

              <article>
                <h3 style={{ 
                  color: '#000000', 
                  fontSize: '15px', 
                  fontWeight: '700', 
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {t('registerOfficer.guidelines.accessTitle')}
                </h3>
                <p style={{ 
                  fontSize: '13.5px', 
                  lineHeight: '1.7', 
                  color: 'var(--text-primary)', 
                  textAlign: 'justify', 
                  fontWeight: '500',
                  fontFamily: 'Inter, sans-serif',
                  margin: 0
                }}>
                  {t('registerOfficer.guidelines.accessDesc')}
                </p>
              </article>
            </div>
          </div>

          <div style={{ paddingTop: '24px', borderTop: '1px dashed var(--border-color)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {lang === 'en' ? 'System Integrity Notice' : 'Taarifa ya Uadilifu wa Mfumo'}
            </p>
          </div>
        </section>

        {/* Right Side: Signup Form */}
        <section className="auth-form-side" style={{ 
          padding: '24px 32px',
          display: 'flex',
          flexDirection: 'column',
          flex: '1'
        }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: 'var(--s-8) var(--s-4)', marginTop: '40px' }}>
              <div style={{ marginBottom: 'var(--s-6)', color: 'var(--success-color)' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h1 style={{ fontSize: '24px', marginBottom: 'var(--s-2)' }}>{t('registerOfficer.success.title')}</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--s-8)', lineHeight: '1.6' }}>
                {t('registerOfficer.success.descPart1')} <strong>{fullName}</strong> {t('registerOfficer.success.descPart2')}
              </p>
              <button className="btn btn-primary" onClick={() => setSuccess(false)} style={{ width: '100%' }}>
                {t('registerOfficer.success.btnNext')}
              </button>
            </div>
          ) : (
            <>
              <div className="auth-form-header" style={{ marginBottom: '12px', marginTop: '60px' }}>
                <h1 style={{ fontSize: '24px' }}>{t('registerOfficer.form.title')}</h1>
                <p style={{ fontSize: '13px' }}>{t('registerOfficer.form.subtitle')}</p>
              </div>

              <form onSubmit={handleSignup} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1 }}>
                
                <div className="auth-input-group">
                  <label>{t('registerOfficer.form.fullNameLabel')}</label>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <input 
                      id="fullName"
                      name="fullName"
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(capitalizeSentences(e.target.value))}
                      required
                      placeholder={t('registerOfficer.form.fullNamePlaceholder')}
                      autoComplete="name"
                      data-lpignore="true"
                      style={{ height: '42px' }}
                    />
                  </div>
                </div>

                <div className="auth-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="auth-input-group">
                    <label>{t('registerOfficer.form.badgeNumLabel')}</label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      </div>
                      <input 
                        id="badgeNumber"
                        name="badgeNumber"
                        type="text" 
                        value={badgeNumber}
                        onChange={(e) => setBadgeNumber(capitalizeSentences(e.target.value))}
                        required
                        placeholder={t('registerOfficer.form.badgeNumPlaceholder')}
                        autoComplete="off"
                        inputMode="text"
                        style={{ height: '42px' }}
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label>{t('registerOfficer.form.roleLabel')}</label>
                    <div className="auth-input-wrapper">
                      <div className="auth-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
                      </div>
                      <select 
                        id="role"
                        name="role"
                        value={targetRole} 
                        onChange={(e) => setTargetRole(e.target.value)}
                        style={{ height: '42px', paddingRight: '40px' }}
                        required
                      >

                        <option value="io">{t('registerOfficer.form.roleIo')}</option>
                        <option value="oc_cid">{t('registerOfficer.form.roleOcCid')}</option>
                        <option value="ocs">{t('registerOfficer.form.roleOcs')}</option>
                      </select>
                      <div style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>{t('registerOfficer.form.emailLabel')}</label>
                  <div className="auth-input-wrapper">
                    <div className="auth-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                    <input 
                      id="email"
                      name="email"
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={t('registerOfficer.form.emailPlaceholder')}
                      autoComplete="email"
                      data-lpignore="true"
                      style={{ height: '42px' }}
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label>{t('registerOfficer.form.tempPassLabel')}</label>
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
                      placeholder={t('registerOfficer.form.tempPassPlaceholder')}
                      autoComplete="new-password"
                      data-lpignore="true"
                      style={{ height: '42px' }}
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

                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '80%', margin: '12px auto 0', alignSelf: 'center', flexShrink: 0, fontSize: '14px', fontWeight: '600', height: '44px' }}>
                  {loading ? t('registerOfficer.form.processing') : t('registerOfficer.form.submitBtn')}
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default RegisterOfficer;
