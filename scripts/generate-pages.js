import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const businesses = JSON.parse(readFileSync('../data/businesses.json', 'utf-8'));
const reviews = existsSync('../data/reviews.json')
  ? JSON.parse(readFileSync('../data/reviews.json', 'utf-8'))
  : {};
const BASE_URL = 'https://pet-parlour.fun';
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

function photoUrl(url) {
  if (!url) return '';
  if (url.includes('places.googleapis.com') && !url.includes('key=')) {
    const sep = url.includes('?') ? '&' : '?';
    return url + sep + 'key=' + API_KEY;
  }
  return url;
}

// SVG icon helpers
const ICONS = {
  location: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  phone: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
  clock: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  globe: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
  facebook: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>',
  star: '<svg class="icon-inline" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
};

function starsHtml(rating) {
  if (!rating) return '';
  const filled = Math.round(rating);
  const empty = 5 - filled;
  return '<span class="star-filled"></span>'.repeat(filled) + '<span class="star-empty"></span>'.repeat(empty);
}

function reviewsSection(slug) {
  const bizReviews = reviews[slug];
  if (!bizReviews || !bizReviews.length) return '';

  const reviewCards = bizReviews.map(r => {
    const stars = starsHtml(r.rating);
    const initial = (r.author || 'A').charAt(0).toUpperCase();
    const text = r.text ? `<p style="font-size:0.88rem;color:var(--text-secondary);line-height:1.75;margin-top:0.5rem;">${r.text.replace(/"/g, '&quot;').replace(/</g, '&lt;')}</p>` : '';
    return `
      <div class="review-card">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;">
          <div class="review-avatar">${initial}</div>
          <div>
            <div style="font-weight:600;font-size:0.88rem;color:var(--text-primary);">${r.author}</div>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span class="stars">${stars}</span>
              ${r.time ? `<span style="font-size:0.72rem;color:var(--text-muted);">${r.time}</span>` : ''}
            </div>
          </div>
        </div>
        ${text}
      </div>`;
  }).join('');

  return `
    <div style="margin-bottom:2rem;">
      <div class="section-label">Google Reviews</div>
      <div class="reviews-grid">${reviewCards}</div>
    </div>`;
}

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
    ...(b.local_photo || b.photo_url ? { "image": b.local_photo ? `https://colgray1189.github.io/pet-parlour-directory/${b.local_photo}` : photoUrl(b.photo_url) } : {})
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${b.name} | Pet Grooming in ${b.area}, Cape Town</title>
  <meta name="description" content="${b.name} is a pet grooming service in ${b.area}, Cape Town.${b.description ? ' ' + b.description.replace(/"/g, '&quot;') : ''}">
  <link rel="canonical" href="${BASE_URL}/businesses/${b.slug}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/main.css">
  <link rel="stylesheet" href="../css/components.css">
  <link rel="stylesheet" href="../css/layout.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>
  <style>
    .biz-hero {
      background: var(--primary);
      position: relative;
      padding: 8rem 2.5rem 3.5rem;
      overflow: hidden;
    }
    .biz-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 70% 60% at 15% 85%, rgba(61,107,68,0.35) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 80% 20%, rgba(200,107,58,0.06) 0%, transparent 50%);
      pointer-events: none;
    }
    .biz-hero__bg {
      position: absolute;
      top: 50%;
      right: -1rem;
      transform: translateY(-50%);
      font-family: var(--font-display);
      font-size: clamp(5rem,14vw,14rem);
      font-weight: 700;
      color: rgba(250,250,247,0.02);
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
    }
    .biz-content {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 3rem;
      align-items: start;
    }
    @media(max-width:768px){ .biz-content { grid-template-columns: 1fr; } .biz-hero { padding: 7rem 1.25rem 2.5rem; } }
    .biz-sidebar { position: sticky; top: 88px; }
    .biz-card {
      background: var(--surface-elevated);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }
    .biz-card__img {
      width: 100%;
      height: 220px;
      object-fit: cover;
      display: block;
      background: var(--surface-muted);
    }
    .biz-card__body { padding: 1.5rem; }
    .biz-card__cta {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.25rem;
      border-top: 1px solid var(--border-light);
    }
    .info-row {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.95rem 1.25rem;
      border-bottom: 1px solid var(--border-light);
      font-size: 0.88rem;
    }
    .info-row:last-child { border-bottom: none; }
    .info-row__icon { color: var(--accent); flex-shrink: 0; margin-top: 0.1rem; }
    .info-row__icon svg { width: 16px; height: 16px; }
    .info-row__label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 0.2rem; }
    .hours-list { display: flex; flex-direction: column; gap: 0.2rem; }
    .hours-list__day { font-size: 0.88rem; color: var(--text-primary); }
    .services-wrap { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
    .service-tag {
      padding: 0.35rem 0.85rem;
      background: var(--surface-warm);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-pill);
      font-size: 0.78rem;
      color: var(--text-secondary);
      font-weight: 450;
    }
    .icon-inline { width: 15px; height: 15px; vertical-align: -2px; flex-shrink: 0; }
    .stars { display: flex; align-items: center; gap: 2px; }
    .star-filled, .star-empty { display: inline-block; width: 14px; height: 14px; }
    .star-filled { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23C4A265'%3E%3Cpath d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'/%3E%3C/svg%3E") center/contain no-repeat; }
    .star-empty { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23C4A265' stroke-width='1.5'%3E%3Cpath d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'/%3E%3C/svg%3E") center/contain no-repeat; }
    .reviews-grid { display: grid; gap: 1rem; }
    .review-card {
      background: var(--surface-elevated);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 1.35rem;
    }
    .review-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--primary);
      color: var(--surface);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 1rem;
      flex-shrink: 0;
    }
    .nav__logo-icon { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; }
  </style>
