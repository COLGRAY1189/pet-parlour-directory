import { readFileSync, writeFileSync, existsSync } from 'fs';
import slugify from 'slugify';

function makeSlug(name, area) {
  return slugify(`${name} ${area}`, { lower: true, strict: true });
}

function extractArea(address) {
  const parts = address.split(',');
  if (parts.length >= 3) return parts[parts.length - 3]?.trim() || parts[1]?.trim();
  if (parts.length >= 2) return parts[1]?.trim();
  return 'Cape Town';
}

function main() {
  // Load existing businesses
  const existing = JSON.parse(readFileSync('../data/businesses.json', 'utf-8'));
  const existingIds = new Set(existing.map(b => b.place_id).filter(Boolean));
  const existingSlugs = new Set(existing.map(b => b.slug));

  // Load raw Places data (if exists)
  const raw = existsSync('raw-places.json')
    ? JSON.parse(readFileSync('raw-places.json', 'utf-8'))
    : [];

  // Load Sheets submissions (if exists)
  const sheets = existsSync('raw-sheets.json')
    ? JSON.parse(readFileSync('raw-sheets.json', 'utf-8'))
    : [];

  let added = 0;
  const today = new Date().toISOString().split('T')[0];

  // Merge Google Places results
  for (const place of raw) {
    if (existingIds.has(place.place_id)) continue;

    const area = extractArea(place.address);
    let slug = makeSlug(place.name, area);
    let i = 2;
    while (existingSlugs.has(slug)) slug = makeSlug(place.name, area) + `-${i++}`;

    existing.push({
      id: slug,
      slug,
      name: place.name,
      area,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      phone: place.phone,
      website: place.website,
      facebook: '',
      services: [],
      tags: [],
      rating: place.rating,
      review_count: place.review_count,
      photo_url: place.photo_url,
      description: '',
      hours: place.hours,
      is_mobile: place.name.toLowerCase().includes('mobile'),
      source: 'google',
      place_id: place.place_id,
      last_updated: today
    });
    existingIds.add(place.place_id);
    existingSlugs.add(slug);
    added++;
  }

  // Merge self-submissions from Google Sheets
  for (const sub of sheets) {
    if (!sub.name) continue;
    const area = sub.area || 'Cape Town';
    let slug = makeSlug(sub.name, area);
    let i = 2;
    while (existingSlugs.has(slug)) slug = makeSlug(sub.name, area) + `-${i++}`;

    existing.push({
      id: slug,
      slug,
      name: sub.name,
      area,
      address: sub.address || '',
      lat: null,
      lng: null,
      phone: sub.phone || '',
      website: sub.website || '',
      facebook: sub.facebook || '',
      services: (sub.services || '').split(',').map(s => s.trim()).filter(Boolean),
      tags: [],
      rating: null,
      review_count: 0,
      photo_url: '',
      description: sub.description || '',
      hours: sub.hours || '',
      is_mobile: sub.is_mobile === 'Yes',
      source: 'submission',
      place_id: '',
      last_updated: today
    });
    existingSlugs.add(slug);
    added++;
  }

  // Sort alphabetically
  existing.sort((a, b) => a.name.localeCompare(b.name));

  writeFileSync('../data/businesses.json', JSON.stringify(existing, null, 2));
  writeFileSync('../data/last-updated.json', JSON.stringify({
    date: today,
    count: existing.length
  }));

  console.log(`Added ${added} new businesses. Total: ${existing.length}`);
}

main();
