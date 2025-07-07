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

            // --- VOLTAMOS PARA O ÍCONE DE PINO NUMERADO ---
            const svgPinIcon = L.divIcon({
                className: 'custom-marker-wrapper', // Classe wrapper sem estilo
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
                popupAnchor: [0, -35]
            });

            const marker = L.marker([lat, lng], { icon: svgPinIcon }).addTo(map);
            
            // --- NOVO CONTEÚDO CUSTOMIZADO PARA O POPUP ---
            const popupContent = `
                <div class="popup-title" style="border-color: ${pinColor};">
                    ${p.NomePesqueiro}
                </div>
                <div class="popup-buttons-container">
                    <a href="http://googleusercontent.com/maps.google.com/4{lat},${lng}" target="_blank" class="popup-button">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/aa/Maps_icon_(2020).svg" alt="Google Maps">
                        <span>Google Maps</span>
                    </a>
                    <a href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank" class="popup-button">
                        <img src="https://cdn-icons-png.flaticon.com/512/5968/5968848.png" alt="Waze">
                        <span>Waze</span>
                    </a>
                    <a href="#" class="details-link popup-button" data-id="${p.ID}">
                        <img src="https://cdn-icons-png.flaticon.com/512/157/157933.png" alt="Mais Detalhes">
                        <span>Detalhes</span>
                    </a>
                </div>
            `;
            
            // Adiciona a classe 'custom-popup' ao popup
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