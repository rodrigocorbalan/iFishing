let map = null;
const markers = []; // Array para guardar os marcadores e poder limpá-los

/**
 * Inicializa o mapa, adiciona o controle de tela cheia e o marcador de casa.
 */
function initMap(mapId) {
    // Coordenadas para Rua Sud Menucci, 170, Santo André, SP
    const homeCoords = [-23.6763, -46.5414]; 

    // Inicializa o mapa com o controle de tela cheia
    map = L.map(mapId, {
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: 'topright'
        }
    }).setView(homeCoords, 13); // Inicia com zoom no ponto de partida

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Cria e adiciona o ícone de casa
    const homeIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/1946/1946436.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
        className: 'home-icon'
    });

    L.marker(homeCoords, { icon: homeIcon }).addTo(map)
        .bindPopup('<b>Seu Ponto de Partida</b><br>Rua Sud Menucci, 170');

    // Garante que o mapa fique na camada de trás
    document.getElementById(mapId).style.zIndex = 0;
}

/**
 * Limpa todos os marcadores de pesqueiros do mapa.
 */
function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers.length = 0;
}

/**
 * Adiciona marcadores de pesqueiros ao mapa.
 */
function addMarkersToMap(pesqueiros, onMarkerClick) {
    clearMarkers();

    const colors = ['#e6194B', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9A6324'];

    pesqueiros.forEach((p, index) => {
        if (p.Latitude && p.Longitude) {
            const lat = parseFloat(p.Latitude);
            const lng = parseFloat(p.Longitude);
            const pinColor = colors[index % colors.length];

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
            
            const popupContent = `
                <div class="popup-main-content">
                    <div class="popup-header">
                        <h5>${p.NomePesqueiro}</h5>
                        <p>${p.CidadeUF}</p>
                    </div>
                    <div class="popup-actions">
                        <a href="http://googleusercontent.com/maps.google.com/5{lat},${lng}" target="_blank" class="action-button">
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