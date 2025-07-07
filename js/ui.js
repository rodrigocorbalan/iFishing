let todosOsPesqueiros = [], pesqueirosFiltrados = [], pesqueiroIdToDelete = null;

async function initUI() {
    showLoading(true);
    try {
        const [pesqueiros, visitas] = await Promise.all([getPesqueiros(), getAllVisitas()]);
        todosOsPesqueiros = pesqueiros;
        pesqueirosFiltrados = [...todosOsPesqueiros];
        renderTable(pesqueirosFiltrados);
        addMarkersToMap(pesqueirosFiltrados, (id, nome) => showDetailsModal(id, nome));
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

function renderTable(pesqueiros) {
    const tableBody = document.getElementById('pesqueiros-table-body');
    tableBody.innerHTML = '';
    if (pesqueiros.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-4">Nenhum pesqueiro encontrado.</td></tr>';
        return;
    }
    pesqueiros.forEach((p, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-100 cursor-pointer';
        tr.setAttribute('data-id', p.ID);
        tr.innerHTML = `<td class="p-1.5 border-t text-center font-medium">${index + 1}</td><td class="p-1.5 border-t">${p.NomePesqueiro}</td><td class="p-1.5 border-t">${p.CidadeUF}</td><td class="p-1.5 border-t">${p.TempoSemTransito} min</td><td class="p-1.5 border-t">${p.Distancia} km</td><td class="p-1.5 border-t">${p.PrecoMedio}</td><td class="p-1.5 border-t">${p.AceitaReserva}</td><td class="p-1.5 border-t"><div class="flex gap-2"><button class="btn-edit text-xs bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">Editar</button><button class="btn-delete text-xs bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">Excluir</button></div></td>`;
        tableBody.appendChild(tr);
    });
}

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
    renderTable(pesqueirosFiltrados);
    addMarkersToMap(pesqueirosFiltrados, (id, nome) => showDetailsModal(id, nome));
}

function setupEventListeners() {
    ['name-filter', 'price-filter'].forEach(id => document.getElementById(id).addEventListener('input', applyFilters));
    ['reserve-filter', 'time-filter', 'fish-filter'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
    document.getElementById('reset-filters').addEventListener('click', () => {
        ['name-filter', 'price-filter', 'reserve-filter', 'time-filter', 'fish-filter'].forEach(id => document.getElementById(id).value = '');
        applyFilters();
    });
    document.getElementById('add-pesqueiro-btn').addEventListener('click', () => showFormModal());
    document.getElementById('pesqueiros-table-body').addEventListener('click', e => {
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
    const formModal = document.getElementById('modal');
    formModal.querySelector('.modal-close-btn').addEventListener('click', hideModal);
    formModal.querySelector('.modal-bg').addEventListener('click', hideModal);
    document.getElementById('pesqueiro-form').addEventListener('submit', handleFormSubmit);
    const confirmModal = document.getElementById('confirm-delete-modal');
    document.getElementById('btn-cancel-delete').addEventListener('click', hideConfirmDeleteModal);
    confirmModal.addEventListener('click', e => { if (e.target === confirmModal) hideConfirmDeleteModal(); });
    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        if (pesqueiroIdToDelete) handleDelete(pesqueiroIdToDelete);
    });
    document.getElementById('visita-form').addEventListener('submit', handleVisitaFormSubmit);
    const tabHistorico = document.getElementById('tab-historico');
    const tabRegistrar = document.getElementById('tab-registrar');
    const contentHistorico = document.getElementById('content-historico');
    const contentRegistrar = document.getElementById('content-registrar');
    tabHistorico.addEventListener('click', e => {
        e.preventDefault();
        tabHistorico.classList.add('border-blue-500', 'text-blue-600');
        tabHistorico.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        tabRegistrar.classList.replace('border-blue-500', 'border-transparent');
        tabRegistrar.classList.replace('text-blue-600', 'text-gray-500');
        contentHistorico.classList.remove('hidden');
        contentRegistrar.classList.add('hidden');
    });
    tabRegistrar.addEventListener('click', e => {
        e.preventDefault();
        tabRegistrar.classList.add('border-blue-500', 'text-blue-600');
        tabRegistrar.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        tabHistorico.classList.replace('border-blue-500', 'border-transparent');
        tabHistorico.classList.replace('text-blue-600', 'text-gray-500');
        contentRegistrar.classList.remove('hidden');
        contentHistorico.classList.add('hidden');
    });
    document.getElementById('EnderecoCompleto').addEventListener('blur', async e => {
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

function renderTimeline(visitas) {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';
    if (!visitas || visitas.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Nenhuma visita registrada.</p>';
        return;
    }
    visitas.sort((a, b) => new Date(b.DataVisita) - new Date(a.DataVisita));
    const visitasRecentes = visitas.slice(0, 10);
    visitasRecentes.forEach(visita => {
        const dataFormatada = new Date(visita.DataVisita).toLocaleDateString('pt-BR', {day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.innerHTML = `<div><p class="font-bold text-base text-gray-800">${visita.PesqueiroNome || 'Visita'}</p><time class="text-xs text-gray-500">${dataFormatada}</time><p class="mt-2 text-gray-700">${visita.Observacoes || 'Sem observações.'}</p></div>`;
        container.appendChild(timelineItem);
    });
}

function showLoading(isLoading) {
    document.getElementById('loader').style.display = isLoading ? 'flex' : 'none';
}

function showFormModal(id = null) {
    const modal = document.getElementById('modal');
    const modalTitle = modal.querySelector('#modal-title');
    const form = modal.querySelector('#pesqueiro-form');
    modal.querySelector('#details-content').style.display = 'none';
    modal.querySelector('#form-content').style.display = 'block';
    form.reset();
    if (id) {
        modalTitle.textContent = 'Editar Pesqueiro';
        const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);
        if (pesqueiro) {
            for (const key in pesqueiro) {
                if (form.elements[key]) form.elements[key].value = pesqueiro[key];
            }
        }
    } else {
        modalTitle.textContent = 'Adicionar Novo Pesqueiro';
        form.elements['ID'].value = '';
    }
    modal.classList.remove('hidden');
}

async function showDetailsModal(id, nome) {
    const modal = document.getElementById('modal');
    const modalTitle = modal.querySelector('#modal-title');
    modal.querySelector('#form-content').style.display = 'none';
    modal.querySelector('#details-content').style.display = 'block';
    modalTitle.textContent = nome;
    const pesqueiro = todosOsPesqueiros.find(p => p.ID == id);
    if (!pesqueiro) return;
    const detailsContainer = document.getElementById('pesqueiro-details-container');
    const peixesHtml = pesqueiro.Peixes ? pesqueiro.Peixes.split(',').map(p => `<span class="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">${p.trim()}</span>`).join('') : 'Não informado';
    detailsContainer.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm"><div><strong>Endereço:</strong><br>${pesqueiro.EnderecoCompleto || 'N/A'}</div><div><strong>Telefone:</strong><br>${pesqueiro.Telefone || 'N/A'}</div><div><strong>Preço Médio:</strong><br>R$ ${pesqueiro.PrecoMedio || 'N/A'}</div><div><strong>Site:</strong><br><a href="${pesqueiro.Site}" target="_blank" class="text-blue-500 hover:underline">${pesqueiro.Site || 'Nenhum'}</a></div><div class="sm:col-span-2"><strong>Peixes:</strong><br>${peixesHtml}</div></div>`;
    document.getElementById('visita-pesqueiro-id').value = id;
    const visitasList = document.getElementById('visitas-list');
    const emptyState = document.getElementById('historico-empty-state');
    visitasList.innerHTML = '<p class="text-center p-4">Carregando histórico...</p>';
    emptyState.classList.add('hidden');
    document.getElementById('tab-historico').click();
    modal.classList.remove('hidden');
    const visitas = await getVisitas(id);
    visitasList.innerHTML = '';
    if (visitas.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        visitas.sort((a, b) => new Date(b.DataVisita) - new Date(a.DataVisita));
        visitas.forEach(visita => {
            const dataFormatada = new Date(visita.DataVisita).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const visitaEl = document.createElement('div');
            visitaEl.className = 'p-4 border rounded-md shadow-sm bg-gray-50';
            visitaEl.innerHTML = `<p class="font-bold text-gray-800">${dataFormatada}</p><div class="mt-2"><p class="font-semibold text-gray-700">Peixes Capturados:</p><p class="text-gray-600 whitespace-pre-wrap">${visita.PeixesCapturados || 'N/A'}</p></div><div class="mt-2"><p class="font-semibold text-gray-700">Observações:</p><p class="text-gray-600 whitespace-pre-wrap">${visita.Observacoes || 'N/A'}</p></div>`;
            visitasList.appendChild(visitaEl);
        });
    }
}

function hideModal() {
    document.getElementById('modal').classList.add('hidden');
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
    hideConfirmDeleteModal();
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
        if (!response.ok) throw new Error('Falha na resposta da rede');
        const data = await response.json();
        if (data && data.length > 0) return { lat: data[0].lat, lon: data[0].lon };
        return null;
    } catch (error) {
        console.error("Erro ao buscar coordenadas:", error);
        return null;
    }
}

async function handleVisitaFormSubmit(e) {
    e.preventDefault();
    showLoading(true);
    const form = e.target;
    const formData = new FormData(form);
    const visitaData = Object.fromEntries(formData.entries());
    const response = await createVisita(visitaData);
    alert(response.message);
    if (response.status === 'success') {
        const pesqueiro = todosOsPesqueiros.find(p => p.ID == visitaData.PesqueiroID);
        form.reset();
        await showDetailsModal(visitaData.PesqueiroID, pesqueiro.NomePesqueiro);
    }
    showLoading(false);
}

document.addEventListener('DOMContentLoaded', initUI);