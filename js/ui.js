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
 * Renderiza a tabela de pesqueiros, agora com uma coluna de numeração.
 * @param {Array<object>} pesqueiros - A lista de pesqueiros para exibir.
 */
function renderTable(pesqueiros) {
    const tableBody = document.getElementById('pesqueiros-table-body');
    tableBody.innerHTML = ''; // Limpa a tabela

    if (pesqueiros.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-4">Nenhum pesqueiro encontrado para este filtro.</td></tr>';
        return;
    }

    // Usamos o segundo parâmetro 'index' do forEach para obter a numeração
    pesqueiros.forEach((p, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-100 cursor-pointer';
        tr.setAttribute('data-id', p.ID);

        // Adicionamos a célula <td> com o número (index + 1)
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
 * *** FUNÇÃO ATUALIZADA COM TODOS OS FILTROS ***
 * Aplica os filtros com base na seleção do usuário e atualiza a UI.
 */
function applyFilters() {
    // 1. Pega o valor de todos os campos de filtro
    const nameFilterValue = document.getElementById('name-filter').value.toLowerCase();
    const timeFilterValue = document.getElementById('time-filter').value;
    const fishFilterValue = document.getElementById('fish-filter').value;
    const priceFilterValue = document.getElementById('price-filter').value;
    const reserveFilterValue = document.getElementById('reserve-filter').value;

    // 2. Filtra a lista principal de pesqueiros
    pesqueirosFiltrados = todosOsPesqueiros.filter(p => {
        // Condição para o filtro de nome ou cidade
        const nameMatch = nameFilterValue ? 
            p.NomePesqueiro.toLowerCase().includes(nameFilterValue) || p.CidadeUF.toLowerCase().includes(nameFilterValue) : 
            true;
        
        // Condição para o filtro de tempo
        const timeMatch = timeFilterValue ? parseInt(p.TempoSemTransito) <= parseInt(timeFilterValue) : true;
        
        // Condição para o filtro de peixe
        const fishMatch = fishFilterValue ? p.Peixes.toLowerCase().includes(fishFilterValue.toLowerCase()) : true;

        // Condição para o filtro de preço
        const priceMatch = priceFilterValue ? parseFloat(p.PrecoMedio) <= parseFloat(priceFilterValue) : true;

        // Condição para o filtro de reserva
        const reserveMatch = reserveFilterValue ? p.AceitaReserva === reserveFilterValue : true;

        // Retorna true apenas se TODAS as condições forem verdadeiras
        return nameMatch && timeMatch && fishMatch && priceMatch && reserveMatch;
    });

    // 3. Manda renderizar a tabela e o mapa com os dados já filtrados
    renderTable(pesqueirosFiltrados);
    addMarkersToMap(pesqueirosFiltrados, showDetailsModal);
}

/**
 * *** FUNÇÃO ATUALIZADA PARA OUVIR OS NOVOS FILTROS ***
 * Configura todos os listeners de eventos da página.
 */
function setupEventListeners() {
    // Event listeners para os novos filtros
    document.getElementById('name-filter').addEventListener('input', applyFilters);
    document.getElementById('price-filter').addEventListener('input', applyFilters);
    document.getElementById('reserve-filter').addEventListener('change', applyFilters);
    document.getElementById('time-filter').addEventListener('change', applyFilters);
    document.getElementById('fish-filter').addEventListener('change', applyFilters);
    
    // Event listener para o botão de limpar filtros
    document.getElementById('reset-filters').addEventListener('click', () => {
        document.getElementById('name-filter').value = '';
        document.getElementById('price-filter').value = '';
        document.getElementById('reserve-filter').value = '';
        document.getElementById('time-filter').value = '';
        document.getElementById('fish-filter').value = '';
        applyFilters(); // Aplica os filtros limpos para mostrar tudo
    });

    // Demais event listeners (sem alteração)
    document.getElementById('add-pesqueiro-btn').addEventListener('click', () => showFormModal());
    const tableBody = document.getElementById('pesqueiros-table-body');
    tableBody.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.getAttribute('data-id') || target.closest('tr').getAttribute('data-id');
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

// RESTANTE DO CÓDIGO (sem alterações)
// Funções: showLoading, showFormModal, showDetailsModal, hideModal, handleFormSubmit, handleDelete
function showLoading(isLoading) { /* ...código original... */ }
function showFormModal(id = null) { /* ...código original... */ }
function showDetailsModal(id) { /* ...código original... */ }
function hideModal() { /* ...código original... */ }
async function handleFormSubmit(e) { /* ...código original... */ }
async function handleDelete(id) { /* ...código original... */ }

document.addEventListener('DOMContentLoaded', initUI);