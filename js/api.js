// ATENÇÃO: Verifique se esta URL é a correta da sua implantação do Apps Script.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyHMVnuGn8qpAgrQtS67ApKeQV1T7hdMMSKqLlk1ECbtbI7ZKt5_BUpExcwtbDE_3dD/exec'; //

// --- FUNÇÕES PARA PESQUEIROS ---

/**
 * Busca todos os registros de pesqueiros na planilha.
 */
async function getPesqueiros() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=readAll`);
        if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
        const data = await response.json();
        // Verifica se a resposta contém um erro retornado pelo Apps Script
        if (data.error) {
            console.error("Erro retornado pelo Apps Script ao buscar pesqueiros:", data.error);
            return []; // Retorna um array vazio em caso de erro da API
        }
        // Filtra para não mostrar pesqueiros marcados como inativos, se houver
        // Garante que 'data' é um array antes de chamar .filter()
        return Array.isArray(data) ? data.filter(p => p.Ativo !== 'NAO') : [];
    } catch (error) {
        console.error("Falha ao buscar pesqueiros:", error);
        return []; // Retorna um array vazio em caso de falha na requisição
    }
}

function createPesqueiro(data) { return postData('create', data); }
function updatePesqueiro(data) { return postData('update', data); }
function deletePesqueiro(id) { return postData('delete', { ID: id }); }


// --- FUNÇÕES PARA VISITAS ---

/**
 * Busca todas as visitas de um pesqueiro específico.
 * @param {string} pesqueiroId O ID do pesqueiro.
 */
async function getVisitas(pesqueiroId) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=readVisitas&pesqueiroId=${pesqueiroId}`);
        if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
        const data = await response.json();
        // Verifica se a resposta contém um erro retornado pelo Apps Script
        if (data.error) {
            console.error("Erro retornado pelo Apps Script ao buscar visitas:", data.error);
            return []; // Retorna um array vazio em caso de erro da API
        }
        return Array.isArray(data) ? data : []; // Garante que retorna um array
    } catch (error) {
        console.error("Falha ao buscar visitas:", error);
        return [];
    }
}

/**
 * Cria um novo registro de visita.
 * @param {object} visitaData Os dados da nova visita.
 */
function createVisita(visitaData) {
    return postData('createVisita', visitaData);
}

/**
 * Busca todas as visitas de todos os pesqueiros (para o calendário/timeline).
 */
async function getAllVisitas() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=readAllVisitas`);
        if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
        const data = await response.json();
        // Verifica se a resposta contém um erro retornado pelo Apps Script
        if (data.error) {
            console.error("Erro retornado pelo Apps Script ao buscar todas as visitas:", data.error);
            return []; // Retorna um array vazio em caso de erro da API
        }
        return Array.isArray(data) ? data : []; // Garante que retorna um array
    } catch (error) {
        console.error("Falha ao buscar todas as visitas:", error);
        return [];
    }
}


// --- FUNÇÃO AUXILIAR DE ENVIO ---

/**
 * Envia uma requisição POST para o Apps Script.
 */
async function postData(action, data) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, data }),
        });
        if (!response.ok) throw new Error(`Erro na requisição POST: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`Falha na ação '${action}':`, error);
        return { status: 'error', message: error.message };
    }
}


// --- FUNÇÕES PARA WISHLIST ---

/**
 * Adiciona um novo item à wishlist.
 * @param {object} itemData Os dados do novo item (ex: { NomeItem: '...', Categoria: '...' }).
 */
function createWishlistItem(itemData) {
    return postData('createWishlistItem', itemData);
}

/**
 * Busca todos os itens da wishlist.
 */
async function getAllWishlistItems() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=readAllWishlistItems`);
        if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
        const data = await response.json();
        // Verifica se a resposta contém um erro retornado pelo Apps Script
        if (data.error) {
            console.error("Erro retornado pelo Apps Script ao buscar itens da wishlist:", data.error);
            return []; // Retorna um array vazio em caso de erro da API
        }
        return Array.isArray(data) ? data : []; // Garante que retorna um array
    } catch (error) {
        console.error("Falha ao buscar itens da wishlist:", error);
        return [];
    }
}

/**
 * Atualiza um item existente na wishlist.
 * @param {object} itemData Os dados atualizados do item, incluindo o ID.
 */
function updateWishlistItem(itemData) {
    return postData('updateWishlistItem', itemData);
}

/**
 * Remove um item da wishlist.
 * @param {string} itemId O ID do item a ser removido.
 */
function deleteWishlistItem(itemId) {
    return postData('deleteWishlistItem', { ID: itemId });
}