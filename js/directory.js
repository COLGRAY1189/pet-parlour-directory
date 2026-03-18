let allBusinesses = [];
let activeFilter = 'all';

const MAPS_API_KEY = 'AIzaSyAWOSkZL0ECFm4gfKWrMf8A21wq3nXZgdw';

function photoUrl(url) {
  if (!url) return null;
  if (url.includes('places.googleapis.com') && !url.includes('key=')) {
    return url + '&key=' + MAPS_API_KEY;
  }
  return url;
}

async function loadBusinesses() {
  const res = await fetch('data/businesses.json');
  allBusinesses = await res.json();
  renderDirectory(allBusinesses);
  if (window.initMap) window.initMap(allBusinesses);
  document.getElementById('resultsCount').innerHTML = `<strong>${allBusinesses.length}</strong> businesses found`;
}

function renderDirectory(businesses) {
  const grid = document.getElementById('businessGrid');
  if (!businesses.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; padding:5rem 0; text-align:center; color:var(--text-muted);">
        <div style="font-family:var(--font-display);font-size:2rem;color:var(--text-dark);margin-bottom:0.5rem;">No results found</div>
        <div style="font-size:0.875rem;">Try adjusting your search or filter</div>
      </div>`;
    return;
  }
  grid.innerHTML = businesses.map(b => {
    const stars = b.rating ? ('★'.repeat(Math.round(b.rating)) + '☆'.repeat(5 - Math.round(b.rating))) : '';
    const imageHtml = b.photo_url
      ? `<img class="business-card__image" src="${photoUrl(b.photo_url)}" alt="${b.name} pet grooming" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'business-card__image-placeholder\\'>🐾</div>'">`
      : `<div class="business-card__image-placeholder">🐾</div>`;
    return `
    <a href="businesses/${b.slug}.html" class="business-card">
      <div class="business-card__image-wrap">
        ${imageHtml}
        <div class="business-card__badges">
          ${b.is_mobile ? '<span class="badge badge--mobile">Mobile</span>' : ''}
          ${b.source === 'google' ? '<span class="badge badge--verified">Verified</span>' : ''}
        </div>
      </div>
      <div class="business-card__body">
        <div class="business-card__name">${b.name}</div>
        <div class="business-card__area">📍 ${b.area}</div>
        ${stars ? `<div class="business-card__rating"><span class="stars">${stars}</span><small>${b.rating} (${b.review_count} reviews)</small></div>` : ''}
        ${b.phone ? `<div class="business-card__phone">📞 ${b.phone}</div>` : ''}
      </div>
    </a>`;
  }).join('');
  const count = businesses.length;
  document.getElementById('resultsCount').innerHTML = `<strong>${count}</strong> business${count !== 1 ? 'es' : ''} found`;
}

function filterBusinesses() {
  let filtered = [...allBusinesses];
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
  if (query) {
    filtered = filtered.filter(b =>
      b.name.toLowerCase().includes(query) ||
      b.area.toLowerCase().includes(query) ||
      b.address.toLowerCase().includes(query) ||
      (b.services || []).some(s => s.toLowerCase().includes(query))
    );
  }
  if (activeFilter !== 'all') {
    filtered = filtered.filter(b => {
      if (activeFilter === 'mobile') return b.is_mobile;
      if (activeFilter === 'salon') return !b.is_mobile;
      return (b.tags || []).includes(activeFilter);
    });
  }
  return filtered;
}

function handleSearch() {
  const filtered = filterBusinesses();
  renderDirectory(filtered);
  if (window.updateMapMarkers) window.updateMapMarkers(filtered);
}

function handleSort() {
  const sort = document.getElementById('sortSelect').value;
  let filtered = filterBusinesses();
  if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'rating') filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (sort === 'area') filtered.sort((a, b) => a.area.localeCompare(b.area));
  renderDirectory(filtered);
}

// Filter chip clicks
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    handleSearch();
  });
});

// Live search on keyup
document.getElementById('searchInput')?.addEventListener('keyup', handleSearch);

// URL query param support (?q=...)
const urlParams = new URLSearchParams(window.location.search);
const urlQuery = urlParams.get('q');
if (urlQuery) {
  document.getElementById('searchInput').value = urlQuery;
}

loadBusinesses();