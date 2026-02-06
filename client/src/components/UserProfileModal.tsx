import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

// Portal container for modal
const modalRoot = document.getElementById('modal-root') || (() => {
  const root = document.createElement('div');
  root.id = 'modal-root';
  root.style.position = 'fixed';
  root.style.top = '0';
  root.style.left = '0';
  root.style.width = '100%';
  root.style.height = '100%';
  root.style.zIndex = '2147483647';
  document.body.appendChild(root);
  return root;
})();
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import '../css/modal.css';

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
  
  // Helper to get full image URL (robust)
  const getProfileImageUrl = (profilePicture: string | undefined) => {
    if (!profilePicture) return "../img/androcolored-80x80.jpg";
    let url = profilePicture.startsWith('/') ? profilePicture : '/' + profilePicture;
    // Use /u/ for compatibility if needed
    url = url.replace('/uploads', '/u');
    // Always use API base for /uploads/ and /u/ paths
    if (url.startsWith('/uploads/') || url.startsWith('/u/')) {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      return apiBase + url;
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
          alert('Backend response profilePicture: ' + data.user.profilePicture);
        }
      } catch (err) {
        console.error('[PROFILE UPDATE DEBUG] Error during fetch:', err);
        return;
      }

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
        

        // Extract timestamp from filename for cache busting
        let cacheBuster = '';
        if (data.user.profilePicture) {
          const match = data.user.profilePicture.match(/profile-(\d+)/);
          if (match && match[1]) {
            cacheBuster = match[1];
          }
        }
        console.log('[PROFILE UPDATE DEBUG] Using cacheBuster:', cacheBuster);

        updateUser({ ...updatedUser, _profilePicCacheBuster: cacheBuster });
        setProfilePicKey(prev => prev + 1); // Force re-render

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>{t('userProfile.title')}</h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleModalClose();
            }}
            style={{
              background: '#e74c3c',
              border: 'none',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(231,76,60,0.10)'
            }}
            aria-label="Close"
            title="Close"
            type="button"
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
              height: '100%'
            }}>×</span>
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

        {activeTab === 'profile' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <img 
                  key={profilePicKey}
                  src={profilePicturePreview || getProfileImageUrl((user as any)?.profilePicture)}
                  alt={user && user.username ? `${user.username}'s profile` : 'User profile'} 
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #ddd'
                  }}
                />
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{user ? user.username : ''}</h3>
                  {user && <span style={{ color: '#4CAF50', fontSize: '14px' }}>{t('userProfile.online')}</span>}
                </div>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile}>
                {/* Profile Picture Section */}
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <img 
                      key={profilePicKey}
                      src={profilePicturePreview || getProfileImageUrl((user as any)?.profilePicture)}
                      alt={user.username ? `${user.username}'s profile` : 'User profile'}
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
                        color: '#333',
                        width: '100%',
                        textAlign: 'center'
                      }}
                      tabIndex={0}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        style={{ display: 'none' }}
                        id="profilePictureInput"
                        aria-label="Profile picture"
                        autoComplete="photo"
                      />
                      <span role="button" style={{fontSize: '18px', verticalAlign: 'middle'}}>
                        📷 {t('userProfile.changePhoto')}
                      </span>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    {t('userProfile.fullName')}
                  </label>
                  <input
                    type="text"
                    id="profileNameInput"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px',
                      WebkitUserSelect: 'text',
                      userSelect: 'text'
                    }}
                    required
                    autoComplete="name"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    {t('userProfile.phone')}
                  </label>
                  <input
                    type="text"
                    id="profileContactNum"
                    name="contactNum"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px',
                      background: '#fff'
                    }}
                    autoComplete="off"
                    data-form-type="other"
                    data-lpignore="true"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    {t('userProfile.email')}
                  </label>
                  <input
                    type="email"
                    id="profileEmailInput"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px',
                      WebkitUserSelect: 'text',
                      userSelect: 'text'
                    }}
                    required
                    autoComplete="email"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                    {t('userProfile.username')}
                  </label>
                  <input
                    type="text"
                    id="profileUsernameInput"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px',
                      WebkitUserSelect: 'text',
                      userSelect: 'text'
                    }}
                    required
                    autoComplete="username"
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
                  <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{t('userProfile.fullName')}:</span> {user ? user.name : ''}
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{t('userProfile.email')}:</span> {user ? user.email : ''}
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{t('userProfile.username')}:</span> {user ? user.username : ''}
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{t('userProfile.phone')}:</span> {typedUser ? typedUser.phone : ''}
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
                      src={(() => {
                        const url = dog.thumbnail?.url || dog.images?.[0]?.url;
                        if (!url) return '../img/placeholder-dog.jpg';
                        if (/^https?:\/\//.test(url)) return url;
                        if (url.startsWith('/uploads/') || url.startsWith('/u/dogs/')) {
                          const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001';
                          return apiBase + url;
                        }
                        // Fallback to placeholder if not a valid path
                        return '../img/placeholder-dog.jpg';
                      })()}
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
                          // const removeKey = t('userProfile.remove');
                          // const fallbackRemove = t('button.removeFromList');
                          setWishlist(prev => prev.filter((d: any) => d._id !== dog._id));
                          await removeFromWishlist(dog._id);
                          if (user) {
                            updateUser({
                              ...user,
                              wishlist: (user.wishlist || []).filter(id => id !== dog._id)
                            });
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ff4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: '0 0 0 2px #ff4444',
                          transition: 'background 0.2s, box-shadow 0.2s',
                        }}
                      >
                        <span style={{fontSize:18}}>💔</span> {t('button.removeFromList', 'Entfernen')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    modalRoot
  );
};

export default UserProfileModal;