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
    console.log("DEBUG: showLoading - Loader visível.");
}

function hideLoading() {
    const loaderEl = document.getElementById('loader');
    if (loaderEl) {
        loaderEl.classList.add('hidden');
        console.log("DEBUG: hideLoading - Classe 'hidden' adicionada ao loader.");
        // Opcional: Para ter certeza absoluta que o estilo está sendo aplicado
        // console.log("DEBUG: hideLoading - Estilo display do loader:", window.getComputedStyle(loaderEl).display);
    } else {
        console.error("DEBUG: hideLoading - Elemento #loader não encontrado!");
    }
}

// Função principal que inicializa a UI com os logs para debug
async function initUI() {
    console.log("--- INICIANDO DEBUG UI ---");
    console.log("1. initUI: Começou. Mostrando o loader.");
    showLoading(); 
    try {
        // Usa Promise.all para buscar ambos os conjuntos de dados em paralelo
        const [pesqueiros, visitas] = await Promise.all([getPesqueiros(), getAllVisitas()]);
        console.log("2. initUI: Dados da API recebidos com sucesso.");
        
        todosOsPesqueiros = pesqueiros;
        pesqueirosFiltrados = [...todosOsPesqueiros]; // Inicializa filtrados com todos
        
        console.log("3. initUI: Chamando a função sortAndRerender para ordenar e exibir a tabela.");
        sortAndRerender(); // Ordena e renderiza a tabela (e chama displayPage(1))
        console.log("4. initUI: A função sortAndRerender foi CONCLUÍDA.");
        
        populateFishFilter(todosOsPesqueiros);
        renderTimeline(visitas);
        setupEventListeners();
        console.log("5. initUI: Restante da UI foi configurado e event listeners ativados.");

        // Adicione este setTimeout para fins de debug, para dar um tempo antes de esconder o loader
        // Isso ajuda a visualizar se o loader aparece e depois desaparece.
        setTimeout(() => {
            console.log("6. initUI: Timeout concluído. Escondendo o loader.");
            hideLoading();
            console.log("--- FIM DO DEBUG UI ---");
        }, 500); // Atraso de 0.5 segundos para o loader desaparecer (ajuste se necessário)

    } catch (error) {
        console.error("ERRO FATAL NA INICIALIZAÇÃO DA UI:", error);
        alert("Ocorreu um erro grave ao carregar a aplicação. Verifique o console (F12) para mais detalhes.");
        hideLoading(); // Garante que o loader seja escondido mesmo em caso de erro
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
    if (!tableBody) {
        console.error("DEBUG: renderTable - Elemento #pesqueiros-table-body não encontrado.");
        return;
    }
    tableBody.innerHTML = '';

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedItems = pesqueirosFiltrados.slice(startIndex, endIndex);

    if (paginatedItems.length === 0 && currentPage === 1) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-4">Nenhum pesqueiro encontrado com os filtros aplicados.</td></tr>';
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
            <td class="p-1.5 border-t">${p.TempoSemTransito || 'N/A'} min</td>
            <td class="p-1.5 border-t">${p.Distancia || 'N/A'} km</td>
            <td class="p-1.5 border-t">R$ ${p.PrecoMedio || 'N/A'}</td>
            <td class="p-1.5 border-t">${p.AceitaReserva || 'N/A'}</td>
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
    if (!paginationControls) {
        console.error("DEBUG: renderPagination - Elemento #pagination-controls não encontrado.");
        return;
    }
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(pesqueirosFiltrados.length / rowsPerPage);

    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.className = 'pagination-btn bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => displayPage(currentPage - 1));
    paginationControls.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `pagination-btn px-3 py-1 rounded-md text-sm ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`;
        pageButton.addEventListener('click', () => displayPage(i));
        paginationControls.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Próximo';
    nextButton.className = 'pagination-btn bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => displayPage(currentPage + 1));
    paginationControls.appendChild(nextButton);
}

// Popula o filtro de espécies de peixes
function populateFishFilter(pesqueiros) {
    const fishFilter = document.getElementById('fish-filter');
    if (!fishFilter) {
        console.error("DEBUG: populateFishFilter - Elemento #fish-filter não encontrado.");
        return;
    }
    const allFish = new Set();
    pesqueiros.forEach(p => {
        if (p.Peixes) p.Peixes.split(',').forEach(fish => allFish.add(fish.trim()));
    });
    // Remove opções antigas, exceto a primeira "Todas"
    while (fishFilter.options.length > 1) {
        fishFilter.remove(1);
    }
    allFish.forEach(fish => {
        if (fish) { // Garante que não adiciona strings vazias
            const option = document.createElement('option');
            option.value = fish;
            option.textContent = fish;
            fishFilter.appendChild(option);
        }
    });
}

// Aplica os filtros e reordena os resultados
function applyFilters() {
    console.log("DEBUG: applyFilters - Aplicando filtros...");
    const nameFilterValue = document.getElementById('name-filter')?.value?.toLowerCase() || '';
    const timeFilterValue = document.getElementById('time-filter')?.value || '';
    const fishFilterValue = document.getElementById('fish-filter')?.value?.toLowerCase() || '';
    const priceFilterValue = document.getElementById('price-filter')?.value || '';
    const reserveFilterValue = document.getElementById('reserve-filter')?.value || '';

    pesqueirosFiltrados = todosOsPesqueiros.filter(p => 
        (nameFilterValue ? (p.NomePesqueiro?.toLowerCase().includes(nameFilterValue) || p.CidadeUF?.toLowerCase().includes(nameFilterValue)) : true) &&
        (timeFilterValue ? (parseFloat(p.TempoSemTransito) <= parseFloat(timeFilterValue)) : true) &&
        (fishFilterValue ? (p.Peixes?.toLowerCase().includes(fishFilterValue)) : true) &&
        (priceFilterValue ? (parseFloat(p.PrecoMedio) <= parseFloat(priceFilterValue)) : true) &&
        (reserveFilterValue ? (p.AceitaReserva === reserveFilterValue) : true)
    );
    console.log(`DEBUG: applyFilters - ${pesqueirosFiltrados.length} pesqueiros após filtros.`);
    sortAndRerender(); // Ordena e exibe a página 1
    addMarkersToMap(pesqueirosFiltrados, (id, nome) => showDetailsModal(id, nome));
}

// Função de ordenação
function sortAndRerender() {
    console.log(`DEBUG: sortAndRerender - Ordenando por ${sortColumn} ${sortDirection}.`);
    pesqueirosFiltrados.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];

        // Trata valores nulos/indefinidos para ordenação
        if (valA === undefined || valA === null) valA = sortDirection === 'asc' ? Infinity : -Infinity;
        if (valB === undefined || valB === null) valB = sortDirection === 'asc' ? Infinity : -Infinity;

        const numericColumns = ['TempoSemTransito', 'Distancia', 'PrecoMedio'];
        if (numericColumns.includes(sortColumn)) {
            valA = parseFloat(valA) || 0; // Converte para número, 0 se falhar
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

    // Atualiza os indicadores de ordenação na UI
    document.querySelectorAll('.sortable-header span').forEach(span => span.textContent = '');
    const activeHeader = document.querySelector(`.sortable-header[data-sort-by="${sortColumn}"] span`);
    if (activeHeader) {
        activeHeader.textContent = sortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    displayPage(1); // Sempre volta para a primeira página após ordenação/filtro
}

// Configura todos os listeners de eventos da página
function setupEventListeners() {
    console.log("DEBUG: setupEventListeners - Configurando listeners de eventos.");
    document.getElementById('add-pesqueiro-btn')?.addEventListener('click', () => showFormModal());
    
    // Listeners dos Filtros
    ['name-filter', 'price-filter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', applyFilters);
    });
    ['reserve-filter', 'time-filter', 'fish-filter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
    });
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            ['name-filter', 'price-filter', 'reserve-filter', 'time-filter', 'fish-filter'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            applyFilters();
        });
    }

    // Listener para ordenação na tabela
    const tableHead = document.querySelector('#table-section thead');
    if (tableHead) {
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
    }

    // Listener para cliques na tabela (abrir detalhes, editar, excluir)
    const tableBody = document.getElementById('pesqueiros-table-body');
    if (tableBody) {
        tableBody.addEventListener('click', e => {
            const target = e.target;
            const row = target.closest('tr');
            if (!row) return;
            const id = row.getAttribute('data-id');
            if (!id) return;
            const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);
            if (!pesqueiro) return;

            if (target.classList.contains('btn-edit')) {
                e.stopPropagation(); // Impede que o clique na linha também ative o modal de detalhes
                showFormModal(id);
            } else if (target.classList.contains('btn-delete')) {
                e.stopPropagation(); // Impede que o clique na linha também ative o modal de detalhes
                showConfirmDeleteModal(id, pesqueiro.NomePesqueiro);
            } else {
                showDetailsModal(id, pesqueiro.NomePesqueiro);
            }
        });
    }
    
    // Listeners dos botões dos modais (fechar)
    document.querySelectorAll('.modal-close-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById('modal')?.classList.add('hidden');
            document.getElementById('confirm-delete-modal')?.classList.add('hidden');
        });
    });

    document.querySelectorAll('.modal-bg').forEach(bg => {
        bg.addEventListener('click', () => {
            document.getElementById('modal')?.classList.add('hidden');
            document.getElementById('confirm-delete-modal')?.classList.add('hidden');
        });
    });

    document.getElementById('btn-cancel-delete')?.addEventListener('click', () => {
        document.getElementById('confirm-delete-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-confirm-delete')?.addEventListener('click', async () => {
        showLoading();
        console.log(`DEBUG: Excluindo pesqueiro com ID: ${pesqueiroIdToDelete}`);
        const result = await deletePesqueiro(pesqueiroIdToDelete);
        hideLoading();
        document.getElementById('confirm-delete-modal')?.classList.add('hidden');
        if (result.status === 'success') {
            alert('Pesqueiro excluído com sucesso!');
            initUI(); // Recarrega a UI após a exclusão
        } else {
            alert('Erro ao excluir pesqueiro: ' + (result.message || 'Erro desconhecido.'));
            console.error("DEBUG: Erro ao excluir pesqueiro:", result);
        }
    });

    document.getElementById('pesqueiro-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        let result;
        if (data.ID) {
            console.log(`DEBUG: Atualizando pesqueiro com ID: ${data.ID}`);
            result = await updatePesqueiro(data);
        } else {
            console.log("DEBUG: Criando novo pesqueiro.");
            result = await createPesqueiro(data);
        }
        hideLoading();
        document.getElementById('modal')?.classList.add('hidden');
        if (result.status === 'success') {
            alert('Pesqueiro salvo com sucesso!');
            initUI(); // Recarrega a UI após salvar
        } else {
            alert('Erro ao salvar pesqueiro: ' + (result.message || 'Erro desconhecido.'));
            console.error("DEBUG: Erro ao salvar pesqueiro:", result);
        }
    });

    document.getElementById('visita-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Garante que o ID do pesqueiro esteja presente nos dados da visita
        data.PesqueiroID = document.getElementById('visita-pesqueiro-id')?.value;

        if (!data.PesqueiroID) {
            console.error("DEBUG: Tentativa de registrar visita sem PesqueiroID.");
            alert("Erro: Não foi possível identificar o pesqueiro para registrar a visita.");
            hideLoading();
            return;
        }

        console.log(`DEBUG: Registrando visita para Pesqueiro ID: ${data.PesqueiroID}`);
        const result = await createVisita(data);
        hideLoading();
        document.getElementById('modal')?.classList.add('hidden');
        if (result.status === 'success') {
            alert('Visita registrada com sucesso!');
            // Após registrar, queremos atualizar o histórico e a timeline
            // Se o modal de detalhes estiver aberto, recarregamos as visitas dele
            const currentPesqueiroIdInModal = document.getElementById('visita-pesqueiro-id')?.value;
            if (currentPesqueiroIdInModal) {
                 // Reabre o modal de detalhes para atualizar o histórico
                const pesqueiroNome = todosOsPesqueiros.find(p => p.ID == currentPesqueiroIdInModal)?.NomePesqueiro || "Pesqueiro Desconhecido";
                showDetailsModal(currentPesqueiroIdInModal, pesqueiroNome);
            }
            initUI(); // Recarrega a UI (para atualizar a timeline na página principal)
        } else {
            alert('Erro ao registrar visita: ' + (result.message || 'Erro desconhecido.'));
            console.error("DEBUG: Erro ao registrar visita:", result);
        }
    });

    // Configuração das abas do modal de detalhes
    const tabHistorico = document.getElementById('tab-historico');
    const tabRegistrar = document.getElementById('tab-registrar');
    const contentHistorico = document.getElementById('content-historico');
    const contentRegistrar = document.getElementById('content-registrar');

    if (tabHistorico && tabRegistrar && contentHistorico && contentRegistrar) {
        tabHistorico.addEventListener('click', (e) => {
            e.preventDefault();
            contentHistorico.classList.remove('hidden');
            contentRegistrar.classList.add('hidden');
            tabHistorico.classList.add('border-blue-500', 'text-blue-600');
            tabHistorico.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            tabRegistrar.classList.remove('border-blue-500', 'text-blue-600');
            tabRegistrar.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        });

        tabRegistrar.addEventListener('click', (e) => {
            e.preventDefault();
            contentHistorico.classList.add('hidden');
            contentRegistrar.classList.remove('hidden');
            tabRegistrar.classList.add('border-blue-500', 'text-blue-600');
            tabRegistrar.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            tabHistorico.classList.remove('border-blue-500', 'text-blue-600');
            tabHistorico.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        });
    }
}

