import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useLocation } from 'react-router-dom';
import CardSmall from '../CardSmall';
import EditDogModal from './EditDogModal';
import RemoveDogModal from './RemoveDogModal';
import DogDetails from './DogDetails';
import type { DogDetailsProps } from './DogDetails';
import { useAuth } from '../../contexts/AuthContext';
import Search from '../Search';

const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  // Dynamically construct API URL based on current hostname
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  return `${protocol}//${hostname}:3001`;
};

// Portal containers for DogList modals
const detailsModalRoot = document.getElementById('doglist-details-root') || (() => {
  const root = document.createElement('div');
  root.id = 'doglist-details-root';
  root.style.position = 'fixed';
  root.style.top = '0';
  root.style.left = '0';
  root.style.zIndex = '2147483647';
  root.style.pointerEvents = 'auto';
  document.body.appendChild(root);
  return root;
})();

const mapModalRoot = document.getElementById('doglist-map-root') || (() => {
  const root = document.createElement('div');
  root.id = 'doglist-map-root';
  root.style.position = 'fixed';
  root.style.top = '0';
  root.style.left = '0';
  root.style.zIndex = '2147483647';
  root.style.pointerEvents = 'auto';
  document.body.appendChild(root);
  return root;
})();

function DogList() {

	const { t } = useTranslation();
	const { token, user } = useAuth();
	const [searchParams] = useSearchParams();
	const location = useLocation();
	const [dogs, setDogs] = useState<DogDetailsProps[]>([]);
	const [editDog, setEditDog] = useState<DogDetailsProps | null>(null);
	const [removeDog, setRemoveDog] = useState<DogDetailsProps | null>(null);
	const [detailsDog, setDetailsDog] = useState<DogDetailsProps | null>(null);
	const [mapDog, setMapDog] = useState<{ name: string; location: string } | null>(null);
	const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
	const [mapLoading, setMapLoading] = useState(false);
	const [mapError, setMapError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Search/filter state
	const [searchTerm, setSearchTerm] = useState('');
	const [genderFilter, setGenderFilter] = useState('');
	const [sizeFilter, setSizeFilter] = useState('');
	const [ageFilter, setAgeFilter] = useState('');
	const [searchActive, setSearchActive] = useState(false);

	// Ref for search input to auto-focus when #search is in URL hash
	const searchInputRef = React.useRef<HTMLInputElement>(null);

	// Debug logging on mount
	React.useEffect(() => {
		console.log('[DOG-LIST] ========== COMPONENT MOUNTED ==========');
		console.log('[DOG-LIST] Current URL:', window.location.href);
		console.log('[DOG-LIST] pathname:', window.location.pathname);
		console.log('[DOG-LIST] location.hash:', location.hash);
		console.log('[DOG-LIST] searchInputRef.current:', searchInputRef.current);
	}, []);

		// Auto-focus search input if #search is in URL hash
	// eslint-disable-next-line react-hooks/exhaustive-deps
	React.useEffect(() => {
		console.log('[FOCUS] ========== FOCUS EFFECT RUNNING ==========');
		console.log('[FOCUS] location.hash:', location.hash);
		console.log('[FOCUS] location.pathname:', location.pathname);
		console.log('[FOCUS] location.search:', location.search);
		console.log('[FOCUS] window.location.hash:', window.location.hash);
		console.log('[FOCUS] window.location.href:', window.location.href);
		
		if (location.hash === '#search') {
			console.log('[FOCUS] ✅ #search detected in URL!');
			// Highlight search
			setSearchActive(true);
			// Scroll to top first
			window.scrollTo(0, 0);
			console.log('[FOCUS] Scrolled to top');
			// Wait for component to fully render, then focus
			setTimeout(() => {
				console.log('[FOCUS] First timeout - attempting to focus');
				console.log('[FOCUS] searchInputRef.current:', searchInputRef.current);
				if (searchInputRef.current) {
					searchInputRef.current.focus();
					// Also click to trigger mobile keyboard (iOS limitation: keyboard won't show programmatically)
					searchInputRef.current.click();
					console.log('[FOCUS] ✅ Search input focused and clicked!');
					// Clear hash after focusing
					window.history.replaceState(null, '', window.location.pathname);
					console.log('[FOCUS] Hash cleared from URL');
					// Remove highlight after 2 seconds
					setTimeout(() => setSearchActive(false), 2000);
				} else {
					console.error('[FOCUS] ❌ Search input ref is null, trying again...');
					// Try again with longer delay
					setTimeout(() => {
						console.log('[FOCUS] Second timeout - trying again');
						console.log('[FOCUS] searchInputRef.current:', searchInputRef.current);
						if (searchInputRef.current) {
							searchInputRef.current.focus();
							searchInputRef.current.click();
							console.log('[FOCUS] ✅ Search input focused and clicked on second attempt!');
							window.history.replaceState(null, '', window.location.pathname);
							setTimeout(() => setSearchActive(false), 2000);
						} else {
							console.error('[FOCUS] ❌ Still unable to focus after two attempts');
						}
					}, 1000);
				}
			}, 600);
		} else {
			console.log('[FOCUS] ❌ #search not in URL hash');
		}
		console.log('[FOCUS] ========== FOCUS EFFECT END ==========');
	}, [location.hash]);

	// Read URL search parameters from footer search modal
	useEffect(() => {
		const search = searchParams.get('search');
		const gender = searchParams.get('gender');
		const size = searchParams.get('size');
		
		if (search) setSearchTerm(search);
		if (gender) setGenderFilter(gender);
		if (size) setSizeFilter(size);
	}, [searchParams]);

	// Filter dogs based on search/filters
	const filteredDogs = useMemo(() => {
		return dogs.filter(dog => {
			// Search term matches breed, size, OR location (NOT name)
			const term = searchTerm.toLowerCase();
			const dogLocation = (dog as any).location || dog.place;
			const matchesSearch = !term || 
				(dog.breed && dog.breed.toLowerCase().includes(term)) ||
				(dog.size && dog.size.toLowerCase().includes(term)) ||
				(dogLocation && dogLocation.toLowerCase().includes(term));
			
			// Gender filter
			const matchesGender = !genderFilter || dog.gender === genderFilter;
			
			// Size filter
			const matchesSize = !sizeFilter || dog.size === sizeFilter;
			
			// Age filter
			let matchesAge = !ageFilter;
			if (ageFilter && dog.age !== undefined && dog.age !== null) {
				const age = parseFloat(String(dog.age));
				switch (ageFilter) {
					case 'puppy':
						matchesAge = age >= 0 && age <= 1;
						break;
					case 'young':
						matchesAge = age > 1 && age <= 3;
						break;
					case 'adult':
						matchesAge = age > 3 && age <= 8;
						break;
					case 'senior':
						matchesAge = age > 8;
						break;
				}
			}
			
			return matchesSearch && matchesGender && matchesSize && matchesAge;
		});
	}, [dogs, searchTerm, genderFilter, sizeFilter, ageFilter]);

	// Geocode location for map modal
	const openMapForDog = async (dog: DogDetailsProps) => {
		const location = dog.place || (dog as any).location;
		if (!location) return;
		setMapDog({ name: dog.name, location });
		setMapLoading(true);
		setMapError(null);
		setMapCoords(null);
		try {
			// Use location as-is - don't append country to avoid breaking international cities
			const query = location.trim();
			console.log('[MAP] Geocoding location:', query);
			const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
				headers: {
					'User-Agent': 'EkyApp/1.0'
				}
			});
			const data = await resp.json();
			console.log('[MAP] Geocoding response:', data);
			if (data && data.length > 0) {
				setMapCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
			} else {
				console.log('[MAP] No coordinates found, will use search-based map');
				// Don't show error - just use search-based map as fallback
			}
		} catch (e) {
			console.error('[MAP] Geocoding error:', e);
			// Don't show error - just use search-based map as fallback
		} finally {
			setMapLoading(false);
		}
	};

		useEffect(() => {
		const fetchDogs = () => {
			setLoading(true);
			const headers: Record<string, string> = {};
			// Get token from context or fallback to localStorage
			const authToken = token || localStorage.getItem('token');
			if (authToken) {
				headers['Authorization'] = `Bearer ${authToken}`;
			}
			fetch(`${getApiUrl()}/api/dogs`, { headers })
				.then(res => res.json())
				.then(data => {
					setDogs(Array.isArray(data) ? data : []);
					setLoading(false);
				})
				.catch(err => {
					setError('Failed to load dogs');
					setLoading(false);
				});
		};

		fetchDogs();
	}, [token]);

	const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 900;
	const handleEdit = (dog: DogDetailsProps) => setEditDog(dog);
	const handleRemove = (dog: DogDetailsProps) => setRemoveDog(dog);
	const handleDetails = (dog: DogDetailsProps) => setDetailsDog(dog);
	const handleEditSave = async (updatedDog: any) => {
		// Refetch all dogs from server to ensure fresh data with all images
		setEditDog(null);
		setLoading(true);
		fetch(`${getApiUrl()}/api/dogs`)
			.then(res => res.json())
			.then(data => {
				setDogs(Array.isArray(data) ? data : []);
				setLoading(false);
			})
			.catch(err => {
				setError('Failed to refresh dogs after update');
				setLoading(false);
			});
	};
	const handleRemoveConfirm = async () => {
		if (!removeDog) return;
		const headers: Record<string, string> = {};
		// Get token from context or fallback to localStorage
		const authToken = token || localStorage.getItem('token');
		if (authToken) {
			headers['Authorization'] = `Bearer ${authToken}`;
		}
		try {
			const resp = await fetch(`${getApiUrl()}/api/dogs/${removeDog._id}`, { 
				method: 'DELETE',
				headers
			});
			if (!resp.ok) {
				setRemoveDog(null);
				return;
			}
			setRemoveDog(null);
			setLoading(true);
			fetch(`${getApiUrl()}/api/dogs`)
				.then(res => res.json())
				.then(data => {
					setDogs(Array.isArray(data) ? data : []);
					setLoading(false);
				});
		} catch (err) {
			setRemoveDog(null);
		}
	};

	if (loading) return <div>{t('doglist.loading') || 'Loading dogs...'}</div>;
	if (error) return <div style={{ color: 'red' }}>{error}</div>;

	return (
		<>
		{/* Search bar */}
		<div style={{ padding: '0 16px', paddingTop: window.innerWidth > 768 ? '80px' : '80px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
			<Search
				searchTerm={searchTerm}
				onSearchChange={setSearchTerm}
				genderFilter={genderFilter}
				onGenderChange={setGenderFilter}
				sizeFilter={sizeFilter}
				onSizeChange={setSizeFilter}
				ageFilter={ageFilter}
				onAgeChange={setAgeFilter}
				searchInputRef={searchInputRef}
				searchActive={searchActive}
			/>
		</div>
			<div style={{ maxWidth: '1600px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
			<main
				style={{
					display: isDesktop ? 'block' : 'block',
					marginTop: '10px',
					position: 'relative',
					overflowY: 'auto',
					WebkitOverflowScrolling: isDesktop ? undefined : 'touch',
				}}
			>
				{filteredDogs.length === 0 ? (
					<div>{t('doglist.empty') || 'No dogs found.'}</div>
				) : isDesktop ? (
					<div className="dog-list-grid">
						{filteredDogs.map(dog => {
							// Deduplicate images by base name before passing to CardSmall
							const getImageBase = (url: string) => {
								let cleanUrl = url.split('?')[0];
								const filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
								const base = filename.replace(/(-\d{3,}(?:-[a-z0-9]+)?-(?:320|640|1024|orig))?(-(?:320|640|1024|orig))?(\.(jpg|jpeg|png|webp))$/i, '')
									.replace(/(-(?:320|640|1024|orig))?(\.(jpg|jpeg|png|webp))$/i, '')
									.replace(/(\.(jpg|jpeg|png|webp))$/i, '');
								return base;
							};
							let dedupedImages = dog.images;
							if (Array.isArray(dog.images)) {
								dedupedImages = dog.images.filter((img, idx, arr) => {
									if (!img || !img.url) return false;
									const base = getImageBase(img.url);
									return arr.findIndex(other => other && other.url && getImageBase(other.url) === base) === idx;
								});
							}
							const isOwner = user && dog.user && (
								typeof dog.user === 'string' 
									? dog.user === user._id 
									: dog.user._id === user._id
							);
							const isSuperAdmin = user?.role === 'superadmin';
							const canEdit = isOwner || isSuperAdmin;

							return (
								<CardSmall
									key={dog._id}
									{...dog}
									images={dedupedImages}
									canEdit={canEdit}
									onEdit={() => handleEdit(dog)}
									onRemove={() => handleRemove(dog)}
									onViewDetails={e => {
										// Always close any open modals before opening new details
										setEditDog(null);
										setDetailsDog(null);
										setMapDog(null);
										if (e && Object.keys(e).length === 0) {
											// Location click - open map only
											openMapForDog(dog);
										} else {
											handleDetails(dog);
										}
									}}
								/>
							);
						})}
					</div>
				) : (
					<div style={{ padding: '0 16px' }}>
						{filteredDogs.map((dog, index) => {
						// Deduplicate images by base name before passing to CardSmall
						const getImageBase = (url: string) => {
							let cleanUrl = url.split('?')[0];
							const filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
							const base = filename.replace(/(-\d{3,}(?:-[a-z0-9]+)?-(?:320|640|1024|orig))?(-(?:320|640|1024|orig))?(\.(jpg|jpeg|png|webp))$/i, '')
								.replace(/(-(?:320|640|1024|orig))?(\.(jpg|jpeg|png|webp))$/i, '')
								.replace(/(\.(jpg|jpeg|png|webp))$/i, '');
							return base;
						};
						let dedupedImages = dog.images;
						if (Array.isArray(dog.images)) {
							dedupedImages = dog.images.filter((img, idx, arr) => {
								if (!img || !img.url) return false;
								const base = getImageBase(img.url);
								return arr.findIndex(other => other && other.url && getImageBase(other.url) === base) === idx;
							});
						}
						const isOwner = user && dog.user && (
							typeof dog.user === 'string' 
								? dog.user === user._id 
								: dog.user._id === user._id
						);
						const isSuperAdmin = user?.role === 'superadmin';
						const canEdit = isOwner || isSuperAdmin;

							return (
								<div key={dog._id} style={{ marginBottom: index < filteredDogs.length - 1 ? '20px' : '0' }}>
									<CardSmall
										{...dog}
										images={dedupedImages}
										canEdit={canEdit}
										onEdit={() => handleEdit(dog)}
										onRemove={() => handleRemove(dog)}
										onViewDetails={e => {
											// Always close any open modals before opening new details
											setEditDog(null);
											setDetailsDog(null);
											setMapDog(null);
											if (e && Object.keys(e).length === 0) {
												// Location click - open map only
												openMapForDog(dog);
											} else {
												handleDetails(dog);
											}
										}}
									/>
								</div>
							);
						})
					}
					</div>
				)}
			</main>
			</div>
			{editDog && (
				<EditDogModal
					key={editDog._id || Math.random()}
					dog={editDog}
					onSave={handleEditSave}
					onClose={() => setEditDog(null)}
				/>
			)}
			{removeDog && (
				<RemoveDogModal
					dog={removeDog}
					onConfirm={handleRemoveConfirm}
					onClose={() => setRemoveDog(null)}
				/>
			)}
			{/* Details panel on desktop, modal on mobile */}
			{detailsDog && ReactDOM.createPortal(
				(isDesktop ? (
					<div className="doglist-details-modal desktop">
						<div className="doglist-details-content">
							<button
								className="doglist-close-btn"
								onClick={() => setDetailsDog(null)}
								aria-label="Close"
								title="Close"
							>
								<span>×</span>
							</button>
							<DogDetails
								key={detailsDog._id}
								{...detailsDog}
								gender={
									detailsDog.gender === 'male' || detailsDog.gender === 'female'
										? detailsDog.gender
										: undefined
								}
								user={detailsDog.user || null}
								place={detailsDog.place}
								location={detailsDog.location || detailsDog.place}
								onClose={() => setDetailsDog(null)}
							/>
						</div>
					</div>
				) : (
					<div className="doglist-details-modal mobile">
						<div className="doglist-details-content">
							<button
								className="doglist-close-btn mobile"
								onClick={() => setDetailsDog(null)}
								aria-label="Close"
								title="Close"
							>
								<span>×</span>
							</button>
							<DogDetails
								key={detailsDog._id}
								{...detailsDog}
								gender={
									detailsDog.gender === 'male' || detailsDog.gender === 'female'
										? detailsDog.gender
										: undefined
								}
								user={detailsDog.user || null}
								place={detailsDog.place}
								location={detailsDog.location || detailsDog.place}
								onClose={() => setDetailsDog(null)}
							/>
						</div>
					</div>
				)),
				detailsModalRoot
			)}
			{/* Map-only modal */}
			{mapDog && ReactDOM.createPortal(
				<div className="doglist-map-modal" onClick={(e) => { if (e.target === e.currentTarget) setMapDog(null); }}>
					<div className="doglist-map-content">
						<button
							className="doglist-close-btn"
							onClick={() => setMapDog(null)}
							aria-label="Close"
							title="Close"
						>
							<span>×</span>
						</button>
						<h3 className="doglist-map-title">
							📍 {mapDog.name} - {mapDog.location}
						</h3>
						{mapLoading && <div style={{ textAlign: 'center', padding: 20 }}>{t('dogDetails.loadingMap', 'Loading map...')}</div>}
						{mapError && <div style={{ textAlign: 'center', padding: 20, color: '#e74c3c' }}>{mapError}</div>}
						{mapCoords && !mapLoading && (
							<iframe
								className="doglist-map-iframe"
								title="Dog Location Map"
								loading="lazy"
								allowFullScreen
								src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lng - 0.005}%2C${mapCoords.lat - 0.005}%2C${mapCoords.lng + 0.005}%2C${mapCoords.lat + 0.005}&layer=mapnik&marker=${mapCoords.lat}%2C${mapCoords.lng}`}
							/>
						)}
						{!mapCoords && !mapLoading && mapDog && (
							<iframe
								className="doglist-map-iframe"
								title="Dog Location Map"
								loading="lazy"
								allowFullScreen
								src={`https://www.openstreetmap.org/export/embed.html?search=${encodeURIComponent(mapDog.location)}&layer=mapnik`}
							/>
						)}
					</div>
				</div>,
				mapModalRoot
			)}
		</>
	);
}

export default DogList;