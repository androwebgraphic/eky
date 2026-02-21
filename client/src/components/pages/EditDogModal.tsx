import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import '../../css/edit-modal.css';

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

// Portal container for modal
const modalRoot = document.getElementById('editdog-modal-root') || (() => {
  const root = document.createElement('div');
  root.id = 'editdog-modal-root';
  // Portal root should NOT block clicks - only modal overlay should
  root.style.position = 'absolute';
  root.style.top = '0';
  root.style.left = '0';
  root.style.zIndex = '0';
  root.style.pointerEvents = 'none';
  document.body.appendChild(root);
  return root;
})();

interface EditDogFormData {
  name: string;
  breed?: string;
  color?: string;
  location?: string;
  age?: number;
  ageCategory?: string;
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
}

const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  return `${protocol}//${hostname}:3001`;
};

  const getImageUrl = (url: string) => {
    if (!url) return '';
    // Handle absolute URLs (http:// or https://)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Handle absolute paths starting with /
    if (url.startsWith('/')) {
      return `${getApiUrl()}${url}`;
    }
    // Handle relative paths (uploads/, u/dogs/, etc.)
    return `${getApiUrl()}/${url.replace(/^\/+/, '')}`;
  };

  // Deduplicate images by base name
  const getImageBase = (url: string) => {
    let cleanUrl = url.split('?')[0];
    const filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
    
    let base = filename;
    
    // Remove file extension
    base = base.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    
    // Handle uploaded files: name-TIMESTAMP-HASH-SIZE -> name
    // Examples: doggy-1770420370994-1liy0v-320 -> doggy
    // Also handle: doggy-orig -> doggy
    if (base.includes('-') && !base.startsWith('pexels-')) {
      // Remove -orig suffix if present
      base = base.replace(/-orig$/, '');
      // Remove -TIMESTAMP-HASH-SIZE suffix (10-13 digit timestamp + 6 char hash + 3-4 digit size)
      const uploadedMatch = base.match(/^(.+?)-\d{10,13}-[a-z0-9]{6}-\d{3,4}$/);
      if (uploadedMatch) {
        base = uploadedMatch[1];
      }
    } else if (base.startsWith('pexels-')) {
      // Handle Pexels images: pexels-name-ID-TIMESTAMP-HASH-SIZE -> name-ID
      // Examples: pexels-anyela-malaga-341169564-18062006-1770420371422-qfmvmr-320 -> anyela-malaga-341169564-18062006
      // Also handle: pexels-name-ID-orig -> name-ID
      base = base.replace(/-orig$/, '');
      const pexelsMatch = base.match(/^pexels-(.+?)-\d+(-\d{10,13}-[a-z0-9]{6}-\d{3,4})?$/);
      if (pexelsMatch) {
        base = pexelsMatch[1];
      }
    }
    
    return base;
  };

