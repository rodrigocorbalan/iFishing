// Variáveis globais
let todosOsPesqueiros = [];
let pesqueirosFiltrados = [];
let pesqueiroIdToDelete = null; // Nova variável para guardar o ID a ser excluído

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
function populateFishFilter(pesqueiros) { /* ...código original sem alterações... */ }

/**
 * Aplica os filtros e atualiza a UI.
 */
function applyFilters() { /* ...código original sem alterações... */ }

/**
 * *** FUNÇÃO ATUALIZADA PARA USAR O NOVO MODAL DE CONFIRMAÇÃO ***
 * Configura todos os listeners de eventos da página.
 */
function setupEventListeners() {
    // Filtros (sem alterações)
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

    // Botão para adicionar novo pesqueiro
    document.getElementById('add-pesqueiro-btn').addEventListener('click', () => showFormModal());

    // Listener de cliques na tabela
    const tableBody = document.getElementById('pesqueiros-table-body');
    tableBody.addEventListener('click', (e) => {
        const target = e.target;
        const row = target.closest('tr');
        const id = row.getAttribute('data-id');
        if (!id) return;
        
        if (target.classList.contains('btn-edit')) {
            e.stopPropagation();
            showFormModal(id);
        } else if (target.classList.contains('btn-delete')) {
            e.stopPropagation();
            const nome = row.cells[1].textContent; // Pega o nome do pesqueiro da segunda célula da linha
            showConfirmDeleteModal(id, nome); // <<< AQUI ESTÁ A MUDANÇA
        } else {
             showDetailsModal(id);
        }
    });

    // Listeners do modal de formulário
    document.querySelector('#modal .modal-close-btn').addEventListener('click', hideModal);
    document.querySelector('#modal .modal-bg').addEventListener('click', hideModal);
    document.getElementById('pesqueiro-form').addEventListener('submit', handleFormSubmit);

    // --- NOVOS LISTENERS PARA O MODAL DE CONFIRMAÇÃO ---
    const confirmModal = document.getElementById('confirm-delete-modal');
    document.getElementById('btn-cancel-delete').addEventListener('click', hideConfirmDeleteModal);
    confirmModal.addEventListener('click', (e) => { // Clicar no fundo fecha o modal
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
}

// --- FUNÇÕES DE MODAL (com adição do novo modal) ---

function showLoading(isLoading) { /* ...código original sem alterações... */ }

function showFormModal(id = null) { /* ...código original sem alterações... */ }

function showDetailsModal(id) { /* ...código original sem alterações... */ }

function hideModal() { /* ...código original sem alterações... */ }

// --- NOVAS FUNÇÕES PARA CONTROLAR O MODAL DE CONFIRMAÇÃO ---

function showConfirmDeleteModal(id, nome) {
    pesqueiroIdToDelete = id; // Guarda o ID para usar depois
    document.getElementById('pesqueiro-to-delete-name').textContent = nome; // Mostra o nome do pesqueiro
    document.getElementById('confirm-delete-modal').classList.remove('hidden');
}

function hideConfirmDeleteModal() {
    pesqueiroIdToDelete = null; // Limpa o ID
    document.getElementById('confirm-delete-modal').classList.add('hidden');
}


// --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (sem alterações) ---

async function handleFormSubmit(e) { /* ...código original sem alterações... */ }

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

async function geocodeAddress(address) { /* ...código original sem alterações... */ }

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', initUI);