// ===================================================================
//              VARIÁVEIS GLOBAIS
// ===================================================================
let pesqueiroCurrentPage = 1;
const pesqueiroRowsPerPage = 10;
let pesqueiroSortColumn = 'Distancia';
let pesqueiroSortDirection = 'asc';
let todosOsPesqueiros = [];
let pesqueirosFiltrados = [];
let pesqueiroIdToDelete = null;

let wishlistCurrentPage = 1;
const wishlistRowsPerPage = 10;
let todosOsWishlistItems = [];
let wishlistFiltrada = [];
let wishlistItemIdToDelete = null;


// ===================================================================
//              FUNÇÕES GERAIS DE UI E INICIALIZAÇÃO
// ===================================================================

function showLoading() { document.getElementById('loader').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loader').classList.add('hidden'); }

async function initUI() {
    showLoading();
    try {
        const [pesqueiros, visitas, wishlistItems] = await Promise.all([
            getPesqueiros(),
            getAllVisitas(),
            getAllWishlistItems()
        ]);
        
        todosOsPesqueiros = pesqueiros;
        pesqueirosFiltrados = [...todosOsPesqueiros];
        todosOsWishlistItems = wishlistItems;
        applyAndSortWishlist();
        setupEventListeners();
        
        sortAndRerenderPesqueiros();
        populateFishFilter(todosOsPesqueiros);
        addMarkersToMap(pesqueirosFiltrados, (id, nome) => showDetailsModal(id, nome));
        displayWishlistPage(1);
        renderTimeline(visitas);
        initYearCalendar(visitas);
        
        hideLoading();
    } catch (error) {
        console.error("ERRO FATAL NA INICIALIZAÇÃO DA UI:", error);
        alert("Ocorreu um erro grave ao carregar a aplicação.");
        hideLoading();
    }
}

// ===================================================================
//              EVENT LISTENERS (FUNÇÃO ÚNICA E COMPLETA)
// ===================================================================

function setupEventListeners() {
    setupTimeFilter();

// Adicione isto dentro de setupEventListeners()
document.getElementById('wishlist-name-filter')?.addEventListener('input', applyAndSortWishlist);
document.getElementById('wishlist-status-filter')?.addEventListener('change', applyAndSortWishlist);
document.getElementById('wishlist-reset-filters')?.addEventListener('click', () => {
    document.getElementById('wishlist-name-filter').value = '';
    document.getElementById('wishlist-status-filter').value = '';
    applyAndSortWishlist();
});

    // Listeners da Wishlist
    document.getElementById('add-wishlist-item-btn')?.addEventListener('click', () => showWishlistFormModal());
    document.getElementById('wishlist-table-body')?.addEventListener('click', e => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row || !row.dataset.id) return;
        const id = row.dataset.id;
        const item = todosOsWishlistItems.find(i => i.ID == id);
        if (!item) return;
        if (target.classList.contains('btn-edit-wishlist')) {
            showWishlistFormModal(item);
        } else if (target.classList.contains('btn-delete-wishlist')) {
            showWishlistDeleteConfirmModal(id, item.NomeItem);
        } else if (target.closest('.item-row')) {
            showWishlistDetailsModal(item);
        }
    });
    document.getElementById('wishlist-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const result = data.ID ? await updateWishlistItem(data) : await createWishlistItem(data);
        hideLoading();
        document.getElementById('wishlist-form-modal')?.classList.add('hidden');
      if (result.status === 'success') { alert('Item da wishlist salvo!'); refreshWishlist(); } // ALTERADO AQUI
    else { alert('Erro ao salvar item.'); }
});
    document.getElementById('btn-confirm-delete-wishlist')?.addEventListener('click', async () => {
        showLoading();
        const result = await deleteWishlistItem(wishlistItemIdToDelete);
        hideLoading();
        document.getElementById('confirm-delete-wishlist-modal')?.classList.add('hidden');
    if (result.status === 'success') { alert('Item excluído da wishlist!'); refreshWishlist(); } // ALTERADO AQUI
    else { alert('Erro ao excluir item.'); }
});
    document.querySelectorAll('#wishlist-details-modal .modal-close-btn, #wishlist-details-modal .modal-bg').forEach(el => el.addEventListener('click', () => document.getElementById('wishlist-details-modal').classList.add('hidden')));
    document.querySelectorAll('#wishlist-form-modal .modal-close-btn, #wishlist-form-modal .modal-bg').forEach(el => el.addEventListener('click', () => document.getElementById('wishlist-form-modal').classList.add('hidden')));
    document.getElementById('btn-cancel-delete-wishlist')?.addEventListener('click', () => document.getElementById('confirm-delete-wishlist-modal').classList.add('hidden'));

    // Listeners de Pesqueiros e Filtros
    document.getElementById('add-pesqueiro-btn')?.addEventListener('click', () => showFormModal());
    document.getElementById('btn-shortcut-add-visita')?.addEventListener('click', () => {
        const tableSection = document.getElementById('table-section');
        if (tableSection) {
            tableSection.scrollIntoView({ behavior: 'smooth' });
            tableSection.style.transition = 'background-color 0.3s';
            tableSection.style.backgroundColor = '#4a5568';
            setTimeout(() => { tableSection.style.backgroundColor = ''; }, 1500);
        }
    });
    ['name-filter', 'price-filter'].forEach(id => document.getElementById(id)?.addEventListener('input', applyFilters));
    ['reserve-filter', 'fish-filter'].forEach(id => document.getElementById(id)?.addEventListener('change', applyFilters));
    document.getElementById('reset-filters')?.addEventListener('click', () => {
        ['name-filter', 'price-filter', 'reserve-filter', 'fish-filter'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        document.querySelectorAll('#time-filter-options .time-checkbox').forEach(cb => cb.checked = false);
        const btnText = document.getElementById('time-filter-text');
        if(btnText) btnText.textContent = 'Todos';
        applyFilters();
    });
    document.querySelector('#table-section thead')?.addEventListener('click', (e) => {
        const header = e.target.closest('.sortable-header');
        if (!header) return;
        const newSortColumn = header.dataset.sortBy;
        if (pesqueiroSortColumn === newSortColumn) {
            pesqueiroSortDirection = pesqueiroSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            pesqueiroSortColumn = newSortColumn;
            pesqueiroSortDirection = 'asc';
        }
        sortAndRerenderPesqueiros();
    });
    document.getElementById('pesqueiros-table-body')?.addEventListener('click', e => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row || !row.dataset.id) return;
        const id = row.dataset.id;
        const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);
        if (!pesqueiro) return;
        if (target.classList.contains('btn-edit')) {
            showFormModal(id);
        } else if (target.classList.contains('btn-delete')) {
            showConfirmDeleteModal(id, pesqueiro.NomePesqueiro);
        } else {
            showDetailsModal(id, pesqueiro.NomePesqueiro);
        }
    });
    document.querySelectorAll('#modal .modal-close-btn, #modal .modal-bg').forEach(el => el.addEventListener('click', () => document.getElementById('modal').classList.add('hidden')));
    document.getElementById('btn-cancel-delete')?.addEventListener('click', () => document.getElementById('confirm-delete-modal').classList.add('hidden'));
    document.getElementById('btn-confirm-delete')?.addEventListener('click', async () => {
        showLoading();
        const result = await deletePesqueiro(pesqueiroIdToDelete);
        hideLoading();
        document.getElementById('confirm-delete-modal').classList.add('hidden');
        if (result.status === 'success') { alert('Pesqueiro excluído!'); initUI(); } 
        else { alert('Erro ao excluir pesqueiro.'); }
    });
    document.getElementById('pesqueiro-form')?.addEventListener('submit', async (e) => {
        e.preventDefault(); showLoading();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const result = data.ID ? await updatePesqueiro(data) : await createPesqueiro(data);
        hideLoading();
        document.getElementById('modal').classList.add('hidden');
        if (result.status === 'success') { alert('Pesqueiro salvo!'); initUI(); } 
        else { alert('Erro ao salvar pesqueiro.'); }
    });
    document.getElementById('visita-form')?.addEventListener('submit', async (e) => {
        e.preventDefault(); showLoading();
        const data = Object.fromEntries(new FormData(e.target).entries());
        data.PesqueiroID = document.getElementById('visita-pesqueiro-id')?.value;
        if (!data.PesqueiroID) { alert("Erro: ID do pesqueiro não encontrado."); hideLoading(); return; }
        const result = await createVisita(data);
        hideLoading();
        document.getElementById('modal').classList.add('hidden');
        if (result.status === 'success') { alert('Visita registrada!'); initUI(); } 
        else { alert('Erro ao registrar visita.'); }
    });
}

