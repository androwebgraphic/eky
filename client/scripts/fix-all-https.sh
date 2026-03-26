#!/bin/bash

# Fix all components with hardcoded HTTP URLs

FILES=(
  "src/components/UserProfileModal.tsx"
  "src/components/ChatApp.tsx"
  "src/components/pages/Statistics.tsx"
  "src/components/pages/DogDetails.tsx"
  "src/components/pages/AdddogForm.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Add import if it doesn't exist
    if ! grep -q "from '../utils/apiUrl'" "$file" && ! grep -q "from '../../utils/apiUrl'" "$file"; then
      # Determine the correct import path based on file location
      if [[ $file == components/pages/* ]]; then
        perl -i -pe 's|^import React|import React\nimport { getApiUrl } from '\''../../utils/apiUrl'\'';|' "$file"
      else
        perl -i -pe 's|^import React|import React\nimport { getApiUrl } from '\''../utils/apiUrl'\'';|' "$file"
      fi
    fi
    
    # Remove the local getApiUrl function
    sed -i '' '/\/\/ Get API URL for/,/^};$/d' "$file"
    sed -i '' '/const getApiUrl = () => {/,/^};$/d' "$file"
    
    echo "✓ Fixed $file"
  else
    echo "✗ File not found: $file"
  fi
done

echo ""
echo "All files processed!"