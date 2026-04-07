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
import { getApiUrl } from '../../utils/apiUrl';

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
	
	// User's location for distance sorting
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
	const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
	const [manualLocationInput, setManualLocationInput] = useState('');
	const [geocodingManual, setGeocodingManual] = useState(false);
	const [showManualLocationInput, setShowManualLocationInput] = useState(false);
	const [locationMessage, setLocationMessage] = useState<string>('');
	const [showLocationSection, setShowLocationSection] = useState(false);

	// Debug logging on mount
	React.useEffect(() => {
		console.log('[DOG-LIST] ========== COMPONENT MOUNTED ==========');
		console.log('[DOG-LIST] Current URL:', window.location.href);
		console.log('[DOG-LIST] pathname:', window.location.pathname);
		console.log('[DOG-LIST] location.hash:', location.hash);
		console.log('[DOG-LIST] searchInputRef.current:', searchInputRef.current);
	}, []);

	// Custom event handler for search focus
	React.useEffect(() => {
		const handleSearchFocus = () => {
			console.log('[FOCUS] ========== CUSTOM SEARCH FOCUS EVENT ==========');
			console.log('[FOCUS] searchInputRef.current:', searchInputRef.current);
			
			// Highlight search
			setSearchActive(true);
			// Scroll to top first
			window.scrollTo(0, 0);
			console.log('[FOCUS] Scrolled to top');
			
			// Wait for component to fully render, then focus
			setTimeout(() => {
				console.log('[FOCUS] Timeout - attempting to focus');
				console.log('[FOCUS] searchInputRef.current:', searchInputRef.current);
				if (searchInputRef.current) {
					searchInputRef.current.focus();
					// Also click to trigger mobile keyboard (iOS limitation: keyboard won't show programmatically)
					searchInputRef.current.click();
					console.log('[FOCUS] ✅ Search input focused and clicked!');
					// Remove highlight after 2 seconds
					setTimeout(() => setSearchActive(false), 2000);
				} else {
					console.error('[FOCUS] ❌ Search input ref is null');
				}
			}, 100);
		};

		// Listen for custom search focus event
		window.addEventListener('focus-search', handleSearchFocus);
		
		return () => {
			window.removeEventListener('focus-search', handleSearchFocus);
		};
	}, []);

	// Auto-focus search input if #search is in URL hash (for initial page load)
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
			// Clear hash to prevent re-triggering
			window.history.replaceState(null, '', window.location.pathname);
			console.log('[FOCUS] Hash cleared from URL');
			// Dispatch custom event to trigger focus
			window.dispatchEvent(new CustomEvent('focus-search'));
		} else {
			console.log('[FOCUS] ❌ #search not in URL hash');
		}
		console.log('[FOCUS] ========== FOCUS EFFECT END ==========');
	}, []);

	// Handle manual location geocoding
	const handleManualLocationSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!manualLocationInput.trim()) return;
		
		setGeocodingManual(true);
		setLocationMessage('');
		
		try {
			console.log('[MANUAL LOCATION] Geocoding:', manualLocationInput);
			const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocationInput.trim())}&limit=1`, {
				headers: {
					'User-Agent': 'EkyApp/1.0'
				}
			});
			const data = await resp.json();
			
			if (data && data.length > 0) {
				const lat = parseFloat(data[0].lat);
				const lng = parseFloat(data[0].lon);
				console.log('[MANUAL LOCATION] ✅ Got coordinates:', { lat, lng });
				setUserLocation({ lat, lng });
				setLocationPermission('granted');
				setLocationMessage(`✅ ${t('location.usingLocation', { displayName: data[0].display_name })}`);
				setShowManualLocationInput(false);
				setManualLocationInput('');
				
				// Save to localStorage for persistence across page refreshes
				localStorage.setItem('userLocation', JSON.stringify({ lat, lng, displayName: data[0].display_name }));
				console.log('[MANUAL LOCATION] ✅ Saved to localStorage');
			} else {
				setLocationMessage(`❌ ${t('location.locationNotFound')}`);
			}
		} catch (err) {
			console.error('[MANUAL LOCATION] Error:', err);
			setLocationMessage(`❌ ${t('location.geocodeFailed')}`);
		} finally {
			setGeocodingManual(false);
		}
	};

	// Load location from user profile, localStorage, or request geolocation
	// Only run once on mount (not on every user update)
	const hasTriedGeolocation = React.useRef(false);
	
	React.useEffect(() => {
		console.log('[LOCATION] ========== CHECKING LOCATION SOURCES ==========');
		
		// Prevent repeated geolocation attempts
		if (hasTriedGeolocation.current) {
			console.log('[LOCATION] Already attempted geolocation, skipping');
			return;
		}
		hasTriedGeolocation.current = true;
		
		// Priority 1: Check if user has location in their profile
		if (user && user.coordinates && user.coordinates.coordinates && 
		    user.coordinates.coordinates[0] !== 0 && user.coordinates.coordinates[1] !== 0) {
			const userLat = user.coordinates.coordinates[1]; // Latitude is second element
			const userLng = user.coordinates.coordinates[0]; // Longitude is first element
			console.log('[LOCATION] ✅ Found location in user profile:', { lat: userLat, lng: userLng });
			setUserLocation({ lat: userLat, lng: userLng });
			setLocationPermission('granted');
			setLocationMessage(`✅ ${t('location.usingSavedLocation')}`);
			console.log('[LOCATION] ℹ️ Dogs will be sorted by distance from your saved location');
			return;
		}
		
		// Priority 2: Check localStorage
		const savedLocation = localStorage.getItem('userLocation');
		console.log('[LOCATION] savedLocation from localStorage:', savedLocation);
		
		if (savedLocation) {
			try {
				const parsed = JSON.parse(savedLocation);
				console.log('[LOCATION] ✅ Parsed saved location:', parsed);
				console.log('[LOCATION] Setting userLocation state...');
				setUserLocation({ lat: parsed.lat, lng: parsed.lng });
				setLocationPermission('granted');
				setLocationMessage(`✅ ${t('location.usingLocation', { displayName: parsed.displayName })}`);
				console.log('[LOCATION] ✅ State updated, skipping geolocation');
				console.log('[LOCATION] ℹ️ Dogs will be sorted by distance from saved location');
				return;
			} catch (e) {
				console.error('[LOCATION] ❌ Failed to parse saved location:', e);
				localStorage.removeItem('userLocation');
				console.log('[LOCATION] Removed invalid saved location');
			}
		} else {
			console.log('[LOCATION] No saved location found in localStorage');
		}
		
		// Priority 3: Try browser geolocation (once only)
		const getUserLocation = () => {
			if (!navigator.geolocation) {
				console.log('[LOCATION] ❌ Geolocation not supported by browser');
				setLocationPermission('denied');
				setLocationMessage(`ℹ️ ${t('location.enterLocation')}`);
				setShowManualLocationInput(true);
				console.log('[LOCATION] ℹ️ Dogs will be sorted by creation date (newest first)');
				return;
			}
			
			console.log('[LOCATION] 🔍 Requesting user location (more aggressive)...');
			
			// Always show manual input immediately (don't wait for geolocation)
			setLocationMessage(`ℹ️ ${t('location.enterLocation')}`);
			setShowManualLocationInput(true);
			
			// More aggressive geolocation: shorter timeout, higher accuracy
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					console.log('[LOCATION] ✅ Got user coordinates:', { latitude, longitude });
					setUserLocation({ lat: latitude, lng: longitude });
					setLocationPermission('granted');
					setLocationMessage(`✅ ${t('location.locationDetected', { lat: latitude.toFixed(4), lng: longitude.toFixed(4) })}`);
					console.log('[LOCATION] ℹ️ Dogs will be sorted by distance from your location');
					
					// Hide manual input when location is detected
					setShowManualLocationInput(false);
					
					// Save to user profile for future use
					saveLocationToProfile(latitude, longitude);
					
					// Also save to localStorage
					const detectedName = `✅ ${t('location.locationDetected', { lat: latitude.toFixed(4), lng: longitude.toFixed(4) })}`;
					localStorage.setItem('userLocation', JSON.stringify({ 
						lat: latitude, 
						lng: longitude, 
						displayName: detectedName 
					}));
					console.log('[LOCATION] ✅ Saved to localStorage');
				},
				(error) => {
					console.warn('[LOCATION] ❌ Geolocation error:', error);
					console.warn('[LOCATION] Error code:', error.code);
					console.warn('[LOCATION] Error message:', error.message);
					
					let errorMsg = '';
					switch (error.code) {
						case 1:
							errorMsg = 'Location permission denied';
							break;
						case 2:
							errorMsg = 'Location unavailable';
							break;
						case 3:
							errorMsg = 'Location request timed out';
							break;
						default:
							errorMsg = 'Unknown geolocation error';
					}
					
					console.log('[LOCATION] ℹ️ ' + errorMsg);
					setLocationPermission('denied');
					// Don't overwrite location message if already set
					if (!locationMessage) {
						setLocationMessage(`ℹ️ ${t('location.enterLocation')}`);
					}
					console.log('[LOCATION] ℹ️ Dogs will be sorted by creation date (newest first)');
					console.log('[LOCATION] 💡 To enable location-based sorting, allow location access in your browser settings');
				},
				{ 
					timeout: 10000, // 10 seconds - even shorter timeout
					enableHighAccuracy: true, // Request higher accuracy
					maximumAge: 60000 // Accept cached position up to 1 minute old (fresher)
				}
			);
		};
		
		// Function to save location to user profile
		const saveLocationToProfile = async (lat: number, lng: number) => {
			try {
				const authToken = token || localStorage.getItem('token');
				if (!authToken || !user) return;
				
				const resp = await fetch(`${getApiUrl()}/api/users/location`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${authToken}`
					},
					body: JSON.stringify({ lat, lng })
				});
				
				if (resp.ok) {
					console.log('[LOCATION] ✅ Location saved to user profile');
				}
			} catch (e) {
				console.warn('[LOCATION] Failed to save location to profile:', e);
			}
		};
		
		// Try to get location (once only)
		getUserLocation();
	}, [user]); // Only run when user logs in, not on token updates

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
			
			// Build URL with location parameters if available
			let url = `${getApiUrl()}/api/dogs`;
			const params = new URLSearchParams();
			if (userLocation) {
				params.append('lat', userLocation.lat.toString());
				params.append('lng', userLocation.lng.toString());
				console.log('[DOG-LIST] 📍 Fetching dogs with location-based sorting:', userLocation);
			} else {
				console.log('[DOG-LIST] 📅 Fetching dogs sorted by creation date (newest first)');
			}
			if (params.toString()) {
				url += `?${params.toString()}`;
			}
			
			console.log('[DOG-LIST] ================================================');
		console.log('[DOG-LIST] Fetching from URL:', url);
		console.log('[DOG-LIST] userLocation state:', userLocation);
		console.log('[DOG-LIST] locationMessage state:', locationMessage);
		console.log('[DOG-LIST] ================================================');
			
			fetch(url, { headers })
				.then(res => {
					console.log('[DOG-LIST] Response status:', res.status, res.statusText);
					if (!res.ok) {
						throw new Error(`HTTP ${res.status}: ${res.statusText}`);
					}
					return res.text();
				})
				.then(text => {
					try {
						const data = JSON.parse(text);
						setDogs(Array.isArray(data) ? data : []);
					} catch (parseErr) {
						console.error('[DOG-LIST] Failed to parse JSON:', parseErr);
						console.error('[DOG-LIST] Response text:', text.substring(0, 500));
						throw new Error('Invalid JSON response from server');
					}
					setLoading(false);
				})
				.catch(err => {
					console.error('[DOG-LIST] Fetch error:', err);
					setError(t('doglist.loadError') || 'Failed to load dogs');
					setLoading(false);
				});
		};

		fetchDogs();

		// Refresh dogs function (shared between dogUpdated and dog-added events)
		const refreshDogs = async () => {
			console.log('[DOG-LIST] Refreshing dogs...');
			const headers: Record<string, string> = {};
			const authToken = token || localStorage.getItem('token');
			if (authToken) {
				headers['Authorization'] = `Bearer ${authToken}`;
			}
			
			// Build URL with location parameters if available
			let url = `${getApiUrl()}/api/dogs`;
			const params = new URLSearchParams();
			if (userLocation) {
				params.append('lat', userLocation.lat.toString());
				params.append('lng', userLocation.lng.toString());
				console.log('[DOG-LIST] 📍 Refreshing dogs with location-based sorting');
			} else {
				console.log('[DOG-LIST] 📅 Refreshing dogs sorted by creation date');
			}
			if (params.toString()) {
				url += `?${params.toString()}`;
			}
			
			fetch(url, { headers })
				.then(res => res.json())
				.then(data => {
					setDogs(Array.isArray(data) ? data : []);
				})
				.catch(err => {
					console.error('[DOG-LIST] Failed to refresh dogs:', err);
				});
		};

		// Listen for dog updates from Socket.IO (via ChatApp window events)
		const handleDogUpdated = async (event: Event) => {
			console.log('[DOG-LIST] dogUpdated event received');
			refreshDogs();
		};

		// Listen for new dog added event
		const handleDogAdded = async (event: Event) => {
			console.log('[DOG-LIST] dog-added event received');
			refreshDogs();
		};

		// Listen for custom events
		window.addEventListener('dogUpdated', handleDogUpdated);
		window.addEventListener('dog-added', handleDogAdded);

		return () => {
			window.removeEventListener('dogUpdated', handleDogUpdated);
			window.removeEventListener('dog-added', handleDogAdded);
		};
	}, [token, userLocation]);

	const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 900;
	const handleEdit = (dog: DogDetailsProps) => {
		setDetailsDog(null);
		setEditDog(dog);
	};
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
				setError(t('doglist.refreshError') || 'Failed to refresh dogs after update');
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
		{/* Header */}
		<div style={{ 
			textAlign: 'center', 
			padding: '20px 16px 10px 16px',
			maxWidth: '1200px', 
			width: '100%', 
			margin: '0 auto', 
			boxSizing: 'border-box'
		}}>
			<h2 style={{ 
				fontSize: '2.4rem',
				color: '#c44a0b',
				margin: '0',
				padding: '0'
			}}>
				{t('button.findFriend')}
			</h2>
		</div>

		{/* Search bar */}
		<div style={{ padding: '0 16px', paddingTop: '10px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
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

		{/* Collapsible Location Section */}
		<div style={{ maxWidth: '1200px', width: '100%', margin: '10px auto', boxSizing: 'border-box' }}>
			<button
				onClick={() => setShowLocationSection(!showLocationSection)}
				style={{
					width: '100%',
					padding: '12px 16px',
					background: '#f8f9fa',
					border: '1px solid #dee2e6',
					borderRadius: '8px',
					fontSize: '1.4rem',
					color: '#495057',
					cursor: 'pointer',
					textAlign: 'left',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between'
				}}
			>
				<span>{showLocationSection ? t('location.hideLocation') : t('location.showLocation')}</span>
				<span style={{ fontSize: '1.6rem' }}>{showLocationSection ? '▼' : '▶'}</span>
			</button>

			{showLocationSection && locationMessage && (
				<div style={{ 
					padding: '12px 16px', 
					maxWidth: '1200px', 
					width: '100%', 
					margin: '10px 0 0 0', 
					boxSizing: 'border-box',
					background: locationMessage.startsWith('✅') ? '#d4edda' : '#fff3cd',
					border: `1px solid ${locationMessage.startsWith('✅') ? '#c3e6cb' : '#ffeaa7'}`,
					borderRadius: '8px',
					fontSize: '14px',
					display: 'flex',
					flexDirection: 'column',
					gap: '8px'
				}}>
					<div>{locationMessage}</div>
					{showManualLocationInput && !userLocation && (
						<form onSubmit={handleManualLocationSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
							<input
								type="text"
								value={manualLocationInput}
								onChange={(e) => setManualLocationInput(e.target.value)}
								placeholder={t('location.cityPlaceholder')}
								disabled={geocodingManual}
								style={{
									flex: '1',
									minWidth: '200px',
									padding: '8px 12px',
									border: '1px solid #ddd',
									borderRadius: '6px',
									fontSize: '14px'
								}}
							/>
							<button
								type="submit"
								disabled={geocodingManual || !manualLocationInput.trim()}
								style={{
									padding: '8px 16px',
									background: '#007bff',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									cursor: geocodingManual || !manualLocationInput.trim() ? 'not-allowed' : 'pointer',
									opacity: geocodingManual || !manualLocationInput.trim() ? 0.6 : 1
								}}
							>
								{geocodingManual ? t('location.finding') : t('location.setLocation')}
							</button>
							<button
								type="button"
								onClick={() => setShowManualLocationInput(false)}
								style={{
									padding: '8px 16px',
									background: '#6c757d',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									cursor: 'pointer'
								}}
							>
								{t('common.cancel')}
							</button>
						</form>
					)}
					{userLocation && (
						<button
							onClick={() => {
								setUserLocation(null);
								setLocationMessage('');
								setShowManualLocationInput(true);
								// Clear from localStorage
								localStorage.removeItem('userLocation');
								console.log('[LOCATION] ✅ Cleared location from localStorage');
							}}
							style={{
								padding: '6px 12px',
								background: 'transparent',
								color: '#007bff',
								border: '1px solid #007bff',
								borderRadius: '4px',
								fontSize: '12px',
								cursor: 'pointer',
								alignSelf: 'flex-start'
							}}
						>
							{t('location.clearLocation')}
						</button>
					)}
				</div>
			)}
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
										// Check if this is a location/map click (empty object marker)
						// Only treat as map click if e is explicitly an empty object {}
						if (e && typeof e === 'object' && !e.nativeEvent && Object.keys(e).length === 0) {
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
					<div style={{ padding: '0 8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
								<div key={dog._id} style={{ width: 'calc(50% - 4px)' }}>
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
											// Check if this is a location/map click (empty object marker)
						// Only treat as map click if e is explicitly an empty object {}
						if (e && typeof e === 'object' && !e.nativeEvent && Object.keys(e).length === 0) {
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
								<span>&times;</span>
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
								onEdit={handleEdit}
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
								<span>&times;</span>
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
								onEdit={handleEdit}
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
							<span>&times;</span>
						</button>
						<h3 className="doglist-map-title">
							📍 {mapDog.name} - {mapDog.location}
						</h3>
						{mapLoading && <div style={{ textAlign: 'center', padding: 20 }}>{t('dogDetails.loadingMap')}</div>}
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