// ===================================================================
//              FUNÇÕES DE FILTRAGEM E ORDENAÇÃO
// ===================================================================

function applyAndSortWishlist() {
    // Pega os valores atuais dos filtros
    const nameFilterValue = document.getElementById('wishlist-name-filter')?.value?.toLowerCase() || '';
    const statusFilterValue = document.getElementById('wishlist-status-filter')?.value || '';

    // 1. Aplica os filtros
    let items = todosOsWishlistItems.filter(item => {
        const nameMatch = nameFilterValue ? item.NomeItem?.toLowerCase().includes(nameFilterValue) : true;
        const statusMatch = statusFilterValue ? item.Status === statusFilterValue : true;
        return nameMatch && statusMatch;
    });

    // 2. Aplica a ordenação customizada
    const statusOrder = {
        'Pesquisando': 1,
        'Planejando comprar': 2,
        'Vendido/Trocado': 98,
        'Já comprei': 99
    };

    items.sort((a, b) => {
        const orderA = statusOrder[a.Status] || 50; // Itens sem status definido ficam no meio
        const orderB = statusOrder[b.Status] || 50;
        return orderA - orderB;
    });

    // 3. Atualiza a nossa variável global com os dados prontos para exibição
    wishlistFiltrada = items;
    
    // 4. Renderiza a tabela novamente, começando da primeira página
    displayWishlistPage(1);
}


