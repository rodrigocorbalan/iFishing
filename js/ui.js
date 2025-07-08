// Variáveis globais para paginação e ordenação
let currentPage = 1;
const rowsPerPage = 10;
let sortColumn = 'Distancia'; // Coluna de ordenação padrão
let sortDirection = 'asc';    // Direção padrão (ascendente)

let todosOsPesqueiros = [];
let pesqueirosFiltrados = [];
let pesqueiroIdToDelete = null;

// Função principal que inicializa a UI
async function initUI() {
    showLoading(true);
    try {
        const [pesqueiros, visitas] = await Promise.all([getPesqueiros(), getAllVisitas()]);
        todosOsPesqueiros = pesqueiros;
        pesqueirosFiltrados = [...todosOsPesqueiros];
        
        sortAndRerender(); // Ordena e exibe a primeira página
        
        populateFishFilter(todosOsPesqueiros);
        renderTimeline(visitas);
        setupEventListeners();
    } catch (error) {
        console.error("Falha fatal na inicialização da UI:", error);
        alert("Ocorreu um erro grave ao carregar a aplicação. Verifique o console (F12).");
    } finally {
        showLoading(false);
    }
}

// Exibe uma página específica da tabela e atualiza os controles de paginação
function displayPage(page) {
    currentPage = page;
    renderTable();
    renderPagination();
}

// Renderiza a tabela usando uma "fatia" dos dados baseada na página atual
function renderTable() {
    const tableBody = document.getElementById('pesqueiros-table-body');
    tableBody.innerHTML = '';

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedItems = pesqueirosFiltrados.slice(startIndex, endIndex);

    if (paginatedItems.length === 0 && currentPage === 1) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-4">Nenhum pesqueiro encontrado.</td></tr>';
        return;
    }
    
    paginatedItems.forEach((p, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-100 cursor-pointer';
        tr.setAttribute('data-id', p.ID);
        const itemNumber = startIndex + index + 1;
        tr.innerHTML = `
            <td class="p-1.5 border-t text-center font-medium">${itemNumber}</td>
            <td class="p-1.5 border-t">${p.NomePesqueiro}</td>
            <td class="p-1.5 border-t">${p.CidadeUF}</td>
            <td class="p-1.5 border-t">${p.TempoSemTransito} min</td>
            <td class="p-1.5 border-t">${p.Distancia} km</td>
            <td class="p-1.5 border-t">R$ ${p.PrecoMedio}</td>
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

// Renderiza os botões de controle da paginação
function renderPagination() {
    const paginationControls = document.getElementById('pagination-controls');
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(pesqueirosFiltrados.length / rowsPerPage);

    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.className = 'pagination-btn';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => displayPage(currentPage - 1));
    paginationControls.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = 'pagination-btn';
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => displayPage(i));
        paginationControls.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Próximo';
    nextButton.className = 'pagination-btn';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => displayPage(currentPage + 1));
    paginationControls.appendChild(nextButton);
}

// Popula o filtro de espécies de peixes
function populateFishFilter(pesqueiros) {
    const fishFilter = document.getElementById('fish-filter');
    const allFish = new Set();
    pesqueiros.forEach(p => {
        if (p.Peixes) p.Peixes.split(',').forEach(fish => allFish.add(fish.trim()));
    });
    while (fishFilter.options.length > 1) fishFilter.remove(1);
    allFish.forEach(fish => {
        if (fish) {
            const option = document.createElement('option');
            option.value = fish;
            option.textContent = fish;
            fishFilter.appendChild(option);
        }
    });
}

// Aplica os filtros e reordena os resultados
function applyFilters() {
    const nameFilterValue = document.getElementById('name-filter').value.toLowerCase();
    const timeFilterValue = document.getElementById('time-filter').value;
    const fishFilterValue = document.getElementById('fish-filter').value;
    const priceFilterValue = document.getElementById('price-filter').value;
    const reserveFilterValue = document.getElementById('reserve-filter').value;
    pesqueirosFiltrados = todosOsPesqueiros.filter(p => 
        (nameFilterValue ? p.NomePesqueiro.toLowerCase().includes(nameFilterValue) || p.CidadeUF.toLowerCase().includes(nameFilterValue) : true) &&
        (timeFilterValue ? parseInt(p.TempoSemTransito) <= parseInt(timeFilterValue) : true) &&
        (fishFilterValue ? p.Peixes.toLowerCase().includes(fishFilterValue.toLowerCase()) : true) &&
        (priceFilterValue ? parseFloat(p.PrecoMedio) <= parseFloat(priceFilterValue) : true) &&
        (reserveFilterValue ? p.AceitaReserva === reserveFilterValue : true)
    );
    sortAndRerender(); // Ordena e exibe a página 1
    addMarkersToMap(pesqueirosFiltrados, (id, nome) => showDetailsModal(id, nome));
}

// Função de ordenação
function sortAndRerender() {
    pesqueirosFiltrados.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];

        const numericColumns = ['TempoSemTransito', 'Distancia', 'PrecoMedio'];
        if (numericColumns.includes(sortColumn)) {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        }

        let comparison = 0;
        if (valA > valB) {
            comparison = 1;
        } else if (valA < valB) {
            comparison = -1;
        }
        return sortDirection === 'asc' ? comparison : comparison * -1;
    });

    document.querySelectorAll('.sortable-header span').forEach(span => span.textContent = '');
    const activeHeader = document.querySelector(`.sortable-header[data-sort-by="${sortColumn}"] span`);
    if (activeHeader) {
        activeHeader.textContent = sortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    displayPage(1);
}

// Configura todos os listeners de eventos da página
function setupEventListeners() {
    document.getElementById('add-pesqueiro-btn').addEventListener('click', () => showFormModal());
    
    // Listeners dos Filtros
    ['name-filter', 'price-filter'].forEach(id => document.getElementById(id).addEventListener('input', applyFilters));
    ['reserve-filter', 'time-filter', 'fish-filter'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
    document.getElementById('reset-filters').addEventListener('click', () => {
        ['name-filter', 'price-filter', 'reserve-filter', 'time-filter', 'fish-filter'].forEach(id => document.getElementById(id).value = '');
        applyFilters();
    });

    // Listener para ordenação na tabela
    const tableHead = document.querySelector('#table-section thead');
    tableHead.addEventListener('click', (e) => {
        const header = e.target.closest('.sortable-header');
        if (!header) return;
        const newSortColumn = header.dataset.sortBy;
        if (sortColumn === newSortColumn) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = newSortColumn;
            sortDirection = 'asc';
        }
        sortAndRerender();
    });

    // Listener para cliques na tabela (abrir detalhes, editar, excluir)
    const tableBody = document.getElementById('pesqueiros-table-body');
    tableBody.addEventListener('click', e => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row) return;
        const id = row.getAttribute('data-id');
        if (!id) return;
        const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);
        if (!pesqueiro) return;

        if (target.classList.contains('btn-edit')) {
            e.stopPropagation();
            showFormModal(id);
        } else if (target.classList.contains('btn-delete')) {
            e.stopPropagation();
            showConfirmDeleteModal(id, pesqueiro.NomePesqueiro);
        } else {
            showDetailsModal(id, pesqueiro.NomePesqueiro);
        }
    });
    
    // ... (O restante dos listeners para os modais continua igual)
}

// O restante das funções (renderTimeline, modais, etc.) pode ser mantido exatamente como está no seu arquivo atual.
// ...