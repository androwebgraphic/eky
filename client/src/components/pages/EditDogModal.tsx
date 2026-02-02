import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import '../../css/edit-modal.css';
import '../../css/editdog-visuals.css';


interface EditDogFormData {
  name: string;
  breed?: string;
  color?: string;
  location?: string;
  age?: number;
  description?: string;
  size?: string;
  gender?: string;
  vaccinated?: boolean;
  neutered?: boolean;
}

type DogImage = { url: string };


interface EditDogModalProps {
  dog: any;
  onClose: () => void;
  onSave: (dog: any) => void;
  modalPosition?: { x: number; y: number };
}

const API_URL = process.env.REACT_APP_API_URL || '';


const getImageUrl = (url: string) => {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith('/')) return API_URL + url;
  // Try both /uploads/dogs/ and /u/dogs/ for compatibility
  if (url.includes('/u/dogs/')) return API_URL + url;
  return API_URL + '/uploads/dogs/' + url;
};

// Helper for fallback image
const fallbackDogImg = '/img/placeholder-dog.jpg';



const EditDogModal = ({ dog, onClose, onSave, modalPosition }: EditDogModalProps) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const isMounted = useRef(true);
  const [gender, setGender] = useState(dog.gender || '');
  const [vaccinated, setVaccinated] = useState(!!dog.vaccinated);
  const [neutered, setNeutered] = useState(!!dog.neutered);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ name: string; url: string }[]>([]);
  const previewUrlsRef = useRef<{ [name: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [existingImages, setExistingImages] = useState<DogImage[]>(dog.images ? [...dog.images] : []);
  const [selectedToDelete, setSelectedToDelete] = useState<Set<number>>(new Set());
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Capture window size once on mount for stable modal layout
  const [windowSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));

  const { handleSubmit, setValue, reset } = useForm<EditDogFormData>({
    defaultValues: {
      name: dog.name || '',
      breed: dog.breed || '',
      color: dog.color || '',
      location: dog.location || '',
      age: dog.age || undefined,
      description: dog.description || '',
      size: dog.size || '',
      gender: dog.gender || '',
      vaccinated: !!dog.vaccinated,
      neutered: !!dog.neutered,
    }
  });

  // Only reset modal state if the dog ID changes (not on every prop update)
  const prevDogId = useRef(dog._id);
  useEffect(() => {
    isMounted.current = true;
    if (prevDogId.current !== dog._id) {
      console.log('[EditDogModal] useEffect: dog._id changed', dog._id);
      reset({
        name: dog.name || '',
        breed: dog.breed || '',
        color: dog.color || '',
        location: dog.location || '',
        age: dog.age || undefined,
        description: dog.description || '',
        size: dog.size || '',
        gender: dog.gender || '',
        vaccinated: !!dog.vaccinated,
        neutered: !!dog.neutered,
      });
      setExistingImages(dog.images ? [...dog.images] : []);
      setMediaFiles([]);
      setMediaPreviews([]);
      setSelectedToDelete(new Set());
      prevDogId.current = dog._id;
    } else {
      // Always update images if length or URLs differ
      const urls = (arr: any[] = []) => arr.map(img => img.url).join(',');
      const dogUrls = urls(dog.images);
      const existingUrls = urls(existingImages);
      if ((dog.images && existingImages && (dog.images.length !== existingImages.length || dogUrls !== existingUrls))) {
        setExistingImages([...dog.images]);
        console.log('[EditDogModal] useEffect: images updated', {dogImages: dog.images, existingImages});
      } else {
        console.log('[EditDogModal] useEffect: images NOT updated', {dogImages: dog.images, existingImages});
      }
    }
    return () => {
      isMounted.current = false;
    };
  }, [dog, dog.images, setValue, reset]);

  const onSubmit: SubmitHandler<EditDogFormData> = async (fields) => {
    setSubmitError(null);
    try {
      if (!isMounted.current) return;
      let resp;
      // Always send all fields, including unchecked checkboxes and empty fields
      const allKeys = [
        'name', 'breed', 'color', 'location', 'age', 'description', 'size', 'gender', 'vaccinated', 'neutered'
      ];
      // Always send correct keepImages (after deletions)
      const keepImagesArr = existingImages.map(img => img.url);
      const hasNewFiles = mediaFiles.length > 0;
      const hasRemovedImages = keepImagesArr.length !== (dog.images ? dog.images.length : 0);
      const hasPhotoChanges = hasNewFiles || hasRemovedImages;
      console.log('[EditDogModal] onSubmit', { fields, keepImagesArr, hasNewFiles, hasRemovedImages, hasPhotoChanges, existingImages, mediaFiles });
      if (hasPhotoChanges) {
        const formData = new FormData();
        allKeys.forEach(k => {
          let v = fields[k as keyof EditDogFormData];
          // Always send as string, even for 0, false, or empty
          if (k === 'vaccinated' || k === 'neutered') {
            formData.append(k, v ? 'true' : 'false');
          } else if (typeof v === 'number') {
            formData.append(k, String(v));
          } else if (typeof v === 'boolean') {
            formData.append(k, v ? 'true' : 'false');
          } else if (typeof v !== 'undefined' && v !== null) {
            formData.append(k, String(v));
          } else {
            formData.append(k, '');
          }
        });
        formData.append('keepImages', JSON.stringify(keepImagesArr));
        mediaFiles.forEach((file, idx) => {
          formData.append('media', file, file.name);
        });
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        try {
          resp = await fetch(`${API_URL}/api/dogs/${dog._id}`, {
            method: 'PATCH',
            body: formData,
            headers
          });
          // Debug log for upload response
          if (!resp.ok) {
            const errText = await resp.text();
            console.error('[UPLOAD ERROR] PATCH /api/dogs/:id failed:', errText);
          } else {
            const respText = await resp.clone().text();
            console.log('[UPLOAD SUCCESS] PATCH /api/dogs/:id response:', respText);
          }
        } catch (fetchErr) {
          if (isMounted.current) {
            console.error('[UPLOAD ERROR] Network or fetch failed:', fetchErr);
          }
          return;
        }
      } else {
        const bodyData: any = {};
        allKeys.forEach(k => {
          let v = fields[k as keyof EditDogFormData];
          if (k === 'vaccinated' || k === 'neutered') {
            bodyData[k] = v ? true : false;
          } else if (typeof v !== 'undefined' && v !== null) {
            bodyData[k] = v;
          } else {
            bodyData[k] = '';
          }
        });
        // Always include keepImages in JSON PATCH
        bodyData.keepImages = existingImages.map(img => img.url);
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        resp = await fetch(`${API_URL}/api/dogs/${dog._id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(bodyData)
        });
      }
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        setSubmitError(errData.message || 'Failed to update dog');
        throw new Error(errData.message || 'Failed to update dog');
      }
      // Always fetch the latest dog data after update (not just PATCH response)
      let updatedDog = null;
      let respText = '';
      try {
        respText = await resp.clone().text();
        const respData = JSON.parse(respText);
        updatedDog = respData.dog || respData;
        console.log('[EditDogModal] PATCH response JSON:', respData);
      } catch (e) {
        updatedDog = null;
        console.warn('[EditDogModal] PATCH response not valid JSON:', respText);
      }
      // Defensive: fetch latest from backend in case PATCH response is stale
      if (updatedDog && updatedDog._id) {
        try {
          const latestResp = await fetch(`${API_URL}/api/dogs/${updatedDog._id}`);
          if (latestResp.ok) {
            updatedDog = await latestResp.json();
          }
        } catch {}
      }
      if (isMounted.current && updatedDog) {
        // If images are missing, fetch latest dog data from backend
        let dogToShow = updatedDog;
        if (!updatedDog.images || updatedDog.images.length === 0) {
          try {
            const resp = await fetch(`${API_URL}/api/dogs/${updatedDog._id}`);
            if (resp.ok) {
              dogToShow = await resp.json();
            }
          } catch {}
        }
        // Debug: log all image URLs and dogToShow after upload
        if (dogToShow.images && dogToShow.images.length > 0) {
          console.log('[UI DEBUG] Images after upload:', dogToShow.images.map(img => img.url));
        } else {
          console.warn('[UI DEBUG] No images found after upload. dogToShow:', dogToShow);
        }
        // Update modal state directly so images show instantly
        setExistingImages(dogToShow.images ? [...dogToShow.images] : []);
        setMediaFiles([]);
        setMediaPreviews([]);
        // Do NOT reset modal or rely on parent for images
        console.log('[EditDogModal] onSubmit: calling onSave with dogToShow', dogToShow);
        onSave(dogToShow); // Still notify parent
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      if (mediaFiles.length > 0 && (err.message === 'Failed to fetch' || err.message === 'NetworkError when attempting to fetch resource.')) {
        setSubmitError('Failed to upload images. Please check your connection or try again.');
      } else {
        setSubmitError(err.message || 'Failed to update dog');
      }
      console.error('[EditDogModal] onSubmit error', err);
    }
  };

  return (
    <div 
      className="edit-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: windowSize.width > 768 ? 'center' : 'stretch',
        justifyContent: 'center',
        padding: windowSize.width > 768 ? '2rem' : '0',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: windowSize.width > 768 ? '12px' : '0',
          padding: '1.5rem',
          paddingTop: windowSize.width > 768 ? '1.5rem' : '3.5rem',
          paddingBottom: windowSize.width > 768 ? '1.5rem' : '6rem',
          width: windowSize.width > 768 ? '100%' : '100vw',
          height: windowSize.width > 768 ? '90vh' : '100vh',

          maxWidth: windowSize.width > 768 ? '600px' : '100vw',
          maxHeight: windowSize.width > 768 ? '90vh' : '100vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          zIndex: 2147483647,
        }}
      >
        <button 
          className="editdog-close-btn"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 style={{
          marginBottom: '1rem',
          position: 'static',
          backgroundColor: 'white',
          zIndex: 100,
          paddingTop: 0
        }}>{t('editdog.title', { name: dog.name })}</h2>
        {submitError && (
          <div style={{ color: '#e74c3c', fontWeight: 500, marginBottom: 12, textAlign: 'center' }}>{submitError}</div>
        )}
        <form 
          onSubmit={handleSubmit(onSubmit)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {/* Dog fields */}
          <label>{t('adddog.name')}</label>
          <input
            name="name"
            defaultValue={dog.name || ''}
            onChange={e => setValue('name', e.target.value)}
            required
            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }}
          />

          <label>{t('adddog.breed')}</label>
          <input
            name="breed"
            defaultValue={dog.breed || ''}
            onChange={e => setValue('breed', e.target.value)}
            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }}
          />

          <label>{t('adddog.color')}</label>
          <input
            name="color"
            defaultValue={dog.color || ''}
            onChange={e => setValue('color', e.target.value)}
            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }}
          />


          <label>{t('adddog.location')}</label>
          <input
            name="location"
            defaultValue={dog.location || ''}
            onChange={e => setValue('location', e.target.value)}
            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc' }}
          />

          <label style={{ fontSize: '1.1rem', fontWeight: 500 }}>{t('adddog.gender').replace('adddog.', '')}</label>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 8 }}>
            <label className={`editdog-radio-label${gender === 'male' ? ' selected' : ''}`} style={{ fontSize: '1.1rem', fontWeight: 500 }}>
              <input
                type="radio"
                name="gender"
                className="editdog-radio"
                checked={gender === 'male'}
                onChange={() => { setValue('gender', 'male'); setGender('male'); }}
              />
              <span className="editdog-radio-custom" />
              {t('adddog.male').replace('adddog.', '')}
            </label>
            <label className={`editdog-radio-label${gender === 'female' ? ' selected' : ''}`} style={{ fontSize: '1.1rem', fontWeight: 500 }}>
              <input
                type="radio"
                name="gender"
                className="editdog-radio"
                checked={gender === 'female'}
                onChange={() => { setValue('gender', 'female'); setGender('female'); }}
              />
              <span className="editdog-radio-custom" />
              {t('adddog.female').replace('adddog.', '')}
            </label>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 8 }}>
            <label className={`editdog-checkbox-label${vaccinated ? ' selected' : ''}`} style={{ fontSize: '1.1rem', fontWeight: 500 }}>
              <input
                type="checkbox"
                name="vaccinated"
                className="editdog-checkbox"
                checked={vaccinated}
                onChange={e => { setValue('vaccinated', e.target.checked); setVaccinated(e.target.checked); }}
              />
              <span className="editdog-checkbox-custom" />
              {t('adddog.vaccinated').replace('adddog.', '')}
            </label>
            <label className={`editdog-checkbox-label${neutered ? ' selected' : ''}`} style={{ fontSize: '1.1rem', fontWeight: 500 }}>
              <input
                type="checkbox"
                name="neutered"
                className="editdog-checkbox"
                checked={neutered}
                onChange={e => { setValue('neutered', e.target.checked); setNeutered(e.target.checked); }}
              />
              <span className="editdog-checkbox-custom" />
              {t('adddog.neutered').replace('adddog.', '')}
            </label>
          </div>

          <label>{t('adddog.description')}</label>
          <textarea
            name="description"
            defaultValue={dog.description || ''}
            onChange={e => setValue('description', e.target.value)}
            rows={3}
            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #ccc', resize: 'vertical' }}
          />

          {/* Media preview and upload */}
          <label>{t('adddog.media')}</label>
          <div className="media-input-row">
            <div style={{ position: 'relative', width: '100%' }}>
                <input
                id="editdog-media"
                name="media"
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  setMediaFiles(prev => {
                    const existingNames = new Set(prev.map(f => f.name));
                    const newFiles = files.filter(f => !existingNames.has(f.name));
                    newFiles.forEach(f => {
                      if (!previewUrlsRef.current[f.name]) {
                        previewUrlsRef.current[f.name] = URL.createObjectURL(f);
                      }
                    });
                    setMediaPreviews(prevPreviews => [
                      ...prevPreviews,
                      ...newFiles.map(f => ({ name: f.name, url: previewUrlsRef.current[f.name] }))
                    ]);
                    // Reset file input value so the same file can be selected again
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    return [...prev, ...newFiles];
                  });
                }}
                style={{ marginBottom: 8 }}
              />
              <div style={{ position: 'relative', height: 260, minHeight: 220, maxHeight: 300, width: '100%', overflow: 'hidden' }}>
                {/* Always render the reset button, but hide it with visibility when not needed */}
                <button
                  type="button"
                  onClick={() => {
                    setMediaFiles([]);
                    setMediaPreviews([]);
                    // Revoke all object URLs
                    Object.values(previewUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
                    previewUrlsRef.current = {};
                    // Reset file input value
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="editdog-reset-photos-btn"
                  style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, visibility: mediaPreviews.length > 0 ? 'visible' : 'hidden' }}
                  tabIndex={mediaPreviews.length > 0 ? 0 : -1}
                  aria-hidden={mediaPreviews.length === 0}
                >
                  {t('editdog.resetPhotos').replace('editdog.', '').replace('adddog.', '')}
                </button>
                <div style={{ height: 210, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {mediaPreviews.length === 0 && existingImages.length === 0 && (
                    <p style={{ margin: 0, color: '#b0b0b0', fontSize: '1rem', fontWeight: 500, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span role="img" aria-label="media">📷</span> {t('editdog.noPhotos').replace('editdog.', '').replace('adddog.', '')}
                    </p>
                  )}
                  <div className="media-preview-list-wrapper">
                    <div className="media-preview-list">
                      {(() => { console.log('[EditDogModal] RENDER IMAGES', {existingImages, dogImages: dog.images}); return null; })()}
                      {useMemo(() => {
                        if (mediaPreviews.length > 0) {
                          return mediaPreviews.map((preview) => (
                            <div key={preview.name} style={{ position: 'relative', width: 80, height: 80 }}>
                              <img
                                src={preview.url}
                                alt={`preview-${preview.name}`}
                                width={80}
                                height={80}
                                style={{ borderRadius: 8, objectFit: 'cover', height: 80, width: 80 }}
                              />
                            </div>
                          ));
                        } else if (existingImages.length > 0) {
                          // Show all images in existingImages, no filtering by filename
                          return existingImages
                            .map((img: any, idx: number) => {
                              if (!img.url) return null;
                              let imgUrl = getImageUrl(img.url);
                              if ((!imgUrl || imgUrl === '' || imgUrl === 'undefined') && !imageLoadErrors.has(idx)) {
                                return (
                                  <div key={(img._id ? img._id : '') + '-' + idx} style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 8, color: '#bbb', fontSize: 32 }}>
                                    <span role="img" aria-label="no image">📷</span>
                                  </div>
                                );
                              }
                              if (imageLoadErrors.has(idx)) return null;
                              const key = (img._id ? img._id : '') + '-' + idx;
                              return (
                                <div key={key} style={{ position: 'relative', width: 80, height: 80 }}>
                                  <img
                                    src={imgUrl}
                                    alt="Dog preview"
                                    width={80}
                                    height={80}
                                    style={{ borderRadius: 8, objectFit: 'cover', height: 80, width: 80, opacity: selectedToDelete.has(idx) ? 0.5 : 1, background: '#f5f5f5' }}
                                    onError={() => setImageLoadErrors(prev => new Set(prev).add(idx))}
                                  />
                                  <input
                                    type="checkbox"
                                    checked={selectedToDelete.has(idx)}
                                    onChange={e => {
                                      setSelectedToDelete(prev => {
                                        const next = new Set(prev);
                                        if (e.target.checked) next.add(idx);
                                        else next.delete(idx);
                                        return next;
                                      });
                                    }}
                                    style={{ position: 'absolute', top: 4, left: 4, zIndex: 3, width: 22, height: 22, accentColor: '#e74c3c', background: '#fff', border: '2px solid #e74c3c', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                                    title={selectedToDelete.has(idx) ? t('editdog.selectedToDelete').replace('editdog.', '').replace('adddog.', '') : t('editdog.selectToDelete').replace('editdog.', '').replace('adddog.', '')}
                                  />
                                  <button
                                    type="button"
                                    style={{ position: 'absolute', top: 4, right: 4, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, minWidth: 22, minHeight: 22, maxWidth: 22, maxHeight: 22, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, lineHeight: '22px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                                    onClick={() => {
                                      setExistingImages(existingImages.filter((_, i) => i !== idx));
                                      setSelectedToDelete(prev => {
                                        const next = new Set(prev);
                                        next.delete(idx);
                                        // Shift all indices above idx down by 1
                                        const shifted = new Set<number>();
                                        next.forEach(i => shifted.add(i > idx ? i - 1 : i));
                                        return shifted;
                                      });
                                    }}
                                    title={t('editdog.deleteThisImage').replace('editdog.', '').replace('adddog.', '')}
                                  >
                                    &times;
                                  </button>
                                </div>
                              );
                            })
                            .filter(Boolean);
                        }
                        return null;
                      }, [mediaPreviews, existingImages, selectedToDelete, t])}
                    </div>
                  </div>
                </div>
              {/* Action buttons for deleting images, only for existing images and only if not showing new images */}
              {mediaPreviews.length === 0 && existingImages.length > 0 && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', marginTop: 8, display: 'flex', gap: 8, background: 'white', zIndex: 2 }}>
                  <button
                    type="button"
                    style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}
                    disabled={selectedToDelete.size === 0}
                    onClick={() => {
                      setExistingImages(existingImages.filter((_, i) => !selectedToDelete.has(i)));
                      setSelectedToDelete(new Set());
                    }}
                  >
                    {t('editdog.deleteSelected').replace('editdog.', '').replace('adddog.', '')}
                  </button>
                  <button
                    type="button"
                    style={{ background: '#e67e22', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => {
                      setExistingImages([]);
                      setSelectedToDelete(new Set());
                    }}
                  >
                    {t('editdog.deleteAll').replace('editdog.', '').replace('adddog.', '')}
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button
              type="submit"
              style={{
                background: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '0.75rem 2rem',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(52,152,219,0.08)'
              }}
            >
              {t('editdog.save').replace('editdog.', '').replace('adddog.', '') || 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditDogModal;




