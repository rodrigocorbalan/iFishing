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

            // Marcador continua sendo o pino SVG numerado
            const svgPinIcon = L.divIcon({
                className: 'custom-marker-wrapper',
                html: `
                    <div class="svg-marker-container">
                        <svg width="38" height="38" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.7));">
                            <path fill="${pinColor}" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67a24 24 0 01-35.464 0z"></path>
                            <circle cx="192" cy="192" r="64" fill="white"></circle>
                        </svg>
                        <span class="marker-number">${index + 1}</span>
                    </div>
                `,
                iconSize: [38, 38],
                iconAnchor: [19, 38],
                popupAnchor: [0, -38]
            });

            const marker = L.marker([lat, lng], { icon: svgPinIcon }).addTo(map);
            
            // --- NOVO HTML PARA O CONTEÚDO DO POPUP, BASEADO NA SUA SIMULAÇÃO ---
            const popupContent = `
                <div class="popup-main-content">
                    <div class="popup-header">
                        <h5>${p.NomePesqueiro}</h5>
                        <p>${p.CidadeUF}</p>
                    </div>
                    <div class="popup-actions">
                        <a href="http://googleusercontent.com/maps.google.com/5{lat},${lng}" target="_blank" class="action-button">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/aa/Maps_icon_(2020).svg" alt="Google Maps">
                            <span>Google Maps</span>
                        </a>
                        <a href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank" class="action-button">
                            <img src="https://www.waze.com/web/social-share-icon.png" alt="Waze">
                            <span>Waze</span>
                        </a>
                        <a href="#" class="details-link action-button" data-id="${p.ID}">
                            <img src="https://www.svgrepo.com/show/506597/info-circle.svg" alt="Detalhes">
                            <span>Detalhes</span>
                        </a>
                    </div>
                </div>
            `;
            
            // Adiciona a classe 'custom-popup' para aplicar o novo estilo
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