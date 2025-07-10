// js/wishlist.js

// Funções para exibir/ocultar o spinner de carregamento (copiadas de ui.js para serem independentes)
function showLoading() {
    document.getElementById('loader')?.classList.remove('hidden');
    console.log("DEBUG: showLoading (wishlist.js) - Loader visível.");
}

function hideLoading() {
    const loaderEl = document.getElementById('loader');
    if (loaderEl) {
        loaderEl.classList.add('hidden');
        console.log("DEBUG: hideLoading (wishlist.js) - Classe 'hidden' adicionada ao loader.");
    } else {
        console.error("DEBUG: hideLoading (wishlist.js) - Elemento #loader não encontrado!");
    }
}

// Variável para guardar o ID do item a ser deletado no modal de confirmação
let wishlistItemIdToDelete = null;

document.addEventListener('DOMContentLoaded', initWishlistUI);

async function initWishlistUI() {
    console.log("--- INICIANDO DEBUG WISHLIST UI ---");
    showLoading();
    try {
        await renderWishlist(); // Renderiza a lista de itens ao carregar
        setupWishlistEventListeners(); // Configura os listeners
    } catch (error) {
        console.error("ERRO FATAL NA INICIALIZAÇÃO DA WISHLIST:", error);
        document.getElementById('wishlist-container').innerHTML = `<p class="text-red-500 text-center">Erro ao carregar a wishlist: ${error.message}</p>`;
    } finally {
        hideLoading();
        console.log("--- FIM DO DEBUG WISHLIST UI ---");
    }
}

async function renderWishlist() {
    console.log("DEBUG: renderWishlist - Renderizando itens da wishlist.");
    const wishlistContainer = document.getElementById('wishlist-container');
    const loadingState = document.getElementById('wishlist-loading');
    const emptyState = document.getElementById('wishlist-empty-state');

    if (!wishlistContainer || !loadingState || !emptyState) {
        console.error("DEBUG: renderWishlist - Elementos da wishlist (container, loading, empty) não encontrados.");
        return;
    }

    loadingState.classList.remove('hidden'); // Mostra o "Carregando"
    emptyState.classList.add('hidden'); // Esconde o "Vazio"
    wishlistContainer.innerHTML = ''; // Limpa qualquer conteúdo anterior

    try {
        const items = await getAllWishlistItems(); // Chama a função da API
        console.log("DEBUG: Itens da Wishlist carregados:", items);

        loadingState.classList.add('hidden'); // Esconde o "Carregando"

        if (items && items.length > 0) {
            items.sort((a, b) => { // Opcional: Ordenar por prioridade (Alta, Média, Baixa)
                const priorityOrder = { 'Alta': 1, 'Média': 2, 'Baixa': 3 };
                return (priorityOrder[a.Prioridade] || 99) - (priorityOrder[b.Prioridade] || 99);
            });

            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'wishlist-item shadow';
                itemDiv.setAttribute('data-id', item.ID);
                itemDiv.innerHTML = `
                    <div class="wishlist-item-header">
                        <h3 class="text-lg font-bold text-blue-700">${item.NomeItem || 'Item Sem Nome'}</h3>
                        <div class="wishlist-item-actions">
                            <button class="btn-edit-wishlist bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm">Editar</button>
                            <button class="btn-delete-wishlist bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm">Remover</button>
                        </div>
                    </div>
                    <div class="wishlist-item-details">
                        <p><strong>Categoria:</strong> ${item.Categoria || 'N/A'}</p>
                        <p><strong>Tipo de Pesca:</strong> ${item.TipoPesca || 'N/A'}</p>
                        <p><strong>Marca/Modelo:</strong> ${item.MarcaModelo || 'N/A'}</p>
                        <p><strong>Especificações:</strong> ${item.Especificacoes || 'N/A'}</p>
                        <p><strong>Preço Estimado:</strong> R$ ${item.PrecoEstimado ? parseFloat(item.PrecoEstimado).toFixed(2).replace('.', ',') : 'N/A'}</p>
                        <p><strong>Link para Compra:</strong> ${item.LinkCompra ? `<a href="${item.LinkCompra}" target="_blank" class="text-blue-500 hover:underline">Abrir Link</a>` : 'N/A'}</p>
                        <p><strong>Prioridade:</strong> <span class="font-bold ${item.Prioridade === 'Alta' ? 'text-red-600' : item.Prioridade === 'Média' ? 'text-yellow-600' : 'text-gray-600'}">${item.Prioridade || 'N/A'}</span></p>
                        <p><strong>Status:</strong> <span class="font-bold ${item.Status === 'Já comprei' || item.Status === 'Ganhei' ? 'text-green-600' : 'text-orange-600'}">${item.Status || 'N/A'}</span></p>
                        <p><strong>Notas Pessoais:</strong> ${item.NotasPessoais || 'N/A'}</p>
                        <p class="text-xs text-gray-400">Adicionado em: ${item.DataAdicionado || 'N/A'}</p>
                        ${item.PesqueiroID ? `<p class="text-xs text-gray-400">ID Pesqueiro Associado: ${item.PesqueiroID}</p>` : ''}
                    </div>
                `;
                wishlistContainer.appendChild(itemDiv);
            });

        } else {
            emptyState.classList.remove('hidden'); // Mostra o "Vazio"
        }
    } catch (error) {
        console.error("DEBUG: Falha ao renderizar a wishlist:", error);
        loadingState.classList.add('hidden');
        wishlistContainer.innerHTML = `<p class="text-red-500 text-center">Erro ao carregar a wishlist: ${error.message}</p>`;
    }
}

