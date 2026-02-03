

import React, { useEffect, useState } from 'react';
import CardSmall from '../CardSmall';
import Search from '../Search';
import { useTranslation } from 'react-i18next';
import EditDogModal from './EditDogModal';
import RemoveDogModal from './RemoveDogModal';
import DogDetails from './DogDetails';

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
	vaccinated?: boolean;
	images?: { url: string; width?: number }[];
	adoptionStatus?: string;
}


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';


function DogList() {
	const { t } = useTranslation();
	const [dogs, setDogs] = useState<DogType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editDog, setEditDog] = useState<DogType | null>(null);
	const [removeDog, setRemoveDog] = useState<DogType | null>(null);
	const [detailsDog, setDetailsDog] = useState<DogType | null>(null);

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

		const handleEdit = (dog: DogType) => setEditDog(dog);
		const handleRemove = (dog: DogType) => setRemoveDog(dog);
		const handleDetails = (dog: DogType) => setDetailsDog(dog);

	const handleEditSave = async (updatedDog: DogType) => {
		// PATCH to API
		await fetch(`${API_URL}/api/dogs/${updatedDog._id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updatedDog),
		});
		setEditDog(null);
		// Refresh list
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
		await fetch(`${API_URL}/api/dogs/${removeDog._id}`, { method: 'DELETE' });
		setRemoveDog(null);
		// Refresh list
		setLoading(true);
		fetch(`${API_URL}/api/dogs`)
			.then(res => res.json())
			.then(data => {
				setDogs(Array.isArray(data) ? data : []);
				setLoading(false);
			});
	};

	if (loading) return <div>{t('doglist.loading') || 'Loading dogs...'}</div>;
	if (error) return <div style={{ color: 'red' }}>{error}</div>;

		return (
			<>
				<div id="Doglist">
					{dogs.length === 0 ? (
						<div>{t('doglist.empty') || 'No dogs found.'}</div>
					) : (
						dogs.map(dog => (
							<CardSmall
								key={dog._id}
								{...dog}
								canEdit={true}
								onEdit={() => handleEdit(dog)}
								onRemove={() => handleRemove(dog)}
								onViewDetails={() => handleDetails(dog)}
							/>
						))
					)}
				</div>
				{editDog && (
					<EditDogModal
						dog={editDog}
						isSingleDog={true}
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
				   {detailsDog && (
					   <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.5)',zIndex:2147483647,display:'flex',alignItems:'center',justifyContent:'center'}}>
						   <div style={{background:'#fff',borderRadius:16,maxWidth:700,width:'95vw',maxHeight:'95vh',overflow:'auto',position:'relative',padding:24}}>
							   <button onClick={()=>setDetailsDog(null)} style={{position:'absolute',top:12,right:12,width:40,height:40,background:'#e74c3c',color:'#fff',border:'none',borderRadius:'50%',fontSize:'1.5rem',fontWeight:'bold',cursor:'pointer',zIndex:2}} aria-label="Close" title="Close">×</button>
							   <DogDetails
								   {...detailsDog}
								   gender={detailsDog.gender === 'male' || detailsDog.gender === 'female' ? detailsDog.gender : undefined}
								   user={(detailsDog as any).user || (detailsDog as any).owner}
								   onClose={()=>setDetailsDog(null)}
							   />
						   </div>
					   </div>
				   )}
			</>
		);
}

export default DogList;

