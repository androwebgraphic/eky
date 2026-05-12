import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getApiUrl } from '../utils/apiUrl';
import './UserManagement.css';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  phone: string;
  profilePicture?: string;
  suspendedUntil?: string | Date;
  isDeleted?: boolean;
  createdAt?: string | Date;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [suspendDays, setSuspendDays] = useState(30);

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const url = `${apiUrl}/api/users/me`;
      console.log('[UserManagement] Fetching current user from:', url);
      console.log('[UserManagement] Token exists:', !!token);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[UserManagement] Response status:', response.status);
      console.log('[UserManagement] Response ok:', response.ok);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('[UserManagement] Content-Type:', contentType);
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('[UserManagement] User data received:', data);
          setCurrentUser(data);
        } else {
          const text = await response.text();
          console.error('[UserManagement] Non-JSON response:', text);
          setError('Server returned invalid data format');
        }
      } else {
        const text = await response.text();
        console.error('[UserManagement] Error response:', response.status, text);
        setError(`Failed to fetch user data: ${response.status}`);
      }
    } catch (err) {
      console.error('[UserManagement] Error fetching current user:', err);
      setError('Error connecting to server');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const url = `${apiUrl}/api/users/all`;
      console.log('[UserManagement] Fetching all users from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[UserManagement] Response status:', response.status);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('[UserManagement] Content-Type:', contentType);
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('[UserManagement] Users data received:', data);
          setUsers(data);
        } else {
          const text = await response.text();
          console.error('[UserManagement] Non-JSON response:', text);
          setError('Server returned invalid data format');
        }
      } else {
        const text = await response.text();
        console.error('[UserManagement] Error response:', response.status, text);
        setError(`Failed to fetch users: ${response.status}`);
      }
    } catch (err) {
      setError('An error occurred while fetching users');
      console.error('[UserManagement] Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: string, days: number) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + days);
      
      const response = await fetch(`${apiUrl}/api/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ suspendedUntil })
      });

      if (response.ok) {
        await fetchUsers();
        setShowSuspendModal(false);
        setSelectedUser(null);
        setSuspendDays(30);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to suspend user');
      }
    } catch (err) {
      setError('An error occurred while suspending user');
      console.error('Error suspending user:', err);
    }
  };

  const handleUnsuspend = async (userId: string) => {
    if (!window.confirm('Are you sure you want to unsuspend this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/users/${userId}/unsuspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to unsuspend user');
      }
    } catch (err) {
      setError('An error occurred while unsuspending user');
      console.error('Error unsuspending user:', err);
    }
  };

  const handleDelete = async (userId: string) => {
    console.log('[DELETE USER] Starting delete for userId:', userId);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const url = `${apiUrl}/api/users/${userId}/account`;
      console.log('[DELETE USER] API URL:', url);
      console.log('[DELETE USER] Token exists:', !!token);
      console.log('[DELETE USER] Token preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[DELETE USER] Response status:', response.status);
      console.log('[DELETE USER] Response ok:', response.ok);

      if (response.ok) {
        console.log('[DELETE USER] Success - refreshing user list');
        setShowDeleteModal(false);
        setSelectedUser(null);
        await fetchUsers();
      } else {
        let errorMsg = 'Failed to delete user';
        try {
          const data = await response.json();
          console.log('[DELETE USER] Error response data:', data);
          errorMsg = data.message || errorMsg;
        } catch (parseErr) {
          console.error('[DELETE USER] Could not parse error response:', parseErr);
        }
        setError(errorMsg);
        setShowDeleteModal(false);
        setSelectedUser(null);
      }
    } catch (err) {
      console.error('[DELETE USER] Network/exception error:', err);
      setError('An error occurred while deleting user');
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const isUserSuspended = (user: User) => {
    if (!user.suspendedUntil) return false;
    return new Date(user.suspendedUntil) > new Date();
  };

  const getSuspensionEndDate = (user: User) => {
    if (!user.suspendedUntil) return null;
    return new Date(user.suspendedUntil).toLocaleDateString('hr-HR');
  };

  const filterUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    let matchesStatus = true;
    if (filterStatus === 'suspended') {
      matchesStatus = isUserSuspended(user);
    } else if (filterStatus === 'deleted') {
      matchesStatus = user.isDeleted === true;
    } else if (filterStatus === 'active') {
      matchesStatus = !isUserSuspended(user) && user.isDeleted !== true;
    }
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const canManageUser = (user: User) => {
    if (!currentUser) return false;
    if (user._id === currentUser._id) return false;
    if (user.role === 'superadmin') return false;
    return true;
  };

  if (loading) {
    return (
      <div className="user-management-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1>User Management</h1>
        <p className="user-count">Total Users: {users.length}</p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
            <option value="superadmin">Superadmins</option>
          </select>
        </div>
        
        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      <div className="users-list">
        {filterUsers.length === 0 ? (
          <div className="no-users">No users found matching the criteria</div>
        ) : (
          filterUsers.map(user => (
            <div key={user._id} className="user-card">
              <div className="user-card-header">
                <div className="user-avatar">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="user-info">
                  <h3>{user.name}</h3>
                  <p className="username">@{user.username}</p>
                </div>
                <div className="user-badges">
                  <span className={`role-badge role-${user.role}`}>{user.role}</span>
                  {isUserSuspended(user) && (
                    <span className="status-badge suspended">Suspended</span>
                  )}
                  {user.isDeleted && (
                    <span className="status-badge deleted">Deleted</span>
                  )}
                </div>
              </div>
              
              <div className="user-card-body">
                <div className="user-detail">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{user.email}</span>
                </div>
                <div className="user-detail">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{user.phone}</span>
                </div>
                {isUserSuspended(user) && (
                  <div className="user-detail">
                    <span className="detail-label">Suspended until:</span>
                    <span className="detail-value text-danger">{getSuspensionEndDate(user)}</span>
                  </div>
                )}
              </div>
              
              {canManageUser(user) && (
                <div className="user-card-actions">
                  {isUserSuspended(user) ? (
                    <button
                      onClick={() => handleUnsuspend(user._id)}
                      className="btn btn-unsuspend"
                    >
                      Unsuspend
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowSuspendModal(true);
                      }}
                      className="btn btn-suspend"
                    >
                      Suspend
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowDeleteModal(true);
                    }}
                    className="btn btn-delete"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Suspend Modal - rendered via Portal to body for correct positioning */}
      {showSuspendModal && selectedUser && createPortal(
        <div className="user-mgmt-modal-overlay" onClick={() => setShowSuspendModal(false)}>
          <div className="user-mgmt-modal-content" onClick={e => e.stopPropagation()}>
            <h2>Suspend User</h2>
            <p>You are about to suspend <strong>{selectedUser.name}</strong> (@{selectedUser.username})</p>
            <div className="modal-form-group">
              <label>Suspend for:</label>
              <select
                value={suspendDays}
                onChange={(e) => setSuspendDays(parseInt(e.target.value))}
                className="modal-select"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspend(selectedUser._id, suspendDays)}
                className="btn btn-danger"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Modal - rendered via Portal to body for correct positioning */}
      {showDeleteModal && selectedUser && createPortal(
        <div className="user-mgmt-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="user-mgmt-modal-content" onClick={e => e.stopPropagation()}>
            <h2>Delete User Account</h2>
            <p className="warning-text">
              You are about to permanently delete the account of <strong>{selectedUser.name}</strong> (@{selectedUser.username})
            </p>
            <p className="warning-text">This action cannot be undone!</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedUser._id)}
                className="btn btn-danger"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserManagement;