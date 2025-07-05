let map = null;
const markers = []; // Array para guardar os marcadores e poder limpá-los

/**
 * Inicializa o mapa Leaflet na div especificada.
 * @param {string} mapId - O ID do elemento HTML onde o mapa será renderizado.
 */
function initMap(mapId) {
    // Coordenadas de exemplo para centralizar o mapa (São Paulo)
    map = L.map(mapId).setView([-23.5505, -46.6333], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

/**
 * Limpa todos os marcadores do mapa.
 */
function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers.length = 0; // Esvazia o array
}

/**
 * Adiciona marcadores ao mapa para cada pesqueiro na lista.
 * @param {Array<object>} pesqueiros - A lista de pesqueiros.
 * @param {Function} onMarkerClick - Função a ser chamada quando um marcador é clicado.
 */
function addMarkersToMap(pesqueiros, onMarkerClick) {
    clearMarkers(); // Limpa os marcadores antigos antes de adicionar novos

    pesqueiros.forEach(p => {
        // Verifica se há latitude e longitude válidas
        if (p.Latitude && p.Longitude) {
            const lat = parseFloat(p.Latitude);
            const lng = parseFloat(p.Longitude);

            const marker = L.marker([lat, lng]).addTo(map);

            // Conteúdo do popup que aparece ao clicar no marcador
            const popupContent = `
                <b>${p.NomePesqueiro}</b><br>
                ${p.CidadeUF}<br>
                <a href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank">Rota com Waze</a>
            `;
            marker.bindPopup(popupContent);

            // Adiciona um evento de clique para abrir a tela de detalhes
            marker.on('click', () => {
                onMarkerClick(p.ID); 
            });

            markers.push(marker);
        }
    });
}