// Função de exemplo para exibir o modal de formulário (adicionar/editar)
function showFormModal(id = null) {
    console.log(`DEBUG: Abrindo modal de formulário (ID: ${id || 'novo'}).`);
    const modal = document.getElementById('modal');
    const formContent = document.getElementById('form-content');
    const detailsContent = document.getElementById('details-content');
    const modalTitle = document.getElementById('modal-title');
    const pesqueiroForm = document.getElementById('pesqueiro-form');

    if (!modal || !formContent || !detailsContent || !modalTitle || !pesqueiroForm) {
        console.error("DEBUG: showFormModal - Elementos do modal de formulário não encontrados.");
        return;
    }

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
        } else {
            console.warn(`DEBUG: Pesqueiro com ID ${id} não encontrado para edição.`);
        }
    } else {
        modalTitle.textContent = 'Adicionar Novo Pesqueiro';
    }
    modal.classList.remove('hidden');
}

// Função de exemplo para exibir o modal de detalhes
async function showDetailsModal(id, nomePesqueiro) {
    console.log(`DEBUG: Abrindo modal de detalhes para Pesqueiro ID: ${id} (${nomePesqueiro}).`);
    const modal = document.getElementById('modal');
    const formContent = document.getElementById('form-content');
    const detailsContent = document.getElementById('details-content');
    const modalTitle = document.getElementById('modal-title');
    const pesqueiroDetailsContainer = document.getElementById('pesqueiro-details-container');
    const visitasList = document.getElementById('visitas-list');
    const historicoEmptyState = document.getElementById('historico-empty-state');
    const visitaPesqueiroIdInput = document.getElementById('visita-pesqueiro-id');
    const tabHistorico = document.getElementById('tab-historico');

    if (!modal || !formContent || !detailsContent || !modalTitle || !pesqueiroDetailsContainer || !visitasList || !historicoEmptyState || !visitaPesqueiroIdInput || !tabHistorico) {
        console.error("DEBUG: showDetailsModal - Um ou mais elementos do modal de detalhes não foram encontrados.");
        return;
    }
    
    // Esconde o formulário e mostra detalhes
    formContent.classList.add('hidden');
    detailsContent.classList.remove('hidden');

    modalTitle.textContent = `Detalhes de ${nomePesqueiro}`;
    
    // Encontrar o pesqueiro pelos detalhes
    const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);
    if (pesqueiro) {
        pesqueiroDetailsContainer.innerHTML = `
            <h3 class="text-xl font-bold mb-2">${pesqueiro.NomePesqueiro || 'N/A'}</h3>
            <p><strong>Cidade/UF:</strong> ${pesqueiro.CidadeUF || 'N/A'}</p>
            <p><strong>Tempo sem Trânsito:</strong> ${pesqueiro.TempoSemTransito || 'N/A'} min</p>
            <p><strong>Distância:</strong> ${pesqueiro.Distancia || 'N/A'} km</p>
            <p><strong>Preço Médio:</strong> R$ ${pesqueiro.PrecoMedio || 'N/A'}</p>
            <p><strong>Aceita Reserva:</strong> ${pesqueiro.AceitaReserva || 'N/A'}</p>
            <p><strong>Peixes:</strong> ${pesqueiro.Peixes || 'N/A'}</p>
            <p><strong>Endereço:</strong> ${pesqueiro.EnderecoCompleto || 'N/A'}</p>
            <p><strong>Coordenadas:</strong> ${pesqueiro.Latitude || 'N/A'}, ${pesqueiro.Longitude || 'N/A'}</p>
            <p><strong>Telefone/WhatsApp:</strong> ${pesqueiro.Telefone || 'N/A'}</p>
            <p><strong>Site:</strong> ${pesqueiro.Site ? `<a href="${pesqueiro.Site}" target="_blank" class="text-blue-500 hover:underline">${pesqueiro.Site}</a>` : 'N/A'}</p>
            <p><strong>Instagram:</strong> ${pesqueiro.Instagram ? `<a href="${pesqueiro.Instagram}" target="_blank" class="text-blue-500 hover:underline">${pesqueiro.Instagram}</a>` : 'N/A'}</p>
        `;
    } else {
        pesqueiroDetailsContainer.innerHTML = '<p class="text-red-500">Detalhes do pesqueiro não encontrados.</p>';
        console.warn(`DEBUG: Detalhes para o pesqueiro ID ${id} não encontrados na lista de todosOsPesqueiros.`);
    }

    // Carregar e renderizar histórico de visitas
    visitasList.innerHTML = '<p class="text-gray-500">Carregando histórico de visitas...</p>';
    historicoEmptyState.classList.add('hidden'); // Esconde o estado vazio enquanto carrega
    try {
        const visitas = await getVisitas(id);
        console.log(`DEBUG: Visitas para Pesqueiro ID ${id} carregadas:`, visitas);
        visitasList.innerHTML = ''; // Limpa o "carregando"
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
        } else {
            historicoEmptyState.classList.remove('hidden');
            visitasList.innerHTML = ''; // Garante que a lista está vazia
        }
    } catch (error) {
        console.error("DEBUG: Falha ao carregar visitas:", error);
        visitasList.innerHTML = '<p class="text-red-500">Erro ao carregar histórico de visitas.</p>';
        historicoEmptyState.classList.add('hidden');
    }

    // Preenche o ID do pesqueiro para o formulário de nova visita
    visitaPesqueiroIdInput.value = id;

    // Garante que a aba "Histórico" é a inicial
    tabHistorico.click(); // Simula um clique para ativar a aba correta

    modal.classList.remove('hidden');
}

