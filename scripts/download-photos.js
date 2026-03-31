import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const REFERER = 'https://pet-parlour.fun/';
const PHOTOS_DIR = join('..', 'assets', 'photos');
const DATA_FILE = join('..', 'data', 'businesses.json');

if (!existsSync(PHOTOS_DIR)) mkdirSync(PHOTOS_DIR, { recursive: true });

const businesses = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));

async function downloadPhoto(business) {
  if (!business.photo_url) return null;

  const filename = `${business.slug}.jpg`;
  const filepath = join(PHOTOS_DIR, filename);

  // Skip if already downloaded
  if (existsSync(filepath)) {
    console.log(`  Exists: ${filename}`);
    return `assets/photos/${filename}`;
  }

  let url = business.photo_url;
  if (url.includes('places.googleapis.com') && !url.includes('key=')) {
    const sep = url.includes('?') ? '&' : '?';
    url = url + sep + 'key=' + API_KEY;
  }

  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'Referer': REFERER }
    });

    if (!res.ok) {
      console.error(`  Failed (${res.status}): ${business.name}`);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(filepath, buffer);
    console.log(`  Downloaded: ${filename} (${(buffer.length / 1024).toFixed(0)}KB)`);
    return `assets/photos/${filename}`;
  } catch (err) {
    console.error(`  Error: ${business.name} - ${err.message}`);
    return null;
  }
}

async function main() {
  console.log(`Downloading photos for ${businesses.length} businesses...\n`);
  let downloaded = 0;
  let skipped = 0;

  for (const b of businesses) {
    console.log(`${b.name}:`);
    const localPath = await downloadPhoto(b);
    if (localPath) {
      b.local_photo = localPath;
      downloaded++;
    } else {
      skipped++;
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 150));
  }

  // Save updated businesses with local_photo field
  writeFileSync(DATA_FILE, JSON.stringify(businesses, null, 2));
  console.log(`\nDone. Downloaded: ${downloaded}, Skipped: ${skipped}`);
}

main();
