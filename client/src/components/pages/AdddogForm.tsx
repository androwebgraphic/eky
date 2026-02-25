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
  ageCategory?: string;
  description: string;
  size: 'small' | 'medium' | 'large';
  gender?: 'male' | 'female';
  vaccinated?: boolean;
  neutered?: boolean;
}

// Get API URL with proper fallbacks for mobile network access
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL !== undefined && process.env.REACT_APP_API_URL.trim() !== '') {
    return process.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  if (window.location.protocol === 'https:') {
    return `https://${hostname}`;
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  // For IP addresses (including mobile network access)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return `http://${hostname}:3001`;
  }
  // Fallback - use current protocol and hostname
  return `${window.location.protocol}//${hostname}:3001`;
};

// Media restriction constants
const MAX_VIDEO_DURATION_SECONDS = 30;

// Comprehensive list of dog breeds with "Mixed Breed" at the top
const DOG_BREEDS = [
  'Mixed Breed',
  'Afghan Hound',
  'Airedale Terrier',
  'Akita',
  'Alaskan Malamute',
  'American Bulldog',
  'American Cocker Spaniel',
  'American Eskimo Dog',
  'American Foxhound',
  'American Pit Bull Terrier',
  'American Staffordshire Terrier',
  'American Water Spaniel',
  'Anatolian Shepherd Dog',
  'Australian Cattle Dog',
  'Australian Kelpie',
  'Australian Shepherd',
  'Australian Terrier',
  'Basenji',
  'Basset Hound',
  'Beagle',
  'Bearded Collie',
  'Bedlington Terrier',
  'Belgian Malinois',
  'Belgian Sheepdog',
  'Belgian Tervuren',
  'Bernese Mountain Dog',
  'Bichon Frise',
  'Black and Tan Coonhound',
  'Bloodhound',
  'Border Collie',
  'Border Terrier',
  'Borzoi',
  'Boston Terrier',
  'Bouvier des Flandres',
  'Boxer',
  'Briard',
  'Brittany',
  'Brussels Griffon',
  'Bull Terrier',
  'Bulldog',
  'Bullmastiff',
  'Cairn Terrier',
  'Canaan Dog',
  'Cardigan Welsh Corgi',
  'Cavalier King Charles Spaniel',
  'Chesapeake Bay Retriever',
  'Chihuahua',
  'Chinese Crested',
  'Chinese Shar-Pei',
  'Chow Chow',
  'Clumber Spaniel',
  'Cocker Spaniel',
  'Collie',
  'Curly-Coated Retriever',
  'Dachshund',
  'Dalmatian',
  'Dandie Dinmont Terrier',
  'Doberman Pinscher',
  'Dogue de Bordeaux',
  'English Cocker Spaniel',
  'English Foxhound',
  'English Setter',
  'English Springer Spaniel',
  'English Toy Spaniel',
  'Field Spaniel',
  'Finnish Lapphund',
  'Finnish Spitz',
  'Flat-Coated Retriever',
  'French Bulldog',
  'German Pinscher',
  'German Shepherd Dog',
  'German Shorthaired Pointer',
  'German Wirehaired Pointer',
  'Giant Schnauzer',
  'Glen of Imaal Terrier',
  'Golden Retriever',
  'Gordon Setter',
  'Great Dane',
  'Great Pyrenees',
  'Greater Swiss Mountain Dog',
  'Greyhound',
  'Harrier',
  'Havanese',
  'Ibizan Hound',
  'Irish Setter',
  'Irish Terrier',
  'Irish Water Spaniel',
  'Irish Wolfhound',
  'Italian Greyhound',
  'Jack Russell Terrier',
  'Japanese Chin',
  'Keeshond',
  'Kerry Blue Terrier',
  'Komondor',
  'Kuvasz',
  'Labrador Retriever',
  'Lakeland Terrier',
  'Lhasa Apso',
  'Lowchen',
  'Maltese',
  'Manchester Terrier',
  'Mastiff',
  'Miniature Bull Terrier',
  'Miniature Pinscher',
  'Miniature Schnauzer',
  'Neapolitan Mastiff',
  'Newfoundland',
  'Norfolk Terrier',
  'Norwegian Buhund',
  'Norwegian Elkhound',
  'Norwegian Lundehund',
  'Norwich Terrier',
  'Nova Scotia Duck Tolling Retriever',
  'Old English Sheepdog',
  'Otterhound',
  'Papillon',
  'Parson Russell Terrier',
  'Pekingese',
  'Pembroke Welsh Corgi',
  'Pharaoh Hound',
  'Plott',
  'Pointer',
  'Pomeranian',
  'Poodle',
  'Portuguese Water Dog',
  'Pug',
  'Puli',
  'Pyrenean Shepherd',
  'Rhodesian Ridgeback',
  'Rottweiler',
  'Saint Bernard',
  'Saluki',
  'Samoyed',
  'Schipperke',
  'Scottish Deerhound',
  'Scottish Terrier',
  'Sealyham Terrier',
  'Shetland Sheepdog',
  'Shiba Inu',
  'Shih Tzu',
  'Siberian Husky',
  'Silky Terrier',
  'Skye Terrier',
  'Smooth Fox Terrier',
  'Soft Coated Wheaten Terrier',
  'Spanish Water Dog',
  'Spinone Italiano',
  'St. Bernard',
  'Staffordshire Bull Terrier',
  'Standard Schnauzer',
  'Sussex Spaniel',
  'Swedish Vallhund',
  'Tibetan Mastiff',
  'Tibetan Spaniel',
  'Tibetan Terrier',
  'Toy Fox Terrier',
  'Vizsla',
  'Weimaraner',
  'Welsh Springer Spaniel',
  'Welsh Terrier',
  'West Highland White Terrier',
  'Whippet',
  'Wire Fox Terrier',
  'Wirehaired Pointing Griffon',
  'Yorkshire Terrier'
];

