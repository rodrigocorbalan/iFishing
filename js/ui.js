// Variáveis globais para paginação e ordenação
let currentPage = 1;
const rowsPerPage = 10;
let sortColumn = 'Distancia'; // Coluna de ordenação padrão
let sortDirection = 'asc';    // Direção padrão (ascendente)

let todosOsPesqueiros = [];
let pesqueirosFiltrados = [];
let pesqueiroIdToDelete = null;

// Funções para exibir/ocultar o spinner de carregamento
function showLoading() {
    document.getElementById('loader').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loader').classList.add('hidden');
}

// Função principal que inicializa a UI
async function initUI() {
    showLoading(); // Removido o 'true' pois a função não espera parâmetro boolean
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
        hideLoading(); // Chamada para esconder o loader no 'finally'
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
// Note: As funções abaixo não foram fornecidas no arquivo `ui.js` inicial,
// então estou assumindo que elas existem em outro lugar ou você irá adicioná-las.
// Para um arquivo ui.js completo e funcional, você precisaria delas.
// Exemplo de como elas seriam:

// Função de exemplo para exibir o modal de formulário (adicionar/editar)
function showFormModal(id = null) {
    const modal = document.getElementById('modal');
    const formContent = document.getElementById('form-content');
    const detailsContent = document.getElementById('details-content');
    const modalTitle = document.getElementById('modal-title');
    const pesqueiroForm = document.getElementById('pesqueiro-form');

    // Limpa o formulário
    pesqueiroForm.reset();
    document.getElementById('ID').value = '';

    // Esconde detalhes e mostra o formulário
    detailsContent.classList.add('hidden');
    formContent.classList.remove('hidden');

    if (id) {
        modalTitle.textContent = 'Editar Pesqueiro';
        const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);
        if (pesqueiro) {
            // Preenche o formulário com os dados do pesqueiro
            for (const key in pesqueiro) {
                const input = document.getElementById(key);
                if (input) {
                    input.value = pesqueiro[key];
                }
            }
        }
    } else {
        modalTitle.textContent = 'Adicionar Novo Pesqueiro';
    }
    modal.classList.remove('hidden');
}

// Função de exemplo para exibir o modal de detalhes
async function showDetailsModal(id, nomePesqueiro) {
    const modal = document.getElementById('modal');
    const formContent = document.getElementById('form-content');
    const detailsContent = document.getElementById('details-content');
    const modalTitle = document.getElementById('modal-title');
    const pesqueiroDetailsContainer = document.getElementById('pesqueiro-details-container');
    const visitasList = document.getElementById('visitas-list');
    const historicoEmptyState = document.getElementById('historico-empty-state');
    const visitaPesqueiroIdInput = document.getElementById('visita-pesqueiro-id');
    
    // Esconde o formulário e mostra detalhes
    formContent.classList.add('hidden');
    detailsContent.classList.remove('hidden');

    modalTitle.textContent = `Detalhes de ${nomePesqueiro}`;
    
    // Encontrar o pesqueiro pelos detalhes
    const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);
    if (pesqueiro) {
        pesqueiroDetailsContainer.innerHTML = `
            <h3 class="text-xl font-bold mb-2">${pesqueiro.NomePesqueiro}</h3>
            <p><strong>Cidade/UF:</strong> ${pesqueiro.CidadeUF}</p>
            <p><strong>Tempo sem Trânsito:</strong> ${pesqueiro.TempoSemTransito} min</p>
            <p><strong>Distância:</strong> ${pesqueiro.Distancia} km</p>
            <p><strong>Preço Médio:</strong> R$ ${pesqueiro.PrecoMedio}</p>
            <p><strong>Aceita Reserva:</strong> ${pesqueiro.AceitaReserva}</p>
            <p><strong>Peixes:</strong> ${pesqueiro.Peixes || 'N/A'}</p>
            <p><strong>Endereço:</strong> ${pesqueiro.EnderecoCompleto || 'N/A'}</p>
            <p><strong>Coordenadas:</strong> ${pesqueiro.Latitude || 'N/A'}, ${pesqueiro.Longitude || 'N/A'}</p>
            <p><strong>Telefone/WhatsApp:</strong> ${pesqueiro.Telefone || 'N/A'}</p>
            <p><strong>Site:</strong> <a href="${pesqueiro.Site}" target="_blank" class="text-blue-500 hover:underline">${pesqueiro.Site || 'N/A'}</a></p>
            <p><strong>Instagram:</strong> <a href="${pesqueiro.Instagram}" target="_blank" class="text-blue-500 hover:underline">${pesqueiro.Instagram || 'N/A'}</a></p>
        `;
    }

    // Carregar e renderizar histórico de visitas
    visitasList.innerHTML = '';
    historicoEmptyState.classList.remove('hidden');
    const visitas = await getVisitas(id);
    if (visitas && visitas.length > 0) {
        historicoEmptyState.classList.add('hidden');
        visitas.forEach(visita => {
            const visitaDiv = document.createElement('div');
            visitaDiv.className = 'bg-gray-50 p-3 rounded-lg border border-gray-200';
            visitaDiv.innerHTML = `
                <p class="font-semibold">Data: ${new Date(visita.DataVisita).toLocaleDateString('pt-BR')}</p>
                <p>Peixes Capturados: ${visita.PeixesCapturados || 'N/A'}</p>
                <p>Observações: ${visita.Observacoes || 'Nenhuma.'}</p>
            `;
            visitasList.appendChild(visitaDiv);
        });
    }

    // Preenche o ID do pesqueiro para o formulário de nova visita
    visitaPesqueiroIdInput.value = id;

    // Configurar abas do modal de detalhes
    document.getElementById('tab-historico').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('content-historico').classList.remove('hidden');
        document.getElementById('content-registrar').classList.add('hidden');
        document.getElementById('tab-historico').classList.add('border-blue-500', 'text-blue-600');
        document.getElementById('tab-historico').classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        document.getElementById('tab-registrar').classList.remove('border-blue-500', 'text-blue-600');
        document.getElementById('tab-registrar').classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    });

    document.getElementById('tab-registrar').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('content-historico').classList.add('hidden');
        document.getElementById('content-registrar').classList.remove('hidden');
        document.getElementById('tab-registrar').classList.add('border-blue-500', 'text-blue-600');
        document.getElementById('tab-registrar').classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        document.getElementById('tab-historico').classList.remove('border-blue-500', 'text-blue-600');
        document.getElementById('tab-historico').classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    });

    // Garante que a aba "Histórico" é a inicial
    document.getElementById('tab-historico').click();

    modal.classList.remove('hidden');
}

