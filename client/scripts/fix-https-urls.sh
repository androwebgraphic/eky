#!/bin/bash

# Script to fix hardcoded HTTP URLs to use dynamic protocol
# This resolves mixed content errors in production

# Fix AuthContext.tsx
echo "Fixing AuthContext.tsx..."
sed -i '' 's|const getApiUrl = () => {$|// Using centralized API URL utility|g' src/contexts/AuthContext.tsx
sed -i '' '/\/\/ Helper function to get API URL dynamically/,/return `${protocol}\/\/${hostname}:3001`;/c\
import { getApiUrl } from '\''../utils/apiUrl'\'';' src/contexts/AuthContext.tsx

# Fix Header.tsx
echo "Fixing Header.tsx..."
sed -i '' '/\/\/ Get API URL for profile pictures/,/return `http:.*hostname.*3001`;/{ /\/\/ Get API URL for profile pictures/i\
import { getApiUrl } from '\''../utils/apiUrl'\'';
d;}' src/components/Header.tsx

echo "Done!"