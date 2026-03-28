# Location-Based Dog Sorting Feature

## Overview
This feature allows dogs in the dog list to be sorted by their distance from the user's current location. Dogs closer to the user appear first in the list.

## How It Works

### Backend Changes

1. **Database Models**
   - Added `coordinates` field to `Dog` model with GeoJSON Point structure
   - Added `coordinates` field to `User` model for future user location tracking
   - Created 2dsphere index on the `coordinates` field for geospatial queries

2. **API Endpoint**
   - Updated `GET /api/dogs` endpoint to accept optional `lat` and `lng` query parameters
   - When coordinates are provided, uses MongoDB's `$geoNear` aggregation to calculate distances
   - Returns dogs sorted by distance (closest first)
   - Falls back to creation date sorting if no coordinates are provided

3. **Geocoding**
   - Added `geocodeLocation()` helper function in `dogController.js`
   - Converts location strings (e.g., "Zagreb, Croatia") to GPS coordinates
   - Uses OpenStreetMap's Nominatim API (free, no API key required)

### Frontend Changes

1. **User Location Detection**
   - Automatically requests user's browser geolocation on page load
   - Uses `navigator.geolocation.getCurrentPosition()` API
   - Stores user coordinates in state: `{ lat, lng }`

2. **API Requests**
   - Passes user coordinates as query parameters: `?lat=45.815&lng=15.981`
   - Refetches dogs when location changes
   - Maintains existing filter functionality (search, gender, size, age)

3. **Two-Tiered Display**
   - Dogs WITH valid coordinates appear first, sorted by distance
   - Dogs WITHOUT coordinates appear after, sorted by creation date
   - Ensures users see nearby dogs first, regardless of whether all dogs have coordinates

4. **Privacy Considerations**
   - Location permission can be denied by user
   - Gracefully handles geolocation errors
   - Falls back to default sorting if location is unavailable

## Installation & Setup

### 1. Run Migration Script

**Important:** Make sure your MongoDB database is running before executing this script!

To geocode existing dogs and create the necessary MongoDB index:

```bash
cd server
# Make sure MongoDB is running locally or your remote DB is accessible
node scripts/geocode-existing-dogs.js
```

This script will:
- Find all dogs with a location string but no coordinates
- Geocode each location using OpenStreetMap's API
- Update dog documents with coordinates
- Create 2dsphere index on the coordinates field
- Respect rate limits (1 request per second)

**Note:** The script may take some time depending on the number of dogs, as it needs to make one API request per dog.

**If MongoDB connection fails:**
- If using MongoDB Atlas: Check your network connection and whitelist settings
- If using local MongoDB: Make sure `mongod` is running
- The 2dsphere index will be automatically created when the app starts (see `dogModel.js`)

### 2. No Code Changes Required for New Dogs

Newly created or updated dogs will automatically have their location geocoded in the `createDog` and `updateDog` controllers.

### 3. Frontend Auto-Detection

The frontend automatically:
- Detects user location on page load
- Passes coordinates to the API
- Displays dogs sorted by distance

No additional configuration needed!

## API Usage

### Get Dogs Sorted by Distance

```bash
GET /api/dogs?lat=45.8150&lng=15.9819
```

**Query Parameters:**
- `lat` (optional): User's latitude
- `lng` (optional): User's longitude

**Response:**
- Dogs sorted by distance (closest first)
- Each dog includes a `distance` field (in meters) from the user
- Falls back to creation date sorting if no coordinates provided

**Example Response:**
```json
[
  {
    "_id": "dog1",
    "name": "Rex",
    "location": "Zagreb, Croatia",
    "coordinates": {
      "type": "Point",
      "coordinates": [15.9819, 45.8150]
    },
    "distance": 1500.5,
    "user": { ... }
  },
  {
    "_id": "dog2",
    "name": "Bella",
    "location": "Split, Croatia",
    "coordinates": {
      "type": "Point",
      "coordinates": [16.4402, 43.5081]
    },
    "distance": 180500.2,
    "user": { ... }
  }
]
```

### Get Dogs Without Location Sorting

```bash
GET /api/dogs
```

Returns dogs sorted by creation date (default behavior).

## Technical Details

### GeoJSON Format
Coordinates are stored in GeoJSON Point format:
```javascript
{
  type: 'Point',
  coordinates: [longitude, latitude]  // Note: longitude first!
}
```

### MongoDB Geospatial Query
Uses `$geoNear` aggregation pipeline:
```javascript
{
  $geoNear: {
    near: {
      type: 'Point',
      coordinates: [userLng, userLat]
    },
    distanceField: 'distance',
    spherical: true,
    key: 'coordinates'
  }
}
```

### Indexing
The 2dsphere index enables efficient geospatial queries:
```javascript
Dog.collection.createIndex({ coordinates: '2dsphere' })
```

## Troubleshooting

### Dogs not sorting by distance
1. Ensure migration script has been run
2. Check that dogs have valid coordinates (not [0,0])
3. Verify 2dsphere index exists: `db.dogs.getIndexes()`
4. Check browser console for location permission errors

### Geocoding errors
- Nominatim API rate limit: 1 request per second
- Invalid location strings may fail to geocode
- Check network connectivity
- Verify User-Agent header is set (required by Nominatim)

### Location permission denied
- Users can deny location access in browser settings
- App gracefully falls back to default sorting
- No user action required

## Future Enhancements

Potential improvements:
1. Cache geocoded locations to reduce API calls
2. Add user's saved location preferences
3. Display distance on dog cards
4. Add distance filter (e.g., "Show dogs within 50km")
5. Implement location-based notifications for nearby dogs
6. Use a geocoding service with better rate limits for production

## Performance Considerations

- **Database:** 2dsphere index ensures fast geospatial queries
- **API:** Geocoding is done asynchronously, doesn't block responses
- **Frontend:** Location is fetched once and cached
- **Rate Limiting:** Nominatim API requests are throttled to 1/sec

## Privacy & Security

- User location is only used for sorting, not stored permanently
- Location request happens only once per session
- Users can deny location access
- No personal data is transmitted to third parties
- OpenStreetMap Nominatim is free and privacy-focused

## References

- [MongoDB Geospatial Queries](https://www.mongodb.com/docs/manual/geospatial-queries/)
- [GeoJSON Specification](https://geojson.org/)
- [Nominatim API Documentation](https://nominatim.org/release-docs/develop/api/Search/)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)