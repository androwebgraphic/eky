const fs = require('fs');

const filePath = '/Applications/MAMP/htdocs/eky/client/src/components/ChatApp.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Fix: Update delete button to pass conversation ID parameter
const oldButton = `                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation();
                      }}`;

const newButton = `                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(convo._id);
                      }}`;

if (content.includes(oldButton)) {
  content = content.replace(oldButton, newButton);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Updated delete button to pass conversation ID');
} else {
  console.log('✗ Could not find delete button to update');
}