// Função de exemplo para exibir o modal de confirmação de exclusão
function showConfirmDeleteModal(id, nome) {
    console.log(`DEBUG: Abrindo modal de confirmação de exclusão para Pesqueiro ID: ${id} (${nome}).`);
    pesqueiroIdToDelete = id;
    const pesqueiroToDeleteNameEl = document.getElementById('pesqueiro-to-delete-name');
    const confirmDeleteModalEl = document.getElementById('confirm-delete-modal');

    if (pesqueiroToDeleteNameEl && confirmDeleteModalEl) {
        pesqueiroToDeleteNameEl.textContent = nome;
        confirmDeleteModalEl.classList.remove('hidden');
    } else {
        console.error("DEBUG: showConfirmDeleteModal - Elementos do modal de confirmação não encontrados.");
        alert(`Confirmar exclusão de ${nome}? (Erro na UI do modal)`);
    }
}

// Função para renderizar a timeline de visitas
function renderTimeline(visitas) {
    console.log("DEBUG: renderTimeline - Renderizando timeline de visitas.");
    const timelineContainer = document.getElementById('timeline-container');
    const timelineLoading = document.getElementById('timeline-loading');
    
    if (!timelineContainer) {
        console.error("DEBUG: renderTimeline - Elemento #timeline-container não encontrado.");
        return; 
    }

    timelineContainer.innerHTML = ''; // Limpa o conteúdo existente
    
    if (!visitas || visitas.length === 0) {
        timelineContainer.innerHTML = '<p class="text-gray-500 p-4 text-center">Nenhuma visita recente para exibir.</p>';
        if (timelineLoading) timelineLoading.style.display = 'none'; // Esconde o "Carregando"
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
                <h4 class="font-semibold text-gray-800">${visita.PesqueiroNome || 'Nome Indisponível'}</h4>
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