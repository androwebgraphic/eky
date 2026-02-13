import React from 'react';
import { useAuth } from '../contexts/AuthContext';
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
	onViewDetails?: (event?: React.MouseEvent<any, MouseEvent>) => void;
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
	const { isAuthenticated, isInWishlist, addToWishlist, removeFromWishlist, token } = useAuth();
	const [wishlistLoading, setWishlistLoading] = React.useState(false);
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
		if (!url) {
			return url;
		}
		const cacheBuster = (window as any).__EKY_IMAGE_CB || ((window as any).__EKY_IMAGE_CB = Date.now());
		// Dynamically construct API URL based on current hostname
		const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
		const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
		const apiBase = process.env.REACT_APP_API_URL || `${protocol}//${hostname}:3001`;
		if (/^https?:\/\//.test(url)) {
			return url + (url.includes('?') ? '&' : '?') + 'cb=' + cacheBuster;
		}
		if (url.startsWith('/uploads/') || url.startsWith('/u/dogs/')) {
			return apiBase + url + '?cb=' + cacheBuster;
		}
		return url;
	}

	let largestImgUrl: string | undefined = undefined;

	const getImageBase = (url: string) => {
		let cleanUrl = url.split('?')[0];
		const filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);

		let base = filename;

		base = base.replace(/\.(jpg|jpeg|png|webp)$/i, '');

		if (base.includes('-') && !base.startsWith('pexels-')) {
			base = base.replace(/-orig$/, '');
			const uploadedMatch = base.match(/^(.+?)-\d{10,13}-[a-z0-9]{6}-\d{3,4}$/);
			if (uploadedMatch) {
				base = uploadedMatch[1];
			}
		} else if (base.startsWith('pexels-')) {
			base = base.replace(/-orig$/, '');
			const pexelsMatch = base.match(/^pexels-(.+?)-\d+(-\d{10,13}-[a-z0-9]{6}-\d{3,4})?$/);
			if (pexelsMatch) {
				base = pexelsMatch[1];
			}
		}

		return base;
	};

	const validImages = (images || []).filter(img => img && img.url && typeof img.url === 'string' && img.url.trim() !== '');
	const uniqueImages = validImages.filter((img, idx, arr) => {
		const base = getImageBase(img.url);
		return arr.findIndex(other => getImageBase(other.url) === base) === idx;
	});

	if (uniqueImages.length) {
		const sorted = [...uniqueImages].sort((a, b) => (b.width || 0) - (a.width || 0));
		largestImgUrl = toAbsUrl(sorted[0].url);
	}

	const [imgError, setImgError] = React.useState(false);
	const [videoError, setVideoError] = React.useState(false);

	const hasVideoUrl = video && typeof video.url === 'string' && video.url.length > 0;
	const videoUrl = hasVideoUrl ? toAbsUrl(video.url) : undefined;
	let thumbUrl: string | undefined = undefined;
	if (thumbnail && thumbnail.url) {
		thumbUrl = toAbsUrl(thumbnail.url);
	}
	const posterUrl = video && video.poster && video.poster.length
		? toAbsUrl(video.poster[video.poster.length - 1].url)
		: undefined;

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

	const handleAdopt = async () => {
		if (!props._id) {
			return;
		}
		// Get latest token from context or localStorage
		const authToken = token || localStorage.getItem('token');
		if (!isAuthenticated || !authToken) {
			alert(t('alerts.pleaseLoginToAdopt'));
			return;
		}

		if (canEdit) {
			alert(t('alerts.cannotAdoptOwnDog'));
			return;
		}

		if (adoptionStatus && adoptionStatus !== 'available') {
			alert(t('alerts.dogNotAvailableForAdoption') || 'This dog is not available for adoption.');
			return;
		}

		const confirmAdopt = window.confirm(t('alerts.confirmAdoptRequest', { name }));

		if (!confirmAdopt) {
			return;
		}

		try {
			// Dynamically construct API URL based on current hostname
			const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
			const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
			const apiBase = process.env.REACT_APP_API_URL || `${protocol}//${hostname}:3001`;
			console.log('[ADOPT DEBUG] Token being used:', authToken ? authToken.substring(0, 20) + '...' : 'NO TOKEN');
			const response = await fetch(`${apiBase}/api/dogs/${props._id}/adopt-request`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`
				}
			});

			const data = await response.json();

			if (response.ok) {
				alert(t('chat.adoptionConfirmed'));
				// Open chat modal with owner's user ID
				if (typeof window !== 'undefined') {
					// Get dog data which has owner info
					if (data.dog && (data.dog.user || (data.dog.user && data.dog.user._id))) {
						const ownerId = data.dog.user._id || data.dog.user;
						const event = new CustomEvent('openChatModal', { detail: { userId: ownerId } });
						window.dispatchEvent(event);
					} else {
						// Fallback: just open modal
						window.dispatchEvent(new CustomEvent('openChatModal'));
					}
				}
			} else {
				console.error('Server error:', data);
				alert(t('chat.adoptionConfirmError') + ': ' + (data.error || data.message || JSON.stringify(data)));
			}
		} catch (error) {
			console.error('Error sending adoption request:', error);
			alert(t('alerts.errorSendingAdoptionRequest'));
		}
	};

	const handleWishlist = async () => {
		if (!props._id) {
			return;
		}
		if (!isAuthenticated) {
			alert(t('alerts.pleaseLoginToUseWishlist'));
			return;
		}
		setWishlistLoading(true);
		const currentlyInWishlist = isInWishlist(props._id);
		let result;
		if (currentlyInWishlist) {
			result = await removeFromWishlist(props._id);
			if (result.success) {
				alert(t('alerts.removedFromWishlist'));
			} else {
				alert(t('alerts.failedToRemoveFromWishlist') + (result.error || t('alerts.unknownError')));
			}
		} else {
			result = await addToWishlist(props._id);
			if (result.success) {
				alert(t('alerts.addedToWishlist'));
			} else {
				alert(t('alerts.failedToAddToWishlist') + (result.error || t('alerts.unknownError')));
			}
		}
		setWishlistLoading(false);
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
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%', position: 'relative' }}>
					{hasVideoUrl && !videoError ? (
						<div style={{ cursor: 'pointer' }} onClick={e => onViewDetails && onViewDetails(e)} title={t('dogDetails.showMap', 'Show details')}>
							<video
								controls
								width="100%"
								height="200"
								poster={posterUrl}
								style={{ width: '100%', height: '200px', objectFit: 'contain', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', background: '#f5f5f5' }}
								onError={() => setVideoError(true)}
								onClick={e => onViewDetails && onViewDetails(e)}
							>
								<source src={videoUrl} />
							</video>
						</div>
					) : videoError ? (
						<div style={{ width: '100%', height: '200px', background: '#eee', color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>{t('alerts.videoFailedToLoad')}</div>
					) : largestImgUrl && !imgError ? (
						<img
							src={largestImgUrl}
							alt={name}
							style={{ width: '100%', height: '200px', objectFit: 'contain', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', cursor: 'pointer', background: '#f5f5f5' }}
							loading="lazy"
							onError={() => setImgError(true)}
							onClick={e => onViewDetails && onViewDetails(e)}
							title={t('dogDetails.showMap', 'Show details')}
						/>
					) : imgError ? (
						<div style={{ width: '100%', height: '200px', background: '#eee', color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>Image failed to load</div>
					) : thumbUrl && !imgError ? (
						<img
							src={thumbUrl}
							alt={name}
							style={{ width: '100%', height: '200px', objectFit: 'contain', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', cursor: 'pointer', background: '#f5f5f5' }}
							loading="lazy"
							onError={() => setImgError(true)}
							onClick={e => onViewDetails && onViewDetails(e)}
							title={t('dogDetails.showMap', 'Show details')}
						/>
					) : (
						<div style={{ width: '100%', height: '200px', background: '#eee', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }} />
					)}
					{uniqueImages.length > 1 && (
						<div
							title={t('dogDetails.showMoreImages', 'View all images')}
							style={{
								position: 'absolute',
								top: 10,
								right: 10,
								background: 'rgba(0,0,0,0.7)',
								color: '#fff',
								borderRadius: '50%',
								width: 32,
								height: 32,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontWeight: 700,
								fontSize: 16,
								zIndex: 2,
								boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
							}}
						>
							<span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
								{uniqueImages.length}
							</span>
						</div>
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
									onClick={() => onViewDetails && onViewDetails({} as any)}
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
					<button type="button" onClick={onViewDetails} style={{ ...styles.details, flex: '1 1 auto', minWidth: 'fit-content', height: 32, fontSize: 12, padding: '0 12px', borderRadius: 6, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>{t('button.viewDetails', 'Details')}</button>
					<button 
						type="button" 
						onClick={handleAdopt} 
						disabled={adoptionStatus && adoptionStatus !== 'available'}
						style={{
							...styles.adopt,
							flex: '1 1 auto',
							minWidth: 'fit-content',
							height: 32,
							fontSize: 12,
							padding: '0 12px',
							borderRadius: 6,
							cursor: (adoptionStatus && adoptionStatus !== 'available') ? 'not-allowed' : 'pointer',
							textAlign: 'center',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							whiteSpace: 'nowrap',
							opacity: (adoptionStatus && adoptionStatus !== 'available') ? 0.5 : 1
						}}
					>{t('adopt', t('button.adopt', 'Adoptieren'))}</button>
					<button
						type="button"
						onClick={handleWishlist}
						style={{
							background: isInWishlist && props._id && isInWishlist(props._id) ? '#ff4444' : '#43a047',
							color: '#fff',
							border: 'none',
							fontWeight: 600,
							flex: '1 1 auto',
							minWidth: 'fit-content',
							height: 32,
							fontSize: 11,
							padding: '0 8px',
							borderRadius: 6,
							cursor: wishlistLoading ? 'wait' : 'pointer',
							textAlign: 'center',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							opacity: wishlistLoading ? 0.7 : 1,
							boxShadow: isInWishlist && props._id && isInWishlist(props._id) ? '0 0 0 2px #ff4444' : '0 0 0 2px #43a047',
							transition: 'background 0.2s, box-shadow 0.2s',
							whiteSpace: 'nowrap',
						}}
						disabled={wishlistLoading}
					>
						{isInWishlist && props._id && isInWishlist(props._id)
							? <><span style={{fontSize:16,marginRight:4}}>💔</span>{t('button.removeFromList', 'Entfernen')}</>
							: <><span style={{fontSize:16,marginRight:4}}>❤️</span>{t('button.addToList', 'Zur Liste')}</>}
					</button>
					{canEdit && (
						<button type="button" onClick={onEdit} style={{ ...styles.edit, flex: '1 1 auto', minWidth: 'fit-content', height: 32, fontSize: 12, padding: '0 12px', borderRadius: 6, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>{t('edit', t('button.edit', 'Bearbeiten'))}</button>
					)}
					{canEdit && (
						<button type="button" onClick={onRemove} style={{ ...styles.remove, flex: '1 1 auto', minWidth: 'fit-content', height: 32, fontSize: 12, padding: '0 12px', borderRadius: 6, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>{t('remove', t('button.remove', 'Entfernen'))}</button>
					)}
				</div>
			</div>
		</>
	);
}

export default CardSmall;