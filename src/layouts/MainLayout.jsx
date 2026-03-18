import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, BookOpen, UserCheck, Image as ImageIcon, Shield, Menu, X, FileText, Languages, LogOut, UserPlus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import murietPoliceEmblem from '../assets/muriet_police_emblem.png';
import OptimizedImage from '../components/ui/OptimizedImage';
import { translations } from '../constants/translations';

export default function MainLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { t, lang, toggleLanguage } = useLanguage();
  const [modalLang, setModalLang] = useState(lang);

  // Sync modalLang when globalLang changes (only when modal opens)
  useEffect(() => {
    if (isProfileOpen) setModalLang(lang);
  }, [isProfileOpen, lang]);

  const toggleModalLang = (e) => {
    e.stopPropagation();
    setModalLang(prev => prev === 'en' ? 'sw' : 'en');
  };

  const modalT = (key) => {
    // Basic inline translation helper for the profile modal
    const keys = key.split('.');
    let r = translations[modalLang] || translations['en'];
    for(const k of keys) { r = r?.[k]; }
    return r || key;
  };

  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();

  const getRoleDisplayName = (role) => {
    switch(role) {
      case 'ocs': return modalLang === 'en' ? 'Station Commander' : 'Kamanda wa Kituo';
      case 'oc_cid': return modalLang === 'en' ? 'Head of CID' : 'Mkuu wa CID';
      case 'io': return modalLang === 'en' ? 'Investigating Officer' : 'Afisa Upelelezi';
      default: return 'Authorized Officer';
    }
  };

  const navLinks = [
    { name: t('nav.dashboard'), path: '/', icon: Home, show: true },
    { name: t('nav.cases'), path: '/cases', icon: FolderOpen, show: true },
    { name: t('nav.evidences'), path: '/evidences', icon: FileText, show: true },
    { name: t('nav.photoAlbum'), path: '/photos', icon: ImageIcon, show: true },
    { name: t('nav.caseProgression'), path: '/progression', icon: FolderOpen, show: true },
    { name: t('nav.habitualCriminals'), path: '/habituals', icon: UserCheck, show: true },
    { name: t('nav.courtAssessment'), path: '/court', icon: BookOpen, show: true },
    { name: t('nav.auditLogs'), path: '/audit', icon: Shield, show: true },
    // OCS strictly isolated internal Route
    { name: lang === 'en' ? 'Register Officer' : 'Sajili Afisa', path: '/register-officer', icon: UserPlus, show: profile?.role === 'ocs' }
  ];

  const profileData = {
    name: profile?.full_name || user?.email?.split('@')[0] || 'Officer',
    role: getRoleDisplayName(profile?.role),
    station: 'TZ-ARUSHA-MURIET-POLICE',
    id: profile?.badge_number || 'PENDING',
    email: user?.email || '',
    department: 'MURIET P.I.D. - INVESTIGATIONS'
  };

  const initials = (profileData.name || 'User').split(' ').map(n => n?.[0] || '').join('').substring(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Top Navbar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--gutter-s)',
        height: 'var(--header-height)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ 
              display: 'none', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              color: 'var(--primary-color)',
              width: '44px',
              height: '44px',
              alignItems: 'center',
              justifyContent: 'center'
            }} 
            className="mobile-toggle"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px' }} className="hide-mobile">
              <OptimizedImage 
                src={murietPoliceEmblem} 
                alt="Logo" 
                style={{ width: '100%', height: '100%' }}
                skeletonStyle={{ borderRadius: '4px' }}
              />
            </div>
            <span className="hide-mobile">{lang === 'en' ? 'MURIET P.I.D.' : 'POLISI MURIET'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Home Button */}
          <Link 
            to="/" 
            title={lang === 'en' ? 'Back to Dashboard' : 'Rudi kwenye Dashibodi'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--bg-surface-active)',
              border: '1.5px solid var(--border-color)',
              color: 'var(--primary-color)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textDecoration: 'none'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Home size={18} />
          </Link>

          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '36px',
              padding: '0 16px',
              borderRadius: '18px',
              background: 'var(--bg-surface-active)',
              border: '1.5px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <Languages size={16} color="var(--primary-color)" />
            {lang === 'en' ? 'SW' : 'EN'}
          </button>

          {/* Quick Logout Button */}
          <button 
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            title={lang === 'en' ? 'Secure Logout' : 'Ondoka (Logout)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--danger-color)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <LogOut size={18} />
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }}></div>

          <div 
            onClick={() => setIsProfileOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div style={{ textAlign: 'right', lineHeight: 1.2 }} className="hide-mobile">
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>{profileData.name}</span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{profileData.role}</span>
            </div>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', 
              background: 'var(--primary-color)', color: 'white', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: '14px',
              boxShadow: '0 0 0 2px var(--bg-surface), 0 0 0 4px var(--bg-surface-active)'
            }}>
              {initials}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout Area */}
      <div style={{ display: 'flex', marginTop: 'var(--header-height)', height: 'calc(100vh - var(--header-height))', width: '100%' }}>
        
        {/* Sidebar Navigation */}
        <aside style={{
          width: 'var(--sidebar-width)',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--gutter-s) var(--gutter-xs)',
          gap: '4px',
          overflowY: 'auto',
          transition: 'transform 0.3s ease',
          zIndex: 100
        }} className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div style={{ padding: '0 12px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {lang === 'en' ? 'Main Menu' : 'Menyu Kuu'}
          </div>
          {navLinks.filter(link => link.show).map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={{
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-surface-active)' : 'transparent',
                }}
              >
                <Icon size={18} />
                {link.name}
              </Link>
            );
          })}
          
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button 
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--danger-color)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={18} />
              {lang === 'en' ? 'Secure Logout' : 'Ondoka (Logout)'}
            </button>
          </div>
        </aside>

        {/* Page Content & Mobile Backdrop */}
        <main style={{ 
          flex: 1, 
          padding: 'var(--gutter-m)', 
          overflowY: 'auto', 
          background: 'var(--bg-primary)',
          position: 'relative'
        }}>
          {isSidebarOpen && (
            <div 
              className="mobile-backdrop"
              onClick={() => setIsSidebarOpen(false)}
              style={{
                position: 'fixed',
                top: 'var(--header-height)',
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(6px)',
                zIndex: 99,
                display: 'none'
              }}
            />
          )}
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      {isProfileOpen && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100000,
            animation: 'fadeIn 0.25s ease'
          }}
          onClick={() => setIsProfileOpen(false)}
        >
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={toggleModalLang}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  <Languages size={14} />
                  {modalLang === 'en' ? 'SW' : 'EN'}
                </button>
                <button className="btn-icon" onClick={() => setIsProfileOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '6px' }}>
                  <X size={20} />
                </button>
              </div>
              <div className="profile-modal-avatar">
                {initials}
              </div>
            </div>
            <div className="profile-modal-body">
              <div className="profile-header-info">
                <h2>{profileData.name}</h2>
                <span className="badge badge-blue">
                   {getRoleDisplayName(profile?.role)}
                </span>
              </div>

              <div className="profile-details-grid">
                <div className="profile-detail-item">
                  <span className="profile-detail-label">{modalLang === 'en' ? 'Full Name' : 'Jina Kamili'}</span>
                  <span className="profile-detail-value">{profileData.name}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">{modalLang === 'en' ? 'Service ID' : 'Nambari ya Utumishi'}</span>
                  <span className="profile-detail-value">{profileData.id}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">{modalLang === 'en' ? 'Department' : 'Idara'}</span>
                  <span className="profile-detail-value">{profileData.department}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">{modalLang === 'en' ? 'Station ID' : 'Nambari ya Kituo'}</span>
                  <span className="profile-detail-value">{profileData.station}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">{modalLang === 'en' ? 'Email Address' : 'Anwani ya Barua Pepe'}</span>
                  <span className="profile-detail-value">{profileData.email}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">{modalLang === 'en' ? 'Primary Phone' : 'Simu ya Msingi'}</span>
                  <span className="profile-detail-value">+255 (SECURED)</span>
                </div>
              </div>
            </div>
            <div className="profile-modal-footer" style={{ gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsProfileOpen(false)}
                style={{ flex: 1 }}
              >
                {modalLang === 'en' ? 'Cancel' : 'Ghairi'}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setIsProfileOpen(false)}
                style={{ flex: 1 }}
              >
                {modalT('common.save')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @media (max-width: 1023px) {
          .mobile-toggle {
            display: flex !important;
          }
          .mobile-backdrop {
            display: block !important;
          }
          .sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            left: 0;
            width: 80vw !important;
            max-width: 280px;
            transform: translateX(-100%);
            z-index: 1100;
            box-shadow: 10px 0 40px rgba(0,0,0,0.3);
            height: 100vh !important;
            margin-top: 0 !important;
            padding-top: var(--header-height) !important;
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .nav-link {
            font-size: 16px !important;
            padding: 14px 20px !important;
          }
          .hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
