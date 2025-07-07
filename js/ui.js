// Variáveis globais para armazenar todos os pesqueiros e os filtrados
let todosOsPesqueiros = [];
let pesqueirosFiltrados = [];

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
    showLoading(false);
    setupEventListeners();
}

/**
 * Renderiza a tabela de pesqueiros com numeração.
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
                <button class="text-blue-500 hover:underline btn-edit" data-id="${p.ID}">Editar</button>
                <button class="text-red-500 hover:underline ml-2 btn-delete" data-id="${p.ID}">Excluir</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}


/**
 * Popula o filtro de espécies de peixes dinamicamente.
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
 * Aplica os filtros com base na seleção do usuário e atualiza a UI.
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
        const id = target.closest('tr').getAttribute('data-id');
        if (!id) return;
        
        if (target.classList.contains('btn-edit')) {
            e.stopPropagation();
            showFormModal(id);
        } else if (target.classList.contains('btn-delete')) {
            e.stopPropagation();
            if (confirm('Tem certeza que deseja excluir este pesqueiro?')) {
                handleDelete(id);
            }
        } else {
             showDetailsModal(id);
        }
    });

    document.querySelector('.modal-close-btn').addEventListener('click', hideModal);
    document.querySelector('.modal-bg').addEventListener('click', hideModal);
    document.getElementById('pesqueiro-form').addEventListener('submit', handleFormSubmit);
}

/**
 * Exibe ou esconde o spinner de carregamento.
 */
function showLoading(isLoading) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = isLoading ? 'flex' : 'none';
    }
}

/**
 * Exibe o modal com o formulário para adicionar ou editar um pesqueiro.
 */
function showFormModal(id = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('pesqueiro-form');
    
    form.reset();
    document.getElementById('form-content').style.display = 'block';
    document.getElementById('details-content').style.display = 'none';

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

/**
* Exibe o modal com os detalhes completos de um pesqueiro.
*/
function showDetailsModal(id) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const detailsContent = document.getElementById('details-content');
    const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);

    if (!pesqueiro) return;

    document.getElementById('form-content').style.display = 'none';
    detailsContent.style.display = 'block';
    modalTitle.textContent = pesqueiro.NomePesqueiro;

    const peixesHtml = pesqueiro.Peixes ? pesqueiro.Peixes.split(',').map(p => `<span class="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">${p.trim()}</span>`).join('') : 'Não informado';

    // --- CONTEÚDO HTML ATUALIZADO COM OS NOVOS BOTÕES ---
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
            <a href="https://www.google.com/maps/dir/?api=1&destination=$${pesqueiro.Latitude},${pesqueiro.Longitude}" target="_blank" class="flex-1 text-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
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

    // --- LÓGICA PARA FAZER O NOVO BOTÃO 'EDITAR' FUNCIONAR ---
    const editBtnInModal = detailsContent.querySelector('#edit-in-modal-btn');
    if (editBtnInModal) {
        editBtnInModal.addEventListener('click', (e) => {
            const pesqueiroId = e.target.getAttribute('data-id');
            hideModal(); // Fecha o modal de detalhes
            setTimeout(() => { // Adiciona um pequeno delay para evitar conflitos de UI
                showFormModal(pesqueiroId); // Abre o modal de edição
            }, 100);
        });
    }

    modal.classList.remove('hidden');
}


/**
 * Esconde o modal principal.
 */
function hideModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
}

/**
 * Lida com o envio do formulário (criação ou atualização).
 */
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

/**
 * Lida com a exclusão de um pesqueiro.
 */
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

// Inicia a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initUI);