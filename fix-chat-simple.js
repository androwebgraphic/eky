const fs = require('fs');

console.log('Applying ChatApp fixes...');

const filePath = 'client/src/components/ChatApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Add conversation refresh after delete
const oldDelete = '    setSelectedConvo(null);\n    setMessages([]);\n  };';
const newDelete = `    setSelectedConvo(null);
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

if (content.includes(oldDelete)) {
  content = content.replace(oldDelete, newDelete);
  console.log('[OK] Fixed delete conversation to refresh list');
} else {
  console.log('[INFO] Delete handler already modified or pattern not found');
}

// Fix 2: Remove unread badge from online users (lines around 1235-1260)
const onlineBadgePattern = /onlineUsers\.map\(u => \{[\s\S]*?const unreadCount = convo\?\.unreadCount \|\| 0;[\s\S]*?onClick=\(\(\) => startConversation\(u\._id\)\)[\s\S]*?<span className="chat-user-status"[^>]*><\/span>[\s\S]*?\{unreadCount > 0 && \([\s\S]*?\}<\/span>[\s\S]*?\)\}/;
const onlineNoBadge = `onlineUsers.map(u => {
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

if (onlineBadgePattern.test(content)) {
  content = content.replace(onlineBadgePattern, onlineNoBadge);
  console.log('[OK] Removed unread badge from online users');
} else {
  console.log('[INFO] Online users section already fixed or pattern not found');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');