function setupTimeFilter() {
    const optionsContainer = document.getElementById('time-filter-options');
    const btn = document.getElementById('time-filter-btn');
    const btnText = document.getElementById('time-filter-text');
    if (!optionsContainer || !btn || !btnText) return;
    const timeRanges = [ { label: 'Até 30 min', value: '0-30' }, { label: '31 - 60 min', value: '31-60' }, { label: '61 - 90 min', value: '61-90' }, { label: 'Acima de 90 min', value: '91-Infinity' } ];
    optionsContainer.innerHTML = '';
    timeRanges.forEach(range => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'time-filter-option';
        optionDiv.innerHTML = `<label class="flex items-center"><input type="checkbox" class="time-checkbox mr-2"><span class="text-gray-200">${range.label}</span></label>`;
        optionsContainer.appendChild(optionDiv);
    });
    btn.addEventListener('click', (e) => { e.stopPropagation(); optionsContainer.classList.toggle('hidden'); });
    optionsContainer.addEventListener('change', () => {
        const selectedLabels = Array.from(optionsContainer.querySelectorAll('.time-checkbox:checked')).map(cb => cb.closest('label').querySelector('span').textContent);
        if (selectedLabels.length === 0) { btnText.textContent = 'Todos'; }
        else if (selectedLabels.length > 2) { btnText.textContent = `${selectedLabels.length} selecionados`; }
        else { btnText.textContent = selectedLabels.join(', '); }
        applyFilters();
    });
    document.addEventListener('click', (e) => {
        if (btn && !btn.contains(e.target) && optionsContainer && !optionsContainer.contains(e.target)) {
            optionsContainer.classList.add('hidden');
        }
    });
}

