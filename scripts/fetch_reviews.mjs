/**
 * Fetch Google reviews for all businesses and save to data/reviews.json.
 * Used by GitHub Actions for weekly auto-update.
 *
 * Env vars: GOOGLE_API_KEY, GOOGLE_REFERER
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectDir = join(__dirname, '..');
const apiKey = process.env.GOOGLE_API_KEY;
const referer = process.env.GOOGLE_REFERER || '';

if (!apiKey) {
  console.error('Missing GOOGLE_API_KEY env var');
  process.exit(1);
}

const businesses = JSON.parse(readFileSync(join(projectDir, 'data/businesses.json'), 'utf8'));
const allReviews = {};
let fetched = 0;

for (let i = 0; i < businesses.length; i++) {
  const biz = businesses[i];
  if (!biz.place_id) continue;

  try {
    const headers = {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'reviews'
    };
    if (referer) headers['Referer'] = referer;

    const r = await fetch(
      `https://places.googleapis.com/v1/places/${biz.place_id}`,
      { headers }
    );
    if (!r.ok) {
      console.log(`[${i + 1}/${businesses.length}] ${biz.name} - HTTP ${r.status}`);
      continue;
    }

    const data = await r.json();
    if (data.reviews?.length) {
      allReviews[biz.slug] = data.reviews.map(rev => ({
        author: rev.authorAttribution?.displayName || 'Anonymous',
        profile_photo: rev.authorAttribution?.photoUri || '',
        rating: rev.rating || 5,
        text: rev.text?.text || '',
        time: rev.relativePublishTimeDescription || '',
        publish_time: rev.publishTime || '',
        source: 'google'
      }));
      fetched++;
      console.log(`[${i + 1}/${businesses.length}] ${biz.name} - ${data.reviews.length} reviews`);
    }
  } catch (e) {
    console.log(`[${i + 1}/${businesses.length}] ${biz.name} - Error: ${e.message}`);
  }

  await new Promise(r => setTimeout(r, 150));
}

writeFileSync(
  join(projectDir, 'data/reviews.json'),
  JSON.stringify(allReviews, null, 2),
  'utf8'
);

console.log(`\nDone! Saved reviews for ${fetched} businesses.`);
