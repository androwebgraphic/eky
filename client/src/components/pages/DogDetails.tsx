import React, { useState } from 'react';
import DogImageSlider from '../DogImageSlider';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import '../../css/modal.css';
import { useAuth } from '../../contexts/AuthContext';
import { useMapModal } from '../../contexts/MapModalContext';
import { getApiUrl } from '../../utils/apiUrl';


interface MediaVariant { url: string; width?: number; size?: string }
export interface DogDetailsProps {
  _id?: string;
  name: string;
  breed?: string;
  age?: number;
  images?: MediaVariant[];
  video?: { url: string; poster?: MediaVariant[] };
  thumbnail?: MediaVariant;
  color?: string;
  place?: string;
  location?: string;
  description?: string;
  size?: string;
  gender?: 'male' | 'female';
  vaccinated?: boolean;
  neutered?: boolean;
  onClose?: () => void;
  user?: {
    _id: string;
    name: string;
    username?: string;
    email?: string;
    phone?: string;
    person?: 'private' | 'organization';
  };
  adoptionStatus?: string;
  adoptionQueue?: any;
  onDogUpdate?: (update: any) => void;
  onDogChanged?: () => void;
  onEdit?: (dog: DogDetailsProps) => void;
  createdAt?: string;
  coordinates?: {
    type?: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
}

const DogDetails: React.FC<DogDetailsProps & { _showMap?: boolean }> = ({
  _id, name, breed, age, images, video, thumbnail, color, place, location, description, size, gender, vaccinated, neutered, onClose, user: owner,
  adoptionStatus, adoptionQueue, onDogUpdate, onDogChanged, onEdit, createdAt, _showMap, coordinates
}) => {
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { user: currentUser, isAuthenticated, isInWishlist, addToWishlist, removeFromWishlist } = useAuth();
  const { showMap: showMapModal, hideMap: hideMapModal } = useMapModal();
  const buttonsContainerRef = React.useRef<HTMLDivElement>(null);

  // Force grid layout on mobile using DOM manipulation
  React.useEffect(() => {
    if (buttonsContainerRef.current && typeof window !== 'undefined') {
      const container = buttonsContainerRef.current;
      const isMobile = window.innerWidth < 1024;
      
      console.log('[DOG DETAILS DEBUG] Buttons container:', {
        exists: !!container,
        className: container.className,
        computedDisplay: window.getComputedStyle(container).display,
        computedVisibility: window.getComputedStyle(container).visibility,
        computedOpacity: window.getComputedStyle(container).opacity,
        isMobile,
        parent: container.parentElement?.className,
      });
      
      if (isMobile) {
        // Directly set styles on the DOM element
        container.style.setProperty('display', 'grid', 'important');
        container.style.setProperty('grid-template-columns', '1fr 1fr', 'important');
        container.style.setProperty('gap', '12px', 'important');
        container.style.setProperty('width', '100%', 'important');
        container.style.setProperty('flex-direction', 'unset', 'important');
        container.style.setProperty('flex-wrap', 'unset', 'important');
        container.style.setProperty('justify-content', 'unset', 'important');
        
        console.log('[DOG DETAILS DEBUG] Applied mobile styles to buttons container');
      } else {
        // Reset to allow CSS to handle desktop
        container.style.removeProperty('display');
        container.style.removeProperty('grid-template-columns');
        container.style.removeProperty('gap');
        container.style.removeProperty('flex-direction');
        container.style.removeProperty('flex-wrap');
        container.style.removeProperty('justify-content');
      }
    }
  }, []);

  // Handle scroll indicator visibility
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isMobile = window.innerWidth < 1024;
    if (!isMobile) return;
    
    let isSetup = false;
    
    const setupScrollIndicator = () => {
      // Find the modal content element
      const modalContent = document.querySelector('.doglist-details-content') as HTMLElement;
      if (!modalContent) return;
      
      // Prevent duplicate setup
      if (isSetup) return;
      isSetup = true;
      
      const updateScrollIndicator = () => {
        const scrollTop = modalContent.scrollTop;
        const clientHeight = modalContent.clientHeight;
        const scrollHeight = modalContent.scrollHeight;
        
        // Check if content is already fully visible without scrolling
        const isContentFullyVisible = scrollHeight <= clientHeight;
        
        // Check if user has scrolled near the bottom
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
        const hasScrolledDown = scrollTop > 50; // User has scrolled down
        
        // Hide indicator if:
        // 1. Content is already fully visible (no scroll needed), OR
        // 2. User has scrolled down and is now at bottom
        const shouldHide = isContentFullyVisible || (hasScrolledDown && isAtBottom);
        
        // Toggle class on modal content
        if (shouldHide) {
          modalContent.classList.add('scrolled-to-bottom');
        } else {
          modalContent.classList.remove('scrolled-to-bottom');
        }
      };
      
      // Initial check with small delay to ensure layout is complete
      setTimeout(updateScrollIndicator, 50);
      
      // Handle scroll events
      modalContent.addEventListener('scroll', updateScrollIndicator);
      
      // Also check on resize in case modal content size changes
      const resizeObserver = new ResizeObserver(() => {
        updateScrollIndicator();
      });
      resizeObserver.observe(modalContent);
      
      // Return cleanup function
      return () => {
        modalContent.removeEventListener('scroll', updateScrollIndicator);
        resizeObserver.disconnect();
      };
    };
    
    // Watch for modal content to appear using MutationObserver
    const observer = new MutationObserver(() => {
      if (!isSetup) {
        setupScrollIndicator();
      }
    });
    
    // Observe the body for modal content appearing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Try immediate setup in case modal is already rendered
    setupScrollIndicator();
    
    // Also try with increasing delays as fallbacks
    setTimeout(setupScrollIndicator, 100);
    setTimeout(setupScrollIndicator, 300);
    setTimeout(setupScrollIndicator, 500);
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Use centralized API URL utility
  const apiBase = getApiUrl();
  
  // Safely check if current user is the owner
  // If owner data is missing or incomplete, assume NOT owner to allow buttons to show
  const isOwner = !!(
    currentUser && 
    owner && 
    typeof owner._id === 'string' && 
    typeof currentUser._id === 'string' &&
    currentUser._id === owner._id
  );
  
  // DEBUG: Log context and props to diagnose button visibility
  console.log('[DogDetails DEBUG] currentUser:', currentUser);
  console.log('[DogDetails DEBUG] owner:', owner);
  console.log('[DogDetails DEBUG] owner._id:', owner?._id);
  console.log('[DogDetails DEBUG] currentUser._id:', currentUser?._id);
  console.log('[DogDetails DEBUG] isOwner:', isOwner);
  console.log('[DogDetails DEBUG] isAuthenticated:', isAuthenticated);
  console.log('[DogDetails DEBUG] _id:', _id);
  console.log('[DogDetails DEBUG] shouldShowButtons:', isAuthenticated && _id && !isOwner);

  const handleWishlistToggle = async () => {
    if (!_id || !isAuthenticated) {
      alert('Please log in to add dogs to your wishlist');
      return;
    }

    const currentlyInWishlist = isInWishlist(_id);
    if (currentlyInWishlist) {
      const result = await removeFromWishlist(_id);
      if (result.success) {
        alert('Removed from wishlist!');
      } else {
        alert('Failed to remove from wishlist: ' + (result.error || 'Unknown error'));
      }
    } else {
      const result = await addToWishlist(_id);
      if (result.success) {
        alert('Added to wishlist! ❤️');
      } else {
        alert('Failed to add to wishlist: ' + (result.error || 'Unknown error'));
      }
    }
  };

  // Adoption state
  const [adoptionStatusState, setAdoptionStatus] = useState<string | undefined>(adoptionStatus);
  const [adoptionQueueState, setAdoptionQueue] = useState<any>(adoptionQueue);
  const [adoptLoading, setAdoptLoading] = useState(false);
  const [adoptError, setAdoptError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [isPerformingAction, setIsPerformingAction] = useState(false); // Flag to prevent state overwrite during actions

  // Reset state when dog changes (only when _id changes, not when adoptionStatus/adoptionQueue change from props)
  React.useEffect(() => {
    // Don't reset state if we're in the middle of performing an action
    if (!isPerformingAction) {
      setAdoptionStatus(adoptionStatus);
      setAdoptionQueue(adoptionQueue);
      setAdoptLoading(false);
      setAdoptError(null);
      setCancelReason('');
      setCancelLoading(false);
      setCancelError(null);
      setCancelSuccess(false);
      console.log('[DogDetails] Reset state for dog:', _id);
    }
  }, [_id, isPerformingAction]);

  // Listen for dog updates from Socket.IO (via ChatApp window events)
  React.useEffect(() => {
    const handleDogUpdated = (event: Event) => {
      console.log('[DogDetails] dogUpdated event received');
      console.log('[DogDetails] Current dog ID:', _id);
      // Refetch dog data to get latest status
      if (_id) {
        const headers: Record<string, string> = {};
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        fetch(`${apiBase}/api/dogs/${_id}`, { headers })
          .then(res => {
            if (res.status === 404) {
              // Dog was deleted (adopted)
              console.log('[DogDetails] Dog deleted (adopted)');
              setAdoptionStatus('adopted');
              setAdoptionQueue(null);
              if (onDogUpdate) onDogUpdate({ _id, adoptionStatus: 'adopted' });
              if (onDogChanged) onDogChanged();
              if (onClose) setTimeout(() => onClose(), 500);
              return null;
            }
            return res.json();
          })
          .then(data => {
            if (data) {
              console.log('[DogDetails] Updated dog data:', data);
              setAdoptionStatus(data.adoptionStatus);
              setAdoptionQueue(data.adoptionQueue);
              if (onDogUpdate) onDogUpdate(data);
              if (onDogChanged) onDogChanged();
            }
          })
          .catch(err => {
            console.error('[DogDetails] Failed to fetch updated dog:', err);
          });
      }
    };

    // Listen for custom dogUpdated event
    window.addEventListener('dogUpdated', handleDogUpdated);

    return () => {
      window.removeEventListener('dogUpdated', handleDogUpdated);
    };
  }, [_id, apiBase, onDogUpdate, onDogChanged, onClose]);

  // Odustani handler
  const handleCancelAdoption = async () => {
    if (!_id) return;
    setCancelLoading(true);
    setCancelError(null);
    setCancelSuccess(false);
    try {
      const resp = await fetch(`${apiBase}/api/dogs/${_id}/adopt-cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setCancelError(data.message || 'Error');
        throw new Error(data.message || 'Error');
      }
      setCancelSuccess(true);
      setAdoptionStatus(data.dog?.adoptionStatus || 'available');
      setAdoptionQueue(data.dog?.adoptionQueue);
      setCancelReason('');
      if (onDogUpdate && data.dog) onDogUpdate(data.dog);
      if (onDogChanged) onDogChanged();
      // Force state refresh after cancel - wait a bit for the update to propagate
      setTimeout(() => {
        setAdoptionStatus(data.dog?.adoptionStatus || 'available');
        setAdoptionQueue(data.dog?.adoptionQueue);
        setCancelSuccess(false);
      }, 100);
    } catch (e: any) {
      setCancelError(e.message || 'Error');
    } finally {
      setCancelLoading(false);
    }
  };

  // Optionally: fetch status from props if available

  const handleAdopt = async () => {
    if (!_id) return;
    // Open chat with the dog owner and notify ChatApp to set adoptionDogId
    if (owner && owner._id) {
      window.dispatchEvent(new CustomEvent('openChatModal', { detail: { userId: owner._id } }));
    }
    window.dispatchEvent(new CustomEvent('dog-adopt-initiate', { detail: { dogId: _id } }));
    setAdoptLoading(true);
    setAdoptError(null);
    try {
      const resp = await fetch(`${apiBase}/api/dogs/${_id}/adopt-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        }
      });
      const data = await resp.json();
      if (!resp.ok) {
        setAdoptError(data.message || 'Error');
        throw new Error(data.message || 'Error');
      }
      setAdoptionStatus(data.dog.adoptionStatus);
      setAdoptionQueue(data.dog.adoptionQueue);
      if (onDogUpdate && data.dog) onDogUpdate(data.dog);
      if (onDogChanged) onDogChanged();
      // Force state refresh after adoption
      setAdoptionStatus(data.dog?.adoptionStatus);
      setAdoptionQueue(data.dog?.adoptionQueue);
                        } catch (e: any) {
                          setAdoptError(e.message || 'Error');
                        } finally {
                          setAdoptLoading(false);
                          setIsPerformingAction(false);
                        }
  };

