import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const QUERIES = [
  'pet grooming Cape Town',
  'dog groomer Cape Town',
  'mobile pet grooming Cape Town',
  'cat grooming Cape Town',
  'pet parlour Cape Town'
];

// Uses Places API (New) - POST endpoint
async function searchPlaces(query) {
  const url = 'https://places.googleapis.com/v1/places:searchText';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.photos,places.location,places.regularOpeningHours'
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 20 })
  });
  const data = await res.json();
  if (data.error) {
    console.error('API error:', JSON.stringify(data.error));
    return [];
  }
  return data.places || [];
}

function getPhotoUrl(photoName) {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${API_KEY}`;
}

async function main() {
  if (!API_KEY) {
    console.error('ERROR: GOOGLE_PLACES_API_KEY environment variable not set');
    process.exit(1);
  }

  const seen = new Set();
  const raw = [];

  for (const query of QUERIES) {
    console.log(`Searching: ${query}`);
    const places = await searchPlaces(query);
    console.log(`  Found ${places.length} results`);

    for (const place of places) {
      const placeId = place.id;
      if (seen.has(placeId)) continue;
      seen.add(placeId);

      const address = place.formattedAddress || '';

      // Only Cape Town / Western Cape results
      if (!address.toLowerCase().includes('cape town') &&
          !address.toLowerCase().includes('western cape')) continue;

      const photoName = place.photos?.[0]?.name;
      const hours = place.regularOpeningHours?.weekdayDescriptions?.join(', ') || '';

      raw.push({
        place_id: placeId,
        name: place.displayName?.text || '',
        address,
        phone: place.internationalPhoneNumber || '',
        website: place.websiteUri || '',
        rating: place.rating || null,
        review_count: place.userRatingCount || 0,
        lat: place.location?.latitude,
        lng: place.location?.longitude,
        photo_url: photoName ? getPhotoUrl(photoName) : '',
        hours,
        source: 'google'
      });

      await new Promise(r => setTimeout(r, 100));
    }
  }

  writeFileSync('raw-places.json', JSON.stringify(raw, null, 2));
  console.log(`Fetched ${raw.length} places → raw-places.json`);
}

main().catch(console.error);
