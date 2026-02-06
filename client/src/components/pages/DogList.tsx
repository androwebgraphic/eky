



import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import CardSmall from '../CardSmall';
import EditDogModal from './EditDogModal';
import RemoveDogModal from './RemoveDogModal';
import DogDetails from './DogDetails';
import type { DogDetailsProps } from './DogDetails';
import { useAuth } from '../../contexts/AuthContext';
import Search from '../Search';
const API_URL = process.env.REACT_APP_API_URL || '';

function DogList() {

	const { t } = useTranslation();
	const { token } = useAuth();
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
	const [locationFilter, setLocationFilter] = useState('');

	// Get unique locations for filter dropdown
	const availableLocations = useMemo(() => {
		const locations = dogs
			.map(dog => dog.place || (dog as any).location)
			.filter((loc): loc is string => !!loc);
		return Array.from(new Set(locations)).sort();
	}, [dogs]);

	// Filter dogs based on search/filters
	const filteredDogs = useMemo(() => {
		return dogs.filter(dog => {
			// Search term matches name or breed
			const term = searchTerm.toLowerCase();
			const matchesSearch = !term || 
				(dog.name && dog.name.toLowerCase().includes(term)) ||
				(dog.breed && dog.breed.toLowerCase().includes(term));
			
			// Gender filter
			const matchesGender = !genderFilter || dog.gender === genderFilter;
			
			// Size filter
			const matchesSize = !sizeFilter || dog.size === sizeFilter;
			
			// Location filter
			const dogLocation = dog.place || (dog as any).location;
			const matchesLocation = !locationFilter || dogLocation === locationFilter;
			
			return matchesSearch && matchesGender && matchesSize && matchesLocation;
		});
	}, [dogs, searchTerm, genderFilter, sizeFilter, locationFilter]);

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
		setLoading(true);
		fetch(`${API_URL}/api/dogs`)
			.then(res => res.json())
			.then(data => {
				setDogs(Array.isArray(data) ? data : []);
				setLoading(false);
			})
			.catch(err => {
				setError('Failed to load dogs');
				setLoading(false);
			});
	}, []);

	const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 900;
	const handleEdit = (dog: DogDetailsProps) => setEditDog(dog);
	const handleRemove = (dog: DogDetailsProps) => setRemoveDog(dog);
	const handleDetails = (dog: DogDetailsProps) => setDetailsDog(dog);
	const handleEditSave = async (updatedDog: any) => {
		// Use FormData for PATCH with files
		const formData = new FormData();
		// Append all fields except images
		Object.entries(updatedDog).forEach(([key, value]) => {
			if (key === 'images' && Array.isArray(value)) {
				value.forEach((file: File) => {
					formData.append('media', file);
				});
			} else if (value !== undefined && value !== null) {
				// Only append string or Blob/File, otherwise convert to string
				   // Special handling for gender: skip if null, 'null', or empty string
				   if (
					   key === 'gender' &&
					   (value === null || value === 'null' || value === '')
				   ) {
					   // Do not append gender field
					   return;
				   }
				   if (typeof value === 'string' || value instanceof Blob) {
					   formData.append(key, value);
				   } else {
					   formData.append(key, String(value));
				   }
			}
		});
		await fetch(`${API_URL}/api/dogs/${updatedDog._id}`, {
			method: 'PATCH',
			body: formData,
			credentials: 'include',
		});
		setEditDog(null);
		setLoading(true);
		fetch(`${API_URL}/api/dogs`)
			.then(res => res.json())
			.then(data => {
				setDogs(Array.isArray(data) ? data : []);
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
		console.log('[DELETE DEBUG] Deleting dog:', removeDog._id, 'with token:', authToken ? 'present' : 'missing');
		try {
			const resp = await fetch(`${API_URL}/api/dogs/${removeDog._id}`, { 
				method: 'DELETE',
				headers
			});
			const data = await resp.json();
			console.log('[DELETE DEBUG] Response status:', resp.status, 'data:', data);
			if (!resp.ok) {
				console.error('[DELETE DEBUG] Failed to delete dog:', data);
				setRemoveDog(null);
				return;
			}
			setRemoveDog(null);
			setLoading(true);
			fetch(`${API_URL}/api/dogs`)
				.then(res => res.json())
				.then(data => {
					setDogs(Array.isArray(data) ? data : []);
					setLoading(false);
				});
		} catch (err) {
			console.error('[DELETE DEBUG] Fetch error:', err);
			setRemoveDog(null);
		}
	};

	if (loading) return <div>{t('doglist.loading') || 'Loading dogs...'}</div>;
	if (error) return <div style={{ color: 'red' }}>{error}</div>;

	return (
		<>
			{/* Search bar */}
			<div style={{ padding: '0 16px', paddingTop: '70px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
				<Search
					searchTerm={searchTerm}
					onSearchChange={setSearchTerm}
					genderFilter={genderFilter}
					onGenderChange={setGenderFilter}
					sizeFilter={sizeFilter}
					onSizeChange={setSizeFilter}
					locationFilter={locationFilter}
					onLocationChange={setLocationFilter}
					availableLocations={availableLocations}
				/>
			</div>
			<main
				style={{
					display: isDesktop ? 'flex' : 'block',
					flexDirection: isDesktop ? 'row' : undefined,
					alignItems: isDesktop ? 'flex-start' : undefined,
					justifyContent: isDesktop ? 'center' : undefined,
					gap: isDesktop ? 32 : undefined,
					position: 'relative',
					margin: isDesktop ? '32px 0 32px 32px' : undefined,
					marginTop: isDesktop ? '32px' : undefined,
					paddingTop: isDesktop ? '16px' : '16px',
					overflowY: 'auto',
					WebkitOverflowScrolling: isDesktop ? undefined : 'touch',
				}}
			>
				{filteredDogs.length === 0 ? (
					<div>{t('doglist.empty') || 'No dogs found.'}</div>
				) : (
					<div
						style={{
							display: isDesktop ? 'flex' : 'block',
							flexDirection: isDesktop ? 'row' : undefined,
							gap: isDesktop ? 16 : undefined,
							flexWrap: isDesktop ? 'wrap' : undefined,
							alignItems: isDesktop ? 'flex-start' : undefined,
							width: isDesktop ? undefined : '100%',
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
							return (
								<div
									key={dog._id}
									style={
										isDesktop
											? {
													background: '#fafbfc',
													borderRadius: 16,
													boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
													padding: 16,
													display: 'block',
													minWidth: 280,
													maxWidth: 400,
													width: 'auto',
													verticalAlign: 'top',
												}
											: {}
									}
								>
									<CardSmall
										{...dog}
										images={dedupedImages}
										canEdit={true}
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
						})}
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
			{detailsDog &&
				(isDesktop ? (
					<div
						style={{
							position: 'fixed',
							top: 0,
							left: 0,
							width: '100vw',
							height: '100vh',
							background: 'rgba(0,0,0,0.5)',
							zIndex: 2147483647,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
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
											width: 22,
											height: 22,
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
											fontSize: '2rem',
											fontWeight: 900,
											lineHeight: 1,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											width: '100%',
											height: '100%',
										}}>×</span>
									</button>
							<DogDetails
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
							top: 0,
							left: 0,
							width: '100vw',
							height: '100vh',
							background: 'rgba(0,0,0,0.5)',
							zIndex: 2147483647,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
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
									width: 40,
									height: 40,
									background: '#e74c3c',
									color: '#fff',
									border: 'none',
									borderRadius: '50%',
									fontSize: '1.5rem',
									fontWeight: 'bold',
									cursor: 'pointer',
									zIndex: 2,
								}}
								aria-label="Close"
								title="Close"
							>
								×
							</button>
							<DogDetails
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
				))}
			{/* Map-only modal */}
			{mapDog && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						width: '100vw',
						height: '100vh',
						background: 'rgba(0,0,0,0.6)',
						zIndex: 2147483647,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
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
								width: 36,
								height: 36,
								background: '#e74c3c',
								color: '#fff',
								border: 'none',
								borderRadius: '50%',
								fontSize: '1.5rem',
								fontWeight: 'bold',
								cursor: 'pointer',
								zIndex: 2,
							}}
							aria-label="Close"
							title="Close"
						>
							×
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
				</div>
			)}
		</>
	);
}

export default DogList;

