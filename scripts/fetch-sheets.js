import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

const SHEETS_CSV_URL = process.env.SHEETS_CSV_URL;

async function main() {
  if (!SHEETS_CSV_URL) {
    console.error('ERROR: SHEETS_CSV_URL environment variable not set');
    process.exit(1);
  }

  const res = await fetch(SHEETS_CSV_URL);
  if (!res.ok) {
    console.error(`Failed to fetch sheet: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const csv = await res.text();
  const lines = csv.trim().split('\n');

  if (lines.length < 2) {
    console.log('No submissions found in sheet');
    writeFileSync('raw-sheets.json', '[]');
    return;
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  const records = lines.slice(1).map(line => {
    // Handle CSV values that may contain commas within quotes
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  }).filter(r => r['Business Name'] || r['name']);

  // Normalize field names (Google Forms uses the question text as header)
  const formatted = records.map(r => ({
    name: r['Business Name'] || r['name'] || '',
    area: r['Area / Suburb'] || r['area'] || '',
    address: r['Full Address'] || r['address'] || '',
    phone: r['Phone Number'] || r['phone'] || '',
    website: r['Website URL'] || r['website'] || '',
    facebook: r['Facebook Page URL'] || r['facebook'] || '',
    services: r['Services offered'] || r['services'] || '',
    is_mobile: r['Is this a mobile service?'] || r['is_mobile'] || 'No',
    hours: r['Business hours'] || r['hours'] || '',
    description: r['Brief description'] || r['description'] || ''
  })).filter(r => r.name);

  writeFileSync('raw-sheets.json', JSON.stringify(formatted, null, 2));
  console.log(`Fetched ${formatted.length} submissions → raw-sheets.json`);
}

main().catch(console.error);
