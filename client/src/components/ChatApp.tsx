import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import '../css/chat-app.css';
import '../styles/chatAppNotification.css';

// Dispatch chat close event to parent
const dispatchCloseChat = () => {
  window.dispatchEvent(new CustomEvent('closeChatModal'));
};

// Singleton portal container for notifications - create once, reuse forever
let notificationRoot: HTMLElement | null = null;
const getNotificationRoot = (): HTMLElement => {
  if (!notificationRoot) {
    notificationRoot = document.getElementById('chat-notification-root');
    if (!notificationRoot) {
      notificationRoot = document.createElement('div');
      notificationRoot.id = 'chat-notification-root';
      notificationRoot.style.position = 'fixed';
      notificationRoot.style.top = '0';
      notificationRoot.style.left = '0';
      notificationRoot.style.width = '100%';
      notificationRoot.style.height = '100%';
      notificationRoot.style.pointerEvents = 'none';
      notificationRoot.style.zIndex = '999999';
      document.body.appendChild(notificationRoot);
    }
  }
  return notificationRoot;
};

interface UserWithBlocks {
  _id: string;
  blockedUsers?: string[];
}

interface Message {
  _id: string;
  sender: string;
  recipient: string;
  message: string;
  sentAt: string;
  messageType?: string;
  dogId?: string;
  isOwner?: boolean;
  requiresAction?: boolean;
  actionTakenBy?: string;
}

interface Conversation {
  _id: string;
  participants: string[];
}

const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL !== undefined && process.env.REACT_APP_API_URL.trim() !== '') {
    return process.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  if (window.location.protocol === 'https:') {
    return `https://${hostname}`;
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  // For IP addresses (including mobile network access)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return `http://${hostname}:3001`;
  }
  // Fallback - use current protocol and hostname
  return `${window.location.protocol}//${hostname}:3001`;
};


interface ChatAppProps {
  dogId?: string;
  adoptionConvoUserId?: string | null;
}

