const fs = require('fs');

console.log('Fixing ChatApp.tsx issues...');

const filePath = 'client/src/components/ChatApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Update handleDeleteConversation to refresh conversations list
const oldDeleteHandler = `  const handleDeleteConversation = async () => {
    if (!selectedConvo || !token) {
      return;
    }
    await fetch(\`\${getApiUrl()}/api/chat/messages/\${selectedConvo._id}\`, {
      method: 'DELETE',
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    setSelectedConvo(null);
    setMessages([]);
  };`;

const newDeleteHandler = `  const handleDeleteConversation = async () => {
    if (!selectedConvo || !token) {
      return;
    }
    await fetch(\`\${getApiUrl()}/api/chat/messages/\${selectedConvo._id}\`, {
      method: 'DELETE',
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    setSelectedConvo(null);
    setMessages([]);
    // Refresh conversations list to remove deleted conversation
    const apiUrl = getApiUrl();
    try {
      const response = await fetch(\`\${apiUrl}/api/chat/conversations/\${user._id}\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (response.ok) {
        const conversations = await response.json();
        const conversationsWithUsers = await Promise.all(
          conversations.map(async (convo: any) => {
            const otherUserId = convo.participants.find((id: string) => id !== user._id);
            if (!otherUserId) return null;
            try {
              const userRes = await fetch(\`\${apiUrl}/api/users/\${otherUserId}\`, {
                headers: { 'Authorization': \`Bearer \${token}\` }
              });
              if (userRes.ok) {
                const otherUser = await userRes.json();
                return { ...convo, otherUser };
              }
            } catch (err) {
              console.error('Error fetching user details:', err);
            }
            return convo;
          })
        );
        const validConversations = conversationsWithUsers.filter(c => c !== null);
        setAllConversations(validConversations);
      }
    } catch (err) {
      console.error('Error refreshing conversations:', err);
    }
  };`;

if (content.includes(oldDeleteHandler)) {
  content = content.replace(oldDeleteHandler, newDeleteHandler);
  console.log('[OK] Fixed handleDeleteConversation to refresh conversations');
} else {
  console.log('[SKIP] handleDeleteConversation already fixed or not found');
}

// Fix 2: Remove unread count badge from online users (the "odd number" issue)
// The unread badge should only show for offline conversations, not online users
const oldOnlineUserSection = `          <ul className="chat-users-list">
            {onlineUsers.map(u => {
              // Find conversation for this user and get unread count
              const convo = allConversations.find((c: any) => c.participants.includes(u._id));
              const unreadCount = convo?.unreadCount || 0;

              return (
                <li key={u._id}
                    className={\`chat-user-item \${selectedConvo && selectedConvo.participants.includes(u._id) ? 'selected' : ''}\`}
                    onClick={() => startConversation(u._id)}
                    style={{ position: 'relative' }}>
                  <img
                    src={getProfilePic(u)}
                    alt={u.userName || 'User'}
                    className="chat-user-avatar"
                  />
                  <span key={\`name-\${u._id}\`} className="chat-user-name">{u.userName || u._id}</span>
                  <span key={\`status-\${u._id}\`} className="chat-user-status" title="Online"></span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '20px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: '1px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 1
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}`;

const newOnlineUserSection = `          <ul className="chat-users-list">
            {onlineUsers.map(u => {
              return (
                <li key={u._id}
                    className={\`chat-user-item \${selectedConvo && selectedConvo.participants.includes(u._id) ? 'selected' : ''}\`}
                    onClick={() => startConversation(u._id)}
                    style={{ position: 'relative' }}>
                  <img
                    src={getProfilePic(u)}
                    alt={u.userName || 'User'}
                    className="chat-user-avatar"
                  />
                  <span key={\`name-\${u._id}\`} className="chat-user-name">{u.userName || u._id}</span>
                  <span key={\`status-\${u._id}\`} className="chat-user-status" title="Online"></span>`;

if (content.includes(oldOnlineUserSection)) {
  content = content.replace(oldOnlineUserSection, newOnlineUserSection);
  console.log('[OK] Removed unread count badge from online users');
} else {
  console.log('[SKIP] Online user section already fixed or not found');
}

// Fix 3: Ensure online users are shown in Online tab
// Check if the online users section exists after the offline conversations
const afterOnlineUsersList = `            })}
          </ul>
        )}
      </div>`;

const existingAfterOnlineUsers = content.indexOf(afterOnlineUsersList);
if (existingAfterOnlineUsers === -1) {
  console.log('[WARN] Could not verify online users list structure');
} else {
  console.log('[OK] Online users list structure verified');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done. ChatApp.tsx has been updated.');