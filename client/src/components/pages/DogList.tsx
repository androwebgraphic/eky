import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import EditDogModal from './EditDogModal';
import Search from '../Search';
import CardSmall from '../CardSmall';
import DogDetails from './DogDetails';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

interface Dog {
  _id: string;
  name: string;
  breed?: string;
  age?: number;
  images?: any[];
  video?: any;
  thumbnail?: any;
  color?: string;
  place?: string;
  description?: string;
  size?: string;
  gender?: 'male' | 'female';
  vaccinated?: boolean;
  neutered?: boolean;
  location?: string;
  likes?: string[];
  user?: { 
    _id: string; 
    name: string; 
    username: string;
    email?: string;
    phone?: string;
    person?: 'private' | 'organization';
  };
  adoptionStatus?: string;
  adoptionQueue?: any;
}

const DogList: React.FC = () => {
      // Helper to get API URL
      const getApiUrl = () => {
        if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
        return 'http://localhost:3001';
      };
    // Helper to refetch dogs after adoption actions
    const refetchDogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${getApiUrl()}/api/dogs`, { 
          cache: 'no-store',
          headers 
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Request failed (${res.status})`);
        }
        const data = await res.json();
        // Debug: log images array for each dog
        if (Array.isArray(data)) {
          data.forEach(dog => {
            console.log(`[DogList DEBUG] Dog ${dog._id} images:`, dog.images);
          });
        }
        // Debug: log full dog object and images property after fetch
        if (Array.isArray(data)) {
          data.forEach(dog => {
            console.log('[DogList DEBUG] Dog', dog._id, 'images:', dog.images);
          });
        }
        setDogs(data);
      } catch (err: any) {
        console.error('Failed to fetch dogs', err);
        setError(err.message || t('doglist.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };
  const { t } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [editDog, setEditDog] = useState<Dog | null>(null);
  const [modalPosition, setModalPosition] = useState<{x: number, y: number} | null>(null);

  // Debug: log editDog and modal state changes
  useEffect(() => {
    console.log('[DogList] editDog state changed:', editDog);
  }, [editDog]);
  useEffect(() => {
    console.log('[DogList] selectedDog state changed:', selectedDog);
  }, [selectedDog]);
  useEffect(() => {
    console.log('[DogList] modalPosition state changed:', modalPosition);
  }, [modalPosition]);
  
  // Search filters - initialize from URL parameters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [genderFilter, setGenderFilter] = useState(searchParams.get('gender') || '');
  const [sizeFilter, setSizeFilter] = useState(searchParams.get('size') || '');
  const [locationFilter, setLocationFilter] = useState('');
  

  // Get unique locations for dropdown
  const availableLocations = Array.from(new Set(
    dogs.map(dog => dog.location || dog.place)
      .filter(Boolean)
      .sort()
  ));
  // Store availableLocations in localStorage for Footer search modal
  React.useEffect(() => {
    if (availableLocations.length > 0) {
      localStorage.setItem('availableLocations', JSON.stringify(availableLocations));
    }
  }, [availableLocations]);
  
  // Update URL parameters when search filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (genderFilter) params.set('gender', genderFilter);
    if (sizeFilter) params.set('size', sizeFilter);
    
    // Only update URL if params have changed
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params);
    }
  }, [searchTerm, genderFilter, sizeFilter, setSearchParams, searchParams]);

  // Listen for URL parameter changes (e.g., from search modal)
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const gender = searchParams.get('gender') || '';
    const size = searchParams.get('size') || '';
    
    if (search !== searchTerm) setSearchTerm(search);
    if (gender !== genderFilter) setGenderFilter(gender);
    if (size !== sizeFilter) setSizeFilter(size);
  }, [searchParams, searchTerm, genderFilter, sizeFilter]);
  
  // Filter dogs based on search criteria
  const filteredDogs = dogs.filter(dog => {
    if (!searchTerm && !genderFilter && !sizeFilter && !locationFilter) {
      return true; // No filters applied, show all dogs
    }
    
    const matchesSearch = !searchTerm || 
      (dog.name && dog.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (dog.breed && dog.breed.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (dog.location && dog.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (dog.place && dog.place.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGender = !genderFilter || dog.gender === genderFilter;
    const matchesSize = !sizeFilter || dog.size === sizeFilter;
    const matchesLocation = !locationFilter || 
      dog.location === locationFilter || dog.place === locationFilter;
    
    return matchesSearch && matchesGender && matchesSize && matchesLocation;
  });
  
  // Debug logging to help identify the issue
  

  // Add/remove modal-open class when modal state changes
  useEffect(() => {
    if (selectedDog || editDog) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [selectedDog, editDog]);

  useEffect(() => {
    const getApiUrl = () => {
      if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
      return 'http://localhost:3001';
    };
    const API_URL = getApiUrl();
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_URL}/api/dogs`, { 
          cache: 'no-store',
          headers 
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Request failed (${res.status})`);
        }
        const data = await res.json();
        setDogs(data);
      } catch (err: any) {
        console.error('Failed to fetch dogs', err);
        if (mounted) setError(err.message || t('doglist.failedToLoad'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [token, t]);

  return (
    <main>
      <h2>{t('doglist.title')}</h2>
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

      {loading && <p className="log">{t('doglist.loading')}</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && dogs.length === 0 && (
        <div className="empty">
          <p>{t('doglist.empty')}</p>
          <p>
            <a href="/dodajpsa">{t('doglist.addFirst')}</a>
          </p>
        </div>
      )}

      {!loading && !error && dogs.length > 0 && filteredDogs.length === 0 && (
        <div className="empty">
          <p>{t('search.noResults')}</p>
        </div>
      )}

      <div id="Doglist">

        {!loading && !error && filteredDogs.map(d => {
          const showSmallImage = filteredDogs.length === 1;
          // Extract dog owner ID (handle both string and object, and _id vs id)
          let dogOwnerId;
          if (typeof (d.user as any) === 'string') {
            dogOwnerId = d.user as any;
          } else if (d.user) {
            // Try _id first, then id
            dogOwnerId = (d.user as any)._id || (d.user as any).id;
          }
          
          // Extract current user ID
          const currentUserId = user?._id;
          
          // Check if user is superadmin
          const isSuperAdmin = user?.role === 'superadmin';
          
          // Compare as strings to avoid type mismatches
          const isOwner = Boolean(
            currentUserId && 
            dogOwnerId && 
            String(currentUserId) === String(dogOwnerId)
          );
          
          // User can edit if they're the owner OR if they're a superadmin
          const canEdit = Boolean(isAuthenticated && (isOwner || isSuperAdmin));
          
          return (
            <CardSmall
              smallImage={showSmallImage}
              key={d._id}
              _id={d._id}
              name={d.name}
              breed={d.breed}
              age={d.age}
              likes={d.likes || []}
              images={d.images}
              video={d.video}
              thumbnail={d.thumbnail}
              color={d.color}
              place={d.place || d.location}
              description={d.description}
              size={d.size}
              gender={d.gender}
              vaccinated={d.vaccinated}
              neutered={d.neutered}
              user={d.user}
              canEdit={canEdit}
              adoptionStatus={d.adoptionStatus}
              adoptionQueue={d.adoptionQueue}
              onDogUpdate={update => {
                console.log('[DogList] onDogUpdate received:', update);
                if (update && update.remove && update.id) {
                  setDogs(prev => {
                    console.log('[DogList] Dog list before removal:', prev);
                    const filtered = prev.filter(dog => dog._id !== update.id);
                    console.log('[DogList] Dog list after removal:', filtered);
                    return filtered;
                  });
                  if (selectedDog && selectedDog._id === update.id) setSelectedDog(null);
                  // Always refetch dogs after adoption actions to ensure correct state
                  refetchDogs();
                } else {
                  refetchDogs();
                  if (selectedDog && update && selectedDog._id === update._id) setSelectedDog(update);
                }
              }}
              onViewDetails={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setModalPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2
                });
                setSelectedDog(d);
              }}
              onEdit={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setModalPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2
                });
                handleEditDog(d);
              }}
              onRemove={() => handleRemoveDog(d)}
            />
          );
        })}
      </div>

      {selectedDog && modalPosition && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 2147483647,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            boxSizing: 'border-box'
          }}
          onClick={() => {
            setSelectedDog(null);
            setModalPosition(null);
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              zIndex: 2147483647,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              style={{
                position: 'absolute',
                top: 15,
                right: 15,
                width: 56,
                height: 56,
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                zIndex: 2147483647,
                padding: 0
              }}
              onClick={() => {
                setSelectedDog(null);
                setModalPosition(null);
              }}
              title={t('common.close')}
              aria-label={t('common.close')}
            >
              <span style={{
                fontSize: 40,
                fontWeight: 900,
                lineHeight: '56px',
                width: '100%',
                textAlign: 'center',
                display: 'block',
                userSelect: 'none',
                letterSpacing: 2
              }}>
                ×
              </span>
            </button>
            <DogDetails
              {...selectedDog}
              adoptionStatus={selectedDog?.adoptionStatus}
              adoptionQueue={selectedDog?.adoptionQueue}
              onDogUpdate={async update => {
                // Always reload the full dog list and update selected dog with latest from backend
                const getApiUrl = () => {
                  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
                  return 'http://localhost:3001';
                };
                const API_URL = getApiUrl();
                setLoading(true);
                setError(null);
                try {
                  const headers = { 'Content-Type': 'application/json' };
                  if (token) headers['Authorization'] = `Bearer ${token}`;
                  const res = await fetch(`${API_URL}/api/dogs`, { cache: 'no-store', headers });
                  if (!res.ok) throw new Error(await res.text() || `Request failed (${res.status})`);
                  const data = await res.json();
                  setDogs(data);
                  // Update selected dog with latest data
                  if (update && update._id) {
                    const latest = data.find((d: any) => d._id === update._id);
                    setSelectedDog(latest || null);
                  } else if (update && update.remove) {
                    setSelectedDog(null);
                  }
                } catch (err: any) {
                  setError(err.message || t('doglist.failedToLoad'));
                } finally {
                  setLoading(false);
                }
              }}
              onDogChanged={async () => {
                // Also reload the full dog list after adoption actions
                const getApiUrl = () => {
                  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
                  return 'http://localhost:3001';
                };
                const API_URL = getApiUrl();
                setLoading(true);
                setError(null);
                try {
                  const headers = { 'Content-Type': 'application/json' };
                  if (token) headers['Authorization'] = `Bearer ${token}`;
                  const res = await fetch(`${API_URL}/api/dogs`, { cache: 'no-store', headers });
                  if (!res.ok) throw new Error(await res.text() || `Request failed (${res.status})`);
                  const data = await res.json();
                  setDogs(data);
                  // If a dog is selected, update it
                  if (selectedDog && selectedDog._id) {
                    const latest = data.find((d: any) => d._id === selectedDog._id);
                    setSelectedDog(latest || null);
                  }
                } catch (err: any) {
                  setError(err.message || t('doglist.failedToLoad'));
                } finally {
                  setLoading(false);
                }
              }}
              onClose={() => {
                setSelectedDog(null);
                setModalPosition(null);
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {editDog && modalPosition && createPortal(
        <EditDogModal
          dog={editDog}
          onSave={async (updatedDog) => {
            console.log('[DogList] onSave called from EditDogModal', updatedDog);
            // Update the dog list and also update editDog so modal receives new images
            await handleSaveEditDog(updatedDog);
            // Force refresh the full dog list after save to ensure images update everywhere
            const getApiUrl = () => {
              if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
              return 'http://localhost:3001';
            };
            const API_URL = getApiUrl();
            let latestDog = updatedDog;
            try {
              // Fetch the latest dog data for the edited dog
              const res = await fetch(`${API_URL}/api/dogs/${updatedDog._id}`);
              if (res.ok) {
                latestDog = await res.json();
              }
              // Fetch the full dog list and update state
              const listRes = await fetch(`${API_URL}/api/dogs`, { cache: 'no-store' });
              if (listRes.ok) {
                const data = await listRes.json();
                setDogs(data);
              }
            } catch (err) {
              console.error('DogList: Failed to refresh dog list after save', err);
            }
            // Always keep modal open with updated dog after save
            setEditDog(latestDog);
            setModalPosition(modalPosition); // keep modal position unchanged
            // Never set selectedDog here; only update editDog and refresh list
            console.log('[DogList] setEditDog called with latestDog (modal stays open)', latestDog);
          }}
          // ...existing code...
          isSingleDog={dogs.length === 1}
        />, 
        document.body
      )}
    </main>
  );

  // Handler for editing a dog
  function handleEditDog(dog: Dog) {
    setEditDog(dog);
  }

  // Handler for saving an edited dog
  async function handleSaveEditDog(updatedDog: Dog) {
    // Re-fetch the full dog list after editing
    const getApiUrl = () => {
      if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
      return 'http://localhost:3001';
    };
    const API_URL = getApiUrl();
    setLoading(true);
    setError(null);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      // Always fetch the latest dog data after update
      const res = await fetch(`${API_URL}/api/dogs`, { cache: 'no-store', headers });
      if (!res.ok) throw new Error(await res.text() || `Request failed (${res.status})`);
      const data = await res.json();
      setDogs(data);
      // Do not set selectedDog here; only update editDog and refresh dog list
    } catch (err: any) {
      setError(err.message || t('doglist.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }

  // Handler for removing a dog
  async function handleRemoveDog(dog: Dog) {
    if (!window.confirm(t('doglist.confirmRemove', { name: dog.name }))) return;
    try {
      // Debug auth context values
      console.log('Delete request - Auth context values:', {
        user: user,
        token: token,
        isAuthenticated: isAuthenticated,
        localStorageToken: localStorage.getItem('token'),
        localStorageUser: localStorage.getItem('user')
      });
      
      const getApiUrl = () => {
        if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
        return 'http://localhost:3001';
      };
      const API_URL = getApiUrl();
      
      const headers: any = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Delete request - Using token:', token.substring(0, 20) + '...');
      } else {
        console.error('Delete request - No token available!');
      }
      
      console.log('Delete request details:', {
        url: `${API_URL}/api/dogs/${dog._id}`,
        method: 'DELETE',
        headers,
        dogId: dog._id,
        dogName: dog.name
      });
      
      const resp = await fetch(`${API_URL}/api/dogs/${dog._id}`, { 
        method: 'DELETE',
        headers 
      });
      
      console.log('Delete response status:', resp.status);
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('Delete failed:', resp.status, errorText);
        throw new Error(`${resp.status}: ${errorText}`);
      }
      
      console.log('Delete successful, removing from UI');
      setDogs(dogs => dogs.filter(d => d._id !== dog._id));
      // Close modals if open for this dog
      setEditDog(editDog => (editDog && editDog._id === dog._id ? null : editDog));
      setSelectedDog(selectedDog => (selectedDog && selectedDog._id === dog._id ? null : selectedDog));
    } catch (err: any) {
      console.error('Delete error details:', err);
      alert(err.message || t('doglist.failedToRemove'));
    }
  }

};

export default DogList;
