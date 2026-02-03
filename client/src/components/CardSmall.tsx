        // Import React and types
        import React from 'react';
        import { useTranslation } from 'react-i18next';

// Extend window interface for cache buster
declare global {
  interface Window {
    __EKY_IMAGE_CB?: number;
  }
}

interface ImageType {
  url: string;
  width?: number;
}

interface VideoType {
  url: string;
  poster?: ImageType[];
}

interface ThumbnailType {
  url: string;
}

interface CardSmallProps {
  _id?: string;
  name: string;
  breed?: string;
  age?: number;
  size?: string;
  description?: string;
  gender?: string;
  color?: string;
  place?: string;
  images?: ImageType[];
  video?: VideoType;
  thumbnail?: ThumbnailType;
  canEdit?: boolean;
  onViewDetails?: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onDogUpdate?: (props: any) => void;
  onEdit?: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onRemove?: () => void;
  smallImage?: boolean;
  compactDesktop?: boolean;
  vaccinated?: boolean;
  neutered?: boolean;
  likes?: string[];
  user?: any;
  adoptionStatus?: string;
  adoptionQueue?: any[];
}

    export const CardSmall: React.FC<CardSmallProps> = (props) => {
        const { t } = useTranslation();
        const {
          name,
          breed,
          age,
          gender,
          place,
          video,
          thumbnail,
          canEdit,
          onViewDetails,
          onDogUpdate,
          onEdit,
          onRemove,
          likes,
        } = props;

  function toAbsUrl(url?: string) {
    if (!url) return url;
    const cacheBuster = window.__EKY_IMAGE_CB || (window.__EKY_IMAGE_CB = Date.now());
    if (/^https?:\/\//.test(url)) return url + (url.includes('?') ? '&' : '?') + 'cb=' + cacheBuster;
    if (url.startsWith('/uploads/') || url.startsWith('/u/dogs/')) return url + '?cb=' + cacheBuster;
    return url;
  }


  let largestImgUrl: string | undefined = undefined;
  const validImages = (props.images || []).filter(img => img && img.url && typeof img.url === 'string' && img.url.trim() !== '');
  if (validImages.length) {
    const sorted = [...validImages].sort((a, b) => (b.width || 0) - (a.width || 0));
    largestImgUrl = toAbsUrl(sorted[0].url);
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

  return (
    <div
      className="card card-small"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        width: '320px',
        minHeight: '420px',
        margin: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: '12px',
        background: '#fff',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
        {hasVideoUrl ? (
          <video controls width="100%" height="200" poster={posterUrl} style={{ width: '100%', height: '200px', objectFit: 'cover', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
            <source src={videoUrl} />
          </video>
        ) : largestImgUrl ? (
          <img
            src={largestImgUrl}
            alt={name}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
            }}
            onError={e => { (e.target as HTMLImageElement).src = '/img/nany.jpg'; }}
          />
        ) : thumbUrl ? (
          <img
            src={thumbUrl}
            alt={name}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
            }}
            onError={e => { (e.target as HTMLImageElement).src = '/img/nany.jpg'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '200px', background: '#eee', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }} />
        )}
        <div style={{ padding: '16px', width: '100%' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 600 }}>{name}</h3>
          <div style={{ fontSize: '1rem', color: '#555', marginBottom: '8px' }}>
            {breed}
          </div>
          <div style={{ fontSize: '0.95rem', color: '#888', marginBottom: '8px' }}>
            {age} {t('years', { defaultValue: 'years' })}
          </div>
          <div style={{ fontSize: '0.95rem', color: '#888', marginBottom: '8px' }}>
            {gender}
          </div>
          <div style={{ fontSize: '0.95rem', color: '#888', marginBottom: '8px' }}>
            {place}
          </div>
        </div>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0 16px 16px 16px',
        gap: '1px',
        minHeight: '48px',
        alignContent: 'flex-start',
      }}>
        <button
          type="button"
          className="details"
          onClick={e => { e.stopPropagation(); (onViewDetails || (() => {}))(e); }}
          style={{ background: '#3498db', color: '#fff', fontSize: '1.25rem', padding: '12px 24px', borderRadius: '8px', minWidth: '0', minHeight: '0' }}
        >
          {t('details', { defaultValue: 'Details' })}
        </button>
        <button
          type="button"
          className="adopt"
          onClick={e => { e.stopPropagation(); (onDogUpdate || (() => {}))(props); }}
          style={{ background: '#27ae60', color: '#fff', fontSize: '1.25rem', padding: '12px 24px', borderRadius: '8px', minWidth: '0', minHeight: '0' }}
        >
          {t('adopt', { defaultValue: 'Adopt' })}
        </button>
        <button
          type="button"
          className="wishlist"
          onClick={e => { e.stopPropagation(); /* TODO: add to wishlist handler */ }}
          style={{ background: '#8e44ad', color: '#fff', fontSize: '1.25rem', padding: '12px 24px', borderRadius: '8px', minWidth: '0', minHeight: '0' }}
        >
          {t('wishlist', { defaultValue: 'Add to Wishlist' })}
        </button>
        <span style={{ alignSelf: 'center', color: '#888', fontSize: '0.95rem' }}>
          {t('likes', { defaultValue: 'Likes' })}: {Array.isArray(likes) ? likes.length : 0}
        </span>
        {canEdit && onEdit && (
          <button type="button" className="edit" onClick={e => { e.stopPropagation(); onEdit(e); }} style={{ background: '#f1c40f', color: '#222', fontSize: '1.25rem', padding: '12px 24px', borderRadius: '8px', minWidth: '0', minHeight: '0' }}>{t('edit', { defaultValue: 'Edit' })}</button>
        )}
        {canEdit && onRemove && (
          <button type="button" className="remove" onClick={e => { e.stopPropagation(); onRemove(); }} style={{ background: '#e74c3c', color: '#fff', fontSize: '1.25rem', padding: '12px 24px', borderRadius: '8px', minWidth: '0', minHeight: '0' }}>{t('remove', { defaultValue: 'Remove' })}</button>
        )}
      </div>


    </div>
  );
}
            style={{ background: '#f1c40f', color: '#222', fontSize: '1.25rem', padding: '12px 24px', borderRadius: '8px', minWidth: '0', minHeight: '0' }}>{t('edit', { defaultValue: 'Edit' })}</button>






