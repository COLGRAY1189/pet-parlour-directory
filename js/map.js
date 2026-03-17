let map;
let markersLayer;

function initMap(businesses) {
  window._currentBusinesses = businesses;
  map = L.map('map', { zoomControl: true }).setView([-33.9249, 18.4241], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  addMarkers(businesses);
}

function createMarkerIcon(isMobile) {
  return L.divIcon({
    html: `<div style="
      width: 28px; height: 28px;
      background: ${isMobile ? '#C4622D' : '#1C2B1E'};
      border: 2.5px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
}

function addMarkers(businesses) {
  markersLayer.clearLayers();
  businesses.forEach(b => {
    if (!b.lat || !b.lng) return;
    const marker = L.marker([b.lat, b.lng], { icon: createMarkerIcon(b.is_mobile) });
    marker.bindTooltip(b.name, { direction: 'top', offset: [0, -28], className: 'map-tooltip' });
    marker.bindPopup(`
      <div class="map-popup">
        ${b.photo_url ? `<img class="map-popup__img" src="${b.photo_url}" alt="${b.name}" onerror="this.style.display='none'">` : ''}
        <div style="padding: 0.875rem;">
          <div class="map-popup__name">${b.name}</div>
          <div class="map-popup__area">📍 ${b.area}</div>
          ${b.phone ? `<div class="map-popup__phone">📞 ${b.phone}</div>` : ''}
          <a class="map-popup__link" href="businesses/${b.slug}.html">View full listing →</a>
        </div>
      </div>
    `, { maxWidth: 220 });
    markersLayer.addLayer(marker);
  });
}

function updateMapMarkers(businesses) {
  if (map) addMarkers(businesses);
}

let fullscreenMap;

function toggleMapFullscreen() {
  const overlay = document.getElementById('mapOverlay');
  const isOpen = overlay.style.display === 'flex';
  if (isOpen) {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  } else {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (!fullscreenMap) {
      fullscreenMap = L.map('mapFullscreen', { zoomControl: true }).setView([-33.9249, 18.4241], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
      }).addTo(fullscreenMap);
      // Add all current markers to fullscreen map
      const fsLayer = L.layerGroup().addTo(fullscreenMap);
      window._currentBusinesses?.forEach(b => {
        if (!b.lat || !b.lng) return;
        const m = L.marker([b.lat, b.lng], { icon: createMarkerIcon(b.is_mobile) });
        m.bindTooltip(b.name, { direction: 'top', offset: [0, -28], className: 'map-tooltip' });
        m.bindPopup(`<div class="map-popup"><div style="padding:0.875rem;"><div class="map-popup__name">${b.name}</div><div class="map-popup__area">📍 ${b.area}</div>${b.phone ? `<div class="map-popup__phone">📞 ${b.phone}</div>` : ''}<a class="map-popup__link" href="businesses/${b.slug}.html">View full listing →</a></div></div>`, { maxWidth: 220 });
        fsLayer.addLayer(m);
      });
    }
    setTimeout(() => fullscreenMap.invalidateSize(), 100);
  }
}

window.initMap = initMap;
window.updateMapMarkers = updateMapMarkers;
window.toggleMapFullscreen = toggleMapFullscreen;
