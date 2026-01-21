import React, { useState } from 'react';
import MultiPhotoIndicator from './MultiPhotoIndicator';
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from '@cloudinary/url-gen';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import DogImageSlider from './DogImageSlider';
import { createPortal } from 'react-dom';

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
  adoptionStatus?: string;
  adoptionQueue?: any;
  onDogUpdate?: (dog: any) => void;
}



const CardSmall: React.FC<CardSmallProps> = (props) => {
  const {
    _id, imgSrc, images, video, thumbnail, name, age, likes, breed, color, description, size, gender, vaccinated, neutered, onViewDetails, onEdit, onRemove, canEdit, user: owner,
    adoptionStatus, adoptionQueue, onDogUpdate, place: propPlace, location: propLocation, lat: propLat, lng: propLng
  } = props;
  const place = propPlace || propLocation || '';
  const lat = (typeof propLat === 'number') ? propLat : undefined;
  const lng = (typeof propLng === 'number') ? propLng : undefined;
  const { t } = useTranslation();
  const { isAuthenticated, isInWishlist, addToWishlist, removeFromWishlist, user: currentUser, token } = useAuth();
  const isOwner = !!(currentUser && owner && currentUser._id === owner._id);


  // Map/geocode state
  const [showMap, setShowMap] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const handleShowMap = async () => {
    if (coords || !place) {
      setShowMap(true);
      return;
    }
    setLoadingCoords(true);
    setCoordsError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'eky-app/1.0 (your@email.com)'
          }
        }
      );
      const data = await response.json();
      if (data && data.length) {
        const result = data[0];
        setCoords({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
      } else {
        setCoordsError(t('dogDetails.approximateLocation') || 'Approximate location');
      }
    } catch (e) {
      setCoordsError(t('dogDetails.searchBasedLocation') || 'Search-based location');
    } finally {
      setLoadingCoords(false);
      setShowMap(true);
    }
  };
  // Wishlist state
  const [inWishlist, setInWishlist] = useState(false);
  React.useEffect(() => {
    if (_id && currentUser && currentUser.wishlist) {
      const isInList = currentUser.wishlist.includes(_id);
      setInWishlist(isInList);
    } else {
      setInWishlist(false);
    }
  }, [_id, currentUser?._id, currentUser?.wishlist?.length, currentUser?.wishlist?.join(',')]);

  // Likes state
  const [likesCount, setLikesCount] = useState(likes?.length || 0);
  const [isLiked, setIsLiked] = useState(likes?.includes(currentUser?._id || '') || false);
  React.useEffect(() => {
    if (likes && currentUser?._id) {
      setIsLiked(likes.includes(currentUser._id));
      setLikesCount(likes.length);
    } else {
      setIsLiked(false);
      setLikesCount(likes?.length || 0);
    }
  }, [likes, currentUser?._id]);

  // Adoption state for list view
  const [adoptionStatusState, setAdoptionStatus] = useState<string | undefined>(adoptionStatus);
  const [adoptionQueueState, setAdoptionQueue] = useState<any>(adoptionQueue);
  React.useEffect(() => {
    setAdoptionStatus(adoptionStatus);
    setAdoptionQueue(adoptionQueue);
  }, [adoptionStatus, adoptionQueue, _id]);
  const [adoptLoading, setAdoptLoading] = useState(false);
  const [adoptError, setAdoptError] = useState<string | null>(null);

  // API base
  const getApiBase = () => {
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3001`;
    }
    return `http://${window.location.hostname}:3001`;
  };
  const apiBase = getApiBase();

  const handleWishlistToggle = async () => {
    if (!_id || !isAuthenticated) {
      alert('Please log in to add dogs to your wishlist');
      return;
    }
    const currentlyInWishlist = inWishlist;
    if (currentlyInWishlist) {
      const result = await removeFromWishlist(_id);
      if (result.success) {
        setInWishlist(false);
        alert('Removed from wishlist!');
      } else {
        alert('Failed to remove from wishlist: ' + (result.error || 'Unknown error'));
      }
    } else {
      const result = await addToWishlist(_id);
      if (result.success) {
        setInWishlist(true);
        alert('Added to wishlist! ❤️');
      } else {
        alert('Failed to add to wishlist: ' + (result.error || 'Unknown error'));
      }
    }
  };

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

  // Helper to check if a string is a Cloudinary public ID (not a URL)
  const isCloudinaryId = (url?: string) => url && !url.startsWith('http') && !url.startsWith('/uploads/');
  // Image helpers
  // Always use Cloudinary public_id for migrated images
  const toCloudinaryUrl = (publicId?: string, options?: { width?: number }) => {
    if (!publicId) return undefined;
    // Replace with your actual cloud name
    const cloudName = 'dtqzrm4by';
    let url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
    if (options?.width) url += `/w_${options.width}`;
    return url;
  };
  const cacheBust = `t=${Date.now()}`;
  // Build srcSet with all available sizes, always including the largest/original
  let imgSrcSet: string | undefined = undefined;
  let largestImgUrl: string | undefined = undefined;
  // Filter images to only those with valid URLs
  const validImages = (images || []).filter(img => img && img.url && typeof img.url === 'string' && img.url.trim() !== '');
  let largestImage = undefined;
  if (validImages.length) {
    // Prefer original (no width param) for Cloudinary, else largest available
    const sorted = [...validImages].sort((a, b) => (b.width || 0) - (a.width || 0));
    largestImage = sorted[0];
    imgSrcSet = sorted
      .filter(i => isCloudinaryId(i.url))
      .map(i => `${toCloudinaryUrl(i.url)} ${i.width || 2000}w`)
      .join(', ');
    if (largestImage && isCloudinaryId(largestImage.url)) {
      largestImgUrl = toCloudinaryUrl(largestImage.url); // no width param: original
    } else if (largestImage) {
      largestImgUrl = largestImage.url;
    }
    if (largestImgUrl && imgSrcSet && !imgSrcSet.includes(largestImgUrl)) {
      imgSrcSet += `, ${largestImgUrl} 2000w`;
    }
  }

  const posterUrl = video && video.poster && video.poster.length
    ? (isCloudinaryId(video.poster[video.poster.length - 1].url)
        ? toCloudinaryUrl(video.poster[video.poster.length - 1].url)
        : video.poster[video.poster.length - 1].url)
    : undefined;
  const hasVideoUrl = video && typeof video.url === 'string' && video.url.length > 0;
  const videoUrl = hasVideoUrl
    ? (isCloudinaryId(video.url)
        ? toCloudinaryUrl(video.url)
        : video.url)
    : undefined;
  let thumbUrl: string | undefined = undefined;
  let isCloudinaryThumb = false;
  if (thumbnail && thumbnail.url) {
    if (isCloudinaryId(thumbnail.url)) {
      thumbUrl = toCloudinaryUrl(thumbnail.url);
      isCloudinaryThumb = true;
    } else if (thumbnail.url.startsWith('http') || thumbnail.url.startsWith('/uploads/')) {
      thumbUrl = thumbnail.url;
      isCloudinaryThumb = false;
    }
  }

  const [showSlider, setShowSlider] = useState(false);

  // Prepare unique images for DogImageSlider (one per uploaded photo, pick only 1024px variant)
  let uniqueImages: { url: string; width?: number }[] = [];
  if (images && images.length > 0) {
    // Prefer 1024px images, fallback to all valid images
    const preferred = images.filter(img => img.width === 1024 && img.url);
    const fallback = images.filter(img => img.url);
    const source = preferred.length > 0 ? preferred : fallback;
    uniqueImages = source.map(img => {
      // If Cloudinary public ID, convert to full URL; if full Cloudinary URL, use as is; else use full URL
      if (isCloudinaryId(img.url)) {
        return { url: toCloudinaryUrl(img.url) || '', width: img.width };
      }
      const cloudinaryMatch = img.url.match(/res\.cloudinary\.com\/[^/]+\/image\/upload\/([^\.]+)(\.[a-zA-Z]+)?$/);
      if (cloudinaryMatch) {
        return { url: img.url, width: img.width };
      }
      // Legacy or external URL
      return { url: img.url, width: img.width };
    });
  }

  return (
    <>
      <div className="card">
        <div
          className="img"
          style={{
            position: 'relative',
            cursor: images && images.length > 0 ? 'pointer' : 'default',
            width: '100%',
            aspectRatio: '1/1',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f8f8',
            minHeight: 0,
            boxSizing: 'border-box',
            border: '1px solid #eee', // for debug
          }}
          onClick={images && images.length > 0 ? () => setShowSlider(true) : undefined}
        >
          {hasVideoUrl ? (
            <video controls width="100%" poster={posterUrl}>
              <source src={videoUrl} />
            </video>
          ) : (typeof (thumbUrl) !== 'undefined' && thumbUrl) ? (
              isCloudinaryThumb
                ? (
                  <img
                    src={toCloudinaryUrl(thumbnail.url, { width: 640 })}
                    srcSet={[
                      toCloudinaryUrl(thumbnail.url, { width: 320 }) + ' 320w',
                      toCloudinaryUrl(thumbnail.url, { width: 640 }) + ' 640w',
                      toCloudinaryUrl(thumbnail.url, { width: 1024 }) + ' 1024w',
                      toCloudinaryUrl(thumbnail.url) + ' 2000w'
                    ].join(', ')}
                    sizes="(max-width: 320px) 100vw, (max-width: 640px) 50vw, 320px"
                    alt={name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '1rem',
                      objectFit: 'cover',
                      aspectRatio: '1/1',
                      display: 'block',
                      imageRendering: 'auto',
                    }}
                    id="dog-thumbnail"
                    name="dog-thumbnail"
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/nany.jpg'; }}
                  />
                )
                : <img src={thumbUrl} alt={name} style={{ width: '100%', height: '100%', maxWidth: 320, maxHeight: 320, borderRadius: '1rem', objectFit: 'cover', aspectRatio: '1/1', display: 'block', imageRendering: 'crisp-edges' }} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/nany.jpg'; }} />
          ) : (largestImgUrl) ? (
              isCloudinaryId(largestImgUrl)
                ? (
                  <img
                    src={toCloudinaryUrl(largestImgUrl, { width: 640 })}
                    srcSet={[
                      toCloudinaryUrl(largestImgUrl, { width: 320 }) + ' 320w',
                      toCloudinaryUrl(largestImgUrl, { width: 640 }) + ' 640w',
                      toCloudinaryUrl(largestImgUrl, { width: 1024 }) + ' 1024w',
                      toCloudinaryUrl(largestImgUrl) + ' 2000w'
                    ].join(', ')}
                    sizes="(max-width: 320px) 100vw, (max-width: 640px) 50vw, 320px"
                    alt={name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '1rem',
                      objectFit: 'cover',
                      aspectRatio: '1/1',
                      display: 'block',
                      imageRendering: 'auto',
                    }}
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/nany.jpg'; }}
                  />
                )
                : <img src={largestImgUrl} alt={name} srcSet={imgSrcSet} sizes="(max-width: 320px) 100vw, 320px" style={{ width: '100%', height: '100%', borderRadius: '1rem', objectFit: 'cover', aspectRatio: '1/1', display: 'block', imageRendering: 'crisp-edges' }} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/nany.jpg'; }} />
          ) : (
              <img src={imgSrc || '/img/nany.jpg'}
                alt={name}
                style={{ width: '100%', height: '100%', borderRadius: '1rem', objectFit: 'cover', aspectRatio: '1/1', display: 'block', imageRendering: 'auto' }}
                onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/nany.jpg'; }} />
          )}
          {images && images.length > 1 && (
            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
              <MultiPhotoIndicator count={images.length} />
            </div>
          )}
        </div>

        {/* Modal DogImageSlider */}
        {uniqueImages.length > 0 && showSlider && createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.85)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowSlider(false)}
          >
            <div
              style={{
                maxWidth: 600,
                width: '90vw',
                height: '90vw',
                background: 'transparent',
                borderRadius: 16,
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={e => e.stopPropagation()}
            >
              <DogImageSlider images={uniqueImages} alt={name} />
              <button onClick={() => setShowSlider(false)} style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, background: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>×</button>
            </div>
          </div>,
          document.body
        )}

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
                {loadingCoords ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <span>{t('dogDetails.loadingMap') || 'Loading map...'}</span>
                  </div>
                ) : coords ? (
                  <iframe
                    title="Map Preview"
                    width="100%"
                    height="400"
                    style={{ border: 0, borderRadius: 8 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng-0.005},${coords.lat-0.005},${coords.lng+0.005},${coords.lat+0.005}&layer=mapnik&marker=${coords.lat},${coords.lng}`}
                    allowFullScreen
                  />
                ) : coordsError ? (
                  <div style={{ color: 'red', textAlign: 'center', padding: 40 }}>{coordsError}</div>
                ) : null}
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
              {/* Phone and email hidden in dog list */}
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
            {isAuthenticated && _id && !isOwner && (
              <>
                {/* ADOPT/ODUSTANI LOGIKA (simplified for list) */}
                {adoptionStatusState === 'pending' && adoptionQueueState && currentUser && adoptionQueueState.adopter === currentUser._id ? (
                  <button
                    id="cancel-adopt"
                    className="details"
                    onClick={async () => {
                      setAdoptLoading(true);
                      setAdoptError(null);
                      try {
                        const resp = await fetch(`${apiBase}/api/dogs/${_id}/adopt-cancel`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
                          },
                          body: JSON.stringify({ reason: '' })
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
                    style={{
                      background: '#e74c3c',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 500
                    }}
                  >
                    {adoptLoading ? (t('button.cancelling') || 'Odustajanje...') : (t('button.cancelAdoption') || 'Odustani od posvajanja')}
                  </button>
                ) : adoptionStatusState === 'pending' ? (
                  <button
                    id="adopt"
                    className="details adopt-btn"
                    disabled
                  >
                    {t('button.requested') || 'Zahtjev poslan'}
                  </button>
                ) : (
                  <button
                    id="adopt"
                    className="details"
                    onClick={handleAdopt}
                    disabled={adoptLoading || adoptionStatusState === 'adopted'}
                    style={{
                      background: '#267822',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 500
                    }}
                  >
                    {adoptLoading
                      ? t('button.sending') || 'Slanje...'
                      : t('button.adopt')}
                  </button>
                )}
                {adoptError && <div style={{ color: 'red', marginTop: 4, fontSize: '10px' }}>{adoptError}</div>}
                <button 
                  className={`like ${isLiked ? 'liked' : ''}`}
                  onClick={async () => {
                    if (!isAuthenticated || !_id) return;
                    if (isLiked) {
                      try {
                        const response = await fetch(`${apiBase}/api/dogs/${_id}/unlike`, {
                          method: 'POST',
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
                  }}
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

              >
                {t('button.edit') || 'Edit'}
              </button>
            )}
            {canEdit && onRemove && (
              <button
                className="remove"
                onClick={onRemove}
                title={t('button.remove') || 'Remove'}

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
