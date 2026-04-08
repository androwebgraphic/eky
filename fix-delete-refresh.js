const fs = require('fs');

const filePath = '/Applications/MAMP/htdocs/eky/client/src/components/ChatApp.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Fix: Remove setSelectedConvo call from delete button in offline conversations list
// This causes refresh on mobile when deleting
const oldCode = `                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConvo(convo);
                        handleDeleteConversation();
                      }}`;

const newCode = `                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation();
                      }}`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Fixed delete button refresh issue');
} else {
  console.log('✗ Could not find the code to replace');
}