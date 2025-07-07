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
 * Adiciona marcadores numerados ao mapa para cada pesqueiro na lista.
 * @param {Array<object>} pesqueiros - A lista de pesqueiros.
 * @param {Function} onMarkerClick - Função a ser chamada quando um marcador é clicado.
 */
function addMarkersToMap(pesqueiros, onMarkerClick) {
    clearMarkers(); // Limpa os marcadores antigos antes de adicionar novos

    // Usamos o forEach com 'index' para ter a numeração
    pesqueiros.forEach((p, index) => {
        if (p.Latitude && p.Longitude) {
            const lat = parseFloat(p.Latitude);
            const lng = parseFloat(p.Longitude);

            // Cria um ícone customizado usando L.divIcon
            const numberIcon = L.divIcon({
                className: 'numbered-marker', // A classe CSS que estilizamos
                html: `<b>${index + 1}</b>`,     // O número que será exibido
                iconSize: [25, 25],          // Tamanho do ícone
                iconAnchor: [12, 25],        // Ponto de "ancoragem" do ícone no mapa
                popupAnchor: [0, -20]        // Ponto de onde o popup deve abrir
            });

            // Cria o marcador usando o novo ícone
            const marker = L.marker([lat, lng], { icon: numberIcon }).addTo(map);

            // O conteúdo do popup continua o mesmo
            const popupContent = `
                <b>${index + 1}. ${p.NomePesqueiro}</b><br>
                ${p.CidadeUF}<br>
                <a href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank">Rota com Waze</a>
            `;
            marker.bindPopup(popupContent);

            marker.on('click', () => {
                onMarkerClick(p.ID); 
            });

            markers.push(marker);
        }
    });
}