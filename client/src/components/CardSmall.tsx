
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

// Geocode location if needed (mirrors DogDetails)
// (handleShowMap will be defined inside the component, after imports)

interface MediaVariant { url: string; width?: number; size?: string }
interface CardSmallProps {
  _id?: string;
  imgSrc?: string;
  images?: MediaVariant[];
  video?: { url: string; poster?: MediaVariant[] };
  thumbnail?: MediaVariant;
  name: string;
  age?: number;
  likes?: string[];
  breed?: string;
  color?: string;
  place?: string;
  location?: string;
  lat?: number;
  lng?: number;
  description?: string;
  size?: string;
  gender?: 'male' | 'female';
  vaccinated?: boolean;
  neutered?: boolean;
  onViewDetails?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onEdit?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onRemove?: () => void;
  canEdit?: boolean;
  user?: {
    _id: string;
    name: string;
    username: string;
    email?: string;
    phone?: string;
    person?: 'private' | 'organization';
  };
}

const CardSmall: React.FC<CardSmallProps> = (props) => {
    // Geocode location if needed (mirrors DogDetails)
    const handleShowMap = async () => {
      if (coords || !place) {
        setShowMap(true);
        return;
      }
      setLoadingCoords(true);
      setCoordsError(null);
      try {
        let query = place.trim();
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
          setCoordsError(t('dogDetails.approximateLocation') || 'Approximate location');
        }
      } catch (e) {
        setShowMap(true);
        setCoordsError(t('dogDetails.searchBasedLocation') || 'Search-based location');
      } finally {
        setLoadingCoords(false);
      }
    };
  const {
    _id, imgSrc, images, video, thumbnail, name, age, likes, breed, color, description, size, gender, vaccinated, neutered, onViewDetails, onEdit, onRemove, canEdit, user: owner
  } = props;
  // fallback: use props.place, or props.location if place is undefined
  const place = props.place || props.location || '';
  // @ts-ignore: lat/lng may be present
  const lat = (typeof props.lat === 'number') ? props.lat : undefined;
  const lng = (typeof props.lng === 'number') ? props.lng : undefined;
  const [showMap, setShowMap] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { isAuthenticated, isInWishlist, addToWishlist, removeFromWishlist, user: currentUser, token } = useAuth();
  const isOwner = !!(currentUser && owner && currentUser._id === owner._id);
  
  // Local state to track wishlist status for immediate UI update
  const [inWishlist, setInWishlist] = useState(false);
  
  // Local state to track likes
  const [likesCount, setLikesCount] = useState(likes?.length || 0);
  const [isLiked, setIsLiked] = useState(likes?.includes(currentUser?._id || '') || false);
  
  // Sync local state with auth context
  React.useEffect(() => {
    if (_id && currentUser && currentUser.wishlist) {
      const isInList = currentUser.wishlist.includes(_id);
      setInWishlist(isInList);
    } else {
      // Reset when user logs out or no wishlist
      setInWishlist(false);
    }
  }, [_id, currentUser?._id, currentUser?.wishlist?.length, currentUser?.wishlist?.join(',')]);
  
  // Update isLiked when likes prop or user changes
  React.useEffect(() => {
    if (likes && currentUser?._id) {
      setIsLiked(likes.includes(currentUser._id));
      setLikesCount(likes.length);
    } else {
      // Reset when user logs out
      setIsLiked(false);
      setLikesCount(likes?.length || 0);
    }
  }, [likes, currentUser?._id]);

  const handleWishlistToggle = async () => {
    console.log('Wishlist button clicked for dog:', _id, 'Authenticated:', isAuthenticated);
    if (!_id || !isAuthenticated) {
      console.log('Cannot toggle wishlist - no ID or not authenticated');
      alert('Please log in to add dogs to your wishlist');
      return;
    }

    const currentlyInWishlist = inWishlist;
    console.log('Currently in wishlist:', currentlyInWishlist);

    if (currentlyInWishlist) {
      console.log('Removing from wishlist...');
      const result = await removeFromWishlist(_id);
      console.log('Remove result:', result);
      if (result.success) {
        setInWishlist(false);
        alert('Removed from wishlist!');
      } else {
        alert('Failed to remove from wishlist: ' + (result.error || 'Unknown error'));
      }
    } else {
      console.log('Adding to wishlist...');
      const result = await addToWishlist(_id);
      console.log('Add result:', result);
      if (result.success) {
        setInWishlist(true);
        alert('Added to wishlist! ❤️');
      } else {
        alert('Failed to add to wishlist: ' + (result.error || 'Unknown error'));
      }
    }
  };

  const handleLikeToggle = async () => {
    if (!_id || !isAuthenticated) {
      alert('Please log in to like dogs');
      return;
    }

    const apiBase = getApiBase();
    
    if (isLiked) {
      // Unlike
      try {
        const response = await fetch(`${apiBase}/api/dogs/${_id}/like`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setLikesCount(data.likesCount);
          setIsLiked(false);
        }
      } catch (error) {
        console.error('Unlike error:', error);
      }
    } else {
      // Like
      try {
        const response = await fetch(`${apiBase}/api/dogs/${_id}/like`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setLikesCount(data.likesCount);
          setIsLiked(true);
        }
      } catch (error) {
        console.error('Like error:', error);
      }
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
  // Add cache-busting query string to image URLs to force reload after update
  const cacheBust = `t=${Date.now()}`;
  const imgSrcSet = images && images.length ? images.map(i => `${toAbs(i.url)}?${cacheBust} ${i.width || 320}w`).join(', ') : undefined;
  const posterUrl = video && video.poster && video.poster.length ? toAbs(video.poster[video.poster.length - 1].url) : undefined;

  const hasVideoUrl = video && typeof video.url === 'string' && video.url.length > 0;
  const videoUrl = hasVideoUrl ? toAbs(video.url) : undefined;
  const thumbUrl = thumbnail && thumbnail.url ? `${toAbs(thumbnail.url)}?${cacheBust}` : undefined;

  return (
    <>
      <div className="card">
        <div className="img">
          {hasVideoUrl ? (
            <video controls width="100%" poster={posterUrl}>
              <source src={videoUrl} />
            </video>
          ) : (typeof (thumbUrl) !== 'undefined' && thumbUrl) ? (
            <img src={thumbUrl} alt={name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (images && images.length) ? (
            <img src={`${toAbs(images[0].url)}?${cacheBust}`} srcSet={imgSrcSet} sizes="(max-width: 600px) 320px, (max-width: 1024px) 640px, 1024px" alt={name} />
          ) : (
            <img src={imgSrc || 'img/nany.jpg'} alt={name} />
          )}
        </div>

        <div className="description">
          <h3 style={{ color: '#751719', marginBottom: 4 }}>
            <strong>{t('fields.name')}</strong> {name}
          </h3>
          {breed && (
            <p className="meta">
              <span className="eky-icon eky-tag"></span>
              <strong>{t('fields.breed')}</strong> {breed}
            </p>
          )}
          {gender && (gender === 'male' || gender === 'female') && (
            <p className="meta">
              <span className="eky-icon eky-user"></span>
              <strong>{t('fields.gender')}</strong> {t(`gender.${gender}`)}
            </p>
          )}
          {place && (
            <p className="meta">
              <span className="eky-icon eky-map"></span>
              <strong>{t('fields.location')}</strong> 
              <span
                style={{ cursor: place ? 'pointer' : 'default', textDecoration: place ? 'underline' : 'none' }}
                onClick={place ? handleShowMap : undefined}
              >
                {place}
              </span>
              {loadingCoords && <span style={{ marginLeft: 8 }}>{t('dogDetails.loadingMap') || 'Loading map...'}</span>}
              {coordsError && <span style={{ color: 'red', marginLeft: 8 }}>{coordsError}</span>}
            </p>
          )}
          {showMap && place && (
            <div className="modal-map" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', padding: 20, borderRadius: 12, maxWidth: 600, width: '90vw', position: 'relative' }}>
                <button
                  onClick={() => setShowMap(false)}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
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
                <h3 style={{ marginBottom: 10 }}>{place}</h3>
                <iframe
                  title="Map Preview"
                  width="100%"
                  height="400"
                  style={{ border: 0, borderRadius: 8 }}
                  src={coords
                    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng-0.005},${coords.lat-0.005},${coords.lng+0.005},${coords.lat+0.005}&layer=mapnik&marker=${coords.lat},${coords.lng}`
                    : `https://www.openstreetmap.org/export/embed.html?search=${encodeURIComponent(place)}`}
                  allowFullScreen
                />
              </div>
            </div>
          )}
        {/* ...existing code... */}
          
          {owner && !isOwner && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
              <p className="meta" style={{ marginBottom: '0.5rem' }}>
                <strong>{t('fields.postedBy') || 'Posted by'}:</strong> {owner.name}
              </p>
              {owner.person && (
                <p className="meta" style={{ marginBottom: '0.5rem' }}>
                  <strong>{t('fields.userType') || 'Type'}:</strong> {t(`registerOptions.${owner.person}`) || owner.person}
                </p>
              )}
              {owner.phone && (
                <p className="meta" style={{ marginBottom: '0.5rem' }}>
                  <strong>{t('fields.phone') || 'Phone'}:</strong> 
                  <a href={`tel:${owner.phone}`} style={{ color: '#007bff', textDecoration: 'none', marginLeft: '0.5rem' }}>
                    {owner.phone}
                  </a>
                </p>
              )}
              {owner.email && (
                <p className="meta">
                  <strong>{t('fields.email') || 'Email'}:</strong>
                  <a href={`mailto:${owner.email}`} style={{ color: '#007bff', textDecoration: 'none', marginLeft: '0.5rem' }}>
                    {owner.email}
                  </a>
                </p>
              )}
            </div>
          )}
          
          <div className="card-actions" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginTop: '6px',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
            rowGap: '4px',
            columnGap: '4px',
            minHeight: '24px',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            <button 
              className="details"
              onClick={onViewDetails}
              style={{
                padding: '2px 7px',
                border: 'none',
                borderRadius: '10px',
                background: '#2196F3', // app main color
                color: 'white',
                fontSize: '10px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                minWidth: 'fit-content',
                boxShadow: '0 1px 4px rgba(33,150,243,0.08)'
              }}
            >
              {t('button.viewDetails')}
            </button>
            {isAuthenticated && _id && (
              <>
                <button 
                  className={`like ${isLiked ? 'liked' : ''}`}
                  onClick={handleLikeToggle}
                  style={{
                    backgroundColor: isLiked ? '#ff6b6b' : '#f0f0f0',
                    color: isLiked ? 'white' : '#333',
                    border: '1px solid #ddd',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={isLiked ? 'Unlike' : 'Like'}
                >
                  👍 {likesCount}
                </button>
                <button 
                  className={`wishlist ${inWishlist ? 'in-wishlist' : ''}`}
                  onClick={() => {
                    // eslint-disable-next-line no-console
                    console.log('[CardSmall] addToList:', t('button.addToList'), '| removeFromList:', t('button.removeFromList'));
                    handleWishlistToggle();
                  }}
                  style={{
                    backgroundColor: inWishlist ? '#ff4444' : '#2196F3', // red for remove, app color for add
                    color: 'white',
                    border: 'none',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content',
                    boxShadow: inWishlist ? '0 1px 4px rgba(255,68,68,0.08)' : '0 1px 4px rgba(33,150,243,0.08)'
                  }}
                  title={inWishlist ? t('button.removeFromList') : t('button.addToList')}
                >
                  {(() => {
                    const addToList = t('button.addToList');
                    const removeFromList = t('button.removeFromList');
                    // eslint-disable-next-line no-console
                    console.log('[CardSmall][render] addToList:', addToList, '| removeFromList:', removeFromList);
                    return inWishlist ? '💔 ' + removeFromList : '❤️ ' + addToList;
                  })()}
                </button>
              </>
            )}
            {!isAuthenticated && _id && (
              <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                👍 {likesCount}
              </div>
            )}
            {canEdit && onEdit && (
              <button
                className="edit"
                onClick={onEdit}
                title={t('button.edit') || 'Edit'}
                style={{
                  padding: '2px 7px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#FFC107',
                  color: '#333',
                  fontSize: '10px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  boxShadow: '0 1px 4px rgba(255,193,7,0.08)'
                }}
              >
                {t('button.edit') || 'Edit'}
              </button>
            )}
            {canEdit && onRemove && (
              <button
                className="remove"
                onClick={onRemove}
                title={t('button.remove') || 'Remove'}
                style={{
                  padding: '2px 7px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#e74c3c',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  boxShadow: '0 1px 4px rgba(231,76,60,0.08)'
                }}
              >
                {t('button.remove') || 'Remove'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CardSmall;
