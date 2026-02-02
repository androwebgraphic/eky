// (imports remain unchanged)
// TEMP: Function to send an adoption message for a given dogId
// (moved below imports, inside ChatApp component)
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
}
interface Conversation {
  _id: string;
  participants: string[];
}
const getApiUrl = () => {
  // Try to use explicit env var first
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  // If running on mobile device, try to use window.location.hostname or fallback to LAN IP
  const hostname = window.location.hostname;
  if (window.location.protocol === 'https:') {
    return `https://${hostname}`;
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:3001`;
  }
  // If on mobile, try to use LAN IP or fallback to current hostname
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return `http://${hostname}:3001`;
  }
  // Fallback to hardcoded LAN IP (update as needed for your network)
  return `http://192.168.1.100:3001`;
};

interface ChatAppProps {
  dogId?: string;
}

const ChatApp: React.FC<ChatAppProps> = ({ dogId }) => {

    // Main message sending handler for chat input
    const sendMessage = async () => {
      if (!selectedConvo || !token || !input.trim()) return;
      const recipient = selectedConvo.participants.find(id => id !== user._id);
      const messagePayload: any = {
        conversationId: selectedConvo._id,
        sender: user._id,
        recipient,
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
      // Do not clear adoptionDogId or adoptionIsOwner here; keep them until adoption is confirmed or canceled
    };
  const { t } = useTranslation();

  // ...existing code...


  // Debug: log API URL and socket connection (optional, can be removed)
  // useEffect(() => {
  //   console.log('API URL:', getApiUrl());
  // }, [t]);

  // State and refs
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
  const [userWithBlocks, setUserWithBlocks] = useState<UserWithBlocks | null>(null);
  const socketRef = useRef<any>(null);

  // Auto-select the first available online user as a conversation if none is selected
  useEffect(() => {
    if (!selectedConvo && onlineUsers.length > 0) {
      const firstUser = onlineUsers[0];
      setSelectedConvo({ _id: firstUser._id, participants: [user._id, firstUser._id] });
    }
  }, [selectedConvo, onlineUsers, user._id]);

  // Function to send an adoption message for a given dogId
  const sendAdoptionMessage = async (dogId: string) => {
    if (!selectedConvo || !token) return;
    const recipient = selectedConvo.participants.find(id => id !== user._id);
    const messagePayload: any = {
      conversationId: selectedConvo._id,
      sender: user._id,
      recipient,
      message: t('adoptionRequest') || 'Adoption request',
      messageType: 'adoption',
      dogId,
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
        message: messagePayload.message,
        sentAt: new Date().toISOString(),
        messageType: 'adoption',
        dogId,
        isOwner: adoptionIsOwner
      }
    ]);
    setAdoptionDogId(dogId);
  };

  // Handler for input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (selectedConvo) {
      const recipient = selectedConvo.participants.find(id => id !== user._id);
      socketRef.current?.emit('typing', { recipient, sender: user._id });
    }
  };

  // Handler for deleting a conversation
  const handleDeleteConversation = async () => {
    if (!selectedConvo || !token) return;
    await fetch(`${getApiUrl()}/api/chat/messages/${selectedConvo._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setSelectedConvo(null);
    setMessages([]);
  };

  // Block/unblock logic
    // Adoption handlers
    const handleConfirmAdoption = async (dogId: string, isOwner: boolean) => {
      if (!token) return;
      try {
        const res = await fetch(`${getApiUrl()}/api/dogs/confirm-adoption`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ dogId, isOwner })
        });
        if (res.ok) {
          setNotification(t('adoptionConfirmed'));
          setAdoptionDogId('');
          setAdoptionIsOwner(false);
          // UI will update via socket event (receiveMessage)
        }
      } catch (err) {
        setNotification(t('adoptionConfirmError'));
      }
    };
    const handleCancelAdoption = async (dogId: string) => {
      if (!token) return;
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
          // UI will update via socket event (receiveMessage)
        }
      } catch (err) {
        setNotification(t('adoptionCancelError'));
      }
    };
  const isBlocked = selectedConvo && userWithBlocks && userWithBlocks.blockedUsers && selectedConvo.participants.some(
    id => id !== userWithBlocks._id && userWithBlocks.blockedUsers!.includes(id)
  );
  const otherUserId = selectedConvo && userWithBlocks ? selectedConvo.participants.find(id => id !== userWithBlocks._id) : null;
  const handleBlockUnblock = async () => {
    if (!otherUserId || !token) return;
    const url = isBlocked ? '/api/chat/unblock' : '/api/chat/block';
    await fetch(`${getApiUrl()}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId: user._id, blockId: otherUserId })
    });
  };
  useEffect(() => {
    if (user?._id && token) {
      if (!socketRef.current) {
        socketRef.current = io(getApiUrl());
      }
      socketRef.current.on('connect', () => {
        console.log('[DEBUG] Socket connected:', socketRef.current.id);
      });
      socketRef.current.on('disconnect', () => {
        console.log('[DEBUG] Socket disconnected');
      });
      console.log('[DEBUG] Emitting join event with userId:', user._id);
      socketRef.current.emit('join', user._id);
      socketRef.current.emit('getOnlineUsers');
      socketRef.current.on('onlineUsers', (users) => {
        console.log('[DEBUG] Received onlineUsers:', users);
        if (users.length > 1) {
          setOnlineUsers(users.filter((u: any) => u._id !== user._id));
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
            });
        }
      });
      socketRef.current.on('receiveMessage', (msg) => {
        const adoptionSystemKeywords = ['confirmed', 'completed', 'closed', 'canceled', 'cancelled'];
        const isAdoptionSystemMsg = msg.messageType === 'adoption' && msg.dogId && msg.message && adoptionSystemKeywords.some(k => msg.message.toLowerCase().includes(k));
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
    }
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, token, user?.profilePicture]);

  useEffect(() => {
    if (selectedConvo && token) {
      fetch(`${getApiUrl()}/api/chat/messages/${selectedConvo._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(async data => {
          setMessages(data);
          // Always check for adoption message and refresh dog status
          let found = false;
          const adoptionMsg = data.find((m: any) => m.messageType === 'adoption' && m.dogId);
          if (adoptionMsg && adoptionMsg.dogId) {
            setAdoptionDogId(adoptionMsg.dogId);
            setAdoptionIsOwner(adoptionMsg.isOwner || false);
            found = true;
            // Refetch dog status for this dog
            fetch(`${getApiUrl()}/api/dogs/${adoptionMsg.dogId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
              .then(res => res.json())
              .then(dog => {
                setDogStatusMap(prev => ({ ...prev, [adoptionMsg.dogId]: dog.adoptionStatus }));
                setDogOwnerMap(prev => ({ ...prev, [adoptionMsg.dogId]: dog.owner }));
                // If adoption is completed/canceled, show system message and clear adoption UI
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
          // If not found, check all dogs for pending adoptions involving these users
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
                  // Refetch dog status for this dog
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
    }

    // Listen for open-chat-with-user event to start conversation with given userId
    const chatHandler = (e: any) => {
      if (e && e.detail && e.detail.userId) {
        const targetId = e.detail.userId;
        // Find or create a conversation with this user
        let convo = null;
        for (const c of onlineUsers) {
          if (typeof c === 'object' && c._id === targetId) {
            convo = { _id: c._id, participants: [user._id, c._id] };
            break;
          }
        }
        if (convo) {
          setSelectedConvo(convo);
        } else {
          // Fallback: create a new conversation object
          setSelectedConvo({ _id: targetId, participants: [user._id, targetId] });
        }
      }
    };
    window.addEventListener('open-chat-with-user', chatHandler);
    return () => {
      window.removeEventListener('open-chat-with-user', chatHandler);
    };
  }, [selectedConvo, token, user._id, onlineUsers, user]);

  // Fetch adoption status for all dogIds in messages and adoptionDogId
  // Always fetch status for adoptionDogId when it changes, even if messages don't change
  useEffect(() => {
    if (!adoptionDogId || !token) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/dogs/${adoptionDogId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const dog = await res.json();
          setDogStatusMap(prev => ({ ...prev, [adoptionDogId]: dog.adoptionStatus }));
        }
      } catch {}
    };
    fetchStatus();
  }, [adoptionDogId, token]);

  // Also fetch status for all dogIds in messages (for chat history)
  useEffect(() => {
    if (!token) return;
    const ids = new Set<string>();
    messages.forEach(m => { if (m.dogId) ids.add(m.dogId); });
    if (ids.size === 0) return;
    const fetchStatuses = async () => {
      const newMap: Record<string, string> = {};
      await Promise.all(Array.from(ids).map(async id => {
        try {
          const res = await fetch(`${getApiUrl()}/api/dogs/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const dog = await res.json();
            newMap[id] = dog.adoptionStatus;
          }
        } catch {}
      }));
      setDogStatusMap(prev => ({ ...prev, ...newMap }));
    };
    fetchStatuses();
  }, [messages, token]);

  const startConversation = async (otherUserId: string) => {
    if (!otherUserId || !token) return;
    // Always create or fetch the conversation
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
    // Fallback: if convo is invalid, create minimal object
    if (!convo || !convo._id || !convo.participants) {
      convo = { _id: otherUserId, participants: [user._id, otherUserId] };
    }
    setSelectedConvo(convo);
    // Fetch messages for this conversation
    fetch(`${getApiUrl()}/api/chat/messages/${convo._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(async data => {
        setMessages(data);
        // Check for pending adoption in this chat
        let found = false;
        const adoptionMsg = data.find((m: any) => m.messageType === 'adoption' && m.dogId);
        if (adoptionMsg && adoptionMsg.dogId) {
          setAdoptionDogId(adoptionMsg.dogId);
          setAdoptionIsOwner(adoptionMsg.isOwner || false);
          found = true;
        }
        if (!found) {
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
  
  const [chatVisible, setChatVisible] = useState(true);
  if (!chatVisible) return null;
  return (
    <div className="chat-app-container" style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar: Online Users */}
      <div className="chat-app-sidebar" style={{ width: 220, borderRight: '1px solid #eee', background: '#fafbfc', padding: 0 }}>
        <div style={{ fontWeight: 'bold', padding: '12px 16px', borderBottom: '1px solid #eee' }}>{t('onlineUsers') || 'Online Users'}</div>
        {onlineUsers.length === 0 ? (
          <div style={{ padding: 16, color: '#888' }}>{t('noUsersOnline') || 'No users online.'}</div>
        ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {onlineUsers.map(u => {
                const showProfilePic = u.profilePicture && typeof u.profilePicture === 'string' && u.profilePicture.trim() !== '' && u.profilePicture.startsWith('/uploads');
                return (
                  <li key={u._id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', cursor: 'pointer', background: selectedConvo && selectedConvo.participants.includes(u._id) ? '#e6f7ff' : 'transparent' }}
                      onClick={() => startConversation(u._id)}>
                    {showProfilePic ? (
                      <img src={u.profilePicture + '?v=' + Date.now()}
                           alt={u.userName || 'User'}
                           style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 12, objectFit: 'cover', border: '1px solid #ddd' }} />
                    ) : (
                      <img src="/img/chat-icon.svg" alt="User" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 12, objectFit: 'cover', border: '1px solid #ddd' }} />
                    )}
                    <span style={{ flex: 1 }}>{u.userName || u._id}</span>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4caf50', display: 'inline-block', marginLeft: 8 }} title="Online"></span>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
      {/* DEBUG: Show current user and online users profilePicture values */}
      <div style={{ background: '#ffe', color: '#a00', fontSize: 12, padding: 8, borderBottom: '1px solid #ccc' }}>
        <div><b>DEBUG:</b> Current user profilePicture: <span style={{ color: '#00a' }}>{user?.profilePicture || '(none)'}</span></div>
        <div><b>DEBUG:</b> Online users profilePictures:</div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {onlineUsers.map(u => (
            <li key={u._id}>
              {u.userName || u._id}: <span style={{ color: '#00a' }}>{u.profilePicture || '(none)'}</span>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* SOCKET/ONLINE USERS WARNING */}
        {(!socketRef.current || !socketRef.current.connected) && (
          <div style={{ background: '#fcc', color: '#900', padding: '8px', marginBottom: '8px', fontWeight: 'bold' }}>
            Socket not connected. Check backend/server.
          </div>
        )}
        {selectedConvo ? (
          <>
            <div className="chat-app-header" style={{ borderBottom: '1px solid #eee', padding: '12px 16px', background: '#f7fafd' }}>
              {/* Show profile picture and name of other user */}
              {(() => {
                const otherUser = onlineUsers.find(u => selectedConvo.participants.includes(u._id) && u._id !== user._id);
                const showProfilePic = otherUser && typeof otherUser.profilePicture === 'string' && otherUser.profilePicture.trim() !== '' && otherUser.profilePicture.startsWith('/uploads');
                return (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {showProfilePic ? (
                      <img src={otherUser.profilePicture + '?v=' + Date.now()}
                           alt={otherUser.userName || 'User'}
                           style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} />
                    ) : (
                      <img src="/img/chat-icon.svg" alt="User" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} />
                    )}
                    <span>{t('chatWith') || 'Chat with'} {otherUser?.userName || selectedConvo.participants.filter(id => id !== user._id).join(', ')}</span>
                  </span>
                );
              })()}
              {/* Close button */}
              <button onClick={() => setChatVisible(false)} style={{ float: 'right', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', marginLeft: 16 }} title="Close chat">×</button>
              {/* Block/Unblock and Delete Conversation Buttons */}
              <span style={{ float: 'right', display: 'flex', gap: 8 }}>
                <button style={{ background: isBlocked ? '#ff9800' : '#eee', color: isBlocked ? '#fff' : '#333', border: 'none', borderRadius: 4, padding: '6px 12px', marginLeft: 8 }} onClick={handleBlockUnblock}>
                  {isBlocked ? (t('unblock') || 'Unblock') : (t('block') || 'Block')}
                </button>
                <button style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', marginLeft: 8 }} onClick={handleDeleteConversation}>
                  {t('deleteConversation') || 'Delete Conversation'}
                </button>
              </span>
            </div>
            {/* Adoption Action Buttons */}
            {adoptionDogId && (
              <div style={{ padding: '12px 16px', background: '#fffbe6', borderBottom: '1px solid #ffe58f', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>{t('adoptionPending') || 'Adoption pending for this dog.'}</span>
                <button style={{ background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', marginLeft: 8, display: adoptionIsOwner ? 'inline-block' : 'none' }} onClick={() => handleConfirmAdoption(adoptionDogId, true)}>{t('confirmAdoption') || 'Confirm Adoption'}</button>
                <button style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', marginLeft: 8, display: !adoptionIsOwner ? 'inline-block' : 'none' }} onClick={() => handleCancelAdoption(adoptionDogId)}>{t('cancelAdoption') || 'Cancel Adoption'}</button>
              </div>
            )}
            <div className="chat-app-messages" style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f9f9fb' }}>
              {messages.length === 0 ? (
                <div className="chat-app-empty">No messages yet.</div>
              ) : (
                messages.map(msg => (
                  <div key={msg._id} className={`chat-app-message${msg.sender === user._id ? ' self' : ''}`}> 
                    <span className="chat-app-bubble">{msg.message}</span>
                  </div>
                ))
              )}
            </div>
            <div className="chat-app-input-row" style={{ borderTop: '1px solid #eee', padding: 12, background: '#fff' }}>
              <input
                className="chat-app-input"
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
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
