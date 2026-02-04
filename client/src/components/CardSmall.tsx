import React from 'react';
import { useTranslation } from 'react-i18next';

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
export interface CardSmallProps {
	_id?: string;
	name: string;
	breed?: string;
	age?: number;
	gender?: string;
	place?: string;
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
	likes?: number;
	images?: ImageType[];
	adoptionStatus?: string;
	adoptionQueue?: any[];
}

const CardSmall: React.FC<CardSmallProps> = (props) => {
	const { t } = useTranslation();
		       const {
			       name = 'Unknown',
			       breed = 'Unknown',
			       age,
			       gender,
			       place,
			       video,
			       thumbnail,
			       canEdit,
			       onViewDetails,
			       onEdit,
			       onRemove,
			       vaccinated,
			       images,
			       adoptionStatus,
		       } = props;

	function toAbsUrl(url?: string) {
		if (!url) return url;
		const cacheBuster = (window as any).__EKY_IMAGE_CB || ((window as any).__EKY_IMAGE_CB = Date.now());
		// Use backend URL from env or default
		const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001';
		if (/^https?:\/\//.test(url)) return url + (url.includes('?') ? '&' : '?') + 'cb=' + cacheBuster;
		if (url.startsWith('/uploads/') || url.startsWith('/u/dogs/')) {
			// Prepend backend URL if not already absolute
			return apiBase + url + '?cb=' + cacheBuster;
		}
		return url;
	}

	let largestImgUrl: string | undefined = undefined;
	const validImages = (images || []).filter(img => img && img.url && typeof img.url === 'string' && img.url.trim() !== '');
	if (validImages.length) {
		const sorted = [...validImages].sort((a, b) => (b.width || 0) - (a.width || 0));
		largestImgUrl = toAbsUrl(sorted[0].url);
	}

	const [imgError, setImgError] = React.useState(false);
	const [videoError, setVideoError] = React.useState(false);

	const posterUrl = video && video.poster && video.poster.length
		? toAbsUrl(video.poster[video.poster.length - 1].url)
		: undefined;
	const hasVideoUrl = video && typeof video.url === 'string' && video.url.length > 0;
	const videoUrl = hasVideoUrl ? toAbsUrl(video.url) : undefined;
	let thumbUrl: string | undefined = undefined;
	if (thumbnail && thumbnail.url) {
		thumbUrl = toAbsUrl(thumbnail.url);
	}

	// Button color palette
	const styles = {
	 details: {
	 background: '#72211f', color: '#fff', border: 'none', fontWeight: 600
	 },
		adopt: {
			background: '#43a047', color: '#fff', border: 'none', fontWeight: 600
		},
		wishlist: {
			background: '#dbb69d', color: '#fff', border: 'none', fontWeight: 600
		},
		edit: {
			background: 'orange', color: '#fff', border: 'none', fontWeight: 600
		},
		remove: {
			background: '#d32f2f', color: '#fff', border: 'none', fontWeight: 600
		}
	};

	// Button handlers
	const handleAdopt = () => {
		alert(t('Adopt functionality coming soon!'));
	};
	const handleWishlist = () => {
		alert(t('Wishlist functionality coming soon!'));
	};

		       return (
			       <>
					       <style>{`
						       @media (max-width: 600px) {
							       .card.card-small {
								       min-width: 92vw !important;
								       max-width: none !important;
								       flex: 0 0 92vw !important;
							       }
						       }
					       `}</style>
										       <div
											       className="card card-small"
											       style={{
												       display: 'flex',
												       flexDirection: 'column',
												       borderRadius: 12,
												       boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
												       background: '#fff',
												       margin: '16px auto',
												       width: '100%',
												       maxWidth: 420,
												       overflow: 'hidden',
												       position: 'relative',
												       boxSizing: 'border-box',
											       }}
										       >
					       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
							{hasVideoUrl && !videoError ? (
								<video
									controls
									width="100%"
									height="200"
									poster={posterUrl}
									style={{ width: '100%', height: '200px', objectFit: 'cover', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
									onError={() => setVideoError(true)}
								>
									<source src={videoUrl} />
								</video>
							) : videoError ? (
								<div style={{ width: '100%', height: '200px', background: '#eee', color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>Video failed to load</div>
							) : largestImgUrl && !imgError ? (
								<img
									src={largestImgUrl}
									alt={name}
									style={{ width: '100%', height: '200px', objectFit: 'cover', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
									loading="lazy"
									onError={() => setImgError(true)}
								/>
							) : imgError ? (
								<div style={{ width: '100%', height: '200px', background: '#eee', color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>Image failed to load</div>
							) : thumbUrl && !imgError ? (
								<img
									src={thumbUrl}
									alt={name}
									style={{ width: '100%', height: '200px', objectFit: 'cover', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}
									loading="lazy"
									onError={() => setImgError(true)}
								/>
							) : (
								<div style={{ width: '100%', height: '200px', background: '#eee', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }} />
							)}
						       <div style={{ padding: '16px', width: '100%' }}>
								       <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{name}</div>
								       <div style={{ color: '#666', fontSize: 15, marginBottom: 4 }}>{t('fields.breed', 'Breed')}: {breed}</div>
								       <div style={{ color: '#888', fontSize: 14, marginBottom: 4 }}>
									       {age !== undefined && <span>{t('fields.age', 'Age')}: {age} </span>}
									       {gender && <span>{t('fields.gender', 'Gender')}: {t(`gender.${gender}`, gender)}</span>}
								       </div>
									       {(place || (props as any).location) && (
										       <div style={{ color: '#888', fontSize: 14, marginBottom: 4 }}>
											       {t('fields.location', 'Location')}: 
													       <span 
														       style={{color:'#1976d2',marginLeft:4, cursor:'pointer', textDecoration:'underline'}}
														       onClick={() => onViewDetails && onViewDetails({} as any /* signal map click */)}
														       title={t('dogDetails.showMap', 'Show map')}
													       >
														       {place || (props as any).location}
													       </span>
										       </div>
									       )}
								   {vaccinated && <div style={{ color: '#388e3c', fontSize: 13, marginBottom: 4 }}>{t('fields.vaccinated', 'Vaccinated')}</div>}
								   {adoptionStatus && <div style={{ color: '#1976d2', fontSize: 13, marginBottom: 4 }}>{t('fields.adoptionStatus', 'Adoption Status')}: {t(`adoptionStatus.${adoptionStatus}`, adoptionStatus)}</div>}
						       </div>
					       </div>
					       <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center', padding: '8px 8px 16px 8px', width: '100%' }}>
											   <button type="button" onClick={onViewDetails} style={{ ...styles.details, flex: '1 1 40%', minWidth: 60, maxWidth: 60, height: 28, fontSize: 12, padding: '0', borderRadius: 6, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('button.viewDetails', 'Details')}</button>
									       <button type="button" onClick={handleAdopt} style={{ ...styles.adopt, flex: '1 1 40%', minWidth: 60, maxWidth: 60, height: 28, fontSize: 12, padding: '0', borderRadius: 6, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('adopt', t('button.adopt', 'Adoptieren'))}</button>
									       <button type="button" onClick={handleWishlist} style={{ ...styles.wishlist, flex: '1 1 40%', minWidth: 60, maxWidth: 60, height: 28, fontSize: 12, padding: '0', borderRadius: 6, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('wishlist', t('button.addToList', 'Zur Liste'))}</button>
									       {canEdit && (
										       <button type="button" onClick={onEdit} style={{ ...styles.edit, flex: '1 1 40%', minWidth: 60, maxWidth: 60, height: 28, fontSize: 12, padding: '0', borderRadius: 6, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('edit', t('button.edit', 'Bearbeiten'))}</button>
									       )}
									       {canEdit && (
										       <button type="button" onClick={onRemove} style={{ ...styles.remove, flex: '1 1 40%', minWidth: 60, maxWidth: 60, height: 28, fontSize: 12, padding: '0', borderRadius: 6, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('remove', t('button.remove', 'Entfernen'))}</button>
									       )}
					       </div>
				       </div>
			       </>
		       );
		}

export default CardSmall;
