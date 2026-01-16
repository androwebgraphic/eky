import React, { useState, useEffect, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AddDogFormData {
  name: string;
  breed: string;
  color?: string;
  location: string;
  age: number;
  description: string;
  size: 'small' | 'medium' | 'large';
  gender?: 'male' | 'female';
  vaccinated?: boolean;
  neutered?: boolean;
}

// Simple, reliable API URL for mobile
const API_URL = process.env.REACT_APP_API_URL ||
  (window.location.protocol === 'https:'
    ? `https://${window.location.hostname}`
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3001'
      : 'http://172.20.10.2:3001'));

const AdddogForm: React.FC = () => {
  const { t } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<AddDogFormData>({
    defaultValues: {
      vaccinated: false,
      neutered: false,
    }
  });
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  useEffect(() => {
    console.log('🔐 AddDogForm auth state:', { isAuthenticated, hasToken: !!token, tokenLength: token?.length });
    
    if (!isAuthenticated || !token) {
      console.warn('⚠️ User not authenticated, redirecting to login');
      navigate('/logiranje');
    }
  }, [isAuthenticated, token, navigate]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [smallPreview, setSmallPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [posterBlob, setPosterBlob] = useState<Blob | null>(null);

  // create poster image for a video file by capturing first frame in browser
  const createVideoPoster = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.src = url;
      // attempt to jump to 1s so a frame is available
      video.currentTime = 1;
      const cleanup = () => URL.revokeObjectURL(url);

      video.onloadeddata = function () {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          cleanup();
          if (blob) resolve(blob);
          else reject(new Error('Could not create poster'));
        }, 'image/jpeg', 0.8);
      };
      video.onerror = (e) => {
        cleanup();
        reject(e);
      };
    });
  };

  // create a small thumbnail for image preview (data URL)
  const createImageThumbnail = (file: File, size = 64): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = img.width / img.height || 1;
        let width = size;
        let height = Math.round(size / ratio);
        if (ratio < 1) {
          // portrait
          height = size;
          width = Math.round(size * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          return reject(new Error('Canvas not supported'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setMediaFile(f);

    // revoke previous object URL if necessary
    if (mediaPreview && mediaPreview.startsWith('blob:')) {
      try { URL.revokeObjectURL(mediaPreview); } catch (err) { /* ignore */ }
    }

    const url = URL.createObjectURL(f);
    setMediaPreview(url);

    if (f.type.startsWith('video/')) {
      setIsVideo(true);
      setSmallPreview(null);
      try {
        const poster = await createVideoPoster(f);
        setPosterBlob(poster);
      } catch (err) {
        console.warn('Could not create poster image', err);
      }
    } else {
      setIsVideo(false);
      try {
        const thumb = await createImageThumbnail(f, 64);
        setSmallPreview(thumb);
      } catch (err) {
        console.warn('Could not create thumbnail', err);
        setSmallPreview(null);
      }
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Cancel any pending fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const onSubmit: SubmitHandler<AddDogFormData> = async (fields) => {
    console.log('Form submit triggered with fields:', fields);
    
    // Basic validation
    if (!fields.name?.trim()) {
      setSubmitError(t('adddog.nameRequired'));
      return;
    }
    if (!fields.location?.trim()) {
      setSubmitError(t('adddog.locationRequired'));
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);

      console.log('Form data will be sent to:', API_URL);
      console.log('Current hostname:', window.location.hostname);
      console.log('Window location:', window.location.href);

      const formData = new FormData();
      formData.append('name', fields.name);
      if (fields.breed) formData.append('breed', fields.breed);
      if (fields.color) formData.append('color', fields.color);
      if (fields.age !== undefined) formData.append('age', String(fields.age));
      if (fields.description) formData.append('description', fields.description);
      if (fields.size) formData.append('size', fields.size);
      if (fields.location) formData.append('location', fields.location);

      // Always send boolean values for checkboxes
      formData.append('vaccinated', fields.vaccinated ? 'true' : 'false');
      formData.append('neutered', fields.neutered ? 'true' : 'false');

      if (mediaFile) {
        formData.append('media', mediaFile, mediaFile.name);
        if (posterBlob) {
          const posterFile = new File([posterBlob], 'poster.jpg', { type: 'image/jpeg' });
          formData.append('poster', posterFile, 'poster.jpg');
        }
      }

      console.log('Submitting to:', `${API_URL}/api/dogs`);
      console.log('Form data fields:', Object.fromEntries(formData.entries()));
      console.log('Media file present:', !!mediaFile);
      console.log('🔑 Token present:', !!token);
      console.log('🔑 Token value:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      abortControllerRef.current = new AbortController();
      
      const headers: any = {
        // Don't set Content-Type for FormData, let browser set it with boundary
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Authorization header set');
      } else {
        console.error('❌ NO TOKEN - Authorization header NOT set');
      }
      
      const resp = await fetch(`${API_URL}/api/dogs`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
        headers
      }).catch(async (firstError) => {
        // If initial fetch fails on mobile, try fallback URLs
        console.warn('First fetch failed, trying fallback:', firstError.message);
        
        const fallbackUrls = [
          'http://172.20.10.2:3001/api/dogs',  // Direct IP
          'http://localhost:3001/api/dogs'      // Localhost fallback
        ];
        
        for (const fallbackUrl of fallbackUrls) {
          try {
            console.log('Trying fallback URL:', fallbackUrl);
            const fallbackResp = await fetch(fallbackUrl, {
              method: 'POST',
              body: formData,
              signal: abortControllerRef.current.signal,
              headers
            });
            console.log('Fallback succeeded:', fallbackUrl);
            return fallbackResp;
          } catch (fallbackError) {
            console.warn('Fallback failed:', fallbackUrl, fallbackError.message);
          }
        }
        
        // If all fallbacks fail, throw the original error
        throw firstError;
      });

      if (!resp.ok) {
        // try to get JSON message
        let errMsg = `Upload failed with status ${resp.status} (${resp.statusText})`;
        console.error('Response not OK:', resp.status, resp.statusText);
        try {
          const body = await resp.json();
          console.error('Error body:', body);
          errMsg = body.message || JSON.stringify(body);
        } catch (e) {
          console.error('Could not parse error as JSON:', e);
          const txt = await resp.text();
          console.error('Error text:', txt);
          if (txt) errMsg = txt.substring(0, 200); // limit error message length
        }
        console.error('API error:', errMsg);
        setSubmitError(errMsg);
        throw new Error(errMsg);
      }

      // success → show confirmation and then go to list
      if (isMountedRef.current) {
        setSuccessMessage(t('adddog.added'));
        // keep message visible briefly before navigating
        setTimeout(() => { 
          if (isMountedRef.current) navigate('/psi'); 
        }, 1400);
      }
    } catch (err: any) {
      // Ignore abort errors (expected when component unmounts)
      if (err.name === 'AbortError') {
        console.log('Request was aborted (component unmounted)');
        return;
      }
      
      console.error('Add dog failed:', err);
      console.error('Error type:', err.name);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      
      let errorMessage = t('adddog.failed');
      if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      if (isMountedRef.current && !submitError) {
        setSubmitError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) setSubmitting(false);
    }
  };

  return (
    <main>
      <h2>{t('adddog.title')}</h2>
      {/* Temporary debug info */}
      <div style={{background: '#f0f0f0', padding: '8px', margin: '8px 0', fontSize: '11px', borderRadius: '4px'}}>
        <strong>Debug:</strong> API_URL = {API_URL} | hostname = {window.location.hostname}
      </div>
      
      <form id="adddog-form" onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="adddog-name">{t('adddog.name')}</label>
        <input type="text" id="adddog-name" name="name" autoComplete="name" placeholder={t('adddog.name')} {...register('name', { required: true })} />
        {errors.name && <div className="error" role="alert">{t('adddog.name')} is required</div> }

        <label htmlFor="adddog-breed">{t('adddog.breed')}</label>
        <input type="text" id="adddog-breed" name="breed" autoComplete="off" placeholder={t('adddog.breed')} {...register('breed')} />

        <label htmlFor="adddog-color">{t('adddog.color')}</label>
        <input type="text" id="adddog-color" name="color" autoComplete="off" placeholder={t('adddog.color')} {...register('color')} />

        <label htmlFor="adddog-location">{t('adddog.location')}</label>
        <input type="text" id="adddog-location" name="location" autoComplete="address-level2" placeholder={t('adddog.location')} {...register('location', { required: true })} />

        <label htmlFor="adddog-age">{t('adddog.age')}</label>
        <small>{t('adddogExtra.ageNote')}</small>
        <input type="number" id="adddog-age" name="age" autoComplete="off" placeholder={t('adddog.age')} step="0.1" {...register('age', { valueAsNumber: true })} />

        <label htmlFor="adddog-description">{t('adddog.description')}</label>
        <textarea id="adddog-description" name="description" rows={3} cols={30} autoComplete="off" placeholder={t('adddog.description')} {...register('description')} />

        <label htmlFor="adddog-size">{t('adddog.size')}</label>
        <select {...register('size')} id="adddog-size" name="size" autoComplete="off">
          <option value="small">{t('size.small')}</option>
          <option value="medium">{t('size.medium')}</option>
          <option value="large">{t('size.large')}</option>
        </select>

        <div id="gender">
          <label>{t('adddog.gender')}</label>
          <div className="gender-options">
            <label htmlFor="adddog-gender-male">
              <input type="radio" {...register('gender')} id="adddog-gender-male" name="gender" value="male" />
              <span>{t('gender.male')}</span>
            </label>
            <label htmlFor="adddog-gender-female">
              <input type="radio" {...register('gender')} id="adddog-gender-female" name="gender" value="female" />
              <span>{t('gender.female')}</span>
            </label>
          </div>
        </div>

        <div id="health">
          <label htmlFor="adddog-vaccinated">
            <span>{t('adddog.vaccinated')}</span>
            <input type="checkbox" {...register('vaccinated')} id="adddog-vaccinated" name="vaccinated" />
          </label>

          <label htmlFor="adddog-neutered">
            <span>{t('adddog.neutered')}</span>
            <input type="checkbox" {...register('neutered')} id="adddog-neutered" name="neutered" />
          </label>
        </div>

        <div id="media-upload">
          <label htmlFor="media">{t('adddog.media')}</label>
          <div className="media-input-row">
            <input type="file" accept="image/*,video/*" id="adddog-media" name="media" onChange={onFileChange} />
            {smallPreview && <img className="thumb-small" src={smallPreview} alt="thumb" />}
          </div>
          {mediaPreview && (
            <div id="media-preview">
              {isVideo ? (
                <div className="preview-wrap">
                  <video src={mediaPreview} controls width={150} poster={smallPreview || (posterBlob ? URL.createObjectURL(posterBlob) : undefined)}></video>
                  <button type="button" className="view-full" onClick={() => window.open(mediaPreview, '_blank')}>View full</button>
                </div>
              ) : (
                <div className="preview-wrap">
                  <img src={smallPreview || mediaPreview} alt="preview" />
                  <button type="button" className="view-full" onClick={() => window.open(mediaPreview, '_blank')}>View full</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting}>{submitting ? t('adddog.saving') : t('button.addDog')}</button>
          {submitError && <div className="error" role="alert">{submitError}</div>}
          {successMessage && <div className="notification success" role="status">{successMessage}</div>}
        </div>
      </form>
    </main>
  );
};

export default AdddogForm;
