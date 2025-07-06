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

    // =================================================================
    // LINHA DE CÓDIGO DA SOLUÇÃO FINAL:
    // Força o container do mapa a ter um z-index baixo via JavaScript,
    // garantindo que ele fique atrás de outros elementos como o modal.
    // =================================================================
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
 * Adiciona marcadores ao mapa para cada pesqueiro na lista.
 * @param {Array<object>} pesqueiros - A lista de pesqueiros vinda da API.
 * @param {Function} onMarkerClick - Função a ser chamada quando um marcador é clicado.
 */
function addMarkersToMap(pesqueiros, onMarkerClick) {
    clearMarkers(); // Limpa os marcadores antigos antes de adicionar novos

    pesqueiros.forEach(p => {
        // Verifica se o pesqueiro tem coordenadas de latitude e longitude válidas
        if (p.Latitude && p.Longitude) {
            const lat = parseFloat(p.Latitude);
            const lng = parseFloat(p.Longitude);

            // Cria o marcador e o adiciona ao mapa
            const marker = L.marker([lat, lng]).addTo(map);

            // Cria o conteúdo do popup que aparece ao clicar no marcador
            const popupContent = `
                <b>${p.NomePesqueiro}</b><br>
                ${p.CidadeUF}<br>
                <a href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank">Rota com Waze</a>
            `;
            marker.bindPopup(popupContent);

            // Adiciona um evento de clique para abrir a tela de detalhes completos
            marker.on('click', () => {
                onMarkerClick(p.ID); 
            });

            // Guarda a referência do marcador para poder limpá-lo depois
            markers.push(marker);
        }
    });
}