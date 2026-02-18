import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import '../css/chat-app.css';
import '../styles/chatAppNotification.css';

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
  if (process.env.REACT_APP_API_URL !== undefined) {
    return process.env.REACT_APP_API_URL;
  }
  const hostname = window.location.hostname;
  if (window.location.protocol === 'https:') {
    return `https://${hostname}`;
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return `http://${hostname}:3001`;
  }
  return `http://192.168.1.100:3001`;
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
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [userWithBlocks] = useState<UserWithBlocks | null>(null);
  const [confirmingAdoption, setConfirmingAdoption] = useState(false);
  const [chatVisible, setChatVisible] = useState(true);
  const [adoptionRequests, setAdoptionRequests] = useState<any[]>([]);
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
      message: input,
      messageType: 'text',
      dogId: adoptionDogId || undefined,
      isOwner: adoptionIsOwner
    };
    socketRef.current?.emit('sendMessage', messagePayload);
    await fetch(`${getApiUrl()}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(messagePayload)
    });
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
  };

  const fetchAdoptionRequests = async () => {
    if (!token) {
      return;
    }
    setLoadingRequests(true);
    try {
      const dogsRes = await fetch(`${getApiUrl()}/api/dogs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dogsRes.ok) {
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
      }
    } catch (err) {
      console.error('Failed to fetch adoption requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchAdoptionRequests();
  }, [token]);

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
    try {
      const res = await fetch(`${getApiUrl()}/api/dogs/confirm-adoption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ dogId, isOwner })
      });
      if (res.ok) {
        setNotification(t('adoptionConfirmed'));
        const dogRes = await fetch(`${getApiUrl()}/api/dogs/${dogId}`);
        if (dogRes.ok) {
          const dogData = await dogRes.json();
          setDogStatusMap(prev => ({ ...prev, [dogId]: dogData.adoptionStatus }));
        }
        setAdoptionDogId('');
        setAdoptionIsOwner(false);
      }
    } catch (err) {
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
    
    socketRef.current = io(getApiUrl());
    
    socketRef.current.on('connect', () => {
      socketRef.current?.emit('join', userId);
      socketRef.current?.emit('getOnlineUsers');
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('[DEBUG] Socket disconnected');
    });
    
    socketRef.current.on('onlineUsers', (users) => {
      if (users.length > 1) {
        setOnlineUsers(users.filter((u: any) => u._id !== userId));
      } else {
        setOnlineUsers(users);
      }
    });
    
    socketRef.current.on('adoptionUpdate', () => {
      window.location.reload();
    });
    
    socketRef.current.on('dogUpdated', ({ dog }) => {
      if (dog && dog._id) {
        fetch(`${getApiUrl()}/api/dogs/${dog._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            setDogStatusMap(prev => ({ ...prev, [dog._id]: data.adoptionStatus }));
            setDogOwnerMap(prev => ({ ...prev, [dog._id]: data.owner }));
            // Dispatch window event for DogList to refresh
            window.dispatchEvent(new CustomEvent('dogUpdated'));
          });
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
          .then(res => res.json())
          .then(data => {
            setDogStatusMap(prev => ({ ...prev, [msg.dogId]: data.adoptionStatus }));
            setDogOwnerMap(prev => ({ ...prev, [msg.dogId]: data.owner }));
          });
        setAdoptionDogId('');
        setAdoptionIsOwner(false);
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
          setAdoptionDogId(adoptionMsg.dogId);
          setAdoptionIsOwner(adoptionMsg.isOwner || false);
          found = true;
          fetch(`${getApiUrl()}/api/dogs/${adoptionMsg.dogId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(dog => {
              setDogStatusMap(prev => ({ ...prev, [adoptionMsg.dogId]: dog.adoptionStatus }));
              setDogOwnerMap(prev => ({ ...prev, [adoptionMsg.dogId]: dog.owner }));
              if (dog.adoptionStatus === 'completed' || dog.adoptionStatus === 'closed' || dog.adoptionStatus === 'canceled' || dog.adoptionStatus === 'cancelled') {
                setNotification(t('adoptionConfirmed'));
                setAdoptionDogId('');
                setAdoptionIsOwner(false);
                setMessages(prev => [
                  ...prev,
                  {
                    _id: Math.random().toString(36).substr(2, 9),
                    sender: null,
                    recipient: null,
                    message: t('adoptionConfirmed'),
                    sentAt: new Date().toISOString(),
                    messageType: 'system',
                    dogId: adoptionMsg.dogId
                  }
                ]);
              }
            });
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
          
          return matches && (dog.adoptionStatus === 'pending' || dog.adoptionStatus === 'adopted');
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
  
  if (!chatVisible) {
    return null;
  }

  const getProfilePic = (u: any) => {
    const pic = u?.profilePicture;
    if (pic && typeof pic === 'string' && pic.trim() !== '') {
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      if (/^(https?:\/\/|data:|blob:)/i.test(pic)) {
        return pic + '?v=' + Date.now();
      }
      if (pic.startsWith('/uploads') || pic.startsWith('/u/')) {
        return apiBase + pic + '?v=' + Date.now();
      }
      return pic + '?v=' + Date.now();
    }
    return '/img/chat-icon.svg';
  };

  return (
    <div className="chat-app-container" style={{ display: 'flex', height: '100%' }}>
      <div className="chat-app-sidebar" style={{ width: 220, borderRight: '1px solid #eee', background: '#fafbfc', padding: 0 }}>
        <div style={{ fontWeight: 'bold', padding: '12px 16px', borderBottom: '1px solid #eee' }}>{t('onlineUsers') || 'Online Users'}</div>
        {onlineUsers.length === 0 ? (
          <div style={{ padding: 16, color: '#888' }}>{t('noUsersOnline') || 'No users online.'}</div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {onlineUsers.map(u => (
              <li key={u._id} 
                  style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', background: selectedConvo && selectedConvo.participants.includes(u._id) ? '#e6f7ff' : 'transparent' }}
                  onClick={() => startConversation(u._id)}>
                <img 
                  src={getProfilePic(u)}
                  alt={u.userName || 'User'}
                  style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 12, objectFit: 'cover', border: '1px solid #ddd' }} 
                />
                <span style={{ flex: 1 }}>{u.userName || u._id}</span>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4caf50', display: 'inline-block', marginLeft: 8 }} title="Online"></span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {(!socketRef.current || !socketRef.current.connected) && (
          <div style={{ background: '#fcc', color: '#900', padding: '8px', marginBottom: '8px', fontWeight: 'bold' }}>
            Socket not connected. Check backend/server.
          </div>
        )}
        {selectedConvo ? (
          <>
            <div className="chat-app-header" style={{ borderBottom: '1px solid #eee', padding: '12px 16px', background: '#f7fafd' }}>
              {(() => {
                const otherUser = onlineUsers.find(u => selectedConvo.participants.includes(u._id) && u._id !== user._id);
                return (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img 
                      src={otherUser ? getProfilePic(otherUser) : '/img/chat-icon.svg'}
                      alt={otherUser?.userName || 'User'}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} 
                    />
                    <span>{t('chatWith') || 'Chat with'} {otherUser?.userName || selectedConvo.participants.filter(id => id !== user._id).join(', ')}</span>
                  </span>
                );
              })()}
              <button
                onClick={() => setChatVisible(false)}
                style={{
                  float: 'right',
                  background: '#e74c3c',
                  border: 'none',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 16,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(231,76,60,0.10)',
                }}
                title="Close chat"
                aria-label="Close chat"
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
              <span style={{ float: 'right', display: 'flex', gap: 8 }}>
                <button style={{ background: isBlocked ? '#ff9800' : '#eee', color: isBlocked ? '#fff' : '#333', border: 'none', borderRadius: 4, padding: '6px 12px', marginLeft: 8 }} onClick={handleBlockUnblock}>
                  {isBlocked ? (t('unblock') || 'Unblock') : (t('block') || 'Block')}
                </button>
                <button style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', marginLeft: 8 }} onClick={handleDeleteConversation}>
                  {t('deleteConversation') || 'Delete Conversation'}
                </button>
              </span>
            </div>
            {adoptionDogId && (
              <div style={{ padding: '12px 16px', background: '#fffbe6', borderBottom: '1px solid #ffe58f', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>{t('adoptionPending') || 'Adoption pending for this dog.'}</span>
                {(() => {
                  const status = dogStatusMap[adoptionDogId];
                  if (status === 'pending') {
                    if (!confirmingAdoption && adoptionIsOwner) {
                      return (
                        <button
                          style={{ background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', marginLeft: 8 }}
                          onClick={() => handleConfirmAdoption(adoptionDogId, true)}
                          disabled={confirmingAdoption}
                        >
                          {confirmingAdoption ? (t('confirming') || 'Confirming...') : (t('confirmAdoption') || 'Confirm Adoption')}
                        </button>
                      );
                    } else if (!confirmingAdoption && !adoptionIsOwner) {
                      return (
                        <button
                          style={{ background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', marginLeft: 8 }}
                          onClick={() => handleConfirmAdoption(adoptionDogId, false)}
                          disabled={confirmingAdoption}
                        >
                          {confirmingAdoption ? (t('confirming') || 'Confirming...') : (t('confirmAdoption') || 'Confirm Adoption')}
                        </button>
                      );
                    } else {
                      return (
                        <span style={{ marginLeft: 12, color: '#888' }}>{t('waitingForOtherParty') || 'Waiting for other party to confirm...'}</span>
                      );
                    }
                  }
                  return null;
                })()}
                {adoptionDogId && !adoptionIsOwner && (
                  <button style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', marginLeft: 8 }} onClick={() => handleCancelAdoption(adoptionDogId)}>{t('cancelAdoption') || 'Cancel Adoption'}</button>
                )}
              </div>
            )}
            <div className="chat-app-messages" style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f9f9fb' }}>
              {messages.length === 0 ? (
                <div className="chat-app-empty">No messages yet.</div>
              ) : (
                messages.map(msg => {
                  // Determine if this is an adoption request message that needs action buttons
                  const isAdoptionRequest = msg.messageType === 'adoption_request' && msg.requiresAction && !msg.actionTakenBy;
                  const isOwnerMessage = msg.recipient === user._id; // Owner received the request
                  
                  return (
                    <div key={msg._id} className={`chat-app-message${msg.sender === user._id ? ' self' : ''}`}>
                      <span className="chat-app-bubble" style={{
                        background: isAdoptionRequest ? '#e3f2fd' : undefined,
                        border: isAdoptionRequest ? '2px solid #2196f3' : undefined
                      }}>
                        {msg.message}
                      </span>
                      
                      {/* Show action buttons for adoption requests */}
                      {isAdoptionRequest && isOwnerMessage && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleAdoptionAction(msg._id, 'owner_confirm')}
                            style={{
                              background: '#4caf50',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            {t('confirm') || 'Confirm'}
                          </button>
                          <button
                            onClick={() => handleAdoptionAction(msg._id, 'owner_deny')}
                            style={{
                              background: '#f44336',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            {t('deny') || 'Deny'}
                          </button>
                        </div>
                      )}
                      
                      {/* Show confirm/cancel buttons for adopter after owner confirmed */}
                      {msg.messageType === 'adoption_confirmed' && msg.requiresAction && !msg.actionTakenBy && msg.recipient === user._id && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleAdoptionAction(msg._id, 'adopter_confirm')}
                            style={{
                              background: '#4caf50',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            {t('confirmAdoption') || 'Confirm Adoption'}
                          </button>
                          <button
                            onClick={() => handleAdoptionAction(msg._id, 'adopter_cancel')}
                            style={{
                              background: '#f44336',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            {t('cancel') || 'Cancel'}
                          </button>
                        </div>
                      )}
                      
                      {/* Show system messages in different style */}
                      {(msg.messageType === 'adoption_denied' || msg.messageType === 'adoption_cancelled' || msg.messageType === 'adoption_completed') && (
                        <div style={{ 
                          marginTop: 8, 
                          padding: '8px 12px', 
                          background: msg.messageType === 'adoption_completed' ? '#e8f5e9' : '#ffebee',
                          borderRadius: 4,
                          fontSize: '12px',
                          textAlign: 'center',
                          border: `1px solid ${msg.messageType === 'adoption_completed' ? '#4caf50' : '#f44336'}`
                        }}>
                          {msg.message}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="chat-app-input-row" style={{ borderTop: '1px solid #eee', padding: 12, background: '#fff' }}>
              <input
                className="chat-app-input"
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={t('typeMessagePlaceholder') || 'Type a message...'}
                style={{ width: '80%', marginRight: 8 }}
              />
              <button
                className="chat-app-send-btn"
                onClick={sendMessage}
                disabled={!input.trim()}
                style={{ background: '#1890ff', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px' }}
              >{t('send') || 'Send'}</button>
            </div>
            {notification && (
              <div className="chat-app-notification">{notification}</div>
            )}
          </>
        ) : (
          <div className="chat-app-empty" style={{ padding: 32, textAlign: 'center', color: '#888' }}>{t('selectUserToChat') || 'Select a user to start chatting.'}</div>
        )}
      </div>
    </div>
  );
}

export default ChatApp;