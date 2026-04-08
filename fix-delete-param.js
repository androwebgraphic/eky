const fs = require('fs');

const filePath = '/Applications/MAMP/htdocs/eky/client/src/components/ChatApp.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Fix: Modify handleDeleteConversation to accept conversation ID as parameter
// This allows deleting from sidebar without selecting the conversation first
const oldFunction = `  const handleDeleteConversation = async () => {
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
    const apiUrl = getApiUrl();`;

const newFunction = `  const handleDeleteConversation = async (conversationId?: string) => {
    const convoId = conversationId || selectedConvo?._id;
    if (!convoId || !token) {
      return;
    }
    await fetch(\`\${getApiUrl()}/api/chat/messages/\${convoId}\`, {
      method: 'DELETE',
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    if (!conversationId) {
      setSelectedConvo(null);
      setMessages([]);
    }
    // Refresh conversations list to remove deleted conversation
    const apiUrl = getApiUrl();`;

if (content.includes(oldFunction)) {
  content = content.replace(oldFunction, newFunction);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Fixed handleDeleteConversation to accept conversation ID parameter');
} else {
  console.log('✗ Could not find function to replace');
  console.log('Searching for handleDeleteConversation...');
  const match = content.match(/const handleDeleteConversation = async \(\) => \{/);
  if (match) {
    console.log('Found function definition');
  } else {
    console.log('Function definition not found');
  }
}