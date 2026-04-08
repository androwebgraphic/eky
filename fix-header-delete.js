const fs = require('fs');

const filePath = '/Applications/MAMP/htdocs/eky/client/src/components/ChatApp.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Fix: Wrap header delete button call in arrow function for TypeScript compatibility
const oldHeaderButton = `                <button className="chat-header-btn btn-delete" onClick={handleDeleteConversation}>`;

const newHeaderButton = `                <button className="chat-header-btn btn-delete" onClick={() => handleDeleteConversation()}>`;

if (content.includes(oldHeaderButton)) {
  content = content.replace(oldHeaderButton, newHeaderButton);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Fixed header delete button for TypeScript');
} else {
  console.log('✗ Could not find header delete button');
}