  // Prepare images for DogImageSlider (always use largest available, prefer 1024px, always pass full Cloudinary URL)
  // Deduplicate images by base name (ignore size/hash/extension variants)
  const sliderImages: { url: string; width?: number }[] = React.useMemo(() => {
    const getImageBase = (url: string) => {
      let cleanUrl = url.split('?')[0];
      const filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
      
      let base = filename;
      
      // Remove file extension FIRST
      base = base.replace(/\.(jpg|jpeg|png|webp)$/i, '');
      
      // Handle uploaded files: name-TIMESTAMP-HASH-SIZE -> name or name-INDEX-SIZE -> name
      // Examples from updateDog: doggy-1770420370994-1liy0v-320 -> doggy
      // Examples from createDog: img-0-320 -> img, img-0-orig -> img
      // Also handle: doggy-orig -> doggy
      if (base.includes('-') && !base.startsWith('pexels-')) {
        // Handle createDog format: img-INDEX-SIZE (e.g., img-0-320) or img-INDEX-orig (e.g., img-0-orig)
        // Test for -orig FIRST (before testing general pattern)
        if (base.endsWith('-orig')) {
          base = base.replace(/-orig$/, '');
          // For updateDog format: remove -TIMESTAMP-HASH pattern if present
          // e.g., "img-0-1774876786338-6qmali" -> "img-0"
          const origMatch = base.match(/^(.+?)-\d{10,13}-[a-z0-9]{6}$/);
          if (origMatch) {
            base = origMatch[1];
          }
          // NOTE: Don't remove trailing -INDEX here, as we want to keep "img-0" for both formats
        } else {
          // Test for img-INDEX-SIZE pattern (e.g., "img-0-320")
          const createDogMatch = base.match(/^(.+?)-\d+-\d{3,4}$/);
          if (createDogMatch) {
            const baseWithoutIndex = createDogMatch[1];
            base = baseWithoutIndex;
          } else {
            // Handle updateDog format: name-TIMESTAMP-HASH-SIZE or name-TIMESTAMP-HASH-orig
            // First remove -orig suffix if present
            base = base.replace(/-orig$/, '');
            // Then remove -TIMESTAMP-HASH-SIZE suffix (10-13 digit timestamp + 6 char hash + 3-4 digit size)
            const uploadedMatch = base.match(/^(.+?)-\d{10,13}-[a-z0-9]{6}-\d{3,4}$/);
            if (uploadedMatch) {
              base = uploadedMatch[1];
            }
          }
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
    if (images && images.length > 0) {
      const validImages = images.filter(img => img && img.url && typeof img.url === 'string' && img.url.trim() !== '');
      
      // Deduplicate FIRST before URL transformation
      const baseToImage = new Map();
      validImages.forEach(img => {
        const base = getImageBase(img.url);
        console.log(`[DOG DETAILS] Processing image: url="${img.url}", width=${img.width}, extractedBase="${base}"`);
        if (!baseToImage.has(base)) {
          baseToImage.set(base, img);
          console.log(`[DOG DETAILS] Added to map with base="${base}"`);
        } else {
          // Keep the one with larger width
          const existing = baseToImage.get(base);
          console.log(`[DOG DETAILS] Duplicate base="${base}", current width=${img.width}, existing width=${existing.width}`);
          if ((img.width || 0) > (existing.width || 0)) {
            baseToImage.set(base, img);
            console.log(`[DOG DETAILS] Replaced with higher resolution image`);
          }
        }
      });
      
      const uniqueImages = Array.from(baseToImage.values());
      console.log('[DOG DETAILS] Total images:', validImages.length, 'Unique images:', uniqueImages.length);
      uniqueImages.forEach((img, idx) => {
        console.log(`[DOG DETAILS] Unique image ${idx}: url="${img.url}", base="${getImageBase(img.url)}", width=${img.width}`);
      });
      
      // NOW convert to absolute URLs
      const toAbs = (u?: string) => {
        if (!u) return u;
        // Remove any existing cache buster to prevent OpaqueResponseBlocking
        let cleanUrl = u.split('?')[0];
        if (/^https?:\/\//.test(cleanUrl)) return cleanUrl;
        if (cleanUrl.startsWith('/u/dogs/') || cleanUrl.startsWith('/uploads/')) return apiBase + cleanUrl;
        if (cleanUrl.startsWith('u/dogs/') || cleanUrl.startsWith('uploads/')) return apiBase + '/' + cleanUrl;
        return apiBase + '/' + cleanUrl.replace(/^\/+/,'');
      };
      
      // Sort by width descending and convert to absolute URLs
      const sorted = [...uniqueImages].sort((a, b) => (b.width || 0) - (a.width || 0));
      
      // Final deduplication by URL (in case cache-busting creates duplicates)
      const seenUrls = new Set();
      const finalImages = [];
      for (const img of sorted) {
        const urlWithoutCache = img.url.split('?')[0];
        if (!seenUrls.has(urlWithoutCache)) {
          seenUrls.add(urlWithoutCache);
          finalImages.push({ url: toAbs(img.url), width: img.width });
        }
      }
      
      console.log('[DOG DETAILS] Final slider images count:', finalImages.length);
      return finalImages;
    } else if (thumbnail && thumbnail.url) {
      const toAbs = (u?: string) => {
        if (!u) return u;
        // Remove any existing cache buster to prevent OpaqueResponseBlocking
        let cleanUrl = u.split('?')[0];
        if (/^https?:\/\//.test(cleanUrl)) return cleanUrl;
        if (cleanUrl.startsWith('/u/dogs/') || cleanUrl.startsWith('/uploads/')) return apiBase + cleanUrl;
        if (cleanUrl.startsWith('u/dogs/') || cleanUrl.startsWith('uploads/')) return apiBase + '/' + cleanUrl;
        return apiBase + '/' + cleanUrl.replace(/^\/+/,'');
      };
      return [{ url: toAbs(thumbnail.url) }];
    }
    return [];
  }, [images, thumbnail, apiBase]);

  // Show map with coordinates
  const handleShowMap = () => {
    if (!location) return;
    
    console.log('[DogDetails] handleShowMap called with coordinates:', coordinates);
    console.log('[DogDetails] location:', location);
    console.log('[DogDetails] place:', place);
    
    // Use stored coordinates if available and NOT [0, 0] (default value)
    if (coordinates && coordinates.coordinates && coordinates.coordinates.length === 2) {
      // GeoJSON format: [longitude, latitude]
      const [lng, lat] = coordinates.coordinates;
      // Skip [0, 0] coordinates (default value, not geocoded yet)
      if (lat === 0 && lng === 0) {
        console.log('[DogDetails] Coordinates are [0, 0], skipping and using geocoding');
      } else {
        const mapCoords = { lat, lng };
        console.log('[DogDetails] Using stored coordinates:', mapCoords);
        setCoords(mapCoords);
        showMapModal(location, place, mapCoords);
        return;
      }
    }
    
    // Fall back to geocoding if no stored coordinates
    setLoadingCoords(true);
    setCoordsError(null);
    const query = location.trim();
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1&extratags=1`, {
      headers: {
        'User-Agent': 'EkyApp/1.0'
      }
    })
    .then(resp => resp.json())
    .then(data => {
      console.log('Geocoding response for', query, data);
      if (data && data.length > 0) {
        const result = data[0];
        const mapCoords = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
        setCoords(mapCoords);
        showMapModal(location, place, mapCoords);
      } else {
        showMapModal(location, place, undefined);
        setCoordsError(t('dogDetails.approximateLocation'));
      }
    })
    .catch(e => {
      console.error('Geocoding error:', e);
      showMapModal(location, place, undefined);
      setCoordsError(t('dogDetails.searchBasedLocation'));
    })
    .finally(() => {
      setLoadingCoords(false);
    });
  };

  return (
    <>
      <div className="card-details">
      <div className="img">
        {sliderImages.length > 0 && (
          <DogImageSlider images={sliderImages} alt={name} />
        )}
      </div>
      <div className="description">
        <h3 style={{ color: '#c44a0b', textAlign: 'center', fontSize: 28 }}>
          {name}
        </h3>
        {breed && (
          <p className="meta">
            <strong>{t('fields.breed')}</strong> {breed}
          </p>
        )}
        {gender && (
          <p className="meta">
            <strong>{t('fields.gender')}</strong> {t(`gender.${gender}`) || gender}
          </p>
        )}
        {age && (
          <p className="meta">
            <strong>{t('fields.age')}</strong> {age} {t('dogDetails.ageSuffix')}
          </p>
        )}
        {(place || location) && (
          <p className="meta">
            <strong>{t('fields.location')}</strong>
            <span
              style={{ cursor: location ? 'pointer' : 'default', textDecoration: location ? 'underline' : 'none' }}
              onClick={location ? handleShowMap : undefined}
            >
              {place || location || ''}
            </span>
            {loadingCoords && <span style={{ marginLeft: 8 }}>{t('dogDetails.loadingMap')}</span>}
            {coordsError && <span style={{ color: 'red', marginLeft: 8 }}>{coordsError}</span>}
          </p>
        )}
        {color && (
          <p className="meta">
            <strong>{t('fields.color')}</strong> {t(`color.${color.toLowerCase()}`) || color}
          </p>
        )}
        {size && (
          <p className="meta">
            <strong>{t('fields.size')}</strong> {t(`size.${size.toLowerCase()}`) || size}
          </p>
        )}
        {(vaccinated !== undefined || neutered !== undefined) && (
          <p className="meta">
            <strong>{t('fields.vaccination')}</strong>
            {vaccinated === true && t('dogDetails.vaccinated')}
            {vaccinated === false && t('dogDetails.notVaccinated')}
            {neutered !== undefined && (
              <> | {neutered === true ? t('dogDetails.neutered') : t('dogDetails.notNeutered')}</>
            )}
          </p>
        )}
        {description && (
          <p className="meta description-text">
            <strong>{t('fields.description')}</strong> {description}
          </p>
        )}
        
          {owner && (
            <div style={{ marginTop: isOwner ? '1.5rem' : '2rem', paddingTop: isOwner ? '1rem' : '1.5rem', borderTop: '2px solid #ddd' }}>
              {!isOwner && <h4 style={{ marginBottom: '1rem' }}>{t('fields.contactOwner') || 'Contact Owner'}</h4>}
              <p className="meta" style={{ marginBottom: '0.75rem' }}>
                <strong>{t('fields.name') || 'Name'} {owner.name}</strong>
              </p>
              {typeof createdAt !== 'undefined' && (
                <p className="meta" style={{ marginBottom: '0.75rem' }}>
                  <strong>{t('fields.postedOn')}</strong> {new Date(createdAt as string).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              )}
              {owner.username && owner.username !== owner.name && (
                <p className="meta" style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  <strong>{t('fields.username') || 'Username'}</strong> {owner.username}
                </p>
              )}
              {owner.person && (
                <p className="meta" style={{ marginBottom: '0.75rem' }}>
                  <strong>{t('fields.userType') || 'Type'}</strong> {t(`registerOptions.${owner.person}`) || owner.person}
                </p>
              )}
              {/* Phone and email hidden for privacy */}
            </div>
          )}
      </div>
      <div 
        className="card-actions call-to-action dog-details-mobile-actions"
        ref={buttonsContainerRef}
      >
        {/* Show buttons for authenticated users - show all buttons and handle owner check inside each button */}
        {isAuthenticated && _id && (
          <>
            {/* Edit/Delete buttons for owner */}
            {isOwner && (
              <>
                <button 
                  className="details edit-dog-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) {
                      onEdit({
                        _id,
                        name,
                        breed,
                        age,
                        images,
                        video,
                        thumbnail,
                        color,
                        place,
                        location,
                        description,
                        size,
                        gender,
                        vaccinated,
                        neutered,
                        user: owner,
                        adoptionStatus,
                        adoptionQueue,
                        createdAt
                      });
                    }
                  }}
                >
                  {t('button.edit', t('edit'))}
                </button>
                <button 
                  className="details delete-dog-btn"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm(t('button.confirmDelete') || 'Are you sure you want to delete this dog?')) {
                      try {
                        const resp = await fetch(`${apiBase}/api/dogs/${_id}`, {
                          method: 'DELETE',
                          headers: {
                            'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
                          }
                        });
                        if (resp.ok) {
                          alert(t('alerts.dogDeleted') || 'Dog deleted successfully');
                          if (onDogChanged) onDogChanged();
                          if (onClose) onClose();
                        } else {
                          const data = await resp.json();
                          alert(data.message || t('alerts.deleteFailed') || 'Failed to delete dog');
                        }
                      } catch (err) {
                        alert(t('alerts.deleteError') || 'Error deleting dog');
                      }
                    }
                  }}
                >
                  {t('button.remove', t('delete'))}
                </button>
              </>
            )}
            <button 
              id="add-to-list" 
              className="details"
              onClick={() => {
                handleWishlistToggle();
              }}
            >
              {isInWishlist(_id)
                ? <><div style={{position:'relative',fontSize:18,marginRight:4,display:'inline-block'}}>❤️<span style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',color:'#4CAF50',fontSize:12,fontWeight:'bold'}}>✓</span></div><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:4}}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></>
                : <><span style={{fontSize:18,marginRight:4}}>❤️</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:4}}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></>}
            </button>
            {/* ADOPT/CONFIRM/CANCEL LOGIC (improved for both adopter and owner) */}
            {/* Adoption UI logic: handle different states correctly */}
            {adoptionStatusState === 'pending' && adoptionQueueState && currentUser ? (
              <>
                {/* Adopter: can confirm or cancel if not yet confirmed */}
                {adoptionQueueState.adopter === currentUser._id && !adoptionQueueState.adopterConfirmed && (
                  <>
                    <button
                      className="details adopt-confirm-btn"
                      onClick={async () => {
                        setIsPerformingAction(true);
                        setAdoptLoading(true);
                        setAdoptError(null);
                        try {
                          const resp = await fetch(`${apiBase}/api/dogs/${_id}/adopt-confirm`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
                            }
                          });
                          const data = await resp.json();
                          if (!resp.ok) throw new Error(data.message || 'Error');
                          // If adoption is complete (dog deleted), close the modal
                          if (data.adopted && data.removed) {
                            setAdoptionStatus('adopted');
                            setAdoptionQueue(null);
                            if (onDogUpdate) onDogUpdate({ _id, adoptionStatus: 'adopted' });
                            if (onDogChanged) onDogChanged();
                            if (onClose) setTimeout(() => onClose(), 500);
                          } else if (data.dog) {
                            setAdoptionStatus(data.dog?.adoptionStatus || 'pending');
                            setAdoptionQueue(data.dog?.adoptionQueue);
                            if (onDogUpdate) onDogUpdate(data.dog);
                            if (onDogChanged) onDogChanged();
                          }
                        } catch (e: any) {
                          setAdoptError(e.message || 'Error');
                        } finally {
                          setAdoptLoading(false);
                          setIsPerformingAction(false);
                        }
                      }}
                      disabled={adoptLoading}
                    >
                      {adoptLoading ? (t('button.confirming') || 'Potvrđujem...') : (t('button.confirmAdoption') || 'Potvrdi posvajanje')}
                    </button>
                    <textarea
                      placeholder={t('dogDetails.cancelReasonPlaceholder') || 'Razlog odustajanja (opcionalno)'}
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      rows={2}
                      disabled={cancelLoading}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      className="details adopt-cancel-btn"
                      onClick={handleCancelAdoption}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? (t('button.cancelling') || 'Odustajanje...') : (t('button.cancelAdoption') || 'Odustani od posvajanja')}
                    </button>
                  </>
                )}
                {/* Owner: can confirm if not yet confirmed */}
                {owner && owner._id === currentUser._id && !adoptionQueueState.ownerConfirmed && (
                  <button
                    className="details adopt-confirm-btn"
                    onClick={async () => {
                      setIsPerformingAction(true);
                      setAdoptLoading(true);
                      setAdoptError(null);
                      try {
                        const resp = await fetch(`${apiBase}/api/dogs/${_id}/adopt-confirm`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
                          }
                        });
                        const data = await resp.json();
                        if (!resp.ok) throw new Error(data.message || 'Error');
                        // If adoption is complete (dog deleted), close the modal
                        if (data.adopted && data.removed) {
                          setAdoptionStatus('adopted');
                          setAdoptionQueue(null);
                          if (onDogUpdate) onDogUpdate({ _id, adoptionStatus: 'adopted' });
                          if (onDogChanged) onDogChanged();
                          if (onClose) setTimeout(() => onClose(), 500);
                        } else if (data.dog) {
                          setAdoptionStatus(data.dog?.adoptionStatus || 'pending');
                          setAdoptionQueue(data.dog?.adoptionQueue);
                          if (onDogUpdate) onDogUpdate(data.dog);
                          if (onDogChanged) onDogChanged();
                        }
                      } catch (e: any) {
                        setAdoptError(e.message || 'Error');
                      } finally {
                        setAdoptLoading(false);
                        setIsPerformingAction(false);
                      }
                    }}
                    disabled={adoptLoading}
                  >
                    {adoptLoading ? (t('button.confirming') || 'Potvrđujem...') : (t('button.confirmAdoption') || 'Potvrdi posvajanje')}
                  </button>
                )}
                {/* Status messages */}
                {adoptError && <div style={{ color: 'red', marginTop: 8, width: '100%' }}>{adoptError}</div>}
                {cancelError && <div style={{ color: 'red', marginTop: 8, width: '100%' }}>{cancelError}</div>}
                {cancelSuccess && <div style={{ color: 'green', marginTop: 8, width: '100%' }}>{t('dogDetails.cancelSuccess') || 'Posvajanje je otkazano.'}</div>}
                {/* Waiting for confirmation message */}
                {adoptionQueueState.adopterConfirmed && !adoptionQueueState.ownerConfirmed && owner && owner._id === currentUser._id && (
                  <div style={{ marginTop: 8, color: '#555', width: '100%' }}>{t('dogDetails.waitingForOwner') || 'Čeka potvrdu vlasnika.'}</div>
                )}
                {adoptionQueueState.ownerConfirmed && !adoptionQueueState.adopterConfirmed && adoptionQueueState.adopter === currentUser._id && (
                  <div style={{ marginTop: 8, color: '#555', width: '100%' }}>{t('dogDetails.waitingForAdopter') || 'Čeka potvrdu posvojitelja.'}</div>
                )}
                {adoptionQueueState.ownerConfirmed && adoptionQueueState.adopterConfirmed && (
                  <div style={{ marginTop: 8, color: 'green', width: '100%' }}>{t('dogDetails.adoptionComplete') || 'Posvajanje završeno!'}</div>
                )}
              </>
            ) : adoptionStatusState === 'pending' && !adoptionQueueState ? (
              <div style={{ color: 'orange', marginTop: 12, width: '100%' }}>
                {t('dogDetails.ambiguousAdoptionState') || 'Adoption is pending, but details are unavailable. Please refresh or contact support.'}
              </div>
            ) : adoptionStatusState === 'pending' && adoptionQueueState ? (
              <>
                <button
                  id="adopt"
                  className="details adopt-requested-btn"
                  disabled
                >
                  {t('button.requested') || 'Zahtjev poslan'}
                </button>
                <div style={{ marginTop: 8, color: '#555', width: '100%' }}>{t('dogDetails.waitingForConfirmation') || 'Čeka potvrdu vlasnika.'}</div>
              </>
            ) : (
              <>
                <button
                  id="adopt"
                  className="details adopt-btn"
                  onClick={handleAdopt}
                  disabled={adoptLoading || adoptionStatusState === 'adopted'}
                >
                  {adoptLoading
                    ? t('button.sending') || 'Slanje...'
                    : t('button.adopt')}
                </button>
                {/* Fallback: if adoption state is not available, show info */}
                {adoptionStatusState === undefined && (
                  <div style={{ color: 'orange', marginTop: 12, width: '100%' }}>
                    {t('dogDetails.noAdoptionInfo') || 'No adoption information available for this dog.'}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      </div>
    </>
  );
};

export default DogDetails;