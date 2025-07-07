let map = null;
const markers = []; // Array para guardar os marcadores e poder limpá-los

/**
 * Inicializa o mapa Leaflet na div especificada.
 */
function initMap(mapId) {
    // Coordenadas de exemplo para centralizar o mapa (São Paulo)
    map = L.map(mapId).setView([-23.5505, -46.6333], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
 * Adiciona marcadores customizados (pino + nome) ao mapa para cada pesqueiro na lista.
 */
function addMarkersToMap(pesqueiros, onMarkerClick) {
    clearMarkers(); // Limpa os marcadores antigos

    // Define uma paleta de cores para variar os pinos
    const colors = ['#e6194B', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9A6324'];

    pesqueiros.forEach((p, index) => {
        if (p.Latitude && p.Longitude) {
            const lat = parseFloat(p.Latitude);
            const lng = parseFloat(p.Longitude);

            // Seleciona uma cor da paleta de forma rotativa
            const pinColor = colors[index % colors.length];

            // Cria um ícone customizado usando L.divIcon com nosso novo HTML e CSS
            const customIcon = L.divIcon({
                className: 'custom-marker-wrapper', // Classe wrapper que não precisa de estilo
                html: `
                    <div class="custom-marker-container">
                        <div class="marker-pin" style="background-color: ${pinColor};"></div>
                        <div class="marker-label">${p.NomePesqueiro}</div>
                    </div>
                `,
                iconSize: [180, 40],  // Largura aumentada para acomodar a etiqueta
                iconAnchor: [15, 35],   // Posição da "ponta" do pino
                popupAnchor: [0, -30]   // Posição de onde o popup deve abrir
            });

            // Cria o marcador usando o novo ícone
            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

            // O popup continua útil para mostrar mais detalhes rapidamente
            const popupContent = `
                <b>${p.NomePesqueiro}</b><br>
                ${p.CidadeUF}<br>
                Preço: R$ ${p.PrecoMedio}<br>
                <a href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank">Rota com Waze</a>
            `;
            marker.bindPopup(popupContent);

            markers.push(marker);
        } else {
            console.warn(`Aviso: O pesqueiro '${p.NomePesqueiro}' (ID: ${p.ID}) não tem coordenadas e não será exibido no mapa.`);
        }
    });
}