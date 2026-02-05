



import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CardSmall from '../CardSmall';
import EditDogModal from './EditDogModal';
import RemoveDogModal from './RemoveDogModal';
import DogDetails from './DogDetails';
import type { DogDetailsProps } from './DogDetails';
const API_URL = process.env.REACT_APP_API_URL || '';

function DogList() {

	const { t } = useTranslation();
	const [dogs, setDogs] = useState<DogDetailsProps[]>([]);
	const [editDog, setEditDog] = useState<DogDetailsProps | null>(null);
	const [removeDog, setRemoveDog] = useState<DogDetailsProps | null>(null);
	const [detailsDog, setDetailsDog] = useState<DogDetailsProps | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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
		await fetch(`${API_URL}/api/dogs/${removeDog._id}`, { method: 'DELETE' });
		setRemoveDog(null);
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
					paddingTop: isDesktop ? '60px' : '60px', // ensure main is below fixed header
					overflowY: 'auto',
					WebkitOverflowScrolling: isDesktop ? undefined : 'touch',
				}}
			>
				{dogs.length === 0 ? (
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
						{dogs.map(dog => {
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
											if (e && Object.keys(e).length === 0) {
												handleDetails({ ...dog, _showMap: true } as any);
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
		</>
	);
}

export default DogList;

