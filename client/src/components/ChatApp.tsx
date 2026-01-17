import React, { useState, useEffect, useRef } from 'react';
import '../css/chat-app.css';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

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
}


interface Conversation {
  _id: string;
  participants: string[];
}

interface UserWithBlocks {
  _id: string;
  blockedUsers?: string[];
}

const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (window.location.protocol === 'https:') {
    // Use same host, but https
    return `https://${window.location.hostname}`;
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://${window.location.hostname}:3001`;
  }
  // For mobile/network access, use the network IP (dev only)
  return `http://172.20.10.2:3001`;
};

const ChatApp: React.FC = () => {
  const selectedConvoRef = useRef<Conversation | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{_id: string, userName: string}[]>([]);

  const { user, token, updateUser } = useAuth();
  const userWithBlocks = user as UserWithBlocks | null;
  console.log('[ChatApp] user:', user);
  // Profile picture logic
  const getProfilePictureUrl = () => {
    if (user && (user as any).profilePicture) {
      return `${getApiUrl()}${(user as any).profilePicture}`;
    }
    return '../img/androcolored-80x80.jpg'; // Default profile picture
  };
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convoUsernames, setConvoUsernames] = useState<{[key: string]: string}>({});
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  useEffect(() => {
    selectedConvoRef.current = selectedConvo;
  }, [selectedConvo]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  // Remove otherUserId, use only user search and searchResults
  const [typing, setTyping] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{_id: string, userName: string}[]>([]);
  useEffect(() => {
    console.log('[ChatApp] onlineUsers state updated:', onlineUsers);
  }, [onlineUsers]);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  // Setup socket connection and listeners only once per user/token
  useEffect(() => {
    if (user?._id && token) {
      console.log('[ChatApp] Connecting socket for user:', user._id);
      fetch(`${getApiUrl()}/api/chat/conversations/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(async data => {
          setConversations(Array.isArray(data) ? data : []);
          // Fetch usernames for each conversation's other participant
          const usernames: {[key: string]: string} = {};
          for (const convo of Array.isArray(data) ? data : []) {
            const otherId = convo.participants.find((id: string) => id !== user._id);
            if (otherId) {
              const res = await fetch(`${getApiUrl()}/api/users/${otherId}`);
              if (res.ok) {
                const u = await res.json();
                usernames[convo._id] = u.username || u.name || otherId;
              } else {
                usernames[convo._id] = otherId;
              }
            }
          }
          setConvoUsernames(usernames);
        });
      if (!socketRef.current) {
        socketRef.current = io(getApiUrl());
        console.log('[ChatApp] Socket.IO connecting to', getApiUrl());
        socketRef.current.emit('join', user._id);
        console.log('[ChatApp] Emitted join for user:', user._id);
        socketRef.current.emit('getOnlineUsers');
        socketRef.current.on('onlineUsers', (users) => {
          console.log('[ChatApp] Received onlineUsers:', users);
          setOnlineUsers(users.filter((u: any) => u._id !== user._id));
        });
        socketRef.current.on('userOnline', (userOnline) => {
          console.log('[ChatApp] userOnline event:', userOnline);
          setOnlineUsers(prev => {
            if (prev.some(u => u._id === userOnline._id)) return prev;
            return [...prev, userOnline].filter(u => u._id !== user._id);
          });
        });
        socketRef.current.on('userOffline', (userOffline) => {
          console.log('[ChatApp] userOffline event:', userOffline);
          setOnlineUsers(prev => prev.filter(u => u._id !== userOffline._id));
        });
        socketRef.current.on('receiveMessage', (msg) => {
          // Always refresh conversations list
          fetch(`${getApiUrl()}/api/chat/conversations/${user._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(async data => {
              setConversations(Array.isArray(data) ? data : []);
              // Fetch usernames for each conversation's other participant
              const usernames: {[key: string]: string} = {};
              for (const convo of Array.isArray(data) ? data : []) {
                const otherId = convo.participants.find((id: string) => id !== user._id);
                if (otherId) {
                  const res = await fetch(`${getApiUrl()}/api/users/${otherId}`);
                  if (res.ok) {
                    const u = await res.json();
                    usernames[convo._id] = u.username || u.name || otherId;
                  } else {
                    usernames[convo._id] = otherId;
                  }
                }
              }
              setConvoUsernames(usernames);
              // Always refresh messages for the currently selected conversation
              if (selectedConvoRef.current) {
                fetch(`${getApiUrl()}/api/chat/messages/${selectedConvoRef.current._id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
                  .then(res => res.json())
                  .then(setMessages);
              }
            });
        });
        socketRef.current.on('typing', ({ from }) => {
          setTyping(true);
          setTimeout(() => setTyping(false), 1500);
        });
        socketRef.current.on('notification', ({ from, message }) => {
          setNotification(`New message from ${from}: ${message}`);
          setTimeout(() => setNotification(null), 3000);
        });
        socketRef.current.on('refreshConversations', () => {
          fetch(`${getApiUrl()}/api/chat/conversations/${user._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(data => setConversations(Array.isArray(data) ? data : []));
          if (selectedConvo) {
            fetch(`${getApiUrl()}/api/chat/messages/${selectedConvo._id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
              .then(res => res.json())
              .then(setMessages);
          }
        });
      }
    }
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, token]);

  useEffect(() => {
    if (selectedConvo && token) {
      fetch(`${getApiUrl()}/api/chat/messages/${selectedConvo._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setMessages);
    }
  }, [selectedConvo, token]);

  const startConversation = async (otherUserId: string) => {
    if (!otherUserId || !token) return;
    const res = await fetch(`${getApiUrl()}/api/chat/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId: user._id, otherUserId })
    });
    const convo = await res.json();
    setSelectedConvo(convo);
    setConversations(prev => [...prev, convo]);
    setUserSearch('');
    setSearchResults([]);
  };

  const sendMessage = async () => {
    if (!input || !selectedConvo || !token) return;
    const recipient = selectedConvo.participants.find(id => id !== user._id);
    socketRef.current?.emit('sendMessage', {
      conversationId: selectedConvo._id,
      sender: user._id,
      recipient,
      message: input
    });
    await fetch(`${getApiUrl()}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        conversationId: selectedConvo._id,
        sender: user._id,
        recipient,
        message: input
      })
    });
    // Do not update messages here; wait for real-time event
    setInput('');
  };

  // Typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (selectedConvo) {
      const recipient = selectedConvo.participants.find(id => id !== user._id);
      socketRef.current?.emit('typing', { recipient, sender: user._id });
    }
  };

  // User search
  const handleUserSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearch(e.target.value);
    if (e.target.value.length > 1) {
      try {
        const res = await fetch(`${getApiUrl()}/api/users/search?query=${encodeURIComponent(e.target.value)}`);
        if (!res.ok) {
          console.error('User search failed:', res.status, await res.text());
          setSearchResults([]);
          return;
        }
        const results = await res.json();
        setSearchResults(results);
      } catch (err) {
        console.error('User search error:', err);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Handler for deleting conversation
  const handleDeleteConversation = async () => {
    if (!selectedConvo || !token) return;
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    await fetch(`${getApiUrl()}/api/chat/messages/${selectedConvo._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setConversations(conversations.filter(c => c._id !== selectedConvo._id));
    setSelectedConvo(null);
    setMessages([]);
  };

  // Handler for block/unblock user
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
    // Fetch updated user and update AuthContext state
    const userRes = await fetch(`${getApiUrl()}/api/users/${user._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (userRes.ok) {
      const updatedUser = await userRes.json();
      updateUser(updatedUser);
    }
    // Emit a socket event to update both users' conversations in real time
    if (socketRef.current) {
      socketRef.current.emit('refreshConversations', { userId: user._id, otherUserId });
    }
    // Refetch conversations for this user
    fetch(`${getApiUrl()}/api/chat/conversations/${user._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setConversations(Array.isArray(data) ? data : []));
    // Optionally, refetch selected conversation if still valid
    if (selectedConvo) {
      fetch(`${getApiUrl()}/api/chat/messages/${selectedConvo._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setMessages);
    }
  };

  return (
    <div className="chat-app-container">
      {/* User profile at top */}
      <div className="chat-app-profile-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <img
          src={getProfilePictureUrl()}
          alt="Profile"
          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd', minWidth: '40px', minHeight: '40px', maxWidth: '60px', maxHeight: '60px' }}
        />
        <span style={{ fontWeight: 500, fontSize: 16 }}>{user?.username || 'Me'}</span>
        <span style={{ color: '#4CAF50', fontSize: 13, marginTop: 4 }}>Online</span>
      </div>
      <div className="chat-app-sidebar">
        <input
          className="chat-app-search"
          type="text"
          value={userSearch}
          onChange={handleUserSearch}
          placeholder="Search users by name or username..."
        />
        {searchResults.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 4 }}>
            {searchResults.map(u => (
              <li key={u._id}>
                <button className="chat-app-convo-btn" onClick={() => startConversation(u._id)}>{u.userName}</button>
              </li>
            ))}
          </ul>
        )}

        {/* Active/Online Users List */}
        <div className="chat-app-online-users">
          <b style={{ fontSize: 13, color: '#43b581' }}>Online Users</b>
          <ul style={{ listStyle: 'none', padding: 0, minHeight: 40 }}>
            {onlineUsers.length === 0 && (
              <li style={{ color: '#aaa', fontSize: 12 }}>No users online</li>
            )}
            {onlineUsers.map(u => (
              <li key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="chat-app-online-dot" />
                <button className="chat-app-convo-btn" onClick={() => startConversation(u._id)}>{u.userName}</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="chat-app-convos">
          <b style={{ fontSize: 13, color: '#2196f3' }}>Conversations</b>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {conversations.map(convo => (
              <li key={convo._id}>
                <button
                  className={`chat-app-convo-btn${selectedConvo?._id === convo._id ? ' selected' : ''}`}
                  onClick={() => setSelectedConvo(convo)}
                >
                  {convoUsernames[convo._id] || convo.participants.filter(id => id !== user._id).join(', ')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="chat-app-main">
        {/* Conversation actions always at top for all devices */}
        {selectedConvo && (
          <div className="chat-app-actions-row">
            <button className="chat-app-action-btn delete" onClick={handleDeleteConversation}>Delete</button>
            <button className={`chat-app-action-btn ${isBlocked ? 'unblock' : 'block'}`} onClick={handleBlockUnblock}>{isBlocked ? 'Unblock' : 'Block'}</button>
          </div>
        )}
        <div className="chat-app-messages">
          {messages.map(msg => (
              <div key={msg._id} className={`chat-app-message${user && msg.sender === user._id ? ' self' : ''}`}>
                <span className={`chat-app-bubble${user && msg.sender === user._id ? ' self' : ''}`}>{msg.message}</span>
              </div>
            ))}
          {typing && <div className="chat-app-typing">Typing...</div>}
        </div>
        {selectedConvo && (
          <div className="chat-app-input-row">
            <input
              className="chat-app-input"
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Type a message..."
            />
            <button
              className="chat-app-send-btn"
              onClick={sendMessage}
              disabled={!input.trim()}
            >Send</button>
          </div>
        )}
        {notification && (
          <div className="chat-app-notification">{notification}</div>
        )}
      </div>
      {/* Close button at top right (desktop), static on mobile) */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('closeChatModal'))}
        className="chat-app-close-btn"
      >Close</button>
    </div>
  );
};

export default ChatApp;
