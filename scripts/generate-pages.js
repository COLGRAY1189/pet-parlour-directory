import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const businesses = JSON.parse(readFileSync('../data/businesses.json', 'utf-8'));
const BASE_URL = 'https://COLGRAY1189.github.io/pet-parlour-directory';

mkdirSync('../businesses', { recursive: true });

for (const b of businesses) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": b.name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": b.address,
      "addressLocality": b.area,
      "addressRegion": "Western Cape",
      "addressCountry": "ZA"
    },
    "telephone": b.phone || undefined,
    "url": b.website || `${BASE_URL}/businesses/${b.slug}.html`,
    ...(b.rating ? { "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": b.rating,
      "reviewCount": b.review_count
    }} : {}),
    ...(b.photo_url ? { "image": b.photo_url } : {})
  };

  const starsHtml = b.rating
    ? `<div class="stars">${'★'.repeat(Math.round(b.rating))}${'☆'.repeat(5 - Math.round(b.rating))}</div>
       <p style="color:var(--color-text-muted);font-size:0.875rem;">${b.rating} out of 5 (${b.review_count} reviews)</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${b.name} | Pet Grooming in ${b.area}, Cape Town</title>
  <meta name="description" content="${b.name} is a pet grooming service in ${b.area}, Cape Town.${b.description ? ' ' + b.description : ''}">
  <link rel="canonical" href="${BASE_URL}/businesses/${b.slug}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/main.css">
  <link rel="stylesheet" href="../css/components.css">
  <link rel="stylesheet" href="../css/layout.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <nav class="nav">
    <a href="../index.html" class="nav__logo">🐾 Pet Parlours CT</a>
    <div class="nav__links">
      <a href="../index.html">← Back to Directory</a>
    </div>
    <a href="../submit.html" class="btn btn--primary nav__cta">List Free</a>
  </nav>

  <div class="container section" style="max-width:900px;">
    ${b.photo_url ? `<img src="${b.photo_url}" alt="${b.name} pet grooming in ${b.area}" style="width:100%;height:300px;object-fit:cover;border-radius:var(--radius-md);margin-bottom:2rem;">` : ''}

    <div style="display:grid;grid-template-columns:1fr auto;gap:1rem;align-items:start;flex-wrap:wrap;">
      <div>
        <div style="display:flex;gap:8px;margin-bottom:0.5rem;flex-wrap:wrap;">
          ${b.is_mobile ? '<span class="badge badge--mobile">Mobile</span>' : ''}
          ${b.source === 'google' ? '<span class="badge badge--verified">Verified</span>' : ''}
        </div>
        <h1 style="font-family:var(--font-heading);font-size:2rem;font-weight:800;">${b.name}</h1>
        <p style="color:var(--color-text-muted);margin-top:0.5rem;">📍 ${b.area}, Cape Town</p>
        ${starsHtml}
      </div>
      <div style="text-align:right;display:flex;flex-direction:column;gap:0.5rem;">
        ${b.phone ? `<a href="tel:${b.phone}" class="btn btn--primary">📞 Call Now</a>` : ''}
        ${b.website ? `<a href="${b.website}" target="_blank" rel="noopener" class="btn btn--outline">Visit Website</a>` : ''}
      </div>
    </div>

    <hr style="margin:2rem 0;border:none;border-top:1px solid var(--color-border);">

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;">
      <div>
        ${b.address ? `<p><strong>Address:</strong><br>${b.address}</p>` : ''}
        ${b.hours ? `<p style="margin-top:1rem;"><strong>Hours:</strong><br>${b.hours}</p>` : ''}
        ${b.facebook ? `<p style="margin-top:1rem;"><a href="${b.facebook}" target="_blank" rel="noopener" style="color:var(--color-primary);">View Facebook Page →</a></p>` : ''}
      </div>
      <div>
        ${b.services?.length ? `<p><strong>Services:</strong></p>
        <ul style="margin-top:0.5rem;padding-left:1.2rem;">
          ${b.services.map(s => `<li>${s}</li>`).join('')}
        </ul>` : ''}
      </div>
    </div>

    ${b.description ? `<p style="margin-top:2rem;line-height:1.7;">${b.description}</p>` : ''}

    <div style="margin-top:2rem;padding:1.5rem;background:var(--color-border);border-radius:var(--radius-md);text-align:center;">
      <p>Is this your business? <a href="../submit.html" style="color:var(--color-primary);font-weight:600;">Claim &amp; update your listing →</a></p>
    </div>
  </div>

  <footer class="footer">
    <div class="footer__logo">🐾 Pet Parlours Cape Town</div>
    <p><a href="../index.html" style="color:var(--color-primary-light);">← Back to directory</a></p>
  </footer>
</body>
</html>`;

  writeFileSync(`../businesses/${b.slug}.html`, html);
  console.log(`Generated: businesses/${b.slug}.html`);
}

// Generate sitemap.xml
const today = new Date().toISOString().split('T')[0];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE_URL}/submit.html</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${BASE_URL}/about.html</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  ${businesses.map(b => `<url>
    <loc>${BASE_URL}/businesses/${b.slug}.html</loc>
    <lastmod>${b.last_updated || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n  ')}
</urlset>`;

writeFileSync('../sitemap.xml', sitemap);
console.log(`Generated sitemap.xml with ${businesses.length} businesses`);