const ChatApp: React.FC<ChatAppProps> = ({ dogId, adoptionConvoUserId }) => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  
  const [dogStatusMap, setDogStatusMap] = useState<Record<string, string>>({});
  const [dogOwnerMap, setDogOwnerMap] = useState<Record<string, string>>({});
  const [adoptionDogId, setAdoptionDogId] = useState('');
  const [adoptionIsOwner, setAdoptionIsOwner] = useState(false);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [notification, setNotification] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (notification && notification.length > 0) {
      const timeout = setTimeout(() => {
        setNotification('');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [notification]);

  // Debounced user search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (userSearchQuery) {
        searchUsers(userSearchQuery);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [userSearchQuery]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [userWithBlocks] = useState<UserWithBlocks | null>(null);
  const [confirmingAdoption, setConfirmingAdoption] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [adoptionRequests, setAdoptionRequests] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingRequests, setLoadingRequests] = useState(false);
  const socketRef = useRef<any>(null);

  const sendMessage = async () => {
    if (!selectedConvo || !token || !input.trim()) {
      return;
    }
    const recipient = selectedConvo.participants.find(id => id !== user._id);
    const messagePayload: any = {
      conversationId: selectedConvo._id,
      sender: user._id,
      recipient: recipient,
      message: input,
      messageType: 'text',
      dogId: adoptionDogId || undefined,
      isOwner: adoptionIsOwner
    };
    socketRef.current?.emit('sendMessage', messagePayload);
    try {
      const res = await fetch(`${getApiUrl()}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messagePayload)
      });
      if (!res.ok) {
        console.error('[SEND MESSAGE] Failed to send message:', res.status, res.statusText);
        const error = await res.text();
        console.error('[SEND MESSAGE] Error response:', error);
        return;
      }
      setMessages(prev => [
        ...prev,
        {
          _id: Math.random().toString(36).substr(2, 9),
          sender: user._id,
          recipient,
          message: input,
          sentAt: new Date().toISOString(),
          messageType: 'text',
          dogId: adoptionDogId || undefined,
          isOwner: adoptionIsOwner
        }
      ]);
      setInput('');
    } catch (err) {
      console.error('[SEND MESSAGE] Error sending message:', err);
    }
  };

  const fetchAdoptionRequests = async () => {
    if (!token) {
      return;
    }
    setLoadingRequests(true);
    const apiUrl = getApiUrl();
    console.log('[FETCH DOGS] Requesting from URL:', `${apiUrl}/api/dogs`);
    console.log('[FETCH DOGS] Current hostname:', window.location.hostname);
    
    try {
      const dogsRes = await fetch(`${apiUrl}/api/dogs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Log response details for debugging
      console.log('[FETCH DOGS] Response status:', dogsRes.status, dogsRes.statusText);
      console.log('[FETCH DOGS] Response content-type:', dogsRes.headers.get('content-type'));
      
      if (dogsRes.ok) {
        // Check if response is JSON before parsing
        const contentType = dogsRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const allDogs = await dogsRes.json();
          const dogsInAdoption = allDogs.filter((dog: any) => 
            dog.adoptionStatus && 
            dog.adoptionStatus === 'pending' &&
            dog.adoptionQueue &&
            dog.adoptionQueue.adopter &&
            (String(dog.user._id || dog.user) === String(user._id) || 
             String(dog.adoptionQueue.adopter) === String(user._id))
          );
          
          const newReqs = dogsInAdoption.map((dog: any) => ({
            _id: `dog-${dog._id}`,
            dog: dog,
            adopter: dog.adoptionQueue.adopter === String(user._id) ? user : dog.user,
            status: dog.adoptionStatus,
            isFromDog: true
          }));
          setAdoptionRequests(newReqs);
        } else {
          console.warn('[FETCH DOGS] Received non-JSON response from /api/dogs endpoint');
          // Log a sample of the response to help debug
          try {
            const text = await dogsRes.text();
            console.warn('[FETCH DOGS] Response text (first 200 chars):', text.substring(0, 200));
          } catch (e) {
            console.warn('[FETCH DOGS] Could not read response text:', e);
          }
        }
      } else {
        console.warn('[FETCH DOGS] Failed to fetch dogs:', dogsRes.status, dogsRes.statusText);
        // Try to read error response
        try {
          const text = await dogsRes.text();
          console.warn('[FETCH DOGS] Error response (first 200 chars):', text.substring(0, 200));
        } catch (e) {
          console.warn('[FETCH DOGS] Could not read error response:', e);
        }
      }
    } catch (err) {
      console.error('[FETCH DOGS] Failed to fetch adoption requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchAdoptionRequests();
  }, [token]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (adoptionConvoUserId && user?._id) {
      startConversation(adoptionConvoUserId);
    }
  }, [adoptionConvoUserId, user?._id]);
  
  useEffect(() => {
    if (!selectedConvo && onlineUsers.length > 0 && user?._id && !adoptionConvoUserId) {
      const firstUser = onlineUsers[0];
      setSelectedConvo({ _id: firstUser._id, participants: [user._id, firstUser._id] });
    }
  }, [selectedConvo, onlineUsers, user?._id, adoptionConvoUserId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (selectedConvo) {
      const recipient = selectedConvo.participants.find(id => id !== user._id);
      socketRef.current?.emit('typing', { recipient, sender: user._id });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConvo || !token) {
      return;
    }
    await fetch(`${getApiUrl()}/api/chat/messages/${selectedConvo._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setSelectedConvo(null);
    setMessages([]);
  };

  const handleConfirmAdoption = async (dogId: string, isOwner: boolean) => {
    if (!token) {
      return;
    }
    setConfirmingAdoption(true);
    setNotification(''); // Clear any existing notification first
    try {
      const res = await fetch(`${getApiUrl()}/api/dogs/${dogId}/adopt-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotification(t('adoptionConfirmed'));
        // If adoption is complete (dog deleted), clear adoption notice
        if (data.adopted && data.removed) {
          setDogStatusMap(prev => ({ ...prev, [dogId]: 'adopted' }));
          setAdoptionDogId('');
          setAdoptionIsOwner(false);
          setTimeout(() => setNotification(''), 1500); // Clear notification after adoption complete
        } else if (data.dog) {
          setDogStatusMap(prev => ({ ...prev, [dogId]: data.dog.adoptionStatus }));
          // Only clear adoption notice if status is completed or closed
          if (data.dog.adoptionStatus === 'completed' || data.dog.adoptionStatus === 'closed') {
            setAdoptionDogId('');
            setAdoptionIsOwner(false);
          }
        }
      } else {
        setNotification(t('adoptionConfirmError'));
      }
    } catch (err) {
      console.error('Error confirming adoption:', err);
      setNotification(t('adoptionConfirmError'));
    } finally {
      setConfirmingAdoption(false);
    }
  };

  const handleCancelAdoption = async (dogId: string) => {
    if (!token) {
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/dogs/${dogId}/adopt-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: '' })
      });
      if (res.ok) {
        setNotification(t('adoptionCanceled'));
        setAdoptionDogId('');
        setAdoptionIsOwner(false);
      }
    } catch (err) {
      setNotification(t('adoptionCancelError'));
    }
  };

  // Handle adoption action from chat message
  const handleAdoptionAction = async (messageId: string, action: string) => {
    if (!token) {
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/adoption/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ messageId, action })
      });
      if (res.ok) {
        const data = await res.json();
        setNotification(data.message);
        // Refresh messages to show updated state
        if (selectedConvo) {
          fetch(`${getApiUrl()}/api/chat/messages/${selectedConvo._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(data => setMessages(data));
        }
        // Fetch updated dog status
        if (data.adoptionRequest && data.adoptionRequest.dog) {
          setDogStatusMap(prev => ({ ...prev, [data.adoptionRequest.dog._id]: data.adoptionRequest.dog.adoptionStatus }));
        }
      } else {
        const error = await res.json();
        setNotification(error.error || 'Action failed');
      }
    } catch (err) {
      console.error('Error handling adoption action:', err);
      setNotification('Failed to handle adoption action');
    }
  };

  const isBlocked = selectedConvo && userWithBlocks && userWithBlocks.blockedUsers && selectedConvo.participants.some(
    id => String(id) !== String(userWithBlocks._id) && userWithBlocks.blockedUsers!.map(String).includes(String(id))
  );

  const otherUserId = selectedConvo && userWithBlocks ? selectedConvo.participants.find(id => id !== userWithBlocks._id) : null;

  const handleBlockUnblock = async () => {
    if (!otherUserId || !token) {
      return;
    }
    const url = isBlocked ? '/api/chat/unblock' : '/api/chat/block';
    await fetch(`${getApiUrl()}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId: user._id, blockId: otherUserId })
    });
  };

  const userIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    const userId = user?._id;
    if (!userId || !token) {
      return;
    }
    if (userIdRef.current === userId && socketRef.current?.connected) {
      return;
    }
    
    userIdRef.current = userId;
    
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }
    
    const apiUrl = getApiUrl();
    console.log('[SOCKET] Attempting to connect to:', apiUrl);
    
    socketRef.current = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socketRef.current.on('connect', () => {
      console.log('[SOCKET] Connected successfully, joining as user:', userId);
      socketRef.current?.emit('join', userId);
      socketRef.current?.emit('getOnlineUsers');
    });
    
    socketRef.current.on('connect_error', (err) => {
      console.error('[SOCKET] Connection error:', err.message, err);
    });
    
    socketRef.current.on('disconnect', (reason) => {
      console.log('[SOCKET] Disconnected:', reason);
    });
    
    socketRef.current.on('onlineUsers', (users) => {
      console.log('[SOCKET] Received online users:', users);
      console.log('[SOCKET] Current userId:', userId);
      // Always filter out current user from online users list
      const filteredUsers = users.filter((u: any) => u._id !== userId);
      console.log('[SOCKET] Filtered users:', filteredUsers);
      setOnlineUsers(filteredUsers);
    });
    
    socketRef.current.on('adoptionUpdate', () => {
      window.location.reload();
    });
    
    socketRef.current.on('dogUpdated', ({ dog }) => {
      if (dog && dog._id) {
        fetch(`${getApiUrl()}/api/dogs/${dog._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => {
            if (res.status === 404) {
              // Dog has been deleted (adopted)
              console.log('[DOG UPDATED] Dog deleted, marking as adopted');
              setDogStatusMap(prev => ({ ...prev, [dog._id]: 'adopted' }));
              window.dispatchEvent(new CustomEvent('dogUpdated'));
              return;
            }
            return res.json();
          })
          .then(data => {
            if (data) {
              setDogStatusMap(prev => ({ ...prev, [dog._id]: data.adoptionStatus }));
              setDogOwnerMap(prev => ({ ...prev, [dog._id]: data.owner }));
            }
            // Dispatch window event for DogList to refresh
            window.dispatchEvent(new CustomEvent('dogUpdated'));
          })
          .catch(err => console.error('[DOG UPDATED] Error:', err));
      }
    });
    
    socketRef.current.on('receiveMessage', (msg) => {
      const adoptionSystemKeywords = ['confirmed', 'completed', 'closed', 'canceled', 'cancelled'];
      const isAdoptionSystemMsg = (msg.messageType === 'adoption' || msg.messageType === 'adoption_cancelled') && msg.dogId && msg.message && adoptionSystemKeywords.some(k => msg.message.toLowerCase().includes(k));
      if (isAdoptionSystemMsg) {
        setMessages(prev => [...prev, {
          _id: Math.random().toString(36).substr(2, 9),
          sender: null,
          recipient: null,
          message: msg.message,
          sentAt: new Date().toISOString(),
          messageType: 'system',
          dogId: msg.dogId
        }]);
        setNotification(msg.message);
        fetch(`${getApiUrl()}/api/dogs/${msg.dogId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => {
            if (res.status === 404) {
              // Dog has been deleted (adopted)
              console.log('[RECEIVE MESSAGE] Dog deleted, marking as adopted');
              setDogStatusMap(prev => ({ ...prev, [msg.dogId]: 'adopted' }));
              setAdoptionDogId('');
              setAdoptionIsOwner(false);
              return;
            }
            return res.json();
          })
          .then(data => {
            if (data) {
              setDogStatusMap(prev => ({ ...prev, [msg.dogId]: data.adoptionStatus }));
              setDogOwnerMap(prev => ({ ...prev, [msg.dogId]: data.owner }));
              // Only clear adoption notice if status is completed or closed
              if (data.adoptionStatus === 'completed' || data.adoptionStatus === 'closed') {
                setAdoptionDogId('');
                setAdoptionIsOwner(false);
              }
            }
          })
          .catch(err => console.error('[RECEIVE MESSAGE] Error:', err));
      } else {
        setMessages(prev => [...prev, msg]);
        if (msg.messageType === 'adoption' && msg.dogId) {
          setAdoptionDogId(msg.dogId);
          setAdoptionIsOwner(!!msg.isOwner);
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?._id, token]);

  useEffect(() => {
    if (!selectedConvo || !token) {
      return;
    }
    fetch(`${getApiUrl()}/api/chat/messages/${selectedConvo._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(async data => {
        setMessages(data);
        let found = false;
        const adoptionMsg = data.find((m: any) => m.messageType === 'adoption' && m.dogId);
        if (adoptionMsg && adoptionMsg.dogId) {
          // Check dog status first before showing adoption notice
          fetch(`${getApiUrl()}/api/dogs/${adoptionMsg.dogId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(res => {
              if (res.status === 404) {
                // Dog has been deleted (adopted)
                console.log('[CONVO LOAD] Dog deleted, marking as adopted');
                setDogStatusMap(prev => ({ ...prev, [adoptionMsg.dogId]: 'adopted' }));
                setAdoptionDogId('');
                setAdoptionIsOwner(false);
                return;
              }
              return res.json();
            })
            .then(dog => {
              if (dog) {
                setDogStatusMap(prev => ({ ...prev, [adoptionMsg.dogId]: dog.adoptionStatus }));
                setDogOwnerMap(prev => ({ ...prev, [adoptionMsg.dogId]: dog.owner }));
                // Only show adoption notice if status is still pending
                if (dog.adoptionStatus === 'pending') {
                  setAdoptionDogId(adoptionMsg.dogId);
                  setAdoptionIsOwner(adoptionMsg.isOwner || false);
                } else {
                  // Dog is completed/closed/canceled, don't show notice
                  setAdoptionDogId('');
                  setAdoptionIsOwner(false);
                }
              }
            })
            .catch(err => console.error('[CONVO LOAD] Error:', err));
          found = true;
        }
        if (!found) {
          try {
            const res = await fetch(`${getApiUrl()}/api/dogs`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
              const dogs = await res.json();
              const convoUserIds = selectedConvo.participants.map(String);
              const pendingDog = dogs.find((dog: any) =>
                dog.adoptionStatus === 'pending' &&
                dog.adoptionQueue && dog.adoptionQueue.adopter &&
                convoUserIds.includes(String(dog.user._id || dog.user)) &&
                convoUserIds.includes(String(dog.adoptionQueue.adopter))
              );
              if (pendingDog && pendingDog._id) {
                setAdoptionDogId(pendingDog._id);
                setAdoptionIsOwner(String(pendingDog.user._id || pendingDog.user) === String(user._id));
                fetch(`${getApiUrl()}/api/dogs/${pendingDog._id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
                  .then(res => res.json())
                  .then(dog => {
                    setDogStatusMap(prev => ({ ...prev, [pendingDog._id]: dog.adoptionStatus }));
                    setDogOwnerMap(prev => ({ ...prev, [pendingDog._id]: dog.owner }));
                  });
              }
            }
          } catch {}
        }
      });
  }, [selectedConvo, token, user._id]);

  // Poll dog status when we have a pending adoption
  useEffect(() => {
    if (!adoptionDogId || !token) {
      return;
    }
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/dogs/${adoptionDogId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const dog = await res.json();
          setDogStatusMap(prev => ({ ...prev, [adoptionDogId]: dog.adoptionStatus }));
          setDogOwnerMap(prev => ({ ...prev, [adoptionDogId]: dog.owner }));
          // Clear adoption notice if status is no longer pending
          if (dog.adoptionStatus !== 'pending') {
            setAdoptionDogId('');
            setAdoptionIsOwner(false);
            clearInterval(interval);
          }
        } else if (res.status === 404) {
          // Dog has been deleted (adopted)
          console.log('[POLLING] Dog deleted, clearing adoption notice');
          setDogStatusMap(prev => ({ ...prev, [adoptionDogId]: 'adopted' }));
          setAdoptionDogId('');
          setAdoptionIsOwner(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling dog status:', err);
      }
    }, 2000); // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, [adoptionDogId, token]);

  const searchUsers = async (query: string) => {
    if (!query.trim() || !token) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/users/search?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const users = await res.json();
        // Filter out current user (already done on backend, but double-check)
        const filteredUsers = users.filter((u: any) => u._id !== user._id);
        setSearchResults(filteredUsers);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const startConversation = async (otherUserId: string) => {
    if (!otherUserId || !token) {
      return;
    }
    
    let convo;
    try {
      const res = await fetch(`${getApiUrl()}/api/chat/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user._id, otherUserId })
      });
      convo = await res.json();
    } catch {
      convo = null;
    }
    if (!convo || !convo._id || !convo.participants) {
      convo = { _id: otherUserId, participants: [user._id, otherUserId] };
    }
    setSelectedConvo(convo);
    
    try {
      const res = await fetch(`${getApiUrl()}/api/dogs`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const dogs = await res.json();
        const convoUserIds = convo.participants.map(String);
        console.log('[DEBUG] Conversation user IDs:', convoUserIds);
        console.log('[DEBUG] Current user ID:', user._id);
        console.log('[DEBUG] Dogs with adoption status:', dogs.filter((d: any) => d.adoptionStatus));
        
        const pendingDog = dogs.find((dog: any) => {
          const dogOwnerId = String(dog.user._id || dog.user);
          const adopterId = String(dog.adoptionQueue?.adopter);
          const isAdopterInConvo = convoUserIds.includes(adopterId);
          const isOwnerInConvo = convoUserIds.includes(dogOwnerId);
          const matches = isAdopterInConvo && isOwnerInConvo;
          
          if (matches && dog.adoptionStatus) {
            console.log('[DEBUG] Found matching dog:', dog.name, 'Status:', dog.adoptionStatus, 'Owner:', dogOwnerId, 'Adopter:', adopterId);
          }
          
          // Only show pending adoptions, not completed/adopted ones
          return matches && dog.adoptionStatus === 'pending';
        });
        
        if (pendingDog && pendingDog._id) {
          console.log('[DEBUG] Setting adoptionDogId:', pendingDog._id);
          setAdoptionDogId(pendingDog._id);
          setAdoptionIsOwner(String(pendingDog.user._id || pendingDog.user) === String(user._id));
          setDogStatusMap(prev => ({ ...prev, [pendingDog._id]: pendingDog.adoptionStatus }));
          setDogOwnerMap(prev => ({ ...prev, [pendingDog._id]: pendingDog.owner }));
        } else {
          console.log('[DEBUG] No matching dog found');
        }
      }
    } catch (err) {
      console.error('Error fetching adoption status:', err);
    }
    
    fetch(`${getApiUrl()}/api/chat/messages/${convo._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(async data => {
        setMessages(data);
        let found = false;
        const adoptionMsg = data.find((m: any) => m.messageType === 'adoption' && m.dogId);
        if (adoptionMsg && adoptionMsg.dogId) {
          setAdoptionDogId(adoptionMsg.dogId);
          setAdoptionIsOwner(adoptionMsg.isOwner || false);
          found = true;
        }
        if (!found && !adoptionDogId) {
          try {
            const res = await fetch(`${getApiUrl()}/api/dogs`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
              const dogs = await res.json();
              const convoUserIds = convo.participants.map(String);
              const pendingDog = dogs.find((dog: any) =>
                dog.adoptionStatus === 'pending' &&
                dog.adoptionQueue && dog.adoptionQueue.adopter &&
                convoUserIds.includes(String(dog.user._id || dog.user)) &&
                convoUserIds.includes(String(dog.adoptionQueue.adopter))
              );
              if (pendingDog && pendingDog._id) {
                setAdoptionDogId(pendingDog._id);
                setAdoptionIsOwner(String(pendingDog.user._id || pendingDog.user) === String(user._id));
              }
            }
          } catch {}
        }
      });
  };

  const getProfilePic = (u: any) => {
    // Check both profilePicture and profilePic fields (MongoDB has both)
    const pic = u?.profilePicture || u?.profilePic;
    const userId = u?._id;
    const apiBase = getApiUrl();
    console.log('[PROFILE PIC] User:', u);
    console.log('[PROFILE PIC] profilePicture:', u?.profilePicture);
    console.log('[PROFILE PIC] profilePic:', u?.profilePic);
    console.log('[PROFILE PIC] Selected pic:', pic);
    console.log('[PROFILE PIC] User ID:', userId);
    console.log('[PROFILE PIC] API base:', apiBase);
    
    if (pic && typeof pic === 'string' && pic.trim() !== '') {
      let url = '';
      if (/^(https?:\/\/|data:|blob:)/i.test(pic)) {
        url = pic;
      } else if (pic.startsWith('/uploads') || pic.startsWith('/u/')) {
        url = apiBase + pic;
      } else if (userId) {
        // If just a filename, construct the full path assuming it's in user's uploads
        url = `${apiBase}/u/users/${userId}/${pic}`;
      } else {
        url = apiBase + '/' + pic.replace(/^\//, '');
      }
      console.log('[PROFILE PIC] Final URL:', url);
      return url;
    }
    console.log('[PROFILE PIC] Using fallback icon');
    return '/img/chat-icon.svg';
  };

  return (
    <>
      {notification && ReactDOM.createPortal(
        <div 
          key="chat-notification" 
          className="chat-app-notification" 
          onClick={() => setNotification('')}
          style={{ cursor: 'pointer' }}
        >
          {notification}
        </div>,
        getNotificationRoot()
      )}
      <div className="chat-app-container">
        <button
          onClick={dispatchCloseChat}
          className="chat-close-btn-top"
          title="Close chat"
          aria-label="Close chat"
          style={{ background: '#e74c3c', color: '#f8f8f8' }}
        >
          <span>×</span>
        </button>
        <div className="chat-app-sidebar">
        <div className="chat-users-header">{t('onlineUsers') || 'Online Users'}</div>
        <div style={{ position: 'relative' }}>
          <input
            className="chat-app-search"
            type="text"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            placeholder={t('searchUsers') || 'Search users...'}
            style={{ paddingRight: userSearchQuery ? '32px' : '12px' }}
          />
          {userSearchQuery && (
            <button
              onClick={() => {
                setUserSearchQuery('');
                setSearchResults([]);
              }}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#999',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px'
              }}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
        {isSearching && (
          <div className="chat-users-empty">Searching...</div>
        )}
        {searchResults.length > 0 && userSearchQuery && (
          <ul className="chat-users-list">
            {searchResults.map(u => (
              <li key={u._id}
                  className="chat-user-item"
                  onClick={() => {
                    startConversation(u._id);
                    setUserSearchQuery('');
                    setSearchResults([]);
                  }}>
                <img
                  src={getProfilePic(u)}
                  alt={u.userName || 'User'}
                  className="chat-user-avatar"
                />
                <span className="chat-user-name">{u.userName || u._id}</span>
                <span className="chat-user-status" style={{ background: '#ccc' }} title="Offline"></span>
              </li>
            ))}
          </ul>
        )}
        {onlineUsers.length === 0 && searchResults.length === 0 ? (
          <div className="chat-users-empty">{t('noUsersOnline') || 'No users online.'}</div>
        ) : (
          <ul className="chat-users-list">
            {onlineUsers.map(u => (
              <li key={u._id} 
                  className={`chat-user-item ${selectedConvo && selectedConvo.participants.includes(u._id) ? 'selected' : ''}`}
                  onClick={() => startConversation(u._id)}>
                <img 
                  src={getProfilePic(u)}
                  alt={u.userName || 'User'}
                  className="chat-user-avatar"
                />
                <span key={`name-${u._id}`} className="chat-user-name">{u.userName || u._id}</span>
                <span key={`status-${u._id}`} className="chat-user-status" title="Online"></span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="chat-app-main">
        {(!socketRef.current || !socketRef.current.connected) && (
          <div className="chat-connection-alert">
            Socket not connected. Check backend/server.
          </div>
        )}
        {selectedConvo ? (
          <>
            <div className="chat-app-header">
              {(() => {
                const otherUser = onlineUsers.find(u => selectedConvo.participants.includes(u._id) && u._id !== user._id);
                return (
                  <div className="chat-header-user">
                    <img 
                      src={otherUser ? getProfilePic(otherUser) : '/img/chat-icon.svg'}
                      alt={otherUser?.userName || 'User'}
                      className="chat-header-avatar"
                    />
                    <span>{t('chatWith') || 'Chat with'} {otherUser?.userName || selectedConvo.participants.filter(id => id !== user._id).join(', ')}</span>
                  </div>
                );
              })()}
              <div className="chat-header-actions">
                <button className={`chat-header-btn btn-block ${isBlocked ? 'blocked' : ''}`} onClick={handleBlockUnblock}>
                  {isBlocked ? (t('unblock') || 'Unblock') : (t('block') || 'Block')}
                </button>
                <button className="chat-header-btn btn-delete" onClick={handleDeleteConversation}>
                  {t('deleteConversation') || 'Delete Conversation'}
                </button>
              </div>
            </div>
            {adoptionDogId && (
              <div className="chat-adoption-notice">
                <span>{t('adoptionPending') || 'Adoption pending for this dog.'}</span>
                <div className="chat-adoption-notice-buttons">
                  {(() => {
                    const status = dogStatusMap[adoptionDogId];
                    if (status === 'pending') {
                      return (
                        <button
                          className="chat-adoption-btn"
                          onClick={() => handleConfirmAdoption(adoptionDogId, adoptionIsOwner)}
                          disabled={confirmingAdoption}
                        >
                          {confirmingAdoption ? (t('confirming') || 'Confirming...') : (t('confirmAdoption') || 'Confirm Adoption')}
                        </button>
                      );
                    }
                    return null;
                  })()}
                  {adoptionDogId && !adoptionIsOwner && (
                    <button className="chat-adoption-btn chat-adoption-btn-cancel" onClick={() => handleCancelAdoption(adoptionDogId)}>{t('cancelAdoption') || 'Cancel Adoption'}</button>
                  )}
                </div>
              </div>
            )}
            <div className="chat-app-messages">
              {messages.length === 0 ? (
                <div className="chat-app-empty">No messages yet.</div>
              ) : (
                messages.map(msg => {
                  const isAdoptionRequest = msg.messageType === 'adoption_request' && msg.requiresAction && !msg.actionTakenBy;
                  const isOwnerMessage = msg.recipient === user._id;
                  const bubbleClass = isAdoptionRequest ? 'chat-app-bubble adoption-request' : 'chat-app-bubble';
                  
                  return (
                    <div key={msg._id} className={`chat-app-message${msg.sender === user._id ? ' self' : ''}`}>
                      <span className={bubbleClass}>
                        {msg.message}
                      </span>
                      
                      {isAdoptionRequest && isOwnerMessage && (
                        <div className="chat-adoption-actions">
                          <button
                            onClick={() => handleAdoptionAction(msg._id, 'owner_confirm')}
                            className="chat-adoption-action-btn btn-confirm"
                          >
                            {t('confirm') || 'Confirm'}
                          </button>
                          <button
                            onClick={() => handleAdoptionAction(msg._id, 'owner_deny')}
                            className="chat-adoption-action-btn btn-deny"
                          >
                            {t('deny') || 'Deny'}
                          </button>
                        </div>
                      )}
                      
                      {msg.messageType === 'adoption_confirmed' && msg.requiresAction && !msg.actionTakenBy && msg.recipient === user._id && (
                        <div className="chat-message-status">
                          <button
                            onClick={() => handleAdoptionAction(msg._id, 'adopter_confirm')}
                            className="chat-status-btn btn-confirm"
                          >
                            {t('confirmAdoption') || 'Confirm Adoption'}
                          </button>
                          <button
                            onClick={() => handleAdoptionAction(msg._id, 'adopter_cancel')}
                            className="chat-status-btn btn-cancel"
                          >
                            {t('cancel') || 'Cancel'}
                          </button>
                        </div>
                      )}
                      
                      {(msg.messageType === 'adoption_denied' || msg.messageType === 'adoption_cancelled' || msg.messageType === 'adoption_completed') && (
                        <div className={`chat-message-final ${msg.messageType === 'adoption_completed' ? 'completed' : ''}`}>
                          {msg.message}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="chat-app-input-row">
              <input
                className="chat-input"
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={t('typeMessagePlaceholder') || 'Type a message...'}
              />
              <button
                className="chat-send-btn"
                onClick={sendMessage}
                disabled={!input.trim()}
              >{t('send') || 'Send'}</button>
            </div>
          </>
        ) : (
          <div className="chat-app-empty">{t('selectUserToChat') || 'Select a user to start chatting.'}</div>
        )}
        </div>
      </div>
    </>
  );
};

export default ChatApp;
