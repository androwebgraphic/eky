import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
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
  root.style.position = 'absolute';
  root.style.top = '0';
  root.style.left = '0';
  root.style.zIndex = '0';
  root.style.pointerEvents = 'none';
  document.body.appendChild(root);
  return root;
})();

const mapModalRoot = document.getElementById('doglist-map-root') || (() => {
  const root = document.createElement('div');
  root.id = 'doglist-map-root';
  root.style.position = 'absolute';
  root.style.top = '0';
  root.style.left = '0';
  root.style.zIndex = '0';
  root.style.pointerEvents = 'none';
  document.body.appendChild(root);
  return root;
})();

function DogList() {

	const { t } = useTranslation();
	const { token, user } = useAuth();
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
			let query = location.trim();
			if (query.split(/\s+/).length < 2) {
				query += ', Croatia';
			}
			const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
			const data = await resp.json();
			if (data && data.length > 0) {
				setMapCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
			} else {
				setMapError(t('dogDetails.locationNotFound', 'Location not found'));
			}
		} catch (e) {
			setMapError(t('dogDetails.locationSearchFailed', 'Location search failed'));
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
			const data = await resp.json();
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
				/>
			</div>
			<main
				style={{
					display: isDesktop ? 'flex' : 'block',
					flexDirection: isDesktop ? 'row' : undefined,
					alignItems: isDesktop ? 'flex-start' : undefined,
					justifyContent: isDesktop ? 'center' : undefined,
					gap: isDesktop ? 6 : undefined,
					marginTop: '10px',
					position: 'relative',
					overflowY: 'auto',
					WebkitOverflowScrolling: isDesktop ? undefined : 'touch',
				}}
			>
				{filteredDogs.length === 0 ? (
					<div>{t('doglist.empty') || 'No dogs found.'}</div>
				) : isDesktop ? (
					<div
						style={{
							display: 'flex',
							flexDirection: 'row',
							gap: 16,
							flexWrap: 'wrap',
							alignItems: 'flex-start',
							maxWidth: '1200px',
							margin: '30px auto',
							padding: '0 16px',
						}}
					>
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
					<div
						style={{
							position: 'fixed',
							top: '50%',
							left: '50%',
							transform: 'translate(-50%, -50%)',
							width: '85vw',
							maxWidth: '700px',
							height: 'auto',
							background: 'rgba(0,0,0,0.5)',
							borderRadius: 12,
							zIndex: 2147483647,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: 16,
							pointerEvents: 'auto'
						}}
					>
						<div
							style={{
								background: '#fff',
								borderRadius: 16,
								maxWidth: 700,
								width: '95vw',
								maxHeight: '95vh',
								overflow: 'auto',
								position: 'relative',
								padding: 24,
							}}
						>
									<button
										onClick={() => setDetailsDog(null)}
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
											zIndex: 2,
											boxShadow: '0 2px 8px rgba(231,76,60,0.10)',
										}}
										aria-label="Close"
										title="Close"
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
					<div
						style={{
							position: 'fixed',
							top: '10vh',
							left: '50%',
							transform: 'translateX(-50%)',
							width: '95vw',
							maxWidth: '700px',
							height: '85vh',
							maxHeight: '85vh',
							background: 'rgba(0,0,0,0.5)',
							borderRadius: 12,
							zIndex: 2147483647,
							display: 'flex',
							alignItems: 'flex-start',
							justifyContent: 'center',
							padding: 8,
							pointerEvents: 'auto',
							overflowY: 'auto'
						}}
					>
						<div
							style={{
								background: '#fff',
								borderRadius: 12,
								maxWidth: 700,
								width: '95vw',
								height: '100%',
								maxHeight: '100%',
								overflow: 'auto',
								overflowX: 'hidden',
								position: 'relative',
								padding: 16,
								WebkitOverflowScrolling: 'touch'
							}}
						>
							<button
								onClick={() => setDetailsDog(null)}
								style={{
									position: 'absolute',
									top: 8,
									right: 8,
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
									zIndex: 10000,
									boxShadow: '0 2px 8px rgba(231,76,60,0.10)',
								}}
								aria-label="Close"
								title="Close"
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
				<div
					style={{
						position: 'fixed',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						width: '85vw',
						maxWidth: '600px',
						height: 'auto',
						background: 'rgba(0,0,0,0.6)',
						borderRadius: 12,
						zIndex: 2147483647,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: 16,
						pointerEvents: 'auto'
					}}
					onClick={(e) => { if (e.target === e.currentTarget) setMapDog(null); }}
				>
					<div
						style={{
							background: '#fff',
							borderRadius: 16,
							maxWidth: 600,
							width: '95vw',
							maxHeight: '80vh',
							overflow: 'auto',
							position: 'relative',
							padding: 24,
						}}
					>
						<button
							onClick={() => setMapDog(null)}
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
								zIndex: 2,
								boxShadow: '0 2px 8px rgba(231,76,60,0.10)',
							}}
							aria-label="Close"
							title="Close"
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
						<h3 style={{ marginTop: 0, marginBottom: 16 }}>
							📍 {mapDog.name} - {mapDog.location}
						</h3>
						{mapLoading && <div style={{ textAlign: 'center', padding: 20 }}>{t('dogDetails.loadingMap', 'Loading map...')}</div>}
						{mapError && <div style={{ textAlign: 'center', padding: 20, color: '#e74c3c' }}>{mapError}</div>}
						{mapCoords && !mapLoading && (
							<iframe
								title="Dog Location Map"
								width="100%"
								height="350"
								style={{ border: 0, borderRadius: 8 }}
								loading="lazy"
								allowFullScreen
								src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lng - 0.02}%2C${mapCoords.lat - 0.02}%2C${mapCoords.lng + 0.02}%2C${mapCoords.lat + 0.02}&layer=mapnik&marker=${mapCoords.lat}%2C${mapCoords.lng}`}
							/>
						)}
						{!mapCoords && !mapLoading && !mapError && (
							<div style={{ textAlign: 'center', padding: 20, color: '#888' }}>
								{t('dogDetails.noLocationData', 'No location data available')}
							</div>
						)}
					</div>
				</div>,
				mapModalRoot
			)}
		</>
	);
}

export default DogList;