import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../contexts/AuthContext';


interface MediaVariant { url: string; width?: number; size?: string }
interface DogDetailsProps {
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
    username: string;
    email?: string;
    phone?: string;
    person?: 'private' | 'organization';
  };
  adoptionStatus?: string;
  adoptionQueue?: any;
  onDogUpdate?: (dog: any) => void;
}

const DogDetails: React.FC<DogDetailsProps> = ({
  _id, name, breed, age, images, video, thumbnail, color, place, location, description, size, gender, vaccinated, neutered, onClose, user: owner,
  adoptionStatus, adoptionQueue, onDogUpdate
}) => {
  const [showMap, setShowMap] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { user: currentUser, isAuthenticated, isInWishlist, addToWishlist, removeFromWishlist } = useAuth();
  const isOwner = !!(currentUser && owner && currentUser._id === owner._id);

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

  // Sync with props if dog changes
  React.useEffect(() => {
    setAdoptionStatus(adoptionStatus);
    setAdoptionQueue(adoptionQueue);
  }, [_id, adoptionStatus, adoptionQueue]);
  const [adoptLoading, setAdoptLoading] = useState(false);
  const [adoptError, setAdoptError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
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
        if (!resp.ok) throw new Error(data.message || 'Error');
        setCancelSuccess(true);
        setAdoptionStatus(data.dog?.adoptionStatus || 'available');
        setAdoptionQueue(data.dog?.adoptionQueue);
        setCancelReason('');
        if (onDogUpdate && data.dog) onDogUpdate(data.dog);
      } catch (e: any) {
        setCancelError(e.message || 'Error');
      } finally {
        setCancelLoading(false);
      }
    };
  // Optionally: fetch status from props if available

  const handleAdopt = async () => {
    if (!_id) return;
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
      if (!resp.ok) throw new Error(data.message || 'Error');
      setAdoptionStatus(data.dog.adoptionStatus);
      setAdoptionQueue(data.dog.adoptionQueue);
      if (onDogUpdate && data.dog) onDogUpdate(data.dog);
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
  const toAbs = (u?: string) => {
    if (!u) return u;
    // If URL contains /uploads/, extract and rebuild with current API base
    if (u.includes('/uploads/')) {
      const match = u.match(/\/uploads\/.*/);
      return match ? `${apiBase}${match[0]}` : u;
    }
    // Otherwise use as-is if absolute, or prepend apiBase if relative
    return u.startsWith('http') ? u : `${apiBase}${u}`;
  };

  // Prepare srcSet for responsive images
  let mainImg: string = '';
  let srcSet = '';
  let sizes = '';
  if (images && images.length > 0) {
    // Sort by width if available, fallback to order
    const sorted = [...images].sort((a, b) => (a.width || 0) - (b.width || 0));
    srcSet = sorted.map(img => `${toAbs(img.url)} ${img.width || ''}w`).join(', ');
    mainImg = toAbs(sorted[0].url);
    sizes = '(max-width: 600px) 100vw, (max-width: 900px) 60vw, 40vw';
  } else if (thumbnail?.url) {
    mainImg = toAbs(thumbnail.url);
  }

  // Only show one image if only one is present
  const showImageList = images && images.length > 1;

  // Geocode location if needed
  const handleShowMap = async () => {
    if (coords || !location) {
      setShowMap(true);
      return;
    }
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
    <div className="card-details">
      <div className="img">
        {mainImg && (
          <img
            src={mainImg}
            srcSet={srcSet || undefined}
            sizes={srcSet ? sizes : undefined}
            alt={name}
            style={{ width: '80px', height: '80px', borderRadius: '8px', display: 'block', margin: '0 auto', objectFit: 'cover', transform: 'rotate(90deg)', transition: 'transform 0.3s' }}
          />
        )}
        {/* Show all other images underneath only if more than one */}
        {showImageList && (
          <div className="img-list">
            {images!.slice(1).map((img, idx) => (
              <img key={idx} src={toAbs(img.url)} alt={`${name}-img-${idx+1}`} style={{ width: 80, margin: '0.5rem' }} />
            ))}
          </div>
        )}
      </div>
      <div className="description">
        <h3>
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
        {showMap && (coords || location) && (
          <div className="modal-map" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 2147483647, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, maxWidth: 700, width: '95vw', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button
                onClick={() => setShowMap(false)}
                style={{
                  position: 'absolute',
                  top: 15,
                  right: 15,
                  width: 56,
                  height: 56,
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  zIndex: 2147483647,
                  padding: 0
                }}
                title={t('common.close')}
                aria-label={t('common.close')}
              >
                <span style={{
                  fontSize: 40,
                  fontWeight: 900,
                  lineHeight: '56px',
                  width: '100%',
                  textAlign: 'center',
                  display: 'block',
                  userSelect: 'none',
                  letterSpacing: 2
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
          </div>
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
        
        {owner && !isOwner && (
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #ddd' }}>
            <h4 style={{ marginBottom: '1rem' }}>{t('fields.contactOwner') || 'Contact Owner'}</h4>
            <p className="meta" style={{ marginBottom: '0.75rem' }}>
              <strong>{t('fields.name') || 'Name'}:</strong> {owner.name}
            </p>
            {owner.person && (
              <p className="meta" style={{ marginBottom: '0.75rem' }}>
                <strong>{t('fields.userType') || 'Type'}:</strong> {t(`registerOptions.${owner.person}`) || owner.person}
              </p>
            )}
            {isAuthenticated && owner.phone && (
              <p className="meta" style={{ marginBottom: '0.75rem' }}>
                <strong>{t('fields.phone') || 'Phone'}:</strong>
                <a href={`tel:${owner.phone}`} style={{ color: '#007bff', textDecoration: 'none', marginLeft: '0.5rem', fontSize: '1.35rem', fontWeight: 'bold' }}>
                  {owner.phone}
                </a>
              </p>
            )}
          </div>
        )}
      </div>
      <div className="call-to-action">
        {isAuthenticated && _id && !isOwner && (
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
            {/* ADOPT/ODUSTANI LOGIKA */}
            {adoptionStatusState === 'pending' && adoptionQueueState && currentUser && adoptionQueueState.adopter === currentUser._id ? (
              <div style={{ marginTop: 16 }}>
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
                {cancelError && <div style={{ color: 'red', marginTop: 8 }}>{cancelError}</div>}
                {cancelSuccess && <div style={{ color: 'green', marginTop: 8 }}>{t('dogDetails.cancelSuccess') || 'Posvajanje je otkazano.'}</div>}
              </div>
            ) : adoptionStatusState === 'pending' ? (
              <>
                <button
                  id="adopt"
                  className="details"
                  disabled
                  style={{ marginLeft: 12, backgroundColor: '#aaa', color: 'white' }}
                >
                  {t('button.requested') || 'Zahtjev poslan'}
                </button>
                <div style={{ marginTop: 8, color: '#555' }}>{t('dogDetails.waitingForConfirmation') || 'Čeka potvrdu vlasnika.'}</div>
              </>
            ) : (
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
            )}
            {adoptError && <div style={{ color: 'red', marginTop: 8 }}>{adoptError}</div>}
            {adoptionStatusState === 'pending' && (
              <div style={{ marginTop: 8, color: '#555' }}>{t('dogDetails.waitingForConfirmation') || 'Čeka potvrdu vlasnika.'}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DogDetails;
