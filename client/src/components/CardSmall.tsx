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
	size?: string;
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
	user?: {
		_id: string;
		name: string;
		username?: string;
		email?: string;
		phone?: string;
		person?: 'private' | 'organization';
	};
	createdAt?: string;
}

const CardSmall: React.FC<CardSmallProps> = (props) => {
	const { t } = useTranslation();
	const { isAuthenticated, isInWishlist, addToWishlist, removeFromWishlist, token, user: currentUser } = useAuth();
	const [wishlistLoading, setWishlistLoading] = React.useState(false);
		const {
			name = 'Unknown',
			breed = 'Unknown',
			age,
			gender,
			size,
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
			user,
			createdAt,
		} = props;

		// Get location from correct field - dog model uses 'location' field
		const location = (props as any).location || place;

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
		// Handle absolute paths starting with /
		if (url.startsWith('/')) {
			return apiBase + url + '?cb=' + cacheBuster;
		}
		// Handle relative paths (uploads/, u/dogs/, etc.)
		return apiBase + '/' + url.replace(/^\/+/, '') + '?cb=' + cacheBuster;
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
	const [, setImgLoaded] = React.useState(false);
	const [isRetrying, setIsRetrying] = React.useState(false);
	const [retryCount, setRetryCount] = React.useState(0);

	// Handle image error with retry logic
	const handleImgError = React.useCallback(() => {
		if (retryCount < 2) {
			// Retry up to 2 times
			setIsRetrying(true);
			setTimeout(() => {
				setRetryCount(prev => prev + 1);
				setIsRetrying(false);
				// Force re-render by toggling error state
				setImgError(false);
			}, 500);
		} else {
			// After retries, show error
			setImgError(true);
		}
	}, [retryCount]);

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

		// Check if current user is the owner of this dog
		let isOwner = false;
		if (currentUser && user) {
			const currentUserId = currentUser._id.toString();
			// Handle both string and object user formats
			if (typeof user === 'string') {
				isOwner = user === currentUserId;
			} else if (user._id) {
				isOwner = user._id.toString() === currentUserId;
			}
		}
		if (isOwner) {
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
		<div
			className="card card-small"
			style={{
				maxWidth: window.innerWidth > 900 ? 'none' : 'calc(25% - 6px)',
				width: window.innerWidth > 900 ? 'auto' : 'calc(25% - 6px)',
				display: 'flex',
				flexDirection: 'column',
				flex: window.innerWidth > 900 ? '0 0 auto' : '0 0 calc(25% - 6px)',
			}}
		>
				<div className="card-small-image-wrapper">
					{hasVideoUrl && !videoError ? (
							<div onClick={e => onViewDetails && onViewDetails(e)} title={t('dogDetails.showMap', 'Show details')}>
								<video
									controls
									width="100%"
									height="200"
									poster={posterUrl}
									className="card-small-video"
									onError={() => setVideoError(true)}
									onClick={e => onViewDetails && onViewDetails(e)}
								>
									<source src={videoUrl} />
								</video>
							</div>
						) : videoError ? (
							<div className="card-small-image-error">{t('alerts.videoFailedToLoad')}</div>
						) : largestImgUrl && !imgError ? (
							<img
								key={`main-${retryCount}`}
								src={largestImgUrl}
								alt={name}
								className={`card-small-image ${isRetrying ? 'loading' : ''}`}
								loading="lazy"
								onError={handleImgError}
								onLoad={() => setImgLoaded(true)}
								onClick={e => onViewDetails && onViewDetails(e)}
								title={t('dogDetails.showMap', 'Show details')}
							/>
						) : imgError ? (
							<div className="card-small-image-error">{t('alerts.imageFailedToLoad') || 'Image failed to load'}</div>
						) : thumbUrl && !imgError ? (
							<img
								key={`thumb-${retryCount}`}
								src={thumbUrl}
								alt={name}
								className={`card-small-image ${isRetrying ? 'loading' : ''}`}
								loading="lazy"
								onError={handleImgError}
								onLoad={() => setImgLoaded(true)}
								onClick={e => onViewDetails && onViewDetails(e)}
								title={t('dogDetails.showMap', 'Show details')}
							/>
						) : (
							<div className="card-small-placeholder" />
						)}
						{uniqueImages.length > 1 && (
							<div
								className="multi-photo-indicator"
								title={t('dogDetails.showMoreImages', 'View all images')}
							>
								<span className="multi-photo-icon">
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
									{uniqueImages.length}
								</span>
							</div>
						)}
				</div>
				<div className="card-small-content">
					{adoptionStatus && adoptionStatus !== 'available' && (
						<div className={`adoption-status-badge ${adoptionStatus === 'adopted' ? 'adopted' : ''}`}>
							{t(`adoptionStatus.${adoptionStatus}`, adoptionStatus)}
						</div>
					)}
					<div className="card-small-name">{name}</div>
					<div className="card-small-field"><strong className="field-label">{t('fields.breed', 'Breed')}</strong> {breed}</div>
					{age !== undefined && <div className="card-small-field secondary"><strong className="field-label">{t('fields.age', 'Age')}</strong> {age}</div>}
					{gender && <div className="card-small-field secondary"><strong className="field-label">{t('fields.gender', 'Gender')}</strong> {t(`gender.${gender}`, gender)}</div>}
					{size && <div className="card-small-field secondary"><strong className="field-label">{t('fields.size', 'Size')}</strong> {t(`size.${size}`, size)}</div>}
					{location && (
						<div className="card-small-location">
							<strong>{t('fields.location', 'Location')}</strong>
							<span
								className="location-text"
								onClick={() => onViewDetails && onViewDetails({} as any)}
								title={t('dogDetails.showMap', 'Show map')}
							>
								{location}
							</span>
						</div>
					)}
					{vaccinated && <div className="card-small-health">{t('fields.vaccinated', 'Vaccinated')}</div>}
					{user && (
						<div className="card-small-user">
							<span className="user-label">{t('fields.postedBy', 'Posted by')}:</span>{' '}
							<span className="user-name">
								{user.username || user.name}
							</span>
						</div>
					)}
					{createdAt && (
						<div className="card-small-date">
							{new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
						</div>
					)}
				</div>
				<div className="card-small-actions">
					<button type="button" onClick={onViewDetails} className="card-small-btn btn-details">{t('button.viewDetails', 'Details')}</button>
					<button 
						type="button" 
						onClick={handleAdopt} 
						disabled={adoptionStatus && adoptionStatus !== 'available'}
						className="card-small-btn btn-adopt"
					>
						{adoptionStatus && adoptionStatus !== 'available' 
							? t(`adoptionStatus.${adoptionStatus}`, adoptionStatus)
							: t('adopt', t('button.adopt', 'Adoptieren'))
						}
					</button>
					<button
						type="button"
						onClick={handleWishlist}
						className={`card-small-btn btn-wishlist ${isInWishlist && props._id && isInWishlist(props._id) ? 'in-wishlist' : ''}`}
						disabled={wishlistLoading}
					>
						{isInWishlist && props._id && isInWishlist(props._id)
							? <div className="wishlist-heart"><span className="check-mark">✓</span>❤️<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="menu-icon"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></div>
							: <div className="wishlist-heart"><span>❤️</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="menu-icon"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></div>}
					</button>
					{canEdit && (
						<button type="button" onClick={onEdit} className="card-small-btn btn-edit">{t('edit', t('button.edit', 'Bearbeiten'))}</button>
					)}
					{canEdit && (
						<button type="button" onClick={onRemove} className="card-small-btn btn-remove">{t('remove', t('button.remove', 'Entfernen'))}</button>
					)}
				</div>
			</div>
	);
}

export default CardSmall;