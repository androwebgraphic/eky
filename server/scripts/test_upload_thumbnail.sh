#!/usr/bin/env bash
# Usage: ./test_upload_thumbnail.sh /path/to/image.jpg
# Posts image as 'media' to /api/dogs and shows whether 'thumbnail' is present in the response

API_URL=${API_URL:-http://localhost:3001}
FILE=${1}
if [ -z "$FILE" ]; then
  echo "Usage: $0 /path/to/image.jpg"
  exit 2
fi

echo "Posting $FILE to $API_URL/api/dogs"
RESPONSE=$(curl -s -X POST "$API_URL/api/dogs" -F "media=@${FILE}" -F "name=ThumbnailTestDog")

echo "Response:"
echo "$RESPONSE" | jq || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"thumbnail"'; then
  echo "\n✅ thumbnail key present in response"
  echo "Thumbnail URL:" $(echo "$RESPONSE" | jq -r '.thumbnail.url')
else
  echo "\n⚠️ thumbnail key NOT present in response"
fi
