// Variáveis globais
let todosOsPesqueiros = [];
let pesqueirosFiltrados = [];
let pesqueiroIdToDelete = null; // Guarda o ID do pesqueiro a ser excluído

/**
 * Função principal que inicializa a UI.
 */
async function initUI() {
    showLoading(true);
    todosOsPesqueiros = await getPesqueiros();
    pesqueirosFiltrados = [...todosOsPesqueiros];
    renderTable(pesqueirosFiltrados);
    addMarkersToMap(pesqueirosFiltrados, showVisitasModal); // Alterado para abrir o modal de visitas
    populateFishFilter(todosOsPesqueiros);
    setupEventListeners();
    showLoading(false);
}

/**
 * Renderiza a tabela de pesqueiros com botões de ação estilizados.
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
            <td class="p-1.5 border-t text-center font-medium">${index + 1}</td>
            <td class="p-1.5 border-t">${p.NomePesqueiro}</td>
            <td class="p-1.5 border-t">${p.CidadeUF}</td>
            <td class="p-1.5 border-t">${p.TempoSemTransito} min</td>
            <td class="p-1.5 border-t">${p.Distancia} km</td>
            <td class="p-1.5 border-t">${p.PrecoMedio}</td>
            <td class="p-1.5 border-t">${p.AceitaReserva}</td>
            <td class="p-1.5 border-t">
                <div class="flex gap-2">
                    <button class="btn-edit text-xs bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">Editar</button>
                    <button class="btn-delete text-xs bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">Excluir</button>
                </div>
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
    addMarkersToMap(pesqueirosFiltrados, showVisitasModal);
}

/**
 * Configura todos os listeners de eventos da página.
 */
function setupEventListeners() {
    // Listeners dos Filtros
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

    // Botão Adicionar Pesqueiro
    document.getElementById('add-pesqueiro-btn').addEventListener('click', () => showFormModal());

    // Listener de cliques na tabela
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
             const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);
             if(pesqueiro) showVisitasModal(id, pesqueiro.NomePesqueiro);
        }
    });

    // Listeners do modal de formulário
    const formModal = document.getElementById('modal');
    formModal.querySelector('.modal-close-btn').addEventListener('click', hideModal);
    formModal.querySelector('.modal-bg').addEventListener('click', hideModal);
    document.getElementById('pesqueiro-form').addEventListener('submit', handleFormSubmit);

    // Listeners do modal de confirmação de exclusão
    const confirmModal = document.getElementById('confirm-delete-modal');
    document.getElementById('btn-cancel-delete').addEventListener('click', hideConfirmDeleteModal);
    confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) hideConfirmDeleteModal(); });
    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        if (pesqueiroIdToDelete) handleDelete(pesqueiroIdToDelete);
    });

    // Listeners do modal de visitas
    const visitasModal = document.getElementById('visitas-modal');
    visitasModal.querySelectorAll('.visitas-modal-close-btn').forEach(btn => btn.addEventListener('click', hideVisitasModal));
    visitasModal.querySelector('.modal-bg').addEventListener('click', hideVisitasModal);

    // Navegação por Abas no modal de visitas
    const tabHistorico = document.getElementById('tab-historico');
    const tabRegistrar = document.getElementById('tab-registrar');
    const contentHistorico = document.getElementById('content-historico');
    const contentRegistrar = document.getElementById('content-registrar');
    
    tabHistorico.addEventListener('click', e => {
        e.preventDefault();
        tabHistorico.classList.add('border-blue-500', 'text-blue-600');
        tabHistorico.classList.remove('border-transparent', 'text-gray-500');
        tabRegistrar.classList.add('border-transparent', 'text-gray-500');
        tabRegistrar.classList.remove('border-blue-500', 'text-blue-600');
        contentHistorico.classList.remove('hidden');
        contentRegistrar.classList.add('hidden');
    });

    tabRegistrar.addEventListener('click', e => {
        e.preventDefault();
        tabRegistrar.classList.add('border-blue-500', 'text-blue-600');
        tabRegistrar.classList.remove('border-transparent', 'text-gray-500');
        tabHistorico.classList.add('border-transparent', 'text-gray-500');
        tabHistorico.classList.remove('border-blue-500', 'text-blue-600');
        contentRegistrar.classList.remove('hidden');
        contentHistorico.classList.add('hidden');
    });

    // Submit do formulário de visita
    document.getElementById('visita-form').addEventListener('submit', handleVisitaFormSubmit);
    
    // Listener de geocoding
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
            alert('Endereço não encontrado.');
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

//