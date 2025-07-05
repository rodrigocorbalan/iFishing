// ATENÇÃO: Cole aqui a URL do seu App da Web que você copiou do Google Apps Script.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbykUTuZWXGRxCAkJTEMK1uT2knj4Y4I0QFg-DmyVjag3UmCZEYjmt19HeXmT_68dCnc/exec';

/**
 * Busca todos os registros de pesqueiros na planilha.
 * @returns {Promise<Array>} Uma promessa que resolve para um array de objetos de pesqueiros.
 */
async function getPesqueiros() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=readAll`);
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Falha ao buscar pesqueiros:", error);
        return []; // Retorna um array vazio em caso de erro
    }
}

/**
 * Envia uma requisição POST para o Apps Script para criar, atualizar ou deletar um registro.
 * @param {string} action - A ação a ser executada ('create', 'update', 'delete').
 * @param {object} data - O objeto com os dados para a ação.
 * @returns {Promise<object>} A resposta do servidor.
 */
async function postData(action, data) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors', // Necessário para requisições entre diferentes origens
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Apps Script espera text/plain para o corpo do post
            },
            body: JSON.stringify({ action, data }), // O corpo da requisição
        });
        
        if (!response.ok) {
            throw new Error(`Erro na requisição POST: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Falha na ação '${action}':`, error);
        return { status: 'error', message: error.message };
    }
}

// Funções específicas para cada ação (Criar, Atualizar, Deletar)
// Elas usam a função genérica postData.

/**
 * Cadastra um novo pesqueiro.
 * @param {object} pesqueiroData - Os dados do novo pesqueiro.
 */
function createPesqueiro(pesqueiroData) {
    return postData('create', pesqueiroData);
}

/**
 * Atualiza um pesqueiro existente.
 * @param {object} pesqueiroData - Os dados do pesqueiro a serem atualizados (deve incluir o ID).
 */
function updatePesqueiro(pesqueiroData) {
    return postData('update', pesqueiroData);
}

/**
 * "Deleta" um pesqueiro (marcando-o como inativo).
 * @param {string} id - O ID do pesqueiro a ser deletado.
 */
function deletePesqueiro(id) {
    return postData('delete', { ID: id });
}