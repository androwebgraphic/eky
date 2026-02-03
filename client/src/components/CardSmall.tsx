import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import DogImageSlider from './DogImageSlider';
import { createPortal } from 'react-dom';
declare global {
  interface Window {
    __EKY_IMAGE_CB?: number;
  }
}
interface MediaVariant { url: string; width?: number; size?: string }
interface CardSmallProps {
  _id?: string;
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
  onDogUpdate?: (update: any) => void;
  createdAt?: string;
  smallImage?: boolean;
  compactDesktop?: boolean;
}

const CardSmall: React.FC<CardSmallProps> = (props) => {
  // Debug: log images prop for each card
  console.log('[CardSmall DEBUG] Dog', props._id, 'images:', props.images);
  // Destructure props for easier access
  const {
    _id,
    images,
    video,
    thumbnail,
    name,
    likes,
    breed,
    place,
    gender,
    onViewDetails,
    onEdit,
    onRemove,
    canEdit,
    user: owner,
    adoptionStatus,
    adoptionQueue,
    onDogUpdate,
    createdAt,
    smallImage = false,
    compactDesktop = false,
  } = props;

  const { t } = useTranslation();
  const { currentUser, isAuthenticated, token, addToWishlist, removeFromWishlist } = useAuth();
  const [showMap, setShowMap] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const [loadingCoords, setLoadingCoords] = useState(false);

  const isOwner = currentUser && owner && currentUser._id === owner._id;

  const handleShowMap = async () => {
    if (!place) return;
    setLoadingCoords(true);
    setCoords(null);
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
  // Keep inWishlist in sync with AuthContext user.wishlist
  React.useEffect(() => {
    const wishlistArr = currentUser?.wishlist || [];
    if (_id && wishlistArr) {
      setInWishlist(wishlistArr.includes(_id));
    } else {
      setInWishlist(false);
    }
  }, [_id, currentUser?.wishlist?.length]);

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

  // Image base
  const getImageBase = () => {
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3001`;
    }
    return `http://${window.location.hostname}:3001`;
  };
  const imageBase = getImageBase();

  type AddToWishlistResult = { success: boolean; error?: string; wishlist?: any[] };
  const handleWishlistToggle = async () => {
    if (!_id || !isAuthenticated) {
      alert('Please log in to add dogs to your wishlist');
      return;
    }
    const currentlyInWishlist = inWishlist;
    if (currentlyInWishlist) {
      const result = await removeFromWishlist(_id);
      if (result.success) {
        alert('Removed from wishlist!');
      } else {
        alert('Failed to remove from wishlist: ' + (result.error || 'Unknown error'));
      }
    } else {
      const result = (await addToWishlist(_id)) as AddToWishlistResult;
      if (result.success) {
        if (result.wishlist && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: { wishlist: result.wishlist } }));
        }
        alert('Added to wishlist! ❤️');
      } else {
        alert('Failed to add to wishlist: ' + (result.error || 'Unknown error'));
      }
    }
  };


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


  // Helper to get absolute URL for images
  const toAbsUrl = (url?: string) => {
    if (!url) return url;
    // Use a global cache-busting timestamp for all images in this render
    const cacheBuster = window.__EKY_IMAGE_CB || (window.__EKY_IMAGE_CB = Date.now());
    // If already absolute (http/https), add cache-busting param
    if (/^https?:\/\//.test(url)) return url + (url.includes('?') ? '&' : '?') + 'cb=' + cacheBuster;
    // If starts with /uploads/ or /u/dogs/, prepend imageBase and add cache-busting
    if (url.startsWith('/uploads/') || url.startsWith('/u/dogs/')) return imageBase + url + '?cb=' + cacheBuster;
    // If starts with uploads/ or u/dogs/ (missing leading slash), add it and prepend imageBase and add cache-busting
    if (url.startsWith('uploads/') || url.startsWith('u/dogs/')) return imageBase + '/' + url + '?cb=' + cacheBuster;
    // Otherwise, treat as relative to imageBase and add cache-busting
    return imageBase + '/' + url.replace(/^\/+/,'') + '?cb=' + cacheBuster;
  };

  // Only use local or external image URLs
  let largestImgUrl: string | undefined = undefined;
  const validImages = (images || []).filter(img => img && img.url && typeof img.url === 'string' && img.url.trim() !== '');
  if (validImages.length) {
    // Prefer largest available
    const sorted = [...validImages].sort((a, b) => (b.width || 0) - (a.width || 0));
    largestImgUrl = toAbsUrl(sorted[0].url);
    // Debug: log the URL being rendered
    console.log('[CardSmall DEBUG] Rendering image URL:', largestImgUrl);
  }

  const posterUrl = video && video.poster && video.poster.length
    ? toAbsUrl(video.poster[video.poster.length - 1].url)
    : undefined;
  const hasVideoUrl = video && typeof video.url === 'string' && video.url.length > 0;
  const videoUrl = hasVideoUrl ? toAbsUrl(video.url) : undefined;
  let thumbUrl: string | undefined = undefined;
  if (thumbnail && thumbnail.url) {
    thumbUrl = toAbsUrl(thumbnail.url);
  }

  const [showSlider, setShowSlider] = useState(false);
  const sliderContentRef = useRef<HTMLDivElement>(null);
  // Removed unused sliderModalRef

  // Close modal on Escape key
  useEffect(() => {
    if (!showSlider) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSlider(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSlider]);

  // Prepare unique images for DogImageSlider (one per uploaded photo, pick only 1024px variant)
  let uniqueImages: { url: string; width?: number }[] = [];
  if (images && images.length > 0) {
    // Prefer 1024px images, fallback to all valid images
    const preferred = images.filter(img => img.width === 1024 && img.url);
    const fallback = images.filter(img => img.url);
    const source = preferred.length > 0 ? preferred : fallback;
    uniqueImages = source.map(img => ({ url: toAbsUrl(img.url), width: img.width }));
  }

  return (
    <div className="card" style={compactDesktop ? {
      maxWidth: '300px',
      padding: '1rem',
      fontSize: '1rem',
      borderRadius: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      margin: '0.75rem',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    } : undefined}>
      <div
        className="img"
        style={{
          position: 'relative',
          cursor: images && images.length > 0 ? 'pointer' : 'default',
          width: compactDesktop ? '180px' : '100%',
          aspectRatio: '1/1',
          height: 0,
          paddingBottom: compactDesktop ? '180px' : '100%',
          display: 'block',
          background: '#f8f8f8',
          boxSizing: 'border-box',
          border: '1px solid #eee',
          overflow: 'hidden',
          borderRadius: compactDesktop ? '1rem' : '1rem'
        }}
        onClick={images && images.length > 0 ? () => setShowSlider(true) : undefined}
      >
        {hasVideoUrl ? (
          <video controls width="100%" height="auto" poster={posterUrl}>
            <source src={videoUrl} />
          </video>
        ) : (largestImgUrl) ? (
            <div style={{ position: 'relative', width: smallImage ? '60%' : '100%', margin: smallImage ? '0 auto' : undefined, aspectRatio: '1/1' }}>
              <img src={largestImgUrl} alt={name} style={{ width: '100%', height: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block', borderRadius: '1rem', imageRendering: 'auto', position: 'relative', zIndex: 1 }} onError={e => { (e.target as HTMLImageElement).src = '/img/nany.jpg'; }} />
              {adoptionStatusState === 'pending' && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0,0,0,0.45)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 1,
                  borderRadius: '1rem',
                  zIndex: 2,
                  textShadow: '0 2px 8px #000',
                  pointerEvents: 'none'
                }}>
                  In adoption process
                </div>
              )}
            </div>
        ) : (typeof (thumbUrl) !== 'undefined' && thumbUrl) ? (
            <div style={{ position: 'relative', width: smallImage ? '60%' : '100%', margin: smallImage ? '0 auto' : undefined, aspectRatio: '1/1' }}>
              <img src={thumbUrl} alt={name} style={{ width: '100%', height: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block', borderRadius: '1rem', imageRendering: 'auto', position: 'relative', zIndex: 1 }} onError={e => { (e.target as HTMLImageElement).src = '/img/nany.jpg'; }} />
              {adoptionStatusState === 'pending' && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0,0,0,0.45)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 1,
                  borderRadius: '1rem',
                  zIndex: 2,
                  textShadow: '0 2px 8px #000',
                  pointerEvents: 'none'
                }}>
                  In adoption process
                </div>
              )}
            </div>
        ) : null}
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
              flexDirection: 'column',
              padding: '6vw 0', // More vertical padding for overlay
              boxSizing: 'border-box',
            }}
            onClick={e => {
              if (e.target === e.currentTarget) setShowSlider(false);
            }}
            aria-modal="true"
            role="dialog"
            tabIndex={-1}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: 600,
                width: '90vw',
                height: 'auto',
                maxHeight: '80vh',
                background: 'transparent',
                borderRadius: 16,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                boxSizing: 'border-box',
              }}
              onClick={e => e.stopPropagation()}
              tabIndex={-1}
              ref={sliderContentRef}
            >
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setShowSlider(false); }}
                aria-label="Close slider"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 10000,
                  background: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  fontSize: 28,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  userSelect: 'none',
                  touchAction: 'manipulation',
                }}
                tabIndex={0}
                autoFocus
              >
                ×
              </button>
              <DogImageSlider images={uniqueImages} alt={name} />
            </div>
          </div>,
          document.body
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
        {owner && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
              <p className="meta" style={{ marginBottom: '0.5rem' }}>
                <strong>{t('fields.postedBy') || 'Posted by'}:</strong> {owner.name}
                {createdAt && (
                  <span style={{ marginLeft: 8, color: '#888', fontSize: '11px' }}>
                    • {new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                )}
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
            {isAuthenticated && _id && adoptionStatusState !== 'adopted' && (
              <>
                {/* ADOPT/ODUSTANI LOGIKA (simplified for list) */}
                {adoptionStatusState === 'pending' && adoptionQueueState && currentUser ? (
                  adoptionQueueState.adopter === currentUser._id ? (
                    <button
                      id="adopt"
                      className="details adopt-btn"
                      disabled
                    >
                      {t('button.requested') || 'Requested'}
                    </button>
                  ) : isOwner ? (
                    adoptionQueueState.ownerConfirmed ? (
                      <button className="details" disabled>
                        {t('button.waiting') || 'Waiting for adopter confirmation'}
                      </button>
                    ) : null
                  ) : (
                    <button
                      id="adopt"
                      className="details"
                      onClick={handleAdopt}
                      disabled={adoptLoading}
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
                  )
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
                      // Optimistically update UI
                      setIsLiked(false);
                      setLikesCount(prev => Math.max(0, prev - 1));
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
                        }
                      } catch (error) {
                        console.error('Unlike error:', error);
                      }
                    } else {
                      // Optimistically update UI
                      setIsLiked(true);
                      setLikesCount(prev => prev + 1);
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
                        }
                      } catch (error) {
                        console.error('Like error:', error);
                      }
                    }
                  }}
                >
                  👍 {likesCount}
                </button>
                <button 
                  className={`wishlist ${inWishlist ? 'in-wishlist' : ''}`}
                  onClick={() => {
                    // eslint-disable-next-line no-console
                      // Removed debug log for addToList and removeFromList
                    handleWishlistToggle();
                  }}

                  title={inWishlist ? t('button.removeFromList') : t('button.addToList')}
                >
                  {(() => {
                    const addToList = t('button.addToList');
                    const removeFromList = t('button.removeFromList');
                    // eslint-disable-next-line no-console
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

  );
};

export default CardSmall;


