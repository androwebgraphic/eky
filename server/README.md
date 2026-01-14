Uploads and thumbnails

- Uploads are saved under: uploads/dogs/<dogId>/
- For image uploads the server generates resized JPEG variants at widths: 320, 640, 1024 and saves them as image-<width>.jpg
- The server also creates a tiny 64px JPEG thumbnail `thumb-64.jpg` and stores its URL in the `thumbnail` field of the Dog document
- For video uploads the server saves the provided poster (if present) in the same variants and also creates a 64px thumbnail from the poster image

Testing:
- Use `server/scripts/test_upload_thumbnail.sh /path/to/image.jpg` to POST an image and verify the `thumbnail` key is present in the response (requires `jq` for pretty output).