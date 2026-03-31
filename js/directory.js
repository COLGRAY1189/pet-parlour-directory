let allBusinesses = [];
let activeFilter = 'all';

const MAPS_API_KEY = '';

function photoUrl(url) {
  if (!url) return null;
  if (url.includes('places.googleapis.com') && !url.includes('key=')) {
    const separator = url.includes('?') ? '&' : '?';
    return url + separator + 'key=' + MAPS_API_KEY;
  }
  return url;
}

async function loadBusinesses() {
  const res = await fetch('data/businesses.json');
  allBusinesses = await res.json();
  renderDirectory(allBusinesses);
  if (window.initMap) window.initMap(allBusinesses);
  document.getElementById('resultsCount').innerHTML = '<strong>' + allBusinesses.length + '</strong> businesses found';
}

function renderDirectory(businesses) {
  const grid = document.getElementById('businessGrid');
  if (!businesses.length) {
    grid.innerHTML =
      '<div style="grid-column:1/-1; padding:5rem 0; text-align:center; color:var(--text-muted);">' +
        '<div style="font-family:var(--font-display);font-size:2rem;color:var(--text-primary);margin-bottom:0.5rem;letter-spacing:-0.02em;">No results found</div>' +
        '<div style="font-size:0.88rem;">Try adjusting your search or filter</div>' +
      '</div>';
    return;
  }
  grid.innerHTML = businesses.map(function(b, i) {
    var stars = b.rating ? ('<span class="star-filled"></span>'.repeat(Math.round(b.rating)) + '<span class="star-empty"></span>'.repeat(5 - Math.round(b.rating))) : '';
    var imgSrc = b.local_photo || (b.photo_url ? photoUrl(b.photo_url) : null);
    var imageHtml = imgSrc
      ? '<img class="business-card__image" src="' + imgSrc + '" alt="' + b.name + ' pet grooming" loading="lazy" onerror="this.style.display=&quot;none&quot;;this.nextElementSibling.style.display=&quot;flex&quot;"><div class="business-card__image-placeholder" style="display:none"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21c-4.97 0-9-2.686-9-6s4.03-6 9-6 9 2.686 9 6-4.03 6-9 6z"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="5" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></div>'
      : '<div class="business-card__image-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21c-4.97 0-9-2.686-9-6s4.03-6 9-6 9 2.686 9 6-4.03 6-9 6z"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="5" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></div>';
    var staggerClass = 'stagger-' + ((i % 9) + 1);
    return (
    '<a href="businesses/' + b.slug + '.html" class="business-card reveal ' + staggerClass + '">' +
      '<div class="business-card__image-wrap">' +
        imageHtml +
        '<div class="business-card__badges">' +
          (b.is_mobile ? '<span class="badge badge--mobile">Mobile</span>' : '') +
          (b.source === 'google' ? '<span class="badge badge--verified">Verified</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="business-card__body">' +
        '<div class="business-card__name">' + b.name + '</div>' +
        '<div class="business-card__area">' +
          '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg> ' +
          b.area +
        '</div>' +
        (stars ? '<div class="business-card__rating"><span class="stars">' + stars + '</span><small>' + b.rating + ' (' + b.review_count + ' reviews)</small></div>' : '') +
        (b.phone ? '<div class="business-card__phone"><svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg> ' + b.phone + '</div>' : '') +
      '</div>' +
    '</a>');
  }).join('');
  // Re-observe new cards for scroll reveal
  observeReveals();
  var count = businesses.length;
  document.getElementById('resultsCount').innerHTML = '<strong>' + count + '</strong> business' + (count !== 1 ? 'es' : '') + ' found';
}

function filterBusinesses() {
  var filtered = allBusinesses.slice();
  var query = (document.getElementById('searchInput') ? document.getElementById('searchInput').value : '').toLowerCase();
  if (query) {
    filtered = filtered.filter(function(b) {
      return b.name.toLowerCase().includes(query) ||
        b.area.toLowerCase().includes(query) ||
        b.address.toLowerCase().includes(query) ||
        (b.services || []).some(function(s) { return s.toLowerCase().includes(query); });
    });
  }
  if (activeFilter !== 'all') {
    filtered = filtered.filter(function(b) {
      if (activeFilter === 'mobile') return b.is_mobile;
      if (activeFilter === 'salon') return !b.is_mobile;
      return (b.tags || []).includes(activeFilter);
    });
  }
  return filtered;
}

function handleSearch() {
  var filtered = filterBusinesses();
  renderDirectory(filtered);
  if (window.updateMapMarkers) window.updateMapMarkers(filtered);
}

function handleSort() {
  var sort = document.getElementById('sortSelect').value;
  var filtered = filterBusinesses();
  if (sort === 'name') filtered.sort(function(a, b) { return a.name.localeCompare(b.name); });
  if (sort === 'rating') filtered.sort(function(a, b) { return (b.rating || 0) - (a.rating || 0); });
  if (sort === 'area') filtered.sort(function(a, b) { return a.area.localeCompare(b.area); });
  renderDirectory(filtered);
}

// Filter chip clicks
document.querySelectorAll('.chip').forEach(function(chip) {
  chip.addEventListener('click', function() {
    document.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    handleSearch();
  });
});

// Live search on keyup
if (document.getElementById('searchInput')) {
  document.getElementById('searchInput').addEventListener('keyup', handleSearch);
}

// URL query param support (?q=...)
var urlParams = new URLSearchParams(window.location.search);
var urlQuery = urlParams.get('q');
if (urlQuery && document.getElementById('searchInput')) {
  document.getElementById('searchInput').value = urlQuery;
}

// Scroll-triggered reveal animations
function observeReveals() {
  var reveals = document.querySelectorAll('.reveal:not(.revealed)');
  if (!reveals.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveals.forEach(function(el) { el.classList.add('revealed'); });
    return;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(function(el) { observer.observe(el); });
}

loadBusinesses();
