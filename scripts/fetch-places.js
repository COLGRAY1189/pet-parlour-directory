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

async function searchPlaces(query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function getPlaceDetails(placeId) {
  const fields = 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,photos,geometry,opening_hours,types';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.result || {};
}

function getPhotoUrl(photoRef) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${API_KEY}`;
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
    const results = await searchPlaces(query);

    for (const place of results) {
      if (seen.has(place.place_id)) continue;
      seen.add(place.place_id);

      const details = await getPlaceDetails(place.place_id);
      const address = details.formatted_address || '';

      // Only Cape Town / Western Cape results
      if (!address.toLowerCase().includes('cape town') &&
          !address.toLowerCase().includes('western cape')) continue;

      const photoRef = details.photos?.[0]?.photo_reference;
      raw.push({
        place_id: place.place_id,
        name: details.name,
        address,
        phone: details.formatted_phone_number || '',
        website: details.website || '',
        rating: details.rating || null,
        review_count: details.user_ratings_total || 0,
        lat: details.geometry?.location?.lat,
        lng: details.geometry?.location?.lng,
        photo_url: photoRef ? getPhotoUrl(photoRef) : '',
        hours: details.opening_hours?.weekday_text?.join(', ') || '',
        source: 'google'
      });

      // Respect API rate limits
      await new Promise(r => setTimeout(r, 200));
    }
  }

  writeFileSync('raw-places.json', JSON.stringify(raw, null, 2));
  console.log(`Fetched ${raw.length} places → raw-places.json`);
}

main().catch(console.error);
