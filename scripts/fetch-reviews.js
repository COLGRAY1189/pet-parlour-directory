import { readFileSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const businesses = JSON.parse(readFileSync('../data/businesses.json', 'utf-8'));

async function fetchReviews(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.result?.reviews) {
      console.error(`  ${data.status || 'No reviews'} for ${placeId}`);
      return [];
    }
    return data.result.reviews.slice(0, 5).map(r => ({
      author: r.author_name || 'Anonymous',
      rating: r.rating || 5,
      text: r.text || '',
      time: r.relative_time_description || '',
      profilePhoto: r.profile_photo_url || ''
    }));
  } catch (err) {
    console.error(`  Error for ${placeId}:`, err.message);
    return [];
  }
}

async function main() {
  const reviews = {};
  let fetched = 0;

  for (const b of businesses) {
    if (!b.place_id) continue;
    console.log(`Fetching reviews for: ${b.name}`);
    const r = await fetchReviews(b.place_id);
    if (r.length) {
      reviews[b.slug] = r;
      fetched++;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  writeFileSync('../data/reviews.json', JSON.stringify(reviews, null, 2));
  console.log(`\nDone. Fetched reviews for ${fetched}/${businesses.length} businesses.`);
}

main();
