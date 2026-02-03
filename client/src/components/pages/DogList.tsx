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
	const { token } = useAuth();
	// Helper to always get latest token from localStorage
	const getLatestToken = () => localStorage.getItem('token') || token;
	const [dogs, setDogs] = useState<DogType[]>([]);
	const [editDog, setEditDog] = useState<DogType | null>(null);
	const [viewDog, setViewDog] = useState<DogType | null>(null);
	const [sliderIndex, setSliderIndex] = useState(0);

	useEffect(() => {
		fetch('http://localhost:3001/api/dogs')
			.then(res => res.json())
			.then(data => {
				console.log('[DOGLIST DEBUG] Dogs from backend:', data);
				setDogs(data);
			})
			.catch(() => setDogs([]));
	}, []);

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
					.then(data => setDogs(data))
					.catch(() => {});
			} else {
				const data = await res.json();
				alert(data.message || 'Failed to delete dog. You may not be authorized.');
			}
		} catch (err) {
			alert('Error deleting dog.');
		}
	};

	return (
		<div style={{ padding: 24 }}>
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
							<img src={viewDog.images[sliderIndex]?.url || viewDog.images[0].url} alt={viewDog.name} style={{width:'100%',maxWidth:400,height:220,objectFit:'cover',borderRadius:12}} />
							{viewDog.images.length > 1 && (
								<div style={{marginTop:8,display:'flex',gap:8,justifyContent:'center'}}>
									<button onClick={()=>setSliderIndex(i=>i>0?i-1:viewDog.images.length-1)} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #ccc',background:'#eee',cursor:'pointer'}}>‹</button>
									<span>{sliderIndex+1} / {viewDog.images.length}</span>
									<button onClick={()=>setSliderIndex(i=>(i+1)%viewDog.images.length)} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #ccc',background:'#eee',cursor:'pointer'}}>›</button>
								</div>
							)}
						</div>
					) : viewDog.thumbnail && viewDog.thumbnail.url ? (
						<img src={viewDog.thumbnail.url} alt={viewDog.name} style={{width:'100%',maxWidth:400,height:220,objectFit:'cover',borderRadius:12,marginBottom:16}} />
					) : null}
					{/* Info section */}
					<h2 style={{marginBottom:16}}>{viewDog.name}</h2>
					<div style={{marginBottom:8, fontSize:'1.15rem'}}><strong>Breed:</strong> {viewDog.breed}</div>
					<div style={{marginBottom:8, fontSize:'1.15rem'}}><strong>Age:</strong> {viewDog.age}</div>
					<div style={{marginBottom:8, fontSize:'1.15rem'}}><strong>Gender:</strong> {viewDog.gender}</div>
					<div style={{marginBottom:8, fontSize:'1.15rem'}}><strong>Place:</strong> <span style={{color:'#1976d2',textDecoration:'underline',cursor:'pointer'}} onClick={()=>window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewDog.place||'')}`,'_blank')}>{viewDog.place}</span></div>
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