const AdddogForm: React.FC = () => {
  const { t } = useTranslation();
  const { token, isAuthenticated, user } = useAuth();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AddDogFormData>({
    defaultValues: {
      vaccinated: false,
      neutered: false,
    }
  });
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // State for form status
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for media handling
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [smallPreview, setSmallPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [posterBlob, setPosterBlob] = useState<Blob | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  // Check if user is superadmin
  const isSuperAdmin = user?.role === 'superadmin';

  // Watch age category changes
  const watchAgeCategory = watch('ageCategory');

  // Update age when category is selected
  useEffect(() => {
    if (watchAgeCategory) {
      const ageValue = parseFloat(watchAgeCategory);
      if (!isNaN(ageValue)) {
        setValue('age', ageValue);
      }
    }
  }, [watchAgeCategory, setValue]);

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
      // Cancel any pending fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper: Get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;

      video.onloadedmetadata = function () {
        URL.revokeObjectURL(url);
        resolve(video.duration);
      };
      video.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load video metadata'));
      };
    });
  };

  // Helper: create poster image for a video file
  const createVideoPoster = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.src = url;
      video.currentTime = 1; // Attempt to jump to 1s

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

  // Helper: create a small thumbnail for image preview
  const createImageThumbnail = (file: File, size = 64): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = img.width / img.height || 1;
        let width = size;
        let height = Math.round(size / ratio);
        if (ratio < 1) {
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

    // Reset previous states
    setMediaError(null);
    setVideoDuration(null);
    setPosterBlob(null);
    
    // For non-superadmin users, validate media restrictions
    if (!isSuperAdmin) {
      if (f.type.startsWith('video/')) {
        try {
          const duration = await getVideoDuration(f);
          setVideoDuration(duration);
          if (duration > MAX_VIDEO_DURATION_SECONDS) {
            setMediaError(`Video duration cannot exceed ${MAX_VIDEO_DURATION_SECONDS} seconds. Your video is ${Math.round(duration)} seconds.`);
            return;
          }
        } catch (err) {
          console.warn('Could not get video duration', err);
        }
      }
    }

    setMediaFile(f);

    // Revoke previous object URLs to avoid memory leaks
    if (mediaPreview && mediaPreview.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreview);
    }
    if (smallPreview && smallPreview.startsWith('blob:')) {
      URL.revokeObjectURL(smallPreview);
    }

    // Create main preview URL
    const url = URL.createObjectURL(f);
    setMediaPreview(url);

    const videoCheck = f.type.startsWith('video/');
    setIsVideo(videoCheck);

    // Generate thumbnails/posters
    if (videoCheck) {
      try {
        const poster = await createVideoPoster(f);
        setPosterBlob(poster);
        // Create a local URL for the poster blob for UI display
        const posterUrl = URL.createObjectURL(poster);
        setSmallPreview(posterUrl);
      } catch (err) {
        console.error('Error generating video poster:', err);
        setSmallPreview(null);
      }
    } else {
      try {
        // For images, create a base64 thumbnail
        const thumb = await createImageThumbnail(f);
        setSmallPreview(thumb);
      } catch (err) {
        console.error('Error generating image thumbnail:', err);
        setSmallPreview(null);
      }
    }
  };

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
    if (!mediaFile) {
      setMediaError(t('adddog.mediaRequired') || 'Image is required');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const formData = new FormData();
      formData.append('name', fields.name);
      if (fields.breed) formData.append('breed', fields.breed);
      if (fields.color) formData.append('color', fields.color);
      if (fields.age !== undefined) formData.append('age', String(fields.age));
      if (fields.description) formData.append('description', fields.description);
      if (fields.size) formData.append('size', fields.size);
      if (fields.location) formData.append('location', fields.location);

      formData.append('vaccinated', fields.vaccinated ? 'true' : 'false');
      formData.append('neutered', fields.neutered ? 'true' : 'false');

      if (mediaFile) {
        formData.append('media', mediaFile, mediaFile.name);
        if (posterBlob) {
          const posterFile = new File([posterBlob], 'poster.jpg', { type: 'image/jpeg' });
          formData.append('poster', posterFile, 'poster.jpg');
        }
      }

      const apiUrl = getApiUrl();
      console.log('Submitting to:', `${apiUrl}/api/dogs`);

      abortControllerRef.current = new AbortController();

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const resp = await fetch(`${apiUrl}/api/dogs`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
        headers
      });

      if (!resp.ok) {
        let errMsg = `Upload failed with status ${resp.status} (${resp.statusText})`;
        try {
          const body = await resp.json();
          // Prefer the 'error' field which contains the actual error message
          errMsg = body.error || body.message || JSON.stringify(body);
          console.error('[ADD DOG ERROR] Server response:', body);
        } catch (e) {
          const txt = await resp.text();
          if (txt) {
            console.error('[ADD DOG ERROR] Server text response:', txt);
            errMsg = txt.substring(0, 200);
          }
        }
        throw new Error(errMsg);
      }

      if (isMountedRef.current) {
        setSuccessMessage(t('adddog.added'));
        setTimeout(() => {
          if (isMountedRef.current) navigate('/psi');
        }, 1400);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Request was aborted (component unmounted)');
        return;
      }

      console.error('Add dog failed:', err);
      let errorMessage = t('adddog.failed');
      if (err.message) {
        errorMessage += `: ${err.message}`;
      }

      if (isMountedRef.current) {
        setSubmitError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) setSubmitting(false);
    }
  };

  return (
    <main>
      <h2>{t('adddog.title')}</h2>

      <form id="adddog-form" onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="adddog-name">{t('adddog.name')}</label>
        <input type="text" id="adddog-name" name="name" autoComplete="name" placeholder={t('adddog.name')} autoFocus {...register('name', { required: true })} />
        {errors.name && <div className="error" role="alert">{t('adddog.name')} is required</div>}

        <label htmlFor="breed">{t('fields.breed')}</label>
        <select 
          id="breed" 
          name="breed" 
          autoComplete="off" 
          className="breed-select"
          style={{ maxWidth: '150px', width: 'auto', position: 'relative', zIndex: 9999 }}
          {...register('breed')} 
        >
          <option value="">{t('fields.breed')}</option>
          {DOG_BREEDS.map((breed) => (
            <option key={breed} value={breed}>
              {breed}
            </option>
          ))}
        </select>

        <label htmlFor="adddog-color">{t('adddog.color')}</label>
        <input type="text" id="adddog-color" name="color" autoComplete="off" placeholder={t('adddog.color')} {...register('color')} />

        <label htmlFor="adddog-location">{t('adddog.location')}</label>
        <input type="text" id="adddog-location" name="location" autoComplete="address-level2" placeholder={t('adddog.location')} {...register('location', { required: true })} />

        <label htmlFor="adddog-age-category">{t('adddogExtra.ageCategory')}</label>
        <select {...register('ageCategory')} id="adddog-age-category" name="ageCategory" autoComplete="off" style={{ marginBottom: '8px', maxWidth: '150px', width: 'auto', position: 'relative', zIndex: 9999 }}>
          <option value="">{t('adddogExtra.selectAgeCategory')}</option>
          <option value="0.5">{t('adddogExtra.ageCategory.puppy')}</option>
          <option value="2">{t('adddogExtra.ageCategory.youngAdult')}</option>
          <option value="5">{t('adddogExtra.ageCategory.adult')}</option>
          <option value="8.5">{t('adddogExtra.ageCategory.senior')}</option>
          <option value="11">{t('adddogExtra.ageCategory.seniorPlus')}</option>
        </select>
        <input type="hidden" {...register('age', { valueAsNumber: true })} />

        <label htmlFor="adddog-description">{t('adddog.description')}</label>
        <textarea id="adddog-description" name="description" rows={3} cols={30} autoComplete="off" placeholder={t('adddog.description')} {...register('description')} />

        <label htmlFor="adddog-size">{t('adddog.size')}</label>
        <select {...register('size')} id="adddog-size" name="size" autoComplete="off" style={{ maxWidth: '150px', width: 'auto', position: 'relative', zIndex: 9999 }}>
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
          {mediaError && <div className="error" role="alert" style={{ color: 'red', marginTop: 4 }}>{mediaError}</div>}
          {mediaPreview && (
            <div id="media-preview">
              {isVideo ? (
                <div className="preview-wrap">
                  <video src={mediaPreview} controls width={150} poster={smallPreview || undefined}></video>
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