import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import EditDogModal from './EditDogModal';
import { CardSmall } from '../CardSmall';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';


const DogList: React.FC = () => {
  const { t } = useTranslation();
  const { token, isAuthenticated } = useAuth();
  const [dogs, setDogs] = useState<any[]>([]);
  const [filteredDogs, setFilteredDogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editDog, setEditDog] = useState<any | null>(null);


  // Fetch dogs from API on mount
  useEffect(() => {
    const fetchDogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/api/dogs`, { headers });
        if (!res.ok) throw new Error(await res.text() || `Request failed (${res.status})`);
        const data = await res.json();
        setDogs(data);
        setFilteredDogs(data);
      } catch (err) {
        setError((err as any).message || t('doglist.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };
    fetchDogs();
  }, [token, t]);

  // Handler to open edit modal
  const handleEditDog = (dog: any) => {
    setEditDog(dog);
  };

  return (
    <main>
      {loading && <p>{t('doglist.loading')}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && filteredDogs.length === 0 && (
        <div className="empty">
          <p>{t('doglist.empty')}</p>
        </div>
      )}
      <div id="Doglist" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: '16px' }}>
        {filteredDogs.map(dog => (
          <CardSmall
            key={dog._id}
            _id={dog._id}
            name={dog.name}
            breed={dog.breed}
            age={dog.age}
            likes={dog.likes || []}
            images={dog.images}
            video={dog.video}
            thumbnail={dog.thumbnail}
            color={dog.color}
            place={dog.place || dog.location}
            description={dog.description}
            size={dog.size}
            gender={dog.gender}
            vaccinated={dog.vaccinated}
            neutered={dog.neutered}
            user={dog.user}
            canEdit={isAuthenticated}
            adoptionStatus={dog.adoptionStatus}
            adoptionQueue={dog.adoptionQueue}
            onEdit={() => handleEditDog(dog)}
            onRemove={() => {
              if (window.confirm(t('doglist.confirmRemove', { defaultValue: 'Are you sure you want to remove this dog?' }))) {
                setDogs(dogs => dogs.filter(d => d._id !== dog._id));
                setFilteredDogs(dogs => dogs.filter(d => d._id !== dog._id));
              }
            }}
          />
        ))}
      </div>
      {editDog && createPortal(
        <EditDogModal
          dog={editDog}
          isSingleDog={dogs.length === 1}
          onSave={(updatedDog) => {
            setDogs(dogs => dogs.map(d => d._id === updatedDog._id ? updatedDog : d));
            setEditDog(null);
          }}
        />, document.body)}
    </main>
  );
};

export default DogList;
