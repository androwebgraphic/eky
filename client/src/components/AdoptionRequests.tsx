import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Notification from './Notification';
import './AdoptionRequests.css';

interface Dog {
  _id: string;
  name: string;
  breed: string;
  age: number;
  gender: string;
  images: Array<{ url: string }>;
  place: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AdoptionRequest {
  _id: string;
  dog: Dog;
  adopter: User;
  owner: User;
  status: 'pending' | 'owner_confirmed' | 'adopter_confirmed' | 'adopted' | 'denied' | 'cancelled';
  message: string;
  createdAt: string;
  timestamps: {
    owner_confirmed_at?: string;
    adopter_confirmed_at?: string;
    adopted_at?: string;
    denied_at?: string;
    cancelled_at?: string;
  };
}

const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  // Dynamically construct API URL based on current hostname
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  return `${protocol}//${hostname}:3001`;
};

const AdoptionRequests: React.FC = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    fetchCurrentUserId();
  }, []);

  const fetchCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        const userId = payload.id || payload.userId || payload._id;
        console.log('Extracted userId:', userId);
        setCurrentUserId(userId);
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
  };

  const fetchRequests = async () => {
    try {
      const apiBase = getApiUrl();
      const token = localStorage.getItem('token');
      console.log('Fetching requests with token:', token ? 'present' : 'missing');
      
      const response = await fetch(`${apiBase}/api/adoption/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched requests:', data);
        setRequests(data.requests || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch requests:', errorData);
        showNotification(t('adoptionRequests.failedToFetch') + ': ' + (errorData.error || t('alerts.unknownError')), 'error');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      showNotification(t('adoptionRequests.errorFetching'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleOwnerConfirm = async (requestId: string) => {
    if (!window.confirm(t('adoptionRequests.confirmRequestConfirm'))) return;

    try {
      const apiBase = getApiUrl();
      const response = await fetch(`${apiBase}/api/adoption/requests/${requestId}/owner-confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showNotification(t('adoptionRequests.confirmRequestSuccess'), 'success');
        fetchRequests();
      } else {
        const data = await response.json();
        showNotification(t('adoptionRequests.failedToConfirm') + (data.error || t('alerts.unknownError')), 'error');
      }
    } catch (error) {
      console.error('Error confirming request:', error);
      showNotification(t('adoptionRequests.errorConfirming'), 'error');
    }
  };

  const handleAdopterConfirm = async (requestId: string) => {
    if (!window.confirm(t('adoptionRequests.confirmAdoptionConfirm'))) return;

    try {
      const apiBase = getApiUrl();
      const response = await fetch(`${apiBase}/api/adoption/requests/${requestId}/adopter-confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showNotification(t('adoptionRequests.confirmAdoptionSuccess'), 'success');
        fetchRequests();
      } else {
        const data = await response.json();
        showNotification(t('adoptionRequests.failedToConfirm') + (data.error || t('alerts.unknownError')), 'error');
      }
    } catch (error) {
      console.error('Error confirming request:', error);
      showNotification(t('adoptionRequests.errorConfirming'), 'error');
    }
  };

  const handleFinalize = async (requestId: string) => {
    if (!window.confirm(t('adoptionRequests.finalizeConfirm'))) return;

    try {
      const apiBase = getApiUrl();
      const response = await fetch(`${apiBase}/api/adoption/requests/${requestId}/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showNotification(t('adoptionRequests.finalizeSuccess'), 'success');
        fetchRequests();
      } else {
        const data = await response.json();
        showNotification(t('adoptionRequests.failedToFinalize') + (data.error || t('alerts.unknownError')), 'error');
      }
    } catch (error) {
      console.error('Error finalizing adoption:', error);
      showNotification(t('adoptionRequests.errorFinalizing'), 'error');
    }
  };

  const handleDeny = async (requestId: string) => {
    if (!window.confirm(t('adoptionRequests.denyConfirm'))) return;

    try {
      const apiBase = getApiUrl();
      const response = await fetch(`${apiBase}/api/adoption/requests/${requestId}/deny`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showNotification(t('adoptionRequests.denySuccess'), 'info');
        fetchRequests();
      } else {
        const data = await response.json();
        showNotification(t('adoptionRequests.failedToDeny') + (data.error || t('alerts.unknownError')), 'error');
      }
    } catch (error) {
      console.error('Error denying request:', error);
      showNotification(t('adoptionRequests.errorDenying'), 'error');
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!window.confirm(t('adoptionRequests.cancelConfirm'))) return;

    try {
      const apiBase = getApiUrl();
      const response = await fetch(`${apiBase}/api/adoption/requests/${requestId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showNotification(t('adoptionRequests.cancelSuccess'), 'info');
        fetchRequests();
      } else {
        const data = await response.json();
        showNotification(t('adoptionRequests.failedToCancel') + (data.error || t('alerts.unknownError')), 'error');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      showNotification(t('adoptionRequests.errorCancelling'), 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: '#ff9800', label: t('adoption.status.pending') },
      owner_confirmed: { color: '#2196f3', label: t('adoption.status.ownerConfirmed') },
      adopter_confirmed: { color: '#9c27b0', label: t('adoption.status.adopterConfirmed') },
      adopted: { color: '#4caf50', label: t('adoption.status.adopted') },
      denied: { color: '#f44336', label: t('adoption.status.denied') },
      cancelled: { color: '#9e9e9e', label: t('adoption.status.cancelled') }
    };
    const config = statusConfig[status] || { color: '#9e9e9e', label: status };
    return (
      <span style={{ 
        backgroundColor: config.color, 
        color: 'white', 
        padding: '4px 12px', 
        borderRadius: '12px', 
        fontSize: '12px',
        fontWeight: 600
      }}>
        {config.label}
      </span>
    );
  };

  const getRequestCard = (request: AdoptionRequest) => {
    const isOwner = currentUserId === request.owner._id;
    const isAdopter = currentUserId === request.adopter._id;
    
    console.log('Request:', {
      requestId: request._id,
      currentUserId,
      ownerId: request.owner._id,
      adopterId: request.adopter._id,
      isOwner,
      isAdopter,
      dog: request.dog
    });

    const dogName = request.dog?.name || t('adoptionRequests.unknownDog');
    const dogBreed = request.dog?.breed || '';
    const dogAge = request.dog?.age;
    const dogGender = request.dog?.gender;
    const dogImage = request.dog?.images?.[0]?.url || '';

    const handleGoToChat = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('openChatModal'));
      }
    };

    return (
      <div key={request._id} className="adoption-request-card">
        <div className="request-header">
          {dogImage ? (
            <img 
              src={dogImage} 
              alt={dogName} 
              className="dog-thumbnail"
            />
          ) : (
            <div className="dog-thumbnail placeholder">
              {t('adoptionRequests.noImage')}
            </div>
          )}
          <div className="request-info">
            <h3>{dogName}</h3>
            <p className="dog-details">
              {dogBreed} • {dogAge} {t('adoptionRequests.years')} • {t(`gender.${dogGender}`, dogGender)}
            </p>
            <p className="request-status">
              {getStatusBadge(request.status)}
            </p>
          </div>
        </div>

        <div className="request-details">
          <div className="participant-info">
            <span className="label">{t('adoption.adopter')}:</span>
            <span>{request.adopter.name}</span>
          </div>
          {request.message && (
            <div className="request-message">
              <span className="label">{t('adoption.message')}:</span>
              <span>{request.message}</span>
            </div>
          )}
          <div className="request-date">
            {new Date(request.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="request-actions">
          {['pending', 'owner_confirmed', 'adopter_confirmed'].includes(request.status) && (
            <button 
              className="btn-chat"
              onClick={handleGoToChat}
            >
              💬 {t('adoption.goToChat')}
            </button>
          )}

          {isOwner && request.status === 'pending' && (
            <>
              <button 
                className="btn-confirm"
                onClick={() => handleOwnerConfirm(request._id)}
              >
                {t('adoptionRequests.confirmRequestBtn')}
              </button>
              <button 
                className="btn-deny"
                onClick={() => handleDeny(request._id)}
              >
                {t('adoptionRequests.denyBtn')}
              </button>
            </>
          )}

          {isOwner && request.status === 'adopter_confirmed' && (
            <button 
              className="btn-finalize"
              onClick={() => handleFinalize(request._id)}
            >
              {t('adoptionRequests.finalizeBtn')}
            </button>
          )}

          {isAdopter && request.status === 'owner_confirmed' && (
            <button 
              className="btn-confirm"
              onClick={() => handleAdopterConfirm(request._id)}
            >
              {t('adoptionRequests.confirmAdoptionBtn')}
            </button>
          )}

          {isAdopter && request.status === 'pending' && (
            <button 
              className="btn-cancel"
              onClick={() => handleCancel(request._id)}
            >
              {t('adoptionRequests.cancelRequestBtn')}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">{t('adoptionRequests.loading')}</div>;
  }

  return (
    <div className="adoption-requests-container">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="adoption-requests-header">
        <h2>{t('adoption.title')}</h2>
        <button className="btn-refresh" onClick={fetchRequests}>
          {t('adoption.refresh')}
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="no-requests">
          {t('adoption.noRequests')}
        </div>
      ) : (
        <div className="adoption-requests-list">
          {requests.map(getRequestCard)}
        </div>
      )}
    </div>
  );
};

export default AdoptionRequests;