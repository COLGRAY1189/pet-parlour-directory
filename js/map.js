let map;
let markersLayer;

function initMap(businesses) {
  // Cape Town center
  map = L.map('map').setView([-33.9249, 18.4241], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  addMarkers(businesses);
}

function addMarkers(businesses) {
  markersLayer.clearLayers();
  businesses.forEach(b => {
    if (!b.lat || !b.lng) return;
    const marker = L.marker([b.lat, b.lng]);
    marker.bindPopup(`
      <div class="map-popup__name">${b.name}</div>
      <div style="font-size:0.8rem;color:#6B7280;margin-bottom:4px;">📍 ${b.area}</div>
      ${b.phone ? `<div class="map-popup__phone">📞 ${b.phone}</div>` : ''}
      <a href="businesses/${b.slug}.html"
        style="display:block;margin-top:8px;color:#2D6A4F;font-weight:600;font-size:0.85rem;">
        View details →
      </a>
    `);
    markersLayer.addLayer(marker);
  });
}

function updateMapMarkers(businesses) {
  if (map) addMarkers(businesses);
}

window.initMap = initMap;
window.updateMapMarkers = updateMapMarkers;