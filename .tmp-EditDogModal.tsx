import React, { useEffect, useState, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import '../../css/edit-modal.css';

interface EditDogFormData {
  name: string;
  breed?: string;
  color?: string;
  location?: string;
  age?: number;
  description?: string;
  size?: 'small' | 'medium' | 'large';
  gender?: 'male' | 'female';
  vaccinated?: boolean;
  neutered?: boolean;
}

interface EditDogModalProps {
  dog: any;
  onClose: () => void;
  onSave: (updatedDog: any) => void;
  modalPosition?: {x: number, y: number};
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    return `${API_URL}${url}`;
  }
  return url;
};

function EditDogModal({ dog, onClose, onSave, modalPosition }: EditDogModalProps) {
  const isMounted = useRef(true);
  const { t } = useTranslation();
  const { token } = useAuth();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>(dog.images ? [...dog.images] : []);
  const [selectedToDelete, setSelectedToDelete] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditDogFormData>({ defaultValues: dog });


  useEffect(() => {
    isMounted.current = true;
    Object.entries(dog).forEach(([key, value]) => {
      setValue(key as any, value);
    });
    setExistingImages(dog.images ? [...dog.images] : []);
    return () => {
      isMounted.current = false;
    };
  }, [dog, setValue]);

  const onSubmit: SubmitHandler<EditDogFormData> = async (fields) => {
    try {
      if (!isMounted.current) return;
      setSubmitting(true);
      setSubmitError(null);
      let resp;
      const hasNewFiles = mediaFiles.length > 0;
      const hasRemovedImages = existingImages.length !== (dog.images ? dog.images.length : 0);
      const hasPhotoChanges = hasNewFiles || hasRemovedImages;
      if (hasPhotoChanges) {
        const formData = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
          if (typeof v !== 'undefined' && v !== '') formData.append(k, v as any);
        });
        const keepImagesData = JSON.stringify(existingImages.map(img => img.url));
        formData.append('keepImages', keepImagesData);
        mediaFiles.forEach((file, idx) => {
          formData.append('media', file, file.name);
        });
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        try {
          resp = await fetch(`${API_URL}/api/dogs/${dog._id}`, {
            method: 'PATCH',
            body: formData,
            headers
          });
        } catch (fetchErr) {
          if (isMounted.current) {
            setSubmitError('Failed to upload images. Please check your connection or try again.');
            setSubmitting(false);
          }
          return;
        }
      } else {
        const bodyData: any = {};
        Object.entries(fields).forEach(([k, v]) => {
          if (typeof v !== 'undefined' && v !== '') bodyData[k] = v;
        });
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        resp = await fetch(`${API_URL}/api/dogs/${dog._id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(bodyData)
        });
      }
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update dog');
      }
      // Always fetch the latest dog data after update
      if (isMounted.current) {
        setMediaFiles([]);
        setMediaPreviews([]);
      }
      try {
        const freshResp = await fetch(`${API_URL}/api/dogs/${dog._id}?cb=${Date.now()}`);
        if (freshResp.ok) {
          const freshDog = await freshResp.json();
          if (isMounted.current) onSave(freshDog);
        } else {
          const updatedDog = await resp.json();
          if (isMounted.current) onSave(updatedDog);
        }
      } catch (e) {
        const updatedDog = await resp.json();
        if (isMounted.current) onSave(updatedDog);
      }
      if (isMounted.current) onClose();
    } catch (err: any) {
      if (!isMounted.current) return;
      if (mediaFiles.length > 0 && (err.message === 'Failed to fetch' || err.message === 'NetworkError when attempting to fetch resource.')) {
        setSubmitError('Failed to upload images. Please check your connection or try again.');
      } else {
        setSubmitError(err.message || 'Failed to update dog');
      }
    } finally {
      if (isMounted.current) setSubmitting(false);
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
        alignItems: window.innerWidth > 768 ? 'center' : 'stretch',
        justifyContent: 'center',
        padding: window.innerWidth > 768 ? '2rem' : '0',
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
          borderRadius: window.innerWidth > 768 ? '12px' : '0',
          padding: '1.5rem',
          paddingTop: window.innerWidth > 768 ? '1.5rem' : '3.5rem',
          paddingBottom: window.innerWidth > 768 ? '1.5rem' : '6rem',
          width: window.innerWidth > 768 ? '100%' : '100vw',
          height: window.innerWidth > 768 ? 'auto' : '100vh',
          maxWidth: window.innerWidth > 768 ? '600px' : '100vw',
          maxHeight: window.innerWidth > 768 ? '90vh' : '100vh',
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
          position: window.innerWidth <= 768 ? 'sticky' : 'static',
          top: window.innerWidth <= 768 ? '0' : 'auto',
          backgroundColor: 'white',
          zIndex: 100,
          paddingTop: window.innerWidth <= 768 ? '0.5rem' : '0'
        }}>{t('editdog.title', { name: dog.name }) || `Edit ${dog.name}`}</h2>
        <form 
          onSubmit={handleSubmit(onSubmit)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {/* Media preview and upload */}
          <label>{t('adddog.media') || 'Photos'}</label>
          <div className="media-input-row">
            <input
              id="editdog-media"
              name="media"
              type="file"
              accept="image/*"
              multiple
              onChange={e => {
                const files = Array.from(e.target.files || []);
                setMediaFiles(prev => [...prev, ...files]);
                setMediaPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
              }}
            />
            {mediaPreviews.length > 0 && (
              <button 
                type="button" 
                onClick={() => {
                  setMediaFiles([]);
                  setMediaPreviews([]);
                }}
                className="editdog-reset-photos-btn"
              >
                {t('editdog.resetPhotos') || 'Reset New Photos'}
              </button>
            )}
            {mediaPreviews.length > 0 && (
              <div>
                <p style={{ margin: '0.5rem 0', color: '#e67e22', fontSize: '0.95rem', fontWeight: 'bold' }}>
                  {t('editdog.newPhotos') || 'New photos selected (will be added to existing). To remove old photos, uncheck or delete them below.'}
                </p>
                <div className="media-preview-list">
                  {mediaPreviews.map((url, idx) => (
                    <img key={idx} src={url} alt={`preview-${idx}`} width={80} />
                  ))}
                </div>
              </div>
            )}
            {existingImages.length > 0 && (
              <div>
                <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                  {t('editdog.currentPhotos') || 'Current photos:'}
                </p>
                <div className="media-preview-list">
                  {existingImages.map((img: any, idx: number) => (
                    <span key={idx} style={{ position: 'relative', display: 'inline-block', marginRight: 8 }}>
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
                        style={{ position: 'absolute', top: window.innerWidth <= 768 ? 8 : 2, left: window.innerWidth <= 768 ? 8 : 2, zIndex: 3, width: window.innerWidth <= 768 ? 32 : 20, height: window.innerWidth <= 768 ? 32 : 20, accentColor: '#e74c3c', background: '#fff', border: '2px solid #e74c3c', borderRadius: 6, boxShadow: window.innerWidth <= 768 ? '0 2px 8px rgba(0,0,0,0.12)' : 'none' }}
                        title="Select to delete"
                      />
                      <img src={getImageUrl(img.url)} alt={`img-${idx}`} width={window.innerWidth <= 768 ? 120 : 80} style={{ opacity: selectedToDelete.has(idx) ? 0.5 : 1, borderRadius: 8, marginTop: window.innerWidth <= 768 ? 12 : 0 }} />
                      <button
                        type="button"
                        style={{ position: 'absolute', top: window.innerWidth <= 768 ? 8 : 2, right: window.innerWidth <= 768 ? 8 : 2, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: window.innerWidth <= 768 ? 32 : 20, height: window.innerWidth <= 768 ? 32 : 20, minWidth: window.innerWidth <= 768 ? 32 : 20, minHeight: window.innerWidth <= 768 ? 32 : 20, maxWidth: window.innerWidth <= 768 ? 32 : 20, maxHeight: window.innerWidth <= 768 ? 32 : 20, cursor: 'pointer', fontWeight: 'bold', fontSize: window.innerWidth <= 768 ? 22 : 14, lineHeight: window.innerWidth <= 768 ? '32px' : '20px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: window.innerWidth <= 768 ? '0 2px 8px rgba(0,0,0,0.12)' : 'none' }}
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
                        title="Delete this image"
                      >
                        &times;
                      </button>
                      {window.innerWidth <= 768 && (
                        <span style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(255,255,255,0.85)', color: '#e74c3c', fontWeight: 'bold', fontSize: 12, borderRadius: 4, padding: '2px 6px', zIndex: 4 }}>
                          {t('editdog.tapToRemove') || 'Tap to remove'}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontWeight: 'bold', color: '#333', marginBottom: 2 }}>Image actions:</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}
                        disabled={selectedToDelete.size === 0}
                        onClick={() => {
                          setExistingImages(existingImages.filter((_, i) => !selectedToDelete.has(i)));
                          setSelectedToDelete(new Set());
                        }}
                      >
                        Delete Selected
                      </button>
                      <button
                        type="button"
                        style={{ background: '#e67e22', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => {
                          setExistingImages([]);
                          setSelectedToDelete(new Set());
                        }}
                      >
                        Delete All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {existingImages.length === 0 && mediaPreviews.length === 0 && (
              <p style={{ margin: '0.5rem 0', color: '#999', fontSize: '0.9rem' }}>
                {t('editdog.noPhotos') || 'No photos selected'}
              </p>
            )}
          </div>

          {/* Dog name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="editdog-name" style={{ fontWeight: 'bold' }}>{t('adddog.name')}</label>
            <input 
              id="editdog-name"
              name="name"
              type="text" 
              autoComplete="name"
              {...register('name', { required: true })} 
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            {errors.name && <div className="error" style={{ color: '#e74c3c', fontSize: '0.875rem' }}>{t('adddog.name')} is required</div>}
          </div>

          {/* Breed and Color */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="editdog-breed" style={{ fontWeight: 'bold' }}>{t('adddog.breed')}</label>
              <input 
                id="editdog-breed"
                name="breed"
                type="text" 
                autoComplete="off"
                {...register('breed')} 
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="editdog-color" style={{ fontWeight: 'bold' }}>{t('adddog.color')}</label>
              <input 
                id="editdog-color"
                name="color"
                type="text" 
                autoComplete="off"
                {...register('color')} 
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Location and Age */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="editdog-location" style={{ fontWeight: 'bold' }}>{t('adddog.location')}</label>
              <input 
                id="editdog-location"
                name="location"
                type="text" 
                autoComplete="address-level2"
                {...register('location')} 
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="editdog-age" style={{ fontWeight: 'bold' }}>{t('adddog.age')}</label>
              <input 
                id="editdog-age"
                name="age"
                type="number" 
                autoComplete="off"
                {...register('age', { valueAsNumber: true })} 
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="editdog-description" style={{ fontWeight: 'bold' }}>{t('adddog.description')}</label>
            <textarea 
              id="editdog-description"
              name="description"
              rows={3} 
              autoComplete="off"
              {...register('description')} 
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Size */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="editdog-size" style={{ fontWeight: 'bold' }}>{t('adddog.size')}</label>
            <select 
              id="editdog-size"
              name="size"
              autoComplete="off"
              {...register('size')}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: '#fff',
                boxSizing: 'border-box'
              }}
            >
              <option value="small">{t('size.small')}</option>
              <option value="medium">{t('size.medium')}</option>
              <option value="large">{t('size.large')}</option>
            </select>
          </div>

          {/* Gender */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold' }}>{t('adddog.gender')}</label>
            <div style={{ 
              display: 'flex',
              flexDirection: window.innerWidth > 768 ? 'row' : 'column',
              gap: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px solid #e9ecef'
            }}>
              <label htmlFor="editdog-gender-male" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
                <input 
                  id="editdog-gender-male"
                  name="gender"
                  type="radio" 
                  {...register('gender')} 
                  value="male"
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    cursor: 'pointer'
                  }}
                />
                <span>{t('gender.male')}</span>
              </label>
              <label htmlFor="editdog-gender-female" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
                <input 
                  id="editdog-gender-female"
                  name="gender"
                  type="radio" 
                  {...register('gender')} 
                  value="female"
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    cursor: 'pointer'
                  }}
                />
                <span>{t('gender.female')}</span>
              </label>
            </div>
          </div>

          {/* Health */}
          <div 
            id="health" 
            style={{
              display: 'flex',
              flexDirection: window.innerWidth > 768 ? 'row' : 'column',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px solid #e9ecef'
            }}
          >
            <label htmlFor="editdog-vaccinated" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
              <input 
                id="editdog-vaccinated"
                name="vaccinated"
                type="checkbox" 
                {...register('vaccinated')} 
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  cursor: 'pointer'
                }}
              />
              <span>{t('adddog.vaccinated')}</span>
            </label>
            <label htmlFor="editdog-neutered" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
              <input 
                id="editdog-neutered"
                name="neutered"
                type="checkbox" 
                {...register('neutered')} 
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  cursor: 'pointer'
                }}
              />
              <span>{t('adddog.neutered')}</span>
            </label>
          </div>

          {/* Submit and error */}
          <div 
            className="form-actions" 
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              position: window.innerWidth <= 768 ? 'fixed' : 'static',
              bottom: window.innerWidth <= 768 ? '0' : 'auto',
              left: window.innerWidth <= 768 ? '0' : 'auto',
              right: window.innerWidth <= 768 ? '0' : 'auto',
              padding: window.innerWidth <= 768 ? '1rem' : '1rem 0',
              backgroundColor: 'white',
              borderTop: window.innerWidth <= 768 ? '1px solid #ddd' : 'none',
              boxShadow: window.innerWidth <= 768 ? '0 -2px 10px rgba(0,0,0,0.1)' : 'none',
              zIndex: window.innerWidth <= 768 ? 1000 : 'auto'
            }}
          >
            <button 
              type="submit" 
              disabled={submitting}
              className="editdog-submit-btn"
            >
              {submitting ? t('editdog.saving') || 'Saving...' : t('button.save')}
            </button>
            {submitError && <div className="error" style={{ color: '#e74c3c', fontSize: '0.875rem', textAlign: 'center' }}>{submitError}</div>}
          </div>
        </form>
      </div>
    </div>
    );
  }
  export default EditDogModal;