function applyFilters() {
    const nameFilterValue = document.getElementById('name-filter')?.value?.toLowerCase() || '';
    const selectedTimeRanges = Array.from(document.querySelectorAll('#time-filter-options .time-checkbox:checked')).map(cb => {
        const [min, max] = cb.value.split('-').map(Number);
        return { min, max };
    });
    const fishFilterValue = document.getElementById('fish-filter')?.value?.toLowerCase() || '';
    const priceFilterValue = document.getElementById('price-filter')?.value || '';
    const reserveFilterValue = document.getElementById('reserve-filter')?.value || '';
    pesqueirosFiltrados = todosOsPesqueiros.filter(p => {
        const nameMatch = nameFilterValue ? (p.NomePesqueiro?.toLowerCase().includes(nameFilterValue) || p.CidadeUF?.toLowerCase().includes(nameFilterValue)) : true;
        const timeMatch = selectedTimeRanges.length === 0 ? true : selectedTimeRanges.some(range => {
            const pesqueiroTime = parseFloat(p.TempoSemTransito);
            return pesqueiroTime >= range.min && pesqueiroTime <= range.max;
        });
        const fishMatch = fishFilterValue ? (p.Peixes?.toLowerCase().includes(fishFilterValue)) : true;
        const priceMatch = priceFilterValue ? (parseFloat(p.PrecoMedio) <= parseFloat(priceFilterValue)) : true;
        const reserveMatch = reserveFilterValue ? (p.AceitaReserva === reserveFilterValue) : true;
        return nameMatch && timeMatch && fishMatch && priceMatch && reserveMatch;
    });
    sortAndRerenderPesqueiros();
}

function populateFishFilter(pesqueiros) {
    const fishFilter = document.getElementById('fish-filter');
    if (!fishFilter) return;
    const allFish = new Set();
    pesqueiros.forEach(p => {
        if (p.Peixes) {
            p.Peixes.split(',').forEach(fish => {
                const trimmedFish = fish.trim();
                if (trimmedFish) { allFish.add(trimmedFish); }
            });
        }
    });
    const sortedFish = Array.from(allFish).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    while (fishFilter.options.length > 1) { fishFilter.remove(1); }
    sortedFish.forEach(fish => {
        const option = new Option(fish, fish);
        fishFilter.add(option);
    });
}

function sortAndRerenderPesqueiros() {
    pesqueirosFiltrados.sort((a, b) => {
        let valA = a[pesqueiroSortColumn];
        let valB = b[pesqueiroSortColumn];
        if (valA == null) valA = pesqueiroSortDirection === 'asc' ? Infinity : -Infinity;
        if (valB == null) valB = pesqueiroSortDirection === 'asc' ? Infinity : -Infinity;
        const numericColumns = ['TempoSemTransito', 'Distancia', 'PrecoMedio'];
        if (numericColumns.includes(pesqueiroSortColumn)) {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        }
        if (valA > valB) return pesqueiroSortDirection === 'asc' ? 1 : -1;
        if (valA < valB) return pesqueiroSortDirection === 'asc' ? -1 : 1;
        return 0;
    });
    document.querySelectorAll('.sortable-header span').forEach(span => span.textContent = '');
    const activeHeader = document.querySelector(`.sortable-header[data-sort-by="${pesqueiroSortColumn}"] span`);
    if (activeHeader) activeHeader.textContent = pesqueiroSortDirection === 'asc' ? ' ▲' : ' ▼';
    displayPesqueiroPage(1);
}

// ===================================================================
//              FUNÇÕES DE RENDERIZAÇÃO E MODAIS
// ===================================================================

function displayWishlistPage(page) {
    wishlistCurrentPage = page;
    renderWishlistTable();
    renderWishlistPagination();
}

function renderWishlistTable() {
    const tableBody = document.getElementById('wishlist-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const startIndex = (wishlistCurrentPage - 1) * wishlistRowsPerPage;
    const endIndex = startIndex + wishlistRowsPerPage;
   const paginatedItems = wishlistFiltrada.slice(startIndex, endIndex);
    if (paginatedItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-gray-400">Nenhum item na sua wishlist.</td></tr>';
        return;
    }
    paginatedItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-700 cursor-pointer item-row';
        tr.setAttribute('data-id', item.ID);
        tr.innerHTML = `<td class="p-2 border-t border-gray-700">${item.NomeItem||'N/A'}</td><td class="p-2 border-t border-gray-700">R$ ${item.PrecoEstimado?parseFloat(item.PrecoEstimado).toFixed(2):'N/A'}</td><td class="p-2 border-t border-gray-700">${item.Status||'N/A'}</td><td class="p-2 border-t border-gray-700 text-right"><div class="flex gap-2 justify-end"><button class="btn-edit-wishlist text-xs bg-sky-700 hover:bg-sky-600 text-white font-bold py-1 px-2 rounded">Editar</button><button class="btn-delete-wishlist text-xs bg-rose-700 hover:bg-rose-600 text-white font-bold py-1 px-2 rounded">Excluir</button></div></td>`;
        tableBody.appendChild(tr);
    });
}

