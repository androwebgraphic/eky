
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import DogImageSlider from '../DogImageSlider';
import { useTranslation } from 'react-i18next';
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../contexts/AuthContext';

// Portal container for map modal
const mapModalRoot = document.getElementById('map-modal-root') || (() => {
  const root = document.createElement('div');
  root.id = 'map-modal-root';
  // Portal root should NOT block clicks - only modal overlay should
  root.style.position = 'absolute';
  root.style.top = '0';
  root.style.left = '0';
  root.style.zIndex = '0';
  root.style.pointerEvents = 'none';
  document.body.appendChild(root);
  return root;
})();


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
  createdAt?: string;
}

const DogDetails: React.FC<DogDetailsProps & { _showMap?: boolean }> = ({
  _id, name, breed, age, images, video, thumbnail, color, place, location, description, size, gender, vaccinated, neutered, onClose, user: owner,
  adoptionStatus, adoptionQueue, onDogUpdate, onDogChanged, createdAt, _showMap
}) => {
  const [showMap, setShowMap] = useState(!!_showMap);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [coordsError, setCoordsError] = useState<string | null>(null);

  // If _showMap is true and location exists, trigger geocoding on mount
  React.useEffect(() => {
      if (_showMap && location) {
      (async () => {
        setLoadingCoords(true);
        setCoordsError(null);
        try {
          let query = location.trim();
          if (query.split(/\s+/).length < 2) {
            query += ', Croatia';
          }
          const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1&extratags=1`);
          const data = await resp.json();
          if (data && data.length > 0) {
            const result = data[0];
            setCoords({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
            setShowMap(true);
          } else {
            setShowMap(true);
            setCoordsError('Location not found');
          }
        } catch (e) {
          setShowMap(true);
          setCoordsError('Location search failed');
        } finally {
          setLoadingCoords(false);
        }
      })();
    }
  }, [_showMap, location]);
  const { t } = useTranslation();
  const { user: currentUser, isAuthenticated, isInWishlist, addToWishlist, removeFromWishlist } = useAuth();
  
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

  // Reset state when dog changes
  React.useEffect(() => {
    setAdoptionStatus(adoptionStatus);
    setAdoptionQueue(adoptionQueue);
    setAdoptLoading(false);
    setAdoptError(null);
    setCancelReason('');
    setCancelLoading(false);
    setCancelError(null);
    setCancelSuccess(false);
    console.log('[DogDetails] Reset state for dog:', _id);
  }, [_id]);
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
    // Notify ChatApp to set adoptionDogId
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
    }
  };
  const getApiBase = () => {
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3001`;
    }
    return `http://${window.location.hostname}:3001`;
  };
  const apiBase = getApiBase();


  // Prepare images for DogImageSlider (always use largest available, prefer 1024px, always pass full Cloudinary URL)
  // Deduplicate images by base name (ignore size/hash/extension variants)
  const sliderImages: { url: string; width?: number }[] = React.useMemo(() => {
    const getImageBase = (url: string) => {
      let cleanUrl = url.split('?')[0];
      const filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
      
      let base = filename;
      
      // Remove file extension FIRST
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
    if (images && images.length > 0) {
      const validImages = images.filter(img => img && img.url && typeof img.url === 'string' && img.url.trim() !== '');
      
      // Deduplicate FIRST before URL transformation
      const baseToImage = new Map();
      validImages.forEach(img => {
        const base = getImageBase(img.url);
        if (!baseToImage.has(base)) {
          baseToImage.set(base, img);
        } else {
          // Keep the one with larger width
          const existing = baseToImage.get(base);
          if ((img.width || 0) > (existing.width || 0)) {
            baseToImage.set(base, img);
          }
        }
      });
      
      const uniqueImages = Array.from(baseToImage.values());
      console.log('[DOG DETAILS] Total images:', validImages.length, 'Unique images:', uniqueImages.length);
      
      // NOW convert to absolute URLs
      const toAbs = (u?: string) => {
        if (!u) return u;
        if (/^https?:\/\//.test(u)) return u + (u.includes('?') ? '&' : '?') + 'cb=' + Date.now();
        if (u.startsWith('/u/dogs/') || u.startsWith('/uploads/')) return apiBase + u + '?cb=' + Date.now();
        if (u.startsWith('u/dogs/') || u.startsWith('uploads/')) return apiBase + '/' + u + '?cb=' + Date.now();
        return apiBase + '/' + u.replace(/^\/+/,'') + '?cb=' + Date.now();
      };
      
      // Sort by width descending and convert to absolute URLs
      const sorted = [...uniqueImages].sort((a, b) => (b.width || 0) - (a.width || 0));
      return sorted.map(img => ({ url: toAbs(img.url), width: img.width }));
    } else if (thumbnail && thumbnail.url) {
      const toAbs = (u?: string) => {
        if (!u) return u;
        if (/^https?:\/\//.test(u)) return u + (u.includes('?') ? '&' : '?') + 'cb=' + Date.now();
        if (u.startsWith('/u/dogs/') || u.startsWith('/uploads/')) return apiBase + u + '?cb=' + Date.now();
        if (u.startsWith('u/dogs/') || u.startsWith('uploads/')) return apiBase + '/' + u + '?cb=' + Date.now();
        return apiBase + '/' + u.replace(/^\/+/,'') + '?cb=' + Date.now();
      };
      return [{ url: toAbs(thumbnail.url) }];
    }
    return [];
  }, [images, thumbnail, apiBase]);

  // Geocode location if needed
  const handleShowMap = async () => {
    if (coords || !location) {
      setShowMap(true);
      return;
    }

    // Debug log for sliderImages
    console.log('DogDetails sliderImages:', sliderImages);
    setLoadingCoords(true);
    setCoordsError(null);
    try {
      // If location is short (1 word), append Croatia for better accuracy
      let query = location.trim();
      if (query.split(/\s+/).length < 2) {
        query += ', Croatia';
      }
      
      // Use OpenStreetMap Nominatim API for geocoding with higher precision
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1&extratags=1`);
      const data = await resp.json();
      
      console.log('Geocoding response for', query, data);
      setCoordsError(null);
      if (data && data.length > 0) {
        const result = data[0];
        setCoords({ 
          lat: parseFloat(result.lat), 
          lng: parseFloat(result.lon)
        });
        setShowMap(true);
      } else {
        // Fallback: show map with search query even if geocoding fails
        setShowMap(true);
        setCoordsError(t('dogDetails.approximateLocation'));
      }
    } catch (e) {
      // Show map anyway with search fallback
      setShowMap(true);
      setCoordsError(t('dogDetails.searchBasedLocation'));
    } finally {
      setLoadingCoords(false);
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .dog-details-mobile-actions button {
            width: 100% !important;
            margin-bottom: 12px !important;
            box-sizing: border-box !important;
            display: block !important;
            min-height: 50px !important;
            font-size: 16px !important;
            font-weight: bold !important;
            padding: 12px 16px !important;
            text-align: center !important;
          }
          .dog-details-mobile-actions button#add-to-list {
            margin-bottom: 16px !important;
          }
        }
      `}</style>
      <div className="card-details">
      <div className="img" style={{ width: '100%', maxWidth: 240, margin: '0 auto', aspectRatio: '1/1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f8', minHeight: 0, maxHeight: 240, boxSizing: 'border-box', marginTop: 12, marginBottom: 12, borderRadius: 12 }}>
        {sliderImages.length > 0 && (
          <DogImageSlider images={sliderImages} alt={name} />
        )}
      </div>
      <div className="description">
        <h3 style={{ color: '#75171a', textAlign: 'center' }}>
          <strong>{t('fields.name')}</strong> {name}
        </h3>
        {breed && (
          <p className="meta">
            <span className="eky-icon eky-tag"></span>
            <strong>{t('fields.breed')}</strong> {breed}
          </p>
        )}
        {gender && (
          <p className="meta">
            <span className="eky-icon eky-user"></span>
            <strong>{t('fields.gender')}</strong> {t(`gender.${gender}`) || gender}
          </p>
        )}
        {age && (
          <p className="meta">
            <span className="eky-icon eky-clock"></span>
            <strong>{t('fields.age')}</strong> {age} {t('dogDetails.ageSuffix')}
          </p>
        )}
        {(place || location) && (
          <p className="meta">
            <span className="eky-icon eky-map"></span>
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
        {showMap && (coords || location) && ReactDOM.createPortal(
          <div className="modal-map" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '85vw', maxWidth: '700px', height: 'auto', background: 'rgba(0,0,0,0.7)', borderRadius: 12, zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'auto' }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, maxWidth: 700, width: '95vw', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                onClick={() => setShowMap(false)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 28,
                  height: 28,
                  background: '#e74c3c',
                  border: 'none',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  cursor: 'pointer',
                  zIndex: 2147483647,
                  boxShadow: '0 2px 8px rgba(231,76,60,0.10)',
                }}
                aria-label={t('common.close')}
                title={t('common.close')}
              >
                <span style={{
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: 900,
                  lineHeight: '28px',
                  display: 'block',
                  textAlign: 'center',
                  width: '100%',
                }}>×</span>
              </button>
              <h3 style={{ marginBottom: 15, textAlign: 'center', color: '#333' }}>{place || location}</h3>
              <iframe
                title={t('dogDetails.mapPreview')}
                width="100%"
                height="450"
                style={{ border: 0, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                src={coords
                  ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng-0.005},${coords.lat-0.005},${coords.lng+0.005},${coords.lat+0.005}&layer=mapnik&marker=${coords.lat},${coords.lng}`
                  : `https://www.openstreetmap.org/export/embed.html?search=${encodeURIComponent(location || '')}&layer=mapnik`}
                allowFullScreen
              />
              <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => setShowMap(false)} 
                  style={{ fontSize: 16, padding: '10px 20px', borderRadius: 6, border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer', color: '#666' }}
                >
                  {t('common.close')}
                </button>
                {coords && (
                  <a 
                    href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=16/${coords.lat}/${coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 16, padding: '10px 20px', borderRadius: 6, border: 'none', background: '#007bff', color: 'white', textDecoration: 'none', cursor: 'pointer', display: 'inline-block' }}
                  >
                    {t('dogDetails.viewFullMap')}
                  </a>
                )}
              </div>
            </div>
          </div>,
          mapModalRoot
        )}
        {color && (
          <p className="meta">
            <span className="eky-icon eky-palette"></span>
            <strong>{t('fields.color')}</strong> {color}
          </p>
        )}
        {size && (
          <p className="meta">
            <span className="eky-icon eky-ruler"></span>
            <strong>{t('fields.size')}</strong> {size}
          </p>
        )}
        {(vaccinated !== undefined || neutered !== undefined) && (
          <p className="meta">
            <span className="eky-icon eky-shield"></span>
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
            <span className="eky-icon eky-note"></span>
            <strong>{t('fields.description')}</strong> {description}
          </p>
        )}
        
          {owner && (
            <div style={{ marginTop: isOwner ? '1.5rem' : '2rem', paddingTop: isOwner ? '1rem' : '1.5rem', borderTop: '2px solid #ddd' }}>
              {!isOwner && <h4 style={{ marginBottom: '1rem' }}>{t('fields.contactOwner') || 'Contact Owner'}</h4>}
              <p className="meta" style={{ marginBottom: '0.75rem' }}>
                <strong>{t('fields.name') || 'Name'}:</strong>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    textDecoration: 'underline',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    padding: 0,
                    marginLeft: 4
                  }}
                  onClick={() => {
                    // Open chat with owner
                    window.dispatchEvent(new CustomEvent('open-chat-with-user', { detail: { userId: owner._id } }));
                    // If adoption is pending, show confirm/cancel buttons
                    if (adoptionStatusState === 'pending') {
                      window.dispatchEvent(new CustomEvent('dog-adopt-initiate', { detail: { dogId: _id } }));
                    }
                  }}
                  aria-label={t('fields.contactOwner') || 'Contact Owner'}
                >
                  {owner.name}
                </button>
                {typeof createdAt !== 'undefined' && (
                  <span style={{ marginLeft: 8, color: '#888', fontSize: '11px' }}>
                    • {new Date(createdAt as string).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                )}
              </p>
              {owner.username && owner.username !== owner.name && (
                <p className="meta" style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  <strong>{t('fields.username') || 'Username'}:</strong> {owner.username}
                </p>
              )}
              {owner.person && (
                <p className="meta" style={{ marginBottom: '0.75rem' }}>
                  <strong>{t('fields.userType') || 'Type'}:</strong> {t(`registerOptions.${owner.person}`) || owner.person}
                </p>
              )}
              {/* Phone and email hidden for privacy */}
            </div>
          )}
      </div>
      <div 
        className="card-actions call-to-action dog-details-mobile-actions"
        style={{
          background: 'white',
          padding: '16px',
          width: '100%',
          boxSizing: 'border-box',
          borderTop: '3px solid #75171a',
          marginTop: '20px',
          paddingBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'stretch'
        }}
      >
        {/* Show buttons for authenticated users - show all buttons and handle owner check inside each button */}
        {isAuthenticated && _id && (
          <>
            <button 
              id="add-to-list" 
              className="details"
              onClick={() => {
                handleWishlistToggle();
              }}
              style={{
                backgroundColor: isInWishlist(_id) ? '#ff4444' : '#4CAF50',
                color: 'white'
              }}
            >
              {isInWishlist(_id) ? '💔 ' + t('button.removeFromList') : '❤️ ' + t('button.addToList')}
            </button>
            {/* ADOPT/CONFIRM/CANCEL LOGIC (improved for both adopter and owner) */}
            {/* Adoption UI logic fallback: if state is ambiguous, show info */}
            {adoptionStatusState === 'pending' && adoptionQueueState && currentUser ? (
              <div style={{ marginTop: 16 }}>
                {/* Adopter: can confirm or cancel if not yet confirmed */}
                {adoptionQueueState.adopter === currentUser._id && !adoptionQueueState.adopterConfirmed && (
                  <div>
                    <button
                      className="details"
                      style={{ backgroundColor: '#28a745', color: 'white', marginRight: 8 }}
                      onClick={async () => {
                        setAdoptLoading(true);
                        setAdoptError(null);
                        try {
                          const resp = await fetch(`${apiBase}/api/dogs/confirm-adoption`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
                            },
                            body: JSON.stringify({ dogId: _id, isOwner: false })
                          });
                          const data = await resp.json();
                          if (!resp.ok) throw new Error(data.message || 'Error');
                          setAdoptionStatus(data.dog?.adoptionStatus || 'available');
                          setAdoptionQueue(data.dog?.adoptionQueue);
                          if (onDogUpdate && data.dog) onDogUpdate(data.dog);
                        } catch (e: any) {
                          setAdoptError(e.message || 'Error');
                        } finally {
                          setAdoptLoading(false);
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
                      style={{ width: '100%', maxWidth: 320, marginBottom: 8 }}
                      disabled={cancelLoading}
                    />
                    <button
                      className="details"
                      style={{ backgroundColor: '#e74c3c', color: 'white', marginLeft: 0 }}
                      onClick={handleCancelAdoption}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? (t('button.cancelling') || 'Odustajanje...') : (t('button.cancelAdoption') || 'Odustani od posvajanja')}
                    </button>
                  </div>
                )}
                {/* Owner: can confirm if not yet confirmed */}
                {owner && owner._id === currentUser._id && !adoptionQueueState.ownerConfirmed && (
                  <button
                    className="details"
                    style={{ backgroundColor: '#28a745', color: 'white', marginRight: 8 }}
                    onClick={async () => {
                      setAdoptLoading(true);
                      setAdoptError(null);
                      try {
                        const resp = await fetch(`${apiBase}/api/dogs/confirm-adoption`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
                          },
                          body: JSON.stringify({ dogId: _id, isOwner: true })
                        });
                        const data = await resp.json();
                        if (!resp.ok) throw new Error(data.message || 'Error');
                        setAdoptionStatus(data.dog?.adoptionStatus || 'available');
                        setAdoptionQueue(data.dog?.adoptionQueue);
                        if (onDogUpdate && data.dog) onDogUpdate(data.dog);
                      } catch (e: any) {
                        setAdoptError(e.message || 'Error');
                      } finally {
                        setAdoptLoading(false);
                      }
                    }}
                    disabled={adoptLoading}
                  >
                    {adoptLoading ? (t('button.confirming') || 'Potvrđujem...') : (t('button.confirmAdoption') || 'Potvrdi posvajanje')}
                  </button>
                )}
                {/* Status messages */}
                {adoptError && <div style={{ color: 'red', marginTop: 8 }}>{adoptError}</div>}
                {cancelError && <div style={{ color: 'red', marginTop: 8 }}>{cancelError}</div>}
                {cancelSuccess && <div style={{ color: 'green', marginTop: 8 }}>{t('dogDetails.cancelSuccess') || 'Posvajanje je otkazano.'}</div>}
                {/* Waiting for confirmation message */}
                {adoptionQueueState.adopterConfirmed && !adoptionQueueState.ownerConfirmed && owner && owner._id === currentUser._id && (
                  <div style={{ marginTop: 8, color: '#555' }}>{t('dogDetails.waitingForOwner') || 'Čeka potvrdu vlasnika.'}</div>
                )}
                {adoptionQueueState.ownerConfirmed && !adoptionQueueState.adopterConfirmed && adoptionQueueState.adopter === currentUser._id && (
                  <div style={{ marginTop: 8, color: '#555' }}>{t('dogDetails.waitingForAdopter') || 'Čeka potvrdu posvojitelja.'}</div>
                )}
                {adoptionQueueState.ownerConfirmed && adoptionQueueState.adopterConfirmed && (
                  <div style={{ marginTop: 8, color: 'green' }}>{t('dogDetails.adoptionComplete') || 'Posvajanje završeno!'}</div>
                )}
              </div>
            ) : adoptionStatusState === 'pending' ? (
              <div>
                <button
                  id="adopt"
                  className="details"
                  disabled
                  style={{ marginLeft: 12, backgroundColor: '#aaa', color: 'white' }}
                >
                  {t('button.requested') || 'Zahtjev poslan'}
                </button>
                <div style={{ marginTop: 8, color: '#555' }}>{t('dogDetails.waitingForConfirmation') || 'Čeka potvrdu vlasnika.'}</div>
              </div>
            ) : adoptionStatusState === 'pending' && !adoptionQueueState ? (
              <div style={{ color: 'orange', marginTop: 12 }}>
                {t('dogDetails.ambiguousAdoptionState') || 'Adoption is pending, but details are unavailable. Please refresh or contact support.'}
              </div>
            ) : (
              <div>
                <button
                  id="adopt"
                  className="details"
                  onClick={handleAdopt}
                  disabled={adoptLoading || adoptionStatusState === 'adopted'}
                  style={{ marginLeft: 12, backgroundColor: '#007bff', color: 'white' }}
                >
                  {adoptLoading
                    ? t('button.sending') || 'Slanje...'
                    : t('button.adopt')}
                </button>
                {/* Fallback: if adoption state is not available, show info */}
                {adoptionStatusState === undefined && (
                  <div style={{ color: 'orange', marginTop: 12 }}>
                    {t('dogDetails.noAdoptionInfo') || 'No adoption information available for this dog.'}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </>
  );
};

export default DogDetails;