// Função de exemplo para exibir o modal de confirmação de exclusão
function showConfirmDeleteModal(id, nome) {
    pesqueiroIdToDelete = id;
    document.getElementById('pesqueiro-to-delete-name').textContent = nome;
    document.getElementById('confirm-delete-modal').classList.remove('hidden');
}

// Listeners dos botões dos modais
document.querySelectorAll('.modal-close-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.getElementById('modal').classList.add('hidden');
        document.getElementById('confirm-delete-modal').classList.add('hidden');
    });
});

document.querySelectorAll('.modal-bg').forEach(bg => {
    bg.addEventListener('click', () => {
        document.getElementById('modal').classList.add('hidden');
        document.getElementById('confirm-delete-modal').classList.add('hidden');
    });
});

document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    document.getElementById('confirm-delete-modal').classList.add('hidden');
});

document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
    showLoading();
    const result = await deletePesqueiro(pesqueiroIdToDelete);
    hideLoading();
    document.getElementById('confirm-delete-modal').classList.add('hidden');
    if (result.status === 'success') {
        alert('Pesqueiro excluído com sucesso!');
        initUI(); // Recarrega a UI após a exclusão
    } else {
        alert('Erro ao excluir pesqueiro: ' + (result.message || 'Erro desconhecido.'));
    }
});


document.getElementById('pesqueiro-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    let result;
    if (data.ID) {
        result = await updatePesqueiro(data);
    } else {
        result = await createPesqueiro(data);
    }
    hideLoading();
    document.getElementById('modal').classList.add('hidden');
    if (result.status === 'success') {
        alert('Pesqueiro salvo com sucesso!');
        initUI(); // Recarrega a UI após salvar
    } else {
        alert('Erro ao salvar pesqueiro: ' + (result.message || 'Erro desconhecido.'));
    }
});

document.getElementById('visita-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Garante que o ID do pesqueiro esteja presente nos dados da visita
    data.PesqueiroID = document.getElementById('visita-pesqueiro-id').value;

    const result = await createVisita(data);
    hideLoading();
    document.getElementById('modal').classList.add('hidden');
    if (result.status === 'success') {
        alert('Visita registrada com sucesso!');
        initUI(); // Recarrega a UI (incluindo timeline e possíveis detalhes)
    } else {
        alert('Erro ao registrar visita: ' + (result.message || 'Erro desconhecido.'));
    }
});

// Função para renderizar a timeline de visitas
function renderTimeline(visitas) {
    const timelineContainer = document.getElementById('timeline-container');
    const timelineLoading = document.getElementById('timeline-loading');
    
    if (!timelineContainer) return; // Garante que o elemento existe

    timelineContainer.innerHTML = ''; // Limpa o conteúdo existente
    
    if (!visitas || visitas.length === 0) {
        timelineContainer.innerHTML = '<p class="text-gray-500 p-4 text-center">Nenhuma visita recente para exibir.</p>';
        return;
    }

    // Ordena as visitas por data (mais recente primeiro)
    visitas.sort((a, b) => new Date(b.DataVisita) - new Date(a.DataVisita));

    // Exibe apenas as 5 visitas mais recentes para a timeline na página principal
    const visitasRecentes = visitas.slice(0, 5);

    visitasRecentes.forEach(visita => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'timeline-item';
        itemDiv.innerHTML = `
            <div>
                <p class="text-gray-500 text-xs">${new Date(visita.DataVisita).toLocaleDateString('pt-BR')}</p>
                <h4 class="font-semibold text-gray-800">${visita.PesqueiroNome}</h4>
                <p class="text-gray-700 text-sm">${visita.PeixesCapturados ? `Peixes: ${visita.PeixesCapturados}` : ''}</p>
                <p class="text-gray-600 text-xs">${visita.Observacoes || 'Sem observações.'}</p>
            </div>
        `;
        timelineContainer.appendChild(itemDiv);
    });

    if (timelineLoading) {
        timelineLoading.style.display = 'none'; // Esconde o "Carregando"
    }
}