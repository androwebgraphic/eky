#!/bin/bash
cd client/src/components

# Backup
cp ChatApp.tsx ChatApp.tsx.backup

# Fix 1: Remove count from Online tab (line 1049)
sed -i '' "s/{t('online') || 'Online'} ({onlineUsers.length})/{t('online') || 'Online'}/" ChatApp.tsx

# Fix 2: Remove count from Offline tab (line 1066)
sed -i '' "s/{t('offline') || 'Offline'} ({allConversations.filter((c: any) => !onlineUsers.some((u: any) => u._id === c.otherUser\?._id)).length})/{t('offline') || 'Offline'}/" ChatApp.tsx

# Fix 3: Remove unread count badges (offline) - lines 175-193
sed -i '' '175,193d' ChatApp.tsx

# Fix 4: Remove unread count badges (online) - lines 1213-1231  
sed -i '' '1213,1231d' ChatApp.tsx

# Fix 5: Remove const unreadCount from online users (line 1210)
sed -i '' '/const unreadCount = convo\?\.unreadCount || 0;/d' ChatApp.tsx

echo "Fixes applied"
