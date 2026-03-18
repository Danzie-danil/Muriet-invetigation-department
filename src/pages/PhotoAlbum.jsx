import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Upload, Image as ImageIcon, Download, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { SkeletonImage } from '../components/ui/Skeleton';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { db } from '../db/db';
import { withTimeout, compressImage } from '../lib/utils';

const PhotoAlbum = () => {
  const { t, lang } = useLanguage();
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cases, setCases] = useState([]);
  const [isFetchingCases, setIsFetchingCases] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isClosingPreview, setIsClosingPreview] = useState(false);
  const [displayPhoto, setDisplayPhoto] = useState(null);

  useEffect(() => {
    if (previewPhoto) {
      setDisplayPhoto(previewPhoto);
      setIsClosingPreview(false);
    } else if (displayPhoto) {
      setIsClosingPreview(true);
      const timer = setTimeout(() => {
        setDisplayPhoto(null);
        setIsClosingPreview(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [previewPhoto, displayPhoto]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isModalOpen && cases.length === 0) {
      const fetchAllCases = async () => {
        setIsFetchingCases(true);
        try {
          const { data, error } = await withTimeout(
            supabase
              .from('cases')
              .select('id, rb_number, suspect_full_name')
              .order('created_at', { ascending: false }),
            8000
          );
          if (error) throw error;
          setCases(data || []);
        } catch (err) {
          console.error('Error fetching cases:', err);
          setUploadError('Failed to load cases: ' + err.message);
        } finally {
          setIsFetchingCases(false);
        }
      };
      fetchAllCases();
    }
  }, [isModalOpen, cases.length]);

  const handleUpload = async () => {
    if (!selectedCaseId) {
      setUploadError(lang === 'en' ? 'Please select a case' : 'Tafadhali chagua kesi');
      return;
    }
    if (!photoFile) {
      setUploadError(lang === 'en' ? 'Please select a photo' : 'Tafadhali chagua picha');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const compressed = await compressImage(photoFile);
      const fileExt = photoFile.name.split('.').pop();
      const filePath = `${selectedCaseId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('mugshots')
        .upload(filePath, compressed, { contentType: compressed.type, upsert: true });

      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase.from('case_mugshots').insert({
        case_id: selectedCaseId,
        file_path: filePath,
        original_filename: photoFile.name,
        file_size: compressed.size,
        uploaded_by: user?.id || null,
      });

      if (dbErr) throw dbErr;

      // Success
      setIsModalOpen(false);
      setPhotoFile(null);
      setSelectedCaseId('');
      fetchPhotos(); // Refresh album
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'mugshot.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const fetchPhotos = useCallback(async (shouldShowSpinner = true) => {
    if (shouldShowSpinner) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('case_mugshots')
        .select('*, cases(rb_number, suspect_full_name), habitual_register(suspect_name, suspect_national_id)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ALBUM DEBUG] Query FAILED:', error);
        throw error;
      }

      // Generate local URLs (Check Dexie cache first)
      const withUrls = await Promise.all(
        (data || []).map(async (item) => {
          try {
            const cached = await db.mugshots.get(item.case_id || item.habitual_id);
            if (cached?.blob) {
              return { ...item, signedUrl: URL.createObjectURL(cached.blob) };
            }
          } catch (e) {
            console.warn('[DB] Cache lookup failed for', item.case_id || item.habitual_id);
          }

          // Fallback to temporary signed URL if not cached locally
          const { data: urlData } = await supabase.storage
            .from('mugshots')
            .createSignedUrl(item.file_path, 3600);

          return { ...item, signedUrl: urlData?.signedUrl || null };
        })
      );

      setPhotos(withUrls);
    } catch (err) {
      console.error('[ALBUM DEBUG] Error fetching mugshots:', err);
    } finally {
      if (shouldShowSpinner) setIsLoading(false);
    }
  }, [photos.length]);


  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return (
    <div className="u-stack">
      <div className="page-header">
        <div className="page-title-container">
          <h1 className="page-title">{t('photos.title')}</h1>
          <span className="page-title-tagline">{t('photos.subtitle')}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> {lang === 'en' ? 'Add Photo' : 'Mugshot Mpya'}
          </Button>
        </div>
      </div>
      
      {isLoading && photos.length === 0 ? (
        <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: '12px' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} padding="0">
              <SkeletonImage style={{ width: '100%', aspectRatio: '1/1', margin: 0 }} />
              <div style={{ padding: '8px 10px' }}>
                <div className="skeleton skeleton-text" style={{ width: '70%', height: '11px' }} />
                <div className="skeleton skeleton-text" style={{ width: '50%', height: '10px', marginTop: '4px' }} />
              </div>
            </Card>
          ))}
        </div>
      ) : photos.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            {t('photos.noPhotos')}
          </div>
        </Card>
      ) : (
        <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: '12px' }}>
          {photos.map((photo) => (
            <Card 
              key={photo.id} 
              padding="0" 
              onClick={() => setPreviewPhoto(photo)}
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', backgroundColor: 'var(--bg-skeleton)', overflow: 'hidden', containerType: 'inline-size' }}>
                {photo.signedUrl ? (
                  <>
                    <img 
                      src={photo.signedUrl} 
                      alt={photo.is_habitual ? photo.habitual_register?.suspect_name : photo.cases?.suspect_full_name || 'Suspect'} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ 
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      pointerEvents: 'none', opacity: 0.15, transform: 'rotate(-45deg)',
                      fontSize: '8cqi', fontWeight: 900, color: 'black', whiteSpace: 'nowrap'
                    }}>
                      {t('common.confidential')}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: '8px', right: '8px',
                      background: photo.is_habitual ? 'var(--danger-color)' : 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px',
                      borderRadius: '4px', fontSize: '10px', fontWeight: 700
                    }}>
                      {photo.is_habitual ? 'HABITUAL' : new Date(photo.created_at).toISOString().split('T')[0]}
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {t('photos.unavailable')}
                  </div>
                )}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 700, marginBottom: '2px', lineHeight: '1.2', color: photo.is_habitual ? 'var(--danger-color)' : 'var(--primary-color)', textTransform: 'uppercase' }}>
                  {photo.is_habitual ? photo.habitual_register?.suspect_name : photo.cases?.suspect_full_name || '—'}
                </h3>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                  {photo.is_habitual ? `NIDA: ${photo.habitual_register?.suspect_national_id || '—'}` : photo.cases?.rb_number || '—'}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Mugshot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setUploadError('');
          setPhotoFile(null);
          setSelectedCaseId('');
        }}
        title={lang === 'en' ? 'Upload New Mugshot' : 'Pakia Mugshot Mpya'}
        primaryAction={handleUpload}
        primaryLabel={lang === 'en' ? 'Upload' : 'Pakia'}
        secondaryAction={() => setIsModalOpen(false)}
        secondaryLabel={t('common.cancel')}
        isPrimaryLoading={isUploading}
      >
        <div className="u-stack">
          {uploadError && (
            <div style={{ padding: '12px', background: 'var(--danger-color)', color: 'white', borderRadius: '8px', fontSize: '14px' }}>
              {uploadError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{lang === 'en' ? 'Select Case' : 'Chagua Kesi'} <span style={{color: 'var(--danger-color)'}}>*</span></label>
            <select 
              className="form-control"
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}
              disabled={isFetchingCases}
            >
              <option value="">
                {isFetchingCases 
                  ? (lang === 'en' ? 'Loading cases...' : 'Inapakia kesi...') 
                  : (lang === 'en' ? '-- Select a case --' : '-- Chagua kesi --')}
              </option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.rb_number} - {c.suspect_full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'en' ? 'Photo / Mugshot' : 'Picha / Mugshot'} <span style={{color: 'var(--danger-color)'}}>*</span></label>
            <div 
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                position: 'relative'
              }}
            >
               {photoFile ? (
                <div>
                  <ImageIcon size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>{photoFile.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{(photoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <Upload size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>{lang === 'en' ? 'Click to browse folder' : 'Bonyeza kuchagua picha'}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>PNG, JPG up to 10MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPhotoFile(e.target.files[0]);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Photo Preview Overlay - Portaled to document.body for full coverage */}
      {displayPhoto && createPortal(
        <div 
          onClick={() => setPreviewPhoto(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)', 
            backdropFilter: 'blur(20px) saturate(160%) brightness(1.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, 
            animation: `${isClosingPreview ? 'fadeOut' : 'fadeIn'} 0.25s ease forwards`,
            padding: '20px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: '416px', height: 'auto', background: 'white', borderRadius: '20px',
              overflow: 'hidden', boxShadow: '0 25px 70px -12px rgba(0, 0, 0, 0.4)',
              animation: `${isClosingPreview ? 'photoExit' : 'photoEntrance'} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div style={{ position: 'relative', width: '416px', height: '416px', backgroundColor: 'var(--bg-skeleton)' }}>
              <img 
                src={displayPhoto.signedUrl} 
                alt="Preview" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: displayPhoto.is_habitual ? 'var(--danger-color)' : 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.02em' }}>
                    {displayPhoto.is_habitual ? displayPhoto.habitual_register?.suspect_name : displayPhoto.cases?.suspect_full_name}
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                    {displayPhoto.is_habitual ? `NIDA: ${displayPhoto.habitual_register?.suspect_national_id}` : displayPhoto.cases?.rb_number}
                  </p>
                </div>
                <button 
                  onClick={() => setPreviewPhoto(null)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <X size={20} color="currentColor" />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button 
                  variant="success"
                  style={{ flex: 1, gap: 'var(--gutter-xs)' }} 
                  onClick={() => handleDownload(displayPhoto.signedUrl, `${displayPhoto.cases?.rb_number}_mugshot.jpg`)}
                >
                  <Download size={18} /> {lang === 'en' ? 'Download' : 'Pakua'}
                </Button>
                <Button 
                  variant="primary" 
                  style={{ flex: 1, gap: 'var(--gutter-xs)' }}
                  onClick={() => navigate(displayPhoto.is_habitual ? '/habituals' : `/cases?view=${displayPhoto.case_id}`)}
                >
                  <ExternalLink size={18} /> {lang === 'en' ? (displayPhoto.is_habitual ? 'Go to Habituals' : 'Go to Case') : (displayPhoto.is_habitual ? 'Fungua Habituals' : 'Fungua Kesi')}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes photoEntrance { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes photoExit { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.9) translateY(20px); } }
      `}</style>
    </div>
  );
};

export default PhotoAlbum;