function renderWishlistPagination() {
    const paginationControls = document.getElementById('wishlist-pagination-controls');
    if (!paginationControls) return;
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(wishlistFiltrada.length / wishlistRowsPerPage);
    if (totalPages <= 1) return;
    const createButton = (text, page, isDisabled = false, isCurrent = false) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `pagination-btn px-3 py-1 rounded-md text-sm ${isCurrent?'bg-teal-600 text-white':'bg-gray-600 text-gray-200 hover:bg-gray-500'} ${isDisabled?'opacity-50 cursor-not-allowed':''}`;
        button.disabled = isDisabled;
        button.addEventListener('click', () => displayWishlistPage(page));
        return button;
    };
    paginationControls.appendChild(createButton('Anterior', wishlistCurrentPage - 1, wishlistCurrentPage === 1));
    for (let i = 1; i <= totalPages; i++) {
        paginationControls.appendChild(createButton(i, i, false, i === wishlistCurrentPage));
    }
    paginationControls.appendChild(createButton('Próximo', wishlistCurrentPage + 1, wishlistCurrentPage === totalPages));
}

function showWishlistDetailsModal(item) {
    const modal = document.getElementById('wishlist-details-modal');
    const title = document.getElementById('wishlist-details-title');
    const content = document.getElementById('wishlist-details-content');
    if (!modal || !title || !content) return;

    title.textContent = item.NomeItem;
    content.innerHTML = `
        <div class="space-y-2 text-sm">
            <p><strong>Categoria:</strong> ${item.Categoria || 'N/A'}</p>
            <p><strong>Tipo de Pesca:</strong> ${item.TipoPesca || 'N/A'}</p>
            <p><strong>Marca/Modelo:</strong> ${item.MarcaModelo || 'N/A'}</p>
            <p><strong>Preço Estimado:</strong> R$ ${item.PrecoEstimado ? parseFloat(item.PrecoEstimado).toFixed(2) : 'N/A'}</p>
            <p><strong>Link:</strong> ${item.LinkCompra ? `<a href="${item.LinkCompra}" target="_blank" class="text-teal-400 hover:underline">Abrir Link</a>` : 'N/A'}</p>
            <p><strong>Prioridade:</strong> ${item.Prioridade || 'N/A'}</p>
            <p><strong>Status:</strong> ${item.Status || 'N/A'}</p>
            
            <p class="mt-4"><strong>Especificações:</strong></p>
            <p class="whitespace-pre-wrap bg-gray-700 p-2 rounded border border-gray-600">${item.Especificacoes || 'Nenhuma.'}</p>
            
            <p class="mt-4"><strong>Notas Pessoais:</strong></p>
            <p class="whitespace-pre-wrap bg-gray-700 p-2 rounded border border-gray-600">${item.NotasPessoais || 'Nenhuma.'}</p>
        </div>
    `;
    modal.classList.remove('hidden');
}

function showWishlistFormModal(itemData = null) {
    const modal = document.getElementById('wishlist-form-modal');
    const title = document.getElementById('wishlist-form-title');
    const form = document.getElementById('wishlist-form');
    if (!modal || !title || !form) return;
    form.reset();
    document.getElementById('wishlist-item-id').value = '';
    if (itemData) {
        title.textContent = 'Editar Item da Wishlist';
        for (const key in itemData) {
            if (form.elements[key]) {
                form.elements[key].value = itemData[key];
            }
        }
    } else {
        title.textContent = 'Adicionar Novo Item';
    }
    modal.classList.remove('hidden');
}

function showWishlistDeleteConfirmModal(id, nome) {
    wishlistItemIdToDelete = id;
    const modal = document.getElementById('confirm-delete-wishlist-modal');
    const nameEl = document.getElementById('item-to-delete-name');
    if (modal && nameEl) {
        nameEl.textContent = nome;
        modal.classList.remove('hidden');
    }
}

