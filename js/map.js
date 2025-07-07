let map = null;
const markers = []; // Array para guardar os marcadores e poder limpá-los

function initMap(mapId) {
    map = L.map(mapId).setView([-23.5505, -46.6333], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    document.getElementById(mapId).style.zIndex = 0;
}

function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers.length = 0;
}

function addMarkersToMap(pesqueiros, onMarkerClick) {
    clearMarkers();

    const colors = ['#e6194B', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9A6324'];

    pesqueiros.forEach((p, index) => {
        if (p.Latitude && p.Longitude) {
            const lat = parseFloat(p.Latitude);
            const lng = parseFloat(p.Longitude);
            const pinColor = colors[index % colors.length];

            // --- NOVO ÍCONE: PINO SVG + ETIQUETA DE TEXTO ---
            const textMarkerIcon = L.divIcon({
                className: '', // Não precisa de classe wrapper
                html: `
                    <div class="marker-with-label-container">
                        <svg width="32" height="32" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
                            <path fill="${pinColor}" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67a24 24 0 01-35.464 0z"></path>
                        </svg>
                        <div class="map-text-label">${p.NomePesqueiro}</div>
                    </div>
                `,
                iconSize: null,      // Tamanho automático baseado no conteúdo
                iconAnchor: [16, 32],  // Ancoragem na ponta inferior do pino
                popupAnchor: [0, -32]  // Popup abre um pouco acima do pino
            });

            const marker = L.marker([lat, lng], { icon: textMarkerIcon }).addTo(map);
            
            // O conteúdo do popup e seus eventos continuam os mesmos
            const popupContent = `
                <div class="popup-main-content">
                    <div class="popup-header">
                        <h5>${p.NomePesqueiro}</h5>
                        <p>${p.CidadeUF}</p>
                    </div>
                    <div class="popup-actions">
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" class="action-button">
                            <img src="img/icon_gmaps.svg" alt="Google Maps">
                            <span>Google Maps</span>
                        </a>
                        <a href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank" class="action-button">
                            <img src="img/icon_waze.svg" alt="Waze">
                            <span>Waze</span>
                        </a>
                        <a href="#" class="details-link action-button" data-id="${p.ID}">
                            <img src="img/icon_details.svg" alt="Detalhes">
                            <span>Detalhes</span>
                        </a>
                    </div>
                </div>
            `;
            
            marker.bindPopup(popupContent, { className: 'custom-popup' });

            marker.on('popupopen', (e) => {
                const popup = e.popup;
                const link = popup.getElement().querySelector('.details-link');
                if (link) {
                    link.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        const id = ev.target.closest('.details-link').getAttribute('data-id');
                        if (id) {
                            map.closePopup();
                            onMarkerClick(id);
                        }
                    });
                }
            });

            markers.push(marker);
        } else {
            console.warn(`Aviso: O pesqueiro '${p.NomePesqueiro}' (ID: ${p.ID}) não tem coordenadas e não será exibido no mapa.`);
        }
    });
}