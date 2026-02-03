
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CardSmall from '../CardSmall';
import EditDogModal from './EditDogModal';

interface DogType {
	_id: string;
	name: string;
	breed?: string;
	age?: number;
	gender?: string;
	place?: string;
	video?: any;
	thumbnail?: any;
	canEdit?: boolean;
	images?: any[];
	adoptionStatus?: string;
	adoptionQueue?: any[];
	vaccinated?: boolean;
}

const DogList: React.FC = () => {
				// Map modal state and handler
				type MapCoords = { lat: number; lon: number };
				const [showMap, setShowMap] = useState(false);
				const [mapCoords, setMapCoords] = useState(null as MapCoords | null);
				const [mapPlace, setMapPlace] = useState(null as string | null);

				const handleShowMap = async (place: string) => {
					setShowMap(false);
					setMapCoords(null);
					setMapPlace(place);
					if (!place) return;
					try {
						const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`);
						const data = await res.json();
						if (data && data.length > 0) {
							setMapCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
							setShowMap(true);
						}
					} catch {}
				};
		       useEffect(() => {
			       const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
				       ? 'http://localhost:3001/api/dogs'
				       : 'http://172.20.10.2:3001/api/dogs';
			       fetch(apiUrl)
				       .then(res => res.json())
				       .then(data => {
					       const mapped = Array.isArray(data) ? data.map(dog => ({
						       ...dog,
						       place: dog.place || dog.location,
						       gender: dog.gender || (dog.gender === undefined ? '' : dog.gender),
						       images: Array.isArray(dog.images) ? dog.images : []
					       })) : [];
					       setDogs(mapped);
				       })
				       .catch(() => setDogs([]));
		       }, []);
	       // Debug: show current path and mount status
	const { token } = useAuth();
	// Helper to always get latest token from localStorage
	const getLatestToken = () => localStorage.getItem('token') || token;
	const [dogs, setDogs] = useState<DogType[]>([]);
	const [editDog, setEditDog] = useState<DogType | null>(null);
	const [viewDog, setViewDog] = useState<DogType | null>(null);
	const [sliderIndex, setSliderIndex] = useState(0);


	const handleEdit = (dog: DogType) => setEditDog(dog);
	const handleViewDetails = (dog: DogType) => {
		setViewDog(dog);
		setSliderIndex(0);
	};
	const handleCloseModal = () => setEditDog(null);
	const handleCloseViewModal = () => {
		setViewDog(null);
		setSliderIndex(0);
	};
	const handleDogUpdate = (updatedDog: DogType) => {
		setDogs(dogs => dogs.map(d => d._id === updatedDog._id ? updatedDog : d));
		setEditDog(null);
	};
	const handleRemove = async (dogId: string) => {
		try {
			const latestToken = getLatestToken();
			const headers = {
				'Content-Type': 'application/json',
				...(latestToken ? { Authorization: `Bearer ${latestToken}` } : {}),
			};
			console.log('[DELETE DOG DEBUG] Outgoing headers:', headers);
			const res = await fetch(`http://localhost:3001/api/dogs/${dogId}`, {
				method: 'DELETE',
				credentials: 'include',
				headers,
			});
			if (res.ok) {
					       setDogs(dogs => dogs.filter(d => d._id !== dogId));
					       // Refetch from backend to ensure sync
					       fetch('http://localhost:3001/api/dogs')
						       .then(res => res.json())
						       .then(data => {
							       const mapped = Array.isArray(data) ? data.map(dog => ({
								       ...dog,
								       place: dog.place || dog.location,
								       gender: dog.gender || (dog.gender === undefined ? '' : dog.gender),
								       images: Array.isArray(dog.images) ? dog.images : []
							       })) : [];
							       setDogs(mapped);
						       })
						       .catch(() => {});
			} else {
				const data = await res.json();
				alert(data.message || 'Failed to delete dog. You may not be authorized.');
			}
		} catch (err) {
			alert('Error deleting dog.');
		}
	};

	// Helper to get absolute image URL (same as CardSmall)
	function toAbsUrl(url?: string) {
		if (!url) return url;
		const cacheBuster = (window as any).__EKY_IMAGE_CB || ((window as any).__EKY_IMAGE_CB = Date.now());
		const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001';
		if (/^https?:\/\//.test(url)) return url + (url.includes('?') ? '&' : '?') + 'cb=' + cacheBuster;
		if (url.startsWith('/uploads/') || url.startsWith('/u/dogs/')) {
			return apiBase + url + '?cb=' + cacheBuster;
		}
		return url;
	}

	return (
					       <div style={{ padding: 24, overflowX: 'auto' }}>
			       <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
				       {dogs.map(dog => (
					       <CardSmall
						       key={dog._id}
						       {...dog}
						       canEdit={true}
						       onEdit={() => handleEdit(dog)}
						       onRemove={() => handleRemove(dog._id)}
						       onDogUpdate={handleDogUpdate}
						       onViewDetails={() => handleViewDetails(dog)}
					       />
				       ))}
			       </div>
			{editDog && (
				<EditDogModal
					dog={editDog}
					isSingleDog={true}
					onSave={(updatedDog) => {
						handleDogUpdate(updatedDog);
						handleCloseModal();
					}}
					onClose={handleCloseModal}
				/>
			)}
			{viewDog && (
				<div className="viewdog-modal-container" style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%, -50%)',background:'#fff',border:'3px solid #3498db',borderRadius:16,zIndex:999999,minWidth:320,maxWidth:640,padding:24}}>
					<button type="button" onClick={handleCloseViewModal} style={{position:'absolute',top:12,right:12,width:36,height:36,background:'#e74c3c',color:'#fff',border:'none',borderRadius:'50%',fontSize:'1.5rem',fontWeight:'bold',cursor:'pointer',zIndex:1000000}} aria-label="Close" title="Close">×</button>
					{/* Image slider or single image */}
					{viewDog.images && viewDog.images.length > 0 ? (
						<div style={{width:'100%',marginBottom:16,display:'flex',flexDirection:'column',alignItems:'center'}}>
							<img src={toAbsUrl(viewDog.images[sliderIndex]?.url || viewDog.images[0].url)} alt={viewDog.name} style={{width:'100%',maxWidth:400,height:220,objectFit:'cover',borderRadius:12}} />
							{viewDog.images.length > 1 && (
								<div style={{marginTop:8,display:'flex',gap:8,justifyContent:'center'}}>
									<button onClick={()=>setSliderIndex(i=>i>0?i-1:viewDog.images.length-1)} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #ccc',background:'#eee',cursor:'pointer'}}>‹</button>
									<span>{sliderIndex+1} / {viewDog.images.length}</span>
									<button onClick={()=>setSliderIndex(i=>(i+1)%viewDog.images.length)} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #ccc',background:'#eee',cursor:'pointer'}}>›</button>
								</div>
							)}
						</div>
					) : viewDog.thumbnail && viewDog.thumbnail.url ? (
						<img src={toAbsUrl(viewDog.thumbnail.url)} alt={viewDog.name} style={{width:'100%',maxWidth:400,height:220,objectFit:'cover',borderRadius:12,marginBottom:16}} />
					) : null}
					{/* Info section */}
					<h2 style={{marginBottom:16}}>{viewDog.name}</h2>
					<div style={{marginBottom:8, fontSize:'1.15rem'}}><strong>Breed:</strong> {viewDog.breed}</div>
					<div style={{marginBottom:8, fontSize:'1.15rem'}}><strong>Age:</strong> {viewDog.age}</div>
					<div style={{marginBottom:8, fontSize:'1.15rem'}}><strong>Gender:</strong> {viewDog.gender}</div>


						<div style={{marginBottom:8, fontSize:'1.15rem'}}>
							<strong>Place:</strong>
							{viewDog.place && (
								<span style={{color:'#1976d2',textDecoration:'underline',cursor:'pointer',marginLeft:4}}
									onClick={()=>handleShowMap(viewDog.place)}>
									{viewDog.place}
								</span>
							)}
						</div>
						{showMap && mapCoords && mapPlace === viewDog.place && (
							<div style={{marginTop:8,position:'relative',background:'#fff',border:'1px solid #ccc',borderRadius:12,padding:8,zIndex:1000}}>
								<button type="button" onClick={()=>setShowMap(false)} style={{position:'absolute',top:8,right:8,width:28,height:28,background:'#e74c3c',color:'#fff',border:'none',borderRadius:'50%',fontSize:'1.2rem',fontWeight:'bold',cursor:'pointer',zIndex:1000000}} aria-label="Close" title="Close">×</button>
								<iframe
									title="Map"
									width="100%"
									height="250"
									style={{borderRadius:12, border:'1px solid #ccc'}}
									src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lon-0.01},${mapCoords.lat-0.01},${mapCoords.lon+0.01},${mapCoords.lat+0.01}&layer=mapnik&marker=${mapCoords.lat},${mapCoords.lon}`}
									allowFullScreen
								/>
								<div style={{fontSize:'0.9rem',marginTop:4}}>
									<a href={`https://www.openstreetmap.org/?mlat=${mapCoords.lat}&mlon=${mapCoords.lon}#map=16/${mapCoords.lat}/${mapCoords.lon}`} target="_blank" rel="noopener noreferrer">View larger map</a>
								</div>
							</div>
						)}
					<div style={{marginBottom:8, fontSize:'1.15rem'}}><strong>Status:</strong> {viewDog.adoptionStatus}</div>
					<div style={{marginBottom:8, fontSize:'1.15rem'}}><strong>Adoption Queue:</strong> {viewDog.adoptionQueue && viewDog.adoptionQueue.length ? viewDog.adoptionQueue.join(', ') : 'None'}</div>
					<div style={{marginBottom:8, fontSize:'1.15rem'}}><strong>Vaccinated:</strong> {viewDog.vaccinated ? 'Yes' : 'No'}</div>
					<div style={{marginBottom:8, fontSize:'1.15rem'}}><strong>Video:</strong> {viewDog.video && viewDog.video.url ? viewDog.video.url : 'None'}</div>
					{/* Action buttons */}
					<div style={{display:'flex',gap:12,marginTop:16}}>
						<button type="button" style={{background:'#dbb69d',color:'#fff',border:'none',fontWeight:600,padding:'8px 18px',borderRadius:6,cursor:'pointer'}} onClick={()=>alert('Added to wishlist!')}>Add to Wishlist</button>
						<button type="button" style={{background:'#43a047',color:'#fff',border:'none',fontWeight:600,padding:'8px 18px',borderRadius:6,cursor:'pointer'}} onClick={()=>alert('Adopt functionality coming soon!')}>Adopt</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default DogList;