</head>
<body>
  <nav class="nav scrolled" id="nav">
    <a href="../index.html" class="nav__logo">
      <img src="../assets/logo.svg" alt="The Parlour" class="nav__logo-icon" width="34" height="34">
      The Parlour
    </a>
    <div class="nav__links">
      <a href="../index.html">Directory</a>
    </div>
    <a href="../submit.html" class="nav__cta"><span>List Free</span></a>
  </nav>

  <section class="biz-hero">
    <div class="biz-hero__bg">${b.name.split(' ')[0]}</div>
    <div style="max-width:1360px;margin:0 auto;position:relative;z-index:1;">
      <div style="font-size:0.72rem;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent);margin-bottom:1.25rem;display:flex;align-items:center;gap:1rem;"><span style="width:40px;height:1px;background:var(--accent);display:inline-block;"></span> ${b.area} &middot; Cape Town</div>
      <h1 style="font-family:var(--font-display);font-size:clamp(2rem,5vw,4rem);font-weight:400;color:var(--surface);line-height:1.05;letter-spacing:-0.03em;margin-bottom:0.85rem;">${b.name}</h1>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;">
        ${b.is_mobile ? '<span class="badge badge--mobile">Mobile</span>' : ''}
        ${b.source === 'google' ? '<span class="badge badge--verified">Verified</span>' : ''}
      </div>
      ${b.rating ? `<div style="display:flex;align-items:center;gap:0.5rem;"><span class="stars">${starsHtml(b.rating)}</span><span style="color:rgba(250,250,247,0.55);font-size:0.88rem;">${b.rating} out of 5 &middot; ${b.review_count} reviews</span></div>` : ''}
    </div>
  </section>

  <div class="container section" style="max-width:1100px;">
    <div class="biz-content">

      <!-- Main content -->
      <div>
        ${b.description ? `<div style="margin-bottom:2.25rem;"><div class="section-label">About</div><p style="font-size:1rem;line-height:1.85;color:var(--text-secondary);">${b.description}</p></div>` : ''}

        ${b.services?.length ? `
        <div style="margin-bottom:2.25rem;">
          <div class="section-label">Services Offered</div>
          <div class="services-wrap">
            ${b.services.map(s => `<span class="service-tag">${s}</span>`).join('')}
          </div>
        </div>` : ''}

        ${reviewsSection(b.slug)}

        <div style="margin-bottom:2.25rem;">
          <div class="section-label">Business Details</div>
          <div style="background:var(--surface-elevated);border:1px solid var(--border-light);border-radius:var(--radius-md);overflow:hidden;">
            ${b.address ? `<div class="info-row"><div class="info-row__icon">${ICONS.location}</div><div><div class="info-row__label">Address</div>${b.address}</div></div>` : ''}
            ${b.hours ? `<div class="info-row"><div class="info-row__icon">${ICONS.clock}</div><div><div class="info-row__label">Hours</div><div class="hours-list">${b.hours.split(',').map(h => `<div class="hours-list__day">${h.trim()}</div>`).join('')}</div></div></div>` : ''}
            ${b.phone ? `<div class="info-row"><div class="info-row__icon">${ICONS.phone}</div><div><div class="info-row__label">Phone</div><a href="tel:${b.phone}" style="color:var(--primary-mid);font-weight:500;">${b.phone}</a></div></div>` : ''}
            ${b.website ? `<div class="info-row"><div class="info-row__icon">${ICONS.globe}</div><div><div class="info-row__label">Website</div><a href="${b.website}" target="_blank" rel="noopener" style="color:var(--accent);">${b.website.replace(/^https?:\/\//, '')}</a></div></div>` : ''}
            ${b.facebook ? `<div class="info-row"><div class="info-row__icon">${ICONS.facebook}</div><div><div class="info-row__label">Facebook</div><a href="${b.facebook}" target="_blank" rel="noopener" style="color:var(--accent);">View Facebook Page</a></div></div>` : ''}
          </div>
        </div>

        <div style="background:var(--surface-warm);border:1px solid var(--border-light);border-radius:var(--radius-md);padding:1.75rem;text-align:center;">
          <p style="font-size:0.88rem;color:var(--text-muted);margin-bottom:0.85rem;">Is this your business?</p>
          <a href="../submit.html" class="btn btn--outline" style="font-size:0.82rem;">Claim &amp; Update Listing</a>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="biz-sidebar">
        <div class="biz-card">
          ${(b.local_photo || b.photo_url) ? `<img class="biz-card__img" src="../${b.local_photo || photoUrl(b.photo_url)}" alt="${b.name}" onerror="this.style.display='none'">` : `<div style="height:180px;background:var(--surface-muted);display:flex;align-items:center;justify-content:center;color:var(--border);"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21c-4.97 0-9-2.686-9-6s4.03-6 9-6 9 2.686 9 6-4.03 6-9 6z"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="5" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></div>`}
          <div class="biz-card__body">
            <div style="font-family:var(--font-display);font-size:1.3rem;font-weight:600;margin-bottom:0.3rem;letter-spacing:-0.01em;">${b.name}</div>
            <div style="font-size:0.82rem;color:var(--text-muted);display:flex;align-items:center;gap:0.35rem;">${ICONS.location} ${b.area}, Cape Town</div>
          </div>
          <div class="biz-card__cta">
            ${b.phone ? `<a href="tel:${b.phone}" class="btn btn--primary" style="justify-content:center;gap:0.5rem;">${ICONS.phone} Call Now</a>` : ''}
            ${b.website ? `<a href="${b.website}" target="_blank" rel="noopener" class="btn btn--outline" style="justify-content:center;font-size:0.82rem;">Visit Website</a>` : ''}
            <a href="../index.html" style="text-align:center;font-size:0.82rem;color:var(--text-muted);padding-top:0.25rem;transition:color 0.2s;">Back to directory</a>
          </div>
        </div>
      </div>

    </div>
  </div>

  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__top">
        <div>
          <div class="footer__logo">The Parlour</div>
          <p class="footer__tagline">Cape Town's most complete directory of pet grooming services.</p>
        </div>
        <div>
          <div class="footer__heading">Directory</div>
          <ul class="footer__links">
            <li><a href="../index.html">Browse All</a></li>
            <li><a href="../about.html">About</a></li>
          </ul>
        </div>
        <div>
          <div class="footer__heading">Business</div>
          <ul class="footer__links">
            <li><a href="../submit.html">List for Free</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>&copy; 2026 Pet Parlours Cape Town</span>
      </div>
    </div>
  </footer>
  <script>
    window.addEventListener('scroll', () => {
      document.getElementById('nav')?.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  </script>
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
