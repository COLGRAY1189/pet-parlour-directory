let allBusinesses = [];
let activeFilter = 'all';

async function loadBusinesses() {
  const res = await fetch('data/businesses.json');
  allBusinesses = await res.json();
  renderDirectory(allBusinesses);
  if (window.initMap) window.initMap(allBusinesses);
  document.getElementById('resultsCount').textContent =
    `${allBusinesses.length} businesses found`;
}

function renderDirectory(businesses) {
  const grid = document.getElementById('businessGrid');
  if (!businesses.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--color-text-muted);">No businesses found. Try a different search.</div>';
    return;
  }
  grid.innerHTML = businesses.map(b => `
    <a href="businesses/${b.slug}.html" class="business-card">
      <img class="business-card__image"
        src="${b.photo_url || 'css/placeholder.svg'}"
        alt="${b.name} pet grooming"
        loading="lazy"
        onerror="this.src='css/placeholder.svg'">
      <div class="business-card__body">
        <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
          ${b.is_mobile ? '<span class="badge badge--mobile">Mobile</span>' : ''}
          ${b.source === 'google' ? '<span class="badge badge--verified">Verified</span>' : ''}
        </div>
        <div class="business-card__name">${b.name}</div>
        <div class="business-card__area">📍 ${b.area}</div>
        ${b.rating ? `<div class="stars">${'★'.repeat(Math.round(b.rating))}${'☆'.repeat(5 - Math.round(b.rating))}</div>
          <small style="color:var(--color-text-muted)">${b.rating} (${b.review_count} reviews)</small>` : ''}
        ${b.phone ? `<div class="business-card__phone" style="margin-top:8px;">📞 ${b.phone}</div>` : ''}
      </div>
    </a>
  `).join('');
  document.getElementById('resultsCount').textContent =
    `${businesses.length} business${businesses.length !== 1 ? 'es' : ''} found`;
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