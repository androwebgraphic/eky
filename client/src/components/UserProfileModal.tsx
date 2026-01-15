import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id?: string;
  _id?: string;
  email?: string;
  username?: string;
  name?: string;
  phone?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, token, logout, updateUser, getWishlist, removeFromWishlist } = useAuth();
    const typedUser = user as User;
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'wishlist'>('profile');
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [formData, setFormData] = useState({
     name: typedUser?.name || '',
     email: typedUser?.email || '',
     username: typedUser?.username || '',
     phone: typedUser?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load wishlist when modal opens and wishlist tab is active
  React.useEffect(() => {
    if (isOpen && activeTab === 'wishlist') {
      loadWishlist();
    }
    // Reset form data when modal opens
    if (isOpen && user) {
      setFormData({
          name: typedUser.name || '',
          email: typedUser.email || '',
          username: typedUser.username || '',
          phone: typedUser.phone || '',
      });
      setProfilePicture(null);
      setProfilePicturePreview('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, activeTab, user]); // Added loadWishlist dependency is handled by calling it directly

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        console.log('Escape key pressed, closing modal');
        handleModalClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setActiveTab('profile');
      setError(null);
      setSuccess(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleModalClose = () => {
    console.log('handleModalClose called');
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const loadWishlist = React.useCallback(async () => {
    setLoadingWishlist(true);
    const wishlistData = await getWishlist();
    setWishlist(wishlistData);
    setLoadingWishlist(false);
  }, [getWishlist]);

  // Don't render if modal is not open - MOVED AFTER ALL HOOKS
  if (!isOpen) {
    return null;
  }

  const handleAdopt = async (dogId: string) => {
    try {
      const API_URL = getApiUrl();
      const resp = await fetch(`${API_URL}/api/dogs/${dogId}/adopt-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Error');
      await loadWishlist();
    } catch (e: any) {
      alert(e.message || 'Error');
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/users/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password reset link sent to your email!');
        setError(null);
      } else {
        setError(data.message || 'Failed to send password reset email');
        setSuccess(null);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Network error. Please try again.');
      setSuccess(null);
    }
  };

  // Get API URL based on environment
  const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3001`;
    }
    return `http://172.20.10.2:3001`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const API_URL = getApiUrl();
      
      // Create FormData for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('name', formData.name);
      uploadFormData.append('username', formData.username);
      uploadFormData.append('email', formData.email);
      uploadFormData.append('phone', formData.phone);
      
      // Add profile picture if selected
      if (profilePicture) {
        uploadFormData.append('profilePicture', profilePicture);
        console.log('Profile picture selected:', profilePicture.name, profilePicture.size, profilePicture.type);
      }
      
      console.log('Updating profile with form data:', {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        hasProfilePicture: !!profilePicture
      });
      
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData,
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Server response:', data);

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        
        // Update both localStorage and AuthContext with new user data
        const updatedUser = { 
          ...user, 
          name: data.user.name,
          username: data.user.username,
          email: data.user.email,
          phone: data.user.phone,
          ...(data.user.profilePicture && { profilePicture: data.user.profilePicture })
        } as any;
        
        console.log('Updated user data:', updatedUser);
        console.log('Profile picture URL:', data.user.profilePicture);
        updateUser(updatedUser);
        
        // Reset profile picture state but keep the new image visible
        setProfilePicture(null);
        setProfilePicturePreview('');
        
        // Update form data to reflect changes
        setFormData({
          name: data.user.name,
          email: data.user.email,
          username: data.user.username,
          phone: data.user.phone || ''
        });
        
        // Close editing mode after successful update
        setTimeout(() => {
          setIsEditing(false);
        }, 100);
      } else {
        console.error('Profile update failed:', data);
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        logout();
        onClose();
        alert('Account deleted successfully');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete account');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          console.log('Backdrop clicked, closing modal');
          handleModalClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => {
          // Prevent modal from closing when clicking inside the modal
          e.stopPropagation();
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>{t('userProfile.title')}</h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Close button clicked');
              handleModalClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '5px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            type="button"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'profile' ? '#2196F3' : 'transparent',
              color: activeTab === 'profile' ? 'white' : '#666',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              marginRight: '5px'
            }}
          >
            {t('userProfile.profileTab')}
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'wishlist' ? '#2196F3' : 'transparent',
              color: activeTab === 'wishlist' ? 'white' : '#666',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0'
            }}
          >
            {t('userProfile.wishlistTab')} ({wishlist.length})
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            {success}
          </div>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <img 
                  src={profilePicturePreview || ((user as any)?.profilePicture ? `${getApiUrl()}${(user as any).profilePicture}` : "../img/androcolored-80x80.jpg")} 
                  alt="Profile" 
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #ddd'
                  }}
                />
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{user.username}</h3>
                  <span style={{ color: '#4CAF50', fontSize: '14px' }}>{t('userProfile.online')}</span>
                </div>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile}>
                {/* Profile Picture Section */}
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <img 
                      src={profilePicturePreview || ((user as any)?.profilePicture ? `${getApiUrl()}${(user as any).profilePicture}` : "../img/androcolored-80x80.jpg")} 
                      alt="Profile Picture" 
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '3px solid #ddd'
                      }} 
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      style={{ display: 'none' }}
                      id="profilePictureInput"
                    />
                    <label 
                      htmlFor="profilePictureInput"
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#333'
                      }}
                    >
                      📷 {t('userProfile.changePhoto')}
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    {t('userProfile.fullName')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    {t('userProfile.email')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    {t('userProfile.username')}
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    {t('userProfile.phone')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                {/* Password Change Section */}
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '15px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px', 
                  border: '1px solid #e9ecef' 
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '16px' }}>{t('userProfile.password')}</h4>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
                    {t('userProfile.passwordInfo')}
                  </p>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    🔑 {t('userProfile.sendPasswordReset')}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    {loading ? t('userProfile.saving') : t('userProfile.saveChanges')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Cancel button clicked');
                      setIsEditing(false);
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#757575',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('userProfile.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{t('userProfile.fullName')}:</span> {user.name}
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{t('userProfile.email')}:</span> {user.email}
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{t('userProfile.username')}:</span> {user.username}
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{t('userProfile.phone')}:</span> {typedUser.phone}
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('userProfile.editProfile')}
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    {loading ? t('userProfile.deleting') : t('userProfile.deleteAccount')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Wishlist Tab Content */}
        {activeTab === 'wishlist' && (
          <div>
            <h3 style={{ marginBottom: '20px', fontSize: '1.2em' }}>{t('userProfile.myWishlist')} ({wishlist.length})</h3>
            
            {loadingWishlist ? (
              <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.1em' }}>{t('userProfile.loadingWishlist')}</div>
            ) : wishlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '1.1em' }}>
                <p>{t('userProfile.emptyWishlist')}</p>
                <p>{t('userProfile.emptyWishlistHint')}</p>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {wishlist.map((dog: any) => (
                  <div 
                    key={dog._id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '15px',
                      marginBottom: '15px',
                      display: 'flex',
                      gap: '15px',
                      alignItems: 'center'
                    }}
                  >
                    <img 
                      src={dog.thumbnail?.url || dog.images?.[0]?.url || '../img/placeholder-dog.jpg'}
                      alt={dog.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{dog.name}</h4>
                      <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                        {dog.breed} • {dog.age} years • {dog.size} • {dog.location || dog.place}
                      </p>
                      {dog.description && (
                        <p style={{ margin: '0', fontSize: '13px', color: '#888', maxWidth: '300px' }}>
                          {dog.description.length > 100 ? dog.description.substring(0, 100) + '...' : dog.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(dog.adoptionStatus === 'pending' && dog.adoptionQueue && user && dog.adoptionQueue.adopter === user._id) ? (
                        <button
                          onClick={async () => {
                            // Odustani (cancel adoption)
                            try {
                              const API_URL = getApiUrl();
                              const resp = await fetch(`${API_URL}/api/dogs/${dog._id}/adopt-cancel`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': token ? `Bearer ${token}` : ''
                                },
                                body: JSON.stringify({ reason: '' })
                              });
                              const data = await resp.json();
                              if (!resp.ok) throw new Error(data.message || 'Error');
                              await loadWishlist();
                            } catch (e) {
                              alert(e.message || 'Error');
                            }
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t('button.cancelAdoption') || 'Odustani od posvajanja'}
                        </button>
                      ) : dog.adoptionStatus === 'pending' ? (
                        <button
                          disabled
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#aaa',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'not-allowed',
                            fontSize: '14px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t('button.requested') || 'Zahtjev poslan'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const adoptKey = t('userProfile.adopt');
                            const fallbackAdopt = t('button.adopt');
                            handleAdopt(dog._id);
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          🏠 {t('button.adopt')}
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          const removeKey = t('userProfile.remove');
                          const fallbackRemove = t('button.removeFromList');
                          // eslint-disable-next-line no-console
                          console.log('[UserProfileModal] removeKey:', removeKey, '| fallback:', fallbackRemove);
                          await removeFromWishlist(dog._id);
                          await loadWishlist();
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ff4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        💔 {(() => {
                          const removeKey = t('userProfile.remove');
                          const fallbackRemove = t('button.removeFromList');
                          // eslint-disable-next-line no-console
                          console.log('[UserProfileModal][render] removeKey:', removeKey, '| fallback:', fallbackRemove);
                          return removeKey !== 'userProfile.remove' ? removeKey : fallbackRemove;
                        })()}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;