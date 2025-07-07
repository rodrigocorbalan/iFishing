// Variáveis globais
let todosOsPesqueiros = [];
let pesqueirosFiltrados = [];
let pesqueiroIdToDelete = null;

/**
 * Função principal que inicializa a UI.
 */
async function initUI() {
    showLoading(true);
    todosOsPesqueiros = await getPesqueiros();
    pesqueirosFiltrados = [...todosOsPesqueiros];
    renderTable(pesqueirosFiltrados);
    addMarkersToMap(pesqueirosFiltrados, showDetailsModal);
    populateFishFilter(todosOsPesqueiros);
    setupEventListeners();
    showLoading(false); // Movido para o final, após setupEventListeners
}

/**
 * Renderiza a tabela de pesqueiros.
 */
function renderTable(pesqueiros) {
    const tableBody = document.getElementById('pesqueiros-table-body');
    tableBody.innerHTML = '';
    if (pesqueiros.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-4">Nenhum pesqueiro encontrado para este filtro.</td></tr>';
        return;
    }
    pesqueiros.forEach((p, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-100 cursor-pointer';
        tr.setAttribute('data-id', p.ID);
        tr.innerHTML = `
            <td class="p-2 border-t text-center font-medium">${index + 1}</td>
            <td class="p-2 border-t">${p.NomePesqueiro}</td>
            <td class="p-2 border-t">${p.CidadeUF}</td>
            <td class="p-2 border-t">${p.TempoSemTransito} min</td>
            <td class="p-2 border-t">${p.Distancia} km</td>
            <td class="p-2 border-t">R$ ${p.PrecoMedio}</td>
            <td class="p-2 border-t">${p.AceitaReserva}</td>
            <td class="p-2 border-t">
                <button class="text-blue-500 hover:underline btn-edit">Editar</button>
                <button class="text-red-500 hover:underline ml-2 btn-delete">Excluir</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

/**
 * Popula o filtro de espécies de peixes.
 */
function populateFishFilter(pesqueiros) {
    const fishFilter = document.getElementById('fish-filter');
    const allFish = new Set();
    pesqueiros.forEach(p => {
        if (p.Peixes) {
            const fishes = p.Peixes.split(',').map(fish => fish.trim());
            fishes.forEach(fish => allFish.add(fish));
        }
    });
    while (fishFilter.options.length > 1) {
        fishFilter.remove(1);
    }
    allFish.forEach(fish => {
        if (fish) {
            const option = document.createElement('option');
            option.value = fish;
            option.textContent = fish;
            fishFilter.appendChild(option);
        }
    });
}

/**
 * Aplica os filtros e atualiza a UI.
 */
function applyFilters() {
    const nameFilterValue = document.getElementById('name-filter').value.toLowerCase();
    const timeFilterValue = document.getElementById('time-filter').value;
    const fishFilterValue = document.getElementById('fish-filter').value;
    const priceFilterValue = document.getElementById('price-filter').value;
    const reserveFilterValue = document.getElementById('reserve-filter').value;
    pesqueirosFiltrados = todosOsPesqueiros.filter(p => {
        const nameMatch = nameFilterValue ? p.NomePesqueiro.toLowerCase().includes(nameFilterValue) || p.CidadeUF.toLowerCase().includes(nameFilterValue) : true;
        const timeMatch = timeFilterValue ? parseInt(p.TempoSemTransito) <= parseInt(timeFilterValue) : true;
        const fishMatch = fishFilterValue ? p.Peixes.toLowerCase().includes(fishFilterValue.toLowerCase()) : true;
        const priceMatch = priceFilterValue ? parseFloat(p.PrecoMedio) <= parseFloat(priceFilterValue) : true;
        const reserveMatch = reserveFilterValue ? p.AceitaReserva === reserveFilterValue : true;
        return nameMatch && timeMatch && fishMatch && priceMatch && reserveMatch;
    });
    renderTable(pesqueirosFiltrados);
    addMarkersToMap(pesqueirosFiltrados, showDetailsModal);
}

/**
 * Configura todos os listeners de eventos da página.
 */
function setupEventListeners() {
    document.getElementById('name-filter').addEventListener('input', applyFilters);
    document.getElementById('price-filter').addEventListener('input', applyFilters);
    document.getElementById('reserve-filter').addEventListener('change', applyFilters);
    document.getElementById('time-filter').addEventListener('change', applyFilters);
    document.getElementById('fish-filter').addEventListener('change', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', () => {
        document.getElementById('name-filter').value = '';
        document.getElementById('price-filter').value = '';
        document.getElementById('reserve-filter').value = '';
        document.getElementById('time-filter').value = '';
        document.getElementById('fish-filter').value = '';
        applyFilters();
    });

    document.getElementById('add-pesqueiro-btn').addEventListener('click', () => showFormModal());

    const tableBody = document.getElementById('pesqueiros-table-body');
    tableBody.addEventListener('click', (e) => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row) return;
        const id = row.getAttribute('data-id');
        if (!id) return;
        
        if (target.classList.contains('btn-edit')) {
            e.stopPropagation();
            showFormModal(id);
        } else if (target.classList.contains('btn-delete')) {
            e.stopPropagation();
            const nome = row.cells[1].textContent;
            showConfirmDeleteModal(id, nome);
        } else {
             showDetailsModal(id);
        }
    });

    const formModal = document.getElementById('modal');
    formModal.querySelector('.modal-close-btn').addEventListener('click', hideModal);
    formModal.querySelector('.modal-bg').addEventListener('click', hideModal);
    document.getElementById('pesqueiro-form').addEventListener('submit', handleFormSubmit);

    const confirmModal = document.getElementById('confirm-delete-modal');
    document.getElementById('btn-cancel-delete').addEventListener('click', hideConfirmDeleteModal);
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            hideConfirmDeleteModal();
        }
    });
    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        if (pesqueiroIdToDelete) {
            handleDelete(pesqueiroIdToDelete);
        }
        hideConfirmDeleteModal();
    });

    const addressInput = document.getElementById('EnderecoCompleto');
    addressInput.addEventListener('blur', async (e) => {
        const address = e.target.value;
        if (address.length < 10) return;
        const latInput = document.getElementById('Latitude');
        const lonInput = document.getElementById('Longitude');
        latInput.value = 'Buscando...';
        lonInput.value = 'Buscando...';
        const coords = await geocodeAddress(address);
        if (coords) {
            latInput.value = coords.lat;
            lonInput.value = coords.lon;
        } else {
            latInput.value = '';
            lonInput.value = '';
            alert('Endereço não encontrado. Por favor, verifique ou insira as coordenadas manualmente.');
        }
    });
}

function showLoading(isLoading) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = isLoading ? 'flex' : 'none';
    }
}

function showFormModal(id = null) {
    const modal = document.getElementById('modal');
    const modalTitle = modal.querySelector('#modal-title');
    const form = modal.querySelector('#pesqueiro-form');
    
    form.reset();
    modal.querySelector('#form-content').style.display = 'block';
    modal.querySelector('#details-content').style.display = 'none';

    if (id) {
        modalTitle.textContent = 'Editar Pesqueiro';
        const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);
        if(pesqueiro) {
            for (const key in pesqueiro) {
                if (form.elements[key]) {
                    form.elements[key].value = pesqueiro[key];
                }
            }
        }
    } else {
        modalTitle.textContent = 'Adicionar Novo Pesqueiro';
        form.elements['ID'].value = '';
    }
    modal.classList.remove('hidden');
}

function showDetailsModal(id) {
    const modal = document.getElementById('modal');
    const modalTitle = modal.querySelector('#modal-title');
    const detailsContent = modal.querySelector('#details-content');
    const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);

    if (!pesqueiro) return;

    modal.querySelector('#form-content').style.display = 'none';
    detailsContent.style.display = 'block';
    modalTitle.textContent = pesqueiro.NomePesqueiro;

    const peixesHtml = pesqueiro.Peixes ? pesqueiro.Peixes.split(',').map(p => `<span class="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">${p.trim()}</span>`).join('') : 'Não informado';
    detailsContent.innerHTML = `
        <p class="mb-2"><strong>Endereço:</strong> ${pesqueiro.EnderecoCompleto || 'Não informado'}</p>
        <p class="mb-2"><strong>Cidade/UF:</strong> ${pesqueiro.CidadeUF}</p>
        <p class="mb-2"><strong>Telefone/WhatsApp:</strong> ${pesqueiro.Telefone || 'Não informado'}</p>
        <div class="mb-2"><strong>Peixes Principais:</strong> ${peixesHtml}</div>
        <p class="mb-2"><strong>Preço Médio:</strong> R$ ${pesqueiro.PrecoMedio}</p>
        <p class="mb-2"><strong>Aceita Reserva:</strong> ${pesqueiro.AceitaReserva}</p>
        <p class="mb-2"><strong>Site:</strong> <a href="${pesqueiro.Site}" target="_blank" class="text-blue-500 hover:underline">${pesqueiro.Site || 'Nenhum'}</a></p>
        <p class="mb-2"><strong>Instagram:</strong> <a href="${pesqueiro.Instagram}" target="_blank" class="text-blue-500 hover:underline">${pesqueiro.Instagram || 'Nenhum'}</a></p>
        <div class="mt-6 pt-4 border-t flex items-center gap-4">
            <a href="https://www.google.com/maps?q=${pesqueiro.Latitude},${pesqueiro.Longitude}" target="_blank" class="flex-1 text-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Rota com Google Maps
            </a>
            <a href="https://waze.com/ul?ll=${pesqueiro.Latitude},${pesqueiro.Longitude}&navigate=yes" target="_blank" class="flex-1 text-center bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600">
                Rota com Waze
            </a>
            <button id="edit-in-modal-btn" data-id="${pesqueiro.ID}" class="flex-1 text-center bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
                Editar Pesqueiro
            </button>
        </div>
    `;
    const editBtnInModal = detailsContent.querySelector('#edit-in-modal-btn');
    if (editBtnInModal) {
        editBtnInModal.addEventListener('click', (e) => {
            const pesqueiroId = e.target.getAttribute('data-id');
            hideModal();
            setTimeout(() => {
                showFormModal(pesqueiroId);
            }, 100);
        });
    }
    modal.classList.remove('hidden');
}

function hideModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
}

function showConfirmDeleteModal(id, nome) {
    pesqueiroIdToDelete = id;
    document.getElementById('pesqueiro-to-delete-name').textContent = nome;
    document.getElementById('confirm-delete-modal').classList.remove('hidden');
}

function hideConfirmDeleteModal() {
    pesqueiroIdToDelete = null;
    document.getElementById('confirm-delete-modal').classList.add('hidden');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    showLoading(true);
    const form = e.target;
    const formData = new FormData(form);
    const pesqueiroData = Object.fromEntries(formData.entries());
    let response;
    if (pesqueiroData.ID) {
        response = await updatePesqueiro(pesqueiroData);
    } else {
        response = await createPesqueiro(pesqueiroData);
    }
    alert(response.message);
    if (response.status === 'success') {
        hideModal();
        await initUI();
    } else {
       showLoading(false);
    }
}

async function handleDelete(id) {
    showLoading(true);
    const response = await deletePesqueiro(id);
    alert(response.message);
    if (response.status === 'success') {
        await initUI();
    } else {
        showLoading(false);
    }
}

async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Falha na resposta da rede');
        }
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: data[0].lat,
                lon: data[0].lon
            };
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar coordenadas:", error);
        return null;
    }
}

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', initUI);