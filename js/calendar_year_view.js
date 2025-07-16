// js/calendar_year_view.js

/**
 * Inicializa o FullCalendar na div #year-calendar com os eventos fornecidos.
 * @param {Array} visitas - Um array de objetos de visita, já carregado da API.
 */
function initYearCalendar(visitas) {
    console.log("--- INICIANDO CALENDÁRIO ANUAL (VERSÃO MULTI-MÊS) ---");
    const calendarEl = document.getElementById('year-calendar');
    const loaderEl = document.getElementById('year-calendar-loading');

    if (!calendarEl || !loaderEl) {
        console.error("DEBUG: Elementos do calendário anual não encontrados.");
        return;
    }

    // Se o calendário já foi renderizado antes, destrói a instância antiga
    if (calendarEl.fullCalendar) {
        calendarEl.fullCalendar('destroy');
    }

    const events = formatVisitsForYearCalendar(visitas);
    console.log("DEBUG: Eventos para calendário anual formatados.", events);

    // Esconde o loader e torna o container do calendário visível
    if (loaderEl) loaderEl.classList.add('hidden');
    calendarEl.style.visibility = 'visible';

    // Usamos um pequeno timeout para garantir que o DOM está pronto
    setTimeout(() => {
        try {
            const calendar = new FullCalendar.Calendar(calendarEl, {
                locale: 'pt-br',

                // --- CONFIGURAÇÃO CORRIGIDA PARA VISÃO ANUAL ---
                initialView: 'multiMonthYear', // Comando para mostrar o ano inteiro
                multiMonthMaxColumns: 3,       // Organiza os meses em 3 colunas (4 linhas x 3 colunas)

                // Cabeçalho ajustado para a navegação anual
                headerToolbar: {
                    left: 'prevYear,nextYear today', // Botões para navegar ano a ano e voltar para o dia de hoje
                    center: 'title',                 // Mostra o ano atual no centro (Ex: "2025")
                    right: 'multiMonthYear,listYear'   // Botão para alternar entre a visão de grade e lista anual
                },
                // --- FIM DA CORREÇÃO ---

                events: events,
                eventClick: function(info) {
                    // Monta uma mensagem com os detalhes da visita para exibir num alerta
                    const detalhes = `Pesqueiro: ${info.event.title}\n` +
                                    `Data: ${info.event.start.toLocaleDateString('pt-BR')}\n` +
                                    `Peixes: ${info.event.extendedProps.peixes || 'Não registrado.'}\n` +
                                    `Observações: ${info.event.extendedProps.observacoes || 'Nenhuma.'}`;
                    alert(detalhes);
                },
                eventDidMount: function(info) {
                    // Adiciona um "tooltip" (dica) ao passar o mouse sobre um evento
                    info.el.title = `Clique para ver detalhes da visita ao ${info.event.title}`;
                }
            });

            calendar.render();
            console.log("--- CALENDÁRIO ANUAL MULTI-MÊS RENDERIZADO COM SUCESSO ---");

        } catch (e) {
            console.error("ERRO CRÍTICO AO RENDERIZAR O FULLCALENDAR:", e);
            if (loaderEl) {
                loaderEl.classList.remove('hidden');
                loaderEl.textContent = `Erro ao renderizar o calendário: ${e.message}`;
            }
        }
    }, 0);
}

/**
 * Formata os dados das visitas para o formato que o FullCalendar entende.
 * @param {Array} visitas - O array de objetos de visita.
 * @returns {Array} Um array de eventos para o FullCalendar.
 */
function formatVisitsForYearCalendar(visitas) {
    if (!visitas || !Array.isArray(visitas)) {
        return [];
    }
    return visitas.map(visita => {
        // Garante que o nome do pesqueiro existe
        const pesqueiroNome = todosOsPesqueiros.find(p => p.ID == visita.PesqueiroID)?.NomePesqueiro || 'Visita';
        return {
            title: pesqueiroNome,
            start: visita.DataVisita,
            allDay: true,
            extendedProps: {
                observacoes: visita.Observacoes,
                peixes: visita.PeixesCapturados
            }
        };
    });
}