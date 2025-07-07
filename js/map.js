let map = null;
const markers = []; // Array para guardar os marcadores e poder limpá-los

/**
 * Inicializa o mapa Leaflet na div especificada.
 */
function initMap(mapId) {
    map = L.map(mapId).setView([-23.5505, -46.6333], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Solução definitiva para o problema de sobreposição do modal
    document.getElementById(mapId).style.zIndex = 0;
}

/**
 * Limpa todos os marcadores existentes do mapa.
 */
function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers.length = 0; // Esvazia o array de marcadores
}

/**
 * Adiciona marcadores customizados (pino + etiqueta com nome) ao mapa.
 */
function addMarkersToMap(pesqueiros, onMarkerClick) {
    clearMarkers(); // Limpa os marcadores antigos

    const colors = ['#e6194B', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9A6324'];

    pesqueiros.forEach((p, index) => {
        if (p.Latitude && p.Longitude) {
            const lat = parseFloat(p.Latitude);
            const lng = parseFloat(p.Longitude);

            const pinColor = colors[index % colors.length];

            // Cria um ícone customizado usando L.divIcon com o pino e a etiqueta
            const customIcon = L.divIcon({
                className: '', // Não precisa de classe wrapper
                html: `
                    <div class="custom-pin-label-marker">
                        <svg width="32" height="32" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
                            <path fill="${pinColor}" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67a24 24 0 01-35.464 0z"></path>
                            <circle cx="192" cy="192" r="64" fill="white"></circle>
                        </svg>
                        <div class="marker-label-box" style="border-color: ${pinColor};">
                            ${p.NomePesqueiro}
                        </div>
                    </div>
                `,
                iconSize: null, // Tamanho será definido pelo conteúdo
                iconAnchor: [16, 32], // Ancoragem na ponta inferior do pino
                popupAnchor: [0, -32] // Posição de onde o popup deve abrir
            });

            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

            const popupContent = `
                <div style="text-align: center;">
                    <b>${p.NomePesqueiro}</b><br>
                    <small>${p.CidadeUF}</small>
                    <hr style="margin: 5px 0;">
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" style="color: #4285F4;">Rota com Google Maps</a><br>
                    <a href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank" style="color: #33ccff;">Rota com Waze</a><br>
                    <a href="#" class="details-link" data-id="${p.ID}" style="color: #0056b3; font-weight: bold;">Ver mais detalhes</a>
                </div>
            `;
            marker.bindPopup(popupContent);

            marker.on('popupopen', (e) => {
                const popup = e.popup;
                const link = popup.getElement().querySelector('.details-link');
                if (link) {
                    link.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        const id = ev.target.getAttribute('data-id');
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