function setupWishlistEventListeners() {
    console.log("DEBUG: setupWishlistEventListeners - Configurando listeners de eventos da wishlist.");
    const addBtn = document.getElementById('add-wishlist-item-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showWishlistItemModal());
    }

    const modal = document.getElementById('wishlist-modal');
    if (modal) {
        // Fechar modal ao clicar no X
        const closeBtn = modal.querySelector('.wishlist-modal-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        // Fechar modal ao clicar fora
        const modalBg = modal.querySelector('.modal-bg');
        if (modalBg) modalBg.addEventListener('click', () => modal.classList.add('hidden'));
    }

    const form = document.getElementById('wishlist-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            // Converte preço para número float
            if (data.PrecoEstimado) {
                data.PrecoEstimado = parseFloat(data.PrecoEstimado).toFixed(2);
            }

            let result;
            if (data.ID) { // Se tem ID, é uma atualização
                console.log("DEBUG: Atualizando item da wishlist:", data);
                result = await updateWishlistItem(data);
            } else { // Senão, é um novo item
                console.log("DEBUG: Criando novo item na wishlist:", data);
                result = await createWishlistItem(data);
            }
            hideLoading();
            modal.classList.add('hidden'); // Esconde o modal
            if (result.status === 'success') {
                alert('Item da wishlist salvo com sucesso!');
                await renderWishlist(); // Recarrega a lista
            } else {
                alert('Erro ao salvar item da wishlist: ' + (result.message || 'Erro desconhecido.'));
                console.error("Erro ao salvar item da wishlist:", result);
            }
        });
    }

    // Listener para botões de editar e remover na lista de itens
    const wishlistContainer = document.getElementById('wishlist-container');
    if (wishlistContainer) {
        wishlistContainer.addEventListener('click', async (e) => {
            const target = e.target;
            const itemDiv = target.closest('.wishlist-item');
            if (!itemDiv) return; // Não clicou em um item válido

            const itemId = itemDiv.dataset.id;
            if (!itemId) return;

            if (target.classList.contains('btn-edit-wishlist')) {
                const items = await getAllWishlistItems(); // Pega a lista atualizada
                const itemToEdit = items.find(item => item.ID === itemId);
                if (itemToEdit) {
                    showWishlistItemModal(itemToEdit);
                } else {
                    alert('Item não encontrado para edição.');
                }
            } else if (target.classList.contains('btn-delete-wishlist')) {
                // Abre modal de confirmação
                showConfirmDeleteWishlistModal(itemId, itemDiv.querySelector('h3').textContent);
            }
        });
    }

    // Listeners do modal de confirmação de exclusão
    document.getElementById('btn-cancel-delete-wishlist')?.addEventListener('click', () => {
        document.getElementById('confirm-delete-wishlist-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-confirm-delete-wishlist')?.addEventListener('click', async () => {
        showLoading();
        console.log(`DEBUG: Excluindo item da wishlist com ID: ${wishlistItemIdToDelete}`);
        const result = await deleteWishlistItem(wishlistItemIdToDelete);
        hideLoading();
        document.getElementById('confirm-delete-wishlist-modal')?.classList.add('hidden');
        if (result.status === 'success') {
            alert('Item da wishlist excluído com sucesso!');
            await renderWishlist(); // Recarrega a lista após a exclusão
        } else {
            alert('Erro ao excluir item da wishlist: ' + (result.message || 'Erro desconhecido.'));
            console.error("DEBUG: Erro ao excluir item da wishlist:", result);
        }
    });
}

/**
 * Abre o modal para adicionar ou editar um item da wishlist.
 * @param {object} itemData (Opcional) Dados do item a ser editado. Se omitido, é um novo item.
 */
function showWishlistItemModal(itemData = null) {
    const modal = document.getElementById('wishlist-modal');
    const modalTitle = document.getElementById('wishlist-modal-title');
    const form = document.getElementById('wishlist-form');

    if (!modal || !modalTitle || !form) {
        console.error("DEBUG: showWishlistItemModal - Elementos do modal/formulário não encontrados.");
        return;
    }

    form.reset(); // Limpa o formulário
    document.getElementById('wishlist-item-id').value = ''; // Limpa o ID oculto

    if (itemData) {
        modalTitle.textContent = 'Editar Item da Wishlist';
        // Preenche o formulário com os dados do item
        for (const key in itemData) {
            const input = document.getElementById(key);
            if (input) {
                // Ajuste para PrecoEstimado se vier com vírgula do Apps Script
                if (key === 'PrecoEstimado' && typeof itemData[key] === 'string' && itemData[key].includes(',')) {
                    input.value = itemData[key].replace(',', '.');
                } else {
                    input.value = itemData[key];
                }
            }
        }
        document.getElementById('wishlist-item-id').value = itemData.ID; // Garante que o ID está no campo oculto
    } else {
        modalTitle.textContent = 'Adicionar Novo Item';
    }
    modal.classList.remove('hidden');
}

/**
 * Abre o modal de confirmação para exclusão de um item da wishlist.
 * @param {string} id O ID do item a ser excluído.
 * @param {string} nome O nome do item para exibição no modal.
 */
function showConfirmDeleteWishlistModal(id, nome) {
    wishlistItemIdToDelete = id;
    const itemToDeleteNameEl = document.getElementById('item-to-delete-name');
    const confirmDeleteModalEl = document.getElementById('confirm-delete-wishlist-modal');

    if (itemToDeleteNameEl && confirmDeleteModalEl) {
        itemToDeleteNameEl.textContent = nome;
        confirmDeleteModalEl.classList.remove('hidden');
    } else {
        console.error("DEBUG: showConfirmDeleteWishlistModal - Elementos do modal de confirmação não encontrados.");
        alert(`Confirmar exclusão de ${nome}? (Erro na UI do modal)`);
    }
}