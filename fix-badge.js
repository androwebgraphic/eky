const fs = require('fs');

console.log('Removing unread badge from online users...');

const filePath = 'client/src/components/ChatApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Remove unread count calculation and badge from online users section
const pattern = /onlineUsers\.map\(u => \{\s*\/\/ Find conversation for this user and get unread count\s*const convo = allConversations\.find\(\(c: any\) => c\.participants\.includes\(u\._id\)\);\s*const unreadCount = convo\?\.unreadCount \|\| 0;\s*\s*return \(\s*<li key=\{u\._id\}\s*className=\{`chat-user-item \$\{selectedConvo && selectedConvo\.participants\.includes\(u\._id\) \? 'selected' : ''\}`\}\s*onClick=\{\(\) => startConversation\(u\._id\)\}\s*style=\{\{ position: 'relative' \}\}>\s*<img\s*src=\{getProfilePic\(u\)\}\s*alt=\{u\.userName \|\| 'User'\}\s*className="chat-user-avatar"\s*\/>\s*<span key=\{`name-\$\{u\._id\`\`} className="chat-user-name">\{u\.userName \|\| u\._id\}<\/span>\s*<span key=\{`status-\$\{u\._id\`\`} className="chat-user-status" title="Online"><\/span>\s*\{unreadCount > 0 && \([\s\S]*?\)\}(\s*)\}?/;

const replacement = `onlineUsers.map(u => {
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

if (pattern.test(content)) {
  content = content.replace(pattern, replacement);
  console.log('[OK] Removed unread badge from online users');
} else {
  console.log('[INFO] Pattern not found, trying simpler match...');
  
  // Simpler approach: just remove the unread badge display
  const simplePattern = /onlineUsers\.map\(u => \{[\s\S]*?\/\/ Find conversation for this user and get unread count[\s\S]*?const unreadCount = convo\?\.unreadCount \|\| 0;[\s\S]*?<span key=\{`status-\$\{u\._id\`\`} className="chat-user-status" title="Online"><\/span>[\s\S]*?\{unreadCount > 0 && \([\s\S]*?\}<\/span>[\s\S]*?\)\}/;
  
  if (simplePattern.test(content)) {
    content = content.replace(simplePattern, `onlineUsers.map(u => {
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
                  <span key={\`status-\${u._id}\`} className="chat-user-status" title="Online"></span>`);
    console.log('[OK] Removed unread badge from online users (simplified)');
  } else {
    console.log('[WARN] Could not find and remove unread badge');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');