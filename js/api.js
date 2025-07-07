// ATENÇÃO: Verifique se esta URL é a correta da sua implantação do Apps Script.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzeNSPQSZj3kEtcfpKIobRscIMZWSq5RM-dtQT3vRzZ4iOVRNk-Geb_58Df5D_T1lL4/exec';

// --- FUNÇÕES PARA PESQUEIROS ---

/**
 * Busca todos os registros de pesqueiros na planilha.
 */
async function getPesqueiros() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=readAll`);
        if (!response.ok) throw new Error(`Erro na requisição: ${response.statusText}`);
        const data = await response.json();
        // Filtra para não mostrar pesqueiros marcados como inativos, se houver
        return data.filter(p => p.Ativo !== 'NAO');
    } catch (error) {
        console.error("Falha ao buscar pesqueiros:", error);
        return [];
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
        return await response.json();
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
        return await response.json();
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