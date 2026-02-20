import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import '../css/modal.css';

// Portal container for modal
const modalRoot = document.getElementById('modal-root') || (() => {
  const root = document.createElement('div');
  root.id = 'modal-root';
  // Portal root should NOT block clicks - only modal overlay should
  root.style.position = 'absolute';
  root.style.top = '0';
  root.style.left = '0';
  root.style.zIndex = '0';
  root.style.pointerEvents = 'none';
  document.body.appendChild(root);
  return root;
})();

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
  
  // Helper to get full image URL (robust with aggressive cache busting for Safari)
  const getProfileImageUrl = (profilePicture: string | undefined, cacheBuster?: string) => {
    if (!profilePicture) return "../img/androcolored-80x80.jpg";
    
    // Ensure path starts with /
    let url = profilePicture.startsWith('/') ? profilePicture : '/' + profilePicture;
    
    // Always use API base for /uploads/ and /u/ paths
    if (url.startsWith('/uploads/') || url.startsWith('/u/')) {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const fullUrl = apiBase + url;
      // Aggressive cache busting for mobile Safari: use cache buster only (no dynamic Date.now())
      if (cacheBuster) {
        return `${fullUrl}?v=${cacheBuster}`;
      }
      return fullUrl;
    }
    // If already absolute URL, return as is
    if (/^https?:\/\//.test(url)) return url;
    // Fallback to placeholder
    return '../img/androcolored-80x80.jpg';
  };
  const [formData, setFormData] = useState({
     name: typedUser?.name || '',
     email: typedUser?.email || '',
     username: typedUser?.username || '',
     phone: typedUser?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Used to force re-render after profile update
  const [profilePicKey, setProfilePicKey] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);








  const loadWishlist = React.useCallback(async () => {
    setLoadingWishlist(true);
    const wishlistData = await getWishlist();
    setWishlist(wishlistData);
    setLoadingWishlist(false);
  }, [getWishlist]);

  // Load wishlist when modal opens and wishlist tab is active
  React.useEffect(() => {
    if (isOpen) {
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
    } else if (isOpen && !user) {
      setFormData({ name: '', email: '', username: '', phone: '' });
      setProfilePicture(null);
      setProfilePicturePreview('');
      setError(null);
      setSuccess(null);
    }
    // Listen for wishlist-updated events (from DogList add)
    const handler = (e: any) => {
      if (e.detail && Array.isArray(e.detail.wishlist)) {
        setWishlist(e.detail.wishlist);
      }
    };
    window.addEventListener('wishlist-updated', handler);
    return () => window.removeEventListener('wishlist-updated', handler);
    // Only re-run when modal opens/closes or user ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, typedUser?._id]);

  const handleModalClose = React.useCallback(() => {
    console.log('handleModalClose called');
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    onClose();
  }, [onClose]);

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
  }, [isOpen, handleModalClose]);

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

  // Prevent body scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Store scroll position
      const scrollY = window.scrollY;
      document.body.dataset.scrollY = scrollY.toString();
      
      // Prevent touch scrolling on mobile
      document.body.style.touchAction = 'none';
    } else {
      // Restore body scroll
      const scrollY = document.body.dataset.scrollY || '0';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
      
      // Restore scroll position
      window.scrollTo(0, parseInt(scrollY, 10));
      
      // Clear stored scroll position
      delete document.body.dataset.scrollY;
    }
    
    return () => {
      // Cleanup when modal unmounts
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
      delete document.body.dataset.scrollY;
    };
  }, [isOpen]);


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
    console.log('[PROFILE UPDATE DEBUG] handleUpdateProfile called');
    if (profilePicture) {
      console.log('[PROFILE UPDATE DEBUG] Uploading file:', profilePicture.name, 'type:', profilePicture.type);
    }
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
      
      let response, data;
      try {
        response = await fetch(`${API_URL}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: uploadFormData,
        });
        console.log('Response status:', response.status);
        data = await response.json();
        console.log('[PROFILE UPDATE DEBUG] Full server response:', data);
        if (data && data.user) {
          console.log('[PROFILE UPDATE DEBUG] Returned user.profilePicture:', data.user.profilePicture);
        }
      } catch (err) {
        console.error('[PROFILE UPDATE DEBUG] Error during fetch:', err);
        return;
      }

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        
        // Generate a unique cache buster timestamp to force browser to reload image
        const cacheBuster = Date.now().toString();
        const randomString = Math.random().toString(36).substring(7);
        
        // Create new user object with server response + cache buster
        // Important: server response is source of truth, only add cache buster
        const updatedUser = {
          ...data.user,
          _profilePicCacheBuster: cacheBuster + '-' + randomString
        };
        
        console.log('[PROFILE UPDATE DEBUG] Updated user object:', updatedUser);
        console.log('[PROFILE UPDATE DEBUG] Cache buster:', cacheBuster + '-' + randomString);
        console.log('[PROFILE UPDATE DEBUG] Profile picture path:', updatedUser.profilePicture);
        
        // Force complete re-render with new user object
        updateUser(updatedUser);
        
        // Force component to remount by changing key (TWICE for more aggressive update)
        setProfilePicKey(Date.now());
        setTimeout(() => setProfilePicKey(Date.now() + 1), 50);
        
        // Force localStorage update
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
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
          // Force hard reload of the page on mobile to ensure new image loads
          if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            console.log('[MOBILE] Hard reload forced to update profile picture');
            setTimeout(() => {
              window.location.reload();
            }, 300);
          }
        }, 1000);
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

  // Render modal using portal to escape #Wrap container
  return ReactDOM.createPortal(
    <div 
      className="modal-overlay"
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          console.log('Backdrop clicked, closing modal');
          handleModalClose();
        }
      }}
    >
      <div 
        className="modal"
        onClick={(e) => {
          // Prevent modal from closing when clicking inside the modal
          e.stopPropagation();
        }}
      >
        <div className="modal-header">
          <h2>{t('userProfile.title')}</h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleModalClose();
            }}
            className="modal-close-btn"
            aria-label="Close"
            title="Close"
            type="button"
          >
            <span>×</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="modal-tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`modal-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          >
            {t('userProfile.profileTab')}
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`modal-tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
          >
            {t('userProfile.wishlistTab')} ({wishlist.length})
          </button>
        </div>

        <div className="modal-content">
          {error && (
            <div className="modal-alert error">
              {error}
            </div>
          )}

          {success && (
            <div className="modal-alert success">
              {success}
            </div>
          )}

        {activeTab === 'profile' && (
          <>
            <div className="profile-header">
              <div className="profile-info">
                <img 
                  key={profilePicKey}
                  src={profilePicturePreview || getProfileImageUrl((user as any)?.profilePicture, (user as any)?._profilePicCacheBuster)}
                  alt={user && user.username ? `${user.username}'s profile` : 'User profile'} 
                  className="profile-avatar-small"
                  onClick={() => {
                    // Force reload by updating cache buster
                    const newCacheBuster = Date.now().toString() + '-' + Math.random().toString(36).substring(7);
                    const updatedUser = {
                      ...user,
                      _profilePicCacheBuster: newCacheBuster
                    };
                    updateUser(updatedUser);
                    setProfilePicKey(Date.now());
                  }}
                  style={{ cursor: 'pointer' }}
                  title="Tap to refresh profile picture"
                />
                <div className="profile-info-text">
                  <h3>{user ? user.username : ''}</h3>
                  {user && <span className="online-status">{t('userProfile.online')}</span>}
                </div>
              </div>
              <button
                onClick={() => {
                  // Force reload by updating cache buster
                  console.log('[REFRESH] Current profilePicture:', (user as any)?.profilePicture);
                  const newCacheBuster = Date.now().toString() + '-' + Math.random().toString(36).substring(7);
                  console.log('[REFRESH] New cache buster:', newCacheBuster);
                  const updatedUser = {
                    ...user,
                    _profilePicCacheBuster: newCacheBuster
                  };
                  console.log('[REFRESH] New image URL:', getProfileImageUrl((user as any)?.profilePicture, newCacheBuster));
                  updateUser(updatedUser);
                  setProfilePicKey(Date.now());
                }}
                className="modal-btn btn-secondary"
                style={{ fontSize: '0.8em', padding: '5px 10px' }}
              >
                🔄 Refresh Image
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile}>
                {/* Profile Picture Section */}
                <div className="profile-picture-section">
                  <div className="profile-picture-wrapper">
                    <img 
                      key={profilePicKey}
                      src={profilePicturePreview || getProfileImageUrl((user as any)?.profilePicture, (user as any)?._profilePicCacheBuster)}
                      alt={user.username ? `${user.username}'s profile` : 'User profile'}
                      className="profile-picture"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profilePictureInput"
                      className="profile-upload-label"
                      tabIndex={0}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        id="profilePictureInput"
                        aria-label="Profile picture"
                        autoComplete="photo"
                      />
                      <span role="button" className="upload-icon">
                        📷 {t('userProfile.changePhoto')}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>
                    {t('userProfile.fullName')}
                  </label>
                  <input
                    type="text"
                    id="profileNameInput"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="modal-form-group">
                  <label>
                    {t('userProfile.phone')}
                  </label>
                  <input
                    type="text"
                    id="profilePhone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    autoComplete="tel"
                  />
                </div>

                <div className="modal-form-group">
                  <label>
                    {t('userProfile.email')}
                  </label>
                  <input
                    type="email"
                    id="profileEmailInput"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="modal-form-group">
                  <label>
                    {t('userProfile.username')}
                  </label>
                  <input
                    type="text"
                    id="profileUsernameInput"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    autoComplete="username"
                  />
                </div>

                {/* Password Change Section */}
                <div className="password-section">
                  <h4>{t('userProfile.password')}</h4>
                  <p>{t('userProfile.passwordInfo')}</p>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="modal-btn btn-info"
                  >
                    🔑 {t('userProfile.sendPasswordReset')}
                  </button>
                </div>

                <div className="modal-button-group">
                  <button
                    type="submit"
                    disabled={loading}
                    className="modal-btn btn-primary"
                  >
                    {loading ? t('userProfile.saving') : t('userProfile.saveChanges')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Cancel button clicked');
                      setIsEditing(false);
                    }}
                    className="modal-btn btn-secondary"
                  >
                    {t('userProfile.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-display">
                <div className="profile-field">
                  <span className="field-label">{t('userProfile.fullName')}:</span> {user ? user.name : ''}
                </div>
                <div className="profile-field">
                  <span className="field-label">{t('userProfile.email')}:</span> {user ? user.email : ''}
                </div>
                <div className="profile-field">
                  <span className="field-label">{t('userProfile.username')}:</span> {user ? user.username : ''}
                </div>
                <div className="profile-field">
                  <span className="field-label">{t('userProfile.phone')}:</span> {typedUser ? typedUser.phone : ''}
                </div>
                <div className="modal-button-group">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="modal-btn btn-primary"
                  >
                    {t('userProfile.editProfile')}
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="modal-btn btn-danger"
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
            <h3 className="wishlist-title">{t('userProfile.myWishlist')} ({wishlist.length})</h3>
            
            {loadingWishlist ? (
              <div className="wishlist-loading">{t('userProfile.loadingWishlist')}</div>
            ) : wishlist.length === 0 ? (
              <div className="wishlist-empty-state">
                <p>{t('userProfile.emptyWishlist')}</p>
                <p>{t('userProfile.emptyWishlistHint')}</p>
              </div>
            ) : (
              <div className="wishlist-scroll-container">
                {wishlist.map((dog: any) => (
                  <div key={dog._id} className="wishlist-dog-item">
                    <img
                      src={(() => {
                        const url = dog.thumbnail?.url || dog.images?.[0]?.url;
                        if (!url) return '../img/placeholder-dog.jpg';
                        if (/^https?:\/\//.test(url)) return url;
                        if (url.startsWith('/uploads/') || url.startsWith('/u/dogs/')) {
                          const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001';
                          return apiBase + url;
                        }
                        return '../img/placeholder-dog.jpg';
                      })()}
                      alt={dog.name}
                      className="wishlist-dog-image"
                    />
                    <div className="wishlist-dog-info">
                      <h4>{dog.name}</h4>
                      <p>
                        {dog.breed} • {dog.age} years • {dog.size} • {dog.location || dog.place}
                      </p>
                      {dog.description && (
                        <p className="dog-description">
                          {dog.description.length > 100 ? dog.description.substring(0, 100) + '...' : dog.description}
                        </p>
                      )}
                    </div>
                    <div className="wishlist-dog-actions">
                      {(dog.adoptionStatus === 'pending' && dog.adoptionQueue && user && dog.adoptionQueue.adopter === user._id) ? (
                        <button
                          onClick={async () => {
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
                          className="wishlist-action-btn btn-cancel"
                        >
                          {t('button.cancelAdoption') || 'Odustani od posvajanja'}
                        </button>
                      ) : dog.adoptionStatus === 'pending' ? (
                        <button
                          disabled
                          className="wishlist-action-btn btn-disabled"
                        >
                          {t('button.requested') || 'Zahtjev poslan'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            handleAdopt(dog._id);
                          }}
                          className="wishlist-action-btn btn-adopt"
                        >
                          🏠 {t('button.adopt')}
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          setWishlist(prev => prev.filter((d: any) => d._id !== dog._id));
                          await removeFromWishlist(dog._id);
                          if (user) {
                            updateUser({
                              ...user,
                              wishlist: (user.wishlist || []).filter(id => id !== dog._id)
                            });
                          }
                        }}
                        className="wishlist-action-btn btn-remove"
                      >
                        <span className="heart-icon">💔</span> {t('button.removeFromList', 'Entfernen')}
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
    </div>,
    modalRoot
  );
};

export default UserProfileModal;