function displayPesqueiroPage(page) {
    pesqueiroCurrentPage = page;
    renderPesqueiroTable();
    renderPesqueiroPagination();
}

function renderPesqueiroTable() {
    const tableBody = document.getElementById('pesqueiros-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const startIndex = (pesqueiroCurrentPage - 1) * pesqueiroRowsPerPage;
    const endIndex = startIndex + pesqueiroRowsPerPage;
    const paginatedItems = pesqueirosFiltrados.slice(startIndex, endIndex);
    if (paginatedItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-4">Nenhum pesqueiro encontrado.</td></tr>';
        return;
    }
    paginatedItems.forEach((p, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-700 cursor-pointer';
        tr.setAttribute('data-id', p.ID);
        tr.innerHTML = `<td class="p-1.5 border-t border-gray-700 text-center font-medium">${startIndex+1+index}</td><td class="p-1.5 border-t border-gray-700">${p.NomePesqueiro}</td><td class="p-1.5 border-t border-gray-700">${p.CidadeUF}</td><td class="p-1.5 border-t border-gray-700">${p.TempoSemTransito||'N/A'} min</td><td class="p-1.5 border-t border-gray-700">${p.Distancia||'N/A'} km</td><td class="p-1.5 border-t border-gray-700">R$ ${p.PrecoMedio||'N/A'}</td><td class="p-1.5 border-t border-gray-700">${p.AceitaReserva||'N/A'}</td><td class="p-1.5 border-t border-gray-700 text-right"><div class="flex gap-2 justify-end"><button class="btn-edit text-xs bg-sky-700 hover:bg-sky-600 text-white font-bold py-1 px-2 rounded">Editar</button><button class="btn-delete text-xs bg-rose-700 hover:bg-rose-600 text-white font-bold py-1 px-2 rounded">Excluir</button></div></td>`;
        tableBody.appendChild(tr);
    });
}

function renderPesqueiroPagination() {
    const paginationControls = document.getElementById('pagination-controls');
    if (!paginationControls) return;
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(pesqueirosFiltrados.length / pesqueiroRowsPerPage);
    if (totalPages <= 1) return;
    const createButton = (text, page, isDisabled = false, isCurrent = false) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `pagination-btn px-3 py-1 rounded-md text-sm ${isCurrent?'bg-teal-600 text-white':'bg-gray-600 text-gray-200 hover:bg-gray-500'} ${isDisabled?'opacity-50 cursor-not-allowed':''}`;
        button.disabled = isDisabled;
        button.addEventListener('click', () => displayPesqueiroPage(page));
        return button;
    };
    paginationControls.appendChild(createButton('Anterior', pesqueiroCurrentPage - 1, pesqueiroCurrentPage === 1));
    for (let i = 1; i <= totalPages; i++) {
        paginationControls.appendChild(createButton(i, i, false, i === pesqueiroCurrentPage));
    }
    paginationControls.appendChild(createButton('Próximo', pesqueiroCurrentPage + 1, pesqueiroCurrentPage === totalPages));
}

function showFormModal(id = null) {
    const modal = document.getElementById('modal');
    const formContent = document.getElementById('form-content');
    const detailsContent = document.getElementById('details-content');
    const modalTitle = document.getElementById('modal-title');
    const pesqueiroForm = document.getElementById('pesqueiro-form');
    if (!modal || !formContent || !detailsContent || !modalTitle || !pesqueiroForm) return;
    pesqueiroForm.reset();
    document.getElementById('ID').value = '';
    detailsContent.classList.add('hidden');
    formContent.classList.remove('hidden');
    if (id) {
        modalTitle.textContent = 'Editar Pesqueiro';
        const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);
        if (pesqueiro) {
            for (const key in pesqueiro) {
                if (pesqueiroForm.elements[key]) {
                    pesqueiroForm.elements[key].value = pesqueiro[key];
                }
            }
        }
    } else {
        modalTitle.textContent = 'Adicionar Novo Pesqueiro';
    }
    modal.classList.remove('hidden');
}