function EditDogModal({ dog, onClose, onSave }: EditDogModalProps) {
  const isMounted = useRef(true);
  const { t } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EditDogFormData>({ defaultValues: dog });
  const headerHeight = isAuthenticated ? 60 : 120;
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  // Deduplicate images on mount and when dog changes
  const [uniqueImages, setUniqueImages] = useState<any[]>([]);
  useEffect(() => {
    console.log('[EDITDOG] useEffect triggered, dog.images:', dog.images?.length);
    if (dog.images && dog.images.length > 0) {
      console.log('[EDITDOG] First few images:', dog.images.slice(0, 3).map(img => ({ url: img.url, width: img.width })));
      const baseToImage = new Map();
      const allBases: string[] = [];
      dog.images.forEach((img: any) => {
        if (!img.url) {
          console.log('[EDITDOG] Skipping image with no url');
          return;
        }
        const url = getImageUrl(img.url);
        const base = getImageBase(img.url);
        allBases.push(base);
        console.log('[EDITDOG] Processing image:', { url, base, width: img.width });
        
        if (!baseToImage.has(base)) {
          baseToImage.set(base, img);
          console.log('[EDITDOG]   -> First occurrence, adding to Map');
        } else {
          // Keep one with larger width
          const existing = baseToImage.get(base);
          if ((img.width || 0) > (existing.width || 0)) {
            baseToImage.set(base, img);
            console.log('[EDITDOG]   -> Replacing with larger width');
          } else {
            console.log('[EDITDOG]   -> Skipping, smaller width');
          }
        }
      });
      const unique = Array.from(baseToImage.values());
      console.log('[EDITDOG] Total images:', dog.images.length, 'Unique images:', unique.length);
      console.log('[EDITDOG] All bases:', allBases);
      unique.forEach((img, idx) => {
        console.log('[EDITDOG] Unique image', idx, 'url:', getImageUrl(img.url), 'base:', getImageBase(img.url));
      });
      setUniqueImages(unique);
      // Set existingImages for API calls (keep all variants for server to delete properly)
      setExistingImages(dog.images ? [...dog.images] : []);
    } else {
      console.log('[EDITDOG] No images, clearing arrays');
      setUniqueImages([]);
      setExistingImages([]);
    }
  }, [dog.images]);
  const [selectedToDelete, setSelectedToDelete] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
          if (v !== undefined && v !== null && v !== '' && v !== 'null') {
            formData.append(k, v as any);
          }
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
          resp = await fetch(`${getApiUrl()}/api/dogs/${dog._id}`, {
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
          if (v !== undefined && v !== null && v !== '' && v !== 'null') {
            bodyData[k] = v;
          }
        });
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        resp = await fetch(`${getApiUrl()}/api/dogs/${dog._id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(bodyData)
        });
      }
      
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        console.error('[EDITDOG] Update failed:', errData);
        throw new Error(errData.message || 'Failed to update dog');
      }
      
      let updatedDog;
      try {
        updatedDog = await resp.json();
        console.log('[EDITDOG] Updated dog from response:', updatedDog);
      } catch (e) {
        console.error('[EDITDOG] Failed to parse response:', e);
        throw new Error('Failed to parse server response');
      }
      
      if (isMounted.current) {
        setMediaFiles([]);
        setMediaPreviews([]);
      }
      
      console.log('[EDITDOG] Calling onSave with updated dog:', updatedDog);
      if (isMounted.current) {
        try {
          onSave(updatedDog);
          console.log('[EDITDOG] onSave callback completed');
        } catch (saveError) {
          console.error('[EDITDOG] onSave callback error:', saveError);
          // Don't throw, just log and continue to close modal
        }
      }
      
      if (isMounted.current) {
        onClose();
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      console.error('[EDITDOG] Submit error:', err);
      if (mediaFiles.length > 0 && (err.message === 'Failed to fetch' || err.message === 'NetworkError when attempting to fetch resource.')) {
        setSubmitError('Failed to upload images. Please check your connection or try again.');
      } else {
        setSubmitError(err.message || 'Failed to update dog');
      }
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
      <div 
        className="edit-modal-overlay"
        style={{
          position: 'fixed',
          top: window.innerWidth > 768 ? '0' : '70px',
          left: '0',
          right: '0',
          bottom: window.innerWidth > 768 ? '0' : '170px',
          width: '100vw',
          height: window.innerWidth > 768 ? '100vh' : 'calc(100vh - 240px)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 2147483647,
          display: 'flex',
          alignItems: window.innerWidth > 768 ? 'center' : 'flex-start',
          justifyContent: 'center',
          padding: window.innerWidth > 768 ? '16px' : '0',
          boxSizing: 'border-box',
          pointerEvents: 'auto',
          overflow: 'hidden',
          overscrollBehavior: 'contain'
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
          borderRadius: window.innerWidth > 768 ? '12px' : '12px',
          padding: window.innerWidth > 768 ? '1.5rem' : '0.5rem',
          paddingTop: window.innerWidth > 768 ? '1.5rem' : '3rem',
          paddingBottom: window.innerWidth > 768 ? '1.5rem' : '0.5rem',
          width: window.innerWidth > 768 ? '85vw' : 'calc(90vw - 1rem)',
          maxWidth: window.innerWidth > 768 ? '550px' : 'calc(90vw - 1rem)',
          height: window.innerWidth > 768 ? 'auto' : 'calc(100vh - 260px)',
          maxHeight: window.innerWidth > 768 ? '90vh' : 'calc(100vh - 260px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          zIndex: 2147483647,
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          boxShadow: window.innerWidth > 768 ? '0 4px 24px rgba(0,0,0,0.2)' : '0 4px 24px rgba(0,0,0,0.3)'
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
          position: window.innerWidth <= 768 ? 'static' : 'static',
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
                // Validate file sizes (max 10MB per file)
                const maxSize = 10 * 1024 * 1024; // 10MB
                const oversizedFiles = files.filter(f => f.size > maxSize);
                if (oversizedFiles.length > 0) {
                  alert(`Some files are too large. Maximum size is 10MB per file.\n\nOversized files:\n${oversizedFiles.map(f => f.name).join('\n')}`);
                  return;
                }
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
            {uniqueImages.length > 0 && (
              <div>
                <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                  {t('editdog.currentPhotos') || 'Current photos:'}
                </p>
                <div className="media-preview-list">
                  {uniqueImages.map((img: any, idx: number) => (
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
                      <div style={{
                        width: window.innerWidth <= 768 ? 120 : 80,
                        height: window.innerWidth <= 768 ? 120 : 80,
                        borderRadius: 8,
                        marginTop: window.innerWidth <= 768 ? 12 : 0,
                        overflow: 'hidden',
                        display: 'block',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ddd'
                      }}>
                        <img 
                          src={getImageUrl(img.url)} 
                          alt={`img-${idx}`} 
                          style={{ 
                            width: '100%',
                            height: '100%',
                            opacity: selectedToDelete.has(idx) ? 0.5 : 1, 
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e: any) => {
                            console.error('[EDITDOG] Image load error:', {
                              src: getImageUrl(img.url),
                              originalUrl: img.url,
                              API_URL: getApiUrl(),
                              error: e,
                              imgWidth: img.width,
                              imgHeight: img.height
                            });
                            // Hide broken image
                            e.currentTarget.style.display = 'none';
                            // Show error in parent div
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerHTML = '<span style="color:red;font-size:10px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;padding:4px;">Failed<br/>to load</span>';
                            }
                          }}
                          onLoad={(e: any) => {
                            console.log('[EDITDOG] Image loaded successfully:', getImageUrl(img.url));
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        style={{ position: 'absolute', top: window.innerWidth <= 768 ? 8 : 2, right: window.innerWidth <= 768 ? 8 : 2, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: window.innerWidth <= 768 ? 32 : 20, height: window.innerWidth <= 768 ? 32 : 20, minWidth: window.innerWidth <= 768 ? 32 : 20, minHeight: window.innerWidth <= 768 ? 32 : 20, maxWidth: window.innerWidth <= 768 ? 32 : 20, maxHeight: window.innerWidth <= 768 ? 32 : 20, cursor: 'pointer', fontWeight: 'bold', fontSize: window.innerWidth <= 768 ? 22 : 14, lineHeight: window.innerWidth <= 768 ? '32px' : '20px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: window.innerWidth <= 768 ? '0 2px 8px rgba(0,0,0,0.12)' : 'none' }}
                        onClick={() => {
                          // Remove all variants of this image
                          const imgBase = getImageBase(uniqueImages[idx].url);
                          const newUniqueImages = uniqueImages.filter((img) => getImageBase(img.url) !== imgBase);
                          setUniqueImages(newUniqueImages);
                          // Remove all corresponding variants from existingImages
                          const newExistingImages = existingImages.filter((img) => getImageBase(img.url) !== imgBase);
                          setExistingImages(newExistingImages);
                          setSelectedToDelete(prev => {
                            const next = new Set(prev);
                            next.delete(idx);
                            return next;
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
                    <span style={{ fontWeight: 'bold', color: '#333', marginBottom: 2 }}>{t('editdog.imageActions') || 'Image actions:'}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}
                        disabled={selectedToDelete.size === 0}
                        onClick={() => {
                          // Remove all variants of selected images
                          const selectedImages = Array.from(selectedToDelete).map(idx => uniqueImages[idx]);
                          const basesToRemove = new Set(selectedImages.map(img => getImageBase(img.url)));
                          const newUniqueImages = uniqueImages.filter((img) => !basesToRemove.has(getImageBase(img.url)));
                          setUniqueImages(newUniqueImages);
                          const newExistingImages = existingImages.filter((img) => !basesToRemove.has(getImageBase(img.url)));
                          setExistingImages(newExistingImages);
                          setSelectedToDelete(new Set());
                        }}
                      >
                        {t('editdog.deleteSelected') || 'Delete Selected'}
                      </button>
                      <button
                        type="button"
                        style={{ background: '#e67e22', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => {
                          setUniqueImages([]);
                          setExistingImages([]);
                          setSelectedToDelete(new Set());
                        }}
                      >
                        {t('editdog.deleteAll') || 'Delete All'}
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
              autoFocus
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
                list="dog-breeds"
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
              <datalist id="dog-breeds">
                {DOG_BREEDS.map((breed) => (
                  <option key={breed} value={breed}>
                    {breed}
                  </option>
                ))}
              </datalist>
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
              <label htmlFor="editdog-age-category" style={{ fontWeight: 'bold' }}>{t('adddogExtra.ageCategory')}</label>
              <select 
                id="editdog-age-category"
                name="ageCategory"
                autoComplete="off"
                {...register('ageCategory')}
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
                <option value="">{t('adddogExtra.selectAgeCategory')}</option>
                <option value="0.5">{t('adddogExtra.ageCategory.puppy')}</option>
                <option value="2">{t('adddogExtra.ageCategory.youngAdult')}</option>
                <option value="5">{t('adddogExtra.ageCategory.adult')}</option>
                <option value="8.5">{t('adddogExtra.ageCategory.senior')}</option>
                <option value="11">{t('adddogExtra.ageCategory.seniorPlus')}</option>
              </select>
              <input type="hidden" {...register('age', { valueAsNumber: true })} />
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
            <style>{`
              .editdog-radio-input {
                -webkit-appearance: radio !important;
                -moz-appearance: radio !important;
                appearance: radio !important;
                width: 1.25rem !important;
                height: 1.25rem !important;
                min-width: 1.25rem !important;
                min-height: 1.25rem !important;
                cursor: pointer;
                margin: 0;
                border-radius: 50% !important;
              }
              .editdog-radio-input-male { accent-color: #1976d2; }
              .editdog-radio-input-female { accent-color: #e91e63; }
            `}</style>
            <div style={{ 
              display: 'flex',
              flexDirection: 'row',
              gap: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px solid #e9ecef'
            }}>
              <label htmlFor="editdog-gender-male" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
                <input 
                  id="editdog-gender-male"
                  type="radio" 
                  className="editdog-radio-input editdog-radio-input-male"
                  {...register('gender')} 
                  value="male"
                />
                <span>{t('gender.male')}</span>
              </label>
              <label htmlFor="editdog-gender-female" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
                <input 
                  id="editdog-gender-female"
                  type="radio" 
                  className="editdog-radio-input editdog-radio-input-female"
                  {...register('gender')} 
                  value="female"
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
              flexDirection: 'row',
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
              paddingBottom: window.innerWidth > 768 ? '2rem' : '1rem',
              position: 'static'
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
    </div>,
    modalRoot
  );
}

export default EditDogModal;