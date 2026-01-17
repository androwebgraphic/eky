import React, { useEffect, useState } from 'react';
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

const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (window.location.protocol === 'https:') {
    return `https://${window.location.hostname}`;
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://${window.location.hostname}:3001`;
  }
  return `http://172.20.10.2:3001`;
};

const API_URL = getApiUrl();

const EditDogModal: React.FC<EditDogModalProps> = ({ dog, onClose, onSave, modalPosition }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditDogFormData>({
    defaultValues: {
      name: dog.name || '',
      breed: dog.breed || '',
      color: dog.color || '',
      location: dog.location || '',
      age: dog.age,
      description: dog.description || '',
      size: dog.size || 'medium',
      gender: dog.gender,
      vaccinated: !!dog.vaccinated,
      neutered: !!dog.neutered,
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>(dog.images ? [...dog.images] : []);

  // Add modal-open class when component mounts, remove when unmounts
  useEffect(() => {
    // Don't lock body scroll - we need the overlay to scroll on mobile
    // Just prevent background content from scrolling
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    
    // On mobile, we want the overlay to scroll, not lock the body
    if (window.innerWidth <= 768) {
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
    };
  }, []);

  useEffect(() => {
    // Prefill form with dog data
    Object.entries(dog).forEach(([key, value]) => {
      setValue(key as any, value);
    });
    setExistingImages(dog.images ? [...dog.images] : []);
  }, [dog, setValue]);

  const onSubmit: SubmitHandler<EditDogFormData> = async (fields) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      console.log('Submitting with API_URL:', API_URL); // Debug
      console.log('Dog ID:', dog._id); // Debug
      console.log('Fields:', fields); // Debug
      
      let resp;
      const hasNewFiles = mediaFiles.length > 0;
      const hasRemovedImages = existingImages.length !== (dog.images ? dog.images.length : 0);
      const hasPhotoChanges = hasNewFiles || hasRemovedImages;
      
      console.log('=== PHOTO UPDATE DEBUG ===');
      console.log('mediaFiles:', mediaFiles);
      console.log('mediaFiles.length:', mediaFiles.length);
      console.log('existingImages:', existingImages);
      console.log('existingImages.length:', existingImages.length);
      console.log('dog.images:', dog.images);
      console.log('dog.images.length:', dog.images ? dog.images.length : 0);
      console.log('hasNewFiles:', hasNewFiles);
      console.log('hasRemovedImages:', hasRemovedImages);
      console.log('hasPhotoChanges:', hasPhotoChanges);
      console.log('========================');
      
      if (hasPhotoChanges) {
        // If media changed or images deleted, send as multipart/form-data
        const formData = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
          if (typeof v !== 'undefined' && v !== '') formData.append(k, v as any);
        });
        // Send list of images to keep (by url)
        const keepImagesData = JSON.stringify(existingImages.map(img => img.url));
        formData.append('keepImages', keepImagesData);
        
        console.log('=== FORMDATA DEBUG ===');
        console.log('keepImages data:', keepImagesData);
        console.log('mediaFiles to upload:', mediaFiles);
        
        mediaFiles.forEach((file, idx) => {
          console.log(`Adding file ${idx}:`, file.name, file.type, file.size);
          formData.append('media', file, file.name);
        });
        
        // Log all FormData entries
        Array.from(formData.entries()).forEach(pair => {
          console.log(pair[0] + ':', pair[1]);
        });
        console.log('=====================');
        
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        resp = await fetch(`${API_URL}/api/dogs/${dog._id}`, {
          method: 'PATCH',
          body: formData,
          headers
        });
        console.log('FormData response status:', resp.status); // Debug
      } else {
        // No media change, send as JSON
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
        console.log('JSON response status:', resp.status); // Debug
      }
      if (!resp.ok) {
        console.error('Response not ok:', resp.status, resp.statusText); // Debug
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update dog');
      }
      const updatedDog = await resp.json();
      console.log('=== UPDATE RESPONSE ===');
      console.log('Updated dog received from server:', updatedDog);
      console.log('Updated dog images count:', updatedDog.images ? updatedDog.images.length : 0);
      console.log('Updated dog images:', updatedDog.images);
      console.log('=====================');
      onSave(updatedDog);
      onClose();
    } catch (err: any) {
      console.error('Fetch error:', err); // Debug
      console.error('Update error:', err);
      setSubmitError(err.message || 'Failed to update dog');
    } finally {
      setSubmitting(false);
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
        // Only close if clicking the overlay background, not when clicking inside modal
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
          boxShadow: window.innerWidth > 768 ? '0 20px 60px rgba(0,0,0,0.5)' : 'none'
        }}
        onClick={e => e.stopPropagation()}
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
                setMediaFiles(files);
                setMediaPreviews(files.map(f => URL.createObjectURL(f)));
                // Clear existing images when new ones are selected
                if (files.length > 0) {
                  setExistingImages([]);
                }
              }}
            />
            {mediaPreviews.length > 0 && (
              <button 
                type="button" 
                onClick={() => {
                  setMediaFiles([]);
                  setMediaPreviews([]);
                  setExistingImages(dog.images ? [...dog.images] : []);
                }}
                className="editdog-reset-photos-btn"
              >
                {t('editdog.resetPhotos') || 'Reset Photos'}
              </button>
            )}
            {/* Show previews of new or current images */}
            {mediaPreviews.length > 0 ? (
              <div>
                <p style={{ margin: '0.5rem 0', color: '#e74c3c', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {t('editdog.newPhotos') || 'New photos selected (will replace existing):'}
                </p>
                <div className="media-preview-list">
                  {mediaPreviews.map((url, idx) => (
                    <img key={idx} src={url} alt={`preview-${idx}`} width={80} />
                  ))}
                </div>
              </div>
            ) : existingImages.length > 0 ? (
              <div>
                <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                  {t('editdog.currentPhotos') || 'Current photos:'}
                </p>
                <div className="media-preview-list">
                  {existingImages.map((img: any, idx: number) => (
                    <span key={idx} style={{ position: 'relative', display: 'inline-block', marginRight: 8 }}>
                      <img src={img.url} alt={`img-${idx}`} width={80} />
                      <button type="button" style={{ position: 'absolute', top: 0, right: 0, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, lineHeight: '22px', padding: 0 }} onClick={() => setExistingImages(existingImages.filter((_, i) => i !== idx))} title="Delete">&times;</button>
                                      <button type="button" className="editdog-delete-img-btn" onClick={() => setExistingImages(existingImages.filter((_, i) => i !== idx))} title="Delete">&times;</button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ margin: '0.5rem 0', color: '#999', fontSize: '0.9rem' }}>
                {t('editdog.noPhotos') || 'No photos selected'}
              </p>
            )}
          </div>
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
};

export default EditDogModal;