async function showDetailsModal(id, nomePesqueiro) {
    const modal = document.getElementById('modal');
    const formContent = document.getElementById('form-content');
    const detailsContent = document.getElementById('details-content');
    const modalTitle = document.getElementById('modal-title');
    const pesqueiroDetailsContainer = document.getElementById('pesqueiro-details-container');
    const visitasList = document.getElementById('visitas-list');
    const historicoEmptyState = document.getElementById('historico-empty-state');
    const visitaPesqueiroIdInput = document.getElementById('visita-pesqueiro-id');
    const tabHistorico = document.getElementById('tab-historico');
    if (!modal || !formContent || !detailsContent || !modalTitle || !pesqueiroDetailsContainer || !visitasList || !historicoEmptyState || !visitaPesqueiroIdInput || !tabHistorico) return;
    formContent.classList.add('hidden');
    detailsContent.classList.remove('hidden');
    modalTitle.textContent = `Detalhes de ${nomePesqueiro}`;
    const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);
    if (pesqueiro) {
        pesqueiroDetailsContainer.innerHTML = `<h3 class="text-xl font-bold mb-2">${pesqueiro.NomePesqueiro||'N/A'}</h3><p><strong>Cidade/UF:</strong> ${pesqueiro.CidadeUF||'N/A'}</p><p><strong>Endereço:</strong> ${pesqueiro.EnderecoCompleto||'N/A'}</p><p><strong>Peixes:</strong> ${pesqueiro.Peixes||'N/A'}</p><p><strong>Telefone:</strong> ${pesqueiro.Telefone||'N/A'}</p>`;
    } else {
        pesqueiroDetailsContainer.innerHTML = '<p class="text-red-500">Detalhes não encontrados.</p>';
    }
    visitasList.innerHTML = '<p class="text-gray-400">Carregando histórico...</p>';
    historicoEmptyState.classList.add('hidden');
    const visitas = await getVisitas(id);
    visitasList.innerHTML = '';
    if (visitas && visitas.length > 0) {
        visitas.forEach(visita => {
            const visitaDiv = document.createElement('div');
            visitaDiv.className = 'bg-gray-700 p-3 rounded-lg border border-gray-600';
            visitaDiv.innerHTML = `<p class="font-semibold">Data: ${new Date(visita.DataVisita).toLocaleDateString('pt-BR')}</p><p>Peixes: ${visita.PeixesCapturados||'N/A'}</p><p>Obs: ${visita.Observacoes||'Nenhuma.'}</p>`;
            visitasList.appendChild(visitaDiv);
        });
    } else {
        historicoEmptyState.classList.remove('hidden');
    }
    visitaPesqueiroIdInput.value = id;
    tabHistorico.click();
    modal.classList.remove('hidden');
}

function showConfirmDeleteModal(id, nome) {
    pesqueiroIdToDelete = id;
    const pesqueiroToDeleteNameEl = document.getElementById('pesqueiro-to-delete-name');
    const confirmDeleteModalEl = document.getElementById('confirm-delete-modal');
    if (pesqueiroToDeleteNameEl && confirmDeleteModalEl) {
        pesqueiroToDeleteNameEl.textContent = nome;
        confirmDeleteModalEl.classList.remove('hidden');
    }
}

function renderTimeline(visitas) {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;
    timelineContainer.innerHTML = '';
    if (!visitas || visitas.length === 0) {
        timelineContainer.innerHTML = '<p class="text-gray-400 p-4 text-center">Nenhuma visita recente.</p>';
        return;
    }
    visitas.sort((a, b) => new Date(b.DataVisita) - new Date(a.DataVisita));
    const visitasRecentes = visitas.slice(0, 5);
    visitasRecentes.forEach(visita => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'timeline-item';
        itemDiv.innerHTML = `<div><p class="text-gray-400 text-xs">${new Date(visita.DataVisita).toLocaleDateString('pt-BR')}</p><h4 class="font-semibold">${visita.PesqueiroNome||'N/A'}</h4><p class="text-xs">${visita.Observacoes||'Sem observações.'}</p></div>`;
        timelineContainer.appendChild(itemDiv);
    });
}